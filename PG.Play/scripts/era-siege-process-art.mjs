// One-shot art importer.
//
// Reads era<N>_{sky,clouds}.png from ~/Desktop, strips the Gemini
// watermark from the bottom-right corner, downscales to runtime-
// reasonable dimensions, and writes into the locations the asset
// manifest expects:
//
//   public/games/era-siege/bg/era<N>/sky.png
//   public/games/era-siege/bg/era<N>/clouds.png
//
// Usage:
//   node scripts/era-siege-process-art.mjs
//
// Watermark approach:
//   * Sky (opaque):    sample a clean strip to the left of the
//                       watermark and composite it over the corner.
//   * Clouds (alpha):  composite a fully transparent rectangle.
//
// Idempotent — re-runs overwrite the same destination files.

import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT    = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
// User-managed source folder (note: their spelling has a typo — "seige").
// Files dropped here are processed into the public/ tree the renderer reads.
const SRC_DIR = resolve(ROOT, 'assets/era-seige');
const DEST_BG = resolve(ROOT, 'public/games/era-siege/bg');

// Output dimensions. The asset doc spec — sky 1920×600, clouds 1920×660.
// We honour the source aspect when scaling down.
const SKY_TARGET_W    = 1920;
const CLOUDS_TARGET_W = 1920;

// Watermark is in the bottom-right corner. These ratios cover it on
// the source images comfortably (the corner is ~6% × 22% of frame).
const WATERMARK_W_FRAC = 0.07;
const WATERMARK_H_FRAC = 0.24;

async function processSky(eraN) {
  const src  = join(SRC_DIR, `era${eraN}_sky.png`);
  const dest = join(DEST_BG, `era${eraN}/sky.png`);
  if (!existsSync(src)) { console.warn(`skip era${eraN}_sky — source missing`); return; }
  const img  = sharp(src);
  const meta = await img.metadata();
  const W = meta.width, H = meta.height;
  // Watermark patch dims (in source resolution).
  const ww = Math.round(W * WATERMARK_W_FRAC);
  const wh = Math.round(H * WATERMARK_H_FRAC);
  // Sample strip: a vertical band well left of the watermark, same height.
  const sampleX = Math.max(0, W - ww * 4);
  const sampleY = H - wh;
  const sample  = await sharp(src)
    .extract({ left: sampleX, top: sampleY, width: ww, height: wh })
    .toBuffer();

  // Composite the sampled patch over the bottom-right corner.
  const stripped = await sharp(src)
    .composite([{
      input: sample,
      left: W - ww,
      top:  H - wh,
    }])
    .toBuffer();

  // Downscale + write.
  await sharp(stripped)
    .resize({ width: SKY_TARGET_W, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toFile(dest);

  console.log(`✓ era${eraN}/sky.png ← ${src} (${W}×${H} → ≤${SKY_TARGET_W}px wide)`);
}

async function processClouds(eraN) {
  const src  = join(SRC_DIR, `era${eraN}_clouds.png`);
  const dest = join(DEST_BG, `era${eraN}/clouds.png`);
  if (!existsSync(src)) { console.warn(`skip era${eraN}_clouds — source missing`); return; }
  const img  = sharp(src);
  const meta = await img.metadata();
  const W = meta.width, H = meta.height;
  const ww = Math.round(W * WATERMARK_W_FRAC);
  const wh = Math.round(H * WATERMARK_H_FRAC);

  // For the cloud sheet the watermark sits on a transparent area, so
  // composite a fully transparent rectangle to clear it.
  const transparent = await sharp({
    create: {
      width: ww,
      height: wh,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).png().toBuffer();

  const stripped = await sharp(src)
    // dest-out wipes any existing pixels under a non-zero alpha
    // mask. Composite using `dest-out` on a fully-opaque rect would
    // erase the corner entirely. We just want to overwrite — that's
    // the default `over`. Using `over` with a transparent rect is a
    // no-op, so we use `dest-out` with a fully-opaque mask of the
    // right shape.
    .composite([{
      input: await sharp({
        create: {
          width: ww,
          height: wh,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).png().toBuffer(),
      left: W - ww,
      top:  H - wh,
      blend: 'dest-out',
    }])
    .toBuffer();

  await sharp(stripped)
    .resize({ width: CLOUDS_TARGET_W, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toFile(dest);

  console.log(`✓ era${eraN}/clouds.png ← ${src} (${W}×${H} → ≤${CLOUDS_TARGET_W}px wide)`);
}

(async () => {
  for (let n = 1; n <= 5; n++) {
    mkdirSync(join(DEST_BG, `era${n}`), { recursive: true });
    await processSky(n);
    await processClouds(n);
  }
  console.log('\ndone — restart the dev server (or hard-reload) to see them in the renderer.');
})().catch((err) => { console.error(err); process.exit(1); });
