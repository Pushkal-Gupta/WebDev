// Era Siege — passive power-up tree. 4 trees × 3 levels.
// Multipliers are read at the exact sim sites that consume them; the
// powerups state itself never ticks. State lives at `side.powerups`.

import { BALANCE } from '../content/balance.js';

/**
 * @typedef {Object} PowerupsState
 * @property {number} economy   0..3 — gold rate +10/+20/+30%
 * @property {number} base      0..3 — max base HP +10/+20/+30%
 * @property {number} special   0..3 — special cooldown -10/-20/-30%
 * @property {number} turret    0..3 — turret damage +10/+20/+30%
 * @property {number} troopDmg  0..3 — non-general unit damage +10/+20/+30%
 * @property {number} troopHp   0..3 — non-general unit HP    +10/+20/+30%
 * @property {number} troopRng  0..3 — ranged-unit reach     +10/+20/+30%
 */

export const POWERUP_DEFS = [
  {
    id: 'economy',
    name: 'Treasury',
    description: 'Gold trickle in faster.',
    color: '#ffe14f',
    levels: [
      { cost: 80,  effect: '+10% gold/sec' },
      { cost: 200, effect: '+20% gold/sec' },
      { cost: 400, effect: '+30% gold/sec' },
    ],
  },
  {
    id: 'base',
    name: 'Bastion',
    description: 'Your wall stands taller.',
    color: '#7be3ff',
    levels: [
      { cost: 80,  effect: '+10% base HP' },
      { cost: 200, effect: '+20% base HP' },
      { cost: 400, effect: '+30% base HP' },
    ],
  },
  {
    id: 'special',
    name: 'Resonance',
    description: 'Specials charge faster.',
    color: '#c89bff',
    levels: [
      { cost: 80,  effect: '-10% cooldown' },
      { cost: 200, effect: '-20% cooldown' },
      { cost: 400, effect: '-30% cooldown' },
    ],
  },
  {
    id: 'turret',
    name: 'Munitions',
    description: 'Turret rounds hit harder.',
    color: '#ffb070',
    levels: [
      { cost: 80,  effect: '+10% turret dmg' },
      { cost: 200, effect: '+20% turret dmg' },
      { cost: 400, effect: '+30% turret dmg' },
    ],
  },
  {
    id: 'troopDmg',
    name: 'Drilled Edge',
    description: 'Your troops swing harder. (Generals unaffected.)',
    color: '#ff8a3a',
    levels: [
      { cost: 100, effect: '+10% troop damage' },
      { cost: 240, effect: '+20% troop damage' },
      { cost: 480, effect: '+30% troop damage' },
    ],
  },
  {
    id: 'troopHp',
    name: 'Conditioning',
    description: 'Your troops take a beating. (Generals unaffected.)',
    color: '#35f0c9',
    levels: [
      { cost: 100, effect: '+10% troop HP' },
      { cost: 240, effect: '+20% troop HP' },
      { cost: 480, effect: '+30% troop HP' },
    ],
  },
  {
    id: 'troopRng',
    name: 'Long-Sighted',
    description: 'Ranged troops reach further. Melee unaffected.',
    color: '#7be3ff',
    levels: [
      { cost: 100, effect: '+10% ranged reach' },
      { cost: 240, effect: '+20% ranged reach' },
      { cost: 480, effect: '+30% ranged reach' },
    ],
  },
];

export function makePowerupsState() {
  return { economy: 0, base: 0, special: 0, turret: 0, troopDmg: 0, troopHp: 0, troopRng: 0 };
}

export function getMultiplier(state, kind) {
  const lvl = (state && state[kind]) | 0;
  switch (kind) {
    case 'economy':  return 1 + 0.10 * lvl;
    case 'base':     return 1 + 0.10 * lvl;
    case 'special':  return 1 - 0.10 * lvl;
    case 'turret':   return 1 + 0.10 * lvl;
    case 'troopDmg': return 1 + 0.10 * lvl;
    case 'troopHp':  return 1 + 0.10 * lvl;
    case 'troopRng': return 1 + 0.10 * lvl;
    default:         return 1;
  }
}

/**
 * Try to purchase the next level of a tree. Returns true on success.
 * Costs scale per level — the def carries them.
 */
export function tryBuyPowerup(state, side, treeId) {
  const def = POWERUP_DEFS.find((d) => d.id === treeId);
  if (!def) return false;
  side.powerups = side.powerups || makePowerupsState();
  const cur = side.powerups[treeId] | 0;
  if (cur >= def.levels.length) {
    state.bus.emit('low_gold_error', { reason: 'powerup_maxed', treeId });
    return false;
  }
  const lvl = def.levels[cur];
  if (side.gold < lvl.cost) {
    state.bus.emit('low_gold_error', { reason: 'gold', treeId, cost: lvl.cost, gold: side.gold });
    return false;
  }
  side.gold -= lvl.cost;
  side.powerups[treeId] = cur + 1;

  // Base tree: instantly raise maxHp and refill the new headroom.
  if (treeId === 'base') {
    const newMax = Math.round(BALANCE.BASE_HP * getMultiplier(side.powerups, 'base'));
    const headroom = newMax - side.base.maxHp;
    side.base.maxHp = newMax;
    side.base.hp = Math.min(newMax, side.base.hp + headroom);
  }

  state.bus.emit('powerup_bought', { team: side.team, treeId, level: side.powerups[treeId] });
  return true;
}

/**
 * Returns the cost of the next purchasable level, or null if maxed.
 */
export function nextLevelCost(side, treeId) {
  const def = POWERUP_DEFS.find((d) => d.id === treeId);
  if (!def) return null;
  const cur = (side.powerups && side.powerups[treeId]) | 0;
  if (cur >= def.levels.length) return null;
  return def.levels[cur].cost;
}
