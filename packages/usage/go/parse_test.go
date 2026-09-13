package main

import (
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"testing"
	"time"
)

var openCodeCreated = time.Date(2026, 9, 12, 12, 0, 0, 0, time.UTC)

func copyTree(t *testing.T, src, dst string) {
	t.Helper()
	err := filepath.WalkDir(src, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if d.IsDir() {
			return os.MkdirAll(target, 0o755)
		}
		raw, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(target, raw, 0o644)
	})
	if err != nil {
		t.Fatalf("copy %s: %v", src, err)
	}
}

func seedClaude(t *testing.T, home string) {
	t.Helper()
	copyTree(t, filepath.Join("testdata", "claude", "project-a"), filepath.Join(home, ".claude", "projects", "project-a"))
	copyTree(t, filepath.Join("testdata", "claude", "project-b"), filepath.Join(home, ".config", "claude", "projects", "project-b"))
}

func seedCodex(t *testing.T, home string) {
	t.Helper()
	copyTree(t, filepath.Join("testdata", "codex"), filepath.Join(home, ".codex"))
}

func writeSQLite(t *testing.T, path, schema, insert string, rows [][]any) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("schema: %v", err)
	}
	if insert == "" {
		return
	}
	for _, row := range rows {
		if _, err := db.Exec(insert, row...); err != nil {
			t.Fatalf("insert %v: %v", row, err)
		}
	}
}

func seedOpenCode(t *testing.T, dataHome string) string {
	t.Helper()
	created := openCodeCreated.UnixMilli()
	path := filepath.Join(dataHome, "opencode", "opencode.db")
	writeSQLite(t, path, "CREATE TABLE message (id TEXT PRIMARY KEY, data TEXT)", "INSERT INTO message (id, data) VALUES (?, ?)", [][]any{
		{"m1", fmt.Sprintf(`{"role":"assistant","providerID":"anthropic","modelID":"claude-sonnet-4-5","time":{"created":%d},"tokens":{"input":10,"output":20,"reasoning":5,"cache":{"read":30,"write":40}}}`, created)},
		{"m2", `{"role":"user","time":{"created":1},"tokens":{"input":99}}`},
		{"m3", `{not json`},
		{"m4", nil},
		{"m5", ""},
		{"m6", `{"role":"assistant","tokens":{"input":99}}`},
		{"m7", `{"role":"assistant","time":{"created":1}}`},
		{"m8", fmt.Sprintf(`{"role":"assistant","time":{"created":%d},"tokens":{"output":3,"reasoning":9}}`, created)},
	})
	return path
}

func runParser(t *testing.T, parse func(string, func(usageEvent)) (parserStats, bool, error), home string) (parserStats, bool, []usageEvent) {
	t.Helper()
	var events []usageEvent
	stats, detected, err := parse(home, func(event usageEvent) {
		events = append(events, event)
	})
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	return stats, detected, events
}

func mustTime(t *testing.T, value string) time.Time {
	t.Helper()
	ts, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		t.Fatal(err)
	}
	return ts
}

func assertEvents(t *testing.T, got, want []usageEvent) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("got %d events, want %d: %+v", len(got), len(want), got)
	}
	for i := range want {
		g, w := got[i], want[i]
		if !g.ts.Equal(w.ts) || g.agent != w.agent || g.provider != w.provider || g.model != w.model || g.tokens != w.tokens {
			t.Errorf("event %d = %+v, want %+v", i, g, w)
		}
	}
}

func assertStats(t *testing.T, got, want parserStats) {
	t.Helper()
	got.DurationMs = 0
	if got != want {
		t.Errorf("stats = %+v, want %+v", got, want)
	}
}

func fileSizes(t *testing.T, paths ...string) int64 {
	t.Helper()
	var total int64
	for _, path := range paths {
		info, err := os.Stat(path)
		if err != nil {
			t.Fatal(err)
		}
		total += info.Size()
	}
	return total
}

func TestParseClaude(t *testing.T) {
	home := t.TempDir()
	seedClaude(t, home)

	stats, detected, events := runParser(t, parseClaude, home)
	if !detected {
		t.Fatal("expected claude to be detected")
	}
	assertEvents(t, events, []usageEvent{
		{ts: mustTime(t, "2026-09-12T15:30:00Z"), agent: "claude", model: "claude-sonnet-4-5", tokens: tokenBuckets{input: 100, output: 50, cacheRead: 1000, cacheWrite: 200}},
		{ts: mustTime(t, "2026-09-12T16:30:00Z"), agent: "claude", model: "claude-sonnet-4-5", tokens: tokenBuckets{input: 10, output: 5}},
		{ts: mustTime(t, "2026-09-13T01:00:00Z"), agent: "claude", model: "claude-opus-4-1", tokens: tokenBuckets{input: 1, output: 2, cacheRead: 3, cacheWrite: 4}},
	})
	assertStats(t, stats, parserStats{
		Agent: "claude",
		Files: 2,
		Bytes: fileSizes(t,
			filepath.Join(home, ".claude", "projects", "project-a", "session.jsonl"),
			filepath.Join(home, ".config", "claude", "projects", "project-b", "resumed.jsonl"),
		),
		Events:           3,
		InputTokens:      111,
		OutputTokens:     57,
		CacheReadTokens:  1003,
		CacheWriteTokens: 204,
	})
}

func TestParseClaudeDedup(t *testing.T) {
	const ts = "2026-09-12T10:00:00Z"
	line := func(timestamp, messageID, requestID, uuid string, input int) string {
		return fmt.Sprintf(`{"timestamp":%q,"requestId":%q,"uuid":%q,"message":{"id":%q,"model":"claude-sonnet-4-5","usage":{"input_tokens":%d}}}`, timestamp, requestID, uuid, messageID, input)
	}
	tests := []struct {
		name       string
		lines      []string
		wantEvents int
		wantInput  int64
	}{
		{"same message id counted once", []string{line(ts, "msg_1", "req_1", "u1", 10), line(ts, "msg_1", "req_1", "u2", 10)}, 1, 10},
		{"largest streamed usage wins", []string{line(ts, "msg_1", "", "u1", 10), line(ts, "msg_1", "", "u2", 99), line(ts, "msg_1", "", "u3", 50)}, 1, 99},
		{"request id used without message id", []string{line(ts, "", "req_1", "u1", 10), line(ts, "", "req_1", "u2", 10)}, 1, 10},
		{"uuid used without message or request id", []string{line(ts, "", "", "u1", 10), line(ts, "", "", "u1", 10)}, 1, 10},
		{"message id takes precedence over request id", []string{line(ts, "msg_1", "req_1", "u1", 10), line(ts, "msg_2", "req_1", "u2", 5)}, 2, 15},
		{"skipped line does not reserve its id", []string{line("bad", "msg_1", "", "u1", 99), line(ts, "msg_1", "", "u2", 10)}, 1, 10},
		{"no ids never deduplicated", []string{line(ts, "", "", "", 10), line(ts, "", "", "", 10)}, 2, 20},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			home := t.TempDir()
			path := filepath.Join(home, ".claude", "projects", "p", "s.jsonl")
			if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
				t.Fatal(err)
			}
			var body string
			for _, l := range tt.lines {
				body += l + "\n"
			}
			if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
				t.Fatal(err)
			}
			stats, _, events := runParser(t, parseClaude, home)
			if len(events) != tt.wantEvents || stats.Events != tt.wantEvents {
				t.Errorf("events = %d (stats %d), want %d", len(events), stats.Events, tt.wantEvents)
			}
			if stats.InputTokens != tt.wantInput {
				t.Errorf("input = %d, want %d", stats.InputTokens, tt.wantInput)
			}
		})
	}
}

func TestParseCodex(t *testing.T) {
	home := t.TempDir()
	seedCodex(t, home)

	stats, detected, events := runParser(t, parseCodex, home)
	if !detected {
		t.Fatal("expected codex to be detected")
	}
	assertEvents(t, events, []usageEvent{
		// Logged before the first turn_context, so it takes the session's first model.
		{ts: mustTime(t, "2026-09-12T15:00:00.500Z"), agent: "codex", model: "gpt-5-codex", tokens: tokenBuckets{input: 4, output: 2}},
		// input excludes cached tokens, output excludes reasoning tokens. The
		// repeat with an unchanged cumulative total is skipped.
		{ts: mustTime(t, "2026-09-12T15:59:59.999Z"), agent: "codex", model: "gpt-5-codex", tokens: tokenBuckets{input: 200, output: 100, cacheRead: 800, reasoning: 200}},
		// Subtractions clamp at zero.
		{ts: mustTime(t, "2026-09-12T16:00:00Z"), agent: "codex", model: "gpt-5-codex", tokens: tokenBuckets{cacheRead: 10, reasoning: 4}},
		// The model does not leak across files.
		{ts: mustTime(t, "2026-09-11T10:00:00Z"), agent: "codex", model: "unknown", tokens: tokenBuckets{input: 7, output: 3}},
	})
	assertStats(t, stats, parserStats{
		Agent: "codex",
		Files: 2,
		Bytes: fileSizes(t,
			filepath.Join(home, ".codex", "sessions", "2026", "09", "12", "rollout.jsonl"),
			filepath.Join(home, ".codex", "archived_sessions", "early.jsonl"),
		),
		Events:          4,
		InputTokens:     211,
		OutputTokens:    105,
		CacheReadTokens: 810,
		ReasoningTokens: 204,
	})
}

func TestParseOpenCode(t *testing.T) {
	tests := []struct {
		name     string
		xdg      func(home string) string
		dataHome func(home string) string
	}{
		{
			name:     "default data home",
			xdg:      func(string) string { return "" },
			dataHome: func(home string) string { return filepath.Join(home, ".local", "share") },
		},
		{
			name:     "XDG_DATA_HOME override",
			xdg:      func(home string) string { return filepath.Join(home, "xdg") },
			dataHome: func(home string) string { return filepath.Join(home, "xdg") },
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			home := t.TempDir()
			t.Setenv("XDG_DATA_HOME", tt.xdg(home))
			path := seedOpenCode(t, tt.dataHome(home))

			stats, detected, events := runParser(t, parseOpenCode, home)
			if !detected {
				t.Fatal("expected opencode to be detected")
			}
			assertEvents(t, events, []usageEvent{
				{ts: openCodeCreated, agent: "opencode", provider: "anthropic", model: "claude-sonnet-4-5", tokens: tokenBuckets{input: 10, output: 15, cacheRead: 30, cacheWrite: 40, reasoning: 5}},
				{ts: openCodeCreated, agent: "opencode", provider: "unknown", model: "unknown", tokens: tokenBuckets{reasoning: 9}},
			})
			assertStats(t, stats, parserStats{
				Agent:            "opencode",
				Files:            1,
				Bytes:            fileSizes(t, path),
				Events:           2,
				InputTokens:      10,
				OutputTokens:     15,
				CacheReadTokens:  30,
				CacheWriteTokens: 40,
				ReasoningTokens:  14,
			})
		})
	}
}

func TestParsersNotDetected(t *testing.T) {
	t.Setenv("XDG_DATA_HOME", "")
	parsers := []struct {
		name  string
		parse func(string, func(usageEvent)) (parserStats, bool, error)
	}{
		{"claude", parseClaude},
		{"codex", parseCodex},
		{"opencode", parseOpenCode},
		{"cursor", parseCursor},
	}
	for _, p := range parsers {
		t.Run(p.name, func(t *testing.T) {
			stats, detected, events := runParser(t, p.parse, t.TempDir())
			if detected || len(events) != 0 || stats != (parserStats{}) {
				t.Errorf("detected=%v events=%d stats=%+v, want nothing", detected, len(events), stats)
			}
		})
	}
}

func TestParseTimestamp(t *testing.T) {
	tests := []struct {
		value  string
		want   time.Time
		wantOK bool
	}{
		{"2026-09-12T15:30:00Z", time.Date(2026, 9, 12, 15, 30, 0, 0, time.UTC), true},
		{"2026-09-12T15:30:00.123456789Z", time.Date(2026, 9, 12, 15, 30, 0, 123456789, time.UTC), true},
		{"2026-09-12T23:30:00+08:00", time.Date(2026, 9, 12, 15, 30, 0, 0, time.UTC), true},
		{"", time.Time{}, false},
		{"2026-09-12 15:30:00", time.Time{}, false},
		{"not-a-time", time.Time{}, false},
	}
	for _, tt := range tests {
		t.Run(tt.value, func(t *testing.T) {
			got, ok := parseTimestamp(tt.value)
			if ok != tt.wantOK || !got.Equal(tt.want) {
				t.Errorf("parseTimestamp(%q) = %v, %v; want %v, %v", tt.value, got, ok, tt.want, tt.wantOK)
			}
		})
	}
}

func TestListJSONLMissingRoot(t *testing.T) {
	files, size, err := listJSONL(filepath.Join(t.TempDir(), "missing"))
	if err != nil || len(files) != 0 || size != 0 {
		t.Errorf("listJSONL(missing) = %v, %d, %v; want empty", files, size, err)
	}
}
