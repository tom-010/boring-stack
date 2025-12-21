import { z } from "zod";

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  color: z.string().default("blue"),
  description: z.string().optional(),
});

export const UpdateProjectSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

export const DeleteProjectSchema = z.object({
  id: z.coerce.number(),
});

export const CreateTodoSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(1, "Todo title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

export const UpdateTodoSchema = z.object({
  id: z.coerce.number(),
  projectId: z.coerce.number(),
  title: z.string().optional(),
  description: z.string().optional(),
  completed: z.string().transform(val => val === "true").optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
});

export const DeleteTodoSchema = z.object({
  id: z.coerce.number(),
  projectId: z.coerce.number(),
});
