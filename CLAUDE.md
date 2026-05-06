---
title: Claude Agent Entry Point
updated: 2026-04-09
status: current
domain: technical
---

# Farm Follies — CLAUDE.md

Physics-based stacking arcade game. Catch barnyard animals flung from a tornado, stack them on a farmer, bank before the tower topples. Cross-platform: Web, Android, iOS, Desktop (Electron).

## Session Startup

Read `memory-bank/` at the start of every session. All files are required — see `AGENTS.md` for the full protocol.

## Commands

```bash
# Development
pnpm dev                    # Vite dev server (localhost:5173)
pnpm build:prod             # Production build

# Type checking
pnpm tscgo --noEmit         # Fast check via tsgo
pnpm tsc --noEmit           # Standard TypeScript check

# Linting & Formatting (Biome)
pnpm lint                   # Check all files
pnpm lint:fix               # Auto-fix
pnpm format                 # Format all files
pnpm check                  # Lint + type check combined

# Unit Testing (Vitest)
pnpm test                   # Watch mode
pnpm test:run               # Single run (441 tests, 15 files)
pnpm test:ui                # Vitest browser UI
pnpm test:coverage          # Coverage report
npx vitest run src/game/engine/__tests__/Game.test.ts   # Single file

# E2E Testing (Playwright)
pnpm test:e2e               # All browsers
pnpm test:e2e:ui            # Playwright interactive UI

# Native (Capacitor)
pnpm native:sync            # Build + sync to all platforms
pnpm native:android         # Sync + open Android Studio
pnpm native:ios             # Sync + open Xcode
pnpm native:electron        # Sync + run Electron
pnpm cap:run:android        # Run on Android device/emulator
pnpm cap:run:ios            # Run on iOS device/simulator
```

## Engine Architecture

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
  BushSystem.ts                      Animal.ts (9 types + variants)
                                     Player.ts (farmer)
Core
  GameLoop.ts (rAF, fixed timestep)
  ResponsiveScale.ts (iPhone SE = 1.0 reference)

Rendering
  RenderContext.ts (canvas wrapper with effects)
  Renderer.ts (orchestrates draw calls)
    |  uses
    v
  renderer/ (src/game/renderer/)
    animals.ts  background.ts  tornado.ts  bush.ts  farmer.ts

AI (YUKA goal-driven, src/game/ai/)
  GameDirector.ts (spawn orchestration, difficulty, player modeling)

Input
  InputManager.ts (unified mouse/touch, frame-rate-independent drag)
```

## Conventions

- **Biome**: 2-space indent, double quotes, semicolons, trailing commas (ES5), 100-char line width.
- **Path alias**: `@/` maps to `src/`.
- **File naming**: Components use `PascalCase.tsx`, utilities and hooks use `camelCase.ts`.
- **Systems are pure functions**: Input state in, output state out, no side effects.
- **Managers are stateful classes**: Private state, public methods.
- **Entities are data containers**: Composition over inheritance.
- **TypeScript**: `noImplicitAny: true`, `strictNullChecks: false`.
- **Unit tests** in `src/**/__tests__/*.test.{ts,tsx}`, E2E in `e2e/**/*.spec.ts`.

## Platform Layer

Never import Capacitor directly in game code. Always use:

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

All persistence uses the async storage API — no direct `localStorage` calls anywhere in game code.

## Key Reference Files

| File | Purpose |
|------|---------|
| `src/game/config.ts` | All game constants, colors, physics values, canonical `AnimalType` |
| `src/game/engine/Game.ts` | Modular game orchestrator (~1,218 lines) |
| `src/game/engine/systems/AbilitySystem.ts` | 9 animal special abilities |
| `src/game/engine/systems/SpawnSystem.ts` | Animal spawn templates (`AnimalSpawnTemplate`) |
| `src/game/engine/entities/Animal.ts` | Animal entity with 9 types and variants |
| `src/game/ecs/archetypes.ts` | Animal archetype definitions (rendering colors) |
| `src/game/ai/GameDirector.ts` | YUKA AI: spawn orchestration, difficulty, player modeling |
| `src/game/hooks/useGameEngine.ts` | React-to-engine bridge |
| `src/game/screens/GameScreen.tsx` | Main game screen (canvas + UI) |
| `src/platform/index.ts` | Platform abstraction entry point |
| `AGENTS.md` | AI agent protocol and memory bank system |
| `memory-bank/` | Session context (read at start of every session) |
