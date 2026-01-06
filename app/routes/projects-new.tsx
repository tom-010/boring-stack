/*+++
intent = "Create a new project"
+++*/
import type { Route } from "./+types/projects-new";
import type { RouteHandle } from "~/components/page-header";
import { Form, redirect, Link } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { parseFormDataOrThrow } from "~/lib/forms";
import { createProjectSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: { label: "New Project", href: "/projects/new" },
};

export async function loader({ request }: Route.LoaderArgs) {
  await auth.api.getSession({ headers: request.headers });
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const { name, description } = parseFormDataOrThrow(
    formData,
    createProjectSchema
  );
  const color = (formData.get("color") as string) || "blue";

  const project = await db.project.create({
    data: { name, color, description, ownerId: userId },
  });
  log.info({ projectId: project.id, name }, "project_created");

  return redirect(`/projects/${project.id}`);
}

export function meta() {
  return [
    { title: "New Project" },
    { name: "description", content: "Create a new project" },
  ];
}

export default function NewProjectPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter project name..."
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="What is this project about?"
                />
              </div>

              <input type="hidden" name="color" value="blue" />

              <div className="flex gap-2 pt-4">
                <Button type="submit">Create Project</Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/projects">Cancel</Link>
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
