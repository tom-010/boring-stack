import { z } from "zod";

// Projects
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  color: z.enum(["blue", "red", "green", "purple", "yellow"]).default("blue"),
  description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const DeleteProjectSchema = z.object({
  id: z.coerce.number(),
});

export type DeleteProjectInput = z.infer<typeof DeleteProjectSchema>;

// Todos
export const CreateTodoSchema = z.object({
  projectId: z.coerce.number(),
  title: z.string().min(1, "Todo title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;

export const UpdateTodoSchema = z.object({
  id: z.coerce.number(),
  title: z.string().min(1, "Todo title is required").optional(),
  description: z.string().optional(),
  completed: z.coerce.boolean().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional(),
});

export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

export const DeleteTodoSchema = z.object({
  id: z.coerce.number(),
});

export type DeleteTodoInput = z.infer<typeof DeleteTodoSchema>;
