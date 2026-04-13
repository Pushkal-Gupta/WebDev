/**
 * Engine-based Coach — provides progressive hints and position explanations
 * using Stockfish evaluations + pattern-based templates.
 * No LLM/API key needed.
 */

import { Chess } from 'chess.js';

// ── Position Analysis Templates ──────────────────────────────────────────────

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_NAMES = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

/**
 * Analyze material balance.
 */
export function analyzeMaterial(fen) {
  const chess = new Chess(fen);
  const board = chess.board();
  let white = 0, black = 0;
  const whitePieces = [], blackPieces = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (!sq) continue;
      const val = PIECE_VALUES[sq.type];
      if (sq.color === 'w') { white += val; whitePieces.push(sq.type); }
      else { black += val; blackPieces.push(sq.type); }
    }
  }

  const diff = white - black;
  return { white, black, diff, whitePieces, blackPieces };
}

/**
 * Check for basic tactical patterns.
 */
export function findPatterns(fen) {
  const chess = new Chess(fen);
  const patterns = [];
  const turn = chess.turn();
  const moves = chess.moves({ verbose: true });

  // Check for captures available
  const captures = moves.filter(m => m.captured);
  if (captures.length > 0) {
    const bestCapture = captures.sort((a, b) =>
      PIECE_VALUES[b.captured] - PIECE_VALUES[a.captured]
    )[0];
    patterns.push({
      type: 'capture',
      priority: PIECE_VALUES[bestCapture.captured],
      text: `${turn === 'w' ? 'White' : 'Black'} can capture the ${PIECE_NAMES[bestCapture.captured]} on ${bestCapture.to}.`,
    });
  }

  // Check for checks available
  const checks = moves.filter(m => m.san.includes('+'));
  if (checks.length > 0) {
    patterns.push({
      type: 'check',
      priority: 5,
      text: `There is a check available with ${checks[0].san}.`,
    });
  }

  // Check if in check
  if (chess.inCheck()) {
    patterns.push({
      type: 'in_check',
      priority: 10,
      text: `${turn === 'w' ? 'White' : 'Black'} is in check and must respond.`,
    });
  }

  // Check for mate threats
  const mates = moves.filter(m => m.san.includes('#'));
  if (mates.length > 0) {
    patterns.push({
      type: 'mate',
      priority: 20,
      text: `Checkmate is available!`,
    });
  }

  // Castling available
  const castles = moves.filter(m => m.san.startsWith('O'));
  if (castles.length > 0) {
    const castled = chess.history().some(m => m.startsWith('O'));
    if (!castled) {
      patterns.push({
        type: 'castle',
        priority: 2,
        text: `Castling is available. Consider castling to improve king safety.`,
      });
    }
  }

  return patterns.sort((a, b) => b.priority - a.priority);
}

/**
 * Analyze pawn structure.
 */
export function analyzePawnStructure(fen) {
  const chess = new Chess(fen);
  const board = chess.board();
  const insights = [];

  const whitePawnFiles = [], blackPawnFiles = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (!sq || sq.type !== 'p') continue;
      if (sq.color === 'w') whitePawnFiles.push(c);
      else blackPawnFiles.push(c);
    }
  }

  // Doubled pawns
  const wDoubled = whitePawnFiles.filter((f, _, arr) => arr.filter(x => x === f).length > 1);
  const bDoubled = blackPawnFiles.filter((f, _, arr) => arr.filter(x => x === f).length > 1);
  if (wDoubled.length > 0) insights.push('White has doubled pawns.');
  if (bDoubled.length > 0) insights.push('Black has doubled pawns.');

  // Isolated pawns
  const wIsolated = whitePawnFiles.filter(f => !whitePawnFiles.includes(f - 1) && !whitePawnFiles.includes(f + 1));
  const bIsolated = blackPawnFiles.filter(f => !blackPawnFiles.includes(f - 1) && !blackPawnFiles.includes(f + 1));
  if (wIsolated.length > 0) insights.push(`White has ${wIsolated.length} isolated pawn(s).`);
  if (bIsolated.length > 0) insights.push(`Black has ${bIsolated.length} isolated pawn(s).`);

  // Passed pawns (simplified)
  for (const wf of whitePawnFiles) {
    const blocked = blackPawnFiles.some(bf => Math.abs(bf - wf) <= 1);
    if (!blocked) insights.push(`White has a passed pawn on the ${String.fromCharCode(97 + wf)}-file.`);
  }
  for (const bf of blackPawnFiles) {
    const blocked = whitePawnFiles.some(wf => Math.abs(wf - bf) <= 1);
    if (!blocked) insights.push(`Black has a passed pawn on the ${String.fromCharCode(97 + bf)}-file.`);
  }

  return insights;
}

/**
 * Generate a position overview.
 */
export function getPositionOverview(fen) {
  const material = analyzeMaterial(fen);
  const patterns = findPatterns(fen);
  const pawnInsights = analyzePawnStructure(fen);
  const chess = new Chess(fen);
  const turn = chess.turn() === 'w' ? 'White' : 'Black';

  const sections = [];

  // Turn
  sections.push({ title: 'To Move', text: `${turn} to play.` });

  // Material
  if (material.diff > 0) {
    sections.push({ title: 'Material', text: `White is up ${material.diff} point(s) of material.` });
  } else if (material.diff < 0) {
    sections.push({ title: 'Material', text: `Black is up ${Math.abs(material.diff)} point(s) of material.` });
  } else {
    sections.push({ title: 'Material', text: 'Material is equal.' });
  }

  // Tactical patterns
  if (patterns.length > 0) {
    sections.push({ title: 'Tactics', text: patterns.slice(0, 3).map(p => p.text).join(' ') });
  }

  // Pawn structure
  if (pawnInsights.length > 0) {
    sections.push({ title: 'Pawns', text: pawnInsights.slice(0, 2).join(' ') });
  }

  // Move count / game phase
  const moveCount = chess.moveNumber();
  const totalPieces = material.whitePieces.length + material.blackPieces.length;
  let phase = 'Opening';
  if (moveCount > 15 || totalPieces < 28) phase = 'Middlegame';
  if (totalPieces <= 12) phase = 'Endgame';
  sections.push({ title: 'Phase', text: `${phase} (move ${moveCount}).` });

  return sections;
}

/**
 * Generate progressive hints for the best move.
 * Level 0: general idea
 * Level 1: which piece to move
 * Level 2: the piece + direction
 * Level 3: exact move
 */
export function getProgressiveHint(fen, bestMoveSan, bestMoveUci, level = 0) {
  if (!bestMoveSan || !bestMoveUci) return 'Analyze the position to get a hint.';

  const chess = new Chess(fen);
  const fromSq = bestMoveUci.slice(0, 2);
  const toSq = bestMoveUci.slice(2, 4);
  const piece = chess.get(fromSq);
  const pieceName = piece ? PIECE_NAMES[piece.type] : 'piece';
  const isCapture = bestMoveSan.includes('x');
  const isCheck = bestMoveSan.includes('+');
  const isCastle = bestMoveSan.startsWith('O');

  switch (level) {
    case 0: {
      // General idea
      if (isCastle) return 'Consider improving your king safety.';
      if (isCapture && isCheck) return 'There is a forcing move that wins material.';
      if (isCheck) return 'Look for a way to give check.';
      if (isCapture) return 'There is a capture available that improves your position.';
      const patterns = findPatterns(fen);
      if (patterns.length > 0) return patterns[0].text;
      return 'Look for the most active move in this position.';
    }
    case 1: {
      // Which piece
      if (isCastle) return 'The best move involves your king (castling).';
      return `Focus on your ${pieceName} on ${fromSq}.`;
    }
    case 2: {
      // Piece + direction
      if (isCastle) return `Castle ${bestMoveSan === 'O-O' ? 'kingside' : 'queenside'}.`;
      const fileDir = toSq.charCodeAt(0) > fromSq.charCodeAt(0) ? 'right' : toSq.charCodeAt(0) < fromSq.charCodeAt(0) ? 'left' : '';
      const rankDir = parseInt(toSq[1]) > parseInt(fromSq[1]) ? 'forward' : parseInt(toSq[1]) < parseInt(fromSq[1]) ? 'back' : '';
      const dir = [rankDir, fileDir].filter(Boolean).join(' and to the ') || 'to its optimal square';
      return `Move your ${pieceName} from ${fromSq} ${dir}.`;
    }
    case 3: {
      // Exact move
      return `The best move is ${bestMoveSan}.`;
    }
    default:
      return `The best move is ${bestMoveSan}.`;
  }
}

/**
 * Explain why a move is good or bad given eval difference.
 */
export function explainEvalChange(evalBefore, evalAfter, moveSan, fen) {
  const diff = evalAfter - evalBefore;
  const chess = new Chess(fen);
  const turn = chess.turn() === 'w' ? 'Black' : 'White'; // player who just moved

  if (Math.abs(diff) < 15) {
    return `${moveSan} maintains the balance. A solid move.`;
  }

  // Good move (from the mover's perspective)
  const moverDiff = turn === 'White' ? diff : -diff;
  if (moverDiff > 200) {
    return `${moveSan} is a critical move that gives a decisive advantage.`;
  }
  if (moverDiff > 80) {
    return `${moveSan} is an excellent move that significantly improves the position.`;
  }
  if (moverDiff > 30) {
    return `${moveSan} is a good move that gains a small edge.`;
  }
  if (moverDiff < -200) {
    return `${moveSan} is a serious mistake. It gives the opponent a decisive advantage.`;
  }
  if (moverDiff < -80) {
    return `${moveSan} is a mistake. The position worsens significantly.`;
  }
  if (moverDiff < -30) {
    return `${moveSan} is slightly inaccurate. A better option was available.`;
  }

  return `${moveSan} is a reasonable move in this position.`;
}
