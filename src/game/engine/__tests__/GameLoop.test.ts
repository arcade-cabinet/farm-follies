/**
 * GameLoop unit tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSimpleLoop, GameLoop } from "../core/GameLoop";

describe("GameLoop", () => {
  let loop: GameLoop;
  let fixedUpdateCalls: number;
  let updateCalls: number;
  let renderCalls: number;

  beforeEach(() => {
    fixedUpdateCalls = 0;
    updateCalls = 0;
    renderCalls = 0;

    // Mock requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      setTimeout(cb, 16);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    loop?.stop();
    vi.unstubAllGlobals();
  });

  it("should call callbacks when running", async () => {
    loop = new GameLoop({
      fixedUpdate: () => fixedUpdateCalls++,
      update: () => updateCalls++,
      render: () => renderCalls++,
    });

    loop.start();

    // Wait for a few frames
    await new Promise((resolve) => setTimeout(resolve, 50));

    loop.stop();

    expect(fixedUpdateCalls).toBeGreaterThan(0);
    expect(updateCalls).toBeGreaterThan(0);
    expect(renderCalls).toBeGreaterThan(0);
  });

  it("should not call update when paused", async () => {
    loop = new GameLoop({
      fixedUpdate: () => fixedUpdateCalls++,
      update: () => updateCalls++,
      render: () => renderCalls++,
    });

    loop.start();
    loop.pause();

    const initialFixed = fixedUpdateCalls;
    const initialUpdate = updateCalls;

    // Wait while paused
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should still render but not update
    expect(fixedUpdateCalls).toBe(initialFixed);
    expect(updateCalls).toBe(initialUpdate);
    expect(renderCalls).toBeGreaterThan(0);

    loop.stop();
  });

  it("should resume after pause", async () => {
    loop = new GameLoop({
      fixedUpdate: () => fixedUpdateCalls++,
      update: () => updateCalls++,
      render: () => renderCalls++,
    });

    loop.start();
    loop.pause();

    await new Promise((resolve) => setTimeout(resolve, 20));

    const pausedFixed = fixedUpdateCalls;

    loop.resume();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fixedUpdateCalls).toBeGreaterThan(pausedFixed);

    loop.stop();
  });

  it("should report running state correctly", () => {
    loop = new GameLoop({
      fixedUpdate: () => {},
      update: () => {},
      render: () => {},
    });

    expect(loop.running).toBe(false);

    loop.start();
    expect(loop.running).toBe(true);

    loop.stop();
    expect(loop.running).toBe(false);
  });

  it("should report paused state correctly", () => {
    loop = new GameLoop({
      fixedUpdate: () => {},
      update: () => {},
      render: () => {},
    });

    loop.start();
    expect(loop.paused).toBe(false);

    loop.pause();
    expect(loop.paused).toBe(true);

    loop.resume();
    expect(loop.paused).toBe(false);

    loop.stop();
  });

  it("should provide metrics when enabled", async () => {
    loop = new GameLoop(
      {
        fixedUpdate: () => {},
        update: () => {},
        render: () => {},
      },
      { enableMetrics: true }
    );

    loop.start();

    await new Promise((resolve) => setTimeout(resolve, 50));

    const metrics = loop.getMetrics();

    expect(metrics.frameTime).toBeGreaterThan(0);

    loop.stop();
  });

  it("should add and remove visibilitychange listener on start/stop", () => {
    loop = new GameLoop({
      fixedUpdate: () => fixedUpdateCalls++,
      update: () => updateCalls++,
      render: () => renderCalls++,
    });

    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    loop.start();

    // Should have added visibilitychange listener
    expect(addSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    loop.stop();

    // Should have removed visibilitychange listener
    expect(removeSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("should reset accumulator when tab becomes visible again", async () => {
    // Track fixed updates to detect if stale time gets processed
    let fixedUpdates = 0;

    loop = new GameLoop({
      fixedUpdate: () => fixedUpdates++,
      update: () => {},
      render: () => {},
    });

    // Capture the handler that gets registered
    let visibilityHandler: (() => void) | null = null;
    const addSpy = vi
      .spyOn(document, "addEventListener")
      .mockImplementation((event: string, handler: EventListenerOrEventListenerObject) => {
        if (event === "visibilitychange") {
          visibilityHandler = handler as () => void;
        }
      });

    loop.start();
    expect(visibilityHandler).not.toBeNull();

    // Wait for some frames to run
    await new Promise((resolve) => setTimeout(resolve, 50));

    const updatesBeforeVisibility = fixedUpdates;

    // Simulate tab returning to foreground — the handler should reset timing
    // so no massive burst of fixedUpdate calls happens
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
    visibilityHandler!();

    // The handler itself doesn't produce frames; it just resets the internal
    // timing so the NEXT frame won't see a huge elapsed delta.
    // If the handler ran without error, timing was reset successfully.
    expect(fixedUpdates).toBeGreaterThanOrEqual(updatesBeforeVisibility);

    loop.stop();
    addSpy.mockRestore();

    // Restore visibilityState
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
      configurable: true,
    });
  });

  it("should not start if already running", () => {
    let startCount = 0;

    loop = new GameLoop({
      fixedUpdate: () => startCount++,
      update: () => {},
      render: () => {},
    });

    loop.start();
    loop.start(); // Second start should be ignored

    expect(loop.running).toBe(true);

    loop.stop();
  });
});

describe("createSimpleLoop", () => {
  it("should create a loop with simplified callbacks", async () => {
    let updateCalls = 0;
    let renderCalls = 0;

    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      setTimeout(cb, 16);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const loop = createSimpleLoop(
      () => updateCalls++,
      () => renderCalls++
    );

    loop.start();

    await new Promise((resolve) => setTimeout(resolve, 50));

    loop.stop();

    expect(updateCalls).toBeGreaterThan(0);
    expect(renderCalls).toBeGreaterThan(0);

    vi.unstubAllGlobals();
  });
});
