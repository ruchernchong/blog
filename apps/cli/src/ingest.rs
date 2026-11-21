use crate::collect::{CollectResult, EffortRow, IngestRow, print_table};
use crate::{oauth, store};
use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, HashSet};
use std::ffi::OsString;
use std::io::{self, Write};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

/// Rows per POST. Session-level rows grow with every session, so one request per
/// batch keeps each body well inside the function's 4.5 MB request limit and the
/// route's 20,000-row cap.
const BATCH_ROWS: usize = 5_000;
/// Matches Go's `io.LimitReader(resp.Body, 1<<20)`.
const RESPONSE_BODY_LIMIT: u64 = 1 << 20;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(120);
/// A ledger in any other format is ignored, which means a full send.
const LEDGER_VERSION: u32 = 1;
/// Send everything at least this often, so the server heals after anything
/// the ledger cannot see (a restored database, a reset dev branch).
const FULL_SYNC_SECS: i64 = 86_400;

/// What this server has acknowledged with a 2xx, so a run sends only rows
/// that differ. It is only ever written from acknowledged batches: any doubt
/// leaves it behind, and the worst case is a resend the server ignores.
#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Ledger {
    version: u32,
    endpoint: String,
    device: String,
    /// Unix seconds of the last complete full send; `0` until one finishes.
    full_sync_at: i64,
    rows: BTreeMap<String, [i64; 7]>,
    effort: BTreeMap<String, EffortRow>,
}

impl Ledger {
    /// The stored ledger, or an empty one (a full send) when it is missing,
    /// unreadable, for another endpoint or device, a day old, or `full` is set.
    fn load(endpoint: &str, device: &str, now: i64, full: bool) -> Self {
        let stored = std::fs::read(store::ledger_path())
            .ok()
            .and_then(|raw| serde_json::from_slice::<Ledger>(&raw).ok())
            .filter(|ledger| {
                !full
                    && ledger.version == LEDGER_VERSION
                    && ledger.endpoint == endpoint
                    && ledger.device == device
                    && now - ledger.full_sync_at <= FULL_SYNC_SECS
            });
        stored.unwrap_or_else(|| Self {
            version: LEDGER_VERSION,
            endpoint: endpoint.to_string(),
            device: device.to_string(),
            ..Default::default()
        })
    }

    fn save(&self) -> Result<()> {
        store::write_private(&store::ledger_path(), &serde_json::to_vec(self)?)
    }

    /// Rows to send: those that differ from what was acknowledged, plus the
    /// token rows of any effort day that changed on its own, because the
    /// server rejects a body without token rows and effort rides with them.
    fn changes(&self, result: &CollectResult) -> Vec<IngestRow> {
        let changed: Vec<bool> = result
            .rows
            .iter()
            .map(|row| self.rows.get(&row_key(row)) != Some(&row_value(row)))
            .collect();
        let covered: HashSet<_> = result
            .rows
            .iter()
            .zip(&changed)
            .filter(|(_, changed)| **changed)
            .map(|(row, _)| day_key(&row.date, &row.agent))
            .collect();
        let effort_only: HashSet<_> = result
            .effort_rows
            .iter()
            .map(|row| (day_key(&row.date, &row.agent), row))
            .filter(|(key, row)| self.effort.get(key) != Some(row) && !covered.contains(key))
            .map(|(key, _)| key)
            .collect();
        result
            .rows
            .iter()
            .zip(changed)
            .filter(|(row, changed)| {
                *changed || effort_only.contains(&day_key(&row.date, &row.agent))
            })
            .map(|(row, _)| row.clone())
            .collect()
    }

    fn record(&mut self, payload: &Payload) {
        for row in payload.rows {
            self.rows.insert(row_key(row), row_value(row));
        }
        for row in &payload.effort_rows {
            self.effort
                .insert(day_key(&row.date, &row.agent), (*row).clone());
        }
    }
}

fn row_key(row: &IngestRow) -> String {
    format!(
        "{}|{}|{}|{}|{}",
        row.date,
        row.agent,
        row.provider,
        row.model,
        row.session.as_deref().unwrap_or("-")
    )
}

/// Every field the server stores; `costUsd` is always `null`.
fn row_value(row: &IngestRow) -> [i64; 7] {
    [
        row.input_tokens,
        row.output_tokens,
        row.cache_read_tokens,
        row.cache_write_tokens,
        row.reasoning_tokens,
        row.total_tokens,
        row.messages,
    ]
}

fn day_key(date: &str, agent: &str) -> String {
    format!("{date}|{agent}")
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Payload<'a> {
    device: &'a str,
    rows: &'a [IngestRow],
    effort_rows: Vec<&'a EffortRow>,
}

impl<'a> Payload<'a> {
    fn new(device: &'a str, rows: &'a [IngestRow], effort_rows: &'a [EffortRow]) -> Self {
        let days: HashSet<_> = rows.iter().map(|row| (&row.date, &row.agent)).collect();
        Self {
            device,
            rows,
            // Send the full day aggregate with its token batch. A day spanning
            // batches repeats idempotently; no request is effort-only.
            effort_rows: effort_rows
                .iter()
                .filter(|row| days.contains(&(&row.date, &row.agent)))
                .collect(),
        }
    }
}

/// `--url` for this run. Global because [`endpoint`] also picks the OAuth
/// issuer and Keychain entry, so the refresh and the POST hit the same server.
static URL_FLAG: OnceLock<String> = OnceLock::new();

/// POST daily rows to `/api/usage/ingest` (OAuth bearer; the server prices them).
/// `url` and `dry_run` are the command-line flags; each falls back to the
/// environment when not given. Only rows changed since the last acknowledged
/// ingest are sent, unless `full` is set or the last full send is a day old.
pub fn ingest(
    result: &CollectResult,
    url: Option<String>,
    dry_run: bool,
    full: bool,
) -> Result<()> {
    if let Some(url) = url {
        let _ = URL_FLAG.set(url);
    }
    let endpoint = endpoint();
    let device = store::device_id()?;
    let dry_run = resolve_dry_run(
        dry_run,
        crate::env_var("AGENT_USAGE_DRY_RUN", "USAGE_INGEST_DRY_RUN"),
    );

    let mut out = io::stdout().lock();
    ingest_inner(result, &endpoint, &device, dry_run, full, &mut out)
}

/// Testable core: takes the endpoint and dry-run flag explicitly instead of
/// reading the environment, and writes to an injected sink instead of stdout.
fn ingest_inner(
    result: &CollectResult,
    endpoint: &str,
    device: &str,
    dry_run: bool,
    full: bool,
    out: &mut dyn Write,
) -> Result<()> {
    if result.rows.is_empty() {
        writeln!(out, "Nothing to ingest.")?;
        return Ok(());
    }
    print_table(out, &result.stats)?;
    writeln!(out)?;

    // A dry run reads the ledger to show what would be sent, but never locks
    // or writes it.
    let _lock = if dry_run {
        None
    } else {
        Some(store::lock_ledger()?)
    };
    let now = oauth::unix_now();
    let mut ledger = Ledger::load(endpoint, device, now, full);
    let full = ledger.full_sync_at == 0;
    let mode = if full { "full" } else { "changes" };
    let rows = ledger.changes(result);

    if rows.is_empty() {
        writeln!(out, "No changes since the last ingest.")?;
        return Ok(());
    }

    if dry_run {
        let payload = Payload::new(device, &rows, &result.effort_rows);
        writeln!(out, "Dry run: {} rows ({mode}) → {endpoint}", rows.len())?;
        writeln!(out, "{}", serde_json::to_string_pretty(&payload)?)?;
        return Ok(());
    }

    let token = oauth::bearer_token()?;

    writeln!(
        out,
        "Upserting {} rows ({mode}) → {endpoint}",
        format_count(rows.len() as i64)
    )?;

    for batch in rows.chunks(BATCH_ROWS) {
        let payload = Payload::new(device, batch, &result.effort_rows);
        let body = serde_json::to_vec(&payload)?;
        let started = Instant::now();
        let mut response = oauth::http()
            .post(endpoint)
            .header("content-type", "application/json")
            .header("authorization", format!("Bearer {token}"))
            .config()
            .http_status_as_error(false)
            .timeout_global(Some(REQUEST_TIMEOUT))
            .build()
            .send(&body)?;
        let elapsed = started.elapsed();

        let status = response.status().as_u16();
        let detail = response
            .body_mut()
            .with_config()
            .limit(RESPONSE_BODY_LIMIT)
            .lossy_utf8(true)
            .read_to_string()
            .unwrap_or_default();
        let detail = detail.trim();

        if !(200..300).contains(&status) {
            bail!("ingest endpoint {status}: {detail}");
        }
        writeln!(
            out,
            "Response: {status} in {} {detail}",
            format_duration(elapsed)
        )?;
        // Saved per batch, so a later failure resends only what is left.
        ledger.record(&payload);
        ledger.save()?;
    }

    if full {
        // Built from this run alone, so keys whose logs were pruned drop out.
        ledger.full_sync_at = now;
        ledger.save()?;
    }

    print_ingest_summary(out, &rows)?;
    Ok(())
}

/// Ingest endpoint from `--url`, then the environment; defaults to production.
pub fn endpoint() -> String {
    resolve_endpoint(
        &resolve_url(
            URL_FLAG.get().cloned(),
            crate::env_var("AGENT_USAGE_URL", "USAGE_INGEST_URL"),
        )
        .unwrap_or_default(),
        &std::env::var("VERCEL_PROJECT_PRODUCTION_URL").unwrap_or_default(),
        &std::env::var("VERCEL_URL").unwrap_or_default(),
    )
}

/// Sign-in command for this run's server. `auth login` has no `--url`, so
/// after `ingest --url` it names that server through `AGENT_USAGE_URL`.
pub fn login_command() -> String {
    login_command_for(URL_FLAG.get().map(|_| oauth::issuer()))
}

fn login_command_for(server: Option<String>) -> String {
    match server {
        Some(server) => format!("AGENT_USAGE_URL={server} agent-usage auth login"),
        None => "agent-usage auth login".to_string(),
    }
}

/// `--url` wins over the `AGENT_USAGE_URL` / `USAGE_INGEST_URL` value.
fn resolve_url(flag: Option<String>, env: Option<OsString>) -> Option<String> {
    flag.or_else(|| env.and_then(|value| value.into_string().ok()))
}

/// `--dry-run`, or any non-empty `AGENT_USAGE_DRY_RUN` / `USAGE_INGEST_DRY_RUN`
/// (Go checked the raw value for emptiness, with no trimming).
fn resolve_dry_run(flag: bool, env: Option<OsString>) -> bool {
    flag || env.is_some_and(|value| !value.is_empty())
}

fn resolve_endpoint(explicit: &str, production: &str, vercel: &str) -> String {
    if let Some(url) = trimmed_non_empty(explicit) {
        return url.to_string();
    }
    let host = trimmed_non_empty(production)
        .or_else(|| trimmed_non_empty(vercel))
        .unwrap_or("https://ruchern.dev");
    if host.starts_with("http://") || host.starts_with("https://") {
        format!("{}/api/usage/ingest", host.trim_end_matches('/'))
    } else {
        format!("https://{host}/api/usage/ingest")
    }
}

fn trimmed_non_empty(value: &str) -> Option<&str> {
    let trimmed = value.trim();
    (!trimmed.is_empty()).then_some(trimmed)
}

fn print_ingest_summary(out: &mut dyn Write, rows: &[IngestRow]) -> io::Result<()> {
    let mut tokens: i64 = 0;
    let mut seen_days: std::collections::HashSet<&str> = std::collections::HashSet::new();
    let mut min_date = rows[0].date.as_str();
    let mut max_date = rows[0].date.as_str();
    for row in rows {
        tokens += row.total_tokens;
        seen_days.insert(row.date.as_str());
        min_date = min_date.min(row.date.as_str());
        max_date = max_date.max(row.date.as_str());
    }
    writeln!(out, "\nDone.")?;
    writeln!(out, "  rows:    {}", format_count(rows.len() as i64))?;
    writeln!(out, "  days:    {}", format_count(seen_days.len() as i64))?;
    writeln!(out, "  range:   {min_date} → {max_date}")?;
    writeln!(out, "  tokens:  {}", format_count(tokens))?;
    writeln!(out, "  cost:    server-priced (costUsd sent as null)")?;
    Ok(())
}

/// Thousands-separated count, e.g. `1234567` -> `"1,234,567"`.
fn format_count(n: i64) -> String {
    let s = n.to_string();
    let (sign, digits) = match s.strip_prefix('-') {
        Some(rest) => ("-", rest),
        None => ("", s.as_str()),
    };
    if digits.len() <= 3 {
        return s;
    }
    let mut groups = Vec::new();
    let mut rest = digits;
    while rest.len() > 3 {
        let split = rest.len() - 3;
        groups.insert(0, &rest[split..]);
        rest = &rest[..split];
    }
    groups.insert(0, rest);
    format!("{sign}{}", groups.join(","))
}

/// Ports Go's `time.Duration.Round(time.Millisecond).String()`, e.g.
/// `2.221s`, `845ms`, `1m2.003s`.
fn format_duration(d: Duration) -> String {
    const MICROSECOND: u128 = 1_000;
    const MILLISECOND: u128 = 1_000_000;
    const SECOND: u128 = 1_000_000_000;

    let nanos = round_to_millis(d);
    if nanos == 0 {
        return "0s".to_string();
    }

    if nanos < SECOND {
        let (unit, prec) = if nanos < MICROSECOND {
            ("ns", 0)
        } else if nanos < MILLISECOND {
            ("µs", 3)
        } else {
            ("ms", 6)
        };
        let (frac, rest) = fmt_frac(nanos, prec);
        format!("{rest}{frac}{unit}")
    } else {
        let (frac, rest) = fmt_frac(nanos, 9);
        let secs = rest % 60;
        let mut minutes_total = rest / 60;
        let mut out = format!("{secs}{frac}s");
        if minutes_total > 0 {
            let minutes = minutes_total % 60;
            let hours = minutes_total / 60;
            out = format!("{minutes}m{out}");
            minutes_total = hours;
            if minutes_total > 0 {
                out = format!("{minutes_total}h{out}");
            }
        }
        out
    }
}

/// Rounds to the nearest millisecond, ties rounding up (durations here are
/// never negative), matching Go's `Duration.Round`.
fn round_to_millis(d: Duration) -> u128 {
    let nanos = d.as_nanos();
    let rem = nanos % 1_000_000;
    if rem * 2 < 1_000_000 {
        nanos - rem
    } else {
        nanos - rem + 1_000_000
    }
}

/// Extracts the bottom `prec` decimal digits of `v` as a fractional string
/// (e.g. `.221`), trimming trailing zeros, and returns the remaining value.
fn fmt_frac(v: u128, prec: u32) -> (String, u128) {
    let mut digits = Vec::new();
    let mut v = v;
    let mut printed = false;
    for _ in 0..prec {
        let digit = (v % 10) as u8;
        printed |= digit != 0;
        if printed {
            digits.push(digit);
        }
        v /= 10;
    }
    if digits.is_empty() {
        (String::new(), v)
    } else {
        digits.reverse();
        let s: String = digits.into_iter().map(|d| (b'0' + d) as char).collect();
        (format!(".{s}"), v)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::collect::ParserStats;

    #[test]
    fn payload_sends_full_effort_days_with_their_token_batches() {
        use crate::collect::EffortLevelCount;
        let rows = [
            IngestRow {
                date: "2026-10-05".into(),
                agent: "codex".into(),
                ..Default::default()
            },
            IngestRow {
                date: "2026-10-05".into(),
                agent: "codex".into(),
                ..Default::default()
            },
            IngestRow {
                date: "2026-10-06".into(),
                agent: "claude".into(),
                ..Default::default()
            },
        ];
        let effort = vec![
            EffortRow {
                date: "2026-10-05".into(),
                agent: "codex".into(),
                levels: vec![EffortLevelCount {
                    level: "ultra".into(),
                    session_count: 3,
                }],
                classified_session_count: 3,
                unclassified_session_count: 1,
            },
            EffortRow {
                date: "2026-10-06".into(),
                agent: "claude".into(),
                ..Default::default()
            },
        ];
        for batch in [&rows[0..1], &rows[1..2]] {
            let payload = serde_json::to_value(Payload::new("device", batch, &effort)).unwrap();
            assert_eq!(payload["rows"].as_array().unwrap().len(), 1);
            assert_eq!(
                payload["effortRows"],
                serde_json::json!([{
                    "date": "2026-10-05", "agent": "codex",
                    "levels": [{"level": "ultra", "sessionCount": 3}],
                    "classifiedSessionCount": 3, "unclassifiedSessionCount": 1
                }])
            );
        }
        assert_eq!(
            Payload::new("device", &rows[2..], &effort).effort_rows,
            vec![&effort[1]]
        );
    }
    use crate::store::{self, OauthTokens};
    use serde::Deserialize;
    use std::sync::{Arc, Mutex};

    fn sample_rows() -> Vec<IngestRow> {
        vec![
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
                agent: "codex".into(),
                provider: "openai".into(),
                model: "gpt-5-codex".into(),
                input_tokens: 200,
                output_tokens: 100,
                cache_read_tokens: 800,
                reasoning_tokens: 200,
                total_tokens: 1300,
                messages: 1,
                ..Default::default()
            },
        ]
    }

    fn assert_rows_payload(raw: &[u8], want: &[IngestRow]) {
        let value: serde_json::Value =
            serde_json::from_slice(raw).expect("payload should be valid JSON");
        assert_eq!(
            value["device"], "device-1",
            "payload should name the device"
        );
        let rows = value["rows"].as_array().expect("payload should have rows");
        assert_eq!(rows.len(), want.len(), "row count mismatch");

        let want_keys = [
            "agent",
            "cacheReadTokens",
            "cacheWriteTokens",
            "costUsd",
            "date",
            "inputTokens",
            "messages",
            "model",
            "outputTokens",
            "provider",
            "reasoningTokens",
            "session",
            "totalTokens",
        ];
        for (i, row) in rows.iter().enumerate() {
            let obj = row.as_object().expect("row should be an object");
            let mut keys: Vec<&str> = obj.keys().map(String::as_str).collect();
            keys.sort_unstable();
            assert_eq!(keys, want_keys, "row {i} keys mismatch");
            assert_eq!(
                obj.get("costUsd"),
                Some(&serde_json::Value::Null),
                "row {i} costUsd should be an explicit null"
            );
        }

        #[derive(Deserialize)]
        struct Wrapper {
            rows: Vec<IngestRow>,
        }
        let typed: Wrapper =
            serde_json::from_slice(raw).expect("payload should deserialise into IngestRow");
        assert_eq!(&typed.rows, want);
    }

    #[test]
    fn ingest_no_rows_prints_message_and_skips_tokens() {
        // Port of TestIngestNoRows.
        let _guard = store::backend::serial();
        store::backend::fail_with("keychain must not be used");

        let mut out = Vec::new();
        let result = ingest_inner(
            &CollectResult::default(),
            "http://unused.invalid",
            "device-1",
            false,
            true,
            &mut out,
        );
        assert!(result.is_ok());
        assert_eq!(String::from_utf8(out).unwrap(), "Nothing to ingest.\n");
    }

    #[test]
    fn ingest_posts_large_payloads_in_batches() {
        let _guard = store::backend::serial();
        store::save_tokens(&OauthTokens {
            access_token: "access-123".into(),
            expiry_unix: oauth::unix_now() + 3600,
            client_id: "client".into(),
            ..Default::default()
        })
        .unwrap();

        let mut server = mockito::Server::new();
        let sizes = Arc::new(Mutex::new(Vec::new()));
        let sizes_writer = Arc::clone(&sizes);
        let mock = server
            .mock("POST", "/")
            .with_body_from_request(move |req| {
                let value: serde_json::Value = serde_json::from_slice(req.body().unwrap()).unwrap();
                sizes_writer
                    .lock()
                    .unwrap()
                    .push(value["rows"].as_array().unwrap().len());
                br#"{"ok":true}"#.to_vec()
            })
            .expect(2)
            .create();

        let collected = CollectResult {
            rows: vec![IngestRow::default(); BATCH_ROWS + 1],
            ..Default::default()
        };
        let mut out = Vec::new();
        ingest_inner(&collected, &server.url(), "device-1", false, true, &mut out).unwrap();

        mock.assert();
        assert_eq!(*sizes.lock().unwrap(), vec![BATCH_ROWS, 1]);
    }

    #[test]
    fn ingest_dry_run_prints_payload_and_skips_tokens() {
        // Port of TestIngestDryRun.
        let _guard = store::backend::serial();
        store::backend::fail_with("keychain must not be used");

        let mut server = mockito::Server::new();
        // Never actually hit if the dry-run path is correct.
        let _mock = server
            .mock("POST", mockito::Matcher::Any)
            .with_body_from_request(|_req| panic!("dry run must not hit the network"))
            .create();

        let rows = sample_rows();
        let collected = CollectResult {
            stats: vec![ParserStats {
                agent: "claude".into(),
                ..Default::default()
            }],
            rows: rows.clone(),
            ..Default::default()
        };
        let mut out = Vec::new();
        ingest_inner(&collected, &server.url(), "device-1", true, true, &mut out).unwrap();

        let out = String::from_utf8(out).unwrap();
        assert!(out.contains(&format!("Dry run: 2 rows (full) → {}", server.url())));
        let idx = out
            .find("\n{")
            .expect("output should contain a JSON payload");
        assert_rows_payload(&out.as_bytes()[idx + 1..], &rows);
    }

    #[derive(Default)]
    struct CapturedRequest {
        content_type: Option<String>,
        authorization: Option<String>,
        body: Vec<u8>,
    }

    #[test]
    fn ingest_posts_rows_with_bearer_token() {
        // Port of TestIngestPostsRows.
        let _guard = store::backend::serial();
        store::save_tokens(&OauthTokens {
            access_token: "access-123".into(),
            expiry_unix: oauth::unix_now() + 3600,
            client_id: "client".into(),
            ..Default::default()
        })
        .unwrap();

        let mut server = mockito::Server::new();
        let captured = Arc::new(Mutex::new(CapturedRequest::default()));
        let captured_writer = Arc::clone(&captured);
        let _mock = server
            .mock("POST", "/")
            .with_body_from_request(move |req| {
                let mut captured = captured_writer.lock().unwrap();
                captured.content_type = req
                    .header("content-type")
                    .first()
                    .and_then(|v| v.to_str().ok())
                    .map(str::to_string);
                captured.authorization = req
                    .header("authorization")
                    .first()
                    .and_then(|v| v.to_str().ok())
                    .map(str::to_string);
                captured.body = req.body().expect("request should have a body").clone();
                br#"{"ok":true}"#.to_vec()
            })
            .create();

        let rows = sample_rows();
        let collected = CollectResult {
            rows: rows.clone(),
            ..Default::default()
        };
        let mut out = Vec::new();
        ingest_inner(&collected, &server.url(), "device-1", false, true, &mut out).unwrap();

        let captured = captured.lock().unwrap();
        assert_eq!(captured.content_type.as_deref(), Some("application/json"));
        assert_eq!(captured.authorization.as_deref(), Some("Bearer access-123"));
        assert_rows_payload(&captured.body, &rows);

        let out = String::from_utf8(out).unwrap();
        for want in [
            format!("Upserting 2 rows (full) → {}", server.url()),
            "Response: 200 in ".to_string(),
            r#" {"ok":true}"#.to_string(),
            "Done.".to_string(),
            "rows:    2".to_string(),
            "days:    2".to_string(),
            "range:   2026-09-12 → 2026-09-13".to_string(),
            "tokens:  2,650".to_string(),
        ] {
            assert!(out.contains(&want), "output missing {want:?}:\n{out}");
        }
    }

    #[test]
    fn ingest_error_status_returns_error_without_summary() {
        // Port of TestIngestErrorStatus.
        let _guard = store::backend::serial();
        store::save_tokens(&OauthTokens {
            access_token: "access-123".into(),
            expiry_unix: oauth::unix_now() + 3600,
            ..Default::default()
        })
        .unwrap();

        let mut server = mockito::Server::new();
        let _mock = server
            .mock("POST", "/")
            .with_status(403)
            .with_body("forbidden")
            .create();

        let collected = CollectResult {
            rows: sample_rows(),
            ..Default::default()
        };
        let mut out = Vec::new();
        let err =
            ingest_inner(&collected, &server.url(), "device-1", false, true, &mut out).unwrap_err();
        assert_eq!(err.to_string(), "ingest endpoint 403: forbidden");
        assert!(!String::from_utf8(out).unwrap().contains("Done."));
    }

    #[test]
    fn ingest_not_signed_in_errors_before_any_request() {
        // Port of TestIngestNotSignedIn.
        let _guard = store::backend::serial();

        let mut server = mockito::Server::new();
        let _mock = server
            .mock("POST", mockito::Matcher::Any)
            .with_body_from_request(|_req| panic!("must not hit the network when signed out"))
            .create();

        let collected = CollectResult {
            rows: sample_rows(),
            ..Default::default()
        };
        let mut out = Vec::new();
        let err =
            ingest_inner(&collected, &server.url(), "device-1", false, true, &mut out).unwrap_err();
        assert!(err.to_string().contains("not signed in"));
    }

    /// Signed in, with no ledger left over from another test.
    fn fresh_signed_in() {
        store::save_tokens(&OauthTokens {
            access_token: "access-123".into(),
            expiry_unix: oauth::unix_now() + 3600,
            client_id: "client".into(),
            ..Default::default()
        })
        .unwrap();
        let _ = std::fs::remove_file(store::ledger_path());
    }

    /// Answers 200 and keeps every request body.
    fn recording_server() -> (mockito::ServerGuard, Arc<Mutex<Vec<serde_json::Value>>>) {
        let mut server = mockito::Server::new();
        let bodies = Arc::new(Mutex::new(Vec::new()));
        let writer = Arc::clone(&bodies);
        server
            .mock("POST", "/")
            .with_body_from_request(move |req| {
                writer
                    .lock()
                    .unwrap()
                    .push(serde_json::from_slice(req.body().unwrap()).unwrap());
                br#"{"ok":true}"#.to_vec()
            })
            .expect_at_least(0)
            .create();
        (server, bodies)
    }

    fn run(result: &CollectResult, url: &str, full: bool) -> String {
        let mut out = Vec::new();
        ingest_inner(result, url, "device-1", false, full, &mut out).unwrap();
        String::from_utf8(out).unwrap()
    }

    fn sent_models(body: &serde_json::Value) -> Vec<String> {
        body["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|row| row["model"].as_str().unwrap().to_string())
            .collect()
    }

    fn stored_ledger() -> Ledger {
        serde_json::from_slice(&std::fs::read(store::ledger_path()).unwrap()).unwrap()
    }

    fn collected(rows: Vec<IngestRow>) -> CollectResult {
        CollectResult {
            rows,
            ..Default::default()
        }
    }

    #[test]
    fn should_send_everything_and_record_it_on_the_first_run() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, bodies) = recording_server();

        let out = run(&collected(sample_rows()), &server.url(), false);

        assert!(out.contains("Upserting 2 rows (full)"), "{out}");
        assert_eq!(bodies.lock().unwrap().len(), 1);
        let ledger = stored_ledger();
        assert_eq!(ledger.rows.len(), 2);
        assert!(ledger.full_sync_at > 0);
        assert_eq!(ledger.device, "device-1");
    }

    #[test]
    fn should_send_nothing_when_nothing_changed() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, bodies) = recording_server();
        let result = collected(sample_rows());
        run(&result, &server.url(), false);

        // No request, so no token is needed either.
        store::backend::fail_with("keychain must not be used");
        let out = run(&result, &server.url(), false);

        assert!(out.contains("No changes since the last ingest."), "{out}");
        assert_eq!(bodies.lock().unwrap().len(), 1);
    }

    #[test]
    fn should_send_only_rows_that_grew_or_are_new() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, bodies) = recording_server();
        let mut rows = sample_rows();
        run(&collected(rows.clone()), &server.url(), false);

        rows[0].total_tokens += 10;
        rows.push(IngestRow {
            session: Some("new-session".into()),
            ..rows[1].clone()
        });
        let out = run(&collected(rows), &server.url(), false);

        assert!(out.contains("Upserting 2 rows (changes)"), "{out}");
        let bodies = bodies.lock().unwrap();
        assert_eq!(
            sent_models(&bodies[1]),
            vec!["claude-sonnet-4-5", "gpt-5-codex"]
        );
        assert_eq!(bodies[1]["rows"][1]["session"], "new-session");
        assert_eq!(stored_ledger().rows.len(), 3);
    }

    #[test]
    fn should_keep_the_ledger_and_resend_after_a_failed_post() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let mut server = mockito::Server::new();
        let failing = server.mock("POST", "/").with_status(500).create();
        let result = collected(sample_rows());

        let mut out = Vec::new();
        assert!(ingest_inner(&result, &server.url(), "device-1", false, false, &mut out).is_err());
        assert!(!store::ledger_path().exists());

        failing.remove();
        let (server, bodies) = recording_server();
        run(&result, &server.url(), false);
        assert_eq!(
            bodies.lock().unwrap()[0]["rows"].as_array().unwrap().len(),
            2
        );
    }

    #[test]
    fn should_record_batches_acknowledged_before_a_failure() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let rows: Vec<_> = (0..=BATCH_ROWS)
            .map(|i| IngestRow {
                model: format!("model-{i}"),
                ..Default::default()
            })
            .collect();
        let mut server = mockito::Server::new();
        // The first matching mock still short of its hits answers, so the
        // first batch gets 200 and the second 500.
        let _ok = server.mock("POST", "/").with_body("{}").expect(1).create();
        let _fail = server.mock("POST", "/").with_status(500).create();

        let mut out = Vec::new();
        let result = collected(rows);
        assert!(ingest_inner(&result, &server.url(), "device-1", false, false, &mut out).is_err());

        let ledger = stored_ledger();
        assert_eq!(ledger.rows.len(), BATCH_ROWS);
        // The full send never finished, so the next run is full again.
        assert_eq!(ledger.full_sync_at, 0);
    }

    #[test]
    fn should_send_a_day_whose_effort_changed_alone() {
        use crate::collect::EffortLevelCount;
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, bodies) = recording_server();
        let effort = |level: &str| EffortRow {
            date: "2026-09-13".into(),
            agent: "codex".into(),
            levels: vec![EffortLevelCount {
                level: level.into(),
                session_count: 1,
            }],
            classified_session_count: 1,
            unclassified_session_count: 0,
        };
        let mut result = collected(sample_rows());
        result.effort_rows = vec![effort("high")];
        run(&result, &server.url(), false);

        result.effort_rows = vec![effort("xhigh")];
        run(&result, &server.url(), false);

        let bodies = bodies.lock().unwrap();
        assert_eq!(sent_models(&bodies[1]), vec!["gpt-5-codex"]);
        assert_eq!(bodies[1]["effortRows"][0]["levels"][0]["level"], "xhigh");
        assert_eq!(
            stored_ledger().effort["2026-09-13|codex"].levels[0].level,
            "xhigh"
        );
    }

    #[test]
    fn should_send_everything_with_full_or_a_day_old_ledger() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, bodies) = recording_server();
        let result = collected(sample_rows());
        run(&result, &server.url(), false);

        let out = run(&result, &server.url(), true);
        assert!(out.contains("Upserting 2 rows (full)"), "{out}");

        let mut ledger = stored_ledger();
        ledger.full_sync_at -= FULL_SYNC_SECS + 1;
        ledger.save().unwrap();
        let out = run(&result, &server.url(), false);
        assert!(out.contains("Upserting 2 rows (full)"), "{out}");
        assert_eq!(bodies.lock().unwrap().len(), 3);
    }

    #[test]
    fn should_send_everything_when_the_ledger_does_not_fit_this_run() {
        let _guard = store::backend::serial();
        let (server, bodies) = recording_server();
        let result = collected(sample_rows());
        type Change = fn(&mut Ledger);
        let cases: [(&str, Change); 3] = [
            ("endpoint", |ledger| {
                ledger.endpoint = "https://other.example".into()
            }),
            ("device", |ledger| ledger.device = "device-2".into()),
            ("version", |ledger| ledger.version = LEDGER_VERSION + 1),
        ];
        for (name, change) in cases {
            fresh_signed_in();
            run(&result, &server.url(), false);
            let mut ledger = stored_ledger();
            change(&mut ledger);
            ledger.save().unwrap();
            let out = run(&result, &server.url(), false);
            assert!(
                out.contains("Upserting 2 rows (full)"),
                "case {name}: {out}"
            );
        }

        fresh_signed_in();
        std::fs::write(store::ledger_path(), "not json").unwrap();
        let out = run(&result, &server.url(), false);
        assert!(out.contains("Upserting 2 rows (full)"), "corrupt: {out}");
        assert_eq!(bodies.lock().unwrap().len(), 7);
    }

    #[test]
    fn should_drop_pruned_rows_only_on_a_full_send() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        let (server, _bodies) = recording_server();
        let rows = sample_rows();
        run(&collected(rows.clone()), &server.url(), false);

        // A pruned log drops a row locally; the server keeps its copy.
        let pruned = collected(rows[..1].to_vec());
        run(&pruned, &server.url(), false);
        assert_eq!(stored_ledger().rows.len(), 2);

        run(&pruned, &server.url(), true);
        assert_eq!(stored_ledger().rows.len(), 1);
    }

    #[test]
    fn should_leave_the_ledger_alone_on_a_dry_run() {
        let _guard = store::backend::serial();
        fresh_signed_in();
        store::backend::fail_with("keychain must not be used");
        let result = collected(sample_rows());

        let mut out = Vec::new();
        ingest_inner(
            &result,
            "http://unused.invalid",
            "device-1",
            true,
            false,
            &mut out,
        )
        .unwrap();

        assert!(
            String::from_utf8(out)
                .unwrap()
                .contains("Dry run: 2 rows (full)")
        );
        assert!(!store::ledger_path().exists());
    }

    #[test]
    fn resolve_endpoint_matches_expected_urls() {
        // Port of TestResolveEndpoint.
        let cases = [
            (
                "default",
                "",
                "",
                "",
                "https://ruchern.dev/api/usage/ingest",
            ),
            (
                "explicit URL used verbatim",
                "http://localhost:3000/custom",
                "blog.example.com",
                "",
                "http://localhost:3000/custom",
            ),
            (
                "blank explicit URL ignored",
                "   ",
                "blog.example.com",
                "",
                "https://blog.example.com/api/usage/ingest",
            ),
            (
                "production host",
                "",
                "blog.example.com",
                "preview.vercel.app",
                "https://blog.example.com/api/usage/ingest",
            ),
            (
                "production URL with scheme and slash",
                "",
                "https://blog.example.com/",
                "",
                "https://blog.example.com/api/usage/ingest",
            ),
            (
                "vercel URL fallback",
                "",
                "",
                "preview.vercel.app",
                "https://preview.vercel.app/api/usage/ingest",
            ),
            (
                "http scheme kept",
                "",
                "",
                "http://localhost:3000",
                "http://localhost:3000/api/usage/ingest",
            ),
        ];
        for (name, explicit, production, vercel, want) in cases {
            assert_eq!(
                resolve_endpoint(explicit, production, vercel),
                want,
                "case {name}"
            );
        }
    }

    #[test]
    fn url_flag_wins_over_environment() {
        let lookup = |vars: &'static [(&'static str, &'static str)]| {
            move |key: &str| {
                vars.iter()
                    .find(|(name, _)| *name == key)
                    .map(|(_, value)| OsString::from(value))
            }
        };
        let env = |vars| crate::env_var_from("AGENT_USAGE_URL", "USAGE_INGEST_URL", lookup(vars));
        let both = &[
            ("AGENT_USAGE_URL", "https://new.example"),
            ("USAGE_INGEST_URL", "https://legacy.example"),
        ];
        let legacy = &[("USAGE_INGEST_URL", "https://legacy.example")];

        assert_eq!(
            resolve_url(Some("https://flag.example".into()), env(both)).as_deref(),
            Some("https://flag.example")
        );
        assert_eq!(
            resolve_url(None, env(both)).as_deref(),
            Some("https://new.example")
        );
        assert_eq!(
            resolve_url(None, env(legacy)).as_deref(),
            Some("https://legacy.example")
        );
        assert_eq!(resolve_url(None, env(&[])), None);
        assert_eq!(
            resolve_endpoint(&resolve_url(None, env(&[])).unwrap_or_default(), "", ""),
            "https://ruchern.dev/api/usage/ingest"
        );
    }

    #[test]
    fn login_command_names_the_url_flag_server() {
        assert_eq!(login_command_for(None), "agent-usage auth login");
        assert_eq!(
            login_command_for(Some("https://blog.localhost".into())),
            "AGENT_USAGE_URL=https://blog.localhost agent-usage auth login"
        );
        // Tests never set `--url`, so the plain command is used.
        assert_eq!(login_command(), "agent-usage auth login");
    }

    #[test]
    fn dry_run_flag_or_non_empty_environment() {
        let lookup = |vars: &'static [(&'static str, &'static str)]| {
            move |key: &str| {
                vars.iter()
                    .find(|(name, _)| *name == key)
                    .map(|(_, value)| OsString::from(value))
            }
        };
        let env =
            |vars| crate::env_var_from("AGENT_USAGE_DRY_RUN", "USAGE_INGEST_DRY_RUN", lookup(vars));

        assert!(resolve_dry_run(true, env(&[])));
        assert!(!resolve_dry_run(false, env(&[])));
        assert!(resolve_dry_run(false, env(&[("AGENT_USAGE_DRY_RUN", "1")])));
        assert!(resolve_dry_run(
            false,
            env(&[("USAGE_INGEST_DRY_RUN", "1")])
        ));
        assert!(!resolve_dry_run(false, env(&[("AGENT_USAGE_DRY_RUN", "")])));
        // The new name wins even when it is set but empty.
        assert!(!resolve_dry_run(
            false,
            env(&[("AGENT_USAGE_DRY_RUN", ""), ("USAGE_INGEST_DRY_RUN", "1")])
        ));
    }

    #[test]
    fn format_count_uses_thousands_separators() {
        // Port of TestFormatCount.
        let cases: [(i64, &str); 7] = [
            (0, "0"),
            (999, "999"),
            (1000, "1,000"),
            (12345, "12,345"),
            (123456, "123,456"),
            (1234567, "1,234,567"),
            (1_000_000_000, "1,000,000,000"),
        ];
        for (n, want) in cases {
            assert_eq!(format_count(n), want, "format_count({n})");
        }
    }
}
