import { Chess } from 'chess.js';
import { reviewMoveAsync } from './analysisEngine';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const REVIEW_DEPTH = 2; // depth 2 is fast (~50ms per position) yet meaningful

export const CLASSIFICATIONS = {
  brilliant:  { symbol: '!!', label: 'Brilliant',  color: '#00b5ff', bg: 'rgba(0,181,255,0.15)',  icon: '💡' },
  critical:   { symbol: '!',  label: 'Critical',   color: '#ff6b35', bg: 'rgba(255,107,53,0.15)',  icon: '❗' },
  best:       { symbol: '★',  label: 'Best',       color: '#3ddc84', bg: 'rgba(61,220,132,0.15)',  icon: '⭐' },
  excellent:  { symbol: '👍', label: 'Excellent',  color: '#81c343', bg: 'rgba(129,195,67,0.15)',  icon: '👍' },
  okay:       { symbol: '✓',  label: 'Okay',       color: '#4ab37c', bg: 'rgba(74,179,124,0.15)', icon: '✓'  },
  inaccuracy: { symbol: '?!', label: 'Inaccuracy', color: '#f0c94c', bg: 'rgba(240,201,76,0.15)',  icon: '⁉'  },
  mistake:    { symbol: '?',  label: 'Mistake',    color: '#e08c00', bg: 'rgba(224,140,0,0.15)',   icon: '❓' },
  blunder:    { symbol: '??', label: 'Blunder',    color: '#cc3333', bg: 'rgba(204,51,51,0.15)',   icon: '❌' },
  theory:     { symbol: '📖', label: 'Theory',     color: '#8e7c5e', bg: 'rgba(142,124,94,0.15)',  icon: '📖' },
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

// Convert UCI move to SAN in a given FEN position
function uciToSan(fen, uci) {
  try {
    const chess = new Chess(fen);
    const result = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return result?.san || uci;
  } catch { return uci; }
}

/**
 * Review all moves in a game.
 * Returns array of { classification, diff, bestScore, playedScore, bestMoveSan }
 * @param {Array} moveHistory
 * @param {function} onProgress - (current, total) callback
 * @param {AbortSignal} [signal] - optional abort signal to cancel mid-review
 */
export async function reviewGame(moveHistory, onProgress, signal) {
  if (!moveHistory.length) return [];
  const results = [];

  // Simple theory detection: first 10 moves where the best move matches what was played
  let theoryStreak = 0;

  for (let i = 0; i < moveHistory.length; i++) {
    if (signal?.aborted) return results; // return partial results on cancel
    const fenBefore = i === 0 ? START_FEN : moveHistory[i - 1].fen;
    const fenAfter  = moveHistory[i].fen;
    const isWhite   = moveHistory[i].color === 'w';

    // Off-main-thread evaluation via the analysis worker (with LRU cache).
    // Same semantics as the prior synchronous calls — just not blocking the UI.
    const { bestScore, bestUci, playedScore } = await reviewMoveAsync(fenBefore, fenAfter, REVIEW_DEPTH);

    const diff = isWhite
      ? playedScore - bestScore
      : bestScore - playedScore;

    // Detect opening theory: first 10 moves, if played = best move consider it theory
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

    onProgress?.(i + 1, moveHistory.length, results);
  }

  return results;
}
