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
