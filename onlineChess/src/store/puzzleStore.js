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
  // Try narrow range first (±300), then widen to ±500, then all
  for (const tolerance of [300, 500]) {
    const candidates = BUILTIN_PUZZLES.filter(p =>
      !_shownBuiltinIds.has(p.id) &&
      Math.abs(p.rating - targetRating) <= tolerance
    );
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      _shownBuiltinIds.add(pick.id);
      return pick;
    }
  }
  // Fallback: closest available puzzles sorted by distance
  _shownBuiltinIds.clear();
  const sorted = [...BUILTIN_PUZZLES].sort((a, b) =>
    Math.abs(a.rating - targetRating) - Math.abs(b.rating - targetRating)
  );
  const pick = sorted[Math.floor(Math.random() * Math.min(10, sorted.length))];
  if (pick) _shownBuiltinIds.add(pick.id);
  return pick;
}

function pickBuiltinByDifficulty(minRating, maxRating) {
  const candidates = BUILTIN_PUZZLES.filter(p =>
    !_shownBuiltinIds.has(p.id) &&
    p.rating >= minRating && p.rating <= maxRating
  );
  const pool = candidates.length > 0 ? candidates : BUILTIN_PUZZLES.filter(p => p.rating >= minRating && p.rating <= maxRating);
  if (pool.length === 0) return pickBuiltinPuzzle((minRating + maxRating) / 2);
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
  userPuzzleRating: JSON.parse(localStorage.getItem('puzzleRatingCache') || 'null'),
  lastRatingChange: null,
  errorMsg:         null,
  hintSquare:       null,   // { from, to } — highlights the correct move's origin square
  hintUsed:         false,  // whether hint was used for current puzzle

  // ── Mode state ──────────────────────────────────────────────────────────────
  mode:             'rated',  // 'rated'|'rush'|'streak'

  // Rush mode state
  rushTimeLeft:     0,        // seconds remaining
  rushScore:        0,        // puzzles solved in current rush
  rushStrikes:      0,        // wrong answers (max 3)
  rushDuration:     180,      // 3 min default (180s or 300s)
  rushActive:       false,    // is rush timer running?
  rushBestScore:    parseInt(localStorage.getItem('puzzleRushBest') || '0', 10),

  // Streak mode state
  streakCount:      0,        // current streak count
  streakActive:     false,
  streakBestCount:  parseInt(localStorage.getItem('puzzleStreakBest') || '0', 10),
  streakDifficulty: 800,      // starting difficulty, ramps up

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
        console.warn('Puzzle rating load error:', error.message);
      }
      const rating = data || { ...DEFAULT_RATING };
      set({ userPuzzleRating: rating });
      try { localStorage.setItem('puzzleRatingCache', JSON.stringify(rating)); } catch {}
    } catch {
      set({ userPuzzleRating: { ...DEFAULT_RATING } });
    }
  },

  // ── Set mode ──────────────────────────────────────────────────────────────
  setMode(mode) {
    get().stopRushTimer();
    set({
      mode,
      status: 'idle',
      puzzle: null,
      currentFen: null,
      rushActive: false,
      streakActive: false,
      rushScore: 0,
      rushStrikes: 0,
      streakCount: 0,
      streakDifficulty: 800,
      lastRatingChange: null,
      errorMsg: null,
    });
  },

  // ── Rush mode ──────────────────────────────────────────────────────────────
  _rushIntervalId: null,

  async startRush(duration, userId) {
    get().stopRushTimer();
    _shownBuiltinIds.clear();

    // Load rating before starting so puzzles match user level
    await get().loadUserPuzzleRating(userId);

    set({
      mode: 'rush',
      rushDuration: duration,
      rushTimeLeft: duration,
      rushScore: 0,
      rushStrikes: 0,
      rushActive: true,
      status: 'loading',
      puzzle: null,
      lastRatingChange: null,
      errorMsg: null,
      hintUsed: false,
    });

    // Start countdown timer
    const intervalId = setInterval(() => {
      const { rushTimeLeft, rushActive } = get();
      if (!rushActive || rushTimeLeft <= 1) {
        clearInterval(intervalId);
        get()._endRush();
        return;
      }
      set({ rushTimeLeft: rushTimeLeft - 1 });
    }, 1000);
    set({ _rushIntervalId: intervalId });

    // Load first puzzle
    get()._loadPuzzleForMode(userId);
  },

  stopRushTimer() {
    const { _rushIntervalId } = get();
    if (_rushIntervalId) {
      clearInterval(_rushIntervalId);
      set({ _rushIntervalId: null });
    }
  },

  _endRush() {
    get().stopRushTimer();
    const { rushScore, rushBestScore } = get();
    const newBest = Math.max(rushScore, rushBestScore);
    if (newBest > rushBestScore) {
      localStorage.setItem('puzzleRushBest', String(newBest));
    }
    set({
      rushActive: false,
      status: 'rush_over',
      rushBestScore: newBest,
    });
  },

  // ── Streak mode ────────────────────────────────────────────────────────────
  async startStreak(userId) {
    _shownBuiltinIds.clear();

    // Load rating before starting so puzzles match user level
    await get().loadUserPuzzleRating(userId);

    set({
      mode: 'streak',
      streakCount: 0,
      streakActive: true,
      streakDifficulty: 800,
      status: 'loading',
      puzzle: null,
      lastRatingChange: null,
      errorMsg: null,
      hintUsed: false,
    });
    get()._loadPuzzleForMode(userId);
  },

  _endStreak() {
    const { streakCount, streakBestCount } = get();
    const newBest = Math.max(streakCount, streakBestCount);
    if (newBest > streakBestCount) {
      localStorage.setItem('puzzleStreakBest', String(newBest));
    }
    set({
      streakActive: false,
      status: 'streak_over',
      streakBestCount: newBest,
    });
  },

  // ── Generic puzzle loader for rush/streak modes ────────────────────────────
  _loadRetries: 0,
  async _loadPuzzleForMode(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null, hintSquare: null, hintUsed: false });

    const { mode, streakDifficulty, userPuzzleRating } = get();

    let targetRating;
    if (mode === 'rush') {
      targetRating = userPuzzleRating?.rating || 1500;
    } else if (mode === 'streak') {
      targetRating = streakDifficulty;
    } else {
      targetRating = userPuzzleRating?.rating || 1500;
    }

    let puzzleRow = null;

    // Try Supabase first
    try {
      for (const window of [150, 300, 500]) {
        const { data, error } = await supabase
          .from('puzzles')
          .select('id, fen, moves, rating, themes')
          .gte('rating', targetRating - window)
          .lte('rating', targetRating + window)
          .limit(20);
        if (error) break;
        if (data?.length) {
          puzzleRow = data[Math.floor(Math.random() * data.length)];
          break;
        }
      }
    } catch {}

    if (!puzzleRow) {
      if (mode === 'streak') {
        puzzleRow = pickBuiltinByDifficulty(
          Math.max(600, targetRating - 200),
          targetRating + 200
        );
      } else {
        puzzleRow = pickBuiltinPuzzle(targetRating);
      }
    }

    if (!puzzleRow) {
      set({ status: 'error', errorMsg: 'No puzzles found near your rating. Try refreshing or changing mode.' });
      return;
    }

    const moves = (puzzleRow.moves || '').split(' ').filter(Boolean);
    if (moves.length < 1) {
      if (get()._loadRetries < 10) {
        set({ _loadRetries: get()._loadRetries + 1 });
        get()._loadPuzzleForMode(userId);
      } else {
        set({ status: 'error', errorMsg: 'No puzzles available. Check your connection and try again.', _loadRetries: 0 });
      }
      return;
    }

    try {
      _chess = new Chess(puzzleRow.fen);
    } catch {
      if (get()._loadRetries < 10) {
        set({ _loadRetries: get()._loadRetries + 1 });
        get()._loadPuzzleForMode(userId);
      } else {
        set({ status: 'error', errorMsg: 'Invalid puzzle data. Skipping to next puzzle...', _loadRetries: 0 });
        setTimeout(() => get()._loadPuzzleForMode(userId), 1000);
      }
      return;
    }

    // Single-move puzzles: player plays from the FEN position
    if (moves.length === 1) {
      set({ _loadRetries: 0 });
      const playerColor = _chess.turn();
      set({
        puzzle:      { ...puzzleRow, moves },
        moveIndex:   0,
        currentFen:  _chess.fen(),
        playerColor,
        status:      'playing',
      });
      return;
    }

    const firstMove = _chess.move(uciToMove(moves[0]));
    if (!firstMove) {
      if (get()._loadRetries < 10) {
        set({ _loadRetries: get()._loadRetries + 1 });
        get()._loadPuzzleForMode(userId);
      } else {
        set({ status: 'error', errorMsg: 'Invalid puzzle moves. Skipping to next puzzle...', _loadRetries: 0 });
        setTimeout(() => get()._loadPuzzleForMode(userId), 1000);
      }
      return;
    }

    set({ _loadRetries: 0 });
    const playerColor = _chess.turn();
    set({
      puzzle:      { ...puzzleRow, moves },
      moveIndex:   1,
      currentFen:  _chess.fen(),
      playerColor,
      status:      'playing',
    });
  },

  // ── Fetch next puzzle near user's rating (rated mode) ─────────────────────
  async loadNextPuzzle(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null, hintSquare: null, hintUsed: false });
    await get().loadUserPuzzleRating(userId);

    const rating = get().userPuzzleRating?.rating || 1500;
    let puzzleRow = null;

    try {
      for (const window of [150, 300, 500]) {
        const { data, error } = await supabase
          .from('puzzles')
          .select('id, fen, moves, rating, themes')
          .gte('rating', rating - window)
          .lte('rating', rating + window)
          .limit(20);
        if (error) {
          console.warn('Puzzle query error:', error.message);
          break;
        }
        if (data?.length) {
          puzzleRow = data[Math.floor(Math.random() * data.length)];
          break;
        }
      }
    } catch (err) {
      console.warn('Puzzle fetch failed:', err.message);
    }

    if (!puzzleRow) {
      puzzleRow = pickBuiltinPuzzle(rating);
    }

    if (!puzzleRow) {
      set({ status: 'empty' });
      return;
    }

    const moves = (puzzleRow.moves || '').split(' ').filter(Boolean);
    if (moves.length < 1) {
      console.warn('Puzzle has no moves:', puzzleRow.id);
      set({ status: 'error', errorMsg: 'Invalid puzzle data. Skipping to next puzzle...' });
      setTimeout(() => get()._loadPuzzleForMode(userId), 1000);
      return;
    }

    try {
      _chess = new Chess(puzzleRow.fen);
    } catch {
      console.warn('Invalid puzzle FEN:', puzzleRow.fen);
      set({ status: 'error', errorMsg: 'Invalid puzzle position. Loading another puzzle...' });
      setTimeout(() => get()._loadPuzzleForMode(userId), 1000);
      return;
    }

    // Single-move puzzles (mateIn1): player plays the only move from the FEN position
    if (moves.length === 1) {
      const playerColor = _chess.turn();
      set({
        puzzle:      { ...puzzleRow, moves },
        moveIndex:   0,
        currentFen:  _chess.fen(),
        playerColor,
        status:      'playing',
      });
      return;
    }

    // Standard puzzle: first move is opponent setup, then player responds
    const firstMove = _chess.move(uciToMove(moves[0]));
    if (!firstMove) {
      console.warn('Puzzle first move invalid:', moves[0]);
      set({ status: 'error', errorMsg: 'Invalid puzzle position. Loading another puzzle...' });
      setTimeout(() => get()._loadPuzzleForMode(userId), 1000);
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

  // ── Player attempts a move ───────────────────────────────────────────────
  async handlePlayerMove(uciMove, userId) {
    const { puzzle, moveIndex, streak, status, mode } = get();
    if (!puzzle || status !== 'playing') return { correct: false };
    if (moveIndex >= puzzle.moves.length) return { correct: false };

    const expected = puzzle.moves[moveIndex];

    if (uciMove !== expected) {
      // Wrong move
      if (mode === 'rush') {
        const newStrikes = get().rushStrikes + 1;
        set({ rushStrikes: newStrikes });
        if (newStrikes >= 3) {
          get()._endRush();
          return { correct: false, rushOver: true };
        }
        // Load next puzzle in rush
        set({ status: 'loading' });
        setTimeout(() => get()._loadPuzzleForMode(userId), 400);
        return { correct: false };
      }
      if (mode === 'streak') {
        get()._endStreak();
        return { correct: false, streakOver: true };
      }
      // Rated mode
      set({ status: 'failed', streak: 0 });
      if (userId) await get()._updatePuzzleRating(userId, false);
      return { correct: false };
    }

    // Correct move — play it
    const moveResult = _chess.move(uciToMove(uciMove));
    if (!moveResult) {
      if (mode === 'rush') {
        const newStrikes = get().rushStrikes + 1;
        set({ rushStrikes: newStrikes });
        if (newStrikes >= 3) { get()._endRush(); return { correct: false, rushOver: true }; }
        set({ status: 'loading' });
        setTimeout(() => get()._loadPuzzleForMode(userId), 400);
        return { correct: false };
      }
      if (mode === 'streak') { get()._endStreak(); return { correct: false, streakOver: true }; }
      set({ status: 'failed', streak: 0 });
      return { correct: false };
    }

    const afterPlayerIdx = moveIndex + 1;

    // Check if puzzle is solved
    const checkSolved = async () => {
      if (mode === 'rush') {
        const newScore = get().rushScore + 1;
        set({ rushScore: newScore, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
        // Auto-load next puzzle
        setTimeout(() => get()._loadPuzzleForMode(userId), 300);
        return { correct: true, solved: true };
      }
      if (mode === 'streak') {
        const newCount = get().streakCount + 1;
        const newDiff = get().streakDifficulty + 50; // ramp difficulty
        set({ streakCount: newCount, streakDifficulty: newDiff, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
        // Auto-load next puzzle
        setTimeout(() => get()._loadPuzzleForMode(userId), 300);
        return { correct: true, solved: true };
      }
      // Rated mode — hint used = half credit (score 0.5 instead of 1)
      const hintWasUsed = get().hintUsed;
      set({ status: 'solved', streak: hintWasUsed ? 0 : streak + 1, currentFen: _chess.fen(), moveIndex: afterPlayerIdx });
      if (userId) await get()._updatePuzzleRating(userId, true, hintWasUsed);
      // Auto-advance in rated mode after delay
      setTimeout(() => {
        if (get().status === 'solved' && get().mode === 'rated') {
          get().loadNextPuzzle(userId);
        }
      }, 1500);
      return { correct: true, solved: true };
    };

    // If that was the last move → solved
    if (afterPlayerIdx >= puzzle.moves.length) {
      return checkSolved();
    }

    // Opponent responds
    const oppUci = puzzle.moves[afterPlayerIdx];
    if (!oppUci) return checkSolved();

    const oppResult = _chess.move(uciToMove(oppUci));
    if (!oppResult) return checkSolved();

    const afterOppIdx = afterPlayerIdx + 1;

    if (afterOppIdx >= puzzle.moves.length) {
      if (mode === 'rush') {
        const newScore = get().rushScore + 1;
        set({ rushScore: newScore, currentFen: _chess.fen(), moveIndex: afterOppIdx });
        setTimeout(() => get()._loadPuzzleForMode(userId), 300);
        return { correct: true, solved: true };
      }
      if (mode === 'streak') {
        const newCount = get().streakCount + 1;
        const newDiff = get().streakDifficulty + 50;
        set({ streakCount: newCount, streakDifficulty: newDiff, currentFen: _chess.fen(), moveIndex: afterOppIdx });
        setTimeout(() => get()._loadPuzzleForMode(userId), 300);
        return { correct: true, solved: true };
      }
      const hintWasUsed2 = get().hintUsed;
      set({ status: 'solved', streak: hintWasUsed2 ? 0 : streak + 1, currentFen: _chess.fen(), moveIndex: afterOppIdx });
      if (userId) await get()._updatePuzzleRating(userId, true, hintWasUsed2);
      // Auto-advance in rated mode after delay
      setTimeout(() => {
        if (get().status === 'solved' && get().mode === 'rated') {
          get().loadNextPuzzle(userId);
        }
      }, 1500);
      return { correct: true, solved: true };
    }

    set({ moveIndex: afterOppIdx, currentFen: _chess.fen(), status: 'playing' });
    return { correct: true, solved: false };
  },

  // ── Internal: update puzzle Glicko-2 rating ───────────────────────────────
  async _updatePuzzleRating(userId, solved, hintUsed = false) {
    if (!userId) return;
    const cur = get().userPuzzleRating || { ...DEFAULT_RATING };
    const puzzleRating = get().puzzle?.rating || 1500;

    // Hint used = half credit (0.5 score), so rating gain is reduced
    const score = solved ? (hintUsed ? 0.5 : 1) : 0;

    const result = computeNewRating({
      rating: cur.rating, rd: cur.rd, volatility: cur.volatility,
      opponentRating: puzzleRating, opponentRd: 100,
      score,
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

    const newRating = { ...cur, ...updated };
    set({
      userPuzzleRating: newRating,
      lastRatingChange: Math.round(result.rating) - cur.rating,
    });
    try { localStorage.setItem('puzzleRatingCache', JSON.stringify(newRating)); } catch {}
  },

  // ── Hint: reveal the source square of the correct move ─────────────────────
  getHint() {
    const { puzzle, moveIndex, status } = get();
    if (!puzzle || status !== 'playing') return;
    if (moveIndex >= puzzle.moves.length) return;
    const expected = puzzle.moves[moveIndex];
    const from = expected.slice(0, 2);
    const to   = expected.slice(2, 4);
    set({ hintSquare: { from, to }, hintUsed: true });
  },

  clearHint() {
    set({ hintSquare: null });
  },

  // ── Reset (go back to idle) ───────────────────────────────────────────────
  reset() {
    get().stopRushTimer();
    set({
      puzzle: null, moveIndex: 0, currentFen: null, status: 'idle',
      lastRatingChange: null, errorMsg: null,
      rushActive: false, rushScore: 0, rushStrikes: 0,
      streakActive: false, streakCount: 0,
    });
  },
}));

export default usePuzzleStore;
