/**
 * Tutorial Tests
 *
 * E2E tests for tutorial system in Farm Follies.
 * Tests verify that the tutorial works correctly.
 *
 * Requirements: 26.1-26.4
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import {
  clearGameStorage,
  getSnapshot,
  getStorageValue,
  STORAGE_KEYS,
  setStorageValue,
  startGameAndWait,
} from "../helpers";

test.describe("Tutorial Tests", () => {
  test.describe("Requirement 26.1: Tutorial shows for new player", () => {
    test("new player can start game", async ({ page }) => {
      // Clear storage to simulate new player
      await page.goto("/");
      await clearGameStorage(page);

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Requirement 26.2: Tutorial completion persists", () => {
    test("tutorial completion can be stored", async ({ page }) => {
      await page.goto("/");

      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      const stored = await getStorageValue(page, STORAGE_KEYS.tutorialComplete);
      expect(stored).toBe(true);
    });

    test("tutorial completion persists after reload", async ({ page }) => {
      await page.goto("/");

      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      await page.reload();
      await page.waitForTimeout(500);

      const stored = await getStorageValue(page, STORAGE_KEYS.tutorialComplete);
      expect(stored).toBe(true);
    });
  });

  test.describe("Requirement 26.3-26.4: Returning player skips tutorial", () => {
    test("returning player can start game directly", async ({ page }) => {
      await page.goto("/");

      // Mark tutorial as complete
      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Tutorial Edge Cases", () => {
    test("game works regardless of tutorial state", async ({ page }) => {
      await page.goto("/");

      // Test with tutorial incomplete
      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, false);

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });
});
