import type { Route } from "./+types/todos-list";
import type { RouteHandle } from "~/components/page-header";
import { Form, redirect, useSearchParams } from "react-router";
import { ListChecks, Search } from "lucide-react";
import { Input } from "~/components/ui/input";
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

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();

  // Build search condition (case-insensitive partial match)
  const searchCondition = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
          { project: { name: { contains: query, mode: "insensitive" as const } } },
        ],
      }
    : {};

  // Get todos I created OR that are assigned to me
  const todos = await db.todo.findMany({
    where: {
      AND: [
        {
          OR: [
            { userId },
            {
              assignments: {
                some: { userId },
              },
            },
          ],
        },
        searchCondition,
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
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Todos</h1>
          <p className="text-muted-foreground">
            All todos you created or that are assigned to you
          </p>
        </div>

        <Form method="get" className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Search todos..."
              defaultValue={query}
              className="pl-10"
            />
          </div>
        </Form>

        {loaderData.todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {query ? "No todos match your search." : "No todos yet. Create one in a project!"}
            </p>
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
