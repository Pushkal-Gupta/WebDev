import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';

/**
 * Tests for promotion handling in PuzzleBoard.jsx.
 *
 * Previously, PuzzleBoard used validMoves.find() which always returned the
 * first promotion piece, making non-default promotions impossible. The fix
 * detects multiple promotion moves to the same square and shows a chooser.
 */

describe('promotion move detection', () => {
  const FEN = '6k1/4P3/8/8/8/8/8/2K5 w - - 0 1';

  it('chess.js returns 4 promotion options to the same square', () => {
    const chess = new Chess(FEN);
    const moves = chess.moves({ square: 'e7', verbose: true });
    const toE8 = moves.filter(m => m.to === 'e8');

    expect(toE8.length).toBe(4);
    const pieces = toE8.map(m => m.promotion).sort();
    expect(pieces).toEqual(['b', 'n', 'q', 'r']);
  });

  it('promotion moves have 5-char UCI (from+to+piece)', () => {
    const chess = new Chess(FEN);
    const moves = chess.moves({ square: 'e7', verbose: true });

    const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const validMoves = moves.map(m => ({
      row: 8 - parseInt(m.to[1]),
      col: FILE_LABELS.indexOf(m.to[0]),
      uci: m.from + m.to + (m.promotion || ''),
    }));

    // All promotion moves to e8 should be 5 chars
    const promoMoves = validMoves.filter(m => m.row === 0 && m.col === 4 && m.uci.length === 5);
    expect(promoMoves.length).toBe(4);

    // Each has a distinct promotion piece
    const uciSet = new Set(promoMoves.map(m => m.uci));
    expect(uciSet.has('e7e8q')).toBe(true);
    expect(uciSet.has('e7e8r')).toBe(true);
    expect(uciSet.has('e7e8b')).toBe(true);
    expect(uciSet.has('e7e8n')).toBe(true);
  });

  it('all 4 promotion pieces are legal chess moves', () => {
    for (const piece of ['q', 'r', 'b', 'n']) {
      const chess = new Chess(FEN);
      const result = chess.move({ from: 'e7', to: 'e8', promotion: piece });
      expect(result).not.toBeNull();
      expect(result.promotion).toBe(piece);
    }
  });

  it('non-promotion moves have 4-char UCI', () => {
    const chess = new Chess('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    const moves = chess.moves({ square: 'e2', verbose: true });

    const validMoves = moves.map(m => ({
      uci: m.from + m.to + (m.promotion || ''),
    }));

    // e2e3 and e2e4 — no promotion
    expect(validMoves.every(m => m.uci.length === 4)).toBe(true);
  });
});
