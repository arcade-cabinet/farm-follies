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
import type { ActiveEffectVisual } from '../systems/AbilitySystem';
import type { ParticleSystem } from '../../effects/ParticleEffects';

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
    bushes: BushState[] = [],
    effectVisuals: ActiveEffectVisual[] = [],
    particles: ParticleSystem | null = null,
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
    this.drawAbilityEffects(effectVisuals);
    if (particles) {
      particles.render(ctx);
    }
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

  /**
   * Draw ability effect visuals on the canvas
   */
  private drawAbilityEffects(effects: ActiveEffectVisual[]): void {
    if (effects.length === 0) return;

    const { ctx } = this.renderCtx;

    for (const effect of effects) {
      ctx.save();
      const alpha = Math.max(0.1, effect.progress);

      switch (effect.type) {
        case "poop_shot":
          this.drawPoopShot(ctx, effect, alpha);
          break;
        case "egg_bomb":
          this.drawEggBomb(ctx, effect, alpha);
          break;
        case "mud_splash":
          this.drawMudSplash(ctx, effect, alpha);
          break;
        case "wool_shield":
          this.drawWoolShield(ctx, effect, alpha);
          break;
        case "bleat_stun":
          this.drawBleatStun(ctx, effect, alpha);
          break;
        case "honey_trap":
          this.drawHoneyTrap(ctx, effect, alpha);
          break;
        case "crow_call":
          this.drawCrowCall(ctx, effect, alpha);
          break;
        case "hay_platform":
          this.drawHayPlatform(ctx, effect, alpha);
          break;
      }

      ctx.restore();
    }
  }

  private drawPoopShot(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width: size } = effect;

    // Brown projectile with arc trail
    ctx.globalAlpha = alpha;

    // Trail
    ctx.strokeStyle = "rgba(101, 67, 33, 0.3)";
    ctx.lineWidth = size * 0.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - size * 1.5, y + size);
    ctx.quadraticCurveTo(x - size * 0.5, y - size * 0.5, x, y);
    ctx.stroke();

    // Projectile body
    ctx.fillStyle = "#654321";
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = "rgba(139, 90, 43, 0.8)";
    ctx.beginPath();
    ctx.arc(x - size * 0.15, y - size * 0.15, size * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawEggBomb(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width: diameter } = effect;
    const radius = diameter / 2;
    const expandProgress = 1 - effect.progress;

    ctx.globalAlpha = alpha * 0.7;

    // Explosion ring
    const currentRadius = radius * (0.3 + expandProgress * 0.7);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius);
    gradient.addColorStop(0, "rgba(255, 235, 59, 0.8)");
    gradient.addColorStop(0.5, "rgba(255, 193, 7, 0.5)");
    gradient.addColorStop(1, "rgba(255, 152, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Shell fragments
    ctx.fillStyle = "#FFF8E1";
    const fragmentCount = 6;
    for (let i = 0; i < fragmentCount; i++) {
      const angle = (i / fragmentCount) * Math.PI * 2 + expandProgress * 2;
      const dist = currentRadius * 0.5 * expandProgress;
      const fx = x + Math.cos(angle) * dist;
      const fy = y + Math.sin(angle) * dist;
      const fragSize = 4 + Math.sin(angle * 3) * 2;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(angle + expandProgress * 3);
      ctx.fillRect(-fragSize / 2, -fragSize / 4, fragSize, fragSize / 2);
      ctx.restore();
    }
  }

  private drawMudSplash(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width, height } = effect;

    ctx.globalAlpha = alpha * 0.5;

    // Expanding mud zone
    const expandFactor = Math.min(1, (1 - effect.progress) * 3 + 0.3);
    const currentW = width * expandFactor;
    const currentH = height * expandFactor;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Muddy gradient
    const gradient = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, Math.max(currentW, currentH) / 2,
    );
    gradient.addColorStop(0, "rgba(101, 67, 33, 0.6)");
    gradient.addColorStop(0.6, "rgba(139, 90, 43, 0.3)");
    gradient.addColorStop(1, "rgba(139, 90, 43, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, currentW / 2, currentH / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Splatter droplets
    ctx.fillStyle = "rgba(101, 67, 33, 0.4)";
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const dist = (currentW / 2) * 0.8;
      const dx = cx + Math.cos(angle) * dist;
      const dy = cy + Math.sin(angle) * dist * 0.5;
      ctx.beginPath();
      ctx.arc(dx, dy, 3 + Math.sin(angle * 2) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawWoolShield(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    // Wool shield draws around the player; use center of canvas playable area
    const { width: canvasW, height: canvasH } = this.renderCtx;
    const cx = canvasW / 2;
    const floorY = canvasH * layout.floorY;

    ctx.globalAlpha = alpha * 0.35;

    // Fluffy cloud-like shield
    const shieldRadius = 60 + Math.sin(Date.now() / 200) * 5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 3;

    // Draw overlapping circles for fluffy look
    const puffs = 8;
    for (let i = 0; i < puffs; i++) {
      const angle = (i / puffs) * Math.PI * 2 + Date.now() / 2000;
      const puffX = cx + Math.cos(angle) * shieldRadius * 0.7;
      const puffY = floorY - 30 + Math.sin(angle) * shieldRadius * 0.4;
      const puffSize = 20 + Math.sin(angle * 2 + Date.now() / 300) * 5;
      ctx.beginPath();
      ctx.arc(puffX, puffY, puffSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawBleatStun(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width: diameter } = effect;
    const radius = diameter / 2;
    const expandProgress = 1 - effect.progress;

    ctx.globalAlpha = alpha * 0.4;

    // Sound wave rings expanding outward
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringProgress = (expandProgress + i / ringCount) % 1;
      const ringRadius = radius * ringProgress;
      const ringAlpha = 1 - ringProgress;

      ctx.strokeStyle = `rgba(156, 39, 176, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 3 - ringProgress * 2;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center pulse
    ctx.fillStyle = "rgba(156, 39, 176, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, 15 * (1 - expandProgress * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  private drawHoneyTrap(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width, height } = effect;
    const catchesRemaining = (effect.extra?.catchesRemaining as number) ?? 0;

    ctx.globalAlpha = alpha * 0.6;

    // Golden sticky puddle
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, width / 2);
    gradient.addColorStop(0, "rgba(255, 193, 7, 0.7)");
    gradient.addColorStop(0.7, "rgba(255, 152, 0, 0.4)");
    gradient.addColorStop(1, "rgba(255, 152, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sticky drip lines
    ctx.strokeStyle = "rgba(255, 193, 7, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Date.now() / 1000;
      const sx = x + Math.cos(angle) * (width / 3);
      const sy = y + Math.sin(angle) * (height / 3);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(angle) * 8, sy + Math.sin(angle) * 8);
      ctx.stroke();
    }

    // Remaining catches indicator
    if (catchesRemaining > 0) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 10px 'Fredoka One', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(catchesRemaining), x, y);
    }
  }

  private drawCrowCall(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x } = effect;
    const { height: canvasH } = this.renderCtx;

    ctx.globalAlpha = alpha * 0.5;

    // Dark bird silhouettes swooping
    const birdCount = 3;
    const time = Date.now() / 1000;
    ctx.fillStyle = "rgba(33, 33, 33, 0.7)";

    for (let i = 0; i < birdCount; i++) {
      const phase = time * 2 + (i / birdCount) * Math.PI * 2;
      const birdX = x + Math.sin(phase) * 80;
      const birdY = canvasH * 0.2 + Math.cos(phase * 0.7 + i) * 60 + i * 40;
      const wingSpan = 15;

      ctx.save();
      ctx.translate(birdX, birdY);
      ctx.rotate(Math.sin(phase) * 0.3);

      // Bird body
      ctx.beginPath();
      // Left wing
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-wingSpan * 0.5, -wingSpan * 0.5, -wingSpan, -Math.sin(phase * 3) * 5);
      // Right wing
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(wingSpan * 0.5, -wingSpan * 0.5, wingSpan, -Math.sin(phase * 3) * 5);
      ctx.strokeStyle = "rgba(33, 33, 33, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();
    }

    // Magnetic pull indicator line
    ctx.strokeStyle = "rgba(33, 33, 33, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawHayPlatform(
    ctx: CanvasRenderingContext2D,
    effect: ActiveEffectVisual,
    alpha: number,
  ): void {
    const { x, y, width, height } = effect;

    ctx.globalAlpha = alpha * 0.8;

    // Hay bale platform body
    ctx.fillStyle = "#D4A017";
    ctx.strokeStyle = "#B8860B";
    ctx.lineWidth = 1.5;

    // Rounded rectangle shape
    const r = height / 3;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hay straw lines
    ctx.strokeStyle = "rgba(139, 90, 43, 0.5)";
    ctx.lineWidth = 1;
    const straws = 4;
    for (let i = 0; i < straws; i++) {
      const sx = x + (width / (straws + 1)) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(sx, y + 2);
      ctx.lineTo(sx + (Math.sin(i * 1.5) * 3), y + height - 2);
      ctx.stroke();
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
