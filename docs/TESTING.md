---
title: Testing
updated: 2026-04-09
status: current
domain: quality
---

# Farm Follies — Testing

## Strategy

Testing is layered:

- **Unit tests** (Vitest + happy-dom): cover pure logic — systems, managers, entities, and hooks in isolation.
- **E2E tests** (Playwright): cover full browser sessions — game flow, input, rendering, and persistence.

Unit tests are the primary safety net for game logic. E2E tests catch integration failures that unit tests cannot see.

## Running Tests

```bash
# Unit tests
pnpm test           # Watch mode (development)
pnpm test:run       # Single run (CI gate)
pnpm test:ui        # Vitest browser UI
pnpm test:coverage  # Coverage report

# Single file
npx vitest run src/game/engine/__tests__/Game.test.ts

# E2E tests
pnpm test:e2e       # All browsers (Chromium, Firefox, WebKit)
pnpm test:e2e:ui    # Playwright interactive UI
```

## Unit Test Coverage

441 tests across 15 files. All must pass before merging.

| Module | Tests | Type |
|--------|-------|------|
| `Game.ts` (integration) | 72 | Integration |
| `GameStateManager` | 64 | Unit |
| `GameDirector` | 60 | Unit |
| `AbilitySystem` | 52 | Unit |
| `BushSystem` | 35 | Unit |
| `ScoreSystem` | 34 | Unit |
| `CollisionSystem` | 23 | Unit |
| `WobblePhysics` | 22 | Unit |
| `EntityManager` | 21 | Unit |
| `SpawnSystem` | 19 | Unit |
| `InputManager` | 16 | Unit |
| `SplashScreen` | 10 | Component |
| `GameLoop` | 8 | Unit |
| `App` | 3 | Component |
| `example` | 2 | Example |

## Test File Locations

```
src/
├── __tests__/
│   └── App.test.tsx
├── test/
│   └── example.test.tsx
└── game/
    ├── __tests__/
    │   └── e2e/
    │       └── generators.test.ts
    ├── ai/__tests__/
    │   └── GameDirector.test.ts
    ├── engine/__tests__/
    │   ├── AbilitySystem.test.ts
    │   ├── BushSystem.test.ts
    │   ├── CollisionSystem.test.ts
    │   ├── EntityManager.test.ts
    │   ├── Game.test.ts
    │   ├── GameLoop.test.ts
    │   ├── GameStateManager.test.ts
    │   ├── InputManager.test.ts
    │   ├── ScoreSystem.test.ts
    │   ├── SpawnSystem.test.ts
    │   └── WobblePhysics.test.ts
    └── screens/__tests__/
        └── SplashScreen.test.tsx

e2e/                          # Playwright E2E tests
├── engine-integration.spec.ts
├── example.spec.ts
├── game-flow.spec.ts
├── gameplay-governor.spec.ts
├── splash.spec.ts
└── [category dirs]/
    # abilities, audio, boundaries, collision, coverage, helpers,
    # input, lives, persistence, physics, progression, scoring,
    # stability, state, tornado, ui
```

## Configuration

### Vitest (vitest.config.ts)

- Environment: `happy-dom`
- Test pattern: `src/**/*.test.{ts,tsx}`
- Path alias: `@/` -> `src/`
- Coverage provider: v8

### Playwright (playwright.config.ts)

- Browsers: Chromium, Firefox, WebKit
- Test pattern: `e2e/**/*.spec.ts`
- Base URL: `http://localhost:5173`
- Traces: on first retry

## Writing Tests

### Unit Tests for Systems

Systems are pure functions — test them directly with factory-built state:

```typescript
import { updateStackWobble } from "@/game/engine/systems/WobblePhysics";

test("wobble increases with player velocity", () => {
  const initialState = makeWobbleState({ angle: 0 });
  const result = updateStackWobble(initialState, animals, velocity, dt);
  expect(result.angle).toBeGreaterThan(0);
});
```

### Unit Tests for Managers

Managers are stateful classes — instantiate them directly:

```typescript
import { GameStateManager } from "@/game/engine/managers/GameStateManager";

test("loseLife returns false when no lives remain", () => {
  const manager = new GameStateManager({ lives: 1 });
  manager.loseLife();
  expect(manager.loseLife()).toBe(false);
});
```

### Integration Tests (Game.ts)

`Game.test.ts` exercises the full engine lifecycle — init, update, catch, bank, topple — without a browser:

```typescript
import { Game } from "@/game/engine/Game";

test("catching animal increases stack height", () => {
  const game = new Game(makeCanvas(), makeOptions());
  game.init();
  simulateCatch(game, "chicken");
  expect(game.getState().stackHeight).toBe(1);
});
```

### E2E Tests (Playwright)

E2E tests use the `gameplay-governor.spec.ts` pattern — a headless browser drives the game and asserts on observable state via the DOM and canvas:

```typescript
test("game starts after clicking play", async ({ page }) => {
  await page.goto("/");
  await page.click('[data-testid="play-button"]');
  await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
});
```

## What to Test

When changing a system, add or update tests for:
- Happy path (normal operation)
- Edge cases (empty stack, max lives, level cap)
- Error conditions (invalid input, missing entity)

When changing a screen or component, update the component test for observable behavior (renders, state changes, user events).

When adding a new ability, add at minimum:
- Activation test (ability activates on tap)
- Effect test (effect applies to game state)
- Cooldown test (second tap within cooldown is rejected)
- Expiry test (effect is removed after duration)

## CI Gate

CI runs on every PR via `.github/workflows/ci.yml`:

1. `pnpm lint` — Biome check (must pass)
2. `pnpm tsc --noEmit` — TypeScript check (must pass)
3. `pnpm test:run` — All 441 unit tests (must pass)

E2E tests are not currently in CI (run locally before merging features that touch game flow).
