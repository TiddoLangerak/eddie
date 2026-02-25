import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "line",
  timeout: 30000,
  expect: {
    timeout: 500,
  },
  use: {
    baseURL: "http://localhost:3456",
    trace: "on-first-retry",
    actionTimeout: 500,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
  webServer: {
    command:
      "mkdir -p e2e/.workspace && node --experimental-strip-types --conditions=development serve.ts --port 3456 --workspace e2e/.workspace",
    url: "http://localhost:3456",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
