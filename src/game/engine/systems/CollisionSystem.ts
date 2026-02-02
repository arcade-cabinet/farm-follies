/**
 * CollisionSystem - Pure functions for collision detection and resolution
 * Handles all entity-to-entity collision logic
 */

import type {
  AnimalState,
  BushState,
  EntityState,
  PlayerState,
  PowerUpState,
  ProjectileState,
} from "../state/GameState";

// Collision result types
export interface CollisionResult {
  collided: boolean;
  overlap: { x: number; y: number };
  normal: { x: number; y: number };
  penetration: number;
}

export interface CatchResult {
  caught: boolean;
  catchPosition: "left" | "center" | "right";
  relativeX: number; // -1 to 1, where animal landed relative to player center
}

export interface BounceResult {
  bounced: boolean;
  bounceVelocity: { x: number; y: number };
  bouncePosition: { x: number; y: number };
}

// Bounding box type
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Check if two axis-aligned bounding boxes overlap
 */
export function checkAABBCollision(a: BoundingBox, b: BoundingBox): CollisionResult {
  const aRight = a.x + a.width;
  const aBottom = a.y + a.height;
  const bRight = b.x + b.width;
  const bBottom = b.y + b.height;

  // Check for no collision
  if (a.x >= bRight || aRight <= b.x || a.y >= bBottom || aBottom <= b.y) {
    return {
      collided: false,
      overlap: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
    };
  }

  // Calculate overlap
  const overlapX = Math.min(aRight, bRight) - Math.max(a.x, b.x);
  const overlapY = Math.min(aBottom, bBottom) - Math.max(a.y, b.y);

  // Determine collision normal (direction of minimum penetration)
  let normalX = 0;
  let normalY = 0;
  let penetration: number;

  if (overlapX < overlapY) {
    penetration = overlapX;
    normalX = a.x + a.width / 2 < b.x + b.width / 2 ? -1 : 1;
  } else {
    penetration = overlapY;
    normalY = a.y + a.height / 2 < b.y + b.height / 2 ? -1 : 1;
  }

  return {
    collided: true,
    overlap: { x: overlapX, y: overlapY },
    normal: { x: normalX, y: normalY },
    penetration,
  };
}

/**
 * Check circle-to-circle collision
 */
export function checkCircleCollision(
  a: { x: number; y: number; radius: number },
  b: { x: number; y: number; radius: number }
): CollisionResult {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const combinedRadius = a.radius + b.radius;

  if (distance >= combinedRadius) {
    return {
      collided: false,
      overlap: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      penetration: 0,
    };
  }

  const penetration = combinedRadius - distance;
  const normalX = distance > 0 ? dx / distance : 0;
  const normalY = distance > 0 ? dy / distance : 1;

  return {
    collided: true,
    overlap: { x: penetration * Math.abs(normalX), y: penetration * Math.abs(normalY) },
    normal: { x: normalX, y: normalY },
    penetration,
  };
}

/**
 * Get bounding box for an entity
 */
export function getEntityBounds(entity: EntityState): BoundingBox {
  return {
    x: entity.x,
    y: entity.y,
    width: entity.width * entity.scale,
    height: entity.height * entity.scale,
  };
}

/**
 * Get catch zone bounds for player (top area where animals can be caught)
 */
export function getPlayerCatchZone(player: PlayerState): BoundingBox {
  const catchZoneHeight = player.height * 0.3; // Top 30% is catch zone
  return {
    x: player.x - player.width * 0.1, // Slightly wider catch zone
    y: player.y,
    width: player.width * 1.2,
    height: catchZoneHeight,
  };
}

/**
 * Get stack top position (where next animal would land)
 */
export function getStackTopPosition(
  player: PlayerState,
  stackedAnimals: AnimalState[]
): { x: number; y: number } {
  if (stackedAnimals.length === 0) {
    return {
      x: player.x + player.width / 2,
      y: player.y,
    };
  }

  // Calculate total stack height
  let stackHeight = 0;
  stackedAnimals.forEach((animal) => {
    stackHeight += animal.height * animal.scale * 0.7; // Overlap factor
  });

  return {
    x: player.x + player.width / 2,
    y: player.y - stackHeight,
  };
}

/**
 * Check if a falling animal can be caught by the player
 */
export function checkAnimalCatch(
  animal: AnimalState,
  player: PlayerState,
  stackedAnimals: AnimalState[]
): CatchResult {
  const animalBounds = getEntityBounds(animal);
  const catchZone = getPlayerCatchZone(player);

  // If player has stacked animals, check catch at stack top
  if (stackedAnimals.length > 0) {
    const stackTop = getStackTopPosition(player, stackedAnimals);
    const stackCatchZone: BoundingBox = {
      x: stackTop.x - player.width * 0.6,
      y: stackTop.y - animal.height * 0.5,
      width: player.width * 1.2,
      height: animal.height,
    };

    const stackCollision = checkAABBCollision(animalBounds, stackCatchZone);
    if (stackCollision.collided) {
      const relativeX = (animal.x + animal.width / 2 - stackTop.x) / (player.width * 0.6);
      return {
        caught: true,
        catchPosition: relativeX < -0.3 ? "left" : relativeX > 0.3 ? "right" : "center",
        relativeX: Math.max(-1, Math.min(1, relativeX)),
      };
    }
  }

  // Check base player catch zone
  const baseCollision = checkAABBCollision(animalBounds, catchZone);
  if (baseCollision.collided) {
    const playerCenterX = player.x + player.width / 2;
    const animalCenterX = animal.x + animal.width / 2;
    const relativeX = (animalCenterX - playerCenterX) / (player.width * 0.6);

    return {
      caught: true,
      catchPosition: relativeX < -0.3 ? "left" : relativeX > 0.3 ? "right" : "center",
      relativeX: Math.max(-1, Math.min(1, relativeX)),
    };
  }

  return {
    caught: false,
    catchPosition: "center",
    relativeX: 0,
  };
}

/**
 * Check if an animal has fallen past the catch zone (missed)
 */
export function checkAnimalMissed(
  animal: AnimalState,
  canvasHeight: number,
  player: PlayerState
): boolean {
  // Missed if animal bottom is below player bottom
  const animalBottom = animal.y + animal.height * animal.scale;
  const playerBottom = player.y + player.height;

  return animalBottom > playerBottom + 20; // Small buffer
}

/**
 * Check if an animal bounces off a bush
 */
export function checkBushBounce(animal: AnimalState, bush: BushState): BounceResult {
  const animalBounds = getEntityBounds(animal);
  const bushBounds = getEntityBounds(bush);

  // Only bounce if bush is grown enough
  if (bush.growthStage < 0.5) {
    return { bounced: false, bounceVelocity: { x: 0, y: 0 }, bouncePosition: { x: 0, y: 0 } };
  }

  const collision = checkAABBCollision(animalBounds, bushBounds);

  if (collision.collided && animal.velocityY > 0) {
    // Only bounce if falling
    const bounceStrength = bush.bounceStrength * bush.growthStage;
    const bounceVelocityY = -Math.abs(animal.velocityY) * bounceStrength * 1.5;

    // Add some horizontal variation based on where it hit
    const hitOffsetX = animal.x + animal.width / 2 - (bush.x + bush.width / 2);
    const bounceVelocityX = hitOffsetX * 0.1;

    return {
      bounced: true,
      bounceVelocity: { x: bounceVelocityX, y: bounceVelocityY },
      bouncePosition: {
        x: animal.x + animal.width / 2,
        y: bush.y,
      },
    };
  }

  return { bounced: false, bounceVelocity: { x: 0, y: 0 }, bouncePosition: { x: 0, y: 0 } };
}

/**
 * Check if a power-up is collected by player or stacked animals
 */
export function checkPowerUpCollection(
  powerUp: PowerUpState,
  player: PlayerState,
  stackedAnimals: AnimalState[]
): boolean {
  const powerUpBounds = getEntityBounds(powerUp);

  // Check player collision
  const playerBounds = getEntityBounds(player);
  if (checkAABBCollision(powerUpBounds, playerBounds).collided) {
    return true;
  }

  // Check stacked animals collision
  for (const animal of stackedAnimals) {
    const animalBounds = getEntityBounds(animal);
    if (checkAABBCollision(powerUpBounds, animalBounds).collided) {
      return true;
    }
  }

  return false;
}

/**
 * Check projectile collision with entities
 */
export function checkProjectileCollision(
  projectile: ProjectileState,
  targets: EntityState[]
): EntityState | null {
  const projectileBounds = getEntityBounds(projectile);

  for (const target of targets) {
    const targetBounds = getEntityBounds(target);
    if (checkAABBCollision(projectileBounds, targetBounds).collided) {
      return target;
    }
  }

  return null;
}

/**
 * Check if a position is within the playable area
 */
export function isInPlayArea(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  bankWidth: number
): boolean {
  return x >= 0 && x <= canvasWidth - bankWidth && y >= 0 && y <= canvasHeight;
}

/**
 * Clamp entity position to playable area
 */
export function clampToPlayArea(
  entity: EntityState,
  canvasWidth: number,
  canvasHeight: number,
  bankWidth: number
): { x: number; y: number } {
  const maxX = canvasWidth - bankWidth - entity.width * entity.scale;
  const maxY = canvasHeight - entity.height * entity.scale;

  return {
    x: Math.max(0, Math.min(maxX, entity.x)),
    y: Math.max(0, Math.min(maxY, entity.y)),
  };
}

/**
 * Calculate magnetic pull toward player (for power-up effect)
 */
export function calculateMagneticPull(
  entity: EntityState,
  player: PlayerState,
  magnetStrength: number
): { x: number; y: number } {
  const entityCenterX = entity.x + entity.width / 2;
  const entityCenterY = entity.y + entity.height / 2;
  const playerCenterX = player.x + player.width / 2;
  const playerCenterY = player.y + player.height / 2;

  const dx = playerCenterX - entityCenterX;
  const dy = playerCenterY - entityCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 10) return { x: 0, y: 0 };

  // Magnetic force falls off with distance
  const force = magnetStrength / (1 + distance * 0.01);

  return {
    x: (dx / distance) * force,
    y: (dy / distance) * force,
  };
}

/**
 * Batch collision check for multiple falling animals
 */
export function batchCheckAnimalCatches(
  fallingAnimals: AnimalState[],
  player: PlayerState,
  stackedAnimals: AnimalState[]
): Map<string, CatchResult> {
  const results = new Map<string, CatchResult>();

  for (const animal of fallingAnimals) {
    const result = checkAnimalCatch(animal, player, stackedAnimals);
    results.set(animal.id, result);
  }

  return results;
}

/**
 * Batch collision check for multiple bushes
 */
export function batchCheckBushBounces(animal: AnimalState, bushes: BushState[]): BounceResult {
  for (const bush of bushes) {
    const result = checkBushBounce(animal, bush);
    if (result.bounced) {
      return result;
    }
  }

  return { bounced: false, bounceVelocity: { x: 0, y: 0 }, bouncePosition: { x: 0, y: 0 } };
}
