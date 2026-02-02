/**
 * Farm Follies Background Renderer
 * Rustic farm environment with stormy sky
 */

import { FARM_COLORS, GAME_CONFIG } from "../config";

/**
 * Draw the animated farm background
 */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rotation: number
): void {
  const time = Date.now();

  // Stormy sky gradient
  drawStormySky(ctx, width, height, time);

  // Rolling hills in background
  drawHills(ctx, width, height, time);

  // Farm field (grass)
  drawField(ctx, width, height);

  // Distant barn silhouette
  drawDistantBarn(ctx, width, height);

  // Fence posts
  drawFence(ctx, width, height);

  // Wheat/corn stalks blowing
  drawCrops(ctx, width, height, time);

  // Ground details
  drawGroundDetails(ctx, width, height, time);
}

/**
 * Draw stormy sky with clouds
 */
function drawStormySky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  // Sky gradient (stormy)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
  skyGradient.addColorStop(0, "#2D3436"); // Dark storm gray
  skyGradient.addColorStop(0.3, "#4A5568"); // Medium gray
  skyGradient.addColorStop(0.6, "#718096"); // Lighter gray
  skyGradient.addColorStop(1, "#A0AEC0"); // Light gray at horizon

  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.6);

  // Animated storm clouds
  ctx.fillStyle = "rgba(45, 52, 54, 0.6)";

  for (let i = 0; i < 5; i++) {
    const cloudX = ((time / 50 + i * 200) % (width + 200)) - 100;
    const cloudY = 30 + Math.sin(i * 1.5) * 20;
    const cloudSize = 80 + i * 20;

    // Cloud puffs
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, cloudSize * 0.5, 0, Math.PI * 2);
    ctx.arc(cloudX + cloudSize * 0.3, cloudY - 10, cloudSize * 0.4, 0, Math.PI * 2);
    ctx.arc(cloudX + cloudSize * 0.6, cloudY, cloudSize * 0.45, 0, Math.PI * 2);
    ctx.arc(cloudX + cloudSize * 0.35, cloudY + 15, cloudSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional lightning flash
  if (Math.random() < 0.001) {
    ctx.fillStyle = "rgba(255, 255, 200, 0.2)";
    ctx.fillRect(0, 0, width, height * 0.6);
  }
}

/**
 * Draw rolling hills
 */
function drawHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  const hillY = height * 0.45;

  // Far hills (darker)
  ctx.fillStyle = "#1a4731";
  ctx.beginPath();
  ctx.moveTo(0, hillY + 50);

  for (let x = 0; x <= width; x += 20) {
    const hillHeight = Math.sin(x / 150) * 30 + Math.sin(x / 80) * 15;
    ctx.lineTo(x, hillY + hillHeight);
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Near hills (lighter green)
  ctx.fillStyle = "#22543d";
  ctx.beginPath();
  ctx.moveTo(0, hillY + 80);

  for (let x = 0; x <= width; x += 15) {
    const hillHeight = Math.sin(x / 120 + 1) * 25 + Math.sin(x / 60) * 12;
    ctx.lineTo(x, hillY + 60 + hillHeight);
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the grass field
 */
function drawField(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const fieldY = height * 0.55;

  // Main grass area
  const grassGradient = ctx.createLinearGradient(0, fieldY, 0, height);
  grassGradient.addColorStop(0, "#2d6a4f"); // Darker green at top
  grassGradient.addColorStop(0.3, "#40916c"); // Medium green
  grassGradient.addColorStop(0.7, "#52b788"); // Lighter green
  grassGradient.addColorStop(1, "#74c69d"); // Lightest at bottom (closer)

  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, fieldY, width, height - fieldY);

  // Grass texture lines
  ctx.strokeStyle = "rgba(29, 90, 67, 0.3)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 50; i++) {
    const gx = Math.random() * width;
    const gy = fieldY + Math.random() * (height - fieldY);
    const gh = 5 + Math.random() * 10;

    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (Math.random() - 0.5) * 3, gy - gh);
    ctx.stroke();
  }
}

/**
 * Draw distant barn
 */
function drawDistantBarn(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const barnX = width * 0.15;
  const barnY = height * 0.48;
  const barnW = 60;
  const barnH = 40;

  // Barn body (dark red, silhouette-like)
  ctx.fillStyle = "#5c1a1a";
  ctx.fillRect(barnX - barnW / 2, barnY - barnH, barnW, barnH);

  // Barn roof
  ctx.fillStyle = "#3d1212";
  ctx.beginPath();
  ctx.moveTo(barnX - barnW / 2 - 5, barnY - barnH);
  ctx.lineTo(barnX, barnY - barnH - 25);
  ctx.lineTo(barnX + barnW / 2 + 5, barnY - barnH);
  ctx.closePath();
  ctx.fill();

  // Silo
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(barnX + barnW / 2 + 5, barnY - barnH - 15, 15, barnH + 15);

  // Silo top
  ctx.beginPath();
  ctx.arc(barnX + barnW / 2 + 12.5, barnY - barnH - 15, 7.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw fence posts
 */
function drawFence(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const fenceY = height * 0.75;
  const postSpacing = 80;
  const postHeight = 35;

  ctx.strokeStyle = FARM_COLORS.fence.post;
  ctx.fillStyle = FARM_COLORS.fence.post;
  ctx.lineWidth = 3;

  // Horizontal rails
  ctx.beginPath();
  ctx.moveTo(0, fenceY - postHeight * 0.3);
  ctx.lineTo(width, fenceY - postHeight * 0.3);
  ctx.moveTo(0, fenceY - postHeight * 0.7);
  ctx.lineTo(width, fenceY - postHeight * 0.7);
  ctx.stroke();

  // Posts
  for (let x = postSpacing / 2; x < width; x += postSpacing) {
    // Post shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x + 3, fenceY - postHeight + 5, 6, postHeight);

    // Post
    ctx.fillStyle = FARM_COLORS.fence.post;
    ctx.fillRect(x - 3, fenceY - postHeight, 6, postHeight);

    // Post top (rounded)
    ctx.beginPath();
    ctx.arc(x, fenceY - postHeight, 4, 0, Math.PI, true);
    ctx.fill();
  }
}

/**
 * Draw crops (wheat/corn) blowing in wind
 */
function drawCrops(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  const cropY = height * 0.82;

  ctx.strokeStyle = FARM_COLORS.nature.wheat;
  ctx.lineWidth = 2;

  for (let i = 0; i < 40; i++) {
    const cx = (i / 40) * width + Math.sin(i) * 20;
    const windSway = Math.sin(time / 300 + i * 0.5) * 8;
    const cropHeight = 20 + Math.random() * 15;

    ctx.beginPath();
    ctx.moveTo(cx, cropY);
    ctx.quadraticCurveTo(
      cx + windSway,
      cropY - cropHeight * 0.6,
      cx + windSway * 1.5,
      cropY - cropHeight
    );
    ctx.stroke();

    // Wheat head
    if (Math.random() > 0.5) {
      ctx.fillStyle = FARM_COLORS.nature.wheat;
      ctx.beginPath();
      ctx.ellipse(
        cx + windSway * 1.5,
        cropY - cropHeight - 5,
        3,
        6,
        windSway * 0.05,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

/**
 * Draw ground details (dirt patches, small rocks)
 */
function drawGroundDetails(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
): void {
  const groundY = height * 0.88;

  // Dirt path area
  ctx.fillStyle = FARM_COLORS.ground.dirt;
  ctx.globalAlpha = 0.3;

  ctx.beginPath();
  ctx.ellipse(width * 0.5, groundY, width * 0.4, height * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;

  // Small rocks
  ctx.fillStyle = "#6B7280";
  for (let i = 0; i < 15; i++) {
    const rx = Math.random() * width;
    const ry = groundY + Math.random() * (height - groundY) * 0.8;
    const rSize = 2 + Math.random() * 4;

    ctx.beginPath();
    ctx.ellipse(rx, ry, rSize, rSize * 0.6, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }

  // Mud puddles (occasional)
  if (Math.floor(time / 5000) % 2 === 0) {
    ctx.fillStyle = "rgba(107, 68, 35, 0.4)";
    ctx.beginPath();
    ctx.ellipse(width * 0.3, groundY + 20, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(width * 0.7, groundY + 15, 25, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw the platform/ground area where animals land
 */
export function drawPlatform(
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  entityHeight: number
): void {
  // Dirt platform
  ctx.fillStyle = FARM_COLORS.ground.dirt;
  ctx.fillRect(0, baseY + entityHeight / 2, width, 1000);

  // Hay scattered on platform
  ctx.fillStyle = FARM_COLORS.ground.hay;
  for (let i = 0; i < 20; i++) {
    const hx = Math.random() * width;
    const hy = baseY + entityHeight / 2 + Math.random() * 30;

    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillRect(-8, -1, 16, 2);
    ctx.restore();
  }
}
