import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const db = new PrismaClient({ adapter });

// Re-export types for use in components
export type Todo = Prisma.TodoGetPayload<object>;
export type Project = Prisma.ProjectGetPayload<object>;
export type User = Prisma.UserGetPayload<object>;
