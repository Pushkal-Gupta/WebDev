// Era Siege — layered background renderer.
//
// Five passes, back-to-front:
//   1. sky      — gradient or PNG
//   2. clouds   — drifting silhouette band
//   3. far      — far mountain ridge
//   4. mid      — mid hills ridge with era-specific glyphs
//   5. ground   — gradient
//   6. fg       — foreground rocks/grass/debris (closer than the lane)
//
// Each layer asks `assets.draw(...)` for the matching key. With no PNGs
// loaded the manifest's placeholder path produces the (improved over
// phase 6) procedural look. Drop in PNGs and they replace per layer.

import { assets } from './assets.js';
import { paletteFor, getEraByIndex } from '../content/eras.js';

export function drawSky(ctx, view, eraIndex) {
  const eraN = (eraIndex | 0) + 1;
  assets.draw(ctx, `bg/era${eraN}/sky`, 0, 0, {
    w: view.w,
    h: view.h,
    // The painted sky image's bottom edge aligns with the horizon.
    // Fill from the top down to a hair below ground so the foreground
    // band paints over its lower edge cleanly.
    groundY: view.groundY + 18,
  });
}

export function drawClouds(ctx, view, eraIndex, t) {
  const eraN = (eraIndex | 0) + 1;
  assets.draw(ctx, `bg/era${eraN}/clouds`, 0, 0, { w: view.w, groundY: view.groundY, t });
}

export function drawFarMountains(ctx, view, eraIndex) {
  const eraN = (eraIndex | 0) + 1;
  assets.draw(ctx, `bg/era${eraN}/mountains-far`, 0, 0, { w: view.w, groundY: view.groundY });
}

export function drawMidMountains(ctx, view, eraIndex) {
  const eraN = (eraIndex | 0) + 1;
  assets.draw(ctx, `bg/era${eraN}/mountains-mid`, 0, 0, { w: view.w, groundY: view.groundY });
}

export function drawGround(ctx, view, eraIndex) {
  const eraId = getEraByIndex(eraIndex).id;
  const pal = paletteFor(eraId);
  // Gradient ground band — keeps the under-sky transition crisp.
  const g = ctx.createLinearGradient(0, view.groundY, 0, view.h);
  g.addColorStop(0, pal.ground);
  g.addColorStop(1, pal.groundDetail);
  ctx.fillStyle = g;
  ctx.fillRect(0, view.groundY, view.w, view.h - view.groundY);
  // Battle line
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, view.groundY - 1, view.w, 1);
}

export function drawForeground(ctx, view, eraIndex) {
  const eraN = (eraIndex | 0) + 1;
  assets.draw(ctx, `bg/era${eraN}/foreground`, 0, 0, { w: view.w, groundY: view.groundY });
}
