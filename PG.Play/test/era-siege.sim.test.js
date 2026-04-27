// Era Siege — sim system tests. Drives the framework-agnostic sim
// directly (no React, no DOM) and asserts the contract documented in
// docs/ERA_SIEGE_TECH_ARCHITECTURE.md.

import { describe, it, expect } from 'vitest';
import { createMatch, tick, scoreMatch } from '../src/games/era-siege/sim/world.js';
import { tryEvolve, canEvolve } from '../src/games/era-siege/sim/progression.js';
import { tryFireSpecial } from '../src/games/era-siege/sim/specials.js';
import { trySpawnUnit } from '../src/games/era-siege/sim/unit.js';
import { tryBuildTurret, trySellTurret } from '../src/games/era-siege/sim/turret.js';
import { makeAiBlock } from '../src/games/era-siege/sim/ai.js';
import { BALANCE } from '../src/games/era-siege/content/balance.js';
import { ERAS } from '../src/games/era-siege/content/eras.js';
import { UNITS_BY_ID } from '../src/games/era-siege/content/units.js';
import { TURRETS_BY_ID } from '../src/games/era-siege/content/turrets.js';
import { validateContent } from '../src/games/era-siege/content/index.js';
import { makePerfMon, detectDeviceClass } from '../src/games/era-siege/engine/perf.js';

// Tick the sim for `sec` simulated seconds. Use small chunks so the
// per-frame max-step cap (4 sim steps ≈ 67 ms) doesn't drop time.
function advance(state, sec) {
  const STEP = 1 / 60;
  const total = Math.round(sec / STEP);
  for (let i = 0; i < total; i++) tick(state, STEP, null);
}

describe('era-siege content', () => {
  it('content shape validates', () => {
    expect(validateContent()).toBe(true);
  });

  it('every era has a frontline/ranged/heavy unit triple', () => {
    for (const era of ERAS) {
      expect(era.unitIds).toHaveLength(3);
      const roles = era.unitIds.map((id) => UNITS_BY_ID[id]?.role).sort();
      expect(roles).toEqual(['frontline', 'heavy', 'ranged']);
    }
  });

  it('xp thresholds are non-decreasing', () => {
    let last = -1;
    for (const e of ERAS) {
      expect(e.xpToEvolve).toBeGreaterThanOrEqual(last);
      last = e.xpToEvolve;
    }
  });

  it('every era turret/special resolves', () => {
    for (const era of ERAS) {
      expect(TURRETS_BY_ID[era.turretId]).toBeTruthy();
    }
  });
});

describe('era-siege sim — match lifecycle', () => {
  it('starts in playing state with both bases at full HP', () => {
    const m = createMatch({ difficulty: 'standard', seed: 1 });
    expect(m.status).toBe('playing');
    expect(m.player.base.hp).toBe(BALANCE.BASE_HP);
    expect(m.enemy.base.hp).toBe(BALANCE.BASE_HP);
    expect(m.player.units).toHaveLength(0);
    expect(m.enemy.units).toHaveLength(0);
  });

  it('zero base HP triggers a loss', () => {
    const m = createMatch({ difficulty: 'standard', seed: 2 });
    m.player.base.hp = 0;
    tick(m, 1 / 60, null);
    expect(m.status).toBe('lost');
    expect(m.winner).toBe('enemy');
  });

  it('enemy base at zero triggers a win', () => {
    const m = createMatch({ difficulty: 'standard', seed: 3 });
    m.enemy.base.hp = 0;
    tick(m, 1 / 60, null);
    expect(m.status).toBe('won');
    expect(m.winner).toBe('player');
  });
});

describe('era-siege sim — economy + spawns', () => {
  it('passive gold trickles in over time', () => {
    const m = createMatch({ difficulty: 'standard', seed: 4 });
    const before = m.player.gold;
    advance(m, 4);
    // Era 1 trickles 12 g/s — expect at least ~3s worth of gold.
    expect(m.player.gold).toBeGreaterThanOrEqual(before + 12 * 3);
  });

  it('spawning a unit deducts gold and starts a per-id cooldown', () => {
    const m = createMatch({ difficulty: 'standard', seed: 5 });
    m.player.gold = 200;
    const ok = trySpawnUnit(m, m.player, 'ember-runner');
    expect(ok).toBe(true);
    expect(m.player.gold).toBe(200 - 35);
    expect(m.player.units).toHaveLength(1);
    expect(m.player._spawnCooldowns['ember-runner']).toBeGreaterThan(0);
  });

  it('spawning an era-locked unit fails', () => {
    const m = createMatch({ difficulty: 'standard', seed: 6 });
    m.player.gold = 1000;
    const ok = trySpawnUnit(m, m.player, 'iron-bastion'); // era 2 unit
    expect(ok).toBe(false);
    expect(m.player.units).toHaveLength(0);
  });

  it('spawning without enough gold fails', () => {
    const m = createMatch({ difficulty: 'standard', seed: 7 });
    m.player.gold = 5;
    const ok = trySpawnUnit(m, m.player, 'pyre-bearer');
    expect(ok).toBe(false);
  });
});

describe('era-siege sim — progression', () => {
  it('canEvolve is false until xp + gold thresholds are met', () => {
    const m = createMatch({ difficulty: 'standard', seed: 8 });
    expect(canEvolve(m.player)).toBe(false);
    m.player.xp = 1000;
    expect(canEvolve(m.player)).toBe(true);
  });

  it('tryEvolve advances eraIndex and spends gold + xp threshold remains for next era', () => {
    const m = createMatch({ difficulty: 'standard', seed: 9 });
    m.player.xp = 100;
    m.player.gold = 300;
    const before = m.player.gold;
    const ok = tryEvolve(m, m.player);
    expect(ok).toBe(true);
    expect(m.player.eraIndex).toBe(1);
    expect(m.player.gold).toBe(before - ERAS[1].evolveCost);
  });

  it('cannot evolve past final era', () => {
    const m = createMatch({ difficulty: 'standard', seed: 10 });
    m.player.eraIndex = ERAS.length - 1;
    m.player.xp = 1e6;
    m.player.gold = 1e6;
    expect(tryEvolve(m, m.player)).toBe(false);
  });

  it('evolving heals owned units', () => {
    const m = createMatch({ difficulty: 'standard', seed: 11 });
    m.player.gold = 200;
    trySpawnUnit(m, m.player, 'ember-runner');
    const u = m.player.units[0];
    u.hp = 10;
    m.player.xp = 1000;
    m.player.gold += 1000;
    tryEvolve(m, m.player);
    expect(u.hp).toBeGreaterThan(10);
  });
});

describe('era-siege sim — turrets', () => {
  it('build flow deducts gold and assigns era-current variant', () => {
    const m = createMatch({ difficulty: 'standard', seed: 12 });
    m.player.gold = 200;
    const ok = tryBuildTurret(m, m.player, 0);
    expect(ok).toBe(true);
    expect(m.player.turretSlots[0]).toBeTruthy();
    expect(m.player.turretSlots[0].turretId).toBe('bone-crossbow');
  });

  it('cannot build twice in a row in the same slot at the same era', () => {
    const m = createMatch({ difficulty: 'standard', seed: 13 });
    m.player.gold = 1000;
    expect(tryBuildTurret(m, m.player, 0)).toBe(true);
    expect(tryBuildTurret(m, m.player, 0)).toBe(false);
  });

  it('selling refunds 50% and clears the slot', () => {
    const m = createMatch({ difficulty: 'standard', seed: 14 });
    m.player.gold = 1000;
    tryBuildTurret(m, m.player, 0);
    const goldBefore = m.player.gold;
    expect(trySellTurret(m, m.player, 0)).toBe(true);
    expect(m.player.turretSlots[0]).toBe(null);
    expect(m.player.gold).toBe(goldBefore + Math.round(90 * 0.5)); // bone-crossbow cost 90, 50% refund
  });
});

describe('era-siege sim — specials', () => {
  it('first special fire begins a telegraph and locks cooldown after impact', () => {
    const m = createMatch({ difficulty: 'standard', seed: 15 });
    expect(m.player.specialActive).toBeFalsy();
    expect(tryFireSpecial(m, m.player)).toBe(true);
    expect(m.player.specialActive).toBeTruthy();
    expect(m.player.specialCooldownMs).toBe(0);
    advance(m, 2);
    expect(m.player.specialActive).toBe(null);
    expect(m.player.specialCooldownMs).toBeGreaterThan(0);
  });

  it('cannot fire a special while one is on cooldown', () => {
    const m = createMatch({ difficulty: 'standard', seed: 16 });
    tryFireSpecial(m, m.player);
    advance(m, 2);
    expect(tryFireSpecial(m, m.player)).toBe(false);
  });
});

describe('era-siege sim — score', () => {
  it('score is in [0, 100]', () => {
    const m = createMatch({ difficulty: 'standard', seed: 17 });
    expect(scoreMatch(m)).toBeGreaterThanOrEqual(0);
    expect(scoreMatch(m)).toBeLessThanOrEqual(100);
  });

  it('victory at era 5 in <= par time scores higher than a defeat in era 1', () => {
    const win = createMatch({ difficulty: 'standard', seed: 18 });
    win.player.eraIndex = 4;
    win.player.base.hp = BALANCE.BASE_HP;
    win.timeSec = 200;
    win.status = 'won';
    const loss = createMatch({ difficulty: 'standard', seed: 19 });
    loss.player.eraIndex = 0;
    loss.player.base.hp = 0;
    loss.timeSec = 60;
    loss.status = 'lost';
    expect(scoreMatch(win)).toBeGreaterThan(scoreMatch(loss));
  });
});

describe('era-siege sim — AI does not field future-era units', () => {
  it('AI in era 0 only spawns era-0 units', () => {
    const m = createMatch({ difficulty: 'standard', seed: 20 });
    advance(m, 30);
    for (const u of m.enemy.units) {
      const def = UNITS_BY_ID[u.unitId];
      expect(def.eraId).toBe('ember-tribe');
    }
  });
});

describe('era-siege sim — mirror match terminates', () => {
  it('a player+enemy AI mirror match resolves with a winner', () => {
    const m = createMatch({ difficulty: 'standard', seed: 21 });
    m.player.ai = makeAiBlock();
    // Run up to 10 simulated minutes; almost always terminates well before that.
    let elapsed = 0;
    while (m.status === 'playing' && elapsed < 600) {
      tick(m, 1 / 60, null);
      elapsed += 1 / 60;
    }
    expect(m.status === 'won' || m.status === 'lost').toBe(true);
    expect(m.winner === 'player' || m.winner === 'enemy').toBe(true);
  });
});

describe('era-siege sim — lowFx halves particle cap', () => {
  it('hits with lowFx on never exceed the low cap', async () => {
    const m = createMatch({ difficulty: 'standard', seed: 22 });
    m.lowFx = true;
    const { spawnHitParticles } = await import('../src/games/era-siege/sim/combat.js');
    for (let i = 0; i < 100; i++) spawnHitParticles(m, 100, 100, '#fff', 4);
    expect(m.pools.particle.live.length).toBeLessThanOrEqual(24);
  });
});

describe('era-siege perf monitor', () => {
  it('records frame time and exposes avg + p99', () => {
    const pm = makePerfMon({ deviceClass: 'desktop' });
    for (let i = 0; i < 60; i++) pm.record(0.016);
    expect(pm.avgMs()).toBeCloseTo(16, 0);
    expect(pm.p99Ms()).toBeCloseTo(16, 0);
  });

  it('does not auto-low-fx on desktop', () => {
    const pm = makePerfMon({ deviceClass: 'desktop' });
    for (let i = 0; i < 60; i++) pm.record(0.060); // 60ms / frame, very slow
    expect(pm.evaluateLowFx(performance.now() + 5000)).toBe(false);
  });

  it('latches low-fx on mobile when avg frame exceeds threshold for the window', () => {
    const pm = makePerfMon({ deviceClass: 'mobile' });
    for (let i = 0; i < 60; i++) pm.record(0.030);
    // Two evaluations spaced past the detection window.
    pm.evaluateLowFx(0);
    const latched = pm.evaluateLowFx(5000);
    expect(latched).toBe(true);
    expect(pm.lowFx).toBe(true);
  });

  it('detectDeviceClass returns a known label', () => {
    const c = detectDeviceClass();
    expect(['desktop', 'mobile', 'tablet']).toContain(c);
  });
});
