---
title: Architecture
updated: 2026-04-09
status: current
domain: technical
---

# Farm Follies — Architecture

## System Overview

```
+--------------------------------------------------+
|                   React App                       |
|   SplashScreen -> MainMenu -> GameScreen          |
+--------------------------------------------------+
|  GameScreen.tsx                                   |
|    Canvas element + useGameEngine hook            |
+--------------------------------------------------+
|  Game.ts (~1,218 lines, modular orchestrator)     |
|    Composes all engine subsystems                 |
+--------------------------------------------------+
|  Systems (pure functions) | Managers (stateful)   |
|    AbilitySystem          |   EntityManager       |
|    CollisionSystem        |   GameStateManager    |
|    WobblePhysics          |                       |
|    ScoreSystem            | Entities (data)       |
|    SpawnSystem            |   Entity (base)       |
|    BushSystem             |   Animal (+ variants) |
|                           |   Player (farmer)     |
+--------------------------------------------------+
|  Core                                             |
|    GameLoop (rAF + fixed timestep)                |
|    ResponsiveScale (scaling utilities)            |
+--------------------------------------------------+
|  Rendering                                        |
|    RenderContext (canvas wrapper + effects)       |
|    Renderer (orchestrates draw calls)             |
|    renderer/ (per-entity drawing functions)       |
+--------------------------------------------------+
|  AI                                               |
|    GameDirector (YUKA goal-driven AI)             |
+--------------------------------------------------+
|  Input                                            |
|    InputManager (unified mouse/touch)             |
+--------------------------------------------------+
|  Platform Layer                                   |
|    storage, feedback, haptics, audio, lifecycle   |
+--------------------------------------------------+
```

## Directory Map

```
src/
├── game/
│   ├── config.ts                  # Game constants, canonical AnimalType, physics values
│   ├── audio.ts                   # Tone.js audio system
│   ├── achievements.ts            # Achievement tracking (async, platform storage)
│   │
│   ├── engine/
│   │   ├── Game.ts                # Orchestrator (~1,218 lines)
│   │   ├── index.ts               # Barrel exports
│   │   ├── core/
│   │   │   ├── GameLoop.ts        # rAF with fixed timestep
│   │   │   └── ResponsiveScale.ts # Screen scaling utilities
│   │   ├── input/
│   │   │   └── InputManager.ts    # Unified mouse/touch, frame-rate-independent drag
│   │   ├── entities/
│   │   │   ├── Entity.ts          # Base entity with transform + velocity
│   │   │   ├── Animal.ts          # Animal entity with variants and abilities
│   │   │   └── Player.ts          # Player (farmer) entity
│   │   ├── managers/
│   │   │   ├── EntityManager.ts   # Entity storage and querying
│   │   │   └── GameStateManager.ts # Score, lives, progression
│   │   ├── systems/
│   │   │   ├── AbilitySystem.ts   # 9 animal special abilities (pure functions)
│   │   │   ├── CollisionSystem.ts # Catch detection, AABB/circle checks
│   │   │   ├── WobblePhysics.ts   # Stack wobble simulation
│   │   │   ├── ScoreSystem.ts     # Points, combos, multipliers
│   │   │   ├── SpawnSystem.ts     # Animal spawn templates (AnimalSpawnTemplate)
│   │   │   └── BushSystem.ts      # Bush growth and bounce mechanics
│   │   ├── rendering/
│   │   │   ├── RenderContext.ts   # Canvas wrapper with screen effects
│   │   │   └── Renderer.ts        # Main rendering orchestrator
│   │   └── state/
│   │       └── GameState.ts       # State type definitions
│   │
│   ├── renderer/                  # Canvas drawing functions
│   │   ├── animals.ts             # All 9 animal types (procedural)
│   │   ├── farmer.ts              # Player character
│   │   ├── tornado.ts             # Tornado with debris
│   │   ├── bush.ts                # Bush decorations
│   │   └── background.ts          # Farm background (hills, barn)
│   │
│   ├── ecs/
│   │   ├── types.ts               # ECS component and entity type definitions
│   │   └── archetypes.ts          # Animal archetype definitions (rendering colors)
│   │
│   ├── ai/
│   │   └── GameDirector.ts        # YUKA-powered spawn orchestration, difficulty
│   │
│   ├── hooks/
│   │   ├── useGameEngine.ts       # React-to-engine bridge
│   │   ├── useHighScore.ts        # High score persistence (async)
│   │   ├── useOrientation.ts      # Screen orientation detection
│   │   ├── useResponsiveScale.ts  # Reactive screen scaling
│   │   └── useUISound.ts          # UI sound effects
│   │
│   ├── screens/
│   │   ├── GameScreen.tsx         # Main game canvas + UI
│   │   ├── MainMenu.tsx           # Main menu
│   │   ├── GameOverScreen.tsx     # Game over results
│   │   └── SplashScreen.tsx       # Splash/loading screen
│   │
│   ├── components/                # HUD, buttons, modals, tutorial, pause menu
│   ├── progression/               # Upgrades, coin system (async, platform storage)
│   └── modes/                     # Game mode definitions
│
├── platform/
│   ├── index.ts                   # Barrel exports
│   ├── storage.ts                 # Capacitor Preferences / localStorage wrapper
│   ├── haptics.ts                 # Native haptic feedback
│   ├── audio.ts                   # Audio initialization and playback
│   ├── feedback.ts                # Unified audio + haptics API
│   ├── platform.ts                # Platform detection
│   └── appLifecycle.ts            # App state management
│
└── components/                    # Shared UI components (shadcn/Radix)
```

## Key Design Decisions

### Canvas Over DOM for Game Rendering

The game renders entirely on a `<canvas>` element. This gives direct pixel control, better performance for many simultaneously-animated entities, and makes procedural graphics straightforward. No sprite sheets are used — every entity is drawn via Canvas 2D API calls.

### Fixed Timestep Physics

`GameLoop.ts` uses a fixed physics timestep with variable rendering. This keeps physics deterministic and prevents instability at low frame rates, while allowing smooth visual interpolation at 60fps.

### Procedural Graphics

All entity graphics are procedurally drawn. This means no asset loading, smaller bundle size, easy parameterization for variants (color, size, expression), and visual consistency across screen sizes.

### Responsive Scaling

`ResponsiveScale.ts` calculates a scale factor relative to iPhone SE portrait (375x667 = 1.0). Scale range is 0.65–1.4. All entity sizes, hit detection radii, and UI elements scale accordingly. Catch tolerance is 1.2x more forgiving on smaller screens.

### YUKA AI Director

`GameDirector.ts` uses YUKA's goal-driven AI to model player state and make spawn decisions. It tracks catch rate, miss timing, perfect-catch timing, and play time to classify player skill and current state (engaged, frustrated, fatigued). This drives spawn type, spawn position (relative to player), animal behavior assignment, and mercy mode activation.

### Platform Abstraction

`src/platform/` provides a cross-platform API for storage, haptics, audio, and app lifecycle. All game code imports from `@/platform` — no direct `@capacitor/*` imports in game or component code. On web, the platform layer falls back to `localStorage` and Web Audio. On native, it uses Capacitor APIs.

### Single Canonical AnimalType

`AnimalType` is a union type defined once in `src/game/config.ts` and re-exported from `src/game/ecs/types.ts`. `AnimalSpawnTemplate` (game stats: speed, weight, points) and `AnimalArchetype` (rendering: colors, dimensions) are separate concepts to avoid naming conflicts.

## Data Flow

### Game Loop

```
requestAnimationFrame
  -> GameLoop.tick(timestamp)
  -> accumulate physics steps (fixed dt = 16.67ms)
  -> Game.update(dt) for each accumulated step
     -> InputManager.update()
     -> SpawnSystem.update()
     -> CollisionSystem.check()
     -> ScoreSystem.calculate()
     -> WobblePhysics.update()
     -> BushSystem.update()
     -> AbilitySystem.updateEffects()
     -> GameDirector.update(playerMetrics)
     -> GameStateManager.flush()
  -> Game.render(alpha)
     -> Renderer.render(interpolated state)
```

### Audio Dual-Mode

- **Dev**: Tone.js synthesizes audio in real time. No files needed.
- **Prod**: Pre-rendered OGG files in `public/assets/audio/`. Tone.js is fallback only.
- Music has 5 intensity levels (0%, 25%, 50%, 75%, 100%) that crossfade based on game state (wobble danger, combo length, stack height).

### Asset Layout

```
public/assets/
├── audio/
│   ├── music/     # Background music (5 OGG intensity levels)
│   ├── sfx/       # Sound effects (catch, bank, drop, land, perfect, topple)
│   ├── ui/        # UI sounds (click, back, toggle)
│   └── voice/     # Voice lines (male + female variants)
├── images/        # Menu backgrounds (portrait + landscape)
└── video/         # Splash videos (portrait + landscape)
```

## Wobble Physics

Stack wobble is simulated per frame:

```
Player velocity -> Movement wobble contribution
Animal landing -> Impact wobble contribution
Stack height -> Height multiplier (taller = more unstable)
Animal weight -> Weight factor per stack position
  -> Wobble angle per animal (propagated up stack with transfer ratio)
  -> Check thresholds:
     warning (0.60) -> yellow flash
     danger  (0.88) -> red flash + screen shake
     critical (0.58 base, -0.007 per unit height) -> topple
```

## Scoring

```
Base points (per AnimalSpawnTemplate)
  x Catch bonus (perfect 2.5x / good 1.3x / basic 1.0x)
  x Stack bonus (1.6x per stacked animal)
  x Combo multiplier (+15% per consecutive catch)
  x Double points multiplier (2.0x if golden egg active)
  = Final score awarded
```
