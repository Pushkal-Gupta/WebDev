// Projectile spawn + tick + impact. Projectiles travel as kinematic
// straight-line missiles toward the target's position at fire time, with
// a soft homing bias if the target is still alive.

import { getProjectile } from '../content/projectiles.js';
import { damageUnit, damageBase, spawnHitParticles } from './combat.js';
import { distSq } from '../utils/math.js';
import { getMultiplier } from './powerups.js';

const HOMING_BIAS = 0.18;     // 0..1 — how much the projectile turns toward live target each second
const IMPACT_RADIUS_SQ = 14 * 14;

export function spawnProjectile(state, attacker, target, side) {
  const def = getProjectile(attacker.projectileId || 'bone-shard');
  const tx = target ? target.x : (side === state.player ? state.view.laneRight : state.view.laneLeft);
  const ty = target ? target.y - 6 : state.view.groundY - 30;
  const dx = tx - attacker.x;
  const dy = ty - attacker.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const speed = def.speed;
  // Munitions powerup: turret-fired projectiles get the bonus damage.
  // We detect by attacker.kind === 'turret' (set by makeTurretInstance).
  const isTurret = attacker && attacker.kind === 'turret';
  const dmgMul = isTurret ? getMultiplier(side.powerups, 'turret') : 1;
  state.pools.projectile.acquire((p) => {
    p.alive = true;
    p.id = state.allocId();
    p.team = side.team;
    p.defId = def.id;
    p.x = attacker.x; p.y = attacker.y - 8;
    p.px = p.x; p.py = p.y;        // previous-step end for render interpolation
    p.vx = (dx / len) * speed;
    p.vy = (dy / len) * speed;
    p.damage = attacker.damage * dmgMul;
    p.targetId = target ? target.id : null;
    p.ttlMs = def.ttlMs;
    p.kind = def.kind;
    p.color = def.colorPrimary;
    p.colorTrail = def.colorTrail;
    p.size = def.sizePx;
  });
}

export function tickProjectiles(state, dt) {
  const pool = state.pools.projectile;
  // Build target-by-id index once per tick; cheap (n ≤ MAX_UNITS_PER_SIDE × 2).
  const targets = buildTargetIndex(state);

  for (const p of pool.live) {
    if (!p.alive) continue;
    p.px = p.x; p.py = p.y;          // capture previous-step end
    p.ttlMs -= dt * 1000;
    if (p.ttlMs <= 0) { p.alive = false; continue; }
    // Homing bias toward live target if any.
    const t = p.targetId ? targets.get(p.targetId) : null;
    if (t && !t.dead && t.hp > 0) {
      const dx = t.x - p.x, dy = (t.y - 6) - p.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const speed = Math.hypot(p.vx, p.vy);
      const k = Math.min(1, HOMING_BIAS * dt);
      p.vx = p.vx * (1 - k) + (dx / len) * speed * k;
      p.vy = p.vy * (1 - k) + (dy / len) * speed * k;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  // Impact resolution
  for (const p of pool.live) {
    if (!p.alive) continue;
    // Hit any opposing unit close to us.
    const opp = p.team === 'player' ? state.enemy.units : state.player.units;
    for (const u of opp) {
      if (u.dead || u.hp <= 0) continue;
      if (distSq(p.x, p.y, u.x, u.y - 6) <= IMPACT_RADIUS_SQ) {
        damageUnit(state, { team: p.team }, u, p.damage);
        spawnHitParticles(state, p.x, p.y, p.colorTrail || p.color || '#fff', 4);
        p.alive = false;
        break;
      }
    }
    if (!p.alive) continue;
    // Hit the opposing base.
    const oppSide = p.team === 'player' ? state.enemy : state.player;
    const baseX = p.team === 'player' ? state.view.laneRight + 50 : state.view.laneLeft - 50;
    const baseTopY = state.view.groundY - 86;
    if ((p.team === 'player' && p.x >= baseX - 30) || (p.team === 'enemy' && p.x <= baseX + 30)) {
      if (p.y >= baseTopY) {
        damageBase(state, p.team === 'player' ? state.player : state.enemy, oppSide, p.damage);
        spawnHitParticles(state, p.x, p.y, p.colorTrail || '#ffe14f', 6);
        p.alive = false;
      }
    }
  }

  pool.sweep((p) => p.alive);
}

function buildTargetIndex(state) {
  const m = new Map();
  for (const u of state.player.units) m.set(u.id, u);
  for (const u of state.enemy.units)  m.set(u.id, u);
  return m;
}
