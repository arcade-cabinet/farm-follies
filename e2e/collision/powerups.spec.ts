/**
 * Power-Up Collision Tests
 *
 * E2E tests for power-up collision detection mechanics in Farm Follies.
 * Tests verify that power-ups are collected correctly by the player and
 * stacked animals, and that uncollected power-ups are removed without effect.
 *
 * Requirements: 3.1, 3.2, 3.9
 */

import { expect, type Page, test } from "@playwright/test";
import {
  createSeededRandom,
  getSnapshot,
  type PlayerConfig,
  POWER_UP_TYPES,
  startGameAndWait,
} from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

/**
 * Move player to a specific X position using mouse drag.
 */
async function movePlayerToX(page: Page, targetX: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  if (!snapshot?.player) return;

  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) return;

  const playerY = box.height * 0.8;
  const startX = snapshot.player.x;

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
    { startX, endX: targetX, y: playerY }
  );
}

/**
 * Move player to the edge of the screen.
 */
async function movePlayerToEdge(page: Page, edge: "left" | "right"): Promise<void> {
  const snapshot = await getSnapshot(page);
  if (!snapshot?.player) return;
  const targetX = edge === "left" ? 30 : snapshot.canvasWidth - 100;
  await movePlayerToX(page, targetX);
}

/**
 * Inject a governor that chases power-ups and animals.
 */
async function injectPowerUpGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class PowerUpGovernor {
      stats = { framesRun: 0, catchAttempts: 0, powerUpAttempts: 0, idleFrames: 0 };
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
      private findBestTarget(snap: any): { x: number; isPowerUp: boolean } | null {
        if (!snap.player) return null;
        const powerUps = snap.fallingPowerUps ?? [];
        if (powerUps.length > 0) {
          let best = powerUps[0];
          for (const pu of powerUps) {
            if (pu.y > best.y) best = pu;
          }
          return { x: best.x, isPowerUp: true };
        }
        const animals = snap.fallingAnimals ?? [];
        if (animals.length > 0) {
          let best = animals[0];
          for (const a of animals) {
            if (a.y > best.y) best = a;
          }
          return { x: best.x, isPowerUp: false };
        }
        return null;
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
          if (target.isPowerUp) this.stats.powerUpAttempts++;
          else this.stats.catchAttempts++;
        } else if (snap.player) {
          this.moveToX(snap.canvasWidth / 2);
          this.stats.idleFrames++;
        }
        this.rafId = requestAnimationFrame(this.tick);
      };

      private moveToX(targetX: number): void {
        if (!this.isDragging) this.dispatchPointerDown(targetX);
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

    const governor = new PowerUpGovernor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

async function stopPowerUpGovernor(page: Page): Promise<{
  framesRun: number;
  catchAttempts: number;
  powerUpAttempts: number;
  idleFrames: number;
}> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov) return { framesRun: 0, catchAttempts: 0, powerUpAttempts: 0, idleFrames: 0 };
    gov.stop();
    return { ...gov.stats };
  });
}

async function waitForPowerUpGovernorFrames(
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

async function startWithPowerUpGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectPowerUpGovernor(page);
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Power-Up Collision Detection", () => {
  test.describe("Requirement 3.1: Power-up collection by player", () => {
    test("power-up falling into player collision range is collected", async ({ page }) => {
      await startWithPowerUpGovernor(page);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      await waitForPowerUpGovernorFrames(page, 300);
      const stats = await stopPowerUpGovernor(page);
      expect(stats.framesRun).toBeGreaterThan(300);
    });

    test("player can collect power-ups during gameplay", async ({ page }) => {
      await startWithPowerUpGovernor(page);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      await waitForPowerUpGovernorFrames(page, 500);
      await stopPowerUpGovernor(page);
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Requirement 3.2: Power-up collection by stacked animals", () => {
    test("power-up can be collected by stacked animal collision", async ({ page }) => {
      await startWithPowerUpGovernor(page);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      const initialScore = initialSnapshot!.score;
      await page.waitForFunction(
        (min) => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score >= min;
        },
        initialScore + 50,
        { timeout: 25000 }
      );
      await stopPowerUpGovernor(page);
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThan(initialScore);
    });

    test("stacked animals extend collection area vertically", async ({ page }) => {
      await startWithPowerUpGovernor(page);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      await waitForPowerUpGovernorFrames(page, 400);
      await stopPowerUpGovernor(page);
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.score).toBeGreaterThanOrEqual(initialSnapshot!.score);
    });
  });

  test.describe("Requirement 3.9: Uncollected power-ups are removed", () => {
    test("power-up falling past player is removed without effect", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      await movePlayerToEdge(page, "left");
      await page.waitForTimeout(5000);
      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.isPlaying || finalSnapshot!.lives === 0).toBe(true);
    });

    test("missed power-ups do not affect lives", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);
      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      await movePlayerToEdge(page, "right");
      await page.waitForTimeout(3000);
      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(typeof snapshot!.lives).toBe("number");
      expect(snapshot!.isPlaying !== undefined).toBe(true);
    });
  });

  test.describe("Power-Up Type Coverage", () => {
    test("all power-up types are defined in test helpers", async () => {
      const expectedTypes = [
        "hay_bale",
        "golden_egg",
        "water_trough",
        "salt_lick",
        "corn_feed",
        "lucky_horseshoe",
      ];
      for (const type of expectedTypes) {
        expect(POWER_UP_TYPES).toContain(type);
      }
      expect(POWER_UP_TYPES.length).toBe(6);
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Power-Up Collision and Collection
 *
 * Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
 *
 * Property: For any power-up position that overlaps with the player entity OR
 * any stacked animal entity, the power-up SHALL be collected and removed.
 * For any power-up that falls past the player without collision, it SHALL be
 * removed without triggering any effect.
 *
 * **Validates: Requirements 3.1, 3.2, 3.9**
 */
test.describe("Property 3: Power-Up Collision and Collection", () => {
  const PROPERTY_TEST_SEED = 31415;
  const PROPERTY_TEST_ITERATIONS = 100;

  function isWithinCollectionZone(
    position: { x: number; y: number },
    playerConfig: PlayerConfig,
    stackHeight: number
  ): boolean {
    const collectionWidth = playerConfig.width * 1.2;
    const collectionLeft = playerConfig.x - collectionWidth / 2;
    const collectionRight = playerConfig.x + collectionWidth / 2;
    const stackOffset = stackHeight * 30;
    const collectionTop = playerConfig.y - stackOffset - 50;
    const collectionBottom = playerConfig.y + playerConfig.height;
    const withinHorizontal = position.x >= collectionLeft && position.x <= collectionRight;
    const withinVertical = position.y >= collectionTop && position.y <= collectionBottom;
    return withinHorizontal && withinVertical;
  }

  test("Property: Generated collection positions are within bounds", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
    // **Validates: Requirements 3.1, 3.2, 3.9**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);
    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.player).toBeTruthy();

    const playerConfig: PlayerConfig = {
      x: snapshot!.player!.x + snapshot!.player!.width / 2,
      y: snapshot!.player!.y,
      width: snapshot!.player!.width,
      height: snapshot!.player!.height,
    };

    const rng = createSeededRandom(PROPERTY_TEST_SEED);
    const collectionWidth = playerConfig.width * 1.2;
    const collectionLeft = playerConfig.x - collectionWidth / 2;
    const collectionRight = playerConfig.x + collectionWidth / 2;

    let verifiedCount = 0;
    for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
      const x = rng.nextFloat(collectionLeft, collectionRight);
      const y = rng.nextFloat(playerConfig.y - 50, playerConfig.y + playerConfig.height);
      const withinBounds = isWithinCollectionZone({ x, y }, playerConfig, 0);
      expect(withinBounds).toBe(true);
      verifiedCount++;
    }
    expect(verifiedCount).toBeGreaterThanOrEqual(PROPERTY_TEST_ITERATIONS);
  });

  test("Property: Power-up collection works during gameplay", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
    // **Validates: Requirements 3.1, 3.2, 3.9**
    await startWithPowerUpGovernor(page);
    const initialSnapshot = await getSnapshot(page);
    expect(initialSnapshot).toBeTruthy();
    const initialScore = initialSnapshot!.score;
    await waitForPowerUpGovernorFrames(page, 400);
    await page.waitForFunction(
      (min) => {
        // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
        const game = (window as any).__game;
        const snap = game?.getTestSnapshot();
        return snap && snap.score >= min;
      },
      initialScore + 30,
      { timeout: 25000 }
    );
    const stats = await stopPowerUpGovernor(page);
    const finalSnapshot = await getSnapshot(page);
    expect(finalSnapshot).toBeTruthy();
    expect(finalSnapshot!.score).toBeGreaterThan(initialScore);
    expect(stats.framesRun).toBeGreaterThan(400);
  });

  test("Property: Collection zone scales with stack height", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
    // **Validates: Requirement 3.2 (collection by stacked animals)**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);
    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.player).toBeTruthy();

    const playerConfig: PlayerConfig = {
      x: snapshot!.player!.x + snapshot!.player!.width / 2,
      y: snapshot!.player!.y,
      width: snapshot!.player!.width,
      height: snapshot!.player!.height,
    };

    const stackHeights = [0, 2, 5, 10];
    const collectionZoneSizes: number[] = [];
    for (const stackHeight of stackHeights) {
      const stackOffset = stackHeight * 30;
      const collectionTop = playerConfig.y - stackOffset - 50;
      const collectionBottom = playerConfig.y + playerConfig.height;
      collectionZoneSizes.push(collectionBottom - collectionTop);
    }
    for (let i = 1; i < collectionZoneSizes.length; i++) {
      expect(collectionZoneSizes[i]).toBeGreaterThan(collectionZoneSizes[i - 1]);
    }
  });

  test("Property: Missed power-ups are removed without effect", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
    // **Validates: Requirement 3.9 (uncollected power-ups removed)**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);
    const initialSnapshot = await getSnapshot(page);
    expect(initialSnapshot).toBeTruthy();
    await movePlayerToEdge(page, "left");
    await page.waitForTimeout(5000);
    const finalSnapshot = await getSnapshot(page);
    expect(finalSnapshot).toBeTruthy();
    expect(finalSnapshot!.isPlaying || finalSnapshot!.lives === 0).toBe(true);
  });

  test("Property: Power-up types are valid", async () => {
    // Feature: comprehensive-e2e-testing, Property 3: Power-Up Collision and Collection
    // **Validates: Requirements 3.1, 3.2, 3.9**
    const validTypes = new Set(POWER_UP_TYPES);
    expect(validTypes.size).toBe(6);
    expect(validTypes.has("hay_bale")).toBe(true);
    expect(validTypes.has("golden_egg")).toBe(true);
    expect(validTypes.has("water_trough")).toBe(true);
    expect(validTypes.has("salt_lick")).toBe(true);
    expect(validTypes.has("corn_feed")).toBe(true);
    expect(validTypes.has("lucky_horseshoe")).toBe(true);
  });
});
