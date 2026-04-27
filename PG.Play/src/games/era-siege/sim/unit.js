// Unit spawn + tick. Unit logic intentionally lives here, not on individual
// entity objects, so the simulation stays simple to read and serialise.

import { getUnit } from '../content/units.js';
import { ERAS_BY_ID } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';
import { damageUnit, damageBase } from './combat.js';
import { spawnProjectile } from './projectile.js';

const UNIT_REPULSE_PX = BALANCE.UNIT_REPULSE_PX;

export function trySpawnUnit(state, side, unitId) {
  const def = getUnit(unitId);
  if (!def) return false;
  // Era gate: side must be in def.eraId or later.
  const eraIdxOfDef = getEraIndexOfUnit(def);
  if (eraIdxOfDef > side.eraIndex) {
    state.bus.emit('low_gold_error', { unitId, gold: side.gold, cost: def.cost, reason: 'era_locked' });
    return false;
  }
  if (side.gold < def.cost) {
    state.bus.emit('low_gold_error', { unitId, gold: side.gold, cost: def.cost, reason: 'gold' });
    return false;
  }
  const cd = side._spawnCooldowns ||= {};
  if ((cd[unitId] || 0) > 0) {
    state.bus.emit('low_gold_error', { unitId, gold: side.gold, cost: def.cost, reason: 'cooldown' });
    return false;
  }
  if (side.units.length >= BALANCE.MAX_UNITS_PER_SIDE) return false;

  side.gold -= def.cost;
  cd[unitId] = def.spawnCooldownMs;

  const id = state.allocId();
  const baseX = side === state.player
    ? state.view.laneLeft + 14
    : state.view.laneRight - 14;
  const facing = side === state.player ? 1 : -1;
  const u = {
    id,
    kind: 'unit',
    team: side.team,
    unitId: def.id,
    name: def.name,
    role: def.role,
    hp: def.hp,
    maxHp: def.hp,
    damage: def.damage,
    range: def.range,
    moveSpeed: def.moveSpeed,
    attackWindupMs: def.attackWindupMs,
    attackRecoverMs: def.attackRecoverMs,
    attackTickPhase: 'idle',     // 'idle' | 'windup' | 'recover'
    attackTimerMs: 0,
    targetId: null,
    bountyGold: def.bountyGold,
    bountyXp: def.bountyXp,
    cost: def.cost,
    projectileId: def.projectileId,
    targetPolicy: def.targetPolicy,
    visual: def.visual,
    audio: def.audio,
    color: def.visual.colorBody,
    silhouetteW: def.visual.silhouetteW,
    silhouetteH: def.visual.silhouetteH,
    facing,
    laneStagger: ((id % 3) - 1) * 2.4,
    x: baseX, y: state.view.groundY,
    px: baseX, py: state.view.groundY, // previous-frame position for render interpolation
    walkPhaseMs: Math.random() * 1000,
    dead: false,
  };
  side.units.push(u);
  if (side === state.player) state.statsPlayer.unitsSpawned++;
  else                       state.statsEnemy.unitsSpawned++;
  state.bus.emit('unit_spawned', { team: side.team, unitId: def.id, era: side.eraIndex });
  return true;
}

function getEraIndexOfUnit(def) {
  if (def._eraIndex != null) return def._eraIndex;
  const era = ERAS_BY_ID[def.eraId];
  def._eraIndex = era ? era.index : 0;
  return def._eraIndex;
}

export function tickUnits(state, dt) {
  // 1) Per-side spawn-cooldown decay.
  for (const side of [state.player, state.enemy]) {
    const cd = side._spawnCooldowns;
    if (cd) {
      for (const k in cd) if (cd[k] > 0) cd[k] = Math.max(0, cd[k] - dt * 1000);
    }
  }

  // 2) Per-unit AI: pick target, advance, attack.
  stepSide(state, state.player, state.enemy, dt);
  stepSide(state, state.enemy, state.player, dt);

  // 3) Friendly repulsion so silhouettes stay readable.
  repel(state.player.units);
  repel(state.enemy.units);

  // 4) Sweep dead.
  state.player.units = state.player.units.filter((u) => !u.dead);
  state.enemy.units  = state.enemy.units.filter((u) => !u.dead);
}

function stepSide(state, side, foeSide, dt) {
  const foeBaseX = foeSide === state.player ? state.view.laneLeft - 30 : state.view.laneRight + 30;
  for (const u of side.units) {
    if (u.dead || u.hp <= 0) continue;
    u.px = u.x; u.py = u.y;

    // Targeting: pick a foe in the lane *forward* of us.
    const target = pickTarget(u, foeSide.units);
    const targetBase = !target;
    const targetX = target ? target.x : foeBaseX;
    const dx = targetX - u.x;
    const distance = Math.abs(dx);

    if (u.attackTickPhase === 'idle' && distance > u.range) {
      // Walk
      u.x += u.facing * u.moveSpeed * dt;
      u.walkPhaseMs += dt * 1000;
      // Clamp to lane bounds — units may slightly overshoot to hit base.
      u.x = clampX(u.x, state.view);
    } else if (u.attackTickPhase === 'idle' && distance <= u.range) {
      // Begin windup
      u.attackTickPhase = 'windup';
      u.attackTimerMs = u.attackWindupMs;
      u.targetId = target ? target.id : null;
    } else if (u.attackTickPhase === 'windup') {
      u.attackTimerMs -= dt * 1000;
      if (u.attackTimerMs <= 0) {
        // Apply damage / fire projectile
        if (u.projectileId) {
          spawnProjectile(state, u, target, side);
        } else {
          if (target && !target.dead && target.hp > 0) {
            damageUnit(state, u, target, u.damage);
          } else if (targetBase) {
            damageBase(state, side, foeSide, u.damage);
          }
        }
        u.attackTickPhase = 'recover';
        u.attackTimerMs = u.attackRecoverMs;
      }
    } else if (u.attackTickPhase === 'recover') {
      u.attackTimerMs -= dt * 1000;
      if (u.attackTimerMs <= 0) u.attackTickPhase = 'idle';
    }
  }
}

function clampX(x, v) {
  return Math.max(v.laneLeft - 50, Math.min(v.laneRight + 50, x));
}

function pickTarget(self, foes) {
  let best = null, bestD = Infinity;
  for (const f of foes) {
    if (f.dead || f.hp <= 0) continue;
    const dx = f.x - self.x;
    const forward = self.facing > 0 ? dx > -8 : dx < 8;  // small bias so we still hit a foe right next to us
    if (!forward) continue;
    const ad = Math.abs(dx);
    if (ad < bestD) { bestD = ad; best = f; }
  }
  return best;
}

function repel(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.dead || b.dead) continue;
      // Don't pry units in attack windup apart — keeps engagement ranges clean.
      if (a.attackTickPhase !== 'idle' || b.attackTickPhase !== 'idle') continue;
      const delta = a.x - b.x;
      const ad = Math.abs(delta);
      if (ad < UNIT_REPULSE_PX) {
        const push = (UNIT_REPULSE_PX - ad) / 2;
        if (delta >= 0) { a.x += push; b.x -= push; }
        else            { a.x -= push; b.x += push; }
      }
    }
  }
}
