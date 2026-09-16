use crate::collect::{Parsed, Tokens, UsageEvent, finish};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use std::collections::BTreeMap;
use std::path::Path;
use std::time::Instant;
use walkdir::WalkDir;

/// Parses Grok CLI sessions from `~/.grok/sessions/<cwd>/<session>/usage.json`.
///
/// Each file carries a `turns` array with per-model gross counters. Grok reports
/// `inputTokens` inclusive of cache reads and `outputTokens` inclusive of
/// reasoning, so both are netted out here to match the other parsers (and the
/// rows already stored for this agent). The model id is the one the server
/// resolved (e.g. `grok-4.6-build`); the registry aliases it for pricing.
pub fn parse_grok(home: &Path, emit: &mut dyn FnMut(UsageEvent)) -> Parsed {
    let root = home.join(".grok/sessions");
    if !root.exists() {
        return Parsed::default();
    }
    let started = Instant::now();
    let mut files = 0;
    let mut bytes = 0;
    let mut events = 0;
    let mut buckets = Tokens::default();
    let mut file_errors = Vec::new();
    for entry in WalkDir::new(&root)
        .sort_by_file_name()
        .into_iter()
        .filter_map(Result::ok)
    {
        if !entry.file_type().is_file() || entry.file_name() != "usage.json" {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        files += 1;
        bytes += meta.len();
        let raw = match std::fs::read(entry.path()) {
            Ok(raw) => raw,
            Err(error) => {
                file_errors.push(format!("{}: {error}", entry.path().display()));
                continue;
            }
        };
        let usage = match serde_json::from_slice::<GrokUsage>(&raw) {
            Ok(usage) => usage,
            Err(error) => {
                file_errors.push(format!("{}: {error}", entry.path().display()));
                continue;
            }
        };
        for turn in usage.turns {
            let Ok(ts) = DateTime::parse_from_rfc3339(&turn.ended_at) else {
                continue;
            };
            let ts = ts.with_timezone(&Utc);
            for (model, counts) in turn.model_usage {
                if model.is_empty() {
                    continue;
                }
                let tokens = Tokens {
                    input: (counts.input_tokens - counts.cached_read_tokens).max(0),
                    output: (counts.output_tokens - counts.reasoning_tokens).max(0),
                    cache_read: counts.cached_read_tokens,
                    cache_write: counts.cache_creation_tokens,
                    reasoning: counts.reasoning_tokens,
                };
                events += 1;
                buckets.add(tokens);
                emit(UsageEvent {
                    ts,
                    agent: "grok",
                    provider: String::new(),
                    model,
                    tokens,
                });
            }
        }
    }
    if files == 0 && file_errors.is_empty() {
        return Parsed::default();
    }
    Parsed {
        stats: Some(finish("grok", started, files, bytes, events, buckets)),
        error: if file_errors.is_empty() {
            None
        } else {
            Some(file_errors.join("\n"))
        },
    }
}

#[derive(Deserialize)]
struct GrokUsage {
    #[serde(default)]
    turns: Vec<GrokTurn>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct GrokTurn {
    #[serde(default)]
    ended_at: String,
    #[serde(default)]
    model_usage: BTreeMap<String, GrokCounts>,
}

#[derive(Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct GrokCounts {
    #[serde(default)]
    input_tokens: i64,
    #[serde(default)]
    output_tokens: i64,
    #[serde(default)]
    cached_read_tokens: i64,
    #[serde(default)]
    cache_creation_tokens: i64,
    #[serde(default)]
    reasoning_tokens: i64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;
    use std::fs;
    use std::path::PathBuf;

    fn testdata_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("testdata/grok")
    }

    fn seed_grok(home: &Path) {
        for entry in WalkDir::new(testdata_dir())
            .into_iter()
            .filter_map(Result::ok)
        {
            if !entry.file_type().is_file() {
                continue;
            }
            let rel = entry.path().strip_prefix(testdata_dir()).unwrap();
            let target = home.join(".grok").join(rel);
            fs::create_dir_all(target.parent().unwrap()).unwrap();
            fs::copy(entry.path(), target).unwrap();
        }
    }

    fn parse(home: &Path) -> (Vec<UsageEvent>, Parsed) {
        let mut events = Vec::new();
        let parsed = parse_grok(home, &mut |event| events.push(event));
        (events, parsed)
    }

    #[test]
    fn test_parse_grok() {
        let home = tempfile::tempdir().unwrap();
        seed_grok(home.path());
        let (events, parsed) = parse(home.path());

        let stats = parsed.stats.expect("grok detected");
        assert_eq!(parsed.error, None);
        assert_eq!(stats.agent, "grok");
        assert_eq!(stats.files, 2);
        assert_eq!(stats.events, 3);

        assert_eq!(
            events,
            vec![
                // Cache reads are netted out of input, reasoning out of output.
                UsageEvent {
                    ts: DateTime::parse_from_rfc3339("2026-09-13T03:49:53.800571+00:00")
                        .unwrap()
                        .with_timezone(&Utc),
                    agent: "grok",
                    provider: String::new(),
                    model: "grok-4.6-build".to_string(),
                    tokens: Tokens {
                        input: 56450,
                        output: 2477,
                        cache_read: 265600,
                        cache_write: 0,
                        reasoning: 4439,
                    },
                },
                // A second model in the same turn is its own event; models are
                // emitted in key order.
                UsageEvent {
                    ts: Utc.with_ymd_and_hms(2026, 9, 13, 4, 10, 0).unwrap(),
                    agent: "grok",
                    provider: String::new(),
                    model: "grok-4.5".to_string(),
                    tokens: Tokens {
                        input: 10,
                        output: 5,
                        cache_read: 0,
                        cache_write: 0,
                        reasoning: 0,
                    },
                },
                UsageEvent {
                    ts: Utc.with_ymd_and_hms(2026, 9, 13, 4, 10, 0).unwrap(),
                    agent: "grok",
                    provider: String::new(),
                    model: "grok-4.6-build".to_string(),
                    tokens: Tokens {
                        input: 1000,
                        output: 100,
                        cache_read: 0,
                        cache_write: 0,
                        reasoning: 0,
                    },
                },
            ]
        );
        assert_eq!(stats.input_tokens, 57460);
        assert_eq!(stats.output_tokens, 2582);
        assert_eq!(stats.cache_read_tokens, 265600);
        assert_eq!(stats.reasoning_tokens, 4439);
    }

    #[test]
    fn test_parse_grok_not_detected() {
        let home = tempfile::tempdir().unwrap();
        let (events, parsed) = parse(home.path());
        assert!(events.is_empty());
        assert!(parsed.stats.is_none());
        assert!(parsed.error.is_none());
    }

    #[test]
    fn test_parse_grok_bad_file_is_warning() {
        let home = tempfile::tempdir().unwrap();
        seed_grok(home.path());
        let broken = home.path().join(".grok/sessions/x/broken/usage.json");
        fs::create_dir_all(broken.parent().unwrap()).unwrap();
        fs::write(&broken, b"{not json").unwrap();
        let (events, parsed) = parse(home.path());
        assert_eq!(events.len(), 3);
        assert!(parsed.stats.is_some());
        assert!(parsed.error.unwrap().contains("broken/usage.json"));
    }
}
