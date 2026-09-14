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
                let Some(raw) = value_bytes(row.get_ref(1)?) else { continue };
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
            let Some((composer_id, _)) = rest.split_once(':') else { continue };
            if composer_id.is_empty() {
                continue;
            }
            let Some(composer) = composers.get(composer_id) else { continue };
            let Some(raw) = value_bytes(row.get_ref(1)?) else { continue };
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
