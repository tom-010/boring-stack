import { test, expect } from "@playwright/test";

test.describe("Project and Todo CRUD", () => {
  test("can create project, add todo, and see it in My Todos", async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    const todoTitle = `Buy groceries ${Date.now()}`;
    // Navigate to projects
    await page.goto("/projects");
    await expect(page).toHaveURL("/projects");

    // Create a new project
    await page.getByPlaceholder("Create a new project...").fill(projectName);
    await page.getByRole("button", { name: "New Project" }).click();

    // Should redirect to project detail page
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

    // Create a todo
    await page.getByPlaceholder("Add a new todo...").fill(todoTitle);
    await page.getByRole("button", { name: "Add Todo" }).click();

    // Todo should appear in the list
    await expect(page.getByRole("link", { name: todoTitle })).toBeVisible();

    // Navigate to My Todos page
    await page.goto("/my-todos");
    await expect(page).toHaveURL("/my-todos");

    // Verify we're on the My Todos page
    await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();

    // The todo we just created should appear in the list
    await expect(page.getByRole("link", { name: todoTitle })).toBeVisible();

    // The project name should also appear in the table
    await expect(page.getByRole("link", { name: projectName })).toBeVisible();
  });

  test("can create project, add todo, and mark it complete", async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    const todoTitle = `Buy groceries ${Date.now()}`;

    // Navigate to projects
    await page.goto("/projects");
    await expect(page).toHaveURL("/projects");

    // Create a new project
    await page.getByPlaceholder("Create a new project...").fill(projectName);
    await page.getByRole("button", { name: "New Project" }).click();

    // Should redirect to project detail page
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

    // Create a todo
    await page.getByPlaceholder("Add a new todo...").fill(todoTitle);
    await page.getByRole("button", { name: "Add Todo" }).click();

    // Todo should appear in the list
    await expect(page.getByRole("link", { name: todoTitle })).toBeVisible();
    await expect(page.getByText("0 of 1 tasks completed")).toBeVisible();

    // Mark todo as complete by clicking the checkbox button
    const todoRow = page.getByRole("row").filter({ hasText: todoTitle });
    await todoRow.getByRole("button").first().click();

    // Verify completion status
    await expect(page.getByText("1 of 1 tasks completed")).toBeVisible();
  });
});
