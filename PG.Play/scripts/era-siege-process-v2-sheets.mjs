// Era Siege — process master sprite sheets into game-ready PNGs.
//
// Pipeline per sheet (`assets/era-seige-2/<N>.png`):
//   1. Detect the magenta-cell grid programmatically. Each cell has a
//      `#ff00ff`-ish backdrop; we find contiguous row + column bands of
//      magenta pixels and treat each intersection as one cell. This is
//      robust to:
//        - Variable image sizes (screenshots vs raw exports)
//        - 6-cell vs 7-cell animation rows (Gemini sheets vary)
//        - Title bars + footer chrome around the grid
//   2. For each cell, strip the magenta backdrop (alpha → 0) and bleed
//      the surrounding opaque RGB into the semi-transparent edge so the
//      black halo can't form when the canvas composites the PNG.
//   3. The first detected row is treated as the static-pose row. We use
//      the LEFTMOST cell from row 0 (most consistent across sheets).
//   4. Subsequent rows are animation strips. If a row has 7 cells we
//      drop the duplicate at index 3 (Gemini's older sheets repeat that
//      frame); 6-cell rows pass straight through. Strips are composed
//      side-by-side into walk / attack / idle PNGs.
//   5. Output to `public/games/era-siege/v2/raw/<N>/{static,walk,attack,idle}.png`
//      AND mirror into the runtime-expected paths via mapping.json
//      (`public/games/era-siege/v2/unit/era<N>/<role>.png` and
//       `public/games/era-siege/v2/sprites/unit/era<N>/<role>/{walk,attack,idle}.png`).
//
// Run: `npm run process:era-siege-v2`

import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
// CLI args: --src <dir> --out <dir>. Defaults route to v2 art pack.
// Useful for processing the OLD batch into v1 path:
//   node script.mjs --src assets/era-seige-2/OLD --out public/games/era-siege/v1
const ARGV = process.argv.slice(2);
function arg(name, def) {
  const i = ARGV.indexOf(name);
  return i >= 0 && i < ARGV.length - 1 ? ARGV[i + 1] : def;
}
const SRC  = resolve(ROOT, arg('--src', 'assets/era-seige-2'));
const OUT  = resolve(ROOT, arg('--out', 'public/games/era-siege/v2'));
console.log(`SRC: ${SRC}\nOUT: ${OUT}\n`);

// Magenta-key tolerance. Different Gemini export batches use different
// magenta tones — bright `#ff00ff` (rgb 255/0/255) in older batches,
// darker `#a0029a` (rgb ~160/2/150) in newer ones. We widen the
// keying range to cover both: any pixel with high R, very low G, high
// B counts as backdrop.
const MAGENTA_R_MIN = 110;
const MAGENTA_G_MAX = 70;
const MAGENTA_B_MIN = 100;

// Alpha bleed search radius — copy RGB from the nearest opaque pixel
// within this ring. 2 px is enough for typical PNG edge fringe.
const BLEED_RADIUS = 2;

// DEFAULT_MAPPING — overridden per-slot by `era-siege-v2-mapping.json`.
const DEFAULT_MAPPING = {
  1:  { eraN: 4, role: 'frontline'     },
  2:  { eraN: 4, role: 'frontline-alt' },
  3:  { eraN: 4, role: 'ranged'        },
  4:  { eraN: 4, role: 'ranged-alt'    },
  5:  { eraN: 4, role: 'heavy'         },
  6:  { eraN: 4, role: 'heavy-alt'     },
  7:  { eraN: 3, role: 'general'       },
  8:  { eraN: 3, role: 'ranged'        },
  9:  { eraN: 3, role: 'heavy'         },
  10: { eraN: 3, role: 'general-alt'   },
  11: { eraN: 4, role: 'general'       },
};

async function loadMapping() {
  const path = resolve(__dirname, 'era-siege-v2-mapping.json');
  if (existsSync(path)) {
    try {
      const overlay = JSON.parse(await readFile(path, 'utf8'));
      return { ...DEFAULT_MAPPING, ...overlay };
    }
    catch (e) { console.warn(`mapping.json parse failed: ${e.message}`); }
  }
  return DEFAULT_MAPPING;
}

// ── Magenta detection helpers ───────────────────────────────────────

function isMagenta(r, g, b) {
  return r >= MAGENTA_R_MIN && g <= MAGENTA_G_MAX && b >= MAGENTA_B_MIN;
}

// Find low-magenta runs along the Y axis ("inter-row gaps"). A gap that
// is at least MIN_GAP_HEIGHT tall counts as a true row divider; anything
// shorter is part of the row body (e.g. a label strip between cell and
// label). Cells live between gaps.
function detectRows(raw, w, h) {
  const rowMag = new Uint32Array(h);
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isMagenta(raw[i], raw[i + 1], raw[i + 2])) count++;
    }
    rowMag[y] = count;
  }
  // A row is "magenta-active" if more than 1% of its pixels are magenta.
  // We then look for non-active runs to split rows. The min-gap threshold
  // is set low because newer Gemini batches use very thin 9-12 px gaps
  // between cell rows.
  const ACTIVE = Math.max(8, Math.floor(w * 0.005));
  const MIN_GAP_HEIGHT = 6;
  // Find wide non-active runs (gaps).
  const gaps = [];
  let inLow = false, y0 = 0;
  for (let y = 0; y < h; y++) {
    const isLow = rowMag[y] < ACTIVE;
    if (isLow && !inLow) { y0 = y; inLow = true; }
    if (!isLow && inLow) {
      if (y - y0 >= MIN_GAP_HEIGHT) gaps.push({ y0, y1: y - 1 });
      inLow = false;
    }
  }
  if (inLow && h - y0 >= MIN_GAP_HEIGHT) gaps.push({ y0, y1: h - 1 });
  // Bands = the spans of NON-gap rows. Filter out empty/below-threshold
  // bands (no magenta means it's whitespace, not a cell row).
  const bands = [];
  let cur = 0;
  for (const g of gaps) {
    if (g.y0 > cur) bands.push({ y0: cur, y1: g.y0 - 1 });
    cur = g.y1 + 1;
  }
  if (cur < h) bands.push({ y0: cur, y1: h - 1 });
  // Drop bands with no real magenta inside or that are too short
  // (less than 4% of image height — likely title bars).
  return bands.filter((b) => {
    let total = 0;
    for (let y = b.y0; y <= b.y1; y++) total += rowMag[y];
    return total > w * 0.5 && (b.y1 - b.y0 + 1) > Math.floor(h * 0.04);
  });
}

// Within a row band, find cells. Diagnostic on the user's sheets shows
// inter-cell gaps are 4-6 px wide and the sprite's edge can produce
// 1-2 px magenta blips inside a gap. So:
//   1. Mark each column as "low" (col-magenta < ACTIVE).
//   2. Smooth via a 3-px majority window to bridge 1-2 px magenta blips.
//   3. Wide-low runs (>= MIN_GAP_WIDTH) are real inter-cell gaps.
function detectCells(raw, w, h, band) {
  const colMag = new Uint32Array(w);
  for (let y = band.y0; y <= band.y1; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isMagenta(raw[i], raw[i + 1], raw[i + 2])) colMag[x]++;
    }
  }
  const bandH = band.y1 - band.y0 + 1;
  // A column is "low" if it has < ACTIVE magenta pixels. We pick a
  // small absolute floor (2 px) so even sprite-heavy columns that have
  // just a few magenta border pixels are NOT marked low.
  const ACTIVE = Math.max(2, Math.floor(bandH * 0.015));
  const isLow = new Uint8Array(w);
  for (let x = 0; x < w; x++) isLow[x] = colMag[x] < ACTIVE ? 1 : 0;
  // Morphological smoothing: a 3-pixel radius majority vote bridges
  // 1-2 px non-low blips inside a gap. After smoothing, true cell-
  // boundary gaps become contiguous low runs.
  const SMOOTH_R = 3;
  const smoothed = new Uint8Array(w);
  for (let x = 0; x < w; x++) {
    let lowCount = 0;
    for (let dx = -SMOOTH_R; dx <= SMOOTH_R; dx++) {
      const nx = x + dx;
      if (nx >= 0 && nx < w && isLow[nx]) lowCount++;
    }
    smoothed[x] = lowCount > SMOOTH_R ? 1 : 0;   // majority of 7 = 4+
  }
  // Find low runs in smoothed.
  const lowRuns = [];
  let inL = false, x0 = 0;
  for (let x = 0; x < w; x++) {
    if (smoothed[x] && !inL) { x0 = x; inL = true; }
    if (!smoothed[x] && inL) { lowRuns.push({ x0, x1: x - 1 }); inL = false; }
  }
  if (inL) lowRuns.push({ x0, x1: w - 1 });
  // Real cell-boundary gaps are wide. Diagnostic shows ~4-7 px is the
  // typical inter-cell gap span in these sheets.
  const MIN_GAP_WIDTH = 4;
  const gaps = lowRuns.filter((r) => (r.x1 - r.x0 + 1) >= MIN_GAP_WIDTH);
  // Cells = spans between gaps.
  const cells = [];
  let cur = 0;
  for (const g of gaps) {
    if (g.x0 > cur) cells.push({ x0: cur, x1: g.x0 - 1 });
    cur = g.x1 + 1;
  }
  if (cur < w) cells.push({ x0: cur, x1: w - 1 });
  // Drop cells without enough magenta inside (decorative artefacts)
  // and cells narrower than 3% of image width.
  return cells.filter((c) => {
    let total = 0;
    for (let x = c.x0; x <= c.x1; x++) total += colMag[x];
    return total > bandH * 0.5 && (c.x1 - c.x0 + 1) > Math.floor(w * 0.03);
  });
}

// ── Cell pixel processing ──────────────────────────────────────────

function stripMagentaInCell(raw, w, h, cell, band) {
  for (let y = band.y0; y <= band.y1; y++) {
    for (let x = cell.x0; x <= cell.x1; x++) {
      const i = (y * w + x) * 4;
      if (isMagenta(raw[i], raw[i + 1], raw[i + 2])) {
        raw[i] = 0; raw[i + 1] = 0; raw[i + 2] = 0; raw[i + 3] = 0;
      }
    }
  }
}

function alphaBleedInCell(raw, w, _h, cell, band) {
  const OPAQUE = 240;
  const NEEDS = 250;
  // Snapshot the cell as a separate Buffer so we can read source
  // without picking up our own writes.
  const cw = cell.x1 - cell.x0 + 1;
  const ch = band.y1 - band.y0 + 1;
  const src = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((band.y0 + y) * w + (cell.x0 + x)) * 4;
      const di = (y * cw + x) * 4;
      src[di]     = raw[si];
      src[di + 1] = raw[si + 1];
      src[di + 2] = raw[si + 2];
      src[di + 3] = raw[si + 3];
    }
  }
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const di = (y * cw + x) * 4;
      if (src[di + 3] >= NEEDS) continue;
      let found = false;
      for (let r = 1; r <= BLEED_RADIUS && !found; r++) {
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
            const ni = (ny * cw + nx) * 4;
            if (src[ni + 3] >= OPAQUE) {
              const i = ((band.y0 + y) * w + (cell.x0 + x)) * 4;
              raw[i]     = src[ni];
              raw[i + 1] = src[ni + 1];
              raw[i + 2] = src[ni + 2];
              found = true;
            }
          }
        }
      }
    }
  }
}

function extractCellBuffer(raw, w, _h, cell, band) {
  const cw = cell.x1 - cell.x0 + 1;
  const ch = band.y1 - band.y0 + 1;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const srcStart = ((band.y0 + y) * w + cell.x0) * 4;
    const dstStart = y * cw * 4;
    raw.copy(out, dstStart, srcStart, srcStart + cw * 4);
  }
  return { buf: out, w: cw, h: ch };
}

function composeStrip(cells) {
  // Concatenate N cells horizontally. They may have different widths,
  // so the output width is the sum and we left-align each cell at the
  // top — extra height padding stays transparent.
  const h = Math.max(...cells.map((c) => c.h));
  const totalW = cells.reduce((s, c) => s + c.w, 0);
  const out = Buffer.alloc(totalW * h * 4);
  let xOff = 0;
  for (const cell of cells) {
    for (let y = 0; y < cell.h; y++) {
      const srcStart = y * cell.w * 4;
      const dstStart = (y * totalW + xOff) * 4;
      cell.buf.copy(out, dstStart, srcStart, srcStart + cell.w * 4);
    }
    xOff += cell.w;
  }
  return { buf: out, w: totalW, h };
}

async function writePng({ buf, w, h }, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
}

// ── Sheet driver ────────────────────────────────────────────────────

async function processSheet(num, mapping) {
  const inPath = resolve(SRC, `${num}.png`);
  if (!existsSync(inPath)) return null;
  console.log(`process: ${num}.png`);
  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = Buffer.from(data);
  const w = info.width, h = info.height;

  // 1. Detect the cell grid.
  const rows = detectRows(raw, w, h);
  if (rows.length < 2) {
    console.warn(`  ⚠  detected only ${rows.length} row band(s) — skip`);
    return null;
  }
  const rowsWithCells = rows.map((band) => ({ band, cells: detectCells(raw, w, h, band) }));
  // Filter rows with no usable cells.
  const validRows = rowsWithCells.filter((r) => r.cells.length >= 1);
  if (validRows.length < 2) {
    console.warn(`  ⚠  rows with cells: ${validRows.length} — skip`);
    return null;
  }
  console.log(`  rows: ${validRows.length}, cells per row: ${validRows.map((r) => r.cells.length).join(', ')}`);

  // 2. Process each detected cell: strip + bleed.
  for (const { band, cells } of validRows) {
    for (const cell of cells) {
      stripMagentaInCell(raw, w, h, cell, band);
      alphaBleedInCell(raw, w, h, cell, band);
    }
  }

  // 3. Static = first cell of first row band.
  const staticRow = validRows[0];
  const staticCell = extractCellBuffer(raw, w, h, staticRow.cells[0], staticRow.band);

  // 4. Animation rows = remaining bands. Skip past the first if it has
  //    only 1-2 cells (a static row); use the first multi-cell row
  //    as the start of animation strips. We expect 3 animation rows.
  const animBands = validRows.filter((r) => r.cells.length >= 5);
  if (animBands.length < 3) {
    console.warn(`  ⚠  only ${animBands.length} animation rows (need 3) — partial output`);
  }
  // pickFrames — distill N detected cells into exactly 6 animation
  // frames. Strategy:
  //   - exact 6: pass through
  //   - 7: drop the duplicate-labelled cell at index 3 (Gemini sheets
  //     repeat 'walk 3' there)
  //   - 8: drop index 3 AND the trailing duplicate at the end
  //   - >8: assume the detector over-split — merge adjacent narrow
  //     cells until we have ≤8, then apply the above
  function pickFrames(cells) {
    let cs = cells.slice();
    // Sort by x to maintain animation order.
    cs.sort((a, b) => a.x0 - b.x0);
    // Merge cells that are dramatically smaller than the median —
    // these are usually sprite-internal splits, not real frames.
    if (cs.length > 6) {
      const widths = cs.map((c) => c.x1 - c.x0 + 1);
      const sorted = [...widths].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] || 1;
      const MIN_W = median * 0.55;
      const merged = [];
      for (const c of cs) {
        const ww = c.x1 - c.x0 + 1;
        if (ww < MIN_W && merged.length) {
          merged[merged.length - 1].x1 = c.x1;     // absorb into prev
        } else {
          merged.push({ ...c });
        }
      }
      cs = merged;
    }
    if (cs.length === 6) return cs;
    if (cs.length === 7) return [cs[0], cs[1], cs[2], cs[4], cs[5], cs[6]];
    if (cs.length === 8) return [cs[0], cs[1], cs[2], cs[4], cs[5], cs[6]];
    return cs.slice(0, 6); // best-effort fallback
  }
  const animRows = animBands.slice(0, 3);
  const stripBuffers = animRows.map(({ band, cells }) => {
    const picks = pickFrames(cells);
    const cellBufs = picks.map((c) => extractCellBuffer(raw, w, h, c, band));
    return composeStrip(cellBufs);
  });
  const [walk, attack, idle] = stripBuffers;

  // 5. Write raw numbered output (always) + mapped era/role.
  const rawDir = resolve(OUT, 'raw', String(num));
  await writePng(staticCell, resolve(rawDir, 'static.png'));
  if (walk)   await writePng(walk,   resolve(rawDir, 'walk.png'));
  if (attack) await writePng(attack, resolve(rawDir, 'attack.png'));
  if (idle)   await writePng(idle,   resolve(rawDir, 'idle.png'));

  const map = mapping[num] || mapping[String(num)];
  if (map) {
    const { eraN, role } = map;
    const unitStatic = resolve(OUT, `unit/era${eraN}/${role}.png`);
    const spritesDir = resolve(OUT, `sprites/unit/era${eraN}/${role}`);
    await writePng(staticCell, unitStatic);
    if (walk)   await writePng(walk,   resolve(spritesDir, 'walk.png'));
    if (attack) await writePng(attack, resolve(spritesDir, 'attack.png'));
    if (idle)   await writePng(idle,   resolve(spritesDir, 'idle.png'));
    console.log(`  → era${eraN}/${role}`);
  }
  return map;
}

// ── Turret driver — horizontal 3-frame strip (idle / fire / recoil) ──

async function processTurretSheet(slot, num, eraN) {
  const inPath = resolve(SRC, 'turret', `raw-${num}.png`);
  if (!existsSync(inPath)) return null;
  console.log(`process: turret/raw-${num}.png → era${eraN}`);
  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = Buffer.from(data);
  const w = info.width, h = info.height;
  const rows = detectRows(raw, w, h);
  if (!rows.length) { console.warn('  ⚠ no magenta band'); return null; }
  // Turret strips have ONE row band; use the largest (tallest) one.
  const band = rows.reduce((a, b) => (b.y1 - b.y0 > a.y1 - a.y0 ? b : a));
  const cells = detectCells(raw, w, h, band);
  if (cells.length < 3) { console.warn(`  ⚠ ${cells.length} cells, expected 3`); return null; }
  // Strip + bleed.
  for (const cell of cells) {
    stripMagentaInCell(raw, w, h, cell, band);
    alphaBleedInCell(raw, w, h, cell, band);
  }
  const [idle, fire, recoil] = cells.slice(0, 3).map((c) => extractCellBuffer(raw, w, h, c, band));
  const out = resolve(OUT, 'turret');
  await writePng(idle,   resolve(out, `era${eraN}.png`));
  await writePng(fire,   resolve(out, `era${eraN}-fire.png`));
  await writePng(recoil, resolve(out, `era${eraN}-recoil.png`));
  console.log(`  → era${eraN} idle/fire/recoil`);
  return { eraN };
}

// Turret-strip mapping: raw-<N>.png in assets/era-seige-2/turret/ →
// game era. The two screenshots we have are eras 1 (wood crossbow) and
// 2 (iron cannon). User can edit this mapping.json overlay if order
// differs from what they shipped.
const DEFAULT_TURRET_MAPPING = {
  1: 1,
  2: 2,
};

async function loadTurretMapping() {
  const path = resolve(__dirname, 'era-siege-v2-turret-mapping.json');
  if (existsSync(path)) {
    try { return { ...DEFAULT_TURRET_MAPPING, ...JSON.parse(await readFile(path, 'utf8')) }; }
    catch (e) { console.warn(`turret-mapping.json parse failed: ${e.message}`); }
  }
  return DEFAULT_TURRET_MAPPING;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const unitMapping   = await loadMapping();
  const turretMapping = await loadTurretMapping();
  const writtenUnits  = [];
  const writtenTurrets = [];
  for (let i = 1; i <= 40; i++) {
    const r = await processSheet(i, unitMapping);
    if (r) writtenUnits.push({ num: i, ...r });
  }
  for (const [rawNum, eraN] of Object.entries(turretMapping)) {
    const r = await processTurretSheet(rawNum, rawNum, eraN);
    if (r) writtenTurrets.push({ raw: rawNum, eraN });
  }
  const manifestPath = resolve(OUT, 'manifest.json');
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    unitCount:   writtenUnits.length,
    units:       writtenUnits,
    turretCount: writtenTurrets.length,
    turrets:     writtenTurrets,
  }, null, 2));
  console.log(`\nWrote manifest → ${manifestPath}`);
  console.log(`Done. ${writtenUnits.length} unit sheet(s) + ${writtenTurrets.length} turret sheet(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
