// Boss-wave cadence regression. Lock down:
//   - the 5 s warning fires before each scheduled threshold
//   - the champion spawns at the threshold, with HP > base unit HP
//   - tickBossWaves no-ops in mirror (state.player.ai set)

import { describe, it, expect } from 'vitest';
import { tickBossWaves } from '../src/games/era-siege/sim/bossWaves.js';

function fakeState({ playerAi = null } = {}) {
  const events = [];
  const enemyUnits = [];
  let nextId = 1;
  return {
    timeSec: 0,
    timeMs: 0,
    player: { team: 'player', ai: playerAi },
    enemy: {
      team: 'enemy',
      eraIndex: 0,
      units: enemyUnits,
    },
    statsEnemy: { unitsSpawned: 0 },
    view: { laneRight: 1200, groundY: 320 },
    bus: {
      emit: (name, payload) => events.push({ name, payload }),
    },
    allocId: () => nextId++,
    _events: events,
    _enemyUnits: enemyUnits,
  };
}

function advance(state, toSec) {
  while (state.timeSec < toSec) {
    state.timeSec += 0.1;
    tickBossWaves(state, 0.1);
  }
}

describe('bossWaves', () => {
  it('emits warning 5 s before the first scheduled wave (90 s)', () => {
    const s = fakeState();
    advance(s, 84.9);
    expect(s._events.find((e) => e.name === 'boss_wave_warning')).toBeUndefined();
    advance(s, 85.5);
    const warn = s._events.find((e) => e.name === 'boss_wave_warning');
    expect(warn).toBeDefined();
    expect(warn.payload.waveIndex).toBe(0);
    expect(warn.payload.atTimeSec).toBe(90);
  });

  it('spawns a champion at the 90 s threshold', () => {
    const s = fakeState();
    advance(s, 90.5);
    const spawned = s._events.find((e) => e.name === 'boss_wave_spawned');
    expect(spawned).toBeDefined();
    expect(spawned.payload.waveIndex).toBe(0);
    expect(s._enemyUnits.length).toBe(1);
    expect(s._enemyUnits[0].isChampion).toBe(true);
    expect(s._enemyUnits[0].hp).toBeGreaterThanOrEqual(80); // beefier than base unit
  });

  it('escalates HP across waves (wave 2 stronger than wave 1)', () => {
    const s = fakeState();
    advance(s, 90.5);
    const wave1Hp = s._enemyUnits[0].hp;
    advance(s, 180.5);
    const wave2 = s._enemyUnits.find((u) => u.championWaveIndex === 1);
    expect(wave2).toBeDefined();
    expect(wave2.hp).toBeGreaterThan(wave1Hp);
  });

  it('fires a second champion 1.5 s after the threshold for wave 3', () => {
    const s = fakeState();
    advance(s, 300.5);
    const w3champs = s._enemyUnits.filter((u) => u.championWaveIndex === 2);
    expect(w3champs.length).toBe(1);
    advance(s, 302.5);
    const w3champsAfter = s._enemyUnits.filter((u) => u.championWaveIndex === 2);
    expect(w3champsAfter.length).toBe(2);
  });

  it('no-ops in mirror runs (player.ai set)', () => {
    const s = fakeState({ playerAi: { isAi: true } });
    advance(s, 95);
    expect(s._events.length).toBe(0);
    expect(s._enemyUnits.length).toBe(0);
  });
});
