// Era Siege — crop the hand-illustrated reference sheets in
// `assets/age-of-war/` into per-asset PNGs at the manifest paths.
//
// Each sheet is 2816 × 1536 with a near-pure-white background and
// figures laid out in a row. We:
//   1. Extract each sub-region (figure, base panel, etc.)
//   2. Lasso-cut the white background via flood-fill seeded from the
//      sub-region's edge — only background pixels CONNECTED to the edge
//      become transparent, so any white *inside* a silhouette stays
//      opaque.
//   3. Soft-feather the alpha edge so silhouettes don't read as cookie-
//      cutter cut-outs.
//   4. sharp.trim() to a tight bounding box so the runtime's height-
//      driven scale fills the on-canvas footprint.
//
// Run: `node scripts/era-siege-crop-sheets.mjs`
// Output: drops into `public/games/era-siege/{unit,base,turret,vfx}/...`
// matching the asset manifest's registered src paths.

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC  = resolve(ROOT, 'assets/age-of-war');
const OUT  = resolve(ROOT, 'public/games/era-siege');

const SHEET_W = 2816, SHEET_H = 1536;

// ── Flood-fill keyout ────────────────────────────────────────────────
// Seeded from every edge pixel; spreads only through near-white,
// low-chroma pixels (the gradient background). 4-connectivity so a
// single-pixel silhouette outline acts as a hard barrier. No queue
// shift() — uses a head pointer for O(1) dequeue.
function keyoutWhiteBackground(buf, w, h, opts = {}) {
  // Two thresholds — the artwork has thin "construction lines"
  // (pencil-grey, lum ~165, chr ~2) that the artist left in. With a
  // single threshold those lines act as flood-fill BARRIERS, leaving
  // big white islands inside trapped behind them. The fix:
  //   - SPREAD threshold (permissive): the BFS treats anything lighter
  //     than ~140 lum and not too saturated as a "passable" path.
  //   - CLEAR threshold (strict): only pixels in the proper bg range
  //     actually get alpha=0. The grey construction lines are visited
  //     but stay opaque, which is what we want — they're part of the
  //     artwork.
  const spreadLumMin    = opts.spreadLumMin    ?? 140;
  const spreadChromaMax = opts.spreadChromaMax ?? 25;
  const clearLumMin     = opts.clearLumMin     ?? 188;
  const clearChromaMax  = opts.clearChromaMax  ?? 28;
  const stride    = w * 4;
  const px  = (x, y) => y * stride + x * 4;
  const ix  = (x, y) => y * w + x;
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0, tail = 0;

  function canSpread(o) {
    if (buf[o + 3] === 0) return true;             // already cleared
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const lum = (r + g + b) / 3;
    if (lum < spreadLumMin) return false;
    const chr = Math.max(r, g, b) - Math.min(r, g, b);
    return chr <= spreadChromaMax;
  }
  function shouldClear(o) {
    if (buf[o + 3] === 0) return true;
    const r = buf[o], g = buf[o + 1], b = buf[o + 2];
    const lum = (r + g + b) / 3;
    if (lum < clearLumMin) return false;
    const chr = Math.max(r, g, b) - Math.min(r, g, b);
    return chr <= clearChromaMax;
  }
  function seed(x, y) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const i = ix(x, y);
    if (visited[i]) return;
    visited[i] = 1;
    if (canSpread(px(x, y))) queue[tail++] = i;
  }
  // Seed from every edge pixel.
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
  while (head < tail) {
    const q = queue[head++];
    const x = q % w, y = (q / w) | 0;
    // Only clear pixels that pass the strict bg threshold; visited grey
    // construction-line pixels stay opaque so the silhouette outline is
    // intact.
    if (shouldClear(px(x, y))) buf[px(x, y) + 3] = 0;
    seed(x - 1, y); seed(x + 1, y);
    seed(x, y - 1); seed(x, y + 1);
  }
  // Edge softening: any opaque pixel with a transparent 4-neighbour
  // drops to alpha=215 to kill the hard "lasso" rim.
  const out = Buffer.from(buf);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const o = px(x, y);
      if (out[o + 3] !== 255) continue;
      if (buf[o - 4 + 3]      === 0 || buf[o + 4 + 3]      === 0
       || buf[o - stride + 3] === 0 || buf[o + stride + 3] === 0) {
        out[o + 3] = 215;
      }
    }
  }
  return out;
}

// ── Per-region cropper ───────────────────────────────────────────────
// Reads a sub-region from the source sheet, runs flood-fill keyout,
// trims the alpha bbox, and saves.
async function cropRegion(srcPath, region, outPath, opts = {}) {
  const { left, top, width, height } = region;
  const subRaw = await sharp(srcPath)
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const keyed = keyoutWhiteBackground(Buffer.from(subRaw), width, height, opts);
  const intermediate = await sharp(keyed, {
    raw: { width, height, channels: 4 },
  }).png({ compressionLevel: 9 }).toBuffer();
  const trimmed = await sharp(intermediate)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(trimmed).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  console.log(`  ✓ ${outPath.replace(ROOT + '/', '')} (${meta.width}×${meta.height}, ${trimmed.length} B)`);
}

// ── Layout definitions ───────────────────────────────────────────────
// Each unit sheet (1-5): four figures across, label band at the bottom.
// Trim the bottom 14% (≈215 px of 1536) so the labels never bleed in.

// 13% = ~200 px. Labels live in the bottom ~150 px so this is a safe
// cushion without eating into the figures' feet.
const UNIT_LABEL_TRIM = Math.floor(SHEET_H * 0.13);
const UNIT_TOP    = 0;
const UNIT_HEIGHT = SHEET_H - UNIT_LABEL_TRIM;
const UNIT_ROLES  = ['frontline', 'ranged', 'heavy', 'general'];
// Per-sheet cuts measured by scanning columns for the local minima in
// figure-pixel count between the four figures. Even though every sheet
// is 2816 wide, the figures occupy unequal widths (e.g. the void
// generals have wider banners), so a flat /4 split sometimes spills
// one figure into another's panel.
const UNIT_CUTS = {
  1: [0, 687, 1264, 2074, 2816],
  2: [0, 717, 1382, 2104, 2816],
  3: [0, 696, 1306, 2119, 2816],
  4: [0, 724, 1324, 2103, 2816],
  5: [0, 747, 1220, 2068, 2816],
};

// Turret sheet (6): 5 turrets across the row, but UNEVENLY spaced —
// the void lance (era 5) is much narrower than the volt cannon (era 4).
// Cut points were measured by scanning columns for local minima in
// dark-pixel count between the figures.
const TURRET_LABEL_TRIM = Math.floor(SHEET_H * 0.12);
const TURRET_HEIGHT = SHEET_H - TURRET_LABEL_TRIM;
const TURRET_CUTS = [0, 735, 1342, 1883, 2419, 2710];   // 5 turrets between 6 boundaries

// Base / mixed sheets (7, 8, 9) — 4 panels each, but unevenly spaced.
// Cuts measured the same way as the unit sheets.
const BASE_LABEL_TRIM = Math.floor(SHEET_H * 0.10);
const BASE_HEIGHT = SHEET_H - BASE_LABEL_TRIM;
const BASE_CUTS = {
  7: [0,  746, 1420, 2098, 2816],
  8: [0,  751, 1422, 2098, 2816],
  9: [0,  740, 1410, 1992, 2816],
};

// ── Job table ────────────────────────────────────────────────────────
const jobs = [];

// Unit sheets — 5 eras × 4 roles
for (let era = 1; era <= 5; era++) {
  const cuts = UNIT_CUTS[era];
  for (let i = 0; i < 4; i++) {
    const left  = cuts[i];
    const right = cuts[i + 1];
    jobs.push({
      label: `era${era} ${UNIT_ROLES[i]}`,
      src: join(SRC, `${era}.png`),
      region: { left, top: UNIT_TOP, width: right - left, height: UNIT_HEIGHT },
      out: join(OUT, `unit/era${era}/${UNIT_ROLES[i]}.png`),
    });
  }
}

// Turret sheet (6) — 5 turrets across, manually cut at the column
// minima detected above. Each turret slot occupies the band between
// two consecutive cut points.
for (let era = 1; era <= 5; era++) {
  const left  = TURRET_CUTS[era - 1];
  const right = TURRET_CUTS[era];
  jobs.push({
    label: `era${era} turret`,
    src: join(SRC, '6.png'),
    region: { left, top: 0, width: right - left, height: TURRET_HEIGHT },
    out: join(OUT, `turret/era${era}.png`),
  });
}

// Sheets 7, 8, 9 — bases + VFX. Each panel uses the per-sheet cuts
// detected above so we don't slice through a wide structure.
const PANEL_JOBS = [
  // sheet 7: era 1 player, era 1 enemy, era 2 player, era 2 enemy
  { sheet: 7, panels: [
    { out: 'base/era1/player.png' },
    { out: 'base/era1/enemy.png'  },
    { out: 'base/era2/player.png' },
    { out: 'base/era2/enemy.png'  },
  ]},
  // sheet 8: era 3 player, era 3 enemy, era 4 player, era 4 enemy
  { sheet: 8, panels: [
    { out: 'base/era3/player.png' },
    { out: 'base/era3/enemy.png'  },
    { out: 'base/era4/player.png' },
    { out: 'base/era4/enemy.png'  },
  ]},
  // sheet 9: era 5 bases + 2 VFX explosion frames
  { sheet: 9, panels: [
    { out: 'base/era5/player.png' },
    { out: 'base/era5/enemy.png'  },
    { out: 'vfx/explosion-small.png' },
    { out: 'vfx/explosion-large.png' },
  ]},
];
for (const { sheet, panels } of PANEL_JOBS) {
  const cuts = BASE_CUTS[sheet];
  panels.forEach((p, i) => {
    const left  = cuts[i];
    const right = cuts[i + 1];
    jobs.push({
      label: p.out,
      src: join(SRC, `${sheet}.png`),
      region: { left, top: 0, width: right - left, height: BASE_HEIGHT },
      out: join(OUT, p.out),
    });
  });
}

// ── Run ──────────────────────────────────────────────────────────────
const start = Date.now();
let ok = 0, fail = 0;
console.log(`Cropping ${jobs.length} regions from ${jobs.map((j) => j.src).filter((v, i, a) => a.indexOf(v) === i).length} sheets...`);
for (const j of jobs) {
  try {
    await cropRegion(j.src, j.region, j.out);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${j.label} — ${e.message}`);
    fail++;
  }
}
console.log(`\ncrop — ${ok} ok / ${fail} failed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
if (fail) process.exit(1);
