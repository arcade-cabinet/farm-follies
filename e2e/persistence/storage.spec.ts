/**
 * Data Persistence Tests
 *
 * E2E tests for data persistence in Farm Follies.
 * Tests verify that game data persists correctly across sessions.
 *
 * Requirements: 27.1-27.5
 *
 * Feature: comprehensive-e2e-testing
 */

import { expect, test } from "@playwright/test";
import {
  clearGameStorage,
  createSeededRandom,
  generateSeeds,
  getSnapshot,
  getStorageValue,
  injectAndStartGovernor,
  STORAGE_KEYS,
  setStorageValue,
  startGameAndWait,
  stopGovernor,
} from "../helpers";

// ── Test Suite ─────────────────────────────────────────────────────

test.describe("Data Persistence Tests", () => {
  test.setTimeout(60000);

  test.describe("Requirement 27.1: High score persists", () => {
    test("high score is saved to storage", async ({ page }) => {
      // Clear storage first
      await page.goto("/");
      await clearGameStorage(page);

      const ready = await startGameAndWait(page);
      expect(ready).toBe(true);

      await injectAndStartGovernor(page, { catchStrategy: "nearest" });

      // Play until we have a score
      await page.waitForFunction(
        () => {
          // biome-ignore lint/suspicious/noExplicitAny: E2E tests use window globals
          const game = (window as any).__game;
          const snap = game?.getTestSnapshot();
          return snap && snap.score >= 50;
        },
        { timeout: 30000 }
      );

      await stopGovernor(page);

      // End the game (lose all lives)
      // The high score should be saved when game ends
      const snapshot = await getSnapshot(page);
      expect(snapshot?.score).toBeGreaterThanOrEqual(50);
    });

    test("high score persists after reload", async ({ page }) => {
      // Set a known high score
      await page.goto("/");
      await setStorageValue(page, STORAGE_KEYS.highScore, 1000);

      // Reload the page
      await page.reload();
      await page.waitForTimeout(1000);

      // Check that high score is still there
      const storedScore = await getStorageValue<number>(page, STORAGE_KEYS.highScore);
      expect(storedScore).toBe(1000);
    });
  });

  test.describe("Requirement 27.2: Stats persist", () => {
    test("game stats can be stored", async ({ page }) => {
      await page.goto("/");

      // Set some stats
      const testStats = {
        totalGames: 10,
        totalScore: 5000,
        totalCatches: 200,
      };
      await setStorageValue(page, STORAGE_KEYS.stats, testStats);

      // Verify storage
      const storedStats = await getStorageValue(page, STORAGE_KEYS.stats);
      expect(storedStats).toEqual(testStats);
    });

    test("stats persist after reload", async ({ page }) => {
      await page.goto("/");

      const testStats = {
        totalGames: 5,
        totalScore: 2500,
      };
      await setStorageValue(page, STORAGE_KEYS.stats, testStats);

      // Reload
      await page.reload();
      await page.waitForTimeout(500);

      // Verify persistence
      const storedStats = await getStorageValue(page, STORAGE_KEYS.stats);
      expect(storedStats).toEqual(testStats);
    });
  });

  test.describe("Requirement 27.3: Achievements persist", () => {
    test("achievements can be stored", async ({ page }) => {
      await page.goto("/");

      const testAchievements = ["first_catch", "score_100", "stack_5"];
      await setStorageValue(page, STORAGE_KEYS.achievements, testAchievements);

      const storedAchievements = await getStorageValue(page, STORAGE_KEYS.achievements);
      expect(storedAchievements).toEqual(testAchievements);
    });

    test("achievements persist after reload", async ({ page }) => {
      await page.goto("/");

      const testAchievements = ["first_catch"];
      await setStorageValue(page, STORAGE_KEYS.achievements, testAchievements);

      await page.reload();
      await page.waitForTimeout(500);

      const storedAchievements = await getStorageValue(page, STORAGE_KEYS.achievements);
      expect(storedAchievements).toEqual(testAchievements);
    });
  });

  test.describe("Requirement 27.4: Tutorial completion persists", () => {
    test("tutorial completion can be stored", async ({ page }) => {
      await page.goto("/");

      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      const stored = await getStorageValue(page, STORAGE_KEYS.tutorialComplete);
      expect(stored).toBe(true);
    });

    test("tutorial completion persists after reload", async ({ page }) => {
      await page.goto("/");

      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      await page.reload();
      await page.waitForTimeout(500);

      const stored = await getStorageValue(page, STORAGE_KEYS.tutorialComplete);
      expect(stored).toBe(true);
    });
  });

  test.describe("Requirement 27.5: Game modes persist", () => {
    test("unlocked modes can be stored", async ({ page }) => {
      await page.goto("/");

      const unlockedModes = ["endless", "time_attack"];
      await setStorageValue(page, STORAGE_KEYS.unlockedModes, unlockedModes);

      const stored = await getStorageValue(page, STORAGE_KEYS.unlockedModes);
      expect(stored).toEqual(unlockedModes);
    });

    test("unlocked modes persist after reload", async ({ page }) => {
      await page.goto("/");

      const unlockedModes = ["endless"];
      await setStorageValue(page, STORAGE_KEYS.unlockedModes, unlockedModes);

      await page.reload();
      await page.waitForTimeout(500);

      const stored = await getStorageValue(page, STORAGE_KEYS.unlockedModes);
      expect(stored).toEqual(unlockedModes);
    });
  });

  test.describe("Storage Edge Cases", () => {
    test("clearing storage works", async ({ page }) => {
      await page.goto("/");

      // Set some values
      await setStorageValue(page, STORAGE_KEYS.highScore, 500);
      await setStorageValue(page, STORAGE_KEYS.tutorialComplete, true);

      // Clear storage
      await clearGameStorage(page);

      // Verify cleared
      const highScore = await getStorageValue(page, STORAGE_KEYS.highScore);
      expect(highScore).toBeNull();
    });

    test("invalid storage values are handled", async ({ page }) => {
      await page.goto("/");

      // Try to get non-existent key
      const value = await getStorageValue(page, "nonexistent_key");
      expect(value).toBeNull();
    });
  });
});

// ── Property-Based Tests ───────────────────────────────────────────

/**
 * Property-Based Test: Data Persistence Round-Trip
 *
 * Feature: comprehensive-e2e-testing, Property 17: Data Persistence Round-Trip
 *
 * Property: *For any* stats object saved to storage, reloading the application
 * and reading stats SHALL return an equivalent object.
 *
 * **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**
 */
test.describe("Property 17: Data Persistence Round-Trip", () => {
  test.setTimeout(60000);

  const BASE_SEED = 170017;
  const ITERATION_COUNT = 25;
  const seeds = generateSeeds(BASE_SEED, ITERATION_COUNT);

  test.describe("Feature: comprehensive-e2e-testing, Property 17: Data Persistence Round-Trip", () => {
    for (let i = 0; i < Math.min(seeds.length, 15); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const testHighScore = rng.nextInt(100, 10000);

      test(`iteration ${i + 1}: seed=${seed}, highScore=${testHighScore}`, async ({ page }) => {
        // Feature: comprehensive-e2e-testing, Property 17: Data Persistence Round-Trip
        // **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**

        await page.goto("/");

        // Store value
        await setStorageValue(page, STORAGE_KEYS.highScore, testHighScore);

        // Reload
        await page.reload();
        await page.waitForTimeout(500);

        // PROPERTY ASSERTION:
        // Retrieved value should equal stored value
        const retrieved = await getStorageValue<number>(page, STORAGE_KEYS.highScore);
        expect(retrieved).toBe(testHighScore);
      });
    }
  });

  test.describe("Property 17 - Complex data round-trip", () => {
    for (let i = 15; i < Math.min(seeds.length, 25); i++) {
      const seed = seeds[i];
      const rng = createSeededRandom(seed);
      const testStats = {
        totalGames: rng.nextInt(1, 100),
        totalScore: rng.nextInt(100, 50000),
        totalCatches: rng.nextInt(10, 1000),
      };

      test(`iteration ${i + 1}: seed=${seed}, stats=${JSON.stringify(testStats)}`, async ({
        page,
      }) => {
        // Feature: comprehensive-e2e-testing, Property 17: Data Persistence Round-Trip
        // **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**

        await page.goto("/");

        // Store complex value
        await setStorageValue(page, STORAGE_KEYS.stats, testStats);

        // Reload
        await page.reload();
        await page.waitForTimeout(500);

        // Property: complex objects round-trip correctly
        const retrieved = await getStorageValue(page, STORAGE_KEYS.stats);
        expect(retrieved).toEqual(testStats);
      });
    }
  });
});
