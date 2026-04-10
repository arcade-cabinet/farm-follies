/**
 * Property-Based Tests for SeededRandom Generator
 *
 * **Property 1: nextFloat() Returns Valid Numeric Values**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 *
 * Tests that the SeededRandom.nextFloat() method:
 * - Returns values between 0 and 1 when called without arguments
 * - Returns values between min and max when called with arguments
 * - Never returns NaN values
 * - Always returns finite numeric values
 */

import { fc, test } from "@fast-check/vitest";
import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../../../../e2e/helpers/generators";

describe("SeededRandom.nextFloat() Property Tests", () => {
  /**
   * Property 1.1: nextFloat() without arguments returns values between 0 and 1
   * **Validates: Requirements 1.1**
   */
  test.prop([fc.integer()])("nextFloat() without args returns value in [0, 1]", (seed) => {
    const rng = createSeededRandom(seed);
    const value = rng.nextFloat();

    // Must not be NaN
    expect(Number.isNaN(value)).toBe(false);
    // Must be finite
    expect(Number.isFinite(value)).toBe(true);
    // Must be in range [0, 1]
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);

    return true;
  });

  /**
   * Property 1.2: nextFloat(min, max) returns values between min and max
   * **Validates: Requirements 1.2**
   */
  test.prop([
    fc.integer(),
    fc.float({ noNaN: true, noDefaultInfinity: true }),
    fc.float({ noNaN: true, noDefaultInfinity: true }),
  ])("nextFloat(min, max) returns value in [min, max]", (seed, a, b) => {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    const rng = createSeededRandom(seed);
    const value = rng.nextFloat(min, max);

    // Must not be NaN
    expect(Number.isNaN(value)).toBe(false);
    // Must be finite
    expect(Number.isFinite(value)).toBe(true);
    // Must be in range [min, max]
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);

    return true;
  });

  /**
   * Property 1.3: nextFloat() never returns NaN
   * **Validates: Requirements 1.3**
   */
  test.prop([fc.integer(), fc.integer({ min: 1, max: 100 })])(
    "nextFloat() never returns NaN across multiple calls",
    (seed, callCount) => {
      const rng = createSeededRandom(seed);

      for (let i = 0; i < callCount; i++) {
        const value = rng.nextFloat();
        expect(Number.isNaN(value)).toBe(false);
      }

      return true;
    }
  );

  /**
   * Property 1.4: nextFloat() always returns finite values
   * **Validates: Requirements 1.4**
   */
  test.prop([fc.integer(), fc.integer({ min: 1, max: 100 })])(
    "nextFloat() always returns finite values across multiple calls",
    (seed, callCount) => {
      const rng = createSeededRandom(seed);

      for (let i = 0; i < callCount; i++) {
        const value = rng.nextFloat();
        expect(Number.isFinite(value)).toBe(true);
      }

      return true;
    }
  );

  /**
   * Property: nextFloat(min, max) with same min and max returns approximately that value
   * Edge case validation - uses closeTo to handle floating point precision
   */
  test.prop([
    fc.integer(),
    fc.float({
      noNaN: true,
      noDefaultInfinity: true,
      min: Math.fround(0.1),
      max: Math.fround(100),
    }),
  ])("nextFloat(x, x) returns x when min equals max", (seed, value) => {
    const rng = createSeededRandom(seed);
    const result = rng.nextFloat(value, value);

    // Use closeTo for floating point comparison (handles -0 vs +0 edge case)
    expect(result).toBeCloseTo(value, 5);
    expect(Number.isNaN(result)).toBe(false);
    expect(Number.isFinite(result)).toBe(true);
    return true;
  });

  /**
   * Property: Multiple sequential calls produce valid values
   * Tests that the generator maintains validity across many calls
   */
  test.prop([fc.integer()], { timeout: 10000 })(
    "sequential nextFloat() calls all return valid values",
    (seed) => {
      const rng = createSeededRandom(seed);
      const iterations = 10; // Reduced iterations for faster test execution

      for (let i = 0; i < iterations; i++) {
        // Test without args
        const noArgs = rng.nextFloat();
        expect(Number.isNaN(noArgs)).toBe(false);
        expect(Number.isFinite(noArgs)).toBe(true);
        expect(noArgs).toBeGreaterThanOrEqual(0);
        expect(noArgs).toBeLessThanOrEqual(1);

        // Test with args
        const withArgs = rng.nextFloat(0.2, 0.8);
        expect(Number.isNaN(withArgs)).toBe(false);
        expect(Number.isFinite(withArgs)).toBe(true);
        expect(withArgs).toBeGreaterThanOrEqual(0.2);
        expect(withArgs).toBeLessThanOrEqual(0.8);
      }

      return true;
    }
  );
});

describe("SeededRandom.nextFloat() Unit Tests", () => {
  it("returns consistent values for the same seed", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(12345);

    const value1 = rng1.nextFloat();
    const value2 = rng2.nextFloat();

    expect(value1).toBe(value2);
  });

  it("returns different values for different seeds", () => {
    const rng1 = createSeededRandom(12345);
    const rng2 = createSeededRandom(54321);

    const value1 = rng1.nextFloat();
    const value2 = rng2.nextFloat();

    expect(value1).not.toBe(value2);
  });

  it("nextFloat() without args returns value between 0 and 1", () => {
    const rng = createSeededRandom(42);
    const value = rng.nextFloat();

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
    expect(Number.isNaN(value)).toBe(false);
    expect(Number.isFinite(value)).toBe(true);
  });

  it("nextFloat(min, max) returns value in specified range", () => {
    const rng = createSeededRandom(42);
    const value = rng.nextFloat(0.2, 0.8);

    expect(value).toBeGreaterThanOrEqual(0.2);
    expect(value).toBeLessThanOrEqual(0.8);
    expect(Number.isNaN(value)).toBe(false);
    expect(Number.isFinite(value)).toBe(true);
  });

  it("nextFloat(0.3, 0.7) returns valid values (mouse/touch test pattern)", () => {
    const rng = createSeededRandom(99999);

    // This is the pattern used in mouse.spec.ts and touch.spec.ts
    const startXPercent = rng.nextFloat(0.3, 0.7);
    const endXPercent = rng.nextFloat(0.3, 0.7);

    expect(startXPercent).toBeGreaterThanOrEqual(0.3);
    expect(startXPercent).toBeLessThanOrEqual(0.7);
    expect(endXPercent).toBeGreaterThanOrEqual(0.3);
    expect(endXPercent).toBeLessThanOrEqual(0.7);
    expect(Number.isNaN(startXPercent)).toBe(false);
    expect(Number.isNaN(endXPercent)).toBe(false);
  });

  it("nextFloat(0.2, 0.8) returns valid values (targetXPercent pattern)", () => {
    const rng = createSeededRandom(88888);

    // This is the pattern used for targetXPercent in mouse.spec.ts
    const targetXPercent = rng.nextFloat(0.2, 0.8);

    expect(targetXPercent).toBeGreaterThanOrEqual(0.2);
    expect(targetXPercent).toBeLessThanOrEqual(0.8);
    expect(Number.isNaN(targetXPercent)).toBe(false);
  });

  it("handles negative ranges correctly", () => {
    const rng = createSeededRandom(42);
    const value = rng.nextFloat(-10, -5);

    expect(value).toBeGreaterThanOrEqual(-10);
    expect(value).toBeLessThanOrEqual(-5);
    expect(Number.isNaN(value)).toBe(false);
    expect(Number.isFinite(value)).toBe(true);
  });

  it("handles ranges crossing zero correctly", () => {
    const rng = createSeededRandom(42);
    const value = rng.nextFloat(-5, 5);

    expect(value).toBeGreaterThanOrEqual(-5);
    expect(value).toBeLessThanOrEqual(5);
    expect(Number.isNaN(value)).toBe(false);
    expect(Number.isFinite(value)).toBe(true);
  });
});
