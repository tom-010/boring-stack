import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { redirect } from "react-router";
import { db } from "~/db/client";
import { hasRole, type Role } from "~/lib/roles";
import { config } from "~/lib/config.server";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: config.auth.secret,
  baseURL: config.auth.url,
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
});

// Legacy helper - prefer middleware in _protected.tsx for route protection
export async function requireAuth(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  return session;
}

export async function getOptionalSession(request: Request) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function requireRole(request: Request, role: Role) {
  const session = await requireAuth(request);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!hasRole(user?.roles ?? null, role)) {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function requireAdmin(request: Request) {
  return requireRole(request, "admin");
}
