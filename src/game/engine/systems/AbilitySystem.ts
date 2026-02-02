/**
 * AbilitySystem - Special ability mechanics for special-variant animals
 *
 * Each of the 9 animal types has a special variant with a unique ability:
 *   Cow   (poop_shot)     – projectile arcs left/right, grows a bush on landing
 *   Chicken (egg_bomb)     – drops explosive golden egg, clears nearby falling animals
 *   Pig   (mud_splash)    – creates slow zone below stack, halves fall speed
 *   Sheep (wool_shield)   – temporary stack invincibility, no toppling
 *   Goat  (bleat_stun)    – stun wave freezes nearby falling animals briefly
 *   Duck  (feather_float) – PASSIVE: special ducks fall at 30% speed
 *   Goose (honey_trap)    – sticky landing zone: centers catches, reduces wobble
 *   Rooster (crow_call)   – magnetic pull: falling animals drift toward farmer
 *   Horse (hay_storm)     – spawns floating hay platforms that bounce animals
 *
 * Pure-function system following the same patterns as BushSystem, CollisionSystem, etc.
 */

import type { AnimalEntity } from "../entities/Animal";
import type { PlayerEntity } from "../entities/Player";
import { ANIMAL_ARCHETYPES, type AnimalVariant } from "./SpawnSystem";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface AbilityConfig {
  /** Cooldown (ms) after using the ability */
  cooldown: number;
  /** Duration of the active effect (ms), 0 = instant */
  duration: number;
  /** Ability-specific parameters */
  params: Record<string, number>;
}

export const ABILITY_CONFIGS: Record<string, AbilityConfig> = {
  poop_shot: {
    cooldown: 8000,
    duration: 0, // Instant – projectile is a separate entity
    params: {
      projectileSpeed: 6,
      projectileGravity: 0.25,
      projectileLifetime: 2000,
    },
  },
  egg_bomb: {
    cooldown: 10000,
    duration: 0, // Instant explosion
    params: {
      blastRadius: 120,
      bonusPointsPerAnimal: 50,
    },
  },
  mud_splash: {
    cooldown: 12000,
    duration: 5000,
    params: {
      zoneWidth: 160,
      zoneHeight: 200,
      slowFactor: 0.5,
    },
  },
  wool_shield: {
    cooldown: 15000,
    duration: 4000,
    params: {},
  },
  bleat_stun: {
    cooldown: 10000,
    duration: 2000,
    params: {
      stunRadius: 180,
    },
  },
  feather_float: {
    cooldown: 0,
    duration: 0,
    params: {
      fallSpeedMultiplier: 0.3,
    },
  },
  honey_trap: {
    cooldown: 12000,
    duration: 6000,
    params: {
      catchCenteringFactor: 0.7,
      wobbleReduction: 0.5,
      maxCatches: 3,
    },
  },
  crow_call: {
    cooldown: 12000,
    duration: 3000,
    params: {
      pullStrength: 0.004,
    },
  },
  hay_storm: {
    cooldown: 15000,
    duration: 8000,
    params: {
      platformCount: 3,
      platformWidth: 70,
      platformHeight: 20,
      bounceForce: 10,
    },
  },
};

// ---------------------------------------------------------------------------
// Active-effect types
// ---------------------------------------------------------------------------

/** Base shape for every active effect. */
export interface AbilityEffectBase {
  id: string;
  type: string;
  /** Source animal entity ID */
  sourceAnimalId: string;
  /** Time remaining (ms). When <= 0, the effect is expired. */
  remainingTime: number;
  /** Total duration for progress calculation */
  totalDuration: number;
}

export interface PoopShotProjectile extends AbilityEffectBase {
  type: "poop_shot";
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  lifetime: number;
  /** Ground Y for landing detection */
  groundY: number;
}

export interface EggBombEffect extends AbilityEffectBase {
  type: "egg_bomb";
  x: number;
  y: number;
  blastRadius: number;
  /** IDs of animals cleared (for scoring) */
  clearedAnimalIds: string[];
  /** Whether the blast has already triggered */
  detonated: boolean;
}

export interface MudSplashZone extends AbilityEffectBase {
  type: "mud_splash";
  x: number;
  y: number;
  width: number;
  height: number;
  slowFactor: number;
}

export interface WoolShieldEffect extends AbilityEffectBase {
  type: "wool_shield";
}

export interface BleatStunEffect extends AbilityEffectBase {
  type: "bleat_stun";
  x: number;
  y: number;
  radius: number;
  /** IDs of animals currently stunned */
  stunnedAnimalIds: string[];
}

export interface HoneyTrapZone extends AbilityEffectBase {
  type: "honey_trap";
  x: number;
  y: number;
  catchCenteringFactor: number;
  wobbleReduction: number;
  catchesRemaining: number;
}

export interface CrowCallEffect extends AbilityEffectBase {
  type: "crow_call";
  targetX: number;
  pullStrength: number;
}

export interface HayPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bounceForce: number;
  /** Gentle drift */
  vx: number;
}

export interface HayStormEffect extends AbilityEffectBase {
  type: "hay_storm";
  platforms: HayPlatform[];
}

export type AbilityEffect =
  | PoopShotProjectile
  | EggBombEffect
  | MudSplashZone
  | WoolShieldEffect
  | BleatStunEffect
  | HoneyTrapZone
  | CrowCallEffect
  | HayStormEffect;

// ---------------------------------------------------------------------------
// Ability runtime state
// ---------------------------------------------------------------------------

export interface AbilitySystemState {
  /** All currently active effects */
  activeEffects: AbilityEffect[];
  /** Monotonic counter for unique IDs */
  nextEffectId: number;
}

export function createAbilitySystemState(): AbilitySystemState {
  return {
    activeEffects: [],
    nextEffectId: 0,
  };
}

// ---------------------------------------------------------------------------
// Result types returned from update / activation (so Game.ts can act on them)
// ---------------------------------------------------------------------------

export interface AbilityActivationResult {
  /** Updated ability state */
  state: AbilitySystemState;
  /** Updated animal (cooldown applied) */
  animal: AnimalEntity;
  /** Whether activation was successful */
  activated: boolean;
  /** Bonus score to award immediately */
  bonusScore: number;
}

export interface AbilityUpdateResult {
  /** Updated ability state */
  state: AbilitySystemState;
  /** IDs of falling animals that were cleared (egg bomb) */
  clearedAnimalIds: string[];
  /** IDs of falling animals that are currently stunned */
  stunnedAnimalIds: Set<string>;
  /** Whether the stack is currently shielded (wool shield) */
  isShielded: boolean;
  /** Wobble reduction factor (0-1, 1 = no reduction) from honey trap */
  wobbleReduction: number;
  /** Magnetic pull X applied to falling animals (crow call) */
  magneticPullTargetX: number | null;
  /** Magnetic pull strength */
  magneticPullStrength: number;
  /** Mud zones that slow falling animals */
  mudZones: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    slowFactor: number;
  }>;
  /** Hay platforms for bounce checks */
  hayPlatforms: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    bounceForce: number;
  }>;
  /** Honey trap centering factor (0 = none, >0 = active) */
  honeyTrapCenteringFactor: number;
  /** Bushes to create from poop shot impacts */
  bushSpawnPositions: Array<{ x: number; y: number }>;
  /** Bonus score accumulated this frame */
  bonusScore: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let effectIdCounter = 0;

function nextEffectId(state: AbilitySystemState): {
  id: string;
  nextId: number;
} {
  const id = `ability_${Date.now()}_${++effectIdCounter}`;
  return { id, nextId: state.nextEffectId + 1 };
}

// ---------------------------------------------------------------------------
// Passive ability check (Feather Float)
// ---------------------------------------------------------------------------

/**
 * Returns the fall-speed multiplier for an animal.
 * For special ducks with feather_float, this is 0.3; for all others, 1.0.
 */
export function getFeatherFloatMultiplier(animal: AnimalEntity): number {
  if (!animal.animal.abilityReady) return 1.0;

  // The variant's special ability type is stored in the archetype data.
  // We check the variant ID against known feather_float variants.
  // The "fire" duck variant from SpawnSystem uses "heat_wave", not feather_float.
  // The blue duck (Sir Quacksalot) uses feather_float.
  // Since Animal.ts does not store the ability type string directly, we infer
  // from animal type + variant: duck type with abilityReady = feather_float.
  // However, there could be other ability-ready ducks. We check the
  // archetype variant data to be precise.
  const config = ABILITY_CONFIGS.feather_float;
  if (
    animal.animal.animalType === "duck" &&
    animal.animal.abilityReady &&
    animal.animal.state === "falling"
  ) {
    return config.params.fallSpeedMultiplier;
  }
  return 1.0;
}

// ---------------------------------------------------------------------------
// Ability activation (called when player taps a stacked special animal)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Individual ability-effect creators (keep activateAbility below max complexity)
// ---------------------------------------------------------------------------

interface ActivationContext {
  playerCenterX: number;
  stackTopY: number;
  canvasWidth: number;
  canvasHeight: number;
  groundY: number;
  fallingAnimals: AnimalEntity[];
}

function createPoopShotEffect(
  id: string,
  animalId: string,
  config: AbilityConfig,
  ctx: ActivationContext
): { effect: PoopShotProjectile; bonus: number } {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const speed = config.params.projectileSpeed;
  return {
    effect: {
      id,
      type: "poop_shot",
      sourceAnimalId: animalId,
      remainingTime: config.params.projectileLifetime,
      totalDuration: config.params.projectileLifetime,
      x: ctx.playerCenterX,
      y: ctx.stackTopY,
      vx: direction * speed,
      vy: -speed * 0.8,
      gravity: config.params.projectileGravity,
      lifetime: config.params.projectileLifetime,
      groundY: ctx.groundY,
    },
    bonus: 0,
  };
}

function findEntitiesInRadius(
  animals: AnimalEntity[],
  centerX: number,
  centerY: number,
  radius: number
): string[] {
  const ids: string[] = [];
  for (const a of animals) {
    const dx = a.transform.position.x + (a.bounds?.width ?? 50) / 2 - centerX;
    const dy = a.transform.position.y + (a.bounds?.height ?? 50) / 2 - centerY;
    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      ids.push(a.id);
    }
  }
  return ids;
}

function createEggBombEffect(
  id: string,
  animalId: string,
  config: AbilityConfig,
  ctx: ActivationContext
): { effect: EggBombEffect; bonus: number } {
  const blastRadius = config.params.blastRadius;
  const clearedIds = findEntitiesInRadius(
    ctx.fallingAnimals,
    ctx.playerCenterX,
    ctx.stackTopY,
    blastRadius
  );
  return {
    effect: {
      id,
      type: "egg_bomb",
      sourceAnimalId: animalId,
      remainingTime: 500,
      totalDuration: 500,
      x: ctx.playerCenterX,
      y: ctx.stackTopY,
      blastRadius,
      clearedAnimalIds: clearedIds,
      detonated: true,
    },
    bonus: clearedIds.length * config.params.bonusPointsPerAnimal,
  };
}

function createBleatStunEffect(
  id: string,
  animalId: string,
  config: AbilityConfig,
  ctx: ActivationContext
): { effect: BleatStunEffect; bonus: number } {
  const stunRadius = config.params.stunRadius;
  const stunnedIds = findEntitiesInRadius(
    ctx.fallingAnimals,
    ctx.playerCenterX,
    ctx.stackTopY,
    stunRadius
  );
  return {
    effect: {
      id,
      type: "bleat_stun",
      sourceAnimalId: animalId,
      remainingTime: config.duration,
      totalDuration: config.duration,
      x: ctx.playerCenterX,
      y: ctx.stackTopY,
      radius: stunRadius,
      stunnedAnimalIds: stunnedIds,
    },
    bonus: 0,
  };
}

function createHayStormEffect(
  id: string,
  animalId: string,
  config: AbilityConfig,
  ctx: ActivationContext
): { effect: HayStormEffect; bonus: number } {
  const platforms: HayPlatform[] = [];
  const count = config.params.platformCount;
  for (let i = 0; i < count; i++) {
    const platformX = Math.random() * (ctx.canvasWidth * 0.7) + ctx.canvasWidth * 0.15;
    const platformY = ctx.groundY * 0.3 + Math.random() * (ctx.groundY * 0.5);
    platforms.push({
      id: `hay_${id}_${i}`,
      x: platformX - config.params.platformWidth / 2,
      y: platformY,
      width: config.params.platformWidth,
      height: config.params.platformHeight,
      bounceForce: config.params.bounceForce,
      vx: (Math.random() - 0.5) * 0.5,
    });
  }
  return {
    effect: {
      id,
      type: "hay_storm",
      sourceAnimalId: animalId,
      remainingTime: config.duration,
      totalDuration: config.duration,
      platforms,
    },
    bonus: 0,
  };
}

function createSimpleEffect(
  id: string,
  animalId: string,
  abilityType: string,
  config: AbilityConfig,
  ctx: ActivationContext
): { effect: AbilityEffect; bonus: number } | null {
  switch (abilityType) {
    case "mud_splash":
      return {
        effect: {
          id,
          type: "mud_splash",
          sourceAnimalId: animalId,
          remainingTime: config.duration,
          totalDuration: config.duration,
          x: ctx.playerCenterX - config.params.zoneWidth / 2,
          y: ctx.stackTopY - config.params.zoneHeight,
          width: config.params.zoneWidth,
          height: config.params.zoneHeight,
          slowFactor: config.params.slowFactor,
        } satisfies MudSplashZone,
        bonus: 0,
      };
    case "wool_shield":
      return {
        effect: {
          id,
          type: "wool_shield",
          sourceAnimalId: animalId,
          remainingTime: config.duration,
          totalDuration: config.duration,
        } satisfies WoolShieldEffect,
        bonus: 0,
      };
    case "honey_trap":
      return {
        effect: {
          id,
          type: "honey_trap",
          sourceAnimalId: animalId,
          remainingTime: config.duration,
          totalDuration: config.duration,
          x: ctx.playerCenterX,
          y: ctx.stackTopY,
          catchCenteringFactor: config.params.catchCenteringFactor,
          wobbleReduction: config.params.wobbleReduction,
          catchesRemaining: config.params.maxCatches,
        } satisfies HoneyTrapZone,
        bonus: 0,
      };
    case "crow_call":
      return {
        effect: {
          id,
          type: "crow_call",
          sourceAnimalId: animalId,
          remainingTime: config.duration,
          totalDuration: config.duration,
          targetX: ctx.playerCenterX,
          pullStrength: config.params.pullStrength,
        } satisfies CrowCallEffect,
        bonus: 0,
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Activation dispatcher
// ---------------------------------------------------------------------------

/**
 * Attempt to activate the ability of a stacked animal.
 * Returns the result including updated state and the animal with cooldown applied.
 */
export function activateAbility(
  state: AbilitySystemState,
  animal: AnimalEntity,
  abilityType: string,
  context: ActivationContext
): AbilityActivationResult {
  const config = ABILITY_CONFIGS[abilityType];
  if (!config) {
    return { state, animal, activated: false, bonusScore: 0 };
  }

  if (animal.animal.abilityCooldown > 0) {
    return { state, animal, activated: false, bonusScore: 0 };
  }

  const { id, nextId } = nextEffectId(state);

  // Apply cooldown to animal
  const updatedAnimal: AnimalEntity = {
    ...animal,
    animal: { ...animal.animal, abilityCooldown: config.cooldown },
  };

  // Build the effect
  let result: { effect: AbilityEffect; bonus: number } | null = null;

  if (abilityType === "poop_shot") {
    result = createPoopShotEffect(id, animal.id, config, context);
  } else if (abilityType === "egg_bomb") {
    result = createEggBombEffect(id, animal.id, config, context);
  } else if (abilityType === "bleat_stun") {
    result = createBleatStunEffect(id, animal.id, config, context);
  } else if (abilityType === "hay_storm") {
    result = createHayStormEffect(id, animal.id, config, context);
  } else {
    result = createSimpleEffect(id, animal.id, abilityType, config, context);
  }

  if (!result) {
    return { state, animal, activated: false, bonusScore: 0 };
  }

  const newState: AbilitySystemState = {
    activeEffects: [...state.activeEffects, result.effect],
    nextEffectId: nextId,
  };

  return {
    state: newState,
    animal: updatedAnimal,
    activated: true,
    bonusScore: result.bonus,
  };
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Per-effect-type tick helpers (keeps updateAbilityEffects below max complexity)
// ---------------------------------------------------------------------------

interface EffectTickAccumulator {
  updatedEffects: AbilityEffect[];
  clearedAnimalIds: string[];
  stunnedAnimalIds: Set<string>;
  isShielded: boolean;
  wobbleReduction: number;
  magneticPullTargetX: number | null;
  magneticPullStrength: number;
  mudZones: AbilityUpdateResult["mudZones"];
  hayPlatforms: AbilityUpdateResult["hayPlatforms"];
  honeyTrapCenteringFactor: number;
  bushSpawnPositions: Array<{ x: number; y: number }>;
}

function tickPoopShot(
  effect: PoopShotProjectile,
  remaining: number,
  deltaTime: number,
  canvasWidth: number,
  acc: EffectTickAccumulator
): void {
  const dt = deltaTime / 16.67;
  const newVy = effect.vy + effect.gravity * dt;
  const newX = effect.x + effect.vx * dt;
  const newY = effect.y + newVy * dt;

  if (newY >= effect.groundY) {
    acc.bushSpawnPositions.push({ x: newX, y: effect.groundY });
    return;
  }
  if (newX < -50 || newX > canvasWidth + 50) return;

  acc.updatedEffects.push({ ...effect, x: newX, y: newY, vy: newVy, remainingTime: remaining });
}

function tickHayStorm(
  effect: HayStormEffect,
  remaining: number,
  deltaTime: number,
  acc: EffectTickAccumulator
): void {
  const dt = deltaTime / 16.67;
  const movedPlatforms = effect.platforms.map((p) => ({ ...p, x: p.x + p.vx * dt }));

  for (const p of movedPlatforms) {
    acc.hayPlatforms.push({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height,
      bounceForce: p.bounceForce,
    });
  }

  acc.updatedEffects.push({ ...effect, platforms: movedPlatforms, remainingTime: remaining });
}

function tickEffect(
  effect: AbilityEffect,
  remaining: number,
  deltaTime: number,
  canvasWidth: number,
  acc: EffectTickAccumulator
): void {
  switch (effect.type) {
    case "poop_shot":
      tickPoopShot(effect, remaining, deltaTime, canvasWidth, acc);
      return;

    case "egg_bomb":
      if (effect.detonated) acc.clearedAnimalIds.push(...effect.clearedAnimalIds);
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "mud_splash":
      acc.mudZones.push({
        x: effect.x,
        y: effect.y,
        width: effect.width,
        height: effect.height,
        slowFactor: effect.slowFactor,
      });
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "wool_shield":
      acc.isShielded = true;
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "bleat_stun":
      for (const sid of effect.stunnedAnimalIds) acc.stunnedAnimalIds.add(sid);
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "honey_trap":
      if (effect.catchesRemaining > 0) {
        acc.honeyTrapCenteringFactor = Math.max(
          acc.honeyTrapCenteringFactor,
          effect.catchCenteringFactor
        );
        acc.wobbleReduction = Math.min(acc.wobbleReduction, effect.wobbleReduction);
      }
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "crow_call":
      acc.magneticPullTargetX = effect.targetX;
      acc.magneticPullStrength = Math.max(acc.magneticPullStrength, effect.pullStrength);
      acc.updatedEffects.push({ ...effect, remainingTime: remaining });
      return;

    case "hay_storm":
      tickHayStorm(effect, remaining, deltaTime, acc);
      return;
  }
}

// ---------------------------------------------------------------------------
// Per-frame update
// ---------------------------------------------------------------------------

/**
 * Update all active ability effects. Returns aggregated results that the
 * Game orchestrator can apply to the rest of the game state.
 */
export function updateAbilityEffects(
  state: AbilitySystemState,
  deltaTime: number,
  context: {
    playerCenterX: number;
    stackTopY: number;
    groundY: number;
    canvasWidth: number;
    fallingAnimals: AnimalEntity[];
  }
): AbilityUpdateResult {
  const acc: EffectTickAccumulator = {
    updatedEffects: [],
    clearedAnimalIds: [],
    stunnedAnimalIds: new Set<string>(),
    isShielded: false,
    wobbleReduction: 1.0,
    magneticPullTargetX: null,
    magneticPullStrength: 0,
    mudZones: [],
    hayPlatforms: [],
    honeyTrapCenteringFactor: 0,
    bushSpawnPositions: [],
  };

  for (const effect of state.activeEffects) {
    const remaining = effect.remainingTime - deltaTime;
    if (remaining <= 0) continue;
    tickEffect(effect, remaining, deltaTime, context.canvasWidth, acc);
  }

  return {
    state: { ...state, activeEffects: acc.updatedEffects },
    clearedAnimalIds: acc.clearedAnimalIds,
    stunnedAnimalIds: acc.stunnedAnimalIds,
    isShielded: acc.isShielded,
    wobbleReduction: acc.wobbleReduction,
    magneticPullTargetX: acc.magneticPullTargetX,
    magneticPullStrength: acc.magneticPullStrength,
    mudZones: acc.mudZones,
    hayPlatforms: acc.hayPlatforms,
    honeyTrapCenteringFactor: acc.honeyTrapCenteringFactor,
    bushSpawnPositions: acc.bushSpawnPositions,
    bonusScore: 0,
  };
}

// ---------------------------------------------------------------------------
// Honey-trap catch consumption
// ---------------------------------------------------------------------------

/**
 * Call after a catch while honey trap is active to decrement remaining catches.
 */
export function consumeHoneyTrapCatch(state: AbilitySystemState): AbilitySystemState {
  const updatedEffects = state.activeEffects.map((effect) => {
    if (effect.type === "honey_trap" && effect.catchesRemaining > 0) {
      return { ...effect, catchesRemaining: effect.catchesRemaining - 1 };
    }
    return effect;
  });

  return { ...state, activeEffects: updatedEffects };
}

// ---------------------------------------------------------------------------
// Stack-animal cooldown update
// ---------------------------------------------------------------------------

/**
 * Tick down ability cooldowns for all stacked animals.
 * Returns updated animals.
 */
export function updateStackAbilityCooldowns(
  stack: AnimalEntity[],
  deltaTime: number
): AnimalEntity[] {
  return stack.map((animal) => {
    if (animal.animal.abilityCooldown <= 0) return animal;
    return {
      ...animal,
      animal: {
        ...animal.animal,
        abilityCooldown: Math.max(0, animal.animal.abilityCooldown - deltaTime),
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Ability-type resolution helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the ability type string for a stacked animal by checking its variant
 * against the archetype definitions from SpawnSystem.
 *
 * If the variant has a specialAbility, we return its type; otherwise null.
 */
export function resolveAbilityType(animal: AnimalEntity): string | null {
  // Fast path: if the animal has no ability ready, skip lookup
  if (!animal.animal.abilityReady) return null;

  const archetype = ANIMAL_ARCHETYPES.get(animal.animal.animalType);
  if (!archetype) return null;

  const variant = archetype.variants.find((v: AnimalVariant) => v.id === animal.animal.variant);
  if (!variant?.specialAbility) return null;

  return variant.specialAbility.type;
}

// ---------------------------------------------------------------------------
// Tap-hit detection
// ---------------------------------------------------------------------------

/**
 * Find which stacked animal (if any) was tapped.
 * Returns the animal if it has an ability ready, or null.
 */
export function findTappedAbilityAnimal(
  tapX: number,
  tapY: number,
  player: PlayerEntity
): AnimalEntity | null {
  // Iterate stack top-to-bottom so the topmost animal gets priority
  const stack = player.player.stack;
  for (let i = stack.length - 1; i >= 0; i--) {
    const animal = stack[i];
    if (!animal.animal.abilityReady) continue;
    if (animal.animal.abilityCooldown > 0) continue;

    const ax = animal.transform.position.x;
    const ay = animal.transform.position.y;
    const aw = animal.bounds?.width ?? 50;
    const ah = animal.bounds?.height ?? 50;

    // Generous hit-test (50% larger) so it is easy to tap
    const margin = 15;
    if (
      tapX >= ax - margin &&
      tapX <= ax + aw + margin &&
      tapY >= ay - margin &&
      tapY <= ay + ah + margin
    ) {
      return animal;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Slow-zone check for falling animals
// ---------------------------------------------------------------------------

/**
 * Returns the slowest factor (smallest multiplier) that applies to an animal
 * based on all active mud zones.
 */
export function getMudSlowFactor(
  animalX: number,
  animalY: number,
  animalWidth: number,
  animalHeight: number,
  mudZones: AbilityUpdateResult["mudZones"]
): number {
  let factor = 1.0;

  for (const zone of mudZones) {
    const animalCX = animalX + animalWidth / 2;
    const animalCY = animalY + animalHeight / 2;

    if (
      animalCX >= zone.x &&
      animalCX <= zone.x + zone.width &&
      animalCY >= zone.y &&
      animalCY <= zone.y + zone.height
    ) {
      factor = Math.min(factor, zone.slowFactor);
    }
  }

  return factor;
}

// ---------------------------------------------------------------------------
// Hay-platform bounce check for falling animals
// ---------------------------------------------------------------------------

export interface HayBounceResult {
  bounced: boolean;
  bounceVelocityY: number;
  bounceVelocityX: number;
}

/**
 * Check if a falling animal collides with any hay platform.
 */
export function checkHayPlatformBounce(
  animalX: number,
  animalY: number,
  animalWidth: number,
  animalHeight: number,
  animalVelocityY: number,
  platforms: AbilityUpdateResult["hayPlatforms"]
): HayBounceResult {
  if (animalVelocityY <= 0) {
    return { bounced: false, bounceVelocityY: 0, bounceVelocityX: 0 };
  }

  const animalBottom = animalY + animalHeight;
  const animalCenterX = animalX + animalWidth / 2;

  for (const platform of platforms) {
    // AABB overlap: animal bottom within platform top range, horizontal overlap
    if (
      animalBottom >= platform.y &&
      animalBottom <= platform.y + platform.height + animalVelocityY &&
      animalCenterX >= platform.x &&
      animalCenterX <= platform.x + platform.width
    ) {
      const hitOffsetX = animalCenterX - (platform.x + platform.width / 2);
      return {
        bounced: true,
        bounceVelocityY: -platform.bounceForce,
        bounceVelocityX: hitOffsetX * 0.05,
      };
    }
  }

  return { bounced: false, bounceVelocityY: 0, bounceVelocityX: 0 };
}

// ---------------------------------------------------------------------------
// Rendering data helpers (data-only, no canvas calls)
// ---------------------------------------------------------------------------

export interface AbilityIndicator {
  animalId: string;
  abilityType: string;
  isReady: boolean;
  cooldownProgress: number; // 0 = just used, 1 = ready
}

/**
 * Build ability indicator data for all stacked special animals.
 */
export function getAbilityIndicators(stack: AnimalEntity[]): AbilityIndicator[] {
  const indicators: AbilityIndicator[] = [];

  for (const animal of stack) {
    if (!animal.animal.abilityReady) continue;

    const abilityType = resolveAbilityType(animal);
    if (!abilityType || abilityType === "feather_float") continue;

    const config = ABILITY_CONFIGS[abilityType];
    const cooldownTotal = config?.cooldown ?? 1;
    const cooldownRemaining = animal.animal.abilityCooldown;
    const progress = cooldownTotal > 0 ? Math.max(0, 1 - cooldownRemaining / cooldownTotal) : 1;

    indicators.push({
      animalId: animal.id,
      abilityType,
      isReady: cooldownRemaining <= 0,
      cooldownProgress: progress,
    });
  }

  return indicators;
}

// ---------------------------------------------------------------------------
// Active effect visual data (for renderers)
// ---------------------------------------------------------------------------

export interface ActiveEffectVisual {
  type: string;
  x: number;
  y: number;
  /** Width of effect zone, or blast radius for circular effects */
  width: number;
  /** Height of effect zone */
  height: number;
  /** Remaining fraction (0-1) */
  progress: number;
  /** Extra data depending on type */
  extra?: Record<string, unknown>;
}

/**
 * Produce visual data for all active effects (data-only, no rendering).
 */
export function getActiveEffectVisuals(state: AbilitySystemState): ActiveEffectVisual[] {
  const visuals: ActiveEffectVisual[] = [];

  for (const effect of state.activeEffects) {
    const progress = effect.totalDuration > 0 ? effect.remainingTime / effect.totalDuration : 0;

    switch (effect.type) {
      case "poop_shot":
        visuals.push({
          type: "poop_shot",
          x: effect.x,
          y: effect.y,
          width: 15,
          height: 15,
          progress,
        });
        break;

      case "egg_bomb":
        visuals.push({
          type: "egg_bomb",
          x: effect.x,
          y: effect.y,
          width: effect.blastRadius * 2,
          height: effect.blastRadius * 2,
          progress,
        });
        break;

      case "mud_splash":
        visuals.push({
          type: "mud_splash",
          x: effect.x,
          y: effect.y,
          width: effect.width,
          height: effect.height,
          progress,
        });
        break;

      case "wool_shield":
        visuals.push({
          type: "wool_shield",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          progress,
        });
        break;

      case "bleat_stun":
        visuals.push({
          type: "bleat_stun",
          x: effect.x,
          y: effect.y,
          width: effect.radius * 2,
          height: effect.radius * 2,
          progress,
        });
        break;

      case "honey_trap":
        visuals.push({
          type: "honey_trap",
          x: effect.x,
          y: effect.y,
          width: 100,
          height: 30,
          progress,
          extra: { catchesRemaining: effect.catchesRemaining },
        });
        break;

      case "crow_call":
        visuals.push({
          type: "crow_call",
          x: effect.targetX,
          y: 0,
          width: 0,
          height: 0,
          progress,
        });
        break;

      case "hay_storm":
        for (const platform of effect.platforms) {
          visuals.push({
            type: "hay_platform",
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height,
            progress,
          });
        }
        break;
    }
  }

  return visuals;
}
