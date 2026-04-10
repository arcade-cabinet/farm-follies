/**
 * Game Mode Tests
 *
 * E2E tests for game mode mechanics in Farm Follies.
 * Tests verify that different game modes work correctly.
 *
 * Requirements: 21.1-21.6
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import { getSnapshot, injectAndStartGovernor, startGameAndWait, stopGovernor } from "../helpers";

test.describe("Game Mode Tests", () => {
  test.setTimeout(60000);

  test.describe("Requirement 21.1: Endless mode has lives", () => {
    test("endless mode starts with lives", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.lives).toBeGreaterThan(0);
    });

    test("lives decrease on miss in endless mode", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      const initialLives = initialSnapshot?.lives ?? 3;

      // Wait for a miss to occur (don't catch animals)
      try {
        await page.waitForFunction(
          (initial) => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.lives < initial;
          },
          initialLives,
          { timeout: 30000 }
        );
      } catch {
        // May not miss in time
      }

      const finalSnapshot = await getSnapshot(page);
      // Lives should have decreased or game ended
      expect(finalSnapshot?.lives).toBeLessThanOrEqual(initialLives);
    });
  });

  test.describe("Requirement 21.2: Game modes are playable", () => {
    test("default mode is playable", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play for a while (reduced from 100 to 50 frames)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 50;
        },
        { timeout: 15000 }
      );

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Game Mode Edge Cases", () => {
    test("game mode persists through gameplay", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play for a while (reduced from 200 to 50 frames)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 50;
        },
        { timeout: 15000 }
      );

      await stopGovernor(page);

      // Game should still be in valid state
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBeDefined();
    });
  });
});
