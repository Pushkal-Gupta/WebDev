import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage
const store = {};
globalThis.localStorage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};

// Mock sound manager
vi.mock('../../utils/soundManager', () => ({
  playSoundForMove: vi.fn(),
  playSound: vi.fn(),
  setSoundToggles: vi.fn(),
  setSoundEnabled: vi.fn(),
  setSoundVolume: vi.fn(),
  setSoundTheme: vi.fn(),
}));

const { default: useGameStore } = await import('../gameStore');

function getState() { return useGameStore.getState(); }
function setState(s) { useGameStore.setState(s); }

// Board coordinates: row 0 = rank 8, row 7 = rank 1
// sq('e2') = { row: 6, col: 4 }, sq('e7') = { row: 1, col: 4 }
function sq(algebraic) {
  return {
    row: 8 - parseInt(algebraic[1]),
    col: algebraic.charCodeAt(0) - 'a'.charCodeAt(0),
  };
}

// Start a computer game. Human is opposite of compColor.
function startCompGame(compColor = 'white') {
  getState().startGame({ total: 300000, incr: 0, cat: 'rapid' }, true, compColor, 4);
}

function startOnlineGame(playerColor = 'white') {
  getState().startOnlineGame({ total: 300000, incr: 0, cat: 'rapid' }, playerColor);
}

// Force a move bypassing turn validation (simulates opponent/engine)
function forceMove(from, to, promo) {
  return getState().makeMove(from, to, promo || null, true);
}

// ─── INVARIANT CHECKERS ─────────────────────────────────────────────────────

// Core visual consistency check: if premove is null, no cell would render
// a premove highlight or ghost piece. If game is over, premove must be null.
function assertPremoveClean() {
  const { premove, gameOver } = getState();
  if (gameOver) {
    expect(premove).toBeNull();
    return;
  }
  if (!premove) return; // null is always clean

  // If premove exists, coordinates must be in bounds
  if (premove.from) {
    expect(premove.from.row).toBeGreaterThanOrEqual(0);
    expect(premove.from.row).toBeLessThan(8);
    expect(premove.from.col).toBeGreaterThanOrEqual(0);
    expect(premove.from.col).toBeLessThan(8);
  }
  if (premove.to) {
    expect(premove.to.row).toBeGreaterThanOrEqual(0);
    expect(premove.to.row).toBeLessThan(8);
    expect(premove.to.col).toBeGreaterThanOrEqual(0);
    expect(premove.to.col).toBeLessThan(8);
  }
}

// Verify boardState (what Cell.jsx renders) matches chess.js engine state
function assertBoardMatchesEngine() {
  const { chessInstance, boardState } = getState();
  if (!chessInstance || !boardState) return;
  const engine = chessInstance.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const e = engine[r][c];
      const u = boardState[r][c];
      if (!e) {
        expect(u).toBeNull();
      } else {
        expect(u).not.toBeNull();
        expect(u.type).toBe(e.type);
        expect(u.color).toBe(e.color);
      }
    }
  }
}

// Verify that for every cell, the rendered premove highlight matches
// what Cell.jsx would compute from the current premove state.
function assertNoPremoveHighlights() {
  const { premove } = getState();
  expect(premove).toBeNull();
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

describe('Premove system', () => {
  beforeEach(() => {
    getState().init();
  });

  // ── Basic lifecycle ──────────────────────────────────────────────────────

  describe('Basic premove lifecycle', () => {
    it('premove starts null after game init', () => {
      startCompGame('white'); // comp=white, human=black
      expect(getState().premove).toBeNull();
    });

    it('sets premove source when clicking own piece during opponent turn', () => {
      startCompGame('white'); // comp=white (moves first), human=black
      expect(getState().activeColor).toBe('w'); // white's turn = opponent
      // Click black pawn at e7 (row 1, col 4)
      getState().selectSquare(sq('e7').row, sq('e7').col);
      const pm = getState().premove;
      expect(pm).not.toBeNull();
      expect(pm.from).toEqual(sq('e7'));
      expect(pm.to).toBeNull();
      expect(pm.piece).toEqual({ type: 'p', color: 'b' });
      assertPremoveClean();
    });

    it('sets premove destination on legal square click', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col); // source
      getState().selectSquare(sq('e5').row, sq('e5').col); // destination
      const pm = getState().premove;
      expect(pm).not.toBeNull();
      expect(pm.from).toEqual(sq('e7'));
      expect(pm.to).toEqual(sq('e5'));
      assertPremoveClean();
    });

    it('cancels premove when clicking source square again', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      expect(getState().premove).not.toBeNull();
      getState().selectSquare(sq('e7').row, sq('e7').col); // same square
      expect(getState().premove).toBeNull();
    });

    it('replaces premove source when clicking a different own piece', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col); // e7 pawn
      expect(getState().premove.from).toEqual(sq('e7'));
      getState().selectSquare(sq('b8').row, sq('b8').col); // b8 knight
      const pm = getState().premove;
      expect(pm.from).toEqual(sq('b8'));
      expect(pm.to).toBeNull();
      expect(pm.piece.type).toBe('n');
    });

    it('ignores clicks on illegal destination squares', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col); // e7 pawn
      // d5 is not a legal pawn move from e7 in starting position
      getState().selectSquare(sq('d5').row, sq('d5').col);
      const pm = getState().premove;
      expect(pm.from).toEqual(sq('e7'));
      expect(pm.to).toBeNull(); // destination NOT set
    });

    it('clears premove when clicking empty square with no premove source', () => {
      startCompGame('white');
      // Click empty square d5 (no premove source set)
      getState().selectSquare(sq('d5').row, sq('d5').col);
      expect(getState().premove).toBeNull();
    });
  });

  // ── Turn change clears stale premove ──────────────────────────────────────

  describe('Premove cleared on turn change to normal mode', () => {
    it('partial premove (source only) cleared when entering normal mode', () => {
      startCompGame('white'); // comp=white, human=black
      // Set premove source during white's (computer's) turn
      getState().selectSquare(sq('e7').row, sq('e7').col);
      expect(getState().premove).not.toBeNull();

      // Computer makes a move → now it's black's turn
      forceMove(sq('e2'), sq('e4'));
      expect(getState().activeColor).toBe('b');

      // Human clicks own piece in normal mode → premove cleared
      getState().selectSquare(sq('d7').row, sq('d7').col);
      expect(getState().premove).toBeNull();
      assertPremoveClean();
    });

    it('complete premove cleared if player clicks before executePremove fires', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);
      expect(getState().premove).not.toBeNull();

      forceMove(sq('e2'), sq('e4')); // computer moves
      // Player clicks before setTimeout(executePremove, 50) fires
      getState().selectSquare(sq('d7').row, sq('d7').col);
      expect(getState().premove).toBeNull();
    });
  });

  // ── executePremove ────────────────────────────────────────────────────────

  describe('executePremove', () => {
    it('executes valid premove and clears state', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);

      forceMove(sq('e2'), sq('e4')); // computer moves, now black's turn
      const ok = getState().executePremove();
      expect(ok).toBe(true);
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
      // Verify e5 has a black pawn
      const e5 = getState().chessInstance.get('e5');
      expect(e5).not.toBeNull();
      expect(e5.type).toBe('p');
      expect(e5.color).toBe('b');
    });

    it('fails gracefully when premoved piece was captured', () => {
      startCompGame('white');
      // Manually set a premove that will be invalid after board changes
      setState({
        premove: { from: sq('a1'), to: sq('a3'), piece: { type: 'r', color: 'b' } },
      });
      forceMove(sq('e2'), sq('e4'));
      // a1 has a white rook, not black → move is illegal
      const ok = getState().executePremove();
      expect(ok).toBe(false);
      assertNoPremoveHighlights(); // premove cleared even on failure
    });

    it('clears premove when game is over', () => {
      startCompGame('white');
      setState({
        premove: { from: sq('e7'), to: sq('e5'), piece: { type: 'p', color: 'b' } },
        gameOver: true,
      });
      const ok = getState().executePremove();
      expect(ok).toBe(false);
      assertNoPremoveHighlights();
    });

    it('clears premove when destination is null (partial premove)', () => {
      startCompGame('white');
      setState({
        premove: { from: sq('e7'), to: null, piece: { type: 'p', color: 'b' } },
      });
      forceMove(sq('e2'), sq('e4'));
      const ok = getState().executePremove();
      expect(ok).toBe(false);
      assertNoPremoveHighlights();
    });

    it('auto-promotes premoved pawn to queen', () => {
      startCompGame('white');
      // Set up position where black pawn can promote
      const chess = getState().chessInstance;
      chess.load('8/8/8/8/8/8/k1p5/4K3 b - - 0 1');
      setState({ boardState: chess.board(), activeColor: 'b' });
      // Premove c2-c1 promotion
      setState({
        premove: { from: sq('c2'), to: sq('c1'), piece: { type: 'p', color: 'b' } },
      });
      const ok = getState().executePremove();
      expect(ok).toBe(true);
      assertNoPremoveHighlights();
      // c1 should have a black queen
      const c1 = getState().chessInstance.get('c1');
      expect(c1).not.toBeNull();
      expect(c1.type).toBe('q');
      expect(c1.color).toBe('b');
    });
  });

  // ── Premove preserved through opponent's _bypassValidation move ────────

  describe('Premove preservation through opponent move', () => {
    it('premove survives opponent move (bypass) so caller can execute it', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);
      expect(getState().premove).not.toBeNull();

      // Opponent moves with _bypassValidation=true
      forceMove(sq('e2'), sq('e4'));
      // Premove must still exist
      expect(getState().premove).not.toBeNull();
      expect(getState().premove.to).toEqual(sq('e5'));
    });

    it('premove cleared by user-initiated move (no bypass)', () => {
      startOnlineGame('white');
      setState({
        premove: { from: sq('e2'), to: sq('e4'), piece: { type: 'p', color: 'w' } },
      });
      // User makes their own move
      getState().makeMove(sq('d2'), sq('d4'));
      assertNoPremoveHighlights();
    });
  });

  // ── Game-ending paths ─────────────────────────────────────────────────────

  describe('Premove cleared on game end', () => {
    it('checkGameOver clears premove on checkmate', () => {
      startCompGame('white');
      setState({
        premove: { from: sq('a7'), to: sq('a5'), piece: { type: 'p', color: 'b' } },
      });
      // Fool's mate position — black wins
      const chess = getState().chessInstance;
      chess.load('rnb1kbnr/pppp1ppp/4p3/8/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3');
      setState({ boardState: chess.board() });
      getState().checkGameOver();
      expect(getState().gameOver).toBe(true);
      assertNoPremoveHighlights();
    });

    it('timeExpired clears premove', () => {
      startCompGame('white');
      setState({
        premove: { from: sq('e7'), to: sq('e5'), piece: { type: 'p', color: 'b' } },
      });
      getState().timeExpired('w');
      expect(getState().gameOver).toBe(true);
      assertNoPremoveHighlights();
    });
  });

  // ── Undo paths ────────────────────────────────────────────────────────────

  describe('Premove cleared on undo', () => {
    it('undoMove clears premove', () => {
      startCompGame('white');
      forceMove(sq('e2'), sq('e4'));
      setState({
        premove: { from: sq('e7'), to: sq('e5'), piece: { type: 'p', color: 'b' } },
      });
      getState().undoMove();
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
    });

    it('undoTwoMoves clears premove', () => {
      startCompGame('white');
      forceMove(sq('e2'), sq('e4'));
      forceMove(sq('e7'), sq('e5'));
      setState({
        premove: { from: sq('d7'), to: sq('d5'), piece: { type: 'p', color: 'b' } },
      });
      getState().undoTwoMoves();
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
    });
  });

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  describe('Drag-and-drop premove path', () => {
    it('drag during opponent turn sets premove via selectSquare', () => {
      startCompGame('white');
      // Drag start calls selectSquare for premove source
      getState().selectSquare(sq('e7').row, sq('e7').col);
      expect(getState().premove?.from).toEqual(sq('e7'));

      // makeMove fails during opponent's turn (returns false)
      const ok = getState().makeMove(sq('e7'), sq('e5'));
      expect(ok).toBe(false);
      // Then selectSquare sets the premove destination
      getState().selectSquare(sq('e5').row, sq('e5').col);
      expect(getState().premove?.to).toEqual(sq('e5'));
      assertPremoveClean();
    });
  });

  // ── Online game paths ─────────────────────────────────────────────────────

  describe('Online game premove', () => {
    it('premove preserved after online opponent move arrives', () => {
      startOnlineGame('black');
      // Black premoves while it's white's turn
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);
      expect(getState().premove?.to).toEqual(sq('e5'));

      // White's move arrives (bypass validation)
      forceMove(sq('d2'), sq('d4'));
      // Premove must still exist
      expect(getState().premove).not.toBeNull();
      assertPremoveClean();
    });

    it('premove executes after online opponent move', () => {
      startOnlineGame('black');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);

      forceMove(sq('e2'), sq('e4')); // opponent moves
      // Execute premove (simulates the setTimeout callback)
      const ok = getState().executePremove();
      expect(ok).toBe(true);
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
    });
  });

  // ── Variation branching ───────────────────────────────────────────────────

  describe('Premove cleared in analysis branching', () => {
    it('variation branch clears premove', () => {
      // Start a local (non-live) game so branching is allowed
      getState().startGame({ total: 0, incr: 0, cat: null }, false, 'black', 4);
      forceMove(sq('e2'), sq('e4'));
      forceMove(sq('e7'), sq('e5'));
      forceMove(sq('g1'), sq('f3'));
      // Go back in history
      setState({ currentMoveIndex: 0 });
      // Manually set a premove
      setState({
        premove: { from: sq('d7'), to: sq('d5'), piece: { type: 'p', color: 'b' } },
      });
      // Make a branching move (from historical position)
      getState().makeMove(sq('d7'), sq('d5'), null, true);
      assertNoPremoveHighlights();
    });
  });

  // ── Stress simulation ─────────────────────────────────────────────────────

  describe('Simulated games with premove stress', () => {
    function playRandomGame(numMoves) {
      const failures = [];
      const chess = getState().chessInstance;

      for (let i = 0; i < numMoves && !getState().gameOver; i++) {
        const moves = chess.moves({ verbose: true });
        if (moves.length === 0) break;

        // Randomly attempt a premove before each move
        if (Math.random() > 0.5) {
          const randomRow = Math.floor(Math.random() * 8);
          const randomCol = Math.floor(Math.random() * 8);
          getState().selectSquare(randomRow, randomCol);
          if (Math.random() > 0.3 && getState().premove) {
            const dstRow = Math.floor(Math.random() * 8);
            const dstCol = Math.floor(Math.random() * 8);
            getState().selectSquare(dstRow, dstCol);
          }
        }

        // Make a random legal move
        const move = moves[Math.floor(Math.random() * moves.length)];
        const from = { row: 8 - parseInt(move.from[1]), col: move.from.charCodeAt(0) - 97 };
        const to = { row: 8 - parseInt(move.to[1]), col: move.to.charCodeAt(0) - 97 };
        forceMove(from, to, move.promotion);

        // After opponent move, try executing premove
        if (getState().premove?.to) {
          getState().executePremove();
        }

        // INVARIANT: after any move + optional premove execution,
        // board state must match engine and premove must be clean
        try {
          assertBoardMatchesEngine();
          assertPremoveClean();
        } catch (e) {
          failures.push({
            moveNum: i,
            fen: chess.fen(),
            premove: getState().premove,
            error: e.message,
          });
        }
      }

      // After game ends, premove must be null
      if (getState().gameOver && getState().premove !== null) {
        failures.push({
          moveNum: 'end',
          premove: getState().premove,
          error: 'premove not null after game over',
        });
      }

      return failures;
    }

    it('100 random games produce zero visual inconsistencies', { timeout: 30000 }, () => {
      const allFailures = [];

      for (let g = 0; g < 100; g++) {
        getState().init();
        startCompGame(g % 2 === 0 ? 'white' : 'black');
        const failures = playRandomGame(40);
        if (failures.length > 0) {
          allFailures.push({ game: g, failures });
        }
      }

      if (allFailures.length > 0) {
        console.error('FAILURES:', JSON.stringify(allFailures, null, 2));
      }
      expect(allFailures).toEqual([]);
    });
  });

  // ── Render invariant: no ghost piece without premove.to + premove.piece ──

  describe('State-render consistency invariants', () => {
    it('premove=null means zero premove highlights on any cell', () => {
      startCompGame('white');
      expect(getState().premove).toBeNull();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const pm = getState().premove;
          expect(pm?.from?.row === r && pm?.from?.col === c).toBe(false);
          expect(pm?.to?.row === r && pm?.to?.col === c).toBe(false);
        }
      }
    });

    it('boardState matches engine after init', () => {
      startCompGame('white');
      assertBoardMatchesEngine();
    });

    it('boardState matches engine after multiple moves', () => {
      startCompGame('white');
      forceMove(sq('e2'), sq('e4'));
      forceMove(sq('e7'), sq('e5'));
      forceMove(sq('g1'), sq('f3'));
      forceMove(sq('b8'), sq('c6'));
      assertBoardMatchesEngine();
    });

    it('partial premove renders source highlight but no ghost piece', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      const pm = getState().premove;
      expect(pm).not.toBeNull();
      expect(pm.to).toBeNull();
      // Cell.jsx: isPremoveTo is false for all cells (pm.to is null)
      // So no ghost piece renders. Only source gets blue highlight.
    });

    it('complete premove renders source highlight + ghost piece at destination', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);
      const pm = getState().premove;
      expect(pm.to).toEqual(sq('e5'));
      expect(pm.piece).toBeDefined();
      expect(pm.piece.type).toBe('p');
      expect(pm.piece.color).toBe('b');
    });

    it('no premove artifacts remain after executePremove', () => {
      startCompGame('white');
      getState().selectSquare(sq('e7').row, sq('e7').col);
      getState().selectSquare(sq('e5').row, sq('e5').col);
      forceMove(sq('e2'), sq('e4'));
      getState().executePremove();
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
    });

    it('no premove artifacts remain after undo', () => {
      startCompGame('white');
      forceMove(sq('e2'), sq('e4'));
      setState({
        premove: { from: sq('e7'), to: sq('e5'), piece: { type: 'p', color: 'b' } },
      });
      getState().undoMove();
      assertNoPremoveHighlights();
      assertBoardMatchesEngine();
    });
  });
});
