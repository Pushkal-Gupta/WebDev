// Era Siege — asset manifest with placeholder fallback.
//
// Every visual the game needs is registered as a key here. Each key has:
//   1. a *placeholder* draw function that uses primitives so the game
//      ships with no PNGs at all, and
//   2. an *image path* (relative to `public/`) that the loader probes
//      at boot. If the PNG exists, the manifest swaps the placeholder
//      for an image-blit at the same call sites.
//
// The renderer only ever calls `assets.draw(ctx, key, x, y, opts)` — it
// never branches on whether art has been provided yet. This is the
// contract that lets new PNG assets land without code changes:
//
//   public/games/era-siege/unit/era1/frontline.png   ← exists  →  used
//   public/games/era-siege/unit/era1/frontline.png   ← missing →  placeholder runs
//
// File name conventions match `docs/images.md` 1:1.

import { paletteFor, getEraByIndex } from '../content/eras.js';
import { getUnit } from '../content/units.js';
import { getTurret, getTurretForEra } from '../content/turrets.js';
import { getProjectile } from '../content/projectiles.js';

// ── Public surface ────────────────────────────────────────────────────

const registry = new Map(); // key -> { placeholder(ctx, x, y, opts), src, image, ready }

export const assets = {
  /**
   * Draw the named asset. If a PNG is loaded for the key, blits it.
   * Otherwise calls the placeholder. `opts` is asset-specific.
   */
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

  /**
   * Begin async preloading of every registered image source. Renderer
   * keeps using placeholders until each image's `ready` flag flips.
   * Called once at game mount.
   */
  preloadAll(baseUrl) {
    if (typeof window === 'undefined' || typeof Image === 'undefined') return;
    const base = baseUrl || '/';
    for (const entry of registry.values()) {
      if (!entry.src) continue;
      try {
        const img = new Image();
        img.decoding = 'async';
        img.loading  = 'eager';
        img.onload  = () => { entry.image = img; entry.ready = true; };
        img.onerror = () => { /* leave placeholder in place */ };
        img.src = base + entry.src;
      } catch { /* keep placeholder */ }
    }
  },

  /**
   * Test seam: clear loaded images so the placeholder path is exercised.
   */
  _resetForTests() {
    for (const e of registry.values()) { e.image = null; e.ready = false; }
  },
};

// ── Image blit helper (DPR-correct, anchor-aware) ─────────────────────

function drawImage(ctx, img, x, y, opts = {}) {
  if (!img.naturalWidth) return;
  const w = opts.w || img.naturalWidth / 2;   // assets are authored at 2× target
  const h = opts.h || img.naturalHeight / 2;
  const ax = opts.anchor === 'foot' ? w / 2 : w / 2;
  const ay = opts.anchor === 'foot' ? h     : h / 2;
  const flip = opts.flipX ? -1 : 1;
  if (flip < 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -ax, -ay, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, x - ax, y - ay, w, h);
  }
}

// ── Registration helpers ──────────────────────────────────────────────

function reg(key, src, placeholder, imageDraw) {
  registry.set(key, { src, placeholder, image: null, ready: false, imageDraw });
}

// ── Asset-specific image-draw variants ────────────────────────────────

// Sky: cover (0, 0) to (view.w, view.groundY). The painted image already
// includes a horizon, so its bottom edge should align with the ground line.
function drawSkyImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const w = opts.w || img.naturalWidth / 2;
  const h = opts.groundY || (opts.h || img.naturalHeight / 2);
  ctx.drawImage(img, 0, 0, w, h);
}

// Clouds: a horizontal strip near the horizon, drifting with `t` and
// tiled so the seam never shows. Source images are 3-row sheets; we
// extract the middle row (the most varied silhouette) and render that.
// `srcW × srcH` is the per-frame size; total sheet is srcW × srcH×3.
function drawCloudImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const W = opts.w || 1920;
  const groundY = opts.groundY || 600;

  // Source crop: middle frame of a 1×3 vertical sheet.
  const sheetH = img.naturalHeight;
  const frameH = sheetH / 3;
  const sx = 0;
  const sy = frameH;          // row index 1 (0-indexed → middle row)
  const sw = img.naturalWidth;
  const sh = frameH;

  // Destination strip: a band near the horizon, drifting horizontally.
  const stripH = Math.min(sh / 2, groundY * 0.42);
  const stripY = groundY - stripH - 6;
  const tileW  = Math.round(sw / 2);                  // 2× downsample → ~960px
  const drift  = ((opts.t || 0) * 6) % tileW;

  // Render up to 3 tiles (left of viewport, on-screen, optional spillover).
  for (let tx = -drift; tx < W + tileW; tx += tileW) {
    ctx.drawImage(img, sx, sy, sw, sh, tx, stripY, tileW, stripH);
  }
}

// ── Backgrounds (sky / clouds / mountains / foreground per era) ──────
//
// These keys are consumed by `engine/parallax.js`. Each placeholder
// draws from primitives matching the era palette so the layered look
// works even with zero PNG assets.

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;

  reg(`bg/era${i + 1}/sky`, `games/era-siege/bg/era${i + 1}/sky.png`,
    (ctx, _x, _y, { w, h }) => {
      const pal = paletteFor(eraId);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, pal.sky[0]);
      g.addColorStop(1, pal.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    drawSkyImage);

  reg(`bg/era${i + 1}/clouds`, `games/era-siege/bg/era${i + 1}/clouds.png`,
    (ctx, _x, _y, { w, groundY, t = 0 }) => placeholderClouds(ctx, eraId, w, groundY, t),
    drawCloudImage);

  reg(`bg/era${i + 1}/mountains-far`, `games/era-siege/bg/era${i + 1}/mountains-far.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderMountains(ctx, eraId, w, groundY, 'far'));

  reg(`bg/era${i + 1}/mountains-mid`, `games/era-siege/bg/era${i + 1}/mountains-mid.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderMountains(ctx, eraId, w, groundY, 'mid'));

  reg(`bg/era${i + 1}/foreground`, `games/era-siege/bg/era${i + 1}/foreground.png`,
    (ctx, _x, _y, { w, groundY }) => placeholderForeground(ctx, eraId, w, groundY));
}

// ── Bases ─────────────────────────────────────────────────────────────

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;
  reg(`base/era${i + 1}/player`, `games/era-siege/base/era${i + 1}/player.png`,
    (ctx, x, y, _o) => placeholderBase(ctx, eraId, x, y, true));
  reg(`base/era${i + 1}/enemy`, `games/era-siege/base/era${i + 1}/enemy.png`,
    (ctx, x, y, _o) => placeholderBase(ctx, eraId, x, y, false));
}

// ── Turrets ───────────────────────────────────────────────────────────

for (let i = 0; i < 5; i++) {
  const eraId = getEraByIndex(i).id;
  const def = getTurretForEra(eraId);
  reg(`turret/era${i + 1}`, `games/era-siege/turret/era${i + 1}.png`,
    (ctx, x, y, opts) => placeholderTurret(ctx, def, x, y, opts || {}));
}

// ── Units ─────────────────────────────────────────────────────────────

for (let i = 0; i < 5; i++) {
  const era = getEraByIndex(i);
  for (const role of ['frontline', 'ranged', 'heavy']) {
    const def = era.unitIds.map(getUnit).find((u) => u && u.role === role);
    if (!def) continue;
    reg(`unit/era${i + 1}/${role}`, `games/era-siege/unit/era${i + 1}/${role}.png`,
      (ctx, x, y, opts) => placeholderUnit(ctx, def, x, y, opts || {}));
  }
}

// ── Projectiles ───────────────────────────────────────────────────────

const PROJECTILE_IDS = ['bone-shard', 'crossbow-bolt', 'steam-bolt', 'arc-bolt', 'mortar-shell', 'void-orb'];
for (const id of PROJECTILE_IDS) {
  const def = getProjectile(id);
  reg(`projectile/${id}`, `games/era-siege/projectile/${id}.png`,
    (ctx, x, y, opts) => placeholderProjectile(ctx, def, x, y, opts || {}));
}

// ── VFX ───────────────────────────────────────────────────────────────

reg('vfx/hit-spark', 'games/era-siege/vfx/hit-spark.png',
  (ctx, x, y, _o) => placeholderHitSpark(ctx, x, y));
reg('vfx/muzzle-flash', 'games/era-siege/vfx/muzzle-flash.png',
  (ctx, x, y, opts) => placeholderMuzzle(ctx, x, y, opts || {}));
reg('vfx/explosion-small', 'games/era-siege/vfx/explosion-small.png',
  (ctx, x, y, _o) => placeholderExplosion(ctx, x, y, 32));
reg('vfx/explosion-large', 'games/era-siege/vfx/explosion-large.png',
  (ctx, x, y, _o) => placeholderExplosion(ctx, x, y, 56));

// ── Placeholder draw helpers ──────────────────────────────────────────
//
// These mirror the previous procedural look so the game still ships
// fully visual without art. Once a PNG lands, the manifest stops
// calling these.

function placeholderClouds(ctx, eraId, w, groundY, t) {
  const pal = paletteFor(eraId);
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = pal.midMotif;
  const drift = (t * 6) % 1920;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 360) + drift) % (w + 480) - 240;
    const cy = groundY - 220 - (i % 2) * 18;
    ctx.beginPath();
    ctx.ellipse(cx,        cy,       60, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38,   cy - 8,   46, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 38,   cy + 4,   38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function placeholderMountains(ctx, eraId, w, groundY, depth) {
  const pal = paletteFor(eraId);
  ctx.save();
  if (depth === 'far') {
    ctx.fillStyle = pal.mountain;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let i = 0; i <= 18; i++) {
      const x = (i / 18) * w;
      // Era-tinted shape — deliberate per-era silhouette differences.
      const profile = mountainProfile(eraId, i, /*depth=*/0);
      ctx.lineTo(x, groundY - 110 - profile);
    }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = pal.mountain;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * w;
      const profile = mountainProfile(eraId, i, /*depth=*/1);
      ctx.lineTo(x, groundY - 60 - profile);
    }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function mountainProfile(eraId, i, depth) {
  const baseAmp = depth === 0 ? 28 : 18;
  switch (eraId) {
    case 'ember-tribe':
      return Math.abs(Math.sin(i * 1.7)) * baseAmp + Math.sin(i * 3.1) * 8;
    case 'iron-dominion':
      // Blocky escarpments — flatter peaks
      return (i % 3 === 0 ? baseAmp : baseAmp * 0.45) + Math.sin(i * 0.6) * 4;
    case 'sun-foundry':
      // Smokestack-like vertical chimneys at intervals
      return (i % 4 === 0 ? baseAmp + 18 : baseAmp * 0.6) + Math.sin(i * 1.1) * 5;
    case 'storm-republic':
      // Lightning rods on cliffs — sharp narrow spikes
      return (i % 5 === 0 ? baseAmp + 26 : baseAmp * 0.4) + Math.sin(i * 2.4) * 4;
    case 'void-ascendancy':
      // Floating monoliths — alternating tall/short flat-tops
      return (i % 2 === 0 ? baseAmp + 8 : baseAmp * 0.5);
    default:
      return baseAmp;
  }
}

function placeholderForeground(ctx, eraId, w, groundY) {
  const pal = paletteFor(eraId);
  ctx.save();
  ctx.fillStyle = pal.groundDetail;
  // Rocks
  for (let i = 0; i < 8; i++) {
    const x = (i / 8) * w + (i % 2 ? 24 : 0);
    const r = 4 + (i % 3) * 2;
    ctx.beginPath(); ctx.arc(x, groundY + 16, r, 0, Math.PI * 2); ctx.fill();
  }
  // Era-specific debris glyphs on a strip
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * w + 12;
    placeholderDebris(ctx, eraId, x, groundY + 8);
  }
  ctx.restore();
}

function placeholderDebris(ctx, eraId, x, y) {
  switch (eraId) {
    case 'ember-tribe':
      ctx.fillRect(x, y - 1, 5, 2);
      ctx.fillRect(x + 1, y - 4, 1, 4);
      break;
    case 'iron-dominion':
      ctx.fillRect(x, y - 8, 1.5, 8);    // pole
      ctx.fillRect(x, y - 8, 4, 3);      // banner
      break;
    case 'sun-foundry':
      ctx.fillRect(x - 2, y - 4, 4, 4);  // barrel
      break;
    case 'storm-republic':
      ctx.fillRect(x, y - 10, 1, 10);    // antenna
      break;
    case 'void-ascendancy':
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 3, y); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.fillRect(x, y - 1, 3, 1);
  }
}

function placeholderBase(ctx, eraId, x, groundY, isPlayer) {
  const pal = paletteFor(eraId);
  // Wall block (taller than original — +25% height)
  ctx.fillStyle = '#15171b';
  ctx.fillRect(x - 44, groundY - 112, 88, 112);
  // Banner stripe across the top
  ctx.fillStyle = pal.banner;
  ctx.fillRect(x - 44, groundY - 114, 88, 4);
  // Crenellations
  ctx.fillStyle = '#1f2329';
  for (let k = 0; k < 5; k++) ctx.fillRect(x - 42 + k * 18, groundY - 122, 8, 8);
  // Stone seam grid
  ctx.fillStyle = '#0a0d0e';
  for (let row = 0; row < 5; row++) ctx.fillRect(x - 44, groundY - 100 + row * 22, 88, 1);
  for (let col = 0; col < 7; col++) ctx.fillRect(x - 44 + col * 13 + (col % 2 ? 6 : 0), groundY - 100, 1, 100);
  // Archway door
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.fillRect(x - 10, groundY - 70, 20, 70);
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath();
  ctx.moveTo(x - 10, groundY - 70);
  ctx.quadraticCurveTo(x, groundY - 84, x + 10, groundY - 70);
  ctx.lineTo(x + 8, groundY - 68);
  ctx.quadraticCurveTo(x, groundY - 80, x - 8, groundY - 68);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1, groundY - 70, 2, 70);
  // Pennant pole + flag
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, groundY - 122); ctx.lineTo(x, groundY - 162); ctx.stroke();
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.beginPath();
  ctx.moveTo(x, groundY - 162);
  ctx.lineTo(x + (isPlayer ? 24 : -24), groundY - 154);
  ctx.lineTo(x, groundY - 144);
  ctx.closePath(); ctx.fill();
}

function placeholderTurret(ctx, def, x, y, opts) {
  if (!def) return;
  const v = def.visual;
  ctx.fillStyle = v.baseColor;
  ctx.fillRect(x - 14, y, 28, 12);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 14, y + 9, 28, 3);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1.5, y - 16, 3, 16);
  ctx.fillStyle = v.barrelColor;
  switch (v.kind) {
    case 'crossbow':
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y - 16);
      ctx.lineTo(x + 14, y - 12); ctx.lineTo(x - 14, y - 12);
      ctx.closePath(); ctx.fill();
      break;
    case 'bell':
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 16); ctx.lineTo(x + 7, y - 16);
      ctx.lineTo(x + 14, y - 9);  ctx.lineTo(x - 14, y - 9);
      ctx.closePath(); ctx.fill();
      break;
    case 'cannon':
      ctx.fillRect(x - 16, y - 20, 32, 9);
      ctx.fillRect(x - 18, y - 16, 4, 9);
      break;
    case 'tesla':
      for (let k = -1; k <= 1; k++) ctx.fillRect(x + k * 7 - 1, y - 26, 2, 16);
      break;
    case 'lance':
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 26); ctx.lineTo(x + 4, y - 26);
      ctx.lineTo(x + ((opts.flipX ? -26 : 26)), y - 16);
      ctx.lineTo(x - 4, y - 16);
      ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.fillRect(x - 8, y - 14, 16, 6);
  }
}

function placeholderUnit(ctx, def, x, y, opts) {
  // The renderer's drawUnit is still the visual workhorse for v7
  // because it does the walk anim + windup lean. This placeholder is
  // a coarse fallback used only if `assets.has` is queried directly.
  const v = def.visual;
  ctx.fillStyle = v.colorBody;
  const w = v.silhouetteW;
  const h = v.silhouetteH;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = v.colorTrim;
  ctx.fillRect(x - w / 2, y - h + 3, w, 2);
}

function placeholderProjectile(ctx, def, x, y, _opts) {
  if (def.kind === 'orb') {
    ctx.save();
    const r = def.sizePx + 1;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    grad.addColorStop(0, def.colorPrimary);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = def.colorPrimary;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

function placeholderHitSpark(ctx, x, y) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ffe14f';
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function placeholderMuzzle(ctx, x, y, opts) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ffe14f';
  const r = 4 + (opts.intensity || 0) * 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function placeholderExplosion(ctx, x, y, r) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0,   '#ffe14f');
  grad.addColorStop(0.5, '#ff8a3a');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Re-exports for tests
export { registry as _registry };
