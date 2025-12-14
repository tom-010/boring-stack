import { redirect } from "react-router";
import { db } from "~/db/client";
import { todos } from "~/db/schema";
import { post } from "~/lib/form-validation";
import { CreateTodoSchema } from "~/lib/schemas";

export const action = post(CreateTodoSchema, async (data) => {

  const { projectId, title, description, priority, dueDate } = data;

  await db.insert(todos).values({
    projectId,
    title,
    description,
    priority,
    dueDate,
    completed: false,
  });

  return redirect(`/projects/${projectId}`);
});
