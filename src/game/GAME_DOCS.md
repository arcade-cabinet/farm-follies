# Farm Follies

**"Monday morning. Tornado warning. Total chaos."**

A tower-stacking game where a tornado drops barnyard animals and you, the panicked farmer, must catch and stack them before they scatter. Each animal has unique special abilities, and special variants add chaos to Monday morning on the farm.

---

## How to Play

### Controls
- **Drag** - Move the farmer left/right to catch falling animals
- **Tap stacked animal** - Activate their special ability (if available)
- **Bank button** - Save your stack when you have 5+ animals

### Objective
- Catch as many falling animals as possible
- Stack them on your head without toppling
- Bank your stack to earn bonus points and secure your animals
- Survive as long as possible!

---

## Scoring System

### Base Points
| Catch Quality | Points | Condition |
|--------------|--------|-----------|
| Perfect | 25 pts | Center catch |
| Good | 13 pts | Close to center |
| Basic | 10 pts | Edge catch |

### Multipliers
- **Stack Height**: 1.6x per animal in stack
- **Combo**: +15% per consecutive catch
- **Special Variants**: Bonus abilities add scoring opportunities
- **Power-ups**: Golden Egg doubles points temporarily

### Banking
- Requires 5+ animals
- Banking awards 5 points per animal
- Reduces multiplier by 60%
- Safe from toppling!

---

## The Tornado

The tornado moves back and forth across the top of the screen, dropping animals at random intervals.

- Intensity increases with level
- Direction changes randomly
- Spawn rate increases with difficulty
- Spawns animals from its funnel

---

## Wobble Physics

The stack follows realistic physics:

Moving the farmer causes the stack to wobble:
- **Slow movement** = gentle sway
- **Fast movement** = dramatic wobble
- **Landing impact** = wobble propagation

### Danger Indicators
- **Yellow flash** - Stack getting unstable
- **Red flash** - Critical danger!
- **Screen shake** - About to topple!

### Toppling
When wobble exceeds the critical angle:
- Stack scatters
- You lose a life
- All unstacked animals lost

---

## Barnyard Animals

### Base Animals (9 types)

| Animal | Common | Special Variant | Special Ability |
|--------|--------|-----------------|-----------------|
| **Chicken** | Brown | Golden Cluck | Explosive golden eggs |
| **Duck** | Yellow | Sir Quacksalot | Floats down slowly on feathers |
| **Pig** | Pink | Mudslide | Creates mud that slows nearby animals |
| **Sheep** | White | Shadow Wool | Protective wool shield |
| **Goat** | Tan | Gruff | Bleats to stun falling animals |
| **Cow** | Beige | Muddy Bessie | Shoots poop that grows bouncy bushes |
| **Goose** | White | Mother Goose | Creates sticky golden landing zone |
| **Rooster** | Red | Dawn Caller | Crows to attract animals to center |
| **Horse** | Brown | Haymaker | Summons floating hay platforms |

### Spawn Weights (adjusted by level)
- Chicken: 18%
- Duck: 16%
- Pig: 14%
- Sheep: 12%
- Goat: 10%
- Cow: 10%
- Goose: 8%
- Rooster: 7%
- Horse: 5%

---

## Special Abilities

### Poop Shot (Brown Cow - Muddy Bessie)
- Tap the cow to shoot fertilizer left or right
- Where it lands, a bush grows
- Animals bouncing off bushes get another chance
- Bushes decay after ~15 seconds

### Egg Bomb (Golden Chicken)
- Drops explosive golden eggs
- Clears nearby falling animals
- Awards bonus points

### Mud Splash (Pink Pig - Mudslide)
- Creates a mud zone
- Slows falling animals passing through
- Easier to catch!

### Wool Shield (Black Sheep - Shadow Wool)
- Wraps the stack in protective wool
- Temporary invincibility
- No toppling during effect

### Bleat Stun (Gray Goat - Gruff)
- Loud bleat stuns nearby animals
- Frozen animals are easier to catch
- Short duration

### Feather Float (Blue Duck - Sir Quacksalot)
- Duck floats down very slowly
- Easy catch
- Good for combos

### Honey Trap (Golden Goose - Mother Goose)
- Creates sticky golden landing zone
- Animals land more centered
- Reduces wobble impact

### Hay Storm (Tan Horse - Haymaker)
- Summons floating hay platforms
- Animals can bounce on hay
- Creates catch opportunities

### Crow Call (Albino Rooster - Dawn Caller)
- Loud crow attracts animals
- Falling animals drift toward center
- Easier positioning

---

## Power-Ups

### Farm-Themed Power-Ups
| Power-Up | Effect |
|----------|--------|
| Hay Bale | Restore one heart |
| Golden Egg | Double points for 8 seconds |
| Water Trough | Magnetic pull for 5 seconds |
| Salt Lick | Full hearts + 3s invincibility |
| Corn Feed | Merge stack into one mega animal |
| Lucky Horseshoe | Increase max hearts by 1 |

---

## Lives System

### Starting Lives: 3
### Maximum Lives: 5 (can be increased to 8)

### Losing Lives
- Miss a falling animal
- Stack topples

### Earning Lives
- 5 perfect catches in a row
- Every 500 points
- Bank 10+ animals
- Power-ups

---

## Difficulty Progression

### Level Scaling
- Spawn rate increases
- Tornado moves faster
- More special variants appear
- Rarer animals become more common

### Max Level: 25

---

## Game Modes

### Endless (Default)
- Classic survival mode
- Lives system active
- Bank to save progress

### Time Attack
- 90 seconds to score
- No lives
- Unlock at 1000+ score

### Zen Mode
- No lives, no pressure
- Practice stacking
- Unlock after 10 games

### Boss Rush
- Face boss animals
- Extra challenging
- Unlock at 5000+ score

---

## Tips & Strategies

1. **Bank early, bank often** - Don't get greedy with huge stacks
2. **Watch the tornado** - Anticipate where animals will fall
3. **Use special abilities** - They can save you in emergencies
4. **Center your catches** - Perfect catches = less wobble
5. **Keep moving smoothly** - Jerky movements cause instability
6. **Save bushes for emergencies** - Great for saving missed animals
7. **Stack similar animals** - Some combos work better together

---

## Technical Notes

- Built with React + TypeScript
- Canvas-based rendering at 60fps
- YUKA AI for intelligent spawning
- anime.js for smooth animations
- Procedural animal rendering
- Physics-based wobble system
