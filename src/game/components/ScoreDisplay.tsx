/**
 * Farm Follies Score Display
 * HUD showing score, level, stack height, and lives
 */

import { FARM_COLORS } from '../config';
import { HeartsDisplay } from './HeartsDisplay';
import { useResponsiveScale } from '../hooks/useResponsiveScale';

interface ScoreDisplayProps {
  score: number;
  multiplier: number;
  combo: number;
  level: number;
  stackHeight: number;
  bankedAnimals: number;
  highScore: number;
  lives: number;
  maxLives: number;
  inDanger: boolean;
}

export function ScoreDisplay({
  score,
  multiplier,
  combo,
  level,
  stackHeight,
  bankedAnimals,
  highScore,
  lives,
  maxLives,
  inDanger,
}: ScoreDisplayProps) {
  const { fontSize, spacing } = useResponsiveScale();
  
  return (
    <div 
      className="absolute top-0 left-0 right-16 p-2 pointer-events-none"
      style={{ paddingTop: `calc(${spacing.sm} + env(safe-area-inset-top, 0px))` }}
    >
      <div className="flex justify-between items-start gap-2">
        {/* Left side - Score info */}
        <div className="flex flex-col gap-1">
          {/* Main score */}
          <div 
            className="game-font px-3 py-1 rounded-lg"
            style={{ 
              backgroundColor: 'rgba(139, 69, 19, 0.4)',
              backdropFilter: 'blur(4px)',
              border: `2px solid ${FARM_COLORS.fence.post}`,
            }}
          >
            <span 
              style={{ 
                fontSize: fontSize.xl,
                color: FARM_COLORS.ui.textLight,
                textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
              }}
            >
              {score.toLocaleString()}
            </span>
            
            {/* Multiplier indicator */}
            {multiplier > 1 && (
              <span 
                className="ml-2"
                style={{ 
                  fontSize: fontSize.sm,
                  color: FARM_COLORS.nature.corn,
                }}
              >
                ×{multiplier.toFixed(1)}
              </span>
            )}
          </div>
          
          {/* Combo indicator */}
          {combo > 1 && (
            <div 
              className="game-font px-2 py-0.5 rounded animate-pulse"
              style={{ 
                backgroundColor: FARM_COLORS.barn.red,
                color: FARM_COLORS.ui.textLight,
                fontSize: fontSize.sm,
              }}
            >
              {combo}x COMBO!
            </div>
          )}
          
          {/* Level badge */}
          <div 
            className="flex items-center gap-2 px-2 py-0.5 rounded"
            style={{ 
              backgroundColor: 'rgba(0,0,0,0.3)',
              fontSize: fontSize.xs,
              color: FARM_COLORS.ui.textLight,
            }}
          >
            <span>LVL {level}</span>
            <span style={{ color: FARM_COLORS.ground.hay }}>|</span>
            <span>
              <span style={{ color: FARM_COLORS.nature.corn }}>🌾</span> {bankedAnimals}
            </span>
          </div>
        </div>
        
        {/* Right side - Lives and stack */}
        <div className="flex flex-col items-end gap-1">
          {/* Lives */}
          <div 
            className={`px-2 py-1 rounded-lg ${inDanger ? 'animate-pulse' : ''}`}
            style={{ 
              backgroundColor: inDanger 
                ? 'rgba(220, 20, 60, 0.4)' 
                : 'rgba(139, 69, 19, 0.4)',
              backdropFilter: 'blur(4px)',
              border: `2px solid ${inDanger ? FARM_COLORS.ui.danger : FARM_COLORS.fence.post}`,
            }}
          >
            <HeartsDisplay lives={lives} maxLives={maxLives} />
          </div>
          
          {/* Stack height indicator */}
          {stackHeight > 0 && (
            <div 
              className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ 
                backgroundColor: 'rgba(0,0,0,0.3)',
                fontSize: fontSize.sm,
                color: FARM_COLORS.ui.textLight,
              }}
            >
              <span style={{ fontSize: fontSize.xs }}>📦</span>
              <span className="game-font">{stackHeight}</span>
            </div>
          )}
          
          {/* High score reference (subtle) */}
          {score > 0 && score < highScore && (
            <div 
              style={{ 
                fontSize: fontSize.xs,
                color: FARM_COLORS.ui.textLight,
                opacity: 0.5,
              }}
            >
              BEST: {highScore.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
