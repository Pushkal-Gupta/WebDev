/**
 * Coach personas for "Play with Coach" mode.
 * Shape mirrors bots.js so the same card primitive can render both grids.
 */

// SVG path strings (rendered inside a 24x24 viewBox). Inline here so the
// coaches data file is self-contained; a shared icons module is a nice
// follow-up cleanup but not required for this redesign.
const I = {
  cap:      '<path d="M2 9l10-4 10 4-10 4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M6 10.8V15c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 9v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="21" cy="15" r="1.2" fill="currentColor"/>',
  leaf:     '<path d="M17 8C8 10 5.9 16.17 3.82 21.34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M17 8A5 5 0 005 12c0 4 3 7 7 7a9 9 0 005-11z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bolt:     '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  book:     '<path d="M4 19.5A2.5 2.5 0 016.5 17H20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  flag:     '<path d="M4 2v20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 4h12l-3 4 3 4H4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  castle:   '<path d="M4 21V11h3V8h2V5h6v3h2v3h3v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-4h6v4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 11h16" stroke="currentColor" stroke-width="1.5"/>',
  brain:    '<path d="M12 2C9 2 7 4 7 6.5c0 1-.5 2-1.5 2.5C4 10 3 12 3 14c0 3 2.5 5.5 5.5 5.5.5 0 1 0 1.5-.1V22h4v-2.6c.5.1 1 .1 1.5.1C18.5 19.5 21 17 21 14c0-2-1-4-2.5-5 -1-.5-1.5-1.5-1.5-2.5C17 4 15 2 12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v20M8 8c2 1 4 1 6 0M7.5 14c2-1 5-1 7 0" stroke="currentColor" stroke-width="1" opacity="0.4"/>',
  infinity: '<path d="M8 12c-2-2-4-2-4 0s2 4 4 4 4-2 4-4 2-4 4-4 4 2 4 4-2 2-4 0" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

const COACHES = [
  {
    id: 'coach_nova',
    name: 'Coach Nova',
    icon: I.cap,
    color: '#ffd27a',
    tagline: 'Learn as you play.',
    focus: ['Balanced', 'Patient', 'Fundamentals'],
    description: 'A patient teacher who comments on every move and nudges you toward sound plans.',
    greetings: [
      'Welcome! Let’s play a game and I’ll teach you as we go.',
      'Hi there. Focus on good moves — I’ll point things out.',
      'Ready? I’ll walk through the ideas with you move by move.',
    ],
    openingLines: [
      'A classical opening — develop your pieces and castle soon.',
      'Good. Try to control the center and connect your rooks.',
    ],
    blunderLines: [
      'Careful — that move loses material. Take it back if you can.',
      'That drops a piece. Always check what your opponent threatens.',
      'A little shaky. Look at all captures and checks first.',
    ],
    brilliantLines: [
      'Beautiful! You spotted a strong tactical idea.',
      'Great calculation — that’s the kind of move that wins games.',
    ],
    checkLines: [
      'You gave check. Make sure you have a real plan behind it.',
      'Check! But don’t give checks for their own sake — look for follow-up.',
    ],
    captureLines: [
      'Nice capture — count material carefully after.',
      'Good trade if you keep activity. Otherwise, reconsider.',
    ],
    quietLines: [
      'Solid move. Keep an eye on your weak squares.',
      'Okay. Now look for a plan for your worst-placed piece.',
    ],
    closingWin: 'Well played — you converted cleanly!',
    closingLoss: 'Good effort. Let’s review where it went sideways.',
    closingDraw: 'A fair result — both sides played carefully.',
  },
  {
    id: 'coach_sprout',
    name: 'Sprout',
    icon: I.leaf,
    color: '#7ee787',
    tagline: 'Your very first moves.',
    focus: ['Beginner', 'Gentle', 'Encouraging'],
    description: 'A gentle guide for total beginners. Celebrates small wins and keeps things simple.',
    greetings: [
      'Hey friend! Let’s take it slow and have fun.',
      'No pressure — we’re here to learn together.',
      'Welcome! Every move is a chance to learn something new.',
    ],
    openingLines: [
      'Knights and bishops first — they love the center!',
      'Try to move a pawn in the middle, then bring your knights out.',
    ],
    blunderLines: [
      'Oh no — that piece can be taken! Let’s try something safer.',
      'Careful! Look at what your opponent attacks before you move.',
      'That one’s a tricky square. Shall we pick a new move?',
    ],
    brilliantLines: [
      'Wonderful find! That was a super move.',
      'Yay! You’re really thinking like a chess player.',
    ],
    checkLines: [
      'A check! Now see if it actually helps your plan.',
      'Nice, you gave check — but check the check helps!',
    ],
    captureLines: [
      'You took a piece — well done!',
      'A capture! Count what’s left on both sides.',
    ],
    quietLines: [
      'That’s a calm move. Chess is also about patience.',
      'Nice. Now look for your worst piece and help it out.',
    ],
    closingWin: 'Amazing game! You played with heart.',
    closingLoss: 'Great try — losses teach us the most. Let’s play again!',
    closingDraw: 'A peaceful draw — not every game ends in a win, and that’s okay.',
  },
  {
    id: 'coach_flash',
    name: 'Flash',
    icon: I.bolt,
    color: '#ffa94d',
    tagline: 'Think fast, stay calm.',
    focus: ['Blitz', 'Intuition', 'Quick decisions'],
    description: 'Blitz-minded. Teaches fast pattern recognition and how to keep your head under time pressure.',
    greetings: [
      'Clock’s ticking — let’s sharpen those instincts.',
      'Speed is a skill. Breathe, then move.',
      'Ready to think on your feet? Let’s go.',
    ],
    openingLines: [
      'Get your king safe fast. Castle early, castle often.',
      'No time for perfect — just find a reasonable plan.',
    ],
    blunderLines: [
      'Slow down one second — that hangs a piece.',
      'Too fast. Even in blitz, check for one-movers.',
      'Oof, time pressure got you. Breathe and reset.',
    ],
    brilliantLines: [
      'Boom! That’s blitz intuition at its best.',
      'Fast AND accurate — chef’s kiss.',
    ],
    checkLines: [
      'Quick check, good tempo — keep the pressure on.',
      'Check and clock — use both to your advantage.',
    ],
    captureLines: [
      'Fast capture — trust your instincts.',
      'Nice grab. Don’t let the clock rush the next move.',
    ],
    quietLines: [
      'Okay, a breather move. Don’t sit too long here.',
      'Solid. Keep moving — don’t drain your clock.',
    ],
    closingWin: 'Flawless under pressure. That’s how blitz is won.',
    closingLoss: 'The clock’s a tough opponent too. Next one’s yours.',
    closingDraw: 'A clean split — both sides held their nerve.',
  },
  {
    id: 'coach_sage',
    name: 'Sage',
    icon: I.book,
    color: '#a78bfa',
    tagline: 'See the whole board.',
    focus: ['Positional', 'Strategy', 'Long-term'],
    description: 'Favors long-term planning, piece placement, and quiet squeezes over sharp tactics.',
    greetings: [
      'Patience and structure win games. Let’s build something.',
      'We’ll take the long view. Every move has a purpose.',
      'Good habits beat good tactics. Let’s practice both.',
    ],
    openingLines: [
      'Claim the center with pawns, then support them with pieces.',
      'Before you attack, make sure your pieces are coordinated.',
    ],
    blunderLines: [
      'That weakens your pawn structure — think about the long game.',
      'Material matters, but so does square control. That one hurts both.',
      'A hasty move. What’s your long-term plan here?',
    ],
    brilliantLines: [
      'Excellent positional judgment — classical technique.',
      'That’s the kind of quiet power move that wins endgames.',
    ],
    checkLines: [
      'A check — but does it improve your position?',
      'Useful if it forces a weakness. Otherwise, consider something quieter.',
    ],
    captureLines: [
      'Good — but watch your pawn structure after this trade.',
      'A fair exchange. Now activate your pieces before the endgame.',
    ],
    quietLines: [
      'Perfect — a classic waiting move. Let them commit first.',
      'This is real chess. Pieces, squares, structure.',
    ],
    closingWin: 'A model game. Strategic clarity from start to finish.',
    closingLoss: 'Tough loss, but you can see the pattern now. Study the pivot.',
    closingDraw: 'A principled draw — both sides respected the structure.',
  },
  {
    id: 'coach_gambit',
    name: 'Gambit',
    icon: I.flag,
    color: '#ff6b9a',
    tagline: 'Attack with purpose.',
    focus: ['Openings', 'Aggression', 'Initiative'],
    description: 'Opening specialist who loves sharp lines, sacrifices, and relentless pressure.',
    greetings: [
      'Let’s play sharp. Punch first, apologize never.',
      'Activity over material. Make them defend!',
      'Ready to storm the castle?',
    ],
    openingLines: [
      'Push a pawn, open a file — attack with tempo!',
      'Sharp opening — develop aimed at their king.',
    ],
    blunderLines: [
      'Attacks need pieces. That move leaves your army behind.',
      'Sharp play needs accuracy. That one just loses.',
      'Too eager! Sacrifices only work when they work.',
    ],
    brilliantLines: [
      'A sacrifice that SINGS! Pure fireworks.',
      'That’s the spirit — unstoppable initiative.',
    ],
    checkLines: [
      'Yes! Check with tempo — keep the attack rolling.',
      'Aggressive check. Line up the next blow.',
    ],
    captureLines: [
      'Rip it open! Now pile up on the king.',
      'Good grab — don’t trade attackers though.',
    ],
    quietLines: [
      'A quiet move? From you? Fine, but keep the pressure on next.',
      'Okay, regroup — then back to the attack.',
    ],
    closingWin: 'A brilliant attacking game! That was art.',
    closingLoss: 'No regrets — attackers gotta attack. We learn and we charge again.',
    closingDraw: 'A fighting draw. They defended well, you pressed well.',
  },
  {
    id: 'coach_fortress',
    name: 'Fortress',
    icon: I.castle,
    color: '#64d9e8',
    tagline: 'Finish what you start.',
    focus: ['Endgame', 'Technique', 'Conversion'],
    description: 'Endgame specialist. Teaches the technique needed to turn an edge into a full point.',
    greetings: [
      'Endgames win games. Let’s learn to finish.',
      'Precision is everything once the queens are off.',
      'Ready to master the technique that wins points?',
    ],
    openingLines: [
      'Fine opening — but I’m saving my notes for the endgame.',
      'Develop simply. The real work comes later.',
    ],
    blunderLines: [
      'That move wrecks your pawn structure — fatal in the endgame.',
      'Careful: one bad pawn move can cost the whole point later.',
      'Endgame accuracy matters. That one loses a tempo we needed.',
    ],
    brilliantLines: [
      'Textbook technique — exactly how endgames are won.',
      'Beautiful zugzwang idea. That’s elite endgame play.',
    ],
    checkLines: [
      'A useful check — cuts off the king.',
      'Good check. Now restrict their king further.',
    ],
    captureLines: [
      'Simplify when ahead. That’s the endgame golden rule.',
      'Trade pieces, keep pawns — that’s winning technique.',
    ],
    quietLines: [
      'A patient move — that’s how endgames are won.',
      'Improve your worst piece. Then improve it again.',
    ],
    closingWin: 'Perfect technique. A full point, earned.',
    closingLoss: 'Close one — the endgame is unforgiving. Let’s drill it.',
    closingDraw: 'Well-defended endgame — both sides held the line.',
  },
  {
    id: 'coach_calculo',
    name: 'Calculo',
    icon: I.brain,
    color: '#00fff5',
    tagline: 'Every variation counts.',
    focus: ['Tactics', 'Calculation', 'Precision'],
    description: 'A tactics coach. Rewards deep calculation and punishes handwaves.',
    greetings: [
      'Show me the variations. Three moves ahead, minimum.',
      'Tactics flow from superior position. Calculate!',
      'Count candidates, then check each one. Let’s go.',
    ],
    openingLines: [
      'Fine — now start calculating. What does each piece threaten?',
      'Solid start. Keep your eyes on every tactic.',
    ],
    blunderLines: [
      'Calculation error — you missed a one-move tactic.',
      'Not enough candidate moves. Slow down and count.',
      'That move fails to a simple combination. Redo the check.',
    ],
    brilliantLines: [
      'Flawless calculation. Every line checks out.',
      'Deep and correct — that’s what tactics demand.',
    ],
    checkLines: [
      'A calculated check — what follows it?',
      'Good. Now visualize the response three moves deep.',
    ],
    captureLines: [
      'Verified capture — material is secure.',
      'Count again: who benefits from this trade?',
    ],
    quietLines: [
      'Reposition move — calculate before committing.',
      'A precise move. Keep the board sharp in your head.',
    ],
    closingWin: 'Calculation converted. Textbook.',
    closingLoss: 'A miss somewhere in the variations. Let’s find it.',
    closingDraw: 'No tactical errors on either side — a respectable result.',
  },
  {
    id: 'coach_zen',
    name: 'Zen',
    icon: I.infinity,
    color: '#c7c7c7',
    tagline: 'Patience wins games.',
    focus: ['Mindset', 'Discipline', 'Resilience'],
    description: 'Focused on the mental side of chess. Teaches patience, discipline, and recovery from mistakes.',
    greetings: [
      'Breathe. The board will tell you what it needs.',
      'Quiet mind, clear move. Let’s play.',
      'No hurry. Every move is its own world.',
    ],
    openingLines: [
      'A calm opening. Let the position develop naturally.',
      'No need to force. Simple development is enough.',
    ],
    blunderLines: [
      'A breath before that move would have helped.',
      'Mistakes happen. Notice it, don’t cling to it — keep playing.',
      'That one slipped. Steady hands from here.',
    ],
    brilliantLines: [
      'Focus and clarity — that move came from stillness.',
      'A quiet brilliance. Beautifully done.',
    ],
    checkLines: [
      'A measured check. No urgency.',
      'Check. Let the position respond.',
    ],
    captureLines: [
      'A calm capture. Move on without emotion.',
      'Trade without attachment. Play the position.',
    ],
    quietLines: [
      'Stillness on the board — that’s skill, not hesitation.',
      'Patience. The plan will reveal itself.',
    ],
    closingWin: 'A graceful game. Mind and moves aligned.',
    closingLoss: 'Losses teach. Let go, and we begin again.',
    closingDraw: 'A balanced result — both sides in harmony.',
  },
];

// Levels follow chess.com-coach layout: name + target rating + stockfish strength (1–10).
export const COACH_LEVELS = [
  { id: 'new',     name: 'New to Chess',    rating: 200,  strength: 1 },
  { id: 'beg',     name: 'Beginner',        rating: 400,  strength: 2 },
  { id: 'novice',  name: 'Novice',          rating: 600,  strength: 3 },
  { id: 'inter',   name: 'Intermediate',    rating: 900,  strength: 4 },
  { id: 'inter2',  name: 'Intermediate II', rating: 1200, strength: 5 },
  { id: 'adv',     name: 'Advanced',        rating: 1600, strength: 6 },
  { id: 'master',  name: 'Master',          rating: 2000, strength: 8 },
];

export default COACHES;

export function getCoachById(id) {
  return COACHES.find(c => c.id === id) || COACHES[0];
}
