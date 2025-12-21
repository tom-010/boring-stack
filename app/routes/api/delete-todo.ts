import { redirect } from "react-router";
import { db } from "~/db/client";
import { del } from "~/lib/form-validation";
import { DeleteTodoSchema } from "~/lib/schemas";

export const action = del(DeleteTodoSchema, async (data) => {
  const { id, projectId } = data;
  await db.todo.delete({
    where: { id },
  });
  return redirect(`/projects/${projectId}`);
});
