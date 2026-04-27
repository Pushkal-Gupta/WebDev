// Specials — telegraph, then impact. Cooldown is per-side. The HUD reads
// `side.specialCooldownMs` and the special def to render the radial.

import { getSpecial } from '../content/specials.js';
import { getEraByIndex } from '../content/eras.js';
import { damageUnit, spawnHitParticles, spawnDamageNumber } from './combat.js';
import { pushExplosion } from './effects.js';
import { getMultiplier } from './powerups.js';

export function tryFireSpecial(state, side) {
  if (side.specialCooldownMs > 0) {
    state.bus.emit('low_gold_error', { reason: 'special_cooldown' });
    return false;
  }
  if (side.specialActive) return false;
  const era = getEraByIndex(side.eraIndex);
  if (!era) return false;
  const def = getSpecial(era.specialId);
  if (!def) return false;

  side.specialActive = {
    specialId: def.id,
    telegraphLeftMs: def.telegraphMs,
    eraIndex: side.eraIndex,
    impactX: pickImpactX(state, side, def),
  };
  if (side === state.player) state.statsPlayer.specialsUsed++;
  else                       state.statsEnemy.specialsUsed++;
  state.bus.emit('special_charged', { team: side.team, specialId: def.id, telegraphMs: def.telegraphMs });
  return true;
}

function pickImpactX(state, side, def) {
  const foeSide = side === state.player ? state.enemy : state.player;
  if (def.mode === 'lane' || def.mode === 'aura') return null;
  // 'point' mode: target the densest foe cluster, biased toward your side.
  let bestX = side === state.player ? state.view.laneRight - 80 : state.view.laneLeft + 80;
  let bestScore = -1;
  for (const u of foeSide.units) {
    let score = 0;
    for (const v of foeSide.units) {
      if (Math.abs(v.x - u.x) < 60) score++;
    }
    if (score > bestScore) { bestScore = score; bestX = u.x; }
  }
  return bestX;
}

export function tickSpecials(state, dt) {
  for (const side of [state.player, state.enemy]) {
    if (side.specialCooldownMs > 0) {
      side.specialCooldownMs = Math.max(0, side.specialCooldownMs - dt * 1000);
    }
    if (side.auraLeftMs > 0) {
      side.auraLeftMs = Math.max(0, side.auraLeftMs - dt * 1000);
    }
    const sa = side.specialActive;
    if (!sa) continue;
    sa.telegraphLeftMs -= dt * 1000;
    if (sa.telegraphLeftMs <= 0) {
      const def = getSpecial(sa.specialId);
      const foeSide = side === state.player ? state.enemy : state.player;
      applySpecialImpact(state, side, foeSide, def, sa.impactX);
      // Apply Resonance powerup: cooldown × (1 - 0.10 × level).
      side.specialCooldownMs = Math.round(def.cooldownMs * getMultiplier(side.powerups, 'special'));
      side.specialActive = null;
      state.bus.emit('special_used', { team: side.team, specialId: def.id, era: side.eraIndex });
    }
  }
}

function applySpecialImpact(state, side, foeSide, def, impactX) {
  if (def.mode === 'lane') {
    // Damage every foe unit in the lane.
    for (const u of foeSide.units) {
      damageUnit(state, { team: side.team }, u, def.damage);
    }
    // Sparkles across the lane.
    for (let i = 0; i < 24; i++) {
      const fx = state.view.laneLeft + (state.view.laneRight - state.view.laneLeft) * (i / 24);
      spawnHitParticles(state, fx, state.view.groundY - 80, def.visual.primary, 2);
    }
    state.effects.shakeMs = 360; state.effects.shakeMag = 9;
    // Lane band ring.
    pushRing(state, (state.view.laneLeft + state.view.laneRight) / 2, state.view.groundY - 30,
             (state.view.laneRight - state.view.laneLeft) / 2, def.visual.primary, 'lane');
  } else if (def.mode === 'point') {
    // Damage foe units inside radius around impactX.
    const cx = impactX ?? state.view.laneRight - 100;
    const cy = state.view.groundY - 12;
    for (const u of foeSide.units) {
      const dx = u.x - cx;
      if (Math.abs(dx) <= def.radius) {
        damageUnit(state, { team: side.team }, u, def.damage);
      }
    }
    spawnHitParticles(state, cx, cy, def.visual.primary, 16);
    spawnDamageNumber(state, cx, cy - 18, def.damage, side.team);
    state.effects.shakeMs = 320; state.effects.shakeMag = 10;
    pushRing(state, cx, cy, def.radius, def.visual.primary, 'point');
    // Painted explosion centred at impact, scaled with the radius.
    pushExplosion(state, cx, cy - 18, { size: Math.min(220, def.radius * 1.4), lifeMs: 760 });
  } else if (def.mode === 'aura') {
    // Aura: +25% damage to owned units for 4s; immediate damage on engaged foes.
    side.auraLeftMs = 4000;
    for (const u of side.units) {
      // Damage any foe in melee range of an owned unit.
      for (const f of foeSide.units) {
        if (Math.abs(f.x - u.x) <= u.range) {
          damageUnit(state, { team: side.team }, f, def.damage);
        }
      }
    }
    state.effects.flashMs = 360; state.effects.flashAlpha = 0.3;
    // Aura ring: a wide band over the entire lane to mark the buff window.
    pushRing(state, (state.view.laneLeft + state.view.laneRight) / 2, state.view.groundY - 30,
             (state.view.laneRight - state.view.laneLeft) / 2, def.visual.primary, 'aura');
  }
}

function pushRing(state, x, y, radius, color, kind) {
  const rings = state.effects.rings;
  rings.push({ x, y, radius, color, kind, ageMs: 0, lifeMs: 600 });
  // Cap to the most recent few — extras unwind quickly.
  if (rings.length > 4) rings.splice(0, rings.length - 4);
}
