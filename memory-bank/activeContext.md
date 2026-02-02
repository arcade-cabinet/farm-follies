# Active Context: Farm Follies

## Current Focus
**Post-Remediation — Fully Clean Codebase.** A comprehensive 92-issue remediation plan has been completed across 9 phases. All dead code deleted, bugs fixed, legacy naming cleaned, types hardened, integrations wired, performance improved, storage migrated, and tests expanded.

## Recent Changes

### Comprehensive Remediation (9 Phases)

**Phase A — Dead Code Purge (~6,800 lines deleted):**
- `WobbleGovernor.ts`, `AnimalBehavior.ts` (dead AI systems)
- `GameEvents.ts` (unused event bus)
- `MovementSystem.ts` (Game.ts reimplements inline)
- 46 unused shadcn UI components
- `vite.config.d.ts`, `components.json`, stale type files
- Dead functions in SpawnSystem (kept `ANIMAL_ARCHETYPES` + `AnimalSpawnTemplate` exports)

**Phase B — 8 Logic Bug Fixes:**
- `getFeatherFloatMultiplier` hardcoded "duck" check → archetype lookup
- `updateAbilityEffects` always returned `bonusScore: 0` → accumulator
- `chooseBehaviorType` cumulative probabilities gap → normalized
- Bush expiration (Date.now() as both args) → proper creation time tracking
- `catchAnimal` velocity set to `undefined` → `{x: 0, y: 0}`
- GameDirector spawn outputs ignored → wired into spawn params
- `increaseMaxLives` silent heal → separate cap increase
- Fire/ice `AnimalTypeConfig` removed

**Phase C — Legacy Naming Cleanup (67 occurrences across 17 files)**

**Phase D — Dependency Cleanup:**
- Removed ~8 unused packages (framer-motion, styled-jsx, zod, etc.)
- Moved `@capacitor/cli` to devDependencies

**Phase E — Type Safety:**
- Enabled `noImplicitAny: true` in tsconfig
- Consolidated `AnimalType` to single canonical definition in config.ts
- Removed `as any` casts, added monotonic counter for effect IDs
- Consolidated duplicate `useOrientation` hook

**Phase F — Integration Wiring:**
- Double points power-up now affects scoring
- GameDirector receives real player metrics (not hardcoded placeholders)
- PlayTime tracked via `gameState.updatePlayTime(dt)`
- Player stress wired into update pipeline

**Phase G — Performance:**
- `useGameEngine` callbacks stored in refs (no game instance recreation)
- maxLives React state syncs with game state
- Module-level counters reset on game start
- setTimeout cleanup on unmount

**Phase H — Config & Storage:**
- Biome now lints `scripts/` and `electron/`
- `loadStats` has runtime type validation
- `initPlatform()` wired into app startup
- Orientation listener memory leak fixed

**Phase I — Test Coverage:**
- 72 Game.ts integration tests (lifecycle, spawning, collision, scoring, power-ups, banking, etc.)
- 60 GameDirector unit tests (difficulty, player modeling, mercy, spawn decisions, etc.)

**localStorage Migration:**
- `useHighScore.ts`, `achievements.ts`, `Upgrades.ts` migrated from localStorage to platform storage abstraction
- All callers updated for async API (GameScreen, MainMenu, UpgradeShop)
- 0 direct localStorage references remain

## Current Architecture
```
src/game/engine/
  Game.ts                # Modular orchestrator (~1,218 lines)
  core/
    GameLoop.ts          # Frame-rate independent game loop
    ResponsiveScale.ts   # Screen scaling utilities
  input/
    InputManager.ts      # Unified mouse/touch handling
  entities/
    Entity.ts            # Base entity with transform/velocity
    Animal.ts            # Animal entity with variants and abilities
    Player.ts            # Player (farmer) entity
  managers/
    EntityManager.ts     # Entity storage and querying
    GameStateManager.ts  # Score, lives, progression
  systems/
    AbilitySystem.ts     # 9 animal special abilities (pure functions)
    CollisionSystem.ts   # Catch detection, AABB/circle checks
    WobblePhysics.ts     # Stack wobble simulation
    ScoreSystem.ts       # Points, combos, multipliers
    SpawnSystem.ts       # Animal spawn templates and logic
    BushSystem.ts        # Bush growth and bounce mechanics
  rendering/
    RenderContext.ts     # Canvas wrapper with effects
    Renderer.ts          # Main rendering orchestrator
  state/
    GameState.ts         # State type definitions
```

## Current Blockers

**None** — All systems compiled, tested, and passing.

## Next Steps

### Potential Future Work
1. Visual feedback for power-up effects (freeze overlay, invincibility glow)
2. Level transition announcements
3. Combo break visual/audio feedback
4. App lifecycle pause/resume (Capacitor)
5. E2E test expansion
6. Boss mode animals
7. Seasonal variants

## Active Decisions

### Single Engine
- Only `Game.ts` exists (legacy `GameEngine.ts` deleted long ago)
- `useGameEngine` hook imports directly from `Game.ts`

### Platform Storage
- All persistence uses `src/platform/storage.ts` (async API)
- No direct localStorage access in game code

### Type Safety
- `noImplicitAny: true`, `strictNullChecks: false`
- `AnimalType` has single canonical definition in `config.ts` with re-exports
