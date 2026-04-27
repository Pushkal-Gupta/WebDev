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

async function emitSprite(cellBuf, outFile, target = 128) {
  // Trim transparent edges, square-pad with 8% margin, resize to target.
  const t = await sharp(cellBuf).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  const max = Math.max(m.width, m.height);
  const pad = Math.round(max * 0.08);
  const side = max + pad * 2;
  await sharp(t.data)
    .extend({
      top:    Math.floor((side - m.height) / 2),
      bottom: Math.ceil((side - m.height) / 2),
      left:   Math.floor((side - m.width)  / 2),
      right:  Math.ceil((side - m.width)  / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize(target, target, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
}

async function processSheet(sheetPath, layout) {
  for (const item of layout) {
    const cell = await sharp(sheetPath)
      .extract({ left: item.col * CELL_W, top: item.row * CELL_H, width: CELL_W, height: CELL_H })
      .toBuffer();
    const out = join(OUT_SPRITES, item.name);
    await emitSprite(cell, out, 128);
    process.stdout.write(`  ${item.name}\n`);
  }
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
  console.log('▶︎ Frost-Fight cover');
  await processCover();
  console.log('done');
})();
