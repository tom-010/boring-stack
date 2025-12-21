export const routes = {
  home: "/",
  projectDetail: (id: string | number) => `/projects/${id}`,
  createProject: { path: "/api/create-project" },
  updateProject: { path: "/api/update-project" },
  deleteProject: { path: "/api/delete-project" },
  createTodo: { path: "/api/create-todo" },
  updateTodo: { path: "/api/update-todo" },
  deleteTodo: { path: "/api/delete-todo" },
} as const;
