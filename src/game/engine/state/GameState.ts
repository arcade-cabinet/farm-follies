/**
 * GameState - Immutable game state container
 * Single source of truth for all game data
 */

import type { AnimalType, PowerUpType } from "../../config";

// Entity state types
export interface EntityState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  scale: number;
  active: boolean;
}

export interface AnimalState extends EntityState {
  type: AnimalType;
  variant: string;
  isCaught: boolean;
  stackIndex: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  specialAbilityReady: boolean;
  specialAbilityCooldown: number;
}

export type { AnimalType };

export interface PlayerState extends EntityState {
  stackedAnimals: AnimalState[];
  isInvincible: boolean;
  invincibilityTimer: number;
  magnetActive: boolean;
  magnetTimer: number;
  doublePointsActive: boolean;
  doublePointsTimer: number;
}

export interface TornadoState {
  x: number;
  y: number;
  direction: 1 | -1;
  speed: number;
  rotation: number;
  intensity: number;
  isSpawning: boolean;
  spawnCooldown: number;
  width: number;
  height: number;
}

export interface BushState extends EntityState {
  growthStage: number; // 0-1, 1 = fully grown
  bounceStrength: number;
  plantedBy: string; // animal ID that planted it
}

export interface PowerUpState extends EntityState {
  type: PowerUpType;
  collected: boolean;
}

export interface ProjectileState extends EntityState {
  type: "poop" | "egg" | "feather" | "milk";
  sourceAnimalId: string;
  damage: number;
  lifetime: number;
}

// Game phase states
export type GamePhase =
  | "idle"
  | "starting"
  | "playing"
  | "paused"
  | "wobble_warning"
  | "game_over"
  | "victory";

// Score and progression
export interface ScoreState {
  current: number;
  multiplier: number;
  combo: number;
  comboTimer: number;
  highScore: number;
  levelScore: number;
}

export interface ProgressionState {
  level: number;
  lives: number;
  maxLives: number;
  bankedAnimals: number;
  totalCaught: number;
  animalsThisLevel: number;
  bossDefeated: boolean;
}

// Visual effects state
export interface EffectsState {
  screenShake: number;
  flashColor: string | null;
  flashDuration: number;
  particles: ParticleState[];
  floatingTexts: FloatingTextState[];
}

export interface ParticleState {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  type: "dust" | "sparkle" | "debris" | "splash" | "feather";
}

export interface FloatingTextState {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  lifetime: number;
  maxLifetime: number;
  velocityY: number;
}

// Complete game state
export interface GameState {
  phase: GamePhase;
  timestamp: number;
  deltaTime: number;

  // Entities
  player: PlayerState;
  tornado: TornadoState;
  fallingAnimals: AnimalState[];
  bushes: BushState[];
  powerUps: PowerUpState[];
  projectiles: ProjectileState[];

  // Game data
  score: ScoreState;
  progression: ProgressionState;
  effects: EffectsState;

  // Input state
  input: InputState;

  // Canvas dimensions (for calculations)
  canvas: {
    width: number;
    height: number;
    bankWidth: number;
  };
}

export interface InputState {
  pointerX: number;
  pointerY: number;
  isPointerDown: boolean;
  isDragging: boolean;
  dragStartX: number;
  dragOffsetX: number;
}

// Factory functions for creating initial states
export function createInitialPlayerState(canvasWidth: number, canvasHeight: number): PlayerState {
  const width = 80;
  const height = 100;
  return {
    id: "player",
    x: canvasWidth / 2 - width / 2,
    y: canvasHeight - height - 20,
    width,
    height,
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
  };
}

export function createInitialTornadoState(canvasWidth: number, bankWidth: number): TornadoState {
  return {
    x: canvasWidth / 2,
    y: 30,
    direction: 1,
    speed: 2,
    rotation: 0,
    intensity: 0.3,
    isSpawning: false,
    spawnCooldown: 0,
    width: 80,
    height: 120,
  };
}

export function createInitialGameState(
  canvasWidth: number,
  canvasHeight: number,
  bankWidth: number
): GameState {
  return {
    phase: "idle",
    timestamp: 0,
    deltaTime: 0,

    player: createInitialPlayerState(canvasWidth, canvasHeight),
    tornado: createInitialTornadoState(canvasWidth, bankWidth),
    fallingAnimals: [],
    bushes: [],
    powerUps: [],
    projectiles: [],

    score: {
      current: 0,
      multiplier: 1,
      combo: 0,
      comboTimer: 0,
      highScore: 0,
      levelScore: 0,
    },

    progression: {
      level: 1,
      lives: 3,
      maxLives: 5,
      bankedAnimals: 0,
      totalCaught: 0,
      animalsThisLevel: 0,
      bossDefeated: false,
    },

    effects: {
      screenShake: 0,
      flashColor: null,
      flashDuration: 0,
      particles: [],
      floatingTexts: [],
    },

    input: {
      pointerX: 0,
      pointerY: 0,
      isPointerDown: false,
      isDragging: false,
      dragStartX: 0,
      dragOffsetX: 0,
    },

    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      bankWidth,
    },
  };
}

// State update helpers (immutable)
export function updatePlayer(state: GameState, updates: Partial<PlayerState>): GameState {
  return {
    ...state,
    player: { ...state.player, ...updates },
  };
}

export function updateTornado(state: GameState, updates: Partial<TornadoState>): GameState {
  return {
    ...state,
    tornado: { ...state.tornado, ...updates },
  };
}

export function updateScore(state: GameState, updates: Partial<ScoreState>): GameState {
  return {
    ...state,
    score: { ...state.score, ...updates },
  };
}

export function updateProgression(state: GameState, updates: Partial<ProgressionState>): GameState {
  return {
    ...state,
    progression: { ...state.progression, ...updates },
  };
}

export function addFallingAnimal(state: GameState, animal: AnimalState): GameState {
  return {
    ...state,
    fallingAnimals: [...state.fallingAnimals, animal],
  };
}

export function removeFallingAnimal(state: GameState, animalId: string): GameState {
  return {
    ...state,
    fallingAnimals: state.fallingAnimals.filter((a) => a.id !== animalId),
  };
}

export function addBush(state: GameState, bush: BushState): GameState {
  return {
    ...state,
    bushes: [...state.bushes, bush],
  };
}

export function addParticle(state: GameState, particle: ParticleState): GameState {
  return {
    ...state,
    effects: {
      ...state.effects,
      particles: [...state.effects.particles, particle],
    },
  };
}

export function addFloatingText(state: GameState, text: FloatingTextState): GameState {
  return {
    ...state,
    effects: {
      ...state.effects,
      floatingTexts: [...state.effects.floatingTexts, text],
    },
  };
}
