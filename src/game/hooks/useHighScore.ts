/**
 * useHighScore Hook
 * Manages high score persistence with platform storage abstraction
 */

import { useCallback, useEffect, useState } from "react";
import { STORAGE_KEYS, storage } from "@/platform";

export interface UseHighScoreReturn {
  highScore: number;
  updateHighScore: (score: number) => boolean;
  resetHighScore: () => void;
}

export function useHighScore(): UseHighScoreReturn {
  const [highScore, setHighScore] = useState(0);

  // Load high score from storage on mount
  useEffect(() => {
    const load = async () => {
      const stored = await storage.get<number>(STORAGE_KEYS.HIGH_SCORE);
      if (stored !== null && typeof stored === "number") {
        setHighScore(stored);
      }
    };
    load();
  }, []);

  /**
   * Update high score if new score is higher
   * Returns true if high score was updated
   */
  const updateHighScore = useCallback(
    (score: number): boolean => {
      if (score > highScore) {
        setHighScore(score);
        storage.set(STORAGE_KEYS.HIGH_SCORE, score);
        return true;
      }
      return false;
    },
    [highScore]
  );

  /**
   * Reset high score to zero
   */
  const resetHighScore = useCallback(() => {
    setHighScore(0);
    storage.remove(STORAGE_KEYS.HIGH_SCORE);
  }, []);

  return {
    highScore,
    updateHighScore,
    resetHighScore,
  };
}
