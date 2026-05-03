// Frost Fight — Harvest theme wall textures.
//
// User-supplied source images:
//   img1.png  — single 2048×2048 seamless wood-and-vines panel
//   img2.png  — 2048×2048 atlas of 6 panels (2 cols × 3 rows):
//                 [0,0] moss + pebbles
//                 [1,0] wood + vines
//                 [0,1] bark + autumn leaves
//                 [1,1] deep moss with leaf litter
//                 [0,2] woven basket with apples + wheat
//                 [1,2] river stones + moss
//
// These are clean photo-style textures (no Gemini badge to wipe), so
// the pipeline is simple: square-crop → resize 256×256 → save into
// sprites/walls/ where the existing CanvasPattern repeat path picks
// them up automatically. No code change needed in the game once the
// PNGs land — but we still wire the room→key map below.
//
// Run:  node scripts/frost-fight-harvest-walls.mjs

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight');
const OUT = resolve(ROOT, 'src/games/frost-fight/sprites/walls');

// Single-panel input — center-crop to a square 1024×1024 then resize
// to the canonical wall tile size (256×256).
async function processSingle(srcFile, outName) {
  const src = join(SRC, srcFile);
  const meta = await sharp(src).metadata();
  const side = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width  - side) / 2);
  const top  = Math.floor((meta.height - side) / 2);
  await sharp(src)
    .extract({ left, top, width: side, height: side })
    .resize(256, 256, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, outName));
  console.log(`  walls/${outName}  (single, ${meta.width}×${meta.height} → 256²)`);
}

// 2×3 atlas — extract a single cell, square-crop to its short side
// (cells aren't naturally square — 1024×683 each), then resize 256².
async function processAtlasCell(srcFile, col, row, outName) {
  const src = join(SRC, srcFile);
  const meta = await sharp(src).metadata();
  const cellW = Math.floor(meta.width / 2);
  const cellH = Math.floor(meta.height / 3);
  const left  = col * cellW;
  const top   = row * cellH;
  // Center-square the cell so the texture stays repeat-friendly.
  const side  = Math.min(cellW, cellH);
  const sLeft = left + Math.floor((cellW - side) / 2);
  const sTop  = top  + Math.floor((cellH - side) / 2);
  await sharp(src)
    .extract({ left: sLeft, top: sTop, width: side, height: side })
    .resize(256, 256, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, outName));
  console.log(`  walls/${outName}  (img2 cell ${col},${row}, ${cellW}×${cellH} → 256²)`);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  console.log('▶︎ Harvest wall textures');
  // img1 → single seamless wood-and-vines panel.
  await processSingle('img1.png', 'orchard-wood.png');
  // img2 → 6 cells.
  await processAtlasCell('img2.png', 0, 0, 'orchard-mosspebbles.png');
  await processAtlasCell('img2.png', 1, 0, 'orchard-woodvines.png');
  await processAtlasCell('img2.png', 0, 1, 'orchard-bark.png');
  await processAtlasCell('img2.png', 1, 1, 'orchard-mossdeep.png');
  await processAtlasCell('img2.png', 0, 2, 'orchard-basket.png');
  await processAtlasCell('img2.png', 1, 2, 'orchard-stones.png');
  console.log('done');
})();
