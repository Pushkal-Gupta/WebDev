// Frost Fight — process the user-provided art sheets into clean
// per-sprite PNGs.
//
// The user dropped these into assets/frost-fight/:
//   A Type 1.png   — 2x2 grid: player | strawberry / blueberry | fruit
//   B Type 1.png   — 2x2 grid: strawberry-windup | blueberry-windup / ice | exit
//   Frost-Fight.png — full showcase sheet (we crop the painted scene
//                     from the bottom-right for the lobby cover)
//
// Each cell is extracted, trimmed of transparent borders, square-padded
// with an 8% margin, downscaled to 128×128, and emitted as PNG into
// src/games/frost-fight/sprites/. The existing SVGs are preserved as
// fallbacks; the game's loader picks PNG first via import-path swap
// (handled in FrostFightGame.jsx after this script runs).
//
// Run:  node scripts/frost-fight-process-art.mjs

import sharp from 'sharp';
import * as fs from 'node:fs';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC = resolve(ROOT, 'assets/frost-fight');
const OUT_SPRITES = resolve(ROOT, 'src/games/frost-fight/sprites');
const OUT_COVER   = resolve(ROOT, 'src/games/frost-fight/sprites');

// A / B sheets are 2816×1536 — a 2x2 grid of 1408×768 cells.
const SHEET_W = 2816;
const SHEET_H = 1536;
const CELL_W  = SHEET_W / 2;
const CELL_H  = SHEET_H / 2;

// Sprite layouts. (col, row) is which 2x2 cell to extract from each sheet.
const A_LAYOUT = [
  { name: 'player.png',     col: 0, row: 0 },
  { name: 'strawberry.png', col: 1, row: 0 },
  { name: 'blueberry.png',  col: 0, row: 1 },
  { name: 'fruit.png',      col: 1, row: 1 },
];
const B_LAYOUT = [
  { name: 'strawberry-windup.png', col: 0, row: 0 },
  { name: 'blueberry-windup.png',  col: 1, row: 0 },
  { name: 'ice.png',               col: 0, row: 1 },
  { name: 'exit.png',              col: 1, row: 1 },
];
// A Type 2 carries the alt-fruit cast: ice cream (same as A1, skipped),
// the cherry pair (top-right), an orange villain (bottom-left), and a
// peach pickup (bottom-right). The orange wires up as a third enemy
// class; cherry + peach stay available for future content drops.
const A2_LAYOUT = [
  { name: 'cherry.png', col: 1, row: 0 },
  { name: 'orange.png', col: 0, row: 1 },
  { name: 'peach.png',  col: 1, row: 1 },
];

// Single-character drops (one image per file). These are full-frame
// renders rather than 2x2 sheets, so they get their own processor:
// strip platform UI badges in the corner, trim transparent edges,
// square-pad, resize to 128.
const SINGLES = [
  // The orange wind-up source has Gemini share/download UI chips in the
  // top-right. Wipe a generous rectangle (the buttons sit well above
  // the orange head, so a 22 % tall wipe is safe) and use a higher
  // trim threshold so faint sub-pixel alpha at the wipe edges doesn't
  // leak into the character bbox.
  { src: 'orange-wind-up.png', out: 'orange-windup.png',
    wipeTopRight: { wPct: 0.42, hPct: 0.22 }, trimThreshold: 25 },
  // Cherry-windup screenshot ships with the chat-platform UI badge in
  // the top-right corner; same wipe pattern. Two variants supplied —
  // we use the second (cleaner alignment) and skip the first.
  { src: 'cherry-windup2.png', out: 'cherry-windup.png',
    wipeTopRight: { wPct: 0.30, hPct: 0.18 }, trimThreshold: 18 },
];

// Long-format singles. Currently empty — the FROST FIGHT wordmark is
// rendered as inline vector text in src/covers.jsx so it scales
// infinitely without rasterising.
const WIDE_SINGLES = [];

// Wall texture sheets — opaque 2048×2048. The user's drops have a
// small Gemini "sparkle" badge in the bottom-right corner; we cover it
// by extracting a similarly-sized region from the bottom-left of the
// same image, flopping it horizontally, and compositing over the badge
// zone. For these textures the bottom band is roughly translation-
// invariant on the horizontal axis, so the seam reads as natural
// continuation rather than a visible patch. Final resize 256×256.
const WALLS = [
  { src: 'pantry.png',       out: 'pantry.png' },
  { src: 'coldroom.png',     out: 'coldroom.png' },
  { src: 'aisle.png',        out: 'aisle.png' },
  { src: 'walkin.png',       out: 'walkin.png' },
  { src: 'loadingdock.png',  out: 'loadingdock.png' },
  { src: 'subbasement.png',  out: 'subbasement.png' },
];

// Knock out the checker-pattern "transparent placeholder" that the AI
// generator bakes into source sheets as actual opaque gray pixels.
// The checker has multiple shades (~172 dark, ~199 light, ~254 near-
// white) so a simple color match misses the lightest cells. Flood-fill
// approach: seed from every border pixel that looks "bg-ish" (low
// saturation + medium-to-high brightness), expand inwards through
// matching neighbours. The character is enclosed by black outlines
// and never touches the border, so its interior whites (eyes, scoop
// highlights) are preserved.
async function removeCheckerBg(buf) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = raw.info;
  const data = raw.data;
  const total = w * h;
  // Pass 1: classify every pixel as bg-candidate (low saturation + the
  // checker brightness band, plus near-whites that aren't pure 255).
  const candidate = new Uint8Array(total);
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    if ((max - min) <= 14 && max >= 150) candidate[p] = 1;
  }
  // Pass 2: flood-fill from borders through candidates. Stack-based to
  // avoid the O(n) cost of Array.shift on a queue.
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
  // Pass 3: zero alpha for every visited pixel.
  let cleared = 0;
  for (let p = 0; p < total; p++) {
    if (visited[p]) { data[p * ch + 3] = 0; cleared++; }
  }
  // Pass 4: hard-zero enclosed checker pixels the flood-fill couldn't
  // reach (e.g. between cherry stems, inside leaf curls). Two ranges:
  //   - GRAY band: max in [158, 220], very desaturated (the two bulk
  //     checker shades).
  //   - TINTED near-white: max ≥ 240 with a slight color cast
  //     (max-min in [3, 14]). The AI generator's near-white checker
  //     cells have a faint green/cream tint (e.g. 254,255,250 — cast
  //     of 5). Pure character whites (eye highlights) sit at exactly
  //     255,255,255 (cast 0) so they survive.
  for (let p = 0, i = 0; p < total; p++, i += ch) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
    const cast = max - min;
    const isGrayBand     = cast <= 12 && max >= 158 && max <= 232;
    const isTintedWhite  = cast >= 2 && cast <= 14 && max >= 233;
    if (isGrayBand || isTintedWhite) {
      data[i + 3] = 0;
      cleared++;
    }
  }
  if (cleared > 0) {
    process.stdout.write(`    (checker bg cleared on ${(cleared / total * 100).toFixed(1)}% of pixels)\n`);
  }
  return sharp(data, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
}

// Aggressive alpha cleanup. Any pixel whose alpha is below `lowCut`
// becomes fully transparent — kills the soft halo the AI generator
// leaves around painted character outlines. Pixels above `highCut`
// snap to fully opaque so the silhouette reads cleanly. Mid-alpha
// pixels (real anti-aliased edges) are preserved untouched.
async function lassoAlpha(buf, lowCut = 130, highCut = 240) {
  const raw = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = raw.info;
  const data = raw.data;
  for (let i = 3; i < data.length; i += channels) {
    const a = data[i];
    if (a < lowCut) data[i] = 0;
    else if (a > highCut) data[i] = 255;
    // else: keep as-is (anti-aliased outline pixels)
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

// Wrap a processed PNG buffer into an SVG file with the same display
// size. The PNG is converted to WebP (40-60% smaller for painterly
// art) and embedded as a base64 data URI inside an `<image>` element.
// Output is a true `.svg` file Vite emits as a static asset; consumers
// `import x from '...svg?url'` like any other asset. Browsers rasterise
// the embedded WebP at whatever rendered size, so the sprite scales
// without re-encoding.
async function svgWrap(pngBuf, side, outFile) {
  const webpBuf = await sharp(pngBuf)
    .webp({ quality: 88, effort: 6, alphaQuality: 90 })
    .toBuffer();
  const b64 = webpBuf.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${side} ${side}" width="${side}" height="${side}" preserveAspectRatio="xMidYMid meet">
  <image href="data:image/webp;base64,${b64}" x="0" y="0" width="${side}" height="${side}" image-rendering="auto"/>
</svg>
`;
  await fs.promises.writeFile(outFile, svg);
}

async function emitSprite(cellBuf, outFile, target = 512, trimThreshold = 5) {
  // Pipeline: knock-out checker background → lasso alpha cleanup → trim
  // → square-pad → resize → LASSO AGAIN (sharp's resize blends edges
  // and introduces sub-threshold halo) → emit as PNG. PNG keeps alpha
  // exact; WebP's lossy alpha encoder reintroduces halo and breaks the
  // silhouette in the canvas draw path.
  const noChecker = await removeCheckerBg(cellBuf);
  const cleaned1 = await lassoAlpha(noChecker);
  const t = await sharp(cleaned1).trim({ threshold: trimThreshold }).toBuffer({ resolveWithObject: true });
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
  // Second pass — checker re-removal AND lasso alpha cleanup. The
  // resize step uses Lanczos and blends edge colours into the padding,
  // which can re-introduce bg-coloured pixels with mid-alpha. The
  // colour-aware checker pass catches bg-coloured pixels regardless
  // of alpha, and the alpha lasso then cuts any remaining sub-140
  // alpha noise.
  const noChecker2 = await removeCheckerBg(resized);
  const cleaned2 = await lassoAlpha(noChecker2, 140, 240);
  // outFile arg may end in .webp/.svg — coerce to .png.
  const pngFile = outFile.replace(/\.(webp|svg)$/i, '.png');
  await sharp(cleaned2)
    .png({ compressionLevel: 9, palette: false })
    .toFile(pngFile);
}

// Connected-component sprite finder. After `removeCheckerBg` clears the
// checker pattern, the remaining alpha>30 islands are individual
// sprites (characters, fruits, walls, cover scene). We label them via
// iterative DFS, filter out tiny noise (< minArea), and sort in
// reading order so a per-sheet manifest can map `componentIndex → name`
// deterministically.
function findComponents(rawAlpha, minArea = 1200, alphaThreshold = 30) {
  const { data, width: w, height: h, channels: ch } = rawAlpha;
  const total = w * h;
  const visited = new Uint8Array(total);
  const components = [];
  const stack = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (visited[p]) continue;
      if (data[p * ch + 3] < alphaThreshold) { visited[p] = 1; continue; }
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

// Per-sheet manifests (sheets 1.png … 7.png). Keys are the component
// indices in reading order from `findComponents`. Run
// `node scripts/frost-fight-cc-discover.mjs <n>` to dump components
// when adjusting these.
const SHEET1_MANIFEST = {
  // 0:  player-orange (small ice-cream variant) — skip; we have player.png
  1:  'banana-bot.png',         // angry yellow banana
  2:  'grape-bot.png',          // angry green grape cluster
  3:  'apple-fruit.png',        // plain apple, no face — fruit pickup
  4:  'plum-bot.png',           // angry purple plum
  5:  'eggplant-bot.png',       // angry eggplant
  6:  'lemon-fruit.png',        // plain lemon — fruit pickup
  7:  'cherrybomb-bot.png',     // bomb-cherry attacker (red sphere with fuse)
  // 8: blueberry (already have it)
  // 9: ice-crystal decorative — skip
  // 10: flag — skip (have exit)
  11: 'melon-bot.png',          // angry green melon
  12: 'kiwi-fruit.png',         // kiwi half — fruit pickup
  13: 'cherry-fruit.png',       // plain cherry — fruit pickup (alt to strawberry)
  // 14-21: wall textures + theme cover — handled separately
};

// CC-driven sprite extractor. Loads a sheet, runs checker-bg removal,
// finds components, then for each manifest entry crops the bbox out of
// the cleaned sheet and runs the standard emitSprite tail (lasso + trim
// + pad + resize 512 + dual cleanup).
async function processSheetCC(sheetFile, manifest) {
  const sheetPath = join(SRC, sheetFile);
  // Step 1: full-sheet checker-removal returns the cleaned alpha buffer.
  const cleanedRaw = await sharp(await sharp(sheetPath).png().toBuffer())
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // We need the cleaned buffer (post-checker-removal). To reuse
  // removeCheckerBg, run it then re-extract raw pixels.
  const cleanedPngBuf = await removeCheckerBg(await sharp(sheetPath).png().toBuffer());
  const rawAlpha = await sharp(cleanedPngBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const components = findComponents({
    data: rawAlpha.data,
    width: rawAlpha.info.width,
    height: rawAlpha.info.height,
    channels: rawAlpha.info.channels,
  }, 1200);
  for (const [idxStr, name] of Object.entries(manifest)) {
    const idx = Number(idxStr);
    if (idx >= components.length) {
      process.stdout.write(`  [warn] ${sheetFile} component ${idx} out of range (have ${components.length})\n`);
      continue;
    }
    if (!name) continue;
    const c = components[idx];
    // Crop the component bbox from the CLEANED sheet so we keep the
    // checker-removed alpha. emitSprite runs its standard cleanup tail.
    const cropped = await sharp(cleanedPngBuf)
      .extract({ left: c.x0, top: c.y0, width: c.w, height: c.h })
      .png()
      .toBuffer();
    await emitSprite(cropped, join(OUT_SPRITES, name), 512);
    process.stdout.write(`  ${name}  (cc#${idx}, ${c.w}×${c.h})\n`);
  }
}

async function processSheet(sheetPath, layout) {
  // Inset every edge of the cell. The AI generator drew dark divider
  // lines around each cell (3-10 px black/near-black) plus a faint
  // dropshadow band that the gray-only flood-fill doesn't catch. 50 px
  // is far enough in to clear all that without clipping the centred
  // character (the character bboxes are <800 px in a 1408×768 cell).
  const INSET = 50;
  for (const item of layout) {
    const cell = await sharp(sheetPath)
      .extract({
        left:   item.col * CELL_W + INSET,
        top:    item.row * CELL_H + INSET,
        width:  CELL_W - 2 * INSET,
        height: CELL_H - 2 * INSET,
      })
      .toBuffer();
    const out = join(OUT_SPRITES, item.name);
    await emitSprite(cell, out, 512);
    process.stdout.write(`  ${item.name}\n`);
  }
}

// Single-frame characters. Wipes a configurable top-right rectangle so
// platform UI badges (share / download buttons) get erased before the
// trim crops the sprite tight to its character bbox.
async function processSingle(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const ww = Math.round(meta.width  * (item.wipeTopRight?.wPct ?? 0));
  const wh = Math.round(meta.height * (item.wipeTopRight?.hPct ?? 0));
  let buf = await sharp(src).png().toBuffer();
  if (ww > 0 && wh > 0) {
    const mask = await sharp({
      create: { width: ww, height: wh, channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    buf = await sharp(buf)
      .composite([{ input: mask, left: meta.width - ww, top: 0, blend: 'dest-out' }])
      .png().toBuffer();
  }
  await emitSprite(buf, join(OUT_SPRITES, item.out), 512, item.trimThreshold ?? 5);
  process.stdout.write(`  ${item.out}\n`);
}

// Wide single — wordmark style. Wipes the platform UI badge, trims,
// resizes by width while preserving aspect ratio.
async function processWideSingle(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const ww = Math.round(meta.width  * (item.wipeTopRight?.wPct ?? 0));
  const wh = Math.round(meta.height * (item.wipeTopRight?.hPct ?? 0));
  let buf = await sharp(src).png().toBuffer();
  if (ww > 0 && wh > 0) {
    const mask = await sharp({
      create: { width: ww, height: wh, channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();
    buf = await sharp(buf)
      .composite([{ input: mask, left: meta.width - ww, top: 0, blend: 'dest-out' }])
      .png().toBuffer();
  }
  const cleaned = await lassoAlpha(buf);
  const trimmed = await sharp(cleaned).trim({ threshold: item.trimThreshold ?? 5 })
    .toBuffer({ resolveWithObject: true });
  const pngBuf = await sharp(trimmed.data)
    .resize({ width: item.targetWidth ?? 1024 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const outPng = join(OUT_SPRITES, item.out);
  await fs.promises.writeFile(outPng, pngBuf);
  // SVG wrap with webp embedding. Preserves the wide aspect ratio.
  const wrapMeta = await sharp(pngBuf).metadata();
  const webpBuf = await sharp(pngBuf)
    .webp({ quality: 88, effort: 6, alphaQuality: 90 })
    .toBuffer();
  const b64 = webpBuf.toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wrapMeta.width} ${wrapMeta.height}" width="${wrapMeta.width}" height="${wrapMeta.height}" preserveAspectRatio="xMidYMid meet">
  <image href="data:image/webp;base64,${b64}" x="0" y="0" width="${wrapMeta.width}" height="${wrapMeta.height}"/>
</svg>
`;
  await fs.promises.writeFile(outPng.replace(/\.png$/, '.svg'), svg);
  process.stdout.write(`  ${item.out} + .svg (${wrapMeta.width}×${wrapMeta.height})\n`);
}

// Wall-texture pipeline. Strips the bottom-right Gemini sparkle, then
// resizes to 256x256 for the in-game CanvasPattern repeat fill.
async function processWall(item) {
  const src = join(SRC, item.src);
  const meta = await sharp(src).metadata();
  const W = meta.width, H = meta.height;
  // Patch zone: ~14 % × 14 % at the bottom-right covers the badge with
  // headroom. Source patch: same dims taken from the bottom-LEFT and
  // flopped horizontally so the texture's horizontal grain continues.
  const ww = Math.round(W * 0.14);
  const wh = Math.round(H * 0.14);
  const patch = await sharp(src)
    .extract({ left: 0, top: H - wh, width: ww, height: wh })
    .flop()
    .png()
    .toBuffer();
  const cleaned = await sharp(src)
    .composite([{ input: patch, left: W - ww, top: H - wh }])
    .toBuffer();
  // Out folder is sprites/walls/. Final 256×256 PNG with sharp
  // compression. We DON'T trim or pad — wall textures are tiles, not
  // sprites; they need to keep their full square frame for the
  // CanvasPattern('repeat') to align.
  const outDir = join(OUT_SPRITES, 'walls');
  mkdirSync(outDir, { recursive: true });
  await sharp(cleaned)
    .resize(256, 256, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, item.out));
  process.stdout.write(`  walls/${item.out}\n`);
}

// The Frost-Fight.png sheet contains a painted scene in the bottom-right
// roughly the rightmost ~37% × bottom ~33%. We crop, trim slightly,
// and emit a 1280×720 PNG.
async function processCover() {
  const meta = await sharp(join(SRC, 'Frost-Fight.png')).metadata();
  const W = meta.width, H = meta.height;
  // Empirical region — the painted hero scene sits in the bottom-right
  // quadrant of the master sheet. The sheet has a light-gray divider
  // band at the right edge of the scene (artifact of the original
  // panel layout). RIGHT_CROP slices past it; LEFT_INSET nudges the
  // start in by a hair to keep the framing centred.
  const RIGHT_CROP = 50;
  const LEFT_INSET = 8;
  const TOP_INSET  = 6;
  const left   = Math.round(W * 0.625) + LEFT_INSET;
  const top    = Math.round(H * 0.555) + TOP_INSET;
  const width  = W - left - RIGHT_CROP;
  const height = H - top;
  const cropped = await sharp(join(SRC, 'Frost-Fight.png'))
    .extract({ left, top, width, height })
    .toBuffer();
  // Two webp variants — 1280 for the WinCard backdrop + lobby cover,
  // 640 as a smaller fallback. Webp is the canonical output so the
  // script is idempotent (no PNG leftover from a previous run).
  await sharp(cropped)
    .resize(1280, 720, { fit: 'cover', position: 'center' })
    .webp({ quality: 82, effort: 6 })
    .toFile(join(OUT_COVER, 'cover.webp'));
  await sharp(cropped)
    .resize(640, 360, { fit: 'cover', position: 'center' })
    .webp({ quality: 80, effort: 6 })
    .toFile(join(OUT_COVER, 'cover-640.webp'));
  process.stdout.write(`  cover.webp + cover-640.webp (cropped ${width}×${height})\n`);
}

(async () => {
  mkdirSync(OUT_SPRITES, { recursive: true });
  console.log('▶︎ A Type 1');
  await processSheet(join(SRC, 'A Type 1.png'), A_LAYOUT);
  console.log('▶︎ B Type 1');
  await processSheet(join(SRC, 'B Type 1.png'), B_LAYOUT);
  console.log('▶︎ A Type 2');
  await processSheet(join(SRC, 'A Type 2.png'), A2_LAYOUT);
  console.log('▶︎ Sheet 1 (themed bots + alt fruits)');
  await processSheetCC('1.png', SHEET1_MANIFEST);
  console.log('▶︎ Singles');
  for (const s of SINGLES) await processSingle(s);
  console.log('▶︎ Wide singles');
  for (const ws of WIDE_SINGLES) await processWideSingle(ws);
  console.log('▶︎ Walls');
  for (const w of WALLS) await processWall(w);
  console.log('▶︎ Frost-Fight cover');
  await processCover();
  // Co-op P2 — re-tint the player sprite. 200° hue rotation shifts
  // pink (~hue 325) to cyan-mint (~hue 165) so the two players read
  // as distinct without needing a second source asset.
  console.log('▶︎ Co-op P2');
  const playerPath = join(OUT_SPRITES, 'player.png');
  if (fs.existsSync(playerPath)) {
    await sharp(playerPath)
      .modulate({ hue: 200 })
      .png({ compressionLevel: 9 })
      .toFile(join(OUT_SPRITES, 'player-2.png'));
    process.stdout.write('  player-2.png\n');
  }
  console.log('done');
})();
