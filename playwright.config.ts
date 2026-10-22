import { defineConfig } from "@playwright/test";
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["html", { open: "never" }]],
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests/e2e",
  use: { trace: "on-first-retry" },
  workers: 1,
  timeout: 45000,
});
