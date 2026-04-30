// Era Siege — robust background keyout via corner-seeded flood-fill.
//
// Why not chroma-keying?
//   The Gemini source sheets bake a transparency-checker into "transparent"
//   areas as actual opaque pixels. The two checker greys (~62 and ~145)
//   overlap the colour ranges of Iron Dominion (steel grey), Storm
//   Republic (gunmetal), and Void Ascendancy (purple-grey) silhouettes.
//   A blanket chroma test eats the silhouette.
//
// Why flood-fill works:
//   The silhouette is a single connected blob in the centre of the image.
//   The checker is a connected band along the edges. If we seed a flood
//   from each corner and only spread through "panel-like" pixels, we
//   catch the checker without ever crossing the silhouette boundary.
//
// Panel-pixel test: low chroma AND luminance in the typical checker
// range. Inside the silhouette, even the same colours stay opaque
// because they're not connected to a corner seed.
//
// Edge softening: after the fill, any opaque pixel with a transparent
// neighbour gets its alpha gently reduced — kills the hard "lassoed"
// outline without bleeding too far in.
//
// Performance: a single image has up to 1408 × 307 = 432k pixels. A BFS
// with a Uint8 visited buffer + manual queue handles this in <200 ms.

import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const OUT  = resolve(ROOT, 'public/games/era-siege');

// Defaults — overrideable per-target.
const DEFAULTS = {
  // Pixels with chroma <= chromaLimit are flood-fill candidates.
  chromaLimit: 14,
  // Pixels lighter than darkMax (luminance) are flood-fill candidates.
  // The checker greys live in [50, 220]; legitimate dark silhouette
  // pixels (Void Ascendancy black core) sit below 30.
  lumMin: 30,
  lumMax: 220,
  // Soft edge feathering after the fill.
  feather: true,
};

function luminance(r, g, b) {
  return (r * 0.299 + g * 0.587 + b * 0.114) | 0;
}
function chroma(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isPanel(r, g, b, a, opts) {
  // Already-transparent pixels propagate the fill — without this, a re-run
  // of this script can't expand through regions cleared on a prior pass,
  // because their (R,G,B) is usually 0 and lum=0 fails the lumMin gate.
  if (a === 0) return true;
  const c = chroma(r, g, b);
  if (c > opts.chromaLimit) return false;
  const lum = luminance(r, g, b);
  if (lum < opts.lumMin) return false;
  if (lum > opts.lumMax) return false;
  return true;
}

async function floodFillKey(path, opts = {}) {
  if (!existsSync(path)) { console.warn(`skip — ${path} missing`); return false; }
  const settings = { ...DEFAULTS, ...opts };

  const meta = await sharp(path).metadata();
  const W = meta.width, H = meta.height;
  const buf = Buffer.from(await sharp(path).ensureAlpha().raw().toBuffer());
  const stride = W * 4;
  const px = (x, y) => y * stride + x * 4;

  // visited bitmap — 1 byte per pixel (0=untouched, 1=queued/done).
  const visited = new Uint8Array(W * H);
  const idx = (x, y) => y * W + x;

  // Queue as a flat array of (y * W + x) indices.
  const queue = [];
  function pushIfPanel(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = idx(x, y);
    if (visited[i]) return;
    visited[i] = 1;
    const o = px(x, y);
    if (isPanel(buf[o], buf[o + 1], buf[o + 2], buf[o + 3], settings)) {
      queue.push(i);
    }
  }

  // Seed: every edge pixel. This is more robust than just 4 corners
  // because some images have non-checker artefacts in a corner.
  for (let x = 0; x < W; x++) { pushIfPanel(x, 0); pushIfPanel(x, H - 1); }
  for (let y = 0; y < H; y++) { pushIfPanel(0, y); pushIfPanel(W - 1, y); }

  // BFS — 4-connectivity, no diagonals so the silhouette boundary
  // forms a hard barrier even if it's only 1 px thick.
  while (queue.length) {
    const q = queue.shift();
    const x = q % W, y = (q / W) | 0;
    // Mark this pixel transparent.
    buf[px(x, y) + 3] = 0;
    pushIfPanel(x - 1, y);
    pushIfPanel(x + 1, y);
    pushIfPanel(x, y - 1);
    pushIfPanel(x, y + 1);
  }

  // Edge feather — single pass: any opaque pixel with a transparent
  // 4-neighbour drops to 200/255 alpha. Kills the hard-lassoed outline.
  if (settings.feather) {
    const out = Buffer.from(buf);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const o = px(x, y);
        if (out[o + 3] !== 255) continue;
        if (buf[o - 4 + 3] === 0 || buf[o + 4 + 3] === 0
         || buf[o - stride + 3] === 0 || buf[o + stride + 3] === 0) {
          out[o + 3] = 215;
        }
      }
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .png({ compressionLevel: 9 }).toFile(path);
  } else {
    await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .png({ compressionLevel: 9 }).toFile(path);
  }
  console.log(`✓ ${path.replace(ROOT + '/', '')}`);
  return true;
}

// Per-asset overrides — Iron Dominion / Void Ascendancy silhouettes need
// extra care because their palette overlaps the checker greys.
const TARGETS = [];
for (let n = 1; n <= 5; n++) {
  // Bases
  TARGETS.push([join(OUT, `base/era${n}/player.png`), {}]);
  TARGETS.push([join(OUT, `base/era${n}/enemy.png`),  {}]);
  // Units
  for (const role of ['frontline', 'ranged', 'heavy']) {
    TARGETS.push([join(OUT, `unit/era${n}/${role}.png`), {}]);
  }
  // Turrets
  TARGETS.push([join(OUT, `turret/era${n}.png`),        {}]);
  TARGETS.push([join(OUT, `turret/era${n}-fire.png`),   {}]);
  TARGETS.push([join(OUT, `turret/era${n}-recoil.png`), {}]);
  // Backgrounds — Gemini's reference sheets bake a noisy watermark
  // texture *and* a transparency checker into the same canvas. The
  // checker greys live in [50, 220], but the watermark pattern peaks
  // near white. Bump lumMax to 252 to catch the bright watermark
  // pixels; chroma stays tight so coloured silhouette interior
  // (brown mountains, purple void buildings) doesn't qualify as panel.
  // The silhouette boundary (4-connected) still acts as a hard barrier.
  TARGETS.push([join(OUT, `bg/era${n}/mountains-far.png`), { chromaLimit: 18, lumMax: 252 }]);
  TARGETS.push([join(OUT, `bg/era${n}/mountains-mid.png`), { chromaLimit: 18, lumMax: 252 }]);
  TARGETS.push([join(OUT, `bg/era${n}/foreground.png`),    { chromaLimit: 18, lumMax: 252 }]);
}

const start = Date.now();
let ok = 0, miss = 0;
for (const [path, opts] of TARGETS) {
  const did = await floodFillKey(path, opts);
  if (did) ok++; else miss++;
}
console.log(`\nflood-fill keyout — ${ok} ok / ${miss} missing in ${((Date.now() - start) / 1000).toFixed(1)}s`);
