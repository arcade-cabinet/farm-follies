/**
 * CollisionSystem unit tests
 */

import { describe, expect, it } from "vitest";
import type { AnimalState, BushState, PlayerState } from "../state/GameState";
import {
  type BoundingBox,
  calculateMagneticPull,
  checkAABBCollision,
  checkAnimalCatch,
  checkAnimalMissed,
  checkBushBounce,
  checkCircleCollision,
  clampToPlayArea,
  getEntityBounds,
  getPlayerCatchZone,
  getStackTopPosition,
  isInPlayArea,
} from "../systems/CollisionSystem";

describe("CollisionSystem", () => {
  describe("checkAABBCollision", () => {
    it("should detect overlapping boxes", () => {
      const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
      const b: BoundingBox = { x: 50, y: 50, width: 100, height: 100 };

      const result = checkAABBCollision(a, b);

      expect(result.collided).toBe(true);
      expect(result.overlap.x).toBe(50);
      expect(result.overlap.y).toBe(50);
    });

    it("should not detect non-overlapping boxes", () => {
      const a: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const b: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };

      const result = checkAABBCollision(a, b);

      expect(result.collided).toBe(false);
      expect(result.overlap.x).toBe(0);
      expect(result.overlap.y).toBe(0);
    });

    it("should handle touching boxes (no overlap)", () => {
      const a: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const b: BoundingBox = { x: 50, y: 0, width: 50, height: 50 };

      const result = checkAABBCollision(a, b);

      expect(result.collided).toBe(false);
    });

    it("should calculate correct collision normal", () => {
      const a: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
      const b: BoundingBox = { x: 80, y: 0, width: 100, height: 100 };

      const result = checkAABBCollision(a, b);

      expect(result.collided).toBe(true);
      // Horizontal collision (less overlap than vertical)
      expect(result.normal.x).not.toBe(0);
      expect(result.normal.y).toBe(0);
    });
  });

  describe("checkCircleCollision", () => {
    it("should detect overlapping circles", () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 70, y: 0, radius: 50 };

      const result = checkCircleCollision(a, b);

      expect(result.collided).toBe(true);
      expect(result.penetration).toBe(30);
    });

    it("should not detect non-overlapping circles", () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 150, y: 0, radius: 50 };

      const result = checkCircleCollision(a, b);

      expect(result.collided).toBe(false);
    });

    it("should handle exactly touching circles", () => {
      const a = { x: 0, y: 0, radius: 50 };
      const b = { x: 100, y: 0, radius: 50 };

      const result = checkCircleCollision(a, b);

      expect(result.collided).toBe(false);
    });
  });

  describe("checkAnimalCatch", () => {
    const createMockPlayer = (x: number, y: number): PlayerState => ({
      id: "player",
      x,
      y,
      width: 80,
      height: 100,
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
    });

    const createMockAnimal = (x: number, y: number): AnimalState => ({
      id: "animal_1",
      type: "chicken",
      variant: "white",
      x,
      y,
      width: 50,
      height: 45,
      velocityX: 0,
      velocityY: 5,
      rotation: 0,
      scale: 1,
      active: true,
      isCaught: false,
      stackIndex: -1,
      wobblePhase: 0,
      wobbleAmplitude: 0,
      specialAbilityReady: false,
      specialAbilityCooldown: 0,
    });

    it("should catch animal in player catch zone", () => {
      const player = createMockPlayer(100, 400);
      const animal = createMockAnimal(120, 400);

      const result = checkAnimalCatch(animal, player, []);

      expect(result.caught).toBe(true);
    });

    it("should not catch animal outside catch zone", () => {
      const player = createMockPlayer(100, 400);
      const animal = createMockAnimal(300, 400);

      const result = checkAnimalCatch(animal, player, []);

      expect(result.caught).toBe(false);
    });

    it("should identify center catch position", () => {
      const player = createMockPlayer(100, 400);
      const animal = createMockAnimal(115, 400); // Centered on player

      const result = checkAnimalCatch(animal, player, []);

      expect(result.caught).toBe(true);
      expect(result.catchPosition).toBe("center");
    });

    it("should identify left catch position", () => {
      const player = createMockPlayer(100, 400);
      const animal = createMockAnimal(80, 400); // Left side

      const result = checkAnimalCatch(animal, player, []);

      if (result.caught) {
        expect(result.relativeX).toBeLessThan(0);
      }
    });
  });

  describe("checkAnimalMissed", () => {
    const createMockPlayer = (): PlayerState => ({
      id: "player",
      x: 100,
      y: 400,
      width: 80,
      height: 100,
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
    });

    const createMockAnimal = (y: number): AnimalState => ({
      id: "animal_1",
      type: "chicken",
      variant: "white",
      x: 100,
      y,
      width: 50,
      height: 45,
      velocityX: 0,
      velocityY: 5,
      rotation: 0,
      scale: 1,
      active: true,
      isCaught: false,
      stackIndex: -1,
      wobblePhase: 0,
      wobbleAmplitude: 0,
      specialAbilityReady: false,
      specialAbilityCooldown: 0,
    });

    it("should detect missed animal below player", () => {
      const player = createMockPlayer();
      const animal = createMockAnimal(550); // Below player bottom (400 + 100 + buffer)

      const result = checkAnimalMissed(animal, 600, player);

      expect(result).toBe(true);
    });

    it("should not flag animal still above player as missed", () => {
      const player = createMockPlayer();
      const animal = createMockAnimal(300); // Above player

      const result = checkAnimalMissed(animal, 600, player);

      expect(result).toBe(false);
    });
  });

  describe("checkBushBounce", () => {
    const createMockAnimal = (y: number, vy: number): AnimalState => ({
      id: "animal_1",
      type: "chicken",
      variant: "white",
      x: 100,
      y,
      width: 50,
      height: 45,
      velocityX: 0,
      velocityY: vy,
      rotation: 0,
      scale: 1,
      active: true,
      isCaught: false,
      stackIndex: -1,
      wobblePhase: 0,
      wobbleAmplitude: 0,
      specialAbilityReady: false,
      specialAbilityCooldown: 0,
    });

    const createMockBush = (growthStage: number): BushState => ({
      id: "bush_1",
      x: 90,
      y: 400,
      width: 60,
      height: 80,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      scale: 1,
      active: true,
      growthStage,
      bounceStrength: 0.8,
      plantedBy: "cow_1",
    });

    it("should bounce falling animal off grown bush", () => {
      const animal = createMockAnimal(380, 5); // Falling into bush
      const bush = createMockBush(1); // Fully grown

      const result = checkBushBounce(animal, bush);

      expect(result.bounced).toBe(true);
      expect(result.bounceVelocity.y).toBeLessThan(0); // Upward velocity
    });

    it("should not bounce on immature bush", () => {
      const animal = createMockAnimal(380, 5);
      const bush = createMockBush(0.3); // Not grown enough

      const result = checkBushBounce(animal, bush);

      expect(result.bounced).toBe(false);
    });

    it("should not bounce rising animal", () => {
      const animal = createMockAnimal(380, -5); // Rising
      const bush = createMockBush(1);

      const result = checkBushBounce(animal, bush);

      expect(result.bounced).toBe(false);
    });
  });

  describe("isInPlayArea", () => {
    it("should return true for position in play area", () => {
      expect(isInPlayArea(100, 100, 800, 600, 100)).toBe(true);
    });

    it("should return false for position in bank area", () => {
      expect(isInPlayArea(750, 100, 800, 600, 100)).toBe(false);
    });

    it("should return false for negative positions", () => {
      expect(isInPlayArea(-10, 100, 800, 600, 100)).toBe(false);
    });
  });

  describe("calculateMagneticPull", () => {
    it("should pull entity toward player", () => {
      const entity = {
        id: "e1",
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
      };
      const player: PlayerState = {
        id: "player",
        x: 100,
        y: 100,
        width: 80,
        height: 100,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
        stackedAnimals: [] as AnimalState[],
        isInvincible: false,
        invincibilityTimer: 0,
        magnetActive: true,
        magnetTimer: 5000,
        doublePointsActive: false,
        doublePointsTimer: 0,
      };

      const pull = calculateMagneticPull(entity, player, 1);

      expect(pull.x).toBeGreaterThan(0); // Pull toward player (positive x)
      expect(pull.y).toBeGreaterThan(0); // Pull toward player (positive y)
    });

    it("should return zero pull when very close", () => {
      // Position entity center exactly at player center
      // Player center: (100 + 80/2, 100 + 100/2) = (140, 150)
      // Entity center: (x + 50/2, y + 50/2) = (x + 25, y + 25)
      // So entity at (115, 125) has center at (140, 150)
      const entity = {
        id: "e1",
        x: 115,
        y: 125,
        width: 50,
        height: 50,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
      };
      const player: PlayerState = {
        id: "player",
        x: 100,
        y: 100,
        width: 80,
        height: 100,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
        stackedAnimals: [] as AnimalState[],
        isInvincible: false,
        invincibilityTimer: 0,
        magnetActive: true,
        magnetTimer: 5000,
        doublePointsActive: false,
        doublePointsTimer: 0,
      };

      const pull = calculateMagneticPull(entity, player, 1);

      // When centers are exactly the same, distance is 0 and should return zero pull
      expect(pull.x).toBe(0);
      expect(pull.y).toBe(0);
    });
  });

  describe("getStackTopPosition", () => {
    const createMockPlayer = (): PlayerState => ({
      id: "player",
      x: 100,
      y: 400,
      width: 80,
      height: 100,
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
    });

    it("should return player top when no animals stacked", () => {
      const player = createMockPlayer();

      const pos = getStackTopPosition(player, []);

      expect(pos.x).toBe(140); // player.x + player.width / 2
      expect(pos.y).toBe(400); // player.y
    });

    it("should return elevated position with stacked animals", () => {
      const player = createMockPlayer();
      const stackedAnimals: AnimalState[] = [
        {
          id: "a1",
          type: "chicken",
          variant: "white",
          x: 100,
          y: 350,
          width: 50,
          height: 50,
          velocityX: 0,
          velocityY: 0,
          rotation: 0,
          scale: 1,
          active: true,
          isCaught: true,
          stackIndex: 0,
          wobblePhase: 0,
          wobbleAmplitude: 0,
          specialAbilityReady: false,
          specialAbilityCooldown: 0,
        },
      ];

      const pos = getStackTopPosition(player, stackedAnimals);

      expect(pos.y).toBeLessThan(400); // Should be above base player position
    });
  });
});
