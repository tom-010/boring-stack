import type { Config } from 'drizzle-kit';

export default {
  schema: './app/db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_PATH || './db/app.db',
  },
} satisfies Config;
