package main

import (
	"database/sql"
	"encoding/json"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

func parseCursor(home string, emit func(usageEvent)) (parserStats, bool, error) {
	path := filepath.Join(home, "Library", "Application Support", "Cursor", "User", "globalStorage", "state.vscdb")
	info, err := os.Stat(path)
	if err != nil {
		if os.IsNotExist(err) {
			return parserStats{}, false, nil
		}
		return parserStats{}, false, err
	}
	started := time.Now()

	dsn := (&url.URL{
		Scheme:   "file",
		Path:     path,
		RawQuery: "immutable=1&mode=ro",
	}).String()
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return parserStats{}, false, err
	}
	defer db.Close()

	var table string
	if err := db.QueryRow(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cursorDiskKV' LIMIT 1`).Scan(&table); err != nil {
		if err == sql.ErrNoRows {
			return parserStats{}, false, nil
		}
		return parserStats{}, false, err
	}

	composerRows, err := loadCursorKV(db, "composerData:")
	if err != nil {
		return parserStats{}, false, err
	}
	composers := map[string]map[string]any{}
	for _, row := range composerRows {
		id := strings.TrimPrefix(row.key, "composerData:")
		if id == "" {
			continue
		}
		var composerJSON map[string]any
		if json.Unmarshal(row.value, &composerJSON) != nil {
			continue
		}
		composers[id] = composerJSON
	}

	rows, err := db.Query(`SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%' ESCAPE '\' ORDER BY key`)
	if err != nil {
		return parserStats{}, false, err
	}
	defer rows.Close()

	seen := map[string]struct{}{}
	var buckets tokenBuckets
	events := 0
	add := func(mapped []cursorEvent) {
		for _, event := range mapped {
			if _, ok := seen[event.id]; ok {
				continue
			}
			seen[event.id] = struct{}{}
			events++
			buckets.add(event.tokens)
			emit(event.usageEvent)
		}
	}

	var currentID string
	var batch []kvRow
	flush := func() {
		if currentID == "" {
			return
		}
		if composerJSON, ok := composers[currentID]; ok {
			add(mapCursorComposer(currentID, composerJSON, batch))
			delete(composers, currentID)
		}
		batch = batch[:0]
	}
	for rows.Next() {
		var row kvRow
		if err := rows.Scan(&row.key, &row.value); err != nil {
			return parserStats{}, false, err
		}
		rest := strings.TrimPrefix(row.key, "bubbleId:")
		id, _, ok := strings.Cut(rest, ":")
		if !ok || id == "" {
			continue
		}
		if id != currentID {
			flush()
			currentID = id
		}
		batch = append(batch, row)
	}
	if err := rows.Err(); err != nil {
		return parserStats{}, false, err
	}
	flush()
	for id, composerJSON := range composers {
		add(mapCursorComposer(id, composerJSON, nil))
	}

	return finish("cursor", started, 1, info.Size(), events, buckets), true, nil
}

type cursorEvent struct {
	id string
	usageEvent
}

type kvRow struct {
	key   string
	value []byte
}

func loadCursorKV(db *sql.DB, prefix string) ([]kvRow, error) {
	escaped := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(prefix)
	rows, err := db.Query(`SELECT key, value FROM cursorDiskKV WHERE key LIKE ? ESCAPE '\'`, escaped+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []kvRow
	for rows.Next() {
		var row kvRow
		if err := rows.Scan(&row.key, &row.value); err != nil {
			return nil, err
		}
		out = append(out, row)
	}
	return out, rows.Err()
}

func mapCursorComposer(composerID string, composerJSON map[string]any, bubbles []kvRow) []cursorEvent {
	var bubbleEvents []cursorEvent
	for _, bubble := range bubbles {
		var bubbleJSON map[string]any
		if json.Unmarshal(bubble.value, &bubbleJSON) != nil {
			continue
		}
		tokenCount, _ := bubbleJSON["tokenCount"].(map[string]any)
		if tokenCount == nil {
			tokenCount, _ = bubbleJSON["tokenCounts"].(map[string]any)
		}
		if tokenCount == nil {
			continue
		}
		input := jsonInt(firstAny(tokenCount["inputTokens"], tokenCount["input"]))
		output := jsonInt(firstAny(tokenCount["outputTokens"], tokenCount["output"]))
		if input == 0 && output == 0 {
			continue
		}
		bubbleID := jsonString(bubbleJSON["bubbleId"])
		if bubbleID == "" {
			bubbleID = strings.TrimPrefix(bubble.key, "bubbleId:"+composerID+":")
		}
		ts := jsonTime(bubbleJSON["createdAt"])
		if ts.IsZero() {
			ts = jsonTime(composerJSON["createdAt"])
		}
		if ts.IsZero() {
			continue
		}
		model := cursorModelName(composerJSON, bubbleJSON)
		bubbleEvents = append(bubbleEvents, cursorEvent{
			id: "cursor-bubble-" + composerID + "-" + bubbleID,
			usageEvent: usageEvent{
				ts:       ts,
				agent:    "cursor",
				provider: cursorProvider(model),
				model:    model,
				tokens:   tokenBuckets{input: input, output: output},
			},
		})
	}
	// No fallback to contextTokensUsed / promptTokenBreakdown: those measure how
	// full the context window is, not tokens consumed.
	return bubbleEvents
}

func cursorModelName(composerJSON, bubbleJSON map[string]any) string {
	if bubbleJSON != nil {
		if info, ok := bubbleJSON["modelInfo"].(map[string]any); ok {
			if name := jsonString(info["modelName"]); name != "" && name != "default" {
				return name
			}
		}
	}
	if config, ok := composerJSON["modelConfig"].(map[string]any); ok {
		if selected, ok := config["selectedModels"].([]any); ok && len(selected) > 0 {
			if first, ok := selected[0].(map[string]any); ok {
				if id := jsonString(first["modelId"]); id != "" && id != "default" {
					return id
				}
			}
		}
		if name := jsonString(config["modelName"]); name != "" && name != "default" {
			return name
		}
	}
	return "cursor-auto"
}

func cursorProvider(model string) string {
	if strings.Contains(strings.ToLower(model), "grok") {
		return "xai"
	}
	return "cursor"
}

func jsonInt(value any) int64 {
	switch typed := value.(type) {
	case float64:
		return int64(typed)
	case json.Number:
		n, _ := typed.Int64()
		return n
	case int:
		return int64(typed)
	case int64:
		return typed
	case string:
		var n float64
		if json.Unmarshal([]byte(typed), &n) == nil {
			return int64(n)
		}
	}
	return 0
}

func jsonString(value any) string {
	s, _ := value.(string)
	return s
}

func jsonTime(value any) time.Time {
	switch typed := value.(type) {
	case float64:
		if typed > 1e12 {
			return time.UnixMilli(int64(typed))
		}
		if typed > 1e9 {
			return time.Unix(int64(typed), 0)
		}
	case json.Number:
		n, _ := typed.Float64()
		return jsonTime(n)
	case string:
		if ts, ok := parseTimestamp(typed); ok {
			return ts
		}
	}
	return time.Time{}
}

func firstAny(values ...any) any {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}
