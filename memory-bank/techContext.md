# Technical Context: Farm Follies

## Technology Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **HTML Canvas** - Game rendering

### Testing
- **Vitest** - Unit testing (328 tests across 14 files)
- **Playwright** - E2E testing (configured, no tests written yet)

### Tooling
- **pnpm** - Package manager
- **Biome** - Linting and formatting

## Project Structure
```
src/
  game/
    config.ts              # Game constants, colors, animal types
    ecs/                   # ECS type definitions (rendering archetypes)
      types.ts             # Component/entity types, AnimalType union
      archetypes.ts        # Animal rendering factories (colors)
    engine/                # Modular game engine
      Game.ts              # Orchestrator (~929 lines)
      core/                # Game loop, responsive scaling
        GameLoop.ts
        ResponsiveScale.ts
      input/               # Input handling
        InputManager.ts
      entities/            # Entity definitions (composition-based)
        Entity.ts          # Base entity
        Animal.ts          # Animal entity with variants/abilities
        Player.ts          # Player (farmer) entity
      managers/            # Stateful managers
        EntityManager.ts   # Entity storage and querying
        GameStateManager.ts # Score, lives, progression
      systems/             # Pure game logic functions
        AbilitySystem.ts   # 9 animal special abilities
        CollisionSystem.ts # Catch/bounce/power-up detection
        WobblePhysics.ts   # Stack wobble simulation
        ScoreSystem.ts     # Points, combos, multipliers
        SpawnSystem.ts     # Animal spawn templates (AnimalSpawnTemplate)
        MovementSystem.ts  # Entity movement and gravity
        BushSystem.ts      # Bush growth and bounce
      rendering/           # Canvas rendering
        RenderContext.ts   # Canvas wrapper with effects
        Renderer.ts        # Rendering orchestrator
      state/               # Immutable state types
        GameState.ts       # State type definitions
        GameEvents.ts      # Event system types
      __tests__/           # Unit tests (11 test files)
    renderer/              # Drawing functions
      animals.ts           # Animal rendering (9 types)
      tornado.ts           # Tornado rendering
      farmer.ts            # Player rendering
      bush.ts              # Bush rendering
      background.ts        # Background rendering
    ai/                    # AI systems (YUKA goal-driven)
      GameDirector.ts      # Spawn orchestration, difficulty
      WobbleGovernor.ts    # Stack wobble control
      DuckBehavior.ts      # Steering behaviors
    hooks/                 # React hooks
      useGameEngine.ts     # React-to-engine bridge (imports Game.ts)
    screens/               # React screens
  components/              # React components
  platform/                # Platform abstractions (audio, haptics, storage)
```

## Key Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:5173)
pnpm build:prod       # Production build (844 KB)
pnpm test             # Run tests (watch mode)
pnpm test:run         # Run tests (single run, 328 passing)
pnpm tscgo --noEmit   # Fast type check
pnpm lint             # Biome lint check
pnpm check            # Lint + type check combined
```

## Development Setup
1. Clone repository
2. Run `pnpm install`
3. Run `pnpm dev`
4. Open browser to localhost:5173

## Technical Constraints
- Must run at 60fps on mobile
- Canvas rendering (no WebGL)
- Touch-friendly hit targets
- Responsive to screen size

## Dependencies
- `@/platform` - Audio feedback abstraction
- `anime.js` - Animation library (for bush growth)
- `yuka` - AI library (GameDirector, WobbleGovernor, DuckBehavior)
- `tone` - Audio synthesis (dev mode procedural sounds)

## Known Technical Debt
1. `src/game/engine/state/GameState.ts` retains legacy state types used by SpawnSystem and AI -- could be consolidated with entity types
2. `DuckBehavior.ts` retains "Duck" naming (functional, cosmetic issue)
3. Some tests use `as any` casts for partial mocks
4. Power-up spawning not yet wired into Game.ts
