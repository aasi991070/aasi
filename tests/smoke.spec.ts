import { test, expect } from "@playwright/test";

test.describe("Storefront smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Aasi/i);
  });

  test("cart page loads", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
  });

  test("empty cart redirects to cart page", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole("heading", { name: /your cart/i })).toBeVisible();
  });
});
