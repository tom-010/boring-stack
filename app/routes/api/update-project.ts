import { redirect } from "react-router";
import { db } from "~/db/client";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import { put } from "~/lib/form-validation";
import { UpdateProjectSchema } from "~/lib/schemas";

export const action = put(UpdateProjectSchema, async (data) => {
  const { id, name, description } = data;
  await db.update(projects).set({ name, description }).where(eq(projects.id, id));
  return redirect(`/projects/${id}`);
});
