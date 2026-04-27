// Process VFX assets (currently sourced from OpenGameArt — CC0).
//
// Inputs (all in assets/era-seige/):
//   muzzle_flash_oga.png   — 4 frames × 128×128, white-on-black (no alpha)
//   spark_oga.png          — 9 frames × 32×32, transparent
//   explosion_sheet.png    — 12 frames × 96×96, transparent (already
//                            wired at vfx/explosion-12 in phase 7)
//
// Outputs (in public/games/era-siege/vfx/):
//   muzzle-flash.png  — 4×128×128, black→transparent + tinted ember
//   hit-spark.png     — 9×32×32 — kept as-is (already transparent)
//
// Provenance — both originals are CC0 from OpenGameArt; see
// docs/CREDITS.md for the per-asset record.

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const SRC  = resolve(ROOT, 'assets/era-seige');
const DEST = resolve(ROOT, 'public/games/era-siege/vfx');
mkdirSync(DEST, { recursive: true });

// ── muzzle_flash_oga.png → vfx/muzzle-flash.png ───────────────────────
//
// Strategy: source is white stars on black. Treat black as the alpha
// channel (darker → more transparent), and recolor to a soft ember
// hue so it reads on the dark battlefield without looking "stamped on".
const mfSrc = join(SRC, 'muzzle_flash_oga.png');
if (existsSync(mfSrc)) {
  const meta = await sharp(mfSrc).metadata();
  const W = meta.width, H = meta.height;
  // Pull raw RGBA from a forced 4-channel pipeline; we fabricate alpha
  // from luminance (black → 0, white → 255) and tint with ember.
  const raw = await sharp(mfSrc).ensureAlpha().raw().toBuffer();
  const out = Buffer.alloc(raw.length);
  for (let i = 0; i < raw.length; i += 4) {
    const r = raw[i], g = raw[i + 1], b = raw[i + 2];
    const lum = (r * 0.299 + g * 0.587 + b * 0.114) | 0;  // 0..255
    // Tint: ember-yellow core (#ffe14f) blended toward orange at edges.
    out[i]     = Math.min(255, lum + 6);                       // R
    out[i + 1] = Math.min(255, (lum * 0.92) | 0);              // G
    out[i + 2] = Math.min(255, (lum * 0.42) | 0);              // B
    out[i + 3] = lum;                                          // A from luminance
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(join(DEST, 'muzzle-flash.png'));
  console.log(`✓ vfx/muzzle-flash.png ← muzzle_flash_oga.png (black→alpha, tinted)`);
} else {
  console.warn('skip muzzle_flash_oga.png — missing');
}

// ── spark_oga.png → vfx/hit-spark.png ─────────────────────────────────
const spSrc = join(SRC, 'spark_oga.png');
if (existsSync(spSrc)) {
  await sharp(spSrc).png({ compressionLevel: 9 }).toFile(join(DEST, 'hit-spark.png'));
  console.log(`✓ vfx/hit-spark.png ← spark_oga.png (passthrough)`);
} else {
  console.warn('skip spark_oga.png — missing');
}

console.log('\ndone — restart the dev server (or hard-reload).');
