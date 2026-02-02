/**
 * Ability Indicator Component
 * Shows cooldown progress for stacked animal abilities
 */

import type { AbilityIndicatorData } from "../engine";
import { useResponsiveScale } from "../hooks/useResponsiveScale";

const ABILITY_STYLES: Record<string, { color: string; glow: string; label: string }> = {
  poop_shot: { color: "#8B4513", glow: "rgba(139, 69, 19, 0.6)", label: "COW" },
  egg_bomb: { color: "#FFD700", glow: "rgba(255, 215, 0, 0.6)", label: "EGG" },
  mud_splash: { color: "#A0522D", glow: "rgba(160, 82, 45, 0.6)", label: "MUD" },
  wool_shield: { color: "#F5F5F5", glow: "rgba(245, 245, 245, 0.6)", label: "WOL" },
  bleat_stun: { color: "#C4A484", glow: "rgba(196, 164, 132, 0.6)", label: "ZAP" },
  honey_trap: { color: "#FFA500", glow: "rgba(255, 165, 0, 0.6)", label: "TRP" },
  crow_call: { color: "#FF4500", glow: "rgba(255, 69, 0, 0.6)", label: "MAG" },
  hay_storm: { color: "#D2B48C", glow: "rgba(210, 180, 140, 0.6)", label: "HAY" },
  feather_float: { color: "#4FC3F7", glow: "rgba(79, 195, 247, 0.6)", label: "FLT" },
};

interface AbilityIndicatorProps {
  abilityType: string;
  cooldownPercent: number;
  isReady: boolean;
}

export function AbilityIndicator({ abilityType, cooldownPercent, isReady }: AbilityIndicatorProps) {
  const { game } = useResponsiveScale();

  const size = Math.round(36 * game);
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - cooldownPercent);

  const style = ABILITY_STYLES[abilityType] ?? {
    color: "#888",
    glow: "rgba(136,136,136,0.6)",
    label: "?",
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
        filter: isReady ? `drop-shadow(0 0 6px ${style.glow})` : "none",
        animation: isReady ? "pulse 1s ease-in-out infinite" : "none",
      }}
    >
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="rgba(0,0,0,0.4)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={style.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
        />
      </svg>

      <span
        className="game-font"
        style={{
          fontSize: size * 0.28,
          color: isReady ? style.color : "rgba(255,255,255,0.5)",
          textShadow: isReady ? `0 0 4px ${style.glow}` : "none",
        }}
      >
        {style.label}
      </span>

      {isReady && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${style.glow} 0%, transparent 70%)`,
            animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
          }}
        />
      )}
    </div>
  );
}

interface AbilityBarProps {
  indicators: AbilityIndicatorData[];
}

export function AbilityBar({ indicators }: AbilityBarProps) {
  const { spacing } = useResponsiveScale();

  if (indicators.length === 0) return null;

  return (
    <div className="flex gap-1 items-center pointer-events-none" style={{ padding: spacing.xs }}>
      {indicators.map((ind) => (
        <AbilityIndicator
          key={ind.animalId}
          abilityType={ind.abilityType}
          cooldownPercent={ind.cooldownProgress}
          isReady={ind.isReady}
        />
      ))}
    </div>
  );
}
