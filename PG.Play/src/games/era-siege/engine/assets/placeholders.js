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

  // Tree-line just behind the lane. Lives in the mid-ridge layer rather
  // than the foreground, because the image-blit contract anchors the
  // foreground PNG to the dirt band (BELOW groundY) — trees need to be
  // above groundY, where the mid-mountain PNG ends up at runtime.
  drawTreeLine(ctx, eraId, w, groundY - 6);
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
// The dirt-band detail layer. Sits in the band below groundY at runtime
// (the runtime blits this PNG anchored to the bottom of the visible
// area). Tree-line lives in the mid-mountain layer instead — trees
// above groundY would clip out of this layer's blit window.
export function placeholderForeground(ctx, eraId, w, groundY) {
  const pal = paletteFor(eraId);
  ctx.save();

  // 1) Ground texture stripes — short horizontal scumble across the dirt.
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = pal.groundDetail;
  for (let i = 0; i < 24; i++) {
    const x = (i / 24) * w + ((i * 19) % 30);
    const y = groundY + 14 + (i % 4) * 6;
    ctx.fillRect(x, y, 14 + (i % 3) * 4, 1);
  }

  // 2) Grass tufts along the lane — clean readable pixel tufts.
  ctx.globalAlpha = 0.85;
  drawGrassTufts(ctx, eraId, w, groundY);

  // 3) Era-specific debris/props — large enough to read at lane scale.
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

// Rich unit silhouette — full body in a static neutral pose. Used both
// as a runtime fallback (when no PNG is loaded) AND as the source of
// truth for the baked unit PNGs in scripts/era-siege-bake.mjs.
//
// `eraId` lets us add era-specific accents on top of the base body
// (face paint, plate trim, goggles, gas mask, glowing eyes, etc.).
// `facing` is +1 (right) or -1 (left). Bake calls with facing=+1.
export function placeholderUnit(ctx, def, x, y, opts = {}) {
  const v = def.visual;
  const facing = opts.facing || 1;
  const isGeneral = def.role === 'general';
  const isHeavy = def.role === 'heavy' || isGeneral;
  const isRanged = def.role === 'ranged';
  const scaleByH = (opts.h && v.silhouetteH) ? opts.h / v.silhouetteH : null;
  const SCALE = scaleByH ?? opts.scale ?? 2.6;
  const w = v.silhouetteW * SCALE;
  const h = v.silhouetteH * SCALE;
  const halfW = w / 2;
  const headR = v.headRadius * SCALE;
  const colorBody = v.colorBody;
  const colorTrim = v.colorTrim;
  const eraId = opts.eraId || def.eraId;
  const dark   = '#0c0e12';                        // outline / shadows
  const mid    = shadeColor(colorBody, -18);        // shading on body
  const lite   = shadeColor(colorBody,  16);        // highlight on body
  const skin   = skinColorFor(eraId);

  // Body geometry — proper proportions, not pure rectangles.
  const torsoH = h * 0.42;
  const legH   = h * 0.38;
  const torsoTop = y - legH - torsoH;
  const torsoBot = y - legH;
  const shoulderW = w;                              // wider at shoulders
  const hipW = w * 0.78;                            // narrower at hips
  const neckH = h * 0.06;
  const neckY = torsoTop;
  const headY = neckY - neckH - headR;

  // 1) Foot shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, halfW + 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2) BACK arm — drawn behind the torso so it reads as depth.
  const armW = Math.max(4, w * 0.22);
  const backShoulderX = x - facing * (halfW * 0.55);
  ctx.fillStyle = mid;
  roundRect(ctx, backShoulderX - armW / 2, torsoTop + torsoH * 0.10, armW, torsoH * 0.85, armW * 0.4);
  ctx.fill();
  ctx.fillStyle = dark;
  roundRect(ctx, backShoulderX - armW / 2, torsoTop + torsoH * 0.10, armW, torsoH * 0.85, armW * 0.4);
  ctx.lineWidth = Math.max(1, SCALE * 0.4);
  ctx.strokeStyle = dark;
  ctx.stroke();

  // 3) LEGS — two distinct legs with a slight stride hint, clean outline.
  const legW = Math.max(5, w / 2.4);
  const legGap = w * 0.10;
  const leftLegX  = x - legGap / 2 - legW;
  const rightLegX = x + legGap / 2;
  // Slight forward foot lift on the leading leg (facing direction)
  const leadLift = 1;
  drawBodyPart(ctx, leftLegX,  y - legH,             legW, legH,        colorBody, mid, dark, SCALE);
  drawBodyPart(ctx, rightLegX, y - legH - leadLift,  legW, legH,        colorBody, mid, dark, SCALE);
  // Boot caps
  ctx.fillStyle = dark;
  roundRect(ctx, leftLegX - 1,  y - 3,            legW + 2, 4, 1.5);
  ctx.fill();
  roundRect(ctx, rightLegX - 1, y - 3 - leadLift, legW + 2, 4, 1.5);
  ctx.fill();

  // 4) TORSO — trapezoid (wider at shoulders, narrower at hips).
  ctx.beginPath();
  ctx.moveTo(x - shoulderW / 2 + 1, torsoTop);
  ctx.lineTo(x + shoulderW / 2 - 1, torsoTop);
  ctx.lineTo(x + hipW / 2,           torsoBot);
  ctx.lineTo(x - hipW / 2,           torsoBot);
  ctx.closePath();
  ctx.fillStyle = colorBody;
  ctx.fill();
  // Right-side shading
  ctx.beginPath();
  ctx.moveTo(x + shoulderW * 0.10, torsoTop);
  ctx.lineTo(x + shoulderW / 2 - 1, torsoTop);
  ctx.lineTo(x + hipW / 2,          torsoBot);
  ctx.lineTo(x + hipW * 0.05,       torsoBot);
  ctx.closePath();
  ctx.fillStyle = mid;
  ctx.fill();
  // Outline
  ctx.beginPath();
  ctx.moveTo(x - shoulderW / 2 + 1, torsoTop);
  ctx.lineTo(x + shoulderW / 2 - 1, torsoTop);
  ctx.lineTo(x + hipW / 2,           torsoBot);
  ctx.lineTo(x - hipW / 2,           torsoBot);
  ctx.closePath();
  ctx.lineWidth = Math.max(1.2, SCALE * 0.55);
  ctx.strokeStyle = dark;
  ctx.stroke();

  // 5) Sash / banner across the chest (era-coloured).
  ctx.fillStyle = colorTrim;
  ctx.beginPath();
  ctx.moveTo(x - shoulderW / 2 + 2, torsoTop + torsoH * 0.18);
  ctx.lineTo(x + shoulderW / 2 - 2, torsoTop + torsoH * 0.32);
  ctx.lineTo(x + shoulderW / 2 - 2, torsoTop + torsoH * 0.42);
  ctx.lineTo(x - shoulderW / 2 + 2, torsoTop + torsoH * 0.28);
  ctx.closePath();
  ctx.fill();

  // 6) Heavies + generals: cape behind torso.
  if (isHeavy) {
    const capeColor = colorTrim;
    const capeShadow = shadeColor(capeColor, -28);
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(x - facing * shoulderW * 0.55, torsoTop + 2);
    ctx.quadraticCurveTo(
      x - facing * shoulderW * 0.85, (torsoTop + y) / 2,
      x - facing * shoulderW * 0.40, y - 2,
    );
    ctx.lineTo(x - facing * shoulderW * 0.05, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = capeShadow;
    ctx.beginPath();
    ctx.moveTo(x - facing * shoulderW * 0.55, torsoTop + 4);
    ctx.quadraticCurveTo(
      x - facing * shoulderW * 0.70, (torsoTop + y) / 2 + 2,
      x - facing * shoulderW * 0.35, y - 4,
    );
    ctx.lineTo(x - facing * shoulderW * 0.20, y - 4);
    ctx.closePath();
    ctx.fill();
  }

  // 7) Pauldrons (shoulder armour) — heavies and iron-style roles.
  if (isHeavy || eraId === 'iron-dominion' || eraId === 'storm-republic') {
    const paW = Math.max(5, shoulderW * 0.18);
    const paH = Math.max(5, torsoH * 0.30);
    drawShoulderPad(ctx, x - shoulderW / 2 - paW * 0.2, torsoTop - 1, paW, paH, mid, dark);
    drawShoulderPad(ctx, x + shoulderW / 2 - paW * 0.8, torsoTop - 1, paW, paH, mid, dark);
  }

  // 8) Neck.
  ctx.fillStyle = skin;
  roundRect(ctx, x - shoulderW * 0.10, neckY - neckH, shoulderW * 0.20, neckH + 2, neckH * 0.4);
  ctx.fill();
  ctx.lineWidth = Math.max(1, SCALE * 0.35);
  ctx.strokeStyle = dark;
  ctx.stroke();

  // 9) Head — slight oval, dark outline. Skin tone unless covered by
  // a helmet (rendered via era accent below).
  ctx.beginPath();
  ctx.ellipse(x, headY, headR * 0.95, headR, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = Math.max(1.2, SCALE * 0.55);
  ctx.strokeStyle = dark;
  ctx.stroke();

  // 10) Era-specific head + costume accents.
  drawHeadAccent(ctx, eraId, def.role, x, headY, headR, facing, colorTrim);
  drawCostumeAccents(ctx, eraId, def.role, x, torsoTop, torsoH, shoulderW, hipW, colorBody, colorTrim, dark, SCALE);

  // Helm crest (heavies + generals) — sits on top of any era helmet.
  if (isHeavy) {
    ctx.fillStyle = colorTrim;
    ctx.beginPath();
    ctx.moveTo(x - 3, headY - headR);
    ctx.lineTo(x,     headY - headR - 8);
    ctx.lineTo(x + 3, headY - headR);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dark;
    ctx.stroke();
  }

  // Generals: a 3-point crown above the helm crest + a back-banner.
  // The crown is the read-at-a-glance signal that this isn't just a
  // heavy — it's the era's general.
  if (isGeneral) {
    const crownY = headY - headR - 8;
    ctx.fillStyle = colorTrim;
    // Crown band
    ctx.fillRect(x - headR - 1, crownY - 1, headR * 2 + 2, 3);
    // Three points
    ctx.beginPath();
    ctx.moveTo(x - headR,     crownY - 1);
    ctx.lineTo(x - headR + 2, crownY - 6);
    ctx.lineTo(x - headR + 4, crownY - 1);
    ctx.lineTo(x - 2,         crownY - 1);
    ctx.lineTo(x,             crownY - 8);
    ctx.lineTo(x + 2,         crownY - 1);
    ctx.lineTo(x + headR - 4, crownY - 1);
    ctx.lineTo(x + headR - 2, crownY - 6);
    ctx.lineTo(x + headR,     crownY - 1);
    ctx.closePath();
    ctx.fill();
    // Crown gem (era accent)
    ctx.fillStyle = paletteFor(eraId).hudAccent || '#ffe14f';
    ctx.fillRect(x - 1, crownY - 5, 2, 2);

    // Back-banner: pole rising behind the shoulders + a flag.
    const poleX = x - facing * (halfW * 0.4);
    const poleTop = torsoTop - h * 0.55;
    ctx.fillStyle = '#0a0d0e';
    ctx.fillRect(poleX - 1, poleTop, 2, h * 0.55);
    ctx.fillStyle = colorTrim;
    ctx.beginPath();
    ctx.moveTo(poleX,                    poleTop);
    ctx.lineTo(poleX - facing * 14,      poleTop + 6);
    ctx.lineTo(poleX,                    poleTop + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shadeColor(colorTrim, -25);
    ctx.fillRect(poleX - facing * 6, poleTop + 4, 1, 5);
  }

  // 11) FRONT arm + weapon. Drawn last so it overlaps the torso and
  // reads as foregrounded. The arm bends slightly forward (elbow) for
  // a less-stiff stance.
  const frontShoulderX = x + facing * (shoulderW * 0.42);
  const elbowX  = frontShoulderX + facing * (armW * 0.6);
  const elbowY  = torsoTop + torsoH * 0.55;
  const handX   = frontShoulderX + facing * (armW * 1.5);
  const handY   = torsoTop + torsoH * 0.40;
  ctx.lineWidth = armW;
  ctx.strokeStyle = colorBody;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(frontShoulderX, torsoTop + torsoH * 0.10);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  // Outline the arm
  ctx.lineWidth = armW + Math.max(1.5, SCALE * 0.5);
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.moveTo(frontShoulderX, torsoTop + torsoH * 0.10);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  // Inner-fill on top
  ctx.lineWidth = armW;
  ctx.strokeStyle = colorBody;
  ctx.beginPath();
  ctx.moveTo(frontShoulderX, torsoTop + torsoH * 0.10);
  ctx.lineTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.lineCap = 'butt';
  // Hand
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(handX, handY, armW * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = dark;
  ctx.stroke();

  // 12) Weapon — extends from the hand.
  drawWeapon(ctx, v.weaponShape, handX, handY, facing, colorTrim, SCALE);
}

// Draws a rounded rect onto the path (caller fills/strokes).
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// Body part with two-tone shading + dark outline.
function drawBodyPart(ctx, x, y, w, h, base, mid, outline, scale) {
  const r = Math.min(w, h) * 0.25;
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = base;
  ctx.fill();
  // Right-side shading
  roundRect(ctx, x + w * 0.55, y, w * 0.45, h, r);
  ctx.fillStyle = mid;
  ctx.fill();
  // Outline
  roundRect(ctx, x, y, w, h, r);
  ctx.lineWidth = Math.max(1.2, scale * 0.55);
  ctx.strokeStyle = outline;
  ctx.stroke();
}

// Curved pauldron silhouette.
function drawShoulderPad(ctx, x, y, w, h, fill, outline) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.35, x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = outline;
  ctx.stroke();
}

// Era-themed skin / undersuit colour for exposed areas (face, neck, hand).
function skinColorFor(eraId) {
  switch (eraId) {
    case 'ember-tribe':    return '#caa07b';
    case 'iron-dominion':  return '#c9a98b';
    case 'sun-foundry':    return '#b58862';
    case 'storm-republic': return '#9aa6b3';
    case 'void-ascendancy':return '#7a5c9a';
    default:               return '#caa07b';
  }
}

// Era-specific body / costume detail rendered ON TOP of the torso, so
// the unit's silhouette reads as belonging to its era at a glance.
function drawCostumeAccents(ctx, eraId, role, x, torsoTop, torsoH, shoulderW, hipW, colorBody, colorTrim, dark, scale) {
  const torsoBot = torsoTop + torsoH;
  if (eraId === 'ember-tribe') {
    // Tribal cloth wrap across the hips.
    ctx.fillStyle = '#d8a06a';
    ctx.fillRect(x - hipW / 2 - 1, torsoBot - 4, hipW + 2, 5);
    ctx.fillStyle = '#a26430';
    ctx.fillRect(x - hipW / 2 - 1, torsoBot - 1, hipW + 2, 1);
  } else if (eraId === 'iron-dominion') {
    // Plate chest with rivet rows.
    ctx.fillStyle = '#0a0d10';
    for (let i = 0; i < 4; i++) {
      const px = x - shoulderW * 0.30 + i * (shoulderW * 0.20);
      ctx.fillRect(px, torsoTop + torsoH * 0.20, 1.5, 1.5);
      ctx.fillRect(px, torsoTop + torsoH * 0.55, 1.5, 1.5);
    }
    // Belt
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - hipW / 2 + 1, torsoBot - 5, hipW - 2, 4);
    ctx.fillStyle = '#ffd05a';
    ctx.fillRect(x - 3, torsoBot - 5, 6, 4);
  } else if (eraId === 'sun-foundry') {
    // Brass buttons + leather belt.
    ctx.fillStyle = '#ffcb6b';
    ctx.beginPath(); ctx.arc(x, torsoTop + torsoH * 0.30, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, torsoTop + torsoH * 0.50, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, torsoTop + torsoH * 0.70, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - hipW / 2, torsoBot - 4, hipW, 3);
  } else if (eraId === 'storm-republic') {
    // Voltage stripe down the chest + utility belt.
    ctx.fillStyle = '#7be3ff';
    ctx.fillRect(x - 1, torsoTop + 3, 2, torsoH * 0.7);
    ctx.fillStyle = '#0c121b';
    ctx.fillRect(x - hipW / 2, torsoBot - 4, hipW, 3);
    ctx.fillStyle = '#ff486b';
    ctx.fillRect(x - 2, torsoBot - 4, 4, 3);
  } else if (eraId === 'void-ascendancy') {
    // Glowing crack down the torso.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#c89bff';
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, torsoTop + 4);
    ctx.lineTo(x - 2, torsoTop + torsoH * 0.35);
    ctx.lineTo(x + 1, torsoTop + torsoH * 0.65);
    ctx.lineTo(x - 1, torsoBot - 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawHeadAccent(ctx, eraId, role, x, headY, headR, facing, colorTrim) {
  if (eraId === 'ember-tribe') {
    // Tribal face paint stripe.
    ctx.fillStyle = colorTrim;
    ctx.fillRect(x - headR + 2, headY, headR * 2 - 4, 1.5);
  } else if (eraId === 'iron-dominion') {
    // Helmet visor slit.
    ctx.fillStyle = '#0a0d0e';
    ctx.fillRect(x - headR + 2, headY - 1, headR * 2 - 4, 2);
  } else if (eraId === 'sun-foundry') {
    // Goggles — two small circles.
    ctx.fillStyle = '#0a0d0e';
    ctx.beginPath(); ctx.arc(x - headR / 2, headY, headR / 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + headR / 2, headY, headR / 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcb6b';
    ctx.beginPath(); ctx.arc(x - headR / 2, headY, headR / 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + headR / 2, headY, headR / 5, 0, Math.PI * 2); ctx.fill();
  } else if (eraId === 'storm-republic') {
    // Gas mask filter.
    ctx.fillStyle = '#0a0d0e';
    ctx.fillRect(x - headR + 1, headY - 2, headR * 2 - 2, 5);
    ctx.fillStyle = '#7be3ff';
    ctx.fillRect(x - 2, headY, 4, 2);
  } else if (eraId === 'void-ascendancy') {
    // Glowing eyes — additive.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = colorTrim;
    ctx.fillRect(x - headR / 2 - 1, headY - 1, 2, 2);
    ctx.fillRect(x + headR / 2 - 1, headY - 1, 2, 2);
    ctx.restore();
  }
}

function drawWeapon(ctx, shape, x, y, facing, color, scale = 1) {
  ctx.fillStyle = color;
  // Hand
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(x - 2, y - 2, 4, 4);
  ctx.fillStyle = color;
  // Weapon shape
  const s = scale; // size multiplier so weapons match the body scale
  switch (shape) {
    case 'club':
      ctx.fillRect(x, y - 1, facing * 12 * s, 4 * s);
      ctx.fillStyle = shadeColor(color, -15);
      ctx.fillRect(x + facing * 8 * s, y - 4 * s, facing * 6 * s, 8 * s);
      break;
    case 'sling':
      ctx.fillRect(x, y - 1, facing * 14 * s, 2);
      ctx.fillStyle = '#cdb89a';
      ctx.beginPath(); ctx.arc(x + facing * 14 * s, y, 3 * s, 0, Math.PI * 2); ctx.fill();
      break;
    case 'brand':
      ctx.fillRect(x, y - 2, facing * 14 * s, 5 * s);
      ctx.fillStyle = '#ffe14f';
      ctx.beginPath(); ctx.arc(x + facing * 14 * s, y - 1, 5 * s, 0, Math.PI * 2); ctx.fill();
      break;
    case 'spear':
      ctx.fillRect(x, y - 1, facing * 18 * s, 2 * s);
      ctx.fillStyle = '#cdb89a';
      ctx.beginPath();
      ctx.moveTo(x + facing * 18 * s, y - 4 * s);
      ctx.lineTo(x + facing * 24 * s, y);
      ctx.lineTo(x + facing * 18 * s, y + 4 * s);
      ctx.closePath(); ctx.fill();
      break;
    case 'crossbow':
      ctx.fillRect(x, y - 1, facing * 14 * s, 2 * s);
      ctx.fillRect(x + facing * 6 * s, y - 5 * s, 2, 11 * s);
      break;
    case 'maul':
      ctx.fillRect(x, y - 2, facing * 12 * s, 4 * s);
      ctx.fillStyle = shadeColor(color, -15);
      ctx.fillRect(x + facing * 10 * s, y - 6 * s, facing * 8 * s, 12 * s);
      break;
    case 'sabre':
      ctx.beginPath();
      ctx.moveTo(x, y - 1);
      ctx.quadraticCurveTo(x + facing * 12 * s, y - 6 * s, x + facing * 18 * s, y - 2 * s);
      ctx.lineTo(x + facing * 18 * s, y);
      ctx.quadraticCurveTo(x + facing * 12 * s, y - 4 * s, x, y + 1);
      ctx.closePath(); ctx.fill();
      break;
    case 'rifle':
      ctx.fillRect(x, y - 1, facing * 18 * s, 3 * s);
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(x - facing * 2 * s, y, facing * 6 * s, 5 * s);
      break;
    case 'piledriver':
      ctx.fillRect(x, y - 4 * s, facing * 14 * s, 9 * s);
      ctx.fillStyle = shadeColor(color, -25);
      ctx.fillRect(x + facing * 10 * s, y - 6 * s, facing * 8 * s, 14 * s);
      break;
    case 'bayonet':
      ctx.fillRect(x, y - 1, facing * 18 * s, 2 * s);
      ctx.fillStyle = '#7be3ff';
      ctx.beginPath();
      ctx.moveTo(x + facing * 18 * s, y - 3 * s);
      ctx.lineTo(x + facing * 24 * s, y);
      ctx.lineTo(x + facing * 18 * s, y + 3 * s);
      ctx.closePath(); ctx.fill();
      break;
    case 'arc-rifle':
      ctx.fillRect(x, y - 1, facing * 18 * s, 3 * s);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#7be3ff';
      ctx.beginPath(); ctx.arc(x + facing * 18 * s, y + 1, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    case 'howitzer':
      ctx.fillRect(x, y - 5 * s, facing * 22 * s, 11 * s);
      ctx.fillStyle = shadeColor(color, -20);
      ctx.fillRect(x + facing * 18 * s, y - 7 * s, facing * 6 * s, 15 * s);
      break;
    case 'edge':
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + facing * 14 * s, y - 6 * s);
      ctx.lineTo(x + facing * 14 * s, y + 1);
      ctx.lineTo(x, y + 2);
      ctx.closePath(); ctx.fill();
      break;
    case 'lance':
      ctx.fillRect(x, y - 1, facing * 22 * s, 2 * s);
      ctx.fillStyle = '#e9c8ff';
      ctx.beginPath();
      ctx.moveTo(x + facing * 22 * s, y - 4 * s);
      ctx.lineTo(x + facing * 30 * s, y);
      ctx.lineTo(x + facing * 22 * s, y + 4 * s);
      ctx.closePath(); ctx.fill();
      break;
    case 'colossus-fist':
      ctx.fillStyle = shadeColor(color, -10);
      ctx.fillRect(x, y - 8 * s, facing * 14 * s, 16 * s);
      ctx.fillStyle = '#1a0a3a';
      // Knuckle ridges
      for (let k = 0; k < 4; k++) ctx.fillRect(x + facing * (3 + k * 3) * s, y - 9 * s, 2, 2);
      break;
    default:
      ctx.fillRect(x, y - 1, facing * 10 * s, 2 * s);
  }
}

// Lightens or darkens a hex colour by `amount` (0-100). Negative darkens.
function shadeColor(hex, amount) {
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${(r * 65536 + g * 256 + b).toString(16).padStart(6, '0')}`;
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
