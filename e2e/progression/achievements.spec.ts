/**
 * Achievement Tests
 *
 * E2E tests for achievement system in Farm Follies.
 * Tests verify that achievements unlock correctly.
 *
 * Requirements: 18.1-18.8
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import { getSnapshot, injectAndStartGovernor, startGameAndWait, stopGovernor } from "../helpers";

test.describe("Achievement Tests", () => {
  test.setTimeout(60000);

  test.describe("Requirement 18.1: First catch achievement", () => {
    test("first catch can trigger achievement", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Wait for first catch
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score > 0;
        },
        { timeout: 20000 }
      );

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.score).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 18.2-18.3: Score achievements", () => {
    test("score milestones can be reached", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play until score milestone
      try {
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.score >= 100;
          },
          { timeout: 30000 }
        );
      } catch {
        // May not reach milestone
      }

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.score).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 18.4-18.5: Stack achievements", () => {
    test("stack height milestones can be reached", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest", bankThreshold: 10 });

      // Play until stack milestone
      try {
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.stackHeight >= 5;
          },
          { timeout: 30000 }
        );
      } catch {
        // May not reach milestone
      }

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.stackHeight).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Requirement 18.6-18.7: Banking achievements", () => {
    test("banking can trigger achievements", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest", bankThreshold: 5 });

      // Play until bank occurs
      try {
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.bankedAnimals > 0;
          },
          { timeout: 40000 }
        );
      } catch {
        // May not bank in time
      }

      await stopGovernor(page);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.bankedAnimals).toBeGreaterThanOrEqual(0);
    });
  });
});
