/**
 * Game Engine - Modular game engine for Farm Follies
 * 
 * Architecture:
 * - core/: Game loop, responsive scaling
 * - input/: Input handling
 * - entities/: Entity definitions
 * - managers/: State management
 * - systems/: Pure game logic functions
 * - rendering/: Canvas rendering
 * - state/: Immutable state types (legacy, being migrated)
 * 
 * Usage:
 * ```typescript
 * import { createGame } from '@/game/engine';
 * 
 * const game = createGame(canvas, {
 *   onScoreChange: (score, mult, combo) => updateUI(score),
 *   onGameOver: (score) => showGameOver(score),
 * });
 * 
 * game.start();
 * ```
 */

// Main game class
export { Game, createGame, type GameCallbacks, type GameConfig } from './Game';

// Core
export * from './core';

// Input
export { InputManager, type InputState, type InputCallbacks, type InputConfig } from './input';

// Entities (selective exports to avoid conflicts)
export { 
  createEntity, 
  generateEntityId, 
  getEntityCenter,
  isPointInEntity,
  getEntityDistance,
  applyVelocity,
  applyForce,
  cloneEntity,
} from './entities/Entity';
export type { 
  Entity, 
  Vector2, 
  Transform, 
  Velocity, 
  Bounds 
} from './entities/Entity';
export { 
  createAnimal, 
  createRandomAnimal, 
  catchAnimal,
  hasAbilityReady,
  useAbility,
  getAnimalSpawnTemplate,
  getAnimalVariant,
} from './entities/Animal';
export type { 
  AnimalEntity, 
  AnimalComponents,
  AnimalType as AnimalEntityType,
  AnimalState as AnimalEntityState
} from './entities/Animal';
export { 
  createPlayer,
  getPlayerCenterX,
  getStackTopY,
  addToStack,
  clearStack,
  getStackHeight,
  updatePlayerPosition,
  setInvincible,
  isInvincible,
  updatePowerUpTimers,
  activateMagnet,
  activateDoublePoints,
  updateStress,
} from './entities/Player';
export type { PlayerEntity, PlayerComponents } from './entities/Player';
export {
  createPowerUp,
  updatePowerUpBob,
  getPowerUpBobOffset,
} from './entities/PowerUp';
export type { PowerUpEntity, PowerUpComponents } from './entities/PowerUp';

// Managers
export * from './managers';

// Systems (selective exports to avoid conflicts)
export { 
  checkAABBCollision,
  checkCircleCollision,
  checkAnimalCatch,
  checkAnimalMissed,
  checkBushBounce,
  checkPowerUpCollection,
  isInPlayArea,
  clampToPlayArea,
  calculateMagneticPull,
  batchCheckAnimalCatches,
  type CollisionResult,
  type CatchResult,
  type BounceResult,
  type BoundingBox
} from './systems/CollisionSystem';
export * from './systems/WobblePhysics';
export * from './systems/ScoreSystem';
export * from './systems/SpawnSystem';
export * from './systems/BushSystem';
export { getAbilityIndicators, type AbilityIndicator as AbilityIndicatorData } from './systems/AbilitySystem';

// Rendering
export * from './rendering';

