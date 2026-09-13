package main

import (
	"bufio"
	"bytes"
	"database/sql"
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func parseClaude(home string, emit func(usageEvent)) (parserStats, bool, error) {
	roots := []string{
		filepath.Join(home, ".claude", "projects"),
		filepath.Join(home, ".config", "claude", "projects"),
		filepath.Join(home, "Library", "Developer", "Xcode", "CodingAssistant", "ClaudeAgentConfig", "projects"),
	}
	if !anyExists(roots) {
		return parserStats{}, false, nil
	}
	started := time.Now()
	files, bytes, err := listJSONLRoots(roots)
	if err != nil {
		return parserStats{}, false, err
	}
	// Streaming writes one line per content block with the same message.id, and
	// usage grows until the final line, so keep the largest value per field.
	seen := map[string]int{}
	var pending []usageEvent
	for _, file := range files {
		err := eachJSONL(file, func(raw []byte) {
			var line claudeLine
			if json.Unmarshal(raw, &line) != nil {
				return
			}
			if line.Message == nil || line.Message.Usage == nil || line.Message.Model == "" || line.Message.Model == "<synthetic>" {
				return
			}
			ts, ok := parseTimestamp(line.Timestamp)
			if !ok {
				return
			}
			u := line.Message.Usage
			tok := tokenBuckets{
				input:      int64(u.InputTokens),
				output:     int64(u.OutputTokens),
				cacheRead:  int64(u.CacheReadInputTokens),
				cacheWrite: int64(u.CacheCreationInputTokens),
			}
			key := firstNonEmpty(line.Message.ID, line.RequestID, line.UUID)
			if key != "" {
				if i, dup := seen[key]; dup {
					pending[i].tokens.keepMax(tok)
					return
				}
				seen[key] = len(pending)
			}
			pending = append(pending, usageEvent{ts: ts, agent: "claude", model: line.Message.Model, tokens: tok})
		})
		if err != nil {
			return parserStats{}, false, err
		}
	}
	var buckets tokenBuckets
	for _, event := range pending {
		buckets.add(event.tokens)
		emit(event)
	}
	return finish("claude", started, len(files), bytes, len(pending), buckets), true, nil
}

func parseCodex(home string, emit func(usageEvent)) (parserStats, bool, error) {
	roots := []string{
		filepath.Join(home, ".codex", "sessions"),
		filepath.Join(home, ".codex", "archived_sessions"),
		filepath.Join(home, "Library", "Developer", "Xcode", "CodingAssistant", "codex", "sessions"),
	}
	if !anyExists(roots) {
		return parserStats{}, false, nil
	}
	started := time.Now()
	files, bytes, err := listJSONLRoots(roots)
	if err != nil {
		return parserStats{}, false, err
	}
	var buckets tokenBuckets
	events := 0
	for _, file := range files {
		currentModel := ""
		firstModel := ""
		var prevTotal *codexTokenUsage
		var fileEvents []usageEvent
		err := eachJSONL(file, func(raw []byte) {
			var line codexLine
			if json.Unmarshal(raw, &line) != nil {
				return
			}
			if line.Payload == nil {
				return
			}
			if line.Payload.Model != "" {
				currentModel = line.Payload.Model
				if firstModel == "" {
					firstModel = currentModel
				}
			}
			if line.Payload.Type != "token_count" || line.Payload.Info == nil || line.Payload.Info.LastTokenUsage == nil {
				return
			}
			// Codex re-emits token_count without a new turn (the cumulative total is
			// unchanged); counting last_token_usage again would double it.
			if total := line.Payload.Info.TotalTokenUsage; total != nil {
				if prevTotal != nil && *total == *prevTotal {
					return
				}
				prevTotal = total
			}
			ts, ok := parseTimestamp(line.Timestamp)
			if !ok {
				return
			}
			u := line.Payload.Info.LastTokenUsage
			cached := int64(u.CachedInputTokens)
			reasoning := int64(u.ReasoningOutputTokens)
			input := int64(u.InputTokens) - cached
			if input < 0 {
				input = 0
			}
			output := int64(u.OutputTokens) - reasoning
			if output < 0 {
				output = 0
			}
			tok := tokenBuckets{input: input, output: output, cacheRead: cached, reasoning: reasoning}
			fileEvents = append(fileEvents, usageEvent{ts: ts, agent: "codex", model: currentModel, tokens: tok})
		})
		if err != nil {
			return parserStats{}, false, err
		}
		// token_count can precede the first turn_context, so attribute those
		// events to the session's first model.
		if firstModel == "" {
			firstModel = "unknown"
		}
		for _, event := range fileEvents {
			if event.model == "" {
				event.model = firstModel
			}
			events++
			buckets.add(event.tokens)
			emit(event)
		}
	}
	return finish("codex", started, len(files), bytes, events, buckets), true, nil
}

func parseOpenCode(home string, emit func(usageEvent)) (parserStats, bool, error) {
	dataHome := os.Getenv("XDG_DATA_HOME")
	if dataHome == "" {
		dataHome = filepath.Join(home, ".local", "share")
	}
	path := filepath.Join(dataHome, "opencode", "opencode.db")
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return parserStats{}, false, nil
		}
		return parserStats{}, false, err
	}
	started := time.Now()
	db, err := sql.Open("sqlite", "file:"+filepath.ToSlash(path)+"?mode=ro")
	if err != nil {
		return parserStats{}, false, err
	}
	defer db.Close()

	rows, err := db.Query("SELECT data FROM message")
	if err != nil {
		return parserStats{}, false, err
	}
	defer rows.Close()

	var buckets tokenBuckets
	events := 0
	for rows.Next() {
		var raw sql.NullString
		if err := rows.Scan(&raw); err != nil {
			return parserStats{}, false, err
		}
		if !raw.Valid || raw.String == "" {
			continue
		}
		var msg openCodeMessage
		if json.Unmarshal([]byte(raw.String), &msg) != nil {
			continue
		}
		if msg.Role != "assistant" || msg.Tokens == nil || msg.Time == nil || msg.Time.Created == nil {
			continue
		}
		output := int64(deref(msg.Tokens.Output))
		reasoning := int64(deref(msg.Tokens.Reasoning))
		if output < reasoning {
			output = 0
		} else {
			output -= reasoning
		}
		tok := tokenBuckets{
			input:      int64(deref(msg.Tokens.Input)),
			output:     output,
			cacheRead:  int64(derefCache(msg.Tokens.Cache, true)),
			cacheWrite: int64(derefCache(msg.Tokens.Cache, false)),
			reasoning:  reasoning,
		}
		provider := "unknown"
		if msg.ProviderID != "" {
			provider = msg.ProviderID
		}
		model := "unknown"
		if msg.ModelID != "" {
			model = msg.ModelID
		}
		events++
		buckets.add(tok)
		emit(usageEvent{
			ts:       time.UnixMilli(int64(*msg.Time.Created)).UTC(),
			agent:    "opencode",
			provider: provider,
			model:    model,
			tokens:   tok,
		})
	}
	if err := rows.Err(); err != nil {
		return parserStats{}, false, err
	}
	return finish("opencode", started, 1, info.Size(), events, buckets), true, nil
}

func derefCache(cache *openCodeCache, read bool) float64 {
	if cache == nil {
		return 0
	}
	if read {
		return deref(cache.Read)
	}
	return deref(cache.Write)
}

type claudeLine struct {
	Timestamp string `json:"timestamp"`
	RequestID string `json:"requestId"`
	UUID      string `json:"uuid"`
	Message   *struct {
		ID    string `json:"id"`
		Model string `json:"model"`
		Usage *struct {
			InputTokens              float64 `json:"input_tokens"`
			OutputTokens             float64 `json:"output_tokens"`
			CacheCreationInputTokens float64 `json:"cache_creation_input_tokens"`
			CacheReadInputTokens     float64 `json:"cache_read_input_tokens"`
		} `json:"usage"`
	} `json:"message"`
}

type codexTokenUsage struct {
	InputTokens           float64 `json:"input_tokens"`
	CachedInputTokens     float64 `json:"cached_input_tokens"`
	OutputTokens          float64 `json:"output_tokens"`
	ReasoningOutputTokens float64 `json:"reasoning_output_tokens"`
}

type codexLine struct {
	Timestamp string `json:"timestamp"`
	Payload   *struct {
		Type  string `json:"type"`
		Model string `json:"model"`
		Info  *struct {
			LastTokenUsage  *codexTokenUsage `json:"last_token_usage"`
			TotalTokenUsage *codexTokenUsage `json:"total_token_usage"`
		} `json:"info"`
	} `json:"payload"`
}

type openCodeCache struct {
	Read  *float64 `json:"read"`
	Write *float64 `json:"write"`
}

type openCodeMessage struct {
	Role       string `json:"role"`
	ProviderID string `json:"providerID"`
	ModelID    string `json:"modelID"`
	Time       *struct {
		Created *float64 `json:"created"`
	} `json:"time"`
	Tokens *struct {
		Input     *float64       `json:"input"`
		Output    *float64       `json:"output"`
		Reasoning *float64       `json:"reasoning"`
		Cache     *openCodeCache `json:"cache"`
	} `json:"tokens"`
}

func (b *tokenBuckets) add(other tokenBuckets) {
	b.input += other.input
	b.output += other.output
	b.cacheRead += other.cacheRead
	b.cacheWrite += other.cacheWrite
	b.reasoning += other.reasoning
}

func (b *tokenBuckets) keepMax(other tokenBuckets) {
	b.input = max(b.input, other.input)
	b.output = max(b.output, other.output)
	b.cacheRead = max(b.cacheRead, other.cacheRead)
	b.cacheWrite = max(b.cacheWrite, other.cacheWrite)
	b.reasoning = max(b.reasoning, other.reasoning)
}

func anyExists(paths []string) bool {
	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			return true
		}
	}
	return false
}

func listJSONLRoots(roots []string) ([]string, int64, error) {
	var files []string
	var bytes int64
	for _, root := range roots {
		found, size, err := listJSONL(root)
		if err != nil {
			return nil, 0, err
		}
		files = append(files, found...)
		bytes += size
	}
	return files, bytes, nil
}

func listJSONL(root string) ([]string, int64, error) {
	var files []string
	var total int64
	err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			if os.IsNotExist(err) || os.IsPermission(err) {
				return nil
			}
			return err
		}
		if d.IsDir() || !strings.HasSuffix(d.Name(), ".jsonl") {
			return nil
		}
		info, statErr := d.Info()
		if statErr != nil || !info.Mode().IsRegular() {
			return nil
		}
		files = append(files, path)
		total += info.Size()
		return nil
	})
	if err != nil && os.IsNotExist(err) {
		return nil, 0, nil
	}
	return files, total, err
}

func eachJSONL(path string, fn func([]byte)) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 1024*1024), 32*1024*1024)
	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}
		fn(line)
	}
	return scanner.Err()
}

func parseTimestamp(value string) (time.Time, bool) {
	if value == "" {
		return time.Time{}, false
	}
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if ts, err := time.Parse(layout, value); err == nil {
			return ts, true
		}
	}
	return time.Time{}, false
}
