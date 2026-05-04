// Frost Fight — re-emit the legacy single-image bot sprites with
// NATURAL ASPECT RATIO. The previous emit pipeline square-padded
// every sprite to keep them at 512² which made tall characters
// (banana, eggplant, plum) render thin and short at the in-game
// 34 px tile size — most of the canvas was transparent margin.
//
// New output: max-dim resize (longer edge = 192 px), shorter edge
// scales proportionally. Runtime then uses the sprite's actual
// natural{Width,Height} to draw at aspect-preserving (sz, sz × ratio).
//
// Sources: existing 512² PNGs in src/games/frost-fight/sprites/.
// Output: same path, overwriting.

import sharp from 'sharp';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const DIR  = resolve(ROOT, 'src/games/frost-fight/sprites');

const TARGETS = [
  // Legacy single-image bots — these were the worst offenders since
  // they have varied aspect ratios.
  'banana-bot.png',
  'grape-bot.png',
  'plum-bot.png',
  'eggplant-bot.png',
  'melon-bot.png',
  'cherrybomb-bot.png',
  'grape-windup.png',
  'kiwi-windup.png',
  // Player + enemy variants — keep them in sync.
  'player.png',
  'player-2.png',
  'strawberry.png',
  'strawberry-windup.png',
  'blueberry.png',
  'blueberry-windup.png',
  'orange.png',
  'orange-windup.png',
  'cherry.png',
  'cherry-windup.png',
  // Fruit pickups too.
  'fruit.png',
  'peach.png',
  'apple-fruit.png',
  'lemon-fruit.png',
  'kiwi-fruit.png',
  'cherry-fruit.png',
  // Skin variants.
  'icecream-vanilla.png',
  'icecream-sundae.png',
  'icecream-triple.png',
  'icecream-sandwich.png',
];

async function reEmit(file) {
  const path = join(DIR, file);
  // Trim away any transparent margin to find tight character bounds.
  const trimmed = await sharp(path).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const w = trimmed.info.width;
  const h = trimmed.info.height;
  if (w <= 1 || h <= 1) {
    console.log(`  ${file}: trim produced empty buffer, skipping`);
    return;
  }
  const max = Math.max(w, h);
  // Tight 2 % pad to keep anti-aliased edges from clipping.
  const pad = Math.round(max * 0.02);
  // Resize so the longer edge becomes 256 px (preserving aspect).
  const longer = 256;
  const scale = longer / (max + pad * 2);
  const outW = Math.round((w + pad * 2) * scale);
  const outH = Math.round((h + pad * 2) * scale);
  const padded = await sharp(trimmed.data)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize({ width: outW, height: outH, fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(padded).toFile(path);
  console.log(`  ${file}: ${w}×${h} → ${outW}×${outH}`);
}

(async () => {
  console.log('▶︎ Re-emitting bot sprites with natural aspect');
  for (const f of TARGETS) {
    try { await reEmit(f); }
    catch (e) { console.log(`  ${f}: ${e.message}`); }
  }
  console.log('done');
})();
