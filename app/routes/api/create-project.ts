import { redirect } from "react-router";
import { db } from "~/db/client";
import { projects } from "~/db/schema";
import { post } from "~/lib/form-validation";
import { CreateProjectSchema } from "~/lib/schemas";

export const action = post(CreateProjectSchema, async (data) => {
  const { name, color, description } = data;

  await db.insert(projects).values({
    name,
    color,
    description,
  });

  return redirect("/");
});
