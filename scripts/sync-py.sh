#!/bin/bash
set -e

# Generates TypeScript SDK from Python FastAPI.
# See docs/python-bridge.md

echo "Extracting OpenAPI schema..."
cd py/
uv run python3 -c "
import json
from main import app
print(json.dumps(app.openapi(), indent=2))
" > ../openapi.json
cd ..

echo "Generating TypeScript SDK..."
npx @hey-api/openapi-ts \
  -i openapi.json \
  -o ./app/lib/py/gen \
  -c @hey-api/client-fetch

rm openapi.json

echo "Done! SDK at ./app/lib/py/gen"
