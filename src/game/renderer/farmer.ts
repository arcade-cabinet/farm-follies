/**
 * Farm Follies Farmer Renderer
 * Procedural drawing of the player's farmer character
 */

import { FARM_COLORS } from '../config';

interface FarmerDrawOptions {
  width: number;
  height: number;
  stress: number;      // 0-1, how much the farmer is panicking
  isCarrying: boolean; // Has animals stacked
  stackHeight: number; // Number of animals carried
  wobbleOffset: number; // Current wobble amount
}

/**
 * Draw the farmer (player character)
 * A procedurally generated farmer with a straw hat
 */
export function drawFarmer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: FarmerDrawOptions
): void {
  const { width: w, height: h, stress, isCarrying, stackHeight, wobbleOffset } = options;
  
  ctx.save();
  ctx.translate(x, y);
  
  // Apply wobble rotation
  ctx.rotate(wobbleOffset * 0.02);
  
  const time = Date.now();
  const breathe = Math.sin(time / 500) * 2;
  const panicShake = stress > 0.5 ? (Math.random() - 0.5) * stress * 4 : 0;
  
  // Colors
  const skinTone = '#DEB887';      // Burlywood (tan)
  const overallsColor = '#4169E1'; // Royal blue
  const shirtColor = '#B22222';    // Firebrick (red plaid base)
  const hatStraw = '#DAA520';      // Goldenrod
  const hatBand = '#8B4513';       // Saddle brown
  const bootColor = '#2F1810';     // Dark brown
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, h / 2 - 5, w / 2, h / 8, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Boots
  ctx.fillStyle = bootColor;
  const bootWiggle = isCarrying ? Math.sin(time / 200) * 2 : 0;
  ctx.beginPath();
  ctx.roundRect(-w * 0.28 + bootWiggle, h * 0.32, w * 0.2, h * 0.18, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(w * 0.08 - bootWiggle, h * 0.32, w * 0.2, h * 0.18, 3);
  ctx.fill();
  
  // Legs (overalls)
  ctx.fillStyle = overallsColor;
  ctx.strokeStyle = '#1E3A5F';
  ctx.lineWidth = 1;
  ctx.fillRect(-w * 0.25 + bootWiggle, h * 0.1, w * 0.18, h * 0.25);
  ctx.fillRect(w * 0.07 - bootWiggle, h * 0.1, w * 0.18, h * 0.25);
  
  // Body (shirt)
  ctx.fillStyle = shirtColor;
  ctx.beginPath();
  ctx.ellipse(0 + panicShake, -h * 0.05 + breathe, w * 0.32, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Plaid pattern on shirt
  ctx.strokeStyle = '#8B0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-w * 0.25, -h * 0.15);
  ctx.lineTo(w * 0.25, -h * 0.15);
  ctx.moveTo(-w * 0.25, 0);
  ctx.lineTo(w * 0.25, 0);
  ctx.moveTo(-w * 0.1, -h * 0.25);
  ctx.lineTo(-w * 0.1, h * 0.1);
  ctx.moveTo(w * 0.1, -h * 0.25);
  ctx.lineTo(w * 0.1, h * 0.1);
  ctx.stroke();
  
  // Overalls bib
  ctx.fillStyle = overallsColor;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, h * 0.1);
  ctx.lineTo(-w * 0.15, -h * 0.1);
  ctx.lineTo(w * 0.15, -h * 0.1);
  ctx.lineTo(w * 0.18, h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1E3A5F';
  ctx.stroke();
  
  // Overall straps
  ctx.strokeStyle = overallsColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-w * 0.12, -h * 0.1);
  ctx.lineTo(-w * 0.18, -h * 0.2);
  ctx.moveTo(w * 0.12, -h * 0.1);
  ctx.lineTo(w * 0.18, -h * 0.2);
  ctx.stroke();
  
  // Overall buttons
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(-w * 0.12, -h * 0.1, 3, 0, Math.PI * 2);
  ctx.arc(w * 0.12, -h * 0.1, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Arms
  ctx.fillStyle = shirtColor;
  const armRaise = isCarrying ? -h * 0.05 - stackHeight * 2 : 0;
  const armPanic = stress > 0.7 ? Math.sin(time / 50) * 5 : 0;
  
  // Left arm
  ctx.beginPath();
  ctx.ellipse(
    -w * 0.38 + panicShake + armPanic, 
    -h * 0.1 + armRaise, 
    w * 0.1, 
    h * 0.15, 
    0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  
  // Right arm
  ctx.beginPath();
  ctx.ellipse(
    w * 0.38 + panicShake - armPanic, 
    -h * 0.1 + armRaise, 
    w * 0.1, 
    h * 0.15, 
    -0.4, 
    0, 
    Math.PI * 2
  );
  ctx.fill();
  
  // Hands
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.arc(-w * 0.42 + panicShake + armPanic, -h * 0.05 + armRaise, w * 0.06, 0, Math.PI * 2);
  ctx.arc(w * 0.42 + panicShake - armPanic, -h * 0.05 + armRaise, w * 0.06, 0, Math.PI * 2);
  ctx.fill();
  
  // Neck
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.ellipse(0 + panicShake, -h * 0.25, w * 0.08, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head
  ctx.fillStyle = skinTone;
  ctx.strokeStyle = '#8B7355';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0 + panicShake, -h * 0.4, w * 0.22, h * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Ears
  ctx.beginPath();
  ctx.ellipse(-w * 0.22 + panicShake, -h * 0.4, w * 0.04, h * 0.06, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.22 + panicShake, -h * 0.4, w * 0.04, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Face details
  drawFarmerFace(ctx, w, h, stress, panicShake);
  
  // Straw Hat
  drawStrawHat(ctx, w, h, panicShake, stress, hatStraw, hatBand);
  
  // Sweat drops when stressed
  if (stress > 0.3) {
    drawSweatDrops(ctx, w, h, stress, panicShake);
  }
  
  ctx.restore();
}

/**
 * Draw farmer's face
 */
function drawFarmerFace(
  ctx: CanvasRenderingContext2D, 
  w: number, 
  h: number, 
  stress: number,
  panicShake: number
): void {
  const time = Date.now();
  
  // Eyes
  const eyeY = -h * 0.42;
  const eyeSpacing = w * 0.1;
  
  // Eye whites
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.ellipse(-eyeSpacing + panicShake, eyeY, w * 0.06, h * 0.04, 0, 0, Math.PI * 2);
  ctx.ellipse(eyeSpacing + panicShake, eyeY, w * 0.06, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils - look around when stressed
  let pupilOffsetX = 0;
  let pupilOffsetY = 0;
  
  if (stress > 0.5) {
    pupilOffsetX = Math.sin(time / 100) * 3;
    pupilOffsetY = Math.cos(time / 150) * 2;
  }
  
  ctx.fillStyle = '#4A3728';
  const pupilSize = stress > 0.7 ? 2 : 3; // Pupils shrink when panicked
  ctx.beginPath();
  ctx.arc(-eyeSpacing + panicShake + pupilOffsetX, eyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.arc(eyeSpacing + panicShake + pupilOffsetX, eyeY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyebrows
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  const browRaise = stress > 0.5 ? -3 : 0;
  const browAngle = stress > 0.7 ? 0.3 : 0;
  
  ctx.save();
  ctx.translate(-eyeSpacing + panicShake, eyeY - h * 0.06 + browRaise);
  ctx.rotate(-browAngle);
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, 0);
  ctx.lineTo(w * 0.04, 0);
  ctx.stroke();
  ctx.restore();
  
  ctx.save();
  ctx.translate(eyeSpacing + panicShake, eyeY - h * 0.06 + browRaise);
  ctx.rotate(browAngle);
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, 0);
  ctx.lineTo(w * 0.04, 0);
  ctx.stroke();
  ctx.restore();
  
  // Nose
  ctx.fillStyle = '#C9A86C';
  ctx.beginPath();
  ctx.ellipse(panicShake, -h * 0.38, w * 0.04, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  if (stress > 0.7) {
    // Panicked open mouth
    ctx.fillStyle = '#2F1810';
    ctx.beginPath();
    ctx.ellipse(panicShake, -h * 0.32, w * 0.06, h * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (stress > 0.3) {
    // Worried grimace
    ctx.beginPath();
    ctx.moveTo(-w * 0.08 + panicShake, -h * 0.32);
    ctx.quadraticCurveTo(panicShake, -h * 0.3, w * 0.08 + panicShake, -h * 0.32);
    ctx.stroke();
  } else {
    // Normal slight smile
    ctx.beginPath();
    ctx.arc(panicShake, -h * 0.35, w * 0.06, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  
  // Stubble/5 o'clock shadow
  ctx.fillStyle = 'rgba(101, 67, 33, 0.2)';
  ctx.beginPath();
  ctx.ellipse(panicShake, -h * 0.32, w * 0.12, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw the iconic straw hat
 */
function drawStrawHat(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  panicShake: number,
  stress: number,
  strawColor: string,
  bandColor: string
): void {
  const time = Date.now();
  const hatTilt = stress > 0.5 ? Math.sin(time / 200) * 0.1 : 0;
  
  ctx.save();
  ctx.translate(panicShake, -h * 0.52);
  ctx.rotate(hatTilt);
  
  // Hat brim (wide oval)
  ctx.fillStyle = strawColor;
  ctx.strokeStyle = '#B8860B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.42, h * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Straw texture on brim
  ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * w * 0.15, Math.sin(angle) * h * 0.03);
    ctx.lineTo(Math.cos(angle) * w * 0.4, Math.sin(angle) * h * 0.07);
    ctx.stroke();
  }
  
  // Hat crown (dome)
  ctx.fillStyle = strawColor;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.08, w * 0.18, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Crown top
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.16, w * 0.12, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Hat band
  ctx.fillStyle = bandColor;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.02, w * 0.19, h * 0.025, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Little bow/knot on the band
  ctx.fillStyle = bandColor;
  ctx.beginPath();
  ctx.ellipse(w * 0.15, -h * 0.02, w * 0.04, h * 0.02, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(w * 0.2, -h * 0.025, w * 0.03, h * 0.015, -0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // Straw strands sticking out
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, -h * 0.18);
  ctx.lineTo(-w * 0.12, -h * 0.25);
  ctx.moveTo(w * 0.05, -h * 0.18);
  ctx.lineTo(w * 0.08, -h * 0.24);
  ctx.stroke();
  
  ctx.restore();
}

/**
 * Draw sweat drops when stressed
 */
function drawSweatDrops(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stress: number,
  panicShake: number
): void {
  const time = Date.now();
  const dropCount = Math.floor(stress * 4);
  
  ctx.fillStyle = 'rgba(135, 206, 250, 0.8)';
  
  for (let i = 0; i < dropCount; i++) {
    const dropPhase = (time / 500 + i * 0.5) % 1;
    const startX = -w * 0.3 + i * w * 0.2 + panicShake;
    const startY = -h * 0.5;
    const dropY = startY + dropPhase * h * 0.3;
    const dropSize = 3 + (1 - dropPhase) * 2;
    
    if (dropPhase < 0.8) { // Fade out near end
      ctx.globalAlpha = 1 - dropPhase;
      ctx.beginPath();
      // Teardrop shape
      ctx.moveTo(startX, dropY - dropSize);
      ctx.quadraticCurveTo(startX + dropSize, dropY, startX, dropY + dropSize);
      ctx.quadraticCurveTo(startX - dropSize, dropY, startX, dropY - dropSize);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}

/**
 * Draw a simpler version of the farmer for the base/platform
 */
export function drawFarmerBase(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  wobbleOffset: number = 0
): void {
  drawFarmer(ctx, x, y, {
    width,
    height,
    stress: Math.abs(wobbleOffset) / 20, // Convert wobble to stress
    isCarrying: false,
    stackHeight: 0,
    wobbleOffset,
  });
}
