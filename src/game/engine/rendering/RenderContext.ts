/**
 * RenderContext - Wrapper around canvas context with game-specific utilities
 */

import type { ScaleFactors } from "../core/ResponsiveScale";

export interface RenderState {
  screenShake: number;
  flashColor: string | null;
  flashAlpha: number;
}

export class RenderContext {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  private _scale: ScaleFactors;
  private state: RenderState = {
    screenShake: 0,
    flashColor: null,
    flashAlpha: 0,
  };

  constructor(canvas: HTMLCanvasElement, scale: ScaleFactors) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Failed to get canvas context");
    this.ctx = ctx;
    this._scale = scale;
  }

  /**
   * Get current scale factors
   */
  get scale(): ScaleFactors {
    return this._scale;
  }

  /**
   * Update scale factors
   */
  setScale(scale: ScaleFactors): void {
    this._scale = scale;
    this.canvas.width = scale.screenWidth;
    this.canvas.height = scale.screenHeight;
  }

  /**
   * Get canvas dimensions
   */
  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  /**
   * Get playable area width (excluding bank)
   */
  get playableWidth(): number {
    return this.canvas.width - this._scale.bankWidth;
  }

  /**
   * Begin frame - clear and apply effects
   */
  beginFrame(): void {
    this.ctx.save();

    // Apply screen shake
    if (this.state.screenShake > 0.01) {
      const shakeX = (Math.random() - 0.5) * this.state.screenShake * 20;
      const shakeY = (Math.random() - 0.5) * this.state.screenShake * 20;
      this.ctx.translate(shakeX, shakeY);
    }

    // Clear with slight oversize for shake
    this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);
  }

  /**
   * End frame - apply post-effects
   */
  endFrame(): void {
    // Apply flash effect
    if (this.state.flashColor && this.state.flashAlpha > 0) {
      this.ctx.fillStyle = this.state.flashColor;
      this.ctx.globalAlpha = this.state.flashAlpha;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.globalAlpha = 1;
    }

    this.ctx.restore();
  }

  /**
   * Update effects (call each frame)
   */
  updateEffects(dt: number): void {
    // Decay screen shake
    this.state.screenShake *= 0.9;
    if (this.state.screenShake < 0.01) {
      this.state.screenShake = 0;
    }

    // Decay flash
    if (this.state.flashAlpha > 0) {
      this.state.flashAlpha -= dt / 200;
      if (this.state.flashAlpha < 0) {
        this.state.flashAlpha = 0;
        this.state.flashColor = null;
      }
    }
  }

  /**
   * Trigger screen shake
   */
  shake(intensity: number): void {
    this.state.screenShake = Math.max(this.state.screenShake, intensity);
  }

  /**
   * Trigger screen flash
   */
  flash(color: string, duration: number = 200): void {
    this.state.flashColor = color;
    this.state.flashAlpha = 1;
  }

  /**
   * Draw with invincibility flicker effect
   */
  withInvincibilityFlicker(isInvincible: boolean, draw: () => void): void {
    if (!isInvincible || Math.floor(Date.now() / 100) % 2 === 0) {
      draw();
    }
  }

  /**
   * Draw with alpha
   */
  withAlpha(alpha: number, draw: () => void): void {
    const prevAlpha = this.ctx.globalAlpha;
    this.ctx.globalAlpha = alpha;
    draw();
    this.ctx.globalAlpha = prevAlpha;
  }

  /**
   * Draw with transform
   */
  withTransform(
    x: number,
    y: number,
    rotation: number,
    scaleX: number,
    scaleY: number,
    draw: () => void
  ): void {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(rotation);
    this.ctx.scale(scaleX, scaleY);
    draw();
    this.ctx.restore();
  }

  /**
   * Draw debug info
   */
  drawDebugInfo(info: Record<string, string | number>): void {
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(5, 5, 150, Object.keys(info).length * 15 + 10);

    this.ctx.fillStyle = "#fff";
    this.ctx.font = "12px monospace";
    this.ctx.textAlign = "left";

    let y = 20;
    for (const [key, value] of Object.entries(info)) {
      this.ctx.fillText(`${key}: ${value}`, 10, y);
      y += 15;
    }

    this.ctx.restore();
  }
}

/**
 * Create a render context from a canvas element
 */
export function createRenderContext(canvas: HTMLCanvasElement, scale: ScaleFactors): RenderContext {
  return new RenderContext(canvas, scale);
}
