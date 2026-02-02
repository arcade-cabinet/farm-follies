import { describe, expect, it } from "vitest";
import {
  DEFAULT_BUSH_CONFIG,
  createBushFromPoop,
  createBushVisualState,
  createBushRuntimeState,
  createBounceLeaves,
  updateBushGrowth,
  updateBushVisual,
  applyBushBounce,
  shouldRemoveBush,
  calculateBushOpacity,
  updateAllBushes,
  addBushToState,
  removeBushFromState,
  getActiveBushes,
  findNearbyBushes,
  type BushConfig,
} from "../systems/BushSystem";
import type { BushState, ProjectileState } from "../state/GameState";

// Helper to create a mock projectile
function mockProjectile(overrides: Partial<ProjectileState> = {}): ProjectileState {
  return {
    id: "proj_1",
    type: "poop",
    x: 200,
    y: 100,
    width: 10,
    height: 10,
    velocityX: 2,
    velocityY: 5,
    rotation: 0,
    scale: 1,
    active: true,
    damage: 0,
    lifetime: 3000,
    sourceAnimalId: "cow_1",
    ...overrides,
  };
}

// Helper to create a mock bush
function mockBush(overrides: Partial<BushState> = {}): BushState {
  return {
    id: "bush_1",
    x: 200,
    y: 400,
    width: 60,
    height: 80,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    scale: 0.3,
    active: true,
    growthStage: 0,
    bounceStrength: DEFAULT_BUSH_CONFIG.baseBounceStrength,
    plantedBy: "cow_1",
    ...overrides,
  };
}

describe("BushSystem", () => {
  describe("DEFAULT_BUSH_CONFIG", () => {
    it("has sensible growth values", () => {
      expect(DEFAULT_BUSH_CONFIG.growthDuration).toBeGreaterThan(0);
      expect(DEFAULT_BUSH_CONFIG.initialSize).toBeGreaterThan(0);
      expect(DEFAULT_BUSH_CONFIG.maxSize).toBeGreaterThan(DEFAULT_BUSH_CONFIG.initialSize);
    });

    it("has sensible bounce values", () => {
      expect(DEFAULT_BUSH_CONFIG.baseBounceStrength).toBeGreaterThan(0);
      expect(DEFAULT_BUSH_CONFIG.maxBounceStrength).toBeGreaterThanOrEqual(
        DEFAULT_BUSH_CONFIG.baseBounceStrength
      );
      expect(DEFAULT_BUSH_CONFIG.bounceDecay).toBeGreaterThan(0);
    });

    it("has sensible lifetime values", () => {
      expect(DEFAULT_BUSH_CONFIG.maxLifetime).toBeGreaterThan(0);
      expect(DEFAULT_BUSH_CONFIG.fadeStartPercent).toBeGreaterThan(0);
      expect(DEFAULT_BUSH_CONFIG.fadeStartPercent).toBeLessThan(1);
    });
  });

  describe("createBushFromPoop", () => {
    it("creates a bush at projectile x and ground y", () => {
      const proj = mockProjectile({ x: 150 });
      const bush = createBushFromPoop(proj, 400);
      expect(bush.x).toBe(150);
      expect(bush.y).toBe(400);
    });

    it("starts at initial size", () => {
      const bush = createBushFromPoop(mockProjectile(), 400);
      expect(bush.scale).toBe(DEFAULT_BUSH_CONFIG.initialSize);
    });

    it("starts at growth stage 0", () => {
      const bush = createBushFromPoop(mockProjectile(), 400);
      expect(bush.growthStage).toBe(0);
    });

    it("is active", () => {
      const bush = createBushFromPoop(mockProjectile(), 400);
      expect(bush.active).toBe(true);
    });

    it("tracks source animal", () => {
      const proj = mockProjectile({ sourceAnimalId: "cow_42" });
      const bush = createBushFromPoop(proj, 400);
      expect(bush.plantedBy).toBe("cow_42");
    });

    it("generates unique IDs", () => {
      const b1 = createBushFromPoop(mockProjectile(), 400);
      const b2 = createBushFromPoop(mockProjectile(), 400);
      expect(b1.id).not.toBe(b2.id);
    });
  });

  describe("updateBushGrowth", () => {
    it("increases growth stage over time", () => {
      const bush = mockBush({ growthStage: 0 });
      const updated = updateBushGrowth(bush, 500);
      expect(updated.growthStage).toBeGreaterThan(0);
    });

    it("caps growth at 1.0", () => {
      const bush = mockBush({ growthStage: 0.99 });
      const updated = updateBushGrowth(bush, 5000);
      expect(updated.growthStage).toBeLessThanOrEqual(1);
    });

    it("does not grow beyond 1.0", () => {
      const bush = mockBush({ growthStage: 1 });
      const updated = updateBushGrowth(bush, 500);
      expect(updated).toBe(bush); // Same reference, no change
    });

    it("scales size with growth", () => {
      const bush = mockBush({ growthStage: 0, scale: DEFAULT_BUSH_CONFIG.initialSize });
      const updated = updateBushGrowth(bush, 1000);
      expect(updated.scale).toBeGreaterThan(DEFAULT_BUSH_CONFIG.initialSize);
    });

    it("increases bounce strength with growth", () => {
      const bush = mockBush({
        growthStage: 0,
        bounceStrength: DEFAULT_BUSH_CONFIG.baseBounceStrength,
      });
      const updated = updateBushGrowth(bush, 1000);
      expect(updated.bounceStrength).toBeGreaterThan(DEFAULT_BUSH_CONFIG.baseBounceStrength);
    });
  });

  describe("updateBushVisual", () => {
    it("updates sway phase", () => {
      const visual = createBushVisualState();
      const bush = mockBush({ growthStage: 0.5 });
      const updated = updateBushVisual(visual, bush, 16.67);
      expect(updated.swayPhase).not.toBe(visual.swayPhase);
    });

    it("removes expired leaf particles", () => {
      const visual = createBushVisualState();
      visual.leafParticles = [
        {
          x: 0,
          y: 0,
          vx: 1,
          vy: -1,
          rotation: 0,
          rotationSpeed: 0.1,
          size: 5,
          lifetime: -1,
          color: "#228B22",
        },
      ];
      const bush = mockBush({ growthStage: 1 });
      const updated = updateBushVisual(visual, bush, 16.67);
      expect(updated.leafParticles).toHaveLength(0);
    });
  });

  describe("createBounceLeaves", () => {
    it("creates the requested number of leaves", () => {
      const bush = mockBush();
      const leaves = createBounceLeaves(bush, 5, 8);
      expect(leaves).toHaveLength(8);
    });

    it("defaults to 5 leaves", () => {
      const bush = mockBush();
      const leaves = createBounceLeaves(bush, 5);
      expect(leaves).toHaveLength(5);
    });

    it("leaves have valid properties", () => {
      const bush = mockBush();
      const leaves = createBounceLeaves(bush, 5);
      for (const leaf of leaves) {
        expect(leaf.lifetime).toBeGreaterThan(0);
        expect(leaf.size).toBeGreaterThan(0);
        expect(leaf.color).toBeTruthy();
      }
    });
  });

  describe("applyBushBounce", () => {
    it("reduces bounce strength", () => {
      const bush = mockBush({ bounceStrength: 1.0 });
      const bounced = applyBushBounce(bush);
      expect(bounced.bounceStrength).toBeLessThan(1.0);
    });

    it("does not reduce below minimum", () => {
      const bush = mockBush({ bounceStrength: 0.1 });
      const bounced = applyBushBounce(bush);
      expect(bounced.bounceStrength).toBeGreaterThan(0);
    });
  });

  describe("shouldRemoveBush", () => {
    it("returns false for young bush", () => {
      const bush = mockBush();
      expect(shouldRemoveBush(bush, 0, 1000)).toBe(false);
    });

    it("returns true for expired bush", () => {
      const bush = mockBush();
      expect(shouldRemoveBush(bush, 0, DEFAULT_BUSH_CONFIG.maxLifetime + 1)).toBe(true);
    });

    it("returns true for inactive bush", () => {
      const bush = mockBush({ active: false });
      expect(shouldRemoveBush(bush, 0, 1000)).toBe(true);
    });
  });

  describe("calculateBushOpacity", () => {
    it("returns 1 for young bush", () => {
      expect(calculateBushOpacity(0, 1000)).toBe(1);
    });

    it("returns 1 before fade threshold", () => {
      const beforeFade = DEFAULT_BUSH_CONFIG.maxLifetime * DEFAULT_BUSH_CONFIG.fadeStartPercent - 1;
      expect(calculateBushOpacity(0, beforeFade)).toBe(1);
    });

    it("returns less than 1 after fade threshold", () => {
      const afterFade =
        DEFAULT_BUSH_CONFIG.maxLifetime * (DEFAULT_BUSH_CONFIG.fadeStartPercent + 0.1);
      expect(calculateBushOpacity(0, afterFade)).toBeLessThan(1);
    });

    it("returns 0 at end of lifetime", () => {
      expect(calculateBushOpacity(0, DEFAULT_BUSH_CONFIG.maxLifetime)).toBe(0);
    });
  });

  describe("updateAllBushes", () => {
    it("updates all bushes in array", () => {
      const bushes = [mockBush({ id: "b1", growthStage: 0 }), mockBush({ id: "b2", growthStage: 0 })];
      const updated = updateAllBushes(bushes, 500);
      expect(updated[0].growthStage).toBeGreaterThan(0);
      expect(updated[1].growthStage).toBeGreaterThan(0);
    });
  });

  describe("BushRuntimeState", () => {
    it("creates empty state", () => {
      const state = createBushRuntimeState();
      expect(state.bushes.size).toBe(0);
      expect(state.visuals.size).toBe(0);
      expect(state.totalBounces).toBe(0);
    });

    it("adds bush to state", () => {
      const state = createBushRuntimeState();
      const bush = mockBush();
      const updated = addBushToState(state, bush);
      expect(updated.bushes.size).toBe(1);
      expect(updated.visuals.size).toBe(1);
      expect(updated.bushes.get(bush.id)).toBe(bush);
    });

    it("removes bush from state", () => {
      let state = createBushRuntimeState();
      const bush = mockBush();
      state = addBushToState(state, bush);
      const updated = removeBushFromState(state, bush.id);
      expect(updated.bushes.size).toBe(0);
      expect(updated.visuals.size).toBe(0);
    });

    it("getActiveBushes filters inactive", () => {
      let state = createBushRuntimeState();
      state = addBushToState(state, mockBush({ id: "b1", active: true }));
      state = addBushToState(state, mockBush({ id: "b2", active: false }));
      const active = getActiveBushes(state);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("b1");
    });
  });

  describe("findNearbyBushes", () => {
    it("finds bushes within radius", () => {
      const bushes = [
        mockBush({ id: "near", x: 190, y: 395 }),
        mockBush({ id: "far", x: 500, y: 400 }),
      ];
      const nearby = findNearbyBushes(bushes, 220, 435, 100);
      expect(nearby).toHaveLength(1);
      expect(nearby[0].id).toBe("near");
    });

    it("returns empty for no nearby bushes", () => {
      const bushes = [mockBush({ x: 500, y: 500 })];
      const nearby = findNearbyBushes(bushes, 0, 0, 50);
      expect(nearby).toHaveLength(0);
    });
  });
});
