---
title: Design
updated: 2026-04-09
status: current
domain: product
---

# Farm Follies — Design

## Vision

Farm Follies is a casual arcade game with a single premise that is immediately legible: a tornado is dropping animals, and you need to catch them before they scatter.

The game rewards deliberate, smooth movement. Panic leads to topples. Mastery comes from reading the AI director's patterns and banking at the right moment.

**Tagline:** "Monday morning. Tornado warning. Total chaos."

## What It Is

- A physics-based stacking game where the player controls the base (the farmer), not the falling objects.
- A tension machine: as the stack grows, the wobble increases, and the moment of decision — bank now or risk more — becomes harder.
- A casual game that reveals mechanical depth over repeated play.
- Cross-platform: Web (primary), Android, iOS, Desktop.

## What It Is Not

- Not a matching game.
- Not a score-chase with predetermined optimal plays — the AI director varies each session.
- Not a reflex-only game — position and timing matter more than speed.

## Core Loop

```
Catch Animals -> Stack Grows -> Wobble Increases -> Bank or Risk -> Repeat
```

Each iteration of the loop takes 15–60 seconds depending on skill. Banking resets the stack but preserves the score multiplier (reduced by 40%). Toppling loses a life and all unstacked animals.

## Emotional Arc Per Session

1. **Chaos** — Tornado drops animals unpredictably. First catches feel lucky.
2. **Tension** — Stack wobbles dangerously as height grows.
3. **Relief** — Banking a tall stack feels earned.
4. **Excitement** — A special ability triggers at a critical moment.
5. **Satisfaction** — Session ends with a new high score or close call.

## Player Experience Goals

### First-Time Player
- Understand controls in seconds (drag to move).
- Catch first animal successfully.
- Experience wobble physics before any tutorialization.
- Learn banking organically through the bank-zone UI prompt.

### Returning Player
- Chase personal high scores.
- Discover and learn to trigger special animal variants.
- Master wobble management (smooth acceleration, not speed).
- Experiment with game modes (Time Attack, Zen, Boss Rush).

## Visual Identity

- **Style**: Rustic farm palette. Warm earth tones — amber, tan, green, barn red.
- **Rendering**: Procedural Canvas 2D. No sprite sheets. Animals are expressive, slightly cartoonish.
- **Animals**: Each type has distinctive shape, color, and facial expression. Stress state (falling fast, mid-wobble) changes eye expressions.
- **Tornado**: Animated funnel with debris — the primary visual anchor at the top of the screen.
- **Background**: Farm scene with rolling hills and a barn. Static during gameplay.

## Animal Personality

Each animal conveys personality through its special ability:

| Animal | Personality | Ability |
|--------|-------------|---------|
| Cow (Muddy Bessie) | Mischievous | Shoots poop — grows bouncy bushes |
| Chicken (Golden Cluck) | Explosive | Drops egg bombs |
| Pig (Mudslide) | Chaotic | Splashes mud, slows nearby animals |
| Sheep (Shadow Wool) | Protective | Wraps stack in wool shield |
| Goat (Gruff) | Grumpy | Loud bleat stuns nearby fallers |
| Duck (Sir Quacksalot) | Theatrical | Floats down dramatically on feathers |
| Goose (Mother Goose) | Sticky | Creates golden landing zone |
| Rooster (Dawn Caller) | Bossy | Crow attracts animals to center |
| Horse (Haymaker) | Powerful | Summons hay platforms |

## AI Director Design

The YUKA-powered `GameDirector` is not random. It models the player in real time:

- **Skill**: Estimated from catch rate and perfect-catch ratio.
- **Fatigue**: Estimated from time played and miss frequency.
- **Frustration**: Estimated from consecutive misses and life losses.
- **Engagement**: Estimated from combo chains and banking frequency.

Based on these, it chooses a goal state: build pressure, release tension, challenge, mercy, or reward. Each goal influences spawn type, spawn position, animal behavior (seeker, dive, zigzag, evader, floater), and power-up timing.

The intent is that difficulty feels adaptive and fair — not random, not punishing, not trivial.

## Game Modes

| Mode | Intent |
|------|--------|
| Endless | Default. Lives system. Play until game over. Focus on high score. |
| Time Attack | Score pressure without survival pressure. 90 seconds, no lives. |
| Zen | No lives, no time limit. Pure stacking practice. |
| Boss Rush | Boss animals with elevated challenge. High skill ceiling. |

## UI Principles

- HUD stays out of the way during gameplay (score, lives, bank prompt).
- Danger state is communicated through canvas effects (flash, shake), not pop-ups.
- Sound and haptics reinforce every mechanical event.
- All menus are accessible from the game over screen without returning to the main menu.

## Audio Design

- Music has five intensity levels that crossfade based on game state.
- High stack height and active wobble danger increase music intensity.
- Banking and life loss have distinct audio signatures.
- Voice lines (male and female variants) play on notable events.
- All audio is mutable; preference persists via platform storage.
