import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setSoundEnabled, setSoundVolume } from '../utils/soundManager';

function blendColors(color1, color2, ratio) {
  const hex = (c) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

const RED = '#ff0000';
const YELLOW = '#ffff00';

const PIECE_SETS = [
  { name: 'Classic', path: 'piecesClassic/' },
  { name: 'Default', path: 'pieces/' },
  { name: 'Virtual', path: 'piecesVirtual/' },
  { name: 'Cartoon', path: 'piecesCartoon/' },
  { name: 'Wooden', path: 'piecesWooden/' },
  { name: 'Wooden2', path: 'piecesWooden2/' },
];

const THEMES = [
  {
    name: 'Default',
    clr1: '#ffffff', clr2: '#33b3a6',
    clr1c: blendColors('#ffffff', RED, 0.6), clr2c: blendColors('#33b3a6', RED, 0.6),
    clr1p: blendColors('#ffffff', YELLOW, 0.5), clr2p: blendColors('#33b3a6', YELLOW, 0.5),
    clr1x: blendColors('#ffffff', YELLOW, 0.5), clr2x: blendColors('#33b3a6', YELLOW, 0.5),
  },
  {
    name: 'Chess.com',
    clr1: '#EEEED2', clr2: '#769656',
    clr1c: '#F98A75', clr2c: '#BE5F35',
    clr1p: '#F6F682', clr2p: '#BAC949',
    clr1x: '#BAC949', clr2x: '#FFFA5C',
  },
  {
    name: 'Lichess',
    clr1: '#F0D9B7', clr2: '#B58763',
    clr1c: '#EA4334', clr2c: '#DB3423',
    clr1p: '#CFD17B', clr2p: '#ACA249',
    clr1x: '#87986A', clr2x: '#6A6F42',
  },
];

const useThemeStore = create(persist((set, get) => ({
  pieceSets: PIECE_SETS,
  themes: THEMES,
  pieceSetIndex: 0,
  themeIndex: 0,
  clr1: THEMES[0].clr1,
  clr2: THEMES[0].clr2,
  clr1c: THEMES[0].clr1c,
  clr2c: THEMES[0].clr2c,
  clr1p: THEMES[0].clr1p,
  clr2p: THEMES[0].clr2p,
  clr1x: THEMES[0].clr1x,
  clr2x: THEMES[0].clr2x,

  soundEnabled: true,
  soundVolume: 0.8,

  setSoundEnabled: (enabled) => {
    setSoundEnabled(enabled);
    set({ soundEnabled: enabled });
  },

  setSoundVolume: (vol) => {
    setSoundVolume(vol);
    set({ soundVolume: vol });
  },

  get imagePath() {
    const { pieceSetIndex } = get();
    return `./images/${PIECE_SETS[pieceSetIndex].path}`;
  },

  setPieceSet: (index) => set({ pieceSetIndex: index }),

  applyTheme: (index) => {
    const theme = THEMES[index];
    set({
      themeIndex: index,
      clr1: theme.clr1, clr2: theme.clr2,
      clr1c: theme.clr1c, clr2c: theme.clr2c,
      clr1p: theme.clr1p, clr2p: theme.clr2p,
      clr1x: theme.clr1x, clr2x: theme.clr2x,
    });
  },

  setColor: (key, value) => set({ [key]: value }),

  resetDefault: () => {
    const theme = THEMES[0];
    set({
      themeIndex: 0,
      pieceSetIndex: 0,
      clr1: theme.clr1, clr2: theme.clr2,
      clr1c: theme.clr1c, clr2c: theme.clr2c,
      clr1p: theme.clr1p, clr2p: theme.clr2p,
      clr1x: theme.clr1x, clr2x: theme.clr2x,
    });
  },
}), { name: 'chess-theme' }));

export default useThemeStore;
