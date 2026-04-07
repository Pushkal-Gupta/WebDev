import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage before anything else
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};

// Mock Supabase before importing the store
vi.mock('../../utils/supabase', () => {
  const chainable = (resolveValue) => {
    const chain = {};
    const methods = ['select', 'eq', 'gte', 'lte', 'contains', 'limit', 'order', 'maybeSingle'];
    methods.forEach(m => { chain[m] = vi.fn(() => chain); });
    chain.single = vi.fn(() => Promise.resolve(resolveValue));
    chain.upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    chain.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    // Make the chain itself thenable so `await supabase.from(...).select(...)...` resolves
    chain.then = (resolve) => resolve(resolveValue);
    return chain;
  };

  return {
    supabase: {
      from: vi.fn(() => chainable({ data: null, error: null })),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
});

const { default: usePuzzleStore } = await import('../puzzleStore');

// ── Test fixtures: real chess positions ──────────────────────────────────────

// Scholar's mate: Qxf7# — single move, odd count (no setup move)
const MATE_IN_ONE = {
  id: 'test-mate1',
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
  moves: 'h5f7',
  rating: 600,
  themes: ['mateIn1'],
};

// 4-move puzzle (even count): setup + 3 alternating moves
// Position after 1.e4 e5 2.Nf3 Nc6 3.Bc4 d6 4.__ Bg4
// Setup: d2d4, Player: g4f3, Opp: g2f3, Player: c6d4
const STANDARD_4MOVE = {
  id: 'test-fork1',
  fen: 'r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 5',
  moves: 'd2d4 g4f3 g2f3 c6d4',
  rating: 1200,
  themes: ['fork', 'middlegame'],
};

// Promotion: single move, odd count — pawn on e7 promotes to e8
const UNDERPROMOTION = {
  id: 'test-underprom',
  fen: '6k1/4P3/8/8/8/8/8/2K5 w - - 0 1',
  moves: 'e7e8n',
  rating: 1800,
  themes: ['underPromotion', 'short'],
};

// 2-move puzzle (even count): setup + player answer
// Back rank idea: White Rb1+Rf1, Black Ra2, K on g8
// Setup: f1e1, Player: a2a1
const TWO_MOVE = {
  id: 'test-2move',
  fen: '6k1/5ppp/8/8/8/8/r4PPP/1R3RK1 w - - 0 1',
  moves: 'f1e1 a2a1',
  rating: 1000,
  themes: ['backRankMate'],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function getStore() {
  return usePuzzleStore.getState();
}

// ── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  getStore().reset();
  localStorage.clear();
});

// ── _initPuzzle ─────────────────────────────────────────────────────────────

describe('_initPuzzle', () => {
  it('odd move count (1 move): no setup, moveIndex=0, player plays from FEN', () => {
    const result = getStore()._initPuzzle(MATE_IN_ONE);
    const state = getStore();

    expect(result).toBe(true);
    expect(state.moveIndex).toBe(0);
    expect(state.playerColor).toBe('w'); // FEN says white to move
    expect(state.currentFen).toBe(MATE_IN_ONE.fen);
    expect(state.status).toBe('playing');
    expect(state.setupMoveFrom).toBeNull();
    expect(state.setupMoveTo).toBeNull();
  });

  it('even move count (4 moves): setup move played, moveIndex=1', () => {
    const result = getStore()._initPuzzle(STANDARD_4MOVE);
    const state = getStore();

    expect(result).toBe(true);
    expect(state.moveIndex).toBe(1);
    expect(state.playerColor).toBe('b'); // After white plays d4, it's black's turn
    expect(state.currentFen).not.toBe(STANDARD_4MOVE.fen); // FEN changed by setup move
    expect(state.status).toBe('playing');
    // Setup move was d2d4 → from d2 (row=6,col=3) to d4 (row=4,col=3)
    expect(state.setupMoveFrom).toEqual([6, 3]);
    expect(state.setupMoveTo).toEqual([4, 3]);
  });

  it('even move count (2 moves): setup move played, moveIndex=1', () => {
    const result = getStore()._initPuzzle(TWO_MOVE);
    const state = getStore();

    expect(result).toBe(true);
    expect(state.moveIndex).toBe(1);
    expect(state.playerColor).toBe('b'); // After white plays Re1, it's black's turn
    expect(state.status).toBe('playing');
  });

  it('returns false for invalid FEN', () => {
    const result = getStore()._initPuzzle({ fen: 'not-a-valid-fen', moves: 'e2e4', id: 'bad', rating: 1000 });
    expect(result).toBe(false);
  });

  it('returns false for empty moves', () => {
    const result = getStore()._initPuzzle({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: '',
      id: 'empty',
      rating: 1000,
    });
    expect(result).toBe(false);
  });

  it('builds solution line after init', () => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    const state = getStore();

    expect(state.solutionMoves.length).toBe(4);
    expect(state.solutionMoves[0].uci).toBe('d2d4');
    state.solutionMoves.forEach(move => {
      expect(move).toHaveProperty('uci');
      expect(move).toHaveProperty('san');
      expect(move).toHaveProperty('fen');
    });
  });
});

// ── handlePlayerMove (rated mode) ───────────────────────────────────────────

describe('handlePlayerMove — rated mode', () => {
  it('correct first move advances puzzle', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    // moveIndex=1, player must play g4f3 (Bxf3)
    const result = await getStore().handlePlayerMove('g4f3');

    expect(result.correct).toBe(true);
    const state = getStore();
    // After player g4f3, opponent auto-plays g2f3 → moveIndex jumps by 2
    expect(state.moveIndex).toBe(3);
  });

  it('correct final move solves puzzle', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);

    // First correct move: g4f3 → opponent plays g2f3 → moveIndex=3
    await getStore().handlePlayerMove('g4f3');

    // Second correct move: c6d4 → puzzle solved
    const result = await getStore().handlePlayerMove('c6d4');

    expect(result.correct).toBe(true);
    expect(result.solved).toBe(true);
    expect(getStore().status).toBe('solved');
  });

  it('single-move puzzle: correct move solves immediately', async () => {
    getStore()._initPuzzle(MATE_IN_ONE);
    // moveIndex=0, player plays h5f7 (Qxf7#)
    const result = await getStore().handlePlayerMove('h5f7');

    expect(result.correct).toBe(true);
    expect(result.solved).toBe(true);
    expect(getStore().status).toBe('solved');
  });

  it('wrong move allows retry in rated mode', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);

    const result = await getStore().handlePlayerMove('e7e5'); // wrong move
    const state = getStore();

    expect(result.correct).toBe(false);
    expect(result.canRetry).toBe(true);
    expect(state.wrongAttempt).toBe(true);
    expect(state.attempts).toBe(1);
    expect(state.status).toBe('playing'); // still playing
    expect(state.moveIndex).toBe(1); // unchanged
  });

  it('opponent auto-plays between player moves', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    const fenBeforeMove = getStore().currentFen;

    await getStore().handlePlayerMove('g4f3'); // correct

    const state = getStore();
    // FEN should have changed twice (player move + opponent response)
    expect(state.currentFen).not.toBe(fenBeforeMove);
    // moveIndex should be 3 (was 1, +1 for player, +1 for opponent)
    expect(state.moveIndex).toBe(3);
    expect(state.status).toBe('playing'); // puzzle continues
  });

  it('correct move resets wrongAttempt and attempts', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);

    // Make a wrong move first
    await getStore().handlePlayerMove('e7e5');
    expect(getStore().wrongAttempt).toBe(true);
    expect(getStore().attempts).toBe(1);

    // Now make the correct move
    await getStore().handlePlayerMove('g4f3');
    expect(getStore().wrongAttempt).toBe(false);
    expect(getStore().attempts).toBe(0);
  });
});

// ── handlePlayerMove (rush mode) ────────────────────────────────────────────

describe('handlePlayerMove — rush mode', () => {
  beforeEach(() => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    usePuzzleStore.setState({ mode: 'rush', rushActive: true, rushStrikes: 0, rushScore: 0 });
  });

  it('wrong move adds a strike', async () => {
    const result = await getStore().handlePlayerMove('a7a6');
    expect(result.correct).toBe(false);
    expect(getStore().rushStrikes).toBe(1);
  });

  it('third strike ends rush', async () => {
    usePuzzleStore.setState({ rushStrikes: 2 });
    const result = await getStore().handlePlayerMove('a7a6');
    expect(result.correct).toBe(false);
    expect(result.rushOver).toBe(true);
    expect(getStore().rushActive).toBe(false);
    expect(getStore().status).toBe('rush_over');
  });
});

// ── handlePlayerMove (streak mode) ──────────────────────────────────────────

describe('handlePlayerMove — streak mode', () => {
  beforeEach(() => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    usePuzzleStore.setState({ mode: 'streak', streakActive: true, streakCount: 5, streakDifficulty: 1050 });
  });

  it('wrong move ends streak', async () => {
    const result = await getStore().handlePlayerMove('a7a6');
    expect(result.correct).toBe(false);
    expect(result.streakOver).toBe(true);
    expect(getStore().streakActive).toBe(false);
    expect(getStore().status).toBe('streak_over');
  });
});

// ── Promotion move matching ─────────────────────────────────────────────────

describe('promotion move matching', () => {
  it('knight promotion e7e8n is correct for underpromotion puzzle', async () => {
    getStore()._initPuzzle(UNDERPROMOTION);
    const result = await getStore().handlePlayerMove('e7e8n');
    expect(result.correct).toBe(true);
    expect(result.solved).toBe(true);
  });

  it('queen promotion e7e8q is WRONG for underpromotion puzzle', async () => {
    getStore()._initPuzzle(UNDERPROMOTION);
    const result = await getStore().handlePlayerMove('e7e8q');
    expect(result.correct).toBe(false);
  });
});

// ── Review mode ─────────────────────────────────────────────────────────────

describe('review mode', () => {
  beforeEach(() => {
    getStore()._initPuzzle(STANDARD_4MOVE);
  });

  it('enterReviewMode sets index=0 and shows original FEN', () => {
    getStore().enterReviewMode();
    const state = getStore();

    expect(state.reviewMode).toBe(true);
    expect(state.reviewIndex).toBe(0);
    expect(state.currentFen).toBe(STANDARD_4MOVE.fen);
  });

  it('reviewStep(1) advances through solution', () => {
    getStore().enterReviewMode();
    const { solutionMoves } = getStore();

    getStore().reviewStep(1);
    expect(getStore().reviewIndex).toBe(1);
    expect(getStore().currentFen).toBe(solutionMoves[0].fen);

    getStore().reviewStep(1);
    expect(getStore().reviewIndex).toBe(2);
    expect(getStore().currentFen).toBe(solutionMoves[1].fen);
  });

  it('reviewStep(-1) goes backward', () => {
    getStore().enterReviewMode();
    getStore().reviewStep(1);
    getStore().reviewStep(1); // now at index 2

    getStore().reviewStep(-1);
    expect(getStore().reviewIndex).toBe(1);

    getStore().reviewStep(-1);
    expect(getStore().reviewIndex).toBe(0);
    expect(getStore().currentFen).toBe(STANDARD_4MOVE.fen);
  });

  it('reviewStep respects bounds — cannot go below 0', () => {
    getStore().enterReviewMode();
    const result = getStore().reviewStep(-1);
    expect(result).toBeNull();
    expect(getStore().reviewIndex).toBe(0);
  });

  it('reviewStep respects bounds — cannot exceed solutionMoves.length', () => {
    getStore().enterReviewMode();
    const { solutionMoves } = getStore();

    // Advance to the end
    for (let i = 0; i < solutionMoves.length; i++) {
      getStore().reviewStep(1);
    }
    expect(getStore().reviewIndex).toBe(solutionMoves.length);

    // Try going past the end
    const result = getStore().reviewStep(1);
    expect(result).toBeNull();
    expect(getStore().reviewIndex).toBe(solutionMoves.length);
  });
});

// ── giveUp ──────────────────────────────────────────────────────────────────

describe('giveUp', () => {
  it('sets status to failed and resets streak', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    usePuzzleStore.setState({ streak: 3 });

    await getStore().giveUp();
    expect(getStore().status).toBe('failed');
    expect(getStore().streak).toBe(0);
  });
});

// ── retryPuzzle ─────────────────────────────────────────────────────────────

describe('retryPuzzle', () => {
  it('resets even-count puzzle to initial state with setup replayed', async () => {
    getStore()._initPuzzle(STANDARD_4MOVE);
    const initialFen = getStore().currentFen;
    const initialMoveIndex = getStore().moveIndex;

    // Make a wrong move
    await getStore().handlePlayerMove('e7e5');

    // Retry
    getStore().retryPuzzle();
    const state = getStore();

    expect(state.moveIndex).toBe(initialMoveIndex);
    expect(state.currentFen).toBe(initialFen);
    expect(state.status).toBe('playing');
    expect(state.wrongAttempt).toBe(false);
    expect(state.hintUsed).toBe(false);
    expect(state.attempts).toBe(0);
  });

  it('resets odd-count puzzle to FEN position directly', () => {
    getStore()._initPuzzle(MATE_IN_ONE);

    getStore().retryPuzzle();
    const state = getStore();

    expect(state.moveIndex).toBe(0);
    expect(state.currentFen).toBe(MATE_IN_ONE.fen);
    expect(state.status).toBe('playing');
    expect(state.setupMoveFrom).toBeNull();
  });
});

// ── Hint system ─────────────────────────────────────────────────────────────

describe('hint system', () => {
  it('getHint reveals correct move squares', () => {
    getStore()._initPuzzle(MATE_IN_ONE);
    getStore().getHint();
    const state = getStore();

    expect(state.hintSquare).toEqual({ from: 'h5', to: 'f7' });
    expect(state.hintUsed).toBe(true);
  });

  it('clearHint removes hint square but keeps hintUsed flag', () => {
    getStore()._initPuzzle(MATE_IN_ONE);
    getStore().getHint();
    getStore().clearHint();
    const state = getStore();

    expect(state.hintSquare).toBeNull();
    expect(state.hintUsed).toBe(true); // penalty stays
  });
});

// ── Bug regression: _shownBuiltinIds ────────────────────────────────────────

describe('_shownBuiltinIds regression', () => {
  it('startRush does not throw ReferenceError', async () => {
    // This would crash before the fix because _shownBuiltinIds was undeclared
    await expect(getStore().startRush(180)).resolves.not.toThrow();
  });

  it('startStreak does not throw ReferenceError', async () => {
    await expect(getStore().startStreak()).resolves.not.toThrow();
  });
});
