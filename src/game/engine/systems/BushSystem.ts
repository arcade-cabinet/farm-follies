/**
 * BushSystem - Bush growth and bounce mechanics
 * Handles the cow poop -> bush -> bounce gameplay
 */

import type { AnimalState, BushState, ProjectileState } from "../state/GameState";

// Bush configuration
export interface BushConfig {
  // Growth
  growthDuration: number; // Time to fully grow (ms)
  initialSize: number; // Starting size multiplier
  maxSize: number; // Full grown size multiplier

  // Bounce
  baseBounceStrength: number; // Bounce force multiplier
  maxBounceStrength: number;
  bounceDecay: number; // Strength reduction per bounce

  // Lifetime
  maxLifetime: number; // How long bush lasts (ms)
  fadeStartPercent: number; // When to start fading (0-1)

  // Visuals
  swaySpeed: number;
  swayAmount: number;
}

export const DEFAULT_BUSH_CONFIG: BushConfig = {
  growthDuration: 2000,
  initialSize: 0.3,
  maxSize: 1.0,

  baseBounceStrength: 0.8,
  maxBounceStrength: 1.2,
  bounceDecay: 0.1,

  maxLifetime: 30000,
  fadeStartPercent: 0.8,

  swaySpeed: 2,
  swayAmount: 0.05,
};

// Bush visual state
export interface BushVisualState {
  swayPhase: number;
  currentSway: number;
  opacity: number;
  leafParticles: LeafParticle[];
}

export interface LeafParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  lifetime: number;
  color: string;
}

// Bush runtime state
export interface BushRuntimeState {
  bushes: Map<string, BushState>;
  visuals: Map<string, BushVisualState>;
  totalBounces: number;
}

let bushIdCounter = 0;

/**
 * Reset the bush ID counter (call at game start)
 */
export function resetBushIdCounter(): void {
  bushIdCounter = 0;
}

/**
 * Create a new bush from a poop projectile impact
 */
export function createBushFromPoop(
  projectile: ProjectileState,
  groundY: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): BushState {
  const id = `bush_${Date.now()}_${++bushIdCounter}`;

  return {
    id,
    x: projectile.x,
    y: groundY,
    width: 60,
    height: 80,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    scale: config.initialSize,
    active: true,
    growthStage: 0,
    bounceStrength: config.baseBounceStrength,
    plantedBy: projectile.sourceAnimalId,
  };
}

/**
 * Create initial visual state for a bush
 */
export function createBushVisualState(): BushVisualState {
  return {
    swayPhase: Math.random() * Math.PI * 2,
    currentSway: 0,
    opacity: 1,
    leafParticles: [],
  };
}

/**
 * Update bush growth over time
 */
export function updateBushGrowth(
  bush: BushState,
  deltaTime: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): BushState {
  if (bush.growthStage >= 1) return bush;

  const growthIncrement = deltaTime / config.growthDuration;
  const newGrowthStage = Math.min(1, bush.growthStage + growthIncrement);

  // Scale based on growth
  const newScale = config.initialSize + (config.maxSize - config.initialSize) * newGrowthStage;

  // Bounce strength increases with growth
  const newBounceStrength =
    config.baseBounceStrength +
    (config.maxBounceStrength - config.baseBounceStrength) * newGrowthStage;

  return {
    ...bush,
    growthStage: newGrowthStage,
    scale: newScale,
    bounceStrength: newBounceStrength,
  };
}

/**
 * Update bush visual state
 */
export function updateBushVisual(
  visual: BushVisualState,
  bush: BushState,
  deltaTime: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): BushVisualState {
  const dt = deltaTime / 1000;

  // Update sway
  const newSwayPhase = visual.swayPhase + config.swaySpeed * dt;
  const newCurrentSway = Math.sin(newSwayPhase) * config.swayAmount * bush.growthStage;

  // Update leaf particles
  const updatedParticles = visual.leafParticles
    .map((leaf) => updateLeafParticle(leaf, deltaTime))
    .filter((leaf) => leaf.lifetime > 0);

  return {
    ...visual,
    swayPhase: newSwayPhase,
    currentSway: newCurrentSway,
    leafParticles: updatedParticles,
  };
}

/**
 * Update a single leaf particle
 */
function updateLeafParticle(leaf: LeafParticle, deltaTime: number): LeafParticle {
  const dt = deltaTime / 16.67;

  return {
    ...leaf,
    x: leaf.x + leaf.vx * dt,
    y: leaf.y + leaf.vy * dt,
    vy: leaf.vy + 0.1 * dt, // Gravity
    rotation: leaf.rotation + leaf.rotationSpeed * dt,
    lifetime: leaf.lifetime - deltaTime,
  };
}

/**
 * Create leaf particles when bush is bounced on
 */
export function createBounceLeaves(
  bush: BushState,
  impactVelocity: number,
  count: number = 5
): LeafParticle[] {
  const leaves: LeafParticle[] = [];
  const colors = ["#228B22", "#32CD32", "#90EE90", "#006400", "#7CFC00"];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI - Math.PI / 2; // Upward arc
    const speed = 2 + Math.random() * 3 + Math.abs(impactVelocity) * 0.3;

    leaves.push({
      x: bush.x + bush.width / 2 + (Math.random() - 0.5) * bush.width,
      y: bush.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      size: 4 + Math.random() * 4,
      lifetime: 1000 + Math.random() * 500,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  return leaves;
}

/**
 * Apply bounce effect to bush (reduces strength)
 */
export function applyBushBounce(
  bush: BushState,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): BushState {
  return {
    ...bush,
    bounceStrength: Math.max(
      config.baseBounceStrength * 0.5,
      bush.bounceStrength - config.bounceDecay
    ),
  };
}

/**
 * Check if bush should be removed
 */
export function shouldRemoveBush(
  bush: BushState,
  creationTime: number,
  currentTime: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): boolean {
  const age = currentTime - creationTime;
  return age >= config.maxLifetime || !bush.active;
}

/**
 * Calculate bush opacity based on lifetime
 */
export function calculateBushOpacity(
  creationTime: number,
  currentTime: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): number {
  const age = currentTime - creationTime;
  const lifePercent = age / config.maxLifetime;

  if (lifePercent < config.fadeStartPercent) {
    return 1;
  }

  const fadeProgress = (lifePercent - config.fadeStartPercent) / (1 - config.fadeStartPercent);
  return 1 - fadeProgress;
}

/**
 * Batch update all bushes
 */
export function updateAllBushes(
  bushes: BushState[],
  deltaTime: number,
  config: BushConfig = DEFAULT_BUSH_CONFIG
): BushState[] {
  return bushes.map((bush) => updateBushGrowth(bush, deltaTime, config));
}

/**
 * Create initial bush runtime state
 */
export function createBushRuntimeState(): BushRuntimeState {
  return {
    bushes: new Map(),
    visuals: new Map(),
    totalBounces: 0,
  };
}

/**
 * Add a bush to runtime state
 */
export function addBushToState(state: BushRuntimeState, bush: BushState): BushRuntimeState {
  const newBushes = new Map(state.bushes);
  const newVisuals = new Map(state.visuals);

  newBushes.set(bush.id, bush);
  newVisuals.set(bush.id, createBushVisualState());

  return {
    ...state,
    bushes: newBushes,
    visuals: newVisuals,
  };
}

/**
 * Remove a bush from runtime state
 */
export function removeBushFromState(state: BushRuntimeState, bushId: string): BushRuntimeState {
  const newBushes = new Map(state.bushes);
  const newVisuals = new Map(state.visuals);

  newBushes.delete(bushId);
  newVisuals.delete(bushId);

  return {
    ...state,
    bushes: newBushes,
    visuals: newVisuals,
  };
}

/**
 * Get all active bushes as array
 */
export function getActiveBushes(state: BushRuntimeState): BushState[] {
  return Array.from(state.bushes.values()).filter((b) => b.active);
}

/**
 * Find bushes near a position (for bounce checks)
 */
export function findNearbyBushes(
  bushes: BushState[],
  x: number,
  y: number,
  radius: number
): BushState[] {
  return bushes.filter((bush) => {
    const bushCenterX = bush.x + bush.width / 2;
    const bushCenterY = bush.y + bush.height / 2;
    const dx = bushCenterX - x;
    const dy = bushCenterY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  });
}
