/**
 * Playwright + axe accessibility suite. Wired in prompt 28a via `test:e2e`.
 * Run locally after 28a: npx playwright test tests/a11y.spec.ts
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { name: "home", path: "/" },
  { name: "category", path: "/category/mens" },
  { name: "product", path: "/product/lawn" },
  { name: "search", path: "/search?q=shirt" },
];

for (const route of routes) {
  test(`${route.name} has no serious or critical axe violations`, async ({
    page,
  }) => {
    await page.goto(route.path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter(
      (violation) =>
        violation.impact === "serious" || violation.impact === "critical"
    );

    expect(blocking, formatViolations(blocking)).toEqual([]);
  });
}

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]
) {
  return violations
    .map(
      (violation) =>
        `[${violation.impact}] ${violation.id}: ${violation.description}\n  ${violation.nodes.map((node) => node.target.join(" ")).join("\n  ")}`
    )
    .join("\n\n");
}
