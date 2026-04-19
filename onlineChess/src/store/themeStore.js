import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSoundEnabled, setSoundVolume, setSoundTheme as setSoundThemeInManager } from '../utils/soundManager';
import { PIECE_SETS, BOARD_THEMES, getPieceSetById, getBoardThemeById } from '../data/assetRegistry';
import { supabase } from '../utils/supabase';

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
  soundThemeId: 'cc-sound-default',

  // Board theme type (for Cell.jsx to know if it should be transparent)
  boardThemeType: 'color',
  boardImageUrl: null,
  boardImageFailed: false,

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

  // ── App theme mode & background ──
  themeMode: 'dark',   // 'dark' | 'light'
  bgTheme: 'default',  // 'default' | 'wood' | 'ocean' | 'forest' | 'slate'

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
      boardImageFailed: false,
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

  setBoardImageFailed: (val) => set({ boardImageFailed: val }),
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

  // ── Actions: App Theme Mode & Background ──
  applyThemeToDOM: () => {
    const { themeMode, bgTheme } = get();
    const el = document.documentElement;
    el.setAttribute('data-theme', themeMode);
    if (bgTheme && bgTheme !== 'default') el.setAttribute('data-bg', bgTheme);
    else el.removeAttribute('data-bg');
  },

  setThemeMode: (mode, userId) => {
    set({ themeMode: mode });
    get().applyThemeToDOM();
    if (userId) {
      supabase.from('user_profiles').update({ theme_mode: mode }).eq('user_id', userId)
        .then(({ error }) => {});
    }
  },

  setBgTheme: (bg, userId) => {
    set({ bgTheme: bg });
    get().applyThemeToDOM();
    if (userId) {
      supabase.from('user_profiles').update({ bg_theme: bg }).eq('user_id', userId)
        .then(({ error }) => {});
    }
  },

  loadThemeFromProfile: async (userId) => {
    if (!userId) return;
    const { data } = await supabase.from('user_profiles').select('theme_mode, bg_theme').eq('user_id', userId).single();
    if (data) {
      if (data.theme_mode) set({ themeMode: data.theme_mode });
      if (data.bg_theme) set({ bgTheme: data.bg_theme });
      get().applyThemeToDOM();
    }
  },

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
      soundThemeId: 'cc-sound-default',
      soundToggles: {
        move: true, capture: true, check: true, castle: true,
        promote: true, gameStart: true, gameEnd: true, lowTime: true, illegal: true,
      },
      themeMode: 'dark',
      bgTheme: 'default',
    });
    setSoundThemeInManager('cc-sound-default');
    get().applyThemeToDOM();
  },
}), {
  name: 'chess-theme',
  version: 3,
  migrate: (persisted, version) => {
    if (version < 2) {
      const localIds = ['local-classic', 'local-default', 'local-virtual', 'local-cartoon', 'local-wooden', 'local-wooden2'];
      const boardIds = ['color-default', 'color-chesscom', 'color-lichess'];
      persisted = {
        ...persisted,
        pieceSetId: localIds[persisted.pieceSetIndex ?? 0] || 'local-classic',
        boardThemeId: boardIds[persisted.themeIndex ?? 0] || 'color-default',
        boardThemeType: 'color',
        boardImageUrl: null,
        soundThemeId: 'cc-sound-default',
      };
    }
    // Migrate synth themes to CDN default
    if (persisted.soundThemeId?.startsWith('synth-')) {
      persisted = { ...persisted, soundThemeId: 'cc-sound-default' };
    }
    // Fix transparent board: image theme with no URL → reset to color
    if (persisted.boardThemeType === 'image' && !persisted.boardImageUrl) {
      persisted.boardThemeType = 'color';
    }
    if (!persisted.boardThemeType) {
      persisted.boardThemeType = 'color';
    }
    // Ensure new theme fields exist
    if (!persisted.themeMode) persisted.themeMode = 'dark';
    if (!persisted.bgTheme) persisted.bgTheme = 'default';
    return persisted;
  },
}));

export default useThemeStore;

const FALLBACK_LIGHT = '#EEEED2';
const FALLBACK_DARK  = '#769656';

export function cellStyle(isLight, bgColor, isImageTheme, boardImageUrl, hasHighlight) {
  if (isImageTheme && !hasHighlight) {
    return { backgroundColor: 'transparent' };
  }
  if (isImageTheme && hasHighlight) {
    return { backgroundColor: bgColor };
  }
  return { backgroundColor: bgColor };
}

export function boardContainerStyle(isImageTheme, boardImageUrl) {
  if (isImageTheme && boardImageUrl) {
    return {
      backgroundImage: `url(${boardImageUrl})`,
      backgroundSize: '100% 100%',
    };
  }
  return undefined;
}

export function useBoardColors() {
  const s = useThemeStore();
  const isImage = s.boardThemeType === 'image' && !!s.boardImageUrl && !s.boardImageFailed;
  const needsFallback = isImage || s.clr1 === 'transparent';
  return {
    clr1: needsFallback ? FALLBACK_LIGHT : s.clr1,
    clr2: needsFallback ? FALLBACK_DARK  : s.clr2,
    clr1p: needsFallback ? 'rgba(255,255,50,0.32)' : s.clr1p,
    clr2p: needsFallback ? 'rgba(255,255,50,0.32)' : s.clr2p,
    clr1x: needsFallback ? 'rgba(255,255,50,0.42)' : s.clr1x,
    clr2x: needsFallback ? 'rgba(255,255,50,0.42)' : s.clr2x,
    clr1c: needsFallback ? 'rgba(235,97,80,0.72)'  : s.clr1c,
    clr2c: needsFallback ? 'rgba(235,97,80,0.72)'  : s.clr2c,
    isImageTheme: isImage,
    boardImageUrl: s.boardImageUrl,
    boardThemeType: s.boardThemeType,
  };
}
