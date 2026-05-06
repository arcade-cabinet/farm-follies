---
title: Current State
updated: 2026-04-09
status: current
domain: context
---

# Farm Follies — Current State

## Status: Production-Ready Core

The game is fully playable across all target platforms. The modular engine is complete, all 441 unit tests pass, and the codebase has zero TypeScript errors, zero TODOs, and zero direct `localStorage` references.

## What Works

### Core Gameplay
- Drag-to-move player controls (frame-rate independent, with momentum)
- Animals fall from tornado at top of screen
- Catch detection and stacking
- Wobble physics with collapse (warning, danger, topple thresholds)
- Score and combo system
- Lives and game over
- Banking stacked animals (5+ required)
- Level progression
- Tornado spawning and movement
- Animal special abilities (9 abilities, tap-to-activate)
- Power-up spawning and collection
- Double points power-up affects scoring
- YUKA GameDirector with real player metrics, mercy mode, and difficulty scaling

### Rendering
- Farm background with hills and barn
- Procedural animal drawing (all 9 types with variant expression)
- Tornado with debris animation
- Farmer player character
- Bush rendering
- UI overlays (score, lives, bank zone, danger indicators)

### Audio
- Sound effects (catch, drop, bank, land, topple, perfect, etc.)
- Background music with 5 intensity levels (crossfade)
- Haptic feedback (mobile)
- Mute toggle persistent via platform storage

### Platforms
- Web / PWA: ready (`pnpm build:prod`)
- Android: ready (`pnpm native:android`)
- iOS: ready (`pnpm native:ios`)
- Desktop (Electron): ready (`pnpm native:electron`)
- GitHub Pages: auto-deployed on push to `main` via CD workflow

### UI
- Main menu with farm theming
- Game mode selection
- Pause menu
- Game over screen with score summary
- Tutorial
- Upgrade shop (with async platform storage persistence)

### Engine Architecture
- Modular engine: Game.ts orchestrator, pure-function systems, stateful managers, composition-based entities
- Frame-rate independent game loop (fixed timestep physics, variable render)
- Responsive scaling (iPhone SE reference, 0.65–1.4x range)
- Unified input handling (mouse + touch)
- All persistence via platform storage abstraction (0 direct localStorage calls)
- `noImplicitAny: true`, runtime type validation on loaded data
- Dead code purged (~6,800 lines removed in remediation)

### Tests
- 441 unit tests across 15 files — all passing
- Playwright E2E suite configured and operational
- CI: lint + type check + unit tests on every PR

## What Is Not Done

### Polish (Nice-to-Have)
- Visual feedback for freeze effect (overlay on frozen animals)
- Visual feedback for invincibility (glow on stack during salt lick)
- Bush growth indicator (progress animation during growth phase)
- Level transition announcements (full-screen level-up notification)
- Combo break visual/audio feedback
- Bank zone animation on successful banking

### Features
- App lifecycle pause/resume for Capacitor native (`appStateChange` integration in `appLifecycle.ts`)
- E2E test coverage expansion (most gameplay scenarios covered by unit tests only)
- Boss mode animals (mode defined, boss entities not implemented)
- Seasonal animal variants
- Leaderboard backend
- Daily challenges
- PWA offline support
- Social sharing (GIF replays)

## Known Technical Debt

| Item | Notes |
|------|-------|
| `strictNullChecks: false` | Enabling requires widespread refactoring — currently tracked as known debt |
| No Capacitor `appStateChange` integration | App does not pause when backgrounded on native |
| Freeze/invincibility overlays missing | Effect applies but has no visual indicator |
| Bush growth indicator missing | Bush grows but no progress feedback to player |

## Test Health

```
pnpm test:run -> 441 passed, 0 failed
pnpm tsc --noEmit -> 0 errors
pnpm lint -> 0 errors
```

## Active Decisions

### Single Engine Instance
Only `Game.ts` exists. `GameEngine.ts` (legacy monolith) was deleted. `useGameEngine` imports from `Game.ts` directly.

### Platform Storage Is Mandatory
All persistence uses `src/platform/storage.ts` (async). Zero direct `localStorage` calls in game or component code. This applies to: high score, achievements, upgrades, coin count, sound preferences.

### AnimalType Has One Definition
`AnimalType` lives in `src/game/config.ts`. `ecs/types.ts` re-exports it. No other file defines `AnimalType`.

### GameDirector Is the Only Active AI System
`WobbleGovernor.ts` and `AnimalBehavior.ts` were deleted as dead code (never instantiated). `GameDirector.ts` is the only active AI system.

## Next Steps (Recommended Priority Order)

1. Wire `appLifecycle.ts` Capacitor `appStateChange` — prevents background battery drain on native.
2. Add freeze/invincibility visual overlays — closes the most noticeable visual feedback gap.
3. Add bush growth indicator — completes the bush mechanic feedback loop.
4. Expand E2E coverage — particularly for banking, ability activation, and level progression.
5. Boss mode animal entities — the mode infrastructure exists, entities are not implemented.
