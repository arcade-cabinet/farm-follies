# Farm Follies - Tech Stack

## Core Technologies
- **React 19** - UI framework
- **TypeScript 5.9** - Type safety (`noImplicitAny: true`, `strictNullChecks: false`)
- **Vite 6.4** - Build tool with single-file output
- **HTML Canvas** - Game rendering (procedural 2D, no sprites)
- **Capacitor 8** - Cross-platform native builds

## Key Libraries
- **Tone.js** - Procedural audio synthesis
- **YUKA** - Goal-driven AI for GameDirector
- **anime.js** - UI animations
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible UI primitives

## Testing
- **Vitest 4** - Unit tests (441+ tests)
- **Playwright** - E2E tests
- **happy-dom** - DOM simulation

## Tooling
- **pnpm** - Package manager
- **Biome** - Linting and formatting (2 spaces, double quotes, semicolons)

## Common Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (localhost:5173)
pnpm build:prod       # Production build
pnpm test:run         # Run unit tests (single run)
pnpm test             # Run tests (watch mode)
pnpm check            # Lint + type check
pnpm lint:fix         # Auto-fix lint issues
pnpm tsc --noEmit     # TypeScript check only
```

## Native Development
```bash
pnpm native:sync      # Sync web assets to native platforms
pnpm native:android   # Open Android Studio
pnpm native:ios       # Open Xcode
pnpm native:electron  # Run Electron app
```

## TypeScript Notes
- Path alias: `@/*` maps to `src/*`
- `strictNullChecks` is disabled (enabling requires widespread refactoring)
- Target: ES2020, JSX: react-jsx
