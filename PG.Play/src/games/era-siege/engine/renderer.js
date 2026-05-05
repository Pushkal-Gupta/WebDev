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
  // Sky / ground gradients are now built per-frame by the placeholder
  // sky/ground draws (they vary with view height and groundY, both of
  // which already change rarely). Keeping a stub `clearCache` so the
  // index.jsx resize hook keeps working without an extra check.
  function clearCache() { /* no-op */ }

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

    // 1) Sky — no parallax (sky is "infinite")
    drawSky(ctx, v, playerEraIdx);

    // 2) Cloud band — drifts based on `t`
    drawClouds(ctx, v, playerEraIdx, match.timeSec);

    // Parallax driver — `match.timeSec` for idle drift; `shakeX` is
    // already applied to the canvas via the global ctx.translate above
    // so we pass 0 here (each bg layer just gets the drift component).
    const T = match.timeSec || 0;

    // 3) Far mountains — slowest scroll
    drawFarMountains(ctx, v, playerEraIdx, T, 0);

    // 4) Mid mountains — medium scroll
    drawMidMountains(ctx, v, playerEraIdx, T, 0);

    // 5) Ground
    drawGroundLayer(ctx, v, playerEraIdx);

    // 6) Foreground band — fastest scroll (closest layer to "camera")
    drawForeground(ctx, v, playerEraIdx, T, 0);

    // 6b) Ambient era motes — embers for Ember Tribe, dust for Iron,
    //     sparks for Foundry, rain flecks for Storm, void motes for
    //     Void Ascendancy. Lazily inits on first draw and ticks +
    //     advances per-frame, so it survives saves / unmounts cleanly.
    drawAmbientMotes(ctx, v, playerEra.id, T, _frameDt);

    // 7) Bases
    drawBase(ctx, v.laneLeft - 50, v.groundY, match.player, true, pal);
    drawBase(ctx, v.laneRight + 50, v.groundY, match.enemy, false, paletteFor(getEraByIndex(match.enemy.eraIndex).id));

    // 7) Turret spots (foundations only) — drawn before turrets so a
    //    placed turret sits on top of its slab.
    for (let i = 0; i < match.player.turretSlots.length; i++) {
      const hasSpot = match.player.turretSpots && match.player.turretSpots[i];
      if (hasSpot) drawTurretSpot(ctx, match.view, i, true,  !!match.player.turretSlots[i]);
    }
    for (let i = 0; i < match.enemy.turretSlots.length; i++) {
      const hasSpot = match.enemy.turretSpots && match.enemy.turretSpots[i];
      if (hasSpot) drawTurretSpot(ctx, match.view, i, false, !!match.enemy.turretSlots[i]);
    }
    // 7b) Turrets
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

    // 13) Era label — moved off the canvas; the era name is shown in the
    // TopBar's center zone now. See user feedback "no in-between text".
    // drawEraLabel(ctx, w, match);

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

// ── Ambient era motes ──────────────────────────────────────────────────
// Tiny drifting particles painted between the foreground and the bases.
// Per-era palette + motion gives each era a distinctive "atmosphere"
// without needing extra art:
//
//   ember-tribe    — orange embers rising + flickering
//   iron-dominion  — pale dust drifting sideways
//   sun-foundry    — yellow sparks rising fast + spinning
//   storm-republic — cyan rain flecks falling at a slight slant
//   void-ascendancy — magenta void motes orbiting slowly
//
// State lives on `_motes` keyed by era — we re-use the buffer when
// the era changes (reseeded with the new palette).

const ERA_MOTE_CONFIG = {
  'ember-tribe':     { count: 40, spawnW: 1.0, color: '#ff8a3a', glow: '#ffd05a',  vy: -22, vyJ: 14, vx: 6,   vxJ: 12, life: 4.0, size: 2.0, mode: 'rise' },
  'iron-dominion':   { count: 36, spawnW: 1.0, color: '#cdc8c0', glow: '#ffffff',  vy: -4,  vyJ: 6,  vx: 28,  vxJ: 18, life: 5.0, size: 1.5, mode: 'drift' },
  'sun-foundry':     { count: 50, spawnW: 1.0, color: '#ffcb6b', glow: '#fff0a0',  vy: -34, vyJ: 18, vx: 4,   vxJ: 16, life: 3.0, size: 1.6, mode: 'rise' },
  'storm-republic':  { count: 60, spawnW: 1.0, color: '#7be3ff', glow: '#bef3ff',  vy: 90,  vyJ: 18, vx: -22, vxJ: 8,  life: 2.5, size: 1.4, mode: 'fall' },
  'void-ascendancy': { count: 32, spawnW: 1.0, color: '#c89bff', glow: '#e9c8ff',  vy: 0,   vyJ: 4,  vx: 0,   vxJ: 0,  life: 5.0, size: 2.4, mode: 'orbit' },
};

let _motes = [];        // active mote pool (single buffer, era-keyed)
let _motesEra = null;   // last era id used to (re)seed the buffer

function _seedMotes(eraId, view) {
  const cfg = ERA_MOTE_CONFIG[eraId];
  if (!cfg) { _motes = []; return; }
  _motes = [];
  for (let i = 0; i < cfg.count; i++) {
    _motes.push(_freshMote(cfg, view, true));
  }
  _motesEra = eraId;
}

function _freshMote(cfg, view, anywhere) {
  // For 'rise' / 'fall' modes the mote spawns OFF-SCREEN on the leading
  // edge so the first frame doesn't show a sudden swarm. `anywhere`
  // (used at seed time) lets us scatter across the full canvas.
  let x, y;
  if (anywhere) {
    x = Math.random() * view.w;
    y = Math.random() * view.groundY;
  } else if (cfg.mode === 'fall') {
    x = Math.random() * view.w;
    y = -10;
  } else if (cfg.mode === 'rise') {
    x = Math.random() * view.w;
    y = view.groundY + 8;
  } else if (cfg.mode === 'drift') {
    x = -10;
    y = Math.random() * view.groundY;
  } else { // orbit
    x = Math.random() * view.w;
    y = Math.random() * view.groundY;
  }
  return {
    x, y,
    vx: cfg.vx + (Math.random() - 0.5) * cfg.vxJ,
    vy: cfg.vy + (Math.random() - 0.5) * cfg.vyJ,
    life: Math.random() * cfg.life,
    maxLife: cfg.life * (0.7 + Math.random() * 0.6),
    phase: Math.random() * Math.PI * 2,
  };
}

function drawAmbientMotes(ctx, view, eraId, t, dt) {
  const cfg = ERA_MOTE_CONFIG[eraId];
  if (!cfg) return;
  if (_motesEra !== eraId || _motes.length === 0) _seedMotes(eraId, view);
  const stepDt = Math.max(0.001, Math.min(0.05, dt || 1 / 60));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const m of _motes) {
    if (cfg.mode === 'orbit') {
      // Slow swirl — vx/vy oscillate via a per-mote phase. Visual feels
      // like a calm drift rather than streaks.
      m.phase += stepDt * 0.6;
      m.x += Math.cos(m.phase) * 12 * stepDt;
      m.y += Math.sin(m.phase) * 8 * stepDt;
    } else {
      m.x += m.vx * stepDt;
      m.y += m.vy * stepDt;
    }
    m.life += stepDt;
    // Recycle off-screen / dead motes back to a fresh spawn.
    const dead = (
         m.life >= m.maxLife
      || m.x < -16 || m.x > view.w + 16
      || m.y < -16 || m.y > view.groundY + 16
    );
    if (dead) {
      const fresh = _freshMote(cfg, view, false);
      m.x = fresh.x; m.y = fresh.y;
      m.vx = fresh.vx; m.vy = fresh.vy;
      m.life = 0;
      m.maxLife = fresh.maxLife;
      m.phase = fresh.phase;
    }
    // Fade in/out over the mote's life.
    const lifeR = m.life / m.maxLife;
    const alpha = lifeR < 0.2
      ? lifeR / 0.2
      : lifeR > 0.8 ? (1 - lifeR) / 0.2 : 1;
    const flicker = 0.7 + 0.3 * Math.sin(m.phase + t * 8);
    const sizePx = cfg.size * (0.8 + 0.4 * Math.sin(m.phase * 2));
    // Outer glow halo — bigger, softer.
    ctx.globalAlpha = Math.max(0, alpha * 0.45 * flicker);
    ctx.fillStyle = cfg.glow;
    ctx.beginPath();
    ctx.arc(m.x, m.y, sizePx * 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Inner core.
    ctx.globalAlpha = Math.max(0, alpha * flicker);
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.arc(m.x, m.y, sizePx, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Bases ──────────────────────────────────────────────────────────────
function drawBase(ctx, x, groundY, side, isPlayer, pal) {
  // Sprite path: blit the painted base if its asset is loaded.
  // The HP bar + label drawn afterwards stay procedural so they read
  // crisply even when the underlying art is busy.
  const eraN = side.eraIndex + 1;
  const key = `base/era${eraN}/${isPlayer ? 'player' : 'enemy'}`;
  // Damage flash — additive glow centred on the impact zone while
  // baseFlashMs > 0. Source-atop tinting against an alpha sprite is
  // tricky on canvas2d (the sprite is already composited against the
  // sky), so we settle for a punchy radial glow that's visually sharp
  // and unmistakably "I just got hit".
  const flashMs = side.baseFlashMs || 0;
  const flashAlpha = flashMs > 0 ? Math.min(0.85, flashMs / 160 * 0.85) : 0;
  if (assets.has(key)) {
    assets.draw(ctx, key, x, groundY + 8, { h: BALANCE.BASE_RENDER_H_PX || 200, flipX: false });
    if (flashAlpha > 0) {
      const baseH = BALANCE.BASE_RENDER_H_PX || 200;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(x, groundY - baseH * 0.45, 4,
                                            x, groundY - baseH * 0.45, 90);
      glow.addColorStop(0,   `rgba(255,255,255,${flashAlpha})`);
      glow.addColorStop(0.4, `rgba(255,225,79,${flashAlpha * 0.55})`);
      glow.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, groundY - baseH * 0.45, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
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

// Base HP visualization — much more prominent. Wide bar with percentage,
// rounded background, drop shadow, and a side label below the ground.
function drawBaseHpAndLabel(ctx, x, groundY, side, isPlayer) {
  const hpR = Math.max(0, side.base.hp / side.base.maxHp);
  const barW = 240;
  const barH = 18;
  const barX = x - barW / 2;
  const barY = groundY - 250;
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, barX - 1, barY + 2, barW + 2, barH, 4);
  ctx.fill();
  // Track
  ctx.fillStyle = 'rgba(8,10,14,0.85)';
  roundRect(ctx, barX, barY, barW, barH, 4);
  ctx.fill();
  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Fill (gradient: green/yellow/red by ratio)
  const fillW = (barW - 4) * hpR;
  if (fillW > 0) {
    const fillColor = hpColor(hpR);
    const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
    grad.addColorStop(0, fillColor);
    grad.addColorStop(1, shadeHex(fillColor, -25));
    ctx.fillStyle = grad;
    roundRect(ctx, barX + 2, barY + 2, fillW, barH - 4, 3);
    ctx.fill();
  }
  // Percentage text centered
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 3;
  ctx.fillText(`${Math.round(hpR * 100)}%`, x, barY + barH / 2 + 1);
  ctx.shadowBlur = 0;
  ctx.textBaseline = 'alphabetic';
  // Side label below the ground line
  ctx.fillStyle = isPlayer ? '#7be3ff' : '#ff8aa3';
  ctx.font = 'bold 12px "JetBrains Mono", monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 2;
  ctx.fillText(isPlayer ? 'YOUR BASE' : 'ENEMY BASE', x, groundY + 30);
  ctx.shadowBlur = 0;
}

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

function shadeHex(hex, amount) {
  if (!hex || hex[0] !== '#') return hex;
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
  return `#${(r * 65536 + g * 256 + b).toString(16).padStart(6, '0')}`;
}

// ── Turret spots ──────────────────────────────────────────────────────
//
// A "laid foundation" — the slab the player puts down before deciding
// which turret to drop in. Drawn at the same x/y where a turret in
// that slot would sit, so once the turret is placed it lands on top
// of its own slab.
function drawTurretSpot(ctx, view, slot, isPlayer, hasTurret) {
  const x = isPlayer ? view.laneLeft - 22 : view.laneRight + 22;
  const y = view.groundY - BALANCE.TURRET_ROW_Y_PX - slot * 22;
  ctx.save();
  // Stone slab
  ctx.fillStyle = '#3a3f48';
  ctx.fillRect(x - 16, y + 2, 32, 8);
  ctx.fillStyle = '#1c2128';
  ctx.fillRect(x - 16, y + 8, 32, 2);
  // Corner posts (only when no turret has been placed yet — once the
  // turret is up they'd clip through its base plate).
  if (!hasTurret) {
    ctx.fillStyle = '#3a3f48';
    ctx.fillRect(x - 14, y - 4, 4, 6);
    ctx.fillRect(x + 10, y - 4, 4, 6);
    // "Empty" hint dot pulsing in the centre — telegraphs that this
    // foundation is awaiting a turret.
    const t = (Math.sin(performance.now() / 380) + 1) / 2;
    ctx.globalAlpha = 0.45 + t * 0.35;
    ctx.fillStyle = '#ffe14f';
    ctx.beginPath(); ctx.arc(x, y - 4, 1.6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
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

// Sprite-blit unit. Reads the static hero pose from the manifest and
// blits it foot-anchored, with a walk-bob, attack-lean, and windup glow
// driven from the sim's animation state — the same animation the
// procedural path applies, so swapping in baked sprites doesn't lose
// any of the on-lane motion language.
function drawUnitSprite(ctx, u, x, y, spriteKey, sideAuraActive) {
  const isGeneral = u.role === 'general';
  const isHeavy = u.role === 'heavy' || isGeneral;
  const isChampion = !!u.isChampion;
  const SCALE = BALANCE.UNIT_RENDER_SCALE || 1;
  // Generals render bigger — they're the era centerpiece. Heavy = 80,
  // general = 110 (≈40% taller than heavy on the same canvas).
  // Champions are scaled an additional 25 % so they read as bosses.
  const baseH = (isGeneral ? 110 : isHeavy ? 80 : 64);
  const targetH = baseH * SCALE * (isChampion ? 1.25 : 1);
  const nat = assets.naturalSize(spriteKey);
  const aspect = nat ? nat.w / nat.h : 0.6;
  const targetW = targetH * aspect;

  // ── Animation state ──────────────────────────────────────────────
  // Walk-bob: small Y oscillation while idle (i.e. walking the lane).
  // Heavies bob slightly less so they read as planted-thud movers.
  const walkPhase = (u.walkPhaseMs || 0) / 130;
  const bob = u.attackTickPhase === 'idle'
    ? Math.sin(walkPhase) * (isHeavy ? 1.4 : 2.2)
    : 0;
  // Forward lean during attack windup — telegraphs the strike.
  const lean = u.attackTickPhase === 'windup' ? u.facing * 4 : 0;
  // Slight scale pop on the recover frame so impacts feel weighty.
  const pop = u.attackTickPhase === 'recover' ? 1.05 : 1;

  // ── Aura halo (Sun Forge etc.) ───────────────────────────────────
  if (sideAuraActive) {
    const pulse = (Math.sin(performance.now() / 220) + 1) / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.20 + pulse * 0.20;
    ctx.fillStyle = '#ffcb6b';
    ctx.beginPath();
    ctx.ellipse(x + lean, y - targetH * 0.45 + bob, targetW * 0.55, targetH * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Heavy charge halo during windup ──────────────────────────────
  if (isHeavy && u.attackTickPhase === 'windup') {
    const chargeT = 1 - Math.max(0, u.attackTimerMs / u.attackWindupMs);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.30 + chargeT * 0.40;
    ctx.fillStyle = u.visual?.colorTrim || '#ffe14f';
    ctx.beginPath();
    ctx.arc(x + lean, y - targetH * 0.45 + bob, targetH * 0.42 + chargeT * 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Champion halo + crown ────────────────────────────────────────
  // Boss-wave champions get a persistent red-orange aura that pulses
  // slowly + a small crown shape above the head so they read as
  // distinct from regular units of the same role.
  if (isChampion && !u.dead) {
    const pulseT = 0.55 + Math.sin(performance.now() / 380) * 0.20;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulseT;
    const grad = ctx.createRadialGradient(
      x + lean, y - targetH * 0.5, targetH * 0.20,
      x + lean, y - targetH * 0.5, targetH * 0.95,
    );
    grad.addColorStop(0, '#ff6048');
    grad.addColorStop(0.5, 'rgba(255,96,72,0.4)');
    grad.addColorStop(1, 'rgba(255,96,72,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + lean, y - targetH * 0.5, targetH * 0.95, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Crown glyph drawn procedurally — 5 points on a small bar.
    const crownX = x + lean;
    const crownY = y - targetH - 18;
    const crownW = Math.max(18, targetW * 0.42);
    const crownH = 9;
    ctx.save();
    ctx.fillStyle = '#ffd14a';
    ctx.strokeStyle = '#7a4a10';
    ctx.lineWidth = 1.5;
    // base bar
    ctx.fillRect(crownX - crownW / 2, crownY + crownH * 0.5, crownW, crownH * 0.5);
    ctx.strokeRect(crownX - crownW / 2, crownY + crownH * 0.5, crownW, crownH * 0.5);
    // 3 spikes
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const px = crownX - crownW / 2 + (crownW / 3) * (i + 0.5);
      ctx.moveTo(px - crownW / 8, crownY + crownH * 0.5);
      ctx.lineTo(px,                 crownY - crownH * 0.4);
      ctx.lineTo(px + crownW / 8,   crownY + crownH * 0.5);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // ── Foot shadow — sized to the sprite, sits at the actual foot ───
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, targetW * 0.36, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Sprite blit (with bob + lean + pop) ──────────────────────────
  const flipX = u.facing < 0;
  const dx = x + lean;
  const dy = y + bob;
  const dw = targetW * pop;
  const dh = targetH * pop;
  // Death animation: fade alpha to 0 over ~380ms while tilting forward
  // (away from the attacker) so the body falls toward the lane it was
  // pushing into. Drives off `u.deathAgeMs` set by the sim sweep.
  const deathT = u.dead ? Math.min(1, (u.deathAgeMs || 0) / 380) : 0;
  const deathAlpha = deathT > 0 ? 1 - deathT : 1;
  const deathTilt  = deathT > 0 ? deathT * 0.85 * u.facing : 0;
  const deathSink  = deathT > 0 ? deathT * 4 : 0;          // sink slightly into ground
  ctx.save();
  ctx.globalAlpha *= deathAlpha;
  if (flipX) {
    ctx.translate(dx, dy + deathSink);
    ctx.scale(-1, 1);
    if (deathTilt) ctx.rotate(-deathTilt);
    assets.draw(ctx, spriteKey, 0, 0, { w: dw, h: dh, anchor: 'foot' });
  } else if (deathTilt) {
    ctx.translate(dx, dy + deathSink);
    ctx.rotate(deathTilt);
    assets.draw(ctx, spriteKey, 0, 0, { w: dw, h: dh, anchor: 'foot' });
  } else {
    assets.draw(ctx, spriteKey, dx, dy + deathSink, { w: dw, h: dh, anchor: 'foot' });
  }
  ctx.restore();
  // Skip HP bar etc. for dead units (the "HP" rendered would always be 0).
  if (u.dead) return;

  // ── Muzzle flash for ranged units the moment they fire ───────────
  if (u.projectileId && u.attackTickPhase === 'recover' && u.attackTimerMs > u.attackRecoverMs - 80) {
    const flashAge = u.attackRecoverMs - u.attackTimerMs;  // 0..80
    const frame = Math.max(0, Math.min(3, Math.floor((flashAge / 80) * 4)));
    const wx = dx + u.facing * (targetW * 0.45);
    const wy = dy - targetH * 0.55;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85;
    assets.draw(ctx, 'vfx/muzzle-flash', wx, wy, { frame, size: 32 });
    ctx.restore();
  }

  // ── HP bar (only when damaged) ───────────────────────────────────
  const hpR = u.hp / u.maxHp;
  if (hpR < 0.999) {
    const barW = Math.max(28, targetW * 0.55);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x - barW / 2, y - targetH - 6, barW, 3);
    ctx.fillStyle = hpColor(hpR);
    ctx.fillRect(x - barW / 2, y - targetH - 6, barW * Math.max(0, hpR), 3);
  }
}

// ── Units ──────────────────────────────────────────────────────────────
//
// One render path now: `drawUnitSprite`. It calls `assets.draw(spriteKey)`
// which transparently uses the baked PNG when loaded, and the registered
// `placeholderUnit` (rich procedural body) while loading or if the PNG
// 404s. Both produce the same visual style — the user no longer sees a
// "loading" stick-figure pop into a different "loaded" silhouette.
function drawUnit(ctx, u, sideAuraActive) {
  // Interpolate between the previous-step end and the current-step end.
  // px/py are populated at the start of every sim step; on the first
  // step they equal x/y so the lerp is a no-op.
  const x = (u.px != null) ? u.px + (u.x - u.px) * _alpha : u.x;
  const y = ((u.py != null) ? u.py + (u.y - u.py) * _alpha : u.y) + (u.laneStagger || 0);

  // Resolve the sprite key. eraIndex on the unit is set at spawn-time
  // by trySpawnUnit; if that's missing for any reason we fall through
  // to the era-by-id lookup table.
  const eraN = u.eraIndex != null ? u.eraIndex + 1 : ERA_BY_ID[u.eraId] || 1;
  const role = u.role;
  const spriteKey = `unit/era${eraN}/${role}`;
  drawUnitSprite(ctx, u, x, y, spriteKey, sideAuraActive);
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

// ── Damage / loot numbers ──────────────────────────────────────────────
//
// Three kinds in one pool:
//   damage → faction-coloured numerals, fade upward, lifeMs 800
//   gold   → "+Xg" in gold with shadow + glow, lifeMs 1100
//   xp     → "+Xxp" in cyan with shadow, lifeMs 1100
function drawDamageNumber(ctx, d) {
  const t = d.ageMs / d.lifeMs;
  // Apply float — vy starts up, decelerates with squared age. Horizontal
  // drift is small so stacked pops don't overlap.
  const ageS = d.ageMs / 1000;
  const yOff = (d.vy || -28) * ageS - 24 * ageS * ageS;
  const xOff = (d.vx || 0) * ageS;
  const alpha = 1 - t * t;   // ease-out fade
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let label, color, font, shadow;
  if (d.kind === 'gold') {
    label  = `+${d.value}g`;
    color  = '#ffe14f';
    shadow = 'rgba(0,0,0,0.85)';
    // Slight scale pop in the first 120 ms — feels like a coin appearing.
    const pop = Math.min(1, ageS * 8);
    const size = 13 + (1 - pop) * 6;
    font = `bold ${size}px "JetBrains Mono", monospace`;
  } else if (d.kind === 'xp') {
    label  = `+${d.value}xp`;
    color  = '#7be3ff';
    shadow = 'rgba(0,0,0,0.85)';
    font   = 'bold 11px "JetBrains Mono", monospace';
  } else {
    label  = String(d.value);
    color  = d.team === 'player' ? '#ffe14f' : '#ff8aa3';
    shadow = 'rgba(0,0,0,0.7)';
    font   = 'bold 12px "JetBrains Mono", monospace';
  }
  ctx.font = font;
  ctx.shadowColor = shadow;
  ctx.shadowBlur = 4;
  ctx.fillStyle = color;
  ctx.fillText(label, d.x + xOff, d.y + yOff);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Era label ──────────────────────────────────────────────────────────
function drawEraLabel(ctx, w, match) {
  const playerEra = getEraByIndex(match.player.eraIndex);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`— ${playerEra.name.toUpperCase()} · ERA ${match.player.eraIndex + 1}/5 —`, w / 2, 24);
}
