/**
 * Achievement System
 * Track and unlock achievements based on gameplay
 *
 * TODO: Migrate localStorage calls to platform storage abstraction
 * (src/platform/storage.ts) for native Capacitor Preferences support.
 * The platform storage API is async, so loadStats, saveStats,
 * loadAchievements, and checkAchievements would need to become async.
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  condition: (stats: GameStats) => boolean;
  progress?: (stats: GameStats) => { current: number; max: number };
}

export interface GameStats {
  totalScore: number;
  highScore: number;
  totalCatches: number;
  perfectCatches: number;
  totalGames: number;
  maxStack: number;
  maxCombo: number;
  totalBanked: number;
  abilitiesUsed: number;
  animalsStunned: number;
  powerUpsCollected: number;
  livesEarned: number;
  totalPlayTime: number; // seconds
  consecutivePerfects: number; // in a single game
}

const ACHIEVEMENTS: AchievementData[] = [
  // Score achievements
  {
    id: "first_catch",
    name: "First Catch",
    description: "Catch your first animal",
    icon: "🎯",
    tier: "bronze",
    condition: (s) => s.totalCatches >= 1,
  },
  {
    id: "century",
    name: "Century",
    description: "Score 100 points in a single game",
    icon: "💯",
    tier: "bronze",
    condition: (s) => s.highScore >= 100,
  },
  {
    id: "high_roller",
    name: "High Roller",
    description: "Score 1,000 points in a single game",
    icon: "🎰",
    tier: "silver",
    condition: (s) => s.highScore >= 1000,
  },
  {
    id: "farm_master",
    name: "Farm Master",
    description: "Score 5,000 points in a single game",
    icon: "👑",
    tier: "gold",
    condition: (s) => s.highScore >= 5000,
  },
  {
    id: "legendary",
    name: "Legendary",
    description: "Score 10,000 points in a single game",
    icon: "⭐",
    tier: "platinum",
    condition: (s) => s.highScore >= 10000,
  },

  // Stacking achievements
  {
    id: "tower_of_five",
    name: "Tower of Five",
    description: "Stack 5 animals",
    icon: "🏗️",
    tier: "bronze",
    condition: (s) => s.maxStack >= 5,
  },
  {
    id: "tower_of_ten",
    name: "Tower of Ten",
    description: "Stack 10 animals",
    icon: "🏰",
    tier: "silver",
    condition: (s) => s.maxStack >= 10,
  },
  {
    id: "skyscraper",
    name: "Skyscraper",
    description: "Stack 15 animals",
    icon: "🏙️",
    tier: "gold",
    condition: (s) => s.maxStack >= 15,
  },

  // Perfect catches
  {
    id: "sharp_eye",
    name: "Sharp Eye",
    description: "Get 10 perfect catches total",
    icon: "👁️",
    tier: "bronze",
    condition: (s) => s.perfectCatches >= 10,
    progress: (s) => ({ current: s.perfectCatches, max: 10 }),
  },
  {
    id: "precision",
    name: "Precision",
    description: "Get 5 perfect catches in a row",
    icon: "🎯",
    tier: "silver",
    condition: (s) => s.consecutivePerfects >= 5,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Get 100 perfect catches total",
    icon: "💎",
    tier: "gold",
    condition: (s) => s.perfectCatches >= 100,
    progress: (s) => ({ current: s.perfectCatches, max: 100 }),
  },

  // Combo achievements
  {
    id: "combo_starter",
    name: "Combo Starter",
    description: "Get a 5x combo",
    icon: "🔥",
    tier: "bronze",
    condition: (s) => s.maxCombo >= 5,
  },
  {
    id: "combo_king",
    name: "Combo King",
    description: "Get a 10x combo",
    icon: "👑",
    tier: "silver",
    condition: (s) => s.maxCombo >= 10,
  },

  // Banking achievements
  {
    id: "safe_keeper",
    name: "Safe Keeper",
    description: "Bank 10 animals total",
    icon: "🏦",
    tier: "bronze",
    condition: (s) => s.totalBanked >= 10,
    progress: (s) => ({ current: s.totalBanked, max: 10 }),
  },
  {
    id: "banker",
    name: "Banker",
    description: "Bank 50 animals total",
    icon: "💰",
    tier: "silver",
    condition: (s) => s.totalBanked >= 50,
    progress: (s) => ({ current: s.totalBanked, max: 50 }),
  },

  // Special abilities
  {
    id: "ability_master",
    name: "Ability Master",
    description: "Use 10 animal abilities",
    icon: "⚡",
    tier: "bronze",
    condition: (s) => s.abilitiesUsed >= 10,
    progress: (s) => ({ current: s.abilitiesUsed, max: 10 }),
  },
  {
    id: "crowd_control",
    name: "Crowd Control",
    description: "Stun 10 animals",
    icon: "💫",
    tier: "bronze",
    condition: (s) => s.animalsStunned >= 10,
    progress: (s) => ({ current: s.animalsStunned, max: 10 }),
  },

  // Power-up achievements
  {
    id: "collector",
    name: "Collector",
    description: "Collect 20 power-ups",
    icon: "🎁",
    tier: "silver",
    condition: (s) => s.powerUpsCollected >= 20,
    progress: (s) => ({ current: s.powerUpsCollected, max: 20 }),
  },

  // Playtime achievements
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Play for 30 minutes total",
    icon: "⏰",
    tier: "silver",
    condition: (s) => s.totalPlayTime >= 1800,
    progress: (s) => ({ current: Math.floor(s.totalPlayTime / 60), max: 30 }),
  },

  // Games played
  {
    id: "persistent",
    name: "Persistent",
    description: "Play 10 games",
    icon: "🎮",
    tier: "bronze",
    condition: (s) => s.totalGames >= 10,
    progress: (s) => ({ current: s.totalGames, max: 10 }),
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 50 games",
    icon: "🎖️",
    tier: "silver",
    condition: (s) => s.totalGames >= 50,
    progress: (s) => ({ current: s.totalGames, max: 50 }),
  },
];

const STORAGE_KEY = "farm-follies-achievements";
const STATS_KEY = "farm-follies-stats";

/**
 * Get default stats
 */
function getDefaultStats(): GameStats {
  return {
    totalScore: 0,
    highScore: 0,
    totalCatches: 0,
    perfectCatches: 0,
    totalGames: 0,
    maxStack: 0,
    maxCombo: 0,
    totalBanked: 0,
    abilitiesUsed: 0,
    animalsStunned: 0,
    powerUpsCollected: 0,
    livesEarned: 0,
    totalPlayTime: 0,
    consecutivePerfects: 0,
  };
}

/**
 * Validate that a parsed value is a finite number, falling back to a default.
 */
function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Load stats from localStorage with runtime type validation.
 * Each field is individually checked to guard against corrupted or
 * tampered storage data.
 */
export function loadStats(): GameStats {
  if (typeof window === "undefined") return getDefaultStats();

  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (parsed === null || typeof parsed !== "object") {
        return getDefaultStats();
      }
      const raw = parsed as Record<string, unknown>;
      const defaults = getDefaultStats();
      return {
        totalScore: asNumber(raw.totalScore, defaults.totalScore),
        highScore: asNumber(raw.highScore, defaults.highScore),
        totalCatches: asNumber(raw.totalCatches, defaults.totalCatches),
        perfectCatches: asNumber(raw.perfectCatches, defaults.perfectCatches),
        totalGames: asNumber(raw.totalGames, defaults.totalGames),
        maxStack: asNumber(raw.maxStack, defaults.maxStack),
        maxCombo: asNumber(raw.maxCombo, defaults.maxCombo),
        totalBanked: asNumber(raw.totalBanked, defaults.totalBanked),
        abilitiesUsed: asNumber(raw.abilitiesUsed, defaults.abilitiesUsed),
        animalsStunned: asNumber(raw.animalsStunned, defaults.animalsStunned),
        powerUpsCollected: asNumber(raw.powerUpsCollected, defaults.powerUpsCollected),
        livesEarned: asNumber(raw.livesEarned, defaults.livesEarned),
        totalPlayTime: asNumber(raw.totalPlayTime, defaults.totalPlayTime),
        consecutivePerfects: asNumber(raw.consecutivePerfects, defaults.consecutivePerfects),
      };
    }
  } catch (e) {
    console.error("Failed to load stats:", e);
  }

  return getDefaultStats();
}

/**
 * Save stats to localStorage
 */
export function saveStats(stats: GameStats): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save stats:", e);
  }
}

/**
 * Load achievements from localStorage
 */
export function loadAchievements(): Achievement[] {
  const stats = loadStats();

  let unlockedIds: Set<string> = new Set();

  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        unlockedIds = new Set(data.unlockedIds || []);
      }
    } catch (e) {
      console.error("Failed to load achievements:", e);
    }
  }

  return ACHIEVEMENTS.map((a) => {
    const progress = a.progress?.(stats);
    return {
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon,
      tier: a.tier,
      unlocked: unlockedIds.has(a.id) || a.condition(stats),
      progress: progress?.current,
      maxProgress: progress?.max,
    };
  });
}

/**
 * Check and unlock achievements based on current stats
 * Returns newly unlocked achievements
 */
export function checkAchievements(stats: GameStats): Achievement[] {
  const current = loadAchievements();
  const newlyUnlocked: Achievement[] = [];
  const unlockedIds: string[] = [];

  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const def = ACHIEVEMENTS[i];
    const achievement = current[i];

    if (!achievement.unlocked && def.condition(stats)) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      newlyUnlocked.push(achievement);
    }

    if (achievement.unlocked) {
      unlockedIds.push(achievement.id);
    }
  }

  // Save unlocked achievements
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ unlockedIds }));
    } catch (e) {
      console.error("Failed to save achievements:", e);
    }
  }

  return newlyUnlocked;
}

/**
 * Get total achievement count by tier
 */
export function getAchievementStats(): {
  total: number;
  unlocked: number;
  byTier: Record<string, { total: number; unlocked: number }>;
} {
  const achievements = loadAchievements();

  const byTier: Record<string, { total: number; unlocked: number }> = {
    bronze: { total: 0, unlocked: 0 },
    silver: { total: 0, unlocked: 0 },
    gold: { total: 0, unlocked: 0 },
    platinum: { total: 0, unlocked: 0 },
  };

  let total = 0;
  let unlocked = 0;

  for (const a of achievements) {
    total++;
    byTier[a.tier].total++;

    if (a.unlocked) {
      unlocked++;
      byTier[a.tier].unlocked++;
    }
  }

  return { total, unlocked, byTier };
}
