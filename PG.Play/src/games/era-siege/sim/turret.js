// Turret build / sell / tick. Slots are persistent across eras; building
// in a slot during era N installs era N's turret class.

import { getTurretForEra, SELL_REFUND_PCT } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';
import { spawnProjectile } from './projectile.js';
import { BALANCE } from '../content/balance.js';

// Lay a turret spot in the given slot. Cheap foundation cost — the
// player commits to this slot before deciding which turret to place.
// No-op if a spot already exists.
export function tryBuildTurretSpot(state, side, slot) {
  if (slot < 0 || slot >= BALANCE.TURRET_SLOT_COUNT) return false;
  if (!side.turretSpots) {
    side.turretSpots = Array.from({ length: BALANCE.TURRET_SLOT_COUNT }, () => false);
  }
  if (side.turretSpots[slot]) return false;     // already built
  const cost = BALANCE.TURRET_SPOT_COST;
  if (side.gold < cost) {
    state.bus.emit('low_gold_error', { reason: 'gold', slot, cost, gold: side.gold });
    return false;
  }
  side.gold -= cost;
  side.turretSpots[slot] = true;
  state.bus.emit('turret_spot_built', { team: side.team, slot });
  return true;
}

export function tryBuildTurret(state, side, slot) {
  if (slot < 0 || slot >= BALANCE.TURRET_SLOT_COUNT) return false;
  const era = getEraByIndex(side.eraIndex);
  const def = getTurretForEra(era.id);
  if (!def) return false;
  // If the slot already has a turret of the *current* era, no-op.
  const existing = side.turretSlots[slot];
  if (existing && existing.eraIndex === side.eraIndex) {
    state.bus.emit('low_gold_error', { reason: 'turret_already_current', slot });
    return false;
  }
  // Auto-lay a spot if one isn't built yet (covers tests + AI which
  // call tryBuildTurret directly without a separate spot phase). The
  // UI flow calls tryBuildTurretSpot first explicitly. Total cost
  // when laying both: SPOT_COST + def.buildCost.
  if (!side.turretSpots) {
    side.turretSpots = Array.from({ length: BALANCE.TURRET_SLOT_COUNT }, () => false);
  }
  const needsSpot = !side.turretSpots[slot];
  const totalCost = (needsSpot ? BALANCE.TURRET_SPOT_COST : 0) + def.buildCost;
  if (side.gold < totalCost) {
    state.bus.emit('low_gold_error', { reason: 'gold', slot, cost: totalCost, gold: side.gold });
    return false;
  }
  side.gold -= totalCost;
  side.turretSpots[slot] = true;
  side.turretSlots[slot] = makeTurretInstance(state, side, def, slot);
  if (side === state.player) state.statsPlayer.turretsBuilt++;
  else                       state.statsEnemy.turretsBuilt++;
  state.bus.emit('turret_built', { team: side.team, slot, turretId: def.id, era: side.eraIndex });
  return true;
}

export function trySellTurret(state, side, slot) {
  if (slot < 0 || slot >= BALANCE.TURRET_SLOT_COUNT) return false;
  const t = side.turretSlots[slot];
  if (!t) return false;
  const refund = Math.round(t.buildCost * SELL_REFUND_PCT);
  // Refund pays out in full, even above GOLD_CAP — see economy.js.
  side.gold += refund;
  side.turretSlots[slot] = null;
  state.bus.emit('turret_sold', { team: side.team, slot, refund });
  return true;
}

function makeTurretInstance(state, side, def, slot) {
  const baseX = side === state.player
    ? state.view.laneLeft - 50
    : state.view.laneRight + 50;
  return {
    id: state.allocId(),
    kind: 'turret',
    team: side.team,
    turretId: def.id,
    eraIndex: side.eraIndex,
    slot,
    x: baseX + (side === state.player ? 28 : -28),
    y: state.view.groundY - BALANCE.TURRET_ROW_Y_PX - slot * 22,
    facing: side === state.player ? 1 : -1,
    damage: def.damage,
    range: def.range,
    cooldownMs: 0,
    cooldownMaxMs: def.cooldownMs,
    projectileId: def.projectileId,
    buildCost: def.buildCost,
    visual: def.visual,
    // Per-turret upgrades. Each level applies a multiplier to the
    // matching base stat. Capped at TURRET_UPGRADE_MAX so a single
    // turret can't outscale the rest of the side.
    rangeLevel:  0,
    damageLevel: 0,
    rateLevel:   0,
  };
}

// Per-turret stat upgrades. Each level costs the same as the previous
// (linear), each adds a flat multiplier. Caps at TURRET_UPGRADE_MAX.
const TURRET_UPGRADE_MAX = 3;
const TURRET_UPGRADE_BASE_COST = 60;
const TURRET_UPGRADE_DEFS = {
  range:  { label: 'Range',  multPerLevel: 1.20, statKey: 'range',         levelKey: 'rangeLevel'  },
  damage: { label: 'Damage', multPerLevel: 1.25, statKey: 'damage',        levelKey: 'damageLevel' },
  rate:   { label: 'Rate',   multPerLevel: 0.85, statKey: 'cooldownMaxMs', levelKey: 'rateLevel'   },
};

export function turretUpgradeCost(level) {
  // Linear ramp — level 0→1 = 60g, 1→2 = 120g, 2→3 = 180g.
  return TURRET_UPGRADE_BASE_COST * (level + 1);
}

export function tryUpgradeTurretStat(state, side, slot, statId) {
  const t = side.turretSlots[slot];
  if (!t) return false;
  const def = TURRET_UPGRADE_DEFS[statId];
  if (!def) return false;
  const lvl = t[def.levelKey] | 0;
  if (lvl >= TURRET_UPGRADE_MAX) {
    state.bus.emit('low_gold_error', { reason: 'upgrade_maxed', slot, statId });
    return false;
  }
  const cost = turretUpgradeCost(lvl);
  if (side.gold < cost) {
    state.bus.emit('low_gold_error', { reason: 'gold', slot, cost, gold: side.gold });
    return false;
  }
  side.gold -= cost;
  t[def.levelKey] = lvl + 1;
  // Apply the multiplier directly to the live stat. Cooldown uses a
  // <1 multiplier (fewer ms between shots = faster fire rate).
  t[def.statKey] = Math.round(t[def.statKey] * def.multPerLevel);
  state.bus.emit('turret_upgraded', { team: side.team, slot, statId, level: lvl + 1 });
  return true;
}

export { TURRET_UPGRADE_MAX };

export function tickTurrets(state, dt) {
  for (const side of [state.player, state.enemy]) {
    const foeSide = side === state.player ? state.enemy : state.player;
    for (let i = 0; i < side.turretSlots.length; i++) {
      const t = side.turretSlots[i];
      if (!t) continue;
      // Reseat in case view changed.
      t.y = state.view.groundY - BALANCE.TURRET_ROW_Y_PX - i * 22;
      t.x = side === state.player
        ? state.view.laneLeft - 22
        : state.view.laneRight + 22;
      // If turret eraIndex < side.eraIndex, mark as upgradeable but still tick.
      t.cooldownMs = Math.max(0, t.cooldownMs - dt * 1000);
      if (t.cooldownMs > 0) continue;
      const target = pickTurretTarget(t, foeSide.units);
      if (!target) continue;
      // Fake-aim & fire.
      spawnProjectile(state, t, target, side);
      t.cooldownMs = t.cooldownMaxMs;
    }
  }
}

function pickTurretTarget(t, foes) {
  let best = null, bestPriority = -1;
  for (const f of foes) {
    if (f.dead || f.hp <= 0) continue;
    const dx = f.x - t.x;
    const ad = Math.abs(dx);
    if (ad > t.range) continue;
    // Prefer units that are deeper into the player's side (i.e. closer to t).
    const priority = t.range - ad;
    if (priority > bestPriority) { bestPriority = priority; best = f; }
  }
  return best;
}
