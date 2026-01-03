/**
 * Python SDK - Type-safe RPC to Python backend.
 * See docs/python-bridge.md
 */

import { client } from "./gen/client.gen"

export * from "./gen/sdk.gen"
export type * from "./gen/types.gen"

// Configure Python service URL (same container in prod)
const PY_URL = typeof window === "undefined"
  ? process.env.PY_URL ?? "http://localhost:8123"
  : "http://localhost:8123"

// Timeout for Python calls (15 minutes - Python can run long computations)
const PY_TIMEOUT_MS = 15 * 60 * 1000

client.setConfig({
  baseUrl: PY_URL,
  // Custom fetch with extended timeout for long-running Python operations
  fetch: (request) => {
    return fetch(request, {
      signal: AbortSignal.timeout(PY_TIMEOUT_MS),
    })
  },
})
