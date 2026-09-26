//! `agent-usage uninstall [--yes]`: removes what `install.sh` put on this Mac
//! (the LaunchAgent and the binary). The Keychain sign-in, config directory and
//! log are kept, so a reinstall picks up where it left off.
use anyhow::{Context, Result, bail};
use std::io::{self, BufRead, IsTerminal, Write};
use std::path::{Path, PathBuf};
use std::process::Command;

const LABEL: &str = "dev.ruchern.agent-usage";

/// The installed files that exist: the LaunchAgent plist and the binary.
fn installed_files(home: &Path) -> Vec<PathBuf> {
    let mut paths = vec![
        home.join(format!("Library/LaunchAgents/{LABEL}.plist")),
        home.join(".local/bin/agent-usage"),
    ];
    paths.retain(|path| path.symlink_metadata().is_ok());
    paths
}

pub fn run(yes: bool) -> Result<()> {
    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .context("home: $HOME is not set")?;
    let files = installed_files(&home);

    println!("This removes:");
    println!("  LaunchAgent {LABEL}");
    for path in &files {
        println!("  {}", path.display());
    }
    if !yes && !confirm()? {
        println!("Nothing removed.");
        return Ok(());
    }

    bootout(&home.join(format!("Library/LaunchAgents/{LABEL}.plist")));
    remove_files(&files)?;

    println!("Uninstalled agent-usage.");
    println!(
        "Kept the Keychain sign-in (run `agent-usage auth logout` first to remove it), ~/.config/agent-usage and ~/Library/Logs/agent-usage.log."
    );
    Ok(())
}

/// Asks `[y/N]` on a terminal; anything else needs `--yes`.
fn confirm() -> Result<bool> {
    if !io::stdin().is_terminal() {
        bail!("not a terminal; pass --yes to uninstall without a prompt");
    }
    print!("Continue? [y/N] ");
    io::stdout().flush()?;
    let mut answer = String::new();
    io::stdin().lock().read_line(&mut answer)?;
    Ok(matches!(answer.trim().to_lowercase().as_str(), "y" | "yes"))
}

/// Unloads the LaunchAgent if it is loaded; a failure is reported, not fatal,
/// so the files are still removed.
fn bootout(plist: &Path) {
    let Some(domain) = gui_domain() else {
        eprintln!("warning: could not read the user id; LaunchAgent left loaded");
        return;
    };
    let loaded = Command::new("launchctl")
        .args(["print", &format!("{domain}/{LABEL}")])
        .output()
        .is_ok_and(|output| output.status.success());
    if !loaded {
        return;
    }
    let booted = Command::new("launchctl")
        .arg("bootout")
        .arg(&domain)
        .arg(plist)
        .status()
        .is_ok_and(|status| status.success());
    if !booted {
        eprintln!(
            "warning: launchctl bootout {domain} failed; the LaunchAgent may still be loaded"
        );
    }
}

fn gui_domain() -> Option<String> {
    let output = Command::new("id").arg("-u").output().ok()?;
    let uid = String::from_utf8(output.stdout).ok()?;
    Some(format!("gui/{}", uid.trim()))
}

/// Deletes the files; one that is already gone is not an error.
fn remove_files(paths: &[PathBuf]) -> Result<()> {
    for path in paths {
        match std::fs::remove_file(path) {
            Ok(()) => {}
            Err(error) if error.kind() == io::ErrorKind::NotFound => {}
            Err(error) => {
                return Err(error).with_context(|| format!("remove {}", path.display()));
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{installed_files, remove_files};

    #[test]
    fn installed_files_lists_plist_and_binary_that_exist() {
        let home = tempfile::tempdir().unwrap();
        assert!(installed_files(home.path()).is_empty());

        let plist = home
            .path()
            .join("Library/LaunchAgents/dev.ruchern.agent-usage.plist");
        let binary = home.path().join(".local/bin/agent-usage");
        for path in [&plist, &binary] {
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(path, "").unwrap();
        }
        // User data is never a target.
        std::fs::create_dir_all(home.path().join(".config/agent-usage")).unwrap();

        assert_eq!(installed_files(home.path()), vec![plist, binary]);
    }

    #[test]
    fn remove_files_skips_missing_files() {
        let home = tempfile::tempdir().unwrap();
        let file = home.path().join("agent-usage");
        std::fs::write(&file, "").unwrap();

        remove_files(&[file.clone(), home.path().join("missing")]).unwrap();
        assert!(!file.exists());
    }
}
