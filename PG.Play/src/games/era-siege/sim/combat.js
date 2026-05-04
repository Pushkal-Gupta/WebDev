// Damage application + on-death cleanup. Centralised so audio cues and
// VFX spawns happen in one place.
//
// Particle and damage-number caps respect `state.lowFx` so the auto-
// low-effects detector can scale visuals down on slow devices.

import { awardKill } from './economy.js';
import { pushExplosion } from './effects.js';

const PARTICLE_CAP_FULL = 80;
const PARTICLE_CAP_LOW  = 24;
const DMGNUM_CAP_FULL   = 24;
const DMGNUM_CAP_LOW    = 8;

export function damageUnit(state, attacker, victim, amount) {
  if (victim.hp <= 0) return false;
  victim.hp -= amount;
  spawnDamageNumber(state, victim.x, victim.y - 12, amount, victim.team);
  spawnHitParticles(state, victim.x, victim.y - 8, victim.color || '#ff4d6d', 4);
  // Audio hook — let the audio router play a melee/projectile clash
  // SFX. Throttled at the router (THROTTLE_MS=160) so a swarm of
  // hits doesn't drown out everything else.
  state.bus.emit('combat_hit', {
    team: victim.team,
    role: victim.role,
    isProjectile: !!(attacker && attacker.kind === 'turret') || !!attacker?.projectileId,
  });
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
  // Shake scales with damage so big hits feel weighty.
  const shakeMs  = 120 + Math.min(280, amount * 2);
  const shakeMag = 4   + Math.min(8,   amount * 0.10);
  state.effects.shakeMs  = Math.max(state.effects.shakeMs,  shakeMs);
  state.effects.shakeMag = Math.max(state.effects.shakeMag, shakeMag);
  // White flash overlay on the defender's base — flagged as a per-side
  // effect so the renderer can paint a brief white strobe over the wall.
  defenderSide.baseFlashMs = Math.max(defenderSide.baseFlashMs || 0, 160);
  // Particle burst at the impact point (top of the wall, sky-side so it
  // reads against the dark canvas).
  const hitX = defenderSide === state.player ? state.view.laneLeft - 30 : state.view.laneRight + 30;
  const hitY = state.view.groundY - 60;
  spawnHitParticles(state, hitX, hitY, '#ffe14f', 8);
  spawnHitParticles(state, hitX, hitY, '#ff8a3a', 4);
  // Chip-damage popup so the player sees how hard each landing hit lands.
  spawnLootNumber(state, hitX, hitY - 14, amount, defenderSide.team, 'damage');
  // Audio hook — base wall taking a hit. Magnitude lets the router
  // pick a heavier vs lighter cue based on amount.
  state.bus.emit('base_hit', { team: defenderSide.team, amount, eraIndex: defenderSide.eraIndex });
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
  // Heavy units get the painted explosion VFX. Frontline / ranged stick
  // with the ash burst so the screen doesn't drown in animation.
  if (victim.role === 'heavy') {
    pushExplosion(state, victim.x, victim.y - 14, { size: 80, lifeMs: 720 });
  }
}

export function spawnDamageNumber(state, x, y, value, team) {
  spawnLootNumber(state, x, y, value, team, 'damage');
}

// Generic floating-number spawn. `kind` is 'damage' | 'gold' | 'xp'.
// Loot pops (gold / xp) linger longer and float higher than damage.
export function spawnLootNumber(state, x, y, value, team, kind = 'damage') {
  const pool = state.pools.damageNum;
  const cap = state.lowFx ? DMGNUM_CAP_LOW : DMGNUM_CAP_FULL;
  if (pool.live.length >= cap) {
    pool.release(pool.live[0]);
  }
  pool.acquire((d) => {
    d.alive = true;
    d.x = x; d.y = y;
    // A tiny random horizontal jitter so stacked pops don't overlap.
    d.vx = (Math.random() - 0.5) * 12;
    d.vy = -28;
    d.value = Math.round(value);
    d.team = team;
    d.kind = kind;
    d.ageMs = 0;
    // Damage 800 ms, loot 1100 ms — loot needs to read at a glance.
    d.lifeMs = (kind === 'damage') ? 800 : 1100;
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
