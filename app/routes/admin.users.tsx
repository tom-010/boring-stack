import type { Route } from "./+types/admin.users";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Link, redirect } from "react-router";
import { Plus, Users } from "lucide-react";
import { db } from "~/db/client";
import { requireAdmin } from "~/lib/auth.server";
import { parseRoles } from "~/lib/roles";
import { Button } from "~/components/ui/button";
import { UsersTable } from "~/components/users-table";
import { parseFormDataOrThrow } from "~/lib/forms";
import { deleteByStringIdSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";

export const handle: RouteHandle = {
  breadcrumb: (): BreadcrumbItem[] => [
    { label: "Projects", href: "/" },
    { label: "User Management" },
  ],
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    users: users.map((u: typeof users[number]) => ({ ...u, roles: parseRoles(u.roles) })),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await requireAdmin(request);

  const formData = await request.formData();
  const { id } = parseFormDataOrThrow(formData, deleteByStringIdSchema);

  // Prevent self-deletion
  if (session.user.id === id) {
    return { error: "You cannot delete yourself" };
  }

  await db.user.delete({ where: { id } });
  log.info({ deletedUserId: id, byUserId: session.user.id }, "user_deleted");

  return redirect("/admin/users");
}

export function meta() {
  return [
    { title: "User Management" },
    { name: "description", content: "Manage user accounts and roles" },
  ];
}

export default function AdminUsersPage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">User Management</h1>
              <p className="text-muted-foreground">
                Manage user accounts and roles
              </p>
            </div>
            <Button asChild>
              <Link to="/admin/users/new">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Link>
            </Button>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users yet. Create one to get started!</p>
          </div>
        ) : (
          <UsersTable users={users} />
        )}
      </div>
    </div>
  );
}
