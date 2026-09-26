# Install the usage collector (macOS LaunchAgent)

Every-15-minutes job: parse local Claude / Codex / OpenCode / Cursor logs and POST daily
rows to `https://ruchern.dev/api/usage/ingest`. Auth is OAuth (admin account),
not `BLOG_MCP_AUTH_TOKEN`.

## 1. Install and sign in

On any Mac, without a checkout or Rust, install the universal binary from the
latest GitHub release of the monorepo. The script checks the SHA-256 before
installing:

```zsh
curl -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/packages/usage/rust/macos/install-remote.sh | bash
```

Pin a release with `USAGE_INGEST_VERSION=1.42.0` in front of `bash`. To read the
script first, download it with `curl -o install-remote.sh …` and run
`bash install-remote.sh`.

From a checkout, build from source instead (needs a **Rust toolchain**, via
[rustup](https://rustup.rs) or `brew install rust`):

```zsh
zsh packages/usage/rust/macos/install.sh
```

Then sign in. Use the **installed** binary for login so Keychain access matches launchd.

```zsh
~/.local/bin/usage-ingest login
```

The browser opens ruchern.dev. Sign in with the **admin** account (ingest
rejects non-admin OAuth). Tokens go in the login Keychain
(`dev.ruchern.usage-ingest`).

## 2. Prove one POST

```zsh
~/.local/bin/usage-ingest-run
```

If there are no local log rows it prints `Nothing to ingest.` and does not POST.
Otherwise check `/usage`. Costs may show N.A. until the server model-registry
workflow finishes. Then:

```zsh
launchctl kickstart -k "gui/$(id -u)/dev.ruchern.usage-ingest"
```

Turn **off** AgentUsage → Settings → Blog Usage Sync.

## 3. Logs

```zsh
tail -f ~/Library/Logs/ruchern-usage-ingest.log
launchctl print "gui/$(id -u)/dev.ruchern.usage-ingest"
```

To update, run the `curl` line again (or `install.sh` from a checkout). After parser changes, run `install.sh` again, then `login` only if Keychain
prompts (same machine, same binary path, usually not).

The collector checks GitHub for a newer release at most once a day and print the
update command when one exists. The check only runs in an interactive terminal
(never from the LaunchAgent); set `USAGE_INGEST_NO_UPDATE_CHECK=1` to turn it off.

## 4. Uninstall

```zsh
~/.local/bin/usage-ingest logout
zsh packages/usage/rust/macos/uninstall.sh
# without a checkout:
curl -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/packages/usage/rust/macos/uninstall.sh | zsh
```

## Releasing

Nothing to do by hand. Whenever semantic-release publishes `vX.Y.Z` from
`main`, `ci.yml` runs `usage-ingest-build.yml`, which builds both architectures, merges them with `lipo`, and attaches
`usage-ingest-macos.tar.gz` plus its `.sha256` to that release. The files land a
few minutes after the release appears, so an install in that window gets a 404.
