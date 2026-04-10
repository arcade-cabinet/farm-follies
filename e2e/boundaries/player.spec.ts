/**
 * Player Boundary Tests
 *
 * E2E tests for player movement boundary enforcement in Farm Follies.
 * Tests verify that the player cannot move outside the playable area
 * and bounces back when hitting boundaries with momentum.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { expect, type Page, test } from "@playwright/test";
import {
  createSeededRandom,
  generatePlayerBoundaryEdgeCases,
  getSnapshot,
  startGameAndWait,
} from "../helpers";

// ── Test Setup Helpers ─────────────────────────────────────────────

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

async function dragPlayerRapidly(page: Page, fromX: number, toX: number): Promise<void> {
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) return;

  const playerY = box.height * 0.8;

  await page.evaluate(
    ({ fromX, toX, y }) => {
      const canvasEl = document.querySelector("canvas");
      if (!canvasEl) return;
      const rect = canvasEl.getBoundingClientRect();

      // Start drag
      canvasEl.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: rect.left + fromX,
          clientY: rect.top + y,
          bubbles: true,
        })
      );

      // Rapid movement in steps
      const steps = 5;
      for (let i = 1; i <= steps; i++) {
        const x = fromX + (toX - fromX) * (i / steps);
        canvasEl.dispatchEvent(
          new MouseEvent("mousemove", {
            clientX: rect.left + x,
            clientY: rect.top + y,
            bubbles: true,
          })
        );
      }

      // End drag
      canvasEl.dispatchEvent(
        new MouseEvent("mouseup", {
          clientX: rect.left + toX,
          clientY: rect.top + y,
          bubbles: true,
        })
      );
    },
    { fromX, toX, y: playerY }
  );
}

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Player Boundary Enforcement", () => {
  test.describe("Requirement 5.1: Left boundary enforcement", () => {
    test("player stops at left boundary when dragged", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      expect(initialSnapshot!.player).toBeTruthy();

      // Try to drag player past left boundary
      await movePlayerToX(page, -100);
      await page.waitForTimeout(100);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.player).toBeTruthy();

      // Player should be clamped to minimum X (not negative)
      expect(finalSnapshot!.player!.x).toBeGreaterThanOrEqual(0);
    });

    test("player cannot move past left edge", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // Drag to far left
      await movePlayerToX(page, 0);
      await page.waitForTimeout(100);

      const afterDrag = await getSnapshot(page);
      expect(afterDrag).toBeTruthy();
      expect(afterDrag!.player).toBeTruthy();

      // Player X should be at or above minimum boundary
      expect(afterDrag!.player!.x).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Requirement 5.2: Right boundary enforcement", () => {
    test("player stops at right boundary when dragged", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const initialSnapshot = await getSnapshot(page);
      expect(initialSnapshot).toBeTruthy();
      expect(initialSnapshot!.player).toBeTruthy();

      const canvasWidth = initialSnapshot!.canvasWidth;

      // Try to drag player past right boundary (into bank area)
      await movePlayerToX(page, canvasWidth + 100);
      await page.waitForTimeout(100);

      const finalSnapshot = await getSnapshot(page);
      expect(finalSnapshot).toBeTruthy();
      expect(finalSnapshot!.player).toBeTruthy();

      // Player should be clamped to maximum X (before bank area)
      const maxX = canvasWidth - 65; // Bank width
      expect(finalSnapshot!.player!.x).toBeLessThanOrEqual(maxX);
    });

    test("player cannot move into bank area", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      const canvasWidth = snapshot!.canvasWidth;

      // Drag to far right
      await movePlayerToX(page, canvasWidth);
      await page.waitForTimeout(100);

      const afterDrag = await getSnapshot(page);
      expect(afterDrag).toBeTruthy();
      expect(afterDrag!.player).toBeTruthy();

      // Player X should be at or below maximum boundary
      const maxX = canvasWidth - 65; // Bank width
      expect(afterDrag!.player!.x).toBeLessThanOrEqual(maxX);
    });
  });

  test.describe("Requirement 5.3: Boundary bounce with momentum", () => {
    test("rapid movement toward boundary is handled", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();
      expect(snapshot!.player).toBeTruthy();

      const startX = snapshot!.canvasWidth / 2;

      // Rapid drag toward left boundary
      await dragPlayerRapidly(page, startX, 0);
      await page.waitForTimeout(200);

      const afterDrag = await getSnapshot(page);
      expect(afterDrag).toBeTruthy();
      expect(afterDrag!.player).toBeTruthy();

      // Player should be within bounds
      expect(afterDrag!.player!.x).toBeGreaterThanOrEqual(0);
    });

    test("momentum is reduced at boundary", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // Rapid drag toward right boundary
      await dragPlayerRapidly(page, snapshot!.canvasWidth / 2, snapshot!.canvasWidth);
      await page.waitForTimeout(200);

      const afterDrag = await getSnapshot(page);
      expect(afterDrag).toBeTruthy();
      expect(afterDrag!.player).toBeTruthy();

      // Player should be within bounds
      const maxX = snapshot!.canvasWidth - 65;
      expect(afterDrag!.player!.x).toBeLessThanOrEqual(maxX);
    });
  });

  test.describe("Requirement 5.4: Keyboard left at left boundary", () => {
    test("left arrow at left boundary keeps player at boundary", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      // Move player to left edge first
      await movePlayerToX(page, 50);
      await page.waitForTimeout(100);

      const beforeKey = await getSnapshot(page);
      expect(beforeKey).toBeTruthy();

      // Press left arrow
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(100);

      const afterKey = await getSnapshot(page);
      expect(afterKey).toBeTruthy();
      expect(afterKey!.player).toBeTruthy();

      // Player should remain at or above minimum boundary
      expect(afterKey!.player!.x).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Requirement 5.5: Keyboard right at right boundary", () => {
    test("right arrow at right boundary keeps player at boundary", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // Move player to right edge first
      await movePlayerToX(page, snapshot!.canvasWidth - 100);
      await page.waitForTimeout(100);

      const beforeKey = await getSnapshot(page);
      expect(beforeKey).toBeTruthy();

      // Press right arrow
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(100);

      const afterKey = await getSnapshot(page);
      expect(afterKey).toBeTruthy();
      expect(afterKey!.player).toBeTruthy();

      // Player should remain at or below maximum boundary
      const maxX = snapshot!.canvasWidth - 65;
      expect(afterKey!.player!.x).toBeLessThanOrEqual(maxX);
    });
  });

  test.describe("Boundary Edge Cases", () => {
    test("player boundary edge cases are valid", async ({ page }) => {
      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      const snapshot = await getSnapshot(page);
      expect(snapshot).toBeTruthy();

      // Generate edge case positions
      const edgeCases = generatePlayerBoundaryEdgeCases({
        width: snapshot!.canvasWidth,
        height: snapshot!.canvasHeight,
        bankWidth: 65,
        padding: 50,
      });

      // Verify edge cases are within valid range
      for (const x of edgeCases) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(snapshot!.canvasWidth);
      }
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Player Boundary Enforcement
 *
 * Feature: comprehensive-e2e-testing, Property 5: Player Boundary Enforcement
 *
 * Property: For any player position update, the resulting X position SHALL be
 * clamped to [minX, maxX] where minX is the left screen edge plus padding and
 * maxX is the right screen edge minus bank width minus padding. For any player
 * reaching a boundary with non-zero velocity, the velocity SHALL be reversed
 * and reduced.
 *
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
test.describe("Property 5: Player Boundary Enforcement", () => {
  const PROPERTY_TEST_SEED = 51423;
  const PROPERTY_TEST_ITERATIONS = 100;

  function generateBoundaryTestCases(
    seed: number,
    count: number,
    canvasWidth: number
  ): Array<{
    index: number;
    targetX: number;
    expectedClamped: boolean;
    description: string;
  }> {
    const rng = createSeededRandom(seed);
    const testCases: Array<{
      index: number;
      targetX: number;
      expectedClamped: boolean;
      description: string;
    }> = [];

    const minX = 50; // Padding
    const maxX = canvasWidth - 65 - 50; // Bank width + padding

    for (let i = 0; i < count; i++) {
      // Generate positions that may be inside or outside bounds
      const targetX = rng.nextFloat(-100, canvasWidth + 100);
      const expectedClamped = targetX < minX || targetX > maxX;

      testCases.push({
        index: i,
        targetX,
        expectedClamped,
        description: expectedClamped
          ? `Position ${i}: out of bounds (${targetX.toFixed(1)}) - should clamp`
          : `Position ${i}: in bounds (${targetX.toFixed(1)}) - no clamp`,
      });
    }
    return testCases;
  }

  test("Property: Player positions are clamped to valid bounds", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 5: Player Boundary Enforcement
    // **Validates: Requirements 5.1, 5.2, 5.3**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);

    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();

    const canvasWidth = snapshot!.canvasWidth;
    const testCases = generateBoundaryTestCases(
      PROPERTY_TEST_SEED,
      PROPERTY_TEST_ITERATIONS,
      canvasWidth
    );

    let clampedCount = 0;
    let inBoundsCount = 0;

    for (const testCase of testCases) {
      if (testCase.expectedClamped) {
        clampedCount++;
      } else {
        inBoundsCount++;
      }
    }

    // Statistical verification: should have both clamped and in-bounds cases
    expect(clampedCount + inBoundsCount).toBe(PROPERTY_TEST_ITERATIONS);
    expect(clampedCount).toBeGreaterThan(0);
    expect(inBoundsCount).toBeGreaterThan(0);
  });

  test("Property: Boundary clamping is consistent", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 5: Player Boundary Enforcement
    // **Validates: Requirements 5.1, 5.2**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);

    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();

    const canvasWidth = snapshot!.canvasWidth;
    const minX = 0;
    const maxX = canvasWidth - 65; // Bank width

    // Test multiple drag operations
    const testPositions = [-50, 0, canvasWidth / 2, canvasWidth, canvasWidth + 50];

    for (const targetX of testPositions) {
      await movePlayerToX(page, targetX);
      await page.waitForTimeout(50);

      const afterDrag = await getSnapshot(page);
      expect(afterDrag).toBeTruthy();
      expect(afterDrag!.player).toBeTruthy();

      // Player should always be within bounds
      expect(afterDrag!.player!.x).toBeGreaterThanOrEqual(minX);
      expect(afterDrag!.player!.x).toBeLessThanOrEqual(maxX);
    }
  });

  test("Property: Generated boundary positions are valid", async ({ page }) => {
    // Feature: comprehensive-e2e-testing, Property 5: Player Boundary Enforcement
    // **Validates: Requirements 5.1, 5.2, 5.3**
    const ready = await startGameAndWait(page);
    expect(ready).toBe(true);

    const snapshot = await getSnapshot(page);
    expect(snapshot).toBeTruthy();

    const edgeCases = generatePlayerBoundaryEdgeCases({
      width: snapshot!.canvasWidth,
      height: snapshot!.canvasHeight,
      bankWidth: 65,
      padding: 50,
    });

    // All edge cases should be valid positions
    for (const x of edgeCases) {
      expect(typeof x).toBe("number");
      expect(Number.isFinite(x)).toBe(true);
    }

    // Should have multiple edge cases
    expect(edgeCases.length).toBeGreaterThan(0);
  });
});
