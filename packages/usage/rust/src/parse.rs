use crate::collect::{Parsed, Tokens, UsageEvent, finish};
use chrono::{DateTime, TimeZone, Utc};
use rusqlite::{Connection, OpenFlags, types::ValueRef};
use serde::{Deserialize, Deserializer};
use std::collections::HashMap;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::time::Instant;
use walkdir::WalkDir;

pub fn parse_claude(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let roots = [
        home.join(".claude/projects"),
        home.join(".config/claude/projects"),
        home.join("Library/Developer/Xcode/CodingAssistant/ClaudeAgentConfig/projects"),
    ];
    if !roots.iter().any(|root| root.exists()) {
        return Parsed::default();
    }
    let started = Instant::now();
    let (files, bytes) = list_jsonl_roots(&roots);
    // Streaming writes one line per content block with the same message.id, and
    // usage grows until the final line, so keep the largest value per field.
    let mut seen: HashMap<String, usize> = HashMap::new();
    let mut pending: Vec<UsageEvent> = Vec::new();
    let mut file_errors = Vec::new();
    for file in &files {
        let result = each_jsonl(file, |raw| {
            let Ok(line) = serde_json::from_slice::<ClaudeLine>(raw) else { return };
            let Some(message) = line.message else { return };
            let Some(usage) = message.usage else { return };
            if message.model.is_empty() || message.model == "<synthetic>" {
                return;
            }
            let Some(ts) = parse_timestamp(&line.timestamp) else { return };
            let tokens = Tokens {
                input: usage.input_tokens as i64,
                output: usage.output_tokens as i64,
                cache_read: usage.cache_read_input_tokens as i64,
                cache_write: usage.cache_creation_input_tokens as i64,
                reasoning: 0,
            };
            let key = [&message.id, &line.request_id, &line.uuid]
                .into_iter()
                .find(|value| !value.is_empty())
                .cloned();
            if let Some(key) = key {
                if let Some(&index) = seen.get(&key) {
                    pending[index].tokens.keep_max(tokens);
                    return;
                }
                seen.insert(key, pending.len());
            }
            pending.push(UsageEvent {
                ts,
                agent: "claude",
                provider: String::new(),
                model: message.model,
                tokens,
            });
        });
        if let Err(error) = result {
            file_errors.push(format!("{}: {error}", file.display()));
        }
    }
    let mut buckets = Tokens::default();
    let events = pending.len();
    for event in pending {
        buckets.add(event.tokens);
        emit(event);
    }
    Parsed {
        stats: Some(finish("claude", started, files.len(), bytes, events, buckets)),
        error: join_errors(file_errors),
    }
}

pub fn parse_codex(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let roots = [
        home.join(".codex/sessions"),
        home.join(".codex/archived_sessions"),
        home.join("Library/Developer/Xcode/CodingAssistant/codex/sessions"),
    ];
    if !roots.iter().any(|root| root.exists()) {
        return Parsed::default();
    }
    let started = Instant::now();
    let (files, bytes) = list_jsonl_roots(&roots);
    let mut buckets = Tokens::default();
    let mut events = 0;
    let mut file_errors = Vec::new();
    for file in &files {
        let mut current_model = String::new();
        let mut first_model = String::new();
        let mut prev_total: Option<CodexTokenUsage> = None;
        let mut file_events: Vec<UsageEvent> = Vec::new();
        let result = each_jsonl(file, |raw| {
            let Ok(line) = serde_json::from_slice::<CodexLine>(raw) else { return };
            let Some(payload) = line.payload else { return };
            if !payload.model.is_empty() {
                current_model = payload.model;
                if first_model.is_empty() {
                    first_model = current_model.clone();
                }
            }
            if payload.kind != "token_count" {
                return;
            }
            let Some(info) = payload.info else { return };
            let Some(usage) = info.last_token_usage else { return };
            // Codex re-emits token_count without a new turn (the cumulative total is
            // unchanged); counting last_token_usage again would double it.
            if let Some(total) = info.total_token_usage {
                if prev_total == Some(total) {
                    return;
                }
                prev_total = Some(total);
            }
            let Some(ts) = parse_timestamp(&line.timestamp) else { return };
            let cached = usage.cached_input_tokens as i64;
            let reasoning = usage.reasoning_output_tokens as i64;
            file_events.push(UsageEvent {
                ts,
                agent: "codex",
                provider: String::new(),
                model: current_model.clone(),
                tokens: Tokens {
                    input: (usage.input_tokens as i64 - cached).max(0),
                    output: (usage.output_tokens as i64 - reasoning).max(0),
                    cache_read: cached,
                    cache_write: 0,
                    reasoning,
                },
            });
        });
        if let Err(error) = result {
            file_errors.push(format!("{}: {error}", file.display()));
        }
        // token_count can precede the first turn_context, so attribute those
        // events to the session's first model.
        if first_model.is_empty() {
            first_model = "unknown".to_string();
        }
        for mut event in file_events {
            if event.model.is_empty() {
                event.model = first_model.clone();
            }
            events += 1;
            buckets.add(event.tokens);
            emit(event);
        }
    }
    Parsed {
        stats: Some(finish("codex", started, files.len(), bytes, events, buckets)),
        error: join_errors(file_errors),
    }
}

pub fn parse_opencode(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let data_home = std::env::var_os("XDG_DATA_HOME")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| home.join(".local/share"));
    let path = data_home.join("opencode/opencode.db");
    let meta = match std::fs::metadata(&path) {
        Ok(meta) => meta,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Parsed::default(),
        Err(error) => return failed(error),
    };
    let started = Instant::now();
    let mut run = || -> rusqlite::Result<(usize, Tokens)> {
        let conn = Connection::open_with_flags(&path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        let mut stmt = conn.prepare("SELECT data FROM message")?;
        let mut rows = stmt.query([])?;
        let mut buckets = Tokens::default();
        let mut events = 0;
        while let Some(row) = rows.next()? {
            let Some(raw) = value_bytes(row.get_ref(0)?) else { continue };
            if raw.is_empty() {
                continue;
            }
            let Ok(message) = serde_json::from_slice::<OpenCodeMessage>(raw) else { continue };
            if message.role != "assistant" {
                continue;
            }
            let (Some(tokens), Some(created)) =
                (message.tokens, message.time.and_then(|time| time.created))
            else {
                continue;
            };
            let Some(ts) = Utc.timestamp_millis_opt(created as i64).single() else { continue };
            let output = tokens.output.unwrap_or(0.0) as i64;
            let reasoning = tokens.reasoning.unwrap_or(0.0) as i64;
            let cache = tokens.cache.as_ref();
            let tokens = Tokens {
                input: tokens.input.unwrap_or(0.0) as i64,
                output: if output < reasoning { 0 } else { output - reasoning },
                cache_read: cache.and_then(|c| c.read).unwrap_or(0.0) as i64,
                cache_write: cache.and_then(|c| c.write).unwrap_or(0.0) as i64,
                reasoning,
            };
            events += 1;
            buckets.add(tokens);
            emit(UsageEvent {
                ts,
                agent: "opencode",
                provider: or_unknown(message.provider_id),
                model: or_unknown(message.model_id),
                tokens,
            });
        }
        Ok((events, buckets))
    };
    match run() {
        Ok((events, buckets)) => Parsed {
            stats: Some(finish("opencode", started, 1, meta.len(), events, buckets)),
            error: None,
        },
        Err(error) => failed(error),
    }
}

pub fn failed(error: impl std::fmt::Display) -> Parsed {
    Parsed {
        stats: None,
        error: Some(error.to_string()),
    }
}

fn or_unknown(value: String) -> String {
    if value.is_empty() {
        "unknown".to_string()
    } else {
        value
    }
}

fn join_errors(errors: Vec<String>) -> Option<String> {
    (!errors.is_empty()).then(|| errors.join("\n"))
}

pub fn value_bytes(value: ValueRef<'_>) -> Option<&[u8]> {
    match value {
        ValueRef::Text(bytes) | ValueRef::Blob(bytes) => Some(bytes),
        _ => None,
    }
}

/// JSON `null` decodes to 0, matching Go's zero value.
fn null_f64<'de, D: Deserializer<'de>>(d: D) -> Result<f64, D::Error> {
    Ok(Option::<f64>::deserialize(d)?.unwrap_or(0.0))
}

/// JSON `null` decodes to "", matching Go's zero value.
fn null_string<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
    Ok(Option::<String>::deserialize(d)?.unwrap_or_default())
}

#[derive(Deserialize)]
struct ClaudeUsage {
    #[serde(default, deserialize_with = "null_f64")]
    input_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    output_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    cache_creation_input_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    cache_read_input_tokens: f64,
}

#[derive(Deserialize)]
struct ClaudeMessage {
    #[serde(default, deserialize_with = "null_string")]
    id: String,
    #[serde(default, deserialize_with = "null_string")]
    model: String,
    #[serde(default)]
    usage: Option<ClaudeUsage>,
}

#[derive(Deserialize)]
struct ClaudeLine {
    #[serde(default, deserialize_with = "null_string")]
    timestamp: String,
    #[serde(default, rename = "requestId", deserialize_with = "null_string")]
    request_id: String,
    #[serde(default, deserialize_with = "null_string")]
    uuid: String,
    #[serde(default)]
    message: Option<ClaudeMessage>,
}

#[derive(Deserialize, Clone, Copy, PartialEq)]
struct CodexTokenUsage {
    #[serde(default, deserialize_with = "null_f64")]
    input_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    cached_input_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    output_tokens: f64,
    #[serde(default, deserialize_with = "null_f64")]
    reasoning_output_tokens: f64,
}

#[derive(Deserialize)]
struct CodexInfo {
    #[serde(default)]
    last_token_usage: Option<CodexTokenUsage>,
    #[serde(default)]
    total_token_usage: Option<CodexTokenUsage>,
}

#[derive(Deserialize)]
struct CodexPayload {
    #[serde(default, rename = "type", deserialize_with = "null_string")]
    kind: String,
    #[serde(default, deserialize_with = "null_string")]
    model: String,
    #[serde(default)]
    info: Option<CodexInfo>,
}

#[derive(Deserialize)]
struct CodexLine {
    #[serde(default, deserialize_with = "null_string")]
    timestamp: String,
    #[serde(default)]
    payload: Option<CodexPayload>,
}

#[derive(Deserialize)]
struct OpenCodeCache {
    #[serde(default)]
    read: Option<f64>,
    #[serde(default)]
    write: Option<f64>,
}

#[derive(Deserialize)]
struct OpenCodeTime {
    #[serde(default)]
    created: Option<f64>,
}

#[derive(Deserialize)]
struct OpenCodeTokens {
    #[serde(default)]
    input: Option<f64>,
    #[serde(default)]
    output: Option<f64>,
    #[serde(default)]
    reasoning: Option<f64>,
    #[serde(default)]
    cache: Option<OpenCodeCache>,
}

#[derive(Deserialize)]
struct OpenCodeMessage {
    #[serde(default, deserialize_with = "null_string")]
    role: String,
    #[serde(default, rename = "providerID", deserialize_with = "null_string")]
    provider_id: String,
    #[serde(default, rename = "modelID", deserialize_with = "null_string")]
    model_id: String,
    #[serde(default)]
    time: Option<OpenCodeTime>,
    #[serde(default)]
    tokens: Option<OpenCodeTokens>,
}

pub fn list_jsonl_roots(roots: &[PathBuf]) -> (Vec<PathBuf>, u64) {
    let mut files = Vec::new();
    let mut bytes = 0;
    for root in roots {
        let (found, size) = list_jsonl(root);
        files.extend(found);
        bytes += size;
    }
    (files, bytes)
}

/// Regular `.jsonl` files under `root` in lexical order; a missing or
/// unreadable root yields nothing.
pub fn list_jsonl(root: &Path) -> (Vec<PathBuf>, u64) {
    let mut files = Vec::new();
    let mut bytes = 0;
    for entry in WalkDir::new(root)
        .sort_by_file_name()
        .into_iter()
        .filter_map(Result::ok)
    {
        if !entry.file_type().is_file() || !entry.file_name().to_string_lossy().ends_with(".jsonl")
        {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        bytes += meta.len();
        files.push(entry.into_path());
    }
    (files, bytes)
}

pub fn each_jsonl(path: &Path, mut f: impl FnMut(&[u8])) -> std::io::Result<()> {
    let mut reader = BufReader::with_capacity(1 << 20, File::open(path)?);
    let mut buf = Vec::with_capacity(1 << 16);
    loop {
        buf.clear();
        if reader.read_until(b'\n', &mut buf)? == 0 {
            return Ok(());
        }
        let line = buf.trim_ascii();
        if !line.is_empty() {
            f(line);
        }
    }
}

pub fn parse_timestamp(value: &str) -> Option<DateTime<Utc>> {
    if value.is_empty() {
        return None;
    }
    DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|ts| ts.with_timezone(&Utc))
}
