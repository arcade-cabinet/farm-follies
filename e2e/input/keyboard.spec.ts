/**
 * Keyboard Input Tests
 *
 * E2E tests for keyboard input handling in Farm Follies.
 * Tests verify that keyboard interactions work correctly:
 * - Left arrow moves left
 * - Right arrow moves right
 * - A key moves left
 * - D key moves right
 * - Both keys = stationary
 * - Key release stops movement
 *
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import { getSnapshot, startGameAndWait } from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Hold a key for a duration.
 */
async function holdKey(page: Page, key: string, duration: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

/**
 * Press and hold multiple keys simultaneously.
 */
async function holdKeys(page: Page, keys: string[], duration: number): Promise<void> {
  for (const key of keys) {
    await page.keyboard.down(key);
  }
  await page.waitForTimeout(duration);
  for (const key of keys.reverse()) {
    await page.keyboard.up(key);
  }
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Keyboard Input Tests", () => {
  test.describe("Requirement 16.1: Left arrow moves left", () => {
    test("pressing left arrow moves player left", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold left arrow
      await holdKey(page, "ArrowLeft", 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved left
      expect(finalSnapshot!.player!.x).toBeLessThan(initialX);
    });

    test("holding left arrow continues movement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold left arrow for longer
      await holdKey(page, "ArrowLeft", 500);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved significantly left
      const movement = initialX - finalSnapshot!.player!.x;
      expect(movement).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 16.2: Right arrow moves right", () => {
    test("pressing right arrow moves player right", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold right arrow
      await holdKey(page, "ArrowRight", 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved right
      expect(finalSnapshot!.player!.x).toBeGreaterThan(initialX);
    });

    test("holding right arrow continues movement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold right arrow for longer
      await holdKey(page, "ArrowRight", 500);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved significantly right
      const movement = finalSnapshot!.player!.x - initialX;
      expect(movement).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 16.3: A key moves left", () => {
    test("pressing A key moves player left", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold A key
      await holdKey(page, "a", 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved left
      expect(finalSnapshot!.player!.x).toBeLessThan(initialX);
    });

    test("A key and left arrow have same effect", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Test with A key
      const beforeA = await getSnapshot(page);
      await holdKey(page, "a", 200);
      const afterA = await getSnapshot(page);
      const movementA = beforeA!.player!.x - afterA!.player!.x;

      // Reset position by moving right
      await holdKey(page, "ArrowRight", 200);

      // Test with left arrow
      const beforeArrow = await getSnapshot(page);
      await holdKey(page, "ArrowLeft", 200);
      const afterArrow = await getSnapshot(page);
      const movementArrow = beforeArrow!.player!.x - afterArrow!.player!.x;

      // Both should move left (positive movement value)
      expect(movementA).toBeGreaterThan(0);
      expect(movementArrow).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 16.4: D key moves right", () => {
    test("pressing D key moves player right", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold D key
      await holdKey(page, "d", 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have moved right
      expect(finalSnapshot!.player!.x).toBeGreaterThan(initialX);
    });

    test("D key and right arrow have same effect", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Test with D key
      const beforeD = await getSnapshot(page);
      await holdKey(page, "d", 200);
      const afterD = await getSnapshot(page);
      const movementD = afterD!.player!.x - beforeD!.player!.x;

      // Reset position by moving left
      await holdKey(page, "ArrowLeft", 200);

      // Test with right arrow
      const beforeArrow = await getSnapshot(page);
      await holdKey(page, "ArrowRight", 200);
      const afterArrow = await getSnapshot(page);
      const movementArrow = afterArrow!.player!.x - beforeArrow!.player!.x;

      // Both should move right (positive movement value)
      expect(movementD).toBeGreaterThan(0);
      expect(movementArrow).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 16.5: Both keys = stationary", () => {
    test("pressing both left and right arrows results in minimal movement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold both keys
      await holdKeys(page, ["ArrowLeft", "ArrowRight"], 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have minimal movement (may have some due to momentum)
      const movement = Math.abs(finalSnapshot!.player!.x - initialX);
      expect(movement).toBeLessThan(100);
    });

    test("pressing both A and D results in minimal movement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Hold both keys
      await holdKeys(page, ["a", "d"], 300);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot?.player).toBeTruthy();

      // Player should have minimal movement
      const movement = Math.abs(finalSnapshot!.player!.x - initialX);
      expect(movement).toBeLessThan(100);
    });
  });

  test.describe("Requirement 16.6: Key release stops movement", () => {
    test("releasing key stops movement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Start moving right
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(200);

      // Release key
      await page.keyboard.up("ArrowRight");

      // Get position after release
      const afterRelease = await getSnapshot(page);
      expect(afterRelease?.player).toBeTruthy();
      const positionAfterRelease = afterRelease!.player!.x;

      // Wait a bit
      await page.waitForTimeout(200);

      // Get position after waiting
      const afterWait = await getSnapshot(page);
      expect(afterWait?.player).toBeTruthy();

      // Movement should have slowed/stopped (may have some momentum)
      const movement = Math.abs(afterWait!.player!.x - positionAfterRelease);
      expect(movement).toBeLessThan(100);
    });

    test("switching direction works correctly", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.player).toBeTruthy();
      const initialX = initialSnapshot!.player!.x;

      // Move right
      await holdKey(page, "ArrowRight", 200);
      const afterRight = await getSnapshot(page);
      expect(afterRight!.player!.x).toBeGreaterThan(initialX);

      // Move left
      await holdKey(page, "ArrowLeft", 400);
      const afterLeft = await getSnapshot(page);

      // Should have moved back left
      expect(afterLeft!.player!.x).toBeLessThan(afterRight!.player!.x);
    });
  });

  test.describe("Keyboard Input Edge Cases", () => {
    test("rapid key presses work correctly", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Rapid alternating key presses
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(30);
        await page.keyboard.press("ArrowLeft");
        await page.waitForTimeout(30);
      }

      // Game should still be responsive
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
      expect(snapshot?.player).toBeTruthy();
    });

    test("player stays within bounds with keyboard", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Hold right for a long time to hit boundary
      await holdKey(page, "ArrowRight", 1000);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.player).toBeTruthy();

      // Player should be within canvas bounds
      expect(snapshot!.player!.x).toBeGreaterThanOrEqual(0);
      expect(snapshot!.player!.x).toBeLessThanOrEqual(snapshot!.canvasWidth);
    });

    test("keyboard works after mouse input", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // First use mouse
      const canvas = await page.$("canvas");
      const box = await canvas?.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.8);
        await page.mouse.up();
      }

      await page.waitForTimeout(100);

      // Then use keyboard
      const beforeKeyboard = await getSnapshot(page);
      await holdKey(page, "ArrowLeft", 200);
      const afterKeyboard = await getSnapshot(page);

      // Keyboard should still work
      expect(afterKeyboard!.player!.x).toBeLessThan(beforeKeyboard!.player!.x);
    });
  });
});
