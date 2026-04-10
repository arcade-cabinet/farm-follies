/**
 * Wait Condition Functions
 *
 * Provides condition functions for waiting on specific game states.
 * These are used with waitForCondition() to poll until a condition is met.
 *
 * Requirements: 8.1, 8.2, 8.3
 */

// ── Types ──────────────────────────────────────────────────────────

/**
 * Snapshot of the current game state.
 * Returned by window.__game.getTestSnapshot() in dev mode.
 */
export interface GameSnapshot {
  player: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;

  fallingAnimals: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    velocityX: number;
    velocityY: number;
    type?: string;
    isSpecial?: boolean;
  }>;

  fallingPowerUps?: Array<{
    id: string;
    x: number;
    y: number;
    type: string;
  }>;

  stackedAnimals?: Array<{
    id: string;
    type: string;
    isSpecial?: boolean;
  }>;

  score: number;
  lives: number;
  level: number;
  combo: number;
  stackHeight: number;
  bankedAnimals: number;
  canBank: boolean;
  isPlaying: boolean;
  isPaused?: boolean;
  canvasWidth: number;
  canvasHeight: number;

  // Power-up states
  isInvincible?: boolean;
  hasDoublePoints?: boolean;
  hasMagnet?: boolean;

  // Wobble state
  wobbleIntensity?: number;
  wobbleWarning?: boolean;

  // Tornado state
  tornado?: {
    x: number;
    y: number;
    direction: number;
  };

  // Bushes
  bushes?: Array<{
    x: number;
    y: number;
    growthStage: number;
    bounceStrength: number;
  }>;
}

/**
 * A condition function that evaluates a game snapshot.
 * Returns true when the condition is met.
 */
export type ConditionFn = (snapshot: GameSnapshot) => boolean;

// ── Condition Factory Functions ────────────────────────────────────

/**
 * Condition: Score is above a minimum value.
 *
 * @param min - Minimum score threshold
 * @returns ConditionFn
 */
export function scoreAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.score > min;
}

/**
 * Condition: Score is at least a minimum value.
 *
 * @param min - Minimum score threshold (inclusive)
 * @returns ConditionFn
 */
export function scoreAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.score >= min;
}

/**
 * Condition: Lives equal a specific count.
 *
 * @param count - Expected lives count
 * @returns ConditionFn
 */
export function livesEqual(count: number): ConditionFn {
  return (snap: GameSnapshot) => snap.lives === count;
}

/**
 * Condition: Lives are below a threshold.
 *
 * @param max - Maximum lives threshold
 * @returns ConditionFn
 */
export function livesBelow(max: number): ConditionFn {
  return (snap: GameSnapshot) => snap.lives < max;
}

/**
 * Condition: Lives are above a threshold.
 *
 * @param min - Minimum lives threshold
 * @returns ConditionFn
 */
export function livesAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.lives > min;
}

/**
 * Condition: Stack height is above a minimum.
 *
 * @param min - Minimum stack height
 * @returns ConditionFn
 */
export function stackHeightAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.stackHeight > min;
}

/**
 * Condition: Stack height is at least a minimum.
 *
 * @param min - Minimum stack height (inclusive)
 * @returns ConditionFn
 */
export function stackHeightAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.stackHeight >= min;
}

/**
 * Condition: Stack height equals a specific value.
 *
 * @param count - Expected stack height
 * @returns ConditionFn
 */
export function stackHeightEqual(count: number): ConditionFn {
  return (snap: GameSnapshot) => snap.stackHeight === count;
}

/**
 * Condition: Game is in playing state.
 *
 * @returns ConditionFn
 */
export function isPlaying(): ConditionFn {
  return (snap: GameSnapshot) => snap.isPlaying;
}

/**
 * Condition: Game is not in playing state.
 *
 * @returns ConditionFn
 */
export function isNotPlaying(): ConditionFn {
  return (snap: GameSnapshot) => !snap.isPlaying;
}

/**
 * Condition: Game is over (not playing and lives = 0).
 *
 * @returns ConditionFn
 */
export function isGameOver(): ConditionFn {
  return (snap: GameSnapshot) => !snap.isPlaying && snap.lives === 0;
}

/**
 * Condition: Game is paused.
 *
 * @returns ConditionFn
 */
export function isPaused(): ConditionFn {
  return (snap: GameSnapshot) => snap.isPaused === true;
}

/**
 * Condition: Banking is available (stack >= 5).
 *
 * @returns ConditionFn
 */
export function canBank(): ConditionFn {
  return (snap: GameSnapshot) => snap.canBank;
}

/**
 * Condition: Banking is not available.
 *
 * @returns ConditionFn
 */
export function cannotBank(): ConditionFn {
  return (snap: GameSnapshot) => !snap.canBank;
}

/**
 * Condition: Level is above a minimum.
 *
 * @param min - Minimum level
 * @returns ConditionFn
 */
export function levelAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.level > min;
}

/**
 * Condition: Level is at least a minimum.
 *
 * @param min - Minimum level (inclusive)
 * @returns ConditionFn
 */
export function levelAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.level >= min;
}

/**
 * Condition: Combo is above a minimum.
 *
 * @param min - Minimum combo
 * @returns ConditionFn
 */
export function comboAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.combo > min;
}

/**
 * Condition: Combo is at least a minimum.
 *
 * @param min - Minimum combo (inclusive)
 * @returns ConditionFn
 */
export function comboAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.combo >= min;
}

/**
 * Condition: Combo equals a specific value.
 *
 * @param count - Expected combo value
 * @returns ConditionFn
 */
export function comboEqual(count: number): ConditionFn {
  return (snap: GameSnapshot) => snap.combo === count;
}

/**
 * Condition: There are falling animals on screen.
 *
 * @returns ConditionFn
 */
export function hasFallingAnimals(): ConditionFn {
  return (snap: GameSnapshot) => snap.fallingAnimals.length > 0;
}

/**
 * Condition: There are no falling animals on screen.
 *
 * @returns ConditionFn
 */
export function noFallingAnimals(): ConditionFn {
  return (snap: GameSnapshot) => snap.fallingAnimals.length === 0;
}

/**
 * Condition: Number of falling animals is at least a minimum.
 *
 * @param min - Minimum number of falling animals
 * @returns ConditionFn
 */
export function fallingAnimalsAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.fallingAnimals.length >= min;
}

/**
 * Condition: There are falling power-ups on screen.
 *
 * @returns ConditionFn
 */
export function hasFallingPowerUps(): ConditionFn {
  return (snap: GameSnapshot) => (snap.fallingPowerUps?.length ?? 0) > 0;
}

/**
 * Condition: There are no falling power-ups on screen.
 *
 * @returns ConditionFn
 */
export function noFallingPowerUps(): ConditionFn {
  return (snap: GameSnapshot) => (snap.fallingPowerUps?.length ?? 0) === 0;
}

/**
 * Condition: Banked animals count is above a minimum.
 *
 * @param min - Minimum banked animals
 * @returns ConditionFn
 */
export function bankedAnimalsAbove(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.bankedAnimals > min;
}

/**
 * Condition: Banked animals count is at least a minimum.
 *
 * @param min - Minimum banked animals (inclusive)
 * @returns ConditionFn
 */
export function bankedAnimalsAtLeast(min: number): ConditionFn {
  return (snap: GameSnapshot) => snap.bankedAnimals >= min;
}

/**
 * Condition: Player is invincible.
 *
 * @returns ConditionFn
 */
export function isInvincible(): ConditionFn {
  return (snap: GameSnapshot) => snap.isInvincible === true;
}

/**
 * Condition: Player is not invincible.
 *
 * @returns ConditionFn
 */
export function isNotInvincible(): ConditionFn {
  return (snap: GameSnapshot) => snap.isInvincible !== true;
}

/**
 * Condition: Double points is active.
 *
 * @returns ConditionFn
 */
export function hasDoublePoints(): ConditionFn {
  return (snap: GameSnapshot) => snap.hasDoublePoints === true;
}

/**
 * Condition: Magnet power-up is active.
 *
 * @returns ConditionFn
 */
export function hasMagnet(): ConditionFn {
  return (snap: GameSnapshot) => snap.hasMagnet === true;
}

/**
 * Condition: Wobble is in warning state.
 *
 * @returns ConditionFn
 */
export function wobbleWarning(): ConditionFn {
  return (snap: GameSnapshot) => snap.wobbleWarning === true;
}

/**
 * Condition: Wobble intensity is above a threshold.
 *
 * @param threshold - Wobble intensity threshold
 * @returns ConditionFn
 */
export function wobbleAbove(threshold: number): ConditionFn {
  return (snap: GameSnapshot) => (snap.wobbleIntensity ?? 0) > threshold;
}

/**
 * Condition: Player X position is within a range.
 *
 * @param minX - Minimum X position
 * @param maxX - Maximum X position
 * @returns ConditionFn
 */
export function playerInRange(minX: number, maxX: number): ConditionFn {
  return (snap: GameSnapshot) => {
    if (!snap.player) return false;
    return snap.player.x >= minX && snap.player.x <= maxX;
  };
}

/**
 * Condition: Player X position is near a target.
 *
 * @param targetX - Target X position
 * @param tolerance - Acceptable distance from target (default: 20)
 * @returns ConditionFn
 */
export function playerNear(targetX: number, tolerance = 20): ConditionFn {
  return (snap: GameSnapshot) => {
    if (!snap.player) return false;
    return Math.abs(snap.player.x - targetX) <= tolerance;
  };
}

/**
 * Condition: There are bushes on screen.
 *
 * @returns ConditionFn
 */
export function hasBushes(): ConditionFn {
  return (snap: GameSnapshot) => (snap.bushes?.length ?? 0) > 0;
}

/**
 * Condition: There are no bushes on screen.
 *
 * @returns ConditionFn
 */
export function noBushes(): ConditionFn {
  return (snap: GameSnapshot) => (snap.bushes?.length ?? 0) === 0;
}

/**
 * Condition: A specific animal type is falling.
 *
 * @param type - Animal type to check for
 * @returns ConditionFn
 */
export function hasFallingAnimalType(type: string): ConditionFn {
  return (snap: GameSnapshot) => snap.fallingAnimals.some((a) => a.type === type);
}

/**
 * Condition: A special animal is falling.
 *
 * @returns ConditionFn
 */
export function hasSpecialAnimal(): ConditionFn {
  return (snap: GameSnapshot) => snap.fallingAnimals.some((a) => a.isSpecial === true);
}

// ── Compound Conditions ────────────────────────────────────────────

/**
 * Combine multiple conditions with AND logic.
 * All conditions must be true.
 *
 * @param conditions - Array of condition functions
 * @returns ConditionFn
 */
export function and(...conditions: ConditionFn[]): ConditionFn {
  return (snap: GameSnapshot) => conditions.every((cond) => cond(snap));
}

/**
 * Combine multiple conditions with OR logic.
 * At least one condition must be true.
 *
 * @param conditions - Array of condition functions
 * @returns ConditionFn
 */
export function or(...conditions: ConditionFn[]): ConditionFn {
  return (snap: GameSnapshot) => conditions.some((cond) => cond(snap));
}

/**
 * Negate a condition.
 *
 * @param condition - Condition to negate
 * @returns ConditionFn
 */
export function not(condition: ConditionFn): ConditionFn {
  return (snap: GameSnapshot) => !condition(snap);
}

// ── Pre-built Condition Sets ───────────────────────────────────────

/**
 * Common condition sets for convenience.
 */
export const CONDITIONS = {
  // Score conditions
  scoreAbove,
  scoreAtLeast,

  // Lives conditions
  livesEqual,
  livesBelow,
  livesAbove,

  // Stack conditions
  stackHeightAbove,
  stackHeightAtLeast,
  stackHeightEqual,

  // Game state conditions
  isPlaying,
  isNotPlaying,
  isGameOver,
  isPaused,

  // Banking conditions
  canBank,
  cannotBank,

  // Level conditions
  levelAbove,
  levelAtLeast,

  // Combo conditions
  comboAbove,
  comboAtLeast,
  comboEqual,

  // Entity conditions
  hasFallingAnimals,
  noFallingAnimals,
  fallingAnimalsAtLeast,
  hasFallingPowerUps,
  noFallingPowerUps,
  bankedAnimalsAbove,
  bankedAnimalsAtLeast,

  // Power-up state conditions
  isInvincible,
  isNotInvincible,
  hasDoublePoints,
  hasMagnet,

  // Physics conditions
  wobbleWarning,
  wobbleAbove,

  // Position conditions
  playerInRange,
  playerNear,

  // Bush conditions
  hasBushes,
  noBushes,

  // Animal type conditions
  hasFallingAnimalType,
  hasSpecialAnimal,

  // Logical combinators
  and,
  or,
  not,
} as const;

export default CONDITIONS;
