use crate::{cursor, grok, parse};
use chrono::{DateTime, Local, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{self, Write};
use std::path::Path;
use std::time::Instant;

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Tokens {
    pub input: i64,
    pub output: i64,
    pub cache_read: i64,
    pub cache_write: i64,
    pub reasoning: i64,
}

impl Tokens {
    pub fn add(&mut self, other: Tokens) {
        self.input += other.input;
        self.output += other.output;
        self.cache_read += other.cache_read;
        self.cache_write += other.cache_write;
        self.reasoning += other.reasoning;
    }

    pub fn keep_max(&mut self, other: Tokens) {
        self.input = self.input.max(other.input);
        self.output = self.output.max(other.output);
        self.cache_read = self.cache_read.max(other.cache_read);
        self.cache_write = self.cache_write.max(other.cache_write);
        self.reasoning = self.reasoning.max(other.reasoning);
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct UsageEvent {
    pub ts: DateTime<Utc>,
    pub agent: &'static str,
    pub provider: String,
    pub model: String,
    pub tokens: Tokens,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParserStats {
    pub agent: String,
    pub duration_ms: u64,
    pub files: usize,
    pub bytes: u64,
    pub events: usize,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_read_tokens: i64,
    pub cache_write_tokens: i64,
    pub reasoning_tokens: i64,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IngestRow {
    pub date: String,
    pub agent: String,
    pub provider: String,
    pub model: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_read_tokens: i64,
    pub cache_write_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
    /// Always sent as `null` so the ingest route prices the row.
    pub cost_usd: Option<String>,
    pub messages: i64,
}

#[derive(Debug, Default)]
pub struct CollectResult {
    pub agents: Vec<String>,
    pub event_count: usize,
    pub stats: Vec<ParserStats>,
    pub rows: Vec<IngestRow>,
    pub warnings: Vec<String>,
}

/// A parser's outcome: `stats` is `None` when the agent isn't on this machine.
/// `error` can accompany stats (e.g. one unreadable file among many).
#[derive(Debug, Default)]
pub struct Parsed {
    pub stats: Option<ParserStats>,
    pub error: Option<String>,
}

pub type Parser = fn(&Path, &mut dyn FnMut(UsageEvent)) -> Parsed;

pub fn collect(home: &Path) -> CollectResult {
    collect_with(home, |ts| {
        ts.with_timezone(&Local).format("%Y-%m-%d").to_string()
    })
}

/// `local_date` buckets a UTC timestamp into its day string; a real run uses the
/// machine's local timezone, tests pin a fixed offset for determinism.
fn collect_with(home: &Path, local_date: impl Fn(DateTime<Utc>) -> String) -> CollectResult {
    let mut groups: HashMap<String, IngestRow> = HashMap::new();
    let mut out = CollectResult::default();

    let mut emit = |event: UsageEvent| {
        if event.model.is_empty() {
            return;
        }
        let provider = if event.provider.is_empty() {
            provider_for_agent(event.agent).to_string()
        } else {
            event.provider
        };
        let date = local_date(event.ts);
        let key = format!("{date}|{}|{provider}|{}", event.agent, event.model);
        let row = groups.entry(key).or_insert_with(|| IngestRow {
            date,
            agent: event.agent.to_string(),
            provider,
            model: event.model,
            ..Default::default()
        });
        row.input_tokens += event.tokens.input;
        row.output_tokens += event.tokens.output;
        row.cache_read_tokens += event.tokens.cache_read;
        row.cache_write_tokens += event.tokens.cache_write;
        row.reasoning_tokens += event.tokens.reasoning;
        row.messages += 1;
    };

    let parsers: [(&str, Parser); 5] = [
        ("claude", parse::parse_claude),
        ("codex", parse::parse_codex),
        ("opencode", parse::parse_opencode),
        ("cursor", cursor::parse_cursor),
        ("grok", grok::parse_grok),
    ];

    // A failing parser (or file) is a warning, not a fatal error: the server only
    // overwrites a day when the new total is larger, so ingesting the agents
    // that did parse can never erase what an earlier complete run stored.
    for (name, run) in parsers {
        let parsed = run(home, &mut emit);
        if let Some(error) = parsed.error {
            out.warnings.push(format!("{name}: {error}"));
        }
        let Some(stats) = parsed.stats else { continue };
        out.agents.push(stats.agent.clone());
        out.event_count += stats.events;
        out.stats.push(stats);
    }

    out.rows = groups
        .into_values()
        .map(|mut row| {
            row.total_tokens = row.input_tokens
                + row.output_tokens
                + row.cache_read_tokens
                + row.cache_write_tokens
                + row.reasoning_tokens;
            row
        })
        .collect();
    out.rows.sort_by(|a, b| {
        (&a.date, &a.agent, &a.provider, &a.model).cmp(&(&b.date, &b.agent, &b.provider, &b.model))
    });
    out
}

pub fn provider_for_agent(agent: &str) -> &str {
    match agent {
        "claude" => "anthropic",
        "codex" => "openai",
        "grok" => "xai",
        other => other,
    }
}

pub fn finish(
    agent: &str,
    started: Instant,
    files: usize,
    bytes: u64,
    events: usize,
    buckets: Tokens,
) -> ParserStats {
    ParserStats {
        agent: agent.to_string(),
        duration_ms: started.elapsed().as_millis() as u64,
        files,
        bytes,
        events,
        input_tokens: buckets.input,
        output_tokens: buckets.output,
        cache_read_tokens: buckets.cache_read,
        cache_write_tokens: buckets.cache_write,
        reasoning_tokens: buckets.reasoning,
    }
}

pub fn print_table(out: &mut dyn Write, stats: &[ParserStats]) -> io::Result<()> {
    let headers = [
        "agent",
        "ms",
        "files",
        "bytes",
        "events",
        "input",
        "output",
        "cacheRead",
        "cacheWrite",
        "reasoning",
    ];
    let rows: Vec<[String; 10]> = stats
        .iter()
        .map(|s| {
            [
                s.agent.clone(),
                s.duration_ms.to_string(),
                s.files.to_string(),
                s.bytes.to_string(),
                s.events.to_string(),
                s.input_tokens.to_string(),
                s.output_tokens.to_string(),
                s.cache_read_tokens.to_string(),
                s.cache_write_tokens.to_string(),
                s.reasoning_tokens.to_string(),
            ]
        })
        .collect();
    let widths: Vec<usize> = (0..headers.len())
        .map(|i| {
            rows.iter()
                .map(|row| row[i].len())
                .chain([headers[i].len()])
                .max()
                .unwrap_or(0)
        })
        .collect();
    let line = |cells: &[&str]| {
        cells
            .iter()
            .enumerate()
            .map(|(i, cell)| format!("{cell:<width$}", width = widths[i]))
            .collect::<Vec<_>>()
            .join("  ")
    };
    writeln!(out, "{}", line(&headers))?;
    for row in &rows {
        let cells: Vec<&str> = row.iter().map(String::as_str).collect();
        writeln!(out, "{}", line(&cells))?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::parse::tests::{seed_claude, seed_codex, seed_opencode};
    use chrono::FixedOffset;
    use tempfile::TempDir;

    fn row_key(row: &IngestRow) -> String {
        format!("{}|{}|{}|{}", row.date, row.agent, row.provider, row.model)
    }

    fn rows_by_key(rows: &[IngestRow]) -> HashMap<String, IngestRow> {
        rows.iter().map(|row| (row_key(row), row.clone())).collect()
    }

    fn assert_rows(label: &str, rows: &[IngestRow], want: &[IngestRow]) {
        let got = rows_by_key(rows);
        assert_eq!(rows.len(), want.len(), "{label}: row count, got {rows:?}");
        for w in want {
            let key = row_key(w);
            let g = got
                .get(&key)
                .unwrap_or_else(|| panic!("{label}: missing row {key}"));
            assert_eq!(g, w, "{label}: row {key}");
        }
    }

    /// `time.FixedZone` equivalent: an offset in seconds east of UTC (negative for west).
    fn fixed_offset_date(offset_seconds: i32) -> impl Fn(DateTime<Utc>) -> String {
        move |ts| {
            ts.with_timezone(&FixedOffset::east_opt(offset_seconds).unwrap())
                .format("%Y-%m-%d")
                .to_string()
        }
    }

    #[test]
    fn test_collect_day_bucketing() {
        struct Case {
            name: &'static str,
            date_fn: Box<dyn Fn(DateTime<Utc>) -> String>,
            want: Vec<IngestRow>,
        }

        let cases = vec![
            Case {
                name: "UTC",
                date_fn: Box::new(fixed_offset_date(0)),
                want: vec![
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-sonnet-4-5".into(),
                        input_tokens: 110,
                        output_tokens: 55,
                        cache_read_tokens: 1000,
                        cache_write_tokens: 200,
                        total_tokens: 1365,
                        messages: 2,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-13".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-opus-4-1".into(),
                        input_tokens: 1,
                        output_tokens: 2,
                        cache_read_tokens: 3,
                        cache_write_tokens: 4,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "gpt-5-codex".into(),
                        input_tokens: 204,
                        output_tokens: 102,
                        cache_read_tokens: 810,
                        reasoning_tokens: 204,
                        total_tokens: 1320,
                        messages: 3,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-11".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "unknown".into(),
                        input_tokens: 7,
                        output_tokens: 3,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                ],
            },
            Case {
                // 15:59:59.999Z is 23:59:59.999 and 16:00Z is 00:00 the next day.
                name: "UTC+8 splits at local midnight",
                date_fn: Box::new(fixed_offset_date(8 * 3600)),
                want: vec![
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-sonnet-4-5".into(),
                        input_tokens: 100,
                        output_tokens: 50,
                        cache_read_tokens: 1000,
                        cache_write_tokens: 200,
                        total_tokens: 1350,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-13".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-sonnet-4-5".into(),
                        input_tokens: 10,
                        output_tokens: 5,
                        total_tokens: 15,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-13".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-opus-4-1".into(),
                        input_tokens: 1,
                        output_tokens: 2,
                        cache_read_tokens: 3,
                        cache_write_tokens: 4,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "gpt-5-codex".into(),
                        input_tokens: 204,
                        output_tokens: 102,
                        cache_read_tokens: 800,
                        reasoning_tokens: 200,
                        total_tokens: 1306,
                        messages: 2,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-13".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "gpt-5-codex".into(),
                        cache_read_tokens: 10,
                        reasoning_tokens: 4,
                        total_tokens: 14,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-11".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "unknown".into(),
                        input_tokens: 7,
                        output_tokens: 3,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                ],
            },
            Case {
                // 01:00Z on the 13th is still the 12th; 10:00Z on the 11th is exactly local midnight.
                name: "UTC-10 pulls events back a day",
                date_fn: Box::new(fixed_offset_date(-10 * 3600)),
                want: vec![
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-sonnet-4-5".into(),
                        input_tokens: 110,
                        output_tokens: 55,
                        cache_read_tokens: 1000,
                        cache_write_tokens: 200,
                        total_tokens: 1365,
                        messages: 2,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "claude".into(),
                        provider: "anthropic".into(),
                        model: "claude-opus-4-1".into(),
                        input_tokens: 1,
                        output_tokens: 2,
                        cache_read_tokens: 3,
                        cache_write_tokens: 4,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-12".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "gpt-5-codex".into(),
                        input_tokens: 204,
                        output_tokens: 102,
                        cache_read_tokens: 810,
                        reasoning_tokens: 204,
                        total_tokens: 1320,
                        messages: 3,
                        ..Default::default()
                    },
                    IngestRow {
                        date: "2026-09-11".into(),
                        agent: "codex".into(),
                        provider: "openai".into(),
                        model: "unknown".into(),
                        input_tokens: 7,
                        output_tokens: 3,
                        total_tokens: 10,
                        messages: 1,
                        ..Default::default()
                    },
                ],
            },
        ];

        for case in cases {
            let home = TempDir::new().unwrap();
            seed_claude(home.path());
            seed_codex(home.path());

            let result = collect_with(home.path(), case.date_fn);
            assert_rows(case.name, &result.rows, &case.want);
        }
    }

    #[test]
    fn test_collect_aggregates_all_agents() {
        let home = TempDir::new().unwrap();
        seed_claude(home.path());
        seed_codex(home.path());
        seed_opencode(&home.path().join(".local/share"));

        let result = collect_with(home.path(), fixed_offset_date(0));

        assert_eq!(result.agents, vec!["claude", "codex", "opencode"]);
        assert_eq!(result.event_count, 9);
        assert_eq!(result.stats.len(), 3);

        let mut messages = 0i64;
        for row in &result.rows {
            messages += row.messages;
            assert!(row.cost_usd.is_none(), "row {row:?} has costUsd, want None");
            let sum = row.input_tokens
                + row.output_tokens
                + row.cache_read_tokens
                + row.cache_write_tokens
                + row.reasoning_tokens;
            assert_eq!(row.total_tokens, sum, "row {row:?} total mismatch");
        }
        assert_eq!(messages, result.event_count as i64);

        assert_eq!(result.rows.len(), 6, "got {:?}", result.rows);
        let got = rows_by_key(&result.rows);
        for want in [
            IngestRow {
                date: "2026-09-12".into(),
                agent: "opencode".into(),
                provider: "anthropic".into(),
                model: "claude-sonnet-4-5".into(),
                input_tokens: 10,
                output_tokens: 15,
                cache_read_tokens: 30,
                cache_write_tokens: 40,
                reasoning_tokens: 5,
                total_tokens: 100,
                messages: 1,
                ..Default::default()
            },
            IngestRow {
                date: "2026-09-12".into(),
                agent: "opencode".into(),
                provider: "unknown".into(),
                model: "unknown".into(),
                reasoning_tokens: 9,
                total_tokens: 9,
                messages: 1,
                ..Default::default()
            },
        ] {
            let key = row_key(&want);
            assert_eq!(got.get(&key), Some(&want), "row {key}");
        }
    }

    #[test]
    fn test_collect_empty_home() {
        let home = TempDir::new().unwrap();
        let result = collect(home.path());
        assert!(result.agents.is_empty());
        assert_eq!(result.event_count, 0);
        assert!(result.rows.is_empty());

        let raw = serde_json::to_string(&serde_json::json!({ "rows": result.rows })).unwrap();
        assert!(
            raw.contains("\"rows\":[]"),
            "rows encoded as {raw}, want []"
        );
    }

    #[test]
    fn test_provider_for_agent() {
        for (agent, want) in [
            ("claude", "anthropic"),
            ("codex", "openai"),
            ("opencode", "opencode"),
            ("cursor", "cursor"),
            ("grok", "xai"),
        ] {
            assert_eq!(provider_for_agent(agent), want);
        }
    }
}
