//! "New version available" notice for the installed collector. The crate
//! version is kept in sync with the monorepo release by semantic-release.
use crate::{oauth, store};
use serde::{Deserialize, Serialize};
use std::io::IsTerminal;
use std::time::Duration;

const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");
const LATEST_RELEASE_URL: &str = "https://api.github.com/repos/ruchernchong/blog/releases/latest";
const INSTALL_COMMAND: &str = "curl -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/apps/cli/macos/install-remote.sh | bash";
const CHECK_INTERVAL_SECS: i64 = 24 * 60 * 60;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Default, Serialize, Deserialize)]
struct UpdateCheck {
    checked_at: i64,
    latest: String,
}

/// Prints an update notice to stderr when a newer release exists. Checks
/// GitHub at most once a day, only in an interactive terminal (never from the
/// LaunchAgent), and never fails the command.
pub fn notify() {
    let current = CURRENT_VERSION;
    if !std::io::stderr().is_terminal()
        || std::env::var_os("USAGE_INGEST_NO_UPDATE_CHECK").is_some()
    {
        return;
    }
    let Some(latest) = latest_version() else {
        return;
    };
    if is_newer(&latest, current) {
        eprintln!("\nA new version of usage-ingest is available: {current} → {latest}");
        eprintln!("Update: {INSTALL_COMMAND}");
    }
}

fn latest_version() -> Option<String> {
    let path = store::config_dir().join("usage-ingest-update-check.json");
    let cached: UpdateCheck = std::fs::read_to_string(&path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    let now = oauth::unix_now();
    if !is_stale(cached.checked_at, now) {
        return Some(cached.latest);
    }

    let latest = fetch_latest().unwrap_or(cached.latest);
    // Record the attempt even when it failed, so an offline machine retries
    // tomorrow rather than on every run.
    let check = UpdateCheck {
        checked_at: now,
        latest: latest.clone(),
    };
    if store::ensure_config_dir().is_ok()
        && let Ok(raw) = serde_json::to_string(&check)
    {
        let _ = std::fs::write(&path, raw);
    }
    (!latest.is_empty()).then_some(latest)
}

fn fetch_latest() -> Option<String> {
    #[derive(Deserialize)]
    struct Release {
        tag_name: String,
    }
    let mut response = oauth::http()
        .get(LATEST_RELEASE_URL)
        .header("accept", "application/vnd.github+json")
        .header("user-agent", "usage-ingest")
        .config()
        .timeout_global(Some(REQUEST_TIMEOUT))
        .build()
        .call()
        .ok()?;
    let release: Release = serde_json::from_reader(response.body_mut().as_reader()).ok()?;
    Some(release.tag_name.trim_start_matches('v').to_string())
}

fn is_stale(checked_at: i64, now: i64) -> bool {
    now - checked_at >= CHECK_INTERVAL_SECS
}

/// Numeric `major.minor.patch` comparison; anything unparseable is not newer.
fn is_newer(latest: &str, current: &str) -> bool {
    fn parse(version: &str) -> Option<(u64, u64, u64)> {
        let mut parts = version.trim_start_matches('v').splitn(3, '.');
        Some((
            parts.next()?.parse().ok()?,
            parts.next()?.parse().ok()?,
            parts.next()?.parse().ok()?,
        ))
    }
    matches!((parse(latest), parse(current)), (Some(latest), Some(current)) if latest > current)
}

#[cfg(test)]
mod tests {
    use super::{CHECK_INTERVAL_SECS, is_newer, is_stale};

    #[test]
    fn is_newer_compares_numerically() {
        assert!(is_newer("1.50.0", "1.49.1"));
        assert!(is_newer("v1.10.0", "1.9.9"));
        assert!(is_newer("2.0.0", "1.99.99"));
        assert!(!is_newer("1.49.1", "1.49.1"));
        assert!(!is_newer("1.49.0", "1.49.1"));
        assert!(!is_newer("", "1.49.1"));
        assert!(!is_newer("1.50", "1.49.1"));
        assert!(!is_newer("1.50.0-beta", "1.49.1"));
    }

    #[test]
    fn is_stale_after_one_day() {
        assert!(is_stale(0, CHECK_INTERVAL_SECS));
        assert!(!is_stale(100, 100 + CHECK_INTERVAL_SECS - 1));
    }
}
