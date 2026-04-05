import styles from './PuzzlePage.module.css';

// ── Full Lichess puzzle theme catalogue ──────────────────────────────────────

export const PUZZLE_THEMES = [
  { id: 'mateIn1', label: 'Mate in 1', icon: '#' },
  { id: 'mateIn2', label: 'Mate in 2', icon: '#' },
  { id: 'mateIn3', label: 'Mate in 3', icon: '#' },
  { id: 'mate', label: 'Checkmate', icon: '#' },
  { id: 'backRankMate', label: 'Back Rank', icon: '#' },
  { id: 'smotheredMate', label: 'Smothered Mate', icon: '#' },
  { id: 'fork', label: 'Fork', icon: 'Y' },
  { id: 'pin', label: 'Pin', icon: '|' },
  { id: 'skewer', label: 'Skewer', icon: '/' },
  { id: 'discoveredAttack', label: 'Discovered Attack', icon: '>' },
  { id: 'doubleCheck', label: 'Double Check', icon: '++' },
  { id: 'sacrifice', label: 'Sacrifice', icon: '!' },
  { id: 'deflection', label: 'Deflection', icon: '~' },
  { id: 'decoy', label: 'Decoy', icon: '*' },
  { id: 'clearance', label: 'Clearance', icon: '-' },
  { id: 'interference', label: 'Interference', icon: 'x' },
  { id: 'intermezzo', label: 'Intermezzo', icon: '!' },
  { id: 'xRayAttack', label: 'X-Ray Attack', icon: '>' },
  { id: 'zugzwang', label: 'Zugzwang', icon: 'Z' },
  { id: 'trappedPiece', label: 'Trapped Piece', icon: 'T' },
  { id: 'hangingPiece', label: 'Hanging Piece', icon: 'H' },
  { id: 'exposedKing', label: 'Exposed King', icon: 'K' },
  { id: 'endgame', label: 'Endgame', icon: 'E' },
  { id: 'pawnEndgame', label: 'Pawn Endgame', icon: 'P' },
  { id: 'rookEndgame', label: 'Rook Endgame', icon: 'R' },
  { id: 'bishopEndgame', label: 'Bishop Endgame', icon: 'B' },
  { id: 'knightEndgame', label: 'Knight Endgame', icon: 'N' },
  { id: 'queenEndgame', label: 'Queen Endgame', icon: 'Q' },
  { id: 'crushing', label: 'Crushing', icon: '!!' },
  { id: 'advantage', label: 'Advantage', icon: '+' },
  { id: 'equality', label: 'Equality', icon: '=' },
  { id: 'defensiveMove', label: 'Defense', icon: 'D' },
  { id: 'quietMove', label: 'Quiet Move', icon: '.' },
  { id: 'promotion', label: 'Promotion', icon: 'Q' },
  { id: 'underPromotion', label: 'Under-Promotion', icon: 'N' },
  { id: 'castling', label: 'Castling', icon: 'O' },
  { id: 'enPassant', label: 'En Passant', icon: 'ep' },
  { id: 'short', label: 'Short Puzzle', icon: 'S' },
  { id: 'long', label: 'Long Puzzle', icon: 'L' },
  { id: 'veryLong', label: 'Very Long', icon: 'VL' },
  { id: 'oneMove', label: 'One Move', icon: '1' },
];

// ── Grouped sections ─────────────────────────────────────────────────────────

const THEME_SECTIONS = [
  {
    title: 'Checkmate Patterns',
    ids: ['mateIn1', 'mateIn2', 'mateIn3', 'mate', 'backRankMate', 'smotheredMate'],
  },
  {
    title: 'Tactics',
    ids: [
      'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'sacrifice',
      'deflection', 'decoy', 'clearance', 'interference', 'intermezzo',
      'xRayAttack', 'zugzwang', 'trappedPiece', 'hangingPiece', 'exposedKing',
    ],
  },
  {
    title: 'Endgame',
    ids: ['endgame', 'pawnEndgame', 'rookEndgame', 'bishopEndgame', 'knightEndgame', 'queenEndgame'],
  },
  {
    title: 'Evaluation',
    ids: ['crushing', 'advantage', 'equality', 'defensiveMove', 'quietMove'],
  },
  {
    title: 'Special Moves',
    ids: ['promotion', 'underPromotion', 'castling', 'enPassant'],
  },
  {
    title: 'Length',
    ids: ['short', 'long', 'veryLong', 'oneMove'],
  },
];

// Build a quick lookup map so we don't scan the array every render
const THEME_MAP = Object.fromEntries(PUZZLE_THEMES.map((t) => [t.id, t]));

// ── Component ────────────────────────────────────────────────────────────────

export default function ThemePicker({ selectedTheme, onSelectTheme }) {
  return (
    <div className={styles.themePicker}>
      {/* Header with clear button */}
      <div className={styles.themePickerHeader}>
        <span className={styles.themePickerTitle}>Puzzle Themes</span>
        {selectedTheme && (
          <button
            className={styles.clearBtn}
            onClick={() => onSelectTheme(null)}
          >
            Clear
          </button>
        )}
      </div>

      {/* Sections */}
      {THEME_SECTIONS.map((section) => (
        <div key={section.title} className={styles.themeSection}>
          <span className={styles.themeSectionTitle}>{section.title}</span>
          <div className={styles.themeGrid}>
            {section.ids.map((id) => {
              const theme = THEME_MAP[id];
              if (!theme) return null;
              const isActive = selectedTheme === id;
              return (
                <button
                  key={id}
                  className={`${styles.themeBtn} ${isActive ? styles.themeBtnActive : ''}`}
                  onClick={() => onSelectTheme(id)}
                  title={theme.label}
                >
                  {theme.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
