/**
 * Test Governor Implementation
 *
 * An automated player controller that can be injected into the browser context
 * via Playwright to simulate gameplay. The governor reads game state via
 * window.__game.getTestSnapshot() and dispatches input events to control the player.
 *
 * Features:
 * - Configurable catch strategies (nearest, highest-value, random)
 * - Automatic banking when stack reaches threshold
 * - Ability activation support
 * - Statistics tracking for test validation
 *
 * Requirements: 24.3, 24.4
 */

import type { Page } from "@playwright/test";

// ── Types ──────────────────────────────────────────────────────────

/**
 * Configuration options for the Test Governor.
 */
export interface GovernorConfig {
  /** Strategy for catching animals: 'nearest', 'highest-value', or 'random' */
  catchStrategy: "nearest" | "highest-value" | "random";
  /** Stack height at which to automatically bank (0 = never auto-bank) */
  bankThreshold: number;
  /** Movement speed multiplier (1.0 = normal) */
  speedMultiplier: number;
  /** Whether to activate special abilities when available */
  useAbilities: boolean;
}

/**
 * Statistics tracked by the Test Governor.
 */
export interface GovernorStats {
  /** Total frames the governor has run */
  framesRun: number;
  /** Number of catch attempts (movements toward animals) */
  catchAttempts: number;
  /** Number of times banking was triggered */
  banksTriggered: number;
  /** Frames where no action was taken (no targets) */
  idleFrames: number;
  /** Number of abilities activated */
  abilitiesUsed: number;
}

// ── Default Configuration ──────────────────────────────────────────

export const DEFAULT_GOVERNOR_CONFIG: GovernorConfig = {
  catchStrategy: "nearest",
  bankThreshold: 5,
  speedMultiplier: 2.0, // Increased for more aggressive catching
  useAbilities: true,
};

// ── Animal Point Values ────────────────────────────────────────────

/**
 * Point values for each animal type, used by the 'highest-value' strategy.
 * These match the values defined in ANIMAL_ARCHETYPES.
 */
const ANIMAL_POINT_VALUES: Record<string, number> = {
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

// ── Governor Code (Injected into Browser) ──────────────────────────

/**
 * The governor code that runs inside the browser context.
 * This is serialized and injected via page.evaluate().
 */
const GOVERNOR_BROWSER_CODE = `
(function() {
  // Point values for highest-value strategy
  const ANIMAL_POINT_VALUES = ${JSON.stringify(ANIMAL_POINT_VALUES)};

  // Governor state
  const state = {
    config: {
      catchStrategy: 'nearest',
      bankThreshold: 5,
      speedMultiplier: 2.0,
      useAbilities: true
    },
    stats: {
      framesRun: 0,
      catchAttempts: 0,
      banksTriggered: 0,
      idleFrames: 0,
      abilitiesUsed: 0
    },
    running: false,
    animationFrameId: null,
    lastTargetId: null,
    currentPrediction: null // Stores predicted intercept position for current target
  };

  /**
   * Get the game test snapshot.
   */
  function getSnapshot() {
    const game = window.__game;
    return game?.getTestSnapshot() ?? null;
  }

  /**
   * Dispatch a mouse event to the canvas.
   */
  function dispatchMouseEvent(type, x, y) {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = rect.left + x;
    const clientY = rect.top + y;

    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX,
      clientY
    });

    canvas.dispatchEvent(event);
  }

  /**
   * Calculate distance between two points.
   */
  function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  /**
   * Get the point value for an animal.
   */
  function getAnimalValue(animal) {
    const baseValue = ANIMAL_POINT_VALUES[animal.type] ?? 10;
    // Special animals are worth more
    return animal.isSpecial ? baseValue * 2 : baseValue;
  }

  /**
   * Calculate urgency score based on vertical position.
   * Animals closer to the catch zone (higher Y) are more urgent.
   * Returns a value from 0 (top of screen) to 1 (at catch zone).
   */
  function calculateUrgency(animal, snapshot) {
    // Player is at approximately 85% of canvas height
    const catchZoneY = snapshot.canvasHeight * 0.85;
    // Normalize Y position relative to catch zone
    // Animals at or below catch zone have urgency 1.0
    const urgency = Math.min(animal.y / catchZoneY, 1.0);
    return urgency;
  }

  /**
   * Predict where an animal will be when the player can reach it.
   * Accounts for:
   * - Time for player to move horizontally to intercept
   * - Animal's vertical fall speed
   * - Animal's horizontal drift
   * 
   * Returns predicted position { x, y } and time to intercept.
   */
  function predictInterceptPosition(animal, playerX, snapshot) {
    const catchZoneY = snapshot.canvasHeight * 0.85;
    const playerSpeed = 15 * state.config.speedMultiplier; // pixels per frame
    
    // Get animal velocities (velocityX may be undefined in older snapshots)
    const animalVelocityX = animal.velocityX ?? 0;
    const animalVelocityY = animal.velocityY ?? 3; // Default fall speed
    
    // Calculate time until animal reaches catch zone
    const distanceToFall = catchZoneY - animal.y;
    if (distanceToFall <= 0 || animalVelocityY <= 0) {
      // Animal is already at or past catch zone
      return { x: animal.x, y: animal.y, timeToIntercept: 0, reachable: true };
    }
    
    const timeToReachCatchZone = distanceToFall / animalVelocityY;
    
    // Predict where animal will be horizontally when it reaches catch zone
    const predictedX = animal.x + (animalVelocityX * timeToReachCatchZone);
    
    // Clamp predicted X to canvas bounds
    const clampedPredictedX = Math.max(
      animal.width / 2,
      Math.min(snapshot.canvasWidth - animal.width / 2, predictedX)
    );
    
    // Calculate time for player to reach predicted position
    const horizontalDistance = Math.abs(clampedPredictedX - playerX);
    const timeForPlayerToReach = horizontalDistance / playerSpeed;
    
    // Check if player can reach the intercept point in time
    const reachable = timeForPlayerToReach <= timeToReachCatchZone * 1.2; // 20% buffer
    
    return {
      x: clampedPredictedX,
      y: catchZoneY,
      timeToIntercept: timeToReachCatchZone,
      reachable
    };
  }

  /**
   * Check if an animal is reachable given player's current position and movement speed.
   * Uses trajectory prediction to determine if player can intercept the animal.
   * Returns a reachability score (0-1) where 1 is easily reachable.
   */
  function calculateReachability(animal, playerX, snapshot) {
    const prediction = predictInterceptPosition(animal, playerX, snapshot);
    
    if (!prediction.reachable) {
      return 0; // Cannot reach in time
    }
    
    // Calculate reachability based on how much time buffer we have
    const playerSpeed = 15 * state.config.speedMultiplier;
    const horizontalDistance = Math.abs(prediction.x - playerX);
    const timeForPlayerToReach = horizontalDistance / playerSpeed;
    
    // More reachable if we have more time buffer
    const timeRatio = prediction.timeToIntercept > 0 
      ? timeForPlayerToReach / prediction.timeToIntercept 
      : 0;
    
    // Score from 0 to 1, where lower timeRatio = more reachable
    const reachability = Math.max(0, 1 - timeRatio);
    return reachability;
  }

  /**
   * Find the best target using urgency-weighted scoring with trajectory prediction.
   * Prioritizes animals that are:
   * 1. Closer to the catch zone (higher urgency)
   * 2. Reachable by the player (accounting for predicted position)
   * 3. Have a favorable intercept trajectory
   */
  function findBestTarget(animals, playerX, snapshot) {
    let best = null;
    let bestScore = -Infinity;
    let bestPrediction = null;

    for (const animal of animals) {
      const prediction = predictInterceptPosition(animal, playerX, snapshot);
      const urgency = calculateUrgency(animal, snapshot);
      const reachability = calculateReachability(animal, playerX, snapshot);
      
      // Skip animals that are too far to reach
      if (reachability < 0.05) continue;
      
      // Score formula: heavily weight urgency, but also consider reachability
      // Urgency is weighted 3x more than reachability to prioritize catching
      // animals that are about to be missed
      // Add bonus for animals with favorable intercept (less horizontal movement needed)
      const interceptBonus = prediction.reachable ? 0.5 : 0;
      const score = (urgency * 3.0) + (reachability * 1.0) + interceptBonus;
      
      if (score > bestScore) {
        bestScore = score;
        best = animal;
        bestPrediction = prediction;
      }
    }

    // Store the best prediction for use in movement
    if (best && bestPrediction) {
      state.currentPrediction = bestPrediction;
    }

    return best;
  }

  /**
   * Select a target animal based on the configured strategy.
   * All strategies now use trajectory prediction for better catching.
   */
  function selectTarget(snapshot, playerX) {
    const animals = snapshot.fallingAnimals;
    if (animals.length === 0) {
      state.currentPrediction = null;
      return null;
    }

    switch (state.config.catchStrategy) {
      case 'nearest': {
        // Use urgency-weighted algorithm that prioritizes animals closest to catch zone
        // while still considering horizontal reachability with trajectory prediction
        return findBestTarget(animals, playerX, snapshot);
      }

      case 'highest-value': {
        // Find the highest value animal that's reachable
        // Prioritize animals that are lower (closer to being caught/missed)
        // Uses trajectory prediction for accurate reachability
        let best = null;
        let bestScore = -Infinity;
        let bestPrediction = null;
        
        for (const animal of animals) {
          const value = getAnimalValue(animal);
          const urgency = calculateUrgency(animal, snapshot);
          const prediction = predictInterceptPosition(animal, playerX, snapshot);
          const reachability = calculateReachability(animal, playerX, snapshot);
          
          // Skip unreachable animals
          if (reachability < 0.05) continue;
          
          // Score combines value with urgency and reachability
          const score = value * (1 + urgency * 2.0) * (0.5 + reachability * 0.5);
          if (score > bestScore) {
            bestScore = score;
            best = animal;
            bestPrediction = prediction;
          }
        }
        
        if (best && bestPrediction) {
          state.currentPrediction = bestPrediction;
        }
        return best;
      }

      case 'random': {
        // Pick a random animal from reachable ones (using trajectory prediction)
        const reachable = animals.filter(a => 
          calculateReachability(a, playerX, snapshot) >= 0.05
        );
        if (reachable.length === 0) {
          state.currentPrediction = null;
          return animals[0];
        }
        const index = Math.floor(Math.random() * reachable.length);
        const selected = reachable[index];
        // Calculate prediction for the selected animal
        state.currentPrediction = predictInterceptPosition(selected, playerX, snapshot);
        return selected;
      }

      default:
        return findBestTarget(animals, playerX, snapshot);
    }
  }

  /**
   * Check if any stacked animal has an ability ready.
   */
  function findReadyAbility(snapshot) {
    const stackedAnimals = snapshot.stackedAnimals ?? [];
    for (const animal of stackedAnimals) {
      if (animal.isSpecial && animal.abilityReady) {
        return animal;
      }
    }
    return null;
  }

  /**
   * Activate an ability by tapping on the stack.
   */
  function activateAbility(snapshot) {
    if (!snapshot.player) return false;

    // Tap on the stack area to activate ability
    const tapX = snapshot.player.x;
    const tapY = snapshot.player.y - (snapshot.stackHeight * 30); // Approximate stack position

    dispatchMouseEvent('mousedown', tapX, tapY);
    dispatchMouseEvent('mouseup', tapX, tapY);

    return true;
  }

  /**
   * Trigger banking via the game API.
   */
  function triggerBank() {
    const game = window.__game;
    if (game?.bankStack) {
      game.bankStack();
      return true;
    }
    return false;
  }

  /**
   * Main governor update loop.
   */
  function update() {
    if (!state.running) return;

    state.stats.framesRun++;

    const snapshot = getSnapshot();
    if (!snapshot || !snapshot.isPlaying) {
      state.stats.idleFrames++;
      state.animationFrameId = requestAnimationFrame(update);
      return;
    }

    const player = snapshot.player;
    if (!player) {
      state.stats.idleFrames++;
      state.animationFrameId = requestAnimationFrame(update);
      return;
    }

    // Check if we should bank
    if (state.config.bankThreshold > 0 && snapshot.canBank && snapshot.stackHeight >= state.config.bankThreshold) {
      if (triggerBank()) {
        state.stats.banksTriggered++;
      }
    }

    // Check if we should use an ability
    if (state.config.useAbilities) {
      const readyAbility = findReadyAbility(snapshot);
      if (readyAbility) {
        if (activateAbility(snapshot)) {
          state.stats.abilitiesUsed++;
        }
      }
    }

    // Select a target animal
    const target = selectTarget(snapshot, player.x);

    if (target) {
      // Track if this is a new catch attempt
      if (target.id !== state.lastTargetId) {
        state.stats.catchAttempts++;
        state.lastTargetId = target.id;
      }

      // Use predicted intercept position if available, otherwise use current position
      // This accounts for animal horizontal drift and fall trajectory
      const targetX = state.currentPrediction ? state.currentPrediction.x : target.x;
      const currentX = player.x;
      const diff = targetX - currentX;

      // Apply speed multiplier
      const moveSpeed = 15 * state.config.speedMultiplier;
      const moveAmount = Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);

      // Move player toward predicted intercept point
      const newX = currentX + moveAmount;
      const playerY = snapshot.canvasHeight * 0.85; // Player is near bottom

      // Dispatch drag events to move player
      dispatchMouseEvent('mousedown', currentX, playerY);
      dispatchMouseEvent('mousemove', newX, playerY);
      dispatchMouseEvent('mouseup', newX, playerY);
    } else {
      state.stats.idleFrames++;
      state.lastTargetId = null;
      state.currentPrediction = null;
    }

    state.animationFrameId = requestAnimationFrame(update);
  }

  // Expose governor API on window
  window.__testGovernor = {
    start() {
      if (state.running) return;
      state.running = true;
      state.animationFrameId = requestAnimationFrame(update);
    },

    stop() {
      state.running = false;
      if (state.animationFrameId !== null) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
    },

    getStats() {
      return { ...state.stats };
    },

    setConfig(config) {
      Object.assign(state.config, config);
    },

    getConfig() {
      return { ...state.config };
    },

    isRunning() {
      return state.running;
    },

    reset() {
      state.stats = {
        framesRun: 0,
        catchAttempts: 0,
        banksTriggered: 0,
        idleFrames: 0,
        abilitiesUsed: 0
      };
      state.lastTargetId = null;
      state.currentPrediction = null;
    }
  };
})();
`;

// ── Playwright Helper Functions ────────────────────────────────────

/**
 * Inject the Test Governor into the browser context.
 * The governor will be available at window.__testGovernor.
 *
 * @param page - Playwright page instance
 * @param config - Optional governor configuration
 */
export async function injectGovernor(
  page: Page,
  config: Partial<GovernorConfig> = {}
): Promise<void> {
  // Inject the governor code
  await page.evaluate(GOVERNOR_BROWSER_CODE);

  // Apply any custom configuration
  if (Object.keys(config).length > 0) {
    await page.evaluate((cfg) => {
      const win = window as Window & { __testGovernor?: { setConfig: (c: unknown) => void } };
      win.__testGovernor?.setConfig(cfg);
    }, config);
  }
}

/**
 * Start the Test Governor.
 * The governor must be injected first via injectGovernor().
 *
 * @param page - Playwright page instance
 */
export async function startGovernor(page: Page): Promise<void> {
  await page.evaluate(() => {
    const win = window as Window & { __testGovernor?: { start: () => void } };
    win.__testGovernor?.start();
  });
}

/**
 * Stop the Test Governor and return its statistics.
 *
 * @param page - Playwright page instance
 * @returns Governor statistics
 */
export async function stopGovernor(page: Page): Promise<GovernorStats> {
  return page.evaluate(() => {
    const win = window as Window & {
      __testGovernor?: {
        stop: () => void;
        getStats: () => GovernorStats;
      };
    };
    win.__testGovernor?.stop();
    return (
      win.__testGovernor?.getStats() ?? {
        framesRun: 0,
        catchAttempts: 0,
        banksTriggered: 0,
        idleFrames: 0,
        abilitiesUsed: 0,
      }
    );
  });
}

/**
 * Get the current governor statistics without stopping.
 *
 * @param page - Playwright page instance
 * @returns Governor statistics
 */
export async function getGovernorStats(page: Page): Promise<GovernorStats> {
  return page.evaluate(() => {
    const win = window as Window & {
      __testGovernor?: { getStats: () => GovernorStats };
    };
    return (
      win.__testGovernor?.getStats() ?? {
        framesRun: 0,
        catchAttempts: 0,
        banksTriggered: 0,
        idleFrames: 0,
        abilitiesUsed: 0,
      }
    );
  });
}

/**
 * Update the governor configuration while running.
 *
 * @param page - Playwright page instance
 * @param config - Partial configuration to update
 */
export async function setGovernorConfig(
  page: Page,
  config: Partial<GovernorConfig>
): Promise<void> {
  await page.evaluate((cfg) => {
    const win = window as Window & { __testGovernor?: { setConfig: (c: unknown) => void } };
    win.__testGovernor?.setConfig(cfg);
  }, config);
}

/**
 * Get the current governor configuration.
 *
 * @param page - Playwright page instance
 * @returns Current governor configuration
 */
export async function getGovernorConfig(page: Page): Promise<GovernorConfig> {
  return page.evaluate(() => {
    const win = window as Window & {
      __testGovernor?: { getConfig: () => GovernorConfig };
    };
    return (
      win.__testGovernor?.getConfig() ?? {
        catchStrategy: "nearest",
        bankThreshold: 5,
        speedMultiplier: 1.0,
        useAbilities: true,
      }
    );
  });
}

/**
 * Check if the governor is currently running.
 *
 * @param page - Playwright page instance
 * @returns true if governor is running
 */
export async function isGovernorRunning(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const win = window as Window & { __testGovernor?: { isRunning: () => boolean } };
    return win.__testGovernor?.isRunning() ?? false;
  });
}

/**
 * Reset the governor statistics.
 *
 * @param page - Playwright page instance
 */
export async function resetGovernorStats(page: Page): Promise<void> {
  await page.evaluate(() => {
    const win = window as Window & { __testGovernor?: { reset: () => void } };
    win.__testGovernor?.reset();
  });
}

/**
 * Inject and start the governor in one call.
 * Convenience function for common test setup.
 *
 * @param page - Playwright page instance
 * @param config - Optional governor configuration
 */
export async function injectAndStartGovernor(
  page: Page,
  config: Partial<GovernorConfig> = {}
): Promise<void> {
  await injectGovernor(page, config);
  await startGovernor(page);
}

/**
 * Wait for the governor to run for a specified number of frames.
 *
 * @param page - Playwright page instance
 * @param minFrames - Minimum number of frames to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 15000)
 */
export async function waitForGovernorFrames(
  page: Page,
  minFrames: number,
  timeout = 15000
): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const win = window as Window & {
        __testGovernor?: { getStats: () => { framesRun: number } };
      };
      const stats = win.__testGovernor?.getStats();
      return stats && stats.framesRun >= min;
    },
    minFrames,
    { timeout }
  );
}

/**
 * Wait for the governor to make a specified number of catch attempts.
 *
 * @param page - Playwright page instance
 * @param minAttempts - Minimum number of catch attempts to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 15000)
 */
export async function waitForCatchAttempts(
  page: Page,
  minAttempts: number,
  timeout = 15000
): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const win = window as Window & {
        __testGovernor?: { getStats: () => { catchAttempts: number } };
      };
      const stats = win.__testGovernor?.getStats();
      return stats && stats.catchAttempts >= min;
    },
    minAttempts,
    { timeout }
  );
}

/**
 * Wait for the governor to trigger banking a specified number of times.
 *
 * @param page - Playwright page instance
 * @param minBanks - Minimum number of banks to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 30000)
 */
export async function waitForBanks(page: Page, minBanks: number, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    (min) => {
      const win = window as Window & {
        __testGovernor?: { getStats: () => { banksTriggered: number } };
      };
      const stats = win.__testGovernor?.getStats();
      return stats && stats.banksTriggered >= min;
    },
    minBanks,
    { timeout }
  );
}
