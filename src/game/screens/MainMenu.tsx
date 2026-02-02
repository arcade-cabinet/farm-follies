/**
 * Farm Follies Main Menu
 * Rustic farm-themed menu screen with orientation-aware background
 */

import { useState, useCallback } from "react";
import { GAME_INFO, FARM_COLORS } from "../config";
import { type GameModeType, getUnlockedModes } from "../modes/GameMode";
import { getCoins } from "../progression/Upgrades";
import { ModeSelect } from "../components/ModeSelect";
import { UpgradeShop } from "../components/UpgradeShop";
import { MenuBackground } from "../components/MenuBackground";
import { useUISound } from "../hooks/useUISound";

interface MainMenuProps {
  onPlay: (mode?: GameModeType) => void;
  highScore: number;
}

export function MainMenu({ onPlay, highScore }: MainMenuProps) {
  const [showModes, setShowModes] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const coins = getCoins();
  const unlockedModes = getUnlockedModes();
  const { playClick } = useUISound();

  const handlePlay = useCallback(() => {
    playClick();
    if (unlockedModes.length > 1) {
      setShowModes(true);
    } else {
      onPlay("endless");
    }
  }, [unlockedModes, onPlay, playClick]);

  const handleModeSelect = useCallback(
    (mode: GameModeType) => {
      setShowModes(false);
      onPlay(mode);
    },
    [onPlay]
  );

  const handleShopOpen = useCallback(() => {
    playClick();
    setShowShop(true);
  }, [playClick]);

  const handleModesOpen = useCallback(() => {
    playClick();
    setShowModes(true);
  }, [playClick]);

  if (showShop) {
    return <UpgradeShop onClose={() => setShowShop(false)} />;
  }

  if (showModes) {
    return (
      <ModeSelect
        onSelectMode={handleModeSelect}
        onClose={() => setShowModes(false)}
      />
    );
  }

  return (
    <>
      {/* Full-screen background image */}
      <MenuBackground overlayOpacity={0.55} />

      <div className="relative z-10 pointer-events-auto flex flex-col items-center justify-center gap-6 p-4 max-w-md mx-auto">
        {/* Logo/Title */}
        <div className="text-center">
          {/* Barn icon made with divs */}
          <div className="relative mx-auto mb-4 w-24 h-20">
            {/* Barn body */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-14 rounded-sm"
              style={{ backgroundColor: FARM_COLORS.barn.red }}
            />
            {/* Barn roof */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "48px solid transparent",
                borderRight: "48px solid transparent",
                borderBottom: `32px solid ${FARM_COLORS.barn.roof}`,
              }}
            />
            {/* Barn door */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-10 rounded-t-full"
              style={{ backgroundColor: FARM_COLORS.barn.door }}
            />
            {/* Hay in door */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3"
              style={{ backgroundColor: FARM_COLORS.ground.hay }}
            />
          </div>

          <h1
            className="game-font text-5xl sm:text-6xl mb-2"
            style={{
              color: FARM_COLORS.barn.red,
              textShadow: `3px 3px 0 ${FARM_COLORS.barn.roof}, -1px -1px 0 #fff`,
            }}
          >
            {GAME_INFO.title}
          </h1>

          <p
            className="game-font text-lg sm:text-xl"
            style={{
              color: FARM_COLORS.ui.text,
              textShadow: "1px 1px 0 rgba(255,255,255,0.5)",
            }}
          >
            {GAME_INFO.tagline}
          </p>

          <p
            className="text-sm mt-1 opacity-70"
            style={{ color: FARM_COLORS.ui.text }}
          >
            {GAME_INFO.subtitle}
          </p>
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div
            className="px-6 py-2 rounded-lg"
            style={{
              backgroundColor: "rgba(139, 69, 19, 0.2)",
              border: `2px solid ${FARM_COLORS.fence.post}`,
            }}
          >
            <p
              className="game-font text-sm"
              style={{ color: FARM_COLORS.ui.text }}
            >
              BEST: {highScore.toLocaleString()}
            </p>
          </div>
        )}

        {/* Play Button */}
        <button
          onClick={handlePlay}
          className="group relative px-12 py-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: FARM_COLORS.barn.red,
            boxShadow: `0 6px 0 ${FARM_COLORS.barn.roof}, 0 8px 20px rgba(0,0,0,0.3)`,
          }}
        >
          <span
            className="game-font text-3xl block"
            style={{
              color: FARM_COLORS.ui.textLight,
              textShadow: "2px 2px 0 rgba(0,0,0,0.3)",
            }}
          >
            PLAY
          </span>

          {/* Hay decoration */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 rounded-full"
                style={{
                  backgroundColor: FARM_COLORS.ground.hay,
                  transform: `rotate(${(i - 1) * 15}deg)`,
                }}
              />
            ))}
          </div>
        </button>

        {/* Bottom buttons */}
        <div className="flex gap-4">
          {/* Shop Button */}
          <button
            onClick={handleShopOpen}
            className="px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              backgroundColor: FARM_COLORS.barn.wood,
              boxShadow: `0 4px 0 ${FARM_COLORS.barn.roof}`,
            }}
          >
            <span
              className="game-font text-lg"
              style={{ color: FARM_COLORS.ui.textLight }}
            >
              SHOP
            </span>
            <span
              className="game-font text-sm px-2 py-1 rounded"
              style={{
                backgroundColor: FARM_COLORS.nature.corn,
                color: FARM_COLORS.ui.text,
              }}
            >
              {coins}
            </span>
          </button>

          {/* Modes Button (if unlocked) */}
          {unlockedModes.length > 1 && (
            <button
              onClick={handleModesOpen}
              className="px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: FARM_COLORS.ground.grass,
                boxShadow: `0 4px 0 ${FARM_COLORS.nature.bushDark}`,
              }}
            >
              <span
                className="game-font text-lg"
                style={{ color: FARM_COLORS.ui.textLight }}
              >
                MODES
              </span>
            </button>
          )}
        </div>

        {/* Instructions hint */}
        <div
          className="text-center mt-4 px-4 py-2 rounded-lg max-w-xs"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <p className="text-sm" style={{ color: FARM_COLORS.ui.text }}>
            Drag to catch falling animals from the tornado!
            <br />
            <span className="opacity-70">
              Stack &apos;em high, but don&apos;t let them topple!
            </span>
          </p>
        </div>

        {/* Animal preview decorations */}
        <div className="flex gap-4 mt-2 opacity-60">
          {/* Simple animal silhouettes */}
          {["\u{1F404}", "\u{1F414}", "\u{1F437}", "\u{1F411}", "\u{1F986}"].map(
            (emoji, i) => (
              <span
                key={i}
                className="text-2xl animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
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
