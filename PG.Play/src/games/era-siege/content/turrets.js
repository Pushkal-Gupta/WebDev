// 15 turret defs — three per era, structured around the user's
// design rule: longer range = lower damage, shorter range = higher
// damage. The medium tier is the era's signature pick that auto-
// upgrade and the AI default to.
//
//   light  → long range,  low damage,  fast-firing chip
//   medium → mid range,   mid damage,  balanced (default)
//   heavy  → short range, high damage, slow burst
//
// Art note: only the medium tier has unique sprites. light/heavy
// reuse the medium silhouette with a tier tint applied at render
// time (see drawTurretImage in engine/assets/image-draws.js).

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
    id: 'rock-thrower', eraId: 'ember-tribe', name: 'Bone Sling', tier: 'light',
    buildCost: 50,  damage: 5,   range: 280, cooldownMs: 700,
    projectileId: 'bone-shard',
    visual: { baseColor: '#5a3c20', barrelColor: '#cdb89a', kind: 'crossbow' },
    blurb: 'Long-range chip damage. Picks at ranged backline.',
  },
  {
    id: 'bone-crossbow', eraId: 'ember-tribe', name: 'Bone Crossbow', tier: 'medium',
    buildCost: 90,  damage: 14,  range: 220, cooldownMs: 1100,
    projectileId: 'bone-shard',
    visual: { baseColor: '#7c4f2a', barrelColor: '#fff1d2', kind: 'crossbow' },
    blurb: 'Era pick. Balanced bone pike — workhorse turret.',
  },
  {
    id: 'primal-catapult', eraId: 'ember-tribe', name: 'Primal Catapult', tier: 'heavy',
    buildCost: 200, damage: 48,  range: 160, cooldownMs: 1900,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#3a2010', barrelColor: '#a26830', kind: 'cannon' },
    blurb: 'Short-range, devastating boulder. Crushes the front.',
  },

  // ── Era 2 — Iron Dominion ──────────────────────────────────────
  {
    id: 'arrow-tower', eraId: 'iron-dominion', name: 'Arrow Tower', tier: 'light',
    buildCost: 100, damage: 10,  range: 320, cooldownMs: 700,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#2a3340', barrelColor: '#d8d4cc', kind: 'crossbow' },
    blurb: 'Long-range volley. Picks ranged backline.',
  },
  {
    id: 'iron-ballista', eraId: 'iron-dominion', name: 'Iron Ballista', tier: 'medium',
    buildCost: 160, damage: 26,  range: 250, cooldownMs: 1100,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#3a4858', barrelColor: '#d8d4cc', kind: 'bell' },
    blurb: 'Era pick. Balanced bolt thrower.',
  },
  {
    id: 'oil-pot', eraId: 'iron-dominion', name: 'Oil Pot', tier: 'heavy',
    buildCost: 280, damage: 60,  range: 180, cooldownMs: 1700,
    projectileId: 'crossbow-bolt',
    visual: { baseColor: '#3a2a14', barrelColor: '#c24237', kind: 'cannon' },
    blurb: 'Short-range firebomb. Splash on the front line.',
  },

  // ── Era 3 — Sun Foundry ────────────────────────────────────────
  {
    id: 'small-cannon', eraId: 'sun-foundry', name: 'Small Cannon', tier: 'light',
    buildCost: 160, damage: 18,  range: 340, cooldownMs: 800,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#5a3a1a', barrelColor: '#ffcb6b', kind: 'cannon' },
    blurb: 'Long-range brass barrel. Steady chip.',
  },
  {
    id: 'brass-mortar', eraId: 'sun-foundry', name: 'Brass Mortar', tier: 'medium',
    buildCost: 240, damage: 44,  range: 260, cooldownMs: 1300,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#7a4818', barrelColor: '#ffcb6b', kind: 'cannon' },
    blurb: 'Era pick. Steam-fed shells with AOE.',
  },
  {
    id: 'explosive-cannon', eraId: 'sun-foundry', name: 'Explosive Cannon', tier: 'heavy',
    buildCost: 420, damage: 110, range: 200, cooldownMs: 1900,
    projectileId: 'mortar-shell',
    visual: { baseColor: '#3a1f12', barrelColor: '#ffd97a', kind: 'cannon' },
    blurb: 'Short-range, massive blast. Front-line breaker.',
  },

  // ── Era 4 — Storm Republic ─────────────────────────────────────
  {
    id: 'single-turret', eraId: 'storm-republic', name: 'Single Turret', tier: 'light',
    buildCost: 220, damage: 28,  range: 360, cooldownMs: 700,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#0c121b', barrelColor: '#7be3ff', kind: 'tesla' },
    blurb: 'Long-range arc gun. Pins ranged units.',
  },
  {
    id: 'volt-cannon', eraId: 'storm-republic', name: 'Volt Cannon', tier: 'medium',
    buildCost: 340, damage: 70,  range: 280, cooldownMs: 1100,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#1f2c3c', barrelColor: '#7be3ff', kind: 'tesla' },
    blurb: 'Era pick. Capacitor arc gun.',
  },
  {
    id: 'double-turret', eraId: 'storm-republic', name: 'Double Turret', tier: 'heavy',
    buildCost: 580, damage: 140, range: 200, cooldownMs: 1500,
    projectileId: 'arc-bolt',
    visual: { baseColor: '#0a0e15', barrelColor: '#bef3ff', kind: 'tesla' },
    blurb: 'Short-range twin barrels. Highest single-shot DPS.',
  },

  // ── Era 5 — Void Ascendancy ────────────────────────────────────
  {
    id: 'titanium-shooter', eraId: 'void-ascendancy', name: 'Titanium Shooter', tier: 'light',
    buildCost: 320, damage: 42,  range: 400, cooldownMs: 700,
    projectileId: 'void-orb',
    visual: { baseColor: '#0a0418', barrelColor: '#c89bff', kind: 'lance' },
    blurb: 'Long-range laser. Strafes the entire lane.',
  },
  {
    id: 'void-lance', eraId: 'void-ascendancy', name: 'Void Lance', tier: 'medium',
    buildCost: 460, damage: 110, range: 300, cooldownMs: 1300,
    projectileId: 'void-orb',
    visual: { baseColor: '#1a0a3a', barrelColor: '#e9c8ff', kind: 'lance' },
    blurb: 'Era pick. Resonance lance.',
  },
  {
    id: 'ion-ray', eraId: 'void-ascendancy', name: 'Ion Ray', tier: 'heavy',
    buildCost: 780, damage: 320, range: 220, cooldownMs: 2200,
    projectileId: 'void-orb',
    visual: { baseColor: '#04001a', barrelColor: '#bef3ff', kind: 'lance' },
    blurb: 'Apex short-range beam. Devastates anything close.',
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
