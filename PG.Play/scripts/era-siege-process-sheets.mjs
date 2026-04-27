// Bulk splitter for the four "reference sheet" inputs the user dropped
// in `assets/era-seige/`. Each sheet has multiple labeled cells; this
// script crops single hero-pose / silhouette assets out of each and
// writes them at the manifest paths the renderer expects.
//
// Inputs:
//   projectile_spirits.png            → projectile/<id>.png (×6)
//   player_enemy_base.png             → base/era<N>/{player,enemy}.png (×10)
//   far-mountains-mid-hills.png       → bg/era<N>/mountains-{far,mid}.png (×10)
//   foreground.png                    → bg/era<N>/foreground.png (×5)
//
// All crops are computed against the source dimensions noted at the
// top of each section so the script tolerates re-uploads at the same
// shape. Coordinates were tuned against the user's actual sheets.

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/era-seige');
const OUT  = resolve(ROOT, 'public/games/era-siege');
mkdirSync(OUT, { recursive: true });

// Wipe the bottom-right Gemini sparkle on a buffer at native dimensions.
async function stripWatermark(buf) {
  const meta = await sharp(buf).metadata();
  const W = meta.width, H = meta.height;
  const ww = Math.round(W * 0.07);
  const wh = Math.round(H * 0.10);
  const mask = await sharp({
    create: {
      width: ww, height: wh, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png().toBuffer();
  return sharp(buf)
    .composite([{ input: mask, left: W - ww, top: H - wh, blend: 'dest-out' }])
    .toBuffer();
}

// Wipe the small label text in a target region (top of each cell).
function makeWipeMask(width, height) {
  return sharp({
    create: {
      width, height, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).png().toBuffer();
}

async function cropAndSave(srcBuf, region, dest, opts = {}) {
  // 1. Extract.
  let buf = await sharp(srcBuf).extract(region).toBuffer();
  // 2. Wipe (composite must run on the un-resized canvas — sharp re-orders
  //    composite after resize otherwise, which fails when the mask is
  //    wider than the post-resize canvas).
  if (opts.wipes && opts.wipes.length) {
    const composites = [];
    for (const w of opts.wipes) {
      composites.push({
        input: await makeWipeMask(w.width, w.height),
        left: w.left,
        top: w.top,
        blend: 'dest-out',
      });
    }
    buf = await sharp(buf).composite(composites).toBuffer();
  }
  // 3. Resize.
  if (opts.maxWidth) {
    buf = await sharp(buf).resize({ width: opts.maxWidth, withoutEnlargement: true }).toBuffer();
  }
  // 4. Encode + save.
  await sharp(buf).png({ compressionLevel: 9 }).toFile(dest);
}

// ── 1. PROJECTILES ─────────────────────────────────────────────────────
//
// Source: `projectile_spirits.png` (2816×1536). Layout reading:
//   5 horizontal rows of projectiles in the LEFT 2400px:
//     row 0 (y≈75..275)    bone-shard
//     row 1 (y≈350..560)   crossbow-bolt
//     row 2 (y≈600..820)   steam-bolt
//     row 3 (y≈870..1080)  arc-bolt
//     row 4 (y≈1130..1450) mortar-shell
//   Right column ~2400..2816 has the void-orb at multiple sizes.
//
// For each projectile we crop the FIRST visible frame — the leftmost
// silhouette below the row label. Region coordinates were eye-balled
// against the user's sheet; if the next regen shifts pixels, edit here.

const PROJECTILE_SRC = join(SRC, 'projectile_spirits.png');
if (existsSync(PROJECTILE_SRC)) {
  const cleaned = await stripWatermark(await sharp(PROJECTILE_SRC).toBuffer());
  mkdirSync(join(OUT, 'projectile'), { recursive: true });

  // Row-and-column tuned against the source layout. Each region picks
  // the FIRST clean frame in its row.
  // Tightened to land on the silhouette inside each frame card; void
  // orb crop pushed down past the "32px" label.
  const PROJ_REGIONS = [
    { id: 'bone-shard',    region: { left: 130,  top: 145,  width: 200, height: 110 } },
    { id: 'crossbow-bolt', region: { left: 130,  top: 410,  width: 220, height: 110 } },
    { id: 'steam-bolt',    region: { left: 130,  top: 670,  width: 220, height: 110 } },
    { id: 'arc-bolt',      region: { left: 130,  top: 925,  width: 220, height: 120 } },
    { id: 'mortar-shell',  region: { left: 110,  top: 1190, width: 180, height: 180 } },
    { id: 'void-orb',      region: { left: 2370, top: 165,  width: 240, height: 240 } },
  ];

  for (const p of PROJ_REGIONS) {
    const dest = join(OUT, 'projectile', `${p.id}.png`);
    await cropAndSave(cleaned, p.region, dest);
    console.log(`✓ projectile/${p.id}.png ← (${p.region.left},${p.region.top}) ${p.region.width}×${p.region.height}`);
  }
} else {
  console.warn('skip projectile_spirits.png — missing');
}

// ── 2. BASES (player + enemy) ───────────────────────────────────────────
//
// Source: `player_enemy_base.png` (2816×1536). Left half = player
// bases (facing right), right half = enemy bases (facing left). The
// user's sheet generated multiple variants per era; we pick the
// cleanest cell per (side, era) tuple.

const BASE_SRC = join(SRC, 'player_enemy_base.png');
if (existsSync(BASE_SRC)) {
  const cleaned = await stripWatermark(await sharp(BASE_SRC).toBuffer());

  // Approximate centers of each era's cleanest base in the source.
  // Each base region is generous (480×500) so trim shrinkwraps the
  // visible silhouette via sharp's later resize step.
  // Each base "showcase card" in the source is ~470px wide. Within the
  // card the silhouette sits roughly between y=top+105 and y=top+460.
  // We crop the silhouette band only, dropping the dark header bar so
  // the base reads as a clean transparent-bg sprite in-game.
  // Each base card has a label band ~150px tall at the top. Crop start
  // is below that, AND we wipe a generous top strip in case the label
  // bleeds into the new region.
  const BASES = [
    { side: 'player', era: 1, region: { left: 50,   top: 165,  width: 420, height: 320 } },
    { side: 'player', era: 2, region: { left: 500,  top: 165,  width: 420, height: 320 } },
    { side: 'player', era: 3, region: { left: 970,  top: 165,  width: 420, height: 320 } },
    { side: 'player', era: 4, region: { left: 500,  top: 640,  width: 420, height: 380 } },
    { side: 'player', era: 5, region: { left: 500,  top: 1170, width: 420, height: 360 } },
    { side: 'enemy',  era: 1, region: { left: 1430, top: 165,  width: 420, height: 320 } },
    { side: 'enemy',  era: 2, region: { left: 1900, top: 165,  width: 420, height: 320 } },
    { side: 'enemy',  era: 3, region: { left: 2360, top: 165,  width: 420, height: 320 } },
    { side: 'enemy',  era: 4, region: { left: 1900, top: 640,  width: 420, height: 380 } },
    { side: 'enemy',  era: 5, region: { left: 1900, top: 1170, width: 420, height: 360 } },
  ];

  for (const b of BASES) {
    mkdirSync(join(OUT, 'base', `era${b.era}`), { recursive: true });
    const dest = join(OUT, 'base', `era${b.era}`, `${b.side}.png`);
    await cropAndSave(cleaned, b.region, dest, {
      // Belt-and-suspenders: wipe any sliver of label that sneaks in.
      wipes: [{ left: 0, top: 0, width: b.region.width, height: 30 }],
      maxWidth: 320,
    });
    console.log(`✓ base/era${b.era}/${b.side}.png`);
  }
} else {
  console.warn('skip player_enemy_base.png — missing');
}

// ── 3. MOUNTAINS (far + mid silhouettes) ────────────────────────────────
//
// Source: `far-mountains-mid-hills.png` (2816×1536). Layout: 2 cols ×
// 5 rows of paired (far, mid) silhouettes. Each cell ≈ 1408×307.
// Headers at the top of each cell get wiped.

const MOUNTAINS_SRC = join(SRC, 'far-mountains-mid-hills.png');
if (existsSync(MOUNTAINS_SRC)) {
  const cleaned = await stripWatermark(await sharp(MOUNTAINS_SRC).toBuffer());

  const cellW = 1408, cellH = 307;

  // Empirical cell map. The user's sheet groups eras by row but pairs
  // far+mid in a non-trivial way — based on the visible labels:
  //   Row 0: Era 1 far  | Era 3 far
  //   Row 1: Era 1 mid  | Era 3 mid
  //   Row 2: Era 2 far  | (era 3 reference repeat — use as fallback)
  //   Row 3: Era 2 mid  | (placeholder)
  //   Row 4: Era 4 far  | Era 4 mid
  //   …
  // To stay robust against rows we can't read, we use a config that
  // matches what we CAN see and falls back to era-3 cells for the rest.
  const MOUNTAIN_CELLS = [
    { era: 1, kind: 'far', col: 0, row: 0 },
    { era: 3, kind: 'far', col: 1, row: 0 },
    { era: 1, kind: 'mid', col: 0, row: 1 },
    { era: 3, kind: 'mid', col: 1, row: 1 },
    { era: 2, kind: 'far', col: 0, row: 2 },
    { era: 2, kind: 'mid', col: 0, row: 3 },
    { era: 4, kind: 'far', col: 0, row: 4 },
    { era: 4, kind: 'mid', col: 1, row: 4 },
    // The sheet may not contain era 5 cells in a clean spot; we sample
    // a likely region and accept fallback.
    { era: 5, kind: 'far', col: 1, row: 2 },
    { era: 5, kind: 'mid', col: 1, row: 3 },
  ];

  for (const c of MOUNTAIN_CELLS) {
    mkdirSync(join(OUT, 'bg', `era${c.era}`), { recursive: true });
    // Skip the label band at the top of each cell. The reference text
    // header runs ~130px tall on this sheet; cropping below leaves
    // ~177px of clean silhouette.
    const region = {
      left: c.col * cellW,
      top:  c.row * cellH + 130,
      width: cellW,
      height: cellH - 130,
    };
    const dest = join(OUT, 'bg', `era${c.era}`, `mountains-${c.kind}.png`);
    await cropAndSave(cleaned, region, dest, {
      maxWidth: 1920,
    });
    console.log(`✓ bg/era${c.era}/mountains-${c.kind}.png ← row ${c.row} col ${c.col}`);
  }
} else {
  console.warn('skip far-mountains-mid-hills.png — missing');
}

// ── 4. FOREGROUNDS ─────────────────────────────────────────────────────
//
// Source: `foreground.png` (2816×1536). 5 horizontal strips stacked,
// one per era. Each strip ≈ 2816×307. Top of each strip has a label
// text that we wipe.

const FG_SRC = join(SRC, 'foreground.png');
if (existsSync(FG_SRC)) {
  const cleaned = await stripWatermark(await sharp(FG_SRC).toBuffer());
  const stripH = 307;
  for (let era = 1; era <= 5; era++) {
    mkdirSync(join(OUT, 'bg', `era${era}`), { recursive: true });
    // Skip the label band at the top of each strip (~110px on this sheet).
    const region = {
      left: 0,
      top: (era - 1) * stripH + 110,
      width: 2816,
      height: stripH - 110,
    };
    const dest = join(OUT, 'bg', `era${era}`, 'foreground.png');
    await cropAndSave(cleaned, region, dest, {
      maxWidth: 1920,
    });
    console.log(`✓ bg/era${era}/foreground.png ← row ${era - 1}`);
  }
} else {
  console.warn('skip foreground.png — missing');
}

console.log('\ndone — restart the dev server (or hard-reload) to pick up the new art.');
