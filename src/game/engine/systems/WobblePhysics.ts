/**
 * WobblePhysics - YUKA-style wobble simulation for stacked animals
 * Pure functions for calculating wobble physics
 */

import type { AnimalState, PlayerState } from '../state/GameState';

// Wobble configuration
export interface WobbleConfig {
  // Base wobble parameters
  baseAmplitude: number;        // Base wobble amount (radians)
  dampingFactor: number;        // How quickly wobble decays (0-1)
  transferRatio: number;        // How much wobble transfers up the stack (0-1)
  
  // Stack-based scaling
  heightMultiplier: number;     // Wobble increase per stack level
  weightFactor: number;         // How animal weight affects wobble
  
  // Movement-induced wobble
  movementWobbleScale: number;  // Wobble from player movement
  accelerationScale: number;    // Wobble from acceleration changes
  
  // Thresholds
  collapseThreshold: number;    // Max wobble before collapse (radians)
  warningThreshold: number;     // Wobble level for warning (radians)
  stabilizeThreshold: number;   // Below this, wobble decays faster
  
  // Natural wobble
  naturalFrequency: number;     // Base oscillation frequency (Hz)
  naturalDecay: number;         // How natural wobble decays
}

export const DEFAULT_WOBBLE_CONFIG: WobbleConfig = {
  baseAmplitude: 0.05,
  dampingFactor: 0.98,
  transferRatio: 0.7,
  heightMultiplier: 0.15,
  weightFactor: 0.1,
  movementWobbleScale: 0.002,
  accelerationScale: 0.005,
  collapseThreshold: 0.8,
  warningThreshold: 0.5,
  stabilizeThreshold: 0.1,
  naturalFrequency: 2,
  naturalDecay: 0.995,
};

// Wobble state for a single animal
export interface AnimalWobbleState {
  angle: number;           // Current wobble angle (radians)
  velocity: number;        // Angular velocity
  phase: number;           // Phase in natural oscillation
  accumulated: number;     // Accumulated wobble for collapse check
}

// Stack wobble state
export interface StackWobbleState {
  animals: Map<string, AnimalWobbleState>;
  overallIntensity: number;
  isWarning: boolean;
  isCollapsing: boolean;
  lastPlayerVelocity: number;
  lastPlayerAcceleration: number;
}

/**
 * Create initial wobble state for a new animal
 */
export function createAnimalWobbleState(initialAngle = 0): AnimalWobbleState {
  return {
    angle: initialAngle,
    velocity: 0,
    phase: Math.random() * Math.PI * 2,
    accumulated: 0,
  };
}

/**
 * Create initial stack wobble state
 */
export function createStackWobbleState(): StackWobbleState {
  return {
    animals: new Map(),
    overallIntensity: 0,
    isWarning: false,
    isCollapsing: false,
    lastPlayerVelocity: 0,
    lastPlayerAcceleration: 0,
  };
}

/**
 * Calculate wobble induced by player movement
 */
export function calculateMovementWobble(
  currentVelocity: number,
  lastVelocity: number,
  deltaTime: number,
  config: WobbleConfig
): { wobble: number; acceleration: number } {
  const acceleration = (currentVelocity - lastVelocity) / deltaTime;
  
  // Movement contributes to wobble
  const velocityWobble = Math.abs(currentVelocity) * config.movementWobbleScale;
  
  // Acceleration changes cause extra wobble
  const accelWobble = Math.abs(acceleration) * config.accelerationScale;
  
  return {
    wobble: velocityWobble + accelWobble,
    acceleration,
  };
}

/**
 * Calculate weight factor for an animal type
 */
export function getAnimalWeight(type: string): number {
  const weights: Record<string, number> = {
    chicken: 0.5,
    duck: 0.6,
    rooster: 0.7,
    goose: 0.8,
    goat: 1.0,
    sheep: 1.2,
    pig: 1.5,
    cow: 2.0,
    horse: 2.2,
  };
  return weights[type] ?? 1.0;
}

/**
 * Update wobble physics for a single animal in the stack
 */
export function updateAnimalWobble(
  state: AnimalWobbleState,
  stackIndex: number,
  movementWobble: number,
  deltaTime: number,
  config: WobbleConfig,
  animalWeight: number
): AnimalWobbleState {
  const dt = deltaTime / 1000; // Convert to seconds
  
  // Natural oscillation
  const newPhase = state.phase + config.naturalFrequency * Math.PI * 2 * dt;
  const naturalWobble = Math.sin(newPhase) * config.baseAmplitude * (1 + stackIndex * 0.1);
  
  // Height-based wobble amplification
  const heightFactor = 1 + stackIndex * config.heightMultiplier;
  
  // Weight affects stability (heavier = more stable at bottom, less stable at top)
  const weightEffect = stackIndex === 0 
    ? 1 / animalWeight  // Bottom: heavier is more stable
    : animalWeight;      // Top: heavier is less stable
  
  // Calculate force from movement
  const movementForce = movementWobble * heightFactor * weightEffect;
  
  // Update velocity with spring-like behavior
  const springForce = -state.angle * 5; // Restoring force
  const newVelocity = (state.velocity + springForce * dt + movementForce) * config.dampingFactor;
  
  // Update angle
  const newAngle = state.angle + newVelocity * dt + naturalWobble * dt;
  
  // Update accumulated wobble (for collapse detection)
  const newAccumulated = Math.max(0, state.accumulated + Math.abs(newAngle) - config.naturalDecay * dt);
  
  return {
    angle: newAngle,
    velocity: newVelocity,
    phase: newPhase % (Math.PI * 2),
    accumulated: newAccumulated,
  };
}

/**
 * Propagate wobble up the stack (animals above feel wobble from below)
 */
export function propagateWobble(
  stackWobbleStates: AnimalWobbleState[],
  config: WobbleConfig
): AnimalWobbleState[] {
  if (stackWobbleStates.length <= 1) return stackWobbleStates;
  
  const result = [...stackWobbleStates];
  
  // Bottom-up propagation
  for (let i = 1; i < result.length; i++) {
    const below = result[i - 1];
    const current = result[i];
    
    // Transfer wobble from below
    const transferred = below.angle * config.transferRatio;
    
    result[i] = {
      ...current,
      angle: current.angle + transferred * 0.5,
      velocity: current.velocity + below.velocity * config.transferRatio * 0.3,
    };
  }
  
  return result;
}

/**
 * Update entire stack wobble state
 */
export function updateStackWobble(
  state: StackWobbleState,
  stackedAnimals: AnimalState[],
  playerVelocity: number,
  deltaTime: number,
  config: WobbleConfig = DEFAULT_WOBBLE_CONFIG
): StackWobbleState {
  // Calculate movement-induced wobble
  const { wobble: movementWobble, acceleration } = calculateMovementWobble(
    playerVelocity,
    state.lastPlayerVelocity,
    deltaTime,
    config
  );
  
  // Update each animal's wobble
  const newAnimals = new Map<string, AnimalWobbleState>();
  let maxWobble = 0;
  
  stackedAnimals.forEach((animal, index) => {
    // Get or create wobble state for this animal
    let animalWobble = state.animals.get(animal.id);
    if (!animalWobble) {
      animalWobble = createAnimalWobbleState();
    }
    
    // Update wobble physics
    const weight = getAnimalWeight(animal.type);
    const updatedWobble = updateAnimalWobble(
      animalWobble,
      index,
      movementWobble,
      deltaTime,
      config,
      weight
    );
    
    newAnimals.set(animal.id, updatedWobble);
    maxWobble = Math.max(maxWobble, Math.abs(updatedWobble.angle));
  });
  
  // Propagate wobble through stack
  const wobbleArray = stackedAnimals.map(a => newAnimals.get(a.id)!);
  const propagated = propagateWobble(wobbleArray, config);
  propagated.forEach((wobble, index) => {
    const animalId = stackedAnimals[index].id;
    newAnimals.set(animalId, wobble);
    maxWobble = Math.max(maxWobble, Math.abs(wobble.angle));
  });
  
  // Determine warning/collapse states
  const isWarning = maxWobble >= config.warningThreshold;
  const isCollapsing = maxWobble >= config.collapseThreshold;
  
  return {
    animals: newAnimals,
    overallIntensity: maxWobble / config.collapseThreshold,
    isWarning,
    isCollapsing,
    lastPlayerVelocity: playerVelocity,
    lastPlayerAcceleration: acceleration,
  };
}

/**
 * Get visual wobble angle for rendering an animal
 */
export function getVisualWobbleAngle(
  state: StackWobbleState,
  animalId: string,
  stackIndex: number
): number {
  const animalWobble = state.animals.get(animalId);
  if (!animalWobble) return 0;
  
  // Add visual exaggeration for higher stack positions
  const visualMultiplier = 1 + stackIndex * 0.3;
  return animalWobble.angle * visualMultiplier;
}

/**
 * Get wobble offset for positioning (horizontal displacement)
 */
export function getWobbleOffset(
  state: StackWobbleState,
  animalId: string,
  animalHeight: number
): number {
  const animalWobble = state.animals.get(animalId);
  if (!animalWobble) return 0;
  
  // Convert angle to horizontal offset using arc length approximation
  return Math.sin(animalWobble.angle) * animalHeight * 0.5;
}

/**
 * Apply impulse to the stack (from catching, impacts, etc.)
 */
export function applyStackImpulse(
  state: StackWobbleState,
  impulseDirection: number, // -1 to 1
  impulseStrength: number,  // 0 to 1
  affectedIndices?: number[] // Which stack positions to affect (default: all)
): StackWobbleState {
  const newAnimals = new Map(state.animals);
  
  state.animals.forEach((wobble, animalId) => {
    const updatedWobble: AnimalWobbleState = {
      ...wobble,
      velocity: wobble.velocity + impulseDirection * impulseStrength * 2,
      accumulated: wobble.accumulated + impulseStrength * 0.2,
    };
    newAnimals.set(animalId, updatedWobble);
  });
  
  return {
    ...state,
    animals: newAnimals,
    overallIntensity: Math.min(1, state.overallIntensity + impulseStrength * 0.3),
  };
}

/**
 * Stabilize the stack (reduce all wobble)
 */
export function stabilizeStack(
  state: StackWobbleState,
  stabilizeFactor: number = 0.5
): StackWobbleState {
  const newAnimals = new Map<string, AnimalWobbleState>();
  
  state.animals.forEach((wobble, animalId) => {
    newAnimals.set(animalId, {
      ...wobble,
      angle: wobble.angle * (1 - stabilizeFactor),
      velocity: wobble.velocity * (1 - stabilizeFactor),
      accumulated: wobble.accumulated * (1 - stabilizeFactor * 0.5),
    });
  });
  
  return {
    ...state,
    animals: newAnimals,
    overallIntensity: state.overallIntensity * (1 - stabilizeFactor),
    isWarning: false,
    isCollapsing: false,
  };
}
