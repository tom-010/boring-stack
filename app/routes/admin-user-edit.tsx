/*+++
intent = "Edit admin user"
+++*/
import type { Route } from "./+types/admin-user-edit";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Form, Link, redirect, useActionData } from "react-router";
import { db } from "~/db/client";
import { auth, requireAdmin } from "~/lib/auth.server";
import { parseRoles, serializeRoles, ROLES } from "~/lib/roles";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { updateUserSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";
import { parseForm, useFormValidation } from "~/lib/utils";

export const handle: RouteHandle = {
  breadcrumb: (data): BreadcrumbItem[] => {
    const { user } = data as { user: { name: string } };
    return [
      { label: "Projects", href: "/" },
      { label: "User Management", href: "/admin/users" },
      { label: user.name },
    ];
  },
};

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      roles: true,
    },
  });

  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  return {
    user: { ...user, roles: parseRoles(user.roles) },
    allRoles: ROLES,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await requireAdmin(request);

  const formData = await request.formData();
  const result = parseForm(updateUserSchema, formData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Prevent admin from removing their own admin role
  const isEditingSelf = session.user.id === params.id;
  if (isEditingSelf && !result.data.roles.includes("admin")) {
    return { errors: { roles: ["You cannot remove your own admin role"] } };
  }

  const updateData: { name: string; email: string; roles: string; password?: string } = {
    name: result.data.name,
    email: result.data.email,
    roles: serializeRoles(result.data.roles),
  };

  // Update password if provided
  if (result.data.password && result.data.password.length > 0) {
    const ctx = await auth.$context;
    const hashedPassword = await ctx.password.hash(result.data.password);

    await db.account.updateMany({
      where: { userId: params.id, providerId: "credential" },
      data: { password: hashedPassword },
    });
  }

  await db.user.update({
    where: { id: params.id },
    data: updateData,
  });

  log.info({ userId: params.id, byUserId: session.user.id, passwordChanged: !!result.data.password }, "user_updated");
  return redirect("/admin/users");
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: `Edit: ${data?.user.name ?? "User"}` },
    { name: "description", content: "Edit user" },
  ];
}

export default function EditUserPage({ loaderData }: Route.ComponentProps) {
  const { user, allRoles } = loaderData;
  const actionData = useActionData<typeof action>();
  const { onSubmit, errors } = useFormValidation(updateUserSchema, actionData?.errors);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Edit User</h1>

        <Form method="post" className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
            {errors?.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
            {errors?.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current password"
            />
            {errors?.password && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex gap-4">
              {allRoles.map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role}`}
                    name="roles"
                    value={role}
                    defaultChecked={user.roles.includes(role)}
                  />
                  <Label htmlFor={`role-${role}`} className="font-normal capitalize cursor-pointer">
                    {role}
                  </Label>
                </div>
              ))}
            </div>
            {errors?.roles && (
              <p className="text-sm text-destructive">{errors.roles[0]}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/users">Cancel</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
