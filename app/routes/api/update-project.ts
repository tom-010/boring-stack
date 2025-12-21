import { redirect } from "react-router";
import { db } from "~/db/client";
import { put } from "~/lib/form-validation";
import { UpdateProjectSchema } from "~/lib/schemas";

export const action = put(UpdateProjectSchema, async (data) => {
  const { id, name, description } = data;
  await db.project.update({
    where: { id },
    data: { name, description },
  });
  return redirect(`/projects/${id}`);
});
