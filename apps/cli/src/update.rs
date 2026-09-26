//! Self-update and the "new version available" notice for the installed
//! collector. The crate version is kept in sync with the monorepo release by
//! semantic-release.
use crate::{oauth, store};
use anyhow::{Context, Result, bail};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{File, Permissions};
use std::io::IsTerminal;
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;
use tempfile::{NamedTempFile, TempDir};

const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");
const LATEST_RELEASE_URL: &str = "https://api.github.com/repos/ruchernchong/blog/releases/latest";
const RELEASE_DOWNLOAD_URL: &str = "https://github.com/ruchernchong/blog/releases/download";
/// Release package built by `agent-usage-build.yml`: `agent-usage/bin/agent-usage`
/// plus the `agent-usage/macos/` install scripts.
const ASSET: &str = "agent-usage-macos.tar.gz";
const UPDATE_COMMAND: &str = "agent-usage update";
const CHECK_INTERVAL_SECS: i64 = 24 * 60 * 60;
const NOTICE_TIMEOUT: Duration = Duration::from_secs(2);
const UPDATE_TIMEOUT: Duration = Duration::from_secs(5 * 60);
/// The universal package is a few MB; anything far bigger is not ours.
const DOWNLOAD_LIMIT: u64 = 64 * 1024 * 1024;

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
        || crate::env_var(
            "AGENT_USAGE_NO_UPDATE_CHECK",
            "USAGE_INGEST_NO_UPDATE_CHECK",
        )
        .is_some()
    {
        return;
    }
    let Some(latest) = latest_version() else {
        return;
    };
    if is_newer(&latest, current) {
        eprintln!("\nA new version of agent-usage is available: {current} → {latest}");
        eprintln!("Run: {UPDATE_COMMAND}");
    }
}

/// What `agent-usage update` found, or installed.
#[derive(Debug)]
enum Outcome {
    UpToDate {
        latest: String,
    },
    Available {
        latest: String,
    },
    /// `package` holds the extracted release package until it is dropped.
    Installed {
        latest: String,
        package: TempDir,
    },
}

/// `agent-usage update [--check]`: replaces the running binary with the
/// latest release, then lets that release's own `install.sh` refresh the
/// wrapper, plist and LaunchAgent when the running binary is the installed one.
pub fn run(check: bool) -> Result<()> {
    let current = CURRENT_VERSION;
    let exe = std::env::current_exe()
        .and_then(std::fs::canonicalize)
        .context("locate the running binary")?;
    match update(
        LATEST_RELEASE_URL,
        RELEASE_DOWNLOAD_URL,
        current,
        check,
        &exe,
    )? {
        Outcome::UpToDate { latest } => {
            println!("agent-usage {current} is up to date (latest release {latest})");
        }
        Outcome::Available { latest } => {
            println!("A new version of agent-usage is available: {current} → {latest}");
            println!("Run: {UPDATE_COMMAND}");
        }
        Outcome::Installed { latest, package } => {
            println!("Updated {} {current} → {latest}", exe.display());
            if installed_binary().as_deref() == Some(exe.as_path()) {
                // The binary is already swapped, so a rerun of `update` would
                // report "up to date"; point at the installer instead.
                run_installer(package.path()).with_context(|| {
                    format!(
                        "binary updated to {latest}, but refreshing the LaunchAgent failed; rerun \
                         `curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install-remote.sh | bash`"
                    )
                })?;
            } else {
                println!("Not the installed binary, so the LaunchAgent was left alone.");
            }
        }
    }
    Ok(())
}

fn update(
    latest_url: &str,
    download_base: &str,
    current: &str,
    check: bool,
    exe: &Path,
) -> Result<Outcome> {
    let latest = fetch_latest(latest_url, UPDATE_TIMEOUT).context("check the latest release")?;
    if !is_newer(&latest, current) {
        return Ok(Outcome::UpToDate { latest });
    }
    if check {
        return Ok(Outcome::Available { latest });
    }
    let package = download_package(download_base, &latest)?;
    replace_binary(&package.path().join("agent-usage/bin/agent-usage"), exe)?;
    Ok(Outcome::Installed { latest, package })
}

fn asset_url(download_base: &str, version: &str, name: &str) -> String {
    format!("{download_base}/v{version}/{name}")
}

/// Downloads the release package and its `.sha256`, verifies the checksum,
/// and only then writes and extracts it into a fresh temp dir.
fn download_package(download_base: &str, version: &str) -> Result<TempDir> {
    let archive = download(&asset_url(download_base, version, ASSET))?;
    let checksum = download(&asset_url(
        download_base,
        version,
        &format!("{ASSET}.sha256"),
    ))?;
    verify_sha256(&archive, &String::from_utf8_lossy(&checksum))?;

    let dir = tempfile::tempdir().context("create temp dir")?;
    let path = dir.path().join(ASSET);
    std::fs::write(&path, &archive).with_context(|| format!("write {}", path.display()))?;
    let status = Command::new("tar")
        .arg("-xzf")
        .arg(&path)
        .arg("-C")
        .arg(dir.path())
        .status()
        .context("run tar")?;
    if !status.success() {
        bail!("extract {ASSET}: tar exited with {status}");
    }
    Ok(dir)
}

fn download(url: &str) -> Result<Vec<u8>> {
    let mut response = oauth::http()
        .get(url)
        .header("user-agent", "agent-usage")
        .config()
        .timeout_global(Some(UPDATE_TIMEOUT))
        .build()
        .call()
        .with_context(|| {
            // The package lands a few minutes after the release is published.
            format!("download {url} (a new release may still be uploading; try again shortly)")
        })?;
    response
        .body_mut()
        .with_config()
        .limit(DOWNLOAD_LIMIT)
        .read_to_vec()
        .with_context(|| format!("read {url}"))
}

/// Checks `data` against a `shasum -a 256` line (`<hex>  <file>`).
fn verify_sha256(data: &[u8], checksum_file: &str) -> Result<()> {
    let expected = checksum_file
        .split_whitespace()
        .next()
        .unwrap_or_default()
        .to_ascii_lowercase();
    let actual: String = Sha256::digest(data)
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect();
    if expected != actual {
        bail!("SHA-256 mismatch for {ASSET}: expected {expected}, got {actual}");
    }
    Ok(())
}

/// Swaps `new` in for `target` without a moment where `target` is missing or
/// half-written: copy into a temp file in the same directory, then rename.
fn replace_binary(new: &Path, target: &Path) -> Result<()> {
    let dir = target
        .parent()
        .with_context(|| format!("{} has no parent directory", target.display()))?;
    let mut source = File::open(new).with_context(|| format!("open {}", new.display()))?;
    let mut temp = NamedTempFile::new_in(dir)
        .with_context(|| format!("create a temp file in {}", dir.display()))?;
    std::io::copy(&mut source, temp.as_file_mut())
        .with_context(|| format!("copy {}", new.display()))?;
    temp.as_file()
        .set_permissions(Permissions::from_mode(0o755))
        .context("chmod the new binary")?;
    temp.as_file().sync_all().context("flush the new binary")?;
    temp.persist(target)
        .with_context(|| format!("replace {}", target.display()))?;
    Ok(())
}

/// Where `install.sh` puts the binary, if it exists.
fn installed_binary() -> Option<PathBuf> {
    let home = std::env::var_os("HOME")?;
    std::fs::canonicalize(PathBuf::from(home).join(".local/bin/agent-usage")).ok()
}

/// Runs the release package's own `install.sh`, which installs its prebuilt
/// `bin/agent-usage` and refreshes the wrapper, plist and LaunchAgent.
fn run_installer(package: &Path) -> Result<()> {
    let script = package.join("agent-usage/macos/install.sh");
    let status = Command::new("zsh")
        .arg(&script)
        .status()
        .with_context(|| format!("run {}", script.display()))?;
    if !status.success() {
        bail!("{} exited with {status}", script.display());
    }
    Ok(())
}

fn latest_version() -> Option<String> {
    let path = store::config_dir().join("update-check.json");
    let cached: UpdateCheck = std::fs::read_to_string(&path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default();
    let now = oauth::unix_now();
    if !is_stale(cached.checked_at, now) {
        return Some(cached.latest);
    }

    let latest = fetch_latest(LATEST_RELEASE_URL, NOTICE_TIMEOUT).unwrap_or(cached.latest);
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

/// Latest release version from the GitHub API, without the tag's `v`.
fn fetch_latest(url: &str, timeout: Duration) -> Result<String> {
    #[derive(Deserialize)]
    struct Release {
        tag_name: String,
    }
    let mut response = oauth::http()
        .get(url)
        .header("accept", "application/vnd.github+json")
        .header("user-agent", "agent-usage")
        .config()
        .timeout_global(Some(timeout))
        .build()
        .call()?;
    let release: Release = serde_json::from_reader(response.body_mut().as_reader())?;
    Ok(release.tag_name.trim_start_matches('v').to_string())
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
    use super::*;
    use mockito::{Matcher, Mock, ServerGuard};

    /// `(latest_url, download_base)` on the mock server.
    fn urls(server: &ServerGuard) -> (String, String) {
        (
            format!("{}/releases/latest", server.url()),
            format!("{}/download", server.url()),
        )
    }

    fn mock_latest(server: &mut ServerGuard, tag: &str) -> Mock {
        server
            .mock("GET", "/releases/latest")
            .with_header("content-type", "application/json")
            .with_body(format!(r#"{{"tag_name":"{tag}"}}"#))
            .create()
    }

    fn mock_no_downloads(server: &mut ServerGuard) -> Mock {
        server
            .mock("GET", Matcher::Regex("^/download/".into()))
            .expect(0)
            .create()
    }

    /// A running binary stand-in holding `old`, alone in its directory.
    fn fake_exe() -> (TempDir, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let exe = dir.path().join("agent-usage");
        std::fs::write(&exe, "old").unwrap();
        (dir, exe)
    }

    /// A release package shaped like `agent-usage-build.yml` makes it.
    fn package(binary: &str) -> Vec<u8> {
        let dir = tempfile::tempdir().unwrap();
        let bin = dir.path().join("agent-usage/bin");
        std::fs::create_dir_all(&bin).unwrap();
        std::fs::write(bin.join("agent-usage"), binary).unwrap();
        let archive = dir.path().join(ASSET);
        let status = Command::new("tar")
            .arg("-czf")
            .arg(&archive)
            .arg("-C")
            .arg(dir.path())
            .arg("agent-usage")
            .status()
            .unwrap();
        assert!(status.success());
        std::fs::read(archive).unwrap()
    }

    fn sha256_line(data: &[u8]) -> String {
        let hex: String = Sha256::digest(data)
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect();
        format!("{hex}  {ASSET}\n")
    }

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

    #[test]
    fn asset_url_points_at_the_tagged_release() {
        assert_eq!(
            asset_url(RELEASE_DOWNLOAD_URL, "1.51.0", ASSET),
            "https://github.com/ruchernchong/blog/releases/download/v1.51.0/agent-usage-macos.tar.gz"
        );
        assert_eq!(
            asset_url(RELEASE_DOWNLOAD_URL, "1.51.0", &format!("{ASSET}.sha256")),
            "https://github.com/ruchernchong/blog/releases/download/v1.51.0/agent-usage-macos.tar.gz.sha256"
        );
    }

    #[test]
    fn equal_or_older_release_is_up_to_date() {
        for tag in ["v1.50.0", "v1.49.3"] {
            let mut server = mockito::Server::new();
            let latest = mock_latest(&mut server, tag);
            let downloads = mock_no_downloads(&mut server);
            let (latest_url, download_base) = urls(&server);
            let (_dir, exe) = fake_exe();

            let outcome = update(&latest_url, &download_base, "1.50.0", false, &exe).unwrap();

            let Outcome::UpToDate { latest: version } = outcome else {
                panic!("{tag} should be up to date, got {outcome:?}");
            };
            assert_eq!(version, tag.trim_start_matches('v'));
            assert_eq!(std::fs::read_to_string(&exe).unwrap(), "old");
            latest.assert();
            downloads.assert();
        }
    }

    #[test]
    fn check_reports_a_newer_release_without_downloading() {
        let mut server = mockito::Server::new();
        let latest = mock_latest(&mut server, "v1.51.0");
        let downloads = mock_no_downloads(&mut server);
        let (latest_url, download_base) = urls(&server);
        let (_dir, exe) = fake_exe();

        let outcome = update(&latest_url, &download_base, "1.50.0", true, &exe).unwrap();

        assert!(
            matches!(&outcome, Outcome::Available { latest } if latest == "1.51.0"),
            "{outcome:?}"
        );
        assert_eq!(std::fs::read_to_string(&exe).unwrap(), "old");
        latest.assert();
        downloads.assert();
    }

    #[test]
    fn newer_release_replaces_the_binary() {
        let archive = package("new");
        let mut server = mockito::Server::new();
        let _latest = mock_latest(&mut server, "v1.51.0");
        let tarball = server
            .mock("GET", "/download/v1.51.0/agent-usage-macos.tar.gz")
            .with_body(&archive)
            .create();
        let checksum = server
            .mock("GET", "/download/v1.51.0/agent-usage-macos.tar.gz.sha256")
            .with_body(sha256_line(&archive))
            .create();
        let (latest_url, download_base) = urls(&server);
        let (dir, exe) = fake_exe();

        let outcome = update(&latest_url, &download_base, "1.50.0", false, &exe).unwrap();

        let Outcome::Installed { latest, package } = outcome else {
            panic!("expected an install, got {outcome:?}");
        };
        assert_eq!(latest, "1.51.0");
        assert!(package.path().join("agent-usage/bin/agent-usage").exists());
        assert_eq!(std::fs::read_to_string(&exe).unwrap(), "new");
        let mode = std::fs::metadata(&exe).unwrap().permissions().mode();
        assert_eq!(mode & 0o777, 0o755);
        // Only the binary is left: the temp file was renamed over it.
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
        tarball.assert();
        checksum.assert();
    }

    #[test]
    fn sha256_mismatch_aborts_before_touching_the_binary() {
        let archive = package("tampered");
        let mut server = mockito::Server::new();
        let _latest = mock_latest(&mut server, "v1.51.0");
        let _tarball = server
            .mock("GET", "/download/v1.51.0/agent-usage-macos.tar.gz")
            .with_body(&archive)
            .create();
        let _checksum = server
            .mock("GET", "/download/v1.51.0/agent-usage-macos.tar.gz.sha256")
            .with_body(sha256_line(b"something else"))
            .create();
        let (latest_url, download_base) = urls(&server);
        let (dir, exe) = fake_exe();

        let error = update(&latest_url, &download_base, "1.50.0", false, &exe).unwrap_err();

        assert!(
            format!("{error:#}").contains("SHA-256 mismatch"),
            "{error:#}"
        );
        assert_eq!(std::fs::read_to_string(&exe).unwrap(), "old");
        assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
    }

    #[test]
    fn missing_package_is_an_error() {
        let mut server = mockito::Server::new();
        let _latest = mock_latest(&mut server, "v1.51.0");
        let _missing = server
            .mock("GET", Matcher::Regex("^/download/".into()))
            .with_status(404)
            .create();
        let (latest_url, download_base) = urls(&server);
        let (_dir, exe) = fake_exe();

        let error = update(&latest_url, &download_base, "1.50.0", false, &exe).unwrap_err();

        assert!(
            format!("{error:#}").contains("try again shortly"),
            "{error:#}"
        );
        assert_eq!(std::fs::read_to_string(&exe).unwrap(), "old");
    }
}
