// evaluateAchievements regression. Lock down:
//   - flips false→true once per achievement
//   - is idempotent (no double-toast on the same stats blob)
//   - reads both new (easy/normal/medium/hard/insane) and legacy
//     (skirmish/standard/conquest) bestEra keys

import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, evaluateAchievements } from '../src/games/era-siege/utils/achievements.js';

function blank() {
  return {
    matches: 0, wins: 0, losses: 0,
    totalKills: 0, totalSpawns: 0, totalEvolves: 0,
    bestScore: {}, bestEra: {}, fastestWinSec: {},
    daily: { longestStreak: 0 },
    endless: { longestSec: 0 },
    achievements: [],
  };
}

describe('achievements', () => {
  it('exports a non-empty list of definitions', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThan(5);
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(typeof a.test).toBe('function');
    }
  });

  it('flips first-blood when totalKills >= 1', () => {
    const s = blank();
    s.totalKills = 0;
    expect(evaluateAchievements(s).map((a) => a.id)).not.toContain('first-blood');
    s.totalKills = 1;
    expect(evaluateAchievements(s).map((a) => a.id)).toContain('first-blood');
  });

  it('is idempotent — same stats blob returns no new unlocks the second call', () => {
    const s = blank();
    s.totalKills = 5;
    s.wins = 1;
    const first = evaluateAchievements(s);
    expect(first.length).toBeGreaterThan(0);
    const second = evaluateAchievements(s);
    expect(second.length).toBe(0);
  });

  it('beat-normal triggers on the legacy standard key', () => {
    const s = blank();
    s.bestEra = { standard: 2 };
    const ids = evaluateAchievements(s).map((a) => a.id);
    expect(ids).toContain('beat-normal');
  });

  it('beat-hard triggers on the legacy conquest key', () => {
    const s = blank();
    s.bestEra = { conquest: 3 };
    const ids = evaluateAchievements(s).map((a) => a.id);
    expect(ids).toContain('beat-hard');
  });

  it('apex-era triggers when any bestEra reaches 5', () => {
    const s = blank();
    s.bestEra = { hard: 5 };
    const ids = evaluateAchievements(s).map((a) => a.id);
    expect(ids).toContain('apex-era');
  });
});
