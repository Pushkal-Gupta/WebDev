// Catalog integrity — assertions that mirror the prebuild script
// but run in the test harness so CI catches regressions even on
// environments that skip prebuild.

import { describe, it, expect } from 'vitest';
import { GAMES, EDITORS_PICKS, FILTERS, COLLECTIONS } from '../src/data.js';

const REQUIRED = ['id', 'name', 'cat', 'kind', 'players', 'tagline'];

describe('catalog integrity', () => {
  it('has all required fields per game', () => {
    for (const g of GAMES) {
      for (const f of REQUIRED) {
        expect(g[f], `${g.id || '<unknown>'}.${f}`).toBeTruthy();
      }
    }
  });

  it('has no duplicate ids', () => {
    const ids = GAMES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps a healthy number of playable games', () => {
    const playable = GAMES.filter((g) => g.playable);
    expect(playable.length).toBeGreaterThanOrEqual(12);
  });

  it('every EDITORS_PICKS id is playable', () => {
    for (const id of EDITORS_PICKS) {
      const g = GAMES.find((x) => x.id === id);
      expect(g, `editor pick "${id}" exists`).toBeTruthy();
      expect(g.playable, `editor pick "${id}" playable`).toBe(true);
    }
  });

  it('FILTERS each accept at least one game', () => {
    for (const f of FILTERS) {
      const matches = GAMES.filter(f.match);
      expect(matches.length, `filter "${f.id}" matches at least one game`).toBeGreaterThan(0);
    }
  });

  it('COLLECTIONS reference real ids', () => {
    const allIds = new Set(GAMES.map((g) => g.id));
    for (const c of COLLECTIONS) {
      for (const id of c.ids) {
        expect(allIds.has(id), `collection "${c.id}" → "${id}" exists`).toBe(true);
      }
    }
  });
});
