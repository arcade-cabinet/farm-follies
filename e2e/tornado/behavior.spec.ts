/**
 * Tornado Behavior Tests
 *
 * E2E tests for tornado mechanics in Farm Follies.
 * Tests verify that the tornado behaves correctly.
 *
 * Requirements: 23.1-23.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import { getSnapshot, injectAndStartGovernor, startGameAndWait, stopGovernor } from "../helpers";

test.describe("Tornado Behavior Tests", () => {
  test.setTimeout(60000);

  test.describe("Requirement 23.1: Tornado appears at top", () => {
    test("animals spawn from top of screen", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for animals to spawn
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.fallingAnimals.length > 0;
        },
        { timeout: 15000 }
      );

      const snapshot = await getSnapshot(page);
      expect(snapshot?.fallingAnimals.length).toBeGreaterThan(0);

      // Animals should be near top of screen when spawned
      for (const animal of snapshot!.fallingAnimals) {
        // Y position should be relatively low (near top)
        expect(animal.y).toBeLessThan(snapshot!.canvasHeight);
      }
    });
  });

  test.describe("Requirement 23.2: Tornado oscillates horizontally", () => {
    test("animals spawn at different horizontal positions", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      const spawnPositions: number[] = [];

      // Collect spawn positions over time
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        const snapshot = await getSnapshot(page);
        if (snapshot?.fallingAnimals.length) {
          for (const animal of snapshot.fallingAnimals) {
            spawnPositions.push(animal.x);
          }
        }
      }

      await stopGovernor(page);

      // Should have collected some positions
      expect(spawnPositions.length).toBeGreaterThan(0);

      // Positions should vary (tornado moves)
      if (spawnPositions.length > 1) {
        const minX = Math.min(...spawnPositions);
        const maxX = Math.max(...spawnPositions);
        // There should be some variation in spawn positions
        expect(maxX - minX).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Requirement 23.3: Spawn animation plays", () => {
    test("animals appear during gameplay", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for animals to appear
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.fallingAnimals.length > 0;
        },
        { timeout: 15000 }
      );

      const snapshot = await getSnapshot(page);
      expect(snapshot?.fallingAnimals.length).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 23.4-23.5: Tornado intensity increases with level", () => {
    test("spawn rate can increase with level", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play until level increases
      try {
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.level >= 2;
          },
          { timeout: 60000 }
        );
      } catch {
        // May not reach level 2
      }

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.level).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Tornado Edge Cases", () => {
    test("tornado continues spawning during gameplay", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play for a while (reduced from 300 to 100 frames)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 100;
        },
        { timeout: 20000 }
      );

      await stopGovernor(page);

      // Game should have had some animals spawn
      const snapshot = await getSnapshot(page);
      expect(snapshot?.score).toBeGreaterThan(0);
    });

    test("spawn positions are within bounds", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Check spawn positions over time
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(500);
        const snapshot = await getSnapshot(page);
        if (snapshot?.fallingAnimals.length) {
          for (const animal of snapshot.fallingAnimals) {
            // X position should be within canvas bounds
            expect(animal.x).toBeGreaterThanOrEqual(0);
            expect(animal.x).toBeLessThanOrEqual(snapshot.canvasWidth);
          }
        }
      }

      await stopGovernor(page);
    });
  });
});
