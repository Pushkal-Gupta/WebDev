// AI director: cadence-based spawner that drifts unit weights with
// pressure, evolves when XP allows, builds turrets when ahead on gold,
// fires specials when player units cluster.
//
// Side-agnostic — `tickAi(state, side, dt)` operates on whichever side
// has an `ai` block. The match runs the AI on `state.enemy` by default.
// The balance simulator opts both sides into the AI for mirror matches.

import { getEraByIndex } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { trySpawnUnit } from './unit.js';
import { tryBuildTurret } from './turret.js';
import { tryEvolve, canEvolve } from './progression.js';
import { tryFireSpecial } from './specials.js';
import { BALANCE } from '../content/balance.js';

const DECISION_INTERVAL_MS = 600;
const SPAWN_INTERVAL_BASE_MS = 1700;
const TURRET_DECISION_GOLD_RESERVE = 80;

export function tickAi(state, dt) {
  // Run AI on every side that opted in.
  if (state.player.ai) tickSideAi(state, state.player, dt);
  if (state.enemy.ai)  tickSideAi(state, state.enemy, dt);
}

function tickSideAi(state, side, dt) {
  const ai = side.ai;
  const diff = state.difficulty;

  ai.decisionTimerMs -= dt * 1000;
  if (ai.decisionTimerMs <= 0) {
    ai.decisionTimerMs = DECISION_INTERVAL_MS;
    aiDecide(state, side, ai, diff);
  }

  ai.spawnIntentMs -= dt * 1000;
  if (ai.spawnIntentMs <= 0) {
    ai.spawnIntentMs = (SPAWN_INTERVAL_BASE_MS / diff.aiSpawnRateMul) * (0.7 + state.rng.next() * 0.6);
    aiTrySpawn(state, side, diff);
  }
}

function aiDecide(state, side, ai, diff) {
  const foeSide = side === state.player ? state.enemy : state.player;

  // 1) Evolve if able.
  if (canEvolve(side)) {
    if (state.rng.next() < diff.aiTechRateMul * 0.6) {
      tryEvolve(state, side);
      ai.lastEvolveAtSec = state.timeSec;
    }
  }

  // 2) Maybe build / upgrade a turret slot.
  if (state.rng.chance(diff.aiTurretChance) && side.gold > 220 + TURRET_DECISION_GOLD_RESERVE) {
    let bestSlot = -1, bestEra = 99;
    for (let i = 0; i < BALANCE.TURRET_SLOT_COUNT; i++) {
      const t = side.turretSlots[i];
      const eraIdx = t ? t.eraIndex : -1;
      if (eraIdx < bestEra) { bestEra = eraIdx; bestSlot = i; }
    }
    if (bestSlot >= 0 && (bestEra < side.eraIndex || bestEra === -1)) {
      tryBuildTurret(state, side, bestSlot);
    }
  }

  // 3) Maybe fire special when foe has many units in front of OUR base.
  // Threshold lowered (no +0.3 buffer) so the AI doesn't only fire on a
  // near-base catastrophe — by then the base is already taking damage.
  if (side.specialCooldownMs <= 0 && !side.specialActive) {
    const cluster = pressureOnSide(side, foeSide, state);
    const threshold = Math.max(0.2, 1 - diff.aiSpecialAggression);
    if (cluster >= threshold) tryFireSpecial(state, side);
  }
}

// Pressure on `side` = how many of `foeSide`'s units are deep into our half.
// "Deep into our half" depends on which side we are: player units march
// right, so they're a threat to enemy when x > mid; enemy units march
// left, so they're a threat to player when x < mid.
function pressureOnSide(side, foeSide, state) {
  if (!foeSide.units.length) return 0;
  const mid = (state.view.laneLeft + state.view.laneRight) / 2;
  let n = 0;
  for (const u of foeSide.units) {
    if (side === state.player) { if (u.x < mid) n++; }
    else                       { if (u.x > mid) n++; }
  }
  return Math.min(1, n / 8);
}

function aiTrySpawn(state, side, diff) {
  const era = getEraByIndex(side.eraIndex);
  if (!era) return;
  const foeSide = side === state.player ? state.enemy : state.player;

  // Distribution drifts with pressure on our side: more pressure → mix in more heavies.
  const rng = state.rng;
  const pressure = pressureOnSide(side, foeSide, state);
  const heavyBias  = 0.2 + pressure * 0.2;
  const rangedBias = 0.3 + pressure * 0.1;
  const r = rng.next();
  let role = 'frontline';
  if (r < heavyBias) role = 'heavy';
  else if (r < heavyBias + rangedBias) role = 'ranged';

  // Fall back through roles if not affordable.
  const tries = [role, 'ranged', 'frontline'];
  for (const tryRole of tries) {
    const candId = pickEraUnitByRole(era, tryRole);
    if (!candId) continue;
    const def = getUnit(candId);
    if (def && side.gold >= def.cost) {
      trySpawnUnit(state, side, candId);
      return;
    }
  }
}

function pickEraUnitByRole(era, role) {
  // era.unitIds order is [frontline, ranged, heavy] — see content/units.js.
  const idx = role === 'frontline' ? 0 : role === 'ranged' ? 1 : 2;
  return era.unitIds[idx];
}

// Helper used by the simulator to opt the player side into AI mode.
export function makeAiBlock() {
  return {
    decisionTimerMs: 1000,
    spawnIntentMs: 1500,
    lastEvolveAtSec: 0,
  };
}
