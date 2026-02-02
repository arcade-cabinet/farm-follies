# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Startup

**Before any work, read the memory bank.** This project uses a Cline-style memory bank at `memory-bank/`. At the start of every session, read ALL files in `memory-bank/` to understand current project state, active work, and recent decisions. See `AGENTS.md` for the full memory bank protocol.

## Commands

```bash
# Development
pnpm dev                    # Vite dev server (localhost:5173)
pnpm build:prod             # Production build

# Type checking
pnpm tscgo --noEmit         # Fast check via tsgo
pnpm tsc --noEmit           # Standard TypeScript check (0 errors)

# Linting & Formatting (Biome)
pnpm lint                   # Check all files
pnpm lint:fix               # Auto-fix
pnpm format                 # Format all files
pnpm check                  # Lint + type check combined

# Unit Testing (Vitest)
pnpm test                   # Watch mode
pnpm test:run               # Single run (441 tests across 15 files)
pnpm test:ui                # Vitest browser UI
pnpm test:coverage          # Coverage report
# Single test file:
npx vitest run src/game/__tests__/specific.test.ts

# E2E Testing (Playwright)
pnpm test:e2e               # All browsers (Chromium, Firefox, WebKit)
pnpm test:e2e:ui            # Playwright interactive UI

# Native (Capacitor)
pnpm native:sync            # Build + sync to all platforms
pnpm native:android         # Sync + open Android Studio
pnpm native:ios             # Sync + open Xcode
pnpm native:electron        # Sync + run Electron
pnpm cap:run:android        # Run on Android device/emulator
pnpm cap:run:ios            # Run on iOS device/simulator
```

## Architecture

### Modular Engine

The game engine lives in `src/game/engine/` as a set of discrete, composable modules:

```
React UI (screens/, components/)
    |  useGameEngine hook
    v
Game.ts (modular orchestrator, ~1,218 lines)
    |  delegates to
    v
Systems (pure functions)           Managers (stateful)
  AbilitySystem.ts                   EntityManager.ts
  CollisionSystem.ts                 GameStateManager.ts
  WobblePhysics.ts
  ScoreSystem.ts                   Entities (data)
  SpawnSystem.ts                     Entity.ts (base)
  BushSystem.ts                      Animal.ts (with variants + abilities)
                                     Player.ts (farmer)
Core
  GameLoop.ts (rAF, fixed timestep)
  ResponsiveScale.ts (iPhone SE = 1.0 reference)

Rendering
  RenderContext.ts (canvas wrapper with effects)
  Renderer.ts (orchestrates draw calls)
    |  uses
    v
Renderers (src/game/renderer/)
  animals.ts      background.ts
  tornado.ts      bush.ts
  farmer.ts

AI (YUKA goal-driven, src/game/ai/)
  GameDirector.ts (spawn orchestration, difficulty, player modeling)

Input
  InputManager.ts (unified mouse/touch with frame-rate-independent drag)
```

### Rendering

All graphics are **procedurally drawn on Canvas 2D** -- there are no sprite sheets. Each entity type has a dedicated renderer module in `src/game/renderer/`.

### State Management

- Game state lives entirely in the engine (not React state).
- React receives updates via `useGameEngine` hook callbacks.
- Persistence through `src/platform/storage.ts` (async API: Capacitor Preferences on native, localStorage on web).
- No external state library (no Redux, Zustand, etc.).
- **All game code uses platform storage abstraction** -- no direct localStorage access.

### Audio Dual-Mode

- **Dev:** Tone.js procedural synthesis (real-time generation).
- **Prod:** Pre-rendered OGG files in `public/assets/audio/` with Tone.js fallback.
- Music crossfades between intensity levels (0%, 25%, 50%, 75%, 100%).

### Asset Structure

```
public/assets/
  audio/
    music/     # Background music (WAV source + 5 OGG intensity levels)
    sfx/       # Sound effects (bank, drop, land, perfect, topple, etc.)
    ui/        # UI sounds (click, back, toggle)
    voice/     # Voice lines (male + female variants)
  images/      # Menu backgrounds (portrait + landscape)
  video/       # Splash videos (portrait + landscape)
```

## Conventions

- **Biome** for linting and formatting: 2-space indent, double quotes, semicolons, trailing commas (ES5), 100-char line width.
- **Path alias:** `@/` maps to `src/` (configured in tsconfig.json, vite.config.ts, vitest.config.ts).
- **File naming:** Components use `PascalCase.tsx`, utilities and hooks use `camelCase.ts`.
- **const over let** (enforced by Biome `useConst: error`).
- **Unit tests** in `src/**/*.test.{ts,tsx}`, E2E tests in `e2e/**/*.spec.ts`.
- **Test environment:** `happy-dom` (configured in vitest.config.ts).
- **Systems are pure functions:** Input state in, output state out, no side effects.
- **Managers are stateful classes** with controlled access (private state, public methods).
- **Entities are data containers** with typed components (composition, not inheritance).
- **TypeScript:** `noImplicitAny: true`, `strictNullChecks: false`.

## Platform Layer

**Never import Capacitor directly in game code.** Always use the platform abstraction:

```typescript
import { feedback, haptics, storage, platform, platformAudio } from "@/platform";
```

| Module          | Purpose                                                    |
|-----------------|------------------------------------------------------------|
| `feedback`      | Unified audio + haptics for all game events                |
| `haptics`       | Haptic feedback (native only)                              |
| `storage`       | Capacitor Preferences on native, localStorage on web       |
| `platformAudio` | Audio initialization and playback                          |
| `platform`      | Detection: `isNative()`, `getPlatform()`, `isIOS()`, etc.  |
| `appLifecycle`  | Pause/resume/back button handling                          |

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/game/config.ts` | All game constants, colors, physics values, animal types (canonical `AnimalType`) |
| `src/game/engine/Game.ts` | Modular game orchestrator (~1,218 lines) |
| `src/game/engine/index.ts` | Engine barrel exports |
| `src/game/engine/systems/AbilitySystem.ts` | 9 animal special abilities |
| `src/game/engine/systems/SpawnSystem.ts` | Animal spawn templates (AnimalSpawnTemplate) |
| `src/game/engine/entities/Animal.ts` | Animal entity with 9 types and variants |
| `src/game/ecs/archetypes.ts` | Animal archetype definitions (rendering colors) |
| `src/game/ecs/types.ts` | ECS component and entity type definitions |
| `src/game/ai/GameDirector.ts` | YUKA AI: spawn orchestration, difficulty, player modeling |
| `src/game/hooks/useGameEngine.ts` | React-to-engine bridge |
| `src/game/screens/GameScreen.tsx` | Main game screen (canvas + UI) |
| `src/game/GAME_DOCS.md` | Game mechanics documentation |
| `src/platform/index.ts` | Platform abstraction entry point |
| `AGENTS.md` | AI agent protocol and memory bank system |
| `memory-bank/` | Session context (read at start of every session) |
