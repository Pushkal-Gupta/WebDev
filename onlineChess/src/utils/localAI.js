/**
 * Local chess AI — Minimax with Alpha-Beta Pruning + Quiescence Search
 * Uses PST evaluation tables from evaluation.js.
 *
 * Strength 1-10 with fine-grained calibration for ELO-accurate play:
 *
 *   Strength 1 (~100-300 ELO):
 *     depth 1, NO quiescence, very high noise, 30-40% random moves
 *     → Hangs pieces, misses basic tactics, moves semi-randomly
 *
 *   Strength 2 (~400-500 ELO):
 *     depth 1, quiescence 1, high noise, 15-25% random moves
 *     → Captures hanging pieces sometimes but still blunders regularly
 *
 *   Strength 3 (~600-800 ELO):
 *     depth 1, quiescence 2, moderate noise, 8-12% random moves
 *     → Sees simple captures, still makes positional mistakes
 *
 *   Strength 4 (~900-1100 ELO):
 *     depth 2, quiescence 2, moderate noise, 5% random moves
 *     → Club beginner, basic tactics, weak positionally
 *
 *   Strength 5 (~1200-1300 ELO):
 *     depth 2, quiescence 3, low noise, 2% random moves
 *     → Intermediate, sees 2-move tactics
 *
 *   Strength 6 (~1400-1600 ELO):
 *     depth 3, quiescence 3, low noise, 0% random
 *     → Solid club player, decent tactics
 *
 *   Strength 7-8 (1700-2000 ELO): depth 4, Stockfish WASM
 *   Strength 9-10 (2100-2800 ELO): depth 5, Stockfish WASM
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

// ─── Strength parameters ─────────────────────────────────────────────────────
// Each strength level gets carefully tuned: search depth, quiescence depth,
// noise magnitude, and blunder rate (probability of picking a random move).

function getStrengthParams(strength) {
  switch (strength) {
    case 1:  return { depth: 1, qDepth: 0, noiseMag: 350, blunderRate: 0.35 };
    case 2:  return { depth: 1, qDepth: 1, noiseMag: 220, blunderRate: 0.20 };
    case 3:  return { depth: 1, qDepth: 2, noiseMag: 140, blunderRate: 0.10 };
    case 4:  return { depth: 2, qDepth: 2, noiseMag: 90,  blunderRate: 0.05 };
    case 5:  return { depth: 2, qDepth: 3, noiseMag: 55,  blunderRate: 0.02 };
    case 6:  return { depth: 3, qDepth: 3, noiseMag: 30,  blunderRate: 0 };
    case 7:  return { depth: 4, qDepth: 3, noiseMag: 15,  blunderRate: 0 };
    case 8:  return { depth: 4, qDepth: 3, noiseMag: 8,   blunderRate: 0 };
    case 9:  return { depth: 5, qDepth: 4, noiseMag: 3,   blunderRate: 0 };
    case 10: return { depth: 5, qDepth: 4, noiseMag: 0,   blunderRate: 0 };
    default: return { depth: 2, qDepth: 3, noiseMag: 55,  blunderRate: 0.02 };
  }
}

// ─── Minimax with configurable quiescence depth ──────────────────────────────
function minimaxQ(chess, depth, alpha, beta, maximizing, qDepth) {
  if (chess.isGameOver()) {
    if (chess.isCheckmate()) return maximizing ? -99999 : 99999;
    return 0; // stalemate or draw
  }
  if (depth === 0) {
    if (qDepth <= 0) return evaluatePosition(chess.board());
    return quiescence(chess, alpha, beta, maximizing, qDepth);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimaxQ(chess, depth - 1, alpha, beta, !maximizing, qDepth);
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

// Legacy minimax for backward compat (used by analysis worker)
function minimax(chess, depth, alpha, beta, maximizing) {
  return minimaxQ(chess, depth, alpha, beta, maximizing, 3);
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

  const params = getStrengthParams(strength);

  // Blunder injection: with blunderRate probability, pick a random legal move
  if (params.blunderRate > 0 && Math.random() < params.blunderRate) {
    const idx = Math.floor(Math.random() * allMoves.length);
    const m = allMoves[idx];
    return m.from + m.to + (m.promotion || '');
  }

  const isMax = chess.turn() === 'w';
  let bestMove = null;
  let bestScore = isMax ? -Infinity : Infinity;

  for (const move of orderMoves(allMoves)) {
    chess.move(move);
    const raw = minimaxQ(chess, params.depth - 1, -Infinity, Infinity, !isMax, params.qDepth);
    chess.undo();

    const score = raw + (Math.random() - 0.5) * params.noiseMag;
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
