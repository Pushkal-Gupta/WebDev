#!/usr/bin/env node
// Trim each sprite to its actual content bbox, then rescale so the LONGEST
// edge equals TARGET_LONG. Result: every sprite (fruits, specials, deaths)
// renders at the same on-screen size when the runtime draws it
// natural-aspect inside a tile.

import sharp from 'sharp';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { argv } from 'node:process';

const ROOT = path.resolve('src/games/frost-fight/sprites/anim');
const TARGET_LONG = 256;
const PAD_PCT = 0.03;

const args = argv.slice(2);
const TARGETS = args.length ? args : null;

async function processFile(file) {
  const meta = await sharp(file).metadata();
  const W0 = meta.width, H0 = meta.height;
  const { data } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = W0, minY = H0, maxX = -1, maxY = -1;
  for (let y = 0; y < H0; y++) {
    for (let x = 0; x < W0; x++) {
      if (data[(y * W0 + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return false;  // empty image
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const cropped = await sharp(file).extract({ left: minX, top: minY, width: cw, height: ch }).toBuffer();

  // Scale so the longest edge = TARGET_LONG, keep aspect.
  const long = Math.max(cw, ch);
  const scale = TARGET_LONG / long;
  const sw = Math.round(cw * scale);
  const sh = Math.round(ch * scale);

  // Pad with transparent margin (PAD_PCT of the longest edge) so the bbox
  // isn't flush against the canvas edge.
  const pad = Math.round(TARGET_LONG * PAD_PCT);
  const finalW = sw + pad * 2;
  const finalH = sh + pad * 2;

  const tmp = file + '.tmp';
  await sharp(cropped)
    .resize(sw, sh, { fit: 'fill' })
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(tmp);
  await sharp(tmp).toFile(file);
  await rm(tmp).catch(() => {});
  return { from: `${W0}x${H0}`, to: `${finalW}x${finalH}` };
}

const allDirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const dirs = TARGETS ? allDirs.filter((d) => TARGETS.includes(d)) : allDirs;

for (const dir of dirs) {
  const dirPath = path.join(ROOT, dir);
  const files = (await readdir(dirPath)).filter((f) => f.endsWith('.png'));
  for (const f of files) {
    const full = path.join(dirPath, f);
    const result = await processFile(full);
    if (result) console.log(`  ${dir}/${f}  ${result.from} → ${result.to}`);
  }
}
