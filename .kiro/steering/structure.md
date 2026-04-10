# Farm Follies - Project Structure

```
src/
├── game/                    # Game logic (main codebase)
│   ├── config.ts            # Game constants, colors, animal types (canonical AnimalType)
│   ├── audio.ts             # Tone.js audio system
│   ├── achievements.ts      # Achievement tracking
│   │
│   ├── engine/              # Modular game engine
│   │   ├── Game.ts          # Main orchestrator (~1,200 lines)
│   │   ├── core/            # GameLoop, ResponsiveScale
│   │   ├── input/           # InputManager (touch/mouse)
│   │   ├── entities/        # Entity, Animal, Player, PowerUp
│   │   ├── managers/        # EntityManager, GameStateManager
│   │   ├── systems/         # Pure logic: AbilitySystem, CollisionSystem, WobblePhysics, ScoreSystem, SpawnSystem, BushSystem
│   │   ├── rendering/       # RenderContext, Renderer
│   │   └── state/           # GameState types
│   │
│   ├── renderer/            # Canvas drawing functions
│   │   └── animals.ts, tornado.ts, farmer.ts, bush.ts, background.ts
│   │
│   ├── ai/                  # AI systems
│   │   └── GameDirector.ts  # YUKA-powered spawn orchestration
│   │
│   ├── ecs/                 # ECS types and archetypes
│   ├── hooks/               # React hooks (useGameEngine, useHighScore, etc.)
│   ├── screens/             # React screens (GameScreen, MainMenu, GameOver, Splash)
│   ├── components/          # UI components (HUD, buttons, modals)
│   ├── modes/               # Game mode definitions
│   └── progression/         # Upgrades and coin system
│
├── platform/                # Cross-platform abstractions
│   ├── storage.ts           # Capacitor Preferences / localStorage
│   ├── haptics.ts           # Native haptic feedback
│   ├── audio.ts             # Audio playback
│   ├── feedback.ts          # Unified audio + haptics
│   └── app-lifecycle.ts     # Pause/resume handling
│
├── components/              # Shared UI components
├── hooks/                   # Shared React hooks
└── lib/                     # Utilities (cn, utils)

public/assets/               # Static assets
├── audio/music/             # Background music (OGG)
├── audio/sfx/               # Sound effects (OGG)
├── audio/voice/             # Voice lines (male/female)
├── images/                  # Menu backgrounds
└── video/                   # Splash videos

android/, ios/, electron/    # Native platform projects
e2e/                         # Playwright E2E tests
memory-bank/                 # AI agent context files
```

## Key Patterns
- **Systems are pure functions**: Input state → Output state (testable, deterministic)
- **Managers are stateful classes**: Encapsulate state with controlled access
- **Entities are data containers**: Composition over inheritance
- **Platform layer abstracts native APIs**: Always use `@/platform` for storage, haptics, audio
- **Canonical types in config.ts**: `AnimalType`, `PowerUpType` defined once, re-exported elsewhere
