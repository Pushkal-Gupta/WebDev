import { describe, it, expect } from 'vitest';
import {
  squareName, rankToRow, fileToCol, parseFen,
  uciToMove, uciToCoords, FILE_LABELS,
} from '../boardHelpers';

// ── squareName ──────────────────────────────────────────────────────────────

describe('squareName', () => {
  it('top-left corner (row=0, col=0) is a8', () => {
    expect(squareName(0, 0)).toBe('a8');
  });

  it('bottom-right corner (row=7, col=7) is h1', () => {
    expect(squareName(7, 7)).toBe('h1');
  });

  it('e2 pawn square (row=6, col=4)', () => {
    expect(squareName(6, 4)).toBe('e2');
  });

  it('h8 corner (row=0, col=7)', () => {
    expect(squareName(0, 7)).toBe('h8');
  });

  it('d4 center square (row=4, col=3)', () => {
    expect(squareName(4, 3)).toBe('d4');
  });
});

// ── rankToRow / fileToCol ───────────────────────────────────────────────────

describe('rankToRow', () => {
  it('rank 8 maps to row 0', () => expect(rankToRow('8')).toBe(0));
  it('rank 1 maps to row 7', () => expect(rankToRow('1')).toBe(7));
  it('rank 4 maps to row 4', () => expect(rankToRow('4')).toBe(4));
});

describe('fileToCol', () => {
  it('file a maps to col 0', () => expect(fileToCol('a')).toBe(0));
  it('file h maps to col 7', () => expect(fileToCol('h')).toBe(7));
  it('file e maps to col 4', () => expect(fileToCol('e')).toBe(4));
});

describe('coordinate round-trip', () => {
  it('squareName(rankToRow, fileToCol) reconstructs algebraic notation', () => {
    const squares = ['a1', 'e4', 'h8', 'd5', 'b7', 'g2'];
    for (const sq of squares) {
      const row = rankToRow(sq[1]);
      const col = fileToCol(sq[0]);
      expect(squareName(row, col)).toBe(sq);
    }
  });
});

// ── parseFen ────────────────────────────────────────────────────────────────

describe('parseFen', () => {
  const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  it('parses starting position correctly', () => {
    const board = parseFen(STARTING_FEN);

    // Black pieces on rank 8 (row 0)
    expect(board[0][0]).toEqual({ type: 'r', color: 'b' });
    expect(board[0][1]).toEqual({ type: 'n', color: 'b' });
    expect(board[0][4]).toEqual({ type: 'k', color: 'b' });
    expect(board[0][7]).toEqual({ type: 'r', color: 'b' });

    // Black pawns on rank 7 (row 1)
    for (let col = 0; col < 8; col++) {
      expect(board[1][col]).toEqual({ type: 'p', color: 'b' });
    }

    // Empty squares in the middle
    expect(board[3][3]).toBeNull();
    expect(board[4][4]).toBeNull();

    // White pieces on rank 1 (row 7)
    expect(board[7][0]).toEqual({ type: 'r', color: 'w' });
    expect(board[7][4]).toEqual({ type: 'k', color: 'w' });
    expect(board[7][3]).toEqual({ type: 'q', color: 'w' });

    // White pawns on rank 2 (row 6)
    for (let col = 0; col < 8; col++) {
      expect(board[6][col]).toEqual({ type: 'p', color: 'w' });
    }
  });

  it('parses empty board (all empty ranks)', () => {
    const board = parseFen('8/8/8/8/8/8/8/8 w - - 0 1');
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        expect(board[r][c]).toBeNull();
      }
    }
  });

  it('null FEN returns 8x8 empty board', () => {
    const board = parseFen(null);
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(8);
    expect(board[0][0]).toBeNull();
  });

  it('parses position with only kings', () => {
    const board = parseFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(board[0][4]).toEqual({ type: 'k', color: 'b' });
    expect(board[7][4]).toEqual({ type: 'k', color: 'w' });
    // All other squares empty
    expect(board[0][0]).toBeNull();
    expect(board[0][3]).toBeNull();
    expect(board[4][4]).toBeNull();
  });
});

// ── uciToMove ───────────────────────────────────────────────────────────────

describe('uciToMove', () => {
  it('parses standard move e2e4', () => {
    expect(uciToMove('e2e4')).toEqual({ from: 'e2', to: 'e4', promotion: undefined });
  });

  it('parses queen promotion a7a8q', () => {
    expect(uciToMove('a7a8q')).toEqual({ from: 'a7', to: 'a8', promotion: 'q' });
  });

  it('parses knight promotion b7b8n', () => {
    expect(uciToMove('b7b8n')).toEqual({ from: 'b7', to: 'b8', promotion: 'n' });
  });

  it('parses rook promotion e7e8r', () => {
    expect(uciToMove('e7e8r')).toEqual({ from: 'e7', to: 'e8', promotion: 'r' });
  });

  it('parses castling move (king side) e1g1', () => {
    expect(uciToMove('e1g1')).toEqual({ from: 'e1', to: 'g1', promotion: undefined });
  });
});

// ── uciToCoords ─────────────────────────────────────────────────────────────

describe('uciToCoords', () => {
  it('e2e4 → from [6,4] to [4,4]', () => {
    expect(uciToCoords('e2e4')).toEqual({ from: [6, 4], to: [4, 4] });
  });

  it('a7a8q → from [1,0] to [0,0] (promotion suffix ignored for coords)', () => {
    const result = uciToCoords('a7a8q');
    expect(result.from).toEqual([1, 0]);
    expect(result.to).toEqual([0, 0]);
  });

  it('h1h8 → from [7,7] to [0,7]', () => {
    expect(uciToCoords('h1h8')).toEqual({ from: [7, 7], to: [0, 7] });
  });

  it('a1a1 → from [7,0] to [7,0] (same square)', () => {
    expect(uciToCoords('a1a1')).toEqual({ from: [7, 0], to: [7, 0] });
  });
});
