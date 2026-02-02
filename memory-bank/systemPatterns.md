# System Patterns: Farm Follies

## Architecture Overview

### Modular Engine Architecture
The game uses a clean modular architecture with clear separation of concerns:

```
+-----------------------------------------------------+
|                    React App                         |
+-----------------------------------------------------+
|  GameScreen.tsx                                      |
|    +-- Canvas + useGameEngine hook                   |
+-----------------------------------------------------+
|  Game.ts (~929 lines, modular orchestrator)          |
|    Composes systems, managers, entities, rendering   |
+-----------------------------------------------------+
|  Systems (Pure Functions)    | Managers (Stateful)   |
|    AbilitySystem             |   EntityManager       |
|    CollisionSystem           |   GameStateManager    |
|    WobblePhysics             |                       |
|    ScoreSystem               | Entities (Data)       |
|    SpawnSystem               |   Entity (base)       |
|    MovementSystem            |   Animal (+ variants) |
|    BushSystem                |   Player (farmer)     |
+-----------------------------------------------------+
|  Renderers (Canvas Drawing)                          |
|    animals.ts       background.ts                    |
|    tornado.ts       bush.ts                          |
|    farmer.ts                                         |
+-----------------------------------------------------+
|  AI (YUKA goal-driven)                               |
|    GameDirector     WobbleGovernor    AnimalBehavior |
+-----------------------------------------------------+
```

## Design Patterns

### 1. Pure Functions for Systems
All game logic systems use pure functions:
```typescript
// Input state -> Output state (no side effects)
function updateStackWobble(state, animals, velocity, dt): StackWobbleState
function calculateCatchPoints(animal, position, scoreState): ScoreEvent
function activateAbility(state, animal, player, entities): AbilitySystemState
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
  animal: AnimalComponents;  // Animal-specific data (type, variant, weight, ability state)
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

### 6. AbilitySystem Integration
Abilities follow the same pure-function pattern as other systems:
```typescript
// Game.ts orchestrates the lifecycle:
// 1. Player taps stacked animal -> findTappedAbilityAnimal()
// 2. Resolve ability type        -> resolveAbilityType()
// 3. Activate ability            -> activateAbility()
// 4. Each frame update effects   -> updateAbilityEffects()
// 5. Passive checks in movement  -> getFeatherFloatMultiplier(), getMudSlowFactor()
// 6. Stack cooldown ticks        -> updateStackAbilityCooldowns()
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

### 5. Unified AnimalType
- Single 9-type union: chicken, duck, pig, goat, sheep, cow, goose, horse, rooster
- Used consistently across entities, spawn system, ECS archetypes, and renderers
- `AnimalSpawnTemplate` (game stats) vs `AnimalArchetype` (rendering colors) avoids naming conflicts

## Component Relationships

### Spawn Flow
```
GameDirector -> decides spawn
     |
SpawnSystem -> creates AnimalEntity via AnimalSpawnTemplate
     |
Tornado -> visual spawn effect
     |
EntityManager -> tracks entity
```

### Catch Flow
```
InputManager -> drag position
     |
Player position updated
     |
CollisionSystem -> check catch
     |
ScoreSystem -> calculate points
     |
WobblePhysics -> apply impact
     |
GameStateManager -> update score
```

### Ability Flow
```
Player taps stacked animal
     |
findTappedAbilityAnimal() -> identifies which animal
     |
resolveAbilityType() -> determines ability from AnimalSpawnTemplate
     |
activateAbility() -> creates active effect in AbilitySystemState
     |
updateAbilityEffects() each frame -> applies effects (slow zones, shields, etc.)
     |
Effect expires -> removed from state, cooldown starts
```

### Render Flow
```
GameLoop.render()
     |
Renderer.render()
     |
+------------------+
| drawBackground() |
| drawBankZone()   |
| drawFloorZone()  |
| drawTornado()    |
| drawPlayer()     |
| drawAnimals()    |
| drawEffects()    |
+------------------+
```

## Critical Implementation Paths

### Wobble Physics
```
Player velocity -> Movement wobble
Stack height -> Height multiplier
Animal weight -> Weight factor
     |
Wobble angle calculated per animal
     |
Propagate up stack (transfer ratio)
     |
Check thresholds (warning/collapse)
```

### Scoring
```
Base points (animal type)
  x Catch bonus (perfect/good)
  x Stack bonus (exponential)
  x Combo multiplier
  x Power-up multiplier
  = Final score
```
