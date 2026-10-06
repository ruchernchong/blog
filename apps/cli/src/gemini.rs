use crate::collect::{Parsed, Tokens, UsageEvent, finish};
use crate::parse::parse_timestamp;
use serde_json::Value;
use std::collections::BTreeMap;
use std::path::Path;
use std::time::Instant;
use walkdir::WalkDir;

/// Gemini CLI's legacy JSON snapshots and append-only JSONL recordings under
/// `~/.gemini/tmp/<project>/chats/`, including nested subagent recordings.
pub fn parse_gemini(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let root = home.join(".gemini/tmp");
    let started = Instant::now();
    let mut files = 0;
    let mut bytes = 0;
    let mut errors = Vec::new();
    let mut messages: BTreeMap<(String, String), UsageEvent> = BTreeMap::new();
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
        let path = entry.path();
        let extension = path.extension().and_then(|ext| ext.to_str());
        if !entry.file_type().is_file()
            || !matches!(extension, Some("json" | "jsonl"))
            || !path
                .strip_prefix(&root)
                .unwrap()
                .components()
                .any(|c| c.as_os_str() == "chats")
        {
            continue;
        }
        files += 1;
        let raw = match std::fs::read(path) {
            Ok(raw) => raw,
            Err(error) => {
                errors.push(format!("{}: {error}", path.display()));
                continue;
            }
        };
        bytes += raw.len() as u64;
        let mut session = path.file_stem().unwrap().to_string_lossy().into_owned();
        let mut record = |value: Value| {
            let value = value.get("$set").unwrap_or(&value);
            if let Some(id) = value
                .get("sessionId")
                .and_then(Value::as_str)
                .filter(|id| !id.is_empty())
            {
                session = id.to_string();
            }
            if let Some(values) = value.get("messages").and_then(Value::as_array) {
                for value in values {
                    add_message(value, &session, &mut messages);
                }
            } else {
                add_message(value, &session, &mut messages);
            }
            // Rewinds and content patches do not undo tokens already consumed.
        };
        if extension == Some("jsonl") {
            for (line, raw) in raw.split(|b| *b == b'\n').enumerate() {
                if raw.trim_ascii().is_empty() {
                    continue;
                }
                match serde_json::from_slice(raw) {
                    Ok(value) => record(value),
                    Err(error) => errors.push(format!("{}:{}: {error}", path.display(), line + 1)),
                }
            }
        } else {
            match serde_json::from_slice(&raw) {
                Ok(value) => record(value),
                Err(error) => errors.push(format!("{}: {error}", path.display())),
            }
        }
    }
    if files == 0 && errors.is_empty() {
        return Parsed::default();
    }
    let events = messages.len();
    let mut buckets = Tokens::default();
    for event in messages.into_values() {
        buckets.add(event.tokens);
        emit(event);
    }
    Parsed {
        stats: Some(finish("gemini", started, files, bytes, events, buckets)),
        error: (!errors.is_empty()).then(|| errors.join("\n")),
    }
}

fn add_message(
    value: &Value,
    session: &str,
    messages: &mut BTreeMap<(String, String), UsageEvent>,
) {
    if value.get("type").and_then(Value::as_str) != Some("gemini") {
        return;
    }
    let Some(ts) = value
        .get("timestamp")
        .and_then(Value::as_str)
        .and_then(parse_timestamp)
    else {
        return;
    };
    let Some(model) = value
        .get("model")
        .and_then(Value::as_str)
        .filter(|model| !model.is_empty())
    else {
        return;
    };
    let Some(counts) = value.get("tokens").filter(|value| value.is_object()) else {
        return;
    };
    let count = |key| counts.get(key).and_then(Value::as_i64).unwrap_or(0).max(0);
    let tokens = Tokens {
        input: (count("input") - count("cached")).max(0),
        // candidatesTokenCount excludes thoughtsTokenCount in Gemini's API.
        output: count("output"),
        cache_read: count("cached"),
        reasoning: count("thoughts"),
        ..Default::default()
    };
    if tokens == Tokens::default() {
        return;
    }
    let id = value
        .get("id")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| format!("{ts}|{model}"));
    let key = (session.to_string(), id);
    messages
        .entry(key)
        .and_modify(|event| event.tokens.keep_max(tokens))
        .or_insert_with(|| UsageEvent {
            ts,
            agent: "gemini",
            provider: String::new(),
            model: model.to_string(),
            session: session.to_string(),
            effort: None,
            tokens,
        });
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use serde_json::json;
    use std::fs;

    fn message(id: &str, input: i64, cached: i64) -> Value {
        json!({"id": id, "type": "gemini", "timestamp": "2026-10-05T16:00:00Z",
        "model": "gemini-3.8-flash", "tokens": {
            "input": input, "cached": cached, "output": 20, "thoughts": 7, "total": input + 27
        }})
    }

    pub(crate) fn seed_gemini(home: &Path) {
        let chats = home.join(".gemini/tmp/project/chats");
        fs::create_dir_all(&chats).unwrap();
        fs::write(
            chats.join("session-old.json"),
            json!({"sessionId": "gemini-session",
                "messages": [message("m1", 100, 40), {"type": "user", "tokens": {"input": 900}}]
            })
            .to_string(),
        )
        .unwrap();
        let records = [
            json!({"sessionId": "gemini-session", "projectHash": "project"}),
            message("m1", 110, 40),
            message("m2", 5, 10),
            json!({"$rewindTo": "m1"}),
            json!({"$set": {"messages": [message("m1", 110, 40)]}}),
        ];
        fs::write(
            chats.join("session-new.jsonl"),
            records
                .iter()
                .map(Value::to_string)
                .collect::<Vec<_>>()
                .join("\n"),
        )
        .unwrap();
        let sub = chats.join("gemini-session");
        fs::create_dir_all(&sub).unwrap();
        fs::write(
            sub.join("subagent.jsonl"),
            format!(
                "{{\"sessionId\":\"sub-session\",\"projectHash\":\"project\"}}\n{}",
                message("m1", 12, 2)
            ),
        )
        .unwrap();
    }

    #[test]
    fn should_parse_both_formats_and_deduplicate_resumed_messages() {
        let home = tempfile::tempdir().unwrap();
        seed_gemini(home.path());
        let mut events = Vec::new();
        let parsed = parse_gemini(home.path(), &mut |event| events.push(event));
        assert!(parsed.error.is_none());
        let stats = parsed.stats.unwrap();
        assert_eq!((stats.files, stats.events), (3, 3));
        assert_eq!(stats.input_tokens, 80);
        assert_eq!(stats.output_tokens, 60);
        assert_eq!(stats.cache_read_tokens, 52);
        assert_eq!(stats.reasoning_tokens, 21);
        assert!(events.iter().all(|event| event.agent == "gemini"));
        assert_eq!(
            events
                .iter()
                .filter(|event| event.session == "gemini-session")
                .count(),
            2
        );
    }

    #[test]
    fn should_keep_valid_records_when_other_records_are_invalid() {
        let home = tempfile::tempdir().unwrap();
        seed_gemini(home.path());
        let chats = home.path().join(".gemini/tmp/project/chats");
        let mut bad_time = message("invalid-time", 100, 0);
        bad_time["timestamp"] = json!("bad");
        let mut no_model = message("no-model", 100, 0);
        no_model["model"] = json!("");
        let mut no_tokens = message("no-tokens", 100, 0);
        no_tokens["tokens"] = Value::Null;
        fs::write(
            chats.join("broken.jsonl"),
            format!("{bad_time}\n{no_model}\n{no_tokens}\n{{broken"),
        )
        .unwrap();
        fs::write(home.path().join(".gemini/tmp/logs.json"), "{broken").unwrap();
        let parsed = parse_gemini(home.path(), &mut |_| {});
        assert_eq!(parsed.stats.unwrap().events, 3);
        assert!(parsed.error.unwrap().contains("broken.jsonl:4"));
    }

    #[test]
    fn should_not_detect_an_agent_without_recordings() {
        let home = tempfile::tempdir().unwrap();
        fs::create_dir_all(home.path().join(".gemini/tmp")).unwrap();
        let parsed = parse_gemini(home.path(), &mut |_| panic!("no event expected"));
        assert!(parsed.stats.is_none());
        assert!(parsed.error.is_none());
    }
}
