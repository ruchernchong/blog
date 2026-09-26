#!/bin/zsh
set -euo pipefail

LABEL=dev.ruchern.agent-usage
LEGACY_LABEL=dev.ruchern.usage-ingest
HOME_DIR=${HOME:?}
UID_NUM=$(id -u)
DOMAIN="gui/${UID_NUM}"

# Also removes an install from before the rename to agent-usage.
for label in "$LABEL" "$LEGACY_LABEL"; do
  plist="$HOME_DIR/Library/LaunchAgents/${label}.plist"
  if launchctl print "$DOMAIN/$label" >/dev/null 2>&1; then
    launchctl bootout "$DOMAIN" "$plist" || launchctl bootout "$DOMAIN/$label" || true
  fi
  rm -f "$plist"
done
rm -f "$HOME_DIR/.local/bin/agent-usage" "$HOME_DIR/.local/bin/agent-usage-run" \
  "$HOME_DIR/.local/bin/usage-ingest" "$HOME_DIR/.local/bin/usage-ingest-run"

echo "Removed $LABEL (Keychain tokens left — run: agent-usage auth logout)"
