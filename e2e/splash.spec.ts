import { expect, test } from "@playwright/test";

test.describe("Splash Screen", () => {
  test("shows splash video on initial load", async ({ page }) => {
    await page.goto("/");

    // Splash screen should be visible
    const splash = page.locator(".fixed.inset-0.z-50");
    await expect(splash).toBeVisible();

    // Should contain a video element
    const video = page.locator("video");
    await expect(video).toBeVisible();
  });

  test("shows skip hint text", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Tap to skip")).toBeVisible();
  });

  test("can skip splash by clicking", async ({ page }) => {
    await page.goto("/");

    // Click to skip
    await page.locator(".fixed.inset-0.z-50").click();

    // Wait for fade transition
    await page.waitForTimeout(800);

    // Splash should be gone, game screen should be visible
    await expect(page.locator(".fixed.inset-0.z-50")).not.toBeVisible();
  });

  test("has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Farm Follies");
  });
});
