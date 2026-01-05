/*feature:
  id: 30d9bb12-09d2-4f4c-b5f5-61399169e23b
  category: Todo Features
  name: Collaborate
  hash: 7750e999be52dd4b3693b5bba90f6b6e
  content: |
    I can add another person to a todo of mine.
    He then sees the todo himself in his todos.
    I can also add him to a project of mine.
    He then sees all todos.
*/

import { test, expect } from '@playwright/test';

test.describe('Collaborate', () => {
  test('can assign user to todo and they see it in their todos', async ({ page, browser }) => {
    const projectName = `Shared Project ${Date.now()}`;
    const todoTitle = `Shared Todo ${Date.now()}`;

    // As admin: create project and todo
    await page.goto('/projects');
    await page.getByPlaceholder('Create a new project...').fill(projectName);
    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByPlaceholder('Add a new todo...').fill(todoTitle);
    await page.getByRole('button', { name: 'Add Todo' }).click();

    // Click on the todo to go to detail page
    await page.getByRole('link', { name: todoTitle }).click();
    await expect(page.getByRole('heading', { name: todoTitle })).toBeVisible();

    // Assign Regular User to this todo
    await page.getByRole('button', { name: 'Assign User' }).click();
    await page.getByPlaceholder('Search users...').fill('Regular');
    await page.getByText('Regular User').click();

    // Verify user is assigned
    await expect(page.getByText('Regular User')).toBeVisible();
    await expect(page.getByText('user@example.com')).toBeVisible();

    // Now login as Regular User in a new context (without storage state)
    const userContext = await browser.newContext({
      baseURL: 'http://localhost:5173',
      storageState: undefined, // Explicitly clear storage state
    });
    const userPage = await userContext.newPage();

    // Login as Regular User
    await userPage.goto('http://localhost:5173/login');

    // Wait for email input to be visible
    const emailInput = userPage.locator('#email');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    // Clear default values and fill with regular user credentials
    await emailInput.clear();
    await emailInput.fill('user@example.com');
    const passwordInput = userPage.locator('#password');
    await passwordInput.clear();
    await passwordInput.fill('user');
    await userPage.getByRole('button', { name: 'Sign in' }).click();
    await userPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Go to My Todos
    await userPage.goto('/my-todos');

    // Should see the assigned todo
    await expect(userPage.getByRole('link', { name: todoTitle })).toBeVisible();

    await userContext.close();
  });
});
