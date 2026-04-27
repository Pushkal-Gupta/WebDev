// Process the master turret sheet `assets/era-seige/turret_spirits.png`.
//
// Sheet layout:                 3 frames × 5 eras
//   row 0 = Era 1 (Bone Crossbow)
//   row 1 = Era 2 (Iron Ballista)
//   row 2 = Era 3 (Brass Mortar)
//   row 3 = Era 4 (Volt Cannon)
//   row 4 = Era 5 (Void Lance)
//   col 0 = idle / col 1 = fire / col 2 = recoil
//
// Outputs:
//   public/games/era-siege/turret/era_all.png        — combined sheet (kept for future animation)
//   public/games/era-siege/turret/era<N>.png         — idle pose alone (matches existing manifest key)
//   public/games/era-siege/turret/era<N>-fire.png    — fire frame
//   public/games/era-siege/turret/era<N>-recoil.png  — recoil frame
//
// Also strips the "eraN.png" residue text in the bottom-left of each row.
//
// Usage:
//   node scripts/era-siege-process-turrets.mjs

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/era-seige/turret_spirits.png');
const DEST = resolve(ROOT, 'public/games/era-siege/turret');

if (!existsSync(SRC)) {
  console.error(`source not found: ${SRC}`);
  process.exit(1);
}

mkdirSync(DEST, { recursive: true });

const meta = await sharp(SRC).metadata();
const W = meta.width;
const H = meta.height;
const COLS = 3;
const ROWS = 5;
const cellW = Math.floor(W / COLS);
const cellH = Math.floor(H / ROWS);

console.log(`turret sheet — ${W}×${H} (cells ${cellW}×${cellH})`);

// Wipe the bottom-left "eraN.png" label residue from each row in the
// combined sheet by compositing a transparent dest-out rectangle.
async function buildCleanedSheet() {
  const labelW = Math.round(cellW * 0.16);  // ~150px when cellW≈938
  const labelH = Math.round(cellH * 0.13);  // ~40px — height of the small text
  const masks = [];
  for (let r = 0; r < ROWS; r++) {
    const left = 0;
    const top  = r * cellH;                  // top-left of each row's first cell
    masks.push({
      input: await sharp({
        create: {
          width: labelW, height: labelH, channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      }).png().toBuffer(),
      left, top,
      blend: 'dest-out',
    });
  }
  return sharp(SRC).composite(masks).toBuffer();
}

const cleaned = await buildCleanedSheet();

// Save the cleaned full sheet for future animation use.
await sharp(cleaned)
  .png({ compressionLevel: 9 })
  .toFile(join(DEST, 'era_all.png'));
console.log(`✓ era_all.png written (combined sheet)`);

// Crop per-cell PNGs.
const FRAMES = ['idle', 'fire', 'recoil'];
for (let r = 0; r < ROWS; r++) {
  const eraN = r + 1;
  for (let c = 0; c < COLS; c++) {
    const left = c * cellW;
    const top  = r * cellH;
    const buf = await sharp(cleaned)
      .extract({ left, top, width: cellW, height: cellH })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const suffix = FRAMES[c] === 'idle' ? '' : `-${FRAMES[c]}`;
    const dest = join(DEST, `era${eraN}${suffix}.png`);
    await sharp(buf).toFile(dest);
    console.log(`✓ turret/era${eraN}${suffix}.png ← (${left},${top}) ${cellW}×${cellH}`);
  }
}

console.log('\ndone — turret sprites available at:');
console.log('  /games/era-siege/turret/era<N>.png       (idle)');
console.log('  /games/era-siege/turret/era<N>-fire.png');
console.log('  /games/era-siege/turret/era<N>-recoil.png');
console.log('  /games/era-siege/turret/era_all.png      (combined sheet)');
