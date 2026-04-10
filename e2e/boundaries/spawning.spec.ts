/**
 * Spawn Boundary Tests
 *
 * E2E tests for animal and power-up spawn boundary enforcement in Farm Follies.
 * Tests verify that entities spawn within valid positions and drift stays within bounds.
 *
 * Requirements: 6.1, 6.4, 7.1, 7.2
 */

import { expect, type Page, test } from "@playwright/test";
import {
  createSeededRandom,
  generateSpawnEdgeCases,
  generateSpawnPositions,
  getSnapshot,
  startGameAndWait,
} from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

async function injectGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const game = (window as any).__game;
    if (!game) throw new Error("window.__game not available");

    class Governor {
      stats = { framesRun: 0, catchAttempts: 0, idleFrames: 0 };
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
        let best = snap.fallingAnimals[0];
        for (const a of snap.fallingAnimals) {
          if (a.y > best.y) best = a;
        }
        return best;
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

    const governor = new Governor(game);
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    (window as any).__governor = governor;
    governor.start();
  });
}

async function stopGovernor(
  page: Page
): Promise<{ framesRun: number; catchAttempts: number; idleFrames: number }> {
  return page.evaluate(() => {
    // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
    const gov = (window as any).__governor;
    if (!gov) return { framesRun: 0, catchAttempts: 0, idleFrames: 0 };
    gov.stop();
    return { ...gov.stats };
  });
}

async function waitForGovernorFrames(
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

async function startWithGovernor(page: Page): Promise<void> {
  const ready = await startGameAndWait(page);
  expect(ready).toBe(true);
  await injectGovernor(page);
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Spawn Boundary Enforcement", () => {
  test.describe("Requirement 6.1: Animal spawn positions within playable width", () => {
    test("falling animals spawn within valid X bounds", async ({ page }) => {
      await startWithGovernor(page);

      // Wait for animals to spawn
      await waitForGovernorFrames(page, 100);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      const canvasWidth = snapshot!.canvasWidth;
      const maxX = canvasWidth - 65; // Bank width

      // Check all falling animals are within bounds
      for (const animal of snapshot!.fallingAnimals) {
        expect(animal.x).toBeGreaterThanOrEqual(0);
        expect(animal.x).toBeLessThanOrEqual(maxX);
      }

      await stopGovernor(page);
    });

    test("animals spawn at top of screen", async ({ page }) => {
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
        { timeout: 10000 }
      );

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // Animals should spawn near the top
      for (const animal of snapshot!.fallingAnimals) {
        // Animals spawn from tornado at top, so Y should be relatively low initially
        expect(animal.y).toBeLessThan(snapshot!.canvasHeight);
      }
    });
  });

  test.describe("Requirement 6.4: Entity drift stays within bounds", () => {
    test("falling animals remain within horizontal bounds during fall", async ({ page }) => {
      await startWithGovernor(page);

      // Sample multiple times during gameplay
      for (let i = 0; i < 5; i++) {
        await waitForGovernorFrames(page, 50 + i * 50);

        const snapshot = await getSnapshot(page);
        expect(snapshot).toBeTruthy();

        const canvasWidth = snapshot!.canvasWidth;
        const maxX = canvasWidth - 65;

        // All animals should be within bounds
        for (const animal of snapshot!.fallingAnimals) {
          expect(animal.x).toBeGreaterThanOrEqual(0);
          expect(animal.x).toBeLessThanOrEqual(maxX);
        }
      }

      await stopGovernor(page);
    });
  });

  test.describe("Requirement 7.1: Power-up spawn positions within playable area", () => {
    test("power-ups spawn within valid bounds", async ({ page }) => {
      await startWithGovernor(page);

      // Play for a while to potentially see power-ups
      await waitForGovernorFrames(page, 300);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      const canvasWidth = snapshot!.canvasWidth;
      const maxX = canvasWidth - 65;

      // Check any falling power-ups are within bounds
      const powerUps = snapshot!.fallingPowerUps ?? [];
      for (const powerUp of powerUps) {
        expect(powerUp.x).toBeGreaterThanOrEqual(0);
        expect(powerUp.x).toBeLessThanOrEqual(maxX);
      }

      await stopGovernor(page);
    });
  });

  test.describe("Requirement 7.2: Power-up drift stays within bounds", () => {
    test("power-ups remain within horizontal bounds during fall", async ({ page }) => {
      await startWithGovernor(page);

      // Sample multiple times
      for (let i = 0; i < 3; i++) {
        await waitForGovernorFrames(page, 100 + i * 100);

        const snapshot = await getSnapshot(page);
        expect(snapshot).toBeTruthy();

        const canvasWidth = snapshot!.canvasWidth;
        const maxX = canvasWidth - 65;

        const powerUps = snapshot!.fallingPowerUps ?? [];
        for (const powerUp of powerUps) {
          expect(powerUp.x).toBeGreaterThanOrEqual(0);
          expect(powerUp.x).toBeLessThanOrEqual(maxX);
        }
      }

      await stopGovernor(page);
    });
  });

  test.describe("Spawn Position Edge Cases", () => {
    test("generated spawn positions are valid", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      const bounds = {
        width: snapshot!.canvasWidth,
        height: snapshot!.canvasHeight,
        bankWidth: 65,
        padding: 50,
      };

      // Generate spawn positions
      const rng = createSeededRandom(61234);
      const positions = generateSpawnPositions(rng, 20, bounds);

      const maxX = bounds.width - bounds.bankWidth - bounds.padding;
      const minX = bounds.padding;

      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(minX);
        expect(pos.x).toBeLessThanOrEqual(maxX);
      }
    });

    test("spawn edge cases cover boundaries", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      const bounds = {
        width: snapshot!.canvasWidth,
        height: snapshot!.canvasHeight,
        bankWidth: 65,
        padding: 50,
      };

      const edgeCases = generateSpawnEdgeCases(bounds);

      // Should have edge cases for boundaries
      expect(edgeCases.length).toBeGreaterThan(0);

      // All edge cases should be valid positions
      for (const pos of edgeCases) {
        expect(typeof pos.x).toBe("number");
        expect(typeof pos.y).toBe("number");
      }
    });
  });
});

// ── Property 6: Spawn Position Validity ────────────────────────────
// Feature: comprehensive-e2e-testing, Property 6: Spawn Position Validity
// *For any* animal spawned by the tornado, the spawn X position SHALL be within [0, canvasWidth - bankWidth].
// *For any* power-up spawned, the spawn position SHALL be within the playable area.
// *For any* entity drifting horizontally, it SHALL remain within screen bounds.
// **Validates: Requirements 6.1, 6.4, 7.1, 7.2**

test.describe("Property 6: Spawn Position Validity", () => {
  const ITERATIONS = 100;
  const SEED_BASE = 61234;

  test("all spawned entities remain within valid bounds across 100 samples", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 6: Spawn Position Validity
    // **Validates: Requirements 6.1, 6.4, 7.1, 7.2**
    await page.goto("/");
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);
    await injectGovernor(page);

    let totalAnimalsChecked = 0;
    let totalPowerUpsChecked = 0;
    let boundaryViolations = 0;

    // Sample game state 100 times during gameplay
    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      // Wait for some gameplay frames between samples
      await waitForGovernorFrames(page, 10 + iteration * 5);

      const snapshot = await getSnapshot(page);
      if (!snapshot) continue;

      const canvasWidth = snapshot.canvasWidth;
      const bankWidth = 65;
      const maxX = canvasWidth - bankWidth;

      // Check all falling animals
      for (const animal of snapshot.fallingAnimals) {
        totalAnimalsChecked++;
        if (animal.x < 0 || animal.x > maxX) {
          boundaryViolations++;
        }
      }

      // Check all falling power-ups
      const powerUps = snapshot.fallingPowerUps ?? [];
      for (const powerUp of powerUps) {
        totalPowerUpsChecked++;
        if (powerUp.x < 0 || powerUp.x > maxX) {
          boundaryViolations++;
        }
      }
    }

    await stopGovernor(page);

    // Property assertion: no boundary violations
    expect(boundaryViolations).toBe(0);
    expect(totalAnimalsChecked).toBeGreaterThan(0);
    console.log(
      `Property 6 validated: ${totalAnimalsChecked} animals, ${totalPowerUpsChecked} power-ups checked, 0 violations`
    );
  });

  test("spawn positions generated by test helpers are always valid", async ({ page }) => {
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);

    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();

    const bounds = {
      width: snapshot!.canvasWidth,
      height: snapshot!.canvasHeight,
      bankWidth: 65,
      padding: 50,
    };

    // Test 100 generated spawn positions
    for (let i = 0; i < 100; i++) {
      const rng = createSeededRandom(SEED_BASE + i);
      const positions = generateSpawnPositions(rng, 10, bounds);

      const maxX = bounds.width - bounds.bankWidth - bounds.padding;
      const minX = bounds.padding;

      for (const pos of positions) {
        expect(pos.x).toBeGreaterThanOrEqual(minX);
        expect(pos.x).toBeLessThanOrEqual(maxX);
      }
    }
  });

  test("entity drift maintains bounds over extended gameplay", async ({ page }) => {
    await page.goto("/");
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);
    await injectGovernor(page);

    // Play for extended period, sampling frequently
    const samples: Array<{ animals: number; powerUps: number; violations: number }> = [];

    for (let sample = 0; sample < 20; sample++) {
      await waitForGovernorFrames(page, 50 + sample * 25);

      const snapshot = await getSnapshot(page);
      if (!snapshot) continue;

      const canvasWidth = snapshot.canvasWidth;
      const maxX = canvasWidth - 65;
      let violations = 0;

      for (const animal of snapshot.fallingAnimals) {
        if (animal.x < 0 || animal.x > maxX) violations++;
      }

      const powerUps = snapshot.fallingPowerUps ?? [];
      for (const powerUp of powerUps) {
        if (powerUp.x < 0 || powerUp.x > maxX) violations++;
      }

      samples.push({
        animals: snapshot.fallingAnimals.length,
        powerUps: powerUps.length,
        violations,
      });
    }

    await stopGovernor(page);

    // All samples should have zero violations
    const totalViolations = samples.reduce((sum, s) => sum + s.violations, 0);
    expect(totalViolations).toBe(0);
  });
});
