# Active Context: Farm Follies

## Current Focus
**Post-Refactor Cleanup and Feature Completion** - The modular engine is live and all legacy code has been deleted. Focus is on theme cleanup, power-up spawning, and polish.

## Recent Changes

### Legacy Code Deletion
All legacy files have been removed:
- `src/game/engine/GameEngine.ts` (1935-line monolith) -- DELETED
- `src/game/entities/Duck.ts`, `BossDuck.ts`, `Fireball.ts`, `FrozenDuck.ts`, `Particle.ts`, `PowerUp.ts` -- DELETED
- `src/game/renderer/psyduck.ts` -- DELETED
- `src/game/state/` directory -- DELETED (state types now live in `src/game/engine/state/`)
- `src/game/physics/` directory -- DELETED (wobble physics now in `src/game/engine/systems/WobblePhysics.ts`)

### Type Unification
- `AnimalType` unified across codebase: 9 types are `chicken`, `duck`, `pig`, `goat`, `sheep`, `cow`, `goose`, `horse`, `rooster`
- Previous `turkey` and `donkey` types replaced by `goose` and `rooster`
- `SpawnSystem.AnimalArchetype` renamed to `AnimalSpawnTemplate` to avoid conflict with ECS `AnimalArchetype`

### AbilitySystem Fully Integrated
- `AbilitySystem.ts` added to `src/game/engine/systems/`
- All 9 animal abilities implemented as pure functions
- Integrated into `Game.ts` game loop (activation, effect updates, cooldowns)

### Modular Engine Is Production
- `Game.ts` (~929 lines) is the active game loop, wired into `useGameEngine` hook
- No dual-engine exports -- only the modular engine exists now
- Production build: 844 KB
- 328 unit tests passing across 14 test files

## Current Architecture
```
src/game/engine/
  Game.ts                # Modular orchestrator (~929 lines)
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
    MovementSystem.ts    # Entity movement and gravity
    BushSystem.ts        # Bush growth and bounce mechanics
  rendering/
    RenderContext.ts     # Canvas wrapper with effects
    Renderer.ts          # Main rendering orchestrator
  state/
    GameState.ts         # Immutable state type definitions
    GameEvents.ts        # Event system types
```

## Current Blockers

**None** -- All systems are integrated and tests are passing.

## Next Steps

### Immediate
1. Power-up spawning -- power-ups are not yet spawned in `Game.ts` (spawn logic exists in `SpawnSystem` but not wired)
2. Theme rename -- remaining "Psyduck" / "Duck" references in UI strings and variable names
3. Ability UI indicators -- visual feedback when abilities are ready/active on stacked animals

### Short-Term
4. E2E tests via Playwright (currently 0 E2E tests)
5. Animal-specific sounds (moo, cluck, oink, etc.)
6. Tutorial updates for new ability mechanics

### Medium-Term
7. Boss mode animals
8. Achievement system updates
9. Seasonal variants
10. Performance optimizations

## Important Patterns Learned

### Type System Resolution
- ECS `AnimalArchetype` (from `ecs/archetypes.ts`) is used for rendering (has colors)
- `AnimalSpawnTemplate` (from `SpawnSystem.ts`) is used for game logic (has stats)
- `AnimalType` is unified: same 9-type union used everywhere

### Entity Architecture
- New Entity system uses composition: base `Entity` + typed components
- `Animal` has `AnimalComponents`, `Player` has `PlayerComponents`
- All legacy inheritance-based entities (Duck, BossDuck, etc.) are deleted

### AbilitySystem Pattern
- Pure-function system like all other systems
- State tracked in `AbilitySystemState` (active effects, cooldowns, zones)
- `Game.ts` calls `activateAbility()` on tap, `updateAbilityEffects()` each frame
- Passive abilities (feather_float) checked during movement updates

## Active Decisions

### Single Engine
- Legacy `GameEngine.ts` is deleted; only `Game.ts` exists
- `useGameEngine` hook imports directly from `Game.ts`
- No backward compatibility layer needed

### Renderer Uses ECS Archetypes
- `createAnimalArchetype()` for rendering (has colors from `FARM_COLORS`)
- `ANIMAL_ARCHETYPES` map (of `AnimalSpawnTemplate`) for game logic (has stats)
- Two complementary type systems, clearly separated by purpose
