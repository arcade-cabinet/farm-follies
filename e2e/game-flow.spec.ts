import { expect, test } from "@playwright/test";

// Helper to skip the splash screen
async function skipSplash(page: import("@playwright/test").Page) {
  await page.goto("/");
  // Click splash to skip it
  const splash = page.locator(".fixed.inset-0.z-50");
  if (await splash.isVisible()) {
    await splash.click();
    await page.waitForTimeout(800);
  }
}

test.describe("Main Menu", () => {
  test.beforeEach(async ({ page }) => {
    await skipSplash(page);
  });

  test("displays main menu after splash", async ({ page }) => {
    // Canvas should be visible (game renders on canvas)
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("has sound toggle button", async ({ page }) => {
    // Sound toggle should be accessible in top right
    const soundToggle = page.locator("[class*='z-40']");
    await expect(soundToggle).toBeVisible();
  });
});

test.describe("Gameplay", () => {
  test.beforeEach(async ({ page }) => {
    await skipSplash(page);
  });

  test("page loads without console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait for full page load
    await page.waitForTimeout(2000);

    // Filter out expected/benign errors (like audio context warnings)
    const criticalErrors = errors.filter(
      (e) => !e.includes("AudioContext") && !e.includes("autoplay") && !e.includes("net::ERR")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("game canvas has correct touch-action", async ({ page }) => {
    const canvas = page.locator("canvas");
    const touchAction = await canvas.getAttribute("style");
    expect(touchAction).toContain("touch-action: none");
  });

  test("viewport meta prevents zoom", async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewport).toContain("user-scalable=no");
    expect(viewport).toContain("maximum-scale=1.0");
  });
});

test.describe("Responsive", () => {
  test("works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await skipSplash(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("works on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await skipSplash(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("works on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await skipSplash(page);

    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });
});
