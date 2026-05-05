// Frost Fight — per-theme asset preloader.
//
// Each theme draws from a known roster of atlases (animated bots),
// wall textures, and floor textures. The preloader collects every URL
// the chosen theme will need and warms the browser's HTTP cache by
// pulling each one in parallel BEFORE the gameplay canvas mounts.
// Result: when the player enters their first room the bots, walls,
// and floors are already decoded and ready to draw.
//
// Returns a Promise that resolves once every asset has either loaded
// or errored. Calls `onProgress(loaded, total)` after each settle so
// the caller can drive a progress bar.

import { loadAtlas } from './atlas.js';

// Per-theme atlas roster. Driven by which enemy `kind`s appear in
// each theme's level grids. See ATLAS_KEY_FOR_KIND in
// FrostFightGame.jsx.
const THEME_ATLASES = {
  cold:    ['orange', 'strawberry', 'cherry'],
  orchard: ['orange', 'strawberry', 'cherry', 'grape'],
  harvest: ['orange', 'strawberry', 'cherry', 'grape', 'apple', 'kiwi', 'lemon', 'peach', 'pineapple'],
  trinkets:['orange', 'strawberry', 'cherry', 'apple', 'candle', 'teapot', 'lamp', 'chest'],
};

// Vite glob imports for non-atlas textures + base sprites. Using the
// same `?url` pattern as FrostFightGame so we point at the bundled
// fingerprinted URL (and inherit long cache headers in production).
const WALL_URLS = import.meta.glob('./sprites/walls/*.png', {
  eager: true, import: 'default', query: '?url',
});
const FLOOR_URLS = import.meta.glob('./sprites/floors/*.png', {
  eager: true, import: 'default', query: '?url',
});
const BASE_SPRITE_URLS = import.meta.glob('./sprites/*.png', {
  eager: true, import: 'default', query: '?url',
});

function urlsByPrefix(map, prefix) {
  const out = [];
  for (const [path, url] of Object.entries(map)) {
    const m = path.match(/\/([\w-]+)\.png$/);
    if (m && m[1].startsWith(prefix)) out.push(url);
  }
  return out;
}

function urlsByName(map, names) {
  const out = [];
  for (const [path, url] of Object.entries(map)) {
    const m = path.match(/\/([\w-]+)\.png$/);
    if (m && names.includes(m[1])) out.push(url);
  }
  return out;
}

// Per-theme wall + floor texture name lists. Manually curated to match
// the ROOM_WALL_KEY / ROOM_FLOOR_KEY assignments in FrostFightGame.jsx.
const THEME_WALL_NAMES = {
  cold:    ['pantry', 'coldroom', 'aisle', 'walkin', 'loadingdock', 'subbasement'],
  orchard: [],   // Orchard reuses the cold walls + procedural fills
  harvest: [
    'orchard-mosspebbles', 'orchard-bark', 'orchard-mossdeep',
    'orchard-basket', 'orchard-woodvines', 'orchard-wood', 'orchard-stones',
  ],
  trinkets:['trinket-hearth', 'trinket-damask', 'trinket-tile', 'trinket-vault'],
};

function themeWallUrls(themeId) {
  const names = THEME_WALL_NAMES[themeId] || [];
  return urlsByName(WALL_URLS, names);
}

function themeFloorUrls(themeId) {
  // Trinkets is the only theme with bundled floor textures (8 of them).
  // Cold/Orchard/Harvest fall back to the canvas linear-gradient floor.
  if (themeId === 'trinkets') return Object.values(FLOOR_URLS);
  return [];
}

// Base sprites every theme needs: player skins, ice block, exit, fruit
// pickups, legacy single-image bots. Warming these once means the
// hot path inside FrostFightGame.jsx never blocks on a network round
// trip when starting a new run.
function baseSpriteUrls() {
  return Object.values(BASE_SPRITE_URLS);
}

// Collect every Image we want to gate the loading bar on. Atlases are
// already loaded via loadAtlas (which spawns Image objects + decode
// promises); we walk those objects out and wait on their `complete`
// flag. Non-atlas URLs get a freshly-created Image whose `onload` we
// can hook.
//
// onProgress(loaded, total) fires after EACH image settles (load or
// error). The total counts every non-null image we found.
export async function preloadTheme(themeId, onProgress = () => {}) {
  const charKeys = THEME_ATLASES[themeId] || [];
  const images = [];

  // 1) Atlases — call loadAtlas for each. This kicks off all frame
  //    Image objects + decode promises. We then collect each frame's
  //    Image into the watch list.
  for (const key of charKeys) {
    const atlas = loadAtlas(key);
    if (!atlas) continue;
    for (const stateImg of Object.values(atlas.frames.state)) {
      if (stateImg) images.push(stateImg);
    }
    for (const action of ['walk', 'attackCharge', 'attackRelease', 'death']) {
      for (const frame of (atlas.frames[action] || [])) {
        if (frame) images.push(frame);
      }
    }
  }

  // 2) Walls + floors + base sprites — spawn Image objects so the
  //    browser starts the GET requests in parallel.
  const extraUrls = [
    ...themeWallUrls(themeId),
    ...themeFloorUrls(themeId),
    ...baseSpriteUrls(),
  ];
  for (const url of extraUrls) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    images.push(img);
  }

  const total = images.length;
  if (total === 0) {
    onProgress(1, 1);
    return;
  }

  let loaded = 0;
  const settle = () => {
    loaded += 1;
    onProgress(loaded, total);
  };

  // Fire-and-await: each image either is already complete (sync resolve)
  // or settles via onload/onerror. We use Promise.all to know when the
  // whole batch is done.
  await Promise.all(images.map((img) => new Promise((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      settle();
      resolve();
      return;
    }
    const done = () => { settle(); resolve(); };
    img.addEventListener('load',  done, { once: true });
    img.addEventListener('error', done, { once: true });
  })));
}
