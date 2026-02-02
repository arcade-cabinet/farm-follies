/**
 * Splash Screen
 * Full-screen video player shown on app startup before the main menu.
 * Detects orientation to play the correct video (portrait vs landscape).
 * Auto-advances after video ends; tap/click to skip.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useOrientation } from "@/game/hooks/useOrientation";

const PORTRAIT_VIDEO = `${import.meta.env.BASE_URL}assets/video/splash_portrait.mp4`;
const LANDSCAPE_VIDEO = `${import.meta.env.BASE_URL}assets/video/splash_landscape.mp4`;
const FADE_DURATION_MS = 600;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFading, setIsFading] = useState(false);
  const hasCompletedRef = useRef(false);
  const orientation = useOrientation();

  const videoSrc = orientation === "portrait" ? PORTRAIT_VIDEO : LANDSCAPE_VIDEO;

  const finishSplash = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;

    setIsFading(true);
    setTimeout(() => {
      onComplete();
    }, FADE_DURATION_MS);
  }, [onComplete]);

  // Attempt autoplay once the video element is ready
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // Autoplay blocked (common on web without user gesture).
        // Try again with muted audio as a fallback.
        try {
          video.muted = true;
          await video.play();
        } catch {
          // Video cannot play at all -- skip straight to the game.
          finishSplash();
        }
      }
    };

    tryPlay();
  }, [finishSplash]);

  const handleVideoEnd = useCallback(() => {
    finishSplash();
  }, [finishSplash]);

  const handleVideoError = useCallback(() => {
    // If the video fails to load, skip gracefully
    finishSplash();
  }, [finishSplash]);

  const handleSkip = useCallback(() => {
    finishSplash();
  }, [finishSplash]);

  return (
    <div
      className="fixed inset-0 z-50 select-none touch-none"
      style={{ backgroundColor: "#000" }}
      onClick={handleSkip}
      onTouchEnd={handleSkip}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        preload="auto"
        onEnded={handleVideoEnd}
        onError={handleVideoError}
      />

      {/* Skip hint */}
      {!isFading && (
        <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none z-10">
          <p className="text-white/50 text-sm" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            Tap to skip
          </p>
        </div>
      )}

      {/* Fade-to-black overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: "#000",
          opacity: isFading ? 1 : 0,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in`,
        }}
      />
    </div>
  );
}
