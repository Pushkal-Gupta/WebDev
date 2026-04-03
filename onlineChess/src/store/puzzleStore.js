import { create } from 'zustand';
import { Chess } from 'chess.js';
import { supabase } from '../utils/supabase';
import { computeNewRating } from '../utils/glicko2';
import BUILTIN_PUZZLES from '../utils/builtinPuzzles';

const DEFAULT_RATING = { rating: 1500, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0 };

// Module-level chess instance — not in Zustand state (avoids serialization)
let _chess = new Chess();

// Track which built-in puzzles have been shown this session to avoid repeats
const _shownBuiltinIds = new Set();

function uciToMove(uci) {
  return {
    from:      uci.slice(0, 2),
    to:        uci.slice(2, 4),
    promotion: uci[4] || undefined,
  };
}

function pickBuiltinPuzzle(targetRating) {
  // Filter by rating window, exclude already shown
  const candidates = BUILTIN_PUZZLES.filter(p =>
    !_shownBuiltinIds.has(p.id) &&
    Math.abs(p.rating - targetRating) <= 400
  );
  // If all shown or none match, reset and pick from all
  const pool = candidates.length > 0 ? candidates : BUILTIN_PUZZLES;
  if (candidates.length === 0) _shownBuiltinIds.clear();
  const pick = pool[Math.floor(Math.random() * pool.length)];
  _shownBuiltinIds.add(pick.id);
  return pick;
}

const usePuzzleStore = create((set, get) => ({
  puzzle:           null,   // { id, fen, moves: string[], rating, themes }
  moveIndex:        0,      // index of next expected move in puzzle.moves
  currentFen:       null,
  playerColor:      'w',    // which side the solver plays
  status:           'idle', // 'idle'|'loading'|'playing'|'solved'|'failed'|'error'
  streak:           0,
  userPuzzleRating: null,
  lastRatingChange: null,   // number shown after solve/fail
  errorMsg:         null,

  // ── Load user's puzzle rating ──────────────────────────────────────────────
  async loadUserPuzzleRating(userId) {
    if (!userId) {
      set({ userPuzzleRating: { ...DEFAULT_RATING } });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_puzzle_ratings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        console.warn('Puzzle rating load error:', error.message);
      }
      set({ userPuzzleRating: data || { ...DEFAULT_RATING } });
    } catch {
      set({ userPuzzleRating: { ...DEFAULT_RATING } });
    }
  },

  // ── Fetch next puzzle near user's rating ──────────────────────────────────
  async loadNextPuzzle(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null });
    await get().loadUserPuzzleRating(userId);

    const rating = get().userPuzzleRating?.rating || 1500;
    let puzzleRow = null;

    // Try Supabase first
    try {
      for (const window of [150, 300, 600, 9999]) {
        const { data, error } = await supabase
          .from('puzzles')
          .select('id, fen, moves, rating, themes')
          .gte('rating', rating - window)
          .lte('rating', rating + window)
          .limit(20);
        if (error) {
          console.warn('Puzzle query error:', error.message);
          break; // Fall through to built-in puzzles
        }
        if (data?.length) {
          puzzleRow = data[Math.floor(Math.random() * data.length)];
          break;
        }
      }
    } catch (err) {
      console.warn('Puzzle fetch failed:', err.message);
    }

    // Fallback to built-in puzzles
    if (!puzzleRow) {
      puzzleRow = pickBuiltinPuzzle(rating);
    }

    if (!puzzleRow) {
      set({ status: 'empty' });
      return;
    }

    // Parse and validate
    const moves = puzzleRow.moves.split(' ').filter(Boolean);
    if (moves.length < 2) {
      console.warn('Puzzle has too few moves:', puzzleRow.id);
      set({ status: 'error', errorMsg: 'Invalid puzzle data. Try again.' });
      return;
    }

    try {
      _chess = new Chess(puzzleRow.fen);
    } catch {
      console.warn('Invalid puzzle FEN:', puzzleRow.fen);
      set({ status: 'error', errorMsg: 'Invalid puzzle position. Try again.' });
      return;
    }

    // Auto-play the first move (opponent's setup move)
    const firstMove = _chess.move(uciToMove(moves[0]));
    if (!firstMove) {
      console.warn('Puzzle first move invalid:', moves[0]);
      set({ status: 'error', errorMsg: 'Invalid puzzle. Try again.' });
      return;
    }

    const playerColor = _chess.turn();

    set({
      puzzle:      { ...puzzleRow, moves },
      moveIndex:   1,
      currentFen:  _chess.fen(),
      playerColor,
      status:      'playing',
    });
  },

  // ── Player attempts a move (uciMove = "e2e4") ─────────────────────────────
  async handlePlayerMove(uciMove, userId) {
    const { puzzle, moveIndex, streak, status } = get();
    if (!puzzle || status !== 'playing') return { correct: false };
    if (moveIndex >= puzzle.moves.length) return { correct: false };

    const expected = puzzle.moves[moveIndex];

    if (uciMove !== expected) {
      set({ status: 'failed', streak: 0 });
      if (userId) await get()._updatePuzzleRating(userId, false);
      return { correct: false };
    }

    // Correct move — play it
    const moveResult = _chess.move(uciToMove(uciMove));
    if (!moveResult) {
      set({ status: 'failed', streak: 0 });
      return { correct: false };
    }

    const afterPlayerIdx = moveIndex + 1;

    // If that was the last move → solved
    if (afterPlayerIdx >= puzzle.moves.length) {
      set({ status: 'solved', streak: streak + 1, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
      if (userId) await get()._updatePuzzleRating(userId, true);
      return { correct: true, solved: true };
    }

    // Opponent responds
    const oppUci = puzzle.moves[afterPlayerIdx];
    if (!oppUci) {
      set({ status: 'solved', streak: streak + 1, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
      if (userId) await get()._updatePuzzleRating(userId, true);
      return { correct: true, solved: true };
    }

    const oppResult = _chess.move(uciToMove(oppUci));
    if (!oppResult) {
      // If opponent move fails, treat puzzle as solved
      set({ status: 'solved', streak: streak + 1, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
      if (userId) await get()._updatePuzzleRating(userId, true);
      return { correct: true, solved: true };
    }

    const afterOppIdx = afterPlayerIdx + 1;

    // If there are no more player moves after the opponent response → solved
    if (afterOppIdx >= puzzle.moves.length) {
      set({ status: 'solved', streak: streak + 1, currentFen: _chess.fen(), moveIndex: afterOppIdx });
      if (userId) await get()._updatePuzzleRating(userId, true);
      return { correct: true, solved: true };
    }

    set({ moveIndex: afterOppIdx, currentFen: _chess.fen(), status: 'playing' });
    return { correct: true, solved: false };
  },

  // ── Internal: update puzzle Glicko-2 rating ───────────────────────────────
  async _updatePuzzleRating(userId, solved) {
    if (!userId) return;
    const cur = get().userPuzzleRating || { ...DEFAULT_RATING };
    const puzzleRating = get().puzzle?.rating || 1500;

    const result = computeNewRating({
      rating: cur.rating, rd: cur.rd, volatility: cur.volatility,
      opponentRating: puzzleRating, opponentRd: 100,
      score: solved ? 1 : 0,
    });

    const updated = {
      user_id:      userId,
      rating:       Math.round(result.rating),
      rd:           parseFloat(result.rd.toFixed(1)),
      volatility:   result.volatility,
      games_played: (cur.games_played || 0) + 1,
      wins:         (cur.wins  || 0) + (solved ? 1 : 0),
      losses:       (cur.losses || 0) + (solved ? 0 : 1),
    };

    try {
      await supabase.from('user_puzzle_ratings').upsert(updated, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Failed to save puzzle rating:', err.message);
    }

    set({
      userPuzzleRating: { ...cur, ...updated },
      lastRatingChange: Math.round(result.rating) - cur.rating,
    });
  },

  // ── Reset (go back to idle) ───────────────────────────────────────────────
  reset() {
    set({ puzzle: null, moveIndex: 0, currentFen: null, status: 'idle', lastRatingChange: null, errorMsg: null });
  },
}));

export default usePuzzleStore;
