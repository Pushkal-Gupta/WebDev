// Frost Fight — process the user-provided art sheets into clean
// per-sprite PNGs.
//
// The user dropped these into assets/frost-fight/:
//   A Type 1.png   — 2x2 grid: player | strawberry / blueberry | fruit
//   B Type 1.png   — 2x2 grid: strawberry-windup | blueberry-windup / ice | exit
//   Frost-Fight.png — full showcase sheet (we crop the painted scene
//                     from the bottom-right for the lobby cover)
//
// Each cell is extracted, trimmed of transparent borders, square-padded
// with an 8% margin, downscaled to 128×128, and emitted as PNG into
// src/games/frost-fight/sprites/. The existing SVGs are preserved as
// fallbacks; the game's loader picks PNG first via import-path swap
// (handled in FrostFightGame.jsx after this script runs).
//
// Run:  node scripts/frost-fight-process-art.mjs

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight');
const OUT_SPRITES = resolve(ROOT, 'src/games/frost-fight/sprites');
const OUT_COVER   = resolve(ROOT, 'src/games/frost-fight/sprites');

// A / B sheets are 2816×1536 — a 2x2 grid of 1408×768 cells.
const SHEET_W = 2816;
const SHEET_H = 1536;
const CELL_W  = SHEET_W / 2;
const CELL_H  = SHEET_H / 2;

// Sprite layouts. (col, row) is which 2x2 cell to extract from each sheet.
const A_LAYOUT = [
  { name: 'player.png',     col: 0, row: 0 },
  { name: 'strawberry.png', col: 1, row: 0 },
  { name: 'blueberry.png',  col: 0, row: 1 },
  { name: 'fruit.png',      col: 1, row: 1 },
];
const B_LAYOUT = [
  { name: 'strawberry-windup.png', col: 0, row: 0 },
  { name: 'blueberry-windup.png',  col: 1, row: 0 },
  { name: 'ice.png',               col: 0, row: 1 },
  { name: 'exit.png',              col: 1, row: 1 },
];
// A Type 2 carries the alt-fruit cast: ice cream (same as A1, skipped),
// the cherry pair (top-right), an orange villain (bottom-left), and a
// peach pickup (bottom-right). The orange wires up as a third enemy
// class; cherry + peach stay available for future content drops.
const A2_LAYOUT = [
  { name: 'cherry.png', col: 1, row: 0 },
  { name: 'orange.png', col: 0, row: 1 },
  { name: 'peach.png',  col: 1, row: 1 },
];

// Single-character drops (one image per file). These are full-frame
// renders rather than 2x2 sheets, so they get their own processor:
// strip platform UI badges in the corner, trim transparent edges,
// square-pad, resize to 128.
const SINGLES = [
  // The orange wind-up source has Gemini share/download UI chips in the
  // top-right. Wipe a generous rectangle (the buttons sit well above
  // the orange head, so a 22 % tall wipe is safe) and use a higher
  // trim threshold so faint sub-pixel alpha at the wipe edges doesn't
  // leak into the character bbox.
  { src: 'orange-wind-up.png', out: 'orange-windup.png',
    wipeTopRight: { wPct: 0.42, hPct: 0.22 }, trimThreshold: 25 },
  // Cherry-windup screenshot ships with the chat-platform UI badge in
  // the top-right corner; same wipe pattern. Two variants supplied —
  // we use the second (cleaner alignment) and skip the first.
  { src: 'cherry-windup2.png', out: 'cherry-windup.png',
    wipeTopRight: { wPct: 0.30, hPct: 0.18 }, trimThreshold: 18 },
];

// Long-format singles. Currently empty — the FROST FIGHT wordmark is
// rendered as inline vector text in src/covers.jsx so it scales
// infinitely without rasterising.
const WIDE_SINGLES = [];

// Wall texture sheets — opaque 2048×2048. The user's drops have a
// small Gemini "sparkle" badge in the bottom-right corner; we cover it
// by extracting a similarly-sized region from the bottom-left of the
// same image, flopping it horizontally, and compositing over the badge
// zone. For these textures the bottom band is roughly translation-
// invariant on the horizontal axis, so the seam reads as natural
// continuation rather than a visible patch. Final resize 256×256.
const WALLS = [
  { src: 'pantry.png',       out: 'pantry.png' },
  { src: 'coldroom.png',     out: 'coldroom.png' },
  { src: 'aisle.png',        out: 'aisle.png' },
  { src: 'walkin.png',       out: 'walkin.png' },
  { src: 'loadingdock.png',  out: 'loadingdock.png' },
  { src: 'subbasement.png',  out: 'subbasement.png' },
];

// Aggressive alpha cleanup. Any pixel whose alpha is below `lowCut`
// becomes fully transparent — kills the soft halo the AI generator
// leaves around painted character outlines. Pixels above `highCut`
// snap to fully opaque so the silhouette reads cleanly. Mid-alpha
// pixels (real anti-aliased edges) are preserved untouched.
async function lassoAlpha(buf, lowCut = 60, highCut = 240) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = raw.info;
  const data = raw.data;
  for (let i = 3; i < data.length; i += channels) {
    const a = data[i];
    if (a < lowCut) data[i] = 0;
    else if (a > highCut) data[i] = 255;
    // else: keep as-is (anti-aliased outline pixels)
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

// Wrap a processed PNG buffer into an SVG file with the same display
// size. The PNG is converted to WebP (40-60% smaller for painterly
// art) and embedded as a base64 data URI inside an `<image>` element.
// Output is a true `.svg` file Vite emits as a static asset; consumers
// `import x from '...svg?url'` like any other asset. Browsers rasterise
// the embedded WebP at whatever rendered size, so the sprite scales
// without re-encoding.
async function svgWrap(pngBuf, side, outFile) {
  const webpBuf = await sharp(pngBuf)
    .webp({ quality: 88, effort: 6, alphaQuality: 90 })
    .toBuffer();
  const b64 = webpBuf.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet">
  <image href="data:image/webp;base64,${b64}" x="0" y="0" width="${side}" height="${side}" image-rendering="auto"/>
</svg>
`;
  await fs.promises.writeFile(outFile, svg);
}

async function emitSprite(cellBuf, outFile, target = 512, trimThreshold = 5) {
  // Pipeline: lasso alpha cleanup → trim → square-pad with 8% margin →
  // resize to target → emit as a transparent WebP. WebP is the canonical
  // sprite format because the game draws via canvas drawImage and SVG
  // wrappers around raster data don't rasterize inside `<canvas>` on
  // most browsers (they silently render blank). Direct WebP works.
  const cleaned = await lassoAlpha(cellBuf);
  const t = await sharp(cleaned).trim({ threshold: trimThreshold }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  const max = Math.max(m.width, m.height);
  const pad = Math.round(max * 0.08);
  const side = max + pad * 2;
  const padded = await sharp(t.data)
    .extend({
      top:    Math.floor((side - m.height) / 2),
      bottom: Math.ceil((side - m.height) / 2),
      left:   Math.floor((side - m.width)  / 2),
      right:  Math.ceil((side - m.width)  / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  // outFile arg may end in .png — coerce to .webp for the actual write.
  const webpFile = outFile.replace(/\.(png|svg)$/i, '.webp');
  await sharp(padded)
    .resize(target, target, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 95, effort: 6 })
    .toFile(webpFile);
}

async function processSheet(sheetPath, layout) {
  for (const item of layout) {
    const cell = await sharp(sheetPath)
      .extract({ left: item.col * CELL_W, top: item.row * CELL_H, width: CELL_W, height: CELL_H })
      .toBuffer();
    const out = join(OUT_SPRITES, item.name);
    await emitSprite(cell, out, 512);
    process.stdout.write(`  ${item.name}\n`);
  }
}

// Single-frame characters. Wipes a configurable top-right rectangle so
// platform UI badges (share / download buttons) get erased before the
// trim crops the sprite tight to its character bbox.
async function processSingle(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const ww = Math.round(meta.width  * (item.wipeTopRight?.wPct ?? 0));
  const wh = Math.round(meta.height * (item.wipeTopRight?.hPct ?? 0));
  let buf = await sharp(src).png().toBuffer();
  if (ww > 0 && wh > 0) {
    const mask = await sharp({
      create: { width: ww, height: wh, channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    buf = await sharp(buf)
      .composite([{ input: mask, left: meta.width - ww, top: 0, blend: 'dest-out' }])
      .png().toBuffer();
  }
  await emitSprite(buf, join(OUT_SPRITES, item.out), 512, item.trimThreshold ?? 5);
  process.stdout.write(`  ${item.out}\n`);
}

// Wide single — wordmark style. Wipes the platform UI badge, trims,
// resizes by width while preserving aspect ratio.
async function processWideSingle(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const ww = Math.round(meta.width  * (item.wipeTopRight?.wPct ?? 0));
  const wh = Math.round(meta.height * (item.wipeTopRight?.hPct ?? 0));
  let buf = await sharp(src).png().toBuffer();
  if (ww > 0 && wh > 0) {
    const mask = await sharp({
      create: { width: ww, height: wh, channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    buf = await sharp(buf)
      .composite([{ input: mask, left: meta.width - ww, top: 0, blend: 'dest-out' }])
      .png().toBuffer();
  }
  const cleaned = await lassoAlpha(buf);
  const trimmed = await sharp(cleaned).trim({ threshold: item.trimThreshold ?? 5 })
    .toBuffer({ resolveWithObject: true });
  const pngBuf = await sharp(trimmed.data)
    .resize({ width: item.targetWidth ?? 1024 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const outPng = join(OUT_SPRITES, item.out);
  await fs.promises.writeFile(outPng, pngBuf);
  // SVG wrap with webp embedding. Preserves the wide aspect ratio.
  const wrapMeta = await sharp(pngBuf).metadata();
  const webpBuf = await sharp(pngBuf)
    .webp({ quality: 88, effort: 6, alphaQuality: 90 })
    .toBuffer();
  const b64 = webpBuf.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wrapMeta.width} ${wrapMeta.height}" width="${wrapMeta.width}" height="${wrapMeta.height}" preserveAspectRatio="xMidYMid meet">
  <image href="data:image/webp;base64,${b64}" x="0" y="0" width="${wrapMeta.width}" height="${wrapMeta.height}"/>
</svg>
`;
  await fs.promises.writeFile(outPng.replace(/\.png$/, '.svg'), svg);
  process.stdout.write(`  ${item.out} + .svg (${wrapMeta.width}×${wrapMeta.height})\n`);
}

// Wall-texture pipeline. Strips the bottom-right Gemini sparkle, then
// resizes to 256x256 for the in-game CanvasPattern repeat fill.
async function processWall(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const W = meta.width, H = meta.height;
  // Patch zone: ~14 % × 14 % at the bottom-right covers the badge with
  // headroom. Source patch: same dims taken from the bottom-LEFT and
  // flopped horizontally so the texture's horizontal grain continues.
  const ww = Math.round(W * 0.14);
  const wh = Math.round(H * 0.14);
  const patch = await sharp(src)
    .extract({ left: 0, top: H - wh, width: ww, height: wh })
    .flop()
    .png()
    .toBuffer();
  const cleaned = await sharp(src)
    .composite([{ input: patch, left: W - ww, top: H - wh }])
    .toBuffer();
  // Out folder is sprites/walls/. Final 256×256 PNG with sharp
  // compression. We DON'T trim or pad — wall textures are tiles, not
  // sprites; they need to keep their full square frame for the
  // CanvasPattern('repeat') to align.
  const outDir = join(OUT_SPRITES, 'walls');
  mkdirSync(outDir, { recursive: true });
  await sharp(cleaned)
    .resize(256, 256, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, item.out));
  process.stdout.write(`  walls/${item.out}\n`);
}

// The Frost-Fight.png sheet contains a painted scene in the bottom-right
// roughly the rightmost ~37% × bottom ~33%. We crop, trim slightly,
// and emit a 1280×720 PNG.
async function processCover() {
  const meta = await sharp(join(SRC, 'Frost-Fight.png')).metadata();
  const W = meta.width, H = meta.height;
  // Empirical region — confirmed visually. Tweak if the source layout shifts.
  const left   = Math.round(W * 0.625);
  const top    = Math.round(H * 0.555);
  const width  = W - left;
  const height = H - top;
  const cropped = await sharp(join(SRC, 'Frost-Fight.png'))
    .extract({ left, top, width, height })
    .toBuffer();
  // Two webp variants — 1280 for the WinCard backdrop + lobby cover,
  // 640 as a smaller fallback. Webp is the canonical output so the
  // script is idempotent (no PNG leftover from a previous run).
  await sharp(cropped)
    .resize(1280, 720, { fit: 'cover', position: 'center' })
    .webp({ quality: 82, effort: 6 })
    .toFile(join(OUT_COVER, 'cover.webp'));
  await sharp(cropped)
    .resize(640, 360, { fit: 'cover', position: 'center' })
    .webp({ quality: 80, effort: 6 })
    .toFile(join(OUT_COVER, 'cover-640.webp'));
  process.stdout.write(`  cover.webp + cover-640.webp (cropped ${width}×${height})\n`);
}

(async () => {
  mkdirSync(OUT_SPRITES, { recursive: true });
  console.log('▶︎ A Type 1');
  await processSheet(join(SRC, 'A Type 1.png'), A_LAYOUT);
  console.log('▶︎ B Type 1');
  await processSheet(join(SRC, 'B Type 1.png'), B_LAYOUT);
  console.log('▶︎ A Type 2');
  await processSheet(join(SRC, 'A Type 2.png'), A2_LAYOUT);
  console.log('▶︎ Singles');
  for (const s of SINGLES) await processSingle(s);
  console.log('▶︎ Wide singles');
  for (const ws of WIDE_SINGLES) await processWideSingle(ws);
  console.log('▶︎ Walls');
  for (const w of WALLS) await processWall(w);
  console.log('▶︎ Frost-Fight cover');
  await processCover();
  console.log('done');
})();
