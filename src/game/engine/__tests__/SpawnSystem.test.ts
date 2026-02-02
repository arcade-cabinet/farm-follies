import { describe, expect, it } from "vitest";
import type { AnimalType } from "../../config";
import {
  ANIMAL_ARCHETYPES,
  calculateSpawnInterval,
  createAnimalState,
  createSpawnState,
  DEFAULT_SPAWN_CONFIG,
  type SpawnConfig,
  selectAnimalType,
  selectVariant,
  shouldSpawn,
} from "../systems/SpawnSystem";

describe("SpawnSystem", () => {
  describe("DEFAULT_SPAWN_CONFIG", () => {
    it("has sensible base interval", () => {
      expect(DEFAULT_SPAWN_CONFIG.baseInterval).toBeGreaterThan(0);
      expect(DEFAULT_SPAWN_CONFIG.minInterval).toBeGreaterThan(0);
      expect(DEFAULT_SPAWN_CONFIG.baseInterval).toBeGreaterThan(DEFAULT_SPAWN_CONFIG.minInterval);
    });

    it("has animal weights defined", () => {
      expect(DEFAULT_SPAWN_CONFIG.animalWeights.size).toBeGreaterThan(0);
    });

    it("has special variant chance between 0 and 1", () => {
      expect(DEFAULT_SPAWN_CONFIG.specialVariantChance).toBeGreaterThan(0);
      expect(DEFAULT_SPAWN_CONFIG.specialVariantChance).toBeLessThanOrEqual(1);
    });
  });

  describe("ANIMAL_ARCHETYPES", () => {
    it("defines archetypes for all animal types", () => {
      const expectedTypes: AnimalType[] = [
        "chicken",
        "duck",
        "pig",
        "cow",
        "sheep",
        "goat",
        "horse",
        "goose",
        "rooster",
      ];
      for (const type of expectedTypes) {
        expect(ANIMAL_ARCHETYPES.has(type)).toBe(true);
      }
    });

    it("each archetype has valid dimensions", () => {
      for (const [, archetype] of ANIMAL_ARCHETYPES) {
        expect(archetype.width).toBeGreaterThan(0);
        expect(archetype.height).toBeGreaterThan(0);
        expect(archetype.fallSpeed).toBeGreaterThan(0);
        expect(archetype.pointValue).toBeGreaterThan(0);
      }
    });

    it("each archetype has at least one variant", () => {
      for (const [, archetype] of ANIMAL_ARCHETYPES) {
        expect(archetype.variants.length).toBeGreaterThan(0);
      }
    });

    it("special variants have abilities defined", () => {
      let specialCount = 0;
      for (const [, archetype] of ANIMAL_ARCHETYPES) {
        for (const variant of archetype.variants) {
          if (variant.specialAbility) {
            specialCount++;
            expect(variant.specialAbility.type).toBeTruthy();
            expect(variant.specialAbility.cooldown).toBeGreaterThanOrEqual(0);
          }
        }
      }
      expect(specialCount).toBeGreaterThan(0);
    });

    it("chicken has egg bomb ability", () => {
      const chicken = ANIMAL_ARCHETYPES.get("chicken");
      const golden = chicken?.variants.find((v) => v.specialAbility?.type === "egg_bomb");
      expect(golden).toBeTruthy();
      expect(golden?.rarity).toBe("rare");
    });

    it("cow has poop shot ability", () => {
      const cow = ANIMAL_ARCHETYPES.get("cow");
      const brown = cow?.variants.find((v) => v.specialAbility?.type === "poop_shot");
      expect(brown).toBeTruthy();
    });
  });

  describe("calculateSpawnInterval", () => {
    it("returns base interval at level 1", () => {
      const interval = calculateSpawnInterval(1, DEFAULT_SPAWN_CONFIG);
      expect(interval).toBe(DEFAULT_SPAWN_CONFIG.baseInterval);
    });

    it("decreases interval with higher levels", () => {
      const level1 = calculateSpawnInterval(1, DEFAULT_SPAWN_CONFIG);
      const level5 = calculateSpawnInterval(5, DEFAULT_SPAWN_CONFIG);
      const level10 = calculateSpawnInterval(10, DEFAULT_SPAWN_CONFIG);

      expect(level5).toBeLessThan(level1);
      expect(level10).toBeLessThan(level5);
    });

    it("never goes below minimum interval", () => {
      const interval = calculateSpawnInterval(100, DEFAULT_SPAWN_CONFIG);
      expect(interval).toBeGreaterThanOrEqual(DEFAULT_SPAWN_CONFIG.minInterval);
    });
  });

  describe("selectAnimalType", () => {
    it("returns a valid animal type", () => {
      const validTypes = Array.from(DEFAULT_SPAWN_CONFIG.animalWeights.keys());
      for (let i = 0; i < 50; i++) {
        const type = selectAnimalType(1, DEFAULT_SPAWN_CONFIG);
        expect(validTypes).toContain(type);
      }
    });
  });

  describe("shouldSpawn", () => {
    it("returns false when not enough time has elapsed", () => {
      const state = createSpawnState();
      const result = shouldSpawn(state, 100, 1, 0, DEFAULT_SPAWN_CONFIG);
      expect(result).toBe(false);
    });

    it("returns true when enough time has elapsed", () => {
      const state = createSpawnState();
      const result = shouldSpawn(state, 3000, 1, 0, DEFAULT_SPAWN_CONFIG);
      expect(result).toBe(true);
    });

    it("returns false when max simultaneous animals reached", () => {
      const state = createSpawnState();
      const result = shouldSpawn(state, 3000, 1, 10, DEFAULT_SPAWN_CONFIG);
      expect(result).toBe(false);
    });
  });

  describe("createAnimalState", () => {
    it("creates an animal with valid properties", () => {
      const variant = selectVariant("chicken", 1, DEFAULT_SPAWN_CONFIG);
      const animal = createAnimalState("chicken", variant, 200, 0);
      expect(animal).toBeTruthy();
      expect(animal.type).toBe("chicken");
      expect(animal.y).toBe(0);
      expect(animal.active).toBe(true);
      expect(animal.isCaught).toBe(false);
    });

    it("sets dimensions from archetype", () => {
      const variant = selectVariant("cow", 1, DEFAULT_SPAWN_CONFIG);
      const animal = createAnimalState("cow", variant, 200, 0);
      const archetype = ANIMAL_ARCHETYPES.get("cow")!;
      expect(animal.width).toBe(archetype.width);
      expect(animal.height).toBe(archetype.height);
    });

    it("generates unique IDs", () => {
      const variant = selectVariant("chicken", 1, DEFAULT_SPAWN_CONFIG);
      const a1 = createAnimalState("chicken", variant, 100, 0);
      const a2 = createAnimalState("chicken", variant, 200, 0);
      expect(a1.id).not.toBe(a2.id);
    });
  });
});
