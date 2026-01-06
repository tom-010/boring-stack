import type { Route } from "./+types/my-todos2";
import type { RouteHandle } from "~/components/page-header";
import { Form, Link, useSearchParams, useFetcher } from "react-router";
import { CheckSquare, CheckCircle2, Circle, Trash2, MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { ListPagination } from "~/components/list-pagination";
import { SearchBar } from "~/components/search-bar";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: { label: "My Todos", href: "/my-todos2" },
};

const PAGE_SIZE = 30;
const BASE_PATH = "/my-todos2";

type SortField = "title" | "priority" | "dueDate" | "createdAt";
type SortOrder = "asc" | "desc";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

function getNextPriority(current: string | null): string {
  if (current === "low") return "medium";
  if (current === "medium") return "high";
  return "low";
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const sortParam = url.searchParams.get("sort");
  const orderParam = url.searchParams.get("order");

  const validSorts = ["title", "priority", "dueDate", "createdAt"];
  const sort: SortField | null = validSorts.includes(sortParam || "")
    ? (sortParam as SortField)
    : null;
  const order: SortOrder = orderParam === "asc" ? "asc" : "desc";

  const searchCondition = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = {
    OR: [
      { userId },
      { assignments: { some: { userId } } },
    ],
    ...searchCondition,
  };

  const orderBy = sort === null
    ? [{ completed: "asc" as const }, { createdAt: "desc" as const }]
    : { [sort]: order };

  const [total, items] = await Promise.all([
    db.todo.count({ where }),
    db.todo.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    items,
    currentUserId: userId,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
    sort,
    order,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "updateTodo") {
    const todoId = formData.get("id") as string;
    const completed = formData.get("completed");
    const priority = formData.get("priority");

    // Verify user has access
    const todo = await db.todo.findFirst({
      where: {
        id: todoId,
        OR: [
          { userId },
          { assignments: { some: { userId } } },
        ],
      },
    });

    if (!todo) {
      return { error: "Todo not found or access denied" };
    }

    await db.todo.update({
      where: { id: todoId },
      data: {
        ...(completed !== null && { completed: completed === "true" }),
        ...(priority && { priority: priority as string }),
      },
    });

    return { success: true };
  }

  if (intent === "deleteTodo") {
    const id = formData.get("id") as string;
    await db.todo.delete({ where: { id, userId } });
    log.info({ todoId: id }, "todo_deleted");
    return { success: true };
  }

  return { error: "Unknown intent" };
}

export function meta() {
  return [
    { title: "My Todos" },
    { name: "description", content: "All your todos across projects" },
  ];
}

function DeleteTodoButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const fetcher = useFetcher();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ConfirmDialog
          title={`Delete "${itemName}"?`}
          description="This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => {
            fetcher.submit(
              { intent: "deleteTodo", id: itemId },
              { method: "post" }
            );
          }}
        >
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </ConfirmDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildPageUrl(page: number, searchParams: URLSearchParams) {
  const params = new URLSearchParams(searchParams);
  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : BASE_PATH;
}

function SortableHeader({
  field,
  currentSort,
  currentOrder,
  searchParams,
  children,
  className,
}: {
  field: SortField;
  currentSort: SortField | null;
  currentOrder: SortOrder;
  searchParams: URLSearchParams;
  children: React.ReactNode;
  className?: string;
}) {
  const isActive = currentSort === field;
  let nextOrder: SortOrder | null;
  if (!isActive) {
    nextOrder = "asc";
  } else if (currentOrder === "asc") {
    nextOrder = "desc";
  } else {
    nextOrder = null;
  }

  const params = new URLSearchParams(searchParams);
  params.delete("page");
  if (nextOrder === null) {
    params.delete("sort");
    params.delete("order");
  } else {
    params.set("sort", field);
    params.set("order", nextOrder);
  }
  const href = params.toString() ? `?${params.toString()}` : BASE_PATH;

  return (
    <Link to={href} className={`flex items-center gap-1 hover:text-foreground ${className || ""}`}>
      {children}
      {isActive && (
        currentOrder === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      )}
    </Link>
  );
}

export default function MyTodos2Page({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { items, currentUserId, pagination, sort, order } = loaderData;
  const { page, total, totalPages, pageSize } = pagination;
  const startIndex = (page - 1) * pageSize;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Todos</h1>
          <p className="text-muted-foreground">All your todos across projects</p>
        </div>

        <div className="flex gap-2 mb-6">
          <SearchBar placeholder="Search todos..." defaultValue={query} />
        </div>

        {items.length === 0 && total === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {query ? "No todos match your search." : "No todos yet. Create one in a project!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>
                      <SortableHeader field="title" currentSort={sort} currentOrder={order} searchParams={searchParams}>
                        Title
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <SortableHeader field="priority" currentSort={sort} currentOrder={order} searchParams={searchParams}>
                        Priority
                      </SortableHeader>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <SortableHeader field="dueDate" currentSort={sort} currentOrder={order} searchParams={searchParams}>
                        Due
                      </SortableHeader>
                    </TableHead>
                    <TableHead className="text-right w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => {
                    const isOwner = item.userId === currentUserId;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {startIndex + idx + 1}
                        </TableCell>
                        <TableCell>
                          <Form method="post" style={{ display: "inline" }}>
                            <input type="hidden" name="intent" value="updateTodo" />
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="completed" value={String(!item.completed)} />
                            <button type="submit" className="cursor-pointer">
                              {item.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                              )}
                            </button>
                          </Form>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/todos/${item.id}`}
                            className={`hover:underline font-medium ${
                              item.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link to={`/projects/${item.project.id}`} className="hover:underline">
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: item.project.color ?? undefined,
                                color: item.project.color ?? undefined,
                              }}
                            >
                              {item.project.name}
                            </Badge>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Form method="post" style={{ display: "inline" }}>
                            <input type="hidden" name="intent" value="updateTodo" />
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="priority" value={getNextPriority(item.priority)} />
                            <button type="submit" className="cursor-pointer">
                              <Badge
                                variant="secondary"
                                className={`${priorityColors[item.priority || "medium"] || ""} hover:opacity-80`}
                              >
                                {item.priority || "medium"}
                              </Badge>
                            </button>
                          </Form>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {item.dueDate ? (
                            <span
                              className={
                                new Date(item.dueDate) < new Date() && !item.completed
                                  ? "text-red-500 font-medium"
                                  : ""
                              }
                            >
                              {item.dueDate}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isOwner && (
                            <DeleteTodoButton itemId={item.id} itemName={item.title} />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <ListPagination
              page={page}
              totalPages={totalPages}
              buildPageUrl={(p) => buildPageUrl(p, searchParams)}
            />

            <div className="text-sm text-muted-foreground text-center">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, total)} of {total} todos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
