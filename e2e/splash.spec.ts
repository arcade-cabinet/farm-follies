import { expect, test } from "@playwright/test";

test.describe("Splash Screen", () => {
  test("shows splash screen on initial load", async ({ page }) => {
    await page.goto("/");

    // Splash screen should be visible
    const splash = page.locator(".fixed.inset-0.z-50");
    await expect(splash).toBeVisible({ timeout: 3000 });
  });

  test("shows skip hint text", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Tap to skip")).toBeVisible({ timeout: 3000 });
  });

  test("can skip splash by clicking", async ({ page }) => {
    await page.goto("/");

    // Wait for splash to appear
    const splash = page.locator(".fixed.inset-0.z-50");
    await expect(splash).toBeVisible({ timeout: 3000 });

    // Click to skip
    await splash.click();

    // Wait for fade transition
    await page.waitForTimeout(800);

    // Splash should be gone, game screen should be visible
    await expect(splash).not.toBeVisible({ timeout: 3000 });
  });

  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Farm Follies");
  });
});
