/**
 * Renderer - Main rendering orchestrator
 * 
 * Delegates to specific renderers for different entity types
 */

import { RenderContext } from './RenderContext';
import { EntityManager } from '../managers/EntityManager';
import { GameStateManager } from '../managers/GameStateManager';
import type { ScaleFactors } from '../core/ResponsiveScale';
import type { PlayerEntity } from '../entities/Player';
import type { AnimalEntity } from '../entities/Animal';
import type { PowerUpEntity } from '../entities/PowerUp';
import { getPowerUpBobOffset } from '../entities/PowerUp';

// Import actual renderer functions
import { drawBackground } from '../../renderer/background';
import { drawAnimal } from '../../renderer/animals';
import { drawFarmerBase } from '../../renderer/farmer';
import { drawTornado, drawTornadoRail, type TornadoState } from '../../renderer/tornado';
import { drawBush } from '../../renderer/bush';
import { GAME_CONFIG } from '../../config';
import type { BushState } from '../state/GameState';
import { createAnimalArchetype } from '../../ecs/archetypes';

const { layout } = GAME_CONFIG;

export interface RendererConfig {
  showDebug: boolean;
  showHitboxes: boolean;
}

const DEFAULT_CONFIG: RendererConfig = {
  showDebug: false,
  showHitboxes: false,
};

export class Renderer {
  private renderCtx: RenderContext;
  private config: RendererConfig;
  private bgRotation = 0;

  constructor(renderCtx: RenderContext, config: Partial<RendererConfig> = {}) {
    this.renderCtx = renderCtx;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main render function - call each frame
   */
  render(
    entities: EntityManager,
    state: GameStateManager,
    tornado: TornadoState,
    isInvincible: boolean,
    bushes: BushState[] = []
  ): void {
    const { ctx, width, height, scale } = this.renderCtx;

    // Begin frame
    this.renderCtx.beginFrame();

    // Update background rotation
    this.bgRotation += 0.001 + state.level * 0.0001;

    // Draw layers in order
    this.drawBackground();
    this.drawBankZone(state);
    this.drawFloorZone();
    this.drawBushes(bushes);
    this.drawTornado(tornado);
    this.drawEntities(entities, state, isInvincible);
    this.drawPowerUps(entities);
    this.drawDangerOverlay(state);
    
    // Debug overlay
    if (this.config.showDebug) {
      this.drawDebug(entities, state);
    }
    
    // End frame
    this.renderCtx.endFrame();
  }

  /**
   * Update render effects
   */
  update(dt: number): void {
    this.renderCtx.updateEffects(dt);
  }

  /**
   * Trigger screen shake
   */
  shake(intensity: number): void {
    this.renderCtx.shake(intensity);
  }

  /**
   * Trigger screen flash
   */
  flash(color: string): void {
    this.renderCtx.flash(color);
  }

  // Private rendering methods

  private drawBackground(): void {
    const { ctx, width, height } = this.renderCtx;
    drawBackground(ctx, width, height, this.bgRotation);
  }

  private drawBankZone(state: GameStateManager): void {
    const { ctx, width, height, scale } = this.renderCtx;
    const gameState = state.getState();
    
    // Bank zone background
    ctx.fillStyle = 'rgba(233, 30, 99, 0.12)';
    ctx.fillRect(width - scale.bankWidth, 0, scale.bankWidth, height);
    
    // Bank zone border
    ctx.strokeStyle = 'rgba(233, 30, 99, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - scale.bankWidth, 0);
    ctx.lineTo(width - scale.bankWidth, height);
    ctx.stroke();
    
    // Banked count
    if (gameState.bankedAnimals > 0) {
      ctx.fillStyle = '#FFF';
      const fontSize = Math.max(18, Math.min(28, scale.bankWidth * 0.45));
      ctx.font = `bold ${fontSize}px 'Fredoka One', cursive`;
      ctx.textAlign = 'center';
      ctx.fillText(String(gameState.bankedAnimals), width - scale.bankWidth / 2, height / 2);
      ctx.font = `${fontSize * 0.4}px 'Fredoka One', cursive`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('SAFE', width - scale.bankWidth / 2, height / 2 + fontSize * 0.65);
    }
  }

  private drawFloorZone(): void {
    const { ctx, width, height, scale } = this.renderCtx;
    const floorY = height * layout.floorY;
    
    ctx.strokeStyle = 'rgba(255, 193, 7, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.beginPath();
    ctx.moveTo(0, floorY + scale.entityHeight / 2);
    ctx.lineTo(width - scale.bankWidth, floorY + scale.entityHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    ctx.fillStyle = 'rgba(255, 193, 7, 0.05)';
    ctx.fillRect(0, floorY + scale.entityHeight / 2, width - scale.bankWidth, height);
  }

  private drawBushes(bushes: BushState[]): void {
    const { ctx } = this.renderCtx;

    for (const bush of bushes) {
      if (!bush.active) continue;

      const currentHeight = bush.height * bush.scale;
      drawBush(ctx, bush.x + bush.width / 2, bush.y, {
        width: bush.width,
        height: currentHeight,
        maxHeight: bush.height,
        growth: bush.growthStage,
        bouncePhase: bush.rotation,
        age: 0,
      });
    }
  }

  private drawTornado(tornado: TornadoState): void {
    const { ctx, width, height, scale } = this.renderCtx;
    const { tornado: tornadoConfig } = GAME_CONFIG;
    const railY = height * layout.tornadoRailY;
    
    drawTornadoRail(ctx, width - scale.bankWidth, railY, tornado.x);
    drawTornado(ctx, tornado.x, railY + 30, {
      width: tornadoConfig.width,
      height: tornadoConfig.height,
      rotation: tornado.rotation,
      intensity: tornado.intensity,
      isSpawning: tornado.isSpawning,
      direction: tornado.direction,
    });
  }

  private drawEntities(
    entities: EntityManager,
    state: GameStateManager,
    isInvincible: boolean
  ): void {
    const { ctx, scale } = this.renderCtx;
    const gameState = state.getState();
    
    // Get player
    const player = entities.get<PlayerEntity>('player');
    
    // Draw player (farmer)
    if (player) {
      this.renderCtx.withInvincibilityFlicker(isInvincible, () => {
        const { position } = player.transform;
        
        drawFarmerBase(
          ctx,
          position.x + (player.bounds?.width ?? 80) / 2,
          position.y + (player.bounds?.height ?? 100),
          player.bounds?.width ?? 80,
          player.bounds?.height ?? 100,
          player.player.wobbleOffset
        );
        
        // Draw stacked animals
        for (const animal of player.player.stack) {
          this.drawAnimal(animal, gameState.inDangerState ? 0.5 : 0);
        }
      });
    }
    
    // Draw falling animals
    const fallingAnimals = entities.getByType<AnimalEntity>('animal');
    for (const animal of fallingAnimals) {
      if (animal.animal.state === 'falling') {
        this.drawAnimal(animal, 0);
      }
    }
    
    // Draw hitboxes in debug mode
    if (this.config.showHitboxes) {
      this.drawHitboxes(entities);
    }
  }

  private drawAnimal(animal: AnimalEntity, stress: number): void {
    const { ctx } = this.renderCtx;
    const { position, rotation } = animal.transform;
    const { animalType, variant, wobbleAngle, abilityReady } = animal.animal;
    
    // Get archetype for rendering (from ECS archetypes)
    const isSpecial = variant !== 'white' && variant !== 'common' && variant !== 'normal';
    const archetype = createAnimalArchetype(animalType as any, isSpecial);
    if (!archetype) return;
    
    ctx.save();
    ctx.translate(
      position.x + (animal.bounds?.width ?? 50) / 2,
      position.y + (animal.bounds?.height ?? 50) / 2
    );
    ctx.rotate(rotation + wobbleAngle);
    
    drawAnimal(
      ctx,
      0, // x offset (already translated)
      0, // y offset (already translated)
      animal.bounds?.width ?? 50,
      animal.bounds?.height ?? 50,
      archetype,
      stress,
      stress > 0.5,
      stress > 0.8,
      abilityReady
    );
    
    ctx.restore();
  }

  private drawPowerUps(entities: EntityManager): void {
    const { ctx } = this.renderCtx;
    const powerUps = entities.getByType<PowerUpEntity>('powerup');

    for (const powerUp of powerUps) {
      const { position } = powerUp.transform;
      const size = powerUp.bounds?.width ?? 40;
      const cx = position.x + size / 2;
      const cy = position.y + size / 2 + getPowerUpBobOffset(powerUp);
      const { glowColor, name } = powerUp.powerup;

      ctx.save();

      // Glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;

      // Outer circle
      ctx.fillStyle = glowColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2 + 4, 0, Math.PI * 2);
      ctx.fill();

      // Inner circle
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // White highlight
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(cx - size * 0.15, cy - size * 0.15, size * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Icon text (first letter of name)
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFF';
      ctx.font = `bold ${size * 0.5}px 'Fredoka One', cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = this.getPowerUpIcon(powerUp.powerup.powerUpType);
      ctx.fillText(icon, cx, cy);

      ctx.restore();
    }
  }

  private getPowerUpIcon(type: string): string {
    switch (type) {
      case 'hay_bale': return '+';
      case 'golden_egg': return '2x';
      case 'water_trough': return 'M';
      case 'salt_lick': return 'F';
      case 'corn_feed': return 'B';
      case 'lucky_horseshoe': return 'U';
      default: return '?';
    }
  }

  private drawDangerOverlay(state: GameStateManager): void {
    const gameState = state.getState();
    if (!gameState.inDangerState) return;
    
    const { ctx, width, height } = this.renderCtx;
    
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.3,
      width / 2, height / 2, height * 0.8
    );
    gradient.addColorStop(0, 'rgba(244, 67, 54, 0)');
    gradient.addColorStop(1, `rgba(244, 67, 54, ${0.15 + Math.sin(Date.now() / 100) * 0.05})`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  private drawDebug(entities: EntityManager, state: GameStateManager): void {
    const gameState = state.getState();
    
    this.renderCtx.drawDebugInfo({
      FPS: Math.round(1000 / 16.67), // Placeholder
      Entities: entities.count,
      Score: gameState.score,
      Level: gameState.level,
      Lives: gameState.lives,
      Combo: gameState.combo,
    });
  }

  private drawHitboxes(entities: EntityManager): void {
    const { ctx } = this.renderCtx;
    
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    for (const entity of entities.getAll()) {
      if (entity.bounds) {
        const { position } = entity.transform;
        ctx.strokeRect(
          position.x,
          position.y,
          entity.bounds.width,
          entity.bounds.height
        );
      }
    }
  }
}
