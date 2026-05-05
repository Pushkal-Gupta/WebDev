// Era Siege — layered background renderer.
//
// Five passes, back-to-front:
//   1. sky      — gradient or PNG (no parallax — sky is "infinite")
//   2. clouds   — drifting silhouette band
//   3. far      — far mountain ridge (slow parallax)
//   4. mid      — mid hills ridge (medium parallax)
//   5. ground   — gradient
//   6. fg       — foreground rocks/grass/debris (fast parallax — closer
//                  to the camera so it scrolls more per unit of motion)
//
// Each layer asks `assets.draw(...)` for the matching key. With no PNGs
// loaded the manifest's placeholder path produces the procedural look.
// Drop in PNGs and they replace per layer.
//
// Parallax model — each layer has a horizontal scroll factor. The sim's
// `match.timeSec` plus the recent screen-shake displacement combine
// into a per-layer X offset. We translate the canvas before drawing
// the layer (and restore after), so neither sim nor renderer needs to
// know parallax is happening on the asset side.
//
// Idle drift: a slow horizontal offset based on `timeSec` so the bg
// layers feel alive even when the lane is quiet. Drift speeds:
//   far: -2 px/s   (very slow leftward drift, "atmospheric")
//   mid: -5 px/s   (mid-tempo)
//   fg : -10 px/s  (closer object → faster apparent motion)
//
// Shake response: when the screen shakes, the closer the layer the
// more it shakes (parallax-aware shake). Far layer barely moves;
// foreground takes the full shake hit.

import { assets } from './assets.js';
import { paletteFor, getEraByIndex } from '../content/eras.js';

const PARALLAX_DRIFT_PX_PER_SEC = { far: -2, mid: -5, fg: -10, clouds: -6 };
const PARALLAX_SHAKE_FACTOR     = { far: 0.10, mid: 0.30, fg: 0.85, clouds: 0.20 };

function offsetForLayer(layer, view, timeSec, shakeX = 0) {
  const drift = (PARALLAX_DRIFT_PX_PER_SEC[layer] || 0) * (timeSec || 0);
  const shake = (PARALLAX_SHAKE_FACTOR[layer] || 0) * shakeX;
  // Wrap the drift to view width so the bg image doesn't "run out" —
  // we draw it twice (offset + offset+W) when the offset is non-zero
  // so the seam is invisible.
  const w = view.w || 1;
  const wrapped = ((drift % w) + w) % w - w;
  return wrapped + shake;
}

function drawTiledLayer(ctx, key, view, opts, dx) {
  // Always draw the layer twice — at dx and dx+view.w — so the wrap is
  // seamless when the drift causes one copy to slide off-screen.
  ctx.save();
  ctx.translate(dx, 0);
  assets.draw(ctx, key, 0, 0, opts);
  ctx.restore();
  ctx.save();
  ctx.translate(dx + view.w, 0);
  assets.draw(ctx, key, 0, 0, opts);
  ctx.restore();
}

export function drawSky(ctx, view, eraIndex) {
  const eraN = (eraIndex | 0) + 1;
  // Sky is "infinite" — no parallax needed; gradient or full-cover image.
  assets.draw(ctx, `bg/era${eraN}/sky`, 0, 0, {
    w: view.w,
    h: view.h,
    groundY: view.groundY + 18,
  });
}

export function drawClouds(ctx, view, eraIndex, t) {
  const eraN = (eraIndex | 0) + 1;
  // Clouds already drift via the procedural placeholder using `t`. For
  // the painted image case, shift X based on time at the cloud rate.
  const dx = offsetForLayer('clouds', view, t || 0, 0);
  drawTiledLayer(ctx, `bg/era${eraN}/clouds`, view, { w: view.w, groundY: view.groundY, t }, dx);
}

export function drawFarMountains(ctx, view, eraIndex, t = 0, shakeX = 0) {
  const eraN = (eraIndex | 0) + 1;
  const dx = offsetForLayer('far', view, t, shakeX);
  drawTiledLayer(ctx, `bg/era${eraN}/mountains-far`, view, { w: view.w, groundY: view.groundY }, dx);
}

export function drawMidMountains(ctx, view, eraIndex, t = 0, shakeX = 0) {
  const eraN = (eraIndex | 0) + 1;
  const dx = offsetForLayer('mid', view, t, shakeX);
  drawTiledLayer(ctx, `bg/era${eraN}/mountains-mid`, view, { w: view.w, groundY: view.groundY }, dx);
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

export function drawForeground(ctx, view, eraIndex, t = 0, shakeX = 0) {
  const eraN = (eraIndex | 0) + 1;
  const dx = offsetForLayer('fg', view, t, shakeX);
  drawTiledLayer(ctx, `bg/era${eraN}/foreground`, view, { w: view.w, groundY: view.groundY }, dx);
}
