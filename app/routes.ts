import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/projects.tsx"),
    route("projects/:id", "routes/project-detail.tsx"),
  ]),
  route("api/projects", "routes/api.projects.tsx"),
  route("api/todos", "routes/api.todos.tsx"),
] satisfies RouteConfig;
