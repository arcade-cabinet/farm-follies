/**
 * Input Generators for Property-Based Tests
 *
 * Provides generators for creating test inputs with seeded random number generation
 * for reproducibility. These generators are used in property-based tests to validate
 * game behavior across many different input combinations.
 *
 * Features:
 * - Seeded random number generation for reproducible tests
 * - Position generators for collision detection testing
 * - Viewport generators for responsive scaling tests
 * - Catch zone and miss zone position generators
 * - Spawn position generators
 *
 * Requirements: 1.1, 5.1, 6.1
 */

// ── Types ──────────────────────────────────────────────────────────

/**
 * A seeded random number generator.
 * Uses a simple but effective mulberry32 algorithm.
 */
export interface SeededRandom {
  /** Get the next random number between 0 and 1 */
  next(): number;
  /** Get a random integer between min (inclusive) and max (exclusive) */
  nextInt(min: number, max: number): number;
  /** Get a random float between 0 and 1 */
  nextFloat(): number;
  /** Get a random float between min and max */
  nextFloat(min: number, max: number): number;
  /** Get a random boolean with optional probability */
  nextBool(probability?: number): boolean;
  /** Pick a random element from an array */
  pick<T>(array: T[]): T;
  /** Shuffle an array (returns new array) */
  shuffle<T>(array: T[]): T[];
  /** Get the current seed */
  getSeed(): number;
}

/**
 * A 2D position with x and y coordinates.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * A position with additional metadata for testing.
 */
export interface TestPosition extends Position {
  /** Description of what this position represents */
  description: string;
  /** Whether this position should result in a catch */
  shouldCatch?: boolean;
  /** Whether this is a "perfect" catch position */
  isPerfect?: boolean;
}

/**
 * Viewport configuration for responsive testing.
 */
export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Canvas bounds for position generation.
 */
export interface CanvasBounds {
  width: number;
  height: number;
  /** Width reserved for the bank area on the right */
  bankWidth?: number;
  /** Padding from edges */
  padding?: number;
}

/**
 * Player configuration for catch zone calculations.
 */
export interface PlayerConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Animal spawn configuration.
 */
export interface SpawnConfig {
  /** Minimum X position for spawning */
  minX: number;
  /** Maximum X position for spawning */
  maxX: number;
  /** Y position for spawning (typically at top) */
  spawnY: number;
}

// ── Constants ──────────────────────────────────────────────────────

/**
 * Default canvas dimensions based on game config.
 */
export const DEFAULT_CANVAS: CanvasBounds = {
  width: 800,
  height: 600,
  bankWidth: 65,
  padding: 50,
};

/**
 * Default player dimensions based on game config.
 */
export const DEFAULT_PLAYER = {
  width: 70,
  height: 90,
};

/**
 * Catch zone tolerances from game config.
 */
export const CATCH_TOLERANCES = {
  /** Perfect catch tolerance in pixels */
  perfect: 8,
  /** Good catch tolerance as fraction of player width */
  good: 0.5,
  /** Hit tolerance as fraction of player width */
  hit: 0.7,
};

/**
 * Standard viewport configurations for responsive testing.
 */
export const VIEWPORTS: ViewportConfig[] = [
  {
    name: "mobile-small",
    width: 320,
    height: 568,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  {
    name: "mobile",
    width: 375,
    height: 812,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  {
    name: "mobile-large",
    width: 414,
    height: 896,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  },
  {
    name: "tablet-portrait",
    width: 768,
    height: 1024,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  {
    name: "tablet-landscape",
    width: 1024,
    height: 768,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  {
    name: "desktop-small",
    width: 1280,
    height: 720,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "desktop",
    width: 1920,
    height: 1080,
    isMobile: false,
    hasTouch: false,
  },
  {
    name: "desktop-large",
    width: 2560,
    height: 1440,
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: 2,
  },
];

/**
 * Animal types from game config.
 */
export const ANIMAL_TYPES = [
  "chicken",
  "duck",
  "pig",
  "sheep",
  "goat",
  "cow",
  "goose",
  "horse",
  "rooster",
] as const;

/**
 * Power-up types from game config.
 */
export const POWER_UP_TYPES = [
  "hay_bale",
  "golden_egg",
  "water_trough",
  "salt_lick",
  "corn_feed",
  "lucky_horseshoe",
] as const;

// ── Seeded Random Number Generator ─────────────────────────────────

/**
 * Create a seeded random number generator using the mulberry32 algorithm.
 * This provides reproducible random sequences for property-based testing.
 *
 * @param seed - The seed value (defaults to current timestamp)
 * @returns A SeededRandom instance
 *
 * @example
 * ```typescript
 * const rng = createSeededRandom(12345);
 * console.log(rng.next()); // Always produces the same sequence
 * console.log(rng.nextInt(0, 100)); // Random int between 0-99
 * ```
 */
export function createSeededRandom(seed: number = Date.now()): SeededRandom {
  let state = seed >>> 0; // Ensure unsigned 32-bit integer

  /**
   * Mulberry32 algorithm - fast and good quality PRNG.
   */
  function mulberry32(): number {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next(): number {
      return mulberry32();
    },

    nextInt(min: number, max: number): number {
      return Math.floor(mulberry32() * (max - min)) + min;
    },

    nextFloat(min?: number, max?: number): number {
      if (min === undefined || max === undefined) {
        return mulberry32(); // Return 0-1 when no args
      }
      return mulberry32() * (max - min) + min;
    },

    nextBool(probability = 0.5): boolean {
      return mulberry32() < probability;
    },

    pick<T>(array: T[]): T {
      if (array.length === 0) {
        throw new Error("Cannot pick from empty array");
      }
      const index = Math.floor(mulberry32() * array.length);
      return array[index];
    },

    shuffle<T>(array: T[]): T[] {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(mulberry32() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },

    getSeed(): number {
      return seed;
    },
  };
}

// ── Position Generators ────────────────────────────────────────────

/**
 * Generate random X positions within canvas bounds.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param bounds - Canvas bounds configuration
 * @returns Array of X positions
 */
export function generateXPositions(
  rng: SeededRandom,
  count: number,
  bounds: CanvasBounds = DEFAULT_CANVAS
): number[] {
  const minX = bounds.padding ?? 50;
  const maxX = bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50);

  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(rng.nextFloat(minX, maxX));
  }
  return positions;
}

/**
 * Generate random Y positions for falling animals.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param bounds - Canvas bounds configuration
 * @returns Array of Y positions
 */
export function generateYPositions(
  rng: SeededRandom,
  count: number,
  bounds: CanvasBounds = DEFAULT_CANVAS
): number[] {
  const minY = 0;
  const maxY = bounds.height * 0.9; // Don't spawn below floor

  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(rng.nextFloat(minY, maxY));
  }
  return positions;
}

/**
 * Generate random 2D positions within canvas bounds.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param bounds - Canvas bounds configuration
 * @returns Array of Position objects
 */
export function generatePositions(
  rng: SeededRandom,
  count: number,
  bounds: CanvasBounds = DEFAULT_CANVAS
): Position[] {
  const xPositions = generateXPositions(rng, count, bounds);
  const yPositions = generateYPositions(rng, count, bounds);

  return xPositions.map((x, i) => ({ x, y: yPositions[i] }));
}

// ── Catch Zone Generators ──────────────────────────────────────────

/**
 * Generate positions within the catch zone for a given player position.
 * These positions should result in successful catches.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param player - Player configuration
 * @param stackHeight - Current stack height (affects catch zone position)
 * @returns Array of TestPosition objects
 */
export function generateCatchZonePositions(
  rng: SeededRandom,
  count: number,
  player: PlayerConfig,
  stackHeight = 0
): TestPosition[] {
  const positions: TestPosition[] = [];

  // Calculate catch zone bounds
  const catchWidth = player.width * CATCH_TOLERANCES.hit;
  const catchLeft = player.x - catchWidth / 2;
  const catchRight = player.x + catchWidth / 2;

  // Stack height affects the Y position of the catch zone
  const stackOffset = stackHeight * 30; // Approximate height per stacked animal
  const catchY = player.y - stackOffset;

  for (let i = 0; i < count; i++) {
    const x = rng.nextFloat(catchLeft, catchRight);
    const y = catchY - rng.nextFloat(0, 50); // Slightly above catch zone

    // Determine if this is a perfect catch
    const distFromCenter = Math.abs(x - player.x);
    const isPerfect = distFromCenter <= CATCH_TOLERANCES.perfect;

    positions.push({
      x,
      y,
      description: isPerfect ? "perfect catch position" : "catch zone position",
      shouldCatch: true,
      isPerfect,
    });
  }

  return positions;
}

/**
 * Generate positions outside the catch zone (for miss testing).
 * These positions should NOT result in catches.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param player - Player configuration
 * @param bounds - Canvas bounds configuration
 * @returns Array of TestPosition objects
 */
export function generateMissPositions(
  rng: SeededRandom,
  count: number,
  player: PlayerConfig,
  bounds: CanvasBounds = DEFAULT_CANVAS
): TestPosition[] {
  const positions: TestPosition[] = [];

  // Calculate catch zone bounds to avoid
  const catchWidth = player.width * CATCH_TOLERANCES.hit;
  const catchLeft = player.x - catchWidth / 2;
  const catchRight = player.x + catchWidth / 2;

  const minX = bounds.padding ?? 50;
  const maxX = bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50);

  for (let i = 0; i < count; i++) {
    let x: number;
    let description: string;

    // Randomly choose left or right of catch zone
    if (rng.nextBool()) {
      // Left of catch zone
      x = rng.nextFloat(minX, Math.max(minX, catchLeft - 20));
      description = "miss position (left of catch zone)";
    } else {
      // Right of catch zone
      x = rng.nextFloat(Math.min(maxX, catchRight + 20), maxX);
      description = "miss position (right of catch zone)";
    }

    // Y position below the player (past the catch window)
    const y = player.y + player.height + rng.nextFloat(10, 50);

    positions.push({
      x,
      y,
      description,
      shouldCatch: false,
      isPerfect: false,
    });
  }

  return positions;
}

/**
 * Generate edge case positions for catch zone testing.
 * Includes positions at exact boundaries.
 *
 * @param player - Player configuration
 * @param stackHeight - Current stack height
 * @returns Array of TestPosition objects for edge cases
 */
export function generateCatchZoneEdgeCases(player: PlayerConfig, stackHeight = 0): TestPosition[] {
  const catchWidth = player.width * CATCH_TOLERANCES.hit;
  const stackOffset = stackHeight * 30;
  const catchY = player.y - stackOffset;

  return [
    // Perfect center
    {
      x: player.x,
      y: catchY - 10,
      description: "exact center (perfect catch)",
      shouldCatch: true,
      isPerfect: true,
    },
    // Left edge of perfect zone
    {
      x: player.x - CATCH_TOLERANCES.perfect,
      y: catchY - 10,
      description: "left edge of perfect zone",
      shouldCatch: true,
      isPerfect: true,
    },
    // Right edge of perfect zone
    {
      x: player.x + CATCH_TOLERANCES.perfect,
      y: catchY - 10,
      description: "right edge of perfect zone",
      shouldCatch: true,
      isPerfect: true,
    },
    // Left edge of catch zone
    {
      x: player.x - catchWidth / 2,
      y: catchY - 10,
      description: "left edge of catch zone",
      shouldCatch: true,
      isPerfect: false,
    },
    // Right edge of catch zone
    {
      x: player.x + catchWidth / 2,
      y: catchY - 10,
      description: "right edge of catch zone",
      shouldCatch: true,
      isPerfect: false,
    },
    // Just outside left edge
    {
      x: player.x - catchWidth / 2 - 5,
      y: catchY - 10,
      description: "just outside left edge (miss)",
      shouldCatch: false,
      isPerfect: false,
    },
    // Just outside right edge
    {
      x: player.x + catchWidth / 2 + 5,
      y: catchY - 10,
      description: "just outside right edge (miss)",
      shouldCatch: false,
      isPerfect: false,
    },
  ];
}

// ── Spawn Position Generators ──────────────────────────────────────

/**
 * Generate valid spawn positions for animals.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param bounds - Canvas bounds configuration
 * @returns Array of Position objects
 */
export function generateSpawnPositions(
  rng: SeededRandom,
  count: number,
  bounds: CanvasBounds = DEFAULT_CANVAS
): Position[] {
  const minX = bounds.padding ?? 50;
  const maxX = bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50);
  const spawnY = bounds.height * 0.08; // Tornado rail Y position

  const positions: Position[] = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: rng.nextFloat(minX, maxX),
      y: spawnY,
    });
  }
  return positions;
}

/**
 * Generate spawn position edge cases.
 *
 * @param bounds - Canvas bounds configuration
 * @returns Array of TestPosition objects for edge cases
 */
export function generateSpawnEdgeCases(bounds: CanvasBounds = DEFAULT_CANVAS): TestPosition[] {
  const minX = bounds.padding ?? 50;
  const maxX = bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50);
  const spawnY = bounds.height * 0.08;

  return [
    {
      x: minX,
      y: spawnY,
      description: "left boundary spawn",
      shouldCatch: undefined,
    },
    {
      x: maxX,
      y: spawnY,
      description: "right boundary spawn",
      shouldCatch: undefined,
    },
    {
      x: (minX + maxX) / 2,
      y: spawnY,
      description: "center spawn",
      shouldCatch: undefined,
    },
    {
      x: minX + (maxX - minX) * 0.25,
      y: spawnY,
      description: "left quarter spawn",
      shouldCatch: undefined,
    },
    {
      x: minX + (maxX - minX) * 0.75,
      y: spawnY,
      description: "right quarter spawn",
      shouldCatch: undefined,
    },
  ];
}

// ── Viewport Generators ────────────────────────────────────────────

/**
 * Generate a random viewport configuration.
 *
 * @param rng - Seeded random number generator
 * @returns A ViewportConfig object
 */
export function generateRandomViewport(rng: SeededRandom): ViewportConfig {
  return rng.pick(VIEWPORTS);
}

/**
 * Generate multiple random viewport configurations.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of viewports to generate
 * @returns Array of ViewportConfig objects
 */
export function generateViewports(rng: SeededRandom, count: number): ViewportConfig[] {
  const viewports: ViewportConfig[] = [];
  for (let i = 0; i < count; i++) {
    viewports.push(generateRandomViewport(rng));
  }
  return viewports;
}

/**
 * Generate a custom viewport with random dimensions within reasonable bounds.
 *
 * @param rng - Seeded random number generator
 * @returns A ViewportConfig object with random dimensions
 */
export function generateCustomViewport(rng: SeededRandom): ViewportConfig {
  const isMobile = rng.nextBool(0.6); // 60% chance of mobile

  if (isMobile) {
    return {
      name: "custom-mobile",
      width: rng.nextInt(320, 500),
      height: rng.nextInt(568, 900),
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: rng.pick([1, 2, 3]),
    };
  }

  return {
    name: "custom-desktop",
    width: rng.nextInt(1024, 2560),
    height: rng.nextInt(600, 1440),
    isMobile: false,
    hasTouch: false,
    deviceScaleFactor: rng.pick([1, 2]),
  };
}

// ── Player Position Generators ─────────────────────────────────────

/**
 * Generate random player X positions within bounds.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of positions to generate
 * @param bounds - Canvas bounds configuration
 * @returns Array of X positions
 */
export function generatePlayerPositions(
  rng: SeededRandom,
  count: number,
  bounds: CanvasBounds = DEFAULT_CANVAS
): number[] {
  const minX = (bounds.padding ?? 50) + DEFAULT_PLAYER.width / 2;
  const maxX =
    bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50) - DEFAULT_PLAYER.width / 2;

  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(rng.nextFloat(minX, maxX));
  }
  return positions;
}

/**
 * Generate player boundary edge cases.
 *
 * @param bounds - Canvas bounds configuration
 * @returns Array of X positions at boundaries
 */
export function generatePlayerBoundaryEdgeCases(bounds: CanvasBounds = DEFAULT_CANVAS): number[] {
  const minX = (bounds.padding ?? 50) + DEFAULT_PLAYER.width / 2;
  const maxX =
    bounds.width - (bounds.bankWidth ?? 65) - (bounds.padding ?? 50) - DEFAULT_PLAYER.width / 2;
  const center = (minX + maxX) / 2;

  return [
    minX, // Left boundary
    minX + 1, // Just inside left
    maxX, // Right boundary
    maxX - 1, // Just inside right
    center, // Center
    minX + (maxX - minX) * 0.25, // Left quarter
    minX + (maxX - minX) * 0.75, // Right quarter
  ];
}

// ── Animal Type Generators ─────────────────────────────────────────

/**
 * Generate a random animal type.
 *
 * @param rng - Seeded random number generator
 * @returns An animal type string
 */
export function generateAnimalType(rng: SeededRandom): string {
  return rng.pick([...ANIMAL_TYPES]);
}

/**
 * Generate multiple random animal types.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of types to generate
 * @returns Array of animal type strings
 */
export function generateAnimalTypes(rng: SeededRandom, count: number): string[] {
  const types: string[] = [];
  for (let i = 0; i < count; i++) {
    types.push(generateAnimalType(rng));
  }
  return types;
}

/**
 * Generate a random power-up type.
 *
 * @param rng - Seeded random number generator
 * @returns A power-up type string
 */
export function generatePowerUpType(rng: SeededRandom): string {
  return rng.pick([...POWER_UP_TYPES]);
}

/**
 * Generate multiple random power-up types.
 *
 * @param rng - Seeded random number generator
 * @param count - Number of types to generate
 * @returns Array of power-up type strings
 */
export function generatePowerUpTypes(rng: SeededRandom, count: number): string[] {
  const types: string[] = [];
  for (let i = 0; i < count; i++) {
    types.push(generatePowerUpType(rng));
  }
  return types;
}

// ── Test Data Generators ───────────────────────────────────────────

/**
 * Generate test cases for property-based testing.
 * Creates a specified number of test inputs with a seeded RNG.
 *
 * @param seed - Random seed for reproducibility
 * @param count - Number of test cases to generate
 * @param generator - Function that generates a single test case
 * @returns Array of generated test cases
 *
 * @example
 * ```typescript
 * const testCases = generateTestCases(12345, 100, (rng) => ({
 *   x: rng.nextFloat(0, 800),
 *   y: rng.nextFloat(0, 600),
 * }));
 * ```
 */
export function generateTestCases<T>(
  seed: number,
  count: number,
  generator: (rng: SeededRandom, index: number) => T
): T[] {
  const rng = createSeededRandom(seed);
  const cases: T[] = [];
  for (let i = 0; i < count; i++) {
    cases.push(generator(rng, i));
  }
  return cases;
}

/**
 * Generate an array of seeds for parallel test execution.
 * Each seed can be used to create a reproducible test run.
 *
 * @param baseSeed - Base seed to derive other seeds from
 * @param count - Number of seeds to generate
 * @returns Array of seed values
 */
export function generateSeeds(baseSeed: number, count: number): number[] {
  const rng = createSeededRandom(baseSeed);
  const seeds: number[] = [];
  for (let i = 0; i < count; i++) {
    seeds.push(rng.nextInt(0, 2147483647));
  }
  return seeds;
}

// ── Utility Functions ──────────────────────────────────────────────

/**
 * Clamp a value between min and max.
 *
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values.
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Check if a position is within bounds.
 *
 * @param pos - Position to check
 * @param bounds - Canvas bounds
 * @returns true if position is within bounds
 */
export function isWithinBounds(pos: Position, bounds: CanvasBounds): boolean {
  const minX = bounds.padding ?? 0;
  const maxX = bounds.width - (bounds.bankWidth ?? 0) - (bounds.padding ?? 0);
  const minY = 0;
  const maxY = bounds.height;

  return pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY;
}

/**
 * Calculate distance between two positions.
 *
 * @param a - First position
 * @param b - Second position
 * @returns Distance between positions
 */
export function distance(a: Position, b: Position): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}
