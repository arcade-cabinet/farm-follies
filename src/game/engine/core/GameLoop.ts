/**
 * GameLoop - Frame-rate independent game loop with fixed timestep physics
 *
 * Responsibilities:
 * - Manages requestAnimationFrame lifecycle
 * - Provides fixed timestep for physics (deterministic)
 * - Provides variable timestep for rendering (smooth)
 * - Handles pause/resume
 * - Reports performance metrics
 */

export interface GameLoopCallbacks {
  /** Called with fixed timestep for physics/logic (deterministic) */
  fixedUpdate: (dt: number) => void;
  /** Called with variable timestep for rendering/interpolation */
  update: (dt: number, alpha: number) => void;
  /** Called each frame for rendering */
  render: (alpha: number) => void;
}

export interface GameLoopConfig {
  /** Target physics updates per second (default: 60) */
  fixedTimestep: number;
  /** Maximum frame time to prevent spiral of death (default: 250ms) */
  maxFrameTime: number;
  /** Enable performance monitoring (default: false) */
  enableMetrics: boolean;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  updateTime: number;
  renderTime: number;
  fixedUpdateCount: number;
}

const DEFAULT_CONFIG: GameLoopConfig = {
  fixedTimestep: 60,
  maxFrameTime: 250,
  enableMetrics: false,
};

export class GameLoop {
  private config: GameLoopConfig;
  private callbacks: GameLoopCallbacks;

  private animationId: number | null = null;
  private isRunning = false;
  private isPaused = false;

  // Timing
  private lastFrameTime = 0;
  private accumulator = 0;
  private fixedDeltaTime: number;

  // Metrics
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    updateTime: 0,
    renderTime: 0,
    fixedUpdateCount: 0,
  };
  private frameCount = 0;
  private lastMetricsTime = 0;
  private fpsAccumulator = 0;

  constructor(callbacks: GameLoopCallbacks, config: Partial<GameLoopConfig> = {}) {
    this.callbacks = callbacks;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.fixedDeltaTime = 1000 / this.config.fixedTimestep;
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.lastMetricsTime = this.lastFrameTime;
    this.frameCount = 0;

    this.tick();
  }

  /**
   * Stop the game loop completely
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Pause the game loop (continues rendering but no updates)
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume from pause
   */
  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
  }

  /**
   * Check if the loop is running
   */
  get running(): boolean {
    return this.isRunning;
  }

  /**
   * Check if the loop is paused
   */
  get paused(): boolean {
    return this.isPaused;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): Readonly<PerformanceMetrics> {
    return this.metrics;
  }

  /**
   * Main loop tick
   */
  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    let frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    // Prevent spiral of death
    if (frameTime > this.config.maxFrameTime) {
      frameTime = this.config.maxFrameTime;
    }

    // Track metrics
    if (this.config.enableMetrics) {
      this.fpsAccumulator += frameTime;
      this.frameCount++;

      if (now - this.lastMetricsTime >= 1000) {
        this.metrics.fps = Math.round((this.frameCount * 1000) / this.fpsAccumulator);
        this.frameCount = 0;
        this.fpsAccumulator = 0;
        this.lastMetricsTime = now;
      }
      this.metrics.frameTime = frameTime;
    }

    if (!this.isPaused) {
      this.accumulator += frameTime;

      // Fixed timestep updates
      let fixedUpdateCount = 0;
      const updateStart = performance.now();

      while (this.accumulator >= this.fixedDeltaTime) {
        this.callbacks.fixedUpdate(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
        fixedUpdateCount++;

        // Safety: prevent infinite loop if fixedUpdate takes too long
        if (fixedUpdateCount > 10) {
          this.accumulator = 0;
          break;
        }
      }

      // Interpolation alpha for smooth rendering
      const alpha = this.accumulator / this.fixedDeltaTime;

      // Variable update for non-physics stuff
      this.callbacks.update(frameTime, alpha);

      if (this.config.enableMetrics) {
        this.metrics.updateTime = performance.now() - updateStart;
        this.metrics.fixedUpdateCount = fixedUpdateCount;
      }
    }

    // Render
    const renderStart = performance.now();
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.callbacks.render(alpha);

    if (this.config.enableMetrics) {
      this.metrics.renderTime = performance.now() - renderStart;
    }

    this.animationId = requestAnimationFrame(this.tick);
  };
}

/**
 * Create a simple game loop without fixed timestep
 * (for simpler games that don't need deterministic physics)
 */
export function createSimpleLoop(onUpdate: (dt: number) => void, onRender: () => void): GameLoop {
  return new GameLoop({
    fixedUpdate: () => {},
    update: (dt) => onUpdate(dt),
    render: () => onRender(),
  });
}
