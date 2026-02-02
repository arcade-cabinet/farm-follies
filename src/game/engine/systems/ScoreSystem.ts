/**
 * ScoreSystem - Point calculation and combo management
 * Pure functions for all scoring logic
 */

import type { AnimalState, ProgressionState, ScoreState } from "../state/GameState";
import { ANIMAL_ARCHETYPES } from "./SpawnSystem";

// Score configuration
export interface ScoreConfig {
  // Base points
  baseCatchPoints: number;
  bankBonusPerAnimal: number;

  // Combos
  comboMultiplierIncrement: number;
  maxComboMultiplier: number;
  comboDecayTime: number; // ms before combo resets

  // Special bonuses
  specialVariantBonus: number;
  bushBounceBonus: number;
  perfectCatchBonus: number; // Catch in center

  // Level bonuses
  levelCompleteBonus: number;
  noMissBonus: number;
  speedBonus: number;

  // Power-up multipliers
  doublePointsMultiplier: number;
}

export const DEFAULT_SCORE_CONFIG: ScoreConfig = {
  baseCatchPoints: 10,
  bankBonusPerAnimal: 5,

  comboMultiplierIncrement: 0.1,
  maxComboMultiplier: 3.0,
  comboDecayTime: 2000,

  specialVariantBonus: 25,
  bushBounceBonus: 15,
  perfectCatchBonus: 10,

  levelCompleteBonus: 100,
  noMissBonus: 50,
  speedBonus: 25,

  doublePointsMultiplier: 2,
};

// Score event types
export interface ScoreEvent {
  type: ScoreEventType;
  basePoints: number;
  multiplier: number;
  finalPoints: number;
  source?: string;
}

export type ScoreEventType =
  | "catch"
  | "bank"
  | "combo"
  | "special_variant"
  | "bush_bounce"
  | "perfect_catch"
  | "level_complete"
  | "no_miss"
  | "speed_bonus"
  | "power_up";

/**
 * Calculate points for catching an animal
 */
export function calculateCatchPoints(
  animal: AnimalState,
  catchPosition: "left" | "center" | "right",
  scoreState: ScoreState,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreEvent {
  const archetype = ANIMAL_ARCHETYPES.get(animal.type);
  const basePoints = archetype?.pointValue ?? config.baseCatchPoints;

  // Apply multipliers
  let multiplier = scoreState.multiplier;

  // Combo multiplier
  multiplier *= 1 + scoreState.combo * config.comboMultiplierIncrement;
  multiplier = Math.min(multiplier, config.maxComboMultiplier);

  // Perfect catch bonus
  let bonusPoints = 0;
  if (catchPosition === "center") {
    bonusPoints += config.perfectCatchBonus;
  }

  const finalPoints = Math.floor((basePoints + bonusPoints) * multiplier);

  return {
    type: "catch",
    basePoints,
    multiplier,
    finalPoints,
    source: animal.type,
  };
}

/**
 * Calculate points for a special variant catch
 */
export function calculateSpecialVariantBonus(
  animal: AnimalState,
  scoreState: ScoreState,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreEvent {
  const archetype = ANIMAL_ARCHETYPES.get(animal.type);
  const variant = archetype?.variants.find((v) => v.id === animal.variant);

  const basePoints = config.specialVariantBonus;
  const variantMultiplier = variant?.pointMultiplier ?? 1;
  const finalPoints = Math.floor(basePoints * variantMultiplier * scoreState.multiplier);

  return {
    type: "special_variant",
    basePoints,
    multiplier: variantMultiplier * scoreState.multiplier,
    finalPoints,
    source: `${animal.type}_${animal.variant}`,
  };
}

/**
 * Calculate points for banking animals
 */
export function calculateBankPoints(
  animals: AnimalState[],
  scoreState: ScoreState,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreEvent {
  let basePoints = 0;

  // Sum up animal values
  animals.forEach((animal) => {
    const archetype = ANIMAL_ARCHETYPES.get(animal.type);
    basePoints += archetype?.pointValue ?? config.baseCatchPoints;
  });

  // Add banking bonus per animal
  basePoints += animals.length * config.bankBonusPerAnimal;

  // Stack size bonus (more animals = higher bonus)
  const stackBonus = animals.length ** 1.5 * 5;
  basePoints += Math.floor(stackBonus);

  const finalPoints = Math.floor(basePoints * scoreState.multiplier);

  return {
    type: "bank",
    basePoints,
    multiplier: scoreState.multiplier,
    finalPoints,
    source: `${animals.length} animals`,
  };
}

/**
 * Calculate bush bounce bonus
 */
export function calculateBushBounceBonus(
  animal: AnimalState,
  scoreState: ScoreState,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreEvent {
  const basePoints = config.bushBounceBonus;
  const finalPoints = Math.floor(basePoints * scoreState.multiplier);

  return {
    type: "bush_bounce",
    basePoints,
    multiplier: scoreState.multiplier,
    finalPoints,
    source: animal.type,
  };
}

/**
 * Calculate level completion bonus
 */
export function calculateLevelBonus(
  level: number,
  missedCount: number,
  completionTime: number,
  targetTime: number,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): ScoreEvent[] {
  const events: ScoreEvent[] = [];

  // Base level completion bonus
  const levelBonus = config.levelCompleteBonus * level;
  events.push({
    type: "level_complete",
    basePoints: levelBonus,
    multiplier: 1,
    finalPoints: levelBonus,
    source: `Level ${level}`,
  });

  // No miss bonus
  if (missedCount === 0) {
    events.push({
      type: "no_miss",
      basePoints: config.noMissBonus,
      multiplier: level,
      finalPoints: config.noMissBonus * level,
      source: "Perfect!",
    });
  }

  // Speed bonus (completed faster than target)
  if (completionTime < targetTime) {
    const speedFactor = 1 - completionTime / targetTime;
    const speedBonus = Math.floor(config.speedBonus * speedFactor * level);
    events.push({
      type: "speed_bonus",
      basePoints: config.speedBonus,
      multiplier: speedFactor * level,
      finalPoints: speedBonus,
      source: "Speed bonus!",
    });
  }

  return events;
}

/**
 * Update combo state after a catch
 */
export function updateCombo(
  currentCombo: number,
  currentTimer: number,
  deltaTime: number,
  caught: boolean,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): { combo: number; timer: number } {
  if (caught) {
    return {
      combo: currentCombo + 1,
      timer: config.comboDecayTime,
    };
  }

  // Decay timer
  const newTimer = currentTimer - deltaTime;

  if (newTimer <= 0) {
    return { combo: 0, timer: 0 };
  }

  return { combo: currentCombo, timer: newTimer };
}

/**
 * Reset combo (on miss or timeout)
 */
export function resetCombo(): { combo: number; timer: number } {
  return { combo: 0, timer: 0 };
}

/**
 * Calculate total multiplier from all sources
 */
export function calculateTotalMultiplier(
  scoreState: ScoreState,
  doublePointsActive: boolean,
  config: ScoreConfig = DEFAULT_SCORE_CONFIG
): number {
  let multiplier = scoreState.multiplier;

  // Combo contribution
  multiplier += scoreState.combo * config.comboMultiplierIncrement;

  // Power-up contribution
  if (doublePointsActive) {
    multiplier *= config.doublePointsMultiplier;
  }

  return Math.min(multiplier, config.maxComboMultiplier * config.doublePointsMultiplier);
}

/**
 * Apply score event to score state
 */
export function applyScoreEvent(scoreState: ScoreState, event: ScoreEvent): ScoreState {
  const newScore = scoreState.current + event.finalPoints;
  const newHighScore = Math.max(scoreState.highScore, newScore);

  return {
    ...scoreState,
    current: newScore,
    highScore: newHighScore,
    levelScore: scoreState.levelScore + event.finalPoints,
  };
}

/**
 * Apply multiple score events
 */
export function applyScoreEvents(scoreState: ScoreState, events: ScoreEvent[]): ScoreState {
  return events.reduce((state, event) => applyScoreEvent(state, event), scoreState);
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }
  return score.toString();
}

/**
 * Format multiplier for display
 */
export function formatMultiplier(multiplier: number): string {
  return `×${multiplier.toFixed(1)}`;
}

/**
 * Calculate high score rank description
 */
export function getScoreRank(score: number): { rank: string; description: string } {
  if (score >= 10000) return { rank: "S", description: "Legendary Farmer" };
  if (score >= 7500) return { rank: "A", description: "Master Farmer" };
  if (score >= 5000) return { rank: "B", description: "Expert Farmer" };
  if (score >= 2500) return { rank: "C", description: "Skilled Farmer" };
  if (score >= 1000) return { rank: "D", description: "Apprentice Farmer" };
  return { rank: "E", description: "Novice Farmer" };
}

/**
 * Create initial score state
 */
export function createInitialScoreState(highScore: number = 0): ScoreState {
  return {
    current: 0,
    multiplier: 1,
    combo: 0,
    comboTimer: 0,
    highScore,
    levelScore: 0,
  };
}

/**
 * Reset score state for new game (preserving high score)
 */
export function resetScoreState(scoreState: ScoreState): ScoreState {
  return {
    ...createInitialScoreState(scoreState.highScore),
  };
}

/**
 * Reset level score (for new level, preserving total score)
 */
export function resetLevelScore(scoreState: ScoreState): ScoreState {
  return {
    ...scoreState,
    levelScore: 0,
  };
}
