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

// Core
export * from "./core";
export type {
  AnimalComponents,
  AnimalEntity,
  AnimalState as AnimalEntityState,
  AnimalType as AnimalEntityType,
} from "./entities/Animal";
export {
  catchAnimal,
  createAnimal,
  createRandomAnimal,
  getAnimalSpawnTemplate,
  getAnimalVariant,
  hasAbilityReady,
  useAbility,
} from "./entities/Animal";
export type {
  Bounds,
  Entity,
  Transform,
  Vector2,
  Velocity,
} from "./entities/Entity";
// Entities (selective exports to avoid conflicts)
export {
  applyForce,
  applyVelocity,
  cloneEntity,
  createEntity,
  generateEntityId,
  getEntityCenter,
  getEntityDistance,
  isPointInEntity,
  resetEntityIdCounter,
} from "./entities/Entity";
export type { PlayerComponents, PlayerEntity } from "./entities/Player";
export {
  activateDoublePoints,
  activateMagnet,
  addToStack,
  clearStack,
  createPlayer,
  getPlayerCenterX,
  getStackHeight,
  getStackTopY,
  isInvincible,
  setInvincible,
  updatePlayerPosition,
  updatePowerUpTimers,
  updateStress,
} from "./entities/Player";
export type { PowerUpComponents, PowerUpEntity } from "./entities/PowerUp";
export {
  createPowerUp,
  getPowerUpBobOffset,
  updatePowerUpBob,
} from "./entities/PowerUp";
// Main game class
export { createGame, Game, type GameCallbacks, type GameConfig } from "./Game";
// Input
export { type InputCallbacks, type InputConfig, InputManager, type InputState } from "./input";

// Managers
export * from "./managers";
// Rendering
export * from "./rendering";
export {
  type AbilityIndicator as AbilityIndicatorData,
  getAbilityIndicators,
} from "./systems/AbilitySystem";
export * from "./systems/BushSystem";
// Systems (selective exports to avoid conflicts)
export {
  type BounceResult,
  type BoundingBox,
  batchCheckAnimalCatches,
  type CatchResult,
  type CollisionResult,
  calculateMagneticPull,
  checkAABBCollision,
  checkAnimalCatch,
  checkAnimalMissed,
  checkBushBounce,
  checkCircleCollision,
  checkPowerUpCollection,
  clampToPlayArea,
  isInPlayArea,
} from "./systems/CollisionSystem";
export * from "./systems/ScoreSystem";
export * from "./systems/SpawnSystem";
export * from "./systems/WobblePhysics";
