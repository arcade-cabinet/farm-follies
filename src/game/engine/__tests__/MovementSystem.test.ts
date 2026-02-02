import { describe, expect, it } from "vitest";
import {
  updatePlayerMovement,
  updateFallingAnimal,
  updateTornadoMovement,
  updateProjectile,
  DEFAULT_MOVEMENT_CONFIG,
  type MovementConfig,
} from "../systems/MovementSystem";
import type { AnimalState, PlayerState, TornadoState, ProjectileState, InputState } from "../state/GameState";

// Helpers to create test entities
function createTestInput(overrides: Partial<InputState> = {}): InputState {
  return {
    pointerX: 0,
    pointerY: 0,
    isPointerDown: false,
    isDragging: false,
    dragStartX: 0,
    dragOffsetX: 0,
    ...overrides,
  };
}

function createTestPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    id: "player-1",
    x: 200,
    y: 500,
    width: 60,
    height: 80,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    scale: 1,
    active: true,
    stackedAnimals: [],
    isInvincible: false,
    invincibilityTimer: 0,
    magnetActive: false,
    magnetTimer: 0,
    doublePointsActive: false,
    doublePointsTimer: 0,
    ...overrides,
  };
}

function createTestAnimal(overrides: Partial<AnimalState> = {}): AnimalState {
  return {
    id: "animal-1",
    type: "chicken",
    variant: "white",
    x: 150,
    y: 50,
    width: 50,
    height: 45,
    velocityX: 0,
    velocityY: 2,
    rotation: 0,
    scale: 1,
    active: true,
    isCaught: false,
    stackIndex: -1,
    wobblePhase: 0,
    wobbleAmplitude: 0,
    specialAbilityReady: false,
    specialAbilityCooldown: 0,
    ...overrides,
  };
}

function createTestTornado(overrides: Partial<TornadoState> = {}): TornadoState {
  return {
    x: 200,
    y: 50,
    direction: 1,
    speed: 2,
    rotation: 0,
    intensity: 0.5,
    isSpawning: false,
    spawnCooldown: 0,
    width: 80,
    height: 120,
    ...overrides,
  };
}

describe("MovementSystem", () => {
  const dt = 16.67; // ~60fps frame time

  describe("DEFAULT_MOVEMENT_CONFIG", () => {
    it("has positive gravity", () => {
      expect(DEFAULT_MOVEMENT_CONFIG.gravity).toBeGreaterThan(0);
    });

    it("has positive max fall speed", () => {
      expect(DEFAULT_MOVEMENT_CONFIG.maxFallSpeed).toBeGreaterThan(0);
    });

    it("has player deceleration less than 1", () => {
      expect(DEFAULT_MOVEMENT_CONFIG.playerDeceleration).toBeLessThan(1);
      expect(DEFAULT_MOVEMENT_CONFIG.playerDeceleration).toBeGreaterThan(0);
    });
  });

  describe("updatePlayerMovement", () => {
    it("does not move player when not dragging", () => {
      const player = createTestPlayer({ velocityX: 0 });
      const input = createTestInput();
      const result = updatePlayerMovement(player, input, 400, 60, dt);

      expect(result.x).toBeCloseTo(player.x, 0);
    });

    it("moves player toward drag target", () => {
      const player = createTestPlayer({ x: 100 });
      const input = createTestInput({ isDragging: true, isPointerDown: true, pointerX: 200, pointerY: 500 });
      const result = updatePlayerMovement(player, input, 400, 60, dt);

      expect(result.x).toBeGreaterThan(100);
    });

    it("clamps player to play area bounds", () => {
      const player = createTestPlayer({ x: -50, velocityX: -10 });
      const input = createTestInput({ isDragging: true, isPointerDown: true, pointerX: -100, pointerY: 500 });
      const result = updatePlayerMovement(player, input, 400, 60, dt);

      expect(result.x).toBeGreaterThanOrEqual(0);
    });

    it("clamps player to right boundary", () => {
      const player = createTestPlayer({ x: 400, velocityX: 10 });
      const input = createTestInput({ isDragging: true, isPointerDown: true, pointerX: 500, pointerY: 500 });
      const result = updatePlayerMovement(player, input, 400, 60, dt);

      expect(result.x).toBeLessThanOrEqual(400 - 60 - player.width);
    });

    it("decelerates when not dragging", () => {
      const player = createTestPlayer({ velocityX: 10 });
      const input = createTestInput();
      const result = updatePlayerMovement(player, input, 400, 60, dt);

      expect(Math.abs(result.velocityX)).toBeLessThan(Math.abs(player.velocityX));
    });
  });

  describe("updateFallingAnimal", () => {
    it("applies gravity to falling animal", () => {
      const animal = createTestAnimal({ velocityY: 0 });
      const result = updateFallingAnimal(animal, dt);

      expect(result.velocityY).toBeGreaterThan(0);
    });

    it("increases Y position (animal falls down)", () => {
      const animal = createTestAnimal({ velocityY: 3 });
      const result = updateFallingAnimal(animal, dt);

      expect(result.y).toBeGreaterThan(animal.y);
    });

    it("respects max fall speed", () => {
      const animal = createTestAnimal({ velocityY: 100 });
      const result = updateFallingAnimal(animal, dt);

      expect(result.velocityY).toBeLessThanOrEqual(DEFAULT_MOVEMENT_CONFIG.maxFallSpeed);
    });

    it("applies air resistance to horizontal velocity", () => {
      const animal = createTestAnimal({ velocityX: 5 });
      const result = updateFallingAnimal(animal, dt);

      expect(Math.abs(result.velocityX)).toBeLessThan(Math.abs(animal.velocityX));
    });

    it("applies magnetic pull when provided", () => {
      const animal = createTestAnimal({ velocityX: 0, velocityY: 2 });
      const magnetPull = { x: 3, y: 0 };
      const result = updateFallingAnimal(animal, dt, magnetPull);

      expect(result.velocityX).toBeGreaterThan(0);
    });

    it("updates rotation based on horizontal velocity", () => {
      const animal = createTestAnimal({ velocityX: 5, rotation: 0 });
      const result = updateFallingAnimal(animal, dt);

      expect(result.rotation).not.toBe(0);
    });
  });

  describe("updateTornadoMovement", () => {
    it("moves tornado in its direction", () => {
      const tornado = createTestTornado({ x: 200, direction: 1 });
      const result = updateTornadoMovement(tornado, 400, 60, dt);

      expect(result.x).toBeGreaterThan(200);
    });

    it("bounces tornado at left edge", () => {
      const tornado = createTestTornado({ x: 45, direction: -1 });
      const result = updateTornadoMovement(tornado, 400, 60, dt);

      expect(result.direction).toBe(1);
    });

    it("bounces tornado at right edge", () => {
      const tornado = createTestTornado({ x: 290, direction: 1 });
      const result = updateTornadoMovement(tornado, 400, 60, dt);

      expect(result.direction).toBe(-1);
    });

    it("updates tornado rotation", () => {
      const tornado = createTestTornado({ rotation: 0, intensity: 0.5 });
      const result = updateTornadoMovement(tornado, 400, 60, dt);

      expect(result.rotation).not.toBe(0);
    });
  });

  describe("updateProjectile", () => {
    it("applies gravity to projectile", () => {
      const projectile: ProjectileState = {
        id: "proj-1",
        type: "poop",
        x: 100,
        y: 100,
        width: 10,
        height: 10,
        velocityX: 5,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
        sourceAnimalId: "cow-1",
        damage: 0,
        lifetime: 3000,
      };
      const result = updateProjectile(projectile, dt);

      expect(result.velocityY).toBeGreaterThan(0);
      expect(result.x).toBeGreaterThan(projectile.x);
    });
  });
});
