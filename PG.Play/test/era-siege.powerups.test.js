// Era Siege — power-up tree tests.

import { describe, it, expect } from 'vitest';
import { createMatch, tick } from '../src/games/era-siege/sim/world.js';
import { tryBuyPowerup, getMultiplier, POWERUP_DEFS, makePowerupsState } from '../src/games/era-siege/sim/powerups.js';
import { tryFireSpecial } from '../src/games/era-siege/sim/specials.js';
import { BALANCE } from '../src/games/era-siege/content/balance.js';

describe('era-siege powerups — defs + state', () => {
  it('exports four trees with three levels each', () => {
    expect(POWERUP_DEFS).toHaveLength(4);
    for (const d of POWERUP_DEFS) {
      expect(d.levels).toHaveLength(3);
      // Levels ramp in cost.
      expect(d.levels[0].cost).toBeLessThan(d.levels[1].cost);
      expect(d.levels[1].cost).toBeLessThan(d.levels[2].cost);
    }
  });

  it('blank state is all zeros', () => {
    const s = makePowerupsState();
    expect(s).toEqual({ economy: 0, base: 0, special: 0, turret: 0 });
  });

  it('multiplier formulas', () => {
    expect(getMultiplier({ economy: 0 }, 'economy')).toBe(1);
    expect(getMultiplier({ economy: 1 }, 'economy')).toBeCloseTo(1.10);
    expect(getMultiplier({ economy: 3 }, 'economy')).toBeCloseTo(1.30);
    expect(getMultiplier({ special: 2 }, 'special')).toBeCloseTo(0.80);
    expect(getMultiplier({ turret: 3 },  'turret')).toBeCloseTo(1.30);
  });
});

describe('era-siege powerups — buying', () => {
  it('tryBuyPowerup deducts gold and increments level', () => {
    const m = createMatch({ difficulty: 'standard', seed: 1 });
    m.player.gold = 1000;
    expect(tryBuyPowerup(m, m.player, 'economy')).toBe(true);
    expect(m.player.powerups.economy).toBe(1);
    expect(m.player.gold).toBe(1000 - 80);
  });

  it('tryBuyPowerup fails when broke', () => {
    const m = createMatch({ difficulty: 'standard', seed: 2 });
    m.player.gold = 5;
    expect(tryBuyPowerup(m, m.player, 'economy')).toBe(false);
    expect(m.player.powerups.economy).toBe(0);
  });

  it('cannot buy past max level', () => {
    const m = createMatch({ difficulty: 'standard', seed: 3 });
    m.player.gold = 100000;
    expect(tryBuyPowerup(m, m.player, 'special')).toBe(true);
    expect(tryBuyPowerup(m, m.player, 'special')).toBe(true);
    expect(tryBuyPowerup(m, m.player, 'special')).toBe(true);
    expect(tryBuyPowerup(m, m.player, 'special')).toBe(false);
    expect(m.player.powerups.special).toBe(3);
  });

  it('Bastion immediately raises maxHp + adds headroom hp', () => {
    const m = createMatch({ difficulty: 'standard', seed: 4 });
    const startMax = m.player.base.maxHp;
    m.player.gold = 1000;
    tryBuyPowerup(m, m.player, 'base');
    expect(m.player.base.maxHp).toBe(Math.round(startMax * 1.1));
    // HP also climbed by the headroom delta.
    expect(m.player.base.hp).toBeGreaterThan(startMax - 1);
  });
});

describe('era-siege powerups — applied at sim sites', () => {
  it('Treasury accelerates the gold trickle', () => {
    const STEP = 1 / 60;
    const baseline = createMatch({ difficulty: 'standard', seed: 5 });
    const tuned    = createMatch({ difficulty: 'standard', seed: 5 });
    tuned.player.gold = 1000;
    tryBuyPowerup(tuned, tuned.player, 'economy'); // +10%
    tuned.player.gold = baseline.player.gold;       // re-align starting gold
    for (let t = 0; t < 5; t += STEP) tick(baseline, STEP, null);
    for (let t = 0; t < 5; t += STEP) tick(tuned,    STEP, null);
    // Baseline trickled at era-1 12 g/s, tuned at 13.2 g/s — non-trivial gap.
    expect(tuned.player.gold).toBeGreaterThan(baseline.player.gold);
  });

  it('Resonance shortens the next special cooldown after impact', () => {
    const m = createMatch({ difficulty: 'standard', seed: 6 });
    m.player.gold = 1000;
    tryBuyPowerup(m, m.player, 'special');
    tryBuyPowerup(m, m.player, 'special'); // -20%
    tryFireSpecial(m, m.player);
    // Drive the telegraph (800ms) past impact, then a small overshoot.
    for (let t = 0; t < 1; t += 1 / 60) tick(m, 1 / 60, null);
    // Default ember-volley cooldown is 28000ms; -20% → 22400ms.
    // After ~200ms post-impact tick, remaining is ~22200ms.
    expect(m.player.specialCooldownMs).toBeGreaterThan(21800);
    expect(m.player.specialCooldownMs).toBeLessThan(22500);
  });
});
