package main

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"sort"
	"testing"
	"time"
)

var (
	cursorComposerCreated = time.Date(2026, 9, 12, 15, 0, 0, 0, time.UTC)
	cursorBubbleCreated   = time.Date(2026, 9, 12, 15, 30, 0, 0, time.UTC)
)

func mustJSONMap(t *testing.T, raw string) map[string]any {
	t.Helper()
	if raw == "" {
		return nil
	}
	var out map[string]any
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		t.Fatalf("json %s: %v", raw, err)
	}
	return out
}

func TestJSONInt(t *testing.T) {
	tests := []struct {
		name  string
		value any
		want  int64
	}{
		{"float64", float64(12.9), 12},
		{"json number", json.Number("34"), 34},
		{"int", 5, 5},
		{"int64", int64(6), 6},
		{"numeric string", "42", 42},
		{"decimal string", "7.8", 7},
		{"non-numeric string", "abc", 0},
		{"nil", nil, 0},
		{"bool", true, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := jsonInt(tt.value); got != tt.want {
				t.Errorf("jsonInt(%#v) = %d, want %d", tt.value, got, tt.want)
			}
		})
	}
}

func TestJSONTime(t *testing.T) {
	ts := time.Date(2026, 9, 12, 15, 30, 0, 0, time.UTC)
	tests := []struct {
		name  string
		value any
		want  time.Time
	}{
		{"epoch milliseconds", float64(ts.UnixMilli()), ts},
		{"epoch seconds", float64(ts.Unix()), ts},
		{"json number milliseconds", json.Number(fmt.Sprint(ts.UnixMilli())), ts},
		{"RFC3339 string", "2026-09-12T15:30:00Z", ts},
		{"too small to be a timestamp", float64(12345), time.Time{}},
		{"invalid string", "yesterday", time.Time{}},
		{"nil", nil, time.Time{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := jsonTime(tt.value); !got.Equal(tt.want) {
				t.Errorf("jsonTime(%#v) = %v, want %v", tt.value, got, tt.want)
			}
		})
	}
}

func TestCursorModelName(t *testing.T) {
	tests := []struct {
		name     string
		composer string
		bubble   string
		want     string
	}{
		{"bubble model wins", `{"modelConfig":{"modelName":"claude-4-sonnet"}}`, `{"modelInfo":{"modelName":"gpt-5"}}`, "gpt-5"},
		{"default bubble falls back to selected model", `{"modelConfig":{"selectedModels":[{"modelId":"grok-code-fast-1"}],"modelName":"claude-4-sonnet"}}`, `{"modelInfo":{"modelName":"default"}}`, "grok-code-fast-1"},
		{"default selected model falls back to model name", `{"modelConfig":{"selectedModels":[{"modelId":"default"}],"modelName":"claude-4-sonnet"}}`, "", "claude-4-sonnet"},
		{"default model name is auto", `{"modelConfig":{"modelName":"default"}}`, "", "cursor-auto"},
		{"no model config is auto", `{}`, "", "cursor-auto"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := cursorModelName(mustJSONMap(t, tt.composer), mustJSONMap(t, tt.bubble)); got != tt.want {
				t.Errorf("cursorModelName = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestCursorProvider(t *testing.T) {
	tests := []struct{ model, want string }{
		{"grok-code-fast-1", "xai"},
		{"Grok-4", "xai"},
		{"claude-4-sonnet", "cursor"},
		{"cursor-auto", "cursor"},
	}
	for _, tt := range tests {
		if got := cursorProvider(tt.model); got != tt.want {
			t.Errorf("cursorProvider(%q) = %q, want %q", tt.model, got, tt.want)
		}
	}
}

func TestMapCursorComposer(t *testing.T) {
	composerMs := cursorComposerCreated.UnixMilli()
	bubbleMs := cursorBubbleCreated.UnixMilli()
	tests := []struct {
		name     string
		id       string
		composer string
		bubbles  []kvRow
		want     []cursorEvent
	}{
		{
			name:     "bubble token counts",
			id:       "c1",
			composer: fmt.Sprintf(`{"createdAt":%d,"modelConfig":{"modelName":"claude-4-sonnet"}}`, composerMs),
			bubbles: []kvRow{
				{"bubbleId:c1:b1", []byte(fmt.Sprintf(`{"bubbleId":"b1","createdAt":%d,"tokenCount":{"inputTokens":100,"outputTokens":20},"modelInfo":{"modelName":"gpt-5"}}`, bubbleMs))},
				{"bubbleId:c1:b2", []byte(`{"tokenCount":{"inputTokens":0,"outputTokens":0}}`)},
				{"bubbleId:c1:b3", []byte(`not json`)},
				{"bubbleId:c1:b4", []byte(`{"text":"no tokens"}`)},
				{"bubbleId:c1:b5", []byte(`{"tokenCounts":{"input":"7","output":3}}`)},
			},
			want: []cursorEvent{
				{id: "cursor-bubble-c1-b1", usageEvent: usageEvent{ts: cursorBubbleCreated, agent: "cursor", provider: "cursor", model: "gpt-5", tokens: tokenBuckets{input: 100, output: 20}}},
				{id: "cursor-bubble-c1-b5", usageEvent: usageEvent{ts: cursorComposerCreated, agent: "cursor", provider: "cursor", model: "claude-4-sonnet", tokens: tokenBuckets{input: 7, output: 3}}},
			},
		},
		{
			name:     "context meter is not usage",
			id:       "c2",
			composer: fmt.Sprintf(`{"createdAt":%d,"contextTokensUsed":500,"promptTokenBreakdown":{"totalUsedTokens":42}}`, composerMs),
			bubbles:  []kvRow{{"bubbleId:c2:x", []byte(`{"text":"hello"}`)}},
		},
		{
			name:     "bubble without any timestamp is skipped",
			id:       "c3",
			composer: `{}`,
			bubbles:  []kvRow{{"bubbleId:c3:b1", []byte(`{"tokenCount":{"inputTokens":5,"outputTokens":5}}`)}},
		},
		{
			name:     "no usage",
			id:       "c4",
			composer: fmt.Sprintf(`{"createdAt":%d}`, composerMs),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mapCursorComposer(tt.id, mustJSONMap(t, tt.composer), tt.bubbles)
			if len(got) != len(tt.want) {
				t.Fatalf("got %d events, want %d: %+v", len(got), len(tt.want), got)
			}
			for i, w := range tt.want {
				g := got[i]
				if g.id != w.id || !g.ts.Equal(w.ts) || g.agent != w.agent || g.provider != w.provider || g.model != w.model || g.tokens != w.tokens {
					t.Errorf("event %d = %+v, want %+v", i, g, w)
				}
			}
		})
	}
}

func cursorDBPath(home string) string {
	return filepath.Join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb")
}

func TestParseCursor(t *testing.T) {
	home := t.TempDir()
	composerMs := cursorComposerCreated.UnixMilli()
	bubbleMs := cursorBubbleCreated.UnixMilli()
	path := cursorDBPath(home)
	writeSQLite(t, path, "CREATE TABLE cursorDiskKV (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)", "INSERT INTO cursorDiskKV (key, value) VALUES (?, ?)", [][]any{
		{"composerData:c1", []byte(fmt.Sprintf(`{"createdAt":%d,"modelConfig":{"modelName":"claude-4-sonnet"}}`, composerMs))},
		{"bubbleId:c1:b1", []byte(fmt.Sprintf(`{"bubbleId":"b1","createdAt":%d,"tokenCount":{"inputTokens":100,"outputTokens":20},"modelInfo":{"modelName":"gpt-5"}}`, bubbleMs))},
		// Same bubbleId as b1, so it is deduplicated.
		{"bubbleId:c1:b3", []byte(`{"bubbleId":"b1","tokenCount":{"inputTokens":999,"outputTokens":999}}`)},
		{"bubbleId:c1:b5", []byte(`{"tokenCounts":{"input":7,"output":3}}`)},
		{"composerData:c2", []byte(fmt.Sprintf(`{"createdAt":%d,"contextTokensUsed":500,"modelConfig":{"selectedModels":[{"modelId":"grok-code-fast-1"}]}}`, composerMs))},
		{"composerData:c3", []byte(fmt.Sprintf(`{"createdAt":%d,"promptTokenBreakdown":{"totalUsedTokens":42}}`, composerMs))},
		{"bubbleId:c3:x", []byte(`{"text":"no tokens"}`)},
		{"composerData:c4", []byte(`{}`)},
		{"composerData:bad", []byte(`not json`)},
		{"bubbleId:malformed", []byte(`{"tokenCount":{"inputTokens":1}}`)},
		{"bubbleId:orphan:z", []byte(`{"tokenCount":{"inputTokens":1000,"outputTokens":1000}}`)},
		{"ItemTable:other", []byte(`{}`)},
	})

	stats, detected, events := runParser(t, parseCursor, home)
	if !detected {
		t.Fatal("expected cursor to be detected")
	}
	sort.Slice(events, func(i, j int) bool { return events[i].tokens.input < events[j].tokens.input })
	// Composers c2 and c3 only carry context-window meters, so they emit nothing.
	assertEvents(t, events, []usageEvent{
		{ts: cursorComposerCreated, agent: "cursor", provider: "cursor", model: "claude-4-sonnet", tokens: tokenBuckets{input: 7, output: 3}},
		{ts: cursorBubbleCreated, agent: "cursor", provider: "cursor", model: "gpt-5", tokens: tokenBuckets{input: 100, output: 20}},
	})
	assertStats(t, stats, parserStats{
		Agent:        "cursor",
		Files:        1,
		Bytes:        fileSizes(t, path),
		Events:       2,
		InputTokens:  107,
		OutputTokens: 23,
	})
}

func TestParseCursorWithoutKVTable(t *testing.T) {
	home := t.TempDir()
	writeSQLite(t, cursorDBPath(home), "CREATE TABLE ItemTable (key TEXT, value BLOB)", "", nil)

	_, detected, events := runParser(t, parseCursor, home)
	if detected || len(events) != 0 {
		t.Errorf("detected=%v events=%d, want not detected", detected, len(events))
	}
}
