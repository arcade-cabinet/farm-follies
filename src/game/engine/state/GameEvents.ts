/**
 * GameEvents - Type-safe event system for game state changes
 * Decouples game logic from side effects (audio, analytics, UI updates)
 */

import type { AnimalState, AnimalType, PowerUpState, BushState, GamePhase } from './GameState';
import type { PowerUpType } from '../../config';

// Event type definitions
export interface GameEventMap {
  // Lifecycle events
  'game:start': { level: number; mode: string };
  'game:pause': { timestamp: number };
  'game:resume': { timestamp: number };
  'game:over': { score: number; level: number; cause: GameOverCause };
  'game:victory': { score: number; level: number };
  'phase:change': { from: GamePhase; to: GamePhase };
  
  // Level events
  'level:start': { level: number };
  'level:complete': { level: number; score: number; bonuses: LevelBonus[] };
  'level:failed': { level: number; reason: string };
  
  // Animal events
  'animal:spawned': { animal: AnimalState; fromTornado: boolean };
  'animal:caught': { animal: AnimalState; catchPosition: number; combo: number };
  'animal:dropped': { animal: AnimalState; reason: DropReason };
  'animal:missed': { animal: AnimalState };
  'animal:banked': { animals: AnimalState[]; totalPoints: number };
  'animal:merged': { animals: AnimalState[]; result: AnimalState };
  'animal:special': { animal: AnimalState; abilityType: string };
  
  // Stack events
  'stack:wobble': { intensity: number; direction: number };
  'stack:collapse': { animals: AnimalState[]; cause: CollapseCause };
  'stack:stabilize': { animals: AnimalState[] };
  
  // Power-up events
  'powerup:spawned': { powerUp: PowerUpState };
  'powerup:collected': { powerUp: PowerUpState; effect: PowerUpEffect };
  'powerup:expired': { type: PowerUpType };
  
  // Bush events
  'bush:planted': { bush: BushState; byAnimal: AnimalState };
  'bush:grown': { bush: BushState };
  'bush:bounce': { bush: BushState; animal: AnimalState; bounceForce: number };
  
  // Tornado events
  'tornado:spawn': { x: number; animalType: AnimalType };
  'tornado:intensity_change': { oldIntensity: number; newIntensity: number };
  
  // Score events
  'score:add': { points: number; source: ScoreSource; multiplier: number };
  'score:multiplier': { oldValue: number; newValue: number; reason: string };
  'score:combo': { combo: number; bonus: number };
  'score:highscore': { newHighScore: number; previousHighScore: number };
  
  // Life events
  'life:lost': { remaining: number; cause: LifeLostCause };
  'life:gained': { remaining: number; source: string };
  'life:max_reached': { maxLives: number };
  
  // Effect events
  'effect:screen_shake': { intensity: number; duration: number };
  'effect:flash': { color: string; duration: number };
  'effect:particle_burst': { x: number; y: number; type: string; count: number };
  
  // Input events
  'input:drag_start': { x: number; y: number };
  'input:drag_move': { x: number; y: number; deltaX: number };
  'input:drag_end': { x: number; y: number };
  'input:tap': { x: number; y: number };
  
  // Achievement events
  'achievement:progress': { achievementId: string; current: number; target: number };
  'achievement:unlocked': { achievementId: string; timestamp: number };
}

// Supporting types
export type GameOverCause = 
  | 'lives_depleted' 
  | 'stack_collapse' 
  | 'time_expired' 
  | 'boss_defeated_player';

export type DropReason = 
  | 'wobble_exceeded' 
  | 'player_action' 
  | 'collision' 
  | 'special_ability';

export type CollapseCause = 
  | 'excessive_wobble' 
  | 'overweight' 
  | 'impact' 
  | 'special_ability';

export type ScoreSource = 
  | 'catch' 
  | 'bank' 
  | 'merge' 
  | 'combo' 
  | 'special_ability' 
  | 'bush_bounce' 
  | 'level_complete';

export type LifeLostCause = 
  | 'animal_missed' 
  | 'stack_collapse' 
  | 'hazard' 
  | 'boss_attack';

export interface LevelBonus {
  type: 'no_miss' | 'speed' | 'combo_master' | 'special_variant';
  points: number;
  description: string;
}

export interface PowerUpEffect {
  type: PowerUpType;
  duration?: number;
  value?: number;
}

// Event type helper
export type GameEventType = keyof GameEventMap;
export type GameEventPayload<T extends GameEventType> = GameEventMap[T];

// Event listener type
export type GameEventListener<T extends GameEventType> = (payload: GameEventPayload<T>) => void;

// Event bus class
export class GameEventBus {
  private listeners: Map<GameEventType, Set<GameEventListener<GameEventType>>> = new Map();
  private eventHistory: Array<{ type: GameEventType; payload: unknown; timestamp: number }> = [];
  private historyLimit = 100;
  private paused = false;

  /**
   * Subscribe to a game event
   */
  on<T extends GameEventType>(type: T, listener: GameEventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as GameEventListener<GameEventType>);
    
    // Return unsubscribe function
    return () => this.off(type, listener);
  }

  /**
   * Unsubscribe from a game event
   */
  off<T extends GameEventType>(type: T, listener: GameEventListener<T>): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(listener as GameEventListener<GameEventType>);
    }
  }

  /**
   * Subscribe to an event only once
   */
  once<T extends GameEventType>(type: T, listener: GameEventListener<T>): () => void {
    const wrappedListener: GameEventListener<T> = (payload) => {
      this.off(type, wrappedListener);
      listener(payload);
    };
    return this.on(type, wrappedListener);
  }

  /**
   * Emit a game event
   */
  emit<T extends GameEventType>(type: T, payload: GameEventPayload<T>): void {
    if (this.paused) return;

    // Record in history
    this.eventHistory.push({
      type,
      payload,
      timestamp: performance.now(),
    });
    
    // Trim history if needed
    if (this.eventHistory.length > this.historyLimit) {
      this.eventHistory = this.eventHistory.slice(-this.historyLimit);
    }

    // Notify listeners
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(listener => {
        try {
          listener(payload as GameEventPayload<GameEventType>);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }
  }

  /**
   * Pause event emission (useful during state transitions)
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume event emission
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * Get event history (for debugging/replay)
   */
  getHistory(): ReadonlyArray<{ type: GameEventType; payload: unknown; timestamp: number }> {
    return this.eventHistory;
  }

  /**
   * Clear all listeners and history
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(type?: GameEventType): number {
    if (type) {
      return this.listeners.get(type)?.size ?? 0;
    }
    let total = 0;
    this.listeners.forEach(set => total += set.size);
    return total;
  }
}

// Singleton instance for global event bus
let globalEventBus: GameEventBus | null = null;

export function getGameEventBus(): GameEventBus {
  if (!globalEventBus) {
    globalEventBus = new GameEventBus();
  }
  return globalEventBus;
}

export function resetGameEventBus(): void {
  if (globalEventBus) {
    globalEventBus.clear();
  }
  globalEventBus = new GameEventBus();
}

// Convenience event emitter functions
export function emitGameEvent<T extends GameEventType>(
  type: T, 
  payload: GameEventPayload<T>
): void {
  getGameEventBus().emit(type, payload);
}

export function onGameEvent<T extends GameEventType>(
  type: T, 
  listener: GameEventListener<T>
): () => void {
  return getGameEventBus().on(type, listener);
}
