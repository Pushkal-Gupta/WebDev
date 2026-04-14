/**
 * In-character bot chatter for Computer mode. Flavor-only — NEVER reveals
 * engine lines or best moves, so it cannot be used to cheat.
 *
 * Input: { personality, gameState } where
 *   personality: bot object from src/data/bots.js
 *   gameState:   { lastMove, chess, moveCount, phase, materialDiff, playerColor, evalDelta }
 * Output: a single in-character line (string) or null if nothing fits.
 */

import { Chess } from 'chess.js';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

// Persona flavor bank keyed by bot id. Falls back to strength-tier templates.
const LINES = {
  snaily: {
    openingMove: ['Slooow and steady…', 'No rush.', 'Let me think about this for an hour.'],
    playerBlunder: ['Oh, something slipped?', 'Even I noticed that.'],
    playerBrilliant: ['Wow, that was quick!', 'How did you see that?!'],
    myCheck: ['I gave a check! I think.', 'Did I just check the king?'],
    myCapture: ['Oops, I grabbed one.', 'That piece was in my way.'],
    inCheck: ['Uh oh, they’re attacking me!', 'Help!'],
    lowMaterial: ['There’s barely anything left!', 'Where did everyone go?'],
  },
  patzer: {
    openingMove: ['What does this piece do again?', 'I’ll just push a pawn.'],
    playerBlunder: ['Wait, you MEANT to do that?', 'Free piece! I think?'],
    playerBrilliant: ['How did you do that?!', 'That’s legal??'],
    myCheck: ['CHECK! I said it!', 'Am I winning now?'],
    myCapture: ['Nom.', 'Mine now!'],
    inCheck: ['My king! Do something!', 'Is this bad?'],
    lowMaterial: ['Endgame scary.', 'Where do my pieces go?'],
  },
  whiskers: {
    openingMove: ['Purr. Let’s play.', 'I’ll pounce when you least expect it.'],
    playerBlunder: ['Mrow! Snack time!', 'You dropped this.'],
    playerBrilliant: ['Hiss! Nicely done.', 'Curiosity killed my plan.'],
    myCheck: ['Pounce!', 'Got your king in my claws.'],
    myCapture: ['Caught one.', 'Tasty.'],
    inCheck: ['Hssss!', 'Backed into a corner.'],
    lowMaterial: ['Not much left to play with.', 'Time to sharpen my claws.'],
  },
  sage: {
    openingMove: ['Let us begin with principles.', 'A sound setup first.'],
    playerBlunder: ['Careful — every tempo matters.', 'A small slip can snowball.'],
    playerBrilliant: ['Elegantly played.', 'A fine stroke.'],
    myCheck: ['A reminder for your king.', 'Attend to this check.'],
    myCapture: ['A minor material gain.', 'Material counts.'],
    inCheck: ['A timely threat.', 'I must respond.'],
    lowMaterial: ['Precision wins endgames.', 'Technique from here on.'],
  },
  stockfish: {
    openingMove: ['Evaluation initialized.', 'Depth engaged.'],
    playerBlunder: ['Centipawn loss: significant.', 'Principal variation diverges.'],
    playerBrilliant: ['Unexpected resource detected.', 'Recalculating evaluation.'],
    myCheck: ['Forcing sequence.', 'Check registered.'],
    myCapture: ['Material acquired.', 'Evaluation shift: +1 unit.'],
    inCheck: ['Defensive resources sufficient.', 'No tactical loss detected.'],
    lowMaterial: ['Endgame tablebase regime.', 'Reduced piece count.'],
  },
  omega: {
    openingMove: ['The calculation begins.', 'Every line leads somewhere.'],
    playerBlunder: ['A flicker of humanity.', 'I saw that coming.'],
    playerBrilliant: ['A rare move.', 'You surprise me.'],
    myCheck: ['Inevitable.', 'The king is pressured.'],
    myCapture: ['A piece falls.', 'Expected.'],
    inCheck: ['Noted.', 'Resolved.'],
    lowMaterial: ['The infinite narrows.', 'Endgame precision.'],
  },
};

// Generic tier fallback (used when no persona bank exists for the bot).
function tierLines(rating) {
  if (rating <= 400) {
    return {
      openingMove: ['Let’s see what happens!', 'Ooh, pieces!'],
      playerBlunder: ['Oh, a present?', 'Did you mean that?'],
      playerBrilliant: ['Whoa!', 'How’d you do that?'],
      myCheck: ['Check!', 'Got your king!'],
      myCapture: ['Gotcha!', 'Taken.'],
      inCheck: ['Yikes!', 'Not good for me.'],
      lowMaterial: ['Not much left.', 'Endgame time.'],
    };
  }
  if (rating <= 1200) {
    return {
      openingMove: ['Standard opening.', 'Develop first.'],
      playerBlunder: ['A small inaccuracy.', 'I’ll take the opportunity.'],
      playerBrilliant: ['Nice idea.', 'Good move.'],
      myCheck: ['Check!', 'Mind the king.'],
      myCapture: ['Material gain.', 'Piece captured.'],
      inCheck: ['I must defend.', 'Handling the check.'],
      lowMaterial: ['Fewer pieces now.', 'Endgame mode.'],
    };
  }
  if (rating <= 2000) {
    return {
      openingMove: ['Known theory.', 'Classical setup.'],
      playerBlunder: ['An inaccuracy.', 'The evaluation tilts.'],
      playerBrilliant: ['Sharp!', 'Strong move.'],
      myCheck: ['Check — careful.', 'Tactical pressure.'],
      myCapture: ['A tempo and a piece.', 'Material is mine.'],
      inCheck: ['Defending actively.', 'Addressing the threat.'],
      lowMaterial: ['Pure technique now.', 'Endgame precision.'],
    };
  }
  return {
    openingMove: ['Theory.', 'Preparation pays.'],
    playerBlunder: ['Significant drop in evaluation.', 'A concrete mistake.'],
    playerBrilliant: ['A computer move.', 'Well calculated.'],
    myCheck: ['Forcing.', 'Check.'],
    myCapture: ['Material decides.', 'Captured.'],
    inCheck: ['Solid defence.', 'Resolved.'],
    lowMaterial: ['Endgame technique.', 'Precision to the finish.'],
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function materialDiff(fen) {
  const chess = new Chess(fen);
  let w = 0, b = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq) continue;
      if (sq.color === 'w') w += PIECE_VALUES[sq.type];
      else b += PIECE_VALUES[sq.type];
    }
  }
  return { w, b, diff: w - b, total: w + b };
}

/**
 * Produce a comment after a move has been played.
 * @param {object} personality — a bot object from data/bots.js
 * @param {object} ctx
 * @param {object} ctx.lastMove — last entry from moveHistory (has san, color, fen)
 * @param {'white'|'black'} ctx.botColor
 * @param {number} ctx.moveCount
 * @returns {string|null}
 */
export function commentOnMove(personality, ctx) {
  if (!personality || !ctx?.lastMove) return null;
  const bank = LINES[personality.id] || tierLines(personality.rating || 1000);
  const { lastMove, botColor, moveCount } = ctx;

  const botColorCode = botColor === 'white' ? 'w' : 'b';
  const lastWasBot = lastMove.color === botColorCode;
  const san = lastMove.san || '';
  const chess = new Chess(lastMove.fen);

  // After a BOT move
  if (lastWasBot) {
    if (san.includes('#')) return `${personality.name}: ${pick(['Checkmate.', 'That’s the game.'])}`;
    if (san.includes('+')) return `${personality.name}: ${pick(bank.myCheck)}`;
    if (san.includes('x')) return `${personality.name}: ${pick(bank.myCapture)}`;
    if (moveCount <= 2) return `${personality.name}: ${pick(bank.openingMove)}`;
    // occasional filler on own move — keep it rare to avoid spam
    if (Math.random() < 0.18) {
      const mat = materialDiff(lastMove.fen);
      if (mat.total <= 20) return `${personality.name}: ${pick(bank.lowMaterial)}`;
    }
    return null;
  }

  // After a PLAYER move
  if (san.includes('#')) return `${personality.name}: ${pick(['Well played.', 'Good game.'])}`;
  if (chess.inCheck()) return `${personality.name}: ${pick(bank.inCheck)}`;
  // cue from evalDelta if present (centipawn change from bot's perspective)
  if (typeof ctx.evalDelta === 'number') {
    if (ctx.evalDelta >= 150)  return `${personality.name}: ${pick(bank.playerBlunder)}`;
    if (ctx.evalDelta <= -120) return `${personality.name}: ${pick(bank.playerBrilliant)}`;
  }
  // fallback: light filler on player captures
  if (san.includes('x') && Math.random() < 0.25) {
    return `${personality.name}: ${pick(['Fair trade.', 'I’ll manage.', 'Noted.'])}`;
  }
  return null;
}

/**
 * Line for game start — when the bot has been chosen and the game begins.
 */
export function greetingLine(personality, { playerColor } = {}) {
  if (!personality) return null;
  const templates = {
    low:    [`${personality.name}: Hi! Let’s play!`, `${personality.name}: Good luck!`],
    mid:    [`${personality.name}: ${personality.tagline || 'Let us begin.'}`, `${personality.name}: Show me what you have.`],
    high:   [`${personality.name}: Initialising.`, `${personality.name}: Evaluation: even. Begin.`],
  };
  const rating = personality.rating || 1000;
  const bank = rating <= 800 ? templates.low : rating <= 2000 ? templates.mid : templates.high;
  return pick(bank);
}
