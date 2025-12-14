import { z } from "zod";
import type {
  CreateProjectInput,
  DeleteProjectInput,
  CreateTodoInput,
  UpdateTodoInput,
  DeleteTodoInput,
} from "./schemas";

/**
 * Typed action route definition
 */
export interface ActionRoute<T extends z.ZodType = z.ZodType> {
  path: string;
  method: "POST" | "PUT" | "DELETE";
  schema: T;
}

/**
 * Create a typed action route
 */
function createActionRoute<T extends z.ZodType>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  schema: T
): ActionRoute<T> {
  return { path, method, schema };
}

/**
 * Typesafe route constants
 */
export const routes = {
  // Pages
  home: "/",
  projectDetail: (id: string | number) => `/projects/${id}`,

  // API Routes with type safety
  createProject: createActionRoute("/api/create-project", "POST", null as any),
  deleteProject: createActionRoute("/api/delete-project", "DELETE", null as any),
  createTodo: createActionRoute("/api/create-todo", "POST", null as any),
  updateTodo: createActionRoute("/api/update-todo", "PUT", null as any),
  deleteTodo: createActionRoute("/api/delete-todo", "DELETE", null as any),
} as const;

/**
 * Get the path from a route (works for both page routes and action routes)
 */
export function getRoutePath(
  route: string | number | ActionRoute
): string {
  if (typeof route === "string" || typeof route === "number") {
    return String(route);
  }
  return route.path;
}

/**
 * Get the method from an action route
 */
export function getRouteMethod(route: ActionRoute): string {
  return route.method;
}
