import pg from "pg";

const maxAttempts = 30;
const delay = 500;

async function waitForDb() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  return

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await client.connect();
      await client.end();
      console.log("Database ready");
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Database not ready after " + maxAttempts + " attempts");
}

waitForDb();
