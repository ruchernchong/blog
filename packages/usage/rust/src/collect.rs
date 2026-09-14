use crate::{cursor, parse};
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
        let date = event.ts.with_timezone(&Local).format("%Y-%m-%d").to_string();
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

    let parsers: [(&str, Parser); 4] = [
        ("claude", parse::parse_claude),
        ("codex", parse::parse_codex),
        ("opencode", parse::parse_opencode),
        ("cursor", cursor::parse_cursor),
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
