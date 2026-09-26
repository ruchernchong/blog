#!/bin/bash
# Install agent-usage and its LaunchAgent on macOS.
#
#   curl -fsSL https://github.com/ruchernchong/blog/releases/latest/download/install.sh | bash
#
# Piped from curl, it downloads the latest release package, verifies its
# SHA-256, and runs the install.sh inside it. Run from the release package it
# installs the prebuilt binary; run from a checkout it builds from source.
#
# AGENT_USAGE_VERSION=X.Y.Z pins a release instead of the latest.
#
# Runs under bash or zsh: agent-usage 1.51.0 runs the package's copy with zsh.
set -euo pipefail

REPO=ruchernchong/blog
ASSET=agent-usage-macos.tar.gz
VERSION=${AGENT_USAGE_VERSION:-}
LABEL=dev.ruchern.agent-usage
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

  echo "Downloading ${VERSION:-latest release}"
  fetch -o "$TMP_DIR/$ASSET" "$base/$ASSET"
  fetch -o "$TMP_DIR/$ASSET.sha256" "$base/$ASSET.sha256"
  (cd "$TMP_DIR" && shasum -a 256 -c "$ASSET.sha256")

  tar -xzf "$TMP_DIR/$ASSET" -C "$TMP_DIR"
  bash "$TMP_DIR/agent-usage/macos/install.sh"
}

install_from() {
  local root=$1
  local home_dir=${HOME:?}
  local bin_dir="$home_dir/.local/bin"
  local launch_agents="$home_dir/Library/LaunchAgents"
  local logs="$home_dir/Library/Logs"
  local bin="$bin_dir/agent-usage"
  local plist="$launch_agents/${LABEL}.plist"
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

  sed -e "s|__HOME__|$home_dir|g" -e "s|__BIN__|$bin|g" \
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
  echo "2. Prove one run:            $bin run"
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
