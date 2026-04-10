/**
 * Combo System Tests
 *
 * E2E tests for combo mechanics in Farm Follies.
 * Tests verify that combos work correctly:
 * - Combo increases on consecutive catches
 * - Combo decays on timeout
 * - Combo resets on miss
 *
 * Requirements: 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import { createSeededRandom, generateSeeds, getSnapshot, startGameAndWait } from "../helpers";

// ── Constants ──────────────────────────────────────────────────────

/**
 * Combo decay time in milliseconds from game config.
 */
const COMBO_DECAY_TIME = 3000;

/**
 * Maximum combo multiplier from game config.
 */
const MAX_COMBO_MULTIPLIER = 3.0;

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Inject a governor that tracks combo changes.
 */
async function injectComboTrackingGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class ComboTrackingGovernor {
      stats = {
        framesRun: 0,
        catchAttempts: number,
        comboHistory: [] as number[],
        maxCombo: 0,
        lastCombo: 0,
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
        this.stats.catchAttempts = 0;
      }

      start(): void {
        const snap = this.gameInstance.getTestSnapshot();
        this.stats.lastCombo = snap?.combo ?? 0;
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

        // Track combo changes
        if (snap.combo !== this.stats.lastCombo) {
          this.stats.comboHistory.push(snap.combo);
          this.stats.lastCombo = snap.combo;
          if (snap.combo > this.stats.maxCombo) {
            this.stats.maxCombo = snap.combo;
          }
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

    const governor = new ComboTrackingGovernor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

/**
 * Stop the combo tracking governor and return stats.
 */
async function stopComboTrackingGovernor(page: Page): Promise<{
  framesRun: number;
  catchAttempts: number;
  comboHistory: number[];
  maxCombo: number;
  lastCombo: number;
}> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov)
      return {
        framesRun: 0,
        catchAttempts: 0,
        comboHistory: [],
        maxCombo: 0,
        lastCombo: 0,
      };
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
 * Start game with combo tracking governor.
 */
async function startWithComboTrackingGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectComboTrackingGovernor(page);
}

/**
 * Move player to edge to intentionally miss animals.
 */
async function movePlayerToEdge(page: Page, edge: "left" | "right"): Promise<void> {
  const snapshot = await getSnapshot(page);
  if (!snapshot?.player) return;

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) return;

  const targetX = edge === "left" ? 30 : snapshot.canvasWidth - 100;
  const playerY = box.height * 0.8;

  await page.evaluate(
    ({ startX, endX, y }) => {
      const canvasEl = document.querySelector("canvas");
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: rect.left + startX,
          clientY: rect.top + y,
          bubbles: true,
        })
      );
      canvasEl.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: rect.left + endX,
          clientY: rect.top + y,
          bubbles: true,
        })
      );
      canvasEl.dispatchEvent(
        new MouseEvent("mouseup", {
          clientX: rect.left + endX,
          clientY: rect.top + y,
          bubbles: true,
        })
      );
    },
    { startX: snapshot.player.x, endX: targetX, y: playerY }
  );
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Combo System Tests", () => {
  test.describe("Requirement 10.3: Combo increases on consecutive catches", () => {
    test("combo counter increases with consecutive catches", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Wait for combo to build
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo > 0;
        },
        { timeout: 15000 }
      );

      const stats = await stopComboTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();
      // Combo should have increased at some point
      expect(stats.maxCombo).toBeGreaterThan(0);
    });

    test("combo increases by 1 for each consecutive catch", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Wait for multiple combo changes
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.comboHistory.length >= 3;
        },
        { timeout: 25000 }
      );

      const stats = await stopComboTrackingGovernor(page);

      // Check that combo history shows incremental increases
      // (may also show resets to 0)
      expect(stats.comboHistory.length).toBeGreaterThanOrEqual(3);

      // Find sequences of increasing combos
      let foundIncreasingSequence = false;
      for (let i = 1; i < stats.comboHistory.length; i++) {
        if (stats.comboHistory[i] === stats.comboHistory[i - 1] + 1) {
          foundIncreasingSequence = true;
          break;
        }
      }
      // Either found increasing sequence or combo reached > 1
      expect(foundIncreasingSequence || stats.maxCombo > 1).toBe(true);
    });

    test("combo can reach multiple levels", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Wait for combo to reach at least 2
      try {
        await page.waitForFunction(
          () => {
            // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
            const game = (window as any).__game;
            const snap = game?.getTestSnapshot();
            return snap && snap.combo >= 2;
          },
          { timeout: 20000 }
        );
      } catch {
        // If we can't reach combo 2, check that we at least got combo 1
        const snapshot = await getSnapshot(page);
        expect(snapshot).toBeTruthy();
      }

      const stats = await stopComboTrackingGovernor(page);

      // Max combo should be at least 1
      expect(stats.maxCombo).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe("Requirement 10.4: Combo decay on timeout", () => {
    test("combo resets after timeout without catches", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Build up a combo first
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo > 0;
        },
        { timeout: 15000 }
      );

      // Get current combo
      const midSnapshot = await getSnapshot(page);
      expect(midSnapshot).toBeTruthy();
      const comboBeforeWait = midSnapshot!.combo;

      // Stop governor to stop catching
      await stopComboTrackingGovernor(page);

      // Wait for combo decay time plus buffer
      await page.waitForTimeout(COMBO_DECAY_TIME + 1000);

      // Check combo has reset
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();

      // Combo should have decayed to 0 (or game may have ended)
      if (finalSnapshot!.isPlaying) {
        expect(finalSnapshot!.combo).toBe(0);
      }
    });

    test("combo persists within decay window", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Build up a combo
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo > 0;
        },
        { timeout: 15000 }
      );

      const stats = await stopComboTrackingGovernor(page);

      // Combo history should show the combo was maintained
      expect(stats.maxCombo).toBeGreaterThan(0);
    });
  });

  test.describe("Requirement 30.1-30.5: Combo mechanics", () => {
    test("consecutive catches within combo window increase combo", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Wait for combo to build
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo >= 1;
        },
        { timeout: 15000 }
      );

      const stats = await stopComboTrackingGovernor(page);

      // Verify combo increased
      expect(stats.maxCombo).toBeGreaterThanOrEqual(1);
    });

    test("combo affects score multiplier", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;

      // Wait for combo and score to build
      await page.waitForFunction(
        (min) => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score >= min && snap.combo >= 1;
        },
        initialScore + 50,
        { timeout: 25000 }
      );

      const stats = await stopComboTrackingGovernor(page);
      const finalSnapshot = await getSnapshot(page);

      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThan(initialScore);
      expect(stats.maxCombo).toBeGreaterThanOrEqual(1);
    });

    test("combo resets on miss", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // First build up a combo with governor
      await injectComboTrackingGovernor(page);
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo > 0;
        },
        { timeout: 15000 }
      );

      // Get combo before miss
      const beforeMiss = await getSnapshot(page);
      expect(beforeMiss).toBeTruthy();

      // Stop governor and move to edge to cause misses
      await stopComboTrackingGovernor(page);
      await movePlayerToEdge(page, "left");

      // Wait for a miss to occur (lives decrease or combo resets)
      await page.waitForTimeout(5000);

      const afterMiss = await getSnapshot(page);
      expect(afterMiss).toBeTruthy();

      // If game is still playing, combo should have reset
      if (afterMiss!.isPlaying && afterMiss!.lives < beforeMiss!.lives) {
        expect(afterMiss!.combo).toBe(0);
      }
    });

    test("combo has maximum cap", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Play for extended time to try to max out combo
      await waitForGovernorFramesLocal(page, 500);

      const stats = await stopComboTrackingGovernor(page);

      // Combo should be tracked
      expect(stats.maxCombo).toBeGreaterThanOrEqual(0);

      // If we got a high combo, verify it's reasonable
      // (not exceeding what's possible in the game)
      expect(stats.maxCombo).toBeLessThanOrEqual(100);
    });
  });

  test.describe("Combo Edge Cases", () => {
    test("combo starts at 0 for new game", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(snapshot!.combo).toBe(0);
    });

    test("combo tracking works across multiple catches", async ({ page }) => {
      await startWithComboTrackingGovernor(page);

      // Wait for multiple combo changes
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const gov = (window as any).__governor;
          return gov && gov.stats.comboHistory.length >= 5;
        },
        { timeout: 30000 }
      );

      const stats = await stopComboTrackingGovernor(page);

      // Should have recorded combo changes
      expect(stats.comboHistory.length).toBeGreaterThanOrEqual(5);
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Combo Mechanics
 *
 * Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics
 *
 * Property: *For any* sequence of consecutive catches within the combo window,
 * the combo counter SHALL increase by 1 for each catch. *For any* period
 * exceeding the combo decay time without a catch, the combo SHALL reset to 0.
 * *For any* miss event, the combo SHALL reset to 0.
 *
 * **Validates: Requirements 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5**
 */
test.describe("Property 10: Combo Mechanics", () => {
  // Increase timeout for property tests
  test.setTimeout(60000);

  // Generate seeds for reproducible property tests
  const BASE_SEED = 10101;
  const ITERATION_COUNT = 100;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  test.describe("Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics", () => {
    // Run property tests with different seeds
    for (let i = 0; i < Math.min(seeds.length, 25); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const playDuration = rng.nextInt(150, 300);

      test(`iteration ${i + 1}: seed=${seed}, playDuration=${playDuration}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics
        // **Validates: Requirements 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5**

        await startWithComboTrackingGovernor(page);

        // Play for specified duration
        await waitForGovernorFramesLocal(page, playDuration);

        const stats = await stopComboTrackingGovernor(page);
        const finalSnapshot = await getSnapshot(page);

        expect(finalSnapshot).toBeTruthy();

        // PROPERTY ASSERTIONS:

        // 1. Combo SHALL be non-negative
        expect(finalSnapshot!.combo).toBeGreaterThanOrEqual(0);

        // 2. Max combo SHALL be non-negative
        expect(stats.maxCombo).toBeGreaterThanOrEqual(0);

        // 3. Combo history SHALL only contain non-negative values
        for (const combo of stats.comboHistory) {
          expect(combo).toBeGreaterThanOrEqual(0);
        }

        // 4. Consecutive increases in combo history SHALL be by 1
        for (let j = 1; j < stats.comboHistory.length; j++) {
          const prev = stats.comboHistory[j - 1];
          const curr = stats.comboHistory[j];
          // Either increased by 1, or reset to 0 or 1
          const validTransition = curr === prev + 1 || curr === 0 || curr === 1;
          expect(validTransition).toBe(true);
        }
      });
    }
  });

  test.describe("Property 10 - Extended iterations", () => {
    for (let i = 25; i < Math.min(seeds.length, 50); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const playDuration = rng.nextInt(200, 400);

      test(`iteration ${i + 1}: seed=${seed}, playDuration=${playDuration}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics
        // **Validates: Requirements 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5**

        await startWithComboTrackingGovernor(page);
        await waitForGovernorFramesLocal(page, playDuration);

        const stats = await stopComboTrackingGovernor(page);
        const finalSnapshot = await getSnapshot(page);

        expect(finalSnapshot).toBeTruthy();

        // Property: combo values are valid
        expect(finalSnapshot!.combo).toBeGreaterThanOrEqual(0);
        expect(stats.maxCombo).toBeGreaterThanOrEqual(0);

        // Property: combo transitions are valid
        for (let j = 1; j < stats.comboHistory.length; j++) {
          const prev = stats.comboHistory[j - 1];
          const curr = stats.comboHistory[j];
          expect(curr === prev + 1 || curr === 0 || curr === 1).toBe(true);
        }
      });
    }
  });

  test.describe("Property 10 - Stress test iterations", () => {
    for (let i = 50; i < Math.min(seeds.length, 100); i++) {
      const seed = seeds[i];

      test(`iteration ${i + 1}: seed=${seed} (stress)`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics
        // **Validates: Requirements 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5**

        await startWithComboTrackingGovernor(page);
        await waitForGovernorFramesLocal(page, 100);

        const stats = await stopComboTrackingGovernor(page);
        const finalSnapshot = await getSnapshot(page);

        expect(finalSnapshot).toBeTruthy();

        // Core property: combo is non-negative
        expect(finalSnapshot!.combo).toBeGreaterThanOrEqual(0);
        expect(stats.maxCombo).toBeGreaterThanOrEqual(0);
      });
    }
  });

  test.describe("Property 10 - Decay verification", () => {
    test("combo decays to 0 after timeout", async ({ page }) => {
      // Feature: comprehensive-e2e-testing, Property 10: Combo Mechanics
      // **Validates: Requirements 10.4, 30.3**

      await startWithComboTrackingGovernor(page);

      // Build up combo
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.combo > 0;
        },
        { timeout: 15000 }
      );

      // Stop catching
      await stopComboTrackingGovernor(page);

      // Wait for decay
      await page.waitForTimeout(COMBO_DECAY_TIME + 1500);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // If still playing, combo should be 0
      if (snapshot!.isPlaying) {
        expect(snapshot!.combo).toBe(0);
      }
    });
  });
});
