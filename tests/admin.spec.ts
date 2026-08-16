import { test, expect } from "@playwright/test";

test.describe("Admin CMS", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByText(/sign in to manage your store/i)
    ).toBeVisible();
  });

  test("unauthenticated users are redirected from dashboard", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
