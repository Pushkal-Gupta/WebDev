/**
 * Built-in lesson library for the Guided Lesson System.
 * Each lesson has steps that guide the user through positions.
 *
 * Step types:
 *  - 'explain': Show text explanation + board position
 *  - 'play': User must find the correct move
 *  - 'quiz': Multiple choice question
 */

export const LESSON_CATEGORIES = [
  { id: 'basics',     label: 'Basics',     desc: 'How pieces move and fundamental rules' },
  { id: 'tactics',    label: 'Tactics',    desc: 'Forks, pins, skewers, and combinations' },
  { id: 'checkmates', label: 'Checkmates', desc: 'Common mating patterns' },
  { id: 'endgames',   label: 'Endgames',   desc: 'King and pawn, rook, and basic endgames' },
  { id: 'openings',   label: 'Openings',   desc: 'Opening principles and popular lines' },
  { id: 'strategy',   label: 'Strategy',   desc: 'Positional concepts and planning' },
];

export const LESSONS = [
  // ── TACTICS ────────────────────────────────────────────────────────────────
  {
    id: 'fork-basics',
    category: 'tactics',
    title: 'The Fork',
    description: 'Learn how to attack two pieces at once.',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        fen: 'r1bqkb1r/pppppppp/2n2n2/8/4N3/8/PPPPPPPP/R1BQKBNR w KQkq - 0 1',
        text: 'A fork is when one piece attacks two or more enemy pieces simultaneously. Knights are especially good at forking because they can jump over other pieces.',
      },
      {
        type: 'explain',
        fen: '4k3/8/8/8/3N4/8/8/4K3 w - - 0 1',
        text: 'In this position, White has a knight. Can you see a square where the knight would attack both the king and another piece? Knights fork by landing on a square that puts two enemies in their L-shaped attack range.',
      },
      {
        type: 'play',
        fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
        correctMove: 'Nb6',
        hint: 'Find a square where your knight attacks both the king and the rook.',
        explanation: 'Nb6 forks the king on e8 and the rook on a8. Black must move the king, and White captures the rook.',
      },
      {
        type: 'play',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
        correctMove: 'Ng5',
        hint: 'Find a knight move that creates a double attack on f7.',
        explanation: 'Ng5 attacks the weak f7 pawn, creating threats against the king. This is a common tactical pattern in the Italian Game.',
      },
      {
        type: 'quiz',
        question: 'Which piece is the best at creating forks?',
        options: ['Bishop', 'Knight', 'Rook', 'Pawn'],
        correctIndex: 1,
        explanation: 'Knights are the best forking pieces because they can jump over other pieces and their unique L-shaped movement pattern makes forks hard to prevent.',
      },
    ],
  },
  {
    id: 'pin-basics',
    category: 'tactics',
    title: 'The Pin',
    description: 'Learn how to immobilize pieces by pinning them.',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        fen: '4k3/8/4n3/8/8/8/4B3/4K3 w - - 0 1',
        text: 'A pin occurs when an attacking piece threatens a less valuable piece that cannot move because doing so would expose a more valuable piece behind it. The bishop on e2 pins the knight on e6 to the king.',
      },
      {
        type: 'play',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
        correctMove: 'Bxf7+',
        hint: 'Look for a sacrifice that exploits the pin on the f-pawn.',
        explanation: 'Bxf7+ is a common tactical shot. The f7 pawn is only defended by the king, making it vulnerable.',
      },
      {
        type: 'quiz',
        question: 'What makes a pin effective?',
        options: [
          'The pinned piece cannot legally move',
          'The pinned piece loses all its value',
          'The pinning piece is always a queen',
          'Pins only work on the back rank',
        ],
        correctIndex: 0,
        explanation: 'An absolute pin means the piece literally cannot move because it would expose the king to check. A relative pin means moving would lose material.',
      },
    ],
  },

  // ── CHECKMATES ─────────────────────────────────────────────────────────────
  {
    id: 'back-rank-mate',
    category: 'checkmates',
    title: 'Back Rank Mate',
    description: 'Exploit a trapped king on the back rank.',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
        text: 'Back rank mate happens when a rook or queen delivers checkmate on the opponent\'s first rank (back rank). The enemy king is trapped by its own pawns.',
      },
      {
        type: 'play',
        fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
        correctMove: 'Ra8#',
        hint: 'Deliver checkmate on the back rank.',
        explanation: 'Ra8# is checkmate. The king is trapped by its own pawns on f7, g7, h7 and cannot escape.',
      },
      {
        type: 'play',
        fen: '3rk3/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
        correctMove: 'Rd8#',
        hint: 'The enemy king has no escape squares. Deliver the final blow.',
        explanation: 'Rd8# is checkmate. The rook delivers check on d8 and the king has no escape.',
      },
    ],
  },
  {
    id: 'smothered-mate',
    category: 'checkmates',
    title: 'Smothered Mate',
    description: 'Use a knight to checkmate a king surrounded by its own pieces.',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        fen: '6rk/5ppp/7N/8/8/8/8/6K1 w - - 0 1',
        text: 'A smothered mate occurs when a knight delivers checkmate because the enemy king is completely surrounded (smothered) by its own pieces. The king has no escape squares.',
      },
      {
        type: 'play',
        fen: 'r5rk/5Npp/8/8/8/8/8/6K1 w - - 0 1',
        correctMove: 'Nh6#',
        hint: 'Find a knight move that gives checkmate. The king is boxed in.',
        explanation: 'Nh6# is a smothered mate. The king on h8 is blocked by its own rook on g8 and pawns.',
      },
    ],
  },

  // ── ENDGAMES ───────────────────────────────────────────────────────────────
  {
    id: 'kq-vs-k',
    category: 'endgames',
    title: 'King + Queen vs King',
    description: 'Learn to checkmate with king and queen.',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        fen: '4k3/8/8/8/8/8/8/4K2Q w - - 0 1',
        text: 'Checkmating with King + Queen is essential. The technique: 1) Use the queen to restrict the enemy king to the edge. 2) Bring your king closer. 3) Deliver checkmate on the edge. Avoid stalemate!',
      },
      {
        type: 'play',
        fen: '7k/8/5K2/8/8/8/8/7Q w - - 0 1',
        correctMove: 'Qg7#',
        hint: 'The enemy king is on the edge. Deliver checkmate without stalemate.',
        explanation: 'Qg7# is checkmate. The queen controls g7 while being protected by the king on f6.',
      },
      {
        type: 'quiz',
        question: 'What must you avoid in King + Queen vs King endings?',
        options: ['Capturing pawns', 'Stalemate', 'Moving the king', 'Using the queen'],
        correctIndex: 1,
        explanation: 'Stalemate is the biggest danger. If the enemy king has no legal moves and is not in check, the game is a draw!',
      },
    ],
  },
  {
    id: 'opposition',
    category: 'endgames',
    title: 'Opposition',
    description: 'The most important concept in king and pawn endgames.',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
        text: 'Opposition means kings face each other with one square between them. The player NOT to move has the opposition (an advantage). With opposition, the stronger side can push the weaker king aside and promote the pawn.',
      },
      {
        type: 'play',
        fen: '4k3/8/8/4PK2/8/8/8/8 w - - 0 1',
        correctMove: 'Ke6',
        hint: 'Take the opposition by placing your king directly in front of the enemy king.',
        explanation: 'Ke6 takes the opposition. Now if Black plays Kd8, White plays Kd6 maintaining opposition and will promote the pawn.',
      },
    ],
  },

  // ── OPENINGS ───────────────────────────────────────────────────────────────
  {
    id: 'opening-principles',
    category: 'openings',
    title: 'Opening Principles',
    description: 'The three golden rules of the opening.',
    difficulty: 'beginner',
    steps: [
      {
        type: 'explain',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        text: 'Three golden rules of the opening: 1) Control the center with pawns (e4, d4). 2) Develop your pieces (knights and bishops) quickly. 3) Castle early to protect your king.',
      },
      {
        type: 'play',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        correctMove: 'e4',
        hint: 'Start by controlling the center. Which pawn move is the most popular?',
        explanation: 'e4 is the most popular first move. It controls the d5 and f5 squares and opens lines for the bishop and queen.',
      },
      {
        type: 'play',
        fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
        correctMove: 'e5',
        hint: 'Fight for the center! Mirror White\'s move.',
        explanation: 'e5 fights for central control. This leads to the Open Game, one of the most classical openings.',
      },
      {
        type: 'quiz',
        question: 'Which opening principle is most important?',
        options: ['Attack immediately', 'Control the center', 'Move the queen early', 'Advance all pawns'],
        correctIndex: 1,
        explanation: 'Controlling the center gives your pieces more mobility and restricts your opponent. Queens moved early often become targets.',
      },
    ],
  },

  // ── STRATEGY ───────────────────────────────────────────────────────────────
  {
    id: 'piece-activity',
    category: 'strategy',
    title: 'Piece Activity',
    description: 'Why active pieces win games.',
    difficulty: 'intermediate',
    steps: [
      {
        type: 'explain',
        fen: 'r1b1kb1r/ppppqppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
        text: 'Active pieces control more squares and create more threats. Compare: White\'s bishops are developed to active squares (c4 targets f7), knights control the center. Always ask: "Are my pieces on their best squares?"',
      },
      {
        type: 'play',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1',
        correctMove: 'O-O',
        hint: 'Develop your position. What should you do before launching an attack?',
        explanation: 'O-O castles kingside, putting the king to safety while activating the rook. Development before attack is a key principle.',
      },
      {
        type: 'quiz',
        question: 'Which piece is poorly placed?',
        options: ['A knight on the rim (a3)', 'A bishop on a long diagonal', 'A rook on an open file', 'A knight in the center'],
        correctIndex: 0,
        explanation: '"A knight on the rim is dim." Knights on the edge control fewer squares (4 max vs 8 in the center). Central knights are more powerful.',
      },
    ],
  },
];

export function getLessonsByCategory(categoryId) {
  return LESSONS.filter(l => l.category === categoryId);
}

export function getLessonById(id) {
  return LESSONS.find(l => l.id === id);
}

export function getCompletedLessons() {
  try {
    return JSON.parse(localStorage.getItem('completedLessons') || '[]');
  } catch { return []; }
}

export function markLessonComplete(id) {
  const completed = getCompletedLessons();
  if (!completed.includes(id)) {
    completed.push(id);
    localStorage.setItem('completedLessons', JSON.stringify(completed));
  }
}
