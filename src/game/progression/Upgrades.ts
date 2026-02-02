/**
 * Upgrade/Progression System
 * Permanent upgrades that persist across games
 */

import { STORAGE_KEYS, storage } from "@/platform";

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  currentLevel: number;
  baseCost: number;
  costMultiplier: number;
  effect: (level: number) => number; // Returns the bonus value
  effectDescription: (level: number) => string;
}

export interface UpgradeState {
  coins: number;
  upgrades: Record<string, number>; // upgrade id -> level
  totalCoinsEarned: number;
}

const UPGRADES_DATA: Omit<Upgrade, "currentLevel">[] = [
  {
    id: "extra_life",
    name: "Extra Life",
    description: "Start with more lives",
    icon: "❤️",
    maxLevel: 3,
    baseCost: 500,
    costMultiplier: 2,
    effect: (level) => level, // +1 life per level
    effectDescription: (level) => `+${level} starting ${level === 1 ? "life" : "lives"}`,
  },
  {
    id: "stable_stack",
    name: "Stable Stack",
    description: "Reduce wobble intensity",
    icon: "🏗️",
    maxLevel: 5,
    baseCost: 300,
    costMultiplier: 1.5,
    effect: (level) => level * 0.08, // 8% reduction per level
    effectDescription: (level) => `-${level * 8}% wobble`,
  },
  {
    id: "coin_boost",
    name: "Coin Boost",
    description: "Earn more coins from scores",
    icon: "💰",
    maxLevel: 5,
    baseCost: 400,
    costMultiplier: 1.8,
    effect: (level) => 1 + level * 0.15, // +15% per level
    effectDescription: (level) => `+${level * 15}% coins`,
  },
  {
    id: "power_up_magnet",
    name: "Power-Up Magnet",
    description: "Larger power-up collection radius",
    icon: "🧲",
    maxLevel: 4,
    baseCost: 350,
    costMultiplier: 1.6,
    effect: (level) => 1 + level * 0.2, // +20% radius per level
    effectDescription: (level) => `+${level * 20}% pickup range`,
  },
  {
    id: "combo_keeper",
    name: "Combo Keeper",
    description: "Slower combo decay",
    icon: "🔥",
    maxLevel: 3,
    baseCost: 450,
    costMultiplier: 2,
    effect: (level) => 1 + level * 0.25, // +25% decay time per level
    effectDescription: (level) => `+${level * 25}% combo time`,
  },
  {
    id: "ability_master",
    name: "Ability Master",
    description: "Faster ability cooldowns",
    icon: "⚡",
    maxLevel: 4,
    baseCost: 500,
    costMultiplier: 1.7,
    effect: (level) => level * 0.1, // 10% faster per level
    effectDescription: (level) => `-${level * 10}% cooldown`,
  },
  {
    id: "lucky_drops",
    name: "Lucky Drops",
    description: "More power-ups spawn",
    icon: "🍀",
    maxLevel: 3,
    baseCost: 600,
    costMultiplier: 2.2,
    effect: (level) => 1 + level * 0.2, // +20% spawn chance per level
    effectDescription: (level) => `+${level * 20}% power-up chance`,
  },
  {
    id: "special_affinity",
    name: "Special Affinity",
    description: "More special animals spawn",
    icon: "✨",
    maxLevel: 3,
    baseCost: 550,
    costMultiplier: 2,
    effect: (level) => level * 0.05, // +5% per level
    effectDescription: (level) => `+${level * 5}% special animals`,
  },
];

/**
 * Get default upgrade state
 */
function getDefaultState(): UpgradeState {
  return {
    coins: 0,
    upgrades: {},
    totalCoinsEarned: 0,
  };
}

/**
 * Load upgrade state from platform storage
 */
export async function loadUpgradeState(): Promise<UpgradeState> {
  try {
    const saved = await storage.get<UpgradeState>(STORAGE_KEYS.UPGRADES);
    if (saved) {
      return { ...getDefaultState(), ...saved };
    }
  } catch (e) {
    console.error("Failed to load upgrades:", e);
  }

  return getDefaultState();
}

/**
 * Save upgrade state to platform storage
 */
export async function saveUpgradeState(state: UpgradeState): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.UPGRADES, state);
  } catch (e) {
    console.error("Failed to save upgrades:", e);
  }
}

/**
 * Get all upgrades with current levels
 */
export async function getUpgrades(): Promise<Upgrade[]> {
  const state = await loadUpgradeState();

  return UPGRADES_DATA.map((data) => ({
    ...data,
    currentLevel: state.upgrades[data.id] || 0,
  }));
}

/**
 * Get a specific upgrade's current value
 */
export async function getUpgradeValue(upgradeId: string): Promise<number> {
  const state = await loadUpgradeState();
  const upgrade = UPGRADES_DATA.find((u) => u.id === upgradeId);
  if (!upgrade) return 0;

  const level = state.upgrades[upgradeId] || 0;
  return upgrade.effect(level);
}

/**
 * Get the cost to purchase the next level of an upgrade
 */
export function getUpgradeCost(upgrade: Upgrade): number {
  if (upgrade.currentLevel >= upgrade.maxLevel) return Infinity;
  return Math.floor(upgrade.baseCost * upgrade.costMultiplier ** upgrade.currentLevel);
}

/**
 * Purchase an upgrade level
 * Returns true if successful
 */
export async function purchaseUpgrade(upgradeId: string): Promise<boolean> {
  const state = await loadUpgradeState();
  const upgrade = UPGRADES_DATA.find((u) => u.id === upgradeId);

  if (!upgrade) return false;

  const currentLevel = state.upgrades[upgradeId] || 0;
  if (currentLevel >= upgrade.maxLevel) return false;

  const cost = Math.floor(upgrade.baseCost * upgrade.costMultiplier ** currentLevel);
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.upgrades[upgradeId] = currentLevel + 1;
  await saveUpgradeState(state);

  return true;
}

/**
 * Add coins from a game
 */
export async function addCoins(baseCoins: number): Promise<number> {
  const state = await loadUpgradeState();

  // Apply coin boost upgrade
  const coinBoostLevel = state.upgrades.coin_boost || 0;
  const coinBoost = UPGRADES_DATA.find((u) => u.id === "coin_boost")!;
  const multiplier = coinBoost.effect(coinBoostLevel);

  const earnedCoins = Math.floor(baseCoins * multiplier);
  state.coins += earnedCoins;
  state.totalCoinsEarned += earnedCoins;
  await saveUpgradeState(state);

  return earnedCoins;
}

/**
 * Get current coin balance
 */
export async function getCoins(): Promise<number> {
  const state = await loadUpgradeState();
  return state.coins;
}

/**
 * Calculate coins earned from a score
 * Base rate: 1 coin per 10 points
 */
export function calculateCoinsFromScore(score: number): number {
  return Math.floor(score / 10);
}

/**
 * Apply upgrades to game config
 * Returns modified values
 */
export async function getUpgradeModifiers(): Promise<{
  extraLives: number;
  wobbleReduction: number;
  coinMultiplier: number;
  powerUpRadius: number;
  comboDecayMultiplier: number;
  abilityCooldownReduction: number;
  powerUpSpawnBonus: number;
  specialAnimalBonus: number;
}> {
  const state = await loadUpgradeState();

  const getValue = (id: string) => {
    const upgrade = UPGRADES_DATA.find((u) => u.id === id)!;
    return upgrade.effect(state.upgrades[id] || 0);
  };

  return {
    extraLives: getValue("extra_life"),
    wobbleReduction: getValue("stable_stack"),
    coinMultiplier: getValue("coin_boost"),
    powerUpRadius: getValue("power_up_magnet"),
    comboDecayMultiplier: getValue("combo_keeper"),
    abilityCooldownReduction: getValue("ability_master"),
    powerUpSpawnBonus: getValue("lucky_drops"),
    specialAnimalBonus: getValue("special_affinity"),
  };
}
