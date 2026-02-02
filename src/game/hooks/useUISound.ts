/**
 * useUISound Hook
 * Provides UI sound playback functions that respect the mute state.
 * Uses the platform feedback system for unified audio + haptics.
 */

import { useCallback } from "react";
import { feedback } from "@/platform";

export function useUISound() {
  const playClick = useCallback(() => {
    feedback.play("ui_click");
  }, []);

  const playBack = useCallback(() => {
    feedback.play("ui_back");
  }, []);

  const playToggle = useCallback(() => {
    feedback.play("ui_toggle");
  }, []);

  return { playClick, playBack, playToggle };
}
