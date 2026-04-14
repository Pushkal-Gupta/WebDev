/**
 * Built-in opening repertoire lines for the Opening Trainer.
 * Each line has a sequence of moves, a name, and tags.
 *
 * Users can also create custom repertoires stored in localStorage.
 */

export const BUILT_IN_REPERTOIRES = {
  white: [
    {
      id: 'italian',
      name: 'Italian Game',
      eco: 'C50',
      color: '#f0c94c',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
      description: 'A classical opening aiming for quick development and control of the center.',
      keyIdeas: ['Control d5 with pieces', 'Prepare d4 push', 'Castle kingside quickly'],
      lines: [
        { name: 'Giuoco Piano', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3'], hint: 'Prepare d4' },
        { name: 'Evans Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'], hint: 'Sacrifice b-pawn for tempo' },
        { name: 'Two Knights', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'd4'], hint: 'Open the center immediately' },
      ],
    },
    {
      id: 'london',
      name: 'London System',
      eco: 'D02',
      color: '#5dade2',
      moves: ['d4', 'd5', 'Bf4'],
      description: 'A solid, easy-to-learn system. Develop Bf4 before e3, then build a pyramid.',
      keyIdeas: ['Bf4 before e3', 'e3-Bd3-Nf3-O-O setup', 'Solid pawn structure'],
      lines: [
        { name: 'Main Line', moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nd2'], hint: 'Nd2 supports e4 push' },
        { name: 'vs ...c5', moves: ['d4', 'c5', 'Bf4', 'cxd4', 'e3'], hint: 'Recapture with e-pawn to open bishop' },
        { name: 'vs ...Nf6 Bg4', moves: ['d4', 'Nf6', 'Bf4', 'g6', 'e3', 'Bg7', 'Nf3'], hint: 'Standard setup vs KID structure' },
      ],
    },
    {
      id: 'scotch',
      name: 'Scotch Game',
      eco: 'C45',
      color: '#e74c3c',
      moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'],
      description: 'Open the center immediately. Aggressive and direct.',
      keyIdeas: ['Early d4 to open lines', 'Active piece play', 'Avoid slow maneuvering'],
      lines: [
        { name: 'Main Line', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4'], hint: 'Recapture with the knight' },
        { name: 'Scotch Gambit', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'], hint: 'Gambit the d-pawn for development' },
      ],
    },
  ],
  black: [
    {
      id: 'sicilian',
      name: 'Sicilian Defense',
      eco: 'B20',
      color: '#e040fb',
      moves: ['e4', 'c5'],
      description: 'The most popular defense against 1.e4. Fights for the center asymmetrically.',
      keyIdeas: ['Asymmetric pawn structure', 'Counterattack on queenside', 'Active piece play'],
      lines: [
        { name: 'Open Sicilian', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'], hint: 'Main theoretical battleground' },
        { name: 'Najdorf', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], hint: 'Most popular Sicilian - flexible' },
        { name: 'Dragon', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], hint: 'Fianchetto bishop on g7' },
      ],
    },
    {
      id: 'french',
      name: 'French Defense',
      eco: 'C00',
      color: '#7cb342',
      moves: ['e4', 'e6'],
      description: 'Solid and strategic. Black builds a pawn chain and counterattacks.',
      keyIdeas: ['Pawn chain e6-d5', 'Counterattack with ...c5', 'Light-squared bishop is key problem piece'],
      lines: [
        { name: 'Advance', moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5'], hint: 'Attack the d4 pawn chain base' },
        { name: 'Exchange', moves: ['e4', 'e6', 'd4', 'd5', 'exd5', 'exd5'], hint: 'Symmetrical but Black is solid' },
        { name: 'Winawer', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'], hint: 'Pin the knight, provoke weaknesses' },
      ],
    },
    {
      id: 'kings-indian',
      name: "King's Indian Defense",
      eco: 'E60',
      color: '#9c27b0',
      moves: ['d4', 'Nf6', 'c4', 'g6'],
      description: 'Hypermodern defense. Let White build the center, then attack it.',
      keyIdeas: ['Fianchetto bishop on g7', 'Kingside attack with ...f5', 'Flexible pawn structure'],
      lines: [
        { name: 'Classical', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O'], hint: 'Standard setup before choosing a plan' },
        { name: 'Samisch', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3'], hint: 'White plays f3 - plan ...c5 or ...e5' },
      ],
    },
  ],
};

// ── Spaced Repetition Helpers ────────────────────────────────────────────────

const REPERTOIRE_KEY = 'chess_opening_repertoire';
const SRS_KEY = 'chess_opening_srs';

export function loadUserRepertoire() {
  try { return JSON.parse(localStorage.getItem(REPERTOIRE_KEY)) || { white: [], black: [] }; }
  catch { return { white: [], black: [] }; }
}

export function saveUserRepertoire(rep) {
  localStorage.setItem(REPERTOIRE_KEY, JSON.stringify(rep));
}

export function loadSrsData() {
  try { return JSON.parse(localStorage.getItem(SRS_KEY)) || {}; }
  catch { return {}; }
}

export function saveSrsData(data) {
  localStorage.setItem(SRS_KEY, JSON.stringify(data));
}

/**
 * Get lines due for review (spaced repetition).
 * A line is "due" if it hasn't been reviewed today, or if it was answered wrong last time.
 */
export function getDueLines(srsData, allLines) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return allLines.filter(line => {
    const key = line.moves.join(',');
    const entry = srsData[key];
    if (!entry) return true; // never reviewed
    if (!entry.correct) return true; // last attempt was wrong
    const interval = (entry.streak || 1) * dayMs; // interval grows with streak
    return (now - entry.lastReview) > interval;
  });
}

/**
 * Record a review result for a line.
 */
export function recordReview(srsData, line, correct) {
  const key = line.moves.join(',');
  const existing = srsData[key] || { streak: 0, correct: false, lastReview: 0 };

  if (correct) {
    existing.streak = (existing.streak || 0) + 1;
    existing.correct = true;
  } else {
    existing.streak = 0;
    existing.correct = false;
  }
  existing.lastReview = Date.now();

  return { ...srsData, [key]: existing };
}
