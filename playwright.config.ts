import { defineConfig, devices } from "@playwright/test";

const E2E_PORT = process.env.E2E_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Runs against a production build (`next start`), not `next dev`.
 * Uses port 3100 by default so a dev server on :3000 is never reused.
 * Apply `supabase/seed.sql` first for commerce journey specs.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.CI
      ? `npm run build && npx next start -p ${E2E_PORT}`
      : `npx next start -p ${E2E_PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
