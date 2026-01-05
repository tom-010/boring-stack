import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/project-detail";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Form, redirect } from "react-router";
import { Plus, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TodosTable } from "~/components/todos-table";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { getIntent, parseFormDataOrThrow } from "~/lib/forms";
import {
  updateProjectSchema,
  createTodoSchema,
  updateTodoSchema,
  deleteByIdSchema,
} from "~/lib/schemas";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: (data): BreadcrumbItem[] => {
    const { project } = data as { project: { name: string } };
    return [
      { label: "Projects", href: "/" },
      { label: project.name },
    ];
  },
};

export async function loader({ params, request }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const projectId = params.id;
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }

  const projectTodos = await db.todo.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: "desc" },
  });

  return { project, todos: projectTodos };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const intent = getIntent(formData);
  const projectId = params.id!;

  switch (intent) {
    case "updateProject": {
      const { name, description } = parseFormDataOrThrow(
        formData,
        updateProjectSchema
      );
      await db.project.update({
        where: { id: projectId },
        data: { name, description },
      });
      return redirect(`/projects/${projectId}`);
    }

    case "deleteProject": {
      await db.project.delete({ where: { id: projectId } });
      log.info({ projectId, userId }, "project_deleted");
      return redirect("/");
    }

    case "createTodo": {
      const { title, priority } = parseFormDataOrThrow(
        formData,
        createTodoSchema
      );
      await db.todo.create({
        data: {
          projectId,
          userId,
          title,
          priority,
          completed: false,
        },
      });
      return redirect(`/projects/${projectId}`);
    }

    case "updateTodo": {
      const { id, completed, priority } = parseFormDataOrThrow(
        formData,
        updateTodoSchema
      );
      await db.todo.update({
        where: { id, userId },
        data: {
          ...(completed !== undefined && { completed }),
          ...(priority && { priority }),
        },
      });
      return redirect(`/projects/${projectId}`);
    }

    case "deleteTodo": {
      const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);
      await db.todo.delete({ where: { id, userId } });
      return redirect(`/projects/${projectId}`);
    }

    default:
      throw new Response("Invalid intent", { status: 400 });
  }
}

export function meta() {
  return [
    { title: "Project" },
    { name: "description", content: "View and manage project todos" },
  ];
}

export default function ProjectDetailPage({
  loaderData,
}: Route.ComponentProps) {
  const { project, todos } = loaderData;
  const completedCount = todos.filter((t: typeof todos[number]) => t.completed).length;
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [todos.length]);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {editing ? (
          <Form
            method="post"
            className="mb-8"
            onSubmit={() => setEditing(false)}
          >
            <input type="hidden" name="intent" value="updateProject" />
            <div className="space-y-3">
              <input
                type="text"
                name="name"
                defaultValue={project.name}
                className="w-full px-3 py-2 text-2xl font-bold border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                required
                autoFocus
              />
              <input
                type="text"
                name="description"
                defaultValue={project.description || ""}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Form>
        ) : (
          <div className="mb-8 group">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-2">{project.description}</p>
            )}
          </div>
        )}

        <Form method="post" className="mb-8">
          <input type="hidden" name="intent" value="createTodo" />
          <div className="flex gap-2">
            <input
              ref={inputRef}
              key={todos.length}
              type="text"
              name="title"
              placeholder="Add a new todo..."
              className="flex-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <input type="hidden" name="priority" value="medium" />
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Todo
            </Button>
          </div>
        </Form>

        {todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg">No todos yet. Create one to get started!</p>
          </div>
        ) : (
          <TodosTable todos={todos} />
        )}

        <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
          <p>{completedCount} of {todos.length} tasks completed</p>
        </div>
      </div>
    </div>
  );
}
