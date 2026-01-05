import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { v7 as uuidv7 } from "uuid";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Models that need UUIDv7 auto-generation
const UUID_MODELS = ["Project", "Todo", "Attachment", "TodoAssignment"];

export const db = new PrismaClient({ adapter }).$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        if (UUID_MODELS.includes(model) && args.data.id === undefined) {
          args.data.id = uuidv7();
        }
        return query(args);
      },
      async createMany({ model, args, query }) {
        if (UUID_MODELS.includes(model) && Array.isArray(args.data)) {
          args.data.forEach((row: Record<string, unknown>) => {
            if (row.id === undefined) row.id = uuidv7();
          });
        }
        return query(args);
      },
    },
  },
});

// Re-export types for use in components
export type Todo = Prisma.TodoGetPayload<object>;
export type Project = Prisma.ProjectGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
