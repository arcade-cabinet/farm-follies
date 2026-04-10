---
title: Code Standards
updated: 2026-04-09
status: current
domain: technical
---

# Farm Follies — STANDARDS.md

Non-negotiable code quality constraints for this project.

## File Size

**Max 300 lines per file** — enforced for all languages (TypeScript, JavaScript, shell). Extract modules when approaching the limit.

## TypeScript

- `noImplicitAny: true` — no implicit `any` types.
- `strictNullChecks: false` — current known debt; do not make it worse.
- No `as any` casts. Use proper types or unknown with a type guard.
- Path alias `@/` maps to `src/` — use it consistently, no relative `../../` chains.

## Linting and Formatting (Biome)

Biome enforces:
- 2-space indentation
- Double quotes
- Semicolons
- Trailing commas (ES5)
- 100-character line width
- `const` over `let` wherever possible (`useConst: error`)

Run before committing:

```bash
pnpm lint:fix   # Auto-fix
pnpm check      # Lint + type check combined
```

## Architecture Constraints

### Systems must be pure functions

Systems in `src/game/engine/systems/` take state as input and return state as output. No side effects, no mutations, no external reads.

```typescript
// Correct
function updateStackWobble(state: WobbleState, ...): WobbleState { ... }

// Wrong — mutates state directly
function updateStackWobble(state: WobbleState, ...) { state.angle = ...; }
```

### Platform layer is mandatory for persistence and native APIs

Never use `localStorage` directly. Never import `@capacitor/*` in game code. Use:

```typescript
import { storage, feedback, haptics, platform } from "@/platform";
```

### Canonical type definitions live in config.ts

`AnimalType`, `PowerUpType`, and other canonical game types are defined once in `src/game/config.ts`. Re-export from there — never redefine.

### No stubs, no TODOs, no dead code

- Stubs and `TODO` comments in `src/` are bugs, not placeholders. Fix or delete.
- Dead functions and unused imports are removed, not commented out.
- CI will fail on lint errors; fix the root cause.

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | PascalCase.tsx | `GameScreen.tsx` |
| Hooks | camelCase.ts, prefix `use` | `useGameEngine.ts` |
| Systems / utilities | camelCase.ts | `WobblePhysics.ts` |
| Tests (unit) | Same name + `.test.ts(x)` in `__tests__/` | `Game.test.ts` |
| Tests (E2E) | Descriptive + `.spec.ts` in `e2e/` | `game-flow.spec.ts` |

## Testing

- Unit tests live in `src/**/__tests__/` and cover pure logic (systems, managers, entities).
- E2E tests live in `e2e/` and run against a real browser via Playwright.
- All 441 unit tests must pass before merging (`pnpm test:run`).
- When adding or changing logic, update or add tests in the same PR.
- Stale tests (testing deleted behavior) are deleted, not left failing.

## Commits and PRs

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`.
- Work on branches, open PRs, merge via GitHub — never commit directly to `main`.
- CI (`ci.yml`) runs lint, type check, and unit tests on every PR.

## Audio

- Dev: Tone.js procedural synthesis only.
- Prod: Pre-rendered OGG files in `public/assets/audio/`. Tone.js is fallback only.
- Do not commit WAV source files to the repo.

## Native

- Never import `@capacitor/*` directly in `src/game/` or `src/components/`.
- Use `pnpm native:sync` to build and sync before opening native IDEs.
