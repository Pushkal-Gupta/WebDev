// 5 turret tiers — one per era. The build/upgrade flow swaps a slot's
// turret to the player's current era variant.

/**
 * @typedef {Object} TurretDef
 * @property {string} id
 * @property {string} eraId
 * @property {string} name
 * @property {number} buildCost
 * @property {number} damage
 * @property {number} range
 * @property {number} cooldownMs
 * @property {string} projectileId
 * @property {{baseColor:string, barrelColor:string, kind:string}} visual
 */

export const TURRETS = [
  {
    id: 'bone-crossbow', eraId: 'ember-tribe', name: 'Bone Crossbow',
    buildCost: 90,  damage: 14,  range: 220, cooldownMs: 1100,
    projectileId: 'bone-shard',
    visual: { baseColor: '#7c4f2a', barrelColor: '#fff1d2', kind: 'crossbow' },
  },
  {
    id: 'iron-ballista', eraId: 'iron-dominion', name: 'Iron Ballista',
    buildCost: 160, damage: 26,  range: 250, cooldownMs: 1100,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#3a4858', barrelColor: '#d8d4cc', kind: 'bell' },
  },
  {
    id: 'brass-mortar', eraId: 'sun-foundry', name: 'Brass Mortar',
    buildCost: 240, damage: 44,  range: 270, cooldownMs: 1300,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#7a4818', barrelColor: '#ffcb6b', kind: 'cannon' },
  },
  {
    id: 'volt-cannon', eraId: 'storm-republic', name: 'Volt Cannon',
    buildCost: 340, damage: 70,  range: 290, cooldownMs: 1100,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#1f2c3c', barrelColor: '#7be3ff', kind: 'tesla' },
  },
  {
    id: 'void-lance', eraId: 'void-ascendancy', name: 'Void Lance',
    buildCost: 460, damage: 110, range: 320, cooldownMs: 1300,
    projectileId: 'void-orb',
    visual: { baseColor: '#1a0a3a', barrelColor: '#e9c8ff', kind: 'lance' },
  },
];

export const TURRETS_BY_ID = Object.freeze(
  TURRETS.reduce((acc, def) => { acc[def.id] = def; return acc; }, /** @type {Record<string, TurretDef>} */ ({})),
);
export const TURRETS_BY_ERA = Object.freeze(
  TURRETS.reduce((acc, def) => { acc[def.eraId] = def; return acc; }, /** @type {Record<string, TurretDef>} */ ({})),
);

export function getTurret(id) { return TURRETS_BY_ID[id] || null; }
export function getTurretForEra(eraId) { return TURRETS_BY_ERA[eraId] || null; }

// 50% refund of the most recent build cost.
export const SELL_REFUND_PCT = 0.5;
