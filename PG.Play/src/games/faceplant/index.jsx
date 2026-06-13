// FACEPLANT — original physics-hazard ride.
//
// You ride a bike across a hand-authored track of hills, bumps, and spikes.
// Head touches the ground = faceplant (crash). Reach the flag to win.
//
//  • Rigid-body chassis (one rectangle) with position + rotation +
//    angular velocity. Visual wheels are drawn but not simulated
//    separately — their contact is approximated by sampling the chassis'
//    bottom edge against the terrain polyline.
//  • The rider is articulated (head/torso/arms/legs posed from the lean
//    input) while riding; on crash the rider becomes a verlet ragdoll
//    that tumbles separately from the bike, the wheels fly off, and a
//    short slow-mo beat plays under a "FACEPLANT" stamp.
//  • Controls:
//      → accelerate          ← brake
//      W / ↑  lean back      S / ↓  lean forward
//      Space reset           R restart
//  • Terrain = array of points interpolated linearly. Spikes are arrays
//    of triangles placed at specific x positions. Three courses escalate
//    in length and spike density.
//  • Score = 1000 + remainingSeconds × 10 + air bonuses on win; 0 on crash.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { sfx, ensureCtx, subscribeMute } from '../../sound.js';

// Native level dimensions. The fluid sizer fills the canvas to its parent;
// we render the level at this fixed size, centered horizontally with the
// sky gradient + parallax hills filling the side margins. Vertical centering
// keeps the playfield anchored mid-screen on tall viewports.
const VIEW_W = 900;
const VIEW_H = 420;

// Courses: each is a polyline of (x, y) ground points (larger y = lower)
// plus spike zones. Built by hand to pace the run — every spike field sits
// just past a crest so carried speed clears it. Courses escalate: longer,
// deeper drops, more fields.
const mkPts = (list) => list.map(([x, y]) => ({ x, y }));

const COURSES = [
  {
    name: 'Meadow Run',
    seconds: 30,
    terrain: mkPts([
      [0, 300], [200, 300], [280, 260], [360, 300], [500, 320], [600, 280],
      [760, 320], [900, 300], [1100, 340], [1280, 270], [1440, 320],
      [1600, 320], [1700, 280], [1780, 320], [1960, 320], [2160, 300],
      [2340, 340], [2500, 310], [2700, 310],
    ]),
    spikes: [
      { x0: 940,  x1: 1060 },
      { x0: 1820, x1: 1920 },
      { x0: 2240, x1: 2320 },
    ],
  },
  {
    name: 'Canyon Pass',
    seconds: 45,
    terrain: mkPts([
      [0, 300], [160, 300], [240, 255], [320, 310], [460, 330], [580, 265],
      [720, 330], [880, 295], [1110, 350], [1280, 330], [1400, 270],
      [1480, 265], [1560, 330], [1720, 298], [1950, 350], [2120, 320],
      [2260, 250], [2420, 340], [2560, 330], [2640, 288], [2870, 340],
      [3010, 320], [3140, 310], [3300, 310],
    ]),
    spikes: [
      { x0: 920,  x1: 1058 },
      { x0: 1760, x1: 1898 },
      { x0: 2680, x1: 2818 },
    ],
  },
  {
    name: 'Spine Breaker',
    seconds: 60,
    terrain: mkPts([
      [0, 300], [140, 300], [220, 252], [300, 310], [420, 330], [520, 256],
      [640, 330], [780, 292], [1025, 352], [1180, 330], [1280, 246],
      [1340, 242], [1440, 330], [1560, 298], [1810, 352], [1980, 330],
      [2100, 262], [2180, 330], [2300, 292], [2530, 345], [2680, 320],
      [2820, 242], [2990, 348], [3120, 312], [3380, 350], [3520, 330],
      [3660, 300], [3900, 300],
    ]),
    spikes: [
      { x0: 820,  x1: 968 },
      { x0: 1600, x1: 1744 },
      { x0: 2340, x1: 2466 },
      { x0: 3160, x1: 3308 },
    ],
  },
];

// Physics tuning
const GRAVITY = 1500;
const THROTTLE_ACCEL = 560;
const BRAKE_ACCEL = 520;
const MAX_SPEED = 540;
const MIN_SPEED = -240;
const LINEAR_DAMP = 0.996;
const LEAN_TORQUE = 7.0;
const ANG_DAMP = 0.985;
const CHASSIS_W = 60;
const CHASSIS_H = 22;
const HEAD_R = 8;
const WHEEL_R = 10;
const BOUNCE = 0.22;           // vertical bounce on ground contact
const PX_PER_M = 10;           // HUD distance scale
const BEST_KEY = 'pg-faceplant-best';

// ── terrain helpers ──
function groundAt(terrain, x) {
  if (x <= terrain[0].x) return terrain[0].y;
  if (x >= terrain[terrain.length - 1].x) return terrain[terrain.length - 1].y;
  for (let i = 1; i < terrain.length; i++) {
    const a = terrain[i - 1], b = terrain[i];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return terrain[0].y;
}
function slopeAt(terrain, x) {
  // Forward-difference slope approximation.
  const e = 2;
  return (groundAt(terrain, x + e) - groundAt(terrain, x - e)) / (2 * e);
}
const inSpikeZone = (spikes, x) => spikes.some((s) => x >= s.x0 && x <= s.x1);

// Best-distance persistence — meters reached per course index.
function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)) || {}; }
  catch { return {}; }
}
function saveBest(courseIdx, meters) {
  try {
    const all = loadBest();
    if ((all[courseIdx] || 0) >= meters) return all[courseIdx];
    all[courseIdx] = meters;
    localStorage.setItem(BEST_KEY, JSON.stringify(all));
    return meters;
  } catch { return meters; }
}

// ── rider pose (bike-local coords) ──
// Shared by the renderer and the head-collision check so leaning forward
// genuinely moves your head toward the dirt. lean ∈ [-1 back .. +1 fwd].
function riderPose(lean, pedal) {
  const hip = { x: -7, y: -CHASSIS_H / 2 - 4 };
  const aT = 0.5 + lean * 0.45;                       // torso tilt from vertical
  const chest = { x: hip.x + Math.sin(aT) * 17, y: hip.y - Math.cos(aT) * 17 };
  const head  = { x: chest.x + Math.sin(aT - 0.12) * 10, y: chest.y - Math.cos(aT - 0.12) * 10 };
  const hand  = { x: 21, y: -CHASSIS_H / 2 - 6 };
  const elbow = { x: (chest.x + hand.x) / 2, y: (chest.y + hand.y) / 2 + 4.5 };
  const crank = { x: 2, y: 7 };
  const footF = { x: crank.x + Math.cos(pedal) * 7, y: crank.y + Math.sin(pedal) * 7 };
  const footB = { x: crank.x - Math.cos(pedal) * 7, y: crank.y - Math.sin(pedal) * 7 };
  const kneeF = { x: (hip.x + footF.x) / 2 + 4, y: (hip.y + footF.y) / 2 - 4 };
  const kneeB = { x: (hip.x + footB.x) / 2 + 4, y: (hip.y + footB.y) / 2 - 4 };
  return { hip, chest, head, hand, elbow, crank, footF, footB, kneeF, kneeB };
}

// ── ragdoll (verlet points + stick constraints) ──
function makeRagdoll(bike, lean) {
  const pose = riderPose(lean, 0);
  const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
  const toWorld = (p) => ({
    x: bike.x + p.x * cos - p.y * sin,
    y: bike.y + p.x * sin + p.y * cos,
  });
  const mk = (local, fling) => {
    const w = toWorld(local);
    return {
      x: w.x, y: w.y,
      px: w.x - (bike.vx / 60 + (Math.random() - 0.5) * 4),
      py: w.y - (bike.vy / 60 - fling - Math.random() * 2.5),
      r: 3,
    };
  };
  const pts = {
    head:  mk(pose.head, 4),  chest: mk(pose.chest, 3), hip: mk(pose.hip, 2),
    elbow: mk(pose.elbow, 2), hand:  mk(pose.hand, 1),
    kneeF: mk(pose.kneeF, 1), footF: mk(pose.footF, 0),
    kneeB: mk(pose.kneeB, 1), footB: mk(pose.footB, 0),
  };
  pts.head.r = 6;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const stick = (a, b) => ({ a: pts[a], b: pts[b], len: dist(pts[a], pts[b]) });
  return {
    pts,
    sticks: [
      stick('head', 'chest'), stick('chest', 'hip'),
      stick('chest', 'elbow'), stick('elbow', 'hand'),
      stick('hip', 'kneeF'), stick('kneeF', 'footF'),
      stick('hip', 'kneeB'), stick('kneeB', 'footB'),
    ],
  };
}
function tickRagdoll(rd, terrain, dt) {
  const gy2 = GRAVITY * dt * dt;
  for (const k in rd.pts) {
    const p = rd.pts[k];
    const nx = p.x + (p.x - p.px) * 0.985;
    const ny = p.y + (p.y - p.py) * 0.985 + gy2;
    p.px = p.x; p.py = p.y; p.x = nx; p.y = ny;
    const g = groundAt(terrain, p.x) - p.r;
    if (p.y > g) {
      // Bounce + ground friction.
      p.py = p.y + (p.y - p.py) * 0.45;
      p.px = p.x - (p.x - p.px) * 0.55;
      p.y = g;
    }
  }
  for (let it = 0; it < 3; it++) {
    rd.sticks.forEach(({ a, b, len }) => {
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.0001;
      const off = (d - len) / d / 2;
      a.x += dx * off; a.y += dy * off;
      b.x -= dx * off; b.y -= dy * off;
    });
  }
}

// ── drawing helpers ──
function drawWheel(ctx, x, y, r, spin, squash = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);
  // tire
  ctx.strokeStyle = '#14181c';
  ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2); ctx.stroke();
  // rim
  ctx.strokeStyle = '#aab2bc';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, r - 4.4, 0, Math.PI * 2); ctx.stroke();
  // spokes rotate with wheel speed
  ctx.strokeStyle = 'rgba(215, 224, 233, 0.9)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = spin + i * (Math.PI * 2 / 5);
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (r - 4.6), Math.sin(a) * (r - 4.6));
  }
  ctx.stroke();
  // hub
  ctx.fillStyle = '#2a3138';
  ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Bike frame + chain + engine block, in bike-local coords with the body
// dipped by suspension squash. Wheels are drawn separately (so the crash
// path can omit them).
function drawFrame(ctx, susp, throttle) {
  const dip = susp * 4.5;
  ctx.save();
  ctx.translate(0, dip);
  const axR = { x: -CHASSIS_W / 2 + 6, y: CHASSIS_H / 2 + 8 - dip };
  const axF = { x:  CHASSIS_W / 2 - 6, y: CHASSIS_H / 2 + 8 - dip };
  const crank = { x: 2, y: 7 };
  // chain (top + bottom runs to the rear axle)
  ctx.strokeStyle = '#4a525c';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(axR.x, axR.y - 3.5); ctx.lineTo(crank.x, crank.y - 4.5);
  ctx.moveTo(axR.x, axR.y + 3.5); ctx.lineTo(crank.x, crank.y + 4.5);
  ctx.stroke();
  ctx.setLineDash([]);
  // frame tubes
  ctx.strokeStyle = '#ff4d6d';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(axR.x, axR.y); ctx.lineTo(-7, -CHASSIS_H / 2 - 2);   // seat stay
  ctx.moveTo(axR.x, axR.y); ctx.lineTo(crank.x, crank.y);         // chain stay
  ctx.moveTo(crank.x, crank.y); ctx.lineTo(-7, -CHASSIS_H / 2 - 2); // seat tube
  ctx.moveTo(crank.x, crank.y); ctx.lineTo(19, -CHASSIS_H / 2 - 3); // down tube
  ctx.moveTo(-7, -CHASSIS_H / 2 - 2); ctx.lineTo(19, -CHASSIS_H / 2 - 3); // top tube
  ctx.moveTo(19, -CHASSIS_H / 2 - 3); ctx.lineTo(axF.x, axF.y);   // fork
  ctx.stroke();
  // engine block under the top tube
  ctx.fillStyle = '#1d242c';
  ctx.fillRect(-12, -4, 20, 10);
  ctx.strokeStyle = '#0a0d0e';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-12, -4, 20, 10);
  // crank disc + handlebar + seat
  ctx.fillStyle = '#343c46';
  ctx.beginPath(); ctx.arc(crank.x, crank.y, 4.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1d242c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(19, -CHASSIS_H / 2 - 3); ctx.lineTo(21, -CHASSIS_H / 2 - 7);
  ctx.stroke();
  ctx.fillStyle = '#0a0d0e';
  ctx.fillRect(-12, -CHASSIS_H / 2 - 5, 14, 4);
  // exhaust flame when throttle is held
  if (throttle) {
    ctx.fillStyle = '#ff8a3a';
    ctx.beginPath();
    ctx.moveTo(-CHASSIS_W / 2 + 4, 2);
    ctx.lineTo(-CHASSIS_W / 2 - 12 - Math.random() * 6, 0);
    ctx.lineTo(-CHASSIS_W / 2 - 6, 2);
    ctx.lineTo(-CHASSIS_W / 2 - 12 - Math.random() * 6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe14f';
    ctx.beginPath();
    ctx.arc(-CHASSIS_W / 2 + 2, 2, 2.2 + Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

const SKIN = '#ffd1a6';
const JERSEY = '#23365e';
const LIMB = '#1a2540';
const LIMB_BACK = '#111b33';
const HELMET = '#f4f6f8';

function limbLine(ctx, a, b, c, color, w) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  if (c) ctx.lineTo(c.x, c.y);
  ctx.stroke();
}

function drawHead(ctx, x, y, r, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  // helmet shell over the top half + a brand stripe
  ctx.fillStyle = HELMET;
  ctx.beginPath(); ctx.arc(0, -0.5, r + 1, Math.PI * 0.92, Math.PI * 2.08); ctx.fill();
  ctx.fillStyle = '#ff4d6d';
  ctx.beginPath(); ctx.arc(0, -0.5, r + 1, Math.PI * 1.25, Math.PI * 1.75); ctx.fill();
  ctx.strokeStyle = '#0a0d0e';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  // visor
  ctx.strokeStyle = '#2a3138';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(r * 0.2, -1); ctx.lineTo(r + 2.5, -1); ctx.stroke();
  ctx.restore();
}

// Articulated rider in bike-local space (call inside the bike transform).
function drawRider(ctx, lean, pedal, susp) {
  const dip = susp * 4.5;
  ctx.save();
  ctx.translate(0, dip);
  const p = riderPose(lean, pedal);
  // back limbs first (darker, behind the frame visually)
  limbLine(ctx, p.hip, p.kneeB, p.footB, LIMB_BACK, 4);
  // torso
  limbLine(ctx, p.hip, p.chest, null, JERSEY, 5.5);
  // front leg + arm
  limbLine(ctx, p.hip, p.kneeF, p.footF, LIMB, 4);
  limbLine(ctx, p.chest, p.elbow, p.hand, LIMB, 3.6);
  drawHead(ctx, p.head.x, p.head.y, HEAD_R - 1, lean * 0.3);
  ctx.restore();
}

function drawRagdoll(ctx, rd, camX) {
  ctx.save();
  ctx.translate(-camX, 0);
  const p = rd.pts;
  limbLine(ctx, p.hip, p.kneeB, p.footB, LIMB_BACK, 4);
  limbLine(ctx, p.hip, p.chest, null, JERSEY, 5.5);
  limbLine(ctx, p.hip, p.kneeF, p.footF, LIMB, 4);
  limbLine(ctx, p.chest, p.elbow, p.hand, LIMB, 3.6);
  const tilt = Math.atan2(p.head.y - p.chest.y, p.head.x - p.chest.x) + Math.PI / 2;
  drawHead(ctx, p.head.x, p.head.y, HEAD_R - 1, tilt);
  ctx.restore();
}

export default function FaceplantGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const viewRef   = useRef({ cssW: VIEW_W, cssH: VIEW_H, scale: 1, offX: 0, offY: 0, dispW: VIEW_W, dispH: VIEW_H });
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const courseIdxRef = useRef(0);
  const [courseIdx, setCourseIdx] = useState(0);
  const [time, setTime]       = useState(0);
  const [speed, setSpeed]     = useState(0);
  const [best, setBest]       = useState(() => loadBest()[0] || 0);
  const [status, setStatus]   = useState('ready'); // ready | playing | won | crashed
  const [reason, setReason]   = useState(null);     // 'spike' | 'head' | 'pit'

  const reset = () => {
    const course = COURSES[courseIdxRef.current];
    const startY = groundAt(course.terrain, 80);
    stateRef.current = {
      course,
      courseEnd: course.terrain[course.terrain.length - 1].x,
      goalX: course.terrain[course.terrain.length - 1].x - 40,
      bike: {
        x: 80, y: startY - 20,
        vx: 0, vy: 0,
        angle: 0, va: 0,
        onGround: true,
      },
      elapsed: 0,
      camX: 0,
      t: 0,                 // ambient clock (flag wave, clouds)
      lean: 0,              // eased lean input, -1 back .. +1 fwd
      wheelSpin: 0,
      pedal: 0,
      susp: 0,              // suspension squash 0..1
      airTime: 0,
      whooshed: false,
      bonus: 0,
      maxX: 80,
      throttle: false,
      slowMo: 0,            // seconds of 0.3x remaining (real time)
      stampT: -1,           // FACEPLANT stamp age, -1 = hidden
      ragdoll: null,
      crashBike: null,
      looseWheels: null,
      particles: [],
      floaters: [],
    };
    setTime(0);
    setSpeed(0);
    setBest(loadBest()[courseIdxRef.current] || 0);
    setStatus('ready');
    setReason(null);
    submittedRef.current = false;
  };

  const selectCourse = (i) => {
    courseIdxRef.current = i;
    setCourseIdx(i);
    reset();
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer: canvas buffer = parent css × dpr. We render the native
    // VIEW_W × VIEW_H level uniform-scaled and centered so the playfield
    // never clips off-screen on short widescreen viewports.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const scaleW = cssW / VIEW_W;
      const scaleH = cssH / VIEW_H;
      const scale = Math.max(0.5, Math.min(scaleW, scaleH, 1.6));
      const dispW = VIEW_W * scale;
      const dispH = VIEW_H * scale;
      viewRef.current = {
        cssW,
        cssH,
        scale,
        dispW,
        dispH,
        offX: Math.floor((cssW - dispW) / 2),
        offY: Math.floor((cssH - dispH) / 2),
      };
    });

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') reset();
      if (status === 'ready' && (k === ' ' || k === 'arrowright' || k === 'd')) setStatus('playing');
    };
    const ku = (e) => { keys[e.key.toLowerCase()] = false; keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay flags — held-button model. The throttle pill also
    // lifts the game out of 'ready' just like pressing → does on keyboard.
    const touchKeys = { throttle: false, brake: false, leanBack: false, leanFwd: false };
    wrap._setTouch = (id, v) => {
      if (id in touchKeys) touchKeys[id] = v;
      if (id === 'throttle' && v && status === 'ready') setStatus('playing');
    };

    // ── engine roll loop — pitch and gain track speed; quieter in air ──
    // Built on the shared audio context from sound.js so mute is honored.
    let roll = null;
    const stopRoll = () => {
      if (!roll) return;
      const r = roll; roll = null;
      try {
        const c = r.ctx;
        r.gain.gain.setTargetAtTime(0, c.currentTime, 0.05);
        r.osc.stop(c.currentTime + 0.3);
        r.sub.stop(c.currentTime + 0.3);
      } catch { /* ignore */ }
    };
    if (status === 'playing') {
      const c = ensureCtx();
      if (c) {
        try {
          const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 52;
          const sub = c.createOscillator(); sub.type = 'triangle'; sub.frequency.value = 26;
          const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300; lp.Q.value = 0.8;
          const gain = c.createGain(); gain.gain.value = 0;
          osc.connect(lp); sub.connect(lp); lp.connect(gain); gain.connect(c.destination);
          osc.start(); sub.start();
          roll = { ctx: c, osc, sub, lp, gain };
        } catch { roll = null; }
      }
    }
    const unsubMute = subscribeMute((isMute) => { if (isMute) stopRoll(); });
    const updateRoll = (vx, grounded) => {
      if (!roll) return;
      const c = roll.ctx;
      const sp = Math.min(1, Math.abs(vx) / MAX_SPEED);
      const f = 50 + sp * 135;
      roll.osc.frequency.setTargetAtTime(f, c.currentTime, 0.06);
      roll.sub.frequency.setTargetAtTime(f * 0.5, c.currentTime, 0.06);
      roll.lp.frequency.setTargetAtTime(240 + sp * 900, c.currentTime, 0.08);
      const target = sp < 0.02 ? 0 : (grounded ? 0.028 + sp * 0.045 : 0.010 + sp * 0.018);
      roll.gain.gain.setTargetAtTime(target, c.currentTime, 0.08);
    };

    const spawnDust = (s, x, y, count, power) => {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          type: 'dust',
          x: x + (Math.random() - 0.5) * 14,
          y: y - Math.random() * 4,
          vx: (Math.random() - 0.5) * 90 * power,
          vy: -30 - Math.random() * 70 * power,
          r: 2.5 + Math.random() * 3.5 * power,
          life: 0.5 + Math.random() * 0.4,
          max: 0.9,
        });
      }
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { bike, camX, particles, course } = s;
      const terrain = course.terrain;
      const view = viewRef.current;
      const { cssW, cssH, offX, offY, scale, dispW, dispH } = view;

      // Full-canvas sky gradient — extends past the playfield so the side
      // margins on wide viewports don't show empty backdrop.
      const sky = ctx.createLinearGradient(0, 0, 0, cssH);
      sky.addColorStop(0, '#6db8f2');
      sky.addColorStop(0.55, '#a6dcff');
      sky.addColorStop(1, '#eaf6ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cssW, cssH);

      // Sun + soft glow, anchored to the playfield's top-right.
      const sunX = offX + dispW - 90, sunY = offY + 60;
      const glow = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, 80);
      glow.addColorStop(0, 'rgba(255, 244, 196, 0.95)');
      glow.addColorStop(0.35, 'rgba(255, 238, 170, 0.35)');
      glow.addColorStop(1, 'rgba(255, 238, 170, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sunX - 80, sunY - 80, 160, 160);
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath(); ctx.arc(sunX, sunY, 22, 0, Math.PI * 2); ctx.fill();

      // Clouds — slow ambient drift plus light camera parallax.
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let i = 0; i < 7; i++) {
        const h = ((i * 7919) % 97) / 97;
        const cx = (((i * 261 + s.t * (6 + h * 8) - camX * 0.12) % (cssW + 280)) + cssW + 280) % (cssW + 280) - 140;
        const cy = offY + 30 + h * 110;
        const cs = 0.7 + h * 0.8;
        ctx.beginPath();
        ctx.arc(cx, cy, 16 * cs, 0, Math.PI * 2);
        ctx.arc(cx + 18 * cs, cy - 7 * cs, 13 * cs, 0, Math.PI * 2);
        ctx.arc(cx + 36 * cs, cy, 15 * cs, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant hills (3 parallax layers) — span the full canvas width so
      // the skyline keeps filling the side margins. Heights vary by hash.
      const hillLayer = (spacing, par, base, amp, color) => {
        ctx.fillStyle = color;
        for (let i = 0; i < 26; i++) {
          const h = ((i * 5417) % 89) / 89;
          const hx = (((i * spacing - camX * par) % (cssW + 420)) + cssW + 420) % (cssW + 420) - 210;
          const top = offY + base - amp * h;
          ctx.beginPath();
          ctx.moveTo(hx, offY + 300);
          ctx.quadraticCurveTo(hx + spacing * 0.38, top, hx + spacing * 0.76, offY + 300);
          ctx.closePath();
          ctx.fill();
        }
      };
      hillLayer(150, 0.18, 268, 38, 'rgba(110, 158, 130, 0.35)');
      hillLayer(180, 0.35, 276, 52, 'rgba(80, 140, 90, 0.5)');
      hillLayer(220, 0.55, 292, 58, 'rgba(58, 108, 68, 0.65)');

      // From here on, draw the level itself in its native coord system.
      // Translate so (0,0) lines up with the playfield top-left, then clip
      // so terrain / spikes don't bleed into the side margins.
      ctx.save();
      ctx.beginPath();
      ctx.rect(offX, offY, dispW, dispH);
      ctx.clip();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // Ground polygon — dirt body with a grass edge band on the polyline.
      const dirt = ctx.createLinearGradient(0, 230, 0, VIEW_H);
      dirt.addColorStop(0, '#8a5a33');
      dirt.addColorStop(1, '#5e3d22');
      ctx.fillStyle = dirt;
      ctx.beginPath();
      ctx.moveTo(-camX, VIEW_H);
      for (let i = 0; i < terrain.length; i++) {
        ctx.lineTo(terrain[i].x - camX, terrain[i].y);
      }
      ctx.lineTo(s.courseEnd - camX, VIEW_H);
      ctx.closePath();
      ctx.fill();
      // grass band: filled strip hugging the polyline
      ctx.fillStyle = '#5cae45';
      ctx.beginPath();
      for (let i = 0; i < terrain.length; i++) {
        const p = terrain[i];
        if (i === 0) ctx.moveTo(p.x - camX, p.y);
        else         ctx.lineTo(p.x - camX, p.y);
      }
      for (let i = terrain.length - 1; i >= 0; i--) {
        const p = terrain[i];
        ctx.lineTo(p.x - camX, p.y + 11);
      }
      ctx.closePath();
      ctx.fill();
      // sunny top highlight + dirt seam
      ctx.strokeStyle = '#8edb66';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < terrain.length; i++) {
        const p = terrain[i];
        if (i === 0) ctx.moveTo(p.x - camX, p.y);
        else         ctx.lineTo(p.x - camX, p.y);
      }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(47, 80, 36, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < terrain.length; i++) {
        const p = terrain[i];
        if (i === 0) ctx.moveTo(p.x - camX, p.y + 11);
        else         ctx.lineTo(p.x - camX, p.y + 11);
      }
      ctx.stroke();

      // Spikes + hazard warning band under each zone.
      course.spikes.forEach(({ x0, x1 }) => {
        // striped warning strip along the ground
        for (let x = x0 - 8; x < x1 + 8; x += 12) {
          const y = groundAt(terrain, x + 6);
          ctx.fillStyle = (Math.floor(x / 12) % 2 === 0) ? 'rgba(201, 30, 30, 0.85)' : 'rgba(26, 18, 14, 0.85)';
          ctx.beginPath();
          ctx.moveTo(x - camX, y + 1);
          ctx.lineTo(x - camX + 12, y + 1);
          ctx.lineTo(x - camX + 8, y + 8);
          ctx.lineTo(x - camX - 4, y + 8);
          ctx.closePath();
          ctx.fill();
        }
        // steel spikes with a lit left facet
        for (let x = x0; x <= x1; x += 14) {
          const y = groundAt(terrain, x);
          ctx.fillStyle = '#7c828c';
          ctx.beginPath();
          ctx.moveTo(x - camX - 6, y);
          ctx.lineTo(x - camX, y - 18);
          ctx.lineTo(x - camX + 6, y);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#c9cfd8';
          ctx.beginPath();
          ctx.moveTo(x - camX - 6, y);
          ctx.lineTo(x - camX, y - 18);
          ctx.lineTo(x - camX, y);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#454b55';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x - camX - 6, y);
          ctx.lineTo(x - camX, y - 18);
          ctx.lineTo(x - camX + 6, y);
          ctx.stroke();
        }
      });

      // Goal flag — checkered cloth waving on the ambient clock.
      const gx = s.goalX - camX;
      const gy = groundAt(terrain, s.goalX);
      ctx.strokeStyle = '#e8edf2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 100);
      ctx.stroke();
      const FLAG_W = 40, FLAG_H = 24, COLS = 4, ROWS = 2;
      const waveY = (col) => Math.sin(s.t * 7 - col * 1.15) * 2.6 * (col / COLS);
      for (let r = 0; r < ROWS; r++) {
        for (let cI = 0; cI < COLS; cI++) {
          const x0 = gx + (cI / COLS) * FLAG_W;
          const x1 = gx + ((cI + 1) / COLS) * FLAG_W;
          const y0 = gy - 100 + (r / ROWS) * FLAG_H;
          const y1 = gy - 100 + ((r + 1) / ROWS) * FLAG_H;
          ctx.fillStyle = (r + cI) % 2 === 0 ? '#f4f6f8' : '#14181c';
          ctx.beginPath();
          ctx.moveTo(x0, y0 + waveY(cI));
          ctx.lineTo(x1, y0 + waveY(cI + 1));
          ctx.lineTo(x1, y1 + waveY(cI + 1));
          ctx.lineTo(x0, y1 + waveY(cI));
          ctx.closePath();
          ctx.fill();
        }
      }

      // Bike + rider — riding form, or scattered wreckage after a crash.
      if (!s.crashBike) {
        const dip = s.susp * 4.5;
        ctx.save();
        ctx.translate(bike.x - camX, bike.y);
        ctx.rotate(bike.angle);
        drawFrame(ctx, s.susp, s.throttle);
        const squash = 1 - s.susp * 0.22;
        drawWheel(ctx, -CHASSIS_W / 2 + 6, CHASSIS_H / 2 + 8, WHEEL_R, s.wheelSpin, squash);
        drawWheel(ctx,  CHASSIS_W / 2 - 6, CHASSIS_H / 2 + 8, WHEEL_R, s.wheelSpin, squash);
        drawRider(ctx, s.lean, s.pedal, s.susp);
        ctx.restore();
        // air-time indicator above the rider
        if (!bike.onGround && s.airTime > 0.45 && status === 'playing') {
          const big = s.airTime > 1;
          const pulse = big ? 1 + Math.sin(s.t * 18) * 0.08 : 1;
          ctx.save();
          ctx.translate(bike.x - camX, bike.y - 58 - dip);
          ctx.scale(pulse, pulse);
          ctx.font = `700 ${big ? 17 : 12}px "Space Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(10, 13, 14, 0.75)';
          ctx.fillStyle = big ? '#ffe14f' : '#f4f6f8';
          const label = big ? 'BIG AIR' : `AIR ${s.airTime.toFixed(1)}s`;
          ctx.strokeText(label, 0, 0);
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }
      } else {
        // wrecked frame tumbling on its own
        const cb = s.crashBike;
        ctx.save();
        ctx.translate(cb.x - camX, cb.y);
        ctx.rotate(cb.angle);
        drawFrame(ctx, 0, false);
        ctx.restore();
        // wheels spinning away
        (s.looseWheels || []).forEach((w) => {
          drawWheel(ctx, w.x - camX, w.y, w.r, w.spin);
        });
        if (s.ragdoll) drawRagdoll(ctx, s.ragdoll, camX);
      }

      // Particles — dust puffs, sparks, debris, confetti.
      particles.forEach((p) => {
        const a = Math.max(0, Math.min(1, p.life / p.max));
        if (p.type === 'dust') {
          const grow = 1 + (1 - a) * 1.6;
          ctx.globalAlpha = a * 0.55;
          ctx.fillStyle = '#c4a173';
          ctx.beginPath();
          ctx.arc(p.x - camX, p.y, p.r * grow, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - camX - 1.5, p.y - 1.5, 3, 3);
        }
        ctx.globalAlpha = 1;
      });

      // Floating reward text ("BIG AIR +200" etc).
      s.floaters.forEach((f) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life / f.max));
        ctx.font = `700 ${f.size}px "Space Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(10, 13, 14, 0.75)';
        ctx.strokeText(f.text, f.x - camX, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x - camX, f.y);
        ctx.globalAlpha = 1;
      });

      // Speed lines when really moving.
      if (status === 'playing' && bike.vx > 340) {
        const k = Math.min(1, (bike.vx - 340) / (MAX_SPEED - 340));
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.10 + k * 0.18})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const ly = 24 + ((i * 1571) % (VIEW_H - 60));
          const lx = VIEW_W - (((s.t * (700 + k * 600) + i * 173) % (VIEW_W + 160)));
          const len = 26 + k * 60;
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + len, ly);
        }
        ctx.stroke();
      }

      // HUD — distance bar (rendered inside the playfield's translated/clipped
      // space so the start/finish labels track the actual level edges)
      const barW = VIEW_W - 40;
      const toBar = (x) => 20 + barW * Math.min(1, x / s.courseEnd);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(20, 20, barW, 6);
      // spike zones marked on the bar
      ctx.fillStyle = 'rgba(255, 90, 90, 0.9)';
      course.spikes.forEach(({ x0, x1 }) => {
        ctx.fillRect(toBar(x0), 20, Math.max(3, toBar(x1) - toBar(x0)), 6);
      });
      ctx.fillStyle = '#ffe14f';
      ctx.fillRect(20, 20, barW * Math.min(1, bike.x / s.courseEnd), 6);
      // rider marker
      ctx.fillStyle = '#f4f6f8';
      ctx.beginPath();
      const mx = toBar(Math.max(0, Math.min(s.courseEnd, bike.x)));
      ctx.moveTo(mx, 27);
      ctx.lineTo(mx - 4, 33);
      ctx.lineTo(mx + 4, 33);
      ctx.closePath();
      ctx.fill();
      // start/goal labels + course name
      ctx.fillStyle = '#0a0d0e';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('START', 20, 44);
      ctx.textAlign = 'right';
      ctx.fillText('FINISH', VIEW_W - 20, 44);
      ctx.textAlign = 'center';
      ctx.fillText(course.name.toUpperCase(), VIEW_W / 2, 44);

      ctx.restore();

      // FACEPLANT stamp — screen-space pop over the wreck.
      if (s.stampT >= 0) {
        const t = s.stampT;
        const appear = Math.min(1, t / 0.18);
        const overshoot = 1 + Math.max(0, 0.35 - t) * 1.4;
        const fade = t > 1.9 ? Math.max(0, 1 - (t - 1.9) / 0.5) : 1;
        ctx.save();
        ctx.globalAlpha = appear * fade;
        ctx.translate(cssW / 2, offY + dispH * 0.36);
        ctx.rotate(-0.10);
        ctx.scale(overshoot * scale, overshoot * scale);
        ctx.font = '700 56px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.lineWidth = 9;
        ctx.strokeStyle = '#0a0d0e';
        ctx.strokeText('FACEPLANT', 0, 0);
        ctx.fillStyle = '#ff4d6d';
        ctx.fillText('FACEPLANT', 0, 0);
        ctx.restore();
      }
    };

    let raf = 0;
    let last = performance.now();

    const step = () => {
      raf = requestAnimationFrame(step);
      const now = performance.now();
      const rawDt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = stateRef.current; if (!s) return;
      const { bike, course } = s;
      const terrain = course.terrain;

      // Slow-mo beat — the timer burns in real time, the sim runs at 0.3x.
      let dt = rawDt;
      if (s.slowMo > 0) { s.slowMo -= rawDt; dt = rawDt * 0.3; }
      if (s.stampT >= 0) s.stampT += rawDt;
      s.t += dt;

      if (status === 'playing') {
        s.elapsed += dt;
        if ((s.elapsed | 0) !== (s._hud | 0)) {
          s._hud = s.elapsed | 0;
          setTime(Math.round(s.elapsed));
        }

        // Controls
        const throttle = keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.throttle;
        const brake    = keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.brake;
        const leanBack = keys['w'] || keys['arrowup']    || keys['keyw'] || touchKeys.leanBack;
        const leanFwd  = keys['s'] || keys['arrowdown']  || keys['keys'] || touchKeys.leanFwd;
        s.throttle = !!throttle;

        if (throttle) bike.vx += THROTTLE_ACCEL * dt;
        if (brake)    bike.vx -= BRAKE_ACCEL   * dt;
        if (leanBack) bike.va -= LEAN_TORQUE   * dt;
        if (leanFwd)  bike.va += LEAN_TORQUE   * dt;

        // Eased rider lean for the articulated pose.
        const leanTarget = leanBack ? -1 : (leanFwd ? 1 : 0);
        s.lean += (leanTarget - s.lean) * Math.min(1, dt * 10);

        // Integrate
        bike.vy += GRAVITY * dt;
        bike.vx = Math.max(MIN_SPEED, Math.min(MAX_SPEED, bike.vx * LINEAR_DAMP));
        bike.va *= ANG_DAMP;
        bike.x  += bike.vx * dt;
        bike.y  += bike.vy * dt;
        bike.angle += bike.va * dt;
        s.maxX = Math.max(s.maxX, bike.x);

        // Wheel + pedal spin tracks ground speed.
        s.wheelSpin += (bike.vx / WHEEL_R) * dt;
        s.pedal += (bike.vx / 30) * dt;

        // Camera follows
        s.camX = Math.max(0, Math.min(s.courseEnd - VIEW_W, bike.x - VIEW_W * 0.32));

        // Ground collision: sample 3 bottom points of the chassis rotated by angle.
        const samples = [-CHASSIS_W / 2 + 6, 0, CHASSIS_W / 2 - 6];
        let grounded = false;
        const impactVy = bike.vy;
        for (const localX of samples) {
          // Local point on the bottom edge:
          const lx = localX;
          const ly = CHASSIS_H / 2 + 10;     // wheel bottom
          // rotate + translate
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const wx = bike.x + lx * cos - ly * sin;
          const wy = bike.y + lx * sin + ly * cos;
          const gy = groundAt(terrain, wx);
          if (wy > gy) {
            // Push bike up by the difference (apply to chassis position).
            const dyPush = wy - gy;
            bike.y -= dyPush;
            // Cancel downward velocity and bounce slightly.
            if (bike.vy > 0) bike.vy = -bike.vy * BOUNCE;
            // Align rotation gently toward slope.
            const slope = slopeAt(terrain, wx);
            const target = Math.atan(slope);
            const dAng = target - bike.angle;
            bike.angle += dAng * 0.12;
            bike.va *= 0.9;
            grounded = true;
          }
        }

        // Landing: suspension squash + dust + thud scaled by impact,
        // and the big-air bonus if the jump earned it.
        if (grounded && !bike.onGround) {
          const impact = Math.max(0, impactVy);
          if (impact > 160) {
            const power = Math.min(1, impact / 700);
            s.susp = Math.min(1, 0.3 + power);
            spawnDust(s, bike.x, groundAt(terrain, bike.x), Math.round(4 + power * 12), 0.5 + power);
            sfx.faceLand(power);
          }
          if (s.airTime > 1) {
            s.bonus += 200;
            s.floaters.push({
              x: bike.x, y: bike.y - 60, text: 'BIG AIR +200',
              life: 1.2, max: 1.2, color: '#ffe14f', size: 18,
            });
            sfx.faceBigAir();
          }
          s.airTime = 0;
          s.whooshed = false;
        }
        if (!grounded) {
          s.airTime += dt;
          if (s.airTime > 0.45 && !s.whooshed) { s.whooshed = true; sfx.faceAir(); }
        }
        bike.onGround = grounded;
        s.susp += (0 - s.susp) * Math.min(1, dt * 7);

        // Wheelie sparks — rear wheel scraping while leaning back at speed.
        if (grounded && leanBack && bike.vx > 280 && bike.angle < -0.12) {
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const rx = bike.x + (-CHASSIS_W / 2 + 6) * cos - (CHASSIS_H / 2 + 10) * sin;
          const ry = bike.y + (-CHASSIS_W / 2 + 6) * sin + (CHASSIS_H / 2 + 10) * cos;
          for (let i = 0; i < 2; i++) {
            s.particles.push({
              type: 'spark',
              x: rx, y: ry,
              vx: -bike.vx * 0.3 - Math.random() * 80,
              vy: -40 - Math.random() * 110,
              life: 0.25 + Math.random() * 0.2,
              max: 0.45,
              color: i % 2 ? '#ffe14f' : '#ffb347',
            });
          }
        }
        // Rolling dust kicked up behind the rear wheel at speed.
        if (grounded && Math.abs(bike.vx) > 220 && Math.random() < 0.35) {
          spawnDust(s, bike.x - CHASSIS_W / 2, groundAt(terrain, bike.x - CHASSIS_W / 2), 1, 0.4);
        }

        // Head contact = crash. Head position follows the lean pose.
        {
          const pose = riderPose(s.lean, s.pedal);
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const hx = bike.x + pose.head.x * cos - pose.head.y * sin;
          const hy = bike.y + pose.head.x * sin + pose.head.y * cos;
          if (hy + HEAD_R > groundAt(terrain, hx) && hx > 20) {
            crash('head');
            return;
          }
        }

        // Spike contact at any sampled chassis edge.
        if (inSpikeZone(course.spikes, bike.x)) {
          const gy = groundAt(terrain, bike.x);
          if (bike.y + CHASSIS_H / 2 + 10 > gy - 14) {
            crash('spike');
            return;
          }
        }

        // Falling off?
        if (bike.y > VIEW_H + 60) {
          crash('pit');
          return;
        }

        // Reached the goal
        if (bike.x >= s.goalX) {
          setStatus('won');
          sfx.faceWin();
          setBest(saveBest(courseIdxRef.current, Math.round(s.maxX / PX_PER_M)));
          // confetti burst at the flag
          const fy = groundAt(terrain, s.goalX) - 90;
          for (let i = 0; i < 36; i++) {
            s.particles.push({
              type: 'spark',
              x: s.goalX, y: fy,
              vx: (Math.random() - 0.5) * 320,
              vy: -60 - Math.random() * 260,
              life: 0.8 + Math.random() * 0.8,
              max: 1.6,
              color: ['#ffe14f', '#35f0c9', '#ff4d6d', '#f4f6f8'][i % 4],
            });
          }
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1000 + Math.max(0, course.seconds - s.elapsed) * 10 + s.bonus));
            submitScore('happywheels', score, { time: Math.round(s.elapsed), course: courseIdxRef.current });
          }
        }

        setSpeed(Math.round(bike.vx));
        updateRoll(bike.vx, grounded);
      }

      // Crash aftermath: ragdoll, wrecked frame, loose wheels keep simulating
      // (under slow-mo at first) regardless of React status.
      if (s.ragdoll) tickRagdoll(s.ragdoll, terrain, dt);
      if (s.crashBike) {
        const cb = s.crashBike;
        cb.vy += GRAVITY * dt;
        cb.x += cb.vx * dt;
        cb.y += cb.vy * dt;
        cb.angle += cb.va * dt;
        const gy = groundAt(terrain, cb.x) - (CHASSIS_H / 2 + 6);
        if (cb.y > gy) {
          cb.y = gy;
          if (cb.vy > 0) cb.vy = -cb.vy * 0.4;
          cb.vx *= 0.92;
          cb.va *= 0.85;
        }
        // ease the camera after the wreck so the tumble stays framed
        const target = Math.max(0, Math.min(s.courseEnd - VIEW_W, cb.x - VIEW_W * 0.4));
        s.camX += (target - s.camX) * Math.min(1, dt * 3);
      }
      (s.looseWheels || []).forEach((w) => {
        w.vy += GRAVITY * dt;
        w.x += w.vx * dt;
        w.y += w.vy * dt;
        w.spin += (w.vx / w.r) * dt;
        const gy = groundAt(terrain, w.x) - w.r;
        if (w.y > gy) {
          w.y = gy;
          if (w.vy > 0) w.vy = -w.vy * 0.45;
          w.vx *= 0.96;
        }
      });

      // Particles tick
      s.particles.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.type === 'dust' ? 60 : 500) * dt;
        if (p.type === 'dust') { p.vx *= 0.96; p.vy *= 0.96; }
        p.life -= dt;
      });
      s.particles = s.particles.filter((p) => p.life > 0);
      s.floaters.forEach((f) => { f.y -= 28 * dt; f.life -= dt; });
      s.floaters = s.floaters.filter((f) => f.life > 0);

      draw();
    };

    const crash = (why) => {
      if (status !== 'playing') return;
      setStatus('crashed');
      setReason(why);
      const s = stateRef.current;
      const { bike } = s;
      stopRoll();
      sfx.faceCrash();
      setBest(saveBest(courseIdxRef.current, Math.round(s.maxX / PX_PER_M)));

      // Rider ragdolls free of the bike; wheels fly off; frame tumbles.
      s.ragdoll = makeRagdoll(bike, s.lean);
      s.crashBike = {
        x: bike.x, y: bike.y,
        vx: bike.vx * 0.45, vy: Math.min(bike.vy, 0) - 120,
        angle: bike.angle,
        va: (Math.random() - 0.5) * 10 + Math.sign(bike.vx || 1) * 7,
      };
      const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
      s.looseWheels = [-CHASSIS_W / 2 + 6, CHASSIS_W / 2 - 6].map((lx, i) => ({
        x: bike.x + lx * cos - (CHASSIS_H / 2 + 8) * sin,
        y: bike.y + lx * sin + (CHASSIS_H / 2 + 8) * cos,
        vx: bike.vx * (0.5 + Math.random() * 0.5) + (i === 0 ? -90 : 130),
        vy: -160 - Math.random() * 160,
        spin: bike.vx / WHEEL_R,
        r: WHEEL_R,
      }));

      // Dust cloud + debris burst at the wreck.
      const gy = groundAt(s.course.terrain, bike.x);
      for (let i = 0; i < 18; i++) {
        s.particles.push({
          type: 'dust',
          x: bike.x + (Math.random() - 0.5) * 36,
          y: gy - Math.random() * 10,
          vx: (Math.random() - 0.5) * 200,
          vy: -40 - Math.random() * 130,
          r: 4 + Math.random() * 6,
          life: 0.7 + Math.random() * 0.6,
          max: 1.3,
        });
      }
      for (let i = 0; i < 16; i++) {
        s.particles.push({
          type: 'spark',
          x: bike.x, y: bike.y - CHASSIS_H,
          vx: (Math.random() - 0.5) * 360,
          vy: -120 - Math.random() * 160,
          life: 0.5 + Math.random() * 0.4,
          max: 0.9,
          color: i % 2 ? '#ff4d6d' : '#c91e1e',
        });
      }

      // Slow-mo beat + stamp.
      s.slowMo = 0.4;
      s.stampT = 0;

      if (!submittedRef.current) {
        submittedRef.current = true;
        submitScore('happywheels', 0, {
          crash: why,
          time: Math.round(s.elapsed),
          dist: Math.round(s.maxX / PX_PER_M),
          course: courseIdxRef.current,
        });
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      stopRoll();
      unsubMute();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const bike = stateRef.current?.bike;
  const distM = bike ? Math.round(Math.min(bike.x, stateRef.current.courseEnd) / PX_PER_M) : 0;

  const reasonLabel = {
    spike: 'Spikes. Always the spikes.',
    head:  'Head, meet dirt.',
    pit:   'Off the edge of the world.',
  }[reason];

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const setTouch = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div className="face">
      <div className="face-bar">
        <span>Time <b>{time}s</b></span>
        <span>Distance <b>{distM}m</b></span>
        <span>Best <b>{best}m</b></span>
        <span>Speed <b>{speed}</b></span>
        <span style={{ display: 'inline-flex', gap: 6, marginLeft: 'var(--s-3, 12px)' }}>
          {COURSES.map((c, i) => (
            <button
              key={c.name}
              className={`btn btn-sm ${i === courseIdx ? 'btn-primary' : ''}`}
              onClick={() => selectCourse(i)}
              title={c.name}
            >
              {i + 1}
            </button>
          ))}
        </span>
        <span style={{marginLeft:'auto'}}>
          {status === 'ready' && <span style={{color:'var(--accent)'}}>Press → or Space to start</span>}
          {(status === 'crashed' || status === 'won') && <button className="btn btn-primary btn-sm" onClick={reset}>Restart</button>}
        </span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="face-canvas"/>
        {isTouch && (
          <>
            {/* Brake / throttle pair — bottom-left */}
            <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 10, zIndex: 5 }}>
              <PillBtn label="BRAKE" wide onDown={() => setTouch('brake', true)}    onUp={() => setTouch('brake', false)} />
              <PillBtn label="GO"    wide onDown={() => setTouch('throttle', true)} onUp={() => setTouch('throttle', false)} />
            </div>
            {/* Lean stack — bottom-right, lean-back on top */}
            <div style={{ position: 'absolute', bottom: 18, right: 18, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 5 }}>
              <PillBtn label="LEAN ↑" wide onDown={() => setTouch('leanBack', true)} onUp={() => setTouch('leanBack', false)} />
              <PillBtn label="LEAN ↓" wide onDown={() => setTouch('leanFwd', true)}  onUp={() => setTouch('leanFwd', false)} />
            </div>
          </>
        )}
      </div>
      {status === 'won' && (
        <div className="face-result" style={{color:'var(--accent)'}}>
          {COURSES[courseIdx].name} cleared · {time}s · bones intact
          {courseIdx < COURSES.length - 1 && (
            <button
              className="btn btn-primary btn-sm"
              style={{ marginLeft: 10 }}
              onClick={() => selectCourse(courseIdx + 1)}
            >
              Next course
            </button>
          )}
        </div>
      )}
      {status === 'crashed' && reason && (
        <div className="face-result" style={{color:'#ff4d6d'}}>{reasonLabel} · {distM}m</div>
      )}
      <div className="face-hint">→ throttle · ← brake · W/↑ lean back · S/↓ lean forward · R restart</div>
    </div>
  );
}

// Inline-styled touch pill — held-button model. Throttle / brake / lean
// flags stay set as long as the pill is held.
function PillBtn({ label, wide, onDown, onUp }) {
  const base = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: wide ? 96 : 56,
    height: 56,
    borderRadius: 28,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.18)',
    color: '#fff',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontSize: wide ? 11 : 18,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
  };
  return (
    <button
      style={base}
      onPointerDown={(e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} onDown?.(); }}
      onPointerUp={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerCancel={(e) => { e.preventDefault(); onUp?.(); }}
      onPointerLeave={(e) => { if (e.buttons === 0) onUp?.(); }}
      aria-label={label}
    >
      {label}
    </button>
  );
}
