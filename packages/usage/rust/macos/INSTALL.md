# Install the usage collector (macOS LaunchAgent)

Every-15-minutes job: parse local Claude / Codex / OpenCode / Cursor logs and POST daily
rows to `https://ruchern.dev/api/usage/ingest`. Auth is OAuth (admin account),
not `BLOG_MCP_AUTH_TOKEN`.

Requires a **Rust toolchain** on the PATH (`install.sh` runs `cargo build --release`).
Install via [rustup](https://rustup.rs) or Homebrew (`brew install rust`).

## 1. Build and sign in

Use the **installed** binary for login so Keychain access matches launchd.

```zsh
zsh packages/usage/rust/macos/install.sh
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

After parser changes, run `install.sh` again, then `login` only if Keychain
prompts (same machine, same binary path, usually not).

## 4. Uninstall

```zsh
~/.local/bin/usage-ingest logout
zsh packages/usage/rust/macos/uninstall.sh
```
