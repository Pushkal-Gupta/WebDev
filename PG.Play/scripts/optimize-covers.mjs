// One-shot optimizer for cover key art and the OG social image.
//
// Source: large lossless PNGs delivered by the design step (~7 MB each).
// Output: a small responsive set of WebP variants used by the bento + a
// JPEG fallback the OG endpoint can serve to platforms that don't speak
// WebP (older Twitter, etc).
//
// Run:  npm run optimize:covers
//
// Idempotent — overwrites outputs in place.

import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Cover variants. The bento hero tile renders at roughly 600×750 css px on
// desktop, 800×1000 on retina. We ship 1x (640w), 2x (1280w), and 3x
// (1920w) so devicePixelRatio up to 3 is covered with sharp output.
const COVER_VARIANTS = [
  { suffix: '-640.webp',  width: 640,  format: 'webp', quality: 76 },
  { suffix: '-1280.webp', width: 1280, format: 'webp', quality: 78 },
  { suffix: '-1920.webp', width: 1920, format: 'webp', quality: 80 },
  // A small JPEG fallback keeps the older sharing platforms happy if we
  // ever switch any cover to be the OG image.
  { suffix: '-1280.jpg',  width: 1280, format: 'jpeg', quality: 80 },
];

// OG image variants. 1200×630 is the social-card sweet spot.
const OG_VARIANTS = [
  { name: 'og.webp', width: 1200, height: 630, format: 'webp', quality: 88 },
  { name: 'og-1200.jpg',  width: 1200, height: 630, format: 'jpeg', quality: 88 },
];

// Sources live in assets/source-covers/ (gitignored or tracked, but NOT
// served). Only the optimized output ships in public/.
const SOURCE_DIR = resolve(root, 'assets/source-covers');
const PUBLIC_COVERS = resolve(root, 'public/covers');

async function processCovers() {
  if (!existsSync(SOURCE_DIR)) {
    console.log('assets/source-covers/ missing — nothing to optimize.');
    return;
  }
  await mkdir(PUBLIC_COVERS, { recursive: true });
  const entries = await readdir(SOURCE_DIR);
  const sources = entries.filter((f) => /\.(png|jpe?g)$/i.test(f) && f !== 'og.png');
  if (!sources.length) {
    console.log('No source covers found in assets/source-covers/.');
    return;
  }
  for (const filename of sources) {
    const inPath = resolve(SOURCE_DIR, filename);
    const stem = filename.replace(/\.[^.]+$/, '');
    for (const v of COVER_VARIANTS) {
      const outPath = resolve(PUBLIC_COVERS, `${stem}${v.suffix}`);
      const pipeline = sharp(inPath, { failOn: 'truncated' })
        .resize({ width: v.width, withoutEnlargement: true })
        .toFormat(v.format, { quality: v.quality });
      const info = await pipeline.toFile(outPath);
      console.log(`  ${stem}${v.suffix} ${(info.size / 1024).toFixed(0)} KB`);
    }
  }
}

async function processOG() {
  const inPath = resolve(SOURCE_DIR, 'og.png');
  if (!existsSync(inPath)) {
    console.log('assets/source-covers/og.png missing — skipping OG.');
    return;
  }
  for (const v of OG_VARIANTS) {
    const outPath = resolve(root, 'public', v.name);
    const pipeline = sharp(inPath, { failOn: 'truncated' })
      .resize({ width: v.width, height: v.height, fit: 'cover' })
      .toFormat(v.format, { quality: v.quality });
    const info = await pipeline.toFile(outPath);
    console.log(`  ${v.name} ${(info.size / 1024).toFixed(0)} KB`);
  }
}

console.log('Optimizing covers…');
await processCovers();
console.log('Optimizing OG…');
await processOG();
console.log('Done.');
