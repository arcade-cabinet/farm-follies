---
title: Changelog
updated: 2026-04-09
status: current
domain: technical
---

# Changelog

All notable changes to Farm Follies are documented here.

Format follows [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Planned
- Visual feedback for freeze/invincibility power-ups
- Level transition announcements
- Combo break visual/audio feedback
- App lifecycle pause/resume via Capacitor `appStateChange`
- Bank zone animation on banking
- E2E test suite expansion
- Boss mode animals
- Seasonal animal variants
- Leaderboard backend
- Daily challenges

---

## [1.0.0] — Post-Remediation

### Added
- 441 unit tests across 15 test files (Vitest + happy-dom)
- Playwright E2E test suite with browser governor tests
- Page Visibility API pause on tab switch
- Runtime type validation for all loaded persisted data
- `initPlatform()` wired into app startup
- YUKA-powered E2E governor tests

### Changed
- All persistence migrated to platform storage abstraction (`src/platform/storage.ts`) — zero direct `localStorage` references remain
- `useGameEngine` callbacks stored in refs (prevents game instance recreation on re-render)
- `maxLives` React state synced with game engine state
- Module-level counters reset on game start
- `setTimeout` cleanup on component unmount
- `noImplicitAny: true` enabled in tsconfig
- `AnimalType` consolidated to single canonical definition in `config.ts`
- Biome configured to lint `scripts/` and `electron/` directories

### Fixed
- `getFeatherFloatMultiplier` hardcoded "duck" check replaced with archetype lookup
- `updateAbilityEffects` always returned `bonusScore: 0` — now accumulates correctly
- `chooseBehaviorType` cumulative probability distribution gap — normalized
- Bush expiration used `Date.now()` for both creation and expiration — now tracks creation time separately
- `catchAnimal` set animal velocity to `undefined` — now resets to `{x: 0, y: 0}`
- GameDirector spawn outputs were ignored — wired into actual spawn parameters
- `increaseMaxLives` silently healed instead of only increasing cap
- Orientation listener memory leak fixed
- Double points power-up now correctly affects ScoreSystem
- GameDirector now receives real player metrics (catch rate, miss timing) instead of hardcoded placeholders
- PlayTime tracked via `gameState.updatePlayTime(dt)`
- Player stress wired into AI update pipeline

### Removed
- `WobbleGovernor.ts` (dead AI, never instantiated)
- `AnimalBehavior.ts` (dead AI, never called)
- `GameEvents.ts` (unused event bus)
- `MovementSystem.ts` (reimplemented inline in Game.ts)
- 46 unused shadcn UI components from `src/components/ui/`
- ~8 unused npm packages (framer-motion, styled-jsx, zod, and others)
- `vite.config.d.ts`, `components.json`, stale type declaration files
- All `as any` casts
- Legacy fire/ice `AnimalTypeConfig` entries
- 67 occurrences of legacy naming across 17 files
- ~6,800 lines of dead code total

---

## [0.14.0] — Modular Remediation

### Changed
- Monolithic `GameEngine.ts` replaced with modular architecture under `src/game/engine/`
- Engine split into: Game.ts orchestrator, systems (pure functions), managers (stateful), entities (data), rendering (canvas)

---

## [0.13.0] — Farm Follies Theme

### Changed
- Complete rebrand from Psyduck/Pokemon theme to barnyard farm
- 9 animal types: cow, chicken, pig, sheep, goat, duck, goose, horse, rooster
- New procedural renderers: animals.ts, farmer.ts, tornado.ts, bush.ts, background.ts
- Farm-themed power-ups: hay bale, golden egg, water trough, salt lick, corn feed

### Removed
- All Psyduck/Pokemon assets, entities, and renderers

---

## [0.12.0] — Dev Tooling

### Added
- Vitest for unit testing with happy-dom
- Playwright for E2E testing (Chromium, Firefox, WebKit)
- Biome upgraded to 2.3.x

### Removed
- Next.js shims (only used for next-themes)
- Simplified theme handling to native Tailwind dark mode

---

## [0.11.0] — Input and Responsive Overhaul

### Added
- Frame-rate independent drag smoothing (exponential interpolation)
- Momentum and inertia after drag release
- Soft bounce at screen edges
- Responsive scaling system: iPhone SE (375px) = 1.0x reference, range 0.65–1.4x
- Adaptive catch tolerance (1.2x on small screens)
- Safe area inset support for notched devices

---

## [0.10.0] — YUKA AI Integration

### Added
- `GameDirector.ts` using YUKA goal-driven AI
- Spawn orchestration: strategic animal positioning based on player position
- Difficulty scaling: logarithmic curves for level, time, and score
- Player modeling: tracks skill, fatigue, frustration, engagement
- Goals: `build_pressure`, `release_tension`, `challenge`, `mercy`, `reward`
- Animal behavior assignment: seeker, dive, zigzag, evader, floater
- Power-up intelligence: strategic timing and type selection

---

## [0.9.0] — Audio Enhancement

### Added
- Tone.js background music with lively farm theme
- Dynamic music intensity based on gameplay state (5 levels: 0%, 25%, 50%, 75%, 100%)
- Procedural sound effects for all game events

---

## [0.8.0] — Progression System

### Added
- Coin economy (earned from scores)
- 8 permanent upgrades with shop UI
- Mode selection screen
- Achievement system
- Boss animal entities

---

## [0.7.0] — Special Animal Variants

### Added
- Special variant system (15% base spawn chance, +1% per level)
- 9 special variants, one per animal type
- AbilitySystem with 9 distinct abilities (poop shot, egg bomb, mud splash, wool shield, bleat stun, feather float, honey trap, hay storm, crow call)

---

## [0.6.0] — Power-Up System

### Added
- Farm-themed power-ups: corn feed, hay bale, water trough, golden egg, salt lick
- Power-up spawning integrated with GameDirector

---

## [0.5.0] — Lives System

### Added
- 3 starting lives, max 5 (extendable to 8)
- Life loss on missed animals and topple
- Life earned on: 5 consecutive perfect catches, every 500 points, banking 10+ animals, power-ups
- Invincibility period after losing a life

---

## [0.4.0] — Core Mechanic Redesign

### Changed
- Gameplay paradigm: "drop character onto tower" replaced with "drag to catch falling animals"
- Player controls farmer at bottom; animals fall from tornado at top
- Stack builds upward from controlled base
- Wobble physics: movement causes stack wobble, tipping based on center of mass
- Banking system: save stacks of 5+ animals

---

## [0.3.0] — Architecture Refactor

### Added
- `config.ts` — all game constants and tuning
- `entities/` — Animal, Particle entity classes
- `renderer/` — drawing functions per entity type
- `engine/GameEngine.ts` — core game loop
- `hooks/` — React integration hooks
- `screens/` — Menu, Game, GameOver screens
- Responsive scaling system

---

## [0.2.0] — React Migration

### Changed
- Migrated from single HTML file to Vite + React + TypeScript project
- Canvas-based rendering
- localStorage for high scores

---

## [0.1.0] — Initial HTML Game

### Added
- Single-file tower stacking game
- Oscillating character mechanic
- Click/tap to drop character
- Simple scoring with perfect landing detection
