#!/bin/bash
# Authenticated curl wrapper - handles session automatically
# Usage: ./scripts/curl-auth.sh [curl args...]
# Example: ./scripts/curl-auth.sh http://localhost:5173/projects
# Example: ./scripts/curl-auth.sh -X POST http://localhost:5173/projects -d "name=My Project"

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_NAME="$(basename "$(dirname "$SCRIPT_DIR")")"
COOKIE_FILE="/tmp/${PROJECT_NAME}.cookie"

# Login if no cookie file or older than 1 hour
if [ ! -f "$COOKIE_FILE" ] || [ "$(find "$COOKIE_FILE" -mmin +60 2>/dev/null)" ]; then
  "$SCRIPT_DIR/get-cookie.py" > "$COOKIE_FILE"
fi

COOKIE=$(cat "$COOKIE_FILE")
curl -b "$COOKIE" "$@"
