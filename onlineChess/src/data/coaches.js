/**
 * Coach personas for "Play with Coach" mode.
 * One coach for now; shape mirrors bots.js so the same UI components can render both.
 */

const COACH_ICON = '<path d="M10 2a5 5 0 015 5c0 2-1.5 3.5-3 4.5V14H8v-2.5C6.5 10.5 5 9 5 7a5 5 0 015-5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 14h4v2a2 2 0 01-4 0v-2z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';

const COACHES = [
  {
    id: 'coach_nova',
    name: 'Coach Nova',
    icon: COACH_ICON,
    color: '#ffd27a',
    tagline: 'Learn as you play.',
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
];

// Levels follow chess.com-coach layout: name + target rating + stockfish strength (1–10).
export const COACH_LEVELS = [
  { id: 'new',     name: 'New to Chess',  rating: 200,  strength: 1 },
  { id: 'beg',     name: 'Beginner',      rating: 400,  strength: 2 },
  { id: 'novice',  name: 'Novice',        rating: 600,  strength: 3 },
  { id: 'inter',   name: 'Intermediate',  rating: 900,  strength: 4 },
  { id: 'inter2',  name: 'Intermediate II', rating: 1200, strength: 5 },
  { id: 'adv',     name: 'Advanced',      rating: 1600, strength: 6 },
  { id: 'master',  name: 'Master',        rating: 2000, strength: 8 },
];

export default COACHES;

export function getCoachById(id) {
  return COACHES.find(c => c.id === id) || COACHES[0];
}
