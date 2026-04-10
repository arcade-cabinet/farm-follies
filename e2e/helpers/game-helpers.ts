/**
 * Game Test Helpers
 *
 * Common utilities for E2E testing of Farm Follies.
 * These helpers provide a consistent interface for:
 * - Navigating through splash/menu screens
 * - Waiting for game instance availability
 * - Getting game state snapshots
 * - Dispatching canvas events
 * - Managing localStorage values
 *
 * Requirements: 8.1, 8.2, 8.3
 */

import type { Page } from "@playwright/test";
import type { ConditionFn, GameSnapshot } from "./conditions";

// ── Types ──────────────────────────────────────────────────────────

export type CanvasEventType =
  | "mousedown"
  | "mousemove"
  | "mouseup"
  | "touchstart"
  | "touchmove"
  | "touchend";

export interface CanvasEvent {
  type: CanvasEventType;
  x: number;
  y: number;
  options?: {
    bubbles?: boolean;
    cancelable?: boolean;
  };
}

export interface KeyboardEventConfig {
  type: "keydown" | "keyup";
  code: string;
  key: string;
}

// ── Storage Keys ───────────────────────────────────────────────────

export const STORAGE_KEYS = {
  highScore: "farm-follies-high-score",
  stats: "farm-follies-stats",
  achievements: "farm-follies-achievements",
  tutorialComplete: "farm-follies-tutorial-complete",
  unlockedModes: "farm-follies-unlocked-modes",
  coins: "farm-follies-coins",
  upgrades: "farm-follies-upgrades",
} as const;

// ── Navigation Helpers ─────────────────────────────────────────────

/**
 * Skip the splash screen by clicking on it.
 * Also sets tutorial as complete to avoid tutorial interruptions.
 *
 * @param page - Playwright page instance
 */
export async function skipSplash(page: Page): Promise<void> {
  await page.goto("/");

  // Mark tutorial as complete to avoid interruptions
  await page.evaluate(() => {
    localStorage.setItem("farm-follies-tutorial-complete", "true");
  });

  // Wait for splash screen to appear and click to skip
  // The splash screen has class "fixed inset-0 z-50" and contains a video
  const splash = page.locator(".fixed.inset-0.z-50");

  try {
    // Wait up to 3 seconds for splash to appear
    await splash.waitFor({ state: "visible", timeout: 3000 });
    // Click to skip the splash video
    await splash.click();
    // Wait for fade transition to complete
    await page.waitForTimeout(800);
  } catch {
    // Splash may have already completed or not shown - that's fine
  }

  // Wait for the PLAY button to be visible (indicates we're on main menu)
  const playButton = page.getByText("PLAY", { exact: true });
  await playButton.waitFor({ state: "visible", timeout: 10000 });
}

/**
 * Start a new game from the main menu.
 * Skips splash screen and clicks the PLAY button.
 *
 * @param page - Playwright page instance
 */
export async function startGame(page: Page): Promise<void> {
  await skipSplash(page);

  // Find and click the PLAY button (skipSplash already waits for it)
  const playButton = page.getByText("PLAY", { exact: true });
  await playButton.click();

  // Wait for game canvas to be ready and game to initialize
  await page.waitForSelector("canvas", { state: "visible", timeout: 5000 });
  await page.waitForTimeout(500);
}

// ── Game Instance Helpers ──────────────────────────────────────────

/**
 * Wait until the game instance is available via window.__game.
 * The game exposes this API in development mode.
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns true if game instance is available, false otherwise
 */
export async function waitForGameInstance(page: Page, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        const win = window as Window & { __game?: { getTestSnapshot: () => unknown } };
        return !!win.__game?.getTestSnapshot;
      },
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current game state snapshot.
 * Returns null if game instance is not available.
 *
 * @param page - Playwright page instance
 * @returns GameSnapshot or null
 */
export async function getSnapshot(page: Page): Promise<GameSnapshot | null> {
  return page.evaluate(() => {
    const win = window as Window & { __game?: { getTestSnapshot: () => unknown } };
    const game = win.__game;
    return (game?.getTestSnapshot() as GameSnapshot) ?? null;
  });
}

/**
 * Wait for a specific game condition to be met.
 *
 * @param page - Playwright page instance
 * @param condition - Condition function that receives a GameSnapshot
 * @param timeout - Maximum time to wait in milliseconds (default: 15000)
 */
export async function waitForCondition(
  page: Page,
  condition: ConditionFn,
  timeout = 15000
): Promise<void> {
  // Serialize the condition function to run in browser context
  const conditionStr = condition.toString();

  await page.waitForFunction(
    (condFn: string) => {
      const win = window as Window & { __game?: { getTestSnapshot: () => unknown } };
      const game = win.__game;
      if (!game) return false;

      const snap = game.getTestSnapshot();
      if (!snap) return false;

      // Reconstruct and execute the condition function
      // biome-ignore lint/security/noGlobalEval: Required for dynamic condition evaluation in browser
      const fn = eval(`(${condFn})`);
      return fn(snap);
    },
    conditionStr,
    { timeout }
  );
}

// ── Canvas Event Helpers ───────────────────────────────────────────

/**
 * Dispatch a mouse or touch event to the game canvas.
 *
 * @param page - Playwright page instance
 * @param event - Canvas event configuration
 */
export async function dispatchCanvasEvent(page: Page, event: CanvasEvent): Promise<void> {
  await page.evaluate(({ type, x, y, options }) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) throw new Error("Canvas not found");

    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + x;
    const clientY = rect.top + y;

    const eventOptions = {
      bubbles: options?.bubbles ?? true,
      cancelable: options?.cancelable ?? true,
      clientX,
      clientY,
    };

    if (type.startsWith("touch")) {
      const touch = new Touch({
        identifier: 0,
        target: canvas,
        clientX,
        clientY,
      });

      const touchEvent = new TouchEvent(type, {
        ...eventOptions,
        touches: type === "touchend" ? [] : [touch],
        targetTouches: type === "touchend" ? [] : [touch],
        changedTouches: [touch],
      });

      canvas.dispatchEvent(touchEvent);
    } else {
      const mouseEvent = new MouseEvent(type, eventOptions);
      canvas.dispatchEvent(mouseEvent);
    }
  }, event);
}

/**
 * Perform a drag gesture on the canvas from one position to another.
 *
 * @param page - Playwright page instance
 * @param fromX - Starting X position
 * @param fromY - Starting Y position
 * @param toX - Ending X position
 * @param toY - Ending Y position
 * @param steps - Number of intermediate move events (default: 10)
 */
export async function dragOnCanvas(
  page: Page,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  steps = 10
): Promise<void> {
  // Mouse down at start position
  await dispatchCanvasEvent(page, { type: "mousedown", x: fromX, y: fromY });

  // Interpolate movement
  for (let i = 1; i <= steps; i++) {
    const progress = i / steps;
    const x = fromX + (toX - fromX) * progress;
    const y = fromY + (toY - fromY) * progress;
    await dispatchCanvasEvent(page, { type: "mousemove", x, y });
    await page.waitForTimeout(16); // ~60fps
  }

  // Mouse up at end position
  await dispatchCanvasEvent(page, { type: "mouseup", x: toX, y: toY });
}

/**
 * Move the player to a specific X position using mouse drag.
 *
 * @param page - Playwright page instance
 * @param targetX - Target X position
 */
export async function movePlayerTo(page: Page, targetX: number): Promise<void> {
  const snapshot = await getSnapshot(page);
  if (!snapshot?.player) return;

  const canvasHeight = snapshot.canvasHeight;
  const playerY = canvasHeight * 0.8; // Player is near bottom

  await dragOnCanvas(page, snapshot.player.x, playerY, targetX, playerY);
}

// ── Storage Helpers ────────────────────────────────────────────────

/**
 * Set a value in localStorage.
 *
 * @param page - Playwright page instance
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified if not a string)
 */
export async function setStorageValue(page: Page, key: string, value: unknown): Promise<void> {
  await page.evaluate(
    ({ k, v }) => {
      const stringValue = typeof v === "string" ? v : JSON.stringify(v);
      localStorage.setItem(k, stringValue);
    },
    { k: key, v: value }
  );
}

/**
 * Get a value from localStorage.
 *
 * @param page - Playwright page instance
 * @param key - Storage key
 * @returns Parsed value or null if not found
 */
export async function getStorageValue<T>(page: Page, key: string): Promise<T | null> {
  return page.evaluate((k) => {
    const value = localStorage.getItem(k);
    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }, key);
}

/**
 * Clear all game-related localStorage values.
 *
 * @param page - Playwright page instance
 */
export async function clearGameStorage(page: Page): Promise<void> {
  await page.evaluate((keys) => {
    for (const key of Object.values(keys)) {
      localStorage.removeItem(key);
    }
  }, STORAGE_KEYS);
}

// ── Polling Helpers ────────────────────────────────────────────────

/**
 * Wait until the game score exceeds a threshold.
 *
 * @param page - Playwright page instance
 * @param minScore - Minimum score to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 15000)
 */
export async function waitForScore(page: Page, minScore: number, timeout = 15000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const win = window as Window & { __game?: { getTestSnapshot: () => { score: number } } };
      const game = win.__game;
      const snap = game?.getTestSnapshot();
      return snap && snap.score > min;
    },
    minScore,
    { timeout }
  );
}

/**
 * Wait until the game is in playing state.
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 */
export async function waitForPlaying(page: Page, timeout = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      const win = window as Window & { __game?: { getTestSnapshot: () => { isPlaying: boolean } } };
      const game = win.__game;
      const snap = game?.getTestSnapshot();
      return snap?.isPlaying === true;
    },
    { timeout }
  );
}

/**
 * Wait until the game is over (not playing and lives = 0).
 *
 * @param page - Playwright page instance
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 */
export async function waitForGameOver(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    () => {
      const win = window as Window & {
        __game?: { getTestSnapshot: () => { isPlaying: boolean; lives: number } };
      };
      const game = win.__game;
      const snap = game?.getTestSnapshot();
      return snap && !snap.isPlaying && snap.lives === 0;
    },
    { timeout }
  );
}

// ── UI Helpers ─────────────────────────────────────────────────────

/**
 * Click the pause button during gameplay.
 *
 * @param page - Playwright page instance
 */
export async function clickPause(page: Page): Promise<void> {
  const pauseButton = page
    .locator('[data-testid="pause-button"]')
    .or(page.locator('button:has-text("⏸")'))
    .or(page.locator('button[aria-label*="pause" i]'));

  // Try to find any pause button
  if (
    await pauseButton
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false)
  ) {
    await pauseButton.first().click();
  }
}

/**
 * Click the resume button from pause menu.
 *
 * @param page - Playwright page instance
 */
export async function clickResume(page: Page): Promise<void> {
  const resumeButton = page.getByText("RESUME", { exact: true });
  await resumeButton.click();
}

/**
 * Click the bank button to bank the current stack.
 *
 * @param page - Playwright page instance
 */
export async function clickBank(page: Page): Promise<void> {
  // Bank is typically triggered via the game API
  await page.evaluate(() => {
    const win = window as Window & { __game?: { bankStack: () => void } };
    win.__game?.bankStack();
  });
}

/**
 * Trigger the bank action via the game API.
 *
 * @param page - Playwright page instance
 */
export async function bankStack(page: Page): Promise<void> {
  await page.evaluate(() => {
    const win = window as Window & { __game?: { bankStack: () => void } };
    win.__game?.bankStack();
  });
}

// ── Error Monitoring ───────────────────────────────────────────────

/**
 * Set up console error monitoring on a page.
 * Returns arrays that will be populated with errors and exceptions.
 *
 * @param page - Playwright page instance
 * @returns Object with errors and exceptions arrays
 */
export function setupErrorMonitoring(page: Page): {
  errors: string[];
  exceptions: string[];
} {
  const errors: string[] = [];
  const exceptions: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Filter out expected/benign errors
      if (
        !text.includes("AudioContext") &&
        !text.includes("autoplay") &&
        !text.includes("net::ERR") &&
        !text.includes("NotAllowedError") &&
        !text.includes("play()")
      ) {
        errors.push(text);
      }
    }
  });

  page.on("pageerror", (error) => {
    exceptions.push(error.message);
  });

  return { errors, exceptions };
}

// ── Combined Setup Helpers ─────────────────────────────────────────

/**
 * Start a game and wait for the game instance to be available.
 * Combines startGame and waitForGameInstance.
 *
 * @param page - Playwright page instance
 * @returns true if game started successfully
 */
export async function startGameAndWait(page: Page): Promise<boolean> {
  await startGame(page);
  return waitForGameInstance(page);
}
