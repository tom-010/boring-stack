import { useState } from "react";
import type { Route } from "./+types/todo-detail";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Form, Link, redirect } from "react-router";
import { Pencil, Paperclip, X, UserPlus, Trash2, Search } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { db } from "~/db/client";
import { auth } from "~/lib/auth.server";
import { getIntent, parseFormDataOrThrow } from "~/lib/forms";
import {
  deleteByIdSchema,
  assignUserSchema,
  unassignUserSchema,
} from "~/lib/schemas";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

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

export async function loader({ params, request }: Route.LoaderArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;

  const todoId = parseInt(params.id!);

  // Check if user owns or is assigned to this todo
  const todo = await db.todo.findFirst({
    where: {
      id: todoId,
      OR: [{ userId }, { assignments: { some: { userId } } }],
    },
    include: {
      attachments: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      assignments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      user: { select: { id: true, name: true } },
    },
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

  // Get all users for assignment (exclude owner, max 100)
  const assignedUserIds = todo.assignments.map((a) => a.userId);
  const allUsers = await db.user.findMany({
    where: {
      id: { notIn: [todo.userId] },
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 100,
  });

  const isOwner = todo.userId === userId;

  return {
    todo,
    project,
    allUsers,
    assignedUserIds,
    isOwner,
    currentUserId: userId,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session!.user.id;
  const todoId = parseInt(params.id!);

  // Verify access
  const todo = await db.todo.findFirst({
    where: {
      id: todoId,
      OR: [{ userId }, { assignments: { some: { userId } } }],
    },
  });

  if (!todo) {
    throw new Response("Not Found", { status: 404 });
  }

  const isOwner = todo.userId === userId;
  const formData = await request.formData();
  const intent = getIntent(formData);

  switch (intent) {
    case "uploadAttachment": {
      const file = formData.get("file") as File;
      if (!file || file.size === 0) {
        return { error: "No file provided" };
      }

      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        return { error: "File too large (max 10MB)" };
      }

      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const uniqueName = `${Date.now()}-${file.name}`;
      const filepath = `/uploads/${uniqueName}`;
      const fullPath = join(uploadDir, uniqueName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(fullPath, buffer);

      await db.attachment.create({
        data: {
          todoId,
          userId,
          filename: file.name,
          filepath,
          mimetype: file.type,
          size: file.size,
        },
      });

      return redirect(`/todos/${todoId}`);
    }

    case "deleteAttachment": {
      const { id } = parseFormDataOrThrow(formData, deleteByIdSchema);

      const attachment = await db.attachment.findUnique({ where: { id } });
      if (!attachment) {
        return { error: "Attachment not found" };
      }

      // Only owner or uploader can delete
      if (!isOwner && attachment.userId !== userId) {
        return { error: "Not authorized" };
      }

      // Delete file
      try {
        const fullPath = join(process.cwd(), "public", attachment.filepath);
        await unlink(fullPath);
      } catch {
        // File may already be deleted
      }

      await db.attachment.delete({ where: { id } });
      return redirect(`/todos/${todoId}`);
    }

    case "assignUser": {
      if (!isOwner) {
        return { error: "Only the owner can assign users" };
      }

      const { userId: assignUserId } = parseFormDataOrThrow(
        formData,
        assignUserSchema
      );

      // Check not already assigned
      const existing = await db.todoAssignment.findUnique({
        where: { todoId_userId: { todoId, userId: assignUserId } },
      });

      if (existing) {
        return { error: "User already assigned" };
      }

      await db.todoAssignment.create({
        data: {
          todoId,
          userId: assignUserId,
          assignedBy: userId,
        },
      });

      return redirect(`/todos/${todoId}`);
    }

    case "unassignUser": {
      if (!isOwner) {
        return { error: "Only the owner can unassign users" };
      }

      const { assignmentId } = parseFormDataOrThrow(
        formData,
        unassignUserSchema
      );

      await db.todoAssignment.delete({ where: { id: assignmentId } });
      return redirect(`/todos/${todoId}`);
    }

    default:
      throw new Response("Invalid intent", { status: 400 });
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.todo.title ?? "Todo" },
    { name: "description", content: "View todo details" },
  ];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TodoDetailPage({ loaderData }: Route.ComponentProps) {
  const { todo, project, allUsers, assignedUserIds, isOwner, currentUserId } =
    loaderData;
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredUsers = allUsers.filter(
    (user) =>
      !assignedUserIds.includes(user.id) &&
      (user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()))
  );

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
          {isOwner && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/todos/${todo.id}/edit`}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
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
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Owner</span>
            <span>{todo.user.name}</span>
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

        {/* Assigned Users Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assigned Users
            </h2>
            {isOwner && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign User</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {filteredUsers.length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-4">
                          No users found
                        </p>
                      ) : (
                        filteredUsers.map((user) => (
                          <Form
                            key={user.id}
                            method="post"
                            onSubmit={() => setDialogOpen(false)}
                          >
                            <input
                              type="hidden"
                              name="intent"
                              value="assignUser"
                            />
                            <input
                              type="hidden"
                              name="userId"
                              value={user.id}
                            />
                            <button
                              type="submit"
                              className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex justify-between items-center"
                            >
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Form>
                        ))
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {todo.assignments.length > 0 ? (
            <div className="space-y-2">
              {todo.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
                >
                  <div>
                    <span className="font-medium">{assignment.user.name}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {assignment.user.email}
                    </span>
                  </div>
                  {isOwner && (
                    <Form method="post">
                      <input type="hidden" name="intent" value="unassignUser" />
                      <input
                        type="hidden"
                        name="assignmentId"
                        value={assignment.id}
                      />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Form>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No users assigned yet.
            </p>
          )}
        </div>

        {/* Attachments Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments
          </h2>

          {todo.attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              {todo.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between py-2 px-3 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <a
                      href={attachment.filepath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline truncate"
                    >
                      {attachment.filename}
                    </a>
                    <span className="text-muted-foreground text-xs shrink-0">
                      ({formatFileSize(attachment.size)})
                    </span>
                  </div>
                  {(isOwner || attachment.userId === currentUserId) && (
                    <Form method="post">
                      <input
                        type="hidden"
                        name="intent"
                        value="deleteAttachment"
                      />
                      <input type="hidden" name="id" value={attachment.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Form>
                  )}
                </div>
              ))}
            </div>
          )}

          <Form
            method="post"
            encType="multipart/form-data"
            className="flex gap-2"
          >
            <input type="hidden" name="intent" value="uploadAttachment" />
            <input
              type="file"
              name="file"
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
              required
            />
            <Button type="submit">Upload</Button>
          </Form>
          <p className="text-muted-foreground text-xs mt-2">
            Max file size: 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
