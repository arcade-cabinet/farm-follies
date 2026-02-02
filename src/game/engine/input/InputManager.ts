/**
 * InputManager - Unified input handling for mouse, touch, and keyboard
 *
 * Responsibilities:
 * - Normalizes mouse and touch input
 * - Tracks drag state with velocity
 * - Handles multi-touch (future)
 * - Provides input state snapshots for game logic
 */

export interface InputState {
  /** Current pointer X position */
  pointerX: number;
  /** Current pointer Y position */
  pointerY: number;
  /** Is pointer currently down */
  isPointerDown: boolean;
  /** Is currently in a drag operation */
  isDragging: boolean;
  /** X position where drag started */
  dragStartX: number;
  /** Y position where drag started */
  dragStartY: number;
  /** Current drag velocity X */
  velocityX: number;
  /** Current drag velocity Y */
  velocityY: number;
  /** Smoothed velocity for physics */
  smoothedVelocityX: number;
  /** Time of last pointer event */
  lastEventTime: number;
}

export interface InputConfig {
  /** Minimum distance to start drag (pixels) */
  dragThreshold: number;
  /** Velocity smoothing factor (0-1, higher = more responsive) */
  velocitySmoothing: number;
  /** Velocity decay when not dragging */
  velocityDecay: number;
}

export interface InputCallbacks {
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  onDragEnd?: (x: number, y: number, velocityX: number, velocityY: number) => void;
  onTap?: (x: number, y: number) => void;
  onPointerDown?: (x: number, y: number) => void;
  onPointerUp?: (x: number, y: number) => void;
}

const DEFAULT_CONFIG: InputConfig = {
  dragThreshold: 5,
  velocitySmoothing: 0.5,
  velocityDecay: 0.9,
};

export class InputManager {
  private element: HTMLElement;
  private config: InputConfig;
  private callbacks: InputCallbacks;

  private state: InputState = {
    pointerX: 0,
    pointerY: 0,
    isPointerDown: false,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    velocityX: 0,
    velocityY: 0,
    smoothedVelocityX: 0,
    lastEventTime: 0,
  };

  private lastPointerX = 0;
  private lastPointerY = 0;
  private boundHandlers: {
    mousedown: (e: MouseEvent) => void;
    mousemove: (e: MouseEvent) => void;
    mouseup: (e: MouseEvent) => void;
    mouseleave: (e: MouseEvent) => void;
    touchstart: (e: TouchEvent) => void;
    touchmove: (e: TouchEvent) => void;
    touchend: (e: TouchEvent) => void;
    touchcancel: (e: TouchEvent) => void;
  };

  private enabled = true;

  constructor(
    element: HTMLElement,
    callbacks: InputCallbacks = {},
    config: Partial<InputConfig> = {}
  ) {
    this.element = element;
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Bind handlers
    this.boundHandlers = {
      mousedown: this.handleMouseDown.bind(this),
      mousemove: this.handleMouseMove.bind(this),
      mouseup: this.handleMouseUp.bind(this),
      mouseleave: this.handleMouseLeave.bind(this),
      touchstart: this.handleTouchStart.bind(this),
      touchmove: this.handleTouchMove.bind(this),
      touchend: this.handleTouchEnd.bind(this),
      touchcancel: this.handleTouchEnd.bind(this),
    };

    this.attach();
  }

  /**
   * Attach event listeners
   */
  attach(): void {
    this.element.addEventListener("mousedown", this.boundHandlers.mousedown);
    this.element.addEventListener("mousemove", this.boundHandlers.mousemove);
    this.element.addEventListener("mouseup", this.boundHandlers.mouseup);
    this.element.addEventListener("mouseleave", this.boundHandlers.mouseleave);
    this.element.addEventListener("touchstart", this.boundHandlers.touchstart, { passive: false });
    this.element.addEventListener("touchmove", this.boundHandlers.touchmove, { passive: false });
    this.element.addEventListener("touchend", this.boundHandlers.touchend);
    this.element.addEventListener("touchcancel", this.boundHandlers.touchcancel);
  }

  /**
   * Detach event listeners
   */
  detach(): void {
    this.element.removeEventListener("mousedown", this.boundHandlers.mousedown);
    this.element.removeEventListener("mousemove", this.boundHandlers.mousemove);
    this.element.removeEventListener("mouseup", this.boundHandlers.mouseup);
    this.element.removeEventListener("mouseleave", this.boundHandlers.mouseleave);
    this.element.removeEventListener("touchstart", this.boundHandlers.touchstart);
    this.element.removeEventListener("touchmove", this.boundHandlers.touchmove);
    this.element.removeEventListener("touchend", this.boundHandlers.touchend);
    this.element.removeEventListener("touchcancel", this.boundHandlers.touchcancel);
  }

  /**
   * Enable input handling
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable input handling
   */
  disable(): void {
    this.enabled = false;
    this.reset();
  }

  /**
   * Reset input state
   */
  reset(): void {
    this.state = {
      pointerX: this.state.pointerX,
      pointerY: this.state.pointerY,
      isPointerDown: false,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      velocityX: 0,
      velocityY: 0,
      smoothedVelocityX: 0,
      lastEventTime: 0,
    };
  }

  /**
   * Get current input state (immutable snapshot)
   */
  getState(): Readonly<InputState> {
    return { ...this.state };
  }

  /**
   * Update velocity decay (call each frame when not receiving input)
   */
  update(deltaTime: number): void {
    if (!this.state.isDragging) {
      const decay = this.config.velocityDecay ** (deltaTime / 16.67);
      this.state.velocityX *= decay;
      this.state.velocityY *= decay;
      this.state.smoothedVelocityX *= decay;

      // Zero out tiny velocities
      if (Math.abs(this.state.velocityX) < 0.01) this.state.velocityX = 0;
      if (Math.abs(this.state.velocityY) < 0.01) this.state.velocityY = 0;
      if (Math.abs(this.state.smoothedVelocityX) < 0.01) this.state.smoothedVelocityX = 0;
    }
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: InputCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Private: Get position from mouse event
  private getMousePosition(e: MouseEvent): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // Private: Get position from touch event
  private getTouchPosition(e: TouchEvent): { x: number; y: number } | null {
    if (e.touches.length === 0) return null;
    const rect = this.element.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  // Private: Handle pointer down
  private handlePointerDown(x: number, y: number): void {
    if (!this.enabled) return;

    this.state.pointerX = x;
    this.state.pointerY = y;
    this.state.isPointerDown = true;
    this.state.dragStartX = x;
    this.state.dragStartY = y;
    this.state.velocityX = 0;
    this.state.velocityY = 0;
    this.state.lastEventTime = performance.now();
    this.lastPointerX = x;
    this.lastPointerY = y;

    this.callbacks.onPointerDown?.(x, y);
  }

  // Private: Handle pointer move
  private handlePointerMove(x: number, y: number): void {
    if (!this.enabled) return;

    const now = performance.now();
    const dt = now - this.state.lastEventTime;

    // Calculate velocity
    const deltaX = x - this.lastPointerX;
    const deltaY = y - this.lastPointerY;

    if (dt > 0) {
      const instantVelocityX = deltaX;
      const instantVelocityY = deltaY;

      // Smooth velocity
      const s = this.config.velocitySmoothing;
      this.state.velocityX = this.state.velocityX * (1 - s) + instantVelocityX * s;
      this.state.velocityY = this.state.velocityY * (1 - s) + instantVelocityY * s;
      this.state.smoothedVelocityX = this.state.smoothedVelocityX * 0.6 + deltaX * 0.4;
    }

    this.state.pointerX = x;
    this.state.pointerY = y;
    this.state.lastEventTime = now;

    // Check for drag start
    if (this.state.isPointerDown && !this.state.isDragging) {
      const dx = x - this.state.dragStartX;
      const dy = y - this.state.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= this.config.dragThreshold) {
        this.state.isDragging = true;
        this.callbacks.onDragStart?.(this.state.dragStartX, this.state.dragStartY);
      }
    }

    // Drag move
    if (this.state.isDragging) {
      this.callbacks.onDragMove?.(x, y, deltaX, deltaY);
    }

    this.lastPointerX = x;
    this.lastPointerY = y;
  }

  // Private: Handle pointer up
  private handlePointerUp(x: number, y: number): void {
    if (!this.enabled) return;

    const wasDragging = this.state.isDragging;

    this.state.pointerX = x;
    this.state.pointerY = y;
    this.state.isPointerDown = false;
    this.state.isDragging = false;

    this.callbacks.onPointerUp?.(x, y);

    if (wasDragging) {
      this.callbacks.onDragEnd?.(x, y, this.state.velocityX, this.state.velocityY);
    } else {
      // It was a tap
      this.callbacks.onTap?.(x, y);
    }
  }

  // Mouse event handlers
  private handleMouseDown(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    this.handlePointerDown(pos.x, pos.y);
  }

  private handleMouseMove(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    this.handlePointerMove(pos.x, pos.y);
  }

  private handleMouseUp(e: MouseEvent): void {
    const pos = this.getMousePosition(e);
    this.handlePointerUp(pos.x, pos.y);
  }

  private handleMouseLeave(e: MouseEvent): void {
    if (this.state.isPointerDown) {
      const pos = this.getMousePosition(e);
      this.handlePointerUp(pos.x, pos.y);
    }
  }

  // Touch event handlers
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const pos = this.getTouchPosition(e);
    if (pos) this.handlePointerDown(pos.x, pos.y);
  }

  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const pos = this.getTouchPosition(e);
    if (pos) this.handlePointerMove(pos.x, pos.y);
  }

  private handleTouchEnd(e: TouchEvent): void {
    // Use last known position since touches array is empty
    this.handlePointerUp(this.state.pointerX, this.state.pointerY);
  }
}

/**
 * Create a simple input manager for drag-only games
 */
export function createDragInput(
  element: HTMLElement,
  onDrag: (x: number, deltaX: number, velocityX: number) => void
): InputManager {
  return new InputManager(element, {
    onDragMove: (x, _y, deltaX) => onDrag(x, deltaX, 0),
  });
}
