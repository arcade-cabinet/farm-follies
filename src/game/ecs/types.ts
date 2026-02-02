/**
 * Farm Follies ECS Types
 * Miniplex-style archetype, component, and system definitions
 */

// Component Types
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Rotation {
  angle: number;
  angularVelocity: number;
}

export interface Scale {
  x: number;
  y: number;
}

export interface Wobble {
  offset: number;
  velocity: number;
  stackOffset: number;
}

export interface Health {
  current: number;
  max: number;
}

export interface Renderable {
  width: number;
  height: number;
  zIndex: number;
}

export interface Stackable {
  stackIndex: number;
  isStacked: boolean;
  canBeStacked: boolean;
}

export interface Catchable {
  isFalling: boolean;
  hasLanded: boolean;
}

export interface SpecialAbility {
  type: AbilityType;
  cooldown: number;
  maxCooldown: number;
  isReady: boolean;
}

export interface Bush {
  growth: number; // 0-1
  maxHeight: number;
  bounceForce: number;
}

// Ability Types
export type AbilityType = 
  | 'poop_shot' // Brown Cow - shoots poop that grows bushes
  | 'egg_bomb' // Golden Chicken - explosive eggs
  | 'mud_splash' // Pink Pig - slows nearby animals
  | 'wool_shield' // Black Sheep - temporary invincibility
  | 'milk_heal' // Spotted Cow - heals player
  | 'crow_call' // Albino Rooster - attracts animals to center
  | 'hay_storm' // Tan Horse - creates floating hay platforms
  | 'feather_float' // Blue Duck - slows own fall dramatically
  | 'honey_trap' // Golden Goose - sticky landing zone
  | 'bleat_stun'; // Gray Goat - stuns nearby falling animals

// Animal Types
export type AnimalType = 
  | 'cow'
  | 'chicken' 
  | 'pig'
  | 'sheep'
  | 'goat'
  | 'duck'
  | 'goose'
  | 'horse'
  | 'rooster';

// Animal Variants (special colored versions with unique abilities)
export type AnimalVariant = 'normal' | 'special';

// Complete Animal Definition
export interface AnimalArchetype {
  type: AnimalType;
  variant: AnimalVariant;
  // Base colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  // Special variant info
  specialAbility?: AbilityType;
  specialColor?: string;
  specialName?: string;
}

// Entity state
export type EntityState = 
  | 'falling'
  | 'stacked' 
  | 'banking'
  | 'scattered'
  | 'base';

// AI Behavior Types (for falling animals)
export type BehaviorType =
  | 'normal'    // Falls straight with drift
  | 'seeker'    // Aims at player
  | 'evader'    // Avoids player
  | 'zigzag'    // Oscillates side to side
  | 'dive'      // Fast dive attack
  | 'floater'   // Slow drifting fall
  | 'swooper';  // Arcing motion

// Full Entity type combining components
export interface FarmEntity {
  // Identity
  id: string;
  entityType: 'animal' | 'powerup' | 'projectile' | 'bush' | 'player' | 'tornado';
  
  // Core components
  position: Position;
  velocity: Velocity;
  rotation: Rotation;
  scale: Scale;
  renderable: Renderable;
  
  // Optional components based on entity type
  wobble?: Wobble;
  stackable?: Stackable;
  catchable?: Catchable;
  specialAbility?: SpecialAbility;
  bush?: Bush;
  health?: Health;
  
  // State
  state: EntityState;
  
  // Animal-specific
  animal?: AnimalArchetype;
  behaviorType?: BehaviorType;
  
  // Visual state
  isStressed?: boolean;
  isConfused?: boolean;
  confusedTimer?: number;
}

// System interface
export interface System {
  name: string;
  update(entities: FarmEntity[], deltaTime: number, context: SystemContext): void;
}

// Context passed to systems
export interface SystemContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  playerEntity: FarmEntity | null;
  stackedEntities: FarmEntity[];
  fallingEntities: FarmEntity[];
  bushEntities: FarmEntity[];
  tornadoEntity: FarmEntity | null;
  gameState: GameStateData;
  callbacks: GameCallbacks;
}

export interface GameStateData {
  score: number;
  combo: number;
  multiplier: number;
  level: number;
  lives: number;
  maxLives: number;
  bankedAnimals: number;
  isPlaying: boolean;
  isPaused: boolean;
  inDanger: boolean;
  tornadoX: number;
  tornadoDirection: number;
}

export interface GameCallbacks {
  onScoreChange: (score: number, multiplier: number, combo: number) => void;
  onStackChange: (height: number, canBank: boolean) => void;
  onLivesChange: (lives: number, maxLives: number) => void;
  onGameOver: (finalScore: number, bankedAnimals: number) => void;
  onPerfectCatch: (x: number, y: number) => void;
  onGoodCatch: (x: number, y: number) => void;
  onMiss: () => void;
  onBankComplete: (animalsbanked: number) => void;
  onLevelUp: (level: number) => void;
  onLifeEarned: () => void;
  onDangerState: (inDanger: boolean) => void;
  onStackTopple: () => void;
  onAbilityUsed: (type: AbilityType) => void;
  onBushGrown: (x: number, y: number) => void;
}
