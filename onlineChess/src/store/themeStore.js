import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSoundEnabled, setSoundVolume, setSoundTheme as setSoundThemeInManager } from '../utils/soundManager';
import { PIECE_SETS, BOARD_THEMES, getPieceSetById, getBoardThemeById } from '../data/assetRegistry';

// Old local piece sets for backward compat with consumers that still read pieceSets[index]
const LEGACY_PIECE_SETS = [
  { name: 'Classic', path: 'piecesClassic/' },
  { name: 'Default', path: 'pieces/' },
  { name: 'Virtual', path: 'piecesVirtual/' },
  { name: 'Cartoon', path: 'piecesCartoon/' },
  { name: 'Wooden', path: 'piecesWooden/' },
  { name: 'Wooden2', path: 'piecesWooden2/' },
];

const LEGACY_THEMES = [
  { name: 'Default', id: 'color-default' },
  { name: 'Chess.com', id: 'color-chesscom' },
  { name: 'Lichess', id: 'color-lichess' },
];

const DEFAULT_BOARD = getBoardThemeById('color-default');

const useThemeStore = create(persist((set, get) => ({
  // ── New string-ID based selection ──
  pieceSetId: 'local-classic',
  boardThemeId: 'color-default',
  soundThemeId: 'synth-default',

  // Board theme type (for Cell.jsx to know if it should be transparent)
  boardThemeType: 'color',
  boardImageUrl: null,

  // ── Active board colors (flat, for Cell.jsx backward compat) ──
  clr1: DEFAULT_BOARD.clr1, clr2: DEFAULT_BOARD.clr2,
  clr1c: DEFAULT_BOARD.clr1c, clr2c: DEFAULT_BOARD.clr2c,
  clr1p: DEFAULT_BOARD.clr1p, clr2p: DEFAULT_BOARD.clr2p,
  clr1x: DEFAULT_BOARD.clr1x, clr2x: DEFAULT_BOARD.clr2x,

  // ── Legacy compat properties (for components not yet migrated) ──
  pieceSets: LEGACY_PIECE_SETS,
  themes: LEGACY_THEMES,
  pieceSetIndex: 0,
  themeIndex: 0,

  // ── Sound settings ──
  soundEnabled: true,
  soundVolume: 0.8,
  soundToggles: {
    move: true, capture: true, check: true, castle: true,
    promote: true, gameStart: true, gameEnd: true, lowTime: true, illegal: true,
  },

  // ── Actions: Piece Set ──
  setPieceSet: (indexOrId) => {
    if (typeof indexOrId === 'number') {
      // Legacy numeric index — map to string ID
      const localIds = ['local-classic', 'local-default', 'local-virtual', 'local-cartoon', 'local-wooden', 'local-wooden2'];
      set({ pieceSetIndex: indexOrId, pieceSetId: localIds[indexOrId] || 'local-classic' });
    } else {
      // New string ID
      const ps = getPieceSetById(indexOrId);
      // For legacy compat, try to find a matching local index
      const localIdx = LEGACY_PIECE_SETS.findIndex(l => ps.source === 'local' && `./images/${l.path}` === `./images/${ps.path}`);
      set({ pieceSetId: indexOrId, pieceSetIndex: localIdx >= 0 ? localIdx : 0 });
    }
  },

  // ── Actions: Board Theme ──
  applyBoardTheme: (id) => {
    const theme = getBoardThemeById(id);
    const legacyIdx = LEGACY_THEMES.findIndex(t => t.id === id);
    set({
      boardThemeId: id,
      boardThemeType: theme.type,
      boardImageUrl: theme.imageUrl || null,
      themeIndex: legacyIdx >= 0 ? legacyIdx : -1,
      clr1: theme.clr1 || 'transparent', clr2: theme.clr2 || 'transparent',
      clr1c: theme.clr1c, clr2c: theme.clr2c,
      clr1p: theme.clr1p, clr2p: theme.clr2p,
      clr1x: theme.clr1x, clr2x: theme.clr2x,
    });
  },

  // Legacy applyTheme by index (for backward compat)
  applyTheme: (indexOrId) => {
    if (typeof indexOrId === 'string') {
      get().applyBoardTheme(indexOrId);
    } else {
      const id = LEGACY_THEMES[indexOrId]?.id || 'color-default';
      get().applyBoardTheme(id);
    }
  },

  setColor: (key, value) => set({ [key]: value }),

  // ── Actions: Sound ──
  setSoundTheme: (themeId) => {
    setSoundThemeInManager(themeId);
    set({ soundThemeId: themeId });
  },

  setSoundEnabled: (enabled) => {
    setSoundEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  setSoundVolume: (vol) => {
    setSoundVolume(vol);
    set({ soundVolume: vol });
  },

  setSoundToggle: (name, enabled) => set(state => ({
    soundToggles: { ...state.soundToggles, [name]: enabled },
  })),

  // ── Reset ──
  resetDefault: () => {
    const theme = getBoardThemeById('color-default');
    set({
      pieceSetId: 'local-classic',
      pieceSetIndex: 0,
      boardThemeId: 'color-default',
      boardThemeType: 'color',
      boardImageUrl: null,
      themeIndex: 0,
      clr1: theme.clr1, clr2: theme.clr2,
      clr1c: theme.clr1c, clr2c: theme.clr2c,
      clr1p: theme.clr1p, clr2p: theme.clr2p,
      clr1x: theme.clr1x, clr2x: theme.clr2x,
      soundEnabled: true,
      soundVolume: 0.8,
      soundThemeId: 'synth-default',
      soundToggles: {
        move: true, capture: true, check: true, castle: true,
        promote: true, gameStart: true, gameEnd: true, lowTime: true, illegal: true,
      },
    });
    setSoundThemeInManager('synth-default');
  },
}), {
  name: 'chess-theme',
  version: 2,
  migrate: (persisted, version) => {
    if (version < 2) {
      // Map old numeric indices to new string IDs
      const localIds = ['local-classic', 'local-default', 'local-virtual', 'local-cartoon', 'local-wooden', 'local-wooden2'];
      const boardIds = ['color-default', 'color-chesscom', 'color-lichess'];
      const oldSoundTheme = persisted.soundTheme || 'default';
      return {
        ...persisted,
        pieceSetId: localIds[persisted.pieceSetIndex ?? 0] || 'local-classic',
        boardThemeId: boardIds[persisted.themeIndex ?? 0] || 'color-default',
        boardThemeType: 'color',
        boardImageUrl: null,
        soundThemeId: `synth-${oldSoundTheme}`,
      };
    }
    return persisted;
  },
}));

export default useThemeStore;
