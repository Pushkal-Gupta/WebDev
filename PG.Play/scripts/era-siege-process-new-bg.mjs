// Era Siege — process the second batch of source sheets (10-20.png).
//
// These are INDIVIDUAL hand-illustrated assets on a transparent
// checkerboard (Gemini's standard alpha export). Each one gets:
//
//   1. The Gemini sparkle watermark in the bottom-right corner cleared
//      to alpha=0 (the watermark is ~36×36 px, sits in a stable spot).
//   2. The transparency-checker pixels keyed out (any leftover greys
//      that weren't already alpha=0).
//   3. Tight bbox trim.
//   4. Save to the matching public/games/era-siege/... path.
//
// File map (manual — these are individual sheets, not multi-figure rows):
//   10.png → unit/era5/general-alt.png   (alt void champion)
//   11.png → unit/era5/general.png       (void mage — replaces general)
//   12.png → turret/era5.png             (void crystal tower)
//   13.png → bg/era5/sky.png             (void nebula)
//   14.png → bg/era5/mountains-mid.png   (void mountain peaks)
//   15.png → bg/era5/foreground.png      (void crystal vines)
//   16.png → bg/era1/mountains-mid.png   (ember mountain peaks)
//   17.png → bg/era1/foreground.png      (ember bones + dirt)
//   18.png → bg/era2/sky.png             (iron storm clouds)
//   19.png → bg/era2/mountains-mid.png   (iron mountains + castles)
//   20.png → bg/era3/foreground.png      (foundry brass barrels)
//
// Run:  node scripts/era-siege-process-new-bg.mjs

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC  = resolve(ROOT, 'assets/age-of-war');
const OUT  = resolve(ROOT, 'public/games/era-siege');

// ── Gemini watermark mask ────────────────────────────────────────────
// The sparkle sits in the bottom-right ~36 px of every Gemini-generated
// image. Clear that corner to alpha=0 unconditionally.
const WATERMARK_W = 60;
const WATERMARK_H = 60;
const WATERMARK_INSET = 6;     // a few px in from the edge

// ── Background keyout (gentler than the unit sheets — these are mostly
// already-transparent, only need the residual checker stripped). ─────
function keyoutCheckerAndWatermark(buf, w, h, opts = {}) {
  const stride = w * 4;
  // 1) Wipe the watermark corner unconditionally.
  const mwL = Math.max(0, w - WATERMARK_W - WATERMARK_INSET);
  const mwR = Math.max(0, w - WATERMARK_INSET);
  const mwT = Math.max(0, h - WATERMARK_H - WATERMARK_INSET);
  const mwB = Math.max(0, h - WATERMARK_INSET);
  for (let y = mwT; y < mwB; y++) {
    for (let x = mwL; x < mwR; x++) {
      buf[y * stride + x * 4 + 3] = 0;
    }
  }
  // 2) Unconditional grey-pixel cull. Gemini's transparency-checker
  // uses two pure-grey shades (lum 58 and lum 104, chr=0) plus their
  // anti-aliased blend. ANY pixel matching that signature is bg even
  // when surrounded by opaque figure — the figures themselves use
  // saturated colours (purple, orange, blue) so they have chr > 6.
  // This avoids the flood-fill blocking issue (figure shadows had grey
  // tones connecting bg to the figure body).
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (buf[o + 3] === 0) continue;
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const chr = Math.max(r, g, b) - Math.min(r, g, b);
    if (chr > 6) continue;
    const lum = (r + g + b) / 3;
    if (lum >= 40 && lum <= 160) buf[o + 3] = 0;
  }
  return buf;
}

async function process(srcPath, outPath, opts = {}) {
  if (!existsSync(srcPath)) { console.warn(`  · skip — ${srcPath} missing`); return false; }
  const meta = await sharp(srcPath).metadata();
  const w = meta.width, h = meta.height;
  const raw = await sharp(srcPath).ensureAlpha().raw().toBuffer();
  const cleaned = keyoutCheckerAndWatermark(Buffer.from(raw), w, h, opts);
  const intermediate = await sharp(cleaned, {
    raw: { width: w, height: h, channels: 4 },
  }).png({ compressionLevel: 9 }).toBuffer();
  // Trim character / structure assets so the silhouette fills the
  // canvas. Backgrounds keep their full bbox so the runtime's stretch
  // math stays correct.
  let pipeline = sharp(intermediate);
  if (opts.trim) {
    pipeline = pipeline.trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 });
  }
  // Downscale — even after trim the source PNGs are 1500-2700 px wide,
  // which costs MB per asset. The runtime renders at most ~250 px tall
  // for units / 220 px tall for bases / view-width for backgrounds.
  // Cap at 2× the runtime target so retina screens stay sharp.
  const MAX_UNIT_H = 600;          // 2× ~250-px target
  const MAX_BG_W   = 1920;         // 2× a 960 viewport
  if (opts.trim) {
    pipeline = pipeline.resize({ height: MAX_UNIT_H, fit: 'inside', withoutEnlargement: true });
  } else {
    pipeline = pipeline.resize({ width: MAX_BG_W, fit: 'inside', withoutEnlargement: true });
  }
  const trimmed = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(trimmed).toFile(outPath);
  const m = await sharp(outPath).metadata();
  console.log(`  ✓ ${outPath.replace(ROOT + '/', '')} (${m.width}×${m.height}, ${trimmed.length} B)`);
  return true;
}

const JOBS = [
  // Void champion alts — slot 10 + 11 into general (replacing the cropped
  // sheet 5 general). 10 stays as a backup (general-alt) we don't load
  // by default but keep around. 11 (the magus) becomes the canonical
  // void general since it has the most readable silhouette.
  { src: '10.png', out: 'unit/era5/general-alt.png',     trim: true },
  { src: '11.png', out: 'unit/era5/general.png',          trim: true },
  // Void crystal tower — replaces the era5 turret PNG.
  { src: '12.png', out: 'turret/era5.png',                trim: true },
  // Backgrounds (no trim — keep the full canvas so the renderer's
  // stretch-to-view math sees the right aspect).
  { src: '13.png', out: 'bg/era5/sky.png' },
  { src: '14.png', out: 'bg/era5/mountains-mid.png' },
  { src: '15.png', out: 'bg/era5/foreground.png' },
  { src: '16.png', out: 'bg/era1/mountains-mid.png' },
  { src: '17.png', out: 'bg/era1/foreground.png' },
  { src: '18.png', out: 'bg/era2/sky.png' },
  { src: '19.png', out: 'bg/era2/mountains-mid.png' },
  { src: '20.png', out: 'bg/era3/foreground.png' },
];

console.log(`Processing ${JOBS.length} new assets from assets/age-of-war/...`);
const start = Date.now();
let ok = 0, fail = 0;
for (const j of JOBS) {
  try {
    const did = await process(join(SRC, j.src), join(OUT, j.out), j);
    if (did) ok++; else fail++;
  } catch (e) {
    console.error(`  ✗ ${j.src} → ${j.out}: ${e.message}`);
    fail++;
  }
}
console.log(`\nprocess-new-bg — ${ok} ok / ${fail} failed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
