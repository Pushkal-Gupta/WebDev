import styles from './PuzzlePage.module.css';

// SVG icon paths (24x24 viewBox, stroke-based, consistent 1.5 weight).
// Chess pieces for endgames, tactical symbols for tactics, clean conceptual icons for the rest.
const I = {
  // Chess pieces
  king:    '<path d="M12 3v3M9 3h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 21h10M8 17h8l1 4H7l1-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  queen:   '<path d="M2 20h20M4 20l1-12 5 4 2-8 2 8 5-4 1 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  rook:    '<path d="M6 21h12M7 21V11h2V8h2V5h2v3h2v3h2v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 11h10" stroke="currentColor" stroke-width="1.5"/>',
  bishop:  '<path d="M12 3v1M12 4c-2 0-4 3-4 7 0 3 2 5 4 5s4-2 4-5c0-4-2-7-4-7z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 20h8M10 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 21h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  knight:  '<path d="M8 21h8M9 17c0-3 1-5 2-7l-2-3c0-1 1-2 2-3 2 1 4 3 4 6 0 2-1 4-2 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="8" r="0.8" fill="currentColor"/>',
  pawn:    '<path d="M12 5a2 2 0 100 4 2 2 0 000-4z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 9l-1 4h6l-1-4M7 17h10M8 21h8M9 17l-1 4M15 17l1 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  // Checkmate concepts
  crown:   '<path d="M3 18h18M5 18l1-10 4 3 2-7 2 7 4-3 1 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  mate1:   '<path d="M4 18h16M6 18l1-8 3 2 2-6 2 6 3-2 1 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><text x="12" y="22.5" text-anchor="middle" font-size="5" font-weight="800" fill="currentColor">1</text>',
  mate2:   '<path d="M4 18h16M6 18l1-8 3 2 2-6 2 6 3-2 1 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><text x="12" y="22.5" text-anchor="middle" font-size="5" font-weight="800" fill="currentColor">2</text>',
  mate3:   '<path d="M4 18h16M6 18l1-8 3 2 2-6 2 6 3-2 1 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><text x="12" y="22.5" text-anchor="middle" font-size="5" font-weight="800" fill="currentColor">3</text>',
  backRank:'<path d="M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 6v5M10 6h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="14" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  smother: '<path d="M9 17c0-3 1-5 2-7l-2-3c0-1 1-2 2-3 2 1 4 3 4 6 0 2-1 4-2 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="13" cy="8" r="0.8" fill="currentColor"/><path d="M7 20h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  // Tactics
  fork:    '<path d="M12 20V8M8 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="4" r="1.5" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="16" cy="4" r="1.5" fill="none" stroke="currentColor" stroke-width="1"/>',
  pin:     '<path d="M12 3v18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  skewer:  '<path d="M5 19L19 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="7" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  discover:'<path d="M12 4v8M8 16l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 20h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6 8l-3 3M18 8l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  dblCheck:'<path d="M4 12l4 4 8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12l4 4 6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>',
  sacrifice:'<path d="M12 2c-3 4-5 7-5 10a5 5 0 0010 0c0-3-2-6-5-10z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 14v4M10 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  deflect: '<path d="M5 5l7 7M12 12l7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 12v8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 17l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  decoy:   '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  clear:   '<path d="M5 12h14M16 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>',
  interf:  '<path d="M4 4l16 16M4 20l16-16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  intermez:'<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  xray:    '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M5.6 18.4l3.5-3.5M14.9 9.1l3.5-3.5" stroke="currentColor" stroke-width="1" opacity="0.5"/>',
  zugzwang:'<rect x="5" y="7" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 12l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  trapped: '<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5 9h14M9 5v14" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="12" cy="14" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  hanging: '<path d="M12 3v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="13" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 17l-2 4M14 17l2 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  exposed: '<path d="M12 2l8 4v5c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>',
  // Endgame
  endgame: '<rect x="4" y="4" width="16" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 8h16M4 12h16M4 16h16M8 4v16M12 4v16M16 4v16" stroke="currentColor" stroke-width="0.5" opacity="0.3"/>',
  // Evaluation
  crush:   '<path d="M8 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 18h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  advant:  '<path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  equal:   '<path d="M6 10h12M6 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  shield:  '<path d="M12 2l8 4v5c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  quiet:   '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>',
  // Special moves
  promote: '<path d="M12 20V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 12l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 4h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="4" r="1" fill="currentColor"/>',
  upromote:'<path d="M12 20V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 13l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 5l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5"/>',
  castle:  '<path d="M4 19h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 19V9h3V6h4v3h3v10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 12h3M17 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 10l2 2-2 2M22 10l-2 2 2 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>',
  enpass:  '<circle cx="10" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"/><path d="M13 11l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>',
  // Length
  short:   '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  long:    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
  vlong:   '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 5v7l5 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 4l1 3h-3" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>',
  one:     '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">1</text>',
};

export const PUZZLE_THEMES = [
  { id: 'mateIn1',         label: 'Mate in 1',        svg: I.mate1 },
  { id: 'mateIn2',         label: 'Mate in 2',        svg: I.mate2 },
  { id: 'mateIn3',         label: 'Mate in 3',        svg: I.mate3 },
  { id: 'mate',            label: 'Checkmate',         svg: I.crown },
  { id: 'backRankMate',    label: 'Back Rank',         svg: I.backRank },
  { id: 'smotheredMate',   label: 'Smothered Mate',    svg: I.smother },
  { id: 'fork',            label: 'Fork',              svg: I.fork },
  { id: 'pin',             label: 'Pin',               svg: I.pin },
  { id: 'skewer',          label: 'Skewer',            svg: I.skewer },
  { id: 'discoveredAttack',label: 'Discovered Attack',  svg: I.discover },
  { id: 'doubleCheck',     label: 'Double Check',      svg: I.dblCheck },
  { id: 'sacrifice',       label: 'Sacrifice',         svg: I.sacrifice },
  { id: 'deflection',      label: 'Deflection',        svg: I.deflect },
  { id: 'decoy',           label: 'Decoy',             svg: I.decoy },
  { id: 'clearance',       label: 'Clearance',         svg: I.clear },
  { id: 'interference',    label: 'Interference',      svg: I.interf },
  { id: 'intermezzo',      label: 'Intermezzo',        svg: I.intermez },
  { id: 'xRayAttack',      label: 'X-Ray Attack',      svg: I.xray },
  { id: 'zugzwang',        label: 'Zugzwang',          svg: I.zugzwang },
  { id: 'trappedPiece',    label: 'Trapped Piece',     svg: I.trapped },
  { id: 'hangingPiece',    label: 'Hanging Piece',     svg: I.hanging },
  { id: 'exposedKing',     label: 'Exposed King',      svg: I.exposed },
  { id: 'endgame',         label: 'Endgame',           svg: I.endgame },
  { id: 'pawnEndgame',     label: 'Pawn Endgame',      svg: I.pawn },
  { id: 'rookEndgame',     label: 'Rook Endgame',      svg: I.rook },
  { id: 'bishopEndgame',   label: 'Bishop Endgame',    svg: I.bishop },
  { id: 'knightEndgame',   label: 'Knight Endgame',    svg: I.knight },
  { id: 'queenEndgame',    label: 'Queen Endgame',     svg: I.queen },
  { id: 'crushing',        label: 'Crushing',          svg: I.crush },
  { id: 'advantage',       label: 'Advantage',         svg: I.advant },
  { id: 'equality',        label: 'Equality',          svg: I.equal },
  { id: 'defensiveMove',   label: 'Defense',           svg: I.shield },
  { id: 'quietMove',       label: 'Quiet Move',        svg: I.quiet },
  { id: 'promotion',       label: 'Promotion',         svg: I.promote },
  { id: 'underPromotion',  label: 'Under-Promotion',   svg: I.upromote },
  { id: 'castling',        label: 'Castling',          svg: I.castle },
  { id: 'enPassant',       label: 'En Passant',        svg: I.enpass },
  { id: 'short',           label: 'Short Puzzle',      svg: I.short },
  { id: 'long',            label: 'Long Puzzle',       svg: I.long },
  { id: 'veryLong',        label: 'Very Long',         svg: I.vlong },
  { id: 'oneMove',         label: 'One Move',          svg: I.one },
];

const THEME_SECTIONS = [
  {
    title: 'Checkmate Patterns',
    color: '#ff6b6b',
    ids: ['mateIn1', 'mateIn2', 'mateIn3', 'mate', 'backRankMate', 'smotheredMate'],
  },
  {
    title: 'Tactics',
    color: '#ffa94d',
    ids: [
      'fork', 'pin', 'skewer', 'discoveredAttack', 'doubleCheck', 'sacrifice',
      'deflection', 'decoy', 'clearance', 'interference', 'intermezzo',
      'xRayAttack', 'zugzwang', 'trappedPiece', 'hangingPiece', 'exposedKing',
    ],
  },
  {
    title: 'Endgame',
    color: '#a78bfa',
    ids: ['endgame', 'pawnEndgame', 'rookEndgame', 'bishopEndgame', 'knightEndgame', 'queenEndgame'],
  },
  {
    title: 'Evaluation',
    color: '#6fdc8c',
    ids: ['crushing', 'advantage', 'equality', 'defensiveMove', 'quietMove'],
  },
  {
    title: 'Special Moves',
    color: '#38bdf8',
    ids: ['promotion', 'underPromotion', 'castling', 'enPassant'],
  },
  {
    title: 'Length',
    color: '#c7c7c7',
    ids: ['short', 'long', 'veryLong', 'oneMove'],
  },
];

const THEME_MAP = Object.fromEntries(PUZZLE_THEMES.map((t) => [t.id, t]));

export default function ThemePicker({ selectedTheme, onSelectTheme }) {
  return (
    <div className={styles.themePicker}>
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

      {THEME_SECTIONS.map((section) => (
        <div key={section.title} className={styles.themeSection}>
          <span className={styles.themeSectionTitle} style={{ color: section.color }}>{section.title}</span>
          <div className={styles.themeGrid}>
            {section.ids.map((id) => {
              const theme = THEME_MAP[id];
              if (!theme) return null;
              const isActive = selectedTheme === id;
              return (
                <button
                  key={id}
                  className={`${styles.themeBtn} ${isActive ? styles.themeBtnActive : ''}`}
                  style={{ '--theme-color': section.color }}
                  onClick={() => onSelectTheme(id)}
                  title={theme.label}
                >
                  <span className={styles.themeBtnIcon}>
                    <svg viewBox="0 0 24 24" width="20" height="20" dangerouslySetInnerHTML={{ __html: theme.svg }} />
                  </span>
                  <span className={styles.themeBtnLabel}>{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
