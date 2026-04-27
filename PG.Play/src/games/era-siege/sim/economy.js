// Gold trickle. Bounty + base-hit gold are awarded inside combat.js.

import { getEraByIndex } from '../content/eras.js';
import { getMultiplier } from './powerups.js';

export function tickEconomy(state, dt) {
  for (const side of [state.player, state.enemy]) {
    const era = getEraByIndex(side.eraIndex);
    const mul = getMultiplier(side.powerups, 'economy');
    side.goldAcc += (era?.goldPerSec || 12) * mul * dt;
    if (side.goldAcc >= 1) {
      const add = Math.floor(side.goldAcc);
      side.goldAcc -= add;
      side.gold = Math.min(9999, side.gold + add);
    }
  }
}

export function awardKill(state, killerSide, deadUnit) {
  // Bounty in gold + xp goes to the killer's side. Stat tracking on both.
  killerSide.gold = Math.min(9999, killerSide.gold + (deadUnit.bountyGold | 0));
  killerSide.xp   = killerSide.xp + (deadUnit.bountyXp | 0);
  if (killerSide === state.player) state.statsPlayer.kills++;
  else                              state.statsEnemy.kills++;
  state.bus.emit('kill', { team: killerSide.team, unitId: deadUnit.unitId, x: deadUnit.x, y: deadUnit.y });
}

export function awardBaseHit(state, attackerSide, hitDamage) {
  attackerSide.gold = Math.min(9999, attackerSide.gold + Math.max(1, Math.round(hitDamage / 8)));
}
