#!/bin/zsh
set -euo pipefail

BIN="${AGENT_USAGE_BIN:-${USAGE_INGEST_BIN:-$HOME/.local/bin/agent-usage}}"

print "=== $(date '+%Y-%m-%d %H:%M:%S %z') start"

if [[ ! -x $BIN ]]; then
  print -u2 "agent-usage: missing binary $BIN"
  print "=== $(date '+%Y-%m-%d %H:%M:%S %z') end exit=1 duration=0s"
  exit 1
fi

started=$SECONDS
code=0
"$BIN" ingest || code=$?
print "=== $(date '+%Y-%m-%d %H:%M:%S %z') end exit=$code duration=$((SECONDS - started))s"
exit $code
