---
title: Agent Operating Protocols
updated: 2026-04-09
status: current
domain: technical
---

# Farm Follies — AGENTS.md

Extended operating protocols, architecture patterns, and memory bank system for AI agents working on this codebase.

## Memory Bank Protocol

The memory bank at `memory-bank/` is the agent's persistent state. Read ALL files before any work.

```
memory-bank/
├── projectbrief.md      # Foundation — core requirements and goals
├── productContext.md    # Why this exists, problems it solves
├── techContext.md       # Technologies, setup, constraints
├── systemPatterns.md    # Architecture, patterns, decisions
├── activeContext.md     # Current focus, recent changes, next steps
├── progress.md          # What works, what's left, status
└── features/
    └── animals.md       # Animal system details
```

### Session Start

1. Read ALL memory bank files.
2. Run `git status && git log --oneline -5`.
3. Run `gh pr list` to check open PRs.
4. Check `memory-bank/activeContext.md` for current blockers and next steps.
5. Begin work.

### Ending a Session / Update Memory Bank

When user requests "update memory bank":

1. Review ALL memory bank files.
2. Document current state accurately in `activeContext.md`.
3. Update `progress.md` with completed work and test counts.
4. Clarify next steps.
5. Document new patterns in `systemPatterns.md`.

## Architecture Patterns

### Systems Are Pure Functions

All game logic systems take state in and return state out. No side effects.

```typescript
function updateStackWobble(state, animals, velocity, dt): StackWobbleState
function calculateCatchPoints(animal, position, scoreState): ScoreEvent
function activateAbility(state, animal, player, entities): AbilitySystemState
```

This makes systems testable in isolation (441 tests across 15 files).

### Managers Encapsulate Stateful Logic

```typescript
class GameStateManager {
  private state: GameSessionState;
  addScore(points, options): number;
  loseLife(): boolean;
  updatePlayTime(dt): void;
}
```

### Entities Are Data Containers

Composition over inheritance. Entity types are discriminated unions.

```typescript
interface AnimalEntity extends Entity {
  type: 'animal';
  animal: AnimalComponents; // type, variant, weight, ability state
}
```

### Ref-Based Callback Pattern (React)

`useGameEngine` stores callbacks in refs to prevent game instance recreation on re-render:

```typescript
const optionsRef = useRef(options);
optionsRef.current = options; // Updated every render, game created once
```

### Platform Storage Abstraction

Never use `localStorage` directly. Always use the platform layer:

```typescript
import { storage, STORAGE_KEYS } from "@/platform";
const data = await storage.get<T>(STORAGE_KEYS.KEY);
await storage.set(STORAGE_KEYS.KEY, data);
```

### Canonical Types in config.ts

`AnimalType` is defined once in `src/game/config.ts` and re-exported. Do not define it elsewhere.

## Key Flows

### Spawn Flow

```
GameDirector -> decides (type, behavior, velocity, position)
Game.ts -> creates AnimalEntity using director decisions
Tornado -> visual spawn effect
EntityManager -> tracks entity
```

### Catch Flow

```
InputManager -> drag position
Player position updated
CollisionSystem -> check catch
ScoreSystem -> calculate points (x2 if doublePointsActive)
WobblePhysics -> apply landing impact
GameStateManager -> update score and state
```

### Ability Flow

```
Player taps stacked animal
findTappedAbilityAnimal() -> identifies which animal
resolveAbilityType() -> determines ability from AnimalSpawnTemplate
activateAbility() -> creates active effect in AbilitySystemState
updateAbilityEffects() each frame -> applies effects, accumulates bonusScore
Effect expires -> removed from state, cooldown starts
```

### Render Flow

```
GameLoop.render()
Renderer.render()
  drawBackground()
  drawBankZone()
  drawFloorZone()
  drawTornado()
  drawPlayer()
  drawAnimals()
  drawEffects()
```

## Technical Constraints

- 60fps on mobile is a hard requirement; canvas rendering, no WebGL.
- Touch targets must be adequately sized; catch tolerance scales with screen size.
- `strictNullChecks: false` — enabling requires widespread refactoring (known debt).
- Game code must not import Capacitor directly; use `@/platform`.
- No dead code. No stubs. No TODOs in `src/`.

## Known Technical Debt

| Item | Impact | Resolution |
|------|--------|------------|
| `strictNullChecks: false` | Null safety gaps | Enabling requires widespread refactoring |
| No Capacitor `appStateChange` | Runs in background on native | Wire `appLifecycle.ts` |
| Freeze/invincibility overlays missing | Visual feedback gap | Add to `RenderContext.ts` effects |
| Bush growth indicator missing | Visual feedback gap | Add to `bush.ts` renderer |
