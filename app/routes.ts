import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("projects/:id", "routes/projects.$id.tsx"),
  route("api/create-project", "routes/api/create-project.ts"),
  route("api/update-project", "routes/api/update-project.ts"),
  route("api/delete-project", "routes/api/delete-project.ts"),
  route("api/create-todo", "routes/api/create-todo.ts"),
  route("api/update-todo", "routes/api/update-todo.ts"),
  route("api/delete-todo", "routes/api/delete-todo.ts"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
