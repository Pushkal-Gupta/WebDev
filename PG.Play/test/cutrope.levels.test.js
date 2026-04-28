// Asserts the Cut-the-Rope level data is well-formed: rope endpoints
// reference real anchors, ids are unique, every level is bounded, and
// the score-rule cap covers the worst-case submission shape.

import { describe, it, expect } from 'vitest';
import { LEVELS, WORLDS, PALETTE, levelById } from '../src/games/cut-rope/levels.js';

describe('cut-rope level catalog', () => {
  it('has every level with a unique id', () => {
    const ids = LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes a palette for every theme used', () => {
    for (const l of LEVELS) {
      expect(PALETTE[l.theme], `level ${l.id} has theme ${l.theme} but no palette`).toBeDefined();
    }
  });

  it('every WORLDS entry has a palette', () => {
    for (const w of WORLDS) {
      expect(PALETTE[w.theme]).toBeDefined();
    }
  });

  it('rope endpoints reference real anchors', () => {
    for (const l of LEVELS) {
      const ids = new Set(l.anchors.map((a) => a.id));
      for (const r of l.ropes) {
        expect(ids.has(r.from), `level ${l.id} rope from=${r.from} unknown`).toBe(true);
        if (r.viaAnchor) {
          expect(ids.has(r.viaAnchor), `level ${l.id} rope via=${r.viaAnchor} unknown`).toBe(true);
        }
      }
    }
  });

  it('candy / target / stars / hazards lie within sane bounds', () => {
    const inXY = (p, ctx) => {
      expect(typeof p.x, `${ctx} missing x`).toBe('number');
      expect(typeof p.y, `${ctx} missing y`).toBe('number');
      expect(Math.abs(p.x), `${ctx} x out of range`).toBeLessThanOrEqual(7);
      expect(p.y, `${ctx} y too high`).toBeGreaterThanOrEqual(-2);
      expect(p.y, `${ctx} y too low`).toBeLessThanOrEqual(7);
    };
    for (const l of LEVELS) {
      inXY(l.candy,  `${l.id} candy`);
      inXY(l.target, `${l.id} target`);
      l.stars.forEach((s, i) => inXY(s, `${l.id} star[${i}]`));
      (l.hazards || []).forEach((h, i) => inXY(h, `${l.id} hazard[${i}]`));
    }
  });

  it('every level has at least one rope and one star', () => {
    for (const l of LEVELS) {
      expect(l.ropes.length).toBeGreaterThanOrEqual(1);
      expect(l.stars.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('worst-case score submission stays under the edge-rule cap', () => {
    // Score formula in index.jsx: stars * 10 + level.world. Max 3 stars
    // on a world-3 level = 33. Edge fn cap is 50 — comfortably under.
    const maxWorld = Math.max(...LEVELS.map((l) => l.world));
    const worstScore = 3 * 10 + maxWorld;
    expect(worstScore).toBeLessThanOrEqual(50);
  });

  it('levelById round-trip', () => {
    expect(levelById(LEVELS[0].id)).toBe(LEVELS[0]);
    expect(levelById('does-not-exist')).toBeNull();
  });
});
