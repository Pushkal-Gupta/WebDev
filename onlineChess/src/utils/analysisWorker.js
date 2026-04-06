/**
 * Web Worker for analysis engine computation.
 * Runs minimax evaluation off the main thread to prevent UI lag.
 */
import { Chess } from 'chess.js';
import { getPositionScore, getLocalBestMoveWithScore } from './localAI';

self.onmessage = (e) => {
  const { type, id, fen, n } = e.data;
  if (type === 'getTopLines') {
    try {
      const result = computeTopLines(fen, n);
      self.postMessage({ id, result });
    } catch (err) {
      self.postMessage({ id, result: [], error: err.message });
    }
  }
};

function computeTopLines(fen, n = 3) {
  const chess = new Chess(fen);
  if (chess.isGameOver()) return [];
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return [];
  const isMax = chess.turn() === 'w';
  const scored = moves.map(m => {
    chess.move(m);
    const score = getPositionScore(chess.fen(), 2);
    chess.undo();
    return { move: m, score };
  });
  scored.sort((a, b) => isMax ? b.score - a.score : a.score - b.score);
  return scored.slice(0, n).map(({ move, score }) => {
    const lineChess = new Chess(fen);
    lineChess.move(move);
    const sanMoves = [move.san];
    for (let d = 0; d < 2; d++) {
      const { move: bestUci } = getLocalBestMoveWithScore(lineChess.fen(), 1);
      if (!bestUci) break;
      const r = lineChess.move({
        from: bestUci.slice(0, 2), to: bestUci.slice(2, 4),
        promotion: bestUci[4] || undefined,
      });
      if (!r) break;
      sanMoves.push(r.san);
    }
    return { san: move.san, score, line: sanMoves };
  });
}
