# Install the agent-usage CLI (macOS LaunchAgent)

`agent-usage` (formerly `usage-ingest`) runs an every-15-minutes job: parse
local Claude / Codex / OpenCode / Cursor logs and POST daily rows to `https://ruchern.dev/api/usage/ingest`. Auth is OAuth (admin account),
not `BLOG_MCP_AUTH_TOKEN`.

## 1. Install and sign in

On any Mac, without a checkout or Rust, install the universal binary from the
latest GitHub release of the monorepo. The script checks the SHA-256 before
installing:

```zsh
curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install.sh | bash
```

Pin a release with `AGENT_USAGE_VERSION=X.Y.Z` in front of `bash`. A release
cut before the rename only ships the `usage-ingest` package, so the script falls
back to it and installs `usage-ingest`, which the next upgrade migrates. To read the
script first, download it (the release URL redirects, so keep `-L`):

```zsh
curl -fsSLo install.sh https://github.com/ruchernchong/blog/releases/latest/download/install.sh
bash install.sh
```

`packages/usage/rust/macos/install-remote.sh` only forwards to
`apps/cli/macos/install.sh`, for installs from v1.50.0 and earlier whose
update notice still prints its raw GitHub URL. Delete it once no v1.50.0
installs remain.

From a checkout, the same script builds from source instead (needs a **Rust
toolchain**, via [rustup](https://rustup.rs) or `brew install rust`):

```zsh
bash apps/cli/macos/install.sh
```

Then sign in. Use the **installed** binary for login so Keychain access matches launchd.

```zsh
~/.local/bin/agent-usage auth login
```

The browser opens ruchern.dev. Sign in with the **admin** account (ingest
rejects non-admin OAuth). Tokens go in the login Keychain
(`dev.ruchern.agent-usage`). The cached OAuth client id, update check, and
refresh lock live in `~/.config/agent-usage/` (or `$XDG_CONFIG_HOME/agent-usage/`).
`agent-usage auth status` shows the server, the
access token expiry, and whether a refresh token is stored, without a network
call; it exits non-zero when signed out.

## 2. Prove one POST

```zsh
~/.local/bin/agent-usage-run
```

If there are no local log rows it prints `Nothing to ingest.` and does not POST.
Otherwise check `/usage`. Costs may show N.A. until the server model-registry
workflow finishes. Then:

```zsh
launchctl kickstart -k "gui/$(id -u)/dev.ruchern.agent-usage"
```

Turn **off** Blog Usage Sync in the AgentUsage app (Settings), a separate client
from this CLI.

## 3. Logs

```zsh
tail -f ~/Library/Logs/agent-usage.log
launchctl print "gui/$(id -u)/dev.ruchern.agent-usage"
```

To update, run `agent-usage update` (`--check` only reports the current and
latest versions). It downloads the latest release package and its `.sha256`,
aborts on a checksum mismatch, swaps the new binary in by rename, and then runs
the package's own `install.sh` to refresh the wrapper, plist and LaunchAgent.
Running the `curl` line again works too. From a checkout, after parser changes,
run `install.sh` again, then `auth login` only if Keychain prompts (same
machine, same binary path, usually not).

The collector checks GitHub for a newer release at most once a day and prints
`Run: agent-usage update` when one exists. The check only runs in an interactive
terminal (never from the LaunchAgent), never after `completions`, `measure --json`
or `update`; set `AGENT_USAGE_NO_UPDATE_CHECK=1` to turn it off.

## Commands

```zsh
agent-usage measure [--json]                  # stats table, or JSON only
agent-usage ingest [--dry-run] [--url <URL>]  # what the LaunchAgent runs
agent-usage auth login | logout | status
agent-usage update [--check]                  # install the latest release
agent-usage completions zsh > "${fpath[1]}/_agent-usage"   # or bash, fish
```

`--url` wins over `AGENT_USAGE_URL` and `--dry-run` over `AGENT_USAGE_DRY_RUN`.
`auth login`, `logout` and `status` have no `--url`: they pick the server from
`AGENT_USAGE_URL`. To sign in to the server an `ingest --url` run uses, run
`AGENT_USAGE_URL=<origin> agent-usage auth login`; the not-signed-in error
prints that command.
`login` and `logout` still work on their own as aliases of `auth login` and
`auth logout`.

## Upgrading from usage-ingest

Run the install again. It boots out the old `dev.ruchern.usage-ingest`
LaunchAgent and deletes its plist, `~/.local/bin/usage-ingest`, and
`~/.local/bin/usage-ingest-run` before loading `dev.ruchern.agent-usage`. On
its first run the new binary moves the Keychain tokens from
`dev.ruchern.usage-ingest` to `dev.ruchern.agent-usage` and moves the cached
client id from `~/.config/ruchern/` to `~/.config/agent-usage/` (removing the old
directory once empty), so there is no need to sign in again. macOS may ask once to let
`agent-usage` read the old Keychain item. The old
`~/Library/Logs/ruchern-usage-ingest.log` is left in place.

Environment variables moved to `AGENT_USAGE_*` (`AGENT_USAGE_URL`,
`AGENT_USAGE_DRY_RUN`, `AGENT_USAGE_NO_UPDATE_CHECK`, `AGENT_USAGE_VERSION`,
`AGENT_USAGE_BIN`). Each falls back to its legacy `USAGE_INGEST_*` name when
unset.

## 4. Uninstall

```zsh
~/.local/bin/agent-usage auth logout
zsh apps/cli/macos/uninstall.sh
# without a checkout:
curl -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/apps/cli/macos/uninstall.sh | zsh
```

`uninstall.sh` removes a leftover `usage-ingest` install too, and `auth logout`
clears both the new and the legacy Keychain items.

## Releasing

Nothing to do by hand. Whenever semantic-release publishes `vX.Y.Z` from
`main`, `ci.yml` runs `agent-usage-build.yml`, which builds both architectures, merges them with `lipo`, and attaches
`agent-usage-macos.tar.gz` plus its `.sha256` to that release, along with
`install.sh`. The files land a few minutes after the release appears, so
an install or `agent-usage update` in that window gets a 404.
