// Boss-wave sentinel.
//
// At fixed time milestones (90s, 180s, 300s, 420s, then every 90s) the
// AI receives a brief escalation:
//   - 5 seconds before the wave, a 'boss_wave_warning' event fires so
//     the UI can paint a sliding banner ("Wave incoming — Champion of
//     <Era> approaches").
//   - At the threshold, a *champion* is spawned for the enemy. The
//     champion is a beefed-up clone of the era's heavy unit (HP×2.5,
//     damage×1.5, bounty×3 to reward the player for downing it). It
//     carries a `championOfWave` tag for the renderer to draw a crown
//     halo + the kill-feed to highlight.
//   - Optional second champion 1.5s later for waves 3+ so each wave
//     escalates harder than the last.
//
// Pure logic — no rendering or sound here. Hooks via state.bus events:
//   'boss_wave_warning' { waveIndex, atTimeSec, eraIndex, unitId }
//   'boss_wave_spawned' { waveIndex, unitId, championId }
//
// Schedule lives on state.bossWaveScheduler — created lazily on first
// tick so older save files (without the field) still load cleanly.

import { getEraByIndex } from '../content/eras.js';
import { getUnit } from '../content/units.js';

const WAVE_TIMES_SEC = [90, 180, 300, 420, 540, 660, 780, 900];
const WARNING_LEAD_SEC = 5;

export function tickBossWaves(state, _dt) {
  // Skip in mirror / AI-vs-AI runs (the balance-regression test).
  // Boss waves are a single-player escalation; firing them only at
  // the enemy side asymmetrically buffs one side and breaks the
  // mirror envelope assertion.
  if (state.player.ai) return;
  if (!state.bossWaveScheduler) {
    state.bossWaveScheduler = {
      nextWaveIndex: 0,
      warned: -1,
      pendingSecondAt: 0,    // monotonic time for the optional 2nd champion
      pendingSecondWave: -1,
    };
  }
  const sched = state.bossWaveScheduler;
  const t = state.timeSec;
  const target = WAVE_TIMES_SEC[sched.nextWaveIndex];
  if (target === undefined) return;     // out of scheduled waves

  // Warning 5 s ahead of the threshold.
  if (sched.warned < sched.nextWaveIndex && t >= target - WARNING_LEAD_SEC) {
    const era = getEraByIndex(state.enemy.eraIndex);
    const heavyId = pickChampionUnitId(era);
    state.bus.emit('boss_wave_warning', {
      waveIndex: sched.nextWaveIndex,
      atTimeSec: target,
      eraIndex: state.enemy.eraIndex,
      unitId: heavyId,
    });
    sched.warned = sched.nextWaveIndex;
  }

  // Wave hits — spawn the champion (and queue an optional 2nd).
  if (t >= target) {
    const championId = spawnChampion(state, sched.nextWaveIndex);
    state.bus.emit('boss_wave_spawned', {
      waveIndex: sched.nextWaveIndex,
      unitId: championId?.unitId,
      championId: championId?.id,
    });
    // Wave 3+ → second champion 1.5 s later (the same era's heavy or
    // a frontline so it isn't an identical twin).
    if (sched.nextWaveIndex >= 2) {
      sched.pendingSecondAt = t + 1.5;
      sched.pendingSecondWave = sched.nextWaveIndex;
    }
    sched.nextWaveIndex++;
  }

  // Optional second-champion fire (for waves 3+).
  if (sched.pendingSecondWave >= 0 && t >= sched.pendingSecondAt) {
    spawnChampion(state, sched.pendingSecondWave, /*secondary*/ true);
    sched.pendingSecondWave = -1;
  }
}

function pickChampionUnitId(era) {
  if (!era) return null;
  // Prefer the era's heavy unit (resolved by role, not id-substring,
  // so era 1's Pyre Bearer → era 2's Iron Bastion → etc. all match).
  // Falls back to frontline if no heavy is present in the era's roster.
  const heavy = era.unitIds?.find((id) => getUnit(id)?.role === 'heavy');
  return heavy || era.unitIds?.find((id) => getUnit(id)?.role === 'frontline')
               || era.unitIds?.[0]
               || null;
}

function spawnChampion(state, waveIndex, secondary = false) {
  const era = getEraByIndex(state.enemy.eraIndex);
  if (!era) return null;
  const baseId = secondary
    ? era.unitIds?.find((id) => /frontline|ranged/i.test(id)) || era.unitIds?.[0]
    : pickChampionUnitId(era);
  const def = getUnit(baseId);
  if (!def) return null;

  // Hand-build the unit (skipping the cost / cooldown gates) so we can
  // amplify HP / damage / bounty without needing a separate def.
  const id = state.allocId();
  const baseX = state.view.laneRight - 14;
  const facing = -1;
  // Wave scaling: each wave is meaner than the last.
  const waveMul = 1 + waveIndex * 0.20;     // wave 1 = 1.0×, wave 2 = 1.2×, …
  const hpMul    = 2.5 * waveMul;
  const dmgMul   = 1.5 * waveMul;
  const bountyMul = 3.0;                    // bounty is fixed bonus
  const finalHp = Math.round(def.hp * hpMul);

  const u = {
    id,
    kind: 'unit',
    team: 'enemy',
    unitId: def.id,
    eraId: def.eraId,
    eraIndex: state.enemy.eraIndex,
    name: `Champion ${def.name}`,
    role: def.role,
    hp: finalHp,
    maxHp: finalHp,
    damage: Math.round(def.damage * dmgMul),
    range: def.range,
    moveSpeed: def.moveSpeed * 0.85,        // a touch slower so it
                                            // feels like a heavy boss
    attackWindupMs: def.attackWindupMs,
    attackRecoverMs: def.attackRecoverMs,
    attackTickPhase: 'idle',
    attackTimerMs: 0,
    targetId: null,
    bountyGold: Math.round(def.bountyGold * bountyMul),
    bountyXp:   Math.round(def.bountyXp   * bountyMul),
    cost: def.cost,
    projectileId: def.projectileId,
    targetPolicy: def.targetPolicy,
    visual: def.visual,
    audio: def.audio,
    color: def.visual.colorBody,
    silhouetteW: def.visual.silhouetteW * 1.18,
    silhouetteH: def.visual.silhouetteH * 1.18,
    facing,
    laneStagger: ((id % 3) - 1) * 2.4,
    x: baseX, y: state.view.groundY,
    px: baseX, py: state.view.groundY,
    walkPhaseMs: Math.random() * 1000,
    dead: false,
    isChampion: true,
    championWaveIndex: waveIndex,
  };
  state.enemy.units.push(u);
  state.statsEnemy.unitsSpawned++;
  state.bus.emit('unit_spawned', { team: 'enemy', unitId: def.id, era: state.enemy.eraIndex, isChampion: true });
  return u;
}
