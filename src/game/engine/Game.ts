/**
 * Game - Main game orchestrator
 *
 * Composes all modules into a cohesive game experience.
 * This is the new, modular replacement for the monolithic GameEngine.
 */

import { feedback } from "@/platform";
import { type GameState as DirectorGameState, GameDirector } from "../ai/GameDirector";
import { GAME_CONFIG, POWER_UPS, type PowerUpType } from "../config";
// Particle effects
import { ParticleSystem } from "../effects/ParticleEffects";
// AI
import { type TornadoState, updateTornadoState } from "../renderer/tornado";
// Core
import { GameLoop } from "./core/GameLoop";
import { calculateScale, createScaleObserver, type ScaleFactors } from "./core/ResponsiveScale";
import { type AnimalEntity, catchAnimal, createRandomAnimal } from "./entities/Animal";
// Entities
import { resetEntityIdCounter } from "./entities/Entity";
import {
  activateDoublePoints,
  activateMagnet,
  addToStack,
  clearStack,
  createPlayer,
  getPlayerCenterX,
  getStackTopY,
  isInvincible,
  type PlayerEntity,
  setInvincible,
  updatePlayerPosition,
  updatePowerUpTimers,
  updateStress,
} from "./entities/Player";
import {
  createPowerUp,
  getPowerUpBobOffset,
  type PowerUpEntity,
  updatePowerUpBob,
} from "./entities/PowerUp";
// Input
import { InputManager } from "./input/InputManager";
// Managers
import { createEntityManager, type EntityManager } from "./managers/EntityManager";
import { type GameStateCallbacks, GameStateManager } from "./managers/GameStateManager";
// Rendering
import { createRenderContext, type RenderContext } from "./rendering/RenderContext";
import { Renderer } from "./rendering/Renderer";
import type { ProjectileState } from "./state/GameState";
import {
  type AbilityIndicator as AbilityIndicatorData,
  type AbilitySystemState,
  activateAbility,
  checkHayPlatformBounce,
  consumeHoneyTrapCatch,
  createAbilitySystemState,
  findTappedAbilityAnimal,
  getAbilityIndicators,
  getActiveEffectVisuals,
  getFeatherFloatMultiplier,
  getMudSlowFactor,
  resolveAbilityType,
  updateAbilityEffects,
  updateStackAbilityCooldowns,
} from "./systems/AbilitySystem";
// Systems
import {
  addBushToState,
  applyBushBounce,
  type BushRuntimeState,
  createBushFromPoop,
  createBushRuntimeState,
  findNearbyBushes,
  getActiveBushes,
  removeBushFromState,
  resetBushIdCounter,
  shouldRemoveBush,
  updateAllBushes,
} from "./systems/BushSystem";
import { calculateMagneticPull } from "./systems/CollisionSystem";
import {
  type AnimalWobbleState,
  applyStackImpulse,
  createStackWobbleState,
  DEFAULT_WOBBLE_CONFIG,
  getAnimalWeight,
  type StackWobbleState,
} from "./systems/WobblePhysics";

const { layout, collision, physics, lives: livesConfig } = GAME_CONFIG;

export interface GameConfig {
  showDebug?: boolean;
}

export interface GameCallbacks extends GameStateCallbacks {
  onPerfectCatch?: (x: number, y: number) => void;
  onGoodCatch?: (x: number, y: number) => void;
  onMiss?: () => void;
  onBankComplete?: (count: number) => void;
  onStackTopple?: () => void;
  onStackChange?: (height: number, canBank: boolean) => void;
  onAbilityChange?: (indicators: AbilityIndicatorData[]) => void;
}

export class Game {
  // Canvas and rendering
  private canvas: HTMLCanvasElement;
  private renderCtx: RenderContext;
  private renderer: Renderer;

  // Core systems
  private gameLoop: GameLoop;
  private input: InputManager;
  private entities: EntityManager;
  private gameState: GameStateManager;

  // AI
  private gameDirector: GameDirector;

  // Scale
  private scale: ScaleFactors;
  private cleanupScaleObserver: (() => void) | null = null;

  // Tornado
  private tornadoState: TornadoState;

  // Wobble
  private wobbleState: StackWobbleState;

  // Abilities
  private abilityState: AbilitySystemState;

  // Bushes
  private bushRuntime: BushRuntimeState;
  private bushCreationTimes: Map<string, number> = new Map();

  // Particles
  private particleSystem: ParticleSystem;

  // Callbacks
  private callbacks: GameCallbacks;

  // Pending timeouts (tracked for cleanup)
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  // Performance tracking for GameDirector
  private lastMissTime = 0;
  private lastPerfectTime = 0;
  private recentCatchCount = 0;
  private recentMissCount = 0;
  private recentPerfectCount = 0;

  // Status
  private _isPlaying = false;
  private _isPaused = false;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks = {}, config: GameConfig = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;

    // Initialize scale
    this.scale = calculateScale(canvas.width, canvas.height);

    // Initialize render context
    this.renderCtx = createRenderContext(canvas, this.scale);
    this.renderer = new Renderer(this.renderCtx, {
      showDebug: config.showDebug,
      showHitboxes: config.showDebug,
    });

    // Initialize managers
    this.entities = createEntityManager();
    this.gameState = new GameStateManager({
      onScoreChange: callbacks.onScoreChange,
      onLivesChange: callbacks.onLivesChange,
      onLevelUp: callbacks.onLevelUp,
      onDangerStateChange: callbacks.onDangerStateChange,
      onGameOver: callbacks.onGameOver,
      onLifeEarned: callbacks.onLifeEarned,
    });

    // Initialize AI
    this.gameDirector = new GameDirector();

    // Initialize tornado
    this.tornadoState = this.createInitialTornadoState();

    // Initialize wobble
    this.wobbleState = createStackWobbleState();

    // Initialize abilities
    this.abilityState = createAbilitySystemState();

    // Initialize bushes
    this.bushRuntime = createBushRuntimeState();

    // Initialize particles
    this.particleSystem = new ParticleSystem();

    // Initialize input
    this.input = new InputManager(canvas, {
      onDragMove: this.handleDragMove.bind(this),
      onTap: this.handleTap.bind(this),
    });

    // Initialize game loop
    this.gameLoop = new GameLoop(
      {
        fixedUpdate: this.fixedUpdate.bind(this),
        update: this.update.bind(this),
        render: this.render.bind(this),
      },
      { enableMetrics: config.showDebug }
    );

    // Setup resize handling
    this.setupResize();
  }

  /**
   * Start a new game
   */
  start(): void {
    feedback.init();

    // Reset state
    this.gameState.startGame();
    this.entities.clear();
    this.wobbleState = createStackWobbleState();
    this.abilityState = createAbilitySystemState();
    this.bushRuntime = createBushRuntimeState();
    this.bushCreationTimes.clear();
    this.particleSystem.clear();
    this.tornadoState = this.createInitialTornadoState();
    this.gameDirector = new GameDirector();

    // Reset performance tracking
    this.lastMissTime = 0;
    this.lastPerfectTime = 0;
    this.recentCatchCount = 0;
    this.recentMissCount = 0;
    this.recentPerfectCount = 0;

    // Reset module-level ID counters
    resetEntityIdCounter();
    resetBushIdCounter();

    // Create player
    const floorY = this.canvas.height * layout.floorY;
    const player = createPlayer(
      this.canvas.width / 2,
      floorY,
      this.scale.entityWidth,
      this.scale.entityHeight
    );
    this.entities.addImmediate(player);

    // Enable input
    this.input.enable();

    // Start music
    feedback.startMusic();
    feedback.setIntensity(0);

    // Start loop
    this._isPlaying = true;
    this._isPaused = false;
    this.gameLoop.start();

    // Notify UI
    this.notifyStackChange();
  }

  /**
   * Pause the game
   */
  pause(): void {
    this._isPaused = true;
    this.gameLoop.pause();
    this.gameState.pause();
    feedback.stopMusic();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this._isPaused = false;
    this.gameLoop.resume();
    this.gameState.resume();
    feedback.startMusic();
  }

  /**
   * Stop the game
   */
  stop(): void {
    this._isPlaying = false;
    this.gameLoop.stop();
    this.input.disable();
  }

  /**
   * Bank current stack
   */
  bankStack(): void {
    const player = this.entities.get<PlayerEntity>("player");
    if (!player || !this.gameState.canBank(player.player.stack.length)) return;

    const count = player.player.stack.length;

    // Calculate and add bank bonus
    this.gameState.bankAnimals(count);

    // Clear player stack
    const updatedPlayer = clearStack(player);
    this.entities.replace(updatedPlayer);

    // Effects
    feedback.play("bank");
    this.callbacks.onBankComplete?.(this.gameState.bankedAnimals);
    this.notifyStackChange();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.gameLoop.stop();
    this.input.detach();
    this.cleanupScaleObserver?.();
    feedback.stopMusic();
    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();
  }

  /**
   * Check if game is playing
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Check if game is paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Get stack height
   */
  get stackHeight(): number {
    const player = this.entities.get<PlayerEntity>("player");
    return player?.player.stack.length ?? 0;
  }

  /**
   * Check if can bank
   */
  get canBank(): boolean {
    return this.gameState.canBank(this.stackHeight);
  }

  /**
   * Get the canvas element (for test governor to dispatch events)
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Test API: read-only snapshot of game state for automated play.
   * Returns positions of the player and all falling animals so an
   * external governor can decide where to move.
   */
  getTestSnapshot(): {
    player: { x: number; y: number; width: number; height: number } | null;
    fallingAnimals: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      velocityY: number;
    }>;
    score: number;
    lives: number;
    level: number;
    combo: number;
    stackHeight: number;
    bankedAnimals: number;
    canBank: boolean;
    isPlaying: boolean;
    canvasWidth: number;
    canvasHeight: number;
  } {
    const player = this.entities.get<PlayerEntity>("player");
    const animals = this.entities.getByType<AnimalEntity>("animal");

    return {
      player: player
        ? {
            x: player.transform.position.x,
            y: player.transform.position.y,
            width: player.bounds?.width ?? 0,
            height: player.bounds?.height ?? 0,
          }
        : null,
      fallingAnimals: animals
        .filter((a) => a.animal.state === "falling")
        .map((a) => ({
          id: a.id,
          x: a.transform.position.x + (a.bounds?.width ?? 0) / 2,
          y: a.transform.position.y,
          width: a.bounds?.width ?? 0,
          height: a.bounds?.height ?? 0,
          velocityY: a.velocity?.linear.y ?? 0,
        })),
      score: this.gameState.score,
      lives: this.gameState.lives,
      level: this.gameState.level,
      combo: this.gameState.getState().combo,
      stackHeight: this.stackHeight,
      bankedAnimals: this.gameState.bankedAnimals,
      canBank: this.canBank,
      isPlaying: this._isPlaying,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
    };
  }

  // Private methods

  private notifyStackChange(): void {
    const player = this.entities.get<PlayerEntity>("player");
    const height = player?.player.stack.length ?? 0;
    const canBankNow = this.gameState.canBank(height);
    this.callbacks.onStackChange?.(height, canBankNow);
    this.callbacks.onAbilityChange?.(getAbilityIndicators(player?.player.stack ?? []));
  }

  private createInitialTornadoState(): TornadoState {
    return {
      x: this.canvas.width / 2,
      direction: Math.random() > 0.5 ? 1 : -1,
      rotation: 0,
      intensity: 0.3,
      isSpawning: false,
      spawnCooldown: 0,
    };
  }

  private setupResize(): void {
    this.cleanupScaleObserver = createScaleObserver(this.canvas, (newScale) => {
      this.scale = newScale;
      this.renderCtx.setScale(newScale);
    });
  }

  private handleDragMove(x: number, _y: number, deltaX: number): void {
    if (!this._isPlaying || this._isPaused) return;

    const player = this.entities.get<PlayerEntity>("player");
    if (!player) return;

    // Apply wobble from movement
    const wobbleForce = this.input.getState().smoothedVelocityX * physics.wobbleStrength * 0.8;
    if (Math.abs(wobbleForce) > 0.001) {
      this.wobbleState = applyStackImpulse(
        this.wobbleState,
        Math.sign(wobbleForce),
        Math.abs(wobbleForce) * 0.1
      );
    }
  }

  private handleTap(x: number, y: number): void {
    if (!this._isPlaying || this._isPaused) return;

    const player = this.entities.get<PlayerEntity>("player");
    if (!player || player.player.stack.length === 0) return;

    // Check if a stacked special animal was tapped
    const tappedAnimal = findTappedAbilityAnimal(x, y, player);
    if (!tappedAnimal) return;

    const abilityType = resolveAbilityType(tappedAnimal);
    if (!abilityType) return;

    // Feather float is passive -- cannot be tap-activated
    if (abilityType === "feather_float") return;

    const playerCenterX = getPlayerCenterX(player);
    const stackTopY = getStackTopY(player);
    const groundY = this.canvas.height * layout.floorY;
    const fallingAnimals = this.entities
      .getByType<AnimalEntity>("animal")
      .filter((a) => a.animal.state === "falling");

    const result = activateAbility(this.abilityState, tappedAnimal, abilityType, {
      playerCenterX,
      stackTopY,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      groundY,
      fallingAnimals,
    });

    if (!result.activated) return;

    this.abilityState = result.state;

    // Update the animal in the player stack with its new cooldown
    const updatedStack = player.player.stack.map((a) =>
      a.id === result.animal.id ? result.animal : a
    );
    const updatedPlayer: PlayerEntity = {
      ...player,
      player: { ...player.player, stack: updatedStack },
    };
    this.entities.replace(updatedPlayer);

    // Handle instant effects
    if (result.bonusScore > 0) {
      const player = this.entities.get<PlayerEntity>("player");
      const abilityScoreMultiplier = player?.player.doublePointsActive ? 2 : 1;
      this.gameState.addScore(result.bonusScore * abilityScoreMultiplier, {
        isPerfect: false,
        isGood: false,
        stackBonus: 1,
      });
    }

    // Egg bomb: remove cleared falling animals
    if (abilityType === "egg_bomb") {
      const eggEffect = result.state.activeEffects.find((e) => e.type === "egg_bomb");
      if (eggEffect && eggEffect.type === "egg_bomb") {
        for (const clearedId of eggEffect.clearedAnimalIds) {
          this.entities.remove(clearedId);
        }
      }
    }

    // Audio feedback
    feedback.play("perfect");
  }

  /**
   * Fixed timestep update - physics and game logic
   */
  private fixedUpdate(dt: number): void {
    if (!this._isPlaying || this._isPaused) return;

    const now = performance.now();
    const player = this.entities.get<PlayerEntity>("player");
    if (!player) return;

    // Update play time
    this.gameState.updatePlayTime(dt);

    // Update tornado
    this.tornadoState = updateTornadoState(
      this.tornadoState,
      dt,
      this.canvas.width,
      this.scale.bankWidth
    );
    this.tornadoState.intensity = 0.3 + Math.min(0.7, this.gameState.level * 0.05);

    // Update game director
    this.updateDirector(dt, player);

    // Spawn check
    if (this.gameState.shouldSpawn(now)) {
      this.spawnAnimal();
    }

    // Power-up spawn check
    this.checkPowerUpSpawn(now);

    // Update falling power-ups
    this.updatePowerUps(dt, player);

    // Update ability effects
    const playerCenterX = getPlayerCenterX(player);
    const stackTopY = getStackTopY(player);
    const groundY = this.canvas.height * layout.floorY;
    const fallingAnimals = this.entities
      .getByType<AnimalEntity>("animal")
      .filter((a) => a.animal.state === "falling");

    const abilityResult = updateAbilityEffects(this.abilityState, dt, {
      playerCenterX,
      stackTopY,
      groundY,
      canvasWidth: this.canvas.width,
      fallingAnimals,
    });
    this.abilityState = abilityResult.state;

    // Handle ability side-effects: remove cleared animals (egg bomb)
    for (const clearedId of abilityResult.clearedAnimalIds) {
      this.entities.remove(clearedId);
    }

    // Handle ability side-effects: spawn bushes from poop shot
    for (const pos of abilityResult.bushSpawnPositions) {
      const projectile: ProjectileState = {
        id: `proj_${Date.now()}`,
        x: pos.x,
        y: pos.y,
        width: 10,
        height: 10,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
        scale: 1,
        active: true,
        type: "poop",
        sourceAnimalId: "",
        damage: 0,
        lifetime: 0,
      };
      const bush = createBushFromPoop(projectile, groundY);
      this.bushRuntime = addBushToState(this.bushRuntime, bush);
      this.bushCreationTimes.set(bush.id, performance.now());
    }

    // Update existing bushes (growth, lifetime)
    this.updateBushes(dt);

    // Award ability bonus score
    if (abilityResult.bonusScore > 0) {
      const abilityScoreMultiplier = player.player.doublePointsActive ? 2 : 1;
      this.gameState.addScore(abilityResult.bonusScore * abilityScoreMultiplier, {
        isPerfect: false,
        isGood: false,
        stackBonus: 1,
      });
    }

    // Update falling animals with ability modifiers
    this.updateFallingAnimals(dt, player, abilityResult);

    // Check catches (with honey-trap centering)
    this.checkCatches(player, abilityResult);

    // Update wobble physics
    this.wobbleState = this.updateWobble(
      player.player.stack,
      this.input.getState().smoothedVelocityX,
      dt
    );

    // Update player stress based on wobble intensity
    const stressedPlayer = updateStress(player, this.wobbleState.overallIntensity);

    // Check stack stability (wool shield prevents toppling)
    if (!abilityResult.isShielded) {
      this.checkStackStability(stressedPlayer);
    } else {
      // Still show warning visuals but do not topple
      this.gameState.setDangerState(false);
    }

    // Update combo decay
    this.gameState.updateCombo(now);

    // Update stacked animal ability cooldowns
    const cooldownUpdatedStack = updateStackAbilityCooldowns(stressedPlayer.player.stack, dt);
    const playerWithCooldowns: PlayerEntity = {
      ...stressedPlayer,
      player: { ...stressedPlayer.player, stack: cooldownUpdatedStack },
    };

    // Update player power-up timers
    const updatedPlayer = updatePowerUpTimers(playerWithCooldowns);
    this.entities.replace(updatedPlayer);
  }

  /**
   * Variable timestep update - non-physics
   */
  private update(dt: number, _alpha: number): void {
    if (!this._isPlaying) return;

    const player = this.entities.get<PlayerEntity>("player");
    if (!player) return;

    // Update player position
    const inputState = this.input.getState();
    const minX = this.scale.entityWidth / 2 + 10;
    const maxX = this.canvas.width - this.scale.bankWidth - this.scale.entityWidth / 2 - 10;

    const updatedPlayer = updatePlayerPosition(
      player,
      inputState.pointerX,
      minX,
      maxX,
      dt,
      inputState.isDragging
    );
    this.entities.replace(updatedPlayer);

    // Update renderer effects
    this.renderer.update(dt);

    // Update particles
    this.particleSystem.update(dt);

    // Update input
    this.input.update(dt);

    // Update music intensity
    this.updateMusicIntensity();

    // Flush entity changes
    this.entities.flush();
  }

  /**
   * Render frame
   */
  private render(_alpha: number): void {
    const player = this.entities.get<PlayerEntity>("player");
    const invincible = player ? isInvincible(player) : false;

    // Gather active ability effect visuals
    const effectVisuals = getActiveEffectVisuals(this.abilityState);

    this.renderer.render(
      this.entities,
      this.gameState,
      this.tornadoState,
      invincible,
      this.activeBushes,
      effectVisuals,
      this.particleSystem
    );
  }

  private updateDirector(dt: number, player: PlayerEntity): void {
    const state: DirectorGameState = {
      playerX: getPlayerCenterX(player),
      playerY: player.transform.position.y,
      stackHeight: player.player.stack.length,
      lives: this.gameState.lives,
      maxLives: this.gameState.getState().maxLives,
      score: this.gameState.score,
      combo: this.gameState.getState().combo,
      gameTime: this.gameState.getState().playTime,
      timeSinceLastSpawn: performance.now() - this.gameState.getState().lastSpawnTime,
      timeSinceLastPowerUp: performance.now() - this.gameState.getState().lastPowerUpTime,
      timeSinceLastMiss: this.lastMissTime > 0 ? performance.now() - this.lastMissTime : 10000,
      timeSinceLastPerfect:
        this.lastPerfectTime > 0 ? performance.now() - this.lastPerfectTime : 10000,
      recentCatches: this.recentCatchCount,
      recentMisses: this.recentMissCount,
      recentPerfects: this.recentPerfectCount,
      catchRate:
        this.recentCatchCount + this.recentMissCount > 0
          ? this.recentCatchCount / (this.recentCatchCount + this.recentMissCount)
          : 0.5,
      activeAnimals: this.entities.getCountByType("animal"),
      activePowerUps: this.entities.getCountByType("powerup"),
      screenWidth: this.canvas.width,
      screenHeight: this.canvas.height,
      level: this.gameState.level,
      bankedAnimals: this.gameState.getState().bankedAnimals,
    };

    this.gameDirector.updateGameState(state);
    this.gameDirector.update(dt / 1000);
  }

  private spawnAnimal(): void {
    const decision = this.gameDirector.decideSpawn();
    if (!decision.shouldSpawn) return;

    // Use director's spawn X position (accounts for player modeling), fall back to tornado
    const spawnX = decision.x !== 0 ? decision.x : this.tornadoState.x + (Math.random() - 0.5) * 40;
    const spawnY = -this.scale.entityHeight;

    const animal = createRandomAnimal(spawnX, spawnY, this.gameState.level);
    this.entities.add(animal);

    this.gameState.updateSpawnTime(performance.now());

    // Trigger tornado spawn animation
    this.tornadoState.isSpawning = true;
    const timeout = setTimeout(() => {
      this.tornadoState.isSpawning = false;
      this.pendingTimeouts.delete(timeout);
    }, 300);
    this.pendingTimeouts.add(timeout);
  }

  private updateFallingAnimals(
    dt: number,
    player: PlayerEntity,
    abilityResult?: Awaited<ReturnType<typeof updateAbilityEffects>>
  ): void {
    const animals = this.entities.getByType<AnimalEntity>("animal");
    const playerCenterX = getPlayerCenterX(player);
    const playerY = player.transform.position.y;

    for (const animal of animals) {
      if (animal.animal.state !== "falling") continue;

      // Bleat stun: skip movement for stunned animals
      if (abilityResult?.stunnedAnimalIds.has(animal.id)) {
        continue;
      }

      // Apply gravity
      if (animal.velocity) {
        // Feather float: special ducks fall slower
        const featherMult = getFeatherFloatMultiplier(animal);

        animal.velocity.linear.y += physics.gravity * featherMult * (dt / 16.67);
        animal.velocity.linear.y = Math.min(animal.velocity.linear.y, 12 * featherMult);

        // Mud splash: slow animals in mud zones
        if (abilityResult?.mudZones && abilityResult.mudZones.length > 0) {
          const mudFactor = getMudSlowFactor(
            animal.transform.position.x,
            animal.transform.position.y,
            animal.bounds?.width ?? 50,
            animal.bounds?.height ?? 50,
            abilityResult.mudZones
          );
          if (mudFactor < 1.0) {
            animal.velocity.linear.y *= mudFactor;
          }
        }

        // Apply magnet effect (power-up)
        if (player.player.magnetActive) {
          const dx = playerCenterX - animal.transform.position.x;
          animal.velocity.linear.x += dx * 0.001;
        }

        // Crow call: magnetic pull toward farmer
        if (
          abilityResult?.magneticPullTargetX !== null &&
          abilityResult?.magneticPullTargetX !== undefined
        ) {
          const dx = abilityResult.magneticPullTargetX - animal.transform.position.x;
          animal.velocity.linear.x += dx * abilityResult.magneticPullStrength * (dt / 16.67);
        }

        // Update position
        animal.transform.position.x += animal.velocity.linear.x * (dt / 16.67);
        animal.transform.position.y += animal.velocity.linear.y * (dt / 16.67);

        // Hay storm: bounce off hay platforms
        if (abilityResult?.hayPlatforms && abilityResult.hayPlatforms.length > 0) {
          const hayBounce = checkHayPlatformBounce(
            animal.transform.position.x,
            animal.transform.position.y,
            animal.bounds?.width ?? 50,
            animal.bounds?.height ?? 50,
            animal.velocity.linear.y,
            abilityResult.hayPlatforms
          );
          if (hayBounce.bounced) {
            animal.velocity.linear.y = hayBounce.bounceVelocityY;
            animal.velocity.linear.x += hayBounce.bounceVelocityX;
          }
        }

        // Bush bounce: animals bounce off growing bushes
        const activeBushes = getActiveBushes(this.bushRuntime);
        if (activeBushes.length > 0 && animal.velocity) {
          const animalCX = animal.transform.position.x + (animal.bounds?.width ?? 50) / 2;
          const animalCY = animal.transform.position.y + (animal.bounds?.height ?? 50) / 2;
          const nearby = findNearbyBushes(activeBushes, animalCX, animalCY, 50);
          if (nearby.length > 0 && animal.velocity.linear.y > 0) {
            const bush = nearby[0];
            if (bush.growthStage > 0.3) {
              // Bounce the animal
              animal.velocity.linear.y = -Math.abs(animal.velocity.linear.y) * bush.bounceStrength;
              animal.velocity.linear.x += (Math.random() - 0.5) * 2;
              // Wear down the bush
              this.bushRuntime.bushes.set(bush.id, applyBushBounce(bush));
              this.bushRuntime.totalBounces++;
              feedback.play("land");
            }
          }
        }
      }

      // Check if missed (fell past player)
      const animalBottom = animal.transform.position.y + (animal.bounds?.height ?? 50);
      if (animalBottom > playerY + (player.bounds?.height ?? 100) + 20) {
        this.entities.remove(animal);
        this.handleMiss();
      }
    }
  }

  private checkCatches(
    player: PlayerEntity,
    abilityResult?: Awaited<ReturnType<typeof updateAbilityEffects>>
  ): void {
    const animals = this.entities.getByType<AnimalEntity>("animal");
    const playerCenterX = getPlayerCenterX(player);
    const stackTopY = getStackTopY(player);
    const catchWidth = (player.bounds?.width ?? 80) * 0.6;

    for (const animal of animals) {
      if (animal.animal.state !== "falling") continue;

      const animalCenterX = animal.transform.position.x + (animal.bounds?.width ?? 50) / 2;
      const animalY = animal.transform.position.y + (animal.bounds?.height ?? 50);

      // Check if in catch zone
      const dx = animalCenterX - playerCenterX;
      const dy = animalY - stackTopY;

      if (Math.abs(dx) < catchWidth && dy > -10 && dy < 30) {
        // Honey trap: reduce the horizontal offset so animal lands more centered
        let adjustedRelativeX = dx / catchWidth;
        if (abilityResult && abilityResult.honeyTrapCenteringFactor > 0) {
          adjustedRelativeX *= 1 - abilityResult.honeyTrapCenteringFactor;
        }

        // Catch the animal
        const caughtAnimal = catchAnimal(animal, player.player.stack.length, adjustedRelativeX * 5);

        // Add to player stack
        const updatedPlayer = addToStack(player, caughtAnimal);
        this.entities.replace(updatedPlayer);

        // Remove from falling
        this.entities.remove(animal);

        // Score
        const isPerfect = Math.abs(adjustedRelativeX) < 0.2;
        const isGood = Math.abs(adjustedRelativeX) < 0.5;

        const baseScore = animal.animal.pointValue;
        const scoreMultiplier = updatedPlayer.player.doublePointsActive ? 2 : 1;
        this.gameState.addScore(baseScore * scoreMultiplier, {
          isPerfect,
          isGood,
          stackBonus: 1.1 ** (updatedPlayer.player.stack.length - 1),
        });

        // Track catch metrics for GameDirector
        this.recentCatchCount++;
        if (isPerfect) {
          this.lastPerfectTime = performance.now();
          this.recentPerfectCount++;
        }

        // Effects
        if (isPerfect) {
          this.callbacks.onPerfectCatch?.(animal.transform.position.x, animal.transform.position.y);
          feedback.play("perfect");
          // Perfect catch particles
          this.particleSystem.emit(
            "perfect",
            animal.transform.position.x + (animal.bounds?.width ?? 50) / 2,
            animal.transform.position.y + (animal.bounds?.height ?? 50) / 2
          );
        } else if (isGood) {
          this.callbacks.onGoodCatch?.(animal.transform.position.x, animal.transform.position.y);
        }

        // Small confetti burst for every catch
        this.particleSystem.emit(
          "coinCollect",
          animal.transform.position.x + (animal.bounds?.width ?? 50) / 2,
          animal.transform.position.y + (animal.bounds?.height ?? 50) / 2,
          { count: 6 }
        );

        feedback.play("land");

        // Apply catch wobble (reduced by honey trap)
        const wobbleImpulse =
          abilityResult && abilityResult.wobbleReduction < 1.0
            ? (0.2 + (animal.animal.weight - 1) * 0.1) * abilityResult.wobbleReduction
            : 0.2 + (animal.animal.weight - 1) * 0.1;

        this.wobbleState = applyStackImpulse(this.wobbleState, adjustedRelativeX, wobbleImpulse);

        // Consume a honey-trap catch
        if (abilityResult && abilityResult.honeyTrapCenteringFactor > 0) {
          this.abilityState = consumeHoneyTrapCatch(this.abilityState);
        }

        // Notify UI
        this.notifyStackChange();
      }
    }
  }

  /**
   * Update wobble state for the stack
   */
  private updateWobble(
    stack: AnimalEntity[],
    playerVelocity: number,
    dt: number
  ): StackWobbleState {
    const config = DEFAULT_WOBBLE_CONFIG;

    // Update each animal's wobble
    const newAnimals = new Map<string, AnimalWobbleState>();
    let maxWobble = 0;

    for (let i = 0; i < stack.length; i++) {
      const animal = stack[i];
      let wobbleState = this.wobbleState.animals.get(animal.id);

      if (!wobbleState) {
        wobbleState = {
          angle: 0,
          velocity: 0,
          phase: Math.random() * Math.PI * 2,
          accumulated: 0,
        };
      }

      // Movement-induced wobble
      const movementWobble = Math.abs(playerVelocity) * config.movementWobbleScale;
      const heightFactor = 1 + i * config.heightMultiplier;
      const weight = getAnimalWeight(animal.animal.animalType);

      // Spring physics
      const springForce = -wobbleState.angle * 5;
      const newVelocity =
        (wobbleState.velocity + springForce * (dt / 1000) + movementWobble * heightFactor) *
        config.dampingFactor;
      const newAngle = wobbleState.angle + newVelocity * (dt / 1000);

      newAnimals.set(animal.id, {
        angle: newAngle,
        velocity: newVelocity,
        phase: wobbleState.phase,
        accumulated: Math.max(
          0,
          wobbleState.accumulated + Math.abs(newAngle) - config.naturalDecay * (dt / 1000)
        ),
      });

      maxWobble = Math.max(maxWobble, Math.abs(newAngle));

      // Apply wobble to animal
      animal.animal.wobbleAngle = newAngle;
    }

    return {
      animals: newAnimals,
      overallIntensity: maxWobble / config.collapseThreshold,
      isWarning: maxWobble >= config.warningThreshold,
      isCollapsing: maxWobble >= config.collapseThreshold,
      lastPlayerVelocity: playerVelocity,
      lastPlayerAcceleration: 0,
    };
  }

  private handleMiss(): void {
    this.lastMissTime = performance.now();
    this.recentMissCount++;

    const stillAlive = this.gameState.loseLife();
    this.callbacks.onMiss?.();
    feedback.play("miss");

    if (stillAlive) {
      const player = this.entities.get<PlayerEntity>("player");
      if (player) {
        const invinciblePlayer = setInvincible(player, livesConfig.invincibilityDuration);
        this.entities.replace(invinciblePlayer);
      }
      this.renderer.shake(0.5);
    }
  }

  private checkStackStability(player: PlayerEntity): void {
    if (this.wobbleState.isCollapsing && player.player.stack.length > 0) {
      // Stack toppled!
      this.triggerTopple(player);
    } else {
      this.gameState.setDangerState(this.wobbleState.isWarning);

      if (this.wobbleState.isWarning) {
        this.renderer.shake(0.3 * this.wobbleState.overallIntensity);
      }
    }
  }

  private triggerTopple(player: PlayerEntity): void {
    this.callbacks.onStackTopple?.();
    feedback.play("topple");

    // Clear stack
    const updatedPlayer = clearStack(player);
    this.entities.replace(updatedPlayer);

    // Lose life
    const stillAlive = this.gameState.loseLife();

    if (stillAlive) {
      const invinciblePlayer = setInvincible(updatedPlayer, livesConfig.invincibilityDuration);
      this.entities.replace(invinciblePlayer);
      this.renderer.shake(1);
    }

    this.notifyStackChange();
  }

  private updateBushes(dt: number): void {
    const now = performance.now();
    const activeBushes = getActiveBushes(this.bushRuntime);

    // Update growth
    const updated = updateAllBushes(activeBushes, dt);
    for (const bush of updated) {
      this.bushRuntime.bushes.set(bush.id, bush);
    }

    // Remove expired bushes
    for (const bush of activeBushes) {
      const creationTime = this.bushCreationTimes.get(bush.id) ?? now;
      if (shouldRemoveBush(bush, creationTime, now)) {
        this.bushRuntime = removeBushFromState(this.bushRuntime, bush.id);
        this.bushCreationTimes.delete(bush.id);
      }
    }
  }

  /**
   * Get active bushes for rendering
   */
  get activeBushes() {
    return getActiveBushes(this.bushRuntime);
  }

  private checkPowerUpSpawn(now: number): void {
    const { powerUps: powerUpConfig } = GAME_CONFIG;

    // Don't spawn before minimum level
    if (this.gameState.level < powerUpConfig.minLevelToSpawn) return;

    // Check spawn interval
    const timeSinceLastPowerUp = now - this.gameState.getState().lastPowerUpTime;
    if (timeSinceLastPowerUp < powerUpConfig.spawnInterval) return;

    // Ask director if we should spawn
    const decision = this.gameDirector.decidePowerUp();
    if (!decision.shouldSpawn) return;

    // Spawn from tornado or decision position
    const spawnX = decision.x || this.tornadoState.x + (Math.random() - 0.5) * 60;
    const spawnY = -50;

    const powerUp = createPowerUp(spawnX, spawnY, decision.type);
    this.entities.add(powerUp);

    this.gameState.updatePowerUpTime(now);
  }

  private updatePowerUps(dt: number, player: PlayerEntity): void {
    const powerUps = this.entities.getByType<PowerUpEntity>("powerup");
    const playerCenterX = getPlayerCenterX(player);
    const playerY = player.transform.position.y;
    const { collectRadius } = GAME_CONFIG.powerUps;

    for (const powerUp of powerUps) {
      // Apply gravity (slower than animals)
      if (powerUp.velocity) {
        powerUp.transform.position.y += powerUp.velocity.linear.y * (dt / 16.67);
      }

      // Update bob animation
      const updated = updatePowerUpBob(powerUp, dt);
      this.entities.replace(updated);

      // Check collection (overlap with player/stack)
      const puCenterX = powerUp.transform.position.x + (powerUp.bounds?.width ?? 40) / 2;
      const puCenterY = powerUp.transform.position.y + (powerUp.bounds?.height ?? 40) / 2;
      const dx = puCenterX - playerCenterX;
      const dy = puCenterY - playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < collectRadius + (player.bounds?.width ?? 80) / 2) {
        this.entities.remove(powerUp);
        this.applyPowerUp(powerUp.powerup.powerUpType, player);
        continue;
      }

      // Check if missed (fell off screen)
      if (powerUp.transform.position.y > this.canvas.height + 50) {
        this.entities.remove(powerUp);
      }
    }
  }

  private applyPowerUp(type: PowerUpType, player: PlayerEntity): void {
    feedback.play("perfect");

    // Emit sparkle burst at player position for power-up collection
    const playerCX = getPlayerCenterX(player);
    const playerY = player.transform.position.y;
    this.particleSystem.emit("powerUp", playerCX, playerY);

    switch (type) {
      case "hay_bale": {
        // Restore one life
        this.gameState.addLife();
        this.callbacks.onLifeEarned?.();
        break;
      }
      case "golden_egg": {
        // Double points
        const goldenDuration = POWER_UPS.golden_egg.duration ?? 8000;
        const dpPlayer = activateDoublePoints(player, goldenDuration);
        this.entities.replace(dpPlayer);
        break;
      }
      case "water_trough": {
        // Magnetic pull
        const magnetDuration = POWER_UPS.water_trough.duration ?? 5000;
        const magPlayer = activateMagnet(player, magnetDuration);
        this.entities.replace(magPlayer);
        break;
      }
      case "salt_lick": {
        // Full restore + invincibility
        this.gameState.fullRestore();
        const invDuration = POWER_UPS.salt_lick.invincibilityDuration ?? 3000;
        const invPlayer = setInvincible(player, invDuration);
        this.entities.replace(invPlayer);
        break;
      }
      case "corn_feed": {
        // Merge stack into bank (only if enough stacked)
        const minStack = POWER_UPS.corn_feed.minStackToUse ?? 3;
        if (player.player.stack.length >= minStack) {
          this.bankStack();
        }
        break;
      }
      case "lucky_horseshoe": {
        // Increase max hearts
        this.gameState.increaseMaxLives();
        break;
      }
    }
  }

  private updateMusicIntensity(): void {
    const state = this.gameState.getState();
    const player = this.entities.get<PlayerEntity>("player");
    const stackHeight = player?.player.stack.length ?? 0;

    const stackFactor = Math.min(1, stackHeight / 10);
    const levelFactor = Math.min(1, state.level / 10);
    const dangerFactor = state.inDangerState ? 0.3 : 0;
    const comboFactor = Math.min(0.2, state.combo / 20);

    const intensity = Math.min(
      1,
      stackFactor * 0.4 + levelFactor * 0.3 + dangerFactor + comboFactor
    );
    feedback.setIntensity(intensity);
  }
}

/**
 * Create a new game instance
 */
export function createGame(
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks = {},
  config: GameConfig = {}
): Game {
  return new Game(canvas, callbacks, config);
}
