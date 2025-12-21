import { redirect } from "react-router";
import { db } from "~/db/client";
import { del } from "~/lib/form-validation";
import { DeleteProjectSchema } from "~/lib/schemas";

export const action = del(DeleteProjectSchema, async (data) => {
  const { id } = data;

  await db.project.delete({
    where: { id },
  });

  return redirect("/");
});
