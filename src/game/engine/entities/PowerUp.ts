/**
 * PowerUp - Falling power-up entity
 */

import { Entity, createEntity } from "./Entity";
import type { PowerUpType } from "../../config";
import { POWER_UPS, GAME_CONFIG } from "../../config";

export interface PowerUpComponents {
  /** The power-up type */
  powerUpType: PowerUpType;
  /** Bob animation phase (radians) */
  bobPhase: number;
  /** Glow color for rendering */
  glowColor: string;
  /** Display name */
  name: string;
}

export interface PowerUpEntity extends Entity {
  type: "powerup";
  powerup: PowerUpComponents;
}

/**
 * Create a power-up entity
 */
export function createPowerUp(
  x: number,
  y: number,
  type: PowerUpType,
): PowerUpEntity {
  const config = POWER_UPS[type];
  const size = 40;

  const base = createEntity("powerup", x - size / 2, y - size / 2, {
    width: size,
    height: size,
  });

  return {
    ...base,
    type: "powerup",
    velocity: {
      linear: { x: 0, y: GAME_CONFIG.powerUps.fallSpeed },
      angular: 0,
    },
    powerup: {
      powerUpType: type,
      bobPhase: Math.random() * Math.PI * 2,
      glowColor: config?.glowColor ?? "#FFD700",
      name: config?.name ?? "Power-Up",
    },
  };
}

/**
 * Update a power-up's bob animation
 */
export function updatePowerUpBob(
  powerUp: PowerUpEntity,
  dt: number,
): PowerUpEntity {
  const { bobSpeed, bobAmount } = GAME_CONFIG.powerUps;
  const newPhase = powerUp.powerup.bobPhase + bobSpeed * dt;

  return {
    ...powerUp,
    powerup: {
      ...powerUp.powerup,
      bobPhase: newPhase,
    },
  };
}

/**
 * Get the bob Y offset for rendering
 */
export function getPowerUpBobOffset(powerUp: PowerUpEntity): number {
  return Math.sin(powerUp.powerup.bobPhase) * GAME_CONFIG.powerUps.bobAmount;
}
