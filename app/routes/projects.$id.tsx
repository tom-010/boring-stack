import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/projects.$id";
import { Link, Form } from "react-router";
import { Plus, ArrowLeft, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { TodosTable } from "~/components/todos-table";
import { db } from "~/db/client";
import { routes } from "~/lib/routes";

export async function loader({ params }: Route.LoaderArgs) {
  if (!params.id) {
    throw new Response("Not Found", { status: 404 });
  }

  const projectId = parseInt(params.id);
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Response("Not Found", { status: 404 });
  }

  const projectTodos = await db.todo.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return { project, todos: projectTodos };
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
  const completedCount = todos.filter((t) => t.completed).length;
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [todos.length]);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to={routes.home} className="inline-block mb-6">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        {editing ? (
          <Form
            method="put"
            action={routes.updateProject.path}
            className="mb-8"
            onSubmit={() => setEditing(false)}
          >
            <input type="hidden" name="id" value={project.id} />
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

        <Form method="post" action={routes.createTodo.path} className="mb-8">
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
            <input type="hidden" name="projectId" value={project.id} />
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
