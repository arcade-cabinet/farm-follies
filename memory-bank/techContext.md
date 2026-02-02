# Technical Context: Farm Follies

## Technology Stack

### Core
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety (`noImplicitAny: true`, `strictNullChecks: false`)
- **Vite 6.4** - Build tool
- **HTML Canvas** - Game rendering (procedural 2D, no sprites)

### Testing
- **Vitest 4.0** - Unit testing (441 tests across 15 files)
- **Playwright** - E2E testing (configured, minimal tests)
- **happy-dom** - DOM simulation for tests

### Tooling
- **pnpm** - Package manager
- **Biome** - Linting and formatting

## Project Structure
```
src/
  game/
    config.ts              # Game constants, colors, animal types (canonical AnimalType)
    audio.ts               # Tone.js audio system
    achievements.ts        # Achievement tracking (async, platform storage)
    ecs/                   # ECS type definitions (rendering archetypes)
      types.ts             # Component/entity types, re-exports AnimalType
      archetypes.ts        # Animal rendering factories (colors)
    engine/                # Modular game engine
      Game.ts              # Orchestrator (~1,218 lines)
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
        BushSystem.ts      # Bush growth and bounce
      rendering/           # Canvas rendering
        RenderContext.ts   # Canvas wrapper with effects
        Renderer.ts        # Rendering orchestrator
      state/               # State types
        GameState.ts       # State type definitions
      __tests__/           # Unit tests (11 test files)
    renderer/              # Drawing functions
      animals.ts           # Animal rendering (9 types)
      tornado.ts           # Tornado rendering
      farmer.ts            # Player rendering
      bush.ts              # Bush rendering
      background.ts        # Background rendering
    ai/                    # AI systems
      GameDirector.ts      # YUKA-powered spawn orchestration, difficulty, player modeling
    hooks/                 # React hooks
      useGameEngine.ts     # React-to-engine bridge
      useHighScore.ts      # High score persistence (async, platform storage)
      useOrientation.ts    # Screen orientation detection
      useResponsiveScale.ts
      useUISound.ts
    screens/               # React screens
      GameScreen.tsx       # Main game screen
      MainMenu.tsx         # Menu (async coin loading)
      GameOverScreen.tsx
      SplashScreen.tsx
    components/            # React components (HUD, buttons, modals)
    progression/           # Upgrades and coin system (async, platform storage)
      Upgrades.ts
    modes/                 # Game mode definitions
  platform/                # Platform abstractions
    index.ts               # Barrel exports (feedback, storage, haptics, platform)
    audio.ts               # Audio initialization and playback
    feedback.ts            # Unified audio + haptics
    haptics.ts             # Native haptic feedback
    storage.ts             # Capacitor Preferences / localStorage wrapper
    platform.ts            # Platform detection
    appLifecycle.ts        # App state management
  components/              # Shared UI components
```

## Key Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:5173)
pnpm build:prod       # Production build
pnpm test             # Run tests (watch mode)
pnpm test:run         # Run tests (single run, 441 passing)
pnpm tsc --noEmit     # TypeScript check (0 errors)
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
- `anime.js` - Animation library (UI animations)
- `yuka` - AI library (GameDirector)
- `tone` - Audio synthesis (dev mode procedural sounds)

## Known Technical Debt
1. `strictNullChecks: false` — enabling would require widespread refactoring
2. Some visual feedback gaps (freeze/invincibility overlays, bush growth indicator)
3. No Capacitor app lifecycle integration (pause on background)
