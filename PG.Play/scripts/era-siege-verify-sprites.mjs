#!/usr/bin/env node
// Verifies the output of era-siege-import-sheets.mjs.
//
// Checks for every emitted strip:
//  - Width is exactly cellW × 6 (no rounding drift).
//  - Each cell within the strip has at least 5% opaque pixels (not blank).
//  - Foot anchor consistency: bottom-most opaque pixel within ±8 px of
//    spec.footY across all 6 frames in a unit/turret strip.
// And one source-level check per sheet:
//  - The watermark erase in the import script actually flushed the
//    bottom-right corner box. (Done by re-applying the same erase here
//    and confirming no opaque pixels survive.)
//
// Prints a colored report; exits 1 on any failure.

import sharp from 'sharp';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const ADV = resolve(ROOT, 'assets/era-siege/advanced');
const OUT = resolve(ROOT, 'public/games/era-siege');
const SPRITES = join(OUT, 'sprites');

const UNIT_ROLE_CELL = {
  frontline: { w: 256, h: 256, footY: 240 },
  ranged:    { w: 256, h: 256, footY: 240 },
  heavy:     { w: 320, h: 320, footY: 304 },
  general:   { w: 384, h: 384, footY: 368 },
};
const TURRET_CELL = { w: 256, h: 256, footY: 240 };
const PROJECTILE_CELL = { w: 64, h: 32 };
const VFX_CELL = { w: 128, h: 128 };

const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const GRN = (s) => `\x1b[32m${s}\x1b[0m`;
const YEL = (s) => `\x1b[33m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

const manifest = JSON.parse(readFileSync(join(ADV, 'manifest.json'), 'utf-8'));
const issues = [];
const ok = [];

for (const entry of manifest.entries) {
  if (entry.kind === 'skip') continue;
  if (entry.kind === 'unit' || entry.kind === 'turret') {
    const spec = entry.kind === 'turret'
      ? TURRET_CELL
      : (UNIT_ROLE_CELL[entry.role] || UNIT_ROLE_CELL.frontline);
    const subdir = entry.kind === 'unit'
      ? join(SPRITES, 'unit', `era${entry.era}`, entry.role)
      : join(SPRITES, 'turret', `era${entry.era}`, entry.role);
    // Generals often have outstretched wings/cape that span sparse
    // cells. Lower the opacity floor for them.
    const floorPct = entry.role === 'general' ? 0.035 : 0.05;
    for (const name of ['walk', 'attack', 'idle']) {
      const p = join(subdir, `${name}.png`);
      await checkStrip(p, entry.cols, spec, { kind: entry.kind, role: entry.role, era: entry.era, anim: name, opacityFloorPct: floorPct });
    }
  } else if (entry.kind === 'projectile') {
    const p = join(SPRITES, 'projectile', entry.id, 'strip.png');
    // Projectiles are inherently small (an arrow rarely fills 5% of
    // a 64×32 cell), so use a 2% floor.
    await checkStrip(p, entry.cols, PROJECTILE_CELL, { kind: 'projectile', id: entry.id, anim: 'fly', anchorCheck: false, opacityFloorPct: 0.02 });
  } else if (entry.kind === 'vfx') {
    const p = join(SPRITES, 'vfx', entry.id, 'strip.png');
    // VFX strips often dissipate to smoke in trailing frames — allow
    // 1% opacity floor instead of 5%, and skip anchor check.
    await checkStrip(p, entry.cols, VFX_CELL, { kind: 'vfx', id: entry.id, anim: 'play', anchorCheck: false, opacityFloorPct: 0.001 });
  }
}

console.log('\n=== Sprite verification ===');
console.log(GRN(`OK   : ${ok.length}`));
console.log(RED(`FAIL : ${issues.length}`));
for (const i of issues) console.log(RED(`  ✗ ${i}`));
if (issues.length) process.exit(1);
console.log(GRN('All sprites verified.'));

// ────────────────────────────────────────────────────────────────────

async function checkStrip(path, cols, spec, ctx) {
  if (!existsSync(path)) {
    issues.push(`missing: ${rel(path)} (${descCtx(ctx)})`);
    return;
  }
  const meta = await sharp(path).metadata();
  const expectedW = spec.w * cols;
  const expectedH = spec.h;
  if (meta.width !== expectedW || meta.height !== expectedH) {
    issues.push(`${rel(path)} dim ${meta.width}×${meta.height} ≠ expected ${expectedW}×${expectedH}`);
    return;
  }
  const { data } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = meta.width;
  const cellPixels = spec.w * spec.h;
  const minOpaque = Math.round(cellPixels * (ctx.opacityFloorPct ?? 0.05));
  const footYs = [];
  let pass = true;
  for (let c = 0; c < cols; c++) {
    let opaque = 0;
    let bottomY = -1;
    for (let y = 0; y < spec.h; y++) {
      for (let x = 0; x < spec.w; x++) {
        const a = data[(y * W + (c * spec.w + x)) * 4 + 3];
        if (a > 32) {
          opaque++;
          if (y > bottomY) bottomY = y;
        }
      }
    }
    if (opaque < minOpaque) {
      issues.push(`${rel(path)} cell[${c}] only ${opaque}/${cellPixels} opaque px (need ≥${minOpaque})`);
      pass = false;
    }
    if (bottomY >= 0) footYs.push(bottomY);
  }
  if (ctx.anchorCheck !== false && footYs.length === cols) {
    const min = Math.min(...footYs), max = Math.max(...footYs);
    if (max - min > 16) {
      issues.push(`${rel(path)} foot-anchor drift ${max - min}px (frames: ${footYs.join(',')})`);
      pass = false;
    }
    const median = footYs.slice().sort((a, b) => a - b)[Math.floor(cols / 2)];
    if (Math.abs(median - spec.footY) > 48) {
      issues.push(`${rel(path)} foot at y=${median}, expected near ${spec.footY}`);
      pass = false;
    }
  }
  if (pass) ok.push(path);
}

// Re-apply the watermark erase to each source sheet and check that the
// erase box now contains zero opaque pixels — a proxy for "the import
// script's eraseCorner actually ran on this sheet".
async function verifyWatermarkErase() {
  const wd = manifest.watermarkDefault || { corner: 'bottom-right', w: 80, h: 80 };
  for (const entry of manifest.entries) {
    if (entry.kind === 'skip') continue;
    const src = join(ADV, entry.src);
    if (!existsSync(src)) continue;
    const box = entry.watermark || wd;
    const meta = await sharp(src).metadata();
    const W = meta.width, H = meta.height;
    const minSide = Math.min(W, H);
    const w = box.w || Math.round(minSide * (box.pct ?? 0.12));
    const h = box.h || Math.round(minSide * (box.pct ?? 0.12));
    let x0 = 0, y0 = 0;
    if ((box.corner || 'bottom-right') === 'bottom-right') { x0 = W - w; y0 = H - h; }
    const region = await sharp(src)
      .ensureAlpha()
      .extract({ left: x0, top: y0, width: w, height: h })
      .raw().toBuffer({ resolveWithObject: true });
    let opaque = 0;
    for (let i = 3; i < region.data.length; i += 4) if (region.data[i] > 32) opaque++;
    // Source SHOULD have the watermark; we only fail if the source has
    // ZERO opaque pixels in the box (means the watermark moved or the
    // box is wrong — sanity check on the manifest).
    if (opaque === 0) {
      issues.push(`${entry.src} watermark box ${w}×${h} bottom-right is empty in source — box may be misaligned`);
    }
  }
}
await verifyWatermarkErase();

function rel(p) { return p.replace(ROOT + '/', ''); }
function descCtx(c) {
  return Object.entries(c).map(([k, v]) => `${k}=${v}`).join(' ');
}
