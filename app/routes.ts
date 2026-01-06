import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public routes
  route("api/auth/*", "routes/api-auth.ts"),
  route("login", "routes/login.tsx"),

  // Protected routes (auth middleware runs first)
  layout("routes/_protected.tsx", [
    index("routes/home.tsx"), // Redirects based on __ENABLE_DASHBOARD__ flag
    route("dashboard", "routes/dashboard.tsx"),
    route("projects", "routes/projects-list.tsx"),
    route("projects/new", "routes/projects-new.tsx"),
    route("my-todos", "routes/my-todos.tsx"), // Listing all todos owned or assigned to me across all projects.
    route("projects/:id", "routes/project-detail.tsx"),
    route("todos/:id", "routes/todo-detail.tsx"),
    route("todos/:id/edit", "routes/todo-edit.tsx"),
    route("admin/users", "routes/admin-users.tsx"),
    route("admin/users/new", "routes/admin-user-new.tsx"),
    route("admin/users/:id/edit", "routes/admin-user-edit.tsx"),
    route("debug/py", "routes/debug-py.tsx"),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
