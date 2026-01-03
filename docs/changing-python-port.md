# Changing the Python Service Port

The Python FastAPI service runs on port 8123 by default. To change it:

## Files to Update

| File | What to change |
|------|----------------|
| `package.json` | `--port XXXX` in the `dev:py` script |
| `app/lib/py/client.ts` | Default fallback URL (2 places) |
| `scripts/worker.ts` | Default fallback URL |
| `playwright.config.ts` | `webServer` health check URL |
| `py/start.sh` | Port in `fuser` and uvicorn commands |
| `py/main.py` | Port in `__main__` block |

## Using Environment Variable

Instead of hardcoding, you can set `PY_URL` in your `.env`:

```bash
PY_URL=http://localhost:9000
```

This overrides the default in `client.ts` and `worker.ts` without code changes.

## Quick Search

Find all port references:

```bash
grep -rn "8123" --include="*.ts" --include="*.py" --include="*.sh" --include="*.json" .
```
