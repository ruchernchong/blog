#!/bin/zsh
set -euo pipefail

LABEL=dev.ruchern.usage-ingest
HOME_DIR=${HOME:?}
PLIST="$HOME_DIR/Library/LaunchAgents/${LABEL}.plist"
UID_NUM=$(id -u)
DOMAIN="gui/${UID_NUM}"

if launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN" "$PLIST" || launchctl bootout "$DOMAIN/$LABEL" || true
fi
rm -f "$PLIST"
rm -f "$HOME_DIR/.local/bin/usage-ingest" "$HOME_DIR/.local/bin/usage-ingest-run"

echo "Removed $LABEL (Keychain tokens left — run: usage-ingest logout)"
