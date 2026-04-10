import { defineConfig, devices } from "@playwright/test";

// Determine if running in CI environment
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./e2e",

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: isCI,

  // Retry on CI only
  retries: isCI ? 2 : 0,

  // Limit workers on CI for stability
  workers: isCI ? 1 : undefined,

  // Reporter configuration
  reporter: isCI ? "github" : "html",

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: "Chrome Stable",
      use: {
        browserName: "chromium",
        channel: "chrome",
        headless: true, // Safe with GPU flags below
        launchOptions: {
          slowMo: isCI ? 0 : 50,
          args: [
            "--no-sandbox",
            "--use-angle=gl", // GPU-accelerated WebGL in headless
            "--enable-webgl",
            "--ignore-gpu-blocklist",
            "--mute-audio",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
          ],
        },
        ...devices["Desktop Chrome"],
      },
    },
  ],

  use: {
    // Base URL for navigation
    baseURL: "http://localhost:5173",

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Collect trace on first retry
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video recording
    video: isCI ? "on-first-retry" : "off",
  },

  // Configure web server
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !isCI,
    timeout: 120000,
  },

  // Output directory for test artifacts
  outputDir: "test-results",
});
