import { describe, expect, it } from "vitest";
import {
  ABILITY_CONFIGS,
  createAbilitySystemState,
  activateAbility,
  updateAbilityEffects,
  consumeHoneyTrapCatch,
  updateStackAbilityCooldowns,
  resolveAbilityType,
  findTappedAbilityAnimal,
  getFeatherFloatMultiplier,
  getMudSlowFactor,
  checkHayPlatformBounce,
  getAbilityIndicators,
  getActiveEffectVisuals,
  type AbilitySystemState,
  type AbilityEffect,
} from "../systems/AbilitySystem";
import type { AnimalEntity } from "../entities/Animal";
import type { PlayerEntity } from "../entities/Player";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockAnimalEntity(overrides: Partial<AnimalEntity> = {}): AnimalEntity {
  return {
    id: "animal_test_1",
    type: "animal",
    active: true,
    transform: {
      position: { x: 100, y: 200 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    velocity: { linear: { x: 0, y: 3 }, angular: 0 },
    bounds: { width: 50, height: 45 },
    animal: {
      animalType: "cow",
      variant: "normal",
      state: "stacked",
      stackIndex: 0,
      wobbleAngle: 0,
      wobbleVelocity: 0,
      stackOffset: 0,
      pointValue: 10,
      weight: 1,
      abilityReady: true,
      abilityCooldown: 0,
      mergeLevel: 0,
      stress: 0,
    },
    ...overrides,
  } as AnimalEntity;
}

function mockFallingAnimal(
  id: string,
  x: number,
  y: number
): AnimalEntity {
  return mockAnimalEntity({
    id,
    transform: {
      position: { x, y },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    animal: {
      animalType: "chicken",
      variant: "white",
      state: "falling",
      stackIndex: -1,
      wobbleAngle: 0,
      wobbleVelocity: 0,
      stackOffset: 0,
      pointValue: 5,
      weight: 0.5,
      abilityReady: false,
      abilityCooldown: 0,
      mergeLevel: 0,
      stress: 0,
    },
  });
}

function mockPlayerEntity(stack: AnimalEntity[] = []): PlayerEntity {
  return {
    id: "player",
    type: "player",
    active: true,
    transform: {
      position: { x: 180, y: 500 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    },
    bounds: { width: 80, height: 100 },
    player: {
      stack,
      targetX: 200,
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
  } as PlayerEntity;
}

const defaultContext = {
  playerCenterX: 200,
  stackTopY: 400,
  canvasWidth: 400,
  canvasHeight: 700,
  groundY: 600,
  fallingAnimals: [] as AnimalEntity[],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AbilitySystem", () => {
  describe("ABILITY_CONFIGS", () => {
    it("defines configs for all 9 ability types", () => {
      const expectedTypes = [
        "poop_shot",
        "egg_bomb",
        "mud_splash",
        "wool_shield",
        "bleat_stun",
        "feather_float",
        "honey_trap",
        "crow_call",
        "hay_storm",
      ];
      for (const t of expectedTypes) {
        expect(ABILITY_CONFIGS[t]).toBeDefined();
      }
    });

    it("feather_float has 0 cooldown (passive)", () => {
      expect(ABILITY_CONFIGS.feather_float.cooldown).toBe(0);
      expect(ABILITY_CONFIGS.feather_float.duration).toBe(0);
    });

    it("active abilities have positive cooldowns", () => {
      const active = ["poop_shot", "egg_bomb", "mud_splash", "wool_shield", "bleat_stun", "honey_trap", "crow_call", "hay_storm"];
      for (const t of active) {
        expect(ABILITY_CONFIGS[t].cooldown).toBeGreaterThan(0);
      }
    });
  });

  describe("createAbilitySystemState", () => {
    it("creates an empty state", () => {
      const state = createAbilitySystemState();
      expect(state.activeEffects).toEqual([]);
      expect(state.nextEffectId).toBe(0);
    });
  });

  describe("activateAbility", () => {
    it("returns not-activated for unknown ability type", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "nonexistent", defaultContext);
      expect(result.activated).toBe(false);
      expect(result.bonusScore).toBe(0);
    });

    it("returns not-activated when animal is on cooldown", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity({
        animal: {
          ...mockAnimalEntity().animal,
          abilityCooldown: 5000,
        },
      } as Partial<AnimalEntity>);
      const result = activateAbility(state, animal, "poop_shot", defaultContext);
      expect(result.activated).toBe(false);
    });

    it("activates poop_shot and adds effect to state", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "poop_shot", defaultContext);

      expect(result.activated).toBe(true);
      expect(result.state.activeEffects).toHaveLength(1);
      expect(result.state.activeEffects[0].type).toBe("poop_shot");
      expect(result.animal.animal.abilityCooldown).toBe(ABILITY_CONFIGS.poop_shot.cooldown);
    });

    it("activates wool_shield", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "wool_shield", defaultContext);

      expect(result.activated).toBe(true);
      expect(result.state.activeEffects[0].type).toBe("wool_shield");
    });

    it("activates mud_splash with zone dimensions", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "mud_splash", defaultContext);

      expect(result.activated).toBe(true);
      const effect = result.state.activeEffects[0];
      expect(effect.type).toBe("mud_splash");
      if (effect.type === "mud_splash") {
        expect(effect.width).toBe(ABILITY_CONFIGS.mud_splash.params.zoneWidth);
        expect(effect.slowFactor).toBe(ABILITY_CONFIGS.mud_splash.params.slowFactor);
      }
    });

    it("activates egg_bomb and clears nearby animals", () => {
      const falling = [
        mockFallingAnimal("f1", 190, 390),
        mockFallingAnimal("f2", 500, 500), // Far away
      ];
      const ctx = { ...defaultContext, fallingAnimals: falling };
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "egg_bomb", ctx);

      expect(result.activated).toBe(true);
      expect(result.bonusScore).toBeGreaterThan(0);
      const effect = result.state.activeEffects[0];
      if (effect.type === "egg_bomb") {
        expect(effect.clearedAnimalIds).toContain("f1");
        expect(effect.clearedAnimalIds).not.toContain("f2");
      }
    });

    it("activates bleat_stun and tracks stunned animals", () => {
      const falling = [mockFallingAnimal("f1", 190, 390)];
      const ctx = { ...defaultContext, fallingAnimals: falling };
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "bleat_stun", ctx);

      expect(result.activated).toBe(true);
      const effect = result.state.activeEffects[0];
      if (effect.type === "bleat_stun") {
        expect(effect.stunnedAnimalIds).toContain("f1");
      }
    });

    it("activates honey_trap with catch settings", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "honey_trap", defaultContext);

      expect(result.activated).toBe(true);
      const effect = result.state.activeEffects[0];
      if (effect.type === "honey_trap") {
        expect(effect.catchesRemaining).toBe(ABILITY_CONFIGS.honey_trap.params.maxCatches);
        expect(effect.wobbleReduction).toBe(ABILITY_CONFIGS.honey_trap.params.wobbleReduction);
      }
    });

    it("activates crow_call with pull strength", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "crow_call", defaultContext);

      expect(result.activated).toBe(true);
      const effect = result.state.activeEffects[0];
      if (effect.type === "crow_call") {
        expect(effect.pullStrength).toBe(ABILITY_CONFIGS.crow_call.params.pullStrength);
        expect(effect.targetX).toBe(defaultContext.playerCenterX);
      }
    });

    it("activates hay_storm with platforms", () => {
      const state = createAbilitySystemState();
      const animal = mockAnimalEntity();
      const result = activateAbility(state, animal, "hay_storm", defaultContext);

      expect(result.activated).toBe(true);
      const effect = result.state.activeEffects[0];
      if (effect.type === "hay_storm") {
        expect(effect.platforms.length).toBe(ABILITY_CONFIGS.hay_storm.params.platformCount);
        for (const p of effect.platforms) {
          expect(p.width).toBe(ABILITY_CONFIGS.hay_storm.params.platformWidth);
          expect(p.bounceForce).toBe(ABILITY_CONFIGS.hay_storm.params.bounceForce);
        }
      }
    });
  });

  describe("updateAbilityEffects", () => {
    const updateCtx = {
      playerCenterX: 200,
      stackTopY: 400,
      groundY: 600,
      canvasWidth: 400,
      fallingAnimals: [] as AnimalEntity[],
    };

    it("removes expired effects", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "wool_shield",
            sourceAnimalId: "a1",
            remainingTime: 10,
            totalDuration: 4000,
          },
        ],
        nextEffectId: 1,
      };
      // deltaTime > remainingTime → effect expires
      const result = updateAbilityEffects(state, 100, updateCtx);
      expect(result.state.activeEffects).toHaveLength(0);
      expect(result.isShielded).toBe(false);
    });

    it("keeps active wool_shield and reports isShielded", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "wool_shield",
            sourceAnimalId: "a1",
            remainingTime: 3000,
            totalDuration: 4000,
          },
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.isShielded).toBe(true);
      expect(result.state.activeEffects).toHaveLength(1);
    });

    it("reports mud zones from active mud_splash", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "mud_splash",
            sourceAnimalId: "a1",
            remainingTime: 4000,
            totalDuration: 5000,
            x: 100,
            y: 200,
            width: 160,
            height: 200,
            slowFactor: 0.5,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.mudZones).toHaveLength(1);
      expect(result.mudZones[0].slowFactor).toBe(0.5);
    });

    it("reports crow_call magnetic pull", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "crow_call",
            sourceAnimalId: "a1",
            remainingTime: 2000,
            totalDuration: 3000,
            targetX: 200,
            pullStrength: 0.004,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.magneticPullTargetX).toBe(200);
      expect(result.magneticPullStrength).toBe(0.004);
    });

    it("reports stunned animal IDs from bleat_stun", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "bleat_stun",
            sourceAnimalId: "a1",
            remainingTime: 1500,
            totalDuration: 2000,
            x: 200,
            y: 400,
            radius: 180,
            stunnedAnimalIds: ["f1", "f2"],
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.stunnedAnimalIds.has("f1")).toBe(true);
      expect(result.stunnedAnimalIds.has("f2")).toBe(true);
    });

    it("reports honey_trap centering factor and wobble reduction", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "honey_trap",
            sourceAnimalId: "a1",
            remainingTime: 5000,
            totalDuration: 6000,
            x: 200,
            y: 400,
            catchCenteringFactor: 0.7,
            wobbleReduction: 0.5,
            catchesRemaining: 3,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.honeyTrapCenteringFactor).toBe(0.7);
      expect(result.wobbleReduction).toBe(0.5);
    });

    it("poop_shot spawns bush when hitting ground", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "poop_shot",
            sourceAnimalId: "a1",
            remainingTime: 1500,
            totalDuration: 2000,
            x: 200,
            y: 597,
            vx: 3,
            vy: 5,
            gravity: 0.25,
            lifetime: 2000,
            groundY: 600,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      // The projectile is at y=590 moving down at vy=5, ground is 600
      // After one tick it should hit ground
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.bushSpawnPositions.length).toBeGreaterThan(0);
    });

    it("hay_storm reports platforms for bounce checks", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "hay_storm",
            sourceAnimalId: "a1",
            remainingTime: 7000,
            totalDuration: 8000,
            platforms: [
              { id: "h1", x: 100, y: 200, width: 70, height: 20, bounceForce: 10, vx: 0.2 },
              { id: "h2", x: 250, y: 300, width: 70, height: 20, bounceForce: 10, vx: -0.1 },
            ],
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const result = updateAbilityEffects(state, 16.67, updateCtx);
      expect(result.hayPlatforms).toHaveLength(2);
      expect(result.hayPlatforms[0].bounceForce).toBe(10);
    });
  });

  describe("consumeHoneyTrapCatch", () => {
    it("decrements catches remaining on honey_trap", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "honey_trap",
            sourceAnimalId: "a1",
            remainingTime: 5000,
            totalDuration: 6000,
            x: 200,
            y: 400,
            catchCenteringFactor: 0.7,
            wobbleReduction: 0.5,
            catchesRemaining: 3,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const updated = consumeHoneyTrapCatch(state);
      const effect = updated.activeEffects[0];
      if (effect.type === "honey_trap") {
        expect(effect.catchesRemaining).toBe(2);
      }
    });

    it("does not decrement below 0", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "honey_trap",
            sourceAnimalId: "a1",
            remainingTime: 5000,
            totalDuration: 6000,
            x: 200,
            y: 400,
            catchCenteringFactor: 0.7,
            wobbleReduction: 0.5,
            catchesRemaining: 0,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const updated = consumeHoneyTrapCatch(state);
      const effect = updated.activeEffects[0];
      if (effect.type === "honey_trap") {
        expect(effect.catchesRemaining).toBe(0);
      }
    });

    it("does not affect non-honey_trap effects", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "wool_shield",
            sourceAnimalId: "a1",
            remainingTime: 3000,
            totalDuration: 4000,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const updated = consumeHoneyTrapCatch(state);
      expect(updated.activeEffects[0].type).toBe("wool_shield");
    });
  });

  describe("updateStackAbilityCooldowns", () => {
    it("reduces cooldown by deltaTime", () => {
      const stack = [
        mockAnimalEntity({
          animal: { ...mockAnimalEntity().animal, abilityCooldown: 5000 },
        } as Partial<AnimalEntity>),
      ];
      const updated = updateStackAbilityCooldowns(stack, 1000);
      expect(updated[0].animal.abilityCooldown).toBe(4000);
    });

    it("clamps cooldown to 0", () => {
      const stack = [
        mockAnimalEntity({
          animal: { ...mockAnimalEntity().animal, abilityCooldown: 500 },
        } as Partial<AnimalEntity>),
      ];
      const updated = updateStackAbilityCooldowns(stack, 1000);
      expect(updated[0].animal.abilityCooldown).toBe(0);
    });

    it("skips animals with no cooldown", () => {
      const animal = mockAnimalEntity();
      const stack = [animal];
      const updated = updateStackAbilityCooldowns(stack, 1000);
      expect(updated[0]).toBe(animal); // Same reference, no mutation
    });
  });

  describe("resolveAbilityType", () => {
    it("returns null when abilityReady is false", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, abilityReady: false },
      } as Partial<AnimalEntity>);
      expect(resolveAbilityType(animal)).toBeNull();
    });

    it("returns null for unknown animal type", () => {
      const animal = mockAnimalEntity({
        animal: {
          ...mockAnimalEntity().animal,
          animalType: "unknown_animal" as "cow",
          abilityReady: true,
        },
      } as Partial<AnimalEntity>);
      expect(resolveAbilityType(animal)).toBeNull();
    });
  });

  describe("findTappedAbilityAnimal", () => {
    it("returns null when stack is empty", () => {
      const player = mockPlayerEntity([]);
      expect(findTappedAbilityAnimal(200, 200, player)).toBeNull();
    });

    it("returns null when no animals have ability ready", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, abilityReady: false },
      } as Partial<AnimalEntity>);
      const player = mockPlayerEntity([animal]);
      expect(findTappedAbilityAnimal(100, 200, player)).toBeNull();
    });

    it("returns null when animal is on cooldown", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, abilityReady: true, abilityCooldown: 5000 },
      } as Partial<AnimalEntity>);
      const player = mockPlayerEntity([animal]);
      expect(findTappedAbilityAnimal(100, 200, player)).toBeNull();
    });

    it("returns animal when tapped within bounds", () => {
      const animal = mockAnimalEntity({
        transform: { position: { x: 100, y: 200 }, rotation: 0, scale: { x: 1, y: 1 } },
        bounds: { width: 50, height: 45 },
        animal: { ...mockAnimalEntity().animal, abilityReady: true, abilityCooldown: 0 },
      } as Partial<AnimalEntity>);
      const player = mockPlayerEntity([animal]);
      const result = findTappedAbilityAnimal(125, 220, player);
      expect(result).toBe(animal);
    });

    it("returns null when tap is outside bounds", () => {
      const animal = mockAnimalEntity({
        transform: { position: { x: 100, y: 200 }, rotation: 0, scale: { x: 1, y: 1 } },
        bounds: { width: 50, height: 45 },
        animal: { ...mockAnimalEntity().animal, abilityReady: true, abilityCooldown: 0 },
      } as Partial<AnimalEntity>);
      const player = mockPlayerEntity([animal]);
      const result = findTappedAbilityAnimal(300, 300, player);
      expect(result).toBeNull();
    });

    it("prioritizes topmost animal in stack", () => {
      const bottom = mockAnimalEntity({
        id: "bottom",
        transform: { position: { x: 100, y: 250 }, rotation: 0, scale: { x: 1, y: 1 } },
        bounds: { width: 50, height: 45 },
        animal: { ...mockAnimalEntity().animal, abilityReady: true, abilityCooldown: 0 },
      } as Partial<AnimalEntity>);
      const top = mockAnimalEntity({
        id: "top",
        transform: { position: { x: 100, y: 200 }, rotation: 0, scale: { x: 1, y: 1 } },
        bounds: { width: 50, height: 45 },
        animal: { ...mockAnimalEntity().animal, abilityReady: true, abilityCooldown: 0 },
      } as Partial<AnimalEntity>);
      // Stack: bottom at index 0, top at index 1. findTapped iterates top-to-bottom.
      const player = mockPlayerEntity([bottom, top]);
      const result = findTappedAbilityAnimal(125, 220, player);
      expect(result?.id).toBe("top");
    });
  });

  describe("getFeatherFloatMultiplier", () => {
    it("returns 1.0 for non-ability animals", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, abilityReady: false },
      } as Partial<AnimalEntity>);
      expect(getFeatherFloatMultiplier(animal)).toBe(1.0);
    });

    it("returns 1.0 for non-duck ability animals", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, animalType: "cow", abilityReady: true, state: "falling" },
      } as Partial<AnimalEntity>);
      expect(getFeatherFloatMultiplier(animal)).toBe(1.0);
    });
  });

  describe("getMudSlowFactor", () => {
    it("returns 1.0 when no mud zones", () => {
      expect(getMudSlowFactor(100, 200, 50, 45, [])).toBe(1.0);
    });

    it("returns slowFactor when animal is inside mud zone", () => {
      const zones = [{ x: 50, y: 150, width: 200, height: 200, slowFactor: 0.5 }];
      expect(getMudSlowFactor(100, 200, 50, 45, zones)).toBe(0.5);
    });

    it("returns 1.0 when animal is outside mud zone", () => {
      const zones = [{ x: 50, y: 150, width: 50, height: 50, slowFactor: 0.5 }];
      expect(getMudSlowFactor(300, 300, 50, 45, zones)).toBe(1.0);
    });

    it("returns the smallest factor when overlapping multiple zones", () => {
      const zones = [
        { x: 50, y: 150, width: 200, height: 200, slowFactor: 0.5 },
        { x: 80, y: 180, width: 100, height: 100, slowFactor: 0.3 },
      ];
      expect(getMudSlowFactor(100, 200, 50, 45, zones)).toBe(0.3);
    });
  });

  describe("checkHayPlatformBounce", () => {
    it("returns no bounce when velocity is upward", () => {
      const platforms = [{ x: 50, y: 250, width: 70, height: 20, bounceForce: 10 }];
      const result = checkHayPlatformBounce(60, 200, 50, 45, -3, platforms);
      expect(result.bounced).toBe(false);
    });

    it("returns no bounce when no platforms overlap", () => {
      const platforms = [{ x: 50, y: 250, width: 70, height: 20, bounceForce: 10 }];
      const result = checkHayPlatformBounce(300, 200, 50, 45, 3, platforms);
      expect(result.bounced).toBe(false);
    });

    it("returns bounce when animal bottom hits platform", () => {
      // Animal at y=205, height=45 → bottom at 250, platform at y=250
      const platforms = [{ x: 50, y: 250, width: 70, height: 20, bounceForce: 10 }];
      const result = checkHayPlatformBounce(60, 205, 50, 45, 3, platforms);
      expect(result.bounced).toBe(true);
      expect(result.bounceVelocityY).toBe(-10);
    });

    it("returns empty platforms list gives no bounce", () => {
      const result = checkHayPlatformBounce(60, 205, 50, 45, 3, []);
      expect(result.bounced).toBe(false);
    });
  });

  describe("getAbilityIndicators", () => {
    it("returns empty array for empty stack", () => {
      expect(getAbilityIndicators([])).toEqual([]);
    });

    it("skips animals without ability", () => {
      const animal = mockAnimalEntity({
        animal: { ...mockAnimalEntity().animal, abilityReady: false },
      } as Partial<AnimalEntity>);
      expect(getAbilityIndicators([animal])).toEqual([]);
    });
  });

  describe("getActiveEffectVisuals", () => {
    it("returns empty array for empty state", () => {
      const state = createAbilitySystemState();
      expect(getActiveEffectVisuals(state)).toEqual([]);
    });

    it("returns visual data for wool_shield effect", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "wool_shield",
            sourceAnimalId: "a1",
            remainingTime: 2000,
            totalDuration: 4000,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const visuals = getActiveEffectVisuals(state);
      expect(visuals).toHaveLength(1);
      expect(visuals[0].type).toBe("wool_shield");
      expect(visuals[0].progress).toBeCloseTo(0.5);
    });

    it("returns multiple visuals for hay_storm platforms", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "hay_storm",
            sourceAnimalId: "a1",
            remainingTime: 4000,
            totalDuration: 8000,
            platforms: [
              { id: "h1", x: 100, y: 200, width: 70, height: 20, bounceForce: 10, vx: 0 },
              { id: "h2", x: 250, y: 300, width: 70, height: 20, bounceForce: 10, vx: 0 },
            ],
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const visuals = getActiveEffectVisuals(state);
      expect(visuals).toHaveLength(2);
      expect(visuals[0].type).toBe("hay_platform");
      expect(visuals[1].type).toBe("hay_platform");
    });

    it("includes catchesRemaining in honey_trap extra", () => {
      const state: AbilitySystemState = {
        activeEffects: [
          {
            id: "e1",
            type: "honey_trap",
            sourceAnimalId: "a1",
            remainingTime: 3000,
            totalDuration: 6000,
            x: 200,
            y: 400,
            catchCenteringFactor: 0.7,
            wobbleReduction: 0.5,
            catchesRemaining: 2,
          } as AbilityEffect,
        ],
        nextEffectId: 1,
      };
      const visuals = getActiveEffectVisuals(state);
      expect(visuals[0].extra?.catchesRemaining).toBe(2);
    });
  });
});
