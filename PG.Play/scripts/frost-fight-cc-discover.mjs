// Connected-component discovery for the new sprite sheets (1.png …
// 7.png). Walks each sheet, runs the same checker-removal flood-fill
// the main processor uses, then enumerates connected non-transparent
// regions, dumping each one to /tmp/ff-cc/<sheet>/<idx>.png so we can
// hand-author manifests for processSheetCC.
//
// Run:  node scripts/frost-fight-cc-discover.mjs [<sheet-number>]
// (no arg = run all sheets 1..7)

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight');
const TMP = '/tmp/ff-cc';

// Inlined copy of removeCheckerBg from the main processor — see comments
// there for the rationale (flood-fill from borders + direct gray-band /
// tinted-near-white classifier).
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
    if ((max - min) <= 14 && max >= 150) candidate[p] = 1;
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
  // Direct gray-band + tinted-white pass for enclosed bg regions.
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    const cast = max - min;
    const isGrayBand    = cast <= 12 && max >= 158 && max <= 232;
    const isTintedWhite = cast >= 2 && cast <= 14 && max >= 233;
    if (isGrayBand || isTintedWhite) data[i + 3] = 0;
  }
  return { data, width: w, height: h, channels: ch };
}

// Connected-component labelling on the alpha mask. Iterative DFS so we
// don't blow the call stack on a 2816×1536 sheet. minArea filters out
// label-text strokes and dust.
function findComponents(raw, minArea = 800, alphaThreshold = 30) {
  const { data, width: w, height: h, channels: ch } = raw;
  const total = w * h;
  const visited = new Uint8Array(total);
  const components = [];
  const stack = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (visited[p]) continue;
      if (data[p * ch + 3] < alphaThreshold) { visited[p] = 1; continue; }
      // Seed BFS from p.
      stack.length = 0;
      stack.push(p);
      visited[p] = 1;
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
        if (qx > 0)     { const n = q - 1; if (!visited[n] && data[n * ch + 3] >= alphaThreshold) { visited[n] = 1; stack.push(n); } }
        if (qx < w - 1) { const n = q + 1; if (!visited[n] && data[n * ch + 3] >= alphaThreshold) { visited[n] = 1; stack.push(n); } }
        if (qy > 0)     { const n = q - w; if (!visited[n] && data[n * ch + 3] >= alphaThreshold) { visited[n] = 1; stack.push(n); } }
        if (qy < h - 1) { const n = q + w; if (!visited[n] && data[n * ch + 3] >= alphaThreshold) { visited[n] = 1; stack.push(n); } }
      }
      if (area >= minArea) {
        components.push({
          x0: minX, y0: minY, x1: maxX, y1: maxY,
          w: maxX - minX + 1, h: maxY - minY + 1, area,
        });
      }
    }
  }
  // Reading order: row-banded by ~120 px, then by x within band.
  components.sort((a, b) => {
    const ay = Math.floor(a.y0 / 120), by = Math.floor(b.y0 / 120);
    if (ay !== by) return ay - by;
    return a.x0 - b.x0;
  });
  return components;
}

async function discover(sheetFile) {
  const sheetName = sheetFile.replace('.png', '');
  const outDir = join(TMP, sheetName);
  mkdirSync(outDir, { recursive: true });
  console.log(`\n=== ${sheetFile} ===`);
  const sheetPath = join(SRC, sheetFile);
  const meta = await sharp(sheetPath).metadata();
  console.log(`source: ${meta.width}×${meta.height}`);
  // Step 1: checker-removal.
  const cleaned = await removeCheckerBg(await sharp(sheetPath).png().toBuffer());
  // Persist the full cleaned sheet so we can also inspect the whole field.
  await sharp(cleaned.data, { raw: { width: cleaned.width, height: cleaned.height, channels: cleaned.channels } })
    .png()
    .toFile(join(outDir, '_cleaned.png'));
  // Step 2: CC find.
  const components = findComponents(cleaned, 1200);
  console.log(`components found: ${components.length}`);
  // Step 3: dump each component cropped to its bbox.
  for (let i = 0; i < components.length; i++) {
    const c = components[i];
    const idx = String(i).padStart(2, '0');
    await sharp(cleaned.data, { raw: { width: cleaned.width, height: cleaned.height, channels: cleaned.channels } })
      .extract({ left: c.x0, top: c.y0, width: c.w, height: c.h })
      .png()
      .toFile(join(outDir, `${idx}.png`));
    console.log(`  [${idx}] (${c.x0},${c.y0}) ${c.w}×${c.h} area=${c.area}`);
  }
}

const args = process.argv.slice(2);
const sheets = args.length > 0
  ? args.map((n) => `${n}.png`)
  : ['1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png'];

(async () => {
  for (const f of sheets) await discover(f);
  console.log('\nAll dumps under /tmp/ff-cc/');
})();
