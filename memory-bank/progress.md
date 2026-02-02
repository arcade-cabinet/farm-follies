# Progress: Farm Follies

## What Works (Production Ready)

### Core Gameplay (via modular Game.ts)
- [x] Drag-to-move player controls
- [x] Animals fall from top of screen
- [x] Catch detection and stacking
- [x] Wobble physics with collapse
- [x] Score and combo system
- [x] Lives and game over
- [x] Banking stacked animals
- [x] Level progression
- [x] Tornado spawning and movement
- [x] Animal special abilities (9 abilities, tap-to-activate)

### Rendering
- [x] Farm background with hills and barn
- [x] Procedural animal drawing (9 types)
- [x] Tornado with debris
- [x] Farmer player character
- [x] Bush rendering
- [x] UI overlays (score, lives, bank zone)

### Audio
- [x] Sound effects (catch, drop, bank, etc.)
- [x] Background music with intensity
- [x] Haptic feedback (mobile)

### UI
- [x] Main menu with farm theming
- [x] Game modes selection
- [x] Pause menu
- [x] Game over screen
- [x] Tutorial

### Engine Architecture
- [x] Modular engine (Game.ts orchestrator)
- [x] Pure-function systems (Collision, Wobble, Score, Spawn, Movement, Bush, Ability)
- [x] Stateful managers (EntityManager, GameStateManager)
- [x] Composition-based entities (Entity, Animal, Player)
- [x] Frame-rate independent game loop
- [x] Responsive scaling
- [x] Unified input handling (mouse/touch)
- [x] AbilitySystem with all 9 animal abilities
- [x] Wired into useGameEngine hook
- [x] Legacy code fully removed

## What's In Progress

### Power-Up System
- [x] Power-up types defined in config
- [x] Power-up collection detection in CollisionSystem
- [ ] Power-up spawning in Game.ts (logic exists in SpawnSystem, not yet wired)
- [ ] Power-up visual rendering in game loop

### Theme Cleanup
- [ ] Rename remaining "Psyduck" / "Duck" UI strings
- [ ] Ability UI indicators (visual feedback for ready/active states)

## Current Blockers

**None** -- All systems compile and tests pass.

## What's Left to Build

### High Priority
1. **Power-up spawning** -- wire SpawnSystem power-up logic into Game.ts
2. **Theme rename** -- remove remaining Psyduck/Duck references in UI
3. **Ability UI indicators** -- show ready/active state on stacked animals

### Medium Priority
4. **E2E tests** via Playwright (0 E2E tests currently)
5. **Animal-specific sounds** (moo, cluck, oink)
6. **Tutorial updates** for ability mechanics

### Low Priority
7. Achievement system updates
8. Boss mode animals
9. Seasonal variants
10. Performance optimizations

## Known Issues

### Technical Debt
- `src/game/engine/state/GameState.ts` still has legacy state types (used by SpawnSystem/AI) -- could be consolidated
- Some tests use `as any` casts for partial mocks
- `DuckBehavior.ts` in `src/game/ai/` retains "Duck" naming (functional, just naming)

### Gameplay Issues
- None critical -- game is playable

## Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| CollisionSystem | 23 | Pass |
| ScoreSystem | 34 | Pass |
| WobblePhysics | 22 | Pass |
| GameLoop | 8 | Pass |
| EntityManager | 21 | Pass |
| InputManager | 16 | Pass |
| SpawnSystem | * | Pass |
| MovementSystem | * | Pass |
| BushSystem | * | Pass |
| AbilitySystem | * | Pass |
| GameStateManager | * | Pass |
| App | * | Pass |
| SplashScreen | * | Pass |
| Example | 2 | Pass |

**Total: 328 tests passing across 14 test files**

## File Status

### Engine (All Active)
- `src/game/engine/Game.ts` (~929 lines)
- `src/game/engine/core/GameLoop.ts`
- `src/game/engine/core/ResponsiveScale.ts`
- `src/game/engine/input/InputManager.ts`
- `src/game/engine/entities/Entity.ts`
- `src/game/engine/entities/Animal.ts`
- `src/game/engine/entities/Player.ts`
- `src/game/engine/managers/EntityManager.ts`
- `src/game/engine/managers/GameStateManager.ts`
- `src/game/engine/rendering/RenderContext.ts`
- `src/game/engine/rendering/Renderer.ts`
- `src/game/engine/systems/AbilitySystem.ts`
- `src/game/engine/systems/CollisionSystem.ts`
- `src/game/engine/systems/WobblePhysics.ts`
- `src/game/engine/systems/ScoreSystem.ts`
- `src/game/engine/systems/SpawnSystem.ts`
- `src/game/engine/systems/MovementSystem.ts`
- `src/game/engine/systems/BushSystem.ts`
- `src/game/engine/state/GameState.ts`
- `src/game/engine/state/GameEvents.ts`
- `src/game/engine/index.ts`

### Deleted (No Longer Exist)
- ~~`src/game/engine/GameEngine.ts`~~ (legacy monolith)
- ~~`src/game/entities/Duck.ts`~~ (legacy duck entity)
- ~~`src/game/entities/BossDuck.ts`~~
- ~~`src/game/entities/Fireball.ts`~~
- ~~`src/game/entities/FrozenDuck.ts`~~
- ~~`src/game/entities/Particle.ts`~~
- ~~`src/game/entities/PowerUp.ts`~~
- ~~`src/game/renderer/psyduck.ts`~~
- ~~`src/game/state/`~~ (directory)
- ~~`src/game/physics/`~~ (directory)

### Documentation
- `AGENTS.md`
- `CLAUDE.md`
- `memory-bank/` (all files)

## Version History

### Current State
- Game is playable with modular Game.ts engine
- Legacy code fully deleted
- AbilitySystem integrated with all 9 abilities
- AnimalType unified (goose/rooster replaced turkey/donkey)
- 328 tests passing across 14 files
- Production build: 844 KB

### Major Milestones
1. Created modular engine architecture (20+ new files)
2. Wired Game.ts into useGameEngine hook, replacing legacy engine
3. Implemented AbilitySystem with 9 animal abilities
4. Unified AnimalType across codebase
5. Deleted all legacy code (GameEngine.ts, Duck entities, psyduck renderer)
6. Reached 328 passing tests

### Next Session Priority
1. Wire power-up spawning into Game.ts
2. Clean up remaining Psyduck/Duck theme references
3. Add ability UI indicators
