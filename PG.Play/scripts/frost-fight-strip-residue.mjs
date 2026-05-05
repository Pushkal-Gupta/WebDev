#!/usr/bin/env node
// Strip residual gray smudge / floating debris around extracted character frames.
// Strategy: find the LARGEST saturated connected component (the main character blob),
// then transparent-out every pixel whose alpha > 0 but isn't part of that component
// (within a small dilation tolerance to keep antialiased edges).

import sharp from 'sharp';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

const ROOT = path.resolve('src/games/frost-fight/sprites/anim');

// Two-mode operation: default uses saturation to find "character body" pixels;
// `--checker` mode treats anything that's NOT near-neutral light gray as body
// (used for low-saturation characters like wax candles or wooden chests where
//  the checker pattern is light gray squares).
const args = argv.slice(2);
const CHECKER_MODE = args.includes('--checker');
const TARGETS = args.filter((a) => !a.startsWith('--'));

if (!TARGETS.length) {
  console.error('Usage: node frost-fight-strip-residue.mjs [--checker] <atlas-dir> [...]');
  process.exit(1);
}

const SAT_MIN_FOR_BODY = 0.30;   // pixels with sat above this are "character body"
const VAL_MIN_FOR_BODY = 0.20;
const DILATE_PX = 4;             // keep antialiased edge halo

// Checker-mode body detection: a pixel is "body" if it does NOT look like a
// light-gray or near-white checker tile (low saturation + high value + R≈G≈B).
function isCheckerColor(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const range = max - min;
  // Light gray / white: high V, low chroma. Higher range tolerance catches
  // antialiased checker borders.
  return max >= 170 && range <= 28;
}

function rgbToHsv(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  return { s: max === 0 ? 0 : d / max, v: max };
}

async function process(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const buf = Buffer.from(data);
  const N = W * H;

  // 1) Build "body" mask
  const body = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const i = p * 4;
    if (buf[i + 3] < 32) continue;
    if (CHECKER_MODE) {
      if (!isCheckerColor(buf[i], buf[i + 1], buf[i + 2])) body[p] = 1;
    } else {
      const { s, v } = rgbToHsv(buf[i], buf[i + 1], buf[i + 2]);
      if (s >= SAT_MIN_FOR_BODY && v >= VAL_MIN_FOR_BODY) body[p] = 1;
    }
  }

  // In checker mode, erode the body mask by 2 pixels to break thin antialiased
  // bridges that fuse the main character into a single component with debris.
  if (CHECKER_MODE) {
    for (let pass = 0; pass < 2; pass++) {
      const next = new Uint8Array(body);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const p = y * W + x;
          if (!body[p]) continue;
          if ((x === 0 || !body[p - 1]) ||
              (x === W - 1 || !body[p + 1]) ||
              (y === 0 || !body[p - W]) ||
              (y === H - 1 || !body[p + W])) {
            next[p] = 0;
          }
        }
      }
      body.set(next);
    }
  }

  // 2) Label all body components, track areas
  const label = new Int32Array(N);
  const areas = [0];
  let curLabel = 0;
  for (let p = 0; p < N; p++) {
    if (!body[p] || label[p]) continue;
    curLabel++;
    let area = 0;
    const stack = [p];
    label[p] = curLabel;
    while (stack.length) {
      const q = stack.pop();
      area++;
      const x = q % W, y = (q - x) / W;
      const ns = [];
      if (x > 0)     ns.push(q - 1);
      if (x < W - 1) ns.push(q + 1);
      if (y > 0)     ns.push(q - W);
      if (y < H - 1) ns.push(q + W);
      for (const nq of ns) {
        if (body[nq] && !label[nq]) {
          label[nq] = curLabel;
          stack.push(nq);
        }
      }
    }
    areas[curLabel] = area;
  }

  let bestArea = 0;
  for (const a of areas) if (a > bestArea) bestArea = a;
  if (!bestArea) {
    console.log('  skip', path.basename(file), '(no saturated body found)');
    return;
  }

  // 3) Keep components that pass the size threshold. In checker mode, be strict
  //    (only large blobs survive — single-color characters like candles have one
  //    body and small noise should be killed). In default mode, accept more
  //    secondary blobs (leaves, accessory parts).
  const minPct = CHECKER_MODE ? 0.20 : 0.08;
  const MIN_KEEP = Math.max(40, bestArea * minPct);
  const keep = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (label[p] && areas[label[p]] >= MIN_KEEP) keep[p] = 1;
  }

  const dilatePx = CHECKER_MODE ? 0 : DILATE_PX;
  for (let pass = 0; pass < dilatePx; pass++) {
    const next = new Uint8Array(keep);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (next[p]) continue;
        if ((x > 0 && keep[p - 1]) ||
            (x < W - 1 && keep[p + 1]) ||
            (y > 0 && keep[p - W]) ||
            (y < H - 1 && keep[p + W])) {
          next[p] = 1;
        }
      }
    }
    keep.set(next);
  }

  // 4a) In checker mode, compute the bbox of the LARGEST body component plus a
  //     small margin and kill alpha for every pixel outside that bbox. This
  //     handles low-saturation characters (candles, chests) where the source
  //     sheet has decorative debris near the character that survives all the
  //     other heuristics.
  if (CHECKER_MODE) {
    let bestLabel = 0, bestArea = 0;
    for (let i = 1; i < areas.length; i++) {
      if (areas[i] > bestArea) { bestArea = areas[i]; bestLabel = i; }
    }
    let minX = W, minY = H, maxX = -1, maxY = -1;
    for (let p = 0; p < N; p++) {
      if (label[p] === bestLabel) {
        const x = p % W, y = (p - x) / W;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const margin = 4;
    minX = Math.max(0, minX - margin);
    minY = Math.max(0, minY - margin);
    maxX = Math.min(W - 1, maxX + margin);
    maxY = Math.min(H - 1, maxY + margin);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (x < minX || x > maxX || y < minY || y > maxY) {
          buf[(y * W + x) * 4 + 3] = 0;
        }
      }
    }
    // Final pass inside bbox: kill any pixel still hitting the checker palette.
    for (let p = 0; p < N; p++) {
      const i = p * 4;
      if (buf[i + 3] === 0) continue;
      if (isCheckerColor(buf[i], buf[i + 1], buf[i + 2])) buf[i + 3] = 0;
    }
    const tmp = file + '.tmp';
    await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .png()
      .toFile(tmp);
    await sharp(tmp).toFile(file);
    await rm(tmp).catch(() => {});
    return;
  }

  // 4) Flood-fill from border through non-keep pixels — only those reachable
  //    from outside count as exterior. Interior holes (eye pupils, mouth, etc.)
  //    stay intact even though they're not in keep.
  const exterior = new Uint8Array(N);
  const stack2 = [];
  for (let x = 0; x < W; x++) {
    if (!keep[x]) { exterior[x] = 1; stack2.push(x); }
    const b = (H - 1) * W + x;
    if (!keep[b]) { exterior[b] = 1; stack2.push(b); }
  }
  for (let y = 0; y < H; y++) {
    const l = y * W;
    if (!keep[l]) { exterior[l] = 1; stack2.push(l); }
    const r = y * W + (W - 1);
    if (!keep[r]) { exterior[r] = 1; stack2.push(r); }
  }
  while (stack2.length) {
    const q = stack2.pop();
    const x = q % W, y = (q - x) / W;
    const ns = [];
    if (x > 0)     ns.push(q - 1);
    if (x < W - 1) ns.push(q + 1);
    if (y > 0)     ns.push(q - W);
    if (y < H - 1) ns.push(q + W);
    for (const nq of ns) {
      if (!exterior[nq] && !keep[nq]) {
        exterior[nq] = 1;
        stack2.push(nq);
      }
    }
  }

  // 5) Zero alpha only for pixels reachable from outside (true exterior smudge)
  for (let p = 0; p < N; p++) {
    if (exterior[p]) {
      const i = p * 4;
      buf[i + 3] = 0;
    }
  }

  const tmp = file + '.tmp';
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(tmp);
  await sharp(tmp).toFile(file);
  await rm(tmp).catch(() => {});
}

for (const tgt of TARGETS) {
  const dir = path.join(ROOT, tgt);
  const files = (await readdir(dir)).filter((f) => f.endsWith('.png'));
  for (const f of files) {
    const full = path.join(dir, f);
    await process(full);
    console.log('  cleaned', tgt + '/' + f);
  }
}
