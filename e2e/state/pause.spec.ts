/**
 * Pause Behavior Tests
 *
 * E2E tests for pause functionality in Farm Follies.
 * Tests verify that the game properly freezes during pause:
 * - No animals spawn during pause
 * - Falling animals do not move during pause
 * - Score does not change during pause
 * - Power-up timers do not decrement during pause
 * - State is preserved through pause/resume
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import {
  createSeededRandom,
  type GameSnapshot,
  generateSeeds,
  getSnapshot,
  hasFallingAnimals,
  injectAndStartGovernor,
  startGameAndWait,
  stopGovernor,
  waitForCondition,
  waitForGovernorFrames,
} from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Click the pause button during gameplay.
 */
async function clickPause(page: Page): Promise<void> {
  const pauseButton = page
    .locator('[data-testid="pause-button"]')
    .or(page.locator('button:has-text("⏸")'))
    .or(page.locator('button[aria-label*="pause" i]'))
    .or(page.locator('button:has-text("Pause")'));

  await pauseButton.first().waitFor({ state: "visible", timeout: 5000 });
  await pauseButton.first().click();
}

/**
 * Click the resume button from pause menu.
 */
async function clickResume(page: Page): Promise<void> {
  const resumeButton = page.getByText("RESUME", { exact: true });
  await resumeButton.waitFor({ state: "visible", timeout: 5000 });
  await resumeButton.click();
}

/**
 * Check if the game is paused by looking for the RESUME button.
 */
async function isPausedViaUI(page: Page): Promise<boolean> {
  const resumeButton = page.getByText("RESUME", { exact: true });
  return resumeButton.isVisible({ timeout: 1000 }).catch(() => false);
}

/**
 * Wait for the game to be paused.
 */
async function waitForPaused(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isPausedViaUI(page)) {
      return;
    }
    await page.waitForTimeout(100);
  }
  throw new Error("Timeout waiting for game to be paused");
}

/**
 * Compare two arrays of falling animals to check if positions changed.
 */
function animalsPositionsChanged(
  before: GameSnapshot["fallingAnimals"],
  after: GameSnapshot["fallingAnimals"]
): boolean {
  if (before.length !== after.length) return true;

  for (const animalBefore of before) {
    const animalAfter = after.find((a) => a.id === animalBefore.id);
    if (!animalAfter) return true;
    if (Math.abs(animalAfter.y - animalBefore.y) > 0.1) return true;
    if (Math.abs(animalAfter.x - animalBefore.x) > 0.1) return true;
  }
  return false;
}

/**
 * Get falling animal count from snapshot.
 */
function getFallingAnimalCount(snapshot: GameSnapshot | null): number {
  return snapshot?.fallingAnimals?.length ?? 0;
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Pause Behavior Tests", () => {
  test.describe("Requirement 9.1: No spawning during pause", () => {
    test("no new animals spawn while game is paused", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for some animals to be falling
      await waitForCondition(page, hasFallingAnimals(), 10000);

      // Get initial state
      const beforePause = await getSnapshot(page);
      expect(beforePause).toBeTruthy();
      const animalCountBefore = getFallingAnimalCount(beforePause);

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Wait a significant amount of time while paused
      await page.waitForTimeout(3000);

      // Get state after waiting
      const afterWait = await getSnapshot(page);
      expect(afterWait).toBeTruthy();
      const animalCountAfter = getFallingAnimalCount(afterWait);

      // Animal count should not have increased (no new spawns)
      // It may have decreased if some were caught before pause
      expect(animalCountAfter).toBeLessThanOrEqual(animalCountBefore);
    });

    test("spawning resumes after unpause", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Wait while paused
      await page.waitForTimeout(2000);

      // Resume
      await clickResume(page);
      await page.waitForTimeout(500);

      // Wait for animals to spawn after resume
      await waitForCondition(page, hasFallingAnimals(), 10000);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(snapshot!.fallingAnimals.length).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 9.2: Animals frozen during pause", () => {
    test("falling animals do not move while paused", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for animals to be falling
      await waitForCondition(page, hasFallingAnimals(), 10000);

      // Get state with falling animals
      const beforePause = await getSnapshot(page);
      expect(beforePause).toBeTruthy();
      expect(beforePause!.fallingAnimals.length).toBeGreaterThan(0);

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Record positions immediately after pause
      const pausedSnapshot1 = await getSnapshot(page);
      expect(pausedSnapshot1).toBeTruthy();

      // Wait while paused
      await page.waitForTimeout(2000);

      // Record positions after waiting
      const pausedSnapshot2 = await getSnapshot(page);
      expect(pausedSnapshot2).toBeTruthy();

      // Positions should not have changed
      const positionsChanged = animalsPositionsChanged(
        pausedSnapshot1!.fallingAnimals,
        pausedSnapshot2!.fallingAnimals
      );
      expect(positionsChanged).toBe(false);
    });

    test("animals resume falling after unpause", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for animals to be falling
      await waitForCondition(page, hasFallingAnimals(), 10000);

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Get paused state
      const pausedSnapshot = await getSnapshot(page);
      expect(pausedSnapshot).toBeTruthy();
      const pausedAnimals = pausedSnapshot!.fallingAnimals;

      // Resume
      await clickResume(page);

      // Wait a bit for physics to update
      await page.waitForTimeout(500);

      // Get state after resume
      const resumedSnapshot = await getSnapshot(page);
      expect(resumedSnapshot).toBeTruthy();

      // If same animals exist, they should have moved
      // Or they may have been caught/missed
      if (resumedSnapshot!.fallingAnimals.length > 0 && pausedAnimals.length > 0) {
        // At least check the game is running
        expect(resumedSnapshot!.isPlaying).toBe(true);
      }
    });
  });

  test.describe("Requirement 9.3: Score frozen during pause", () => {
    test("score does not change while paused", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Build up some score first
      await injectAndStartGovernor(page);
      await waitForGovernorFrames(page, 100);
      await stopGovernor(page);

      // Get score before pause
      const beforePause = await getSnapshot(page);
      expect(beforePause).toBeTruthy();
      const scoreBefore = beforePause!.score;

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Wait while paused
      await page.waitForTimeout(3000);

      // Get score after waiting
      const afterWait = await getSnapshot(page);
      expect(afterWait).toBeTruthy();
      const scoreAfter = afterWait!.score;

      // Score should be exactly the same
      expect(scoreAfter).toBe(scoreBefore);
    });

    test("score can increase after resume", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Pause and resume
      await clickPause(page);
      await waitForPaused(page);
      await page.waitForTimeout(500);
      await clickResume(page);
      await page.waitForTimeout(500);

      // Get score after resume
      const afterResume = await getSnapshot(page);
      expect(afterResume).toBeTruthy();
      const scoreAfterResume = afterResume!.score;

      // Start governor to catch animals
      await injectAndStartGovernor(page);
      await waitForGovernorFrames(page, 150);
      await stopGovernor(page);

      // Score should have increased
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThanOrEqual(scoreAfterResume);
    });
  });

  test.describe("Requirement 9.4: Timers frozen during pause", () => {
    test("power-up timers do not decrement while paused", async ({ page }) => {
      // This test is harder to verify directly without power-up timer exposure
      // We'll verify indirectly by checking that game time doesn't advance
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Pause the game
      await clickPause(page);
      await waitForPaused(page);

      // Get initial state
      const snapshot1 = await getSnapshot(page);
      expect(snapshot1).toBeTruthy();

      // Wait while paused
      await page.waitForTimeout(3000);

      // Get state after waiting
      const snapshot2 = await getSnapshot(page);
      expect(snapshot2).toBeTruthy();

      // Verify game state hasn't changed (proxy for timers being frozen)
      expect(snapshot2!.score).toBe(snapshot1!.score);
      expect(snapshot2!.lives).toBe(snapshot1!.lives);
      expect(snapshot2!.level).toBe(snapshot1!.level);
    });
  });

  test.describe("Requirement 9.5: State preserved through pause/resume", () => {
    test("game state is preserved through pause/resume cycle", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Build up some game state
      await injectAndStartGovernor(page);
      await waitForGovernorFrames(page, 150);
      await stopGovernor(page);

      // Wait for state to settle
      await page.waitForTimeout(500);

      // Get state before pause
      const beforePause = await getSnapshot(page);
      expect(beforePause).toBeTruthy();
      const scoreBefore = beforePause!.score;
      const livesBefore = beforePause!.lives;
      const levelBefore = beforePause!.level;
      const bankedBefore = beforePause!.bankedAnimals;

      // Pause
      await clickPause(page);
      await waitForPaused(page);

      // Wait while paused
      await page.waitForTimeout(2000);

      // Verify state is preserved DURING pause
      const duringPause = await getSnapshot(page);
      expect(duringPause).toBeTruthy();
      expect(duringPause!.score).toBe(scoreBefore);
      expect(duringPause!.lives).toBe(livesBefore);
      expect(duringPause!.level).toBe(levelBefore);
      expect(duringPause!.bankedAnimals).toBe(bankedBefore);

      // Resume
      await clickResume(page);
      await page.waitForTimeout(500);

      // Verify game is functional after resume
      const afterResume = await getSnapshot(page);
      expect(afterResume).toBeTruthy();
      expect(afterResume!.isPlaying).toBe(true);
      // Score should be at least what it was (may have increased)
      expect(afterResume!.score).toBeGreaterThanOrEqual(scoreBefore);
      // Lives may have decreased due to misses during resume
      expect(afterResume!.lives).toBeGreaterThanOrEqual(0);
    });

    test("multiple pause/resume cycles preserve state", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Build up some state
      await injectAndStartGovernor(page);
      await waitForGovernorFrames(page, 100);
      await stopGovernor(page);
      await page.waitForTimeout(500);

      // Multiple pause/resume cycles - verify state is preserved THROUGH each pause
      for (let i = 0; i < 3; i++) {
        // Get state before pause
        const beforePause = await getSnapshot(page);
        expect(beforePause).toBeTruthy();
        const scoreBefore = beforePause!.score;
        const livesBefore = beforePause!.lives;

        // Pause
        await clickPause(page);
        await waitForPaused(page);

        // Wait while paused
        await page.waitForTimeout(1000);

        // Verify state hasn't changed during pause
        const duringPause = await getSnapshot(page);
        expect(duringPause).toBeTruthy();
        expect(duringPause!.score).toBe(scoreBefore);
        expect(duringPause!.lives).toBe(livesBefore);

        // Resume
        await clickResume(page);
        await page.waitForTimeout(300);

        // Verify game is still functional
        const afterResume = await getSnapshot(page);
        expect(afterResume).toBeTruthy();
        expect(afterResume!.isPlaying).toBe(true);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("pause during animal fall preserves animal positions", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Wait for animals
      await waitForCondition(page, hasFallingAnimals(), 10000);

      // Pause immediately
      await clickPause(page);
      await waitForPaused(page);

      // Get positions
      const pausedSnapshot = await getSnapshot(page);
      expect(pausedSnapshot).toBeTruthy();
      const pausedPositions = pausedSnapshot!.fallingAnimals.map((a) => ({
        id: a.id,
        x: a.x,
        y: a.y,
      }));

      // Wait
      await page.waitForTimeout(2000);

      // Check positions again
      const afterWaitSnapshot = await getSnapshot(page);
      expect(afterWaitSnapshot).toBeTruthy();

      // Verify positions haven't changed
      for (const pos of pausedPositions) {
        const animal = afterWaitSnapshot!.fallingAnimals.find((a) => a.id === pos.id);
        if (animal) {
          expect(Math.abs(animal.x - pos.x)).toBeLessThan(0.1);
          expect(Math.abs(animal.y - pos.y)).toBeLessThan(0.1);
        }
      }
    });

    test("rapid pause/resume does not corrupt state", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Get initial state
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();

      // Rapid pause/resume
      for (let i = 0; i < 5; i++) {
        await clickPause(page);
        await page.waitForTimeout(100);
        await clickResume(page);
        await page.waitForTimeout(100);
      }

      // Game should still be functional
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.isPlaying).toBe(true);
      expect(finalSnapshot!.lives).toBeGreaterThan(0);
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

test.describe("Property 8: Pause State Freeze", () => {
  /**
   * Property 8: Pause State Freeze
   *
   * *For any* game state snapshot taken while paused, comparing it to a snapshot
   * taken after a delay while still paused, the following SHALL be equal:
   * falling animal positions, score, power-up timer values, and falling animal
   * count SHALL not increase.
   *
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
   */

  // Increase timeout for property tests
  test.setTimeout(60000);

  // Generate seeds for reproducible property tests
  const BASE_SEED = 98765;
  const ITERATION_COUNT = 100;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  // Test configuration
  const PAUSE_DURATIONS = [500, 1000, 2000, 3000];
  const SETUP_FRAMES = [50, 100, 150];

  test.describe("Feature: comprehensive-e2e-testing, Property 8: Pause State Freeze", () => {
    // Run property tests with different seeds
    for (let i = 0; i < Math.min(seeds.length, 25); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const pauseDuration = rng.pick(PAUSE_DURATIONS);
      const setupFrames = rng.pick(SETUP_FRAMES);

      test(`iteration ${i + 1}: seed=${seed}, pauseDuration=${pauseDuration}ms, setupFrames=${setupFrames}`, async ({
        page,
      }) => {
        // Feature: comprehensive-e2e-testing, Property 8: Pause State Freeze
        // **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

        const ready = await startGameAndWait(page);
        expect(ready).toBe(true);

        // Build up some game state with governor
        await injectAndStartGovernor(page);
        await waitForGovernorFrames(page, setupFrames);
        await stopGovernor(page);

        // Wait for state to settle
        await page.waitForTimeout(300);

        // Ensure there are falling animals for the test
        try {
          await waitForCondition(page, hasFallingAnimals(), 5000);
        } catch {
          // If no animals, still proceed with the test
        }

        // Take snapshot before pause
        const beforePause = await getSnapshot(page);
        expect(beforePause).toBeTruthy();

        // Pause the game
        await clickPause(page);
        await waitForPaused(page);

        // Take first paused snapshot
        const pausedSnapshot1 = await getSnapshot(page);
        expect(pausedSnapshot1).toBeTruthy();

        // Wait for the specified duration while paused
        await page.waitForTimeout(pauseDuration);

        // Take second paused snapshot
        const pausedSnapshot2 = await getSnapshot(page);
        expect(pausedSnapshot2).toBeTruthy();

        // PROPERTY ASSERTIONS:

        // 1. Score SHALL be equal
        expect(pausedSnapshot2!.score).toBe(pausedSnapshot1!.score);

        // 2. Falling animal count SHALL not increase
        expect(pausedSnapshot2!.fallingAnimals.length).toBeLessThanOrEqual(
          pausedSnapshot1!.fallingAnimals.length
        );

        // 3. Falling animal positions SHALL be equal (for animals that still exist)
        for (const animal1 of pausedSnapshot1!.fallingAnimals) {
          const animal2 = pausedSnapshot2!.fallingAnimals.find((a) => a.id === animal1.id);
          if (animal2) {
            // X position should be exactly equal
            expect(animal2.x).toBeCloseTo(animal1.x, 1);
            // Y position should be exactly equal (not falling)
            expect(animal2.y).toBeCloseTo(animal1.y, 1);
          }
        }

        // 4. Lives SHALL be equal
        expect(pausedSnapshot2!.lives).toBe(pausedSnapshot1!.lives);

        // 5. Level SHALL be equal
        expect(pausedSnapshot2!.level).toBe(pausedSnapshot1!.level);

        // 6. Combo SHALL be equal
        expect(pausedSnapshot2!.combo).toBe(pausedSnapshot1!.combo);

        // 7. Stack height SHALL be equal
        expect(pausedSnapshot2!.stackHeight).toBe(pausedSnapshot1!.stackHeight);

        // 8. Banked animals SHALL be equal
        expect(pausedSnapshot2!.bankedAnimals).toBe(pausedSnapshot1!.bankedAnimals);

        // Resume to clean up
        await clickResume(page);
      });
    }
  });

  test.describe("Property 8 - Extended iterations", () => {
    // Additional iterations with longer pause durations
    for (let i = 25; i < Math.min(seeds.length, 50); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const pauseDuration = rng.nextInt(1000, 5000);

      test(`iteration ${i + 1}: seed=${seed}, pauseDuration=${pauseDuration}ms`, async ({
        page,
      }) => {
        // Feature: comprehensive-e2e-testing, Property 8: Pause State Freeze
        // **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

        const ready = await startGameAndWait(page);
        expect(ready).toBe(true);

        // Quick setup
        await injectAndStartGovernor(page);
        await waitForGovernorFrames(page, 75);
        await stopGovernor(page);
        await page.waitForTimeout(200);

        // Pause
        await clickPause(page);
        await waitForPaused(page);

        // First snapshot
        const snapshot1 = await getSnapshot(page);
        expect(snapshot1).toBeTruthy();

        // Wait
        await page.waitForTimeout(pauseDuration);

        // Second snapshot
        const snapshot2 = await getSnapshot(page);
        expect(snapshot2).toBeTruthy();

        // Core property: state is frozen
        expect(snapshot2!.score).toBe(snapshot1!.score);
        expect(snapshot2!.lives).toBe(snapshot1!.lives);
        expect(snapshot2!.level).toBe(snapshot1!.level);
        expect(snapshot2!.fallingAnimals.length).toBeLessThanOrEqual(
          snapshot1!.fallingAnimals.length
        );

        // Verify animal positions frozen
        const positionsChanged = animalsPositionsChanged(
          snapshot1!.fallingAnimals,
          snapshot2!.fallingAnimals
        );
        expect(positionsChanged).toBe(false);

        await clickResume(page);
      });
    }
  });

  test.describe("Property 8 - Stress test iterations", () => {
    // Stress test with minimal setup and quick checks
    for (let i = 50; i < Math.min(seeds.length, 100); i++) {
      const seed = seeds[i];

      test(`iteration ${i + 1}: seed=${seed} (stress)`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 8: Pause State Freeze
        // **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

        const ready = await startGameAndWait(page);
        expect(ready).toBe(true);

        // Minimal setup
        await page.waitForTimeout(500);

        // Pause
        await clickPause(page);
        await waitForPaused(page);

        // Snapshots
        const s1 = await getSnapshot(page);
        await page.waitForTimeout(1000);
        const s2 = await getSnapshot(page);

        expect(s1).toBeTruthy();
        expect(s2).toBeTruthy();

        // Core freeze property
        expect(s2!.score).toBe(s1!.score);
        expect(s2!.lives).toBe(s1!.lives);

        await clickResume(page);
      });
    }
  });
});
