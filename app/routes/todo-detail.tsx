import type { Route } from "./+types/todo-detail";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Link } from "react-router";
import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { db } from "~/db/client";

export const handle: RouteHandle = {
  breadcrumb: (data): BreadcrumbItem[] => {
    const { todo, project } = data as {
      todo: { title: string };
      project: { id: number; name: string };
    };
    return [
      { label: "Projects", href: "/" },
      { label: project.name, href: `/projects/${project.id}` },
      { label: todo.title },
    ];
  },
};

export async function loader({ params }: Route.LoaderArgs) {
  const todoId = parseInt(params.id!);

  const todo = await db.todo.findUnique({
    where: { id: todoId },
  });

  if (!todo) {
    throw new Response("Not Found", { status: 404 });
  }

  const project = await db.project.findUnique({
    where: { id: todo.projectId },
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }

  return { todo, project };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: loaderData?.todo.title ?? "Todo" },
    { name: "description", content: "View todo details" },
  ];
}

export default function TodoDetailPage({ loaderData }: Route.ComponentProps) {
  const { todo, project } = loaderData;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{todo.title}</h1>
            {todo.description && (
              <p className="text-muted-foreground">{todo.description}</p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/todos/${todo.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Status</span>
            <span>{todo.completed ? "Completed" : "Pending"}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Priority</span>
            <span className="capitalize">{todo.priority}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Project</span>
            <span>{project.name}</span>
          </div>
          {todo.dueDate && (
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Due Date</span>
              <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Created</span>
            <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
