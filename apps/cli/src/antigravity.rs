use crate::collect::{Parsed, Tokens, UsageEvent, finish};
use chrono::{DateTime, Utc};
use rusqlite::{Connection, OpenFlags};
use std::collections::BTreeMap;
use std::path::Path;
use std::time::Instant;
use walkdir::WalkDir;

/// Antigravity CLI persists SQLite trajectories with protobuf step metadata.
/// Read only usage metadata, never prompts or tool payloads. This layout was
/// verified against local agy recordings; it is not a public storage contract.
pub fn parse_antigravity(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let root = home.join(".gemini/antigravity-cli/conversations");
    let started = Instant::now();
    let mut files = 0;
    let mut bytes = 0;
    let mut errors = Vec::new();
    let mut events = BTreeMap::<String, UsageEvent>::new();
    for entry in WalkDir::new(&root).sort_by_file_name() {
        let entry = match entry {
            Ok(entry) => entry,
            Err(error) => {
                if root.exists() {
                    errors.push(error.to_string());
                }
                continue;
            }
        };
        if !entry.file_type().is_file() || entry.path().extension().is_none_or(|ext| ext != "db") {
            continue;
        }
        files += 1;
        if let Ok(meta) = entry.metadata() {
            bytes += meta.len();
        }
        // WAL data is part of live sessions; do not use SQLite's immutable mode.
        let mut run = || -> anyhow::Result<Vec<(String, UsageEvent)>> {
            let conn = Connection::open_with_flags(entry.path(), OpenFlags::SQLITE_OPEN_READ_ONLY)?;
            let mut stmt = conn.prepare(
                "SELECT idx, metadata FROM steps WHERE metadata IS NOT NULL ORDER BY idx",
            )?;
            let mut rows = stmt.query([])?;
            let session = entry.path().file_stem().unwrap().to_string_lossy();
            let mut found = Vec::new();
            while let Some(row) = rows.next()? {
                let idx: i64 = row.get(0)?;
                let raw: Vec<u8> = row.get(1)?;
                match map_step(&raw, &session, idx) {
                    Ok(Some(event)) => found.push(event),
                    Ok(None) => {}
                    Err(error) => {
                        errors.push(format!("{}: step {idx}: {error}", entry.path().display()))
                    }
                }
            }
            Ok(found)
        };
        match run() {
            Ok(found) => {
                for (key, event) in found {
                    events
                        .entry(key)
                        .and_modify(|old| old.tokens.keep_max(event.tokens))
                        .or_insert(event);
                }
            }
            Err(error) => errors.push(format!("{}: {error}", entry.path().display())),
        }
    }
    if files == 0 && errors.is_empty() {
        return Parsed::default();
    }
    let count = events.len();
    let mut buckets = Tokens::default();
    for event in events.into_values() {
        buckets.add(event.tokens);
        emit(event);
    }
    Parsed {
        stats: Some(finish("antigravity", started, files, bytes, count, buckets)),
        error: (!errors.is_empty()).then(|| errors.join("\n")),
    }
}

fn map_step(raw: &[u8], session: &str, idx: i64) -> anyhow::Result<Option<(String, UsageEvent)>> {
    let meta = Fields::decode(raw)?;
    let Some(raw_usage) = meta.bytes(9) else {
        return Ok(None);
    };
    let usage = Fields::decode(raw_usage)?;
    let source = meta.bytes(20).map(Fields::decode).transpose()?;
    let session = source
        .as_ref()
        .and_then(|source| source.text(4))
        .filter(|id| !id.is_empty())
        .unwrap_or(session);
    let model_id = usage.int(1)?;
    if model_id == 0 {
        return Ok(None);
    }
    let provider = match usage.int(6)? {
        3 | 24 | 30 => "google",
        26 => "anthropic",
        31 => "openai",
        _ => "antigravity",
    };
    let model_info = meta.bytes(24).map(Fields::decode).transpose()?;
    let model = model_info
        .as_ref()
        .and_then(|info| {
            info.text(12)
                .filter(|model| !model.is_empty())
                .or_else(|| info.text(8).filter(|model| !model.is_empty()))
        })
        .map(str::to_string)
        // Model enums are often PLACEHOLDER_M<n>. Keep their identity instead
        // of guessing a Gemini/Claude version and assigning the wrong price.
        .unwrap_or_else(|| format!("antigravity-model-{model_id}"));
    let ts = [8, 7, 1].into_iter().find_map(|field| {
        let timestamp = Fields::decode(meta.bytes(field)?).ok()?;
        DateTime::<Utc>::from_timestamp(
            timestamp.int(1).ok()?,
            timestamp.int(2).ok()?.try_into().ok()?,
        )
    });
    let Some(ts) = ts else { return Ok(None) };
    let tokens = Tokens {
        // ModelUsageStats.input_tokens already excludes cache reads/writes.
        // output_tokens = response_output_tokens + thinking_output_tokens.
        input: usage.int(2)?,
        output: (usage.int(3)? - usage.int(9)?).max(0),
        cache_read: usage.int(5)?,
        cache_write: usage.int(4)?,
        reasoning: usage.int(9)?,
    };
    if tokens == Tokens::default() {
        return Ok(None);
    }
    // Provider response/message ids identify paid calls copied into forks.
    let request = usage
        .text(11)
        .filter(|id| !id.is_empty())
        .or_else(|| usage.text(12).filter(|id| !id.is_empty()))
        .or_else(|| usage.text(7).filter(|id| !id.is_empty()));
    let key = request
        .map(|id| format!("{provider}|{model}|{id}"))
        .unwrap_or_else(|| format!("{session}|{idx}"));
    Ok(Some((
        key,
        UsageEvent {
            ts,
            agent: "antigravity",
            provider: provider.to_string(),
            model,
            session: session.to_string(),
            tokens,
        },
    )))
}

enum WireValue<'a> {
    Int(u64),
    Bytes(&'a [u8]),
    Other,
}
struct Fields<'a>(Vec<(u64, WireValue<'a>)>);

/// Minimal protobuf wire reader: skip unknown fields without depending on the
/// application's private protobuf package. Reject truncation and overflow.
impl<'a> Fields<'a> {
    fn decode(mut raw: &'a [u8]) -> anyhow::Result<Self> {
        let mut fields = Vec::new();
        while !raw.is_empty() {
            let tag = varint(&mut raw)?;
            anyhow::ensure!(tag >> 3 != 0, "invalid protobuf field");
            let value = match tag & 7 {
                0 => WireValue::Int(varint(&mut raw)?),
                2 => {
                    let len = usize::try_from(varint(&mut raw)?)?;
                    anyhow::ensure!(len <= raw.len(), "truncated protobuf field");
                    let (value, rest) = raw.split_at(len);
                    raw = rest;
                    WireValue::Bytes(value)
                }
                1 | 5 => {
                    let len = if tag & 7 == 1 { 8 } else { 4 };
                    anyhow::ensure!(len <= raw.len(), "truncated protobuf field");
                    raw = &raw[len..];
                    WireValue::Other
                }
                _ => anyhow::bail!("unsupported protobuf wire type"),
            };
            fields.push((tag >> 3, value));
        }
        Ok(Self(fields))
    }
    fn int(&self, field: u64) -> anyhow::Result<i64> {
        match self.0.iter().rev().find(|(id, _)| *id == field) {
            Some((_, WireValue::Int(value))) => Ok(i64::try_from(*value)?),
            Some(_) => anyhow::bail!("invalid integer field {field}"),
            None => Ok(0),
        }
    }
    fn bytes(&self, field: u64) -> Option<&'a [u8]> {
        self.0.iter().rev().find_map(|(id, value)| match value {
            WireValue::Bytes(value) if *id == field => Some(*value),
            _ => None,
        })
    }
    fn text(&self, field: u64) -> Option<&'a str> {
        std::str::from_utf8(self.bytes(field)?).ok()
    }
}

fn varint(raw: &mut &[u8]) -> anyhow::Result<u64> {
    let mut value = 0;
    for shift in (0..=63).step_by(7) {
        let (&byte, rest) = raw
            .split_first()
            .ok_or_else(|| anyhow::anyhow!("truncated protobuf varint"))?;
        *raw = rest;
        anyhow::ensure!(shift != 63 || byte <= 1, "overflowing protobuf varint");
        value |= u64::from(byte & 127) << shift;
        if byte < 128 {
            return Ok(value);
        }
    }
    anyhow::bail!("overflowing protobuf varint")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn encode_varint(mut value: u64) -> Vec<u8> {
        let mut out = Vec::new();
        while value >= 128 {
            out.push((value as u8 & 127) | 128);
            value >>= 7;
        }
        out.push(value as u8);
        out
    }
    fn integer(field: u64, value: u64) -> Vec<u8> {
        [encode_varint(field << 3), encode_varint(value)].concat()
    }
    fn bytes(field: u64, value: &[u8]) -> Vec<u8> {
        [
            encode_varint(field << 3 | 2),
            encode_varint(value.len() as u64),
            value.to_vec(),
        ]
        .concat()
    }
    fn metadata(provider: u64, request: &str, named: bool) -> Vec<u8> {
        let counts = [
            integer(1, 1319),
            integer(2, 100),
            integer(3, 30),
            integer(4, 5),
            integer(5, 160),
            integer(6, provider),
            integer(9, 10),
            bytes(11, request.as_bytes()),
        ]
        .concat();
        let mut meta = [
            bytes(1, &integer(1, 1_759_680_000)),
            bytes(9, &counts),
            bytes(20, &bytes(4, b"original-session")),
            bytes(99, b"unknown field"),
        ]
        .concat();
        if named {
            meta.extend(bytes(24, &bytes(12, b"gemini-3.8-flash")));
        }
        meta
    }
    fn create_db(home: &Path, name: &str) -> Connection {
        let dir = home.join(".gemini/antigravity-cli/conversations");
        fs::create_dir_all(&dir).unwrap();
        let conn = Connection::open(dir.join(format!("{name}.db"))).unwrap();
        conn.execute(
            "CREATE TABLE steps (idx INTEGER PRIMARY KEY, metadata BLOB)",
            [],
        )
        .unwrap();
        conn
    }
    fn insert(conn: &Connection, idx: i64, raw: &[u8]) {
        conn.execute(
            "INSERT INTO steps VALUES (?1, ?2)",
            rusqlite::params![idx, raw],
        )
        .unwrap();
    }

    #[test]
    fn should_read_live_wal_and_deduplicate_forked_calls() {
        let home = tempfile::tempdir().unwrap();
        let conn = create_db(home.path(), "original-session");
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;")
            .unwrap();
        insert(&conn, 1, &metadata(24, "req-1", true));
        insert(&conn, 2, &metadata(26, "req-2", false));
        insert(&conn, 3, &bytes(1, &integer(1, 1_759_680_000)));
        let fork = create_db(home.path(), "fork");
        insert(&fork, 1, &metadata(24, "req-1", true));
        let mut events = Vec::new();
        let parsed = parse_antigravity(home.path(), &mut |event| events.push(event));
        assert!(parsed.error.is_none());
        let stats = parsed.stats.unwrap();
        assert_eq!((stats.files, stats.events), (2, 2));
        assert_eq!(stats.input_tokens, 200);
        assert_eq!(stats.output_tokens, 40);
        assert_eq!(stats.cache_read_tokens, 320);
        assert_eq!(stats.cache_write_tokens, 10);
        assert_eq!(stats.reasoning_tokens, 20);
        assert!(
            events
                .iter()
                .all(|event| event.session == "original-session")
        );
        assert!(
            events
                .iter()
                .any(|event| event.provider == "google" && event.model == "gemini-3.8-flash")
        );
        assert!(
            events
                .iter()
                .any(|event| event.provider == "anthropic"
                    && event.model == "antigravity-model-1319")
        );
    }

    #[test]
    fn should_warn_on_corruption_and_keep_good_steps_and_databases() {
        let home = tempfile::tempdir().unwrap();
        let conn = create_db(home.path(), "good");
        insert(&conn, 1, &metadata(24, "req-1", true));
        insert(&conn, 2, &[0x4a, 100, 0]);
        fs::write(
            home.path()
                .join(".gemini/antigravity-cli/conversations/broken.db"),
            "not sqlite",
        )
        .unwrap();
        let parsed = parse_antigravity(home.path(), &mut |_| {});
        assert_eq!(parsed.stats.unwrap().events, 1);
        let error = parsed.error.unwrap();
        assert!(error.contains("broken.db"));
        assert!(error.contains("step 2"));
    }

    #[test]
    fn should_reject_truncated_and_overflowing_protobuf() {
        for raw in [
            &[0x80][..],
            &[0x4a, 100, 0],
            &[0],
            &[0xff; 11],
            &[9, 0],
            &[13, 0],
        ] {
            assert!(Fields::decode(raw).is_err(), "{raw:?}");
        }
        assert!(
            Fields::decode(&integer(2, u64::MAX))
                .unwrap()
                .int(2)
                .is_err()
        );
    }

    #[test]
    fn should_not_detect_an_agent_without_databases() {
        let home = tempfile::tempdir().unwrap();
        let parsed = parse_antigravity(home.path(), &mut |_| panic!("no event expected"));
        assert!(parsed.stats.is_none());
        assert!(parsed.error.is_none());
    }
}
