/**
 * InputManager unit tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputManager } from "../input/InputManager";

describe("InputManager", () => {
  let element: HTMLElement;
  let manager: InputManager;

  beforeEach(() => {
    // Create mock element
    element = document.createElement("div");
    element.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    document.body.appendChild(element);
  });

  afterEach(() => {
    manager?.detach();
    document.body.removeChild(element);
  });

  describe("state", () => {
    it("should initialize with default state", () => {
      manager = new InputManager(element);

      const state = manager.getState();

      expect(state.isPointerDown).toBe(false);
      expect(state.isDragging).toBe(false);
      expect(state.velocityX).toBe(0);
    });

    it("should return immutable state snapshot", () => {
      manager = new InputManager(element);

      const state1 = manager.getState();
      const state2 = manager.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe("mouse events", () => {
    it("should update pointer position on mouse move", () => {
      manager = new InputManager(element);

      const event = new MouseEvent("mousemove", {
        clientX: 50,
        clientY: 50,
      });
      element.dispatchEvent(event);

      const state = manager.getState();
      expect(state.pointerX).toBe(50);
      expect(state.pointerY).toBe(50);
    });

    it("should set isPointerDown on mousedown", () => {
      manager = new InputManager(element);

      const event = new MouseEvent("mousedown", {
        clientX: 50,
        clientY: 50,
      });
      element.dispatchEvent(event);

      expect(manager.getState().isPointerDown).toBe(true);
    });

    it("should clear isPointerDown on mouseup", () => {
      manager = new InputManager(element);

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mouseup", { clientX: 50, clientY: 50 }));

      expect(manager.getState().isPointerDown).toBe(false);
    });
  });

  describe("drag detection", () => {
    it("should detect drag after threshold", () => {
      manager = new InputManager(element, {}, { dragThreshold: 5 });

      // Mouse down
      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));

      // Move past threshold
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }));

      expect(manager.getState().isDragging).toBe(true);
    });

    it("should not detect drag below threshold", () => {
      manager = new InputManager(element, {}, { dragThreshold: 10 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 52, clientY: 50 }));

      expect(manager.getState().isDragging).toBe(false);
    });
  });

  describe("callbacks", () => {
    it("should call onDragStart when drag begins", () => {
      const onDragStart = vi.fn();
      manager = new InputManager(element, { onDragStart }, { dragThreshold: 5 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }));

      expect(onDragStart).toHaveBeenCalledWith(50, 50);
    });

    it("should call onDragMove during drag", () => {
      const onDragMove = vi.fn();
      manager = new InputManager(element, { onDragMove }, { dragThreshold: 5 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 70, clientY: 50 }));

      // Called for each move during drag
      expect(onDragMove).toHaveBeenCalled();
    });

    it("should call onDragEnd when drag ends", () => {
      const onDragEnd = vi.fn();
      manager = new InputManager(element, { onDragEnd }, { dragThreshold: 5 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mouseup", { clientX: 70, clientY: 50 }));

      expect(onDragEnd).toHaveBeenCalled();
    });

    it("should call onTap for click without drag", () => {
      const onTap = vi.fn();
      manager = new InputManager(element, { onTap }, { dragThreshold: 10 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mouseup", { clientX: 52, clientY: 50 }));

      expect(onTap).toHaveBeenCalledWith(52, 50);
    });
  });

  describe("enable/disable", () => {
    it("should not process events when disabled", () => {
      const onPointerDown = vi.fn();
      manager = new InputManager(element, { onPointerDown });

      manager.disable();
      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));

      expect(onPointerDown).not.toHaveBeenCalled();
    });

    it("should process events after re-enable", () => {
      const onPointerDown = vi.fn();
      manager = new InputManager(element, { onPointerDown });

      manager.disable();
      manager.enable();
      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));

      expect(onPointerDown).toHaveBeenCalled();
    });
  });

  describe("velocity", () => {
    it("should track velocity during drag", () => {
      manager = new InputManager(element, {}, { dragThreshold: 0 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 70, clientY: 50 }));

      const state = manager.getState();
      expect(state.velocityX).not.toBe(0);
    });

    it("should decay velocity over time", () => {
      manager = new InputManager(element, {}, { velocityDecay: 0.5 });

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 50 }));
      element.dispatchEvent(new MouseEvent("mouseup", { clientX: 100, clientY: 50 }));

      const initialVelocity = manager.getState().velocityX;

      // Update to decay
      manager.update(100);

      const decayedVelocity = manager.getState().velocityX;
      expect(Math.abs(decayedVelocity)).toBeLessThan(Math.abs(initialVelocity));
    });
  });

  describe("reset", () => {
    it("should reset state", () => {
      manager = new InputManager(element);

      element.dispatchEvent(new MouseEvent("mousedown", { clientX: 50, clientY: 50 }));

      manager.reset();

      const state = manager.getState();
      expect(state.isPointerDown).toBe(false);
      expect(state.isDragging).toBe(false);
    });
  });

  describe("keyboard input", () => {
    it("should initialize with keyboard inactive", () => {
      manager = new InputManager(element);

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });

    it("should set direction -1 on ArrowLeft keydown", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(-1);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should set direction 1 on ArrowRight keydown", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(1);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should set direction -1 on KeyA keydown", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyA", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(-1);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should set direction 1 on KeyD keydown", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(1);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should clear direction on keyup", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));
      expect(manager.getState().isKeyboardActive).toBe(true);

      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });

    it("should handle both keys held (cancel out)", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should keep direction when one of two keys is released", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowLeft", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowLeft", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(1);
      expect(state.isKeyboardActive).toBe(true);
    });

    it("should not respond to keyboard when disabled", () => {
      manager = new InputManager(element);

      manager.disable();
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });

    it("should clear keyboard state on reset", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));
      expect(manager.getState().isKeyboardActive).toBe(true);

      manager.reset();

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });

    it("should not respond to non-movement keys", () => {
      manager = new InputManager(element);

      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });

    it("should remove keyboard listeners on detach", () => {
      manager = new InputManager(element);

      manager.detach();
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", bubbles: true }));

      const state = manager.getState();
      expect(state.keyboardDirection).toBe(0);
      expect(state.isKeyboardActive).toBe(false);
    });
  });
});
