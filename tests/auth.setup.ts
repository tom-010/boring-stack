import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect away from login (home redirects to /projects or /dashboard)
  await page.waitForURL((url) => !url.pathname.includes("/login"));

  await page.context().storageState({ path: authFile });
});
