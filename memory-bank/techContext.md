# Technical Context: Farm Follies

## Technology Stack

### Core
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **HTML Canvas** - Game rendering

### Testing
- **Vitest** - Unit testing
- 81 tests currently passing

### Tooling
- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Formatting

## Project Structure
```
src/
├── game/
│   ├── config.ts              # Game constants, colors
│   ├── ecs/                   # ECS type definitions
│   │   ├── types.ts           # Component/entity types
│   │   └── archetypes.ts      # Animal factories
│   ├── engine/                # Game engine (being refactored)
│   │   ├── GameEngine.ts      # Legacy monolith (1900+ lines)
│   │   ├── Game.ts            # New modular game class
│   │   ├── core/              # Game loop, scaling
│   │   ├── input/             # Input handling
│   │   ├── entities/          # Entity definitions
│   │   ├── managers/          # State management
│   │   ├── systems/           # Pure game logic
│   │   ├── rendering/         # Canvas rendering
│   │   ├── state/             # Legacy state types
│   │   └── __tests__/         # Unit tests
│   ├── renderer/              # Drawing functions
│   │   ├── animals.ts         # Animal rendering
│   │   ├── tornado.ts         # Tornado rendering
│   │   ├── farmer.ts          # Player rendering
│   │   ├── bush.ts            # Bush rendering
│   │   └── background.ts      # Background rendering
│   ├── entities/              # Legacy entity classes
│   ├── ai/                    # AI systems
│   └── screens/               # React screens
├── components/                # React components
└── platform/                  # Platform abstractions
```

## Key Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run tests
pnpm tsc --noEmit     # Type check
```

## Development Setup
1. Clone repository
2. Run `pnpm install`
3. Run `pnpm dev`
4. Open browser to localhost

## Technical Constraints
- Must run at 60fps on mobile
- Canvas rendering (no WebGL)
- Touch-friendly hit targets
- Responsive to screen size

## Dependencies
- @/platform - Audio feedback abstraction
- anime.js - Animation library (for bush growth)

## Known Technical Debt
1. GameEngine.ts is 1900+ lines - needs modularization
2. Dual entity systems (legacy Duck vs new Animal)
3. Type conflicts between ECS types and engine types
4. Some tests use `as any` casts
