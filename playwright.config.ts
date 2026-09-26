import { defineConfig, devices } from "@playwright/test";

// End-to-end suite. `npm run test:e2e` resets the database in DATABASE_URL (it must be named
// *e2e* or *test*), then runs these specs against a production build on port 3100.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: "e2e",
  // The specs share one database, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath },
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } }, dependencies: ["setup"] },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Paddle webhooks are signed with this secret in e2e/billing.spec.ts. There is no client token,
    // so checkout stays switched off and nothing ever calls Paddle.
    env: {
      CRON_SECRET: "e2e-secret",
      PADDLE_WEBHOOK_SECRET: "e2e-paddle-secret",
      PADDLE_PRICE_TEAM: "pri_e2e_team",
      PADDLE_PRICE_BUSINESS: "pri_e2e_business",
      // Shows the Google button and lets e2e/onboarding.spec.ts check the redirect. Nothing
      // follows it, so these never reach Google.
      GOOGLE_CLIENT_ID: "e2e-google-client",
      GOOGLE_CLIENT_SECRET: "e2e-google-secret",
    },
  },
});
