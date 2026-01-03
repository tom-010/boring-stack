import { db } from "../app/db/client";

const PY_URL = process.env.PY_URL ?? "http://localhost:8123";

async function main() {
  let hasError = false;

  // Check database
  try {
    await db.$queryRaw`SELECT 1`;
    console.log("✓ Database");
  } catch (e) {
    console.error("✗ Database:", e);
    hasError = true;
  }

  // Check Python service
  try {
    const res = await fetch(`${PY_URL}/hi`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      console.log("✓ Python");
    } else {
      console.error("✗ Python: HTTP", res.status);
      hasError = true;
    }
  } catch (e) {
    console.error("✗ Python:", e);
    hasError = true;
  }

  await db.$disconnect();
  process.exit(hasError ? 1 : 0);
}

main();
