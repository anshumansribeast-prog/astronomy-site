#!/usr/bin/env bash
set -euo pipefail

# Idempotent bootstrap for astronomy-site. No npm dependencies to install;
# the server uses only Node built-ins (node:sqlite, node:crypto, etc.).
mkdir -p data
