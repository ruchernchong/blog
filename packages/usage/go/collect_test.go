package main

import (
	"encoding/json"
	"slices"
	"strings"
	"testing"
	"time"
)

func withLocal(t *testing.T, loc *time.Location) {
	t.Helper()
	prev := time.Local
	time.Local = loc
	t.Cleanup(func() { time.Local = prev })
}

func rowsByKey(rows []ingestRow) map[string]ingestRow {
	out := make(map[string]ingestRow, len(rows))
	for _, row := range rows {
		out[row.Date+"|"+row.Agent+"|"+row.Provider+"|"+row.Model] = row
	}
	return out
}

func assertRows(t *testing.T, rows []ingestRow, want []ingestRow) {
	t.Helper()
	got := rowsByKey(rows)
	if len(rows) != len(want) {
		t.Errorf("got %d rows, want %d: %+v", len(rows), len(want), rows)
	}
	for _, w := range want {
		key := w.Date + "|" + w.Agent + "|" + w.Provider + "|" + w.Model
		g, ok := got[key]
		if !ok {
			t.Errorf("missing row %s", key)
			continue
		}
		if g != w {
			t.Errorf("row %s = %+v, want %+v", key, g, w)
		}
	}
}

func TestCollectDayBucketing(t *testing.T) {
	tests := []struct {
		name string
		loc  *time.Location
		want []ingestRow
	}{
		{
			name: "UTC",
			loc:  time.UTC,
			want: []ingestRow{
				{Date: "2026-09-12", Agent: "claude", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 110, OutputTokens: 55, CacheReadTokens: 1000, CacheWriteTokens: 200, TotalTokens: 1365, Messages: 2},
				{Date: "2026-09-13", Agent: "claude", Provider: "anthropic", Model: "claude-opus-4-1", InputTokens: 1, OutputTokens: 2, CacheReadTokens: 3, CacheWriteTokens: 4, TotalTokens: 10, Messages: 1},
				{Date: "2026-09-12", Agent: "codex", Provider: "openai", Model: "gpt-5-codex", InputTokens: 204, OutputTokens: 102, CacheReadTokens: 810, ReasoningTokens: 204, TotalTokens: 1320, Messages: 3},
				{Date: "2026-09-11", Agent: "codex", Provider: "openai", Model: "unknown", InputTokens: 7, OutputTokens: 3, TotalTokens: 10, Messages: 1},
			},
		},
		{
			// 15:59:59.999Z is 23:59:59.999 and 16:00Z is 00:00 the next day.
			name: "UTC+8 splits at local midnight",
			loc:  time.FixedZone("SGT", 8*60*60),
			want: []ingestRow{
				{Date: "2026-09-12", Agent: "claude", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 100, OutputTokens: 50, CacheReadTokens: 1000, CacheWriteTokens: 200, TotalTokens: 1350, Messages: 1},
				{Date: "2026-09-13", Agent: "claude", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 10, OutputTokens: 5, TotalTokens: 15, Messages: 1},
				{Date: "2026-09-13", Agent: "claude", Provider: "anthropic", Model: "claude-opus-4-1", InputTokens: 1, OutputTokens: 2, CacheReadTokens: 3, CacheWriteTokens: 4, TotalTokens: 10, Messages: 1},
				{Date: "2026-09-12", Agent: "codex", Provider: "openai", Model: "gpt-5-codex", InputTokens: 204, OutputTokens: 102, CacheReadTokens: 800, ReasoningTokens: 200, TotalTokens: 1306, Messages: 2},
				{Date: "2026-09-13", Agent: "codex", Provider: "openai", Model: "gpt-5-codex", CacheReadTokens: 10, ReasoningTokens: 4, TotalTokens: 14, Messages: 1},
				{Date: "2026-09-11", Agent: "codex", Provider: "openai", Model: "unknown", InputTokens: 7, OutputTokens: 3, TotalTokens: 10, Messages: 1},
			},
		},
		{
			// 01:00Z on the 13th is still the 12th; 10:00Z on the 11th is exactly local midnight.
			name: "UTC-10 pulls events back a day",
			loc:  time.FixedZone("HST", -10*60*60),
			want: []ingestRow{
				{Date: "2026-09-12", Agent: "claude", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 110, OutputTokens: 55, CacheReadTokens: 1000, CacheWriteTokens: 200, TotalTokens: 1365, Messages: 2},
				{Date: "2026-09-12", Agent: "claude", Provider: "anthropic", Model: "claude-opus-4-1", InputTokens: 1, OutputTokens: 2, CacheReadTokens: 3, CacheWriteTokens: 4, TotalTokens: 10, Messages: 1},
				{Date: "2026-09-12", Agent: "codex", Provider: "openai", Model: "gpt-5-codex", InputTokens: 204, OutputTokens: 102, CacheReadTokens: 810, ReasoningTokens: 204, TotalTokens: 1320, Messages: 3},
				{Date: "2026-09-11", Agent: "codex", Provider: "openai", Model: "unknown", InputTokens: 7, OutputTokens: 3, TotalTokens: 10, Messages: 1},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withLocal(t, tt.loc)
			t.Setenv("XDG_DATA_HOME", "")
			home := t.TempDir()
			seedClaude(t, home)
			seedCodex(t, home)

			result, err := collect(home)
			if err != nil {
				t.Fatal(err)
			}
			assertRows(t, result.Rows, tt.want)
		})
	}
}

func TestCollectAggregatesAllAgents(t *testing.T) {
	withLocal(t, time.UTC)
	t.Setenv("XDG_DATA_HOME", "")
	home := t.TempDir()
	seedClaude(t, home)
	seedCodex(t, home)
	seedOpenCode(t, home+"/.local/share")

	result, err := collect(home)
	if err != nil {
		t.Fatal(err)
	}
	if want := []string{"claude", "codex", "opencode"}; !slices.Equal(result.Agents, want) {
		t.Errorf("agents = %v, want %v", result.Agents, want)
	}
	if result.EventCount != 9 {
		t.Errorf("event count = %d, want 9", result.EventCount)
	}
	if len(result.Stats) != 3 {
		t.Errorf("stats = %d entries, want 3", len(result.Stats))
	}

	var messages int64
	for _, row := range result.Rows {
		messages += row.Messages
		if row.CostUsd != nil {
			t.Errorf("row %+v has costUsd, want nil", row)
		}
		if sum := row.InputTokens + row.OutputTokens + row.CacheReadTokens + row.CacheWriteTokens + row.ReasoningTokens; row.TotalTokens != sum {
			t.Errorf("row %+v total = %d, want %d", row, row.TotalTokens, sum)
		}
	}
	if messages != int64(result.EventCount) {
		t.Errorf("messages across rows = %d, want event count %d", messages, result.EventCount)
	}

	got := rowsByKey(result.Rows)
	if len(result.Rows) != 6 {
		t.Errorf("got %d rows, want 6", len(result.Rows))
	}
	for _, w := range []ingestRow{
		{Date: "2026-09-12", Agent: "opencode", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 10, OutputTokens: 15, CacheReadTokens: 30, CacheWriteTokens: 40, ReasoningTokens: 5, TotalTokens: 100, Messages: 1},
		{Date: "2026-09-12", Agent: "opencode", Provider: "unknown", Model: "unknown", ReasoningTokens: 9, TotalTokens: 9, Messages: 1},
	} {
		key := w.Date + "|" + w.Agent + "|" + w.Provider + "|" + w.Model
		if got[key] != w {
			t.Errorf("row %s = %+v, want %+v", key, got[key], w)
		}
	}
}

func TestCollectEmptyHome(t *testing.T) {
	t.Setenv("XDG_DATA_HOME", "")
	result, err := collect(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Agents) != 0 || result.EventCount != 0 || len(result.Rows) != 0 {
		t.Errorf("result = %+v, want empty", result)
	}
	raw, err := json.Marshal(map[string]any{"rows": result.Rows})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(raw), `"rows":[]`) {
		t.Errorf("rows encoded as %s, want []", raw)
	}
}

func TestProviderForAgent(t *testing.T) {
	tests := []struct{ agent, want string }{
		{"claude", "anthropic"},
		{"codex", "openai"},
		{"opencode", "opencode"},
		{"cursor", "cursor"},
	}
	for _, tt := range tests {
		if got := providerForAgent(tt.agent); got != tt.want {
			t.Errorf("providerForAgent(%q) = %q, want %q", tt.agent, got, tt.want)
		}
	}
}
