# System Patterns: Farm Follies

## Architecture Overview

### Current State: Hybrid Architecture
The game is transitioning from a monolithic architecture to a modular one:

```
┌─────────────────────────────────────────────────────┐
│                    React App                         │
├─────────────────────────────────────────────────────┤
│  GameScreen.tsx                                      │
│    └── Canvas + useGameEngine hook                   │
├─────────────────────────────────────────────────────┤
│  Game Engine (BEING REFACTORED)                      │
│    ├── GameEngine.ts (legacy monolith)               │
│    └── Game.ts (new modular)                         │
├─────────────────────────────────────────────────────┤
│  Systems (Pure Functions)                            │
│    ├── CollisionSystem                               │
│    ├── WobblePhysics                                 │
│    ├── ScoreSystem                                   │
│    ├── SpawnSystem                                   │
│    ├── MovementSystem                                │
│    └── BushSystem                                    │
├─────────────────────────────────────────────────────┤
│  Renderers (Canvas Drawing)                          │
│    ├── animals.ts                                    │
│    ├── tornado.ts                                    │
│    ├── farmer.ts                                     │
│    └── background.ts                                 │
└─────────────────────────────────────────────────────┘
```

## Design Patterns

### 1. Pure Functions for Systems
All game logic systems use pure functions:
```typescript
// Input state → Output state (no side effects)
function updateStackWobble(state, animals, velocity, dt): StackWobbleState
function calculateCatchPoints(animal, position, scoreState): ScoreEvent
```

**Benefits:**
- Testable in isolation
- Deterministic behavior
- Easy to reason about

### 2. Immutable State Updates
State is never mutated directly:
```typescript
function updatePlayer(state, updates): GameState {
  return { ...state, player: { ...state.player, ...updates } };
}
```

### 3. Entity-Component Pattern
Entities are data containers with typed components:
```typescript
interface AnimalEntity extends Entity {
  type: 'animal';
  animal: AnimalComponents;  // Animal-specific data
}
```

### 4. Event-Driven Side Effects
Game logic emits events; subscribers handle side effects:
```typescript
emitGameEvent('animal:caught', { animal, position, combo });
// Audio system subscribes and plays sound
```

### 5. Manager Classes for State
Managers encapsulate state with controlled access:
```typescript
class GameStateManager {
  private state: GameSessionState;
  addScore(points, options): number;
  loseLife(): boolean;
}
```

## Key Technical Decisions

### 1. Canvas Over DOM
- Direct pixel control
- Better performance for many entities
- Procedural graphics fit well

### 2. Fixed Timestep Physics
- Deterministic physics simulation
- Variable rendering for smooth display
- Prevents physics explosions

### 3. Responsive Scaling
- Base reference: iPhone SE (375px)
- Scale factor 0.65 - 1.5
- Larger touch targets on mobile

### 4. Procedural Graphics
- All animals drawn procedurally
- No sprite sheets needed
- Easy to add variants
- Smaller bundle size

## Component Relationships

### Spawn Flow
```
GameDirector → decides spawn
     ↓
SpawnSystem → creates AnimalEntity
     ↓
Tornado → visual spawn effect
     ↓
EntityManager → tracks entity
```

### Catch Flow
```
InputManager → drag position
     ↓
Player position updated
     ↓
CollisionSystem → check catch
     ↓
ScoreSystem → calculate points
     ↓
WobblePhysics → apply impact
     ↓
GameStateManager → update score
```

### Render Flow
```
GameLoop.render()
     ↓
Renderer.render()
     ↓
┌──────────────────┐
│ drawBackground() │
│ drawBankZone()   │
│ drawFloorZone()  │
│ drawTornado()    │
│ drawPlayer()     │
│ drawAnimals()    │
│ drawEffects()    │
└──────────────────┘
```

## Critical Implementation Paths

### Wobble Physics
```
Player velocity → Movement wobble
Stack height → Height multiplier
Animal weight → Weight factor
     ↓
Wobble angle calculated per animal
     ↓
Propagate up stack (transfer ratio)
     ↓
Check thresholds (warning/collapse)
```

### Scoring
```
Base points (animal type)
  × Catch bonus (perfect/good)
  × Stack bonus (exponential)
  × Combo multiplier
  × Power-up multiplier
  = Final score
```
