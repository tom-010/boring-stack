import type { Route } from "./+types/projects-list";
import type { RouteHandle } from "~/components/page-header";
import { Form, Link, redirect, useSearchParams, useFetcher } from "react-router";
import { Plus, Folder, Search, Pencil, Trash2, MoreHorizontal, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "~/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { parseFormDataOrThrow } from "~/lib/forms";
import { deleteByIdSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: { label: "Projects", href: "/projects" },
};

const PAGE_SIZE = 10;

export async function loader({ request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));

  const searchCondition = query
    ? {
        OR: [
          { name: { search: query.split(/\s+/).join(" & ") } },
          { description: { search: query.split(/\s+/).join(" & ") } },
        ],
      }
    : {};

  const where = {
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
  };

  const [total, projects] = await Promise.all([
    db.project.count({ where }),
    db.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return {
    projects,
    currentUserId: userId,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const formData = await request.formData();
  const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);

  await db.project.delete({ where: { id, ownerId: userId } });
  log.info({ projectId: id }, "project_deleted");

  return redirect("/projects");
}

export function meta() {
  return [
    { title: "Projects" },
    { name: "description", content: "Manage your projects" },
  ];
}

function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
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
          title={`Delete "${projectName}"?`}
          description="This action cannot be undone. All todos in this project will also be deleted."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => {
            fetcher.submit(
              { intent: "deleteProject", id: projectId },
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
  return qs ? `?${qs}` : "/projects";
}

export default function ProjectsPage({ loaderData }: Route.ComponentProps) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { projects, currentUserId, pagination } = loaderData;
  const { page, total, totalPages, pageSize } = pagination;
  const startIndex = (page - 1) * pageSize;

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const newPage = Math.max(1, Math.min(totalPages, parseInt(input.value, 10) || 1));
      window.location.href = buildPageUrl(newPage, searchParams);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    // Calculate range centered on current page
    let start = Math.max(1, page - halfVisible);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    // First page button
    items.push(
      <PaginationItem key="first">
        <PaginationLink
          href={buildPageUrl(1, searchParams)}
          className={page === 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronsLeft className="h-4 w-4" />
        </PaginationLink>
      </PaginationItem>
    );

    // Ellipsis before if not starting at 1
    if (start > 1) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Page numbers - current page is an input
    for (let i = start; i <= end; i++) {
      if (i === page) {
        items.push(
          <PaginationItem key={i}>
            <input
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              onKeyDown={handlePageInput}
              className="h-9 w-12 text-center text-sm font-medium border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </PaginationItem>
        );
      } else {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink href={buildPageUrl(i, searchParams)}>
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    // Ellipsis after if not ending at last
    if (end < totalPages) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Last page button
    items.push(
      <PaginationItem key="last">
        <PaginationLink
          href={buildPageUrl(totalPages, searchParams)}
          className={page === totalPages ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronsRight className="h-4 w-4" />
        </PaginationLink>
      </PaginationItem>
    );

    return items;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">Organize your todos into projects</p>
        </div>

        <div id="projects-toolbar" className="flex gap-2 mb-6">
          <Form method="get" className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                placeholder="Search projects..."
                defaultValue={query}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </Form>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>

        {projects.length === 0 && total === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {query ? "No projects match your search." : "No projects yet. Create one to get started!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className=""></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project, idx) => {
                    const isOwner = project.ownerId === currentUserId;
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium text-muted-foreground">
                          {startIndex + idx + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/projects/${project.id}`}
                            className="hover:underline font-medium"
                          >
                            {project.name}
                          </Link>
                          {!isOwner && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (by {project.owner.name})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {project.description || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/projects/${project.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            {isOwner && (
                              <DeleteProjectButton projectId={project.id} projectName={project.name} />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {renderPaginationItems()}
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <div className="text-sm text-muted-foreground text-center">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, total)} of {total} projects
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
