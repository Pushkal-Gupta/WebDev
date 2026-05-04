// 10 specials — TWO per era (primary + secondary). The primary slot
// fires off Q (telegraphs before impact, counterplay-friendly). The
// secondary slot fires off W (longer cooldown, bigger effect — meant
// for clutch reversals).

/**
 * @typedef {Object} SpecialDef
 * @property {string} id
 * @property {string} eraId
 * @property {string} name
 * @property {string} description
 * @property {number} cooldownMs
 * @property {number} telegraphMs
 * @property {'lane'|'point'|'aura'} mode
 * @property {number} damage
 * @property {number} radius
 * @property {{primary:string, secondary:string, kind:string}} visual
 * @property {{chargeCue:string, impactCue:string}} audio
 */

export const SPECIALS = [
  {
    id: 'ember-volley', eraId: 'ember-tribe', name: 'Ember Volley',
    description: 'A salvo of ember-shafts that rains across the lane.',
    cooldownMs: 28000, telegraphMs: 800,
    mode: 'lane', damage: 60, radius: 0,
    visual: { primary: '#ffe14f', secondary: '#ff8a3a', kind: 'volley' },
    audio: { chargeCue: 'whistle', impactCue: 'cheer' },
  },
  {
    id: 'iron-rain', eraId: 'iron-dominion', name: 'Iron Rain',
    description: 'A rain of iron bolts on the largest enemy cluster.',
    cooldownMs: 32000, telegraphMs: 1100,
    mode: 'point', damage: 110, radius: 90,
    visual: { primary: '#ffe6c0', secondary: '#7c8a98', kind: 'volley' },
    audio: { chargeCue: 'whistle', impactCue: 'axeReveal' },
  },
  {
    id: 'sun-forge', eraId: 'sun-foundry', name: 'Sun Forge',
    description: 'Floods the lane with foundry heat: +25% damage to your units for 4s and burns engaged enemies.',
    cooldownMs: 36000, telegraphMs: 1200,
    mode: 'aura', damage: 180, radius: 120,
    visual: { primary: '#ffcb6b', secondary: '#a26830', kind: 'aura' },
    audio: { chargeCue: 'whistle', impactCue: 'cheer' },
  },
  {
    id: 'storm-fork', eraId: 'storm-republic', name: 'Storm Fork',
    description: 'A forked lightning strike on the densest enemy front.',
    cooldownMs: 38000, telegraphMs: 1100,
    mode: 'point', damage: 240, radius: 110,
    visual: { primary: '#bef3ff', secondary: '#7be3ff', kind: 'storm' },
    audio: { chargeCue: 'whistle', impactCue: 'shot' },
  },
  {
    id: 'void-collapse', eraId: 'void-ascendancy', name: 'Void Collapse',
    description: 'A singularity collapses on the enemy cluster.',
    cooldownMs: 42000, telegraphMs: 1400,
    mode: 'point', damage: 360, radius: 140,
    visual: { primary: '#e9c8ff', secondary: '#1a0a3a', kind: 'singularity' },
    audio: { chargeCue: 'branchCreak', impactCue: 'lose' },
  },

  // ── Secondary specials (W slot) — bigger swings, longer cooldowns.
  {
    id: 'meteor-rain', eraId: 'ember-tribe', name: 'Meteor Rain',
    description: 'Three meteors crash down across the lane. Heavy hits, slow recharge.',
    cooldownMs: 65000, telegraphMs: 1400,
    mode: 'lane', damage: 140, radius: 80,
    visual: { primary: '#ffd05a', secondary: '#a23a1f', kind: 'volley' },
    audio: { chargeCue: 'whistle', impactCue: 'axeReveal' },
  },
  {
    id: 'iron-rampart', eraId: 'iron-dominion', name: 'Iron Rampart',
    description: 'Restores 25% base HP and bolsters every alive ally for 6s.',
    cooldownMs: 75000, telegraphMs: 600,
    mode: 'aura', damage: 0, radius: 0,
    visual: { primary: '#d8d4cc', secondary: '#c24237', kind: 'aura' },
    audio: { chargeCue: 'whistle', impactCue: 'cheer' },
  },
  {
    id: 'foundry-mortar', eraId: 'sun-foundry', name: 'Foundry Mortar',
    description: 'A heavy brass shell explodes on the densest cluster.',
    cooldownMs: 70000, telegraphMs: 1500,
    mode: 'point', damage: 320, radius: 130,
    visual: { primary: '#ffcb6b', secondary: '#5a3a1a', kind: 'volley' },
    audio: { chargeCue: 'whistle', impactCue: 'axeReveal' },
  },
  {
    id: 'voltaic-cascade', eraId: 'storm-republic', name: 'Voltaic Cascade',
    description: 'Chain-lightning across the entire enemy frontline.',
    cooldownMs: 80000, telegraphMs: 1200,
    mode: 'lane', damage: 180, radius: 0,
    visual: { primary: '#bef3ff', secondary: '#3c5777', kind: 'storm' },
    audio: { chargeCue: 'whistle', impactCue: 'shot' },
  },
  {
    id: 'event-horizon', eraId: 'void-ascendancy', name: 'Event Horizon',
    description: 'A vast singularity sweeps the lane. Annihilates non-general units.',
    cooldownMs: 95000, telegraphMs: 1600,
    mode: 'lane', damage: 500, radius: 0,
    visual: { primary: '#e9c8ff', secondary: '#04001a', kind: 'singularity' },
    audio: { chargeCue: 'branchCreak', impactCue: 'lose' },
  },
];

export const SPECIALS_BY_ID = Object.freeze(
  SPECIALS.reduce((acc, def) => { acc[def.id] = def; return acc; }, /** @type {Record<string, SpecialDef>} */ ({})),
);

export function getSpecial(id) { return SPECIALS_BY_ID[id] || null; }
