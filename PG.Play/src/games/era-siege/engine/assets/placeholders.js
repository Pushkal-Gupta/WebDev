// Era Siege — procedural placeholder draws.
//
// These are not "fallback" art any more — they ARE the art. The Gemini
// reference sheets baked transparency-checker pixels into the silhouette
// region; no keying pass cleaned them reliably. Procedural placeholders
// are crisp, era-themed, deterministic, and cost nothing to render.
//
// Goal: Age-of-War-2-quality layered scene per era. Each frame stack:
//   1. sky        — gradient + sun/moon + horizon haze
//   2. clouds     — drifting era-themed band
//   3. far ridge  — distant mountain silhouette (low alpha = atmospheric)
//   4. mid ridge  — closer ridge with era-specific motif on top
//   5. foreground — tree-line / structures + grass tufts + props
//
// The renderer drives draw order; this file just paints each layer.

import { paletteFor } from '../../content/eras.js';

// ── Deterministic noise ───────────────────────────────────────────────
// Tiny 1D PRNG driven from an integer seed. Same chunk = same scene
// every frame, no flicker. Cheap enough to inline anywhere.
function rand(seed) {
  // mulberry32 — short, fast, plenty of mix for visual noise.
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Sky ───────────────────────────────────────────────────────────────
// Gradient + sun/moon disc + horizon haze. Era-specific:
//   ember-tribe    : huge dawn sun, hot horizon haze
//   iron-dominion  : pale overcast sun, cool grey haze
//   sun-foundry    : golden hour, brassy horizon
//   storm-republic : storm-grey sky with periodic lightning flash region
//   void-ascendancy: nebula glow, no sun, soft starfield
export function placeholderSky(ctx, eraId, w, h, groundY) {
  const pal = paletteFor(eraId);
  // Vertical gradient — darker at the very top, lighter near horizon.
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0,    pal.sky[1]);
  sky.addColorStop(0.55, lerpColor(pal.sky[0], pal.sky[1], 0.4));
  sky.addColorStop(1,    pal.sky[0]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, groundY);

  // Sun / moon disc.
  if (eraId !== 'void-ascendancy' && eraId !== 'storm-republic') {
    const sunX = w * 0.78;
    const sunY = groundY * 0.45;
    const sunR = Math.min(60, h * 0.10);
    const sunCol = sunColorFor(eraId);
    // Soft halo
    const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 3);
    halo.addColorStop(0, sunCol.glow);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR * 3, 0, Math.PI * 2); ctx.fill();
    // Disc
    ctx.fillStyle = sunCol.core;
    ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();
  } else if (eraId === 'void-ascendancy') {
    // Starfield + nebula glow — deterministic seed so stars don't jitter.
    const r = rand(0xa17e5);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const x = r() * w, y = r() * groundY * 0.85;
      ctx.globalAlpha = 0.25 + r() * 0.7;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
    // Nebula puff
    const neb = ctx.createRadialGradient(w * 0.3, groundY * 0.35, 10, w * 0.3, groundY * 0.35, w * 0.35);
    neb.addColorStop(0, 'rgba(200,155,255,0.35)');
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, w, groundY);
  } else {
    // Storm sky — diffuse light through cloud break.
    const flash = ctx.createRadialGradient(w * 0.6, groundY * 0.2, 20, w * 0.6, groundY * 0.2, w * 0.5);
    flash.addColorStop(0, 'rgba(255,255,255,0.10)');
    flash.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, groundY);
  }

  // Horizon haze — fade pal.sky[0] tint into pal.mountain at the ground line.
  // Reads as atmospheric perspective: the far ridge melts into the sky.
  const haze = ctx.createLinearGradient(0, groundY - 80, 0, groundY);
  haze.addColorStop(0, hexA(pal.sky[0], 0));
  haze.addColorStop(1, hexA(pal.sky[0], 0.55));
  ctx.fillStyle = haze;
  ctx.fillRect(0, groundY - 80, w, 80);
}

function sunColorFor(eraId) {
  switch (eraId) {
    case 'ember-tribe':   return { core: '#ffd28a', glow: 'rgba(255,180,90,0.35)' };
    case 'iron-dominion': return { core: '#e6dccc', glow: 'rgba(230,220,200,0.20)' };
    case 'sun-foundry':   return { core: '#ffe2a0', glow: 'rgba(255,200,90,0.35)' };
    default:              return { core: '#fff5d0', glow: 'rgba(255,235,170,0.30)' };
  }
}

// ── Clouds ────────────────────────────────────────────────────────────
export function placeholderClouds(ctx, eraId, w, groundY, t) {
  if (eraId === 'void-ascendancy') {
    // No clouds in the void — replace with drifting orbital streaks.
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#c89bff';
    for (let i = 0; i < 4; i++) {
      const drift = ((t * 8) + i * 280) % (w + 360) - 180;
      const y = groundY * (0.2 + i * 0.12);
      ctx.fillRect(drift, y, 220, 1);
    }
    ctx.restore();
    return;
  }
  if (eraId === 'storm-republic') {
    // Heavy storm clouds, low contrast, occasional lightning band.
    ctx.save();
    const drift = (t * 4) % 1920;
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 280) + drift) % (w + 480) - 240;
      const cy = groundY - 240 - (i % 2) * 26;
      ctx.fillStyle = i % 2 ? 'rgba(60,80,108,0.55)' : 'rgba(40,55,75,0.65)';
      drawCloud(ctx, cx, cy, 1.4);
    }
    // Soft lightning flicker — only fires briefly so it reads as natural.
    if (Math.sin(t * 1.7) > 0.985) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#bef3ff';
      ctx.fillRect(0, 0, w, groundY * 0.4);
    }
    ctx.restore();
    return;
  }
  const pal = paletteFor(eraId);
  ctx.save();
  ctx.globalAlpha = 0.42;
  const drift = (t * 6) % 1920;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 360) + drift) % (w + 480) - 240;
    const cy = groundY - 220 - (i % 2) * 18;
    // Two-tone clouds — base in midMotif, highlight in white.
    ctx.fillStyle = pal.midMotif;
    drawCloud(ctx, cx, cy, 1.0);
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.18;
    drawCloud(ctx, cx + 6, cy - 4, 0.85);
    ctx.globalAlpha = 0.42;
  }
  ctx.restore();
}

function drawCloud(ctx, cx, cy, scale) {
  ctx.beginPath();
  ctx.ellipse(cx,             cy,           60 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 38 * scale, cy - 8 * scale,  46 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(cx - 38 * scale, cy + 4 * scale,  38 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ── Mountains ─────────────────────────────────────────────────────────
// Two depth profiles: 'far' is at low alpha so it bleeds into the sky;
// 'mid' is crisper and carries the era motif on its silhouette.
export function placeholderMountains(ctx, eraId, w, groundY, depth) {
  const pal = paletteFor(eraId);
  ctx.save();
  if (depth === 'far') {
    ctx.fillStyle = pal.mountain;
    ctx.globalAlpha = 0.55;
    ridgePath(ctx, eraId, w, groundY, /*baseY=*/110, /*amp=*/30, /*step=*/22);
    ctx.fill();
    // Subtle highlight along the ridge top — softens the cut.
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = pal.midMotif;
    ridgePath(ctx, eraId, w, groundY, /*baseY=*/110, /*amp=*/30, /*step=*/22, /*offsetY=*/-6);
    ctx.fill();
    ctx.restore();
    return;
  }
  // Mid ridge — crisper, with motif silhouettes (towers, trees, etc.).
  ctx.fillStyle = pal.mountain;
  ctx.globalAlpha = 0.92;
  ridgePath(ctx, eraId, w, groundY, /*baseY=*/65, /*amp=*/24, /*step=*/16);
  ctx.fill();
  // Ground-line shadow — darkens directly under the ridge for depth.
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pal.groundDetail;
  ctx.fillRect(0, groundY - 4, w, 4);
  ctx.restore();

  // Motif on the silhouette: era-specific spires sit on the ridge.
  drawRidgeMotif(ctx, eraId, w, groundY);
}

function ridgePath(ctx, eraId, w, groundY, baseY, amp, step, offsetY = 0) {
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  let prevY = groundY - baseY;
  for (let x = 0; x <= w + step; x += step) {
    const phase = x / w;
    const y = groundY - baseY - mountainProfile(eraId, phase, amp) + offsetY;
    // Quadratic toward midpoint smooths the silhouette.
    const mx = x - step / 2;
    const my = (y + prevY) / 2 - 3;
    ctx.quadraticCurveTo(mx, my, x, y);
    prevY = y;
  }
  ctx.lineTo(w, groundY);
  ctx.closePath();
}

function mountainProfile(eraId, phase, amp) {
  const t = phase * 12;
  switch (eraId) {
    case 'ember-tribe':
      return Math.abs(Math.sin(t * 1.7)) * amp + Math.sin(t * 3.1) * 8;
    case 'iron-dominion':
      // Two prominent peaks with snowy gentle hills between.
      return (Math.sin(t * 0.9) + 1) * amp * 0.6 + Math.sin(t * 2.2) * 4;
    case 'sun-foundry':
      return (Math.sin(t * 1.2) + 1) * amp * 0.55 + Math.sin(t * 3.4) * 6;
    case 'storm-republic':
      // Angular industrial profile — saw-tooth.
      return (Math.abs(((t * 0.8) % 2) - 1) * amp) + Math.sin(t * 2) * 3;
    case 'void-ascendancy':
      return Math.abs(Math.sin(t * 0.7)) * amp * 0.7 + Math.sin(t * 1.6) * 6;
    default:
      return amp * 0.5;
  }
}

function drawRidgeMotif(ctx, eraId, w, groundY) {
  ctx.save();
  const r = rand(0xc0ffee);
  if (eraId === 'iron-dominion') {
    // Castle silhouettes — three squat keeps along the ridge.
    ctx.fillStyle = '#0e1218';
    for (let i = 0; i < 3; i++) {
      const x = (i + 1) * (w / 4);
      const baseY = groundY - 80 - (i === 1 ? 16 : 0);
      // Walls
      ctx.fillRect(x - 18, baseY, 36, 24);
      // Towers
      ctx.fillRect(x - 22, baseY - 18, 8, 18);
      ctx.fillRect(x + 14, baseY - 18, 8, 18);
      // Crenellations
      for (let k = 0; k < 4; k++) ctx.fillRect(x - 18 + k * 10, baseY - 6, 5, 6);
    }
  } else if (eraId === 'sun-foundry') {
    // Brass workshops with smokestacks.
    ctx.fillStyle = '#1a0d06';
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.5) * (w / 4) + (r() - 0.5) * 30;
      const baseY = groundY - 80;
      ctx.fillRect(x - 22, baseY, 44, 22);
      ctx.fillRect(x - 6, baseY - 28, 4, 28);   // stack
      // Smoke puff (additive feel — semi-transparent)
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffcb6b';
      ctx.beginPath();
      ctx.arc(x - 4, baseY - 36, 8 + (i % 2) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (eraId === 'storm-republic') {
    // Antennae + factory blocks.
    ctx.fillStyle = '#070b13';
    for (let i = 0; i < 5; i++) {
      const x = (i + 0.5) * (w / 5);
      ctx.fillRect(x - 14, groundY - 80, 28, 22);
      ctx.fillRect(x - 1, groundY - 110, 2, 30);
      // Antenna blink
      ctx.fillStyle = i % 2 ? '#ff486b' : '#7be3ff';
      ctx.fillRect(x - 1, groundY - 112, 2, 2);
      ctx.fillStyle = '#070b13';
    }
  } else if (eraId === 'void-ascendancy') {
    // Floating obelisks with soft glow.
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.5) * (w / 4) + (r() - 0.5) * 24;
      const y = groundY - 130 - (i % 2) * 14;
      ctx.fillStyle = '#1a0833';
      ctx.beginPath();
      ctx.moveTo(x, y - 38);
      ctx.lineTo(x + 8, y);
      ctx.lineTo(x - 8, y);
      ctx.closePath(); ctx.fill();
      // Glow rim
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#c89bff';
      ctx.beginPath();
      ctx.moveTo(x, y - 38);
      ctx.lineTo(x + 2, y - 38);
      ctx.lineTo(x + 1, y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  } else {
    // ember-tribe — primal stone monoliths and a few conifers on the ridge.
    ctx.fillStyle = '#0d0703';
    for (let i = 0; i < 5; i++) {
      const x = (i + 0.5) * (w / 5) + (r() - 0.5) * 30;
      drawConifer(ctx, x, groundY - 80, 18 + (i % 2) * 4, '#1a0a04');
    }
  }
  ctx.restore();
}

// ── Foreground ────────────────────────────────────────────────────────
// The big visual layer. Trees + grass + era-specific props on the
// ground band. The ground band itself is a separate gradient drawn
// before this layer in the renderer; this paints DETAIL on top.
export function placeholderForeground(ctx, eraId, w, groundY) {
  const pal = paletteFor(eraId);
  ctx.save();

  // 1) Distant tree-line right behind the lane (keeps the lane readable).
  drawTreeLine(ctx, eraId, w, groundY - 6);

  // 2) Ground texture stripes — short horizontal scumble across the dirt.
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = pal.groundDetail;
  for (let i = 0; i < 24; i++) {
    const x = (i / 24) * w + ((i * 19) % 30);
    const y = groundY + 14 + (i % 4) * 6;
    ctx.fillRect(x, y, 14 + (i % 3) * 4, 1);
  }

  // 3) Grass tufts along the lane — clean readable pixel tufts.
  ctx.globalAlpha = 0.85;
  drawGrassTufts(ctx, eraId, w, groundY);

  // 4) Era-specific debris/props — large enough to read at lane scale.
  drawEraProps(ctx, eraId, w, groundY);

  ctx.restore();
}

// Tree-line just behind the lane — dense silhouette band.
function drawTreeLine(ctx, eraId, w, baseY) {
  const r = rand(0xb1ade5);
  if (eraId === 'storm-republic' || eraId === 'sun-foundry') {
    // Industrial: low fence/pipe-rack along the lane edge.
    ctx.fillStyle = '#0a0d10';
    for (let x = 0; x < w; x += 16) {
      ctx.fillRect(x, baseY - 10, 2, 10);
      if ((x / 16) % 2 === 0) ctx.fillRect(x, baseY - 10, 12, 2);
    }
    return;
  }
  if (eraId === 'void-ascendancy') {
    // Crystal spires.
    for (let i = 0; i < 14; i++) {
      const x = (i / 14) * w + r() * 30;
      const h = 14 + r() * 10;
      ctx.fillStyle = '#1a0833';
      ctx.beginPath();
      ctx.moveTo(x, baseY - h);
      ctx.lineTo(x + 4, baseY);
      ctx.lineTo(x - 4, baseY);
      ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#c89bff';
      ctx.fillRect(x - 0.5, baseY - h, 1, h);
      ctx.restore();
    }
    return;
  }
  // ember-tribe / iron-dominion — conifer + broadleaf mix.
  for (let i = 0; i < 22; i++) {
    const x = (i / 22) * w + r() * 26;
    const h = 16 + r() * 14;
    if (i % 3 === 0) {
      drawBroadleaf(ctx, x, baseY, h * 0.9, treeColorFor(eraId));
    } else {
      drawConifer(ctx, x, baseY, h, treeColorFor(eraId));
    }
  }
}

function treeColorFor(eraId) {
  switch (eraId) {
    case 'ember-tribe':   return '#0c1810';
    case 'iron-dominion': return '#0a1410';
    case 'sun-foundry':   return '#0c0e10';
    default:              return '#0a0d10';
  }
}

function drawConifer(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  // Trunk
  ctx.fillRect(x - 1, baseY - 4, 2, 4);
  // Three-tier conifer triangle.
  ctx.beginPath();
  ctx.moveTo(x,         baseY - h);
  ctx.lineTo(x + h * 0.45, baseY - h * 0.55);
  ctx.lineTo(x + h * 0.30, baseY - h * 0.55);
  ctx.lineTo(x + h * 0.55, baseY - h * 0.20);
  ctx.lineTo(x - h * 0.55, baseY - h * 0.20);
  ctx.lineTo(x - h * 0.30, baseY - h * 0.55);
  ctx.lineTo(x - h * 0.45, baseY - h * 0.55);
  ctx.closePath();
  ctx.fill();
}

function drawBroadleaf(ctx, x, baseY, h, color) {
  ctx.fillStyle = color;
  // Trunk
  ctx.fillRect(x - 1, baseY - h * 0.30, 2, h * 0.30);
  // Round canopy — three overlapping circles.
  ctx.beginPath();
  ctx.arc(x,                baseY - h * 0.55, h * 0.36, 0, Math.PI * 2);
  ctx.arc(x - h * 0.30,     baseY - h * 0.45, h * 0.30, 0, Math.PI * 2);
  ctx.arc(x + h * 0.30,     baseY - h * 0.45, h * 0.30, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrassTufts(ctx, eraId, w, groundY) {
  const r = rand(0x9eedde);
  const col = paletteFor(eraId).midMotif;
  for (let i = 0; i < 60; i++) {
    const x = r() * w;
    const y = groundY + 4 + r() * 22;
    // Small triangular tuft.
    ctx.fillStyle = i % 4 === 0 ? col : '#0a0d10';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 3);
    ctx.lineTo(x + 2, y + 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEraProps(ctx, eraId, w, groundY) {
  const r = rand(0xfacade);
  if (eraId === 'ember-tribe') {
    // Bones + small fire stones scattered.
    ctx.fillStyle = '#cdb89a';
    for (let i = 0; i < 6; i++) {
      const x = (i + 0.5) * (w / 6) + (r() - 0.5) * 60;
      const y = groundY + 18 + (i % 2) * 6;
      ctx.fillRect(x - 5, y, 10, 1.5);   // shaft
      ctx.fillRect(x - 6, y - 1, 2, 3);  // knob
      ctx.fillRect(x + 4, y - 1, 2, 3);
    }
  } else if (eraId === 'iron-dominion') {
    // Pikes stuck in the ground + tattered banners.
    ctx.fillStyle = '#0a0d10';
    for (let i = 0; i < 5; i++) {
      const x = (i + 0.5) * (w / 5) + (r() - 0.5) * 50;
      ctx.fillRect(x, groundY + 4, 1.5, 28);
      ctx.fillStyle = i % 2 ? '#c24237' : '#d8d4cc';
      ctx.beginPath();
      ctx.moveTo(x, groundY + 6);
      ctx.lineTo(x + 10, groundY + 8);
      ctx.lineTo(x, groundY + 14);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a0d10';
    }
  } else if (eraId === 'sun-foundry') {
    // Brass barrels + pipe segments.
    for (let i = 0; i < 4; i++) {
      const x = (i + 0.5) * (w / 4) + (r() - 0.5) * 50;
      const y = groundY + 16;
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(x - 7, y, 14, 12);
      ctx.fillStyle = '#ffcb6b';
      ctx.fillRect(x - 7, y + 2, 14, 1);
      ctx.fillRect(x - 7, y + 8, 14, 1);
    }
  } else if (eraId === 'storm-republic') {
    // Concrete blocks + cabling.
    ctx.fillStyle = '#1a2030';
    for (let i = 0; i < 5; i++) {
      const x = (i + 0.5) * (w / 5) + (r() - 0.5) * 50;
      ctx.fillRect(x - 9, groundY + 16, 18, 10);
      ctx.fillRect(x - 9, groundY + 14, 18, 2);
    }
    ctx.strokeStyle = '#7be3ff';
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 32);
    for (let x = 0; x <= w; x += 24) ctx.lineTo(x, groundY + 32 + Math.sin(x * 0.05) * 3);
    ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (eraId === 'void-ascendancy') {
    // Void shards on the ground glowing softly.
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * (w / 8) + (r() - 0.5) * 60;
      const y = groundY + 18 + (i % 2) * 6;
      ctx.fillStyle = '#1a0833';
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x - 4, y);
      ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#c89bff';
      ctx.fillRect(x - 0.5, y - 5, 1, 5);
      ctx.restore();
    }
  }
}

// ── Bases ─────────────────────────────────────────────────────────────
// Era-themed silhouette walls. Crisp, deterministic, no checker risk.
export function placeholderBase(ctx, eraId, x, groundY, isPlayer) {
  const pal = paletteFor(eraId);
  // Foot shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 4, 50, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Per-era silhouette body.
  if (eraId === 'sun-foundry')      drawFoundryBase(ctx, pal, x, groundY, isPlayer);
  else if (eraId === 'storm-republic') drawStormBase(ctx, pal, x, groundY, isPlayer);
  else if (eraId === 'void-ascendancy') drawVoidBase(ctx, pal, x, groundY, isPlayer);
  else if (eraId === 'iron-dominion')   drawIronBase(ctx, pal, x, groundY, isPlayer);
  else                                  drawEmberBase(ctx, pal, x, groundY, isPlayer);
}

function drawCrenellatedBlock(ctx, x, top, w, h, fill, dark) {
  ctx.fillStyle = fill;
  ctx.fillRect(x - w / 2, top, w, h);
  ctx.fillStyle = dark;
  // Crenellations
  for (let k = 0; k < 5; k++) ctx.fillRect(x - w / 2 + 4 + k * (w / 5), top - 6, w / 7, 6);
  // Stone seam grid
  for (let row = 0; row < Math.floor(h / 22); row++) ctx.fillRect(x - w / 2, top + 18 + row * 22, w, 1);
  for (let col = 0; col < Math.floor(w / 14); col++) ctx.fillRect(x - w / 2 + col * 14 + (col % 2 ? 7 : 0), top + 4, 1, h - 4);
}

function drawPennant(ctx, x, top, color) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, top - 38);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, top - 38);
  ctx.lineTo(x + 22, top - 32);
  ctx.lineTo(x, top - 26);
  ctx.closePath(); ctx.fill();
}

function drawEmberBase(ctx, pal, x, groundY, isPlayer) {
  const top = groundY - 112;
  // Wooden palisade
  ctx.fillStyle = '#2c1a0c';
  ctx.fillRect(x - 44, top, 88, 112);
  // Vertical plank seams
  ctx.fillStyle = '#150a04';
  for (let i = 0; i < 8; i++) ctx.fillRect(x - 44 + i * 11, top, 1, 112);
  // Pointed tops
  ctx.fillStyle = '#150a04';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 44 + i * 11,     top);
    ctx.lineTo(x - 44 + i * 11 + 5, top - 6);
    ctx.lineTo(x - 44 + i * 11 + 11, top);
    ctx.closePath(); ctx.fill();
  }
  // Banner
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.fillRect(x - 38, top + 16, 76, 18);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 8, top + 70, 16, 42);  // doorway
  // Bonfire
  ctx.fillStyle = '#ff8a3a';
  ctx.beginPath(); ctx.arc(x - 28 * (isPlayer ? 1 : -1), groundY - 6, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd05a';
  ctx.beginPath(); ctx.arc(x - 28 * (isPlayer ? 1 : -1), groundY - 8, 2, 0, Math.PI * 2); ctx.fill();
  drawPennant(ctx, x, top - 8, isPlayer ? pal.banner : pal.bannerEnemy);
}

function drawIronBase(ctx, pal, x, groundY, isPlayer) {
  const top = groundY - 120;
  drawCrenellatedBlock(ctx, x, top, 96, 120, '#3b3f48', '#1c2128');
  // Banner draped from a beam.
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.fillRect(x - 18, top + 26, 36, 50);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 18, top + 24, 36, 2);
  // Door
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath();
  ctx.moveTo(x - 12, top + 120);
  ctx.lineTo(x - 12, top + 90);
  ctx.quadraticCurveTo(x, top + 80, x + 12, top + 90);
  ctx.lineTo(x + 12, top + 120);
  ctx.closePath(); ctx.fill();
  drawPennant(ctx, x + 30, top - 4, isPlayer ? pal.banner : pal.bannerEnemy);
  drawPennant(ctx, x - 30, top - 4, isPlayer ? pal.banner : pal.bannerEnemy);
}

function drawFoundryBase(ctx, pal, x, groundY, isPlayer) {
  const top = groundY - 124;
  // Brass-plated workshop
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x - 48, top, 96, 124);
  // Brass banding
  ctx.fillStyle = '#ffcb6b';
  ctx.fillRect(x - 48, top + 12, 96, 4);
  ctx.fillRect(x - 48, top + 110, 96, 4);
  // Rivets
  ctx.fillStyle = '#1a0d06';
  for (let i = 0; i < 10; i++) ctx.fillRect(x - 46 + i * 10, top + 16, 1.5, 1.5);
  // Smokestack
  ctx.fillStyle = '#2c1a0c';
  ctx.fillRect(x + (isPlayer ? 22 : -28), top - 36, 8, 36);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#ffcb6b';
  ctx.beginPath();
  ctx.arc(x + (isPlayer ? 26 : -24), top - 40, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Door / vent grille
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 12, top + 70, 24, 54);
  ctx.fillStyle = '#ffcb6b';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 11, top + 74 + i * 10, 22, 2);
  drawPennant(ctx, x, top - 8, isPlayer ? pal.banner : pal.bannerEnemy);
}

function drawStormBase(ctx, pal, x, groundY, isPlayer) {
  const top = groundY - 124;
  // Concrete bunker
  ctx.fillStyle = '#2a3142';
  ctx.fillRect(x - 50, top, 100, 124);
  // Rivet rim
  ctx.fillStyle = '#0c121b';
  ctx.fillRect(x - 50, top, 100, 6);
  ctx.fillRect(x - 50, top + 118, 100, 6);
  // Voltage stripe
  ctx.fillStyle = '#7be3ff';
  ctx.fillRect(x - 42, top + 36, 84, 3);
  // Antenna mast
  ctx.fillStyle = '#0c121b';
  ctx.fillRect(x - 1, top - 36, 2, 36);
  ctx.fillStyle = '#ff486b';
  ctx.fillRect(x - 1.5, top - 36, 3, 3);
  // Door
  ctx.fillStyle = '#0c121b';
  ctx.fillRect(x - 14, top + 80, 28, 44);
  ctx.fillStyle = '#7be3ff';
  ctx.fillRect(x - 14, top + 80, 28, 2);
  drawPennant(ctx, x + 30, top + 4, isPlayer ? pal.banner : pal.bannerEnemy);
}

function drawVoidBase(ctx, pal, x, groundY, isPlayer) {
  const top = groundY - 128;
  // Floating obelisk core
  ctx.fillStyle = '#1a0833';
  ctx.beginPath();
  ctx.moveTo(x, top - 20);
  ctx.lineTo(x + 52, top + 80);
  ctx.lineTo(x + 32, top + 128);
  ctx.lineTo(x - 32, top + 128);
  ctx.lineTo(x - 52, top + 80);
  ctx.closePath(); ctx.fill();
  // Glow rim
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#c89bff';
  ctx.fillRect(x - 1, top - 20, 2, 148);
  ctx.restore();
  // Door slit
  ctx.fillStyle = '#04001a';
  ctx.fillRect(x - 8, top + 60, 16, 60);
  ctx.fillStyle = '#e9c8ff';
  ctx.fillRect(x - 1, top + 60, 2, 60);
  drawPennant(ctx, x, top - 28, isPlayer ? pal.banner : pal.bannerEnemy);
}

// ── Turret + unit + projectile + VFX placeholders (unchanged) ────────

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

// ── Helpers ───────────────────────────────────────────────────────────
function lerpColor(a, b, t) {
  // Quick hex-blend without allocations. Both inputs must be `#rrggbb`.
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${(r * 65536 + g * 256 + bl).toString(16).padStart(6, '0')}`;
}

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
