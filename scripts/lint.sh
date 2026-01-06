#!/bin/bash

# Resolve project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXIT_CODE=0

cd "$PROJECT_ROOT"
npx tsx scripts/sync-route-intents.ts
npx tsx scripts/check-route-filenames.ts || EXIT_CODE=1
npm run typecheck || EXIT_CODE=1
npx eslint --fix "app/**/*.{ts,tsx}" "scripts/**/*.ts" || EXIT_CODE=1

echo "Running Ruff..."
(
    cd "py"
    uv run ruff check --fix . || exit 1
    uv run ruff format . || exit 1
) || EXIT_CODE=1

npm run build || EXIT_CODE=1

exit $EXIT_CODE

