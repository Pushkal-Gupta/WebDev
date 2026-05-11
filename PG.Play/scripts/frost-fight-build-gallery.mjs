// Build a human-readable gallery of every Frost Fight image asset.
//
// Copies (does not move) all sprites from src/games/frost-fight/sprites/
// into ./frost-fight-gallery/ at the repo root, organised by theme/role
// and renamed so a human can browse them without thinking about
// engine names like "attackRelease-3.png".
//
// Run: node scripts/frost-fight-build-gallery.mjs
//
// The gallery is a snapshot — it doesn't watch the source folder. Re-run
// to refresh after adding new sprites.

import { mkdirSync, copyFileSync, rmSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO       = resolve(__dirname, '..');
const SRC        = join(REPO, 'src/games/frost-fight/sprites');
const OUT        = join(REPO, 'frost-fight-gallery');

// ------------------------------------------------------------
// Naming maps
// ------------------------------------------------------------

// Engine action label → human label used in filenames.
const ACTION_LABEL = {
  walk:           'walking',
  attackCharge:   'charging-ice-blast',
  attackRelease:  'blowing-ice',
  death:          'defeated',
};

// Per-character profile: which theme they're used in, plus a friendly
// folder name. The order here also drives the numeric prefix on the
// folders so similar characters group together when sorted.
const CHARACTERS = [
  // Cold / Pantry
  { key: 'orange',     theme: 'Cold',     friendly: 'orange-bot',     order: 1 },
  { key: 'strawberry', theme: 'Cold',     friendly: 'strawberry-bot', order: 2 },
  { key: 'cherry',     theme: 'Cold',     friendly: 'cherry-bot',     order: 3 },
  // Orchard
  { key: 'grape',      theme: 'Orchard',  friendly: 'grape-bot',      order: 4 },
  // Harvest
  { key: 'apple',      theme: 'Harvest',  friendly: 'apple-bot',      order: 5 },
  { key: 'kiwi',       theme: 'Harvest',  friendly: 'kiwi-bot',       order: 6 },
  { key: 'lemon',      theme: 'Harvest',  friendly: 'lemon-bot',      order: 7 },
  { key: 'peach',      theme: 'Harvest',  friendly: 'peach-bot',      order: 8 },
  { key: 'pineapple',  theme: 'Harvest',  friendly: 'pineapple-bot',  order: 9 },
  // Trinkets (the curio shop)
  { key: 'candle',     theme: 'Trinkets', friendly: 'candle-mimic',   order: 10 },
  { key: 'teapot',     theme: 'Trinkets', friendly: 'teapot-mimic',   order: 11 },
  { key: 'lamp',       theme: 'Trinkets', friendly: 'lamp-mimic',     order: 12 },
  { key: 'chest',      theme: 'Trinkets', friendly: 'chest-mimic',    order: 13 },
];

// Walls grouped by theme. Each entry: filename → friendly label.
const WALLS = {
  Cold: {
    'pantry.png':      'pantry-shelves',
    'coldroom.png':    'cold-room-tile',
    'aisle.png':       'aisle-paneling',
    'walkin.png':      'walk-in-freezer-door',
    'loadingdock.png': 'loading-dock-corrugated',
    'subbasement.png': 'sub-basement-stone',
  },
  Orchard: {
    'orchard-bark.png':         'tree-bark',
    'orchard-basket.png':       'wicker-basket',
    'orchard-mossdeep.png':     'deep-moss',
    'orchard-mosspebbles.png':  'mossy-pebbles',
    'orchard-stones.png':       'orchard-stones',
    'orchard-wood.png':         'plank-wood',
    'orchard-woodvines.png':    'vine-covered-wood',
  },
  Trinkets: {
    'trinket-damask.png':  'damask-wallpaper',
    'trinket-hearth.png':  'hearth-brick',
    'trinket-tile.png':    'painted-tile',
    'trinket-vault.png':   'vault-stone',
  },
};

// Floors are Trinkets-only (others fall back to a gradient).
const FLOORS = {
  Trinkets: {
    'trinket-marble-green.png':    'marble-green',
    'trinket-marble-white.png':    'marble-white',
    'trinket-mosaic-blue.png':     'mosaic-blue',
    'trinket-mosaic-orange.png':   'mosaic-orange',
    'trinket-parquet-herring.png': 'parquet-herringbone',
    'trinket-parquet-square.png':  'parquet-squares',
    'trinket-persian-large.png':   'persian-rug-large',
    'trinket-persian-small.png':   'persian-rug-small',
  },
};

// Loose top-level sprites: filename → { folder, friendly }.
const LOOSE_SPRITES = {
  // Player skins
  'player.png':              { folder: 'player-skins',     friendly: 'player-1-default' },
  'player-2.png':             { folder: 'player-skins',     friendly: 'player-2-coop'    },

  // Pickups / fruits
  'apple-fruit.png':          { folder: 'pickups-fruits',   friendly: 'fruit-apple'      },
  'cherry-fruit.png':         { folder: 'pickups-fruits',   friendly: 'fruit-cherry'     },
  'kiwi-fruit.png':           { folder: 'pickups-fruits',   friendly: 'fruit-kiwi'       },
  'lemon-fruit.png':          { folder: 'pickups-fruits',   friendly: 'fruit-lemon'      },
  'fruit.png':                { folder: 'pickups-fruits',   friendly: 'fruit-strawberry-pickup' },
  'peach.png':                { folder: 'pickups-fruits',   friendly: 'fruit-peach-bonus' },

  // Misc tiles
  'ice.png':                  { folder: 'tiles-misc',       friendly: 'ice-block'        },
  'exit.png':                 { folder: 'tiles-misc',       friendly: 'exit-door'        },

  // Cover art
  'cover.webp':               { folder: 'cover-art',        friendly: 'frost-fight-cover-large' },
  'cover-640.webp':           { folder: 'cover-art',        friendly: 'frost-fight-cover-small' },

  // Legacy single-image bots (not used in current rosters but archived
  // so the gallery is complete).
  'banana-bot.png':           { folder: 'legacy-bots',      friendly: 'banana-bot-legacy'      },
  'blueberry.png':            { folder: 'legacy-bots',      friendly: 'blueberry-bot-rest'     },
  'blueberry-windup.png':     { folder: 'legacy-bots',      friendly: 'blueberry-bot-windup'   },
  'cherry.png':               { folder: 'legacy-bots',      friendly: 'cherry-bot-rest-legacy' },
  'cherry-windup.png':        { folder: 'legacy-bots',      friendly: 'cherry-bot-windup-legacy' },
  'cherrybomb-bot.png':       { folder: 'legacy-bots',      friendly: 'cherry-bomb-bot'        },
  'eggplant-bot.png':         { folder: 'legacy-bots',      friendly: 'eggplant-bot'           },
  'grape-bot.png':            { folder: 'legacy-bots',      friendly: 'grape-bot-rest-legacy'  },
  'grape-windup.png':         { folder: 'legacy-bots',      friendly: 'grape-bot-windup-legacy' },
  'icecream-sandwich.png':    { folder: 'legacy-bots',      friendly: 'icecream-sandwich-bot'  },
  'icecream-sundae.png':      { folder: 'legacy-bots',      friendly: 'icecream-sundae-bot'    },
  'icecream-triple.png':      { folder: 'legacy-bots',      friendly: 'icecream-triple-bot'    },
  'icecream-vanilla.png':     { folder: 'legacy-bots',      friendly: 'icecream-vanilla-bot'   },
  'kiwi-windup.png':          { folder: 'legacy-bots',      friendly: 'kiwi-bot-windup-legacy' },
  'melon-bot.png':            { folder: 'legacy-bots',      friendly: 'melon-bot'              },
  'orange.png':               { folder: 'legacy-bots',      friendly: 'orange-bot-rest-legacy' },
  'orange-windup.png':        { folder: 'legacy-bots',      friendly: 'orange-bot-windup-legacy' },
  'plum-bot.png':             { folder: 'legacy-bots',      friendly: 'plum-bot'               },
  'strawberry.png':           { folder: 'legacy-bots',      friendly: 'strawberry-bot-rest-legacy' },
  'strawberry-windup.png':    { folder: 'legacy-bots',      friendly: 'strawberry-bot-windup-legacy' },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function ensureDir(p) { mkdirSync(p, { recursive: true }); }

function pad2(n) { return String(n).padStart(2, '0'); }

function copy(srcPath, destPath) {
  if (!existsSync(srcPath)) {
    console.warn(`MISS  ${srcPath}`);
    return false;
  }
  ensureDir(dirname(destPath));
  copyFileSync(srcPath, destPath);
  return true;
}

// Emit one character's full atlas into characters/<order>-<friendly>/.
// Frames are renamed to <action-label>-<frame-1based>.png so a viewer
// sees "blowing-ice-1.png … blowing-ice-6.png" instead of
// "attackRelease-0.png … attackRelease-5.png".
function emitCharacter(c) {
  const folder = join(OUT, 'characters', `${pad2(c.order)}-${c.friendly}`);
  const animDir = join(SRC, 'anim', c.key);
  if (!existsSync(animDir)) {
    console.warn(`MISS  atlas ${animDir}`);
    return;
  }
  const files = readdirSync(animDir).filter((f) => f.endsWith('.png'));
  // Group by action so we can renumber within each.
  const byAction = {};
  for (const f of files) {
    const m = f.match(/^([a-zA-Z]+)-(\d+)\.png$/);
    if (!m) continue;
    const [, action, idx] = m;
    (byAction[action] ||= []).push({ file: f, idx: Number(idx) });
  }
  for (const action of Object.keys(byAction)) {
    byAction[action].sort((a, b) => a.idx - b.idx);
    const label = ACTION_LABEL[action] || action;
    byAction[action].forEach(({ file }, i) => {
      const dest = join(folder, `${label}-${i + 1}.png`);
      copy(join(animDir, file), dest);
    });
  }
}

function emitWalls() {
  for (const [theme, map] of Object.entries(WALLS)) {
    for (const [src, friendly] of Object.entries(map)) {
      copy(
        join(SRC, 'walls', src),
        join(OUT, 'walls', theme.toLowerCase(), `${friendly}.png`),
      );
    }
  }
}

function emitFloors() {
  for (const [theme, map] of Object.entries(FLOORS)) {
    for (const [src, friendly] of Object.entries(map)) {
      copy(
        join(SRC, 'floors', src),
        join(OUT, 'floors', theme.toLowerCase(), `${friendly}.png`),
      );
    }
  }
}

function emitLoose() {
  for (const [src, { folder, friendly }] of Object.entries(LOOSE_SPRITES)) {
    const ext = src.split('.').pop();
    copy(
      join(SRC, src),
      join(OUT, folder, `${friendly}.${ext}`),
    );
  }
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------

console.log(`Building gallery at ${OUT}`);
if (existsSync(OUT)) {
  rmSync(OUT, { recursive: true, force: true });
}
ensureDir(OUT);

let charCount = 0;
for (const c of CHARACTERS) {
  emitCharacter(c);
  charCount += 1;
}
emitWalls();
emitFloors();
emitLoose();

writeFileSync(join(OUT, 'README.md'), [
  '# Frost Fight — Sprite Gallery',
  '',
  'Auto-generated by `scripts/frost-fight-build-gallery.mjs`. Source of',
  'truth lives at `src/games/frost-fight/sprites/`; this folder is a',
  'human-readable mirror so you can browse every asset without thinking',
  'about engine filenames.',
  '',
  '## Layout',
  '',
  '- `characters/<NN>-<bot>/` — one folder per animated bot. Frames renamed:',
  '  - `walking-1.png … walking-N.png`',
  '  - `charging-ice-blast-1.png … charging-ice-blast-N.png`',
  '  - `blowing-ice-1.png … blowing-ice-N.png`',
  '  - `defeated-1.png … defeated-N.png`',
  '- `walls/<theme>/` — wall textures, one folder per theme.',
  '- `floors/<theme>/` — floor textures (Trinkets only).',
  '- `pickups-fruits/` — fruit + bonus pickups drawn on the floor.',
  '- `tiles-misc/` — ice block, exit door, and other one-off tiles.',
  '- `player-skins/` — player 1 / player 2 sprites.',
  '- `cover-art/` — the lobby cover image (large + small).',
  '- `legacy-bots/` — older single-image bot art kept for reference.',
  '',
  '## Themes',
  '',
  '- **Cold** — Pantry, Cold Room, Aisle, Walk-In, Loading Dock, Sub-Basement.',
  '- **Orchard** — bark / moss / wicker walls, gradient floor.',
  '- **Harvest** — reuses Orchard walls + Cold characters plus apple, kiwi, lemon, peach, pineapple bots.',
  '- **Trinkets** — the curio shop. Damask, hearth, tile, vault walls; eight floor patterns; candle, teapot, lamp, chest mimics.',
  '',
  'Re-run `node scripts/frost-fight-build-gallery.mjs` after touching any sprite to refresh.',
  '',
].join('\n'), 'utf8');

console.log(`Done. ${charCount} characters + walls/floors/loose copied.`);
