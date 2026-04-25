// Retina-crisp canvas sizing.
//
// Fixed-pixel canvases look blurry on Retina because their intrinsic
// buffer is smaller than the CSS area the browser scales them to. This
// helper keeps the game's render math in CSS pixels while the backing
// buffer is devicePixelRatio * CSS size.
//
// Usage:
//   const ctx = sizeCanvas(canvasRef.current, 720, 440);
//   // draw in 720x440 coordinates; the buffer is 1440x880 on a 2x screen.

const CAP = 2; // don't go beyond 2x — buffer cost > visual gain.

export function sizeCanvas(canvas, cssW, cssH) {
  if (!canvas) return null;
  const dpr = Math.min(window.devicePixelRatio || 1, CAP);
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width  = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function getDpr() {
  return Math.min(window.devicePixelRatio || 1, CAP);
}
