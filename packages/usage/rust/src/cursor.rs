use crate::collect::{Parsed, Tokens, UsageEvent, finish};
use crate::parse::{failed, parse_timestamp, value_bytes};
use chrono::{DateTime, TimeZone, Utc};
use rusqlite::{Connection, OpenFlags};
use serde::Deserialize;
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use std::path::Path;
use std::time::Instant;

pub fn parse_cursor(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let path = home.join("Library/Application Support/Cursor/User/globalStorage/state.vscdb");
    let meta = match std::fs::metadata(&path) {
        Ok(meta) => meta,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Parsed::default(),
        Err(error) => return failed(error),
    };
    let started = Instant::now();
    let uri = format!(
        "file:{}?immutable=1&mode=ro",
        path.to_string_lossy()
            .replace('%', "%25")
            .replace(' ', "%20")
            .replace('?', "%3f")
            .replace('#', "%23")
    );
    let mut run = || -> rusqlite::Result<Option<(usize, Tokens)>> {
        let conn = Connection::open_with_flags(
            &uri,
            OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_URI,
        )?;
        let has_table = conn.query_row(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'cursorDiskKV' LIMIT 1",
            [],
            |row| row.get::<_, String>(0),
        );
        match has_table {
            Ok(_) => {}
            Err(rusqlite::Error::QueryReturnedNoRows) => return Ok(None),
            Err(error) => return Err(error),
        }

        let mut composers: HashMap<String, CursorComposer> = HashMap::new();
        {
            let mut stmt = conn.prepare(
                r"SELECT key, value FROM cursorDiskKV WHERE key LIKE 'composerData:%' ESCAPE '\'",
            )?;
            let mut rows = stmt.query([])?;
            while let Some(row) = rows.next()? {
                let key: String = row.get(0)?;
                let id = key.strip_prefix("composerData:").unwrap_or(&key);
                if id.is_empty() {
                    continue;
                }
                let Some(raw) = value_bytes(row.get_ref(1)?) else {
                    continue;
                };
                if let Ok(composer) = serde_json::from_slice::<CursorComposer>(raw) {
                    composers.insert(id.to_string(), composer);
                }
            }
        }

        let mut stmt = conn.prepare(
            r"SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%' ESCAPE '\' ORDER BY key",
        )?;
        let mut rows = stmt.query([])?;
        let mut seen: HashSet<String> = HashSet::new();
        let mut buckets = Tokens::default();
        let mut events = 0;
        // Each bubble maps independently of its siblings, so rows are handled
        // one at a time instead of batched per composer.
        while let Some(row) = rows.next()? {
            let key: String = row.get(0)?;
            let rest = key.strip_prefix("bubbleId:").unwrap_or(&key);
            let Some((composer_id, _)) = rest.split_once(':') else {
                continue;
            };
            if composer_id.is_empty() {
                continue;
            }
            let Some(composer) = composers.get(composer_id) else {
                continue;
            };
            let Some(raw) = value_bytes(row.get_ref(1)?) else {
                continue;
            };
            let Some(event) = map_cursor_bubble(composer_id, composer, &key, raw) else {
                continue;
            };
            if !seen.insert(event.id) {
                continue;
            }
            events += 1;
            buckets.add(event.usage.tokens);
            emit(event.usage);
        }
        Ok(Some((events, buckets)))
    };
    match run() {
        Ok(Some((events, buckets))) => Parsed {
            stats: Some(finish("cursor", started, 1, meta.len(), events, buckets)),
            error: None,
        },
        Ok(None) => Parsed::default(),
        Err(error) => failed(error),
    }
}

#[derive(Debug, Default, Deserialize)]
pub struct CursorComposer {
    #[serde(default, rename = "createdAt")]
    pub created_at: Option<Value>,
    #[serde(default, rename = "modelConfig")]
    pub model_config: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
pub struct CursorBubble {
    #[serde(default, rename = "bubbleId")]
    pub bubble_id: Option<Value>,
    #[serde(default, rename = "createdAt")]
    pub created_at: Option<Value>,
    #[serde(default, rename = "tokenCount")]
    pub token_count: Option<Value>,
    #[serde(default, rename = "tokenCounts")]
    pub token_counts: Option<Value>,
    #[serde(default, rename = "modelInfo")]
    pub model_info: Option<Value>,
}

#[derive(Debug, PartialEq)]
pub struct CursorEvent {
    pub id: String,
    pub usage: UsageEvent,
}

/// Maps one `bubbleId:<composer>:<bubble>` row to a usage event. No fallback to
/// contextTokensUsed / promptTokenBreakdown: those measure how full the context
/// window is, not tokens consumed.
pub fn map_cursor_bubble(
    composer_id: &str,
    composer: &CursorComposer,
    key: &str,
    raw: &[u8],
) -> Option<CursorEvent> {
    let bubble = serde_json::from_slice::<CursorBubble>(raw).ok()?;
    let counts = as_object(&bubble.token_count).or_else(|| as_object(&bubble.token_counts))?;
    let input = json_int(non_null(counts, "inputTokens").or_else(|| non_null(counts, "input")));
    let output = json_int(non_null(counts, "outputTokens").or_else(|| non_null(counts, "output")));
    if input == 0 && output == 0 {
        return None;
    }
    let mut bubble_id = json_string(bubble.bubble_id.as_ref()).to_string();
    if bubble_id.is_empty() {
        let prefix = format!("bubbleId:{composer_id}:");
        bubble_id = key.strip_prefix(&prefix).unwrap_or(key).to_string();
    }
    let ts = json_time(bubble.created_at.as_ref())
        .or_else(|| json_time(composer.created_at.as_ref()))?;
    let model = cursor_model_name(composer, &bubble);
    Some(CursorEvent {
        id: format!("cursor-bubble-{composer_id}-{bubble_id}"),
        usage: UsageEvent {
            ts,
            agent: "cursor",
            provider: cursor_provider(&model).to_string(),
            model,
            tokens: Tokens {
                input,
                output,
                ..Default::default()
            },
        },
    })
}

pub fn cursor_model_name(composer: &CursorComposer, bubble: &CursorBubble) -> String {
    if let Some(info) = as_object(&bubble.model_info) {
        let name = json_string(info.get("modelName"));
        if !name.is_empty() && name != "default" {
            return name.to_string();
        }
    }
    if let Some(config) = as_object(&composer.model_config) {
        if let Some(first) = config
            .get("selectedModels")
            .and_then(Value::as_array)
            .and_then(|selected| selected.first())
            .and_then(Value::as_object)
        {
            let id = json_string(first.get("modelId"));
            if !id.is_empty() && id != "default" {
                return id.to_string();
            }
        }
        let name = json_string(config.get("modelName"));
        if !name.is_empty() && name != "default" {
            return name.to_string();
        }
    }
    "cursor-auto".to_string()
}

pub fn cursor_provider(model: &str) -> &'static str {
    if model.to_lowercase().contains("grok") {
        "xai"
    } else {
        "cursor"
    }
}

fn as_object(value: &Option<Value>) -> Option<&Map<String, Value>> {
    value.as_ref()?.as_object()
}

/// JSON `null` counts as missing, like a nil interface in Go.
fn non_null<'a>(map: &'a Map<String, Value>, key: &str) -> Option<&'a Value> {
    map.get(key).filter(|value| !value.is_null())
}

pub fn json_string(value: Option<&Value>) -> &str {
    value.and_then(Value::as_str).unwrap_or("")
}

pub fn json_int(value: Option<&Value>) -> i64 {
    match value {
        Some(Value::Number(n)) => n.as_f64().map(|f| f as i64).unwrap_or(0),
        Some(Value::String(s)) => serde_json::from_str::<f64>(s)
            .map(|f| f as i64)
            .unwrap_or(0),
        _ => 0,
    }
}

pub fn json_time(value: Option<&Value>) -> Option<DateTime<Utc>> {
    match value? {
        Value::Number(n) => {
            let f = n.as_f64()?;
            if f > 1e12 {
                Utc.timestamp_millis_opt(f as i64).single()
            } else if f > 1e9 {
                Utc.timestamp_opt(f as i64, 0).single()
            } else {
                None
            }
        }
        Value::String(s) => parse_timestamp(s),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::params;
    use serde_json::json;
    use tempfile::TempDir;

    fn composer_created() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 9, 12, 15, 0, 0).unwrap()
    }

    fn bubble_created() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 9, 12, 15, 30, 0).unwrap()
    }

    #[test]
    fn test_json_int() {
        assert_eq!(json_int(Some(&json!(12.9))), 12);
        assert_eq!(json_int(Some(&json!(34))), 34);
        assert_eq!(json_int(Some(&json!("42"))), 42);
        assert_eq!(json_int(Some(&json!("7.8"))), 7);
        assert_eq!(json_int(Some(&json!("abc"))), 0);
        assert_eq!(json_int(None), 0);
        assert_eq!(json_int(Some(&json!(true))), 0);
    }

    #[test]
    fn test_json_time() {
        let ts = bubble_created();
        assert_eq!(json_time(Some(&json!(ts.timestamp_millis()))), Some(ts));
        assert_eq!(json_time(Some(&json!(ts.timestamp()))), Some(ts));
        assert_eq!(json_time(Some(&json!("2026-09-12T15:30:00Z"))), Some(ts));
        assert_eq!(json_time(Some(&json!(12345))), None);
        assert_eq!(json_time(Some(&json!("yesterday"))), None);
        assert_eq!(json_time(None), None);
    }

    #[test]
    fn test_cursor_model_name() {
        let cases = [
            (
                json!({"modelConfig": {"modelName": "claude-4-sonnet"}}),
                json!({"modelInfo": {"modelName": "gpt-5"}}),
                "gpt-5",
            ),
            (
                json!({"modelConfig": {"selectedModels": [{"modelId": "grok-code-fast-1"}], "modelName": "claude-4-sonnet"}}),
                json!({"modelInfo": {"modelName": "default"}}),
                "grok-code-fast-1",
            ),
            (
                json!({"modelConfig": {"selectedModels": [{"modelId": "default"}], "modelName": "claude-4-sonnet"}}),
                json!({}),
                "claude-4-sonnet",
            ),
            (
                json!({"modelConfig": {"modelName": "default"}}),
                json!({}),
                "cursor-auto",
            ),
            (json!({}), json!({}), "cursor-auto"),
        ];
        for (composer_json, bubble_json, want) in cases {
            let composer: CursorComposer = serde_json::from_value(composer_json).unwrap();
            let bubble: CursorBubble = serde_json::from_value(bubble_json).unwrap();
            assert_eq!(cursor_model_name(&composer, &bubble), want);
        }
    }

    #[test]
    fn test_cursor_provider() {
        assert_eq!(cursor_provider("grok-code-fast-1"), "xai");
        assert_eq!(cursor_provider("Grok-4"), "xai");
        assert_eq!(cursor_provider("claude-4-sonnet"), "cursor");
        assert_eq!(cursor_provider("cursor-auto"), "cursor");
    }

    /// Go batched bubbles per composer (`mapCursorComposer`); the Rust port maps
    /// one bubble at a time, so each Go subtest becomes one or more
    /// `map_cursor_bubble` calls compared against the same expected events.
    #[test]
    fn test_map_cursor_composer() {
        let composer_ms = composer_created().timestamp_millis();
        let bubble_ms = bubble_created().timestamp_millis();

        // Subtest: "bubble token counts".
        let composer: CursorComposer = serde_json::from_value(json!({
            "createdAt": composer_ms,
            "modelConfig": {"modelName": "claude-4-sonnet"},
        }))
        .unwrap();
        let bubbles: Vec<(&str, Vec<u8>)> = vec![
            (
                "bubbleId:c1:b1",
                serde_json::to_vec(&json!({
                    "bubbleId": "b1",
                    "createdAt": bubble_ms,
                    "tokenCount": {"inputTokens": 100, "outputTokens": 20},
                    "modelInfo": {"modelName": "gpt-5"},
                }))
                .unwrap(),
            ),
            (
                "bubbleId:c1:b2",
                serde_json::to_vec(&json!({"tokenCount": {"inputTokens": 0, "outputTokens": 0}}))
                    .unwrap(),
            ),
            ("bubbleId:c1:b3", b"not json".to_vec()),
            (
                "bubbleId:c1:b4",
                serde_json::to_vec(&json!({"text": "no tokens"})).unwrap(),
            ),
            (
                "bubbleId:c1:b5",
                serde_json::to_vec(&json!({"tokenCounts": {"input": "7", "output": 3}})).unwrap(),
            ),
        ];
        let got: Vec<CursorEvent> = bubbles
            .iter()
            .filter_map(|(key, raw)| map_cursor_bubble("c1", &composer, key, raw))
            .collect();
        let want = vec![
            CursorEvent {
                id: "cursor-bubble-c1-b1".to_string(),
                usage: UsageEvent {
                    ts: bubble_created(),
                    agent: "cursor",
                    provider: "cursor".to_string(),
                    model: "gpt-5".to_string(),
                    tokens: Tokens {
                        input: 100,
                        output: 20,
                        ..Default::default()
                    },
                },
            },
            CursorEvent {
                id: "cursor-bubble-c1-b5".to_string(),
                usage: UsageEvent {
                    ts: composer_created(),
                    agent: "cursor",
                    provider: "cursor".to_string(),
                    model: "claude-4-sonnet".to_string(),
                    tokens: Tokens {
                        input: 7,
                        output: 3,
                        ..Default::default()
                    },
                },
            },
        ];
        assert_eq!(got, want);

        // Subtest: "context meter is not usage" (contextTokensUsed /
        // promptTokenBreakdown never feed tokens, so a bubble without a token
        // count still yields nothing).
        let composer: CursorComposer = serde_json::from_value(json!({
            "createdAt": composer_ms,
            "contextTokensUsed": 500,
            "promptTokenBreakdown": {"totalUsedTokens": 42},
        }))
        .unwrap();
        let raw = serde_json::to_vec(&json!({"text": "hello"})).unwrap();
        assert!(map_cursor_bubble("c2", &composer, "bubbleId:c2:x", &raw).is_none());

        // Subtest: "bubble without any timestamp is skipped".
        let composer = CursorComposer::default();
        let raw = serde_json::to_vec(&json!({"tokenCount": {"inputTokens": 5, "outputTokens": 5}}))
            .unwrap();
        assert!(map_cursor_bubble("c3", &composer, "bubbleId:c3:b1", &raw).is_none());

        // Subtest "no usage" had no bubbles at all in Go; under the per-bubble
        // API there is nothing to call, so it is vacuously covered.
    }

    fn cursor_db_path(home: &Path) -> std::path::PathBuf {
        home.join("Library/Application Support/Cursor/User/globalStorage/state.vscdb")
    }

    #[test]
    fn test_parse_cursor() {
        let home = TempDir::new().unwrap();
        let composer_ms = composer_created().timestamp_millis();
        let bubble_ms = bubble_created().timestamp_millis();
        let db_path = cursor_db_path(home.path());
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        {
            let conn = Connection::open(&db_path).unwrap();
            conn.execute(
                "CREATE TABLE cursorDiskKV (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)",
                [],
            )
            .unwrap();
            let rows: Vec<(&str, Vec<u8>)> = vec![
                (
                    "composerData:c1",
                    serde_json::to_vec(&json!({
                        "createdAt": composer_ms,
                        "modelConfig": {"modelName": "claude-4-sonnet"},
                    }))
                    .unwrap(),
                ),
                (
                    "bubbleId:c1:b1",
                    serde_json::to_vec(&json!({
                        "bubbleId": "b1",
                        "createdAt": bubble_ms,
                        "tokenCount": {"inputTokens": 100, "outputTokens": 20},
                        "modelInfo": {"modelName": "gpt-5"},
                    }))
                    .unwrap(),
                ),
                // Same bubbleId as b1, so it is deduplicated.
                (
                    "bubbleId:c1:b3",
                    serde_json::to_vec(&json!({
                        "bubbleId": "b1",
                        "tokenCount": {"inputTokens": 999, "outputTokens": 999},
                    }))
                    .unwrap(),
                ),
                (
                    "bubbleId:c1:b5",
                    serde_json::to_vec(&json!({"tokenCounts": {"input": 7, "output": 3}})).unwrap(),
                ),
                (
                    "composerData:c2",
                    serde_json::to_vec(&json!({
                        "createdAt": composer_ms,
                        "contextTokensUsed": 500,
                        "modelConfig": {"selectedModels": [{"modelId": "grok-code-fast-1"}]},
                    }))
                    .unwrap(),
                ),
                (
                    "composerData:c3",
                    serde_json::to_vec(&json!({
                        "createdAt": composer_ms,
                        "promptTokenBreakdown": {"totalUsedTokens": 42},
                    }))
                    .unwrap(),
                ),
                (
                    "bubbleId:c3:x",
                    serde_json::to_vec(&json!({"text": "no tokens"})).unwrap(),
                ),
                ("composerData:c4", serde_json::to_vec(&json!({})).unwrap()),
                ("composerData:bad", b"not json".to_vec()),
                (
                    "bubbleId:malformed",
                    serde_json::to_vec(&json!({"tokenCount": {"inputTokens": 1}})).unwrap(),
                ),
                (
                    "bubbleId:orphan:z",
                    serde_json::to_vec(&json!({
                        "tokenCount": {"inputTokens": 1000, "outputTokens": 1000},
                    }))
                    .unwrap(),
                ),
                ("ItemTable:other", serde_json::to_vec(&json!({})).unwrap()),
            ];
            for (key, value) in rows {
                conn.execute(
                    "INSERT INTO cursorDiskKV (key, value) VALUES (?1, ?2)",
                    params![key, value],
                )
                .unwrap();
            }
        }
        let file_size = std::fs::metadata(&db_path).unwrap().len();

        let mut events = Vec::new();
        let parsed = parse_cursor(home.path(), &mut |event| events.push(event));
        events.sort_by_key(|event| event.tokens.input);

        // Composers c2 and c3 only carry context-window meters, so they emit
        // nothing.
        let want = vec![
            UsageEvent {
                ts: composer_created(),
                agent: "cursor",
                provider: "cursor".to_string(),
                model: "claude-4-sonnet".to_string(),
                tokens: Tokens {
                    input: 7,
                    output: 3,
                    ..Default::default()
                },
            },
            UsageEvent {
                ts: bubble_created(),
                agent: "cursor",
                provider: "cursor".to_string(),
                model: "gpt-5".to_string(),
                tokens: Tokens {
                    input: 100,
                    output: 20,
                    ..Default::default()
                },
            },
        ];
        assert_eq!(events, want);

        let stats = parsed.stats.expect("cursor should be detected");
        assert_eq!(stats.agent, "cursor");
        assert_eq!(stats.files, 1);
        assert_eq!(stats.bytes, file_size);
        assert_eq!(stats.events, 2);
        assert_eq!(stats.input_tokens, 107);
        assert_eq!(stats.output_tokens, 23);
        assert_eq!(stats.cache_read_tokens, 0);
        assert_eq!(stats.cache_write_tokens, 0);
        assert_eq!(stats.reasoning_tokens, 0);
    }

    #[test]
    fn test_parse_cursor_without_kv_table() {
        let home = TempDir::new().unwrap();
        let db_path = cursor_db_path(home.path());
        std::fs::create_dir_all(db_path.parent().unwrap()).unwrap();
        {
            let conn = Connection::open(&db_path).unwrap();
            conn.execute("CREATE TABLE ItemTable (key TEXT, value BLOB)", [])
                .unwrap();
        }

        let mut events = Vec::new();
        let parsed = parse_cursor(home.path(), &mut |event| events.push(event));
        assert!(parsed.stats.is_none());
        assert!(events.is_empty());
    }
}
