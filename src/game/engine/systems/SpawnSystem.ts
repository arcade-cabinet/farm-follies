/**
 * SpawnSystem - Animal and power-up spawning logic
 * Manages tornado-based spawning and spawn patterns
 */

import type { AnimalState, AnimalType, TornadoState, PowerUpState } from '../state/GameState';
import type { PowerUpType } from '../../config';
import { GAME_CONFIG } from '../../config';

// Spawn configuration
export interface SpawnConfig {
  baseInterval: number;           // Base time between spawns (ms)
  minInterval: number;            // Minimum spawn interval
  intervalDecreasePerLevel: number;
  
  // Animal type weights by level
  animalWeights: Map<AnimalType, number>;
  specialVariantChance: number;
  
  // Power-up settings
  powerUpChance: number;
  powerUpMinInterval: number;
  
  // Difficulty scaling
  maxSimultaneousAnimals: number;
  simultaneousIncreasePerLevel: number;
}

export const DEFAULT_SPAWN_CONFIG: SpawnConfig = {
  baseInterval: 2000,
  minInterval: 500,
  intervalDecreasePerLevel: 150,
  
  animalWeights: new Map([
    ['chicken', 1.0],
    ['duck', 0.9],
    ['pig', 0.7],
    ['sheep', 0.6],
    ['goat', 0.5],
    ['cow', 0.4],
    ['goose', 0.3],
    ['horse', 0.2],
    ['rooster', 0.15],
  ]),
  
  specialVariantChance: 0.15,
  powerUpChance: 0.1,
  powerUpMinInterval: 5000,
  maxSimultaneousAnimals: 3,
  simultaneousIncreasePerLevel: 0.5,
};

// Animal archetype definitions
export interface AnimalSpawnTemplate {
  type: AnimalType;
  baseWeight: number;
  fallSpeed: number;
  width: number;
  height: number;
  pointValue: number;
  stackWeight: number; // Affects wobble
  variants: AnimalVariant[];
}

export interface AnimalVariant {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  colorOverride?: Record<string, string>;
  specialAbility?: SpecialAbility;
  pointMultiplier: number;
}

export interface SpecialAbility {
  type: string;
  description: string;
  cooldown: number;
  params: Record<string, unknown>;
}

// Define all animal archetypes
export const ANIMAL_ARCHETYPES: Map<AnimalType, AnimalSpawnTemplate> = new Map([
  ['chicken', {
    type: 'chicken',
    baseWeight: 1.0,
    fallSpeed: 3,
    width: 50,
    height: 45,
    pointValue: 10,
    stackWeight: 0.5,
    variants: [
      { id: 'white', name: 'White Chicken', rarity: 'common', pointMultiplier: 1 },
      { id: 'brown', name: 'Brown Chicken', rarity: 'common', pointMultiplier: 1 },
      { 
        id: 'golden', 
        name: 'Golden Chicken', 
        rarity: 'rare',
        colorOverride: { body: '#FFD700', wing: '#FFC107' },
        specialAbility: {
          type: 'egg_bomb',
          description: 'Explosive golden egg clears nearby falling animals',
          cooldown: 10000,
          params: { blastRadius: 120, bonusPointsPerAnimal: 50 },
        },
        pointMultiplier: 2,
      },
    ],
  }],
  
  ['duck', {
    type: 'duck',
    baseWeight: 0.9,
    fallSpeed: 3.5,
    width: 55,
    height: 50,
    pointValue: 15,
    stackWeight: 0.6,
    variants: [
      { id: 'mallard', name: 'Mallard Duck', rarity: 'common', pointMultiplier: 1 },
      { id: 'white', name: 'White Duck', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'rubber',
        name: 'Rubber Duck',
        rarity: 'uncommon',
        colorOverride: { body: '#FFE135', beak: '#FF6B35' },
        specialAbility: {
          type: 'feather_float',
          description: 'Floats down slowly with feathers',
          cooldown: 0,
          params: { fallSpeedMultiplier: 0.3 },
        },
        pointMultiplier: 1.5,
      },
      {
        id: 'fire',
        name: 'Fire Duck',
        rarity: 'legendary',
        colorOverride: { body: '#FF5722', beak: '#FF9800', glow: '#FFEB3B' },
        specialAbility: {
          type: 'feather_float',
          description: 'Floats down dramatically slowly',
          cooldown: 0,
          params: { fallSpeedMultiplier: 0.3 },
        },
        pointMultiplier: 3,
      },
    ],
  }],
  
  ['pig', {
    type: 'pig',
    baseWeight: 0.7,
    fallSpeed: 4,
    width: 65,
    height: 55,
    pointValue: 20,
    stackWeight: 1.5,
    variants: [
      { id: 'pink', name: 'Pink Pig', rarity: 'common', pointMultiplier: 1 },
      { id: 'spotted', name: 'Spotted Pig', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'mud',
        name: 'Mud Pig',
        rarity: 'uncommon',
        colorOverride: { body: '#8B4513', snout: '#A0522D' },
        specialAbility: {
          type: 'mud_splash',
          description: 'Creates slippery zone on landing',
          cooldown: 8000,
          params: { slipDuration: 3000 },
        },
        pointMultiplier: 1.5,
      },
    ],
  }],
  
  ['cow', {
    type: 'cow',
    baseWeight: 0.4,
    fallSpeed: 4.5,
    width: 80,
    height: 70,
    pointValue: 35,
    stackWeight: 2.0,
    variants: [
      { id: 'holstein', name: 'Holstein Cow', rarity: 'common', pointMultiplier: 1 },
      { id: 'jersey', name: 'Jersey Cow', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'brown',
        name: 'Brown Cow',
        rarity: 'rare',
        colorOverride: { body: '#8B4513', spots: '#654321' },
        specialAbility: {
          type: 'poop_shot',
          description: 'Shoots poop that grows bushes',
          cooldown: 12000,
          params: { bushGrowTime: 2000, direction: 'random' },
        },
        pointMultiplier: 2,
      },
      {
        id: 'purple',
        name: 'Purple Cow',
        rarity: 'legendary',
        colorOverride: { body: '#9C27B0', spots: '#7B1FA2' },
        specialAbility: {
          type: 'poop_shot',
          description: 'Legendary poop barrage that grows bushes',
          cooldown: 8000,
          params: { bushGrowTime: 2000, direction: 'random' },
        },
        pointMultiplier: 3,
      },
    ],
  }],
  
  ['sheep', {
    type: 'sheep',
    baseWeight: 0.6,
    fallSpeed: 3,
    width: 60,
    height: 55,
    pointValue: 25,
    stackWeight: 1.2,
    variants: [
      { id: 'white', name: 'White Sheep', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'black',
        name: 'Black Sheep',
        rarity: 'uncommon',
        colorOverride: { wool: '#2C2C2C', face: '#1A1A1A' },
        specialAbility: {
          type: 'wool_shield',
          description: 'Temporary stack invincibility, no toppling',
          cooldown: 15000,
          params: {},
        },
        pointMultiplier: 1.5,
      },
      {
        id: 'rainbow',
        name: 'Rainbow Sheep',
        rarity: 'legendary',
        specialAbility: {
          type: 'wool_shield',
          description: 'Legendary invincibility shield',
          cooldown: 15000,
          params: {},
        },
        pointMultiplier: 2.5,
      },
    ],
  }],
  
  ['goat', {
    type: 'goat',
    baseWeight: 0.5,
    fallSpeed: 3.8,
    width: 60,
    height: 60,
    pointValue: 30,
    stackWeight: 1.0,
    variants: [
      { id: 'white', name: 'White Goat', rarity: 'common', pointMultiplier: 1 },
      { id: 'brown', name: 'Brown Goat', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'mountain',
        name: 'Mountain Goat',
        rarity: 'rare',
        colorOverride: { body: '#E0E0E0', horns: '#8D6E63' },
        specialAbility: {
          type: 'bleat_stun',
          description: 'Stun wave freezes nearby falling animals',
          cooldown: 10000,
          params: { stunRadius: 180 },
        },
        pointMultiplier: 2,
      },
    ],
  }],
  
  ['horse', {
    type: 'horse',
    baseWeight: 0.2,
    fallSpeed: 5,
    width: 85,
    height: 80,
    pointValue: 50,
    stackWeight: 2.2,
    variants: [
      { id: 'brown', name: 'Brown Horse', rarity: 'uncommon', pointMultiplier: 1 },
      { id: 'black', name: 'Black Horse', rarity: 'uncommon', pointMultiplier: 1 },
      {
        id: 'golden',
        name: 'Golden Palomino',
        rarity: 'rare',
        colorOverride: { body: '#DAA520', mane: '#FFD700' },
        specialAbility: {
          type: 'hay_storm',
          description: 'Spawns floating hay platforms that bounce animals',
          cooldown: 15000,
          params: { platformCount: 3, bounceForce: 10 },
        },
        pointMultiplier: 2,
      },
    ],
  }],
  
  ['goose', {
    type: 'goose',
    baseWeight: 0.3,
    fallSpeed: 3.2,
    width: 60,
    height: 55,
    pointValue: 30,
    stackWeight: 0.8,
    variants: [
      { id: 'white', name: 'White Goose', rarity: 'common', pointMultiplier: 1 },
      { id: 'grey', name: 'Grey Goose', rarity: 'common', pointMultiplier: 1 },
      {
        id: 'golden',
        name: 'Golden Goose',
        rarity: 'rare',
        colorOverride: { body: '#FFD700', beak: '#FF8C00' },
        specialAbility: {
          type: 'honey_trap',
          description: 'Sticky landing zone: centers catches, reduces wobble',
          cooldown: 12000,
          params: { catchCenteringFactor: 0.7, wobbleReduction: 0.5, maxCatches: 3 },
        },
        pointMultiplier: 2,
      },
    ],
  }],

  ['rooster', {
    type: 'rooster',
    baseWeight: 0.15,
    fallSpeed: 3.8,
    width: 55,
    height: 60,
    pointValue: 35,
    stackWeight: 0.7,
    variants: [
      { id: 'red', name: 'Red Rooster', rarity: 'uncommon', pointMultiplier: 1 },
      {
        id: 'albino',
        name: 'Albino Rooster',
        rarity: 'rare',
        colorOverride: { body: '#FFFFFF', comb: '#FF0000', tail: '#E0E0E0' },
        specialAbility: {
          type: 'crow_call',
          description: 'Magnetic pull drifts falling animals toward farmer',
          cooldown: 12000,
          params: { pullStrength: 0.004 },
        },
        pointMultiplier: 2,
      },
    ],
  }],
]);

// Spawn state
export interface SpawnState {
  lastSpawnTime: number;
  lastPowerUpTime: number;
  currentInterval: number;
  spawnQueue: SpawnQueueItem[];
  activeAnimalCount: number;
}

export interface SpawnQueueItem {
  type: AnimalType;
  variant: string;
  delay: number;
  x?: number;
}

/**
 * Create initial spawn state
 */
export function createSpawnState(): SpawnState {
  return {
    lastSpawnTime: 0,
    lastPowerUpTime: 0,
    currentInterval: DEFAULT_SPAWN_CONFIG.baseInterval,
    spawnQueue: [],
    activeAnimalCount: 0,
  };
}

/**
 * Calculate spawn interval for current level
 */
export function calculateSpawnInterval(level: number, config: SpawnConfig = DEFAULT_SPAWN_CONFIG): number {
  const interval = config.baseInterval - (level - 1) * config.intervalDecreasePerLevel;
  return Math.max(config.minInterval, interval);
}

/**
 * Select a random animal type based on weights and level
 */
export function selectAnimalType(
  level: number,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): AnimalType {
  // Adjust weights based on level (heavier animals more common at higher levels)
  const adjustedWeights: [AnimalType, number][] = [];
  let totalWeight = 0;
  
  config.animalWeights.forEach((baseWeight, type) => {
    const archetype = ANIMAL_ARCHETYPES.get(type);
    if (!archetype) return;
    
    // Increase weight of heavier animals at higher levels
    const levelBonus = level > 3 ? (archetype.stackWeight - 1) * (level - 3) * 0.1 : 0;
    const adjustedWeight = baseWeight + levelBonus;
    
    adjustedWeights.push([type, adjustedWeight]);
    totalWeight += adjustedWeight;
  });
  
  // Random selection
  let random = Math.random() * totalWeight;
  for (const [type, weight] of adjustedWeights) {
    random -= weight;
    if (random <= 0) return type;
  }
  
  return 'chicken'; // Fallback
}

/**
 * Select a variant for an animal type
 */
export function selectVariant(
  type: AnimalType,
  level: number,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): AnimalVariant {
  const archetype = ANIMAL_ARCHETYPES.get(type);
  if (!archetype || archetype.variants.length === 0) {
    return { id: 'default', name: type, rarity: 'common', pointMultiplier: 1 };
  }
  
  // Check for special variant
  const specialChance = config.specialVariantChance + level * 0.01;
  
  if (Math.random() < specialChance) {
    // Filter to non-common variants
    const specialVariants = archetype.variants.filter(v => v.rarity !== 'common');
    if (specialVariants.length > 0) {
      // Weight by rarity
      const rarityWeights: Record<string, number> = {
        uncommon: 0.6,
        rare: 0.3,
        legendary: 0.1,
      };
      
      let totalWeight = 0;
      specialVariants.forEach(v => totalWeight += rarityWeights[v.rarity] || 0.1);
      
      let random = Math.random() * totalWeight;
      for (const variant of specialVariants) {
        random -= rarityWeights[variant.rarity] || 0.1;
        if (random <= 0) return variant;
      }
    }
  }
  
  // Return common variant
  const commonVariants = archetype.variants.filter(v => v.rarity === 'common');
  if (commonVariants.length > 0) {
    return commonVariants[Math.floor(Math.random() * commonVariants.length)];
  }
  
  return archetype.variants[0];
}

/**
 * Generate unique animal ID
 */
let animalIdCounter = 0;
export function generateAnimalId(type: AnimalType): string {
  return `${type}_${Date.now()}_${++animalIdCounter}`;
}

/**
 * Create a new animal state from archetype and variant
 */
export function createAnimalState(
  type: AnimalType,
  variant: AnimalVariant,
  spawnX: number,
  spawnY: number
): AnimalState {
  const archetype = ANIMAL_ARCHETYPES.get(type)!;
  
  return {
    id: generateAnimalId(type),
    type,
    variant: variant.id,
    x: spawnX - archetype.width / 2,
    y: spawnY,
    width: archetype.width,
    height: archetype.height,
    velocityX: (Math.random() - 0.5) * 2, // Slight horizontal drift
    velocityY: archetype.fallSpeed,
    rotation: 0,
    scale: 1,
    active: true,
    isCaught: false,
    stackIndex: -1,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmplitude: 0.1,
    specialAbilityReady: !!variant.specialAbility,
    specialAbilityCooldown: 0,
  };
}

/**
 * Determine if it's time to spawn
 */
export function shouldSpawn(
  state: SpawnState,
  currentTime: number,
  level: number,
  activeAnimalCount: number,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): boolean {
  const interval = calculateSpawnInterval(level, config);
  const timeSinceLastSpawn = currentTime - state.lastSpawnTime;
  
  // Check max simultaneous animals
  const maxAnimals = Math.floor(
    config.maxSimultaneousAnimals + level * config.simultaneousIncreasePerLevel
  );
  
  if (activeAnimalCount >= maxAnimals) return false;
  
  return timeSinceLastSpawn >= interval;
}

/**
 * Determine if it's time to spawn a power-up
 */
export function shouldSpawnPowerUp(
  state: SpawnState,
  currentTime: number,
  config: SpawnConfig = DEFAULT_SPAWN_CONFIG
): boolean {
  const timeSinceLastPowerUp = currentTime - state.lastPowerUpTime;
  
  if (timeSinceLastPowerUp < config.powerUpMinInterval) return false;
  
  return Math.random() < config.powerUpChance;
}

/**
 * Select a power-up type to spawn
 */
export function selectPowerUpType(): PowerUpType {
  const powerUpConfig = GAME_CONFIG.powerUps;
  const types = Object.keys(powerUpConfig) as PowerUpType[];
  
  let totalWeight = 0;
  const weights: [PowerUpType, number][] = [];
  
  for (const type of types) {
    const config = powerUpConfig[type];
    if (config && 'spawnWeight' in config) {
      weights.push([type, config.spawnWeight as number]);
      totalWeight += config.spawnWeight as number;
    }
  }
  
  let random = Math.random() * totalWeight;
  for (const [type, weight] of weights) {
    random -= weight;
    if (random <= 0) return type;
  }
  
  return 'hay_bale';
}

/**
 * Create a power-up state
 */
let powerUpIdCounter = 0;
export function createPowerUpState(
  type: PowerUpType,
  x: number,
  y: number
): PowerUpState {
  return {
    id: `powerup_${Date.now()}_${++powerUpIdCounter}`,
    type,
    x,
    y,
    width: 40,
    height: 40,
    velocityX: 0,
    velocityY: 2,
    rotation: 0,
    scale: 1,
    active: true,
    collected: false,
  };
}

/**
 * Get spawn position from tornado
 */
export function getSpawnPositionFromTornado(
  tornado: TornadoState,
  variation: number = 40
): { x: number; y: number } {
  return {
    x: tornado.x + (Math.random() - 0.5) * variation,
    y: tornado.y + tornado.height,
  };
}

/**
 * Update spawn state after spawning
 */
export function updateSpawnState(
  state: SpawnState,
  currentTime: number,
  spawnedAnimal: boolean,
  spawnedPowerUp: boolean
): SpawnState {
  return {
    ...state,
    lastSpawnTime: spawnedAnimal ? currentTime : state.lastSpawnTime,
    lastPowerUpTime: spawnedPowerUp ? currentTime : state.lastPowerUpTime,
  };
}
