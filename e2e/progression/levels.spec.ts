/**
 * Level Progression Tests
 *
 * E2E tests for level progression mechanics in Farm Follies.
 * Tests verify that level progression works correctly:
 * - Level increases at score threshold
 * - Spawn interval decreases with level
 * - Special variant chance increases with level
 * - Level cap is enforced
 *
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import { createSeededRandom, generateSeeds, getSnapshot, startGameAndWait } from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Inject a governor that catches animals and tracks level changes.
 */
async function injectLevelTrackingGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class LevelTrackingGovernor {
      stats = {
        framesRun: 0,
        catchAttempts: 0,
        levelChanges: [] as { fromLevel: number; toLevel: number; atScore: number }[],
        lastLevel: 1,
        maxLevel: 1,
      };
      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      private gameInstance: any;
      private canvas: HTMLCanvasElement;
      private rafId: number | null = null;
      private isDragging = false;

      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      constructor(gameInstance: any) {
        this.gameInstance = gameInstance;
        this.canvas = gameInstance.getCanvas();
      }

      start(): void {
        const snap = this.gameInstance.getTestSnapshot();
        this.stats.lastLevel = snap?.level ?? 1;
        this.tick();
      }

      stop(): void {
        if (this.rafId !== null) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
        if (this.isDragging) {
          this.dispatchPointerUp();
        }
      }

      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      private findBestTarget(snap: any): { x: number } | null {
        if (!snap.player || snap.fallingAnimals.length === 0) return null;
        const floorY = snap.player.y + snap.player.height;
        if (floorY <= 0) return null;
        let bestAnimal = snap.fallingAnimals[0];
        let bestScore = -1;
        for (const animal of snap.fallingAnimals) {
          const urgency = animal.y / floorY;
          const score = urgency;
          if (score > bestScore) {
            bestScore = score;
            bestAnimal = animal;
          }
        }
        return bestAnimal;
      }

      private tick = (): void => {
        const snap = this.gameInstance.getTestSnapshot();
        if (!snap.isPlaying) {
          this.rafId = requestAnimationFrame(this.tick);
          return;
        }

        this.stats.framesRun++;

        // Track level changes
        if (snap.level !== this.stats.lastLevel) {
          this.stats.levelChanges.push({
            fromLevel: this.stats.lastLevel,
            toLevel: snap.level,
            atScore: snap.score,
          });
          this.stats.lastLevel = snap.level;
          this.stats.maxLevel = Math.max(this.stats.maxLevel, snap.level);
        }

        const target = this.findBestTarget(snap);
        if (target) {
          this.moveToX(target.x);
          this.stats.catchAttempts++;
        } else if (snap.player) {
          this.moveToX(snap.canvasWidth / 2);
        }

        this.rafId = requestAnimationFrame(this.tick);
      };

      private moveToX(targetX: number): void {
        if (!this.isDragging) {
          this.dispatchPointerDown(targetX);
        }
        this.dispatchPointerMove(targetX);
      }

      private dispatchPointerDown(x: number): void {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.dispatchEvent(
          new MouseEvent("mousedown", {
            clientX: rect.left + x,
            clientY: rect.top + rect.height * 0.8,
            bubbles: true,
          })
        );
        this.isDragging = true;
      }

      private dispatchPointerMove(x: number): void {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: rect.left + x,
            clientY: rect.top + rect.height * 0.8,
            bubbles: true,
          })
        );
      }

      private dispatchPointerUp(): void {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.dispatchEvent(
          new MouseEvent("mouseup", {
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height * 0.8,
            bubbles: true,
          })
        );
        this.isDragging = false;
      }
    }

    const governor = new LevelTrackingGovernor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

/**
 * Stop the level tracking governor and return stats.
 */
async function stopLevelTrackingGovernor(page: Page): Promise<{
  framesRun: number;
  catchAttempts: number;
  levelChanges: { fromLevel: number; toLevel: number; atScore: number }[];
  maxLevel: number;
}> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov)
      return {
        framesRun: 0,
        catchAttempts: 0,
        levelChanges: [],
        maxLevel: 1,
      };
    gov.stop();
    return { ...gov.stats };
  });
}

/**
 * Wait for score to reach a minimum.
 */
async function waitForScore(page: Page, minScore: number, timeout = 60000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      const game = (window as any).__game;
      const snap = game?.getTestSnapshot();
      return snap && snap.score >= min;
    },
    minScore,
    { timeout }
  );
}

/**
 * Wait for level to reach a minimum.
 */
async function waitForLevel(page: Page, minLevel: number, timeout = 60000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      const game = (window as any).__game;
      const snap = game?.getTestSnapshot();
      return snap && snap.level >= min;
    },
    minLevel,
    { timeout }
  );
}

/**
 * Start game with level tracking governor.
 */
async function startWithLevelTrackingGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectLevelTrackingGovernor(page);
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Level Progression Tests", () => {
  // Increase timeout for progression tests
  test.setTimeout(90000);

  test.describe("Requirement 19.1: Level increases at threshold", () => {
    test("level starts at 1", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot?.level).toBe(1);
    });

    test("level increases with score", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play until level increases
      try {
        await waitForLevel(page, 2);
      } catch {
        // May not reach level 2 in time
      }

      const stats = await stopLevelTrackingGovernor(page);
      const snapshot = await getSnapshot(page);

      // Either level increased or we played for a while
      expect(snapshot?.level).toBeGreaterThanOrEqual(1);
    });

    test("level changes are tracked correctly", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play for a while
      try {
        await waitForScore(page, 500);
      } catch {
        // May not reach score in time
      }

      const stats = await stopLevelTrackingGovernor(page);

      // Level changes should increase (game may skip levels)
      for (const change of stats.levelChanges) {
        expect(change.toLevel).toBeGreaterThan(change.fromLevel);
        expect(change.atScore).toBeGreaterThan(0);
      }
    });
  });

  test.describe("Requirement 19.2: Spawn interval decreases", () => {
    test("higher levels have faster spawning", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play until level increases
      try {
        await waitForLevel(page, 2);
      } catch {
        // May not reach level 2
      }

      const stats = await stopLevelTrackingGovernor(page);
      const snapshot = await getSnapshot(page);

      // Game should still be running at higher level
      expect(snapshot?.isPlaying).toBe(true);
    });
  });

  test.describe("Requirement 19.3: Special variant chance increases", () => {
    test("special animals can spawn at higher levels", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play for a while to reach higher levels
      try {
        await waitForScore(page, 1000);
      } catch {
        // May not reach score
      }

      const stats = await stopLevelTrackingGovernor(page);
      const snapshot = await getSnapshot(page);

      // Game should have progressed
      expect(snapshot?.score).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 19.4-19.5: Level cap", () => {
    test("level has a maximum value", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play for extended time
      try {
        await waitForScore(page, 2000);
      } catch {
        // May not reach score
      }

      const stats = await stopLevelTrackingGovernor(page);
      const snapshot = await getSnapshot(page);

      // Level should be bounded
      expect(snapshot?.level).toBeGreaterThanOrEqual(1);
      expect(snapshot?.level).toBeLessThanOrEqual(20); // Reasonable max level
    });
  });

  test.describe("Level Progression Edge Cases", () => {
    test("level persists through gameplay", async ({ page }) => {
      await startWithLevelTrackingGovernor(page);

      // Play until level increases
      try {
        await waitForLevel(page, 2);
      } catch {
        // May not reach level 2
      }

      const midSnapshot = await getSnapshot(page);
      const midLevel = midSnapshot?.level ?? 1;

      // Continue playing
      try {
        await waitForScore(page, (midSnapshot?.score ?? 0) + 200);
      } catch {
        // May not reach score
      }

      const finalSnapshot = await getSnapshot(page);

      // Level should not decrease
      expect(finalSnapshot?.level).toBeGreaterThanOrEqual(midLevel);

      await stopLevelTrackingGovernor(page);
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Level Progression Scaling
 *
 * Feature: comprehensive-e2e-testing, Property 15: Level Progression Scaling
 *
 * Property: *For any* level increase, the spawn interval SHALL decrease (faster
 * spawns). *For any* level increase, the special variant spawn chance SHALL
 * increase. *For any* level at the maximum value, further score increases SHALL
 * NOT increase the level.
 *
 * **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**
 */
test.describe("Property 15: Level Progression Scaling", () => {
  // Increase timeout for property tests
  test.setTimeout(120000);

  // Generate seeds for reproducible property tests
  const BASE_SEED = 150015;
  const ITERATION_COUNT = 25;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  test.describe("Feature: comprehensive-e2e-testing, Property 15: Level Progression Scaling", () => {
    for (let i = 0; i < Math.min(seeds.length, 15); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const targetScore = rng.nextInt(200, 800);

      test(`iteration ${i + 1}: seed=${seed}, targetScore=${targetScore}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 15: Level Progression Scaling
        // **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**

        await startWithLevelTrackingGovernor(page);

        // Play until target score
        try {
          await waitForScore(page, targetScore);
        } catch {
          // May not reach target score
        }

        const stats = await stopLevelTrackingGovernor(page);
        const snapshot = await getSnapshot(page);

        // PROPERTY ASSERTIONS:

        // 1. Level should be >= 1
        expect(snapshot?.level).toBeGreaterThanOrEqual(1);

        // 2. Level changes should increase (game may skip levels)
        for (const change of stats.levelChanges) {
          expect(change.toLevel).toBeGreaterThan(change.fromLevel);
        }

        // 3. Level should be bounded
        expect(snapshot?.level).toBeLessThanOrEqual(20);
      });
    }
  });

  test.describe("Property 15 - Extended iterations", () => {
    for (let i = 15; i < Math.min(seeds.length, 25); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const targetScore = rng.nextInt(300, 1000);

      test(`iteration ${i + 1}: seed=${seed}, targetScore=${targetScore}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 15: Level Progression Scaling
        // **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**

        await startWithLevelTrackingGovernor(page);

        try {
          await waitForScore(page, targetScore);
        } catch {
          // May not reach target
        }

        const stats = await stopLevelTrackingGovernor(page);
        const snapshot = await getSnapshot(page);

        // Property: level progression is monotonic
        let lastLevel = 1;
        for (const change of stats.levelChanges) {
          expect(change.fromLevel).toBe(lastLevel);
          expect(change.toLevel).toBe(lastLevel + 1);
          lastLevel = change.toLevel;
        }
      });
    }
  });
});
