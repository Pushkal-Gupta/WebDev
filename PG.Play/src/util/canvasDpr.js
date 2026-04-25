// Retina-crisp canvas sizing.
//
// Two modes:
//
//   sizeCanvas(canvas, cssW, cssH)
//     Fixed-pixel canvas. The render math runs at cssW × cssH; the
//     backing buffer is dpr-scaled so it stays sharp on Retina. Inline
//     style.width / style.height are written in CSS pixels so the
//     canvas would naturally render at its intrinsic size — but the
//     platform CSS in styles.css forces canvases inside the play
//     viewport to fill 100%/100%, which means a fixed-buffer canvas
//     gets stretched to fill the screen. That trade-off is acceptable
//     for older games; modern games should use sizeCanvasFluid below.
//
//   sizeCanvasFluid(canvas, parent)
//     Reads `parent.clientWidth` / `parent.clientHeight` and resizes
//     the buffer to match exactly. Render math now runs in actual
//     pixels-as-displayed, so there is no stretching and a 4K screen
//     gets a 4K render. Returns a `dispose()` callback that disconnects
//     the ResizeObserver and the orientation listener.
//
// Both modes cap dpr at 2 — past that the GPU cost outpaces the visual
// gain on most browser games.

const CAP = 2;

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

// Fluid variant: the canvas fills its parent and re-fits on resize.
// `onResize(cssW, cssH)` fires after each fit so the game can adjust
// any layout state that depends on canvas dimensions (camera zoom,
// HUD positions, world bounds).
export function sizeCanvasFluid(canvas, parent, onResize) {
  if (!canvas || !parent) return () => {};
  const dpr = () => Math.min(window.devicePixelRatio || 1, CAP);
  const fit = () => {
    const cssW = Math.max(1, parent.clientWidth);
    const cssH = Math.max(1, parent.clientHeight);
    const r = dpr();
    canvas.width  = Math.round(cssW * r);
    canvas.height = Math.round(cssH * r);
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(r, 0, 0, r, 0, 0);
    onResize?.(cssW, cssH);
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(parent);
  const onOrient = () => fit();
  window.addEventListener('orientationchange', onOrient);
  return () => {
    try { ro.disconnect(); } catch {}
    window.removeEventListener('orientationchange', onOrient);
  };
}

export function getDpr() {
  return Math.min(window.devicePixelRatio || 1, CAP);
}
