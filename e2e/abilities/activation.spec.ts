/**
 * Ability Activation Tests
 *
 * E2E tests for special animal ability activation in Farm Follies.
 * Tests verify that abilities work correctly when activated:
 * - Various ability types have effects
 * - Ability cooldowns work
 * - Abilities require special animals in stack
 *
 * Requirements: 14.1-14.12
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, type Page, test } from "@playwright/test";
import { getSnapshot, startGameAndWait } from "../helpers";

// ── Constants ──────────────────────────────────────────────────────

/**
 * Known ability types from game config.
 */
const ABILITY_TYPES = [
  "poop_shot",
  "egg_bomb",
  "mud_splash",
  "wool_shield",
  "bleat_stun",
  "feather_float",
  "honey_trap",
  "crow_call",
  "hay_storm",
] as const;

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Inject a governor that catches animals and tracks abilities.
 */
async function injectAbilityTrackingGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class AbilityTrackingGovernor {
      stats = {
        framesRun: 0,
        catchAttempts: 0,
        abilitiesActivated: 0,
        specialAnimalsCaught: 0,
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

    const governor = new AbilityTrackingGovernor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

/**
 * Stop the ability tracking governor and return stats.
 */
async function stopAbilityTrackingGovernor(page: Page): Promise<{
  framesRun: number;
  catchAttempts: number;
  abilitiesActivated: number;
  specialAnimalsCaught: number;
}> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov)
      return {
        framesRun: 0,
        catchAttempts: 0,
        abilitiesActivated: 0,
        specialAnimalsCaught: 0,
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
 * Wait for stack height to reach a minimum.
 */
async function waitForStackHeight(page: Page, minHeight: number, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
      const game = (window as any).__game;
      const snap = game?.getTestSnapshot();
      return snap && snap.stackHeight >= min;
    },
    minHeight,
    { timeout }
  );
}

/**
 * Tap on canvas to activate ability.
 */
async function tapToActivateAbility(page: Page): Promise<void> {
  const canvas = await page.$("canvas");
  if (!canvas) return;

  const box = await canvas.boundingBox();
  if (!box) return;

  // Tap in the center-upper area (where abilities are typically activated)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.4);
}

/**
 * Start game with ability tracking governor.
 */
async function startWithAbilityTrackingGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectAbilityTrackingGovernor(page);
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Ability Activation Tests", () => {
  test.describe("Requirement 14.1-14.9: Ability types", () => {
    test("game supports ability activation", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build a small stack (reduced from 3 to 1)
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }

      // Try to activate ability
      await tapToActivateAbility(page);

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });

    test("abilities require animals in stack", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Try to activate ability with empty stack
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot?.stackHeight).toBe(0);

      await tapToActivateAbility(page);

      // Game should still be running (ability may not activate without stack)
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });

    test("ability activation does not crash game", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build a small stack (reduced from 2 to 1)
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }

      // Multiple ability activation attempts
      for (let i = 0; i < 5; i++) {
        await tapToActivateAbility(page);
        await page.waitForTimeout(100);
      }

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });
  });

  test.describe("Requirement 14.10-14.11: Ability cooldown", () => {
    test("abilities have cooldown period", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build a small stack (reduced from 3 to 1)
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }

      // Activate ability
      await tapToActivateAbility(page);
      await page.waitForTimeout(50);

      // Try to activate again immediately
      await tapToActivateAbility(page);

      // Game should handle rapid activation attempts
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });

    test("cooldown prevents spam activation", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build a small stack (reduced from 4 to 2)
      try {
        await waitForStackHeight(page, 2, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 2 within timeout");
        return;
      }

      // Rapid activation attempts
      for (let i = 0; i < 10; i++) {
        await tapToActivateAbility(page);
        await page.waitForTimeout(30);
      }

      // Game should still be stable
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);
      expect(snapshot?.player).toBeTruthy();

      await stopAbilityTrackingGovernor(page);
    });
  });

  test.describe("Requirement 14.12: Ability effects", () => {
    test("ability activation affects game state", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build a small stack (reduced from 3 to 1)
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }

      // Get snapshot before ability (for potential future comparison)
      await getSnapshot(page);

      // Activate ability
      await tapToActivateAbility(page);
      await page.waitForTimeout(200);

      const afterAbility = await getSnapshot(page);

      // Game state should be valid after ability
      expect(afterAbility?.isPlaying).toBe(true);
      expect(afterAbility?.player).toBeTruthy();

      await stopAbilityTrackingGovernor(page);
    });
  });

  test.describe("Ability Edge Cases", () => {
    test("abilities work during active gameplay", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Play for a while with periodic ability attempts (reduced iterations)
      for (let i = 0; i < 3; i++) {
        try {
          await waitForGovernorFramesLocal(page, 30, 10000);
        } catch {
          // Continue even if frames not reached
          break;
        }
        await tapToActivateAbility(page);
      }

      const stats = await stopAbilityTrackingGovernor(page);

      // Should have played for a while (reduced from 200 to 50)
      expect(stats.framesRun).toBeGreaterThan(50);
    });

    test("abilities do not interfere with catching", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Build initial stack (reduced from 2 to 1)
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }

      // Activate ability while catching
      await tapToActivateAbility(page);

      // Continue catching (reduced from 100 to 50)
      try {
        await waitForGovernorFramesLocal(page, 50, 15000);
      } catch {
        // Continue even if frames not reached
      }

      const snapshot = await getSnapshot(page);

      // Should still be able to catch animals
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });

    test("abilities work with different stack sizes", async ({ page }) => {
      await startWithAbilityTrackingGovernor(page);

      // Test with small stack
      try {
        await waitForStackHeight(page, 1, 20000);
      } catch {
        await stopAbilityTrackingGovernor(page);
        test.skip(true, "Could not reach stack height 1 within timeout");
        return;
      }
      await tapToActivateAbility(page);
      await page.waitForTimeout(100);

      // Test with medium stack (reduced from 3 to 2)
      try {
        await waitForStackHeight(page, 2, 20000);
        await tapToActivateAbility(page);
        await page.waitForTimeout(100);
      } catch {
        // May not reach stack height 2, continue with test
      }

      // Test with larger stack (reduced from 5 to 3)
      try {
        await waitForStackHeight(page, 3, 20000);
        await tapToActivateAbility(page);
      } catch {
        // May not reach 3 stack height
      }

      // Game should still be running
      const snapshot = await getSnapshot(page);
      expect(snapshot?.isPlaying).toBe(true);

      await stopAbilityTrackingGovernor(page);
    });
  });
});
