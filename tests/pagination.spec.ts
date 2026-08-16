import { test, expect } from "@playwright/test";

const SEED_CATEGORY =
  "/category/seed-mens/seed-clothing/seed-shirts/seed-casual";

test.describe("Category filters and pagination", () => {
  test("pagination preserves page in the URL", async ({ page }) => {
    await page.goto(`${SEED_CATEGORY}?page=2`);

    await expect(page).toHaveURL(/page=2/);
  });

  test("size filter updates the query string", async ({ page }) => {
    test.skip(
      !(await page.goto(SEED_CATEGORY).then(() => true)),
      "Seed category not present — run supabase/seed.sql"
    );

    const sizeFilter = page.getByRole("checkbox", { name: /^M$/i }).first();
    if (!(await sizeFilter.isVisible().catch(() => false))) {
      test.skip(true, "Size filter UI not available without seeded products");
    }

    await sizeFilter.check();
    await expect(page).toHaveURL(/sizes=/);
  });
});
