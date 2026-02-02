# Feature: Animal System

## Overview
The game features 9 barnyard animals, each with normal and special variants. Special variants have unique abilities that affect gameplay.

## Animal Types

### Light Animals (Fast Fall, Low Weight)
| Type | Points | Weight | Fall Speed | Width | Height |
|------|--------|--------|------------|-------|--------|
| Chicken | 10 | 0.5 | 3.0 | 50 | 45 |
| Duck | 15 | 0.6 | 3.5 | 55 | 50 |
| Turkey | 30 | 0.8 | 3.2 | 60 | 65 |

### Medium Animals (Balanced)
| Type | Points | Weight | Fall Speed | Width | Height |
|------|--------|--------|------------|-------|--------|
| Pig | 20 | 1.5 | 4.0 | 65 | 55 |
| Goat | 30 | 1.0 | 3.8 | 60 | 60 |
| Sheep | 25 | 1.2 | 3.0 | 60 | 55 |

### Heavy Animals (Slow Fall, High Weight)
| Type | Points | Weight | Fall Speed | Width | Height |
|------|--------|--------|------------|-------|--------|
| Cow | 35 | 2.0 | 4.5 | 80 | 70 |
| Donkey | 40 | 1.8 | 4.2 | 75 | 70 |
| Horse | 50 | 2.2 | 5.0 | 85 | 80 |

## Special Variants

Each animal has one or more special variants with unique abilities:

### Chicken
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| White | Common | - | Standard chicken |
| Brown | Common | - | Standard chicken |
| Golden | Rare | `golden_egg` | Drops golden eggs worth bonus points |

### Duck
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Mallard | Common | - | Standard duck |
| White | Common | - | Standard duck |
| Rubber | Uncommon | `bounce` | Bounces once if dropped |
| Fire | Legendary | `heat_wave` | Slows nearby falling animals |

### Pig
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Pink | Common | - | Standard pig |
| Spotted | Common | - | Standard pig |
| Mud | Uncommon | `mud_splash` | Creates slippery zone on landing |

### Cow
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Holstein | Common | - | Black and white spots |
| Jersey | Common | - | Tan colored |
| Brown | Rare | `poop_shot` | **KEY ABILITY** - Shoots poop that grows bushes |
| Purple | Legendary | `milk_rain` | Creates healing milk drops |

### Sheep
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| White | Common | - | Standard sheep |
| Black | Uncommon | `wool_cushion` | Softens landing, reduces wobble |
| Rainbow | Legendary | `color_shift` | Changes point value based on color |

### Goat
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| White | Common | - | Standard goat |
| Brown | Common | - | Standard goat |
| Mountain | Rare | `sure_footed` | Stabilizes the stack when caught |

### Horse
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Brown | Uncommon | - | Standard horse |
| Black | Uncommon | - | Standard horse |
| Golden | Rare | `gallop` | Speeds up player movement briefly |

### Donkey
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Grey | Uncommon | - | Standard donkey |
| Stubborn | Rare | `stubborn` | Refuses to fall for 2 seconds (hovers) |

### Turkey
| Variant | Rarity | Ability | Description |
|---------|--------|---------|-------------|
| Wild | Common | - | Standard turkey |
| Fancy | Rare | `feather_float` | Floats down slowly with feathers |

## Spawn Weights

Animals spawn based on weighted probability, adjusted by level:

```typescript
baseWeights = {
  chicken: 1.0,   // Most common
  duck: 0.9,
  pig: 0.7,
  sheep: 0.6,
  goat: 0.5,
  cow: 0.4,
  turkey: 0.3,
  horse: 0.2,
  donkey: 0.15,   // Rarest
}

// At higher levels, heavier animals become more common
adjustedWeight = baseWeight + (weight - 1) * (level - 3) * 0.1
```

## Special Variant Chance

```typescript
baseChance = 0.15  // 15% base chance
levelBonus = level * 0.01  // +1% per level
specialChance = baseChance + levelBonus

// Rarity weights for special variants
rarityWeights = {
  uncommon: 0.6,  // 60% of specials
  rare: 0.3,      // 30% of specials
  legendary: 0.1, // 10% of specials
}
```

## Key Ability: Poop Shot → Bush

The Brown Cow's `poop_shot` ability is a core mechanic:

1. When activated, shoots poop projectile left or right
2. Where poop lands, a bush grows (using anime.js for animation)
3. Bush takes ~2 seconds to fully grow
4. When falling animal hits top of grown bush:
   - Animal bounces back up
   - Player gets another chance to catch
   - Bonus points awarded
5. Bush decays after ~15-30 seconds

### Bush Bounce Physics
```typescript
bounceStrength = bush.bounceStrength * bush.growthStage
bounceVelocityY = -Math.abs(animal.velocityY) * bounceStrength * 1.5
bounceVelocityX = hitOffsetX * 0.1  // Slight horizontal variation
```

## Rendering

Animals are rendered procedurally in `src/game/renderer/animals.ts`:
- Each animal has a dedicated draw function
- Stress/confusion affects expression (spiral eyes, wiggling)
- Special ability ready shown with glow effect
- Goat has horizontal pupils (like real goats!)

### Color System
Colors defined in `src/game/config.ts` under `FARM_COLORS.animals`:
```typescript
FARM_COLORS.animals = {
  chicken: { body: '#FFE4B5', beak: '#FF8C00', comb: '#FF0000' },
  duck: { body: '#FFD93D', beak: '#FF6B35', feet: '#FF6B35' },
  // ... etc
}
```

## Implementation Files

- **Type definitions**: `src/game/ecs/types.ts`
- **Archetypes (ECS)**: `src/game/ecs/archetypes.ts`
- **Archetypes (SpawnSystem)**: `src/game/engine/systems/SpawnSystem.ts`
- **Entity class**: `src/game/engine/entities/Animal.ts`
- **Rendering**: `src/game/renderer/animals.ts`
- **Bush system**: `src/game/engine/systems/BushSystem.ts`
- **Bush rendering**: `src/game/renderer/bush.ts`
