#!/bin/bash
set -e

# Generates TypeScript SDK from Python FastAPI.
# See docs/python-bridge.md

cd py/app
uv run python3 -c "
import json
from app import app
print(json.dumps(app.openapi(), indent=2))
" > ../../openapi.json
cd ../..

npx @hey-api/openapi-ts \
  -i openapi.json \
  -o ./app/lib/py/gen \
  -c @hey-api/client-fetch

rm openapi.json
