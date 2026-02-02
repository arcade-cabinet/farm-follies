/**
 * ScoreSystem unit tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCatchPoints,
  calculateBankPoints,
  calculateBushBounceBonus,
  calculateLevelBonus,
  updateCombo,
  resetCombo,
  calculateTotalMultiplier,
  applyScoreEvent,
  applyScoreEvents,
  formatScore,
  formatMultiplier,
  getScoreRank,
  createInitialScoreState,
  resetScoreState,
  DEFAULT_SCORE_CONFIG,
} from '../systems/ScoreSystem';
import type { AnimalState, ScoreState } from '../state/GameState';

describe('ScoreSystem', () => {
  const createMockAnimal = (type: string = 'chicken', variant: string = 'white'): AnimalState => ({
    id: 'animal_1',
    type: type as AnimalState['type'],
    variant,
    x: 100,
    y: 100,
    width: 50,
    height: 45,
    velocityX: 0,
    velocityY: 5,
    rotation: 0,
    scale: 1,
    active: true,
    isCaught: false,
    stackIndex: -1,
    wobblePhase: 0,
    wobbleAmplitude: 0,
    specialAbilityReady: false,
    specialAbilityCooldown: 0,
  });

  const createMockScoreState = (overrides?: Partial<ScoreState>): ScoreState => ({
    current: 0,
    multiplier: 1,
    combo: 0,
    comboTimer: 0,
    highScore: 0,
    levelScore: 0,
    ...overrides,
  });

  describe('calculateCatchPoints', () => {
    it('should calculate base points for catching animal', () => {
      const animal = createMockAnimal('chicken');
      const scoreState = createMockScoreState();
      
      const result = calculateCatchPoints(animal, 'center', scoreState);
      
      expect(result.type).toBe('catch');
      expect(result.basePoints).toBeGreaterThan(0);
      expect(result.finalPoints).toBeGreaterThan(0);
    });

    it('should add perfect catch bonus for center catches', () => {
      const animal = createMockAnimal('chicken');
      const scoreState = createMockScoreState();
      
      const centerResult = calculateCatchPoints(animal, 'center', scoreState);
      const sideResult = calculateCatchPoints(animal, 'left', scoreState);
      
      expect(centerResult.finalPoints).toBeGreaterThan(sideResult.finalPoints);
    });

    it('should apply combo multiplier', () => {
      const animal = createMockAnimal('chicken');
      const noComboState = createMockScoreState({ combo: 0 });
      const highComboState = createMockScoreState({ combo: 5 });
      
      const noComboResult = calculateCatchPoints(animal, 'left', noComboState);
      const highComboResult = calculateCatchPoints(animal, 'left', highComboState);
      
      expect(highComboResult.finalPoints).toBeGreaterThan(noComboResult.finalPoints);
    });

    it('should respect max combo multiplier', () => {
      const animal = createMockAnimal('chicken');
      const extremeComboState = createMockScoreState({ combo: 100 });
      
      const result = calculateCatchPoints(animal, 'center', extremeComboState);
      
      // Should be capped at maxComboMultiplier
      expect(result.multiplier).toBeLessThanOrEqual(DEFAULT_SCORE_CONFIG.maxComboMultiplier);
    });
  });

  describe('calculateBankPoints', () => {
    it('should calculate points for banking multiple animals', () => {
      const animals = [
        createMockAnimal('chicken'),
        createMockAnimal('duck'),
        createMockAnimal('pig'),
      ];
      const scoreState = createMockScoreState();
      
      const result = calculateBankPoints(animals, scoreState);
      
      expect(result.type).toBe('bank');
      expect(result.finalPoints).toBeGreaterThan(0);
      expect(result.source).toContain('3 animals');
    });

    it('should give stack size bonus', () => {
      const smallStack = [createMockAnimal()];
      const largeStack = [
        createMockAnimal(),
        createMockAnimal(),
        createMockAnimal(),
        createMockAnimal(),
        createMockAnimal(),
      ];
      const scoreState = createMockScoreState();
      
      const smallResult = calculateBankPoints(smallStack, scoreState);
      const largeResult = calculateBankPoints(largeStack, scoreState);
      
      // Large stack should get more than 5x small stack (due to stack bonus)
      expect(largeResult.finalPoints).toBeGreaterThan(smallResult.finalPoints * 5);
    });
  });

  describe('calculateBushBounceBonus', () => {
    it('should return bush bounce bonus', () => {
      const animal = createMockAnimal();
      const scoreState = createMockScoreState();
      
      const result = calculateBushBounceBonus(animal, scoreState);
      
      expect(result.type).toBe('bush_bounce');
      expect(result.finalPoints).toBe(DEFAULT_SCORE_CONFIG.bushBounceBonus);
    });

    it('should apply score multiplier', () => {
      const animal = createMockAnimal();
      const scoreState = createMockScoreState({ multiplier: 2 });
      
      const result = calculateBushBounceBonus(animal, scoreState);
      
      expect(result.finalPoints).toBe(DEFAULT_SCORE_CONFIG.bushBounceBonus * 2);
    });
  });

  describe('calculateLevelBonus', () => {
    it('should return level completion bonus', () => {
      const result = calculateLevelBonus(1, 0, 50000, 60000);
      
      const levelCompleteEvent = result.find(e => e.type === 'level_complete');
      expect(levelCompleteEvent).toBeDefined();
      expect(levelCompleteEvent!.finalPoints).toBe(DEFAULT_SCORE_CONFIG.levelCompleteBonus);
    });

    it('should add no miss bonus when applicable', () => {
      const result = calculateLevelBonus(1, 0, 50000, 60000);
      
      const noMissEvent = result.find(e => e.type === 'no_miss');
      expect(noMissEvent).toBeDefined();
    });

    it('should not add no miss bonus when animals missed', () => {
      const result = calculateLevelBonus(1, 5, 50000, 60000);
      
      const noMissEvent = result.find(e => e.type === 'no_miss');
      expect(noMissEvent).toBeUndefined();
    });

    it('should add speed bonus when completed faster than target', () => {
      const result = calculateLevelBonus(1, 0, 30000, 60000); // Half target time
      
      const speedEvent = result.find(e => e.type === 'speed_bonus');
      expect(speedEvent).toBeDefined();
      expect(speedEvent!.finalPoints).toBeGreaterThan(0);
    });

    it('should not add speed bonus when slower than target', () => {
      const result = calculateLevelBonus(1, 0, 70000, 60000);
      
      const speedEvent = result.find(e => e.type === 'speed_bonus');
      expect(speedEvent).toBeUndefined();
    });
  });

  describe('updateCombo', () => {
    it('should increment combo on catch', () => {
      const result = updateCombo(3, 1000, 16, true);
      
      expect(result.combo).toBe(4);
      expect(result.timer).toBe(DEFAULT_SCORE_CONFIG.comboDecayTime);
    });

    it('should decay timer when not catching', () => {
      const result = updateCombo(3, 1000, 100, false);
      
      expect(result.combo).toBe(3);
      expect(result.timer).toBe(900);
    });

    it('should reset combo when timer expires', () => {
      const result = updateCombo(5, 50, 100, false);
      
      expect(result.combo).toBe(0);
      expect(result.timer).toBe(0);
    });
  });

  describe('resetCombo', () => {
    it('should reset combo and timer to zero', () => {
      const result = resetCombo();
      
      expect(result.combo).toBe(0);
      expect(result.timer).toBe(0);
    });
  });

  describe('calculateTotalMultiplier', () => {
    it('should return base multiplier with no modifiers', () => {
      const scoreState = createMockScoreState();
      
      const result = calculateTotalMultiplier(scoreState, false);
      
      expect(result).toBe(1);
    });

    it('should include combo contribution', () => {
      const scoreState = createMockScoreState({ combo: 5 });
      
      const result = calculateTotalMultiplier(scoreState, false);
      
      expect(result).toBeGreaterThan(1);
    });

    it('should double with power-up active', () => {
      const scoreState = createMockScoreState();
      
      const withPowerUp = calculateTotalMultiplier(scoreState, true);
      const withoutPowerUp = calculateTotalMultiplier(scoreState, false);
      
      expect(withPowerUp).toBe(withoutPowerUp * 2);
    });
  });

  describe('applyScoreEvent', () => {
    it('should add points to current score', () => {
      const scoreState = createMockScoreState({ current: 100 });
      const event = {
        type: 'catch' as const,
        basePoints: 10,
        multiplier: 1,
        finalPoints: 10,
      };
      
      const result = applyScoreEvent(scoreState, event);
      
      expect(result.current).toBe(110);
    });

    it('should update high score if exceeded', () => {
      const scoreState = createMockScoreState({ current: 100, highScore: 50 });
      const event = {
        type: 'catch' as const,
        basePoints: 10,
        multiplier: 1,
        finalPoints: 10,
      };
      
      const result = applyScoreEvent(scoreState, event);
      
      expect(result.highScore).toBe(110);
    });

    it('should not lower high score', () => {
      const scoreState = createMockScoreState({ current: 100, highScore: 200 });
      const event = {
        type: 'catch' as const,
        basePoints: 10,
        multiplier: 1,
        finalPoints: 10,
      };
      
      const result = applyScoreEvent(scoreState, event);
      
      expect(result.highScore).toBe(200);
    });
  });

  describe('applyScoreEvents', () => {
    it('should apply multiple events sequentially', () => {
      const scoreState = createMockScoreState();
      const events = [
        { type: 'catch' as const, basePoints: 10, multiplier: 1, finalPoints: 10 },
        { type: 'catch' as const, basePoints: 10, multiplier: 1, finalPoints: 15 },
        { type: 'catch' as const, basePoints: 10, multiplier: 1, finalPoints: 20 },
      ];
      
      const result = applyScoreEvents(scoreState, events);
      
      expect(result.current).toBe(45);
    });
  });

  describe('formatScore', () => {
    it('should format small scores as-is', () => {
      expect(formatScore(500)).toBe('500');
    });

    it('should format thousands with K suffix', () => {
      expect(formatScore(1500)).toBe('1.5K');
    });

    it('should format millions with M suffix', () => {
      expect(formatScore(1500000)).toBe('1.5M');
    });
  });

  describe('formatMultiplier', () => {
    it('should format multiplier with x prefix', () => {
      expect(formatMultiplier(2.5)).toBe('×2.5');
    });
  });

  describe('getScoreRank', () => {
    it('should return E rank for low scores', () => {
      const result = getScoreRank(500);
      expect(result.rank).toBe('E');
    });

    it('should return S rank for high scores', () => {
      const result = getScoreRank(10000);
      expect(result.rank).toBe('S');
    });

    it('should include description', () => {
      const result = getScoreRank(5000);
      expect(result.description).toBeTruthy();
    });
  });

  describe('createInitialScoreState', () => {
    it('should create state with zero score', () => {
      const result = createInitialScoreState();
      
      expect(result.current).toBe(0);
      expect(result.multiplier).toBe(1);
      expect(result.combo).toBe(0);
    });

    it('should preserve provided high score', () => {
      const result = createInitialScoreState(1000);
      
      expect(result.highScore).toBe(1000);
    });
  });

  describe('resetScoreState', () => {
    it('should reset score but preserve high score', () => {
      const state = createMockScoreState({
        current: 500,
        combo: 10,
        highScore: 1000,
      });
      
      const result = resetScoreState(state);
      
      expect(result.current).toBe(0);
      expect(result.combo).toBe(0);
      expect(result.highScore).toBe(1000);
    });
  });
});
