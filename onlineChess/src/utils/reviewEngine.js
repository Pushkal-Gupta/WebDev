import { Chess } from 'chess.js';
import { getLocalBestMoveWithScore, getPositionScore } from './localAI';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const REVIEW_DEPTH = 2; // depth 2 is fast (~50ms per position) yet meaningful

export const CLASSIFICATIONS = {
  brilliant:  { symbol: '!!', label: 'Brilliant',   color: '#00b5ff' },
  best:       { symbol: '·',  label: 'Best',         color: '#3ddc84' },
  good:       { symbol: '!',  label: 'Good',         color: '#81b64c' },
  inaccuracy: { symbol: '?',  label: 'Inaccuracy',   color: '#f0c94c' },
  mistake:    { symbol: '?!', label: 'Mistake',      color: '#e08c00' },
  blunder:    { symbol: '??', label: 'Blunder',      color: '#cc3333' },
};

export function classifyMove(diff) {
  // diff <= 0: how many centipawns worse than optimal (from moving player's perspective)
  if (diff >= 50)   return 'brilliant';  // somehow found a better line than expected
  if (diff >= -15)  return 'best';
  if (diff >= -50)  return 'good';
  if (diff >= -100) return 'inaccuracy';
  if (diff >= -250) return 'mistake';
  return 'blunder';
}

/**
 * Review all moves in a game.
 * Returns array of { classification, diff, bestScore, playedScore }
 */
export async function reviewGame(moveHistory, onProgress) {
  if (!moveHistory.length) return [];
  const results = [];

  for (let i = 0; i < moveHistory.length; i++) {
    const fenBefore = i === 0 ? START_FEN : moveHistory[i - 1].fen;
    const fenAfter  = moveHistory[i].fen;
    const isWhite   = moveHistory[i].color === 'w';

    // Best achievable score from position before this move
    const { score: bestScore } = getLocalBestMoveWithScore(fenBefore, REVIEW_DEPTH);
    // Score after the actual move played (opponent will respond optimally)
    const playedScore = getPositionScore(fenAfter, REVIEW_DEPTH - 1);

    // Positive diff = player played better than "best" (rare, rounding)
    // Negative diff = player played worse
    const diff = isWhite
      ? playedScore - bestScore   // white wants higher scores
      : bestScore - playedScore;  // black wants lower scores

    results.push({
      classification: classifyMove(diff),
      diff,
      bestScore,
      playedScore,
    });

    onProgress?.(i + 1, moveHistory.length);
    await new Promise(r => setTimeout(r, 0)); // yield to UI thread
  }

  return results;
}
