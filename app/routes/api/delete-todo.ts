import { redirect } from "react-router";
import { db } from "~/db/client";
import { todos } from "~/db/schema";
import { eq } from "drizzle-orm";
import { del } from "~/lib/form-validation";
import { DeleteTodoSchema } from "~/lib/schemas";

export const action = del(DeleteTodoSchema, async (data, request) => {
  const { id } = data;
  const formData = await request.formData();
  const projectId = formData.get("projectId");

  await db.delete(todos).where(eq(todos.id, id));

  return redirect(`/projects/${projectId}`);
});
