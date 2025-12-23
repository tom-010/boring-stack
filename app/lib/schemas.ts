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

export const deleteByStringIdSchema = z.object({
  id: z.string().min(1),
});

// ============================================================================
// User Schemas
// ============================================================================

import { ROLES } from "~/lib/roles";

const rolesEnum = z.enum(ROLES);

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roles: z.array(rolesEnum).min(1, "At least one role required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  roles: z.array(rolesEnum).min(1, "At least one role required"),
});

// ============================================================================
// Assignment Schemas
// ============================================================================

export const assignUserSchema = z.object({
  userId: z.string().min(1, "User is required"),
});

export const unassignUserSchema = z.object({
  assignmentId: z.coerce.number(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type Priority = z.infer<typeof priorityEnum>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
