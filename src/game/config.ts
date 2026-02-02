/**
 * Farm Follies Configuration
 * Central place for all game constants and tuning parameters
 */

export const GAME_INFO = {
  title: "Farm Follies",
  shortTitle: "Farm Follies",
  tagline: "Monday morning. Tornado warning. Total chaos.",
  subtitle: "Catch 'em before they scatter!",
} as const;

// Animal types for spawning
export type AnimalType =
  | "cow"
  | "chicken"
  | "pig"
  | "sheep"
  | "goat"
  | "duck"
  | "goose"
  | "horse"
  | "rooster";

// Power-up types (farm-themed + legacy aliases for backwards compat)
export type PowerUpType =
  | "hay_bale" // Extra life
  | "golden_egg" // Double points
  | "water_trough" // Magnetic pull
  | "salt_lick" // Full restore + invincibility
  | "corn_feed" // Merge stack into bank
  | "lucky_horseshoe"; // Increase max hearts

export const ANIMAL_TYPES = {
  cow: {
    spawnWeight: 0.08,
    ability: "poop_shot",
    normalColor: "#F5F5DC", // Beige
    specialColor: "#8B4513", // Brown
  },
  chicken: {
    spawnWeight: 0.18,
    ability: "egg_bomb",
    normalColor: "#D2691E", // Chocolate brown
    specialColor: "#FFD700", // Gold
  },
  pig: {
    spawnWeight: 0.14,
    ability: "mud_splash",
    normalColor: "#FFB6C1", // Light pink
    specialColor: "#FF69B4", // Hot pink
  },
  sheep: {
    spawnWeight: 0.12,
    ability: "wool_shield",
    normalColor: "#F5F5F5", // Off-white wool
    specialColor: "#1C1C1C", // Black sheep
  },
  goat: {
    spawnWeight: 0.1,
    ability: "bleat_stun",
    normalColor: "#C4A484", // Tan
    specialColor: "#808080", // Gray
  },
  duck: {
    spawnWeight: 0.16,
    ability: "feather_float",
    normalColor: "#FFFACD", // Lemon chiffon (yellow)
    specialColor: "#4169E1", // Royal blue
  },
  goose: {
    spawnWeight: 0.07,
    ability: "honey_trap",
    normalColor: "#FFFFFF", // White
    specialColor: "#FFD700", // Gold
  },
  horse: {
    spawnWeight: 0.05,
    ability: "hay_storm",
    normalColor: "#8B4513", // Saddle brown
    specialColor: "#D2B48C", // Tan (palomino)
  },
  rooster: {
    spawnWeight: 0.06,
    ability: "crow_call",
    normalColor: "#8B0000", // Dark red
    specialColor: "#F8F8FF", // Ghost white (albino)
  },
} as const;

export const POWER_UPS = {
  // Farm-themed power-ups
  hay_bale: {
    name: "Hay Bale",
    description: "Restore one heart",
    spawnWeight: 0.35,
    glowColor: "#8B4513",
  },
  golden_egg: {
    name: "Golden Egg",
    description: "Double points for 8 seconds!",
    spawnWeight: 0.15,
    duration: 8000,
    multiplier: 2,
    glowColor: "#FFD700",
  },
  water_trough: {
    name: "Water Trough",
    description: "Magnetic pull for 5 seconds!",
    spawnWeight: 0.15,
    duration: 5000,
    glowColor: "#4FC3F7",
  },
  salt_lick: {
    name: "Salt Lick",
    description: "Full hearts + 3s invincibility!",
    spawnWeight: 0.05,
    invincibilityDuration: 3000,
    glowColor: "#FF6B6B",
  },
  corn_feed: {
    name: "Corn Feed",
    description: "Merge stack into one mega animal!",
    spawnWeight: 0.12,
    minStackToUse: 3,
    glowColor: "#FFD700",
  },
  lucky_horseshoe: {
    name: "Lucky Horseshoe",
    description: "Increase max hearts by 1",
    spawnWeight: 0.08,
    glowColor: "#C0C0C0",
  },
} as const;

// Rustic Farm Color Palette
export const FARM_COLORS = {
  // Sky and atmosphere
  sky: {
    day: "#87CEEB", // Sky blue
    sunset: "#FFA07A", // Light salmon
    storm: "#4A5568", // Storm gray
  },

  // Ground and terrain
  ground: {
    grass: "#228B22", // Forest green
    dirt: "#8B4513", // Saddle brown
    hay: "#DAA520", // Goldenrod
    mud: "#6B4423", // Dark brown
  },

  // Barn and structures
  barn: {
    red: "#8B0000", // Dark red (barn red)
    wood: "#A0522D", // Sienna
    trim: "#F5F5DC", // Beige
    roof: "#2F1810", // Very dark brown
    door: "#654321", // Dark wood
  },

  // Fence and details
  fence: {
    post: "#8B7355", // Burly wood
    wire: "#808080", // Gray
    weathered: "#A9A9A9", // Dark gray
  },

  // Nature
  nature: {
    bush: "#228B22", // Forest green
    bushDark: "#006400", // Dark green
    flower: "#FF6B6B", // Coral
    wheat: "#F5DEB3", // Wheat
    corn: "#FFD700", // Gold (corn)
  },

  // Animals
  animals: {
    cow: {
      body: "#F5F5DC", // Beige (Holstein base)
      spots: "#1C1C1C", // Black spots
      nose: "#FFC0CB", // Pink nose
    },
    chicken: {
      body: "#D2691E", // Brown
      wing: "#8B4513", // Darker wing
      comb: "#FF0000", // Red comb
      beak: "#FFA500", // Orange beak
    },
    pig: {
      body: "#FFB6C1", // Light pink
      snout: "#FF69B4", // Hot pink snout
      ear: "#FFC0CB", // Pink ear inner
    },
    sheep: {
      wool: "#F5F5F5", // Off-white
      face: "#2F2F2F", // Dark face
      ear: "#FFC0CB", // Pink inner ear
    },
    goat: {
      body: "#C4A484", // Tan
      beard: "#F5F5DC", // Light beard
      horns: "#D2B48C", // Tan horns
    },
    duck: {
      body: "#FFFACD", // Yellow
      beak: "#FFA500", // Orange
      feet: "#FFA500", // Orange feet
    },
    goose: {
      body: "#FFFFFF", // White
      beak: "#FF8C00", // Dark orange
      feet: "#FF8C00", // Orange feet
    },
    horse: {
      body: "#8B4513", // Brown
      mane: "#2F1810", // Dark mane
      hooves: "#1C1C1C", // Black hooves
    },
    rooster: {
      body: "#8B0000", // Dark red
      tail: "#006400", // Green tail
      comb: "#FF0000", // Red comb
      wattle: "#FF0000", // Red wattle
    },
  },

  // UI Elements
  ui: {
    primary: "#8B4513", // Saddle brown
    secondary: "#DAA520", // Goldenrod
    accent: "#FF6B6B", // Coral
    text: "#2F1810", // Dark brown
    textLight: "#F5F5DC", // Beige
    danger: "#DC143C", // Crimson
    warning: "#FF8C00", // Dark orange
    success: "#228B22", // Forest green
    heart: "#DC143C", // Crimson
    heartEmpty: "#696969", // Dim gray
  },

  // Tornado
  tornado: {
    funnel: "#4A5568", // Storm gray
    debris: "#8B4513", // Brown debris
    wind: "rgba(74, 85, 104, 0.3)", // Translucent gray
  },

  // Effects
  effects: {
    poop: "#6B4423", // Dark brown
    hay: "#DAA520", // Goldenrod
    feather: "#FFFFFF", // White
    mud: "#6B4423", // Mud brown
    egg: "#FFD700", // Gold
    wool: "#F5F5F5", // Off-white
  },
} as const;

export const GAME_CONFIG = {
  // Animal dimensions (base values, scaled responsively)
  animal: {
    width: 70,
    height: 60,
    // Merged animal scaling
    mergeScaleBase: 1.0,
    mergeScalePerAnimal: 0.12,
    maxMergeScale: 2.5,
  },

  // Physics
  physics: {
    gravity: 0.35,
    maxFallSpeed: 14,

    // Wobble spring-damper system
    wobbleStrength: 0.045,
    wobbleDamping: 0.94,
    wobbleSpringiness: 0.08,

    // Stack physics
    stackStability: 0.72,
    impactWobble: 0.025,

    // Merged stability bonus
    mergedStabilityBonus: 0.35,

    // AI wobble influence
    aiWobble: {
      seekerImpact: 0.015,
      diveImpact: 0.025,
      evaderImpact: 0.008,
      swarmBonus: 0.005,
      maxAIWobble: 0.08,
    },

    // Tipping point
    tipping: {
      criticalAngleBase: 0.58,
      heightPenalty: 0.007,
      minCriticalAngle: 0.22,
      massDistribution: 0.32,
      cascadeMultiplier: 1.06,
      warningThreshold: 0.6,
      dangerThreshold: 0.88,
    },

    // Bush physics
    bush: {
      growthSpeed: 0.003, // Growth per frame
      bounceForce: 12, // Upward velocity on bounce
      maxHeight: 80, // Maximum bush height
      decayTime: 15000, // Time before bush shrinks (ms)
    },

    // Ability projectile physics
    projectile: {
      speed: 8,
      size: 20,
      duration: 3000,
    },
  },

  // Lives system
  lives: {
    starting: 3,
    max: 5,
    absoluteMax: 8,

    earnThresholds: {
      perfectStreak: 5,
      scoreBonus: 500,
      bankingBonus: 10,
    },

    invincibilityDuration: 1500,
  },

  // Power-up spawning
  powerUps: {
    baseSpawnChance: 0.08,
    spawnInterval: 8000,
    minLevelToSpawn: 2,
    fallSpeed: 3,
    collectRadius: 50,
    bobSpeed: 0.003,
    bobAmount: 8,
  },

  // Spawning
  spawning: {
    initialInterval: 2200,
    minInterval: 700,
    intervalDecreasePerLevel: 120,
    horizontalPadding: 50,
    horizontalDrift: 0.8,
    targetingBias: 0.3,
  },

  // Collision detection
  collision: {
    catchWindowTop: 0.9,
    catchWindowBottom: 0.3,
    perfectTolerance: 8,
    goodTolerance: 0.5,
    hitTolerance: 0.7,
    interpolationSteps: 3,
    landingOffset: 0.82,
    imperfectOffsetScale: 0.4,
  },

  // Visual effects
  effects: {
    squishFactor: 0.22,
    headacheThreshold: 0.4,
    dangerShake: 0.02,
    particleCount: 18,
    particleDecay: 0.022,
    mergeParticles: 30,
    mergeFlashDuration: 500,
  },

  // Scoring system
  scoring: {
    basePoints: 10,
    stackMultiplier: 1.6,
    perfectBonus: 2.5,
    goodBonus: 1.3,
    maxMultiplier: 15,

    comboDecayTime: 3000,
    comboMultiplier: 0.15,

    bankingPenalty: 0.4,
    bankingBonusPerAnimal: 5,

    mergeBonus: 50,
    mergeBonusPerAnimal: 20,

    specialAbilityBonus: 25,
    bushBounceBonus: 15,
    abilityKillBonus: 50,
  },

  // Banking system
  banking: {
    minStackToBank: 5,
    bankAnimationDuration: 600,
  },

  // Difficulty scaling
  difficulty: {
    levelUpThreshold: 75,
    maxLevel: 25,
    speedIncreasePerLevel: 0.04,
    spawnRateCurve: 0.85,
    specialVariantLevelBonus: 0.02,
    specialAnimalLevelBonus: 0.01,
  },

  // Layout
  layout: {
    platformHeight: 90,
    bankWidth: 65,
    safeZoneTop: 80,
    floorY: 0.92,
    tornadoRailY: 0.08, // Y position of tornado rail (percentage from top)
    tornadoSpeed: 2, // Base speed of tornado movement
  },

  // Poke reactions
  poke: {
    cooldown: 400,
    wobbleAmount: 0.25,
    confusionChance: 0.25,
  },

  // Tornado configuration
  tornado: {
    width: 120,
    height: 200,
    baseSpeed: 1.5,
    maxSpeed: 3.5,
    spawnInterval: { min: 800, max: 2500 },
    directionChangeChance: 0.02,
    funnelSegments: 12,
    rotationSpeed: 0.15,
    swayAmount: 30,
  },

  // Color reference (for UI components)
  colors: {
    background: {
      primary: FARM_COLORS.sky.storm,
      secondary: FARM_COLORS.sky.day,
      tertiary: FARM_COLORS.ground.grass,
    },
    platform: FARM_COLORS.barn.wood,
    bank: FARM_COLORS.barn.red,
    danger: FARM_COLORS.ui.danger,
    warning: FARM_COLORS.ui.warning,
    heart: FARM_COLORS.ui.heart,
    heartEmpty: FARM_COLORS.ui.heartEmpty,
    // Default peeking animal colors (used by PeekingAnimal)
    peekingAnimal: {
      body: FARM_COLORS.animals.chicken.body,
      beak: FARM_COLORS.animals.chicken.beak,
      accent: FARM_COLORS.animals.chicken.comb,
      outline: "#8B7355",
    },
    // Bank button (barn-themed)
    bankButton: {
      top: FARM_COLORS.barn.red,
      bottom: FARM_COLORS.barn.wood,
      band: FARM_COLORS.ui.text,
      button: FARM_COLORS.ground.hay,
    },
    // Warm glow effect colors (used for ability activations)
    warmGlow: {
      core: "#FFEB3B",
      mid: "#FF9800",
      outer: "#FF5722",
    },
  },
} as const;

// Animal type config — all animals use the same base config now
// (special abilities are defined per-variant in ANIMAL_ARCHETYPES)
// Individual animal colors come from ANIMAL_BASE_COLORS in archetypes.ts
export type AnimalTypeConfig = "normal";

export const ANIMAL_TYPE_CONFIGS = {
  normal: {
    spawnWeight: 1.0,
    ability: null as string | null,
    colors: {
      body: FARM_COLORS.animals.chicken.body,
      beak: FARM_COLORS.animals.chicken.beak,
    },
  },
} as const;

export const FAIL_MESSAGES = [
  "The animals scattered!",
  "Moo-ve over, gravity wins!",
  "That stack was egg-stremely unstable!",
  "Holy cow, they toppled!",
  "Baa-d luck!",
  "The pigs flew... then fell!",
  "Too much horseplay!",
  "Duck and cover!",
  "What a load of... animals!",
  "The farm is in chaos!",
  "Should've banked 'em!",
  "Physics rules the barnyard!",
] as const;

export type GameMode = "MENU" | "PLAYING" | "GAMEOVER";
