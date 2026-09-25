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
            let Ok(line) = serde_json::from_slice::<ClaudeLine>(raw) else {
                return;
            };
            let Some(message) = line.message else { return };
            let Some(usage) = message.usage else { return };
            if message.model.is_empty() || message.model == "<synthetic>" {
                return;
            }
            let Some(ts) = parse_timestamp(&line.timestamp) else {
                return;
            };
            // `output` still includes thinking here; it is split out after
            // dedupe so repeated lines merge on the raw totals.
            let tokens = Tokens {
                input: usage.input_tokens as i64,
                output: usage.output_tokens as i64,
                cache_read: usage.cache_read_input_tokens as i64,
                cache_write: usage.cache_creation_input_tokens as i64,
                reasoning: usage
                    .output_tokens_details
                    .map_or(0, |details| details.thinking_tokens as i64),
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
    for mut event in pending {
        event.tokens.output = (event.tokens.output - event.tokens.reasoning).max(0);
        buckets.add(event.tokens);
        emit(event);
    }
    Parsed {
        stats: Some(finish(
            "claude",
            started,
            files.len(),
            bytes,
            events,
            buckets,
        )),
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
            let Ok(line) = serde_json::from_slice::<CodexLine>(raw) else {
                return;
            };
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
            let Some(usage) = info.last_token_usage else {
                return;
            };
            // Codex re-emits token_count without a new turn (the cumulative total is
            // unchanged); counting last_token_usage again would double it.
            if let Some(total) = info.total_token_usage {
                if prev_total == Some(total) {
                    return;
                }
                prev_total = Some(total);
            }
            let Some(ts) = parse_timestamp(&line.timestamp) else {
                return;
            };
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
        stats: Some(finish(
            "codex",
            started,
            files.len(),
            bytes,
            events,
            buckets,
        )),
        error: join_errors(file_errors),
    }
}

pub fn parse_opencode(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let xdg_data_home = std::env::var_os("XDG_DATA_HOME")
        .filter(|value| !value.is_empty())
        .map(PathBuf::from);
    parse_opencode_at(&opencode_db_path(home, xdg_data_home.as_deref()), emit)
}

/// `$XDG_DATA_HOME/opencode/opencode.db`, falling back to `~/.local/share`.
fn opencode_db_path(home: &Path, xdg_data_home: Option<&Path>) -> PathBuf {
    let data_home = xdg_data_home
        .map(Path::to_path_buf)
        .unwrap_or_else(|| home.join(".local/share"));
    data_home.join("opencode/opencode.db")
}

fn parse_opencode_at(path: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let meta = match std::fs::metadata(path) {
        Ok(meta) => meta,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Parsed::default(),
        Err(error) => return failed(error),
    };
    let started = Instant::now();
    let mut run = || -> rusqlite::Result<(usize, Tokens)> {
        let conn = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
        let mut stmt = conn.prepare("SELECT data FROM message")?;
        let mut rows = stmt.query([])?;
        let mut buckets = Tokens::default();
        let mut events = 0;
        while let Some(row) = rows.next()? {
            let Some(raw) = value_bytes(row.get_ref(0)?) else {
                continue;
            };
            if raw.is_empty() {
                continue;
            }
            let Ok(message) = serde_json::from_slice::<OpenCodeMessage>(raw) else {
                continue;
            };
            if message.role != "assistant" {
                continue;
            }
            let (Some(tokens), Some(created)) =
                (message.tokens, message.time.and_then(|time| time.created))
            else {
                continue;
            };
            let Some(ts) = Utc.timestamp_millis_opt(created as i64).single() else {
                continue;
            };
            let output = tokens.output.unwrap_or(0.0) as i64;
            let reasoning = tokens.reasoning.unwrap_or(0.0) as i64;
            let cache = tokens.cache.as_ref();
            let tokens = Tokens {
                input: tokens.input.unwrap_or(0.0) as i64,
                output: if output < reasoning {
                    0
                } else {
                    output - reasoning
                },
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
    #[serde(default)]
    output_tokens_details: Option<ClaudeOutputDetails>,
}

#[derive(Deserialize, Clone, Copy)]
struct ClaudeOutputDetails {
    #[serde(default, deserialize_with = "null_f64")]
    thinking_tokens: f64,
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

/// `pub(crate)` so `collect.rs`'s tests can reuse the fixture seeding helpers.
#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::collect::ParserStats;
    use chrono::Timelike;
    use std::fs;
    use tempfile::TempDir;

    fn testdata_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("testdata")
    }

    /// Recursively copies every file under `src` into the same relative
    /// position under `dst`, creating directories as needed.
    fn copy_tree(src: &Path, dst: &Path) {
        for entry in WalkDir::new(src).into_iter().filter_map(Result::ok) {
            if !entry.file_type().is_file() {
                continue;
            }
            let rel = entry.path().strip_prefix(src).expect("relative path");
            let target = dst.join(rel);
            fs::create_dir_all(target.parent().unwrap()).expect("create parent dir");
            fs::copy(entry.path(), &target).expect("copy fixture file");
        }
    }

    pub(crate) fn seed_claude(home: &Path) {
        copy_tree(
            &testdata_dir().join("claude/project-a"),
            &home.join(".claude/projects/project-a"),
        );
        copy_tree(
            &testdata_dir().join("claude/project-b"),
            &home.join(".config/claude/projects/project-b"),
        );
    }

    pub(crate) fn seed_codex(home: &Path) {
        copy_tree(&testdata_dir().join("codex"), &home.join(".codex"));
    }

    fn write_message_db(path: &Path, rows: &[(&str, Option<&str>)]) {
        fs::create_dir_all(path.parent().unwrap()).expect("create db dir");
        let conn = Connection::open(path).expect("open sqlite db");
        conn.execute("CREATE TABLE message (id TEXT PRIMARY KEY, data TEXT)", [])
            .expect("create table");
        for (id, data) in rows {
            conn.execute(
                "INSERT INTO message (id, data) VALUES (?1, ?2)",
                rusqlite::params![id, data],
            )
            .expect("insert row");
        }
    }

    fn opencode_created() -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 9, 12, 12, 0, 0).unwrap()
    }

    /// Same fixture rows as the Go collector's `seedOpenCode`.
    pub(crate) fn seed_opencode(data_home: &Path) -> PathBuf {
        let created = opencode_created().timestamp_millis();
        let path = data_home.join("opencode/opencode.db");
        let m1 = format!(
            r#"{{"role":"assistant","providerID":"anthropic","modelID":"claude-sonnet-4-5","time":{{"created":{created}}},"tokens":{{"input":10,"output":20,"reasoning":5,"cache":{{"read":30,"write":40}}}}}}"#
        );
        let m8 = format!(
            r#"{{"role":"assistant","time":{{"created":{created}}},"tokens":{{"output":3,"reasoning":9}}}}"#
        );
        let rows: Vec<(&str, Option<&str>)> = vec![
            ("m1", Some(m1.as_str())),
            (
                "m2",
                Some(r#"{"role":"user","time":{"created":1},"tokens":{"input":99}}"#),
            ),
            ("m3", Some("{not json")),
            ("m4", None),
            ("m5", Some("")),
            ("m6", Some(r#"{"role":"assistant","tokens":{"input":99}}"#)),
            ("m7", Some(r#"{"role":"assistant","time":{"created":1}}"#)),
            ("m8", Some(m8.as_str())),
        ];
        write_message_db(&path, &rows);
        path
    }

    fn ts(value: &str) -> DateTime<Utc> {
        parse_timestamp(value).expect("valid fixture timestamp")
    }

    fn collect_events(parse: impl FnOnce(&mut dyn FnMut(UsageEvent))) -> Vec<UsageEvent> {
        let mut events = Vec::new();
        parse(&mut |event| events.push(event));
        events
    }

    fn without_duration(mut stats: ParserStats) -> ParserStats {
        stats.duration_ms = 0;
        stats
    }

    #[test]
    fn test_parse_claude() {
        let home = TempDir::new().unwrap();
        seed_claude(home.path());

        let mut events = Vec::new();
        let parsed = parse_claude(home.path(), &mut |event| events.push(event));
        let stats = parsed.stats.expect("claude should be detected");
        assert!(parsed.error.is_none());

        assert_eq!(
            events,
            vec![
                UsageEvent {
                    ts: ts("2026-09-12T15:30:00Z"),
                    agent: "claude",
                    provider: String::new(),
                    model: "claude-sonnet-4-5".to_string(),
                    tokens: Tokens {
                        input: 100,
                        output: 30,
                        cache_read: 1000,
                        cache_write: 200,
                        reasoning: 20
                    },
                },
                UsageEvent {
                    ts: ts("2026-09-12T16:30:00Z"),
                    agent: "claude",
                    provider: String::new(),
                    model: "claude-sonnet-4-5".to_string(),
                    tokens: Tokens {
                        input: 10,
                        output: 5,
                        ..Default::default()
                    },
                },
                UsageEvent {
                    ts: ts("2026-09-13T01:00:00Z"),
                    agent: "claude",
                    provider: String::new(),
                    model: "claude-opus-4-1".to_string(),
                    tokens: Tokens {
                        input: 1,
                        output: 2,
                        cache_read: 3,
                        cache_write: 4,
                        reasoning: 0
                    },
                },
            ]
        );

        let bytes = fs::metadata(home.path().join(".claude/projects/project-a/session.jsonl"))
            .unwrap()
            .len()
            + fs::metadata(
                home.path()
                    .join(".config/claude/projects/project-b/resumed.jsonl"),
            )
            .unwrap()
            .len();
        assert_eq!(
            without_duration(stats),
            ParserStats {
                agent: "claude".to_string(),
                duration_ms: 0,
                files: 2,
                bytes,
                events: 3,
                input_tokens: 111,
                output_tokens: 37,
                cache_read_tokens: 1003,
                cache_write_tokens: 204,
                reasoning_tokens: 20,
            }
        );
    }

    #[test]
    fn test_parse_claude_dedup() {
        let ts_str = "2026-09-12T10:00:00Z";
        let line = |timestamp: &str,
                    message_id: &str,
                    request_id: &str,
                    uuid: &str,
                    input: i64|
         -> String {
            format!(
                r#"{{"timestamp":"{timestamp}","requestId":"{request_id}","uuid":"{uuid}","message":{{"id":"{message_id}","model":"claude-sonnet-4-5","usage":{{"input_tokens":{input}}}}}}}"#
            )
        };

        let cases: Vec<(&str, Vec<String>, usize, i64)> = vec![
            (
                "same message id counted once",
                vec![
                    line(ts_str, "msg_1", "req_1", "u1", 10),
                    line(ts_str, "msg_1", "req_1", "u2", 10),
                ],
                1,
                10,
            ),
            (
                "largest streamed usage wins",
                vec![
                    line(ts_str, "msg_1", "", "u1", 10),
                    line(ts_str, "msg_1", "", "u2", 99),
                    line(ts_str, "msg_1", "", "u3", 50),
                ],
                1,
                99,
            ),
            (
                "request id used without message id",
                vec![
                    line(ts_str, "", "req_1", "u1", 10),
                    line(ts_str, "", "req_1", "u2", 10),
                ],
                1,
                10,
            ),
            (
                "uuid used without message or request id",
                vec![
                    line(ts_str, "", "", "u1", 10),
                    line(ts_str, "", "", "u1", 10),
                ],
                1,
                10,
            ),
            (
                "message id takes precedence over request id",
                vec![
                    line(ts_str, "msg_1", "req_1", "u1", 10),
                    line(ts_str, "msg_2", "req_1", "u2", 5),
                ],
                2,
                15,
            ),
            (
                "skipped line does not reserve its id",
                vec![
                    line("bad", "msg_1", "", "u1", 99),
                    line(ts_str, "msg_1", "", "u2", 10),
                ],
                1,
                10,
            ),
            (
                "no ids never deduplicated",
                vec![line(ts_str, "", "", "", 10), line(ts_str, "", "", "", 10)],
                2,
                20,
            ),
        ];

        for (name, lines, want_events, want_input) in cases {
            let home = TempDir::new().unwrap();
            let dir = home.path().join(".claude/projects/p");
            fs::create_dir_all(&dir).unwrap();
            let body = lines.join("\n") + "\n";
            fs::write(dir.join("s.jsonl"), body).unwrap();

            let events = collect_events(|emit| {
                parse_claude(home.path(), emit);
            });
            let stats = parse_claude(home.path(), &mut |_| {}).stats.unwrap();
            assert_eq!(events.len(), want_events, "{name}: events len");
            assert_eq!(stats.events, want_events, "{name}: stats.events");
            assert_eq!(stats.input_tokens, want_input, "{name}: input tokens");
        }
    }

    #[test]
    fn test_parse_codex() {
        let home = TempDir::new().unwrap();
        seed_codex(home.path());

        let mut events = Vec::new();
        let parsed = parse_codex(home.path(), &mut |event| events.push(event));
        let stats = parsed.stats.expect("codex should be detected");
        assert!(parsed.error.is_none());

        assert_eq!(
            events,
            vec![
                // Logged before the first turn_context, so it takes the session's first model.
                UsageEvent {
                    ts: ts("2026-09-12T15:00:00.500Z"),
                    agent: "codex",
                    provider: String::new(),
                    model: "gpt-5-codex".to_string(),
                    tokens: Tokens {
                        input: 4,
                        output: 2,
                        ..Default::default()
                    },
                },
                // input excludes cached tokens, output excludes reasoning tokens. The
                // repeat with an unchanged cumulative total is skipped.
                UsageEvent {
                    ts: ts("2026-09-12T15:59:59.999Z"),
                    agent: "codex",
                    provider: String::new(),
                    model: "gpt-5-codex".to_string(),
                    tokens: Tokens {
                        input: 200,
                        output: 100,
                        cache_read: 800,
                        reasoning: 200,
                        ..Default::default()
                    },
                },
                // Subtractions clamp at zero.
                UsageEvent {
                    ts: ts("2026-09-12T16:00:00Z"),
                    agent: "codex",
                    provider: String::new(),
                    model: "gpt-5-codex".to_string(),
                    tokens: Tokens {
                        cache_read: 10,
                        reasoning: 4,
                        ..Default::default()
                    },
                },
                // The model does not leak across files.
                UsageEvent {
                    ts: ts("2026-09-11T10:00:00Z"),
                    agent: "codex",
                    provider: String::new(),
                    model: "unknown".to_string(),
                    tokens: Tokens {
                        input: 7,
                        output: 3,
                        ..Default::default()
                    },
                },
            ]
        );

        let bytes = fs::metadata(home.path().join(".codex/sessions/2026/09/12/rollout.jsonl"))
            .unwrap()
            .len()
            + fs::metadata(home.path().join(".codex/archived_sessions/early.jsonl"))
                .unwrap()
                .len();
        assert_eq!(
            without_duration(stats),
            ParserStats {
                agent: "codex".to_string(),
                duration_ms: 0,
                files: 2,
                bytes,
                events: 4,
                input_tokens: 211,
                output_tokens: 105,
                cache_read_tokens: 810,
                cache_write_tokens: 0,
                reasoning_tokens: 204,
            }
        );
    }

    #[test]
    fn test_parse_opencode() {
        let data_home = TempDir::new().unwrap();
        let path = seed_opencode(data_home.path());

        let mut events = Vec::new();
        let parsed = parse_opencode_at(&path, &mut |event| events.push(event));
        let stats = parsed.stats.expect("opencode should be detected");
        assert!(parsed.error.is_none());

        assert_eq!(
            events,
            vec![
                UsageEvent {
                    ts: opencode_created(),
                    agent: "opencode",
                    provider: "anthropic".to_string(),
                    model: "claude-sonnet-4-5".to_string(),
                    tokens: Tokens {
                        input: 10,
                        output: 15,
                        cache_read: 30,
                        cache_write: 40,
                        reasoning: 5
                    },
                },
                UsageEvent {
                    ts: opencode_created(),
                    agent: "opencode",
                    provider: "unknown".to_string(),
                    model: "unknown".to_string(),
                    tokens: Tokens {
                        reasoning: 9,
                        ..Default::default()
                    },
                },
            ]
        );

        let bytes = fs::metadata(&path).unwrap().len();
        assert_eq!(
            without_duration(stats),
            ParserStats {
                agent: "opencode".to_string(),
                duration_ms: 0,
                files: 1,
                bytes,
                events: 2,
                input_tokens: 10,
                output_tokens: 15,
                cache_read_tokens: 30,
                cache_write_tokens: 40,
                reasoning_tokens: 14,
            }
        );
    }

    #[test]
    fn test_opencode_db_path() {
        let home = Path::new("/home/user");
        assert_eq!(
            opencode_db_path(home, None),
            home.join(".local/share/opencode/opencode.db")
        );

        let xdg = Path::new("/custom/xdg");
        assert_eq!(
            opencode_db_path(home, Some(xdg)),
            xdg.join("opencode/opencode.db")
        );
    }

    #[test]
    fn test_parsers_not_detected() {
        let home = TempDir::new().unwrap();

        let claude = parse_claude(home.path(), &mut |_| panic!("claude should emit nothing"));
        assert!(claude.stats.is_none());
        assert!(claude.error.is_none());

        let codex = parse_codex(home.path(), &mut |_| panic!("codex should emit nothing"));
        assert!(codex.stats.is_none());
        assert!(codex.error.is_none());

        let opencode = parse_opencode(home.path(), &mut |_| panic!("opencode should emit nothing"));
        assert!(opencode.stats.is_none());
        assert!(opencode.error.is_none());
    }

    #[test]
    fn test_parse_timestamp() {
        let nano_ts = Utc
            .with_ymd_and_hms(2026, 9, 12, 15, 30, 0)
            .unwrap()
            .with_nanosecond(123456789)
            .unwrap();
        let cases: Vec<(&str, Option<DateTime<Utc>>)> = vec![
            ("2026-09-12T15:30:00Z", Some(ts("2026-09-12T15:30:00Z"))),
            ("2026-09-12T15:30:00.123456789Z", Some(nano_ts)),
            (
                "2026-09-12T23:30:00+08:00",
                Some(ts("2026-09-12T15:30:00Z")),
            ),
            ("", None),
            ("2026-09-12 15:30:00", None),
            ("not-a-time", None),
        ];
        for (value, want) in cases {
            assert_eq!(parse_timestamp(value), want, "parse_timestamp({value:?})");
        }
    }

    #[test]
    fn test_list_jsonl_missing_root() {
        let dir = TempDir::new().unwrap();
        let (files, size) = list_jsonl(&dir.path().join("missing"));
        assert!(files.is_empty());
        assert_eq!(size, 0);
    }
}
