// XP-driven era progression. Evolve costs gold + XP; healing is applied
// to all owned units on success. The HUD reads `canEvolve(side)` to drive
// the button glow.

import { ERAS, getEraByIndex } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';

export function nextEraInfo(side) {
  const next = getEraByIndex(side.eraIndex + 1);
  if (!next) return null;
  return next;
}

export function canEvolve(side) {
  const next = nextEraInfo(side);
  if (!next) return false;
  return side.xp >= next.xpToEvolve && side.gold >= next.evolveCost;
}

export function tryEvolve(state, side) {
  const next = nextEraInfo(side);
  if (!next) return false;
  if (side.xp < next.xpToEvolve) return false;
  if (side.gold < next.evolveCost) return false;

  side.gold -= next.evolveCost;
  side.eraIndex = next.index;
  side.specialCooldownMs = 0; // fresh era → fresh special

  // AI auto-unlocks generals after evolving past era 1 — the player has
  // to pay BALANCE.GENERAL_UNLOCK_COST manually for theirs. Mirrored in
  // the enemy auto-evolve path in world.js so both AI evolve flows stay
  // in sync.
  if (side !== state.player && side.eraIndex >= 1) {
    side.generalsUnlocked = true;
  }

  // Heal pulse on every owned unit.
  const heal = BALANCE.EVOLVE_HEAL_PCT;
  for (const u of side.units) {
    u.hp = Math.min(u.maxHp, u.hp + u.maxHp * heal);
  }

  // Effects only for the player's POV — the renderer's screen flash makes
  // sense only when the *player* evolves.
  if (side === state.player) {
    state.effects.flashMs = 600;
    state.effects.flashAlpha = 0.45;
    state.effects.shakeMs = 280;
    state.effects.shakeMag = 8;
  }

  state.bus.emit('era_reached', { team: side.team, era: side.eraIndex });
  if (side === state.player) state.bus.emit('evolve_clicked', { fromEra: next.index - 1, toEra: next.index, atTimeSec: Math.round(state.timeSec), atGold: side.gold, atXp: side.xp });
  return true;
}

export function tickProgression(_state, _dt) {
  // No timed progression here — XP gain happens in awardKill (economy.js)
  // and evolve happens via intent. Reserved for future passive effects.
}

export { ERAS };
