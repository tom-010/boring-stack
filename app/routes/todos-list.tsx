import type { Route } from "./+types/todos-list";
import type { RouteHandle } from "~/components/page-header";
import { redirect } from "react-router";
import { ListChecks } from "lucide-react";
import { AllTodosTable } from "~/components/all-todos-table";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { getIntent, parseFormDataOrThrow } from "~/lib/forms";
import { updateTodoSchema } from "~/lib/schemas";

export const handle: RouteHandle = {
  breadcrumb: { label: "My Todos", href: "/my-todos" },
};

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  // Get todos I created OR that are assigned to me
  const todos = await db.todo.findMany({
    where: {
      OR: [
        { userId },
        {
          assignments: {
            some: { userId },
          },
        },
      ],
    },
    include: {
      project: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      assignments: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { todos, currentUserId: userId };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const intent = getIntent(formData);

  if (intent === "updateTodo") {
    const { id, completed, priority } = parseFormDataOrThrow(
      formData,
      updateTodoSchema
    );

    // Only allow updating todos the user owns or is assigned to
    const todo = await db.todo.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { assignments: { some: { userId } } },
        ],
      },
    });

    if (!todo) {
      throw new Response("Not Found", { status: 404 });
    }

    await db.todo.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(priority && { priority }),
      },
    });
  }

  return redirect("/my-todos");
}

export function meta() {
  return [
    { title: "My Todos" },
    { name: "description", content: "All your todos across projects" },
  ];
}

export default function TodosListPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Todos</h1>
          <p className="text-muted-foreground">
            All todos you created or that are assigned to you
          </p>
        </div>

        {loaderData.todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No todos yet. Create one in a project!</p>
          </div>
        ) : (
          <AllTodosTable
            todos={loaderData.todos}
            currentUserId={loaderData.currentUserId}
          />
        )}
      </div>
    </div>
  );
}
