import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SplashScreen } from "../SplashScreen";

// Mock HTMLMediaElement.play
beforeEach(() => {
  vi.useFakeTimers();
  // Default: video plays successfully
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SplashScreen", () => {
  it("renders video element", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.getAttribute("playsInline")).not.toBeNull();
  });

  it("selects portrait video when height > width", () => {
    // happy-dom defaults to 1024x768 (landscape)
    // We need to override for portrait
    Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 812, configurable: true });

    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video");
    expect(video?.src).toContain("splash_portrait.mp4");
  });

  it("selects landscape video when width >= height", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 768, configurable: true });

    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video");
    expect(video?.src).toContain("splash_landscape.mp4");
  });

  it("shows skip hint text", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    expect(screen.getByText("Tap to skip")).toBeTruthy();
  });

  it("calls onComplete when video ends", async () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video")!;
    fireEvent.ended(video);

    // Wait for fade duration (600ms)
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete when user clicks to skip", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const container = document.querySelector(".fixed")!;
    fireEvent.click(container);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("prevents double completion", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video")!;
    const container = document.querySelector(".fixed")!;

    // Trigger both end and click
    fireEvent.ended(video);
    fireEvent.click(container);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    // Should only fire once despite two triggers
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete when video errors", () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    const video = document.querySelector("video")!;
    fireEvent.error(video);

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("falls back to muted autoplay when play fails", async () => {
    let callCount = 0;
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockImplementation(function (this: HTMLMediaElement) {
        callCount++;
        if (callCount === 1) {
          // First call fails (autoplay blocked)
          return Promise.reject(new Error("Autoplay blocked"));
        }
        // Second call (muted) succeeds
        return Promise.resolve();
      }),
    });

    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    // Let promises resolve
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const video = document.querySelector("video")!;
    expect(video.muted).toBe(true);
    expect(callCount).toBe(2);
  });

  it("skips to game when all play attempts fail", async () => {
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Cannot play")),
    });

    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);

    // Let promises resolve
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
