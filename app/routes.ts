import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public routes
  route("api/auth/*", "routes/api-auth.ts"),
  route("login", "routes/login.tsx"), // intent: User login page

  // Protected routes (auth middleware runs first)
  layout("routes/_protected.tsx", [
    index("routes/home.tsx"), // Redirects based on __ENABLE_DASHBOARD__ flag
    route("dashboard", "routes/dashboard.tsx"), // intent: Main dashboard with stats overview
    route("projects", "routes/projects-list.tsx"), // intent: List all projects
    route("projects/new", "routes/projects-new.tsx"), // intent: Create a new project
    route("my-todos", "routes/my-todos.tsx"), // intent: List all todos owned or assigned to current user
    route("projects/:id", "routes/project-detail.tsx"), // intent: Project detail page with todo management
    route("todos/:id", "routes/todo-detail.tsx"), // intent: View single todo details
    route("todos/:id/edit", "routes/todo-edit.tsx"), // intent: Edit a todo
    route("admin/users", "routes/admin-users.tsx"), // intent: Admin user management list
    route("admin/users/new", "routes/admin-user-new.tsx"), // intent: Create new admin user
    route("admin/users/:id/edit", "routes/admin-user-edit.tsx"), // intent: Edit admin user
    route("debug/py", "routes/debug-py.tsx"),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
