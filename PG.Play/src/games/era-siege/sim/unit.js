// Unit spawn + tick. Unit logic intentionally lives here, not on individual
// entity objects, so the simulation stays simple to read and serialise.

import { getUnit } from '../content/units.js';
import { ERAS_BY_ID } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';
import { damageUnit, damageBase } from './combat.js';
import { spawnProjectile } from './projectile.js';
import { getMultiplier } from './powerups.js';

const UNIT_REPULSE_PX = BALANCE.UNIT_REPULSE_PX;

// ── Spawn queue ──────────────────────────────────────────────────────
// Player-facing flow: click a unit card → tryQueueUnit. Gold is
// deducted IMMEDIATELY (reservation). The queue head auto-spawns on
// every tick once cooldown / pop-cap allow. Cancel a queued unit to
// recover 50% gold.
//
// AI uses trySpawnUnit directly (no queue) so its decision-making
// stays one-shot — easier to tune.

export const QUEUE_MAX = 5;
export const QUEUE_REFUND_PCT = 0.5;

export function tryQueueUnit(state, side, unitId) {
  const def = getUnit(unitId);
  if (!def) return false;
  const eraIdxOfDef = getEraIndexOfUnit(def);
  if (eraIdxOfDef > side.eraIndex) {
    state.bus.emit('low_gold_error', { unitId, reason: 'era_locked' });
    return false;
  }
  // Generals are still gated by the unlock flag and one-living cap —
  // queue them only if they could theoretically spawn.
  if (def.role === 'general' && !side.generalsUnlocked) {
    state.bus.emit('low_gold_error', { unitId, reason: 'general_locked' });
    return false;
  }
  side.spawnQueue ||= [];
  if (side.spawnQueue.length >= QUEUE_MAX) {
    state.bus.emit('low_gold_error', { unitId, reason: 'queue_full' });
    return false;
  }
  // Soft pop check — alive + queued ≤ MAX_UNITS_PER_SIDE so the player
  // can't stockpile a flood the lane can't hold.
  const popUsed = side.units.filter((u) => !u.dead).length + side.spawnQueue.length;
  if (popUsed >= BALANCE.MAX_UNITS_PER_SIDE) {
    state.bus.emit('low_gold_error', { unitId, reason: 'pop_cap' });
    return false;
  }
  if (side.gold < def.cost) {
    state.bus.emit('low_gold_error', { unitId, cost: def.cost, gold: side.gold, reason: 'gold' });
    return false;
  }
  side.gold -= def.cost;
  side.spawnQueue.push({ unitId, queuedAtMs: state.timeMs });
  state.bus.emit('unit_queued', { team: side.team, unitId });
  return true;
}

export function tryCancelQueued(state, side, queueIndex) {
  const q = side.spawnQueue;
  if (!q || queueIndex < 0 || queueIndex >= q.length) return false;
  const item = q[queueIndex];
  const def = getUnit(item.unitId);
  if (def) side.gold += Math.floor(def.cost * QUEUE_REFUND_PCT);
  q.splice(queueIndex, 1);
  state.bus.emit('unit_unqueued', { team: side.team, unitId: item.unitId, refund: def ? Math.floor(def.cost * QUEUE_REFUND_PCT) : 0 });
  return true;
}

// Drain the head of the queue when cooldown + pop-cap allow. Called
// once per side per tick from stepSim.
export function tickSpawnQueue(state, side) {
  const q = side.spawnQueue;
  if (!q || q.length === 0) return;
  const item = q[0];
  const def = getUnit(item.unitId);
  if (!def) { q.shift(); return; }
  const cd = (side._spawnCooldowns?.[item.unitId]) || 0;
  if (cd > 0) return;
  if (side.units.filter((u) => !u.dead).length >= BALANCE.MAX_UNITS_PER_SIDE) return;
  if (def.role === 'general' && side.units.some((u) => u.role === 'general' && !u.dead && u.hp > 0)) return;
  // Pre-paid — bypass cost re-check inside spawnUnitDirect.
  q.shift();
  spawnUnitFromQueue(state, side, def);
}

// Internal — variant of trySpawnUnit that skips cost / cooldown
// rejection because the queue already validated those. Cooldown still
// gets SET to def.spawnCooldownMs for the next queue head.
function spawnUnitFromQueue(state, side, def) {
  const cd = side._spawnCooldowns ||= {};
  cd[def.id] = def.spawnCooldownMs;
  // Reuse the same construction trySpawnUnit does — keep them in sync.
  doSpawn(state, side, def);
}

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
  // Generals: cap at one living per side. The HUD cooldown is mostly
  // there to gate cost; this cap prevents stacking even when cooldown
  // somehow elapses (e.g. AI spawn race, save/load future-proofing).
  if (def.role === 'general') {
    if (!side.generalsUnlocked) {
      state.bus.emit('low_gold_error', { unitId, reason: 'general_locked' });
      return false;
    }
    if (side.units.some((u) => u.role === 'general' && !u.dead && u.hp > 0)) {
      state.bus.emit('low_gold_error', { unitId, reason: 'general_alive' });
      return false;
    }
  }

  side.gold -= def.cost;
  cd[unitId] = def.spawnCooldownMs;
  doSpawn(state, side, def);
  return true;
}

// Shared unit-construction body used by both trySpawnUnit (after gold +
// cooldown checks) and the queue tick (after the queue's pre-payment).
function doSpawn(state, side, def) {
  const eraIdxOfDef = getEraIndexOfUnit(def);
  const id = state.allocId();
  const baseX = side === state.player
    ? state.view.laneLeft + 14
    : state.view.laneRight - 14;
  const facing = side === state.player ? 1 : -1;
  const isGeneral = def.role === 'general';
  const isRanged  = def.role === 'ranged';
  const dmgMul = isGeneral ? 1 : getMultiplier(side.powerups, 'troopDmg');
  const hpMul  = isGeneral ? 1 : getMultiplier(side.powerups, 'troopHp');
  const rngMul = (isGeneral || !isRanged) ? 1 : getMultiplier(side.powerups, 'troopRng');
  const finalHp = Math.round(def.hp * hpMul);
  const u = {
    id,
    kind: 'unit',
    team: side.team,
    unitId: def.id,
    eraId:    def.eraId,
    eraIndex: eraIdxOfDef,
    name: def.name,
    role: def.role,
    hp: finalHp,
    maxHp: finalHp,
    damage: Math.round(def.damage * dmgMul),
    range: Math.round(def.range * rngMul),
    moveSpeed: def.moveSpeed,
    attackWindupMs: def.attackWindupMs,
    attackRecoverMs: def.attackRecoverMs,
    attackTickPhase: 'idle',
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
    px: baseX, py: state.view.groundY,
    walkPhaseMs: Math.random() * 1000,
    dead: false,
  };
  side.units.push(u);
  if (side === state.player) state.statsPlayer.unitsSpawned++;
  else                       state.statsEnemy.unitsSpawned++;
  state.bus.emit('unit_spawned', { team: side.team, unitId: def.id, era: side.eraIndex });
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

  // 1b) Drain the player's spawn queue head if cooldown / pop allow.
  // Enemy AI doesn't queue (it spawns directly via trySpawnUnit) but
  // we tick its (always-empty) queue too for symmetry.
  tickSpawnQueue(state, state.player);
  tickSpawnQueue(state, state.enemy);

  // 2) Per-unit AI: pick target, advance, attack.
  stepSide(state, state.player, state.enemy, dt);
  stepSide(state, state.enemy, state.player, dt);

  // 3) Friendly repulsion so silhouettes stay readable.
  repel(state.player.units);
  repel(state.enemy.units);

  // 4) Death animation tick + sweep. When a unit's `dead` is set, the
  // body lingers for DEATH_ANIM_MS so the renderer can fade + tilt it.
  // Also strip from the live `units` list once dispose threshold passes.
  for (const u of state.player.units) if (u.dead) u.deathAgeMs = (u.deathAgeMs || 0) + dt * 1000;
  for (const u of state.enemy.units)  if (u.dead) u.deathAgeMs = (u.deathAgeMs || 0) + dt * 1000;
  state.player.units = state.player.units.filter((u) => !u.dead || u.deathAgeMs < DEATH_ANIM_MS);
  state.enemy.units  = state.enemy.units.filter((u) => !u.dead || u.deathAgeMs < DEATH_ANIM_MS);
}

const DEATH_ANIM_MS = 380;

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

    // Ranged kiting: if we have a long range and a *melee* foe is within
    // our personal-space radius, back-step instead of standing & shooting.
    // Personal space = 60% of own range. Only ranged units (range > 60)
    // get this behaviour — melee units lean in.
    const isRangedKind = u.range >= 100 && !!u.projectileId;
    if (isRangedKind && target && Math.abs(target.x - u.x) < u.range * 0.45 && (target.range || 0) < 80) {
      // Back-step at half move speed, reset attack windup so we don't
      // shoot mid-retreat. We still face the same direction.
      u.x -= u.facing * u.moveSpeed * 0.5 * dt;
      u.x = clampX(u.x, state.view);
      u.walkPhaseMs += dt * 1000;
      u.attackTickPhase = 'idle';
      u.attackTimerMs = 0;
      continue;
    }

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
  // Two-pass selection so a unit hitting a wall can be re-tasked by a
  // friendly arriving behind it:
  //   Pass 1 — any foe within self.range, regardless of facing. The
  //            attack range itself is the threat radius; if a foe is
  //            inside it, engage (turning around takes zero time in
  //            this sim — pickTarget is the only "decision").
  //   Pass 2 — fall back to the nearest forward foe so units still
  //            advance toward the lane when nothing's in melee.
  // Without pass 1, an enemy frontline parked at the player base would
  // ignore newly-spawned player units behind it and keep grinding the
  // wall — exactly the bug in the user's screenshot.
  let best = null, bestD = Infinity;
  for (const f of foes) {
    if (f.dead || f.hp <= 0) continue;
    const ad = Math.abs(f.x - self.x);
    if (ad <= self.range && ad < bestD) { bestD = ad; best = f; }
  }
  if (best) return best;
  bestD = Infinity;
  for (const f of foes) {
    if (f.dead || f.hp <= 0) continue;
    const dx = f.x - self.x;
    const forward = self.facing > 0 ? dx > -8 : dx < 8;
    if (!forward) continue;
    const ad = Math.abs(dx);
    if (ad < bestD) { bestD = ad; best = f; }
  }
  return best;
}

function repel(arr) {
  // Cross-team repulsion radius is *bigger* than same-team — enemies
  // engaged in melee should still leave visible space between their
  // sprites. Without this, two attacking foes stack at the same x and
  // visually overlap (the user's screenshot shows them merged into a
  // single blob).
  const SAME = UNIT_REPULSE_PX;
  const FOES = UNIT_REPULSE_PX + 14;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.dead || b.dead) continue;
      const sameTeam = a.team === b.team;
      // Same-team units freeze in attack windup so spear-walls hold
      // formation. Cross-team units always repel so foes can't share
      // a pixel column even mid-strike.
      if (sameTeam && (a.attackTickPhase !== 'idle' || b.attackTickPhase !== 'idle')) continue;
      const radius = sameTeam ? SAME : FOES;
      const delta = a.x - b.x;
      const ad = Math.abs(delta);
      if (ad < radius) {
        // Cross-team push at a fraction so attacking units still
        // close to range without bouncing off each other forever.
        const fraction = sameTeam ? 0.5 : 0.35;
        const push = (radius - ad) * fraction;
        if (delta >= 0) { a.x += push; b.x -= push; }
        else            { a.x -= push; b.x += push; }
      }
    }
  }
}
