/**
 * PlayerGovernor - YUKA-powered automated player for E2E testing.
 *
 * Uses YUKA GameEntity + Think brain with goal evaluators to make
 * real-time decisions about where to move and when to bank.
 * Controls the game via synthetic PointerEvents on the canvas,
 * exercising the full input → physics → rendering pipeline.
 */

import { GameEntity, GoalEvaluator, Think } from "yuka";

// ── Types ──────────────────────────────────────────────────────────

export interface GovernorSnapshot {
  player: { x: number; y: number; width: number; height: number } | null;
  fallingAnimals: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    velocityY: number;
  }>;
  score: number;
  lives: number;
  level: number;
  combo: number;
  stackHeight: number;
  bankedAnimals: number;
  canBank: boolean;
  isPlaying: boolean;
  canvasWidth: number;
  canvasHeight: number;
  // Wobble state for E2E testing
  wobbleIntensity?: number;
  wobbleWarning?: boolean;
}

export interface GovernorStats {
  framesRun: number;
  catchAttempts: number;
  banksTriggered: number;
  idleFrames: number;
}

// ── Shared Helpers ────────────────────────────────────────────────

interface ScoredAnimal {
  animal: GovernorSnapshot["fallingAnimals"][number];
  score: number;
}

/**
 * Find the most urgent falling animal (closest to the floor line).
 * Shared by CatchEvaluator (desirability) and executeCatch (targeting).
 */
function findMostUrgentAnimal(snap: GovernorSnapshot): ScoredAnimal | null {
  if (!snap.player || snap.fallingAnimals.length === 0) return null;

  const floorY = snap.player.y + snap.player.height;
  if (floorY <= 0) return null; // Guard against division by zero

  let best: ScoredAnimal = { animal: snap.fallingAnimals[0], score: -1 };

  for (const animal of snap.fallingAnimals) {
    const urgency = animal.y / floorY; // 0 at top, ~1 at floor
    const inRange = animal.y > floorY * 0.5 ? 0.2 : 0;
    const score = urgency + inRange;

    if (score > best.score) {
      best = { animal, score };
    }
  }

  return best;
}

// ── Goal Evaluators ────────────────────────────────────────────────

/**
 * CatchGoal: move toward the most urgent falling animal.
 * Urgency = how close the animal is to the floor.
 */
class CatchEvaluator extends GoalEvaluator<GameEntity> {
  calculateDesirability(owner: GameEntity): number {
    const gov = owner as PlayerGovernor;
    const snap = gov.lastSnapshot;
    if (!snap) return 0;

    const result = findMostUrgentAnimal(snap);
    if (!result) return 0;

    // Scale from 0.1 (animal just spawned) to 1.0 (about to hit floor)
    return Math.max(0.1, Math.min(1.0, result.score));
  }

  setGoal(owner: GameEntity): void {
    (owner as PlayerGovernor).activeGoal = "catch";
  }
}

/**
 * BankGoal: bank the stack when it's tall enough.
 */
class BankEvaluator extends GoalEvaluator<GameEntity> {
  calculateDesirability(owner: GameEntity): number {
    const gov = owner as PlayerGovernor;
    const snap = gov.lastSnapshot;
    if (!snap || !snap.canBank) return 0;

    // Higher desirability with taller stacks (risk avoidance)
    const height = snap.stackHeight;
    if (height >= 6) return 1.0; // Definitely bank at 6+
    if (height >= 4) return 0.7;
    if (height >= 3) return 0.4;
    return 0.1;
  }

  setGoal(owner: GameEntity): void {
    (owner as PlayerGovernor).activeGoal = "bank";
  }
}

/**
 * IdleGoal: move to center when nothing is falling.
 */
class IdleEvaluator extends GoalEvaluator<GameEntity> {
  calculateDesirability(_owner: GameEntity): number {
    // Low baseline — only wins if nothing else scores higher
    return 0.05;
  }

  setGoal(owner: GameEntity): void {
    (owner as PlayerGovernor).activeGoal = "idle";
  }
}

// ── PlayerGovernor ─────────────────────────────────────────────────

export class PlayerGovernor extends GameEntity {
  brain: Think<GameEntity>;
  activeGoal: "catch" | "bank" | "idle" = "idle";
  lastSnapshot: GovernorSnapshot | null = null;
  stats: GovernorStats = { framesRun: 0, catchAttempts: 0, banksTriggered: 0, idleFrames: 0 };

  private canvas: HTMLCanvasElement;
  private _getSnapshot: () => GovernorSnapshot;
  private _bankStack: () => void;
  private rafId: number | null = null;
  private isDragging = false;
  private cachedRect: DOMRect | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    getSnapshot: () => GovernorSnapshot,
    bankStack: () => void
  ) {
    super();
    this.canvas = canvas;
    this._getSnapshot = getSnapshot;
    this._bankStack = bankStack;

    // Set up YUKA Think brain with goal evaluators
    this.brain = new Think(this);
    this.brain.addEvaluator(new CatchEvaluator());
    this.brain.addEvaluator(new BankEvaluator());
    this.brain.addEvaluator(new IdleEvaluator());
  }

  /**
   * Start the governor loop. Runs on its own rAF to avoid coupling
   * with the game loop's timing.
   */
  override start(): this {
    super.start();
    this.isDragging = false;
    this.stats = { framesRun: 0, catchAttempts: 0, banksTriggered: 0, idleFrames: 0 };
    this.tick();
    return this;
  }

  /**
   * Stop the governor loop.
   */
  stopGovernor(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.isDragging) {
      this.dispatchPointerUp();
    }
  }

  private tick = (): void => {
    this.lastSnapshot = this._getSnapshot();
    if (!this.lastSnapshot.isPlaying) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    this.stats.framesRun++;

    // Cache canvas rect once per frame (avoids repeated layout queries)
    this.cachedRect = this.canvas.getBoundingClientRect();

    // YUKA brain evaluates goals and selects the best one
    this.brain.execute();

    // Execute selected goal
    switch (this.activeGoal) {
      case "catch":
        this.executeCatch();
        break;
      case "bank":
        this.executeBank();
        break;
      case "idle":
        this.executeIdle();
        break;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  // ── Goal Execution ─────────────────────────────────────────────

  private executeCatch(): void {
    const snap = this.lastSnapshot;
    if (!snap) return;

    const result = findMostUrgentAnimal(snap);
    if (!result) return;

    // Move toward the target animal's X center
    this.moveToX(result.animal.x);
    this.stats.catchAttempts++;
  }

  private executeBank(): void {
    if (this.lastSnapshot?.canBank) {
      this._bankStack();
      this.stats.banksTriggered++;
    }
  }

  private executeIdle(): void {
    const snap = this.lastSnapshot;
    if (!snap) return;
    // Drift toward center
    this.moveToX(snap.canvasWidth / 2);
    this.stats.idleFrames++;
  }

  // ── Input Simulation ───────────────────────────────────────────

  private moveToX(targetX: number): void {
    if (!this.isDragging) {
      this.dispatchPointerDown(targetX);
    }
    this.dispatchPointerMove(targetX);
  }

  private getRect(): DOMRect {
    return this.cachedRect ?? this.canvas.getBoundingClientRect();
  }

  private dispatchPointerDown(x: number): void {
    const rect = this.getRect();
    const clientX = rect.left + x;
    const clientY = rect.top + rect.height * 0.8; // Near bottom where player is
    this.canvas.dispatchEvent(new MouseEvent("mousedown", { clientX, clientY, bubbles: true }));
    this.isDragging = true;
  }

  private dispatchPointerMove(x: number): void {
    const rect = this.getRect();
    const clientX = rect.left + x;
    const clientY = rect.top + rect.height * 0.8;
    this.canvas.dispatchEvent(new MouseEvent("mousemove", { clientX, clientY, bubbles: true }));
  }

  private dispatchPointerUp(): void {
    const rect = this.getRect();
    const clientX = rect.left + (this.lastSnapshot?.canvasWidth ?? 200) / 2;
    const clientY = rect.top + rect.height * 0.8;
    this.canvas.dispatchEvent(new MouseEvent("mouseup", { clientX, clientY, bubbles: true }));
    this.isDragging = false;
  }
}
