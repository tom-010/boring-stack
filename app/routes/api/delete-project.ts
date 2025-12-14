import { redirect } from "react-router";
import { db } from "~/db/client";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import { del } from "~/lib/form-validation";
import { DeleteProjectSchema } from "~/lib/schemas";

export const action = del(DeleteProjectSchema, async (data) => {
  const { id } = data;

  await db.delete(projects).where(eq(projects.id, id));

  return redirect("/");
});
