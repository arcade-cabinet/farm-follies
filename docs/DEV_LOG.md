# Farm Follies - Development Log

> **Note:** This project was originally themed as "Psyduck Stack" and was rebranded to "Farm Follies" with a complete theme transition to barnyard animals. Historical phases below retain their original context for accuracy, with the understanding that all Psyduck/Pokemon references have since been replaced with farm-themed equivalents.

## Project Overview
A tower-stacking game featuring barnyard animal characters, built with React, TypeScript, Canvas, and various audio/animation libraries.

---

## Evolution Timeline

### Phase 1: Initial HTML Game
- Started as a complete HTML file for a tower-stacking game
- Basic tower stacking with oscillating character mechanic
- Click/tap to drop character onto the tower
- Simple scoring with perfect landing detection

### Phase 2: React Integration
- Migrated to Vite + React + TypeScript project
- Created monolithic game component
- Basic canvas-based rendering
- Web Audio API for sound effects
- Local storage for high scores

### Phase 3: Architecture Refactor
- Separated concerns into proper module structure:
  - `config.ts` - All game constants and tuning
  - `audio.ts` - Sound system
  - `entities/` - Entity classes (Animal, Particle)
  - `renderer/` - Drawing functions
  - `engine/GameEngine.ts` - Core game loop
  - `hooks/` - React integration hooks
  - `components/` - UI components
  - `screens/` - Menu, Game, GameOver screens
- Added responsive scaling system
- Improved separation of rendering and logic

### Phase 4: Game Mechanic Redesign
**Major paradigm shift from "drop character onto tower" to "drag to catch falling animals"**

New Core Mechanics:
- Player drags farmer at bottom to catch animals falling from ceiling
- Stack builds upward from controlled base
- Wobble physics - moving causes stack to wobble
- Tipping point calculation based on center of mass
- Banking system - save stacks of 5+ animals for safety

### Phase 5: Lives System
- 3 starting lives, max 5 (can extend to 8)
- Animals hitting floor cost a life
- Earn lives through:
  - 5 consecutive perfect catches
  - Every 500 points
  - Banking 10+ animals
  - Collecting power-ups
- Invincibility period after losing life

### Phase 6: Power-Up System
Added farm-themed collectibles:
- **Corn Feed** (Pink) - Merges entire stack into one mega animal
- **Hay Bale** (Purple) - Restores 1 heart
- **Water Trough** (Blue) - Magnetic pull for 5 seconds
- **Golden Egg** (Orange) - Double points for 8 seconds
- **Salt Lick** (Cyan) - Full heal + invincibility

### Phase 7: Special Animal Types
Animals with abilities:
- **Normal animals** (85% spawn) - Standard behavior
- **Fire variant** (8% spawn) - Tap to shoot projectiles and destroy falling animals, 3-second cooldown
- **Ice variant** (7% spawn) - Tap to freeze nearest falling animal, 5-second cooldown

### Phase 8: Audio Enhancement
Integrated Tone.js for:
- Background music with a lively farm theme
- Dynamic intensity based on game state
- Proper synthesized sound effects

### Phase 9: Physics Tuning (Multiple Iterations)
Balanced wobble mechanics through several rounds:
- Reduced wobble strength for better feel
- Adjusted damping and springiness
- Made tipping more forgiving
- Added warning/danger thresholds

### Phase 10: Progression System
- Coin economy (earn coins from scores)
- 8 permanent upgrades with shop UI
- Mode selection screen
- Boss animal entities
- Mode unlock tracking
- Achievement system

### Phase 11: YUKA AI Integration
**Major AI overhaul using YUKA library for intelligent game direction**

#### Wobble Governor
- Goal-driven AI controlling stack wobble
- Goals: steady pressure, tension pulses, mercy mode, chaos mode
- Responds to player stress and threat level
- Creates organic difficulty feeling

#### Game Director
Full AI orchestration system:
- **Strategic Spawning**: Positions animals based on player position and current goal
- **Difficulty Scaling**: Logarithmic curves for level, time, and score
- **Player Modeling**: Tracks skill, fatigue, frustration, engagement
- **Goal System**:
  - `build_pressure` - Maintain tension during normal play
  - `release_tension` - Back off after stress
  - `challenge` - Push skilled players
  - `mercy` - Help struggling players
  - `reward` - Spawn power-ups for good performance
- **Animal Behavior Assignment**: Seeker, dive, zigzag, evader, floater
- **Power-Up Intelligence**: Strategic timing and type selection

### Phase 12: Dev Tooling Upgrade
- Upgraded Biome from 2.0.6 to 2.3.13
- Added Vitest for unit testing with happy-dom
- Added Playwright for E2E testing (Chromium, Firefox, WebKit)
- Removed Next.js shims (were only used for next-themes)
- Simplified theme handling to use Tailwind's native dark mode

### Phase 13: Input & Responsive Overhaul
**Major improvements to touch controls and screen size support**

#### Smooth Dragging System
- Frame-rate independent interpolation using exponential smoothing
- Momentum/inertia after releasing drag
- Soft bounce effect at screen boundaries
- Consistent feel across 30fps and 60fps devices
- Separate velocity tracking for wobble vs momentum

```typescript
// Frame-rate independent smoothing
const smoothTime = 25;
const frameLerp = 1 - Math.exp(-deltaTime / smoothTime);

// Momentum decay after release
const momentumDecay = Math.exp(-deltaTime / 120);
```

#### Responsive Scaling System
- Dynamic scaling based on screen dimensions
- Reference: iPhone SE portrait (375x667) = scale 1.0
- Scale range: 0.65 - 1.4

| Device | Width | Scale | Animal Size | Bank Width |
|--------|-------|-------|-------------|------------|
| iPhone SE | 375px | 1.0 | 70x60 | 65px |
| Pixel 8a | 412px | 1.10 | 77x66 | 72px |
| iPad | 768px | 1.4 | 98x84 | 80px |
| Small phone | <350px | 0.65 | 45x40 | 45px |

#### Mobile Optimizations
- More forgiving hit detection on smaller screens (1.2x tolerance)
- Larger touch targets on mobile
- Viewport meta with `user-scalable=no, viewport-fit=cover`
- Safe area inset support for notched devices

### Phase 14: Farm Follies Theme Transition
**Complete rebrand from Psyduck/Pokemon theme to barnyard farm theme**

- 9 animal types: cow, chicken, pig, sheep, goat, duck, goose, horse, rooster
- New renderers: animals.ts, farmer.ts, tornado.ts, bush.ts, background.ts
- Farm-themed power-ups: hay bale, golden egg, water trough, salt lick, corn feed
- Modular engine rewrite: monolithic GameEngine.ts split into composable systems
- Entity system: Animal.ts with typed variants replaces Duck.ts
- Player entity: farmer character replaces Psyduck base character

---

## Current Architecture

```
src/game/
├── ai/
│   ├── GameDirector.ts      # YUKA-powered game orchestration
│   ├── WobbleGovernor.ts    # Goal-driven wobble control
│   └── AnimalBehavior.ts    # Animal steering behaviors
│
├── config.ts                # Game constants, animal types, power-ups
├── audio.ts                 # Tone.js audio system
├── achievements.ts          # Achievement tracking
│
├── engine/
│   ├── Game.ts              # Modular game orchestrator
│   ├── GameLoop.ts          # rAF with fixed timestep
│   ├── systems/             # Pure function systems (Ability, Collision, Wobble, Score, Spawn, Movement, Bush)
│   ├── entities/
│   │   ├── Entity.ts        # Base entity
│   │   ├── Animal.ts        # Animal entity (9 types with variants)
│   │   ├── Player.ts        # Farmer entity
│   │   └── PowerUp.ts       # Collectible power-ups
│   └── managers/
│       ├── EntityManager.ts # Entity lifecycle
│       └── GameStateManager.ts # Game state
│
├── renderer/
│   ├── animals.ts           # Animal drawing (all 9 types)
│   ├── farmer.ts            # Farmer character
│   ├── tornado.ts           # Tornado effects
│   ├── bush.ts              # Bush decorations
│   └── background.ts        # Farm background
│
├── ecs/
│   ├── archetypes.ts        # Animal archetype definitions
│   └── types.ts             # ECS component and entity types
│
├── hooks/
│   ├── useGameEngine.ts     # React integration
│   ├── useHighScore.ts      # localStorage persistence
│   └── useResponsiveScale.ts
│
├── components/              # UI components (HUD, buttons, etc.)
├── screens/                 # Menu, Game, GameOver screens
├── modes/                   # Game mode definitions
└── progression/             # Upgrades and coin system
```

---

## Libraries Installed

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| Tone.js | ^15.1.22 | Audio synthesis & music | Integrated |
| YUKA | ^0.7.8 | Game AI/goal-driven behavior | Integrated |
| @types/yuka | ^0.7.4 | TypeScript types for YUKA | Integrated |
| Babylon.js | ^8.49.6 | 3D graphics | Available, unused |
| anime.js | ^4.3.5 | UI animations | Integrated |
| Framer Motion | 12.9.2 | React animations | Available |
| Biome | 2.3.x | Linting & formatting | Configured |
| Vitest | 4.x | Unit testing | Configured |
| Playwright | 1.58+ | E2E testing | Configured |
| happy-dom | 20.x | DOM simulation for tests | Configured |

---

## Current Physics Values

```typescript
physics: {
  wobbleStrength: 0.045,      // Gentler base wobble
  wobbleDamping: 0.94,        // Smooth settling
  wobbleSpringiness: 0.08,    // Softer snap-back
  stackStability: 0.72,       // Visible but manageable
  impactWobble: 0.025,        // Gentler landings

  aiWobble: {
    seekerImpact: 0.015,      // AI animals add tension
    diveImpact: 0.025,        // Divers hit harder
    evaderImpact: 0.008,      // Sneaky contribution
    swarmBonus: 0.005,        // Multiple threats compound
    maxAIWobble: 0.08,        // Cap on AI influence
  },

  tipping: {
    criticalAngleBase: 0.58,  // More forgiving
    heightPenalty: 0.007,     // Height matters less
    warningThreshold: 0.60,   // Earlier warning
    dangerThreshold: 0.88,    // More reaction time
  }
}
```

---

## Resolved Issues

- [x] Wobble too sensitive - Multiple tuning passes
- [x] Audio context not starting - Init on user gesture
- [x] Background music not playing - Proper Tone.js setup
- [x] Random difficulty feels unfair - YUKA AI Director
- [x] Spawning too random - Strategic positioning
- [x] No mercy for struggling players - AI mercy mode
- [x] Sound toggle - SoundToggle component
- [x] Pause functionality - PauseMenu component
- [x] Tutorial - Tutorial component
- [x] Dragging feels laggy/jittery - Frame-rate independent smoothing
- [x] Game too small on mobile - Responsive scaling system
- [x] Hit detection too strict on small screens - Adaptive catch tolerance

---

## Known Gaps

### Features to Consider
1. Leaderboard with backend
2. More animal variants (seasonal, rare)
3. Seasonal events/themes
4. PWA offline support
5. Social sharing (GIF replays)
6. Daily challenges

### Technical Debt
1. Could extract ResponsiveScale to separate module
2. No error boundaries
3. Could use OffscreenCanvas for performance

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Type check
pnpm tscgo --noEmit

# Lint and format
pnpm lint
pnpm lint:fix

# Unit tests
pnpm test           # Watch mode
pnpm test:run       # Single run

# E2E tests
pnpm test:e2e       # Playwright

# Build
pnpm build
```

---

## Testing Checklist

### Gameplay
- [x] Can catch falling animals consistently
- [x] Stack doesn't topple with gentle movement
- [x] Special animal abilities work
- [x] Power-ups spawn and can be collected
- [x] Banking works correctly
- [x] Lives system functions (lose/earn)
- [x] AI director responds to player state
- [x] Mercy mode activates when struggling
- [x] Dragging is smooth with momentum
- [x] Works on small screens (iPhone SE)

### UI/UX
- [x] Menu displays correctly
- [x] HUD readable
- [x] Touch controls responsive
- [x] Perfect/Good feedback visible
- [x] Danger warning noticeable
- [x] Director state indicator visible
- [x] UI scales on different screen sizes

### Audio
- [x] Music plays during game
- [x] Sound effects trigger correctly
- [x] Mute persists across sessions

---

*Last updated: Farm Follies theme transition complete*
