// Era Siege — asset manifest with placeholder fallback.
//
// Every visual the game needs is registered as a key here. Each entry has:
//   1. a *placeholder* draw function (in `assets/placeholders.js`) that
//      uses primitives so the game ships with no PNGs at all
//   2. an *image path* (relative to `public/`) that the loader probes at
//      boot. If the PNG exists, the manifest uses an *imageDraw* variant
//      (in `assets/image-draws.js`) at the same call sites.
//
// The renderer only ever calls `assets.draw(ctx, key, x, y, opts)` — it
// never branches on whether art has been provided yet. This is the
// contract that lets PNG assets land without code changes:
//
//   public/games/era-siege/unit/era1/frontline.png   ← exists  →  used
//   public/games/era-siege/unit/era1/frontline.png   ← missing →  placeholder runs
//
// File name conventions match `docs/images.md` 1:1.
//
// Phase-7 split:
//   assets.js                  — public API + registry + `reg()` calls (this file)
//   assets/placeholders.js     — procedural placeholder draws (~250 lines)
//   assets/image-draws.js      — image-blit variants per asset class (~150 lines)

import { getEraByIndex, paletteFor } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { getTurretForEra } from '../content/turrets.js';
import { getProjectile } from '../content/projectiles.js';
import {
  placeholderSky, placeholderClouds, placeholderMountains, placeholderForeground,
  placeholderBase, placeholderTurret, placeholderUnit, placeholderProjectile,
  placeholderHitSpark, placeholderMuzzle, placeholderExplosion,
} from './assets/placeholders.js';
import {
  drawImage,
  drawSkyImage, drawCloudImage, drawMountainImage, drawForegroundImage,
  drawBaseImage, drawProjectileImage,
  drawSpark9, drawMuzzle4, drawExplosion12,
} from './assets/image-draws.js';

// ── Public surface ────────────────────────────────────────────────────

const registry = new Map(); // key -> { placeholder, src, image, ready, imageDraw }

// Dev-mode cache bust — stable for the session so HMR doesn't re-fetch
// every PNG on every keystroke, but changes per fresh page load. In
// production builds vite's `define` substitutes BUILD_VERSION below.
const _devCacheBust = `dev-${Math.floor(Math.random() * 1e9).toString(36)}`;

export const assets = {
  draw(ctx, key, x, y, opts) {
    const entry = registry.get(key);
    if (!entry) return;
    if (entry.image && entry.ready) {
      (entry.imageDraw || drawImage)(ctx, entry.image, x, y, opts || {});
      return;
    }
    entry.placeholder(ctx, x, y, opts || {});
  },

  has(key) {
    const e = registry.get(key);
    return !!(e && e.ready);
  },

  // Natural width / height of a loaded image — lets the renderer scale
  // sprites to the source aspect ratio rather than a hard-coded one.
  // Returns null if the image hasn't loaded yet.
  naturalSize(key) {
    const e = registry.get(key);
    if (!e || !e.image || !e.image.naturalWidth) return null;
    return { w: e.image.naturalWidth, h: e.image.naturalHeight };
  },

  preloadAll(baseUrl) {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;
    // Resolve the base URL the static host actually serves under.
    //
    // PG.Play deploys to `https://pushkalgupta.com/PG.Play/dist/` on
    // GitHub Pages, but the dev server runs at `http://localhost:5180/`.
    // An absolute `/games/...` works in dev and FAILS in production.
    //
    // Strategy: resolve every asset URL against `document.baseURI`,
    // which the browser anchors to the location of index.html. That gives:
    //   dev   → http://localhost:5180/games/era-siege/...
    //   prod  → https://pushkalgupta.com/PG.Play/dist/games/era-siege/...
    let base;
    if (baseUrl != null) {
      base = baseUrl;
    } else if (typeof document !== 'undefined' && document.baseURI) {
      base = document.baseURI;
    } else {
      base = '/';
    }
    // Cache-bust query for image URLs. Bake-produced PNGs share a stable
    // path across builds, so the browser will serve a stale copy unless
    // we change the URL when content changes. The version is injected at
    // build time via vite's `define` (BUILD_VERSION). Falls back to a
    // session-stable random for dev where define isn't applied.
    const ver = (typeof BUILD_VERSION !== 'undefined' && BUILD_VERSION) || _devCacheBust;
    const debug = typeof window !== 'undefined'
               && /[?&]es-debug\b/.test(window.location?.search || '');
    const promises = [];
    const failed = [];
    for (const [key, entry] of registry.entries()) {
      if (!entry.src) continue;
      // The original Gemini reference sheets baked transparency-checker
      // pixels into the silhouette region; no keying pass cleaned them
      // reliably. We bake clean PNGs for the static layers via
      // `scripts/era-siege-bake.mjs` (which runs the same procedural
      // draws used at runtime) and load those.
      //
      // Excluded: clouds (drift over time) and turrets (fire/recoil
      // frame swaps composited in the renderer, not pre-painted).
      // Units now have baked static-pose PNGs; the renderer composites
      // animation effects (walk-bob, attack lean, muzzle flash) on top.
      if (key.endsWith('/clouds') || key.startsWith('turret/era')) {
        continue;
      }
      try {
        const img = new Image();
        img.decoding = 'async';
        img.loading  = 'eager';
        const resolved = new URL(entry.src, base).href;
        const url = ver ? `${resolved}?v=${ver}` : resolved;
        promises.push(new Promise((resolve) => {
          img.onload  = () => { entry.image = img; entry.ready = true; resolve('ok'); };
          img.onerror = () => { failed.push({ key, url }); resolve('fail'); };
          img.src = url;
        }));
      } catch (e) {
        failed.push({ key, url: entry.src, error: String(e) });
      }
    }
    // Single grouped report once all images settle. Loud only on
    // failure or when ?es-debug is set; silent in the happy path.
    Promise.allSettled(promises).then(() => {
      const total = promises.length;
      const ok = total - failed.length;
      assets._lastLoadReport = { total, ok, failed: failed.slice() };
      if (failed.length) {
        // eslint-disable-next-line no-console
        console.warn(`[era-siege] ${failed.length}/${total} assets failed to load:`,
          failed.map((f) => `${f.key} → ${f.url}`).join('\n  '));
      } else if (debug) {
        // eslint-disable-next-line no-console
        console.info(`[era-siege] assets ready (${ok}/${total})`);
      }
    });
  },

  _resetForTests() {
    for (const e of registry.values()) { e.image = null; e.ready = false; }
  },

  // Exposed for the `?es-debug` overlay so it can iterate registered
  // keys and check `ready` status without an extra import. Also handy
  // for ad-hoc devtools inspection.
  get _registry() { return registry; },
};

// ── Registration helpers ──────────────────────────────────────────────

function reg(key, src, placeholder, imageDraw) {
  registry.set(key, { src, placeholder, image: null, ready: false, imageDraw });
}

// ── Backgrounds (sky / clouds / mountains / foreground per era) ──────

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;

  reg(`bg/era${i + 1}/sky`, `games/era-siege/bg/era${i + 1}/sky.png`,
    (ctx, _x, _y, { w, h, groundY }) => placeholderSky(ctx, eraId, w, h, groundY ?? h),
    drawSkyImage);

  reg(`bg/era${i + 1}/clouds`, `games/era-siege/bg/era${i + 1}/clouds.png`,
    (ctx, _x, _y, { w, groundY, t = 0 }) => placeholderClouds(ctx, eraId, w, groundY, t),
    drawCloudImage);

  reg(`bg/era${i + 1}/mountains-far`, `games/era-siege/bg/era${i + 1}/mountains-far.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderMountains(ctx, eraId, w, groundY, 'far'),
    drawMountainImage);

  reg(`bg/era${i + 1}/mountains-mid`, `games/era-siege/bg/era${i + 1}/mountains-mid.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderMountains(ctx, eraId, w, groundY, 'mid'),
    drawMountainImage);

  reg(`bg/era${i + 1}/foreground`, `games/era-siege/bg/era${i + 1}/foreground.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderForeground(ctx, eraId, w, groundY),
    drawForegroundImage);
}

// ── Bases (player + enemy per era) ────────────────────────────────────

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;
  reg(`base/era${i + 1}/player`, `games/era-siege/base/era${i + 1}/player.png`,
    (ctx, x, y, _o) => placeholderBase(ctx, eraId, x, y, true),
    drawBaseImage);
  reg(`base/era${i + 1}/enemy`, `games/era-siege/base/era${i + 1}/enemy.png`,
    (ctx, x, y, _o) => placeholderBase(ctx, eraId, x, y, false),
    drawBaseImage);
}

// ── Turrets (5 era variants × idle / fire / recoil) ──────────────────
//
// Renderer chooses one of the three based on the slot's cooldown phase.
// Missing fire/recoil PNGs fall back to the same placeholder so partial
// coverage degrades gracefully.

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;
  const def = getTurretForEra(eraId);
  reg(`turret/era${i + 1}`,        `games/era-siege/turret/era${i + 1}.png`,
    (ctx, x, y, opts) => placeholderTurret(ctx, def, x, y, opts || {}));
  reg(`turret/era${i + 1}-fire`,   `games/era-siege/turret/era${i + 1}-fire.png`,
    (ctx, x, y, opts) => placeholderTurret(ctx, def, x, y, opts || {}));
  reg(`turret/era${i + 1}-recoil`, `games/era-siege/turret/era${i + 1}-recoil.png`,
    (ctx, x, y, opts) => placeholderTurret(ctx, def, x, y, opts || {}));
}

// ── Units (5 eras × frontline / ranged / heavy + general) ───────────

for (let i = 0; i < 5; i++) {
  const era = getEraByIndex(i);
  for (const role of ['frontline', 'ranged', 'heavy']) {
    const def = era.unitIds.map(getUnit).find((u) => u && u.role === role);
    if (!def) continue;
    reg(`unit/era${i + 1}/${role}`, `games/era-siege/unit/era${i + 1}/${role}.png`,
      (ctx, x, y, opts) => placeholderUnit(ctx, def, x, y, opts || {}));
  }
  if (era.generalId) {
    const gdef = getUnit(era.generalId);
    if (gdef) {
      reg(`unit/era${i + 1}/general`, `games/era-siege/unit/era${i + 1}/general.png`,
        (ctx, x, y, opts) => placeholderUnit(ctx, gdef, x, y, opts || {}));
    }
  }
}

// ── Projectiles ───────────────────────────────────────────────────────

const PROJECTILE_IDS = ['bone-shard', 'crossbow-bolt', 'steam-bolt', 'arc-bolt', 'mortar-shell', 'void-orb'];
for (const id of PROJECTILE_IDS) {
  const def = getProjectile(id);
  reg(`projectile/${id}`, `games/era-siege/projectile/${id}.png`,
    (ctx, x, y, opts) => placeholderProjectile(ctx, def, x, y, opts || {}),
    drawProjectileImage);
}

// ── VFX ───────────────────────────────────────────────────────────────

reg('vfx/hit-spark', 'games/era-siege/vfx/hit-spark.png',
  (ctx, x, y, _o) => placeholderHitSpark(ctx, x, y),
  drawSpark9);

reg('vfx/muzzle-flash', 'games/era-siege/vfx/muzzle-flash.png',
  (ctx, x, y, opts) => placeholderMuzzle(ctx, x, y, opts || {}),
  drawMuzzle4);

reg('vfx/explosion-small', 'games/era-siege/vfx/explosion-small.png',
  (ctx, x, y, _o) => placeholderExplosion(ctx, x, y, 32));

reg('vfx/explosion-large', 'games/era-siege/vfx/explosion-large.png',
  (ctx, x, y, _o) => placeholderExplosion(ctx, x, y, 56));

reg('vfx/explosion-12', 'games/era-siege/vfx/explosion-12.png',
  (ctx, x, y, opts) => placeholderExplosion(ctx, x, y, (opts && opts.size) || 48),
  drawExplosion12);

// ── Test re-export ────────────────────────────────────────────────────

export { registry as _registry };
