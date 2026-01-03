import { describe, it, expect } from "vitest";
import "dotenv/config";
import { db } from "../app/db/client";

describe("seed", () => {
  it("creates expected users", async () => {
    const admin = await db.user.findUnique({
      where: { email: "admin@example.com" },
    });
    const user = await db.user.findUnique({
      where: { email: "user@example.com" },
    });

    expect(admin).not.toBeNull();
    expect(user).not.toBeNull();
    expect(admin?.name).toBe("Admin User");
    expect(user?.name).toBe("Regular User");
  });

  it("creates 2 projects for admin", async () => {
    const admin = await db.user.findUnique({
      where: { email: "admin@example.com" },
    });
    const projects = await db.project.findMany({
      where: { ownerId: admin!.id },
    });

    expect(projects).toHaveLength(2);
    expect(projects.map((p: typeof projects[number]) => p.name)).toContain("Website Redesign");
    expect(projects.map((p: typeof projects[number]) => p.name)).toContain("Mobile App");
  });

  it("creates 2 todos in first project with correct state", async () => {
    const project = await db.project.findFirst({
      where: { name: "Website Redesign" },
      include: { todos: true },
    });

    expect(project?.todos).toHaveLength(2);

    const completedTodo = project?.todos.find((t: (typeof project.todos)[number]) => t.completed);
    const pendingTodo = project?.todos.find((t: (typeof project.todos)[number]) => !t.completed);

    expect(completedTodo).toBeDefined();
    expect(completedTodo?.title).toBe("Design mockups");

    expect(pendingTodo).toBeDefined();
    expect(pendingTodo?.title).toBe("Implement responsive layout");
  });

  it("assigns second todo to regular user", async () => {
    const todo = await db.todo.findFirst({
      where: { title: "Implement responsive layout" },
      include: { assignments: { include: { user: true } } },
    });

    expect(todo?.assignments).toHaveLength(1);
    expect(todo?.assignments[0].user.email).toBe("user@example.com");
  });
});
