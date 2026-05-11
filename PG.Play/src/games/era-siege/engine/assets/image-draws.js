// Era Siege — image-draw variants for the asset manifest.
//
// Each function below is invoked by the manifest when a registered
// asset's PNG has been decoded. They differ from the default `drawImage`
// because each asset class has its own placement contract:
//
//   sky          — cover (0,0)→(view.w, view.groundY)
//   clouds       — middle-row of a 1×3 sheet, drift with t, tile horizontally
//   mountain     — bottom-anchored to groundY, stretch to view.w
//   foreground   — bottom-anchored to view.h, max 200px tall
//   base         — foot-anchored, fixed target height
//   projectile   — rotate to velocity vector
//   spark/muzzle/explosion — frame-based blits from horizontal sheets

// ── Sprite strip blit ────────────────────────────────────────────────
//
// Horizontal animation strip — opts.frame picks a cell from a
// 6-frame strip authored at `cellW = img.naturalWidth / opts.frames`.
// Used for unit walk/attack/idle animation. Foot-anchored by default
// because units are baked with their foot at the cell's bottom band.
export function drawStripFrame(ctx, img, x, y, opts = {}) {
  if (!img.naturalWidth) return;
  const frames = opts.frames || 6;
  const frameIdx = Math.max(0, Math.min(frames - 1, Math.floor(opts.frame || 0)));
  const sw = img.naturalWidth / frames;
  const sh = img.naturalHeight;
  const sx = frameIdx * sw;
  const w = opts.w || sw / 2;
  const h = opts.h || sh / 2;
  const ax = w / 2;
  const ay = opts.anchor === 'foot' ? h : h / 2;
  const flip = opts.flipX ? -1 : 1;
  if (flip < 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, sx, 0, sw, sh, -ax, -ay, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, sx, 0, sw, sh, x - ax, y - ay, w, h);
  }
}

// ── Default blit — used when no specific imageDraw is registered ──────
//
// Authoring rule: source images are 2× target size for HiDPI; we
// downscale here unless `opts.w` / `opts.h` override.

export function drawImage(ctx, img, x, y, opts = {}) {
  if (!img.naturalWidth) return;
  const w = opts.w || img.naturalWidth / 2;
  const h = opts.h || img.naturalHeight / 2;
  // Both anchor modes centre horizontally — the only difference is
  // vertical: 'foot' puts the foot at (x, y); the default puts the
  // image centre at (x, y).
  const ax = w / 2;
  const ay = opts.anchor === 'foot' ? h : h / 2;
  const flip = opts.flipX ? -1 : 1;
  if (flip < 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -ax, -ay, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, x - ax, y - ay, w, h);
  }
}

// ── Sky ──────────────────────────────────────────────────────────────
export function drawSkyImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const w = opts.w || img.naturalWidth / 2;
  const h = opts.groundY || (opts.h || img.naturalHeight / 2);
  ctx.drawImage(img, 0, 0, w, h);
}

// ── Clouds ───────────────────────────────────────────────────────────
//
// Source images are 3-row sheets; we extract the middle row (the most
// varied silhouette) and tile it horizontally with a `t * 6` drift.
export function drawCloudImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const W = opts.w || 1920;
  const groundY = opts.groundY || 600;

  const sheetH = img.naturalHeight;
  const frameH = sheetH / 3;
  const sx = 0;
  const sy = frameH;
  const sw = img.naturalWidth;
  const sh = frameH;

  const stripH = Math.min(sh / 2, groundY * 0.42);
  const stripY = groundY - stripH - 6;
  const tileW  = Math.round(sw / 2);
  const drift  = ((opts.t || 0) * 6) % tileW;

  for (let tx = -drift; tx < W + tileW; tx += tileW) {
    ctx.drawImage(img, sx, sy, sw, sh, tx, stripY, tileW, stripH);
  }
}

// ── Mountains ────────────────────────────────────────────────────────
//
// Stretches to view.w, bottom-anchored to groundY so the silhouette
// horizon-locks regardless of viewport size.
export function drawMountainImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const W = opts.w || 1920;
  const groundY = opts.groundY || 600;
  const dh = Math.round(img.naturalHeight * (W / img.naturalWidth));
  const dy = groundY - dh;
  ctx.drawImage(img, 0, dy, W, dh);
}

// ── Foreground ───────────────────────────────────────────────────────
export function drawForegroundImage(ctx, img, _x, _y, opts) {
  if (!img.naturalWidth) return;
  const W = opts.w || 1920;
  const groundY = opts.groundY || 600;
  const intrinsicAspect = img.naturalHeight / img.naturalWidth;
  const dh = Math.min(Math.round(W * intrinsicAspect), 200);
  const viewH = (opts.h || groundY + 200);
  const dy = viewH - dh;
  ctx.drawImage(img, 0, dy, W, dh);
}

// ── Bases ────────────────────────────────────────────────────────────
export function drawBaseImage(ctx, img, x, y, opts) {
  if (!img.naturalWidth) return;
  const targetH = opts.h || 220;
  const aspect = img.naturalWidth / img.naturalHeight;
  const targetW = Math.round(targetH * aspect);
  const flip = !!opts.flipX;
  if (flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, -targetW / 2, -targetH, targetW, targetH);
    ctx.restore();
  } else {
    ctx.drawImage(img, x - targetW / 2, y - targetH, targetW, targetH);
  }
}

// ── Projectiles ──────────────────────────────────────────────────────
export function drawProjectileImage(ctx, img, x, y, opts) {
  if (!img.naturalWidth) return;
  const targetH = opts.size || 18;
  const aspect = img.naturalWidth / img.naturalHeight;
  const targetW = Math.round(targetH * aspect);
  const angle = opts.angle || 0;
  ctx.save();
  ctx.translate(x, y);
  if (angle) ctx.rotate(angle);
  ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();
}

// ── 9-frame hit-spark strip (288×32) ─────────────────────────────────
export function drawSpark9(ctx, img, x, y, opts) {
  if (!img.naturalWidth) return;
  const FRAMES = 9;
  const sw = Math.floor(img.naturalWidth / FRAMES);
  const sh = img.naturalHeight;
  const frame = Math.max(0, Math.min(FRAMES - 1, opts.frame | 0));
  const size = opts.size || 28;
  ctx.drawImage(img, frame * sw, 0, sw, sh, x - size / 2, y - size / 2, size, size);
}

// ── 4-frame muzzle-flash strip (512×128) ─────────────────────────────
export function drawMuzzle4(ctx, img, x, y, opts) {
  if (!img.naturalWidth) return;
  const FRAMES = 4;
  const sw = Math.floor(img.naturalWidth / FRAMES);
  const sh = img.naturalHeight;
  const frame = Math.max(0, Math.min(FRAMES - 1, opts.frame | 0));
  const size = opts.size || 32;
  ctx.drawImage(img, frame * sw, 0, sw, sh, x - size / 2, y - size / 2, size, size);
}

// ── 12-frame painted explosion strip (1152×96) ───────────────────────
export function drawExplosion12(ctx, img, x, y, opts) {
  if (!img.naturalWidth) return;
  const FRAMES = 12;
  const sw = Math.floor(img.naturalWidth / FRAMES);
  const sh = img.naturalHeight;
  const frame = Math.max(0, Math.min(FRAMES - 1, opts.frame | 0));
  const dw = (opts.size || 96);
  const dh = (opts.size || 96);
  ctx.drawImage(img, sx_for(frame, sw), 0, sw, sh, x - dw / 2, y - dh / 2, dw, dh);
}

function sx_for(frame, sw) { return frame * sw; }
