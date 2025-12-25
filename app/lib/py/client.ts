/**
 * Python SDK - Type-safe RPC to Python backend.
 * See docs/python-bridge.md
 */

import { client } from "./gen/client.gen"

export * from "./gen/sdk.gen"
export type * from "./gen/types.gen"

// Configure Python service URL (same container in prod)
const PY_URL = typeof window === "undefined"
  ? process.env.PY_URL ?? "http://localhost:8001"
  : "http://localhost:8001"

client.setConfig({ baseUrl: PY_URL })
