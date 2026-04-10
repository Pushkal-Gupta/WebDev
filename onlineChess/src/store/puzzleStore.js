import { create } from 'zustand';
import { Chess } from 'chess.js';
import { supabase } from '../utils/supabase';
import { computeNewRating } from '../utils/glicko2';
import { uciToMove, uciToCoords } from '../utils/boardHelpers';

const DEFAULT_RATING = { rating: 1500, rd: 350, volatility: 0.06, games_played: 0, wins: 0, losses: 0 };

// Module-level chess instance — not in Zustand state (avoids serialization)
let _chess = new Chess();
const _shownBuiltinIds = new Set();

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
  hintUsed:         false,  // whether hint was used for current puzzle (affects rating)
  wrongAttempt:     false,
  attempts:         0,
  setupMoveFrom:    null,   // [row, col] of the setup move's origin (for highlighting)
  setupMoveTo:      null,   // [row, col] of the setup move's destination

  // ── Mode state ──────────────────────────────────────────────────────────────
  mode:             'rated',  // 'rated'|'rush'|'streak'|'daily'|'themes'

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

  // ── Daily puzzle ────────────────────────────────────────────────────────────
  dailyPuzzle:      null,
  dailySolved:      false,

  // ── Theme training ──────────────────────────────────────────────────────────
  selectedTheme:    null,

  // ── Difficulty ──────────────────────────────────────────────────────────────
  difficultyLevel:  null,     // 'easy'|'medium'|'hard'|null

  // ── Solution review ─────────────────────────────────────────────────────────
  reviewMode:       false,
  reviewIndex:      0,
  solutionMoves:    [],       // [{uci, san, fen}]
  playerMoves:      [],       // moves player actually made

  // ── History ─────────────────────────────────────────────────────────────────
  puzzleHistory:    [],
  historyLoading:   false,

  // ── Rating history for chart ────────────────────────────────────────────────
  ratingHistory:        [],
  ratingHistoryLoading: false,

  // ── Timer for puzzle solve time tracking ────────────────────────────────────
  puzzleStartTime:  null,

  // ── Load user's puzzle rating ──────────────────────────────────────────────
  async loadUserPuzzleRating(userId) {
    if (!userId) {
      // Only set default if we don't already have a cached rating
      if (!get().userPuzzleRating) set({ userPuzzleRating: { ...DEFAULT_RATING } });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('user_puzzle_ratings')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        // Network/server error — keep existing rating from cache, don't reset
        console.warn('Puzzle rating load error:', error.message);
        if (!get().userPuzzleRating) set({ userPuzzleRating: { ...DEFAULT_RATING } });
        return;
      }
      if (!data) {
        // No record in DB yet — keep cached rating, don't overwrite with default
        if (!get().userPuzzleRating) set({ userPuzzleRating: { ...DEFAULT_RATING } });
        return;
      }
      set({ userPuzzleRating: data });
      try { localStorage.setItem('puzzleRatingCache', JSON.stringify(data)); } catch {}
    } catch {
      // Network failure — keep existing rating from cache, don't reset
      if (!get().userPuzzleRating) set({ userPuzzleRating: { ...DEFAULT_RATING } });
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
      selectedTheme: null,
      difficultyLevel: null,
      reviewMode: false,
      reviewIndex: 0,
      solutionMoves: [],
      playerMoves: [],
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

  // ── Build solution line for review ────────────────────────────────────────
  buildSolutionLine() {
    const { puzzle } = get();
    if (!puzzle || !puzzle.moves || puzzle.moves.length === 0) return;

    const tmpChess = new Chess(puzzle.fen);
    const solutionMoves = [];

    for (const uci of puzzle.moves) {
      const moveObj = uciToMove(uci);
      const result = tmpChess.move(moveObj);
      if (!result) break;
      solutionMoves.push({
        uci,
        san: result.san,
        fen: tmpChess.fen(),
      });
    }

    set({ solutionMoves });
  },

  // ── Helper: initialize a puzzle row into play state ───────────────────────
  _initPuzzle(puzzleRow) {
    const moves = (puzzleRow.moves || '').split(' ').filter(Boolean);
    if (moves.length < 1) return false;

    try {
      _chess = new Chess(puzzleRow.fen);
    } catch {
      return false;
    }

    // Odd move count (including 1): no setup move — player plays from FEN directly
    // Even move count: Lichess format — moves[0] is opponent's setup move
    if (moves.length % 2 === 1) {
      const playerColor = _chess.turn();
      set({
        puzzle:      { ...puzzleRow, moves },
        moveIndex:   0,
        currentFen:  _chess.fen(),
        playerColor,
        status:      'playing',
        playerMoves: [],
        reviewMode:  false,
        reviewIndex: 0,
        puzzleStartTime: Date.now(),
        setupMoveFrom: null,
        setupMoveTo:   null,
      });
      get().buildSolutionLine();
      return true;
    }

    // Even move count: play opponent's setup move first
    const setupCoords = uciToCoords(moves[0]);
    const firstMove = _chess.move(uciToMove(moves[0]));
    if (!firstMove) return false;

    const playerColor = _chess.turn();
    set({
      puzzle:      { ...puzzleRow, moves },
      moveIndex:   1,
      currentFen:  _chess.fen(),
      playerColor,
      status:      'playing',
      playerMoves: [],
      reviewMode:  false,
      reviewIndex: 0,
      puzzleStartTime: Date.now(),
      setupMoveFrom: setupCoords.from,
      setupMoveTo:   setupCoords.to,
    });
    get().buildSolutionLine();
    return true;
  },

  // ── Generic puzzle loader for rush/streak modes ────────────────────────────
  _loadRetries: 0,
  async _loadPuzzleForMode(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null, hintSquare: null, hintUsed: false, wrongAttempt: false, attempts: 0, reviewMode: false, reviewIndex: 0, solutionMoves: [] });

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
        playerMoves: [],
        reviewMode:  false,
        reviewIndex: 0,
        puzzleStartTime: Date.now(),
        setupMoveFrom: null,
        setupMoveTo:   null,
      });
      get().buildSolutionLine();
      return;
    }

    const setupCoords = uciToCoords(moves[0]);
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
      playerMoves: [],
      reviewMode:  false,
      reviewIndex: 0,
      puzzleStartTime: Date.now(),
      setupMoveFrom: setupCoords.from,
      setupMoveTo:   setupCoords.to,
    });
    get().buildSolutionLine();
  },

  // ── Fetch next puzzle near user's rating (rated mode) ─────────────────────
  async loadNextPuzzle(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null, hintSquare: null, hintUsed: false, wrongAttempt: false, attempts: 0, reviewMode: false, reviewIndex: 0, solutionMoves: [] });
    await get().loadUserPuzzleRating(userId);

    const rating = get().userPuzzleRating?.rating || 1500;
    let puzzleRow = null;

    try {
      for (const window of [150, 300, 500, 1000]) {
        const { data, error } = await supabase
          .from('puzzles')
          .select('id, fen, moves, rating, themes')
          .gte('rating', rating - window)
          .lte('rating', rating + window)
          .limit(20);
        if (error) {
          console.warn('Puzzle query error:', error.message);
          continue; // try wider window instead of giving up
        }
        if (data?.length) {
          puzzleRow = data[Math.floor(Math.random() * data.length)];
          break;
        }
      }
      // Last resort: fetch any puzzle from the database
      if (!puzzleRow) {
        const { data } = await supabase.from('puzzles').select('id, fen, moves, rating, themes').limit(10);
        if (data?.length) puzzleRow = data[Math.floor(Math.random() * data.length)];
      }
    } catch (err) {
      console.warn('Puzzle fetch failed:', err.message);
    }

    if (!puzzleRow) {
      set({ status: 'empty', errorMsg: 'No puzzles found. Check your connection and try again.' });
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
        playerMoves: [],
        reviewMode:  false,
        reviewIndex: 0,
        puzzleStartTime: Date.now(),
        setupMoveFrom: null,
        setupMoveTo:   null,
      });
      get().buildSolutionLine();
      return;
    }

    // Standard puzzle: first move is opponent setup, then player responds
    const setupCoords = uciToCoords(moves[0]);
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
      playerMoves: [],
      reviewMode:  false,
      reviewIndex: 0,
      puzzleStartTime: Date.now(),
      setupMoveFrom: setupCoords.from,
      setupMoveTo:   setupCoords.to,
    });
    get().buildSolutionLine();
  },

  // ── Player attempts a move ───────────────────────────────────────────────
  async handlePlayerMove(uciMove, userId) {
    const { puzzle, moveIndex, streak, status, mode } = get();
    if (!puzzle || status !== 'playing') return { correct: false };
    if (moveIndex >= puzzle.moves.length) return { correct: false };

    // Track player moves
    set({ playerMoves: [...get().playerMoves, uciMove] });

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
      // Rated mode — allow retry (don't penalize yet)
      set({ wrongAttempt: true, attempts: get().attempts + 1 });
      return { correct: false, canRetry: true };
    }

    // Correct move — play it
    set({ wrongAttempt: false, attempts: 0 });
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
      if (userId) {
        const timeTaken = get().puzzleStartTime ? Math.round((Date.now() - get().puzzleStartTime) / 1000) : null;
        await get()._updatePuzzleRating(userId, true, hintWasUsed);
        const ratingChange = get().lastRatingChange;
        await get().recordAttempt(userId, puzzle.id, true, timeTaken, ratingChange, puzzle.rating);
      }
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
        return { correct: true, solved: true, oppUci };
      }
      if (mode === 'streak') {
        const newCount = get().streakCount + 1;
        const newDiff = get().streakDifficulty + 50;
        set({ streakCount: newCount, streakDifficulty: newDiff, currentFen: _chess.fen(), moveIndex: afterOppIdx });
        setTimeout(() => get()._loadPuzzleForMode(userId), 300);
        return { correct: true, solved: true, oppUci };
      }
      const hintWasUsed2 = get().hintUsed;
      set({ status: 'solved', streak: hintWasUsed2 ? 0 : streak + 1, currentFen: _chess.fen(), moveIndex: afterOppIdx });
      if (userId) {
        const timeTaken = get().puzzleStartTime ? Math.round((Date.now() - get().puzzleStartTime) / 1000) : null;
        await get()._updatePuzzleRating(userId, true, hintWasUsed2);
        const ratingChange = get().lastRatingChange;
        await get().recordAttempt(userId, puzzle.id, true, timeTaken, ratingChange, puzzle.rating);
      }
      return { correct: true, solved: true, oppUci };
    }

    set({ moveIndex: afterOppIdx, currentFen: _chess.fen(), status: 'playing' });
    return { correct: true, solved: false, oppUci };
  },

  // ── Give up (Lichess-style) ─────────────────────────────────────────────
  async giveUp(userId) {
    const { puzzle, mode } = get();
    if (!puzzle || (mode !== 'rated' && mode !== 'rush' && mode !== 'streak' && mode !== 'daily' && mode !== 'themes')) return;
    set({ status: 'failed', streak: 0, wrongAttempt: false, attempts: 0 });
    if (mode === 'rated' && userId) {
      const timeTaken = get().puzzleStartTime ? Math.round((Date.now() - get().puzzleStartTime) / 1000) : null;
      await get()._updatePuzzleRating(userId, false);
      await get().recordAttempt(userId, puzzle.id, false, timeTaken, null, puzzle.rating);
    }
  },

  // ── Internal: update puzzle Glicko-2 rating ───────────────────────────────
  async _updatePuzzleRating(userId, solved, hintUsed = false) {
    if (!userId) return;
    const cur = get().userPuzzleRating || { ...DEFAULT_RATING };
    const puzzleRating = get().puzzle?.rating || 1500;

    // Hint used = counted as a loss for rating purposes (strict penalty).
    // Win counter still increments, but rating drops like a loss.
    const score = solved ? (hintUsed ? 0 : 1) : 0;

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
      lastRatingChange: updated.rating - cur.rating,
    });
    try { localStorage.setItem('puzzleRatingCache', JSON.stringify(newRating)); } catch {}

    // Record rating history
    await get().recordRatingHistory(userId, Math.round(result.rating));
  },

  // ── Hint: reveal the correct move's squares (unlimited, but penalizes rating) ──
  getHint() {
    const { puzzle, moveIndex, status } = get();
    if (!puzzle || status !== 'playing') return;
    if (moveIndex >= puzzle.moves.length) return;
    const expected = puzzle.moves[moveIndex];
    const from = expected.slice(0, 2);
    const to   = expected.slice(2, 4);
    // hintUsed stays true once set — affects rating calculation (0.5x credit)
    set({ hintSquare: { from, to }, hintUsed: true });
  },

  clearHint() {
    set({ hintSquare: null });
  },

  // ── Daily puzzle ──────────────────────────────────────────────────────────
  async loadDailyPuzzle(userId) {
    set({ status: 'loading', puzzle: null, lastRatingChange: null, errorMsg: null, hintSquare: null, hintUsed: false, wrongAttempt: false, attempts: 0, dailySolved: false });

    const today = new Date().toISOString().slice(0, 10);
    let puzzleRow = null;

    try {
      const { data, error } = await supabase.rpc('get_daily_puzzle', { p_date: today });
      if (error) {
        console.warn('Daily puzzle RPC error:', error.message);
      } else if (data) {
        // RPC returns SETOF (array) — pick first result
        puzzleRow = Array.isArray(data) ? data[0] : data;
      }
    } catch (err) {
      console.warn('Daily puzzle fetch failed:', err.message);
    }

    if (!puzzleRow) {
      set({ status: 'error', errorMsg: 'No daily puzzle available today. Try again later.' });
      return;
    }

    // Check if already solved today
    if (userId) {
      try {
        const { data: attemptData } = await supabase
          .from('puzzle_attempts')
          .select('solved')
          .eq('user_id', userId)
          .eq('puzzle_id', puzzleRow.id)
          .maybeSingle();
        if (attemptData?.solved) {
          set({ dailySolved: true });
        }
      } catch {}
    }

    set({ dailyPuzzle: puzzleRow });

    // Initialize the puzzle for play
    const success = get()._initPuzzle(puzzleRow);
    if (!success) {
      set({ status: 'error', errorMsg: 'Invalid daily puzzle data.' });
    }
  },

  // ── Theme-based puzzle loading ────────────────────────────────────────────
  async loadByTheme(theme, userId) {
    set({
      selectedTheme: theme,
      status: 'loading',
      puzzle: null,
      lastRatingChange: null,
      errorMsg: null,
      hintSquare: null,
      hintUsed: false,
      wrongAttempt: false,
      attempts: 0,
    });

    await get().loadUserPuzzleRating(userId);
    const rating = get().userPuzzleRating?.rating || 1500;

    let puzzleRow = null;

    // Try Supabase with progressively wider rating windows
    try {
      for (const window of [300, 500]) {
        const { data, error } = await supabase
          .from('puzzles')
          .select('*')
          .contains('themes', [theme])
          .gte('rating', rating - window)
          .lte('rating', rating + window)
          .limit(20);
        if (error) {
          console.warn('Theme puzzle query error:', error.message);
          break;
        }
        if (data?.length) {
          puzzleRow = data[Math.floor(Math.random() * data.length)];
          break;
        }
      }
    } catch (err) {
      console.warn('Theme puzzle fetch failed:', err.message);
    }

    if (!puzzleRow) {
      set({ status: 'error', errorMsg: `No puzzles found for theme "${theme}". Try a different theme.` });
      return;
    }

    const success = get()._initPuzzle(puzzleRow);
    if (!success) {
      set({ status: 'error', errorMsg: 'Invalid puzzle data. Try loading another puzzle.' });
    }
  },

  // ── Difficulty-based puzzle loading ───────────────────────────────────────
  async loadByDifficulty(level, userId) {
    set({
      difficultyLevel: level,
      status: 'loading',
      puzzle: null,
      lastRatingChange: null,
      errorMsg: null,
      hintSquare: null,
      hintUsed: false,
      wrongAttempt: false,
      attempts: 0,
    });

    await get().loadUserPuzzleRating(userId);
    const userRating = get().userPuzzleRating?.rating || 1500;

    let minRating, maxRating;
    switch (level) {
      case 'easy':
        minRating = userRating - 400;
        maxRating = userRating - 100;
        break;
      case 'medium':
        minRating = userRating - 150;
        maxRating = userRating + 150;
        break;
      case 'hard':
        minRating = userRating + 100;
        maxRating = userRating + 400;
        break;
      default:
        minRating = userRating - 150;
        maxRating = userRating + 150;
    }

    let puzzleRow = null;

    try {
      const { data, error } = await supabase
        .from('puzzles')
        .select('id, fen, moves, rating, themes')
        .gte('rating', minRating)
        .lte('rating', maxRating)
        .limit(20);
      if (!error && data?.length) {
        puzzleRow = data[Math.floor(Math.random() * data.length)];
      }
    } catch (err) {
      console.warn('Difficulty puzzle fetch failed:', err.message);
    }

    if (!puzzleRow) {
      set({ status: 'error', errorMsg: 'No puzzles found for this difficulty. Try a different level.' });
      return;
    }

    const success = get()._initPuzzle(puzzleRow);
    if (!success) {
      set({ status: 'error', errorMsg: 'Invalid puzzle data. Try loading another puzzle.' });
    }
  },

  // ── Solution review ───────────────────────────────────────────────────────
  enterReviewMode() {
    const { puzzle, solutionMoves } = get();
    if (!puzzle || solutionMoves.length === 0) return;

    // Start review at the position BEFORE the puzzle (original FEN)
    // so the first forward step shows the setup move
    set({
      reviewMode: true,
      reviewIndex: 0,
      currentFen: puzzle.fen,
    });
  },

  reviewStep(direction) {
    const { reviewIndex, solutionMoves, puzzle } = get();
    if (!puzzle || solutionMoves.length === 0) return null;

    const newIndex = Math.max(0, Math.min(reviewIndex + direction, solutionMoves.length));
    if (newIndex === reviewIndex) return null;

    let fen;
    if (newIndex === 0) {
      // Index 0 = original puzzle FEN (before any moves)
      fen = puzzle.fen;
    } else {
      fen = solutionMoves[newIndex - 1]?.fen || puzzle.fen;
    }

    set({ reviewIndex: newIndex, currentFen: fen });

    // Always return the move that produced the *current* position (newIndex),
    // so the caller can highlight it. For newIndex 0 there is no move.
    if (newIndex === 0) return null;
    return solutionMoves[newIndex - 1] || null;
  },

  // ── Retry puzzle ──────────────────────────────────────────────────────────
  retryPuzzle() {
    const { puzzle } = get();
    if (!puzzle) return;

    try {
      _chess = new Chess(puzzle.fen);
    } catch {
      return;
    }

    // Odd move count: no setup move — player plays from FEN
    if (puzzle.moves.length % 2 === 1) {
      const playerColor = _chess.turn();
      set({
        moveIndex:   0,
        currentFen:  _chess.fen(),
        playerColor,
        status:      'playing',
        wrongAttempt: false,
        attempts:    0,
        hintSquare:  null,
        hintUsed:    false,
        playerMoves: [],
        reviewMode:  false,
        reviewIndex: 0,
        puzzleStartTime: Date.now(),
        setupMoveFrom: null,
        setupMoveTo:   null,
      });
      return;
    }

    // Even move count: replay opponent's setup move
    const setupCoords = uciToCoords(puzzle.moves[0]);
    const firstMove = _chess.move(uciToMove(puzzle.moves[0]));
    if (!firstMove) return;

    const playerColor = _chess.turn();
    set({
      moveIndex:   1,
      currentFen:  _chess.fen(),
      playerColor,
      status:      'playing',
      wrongAttempt: false,
      attempts:    0,
      hintSquare:  null,
      hintUsed:    false,
      playerMoves: [],
      reviewMode:  false,
      reviewIndex: 0,
      puzzleStartTime: Date.now(),
      setupMoveFrom: setupCoords.from,
      setupMoveTo:   setupCoords.to,
    });
  },

  // ── Puzzle history ────────────────────────────────────────────────────────
  async loadPuzzleHistory(userId) {
    if (!userId) return;
    set({ historyLoading: true });

    // Important: do NOT use an implicit join (e.g. 'puzzles(rating, themes)').
    // There is no foreign-key relationship declared in the schema between
    // puzzle_attempts and puzzles, so the join makes the whole query fail
    // and the Recent Puzzles list silently shows as empty. The puzzle_rating
    // column on puzzle_attempts already carries the rating we need.
    try {
      const { data, error } = await supabase
        .from('puzzle_attempts')
        .select('*')
        .eq('user_id', userId)
        .order('attempted_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Puzzle history load error:', error.message);
        set({ puzzleHistory: [], historyLoading: false });
        return;
      }

      set({ puzzleHistory: data || [], historyLoading: false });
    } catch (err) {
      console.warn('Puzzle history fetch failed:', err.message);
      set({ puzzleHistory: [], historyLoading: false });
    }
  },

  // ── Rating history for chart ──────────────────────────────────────────────
  async loadRatingHistory(userId) {
    if (!userId) return;
    set({ ratingHistoryLoading: true });

    try {
      const { data, error } = await supabase
        .from('puzzle_rating_history')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: true })
        .limit(200);

      if (error) {
        console.warn('Rating history load error:', error.message);
        set({ ratingHistory: [], ratingHistoryLoading: false });
        return;
      }

      set({ ratingHistory: data || [], ratingHistoryLoading: false });
    } catch (err) {
      console.warn('Rating history fetch failed:', err.message);
      set({ ratingHistory: [], ratingHistoryLoading: false });
    }
  },

  // ── Record a puzzle attempt ───────────────────────────────────────────────
  async recordAttempt(userId, puzzleId, solved, timeTaken, ratingChange, puzzleRating) {
    if (!userId || !puzzleId) return;

    try {
      await supabase.from('puzzle_attempts').upsert({
        user_id: userId,
        puzzle_id: puzzleId,
        solved,
        time_taken: timeTaken,
        rating_change: ratingChange,
        puzzle_rating: puzzleRating,
        attempted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,puzzle_id' });

      await get().loadPuzzleHistory(userId);
    } catch (err) {
      console.warn('Failed to record puzzle attempt:', err.message);
    }
  },

  // ── Record rating history ─────────────────────────────────────────────────
  async recordRatingHistory(userId, rating) {
    if (!userId) return;

    try {
      await supabase.from('puzzle_rating_history').insert({
        user_id: userId,
        rating,
      });

      await get().loadRatingHistory(userId);
    } catch (err) {
      console.warn('Failed to record rating history:', err.message);
    }
  },

  // ── Reset (go back to idle) ───────────────────────────────────────────────
  reset() {
    get().stopRushTimer();
    set({
      puzzle: null, moveIndex: 0, currentFen: null, status: 'idle',
      lastRatingChange: null, errorMsg: null,
      rushActive: false, rushScore: 0, rushStrikes: 0,
      streakActive: false, streakCount: 0,
      dailyPuzzle: null, dailySolved: false,
      selectedTheme: null, difficultyLevel: null,
      reviewMode: false, reviewIndex: 0, solutionMoves: [], playerMoves: [],
      puzzleStartTime: null,
    });
  },
}));

export default usePuzzleStore;
