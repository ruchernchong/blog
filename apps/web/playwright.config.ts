import { defineConfig, devices } from "@playwright/test";

/**
 * Minimal Playwright config for Instant Navigations regression guards.
 * Prefer an already-running `pnpm --filter @workspace/web dev` (portless
 * `https://blog.localhost`). Override with PLAYWRIGHT_BASE_URL if needed.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://blog.localhost";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    timeout: 120_000,
  },
});
