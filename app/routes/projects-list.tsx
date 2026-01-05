import type { Route } from "./+types/projects-list";
import type { RouteHandle } from "~/components/page-header";
import { Form, redirect, useSearchParams } from "react-router";
import { Plus, Folder, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ProjectsTable } from "~/components/projects-table";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { getIntent, parseFormDataOrThrow } from "~/lib/forms";
import { createProjectSchema, deleteByIdSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: { label: "Projects", href: "/projects" },
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  // Build search condition
  const searchCondition = query
    ? {
        OR: [
          { name: { search: query.split(/\s+/).join(" & ") } },
          { description: { search: query.split(/\s+/).join(" & ") } },
        ],
      }
    : {};

  // Get projects I own OR where I'm assigned to a todo
  const projects = await db.project.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
            {
              todos: {
                some: {
                  assignments: {
                    some: { userId },
                  },
                },
              },
            },
          ],
        },
        searchCondition,
      ],
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { projects, currentUserId: userId };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const intent = getIntent(formData);

  switch (intent) {
    case "deleteProject": {
      const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);
      // Only allow deleting own projects
      await db.project.delete({ where: { id, ownerId: userId } });
      log.info({ projectId: id }, "project_deleted");
      return redirect("/projects");
    }

    default: {
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
  }
}

export function meta() {
  return [
    { title: "Projects" },
    { name: "description", content: "Manage your projects" },
  ];
}

export default function ProjectsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Organize your todos into projects</p>
        </div>

        <Form method="post" className="mb-6">
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

        <Form method="get" className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search projects..."
              defaultValue={query}
              className="pl-10"
            />
          </div>
        </Form>

        {loaderData.projects.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {query ? "No projects match your search." : "No projects yet. Create one to get started!"}
            </p>
          </div>
        ) : (
          <ProjectsTable
            projects={loaderData.projects}
            currentUserId={loaderData.currentUserId}
          />
        )}
      </div>
    </div>
  );
}
