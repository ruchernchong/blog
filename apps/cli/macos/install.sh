#!/bin/bash
# Install agent-usage and its LaunchAgent on macOS.
#
#   curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install.sh | bash
#
# Piped from curl, it downloads the latest release package, verifies its
# SHA-256, and runs the install.sh inside it. Run from the release package it
# installs the prebuilt binary; run from a checkout it builds from source.
#
# AGENT_USAGE_VERSION=X.Y.Z pins a release instead of the latest (the legacy
# USAGE_INGEST_VERSION is read when it is unset).
#
# Runs under bash or zsh: agent-usage 1.51.0 runs the package's copy with zsh.
set -euo pipefail

REPO=ruchernchong/blog
ASSET=agent-usage-macos.tar.gz
# Releases cut before the rename (v1.50.0 and earlier) only carry the
# usage-ingest package.
LEGACY_ASSET=usage-ingest-macos.tar.gz
VERSION=${AGENT_USAGE_VERSION:-${USAGE_INGEST_VERSION:-}}
LABEL=dev.ruchern.agent-usage
LEGACY_LABEL=dev.ruchern.usage-ingest
TMP_DIR=
# Read here, not inside a function: zsh sets $0 to the function name there.
SCRIPT=${BASH_SOURCE[0]:-$0}

fetch() {
  curl --proto '=https' --tlsv1.2 -fsSL "$@"
}

# The directory holding bin/ (release package) or Cargo.toml (checkout), or
# nothing when the script was piped in and has no files beside it.
local_root() {
  [[ -f $SCRIPT && -f $(dirname "$SCRIPT")/$LABEL.plist ]] || return 0
  local root
  root=$(cd "$(dirname "$SCRIPT")/.." && pwd)
  if [[ -x $root/bin/agent-usage || -f $root/Cargo.toml ]]; then
    echo "$root"
  fi
}

download_and_install() {
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
  # A legacy package installs usage-ingest, which the next upgrade migrates.
  if [[ $dir == usage-ingest ]]; then
    zsh "$TMP_DIR/$dir/macos/install.sh"
  else
    bash "$TMP_DIR/$dir/macos/install.sh"
  fi
}

install_from() {
  local root=$1
  local home_dir=${HOME:?}
  local bin_dir="$home_dir/.local/bin"
  local launch_agents="$home_dir/Library/LaunchAgents"
  local logs="$home_dir/Library/Logs"
  local bin="$bin_dir/agent-usage"
  local wrapper="$bin_dir/agent-usage-run"
  local plist="$launch_agents/${LABEL}.plist"
  local legacy_plist="$launch_agents/${LEGACY_LABEL}.plist"
  local domain
  domain="gui/$(id -u)"

  mkdir -p "$bin_dir" "$launch_agents" "$logs"

  # -S swaps the binary in through a temp file, so a running agent-usage (e.g.
  # `agent-usage update`) never sees it half-written.
  if [[ -x $root/bin/agent-usage ]]; then
    echo "Installing prebuilt $bin"
    install -S -m 755 "$root/bin/agent-usage" "$bin"
  else
    echo "Building $bin"
    cargo build --release --manifest-path "$root/Cargo.toml"
    install -S -m 755 "$root/target/release/agent-usage" "$bin"
  fi

  # Remove an install from before the rename to agent-usage, once the new
  # binary is in place, so the two agents never both run. Its Keychain tokens
  # and client id move over on the first run of the new binary.
  if [[ -e $legacy_plist ]] || launchctl print "$domain/$LEGACY_LABEL" >/dev/null 2>&1; then
    echo "Removing legacy $LEGACY_LABEL"
    launchctl bootout "$domain" "$legacy_plist" 2>/dev/null ||
      launchctl bootout "$domain/$LEGACY_LABEL" 2>/dev/null || true
  fi
  rm -f "$legacy_plist" "$bin_dir/usage-ingest" "$bin_dir/usage-ingest-run"

  install -m 755 "$root/macos/agent-usage-run.sh" "$wrapper"

  sed -e "s|__HOME__|$home_dir|g" -e "s|__WRAPPER__|$wrapper|g" \
    "$root/macos/dev.ruchern.agent-usage.plist" >"$plist"

  if launchctl print "$domain/$LABEL" >/dev/null 2>&1; then
    launchctl bootout "$domain" "$plist" || true
  fi
  launchctl bootstrap "$domain" "$plist"
  launchctl enable "$domain/$LABEL"

  echo
  echo "Installed $LABEL"
  echo "  binary  $bin"
  echo "  log     $logs/agent-usage.log"
  echo
  echo "1. Sign in (admin account):  $bin auth login"
  echo "2. Prove one run:            $wrapper"
  echo "3. Then:  launchctl kickstart -k $domain/$LABEL"
  echo "4. Turn off AgentUsage → Settings → Blog Usage Sync"
}

main() {
  if [[ "$(uname -s)" != Darwin ]]; then
    echo "agent-usage: macOS only" >&2
    exit 1
  fi

  local root
  root=$(local_root)
  if [[ -n $root ]]; then
    install_from "$root"
  else
    download_and_install
  fi
}

# Called last so a partial download never runs half a script.
main "$@"
