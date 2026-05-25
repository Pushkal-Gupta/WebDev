// Gold trickle. Bounty + base-hit gold are awarded inside combat.js.
//
// Passive trickle is capped at BALANCE.GOLD_CAP — the cap is what
// forces the player to spend rather than hoard. Active gains (kill
// bounties, base-hit chip damage, turret refunds) are NOT capped: those
// are rewards for engagement and should always credit in full, even if
// the player is already brimming.

import { getEraByIndex } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { getMultiplier } from './powerups.js';
import { BALANCE } from '../content/balance.js';
import { spawnLootNumber } from './combat.js';

export function tickEconomy(state, dt) {
  for (const side of [state.player, state.enemy]) {
    const era = getEraByIndex(side.eraIndex);
    const mul = getMultiplier(side.powerups, 'economy');
    // Difficulty trims the *player*'s gold rate so harder tiers feel
    // gold-starved. The AI runs at the era's nominal rate so it doesn't
    // get a double boost (it already has aiSpawnRateMul / aiTechRateMul).
    const diffMul = (side === state.player)
      ? (state.difficulty?.playerGoldRateMul ?? 1)
      : 1;
    side.goldAcc += (era?.goldPerSec || 12) * mul * diffMul * dt;
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
  // Difficulty trims the *player*'s XP (and gold-from-kills could one day
  // follow the same shape, but kill bounties currently stay full so the
  // player feels rewarded for engagement).
  const xpMul = (killerSide === state.player)
    ? (state.difficulty?.playerXpRateMul ?? 1)
    : 1;
  const goldGained = deadUnit.bountyGold | 0;
  const xpGained   = Math.round((deadUnit.bountyXp | 0) * xpMul);
  killerSide.gold += goldGained;
  killerSide.xp   += xpGained;
  if (killerSide === state.player) state.statsPlayer.kills++;
  else                              state.statsEnemy.kills++;
  // Visual juice — gold + xp pops at the kill site. Only the killer
  // side gets pops so the lane doesn't drown in numbers.
  if (goldGained > 0) spawnLootNumber(state, deadUnit.x, deadUnit.y - 14, goldGained, killerSide.team, 'gold');
  if (xpGained   > 0) spawnLootNumber(state, deadUnit.x, deadUnit.y - 30, xpGained,   killerSide.team, 'xp');
  // Resolve victim's display name + role for the kill-feed ticker. We
  // pass these in the event payload so the UI doesn't have to look up
  // the unit def itself.
  const victim = getUnit(deadUnit.unitId);
  state.bus.emit('kill', {
    team: killerSide.team,
    unitId: deadUnit.unitId,
    unitName: deadUnit.isChampion ? `Champion ${victim?.name || deadUnit.unitId}` : (victim?.name || deadUnit.unitId),
    role: victim?.role || 'frontline',
    isChampion: !!deadUnit.isChampion,
    goldGained,
    xpGained,
    x: deadUnit.x,
    y: deadUnit.y,
  });
}

export function awardBaseHit(state, attackerSide, hitDamage) {
  attackerSide.gold += Math.max(1, Math.round(hitDamage / 8));
}
