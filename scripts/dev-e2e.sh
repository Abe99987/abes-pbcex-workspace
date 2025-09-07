#!/bin/bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

export NODE_ENV=development
export E2E_TEST_ENABLED=${E2E_TEST_ENABLED:-true}

cd "$ROOT_DIR"

if ! command -v concurrently >/dev/null 2>&1; then
  npm install --no-audit --no-fund --no-progress --save-dev concurrently >/dev/null 2>&1 || true
fi

echo "Starting backend (4001) and frontend (3000) for E2E..."

npx concurrently \
  --kill-others-on-fail \
  --names "backend,frontend" \
  --prefix "[{name}]" \
  --prefix-colors "cyan,magenta" \
  "cd backend && npm ci --prefer-offline --no-audit --no-fund && npm run dev" \
  "cd frontend && npm ci --prefer-offline --no-audit --no-fund && npm run dev"


