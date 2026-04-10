# Implementation Plan: Comprehensive E2E Testing

## Overview

This implementation plan creates a comprehensive Playwright E2E test suite for Farm Follies. The approach builds incrementally: first establishing test infrastructure and helpers, then implementing property-based tests for core mechanics, followed by example-based tests for specific scenarios.

## Tasks

- [x] 1. Set up test infrastructure and helpers
  - [x] 1.1 Create test helper module with common utilities
    - Create `e2e/helpers/game-helpers.ts` with skipSplash, startGame, waitForGameInstance functions
    - Create `e2e/helpers/conditions.ts` with wait condition functions (scoreAbove, livesEqual, stackHeightAbove, etc.)
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 1.2 Create enhanced Test Governor implementation
    - Create `e2e/helpers/governor.ts` with configurable catch strategies
    - Implement stats tracking (framesRun, catchAttempts, banksTriggered, abilitiesUsed)
    - Add ability activation support
    - _Requirements: 24.3, 24.4_
  
  - [x] 1.3 Create input generators for property tests
    - Create `e2e/helpers/generators.ts` with position generators, viewport generators
    - Implement seeded random number generation for reproducibility
    - _Requirements: 1.1, 5.1, 6.1_

- [x] 2. Implement collision detection tests
  - [x] 2.1 Implement catch zone collision tests
    - Create `e2e/collision/catching.spec.ts`
    - Test animals caught at various positions within catch zone
    - Test stack height increases on catch
    - Test elevated catch zone with stacked animals
    - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 2.2 Write property test for catch zone collision
    - **Property 1: Catch Zone Collision Detection**
    - **Validates: Requirements 1.1, 1.4, 1.5, 1.6, 1.7**
  
  - [x] 2.3 Implement miss detection tests
    - Create `e2e/collision/missing.spec.ts`
    - Test animals falling past player are removed
    - Test life decrease on miss
    - Test invincibility prevents life loss
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 2.4 Write property test for miss detection
    - **Property 2: Miss Detection and Life Penalty**
    - **Validates: Requirements 2.1, 2.2, 2.3**
  
  - [x] 2.5 Implement power-up collision tests
    - Create `e2e/collision/powerups.spec.ts`
    - Test power-up collection by player
    - Test power-up collection by stacked animals
    - Test uncollected power-ups are removed
    - _Requirements: 3.1, 3.2, 3.9_
  
  - [x] 2.6 Write property test for power-up collision
    - **Property 3: Power-Up Collision and Collection**
    - **Validates: Requirements 3.1, 3.2, 3.9**
  
  - [x] 2.7 Implement bush bounce tests
    - Create `e2e/collision/bushes.spec.ts`
    - Test animal bounce on grown bush
    - Test bush strength degradation
    - Test immature bush no-bounce
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.8 Write property test for bush bounce
    - **Property 4: Bush Bounce Mechanics**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 3. Checkpoint - Ensure collision tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement boundary enforcement tests
  - [x] 4.1 Implement player boundary tests
    - Create `e2e/boundaries/player.spec.ts`
    - Test left boundary enforcement
    - Test right boundary enforcement
    - Test boundary bounce with momentum
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 4.2 Write property test for player boundaries
    - **Property 5: Player Boundary Enforcement**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 4.3 Implement spawn boundary tests
    - Create `e2e/boundaries/spawning.spec.ts`
    - Test animal spawn positions within bounds
    - Test power-up spawn positions within bounds
    - Test entity drift stays within bounds
    - _Requirements: 6.1, 6.4, 7.1, 7.2_
  
  - [x] 4.4 Write property test for spawn boundaries
    - **Property 6: Spawn Position Validity**
    - **Validates: Requirements 6.1, 6.4, 7.1, 7.2**
  
  - [x] 4.5 Implement tornado boundary tests
    - Create `e2e/boundaries/tornado.spec.ts`
    - Test tornado reverses at left edge
    - Test tornado reverses at right edge
    - _Requirements: 6.2, 6.3_
  
  - [x] 4.6 Write property test for tornado boundaries
    - **Property 7: Tornado Boundary Behavior**
    - **Validates: Requirements 6.2, 6.3**

- [x] 5. Implement game state tests
  - [x] 5.1 Implement state lifecycle tests
    - Create `e2e/state/lifecycle.spec.ts`
    - Test splash screen display on load
    - Test splash to menu transition
    - Test menu to game transition
    - Test pause and resume transitions
    - Test game over transition
    - Test play again transition
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  
  - [x] 5.2 Implement pause behavior tests
    - Create `e2e/state/pause.spec.ts`
    - Test no spawning during pause
    - Test animals frozen during pause
    - Test score frozen during pause
    - Test timers frozen during pause
    - Test state preserved through pause/resume
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 5.3 Write property test for pause freeze
    - **Property 8: Pause State Freeze**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 6. Checkpoint - Ensure state tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement scoring system tests
  - [x] 7.1 Implement point calculation tests
    - Create `e2e/scoring/points.spec.ts`
    - Test base points per animal type
    - Test perfect catch bonus
    - Test double points multiplier
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [x] 7.2 Write property test for score calculation
    - **Property 9: Score Calculation Consistency**
    - **Validates: Requirements 10.1, 10.2, 10.5**
  
  - [x] 7.3 Implement combo tests
    - Create `e2e/scoring/combos.spec.ts`
    - Test combo increases on consecutive catches
    - Test combo decay on timeout
    - Test combo reset on miss
    - _Requirements: 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5_
  
  - [x] 7.4 Write property test for combo mechanics
    - **Property 10: Combo Mechanics**
    - **Validates: Requirements 10.3, 10.4, 30.1, 30.2, 30.3, 30.4, 30.5**
  
  - [x] 7.5 Implement high score persistence tests
    - Create `e2e/scoring/highscore.spec.ts`
    - Test new high score saved
    - Test high score restored on reload
    - Test lower score doesn't overwrite
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [x] 7.6 Write property test for high score persistence
    - **Property 11: High Score Persistence Round-Trip**
    - **Validates: Requirements 11.1, 11.2, 11.3**
  
  - [x] 7.7 Implement banking tests
    - Create `e2e/scoring/banking.spec.ts`
    - Test bank disabled below threshold
    - Test bank enabled at threshold
    - Test bank clears stack
    - Test bank increases count
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 7.8 Write property test for banking mechanics
    - **Property 12: Banking Threshold and Mechanics**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

- [x] 8. Implement physics tests
  - [x] 8.1 Implement wobble physics tests
    - Create `e2e/physics/wobble.spec.ts`
    - Test wobble increases with movement
    - Test wobble increases with stack height
    - Test wobble warning state
    - Test wobble collapse
    - Test wobble decay when stationary
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_
  
  - [x] 8.2 Write property test for wobble physics
    - **Property 13: Wobble Physics Behavior**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**

- [x] 9. Checkpoint - Ensure scoring and physics tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement input handling tests
  - [x] 10.1 Implement mouse input tests
    - Create `e2e/input/mouse.spec.ts`
    - Test player follows mouse drag
    - Test momentum on drag release
    - Test drag end on canvas leave
    - _Requirements: 15.1, 15.4, 15.5_
  
  - [x] 10.2 Implement touch input tests
    - Create `e2e/input/touch.spec.ts`
    - Test player follows touch drag
    - Test ability activation on tap
    - _Requirements: 15.2, 15.3_
  
  - [x] 10.3 Write property test for input handling
    - **Property 14: Input Position Tracking**
    - **Validates: Requirements 15.1, 15.2, 15.4**
  
  - [x] 10.4 Implement keyboard input tests
    - Create `e2e/input/keyboard.spec.ts`
    - Test left arrow moves left
    - Test right arrow moves right
    - Test A key moves left
    - Test D key moves right
    - Test both keys = stationary
    - Test key release stops movement
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 11. Implement ability tests
  - [x] 11.1 Implement ability activation tests
    - Create `e2e/abilities/activation.spec.ts`
    - Test poop_shot projectile launch
    - Test egg_bomb clears animals
    - Test mud_splash creates slow zone
    - Test wool_shield invincibility
    - Test bleat_stun freezes animals
    - Test feather_float slow fall
    - Test honey_trap centering
    - Test crow_call magnetic pull
    - Test hay_storm platforms
    - Test ability cooldown
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11, 14.12_

- [x] 12. Implement progression tests
  - [x] 12.1 Implement level progression tests
    - Create `e2e/progression/levels.spec.ts`
    - Test level increases at threshold
    - Test spawn interval decreases
    - Test special variant chance increases
    - Test level cap
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_
  
  - [x] 12.2 Write property test for level progression
    - **Property 15: Level Progression Scaling**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**
  
  - [x] 12.3 Implement achievement tests
    - Create `e2e/progression/achievements.spec.ts`
    - Test first catch achievement
    - Test score achievements
    - Test stack achievements
    - Test perfect catch achievements
    - Test banking achievements
    - Test achievement persistence
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_
  
  - [x] 12.4 Implement game mode tests
    - Create `e2e/progression/modes.spec.ts`
    - Test Endless mode has lives
    - Test Time Attack timer
    - Test Zen mode no life loss
    - Test mode unlock conditions
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

- [x] 13. Checkpoint - Ensure input, ability, and progression tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement coverage tests
  - [x] 14.1 Implement animal type coverage tests
    - Create `e2e/coverage/animals.spec.ts`
    - Test all 9 animal types spawn over time
    - Test special variants spawn at higher levels
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9, 28.10_
  
  - [x] 14.2 Write property test for animal coverage
    - **Property 18: Animal Type Spawn Coverage**
    - **Validates: Requirements 28.1-28.10**
  
  - [x] 14.3 Implement power-up type coverage tests
    - Create `e2e/coverage/powerups.spec.ts`
    - Test all 6 power-up types spawn over time
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6_
  
  - [x] 14.4 Write property test for power-up coverage
    - **Property 19: Power-Up Type Spawn Coverage**
    - **Validates: Requirements 29.1-29.6**

- [x] 15. Implement persistence tests
  - [x] 15.1 Implement data persistence tests
    - Create `e2e/persistence/storage.spec.ts`
    - Test stats save and restore
    - Test achievements persist
    - Test game modes persist
    - Test high score persists
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_
  
  - [x] 15.2 Write property test for data persistence
    - **Property 17: Data Persistence Round-Trip**
    - **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**

- [x] 16. Implement stability tests
  - [x] 16.1 Implement runtime stability tests
    - Create `e2e/stability/runtime.spec.ts`
    - Test no JS errors during gameplay
    - Test no uncaught exceptions
    - Test sustained play without corruption
    - Test rapid input without crashes
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_
  
  - [x] 16.2 Write property test for runtime stability
    - **Property 16: Runtime Stability**
    - **Validates: Requirements 24.1, 24.2, 24.3, 24.4, 24.5**

- [x] 17. Implement UI tests
  - [x] 17.1 Implement UI component visibility tests
    - Create `e2e/ui/components.spec.ts`
    - Test main menu buttons visible
    - Test gameplay HUD visible
    - Test pause menu buttons visible
    - Test gameplay hint visible
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 25.9, 25.10_
  
  - [x] 17.2 Implement responsive scaling tests
    - Create `e2e/ui/responsive.spec.ts`
    - Test mobile viewport
    - Test tablet viewport
    - Test desktop viewport
    - Test touch-action prevention
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [x] 17.3 Implement tutorial tests
    - Create `e2e/ui/tutorial.spec.ts`
    - Test tutorial shows for new player
    - Test tutorial completion persists
    - Test tutorial skipped for returning player
    - _Requirements: 26.1, 26.2, 26.3, 26.4_

- [x] 18. Implement audio tests
  - [x] 18.1 Implement audio trigger tests
    - Create `e2e/audio/triggers.spec.ts`
    - Test land sound on catch
    - Test perfect sound on perfect catch
    - Test miss sound on miss
    - Test topple sound on collapse
    - Test powerup sound on collection
    - Test bank sound on banking
    - Test levelup sound on level up
    - Test lifeup sound on life earned
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8_
  
  - [x] 18.2 Implement audio control tests
    - Create `e2e/audio/controls.spec.ts`
    - Test sound toggle mutes/unmutes
    - _Requirements: 17.9_

- [x] 19. Implement lives system tests
  - [x] 19.1 Implement lives management tests
    - Create `e2e/lives/management.spec.ts`
    - Test starting lives is 3
    - Test life decrease on miss
    - Test game over at 0 lives
    - Test max lives cap
    - Test invincibility protection
    - Test perfect streak bonus life
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [x] 20. Implement tornado tests
  - [x] 20.1 Implement tornado behavior tests
    - Create `e2e/tornado/behavior.spec.ts`
    - Test tornado appears at top
    - Test tornado oscillates horizontally
    - Test spawn animation plays
    - Test tornado intensity increases with level
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive testing coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Example tests validate specific scenarios and edge cases
- The test suite uses the existing `window.__game.getTestSnapshot()` API exposed in dev mode
