import { Outlet } from "react-router";
import type { Route } from "./+types/_protected";
import { requireAuth } from "~/lib/auth.server";

// Layout route that protects all nested routes.
// Auth check runs before child loaders via layout hierarchy.
export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return null;
}

export default function ProtectedLayout() {
  return <Outlet />;
}
