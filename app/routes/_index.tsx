import type { Route } from "./+types/_index";
import { useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { Form } from "react-router";
import { Plus, Folder } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProjectsTable } from "~/components/projects-table";
import type { Project } from "~/db/schema";
import { db } from "~/db/client";
import { CreateProjectSchema } from "~/lib/schemas";
import { routes } from "~/lib/routes";

export async function loader({ request }: Route.LoaderArgs) {
  const allProjects = await db.query.projects.findMany();
  return { allProjects };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Projects" },
    { name: "description", content: "Manage your projects" },
  ];
}

export default function ProjectsPage({ loaderData }: Route.ComponentProps) {
  const colors = ["blue", "red", "green", "purple", "yellow"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  const [form, fields] = useForm({
    constraint: getZodConstraint(CreateProjectSchema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: CreateProjectSchema });
    },
    shouldValidate: "onBlur",
  });

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Projects</h1>
          <p className="text-gray-600">Organize your todos into projects</p>
        </div>

        <Form method="post" action={routes.createProject.path} className="mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                key={fields.name.key}
                name={fields.name.name}
                placeholder="Create a new project..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input type="hidden" name="color" value={randomColor} />
              <Button type="submit" className="px-6">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
            {fields.name.errors && (
              <p className="text-red-500 text-sm">{fields.name.errors[0]}</p>
            )}
          </div>
        </Form>

        {loaderData.allProjects.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <ProjectsTable projects={loaderData.allProjects} />
        )}
      </div>
    </div>
  );
}
