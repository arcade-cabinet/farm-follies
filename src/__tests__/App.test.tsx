import { fireEvent, render, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import App from "../App";

// Mock the heavy game components to isolate App logic
vi.mock("../game/screens/GameScreen", () => ({
  GameScreen: () => <div data-testid="game-screen">GameScreen</div>,
}));

vi.mock("../game/screens/SplashScreen", () => ({
  SplashScreen: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="splash-screen">
      <button data-testid="skip-splash" onClick={onComplete}>
        Skip
      </button>
    </div>
  ),
}));

describe("App", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows splash screen on initial render", () => {
    const { getByTestId, queryByTestId } = render(<App />);

    expect(getByTestId("splash-screen")).toBeTruthy();
    expect(queryByTestId("game-screen")).toBeNull();
  });

  it("shows game screen after splash completes", () => {
    const { getByTestId, queryByTestId } = render(<App />);

    // Click skip to complete splash
    fireEvent.click(getByTestId("skip-splash"));

    expect(queryByTestId("splash-screen")).toBeNull();
    expect(getByTestId("game-screen")).toBeTruthy();
  });

  it("only shows splash once per session", () => {
    const { getByTestId, queryByTestId, unmount } = render(<App />);

    // Complete splash
    fireEvent.click(getByTestId("skip-splash"));
    expect(getByTestId("game-screen")).toBeTruthy();

    // Splash should not reappear (state holds)
    expect(queryByTestId("splash-screen")).toBeNull();
  });
});
