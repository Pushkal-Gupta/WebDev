import { create } from 'zustand';
import { Chess } from 'chess.js';
import { supabase } from '../utils/supabase';
import { computeNewRating } from '../utils/glicko2';

const DEFAULT_RATING = { rating: 1500, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0 };

// Module-level chess instance — not in Zustand state (avoids serialization)
let _chess = new Chess();

function uciToMove(uci) {
  return {
    from:      uci.slice(0, 2),
    to:        uci.slice(2, 4),
    promotion: uci[4] || undefined,
  };
}

const usePuzzleStore = create((set, get) => ({
  puzzle:           null,   // { id, fen, moves: string[], rating, themes }
  moveIndex:        0,      // index of next expected move in puzzle.moves
  currentFen:       null,
  playerColor:      'w',    // which side the solver plays
  status:           'idle', // 'idle'|'loading'|'playing'|'solved'|'failed'
  streak:           0,
  userPuzzleRating: null,
  lastRatingChange: null,   // number shown after solve/fail

  // ── Load user's puzzle rating ──────────────────────────────────────────────
  async loadUserPuzzleRating(userId) {
    if (!userId) return;
    const { data } = await supabase
      .from('user_puzzle_ratings')
      .select('*')
      .eq('user_id', userId)
      .single();
    set({ userPuzzleRating: data || { ...DEFAULT_RATING } });
  },

  // ── Fetch next puzzle near user's rating ──────────────────────────────────
  async loadNextPuzzle(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null });
    await get().loadUserPuzzleRating(userId);

    const rating = get().userPuzzleRating?.rating || 1500;
    let puzzleRow = null;

    // Try to find a puzzle within ±150 of the user's rating
    for (const window of [150, 300, 600, 9999]) {
      const { data } = await supabase
        .from('puzzles')
        .select('id, fen, moves, rating, themes')
        .gte('rating', rating - window)
        .lte('rating', rating + window)
        .limit(20);
      if (data?.length) {
        puzzleRow = data[Math.floor(Math.random() * data.length)];
        break;
      }
    }

    if (!puzzleRow) {
      set({ status: 'idle' });
      return;
    }

    const moves = puzzleRow.moves.split(' ');
    _chess = new Chess(puzzleRow.fen);

    // Auto-play the first move (opponent's setup move)
    _chess.move(uciToMove(moves[0]));
    const playerColor = _chess.turn(); // 'w' or 'b'

    set({
      puzzle:      { ...puzzleRow, moves },
      moveIndex:   1,             // next expected move is moves[1] (player's first)
      currentFen:  _chess.fen(),
      playerColor,
      status:      'playing',
    });
  },

  // ── Player attempts a move (uciMove = "e2e4") ─────────────────────────────
  async handlePlayerMove(uciMove, userId) {
    const { puzzle, moveIndex, streak, status } = get();
    if (!puzzle || status !== 'playing') return { correct: false };

    const expected = puzzle.moves[moveIndex];

    if (uciMove !== expected) {
      // Wrong move — fail the puzzle
      set({ status: 'failed', streak: 0 });
      if (userId) await get()._updatePuzzleRating(userId, false);
      return { correct: false };
    }

    // Correct move — play it
    _chess.move(uciToMove(uciMove));
    const afterPlayerIdx = moveIndex + 1;

    // If that was the last move → solved
    if (afterPlayerIdx >= puzzle.moves.length) {
      set({ status: 'solved', streak: streak + 1, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
      if (userId) await get()._updatePuzzleRating(userId, true);
      return { correct: true, solved: true };
    }

    // Opponent responds
    const oppUci = puzzle.moves[afterPlayerIdx];
    _chess.move(uciToMove(oppUci));
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

    await supabase.from('user_puzzle_ratings').upsert(updated, { onConflict: 'user_id' });
    set({
      userPuzzleRating: { ...cur, ...updated },
      lastRatingChange: Math.round(result.rating) - cur.rating,
    });
  },

  // ── Reset (go back to idle) ───────────────────────────────────────────────
  reset() {
    set({ puzzle: null, moveIndex: 0, currentFen: null, status: 'idle', lastRatingChange: null });
  },
}));

export default usePuzzleStore;
