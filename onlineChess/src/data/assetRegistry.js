/**
 * Asset Registry — all piece sets, board themes, and sound themes
 * from local assets, chess.com CDN, and lichess CDN.
 */

// ═══════════════════════════════════════════════════
// Helper: blend two hex colors
// ═══════════════════════════════════════════════════
function blend(c1, c2, r) {
  const h = c => parseInt(c, 16);
  const [r1, g1, b1] = [h(c1.slice(1,3)), h(c1.slice(3,5)), h(c1.slice(5,7))];
  const [r2, g2, b2] = [h(c2.slice(1,3)), h(c2.slice(3,5)), h(c2.slice(5,7))];
  const f = (a, b) => Math.round(a + (b - a) * r).toString(16).padStart(2, '0');
  return `#${f(r1,r2)}${f(g1,g2)}${f(b1,b2)}`;
}

function deriveColors(clr1, clr2) {
  return {
    clr1, clr2,
    clr1c: blend(clr1, '#ff0000', 0.55), clr2c: blend(clr2, '#ff0000', 0.55),
    clr1p: blend(clr1, '#ffff00', 0.45), clr2p: blend(clr2, '#ffff00', 0.45),
    clr1x: blend(clr1, '#ffff00', 0.5),  clr2x: blend(clr2, '#ffff00', 0.5),
  };
}

// Image theme overlay colors (semi-transparent, work over any background)
const IMG_OVERLAYS = {
  clr1c: 'rgba(235,97,80,0.72)', clr2c: 'rgba(235,97,80,0.72)',
  clr1p: 'rgba(255,255,50,0.32)', clr2p: 'rgba(255,255,50,0.32)',
  clr1x: 'rgba(255,255,50,0.42)', clr2x: 'rgba(255,255,50,0.42)',
};

// ═══════════════════════════════════════════════════
// PIECE SETS (82 total)
// ═══════════════════════════════════════════════════
const CC_PIECES = [
  'neo','classic','wood','bases','icy_sea','neo_wood','glass','game_room',
  'alpha','marble','lolz','3d_chesskid','3d_staunton','3d_wood','3d_plastic',
  'blindfold','modern','bubblegum','graffiti','light','tournament','metal',
  'gothic','dash','ocean','tigers','nature','neon','sky','book','condal',
  'newspaper','8_bit','cases','club','luca','maya','vintage',
];

const LI_PIECES = [
  'cburnett','merida','alpha','pirouetti','chessnut','chess7','reillycraig',
  'companion','riohacha','kosal','leipzig','fantasy','spatial','celtic',
  'california','caliente','pixel','firi','rhosgfx','maestro','fresca',
  'cardinal','gioco','tatiana','staunty','cooke','governor','dubrovny',
  'shahi-ivory-brown','icpieces','mpchess','kiwen-suwi','horsey','anarcandy',
  'xkcd','shapes','letter','disguised',
];

function titleCase(s) {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    .replace(/3d /gi, '3D ').replace(/8 Bit/i, '8-Bit').replace(/Icy Sea/i, 'Icy Sea')
    .replace(/Neo Wood/i, 'Neo Wood');
}

export const PIECE_SETS = [
  // Local
  { id: 'local-classic',  name: 'Classic',  source: 'local', path: 'piecesClassic/', category: 'Local' },
  { id: 'local-default',  name: 'Default',  source: 'local', path: 'pieces/',        category: 'Local' },
  { id: 'local-virtual',  name: 'Virtual',  source: 'local', path: 'piecesVirtual/', category: 'Local' },
  { id: 'local-cartoon',  name: 'Cartoon',  source: 'local', path: 'piecesCartoon/', category: 'Local' },
  { id: 'local-wooden',   name: 'Wooden',   source: 'local', path: 'piecesWooden/',  category: 'Local' },
  { id: 'local-wooden2',  name: 'Wooden 2', source: 'local', path: 'piecesWooden2/', category: 'Local' },
  // Chess.com
  ...CC_PIECES.map(s => ({ id: `cc-${s}`, name: titleCase(s), source: 'chesscom', slug: s, category: 'Chess.com' })),
  // Lichess
  ...LI_PIECES.map(s => ({ id: `li-${s}`, name: titleCase(s), source: 'lichess', slug: s, category: 'Lichess' })),
];

// ═══════════════════════════════════════════════════
// BOARD THEMES (54 total)
// ═══════════════════════════════════════════════════
export const BOARD_THEMES = [
  // ── Existing color themes ──
  {
    id: 'color-default', name: 'Default', type: 'color', category: 'Classic',
    ...deriveColors('#ffffff', '#33b3a6'),
  },
  {
    id: 'color-chesscom', name: 'Chess.com', type: 'color', category: 'Classic',
    clr1: '#EEEED2', clr2: '#769656',
    clr1c: '#F98A75', clr2c: '#BE5F35', clr1p: '#F6F682', clr2p: '#BAC949', clr1x: '#BAC949', clr2x: '#FFFA5C',
  },
  {
    id: 'color-lichess', name: 'Lichess', type: 'color', category: 'Classic',
    clr1: '#F0D9B7', clr2: '#B58763',
    clr1c: '#EA4334', clr2c: '#DB3423', clr1p: '#CFD17B', clr2p: '#ACA249', clr1x: '#87986A', clr2x: '#6A6F42',
  },

  // ── Lichess CSS color themes ──
  { id: 'li-brown',         name: 'Brown',         type: 'color', category: 'Lichess', ...deriveColors('#f0d9b5', '#b58863') },
  { id: 'li-blue',          name: 'Blue',          type: 'color', category: 'Lichess', ...deriveColors('#dee3e6', '#8ca2ad') },
  { id: 'li-green',         name: 'Green',         type: 'color', category: 'Lichess', ...deriveColors('#ffffdd', '#86a666') },
  { id: 'li-purple',        name: 'Purple',        type: 'color', category: 'Lichess', ...deriveColors('#9f90b0', '#7d4a8d') },
  { id: 'li-ic',            name: 'IC',            type: 'color', category: 'Lichess', ...deriveColors('#ececec', '#c1c18e') },
  { id: 'li-canvas',        name: 'Canvas',        type: 'color', category: 'Lichess', ...deriveColors('#d7c8a0', '#947a56') },
  { id: 'li-newspaper',     name: 'Newspaper',     type: 'color', category: 'Lichess', ...deriveColors('#ffffff', '#cccccc') },
  { id: 'li-green-plastic', name: 'Green Plastic', type: 'color', category: 'Lichess', ...deriveColors('#f2f9e0', '#5a9e42') },
  { id: 'li-purple-diag',   name: 'Purple Diag',   type: 'color', category: 'Lichess', ...deriveColors('#e5daf0', '#957ab0') },
  { id: 'li-pink',          name: 'Pink',          type: 'color', category: 'Lichess', ...deriveColors('#f0d8d8', '#c87e7e') },

  // ── Chess.com image boards ──
  ...['green','brown','blue','icy_sea','walnut','marble','tournament','bubblegum',
      'dark_wood','glass','lolz','red','purple','orange','tan','newspaper','metal',
      'parchment','neon','sky','8_bit','bases','sand','stone','translucent','burled_wood',
  ].map(s => ({
    id: `cc-board-${s}`, name: titleCase(s), type: 'image', category: 'Chess.com',
    imageUrl: `https://images.chesscomfiles.com/chess-themes/boards/${s}/150.png`,
    ...IMG_OVERLAYS,
  })),

  // ── Lichess image boards ──
  ...['horsey','wood','wood2','wood3','wood4','maple','maple2','marble',
      'leather','blue2','blue3','blue-marble','grey','metal','olive',
  ].map(s => ({
    id: `li-board-${s}`, name: titleCase(s), type: 'image', category: 'Lichess',
    imageUrl: `https://lichess1.org/assets/images/board/${s}.jpg`,
    ...IMG_OVERLAYS,
  })),
];

// ═══════════════════════════════════════════════════
// SOUND THEMES (21 total)
// ═══════════════════════════════════════════════════

// Sound event → file mapping per source
const CC_SOUND_MAP = {
  move: 'move-self', capture: 'capture', check: 'move-check', castle: 'castle',
  promote: 'promote', gameStart: 'game-start', gameEnd: 'game-end',
  lowTime: 'tenseconds', illegal: 'illegal',
};

const LI_SOUND_MAP = {
  move: 'Move', capture: 'Capture', check: 'Check', castle: 'Move',
  promote: 'Confirmation', gameStart: 'GenericNotify', gameEnd: 'Victory',
  lowTime: 'LowTime', illegal: 'Error',
};

export const SOUND_THEMES = [
  // Synthesized
  { id: 'synth-default', name: 'Default',  source: 'synth', key: 'default', category: 'Synthesized' },
  { id: 'synth-marble',  name: 'Marble',   source: 'synth', key: 'marble',  category: 'Synthesized' },
  { id: 'synth-wood',    name: 'Wood',     source: 'synth', key: 'wood',    category: 'Synthesized' },
  { id: 'synth-metal',   name: 'Metal',    source: 'synth', key: 'metal',   category: 'Synthesized' },
  { id: 'synth-glass',   name: 'Glass',    source: 'synth', key: 'glass',   category: 'Synthesized' },
  { id: 'synth-retro',   name: 'Retro',    source: 'synth', key: 'retro',   category: 'Synthesized' },
  // Chess.com CDN
  ...['default','marble','metal','nature','newspaper','silly','space','lolz','beat'].map(s => ({
    id: `cc-sound-${s}`, name: titleCase(s), source: 'chesscom', slug: s, category: 'Chess.com',
  })),
  // Lichess CDN
  ...['standard','piano','nes','sfx','futuristic','robot'].map(s => ({
    id: `li-sound-${s}`, name: titleCase(s), source: 'lichess', slug: s, category: 'Lichess',
  })),
];

// ═══════════════════════════════════════════════════
// Lookup helpers
// ═══════════════════════════════════════════════════
export function getPieceSetById(id) {
  return PIECE_SETS.find(p => p.id === id) || PIECE_SETS[0];
}

export function getBoardThemeById(id) {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}

export function getSoundThemeById(id) {
  return SOUND_THEMES.find(s => s.id === id) || SOUND_THEMES[0];
}

export function getCategories(items) {
  const cats = [...new Set(items.map(i => i.category))];
  return cats;
}

/**
 * Build CDN URL for a specific sound event in a CDN theme.
 */
export function getSoundUrl(theme, soundEvent) {
  if (theme.source === 'chesscom') {
    const file = CC_SOUND_MAP[soundEvent];
    return file ? `https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/${theme.slug}/${file}.mp3` : null;
  }
  if (theme.source === 'lichess') {
    const file = LI_SOUND_MAP[soundEvent];
    return file ? `https://lichess1.org/assets/sound/${theme.slug}/${file}.mp3` : null;
  }
  return null;
}
