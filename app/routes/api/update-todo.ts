import { redirect } from "react-router";
import { db } from "~/db/client";
import { todos } from "~/db/schema";
import { eq } from "drizzle-orm";
import { put } from "~/lib/form-validation";
import { UpdateTodoSchema } from "~/lib/schemas";

export const action = put(UpdateTodoSchema, async (data, request) => {
  const { id, title, description, completed, priority, dueDate } = data;
  const formData = await request.formData();
  const projectId = formData.get("projectId");

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (completed !== undefined) updates.completed = completed;
  if (priority !== undefined) updates.priority = priority;
  if (dueDate !== undefined) updates.dueDate = dueDate;

  await db.update(todos).set(updates).where(eq(todos.id, id));

  return redirect(`/projects/${projectId}`);
});
