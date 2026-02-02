/**
 * Player - The farmer player entity
 */

import type { AnimalEntity } from "./Animal";
import { createEntity, type Entity, Vector2 } from "./Entity";

export interface PlayerComponents {
  /** Stacked animals */
  stack: AnimalEntity[];
  /** Target X position (for smooth movement) */
  targetX: number;
  /** Drag velocity for momentum */
  dragVelocity: number;
  /** Is invincible */
  isInvincible: boolean;
  /** Invincibility end time */
  invincibleUntil: number;
  /** Magnet power-up active */
  magnetActive: boolean;
  /** Magnet end time */
  magnetUntil: number;
  /** Double points active */
  doublePointsActive: boolean;
  /** Double points end time */
  doublePointsUntil: number;
  /** Current wobble offset (visual) */
  wobbleOffset: number;
  /** Stress level (0-1, affects animations) */
  stress: number;
}

export interface PlayerEntity extends Entity {
  type: "player";
  player: PlayerComponents;
}

/**
 * Create the player entity
 */
export function createPlayer(x: number, y: number, width: number, height: number): PlayerEntity {
  const baseEntity = createEntity("player", x - width / 2, y - height, {
    id: "player",
    width,
    height,
  });

  return {
    ...baseEntity,
    type: "player",
    player: {
      stack: [],
      targetX: x,
      dragVelocity: 0,
      isInvincible: false,
      invincibleUntil: 0,
      magnetActive: false,
      magnetUntil: 0,
      doublePointsActive: false,
      doublePointsUntil: 0,
      wobbleOffset: 0,
      stress: 0,
    },
  };
}

/**
 * Get the center X position of the player
 */
export function getPlayerCenterX(player: PlayerEntity): number {
  return player.transform.position.x + (player.bounds?.width ?? 80) / 2;
}

/**
 * Get the stack top Y position (where next animal would land)
 */
export function getStackTopY(player: PlayerEntity): number {
  const baseY = player.transform.position.y;

  if (player.player.stack.length === 0) {
    return baseY;
  }

  // Calculate stack height with overlap
  let stackHeight = 0;
  for (const animal of player.player.stack) {
    stackHeight += (animal.bounds?.height ?? 50) * 0.7;
  }

  return baseY - stackHeight;
}

/**
 * Get catch zone bounds
 */
export function getPlayerCatchZone(player: PlayerEntity): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const centerX = getPlayerCenterX(player);
  const topY = getStackTopY(player);
  const width = (player.bounds?.width ?? 80) * 1.2;
  const height = (player.bounds?.height ?? 100) * 0.3;

  return {
    x: centerX - width / 2,
    y: topY - height / 2,
    width,
    height,
  };
}

/**
 * Add animal to stack
 */
export function addToStack(player: PlayerEntity, animal: AnimalEntity): PlayerEntity {
  const newStack = [...player.player.stack, animal];

  return {
    ...player,
    player: {
      ...player.player,
      stack: newStack,
    },
  };
}

/**
 * Clear the stack
 */
export function clearStack(player: PlayerEntity): PlayerEntity {
  return {
    ...player,
    player: {
      ...player.player,
      stack: [],
    },
  };
}

/**
 * Get stack height (number of animals)
 */
export function getStackHeight(player: PlayerEntity): number {
  return player.player.stack.length;
}

/**
 * Update player position with smooth movement
 */
export function updatePlayerPosition(
  player: PlayerEntity,
  targetX: number,
  minX: number,
  maxX: number,
  dt: number,
  isDragging: boolean
): PlayerEntity {
  const smoothTime = 25;
  const frameLerp = 1 - Math.exp(-dt / smoothTime);

  let newX = player.transform.position.x + (player.bounds?.width ?? 80) / 2;
  let newDragVelocity = player.player.dragVelocity;

  if (isDragging) {
    // While dragging: smooth interpolation toward target
    const dx = targetX - newX;
    if (Math.abs(dx) > 0.1) {
      newX += dx * Math.min(frameLerp * 1.2, 0.85);
    } else {
      newX = targetX;
    }
    newDragVelocity = 0;
  } else {
    // After release: apply momentum
    if (Math.abs(newDragVelocity) > 0.3) {
      const momentumDecay = Math.exp(-dt / 120);
      const momentumStep = newDragVelocity * (dt / 16.67) * 0.4;
      newX += momentumStep;
      newDragVelocity *= momentumDecay;

      // Bounce at edges
      if (newX < minX) {
        newX = minX;
        newDragVelocity = -newDragVelocity * 0.3;
      } else if (newX > maxX) {
        newX = maxX;
        newDragVelocity = -newDragVelocity * 0.3;
      }
    } else {
      newDragVelocity = 0;
    }
  }

  // Clamp to bounds
  newX = Math.max(minX, Math.min(maxX, newX));

  // Convert center X back to position X
  const halfWidth = (player.bounds?.width ?? 80) / 2;

  return {
    ...player,
    transform: {
      ...player.transform,
      position: {
        x: newX - halfWidth,
        y: player.transform.position.y,
      },
    },
    player: {
      ...player.player,
      targetX,
      dragVelocity: newDragVelocity,
    },
  };
}

/**
 * Set invincibility
 */
export function setInvincible(player: PlayerEntity, durationMs: number): PlayerEntity {
  return {
    ...player,
    player: {
      ...player.player,
      isInvincible: true,
      invincibleUntil: performance.now() + durationMs,
    },
  };
}

/**
 * Check if player is currently invincible
 */
export function isInvincible(player: PlayerEntity): boolean {
  return player.player.isInvincible && performance.now() < player.player.invincibleUntil;
}

/**
 * Update power-up timers
 */
export function updatePowerUpTimers(player: PlayerEntity): PlayerEntity {
  const now = performance.now();

  return {
    ...player,
    player: {
      ...player.player,
      isInvincible: player.player.invincibleUntil > now,
      magnetActive: player.player.magnetUntil > now,
      doublePointsActive: player.player.doublePointsUntil > now,
    },
  };
}

/**
 * Activate magnet power-up
 */
export function activateMagnet(player: PlayerEntity, durationMs: number): PlayerEntity {
  return {
    ...player,
    player: {
      ...player.player,
      magnetActive: true,
      magnetUntil: performance.now() + durationMs,
    },
  };
}

/**
 * Activate double points power-up
 */
export function activateDoublePoints(player: PlayerEntity, durationMs: number): PlayerEntity {
  return {
    ...player,
    player: {
      ...player.player,
      doublePointsActive: true,
      doublePointsUntil: performance.now() + durationMs,
    },
  };
}

/**
 * Update player stress level based on stack state
 */
export function updateStress(player: PlayerEntity, dangerLevel: number): PlayerEntity {
  // Smooth stress transitions
  const targetStress = dangerLevel;
  const currentStress = player.player.stress;
  const newStress = currentStress + (targetStress - currentStress) * 0.1;

  return {
    ...player,
    player: {
      ...player.player,
      stress: newStress,
    },
  };
}
