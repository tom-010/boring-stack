#!/bin/bash
# Development server script
# Runs vite, worker, and python service concurrently
# Logs are written to dev.log with ANSI colors stripped

set -e

# Clean up any running Docker containers and start fresh
docker stop $(docker ps -q) 2>/dev/null || true
docker compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; do
  sleep 0.2
done

rm -f dev.log > /dev/null || true

FORCE_COLOR=1 concurrently \
  --kill-others \
  -n "VITE,WORKER,PY" \
  -c "bgBlue.bold,bgMagenta.bold,bgYellow.bold" \
  "npm run dev:vite" \
  "npm run dev:worker" \
  "npm run dev:py" \
  2>&1 | tee >(sed 's/\x1b\[[0-9;]*m//g' > dev.log)
