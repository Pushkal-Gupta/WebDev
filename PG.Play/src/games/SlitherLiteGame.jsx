// COIL — boutique-arcade slither.io clone, rebuilt for premium feel.
// All systems live in this single file: world, snake render, skins, bots,
// HUD, particles, RAF loop, lifecycle.
//
// Major systems (search-anchors):
//   [WORLD]    — circular arena (single radius, slow expansion)
//   [SKINS]    — per-segment colour functions, persisted in localStorage
//   [SNAKE]    — render w/ smooth interpolation, head, eyes, glow
//   [BG]       — layered background (vignette, parallax stars, scanlines)
//   [BOTS]     — decision tree: arena, food, threat-avoid, aggression, wobble
//   [HUD]      — length panel, leaderboard, arena timer + radius, progress ring
//   [LIFECYCLE]— React mount/reset/score submit
//
// External contract (do not break):
//   submitScore('slither', length, { time }) on death.

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { submitScore } from '../scoreBus.js';
import { sfx, subscribeMute, isMuted as soundIsMuted } from '../sound.js';
import { getSkin as readPersistedSkin, setSkin as writePersistedSkin, subscribeSkinChange } from '../lib/coilSkin.js';

// --- World tuning ---
const ARENA_R0 = 1200;            // initial radius in world units
const ARENA_GROW = 0.6;           // units per second of growth
const SEG_SPACING = 3.6;          // tighter spacing → ~40% overlap
const HEAD_R_BASE = 10;
const FOOD_R = 6;
const FOOD_COUNT = 110;
const BOT_COUNT = 6;
const START_LEN = 16;
const GROW_PER_FOOD = 3;
const TURN_RATE = 5.0;
const SPEED_BASE = 165;
const SPEED_DECAY_PER_SEG = 0.16;
const SPEED_MIN = 105;
const BOOST_MULT = 1.85;
const BOOST_BURN = 1.6;
const BOOST_MIN_LEN = 12;
const FOOD_BIG_CHANCE = 0.10;

// --- Helpers ---
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const TAU = Math.PI * 2;

function hexToRgb(hex) {
  if (hex.length === 4) return [parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16), parseInt(hex[3] + hex[3], 16)];
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}
function hexAlpha(hex, a) {
  if (typeof hex !== 'string') return `rgba(0,255,245,${a})`;
  if (hex.startsWith('rgb')) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function lerpHex(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function hslCss(h, s, l) {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// =========================================================================
// [SKINS]
// signature: skin(segIndex, totalSegs, t) => { fill, stroke }
// segIndex 0 = head; t = seconds since round start (or live clock).
// =========================================================================
const SKINS = {
  cyan: {
    label: 'Cyan',
    swatch: ['#00fff5', '#00b3aa'],
    fn: (i, n) => {
      const t = n > 1 ? i / (n - 1) : 0;
      return { fill: lerpHex('#bdfffb', '#00b3aa', t * 0.85), stroke: '#04545b' };
    },
  },
  magenta: {
    label: 'Magenta',
    swatch: ['#ff7ab8', '#a4146e'],
    fn: (i, n) => {
      const t = n > 1 ? i / (n - 1) : 0;
      return { fill: lerpHex('#ffd2eb', '#a4146e', t * 0.95), stroke: '#4d0a37' };
    },
  },
  solar: {
    label: 'Solar',
    swatch: ['#ffe14f', '#ff7a18'],
    fn: (i, n) => {
      const t = n > 1 ? i / (n - 1) : 0;
      return { fill: lerpHex('#ffe89a', '#ff5a18', t), stroke: '#5a2308' };
    },
  },
  mint: {
    label: 'Mint',
    swatch: ['#9af6c8', '#0c8f74'],
    fn: (i, n) => {
      const t = n > 1 ? i / (n - 1) : 0;
      return { fill: lerpHex('#bbf5d8', '#0c8f74', t * 0.92), stroke: '#053b32' };
    },
  },
  violet: {
    label: 'Violet',
    swatch: ['#cdb4ff', '#5b21b6'],
    fn: (i, n) => {
      const t = n > 1 ? i / (n - 1) : 0;
      return { fill: lerpHex('#e3d2ff', '#5b21b6', t), stroke: '#260b56' };
    },
  },
  stripes: {
    label: 'Stripes',
    swatch: ['#00fff5', '#0a0d0e'],
    fn: (i) => {
      const stripe = Math.floor(i / 4) % 2 === 0;
      return stripe
        ? { fill: '#00fff5', stroke: '#04545b' }
        : { fill: '#0a0d0e', stroke: '#000' };
    },
  },
  rainbow: {
    label: 'Rainbow',
    swatch: ['#ff4d6d', '#ffe14f'],
    fn: (i, n, t) => {
      const cycle = ((i / Math.max(1, n)) * 6 + (t || 0) * 0.25) % 1;
      return { fill: hslCss(cycle * 360, 88, 60), stroke: 'rgba(0,0,0,0.4)' };
    },
  },
  stealth: {
    label: 'Stealth',
    swatch: ['#22272b', '#00fff5'],
    fn: () => ({ fill: '#1d2226', stroke: '#00fff5' }),
  },
};
const SKIN_ORDER = ['cyan', 'magenta', 'solar', 'mint', 'violet', 'stripes', 'rainbow', 'stealth'];

// Skin persistence delegates to lib/coilSkin which mirrors localStorage
// to pgplay_profiles.prefs.coilSkin when the user is signed in. The game
// stays synchronous; server hydration happens lazily and notifies via
// subscribeSkinChange so the picker UI can react.
function readSkin() {
  const v = readPersistedSkin();
  return v && SKINS[v] ? v : 'cyan';
}
function writeSkin(id) {
  if (id && SKINS[id]) writePersistedSkin(id);
}

// =========================================================================
// Snake / food factories
// =========================================================================
function makeSnake(x, y, angle, len, skinId = 'cyan') {
  const body = [];
  for (let i = 0; i < len; i++) {
    body.push({ x: x - Math.cos(angle) * i * SEG_SPACING, y: y - Math.sin(angle) * i * SEG_SPACING });
  }
  return {
    body, angle, grow: 0, skin: skinId,
    alive: true, turnTarget: angle,
    boost: false, boostBank: 0,
    wobble: 0, wobbleT: rand(0, 1000),
  };
}

// Random point inside arena (for food / bots).
function randomInArena(radius, margin = 40) {
  const r = Math.sqrt(Math.random()) * Math.max(0, radius - margin);
  const a = Math.random() * TAU;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

const FOOD_PALETTE = ['#ffe14f', '#35f0c9', '#ff8a3a', '#a78bfa', '#ff4d6d', '#7fc7ff'];
function makeFood(arenaR, big = null) {
  const isBig = big ?? (Math.random() < FOOD_BIG_CHANCE);
  const p = randomInArena(arenaR, 25);
  return { x: p.x, y: p.y, color: pick(FOOD_PALETTE), big: isBig, phase: Math.random() * TAU };
}

// Procedurally make a star field in world coordinates (parallax-friendly).
function makeStars(count = 80) {
  // World-space positions; parallax 0.5x is applied at draw time.
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: rand(-2400, 2400),
      y: rand(-2400, 2400),
      r: rand(0.4, 1.6),
      a: rand(0.18, 0.55),
      tw: rand(0, TAU),
    });
  }
  return out;
}

export default function SlitherLiteGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [len, setLen] = useState(START_LEN);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-coil-best') || 0));
  const [status, setStatus] = useState('intro'); // 'intro' | 'playing' | 'dead'
  const [skin, setSkin] = useState(readSkin);
  const [pickerOpen, setPickerOpen] = useState(false);
  const submittedRef = useRef(false);
  const mutedRef = useRef(soundIsMuted());
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(!!reducedMotion);
  useEffect(() => { reducedRef.current = !!reducedMotion; }, [reducedMotion]);

  // The render loop reads skin from a ref so the picker can change live.
  const skinRef = useRef(skin);
  useEffect(() => { skinRef.current = skin; writeSkin(skin); }, [skin]);

  // If the user signs in mid-session and their server-saved skin differs
  // from local, subscribeSkinChange fires — bring the live game in sync.
  useEffect(() => {
    return subscribeSkinChange((next) => {
      if (next && SKINS[next]) setSkin(next);
    });
  }, []);

  // -----------------------------------------------------------------------
  // [LIFECYCLE] reset world
  // -----------------------------------------------------------------------
  const reset = (start = false) => {
    const NAMES = ['Viper', 'Asp', 'Mamba', 'Kaa', 'Naga', 'Slink', 'Hydra', 'Cobra', 'Rattler', 'Fang'];
    const arenaR = ARENA_R0;
    const botSkins = ['magenta', 'solar', 'mint', 'violet', 'rainbow', 'stripes', 'stealth'];
    const bots = Array.from({ length: BOT_COUNT }).map((_, i) => {
      const ang = rand(0, TAU);
      const p = randomInArena(arenaR, 200);
      const s = makeSnake(p.x, p.y, ang, 12 + Math.floor(Math.random() * 10), botSkins[i % botSkins.length]);
      s.name = NAMES[i % NAMES.length];
      return s;
    });
    const me = makeSnake(0, 0, 0, START_LEN, skinRef.current || 'cyan');
    me.name = 'You';
    stateRef.current = {
      me, bots,
      arenaR,
      arenaR0: arenaR,
      food: Array.from({ length: FOOD_COUNT }).map(() => makeFood(arenaR)),
      stars: makeStars(80),
      pointer: { x: 200, y: 0 },
      keys: {},
      cam: { x: 0, y: 0, zoom: 1 },
      particles: [],
      pointerScreen: { x: 0, y: 0 },
      tAccum: 0,
      startedAt: performance.now(),
      deathT: 0,
    };
    setLen(START_LEN);
    setScore(START_LEN * 10);
    setStatus(start ? 'playing' : 'intro');
    submittedRef.current = false;
  };

  useEffect(() => { reset(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    mutedRef.current = soundIsMuted();
    const off = subscribeMute((m) => { mutedRef.current = m; });
    return off;
  }, []);

  // -----------------------------------------------------------------------
  // Main canvas effect — sizing, input, simulation, render.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    const view = { w: 0, h: 0, dpr: 1 };
    const sizeCanvas = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      if (view.w === w && view.h === h && view.dpr === dpr) return;
      view.w = w; view.h = h; view.dpr = dpr;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvas();
    const ro = new ResizeObserver(sizeCanvas);
    ro.observe(wrap);
    window.addEventListener('orientationchange', sizeCanvas);

    // Input: pointer steers in world space.
    const screenToWorld = (cx, cy) => {
      const s = stateRef.current;
      if (!s || !s.cam || !view.w || !view.h) return { x: 0, y: 0 };
      const r = canvas.getBoundingClientRect();
      const sx = cx - r.left;
      const sy = cy - r.top;
      const cam = s.cam;
      return { x: sx - view.w / 2 + cam.x, y: sy - view.h / 2 + cam.y };
    };
    const setPointerFromEvent = (cx, cy) => {
      const w = screenToWorld(cx, cy);
      const s = stateRef.current; if (!s) return;
      s.pointer.x = w.x; s.pointer.y = w.y;
      s.pointerScreen = { x: cx, y: cy };
    };
    const onMouseMove = (e) => setPointerFromEvent(e.clientX, e.clientY);
    const onMouseDown = () => {
      const s = stateRef.current; if (!s) return;
      if (status === 'intro' || status === 'dead') { reset(true); return; }
      s.me.boost = true;
    };
    const onMouseUp = () => {
      const s = stateRef.current; if (!s) return;
      s.me.boost = false;
    };
    const onContextMenu = (e) => e.preventDefault();
    const onTouchStart = (e) => {
      e.preventDefault();
      const s = stateRef.current; if (!s) return;
      if (status === 'intro' || status === 'dead') { reset(true); return; }
      if (e.touches[0]) setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      if (e.touches.length > 1) s.me.boost = true;
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      setPointerFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      const s = stateRef.current; if (!s) return;
      s.me.boost = e.touches.length > 1;
    };
    const onTouchEnd = (e) => {
      const s = stateRef.current; if (!s) return;
      s.me.boost = e.touches.length > 1;
    };
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('touchcancel', onTouchEnd);

    const kd = (e) => {
      const s = stateRef.current; if (!s) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      s.keys[k] = true;
      if (k === 'r' || k === 'R') reset(true);
      if (k === ' ' || k === 'Shift') {
        s.me.boost = true;
        if (status === 'intro' || status === 'dead') reset(true);
      }
    };
    const ku = (e) => {
      const s = stateRef.current; if (!s) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      s.keys[k] = false;
      if (k === ' ' || k === 'Shift') s.me.boost = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // -------------------------- Simulation --------------------------
    const turnToward = (snake, targetAngle, dt) => {
      let d = targetAngle - snake.angle;
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      const maxTurn = TURN_RATE * dt;
      snake.angle += clamp(d, -maxTurn, maxTurn);
    };

    const stepSnake = (snake, speed, dt) => {
      if (!snake.alive) return;
      turnToward(snake, snake.turnTarget, dt);
      const head = snake.body[0];
      const nx = head.x + Math.cos(snake.angle) * speed * dt;
      const ny = head.y + Math.sin(snake.angle) * speed * dt;
      snake.body.unshift({ x: nx, y: ny });
      if (snake.grow > 0) snake.grow--;
      else snake.body.pop();
    };

    const baseSpeed = (snake) => Math.max(SPEED_MIN, SPEED_BASE - snake.body.length * SPEED_DECAY_PER_SEG);

    const MAX_FOOD = FOOD_COUNT * 4;
    const trimShedFood = () => {
      const s = stateRef.current;
      if (s.food.length <= MAX_FOOD) return;
      let excess = s.food.length - MAX_FOOD;
      let i = 0;
      while (excess > 0 && i < s.food.length) {
        if (s.food[i].shed) { s.food.splice(i, 1); excess--; continue; }
        i++;
      }
      if (s.food.length > MAX_FOOD) s.food.splice(0, s.food.length - MAX_FOOD);
    };

    const dropOrbsFrom = (snake, count = null, staggerSec = 0) => {
      const s = stateRef.current;
      const drop = count ?? Math.min(60, Math.floor(snake.body.length / 2));
      const skinDef = SKINS[snake.skin] || SKINS.cyan;
      // Sample colour from the head for visual continuity.
      const sampleC = skinDef.swatch?.[0] || '#00fff5';
      const now = performance.now() / 1000;
      const reduced = reducedRef.current;
      for (let i = 0; i < drop; i++) {
        const seg = snake.body[Math.floor(i * snake.body.length / drop)];
        if (!seg) continue;
        const delay = reduced ? 0 : (staggerSec * (i / Math.max(1, drop)));
        s.food.push({
          x: seg.x + rand(-6, 6),
          y: seg.y + rand(-6, 6),
          color: sampleC,
          big: i === 0 || Math.random() < 0.16,
          phase: Math.random() * TAU,
          shed: true,
          appearAt: now + delay,
        });
      }
      trimShedFood();
    };

    const replaceFood = (idx) => {
      const s = stateRef.current;
      const f = s.food[idx];
      if (f && f.shed) { s.food.splice(idx, 1); return -1; }
      s.food[idx] = makeFood(s.arenaR);
      return idx;
    };

    const spawnEatBurst = (x, y, color) => {
      const s = stateRef.current;
      for (let i = 0; i < 10; i++) {
        const a = rand(0, TAU);
        const v = rand(40, 120);
        s.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.25, 0.55), age: 0, color, r: rand(1.6, 3.2) });
      }
    };

    const spawnBoostShed = (x, y, color) => {
      const s = stateRef.current;
      const reduced = reducedRef.current;
      const n = reduced ? 4 : 12;
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU);
        const v = rand(60, 180);
        s.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.2, 0.45), age: 0, color, r: rand(1.4, 2.8), flash: i === 0 });
      }
    };

    const spawnDeathBurst = (snake) => {
      const s = stateRef.current;
      const head = snake.body[0];
      const skinDef = SKINS[snake.skin] || SKINS.cyan;
      const c = skinDef.swatch?.[0] || '#00fff5';
      const reduced = reducedRef.current;
      const n = reduced ? 18 : 60;
      for (let i = 0; i < n; i++) {
        const a = rand(0, TAU);
        const v = rand(80, 280);
        s.particles.push({ x: head.x, y: head.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.4, 0.9), age: 0, color: c, r: rand(2, 4) });
      }
    };

    // -------------------------- Render: [BG] --------------------------
    const drawBackground = (cam, t) => {
      const s = stateRef.current;
      // Layer 0: deep obsidian base
      ctx.fillStyle = '#070a0d';
      ctx.fillRect(0, 0, view.w, view.h);

      // Layer 1: cyan radial vignette anchored at world center (0,0).
      const cwx = -cam.x + view.w / 2;
      const cwy = -cam.y + view.h / 2;
      const r1 = Math.max(view.w, view.h) * 1.1;
      const g1 = ctx.createRadialGradient(cwx, cwy, 0, cwx, cwy, r1);
      g1.addColorStop(0, 'rgba(0, 255, 245, 0.10)');
      g1.addColorStop(0.55, 'rgba(0, 200, 220, 0.04)');
      g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, view.w, view.h);

      // Layer 2: parallax stars (0.5x camera).
      const px = cam.x * 0.5;
      const py = cam.y * 0.5;
      for (let i = 0; i < s.stars.length; i++) {
        const st = s.stars[i];
        // Wrap stars across a large window so they always cover the view.
        const wrapW = 4800, wrapH = 4800;
        let sx = ((st.x - px) % wrapW + wrapW * 1.5) % wrapW - wrapW / 2 + view.w / 2;
        let sy = ((st.y - py) % wrapH + wrapH * 1.5) % wrapH - wrapH / 2 + view.h / 2;
        if (sx < -10 || sx > view.w + 10 || sy < -10 || sy > view.h + 10) continue;
        const tw = 0.55 + 0.45 * Math.sin(t * 2 + st.tw);
        ctx.fillStyle = `rgba(180, 220, 240, ${(st.a * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, st.r, 0, TAU);
        ctx.fill();
      }

      // Layer 3: faint diagonal scanlines (very subtle, screen-space).
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.strokeStyle = '#9bd6e6';
      ctx.lineWidth = 1;
      for (let y = -view.h; y < view.h * 2; y += 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(view.w, y + view.w);
        ctx.stroke();
      }
      ctx.restore();
    };

    // -------------------------- Render: [WORLD] --------------------------
    const drawArena = (cam) => {
      const s = stateRef.current;
      const cx = -cam.x + view.w / 2;
      const cy = -cam.y + view.h / 2;
      const R = s.arenaR;

      // Outer fade beyond the ring (energy-field edge).
      ctx.save();
      const outerR = R + 220;
      const grad = ctx.createRadialGradient(cx, cy, R - 4, cx, cy, outerR);
      grad.addColorStop(0, 'rgba(0, 255, 245, 0)');
      grad.addColorStop(0.06, 'rgba(0, 255, 245, 0.16)');
      grad.addColorStop(0.4, 'rgba(0, 60, 90, 0.10)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, TAU);
      ctx.fill();
      ctx.restore();

      // Inside-the-arena soft inner glow ring (close to the boundary).
      ctx.save();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = 'rgba(0, 255, 245, 0.55)';
      ctx.shadowColor = 'rgba(0, 255, 245, 0.85)';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
      ctx.restore();

      // Faint inner secondary ring for depth.
      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0, 255, 245, 0.12)';
      ctx.beginPath();
      ctx.arc(cx, cy, R - 6, 0, TAU);
      ctx.stroke();
      ctx.restore();
    };

    const drawEdgeWarning = (cam) => {
      const s = stateRef.current;
      const head = s.me.body[0];
      if (!head) return;
      const distC = Math.hypot(head.x, head.y);
      const margin = s.arenaR - distC; // distance to boundary
      if (margin > 120) return;
      const t = clamp(1 - margin / 120, 0, 1);
      // Red vignette on screen edges.
      ctx.save();
      const g = ctx.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * 0.25, view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.7);
      g.addColorStop(0, 'rgba(255, 50, 70, 0)');
      g.addColorStop(1, `rgba(255, 50, 70, ${(0.45 * t).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, view.w, view.h);
      // Arrow pointing back toward center.
      const ang = Math.atan2(-head.y, -head.x); // toward (0,0)
      const ax = view.w / 2 + Math.cos(ang) * 70;
      const ay = view.h / 2 + Math.sin(ang) * 70;
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.fillStyle = `rgba(255, 220, 220, ${(0.85 * t).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-10, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // -------------------------- Render: food --------------------------
    const drawFood = (cam, t) => {
      const s = stateRef.current;
      const { food } = s;
      const left = cam.x - view.w / 2 - 30;
      const right = cam.x + view.w / 2 + 30;
      const top = cam.y - view.h / 2 - 30;
      const bottom = cam.y + view.h / 2 + 30;
      const now = performance.now() / 1000;
      for (let i = 0; i < food.length; i++) {
        const f = food[i];
        if (f.appearAt && now < f.appearAt) continue;
        if (f.x < left || f.x > right || f.y < top || f.y > bottom) continue;
        const sx = f.x - cam.x + view.w / 2;
        const sy = f.y - cam.y + view.h / 2;
        const r = (f.big ? FOOD_R + 3 : FOOD_R);
        const pulse = 1 + 0.18 * Math.sin(t * 4 + f.phase);
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3.6);
        grad.addColorStop(0, f.color);
        grad.addColorStop(0.35, hexAlpha(f.color, 0.42));
        grad.addColorStop(1, hexAlpha(f.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3.4 * pulse, 0, TAU);
        ctx.fill();
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(sx, sy, r * pulse, 0, TAU);
        ctx.fill();
      }
    };

    // -------------------------- Render: [SNAKE] --------------------------
    const drawSnake = (snake, cam, t, isMe) => {
      const body = snake.body;
      if (body.length === 0) return;
      const skinDef = SKINS[snake.skin] || SKINS.cyan;
      const skinFn = skinDef.fn;
      const n = body.length;

      // Tail-to-head pass: each segment is a soft glow + a coloured disc.
      // Drawing per-segment lets each skin colour itself precisely; segments
      // overlap (~40%) thanks to SEG_SPACING < diameter.
      // Boost outer aura — wide cyan-tinted halo.
      if (isMe && snake.boost && !reducedRef.current) {
        ctx.save();
        const headSwatch = skinDef.swatch?.[0] || '#00fff5';
        ctx.strokeStyle = hexAlpha(headSwatch, 0.32);
        ctx.lineWidth = HEAD_R_BASE * 2 + 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const seg = body[i];
          const sx = seg.x - cam.x + view.w / 2;
          const sy = seg.y - cam.y + view.h / 2;
          if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Pass 1: subtle radial glow under each segment (cheap alpha gradient).
      // Skip for stealth skin (matte aesthetic).
      const showGlow = snake.skin !== 'stealth';
      if (showGlow) {
        for (let i = n - 1; i >= 0; i--) {
          const seg = body[i];
          const sx = seg.x - cam.x + view.w / 2;
          const sy = seg.y - cam.y + view.h / 2;
          if (sx < -40 || sx > view.w + 40 || sy < -40 || sy > view.h + 40) continue;
          const taper = 1 - (i / Math.max(1, n)) * 0.35;
          const radius = (i === 0 ? HEAD_R_BASE * 1.2 : HEAD_R_BASE * taper);
          const { fill } = skinFn(i, n, t);
          // Glow radius ~2.4x; alpha small so overdraw is cheap-looking.
          const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 2.4);
          // Take a colour string we can alpha — accept rgb()/rgba()/hsl()/hex.
          const glowC = colorWithAlpha(fill, 0.28);
          const glowC0 = colorWithAlpha(fill, 0);
          gr.addColorStop(0, glowC);
          gr.addColorStop(1, glowC0);
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(sx, sy, radius * 2.2, 0, TAU);
          ctx.fill();
        }
      }

      // Pass 2: discs (tail → head so head sits on top).
      for (let i = n - 1; i >= 0; i--) {
        const seg = body[i];
        const sx = seg.x - cam.x + view.w / 2;
        const sy = seg.y - cam.y + view.h / 2;
        if (sx < -40 || sx > view.w + 40 || sy < -40 || sy > view.h + 40) continue;
        const taper = 1 - (i / Math.max(1, n)) * 0.35;
        const radius = (i === 0 ? HEAD_R_BASE * 1.2 : HEAD_R_BASE * taper);
        const { fill, stroke } = skinFn(i, n, t);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, TAU);
        ctx.fill();
        if (stroke && i % 2 === 0) {
          ctx.lineWidth = i === 0 ? 1.4 : 0.8;
          ctx.strokeStyle = stroke;
          ctx.stroke();
        }
      }

      // Head detail: eyes + pupils tracking steering vector.
      const head = body[0];
      const hx = head.x - cam.x + view.w / 2;
      const hy = head.y - cam.y + view.h / 2;
      const ang = snake.angle;
      const lx = Math.cos(ang + Math.PI / 2);
      const ly = Math.sin(ang + Math.PI / 2);
      const fx = Math.cos(ang);
      const fy = Math.sin(ang);
      const eR = 3.0;
      const eOff = 4.4;
      const eFwd = 2.4;
      const e1 = { x: hx + lx * eOff + fx * eFwd, y: hy + ly * eOff + fy * eFwd };
      const e2 = { x: hx - lx * eOff + fx * eFwd, y: hy - ly * eOff + fy * eFwd };
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(e1.x, e1.y, eR, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(e2.x, e2.y, eR, 0, TAU); ctx.fill();

      let steerAng = ang;
      if (isMe) {
        const s = stateRef.current;
        steerAng = Math.atan2(s.pointer.y - head.y, s.pointer.x - head.x);
      } else {
        steerAng = snake.turnTarget ?? ang;
      }
      const pdx = Math.cos(steerAng) * 1.3;
      const pdy = Math.sin(steerAng) * 1.3;
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath(); ctx.arc(e1.x + pdx, e1.y + pdy, 1.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(e2.x + pdx, e2.y + pdy, 1.6, 0, TAU); ctx.fill();
    };

    // -------------------------- Render: particles --------------------------
    const drawParticles = (cam, dt) => {
      const s = stateRef.current;
      const next = [];
      for (let i = 0; i < s.particles.length; i++) {
        const p = s.particles[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94; p.vy *= 0.94;
        const a = 1 - (p.age / p.life);
        const sx = p.x - cam.x + view.w / 2;
        const sy = p.y - cam.y + view.h / 2;
        ctx.fillStyle = colorWithAlpha(p.color, a);
        ctx.beginPath();
        ctx.arc(sx, sy, p.r * a + 0.4, 0, TAU);
        ctx.fill();
        next.push(p);
      }
      s.particles = next;
    };

    // -------------------------- Render: [HUD] --------------------------
    const drawHud = () => {
      const s = stateRef.current;
      const lenNow = s.me.body.length;
      const scoreNow = lenNow * 10;
      const topInset = 56;
      ctx.save();

      // Top-left: arena timer + radius
      const elapsed = Math.max(0, (performance.now() - s.startedAt) / 1000);
      const mm = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const ss = Math.floor(elapsed % 60).toString().padStart(2, '0');
      const tlW = 168, tlH = 56;
      const tlX = 12, tlY = 12;
      ctx.fillStyle = 'rgba(11,19,24,0.62)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, tlX, tlY, tlW, tlH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('TIME', tlX + 12, tlY + 8);
      ctx.fillStyle = '#eef3f5';
      ctx.font = '700 18px "Space Mono", ui-monospace, monospace';
      ctx.fillText(`${mm}:${ss}`, tlX + 12, tlY + 22);
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.fillText('ARENA', tlX + 92, tlY + 8);
      ctx.fillStyle = '#00fff5';
      ctx.font = '700 18px "Space Mono", ui-monospace, monospace';
      ctx.fillText(String(Math.round(s.arenaR)), tlX + 92, tlY + 22);

      // Top-right: leaderboard
      const allSnakes = [{ name: s.me.name || 'You', len: lenNow, skin: s.me.skin, alive: s.me.alive, isMe: true }]
        .concat(s.bots.filter((b) => b.alive).map((b) => ({ name: b.name || 'Snake', len: b.body.length, skin: b.skin, alive: true, isMe: false })))
        .sort((a, b) => b.len - a.len)
        .slice(0, 10);
      const lbW = Math.min(200, view.w * 0.26);
      const rowH = 16;
      const lbH = 28 + allSnakes.length * rowH + 8;
      const lbX = view.w - lbW - 12;
      const lbY = topInset - 44;
      ctx.fillStyle = 'rgba(11,19,24,0.62)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, lbX, lbY, lbW, lbH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#00fff5';
      ctx.font = '700 11px "Space Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText('LEADERBOARD', lbX + 12, lbY + 8);
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      for (let i = 0; i < allSnakes.length; i++) {
        const row = allSnakes[i];
        const ry = lbY + 28 + i * rowH;
        if (row.isMe) {
          ctx.fillStyle = 'rgba(0,255,245,0.10)';
          roundRect(ctx, lbX + 6, ry - 1, lbW - 12, rowH, 4);
          ctx.fill();
        }
        ctx.fillStyle = row.isMe ? '#00fff5' : 'rgba(238,243,245,0.55)';
        ctx.fillText(`#${i + 1}`, lbX + 12, ry + 2);
        const swatch = (SKINS[row.skin] || SKINS.cyan).swatch[0];
        ctx.fillStyle = swatch;
        ctx.beginPath();
        ctx.arc(lbX + 36, ry + 7, 3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = row.isMe ? '#eef3f5' : 'rgba(238,243,245,0.85)';
        const nm = row.name.length > 10 ? row.name.slice(0, 10) : row.name;
        ctx.fillText(nm, lbX + 46, ry + 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = row.isMe ? '#00fff5' : 'rgba(238,243,245,0.7)';
        ctx.fillText(String(row.len), lbX + lbW - 12, ry + 2);
        ctx.textAlign = 'left';
      }

      // Below leaderboard: arena progress ring (player position vs boundary)
      const ringSize = 88;
      const rx = view.w - ringSize - 24;
      const ry = lbY + lbH + 12;
      const cxr = rx + ringSize / 2;
      const cyr = ry + ringSize / 2;
      const ringR = ringSize / 2 - 8;
      // panel
      ctx.fillStyle = 'rgba(11,19,24,0.6)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, rx - 6, ry - 6, ringSize + 12, ringSize + 12, 10);
      ctx.fill(); ctx.stroke();
      // ring base
      ctx.strokeStyle = 'rgba(0,255,245,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cxr, cyr, ringR, 0, TAU);
      ctx.stroke();
      // player dot (mapped from world to arena disc)
      const head = s.me.body[0];
      if (head) {
        const distC = Math.hypot(head.x, head.y);
        const tnorm = clamp(distC / s.arenaR, 0, 1);
        const ang = Math.atan2(head.y, head.x);
        const dx = cxr + Math.cos(ang) * ringR * tnorm;
        const dy = cyr + Math.sin(ang) * ringR * tnorm;
        ctx.fillStyle = tnorm > 0.85 ? '#ff5a7a' : '#00fff5';
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, TAU);
        ctx.fill();
      }
      // bots as faint dots
      for (const b of s.bots) {
        if (!b.alive) continue;
        const bh = b.body[0]; if (!bh) continue;
        const distC = Math.hypot(bh.x, bh.y);
        const tnorm = clamp(distC / s.arenaR, 0, 1);
        const ang = Math.atan2(bh.y, bh.x);
        const dx = cxr + Math.cos(ang) * ringR * tnorm;
        const dy = cyr + Math.sin(ang) * ringR * tnorm;
        const sw = (SKINS[b.skin] || SKINS.cyan).swatch[0];
        ctx.fillStyle = colorWithAlpha(sw, 0.55);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.6, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 9px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARENA', cxr, ry + ringSize + 2);
      ctx.textAlign = 'left';

      // Bottom-left: length panel (mono numerals, large)
      const blW = 196;
      const blH = 64;
      const blX = 12;
      const blY = view.h - blH - 44;
      ctx.fillStyle = 'rgba(11,19,24,0.62)';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      roundRect(ctx, blX, blY, blW, blH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      ctx.fillText('LENGTH', blX + 12, blY + 8);
      ctx.fillStyle = '#00fff5';
      ctx.font = '700 32px "Space Mono", ui-monospace, monospace';
      ctx.fillText(String(lenNow), blX + 12, blY + 20);
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.fillText('BEST', blX + 110, blY + 8);
      ctx.fillStyle = '#eef3f5';
      ctx.font = '700 16px "Space Mono", ui-monospace, monospace';
      ctx.fillText(String(Math.max(best, scoreNow)), blX + 110, blY + 22);
      ctx.fillStyle = 'rgba(238,243,245,0.55)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.fillText('SCORE', blX + 110, blY + 40);
      ctx.fillStyle = '#8a9ba5';
      ctx.font = '700 12px "Space Mono", ui-monospace, monospace';
      ctx.fillText(String(scoreNow), blX + 152, blY + 40);

      // Boost meter (bottom center)
      const canBoost = lenNow > BOOST_MIN_LEN;
      const meterW = 160;
      const meterH = 8;
      const mx = (view.w - meterW) / 2;
      const my = view.h - 28;
      ctx.fillStyle = 'rgba(11,19,24,0.55)';
      roundRect(ctx, mx - 6, my - 6, meterW + 12, meterH + 12, 8);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(ctx, mx, my, meterW, meterH, 4);
      ctx.fill();
      const fillW = canBoost ? meterW : meterW * (lenNow / BOOST_MIN_LEN);
      ctx.fillStyle = canBoost ? (s.me.boost ? '#ff8a3a' : '#00fff5') : 'rgba(255,255,255,0.18)';
      roundRect(ctx, mx, my, fillW, meterH, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      ctx.font = '600 10px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(canBoost ? (s.me.boost ? 'BOOSTING' : 'BOOST  HOLD SPACE / SHIFT / 2-FINGER') : 'GROW TO UNLOCK BOOST', view.w / 2, my - 18);
      ctx.textAlign = 'start';

      ctx.restore();
    };

    const drawIntroOverlay = () => {
      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 13, 0.62)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 12px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#00fff5';
      ctx.fillText('COIL', view.w / 2, view.h / 2 - 100);
      ctx.font = '700 clamp(28px, 5vw, 44px) Lora, Georgia, serif';
      ctx.fillStyle = '#eef3f5';
      ctx.fillText('Eat. Grow. Outlast.', view.w / 2, view.h / 2 - 50);
      ctx.font = '400 14px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      const tip = window.matchMedia('(pointer: coarse)').matches
        ? 'Tap to start · drag to steer · 2-finger hold to boost'
        : 'Click or press Space to start · move mouse to steer · hold Space / Shift to boost';
      ctx.fillText(tip, view.w / 2, view.h / 2 - 8);
      const pulse = reducedRef.current ? 1 : (0.7 + 0.3 * Math.sin(performance.now() / 220));
      ctx.fillStyle = `rgba(0, 255, 245, ${pulse.toFixed(3)})`;
      ctx.font = '700 16px "Space Mono", ui-monospace, monospace';
      ctx.fillText('PRESS TO PLAY', view.w / 2, view.h / 2 + 40);
      ctx.fillStyle = 'rgba(238,243,245,0.5)';
      ctx.font = '600 11px "Space Mono", ui-monospace, monospace';
      ctx.fillText('Pick a skin from the panel above', view.w / 2, view.h / 2 + 70);
      ctx.restore();
    };

    const drawDeathOverlay = () => {
      const s = stateRef.current;
      const lenNow = s.me.body.length;
      const scoreNow = lenNow * 10;
      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 13, 0.72)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 12px "Space Mono", ui-monospace, monospace';
      ctx.fillStyle = '#ff5a7a';
      ctx.fillText('YOU GOT EATEN', view.w / 2, view.h / 2 - 86);
      ctx.font = '700 clamp(34px, 6vw, 56px) Lora, Georgia, serif';
      ctx.fillStyle = '#eef3f5';
      ctx.fillText(String(scoreNow), view.w / 2, view.h / 2 - 28);
      ctx.font = '400 13px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(238,243,245,0.7)';
      ctx.fillText(`length ${lenNow}  ·  best ${Math.max(best, scoreNow)}`, view.w / 2, view.h / 2 + 8);
      const pulse = reducedRef.current ? 1 : (0.7 + 0.3 * Math.sin(performance.now() / 220));
      ctx.fillStyle = `rgba(0, 255, 245, ${pulse.toFixed(3)})`;
      ctx.font = '700 15px "Space Mono", ui-monospace, monospace';
      ctx.fillText('PRESS TO REPLAY', view.w / 2, view.h / 2 + 56);
      ctx.restore();
    };

    // -------------------------- [BOTS] decision tree --------------------------
    // Priority (highest first):
    //   1. Arena boundary: if within 80 of edge → steer 90° toward center.
    //   2. Avoid larger snake heads within 80 → steer 90° away.
    //   3. Aggressive cut on smaller snake heads within 120 → steer ahead.
    //   4. Chase nearest food cluster within detection radius.
    //   5. Apply ±10° wobble.
    const stepBotAI = (bot, s, dt) => {
      const bh = bot.body[0];
      const distC = Math.hypot(bh.x, bh.y);
      const arenaR = s.arenaR;
      let target = bot.angle;
      let priorityHandled = false;

      // 1. Arena edge
      if (arenaR - distC < 80) {
        const inward = Math.atan2(-bh.y, -bh.x);
        // Steer 90° toward center: nudge to inward direction (perpendicular bias optional).
        target = inward;
        priorityHandled = true;
      }

      // 2 & 3: scan other snakes' heads
      if (!priorityHandled) {
        const all = [s.me, ...s.bots];
        let avoid = null, aggro = null;
        let avoidD = Infinity, aggroD = Infinity;
        const myLen = bot.body.length;
        for (const other of all) {
          if (other === bot || !other.alive) continue;
          const oh = other.body[0]; if (!oh) continue;
          const d = Math.hypot(oh.x - bh.x, oh.y - bh.y);
          const oLen = other.body.length;
          if (d < 80 && oLen > myLen + 1 && d < avoidD) { avoid = other; avoidD = d; }
          if (d < 120 && oLen < myLen - 1 && d < aggroD) { aggro = other; aggroD = d; }
        }
        if (avoid) {
          const oh = avoid.body[0];
          const away = Math.atan2(bh.y - oh.y, bh.x - oh.x);
          // Steer 90° away (use the away vector directly is fine; perpendicular too aggressive).
          target = away;
          priorityHandled = true;
        } else if (aggro) {
          // Cut in front: aim at a point ahead of the smaller snake's head.
          const oh = aggro.body[0];
          const ahead = 26;
          const tx = oh.x + Math.cos(aggro.angle) * ahead;
          const ty = oh.y + Math.sin(aggro.angle) * ahead;
          target = Math.atan2(ty - bh.y, tx - bh.x);
          priorityHandled = true;
        }
      }

      // 4. Food chase
      if (!priorityHandled) {
        const detR2 = 380 * 380;
        let nearest = null, nearestD = Infinity;
        const foodArr = s.food;
        // Sample a subset for cheap scan if many shed orbs.
        const stride = Math.max(1, Math.floor(foodArr.length / 80));
        for (let i = 0; i < foodArr.length; i += stride) {
          const f = foodArr[i];
          const d = (f.x - bh.x) ** 2 + (f.y - bh.y) ** 2;
          if (d < detR2 && d < nearestD) { nearestD = d; nearest = f; }
        }
        if (nearest) {
          target = Math.atan2(nearest.y - bh.y, nearest.x - bh.x);
        } else {
          // Drift toward center to keep them in play.
          target = Math.atan2(-bh.y, -bh.x);
        }
      }

      // 5. Wobble — smoothly varying ±10°.
      bot.wobbleT += dt;
      const wob = (Math.sin(bot.wobbleT * 1.7) + Math.sin(bot.wobbleT * 0.6 + 1.3)) * 0.5;
      target += wob * (10 * Math.PI / 180);
      bot.turnTarget = target;
    };

    // ============================ Main loop ============================
    const clock = { last: performance.now() };
    let raf = 0;
    let lastEatSfxAt = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.035, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;
      s.tAccum += dt;

      if (status === 'playing') {
        // Arena slowly grows.
        s.arenaR += ARENA_GROW * dt;

        // Player steering.
        const head = s.me.body[0];
        let desired = s.me.angle;
        const k = s.keys;
        const hasKB = k.w || k.a || k.s || k.d || k.arrowup || k.arrowleft || k.arrowdown || k.arrowright;
        if (hasKB) {
          let dx = 0, dy = 0;
          if (k.w || k.arrowup) dy -= 1;
          if (k.s || k.arrowdown) dy += 1;
          if (k.a || k.arrowleft) dx -= 1;
          if (k.d || k.arrowright) dx += 1;
          if (dx || dy) desired = Math.atan2(dy, dx);
        } else {
          desired = Math.atan2(s.pointer.y - head.y, s.pointer.x - head.x);
        }
        s.me.turnTarget = desired;

        // Bots — full decision tree.
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          stepBotAI(bot, s, dt);
        });

        // Boost shed.
        const meLen = s.me.body.length;
        const boosting = s.me.boost && meLen > BOOST_MIN_LEN;
        if (boosting) {
          s.me.boostBank += dt * BOOST_BURN;
          while (s.me.boostBank >= 1 && s.me.body.length > BOOST_MIN_LEN) {
            s.me.boostBank -= 1;
            const tail = s.me.body[s.me.body.length - 1];
            if (tail) {
              const skinDef = SKINS[s.me.skin] || SKINS.cyan;
              const c = skinDef.swatch?.[0] || '#00fff5';
              s.food.push({
                x: tail.x + rand(-3, 3),
                y: tail.y + rand(-3, 3),
                color: c,
                big: false,
                phase: Math.random() * TAU,
                shed: true,
              });
              spawnBoostShed(tail.x, tail.y, c);
              trimShedFood();
            }
            s.me.body.pop();
          }
        }

        // Move snakes.
        const meSpeed = baseSpeed(s.me) * (boosting ? BOOST_MULT : 1);
        stepSnake(s.me, meSpeed, dt);
        s.bots.forEach((b) => stepSnake(b, baseSpeed(b) * 0.92, dt));

        const myHead = s.me.body[0];

        // Boundary kill: head outside circle.
        if (Math.hypot(myHead.x, myHead.y) > s.arenaR) {
          s.me.alive = false;
        }

        // Player food pickups.
        for (let i = s.food.length - 1; i >= 0; i--) {
          const f = s.food[i];
          if (f.appearAt && (now / 1000) < f.appearAt) continue;
          const dx = myHead.x - f.x, dy = myHead.y - f.y;
          const r = (f.big ? FOOD_R + 3 : FOOD_R);
          if (dx * dx + dy * dy < (HEAD_R_BASE + r) ** 2) {
            const bonus = f.big ? GROW_PER_FOOD * 2 : GROW_PER_FOOD;
            s.me.grow += bonus;
            spawnEatBurst(f.x, f.y, f.color);
            if (!mutedRef.current && (now - lastEatSfxAt) > 50) {
              // Bigger pellets get a meatier cue (confirm) — small ones
              // chirp via the dedicated pellet stinger.
              try { (f.big ? sfx.confirm : sfx.pellet)(); } catch {}
              lastEatSfxAt = now;
            }
            replaceFood(i);
          }
        }

        // Bot food pickups.
        s.bots.forEach((bot) => {
          if (!bot.alive) return;
          const bh = bot.body[0];
          for (let i = s.food.length - 1; i >= 0; i--) {
            const f = s.food[i];
            if (f.appearAt && (now / 1000) < f.appearAt) continue;
            const dx = bh.x - f.x, dy = bh.y - f.y;
            const r = (f.big ? FOOD_R + 3 : FOOD_R);
            if (dx * dx + dy * dy < (HEAD_R_BASE + r) ** 2) {
              bot.grow += (f.big ? GROW_PER_FOOD * 2 : GROW_PER_FOOD);
              replaceFood(i);
            }
          }
        });

        // Body collisions.
        const hit = (bx, by, r) => (myHead.x - bx) ** 2 + (myHead.y - by) ** 2 < (HEAD_R_BASE + r) ** 2;
        for (let i = 14; i < s.me.body.length; i++) {
          const seg = s.me.body[i];
          if (hit(seg.x, seg.y, 5)) { s.me.alive = false; break; }
        }
        if (s.me.alive) {
          for (const bot of s.bots) {
            if (!bot.alive) continue;
            for (const seg of bot.body) {
              if (hit(seg.x, seg.y, 5)) { s.me.alive = false; break; }
            }
            if (!s.me.alive) break;
          }
        }
        for (const bot of s.bots) {
          if (!bot.alive) continue;
          const bh = bot.body[0];
          // Bots die at boundary.
          if (Math.hypot(bh.x, bh.y) > s.arenaR) {
            bot.alive = false;
            dropOrbsFrom(bot, null, 0.4);
            continue;
          }
          for (const other of s.bots) {
            if (other === bot || !other.alive) continue;
            for (const seg of other.body) {
              const dx = bh.x - seg.x, dy = bh.y - seg.y;
              if (dx * dx + dy * dy < (HEAD_R_BASE + 5) ** 2) { bot.alive = false; dropOrbsFrom(bot, null, 0.4); break; }
            }
            if (!bot.alive) break;
          }
          if (bot.alive) {
            for (const seg of s.me.body) {
              const dx = bh.x - seg.x, dy = bh.y - seg.y;
              if (dx * dx + dy * dy < (HEAD_R_BASE + 5) ** 2) { bot.alive = false; dropOrbsFrom(bot, null, 0.4); break; }
            }
          }
        }

        // Bot respawn: 4-7s delay at random rim point.
        s.bots.forEach((bot, i) => {
          if (bot.alive) return;
          if (bot.respawnIn == null) bot.respawnIn = rand(4, 7);
          bot.respawnIn -= dt;
          if (bot.respawnIn <= 0) {
            const ang = rand(0, TAU);
            // Random rim point: ~80% of arena radius so they don't insta-die.
            const r = s.arenaR * 0.8;
            const x = Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            // Heading toward center.
            const heading = Math.atan2(-y, -x);
            const fresh = makeSnake(x, y, heading, 10 + Math.floor(Math.random() * 6), bot.skin);
            fresh.name = bot.name;
            s.bots[i] = fresh;
          }
        });

        // Sync React HUD-shadow length.
        const newLen = s.me.body.length;
        if (newLen !== len) {
          setLen(newLen);
          setScore(newLen * 10);
        }

        if (!s.me.alive) {
          spawnDeathBurst(s.me);
          // Staggered cascade over ~600ms.
          dropOrbsFrom(s.me, Math.min(80, s.me.body.length), reducedRef.current ? 0 : 0.6);
          if (!mutedRef.current) { try { sfx.lose(); } catch {} }
          const finalLen = s.me.body.length;
          const secondsAlive = Math.max(0, (now - s.startedAt) / 1000);
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitScore('slither', finalLen, { time: secondsAlive });
            const finalScore = finalLen * 10;
            if (finalScore > best) {
              setBest(finalScore);
              localStorage.setItem('pd-coil-best', String(finalScore));
            }
          }
          setStatus('dead');
        }
      }

      // Camera follows player smoothly. World-space coords are global; the
      // camera centers on the snake regardless of arena radius.
      const myHead = s.me.body[0];
      if (myHead) {
        s.cam.x += (myHead.x - s.cam.x) * Math.min(1, dt * 6);
        s.cam.y += (myHead.y - s.cam.y) * Math.min(1, dt * 6);
      }

      // -------------------- Draw frame --------------------
      drawBackground(s.cam, s.tAccum);
      drawArena(s.cam);
      drawFood(s.cam, s.tAccum);
      for (const b of s.bots) drawSnake(b, s.cam, s.tAccum, false);
      drawSnake(s.me, s.cam, s.tAccum, true);
      drawParticles(s.cam, dt);
      drawEdgeWarning(s.cam);

      // Soft screen-edge vignette.
      const vg = ctx.createRadialGradient(view.w / 2, view.h / 2, Math.min(view.w, view.h) * 0.42, view.w / 2, view.h / 2, Math.max(view.w, view.h) * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, view.w, view.h);

      drawHud();

      if (status === 'intro') drawIntroOverlay();
      else if (status === 'dead') drawDeathOverlay();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('orientationchange', sizeCanvas);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, best]);

  // -----------------------------------------------------------------------
  // [SKINS] Picker UI — DOM overlay above the canvas. Only visible at
  // intro/dead state so it doesn't obscure live play.
  // -----------------------------------------------------------------------
  const showPicker = status !== 'playing';
  const pickRandomSkin = () => {
    const others = SKIN_ORDER.filter((id) => id !== skin);
    const next = others[Math.floor(Math.random() * others.length)];
    setSkin(next);
    // Apply live to current snake instance for instant preview.
    const s = stateRef.current;
    if (s && s.me) s.me.skin = next;
  };
  const chooseSkin = (id) => {
    setSkin(id);
    const s = stateRef.current;
    if (s && s.me) s.me.skin = id;
  };

  return (
    <div ref={wrapRef} className="coil coil-fluid" style={{ position: 'relative' }}>
      <canvas ref={canvasRef} className="coil-canvas coil-canvas-fluid" tabIndex={0} aria-label="Coil — eat orbs and outlast the other snakes"/>
      {showPicker && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 12px',
            background: 'rgba(11, 19, 24, 0.72)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            zIndex: 4,
            pointerEvents: 'auto',
            color: '#eef3f5',
            fontFamily: '"Space Mono", ui-monospace, monospace',
            fontSize: 11,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <span style={{ color: '#00fff5', letterSpacing: 1 }}>SKIN</span>
          <SkinPreview skinId={skin} />
          <div style={{ display: 'flex', gap: 6 }}>
            {SKIN_ORDER.map((id) => {
              const def = SKINS[id];
              const sel = id === skin;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => chooseSkin(id)}
                  title={def.label}
                  aria-label={`Skin ${def.label}`}
                  style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: sel ? '2px solid #00fff5' : '1px solid rgba(255,255,255,0.18)',
                    background: `linear-gradient(135deg, ${def.swatch[0]}, ${def.swatch[1]})`,
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: sel ? '0 0 0 2px rgba(0,255,245,0.18)' : 'none',
                  }}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={pickRandomSkin}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid rgba(0, 255, 245, 0.3)',
              background: 'rgba(0, 255, 245, 0.08)',
              color: '#00fff5',
              fontFamily: '"Space Mono", ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: 1,
              cursor: 'pointer',
            }}
          >RANDOM</button>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// Skin live preview — small canvas showing a curled mini-snake in the
// chosen skin. Re-renders on skin change.
// =========================================================================
function SkinPreview({ skinId }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width = 96, h = c.height = 24;
    let raf = 0;
    let stopped = false;
    const skinDef = SKINS[skinId] || SKINS.cyan;
    const draw = () => {
      if (stopped) return;
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;
      const n = 14;
      const r = 6;
      // Sinusoidal coil path along the strip.
      for (let i = n - 1; i >= 0; i--) {
        const px = 8 + (w - 16) * (i / (n - 1));
        const py = h / 2 + Math.sin(t * 1.5 + i * 0.5) * 4;
        const taper = 1 - (i / n) * 0.35;
        const { fill } = skinDef.fn(i, n, t);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(px, py, r * taper, 0, TAU);
        ctx.fill();
      }
      // Eye on head segment.
      const headX = 8 + (w - 16) * (0 / (n - 1));
      const headY = h / 2 + Math.sin(t * 1.5) * 4;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(headX + 1, headY - 1.5, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath(); ctx.arc(headX + 1.6, headY - 1.5, 0.9, 0, TAU); ctx.fill();
    };
    raf = requestAnimationFrame(draw);
    return () => { stopped = true; cancelAnimationFrame(raf); };
  }, [skinId]);
  return (
    <canvas
      ref={ref}
      width={96}
      height={24}
      style={{ width: 96, height: 24, borderRadius: 6, background: 'rgba(7,10,13,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
    />
  );
}

// =========================================================================
// Helpers (module-scope)
// =========================================================================

// Apply alpha to any colour string (hex, rgb()/rgba(), hsl()).
function colorWithAlpha(c, a) {
  if (typeof c !== 'string') return `rgba(0,255,245,${a})`;
  if (c[0] === '#') return hexAlpha(c, a);
  if (c.startsWith('rgba')) {
    return c.replace(/rgba\(([^)]+)\)/, (_, inner) => {
      const parts = inner.split(',').map((p) => p.trim());
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`;
    });
  }
  if (c.startsWith('rgb')) {
    return c.replace(/rgb\(([^)]+)\)/, (_, inner) => `rgba(${inner}, ${a})`);
  }
  if (c.startsWith('hsl')) {
    return c.replace(/hsl\(([^)]+)\)/, (_, inner) => `hsla(${inner}, ${a})`);
  }
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y,     x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x,     y + h, rr);
  ctx.arcTo(x,     y + h, x,     y,     rr);
  ctx.arcTo(x,     y,     x + w, y,     rr);
  ctx.closePath();
}
