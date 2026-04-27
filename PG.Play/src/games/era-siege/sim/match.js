// Win/lose detection + score formula.

import { BALANCE } from '../content/balance.js';
import { clamp } from '../utils/math.js';

export function matchOver(state) {
  // Endless: only the player base falling ends the run. The world.js
  // step regenerates the enemy base HP so the "won" branch is unreachable.
  if (state.endlessMode) {
    if (state.player.base.hp <= 0) return 'lost';
    return null;
  }
  if (state.enemy.base.hp <= 0) return 'won';
  if (state.player.base.hp <= 0) return 'lost';
  return null;
}

/**
 * Score is 0..100. Calibrated so:
 *  - era-5 win in 240s with 100% HP → 100
 *  - era-3 win in 240s with 50% HP  → ~63
 *  - era-2 loss with 0% HP          → ~24
 *
 * Endless mode uses a different formula:
 *  - score = clamp(round(era * 8 + endlessSeconds / 6 + kills / 4), 0, 100)
 *  - hits 100 around era 5 + 8 minutes survived + 80+ kills.
 */
export function scoreMatch(state) {
  if (state.endlessMode) {
    const era = state.player.eraIndex + 1;
    const sec = state.endlessTimeSec;
    const kills = state.statsPlayer.kills;
    const raw = era * 8 + sec / 6 + kills / 4;
    return clamp(Math.round(raw), 0, BALANCE.SCORE_MAX);
  }
  const won = state.status === 'won';
  const era = state.player.eraIndex + 1;          // 1..5
  const hpLeft = state.player.base.hp / BALANCE.BASE_HP;
  const clearSec = state.timeSec;
  const clearMul = clamp(1 - (clearSec - 240) / 480, 0.4, 1.5);
  const raw = era * 12 * clearMul + hpLeft * 25 + (won ? 15 : 0);
  return clamp(Math.round(raw), 0, BALANCE.SCORE_MAX);
}
