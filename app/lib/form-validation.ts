import { z } from "zod";

/**
 * Parses and validates form data against a Zod schema
 */
export async function parseFormData<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> }
> {
  try {
    const formData = await request.formData();
    const parsed = schema.parse(Object.fromEntries(formData));
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    throw error;
  }
}

/**
 * Creates a validated action handler for a specific HTTP method
 */
function createValidatedAction<T extends z.ZodType>(
  method: string,
  schema: T,
  handler: (data: z.infer<T>, request: Request) => Promise<Response>,
) {
  return async ({ request }: { request: Request }): Promise<Response> => {
    if (request.method !== method) {
      return new Response(null, { status: 405 });
    }

    const validation = await parseFormData(request, schema);

    if (!validation.success) {
      return new Response(JSON.stringify({ errors: validation.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      return await handler(validation.data, request);
    } catch (error) {
      console.error("Action error:", error);
      return new Response(JSON.stringify({ error: "Operation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

/**
 * Handle validated POST requests
 */
export function post<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: Request) => Promise<Response>,
) {
  return createValidatedAction("POST", schema, handler);
}

/**
 * Handle validated PUT requests
 */
export function put<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: Request) => Promise<Response>,
) {
  return createValidatedAction("PUT", schema, handler);
}

/**
 * Handle validated DELETE requests
 */
export function del<T extends z.ZodType>(
  schema: T,
  handler: (data: z.infer<T>, request: Request) => Promise<Response>,
) {
  return createValidatedAction("DELETE", schema, handler);
}
