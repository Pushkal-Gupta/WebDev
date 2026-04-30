// Verify the flood-fill keyout worked.
//
// For each painted asset, read its alpha channel and report:
//   transparentRatio — fraction of pixels at alpha=0 (should be 0.5–0.9)
//   edgeOpaqueRatio  — fraction of edge-band pixels still opaque (low is good)
//   interiorAlpha    — average alpha of the centre 50% of the image
//
// Flags any image where:
//   * transparentRatio < 0.10  → flood fill probably failed (still opaque)
//   * transparentRatio > 0.95  → over-aggressive, likely ate the silhouette
//   * edgeOpaqueRatio  > 0.05  → checker survived along the edge
//
// Output: a table of suspects sorted worst-first. Anything not flagged is
// considered "looks fine, no inspection needed".

import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname || new URL('.', import.meta.url).pathname, '..');
const OUT  = resolve(ROOT, 'public/games/era-siege');

const TARGETS = [];
for (let n = 1; n <= 5; n++) {
  TARGETS.push(join(OUT, `base/era${n}/player.png`));
  TARGETS.push(join(OUT, `base/era${n}/enemy.png`));
  for (const role of ['frontline', 'ranged', 'heavy']) {
    TARGETS.push(join(OUT, `unit/era${n}/${role}.png`));
  }
  TARGETS.push(join(OUT, `turret/era${n}.png`));
  TARGETS.push(join(OUT, `turret/era${n}-fire.png`));
  TARGETS.push(join(OUT, `turret/era${n}-recoil.png`));
  TARGETS.push(join(OUT, `bg/era${n}/mountains-far.png`));
  TARGETS.push(join(OUT, `bg/era${n}/mountains-mid.png`));
  TARGETS.push(join(OUT, `bg/era${n}/foreground.png`));
}

const reports = [];
for (const path of TARGETS) {
  if (!existsSync(path)) {
    reports.push({ path, status: 'MISSING' });
    continue;
  }
  const meta = await sharp(path).metadata();
  const W = meta.width, H = meta.height;
  const buf = await sharp(path).ensureAlpha().raw().toBuffer();

  let transparent = 0, total = W * H;
  let edgeOpaque = 0, edgeTotal = 0;
  let interiorAlphaSum = 0, interiorCount = 0;

  const edgeBand = Math.max(2, Math.round(Math.min(W, H) * 0.02));
  const inX0 = Math.round(W * 0.25), inX1 = Math.round(W * 0.75);
  const inY0 = Math.round(H * 0.25), inY1 = Math.round(H * 0.75);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = buf[(y * W + x) * 4 + 3];
      if (a === 0) transparent++;
      const onEdge = x < edgeBand || x >= W - edgeBand || y < edgeBand || y >= H - edgeBand;
      if (onEdge) {
        edgeTotal++;
        if (a > 200) edgeOpaque++;
      }
      if (x >= inX0 && x < inX1 && y >= inY0 && y < inY1) {
        interiorAlphaSum += a;
        interiorCount++;
      }
    }
  }

  const tr = transparent / total;
  const er = edgeOpaque / edgeTotal;
  const ia = interiorAlphaSum / interiorCount;

  const flags = [];
  if (tr < 0.10) flags.push('LOW_TRANSPARENT');
  if (tr > 0.95) flags.push('OVER_AGGRESSIVE');
  if (er > 0.05) flags.push('EDGE_RESIDUE');
  if (ia < 60)   flags.push('INTERIOR_THIN');

  reports.push({ path, W, H, tr, er, ia, flags });
}

reports.sort((a, b) => (b.flags?.length || 0) - (a.flags?.length || 0));

const rel = (p) => p.replace(ROOT + '/', '');
console.log('path                                                       size   tr     er     ia    flags');
console.log('---------------------------------------------------------- ------ ------ ------ ----- -----');
for (const r of reports) {
  if (r.status === 'MISSING') {
    console.log(`${rel(r.path).padEnd(58)} MISSING`);
    continue;
  }
  const tr = r.tr.toFixed(3), er = r.er.toFixed(3), ia = r.ia.toFixed(0);
  console.log(`${rel(r.path).padEnd(58)} ${`${r.W}x${r.H}`.padEnd(6)} ${tr}  ${er}  ${ia.padStart(3)}   ${r.flags.join(' ')}`);
}

const flagged = reports.filter((r) => r.flags && r.flags.length).length;
const ok = reports.filter((r) => r.flags && !r.flags.length).length;
console.log(`\n${ok} ok, ${flagged} flagged, ${reports.length - ok - flagged} missing`);
