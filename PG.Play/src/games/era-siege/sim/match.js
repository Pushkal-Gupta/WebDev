// Win/lose detection + score formula.

import { BALANCE } from '../content/balance.js';
import { clamp } from '../utils/math.js';

export function matchOver(state) {
  if (state.enemy.base.hp <= 0) return 'won';
  if (state.player.base.hp <= 0) return 'lost';
  return null;
}

/**
 * Score is 0..100. Calibrated so:
 *  - era-5 win in 240s with 100% HP → 100
 *  - era-3 win in 240s with 50% HP  → ~63
 *  - era-2 loss with 0% HP          → ~24
 */
export function scoreMatch(state) {
  const won = state.status === 'won';
  const era = state.player.eraIndex + 1;          // 1..5
  const hpLeft = state.player.base.hp / BALANCE.BASE_HP;
  const clearSec = state.timeSec;
  const clearMul = clamp(1 - (clearSec - 240) / 480, 0.4, 1.5);
  const raw = era * 12 * clearMul + hpLeft * 25 + (won ? 15 : 0);
  return clamp(Math.round(raw), 0, BALANCE.SCORE_MAX);
}
