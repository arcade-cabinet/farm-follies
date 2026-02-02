/**
 * GameStateManager - Manages game session state (score, lives, level, etc.)
 * 
 * Separates game session state from entity state
 */

import { GAME_CONFIG } from '../../config';

const { lives: livesConfig, scoring, difficulty, banking } = GAME_CONFIG;

export interface GameSessionState {
  // Core state
  score: number;
  level: number;
  lives: number;
  maxLives: number;
  
  // Progression
  bankedAnimals: number;
  totalCaught: number;
  totalMissed: number;
  
  // Scoring
  currentMultiplier: number;
  combo: number;
  lastCatchTime: number;
  perfectStreak: number;
  lastScoreForLifeBonus: number;
  
  // Timing
  gameStartTime: number;
  playTime: number;
  
  // Spawn tracking
  spawnInterval: number;
  lastSpawnTime: number;
  lastPowerUpTime: number;
  
  // Status flags
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  inDangerState: boolean;
}

export interface GameStateCallbacks {
  onScoreChange?: (score: number, multiplier: number, combo: number) => void;
  onLivesChange?: (lives: number, maxLives: number) => void;
  onLevelUp?: (level: number) => void;
  onDangerStateChange?: (inDanger: boolean) => void;
  onGameOver?: (finalScore: number, bankedAnimals: number) => void;
  onLifeEarned?: () => void;
}

/**
 * Create initial game session state
 */
export function createInitialState(): GameSessionState {
  return {
    score: 0,
    level: 1,
    lives: livesConfig.starting,
    maxLives: livesConfig.max,
    
    bankedAnimals: 0,
    totalCaught: 0,
    totalMissed: 0,
    
    currentMultiplier: 1,
    combo: 0,
    lastCatchTime: 0,
    perfectStreak: 0,
    lastScoreForLifeBonus: 0,
    
    gameStartTime: 0,
    playTime: 0,
    
    spawnInterval: GAME_CONFIG.spawning.initialInterval,
    lastSpawnTime: 0,
    lastPowerUpTime: 0,
    
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    inDangerState: false,
  };
}

export class GameStateManager {
  private state: GameSessionState;
  private callbacks: GameStateCallbacks;

  constructor(callbacks: GameStateCallbacks = {}) {
    this.state = createInitialState();
    this.callbacks = callbacks;
  }

  /**
   * Get current state (immutable snapshot)
   */
  getState(): Readonly<GameSessionState> {
    return { ...this.state };
  }

  /**
   * Start a new game
   */
  startGame(): void {
    this.state = {
      ...createInitialState(),
      gameStartTime: performance.now(),
      isPlaying: true,
    };
    
    this.callbacks.onScoreChange?.(0, 1, 0);
    this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.state.isPaused = true;
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.state.isPaused = false;
  }

  /**
   * End the game
   */
  endGame(): void {
    this.state.isPlaying = false;
    this.state.isGameOver = true;
    this.callbacks.onGameOver?.(this.state.score, this.state.bankedAnimals);
  }

  /**
   * Add score with multipliers
   */
  addScore(
    basePoints: number,
    options: {
      isPerfect?: boolean;
      isGood?: boolean;
      stackBonus?: number;
    } = {}
  ): number {
    const now = performance.now();
    
    // Update combo
    if (now - this.state.lastCatchTime < scoring.comboDecayTime) {
      this.state.combo++;
    } else {
      this.state.combo = 1;
    }
    this.state.lastCatchTime = now;
    
    // Calculate total points
    const catchBonus = options.isPerfect 
      ? scoring.perfectBonus 
      : options.isGood 
        ? scoring.goodBonus 
        : 1;
    const stackBonus = options.stackBonus ?? 1;
    const comboBonus = 1 + this.state.combo * scoring.comboMultiplier;
    
    const points = Math.floor(
      basePoints * catchBonus * stackBonus * this.state.currentMultiplier * comboBonus
    );
    
    this.state.score += points;
    
    // Update multiplier
    this.state.currentMultiplier = Math.min(
      scoring.maxMultiplier,
      this.state.currentMultiplier + 0.1
    );
    
    // Perfect streak tracking
    if (options.isPerfect) {
      this.state.perfectStreak++;
      if (this.state.perfectStreak >= livesConfig.earnThresholds.perfectStreak) {
        this.earnLife();
        this.state.perfectStreak = 0;
      }
    } else {
      this.state.perfectStreak = 0;
    }
    
    // Score-based life bonus
    if (this.state.score - this.state.lastScoreForLifeBonus >= livesConfig.earnThresholds.scoreBonus) {
      this.earnLife();
      this.state.lastScoreForLifeBonus = this.state.score;
    }
    
    this.state.totalCaught++;
    this.checkLevelUp();
    
    this.callbacks.onScoreChange?.(
      this.state.score,
      this.state.currentMultiplier,
      this.state.combo
    );
    
    return points;
  }

  /**
   * Bank animals for points
   */
  bankAnimals(count: number): number {
    if (count < banking.minStackToBank) return 0;
    
    const bankBonus = count * scoring.bankingBonusPerAnimal * this.state.currentMultiplier;
    this.state.score += Math.floor(bankBonus);
    this.state.bankedAnimals += count;
    
    // Banking bonus life
    if (count >= livesConfig.earnThresholds.bankingBonus) {
      this.earnLife();
    }
    
    // Banking penalty to multiplier
    this.state.currentMultiplier = Math.max(1, this.state.currentMultiplier * scoring.bankingPenalty);
    
    this.callbacks.onScoreChange?.(
      this.state.score,
      this.state.currentMultiplier,
      this.state.combo
    );
    
    return Math.floor(bankBonus);
  }

  /**
   * Lose a life
   */
  loseLife(): boolean {
    this.state.lives--;
    this.state.totalMissed++;
    this.state.combo = 0;
    this.state.perfectStreak = 0;
    this.state.currentMultiplier = Math.max(1, this.state.currentMultiplier * 0.8);
    
    this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
    this.callbacks.onScoreChange?.(
      this.state.score,
      this.state.currentMultiplier,
      this.state.combo
    );
    
    if (this.state.lives <= 0) {
      this.endGame();
      return false; // Game over
    }
    
    return true; // Still alive
  }

  /**
   * Earn a life
   */
  earnLife(): void {
    if (this.state.lives >= this.state.maxLives) return;
    
    this.state.lives++;
    this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
    this.callbacks.onLifeEarned?.();
  }

  /**
   * Add a life (power-up)
   */
  addLife(): void {
    if (this.state.lives < this.state.maxLives) {
      this.state.lives++;
      this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
    }
  }

  /**
   * Full restore
   */
  fullRestore(): void {
    this.state.lives = this.state.maxLives;
    this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
  }

  /**
   * Increase max lives
   */
  increaseMaxLives(): void {
    if (this.state.maxLives < livesConfig.absoluteMax) {
      this.state.maxLives++;
      this.state.lives++; // Also heal
      this.callbacks.onLivesChange?.(this.state.lives, this.state.maxLives);
    }
  }

  /**
   * Set danger state
   */
  setDangerState(inDanger: boolean): void {
    if (this.state.inDangerState !== inDanger) {
      this.state.inDangerState = inDanger;
      this.callbacks.onDangerStateChange?.(inDanger);
    }
  }

  /**
   * Update combo decay
   */
  updateCombo(now: number): void {
    if (this.state.combo > 0 && now - this.state.lastCatchTime > scoring.comboDecayTime) {
      this.state.combo = 0;
      this.callbacks.onScoreChange?.(
        this.state.score,
        this.state.currentMultiplier,
        this.state.combo
      );
    }
  }

  /**
   * Check and perform level up
   */
  private checkLevelUp(): void {
    const newLevel = Math.min(
      difficulty.maxLevel,
      Math.floor((this.state.score / difficulty.levelUpThreshold) ** difficulty.spawnRateCurve) + 1
    );
    
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      this.state.spawnInterval = Math.max(
        GAME_CONFIG.spawning.minInterval,
        GAME_CONFIG.spawning.initialInterval - (this.state.level - 1) * GAME_CONFIG.spawning.intervalDecreasePerLevel
      );
      this.callbacks.onLevelUp?.(this.state.level);
    }
  }

  /**
   * Update spawn timing
   */
  updateSpawnTime(time: number): void {
    this.state.lastSpawnTime = time;
  }

  /**
   * Update power-up timing
   */
  updatePowerUpTime(time: number): void {
    this.state.lastPowerUpTime = time;
  }

  /**
   * Update play time
   */
  updatePlayTime(deltaTime: number): void {
    this.state.playTime += deltaTime;
  }

  /**
   * Check if should spawn
   */
  shouldSpawn(now: number): boolean {
    return now - this.state.lastSpawnTime >= this.state.spawnInterval;
  }

  /**
   * Get current level
   */
  get level(): number {
    return this.state.level;
  }

  /**
   * Get current score
   */
  get score(): number {
    return this.state.score;
  }

  /**
   * Get current lives
   */
  get lives(): number {
    return this.state.lives;
  }

  /**
   * Get banked animals count
   */
  get bankedAnimals(): number {
    return this.state.bankedAnimals;
  }

  /**
   * Check if can bank (has enough stacked)
   */
  canBank(stackHeight: number): boolean {
    return stackHeight >= banking.minStackToBank;
  }
}
