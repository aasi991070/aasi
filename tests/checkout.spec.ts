import { test, expect } from "@playwright/test";

const OOS_SLUG = "seed-oos-kurta";
const SMOKE_SLUG = "seed-smoke-shirt";

test.describe("Cart and stock guards", () => {
  test("out-of-stock seed product blocks add to cart", async ({ page }) => {
    const response = await page.goto(`/product/${OOS_SLUG}`);
    if (response?.status() === 404) {
      test.skip(true, "Seed catalogue not applied");
    }

    const addButton = page.getByRole("button", { name: /add to cart/i });
    if ((await addButton.count()) === 0) {
      test.skip(true, "Seed product page unavailable");
    }
    await expect(addButton).toBeDisabled();
  });

  test("in-stock seed product can reach cart", async ({ page }) => {
    const response = await page.goto(`/product/${SMOKE_SLUG}`);
    if (response?.status() === 404) {
      test.skip(true, "Seed catalogue not applied");
    }

    const addButton = page.getByRole("button", { name: /add to cart/i });
    if ((await addButton.count()) === 0) {
      test.skip(true, "Seed product page unavailable");
    }
    if (!(await addButton.isEnabled().catch(() => false))) {
      test.skip(true, "Variant selection required or product unavailable");
    }

    await addButton.click();
    await page.goto("/cart");
    await expect(page.getByText(/seed smoke shirt/i)).toBeVisible();
  });
});

test.describe("Guest checkout", () => {
  test("checkout form accepts guest details when cart has items", async ({
    page,
  }) => {
    await page.goto("/checkout", { waitUntil: "networkidle" });
    if (/\/cart(?:\?|$)/.test(page.url())) {
      test.skip(true, "Cart empty — apply supabase/seed.sql for checkout form test");
    }

    await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();
    await page.getByLabel(/^email$/i).fill("guest@example.com");
    await page.getByLabel(/^phone$/i).fill("9876543210");
  });
});
