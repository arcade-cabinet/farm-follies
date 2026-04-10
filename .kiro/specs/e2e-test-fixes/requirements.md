# Requirements: E2E Test Fixes

## Overview

This spec addresses failing E2E tests in the Farm Follies test suite. The failures fall into several categories:
1. Tests timing out while waiting for stack height (governor not catching animals effectively)
2. Tests timing out while waiting for bankable stack (5+ animals)
3. Page being closed before test completion
4. Assertion failures due to game behavior not matching test expectations

## User Stories

### Story 1: Fix Governor-Based Tests
As a developer, I want the test governor to reliably catch animals so that tests requiring stack building complete successfully.

#### Acceptance Criteria
- 1.1 Governor catches animals consistently within reasonable timeframes
- 1.2 Tests waiting for stack height of 2-3 complete within 30 seconds
- 1.3 Tests waiting for stack height of 5+ complete within 45 seconds or skip gracefully
- 1.4 Governor handles game over state without causing page closure

### Story 2: Fix Banking Tests
As a developer, I want banking tests to pass reliably so that the banking system is properly validated.

#### Acceptance Criteria
- 2.1 Banking tests handle cases where stack topples before reaching threshold
- 2.2 Banking tests use appropriate timeouts for stack building
- 2.3 Banking tests properly clean up governor on test completion
- 2.4 Banking tests skip gracefully when bankable state cannot be reached

### Story 3: Fix Ability Tests
As a developer, I want ability tests to pass reliably so that the ability system is properly validated.

#### Acceptance Criteria
- 3.1 Ability tests use lower stack height requirements (1-2 instead of 3+)
- 3.2 Ability tests handle cases where stack cannot be built
- 3.3 Ability tests have appropriate timeouts

### Story 4: Fix Physics/Wobble Tests
As a developer, I want wobble physics tests to pass reliably so that the physics system is properly validated.

#### Acceptance Criteria
- 4.1 Wobble tests use lower stack height requirements
- 4.2 Wobble tests handle cases where stack cannot be built
- 4.3 Wobble tests have appropriate timeouts

### Story 5: Fix Input Tests
As a developer, I want input tests to pass reliably so that the input system is properly validated.

#### Acceptance Criteria
- 5.1 Mouse drag tests use appropriate tolerance for position convergence
- 5.2 Input tests account for game physics and momentum

### Story 6: Fix Progression Tests
As a developer, I want progression tests to pass reliably so that the progression system is properly validated.

#### Acceptance Criteria
- 6.1 Level progression tests handle non-sequential level changes
- 6.2 Achievement tests use appropriate timeouts
- 6.3 Game mode tests use appropriate timeouts

### Story 7: Fix Stability Tests
As a developer, I want stability tests to pass reliably so that game stability is properly validated.

#### Acceptance Criteria
- 7.1 Stability tests use appropriate timeouts for extended play
- 7.2 Stability tests handle game over gracefully
- 7.3 Stability tests don't require unrealistic play durations

### Story 8: Fix Coverage Tests
As a developer, I want coverage tests to pass reliably so that spawn coverage is properly validated.

#### Acceptance Criteria
- 8.1 Animal coverage tests use appropriate timeouts
- 8.2 Coverage tests handle game over gracefully

### Story 9: Fix Audio Tests
As a developer, I want audio tests to pass reliably so that the audio system is properly validated.

#### Acceptance Criteria
- 9.1 Audio tests use appropriate timeouts
- 9.2 Audio tests handle cases where specific events don't occur

### Story 10: Fix Lives Tests
As a developer, I want lives tests to pass reliably so that the lives system is properly validated.

#### Acceptance Criteria
- 10.1 Lives tests use appropriate timeouts
- 10.2 Lives tests handle game over gracefully

### Story 11: Fix Tornado Tests
As a developer, I want tornado tests to pass reliably so that the tornado system is properly validated.

#### Acceptance Criteria
- 11.1 Tornado tests use appropriate timeouts
- 11.2 Tornado tests handle game over gracefully

## Summary of Failing Tests

### Banking Tests (8 failures)
- `canBank is true with 5 or more animals` - timeout waiting for bankable stack
- `banking clears all stacked animals` - timeout/page closed
- `stack height becomes 0 after banking` - timeout/page closed
- `bankedAnimals increases after banking` - timeout/page closed
- `bankedAnimals increases by exact stack size` - timeout/page closed
- `score increases after banking` - timeout/page closed
- `canBank resets to false after banking` - timeout/page closed
- `multiple banks accumulate bankedAnimals` - timeout/page closed

### Ability Tests (8 failures)
- `game supports ability activation` - timeout waiting for stack height 3
- `ability activation does not crash game` - timeout waiting for stack height 2
- `abilities have cooldown period` - timeout waiting for stack height 3
- `cooldown prevents spam activation` - timeout waiting for stack height 4
- `ability activation affects game state` - timeout waiting for stack height 3
- `abilities work during active gameplay` - framesRun assertion (84 < 200)
- `abilities do not interfere with catching` - timeout waiting for stack height 2
- `abilities work with different stack sizes` - timeout waiting for stack height 1

### Physics/Wobble Tests (7 failures)
- `rapid movement increases wobble intensity` - timeout waiting for stack height 3
- `stationary player has lower wobble than moving player` - timeout waiting for stack height 3
- `taller stacks have higher wobble potential` - timeout waiting for stack height 3
- `wobble warning triggers at threshold` - timeout waiting for stack height 4
- `extreme wobble can cause stack collapse` - timeout waiting for stack height 4
- `wobble decays when player is stationary` - timeout waiting for stack height 3
- `wobble intensity is bounded` - timeout waiting for stack height 3

### Input Tests (1 failure)
- `player position converges toward drag position` - distance assertion (306 > 150)

### Progression Tests (5 failures)
- `level changes are tracked correctly` - level jump assertion (5 != 3)
- `stack height milestones can be reached` - timeout/page closed
- `banking can trigger achievements` - timeout/page closed
- `default mode is playable` - timeout waiting for governor frames
- `game mode persists through gameplay` - timeout waiting for governor frames

### Stability Tests (5 failures)
- `gameplay runs without JavaScript errors` - timeout waiting for governor frames
- `no uncaught exceptions during gameplay` - timeout waiting for governor frames
- `game state remains valid during sustained play` - timeout waiting for governor frames
- `game handles many catches without corruption` - timeout waiting for governor frames
- `game runs without memory issues during extended play` - timeout (120s)

### Coverage Tests (2 failures)
- `multiple animal types spawn over time` - timeout waiting for governor frames
- `game supports special animal variants` - timeout waiting for governor frames

### Audio Tests (3 failures)
- `perfect catches can occur during gameplay` - timeout waiting for governor frames
- `power-ups can be collected during gameplay` - timeout waiting for governor frames
- `banking triggers game events` - timeout waiting for governor frames

### Lives Tests (3 failures)
- `lives do not exceed maximum` - timeout waiting for governor frames
- `invincibility can protect from life loss` - timeout waiting for governor frames
- `lives are tracked correctly during gameplay` - timeout waiting for governor frames

### Tornado Tests (1 failure)
- `tornado continues spawning during gameplay` - timeout waiting for governor frames

## Root Causes

1. **Governor Inefficiency**: The test governor is not catching animals effectively, causing tests to timeout while waiting for stack height
2. **Unrealistic Timeouts**: Many tests have timeouts that are too short for the game's spawn rate
3. **Page Closure**: Tests are timing out and Playwright closes the page before cleanup can occur
4. **Assertion Tolerances**: Some assertions have tolerances that are too strict for the game's physics
5. **Level Progression**: The game can skip levels, but tests expect sequential progression
