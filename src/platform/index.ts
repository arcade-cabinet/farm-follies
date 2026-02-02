/**
 * Platform Abstraction Layer
 * Unified API for cross-platform features
 */

export { haptics } from "./haptics";
export { storage, STORAGE_KEYS } from "./storage";
export { platformAudio } from "./audio";
export { appLifecycle, type AppState, type AppLifecycleCallbacks } from "./app-lifecycle";
export { feedback } from "./feedback";
export { voiceManager, type VoiceEvent, type VoiceGender } from "./voice";

// Re-export Capacitor utilities
import { Capacitor } from "@capacitor/core";
export { Capacitor };

/**
 * Platform detection utilities
 */
export const platform = {
  /**
   * Check if running on native platform (iOS/Android)
   */
  isNative: () => {
    return Capacitor.isNativePlatform();
  },

  /**
   * Get current platform
   */
  getPlatform: (): "ios" | "android" | "web" => {
    return Capacitor.getPlatform() as "ios" | "android" | "web";
  },

  /**
   * Check if running on iOS
   */
  isIOS: () => {
    return Capacitor.getPlatform() === "ios";
  },

  /**
   * Check if running on Android
   */
  isAndroid: () => {
    return Capacitor.getPlatform() === "android";
  },

  /**
   * Check if running in web browser
   */
  isWeb: () => {
    return Capacitor.getPlatform() === "web";
  },

  /**
   * Check if PWA installed
   */
  isPWA: () => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  },
};

/**
 * Initialize all platform services
 */
export async function initPlatform(): Promise<void> {
  const { platformAudio } = await import("./audio");
  const { appLifecycle } = await import("./app-lifecycle");

  // Initialize audio system
  await platformAudio.init();

  // Initialize voice line system
  const { voiceManager: voice } = await import("./voice");
  await voice.init();

  // Initialize app lifecycle with game-specific callbacks
  await appLifecycle.init({
    onPause: () => {
      // Game will handle pause through its own state management
      console.log("[Platform] App paused");
    },
    onResume: () => {
      console.log("[Platform] App resumed");
    },
    onBackButton: () => {
      // Let game handle back button
      return false;
    },
  });

  console.log("[Platform] Initialized");
}
