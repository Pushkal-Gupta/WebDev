// The five eras. Each era points at three units, one turret class, one
// special, and a palette key. xpToEvolve is the threshold the side must
// cross *while in the previous era* to unlock evolve into this one.

import { PALETTES } from './palette.js';

/**
 * @typedef {Object} Era
 * @property {string} id
 * @property {number} index
 * @property {string} name
 * @property {string} blurb
 * @property {number} xpToEvolve
 * @property {number} evolveCost
 * @property {number} goldPerSec
 * @property {string[]} unitIds
 * @property {string} turretId
 * @property {string} specialId
 * @property {string} paletteId
 */

export const ERAS = [
  {
    id: 'ember-tribe', index: 0,
    name: 'Ember Tribe',
    blurb: 'Pre-iron. Fire and bone.',
    xpToEvolve: 0,
    evolveCost: 0,
    goldPerSec: 12,
    unitIds: ['ember-runner', 'bone-slinger', 'pyre-bearer'],
    turretId: 'bone-crossbow',
    specialId: 'ember-volley',
    paletteId: 'ember-tribe',
  },
  {
    id: 'iron-dominion', index: 1,
    name: 'Iron Dominion',
    blurb: 'Plate. Oath. Banner.',
    xpToEvolve: 60,
    evolveCost: 80,
    goldPerSec: 14,
    unitIds: ['oath-spear', 'crossbow-sworn', 'iron-bastion'],
    turretId: 'iron-ballista',
    specialId: 'iron-rain',
    paletteId: 'iron-dominion',
  },
  {
    id: 'sun-foundry', index: 2,
    name: 'Sun Foundry',
    blurb: 'Steam. Brass. Alchemical heat.',
    xpToEvolve: 140,
    evolveCost: 130,
    goldPerSec: 17,
    unitIds: ['brass-skirmisher', 'steam-caster', 'forge-hauler'],
    turretId: 'brass-mortar',
    specialId: 'sun-forge',
    paletteId: 'sun-foundry',
  },
  {
    id: 'storm-republic', index: 3,
    name: 'Storm Republic',
    blurb: 'Dieselpunk. Rail. Voltage.',
    xpToEvolve: 250,
    evolveCost: 200,
    goldPerSec: 21,
    unitIds: ['rail-trooper', 'voltaic-sharpshooter', 'howitzer-walker'],
    turretId: 'volt-cannon',
    specialId: 'storm-fork',
    paletteId: 'storm-republic',
  },
  {
    id: 'void-ascendancy', index: 4,
    name: 'Void Ascendancy',
    blurb: 'Post-physical. Soft horror.',
    xpToEvolve: 400,
    evolveCost: 320,
    goldPerSec: 26,
    unitIds: ['cinder-wraith', 'echo-lance', 'singular-colossus'],
    turretId: 'void-lance',
    specialId: 'void-collapse',
    paletteId: 'void-ascendancy',
  },
];

export const ERAS_BY_ID = Object.freeze(
  ERAS.reduce((acc, era) => { acc[era.id] = era; return acc; }, /** @type {Record<string, Era>} */ ({})),
);

export function getEra(id)         { return ERAS_BY_ID[id] || null; }
export function getEraByIndex(i)   { return ERAS[i] || null; }
export function nextEra(currentId) {
  const cur = getEra(currentId);
  if (!cur) return null;
  return ERAS[cur.index + 1] || null;
}
export function paletteFor(eraId)  { return PALETTES[ERAS_BY_ID[eraId]?.paletteId] || PALETTES['ember-tribe']; }
