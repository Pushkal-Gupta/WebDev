/**
 * Bot personalities for "vs Computer" mode.
 * Each bot maps to a Stockfish strength level (1-10).
 * Icons are SVG path data rendered inline — no emoji.
 */

// SVG icon components as path strings (rendered in a 24x24 viewBox)
const ICONS = {
  chick:    '<circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="9" r="1" fill="currentColor"/><circle cx="14" cy="9" r="1" fill="currentColor"/><path d="M10 12c0 0 1 1.5 2 1.5s2-1.5 2-1.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M12 4V2M9 5L7 3M15 5l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  flower:   '<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/><circle cx="12" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16.3" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="14.7" cy="14.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="9.3" cy="14.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="7.7" cy="9.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  target:   '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  book:     '<path d="M4 19.5A2.5 2.5 0 016.5 17H20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  bolt:     '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  crown:    '<path d="M2 20h20M4 20l1-12 5 4 2-8 2 8 5-4 1 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  castle:   '<path d="M4 21V11h3V8h2V5h6v3h2v3h3v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-4h6v4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 11h16" stroke="currentColor" stroke-width="1.5"/>',
  tophat:   '<ellipse cx="12" cy="18" rx="9" ry="3" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="7" y="6" width="10" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 10h10" stroke="currentColor" stroke-width="1"/>',
  crystal:  '<path d="M12 2l8 8-8 12-8-12z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 10h16M12 2v20" stroke="currentColor" stroke-width="1" opacity="0.4"/>',
  cpu:      '<rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
};

const BOTS = [
  {
    id: 'nelson',
    name: 'Nelson',
    rating: 400,
    strength: 1,
    icon: ICONS.chick,
    color: '#8bc34a',
    tagline: 'Just happy to be here!',
    description: 'A complete beginner. Makes random-looking moves and often leaves pieces hanging.',
    winMsg: 'Good game! I had fun even though I lost.',
    loseMsg: 'Yay! I actually won? That never happens!',
    drawMsg: 'A draw? I call that a victory!',
  },
  {
    id: 'elena',
    name: 'Elena',
    rating: 650,
    strength: 2,
    icon: ICONS.flower,
    color: '#e91e90',
    tagline: 'Learning the basics.',
    description: 'Knows how pieces move but still blunders frequently. Developing an eye for tactics.',
    winMsg: 'Well played! You got me this time.',
    loseMsg: 'I\'m getting better! Did you see my knight fork?',
    drawMsg: 'A fair fight! Let\'s play again.',
  },
  {
    id: 'omar',
    name: 'Omar',
    rating: 900,
    strength: 3,
    icon: ICONS.target,
    color: '#ff9800',
    tagline: 'Casual club player.',
    description: 'Understands basic tactics. Will capture hanging pieces and attempt simple combinations.',
    winMsg: 'Nice game! Your endgame was strong.',
    loseMsg: 'That combination caught you off guard, didn\'t it?',
    drawMsg: 'Solid play from both sides.',
  },
  {
    id: 'isabel',
    name: 'Isabel',
    rating: 1100,
    strength: 4,
    icon: ICONS.book,
    color: '#2196f3',
    tagline: 'Positional play is key.',
    description: 'Plays solid openings and values piece activity. Won\'t fall for basic tricks.',
    winMsg: 'Good effort! Try controlling the center more.',
    loseMsg: 'My patience paid off in the end.',
    drawMsg: 'An instructive game for both of us.',
  },
  {
    id: 'frank',
    name: 'Frank',
    rating: 1300,
    strength: 5,
    icon: ICONS.bolt,
    color: '#ffd600',
    tagline: 'Tactics, tactics, tactics.',
    description: 'Aggressive and sharp. Loves sacrifices and combinations. Watch out for his attacks.',
    winMsg: 'Impressive! You survived my attack.',
    loseMsg: 'Did you see that sacrifice coming?',
    drawMsg: 'You defended well. I\'ll find a way next time.',
  },
  {
    id: 'diana',
    name: 'Diana',
    rating: 1500,
    strength: 6,
    icon: ICONS.crown,
    color: '#00fff5',
    tagline: 'Balanced and dangerous.',
    description: 'Tournament-level player. Strong in all phases with good time management.',
    winMsg: 'Well done. You found the critical moments.',
    loseMsg: 'Every move matters. Today was my day.',
    drawMsg: 'A well-fought battle. Respect.',
  },
  {
    id: 'victor',
    name: 'Victor',
    rating: 1700,
    strength: 7,
    icon: ICONS.castle,
    color: '#9c27b0',
    tagline: 'Endgame specialist.',
    description: 'Expert at converting small advantages. Will grind you down in the endgame.',
    winMsg: 'You played creatively. I need to adapt.',
    loseMsg: 'The endgame is where games are won.',
    drawMsg: 'A razor-sharp game.',
  },
  {
    id: 'maximilian',
    name: 'Maximilian',
    rating: 1900,
    strength: 8,
    icon: ICONS.tophat,
    color: '#607d8b',
    tagline: 'Precision above all.',
    description: 'Rarely makes mistakes. Deep calculation ability and strong positional sense.',
    winMsg: 'Fascinating. You found a line I hadn\'t considered.',
    loseMsg: 'As expected. Precision is my middle name.',
    drawMsg: 'Equal chances throughout. A theoretical draw.',
  },
  {
    id: 'aria',
    name: 'Aria',
    rating: 2100,
    strength: 9,
    icon: ICONS.crystal,
    color: '#e040fb',
    tagline: 'Sees what you don\'t.',
    description: 'Near-master strength. Deep strategic understanding with razor-sharp tactics.',
    winMsg: 'Remarkable. Very few beat me.',
    loseMsg: 'I saw the winning continuation 8 moves ago.',
    drawMsg: 'You played at a very high level today.',
  },
  {
    id: 'hyperion',
    name: 'Hyperion',
    rating: 2400,
    strength: 10,
    icon: ICONS.cpu,
    color: '#ff1744',
    tagline: 'Maximum strength.',
    description: 'Full engine power. Calculates perfectly. Virtually unbeatable.',
    winMsg: 'Error in my evaluation function detected. Impressive.',
    loseMsg: 'Resistance is futile.',
    drawMsg: 'Stalemate detected. Clever defensive technique.',
  },
];

export default BOTS;

export function getBotById(id) {
  return BOTS.find(b => b.id === id) || null;
}

export function getBotByStrength(strength) {
  return BOTS.find(b => b.strength === strength) || BOTS[0];
}
