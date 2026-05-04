// Frost Fight — extract the four ice-cream variants from sheet 5
// (DIFFERENT TYPES OF ICE CREAM panel) into player-skin sprites.
//
//   (a) vanilla cone with a face   → icecream-vanilla.png   (already
//                                     close to the existing player.png
//                                     so we keep it as the default skin)
//   (b) chocolate sundae glass     → icecream-sundae.png
//   (c) strawberry/choc/vanilla 3-scoop cone → icecream-triple.png
//   (d) ice-cream sandwich         → icecream-sandwich.png
//
// Each gets the standard checker-removal + lasso + trim + 8 % pad +
// 512×512 emit pipeline. Bbox coords measured from the discover dump
// (scripts/frost-fight-cc-discover.mjs 5) — sheet 5 is laid out
// stably so hard-coded crops are safe.
//
// Run: node scripts/frost-fight-icecream-skins.mjs

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/frost-fight/5.png');
const OUT  = resolve(ROOT, 'src/games/frost-fight/sprites');

// Hand-tuned crop rectangles (from cc-discover bboxes, with a small
// inset on each edge to skip the (a)/(b)/(c)/(d) label letters and any
// faint title-strip pixels that survive checker removal).
const CROPS = [
  // Each crop excludes the (a)/(b)/(c)/(d) caption letter that sits
  // just below or to the left of the sprite, plus the "DIFFERENT TYPES
  // OF ICE CREAM" / "CREAM" title strip that bleeds into the (b) cell.
  // Empirically tuned by reading the extracted PNGs back in.
  { name: 'icecream-vanilla.png',  left:  95,  top: 920,  width: 270, height: 360 },
  { name: 'icecream-sundae.png',   left: 695,  top: 870,  width: 290, height: 290 },
  { name: 'icecream-triple.png',   left: 430,  top: 1073, width: 215, height: 390 },
  { name: 'icecream-sandwich.png', left: 950,  top: 1176, width: 357, height: 285 },
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
    if ((max - min) <= 14 && max >= 150) candidate[p] = 1;
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
    const isGrayBand    = cast <= 12 && max >= 158 && max <= 232;
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

async function emitSprite(srcBuf, outFile, target = 512) {
  const cleaned1 = await lassoAlpha(srcBuf);
  const t = await sharp(cleaned1).trim({ threshold: 5 }).toBuffer({ resolveWithObject: true });
  const m = t.info;
  const max = Math.max(m.width, m.height);
  const pad = Math.round(max * 0.03);  // tighter pad so player skin reads big in-game
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
  await sharp(cleaned2).png({ compressionLevel: 9 }).toFile(outFile);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  console.log('▶︎ Ice cream skins from sheet 5');
  // Step 1: full-sheet checker removal once.
  const cleanedFull = await removeCheckerBg(await sharp(SRC).png().toBuffer());
  for (const c of CROPS) {
    const cropped = await sharp(cleanedFull)
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .png().toBuffer();
    await emitSprite(cropped, join(OUT, c.name));
    console.log(`  ${c.name}  (${c.width}×${c.height})`);
  }
  console.log('done');
})();
