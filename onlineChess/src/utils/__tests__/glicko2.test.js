import { describe, it, expect } from 'vitest';
import { computeNewRating } from '../glicko2';

const BASE = {
  rating: 1500,
  rd: 200,
  volatility: 0.06,
  opponentRating: 1500,
  opponentRd: 100,
};

// ── Basic direction tests ───────────────────────────────────────────────────

describe('rating direction', () => {
  it('win increases rating', () => {
    const result = computeNewRating({ ...BASE, score: 1 });
    expect(result.rating).toBeGreaterThan(1500);
    expect(result.ratingChange).toBeGreaterThan(0);
  });

  it('loss decreases rating', () => {
    const result = computeNewRating({ ...BASE, score: 0 });
    expect(result.rating).toBeLessThan(1500);
    expect(result.ratingChange).toBeLessThan(0);
  });

  it('draw against equal opponent produces small change', () => {
    const result = computeNewRating({ ...BASE, score: 0.5 });
    expect(Math.abs(result.ratingChange)).toBeLessThan(10);
  });
});

// ── Hint credit vs full win ─────────────────────────────────────────────────

describe('hint credit', () => {
  it('score 0.5 (hint) gives smaller increase than score 1.0 (full win)', () => {
    const fullWin = computeNewRating({ ...BASE, score: 1 });
    const hintWin = computeNewRating({ ...BASE, score: 0.5 });
    expect(fullWin.ratingChange).toBeGreaterThan(hintWin.ratingChange);
    // score=0.5 against equal opponent is expected result → ~0 change (rounding)
    expect(hintWin.ratingChange).toBeGreaterThanOrEqual(0);
  });
});

// ── RD impact on rating swing ───────────────────────────────────────────────

describe('rating deviation impact', () => {
  it('high RD (350) gives bigger swing than low RD (60)', () => {
    const highRd = computeNewRating({ ...BASE, rd: 350, score: 1 });
    const lowRd = computeNewRating({ ...BASE, rd: 60, score: 1 });
    expect(Math.abs(highRd.ratingChange)).toBeGreaterThan(Math.abs(lowRd.ratingChange));
  });
});

// ── Opponent strength impact ────────────────────────────────────────────────

describe('opponent strength impact', () => {
  it('beating a much weaker opponent gives smaller gain than beating equal opponent', () => {
    const vsWeak = computeNewRating({
      rating: 2000, rd: 100, volatility: 0.06,
      opponentRating: 1000, opponentRd: 100,
      score: 1,
    });
    const vsEqual = computeNewRating({
      rating: 2000, rd: 100, volatility: 0.06,
      opponentRating: 2000, opponentRd: 100,
      score: 1,
    });
    expect(vsWeak.ratingChange).toBeLessThan(vsEqual.ratingChange);
    expect(vsWeak.ratingChange).toBeGreaterThanOrEqual(0); // non-negative (may round to 0)
  });

  it('losing to a much weaker opponent gives large loss', () => {
    const result = computeNewRating({
      rating: 2000, rd: 100, volatility: 0.06,
      opponentRating: 1000, opponentRd: 100,
      score: 0,
    });
    expect(result.ratingChange).toBeLessThan(0);
    expect(Math.abs(result.ratingChange)).toBeGreaterThan(10); // bigger than winning
  });

  it('upset win (weaker beats stronger) gives large gain', () => {
    const result = computeNewRating({
      rating: 1000, rd: 100, volatility: 0.06,
      opponentRating: 2000, opponentRd: 100,
      score: 1,
    });
    expect(result.ratingChange).toBeGreaterThan(10);
  });
});

// ── RD floor ────────────────────────────────────────────────────────────────

describe('RD floor', () => {
  it('RD never drops below 45', () => {
    const result = computeNewRating({
      rating: 1500, rd: 45, volatility: 0.03,
      opponentRating: 1500, opponentRd: 100,
      score: 0.5,
    });
    expect(result.rd).toBeGreaterThanOrEqual(45);
  });
});

// ── Arithmetic consistency ──────────────────────────────────────────────────

describe('arithmetic consistency', () => {
  it('result.rating equals input rating + ratingChange', () => {
    const scores = [0, 0.5, 1];
    for (const score of scores) {
      const result = computeNewRating({ ...BASE, score });
      expect(result.rating).toBe(BASE.rating + result.ratingChange);
    }
  });

  it('volatility stays positive', () => {
    const result = computeNewRating({ ...BASE, score: 1 });
    expect(result.volatility).toBeGreaterThan(0);
  });
});
