/**
 * Shared board helpers — constants and functions used across
 * P2PGame, PuzzlePage, SpectateBoard, and BoardEditor.
 */

export const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
export const FILE_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function squareName(row, col) {
  return FILE_LABELS[col] + (8 - row);
}

export function rankToRow(rankChar) { return 8 - parseInt(rankChar); }
export function fileToCol(fileChar) { return FILE_LABELS.indexOf(fileChar); }

export function uciToMove(uci) {
  return {
    from:      uci.slice(0, 2),
    to:        uci.slice(2, 4),
    promotion: uci[4] || undefined,
  };
}

export function uciToCoords(uci) {
  // "e2e4" → { from: [6, 4], to: [4, 4] } (row, col)
  const fromCol = uci.charCodeAt(0) - 97;
  const fromRow = 8 - parseInt(uci[1]);
  const toCol   = uci.charCodeAt(2) - 97;
  const toRow   = 8 - parseInt(uci[3]);
  return { from: [fromRow, fromCol], to: [toRow, toCol] };
}

/**
 * Parse a FEN string into an 8x8 board array.
 * Each cell is null or { type: 'p'|'n'|..., color: 'w'|'b' }.
 */
export function parseFen(fen) {
  if (!fen) return Array.from({ length: 8 }, () => Array(8).fill(null));
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const rows = fen.split(' ')[0].split('/');
  rows.forEach((rowStr, r) => {
    let c = 0;
    for (const ch of rowStr) {
      if (isNaN(ch)) {
        board[r][c] = { type: ch.toLowerCase(), color: ch === ch.toUpperCase() ? 'w' : 'b' };
        c++;
      } else {
        c += parseInt(ch);
      }
    }
  });
  return board;
}
