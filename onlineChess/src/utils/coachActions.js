/**
 * Coach intent handlers. Each handler receives { fen, moveHistory, pgn } and
 * returns a message object { role, kind, text, meta } to push into coachStore.
 *
 * No LLM — just composes the rule-based coachEngine, Stockfish, Lichess
 * opening explorer, and Syzygy tablebase.
 */

import { Chess } from 'chess.js';
import {
  getPositionOverview,
  getProgressiveHint,
  findPatterns,
  explainEvalChange,
} from './coachEngine';
import { getBestMove } from './stockfish';
import { getLocalBestMove } from './localAI';
import { fetchExplorerData } from './openingExplorer';
import { fetchTablebase, countPieces } from './tablebaseService';

function describeCategory(category, turnColor) {
  const mover = turnColor === 'w' ? 'White' : 'Black';
  switch (category) {
    case 'win':  return `${mover} is winning (tablebase).`;
    case 'loss': return `${mover} is losing (tablebase).`;
    case 'draw': return 'Theoretical draw (tablebase).';
    default:     return 'Tablebase result unknown for this position.';
  }
}

async function resolveBestMove(fen) {
  let uci;
  try {
    uci = await getBestMove(fen, { strength: 9 });
  } catch {
    uci = getLocalBestMove(fen, 6);
  }
  if (!uci || uci === '(none)') return null;
  const chess = new Chess(fen);
  const result = chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4],
  });
  return result ? { san: result.san, uci } : null;
}

// Rough eval via Stockfish (movetime 300). Returns centipawns from white's perspective.
async function quickEval(fen) {
  try {
    // stockfishEngine currently returns a move, not an eval. Fall back to
    // material-only when eval isn't easily available.
    const chess = new Chess(fen);
    let white = 0, black = 0;
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    for (const row of chess.board()) {
      for (const sq of row) {
        if (!sq) continue;
        if (sq.color === 'w') white += values[sq.type];
        else black += values[sq.type];
      }
    }
    return (white - black) * 100;
  } catch {
    return 0;
  }
}

export const INTENTS = {
  BEST_MOVE: 'best-move',
  EXPLAIN: 'explain',
  THREATS: 'threats',
  OPENING: 'opening',
  ENDGAME: 'endgame',
  REVIEW_LAST: 'review-last',
};

export async function runIntent(intent, ctx) {
  switch (intent) {
    case INTENTS.BEST_MOVE: return bestMoveIntent(ctx);
    case INTENTS.EXPLAIN:   return explainIntent(ctx);
    case INTENTS.THREATS:   return threatsIntent(ctx);
    case INTENTS.OPENING:   return openingIntent(ctx);
    case INTENTS.ENDGAME:   return endgameIntent(ctx);
    case INTENTS.REVIEW_LAST: return reviewLastIntent(ctx);
    default: return { role: 'coach', kind: 'text', text: 'I did not understand that request.' };
  }
}

async function bestMoveIntent({ fen }) {
  if (!fen) return { role: 'coach', kind: 'text', text: 'No position loaded.' };
  const best = await resolveBestMove(fen);
  if (!best) return { role: 'coach', kind: 'text', text: 'Could not compute a best move here.' };
  const idea = getProgressiveHint(fen, best.san, best.uci, 0);
  return {
    role: 'coach',
    kind: 'best-move',
    text: `The engine likes **${best.san}**. ${idea}`,
    meta: { san: best.san, uci: best.uci },
    fen,
  };
}

function explainIntent({ fen }) {
  if (!fen) return { role: 'coach', kind: 'text', text: 'No position loaded.' };
  const sections = getPositionOverview(fen);
  return {
    role: 'coach',
    kind: 'overview',
    text: sections.map(s => `**${s.title}:** ${s.text}`).join('\n'),
    meta: { sections },
    fen,
  };
}

function threatsIntent({ fen }) {
  if (!fen) return { role: 'coach', kind: 'text', text: 'No position loaded.' };
  const chess = new Chess(fen);
  // Look at threats FOR the side not to move by swapping turn.
  const parts = fen.split(' ');
  parts[1] = parts[1] === 'w' ? 'b' : 'w';
  // A direct turn-swap may create an illegal FEN (e.g. side-to-move in check
  // on their own move). Try it; if chess.js rejects, fall back to own-side patterns.
  let oppPatterns = [];
  try {
    const swapped = parts.join(' ');
    new Chess(swapped); // validate
    oppPatterns = findPatterns(swapped);
  } catch {
    oppPatterns = [];
  }
  const ownPatterns = findPatterns(fen);

  const lines = [];
  if (oppPatterns.length) {
    lines.push(`**Opponent threats:** ${oppPatterns.slice(0, 3).map(p => p.text).join(' ')}`);
  }
  if (ownPatterns.length) {
    lines.push(`**Your chances:** ${ownPatterns.slice(0, 3).map(p => p.text).join(' ')}`);
  }
  if (chess.inCheck()) lines.unshift('You are **in check** — deal with it first.');
  if (!lines.length) lines.push('No immediate tactics detected. Focus on piece activity and king safety.');

  return { role: 'coach', kind: 'threats', text: lines.join('\n'), fen };
}

async function openingIntent({ fen }) {
  if (!fen) return { role: 'coach', kind: 'text', text: 'No position loaded.' };
  const data = await fetchExplorerData(fen, 'lichess');
  if (!data) {
    return { role: 'coach', kind: 'text', text: 'No opening data available for this position.', fen };
  }
  const total = (data.white || 0) + (data.draws || 0) + (data.black || 0);
  const header = data.opening
    ? `**${data.opening}**${data.eco ? ` (${data.eco})` : ''}`
    : 'Out of book.';
  const moveLines = (data.moves || []).slice(0, 3).map((m) => {
    const mTotal = m.white + m.draws + m.black;
    const pct = mTotal > 0 ? Math.round((m.white * 100) / mTotal) : 0;
    return `• ${m.san} — ${mTotal.toLocaleString()} games, ${pct}% White score`;
  });
  const body = moveLines.length ? moveLines.join('\n') : 'No popular continuations found.';
  const sample = total > 0 ? `\n_${total.toLocaleString()} master+amateur games._` : '';
  return {
    role: 'coach',
    kind: 'opening',
    text: `${header}\n${body}${sample}`,
    meta: { data },
    fen,
  };
}

async function endgameIntent({ fen }) {
  if (!fen) return { role: 'coach', kind: 'text', text: 'No position loaded.' };
  const chess = new Chess(fen);
  const pieceCount = countPieces(fen);
  if (pieceCount > 7) {
    return {
      role: 'coach',
      kind: 'text',
      text: `Too many pieces for the tablebase (${pieceCount}; max 7). Simplify first or ask for **Explain position** instead.`,
      fen,
    };
  }
  const data = await fetchTablebase(fen);
  if (!data) {
    return { role: 'coach', kind: 'text', text: 'Could not reach the tablebase right now.', fen };
  }
  const head = describeCategory(data.category, chess.turn());
  const dtzStr = data.dtz != null ? ` DTZ ${data.dtz}.` : '';
  const topMoves = (data.moves || []).slice(0, 3)
    .map((m) => `• ${m.san} — ${m.category}${m.dtz != null ? `, DTZ ${m.dtz}` : ''}`)
    .join('\n');
  const tail = topMoves ? `\n**Best continuations:**\n${topMoves}` : '';
  return { role: 'coach', kind: 'endgame', text: `${head}${dtzStr}${tail}`, meta: { data }, fen };
}

async function reviewLastIntent({ fen, moveHistory }) {
  if (!moveHistory || moveHistory.length === 0) {
    return { role: 'coach', kind: 'text', text: 'No moves to review yet.' };
  }
  const last = moveHistory[moveHistory.length - 1];
  const prevFen = moveHistory.length > 1
    ? moveHistory[moveHistory.length - 2].fen
    : new Chess().fen();
  const afterFen = last.fen || fen;

  const [evalBefore, evalAfter, bestPrev] = await Promise.all([
    quickEval(prevFen),
    quickEval(afterFen),
    resolveBestMove(prevFen),
  ]);

  const body = explainEvalChange(evalBefore, evalAfter, last.san, afterFen);
  const alt = bestPrev && bestPrev.san !== last.san
    ? `\n_Engine preferred **${bestPrev.san}**._`
    : '';
  return {
    role: 'coach',
    kind: 'review',
    text: `${body}${alt}`,
    meta: { move: last.san, bestPrev: bestPrev?.san || null },
    fen: afterFen,
  };
}
