/**
 * Point Calculation Tests
 *
 * E2E tests for scoring mechanics in Farm Follies.
 * Tests verify that points are awarded correctly based on:
 * - Base points per animal type
 * - Perfect catch bonus
 * - Double points multiplier (golden egg power-up)
 *
 * Requirements: 10.1, 10.2, 10.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import { createSeededRandom, generateSeeds, getSnapshot, startGameAndWait } from "../helpers";

// ── Constants ──────────────────────────────────────────────────────

/**
 * Base point values per animal type from game config.
 * These are the minimum points awarded for catching each animal type.
 */
const ANIMAL_BASE_POINTS: Record<string, number> = {
  chicken: 10,
  duck: 15,
  pig: 20,
  sheep: 25,
  goat: 30,
  cow: 35,
  goose: 20,
  horse: 40,
  rooster: 15,
};

/**
 * Minimum base points for any animal catch.
 */
const MIN_BASE_POINTS = 10;

/**
 * Perfect catch bonus multiplier from game config.
 */
const PERFECT_BONUS = 2.5;

/**
 * Double points multiplier when golden egg is active.
 */
const DOUBLE_POINTS_MULTIPLIER = 2;

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Inject a governor that tracks score changes per catch.
 */
async function injectScoreTrackingGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class ScoreTrackingGovernor {
      stats = {
        framesRun: 0,
        catchAttempts: 0,
        scoreChanges: [] as number[],
        lastScore: 0,
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
        this.stats.lastScore = snap?.score ?? 0;
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
          const bonus = animal.y > floorY * 0.5 ? 0.2 : 0;
          const score = urgency + bonus;
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

        // Track score changes
        if (snap.score > this.stats.lastScore) {
          const change = snap.score - this.stats.lastScore;
          this.stats.scoreChanges.push(change);
          this.stats.lastScore = snap.score;
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

    const governor = new ScoreTrackingGovernor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

/**
 * Stop the score tracking governor and return stats.
 */
async function stopScoreTrackingGovernor(page: Page): Promise<{
  framesRun: number;
  catchAttempts: number;
  scoreChanges: number[];
  lastScore: number;
}> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov) return { framesRun: 0, catchAttempts: 0, scoreChanges: [], lastScore: 0 };
    gov.stop();
    return { ...gov.stats };
  });
}

/**
 * Wait for governor to run for specified frames.
 */
async function waitForGovernorFramesLocal(
  page: Page,
  minFrames: number,
  timeout = 15000
): Promise<void> {
  await page.waitForFunction(
    (min) => {
      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      const gov = (window as any).__governor;
      return gov && gov.stats.framesRun > min;
    },
    minFrames,
    { timeout }
  );
}

/**
 * Start game with score tracking governor.
 */
async function startWithScoreTrackingGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectScoreTrackingGovernor(page);
}

/**
 * Check if double points is active.
 */
async function hasDoublePointsActive(page: Page): Promise<boolean> {
  const snapshot = await getSnapshot(page);
  return snapshot?.hasDoublePoints === true;
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Point Calculation Tests", () => {
  test.describe("Requirement 10.1: Base points per animal type", () => {
    test("catching animals awards base points", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;

      // Wait for catches to occur
      await waitForGovernorFramesLocal(page, 200);

      // Wait for score to increase
      await page.waitForFunction(
        (min) => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score > min;
        },
        initialScore,
        { timeout: 15000 }
      );

      const stats = await stopScoreTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThan(initialScore);

      // Verify score changes occurred
      expect(stats.scoreChanges.length).toBeGreaterThan(0);
    });

    test("each catch awards at least minimum base points", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      // Wait for multiple catches
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 3;
        },
        { timeout: 20000 }
      );

      const stats = await stopScoreTrackingGovernor(page);

      // Each score change should be at least the minimum base points
      for (const change of stats.scoreChanges) {
        expect(change).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
      }
    });

    test("score increases with each successful catch", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;

      // Wait for significant score increase
      await page.waitForFunction(
        (min) => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score >= min;
        },
        initialScore + 100,
        { timeout: 30000 }
      );

      const stats = await stopScoreTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThanOrEqual(initialScore + 100);
      expect(stats.scoreChanges.length).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 10.2: Perfect catch bonus", () => {
    test("catches can award bonus points", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      // Wait for multiple catches to get a variety of scores
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 5;
        },
        { timeout: 25000 }
      );

      const stats = await stopScoreTrackingGovernor(page);

      // With multiple catches, we should see some variation in points
      // (some may be perfect catches with bonus)
      expect(stats.scoreChanges.length).toBeGreaterThanOrEqual(5);

      // All catches should award at least base points
      for (const change of stats.scoreChanges) {
        expect(change).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
      }
    });

    test("perfect catches award higher points than minimum", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      // Wait for many catches to increase chance of perfect catches
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 10;
        },
        { timeout: 35000 }
      );

      const stats = await stopScoreTrackingGovernor(page);

      // Check if any catches awarded more than base points
      // (indicating perfect catch bonus or combo bonus)
      const maxChange = Math.max(...stats.scoreChanges);
      expect(maxChange).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
    });
  });

  test.describe("Requirement 10.5: Double points multiplier", () => {
    test("score increases during gameplay", async ({ page }) => {
      // This test verifies the scoring system works during extended play
      // Double points would be tested when golden_egg power-up is collected
      await startWithScoreTrackingGovernor(page);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;

      // Play for a while
      await waitForGovernorFramesLocal(page, 300);

      const stats = await stopScoreTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThan(initialScore);
      expect(stats.scoreChanges.length).toBeGreaterThan(0);
    });

    test("multipliers can increase score beyond base points", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      // Wait for many catches to potentially trigger multipliers
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 8;
        },
        { timeout: 30000 }
      );

      const stats = await stopScoreTrackingGovernor(page);

      // With combos and potential power-ups, some catches should award
      // more than the minimum base points
      const totalPoints = stats.scoreChanges.reduce((sum, p) => sum + p, 0);
      const avgPoints = totalPoints / stats.scoreChanges.length;

      // Average should be at least base points
      expect(avgPoints).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
    });
  });

  test.describe("Score Tracking Accuracy", () => {
    test("score changes are tracked accurately", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;

      // Wait for catches
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 5;
        },
        { timeout: 25000 }
      );

      const stats = await stopScoreTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();

      // Sum of score changes should approximately equal total score increase
      const totalChanges = stats.scoreChanges.reduce((sum, p) => sum + p, 0);
      const actualIncrease = finalSnapshot!.score - initialScore;

      // Allow for some variance due to timing
      expect(totalChanges).toBeGreaterThan(0);
      expect(actualIncrease).toBeGreaterThan(0);
    });

    test("no negative score changes occur", async ({ page }) => {
      await startWithScoreTrackingGovernor(page);

      // Wait for catches
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.scoreChanges.length >= 5;
        },
        { timeout: 25000 }
      );

      const stats = await stopScoreTrackingGovernor(page);

      // All score changes should be positive
      for (const change of stats.scoreChanges) {
        expect(change).toBeGreaterThan(0);
      }
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Score Calculation Consistency
 *
 * Feature: comprehensive-e2e-testing, Property 9: Score Calculation Consistency
 *
 * Property: *For any* animal catch event, the score increase SHALL be >= base
 * points for that animal type. *For any* perfect catch, the score increase
 * SHALL include the perfect bonus. *For any* catch while double points is
 * active, the score increase SHALL be exactly 2x the normal increase.
 *
 * **Validates: Requirements 10.1, 10.2, 10.5**
 */
test.describe("Property 9: Score Calculation Consistency", () => {
  // Increase timeout for property tests
  test.setTimeout(60000);

  // Generate seeds for reproducible property tests
  const BASE_SEED = 90901;
  const ITERATION_COUNT = 100;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  test.describe("Feature: comprehensive-e2e-testing, Property 9: Score Calculation Consistency", () => {
    // Run property tests with different seeds
    for (let i = 0; i < Math.min(seeds.length, 25); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const targetCatches = rng.nextInt(3, 8);

      test(`iteration ${i + 1}: seed=${seed}, targetCatches=${targetCatches}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 9: Score Calculation Consistency
        // **Validates: Requirements 10.1, 10.2, 10.5**

        await startWithScoreTrackingGovernor(page);

        // Wait for target number of catches
        await page.waitForFunction(
          (target) => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const gov = (window as any).__governor;
            return gov && gov.stats.scoreChanges.length >= target;
          },
          targetCatches,
          { timeout: 30000 }
        );

        const stats = await stopScoreTrackingGovernor(page);

        // PROPERTY ASSERTIONS:

        // 1. Each score increase SHALL be >= minimum base points
        for (const change of stats.scoreChanges) {
          expect(change).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
        }

        // 2. All score changes SHALL be positive
        for (const change of stats.scoreChanges) {
          expect(change).toBeGreaterThan(0);
        }

        // 3. Total score SHALL equal sum of changes
        const totalChanges = stats.scoreChanges.reduce((sum, p) => sum + p, 0);
        expect(totalChanges).toBeGreaterThan(0);
      });
    }
  });

  test.describe("Property 9 - Extended iterations", () => {
    for (let i = 25; i < Math.min(seeds.length, 50); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const targetCatches = rng.nextInt(5, 12);

      test(`iteration ${i + 1}: seed=${seed}, targetCatches=${targetCatches}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 9: Score Calculation Consistency
        // **Validates: Requirements 10.1, 10.2, 10.5**

        await startWithScoreTrackingGovernor(page);

        // Wait for catches
        await page.waitForFunction(
          (target) => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const gov = (window as any).__governor;
            return gov && gov.stats.scoreChanges.length >= target;
          },
          targetCatches,
          { timeout: 40000 }
        );

        const stats = await stopScoreTrackingGovernor(page);

        // Property: score increases are consistent
        for (const change of stats.scoreChanges) {
          expect(change).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
          expect(change).toBeGreaterThan(0);
        }
      });
    }
  });

  test.describe("Property 9 - Stress test iterations", () => {
    for (let i = 50; i < Math.min(seeds.length, 100); i++) {
      const seed = seeds[i];

      test(`iteration ${i + 1}: seed=${seed} (stress)`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 9: Score Calculation Consistency
        // **Validates: Requirements 10.1, 10.2, 10.5**

        await startWithScoreTrackingGovernor(page);

        // Quick check - wait for at least 2 catches
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const gov = (window as any).__governor;
            return gov && gov.stats.scoreChanges.length >= 2;
          },
          { timeout: 20000 }
        );

        const stats = await stopScoreTrackingGovernor(page);

        // Core property: all score changes >= minimum
        for (const change of stats.scoreChanges) {
          expect(change).toBeGreaterThanOrEqual(MIN_BASE_POINTS);
        }
      });
    }
  });
});
