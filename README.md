---
title: Farm Follies
updated: 2026-04-09
status: current
domain: product
---

# Farm Follies

> "Monday morning. Tornado warning. Total chaos."

A physics-based stacking arcade game. A tornado drops barnyard animals and you, the panicked farmer, must catch and stack them without letting the tower topple.

**Platforms:** Web, Android, iOS, Desktop (Electron)

## How to Play

Drag the farmer left and right to catch falling animals. Stack them on your head and bank them before the tower collapses.

| Control | Action |
|---------|--------|
| Drag | Move farmer left/right |
| Tap stacked animal | Activate its special ability |
| Bank button | Save stack (requires 5+ animals) |

## Features

### Core Loop

Catch Animals -> Stack Grows -> Wobble Increases -> Bank or Risk -> Repeat

### Physics

The stack follows realistic wobble mechanics. Smooth, deliberate movement is rewarded; jerky movement causes instability. Stack height and animal weight affect tipping risk.

### Animals

Nine barnyard animals, each with a normal and special variant:

| Animal | Special Variant | Ability |
|--------|-----------------|---------|
| Chicken | Golden Cluck | Drops explosive golden eggs |
| Duck | Sir Quacksalot | Floats down slowly on feathers |
| Pig | Mudslide | Creates mud that slows nearby animals |
| Sheep | Shadow Wool | Wraps stack in protective wool shield |
| Goat | Gruff | Bleats to stun falling animals |
| Cow | Muddy Bessie | Shoots poop that grows bouncy bushes |
| Goose | Mother Goose | Creates sticky golden landing zone |
| Rooster | Dawn Caller | Crow attracts animals toward center |
| Horse | Haymaker | Summons floating hay platforms |

### Power-Ups

| Power-Up | Effect |
|----------|--------|
| Hay Bale | Restore one life |
| Golden Egg | Double points for 8 seconds |
| Water Trough | Magnetic pull for 5 seconds |
| Salt Lick | Full hearts + 3s invincibility |
| Corn Feed | Merge stack into one mega animal |
| Lucky Horseshoe | Increase max hearts by 1 |

### AI Director

A YUKA-powered AI director adapts to player skill in real time — backing off when players struggle (mercy mode), increasing pressure when they excel (challenge mode). It controls spawn timing, animal placement, and power-up selection.

### Scoring

| Action | Points |
|--------|--------|
| Basic catch | 10 x stack multiplier |
| Good catch | 13 x stack multiplier |
| Perfect catch | 25 x stack multiplier |
| Combo bonus | +15% per consecutive catch |
| Banking | 5 pts per banked animal |

### Game Modes

| Mode | Description | Unlock |
|------|-------------|--------|
| Endless | Classic survival, lives system | Default |
| Time Attack | Max score in 90 seconds | 1000+ score |
| Zen | No lives, practice stacking | After 10 games |
| Boss Rush | Face powerful boss animals | 5000+ score |

## Development

### Prerequisites

- Node.js 22+
- pnpm 9+

### Getting Started

```bash
pnpm install
pnpm dev        # Opens at localhost:5173
```

### Common Commands

```bash
pnpm test:run       # Unit tests (441 tests, single run)
pnpm test           # Unit tests (watch mode)
pnpm test:e2e       # Playwright E2E tests
pnpm lint           # Biome lint check
pnpm lint:fix       # Auto-fix lint issues
pnpm tsc --noEmit   # TypeScript type check
pnpm build:prod     # Production build
```

### Native Development

```bash
pnpm native:sync      # Build + sync to all native platforms
pnpm native:android   # Sync + open Android Studio
pnpm native:ios       # Sync + open Xcode
pnpm native:electron  # Sync + run Electron
pnpm cap:run:android  # Run on Android device/emulator
pnpm cap:run:ios      # Run on iOS device/simulator
```

### Audio Asset Generation

Audio is procedurally synthesized via Tone.js during development. Production uses pre-rendered OGG files:

```bash
# Capture from browser dev console
window.captureAudio.captureAllAudio()

# Convert WAV to OGG
ffmpeg -i input.wav -c:a libvorbis -q:a 6 output.ogg
# Place in public/assets/audio/sfx/ or public/assets/audio/music/
```

## Project Structure

```
src/
├── game/
│   ├── config.ts           # Game constants, canonical AnimalType
│   ├── engine/             # Modular game engine (Game.ts orchestrator)
│   │   ├── core/           # GameLoop, ResponsiveScale
│   │   ├── input/          # InputManager (touch + mouse)
│   │   ├── entities/       # Entity, Animal, Player
│   │   ├── managers/       # EntityManager, GameStateManager
│   │   ├── systems/        # AbilitySystem, CollisionSystem, WobblePhysics,
│   │   │                   # ScoreSystem, SpawnSystem, BushSystem
│   │   └── rendering/      # RenderContext, Renderer
│   ├── renderer/           # Canvas drawing functions (per entity type)
│   ├── ai/                 # GameDirector (YUKA-powered)
│   ├── hooks/              # React integration (useGameEngine, useHighScore)
│   ├── screens/            # React screens (MainMenu, GameScreen, GameOver)
│   ├── components/         # HUD, buttons, modals
│   ├── progression/        # Upgrades and coin system
│   └── modes/              # Game mode definitions
├── platform/               # Cross-platform abstraction (storage, haptics, audio)
└── components/             # Shared UI components

android/                    # Android native project (Capacitor)
ios/                        # iOS native project (Capacitor)
electron/                   # Desktop project (Electron)
e2e/                        # Playwright E2E tests
public/assets/              # Audio (OGG), images, video
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19 + TypeScript 5.9 |
| Rendering | HTML Canvas 2D (procedural, no sprites) |
| Build | Vite 6.4 |
| Native | Capacitor 8 |
| Audio | Tone.js (dev synthesis) + pre-rendered OGG (prod) |
| AI | YUKA (GameDirector) |
| Animations | anime.js |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Unit tests | Vitest 4 + happy-dom |
| E2E tests | Playwright |
| Package manager | pnpm |

## Contributing

1. Work on a branch, open a PR.
2. CI runs lint, type check, and unit tests on every PR.
3. All tests must pass before merging.
4. Max 300 lines per file (any language).
5. No stubs, no TODOs, no direct `localStorage` calls in game code.
6. All persistence goes through `src/platform/storage.ts`.
