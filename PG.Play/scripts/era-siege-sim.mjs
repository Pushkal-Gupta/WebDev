// Era Siege — balance simulator.
//
// Runs N AI-vs-AI matches per difficulty and prints win-rate, median
// match duration, and unit-mix stats. The mirror match is the cleanest
// way to gauge whether the numbers are sane: in a 50/50 starting state,
// the standard difficulty should land near 0.50 win-rate for player
// (because both sides use the same AI). Skewed difficulties shift the
// player starting gold, so player win-rate should track the difficulty's
// startingGold delta.
//
// Outputs both human-readable text and a JSON file (`scripts/era-siege-sim-report.json`).
//
// Usage:
//   node scripts/era-siege-sim.mjs
//   N=200 node scripts/era-siege-sim.mjs           # custom match count
//   DIFF=skirmish node scripts/era-siege-sim.mjs   # one difficulty only

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const N = Number(process.env.N || 100);
const ONLY = process.env.DIFF || null;
const MAX_SIM_SEC = 600; // hard fuse — 10 minutes simulated
const STEP_SEC = 1 / 60;

// Lazy-import the sim modules. They are plain ESM and runtime-safe in Node.
const { createMatch, tick } = await import(resolve(root, 'src/games/era-siege/sim/world.js'));
const { makeAiBlock } = await import(resolve(root, 'src/games/era-siege/sim/ai.js'));
const { UNITS_BY_ID } = await import(resolve(root, 'src/games/era-siege/content/units.js'));

const DIFFICULTIES = ONLY ? [ONLY] : ['skirmish', 'standard', 'conquest'];

function median(arr) {
  if (!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function p(percent, arr) {
  if (!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor((percent / 100) * s.length));
  return s[i];
}

function simulateMirror(difficulty, seed) {
  const match = createMatch({ difficulty, seed, view: { w: 820, h: 420 } });
  // Opt the player side into the AI for a mirror match.
  match.player.ai = makeAiBlock();

  let elapsed = 0;
  while (match.status === 'playing' && elapsed < MAX_SIM_SEC) {
    tick(match, STEP_SEC, null);
    elapsed += STEP_SEC;
  }
  // Tally unit mix for whoever won.
  const unitMix = { player: {}, enemy: {} };
  // The match keeps stats; we don't track unit-id-level mix, but spawned counts are good enough.
  return {
    winner: match.winner,
    timeSec: Math.round(match.timeSec),
    playerEra: match.player.eraIndex,
    enemyEra:  match.enemy.eraIndex,
    playerHp:  match.player.base.hp,
    enemyHp:   match.enemy.base.hp,
    playerStats: match.statsPlayer,
    enemyStats:  match.statsEnemy,
    timedOut: match.status === 'playing',
  };
}

function summarise(name, results) {
  const wins  = results.filter((r) => r.winner === 'player').length;
  const losses = results.filter((r) => r.winner === 'enemy').length;
  const draws  = results.filter((r) => !r.winner).length;
  const times = results.filter((r) => !r.timedOut).map((r) => r.timeSec);
  return {
    name,
    n: results.length,
    playerWinRate: +(wins / results.length).toFixed(3),
    enemyWinRate:  +(losses / results.length).toFixed(3),
    drawRate:      +(draws / results.length).toFixed(3),
    medianTimeSec: median(times),
    p10TimeSec:    p(10, times),
    p90TimeSec:    p(90, times),
    medianPlayerEra: median(results.map((r) => r.playerEra)) + 1,
    medianEnemyEra:  median(results.map((r) => r.enemyEra)) + 1,
    avgPlayerKills:  +(results.reduce((s, r) => s + r.playerStats.kills, 0) / results.length).toFixed(1),
    avgEnemyKills:   +(results.reduce((s, r) => s + r.enemyStats.kills, 0) / results.length).toFixed(1),
    avgPlayerSpawns: +(results.reduce((s, r) => s + r.playerStats.unitsSpawned, 0) / results.length).toFixed(1),
    avgEnemySpawns:  +(results.reduce((s, r) => s + r.enemyStats.unitsSpawned, 0) / results.length).toFixed(1),
    timedOut: results.filter((r) => r.timedOut).length,
  };
}

console.log(`era-siege simulator · ${N} mirror matches per difficulty\n`);
const start = Date.now();

const reports = [];
for (const d of DIFFICULTIES) {
  const results = [];
  for (let i = 0; i < N; i++) {
    const seed = (i * 2654435761) >>> 0; // a deterministic spread
    results.push(simulateMirror(d, seed));
  }
  const s = summarise(d, results);
  reports.push(s);
  printSummary(s);
}

const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\ndone in ${elapsedSec}s (${(N * DIFFICULTIES.length)} matches)`);

// Persist a machine-readable report.
const payload = {
  generatedAt: new Date().toISOString(),
  matchesPerDifficulty: N,
  reports,
};
writeFileSync(resolve(root, 'scripts/era-siege-sim-report.json'), JSON.stringify(payload, null, 2));
console.log('wrote scripts/era-siege-sim-report.json');

// Gate: in standard the mirror should land near 50/50.
const std = reports.find((r) => r.name === 'standard');
if (std && Math.abs(std.playerWinRate - 0.5) > 0.12) {
  console.warn(`WARN: standard mirror win-rate is ${std.playerWinRate}; expected near 0.50.`);
}

function printSummary(s) {
  const tot = s.n;
  const w = (s.playerWinRate * 100).toFixed(1).padStart(5);
  const l = (s.enemyWinRate  * 100).toFixed(1).padStart(5);
  const d = (s.drawRate      * 100).toFixed(1).padStart(5);
  console.log(`── ${s.name.toUpperCase().padEnd(9)} ─────────────────────────────`);
  console.log(`  player wins:  ${w}%   enemy wins: ${l}%   draws/timeouts: ${d}%`);
  console.log(`  duration:     median ${String(s.medianTimeSec).padStart(3)}s   p10 ${String(s.p10TimeSec).padStart(3)}s   p90 ${String(s.p90TimeSec).padStart(3)}s`);
  console.log(`  med era:      player ${s.medianPlayerEra}   enemy ${s.medianEnemyEra}`);
  console.log(`  avg kills:    player ${s.avgPlayerKills}    enemy ${s.avgEnemyKills}`);
  console.log(`  avg spawns:   player ${s.avgPlayerSpawns}   enemy ${s.avgEnemySpawns}`);
  if (s.timedOut > 0) console.log(`  timed out:    ${s.timedOut}/${tot}`);
}
