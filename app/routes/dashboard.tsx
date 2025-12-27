import { redirect } from "react-router";
import type { Route } from "./+types/dashboard";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/db/client";
import { CheckSquare2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

// Redirect away if dashboard is disabled - route becomes inaccessible
export async function loader({ request }: Route.LoaderArgs) {
  if (!__ENABLE_DASHBOARD__) {
    throw redirect("/projects");
  }

  const session = await requireAuth(request);
  const todoCount = await db.todo.count({
    where: { userId: session.user.id },
  });

  return { todoCount, userName: session.user.name };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  if (!__ENABLE_DASHBOARD__) return null; // tree-shaking

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-lg text-muted-foreground mb-1">
            Welcome back, {loaderData.userName || "friend"}!
          </p>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Your overview at a glance</p>
        </div>

        <Card className="max-w-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Todos</CardTitle>
            <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loaderData.todoCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
