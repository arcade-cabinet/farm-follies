# Requirements Document

## Introduction

This document defines comprehensive end-to-end testing requirements for Farm Follies, a physics-based stacking arcade game. The testing suite will validate every testable aspect of the game including collision detection, boundary enforcement, game state transitions, scoring mechanics, power-up effects, physics systems, input handling, audio triggers, achievement tracking, persistence, and cross-platform behavior.

## Glossary

- **E2E_Test_Suite**: The Playwright-based end-to-end testing system that validates game behavior through browser automation
- **Game_Canvas**: The HTML Canvas element where all game rendering occurs
- **Player_Entity**: The farmer character controlled by the user that catches and stacks animals
- **Animal_Entity**: Falling barnyard animals (9 types: chicken, duck, pig, sheep, goat, cow, goose, horse, rooster) that players catch
- **Stack**: The tower of caught animals balanced on the farmer's head
- **Catch_Zone**: The collision detection area above the player/stack where animals can be caught
- **Power_Up**: Collectible items that grant temporary abilities (hay_bale, golden_egg, water_trough, salt_lick, corn_feed, lucky_horseshoe)
- **Tornado**: The spawning entity that moves along the top of the screen and releases animals
- **Wobble_System**: Physics simulation that causes the stack to sway based on movement and stack height
- **Banking_System**: Mechanism to secure stacked animals for points before they topple
- **Game_Director**: YUKA-powered AI that adapts spawn timing and difficulty based on player performance
- **Test_Governor**: Automated player controller injected via Playwright that simulates gameplay
- **Viewport**: The visible game area that scales responsively across devices

## Requirements

### Requirement 1: Collision Detection - Animal Catching

**User Story:** As a QA engineer, I want to verify all animal-to-player collision scenarios, so that I can ensure animals are caught correctly in all positions.

#### Acceptance Criteria

1. WHEN an Animal_Entity falls into the Catch_Zone directly above the Player_Entity THEN the E2E_Test_Suite SHALL detect that the animal is added to the Stack
2. WHEN an Animal_Entity falls into the Catch_Zone at the left edge of the Player_Entity THEN the E2E_Test_Suite SHALL verify the catch registers with "left" position
3. WHEN an Animal_Entity falls into the Catch_Zone at the right edge of the Player_Entity THEN the E2E_Test_Suite SHALL verify the catch registers with "right" position
4. WHEN an Animal_Entity falls into the center of the Catch_Zone THEN the E2E_Test_Suite SHALL verify a "perfect" catch is registered
5. WHEN the Stack contains animals and a new Animal_Entity falls onto the stack top THEN the E2E_Test_Suite SHALL verify the catch occurs at the elevated stack position
6. WHEN multiple Animal_Entities fall simultaneously into the Catch_Zone THEN the E2E_Test_Suite SHALL verify each animal is caught in sequence
7. WHEN an Animal_Entity falls outside the Catch_Zone horizontally THEN the E2E_Test_Suite SHALL verify the animal is not caught

### Requirement 2: Collision Detection - Animal Missing

**User Story:** As a QA engineer, I want to verify missed animal detection, so that I can ensure the game correctly handles uncaught animals.

#### Acceptance Criteria

1. WHEN an Animal_Entity falls past the Player_Entity bottom boundary THEN the E2E_Test_Suite SHALL verify the animal is removed and a miss is registered
2. WHEN an Animal_Entity is missed THEN the E2E_Test_Suite SHALL verify the lives count decreases by one
3. WHEN an Animal_Entity is missed WHILE the Player_Entity is invincible THEN the E2E_Test_Suite SHALL verify no life is lost
4. WHEN the last life is lost from a miss THEN the E2E_Test_Suite SHALL verify the game transitions to game_over state

### Requirement 3: Collision Detection - Power-Up Collection

**User Story:** As a QA engineer, I want to verify power-up collision detection, so that I can ensure all power-ups are collectible.

#### Acceptance Criteria

1. WHEN a Power_Up falls into collision range of the Player_Entity THEN the E2E_Test_Suite SHALL verify the power-up is collected
2. WHEN a Power_Up falls into collision range of a stacked Animal_Entity THEN the E2E_Test_Suite SHALL verify the power-up is collected
3. WHEN a hay_bale Power_Up is collected THEN the E2E_Test_Suite SHALL verify lives increase by one
4. WHEN a golden_egg Power_Up is collected THEN the E2E_Test_Suite SHALL verify double points mode activates for 8 seconds
5. WHEN a water_trough Power_Up is collected THEN the E2E_Test_Suite SHALL verify magnet mode activates for 5 seconds
6. WHEN a salt_lick Power_Up is collected THEN the E2E_Test_Suite SHALL verify full hearts restore and invincibility activates for 3 seconds
7. WHEN a corn_feed Power_Up is collected with 3+ animals stacked THEN the E2E_Test_Suite SHALL verify stack merges into bank
8. WHEN a lucky_horseshoe Power_Up is collected THEN the E2E_Test_Suite SHALL verify max hearts increases by one
9. WHEN a Power_Up falls past the Player_Entity without collision THEN the E2E_Test_Suite SHALL verify the power-up is removed without effect

### Requirement 4: Collision Detection - Bush Bouncing

**User Story:** As a QA engineer, I want to verify bush bounce mechanics, so that I can ensure animals bounce correctly off bushes.

#### Acceptance Criteria

1. WHEN an Animal_Entity falls onto a fully grown bush THEN the E2E_Test_Suite SHALL verify the animal bounces upward
2. WHEN an Animal_Entity bounces off a bush THEN the E2E_Test_Suite SHALL verify horizontal velocity variation is applied
3. WHEN a bush is bounced on THEN the E2E_Test_Suite SHALL verify the bush bounce strength decreases
4. WHEN a bush growth stage is below 0.5 THEN the E2E_Test_Suite SHALL verify no bounce occurs
5. WHEN a bush exceeds its maximum lifetime THEN the E2E_Test_Suite SHALL verify the bush is removed

### Requirement 5: Boundary Enforcement - Player Movement

**User Story:** As a QA engineer, I want to verify player movement boundaries, so that I can ensure the farmer cannot move outside the playable area.

#### Acceptance Criteria

1. WHEN the Player_Entity is dragged to the left edge of the Viewport THEN the E2E_Test_Suite SHALL verify the player stops at the minimum X boundary
2. WHEN the Player_Entity is dragged to the right edge (before bank area) THEN the E2E_Test_Suite SHALL verify the player stops at the maximum X boundary
3. WHEN the Player_Entity reaches a boundary with momentum THEN the E2E_Test_Suite SHALL verify the player bounces back with reduced velocity
4. WHEN keyboard left arrow is held at the left boundary THEN the E2E_Test_Suite SHALL verify the player remains at the boundary
5. WHEN keyboard right arrow is held at the right boundary THEN the E2E_Test_Suite SHALL verify the player remains at the boundary

### Requirement 6: Boundary Enforcement - Animal Spawning

**User Story:** As a QA engineer, I want to verify animal spawn boundaries, so that I can ensure animals spawn within valid positions.

#### Acceptance Criteria

1. WHEN the Tornado spawns an Animal_Entity THEN the E2E_Test_Suite SHALL verify the spawn X position is within the playable width
2. WHEN the Tornado reaches the left edge of the Viewport THEN the E2E_Test_Suite SHALL verify it reverses direction
3. WHEN the Tornado reaches the right edge (before bank area) THEN the E2E_Test_Suite SHALL verify it reverses direction
4. WHEN an Animal_Entity drifts horizontally during fall THEN the E2E_Test_Suite SHALL verify it remains within screen bounds

### Requirement 7: Boundary Enforcement - Power-Up Spawning

**User Story:** As a QA engineer, I want to verify power-up spawn boundaries, so that I can ensure power-ups spawn in reachable positions.

#### Acceptance Criteria

1. WHEN a Power_Up spawns THEN the E2E_Test_Suite SHALL verify the spawn position is within the playable area
2. WHEN a Power_Up falls THEN the E2E_Test_Suite SHALL verify it remains within horizontal screen bounds

### Requirement 8: Game State Transitions - Game Lifecycle

**User Story:** As a QA engineer, I want to verify game state transitions, so that I can ensure the game flows correctly between states.

#### Acceptance Criteria

1. WHEN the application loads THEN the E2E_Test_Suite SHALL verify the splash screen displays
2. WHEN the splash screen is clicked THEN the E2E_Test_Suite SHALL verify transition to main menu
3. WHEN the PLAY button is clicked THEN the E2E_Test_Suite SHALL verify transition to playing state
4. WHEN the pause button is clicked during gameplay THEN the E2E_Test_Suite SHALL verify transition to paused state
5. WHEN RESUME is clicked from pause menu THEN the E2E_Test_Suite SHALL verify transition back to playing state
6. WHEN QUIT TO MENU is clicked from pause menu THEN the E2E_Test_Suite SHALL verify transition to main menu
7. WHEN all lives are lost THEN the E2E_Test_Suite SHALL verify transition to game_over state
8. WHEN PLAY AGAIN is clicked from game over screen THEN the E2E_Test_Suite SHALL verify a new game starts

### Requirement 9: Game State Transitions - Pause Behavior

**User Story:** As a QA engineer, I want to verify pause functionality, so that I can ensure the game properly freezes during pause.

#### Acceptance Criteria

1. WHILE the game is paused THEN the E2E_Test_Suite SHALL verify no animals spawn
2. WHILE the game is paused THEN the E2E_Test_Suite SHALL verify falling animals do not move
3. WHILE the game is paused THEN the E2E_Test_Suite SHALL verify the score does not change
4. WHILE the game is paused THEN the E2E_Test_Suite SHALL verify power-up timers do not decrement
5. WHEN the game is resumed THEN the E2E_Test_Suite SHALL verify gameplay continues from the paused state

### Requirement 10: Scoring System - Point Calculation

**User Story:** As a QA engineer, I want to verify scoring calculations, so that I can ensure points are awarded correctly.

#### Acceptance Criteria

1. WHEN an Animal_Entity is caught THEN the E2E_Test_Suite SHALL verify base points are awarded based on animal type
2. WHEN a perfect catch occurs THEN the E2E_Test_Suite SHALL verify bonus points are awarded
3. WHEN consecutive catches occur THEN the E2E_Test_Suite SHALL verify combo multiplier increases
4. WHEN the combo timer expires without a catch THEN the E2E_Test_Suite SHALL verify combo resets to zero
5. WHEN double points power-up is active THEN the E2E_Test_Suite SHALL verify points are doubled
6. WHEN animals are banked THEN the E2E_Test_Suite SHALL verify bank bonus points are awarded based on stack size

### Requirement 11: Scoring System - High Score Persistence

**User Story:** As a QA engineer, I want to verify high score persistence, so that I can ensure scores are saved correctly.

#### Acceptance Criteria

1. WHEN a game ends with a new high score THEN the E2E_Test_Suite SHALL verify the high score is updated in storage
2. WHEN the application reloads THEN the E2E_Test_Suite SHALL verify the high score is restored from storage
3. WHEN a game ends below the high score THEN the E2E_Test_Suite SHALL verify the high score remains unchanged

### Requirement 12: Banking System

**User Story:** As a QA engineer, I want to verify the banking system, so that I can ensure animals can be banked correctly.

#### Acceptance Criteria

1. WHEN the Stack contains fewer than 5 animals THEN the E2E_Test_Suite SHALL verify the bank button is disabled
2. WHEN the Stack contains 5 or more animals THEN the E2E_Test_Suite SHALL verify the bank button is enabled
3. WHEN the bank button is clicked with sufficient stack THEN the E2E_Test_Suite SHALL verify all stacked animals are banked
4. WHEN animals are banked THEN the E2E_Test_Suite SHALL verify the Stack is cleared
5. WHEN animals are banked THEN the E2E_Test_Suite SHALL verify the banked animal count increases

### Requirement 13: Wobble Physics System

**User Story:** As a QA engineer, I want to verify wobble physics, so that I can ensure stack stability behaves correctly.

#### Acceptance Criteria

1. WHEN the Player_Entity moves rapidly THEN the E2E_Test_Suite SHALL verify wobble intensity increases
2. WHEN the Stack height increases THEN the E2E_Test_Suite SHALL verify wobble amplitude increases
3. WHEN wobble exceeds the warning threshold THEN the E2E_Test_Suite SHALL verify danger state is indicated
4. WHEN wobble exceeds the collapse threshold THEN the E2E_Test_Suite SHALL verify the stack topples
5. WHEN the stack topples THEN the E2E_Test_Suite SHALL verify a life is lost
6. WHEN the stack topples THEN the E2E_Test_Suite SHALL verify all stacked animals are cleared
7. WHEN the Player_Entity stops moving THEN the E2E_Test_Suite SHALL verify wobble gradually decreases

### Requirement 14: Special Animal Abilities

**User Story:** As a QA engineer, I want to verify special animal abilities, so that I can ensure each ability functions correctly.

#### Acceptance Criteria

1. WHEN a special cow's poop_shot ability is activated THEN the E2E_Test_Suite SHALL verify a projectile is launched
2. WHEN a poop_shot projectile lands THEN the E2E_Test_Suite SHALL verify a bush grows at that location
3. WHEN a special chicken's egg_bomb ability is activated THEN the E2E_Test_Suite SHALL verify nearby falling animals are cleared
4. WHEN a special pig's mud_splash ability is activated THEN the E2E_Test_Suite SHALL verify a slow zone is created
5. WHEN a special sheep's wool_shield ability is activated THEN the E2E_Test_Suite SHALL verify stack becomes invincible
6. WHEN a special goat's bleat_stun ability is activated THEN the E2E_Test_Suite SHALL verify nearby falling animals are stunned
7. WHEN a special duck with feather_float falls THEN the E2E_Test_Suite SHALL verify fall speed is reduced to 30%
8. WHEN a special goose's honey_trap ability is activated THEN the E2E_Test_Suite SHALL verify catches are centered
9. WHEN a special rooster's crow_call ability is activated THEN the E2E_Test_Suite SHALL verify falling animals drift toward player
10. WHEN a special horse's hay_storm ability is activated THEN the E2E_Test_Suite SHALL verify hay platforms spawn
11. WHEN an ability is used THEN the E2E_Test_Suite SHALL verify cooldown timer starts
12. WHILE an ability is on cooldown THEN the E2E_Test_Suite SHALL verify the ability cannot be reactivated

### Requirement 15: Input Handling - Touch and Mouse

**User Story:** As a QA engineer, I want to verify input handling, so that I can ensure controls work correctly across input methods.

#### Acceptance Criteria

1. WHEN a mouse drag occurs on the Game_Canvas THEN the E2E_Test_Suite SHALL verify the Player_Entity follows the drag position
2. WHEN a touch drag occurs on the Game_Canvas THEN the E2E_Test_Suite SHALL verify the Player_Entity follows the touch position
3. WHEN a tap occurs on a stacked special animal THEN the E2E_Test_Suite SHALL verify the ability is triggered
4. WHEN a drag ends with velocity THEN the E2E_Test_Suite SHALL verify momentum is applied to player movement
5. WHEN the pointer leaves the Game_Canvas during drag THEN the E2E_Test_Suite SHALL verify the drag ends gracefully

### Requirement 16: Input Handling - Keyboard

**User Story:** As a QA engineer, I want to verify keyboard input, so that I can ensure keyboard controls work correctly.

#### Acceptance Criteria

1. WHEN the left arrow key is pressed THEN the E2E_Test_Suite SHALL verify the Player_Entity moves left
2. WHEN the right arrow key is pressed THEN the E2E_Test_Suite SHALL verify the Player_Entity moves right
3. WHEN the A key is pressed THEN the E2E_Test_Suite SHALL verify the Player_Entity moves left
4. WHEN the D key is pressed THEN the E2E_Test_Suite SHALL verify the Player_Entity moves right
5. WHEN both left and right keys are pressed THEN the E2E_Test_Suite SHALL verify the Player_Entity remains stationary
6. WHEN a movement key is released THEN the E2E_Test_Suite SHALL verify movement stops

### Requirement 17: Audio System Triggers

**User Story:** As a QA engineer, I want to verify audio triggers, so that I can ensure sounds play at appropriate times.

#### Acceptance Criteria

1. WHEN an animal is caught THEN the E2E_Test_Suite SHALL verify the land sound is triggered
2. WHEN a perfect catch occurs THEN the E2E_Test_Suite SHALL verify the perfect sound is triggered
3. WHEN an animal is missed THEN the E2E_Test_Suite SHALL verify the miss sound is triggered
4. WHEN the stack topples THEN the E2E_Test_Suite SHALL verify the topple sound is triggered
5. WHEN a power-up is collected THEN the E2E_Test_Suite SHALL verify the powerup sound is triggered
6. WHEN animals are banked THEN the E2E_Test_Suite SHALL verify the bank sound is triggered
7. WHEN a level up occurs THEN the E2E_Test_Suite SHALL verify the levelup sound is triggered
8. WHEN a life is earned THEN the E2E_Test_Suite SHALL verify the lifeup sound is triggered
9. WHEN the sound toggle is clicked THEN the E2E_Test_Suite SHALL verify the mute state toggles

### Requirement 18: Achievement System

**User Story:** As a QA engineer, I want to verify achievement tracking, so that I can ensure achievements unlock correctly.

#### Acceptance Criteria

1. WHEN the first animal is caught THEN the E2E_Test_Suite SHALL verify the "First Catch" achievement unlocks
2. WHEN score reaches 100 THEN the E2E_Test_Suite SHALL verify the "Century" achievement unlocks
3. WHEN score reaches 1000 THEN the E2E_Test_Suite SHALL verify the "High Roller" achievement unlocks
4. WHEN 5 animals are stacked THEN the E2E_Test_Suite SHALL verify the "Tower of Five" achievement unlocks
5. WHEN 10 perfect catches are accumulated THEN the E2E_Test_Suite SHALL verify the "Sharp Eye" achievement unlocks
6. WHEN 5 consecutive perfect catches occur THEN the E2E_Test_Suite SHALL verify the "Precision" achievement unlocks
7. WHEN 10 animals are banked total THEN the E2E_Test_Suite SHALL verify the "Safe Keeper" achievement unlocks
8. WHEN achievements are unlocked THEN the E2E_Test_Suite SHALL verify they persist across sessions

### Requirement 19: Level Progression

**User Story:** As a QA engineer, I want to verify level progression, so that I can ensure difficulty scales correctly.

#### Acceptance Criteria

1. WHEN the level threshold score is reached THEN the E2E_Test_Suite SHALL verify level increases
2. WHEN level increases THEN the E2E_Test_Suite SHALL verify spawn interval decreases
3. WHEN level increases THEN the E2E_Test_Suite SHALL verify special variant spawn chance increases
4. WHEN level increases THEN the E2E_Test_Suite SHALL verify heavier animals spawn more frequently
5. WHEN maximum level is reached THEN the E2E_Test_Suite SHALL verify level stops increasing

### Requirement 20: Responsive Scaling

**User Story:** As a QA engineer, I want to verify responsive scaling, so that I can ensure the game works across viewport sizes.

#### Acceptance Criteria

1. WHEN the Viewport is mobile-sized (375x812) THEN the E2E_Test_Suite SHALL verify the Game_Canvas renders correctly
2. WHEN the Viewport is tablet-sized (768x1024) THEN the E2E_Test_Suite SHALL verify the Game_Canvas renders correctly
3. WHEN the Viewport is desktop-sized (1920x1080) THEN the E2E_Test_Suite SHALL verify the Game_Canvas renders correctly
4. WHEN the Viewport is resized during gameplay THEN the E2E_Test_Suite SHALL verify game elements scale appropriately
5. WHEN the Viewport has touch-action:none THEN the E2E_Test_Suite SHALL verify browser gestures are prevented

### Requirement 21: Game Modes

**User Story:** As a QA engineer, I want to verify game mode behavior, so that I can ensure each mode functions correctly.

#### Acceptance Criteria

1. WHEN Endless mode is selected THEN the E2E_Test_Suite SHALL verify lives system is active
2. WHEN Time Attack mode is unlocked and selected THEN the E2E_Test_Suite SHALL verify 90-second timer starts
3. WHEN Time Attack timer expires THEN the E2E_Test_Suite SHALL verify game ends
4. WHEN Zen mode is unlocked and selected THEN the E2E_Test_Suite SHALL verify no lives are lost on miss
5. WHEN score reaches 1000 THEN the E2E_Test_Suite SHALL verify Time Attack mode unlocks
6. WHEN 10 games are played THEN the E2E_Test_Suite SHALL verify Zen mode unlocks

### Requirement 22: Lives System

**User Story:** As a QA engineer, I want to verify the lives system, so that I can ensure life management works correctly.

#### Acceptance Criteria

1. WHEN a new game starts THEN the E2E_Test_Suite SHALL verify lives are set to 3
2. WHEN a life is lost THEN the E2E_Test_Suite SHALL verify lives decrease by 1
3. WHEN lives reach 0 THEN the E2E_Test_Suite SHALL verify game over triggers
4. WHEN a hay_bale is collected at max lives THEN the E2E_Test_Suite SHALL verify lives do not exceed max
5. WHEN invincibility is active THEN the E2E_Test_Suite SHALL verify no lives are lost from misses or topples
6. WHEN a perfect streak of 5 is achieved THEN the E2E_Test_Suite SHALL verify a bonus life is earned

### Requirement 23: Tornado Behavior

**User Story:** As a QA engineer, I want to verify tornado behavior, so that I can ensure spawning mechanics work correctly.

#### Acceptance Criteria

1. WHEN the game starts THEN the E2E_Test_Suite SHALL verify the Tornado appears at the top of the screen
2. WHEN the Tornado moves THEN the E2E_Test_Suite SHALL verify it oscillates horizontally
3. WHEN the Tornado spawns an animal THEN the E2E_Test_Suite SHALL verify spawn animation plays
4. WHEN the Game_Director decides to spawn THEN the E2E_Test_Suite SHALL verify the Tornado releases an animal
5. WHEN difficulty increases THEN the E2E_Test_Suite SHALL verify Tornado intensity increases visually

### Requirement 24: Error Handling and Stability

**User Story:** As a QA engineer, I want to verify error handling, so that I can ensure the game remains stable.

#### Acceptance Criteria

1. WHILE gameplay is active THEN the E2E_Test_Suite SHALL verify no JavaScript errors occur
2. WHILE gameplay is active THEN the E2E_Test_Suite SHALL verify no uncaught exceptions occur
3. WHEN sustained automated play occurs for 30 seconds THEN the E2E_Test_Suite SHALL verify no state corruption
4. WHEN rapid input changes occur THEN the E2E_Test_Suite SHALL verify no crashes
5. WHEN the game runs for extended periods THEN the E2E_Test_Suite SHALL verify no memory leaks cause degradation

### Requirement 25: UI Component Visibility

**User Story:** As a QA engineer, I want to verify UI component visibility, so that I can ensure all UI elements display correctly.

#### Acceptance Criteria

1. WHEN the main menu displays THEN the E2E_Test_Suite SHALL verify PLAY button is visible
2. WHEN the main menu displays THEN the E2E_Test_Suite SHALL verify SHOP button is visible
3. WHEN gameplay is active THEN the E2E_Test_Suite SHALL verify score display is visible
4. WHEN gameplay is active THEN the E2E_Test_Suite SHALL verify level display is visible
5. WHEN gameplay is active THEN the E2E_Test_Suite SHALL verify hearts display is visible
6. WHEN gameplay is active THEN the E2E_Test_Suite SHALL verify pause button is visible
7. WHEN gameplay is active THEN the E2E_Test_Suite SHALL verify sound toggle is visible
8. WHEN the stack is empty THEN the E2E_Test_Suite SHALL verify gameplay hint is displayed
9. WHEN the pause menu is open THEN the E2E_Test_Suite SHALL verify RESUME button is visible
10. WHEN the pause menu is open THEN the E2E_Test_Suite SHALL verify QUIT TO MENU button is visible

### Requirement 26: Tutorial System

**User Story:** As a QA engineer, I want to verify tutorial behavior, so that I can ensure new players receive guidance.

#### Acceptance Criteria

1. WHEN a new player starts their first game THEN the E2E_Test_Suite SHALL verify tutorial displays
2. WHEN tutorial is completed THEN the E2E_Test_Suite SHALL verify completion is persisted
3. WHEN a returning player starts a game THEN the E2E_Test_Suite SHALL verify tutorial is skipped
4. WHEN tutorial completion is stored THEN the E2E_Test_Suite SHALL verify it persists across sessions

### Requirement 27: Data Persistence

**User Story:** As a QA engineer, I want to verify data persistence, so that I can ensure player progress is saved.

#### Acceptance Criteria

1. WHEN a game ends THEN the E2E_Test_Suite SHALL verify stats are saved to storage
2. WHEN the application reloads THEN the E2E_Test_Suite SHALL verify stats are restored
3. WHEN achievements unlock THEN the E2E_Test_Suite SHALL verify they persist across sessions
4. WHEN game modes unlock THEN the E2E_Test_Suite SHALL verify they persist across sessions
5. WHEN high score is set THEN the E2E_Test_Suite SHALL verify it persists across sessions

### Requirement 28: Animal Type Coverage

**User Story:** As a QA engineer, I want to verify all animal types spawn and behave correctly, so that I can ensure complete animal coverage.

#### Acceptance Criteria

1. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify chicken animals spawn
2. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify duck animals spawn
3. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify pig animals spawn
4. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify sheep animals spawn
5. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify goat animals spawn
6. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify cow animals spawn
7. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify goose animals spawn
8. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify horse animals spawn
9. WHEN gameplay continues for sufficient time THEN the E2E_Test_Suite SHALL verify rooster animals spawn
10. WHEN level increases THEN the E2E_Test_Suite SHALL verify special variant animals spawn

### Requirement 29: Power-Up Type Coverage

**User Story:** As a QA engineer, I want to verify all power-up types spawn and function correctly, so that I can ensure complete power-up coverage.

#### Acceptance Criteria

1. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify hay_bale power-ups appear
2. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify golden_egg power-ups appear
3. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify water_trough power-ups appear
4. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify salt_lick power-ups appear
5. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify corn_feed power-ups appear
6. WHEN power-ups spawn over time THEN the E2E_Test_Suite SHALL verify lucky_horseshoe power-ups appear

### Requirement 30: Combo System

**User Story:** As a QA engineer, I want to verify combo mechanics, so that I can ensure combo scoring works correctly.

#### Acceptance Criteria

1. WHEN consecutive catches occur within the combo window THEN the E2E_Test_Suite SHALL verify combo counter increases
2. WHEN combo is active THEN the E2E_Test_Suite SHALL verify score multiplier increases
3. WHEN the combo timer expires THEN the E2E_Test_Suite SHALL verify combo resets to zero
4. WHEN a miss occurs THEN the E2E_Test_Suite SHALL verify combo resets to zero
5. WHEN maximum combo multiplier is reached THEN the E2E_Test_Suite SHALL verify multiplier caps at maximum
