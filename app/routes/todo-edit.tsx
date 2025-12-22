import type { Route } from "./+types/todo-edit";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Form, redirect } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { db } from "~/db/client";
import { parseFormDataOrThrow } from "~/lib/forms";
import { editTodoSchema } from "~/lib/schemas";

export const handle: RouteHandle = {
  breadcrumb: (data): BreadcrumbItem[] => {
    const { todo, project } = data as {
      todo: { id: number; title: string };
      project: { id: number; name: string };
    };
    return [
      { label: "Projects", href: "/" },
      { label: project.name, href: `/projects/${project.id}` },
      { label: todo.title, href: `/todos/${todo.id}` },
      { label: "Edit" },
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

export async function action({ request, params }: Route.ActionArgs) {
  const todoId = parseInt(params.id!);
  const formData = await request.formData();

  const data = parseFormDataOrThrow(formData, editTodoSchema);

  await db.todo.update({
    where: { id: todoId },
    data: {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      completed: data.completed,
      dueDate: data.dueDate || null,
    },
  });

  return redirect(`/todos/${todoId}`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    { title: `Edit: ${loaderData?.todo.title ?? "Todo"}` },
    { name: "description", content: "Edit todo" },
  ];
}

export default function TodoEditPage({ loaderData }: Route.ComponentProps) {
  const { todo } = loaderData;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit Todo</h1>

        <Form method="post" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={todo.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              defaultValue={todo.description || ""}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue={todo.priority || "medium"}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={todo.dueDate || ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="completed"
              name="completed"
              type="checkbox"
              defaultChecked={todo.completed}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="completed" className="font-normal">
              Completed
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" asChild>
              <a href={`/todos/${todo.id}`}>Cancel</a>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
