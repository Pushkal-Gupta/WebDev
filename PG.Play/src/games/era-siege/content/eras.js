// The five eras. Each era points at three units, one turret class, one
// special, and a palette key. xpToEvolve is the threshold the side must
// cross *while in the previous era* to unlock evolve into this one.

import { PALETTES } from './palette.js';
import { readSettings } from '../utils/settings.js';

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
 * @property {string} generalId
 * @property {string} turretId
 * @property {string} specialId
 * @property {string} secondarySpecialId  W-slot — bigger swings, longer cd
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
    generalId: 'pyre-warlord',
    turretId: 'bone-crossbow',
    specialId: 'ember-volley',
    secondarySpecialId: 'meteor-rain',
    paletteId: 'ember-tribe',
    themeLabels: {
      v2: { name: 'Volcanic Basalt', gateName: 'Obsidian Gate' },
    },
  },
  {
    id: 'iron-dominion', index: 1,
    name: 'Iron Dominion',
    blurb: 'Plate. Oath. Banner.',
    xpToEvolve: 60,
    evolveCost: 80,
    goldPerSec: 14,
    unitIds: ['oath-spear', 'crossbow-sworn', 'iron-bastion'],
    generalId: 'iron-marshal',
    turretId: 'iron-ballista',
    specialId: 'iron-rain',
    secondarySpecialId: 'iron-rampart',
    paletteId: 'iron-dominion',
    themeLabels: {
      v2: { name: 'Biolume Reef', gateName: 'Bio-Lume Gate' },
    },
  },
  {
    id: 'sun-foundry', index: 2,
    name: 'Sun Foundry',
    blurb: 'Steam. Brass. Alchemical heat.',
    xpToEvolve: 140,
    evolveCost: 130,
    goldPerSec: 17,
    unitIds: ['brass-skirmisher', 'steam-caster', 'forge-hauler'],
    generalId: 'brass-captain',
    turretId: 'brass-mortar',
    specialId: 'sun-forge',
    secondarySpecialId: 'foundry-mortar',
    paletteId: 'sun-foundry',
    themeLabels: {
      v2: { name: 'Sun Foundry', gateName: 'Sun Foundry Gate' },
    },
  },
  {
    id: 'storm-republic', index: 3,
    name: 'Storm Republic',
    blurb: 'Dieselpunk. Rail. Voltage.',
    xpToEvolve: 250,
    evolveCost: 200,
    goldPerSec: 21,
    unitIds: ['rail-trooper', 'voltaic-sharpshooter', 'howitzer-walker'],
    generalId: 'storm-commodore',
    turretId: 'volt-cannon',
    specialId: 'storm-fork',
    secondarySpecialId: 'voltaic-cascade',
    paletteId: 'storm-republic',
    themeLabels: {
      v2: { name: 'Storm Republic', gateName: 'Storm Republic Gate' },
    },
  },
  {
    id: 'void-ascendancy', index: 4,
    name: 'Void Ascendancy',
    blurb: 'Post-physical. Soft horror.',
    xpToEvolve: 400,
    evolveCost: 320,
    goldPerSec: 26,
    unitIds: ['cinder-wraith', 'echo-lance', 'singular-colossus'],
    generalId: 'void-sovereign',
    turretId: 'void-lance',
    specialId: 'void-collapse',
    secondarySpecialId: 'event-horizon',
    paletteId: 'void-ascendancy',
    themeLabels: {
      v2: { name: 'Void Crystal', gateName: 'Void Crystal Gate' },
    },
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
export function paletteFor(eraId) {
  const base = PALETTES[ERAS_BY_ID[eraId]?.paletteId] || PALETTES['ember-tribe'];
  // Merge active theme-pack overrides over the base so the procedural
  // battlefield recolours to match the selected theme even when no
  // painted art has shipped yet. Tests pass 'classic' implicitly (no
  // settings cache), which returns the base palette unchanged.
  let pack = 'classic';
  try { pack = readSettings().artPack || 'classic'; }
  catch { /* swallow — happens in non-browser contexts */ }
  const overrides = base.themePalettes?.[pack];
  return overrides ? { ...base, ...overrides } : base;
}
