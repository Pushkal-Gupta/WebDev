/**
 * Proactive teaching commentary for Play-with-Coach mode.
 * Template-driven; no LLM. Uses coachActions.REVIEW_LAST for eval-aware
 * judgment on the last move and falls back to move-shape heuristics
 * (check / capture / opening / quiet) when the engine has little to say.
 */

import { Chess } from 'chess.js';
import { runIntent, INTENTS } from './coachActions';

function pick(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function greeting(coach) {
  return pick(coach.greetings) || 'Let’s play!';
}

/**
 * Produce a line after a move has been played.
 * @param {object} args
 * @param {object} args.coach           coach persona from data/coaches.js
 * @param {array}  args.moveHistory     gameStore moveHistory
 * @param {string} args.fen             current FEN
 * @param {string} [args.openingName]   detected opening name, if any
 * @param {'user'|'coach'} args.side    which side just moved
 * @returns {Promise<string|null>}
 */
export async function commentOnMoveCoach({ coach, moveHistory, fen, openingName, side }) {
  if (!coach || !moveHistory || moveHistory.length === 0) return null;
  const last = moveHistory[moveHistory.length - 1];
  const san = last?.san || '';

  // Opening phase callout on the first few plies (either side).
  if (moveHistory.length <= 2 && openingName) {
    return `${openingName}. ${pick(coach.openingLines)}`;
  }

  // Try engine-driven judgment on the user's move only — we don't critique the coach's own moves.
  if (side === 'user') {
    try {
      const msg = await Promise.race([
        runIntent(INTENTS.REVIEW_LAST, { fen, moveHistory }),
        new Promise((resolve) => setTimeout(() => resolve(null), 2500)),
      ]);
      if (msg?.text) {
        // Re-flavor obvious blunder/brilliant so it sounds like the coach, not the bot.
        const flat = msg.text.toLowerCase();
        if (flat.includes('blunder') || flat.includes('mistake')) {
          return pick(coach.blunderLines) || msg.text;
        }
        if (flat.includes('brilliant') || flat.includes('excellent')) {
          return pick(coach.brilliantLines) || msg.text;
        }
        // Strip markdown so we can inline into a speech bubble cleanly.
        return msg.text.replace(/\*\*/g, '').replace(/_/g, '');
      }
    } catch {
      // fall through to heuristic
    }
  }

  // Heuristic fallback / coach-side color commentary.
  if (san.includes('#')) {
    return side === 'user' ? 'Checkmate! Well played.' : 'Checkmate. Review the final sequence.';
  }
  if (san.includes('+')) return pick(coach.checkLines);
  if (san.includes('x')) return pick(coach.captureLines);

  try {
    const chess = new Chess(fen);
    if (chess.inCheck()) return 'Be careful — your king is under fire.';
  } catch { /* ignore */ }

  // Occasional quiet-move encouragement (keep it sparse).
  if (Math.random() < 0.45) return pick(coach.quietLines);
  return null;
}

export function coachGreeting(coach) {
  return greeting(coach);
}

export function closingLine(coach, result) {
  if (!coach || !result) return null;
  if (result === 'win')  return coach.closingWin;
  if (result === 'loss') return coach.closingLoss;
  return coach.closingDraw;
}
