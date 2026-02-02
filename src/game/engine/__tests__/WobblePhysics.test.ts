/**
 * WobblePhysics unit tests
 */

import { describe, expect, it } from "vitest";
import type { AnimalState } from "../state/GameState";
import {
  applyStackImpulse,
  calculateMovementWobble,
  createAnimalWobbleState,
  createStackWobbleState,
  DEFAULT_WOBBLE_CONFIG,
  getAnimalWeight,
  getVisualWobbleAngle,
  getWobbleOffset,
  stabilizeStack,
  updateAnimalWobble,
  updateStackWobble,
} from "../systems/WobblePhysics";

describe("WobblePhysics", () => {
  const createMockAnimal = (id: string, stackIndex: number): AnimalState => ({
    id,
    type: "chicken",
    variant: "white",
    x: 100,
    y: 100 - stackIndex * 50,
    width: 50,
    height: 45,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    scale: 1,
    active: true,
    isCaught: true,
    stackIndex,
    wobblePhase: 0,
    wobbleAmplitude: 0,
    specialAbilityReady: false,
    specialAbilityCooldown: 0,
  });

  describe("createAnimalWobbleState", () => {
    it("should create state with zero angle by default", () => {
      const state = createAnimalWobbleState();

      expect(state.angle).toBe(0);
      expect(state.velocity).toBe(0);
      expect(state.accumulated).toBe(0);
    });

    it("should accept initial angle", () => {
      const state = createAnimalWobbleState(0.5);

      expect(state.angle).toBe(0.5);
    });

    it("should have random phase within [0, 2*PI)", () => {
      const state = createAnimalWobbleState();

      expect(state.phase).toBeGreaterThanOrEqual(0);
      expect(state.phase).toBeLessThan(Math.PI * 2);
    });
  });

  describe("createStackWobbleState", () => {
    it("should create empty stack state", () => {
      const state = createStackWobbleState();

      expect(state.animals.size).toBe(0);
      expect(state.overallIntensity).toBe(0);
      expect(state.isWarning).toBe(false);
      expect(state.isCollapsing).toBe(false);
    });
  });

  describe("calculateMovementWobble", () => {
    it("should return zero wobble for zero velocity", () => {
      const result = calculateMovementWobble(0, 0, 16, DEFAULT_WOBBLE_CONFIG);

      expect(result.wobble).toBe(0);
      expect(result.acceleration).toBe(0);
    });

    it("should increase wobble with velocity", () => {
      const lowVelocity = calculateMovementWobble(2, 0, 16, DEFAULT_WOBBLE_CONFIG);
      const highVelocity = calculateMovementWobble(10, 0, 16, DEFAULT_WOBBLE_CONFIG);

      expect(highVelocity.wobble).toBeGreaterThan(lowVelocity.wobble);
    });

    it("should add extra wobble for acceleration changes", () => {
      const steadyMotion = calculateMovementWobble(5, 5, 16, DEFAULT_WOBBLE_CONFIG);
      const accelerating = calculateMovementWobble(10, 5, 16, DEFAULT_WOBBLE_CONFIG);

      expect(accelerating.wobble).toBeGreaterThan(steadyMotion.wobble);
    });
  });

  describe("getAnimalWeight", () => {
    it("should return correct weights for different animals", () => {
      expect(getAnimalWeight("chicken")).toBe(0.5);
      expect(getAnimalWeight("cow")).toBe(2.0);
      expect(getAnimalWeight("horse")).toBe(2.2);
    });

    it("should return default weight for unknown animals", () => {
      expect(getAnimalWeight("unknown")).toBe(1.0);
    });
  });

  describe("updateAnimalWobble", () => {
    it("should update wobble state over time", () => {
      const initial = createAnimalWobbleState();

      const updated = updateAnimalWobble(
        initial,
        0,
        0.1, // Some movement wobble
        16,
        DEFAULT_WOBBLE_CONFIG,
        1.0
      );

      // State should change
      expect(updated.phase).not.toBe(initial.phase);
    });

    it("should amplify wobble at higher stack positions", () => {
      const initialState = createAnimalWobbleState();

      const bottomAnimal = updateAnimalWobble(
        { ...initialState },
        0, // Bottom of stack
        0.1,
        16,
        DEFAULT_WOBBLE_CONFIG,
        1.0
      );

      const topAnimal = updateAnimalWobble(
        { ...initialState },
        5, // Higher in stack
        0.1,
        16,
        DEFAULT_WOBBLE_CONFIG,
        1.0
      );

      // Top animal should have more wobble than bottom animal
      expect(Math.abs(topAnimal.angle)).toBeGreaterThanOrEqual(Math.abs(bottomAnimal.angle));
      expect(DEFAULT_WOBBLE_CONFIG.heightMultiplier).toBeGreaterThan(0);
    });
  });

  describe("updateStackWobble", () => {
    it("should create wobble states for new animals", () => {
      const initialState = createStackWobbleState();
      const animals = [createMockAnimal("a1", 0), createMockAnimal("a2", 1)];

      const updated = updateStackWobble(
        initialState,
        animals,
        0, // No player velocity
        16,
        DEFAULT_WOBBLE_CONFIG
      );

      expect(updated.animals.size).toBe(2);
      expect(updated.animals.has("a1")).toBe(true);
      expect(updated.animals.has("a2")).toBe(true);
    });

    it("should detect warning state at high wobble", () => {
      // Start with high wobble
      const state = createStackWobbleState();
      state.animals.set("a1", {
        angle: DEFAULT_WOBBLE_CONFIG.warningThreshold + 0.1,
        velocity: 0,
        phase: 0,
        accumulated: 0,
      });

      const animals = [createMockAnimal("a1", 0)];

      const updated = updateStackWobble(
        state,
        animals,
        5, // High velocity
        16,
        DEFAULT_WOBBLE_CONFIG
      );

      // Should trigger warning state and have positive intensity
      expect(updated.overallIntensity).toBeGreaterThan(0);
      expect(updated.isWarning).toBe(true);
    });

    it("should track player velocity for acceleration calculation", () => {
      const state = createStackWobbleState();
      const animals = [createMockAnimal("a1", 0)];

      const updated = updateStackWobble(state, animals, 10, 16);

      expect(updated.lastPlayerVelocity).toBe(10);
    });
  });

  describe("getVisualWobbleAngle", () => {
    it("should return zero for unknown animal", () => {
      const state = createStackWobbleState();

      const angle = getVisualWobbleAngle(state, "unknown", 0);

      expect(angle).toBe(0);
    });

    it("should amplify angle for higher stack positions", () => {
      const state = createStackWobbleState();
      state.animals.set("a1", {
        angle: 0.1,
        velocity: 0,
        phase: 0,
        accumulated: 0,
      });

      const bottomAngle = getVisualWobbleAngle(state, "a1", 0);
      const topAngle = getVisualWobbleAngle(state, "a1", 3);

      expect(Math.abs(topAngle)).toBeGreaterThan(Math.abs(bottomAngle));
    });
  });

  describe("getWobbleOffset", () => {
    it("should return zero for unknown animal", () => {
      const state = createStackWobbleState();

      const offset = getWobbleOffset(state, "unknown", 50);

      expect(offset).toBe(0);
    });

    it("should calculate horizontal offset from angle", () => {
      const state = createStackWobbleState();
      state.animals.set("a1", {
        angle: 0.3,
        velocity: 0,
        phase: 0,
        accumulated: 0,
      });

      const offset = getWobbleOffset(state, "a1", 50);

      expect(offset).not.toBe(0);
    });
  });

  describe("applyStackImpulse", () => {
    it("should increase velocity in impulse direction", () => {
      const state = createStackWobbleState();
      state.animals.set("a1", {
        angle: 0,
        velocity: 0,
        phase: 0,
        accumulated: 0,
      });

      const result = applyStackImpulse(state, 1, 0.5);

      const animalState = result.animals.get("a1");
      expect(animalState!.velocity).toBeGreaterThan(0);
    });

    it("should increase overall intensity", () => {
      const state = createStackWobbleState();
      state.animals.set("a1", createAnimalWobbleState());

      const result = applyStackImpulse(state, 1, 0.5);

      expect(result.overallIntensity).toBeGreaterThan(state.overallIntensity);
    });
  });

  describe("stabilizeStack", () => {
    it("should reduce wobble angles", () => {
      const state = createStackWobbleState();
      state.animals.set("a1", {
        angle: 0.5,
        velocity: 0.3,
        phase: 0,
        accumulated: 0.2,
      });
      state.overallIntensity = 0.6;

      const result = stabilizeStack(state, 0.5);

      const animalState = result.animals.get("a1");
      expect(animalState!.angle).toBeLessThan(0.5);
      expect(animalState!.velocity).toBeLessThan(0.3);
      expect(result.overallIntensity).toBeLessThan(0.6);
    });

    it("should clear warning and collapsing states", () => {
      const state = createStackWobbleState();
      state.isWarning = true;
      state.isCollapsing = true;

      const result = stabilizeStack(state);

      expect(result.isWarning).toBe(false);
      expect(result.isCollapsing).toBe(false);
    });
  });
});
