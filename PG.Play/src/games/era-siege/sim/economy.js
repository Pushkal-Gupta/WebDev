// Gold trickle. Bounty + base-hit gold are awarded inside combat.js.
//
// Passive trickle is capped at BALANCE.GOLD_CAP — the cap is what
// forces the player to spend rather than hoard. Active gains (kill
// bounties, base-hit chip damage, turret refunds) are NOT capped: those
// are rewards for engagement and should always credit in full, even if
// the player is already brimming.

import { getEraByIndex } from '../content/eras.js';
import { getMultiplier } from './powerups.js';
import { BALANCE } from '../content/balance.js';

export function tickEconomy(state, dt) {
  for (const side of [state.player, state.enemy]) {
    const era = getEraByIndex(side.eraIndex);
    const mul = getMultiplier(side.powerups, 'economy');
    side.goldAcc += (era?.goldPerSec || 12) * mul * dt;
    if (side.goldAcc >= 1) {
      const add = Math.floor(side.goldAcc);
      side.goldAcc -= add;
      // Cap *only* the passive trickle so kills / refunds always pay out.
      if (side.gold < BALANCE.GOLD_CAP) {
        side.gold = Math.min(BALANCE.GOLD_CAP, side.gold + add);
      }
    }
  }
}

export function awardKill(state, killerSide, deadUnit) {
  // Bounty in gold + xp goes to the killer's side. Stat tracking on both.
  killerSide.gold += (deadUnit.bountyGold | 0);
  killerSide.xp   = killerSide.xp + (deadUnit.bountyXp | 0);
  if (killerSide === state.player) state.statsPlayer.kills++;
  else                              state.statsEnemy.kills++;
  state.bus.emit('kill', { team: killerSide.team, unitId: deadUnit.unitId, x: deadUnit.x, y: deadUnit.y });
}

export function awardBaseHit(state, attackerSide, hitDamage) {
  attackerSide.gold += Math.max(1, Math.round(hitDamage / 8));
}
