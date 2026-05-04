// Frost Fight — advanced char-sheet animation extractor.
//
// User dropped 11 sheets in `assets/frost-fight/char/advanced/` with a
// far cleaner layout than the older char1-char7:
//
//   Row 1: WALK CYCLE                  (6 frames, looping)
//   Row 2: GETTING ANGRY TRANSITION    (6 frames, non-looping)
//   Row 3: FURIOUS BLOWING / BLOWING ICE (6 frames, non-looping)
//   Row 4: DEATH CYCLE                 (4 frames, one-shot)
//
// All 11 sheets share this template (death sometimes lives in a small
// panel at the bottom-right rather than a full row, but the bbox
// position still falls in the y-band for row 4).
//
// Pipeline: removeCheckerBg → mask label-text dead zones → CC → bucket
// by y-band → sort by x → cropComponent (label-mask) → emitFrame.
//
// Output: `src/games/frost-fight/sprites/anim/<charKey>/<action>-<idx>.png`
//         + `<charKey>.json` manifest.
//
// Run: node scripts/frost-fight-char-advanced-atlas.mjs

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/frost-fight/char/advanced');
const OUT_BASE = resolve(ROOT, 'src/games/frost-fight/sprites/anim');

// Roster — sheet → output-key mapping. char2 (apple) and char7 (cherry)
// are new atlas members; char8/9/10/11 are special bots (candle, teapot,
// lamp, chest) that the game can wire as new enemy kinds later.
const CHARS = {
  char1:  { key: 'orange',     label: 'Orange'      },
  char2:  { key: 'apple',      label: 'Apple'       },
  char3:  { key: 'lemon',      label: 'Lemon'       },
  char4:  { key: 'strawberry', label: 'Strawberry'  },
  char5:  { key: 'peach',      label: 'Peach'       },
  char6:  { key: 'grape',      label: 'Grape'       },
  char7:  { key: 'cherry',     label: 'Cherry'      },
  char8:  { key: 'candle',     label: 'Candle'      },
  char9:  { key: 'teapot',     label: 'Teapot'      },
  char10: { key: 'lamp',       label: 'Lamp'        },
  char11: { key: 'chest',      label: 'Chest'       },
};

// Y-band → row index. Bands span the full character zone for each row
// of the 4-row template. Sheet height is 2048 px with cells ~370 px
// tall (header strip + frame + caption strip). Slop on each edge so a
// frame that sits a little above its row centre still bins correctly.
const ROW_BANDS = [
  { y0:   60, y1:  430, idx: 0, name: 'walk' },
  { y0:  430, y1:  830, idx: 1, name: 'attackCharge' },
  { y0:  830, y1: 1210, idx: 2, name: 'attackRelease' },
  { y0: 1210, y1: 1600, idx: 3, name: 'death' },
];

// Horizontal dead-zone strips (in source y) zeroed AFTER checker
// removal so caption text ("Frame 1: Contact", "Placid Neutral", etc.)
// + row titles don't fuse into character components via thin pixel
// bridges. Each band covers ONLY the gap between rows; characters
// themselves live OUTSIDE these strips.
const DEAD_ZONES = [
  { y0:    0, y1:  100 },  // top header (WALK CYCLE …)
  { y0:  370, y1:  500 },  // row 1 captions + row 2 title
  { y0:  760, y1:  880 },  // row 2 captions + row 3 title
  { y0: 1140, y1: 1260 },  // row 3 captions + row 4 title
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
  for (let x = 0; x < w; x++) { for (const y of [0, h - 1]) {
    const p = y * w + x; if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
  } }
  for (let y = 0; y < h; y++) { for (const x of [0, w - 1]) {
    const p = y * w + x; if (candidate[p] && !visited[p]) { visited[p] = 1; stack.push(p); }
  } }
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

function findComponents(rawAlpha, minArea = 12000, alphaThreshold = 30) {
  const { data, width: w, height: h, channels: ch } = rawAlpha;
  const total = w * h;
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
  return { components: components.filter((c) => c.area >= minArea), labels, width: w, height: h };
}

async function cropComponent(cleanedRaw, comp, labels) {
  const { data: srcData, width: w, channels: ch } = cleanedRaw;
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
    }
  }
  return sharp(out, { raw: { width: comp.w, height: comp.h, channels: ch } }).png().toBuffer();
}

async function emitFrame(srcBuf, outFile, target = 192) {
  const cleaned1 = await lassoAlpha(srcBuf);
  const t = await sharp(cleaned1).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  const max = Math.max(m.width, m.height);
  // Phase 22n — natural-aspect output. Skip the square-pad so tall
  // characters keep their actual proportions; runtime reads
  // naturalWidth/Height to draw at the right aspect rectangle.
  const pad = Math.round(max * 0.02);
  const padded = await sharp(t.data)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  // Resize so the LONGEST edge becomes `target`; shorter edge scales
  // proportionally. Output PNG is non-square for tall/wide chars.
  const scale = target / (max + pad * 2);
  const outW = Math.round((m.width  + pad * 2) * scale);
  const outH = Math.round((m.height + pad * 2) * scale);
  const resized = await sharp(padded)
    .resize({ width: outW, height: outH, fit: 'fill' })
    .png()
    .toBuffer();
  const cleaned2 = await lassoAlpha(resized, 140, 240);
  await sharp(cleaned2).png({ compressionLevel: 9 }).toFile(outFile);
}

async function processChar(sheetFile, charDef) {
  const sheetPath = join(SRC, sheetFile);
  console.log(`▶︎ ${sheetFile} → ${charDef.key}`);
  const cleanedPngBuf = await maskDeadZones(
    await removeCheckerBg(await sharp(sheetPath).png().toBuffer())
  );
  const rawAlpha = await sharp(cleanedPngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cleanedRaw = {
    data: rawAlpha.data,
    width: rawAlpha.info.width,
    height: rawAlpha.info.height,
    channels: rawAlpha.info.channels,
  };
  const { components, labels } = findComponents(cleanedRaw, 12000);
  // Bucket by y-band.
  const rows = [[], [], [], []];
  for (const c of components) {
    const cy = c.y0 + c.h / 2;
    const band = ROW_BANDS.find((b) => cy >= b.y0 && cy < b.y1);
    if (!band) continue;
    rows[band.idx].push(c);
  }
  for (const row of rows) row.sort((a, b) => a.x0 - b.x0);

  // Trim each row to its expected length: walk/charge/release = 6,
  // death = 4. Extra components (e.g. a stray smoke puff that survived
  // CC) get clipped from the END.
  const expected = [6, 6, 6, 4];
  for (let i = 0; i < 4; i++) {
    if (rows[i].length > expected[i]) rows[i] = rows[i].slice(0, expected[i]);
  }

  const charDir = join(OUT_BASE, charDef.key);
  // Wipe stale frames from the previous extractor (different counts)
  // before writing fresh ones so we don't end up with a mix.
  if (fs.existsSync(charDir)) {
    for (const f of fs.readdirSync(charDir)) {
      if (f.endsWith('.png')) fs.unlinkSync(join(charDir, f));
    }
  }
  mkdirSync(charDir, { recursive: true });

  const manifest = { walk: [], attackCharge: [], attackRelease: [], death: [], state: {} };
  const ROW_NAMES = ['walk', 'attackCharge', 'attackRelease', 'death'];
  for (let r = 0; r < 4; r++) {
    const action = ROW_NAMES[r];
    const cells  = rows[r];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cropped = await cropComponent(cleanedRaw, cell, labels);
      const out = join(charDir, `${action}-${i}.png`);
      await emitFrame(cropped, out);
      manifest[action].push(`${action}-${i}.png`);
    }
  }
  // Synthesise legacy state-pose aliases for runtime fallback. ALL
  // idle states map to the resting walk frame (frame 0) — using
  // attackCharge frames here was incorrect because in older kiwi /
  // pineapple atlases attackCharge[3] is already a BLOWING pose, so
  // proximity-irritated bots looked like they were always casting.
  if (manifest.walk[0]) {
    manifest.state.neutral   = manifest.walk[0];
    manifest.state.fuming    = manifest.walk[0];
    manifest.state.irritated = manifest.walk[0];
    manifest.state.sad       = manifest.death[0] || manifest.walk[0];
  }
  await fs.promises.writeFile(join(OUT_BASE, `${charDef.key}.json`), JSON.stringify(manifest, null, 2));
  console.log(`  ${charDef.key}: walk=${manifest.walk.length}  charge=${manifest.attackCharge.length}  release=${manifest.attackRelease.length}  death=${manifest.death.length}`);
}

(async () => {
  mkdirSync(OUT_BASE, { recursive: true });
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : Object.keys(CHARS);
  for (const sheetKey of targets) {
    const def = CHARS[sheetKey];
    if (!def) { console.log(`  [skip] ${sheetKey}`); continue; }
    await processChar(`${sheetKey}.png`, def);
  }
  console.log('done');
})();
