// ─── Piece-Square Tables & Evaluation ────────────────────────────────────────

const PIECE_VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0],
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20],
  ],
};

/**
 * Evaluate position from chessInstance.board()
 * Returns centipawns: positive = white advantage, negative = black
 */
export function evaluatePosition(board) {
  if (!board) return 0;
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pv  = PIECE_VAL[p.type] || 0;
      const pst = PST[p.type];
      const pr  = p.color === 'w' ? r : 7 - r;
      const pv2 = pst ? pst[pr][c] : 0;
      score += p.color === 'w' ? (pv + pv2) : -(pv + pv2);
    }
  }
  return score;
}

/**
 * Convert centipawn score to white-bar percentage (for eval bar fill)
 * Returns 0–100 where 50=equal, 100=white winning completely
 */
export function evalToWhitePct(cp) {
  const pawns = cp / 100;
  const pct = (1 / (1 + Math.exp(-0.4 * pawns))) * 100;
  return Math.max(2, Math.min(98, pct));
}

/**
 * Format eval score for display: "+1.3", "-0.5", "0.0"
 */
export function formatEval(cp) {
  if (cp === null || cp === undefined) return '0.0';
  const p = Math.abs(cp / 100).toFixed(1);
  if (cp > 15) return '+' + p;
  if (cp < -15) return '-' + p;
  return '0.0';
}

// ─── Opening Book ─────────────────────────────────────────────────────────────

const OPENINGS = [
  { m: ['e2-e4'],                                       n: "King's Pawn" },
  { m: ['d2-d4'],                                       n: "Queen's Pawn" },
  { m: ['c2-c4'],                                       n: "English Opening" },
  { m: ['g1-f3'],                                       n: "Réti Opening" },
  { m: ['b2-b3'],                                       n: "Nimzowitsch-Larsen Attack" },
  { m: ['f2-f4'],                                       n: "Bird's Opening" },
  { m: ['e2-e4', 'e7-e5'],                              n: "Open Game" },
  { m: ['e2-e4', 'c7-c5'],                              n: "Sicilian Defence" },
  { m: ['e2-e4', 'e7-e6'],                              n: "French Defence" },
  { m: ['e2-e4', 'c7-c6'],                              n: "Caro-Kann Defence" },
  { m: ['e2-e4', 'd7-d5'],                              n: "Scandinavian Defence" },
  { m: ['e2-e4', 'g8-f6'],                              n: "Alekhine's Defence" },
  { m: ['e2-e4', 'd7-d6'],                              n: "Pirc Defence" },
  { m: ['e2-e4', 'g7-g6'],                              n: "Modern Defence" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3'],                    n: "King's Knight Opening" },
  { m: ['e2-e4', 'e7-e5', 'f2-f4'],                    n: "King's Gambit" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'g8-f6'],           n: "Petrov's Defence" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6'],           n: "Two Knights Opening" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'f1-b5'],  n: "Ruy Lopez" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'f1-c4'],  n: "Italian Game" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'd2-d4'],  n: "Scotch Game" },
  { m: ['e2-e4', 'e7-e5', 'g1-f3', 'b8-c6', 'c2-c3'],  n: "Ponziani Opening" },
  { m: ['e2-e4', 'c7-c5', 'g1-f3'],                    n: "Sicilian: Open" },
  { m: ['e2-e4', 'c7-c5', 'g1-f3', 'd7-d6'],           n: "Sicilian: Najdorf" },
  { m: ['e2-e4', 'c7-c5', 'g1-f3', 'b8-c6'],           n: "Sicilian: Classical" },
  { m: ['e2-e4', 'c7-c5', 'g1-f3', 'e7-e6'],           n: "Sicilian: Kan" },
  { m: ['e2-e4', 'c7-c5', 'c2-c3'],                    n: "Sicilian: Alapin" },
  { m: ['e2-e4', 'e7-e6', 'd2-d4', 'd7-d5'],           n: "French Defence" },
  { m: ['e2-e4', 'e7-e6', 'd2-d4', 'd7-d5', 'e4-e5'],  n: "French: Advance" },
  { m: ['e2-e4', 'e7-e6', 'd2-d4', 'd7-d5', 'b1-c3'],  n: "French: Classical" },
  { m: ['d2-d4', 'd7-d5', 'c2-c4'],                    n: "Queen's Gambit" },
  { m: ['d2-d4', 'd7-d5', 'c2-c4', 'e7-e6'],           n: "QGD" },
  { m: ['d2-d4', 'd7-d5', 'c2-c4', 'c7-c6'],           n: "Slav Defence" },
  { m: ['d2-d4', 'd7-d5', 'c2-c4', 'd5-c4'],           n: "QGA" },
  { m: ['d2-d4', 'g8-f6', 'c2-c4'],                    n: "Indian Defence" },
  { m: ['d2-d4', 'g8-f6', 'c2-c4', 'g7-g6'],           n: "King's Indian" },
  { m: ['d2-d4', 'g8-f6', 'c2-c4', 'e7-e6', 'b1-c3', 'f8-b4'], n: "Nimzo-Indian" },
  { m: ['d2-d4', 'g8-f6', 'c2-c4', 'e7-e6', 'g1-f3', 'b7-b6'], n: "Queen's Indian" },
  { m: ['d2-d4', 'g8-f6', 'c2-c4', 'c7-c5'],           n: "Benoni Defence" },
  { m: ['d2-d4', 'f7-f5'],                              n: "Dutch Defence" },
];

/**
 * Get opening name from verbose move history
 * @param {Array} moveHistory - array of { from, to } objects (san-based from chess.js history)
 * @returns {string} opening name or empty string
 */
export function getOpeningName(moveHistory) {
  if (!moveHistory || !moveHistory.length) return '';

  // Convert move history to "e2-e4" format
  const movesStr = moveHistory.map(m => {
    const fromFile = String.fromCharCode('a'.charCodeAt(0) + m.from.col);
    const fromRank = String(8 - m.from.row);
    const toFile   = String.fromCharCode('a'.charCodeAt(0) + m.to.col);
    const toRank   = String(8 - m.to.row);
    return `${fromFile}${fromRank}-${toFile}${toRank}`;
  });

  let bestName = '';
  let bestLen  = 0;

  for (const op of OPENINGS) {
    if (op.m.length > bestLen && op.m.every((mv, i) => movesStr[i] === mv)) {
      bestName = op.n;
      bestLen  = op.m.length;
    }
  }

  return bestName;
}
