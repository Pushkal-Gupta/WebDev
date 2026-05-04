// Frost Fight — grid-based atlas extractor for char8-char11.
//
// The advanced char-atlas script uses connected components, which
// works perfectly for fruit characters but FAILS for special objects
// (candle / teapot / lamp / chest) because their flame, steam, and
// sparkle effects bridge across frames — six cells fuse into one big
// component.
//
// This script bypasses CC entirely. It crops each cell at a fixed grid
// position, then runs the standard cleanup (checker remove → lasso →
// trim → 3 % pad → 192² emit) on each crop. Manifests get re-written
// for these four chars only; the seven fruit atlases keep their CC-
// derived manifests.
//
// Sheet layout (2814×1536, all four specials):
//   Row 1 walk:    y 100-380, 6 cols × 469 px wide
//   Row 2 charge:  y 410-740
//   Row 3 release: y 760-1130
//   Row 4 death:   bottom-right corner box, 4 small frames
//
// Run: node scripts/frost-fight-special-atlas.mjs

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/frost-fight/char/advanced');
const OUT_BASE = resolve(ROOT, 'src/games/frost-fight/sprites/anim');

const CHARS = {
  char8:  'candle',
  char9:  'teapot',
  char10: 'lamp',
  char11: 'chest',
};

// Grid cells in source pixel coords. Each cell is inset 60 px on each
// side (30 left, 30 right) to drop the arrow icons that sit between
// cells, and the y-bands are tightened to avoid the title-text strips
// that survive checker removal.
const SHEET_W = 2814;
const COL_W   = 469;
const X_INSET = 30;
// Tightened y-bands: each cell starts well below its title strip and
// ends well above its caption strip. The per-cell largest-component
// mask handles whatever text or arrow noise still sneaks in.
const ROW1_Y = 145;  const ROW1_H = 230;   // walk
const ROW2_Y = 500;  const ROW2_H = 240;   // charge
const ROW3_Y = 855;  const ROW3_H = 260;   // release
// Death cycle panel at bottom-right.
const DEATH_X = 1900;
const DEATH_Y = 1290;
const DEATH_CELL_W = 220;
const DEATH_CELL_H = 220;

// Horizontal dead-zone strips zeroed AFTER checker removal. Wide
// bands so title + caption strips are fully covered even if text
// renders a few px off where I expected.
const DEAD_ZONES = [
  { y0:    0, y1:  145 },
  { y0:  370, y1:  500 },
  { y0:  735, y1:  855 },
  { y0: 1100, y1: 1290 },
];

function rowCells(rowY, rowH) {
  const cells = [];
  for (let i = 0; i < 6; i++) {
    cells.push({
      left: i * COL_W + X_INSET,
      top: rowY,
      width: COL_W - X_INSET * 2,
      height: rowH,
    });
  }
  return cells;
}

const ROWS = [
  { name: 'walk',          cells: rowCells(ROW1_Y, ROW1_H) },
  { name: 'attackCharge',  cells: rowCells(ROW2_Y, ROW2_H) },
  { name: 'attackRelease', cells: rowCells(ROW3_Y, ROW3_H) },
  // Death — 4 small cells in the bottom-right death-cycle panel.
  // Empirical from inspecting char8/char11 — the panel is roughly
  // 880 px wide × 280 px tall, broken into 4 cells.
  { name: 'death', cells: [0, 1, 2, 3].map((i) => ({
    left: DEATH_X + i * DEATH_CELL_W, top: DEATH_Y,
    width: DEATH_CELL_W, height: DEATH_CELL_H,
  })) },
];

async function removeCheckerBg(buf) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  const total = w * h;
  const candidate = new Uint8Array(total);
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    if ((max - min) <= 18 && max >= 125) candidate[p] = 1;
  }
  const visited = new Uint8Array(total);
  const stack = [];
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) {
    const p = y * w + x; if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
  }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) {
    const p = y * w + x; if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
  }
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    if (x > 0)     { const n = p - 1; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (x < w - 1) { const n = p + 1; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (y > 0)     { const n = p - w; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (y < h - 1) { const n = p + w; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
  }
  for (let p = 0; p < total; p++) if (visited[p]) data[p * ch + 3] = 0;
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    const cast = max - min;
    const isGrayBand    = cast <= 16 && max >= 125 && max <= 232;
    const isTintedWhite = cast >= 2 && cast <= 14 && max >= 233;
    if (isGrayBand || isTintedWhite) data[i + 3] = 0;
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

async function lassoAlpha(buf, lowCut = 130, highCut = 240) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = raw.info;
  const data = raw.data;
  for (let i = 3; i < data.length; i += channels) {
    const a = data[i];
    if (a < lowCut) data[i] = 0;
    else if (a > highCut) data[i] = 255;
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

// Find the LARGEST connected non-transparent component in a buffer
// and mask everything else to fully transparent. Kills title-text +
// arrow leakage that survives the dead-zone pass; the character is
// always the biggest blob in its cell.
async function maskLargestComponent(buf) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  const total = w * h;
  const labels = new Int32Array(total);
  let nextLabel = 1;
  const sizes = [0];  // sizes[id]
  const stack = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (labels[p] !== 0) continue;
      if (data[p * ch + 3] < 30) continue;
      const id = nextLabel++;
      let size = 0;
      stack.length = 0;
      stack.push(p);
      labels[p] = id;
      while (stack.length > 0) {
        const q = stack.pop();
        size++;
        const qx = q % w, qy = (q / w) | 0;
        if (qx > 0)     { const n = q - 1; if (labels[n] === 0 && data[n * ch + 3] >= 30) { labels[n] = id; stack.push(n); } }
        if (qx < w - 1) { const n = q + 1; if (labels[n] === 0 && data[n * ch + 3] >= 30) { labels[n] = id; stack.push(n); } }
        if (qy > 0)     { const n = q - w; if (labels[n] === 0 && data[n * ch + 3] >= 30) { labels[n] = id; stack.push(n); } }
        if (qy < h - 1) { const n = q + w; if (labels[n] === 0 && data[n * ch + 3] >= 30) { labels[n] = id; stack.push(n); } }
      }
      sizes[id] = size;
    }
  }
  if (sizes.length <= 1) return buf;  // nothing to mask
  // Find largest component id.
  let bestId = 1, bestSize = sizes[1] || 0;
  for (let i = 2; i < sizes.length; i++) {
    if (sizes[i] > bestSize) { bestSize = sizes[i]; bestId = i; }
  }
  // Zero alpha on every pixel that isn't part of the largest blob.
  for (let p = 0; p < total; p++) {
    if (labels[p] !== bestId) data[p * ch + 3] = 0;
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

// Zero a top + bottom strip of the cropped cell. Kills any caption /
// title pixels that survive the global dead-zone pass — text rows can
// descend a few px further than expected. 35 / 30 px windows are small
// enough to spare reasonable character bodies.
async function zeroEdgeStrips(buf, topStrip = 35, bottomStrip = 30) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  const topLim = Math.min(topStrip, h);
  for (let y = 0; y < topLim; y++) {
    for (let x = 0; x < w; x++) data[(y * w + x) * ch + 3] = 0;
  }
  const botStart = Math.max(0, h - bottomStrip);
  for (let y = botStart; y < h; y++) {
    for (let x = 0; x < w; x++) data[(y * w + x) * ch + 3] = 0;
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

async function emitFrame(srcBuf, outFile, target = 192) {
  // Wipe edge strips THEN keep only the largest blob — defense in
  // depth against title / caption text leaking from adjacent rows.
  const noEdges  = await zeroEdgeStrips(srcBuf);
  const onlyChar = await maskLargestComponent(noEdges);
  const cleaned1 = await lassoAlpha(onlyChar);
  const t = await sharp(cleaned1).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  if (m.width <= 1 || m.height <= 1) return false;
  const max = Math.max(m.width, m.height);
  // Phase 22n — natural-aspect output (longest edge = target px).
  const pad = Math.round(max * 0.02);
  const padded = await sharp(t.data)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const scale = target / (max + pad * 2);
  const outW = Math.round((m.width  + pad * 2) * scale);
  const outH = Math.round((m.height + pad * 2) * scale);
  const resized = await sharp(padded)
    .resize({ width: outW, height: outH, fit: 'fill' })
    .png()
    .toBuffer();
  const cleaned2 = await lassoAlpha(resized, 140, 240);
  await sharp(cleaned2).png({ compressionLevel: 9 }).toFile(outFile);
  return true;
}

async function maskDeadZones(cleanedPngBuf) {
  const raw = await sharp(cleanedPngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  for (const z of DEAD_ZONES) {
    const y0 = Math.max(0, z.y0);
    const y1 = Math.min(h, z.y1);
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) data[(y * w + x) * ch + 3] = 0;
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

async function processChar(sheetFile, charKey) {
  const sheetPath = join(SRC, sheetFile);
  console.log(`▶︎ ${sheetFile} → ${charKey} (grid)`);
  const cleanedFull = await maskDeadZones(
    await removeCheckerBg(await sharp(sheetPath).png().toBuffer())
  );

  const charDir = join(OUT_BASE, charKey);
  // Wipe stale frames from prior CC runs (frame counts will change).
  if (fs.existsSync(charDir)) {
    for (const f of fs.readdirSync(charDir)) {
      if (f.endsWith('.png')) fs.unlinkSync(join(charDir, f));
    }
  }
  mkdirSync(charDir, { recursive: true });

  const manifest = { walk: [], attackCharge: [], attackRelease: [], death: [], state: {} };
  for (const row of ROWS) {
    for (let i = 0; i < row.cells.length; i++) {
      const cell = row.cells[i];
      // Clip to source bounds.
      const right  = Math.min(SHEET_W, cell.left + cell.width);
      const bottom = Math.min(1536,    cell.top  + cell.height);
      const left   = Math.max(0, cell.left);
      const top    = Math.max(0, cell.top);
      const width  = right - left;
      const height = bottom - top;
      if (width <= 0 || height <= 0) continue;
      const cropped = await sharp(cleanedFull)
        .extract({ left, top, width, height })
        .png().toBuffer();
      const out = join(charDir, `${row.name}-${i}.png`);
      const ok = await emitFrame(cropped, out);
      if (ok) manifest[row.name].push(`${row.name}-${i}.png`);
    }
  }
  // Synthesise legacy state-pose aliases.
  if (manifest.walk[0]) {
    manifest.state.neutral   = manifest.walk[0];
    manifest.state.fuming    = manifest.walk[0];
    manifest.state.irritated = manifest.walk[0];
    manifest.state.sad       = manifest.death[0] || manifest.walk[0];
  }
  await fs.promises.writeFile(join(OUT_BASE, `${charKey}.json`), JSON.stringify(manifest, null, 2));
  console.log(`  ${charKey}: walk=${manifest.walk.length}  charge=${manifest.attackCharge.length}  release=${manifest.attackRelease.length}  death=${manifest.death.length}`);
}

(async () => {
  for (const [sheet, key] of Object.entries(CHARS)) {
    await processChar(`${sheet}.png`, key);
  }
  console.log('done');
})();
