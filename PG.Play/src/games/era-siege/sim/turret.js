// Turret build / sell / tick. Slots are persistent across eras; building
// in a slot during era N installs era N's turret class.

import { getTurretForEra, SELL_REFUND_PCT } from '../content/turrets.js';
import { getEraByIndex } from '../content/eras.js';
import { spawnProjectile } from './projectile.js';
import { BALANCE } from '../content/balance.js';

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
  if (side.gold < def.buildCost) {
    state.bus.emit('low_gold_error', { reason: 'gold', slot, cost: def.buildCost, gold: side.gold });
    return false;
  }
  side.gold -= def.buildCost;
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
  side.gold = Math.min(9999, side.gold + refund);
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
  };
}

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
