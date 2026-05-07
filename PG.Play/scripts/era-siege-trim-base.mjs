// Trim "atmospheric base" gradient from unit PNGs.
//
// Some Gemini-generated unit assets bake a smoky/cloudy ground gradient
// at the bottom of the figure (era 4, era 5 especially). The result
// renders as a translucent rectangle attached under the unit's feet,
// breaking the illusion of the unit standing on the actual game lane.
//
// Heuristic: scan rows from bottom up. A row is "real figure" if it
// contains ≥ 12 opaque saturated pixels (alpha > 220, chr > 20). The
// LAST such row is the figure's foot line. Everything below it is base.
//
// For the bottom rows that ARE figure but mixed with base, we ADD a
// per-pixel test: drop any pixel that is low-alpha AND low-chroma
// (the atmospheric haze) without touching the figure pixels nearby.
//
// Idempotent — re-running on a clean PNG is a no-op (no base rows
// found → nothing trimmed).

import sharp from 'sharp';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const UNIT = resolve(ROOT, 'public/games/era-siege/unit');

const SATURATED_CHR  = 20;     // chr > this => "real figure colour"
const SATURATED_ALPHA = 220;   // alpha > this => "solid figure pixel"
const FIGURE_ROW_MIN = 12;     // ≥ this many saturated pixels in a row → figure row
const HAZE_ALPHA_MAX = 210;    // alpha < this AND chr < HAZE_CHR_MAX → atmospheric base
const HAZE_CHR_MAX   = 18;

async function trimUnit(filepath) {
  const meta = await sharp(filepath).metadata();
  const w = meta.width, h = meta.height;
  if (!w || !h) return { skipped: 'no metadata' };
  const buf = Buffer.from(await sharp(filepath).ensureAlpha().raw().toBuffer());
  const stride = w * 4;

  // Build per-row saturated-pixel counts.
  const rowSat = new Int32Array(h);
  let maxSat = 0;
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      const o = y * stride + x * 4;
      if (buf[o + 3] < SATURATED_ALPHA) continue;
      const r = buf[o], g = buf[o + 1], b = buf[o + 2];
      const chr = Math.max(r, g, b) - Math.min(r, g, b);
      if (chr > SATURATED_CHR) count++;
    }
    rowSat[y] = count;
    if (count > maxSat) maxSat = count;
  }
  if (maxSat === 0) return { unchanged: true };

  // Heuristic: an "atmospheric base" pattern looks like
  //   - figure rows with varying sat counts (legs, feet, gaps)
  //   - then a NARROWING (sat dips toward zero — the foot line)
  //   - then a WIDENING again (cloud rows with high sat that stays
  //     mostly flat to the bottom)
  //
  // To find the cut: scan from bottom up looking for the dip. If the
  // dip exists (a row with sat < 0.10 * maxSat, AND a wide cloud band
  // exists below it), that dip row is the foot line.
  const cloudThreshold = Math.floor(maxSat * 0.55);
  const dipThreshold   = Math.floor(maxSat * 0.10);

  // First, check if the bottom band looks "cloudy" — a sustained run
  // of rows above cloudThreshold near the bottom.
  let cloudBandTop = -1;
  let runStart = -1;
  for (let y = h - 1; y > h * 0.55; y--) {
    if (rowSat[y] >= cloudThreshold) {
      if (runStart < 0) runStart = y;
    } else if (runStart > 0) {
      // Found the top of the cloud run — but only count it if the run
      // was at least 50 px tall (otherwise it's just figure detail).
      if (runStart - y >= 50) cloudBandTop = y + 1;
      break;
    }
  }
  if (cloudBandTop < 0) return { unchanged: true };

  // Second, look for the foot dip ABOVE the cloud band (within 60 rows).
  // That's where to cut.
  let cutY = cloudBandTop;
  for (let y = cloudBandTop; y > Math.max(0, cloudBandTop - 60); y--) {
    if (rowSat[y] <= dipThreshold) {
      cutY = y;
      break;
    }
  }

  // Wipe everything from cutY downward.
  let cleared = 0;
  for (let y = cutY; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = y * stride + x * 4;
      if (buf[o + 3] === 0) continue;
      buf[o + 3] = 0;
      cleared++;
    }
  }
  const footY = cutY - 1;
  if (cleared === 0) return { unchanged: true, footY };

  // Save back. We *don't* trim alpha=0 borders here — the renderer
  // anchors to the foot pixel and a tight bbox would shift the
  // sprite up; keep the canvas size constant.
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(filepath + '.tmp');
  await sharp(filepath + '.tmp').toFile(filepath);
  await import('node:fs/promises').then((fs) => fs.unlink(filepath + '.tmp')).catch(() => {});

  return { cleared, footY, w, h };
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.png')) out.push(p);
  }
  return out;
}

(async () => {
  const files = walk(UNIT);
  console.log(`Trimming base from ${files.length} unit PNGs…`);
  let touched = 0;
  for (const f of files) {
    try {
      const r = await trimUnit(f);
      if (r.cleared > 0) {
        touched++;
        console.log(`  ✓ ${f.replace(ROOT + '/', '')}  cleared ${r.cleared}px  footY=${r.footY}/${r.h}`);
      }
    } catch (e) {
      console.error(`  ✗ ${f.replace(ROOT + '/', '')}  ${e.message}`);
    }
  }
  console.log(`\nbase-trim — ${touched} touched.`);
})();
