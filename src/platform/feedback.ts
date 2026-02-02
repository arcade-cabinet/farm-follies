/**
 * Unified Feedback System
 * Combines audio, haptic, and voice feedback for game events
 */

import { haptics } from "./haptics";
import { platformAudio } from "./audio";
import { voiceManager } from "./voice";
import type { SoundType } from "@/game/audio";
import type { VoiceEvent, VoiceGender } from "./voice";

/**
 * Mapping from SoundType to the corresponding VoiceEvent (if any).
 * Only events with a matching voice line are included.
 */
const SOUND_TO_VOICE: Partial<Record<SoundType, VoiceEvent>> = {
  perfect: "perfect",
  fail: "fail",
  powerup: "powerup",
  levelup: "levelup",
  topple: "danger",
};

/**
 * Feedback manager that coordinates audio, haptics, and voice lines
 */
class FeedbackManager {
  private hapticsEnabled = true;
  private audioEnabled = true;

  /**
   * Initialize the feedback system (audio + voice)
   */
  async init(): Promise<void> {
    await platformAudio.init();
    await voiceManager.init();
  }

  /**
   * Enable/disable haptics
   */
  setHapticsEnabled(enabled: boolean): void {
    this.hapticsEnabled = enabled;
  }

  /**
   * Enable/disable audio
   */
  setAudioEnabled(enabled: boolean): void {
    this.audioEnabled = enabled;
    platformAudio.setMuted(!enabled);
    voiceManager.setMuted(!enabled);
  }

  /**
   * Play feedback for a game event (SFX + haptics + optional voice line)
   */
  async play(type: SoundType): Promise<void> {
    // Play SFX
    if (this.audioEnabled) {
      platformAudio.play(type);
    }

    // Trigger a voice line if one is mapped to this sound type
    if (this.audioEnabled) {
      const voiceEvent = SOUND_TO_VOICE[type];
      if (voiceEvent) {
        voiceManager.playVoice(voiceEvent);
      }
    }

    // Trigger haptics based on sound type
    if (this.hapticsEnabled) {
      switch (type) {
        case "drop":
          await haptics.light();
          break;
        case "land":
          await haptics.medium();
          break;
        case "perfect":
          await haptics.heavy();
          await haptics.success();
          break;
        case "fail":
          await haptics.error();
          await haptics.vibrate(200);
          break;
        case "powerup":
          await haptics.success();
          break;
        case "freeze":
          await haptics.medium();
          break;
        case "fireball":
          await haptics.heavy();
          break;
        case "levelup":
          await haptics.success();
          await haptics.heavy();
          break;
        case "lifeup":
          await haptics.success();
          break;
        case "bank":
          await haptics.success();
          await haptics.medium();
          break;
        case "miss":
          await haptics.light();
          break;
        case "topple":
          await haptics.error();
          await haptics.vibrate(300);
          break;
        case "ui_click":
          await haptics.light();
          break;
        case "ui_back":
          await haptics.light();
          break;
        case "ui_toggle":
          await haptics.selection();
          break;
      }
    }
  }

  /**
   * Play a voice line directly (e.g., for game over or high score)
   */
  playVoice(event: VoiceEvent): void {
    if (this.audioEnabled) {
      voiceManager.playVoice(event);
    }
  }

  /**
   * Start intensity-based game music
   */
  startMusic(): void {
    if (this.audioEnabled) {
      platformAudio.startMusic();
    }
  }

  /**
   * Stop intensity-based game music
   */
  stopMusic(): void {
    platformAudio.stopMusic();
  }

  /**
   * Start background/menu music (background.wav loop)
   */
  startBackgroundMusic(volume?: number): void {
    if (this.audioEnabled) {
      platformAudio.startBackgroundMusic(volume);
    }
  }

  /**
   * Stop background/menu music
   */
  stopBackgroundMusic(): void {
    platformAudio.stopBackgroundMusic();
  }

  /**
   * Check if background music is available
   */
  isBackgroundMusicAvailable(): boolean {
    return platformAudio.isBackgroundMusicAvailable();
  }

  /**
   * Set music intensity (0-1)
   */
  setIntensity(intensity: number): void {
    platformAudio.setIntensity(intensity);
  }

  /**
   * Set voice gender preference
   */
  async setVoiceGender(gender: VoiceGender): Promise<void> {
    await voiceManager.setGender(gender);
  }

  /**
   * Get current voice gender
   */
  getVoiceGender(): VoiceGender {
    return voiceManager.getGender();
  }

  /**
   * Check if voice lines are available
   */
  isVoiceAvailable(): boolean {
    return voiceManager.isAvailable();
  }

  /**
   * Haptic feedback for UI interactions
   */
  async uiTap(): Promise<void> {
    if (this.hapticsEnabled) {
      await haptics.light();
    }
  }

  /**
   * Haptic feedback for selection changes
   */
  async uiSelection(): Promise<void> {
    if (this.hapticsEnabled) {
      await haptics.selection();
    }
  }

  /**
   * Haptic feedback for warnings (e.g., stack about to fall)
   */
  async warning(): Promise<void> {
    if (this.hapticsEnabled) {
      await haptics.warning();
    }
  }

  /**
   * Custom vibration pattern for danger state
   */
  async dangerPulse(): Promise<void> {
    if (this.hapticsEnabled) {
      await haptics.vibrate(50);
    }
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return platformAudio.isMuted();
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.audioEnabled = !muted;
    platformAudio.setMuted(muted);
    voiceManager.setMuted(muted);
  }

  /**
   * Clean up
   */
  dispose(): void {
    platformAudio.dispose();
    voiceManager.dispose();
  }
}

export const feedback = new FeedbackManager();
