# Farm Follies

A physics-based tower-stacking arcade game set on a barnyard farm. Catch falling animals, build impossible towers, and try not to let your stack topple!

**Cross-platform:** Web, Android, iOS, and Desktop (Electron)

## Play

Drag your farmer to catch falling animals and build the tallest tower possible. But be careful - move too fast and your tower will wobble and fall!

### Controls
- **Drag** - Move your farmer left/right to catch falling animals
- **Tap stacked animal** - Trigger special abilities
- **Bank button** - Bank your stack to safety

## Features

### Smooth Touch Controls
- **Butter-smooth dragging** with momentum and inertia
- Frame-rate independent movement (consistent on 30fps and 60fps devices)
- Soft bounce at screen edges
- Responsive on all screen sizes

### Responsive Design
- **Fully playable on any device** - iPhone SE to iPad to desktop
- Automatic scaling of animal size, UI, and hit detection
- More forgiving catch zones on smaller screens
- Touch-optimized controls on mobile

### Dynamic Physics
- Realistic wobble mechanics - smooth movements are rewarded
- Stack stability decreases with height
- Center of mass calculations for tipping

### Animal Types
Nine barnyard animals fall from the sky, each with unique shapes and personalities:
- **Cow** - Large and sturdy
- **Chicken** - Small and quick
- **Pig** - Round and bouncy
- **Sheep** - Fluffy and light
- **Goat** - Nimble climber
- **Duck** - Classic barnyard quacker
- **Goose** - Long-necked troublemaker
- **Horse** - Tall and heavy
- **Rooster** - Proud and loud

### Power-Ups
- **Hay Bale** - Extra life
- **Golden Egg** - Double points
- **Water Trough** - Magnetic pull attracts animals toward you
- **Salt Lick** - Full restore + temporary invincibility
- **Corn Feed** - Merge your entire stack into one mega animal

### Intelligent AI Director
The game features a YUKA-powered AI that adapts to your skill:
- Struggling? The game shows mercy with easier spawns
- Doing well? Expect more challenging animal patterns
- Logarithmic difficulty scaling feels fair at all skill levels

### Audio & Haptics
- Original synthesized soundtrack with a lively farm theme
- Dynamic music intensity based on gameplay
- Satisfying sound effects for every action
- Haptic feedback on native platforms (land, perfect catch, game over)

## Tech Stack

- **React 19** + **TypeScript** - Modern UI framework
- **Canvas 2D** - Smooth 60fps game rendering
- **Tone.js** - Procedural audio synthesis
- **YUKA** - Goal-driven AI for game direction
- **Capacitor 8** - Cross-platform native builds
- **Vite** - Lightning-fast builds
- **Tailwind CSS** - Utility-first styling

## Platforms

| Platform | Status | Build Command |
|----------|--------|---------------|
| Web/PWA | Ready | `pnpm build:prod` |
| Android | Ready | `pnpm native:android` |
| iOS | Ready | `pnpm native:ios` |
| Desktop (Electron) | Ready | `pnpm native:electron` |

### Device Support

| Device | Screen | Status |
|--------|--------|--------|
| iPhone SE | 375x667 | Optimized |
| iPhone 14/15 | 390x844 | Optimized |
| Pixel 8a | 412x915 | Optimized |
| iPad | 768x1024 | Optimized |
| Desktop | Any | Optimized |

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Type check
pnpm tscgo --noEmit

# Lint and format
pnpm lint
pnpm lint:fix

# Run tests
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:ui        # Vitest UI

# E2E tests
pnpm test:e2e       # Playwright
pnpm test:e2e:ui    # Playwright UI

# Build for production
pnpm build:prod
```

### Native Development

```bash
# Sync web assets to all native platforms
pnpm native:sync

# Open in native IDEs
pnpm native:android   # Opens Android Studio
pnpm native:ios       # Opens Xcode
pnpm native:electron  # Runs Electron app

# Run on device/emulator
pnpm cap:run:android
pnpm cap:run:ios
```

### Audio Asset Generation

The game uses Tone.js for procedural audio during development. For production builds, audio is pre-rendered to OGG files:

```bash
# Capture audio (in browser console)
window.captureAudio.captureAllAudio()

# Convert WAV to OGG
ffmpeg -i input.wav -c:a libvorbis -q:a 6 output.ogg

# Audio files go in:
# public/assets/audio/sfx/    - Sound effects
# public/assets/audio/music/  - Background music tracks
```

## Project Structure

```
/
├── src/
│   ├── game/           # Game logic
│   │   ├── ai/         # YUKA-powered AI (GameDirector, WobbleGovernor)
│   │   ├── engine/     # Core game loop, physics, responsive scaling
│   │   ├── ecs/        # Entity Component System types and archetypes
│   │   ├── renderer/   # Canvas drawing functions (animals, farmer, tornado, bush, background)
│   │   ├── hooks/      # React integration
│   │   ├── components/ # UI components
│   │   ├── screens/    # Menu, Game, GameOver
│   │   └── config.ts   # All game constants
│   │
│   ├── platform/       # Cross-platform abstraction
│   │   ├── haptics.ts  # Native haptic feedback
│   │   ├── storage.ts  # Capacitor Preferences / localStorage
│   │   ├── audio.ts    # Pre-rendered audio with Tone.js fallback
│   │   ├── feedback.ts # Unified audio + haptics API
│   │   └── app-lifecycle.ts  # Pause/resume handling
│   │
│   └── components/ui/  # shadcn/ui components
│
├── android/            # Android native project
├── ios/                # iOS native project
├── electron/           # Electron desktop project
└── public/assets/audio/  # Pre-rendered audio files
```

## Game Mechanics

### Scoring
| Action | Points |
|--------|--------|
| Catch animal | 10 x stack multiplier |
| Perfect catch | x2.5 bonus |
| Combo chain | +15% per catch |

### Lives
- Start with 3 lives (max 5, can extend to 8)
- Lose a life when animals hit the floor or stack topples
- Earn lives through perfect catches, score milestones, and power-ups

### Banking
When you have 5+ animals stacked, bank them to safety:
- Banked animals are protected from topples
- Banking 10+ animals earns a bonus life
- Trade-off: Your multiplier is reduced by 40%

## Documentation

- [Development Log](docs/DEV_LOG.md) - Project history and decisions
- [Game Mechanics](src/game/GAME_DOCS.md) - Detailed game mechanics
- [Agent Context](AGENTS.md) - AI development guide

## Credits

Built with React, TypeScript, Capacitor, and a lot of barnyard chaos.

---

*Stack responsibly. The farmer is not responsible for toppled towers.*
