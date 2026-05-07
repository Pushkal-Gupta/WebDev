// Era Siege — universal background cleaner.
//
// Walks every PNG under `public/games/era-siege/` and strips any
// residual transparency-checker / pure-white background that the
// per-batch crop scripts left behind.
//
// Strategy:
//   1. Unconditional grey-pixel cull. Any opaque pixel whose colour
//      sits in the unmistakable bg signature gets cleared:
//        - PURE WHITE  (lum ≥ 245, chr ≤ 6)
//        - GEMINI CHECKER GREYS (lum 50-90 or 105-150, chr ≤ 6)
//      Saturated artwork pixels (any visible hue → chr > 6) survive.
//      Black outlines (lum < 40) survive.
//      This is safe because legit greyscale figure pixels are RARE in
//      our hand-art set (which uses purple, brass, iron-blue, ember-
//      orange, etc — all saturated palettes).
//
//   2. Edge feather: any opaque pixel with a transparent 4-neighbour
//      drops to alpha=215 to kill the hard "lasso" outline.
//
//   3. Auto-trim alpha=0 borders so the resulting bbox is tight.
//
// Idempotent: re-running on already-cleaned PNGs is safe — bg pixels
// are already alpha=0, so they pass straight through. Backgrounds
// (sky / mountains / foreground) are excluded from the trim because
// the renderer's stretch-to-view math depends on the full canvas
// rect; their bg is keyed but the dimensions stay.

import sharp from 'sharp';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT  = resolve(ROOT, 'public/games/era-siege');

// Keep stretch-to-view backgrounds at their original canvas size.
const NO_TRIM_PATTERNS = [
  /\/bg\//,
  /\/vfx\/.*\.png$/,        // explosion strips etc are tightly packed sheets
];

function cullBg(buf, w, h, isBg) {
  const px = w * h;
  let cleared = 0;
  // Background PNGs (sky/clouds/mountains/foreground) get a more
  // aggressive grey cull — their legit art uses saturated hues, so
  // any low-chroma pixel is alpha-checker artifact. Unit/turret art
  // can have moderate greys (steel armor, smoke) so the cap stays
  // tighter there.
  // - greyMaxLum: upper luminance bound for cull
  // - greyMaxChr: upper chromaticity bound — bg files extend to chr≤22
  //   to catch tinted alpha-checker artifacts (chr 10-22) that survive
  //   the chr<=9 unit-safe filter. Real bg art (sunset orange, deep
  //   purple, gold) has chr > 30 so it stays.
  const greyMaxLum = isBg ? 220 : 160;
  const greyMaxChr = isBg ? 22  : 9;
  // ── Pass 1: unconditional cull for definite background pixels ──
  // - Pure / near-pure white at any chroma (catches warm-white halos
  //   like rgba(252, 248, 240) — anti-aliasing tint from a warm body)
  // - Gemini's specific checker greys at chr ≤ 6
  for (let i = 0; i < px; i++) {
    const o = i * 4;
    if (buf[o + 3] === 0) continue;
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const chr = Math.max(r, g, b) - Math.min(r, g, b);
    const lum = (r + g + b) / 3;
    // Aggressive near-white kill — covers tinted halos. lum 245+ AND
    // chr ≤ 30 catches rgba(252,248,240) and rgba(245,255,250) but
    // spares saturated highlights with chr > 30 (gold flame, cyan
    // bolt, magenta crystal — all chr > 60 anyway).
    if (lum >= 245 && chr <= 30) { buf[o + 3] = 0; cleared++; continue; }
    // Widened from chr≤6 to chr≤9 — Gemini's checker pixels often ship
    // with off-by-one channel noise (e.g. rgb(96,96,98) chr=2 vs.
    // rgb(112,107,113) chr=6). Wider threshold catches the noise; legit
    // figure pixels reliably have chr > 12 in our saturated palettes.
    if (chr > greyMaxChr) continue;
    // Single contiguous band lum 32-greyMaxLum.
    if (lum >= 32 && lum <= greyMaxLum) {
      buf[o + 3] = 0; cleared++;
    }
  }
  // ── Pass 2: edge-connected near-white flood ──
  // Halos sit just inside the figure outline. After Pass 1 the FAR
  // edges are already transparent; a flood-fill seeded at every edge
  // pixel can sweep inward through anti-aliased near-whites (lum ≥
  // 220, chr ≤ 35) until it hits a saturated-colour figure pixel.
  // This catches tinted halos missed by Pass 1 without eating the
  // figure interior (the figure has chr > 35 throughout).
  const stride = w * 4;
  const visited = new Uint8Array(px);
  const queue = new Int32Array(px);
  let head = 0, tail = 0;
  function eligible(o) {
    if (buf[o + 3] === 0) return true;
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const lum = (r + g + b) / 3;
    if (lum < 220) return false;
    const chr = Math.max(r, g, b) - Math.min(r, g, b);
    return chr <= 35;
  }
  function seed(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = y * w + x;
    if (visited[i]) return;
    visited[i] = 1;
    if (eligible(y * stride + x * 4)) queue[tail++] = i;
  }
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (head < tail) {
    const q = queue[head++];
    const x = q % w, y = (q / w) | 0;
    const o = y * stride + x * 4;
    if (buf[o + 3] !== 0) { buf[o + 3] = 0; cleared++; }
    seed(x - 1, y); seed(x + 1, y);
    seed(x, y - 1); seed(x, y + 1);
  }
  return cleared;
}

function featherEdge(buf, w, h) {
  const stride = w * 4;
  const out = Buffer.from(buf);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = y * stride + x * 4;
      if (out[o + 3] !== 255) continue;
      const hasTransparentNeighbour = (
           buf[o - 4 + 3]      === 0
        || buf[o + 4 + 3]      === 0
        || buf[o - stride + 3] === 0
        || buf[o + stride + 3] === 0
      );
      if (!hasTransparentNeighbour) continue;
      // Don't feather pure / near-white pixels — they'd render as a
      // ghostly halo against the dark canvas. Instead, drop them to
      // alpha=0 entirely. (Saturated colours feather as before.)
      const r = out[o], g = out[o + 1], b = out[o + 2];
      const lum = (r + g + b) / 3;
      const chr = Math.max(r, g, b) - Math.min(r, g, b);
      if (lum >= 220 && chr <= 35) {
        out[o + 3] = 0;
      } else {
        out[o + 3] = 215;
      }
    }
  }
  buf.set(out);
}

async function clean(filepath) {
  const meta = await sharp(filepath).metadata();
  const w = meta.width, h = meta.height;
  if (!w || !h) return { skipped: 'no metadata' };
  const raw = await sharp(filepath).ensureAlpha().raw().toBuffer();
  const buf = Buffer.from(raw);
  const isBg = /\/bg\//.test(filepath);
  const cleared = cullBg(buf, w, h, isBg);
  if (cleared === 0) return { unchanged: true, w, h };
  featherEdge(buf, w, h);
  let pipeline = sharp(buf, { raw: { width: w, height: h, channels: 4 } });
  const noTrim = NO_TRIM_PATTERNS.some((rx) => rx.test(filepath));
  if (!noTrim) {
    pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 });
  }
  await pipeline.png({ compressionLevel: 9 }).toFile(filepath + '.tmp');
  // Atomic replace — preserves original if save fails.
  await sharp(filepath + '.tmp').toFile(filepath);
  await import('node:fs/promises').then((fs) => fs.unlink(filepath + '.tmp')).catch(() => {});
  const m2 = await sharp(filepath).metadata();
  return { cleared, w0: w, h0: h, w1: m2.width, h1: m2.height };
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.png')) out.push(p);
  }
  return out;
}

(async () => {
  if (!existsSync(OUT)) { console.error(`No ${OUT}`); process.exit(1); }
  const files = walk(OUT);
  console.log(`Cleaning ${files.length} PNGs in ${OUT.replace(ROOT + '/', '')}…`);
  let touched = 0, untouched = 0;
  const start = Date.now();
  for (const f of files) {
    try {
      const r = await clean(f);
      if (r.cleared > 0) {
        touched++;
        console.log(`  ✓ ${f.replace(ROOT + '/', '')}  cleared ${r.cleared}px  ${r.w0}×${r.h0} → ${r.w1}×${r.h1}`);
      } else {
        untouched++;
      }
    } catch (e) {
      console.error(`  ✗ ${f.replace(ROOT + '/', '')}  ${e.message}`);
    }
  }
  console.log(`\nclean — ${touched} touched / ${untouched} already clean in ${((Date.now() - start) / 1000).toFixed(1)}s`);
})();
