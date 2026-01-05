#!/bin/bash

# Resolve project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXIT_CODE=0

cd "$PROJECT_ROOT"

echo "Seeding database..."
npx tsx prisma/seed.ts || exit 1

echo "Running unit tests..."
npm run test || EXIT_CODE=1

echo "Running e2e tests..."
npx tsx prisma/seed.ts && npx playwright test --reporter=list || EXIT_CODE=1

exit $EXIT_CODE
