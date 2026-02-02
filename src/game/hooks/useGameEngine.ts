/**
 * useGameEngine Hook
 * React hook for managing the game engine lifecycle.
 *
 * Wires the modular Game class into React state so the UI layer
 * (GameScreen, ScoreDisplay, etc.) can stay unchanged.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { feedback } from "@/platform";
import { GAME_CONFIG } from "../config";
import { Game, type GameCallbacks } from "../engine/Game";
import type { AbilityIndicatorData } from "../engine";

export interface UseGameEngineReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  score: number;
  multiplier: number;
  combo: number;
  stackHeight: number;
  bankedAnimals: number;
  level: number;
  lives: number;
  maxLives: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  canBank: boolean;
  perfectKey: number;
  showPerfect: boolean;
  showGood: boolean;
  inDanger: boolean;
  abilityIndicators: AbilityIndicatorData[];
  // Actions
  startGame: () => void;
  bankStack: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
}

interface UseGameEngineOptions {
  onGameOver?: (finalScore: number, bankedAnimals: number) => void;
  onLevelUp?: (level: number) => void;
  onLifeEarned?: () => void;
  onStackTopple?: () => void;
  onPowerUp?: (type: string) => void;
  onMerge?: (count: number) => void;
  onPerfectCatch?: () => void;
}

export function useGameEngine(options: UseGameEngineOptions = {}): UseGameEngineReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Game | null>(null);

  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  const [stackHeight, setStackHeight] = useState(0);
  const [bankedAnimals, setBankedAnimals] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState<number>(GAME_CONFIG.lives.starting);
  const [maxLives] = useState<number>(GAME_CONFIG.lives.max);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canBank, setCanBank] = useState(false);
  const [perfectKey, setPerfectKey] = useState(0);
  const [showPerfect, setShowPerfect] = useState(false);
  const [showGood, setShowGood] = useState(false);
  const [inDanger, setInDanger] = useState(false);
  const [abilityIndicators, setAbilityIndicators] = useState<AbilityIndicatorData[]>([]);

  // Initialize engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions from rendered CSS size before engine construction
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);

    const callbacks: GameCallbacks = {
      onScoreChange: (newScore, newMultiplier, newCombo) => {
        setScore(newScore);
        setMultiplier(newMultiplier);
        setCombo(newCombo);
      },
      onStackChange: (height, canBankNow) => {
        setStackHeight(height);
        setCanBank(canBankNow);
      },
      onLivesChange: (newLives) => {
        setLives(newLives);
      },
      onGameOver: (finalScore, totalBanked) => {
        setIsPlaying(false);
        setIsGameOver(true);
        // Stop music on game over
        feedback.stopMusic();
        // Play game over voice line
        feedback.playVoice("gameover");
        options.onGameOver?.(finalScore, totalBanked);
      },
      onPerfectCatch: (_x, _y) => {
        setPerfectKey((prev) => prev + 1);
        setShowPerfect(true);
        setTimeout(() => setShowPerfect(false), 800);
        options.onPerfectCatch?.();
      },
      onGoodCatch: (_x, _y) => {
        setShowGood(true);
        setTimeout(() => setShowGood(false), 600);
      },
      onMiss: () => {
        // Could add miss animation here
      },
      onBankComplete: (total) => {
        setBankedAnimals(total);
      },
      onLevelUp: (newLevel) => {
        setLevel(newLevel);
        // Play level-up sound (music intensity is managed by Game internally)
        feedback.play("levelup");
        options.onLevelUp?.(newLevel);
      },
      onLifeEarned: () => {
        feedback.play("lifeup");
        options.onLifeEarned?.();
      },
      onDangerStateChange: (danger) => {
        setInDanger(danger);
      },
      onStackTopple: () => {
        options.onStackTopple?.();
      },
      onAbilityChange: (indicators) => {
        setAbilityIndicators(indicators);
      },
    };

    const engine = new Game(canvas, callbacks);
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, [
    options.onGameOver,
    options.onLevelUp,
    options.onLifeEarned,
    options.onStackTopple,
    options.onMerge,
    options.onPerfectCatch,
    options.onPowerUp,
  ]);

  const startGame = useCallback(async () => {
    if (engineRef.current) {
      // Sync mute state before starting (Game.start handles init and music)
      const isMuted =
        typeof window !== "undefined" && localStorage.getItem("farm-follies-muted") === "true";
      feedback.setMuted(isMuted);

      // Reset React state
      setIsGameOver(false);
      setIsPlaying(true);
      setIsPaused(false);
      setScore(0);
      setMultiplier(1);
      setCombo(0);
      setStackHeight(0);
      setBankedAnimals(0);
      setLevel(1);
      setLives(GAME_CONFIG.lives.starting);
      setCanBank(false);
      setInDanger(false);
      setAbilityIndicators([]);

      // Game.start() handles feedback.init(), music start, and intensity
      engineRef.current.start();
    }
  }, []);

  const bankStack = useCallback(() => {
    if (engineRef.current && canBank) {
      engineRef.current.bankStack();
    }
  }, [canBank]);

  const pauseGame = useCallback(() => {
    if (engineRef.current && isPlaying && !isPaused) {
      // Game.pause() handles music stop internally
      engineRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resumeGame = useCallback(() => {
    if (engineRef.current && isPaused) {
      // Game.resume() handles music restart internally
      engineRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  return {
    canvasRef,
    score,
    multiplier,
    combo,
    stackHeight,
    bankedAnimals,
    level,
    lives,
    maxLives,
    isPlaying,
    isGameOver,
    isPaused,
    canBank,
    perfectKey,
    showPerfect,
    showGood,
    inDanger,
    abilityIndicators,
    // Actions
    startGame,
    bankStack,
    pauseGame,
    resumeGame,
  };
}
