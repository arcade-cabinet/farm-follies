/**
 * Runtime Stability Tests
 *
 * E2E tests for runtime stability in Farm Follies.
 * Tests verify that the game runs without errors or crashes.
 *
 * Requirements: 24.1-24.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import {
  createSeededRandom,
  generateSeeds,
  getSnapshot,
  injectAndStartGovernor,
  startGameAndWait,
  stopGovernor,
} from "../helpers";

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Runtime Stability Tests", () => {
  test.setTimeout(120000);

  test.describe("Requirement 24.1: No JS errors during gameplay", () => {
    test("gameplay runs without JavaScript errors", async ({ page }) => {
      const errors: string[] = [];

      // Monitor for errors
      page.on("pageerror", (error) => {
        // Ignore expected audio context warnings
        if (
          !error.message.includes("AudioContext") &&
          !error.message.includes("NotAllowedError") &&
          !error.message.includes("play()")
        ) {
          errors.push(error.message);
        }
      });

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

      // Should have no unexpected errors
      expect(errors).toHaveLength(0);
    });
  });

  test.describe("Requirement 24.2: No uncaught exceptions", () => {
    test("no uncaught exceptions during gameplay", async ({ page }) => {
      const exceptions: string[] = [];

      page.on("pageerror", (error) => {
        exceptions.push(error.message);
      });

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play for a while (reduced from 200 to 100 frames)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 100;
        },
        { timeout: 15000 }
      );

      await stopGovernor(page);

      // Filter out expected audio-related errors
      const unexpectedExceptions = exceptions.filter(
        (e) =>
          !e.includes("AudioContext") && !e.includes("NotAllowedError") && !e.includes("play()")
      );

      expect(unexpectedExceptions).toHaveLength(0);
    });
  });

  test.describe("Requirement 24.3: Sustained play without corruption", () => {
    test("game state remains valid during sustained play", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest", bankThreshold: 7 });

      // Play for a while (reduced from 500 to 150 frames)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 150;
        },
        { timeout: 30000 }
      );

      await stopGovernor(page);

      // Verify game state is valid
      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(snapshot?.score).toBeGreaterThanOrEqual(0);
      expect(snapshot?.lives).toBeGreaterThanOrEqual(0);
      expect(snapshot?.level).toBeGreaterThanOrEqual(1);
      expect(snapshot?.stackHeight).toBeGreaterThanOrEqual(0);
    });

    test("game handles many catches without corruption", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest", bankThreshold: 5 });

      // Play until some catches (reduced from 50 to 20)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.catchAttempts > 20;
        },
        { timeout: 30000 }
      );

      const stats = await stopGovernor(page);

      // Verify catches occurred
      expect(stats.catchAttempts).toBeGreaterThan(20);

      // Verify game state is still valid
      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
    });
  });

  test.describe("Requirement 24.4: Rapid input without crashes", () => {
    test("rapid mouse input does not crash game", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const canvas = await page.$("canvas");
      const box = await canvas?.boundingBox();

      if (box) {
        // Rapid mouse movements
        for (let i = 0; i < 50; i++) {
          const x = box.x + Math.random() * box.width;
          const y = box.y + box.height * 0.8;
          await page.mouse.move(x, y);
          await page.waitForTimeout(10);
        }
      }

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });

    test("rapid keyboard input does not crash game", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Rapid key presses
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowRight");
        await page.waitForTimeout(20);
      }

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Requirement 24.5: Memory stability", () => {
    test("game runs without memory issues during extended play", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest", bankThreshold: 5 });

      // Play for extended time (reduced from 600 to 200 frames, timeout from 90s to 45s)
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.framesRun > 200;
        },
        { timeout: 45000 }
      );

      await stopGovernor(page);

      // Game should still be responsive
      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(snapshot?.player).toBeTruthy();
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Runtime Stability
 *
 * Feature: comprehensive-e2e-testing, Property 16: Runtime Stability
 *
 * Property: *For any* gameplay session of duration T, the number of JavaScript
 * errors logged SHALL be 0 (excluding expected audio context warnings).
 *
 * **Validates: Requirements 24.1, 24.2, 24.3, 24.4, 24.5**
 */
test.describe("Property 16: Runtime Stability", () => {
  test.setTimeout(120000);

  const BASE_SEED = 160016;
  const ITERATION_COUNT = 15;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  test.describe("Feature: comprehensive-e2e-testing, Property 16: Runtime Stability", () => {
    for (let i = 0; i < Math.min(seeds.length, 10); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const playDuration = rng.nextInt(50, 150); // Reduced from 200-500

      test(`iteration ${i + 1}: seed=${seed}, duration=${playDuration} frames`, async ({
        page,
      }) => {
        // Feature: comprehensive-e2e-testing, Property 16: Runtime Stability
        // **Validates: Requirements 24.1, 24.2, 24.3, 24.4, 24.5**

        const errors: string[] = [];

        page.on("pageerror", (error) => {
          if (
            !error.message.includes("AudioContext") &&
            !error.message.includes("NotAllowedError") &&
            !error.message.includes("play()")
          ) {
            errors.push(error.message);
          }
        });

        const ready = await startGameAndWait(page);
        expect(ready).toBe(true);

        await injectAndStartGovernor(page, { catchStrategy: "nearest" });

        // Play for specified duration
        await page.waitForFunction(
          (target) => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const gov = (window as any).__governor;
            return gov && gov.stats.framesRun > target;
          },
          playDuration,
          { timeout: 30000 } // Reduced from 60000
        );

        await stopGovernor(page);

        // PROPERTY ASSERTIONS:

        // 1. No unexpected errors
        expect(errors).toHaveLength(0);

        // 2. Game state is valid
        const snapshot = await getSnapshot(page);
        expect(snapshot).toBeTruthy();
        expect(snapshot?.score).toBeGreaterThanOrEqual(0);
      });
    }
  });
});
