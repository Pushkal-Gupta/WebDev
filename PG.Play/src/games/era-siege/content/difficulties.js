// Five difficulty tiers — easy / normal / medium / hard / insane.
// Each tier scales:
//   - AI spawn rate (more troops as difficulty rises)
//   - AI tech rate  (enemy evolves earlier)
//   - AI turret + special aggression
//   - Enemy damage multiplier
//   - Player starting gold (LESS as difficulty rises — gold pressure)
//   - Player gold trickle multiplier (also LESS as difficulty rises)
//
// Legacy ids `skirmish` / `standard` / `conquest` map to easy / normal /
// hard so existing save data, telemetry, and unit tests still resolve.

/**
 * @typedef {Object} DifficultyDef
 * @property {'easy'|'normal'|'medium'|'hard'|'insane'} id
 * @property {string} label
 * @property {string} blurb
 * @property {number} aiSpawnRateMul
 * @property {number} aiTechRateMul
 * @property {number} aiTurretChance
 * @property {number} aiSpecialAggression
 * @property {number} enemyDamageMul
 * @property {number} startingGold
 * @property {number} playerGoldRateMul   how fast passive gold trickles in
 */

export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    blurb: 'Forgiving pacing. AI is patient. Gold flows freely.',
    aiSpawnRateMul: 0.65,
    aiTechRateMul: 0.70,
    aiTurretChance: 0.15,
    aiSpecialAggression: 0.30,
    enemyDamageMul: 0.85,
    startingGold: 150,
    playerGoldRateMul: 1.20,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    blurb: 'Default tuning. AI evolves on schedule.',
    aiSpawnRateMul: 1.00,
    aiTechRateMul: 1.00,
    aiTurretChance: 0.35,
    aiSpecialAggression: 0.60,
    enemyDamageMul: 1.00,
    startingGold: 110,
    playerGoldRateMul: 1.00,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    blurb: 'AI spawns more troops and pushes earlier era jumps.',
    aiSpawnRateMul: 1.15,
    aiTechRateMul: 1.15,
    aiTurretChance: 0.45,
    aiSpecialAggression: 0.75,
    enemyDamageMul: 1.05,
    startingGold: 95,
    playerGoldRateMul: 0.92,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    blurb: 'AI evolves early, hits harder. Player gold trickles slower.',
    aiSpawnRateMul: 1.30,
    aiTechRateMul: 1.30,
    aiTurretChance: 0.60,
    aiSpecialAggression: 0.90,
    enemyDamageMul: 1.15,
    startingGold: 85,
    playerGoldRateMul: 0.82,
  },
  insane: {
    id: 'insane',
    label: 'Insane',
    blurb: 'Full assault. AI floods the lane and out-techs you. Every gold piece counts.',
    aiSpawnRateMul: 1.55,
    aiTechRateMul: 1.45,
    aiTurretChance: 0.75,
    aiSpecialAggression: 1.00,
    enemyDamageMul: 1.30,
    startingGold: 70,
    playerGoldRateMul: 0.70,
  },
};

// Legacy ids → new ids. Tests + saved telemetry still pass `skirmish`
// or `conquest`; resolve them onto the new ladder.
const LEGACY_ALIASES = {
  skirmish: 'easy',
  standard: 'normal',
  conquest: 'hard',
};

export function getDifficulty(id) {
  return DIFFICULTIES[id]
      || DIFFICULTIES[LEGACY_ALIASES[id]]
      || DIFFICULTIES.normal;
}
