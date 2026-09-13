package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/zalando/go-keyring"
)

func captureStdout(t *testing.T, fn func()) string {
	t.Helper()
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatal(err)
	}
	prev := os.Stdout
	os.Stdout = w
	done := make(chan string)
	go func() {
		var buf bytes.Buffer
		_, _ = io.Copy(&buf, r)
		done <- buf.String()
	}()
	func() {
		defer func() {
			os.Stdout = prev
			_ = w.Close()
		}()
		fn()
	}()
	out := <-done
	_ = r.Close()
	return out
}

func sampleRows() []ingestRow {
	return []ingestRow{
		{Date: "2026-09-12", Agent: "claude", Provider: "anthropic", Model: "claude-sonnet-4-5", InputTokens: 100, OutputTokens: 50, CacheReadTokens: 1000, CacheWriteTokens: 200, TotalTokens: 1350, Messages: 1},
		{Date: "2026-09-13", Agent: "codex", Provider: "openai", Model: "gpt-5-codex", InputTokens: 200, OutputTokens: 100, CacheReadTokens: 800, ReasoningTokens: 200, TotalTokens: 1300, Messages: 1},
	}
}

func unexpectedServer(t *testing.T) *httptest.Server {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("unexpected request %s %s", r.Method, r.URL)
	}))
	t.Cleanup(srv.Close)
	return srv
}

func assertRowsPayload(t *testing.T, raw []byte, want []ingestRow) {
	t.Helper()
	var generic struct {
		Rows []map[string]any `json:"rows"`
	}
	if err := json.Unmarshal(raw, &generic); err != nil {
		t.Fatalf("payload %s: %v", raw, err)
	}
	if len(generic.Rows) != len(want) {
		t.Fatalf("payload has %d rows, want %d", len(generic.Rows), len(want))
	}
	wantKeys := []string{"agent", "cacheReadTokens", "cacheWriteTokens", "costUsd", "date", "inputTokens", "messages", "model", "outputTokens", "provider", "reasoningTokens", "totalTokens"}
	for i, row := range generic.Rows {
		keys := make([]string, 0, len(row))
		for key := range row {
			keys = append(keys, key)
		}
		slices.Sort(keys)
		if !slices.Equal(keys, wantKeys) {
			t.Errorf("row %d keys = %v, want %v", i, keys, wantKeys)
		}
		if cost, ok := row["costUsd"]; !ok || cost != nil {
			t.Errorf("row %d costUsd = %v (present %v), want explicit null", i, cost, ok)
		}
	}
	var typed struct {
		Rows []ingestRow `json:"rows"`
	}
	if err := json.Unmarshal(raw, &typed); err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(typed.Rows, want) {
		t.Errorf("payload rows = %+v, want %+v", typed.Rows, want)
	}
}

func TestIngestNoRows(t *testing.T) {
	keyring.MockInitWithError(errors.New("keychain must not be used"))
	t.Setenv("USAGE_INGEST_URL", unexpectedServer(t).URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "")

	var err error
	out := captureStdout(t, func() { err = ingest(&collectResult{}) })
	if err != nil {
		t.Fatal(err)
	}
	if out != "Nothing to ingest.\n" {
		t.Errorf("output = %q", out)
	}
}

func TestIngestRowCap(t *testing.T) {
	keyring.MockInitWithError(errors.New("keychain must not be used"))
	t.Setenv("USAGE_INGEST_URL", unexpectedServer(t).URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "")

	err := ingest(&collectResult{Rows: make([]ingestRow, 20001)})
	if err == nil || !strings.Contains(err.Error(), "exceeds ingest cap of 20000") {
		t.Errorf("err = %v, want row cap error", err)
	}
}

func TestIngestDryRun(t *testing.T) {
	keyring.MockInitWithError(errors.New("keychain must not be used"))
	srv := unexpectedServer(t)
	t.Setenv("USAGE_INGEST_URL", srv.URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "1")

	rows := sampleRows()
	var err error
	out := captureStdout(t, func() {
		err = ingest(&collectResult{Stats: []parserStats{{Agent: "claude"}}, Rows: rows})
	})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out, "Dry run: 2 rows → "+srv.URL+"\n") {
		t.Errorf("output missing dry run header: %q", out)
	}
	idx := strings.Index(out, "\n{")
	if idx < 0 {
		t.Fatalf("output has no JSON payload: %q", out)
	}
	assertRowsPayload(t, []byte(out[idx+1:]), rows)
}

func TestIngestPostsRows(t *testing.T) {
	keyring.MockInit()
	if err := saveTokens(oauthTokens{AccessToken: "access-123", ExpiryUnix: time.Now().Add(time.Hour).Unix(), ClientID: "client"}); err != nil {
		t.Fatal(err)
	}

	var (
		method, contentType, authorization string
		body                               []byte
	)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		method = r.Method
		contentType = r.Header.Get("content-type")
		authorization = r.Header.Get("authorization")
		body, _ = io.ReadAll(r.Body)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer srv.Close()
	t.Setenv("USAGE_INGEST_URL", srv.URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "")

	rows := sampleRows()
	var err error
	out := captureStdout(t, func() { err = ingest(&collectResult{Rows: rows}) })
	if err != nil {
		t.Fatal(err)
	}
	if method != http.MethodPost {
		t.Errorf("method = %s, want POST", method)
	}
	if contentType != "application/json" {
		t.Errorf("content-type = %q", contentType)
	}
	if authorization != "Bearer access-123" {
		t.Errorf("authorization = %q", authorization)
	}
	assertRowsPayload(t, body, rows)
	for _, want := range []string{
		"Upserting 2 rows → " + srv.URL,
		"Done.",
		"rows:    2",
		"days:    2",
		"range:   2026-09-12 → 2026-09-13",
		"tokens:  2,650",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("output missing %q:\n%s", want, out)
		}
	}
}

func TestIngestErrorStatus(t *testing.T) {
	keyring.MockInit()
	if err := saveTokens(oauthTokens{AccessToken: "access-123", ExpiryUnix: time.Now().Add(time.Hour).Unix()}); err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "forbidden", http.StatusForbidden)
	}))
	defer srv.Close()
	t.Setenv("USAGE_INGEST_URL", srv.URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "")

	var err error
	out := captureStdout(t, func() { err = ingest(&collectResult{Rows: sampleRows()}) })
	if err == nil || err.Error() != "ingest endpoint 403: forbidden" {
		t.Errorf("err = %v, want ingest endpoint 403: forbidden", err)
	}
	if strings.Contains(out, "Done.") {
		t.Errorf("summary printed on failure:\n%s", out)
	}
}

func TestIngestNotSignedIn(t *testing.T) {
	keyring.MockInit()
	t.Setenv("USAGE_INGEST_URL", unexpectedServer(t).URL)
	t.Setenv("USAGE_INGEST_DRY_RUN", "")

	var err error
	captureStdout(t, func() { err = ingest(&collectResult{Rows: sampleRows()}) })
	if err == nil || !strings.Contains(err.Error(), "not signed in") {
		t.Errorf("err = %v, want not signed in", err)
	}
}

func TestResolveEndpoint(t *testing.T) {
	tests := []struct {
		name, explicit, production, vercel, want string
	}{
		{"default", "", "", "", "https://ruchern.dev/api/usage/ingest"},
		{"explicit URL used verbatim", "http://localhost:3000/custom", "blog.example.com", "", "http://localhost:3000/custom"},
		{"blank explicit URL ignored", "   ", "blog.example.com", "", "https://blog.example.com/api/usage/ingest"},
		{"production host", "", "blog.example.com", "preview.vercel.app", "https://blog.example.com/api/usage/ingest"},
		{"production URL with scheme and slash", "", "https://blog.example.com/", "", "https://blog.example.com/api/usage/ingest"},
		{"vercel URL fallback", "", "", "preview.vercel.app", "https://preview.vercel.app/api/usage/ingest"},
		{"http scheme kept", "", "", "http://localhost:3000", "http://localhost:3000/api/usage/ingest"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("USAGE_INGEST_URL", tt.explicit)
			t.Setenv("VERCEL_PROJECT_PRODUCTION_URL", tt.production)
			t.Setenv("VERCEL_URL", tt.vercel)
			if got := resolveEndpoint(); got != tt.want {
				t.Errorf("resolveEndpoint() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestFormatCount(t *testing.T) {
	tests := []struct {
		n    int64
		want string
	}{
		{0, "0"},
		{999, "999"},
		{1000, "1,000"},
		{12345, "12,345"},
		{123456, "123,456"},
		{1234567, "1,234,567"},
		{1000000000, "1,000,000,000"},
	}
	for _, tt := range tests {
		if got := formatCount64(tt.n); got != tt.want {
			t.Errorf("formatCount64(%d) = %q, want %q", tt.n, got, tt.want)
		}
		if tt.n < 1<<31 {
			if got := formatCount(int(tt.n)); got != tt.want {
				t.Errorf("formatCount(%d) = %q, want %q", tt.n, got, tt.want)
			}
		}
	}
}
