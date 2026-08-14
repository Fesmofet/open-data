#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install Node.js 20+ and enable corepack: corepack enable"
  exit 1
fi

pnpm install --prod --frozen-lockfile --ignore-workspace
echo "agent-wallet production dependencies installed."
