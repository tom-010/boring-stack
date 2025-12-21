import type { z } from "zod";

/**
 * Result type for form parsing - either success with data or failure with errors
 */
export type FormResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

/**
 * Parses FormData against a Zod schema with proper error handling.
 * Use in actions for type-safe form validation.
 *
 * @example
 * // In an action:
 * const result = parseFormData(formData, createTodoSchema);
 * if (!result.success) {
 *   return { errors: result.errors };
 * }
 * const { title, priority } = result.data;
 */
export function parseFormData<T extends z.ZodType>(
  formData: FormData,
  schema: T
): FormResult<z.infer<T>> {
  const rawData = Object.fromEntries(formData);
  const result = schema.safeParse(rawData);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(issue.message);
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Parses FormData and throws a Response with 400 status if validation fails.
 * Use when you want to short-circuit on validation errors.
 *
 * @example
 * // In an action:
 * const { title, priority } = parseFormDataOrThrow(formData, createTodoSchema);
 */
export function parseFormDataOrThrow<T extends z.ZodType>(
  formData: FormData,
  schema: T
): z.infer<T> {
  const result = parseFormData(formData, schema);

  if (!result.success) {
    throw new Response(JSON.stringify({ errors: result.errors }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return result.data;
}

/**
 * Gets the intent from FormData - common pattern for multi-action forms.
 */
export function getIntent(formData: FormData): string | null {
  const intent = formData.get("intent");
  return typeof intent === "string" ? intent : null;
}
