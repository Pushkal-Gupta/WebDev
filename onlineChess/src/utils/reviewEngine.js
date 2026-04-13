import { Chess } from 'chess.js';
import { reviewMoveAsync } from './analysisEngine';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const REVIEW_DEPTH = 2; // depth 2 is fast (~50ms per position) yet meaningful

export const CLASSIFICATIONS = {
  brilliant:  { symbol: '!!', label: 'Brilliant',  color: '#00b5ff', bg: 'rgba(0,181,255,0.15)',  icon: '!!' },
  critical:   { symbol: '!',  label: 'Critical',   color: '#ff6b35', bg: 'rgba(255,107,53,0.15)',  icon: '!'  },
  best:       { symbol: '\u2605', label: 'Best',    color: '#3ddc84', bg: 'rgba(61,220,132,0.15)',  icon: '\u2605' },
  excellent:  { symbol: '\u2713', label: 'Excellent', color: '#81c343', bg: 'rgba(129,195,67,0.15)', icon: '\u2713' },
  okay:       { symbol: '\u223C', label: 'Okay',    color: '#4ab37c', bg: 'rgba(74,179,124,0.15)', icon: '\u223C' },
  inaccuracy: { symbol: '?!', label: 'Inaccuracy', color: '#f0c94c', bg: 'rgba(240,201,76,0.15)',  icon: '?!' },
  mistake:    { symbol: '?',  label: 'Mistake',    color: '#e08c00', bg: 'rgba(224,140,0,0.15)',   icon: '?'  },
  blunder:    { symbol: '??', label: 'Blunder',    color: '#cc3333', bg: 'rgba(204,51,51,0.15)',   icon: '??' },
  theory:     { symbol: '\u2261', label: 'Theory',  color: '#8e7c5e', bg: 'rgba(142,124,94,0.15)', icon: '\u2261' },
};

export function classifyMove(diff, isTheory = false) {
  if (isTheory)     return 'theory';
  if (diff >= 80)   return 'brilliant';
  if (diff >= 20)   return 'critical';
  if (diff >= -10)  return 'best';
  if (diff >= -40)  return 'excellent';
  if (diff >= -80)  return 'okay';
  if (diff >= -150) return 'inaccuracy';
  if (diff >= -300) return 'mistake';
  return 'blunder';
}

/**
 * Generate a natural-language explanation for a move classification.
 */
export function explainMove(classification, bestMoveSan, playedSan) {
  const best = bestMoveSan || 'the engine suggestion';
  switch (classification) {
    case 'brilliant':  return 'An exceptional move! A strong sacrifice that improves your position.';
    case 'critical':   return `A critical moment in the game. ${best} was the key move to find.`;
    case 'best':       return 'This was the engine\'s top choice. Well played.';
    case 'excellent':  return 'A very strong move — nearly equal to the best option.';
    case 'okay':       return 'A reasonable move, though a slightly better option existed.';
    case 'inaccuracy': return `A slight slip. ${best} was more precise here.`;
    case 'mistake':    return `This move weakens your position. ${best} was significantly stronger.`;
    case 'blunder':    return `A serious error that loses material or decisive advantage. ${best} was much better.`;
    case 'theory':     return 'Standard opening theory — a well-known move in this position.';
    default:           return '';
  }
}

// Convert UCI move to SAN in a given FEN position
function uciToSan(fen, uci) {
  try {
    const chess = new Chess(fen);
    const result = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return result?.san || uci;
  } catch { return uci; }
}

/**
 * Compute per-phase accuracy (opening / middlegame / endgame).
 * Returns { opening: { white, black }, middlegame: { white, black }, endgame: { white, black } }
 */
const PHASE_ACC_WEIGHTS = {
  brilliant: 100, critical: 90, best: 100, excellent: 90, okay: 65,
  inaccuracy: 40, mistake: 15, blunder: 0, theory: 85,
};

function countPiecesFromFen(fen) {
  const board = fen.split(' ')[0];
  return (board.match(/[pnbrqkPNBRQK]/g) || []).length;
}

export function classifyPhases(moveHistory, reviewResults) {
  if (!reviewResults?.length || !moveHistory?.length) return null;

  // Determine phase boundaries
  let openingEnd = 0;
  let endgameStart = moveHistory.length;

  // Opening: first 10 half-moves or until theory streak ends
  for (let i = 0; i < Math.min(20, reviewResults.length); i++) {
    if (reviewResults[i]?.classification === 'theory') {
      openingEnd = i + 1;
    } else if (i < 10) {
      openingEnd = Math.max(openingEnd, i + 1);
    } else {
      break;
    }
  }
  if (openingEnd < 6) openingEnd = Math.min(10, reviewResults.length);

  // Endgame: when total pieces ≤ 10
  for (let i = reviewResults.length - 1; i >= openingEnd; i--) {
    if (moveHistory[i]?.fen && countPiecesFromFen(moveHistory[i].fen) <= 10) {
      endgameStart = i;
    } else {
      break;
    }
  }
  if (endgameStart <= openingEnd) endgameStart = reviewResults.length;

  function phaseAcc(startIdx, endIdx, color) {
    const moves = [];
    for (let i = startIdx; i < endIdx && i < reviewResults.length; i++) {
      if (!reviewResults[i] || moveHistory[i]?.color !== color) continue;
      moves.push(reviewResults[i]);
    }
    if (!moves.length) return null;
    return Math.round(moves.reduce((s, r) => s + (PHASE_ACC_WEIGHTS[r.classification] ?? 50), 0) / moves.length);
  }

  return {
    opening: { white: phaseAcc(0, openingEnd, 'w'), black: phaseAcc(0, openingEnd, 'b') },
    middlegame: { white: phaseAcc(openingEnd, endgameStart, 'w'), black: phaseAcc(openingEnd, endgameStart, 'b') },
    endgame: endgameStart < reviewResults.length
      ? { white: phaseAcc(endgameStart, reviewResults.length, 'w'), black: phaseAcc(endgameStart, reviewResults.length, 'b') }
      : null,
  };
}

/**
 * Classify all moves in a game from pre-computed Stockfish evaluations.
 * Returns same shape as old reviewGame: array of { classification, diff, bestScore, playedScore, bestMoveSan, san }
 * @param {Array} moveHistory
 * @param {Map<string, { score: number, bestMove: string }>} evals - FEN → eval data
 * @returns {Array|null} results array, or null if insufficient evals
 */
export function classifyFromEvals(moveHistory, evals) {
  if (!moveHistory.length || !evals.size) return null;
  const results = [];
  let theoryStreak = 0;

  for (let i = 0; i < moveHistory.length; i++) {
    const fenBefore = i === 0 ? START_FEN : moveHistory[i - 1].fen;
    const fenAfter  = moveHistory[i].fen;
    const isWhite   = moveHistory[i].color === 'w';

    const evalBefore = evals.get(fenBefore);
    const evalAfter  = evals.get(fenAfter);

    if (!evalBefore || !evalAfter) {
      results.push(null); // not yet evaluated
      continue;
    }

    const bestScore   = evalBefore.score;
    const playedScore = evalAfter.score;
    const bestUci     = evalBefore.bestMove;

    // Diff from the moving side's perspective
    const diff = isWhite
      ? playedScore - bestScore
      : bestScore - playedScore;

    // Detect opening theory
    const playedUci = (() => {
      try {
        const fromFile = String.fromCharCode('a'.charCodeAt(0) + moveHistory[i].from.col);
        const fromRank = String(8 - moveHistory[i].from.row);
        const toFile   = String.fromCharCode('a'.charCodeAt(0) + moveHistory[i].to.col);
        const toRank   = String(8 - moveHistory[i].to.row);
        return fromFile + fromRank + toFile + toRank;
      } catch { return ''; }
    })();
    const isTheory = i < 12 && theoryStreak === i && bestUci === playedUci;
    if (isTheory) theoryStreak++;

    const classification = classifyMove(diff, isTheory);
    const bestMoveSan = bestUci ? uciToSan(fenBefore, bestUci) : null;

    results.push({
      classification,
      diff,
      bestScore,
      playedScore,
      bestMoveSan,
      san: moveHistory[i].san,
    });
  }

  return results;
}

/**
 * Review all moves in a game (legacy — uses local minimax worker).
 * Kept for fallback. Prefer classifyFromEvals with Stockfish progressive analysis.
 */
export async function reviewGame(moveHistory, onProgress, signal) {
  if (!moveHistory.length) return [];
  const results = [];
  let theoryStreak = 0;

  for (let i = 0; i < moveHistory.length; i++) {
    if (signal?.aborted) return results;
    const fenBefore = i === 0 ? START_FEN : moveHistory[i - 1].fen;
    const fenAfter  = moveHistory[i].fen;
    const isWhite   = moveHistory[i].color === 'w';

    const { bestScore, bestUci, playedScore } = await reviewMoveAsync(fenBefore, fenAfter, REVIEW_DEPTH);

    const diff = isWhite
      ? playedScore - bestScore
      : bestScore - playedScore;

    const playedUci = (() => {
      try {
        const fromFile = String.fromCharCode('a'.charCodeAt(0) + moveHistory[i].from.col);
        const fromRank = String(8 - moveHistory[i].from.row);
        const toFile   = String.fromCharCode('a'.charCodeAt(0) + moveHistory[i].to.col);
        const toRank   = String(8 - moveHistory[i].to.row);
        return fromFile + fromRank + toFile + toRank;
      } catch { return ''; }
    })();
    const isTheory = i < 12 && theoryStreak === i && bestUci === playedUci;
    if (isTheory) theoryStreak++;

    const classification = classifyMove(diff, isTheory);
    const bestMoveSan = bestUci ? uciToSan(fenBefore, bestUci) : null;

    results.push({ classification, diff, bestScore, playedScore, bestMoveSan, san: moveHistory[i].san });
    onProgress?.(i + 1, moveHistory.length, results);
  }

  return results;
}
