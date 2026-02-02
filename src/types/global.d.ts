// Global type declarations

/// <reference types="react" />
/// <reference types="react-dom" />

// Extend Window for game-specific globals
declare global {
  interface Window {
    captureAudio?: {
      captureAllAudio: () => void;
    };
  }
}

export {};
