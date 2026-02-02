/**
 * Farm Follies Bush Renderer
 * Procedural drawing of bouncy bushes (grown from cow poop)
 */

import { FARM_COLORS } from "../config";

interface BushDrawOptions {
  width: number;
  height: number; // Current height (grows over time)
  maxHeight: number;
  growth: number; // 0-1 growth progress
  bouncePhase: number; // Current bounce animation phase
  age: number; // Time since created (for decay)
}

/**
 * Draw a procedural bouncy bush
 */
export function drawBush(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: BushDrawOptions
): void {
  const { width: baseWidth, height, growth, bouncePhase, age } = options;

  // Width scales with height
  const w = baseWidth * (0.5 + growth * 0.5);
  const h = height;

  if (h < 5) return; // Don't draw tiny bushes

  ctx.save();
  ctx.translate(x, y);

  const time = Date.now();

  // Bounce squash/stretch
  const bounceSquash = Math.sin(bouncePhase) * 0.15;
  ctx.scale(1 + bounceSquash, 1 - bounceSquash * 0.5);

  // Age affects opacity (bushes fade as they decay)
  const decayStart = 12000; // Start fading at 12 seconds
  const decayDuration = 3000;
  let alpha = 1;
  if (age > decayStart) {
    alpha = Math.max(0, 1 - (age - decayStart) / decayDuration);
  }

  ctx.globalAlpha = alpha;

  // Ground mound
  const moundColor = FARM_COLORS.ground.dirt;
  ctx.fillStyle = moundColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.4, h * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Fertilizer base (the poop that grew the bush)
  if (growth < 0.5) {
    ctx.fillStyle = FARM_COLORS.effects.poop;
    ctx.globalAlpha = alpha * (1 - growth * 2);
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.05, w * 0.15, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
  }

  // Bush foliage - multiple overlapping circles
  const bushColor = FARM_COLORS.nature.bush;
  const bushDark = FARM_COLORS.nature.bushDark;

  // Shadow/dark layer
  ctx.fillStyle = bushDark;
  const leafClusters = Math.floor(3 + growth * 4);

  for (let i = 0; i < leafClusters; i++) {
    const angle = (i / leafClusters) * Math.PI * 2 + time / 2000;
    const dist = w * 0.2 * (0.5 + Math.random() * 0.5);
    const cx = Math.cos(angle) * dist;
    const cy = -h * 0.4 + Math.sin(angle * 2) * h * 0.1;
    const radius = w * 0.25 * (0.7 + Math.random() * 0.3);

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main foliage layer
  ctx.fillStyle = bushColor;

  for (let i = 0; i < leafClusters + 2; i++) {
    const angle = (i / (leafClusters + 2)) * Math.PI * 2 + time / 3000;
    const dist = w * 0.15;
    const cx = Math.cos(angle) * dist;
    const cy = -h * 0.5 + Math.sin(angle * 3) * h * 0.08;
    const radius = w * 0.22 * (0.8 + Math.random() * 0.2);

    // Gentle sway
    const sway = Math.sin(time / 500 + i) * 3;

    ctx.beginPath();
    ctx.arc(cx + sway, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top highlight puffs
  ctx.fillStyle = `rgba(34, 180, 34, ${0.8 * alpha})`;
  for (let i = 0; i < 3; i++) {
    const hx = (i - 1) * w * 0.15;
    const hy = -h * 0.7 - i * h * 0.05;
    const hr = w * 0.12;

    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional flowers
  if (growth > 0.7 && Math.floor(time / 1000) % 3 === 0) {
    drawFlowers(ctx, w, h, time, alpha);
  }

  // Leaf details
  ctx.strokeStyle = `rgba(0, 100, 0, ${0.3 * alpha})`;
  ctx.lineWidth = 1;

  for (let i = 0; i < 4; i++) {
    const lx = (Math.random() - 0.5) * w * 0.5;
    const ly = -h * 0.3 - Math.random() * h * 0.4;

    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(lx + 5, ly - 5, lx + 8, ly);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

/**
 * Draw small flowers on the bush
 */
function drawFlowers(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  alpha: number
): void {
  const flowerColor = FARM_COLORS.nature.flower;

  for (let i = 0; i < 3; i++) {
    const fx = (i - 1) * w * 0.25;
    const fy = -h * 0.5 - Math.abs(i - 1) * h * 0.1;
    const fSize = 4;

    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.beginPath();
    ctx.arc(fx, fy, fSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flowerColor;
    for (let p = 0; p < 5; p++) {
      const petalAngle = (p / 5) * Math.PI * 2 + time / 1000;
      const px = fx + Math.cos(petalAngle) * fSize;
      const py = fy + Math.sin(petalAngle) * fSize;

      ctx.beginPath();
      ctx.arc(px, py, fSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw the bouncy effect when something hits the bush
 */
export function drawBushBounceEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number // 0-1
): void {
  if (intensity < 0.1) return;

  ctx.save();
  ctx.translate(x, y);

  // Leaf burst
  ctx.fillStyle = `rgba(34, 139, 34, ${intensity * 0.6})`;

  const leafCount = Math.floor(5 + intensity * 10);
  const time = Date.now();

  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const dist = 20 + intensity * 40 + Math.sin(time / 100 + i) * 10;
    const lx = Math.cos(angle) * dist;
    const ly = Math.sin(angle) * dist - 20;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle + time / 200);

    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Spring ring
  ctx.strokeStyle = `rgba(100, 200, 100, ${intensity * 0.5})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -10, 30 + intensity * 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Bush state management
 */
export interface BushState {
  x: number;
  y: number;
  growth: number; // 0-1
  maxHeight: number;
  bouncePhase: number;
  bounceVelocity: number;
  age: number;
  isDecaying: boolean;
}

export function createBushState(x: number, y: number): BushState {
  return {
    x,
    y,
    growth: 0,
    maxHeight: 60 + Math.random() * 30,
    bouncePhase: 0,
    bounceVelocity: 0,
    age: 0,
    isDecaying: false,
  };
}

export function updateBushState(state: BushState, deltaTime: number): BushState {
  const growthSpeed = 0.0008; // Growth per ms
  const decayTime = 15000; // Start decaying at 15 seconds

  let newGrowth = state.growth;
  const newAge = state.age + deltaTime;
  let newIsDecaying = state.isDecaying;

  // Grow until fully grown
  if (newGrowth < 1 && !state.isDecaying) {
    newGrowth = Math.min(1, newGrowth + growthSpeed * deltaTime);
  }

  // Start decaying after a while
  if (newAge > decayTime && !state.isDecaying) {
    newIsDecaying = true;
  }

  // Decay (shrink)
  if (newIsDecaying) {
    newGrowth = Math.max(0, newGrowth - growthSpeed * 0.5 * deltaTime);
  }

  // Update bounce physics
  let newBouncePhase = state.bouncePhase;
  let newBounceVelocity = state.bounceVelocity;

  if (Math.abs(newBounceVelocity) > 0.01 || Math.abs(newBouncePhase) > 0.01) {
    // Spring physics
    const springForce = -newBouncePhase * 0.15;
    newBounceVelocity += springForce;
    newBounceVelocity *= 0.92; // Damping
    newBouncePhase += newBounceVelocity;
  } else {
    newBouncePhase = 0;
    newBounceVelocity = 0;
  }

  return {
    ...state,
    growth: newGrowth,
    age: newAge,
    bouncePhase: newBouncePhase,
    bounceVelocity: newBounceVelocity,
    isDecaying: newIsDecaying,
  };
}

export function triggerBushBounce(state: BushState, impactVelocity: number): BushState {
  return {
    ...state,
    bounceVelocity: state.bounceVelocity + impactVelocity * 0.3,
  };
}
