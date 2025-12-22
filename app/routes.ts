import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Public routes
  route("api/auth/*", "routes/api.auth.$.ts"),
  route("login", "routes/login.tsx"),

  // Protected routes (auth middleware runs first)
  layout("routes/_protected.tsx", [
    index("routes/projects-list.tsx"),
    route("projects/:id", "routes/project-detail.tsx"),
    route("todos/:id", "routes/todo-detail.tsx"),
    route("todos/:id/edit", "routes/todo-edit.tsx"),
  ]),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
