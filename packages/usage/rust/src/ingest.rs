use crate::collect::{CollectResult, IngestRow, print_table};
use crate::oauth;
use anyhow::{Result, bail};
use serde::Serialize;
use std::io::{self, Write};
use std::time::{Duration, Instant};

const ROW_CAP: usize = 20_000;
/// Matches Go's `io.LimitReader(resp.Body, 1<<20)`.
const RESPONSE_BODY_LIMIT: u64 = 1 << 20;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(120);

#[derive(Serialize)]
struct Payload<'a> {
    rows: &'a [IngestRow],
}

/// POST daily rows to `/api/usage/ingest` (OAuth bearer; the server prices them).
pub fn ingest(result: &CollectResult) -> Result<()> {
    let endpoint = resolve_endpoint(
        &std::env::var("USAGE_INGEST_URL").unwrap_or_default(),
        &std::env::var("VERCEL_PROJECT_PRODUCTION_URL").unwrap_or_default(),
        &std::env::var("VERCEL_URL").unwrap_or_default(),
    );
    // Go checks the raw env var for emptiness (no trimming) here.
    let dry_run = !std::env::var("USAGE_INGEST_DRY_RUN")
        .unwrap_or_default()
        .is_empty();

    let mut out = io::stdout().lock();
    ingest_inner(result, &endpoint, dry_run, &mut out)
}

/// Testable core: takes the endpoint and dry-run flag explicitly instead of
/// reading the environment, and writes to an injected sink instead of stdout.
fn ingest_inner(
    result: &CollectResult,
    endpoint: &str,
    dry_run: bool,
    out: &mut dyn Write,
) -> Result<()> {
    if result.rows.is_empty() {
        writeln!(out, "Nothing to ingest.")?;
        return Ok(());
    }
    if result.rows.len() > ROW_CAP {
        bail!(
            "row count {} exceeds ingest cap of {ROW_CAP}",
            result.rows.len()
        );
    }

    print_table(out, &result.stats)?;
    writeln!(out)?;

    let payload = Payload { rows: &result.rows };

    if dry_run {
        writeln!(out, "Dry run: {} rows → {endpoint}", result.rows.len())?;
        writeln!(out, "{}", serde_json::to_string_pretty(&payload)?)?;
        return Ok(());
    }

    let token = oauth::bearer_token()?;
    let body = serde_json::to_vec(&payload)?;

    writeln!(
        out,
        "Upserting {} rows → {endpoint}",
        format_count(result.rows.len() as i64)
    )?;

    let started = Instant::now();
    let mut response = ureq::post(endpoint)
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

    print_ingest_summary(out, &result.rows)?;
    Ok(())
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
            false,
            &mut out,
        );
        assert!(result.is_ok());
        assert_eq!(String::from_utf8(out).unwrap(), "Nothing to ingest.\n");
    }

    #[test]
    fn ingest_row_cap_rejects_over_20000_rows() {
        // Port of TestIngestRowCap.
        let _guard = store::backend::serial();
        store::backend::fail_with("keychain must not be used");

        let collected = CollectResult {
            rows: vec![IngestRow::default(); 20_001],
            ..Default::default()
        };
        let mut out = Vec::new();
        let err = ingest_inner(&collected, "http://unused.invalid", false, &mut out).unwrap_err();
        assert!(err.to_string().contains("exceeds ingest cap of 20000"));
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
        ingest_inner(&collected, &server.url(), true, &mut out).unwrap();

        let out = String::from_utf8(out).unwrap();
        assert!(out.contains(&format!("Dry run: 2 rows → {}", server.url())));
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
        ingest_inner(&collected, &server.url(), false, &mut out).unwrap();

        let captured = captured.lock().unwrap();
        assert_eq!(captured.content_type.as_deref(), Some("application/json"));
        assert_eq!(captured.authorization.as_deref(), Some("Bearer access-123"));
        assert_rows_payload(&captured.body, &rows);

        let out = String::from_utf8(out).unwrap();
        for want in [
            format!("Upserting 2 rows → {}", server.url()),
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
        let err = ingest_inner(&collected, &server.url(), false, &mut out).unwrap_err();
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
        let err = ingest_inner(&collected, &server.url(), false, &mut out).unwrap_err();
        assert!(err.to_string().contains("not signed in"));
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
