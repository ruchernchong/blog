// Local usage collector: parse agent logs on this machine, optionally POST
// daily aggregates to POST /api/usage/ingest.
//
//	usage-ingest              # measure (table + JSON stats)
//	usage-ingest login        # OAuth (browser + Keychain)
//	usage-ingest logout
//	usage-ingest ingest       # POST rows (OAuth bearer; server prices)
mod collect;
mod cursor;
mod ingest;
mod oauth;
mod parse;
mod store;

use anyhow::{Context, Result, bail};
use collect::ParserStats;
use serde::Serialize;
use std::io::{self, Write};
use std::path::PathBuf;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MeasureResult<'a> {
    agents: &'a [String],
    event_count: usize,
    stats: &'a [ParserStats],
}

fn main() {
    if let Err(error) = run() {
        eprintln!("{error:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cmd = std::env::args()
        .nth(1)
        .filter(|arg| !arg.starts_with('-'))
        .unwrap_or_else(|| "measure".to_string());

    match cmd.as_str() {
        "login" => return oauth::login().context("login"),
        "logout" => return oauth::logout().context("logout"),
        _ => {}
    }

    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .context("home: $HOME is not set")?;
    let result = collect::collect(&home);
    for warning in &result.warnings {
        eprintln!("warning: {warning}");
    }

    match cmd.as_str() {
        "measure" => {
            let mut out = io::stdout().lock();
            collect::print_table(&mut out, &result.stats)?;
            writeln!(out)?;
            serde_json::to_writer_pretty(
                &mut out,
                &MeasureResult {
                    agents: &result.agents,
                    event_count: result.event_count,
                    stats: &result.stats,
                },
            )
            .context("json")?;
            writeln!(out)?;
        }
        "ingest" => ingest::ingest(&result).context("ingest")?,
        other => bail!("unknown command {other:?} (measure | login | logout | ingest)"),
    }
    Ok(())
}
