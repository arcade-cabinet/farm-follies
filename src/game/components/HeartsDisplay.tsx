/**
 * Farm Follies Hearts Display
 * Shows player lives as barn-themed hearts
 */

import { FARM_COLORS } from "../config";

interface HeartsDisplayProps {
  lives: number;
  maxLives: number;
}

export function HeartsDisplay({ lives, maxLives }: HeartsDisplayProps) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: maxLives }, (_, i) => (
        <Heart key={i} filled={i < lives} pulse={i === lives - 1 && lives <= 2} />
      ))}
    </div>
  );
}

interface HeartProps {
  filled: boolean;
  pulse?: boolean;
}

function Heart({ filled, pulse = false }: HeartProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-6 h-6 ${pulse ? "animate-pulse" : ""}`}
      style={{
        filter: filled ? "drop-shadow(0 1px 2px rgba(0,0,0,0.3))" : "none",
        transition: "all 0.3s ease",
      }}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? FARM_COLORS.ui.heart : FARM_COLORS.ui.heartEmpty}
        stroke={filled ? "#8B0000" : "#4A4A4A"}
        strokeWidth="1"
      />
      {/* Little barn symbol inside heart when filled */}
      {filled && (
        <g transform="translate(8, 7) scale(0.35)">
          <rect x="2" y="8" width="16" height="12" fill={FARM_COLORS.barn.red} rx="1" />
          <polygon points="10,2 20,10 0,10" fill={FARM_COLORS.barn.roof} />
        </g>
      )}
    </svg>
  );
}
