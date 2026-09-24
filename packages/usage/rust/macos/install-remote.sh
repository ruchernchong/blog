#!/bin/bash
# Install the usage collector from the latest GitHub release of the monorepo,
# without a checkout or a Rust toolchain:
#
#   curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/packages/usage/rust/macos/install-remote.sh | bash
#
# USAGE_INGEST_VERSION=1.42.0 pins a release instead of the latest.
set -euo pipefail

REPO=ruchernchong/blog
ASSET=usage-ingest-macos.tar.gz
TMP_DIR=

fetch() {
  curl --proto '=https' --tlsv1.2 -fsSL "$@"
}

main() {
  if [ "$(uname -s)" != Darwin ]; then
    echo "usage-ingest: macOS only" >&2
    exit 1
  fi

  local base="https://github.com/$REPO/releases/latest/download"
  if [ -n "${USAGE_INGEST_VERSION:-}" ]; then
    base="https://github.com/$REPO/releases/download/v$USAGE_INGEST_VERSION"
  fi

  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT

  echo "Downloading ${USAGE_INGEST_VERSION:-latest release}"
  fetch -o "$TMP_DIR/$ASSET" "$base/$ASSET"
  fetch -o "$TMP_DIR/$ASSET.sha256" "$base/$ASSET.sha256"
  (cd "$TMP_DIR" && shasum -a 256 -c "$ASSET.sha256")

  tar -xzf "$TMP_DIR/$ASSET" -C "$TMP_DIR"
  zsh "$TMP_DIR/usage-ingest/macos/install.sh"
}

# Called last so a partial download never runs half a script.
main "$@"
