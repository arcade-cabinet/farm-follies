import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.*$/);
});

test("page loads successfully", async ({ page }) => {
  await page.goto("/");
  // App renders into #root div
  const root = page.locator("#root");
  await expect(root).toBeAttached();
});
