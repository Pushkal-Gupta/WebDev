/**
 * Local chess AI — Minimax with Alpha-Beta Pruning + Quiescence Search
 * Uses the same PST evaluation tables as the eval bar.
 *
 * Strength 1-10:
 *   1-2  → depth 1, high noise (beginner blunders)
 *   3-4  → depth 2
 *   5-6  → depth 3
 *   7-8  → depth 4
 *   9-10 → depth 5 + quiescence depth 4 (strong club-level)
 */

import { Chess } from 'chess.js';
import { evaluatePosition } from './evaluation';

// ─── Piece values for MVV-LVA move ordering ───────────────────────────────────
const PV = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Score a move for ordering (captures first, then promotions, then others)
function moveOrderScore(move) {
  let s = 0;
  if (move.captured) s += PV[move.captured] * 10 - (PV[move.piece] || 0); // MVV-LVA
  if (move.promotion) s += PV[move.promotion] || 800;
  // Bonus for center squares (d4/d5/e4/e5)
  const f = move.to.charCodeAt(0) - 97;
  const r = parseInt(move.to[1]) - 1;
  if (f >= 3 && f <= 4 && r >= 3 && r <= 4) s += 20;
  return s;
}

function orderMoves(moves) {
  return [...moves].sort((a, b) => moveOrderScore(b) - moveOrderScore(a));
}

// ─── Quiescence search ────────────────────────────────────────────────────────
// Only examines captures/promotions to resolve tactical noise at leaf nodes.
function quiescence(chess, alpha, beta, maximizing, depth) {
  const standPat = evaluatePosition(chess.board());

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  if (depth <= 0) return standPat;

  const noisyMoves = chess.moves({ verbose: true }).filter(m => m.captured || m.promotion);
  for (const move of orderMoves(noisyMoves)) {
    chess.move(move);
    const score = quiescence(chess, alpha, beta, !maximizing, depth - 1);
    chess.undo();
    if (maximizing) {
      if (score > alpha) alpha = score;
      if (alpha >= beta) return beta;
    } else {
      if (score < beta) beta = score;
      if (beta <= alpha) return alpha;
    }
  }
  return maximizing ? alpha : beta;
}

// ─── Minimax with Alpha-Beta Pruning ─────────────────────────────────────────
function minimax(chess, depth, alpha, beta, maximizing) {
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) return maximizing ? -99999 : 99999;
    return 0; // stalemate or draw
  }
  if (depth === 0) {
    return quiescence(chess, alpha, beta, maximizing, 3);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, alpha, beta, !maximizing);
    chess.undo();

    if (maximizing) {
      if (score > best) best = score;
      if (score > alpha) alpha = score;
    } else {
      if (score < best) best = score;
      if (score < beta) beta = score;
    }
    if (beta <= alpha) break; // prune
  }
  return best;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get best move for current FEN position.
 * @param {string} fen  - FEN string
 * @param {number} strength - 1-10 difficulty
 * @returns {string|null} UCI move string like "e2e4" or "e7e8q"
 */
export function getLocalBestMove(fen, strength = 5) {
  const chess = new Chess(fen);
  const allMoves = chess.moves({ verbose: true });

  if (!allMoves.length) return null;
  if (allMoves.length === 1) {
    const m = allMoves[0];
    return m.from + m.to + (m.promotion || '');
  }

  // Depth by strength tier
  const depth =
    strength <= 2 ? 1 :
    strength <= 4 ? 2 :
    strength <= 6 ? 3 :
    strength <= 8 ? 4 : 5;

  // Noise: lower strength = more random (avoids engine-perfect play at low levels)
  const noiseMag = Math.max(0, (8 - strength) * 22);

  const isMax = chess.turn() === 'w';
  let bestMove = null;
  let bestScore = isMax ? -Infinity : Infinity;

  for (const move of orderMoves(allMoves)) {
    chess.move(move);
    const raw = minimax(chess, depth - 1, -Infinity, Infinity, !isMax);
    chess.undo();

    const score = raw + (Math.random() - 0.5) * noiseMag;
    if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove ? bestMove.from + bestMove.to + (bestMove.promotion || '') : null;
}

/**
 * Get a move suggestion highlight without actually playing it.
 * Returns { from: "e2", to: "e4" } for the best move found at shallow depth.
 */
export function getSuggestion(fen) {
  const uci = getLocalBestMove(fen, 8); // depth 4, deterministic for hints
  if (!uci) return null;
  return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
}

/**
 * Like getLocalBestMove but also returns the minimax score.
 * Used for game review to determine the best achievable eval.
 */
export function getLocalBestMoveWithScore(fen, depth = 2) {
  const chess = new Chess(fen);
  const allMoves = chess.moves({ verbose: true });
  if (!allMoves.length) return { move: null, score: 0 };

  const isMax = chess.turn() === 'w';
  let bestMove = null;
  let bestScore = isMax ? -Infinity : Infinity;

  for (const move of orderMoves(allMoves)) {
    chess.move(move);
    const score = minimax(chess, Math.max(0, depth - 1), -Infinity, Infinity, !isMax);
    chess.undo();
    if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  return {
    move: bestMove ? bestMove.from + bestMove.to + (bestMove.promotion || '') : null,
    score: bestScore,
  };
}

/**
 * Get static/shallow eval of a position.
 * Used for game review to score the position after a move was played.
 */
export function getPositionScore(fen, depth = 1) {
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) return chess.turn() === 'w' ? -99999 : 99999;
    return 0;
  }
  const isMax = chess.turn() === 'w';
  return minimax(chess, depth, -Infinity, Infinity, isMax);
}
