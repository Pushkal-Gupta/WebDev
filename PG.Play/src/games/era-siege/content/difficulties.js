// Three difficulty tiers. Multipliers shape the AI director's behaviour
// and the player's starting position. See balance framework for design
// targets.

/**
 * @typedef {Object} DifficultyDef
 * @property {'skirmish'|'standard'|'conquest'} id
 * @property {string} label
 * @property {string} blurb
 * @property {number} aiSpawnRateMul
 * @property {number} aiTechRateMul
 * @property {number} aiTurretChance
 * @property {number} aiSpecialAggression
 * @property {number} enemyDamageMul
 * @property {number} startingGold
 */

export const DIFFICULTIES = {
  skirmish: {
    id: 'skirmish',
    label: 'Skirmish',
    blurb: 'Easier pacing. AI evolves more slowly.',
    aiSpawnRateMul: 0.75,
    aiTechRateMul: 0.80,
    aiTurretChance: 0.20,
    aiSpecialAggression: 0.40,
    enemyDamageMul: 0.90,
    startingGold: 130,
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    blurb: 'Default tuning.',
    aiSpawnRateMul: 1.00,
    aiTechRateMul: 1.00,
    aiTurretChance: 0.35,
    aiSpecialAggression: 0.60,
    enemyDamageMul: 1.00,
    startingGold: 110,
  },
  conquest: {
    id: 'conquest',
    label: 'Conquest',
    blurb: 'AI evolves earlier. Hits harder. Picks turrets and specials more often.',
    aiSpawnRateMul: 1.20,
    aiTechRateMul: 1.20,
    aiTurretChance: 0.55,
    aiSpecialAggression: 0.85,
    enemyDamageMul: 1.10,
    startingGold: 100,
  },
};

export function getDifficulty(id) {
  return DIFFICULTIES[id] || DIFFICULTIES.standard;
}
