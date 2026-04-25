// GOALBOUND — canvas renderer.
//
//   Pure draw pipeline. Takes the match state + arena and paints a
//   frame. No simulation side-effects. Called every rAF from the
//   match screen.

import { PHYSICS } from '../content.js';
const { W, H, FLOOR, P_W, P_H, BALL_R, GOAL_W, GOAL_H } = PHYSICS;

export const drawFrame = (ctx, s, arena, opts = {}) => {
  const { home, away } = opts;
  const shake = s.shake.t > 0 ? (Math.random() - 0.5) * s.shake.amp * (s.shake.t / 0.5) : 0;
  const shakeY = s.shake.t > 0 ? (Math.random() - 0.5) * s.shake.amp * (s.shake.t / 0.5) * 0.4 : 0;

  ctx.save();
  ctx.translate(shake, shakeY);

  // Sky / stadium gradient
  const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
  sky.addColorStop(0, arena.sky[0]);
  sky.addColorStop(1, arena.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, FLOOR);

  // Stadium stands with crowd dots
  drawStands(ctx, arena, s);

  // Light arc up top
  drawLightArc(ctx, arena);

  // Pitch
  const pg = ctx.createLinearGradient(0, FLOOR, 0, H);
  pg.addColorStop(0, arena.pitch[0]);
  pg.addColorStop(1, arena.pitch[1]);
  ctx.fillStyle = pg;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);

  // Pitch stripes
  for (let i = 0; i < 12; i++) {
    if (i % 2) continue;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, FLOOR + i * 5, W, 5);
  }

  // Midline + halo (under goals for z order)
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, FLOOR); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath(); ctx.arc(W / 2, FLOOR - 90, 56, 0, Math.PI * 2); ctx.stroke();

  // Goals
  drawGoal(ctx, 0,         'left',  home.primary);
  drawGoal(ctx, W - GOAL_W, 'right', away.primary);

  // Effects (behind players mostly — bounces/dust/rings)
  drawEffects(ctx, s.effects, 'back');

  // Players
  drawPlayer(ctx, s.home, home.primary, home.secondary, 'home');
  drawPlayer(ctx, s.away, away.primary, away.secondary, 'away');

  // Ball (with trail and spin glyph)
  drawBall(ctx, s.ball);

  // Effects foreground (sparks, confetti)
  drawEffects(ctx, s.effects, 'front');

  // Weather overlays
  if (opts.weather) drawWeather(ctx, opts.weather, s);

  // Kickoff freeze ring
  if (s.kickOffT > 0) {
    const alpha = Math.max(0, s.kickOffT / 0.8);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(W / 2, FLOOR - 180, 20 + (1 - alpha) * 40, 0, Math.PI * 2); ctx.stroke();
  }

  // Goal flash
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, s.flash)})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Celebration overlay
  if (s.celebT > 0) {
    const tint = s.celebFor === 'home' ? home.primary : away.primary;
    ctx.fillStyle = `${hexToRgba(tint, 0.18)}`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Lora", serif';
    ctx.textAlign = 'center';
    const bob = Math.sin((1.6 - s.celebT) * 10) * 4;
    ctx.fillText('GOAL!', W / 2, H / 2 + bob);
    ctx.font = 'bold 14px "Space Mono", monospace';
    ctx.fillStyle = hexToRgba(tint, 1);
    ctx.fillText(s.celebFor === 'home' ? home.name.toUpperCase() : away.name.toUpperCase(), W / 2, H / 2 + 34);
  }

  // Golden goal banner (persistent while in golden)
  if (s.golden && s.celebT <= 0 && s.status !== 'ended') {
    ctx.fillStyle = 'rgba(255, 183, 77, 0.08)';
    ctx.fillRect(0, 0, W, 34);
    ctx.fillStyle = '#ffb74d';
    ctx.font = 'bold 12px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOLDEN GOAL', W / 2, 22);
  }

  ctx.restore();
};

const drawStands = (ctx, arena, s) => {
  const pulse = s.crowdPulse || 0;
  for (let i = 0; i < 60; i++) {
    const x = i * 13, h = 18 + (i * 31 % 22);
    const bob = Math.sin((performance.now() / 400) + i) * pulse * 1.8;
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.26)';
    ctx.fillRect(x, FLOOR - 100 - h + bob, 12, h);
  }
  // crowd dots
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 90; i++) {
      const x = (i * 9 + row * 4) % W;
      const y = FLOOR - 86 - row * 8 + Math.sin((performance.now() / 300) + i * 0.3 + row) * pulse;
      ctx.fillStyle = (i + row) % 3 === 0
        ? hexToRgba(arena.lights, 0.12 + pulse * 0.3)
        : 'rgba(255,255,255,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
};

const drawLightArc = (ctx, arena) => {
  const grad = ctx.createRadialGradient(W / 2, -60, 20, W / 2, -60, 320);
  grad.addColorStop(0, hexToRgba(arena.lights, 0.30));
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, FLOOR);
};

const drawGoal = (ctx, x, side, accent) => {
  const y = FLOOR - GOAL_H;
  ctx.fillStyle = 'rgba(6,12,18,0.45)';
  ctx.fillRect(x, y, GOAL_W, GOAL_H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  if (side === 'left') {
    ctx.beginPath();
    ctx.moveTo(x + GOAL_W, y); ctx.lineTo(x, y); ctx.lineTo(x, FLOOR); ctx.lineTo(x + GOAL_W, FLOOR);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + GOAL_W, y); ctx.lineTo(x + GOAL_W, FLOOR); ctx.lineTo(x, FLOOR);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(x + (i * GOAL_W / 7), y); ctx.lineTo(x + (i * GOAL_W / 7), FLOOR); ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(x, y + (i * GOAL_H / 4)); ctx.lineTo(x + GOAL_W, y + (i * GOAL_H / 4)); ctx.stroke();
  }
};

const drawPlayer = (ctx, p, primary, secondary, side) => {
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath(); ctx.ellipse(p.x + P_W / 2, FLOOR - 1, 18, 3.5, 0, 0, Math.PI * 2); ctx.fill();

  // squash/stretch
  const squash = p.squash > 0 ? 1 + p.squash * 0.3 : p.landing > 0 ? 1 - p.landing * 0.25 : 1;
  const stretchX = p.squash > 0 ? 1 - p.squash * 0.15 : p.landing > 0 ? 1 + p.landing * 0.2 : 1;
  const cx = p.x + P_W / 2;
  const baseY = p.y + P_H;

  ctx.save();
  ctx.translate(cx, baseY);
  ctx.scale(stretchX, squash);
  ctx.translate(-cx, -baseY);

  // body (jersey)
  ctx.fillStyle = primary;
  roundRect(ctx, p.x, p.y + 12, P_W, P_H - 22, 6); ctx.fill();
  // collar stripe
  ctx.fillStyle = secondary;
  ctx.fillRect(p.x, p.y + 12, P_W, 4);
  // shorts
  ctx.fillStyle = secondary;
  roundRect(ctx, p.x + 2, p.y + 28, P_W - 4, 12, 3); ctx.fill();
  // head
  ctx.fillStyle = '#1a1616';
  ctx.beginPath(); ctx.arc(cx, p.y + 8, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  // eye hint
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + (p.facing > 0 ? 2 : -4), p.y + 6, 2, 2);

  // leg
  ctx.strokeStyle = primary;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const legEx = p.kickAnim > 0 ? 22 : 6 + Math.abs(p.vx) * 0.012;
  const dir = p.facing;
  ctx.beginPath();
  ctx.moveTo(cx, p.y + P_H - 14);
  ctx.lineTo(cx + dir * legEx, p.y + P_H);
  ctx.stroke();

  // arm (tiny)
  ctx.strokeStyle = primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x + (dir > 0 ? P_W - 4 : 4), p.y + 18);
  const swing = Math.abs(p.vx) > 20 ? Math.sin(performance.now() / 100 + p.x) * 4 : 0;
  ctx.lineTo(p.x + (dir > 0 ? P_W + 3 : -3), p.y + 24 + swing);
  ctx.stroke();

  ctx.restore();
};

const drawBall = (ctx, ball) => {
  // Strong-kick trail (set by the engine when the ball is launched at
  // >70% charge): draw 6 fading positional ghosts behind the ball.
  if (ball.trail && ball.trail.length) {
    const TRAIL_LIFE = 0.4;
    for (let i = ball.trail.length - 1; i >= 0; i--) {
      const t = ball.trail[i];
      const k = 1 - Math.min(1, t.age / TRAIL_LIFE);
      if (k <= 0) continue;
      ctx.fillStyle = `rgba(255,230,168,${(0.45 * k).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, BALL_R * (0.6 + 0.4 * k), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Idle motion smear (cheap velocity-based ghost — original behaviour).
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 4; i++) {
      const k = (i + 1) / 5;
      ctx.beginPath();
      ctx.arc(ball.x - ball.vx * 0.008 * k, ball.y - ball.vy * 0.008 * k, BALL_R * (1 - k * 0.3), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // ball
  ctx.fillStyle = '#f3f6f8';
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0a0d0e'; ctx.lineWidth = 1.1; ctx.stroke();
  // pentagon hint (rotated by spin)
  const rot = (ball.spin || 0) * (performance.now() / 1200);
  ctx.save();
  ctx.translate(ball.x, ball.y);
  ctx.rotate(rot);
  ctx.fillStyle = '#0a0d0e';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const r = 4.8;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
};

const drawEffects = (ctx, list, pass) => {
  for (const e of list) {
    const tone = 1 - e.age / e.life;
    if (pass === 'back' && (e.kind === 'dust' || e.kind === 'ring')) drawEffect(ctx, e, tone);
    else if (pass === 'front' && (e.kind === 'spark' || e.kind === 'confetti')) drawEffect(ctx, e, tone);
  }
};
const drawEffect = (ctx, e, tone) => {
  if (e.kind === 'ring') {
    const k = 1 - tone;
    ctx.strokeStyle = e.color.replace(/0\.9\)/, `${tone.toFixed(2)})`);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r0 + (e.r1 - e.r0) * k, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  if (e.kind === 'confetti') {
    ctx.fillStyle = e.color;
    ctx.globalAlpha = Math.max(0, tone);
    ctx.fillRect(e.x, e.y, e.size, e.size);
    ctx.globalAlpha = 1;
    return;
  }
  if (e.kind === 'spark') {
    ctx.fillStyle = e.color;
    ctx.globalAlpha = Math.max(0, tone);
    ctx.fillRect(e.x, e.y, 2.5, 2.5);
    ctx.globalAlpha = 1;
    return;
  }
  if (e.kind === 'dust') {
    ctx.fillStyle = e.color;
    ctx.globalAlpha = Math.max(0, tone * 0.7);
    ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
};

const drawWeather = (ctx, w, s) => {
  if (w.rain) {
    ctx.strokeStyle = 'rgba(200,220,240,0.35)';
    ctx.lineWidth = 1;
    const n = 70;
    const t = performance.now();
    for (let i = 0; i < n; i++) {
      const x = ((i * 97 + t * 0.5) % W);
      const y = ((i * 61 + t * 1.2) % H);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 8);
      ctx.stroke();
    }
  }
  if (w.snow) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const n = 50;
    const t = performance.now();
    for (let i = 0; i < n; i++) {
      const x = ((i * 73 + t * 0.12 + Math.sin(t * 0.002 + i) * 20) % W + W) % W;
      const y = ((i * 41 + t * 0.35) % H + H) % H;
      ctx.beginPath(); ctx.arc(x, y, 1.4, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (w.wind > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + w.wind * 0.08})`;
    ctx.lineWidth = 1;
    const t = performance.now();
    for (let i = 0; i < 18; i++) {
      const y = (i * 23 + t * 0.3) % FLOOR;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y + 6 * w.wind);
      ctx.stroke();
    }
  }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};
