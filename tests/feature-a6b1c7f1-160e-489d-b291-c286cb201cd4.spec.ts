/*feature:
  id: a6b1c7f1-160e-489d-b291-c286cb201cd4
  category: Todo Features
  name: Todos in projects
  hash: fadd8afe7b27b44acfd18f0181c000a2
  content: |
    I can create a project, where I can create then a bunch of todos.
    There is a table showing them to me where I can mark them done.
    The newest ones are at the top.
    I got a view displaying all my todos across all projects.
*/

import { test, expect } from '@playwright/test';

test.describe('Todos in projects', () => {
  test('can create project and add todos', async ({ page }) => {
    const projectName = `Project ${Date.now()}`;
    const todo1 = `First todo ${Date.now()}`;
    const todo2 = `Second todo ${Date.now()}`;

    // Go to projects page
    await page.goto('/projects');

    // Create a new project
    await page.getByPlaceholder('Create a new project...').fill(projectName);
    await page.getByRole('button', { name: 'New Project' }).click();

    // Should be on project detail page
    await expect(page).toHaveURL(/\/projects\//);
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();

    // Create first todo
    await page.getByPlaceholder('Add a new todo...').fill(todo1);
    await page.getByRole('button', { name: 'Add Todo' }).click();
    await expect(page.getByRole('link', { name: todo1 })).toBeVisible();

    // Create second todo
    await page.getByPlaceholder('Add a new todo...').fill(todo2);
    await page.getByRole('button', { name: 'Add Todo' }).click();
    await expect(page.getByRole('link', { name: todo2 })).toBeVisible();

    // Newest should be at top (todo2 above todo1)
    const todoLinks = page.getByRole('link', { name: /todo/ });
    const firstLink = await todoLinks.first().textContent();
    expect(firstLink).toContain('Second todo');
  });

  test('can mark todo as done in table', async ({ page }) => {
    const projectName = `Project ${Date.now()}`;
    const todoTitle = `Todo to complete ${Date.now()}`;

    // Create project
    await page.goto('/projects');
    await page.getByPlaceholder('Create a new project...').fill(projectName);
    await page.getByRole('button', { name: 'New Project' }).click();

    // Create todo
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);
    await page.getByRole('button', { name: 'Add Todo' }).click();

    // Should show 0 of 1 completed
    await expect(page.getByText('0 of 1 tasks completed')).toBeVisible();

    // Mark as done by clicking checkbox button
    const todoRow = page.getByRole('row').filter({ hasText: todoTitle });
    await todoRow.getByRole('button').first().click();

    // Should show 1 of 1 completed
    await expect(page.getByText('1 of 1 tasks completed')).toBeVisible();
  });

  test('can see all todos in My Todos view', async ({ page }) => {
    const projectName = `Project ${Date.now()}`;
    const todoTitle = `My todo ${Date.now()}`;

    // Create project with todo
    await page.goto('/projects');
    await page.getByPlaceholder('Create a new project...').fill(projectName);
    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);
    await page.getByRole('button', { name: 'Add Todo' }).click();

    // Wait for todo to appear in project page first
    await expect(page.getByRole('link', { name: todoTitle })).toBeVisible();

    // Go to My Todos
    await page.goto('/my-todos');
    await expect(page.getByRole('heading', { name: 'My Todos' })).toBeVisible();

    // Should see the todo we created (use getByText for more flexible matching)
    await expect(page.getByText(todoTitle)).toBeVisible();
    // Should see the project name
    await expect(page.getByText(projectName)).toBeVisible();
  });
});
