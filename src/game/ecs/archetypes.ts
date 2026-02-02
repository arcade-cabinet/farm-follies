/**
 * Farm Follies Animal Archetypes
 * Defines all barnyard animals and their special variants
 */

import type { AnimalArchetype, AnimalType, AbilityType } from './types';
import { FARM_COLORS } from '../config';

// Base animal definitions
export const ANIMAL_BASE_COLORS: Record<AnimalType, { primary: string; secondary: string; accent: string }> = {
  cow: {
    primary: FARM_COLORS.animals.cow.body,
    secondary: FARM_COLORS.animals.cow.spots,
    accent: FARM_COLORS.animals.cow.nose,
  },
  chicken: {
    primary: FARM_COLORS.animals.chicken.body,
    secondary: FARM_COLORS.animals.chicken.wing,
    accent: FARM_COLORS.animals.chicken.comb,
  },
  pig: {
    primary: FARM_COLORS.animals.pig.body,
    secondary: FARM_COLORS.animals.pig.snout,
    accent: FARM_COLORS.animals.pig.ear,
  },
  sheep: {
    primary: FARM_COLORS.animals.sheep.wool,
    secondary: FARM_COLORS.animals.sheep.face,
    accent: FARM_COLORS.animals.sheep.ear,
  },
  goat: {
    primary: FARM_COLORS.animals.goat.body,
    secondary: FARM_COLORS.animals.goat.beard,
    accent: FARM_COLORS.animals.goat.horns,
  },
  duck: {
    primary: FARM_COLORS.animals.duck.body,
    secondary: FARM_COLORS.animals.duck.beak,
    accent: FARM_COLORS.animals.duck.feet,
  },
  goose: {
    primary: FARM_COLORS.animals.goose.body,
    secondary: FARM_COLORS.animals.goose.beak,
    accent: FARM_COLORS.animals.goose.feet,
  },
  horse: {
    primary: FARM_COLORS.animals.horse.body,
    secondary: FARM_COLORS.animals.horse.mane,
    accent: FARM_COLORS.animals.horse.hooves,
  },
  rooster: {
    primary: FARM_COLORS.animals.rooster.body,
    secondary: FARM_COLORS.animals.rooster.tail,
    accent: FARM_COLORS.animals.rooster.comb,
  },
};

// Special variant definitions with unique abilities
export interface SpecialVariantDef {
  specialColor: string;
  specialName: string;
  ability: AbilityType;
  description: string;
  spawnWeight: number; // Relative chance to spawn as special
}

export const SPECIAL_VARIANTS: Record<AnimalType, SpecialVariantDef> = {
  cow: {
    specialColor: '#8B4513', // Brown
    specialName: 'Muddy Bessie',
    ability: 'poop_shot',
    description: 'Shoots fertilizer that grows bouncy bushes!',
    spawnWeight: 0.15,
  },
  chicken: {
    specialColor: '#FFD700', // Gold
    specialName: 'Golden Cluck',
    ability: 'egg_bomb',
    description: 'Lays explosive golden eggs!',
    spawnWeight: 0.12,
  },
  pig: {
    specialColor: '#FF69B4', // Hot Pink
    specialName: 'Mudslide',
    ability: 'mud_splash',
    description: 'Creates mud that slows falling animals!',
    spawnWeight: 0.15,
  },
  sheep: {
    specialColor: '#1C1C1C', // Black
    specialName: 'Shadow Wool',
    ability: 'wool_shield',
    description: 'Wraps stack in protective wool!',
    spawnWeight: 0.10,
  },
  goat: {
    specialColor: '#808080', // Gray
    specialName: 'Gruff',
    ability: 'bleat_stun',
    description: 'Bleats so loud it stuns nearby animals!',
    spawnWeight: 0.12,
  },
  duck: {
    specialColor: '#4169E1', // Royal Blue  
    specialName: 'Sir Quacksalot',
    ability: 'feather_float',
    description: 'Floats down super slowly on feathers!',
    spawnWeight: 0.18,
  },
  goose: {
    specialColor: '#FFD700', // Gold
    specialName: 'Mother Goose',
    ability: 'honey_trap',
    description: 'Creates a sticky golden landing zone!',
    spawnWeight: 0.08,
  },
  horse: {
    specialColor: '#D2B48C', // Tan
    specialName: 'Haymaker',
    ability: 'hay_storm',
    description: 'Summons floating hay platforms!',
    spawnWeight: 0.10,
  },
  rooster: {
    specialColor: '#F8F8FF', // Ghost White (Albino)
    specialName: 'Dawn Caller',
    ability: 'crow_call',
    description: 'Crows to attract animals to center!',
    spawnWeight: 0.12,
  },
};

/**
 * Create an animal archetype
 */
export function createAnimalArchetype(
  type: AnimalType,
  isSpecial: boolean = false
): AnimalArchetype {
  const baseColors = ANIMAL_BASE_COLORS[type];
  const specialDef = SPECIAL_VARIANTS[type];
  
  if (isSpecial) {
    return {
      type,
      variant: 'special',
      primaryColor: specialDef.specialColor,
      secondaryColor: baseColors.secondary,
      accentColor: baseColors.accent,
      specialAbility: specialDef.ability,
      specialColor: specialDef.specialColor,
      specialName: specialDef.specialName,
    };
  }
  
  return {
    type,
    variant: 'normal',
    primaryColor: baseColors.primary,
    secondaryColor: baseColors.secondary,
    accentColor: baseColors.accent,
  };
}

/**
 * Get a random animal type with weighted distribution
 */
export function getRandomAnimalType(level: number): AnimalType {
  const types: AnimalType[] = ['cow', 'chicken', 'pig', 'sheep', 'goat', 'duck', 'goose', 'horse', 'rooster'];
  
  // Base weights - some animals are more common
  const weights: Record<AnimalType, number> = {
    chicken: 0.18,
    duck: 0.16,
    pig: 0.14,
    sheep: 0.12,
    goat: 0.10,
    cow: 0.10,
    goose: 0.08,
    rooster: 0.07,
    horse: 0.05,
  };
  
  // Adjust weights based on level (rarer animals become more common)
  const levelBonus = Math.min(0.02, level * 0.002);
  
  const roll = Math.random();
  let cumulative = 0;
  
  for (const type of types) {
    let weight = weights[type];
    // Increase rare animal chances with level
    if (type === 'horse' || type === 'goose') {
      weight += levelBonus;
    }
    cumulative += weight;
    if (roll < cumulative) {
      return type;
    }
  }
  
  return 'chicken'; // Fallback
}

/**
 * Determine if an animal should be special variant
 */
export function shouldBeSpecialVariant(type: AnimalType, level: number): boolean {
  const specialDef = SPECIAL_VARIANTS[type];
  const baseChance = specialDef.spawnWeight;
  const levelBonus = Math.min(0.15, level * 0.01);
  
  return Math.random() < (baseChance + levelBonus);
}

/**
 * Get spawn weight for a specific animal type
 */
export function getAnimalSpawnWeight(type: AnimalType): number {
  const weights: Record<AnimalType, number> = {
    chicken: 0.20,
    duck: 0.18,
    pig: 0.15,
    sheep: 0.12,
    goat: 0.10,
    cow: 0.08,
    goose: 0.07,
    rooster: 0.06,
    horse: 0.04,
  };
  return weights[type] || 0.1;
}

/**
 * Get animal display name
 */
export function getAnimalDisplayName(archetype: AnimalArchetype): string {
  if (archetype.variant === 'special' && archetype.specialName) {
    return archetype.specialName;
  }
  
  const names: Record<AnimalType, string> = {
    cow: 'Cow',
    chicken: 'Chicken',
    pig: 'Pig',
    sheep: 'Sheep',
    goat: 'Goat',
    duck: 'Duck',
    goose: 'Goose',
    horse: 'Horse',
    rooster: 'Rooster',
  };
  
  return names[archetype.type];
}
