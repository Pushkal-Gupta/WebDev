// Frost Fight — char1..char7 animation-sheet extractor.
//
// Each char sheet (2816×1536) follows a consistent layout:
//   LEFT HALF  (x < 1440)  —  3×3 grid of STATE TRANSITION poses
//   RIGHT HALF (x ≥ 1440)  —  4 rows of ANIMATION CYCLES:
//     row 0: WALK CYCLE      (3-4 frames)
//     row 1: ATTACK CHARGE   (3-4 frames)
//     row 2: ATTACK RELEASE  (3-4 frames)
//     row 3: DEATH CYCLE     (4 frames)
//
// We reuse the existing connected-component pipeline to isolate each
// character sprite (filtering out small label-text strokes and steam
// puffs by area), then bucket components by Y-band into row groups
// and sort by X within each row to assign frame indices. Each frame
// is emitted as a 512×512 PNG into src/games/frost-fight/sprites/anim/
// {charKey}/{action}-{idx}.png plus a JSON manifest mapping action →
// frame URL list so the runtime can walk frames without rediscovery.
//
// Run:  node scripts/frost-fight-char-atlas.mjs
//       node scripts/frost-fight-char-atlas.mjs char1 char3   (subset)

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight/char');
const OUT_BASE = resolve(ROOT, 'src/games/frost-fight/sprites/anim');

// Character roster. char8 has a different layout (mixed elementals +
// sand-clock) and is handled separately when wired.
const CHARS = {
  char1: { key: 'orange',     label: 'Orange'     },
  char2: { key: 'kiwi',       label: 'Kiwi'       },
  char3: { key: 'strawberry', label: 'Strawberry' },
  char4: { key: 'grape',      label: 'Grape'      },
  char5: { key: 'pineapple',  label: 'Pineapple'  },
  char6: { key: 'lemon',      label: 'Lemon'      },
  char7: { key: 'peach',      label: 'Peach'      },
};

// Y-band → row index. Bands have ~70 px slop so a frame whose bbox
// starts a touch above its row center still bins correctly.
const ROW_BANDS = [
  { y0:   60, y1:  450, idx: 0 },  // row 0: state row 1 + walk cycle
  { y0:  450, y1:  830, idx: 1 },  // row 1: state row 2 + attack charge
  { y0:  830, y1: 1180, idx: 2 },  // row 2: state row 3 + attack release
  { y0: 1180, y1: 1500, idx: 3 },  // row 3: (left empty for chars w/ 3 state rows) + death cycle
];

// X split. Anything left of this is a STATE TRANSITION cell, anything
// right is an ANIMATION CYCLE frame.
const X_SPLIT = 1440;

// State pose names per (row, col). Mirrors char1's labels; char2-char7
// follow the same template (a few have "Aftermath" replacing "Furious
// Blowing" or vice versa — the runtime picks by index, so the
// semantics stay consistent across chars).
const STATE_NAMES = [
  // row 0
  ['neutral',  'fuming',           'blowing'],
  // row 1
  ['neutral2', 'irritated',        'blowing2'],
  // row 2
  ['neutral3', 'sad',              'sad2'],
];

// Animation row name per row index.
const ANIM_ROWS = ['walk', 'attackCharge', 'attackRelease', 'death'];

// Reuse the checker-removal flood-fill from the main processor. The
// char sheets (1-7) come in two batches: char1-char4 have the bright
// AI-generator checker (max ~150-255), char5-char7 ship with a darker
// olive-tinted checker (max ~130-150). The flood-fill is seeded from
// the border so widening the candidate band is safe — it only clears
// pixels reachable from the border, never enclosed character pixels.
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
    // Widened from (≤14, ≥150) → (≤18, ≥125) to catch char5-char7's
    // darker olive-cast bg. Highly-saturated character interiors have
    // diff >> 18 so they're never candidates anyway.
    if ((max - min) <= 18 && max >= 125) candidate[p] = 1;
  }
  const visited = new Uint8Array(total);
  const stack = [];
  const seedRow = (y) => {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
    }
  };
  const seedCol = (x) => {
    for (let y = 0; y < h; y++) {
      const p = y * w + x;
      if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
    }
  };
  seedRow(0); seedRow(h - 1); seedCol(0); seedCol(w - 1);
  while (stack.length > 0) {
    const p = stack.pop();
    const x = p % w, y = (p / w) | 0;
    if (x > 0)     { const n = p - 1; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (x < w - 1) { const n = p + 1; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (y > 0)     { const n = p - w; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
    if (y < h - 1) { const n = p + w; if (candidate[n] && !visited[n]) { visited[n] = 1; stack.push(n); } }
  }
  for (let p = 0; p < total; p++) {
    if (visited[p]) data[p * ch + 3] = 0;
  }
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    const cast = max - min;
    // Widened gray band: char5-7 ship with bg max ~130-150 olive cast.
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

function findComponents(rawAlpha, minArea = 20000, alphaThreshold = 30) {
  const { data, width: w, height: h, channels: ch } = rawAlpha;
  const total = w * h;
  // labels[p] = component ID (1-indexed); 0 = unlabeled / background.
  const labels = new Int32Array(total);
  let nextLabel = 1;
  const components = [];
  const stack = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (labels[p] !== 0) continue;
      if (data[p * ch + 3] < alphaThreshold) continue;
      const id = nextLabel++;
      stack.length = 0;
      stack.push(p);
      labels[p] = id;
      let area = 0;
      let minX = x, maxX = x, minY = y, maxY = y;
      while (stack.length > 0) {
        const q = stack.pop();
        area++;
        const qx = q % w, qy = (q / w) | 0;
        if (qx < minX) minX = qx;
        if (qx > maxX) maxX = qx;
        if (qy < minY) minY = qy;
        if (qy > maxY) maxY = qy;
        if (qx > 0)     { const n = q - 1; if (labels[n] === 0 && data[n * ch + 3] >= alphaThreshold) { labels[n] = id; stack.push(n); } }
        if (qx < w - 1) { const n = q + 1; if (labels[n] === 0 && data[n * ch + 3] >= alphaThreshold) { labels[n] = id; stack.push(n); } }
        if (qy > 0)     { const n = q - w; if (labels[n] === 0 && data[n * ch + 3] >= alphaThreshold) { labels[n] = id; stack.push(n); } }
        if (qy < h - 1) { const n = q + w; if (labels[n] === 0 && data[n * ch + 3] >= alphaThreshold) { labels[n] = id; stack.push(n); } }
      }
      components.push({ id, x0: minX, y0: minY, x1: maxX, y1: maxY,
                        w: maxX - minX + 1, h: maxY - minY + 1, area });
    }
  }
  // Filter for character-sized components only.
  const filtered = components.filter((c) => c.area >= minArea);
  return { components: filtered, labels, width: w, height: h };
}

// Crop just the pixels belonging to one component, masking everything
// else to transparent. Eliminates label-text and arrow leakage that
// happens when noise components sit inside the target bbox.
async function cropComponent(cleanedRaw, comp, labels, width) {
  const { data: srcData, width: w, height: h, channels: ch } = cleanedRaw;
  const out = Buffer.alloc(comp.w * comp.h * ch);
  for (let y = 0; y < comp.h; y++) {
    for (let x = 0; x < comp.w; x++) {
      const sx = comp.x0 + x;
      const sy = comp.y0 + y;
      const sIdx = (sy * w + sx) * ch;
      const dIdx = (y * comp.w + x) * ch;
      if (labels[sy * w + sx] === comp.id) {
        out[dIdx]     = srcData[sIdx];
        out[dIdx + 1] = srcData[sIdx + 1];
        out[dIdx + 2] = srcData[sIdx + 2];
        out[dIdx + 3] = srcData[sIdx + 3];
      }
      // else: leave 0,0,0,0 (fully transparent)
    }
  }
  return sharp(out, { raw: { width: comp.w, height: comp.h, channels: ch } }).png().toBuffer();
}

// Standard sprite emit: trim, square-pad, resize 256, dual cleanup.
// Smaller atlas size (256 vs main pipeline's 512) since these are
// frequently swapped frames — total memory matters more than per-
// sprite pixel sharpness.
async function emitFrame(srcBuf, outFile, target = 256) {
  const cleaned1 = await lassoAlpha(srcBuf);
  const t = await sharp(cleaned1).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
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
  const resized = await sharp(padded)
    .resize(target, target, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const cleaned2 = await lassoAlpha(resized, 140, 240);
  await sharp(cleaned2)
    .png({ compressionLevel: 9, palette: false })
    .toFile(outFile);
}

// Horizontal dead-zone strips (in source y coordinates) that we zero
// out AFTER checker removal so label-text strokes ("WALK CYCLE",
// "Placid Neutral", etc.) don't bleed into the character components
// via thin pixel bridges. Each strip covers the gap BETWEEN rows of
// character cells; characters themselves live OUTSIDE these strips
// so they survive untouched.
const DEAD_ZONES = [
  { y0:    0, y1:  110 },  // sheet header (STATE TRANSITIONS / ANIMATION CYCLES)
  { y0:  395, y1:  500 },  // labels under row 0 + WALK CYCLE / ATTACK CHARGE titles
  { y0:  765, y1:  870 },  // labels under row 1 + ATTACK RELEASE title
  { y0: 1135, y1: 1235 },  // labels under row 2 + DEATH CYCLE title
];

// Wipe horizontal strips of the cleaned sheet to fully transparent.
// Returns a fresh PNG buffer.
async function maskDeadZones(cleanedPngBuf) {
  const raw = await sharp(cleanedPngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  for (const z of DEAD_ZONES) {
    const y0 = Math.max(0, z.y0);
    const y1 = Math.min(h, z.y1);
    for (let y = y0; y < y1; y++) {
      for (let x = 0; x < w; x++) {
        data[(y * w + x) * ch + 3] = 0;
      }
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

async function processChar(sheetFile, charDef) {
  const sheetPath = join(SRC, sheetFile);
  console.log(`▶︎ ${sheetFile} → ${charDef.key}`);
  // Step 1: checker removal on full sheet, then mask dead-zone strips
  // so label text doesn't bridge into character components.
  const cleanedPngBuf = await maskDeadZones(
    await removeCheckerBg(await sharp(sheetPath).png().toBuffer())
  );
  // Step 2: connected components (also returns a labels buffer so we
  // can mask non-component pixels when cropping each frame).
  const rawAlpha = await sharp(cleanedPngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cleanedRaw = {
    data: rawAlpha.data,
    width: rawAlpha.info.width,
    height: rawAlpha.info.height,
    channels: rawAlpha.info.channels,
  };
  const { components, labels } = findComponents(cleanedRaw, 20000);
  // Step 3: bucket by row band, then split state-vs-anim by X.
  const stateRows = [[], [], []];
  const animRows = [[], [], [], []];
  for (const c of components) {
    const cy = c.y0 + c.h / 2;
    const band = ROW_BANDS.find((b) => cy >= b.y0 && cy < b.y1);
    if (!band) continue;
    const isState = (c.x0 + c.w / 2) < X_SPLIT;
    const target = isState ? stateRows : animRows;
    if (isState && band.idx >= 3) continue;  // state grid is 3 rows
    target[band.idx].push(c);
  }
  // Sort each row by X.
  for (const row of stateRows) row.sort((a, b) => a.x0 - b.x0);
  for (const row of animRows) row.sort((a, b) => a.x0 - b.x0);
  // Step 4: emit frames.
  const charDir = join(OUT_BASE, charDef.key);
  mkdirSync(charDir, { recursive: true });
  const manifest = { state: {}, walk: [], attackCharge: [], attackRelease: [], death: [] };
  // State poses.
  for (let r = 0; r < 3; r++) {
    const cells = stateRows[r];
    for (let c = 0; c < cells.length && c < 3; c++) {
      const cell = cells[c];
      const name = STATE_NAMES[r][c];
      const cropped = await cropComponent(cleanedRaw, cell, labels, cleanedRaw.width);
      const outFile = join(charDir, `state-${name}.png`);
      await emitFrame(cropped, outFile);
      manifest.state[name] = `state-${name}.png`;
    }
  }
  // Animation cycles.
  for (let row = 0; row < ANIM_ROWS.length; row++) {
    const cells = animRows[row];
    const action = ANIM_ROWS[row];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cropped = await cropComponent(cleanedRaw, cell, labels, cleanedRaw.width);
      const outFile = join(charDir, `${action}-${i}.png`);
      await emitFrame(cropped, outFile);
      manifest[action].push(`${action}-${i}.png`);
    }
  }
  // Step 5: write manifest.
  const manifestPath = join(OUT_BASE, `${charDef.key}.json`);
  await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`  ${charDef.key}: state=${Object.keys(manifest.state).length}  walk=${manifest.walk.length}  charge=${manifest.attackCharge.length}  release=${manifest.attackRelease.length}  death=${manifest.death.length}`);
}

(async () => {
  mkdirSync(OUT_BASE, { recursive: true });
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(CHARS);
  for (const sheetKey of targets) {
    const def = CHARS[sheetKey];
    if (!def) {
      console.log(`  [skip] no char definition for ${sheetKey}`);
      continue;
    }
    await processChar(`${sheetKey}.png`, def);
  }
  console.log('done');
})();
