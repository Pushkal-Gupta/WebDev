// Era Siege — procedural placeholder draws.
//
// Used when the corresponding PNG hasn't loaded (or doesn't exist).
// Each function mirrors the post-phase-7 procedural look so the game
// still ships fully visual without a single piece of art.
//
// Functions here NEVER call the asset manifest; they're the safety
// net the manifest itself falls back to.

import { paletteFor } from '../../content/eras.js';

export function placeholderClouds(ctx, eraId, w, groundY, t) {
  const pal = paletteFor(eraId);
  ctx.save();
  ctx.globalAlpha = 0.30;
  ctx.fillStyle = pal.midMotif;
  const drift = (t * 6) % 1920;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 360) + drift) % (w + 480) - 240;
    const cy = groundY - 220 - (i % 2) * 18;
    ctx.beginPath();
    ctx.ellipse(cx,        cy,       60, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38,   cy - 8,   46, 14, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 38,   cy + 4,   38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function placeholderMountains(ctx, eraId, w, groundY, depth) {
  const pal = paletteFor(eraId);
  ctx.save();
  if (depth === 'far') {
    ctx.fillStyle = pal.mountain;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let i = 0; i <= 18; i++) {
      const x = (i / 18) * w;
      const profile = mountainProfile(eraId, i, /*depth=*/0);
      ctx.lineTo(x, groundY - 110 - profile);
    }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = pal.mountain;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let i = 0; i <= 14; i++) {
      const x = (i / 14) * w;
      const profile = mountainProfile(eraId, i, /*depth=*/1);
      ctx.lineTo(x, groundY - 60 - profile);
    }
    ctx.lineTo(w, groundY); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function mountainProfile(eraId, i, depth) {
  const baseAmp = depth === 0 ? 28 : 18;
  switch (eraId) {
    case 'ember-tribe':
      return Math.abs(Math.sin(i * 1.7)) * baseAmp + Math.sin(i * 3.1) * 8;
    case 'iron-dominion':
      return (i % 3 === 0 ? baseAmp : baseAmp * 0.45) + Math.sin(i * 0.6) * 4;
    case 'sun-foundry':
      return (i % 4 === 0 ? baseAmp + 18 : baseAmp * 0.6) + Math.sin(i * 1.1) * 5;
    case 'storm-republic':
      return (i % 5 === 0 ? baseAmp + 26 : baseAmp * 0.4) + Math.sin(i * 2.4) * 4;
    case 'void-ascendancy':
      return (i % 2 === 0 ? baseAmp + 8 : baseAmp * 0.5);
    default:
      return baseAmp;
  }
}

export function placeholderForeground(ctx, eraId, w, groundY) {
  const pal = paletteFor(eraId);
  ctx.save();
  ctx.fillStyle = pal.groundDetail;
  // Rocks
  for (let i = 0; i < 8; i++) {
    const x = (i / 8) * w + (i % 2 ? 24 : 0);
    const r = 4 + (i % 3) * 2;
    ctx.beginPath(); ctx.arc(x, groundY + 16, r, 0, Math.PI * 2); ctx.fill();
  }
  // Era-specific debris glyphs on a strip
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 14; i++) {
    const x = (i / 14) * w + 12;
    placeholderDebris(ctx, eraId, x, groundY + 8);
  }
  ctx.restore();
}

function placeholderDebris(ctx, eraId, x, y) {
  switch (eraId) {
    case 'ember-tribe':
      ctx.fillRect(x, y - 1, 5, 2);
      ctx.fillRect(x + 1, y - 4, 1, 4);
      break;
    case 'iron-dominion':
      ctx.fillRect(x, y - 8, 1.5, 8);    // pole
      ctx.fillRect(x, y - 8, 4, 3);      // banner
      break;
    case 'sun-foundry':
      ctx.fillRect(x - 2, y - 4, 4, 4);  // barrel
      break;
    case 'storm-republic':
      ctx.fillRect(x, y - 10, 1, 10);    // antenna
      break;
    case 'void-ascendancy':
      ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 3, y); ctx.lineTo(x - 3, y); ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.fillRect(x, y - 1, 3, 1);
  }
}

export function placeholderBase(ctx, eraId, x, groundY, isPlayer) {
  const pal = paletteFor(eraId);
  // Wall block (taller than original — +25% height)
  ctx.fillStyle = '#15171b';
  ctx.fillRect(x - 44, groundY - 112, 88, 112);
  // Banner stripe across the top
  ctx.fillStyle = pal.banner;
  ctx.fillRect(x - 44, groundY - 114, 88, 4);
  // Crenellations
  ctx.fillStyle = '#1f2329';
  for (let k = 0; k < 5; k++) ctx.fillRect(x - 42 + k * 18, groundY - 122, 8, 8);
  // Stone seam grid
  ctx.fillStyle = '#0a0d0e';
  for (let row = 0; row < 5; row++) ctx.fillRect(x - 44, groundY - 100 + row * 22, 88, 1);
  for (let col = 0; col < 7; col++) ctx.fillRect(x - 44 + col * 13 + (col % 2 ? 6 : 0), groundY - 100, 1, 100);
  // Archway door
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.fillRect(x - 10, groundY - 70, 20, 70);
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath();
  ctx.moveTo(x - 10, groundY - 70);
  ctx.quadraticCurveTo(x, groundY - 84, x + 10, groundY - 70);
  ctx.lineTo(x + 8, groundY - 68);
  ctx.quadraticCurveTo(x, groundY - 80, x - 8, groundY - 68);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1, groundY - 70, 2, 70);
  // Pennant pole + flag
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, groundY - 122); ctx.lineTo(x, groundY - 162); ctx.stroke();
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.beginPath();
  ctx.moveTo(x, groundY - 162);
  ctx.lineTo(x + (isPlayer ? 24 : -24), groundY - 154);
  ctx.lineTo(x, groundY - 144);
  ctx.closePath(); ctx.fill();
}

export function placeholderTurret(ctx, def, x, y, opts) {
  if (!def) return;
  const v = def.visual;
  ctx.fillStyle = v.baseColor;
  ctx.fillRect(x - 14, y, 28, 12);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 14, y + 9, 28, 3);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1.5, y - 16, 3, 16);
  ctx.fillStyle = v.barrelColor;
  switch (v.kind) {
    case 'crossbow':
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 16); ctx.lineTo(x + 16, y - 16);
      ctx.lineTo(x + 14, y - 12); ctx.lineTo(x - 14, y - 12);
      ctx.closePath(); ctx.fill();
      break;
    case 'bell':
      ctx.beginPath();
      ctx.moveTo(x - 7, y - 16); ctx.lineTo(x + 7, y - 16);
      ctx.lineTo(x + 14, y - 9);  ctx.lineTo(x - 14, y - 9);
      ctx.closePath(); ctx.fill();
      break;
    case 'cannon':
      ctx.fillRect(x - 16, y - 20, 32, 9);
      ctx.fillRect(x - 18, y - 16, 4, 9);
      break;
    case 'tesla':
      for (let k = -1; k <= 1; k++) ctx.fillRect(x + k * 7 - 1, y - 26, 2, 16);
      break;
    case 'lance':
      ctx.beginPath();
      ctx.moveTo(x - 4, y - 26); ctx.lineTo(x + 4, y - 26);
      ctx.lineTo(x + ((opts.flipX ? -26 : 26)), y - 16);
      ctx.lineTo(x - 4, y - 16);
      ctx.closePath(); ctx.fill();
      break;
    default:
      ctx.fillRect(x - 8, y - 14, 16, 6);
  }
}

export function placeholderUnit(ctx, def, x, y, _opts) {
  // The renderer's drawUnit is the visual workhorse; this is a coarse
  // fallback used only if `assets.has` is queried directly.
  const v = def.visual;
  ctx.fillStyle = v.colorBody;
  const w = v.silhouetteW;
  const h = v.silhouetteH;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = v.colorTrim;
  ctx.fillRect(x - w / 2, y - h + 3, w, 2);
}

export function placeholderProjectile(ctx, def, x, y, _opts) {
  if (def.kind === 'orb') {
    ctx.save();
    const r = def.sizePx + 1;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    grad.addColorStop(0, def.colorPrimary);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = def.colorPrimary;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

export function placeholderHitSpark(ctx, x, y) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ffe14f';
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function placeholderMuzzle(ctx, x, y, opts) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = '#ffe14f';
  const r = 4 + (opts.intensity || 0) * 3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function placeholderExplosion(ctx, x, y, r) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0,   '#ffe14f');
  grad.addColorStop(0.5, '#ff8a3a');
  grad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
