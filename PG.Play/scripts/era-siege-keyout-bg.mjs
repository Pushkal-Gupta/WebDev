// Color-key the dark slate panel background out of base / mountain /
// foreground sheets that came back from Gemini with a solid background
// rather than real alpha.
//
// Algorithm:
//   1. Sample the four corner pixels.
//   2. If all four are within a similarity threshold AND dark, treat them
//      as the panel colour.
//   3. For every pixel: if its colour is within the threshold of any of
//      those corners, set alpha to 0 (with a soft 8-px feather to avoid
//      a hard edge against the silhouette).
//   4. Write back to the same path.
//
// Idempotent — re-running on already-keyed images is safe (corners
// become transparent and threshold matching produces no further change).

import sharp from 'sharp';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const OUT  = resolve(ROOT, 'public/games/era-siege');

// Distance threshold (Manhattan in RGB).
const KEY_DELTA  = 50;

async function keyout(path, opts = {}) {
  if (!existsSync(path)) { console.warn(`skip — ${path} missing`); return; }
  const img  = sharp(path);
  const meta = await img.metadata();
  const W = meta.width, H = meta.height;
  const buf = Buffer.from(await img.ensureAlpha().raw().toBuffer());

  // Sample the four corner pixels.
  const stride = W * 4;
  const sample = (x, y) => {
    const o = y * stride + x * 4;
    return [buf[o], buf[o + 1], buf[o + 2]];
  };
  const corners = [
    sample(0, 0),
    sample(W - 1, 0),
    sample(0, H - 1),
    sample(W - 1, H - 1),
  ];

  // For images whose ARTWORK is dark (mountain silhouettes, foreground),
  // we MUST NOT use a generic dark-luminance test — it'd erase the
  // silhouette itself. Only `darkLimit > 0` opts in to that path.
  const DARK_LIMIT = opts.darkLimit ?? 0;

  // Saturation-based panel test: the AI-Studio cell background is a
  // two-tone GREY checker — both cells have r ≈ g ≈ b. Real artwork is
  // saturated (banners, flags, wood). If chroma (max-min RGB) is below
  // CHROMA_LIMIT, it's panel.
  const CHROMA_LIMIT = opts.chromaLimit ?? 0;

  function isPanel(r, g, b) {
    if (CHROMA_LIMIT > 0) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Within `CHROMA_LIMIT` of greyscale → panel checker.
      if (max - min <= CHROMA_LIMIT) return true;
    }
    if (DARK_LIMIT > 0 && r < DARK_LIMIT && g < DARK_LIMIT && b < DARK_LIMIT) return true;
    for (const [cr, cg, cb] of corners) {
      const d = Math.abs(r - cr) + Math.abs(g - cg) + Math.abs(b - cb);
      if (d <= KEY_DELTA) return true;
    }
    return false;
  }

  // First pass: hard color-key.
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    if (isPanel(r, g, b)) buf[i + 3] = 0;
  }

  // Second pass: soft 1-px feather along the silhouette edge so the
  // remaining art doesn't have a hard halo from anti-aliased pixels.
  // Cheap kernel: if a pixel is opaque but ANY of its 4-neighbours is
  // transparent, halve its alpha — gives a one-pixel softening.
  const out = Buffer.from(buf);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const o = y * stride + x * 4;
      if (out[o + 3] !== 255) continue;
      const left  = buf[o - 4 + 3];
      const right = buf[o + 4 + 3];
      const up    = buf[o - stride + 3];
      const down  = buf[o + stride + 3];
      if (left === 0 || right === 0 || up === 0 || down === 0) {
        out[o + 3] = 200;       // soft edge
      }
    }
  }

  await sharp(out, { raw: { width: W, height: H, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(path);
  console.log(`✓ keyed ${path.replace(ROOT + '/', '')}`);
}

// Per-asset settings:
//   bases       — saturated artwork; chromaLimit 8 catches the grey
//                  checker, doesn't touch banners/flags/wood
//   mountains   — earth-tone silhouette has chroma ≥ 12; chromaLimit 8
//                  kills the checker without touching the silhouette
//   foreground  — varied palette per era; chromaLimit 8 is safe
for (let n = 1; n <= 5; n++) {
  await keyout(join(OUT, `base/era${n}/player.png`),         { chromaLimit: 8, darkLimit: 78 });
  await keyout(join(OUT, `base/era${n}/enemy.png`),          { chromaLimit: 8, darkLimit: 78 });
  await keyout(join(OUT, `bg/era${n}/mountains-far.png`),    { chromaLimit: 8 });
  await keyout(join(OUT, `bg/era${n}/mountains-mid.png`),    { chromaLimit: 8 });
  await keyout(join(OUT, `bg/era${n}/foreground.png`),       { chromaLimit: 8 });
}

console.log('\ndone — backgrounds keyed transparent. Hard-reload the game.');
