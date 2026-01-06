/*+++
intent = "Create new admin user"
+++*/
import type { Route } from "./+types/admin-user-new";
import type { RouteHandle, BreadcrumbItem } from "~/components/page-header";
import { Form, Link, redirect, useActionData } from "react-router";
import { db } from "~/db/client";
import { auth, requireAdmin } from "~/lib/auth.server";
import { serializeRoles, ROLES } from "~/lib/roles";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { createUserSchema } from "~/lib/schemas";
import { log } from "~/lib/logger.server";
import { parseForm, useFormValidation } from "~/lib/utils";

export const handle: RouteHandle = {
  breadcrumb: (): BreadcrumbItem[] => [
    { label: "Projects", href: "/" },
    { label: "User Management", href: "/admin/users" },
    { label: "New User" },
  ],
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { allRoles: ROLES };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);

  const formData = await request.formData();
  const result = parseForm(createUserSchema, formData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Check if email already exists
  const existingUser = await db.user.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return { errors: { email: ["Email already in use"] } };
  }

  // Hash password
  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(result.data.password);

  // Generate IDs
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  // Create user
  await db.user.create({
    data: {
      id: userId,
      name: result.data.name,
      email: result.data.email,
      roles: serializeRoles(result.data.roles),
      emailVerified: true,
    },
  });

  // Create account with password
  await db.account.create({
    data: {
      id: accountId,
      userId,
      accountId: userId,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  log.info({ userId, email: result.data.email, roles: result.data.roles }, "user_created");
  return redirect("/admin/users");
}

export function meta() {
  return [
    { title: "New User" },
    { name: "description", content: "Create a new user" },
  ];
}

export default function NewUserPage({ loaderData }: Route.ComponentProps) {
  const { allRoles } = loaderData;
  const actionData = useActionData<typeof action>();
  const { onSubmit, errors } = useFormValidation(createUserSchema, actionData?.errors);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">New User</h1>

        <Form method="post" className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
            {errors?.name && (
              <p className="text-sm text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {errors?.email && (
              <p className="text-sm text-destructive">{errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {errors?.password && (
              <p className="text-sm text-destructive">{errors.password[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex gap-4">
              {allRoles.map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="roles"
                    value={role}
                    defaultChecked={role === "user"}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-normal capitalize">{role}</span>
                </label>
              ))}
            </div>
            {errors?.roles && (
              <p className="text-sm text-destructive">{errors.roles[0]}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">Create User</Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/admin/users">Cancel</Link>
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
