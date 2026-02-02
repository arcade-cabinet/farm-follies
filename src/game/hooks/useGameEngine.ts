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
import type { AbilityIndicatorData } from "../engine";
import { Game, type GameCallbacks } from "../engine/Game";

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
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [combo, setCombo] = useState(0);
  const [stackHeight, setStackHeight] = useState(0);
  const [bankedAnimals, setBankedAnimals] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState<number>(GAME_CONFIG.lives.starting);
  const [maxLives, setMaxLives] = useState<number>(GAME_CONFIG.lives.max);
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
      onLivesChange: (newLives, newMaxLives) => {
        setLives(newLives);
        if (newMaxLives !== undefined) setMaxLives(newMaxLives);
      },
      onGameOver: (finalScore, totalBanked) => {
        setIsPlaying(false);
        setIsGameOver(true);
        // Stop music on game over
        feedback.stopMusic();
        // Play game over voice line
        feedback.playVoice("gameover");
        optionsRef.current.onGameOver?.(finalScore, totalBanked);
      },
      onPerfectCatch: (_x, _y) => {
        setPerfectKey((prev) => prev + 1);
        setShowPerfect(true);
        const t1 = setTimeout(() => {
          setShowPerfect(false);
          timeoutsRef.current.delete(t1);
        }, 800);
        timeoutsRef.current.add(t1);
        optionsRef.current.onPerfectCatch?.();
      },
      onGoodCatch: (_x, _y) => {
        setShowGood(true);
        const t2 = setTimeout(() => {
          setShowGood(false);
          timeoutsRef.current.delete(t2);
        }, 600);
        timeoutsRef.current.add(t2);
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
        optionsRef.current.onLevelUp?.(newLevel);
      },
      onLifeEarned: () => {
        feedback.play("lifeup");
        optionsRef.current.onLifeEarned?.();
      },
      onDangerStateChange: (danger) => {
        setInDanger(danger);
      },
      onStackTopple: () => {
        optionsRef.current.onStackTopple?.();
      },
      onAbilityChange: (indicators) => {
        setAbilityIndicators(indicators);
      },
    };

    const engine = new Game(canvas, callbacks);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      for (const t of timeoutsRef.current) clearTimeout(t);
      timeoutsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
