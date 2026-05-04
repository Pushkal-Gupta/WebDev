// Frost Fight — extract Trinkets wall + floor textures.
//
// User-supplied source images:
//   img3.png — 2×2 atlas of seamless wall textures:
//     [0,0] stone hearth (warm gray)
//     [1,0] damask wallpaper (burgundy + gold)
//     [0,1] Persian / Arabian tile (deep blue + gold)
//     [1,1] gold vault door (warm gold + red velvet curtains)
//
//   img4.png — 4×2 atlas of seamless floor textures:
//     [0,0] parquet wood (square)
//     [1,0] parquet wood (herringbone)
//     [2,0] mosaic medallion (orange/teal)
//     [3,0] mosaic medallion (blue/teal)
//     [0,1] white marble
//     [1,1] green marble
//     [2,1] persian rug (red + gold, small)
//     [3,1] persian rug (red + gold, large)
//
// All cells are seamless and will tile via CanvasPattern('repeat').
// Output: 256×256 PNGs into sprites/walls/ + sprites/floors/.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight');
const OUT_WALLS  = resolve(ROOT, 'src/games/frost-fight/sprites/walls');
const OUT_FLOORS = resolve(ROOT, 'src/games/frost-fight/sprites/floors');

// Center-crop a cell to its short side then resize to 256². Keeps the
// pattern tile-friendly for `CanvasPattern('repeat')`.
async function processCell(srcFile, gridCols, gridRows, col, row, outDir, outName) {
  const src = join(SRC, srcFile);
  const meta = await sharp(src).metadata();
  const cellW = Math.floor(meta.width  / gridCols);
  const cellH = Math.floor(meta.height / gridRows);
  const left = col * cellW;
  const top  = row * cellH;
  const side = Math.min(cellW, cellH);
  const sLeft = left + Math.floor((cellW - side) / 2);
  const sTop  = top  + Math.floor((cellH - side) / 2);
  await sharp(src)
    .extract({ left: sLeft, top: sTop, width: side, height: side })
    .resize(256, 256, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, outName));
  console.log(`  ${outDir.includes('walls') ? 'walls' : 'floors'}/${outName}  (${cellW}×${cellH} → 256²)`);
}

(async () => {
  mkdirSync(OUT_WALLS,  { recursive: true });
  mkdirSync(OUT_FLOORS, { recursive: true });
  console.log('▶︎ Trinkets walls (img3)');
  await processCell('img3.png', 2, 2, 0, 0, OUT_WALLS, 'trinket-hearth.png');
  await processCell('img3.png', 2, 2, 1, 0, OUT_WALLS, 'trinket-damask.png');
  await processCell('img3.png', 2, 2, 0, 1, OUT_WALLS, 'trinket-tile.png');
  await processCell('img3.png', 2, 2, 1, 1, OUT_WALLS, 'trinket-vault.png');
  console.log('▶︎ Trinkets floors (img4)');
  await processCell('img4.png', 4, 2, 0, 0, OUT_FLOORS, 'trinket-parquet-square.png');
  await processCell('img4.png', 4, 2, 1, 0, OUT_FLOORS, 'trinket-parquet-herring.png');
  await processCell('img4.png', 4, 2, 2, 0, OUT_FLOORS, 'trinket-mosaic-orange.png');
  await processCell('img4.png', 4, 2, 3, 0, OUT_FLOORS, 'trinket-mosaic-blue.png');
  await processCell('img4.png', 4, 2, 0, 1, OUT_FLOORS, 'trinket-marble-white.png');
  await processCell('img4.png', 4, 2, 1, 1, OUT_FLOORS, 'trinket-marble-green.png');
  await processCell('img4.png', 4, 2, 2, 1, OUT_FLOORS, 'trinket-persian-small.png');
  await processCell('img4.png', 4, 2, 3, 1, OUT_FLOORS, 'trinket-persian-large.png');
  console.log('done');
})();
