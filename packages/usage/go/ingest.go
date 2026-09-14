package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func ingest(result *collectResult) error {
	if len(result.Rows) == 0 {
		fmt.Println("Nothing to ingest.")
		return nil
	}
	if len(result.Rows) > 20000 {
		return fmt.Errorf("row count %d exceeds ingest cap of 20000", len(result.Rows))
	}

	printTable(result.Stats)
	fmt.Println()

	endpoint := resolveEndpoint()
	if os.Getenv("USAGE_INGEST_DRY_RUN") != "" {
		fmt.Printf("Dry run: %d rows → %s\n", len(result.Rows), endpoint)
		return encodeJSON(os.Stdout, map[string]any{"rows": result.Rows})
	}

	token, err := bearerToken()
	if err != nil {
		return err
	}

	body, err := json.Marshal(map[string]any{"rows": result.Rows})
	if err != nil {
		return err
	}

	fmt.Printf("Upserting %s rows → %s\n", formatCount(len(result.Rows)), endpoint)
	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("content-type", "application/json")
	req.Header.Set("authorization", "Bearer "+token)

	client := &http.Client{Timeout: 2 * time.Minute}
	started := time.Now()
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	detail, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ingest endpoint %d: %s", resp.StatusCode, strings.TrimSpace(string(detail)))
	}
	fmt.Printf("Response: %d in %s %s\n", resp.StatusCode, time.Since(started).Round(time.Millisecond), strings.TrimSpace(string(detail)))

	printIngestSummary(result.Rows)
	return nil
}

func resolveEndpoint() string {
	if explicit := getenv("USAGE_INGEST_URL", ""); explicit != "" {
		return explicit
	}
	host := getenv("VERCEL_PROJECT_PRODUCTION_URL", getenv("VERCEL_URL", "https://ruchern.dev"))
	if strings.HasPrefix(host, "http://") || strings.HasPrefix(host, "https://") {
		return strings.TrimRight(host, "/") + "/api/usage/ingest"
	}
	return "https://" + host + "/api/usage/ingest"
}

func printIngestSummary(rows []ingestRow) {
	var tokens int64
	dates := make([]string, 0, len(rows))
	seen := map[string]struct{}{}
	for _, row := range rows {
		tokens += row.TotalTokens
		dates = append(dates, row.Date)
		seen[row.Date] = struct{}{}
	}
	minDate, maxDate := dates[0], dates[0]
	for _, date := range dates {
		if date < minDate {
			minDate = date
		}
		if date > maxDate {
			maxDate = date
		}
	}
	fmt.Println("\nDone.")
	fmt.Printf("  rows:    %s\n", formatCount(len(rows)))
	fmt.Printf("  days:    %s\n", formatCount(len(seen)))
	fmt.Printf("  range:   %s → %s\n", minDate, maxDate)
	fmt.Printf("  tokens:  %s\n", formatCount64(tokens))
	fmt.Println("  cost:    server-priced (costUsd sent as null)")
}

func formatCount(n int) string {
	return formatCount64(int64(n))
}

func formatCount64(n int64) string {
	s := fmt.Sprintf("%d", n)
	if n < 1000 {
		return s
	}
	var parts []string
	for len(s) > 3 {
		parts = append([]string{s[len(s)-3:]}, parts...)
		s = s[:len(s)-3]
	}
	return s + "," + strings.Join(parts, ",")
}
