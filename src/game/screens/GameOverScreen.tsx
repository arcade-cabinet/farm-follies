/**
 * Farm Follies Game Over Screen
 * Rustic farm-themed results display with orientation-aware background
 */

import { FARM_COLORS, FAIL_MESSAGES } from "../config";
import { useMemo } from "react";
import { MenuBackground } from "../components/MenuBackground";
import { useUISound } from "../hooks/useUISound";

interface GameOverScreenProps {
  score: number;
  bankedAnimals: number; // Now represents banked animals
  highScore: number;
  isNewHighScore: boolean;
  earnedCoins: number;
  onRetry: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({
  score,
  bankedAnimals,
  highScore,
  isNewHighScore,
  earnedCoins,
  onRetry,
  onMainMenu,
}: GameOverScreenProps) {
  const failMessage = useMemo(
    () => FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)],
    []
  );
  const { playClick, playBack } = useUISound();

  const handleRetry = () => {
    playClick();
    onRetry();
  };

  const handleMainMenu = () => {
    playBack();
    onMainMenu();
  };

  return (
    <>
      {/* Full-screen background image */}
      <MenuBackground overlayOpacity={0.6} />

      <div className="relative z-10 pointer-events-auto flex flex-col items-center justify-center gap-4 p-4 max-w-md mx-auto">
        {/* Broken fence decoration */}
        <div className="relative w-32 h-8 mb-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-2 rounded-t"
              style={{
                left: `${i * 25}%`,
                height: `${15 + Math.random() * 15}px`,
                backgroundColor: FARM_COLORS.fence.post,
                transform: `rotate(${(Math.random() - 0.5) * 30}deg)`,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h2
          className="game-font text-4xl sm:text-5xl"
          style={{
            color: FARM_COLORS.ui.danger,
            textShadow: `3px 3px 0 ${FARM_COLORS.barn.roof}, -1px -1px 0 rgba(255,255,255,0.3)`,
          }}
        >
          GAME OVER
        </h2>

        {/* Fail message */}
        <p
          className="game-font text-lg text-center"
          style={{
            color: FARM_COLORS.ui.text,
            textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {failMessage}
        </p>

        {/* Score card */}
        <div
          className="w-full max-w-xs rounded-xl p-4 mt-2"
          style={{
            backgroundColor: "rgba(139, 69, 19, 0.15)",
            border: `3px solid ${FARM_COLORS.fence.post}`,
            boxShadow: "inset 0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          {/* Main score */}
          <div className="text-center mb-3">
            <p
              className="game-font text-sm mb-1"
              style={{ color: FARM_COLORS.ui.text, opacity: 0.7 }}
            >
              FINAL SCORE
            </p>
            <p
              className="game-font text-4xl"
              style={{
                color: isNewHighScore
                  ? FARM_COLORS.nature.corn
                  : FARM_COLORS.ui.text,
                textShadow: isNewHighScore
                  ? "0 0 20px rgba(255, 215, 0, 0.6)"
                  : "none",
              }}
            >
              {score.toLocaleString()}
            </p>

            {isNewHighScore && (
              <p
                className="game-font text-lg mt-1 animate-pulse"
                style={{ color: FARM_COLORS.nature.corn }}
              >
                NEW HIGH SCORE!
              </p>
            )}
          </div>

          {/* Stats grid */}
          <div
            className="grid grid-cols-2 gap-3 pt-3"
            style={{ borderTop: `2px dashed ${FARM_COLORS.fence.post}` }}
          >
            {/* Animals banked */}
            <div className="text-center">
              <p
                className="text-xs mb-1"
                style={{ color: FARM_COLORS.ui.text, opacity: 0.6 }}
              >
                ANIMALS SAVED
              </p>
              <p
                className="game-font text-2xl"
                style={{ color: FARM_COLORS.barn.red }}
              >
                {bankedAnimals}
              </p>
            </div>

            {/* Coins earned */}
            <div className="text-center">
              <p
                className="text-xs mb-1"
                style={{ color: FARM_COLORS.ui.text, opacity: 0.6 }}
              >
                COINS EARNED
              </p>
              <p
                className="game-font text-2xl"
                style={{ color: FARM_COLORS.nature.corn }}
              >
                +{earnedCoins}
              </p>
            </div>
          </div>

          {/* Best score reference */}
          {!isNewHighScore && highScore > 0 && (
            <div
              className="text-center mt-3 pt-3"
              style={{ borderTop: `2px dashed ${FARM_COLORS.fence.post}` }}
            >
              <p
                className="text-xs"
                style={{ color: FARM_COLORS.ui.text, opacity: 0.6 }}
              >
                BEST: {highScore.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mt-4">
          {/* Retry button */}
          <button
            onClick={handleRetry}
            className="px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
              TRY AGAIN
            </span>
          </button>

          {/* Menu button */}
          <button
            onClick={handleMainMenu}
            className="px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
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
              MENU
            </span>
          </button>
        </div>

        {/* Motivational message */}
        <p
          className="text-sm text-center mt-4 max-w-xs"
          style={{ color: FARM_COLORS.ui.text, opacity: 0.7 }}
        >
          {score < 100
            ? "Don't give up! The farm needs you!"
            : score < 500
              ? "Getting better! Keep stacking!"
              : score < 1000
                ? "Great run! You're a natural farmer!"
                : "Amazing! The animals love you!"}
        </p>

        {/* Scattered animal emojis */}
        <div className="flex gap-2 mt-2 opacity-40">
          {["\u{1F404}", "\u{1F414}", "\u{1F437}", "\u{1F411}"].map(
            (emoji, i) => (
              <span
                key={i}
                className="text-xl"
                style={{
                  transform: `rotate(${(Math.random() - 0.5) * 60}deg)`,
                }}
              >
                {emoji}
              </span>
            )
          )}
        </div>
      </div>
    </>
  );
}
