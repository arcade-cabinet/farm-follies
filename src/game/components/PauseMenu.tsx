/**
 * Farm Follies Pause Menu
 * Rustic farm-themed pause screen with UI audio feedback
 */

import { useCallback } from "react";
import { FARM_COLORS } from "../config";
import { useUISound } from "../hooks/useUISound";

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
  onRestart: () => void;
  score: number;
  level: number;
}

export function PauseMenu({
  onResume,
  onMainMenu,
  onRestart,
  score,
  level,
}: PauseMenuProps) {
  const { playClick, playBack } = useUISound();

  const handleResume = useCallback(() => {
    playClick();
    onResume();
  }, [playClick, onResume]);

  const handleRestart = useCallback(() => {
    playClick();
    onRestart();
  }, [playClick, onRestart]);

  const handleQuit = useCallback(() => {
    playBack();
    onMainMenu();
  }, [playBack, onMainMenu]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full"
        style={{
          backgroundColor: FARM_COLORS.barn.trim,
          border: `4px solid ${FARM_COLORS.fence.post}`,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Barn door decoration at top */}
        <div className="flex justify-center mb-4">
          <div
            className="w-16 h-20 rounded-t-full relative"
            style={{
              backgroundColor: FARM_COLORS.barn.red,
              border: `3px solid ${FARM_COLORS.barn.roof}`,
            }}
          >
            {/* Door cross pattern */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                borderTop: `2px solid ${FARM_COLORS.barn.roof}`,
                top: "50%",
              }}
            />
            <div
              className="absolute top-0 bottom-0 left-1/2 w-0"
              style={{
                borderLeft: `2px solid ${FARM_COLORS.barn.roof}`,
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h2
          className="game-font text-3xl text-center mb-4"
          style={{
            color: FARM_COLORS.barn.red,
            textShadow: `2px 2px 0 ${FARM_COLORS.barn.roof}`,
          }}
        >
          PAUSED
        </h2>

        {/* Current stats */}
        <div
          className="flex justify-around mb-6 py-2 rounded-lg"
          style={{ backgroundColor: "rgba(139, 69, 19, 0.1)" }}
        >
          <div className="text-center">
            <p
              className="text-xs"
              style={{ color: FARM_COLORS.ui.text, opacity: 0.6 }}
            >
              SCORE
            </p>
            <p
              className="game-font text-lg"
              style={{ color: FARM_COLORS.ui.text }}
            >
              {score.toLocaleString()}
            </p>
          </div>
          <div
            className="w-px"
            style={{ backgroundColor: FARM_COLORS.fence.post }}
          />
          <div className="text-center">
            <p
              className="text-xs"
              style={{ color: FARM_COLORS.ui.text, opacity: 0.6 }}
            >
              LEVEL
            </p>
            <p
              className="game-font text-lg"
              style={{ color: FARM_COLORS.ui.text }}
            >
              {level}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {/* Resume button */}
          <button
            onClick={handleResume}
            className="w-full py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: FARM_COLORS.ground.grass,
              boxShadow: `0 4px 0 ${FARM_COLORS.nature.bushDark}`,
            }}
          >
            <span
              className="game-font text-xl"
              style={{
                color: FARM_COLORS.ui.textLight,
                textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
              }}
            >
              RESUME
            </span>
          </button>

          {/* Restart button */}
          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: FARM_COLORS.barn.wood,
              boxShadow: `0 4px 0 ${FARM_COLORS.barn.roof}`,
            }}
          >
            <span
              className="game-font text-xl"
              style={{
                color: FARM_COLORS.ui.textLight,
                textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
              }}
            >
              RESTART
            </span>
          </button>

          {/* Main menu button */}
          <button
            onClick={handleQuit}
            className="w-full py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: FARM_COLORS.barn.red,
              boxShadow: `0 4px 0 ${FARM_COLORS.barn.roof}`,
            }}
          >
            <span
              className="game-font text-xl"
              style={{
                color: FARM_COLORS.ui.textLight,
                textShadow: "1px 1px 0 rgba(0,0,0,0.3)",
              }}
            >
              QUIT TO MENU
            </span>
          </button>
        </div>

        {/* Hint */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: FARM_COLORS.ui.text, opacity: 0.5 }}
        >
          Press ESC to resume
        </p>
      </div>
    </div>
  );
}

/**
 * Pause Button Component
 */
export function PauseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pointer-events-auto p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
      style={{
        backgroundColor: "rgba(139, 69, 19, 0.6)",
        backdropFilter: "blur(4px)",
      }}
      aria-label="Pause game"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6"
        fill={FARM_COLORS.ui.textLight}
      >
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    </button>
  );
}
