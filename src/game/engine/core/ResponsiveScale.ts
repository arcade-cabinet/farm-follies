/**
 * ResponsiveScale - Handles responsive scaling for different screen sizes
 * 
 * Reference: iPhone SE portrait (375x667) = scale 1.0
 */

import { GAME_CONFIG } from '../../config';

export interface ScaleFactors {
  /** Overall scale factor (0.65 - 1.5) */
  factor: number;
  
  /** Scaled entity dimensions */
  entityWidth: number;
  entityHeight: number;
  
  /** Scaled layout dimensions */
  bankWidth: number;
  safeZoneTop: number;
  
  /** Physics adjustments */
  catchTolerance: number;
  
  /** Touch target scale for mobile */
  touchScale: number;
  
  /** Whether in portrait orientation */
  isPortrait: boolean;
  
  /** Screen dimensions */
  screenWidth: number;
  screenHeight: number;
}

const { layout } = GAME_CONFIG;

/**
 * Calculate responsive scale factors for given screen dimensions
 */
export function calculateScale(width: number, height: number): ScaleFactors {
  const minDim = Math.min(width, height);
  const isPortrait = height > width;
  
  // Base reference: 375px width (iPhone SE)
  let factor: number;
  
  if (isPortrait) {
    // Portrait: scale based on width, with minimum playable area
    factor = Math.max(0.65, Math.min(1.4, width / 375));
  } else {
    // Landscape: more generous scaling
    factor = Math.max(0.7, Math.min(1.5, minDim / 400));
  }
  
  // Entity size scales with factor but has hard limits for playability
  const baseEntityWidth = GAME_CONFIG.animal.width;
  const baseEntityHeight = GAME_CONFIG.animal.height;
  const entityWidth = Math.max(45, Math.min(100, baseEntityWidth * factor));
  const entityHeight = Math.max(40, Math.min(85, baseEntityHeight * factor));
  
  // Bank width scales but stays usable
  const bankWidth = Math.max(45, Math.min(80, layout.bankWidth * factor));
  
  // Safe zone scales with screen
  const safeZoneTop = Math.max(50, Math.min(120, layout.safeZoneTop * factor));
  
  // Catch tolerance increases on smaller screens for better UX
  const catchTolerance = factor < 0.85 ? 1.2 : 1.0;
  
  // Touch targets are larger on mobile
  const touchScale = width < 500 ? 1.25 : 1.0;
  
  return {
    factor,
    entityWidth,
    entityHeight,
    bankWidth,
    safeZoneTop,
    catchTolerance,
    touchScale,
    isPortrait,
    screenWidth: width,
    screenHeight: height,
  };
}

/**
 * Get playable area bounds (excluding bank zone)
 */
export function getPlayableArea(scale: ScaleFactors): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
} {
  const padding = scale.entityWidth / 2 + 10;
  return {
    minX: padding,
    maxX: scale.screenWidth - scale.bankWidth - padding,
    minY: scale.safeZoneTop,
    maxY: scale.screenHeight * layout.floorY,
    width: scale.screenWidth - scale.bankWidth - padding * 2,
    height: scale.screenHeight * layout.floorY - scale.safeZoneTop,
  };
}

/**
 * Scale a value by the current scale factor
 */
export function scaleValue(value: number, scale: ScaleFactors): number {
  return value * scale.factor;
}

/**
 * Scale a position to screen coordinates
 */
export function scalePosition(
  x: number,
  y: number,
  scale: ScaleFactors
): { x: number; y: number } {
  return {
    x: x * scale.factor,
    y: y * scale.factor,
  };
}

/**
 * Check if a point is within the playable area
 */
export function isInPlayableArea(
  x: number,
  y: number,
  scale: ScaleFactors
): boolean {
  const area = getPlayableArea(scale);
  return x >= area.minX && x <= area.maxX && y >= area.minY && y <= area.maxY;
}

/**
 * Clamp a position to the playable area
 */
export function clampToPlayableArea(
  x: number,
  y: number,
  scale: ScaleFactors
): { x: number; y: number } {
  const area = getPlayableArea(scale);
  return {
    x: Math.max(area.minX, Math.min(area.maxX, x)),
    y: Math.max(area.minY, Math.min(area.maxY, y)),
  };
}

/**
 * Create a ResizeObserver-based scale updater
 */
export function createScaleObserver(
  element: HTMLElement,
  onScaleChange: (scale: ScaleFactors) => void
): () => void {
  let currentScale = calculateScale(element.clientWidth, element.clientHeight);
  onScaleChange(currentScale);
  
  const handleResize = () => {
    const newScale = calculateScale(element.clientWidth, element.clientHeight);
    if (
      newScale.screenWidth !== currentScale.screenWidth ||
      newScale.screenHeight !== currentScale.screenHeight
    ) {
      currentScale = newScale;
      onScaleChange(currentScale);
    }
  };
  
  // Use ResizeObserver if available, fallback to window resize
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(handleResize);
    observer.observe(element);
    return () => observer.disconnect();
  } else {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }
}
