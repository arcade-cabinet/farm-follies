/**
 * Animal - Farm animal entity with variants and special abilities
 */

import type { AnimalType } from "../../config";
import {
  ANIMAL_ARCHETYPES,
  type AnimalSpawnTemplate,
  type AnimalVariant,
} from "../systems/SpawnSystem";
import { createEntity, type Entity, generateEntityId } from "./Entity";

export type { AnimalType };

export type AnimalState = "falling" | "caught" | "stacked" | "banking" | "scattered";

export interface AnimalComponents {
  /** Animal type */
  animalType: AnimalType;
  /** Variant ID */
  variant: string;
  /** Current state */
  state: AnimalState;
  /** Position in stack (-1 if not stacked) */
  stackIndex: number;
  /** Current wobble angle (radians) */
  wobbleAngle: number;
  /** Wobble angular velocity */
  wobbleVelocity: number;
  /** Horizontal offset in stack */
  stackOffset: number;
  /** Point value */
  pointValue: number;
  /** Weight (affects wobble) */
  weight: number;
  /** Special ability ready */
  abilityReady: boolean;
  /** Ability cooldown remaining (ms) */
  abilityCooldown: number;
  /** Merge level for combined animals */
  mergeLevel: number;
  /** Visual stress indicator (0-1) */
  stress: number;
}

export interface AnimalEntity extends Entity {
  type: "animal";
  animal: AnimalComponents;
}

/**
 * Create a new animal entity
 */
export function createAnimal(
  animalType: AnimalType,
  variant: AnimalVariant,
  x: number,
  y: number,
  archetype: AnimalSpawnTemplate
): AnimalEntity {
  const baseEntity = createEntity("animal", x, y, {
    width: archetype.width,
    height: archetype.height,
    velocityX: (Math.random() - 0.5) * 2,
    velocityY: archetype.fallSpeed,
  });

  return {
    ...baseEntity,
    type: "animal",
    animal: {
      animalType,
      variant: variant.id,
      state: "falling",
      stackIndex: -1,
      wobbleAngle: 0,
      wobbleVelocity: 0,
      stackOffset: 0,
      pointValue: archetype.pointValue * variant.pointMultiplier,
      weight: archetype.stackWeight,
      abilityReady: !!variant.specialAbility,
      abilityCooldown: 0,
      mergeLevel: 1,
      stress: 0,
    },
  };
}

/**
 * Create a random animal based on level
 */
export function createRandomAnimal(x: number, y: number, level: number): AnimalEntity {
  // Weight selection by level
  const animalTypes: AnimalType[] = [
    "chicken",
    "duck",
    "pig",
    "goat",
    "sheep",
    "cow",
    "goose",
    "horse",
    "rooster",
  ];

  // Build weighted list based on archetypes
  const weightedTypes: { type: AnimalType; weight: number }[] = [];
  let totalWeight = 0;

  for (const type of animalTypes) {
    const archetype = ANIMAL_ARCHETYPES.get(type);
    if (!archetype) continue;

    // Adjust weight based on level (heavier animals more common at higher levels)
    const levelBonus = level > 3 ? (archetype.stackWeight - 1) * (level - 3) * 0.1 : 0;
    const weight = archetype.baseWeight + levelBonus;

    weightedTypes.push({ type, weight });
    totalWeight += weight;
  }

  // Select type
  let random = Math.random() * totalWeight;
  let selectedType: AnimalType = "chicken";

  for (const { type, weight } of weightedTypes) {
    random -= weight;
    if (random <= 0) {
      selectedType = type;
      break;
    }
  }

  const archetype = ANIMAL_ARCHETYPES.get(selectedType);
  if (!archetype) {
    // Fallback to chicken if selected type has no archetype
    const fallback = ANIMAL_ARCHETYPES.get("chicken");
    if (!fallback) {
      throw new Error(`No archetype found for animal type: ${selectedType}`);
    }
    return createAnimal(selectedType, fallback.variants[0], x, y, fallback);
  }

  // Select variant
  const specialChance = 0.15 + level * 0.01;
  let variant = archetype.variants[0]; // Default to first variant

  if (Math.random() < specialChance && archetype.variants.length > 1) {
    const specialVariants = archetype.variants.filter((v) => v.rarity !== "common");
    if (specialVariants.length > 0) {
      const rarityWeights: Record<string, number> = {
        uncommon: 0.6,
        rare: 0.3,
        legendary: 0.1,
      };

      let totalRarityWeight = 0;
      for (const v of specialVariants) {
        totalRarityWeight += rarityWeights[v.rarity] ?? 0.1;
      }

      let rarityRandom = Math.random() * totalRarityWeight;
      for (const v of specialVariants) {
        rarityRandom -= rarityWeights[v.rarity] ?? 0.1;
        if (rarityRandom <= 0) {
          variant = v;
          break;
        }
      }
    }
  } else if (archetype.variants.length > 0) {
    const commonVariants = archetype.variants.filter((v) => v.rarity === "common");
    if (commonVariants.length > 0) {
      variant = commonVariants[Math.floor(Math.random() * commonVariants.length)];
    }
  }

  return createAnimal(selectedType, variant, x, y, archetype);
}

/**
 * Update animal state to caught
 */
export function catchAnimal(
  animal: AnimalEntity,
  stackIndex: number,
  stackOffset: number
): AnimalEntity {
  return {
    ...animal,
    animal: {
      ...animal.animal,
      state: "stacked",
      stackIndex,
      stackOffset,
    },
    velocity: undefined, // Stop moving
  };
}

/**
 * Update animal wobble
 */
export function updateAnimalWobble(
  animal: AnimalEntity,
  wobbleForce: number,
  dt: number
): AnimalEntity {
  const dampingFactor = 0.98;
  const springConstant = 5;

  // Spring physics
  const springForce = -animal.animal.wobbleAngle * springConstant;
  const newVelocity =
    (animal.animal.wobbleVelocity + springForce * (dt / 1000) + wobbleForce) * dampingFactor;
  const newAngle = animal.animal.wobbleAngle + newVelocity * (dt / 1000);

  return {
    ...animal,
    animal: {
      ...animal.animal,
      wobbleAngle: newAngle,
      wobbleVelocity: newVelocity,
    },
  };
}

/**
 * Get render position including wobble offset
 */
export function getAnimalRenderPosition(animal: AnimalEntity): {
  x: number;
  y: number;
  rotation: number;
} {
  const { position, rotation } = animal.transform;
  const { wobbleAngle, stackOffset } = animal.animal;

  // Calculate horizontal offset from wobble
  const wobbleOffset = Math.sin(wobbleAngle) * (animal.bounds?.height ?? 50) * 0.5;

  return {
    x: position.x + stackOffset + wobbleOffset,
    y: position.y,
    rotation: rotation + wobbleAngle,
  };
}

/**
 * Check if animal has a special ability available
 */
export function hasAbilityReady(animal: AnimalEntity): boolean {
  return animal.animal.abilityReady && animal.animal.abilityCooldown <= 0;
}

/**
 * Use animal's special ability
 */
export function useAbility(animal: AnimalEntity, cooldownMs: number): AnimalEntity {
  return {
    ...animal,
    animal: {
      ...animal.animal,
      abilityCooldown: cooldownMs,
    },
  };
}

/**
 * Update ability cooldown
 */
export function updateAbilityCooldown(animal: AnimalEntity, dt: number): AnimalEntity {
  if (animal.animal.abilityCooldown <= 0) return animal;

  return {
    ...animal,
    animal: {
      ...animal.animal,
      abilityCooldown: Math.max(0, animal.animal.abilityCooldown - dt),
    },
  };
}

/**
 * Get archetype for animal
 */
export function getAnimalSpawnTemplate(animal: AnimalEntity): AnimalSpawnTemplate | undefined {
  return ANIMAL_ARCHETYPES.get(animal.animal.animalType);
}

/**
 * Get variant for animal
 */
export function getAnimalVariant(animal: AnimalEntity): AnimalVariant | undefined {
  const archetype = ANIMAL_ARCHETYPES.get(animal.animal.animalType);
  return archetype?.variants.find((v) => v.id === animal.animal.variant);
}
