import { z } from "zod";

// ============================================================================
// Project Schemas
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

// ============================================================================
// Todo Schemas
// ============================================================================

export const priorityEnum = z.enum(["low", "medium", "high"]);

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  priority: priorityEnum.default("medium"),
});

export const updateTodoSchema = z.object({
  id: z.coerce.number(),
  completed: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  priority: priorityEnum.optional(),
});

export const editTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  priority: priorityEnum,
  completed: z.string().optional().transform((v) => v === "on"),
  dueDate: z.string().optional(),
});

// Generic schema for delete operations (just needs an id)
export const deleteByIdSchema = z.object({
  id: z.coerce.number(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type Priority = z.infer<typeof priorityEnum>;
