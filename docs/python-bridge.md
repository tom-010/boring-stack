# Python-TypeScript Bridge

Type-safe RPC between TypeScript and Python.

## What This Is

**Not a REST API.** This is an inter-language RPC bridge — TypeScript calling Python functions with full type safety.

**Server-side only.** Never call Python from the browser. The Python service is internal (localhost:8001), only accessible from loaders/actions.

Think of it as:
- FFI (Foreign Function Interface) for TypeScript → Python
- Co-located services that happen to speak HTTP

The endpoints are verbs (`/greet`, `/resize`), not resources.

## Why

Python excels at ML, image processing, data science. Rather than rewrite Python libraries in TypeScript, we run a FastAPI service and call it with types.

The Python service:
- Lives in `py/`
- Same container in production (100% coupled to this app)
- FastAPI generates OpenAPI schema → TypeScript codegen

## File Locations

| Path | Purpose |
|------|---------|
| `py/` | Python source (FastAPI) |
| `app/lib/py/client.ts` | Entry point (import from here) |
| `app/lib/py/gen/` | Generated SDK (overwritten by sync) |
| `scripts/sync-py.sh` | Regenerates SDK |

Generated SDK is committed to git (build works without Python, diffs visible in PRs).

## Usage

```typescript
import { greetPersonGreetPost } from "~/lib/py/client"

const result = await greetPersonGreetPost({
  body: { first_name: "John", last_name: "Doe" }
})
```

## Workflow

1. **Define in Python** (`py/main.py`):
   ```python
   class MyInputSchema(BaseModel):
       some_value: int

   @app.post("/my-endpoint")
   async def my_endpoint(data: MyInputSchema):
       return {"result": data.some_value * 2}
   ```

2. **Regenerate SDK**:
   ```bash
   ./scripts/sync-py.sh
   ```

3. **Use in TypeScript**:
   ```typescript
   import { myEndpointMyEndpointPost } from "~/lib/py/client"
   ```

## Running

```bash
cd py && uv run python main.py  # Port 8001
```

## Why OpenAPI?

OpenAPI is just the transport format:
- FastAPI generates it from Pydantic models
- Excellent TypeScript codegen exists
- NOT because we're building a REST API
