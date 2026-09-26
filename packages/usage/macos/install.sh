#!/bin/zsh
set -euo pipefail

LABEL=dev.ruchern.usage-ingest
ROOT=$(cd "$(dirname "$0")/.." && pwd)
HOME_DIR=${HOME:?}
BIN_DIR="$HOME_DIR/.local/bin"
LAUNCH_AGENTS="$HOME_DIR/Library/LaunchAgents"
LOGS="$HOME_DIR/Library/Logs"
BIN="$BIN_DIR/usage-ingest"
WRAPPER="$BIN_DIR/usage-ingest-run"
PLIST="$LAUNCH_AGENTS/${LABEL}.plist"
UID_NUM=$(id -u)
DOMAIN="gui/${UID_NUM}"

mkdir -p "$BIN_DIR" "$LAUNCH_AGENTS" "$LOGS"

# Release packages ship a prebuilt binary in bin/; a checkout builds from source.
if [[ -x $ROOT/bin/usage-ingest ]]; then
  echo "Installing prebuilt $BIN"
  install -m 755 "$ROOT/bin/usage-ingest" "$BIN"
else
  echo "Building $BIN"
  cargo build --release --manifest-path "$ROOT/Cargo.toml"
  install -m 755 "$ROOT/target/release/usage-ingest" "$BIN"
fi

install -m 755 "$ROOT/macos/usage-ingest-run.sh" "$WRAPPER"

sed -e "s|__HOME__|$HOME_DIR|g" -e "s|__WRAPPER__|$WRAPPER|g" \
  "$ROOT/macos/dev.ruchern.usage-ingest.plist" >"$PLIST"

if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN" "$PLIST" || true
fi
launchctl bootstrap "$DOMAIN" "$PLIST"
launchctl enable "$DOMAIN/$LABEL"

echo
echo "Installed $LABEL"
echo "  binary  $BIN"
echo "  log     $LOGS/ruchern-usage-ingest.log"
echo
echo "1. Sign in (admin account):  $BIN login"
echo "2. Prove one run:            $WRAPPER"
echo "3. Then:  launchctl kickstart -k $DOMAIN/$LABEL"
echo "4. Turn off AgentUsage → Settings → Blog Usage Sync"
