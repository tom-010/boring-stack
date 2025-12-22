import type { Route } from "./+types/projects-list";
import type { RouteHandle } from "~/components/page-header";
import { Form, redirect } from "react-router";
import { Plus, Folder } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProjectsTable } from "~/components/projects-table";
import { db } from "~/db/client";
import { getIntent, parseFormDataOrThrow } from "~/lib/forms";
import { createProjectSchema, deleteByIdSchema } from "~/lib/schemas";

export const handle: RouteHandle = {
  breadcrumb: { label: "Projects", href: "/" },
};

export async function loader() {
  const projects = await db.project.findMany();
  return { projects };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = getIntent(formData);

  switch (intent) {
    case "deleteProject": {
      const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);
      await db.project.delete({ where: { id } });
      return redirect("/");
    }

    default: {
      const { name, description } = parseFormDataOrThrow(
        formData,
        createProjectSchema
      );
      const color = (formData.get("color") as string) || "blue";

      const project = await db.project.create({
        data: { name, color, description },
      });

      return redirect(`/projects/${project.id}`);
    }
  }
}

export function meta() {
  return [
    { title: "Projects" },
    { name: "description", content: "Manage your projects" },
  ];
}

export default function ProjectsPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Organize your todos into projects</p>
        </div>

        <Form method="post" className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Create a new project..."
              className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input type="hidden" name="color" value="blue" />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </Form>

        {loaderData.projects.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <ProjectsTable projects={loaderData.projects} />
        )}
      </div>
    </div>
  );
}
