#!/bin/bash
# Production build script - run on server after git pull
set -e

cd "$(dirname "$0")/.."

echo "Pulling latest code..."
git pull

# Check if Dockerfile changed
HASH_FILE=".dockerfile_hash"
CURRENT_HASH=$(md5sum Dockerfile | cut -d' ' -f1)

if [ -f "$HASH_FILE" ] && [ "$(cat $HASH_FILE)" = "$CURRENT_HASH" ]; then
  echo "Dockerfile unchanged, skipping image rebuild."
else
  echo "Dockerfile changed, rebuilding image..."
  docker compose -f docker-compose.prod.yml build
  echo "$CURRENT_HASH" > "$HASH_FILE"
fi

echo "Building React app..."
docker compose -f docker-compose.prod.yml run --rm build

echo "Starting postgres..."
docker compose -f docker-compose.prod.yml up -d postgres

echo "Running migrations..."
docker compose -f docker-compose.prod.yml run --rm migrate

echo "Starting app..."
docker compose -f docker-compose.prod.yml up -d --force-recreate app

echo "Done."
