// Frost Fight — animation atlas loader.
//
// Each animated character (kiwi, strawberry, grape, pineapple, lemon,
// peach, orange) ships as a folder of per-frame PNGs under
// src/games/frost-fight/sprites/anim/<charKey>/ plus a JSON manifest
// at src/games/frost-fight/sprites/anim/<charKey>.json that lists the
// frame filenames per action.
//
// Manifest shape (produced by scripts/frost-fight-char-atlas.mjs):
//   {
//     "state": { "neutral": "state-neutral.png", "fuming": "...", ... },
//     "walk":          ["walk-0.png", ...],
//     "attackCharge":  ["attackCharge-0.png", ...],
//     "attackRelease": ["attackRelease-0.png", ...],
//     "death":         ["death-0.png", ...]
//   }
//
// Performance: every frame is a small (256×256) PNG → ~6-12 KB. A
// full character atlas is ~25 frames × 8 KB ≈ 200 KB. Loading 4 chars
// for one theme totals ~800 KB — comparable to one mid-size sprite.
// We pre-decode each frame off the main thread via Image.decode() so
// the first draw doesn't stall.

// Use Vite's glob import for the manifests and frame URLs. Eager so
// the module bundle includes references; the actual decode is lazy.
const MANIFEST_MODULES = import.meta.glob('./sprites/anim/*.json', {
  eager: true,
  import: 'default',
});

// Pre-resolve all anim PNG urls so we can look them up by relative
// path without Vite warning about dynamic imports. Vite's glob with
// `query: '?url'` returns the bundled URL string for each match.
const FRAME_URL_MODULES = import.meta.glob('./sprites/anim/**/*.png', {
  eager: true,
  import: 'default',
  query: '?url',
});

// Per-char manifest registry. Keys are the char keys ('kiwi', 'orange',
// etc.); values are the parsed JSON manifests.
const MANIFESTS = {};
for (const [path, json] of Object.entries(MANIFEST_MODULES)) {
  const m = path.match(/anim\/([\w-]+)\.json$/);
  if (m) MANIFESTS[m[1]] = json;
}

// Per-char URL registry. URLS[charKey][filename] = bundled URL.
const URLS = {};
for (const [path, url] of Object.entries(FRAME_URL_MODULES)) {
  const m = path.match(/anim\/([\w-]+)\/([\w.-]+\.png)$/);
  if (m) {
    if (!URLS[m[1]]) URLS[m[1]] = {};
    URLS[m[1]][m[2]] = url;
  }
}

// Cache: charKey → atlas object. Atlases are keyed once per char so
// repeat loadAtlas calls return the same instance and decoded frames.
const ATLAS_CACHE = new Map();

// Available char keys (per the manifests we found).
export const ATLAS_CHARS = Object.keys(MANIFESTS);

// Load a character atlas. Returns an atlas object IMMEDIATELY (with
// `ready: false` until frames decode). The renderer can call drawAtlas
// every frame; it falls back to a no-op until ready.
export function loadAtlas(charKey) {
  if (ATLAS_CACHE.has(charKey)) return ATLAS_CACHE.get(charKey);
  const manifest = MANIFESTS[charKey];
  const urlMap = URLS[charKey] || {};
  const atlas = {
    key: charKey,
    ready: false,
    frames: { state: {}, walk: [], attackCharge: [], attackRelease: [], death: [] },
  };
  ATLAS_CACHE.set(charKey, atlas);
  if (!manifest) {
    // No atlas for this char — return a stub. Renderer will fall back
    // to its existing single-sprite path.
    return atlas;
  }
  // Spawn one Image per frame. Image.decode() returns a promise that
  // resolves once the bitmap is decoded off the main thread; we don't
  // await it (the renderer handles partial-load gracefully) but we
  // collect the promises so loadAtlas.callers can `await loadAtlas(k)`
  // if they want to gate on full readiness.
  const decodes = [];
  const mkImg = (filename) => {
    const url = urlMap[filename];
    if (!url) return null;
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    // img.decode() is unsupported in jsdom (test environment) — guard
    // so unit tests don't throw on mount. Fall back to onload + a
    // resolved promise so the readiness Promise.all still settles.
    if (typeof img.decode === 'function') {
      decodes.push(img.decode().catch(() => {}));
    } else {
      decodes.push(new Promise((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      }));
    }
    return img;
  };
  for (const [name, file] of Object.entries(manifest.state || {})) {
    const img = mkImg(file);
    if (img) atlas.frames.state[name] = img;
  }
  for (const action of ['walk', 'attackCharge', 'attackRelease', 'death']) {
    const list = manifest[action] || [];
    atlas.frames[action] = list.map(mkImg).filter(Boolean);
  }
  Promise.all(decodes).then(() => { atlas.ready = true; });
  return atlas;
}

// Pick the right frame for the current animation state. Returns an
// Image (or null). The renderer should null-check and fall back to the
// existing single-sprite path if null.
//
// `action`: one of 'walk' | 'attackCharge' | 'attackRelease' | 'death'
//           | 'state:<name>'  (e.g. 'state:neutral')
// `frameIdx`: integer; loops via modulo for cyclic actions, clamps for
//             one-shot actions like death.
export function getFrame(atlas, action, frameIdx) {
  if (!atlas) return null;
  if (action.startsWith('state:')) {
    const name = action.slice(6);
    return atlas.frames.state[name] || atlas.frames.state.neutral || null;
  }
  const list = atlas.frames[action];
  if (!list || list.length === 0) return null;
  // Death plays once and holds the last frame; walk/charge/release loop.
  if (action === 'death') return list[Math.min(frameIdx, list.length - 1)];
  return list[frameIdx % list.length];
}

// Frame durations per action (seconds per frame). Tuned so the cycle
// reads at gameplay speed without flickering.
export const FRAME_DURATION = {
  walk:          0.110,  // 4-frame walk × 110 ms ≈ 440 ms cycle
  attackCharge:  0.120,  // 3-4 frames × 120 ms — slight pause on each
  attackRelease: 0.080,  // fast — the puff is the key moment
  death:         0.140,  // 4-frame one-shot ≈ 560 ms
};

// Advance an enemy's animation timer + frame. Mutates the enemy object
// in place. Cyclic actions wrap; death freezes on the final frame.
export function tickAnim(enemy, dt) {
  if (!enemy.animAction) return;
  const dur = FRAME_DURATION[enemy.animAction] || 0.12;
  enemy.animT = (enemy.animT || 0) + dt;
  if (enemy.animT >= dur) {
    enemy.animT -= dur;
    enemy.animFrame = (enemy.animFrame || 0) + 1;
  }
}

// Reset an enemy's animation to a new action. Idempotent if the
// action hasn't changed (avoids resetting the cycle every frame).
export function setAnimAction(enemy, action) {
  if (enemy.animAction === action) return;
  enemy.animAction = action;
  enemy.animFrame = 0;
  enemy.animT = 0;
}
