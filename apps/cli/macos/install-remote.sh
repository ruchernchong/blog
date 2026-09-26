#!/bin/bash
# Install the usage collector from the latest GitHub release of the monorepo,
# without a checkout or a Rust toolchain. ci.yml attaches this script to each
# release, so the latest one is always at:
#
#   curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install-remote.sh | bash
#
# AGENT_USAGE_VERSION=X.Y.Z pins a release instead of the latest (the legacy
# USAGE_INGEST_VERSION is read when it is unset).
set -euo pipefail

REPO=ruchernchong/blog
ASSET=agent-usage-macos.tar.gz
# Releases cut before the rename (v1.50.0 and earlier, and latest until the
# first agent-usage release) only carry the usage-ingest package.
LEGACY_ASSET=usage-ingest-macos.tar.gz
VERSION=${AGENT_USAGE_VERSION:-${USAGE_INGEST_VERSION:-}}
TMP_DIR=

fetch() {
  curl --proto '=https' --tlsv1.2 -fsSL "$@"
}

main() {
  if [[ "$(uname -s)" != Darwin ]]; then
    echo "agent-usage: macOS only" >&2
    exit 1
  fi

  local base="https://github.com/$REPO/releases/latest/download"
  if [[ -n "$VERSION" ]]; then
    base="https://github.com/$REPO/releases/download/v$VERSION"
  fi

  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT

  local asset=$ASSET dir=agent-usage
  echo "Downloading ${VERSION:-latest release}"
  if ! fetch -o "$TMP_DIR/$asset" "$base/$asset"; then
    echo "No $ASSET in this release, falling back to $LEGACY_ASSET"
    asset=$LEGACY_ASSET dir=usage-ingest
    fetch -o "$TMP_DIR/$asset" "$base/$asset"
  fi
  fetch -o "$TMP_DIR/$asset.sha256" "$base/$asset.sha256"
  (cd "$TMP_DIR" && shasum -a 256 -c "$asset.sha256")

  tar -xzf "$TMP_DIR/$asset" -C "$TMP_DIR"
  # The agent-usage install.sh also removes a legacy usage-ingest install; a
  # legacy package installs usage-ingest, which the next upgrade migrates.
  zsh "$TMP_DIR/$dir/macos/install.sh"
}

# Called last so a partial download never runs half a script.
main "$@"
