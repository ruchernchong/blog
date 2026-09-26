#!/bin/zsh
set -euo pipefail

LABEL=dev.ruchern.agent-usage
LEGACY_LABEL=dev.ruchern.usage-ingest
ROOT=$(cd "$(dirname "$0")/.." && pwd)
HOME_DIR=${HOME:?}
BIN_DIR="$HOME_DIR/.local/bin"
LAUNCH_AGENTS="$HOME_DIR/Library/LaunchAgents"
LOGS="$HOME_DIR/Library/Logs"
BIN="$BIN_DIR/agent-usage"
WRAPPER="$BIN_DIR/agent-usage-run"
PLIST="$LAUNCH_AGENTS/${LABEL}.plist"
LEGACY_PLIST="$LAUNCH_AGENTS/${LEGACY_LABEL}.plist"
UID_NUM=$(id -u)
DOMAIN="gui/${UID_NUM}"

mkdir -p "$BIN_DIR" "$LAUNCH_AGENTS" "$LOGS"

# Release packages ship a prebuilt binary in bin/; a checkout builds from source.
# -S swaps the binary in through a temp file, so a running agent-usage (e.g.
# `agent-usage update`) never sees it half-written.
if [[ -x $ROOT/bin/agent-usage ]]; then
  echo "Installing prebuilt $BIN"
  install -S -m 755 "$ROOT/bin/agent-usage" "$BIN"
else
  echo "Building $BIN"
  cargo build --release --manifest-path "$ROOT/Cargo.toml"
  install -S -m 755 "$ROOT/target/release/agent-usage" "$BIN"
fi

# Remove an install from before the rename to agent-usage, once the new binary
# is in place, so the two agents never both run. Its Keychain tokens and
# client id move over on the first run of the new binary.
if [[ -e $LEGACY_PLIST ]] || launchctl print "$DOMAIN/$LEGACY_LABEL" >/dev/null 2>&1; then
  echo "Removing legacy $LEGACY_LABEL"
  launchctl bootout "$DOMAIN" "$LEGACY_PLIST" 2>/dev/null ||
    launchctl bootout "$DOMAIN/$LEGACY_LABEL" 2>/dev/null || true
fi
rm -f "$LEGACY_PLIST" "$BIN_DIR/usage-ingest" "$BIN_DIR/usage-ingest-run"

install -m 755 "$ROOT/macos/agent-usage-run.sh" "$WRAPPER"

sed -e "s|__HOME__|$HOME_DIR|g" -e "s|__WRAPPER__|$WRAPPER|g" \
  "$ROOT/macos/dev.ruchern.agent-usage.plist" >"$PLIST"

if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN" "$PLIST" || true
fi
launchctl bootstrap "$DOMAIN" "$PLIST"
launchctl enable "$DOMAIN/$LABEL"

echo
echo "Installed $LABEL"
echo "  binary  $BIN"
echo "  log     $LOGS/agent-usage.log"
echo
echo "1. Sign in (admin account):  $BIN auth login"
echo "2. Prove one run:            $WRAPPER"
echo "3. Then:  launchctl kickstart -k $DOMAIN/$LABEL"
echo "4. Turn off AgentUsage → Settings → Blog Usage Sync"
