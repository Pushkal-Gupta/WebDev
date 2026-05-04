// 15 turret defs — three per era (light / medium / heavy).
// Light = cheap fast-firing chip damage
// Medium = balanced (the era's signature pick)
// Heavy = expensive high-damage slow firing
// The era's "primary" turret (returned by getTurretForEra) is the
// medium tier — what auto-upgrade and the AI default to.

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
  // ── Era 1 — Ember Tribe ────────────────────────────────────────
  {
    id: 'rock-thrower', eraId: 'ember-tribe', name: 'Rock Thrower', tier: 'light',
    buildCost: 50,  damage: 6,   range: 200, cooldownMs: 700,
    projectileId: 'bone-shard',
    visual: { baseColor: '#5a3c20', barrelColor: '#cdb89a', kind: 'crossbow' },
    blurb: 'Cheap chip damage. Best with two upgrades on rate.',
  },
  {
    id: 'bone-crossbow', eraId: 'ember-tribe', name: 'Bone Crossbow', tier: 'medium',
    buildCost: 90,  damage: 14,  range: 220, cooldownMs: 1100,
    projectileId: 'bone-shard',
    visual: { baseColor: '#7c4f2a', barrelColor: '#fff1d2', kind: 'crossbow' },
    blurb: 'Era-current pick. Long pike of split bone.',
  },
  {
    id: 'primal-catapult', eraId: 'ember-tribe', name: 'Primal Catapult', tier: 'heavy',
    buildCost: 200, damage: 36,  range: 240, cooldownMs: 1900,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#3a2010', barrelColor: '#a26830', kind: 'cannon' },
    blurb: 'Slow boulder lobs. Big crater on impact.',
  },

  // ── Era 2 — Iron Dominion ──────────────────────────────────────
  {
    id: 'arrow-tower', eraId: 'iron-dominion', name: 'Arrow Tower', tier: 'light',
    buildCost: 100, damage: 12,  range: 240, cooldownMs: 700,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#2a3340', barrelColor: '#d8d4cc', kind: 'crossbow' },
    blurb: 'Multi-shot arrows. Pins fast frontliners.',
  },
  {
    id: 'iron-ballista', eraId: 'iron-dominion', name: 'Iron Ballista', tier: 'medium',
    buildCost: 160, damage: 26,  range: 250, cooldownMs: 1100,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#3a4858', barrelColor: '#d8d4cc', kind: 'bell' },
    blurb: 'Era-current pick. Heavy bolt thrower.',
  },
  {
    id: 'oil-pot', eraId: 'iron-dominion', name: 'Oil Pot', tier: 'heavy',
    buildCost: 280, damage: 8,   range: 220, cooldownMs: 600,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#3a2a14', barrelColor: '#c24237', kind: 'cannon' },
    blurb: 'Fast-tick area damage. Best on heavy clusters.',
  },

  // ── Era 3 — Sun Foundry ────────────────────────────────────────
  {
    id: 'small-cannon', eraId: 'sun-foundry', name: 'Small Cannon', tier: 'light',
    buildCost: 160, damage: 22,  range: 260, cooldownMs: 800,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#5a3a1a', barrelColor: '#ffcb6b', kind: 'cannon' },
    blurb: 'Brass barrel. Quick reload, modest punch.',
  },
  {
    id: 'brass-mortar', eraId: 'sun-foundry', name: 'Brass Mortar', tier: 'medium',
    buildCost: 240, damage: 44,  range: 270, cooldownMs: 1300,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#7a4818', barrelColor: '#ffcb6b', kind: 'cannon' },
    blurb: 'Era-current pick. Steam-fed shells with AOE.',
  },
  {
    id: 'explosive-cannon', eraId: 'sun-foundry', name: 'Explosive Cannon', tier: 'heavy',
    buildCost: 420, damage: 80,  range: 280, cooldownMs: 1900,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#3a1f12', barrelColor: '#ffd97a', kind: 'cannon' },
    blurb: 'Heavy shells. Wide blast radius.',
  },

  // ── Era 4 — Storm Republic ─────────────────────────────────────
  {
    id: 'single-turret', eraId: 'storm-republic', name: 'Single Turret', tier: 'light',
    buildCost: 220, damage: 32,  range: 280, cooldownMs: 700,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#0c121b', barrelColor: '#7be3ff', kind: 'tesla' },
    blurb: 'Machine-gun of the lane. Sustained fire.',
  },
  {
    id: 'volt-cannon', eraId: 'storm-republic', name: 'Volt Cannon', tier: 'medium',
    buildCost: 340, damage: 70,  range: 290, cooldownMs: 1100,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#1f2c3c', barrelColor: '#7be3ff', kind: 'tesla' },
    blurb: 'Era-current pick. Capacitor arc gun.',
  },
  {
    id: 'double-turret', eraId: 'storm-republic', name: 'Double Turret', tier: 'heavy',
    buildCost: 580, damage: 50,  range: 290, cooldownMs: 540,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#0a0e15', barrelColor: '#bef3ff', kind: 'tesla' },
    blurb: 'Twin barrels. Highest sustained DPS in the era.',
  },

  // ── Era 5 — Void Ascendancy ────────────────────────────────────
  {
    id: 'titanium-shooter', eraId: 'void-ascendancy', name: 'Titanium Shooter', tier: 'light',
    buildCost: 320, damage: 50,  range: 300, cooldownMs: 700,
    projectileId: 'void-orb',
    visual: { baseColor: '#0a0418', barrelColor: '#c89bff', kind: 'lance' },
    blurb: 'Fast-cycle laser. Strafes the lane.',
  },
  {
    id: 'void-lance', eraId: 'void-ascendancy', name: 'Void Lance', tier: 'medium',
    buildCost: 460, damage: 110, range: 320, cooldownMs: 1300,
    projectileId: 'void-orb',
    visual: { baseColor: '#1a0a3a', barrelColor: '#e9c8ff', kind: 'lance' },
    blurb: 'Era-current pick. Resonance lance.',
  },
  {
    id: 'ion-ray', eraId: 'void-ascendancy', name: 'Ion Ray', tier: 'heavy',
    buildCost: 780, damage: 240, range: 360, cooldownMs: 2200,
    projectileId: 'void-orb',
    visual: { baseColor: '#04001a', barrelColor: '#bef3ff', kind: 'lance' },
    blurb: 'Apex turret. Slow charge, devastating beam.',
  },
];

export const TURRETS_BY_ID = Object.freeze(
  TURRETS.reduce((acc, def) => { acc[def.id] = def; return acc; }, /** @type {Record<string, TurretDef>} */ ({})),
);
// `TURRETS_BY_ERA[eraId]` returns the era's MEDIUM tier — the
// primary pick that auto-upgrade and the AI default to. The
// per-era full list (light + medium + heavy) is exposed via
// `getTurretsForEra` for the picker UI.
export const TURRETS_BY_ERA = Object.freeze(
  TURRETS
    .filter((d) => d.tier === 'medium')
    .reduce((acc, def) => { acc[def.eraId] = def; return acc; }, /** @type {Record<string, TurretDef>} */ ({})),
);

export function getTurret(id) { return TURRETS_BY_ID[id] || null; }
export function getTurretForEra(eraId) { return TURRETS_BY_ERA[eraId] || null; }
export function getTurretsForEra(eraId) { return TURRETS.filter((d) => d.eraId === eraId); }

// 50% refund of the most recent build cost.
export const SELL_REFUND_PCT = 0.5;
