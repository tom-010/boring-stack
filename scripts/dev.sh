#!/bin/bash
# Development server script - runs all services concurrently
# Logs are written to dev.log with ANSI colors stripped

set -e

rm -f dev.log > /dev/null || true

FORCE_COLOR=1 concurrently \
  --kill-others \
  -n "VITE,WORKER,PY" \
  -c "bgBlue.bold,bgMagenta.bold,bgYellow.bold" \
  "npm run dev:vite -- --host 0.0.0.0" \
  "npm run dev:worker" \
  "npm run dev:py" \
  2>&1 | tee >(sed 's/\x1b\[[0-9;]*m//g' > dev.log)
