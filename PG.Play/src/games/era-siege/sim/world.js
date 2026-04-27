// MatchState factory + tick orchestrator. The sim is framework-agnostic:
// no React, no DOM. Inputs are the `intents` bus per tick, the world
// mutates in place, and events flow out through the `bus` for HUD + audio.

import { BALANCE } from '../content/balance.js';
import { getEra, ERAS } from '../content/eras.js';
import { getDifficulty } from '../content/difficulties.js';
import { makeRng, makeRngHelpers, newSeed } from '../utils/random.js';
import { makeIdAllocator } from '../utils/ids.js';
import { makePool } from '../utils/objectPool.js';
import { makeBus } from '../utils/eventBus.js';
import { tickUnits } from './unit.js';
import { tickTurrets } from './turret.js';
import { tickProjectiles } from './projectile.js';
import { tickEconomy } from './economy.js';
import { tickProgression, tryEvolve } from './progression.js';
import { tickAi } from './ai.js';
import { tickSpecials, tryFireSpecial } from './specials.js';
import { trySpawnUnit } from './unit.js';
import { tryBuildTurret, trySellTurret } from './turret.js';
import { matchOver, scoreMatch } from './match.js';
import { tickEffects } from './effects.js';
import { makePowerupsState, tryBuyPowerup, getMultiplier } from './powerups.js';

/**
 * Build a fresh MatchState. Pure factory — no side effects.
 * @param {{ difficulty?: 'skirmish'|'standard'|'conquest', seed?: number, endlessMode?: boolean, view?: { w:number, h:number } }} opts
 */
export function createMatch(opts = {}) {
  const difficulty = getDifficulty(opts.difficulty || 'standard');
  const seed = opts.seed ?? newSeed();
  const rng = makeRng(seed);
  const helpers = makeRngHelpers(rng);
  const view = {
    w: opts.view?.w || 820,
    h: opts.view?.h || 420,
    laneLeft:  BALANCE.LANE_LEFT_OFFSET,
    laneRight: (opts.view?.w || 820) - BALANCE.LANE_RIGHT_OFFSET,
    groundY:   (opts.view?.h || 420) - BALANCE.GROUND_BOTTOM_PAD,
  };

  const bus = makeBus();

  // Pools used in the hot path.
  const projectilePool = makePool(
    () => ({ id: 0, kind: 'projectile', alive: false, team: 'player', defId: '', x: 0, y: 0, vx: 0, vy: 0, damage: 0, ttlMs: 0 }),
    (o) => { o.alive = false; o.team = 'player'; o.defId = ''; o.x = 0; o.y = 0; o.vx = 0; o.vy = 0; o.damage = 0; o.ttlMs = 0; },
    96,
  );
  const particlePool = makePool(
    () => ({ id: 0, alive: false, x: 0, y: 0, vx: 0, vy: 0, lifeMs: 0, maxLifeMs: 0, color: '#fff', size: 2 }),
    (o) => { o.alive = false; o.x = 0; o.y = 0; o.vx = 0; o.vy = 0; o.lifeMs = 0; o.maxLifeMs = 0; o.color = '#fff'; o.size = 2; },
    160,
  );
  const damageNumPool = makePool(
    () => ({ id: 0, alive: false, x: 0, y: 0, ageMs: 0, lifeMs: 800, value: 0, team: 'player' }),
    (o) => { o.alive = false; o.x = 0; o.y = 0; o.ageMs = 0; o.lifeMs = 800; o.value = 0; o.team = 'player'; },
    32,
  );

  const allocId = makeIdAllocator();

  const makeSide = (team, eraIdx, isAi) => ({
    team,
    base: { hp: BALANCE.BASE_HP, maxHp: BALANCE.BASE_HP },
    gold: team === 'player' ? difficulty.startingGold : 100,
    goldAcc: 0,
    xp: 0,
    eraIndex: 0,
    units: [],            // active unit list, Maintained by sim/unit.js
    turretSlots: Array.from({ length: BALANCE.TURRET_SLOT_COUNT }, () => null),
    specialCooldownMs: 0,
    specialActive: null,  // { specialId, telegraphLeftMs, eraIndex } when telegraphing
    auraLeftMs: 0,        // aura special — duration left
    powerups: makePowerupsState(),
    ai: isAi ? {
      decisionTimerMs: 1000,
      spawnIntentMs: 1500,
      lastEvolveAtSec: 0,
    } : null,
  });

  const state = {
    timeMs: 0,
    timeSec: 0,
    seed,
    rng: helpers,
    difficulty,
    view,
    bus,
    pools: {
      projectile: projectilePool,
      particle:   particlePool,
      damageNum:  damageNumPool,
    },
    allocId,
    player: makeSide('player', 0, false),
    enemy:  makeSide('enemy',  0, true),
    effects: { shakeMs: 0, shakeMag: 0, flashMs: 0, flashColor: '#fff', flashAlpha: 0, rings: [], explosions: [] },
    lowFx: false,          // toggled at runtime by the perf monitor on mobile
    endlessMode: !!opts.endlessMode,
    endlessTimeSec: 0,     // ticks while endlessMode is on
    status: 'playing',     // 'playing' | 'won' | 'lost'
    winner: null,
    statsPlayer: { unitsSpawned: 0, turretsBuilt: 0, specialsUsed: 0, kills: 0 },
    statsEnemy:  { unitsSpawned: 0, turretsBuilt: 0, specialsUsed: 0, kills: 0 },
  };

  bus.emit('match_start', { difficulty: state.difficulty.id, seed: state.seed });
  return state;
}

export function setView(state, w, h) {
  state.view.w = w;
  state.view.h = h;
  state.view.laneLeft  = BALANCE.LANE_LEFT_OFFSET;
  state.view.laneRight = w - BALANCE.LANE_RIGHT_OFFSET;
  // Ground line: prefer the ratio (~62% of stage) so the battlefield
  // band takes up ~38% of the stage height (was ~12% under the old
  // GROUND_BOTTOM_PAD-only layout). The pad acts as a hard floor so
  // tight viewports never crop unit feet against the bottom edge.
  const ratioY = Math.round(h * (BALANCE.STAGE_GROUND_RATIO || 0.62));
  const padY   = h - BALANCE.GROUND_BOTTOM_PAD;
  state.view.groundY   = Math.min(ratioY, padY);
  // Reseat units onto the new ground; clamp x in case of a shrink.
  for (const u of state.player.units) { u.y = state.view.groundY; u.x = clampX(u.x, state.view); }
  for (const u of state.enemy.units)  { u.y = state.view.groundY; u.x = clampX(u.x, state.view); }
}

function clampX(x, v) {
  return Math.max(v.laneLeft - 30, Math.min(v.laneRight + 30, x));
}

/**
 * Apply player intents (only — AI intents are applied inside tickAi).
 */
function applyPlayerIntents(state, intents) {
  if (!intents) return;
  if (intents.evolve) {
    tryEvolve(state, state.player);
  }
  if (intents.spawn) {
    for (const unitId of intents.spawn) trySpawnUnit(state, state.player, unitId);
  }
  if (intents.buildTurret) {
    tryBuildTurret(state, state.player, intents.buildTurret.slot);
  }
  if (intents.sellTurret != null) {
    trySellTurret(state, state.player, intents.sellTurret);
  }
  if (intents.special) {
    tryFireSpecial(state, state.player);
  }
  if (intents.buyPowerup) {
    tryBuyPowerup(state, state.player, intents.buyPowerup);
  }
}

const SIM_DT = 1 / 60;
const MAX_STEPS_PER_FRAME = 4;

/**
 * Drive the simulation for `frameDtSec` real time. Internally the sim
 * runs in fixed steps; multiple steps may run per call.
 *
 * @param {ReturnType<typeof createMatch>} state
 * @param {number} frameDtSec  Real-time delta since last call (capped 0.05s)
 * @param {object} intents     { spawn?:string[], buildTurret?:{slot:number}, sellTurret?:number, special?:bool, evolve?:bool }
 * @returns {{ stepsRun:number }}
 */
export function tick(state, frameDtSec, intents) {
  if (state.status !== 'playing') return { stepsRun: 0 };
  // Accumulator: drain in fixed SIM_DT steps, cap at MAX_STEPS_PER_FRAME.
  state._acc = (state._acc || 0) + Math.min(0.05, Math.max(0, frameDtSec));
  let steps = 0;
  while (state._acc >= SIM_DT && steps < MAX_STEPS_PER_FRAME) {
    runStep(state, SIM_DT, steps === 0 ? intents : null);
    state._acc -= SIM_DT;
    steps++;
  }
  return { stepsRun: steps };
}

function runStep(state, dt, intents) {
  state.timeMs += dt * 1000;
  state.timeSec = state.timeMs / 1000;
  if (state.endlessMode) state.endlessTimeSec += dt;

  if (intents) applyPlayerIntents(state, intents);

  tickEconomy(state, dt);
  tickAi(state, dt);

  tickSpecials(state, dt);
  tickUnits(state, dt);
  tickTurrets(state, dt);
  tickProjectiles(state, dt);
  tickProgression(state, dt);
  tickEffects(state, dt);

  // Endless mode: refill enemy base HP slowly so it can never fall.
  // Also auto-tick the enemy era so the player faces escalating waves.
  if (state.endlessMode) {
    state.enemy.base.hp = Math.min(state.enemy.base.maxHp, state.enemy.base.hp + 30 * dt);
    // Force-evolve the enemy on a 30s clock until era 5.
    if (state.enemy.eraIndex < 4 && state.endlessTimeSec >= 30 * (state.enemy.eraIndex + 1)) {
      state.enemy.eraIndex++;
      state.bus.emit('era_reached', { team: 'enemy', era: state.enemy.eraIndex });
    }
  }

  const over = matchOver(state);
  if (over) {
    state.status = over;
    state.winner = over === 'won' ? 'player' : 'enemy';
    state.bus.emit('match_end', {
      won: over === 'won',
      era: state.player.eraIndex,
      timeSec: Math.round(state.timeSec),
      hp: state.player.base.hp,
      stats: state.statsPlayer,
      score: scoreMatch(state),
      difficulty: state.difficulty.id,
    });
  }
}

export function teardownMatch(state) {
  if (!state) return;
  state.bus.clear();
  state.player.units.length = 0;
  state.enemy.units.length = 0;
  state.pools.projectile.clear();
  state.pools.particle.clear();
  state.pools.damageNum.clear();
}

// Re-exports so the React shell only imports from world.js.
export { ERAS };
export { getEra };
export { scoreMatch } from './match.js';
export { POWERUP_DEFS, nextLevelCost, getMultiplier } from './powerups.js';
