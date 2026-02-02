# Active Context: Farm Follies

## Current Focus
**Modular Engine Refactor** - Breaking the monolithic GameEngine.ts into clean, testable modules.

## Recent Changes (This Session)

### Created New Modular Architecture
```
src/game/engine/
├── core/
│   ├── GameLoop.ts        # Frame-rate independent game loop
│   └── ResponsiveScale.ts # Screen scaling utilities
├── input/
│   └── InputManager.ts    # Unified mouse/touch handling
├── entities/
│   ├── Entity.ts          # Base entity with transform/velocity
│   ├── Animal.ts          # Animal entity with variants
│   └── Player.ts          # Player (farmer) entity
├── managers/
│   ├── EntityManager.ts   # Entity storage and querying
│   └── GameStateManager.ts # Score, lives, progression
├── rendering/
│   ├── RenderContext.ts   # Canvas wrapper with effects
│   └── Renderer.ts        # Main rendering orchestrator
├── systems/               # (Created in previous session)
│   ├── CollisionSystem.ts
│   ├── WobblePhysics.ts
│   ├── ScoreSystem.ts
│   ├── SpawnSystem.ts
│   ├── MovementSystem.ts
│   └── BushSystem.ts
└── Game.ts                # New modular game class
```

### Created Unit Tests
- GameLoop.test.ts - Game loop lifecycle tests
- EntityManager.test.ts - Entity management tests
- InputManager.test.ts - Input handling tests
- (Previous) CollisionSystem.test.ts, ScoreSystem.test.ts, WobblePhysics.test.ts

### Total: 81 tests passing

## Current Blockers

**None** - All TypeScript errors have been fixed:
- Fixed type exports in index.ts (use `export type` for type-only exports)
- Fixed Renderer.ts archetype creation (pass boolean not string)

## Next Steps

### Immediate (Next Session)
1. Wire up Game.ts to replace GameEngine.ts in useGameEngine hook
2. Test gameplay end-to-end with new engine
3. Remove legacy GameEngine.ts once verified

### Short-Term (Complete Refactor)
1. Wire up Game.ts to replace GameEngine.ts
2. Update useGameEngine hook to use new Game class
3. Test gameplay end-to-end
4. Remove legacy GameEngine.ts

### Medium-Term (Features)
1. Implement animal special abilities
2. Add bush bounce gameplay
3. Render farmer instead of duck as base
4. Add animal-specific sounds

## Important Patterns Learned

### Type System Conflicts
- ECS types (src/game/ecs/types.ts) define AnimalArchetype differently than SpawnSystem
- Need to use ECS archetypes for rendering, SpawnSystem for game logic
- Use `createAnimalArchetype()` from ecs/archetypes.ts for rendering

### Entity Architecture
- New Entity system uses composition: base Entity + typed components
- Animal has `AnimalComponents`, Player has `PlayerComponents`
- Different from legacy Duck class which uses inheritance

### Wobble Physics
- Stack wobble needs to work with AnimalEntity[], not legacy AnimalState[]
- Custom updateWobble() method added to Game.ts to bridge types
- Wobble state stored in Map<string, AnimalWobbleState> by entity ID

## Active Decisions

### Keep Legacy GameEngine.ts
- Don't delete yet - game still works with it
- Export both from index.ts for gradual migration
- Once Game.ts works, deprecate GameEngine.ts

### Renderer Uses ECS Archetypes
- createAnimalArchetype() for rendering (has colors)
- ANIMAL_ARCHETYPES from SpawnSystem for game logic (has stats)
- Two different type systems, need to keep separate

## Questions to Resolve
1. Should we unify the two AnimalArchetype types?
2. Should the new Game.ts use the legacy AI systems?
3. How to handle backward compatibility during transition?
