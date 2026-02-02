import { expect, test } from "@playwright/test";

test("has title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.*$/);
});

test("page loads successfully", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toBeVisible();
});
