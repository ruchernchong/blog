#!/bin/zsh
set -euo pipefail

BIN="${USAGE_INGEST_BIN:-$HOME/.local/bin/usage-ingest}"

if [[ ! -x $BIN ]]; then
  print -u2 "usage-ingest: missing binary $BIN"
  exit 1
fi

exec "$BIN" ingest
