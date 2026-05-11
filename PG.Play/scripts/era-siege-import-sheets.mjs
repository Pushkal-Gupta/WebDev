#!/usr/bin/env node
// Deterministic, manifest-driven importer for Era Siege artwork.
//
// Reads `assets/era-siege/advanced/manifest.json`. For each entry:
//   1. Loads the source sheet, alpha-keys grey backgrounds if needed.
//   2. Erases the Gemini watermark in the bottom-right corner.
//   3. Slices the sheet into cols × rows equal-cell frames (no gutters).
//   4. Trims each frame to its opaque bounding box, then re-packs at the
//      role's standard cell size with foot-anchored, horizontally centered
//      placement.
//   5. Emits horizontal strips: walk.png, attack.png, idle.png for units;
//      strip.png for projectiles/vfx.
//   6. Also writes a static fallback PNG at the renderer's existing path
//      (e.g. `unit/era1/frontline.png`) for back-compat.
//
// Outputs:
//   public/games/era-siege/sprites/<kind>/.../{walk,attack,idle,strip}.png
//   public/games/era-siege/<kind>/.../<id|role>.png  (static back-compat)
//
// Usage:  node scripts/era-siege-import-sheets.mjs
//         node scripts/era-siege-import-sheets.mjs --only=try4/1.png
//         node scripts/era-siege-import-sheets.mjs --dry

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const ADV = resolve(ROOT, 'assets/era-siege/advanced');
const OUT = resolve(ROOT, 'public/games/era-siege');
const SPRITES = join(OUT, 'sprites');

const args = new Set(process.argv.slice(2));
const onlyArg = [...args].find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1] : null;
const DRY = args.has('--dry');

const UNIT_ROLE_CELL = {
  frontline: { w: 256, h: 256, footY: 240 },
  ranged:    { w: 256, h: 256, footY: 240 },
  heavy:     { w: 320, h: 320, footY: 304 },
  general:   { w: 384, h: 384, footY: 368 },
};
const TURRET_CELL = { w: 256, h: 256, footY: 240 };
const PROJECTILE_CELL = { w: 64, h: 32 };
const VFX_CELL = { w: 128, h: 128 };

const manifest = JSON.parse(readFileSync(join(ADV, 'manifest.json'), 'utf-8'));
const watermarkDefault = manifest.watermarkDefault || { corner: 'bottom-right', w: 80, h: 80 };

const summary = { processed: 0, skipped: 0, written: [], errors: [] };

for (const entry of manifest.entries) {
  if (entry.kind === 'skip') { summary.skipped++; continue; }
  if (ONLY && entry.src !== ONLY) continue;
  try {
    await processEntry(entry);
    summary.processed++;
  } catch (err) {
    summary.errors.push({ src: entry.src, error: err.message });
    console.error(`[FAIL] ${entry.src}: ${err.message}`);
  }
}

// Find PNGs in advanced/try*/ that aren't in the manifest at all.
const known = new Set(manifest.entries.map((e) => e.src));
const unmapped = [];
for (const sub of readdirSync(ADV).filter((f) => statSync(join(ADV, f)).isDirectory())) {
  for (const f of readdirSync(join(ADV, sub)).filter((f) => f.toLowerCase().endsWith('.png'))) {
    const rel = `${sub}/${f}`;
    if (!known.has(rel)) unmapped.push(rel);
  }
}

console.log('\n=== Import summary ===');
console.log(`processed: ${summary.processed}`);
console.log(`skipped:   ${summary.skipped}`);
console.log(`errors:    ${summary.errors.length}`);
console.log(`written:   ${summary.written.length} files`);
if (unmapped.length) {
  console.log(`\nUnmapped sources (add to manifest.json):`);
  for (const u of unmapped) console.log(`  ? ${u}`);
}
if (summary.errors.length) process.exit(1);

// ────────────────────────────────────────────────────────────────────

async function processEntry(entry) {
  const srcPath = join(ADV, entry.src);
  if (!existsSync(srcPath)) throw new Error(`source missing: ${entry.src}`);

  const meta = await sharp(srcPath).metadata();
  const SW = meta.width, SH = meta.height;
  const cellW = Math.floor(SW / entry.cols);
  const cellH = Math.floor(SH / entry.rows);

  let buf = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  if (entry.bg && typeof entry.bg === 'object') {
    buf = alphaKeyColor(buf, entry.bg);
  } else if (entry.bg === 'transparent') {
    // Most "transparent" exports are actually a baked-in checker
    // (Gemini's preview renders alpha as a 2-tone grey grid). Alpha-
    // key the grid: pixels with low saturation in the checker grey
    // band become alpha=0.
    buf = alphaKeyChecker(buf);
  } else if (typeof entry.bg === 'string') {
    throw new Error(`unknown bg mode: ${entry.bg}`);
  }

  buf = eraseCorner(buf, entry.watermark || watermarkDefault, SW, SH);

  // Re-export to PNG for downstream sharp ops.
  const cleanedPng = await sharp(buf.data, {
    raw: { width: buf.info.width, height: buf.info.height, channels: 4 },
  }).png().toBuffer();

  if (entry.kind === 'unit' || entry.kind === 'turret') {
    await emitUnitOrTurret(entry, cleanedPng, cellW, cellH);
  } else if (entry.kind === 'projectile') {
    await emitProjectile(entry, cleanedPng, cellW, cellH);
  } else if (entry.kind === 'vfx') {
    await emitVfx(entry, cleanedPng, cellW, cellH);
  } else if (entry.kind === 'base') {
    await emitBase(entry, cleanedPng, SW, SH);
  } else if (entry.kind === 'bg') {
    await emitBg(entry, cleanedPng, SW, SH);
  } else {
    throw new Error(`unknown kind: ${entry.kind}`);
  }
}

// Bases: a sheet showing the player base on the left half and the
// enemy base on the right half. Saves base/era<N>/{player,enemy}.png.
async function emitBase(entry, sheetPng, SW, SH) {
  const halfW = Math.floor(SW / 2);
  const baseDir = join(OUT, 'base', `era${entry.era}`);
  if (!DRY) mkdirSync(baseDir, { recursive: true });
  for (const [side, x] of [['player', 0], ['enemy', halfW]]) {
    const cell = await sharp(sheetPng)
      .extract({ left: x, top: 0, width: halfW, height: SH })
      .toBuffer();
    const trimmed = await trimToBbox(cell);
    const out = join(baseDir, `${side}.png`);
    if (!DRY) await sharp(trimmed).png().toFile(out);
    summary.written.push(out);
  }
}

// Background: a single full-frame image (no grid). Saves to
// bg/era<N>/<id>.png at native dims, alpha-keyed.
async function emitBg(entry, sheetPng, SW, SH) {
  const bgDir = join(OUT, 'bg', `era${entry.era}`);
  if (!DRY) mkdirSync(bgDir, { recursive: true });
  const out = join(bgDir, `${entry.id}.png`);
  if (!DRY) await sharp(sheetPng).png().toFile(out);
  summary.written.push(out);
}

async function emitUnitOrTurret(entry, sheetPng, cellW, cellH) {
  const spec = entry.kind === 'turret'
    ? TURRET_CELL
    : (UNIT_ROLE_CELL[entry.role] || UNIT_ROLE_CELL.frontline);
  const rowNames = ['walk', 'attack', 'idle'];
  const subdir = entry.kind === 'unit'
    ? join('sprites', 'unit', `era${entry.era}`, entry.role)
    : join('sprites', 'turret', `era${entry.era}`, entry.role);
  const outDir = join(OUT, subdir);
  if (!DRY) mkdirSync(outDir, { recursive: true });

  for (let row = 0; row < Math.min(entry.rows, rowNames.length); row++) {
    const frames = [];
    for (let col = 0; col < entry.cols; col++) {
      const cell = await sharp(sheetPng)
        .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
        .toBuffer();
      const repacked = await repackCell(cell, spec);
      frames.push(repacked);
    }
    const stripBuf = await composeStrip(frames, spec.w, spec.h);
    const outPath = join(outDir, `${rowNames[row]}.png`);
    if (!DRY) await sharp(stripBuf).png().toFile(outPath);
    summary.written.push(outPath);
  }

  // Static fallback for renderer back-compat: pick attack frame 1 (post-windup).
  const fallbackCell = await sharp(sheetPng)
    .extract({ left: 1 * cellW, top: 1 * cellH, width: cellW, height: cellH })
    .toBuffer();
  const fallback = await repackCell(fallbackCell, spec);
  const fallbackPath = entry.kind === 'unit'
    ? join(OUT, 'unit', `era${entry.era}`, `${entry.role}.png`)
    : join(OUT, 'turret', `era${entry.era}-${entry.role}.png`);
  if (!DRY) {
    mkdirSync(dirname(fallbackPath), { recursive: true });
    await sharp(fallback).png().toFile(fallbackPath);
  }
  summary.written.push(fallbackPath);
}

async function emitProjectile(entry, sheetPng, cellW, cellH) {
  const row = entry.pickRow ?? 1;
  const subdir = join('sprites', 'projectile', entry.id);
  const outDir = join(OUT, subdir);
  if (!DRY) mkdirSync(outDir, { recursive: true });

  const frames = [];
  for (let col = 0; col < entry.cols; col++) {
    const cell = await sharp(sheetPng)
      .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
      .toBuffer();
    const trimmed = await trimToBbox(cell);
    const fitted = await fitInto(trimmed, PROJECTILE_CELL.w, PROJECTILE_CELL.h, 'center');
    frames.push(fitted);
  }
  const stripBuf = await composeStrip(frames, PROJECTILE_CELL.w, PROJECTILE_CELL.h);
  if (!DRY) await sharp(stripBuf).png().toFile(join(outDir, 'strip.png'));
  summary.written.push(join(outDir, 'strip.png'));

  // Static fallback at projectile/<id>.png — pick a frame with the most opaque pixels.
  const best = await pickBestFrame(sheetPng, row, entry.cols, cellW, cellH);
  const fallbackPath = join(OUT, 'projectile', `${entry.id}.png`);
  if (!DRY) {
    mkdirSync(dirname(fallbackPath), { recursive: true });
    await sharp(best).png().toFile(fallbackPath);
  }
  summary.written.push(fallbackPath);
}

async function emitVfx(entry, sheetPng, cellW, cellH) {
  const row = entry.pickRow ?? 1;
  const subdir = join('sprites', 'vfx', entry.id);
  const outDir = join(OUT, subdir);
  if (!DRY) mkdirSync(outDir, { recursive: true });

  const frames = [];
  for (let col = 0; col < entry.cols; col++) {
    const cell = await sharp(sheetPng)
      .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
      .toBuffer();
    const trimmed = await trimToBbox(cell);
    const fitted = await fitInto(trimmed, VFX_CELL.w, VFX_CELL.h, 'center');
    frames.push(fitted);
  }
  const stripBuf = await composeStrip(frames, VFX_CELL.w, VFX_CELL.h);
  if (!DRY) await sharp(stripBuf).png().toFile(join(outDir, 'strip.png'));
  summary.written.push(join(outDir, 'strip.png'));

  // Static fallback: brightest/most-opaque frame.
  const best = await pickBestFrame(sheetPng, row, entry.cols, cellW, cellH);
  const fallbackPath = join(OUT, 'vfx', `${entry.id}.png`);
  if (!DRY) {
    mkdirSync(dirname(fallbackPath), { recursive: true });
    await sharp(best).resize(VFX_CELL.w, VFX_CELL.h, { fit: 'inside', withoutEnlargement: false })
      .extend({ background: { r: 0, g: 0, b: 0, alpha: 0 }, top: 0, bottom: 0, left: 0, right: 0 })
      .png().toFile(fallbackPath);
  }
  summary.written.push(fallbackPath);
}

// ── helpers ─────────────────────────────────────────────────────────

// Set alpha=0 on every pixel within tolerance of the given color.
function alphaKeyColor({ data, info }, { r, g, b, tolerance = 12 }) {
  const out = Buffer.from(data);
  const tol2 = tolerance * tolerance;
  for (let i = 0; i < out.length; i += 4) {
    const dr = out[i] - r, dg = out[i + 1] - g, db = out[i + 2] - b;
    if (dr * dr + dg * dg + db * db <= tol2) {
      out[i + 3] = 0;
    }
  }
  return { data: out, info };
}

// Alpha-key the "transparent" checker pattern that AI image gens bake
// into a flat PNG. Different sheets use different checker shades
// (~65/~120 on era 1 sources, ~195/~255 on era 2). Auto-detect them
// by sampling 8×8 px from each of the four sheet corners — the two
// most common shades there are the checker tones. Then alpha-key any
// pixel within ±10 of either of those (chroma-bounded so we don't
// nuke saturated body colors).
function alphaKeyChecker({ data, info }) {
  const W = info.width, H = info.height;
  const samples = new Map();
  const sampleAt = (cx, cy) => {
    for (let dy = 0; dy < 8; dy++) {
      for (let dx = 0; dx < 8; dx++) {
        const x = Math.max(0, Math.min(W - 1, cx + dx));
        const y = Math.max(0, Math.min(H - 1, cy + dy));
        const i = (y * W + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        if (max - min > 30) continue;
        const k = `${Math.round(r / 4) * 4}_${Math.round(g / 4) * 4}_${Math.round(b / 4) * 4}`;
        samples.set(k, (samples.get(k) || 0) + 1);
      }
    }
  };
  // Sample bigger blocks from each corner so we catch both checker tones.
  for (const [cx, cy] of [[0, 0], [W - 24, 0], [0, H - 24], [W - 24, H - 24]]) {
    for (let dy = 0; dy < 24; dy += 2) {
      for (let dx = 0; dx < 24; dx += 2) {
        sampleAt(cx + dx, cy + dy);
      }
    }
  }
  const top = [...samples.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const targets = top.map(([k]) => k.split('_').map(Number));
  // Value band — catches anti-aliased gradient pixels BETWEEN the
  // detected checker tones. Scoped to the actual max(target) range
  // (not extended) so silver/grey projectiles outside the band are safe.
  const targetMaxes = targets.map(([r, g, bv]) => Math.max(r, g, bv));
  const bandLo = Math.min(...targetMaxes);
  const bandHi = Math.max(...targetMaxes);

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const chroma = max - min;
    if (chroma > 30) continue;
    let hit = false;
    for (const [tr, tg, tb] of targets) {
      const dr = r - tr, dg = g - tg, db = b - tb;
      if (dr * dr + dg * dg + db * db <= 22 * 22) { hit = true; break; }
    }
    if (!hit && chroma <= 12 && max >= bandLo && max <= bandHi) hit = true;
    if (hit) out[i + 3] = 0;
  }
  return { data: out, info };
}

// Erase a rectangular corner of the buffer (bottom-right by default).
// `box` may specify w/h directly (in source px) OR pct (as a fraction
// of min(W,H)). Pct=0.10 means ~10% of the shorter side.
function eraseCorner({ data, info }, box, W, H) {
  const minSide = Math.min(W, H);
  const w = box.w || Math.round(minSide * (box.pct ?? 0.12));
  const h = box.h || Math.round(minSide * (box.pct ?? 0.12));
  let x0 = 0, y0 = 0;
  if ((box.corner || 'bottom-right') === 'bottom-right') { x0 = W - w; y0 = H - h; }
  else if (box.corner === 'bottom-left') { x0 = 0; y0 = H - h; }
  else if (box.corner === 'top-right') { x0 = W - w; y0 = 0; }
  else if (box.corner === 'top-left') { x0 = 0; y0 = 0; }
  const out = Buffer.from(data);
  for (let y = y0; y < y0 + h && y < H; y++) {
    for (let x = x0; x < x0 + w && x < W; x++) {
      const idx = (y * W + x) * 4;
      out[idx + 3] = 0;
    }
  }
  return { data: out, info };
}

// Trim a buffer to the bounding box of its opaque pixels.
async function trimToBbox(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    return await sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  }
  return await sharp(buf).extract({
    left: minX, top: minY,
    width: maxX - minX + 1, height: maxY - minY + 1,
  }).toBuffer();
}

// Repack a raw cell into a target spec (foot-anchored, horizontally centered).
async function repackCell(cellBuf, spec) {
  const trimmed = await trimToBbox(cellBuf);
  const tMeta = await sharp(trimmed).metadata();
  const tW = tMeta.width, tH = tMeta.height;
  // Scale to fit within the spec (preserve aspect, leave 4 px headroom on sides).
  const maxW = spec.w - 8, maxH = spec.h - 8;
  const scale = Math.min(maxW / tW, maxH / tH, 1);
  const sw = Math.max(1, Math.round(tW * scale));
  const sh = Math.max(1, Math.round(tH * scale));
  const scaled = await sharp(trimmed).resize(sw, sh, { fit: 'fill', kernel: 'lanczos3' }).toBuffer();
  // Place: horizontally centered, foot at spec.footY.
  const left = Math.round((spec.w - sw) / 2);
  const top = Math.max(0, Math.min(spec.h - sh, spec.footY - sh));
  const canvas = await sharp({
    create: { width: spec.w, height: spec.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
  return await sharp(canvas)
    .composite([{ input: scaled, left, top }])
    .png().toBuffer();
}

async function fitInto(buf, w, h, anchor = 'center') {
  const m = await sharp(buf).metadata();
  if (m.width <= 1 && m.height <= 1) {
    return await sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
  }
  const scale = Math.min(w / m.width, h / m.height, 1);
  const sw = Math.max(1, Math.round(m.width * scale));
  const sh = Math.max(1, Math.round(m.height * scale));
  const scaled = await sharp(buf).resize(sw, sh, { fit: 'fill', kernel: 'lanczos3' }).toBuffer();
  const left = Math.round((w - sw) / 2);
  const top = Math.round((h - sh) / 2);
  const canvas = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
  return await sharp(canvas).composite([{ input: scaled, left, top }]).png().toBuffer();
}

async function composeStrip(frameBufs, cellW, cellH) {
  const canvas = await sharp({
    create: { width: cellW * frameBufs.length, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).png().toBuffer();
  return await sharp(canvas)
    .composite(frameBufs.map((b, i) => ({ input: b, left: i * cellW, top: 0 })))
    .png().toBuffer();
}

async function pickBestFrame(sheetPng, row, cols, cellW, cellH) {
  let bestBuf = null, bestScore = -1;
  for (let col = 0; col < cols; col++) {
    const cell = await sharp(sheetPng)
      .extract({ left: col * cellW, top: row * cellH, width: cellW, height: cellH })
      .toBuffer();
    const { data } = await sharp(cell).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 32) opaque++;
    if (opaque > bestScore) { bestScore = opaque; bestBuf = cell; }
  }
  return bestBuf;
}
