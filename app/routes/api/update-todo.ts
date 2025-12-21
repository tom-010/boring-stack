import { redirect } from "react-router";
import { db } from "~/db/client";
import { put } from "~/lib/form-validation";
import { UpdateTodoSchema } from "~/lib/schemas";

export const action = put(UpdateTodoSchema, async (data) => {
  const { id, projectId, title, description, completed, priority, dueDate } = data;

  await db.todo.update({
    where: { id },
    data: {
      title,
      description,
      completed,
      priority,
      dueDate,
    },
  });

  return redirect(`/projects/${projectId}`);
});
