import { describe, it, expect } from 'vitest';
import { scoreToWhitePct, formatEval, ariaLabel } from '../utils/evalBar';

describe('scoreToWhitePct', () => {
  it('returns 50 for equal / null / NaN', () => {
    expect(scoreToWhitePct(0)).toBe(50);
    expect(scoreToWhitePct(null)).toBe(50);
    expect(scoreToWhitePct(undefined)).toBe(50);
    expect(scoreToWhitePct(NaN)).toBe(50);
  });
  it('clamps mate scores near the extremes', () => {
    expect(scoreToWhitePct(99_999)).toBe(98);
    expect(scoreToWhitePct(-99_999)).toBe(2);
  });
  it('produces monotonically increasing output for positive cp', () => {
    const a = scoreToWhitePct(50);
    const b = scoreToWhitePct(300);
    const c = scoreToWhitePct(800);
    expect(a).toBeGreaterThan(50);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
    expect(c).toBeLessThanOrEqual(98);
  });
  it('mirrors around 50 for negative cp', () => {
    expect(scoreToWhitePct(500) + scoreToWhitePct(-500)).toBeCloseTo(100, 5);
  });
  it('never exceeds clamp bounds', () => {
    for (const cp of [-9999, -500, -10, 0, 10, 500, 9999, 99999, -99999]) {
      const pct = scoreToWhitePct(cp);
      expect(pct).toBeGreaterThanOrEqual(2);
      expect(pct).toBeLessThanOrEqual(98);
    }
  });
});

describe('formatEval', () => {
  it('formats near-zero as 0.0', () => {
    expect(formatEval(0)).toBe('0.0');
    expect(formatEval(3)).toBe('0.0');
  });
  it('signs centipawn evals', () => {
    expect(formatEval(80)).toBe('+0.8');
    expect(formatEval(-150)).toBe('-1.5');
    expect(formatEval(1234)).toBe('+12.3');
  });
  it('returns ellipsis for nullish', () => {
    expect(formatEval(null)).toBe('…');
    expect(formatEval(undefined)).toBe('…');
  });
  it('formats mate scores as M# / -M#', () => {
    expect(formatEval(99_998)).toMatch(/^M\d+$/);
    expect(formatEval(-99_998)).toMatch(/^-M\d+$/);
  });
});

describe('ariaLabel', () => {
  it('describes equal position', () => {
    expect(ariaLabel(0)).toMatch(/equal/i);
  });
  it('describes white advantage', () => {
    expect(ariaLabel(80)).toMatch(/white better/i);
  });
  it('describes black advantage', () => {
    expect(ariaLabel(-120)).toMatch(/black better/i);
  });
  it('describes mate', () => {
    expect(ariaLabel(99_998)).toMatch(/mate in/i);
  });
  it('handles nullish', () => {
    expect(ariaLabel(null)).toMatch(/pending/i);
  });
});
