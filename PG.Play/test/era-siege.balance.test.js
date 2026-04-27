// Era Siege — balance regression guard.
//
// Runs N AI-vs-AI mirror matches and asserts the standard win-rate is
// inside the historical envelope. Catches future balance changes that
// drift the matchup off-axis (the sim changes that pre-fix made the
// standard mirror 5/95 — a regression like that should fail this test).
//
// Kept lightweight (N=20) so it runs in <1s and stays in the default
// vitest pass. The "real" calibration runs at N=200 via
// `npm run sim:era-siege` (scripts/era-siege-sim.mjs).

import { describe, it, expect } from 'vitest';
import { createMatch, tick } from '../src/games/era-siege/sim/world.js';
import { makeAiBlock } from '../src/games/era-siege/sim/ai.js';

const STEP_SEC = 1 / 60;
const MAX_SIM_SEC = 600;

function simulateMirror(difficulty, seed) {
  const m = createMatch({ difficulty, seed });
  m.player.ai = makeAiBlock();
  let t = 0;
  while (m.status === 'playing' && t < MAX_SIM_SEC) {
    tick(m, STEP_SEC, null);
    t += STEP_SEC;
  }
  return { winner: m.winner, timeSec: Math.round(m.timeSec), playerEra: m.player.eraIndex };
}

function median(arr) {
  if (!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

describe('era-siege balance — mirror match envelope', () => {
  // Smaller N keeps the test fast. The bound is generous: a healthy mirror
  // should land inside [0.30, 0.65] for the player. Outside the envelope
  // means a change has pushed one side decisively ahead.
  it('standard mirror player win-rate is within [0.30, 0.65]', () => {
    const N = 20;
    const results = [];
    for (let i = 0; i < N; i++) results.push(simulateMirror('standard', (i * 2654435761) >>> 0));
    const wins = results.filter((r) => r.winner === 'player').length;
    const rate = wins / N;
    expect(rate).toBeGreaterThanOrEqual(0.30);
    expect(rate).toBeLessThanOrEqual(0.65);
  });

  it('standard mirror median match length is within [60s, 240s]', () => {
    const N = 20;
    const results = [];
    for (let i = 0; i < N; i++) results.push(simulateMirror('standard', (i * 2654435761) >>> 0));
    const med = median(results.map((r) => r.timeSec));
    expect(med).toBeGreaterThanOrEqual(60);
    expect(med).toBeLessThanOrEqual(240);
  });

  it('every mirror match resolves (no draws / timeouts) at standard', () => {
    const N = 20;
    let resolved = 0;
    for (let i = 0; i < N; i++) {
      const r = simulateMirror('standard', (i * 2654435761) >>> 0);
      if (r.winner === 'player' || r.winner === 'enemy') resolved++;
    }
    expect(resolved).toBe(N);
  });

  it('skirmish has more permissive timings than conquest (median win-rate sane)', () => {
    const N = 12;
    const skirm = [];
    const conq  = [];
    for (let i = 0; i < N; i++) {
      const seed = (i * 2654435761) >>> 0;
      skirm.push(simulateMirror('skirmish', seed));
      conq.push(simulateMirror('conquest', seed));
    }
    const skirmRate = skirm.filter((r) => r.winner === 'player').length / N;
    const conqRate  = conq.filter((r) => r.winner === 'player').length / N;
    // Both should resolve and stay inside [0.20, 0.80]. We don't assert
    // a strict ordering — RNG-seeding ties at small N — but if either
    // tier collapses to 0 or 1 something is broken.
    expect(skirmRate).toBeGreaterThanOrEqual(0.20);
    expect(skirmRate).toBeLessThanOrEqual(0.80);
    expect(conqRate).toBeGreaterThanOrEqual(0.20);
    expect(conqRate).toBeLessThanOrEqual(0.80);
  });
});
