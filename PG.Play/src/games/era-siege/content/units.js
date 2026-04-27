// All 15 units, three per era. Tuning tracked in
// docs/ERA_SIEGE_BALANCE_FRAMEWORK.md.

/**
 * @typedef {Object} UnitDef
 * @property {string} id
 * @property {string} eraId
 * @property {string} name
 * @property {'frontline'|'ranged'|'heavy'} role
 * @property {number} cost
 * @property {number} spawnCooldownMs
 * @property {number} hp
 * @property {number} damage
 * @property {number} range
 * @property {number} moveSpeed
 * @property {number} attackWindupMs
 * @property {number} attackRecoverMs
 * @property {string} projectileId
 * @property {'nearest'|'lowestHp'|'highestThreat'} targetPolicy
 * @property {number} bountyGold
 * @property {number} bountyXp
 * @property {{silhouetteW:number, silhouetteH:number, colorBody:string, colorTrim:string, weaponShape:string, headRadius:number}} visual
 * @property {{spawnCue:string, attackCue:string, deathCue:string}} audio
 */

const u = (def) => ({
  spawnCooldownMs: 900,
  attackWindupMs: 220,
  attackRecoverMs: 380,
  projectileId: '',
  targetPolicy: 'nearest',
  audio: { spawnCue: 'confirm', attackCue: 'stomp', deathCue: 'error' },
  ...def,
});

export const UNITS = [
  // ── Era 1 — Ember Tribe
  u({
    id: 'ember-runner', eraId: 'ember-tribe', name: 'Ember Runner', role: 'frontline',
    cost: 35, spawnCooldownMs: 850,
    hp: 40, damage: 7, range: 22, moveSpeed: 70,
    attackWindupMs: 180, attackRecoverMs: 320,
    bountyGold: 14, bountyXp: 8,
    visual: { silhouetteW: 16, silhouetteH: 22, colorBody: '#d36a3a', colorTrim: '#fff1d2', weaponShape: 'club', headRadius: 6 },
  }),
  u({
    id: 'bone-slinger', eraId: 'ember-tribe', name: 'Bone Slinger', role: 'ranged',
    cost: 55, spawnCooldownMs: 1500,
    hp: 28, damage: 9, range: 110, moveSpeed: 52,
    attackWindupMs: 320, attackRecoverMs: 540,
    projectileId: 'bone-shard',
    bountyGold: 22, bountyXp: 13,
    visual: { silhouetteW: 14, silhouetteH: 22, colorBody: '#b88f5e', colorTrim: '#fff1d2', weaponShape: 'sling', headRadius: 6 },
    audio: { spawnCue: 'confirm', attackCue: 'shot', deathCue: 'error' },
  }),
  u({
    id: 'pyre-bearer', eraId: 'ember-tribe', name: 'Pyre Bearer', role: 'heavy',
    cost: 110, spawnCooldownMs: 3200,
    hp: 160, damage: 22, range: 24, moveSpeed: 30,
    attackWindupMs: 420, attackRecoverMs: 580,
    bountyGold: 44, bountyXp: 26,
    visual: { silhouetteW: 22, silhouetteH: 28, colorBody: '#a23a1f', colorTrim: '#ffd05a', weaponShape: 'brand', headRadius: 7 },
    audio: { spawnCue: 'open', attackCue: 'axeReveal', deathCue: 'lose' },
  }),

  // ── Era 2 — Iron Dominion
  u({
    id: 'oath-spear', eraId: 'iron-dominion', name: 'Oath Spear', role: 'frontline',
    cost: 60, spawnCooldownMs: 950,
    hp: 80, damage: 12, range: 26, moveSpeed: 60,
    attackWindupMs: 220, attackRecoverMs: 380,
    bountyGold: 24, bountyXp: 14,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#7c8a98', colorTrim: '#d8d4cc', weaponShape: 'spear', headRadius: 7 },
  }),
  u({
    id: 'crossbow-sworn', eraId: 'iron-dominion', name: 'Crossbow Sworn', role: 'ranged',
    cost: 90, spawnCooldownMs: 1700,
    hp: 50, damage: 14, range: 130, moveSpeed: 48,
    attackWindupMs: 340, attackRecoverMs: 560,
    projectileId: 'crossbow-bolt',
    bountyGold: 36, bountyXp: 22,
    visual: { silhouetteW: 16, silhouetteH: 24, colorBody: '#5a7080', colorTrim: '#d8d4cc', weaponShape: 'crossbow', headRadius: 7 },
    audio: { spawnCue: 'confirm', attackCue: 'shot', deathCue: 'error' },
  }),
  u({
    id: 'iron-bastion', eraId: 'iron-dominion', name: 'Iron Bastion', role: 'heavy',
    cost: 175, spawnCooldownMs: 3500,
    hp: 280, damage: 32, range: 28, moveSpeed: 26,
    attackWindupMs: 460, attackRecoverMs: 620,
    bountyGold: 70, bountyXp: 42,
    visual: { silhouetteW: 24, silhouetteH: 30, colorBody: '#3a4a5a', colorTrim: '#c24237', weaponShape: 'maul', headRadius: 8 },
    audio: { spawnCue: 'open', attackCue: 'axeReveal', deathCue: 'lose' },
  }),

  // ── Era 3 — Sun Foundry
  u({
    id: 'brass-skirmisher', eraId: 'sun-foundry', name: 'Brass Skirmisher', role: 'frontline',
    cost: 90, spawnCooldownMs: 1000,
    hp: 130, damage: 17, range: 28, moveSpeed: 64,
    attackWindupMs: 220, attackRecoverMs: 360,
    bountyGold: 36, bountyXp: 22,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#c08840', colorTrim: '#ffcb6b', weaponShape: 'sabre', headRadius: 7 },
  }),
  u({
    id: 'steam-caster', eraId: 'sun-foundry', name: 'Steam Caster', role: 'ranged',
    cost: 130, spawnCooldownMs: 1900,
    hp: 80, damage: 22, range: 150, moveSpeed: 50,
    attackWindupMs: 360, attackRecoverMs: 580,
    projectileId: 'steam-bolt',
    bountyGold: 52, bountyXp: 31,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#a26830', colorTrim: '#ffcb6b', weaponShape: 'rifle', headRadius: 7 },
    audio: { spawnCue: 'confirm', attackCue: 'shot', deathCue: 'error' },
  }),
  u({
    id: 'forge-hauler', eraId: 'sun-foundry', name: 'Forge Hauler', role: 'heavy',
    cost: 240, spawnCooldownMs: 4000,
    hp: 460, damage: 46, range: 30, moveSpeed: 24,
    attackWindupMs: 480, attackRecoverMs: 660,
    bountyGold: 96, bountyXp: 58,
    visual: { silhouetteW: 28, silhouetteH: 32, colorBody: '#7a4818', colorTrim: '#ffcb6b', weaponShape: 'piledriver', headRadius: 8 },
    audio: { spawnCue: 'open', attackCue: 'axeReveal', deathCue: 'lose' },
  }),

  // ── Era 4 — Storm Republic
  u({
    id: 'rail-trooper', eraId: 'storm-republic', name: 'Rail Trooper', role: 'frontline',
    cost: 130, spawnCooldownMs: 1050,
    hp: 200, damage: 24, range: 30, moveSpeed: 66,
    attackWindupMs: 200, attackRecoverMs: 340,
    bountyGold: 52, bountyXp: 31,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#3a586c', colorTrim: '#7be3ff', weaponShape: 'bayonet', headRadius: 7 },
  }),
  u({
    id: 'voltaic-sharpshooter', eraId: 'storm-republic', name: 'Voltaic Sharpshooter', role: 'ranged',
    cost: 180, spawnCooldownMs: 2100,
    hp: 130, damage: 30, range: 175, moveSpeed: 52,
    attackWindupMs: 340, attackRecoverMs: 600,
    projectileId: 'arc-bolt',
    bountyGold: 72, bountyXp: 43,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#2a4858', colorTrim: '#7be3ff', weaponShape: 'arc-rifle', headRadius: 7 },
    audio: { spawnCue: 'confirm', attackCue: 'shot', deathCue: 'error' },
  }),
  u({
    id: 'howitzer-walker', eraId: 'storm-republic', name: 'Howitzer Walker', role: 'heavy',
    cost: 320, spawnCooldownMs: 4400,
    hp: 700, damage: 60, range: 32, moveSpeed: 22,
    attackWindupMs: 500, attackRecoverMs: 720,
    bountyGold: 128, bountyXp: 76,
    visual: { silhouetteW: 30, silhouetteH: 34, colorBody: '#1f2c3c', colorTrim: '#7be3ff', weaponShape: 'howitzer', headRadius: 9 },
    audio: { spawnCue: 'open', attackCue: 'axeReveal', deathCue: 'lose' },
  }),

  // ── Era 5 — Void Ascendancy
  u({
    id: 'cinder-wraith', eraId: 'void-ascendancy', name: 'Cinder Wraith', role: 'frontline',
    cost: 180, spawnCooldownMs: 1100,
    hp: 300, damage: 32, range: 32, moveSpeed: 70,
    attackWindupMs: 200, attackRecoverMs: 320,
    bountyGold: 72, bountyXp: 43,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#5a3a8a', colorTrim: '#e9c8ff', weaponShape: 'edge', headRadius: 7 },
  }),
  u({
    id: 'echo-lance', eraId: 'void-ascendancy', name: 'Echo Lance', role: 'ranged',
    cost: 240, spawnCooldownMs: 2200,
    hp: 200, damage: 40, range: 200, moveSpeed: 56,
    attackWindupMs: 360, attackRecoverMs: 600,
    projectileId: 'void-orb',
    bountyGold: 96, bountyXp: 58,
    visual: { silhouetteW: 18, silhouetteH: 24, colorBody: '#3a2466', colorTrim: '#e9c8ff', weaponShape: 'lance', headRadius: 7 },
    audio: { spawnCue: 'confirm', attackCue: 'shot', deathCue: 'error' },
  }),
  u({
    id: 'singular-colossus', eraId: 'void-ascendancy', name: 'Singular Colossus', role: 'heavy',
    cost: 420, spawnCooldownMs: 5000,
    hp: 1100, damage: 78, range: 34, moveSpeed: 20,
    attackWindupMs: 540, attackRecoverMs: 740,
    bountyGold: 168, bountyXp: 100,
    visual: { silhouetteW: 32, silhouetteH: 36, colorBody: '#1a0a3a', colorTrim: '#e9c8ff', weaponShape: 'colossus-fist', headRadius: 9 },
    audio: { spawnCue: 'open', attackCue: 'axeReveal', deathCue: 'lose' },
  }),
];

export const UNITS_BY_ID = Object.freeze(
  UNITS.reduce((acc, def) => { acc[def.id] = def; return acc; }, /** @type {Record<string, UnitDef>} */ ({})),
);

export function getUnit(id) {
  return UNITS_BY_ID[id] || null;
}
