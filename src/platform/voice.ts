/**
 * Voice Line Manager
 * Plays voice lines (male/female variants) for game events.
 * Voice lines are supplementary -- the game works if they fail to load.
 */

const AUDIO_BASE = `${import.meta.env.BASE_URL}assets/audio/voice`;

/** Game events that have voice lines */
export type VoiceEvent =
  | "danger"
  | "fail"
  | "gameover"
  | "highscore"
  | "levelup"
  | "perfect"
  | "powerup";

export type VoiceGender = "male" | "female";

const VOICE_EVENTS: VoiceEvent[] = [
  "danger",
  "fail",
  "gameover",
  "highscore",
  "levelup",
  "perfect",
  "powerup",
];

/**
 * Default cooldown between voice lines in milliseconds.
 * Prevents voice spam during rapid game events.
 */
const DEFAULT_COOLDOWN_MS = 3000;

/**
 * Delay after the triggering SFX before the voice plays.
 * Prevents SFX and voice from overlapping at the start.
 */
const VOICE_DELAY_MS = 250;

class VoiceLineManager {
  private cache: Map<string, HTMLAudioElement> = new Map();
  private initialized = false;
  private available = false;
  private muted = false;
  private gender: VoiceGender = "female";
  private lastPlayTime = 0;
  private cooldownMs = DEFAULT_COOLDOWN_MS;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize voice system: pick a gender and preload files.
   * If a persisted preference exists it is used; otherwise a random gender is chosen.
   */
  async init(preferredGender?: VoiceGender): Promise<void> {
    if (this.initialized) return;

    // Determine gender
    if (preferredGender) {
      this.gender = preferredGender;
    } else {
      // Try to read stored preference, fall back to random
      try {
        const stored = localStorage.getItem("farm-follies-voice-gender");
        if (stored === "male" || stored === "female") {
          this.gender = stored;
        } else {
          this.gender = Math.random() < 0.5 ? "male" : "female";
        }
      } catch {
        this.gender = Math.random() < 0.5 ? "male" : "female";
      }
    }

    // Persist the choice
    try {
      localStorage.setItem("farm-follies-voice-gender", this.gender);
    } catch {
      // Storage unavailable -- not critical
    }

    // Check if voice files exist before preloading
    const filesExist = await this.checkFilesExist();
    if (!filesExist) {
      console.log("[Voice] Voice line files not found, voice lines disabled");
      this.initialized = true;
      return;
    }

    await this.preload();
    this.initialized = true;
  }

  /**
   * Check if voice files are available on disk
   */
  private async checkFilesExist(): Promise<boolean> {
    try {
      const testPath = `${AUDIO_BASE}/${this.gender}/perfect.ogg`;
      const response = await fetch(testPath, { method: "HEAD" });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Preload all voice files for the selected gender
   */
  private async preload(): Promise<void> {
    const results = await Promise.allSettled(
      VOICE_EVENTS.map(async (event) => {
        const path = `${AUDIO_BASE}/${this.gender}/${event}.ogg`;
        const audio = new Audio(path);
        audio.preload = "auto";
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener("canplaythrough", () => resolve(), { once: true });
          audio.addEventListener("error", reject, { once: true });
          audio.load();
        });
        this.cache.set(event, audio);
      })
    );

    const loaded = results.filter((r) => r.status === "fulfilled").length;
    if (loaded > 0) {
      this.available = true;
      console.log(`[Voice] Loaded ${loaded}/${VOICE_EVENTS.length} voice lines (${this.gender})`);
    } else {
      console.warn("[Voice] No voice lines could be loaded");
    }
  }

  /**
   * Play a voice line for a game event.
   * Respects cooldown and mute state.
   * Voice plays after a short delay so it does not stomp on the SFX.
   */
  playVoice(event: VoiceEvent): void {
    if (this.muted || !this.available || !this.initialized) return;

    const now = performance.now();
    if (now - this.lastPlayTime < this.cooldownMs) return;

    const cached = this.cache.get(event);
    if (!cached) return;

    // Cancel any pending voice playback
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    this.lastPlayTime = now;
    this.pendingTimeout = setTimeout(() => {
      this.pendingTimeout = null;
      try {
        const audio = cached.cloneNode() as HTMLAudioElement;
        audio.volume = 0.85;
        audio.play().catch(() => {
          // Playback failed (e.g., no user gesture yet) -- silently ignore
        });
      } catch {
        // Cloning or playback failed -- not critical
      }
    }, VOICE_DELAY_MS);
  }

  /**
   * Set mute state. When muted, no voice lines will play.
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  /**
   * Get current mute state
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Change voice gender at runtime. Re-preloads files for the new gender.
   */
  async setGender(gender: VoiceGender): Promise<void> {
    if (gender === this.gender && this.available) return;

    this.gender = gender;
    this.cache.clear();
    this.available = false;

    try {
      localStorage.setItem("farm-follies-voice-gender", gender);
    } catch {
      // Not critical
    }

    const filesExist = await this.checkFilesExist();
    if (filesExist) {
      await this.preload();
    }
  }

  /**
   * Get current voice gender
   */
  getGender(): VoiceGender {
    return this.gender;
  }

  /**
   * Set the minimum cooldown between voice lines
   */
  setCooldown(ms: number): void {
    this.cooldownMs = Math.max(0, ms);
  }

  /**
   * Check if voice lines are loaded and available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    this.cache.clear();
    this.available = false;
    this.initialized = false;
  }
}

/** Singleton voice line manager */
export const voiceManager = new VoiceLineManager();
