/**
 * Farm Follies Animal Renderer
 * Procedural drawing of all barnyard animals
 */

import { FARM_COLORS } from '../config';
import type { AnimalType, AnimalArchetype } from '../ecs/types';

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  stress: number;
  isStressed: boolean;
  isConfused: boolean;
  abilityReady?: boolean;
}

/**
 * Draw any animal based on its archetype
 */
export function drawAnimal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  archetype: AnimalArchetype,
  stress: number = 0,
  isStressed: boolean = false,
  isConfused: boolean = false,
  abilityReady: boolean = false
): void {
  const drawCtx: DrawContext = {
    ctx, x, y, width, height, stress, isStressed, isConfused, abilityReady
  };
  
  switch (archetype.type) {
    case 'cow':
      drawCow(drawCtx, archetype);
      break;
    case 'chicken':
      drawChicken(drawCtx, archetype);
      break;
    case 'pig':
      drawPig(drawCtx, archetype);
      break;
    case 'sheep':
      drawSheep(drawCtx, archetype);
      break;
    case 'goat':
      drawGoat(drawCtx, archetype);
      break;
    case 'duck':
      drawDuck(drawCtx, archetype);
      break;
    case 'goose':
      drawGoose(drawCtx, archetype);
      break;
    case 'horse':
      drawHorse(drawCtx, archetype);
      break;
    case 'rooster':
      drawRooster(drawCtx, archetype);
      break;
  }
}

/**
 * Draw a cow
 */
function drawCow(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const spotColor = archetype.secondaryColor;
  const noseColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 5, w / 2.2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Body (oval)
  c.fillStyle = bodyColor;
  c.strokeStyle = '#2F1810';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2, h / 2.2, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Spots (if not special brown variant)
  if (!isSpecial) {
    c.fillStyle = spotColor;
    c.beginPath();
    c.ellipse(-w * 0.2, -h * 0.1, w * 0.12, h * 0.1, 0.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(w * 0.15, h * 0.05, w * 0.1, h * 0.08, -0.2, 0, Math.PI * 2);
    c.fill();
  }
  
  // Head
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(0, -h / 2.5, w / 3, h / 3, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Ears
  const earWiggle = isConfused ? Math.sin(Date.now() / 100) * 3 : 0;
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(-w * 0.28 + earWiggle, -h * 0.45, w * 0.08, h * 0.12, -0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(w * 0.28 - earWiggle, -h * 0.45, w * 0.08, h * 0.12, 0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Snout
  c.fillStyle = noseColor;
  c.beginPath();
  c.ellipse(0, -h * 0.28, w * 0.15, h * 0.1, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Nostrils
  c.fillStyle = '#2F1810';
  c.beginPath();
  c.arc(-w * 0.05, -h * 0.28, 2, 0, Math.PI * 2);
  c.arc(w * 0.05, -h * 0.28, 2, 0, Math.PI * 2);
  c.fill();
  
  // Eyes
  drawEyes(c, w, h, isStressed, isConfused);
  
  // Horns (small)
  c.fillStyle = '#D2B48C';
  c.beginPath();
  c.moveTo(-w * 0.15, -h * 0.55);
  c.quadraticCurveTo(-w * 0.2, -h * 0.7, -w * 0.12, -h * 0.65);
  c.fill();
  c.beginPath();
  c.moveTo(w * 0.15, -h * 0.55);
  c.quadraticCurveTo(w * 0.2, -h * 0.7, w * 0.12, -h * 0.65);
  c.fill();
  
  // Udder (bottom)
  c.fillStyle = noseColor;
  c.beginPath();
  c.ellipse(0, h * 0.35, w * 0.15, h * 0.1, 0, 0, Math.PI * 2);
  c.fill();
  
  // Special effect for brown cow
  if (isSpecial && ctx.abilityReady) {
    drawPoopReadyEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a chicken
 */
function drawChicken(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const wingColor = archetype.secondaryColor;
  const combColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  c.fill();
  
  // Feet
  c.strokeStyle = '#FFA500';
  c.lineWidth = 2;
  const footWiggle = isStressed ? Math.sin(Date.now() / 50) * 2 : 0;
  c.beginPath();
  c.moveTo(-w * 0.15, h * 0.35);
  c.lineTo(-w * 0.2 + footWiggle, h * 0.45);
  c.moveTo(-w * 0.15, h * 0.35);
  c.lineTo(-w * 0.1, h * 0.45);
  c.stroke();
  c.beginPath();
  c.moveTo(w * 0.15, h * 0.35);
  c.lineTo(w * 0.2 - footWiggle, h * 0.45);
  c.moveTo(w * 0.15, h * 0.35);
  c.lineTo(w * 0.1, h * 0.45);
  c.stroke();
  
  // Body
  c.fillStyle = bodyColor;
  c.strokeStyle = '#2F1810';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2.5, h / 2.8, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Wing
  c.fillStyle = wingColor;
  c.beginPath();
  c.ellipse(w * 0.1, h * 0.05, w * 0.15, h * 0.18, 0.3, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Tail feathers
  c.fillStyle = bodyColor;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(-w * 0.3, -h * 0.1 + i * h * 0.08, w * 0.12, h * 0.05, -0.5, 0, Math.PI * 2);
    c.fill();
  }
  
  // Head
  c.fillStyle = bodyColor;
  c.beginPath();
  c.arc(0, -h * 0.35, w * 0.2, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Comb
  c.fillStyle = combColor;
  c.beginPath();
  c.moveTo(-w * 0.08, -h * 0.5);
  c.quadraticCurveTo(-w * 0.04, -h * 0.65, 0, -h * 0.55);
  c.quadraticCurveTo(w * 0.04, -h * 0.68, w * 0.08, -h * 0.5);
  c.closePath();
  c.fill();
  
  // Beak
  c.fillStyle = '#FFA500';
  c.beginPath();
  c.moveTo(w * 0.15, -h * 0.35);
  c.lineTo(w * 0.28, -h * 0.32);
  c.lineTo(w * 0.15, -h * 0.28);
  c.closePath();
  c.fill();
  
  // Wattle
  c.fillStyle = combColor;
  c.beginPath();
  c.ellipse(w * 0.12, -h * 0.22, w * 0.04, h * 0.06, 0, 0, Math.PI * 2);
  c.fill();
  
  // Eyes
  drawChickenEyes(c, w, h, isStressed, isConfused);
  
  // Golden glow for special variant
  if (isSpecial && ctx.abilityReady) {
    drawGoldenGlow(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a pig
 */
function drawPig(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const snoutColor = archetype.secondaryColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Body (round and plump)
  c.fillStyle = bodyColor;
  c.strokeStyle = '#8B4513';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Legs (short stubby)
  c.fillStyle = bodyColor;
  const legWiggle = isStressed ? Math.sin(Date.now() / 60) * 2 : 0;
  c.beginPath();
  c.ellipse(-w * 0.25 + legWiggle, h * 0.35, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(w * 0.25 - legWiggle, h * 0.35, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Hooves
  c.fillStyle = '#2F1810';
  c.beginPath();
  c.ellipse(-w * 0.25 + legWiggle, h * 0.42, w * 0.06, h * 0.04, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.25 - legWiggle, h * 0.42, w * 0.06, h * 0.04, 0, 0, Math.PI * 2);
  c.fill();
  
  // Ears
  const earWiggle = isConfused ? Math.sin(Date.now() / 80) * 5 : 0;
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(-w * 0.2, -h * 0.4 + earWiggle, w * 0.1, h * 0.12, -0.4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.beginPath();
  c.ellipse(w * 0.2, -h * 0.4 - earWiggle, w * 0.1, h * 0.12, 0.4, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Snout
  c.fillStyle = snoutColor;
  c.beginPath();
  c.ellipse(0, -h * 0.15, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Nostrils
  c.fillStyle = '#8B4513';
  c.beginPath();
  c.ellipse(-w * 0.05, -h * 0.15, w * 0.03, h * 0.03, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.05, -h * 0.15, w * 0.03, h * 0.03, 0, 0, Math.PI * 2);
  c.fill();
  
  // Eyes
  drawPigEyes(c, w, h, isStressed, isConfused);
  
  // Curly tail
  c.strokeStyle = bodyColor;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(-w * 0.35, 0, w * 0.08, 0, Math.PI * 1.5);
  c.stroke();
  
  // Mud splash effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawMudEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a sheep
 */
function drawSheep(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const woolColor = archetype.primaryColor;
  const faceColor = archetype.secondaryColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Legs
  c.fillStyle = faceColor;
  c.strokeStyle = '#1C1C1C';
  c.lineWidth = 1;
  const legWiggle = isStressed ? Math.sin(Date.now() / 50) * 2 : 0;
  c.fillRect(-w * 0.22 + legWiggle, h * 0.2, w * 0.08, h * 0.25);
  c.fillRect(w * 0.14 - legWiggle, h * 0.2, w * 0.08, h * 0.25);
  
  // Fluffy wool body (multiple circles)
  c.fillStyle = woolColor;
  c.strokeStyle = isSpecial ? '#333' : '#CCC';
  c.lineWidth = 1;
  
  // Draw fluffy cloud shape
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const cx = Math.cos(angle) * w * 0.25;
    const cy = Math.sin(angle) * h * 0.2;
    c.beginPath();
    c.arc(cx, cy, w * 0.18, 0, Math.PI * 2);
    c.fill();
  }
  // Center fill
  c.beginPath();
  c.ellipse(0, 0, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
  c.fill();
  
  // Head
  c.fillStyle = faceColor;
  c.strokeStyle = '#1C1C1C';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, -h * 0.35, w * 0.18, h * 0.2, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Ears
  const earWiggle = isConfused ? Math.sin(Date.now() / 100) * 3 : 0;
  c.fillStyle = archetype.accentColor;
  c.beginPath();
  c.ellipse(-w * 0.2 + earWiggle, -h * 0.35, w * 0.06, h * 0.1, -0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.2 - earWiggle, -h * 0.35, w * 0.06, h * 0.1, 0.5, 0, Math.PI * 2);
  c.fill();
  
  // Wool tuft on head
  c.fillStyle = woolColor;
  c.beginPath();
  c.arc(-w * 0.05, -h * 0.5, w * 0.08, 0, Math.PI * 2);
  c.arc(w * 0.05, -h * 0.52, w * 0.07, 0, Math.PI * 2);
  c.arc(0, -h * 0.48, w * 0.06, 0, Math.PI * 2);
  c.fill();
  
  // Eyes
  drawSheepEyes(c, w, h, isStressed, isConfused);
  
  // Wool shield effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawWoolShieldEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a duck (barnyard duck)
 */
function drawDuck(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const beakColor = archetype.secondaryColor;
  const feetColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  c.fill();
  
  // Feet
  c.fillStyle = feetColor;
  const footWiggle = isStressed ? Math.sin(Date.now() / 50) * 2 : 0;
  c.beginPath();
  c.ellipse(-w * 0.15 + footWiggle, h * 0.35, w * 0.1, h * 0.05, 0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.15 - footWiggle, h * 0.35, w * 0.1, h * 0.05, -0.2, 0, Math.PI * 2);
  c.fill();
  
  // Body
  c.fillStyle = bodyColor;
  c.strokeStyle = '#8B7355';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2.2, h / 2.5, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Wing
  c.fillStyle = isSpecial ? archetype.primaryColor : '#F0E68C';
  c.beginPath();
  c.ellipse(w * 0.05, h * 0.05, w * 0.18, h * 0.15, 0.3, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Tail feathers
  c.fillStyle = bodyColor;
  c.beginPath();
  c.moveTo(-w * 0.35, 0);
  c.quadraticCurveTo(-w * 0.45, -h * 0.1, -w * 0.4, -h * 0.15);
  c.quadraticCurveTo(-w * 0.35, -h * 0.05, -w * 0.35, 0);
  c.fill();
  
  // Head
  c.fillStyle = bodyColor;
  c.beginPath();
  c.arc(w * 0.1, -h * 0.3, w * 0.2, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Beak
  c.fillStyle = beakColor;
  c.beginPath();
  c.moveTo(w * 0.25, -h * 0.3);
  c.lineTo(w * 0.42, -h * 0.28);
  c.lineTo(w * 0.25, -h * 0.22);
  c.closePath();
  c.fill();
  c.strokeStyle = '#CC7000';
  c.stroke();
  
  // Eyes
  drawDuckEyes(c, w, h, isStressed, isConfused);
  
  // Feather float effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawFeatherEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a goose
 */
function drawGoose(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const beakColor = archetype.secondaryColor;
  const feetColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2, w / 2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Feet
  c.fillStyle = feetColor;
  c.beginPath();
  c.ellipse(-w * 0.12, h * 0.4, w * 0.1, h * 0.05, 0, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.12, h * 0.4, w * 0.1, h * 0.05, 0, 0, Math.PI * 2);
  c.fill();
  
  // Body (larger, more elongated)
  c.fillStyle = bodyColor;
  c.strokeStyle = '#AAA';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, h * 0.1, w / 2, h / 2.5, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Long neck
  c.beginPath();
  c.moveTo(-w * 0.1, -h * 0.1);
  c.quadraticCurveTo(-w * 0.05, -h * 0.4, 0, -h * 0.5);
  c.quadraticCurveTo(w * 0.05, -h * 0.4, w * 0.1, -h * 0.1);
  c.fill();
  c.stroke();
  
  // Head
  c.beginPath();
  c.arc(0, -h * 0.55, w * 0.15, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Beak
  c.fillStyle = beakColor;
  c.beginPath();
  c.moveTo(w * 0.1, -h * 0.55);
  c.lineTo(w * 0.28, -h * 0.52);
  c.lineTo(w * 0.1, -h * 0.48);
  c.closePath();
  c.fill();
  
  // Eyes
  c.fillStyle = '#000';
  const eyeShake = isStressed ? (Math.random() - 0.5) * 2 : 0;
  c.beginPath();
  c.arc(w * 0.05 + eyeShake, -h * 0.58, 3, 0, Math.PI * 2);
  c.fill();
  
  // Confusion effect
  if (isConfused) {
    drawConfusionStars(c, w, h);
  }
  
  // Honey trap effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawHoneyGlow(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a horse
 */
function drawHorse(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const maneColor = archetype.secondaryColor;
  const hoofColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 2, w / 2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Legs
  c.fillStyle = bodyColor;
  c.strokeStyle = hoofColor;
  c.lineWidth = 2;
  const legMove = isStressed ? Math.sin(Date.now() / 80) * 3 : 0;
  
  // Back legs
  c.fillRect(-w * 0.3, h * 0.1, w * 0.1, h * 0.35);
  c.fillRect(w * 0.2, h * 0.1 + legMove, w * 0.1, h * 0.35);
  
  // Hooves
  c.fillStyle = hoofColor;
  c.fillRect(-w * 0.31, h * 0.4, w * 0.12, h * 0.08);
  c.fillRect(w * 0.19, h * 0.4 + legMove, w * 0.12, h * 0.08);
  
  // Body
  c.fillStyle = bodyColor;
  c.strokeStyle = '#654321';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2, h / 3, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Neck
  c.beginPath();
  c.moveTo(w * 0.2, -h * 0.15);
  c.quadraticCurveTo(w * 0.25, -h * 0.4, w * 0.15, -h * 0.5);
  c.quadraticCurveTo(w * 0.1, -h * 0.35, w * 0.15, -h * 0.15);
  c.fill();
  c.stroke();
  
  // Head
  c.beginPath();
  c.ellipse(w * 0.15, -h * 0.55, w * 0.12, h * 0.15, 0.3, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Muzzle
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(w * 0.25, -h * 0.5, w * 0.08, h * 0.08, 0.3, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Nostrils
  c.fillStyle = '#1C1C1C';
  c.beginPath();
  c.arc(w * 0.28, -h * 0.48, 2, 0, Math.PI * 2);
  c.fill();
  
  // Eye
  c.fillStyle = '#000';
  c.beginPath();
  c.arc(w * 0.12, -h * 0.58, 3, 0, Math.PI * 2);
  c.fill();
  
  // Mane
  c.fillStyle = maneColor;
  const maneWiggle = isConfused ? Math.sin(Date.now() / 100) * 3 : 0;
  c.beginPath();
  c.moveTo(w * 0.2, -h * 0.5);
  for (let i = 0; i < 5; i++) {
    const mx = w * 0.18 - i * w * 0.05;
    const my = -h * 0.45 + i * h * 0.08;
    c.quadraticCurveTo(mx - w * 0.08 + maneWiggle, my - h * 0.05, mx, my);
  }
  c.fill();
  
  // Ear
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(w * 0.08, -h * 0.68, w * 0.04, h * 0.08, -0.3, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Tail
  c.fillStyle = maneColor;
  c.beginPath();
  c.moveTo(-w * 0.4, -h * 0.1);
  c.quadraticCurveTo(-w * 0.55, h * 0.1, -w * 0.45, h * 0.3);
  c.quadraticCurveTo(-w * 0.35, h * 0.15, -w * 0.4, -h * 0.1);
  c.fill();
  
  // Hay storm effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawHayEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a rooster
 */
function drawRooster(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const tailColor = archetype.secondaryColor;
  const combColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.5, h / 6, 0, 0, Math.PI * 2);
  c.fill();
  
  // Tail feathers (prominent)
  c.fillStyle = tailColor;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    const angle = -0.5 - i * 0.15;
    c.ellipse(-w * 0.25, -h * 0.1 + i * h * 0.05, w * 0.2, h * 0.04, angle, 0, Math.PI * 2);
    c.fill();
  }
  
  // Feet
  c.strokeStyle = '#FFD700';
  c.lineWidth = 2;
  const footWiggle = isStressed ? Math.sin(Date.now() / 50) * 2 : 0;
  c.beginPath();
  c.moveTo(-w * 0.1, h * 0.35);
  c.lineTo(-w * 0.15 + footWiggle, h * 0.45);
  c.moveTo(-w * 0.1, h * 0.35);
  c.lineTo(-w * 0.05, h * 0.45);
  c.stroke();
  c.beginPath();
  c.moveTo(w * 0.1, h * 0.35);
  c.lineTo(w * 0.15 - footWiggle, h * 0.45);
  c.moveTo(w * 0.1, h * 0.35);
  c.lineTo(w * 0.05, h * 0.45);
  c.stroke();
  
  // Body
  c.fillStyle = bodyColor;
  c.strokeStyle = '#2F1810';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2.8, h / 2.8, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Breast feathers
  c.fillStyle = isSpecial ? '#F8F8FF' : '#CD853F';
  c.beginPath();
  c.ellipse(w * 0.05, h * 0.1, w * 0.12, h * 0.15, 0, 0, Math.PI * 2);
  c.fill();
  
  // Head
  c.fillStyle = bodyColor;
  c.beginPath();
  c.arc(w * 0.05, -h * 0.3, w * 0.18, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Large comb
  c.fillStyle = combColor;
  c.beginPath();
  c.moveTo(-w * 0.05, -h * 0.4);
  c.quadraticCurveTo(-w * 0.02, -h * 0.6, w * 0.02, -h * 0.5);
  c.quadraticCurveTo(w * 0.06, -h * 0.65, w * 0.1, -h * 0.48);
  c.quadraticCurveTo(w * 0.14, -h * 0.58, w * 0.15, -h * 0.42);
  c.lineTo(w * 0.12, -h * 0.35);
  c.closePath();
  c.fill();
  
  // Beak
  c.fillStyle = '#FFD700';
  c.beginPath();
  c.moveTo(w * 0.2, -h * 0.3);
  c.lineTo(w * 0.35, -h * 0.28);
  c.lineTo(w * 0.2, -h * 0.22);
  c.closePath();
  c.fill();
  
  // Wattle
  c.fillStyle = combColor;
  c.beginPath();
  c.ellipse(w * 0.18, -h * 0.18, w * 0.05, h * 0.08, 0, 0, Math.PI * 2);
  c.fill();
  
  // Eye
  c.fillStyle = '#000';
  const eyeShake = isStressed ? (Math.random() - 0.5) * 2 : 0;
  c.beginPath();
  c.arc(w * 0.1 + eyeShake, -h * 0.32, 3, 0, Math.PI * 2);
  c.fill();
  
  // Confusion effect
  if (isConfused) {
    drawConfusionStars(c, w, h);
  }
  
  // Crow call effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawCrowCallEffect(c, w, h);
  }
  
  c.restore();
}

/**
 * Draw a goat
 */
function drawGoat(ctx: DrawContext, archetype: AnimalArchetype): void {
  const { ctx: c, x, y, width: w, height: h, isStressed, isConfused } = ctx;
  
  c.save();
  c.translate(x, y);
  
  const bodyColor = archetype.primaryColor;
  const beardColor = archetype.secondaryColor;
  const hornColor = archetype.accentColor;
  const isSpecial = archetype.variant === 'special';
  
  // Shadow
  c.fillStyle = 'rgba(0,0,0,0.2)';
  c.beginPath();
  c.ellipse(0, h / 2 - 3, w / 2.2, h / 5, 0, 0, Math.PI * 2);
  c.fill();
  
  // Legs
  c.fillStyle = bodyColor;
  c.strokeStyle = '#2F1810';
  c.lineWidth = 1;
  const legMove = isStressed ? Math.sin(Date.now() / 60) * 2 : 0;
  c.fillRect(-w * 0.22 + legMove, h * 0.15, w * 0.08, h * 0.3);
  c.fillRect(w * 0.14 - legMove, h * 0.15, w * 0.08, h * 0.3);
  
  // Hooves
  c.fillStyle = '#1C1C1C';
  c.fillRect(-w * 0.23 + legMove, h * 0.4, w * 0.1, h * 0.06);
  c.fillRect(w * 0.13 - legMove, h * 0.4, w * 0.1, h * 0.06);
  
  // Body
  c.fillStyle = bodyColor;
  c.strokeStyle = '#8B7355';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 0, w / 2.2, h / 2.8, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Head
  c.beginPath();
  c.ellipse(0, -h * 0.35, w * 0.18, h * 0.2, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Ears (floppy)
  const earWiggle = isConfused ? Math.sin(Date.now() / 100) * 5 : 0;
  c.beginPath();
  c.ellipse(-w * 0.2 + earWiggle, -h * 0.35, w * 0.08, h * 0.06, -0.8, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(w * 0.2 - earWiggle, -h * 0.35, w * 0.08, h * 0.06, 0.8, 0, Math.PI * 2);
  c.fill();
  
  // Horns
  c.strokeStyle = hornColor;
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-w * 0.1, -h * 0.5);
  c.quadraticCurveTo(-w * 0.2, -h * 0.7, -w * 0.15, -h * 0.75);
  c.stroke();
  c.beginPath();
  c.moveTo(w * 0.1, -h * 0.5);
  c.quadraticCurveTo(w * 0.2, -h * 0.7, w * 0.15, -h * 0.75);
  c.stroke();
  
  // Beard
  c.fillStyle = beardColor;
  c.beginPath();
  c.moveTo(-w * 0.05, -h * 0.2);
  c.quadraticCurveTo(0, -h * 0.05, w * 0.05, -h * 0.2);
  c.quadraticCurveTo(0, -h * 0.1, -w * 0.05, -h * 0.2);
  c.fill();
  
  // Snout
  c.fillStyle = '#DEB887';
  c.beginPath();
  c.ellipse(0, -h * 0.28, w * 0.1, h * 0.08, 0, 0, Math.PI * 2);
  c.fill();
  
  // Nostrils
  c.fillStyle = '#8B7355';
  c.beginPath();
  c.arc(-w * 0.03, -h * 0.28, 2, 0, Math.PI * 2);
  c.arc(w * 0.03, -h * 0.28, 2, 0, Math.PI * 2);
  c.fill();
  
  // Eyes (horizontal pupils like real goats!)
  c.fillStyle = '#FFD700';
  c.beginPath();
  c.ellipse(-w * 0.08, -h * 0.4, w * 0.05, h * 0.04, 0, 0, Math.PI * 2);
  c.ellipse(w * 0.08, -h * 0.4, w * 0.05, h * 0.04, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#000';
  c.fillRect(-w * 0.1, -h * 0.41, w * 0.04, h * 0.02);
  c.fillRect(w * 0.06, -h * 0.41, w * 0.04, h * 0.02);
  
  // Tail (short)
  c.fillStyle = bodyColor;
  c.beginPath();
  c.ellipse(-w * 0.35, -h * 0.05, w * 0.06, h * 0.08, -0.5, 0, Math.PI * 2);
  c.fill();
  
  // Bleat stun effect for special variant
  if (isSpecial && ctx.abilityReady) {
    drawBleatEffect(c, w, h);
  }
  
  c.restore();
}

// Helper functions for eyes and effects

function drawEyes(c: CanvasRenderingContext2D, w: number, h: number, isStressed: boolean, isConfused: boolean): void {
  if (isConfused) {
    // Spiral eyes
    c.strokeStyle = '#000';
    c.lineWidth = 1.5;
    drawSpiral(c, -w * 0.1, -h * 0.38, 6);
    drawSpiral(c, w * 0.1, -h * 0.38, 6);
  } else {
    // Normal eyes
    c.fillStyle = '#FFF';
    c.beginPath();
    c.ellipse(-w * 0.1, -h * 0.38, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
    c.ellipse(w * 0.1, -h * 0.38, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
    c.fill();
    
    const shake = isStressed ? (Math.random() - 0.5) * 2 : 0;
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(-w * 0.1 + shake, -h * 0.38, 2.5, 0, Math.PI * 2);
    c.arc(w * 0.1 + shake, -h * 0.38, 2.5, 0, Math.PI * 2);
    c.fill();
  }
}

function drawChickenEyes(c: CanvasRenderingContext2D, w: number, h: number, isStressed: boolean, isConfused: boolean): void {
  if (isConfused) {
    drawSpiral(c, -w * 0.05, -h * 0.38, 5);
    drawSpiral(c, w * 0.08, -h * 0.38, 5);
  } else {
    c.fillStyle = '#FFF';
    c.beginPath();
    c.arc(-w * 0.05, -h * 0.38, w * 0.05, 0, Math.PI * 2);
    c.fill();
    
    const shake = isStressed ? (Math.random() - 0.5) * 2 : 0;
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(-w * 0.05 + shake, -h * 0.38, 2, 0, Math.PI * 2);
    c.fill();
  }
}

function drawPigEyes(c: CanvasRenderingContext2D, w: number, h: number, isStressed: boolean, isConfused: boolean): void {
  if (isConfused) {
    drawSpiral(c, -w * 0.12, -h * 0.28, 5);
    drawSpiral(c, w * 0.12, -h * 0.28, 5);
  } else {
    c.fillStyle = '#000';
    const shake = isStressed ? (Math.random() - 0.5) * 2 : 0;
    c.beginPath();
    c.arc(-w * 0.12 + shake, -h * 0.28, 3, 0, Math.PI * 2);
    c.arc(w * 0.12 + shake, -h * 0.28, 3, 0, Math.PI * 2);
    c.fill();
  }
}

function drawSheepEyes(c: CanvasRenderingContext2D, w: number, h: number, isStressed: boolean, isConfused: boolean): void {
  if (isConfused) {
    c.strokeStyle = '#FFF';
    drawSpiral(c, -w * 0.08, -h * 0.38, 5);
    drawSpiral(c, w * 0.08, -h * 0.38, 5);
  } else {
    c.fillStyle = '#000';
    const shake = isStressed ? (Math.random() - 0.5) * 2 : 0;
    c.beginPath();
    c.arc(-w * 0.08 + shake, -h * 0.38, 3, 0, Math.PI * 2);
    c.arc(w * 0.08 + shake, -h * 0.38, 3, 0, Math.PI * 2);
    c.fill();
  }
}

function drawDuckEyes(c: CanvasRenderingContext2D, w: number, h: number, isStressed: boolean, isConfused: boolean): void {
  if (isConfused) {
    drawSpiral(c, w * 0.05, -h * 0.35, 5);
  } else {
    c.fillStyle = '#000';
    const shake = isStressed ? (Math.random() - 0.5) * 2 : 0;
    c.beginPath();
    c.arc(w * 0.05 + shake, -h * 0.35, 3, 0, Math.PI * 2);
    c.fill();
  }
}

function drawSpiral(c: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  c.beginPath();
  const rotationOffset = Date.now() / 200;
  for (let i = 0; i < 3 * Math.PI; i += 0.1) {
    const r = (i / (3 * Math.PI)) * radius;
    const x = cx + r * Math.cos(i + rotationOffset);
    const y = cy + r * Math.sin(i + rotationOffset);
    if (i === 0) {
      c.moveTo(x, y);
    } else {
      c.lineTo(x, y);
    }
  }
  c.stroke();
}

function drawConfusionStars(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 500;
  c.fillStyle = '#FFD700';
  
  for (let i = 0; i < 3; i++) {
    const angle = time + (i * Math.PI * 2) / 3;
    const sx = Math.cos(angle) * w * 0.4;
    const sy = -h * 0.6 + Math.sin(angle * 2) * h * 0.1;
    
    c.save();
    c.translate(sx, sy);
    c.rotate(time * 2);
    
    // Simple star
    c.beginPath();
    for (let j = 0; j < 5; j++) {
      const starAngle = (j * Math.PI * 2) / 5 - Math.PI / 2;
      const r = j % 2 === 0 ? 5 : 2;
      if (j === 0) {
        c.moveTo(Math.cos(starAngle) * r, Math.sin(starAngle) * r);
      } else {
        c.lineTo(Math.cos(starAngle) * r, Math.sin(starAngle) * r);
      }
    }
    c.closePath();
    c.fill();
    c.restore();
  }
}

// Special ability effect functions

function drawPoopReadyEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 200;
  c.fillStyle = `rgba(107, 68, 35, ${0.3 + Math.sin(time) * 0.2})`;
  
  // Stink lines
  c.strokeStyle = 'rgba(107, 68, 35, 0.5)';
  c.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(time + i) * 5;
    c.beginPath();
    c.moveTo(-w * 0.3 + i * w * 0.15, h * 0.2);
    c.quadraticCurveTo(-w * 0.3 + i * w * 0.15 + offset, h * 0.35, -w * 0.3 + i * w * 0.15, h * 0.5);
    c.stroke();
  }
}

function drawGoldenGlow(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 150;
  const gradient = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.8);
  gradient.addColorStop(0, `rgba(255, 215, 0, ${0.3 + Math.sin(time) * 0.15})`);
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  c.fillStyle = gradient;
  c.beginPath();
  c.arc(0, 0, w * 0.8, 0, Math.PI * 2);
  c.fill();
}

function drawMudEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 300;
  c.fillStyle = `rgba(107, 68, 35, ${0.4 + Math.sin(time) * 0.2})`;
  
  // Mud splatter particles
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + time * 0.5;
    const dist = w * 0.4 + Math.sin(time + i) * 10;
    const mx = Math.cos(angle) * dist;
    const my = Math.sin(angle) * dist * 0.5 + h * 0.2;
    c.beginPath();
    c.arc(mx, my, 4 + Math.random() * 3, 0, Math.PI * 2);
    c.fill();
  }
}

function drawWoolShieldEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 200;
  c.strokeStyle = `rgba(245, 245, 245, ${0.6 + Math.sin(time) * 0.2})`;
  c.lineWidth = 3;
  
  // Protective wool circle
  c.beginPath();
  c.arc(0, 0, w * 0.6 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
  c.stroke();
}

function drawFeatherEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 400;
  c.fillStyle = 'rgba(255, 255, 255, 0.7)';
  
  // Floating feathers
  for (let i = 0; i < 4; i++) {
    const fx = Math.sin(time + i * 1.5) * w * 0.5;
    const fy = -h * 0.3 - i * h * 0.15 + Math.cos(time * 0.5 + i) * 10;
    
    c.save();
    c.translate(fx, fy);
    c.rotate(Math.sin(time + i) * 0.5);
    c.beginPath();
    c.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

function drawHoneyGlow(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 200;
  const gradient = c.createRadialGradient(0, h * 0.3, 0, 0, h * 0.3, w * 0.6);
  gradient.addColorStop(0, `rgba(255, 193, 7, ${0.4 + Math.sin(time) * 0.2})`);
  gradient.addColorStop(1, 'rgba(255, 193, 7, 0)');
  c.fillStyle = gradient;
  c.beginPath();
  c.ellipse(0, h * 0.3, w * 0.6, h * 0.3, 0, 0, Math.PI * 2);
  c.fill();
}

function drawHayEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 300;
  c.fillStyle = '#DAA520';
  
  // Floating hay strands
  for (let i = 0; i < 6; i++) {
    const hx = Math.sin(time + i * 1.2) * w * 0.6;
    const hy = -h * 0.4 - i * h * 0.1 + Math.cos(time * 0.7 + i) * 15;
    
    c.save();
    c.translate(hx, hy);
    c.rotate(Math.sin(time + i) * 0.8);
    c.fillRect(-6, -1, 12, 2);
    c.restore();
  }
}

function drawCrowCallEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 100;
  c.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time) * 0.3})`;
  c.lineWidth = 2;
  
  // Sound waves
  for (let i = 0; i < 3; i++) {
    const radius = w * 0.3 + i * w * 0.15 + Math.sin(time) * 5;
    c.beginPath();
    c.arc(w * 0.2, -h * 0.3, radius, -0.5, 0.5);
    c.stroke();
  }
}

function drawBleatEffect(c: CanvasRenderingContext2D, w: number, h: number): void {
  const time = Date.now() / 150;
  c.strokeStyle = `rgba(128, 128, 128, ${0.4 + Math.sin(time) * 0.2})`;
  c.lineWidth = 3;
  
  // Sound wave rings
  for (let i = 0; i < 2; i++) {
    const radius = w * 0.5 + i * w * 0.2 + Math.sin(time * 2) * 8;
    c.beginPath();
    c.arc(0, -h * 0.35, radius, 0, Math.PI * 2);
    c.stroke();
  }
}
