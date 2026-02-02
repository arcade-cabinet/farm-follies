import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  GameStateManager,
  createInitialState,
  type GameStateCallbacks,
} from "../managers/GameStateManager";
import { GAME_CONFIG } from "../../config";

const { lives: livesConfig, scoring, difficulty, banking } = GAME_CONFIG;

type MockCallbacks = {
  [K in keyof Required<GameStateCallbacks>]: Mock;
};

describe("GameStateManager", () => {
  let manager: GameStateManager;
  let callbacks: MockCallbacks;

  beforeEach(() => {
    callbacks = {
      onScoreChange: vi.fn(),
      onLivesChange: vi.fn(),
      onLevelUp: vi.fn(),
      onDangerStateChange: vi.fn(),
      onGameOver: vi.fn(),
      onLifeEarned: vi.fn(),
    };
    manager = new GameStateManager(callbacks);
  });

  describe("createInitialState", () => {
    it("returns default values", () => {
      const state = createInitialState();
      expect(state.score).toBe(0);
      expect(state.level).toBe(1);
      expect(state.lives).toBe(livesConfig.starting);
      expect(state.maxLives).toBe(livesConfig.max);
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isGameOver).toBe(false);
      expect(state.combo).toBe(0);
      expect(state.currentMultiplier).toBe(1);
      expect(state.bankedAnimals).toBe(0);
    });
  });

  describe("constructor", () => {
    it("creates with initial state", () => {
      const state = manager.getState();
      expect(state.score).toBe(0);
      expect(state.lives).toBe(livesConfig.starting);
    });

    it("works without callbacks", () => {
      const m = new GameStateManager();
      expect(m.score).toBe(0);
    });
  });

  describe("getState", () => {
    it("returns a copy (not a reference)", () => {
      const state1 = manager.getState();
      const state2 = manager.getState();
      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });

  describe("startGame", () => {
    it("resets state and sets isPlaying", () => {
      manager.startGame();
      const state = manager.getState();
      expect(state.isPlaying).toBe(true);
      expect(state.score).toBe(0);
      expect(state.lives).toBe(livesConfig.starting);
      expect(state.gameStartTime).toBeGreaterThan(0);
    });

    it("fires onScoreChange and onLivesChange callbacks", () => {
      manager.startGame();
      expect(callbacks.onScoreChange).toHaveBeenCalledWith(0, 1, 0);
      expect(callbacks.onLivesChange).toHaveBeenCalledWith(
        livesConfig.starting,
        livesConfig.max,
      );
    });
  });

  describe("pause/resume", () => {
    it("sets isPaused to true on pause", () => {
      manager.pause();
      expect(manager.getState().isPaused).toBe(true);
    });

    it("sets isPaused to false on resume", () => {
      manager.pause();
      manager.resume();
      expect(manager.getState().isPaused).toBe(false);
    });
  });

  describe("endGame", () => {
    it("sets isPlaying false and isGameOver true", () => {
      manager.startGame();
      manager.endGame();
      const state = manager.getState();
      expect(state.isPlaying).toBe(false);
      expect(state.isGameOver).toBe(true);
    });

    it("fires onGameOver callback with score and banked", () => {
      manager.startGame();
      manager.endGame();
      expect(callbacks.onGameOver).toHaveBeenCalledWith(0, 0);
    });
  });

  describe("addScore", () => {
    it("adds base points and returns them", () => {
      manager.startGame();
      const points = manager.addScore(100);
      expect(points).toBeGreaterThan(0);
      expect(manager.score).toBeGreaterThan(0);
    });

    it("increments totalCaught", () => {
      manager.startGame();
      manager.addScore(10);
      manager.addScore(10);
      expect(manager.getState().totalCaught).toBe(2);
    });

    it("applies perfect bonus multiplier", () => {
      manager.startGame();
      const normalPoints = manager.addScore(100);
      // Reset to compare — need fresh state
      manager.startGame();
      const perfectPoints = manager.addScore(100, { isPerfect: true });
      expect(perfectPoints).toBeGreaterThan(normalPoints);
    });

    it("applies good bonus multiplier", () => {
      manager.startGame();
      const normalPoints = manager.addScore(100);
      manager.startGame();
      const goodPoints = manager.addScore(100, { isGood: true });
      expect(goodPoints).toBeGreaterThan(normalPoints);
    });

    it("applies stack bonus", () => {
      manager.startGame();
      const normalPoints = manager.addScore(100);
      manager.startGame();
      const stackPoints = manager.addScore(100, { stackBonus: 2 });
      expect(stackPoints).toBeGreaterThan(normalPoints);
    });

    it("increases multiplier on each score", () => {
      manager.startGame();
      manager.addScore(10);
      expect(manager.getState().currentMultiplier).toBeGreaterThan(1);
    });

    it("caps multiplier at maxMultiplier", () => {
      manager.startGame();
      for (let i = 0; i < 200; i++) {
        manager.addScore(10);
      }
      expect(manager.getState().currentMultiplier).toBeLessThanOrEqual(
        scoring.maxMultiplier,
      );
    });

    it("fires onScoreChange callback", () => {
      manager.startGame();
      callbacks.onScoreChange.mockClear();
      manager.addScore(10);
      expect(callbacks.onScoreChange).toHaveBeenCalled();
    });
  });

  describe("combo system", () => {
    it("builds combo on rapid catches", () => {
      manager.startGame();
      // performance.now() doesn't advance between calls, so combo should build
      manager.addScore(10);
      manager.addScore(10);
      manager.addScore(10);
      expect(manager.getState().combo).toBe(3);
    });

    it("resets combo on loss", () => {
      manager.startGame();
      manager.addScore(10);
      manager.addScore(10);
      manager.loseLife();
      expect(manager.getState().combo).toBe(0);
    });
  });

  describe("combo decay", () => {
    it("decays combo after timeout", () => {
      manager.startGame();
      manager.addScore(10);
      expect(manager.getState().combo).toBe(1);

      // Simulate time passing beyond comboDecayTime
      const futureTime = performance.now() + scoring.comboDecayTime + 1000;
      manager.updateCombo(futureTime);
      expect(manager.getState().combo).toBe(0);
    });

    it("does not decay combo within timeout", () => {
      manager.startGame();
      manager.addScore(10);
      const nearFuture = performance.now() + scoring.comboDecayTime - 500;
      manager.updateCombo(nearFuture);
      expect(manager.getState().combo).toBe(1);
    });

    it("does nothing when combo is already 0", () => {
      manager.startGame();
      callbacks.onScoreChange.mockClear();
      manager.updateCombo(performance.now() + 100000);
      expect(callbacks.onScoreChange).not.toHaveBeenCalled();
    });
  });

  describe("perfect streak", () => {
    it("resets streak on non-perfect catch", () => {
      manager.startGame();
      manager.addScore(10, { isPerfect: true });
      manager.addScore(10, { isPerfect: true });
      manager.addScore(10); // not perfect
      expect(manager.getState().perfectStreak).toBe(0);
    });

    it("earns life at streak threshold", () => {
      manager.startGame();
      const initialLives = manager.lives;
      for (let i = 0; i < livesConfig.earnThresholds.perfectStreak; i++) {
        manager.addScore(10, { isPerfect: true });
      }
      // Should have earned a life (if below max)
      if (initialLives < livesConfig.max) {
        expect(manager.lives).toBe(initialLives + 1);
      }
    });
  });

  describe("bankAnimals", () => {
    it("returns 0 if count below minimum", () => {
      manager.startGame();
      const bonus = manager.bankAnimals(banking.minStackToBank - 1);
      expect(bonus).toBe(0);
    });

    it("returns bank bonus and increments bankedAnimals", () => {
      manager.startGame();
      const bonus = manager.bankAnimals(banking.minStackToBank);
      expect(bonus).toBeGreaterThan(0);
      expect(manager.bankedAnimals).toBe(banking.minStackToBank);
    });

    it("adds bank bonus to score", () => {
      manager.startGame();
      const prevScore = manager.score;
      manager.bankAnimals(banking.minStackToBank);
      expect(manager.score).toBeGreaterThan(prevScore);
    });

    it("applies banking penalty to multiplier", () => {
      manager.startGame();
      // Build up multiplier first
      for (let i = 0; i < 10; i++) {
        manager.addScore(10);
      }
      const prevMult = manager.getState().currentMultiplier;
      manager.bankAnimals(banking.minStackToBank);
      expect(manager.getState().currentMultiplier).toBeLessThan(prevMult);
    });

    it("earns life at banking bonus threshold", () => {
      manager.startGame();
      const initialLives = manager.lives;
      manager.bankAnimals(livesConfig.earnThresholds.bankingBonus);
      if (initialLives < livesConfig.max) {
        expect(manager.lives).toBe(initialLives + 1);
      }
    });

    it("accumulates banked animals across multiple banks", () => {
      manager.startGame();
      manager.bankAnimals(banking.minStackToBank);
      manager.bankAnimals(banking.minStackToBank);
      expect(manager.bankedAnimals).toBe(banking.minStackToBank * 2);
    });
  });

  describe("loseLife", () => {
    it("decrements lives and returns true if alive", () => {
      manager.startGame();
      const result = manager.loseLife();
      expect(result).toBe(true);
      expect(manager.lives).toBe(livesConfig.starting - 1);
    });

    it("resets combo and perfectStreak", () => {
      manager.startGame();
      manager.addScore(10, { isPerfect: true });
      manager.addScore(10, { isPerfect: true });
      manager.loseLife();
      const state = manager.getState();
      expect(state.combo).toBe(0);
      expect(state.perfectStreak).toBe(0);
    });

    it("reduces multiplier on loss", () => {
      manager.startGame();
      for (let i = 0; i < 5; i++) {
        manager.addScore(10);
      }
      const prevMult = manager.getState().currentMultiplier;
      manager.loseLife();
      expect(manager.getState().currentMultiplier).toBeLessThan(prevMult);
    });

    it("multiplier never goes below 1", () => {
      manager.startGame();
      manager.loseLife();
      expect(manager.getState().currentMultiplier).toBeGreaterThanOrEqual(1);
    });

    it("ends game when lives reach 0", () => {
      manager.startGame();
      for (let i = 0; i < livesConfig.starting; i++) {
        manager.loseLife();
      }
      expect(manager.getState().isGameOver).toBe(true);
      expect(callbacks.onGameOver).toHaveBeenCalled();
    });

    it("returns false when game is over", () => {
      manager.startGame();
      let result = true;
      for (let i = 0; i < livesConfig.starting; i++) {
        result = manager.loseLife();
      }
      expect(result).toBe(false);
    });

    it("increments totalMissed", () => {
      manager.startGame();
      manager.loseLife();
      manager.loseLife();
      expect(manager.getState().totalMissed).toBe(2);
    });

    it("fires onLivesChange callback", () => {
      manager.startGame();
      callbacks.onLivesChange.mockClear();
      manager.loseLife();
      expect(callbacks.onLivesChange).toHaveBeenCalled();
    });
  });

  describe("earnLife", () => {
    it("increments lives if below max", () => {
      manager.startGame();
      manager.loseLife();
      const livesAfterLoss = manager.lives;
      manager.earnLife();
      expect(manager.lives).toBe(livesAfterLoss + 1);
    });

    it("does not exceed maxLives", () => {
      manager.startGame();
      manager.earnLife();
      manager.earnLife();
      manager.earnLife();
      expect(manager.lives).toBeLessThanOrEqual(manager.getState().maxLives);
    });

    it("fires onLifeEarned callback", () => {
      manager.startGame();
      manager.loseLife(); // make room
      callbacks.onLifeEarned.mockClear();
      manager.earnLife();
      expect(callbacks.onLifeEarned).toHaveBeenCalled();
    });
  });

  describe("addLife", () => {
    it("increments lives if below max", () => {
      manager.startGame();
      manager.loseLife();
      const prev = manager.lives;
      manager.addLife();
      expect(manager.lives).toBe(prev + 1);
    });

    it("does not exceed maxLives", () => {
      manager.startGame();
      manager.addLife();
      expect(manager.lives).toBeLessThanOrEqual(manager.getState().maxLives);
    });
  });

  describe("fullRestore", () => {
    it("restores lives to maxLives", () => {
      manager.startGame();
      manager.loseLife();
      manager.loseLife();
      manager.fullRestore();
      expect(manager.lives).toBe(manager.getState().maxLives);
    });
  });

  describe("increaseMaxLives", () => {
    it("increases maxLives and heals", () => {
      manager.startGame();
      const prevMax = manager.getState().maxLives;
      const prevLives = manager.lives;
      manager.increaseMaxLives();
      expect(manager.getState().maxLives).toBe(prevMax + 1);
      expect(manager.lives).toBe(prevLives + 1);
    });

    it("does not exceed absoluteMax", () => {
      manager.startGame();
      for (let i = 0; i < 20; i++) {
        manager.increaseMaxLives();
      }
      expect(manager.getState().maxLives).toBeLessThanOrEqual(
        livesConfig.absoluteMax,
      );
    });
  });

  describe("setDangerState", () => {
    it("fires callback on state change", () => {
      manager.setDangerState(true);
      expect(callbacks.onDangerStateChange).toHaveBeenCalledWith(true);
    });

    it("does not fire callback if state unchanged", () => {
      manager.setDangerState(true);
      callbacks.onDangerStateChange.mockClear();
      manager.setDangerState(true);
      expect(callbacks.onDangerStateChange).not.toHaveBeenCalled();
    });

    it("fires callback when toggling back", () => {
      manager.setDangerState(true);
      callbacks.onDangerStateChange.mockClear();
      manager.setDangerState(false);
      expect(callbacks.onDangerStateChange).toHaveBeenCalledWith(false);
    });
  });

  describe("spawn timing", () => {
    it("shouldSpawn returns true after interval", () => {
      manager.startGame();
      manager.updateSpawnTime(1000);
      const state = manager.getState();
      const shouldSpawn = manager.shouldSpawn(1000 + state.spawnInterval + 1);
      expect(shouldSpawn).toBe(true);
    });

    it("shouldSpawn returns false before interval", () => {
      manager.startGame();
      manager.updateSpawnTime(1000);
      expect(manager.shouldSpawn(1001)).toBe(false);
    });

    it("updatePowerUpTime updates state", () => {
      manager.updatePowerUpTime(12345);
      expect(manager.getState().lastPowerUpTime).toBe(12345);
    });
  });

  describe("updatePlayTime", () => {
    it("accumulates play time", () => {
      manager.startGame();
      manager.updatePlayTime(16);
      manager.updatePlayTime(16);
      expect(manager.getState().playTime).toBe(32);
    });
  });

  describe("level progression", () => {
    it("levels up when score crosses threshold", () => {
      manager.startGame();
      // Add enough score to level up
      // levelUpThreshold=75, spawnRateCurve=0.85
      // level = floor((score/75)^0.85) + 1
      // To get level 2: (score/75)^0.85 >= 1 → score/75 >= 1 → score >= 75
      for (let i = 0; i < 20; i++) {
        manager.addScore(100);
      }
      expect(manager.level).toBeGreaterThan(1);
    });

    it("fires onLevelUp callback", () => {
      manager.startGame();
      for (let i = 0; i < 20; i++) {
        manager.addScore(100);
      }
      expect(callbacks.onLevelUp).toHaveBeenCalled();
    });

    it("does not exceed maxLevel", () => {
      manager.startGame();
      for (let i = 0; i < 500; i++) {
        manager.addScore(1000);
      }
      expect(manager.level).toBeLessThanOrEqual(difficulty.maxLevel);
    });
  });

  describe("public getters", () => {
    it("level getter returns current level", () => {
      expect(manager.level).toBe(1);
    });

    it("score getter returns current score", () => {
      expect(manager.score).toBe(0);
    });

    it("lives getter returns current lives", () => {
      expect(manager.lives).toBe(livesConfig.starting);
    });

    it("bankedAnimals getter returns 0 initially", () => {
      expect(manager.bankedAnimals).toBe(0);
    });
  });

  describe("canBank", () => {
    it("returns true when stack meets minimum", () => {
      expect(manager.canBank(banking.minStackToBank)).toBe(true);
    });

    it("returns false when stack is below minimum", () => {
      expect(manager.canBank(banking.minStackToBank - 1)).toBe(false);
    });

    it("returns true when stack exceeds minimum", () => {
      expect(manager.canBank(banking.minStackToBank + 5)).toBe(true);
    });
  });
});
