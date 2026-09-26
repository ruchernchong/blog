// Local usage collector: parse agent logs on this machine, optionally POST
// daily aggregates to POST /api/usage/ingest.
//
//	agent-usage measure [--json]              # stats table, or JSON only
//	agent-usage ingest [--dry-run] [--url]    # POST rows (OAuth bearer; server prices)
//	agent-usage auth login | logout | status  # OAuth (browser + Keychain)
//	agent-usage update [--check]              # install the latest release
//	agent-usage completions <zsh|bash|fish>
mod collect;
mod cursor;
mod grok;
mod ingest;
mod oauth;
mod parse;
mod store;
mod update;

use anyhow::{Context, Result};
use clap::{Args, CommandFactory, Parser, Subcommand, ValueEnum};
use clap_complete::Shell;
use collect::ParserStats;
use serde::Serialize;
use std::ffi::OsString;
use std::io::{self, Write};
use std::path::PathBuf;

/// Collects local AI agent usage and ingests daily rows into ruchern.dev.
#[derive(Debug, Parser)]
#[command(name = "agent-usage", version, arg_required_else_help = true)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Parse local agent logs and print per-agent stats
    Measure {
        /// Print only the JSON stats
        #[arg(long)]
        json: bool,
    },
    /// POST daily rows to the ingest endpoint
    Ingest(IngestArgs),
    /// Sign in, sign out, or check the stored sign-in
    Auth {
        #[command(subcommand)]
        command: AuthCommand,
    },
    /// Update to the latest release
    Update {
        /// Only report the current and latest versions
        #[arg(long)]
        check: bool,
    },
    /// Print a shell completion script
    Completions {
        #[arg(value_enum)]
        shell: CompletionShell,
    },
    /// Alias for `auth login`
    #[command(hide = true)]
    Login,
    /// Alias for `auth logout`
    #[command(hide = true)]
    Logout,
}

#[derive(Debug, Args)]
struct IngestArgs {
    /// Print the payload instead of POSTing it [env: AGENT_USAGE_DRY_RUN]
    #[arg(long)]
    dry_run: bool,
    /// Ingest endpoint [env: AGENT_USAGE_URL] [default: https://ruchern.dev/api/usage/ingest]
    #[arg(long, value_name = "URL", value_parser = clap::builder::NonEmptyStringValueParser::new())]
    url: Option<String>,
}

#[derive(Debug, Subcommand)]
enum AuthCommand {
    /// Sign in with the browser and store the tokens in the Keychain
    Login,
    /// Remove the stored tokens
    Logout,
    /// Show the stored sign-in for the server (no network)
    Status,
}

#[derive(Clone, Copy, Debug, PartialEq, ValueEnum)]
enum CompletionShell {
    Zsh,
    Bash,
    Fish,
}

impl From<CompletionShell> for Shell {
    fn from(shell: CompletionShell) -> Self {
        match shell {
            CompletionShell::Zsh => Shell::Zsh,
            CompletionShell::Bash => Shell::Bash,
            CompletionShell::Fish => Shell::Fish,
        }
    }
}

impl Command {
    /// Whether the update notice may run after this command. Output meant for
    /// another program (a completion script, JSON stats) must stay clean, and
    /// `update` reports versions itself.
    fn notifies_update(&self) -> bool {
        !matches!(
            self,
            Command::Completions { .. } | Command::Measure { json: true } | Command::Update { .. }
        )
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MeasureResult<'a> {
    agents: &'a [String],
    event_count: usize,
    stats: &'a [ParserStats],
}

/// Reads `name`, falling back to the pre-rename `USAGE_INGEST_*` variable
/// `legacy` when `name` is unset, so existing shells and scripts keep working.
fn env_var(name: &str, legacy: &str) -> Option<OsString> {
    env_var_from(name, legacy, |key| std::env::var_os(key))
}

/// [`env_var`] with an injectable lookup, so tests never mutate the environment.
fn env_var_from(
    name: &str,
    legacy: &str,
    lookup: impl Fn(&str) -> Option<OsString>,
) -> Option<OsString> {
    lookup(name).or_else(|| lookup(legacy))
}

fn main() {
    let command = Cli::parse().command;
    let notify = command.notifies_update();
    let result = run(command);
    if notify {
        update::notify();
    }
    if let Err(error) = result {
        eprintln!("{error:#}");
        std::process::exit(1);
    }
}

fn run(command: Command) -> Result<()> {
    match command {
        Command::Auth {
            command: AuthCommand::Login,
        }
        | Command::Login => oauth::login().context("login"),
        Command::Auth {
            command: AuthCommand::Logout,
        }
        | Command::Logout => oauth::logout().context("logout"),
        Command::Auth {
            command: AuthCommand::Status,
        } => oauth::status(),
        Command::Update { check } => update::run(check).context("update"),
        Command::Completions { shell } => {
            clap_complete::generate(
                Shell::from(shell),
                &mut Cli::command(),
                "agent-usage",
                &mut io::stdout(),
            );
            Ok(())
        }
        Command::Measure { json } => {
            let result = collect_home()?;
            let mut out = io::stdout().lock();
            if json {
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
            } else {
                collect::print_table(&mut out, &result.stats)?;
            }
            Ok(())
        }
        Command::Ingest(args) => {
            let result = collect_home()?;
            ingest::ingest(&result, args.url, args.dry_run).context("ingest")
        }
    }
}

/// Collects every agent's logs under `$HOME`, printing warnings to stderr.
fn collect_home() -> Result<collect::CollectResult> {
    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .context("home: $HOME is not set")?;
    let result = collect::collect(&home);
    for warning in &result.warnings {
        eprintln!("warning: {warning}");
    }
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use clap::error::ErrorKind;
    use std::collections::HashMap;

    fn parse(args: &[&str]) -> Result<Command, clap::Error> {
        Cli::try_parse_from(std::iter::once("agent-usage").chain(args.iter().copied()))
            .map(|cli| cli.command)
    }

    #[test]
    fn cli_definition_is_valid() {
        Cli::command().debug_assert();
    }

    #[test]
    fn no_subcommand_prints_help() {
        let error = parse(&[]).unwrap_err();
        assert_eq!(
            error.kind(),
            ErrorKind::DisplayHelpOnMissingArgumentOrSubcommand
        );
        assert!(error.to_string().contains("Usage: agent-usage <COMMAND>"));
    }

    #[test]
    fn help_and_version_are_available() {
        assert_eq!(
            parse(&["--help"]).unwrap_err().kind(),
            ErrorKind::DisplayHelp
        );
        let version = parse(&["--version"]).unwrap_err();
        assert_eq!(version.kind(), ErrorKind::DisplayVersion);
        assert!(version.to_string().contains(env!("CARGO_PKG_VERSION")));
    }

    #[test]
    fn unknown_arguments_are_errors() {
        for args in [
            &["frobnicate"][..],
            &["--dry-run"],
            &["measure", "--csv"],
            &["measure", "extra"],
            &["ingest", "--dryrun"],
            &["ingest", "--url"],
            &["ingest", "--url", ""],
            &["auth"],
            &["auth", "whoami"],
            &["completions"],
            &["completions", "powershell"],
            &["login", "--json"],
            &["update", "--force"],
            &["update", "latest"],
        ] {
            assert!(parse(args).is_err(), "{args:?} should be rejected");
        }
    }

    #[test]
    fn parses_measure() {
        assert!(matches!(
            parse(&["measure"]).unwrap(),
            Command::Measure { json: false }
        ));
        assert!(matches!(
            parse(&["measure", "--json"]).unwrap(),
            Command::Measure { json: true }
        ));
    }

    #[test]
    fn parses_ingest_flags() {
        let Command::Ingest(args) = parse(&["ingest"]).unwrap() else {
            panic!("expected ingest");
        };
        assert!(!args.dry_run);
        assert_eq!(args.url, None);

        let Command::Ingest(args) =
            parse(&["ingest", "--dry-run", "--url", "https://blog.localhost/x"]).unwrap()
        else {
            panic!("expected ingest");
        };
        assert!(args.dry_run);
        assert_eq!(args.url.as_deref(), Some("https://blog.localhost/x"));

        let Command::Ingest(args) = parse(&["ingest", "--url=http://localhost:3000"]).unwrap()
        else {
            panic!("expected ingest");
        };
        assert_eq!(args.url.as_deref(), Some("http://localhost:3000"));
    }

    #[test]
    fn parses_auth_subcommands_and_hidden_aliases() {
        assert!(matches!(
            parse(&["auth", "login"]).unwrap(),
            Command::Auth {
                command: AuthCommand::Login
            }
        ));
        assert!(matches!(
            parse(&["auth", "logout"]).unwrap(),
            Command::Auth {
                command: AuthCommand::Logout
            }
        ));
        assert!(matches!(
            parse(&["auth", "status"]).unwrap(),
            Command::Auth {
                command: AuthCommand::Status
            }
        ));
        assert!(matches!(parse(&["login"]).unwrap(), Command::Login));
        assert!(matches!(parse(&["logout"]).unwrap(), Command::Logout));

        let help = Cli::command().render_help().to_string();
        assert!(help.contains("auth"));
        assert!(!help.contains("login"), "login alias should be hidden");
        assert!(!help.contains("logout"), "logout alias should be hidden");
    }

    #[test]
    fn parses_update() {
        assert!(matches!(
            parse(&["update"]).unwrap(),
            Command::Update { check: false }
        ));
        assert!(matches!(
            parse(&["update", "--check"]).unwrap(),
            Command::Update { check: true }
        ));
    }

    #[test]
    fn parses_completions_shells() {
        for (name, want) in [
            ("zsh", CompletionShell::Zsh),
            ("bash", CompletionShell::Bash),
            ("fish", CompletionShell::Fish),
        ] {
            let Command::Completions { shell } = parse(&["completions", name]).unwrap() else {
                panic!("expected completions for {name}");
            };
            assert_eq!(shell, want);
        }
    }

    #[test]
    fn completions_cover_the_command_tree() {
        let mut out = Vec::new();
        clap_complete::generate(Shell::Zsh, &mut Cli::command(), "agent-usage", &mut out);
        let script = String::from_utf8(out).unwrap();
        for word in ["measure", "ingest", "--dry-run", "--url", "auth", "status"] {
            assert!(script.contains(word), "zsh completions missing {word}");
        }
    }

    #[test]
    fn update_notice_is_off_for_machine_readable_output() {
        assert!(!parse(&["completions", "zsh"]).unwrap().notifies_update());
        assert!(!parse(&["measure", "--json"]).unwrap().notifies_update());
        assert!(!parse(&["update"]).unwrap().notifies_update());
        assert!(!parse(&["update", "--check"]).unwrap().notifies_update());
        assert!(parse(&["measure"]).unwrap().notifies_update());
        assert!(parse(&["ingest"]).unwrap().notifies_update());
        assert!(parse(&["auth", "status"]).unwrap().notifies_update());
    }

    #[test]
    fn env_var_prefers_new_name_over_legacy() {
        let env = |pairs: &[(&str, &str)]| -> HashMap<String, OsString> {
            pairs
                .iter()
                .map(|(key, value)| (key.to_string(), OsString::from(value)))
                .collect()
        };
        let lookup = |vars: HashMap<String, OsString>| move |key: &str| vars.get(key).cloned();

        let both = env(&[("NEW", "new"), ("OLD", "old")]);
        assert_eq!(env_var_from("NEW", "OLD", lookup(both)), Some("new".into()));

        let legacy_only = env(&[("OLD", "old")]);
        assert_eq!(
            env_var_from("NEW", "OLD", lookup(legacy_only)),
            Some("old".into())
        );

        // Set but empty still counts as set, as before the rename.
        let empty_new = env(&[("NEW", ""), ("OLD", "old")]);
        assert_eq!(
            env_var_from("NEW", "OLD", lookup(empty_new)),
            Some("".into())
        );

        assert_eq!(env_var_from("NEW", "OLD", lookup(env(&[]))), None);
    }
}
