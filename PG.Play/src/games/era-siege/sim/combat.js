// Damage application + on-death cleanup. Centralised so audio cues and
// VFX spawns happen in one place.
//
// Particle and damage-number caps respect `state.lowFx` so the auto-
// low-effects detector can scale visuals down on slow devices.

import { awardKill } from './economy.js';

const PARTICLE_CAP_FULL = 80;
const PARTICLE_CAP_LOW  = 24;
const DMGNUM_CAP_FULL   = 24;
const DMGNUM_CAP_LOW    = 8;

export function damageUnit(state, attacker, victim, amount) {
  if (victim.hp <= 0) return false;
  victim.hp -= amount;
  spawnDamageNumber(state, victim.x, victim.y - 12, amount, victim.team);
  spawnHitParticles(state, victim.x, victim.y - 8, victim.color || '#ff4d6d', 4);
  if (victim.hp <= 0) {
    victim.hp = 0;
    onUnitDeath(state, attacker, victim);
    return true;
  }
  return false;
}

export function damageBase(state, attackerSide, defenderSide, amount) {
  if (defenderSide.base.hp <= 0) return;
  defenderSide.base.hp = Math.max(0, defenderSide.base.hp - amount);
  state.effects.shakeMs = Math.max(state.effects.shakeMs, 120);
  state.effects.shakeMag = Math.max(state.effects.shakeMag, 4);
  spawnHitParticles(state, defenderSide === state.player ? state.view.laneLeft - 30 : state.view.laneRight + 30, state.view.groundY - 60, '#ffe14f', 6);
}

function onUnitDeath(state, attackerOwner, victim) {
  const ownerSide = victim.team === 'player' ? state.player : state.enemy;
  // Mark for sweep — the unit list is filtered after the tick.
  victim.dead = true;
  // Bounty goes to the attacker's owning side.
  if (attackerOwner) {
    const killerSide = attackerOwner.team === 'player' ? state.player : state.enemy;
    if (killerSide !== ownerSide) awardKill(state, killerSide, victim);
  }
  spawnHitParticles(state, victim.x, victim.y - 8, victim.color || '#fff', 8);
}

export function spawnDamageNumber(state, x, y, value, team) {
  const pool = state.pools.damageNum;
  const cap = state.lowFx ? DMGNUM_CAP_LOW : DMGNUM_CAP_FULL;
  if (pool.live.length >= cap) {
    pool.release(pool.live[0]);
  }
  pool.acquire((d) => {
    d.alive = true;
    d.x = x; d.y = y;
    d.value = Math.round(value);
    d.team = team;
    d.ageMs = 0;
    d.lifeMs = 800;
    d.id = state.allocId();
  });
}

export function spawnHitParticles(state, x, y, color, n = 4) {
  const pool = state.pools.particle;
  const cap = state.lowFx ? PARTICLE_CAP_LOW : PARTICLE_CAP_FULL;
  for (let i = 0; i < n; i++) {
    if (pool.live.length >= cap) break;
    pool.acquire((p) => {
      p.alive = true;
      p.x = x; p.y = y;
      p.vx = (Math.random() - 0.5) * 220;
      p.vy = -60 - Math.random() * 90;
      p.lifeMs = 240 + Math.random() * 220;
      p.maxLifeMs = p.lifeMs;
      p.color = color;
      p.size = 2 + Math.random() * 1.6;
      p.id = state.allocId();
    });
  }
}
