package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
)

type tokenBuckets struct {
	input      int64
	output     int64
	cacheRead  int64
	cacheWrite int64
	reasoning  int64
}

type usageEvent struct {
	ts       time.Time
	agent    string
	provider string
	model    string
	tokens   tokenBuckets
}

type parserStats struct {
	Agent            string `json:"agent"`
	DurationMs       int64  `json:"durationMs"`
	Files            int    `json:"files"`
	Bytes            int64  `json:"bytes"`
	Events           int    `json:"events"`
	InputTokens      int64  `json:"inputTokens"`
	OutputTokens     int64  `json:"outputTokens"`
	CacheReadTokens  int64  `json:"cacheReadTokens"`
	CacheWriteTokens int64  `json:"cacheWriteTokens"`
	ReasoningTokens  int64  `json:"reasoningTokens"`
}

type measureResult struct {
	Agents     []string      `json:"agents"`
	EventCount int           `json:"eventCount"`
	Stats      []parserStats `json:"stats"`
}

type ingestRow struct {
	Date             string  `json:"date"`
	Agent            string  `json:"agent"`
	Provider         string  `json:"provider"`
	Model            string  `json:"model"`
	InputTokens      int64   `json:"inputTokens"`
	OutputTokens     int64   `json:"outputTokens"`
	CacheReadTokens  int64   `json:"cacheReadTokens"`
	CacheWriteTokens int64   `json:"cacheWriteTokens"`
	ReasoningTokens  int64   `json:"reasoningTokens"`
	TotalTokens      int64   `json:"totalTokens"`
	CostUsd          *string `json:"costUsd"`
	Messages         int64   `json:"messages"`
}

type collectResult struct {
	Agents     []string
	EventCount int
	Stats      []parserStats
	Rows       []ingestRow
}

func collect(home string) (*collectResult, error) {
	loc := time.Local
	groups := map[string]*ingestRow{}
	out := &collectResult{}

	emit := func(event usageEvent) {
		if event.ts.IsZero() || event.model == "" {
			return
		}
		provider := event.provider
		if provider == "" {
			provider = providerForAgent(event.agent)
		}
		date := event.ts.In(loc).Format("2006-01-02")
		key := date + "|" + event.agent + "|" + provider + "|" + event.model
		row := groups[key]
		if row == nil {
			row = &ingestRow{
				Date:     date,
				Agent:    event.agent,
				Provider: provider,
				Model:    event.model,
			}
			groups[key] = row
		}
		row.InputTokens += event.tokens.input
		row.OutputTokens += event.tokens.output
		row.CacheReadTokens += event.tokens.cacheRead
		row.CacheWriteTokens += event.tokens.cacheWrite
		row.ReasoningTokens += event.tokens.reasoning
		row.Messages++
	}

	parsers := []struct {
		name string
		run  func(home string, emit func(usageEvent)) (parserStats, bool, error)
	}{
		{"claude", parseClaude},
		{"codex", parseCodex},
		{"opencode", parseOpenCode},
		{"cursor", parseCursor},
	}

	for _, parser := range parsers {
		stats, detected, err := parser.run(home, emit)
		if err != nil {
			return nil, fmt.Errorf("%s: %w", parser.name, err)
		}
		if !detected {
			continue
		}
		out.Agents = append(out.Agents, stats.Agent)
		out.EventCount += stats.Events
		out.Stats = append(out.Stats, stats)
	}

	out.Rows = make([]ingestRow, 0, len(groups))
	for _, row := range groups {
		row.TotalTokens = row.InputTokens + row.OutputTokens + row.CacheReadTokens + row.CacheWriteTokens + row.ReasoningTokens
		out.Rows = append(out.Rows, *row)
	}
	return out, nil
}

func providerForAgent(agent string) string {
	switch agent {
	case "claude":
		return "anthropic"
	case "codex":
		return "openai"
	default:
		return agent
	}
}

func finish(agent string, started time.Time, files int, bytes int64, events int, buckets tokenBuckets) parserStats {
	return parserStats{
		Agent:            agent,
		DurationMs:       time.Since(started).Milliseconds(),
		Files:            files,
		Bytes:            bytes,
		Events:           events,
		InputTokens:      buckets.input,
		OutputTokens:     buckets.output,
		CacheReadTokens:  buckets.cacheRead,
		CacheWriteTokens: buckets.cacheWrite,
		ReasoningTokens:  buckets.reasoning,
	}
}

func encodeJSON(w io.Writer, value any) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(value)
}

func printTable(stats []parserStats) {
	headers := []string{"agent", "ms", "files", "bytes", "events", "input", "output", "cacheRead", "cacheWrite", "reasoning"}
	rows := make([][]string, 0, len(stats))
	for _, row := range stats {
		rows = append(rows, []string{
			row.Agent,
			fmt.Sprintf("%d", row.DurationMs),
			fmt.Sprintf("%d", row.Files),
			fmt.Sprintf("%d", row.Bytes),
			fmt.Sprintf("%d", row.Events),
			fmt.Sprintf("%d", row.InputTokens),
			fmt.Sprintf("%d", row.OutputTokens),
			fmt.Sprintf("%d", row.CacheReadTokens),
			fmt.Sprintf("%d", row.CacheWriteTokens),
			fmt.Sprintf("%d", row.ReasoningTokens),
		})
	}
	widths := make([]int, len(headers))
	for i, header := range headers {
		widths[i] = len(header)
		for _, row := range rows {
			if len(row[i]) > widths[i] {
				widths[i] = len(row[i])
			}
		}
	}
	line := func(cells []string) string {
		parts := make([]string, len(cells))
		for i, cell := range cells {
			parts[i] = fmt.Sprintf("%-*s", widths[i], cell)
		}
		return strings.Join(parts, "  ")
	}
	fmt.Println(line(headers))
	for _, row := range rows {
		fmt.Println(line(row))
	}
}

func deref(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func getenv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
