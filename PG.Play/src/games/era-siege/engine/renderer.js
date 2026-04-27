// Canvas2D renderer for Era Siege.
//
// Phase 7 layered draw order (back → front):
//   1. Sky                (parallax.drawSky)
//   2. Cloud band         (parallax.drawClouds)
//   3. Far mountain ridge (parallax.drawFarMountains)
//   4. Mid hill ridge     (parallax.drawMidMountains)
//   5. Ground band        (parallax.drawGround)
//   6. Foreground band    (parallax.drawForeground) — between ground and bases
//   7. Bases (era-tinted, taller, with banner + pennant)
//   8. Turrets
//   9. Special telegraphs
//  10. Units (sorted by foot-y for back-to-front readability)
//  11. Projectiles
//  12. Particles (additive)
//  13. Special-impact rings
//  14. Damage numbers
//  15. Era ribbon (top-of-screen)
//
// Screen shake is applied as a translate before passes 1–15.
// Era flash + era-up banner are drawn after restore so they're shake-stable.

import { paletteFor, getEraByIndex, ERAS_BY_ID } from '../content/eras.js';
import { BALANCE } from '../content/balance.js';
import { assets } from './assets.js';
import {
  drawSky, drawClouds, drawFarMountains, drawMidMountains,
  drawGround as drawGroundLayer, drawForeground,
} from './parallax.js';

// eraId → index map for unit sprite lookup (renderer-only, immutable).
const ERA_BY_ID = Object.fromEntries(
  Object.entries(ERAS_BY_ID).map(([id, era]) => [id, era.index + 1]),
);

// Module-level draw flags, set per-render. Lets the static draw helpers
// consult them without threading parameters through every call.
let _cbSafe = false;
let _alpha = 1;
function hpColor(r) {
  if (_cbSafe) {
    // Blue → amber → magenta — distinguishable across deuteranopia,
    // protanopia, and tritanopia.
    return r > 0.5 ? '#7be3ff' : r > 0.25 ? '#ffcb6b' : '#ff5fb3';
  }
  return r > 0.5 ? '#35f0c9' : r > 0.25 ? '#ffe14f' : '#ff4d6d';
}

export function makeRenderer() {
  const gradCache = new Map();

  function getSkyGradient(ctx, eraId, w, h) {
    const key = `sky:${eraId}:${w}:${h}`;
    let g = gradCache.get(key);
    if (g) return g;
    const pal = paletteFor(eraId);
    g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, pal.sky[0]);
    g.addColorStop(1, pal.sky[1]);
    gradCache.set(key, g);
    return g;
  }

  function getGroundGradient(ctx, eraId, groundY, h) {
    const key = `gnd:${eraId}:${groundY}:${h}`;
    let g = gradCache.get(key);
    if (g) return g;
    const pal = paletteFor(eraId);
    g = ctx.createLinearGradient(0, groundY, 0, h);
    g.addColorStop(0, pal.ground);
    g.addColorStop(1, pal.groundDetail);
    gradCache.set(key, g);
    return g;
  }

  function clearCache() { gradCache.clear(); }

  function render(ctx, match, _frameDt) {
    if (!match) return;
    const v = match.view;
    const w = v.w, h = v.h;
    _cbSafe = !!match.cbSafe;
    // Render-interp factor: where between the last and the next sim step
    // are we right now? Buttery 120-Hz / 2× speed motion needs this.
    _alpha = Math.max(0, Math.min(1, (match._acc || 0) / (1 / 60)));
    const playerEraIdx = match.player.eraIndex;
    const playerEra = getEraByIndex(playerEraIdx);
    const pal = paletteFor(playerEra.id);

    // Screen shake (suppressed under reduceMotion)
    const shakeOk = !match.reduceMotion;
    const shakeX = shakeOk && match.effects.shakeMs > 0 ? (Math.random() - 0.5) * match.effects.shakeMag : 0;
    const shakeY = shakeOk && match.effects.shakeMs > 0 ? (Math.random() - 0.5) * match.effects.shakeMag * 0.6 : 0;
    ctx.save();
    if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

    // 1) Sky
    drawSky(ctx, v, playerEraIdx);

    // 2) Cloud band (drifting)
    drawClouds(ctx, v, playerEraIdx, match.timeSec);

    // 3) Far mountains
    drawFarMountains(ctx, v, playerEraIdx);

    // 4) Mid mountains
    drawMidMountains(ctx, v, playerEraIdx);

    // 5) Ground
    drawGroundLayer(ctx, v, playerEraIdx);

    // 6) Foreground band (rocks/grass/debris) — sits *behind* the bases
    //    but in front of the ground gradient so it reads as detail near
    //    the camera.
    drawForeground(ctx, v, playerEraIdx);

    // 7) Bases
    drawBase(ctx, v.laneLeft - 50, v.groundY, match.player, true, pal);
    drawBase(ctx, v.laneRight + 50, v.groundY, match.enemy, false, paletteFor(getEraByIndex(match.enemy.eraIndex).id));

    // 7) Turrets
    for (let i = 0; i < match.player.turretSlots.length; i++) {
      const t = match.player.turretSlots[i]; if (t) drawTurret(ctx, t, true);
    }
    for (let i = 0; i < match.enemy.turretSlots.length; i++) {
      const t = match.enemy.turretSlots[i]; if (t) drawTurret(ctx, t, false);
    }

    // 8) Special telegraphs
    drawSpecialTelegraph(ctx, match, match.player, true);
    drawSpecialTelegraph(ctx, match, match.enemy, false);

    // 9) Units — sorted by foot Y so they stack readably.
    const all = [...match.player.units, ...match.enemy.units];
    all.sort((a, b) => (a.y + (a.laneStagger || 0)) - (b.y + (b.laneStagger || 0)) || a.id - b.id);
    const playerAura = match.player.auraLeftMs > 0;
    const enemyAura  = match.enemy.auraLeftMs  > 0;
    for (const u of all) drawUnit(ctx, u, u.team === 'player' ? playerAura : enemyAura);

    // 10) Projectiles
    for (const p of match.pools.projectile.live) if (p.alive) drawProjectile(ctx, p);

    // 11) Particles (additive blending for a punchier look)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of match.pools.particle.live) if (p.alive) drawParticle(ctx, p);
    ctx.restore();

    // 11b) Special impact rings (over particles, under damage numbers)
    if (match.effects.rings && match.effects.rings.length > 0) {
      for (const r of match.effects.rings) drawRing(ctx, r);
    }

    // 11c) Painted-frame explosions — heavy deaths + point specials.
    if (match.effects.explosions && match.effects.explosions.length > 0) {
      for (const e of match.effects.explosions) drawPaintedExplosion(ctx, e);
    }

    // 12) Damage numbers
    for (const d of match.pools.damageNum.live) if (d.alive) drawDamageNumber(ctx, d);

    // 13) Era label
    drawEraLabel(ctx, w, match);

    ctx.restore();

    // 14) Era flash (post-shake, full screen)
    if (match.effects.flashMs > 0) {
      const a = (match.effects.flashMs / 600) * (match.effects.flashAlpha || 0.4);
      ctx.fillStyle = pal.flash;
      ctx.globalAlpha = Math.max(0, Math.min(0.6, a));
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }

  return { render, clearCache };
}

// ── Mountains ──────────────────────────────────────────────────────────
function drawMountains(ctx, w, h, v, pal, alpha, baseY) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = pal.mountain;
  ctx.beginPath();
  ctx.moveTo(0, v.groundY);
  // Two passes — far ridge in deep tint then a closer ridge in mid tint.
  for (let i = 0; i <= 16; i++) {
    const x = (i / 16) * w;
    const y = v.groundY - baseY + Math.sin(i * 1.7) * 22 + Math.cos(i * 3.1 + 0.5) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, v.groundY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ── Near rocks ─────────────────────────────────────────────────────────
function drawNearRocks(ctx, w, v, pal) {
  ctx.save();
  ctx.fillStyle = pal.mountain;
  ctx.globalAlpha = 0.85;
  // Foreground silhouettes — three pyramidal lumps far enough apart they
  // don't crowd the lane silhouettes. Deterministic (seeded by w).
  for (let i = 0; i < 4; i++) {
    const cx = (i / 4) * w + (w * 0.07);
    const peakY = v.groundY - 28 - ((i * 13) % 20);
    ctx.beginPath();
    ctx.moveTo(cx - 22, v.groundY);
    ctx.lineTo(cx, peakY);
    ctx.lineTo(cx + 22, v.groundY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ── Mid-layer motif ────────────────────────────────────────────────────
function drawMidMotif(ctx, w, h, v, pal, eraId, t) {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = pal.midMotif;
  if (eraId === 'ember-tribe') {
    // Floating embers
    for (let i = 0; i < 14; i++) {
      const x = (i * 80 + (t * 22) % w) % w;
      const y = v.groundY - 130 - (i * 6) % 50 + Math.sin(t * 2 + i) * 6;
      ctx.fillRect(x, y, 3, 3);
    }
  } else if (eraId === 'iron-dominion') {
    for (let i = 0; i < 10; i++) {
      const x = (i + 0.5) * (w / 10);
      const y = v.groundY - 140 + Math.sin(t + i) * 2;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (eraId === 'sun-foundry') {
    for (let i = 0; i < 5; i++) {
      const x = (i + 0.2) * (w / 5);
      const y0 = v.groundY - 160;
      ctx.beginPath();
      ctx.arc(x,      y0 + Math.sin(t + i) * 4,       18, 0, Math.PI * 2);
      ctx.arc(x + 14, y0 - 14 + Math.sin(t + i + 1) * 3, 14, 0, Math.PI * 2);
      ctx.arc(x - 14, y0 - 8  + Math.sin(t + i + 2) * 3, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (eraId === 'storm-republic') {
    // Lightning rods + arc flash
    ctx.fillRect(w * 0.2 - 1, v.groundY - 200, 2, 80);
    ctx.fillRect(w * 0.5 - 1, v.groundY - 220, 2, 100);
    ctx.fillRect(w * 0.8 - 1, v.groundY - 200, 2, 80);
    if (Math.sin(t * 6) > 0.7) {
      ctx.globalAlpha = 0.45;
      ctx.fillRect(w * 0.5 - 3, v.groundY - 220, 6, 100);
    }
  } else if (eraId === 'void-ascendancy') {
    ctx.globalAlpha = 0.28;
    for (let i = 0; i < 6; i++) {
      const x = (i + 0.5) * (w / 6) + Math.sin(t + i) * 14;
      const y = v.groundY - 150 + Math.cos(t + i) * 10;
      ctx.beginPath();
      ctx.ellipse(x, y, 28, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ── Ground ─────────────────────────────────────────────────────────────
function drawGround(_ctx, w, h, v, pal, ctx, eraId) {
  // Rebuild the gradient from cache (looked up via the renderer's cache).
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, v.groundY, w, h - v.groundY);
  ctx.fillStyle = pal.groundDetail;
  // Era-specific ground motif
  for (let x = 0; x < w; x += 28) {
    ctx.fillRect(x, v.groundY + 8, 2, 5);
    ctx.fillRect(x + 14, v.groundY + 24, 1, 3);
  }
  // Era-specific accent on the ground rim
  if (eraId === 'storm-republic' || eraId === 'void-ascendancy') {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = pal.midMotif;
    for (let x = 0; x < w; x += 60) ctx.fillRect(x, v.groundY - 1, 30, 1);
    ctx.restore();
  }
}

// ── Bases ──────────────────────────────────────────────────────────────
function drawBase(ctx, x, groundY, side, isPlayer, pal) {
  // Sprite path: blit the painted base if its asset is loaded.
  // The HP bar + label drawn afterwards stay procedural so they read
  // crisply even when the underlying art is busy.
  const eraN = side.eraIndex + 1;
  const key = `base/era${eraN}/${isPlayer ? 'player' : 'enemy'}`;
  if (assets.has(key)) {
    assets.draw(ctx, key, x, groundY + 8, { h: 200, flipX: false });
    drawBaseHpAndLabel(ctx, x, groundY, side, isPlayer);
    return;
  }
  // Wall block
  ctx.fillStyle = '#15171b';
  ctx.fillRect(x - 38, groundY - 90, 76, 90);
  // Banner stripe across the top
  ctx.fillStyle = pal.banner;
  ctx.fillRect(x - 38, groundY - 92, 76, 4);
  // Crenellations
  ctx.fillStyle = '#1f2329';
  for (let k = 0; k < 4; k++) ctx.fillRect(x - 36 + k * 20, groundY - 100, 10, 8);
  // Stone seam
  ctx.fillStyle = '#0a0d0e';
  for (let row = 0; row < 4; row++) ctx.fillRect(x - 38, groundY - 80 + row * 20, 76, 1);
  for (let col = 0; col < 6; col++) ctx.fillRect(x - 38 + col * 14 + (col % 2 ? 6 : 0), groundY - 80, 1, 80);
  // Door / banner curtain
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.fillRect(x - 8, groundY - 60, 16, 60);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1, groundY - 60, 2, 60);
  // Pennant pole + flag
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, groundY - 100);
  ctx.lineTo(x, groundY - 138);
  ctx.stroke();
  ctx.fillStyle = isPlayer ? pal.banner : pal.bannerEnemy;
  ctx.beginPath();
  ctx.moveTo(x, groundY - 138);
  ctx.lineTo(x + (isPlayer ? 22 : -22), groundY - 130);
  ctx.lineTo(x, groundY - 122);
  ctx.closePath();
  ctx.fill();
  drawBaseHpAndLabel(ctx, x, groundY, side, isPlayer);
}

// HP bar + side label — shared between procedural and sprite paths.
function drawBaseHpAndLabel(ctx, x, groundY, side, isPlayer) {
  const hpR = side.base.hp / side.base.maxHp;
  // HP bar sits above the silhouette so it reads against the sky.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - 48, groundY - 200, 96, 6);
  ctx.fillStyle = hpColor(hpR);
  ctx.fillRect(x - 48, groundY - 200, 96 * Math.max(0, hpR), 6);
  // Label sits just below the ground line.
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isPlayer ? 'YOU' : 'ENEMY', x, groundY + 28);
}

// ── Turrets ────────────────────────────────────────────────────────────
function drawTurret(ctx, t, isPlayer) {
  const x = t.x, y = t.y;
  const v = t.visual;
  const cdR = t.cooldownMaxMs ? (t.cooldownMs / t.cooldownMaxMs) : 0;
  const justFired = cdR > 0.85;

  // Sprite path: blit the painted turret if its idle frame is loaded.
  // We swap to the `-fire` frame for the brief justFired window, and
  // `-recoil` for the immediately-following one.
  const eraN = (t.eraIndex | 0) + 1;
  const idleKey   = `turret/era${eraN}`;
  if (assets.has(idleKey)) {
    let frameKey = idleKey;
    // justFired is true when cdR > 0.85 (top 15% of the cooldown).
    // Split into "fire" (top 7.5%) and "recoil" (next 7.5%).
    if (cdR > 0.92 && assets.has(`turret/era${eraN}-fire`))   frameKey = `turret/era${eraN}-fire`;
    else if (cdR > 0.85 && assets.has(`turret/era${eraN}-recoil`)) frameKey = `turret/era${eraN}-recoil`;
    const targetH = 64;
    const targetW = targetH * (938 / 307); // preserve sheet aspect (≈3:1)
    const flip = !isPlayer;
    ctx.save();
    if (flip) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      assets.draw(ctx, frameKey, 0, 0, { w: targetW, h: targetH, anchor: 'foot' });
    } else {
      assets.draw(ctx, frameKey, x, y, { w: targetW, h: targetH, anchor: 'foot' });
    }
    ctx.restore();
    return;
  }

  // Base plate (procedural fallback — used until the turret PNG loads)
  ctx.fillStyle = v.baseColor;
  ctx.fillRect(x - 12, y, 24, 10);
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 12, y + 8, 24, 2);
  // Mast
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(x - 1.5, y - 14, 3, 14);
  // Barrel
  ctx.fillStyle = v.barrelColor;
  if (v.kind === 'crossbow') {
    ctx.beginPath();
    ctx.moveTo(x - 14, y - 14); ctx.lineTo(x + 14, y - 14);
    ctx.lineTo(x + 12, y - 10); ctx.lineTo(x - 12, y - 10);
    ctx.closePath(); ctx.fill();
    // Bowstring
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 14, y - 14); ctx.lineTo(x + 14, y - 14); ctx.stroke();
  } else if (v.kind === 'bell') {
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 14); ctx.lineTo(x + 6, y - 14);
    ctx.lineTo(x + 12, y - 8);  ctx.lineTo(x - 12, y - 8);
    ctx.closePath(); ctx.fill();
  } else if (v.kind === 'cannon') {
    ctx.fillRect(x - 14, y - 18, 28, 8);
    ctx.fillRect(x - 16, y - 14, 4, 8);
    if (justFired) {
      ctx.fillStyle = '#ffe14f';
      ctx.beginPath(); ctx.arc(x + (isPlayer ? 14 : -14), y - 14, 5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (v.kind === 'tesla') {
    for (let k = -1; k <= 1; k++) ctx.fillRect(x + k * 6 - 1, y - 22, 2, 14);
    if (Math.sin(performance.now() / 30) > 0.5 || justFired) {
      ctx.strokeStyle = v.barrelColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x - 7, y - 24); ctx.lineTo(x + 7, y - 24); ctx.stroke();
    }
  } else if (v.kind === 'lance') {
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 22); ctx.lineTo(x + 4, y - 22);
    ctx.lineTo(x + (isPlayer ? 22 : -22), y - 14);
    ctx.lineTo(x - 4, y - 14);
    ctx.closePath(); ctx.fill();
    if (justFired) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = v.barrelColor;
      ctx.beginPath(); ctx.arc(x + (isPlayer ? 22 : -22), y - 18, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

// ── Special telegraph ──────────────────────────────────────────────────
function drawSpecialTelegraph(ctx, match, side, isPlayer) {
  const sa = side.specialActive;
  if (!sa) return;
  const pulse = (Math.sin(performance.now() / 80) + 1) / 2;
  ctx.save();
  ctx.globalAlpha = 0.35 + pulse * 0.35;
  ctx.fillStyle = isPlayer ? '#7be3ff' : '#ff486b';
  const v = match.view;
  if (sa.impactX != null) {
    const r = 80 + pulse * 14;
    ctx.beginPath();
    ctx.arc(sa.impactX, v.groundY - 10, r, 0, Math.PI * 2);
    ctx.fill();
    // Crosshair
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = isPlayer ? '#bef3ff' : '#ff8aa3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sa.impactX - r - 4, v.groundY - 10);
    ctx.lineTo(sa.impactX - r + 8, v.groundY - 10);
    ctx.moveTo(sa.impactX + r + 4, v.groundY - 10);
    ctx.lineTo(sa.impactX + r - 8, v.groundY - 10);
    ctx.stroke();
  } else {
    // Lane band
    ctx.fillRect(v.laneLeft, v.groundY - 30 - pulse * 6, v.laneRight - v.laneLeft, 4 + pulse * 4);
  }
  ctx.restore();
}

// Sprite-blit unit. Reads the painted hero pose from the manifest and
// blits it foot-anchored at the unit's x/y. Walk-frame animation lives
// in a future commit when we wire the multi-frame `<role>-sheet.png`.
function drawUnitSprite(ctx, u, x, y, spriteKey, sideAuraActive) {
  // Aura halo — same colour vocabulary as the procedural path.
  if (sideAuraActive) {
    const pulse = (Math.sin(performance.now() / 220) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18 + pulse * 0.18;
    ctx.fillStyle = '#ffcb6b';
    ctx.beginPath();
    ctx.ellipse(x, y - 18, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Foot shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 14, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sprite. Authoring is at single-frame ~183×102 — render at ~64 tall
  // for a battlefield-readable size that stays consistent across eras.
  const SCALE = BALANCE.UNIT_RENDER_SCALE || 1;
  const role = u.role;
  const targetH = role === 'heavy' ? 80 * SCALE : 64 * SCALE;
  // The frame's inherent aspect is ~1.79:1 (183/102) — preserve it.
  const targetW = targetH * 1.79;
  const flipX = u.facing < 0;
  ctx.save();
  if (flipX) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    assets.draw(ctx, spriteKey, 0, 0, { w: targetW, h: targetH, anchor: 'foot' });
  } else {
    assets.draw(ctx, spriteKey, x, y, { w: targetW, h: targetH, anchor: 'foot' });
  }
  ctx.restore();

  // HP bar (only when damaged, drawn over the sprite).
  const hpR = u.hp / u.maxHp;
  if (hpR < 0.999) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 18, y - targetH - 6, 36, 3);
    ctx.fillStyle = hpColor(hpR);
    ctx.fillRect(x - 18, y - targetH - 6, 36 * Math.max(0, hpR), 3);
  }
}

// ── Units ──────────────────────────────────────────────────────────────
function drawUnit(ctx, u, sideAuraActive) {
  // Interpolate between the previous-step end and the current-step end.
  // px/py are populated at the start of every sim step; on the first
  // step they equal x/y so the lerp is a no-op.
  const x = (u.px != null) ? u.px + (u.x - u.px) * _alpha : u.x;
  const y = ((u.py != null) ? u.py + (u.y - u.py) * _alpha : u.y) + (u.laneStagger || 0);

  // Try the painted sprite first. Each unit's content def carries
  // `eraId` (e.g. 'ember-tribe') — we map to the manifest's era index.
  const eraN = u.eraIndex != null ? u.eraIndex + 1 : ERA_BY_ID[u.eraId] || 1;
  const role = u.role;
  const spriteKey = `unit/era${eraN}/${role}`;
  if (assets.has(spriteKey)) {
    drawUnitSprite(ctx, u, x, y, spriteKey, sideAuraActive);
    return;
  }

  // Visual scale lifts silhouettes off the ground without touching
  // sim values (range / collision still use the content-data sizes).
  const SCALE = BALANCE.UNIT_RENDER_SCALE || 1;
  const w = (u.silhouetteW || 16) * SCALE;
  const h = (u.silhouetteH || 22) * SCALE;
  const halfW = w / 2;
  const colorBody = u.visual?.colorBody || u.color || '#888';
  const colorTrim = u.visual?.colorTrim || '#fff';
  const headR = (u.visual?.headRadius || 6) * SCALE;
  const isHeavy = u.role === 'heavy';

  // Walk bob (cosmetic only).
  const phase = (u.walkPhaseMs || 0) / 130;
  const bob = u.attackTickPhase === 'idle' ? Math.sin(phase) * (isHeavy ? 1.0 : 1.6) : 0;
  // Forward lean during windup.
  const lean = u.attackTickPhase === 'windup' ? u.facing * 3 : 0;

  // Sun Forge aura — soft pulsing halo behind buffed units.
  if (sideAuraActive) {
    const pulse = (Math.sin(performance.now() / 220) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.18 + pulse * 0.18;
    ctx.fillStyle = '#ffcb6b';
    ctx.beginPath();
    ctx.ellipse(x + lean, y - h * 0.4 + bob, halfW + 6 + pulse * 2, h * 0.7 + pulse * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Heavy units get a charge-up halo during windup.
  if (isHeavy && u.attackTickPhase === 'windup') {
    const chargeT = 1 - Math.max(0, u.attackTimerMs / u.attackWindupMs);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + chargeT * 0.35;
    ctx.fillStyle = colorTrim;
    ctx.beginPath();
    ctx.arc(x + lean, y - h * 0.4 + bob, h * 0.55 + chargeT * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Boots / shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, halfW + 2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — alternating phasing so the walk reads as a stride, not a hop.
  ctx.fillStyle = colorBody;
  if (u.attackTickPhase === 'idle' && !isHeavy) {
    const legPhase = (u.walkPhaseMs || 0) / 130;
    const legA = Math.sin(legPhase) * 2.4;
    const legB = -legA;
    const legW = Math.max(3, Math.floor(w / 2.4));
    ctx.fillRect(x - halfW + 1 + lean, y - 10 + bob - legA, legW, 10 + legA);
    ctx.fillRect(x + halfW - legW - 1 + lean, y - 10 + bob - legB, legW, 10 + legB);
  } else {
    // Static stance during windup/recover or for heavies (heavy stride is a planted thud).
    ctx.fillRect(x - halfW + lean, y - 10 + bob, w, 10);
  }
  // Torso
  ctx.fillRect(x - halfW + lean, y - 10 - h * 0.45 + bob, w, h * 0.45);
  // Trim band (banner)
  ctx.fillStyle = colorTrim;
  ctx.fillRect(x - halfW + lean, y - 10 - h * 0.45 + 3 + bob, w, 2);
  // Cape for heavies
  if (isHeavy) {
    ctx.fillStyle = colorTrim;
    ctx.beginPath();
    ctx.moveTo(x - halfW + lean - u.facing * 2, y - 10 - h * 0.20 + bob);
    ctx.lineTo(x - halfW + lean - u.facing * 8, y - 4 + bob);
    ctx.lineTo(x - halfW + lean - u.facing * 2, y - 4 + bob);
    ctx.closePath();
    ctx.fill();
  }
  // Head
  ctx.fillStyle = colorBody;
  ctx.beginPath();
  ctx.arc(x + lean, y - h * 0.66 + bob, headR, 0, Math.PI * 2);
  ctx.fill();
  // Helm crest for heavies
  if (isHeavy) {
    ctx.fillStyle = colorTrim;
    ctx.fillRect(x + lean - 1, y - h * 0.66 - headR - 4 + bob, 2, 5);
  }

  // Weapon
  const wx = x + u.facing * (halfW + 6) + lean;
  const wy = y - 18 + bob;
  drawWeapon(ctx, u.visual?.weaponShape || 'spear', wx, wy, u.facing, colorTrim, u.attackTickPhase);

  // Muzzle flash for ranged units the moment they fire.
  // Map the first 80ms of the recover window across the 4-frame sheet.
  if (u.projectileId && u.attackTickPhase === 'recover' && u.attackTimerMs > u.attackRecoverMs - 80) {
    const flashAge = (u.attackRecoverMs - u.attackTimerMs);  // 0..80
    const frame = Math.max(0, Math.min(3, Math.floor((flashAge / 80) * 4)));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85;
    assets.draw(ctx, 'vfx/muzzle-flash', wx + u.facing * 10, wy + 1, { frame, size: 28 });
    ctx.restore();
  }

  // HP bar (only when damaged)
  const hpR = u.hp / u.maxHp;
  if (hpR < 0.999) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - 14, y - h - 2 + bob, 28, 3);
    ctx.fillStyle = hpColor(hpR);
    ctx.fillRect(x - 14, y - h - 2 + bob, 28 * Math.max(0, hpR), 3);
  }
}

function drawWeapon(ctx, shape, x, y, facing, color, phase) {
  ctx.fillStyle = color;
  if (phase === 'windup') ctx.fillStyle = '#fff';
  switch (shape) {
    case 'club':       ctx.fillRect(x, y - 1, facing * 8,  3); break;
    case 'sling':      ctx.fillRect(x, y - 1, facing * 10, 2); break;
    case 'brand':      ctx.fillRect(x, y - 2, facing * 12, 4); break;
    case 'spear':      ctx.fillRect(x, y - 1, facing * 14, 2); break;
    case 'crossbow':   ctx.fillRect(x, y - 1, facing * 10, 2); ctx.fillRect(x + facing * 4, y - 4, 2, 8); break;
    case 'maul':       ctx.fillRect(x, y - 3, facing * 10, 6); break;
    case 'sabre':      ctx.fillRect(x, y - 1, facing * 11, 2); break;
    case 'rifle':      ctx.fillRect(x, y - 1, facing * 13, 2); break;
    case 'piledriver': ctx.fillRect(x, y - 4, facing * 12, 8); break;
    case 'bayonet':    ctx.fillRect(x, y - 1, facing * 14, 2); break;
    case 'arc-rifle':  ctx.fillRect(x, y - 1, facing * 13, 2); break;
    case 'howitzer':   ctx.fillRect(x, y - 4, facing * 16, 8); break;
    case 'edge':       ctx.fillRect(x, y - 2, facing * 10, 4); break;
    case 'lance':      ctx.fillRect(x, y - 1, facing * 16, 2); break;
    case 'colossus-fist': ctx.fillRect(x, y - 6, facing * 14, 12); break;
    default:           ctx.fillRect(x, y - 1, facing * 8, 2);
  }
}

// ── Projectiles ────────────────────────────────────────────────────────
function drawProjectile(ctx, p) {
  const x = (p.px != null) ? p.px + (p.x - p.px) * _alpha : p.x;
  const y = (p.py != null) ? p.py + (p.y - p.py) * _alpha : p.y;

  // Sprite path: blit the painted projectile if its asset is loaded,
  // rotated to point along the velocity vector.
  const spriteKey = `projectile/${p.defId}`;
  if (assets.has(spriteKey)) {
    const angle = Math.atan2(p.vy, p.vx);
    const size = p.kind === 'orb' ? 22 : 18;
    assets.draw(ctx, spriteKey, x, y, { size, angle });
    return;
  }

  if (p.kind === 'orb') {
    ctx.save();
    const r = p.size + 1;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    grad.addColorStop(0, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else {
    ctx.strokeStyle = p.colorTrail || p.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - p.vx * 0.025, y - p.vy * 0.025);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = p.color;
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }
}

// ── Particles ──────────────────────────────────────────────────────────
function drawParticle(ctx, p) {
  ctx.globalAlpha = Math.max(0, p.lifeMs / p.maxLifeMs);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  ctx.globalAlpha = 1;
}

// ── Painted-frame explosion ────────────────────────────────────────────
function drawPaintedExplosion(ctx, e) {
  const FRAMES = 12;
  const t = e.ageMs / e.lifeMs;
  const frame = Math.min(FRAMES - 1, Math.floor(t * FRAMES));
  // Subtle alpha falloff at the very end so the puff fades cleanly.
  const a = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.max(0, a);
  assets.draw(ctx, 'vfx/explosion-12', e.x, e.y, { frame, size: e.size });
  ctx.restore();
}

// ── Special impact rings ───────────────────────────────────────────────
function drawRing(ctx, r) {
  const t = r.ageMs / r.lifeMs;
  const expand = r.kind === 'point' ? 1 + t * 0.3 : 1;
  const alpha = 1 - t;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = alpha * 0.65;
  ctx.strokeStyle = r.color;
  ctx.lineWidth = 2 + (1 - t) * 2;
  ctx.beginPath();
  if (r.kind === 'lane' || r.kind === 'aura') {
    // Wide flat band — stretched ellipse over the lane line.
    ctx.ellipse(r.x, r.y, r.radius * expand, 14 + (1 - t) * 6, 0, 0, Math.PI * 2);
  } else {
    ctx.arc(r.x, r.y, r.radius * expand, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Damage numbers ─────────────────────────────────────────────────────
function drawDamageNumber(ctx, d) {
  const t = d.ageMs / d.lifeMs;
  ctx.globalAlpha = 1 - t;
  ctx.fillStyle = d.team === 'player' ? '#ffe14f' : '#ff8aa3';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(d.value), d.x, d.y);
  ctx.globalAlpha = 1;
}

// ── Era label ──────────────────────────────────────────────────────────
function drawEraLabel(ctx, w, match) {
  const playerEra = getEraByIndex(match.player.eraIndex);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`— ${playerEra.name.toUpperCase()} · ERA ${match.player.eraIndex + 1}/5 —`, w / 2, 24);
}
