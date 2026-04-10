/**
 * Responsive Scaling Tests
 *
 * E2E tests for responsive scaling in Farm Follies.
 * Tests verify that the game scales correctly across viewports.
 *
 * Requirements: 20.1-20.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import { getSnapshot, startGameAndWait } from "../helpers";

test.describe("Responsive Scaling Tests", () => {
  test.describe("Requirement 20.1: Mobile viewport", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("game works on mobile viewport", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
      expect(snapshot?.canvasWidth).toBeGreaterThan(0);
      expect(snapshot?.canvasHeight).toBeGreaterThan(0);
    });

    test("canvas fits mobile viewport", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const canvas = page.locator("canvas");
      const box = await canvas.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(375);
      expect(box!.height).toBeLessThanOrEqual(812);
    });
  });

  test.describe("Requirement 20.2: Tablet viewport", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("game works on tablet viewport", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });

    test("canvas fits tablet viewport", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const canvas = page.locator("canvas");
      const box = await canvas.boundingBox();

      expect(box).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(768);
      expect(box!.height).toBeLessThanOrEqual(1024);
    });
  });

  test.describe("Requirement 20.3: Desktop viewport", () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test("game works on desktop viewport", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });

    test("canvas is visible on desktop", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const canvas = page.locator("canvas");
      await expect(canvas).toBeVisible();
    });
  });

  test.describe("Requirement 20.4-20.5: Touch action prevention", () => {
    test.use({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      isMobile: true,
    });

    test("touch events work on mobile", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const canvas = page.locator("canvas");
      const box = await canvas.boundingBox();

      if (box) {
        // Perform touch
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.8);
      }

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Viewport Edge Cases", () => {
    test("game handles viewport resize", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Start with desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(500);

      // Game should still work
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });

    test("game handles landscape orientation", async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 });

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });
});
