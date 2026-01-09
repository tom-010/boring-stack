#!/bin/bash
# Production server script
# React is pre-built outside the container, we just serve the artifacts

set -e

echo "Installing Python dependencies..."
cd py/
uv sync
cd ..

echo "Starting services..."
FORCE_COLOR=1 concurrently \
  --kill-others \
  -n "APP,WORKER,PY" \
  -c "bgBlue.bold,bgMagenta.bold,bgYellow.bold" \
  "npm run start" \
  "npm run dev:worker" \
  "npm run dev:py"
