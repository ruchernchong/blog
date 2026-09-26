#!/bin/bash
# The collector moved to apps/cli. Installs from v1.50.0 and earlier still
# print this URL in their update notice, so forward to the new installer.
# Delete once no v1.50.0 installs remain.
set -euo pipefail
curl --proto '=https' --tlsv1.2 -fsSL https://raw.githubusercontent.com/ruchernchong/blog/main/apps/cli/macos/install-remote.sh | bash
