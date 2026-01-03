#!/bin/bash
cd "$(dirname "$0")"

# Kill any existing process on port 8123
fuser -k 8123/tcp 2>/dev/null

uv run python -m uvicorn main:app --reload --host 0.0.0.0 --port 8123
