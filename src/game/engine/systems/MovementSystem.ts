/**
 * MovementSystem - Entity movement and physics
 * Pure functions for movement calculations
 */

import type { 
  EntityState, 
  AnimalState, 
  PlayerState, 
  TornadoState,
  ProjectileState,
  PowerUpState,
  InputState 
} from '../state/GameState';

// Movement configuration
export interface MovementConfig {
  // Player movement
  playerMaxSpeed: number;
  playerAcceleration: number;
  playerDeceleration: number;
  playerDragSensitivity: number;
  
  // Gravity and falling
  gravity: number;
  maxFallSpeed: number;
  airResistance: number;
  
  // Tornado
  tornadoSpeed: number;
  tornadoBounceMargin: number;
  
  // Projectiles
  projectileSpeed: number;
  projectileGravity: number;
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  playerMaxSpeed: 15,
  playerAcceleration: 2,
  playerDeceleration: 0.9,
  playerDragSensitivity: 1.2,
  
  gravity: 0.3,
  maxFallSpeed: 12,
  airResistance: 0.99,
  
  tornadoSpeed: 2,
  tornadoBounceMargin: 50,
  
  projectileSpeed: 8,
  projectileGravity: 0.2,
};

/**
 * Update player position based on input
 */
export function updatePlayerMovement(
  player: PlayerState,
  input: InputState,
  canvasWidth: number,
  bankWidth: number,
  deltaTime: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): PlayerState {
  const dt = deltaTime / 16.67; // Normalize to ~60fps
  
  let newX = player.x;
  let newVelocityX = player.velocityX;
  
  if (input.isDragging) {
    // Direct position control while dragging
    const targetX = input.pointerX - player.width / 2 + input.dragOffsetX;
    const dx = targetX - player.x;
    
    // Smooth movement toward target
    newVelocityX = dx * config.playerDragSensitivity;
    newX = player.x + newVelocityX * dt;
  } else {
    // Decelerate when not dragging
    newVelocityX *= config.playerDeceleration;
    newX = player.x + newVelocityX * dt;
  }
  
  // Clamp to play area
  const minX = 0;
  const maxX = canvasWidth - bankWidth - player.width;
  newX = Math.max(minX, Math.min(maxX, newX));
  
  // Stop velocity at boundaries
  if (newX === minX || newX === maxX) {
    newVelocityX = 0;
  }
  
  return {
    ...player,
    x: newX,
    velocityX: newVelocityX,
  };
}

/**
 * Update falling animal position
 */
export function updateFallingAnimal(
  animal: AnimalState,
  deltaTime: number,
  magnetPull?: { x: number; y: number },
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): AnimalState {
  const dt = deltaTime / 16.67;
  
  // Apply gravity
  let newVelocityY = animal.velocityY + config.gravity * dt;
  newVelocityY = Math.min(newVelocityY, config.maxFallSpeed);
  
  // Apply air resistance to horizontal movement
  let newVelocityX = animal.velocityX * config.airResistance;
  
  // Apply magnetic pull if active
  if (magnetPull) {
    newVelocityX += magnetPull.x * dt;
    newVelocityY += magnetPull.y * dt;
  }
  
  // Update position
  const newX = animal.x + newVelocityX * dt;
  const newY = animal.y + newVelocityY * dt;
  
  // Update rotation based on horizontal velocity
  const newRotation = animal.rotation + newVelocityX * 0.02 * dt;
  
  return {
    ...animal,
    x: newX,
    y: newY,
    velocityX: newVelocityX,
    velocityY: newVelocityY,
    rotation: newRotation,
  };
}

/**
 * Update tornado movement
 */
export function updateTornadoMovement(
  tornado: TornadoState,
  canvasWidth: number,
  bankWidth: number,
  deltaTime: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): TornadoState {
  const dt = deltaTime / 16.67;
  
  // Move in current direction
  let newX = tornado.x + tornado.direction * tornado.speed * dt;
  let newDirection = tornado.direction;
  
  // Bounce at edges
  const minX = config.tornadoBounceMargin + tornado.width / 2;
  const maxX = canvasWidth - bankWidth - config.tornadoBounceMargin - tornado.width / 2;
  
  if (newX <= minX) {
    newX = minX;
    newDirection = 1;
  } else if (newX >= maxX) {
    newX = maxX;
    newDirection = -1;
  }
  
  // Update rotation (spinning effect)
  const newRotation = tornado.rotation + tornado.intensity * 0.1 * dt;
  
  return {
    ...tornado,
    x: newX,
    direction: newDirection as 1 | -1,
    rotation: newRotation,
  };
}

/**
 * Update projectile movement
 */
export function updateProjectile(
  projectile: ProjectileState,
  deltaTime: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): ProjectileState {
  const dt = deltaTime / 16.67;
  
  // Apply gravity to projectile
  const newVelocityY = projectile.velocityY + config.projectileGravity * dt;
  
  // Update position
  const newX = projectile.x + projectile.velocityX * dt;
  const newY = projectile.y + newVelocityY * dt;
  
  // Update rotation based on velocity
  const angle = Math.atan2(newVelocityY, projectile.velocityX);
  
  // Decrease lifetime
  const newLifetime = projectile.lifetime - deltaTime;
  
  return {
    ...projectile,
    x: newX,
    y: newY,
    velocityY: newVelocityY,
    rotation: angle,
    lifetime: newLifetime,
    active: newLifetime > 0,
  };
}

/**
 * Update power-up movement
 */
export function updatePowerUp(
  powerUp: PowerUpState,
  deltaTime: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): PowerUpState {
  const dt = deltaTime / 16.67;
  
  // Gentle floating effect
  const floatY = Math.sin(Date.now() * 0.003) * 0.5;
  
  // Update position
  const newY = powerUp.y + (powerUp.velocityY + floatY) * dt;
  
  // Rotate slowly
  const newRotation = powerUp.rotation + 0.02 * dt;
  
  return {
    ...powerUp,
    y: newY,
    rotation: newRotation,
  };
}

/**
 * Apply bounce to an entity
 */
export function applyBounce(
  entity: EntityState,
  bounceVelocity: { x: number; y: number }
): EntityState {
  return {
    ...entity,
    velocityX: entity.velocityX + bounceVelocity.x,
    velocityY: bounceVelocity.y,
  };
}

/**
 * Calculate position for stacked animal
 */
export function calculateStackPosition(
  player: PlayerState,
  stackIndex: number,
  stackedAnimals: AnimalState[],
  wobbleOffset: number = 0
): { x: number; y: number } {
  // Calculate cumulative height of animals below this one
  let yOffset = 0;
  for (let i = 0; i < stackIndex; i++) {
    const animal = stackedAnimals[i];
    yOffset += animal.height * animal.scale * 0.7; // Overlap factor
  }
  
  // Center on player with wobble offset
  const x = player.x + player.width / 2 + wobbleOffset;
  const y = player.y - yOffset;
  
  return { x, y };
}

/**
 * Update stacked animal positions
 */
export function updateStackPositions(
  player: PlayerState,
  stackedAnimals: AnimalState[],
  wobbleOffsets: Map<string, number>
): AnimalState[] {
  return stackedAnimals.map((animal, index) => {
    const wobbleOffset = wobbleOffsets.get(animal.id) || 0;
    const { x, y } = calculateStackPosition(player, index, stackedAnimals, wobbleOffset);
    
    return {
      ...animal,
      x: x - animal.width / 2,
      y: y - animal.height,
      stackIndex: index,
    };
  });
}

/**
 * Predict landing position for a falling entity
 */
export function predictLandingPosition(
  entity: EntityState,
  targetY: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): { x: number; time: number } {
  let x = entity.x;
  let y = entity.y;
  let vx = entity.velocityX;
  let vy = entity.velocityY;
  let time = 0;
  
  const maxIterations = 1000;
  const dt = 16.67; // Simulate at 60fps
  
  for (let i = 0; i < maxIterations && y < targetY; i++) {
    vy += config.gravity;
    vy = Math.min(vy, config.maxFallSpeed);
    vx *= config.airResistance;
    
    x += vx;
    y += vy;
    time += dt;
  }
  
  return { x, time };
}

/**
 * Check if entity is out of bounds
 */
export function isOutOfBounds(
  entity: EntityState,
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 100
): boolean {
  return (
    entity.x < -margin ||
    entity.x > canvasWidth + margin ||
    entity.y < -margin ||
    entity.y > canvasHeight + margin
  );
}

/**
 * Batch update all falling animals
 */
export function batchUpdateFallingAnimals(
  animals: AnimalState[],
  deltaTime: number,
  magnetPull?: { x: number; y: number },
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): AnimalState[] {
  return animals.map(animal => 
    updateFallingAnimal(animal, deltaTime, magnetPull, config)
  );
}

/**
 * Apply screen shake offset
 */
export function getScreenShakeOffset(
  intensity: number
): { x: number; y: number } {
  if (intensity <= 0) return { x: 0, y: 0 };
  
  return {
    x: (Math.random() - 0.5) * intensity * 10,
    y: (Math.random() - 0.5) * intensity * 10,
  };
}

/**
 * Decay screen shake over time
 */
export function decayScreenShake(
  currentShake: number,
  deltaTime: number,
  decayRate: number = 0.9
): number {
  const dt = deltaTime / 16.67;
  return currentShake * Math.pow(decayRate, dt);
}
