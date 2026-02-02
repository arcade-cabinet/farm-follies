/**
 * Farm Follies Tornado Renderer
 * Procedural drawing of the tornado that spawns animals
 */

import { FARM_COLORS, GAME_CONFIG } from "../config";

interface TornadoDrawOptions {
  width: number;
  height: number;
  rotation: number; // Current rotation angle
  intensity: number; // 0-1, how active/fast the tornado is
  isSpawning: boolean; // Currently dropping an animal
  direction: number; // -1 left, 1 right (affects lean)
}

/**
 * Draw the procedural tornado
 * A proper funnel cloud with swirling debris
 */
export function drawTornado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: TornadoDrawOptions
): void {
  const { width: w, height: h, rotation, intensity, isSpawning, direction } = options;

  ctx.save();
  ctx.translate(x, y);

  const time = Date.now();
  const sway = Math.sin(time / 800) * GAME_CONFIG.tornado.swayAmount * direction;

  // Apply slight lean based on direction
  ctx.rotate(direction * 0.1 + sway * 0.002);

  // Draw funnel layers from back to front
  drawFunnelCloud(ctx, w, h, rotation, intensity, isSpawning);
  drawSwirlingDebris(ctx, w, h, rotation, intensity);
  drawFunnelHighlights(ctx, w, h, rotation);

  // Spawn effect
  if (isSpawning) {
    drawSpawnEffect(ctx, w, h);
  }

  ctx.restore();
}

/**
 * Draw the main funnel cloud shape
 */
function drawFunnelCloud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rotation: number,
  intensity: number,
  isSpawning: boolean
): void {
  const segments = GAME_CONFIG.tornado.funnelSegments;
  const time = Date.now();

  // Funnel gradient colors
  const baseColor = FARM_COLORS.tornado.funnel;

  // Draw multiple rotating layers for depth
  for (let layer = 0; layer < 3; layer++) {
    const layerOffset = layer * 0.3;
    const layerAlpha = 0.4 - layer * 0.1;

    ctx.save();
    ctx.rotate(rotation + layerOffset);

    // Draw funnel shape using bezier curves
    ctx.beginPath();

    // Top of funnel (wide)
    const topWidth = w * 0.5;
    // Bottom of funnel (narrow)
    const bottomWidth = w * 0.08;

    // Left side of funnel
    ctx.moveTo(-topWidth, 0);

    // Create wavy funnel edges
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const segmentY = t * h;

      // Width decreases as we go down (funnel shape)
      const widthAtSegment = topWidth - (topWidth - bottomWidth) * t ** 0.7;

      // Add waviness that rotates
      const wavePhase = rotation * 3 + t * Math.PI * 4 + time / 200;
      const waveAmount = (1 - t) * 15 * intensity; // Less wave at bottom
      const waveOffset = Math.sin(wavePhase) * waveAmount;

      const xLeft = -widthAtSegment + waveOffset;

      if (i === 0) {
        ctx.moveTo(xLeft, segmentY);
      } else {
        ctx.lineTo(xLeft, segmentY);
      }
    }

    // Bottom curve
    ctx.quadraticCurveTo(0, h + 10, bottomWidth, h);

    // Right side going back up
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const segmentY = t * h;

      const widthAtSegment = topWidth - (topWidth - bottomWidth) * t ** 0.7;

      const wavePhase = rotation * 3 + t * Math.PI * 4 + time / 200 + Math.PI;
      const waveAmount = (1 - t) * 15 * intensity;
      const waveOffset = Math.sin(wavePhase) * waveAmount;

      const xRight = widthAtSegment + waveOffset;
      ctx.lineTo(xRight, segmentY);
    }

    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, `rgba(74, 85, 104, ${layerAlpha})`);
    gradient.addColorStop(0.5, `rgba(55, 65, 81, ${layerAlpha + 0.1})`);
    gradient.addColorStop(1, `rgba(31, 41, 55, ${layerAlpha + 0.2})`);

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();
  }

  // Inner dark core
  ctx.save();
  ctx.rotate(rotation * 1.5);

  const coreGradient = ctx.createLinearGradient(0, 0, 0, h);
  coreGradient.addColorStop(0, "rgba(31, 41, 55, 0.3)");
  coreGradient.addColorStop(0.5, "rgba(17, 24, 39, 0.5)");
  coreGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");

  ctx.fillStyle = coreGradient;
  ctx.beginPath();

  // Smaller inner funnel
  const innerTopWidth = w * 0.25;
  const innerBottomWidth = w * 0.03;

  ctx.moveTo(-innerTopWidth, h * 0.1);
  ctx.quadraticCurveTo(-innerBottomWidth * 2, h * 0.6, -innerBottomWidth, h * 0.95);
  ctx.quadraticCurveTo(0, h, innerBottomWidth, h * 0.95);
  ctx.quadraticCurveTo(innerBottomWidth * 2, h * 0.6, innerTopWidth, h * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw swirling debris particles
 */
function drawSwirlingDebris(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rotation: number,
  intensity: number
): void {
  const time = Date.now();
  const debrisCount = Math.floor(15 + intensity * 20);

  for (let i = 0; i < debrisCount; i++) {
    // Each debris particle has its own orbit
    const orbitPhase = (i / debrisCount) * Math.PI * 2;
    const orbitSpeed = 0.003 + (i % 3) * 0.001;
    const currentAngle = rotation * 2 + orbitPhase + time * orbitSpeed;

    // Vertical position in funnel (0 = top, 1 = bottom)
    const verticalPos = (Math.sin(time / 1000 + i * 0.5) * 0.5 + 0.5) * 0.8 + 0.1;

    // Radius decreases as we go down the funnel
    const maxRadius = w * 0.45 * (1 - verticalPos * 0.8);
    const radius = maxRadius * (0.7 + Math.sin(time / 500 + i) * 0.3);

    const debrisX = Math.cos(currentAngle) * radius;
    const debrisY = verticalPos * h + Math.sin(currentAngle * 2) * 5;

    // Different debris types
    const debrisType = i % 5;

    ctx.save();
    ctx.translate(debrisX, debrisY);
    ctx.rotate(currentAngle * 3);

    switch (debrisType) {
      case 0: // Hay strand
        ctx.fillStyle = FARM_COLORS.effects.hay;
        ctx.fillRect(-6, -1, 12, 2);
        break;

      case 1: // Dirt clump
        ctx.fillStyle = FARM_COLORS.ground.dirt;
        ctx.beginPath();
        ctx.arc(0, 0, 3 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 2: // Leaf
        ctx.fillStyle = "#228B22";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 3, currentAngle, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 3: // Small wood splinter
        ctx.fillStyle = FARM_COLORS.barn.wood;
        ctx.fillRect(-4, -1, 8, 2);
        break;

      case 4: // Dust particle
        ctx.fillStyle = `rgba(139, 69, 19, ${0.3 + Math.random() * 0.3})`;
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}

/**
 * Draw highlights and wind streaks
 */
function drawFunnelHighlights(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rotation: number
): void {
  const time = Date.now();

  // Wind streak lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;

  for (let i = 0; i < 6; i++) {
    const phase = (i / 6) * Math.PI * 2 + rotation * 2;
    const yPos = (i / 6) * h * 0.7 + h * 0.1;
    const width = w * 0.4 * (1 - (yPos / h) * 0.7);

    const startAngle = phase + time / 300;
    const startX = Math.cos(startAngle) * width;
    const endX = Math.cos(startAngle + 0.5) * width * 0.8;

    ctx.beginPath();
    ctx.moveTo(startX, yPos);
    ctx.quadraticCurveTo(
      (startX + endX) / 2 + Math.sin(time / 200) * 10,
      yPos + 15,
      endX,
      yPos + 30
    );
    ctx.stroke();
  }

  // Bright edge highlights
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 3;

  const highlightPhase = time / 400;
  ctx.beginPath();
  ctx.moveTo(Math.cos(highlightPhase) * w * 0.4, h * 0.1);
  ctx.quadraticCurveTo(Math.cos(highlightPhase + 1) * w * 0.2, h * 0.5, w * 0.05, h * 0.9);
  ctx.stroke();
}

/**
 * Draw spawn effect when releasing an animal
 */
function drawSpawnEffect(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now();

  // Glow at the bottom of the funnel
  const glowGradient = ctx.createRadialGradient(0, h, 0, 0, h, w * 0.3);
  glowGradient.addColorStop(0, "rgba(255, 255, 200, 0.5)");
  glowGradient.addColorStop(0.5, "rgba(255, 200, 100, 0.3)");
  glowGradient.addColorStop(1, "rgba(255, 150, 50, 0)");

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(0, h, w * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Energy rings
  ctx.strokeStyle = "rgba(255, 220, 150, 0.6)";
  ctx.lineWidth = 2;

  for (let i = 0; i < 3; i++) {
    const ringPhase = (time / 200 + i * 0.3) % 1;
    const ringRadius = ringPhase * w * 0.4;
    const ringAlpha = 1 - ringPhase;

    ctx.globalAlpha = ringAlpha;
    ctx.beginPath();
    ctx.arc(0, h + 10, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}

/**
 * Draw tornado on a rail (the movement track)
 */
export function drawTornadoRail(
  ctx: CanvasRenderingContext2D,
  width: number,
  railY: number,
  tornadoX: number
): void {
  // Storm cloud rail
  const cloudY = railY - 30;

  // Dark storm clouds
  ctx.fillStyle = FARM_COLORS.tornado.funnel;

  // Multiple cloud puffs
  for (let i = 0; i < 8; i++) {
    const cloudX = (i / 7) * width;
    const cloudSize = 60 + Math.sin(Date.now() / 1000 + i) * 10;
    const cloudOffsetY = Math.sin(i * 0.8) * 15;

    ctx.beginPath();
    ctx.arc(cloudX, cloudY + cloudOffsetY, cloudSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Darker cloud layer
  ctx.fillStyle = "rgba(31, 41, 55, 0.8)";
  for (let i = 0; i < 6; i++) {
    const cloudX = (i / 5) * width + 40;
    const cloudSize = 45 + Math.cos(Date.now() / 800 + i) * 8;

    ctx.beginPath();
    ctx.arc(cloudX, cloudY + 10, cloudSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lightning flash occasionally
  if (Math.random() < 0.002) {
    ctx.fillStyle = "rgba(255, 255, 200, 0.3)";
    ctx.fillRect(0, 0, width, railY + 50);
  }

  // Rain streaks
  ctx.strokeStyle = "rgba(150, 180, 200, 0.3)";
  ctx.lineWidth = 1;

  const time = Date.now();
  for (let i = 0; i < 30; i++) {
    const rainX = (time / 10 + i * 37) % width;
    const rainY = (time / 5 + i * 23) % (railY + 100);

    ctx.beginPath();
    ctx.moveTo(rainX, rainY);
    ctx.lineTo(rainX - 5, rainY + 15);
    ctx.stroke();
  }
}

/**
 * Update tornado state
 */
export interface TornadoState {
  x: number;
  direction: number; // -1 or 1
  rotation: number;
  intensity: number;
  isSpawning: boolean;
  spawnCooldown: number;
}

export function updateTornadoState(
  state: TornadoState,
  deltaTime: number,
  screenWidth: number,
  bankWidth: number
): TornadoState {
  const config = GAME_CONFIG.tornado;
  const minX = config.width / 2 + 20;
  const maxX = screenWidth - bankWidth - config.width / 2 - 20;

  // Update position
  let newX =
    state.x + state.direction * config.baseSpeed * (0.5 + state.intensity * 0.5) * (deltaTime / 16);
  let newDirection = state.direction;

  // Bounce off edges
  if (newX <= minX) {
    newX = minX;
    newDirection = 1;
  } else if (newX >= maxX) {
    newX = maxX;
    newDirection = -1;
  }

  // Random direction changes
  if (Math.random() < config.directionChangeChance) {
    newDirection = -newDirection;
  }

  // Update rotation
  const newRotation =
    state.rotation + config.rotationSpeed * (deltaTime / 16) * (0.5 + state.intensity * 0.5);

  // Update spawn cooldown
  const newSpawnCooldown = Math.max(0, state.spawnCooldown - deltaTime);

  return {
    x: newX,
    direction: newDirection,
    rotation: newRotation,
    intensity: state.intensity,
    isSpawning: state.isSpawning,
    spawnCooldown: newSpawnCooldown,
  };
}
