/**
 * In-character bot chatter for Computer mode. Flavor-only — NEVER reveals
 * engine lines or best moves, so it cannot be used to cheat.
 *
 * Design notes:
 *   • Line banks are large so repeats are rare within a session.
 *   • A module-scoped ring buffer remembers the last few lines spoken and
 *     avoids repeating them — kills the "saying the same thing again" feel.
 *   • Context slots (piece name, square, phase, move number) are interpolated
 *     into templates so most lines end up unique without an LLM.
 *
 * Input: { personality, gameState } where
 *   personality: bot object from src/data/bots.js
 *   gameState:   { lastMove, chess, moveCount, phase, materialDiff, evalDelta }
 * Output: a single in-character line (string) or null if nothing fits.
 */

import { Chess } from 'chess.js';

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_NAMES  = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };

// ── Don't-repeat buffer ─────────────────────────────────────────────────────
const RECENT_CAP = 8;
const recent = [];

function remember(line) {
  if (!line) return;
  recent.push(line);
  if (recent.length > RECENT_CAP) recent.shift();
}

function pickFresh(arr) {
  if (!arr || arr.length === 0) return null;
  // Exclude recent picks; if all are recent, fall back to the full pool.
  const fresh = arr.filter((l) => !recent.includes(l));
  const pool = fresh.length ? fresh : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Persona line banks ──────────────────────────────────────────────────────
// Each bank is event → string[]. Strings may contain {piece}, {san}, {sq},
// {phase}, {count} placeholders that `fill()` resolves from the move context.
const LINES = {
  snaily: {
    openingMove: [
      'Slooow and steady…', 'No rush.', 'Let me think about this for an hour.',
      'Inching forward.', 'Glacial pace, just how I like it.',
      'A cautious {piece} move.', 'Drifting to {sq}. Slowly.',
      'Every move is a journey.', 'I considered the universe first.',
    ],
    playerBlunder: [
      'Oh, something slipped?', 'Even I noticed that.',
      'Did that {piece} mean to be there?', 'A gift, slowly accepted.',
      'You gave me time to think.', 'Was that on purpose?',
      'Snail senses tingling.', 'Lucky me. Or unlucky you.',
    ],
    playerBrilliant: [
      'Wow, that was quick!', 'How did you see that?!',
      'Sharp. Sharper than me.', 'That was… fast.',
      'I need a year to calculate that.', 'A flash of genius, was it?',
    ],
    myCheck: [
      'I gave a check! I think.', 'Did I just check the king?',
      'Surprise check!', 'Slow and steady — check.',
      'Oh look, I put you in check.', 'Check. Eventually.',
    ],
    myCapture: [
      'Oops, I grabbed one.', 'That {piece} was in my way.',
      'It rolled into my shell.', 'A quiet little capture.',
      'Taking the {piece} on {sq}.', 'Didn’t mean to. Or did I?',
    ],
    inCheck: [
      'Uh oh, they’re attacking me!', 'Help!',
      'My king is panicking.', 'This is uncomfortable.',
      'I’ll crawl out of this somehow.', 'Not ideal.',
    ],
    lowMaterial: [
      'There’s barely anything left!', 'Where did everyone go?',
      'A quiet endgame.', 'Just a few pieces. Cozy.',
    ],
    quiet: [
      'Still thinking.', 'Patient move.', 'Drifting a {piece}.',
      'Just a touch.', 'Let me settle in.', 'Tiny adjustment.',
      'Slow and steady.', 'I can wait forever.',
    ],
  },

  patzer: {
    openingMove: [
      'What does this piece do again?', 'I’ll just push a pawn.',
      'Feels right. Probably.', 'I saw someone do this once.',
      'Moving stuff. Important stuff?', 'Is this good? I have no idea.',
    ],
    playerBlunder: [
      'Wait, you MEANT to do that?', 'Free piece! I think?',
      'Ooh, shiny {piece}.', 'Is that mine now?',
      'You dropped this {piece}. I’ll hold it.',
    ],
    playerBrilliant: [
      'How did you do that?!', 'That’s legal??',
      'Wait, that’s allowed?', 'Teach me??', 'Broken. The game is broken.',
    ],
    myCheck: [
      'CHECK! I said it!', 'Am I winning now?',
      'Didn’t mean to but CHECK.', 'Mom, look, check!',
    ],
    myCapture: [
      'Nom.', 'Mine now!', 'Got a {piece}!',
      'That one looked tasty.', 'Grabbed the {piece} on {sq}!',
    ],
    inCheck: [
      'My king! Do something!', 'Is this bad?',
      'Uhhh what do I do.', 'Which piece defends again?',
    ],
    lowMaterial: [
      'Endgame scary.', 'Where do my pieces go?',
      'Is this the last round?',
    ],
    quiet: [
      'Pushing stuff.', 'This looks okay.',
      'Yoink, a {piece} moves.', 'Feeling confident. No reason.',
      'Random but vibes.', 'Beep boop move.',
    ],
  },

  whiskers: {
    openingMove: [
      'Purr. Let’s play.', 'I’ll pounce when you least expect it.',
      'Stretching my claws.', 'Eyes on you.',
      'A playful opening paw.', 'Sniffing the {sq} square.',
    ],
    playerBlunder: [
      'Mrow! Snack time!', 'You dropped this.',
      'Mmm, a {piece} snack.', 'My tail twitches with glee.',
      'Batting that {piece} around.',
    ],
    playerBrilliant: [
      'Hiss! Nicely done.', 'Curiosity killed my plan.',
      'Furball. You got me.', 'Respect, two-legs.',
    ],
    myCheck: [
      'Pounce!', 'Got your king in my claws.',
      'Hiss-check.', 'Pawb to the king.',
    ],
    myCapture: [
      'Caught one.', 'Tasty.', 'Snatched the {piece}.',
      'My paws found {sq}.',
    ],
    inCheck: [
      'Hssss!', 'Backed into a corner.',
      'Whiskers up! Defending.', 'My fur is bristling.',
    ],
    lowMaterial: [
      'Not much left to play with.', 'Time to sharpen my claws.',
      'Just us cats now.',
    ],
    quiet: [
      'Stalking slowly.', 'Whiskers wiggling.',
      'A soft paw to {sq}.', 'Circling the board.',
      'Patience, little mouse.', 'Tail flick.',
    ],
  },

  sage: {
    openingMove: [
      'Let us begin with principles.', 'A sound setup first.',
      'Balance before sharpness.', 'The {piece} finds its home.',
      'Development, then ambition.', 'Patience is a plan.',
    ],
    playerBlunder: [
      'Careful — every tempo matters.', 'A small slip can snowball.',
      'The {piece} should not have wandered there.',
      'An instructive error.', 'The position punishes haste.',
    ],
    playerBrilliant: [
      'Elegantly played.', 'A fine stroke.',
      'Most instructive.', 'The calculation was sound.',
      'I salute that {piece} maneuver.',
    ],
    myCheck: [
      'A reminder for your king.', 'Attend to this check.',
      'The king feels pressure.', 'A principled check on {sq}.',
    ],
    myCapture: [
      'A minor material gain.', 'Material counts.',
      'Claiming the {piece}.', 'Removing your {piece} from the board.',
    ],
    inCheck: [
      'A timely threat.', 'I must respond.',
      'The {piece} is well-placed against me.', 'A test of my defence.',
    ],
    lowMaterial: [
      'Precision wins endgames.', 'Technique from here on.',
      'Few pieces, many nuances.',
    ],
    quiet: [
      'Reposition, reconsider.', 'A quiet regrouping move.',
      'The {piece} improves its diagonal.',
      'Slow pressure.', 'Moves speak louder than plans.',
    ],
  },

  stockfish: {
    openingMove: [
      'Evaluation initialized.', 'Depth engaged.',
      'Opening book terminated.', 'Move {count} committed.',
      'Position evaluated: acceptable.',
    ],
    playerBlunder: [
      'Centipawn loss: significant.', 'Principal variation diverges.',
      'Suboptimal. Eval shift notable.',
      'Your move drops evaluation.', 'Calculation anomaly detected in opponent.',
    ],
    playerBrilliant: [
      'Unexpected resource detected.', 'Recalculating evaluation.',
      'Horizon anomaly.', 'Move exceeds shallow search.',
    ],
    myCheck: [
      'Forcing sequence.', 'Check registered.',
      'Initiating tactical pressure.', 'Check on {sq}.',
    ],
    myCapture: [
      'Material acquired.', 'Evaluation shift: +1 unit.',
      'Removing {piece} at {sq}.', 'Exchange executed.',
    ],
    inCheck: [
      'Defensive resources sufficient.', 'No tactical loss detected.',
      'Parrying.',
    ],
    lowMaterial: [
      'Endgame tablebase regime.', 'Reduced piece count.',
      'Simplification complete.',
    ],
    quiet: [
      'Executing plan.', 'Position adjusted.',
      'Minor positional increment.', 'Principal variation holds.',
      '{piece} relocated.',
    ],
  },

  omega: {
    openingMove: [
      'The calculation begins.', 'Every line leads somewhere.',
      'I have seen this shape before.', 'A quiet {piece} to {sq}.',
    ],
    playerBlunder: [
      'A flicker of humanity.', 'I saw that coming.',
      'Predictable error.', 'An oversight worth exploiting.',
    ],
    playerBrilliant: [
      'A rare move.', 'You surprise me.',
      'That was outside my model.', 'Respect.',
    ],
    myCheck: [
      'Inevitable.', 'The king is pressured.',
      'A mathematical check.', 'Forcing.',
    ],
    myCapture: [
      'A piece falls.', 'Expected.',
      'Taking the {piece}.', 'Simplification accepted.',
    ],
    inCheck: [
      'Noted.', 'Resolved.', 'A brief perturbation.',
    ],
    lowMaterial: [
      'The infinite narrows.', 'Endgame precision.',
      'Approaching singularity.',
    ],
    quiet: [
      'A planned move.', 'Probabilities hold.',
      'The {piece} glides.', 'All branches lead here.',
    ],
  },
};

// ── Tier fallback (for bots without a custom bank) ──────────────────────────
function tierLines(rating) {
  if (rating <= 400) {
    return {
      openingMove: ['Let’s see what happens!', 'Ooh, pieces!', 'A happy little {piece}.'],
      playerBlunder: ['Oh, a present?', 'Did you mean that?', 'Lucky me!'],
      playerBrilliant: ['Whoa!', 'How’d you do that?', 'That looked cool.'],
      myCheck: ['Check!', 'Got your king!', 'Pow!'],
      myCapture: ['Gotcha!', 'Taken.', 'Eating the {piece}.'],
      inCheck: ['Yikes!', 'Not good for me.', 'Hang on, hang on…'],
      lowMaterial: ['Not much left.', 'Endgame time.'],
      quiet: ['Hmm, maybe.', 'Pushing a {piece}.', 'I like this square.', 'Okay okay okay.'],
    };
  }
  if (rating <= 1200) {
    return {
      openingMove: ['Standard opening.', 'Develop first.', 'The {piece} finds {sq}.'],
      playerBlunder: ['A small inaccuracy.', 'I’ll take the opportunity.', 'That drops material.'],
      playerBrilliant: ['Nice idea.', 'Good move.', 'You saw that.'],
      myCheck: ['Check!', 'Mind the king.', 'Pressure on the king.'],
      myCapture: ['Material gain.', 'Piece captured.', 'The {piece} falls.'],
      inCheck: ['I must defend.', 'Handling the check.', 'Regroup.'],
      lowMaterial: ['Fewer pieces now.', 'Endgame mode.'],
      quiet: ['Improving position.', 'Quiet move.', 'Developing.', 'Rerouting a {piece}.'],
    };
  }
  if (rating <= 2000) {
    return {
      openingMove: ['Known theory.', 'Classical setup.', 'A mainline {piece} move.'],
      playerBlunder: ['An inaccuracy.', 'The evaluation tilts.', 'Misstep.'],
      playerBrilliant: ['Sharp!', 'Strong move.', 'Precise calculation.'],
      myCheck: ['Check — careful.', 'Tactical pressure.', 'Forcing move on {sq}.'],
      myCapture: ['A tempo and a piece.', 'Material is mine.', 'Taking the {piece}.'],
      inCheck: ['Defending actively.', 'Addressing the threat.'],
      lowMaterial: ['Pure technique now.', 'Endgame precision.'],
      quiet: ['Prophylaxis.', 'Improving the worst piece.', 'Quiet build-up.', '{piece} reroutes.'],
    };
  }
  return {
    openingMove: ['Theory.', 'Preparation pays.', 'Book move.'],
    playerBlunder: ['Significant drop in evaluation.', 'A concrete mistake.', 'Tactical oversight.'],
    playerBrilliant: ['A computer move.', 'Well calculated.', 'Engine-like.'],
    myCheck: ['Forcing.', 'Check.', 'Pressure.'],
    myCapture: ['Material decides.', 'Captured.', '{piece} removed.'],
    inCheck: ['Solid defence.', 'Resolved.'],
    lowMaterial: ['Endgame technique.', 'Precision to the finish.'],
    quiet: ['Prophylactic move.', 'Minor improvement.', 'Holding.'],
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
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

function pieceFromSan(san) {
  if (!san) return 'pawn';
  const first = san[0];
  if (first >= 'A' && first <= 'Z' && first !== 'O') {
    return PIECE_NAMES[first.toLowerCase()] || 'piece';
  }
  return 'pawn';
}

function squareFromSan(san) {
  if (!san) return '';
  // Extract last 2 chars that look like a square (e.g. e4, f7).
  const m = san.match(/([a-h][1-8])[+#]?$/);
  return m ? m[1] : '';
}

function phaseFromMaterial(total, moveCount) {
  if (moveCount < 14) return 'opening';
  if (total <= 22) return 'endgame';
  return 'middlegame';
}

function fill(template, slots) {
  if (!template) return null;
  return template
    .replace(/\{piece\}/g, slots.piece || 'piece')
    .replace(/\{san\}/g,   slots.san   || '')
    .replace(/\{sq\}/g,    slots.sq    || '')
    .replace(/\{phase\}/g, slots.phase || 'position')
    .replace(/\{count\}/g, String(slots.count ?? ''));
}

// ── Public API ──────────────────────────────────────────────────────────────
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
  const san   = lastMove.san || '';
  const slots = {
    piece: pieceFromSan(san),
    san,
    sq: squareFromSan(san),
    count: moveCount,
  };
  let chess;
  try { chess = new Chess(lastMove.fen); } catch { chess = new Chess(); }
  const mat = materialDiff(lastMove.fen);
  slots.phase = phaseFromMaterial(mat.total, moveCount);

  const fromPool = (pool) => {
    const tpl = pickFresh(pool);
    if (!tpl) return null;
    const line = `${personality.name}: ${fill(tpl, slots)}`;
    remember(tpl);
    return line;
  };

  // Mate-announcement pool (shared across all bots)
  const MATE_LINES_WIN   = ['Checkmate.', 'That’s the game.', 'The king cannot escape.', 'Endgame: mate.'];
  const MATE_LINES_LOSE  = ['Well played.', 'Good game.', 'You outplayed me.', 'GG.'];

  // After a BOT move
  if (lastWasBot) {
    if (san.includes('#')) return fromPool(MATE_LINES_WIN);
    if (san.includes('+')) return fromPool(bank.myCheck);
    if (san.includes('x')) return fromPool(bank.myCapture);
    if (moveCount <= 2)    return fromPool(bank.openingMove);
    if (mat.total <= 20 && Math.random() < 0.55) return fromPool(bank.lowMaterial);
    if (Math.random() < 0.6) return fromPool(bank.quiet || bank.openingMove);
    return null;
  }

  // After a PLAYER move
  if (san.includes('#')) return fromPool(MATE_LINES_LOSE);
  if (chess.inCheck())   return fromPool(bank.inCheck);
  if (typeof ctx.evalDelta === 'number') {
    if (ctx.evalDelta >= 150)  return fromPool(bank.playerBlunder);
    if (ctx.evalDelta <= -120) return fromPool(bank.playerBrilliant);
  }
  if (san.includes('x') && Math.random() < 0.5) {
    return fromPool(['Fair trade.', 'I’ll manage.', 'Noted.', 'A trade. Fine.', 'Even exchange.', 'Material stays level.']);
  }
  if (Math.random() < 0.55) return fromPool(bank.quiet || bank.openingMove);
  return null;
}

/**
 * Line for game start — when the bot has been chosen and the game begins.
 */
export function greetingLine(personality, { playerColor } = {}) {
  if (!personality) return null;
  const youAre = playerColor === 'black' ? 'Black' : 'White';
  const templates = {
    low: [
      `${personality.name}: Hi! Let’s play!`,
      `${personality.name}: Good luck!`,
      `${personality.name}: You’re ${youAre}. Have fun!`,
      `${personality.name}: Oooh, a game!`,
      `${personality.name}: Show me the moves!`,
    ],
    mid: [
      `${personality.name}: ${personality.tagline || 'Let us begin.'}`,
      `${personality.name}: Show me what you have.`,
      `${personality.name}: You’re ${youAre}. Best of luck.`,
      `${personality.name}: Ready when you are.`,
      `${personality.name}: A good game to you.`,
    ],
    high: [
      `${personality.name}: Initialising.`,
      `${personality.name}: Evaluation: even. Begin.`,
      `${personality.name}: Opponent colour: ${youAre}.`,
      `${personality.name}: Depth engaged. Your move.`,
      `${personality.name}: I am ready.`,
    ],
  };
  const rating = personality.rating || 1000;
  const bank = rating <= 800 ? templates.low : rating <= 2000 ? templates.mid : templates.high;
  const line = pickFresh(bank) || bank[0];
  remember(line);
  return line;
}
