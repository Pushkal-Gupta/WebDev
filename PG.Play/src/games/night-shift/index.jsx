// NIGHT SHIFT — original side-view stealth.
//
//  • You have three nights, three floors, each ending with a glowing exit door.
//  • Guards patrol a fixed path. Each sweeps a flashlight cone — enter it
//    standing and a detection meter fills. Fill it and the guard snaps to
//    alert, and you restart the current night.
//  • Hold Shift to tiptoe — 45 % slower, detection rate cut in half.
//  • Loot (gems on pedestals, paintings on the wall) is optional — walk
//    past a piece to lift it. The win card tallies the haul per night.
//  • No combat. No saves. Just read patrols, time the gap, walk.
//  • Controls: A/D or arrows to move. Shift to tiptoe. R to restart the
//    current night. Space (or the on-screen pad) also tiptoes for touch.
//
// Visual language: shadow is SAFE (cool blue), light is DANGEROUS (warm).
// Ceiling lamps pour warm pools onto the floor with dust motes in the
// beams; guard flashlights are the same warm family until alert, when
// they snap red.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { consumeAdminStartLevel } from '../../utils/admin.js';

// Scene dimensions are fixed — levels are hand-tuned to this rect. The
// fluid sizer fits the canvas to the viewport but the scene is drawn
// centered inside, with a flat backdrop padding the margins. A wider
// canvas just gives more room around the same playfield.
const W = 840;
const H = 460;
const FLOOR_Y = 360;
const P_W = 18, P_H = 30;
const WALK_SPEED = 180;
const TIPTOE_SPEED = 100;
const DETECT_RATE_WALK = 2.4;     // full detection in ~0.42s when walking
const DETECT_RATE_TIPTOE = 1.1;   // ~0.91s when tiptoe — still dangerous up close
const DETECT_DECAY = 3.0;
const CONE_HALF_ANGLE = 0.42;     // ~24°
const CONE_RANGE = 210;
const ALERT_HOLD = 0.9;           // guard freezes + "!" before the night resets

const LEVELS = [
  {
    name: 'Reception',
    exit: W - 64,
    guards: [
      { x: 420, y: FLOOR_Y - P_H, minX: 260, maxX: 680, speed: 80, dir: 1 },
    ],
    props: [{ x: 150, y: FLOOR_Y - 28, w: 40, h: 28 }], // crate you can tuck behind (visual only)
    lamps: [150, 420, 690],
    frames: [ // wall decor only — not collectible
      { x: 88, y: 70, w: 54, h: 40 }, { x: 300, y: 62, w: 70, h: 52 }, { x: 640, y: 72, w: 48, h: 38 },
    ],
    shelf: { x: 470, w: 80 },
    loot: [
      { x: 240, kind: 'gem', value: 250 },
      { x: 560, y: 76, kind: 'painting', value: 400 },
    ],
  },
  {
    name: 'Second floor',
    exit: W - 64,
    guards: [
      { x: 260, y: FLOOR_Y - P_H, minX: 140, maxX: 420, speed: 110, dir: 1 },
      { x: 620, y: FLOOR_Y - P_H, minX: 480, maxX: 760, speed: 80, dir: -1 },
    ],
    props: [{ x: 440, y: FLOOR_Y - 34, w: 46, h: 34 }],
    lamps: [130, 400, 670],
    frames: [
      { x: 196, y: 66, w: 58, h: 44 }, { x: 560, y: 60, w: 76, h: 54 },
    ],
    shelf: { x: 300, w: 90 },
    loot: [
      { x: 100, y: 74, kind: 'painting', value: 350 },
      { x: 350, kind: 'gem', value: 200 },
      { x: 730, kind: 'gem', value: 300 },
    ],
  },
  {
    name: 'Penthouse',
    exit: W - 64,
    guards: [
      { x: 220, y: FLOOR_Y - P_H, minX: 120, maxX: 330, speed: 120, dir: 1 },
      { x: 480, y: FLOOR_Y - P_H, minX: 370, maxX: 580, speed: 90, dir: -1 },
      { x: 700, y: FLOOR_Y - P_H, minX: 610, maxX: 780, speed: 130, dir: 1 },
    ],
    props: [
      { x: 340, y: FLOOR_Y - 32, w: 32, h: 32 },
      { x: 590, y: FLOOR_Y - 32, w: 32, h: 32 },
    ],
    lamps: [120, 420, 700],
    frames: [
      { x: 60, y: 64, w: 64, h: 48 }, { x: 380, y: 58, w: 84, h: 58 }, { x: 690, y: 68, w: 52, h: 42 },
    ],
    shelf: { x: 180, w: 80 },
    loot: [
      { x: 280, y: 70, kind: 'painting', value: 500 },
      { x: 520, kind: 'gem', value: 250 },
      { x: 660, kind: 'gem', value: 250 },
    ],
  },
];

// Deterministic per-index jitter for decor / motes — keeps every frame
// stable without storing particle state.
const hash01 = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export default function NightShiftGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef  = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 }); // fluid render dimensions
  const submittedRef = useRef(false);
  const lootBankRef = useRef(0);      // value from completed nights
  const lootLogRef = useRef([]);      // ["2/2", ...] per finished night
  const [level, setLevel]     = useState(() => {
    const adminStart = consumeAdminStartLevel('bob');
    return adminStart != null ? Math.max(0, Math.min(2, adminStart)) : 0;
  });
  const [caught, setCaught]   = useState(0);
  const [time, setTime]       = useState(0);
  const [lootHud, setLootHud] = useState(0);
  const [status, setStatus]   = useState('playing'); // playing | won

  const loadLevel = (idx) => {
    const lv = LEVELS[idx];
    stateRef.current = {
      lv,
      player: { x: 40, y: FLOOR_Y - P_H, facing: 1, stride: 0, moving: false, sneak: false },
      guards: lv.guards.map((g) => ({ ...g, phase: Math.random() * Math.PI * 2, alertPop: 0 })),
      loot: lv.loot.map((o) => ({ ...o, taken: false })),
      lootVal: 0,
      detect: 0,
      sightPop: 0,        // "?" pop timer — restarts each time sight is regained
      sighted: false,
      alert: null,        // { t } while a guard has fully spotted you
      heartT: 0,          // countdown to next heartbeat
      heartPulse: 0,      // 1 on beat, decays — drives the vignette
      floats: [],         // { x, y, txt, t }
      parts: [],          // sparkle particles { x, y, vx, vy, t, hue }
      elapsed: 0,
      caughtFlash: 0,
      exitFlash: 0,
    };
    setLootHud(lootBankRef.current);
  };

  useEffect(() => {
    loadLevel(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer — uniform scale-to-fit so the 840×460 corridor never
    // clips off-screen on short widescreen viewports.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      const scaleW = cssW / W;
      const scaleH = cssH / H;
      const scale = Math.max(0.5, Math.min(scaleW, scaleH, 1.6));
      const dispW = W * scale;
      const dispH = H * scale;
      const offX = (cssW - dispW) / 2;
      const offY = (cssH - dispH) / 2;
      viewRef.current = { cssW, cssH, scale, offX, offY };
    });

    const keys = {};
    const kd = (e) => {
      const k = e.key.toLowerCase();
      keys[k] = true;
      keys[e.code] = true;
      if (k === 'r') {
        submittedRef.current = false;
        loadLevel(level);
      }
    };
    const ku = (e) => {
      keys[e.key.toLowerCase()] = false;
      keys[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    // Touch overlay flags — flipped by the pill buttons rendered in JSX
    // below. The wrap element exposes a setter so the React-side handlers
    // can talk to the loop's local state without re-binding refs.
    const touchKeys = { left: false, right: false, tiptoe: false };
    wrap._setTouch = (id, v) => {
      if (id === 'left')   touchKeys.left   = v;
      if (id === 'right')  touchKeys.right  = v;
      if (id === 'tiptoe') touchKeys.tiptoe = v;
    };

    const coneContainsPlayer = (g, px, py) => {
      const dx = px - g.x;
      const dy = py - g.y;
      const d = Math.hypot(dx, dy);
      if (d > CONE_RANGE || d < 4) return false;
      const dir = g.dir >= 0 ? 0 : Math.PI;
      const ang = Math.atan2(dy, dx);
      let delta = ang - dir;
      while (delta >  Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      return Math.abs(delta) < CONE_HALF_ANGLE;
    };

    const caughtReset = () => {
      setCaught((c) => c + 1);
      setStatus('playing');
      loadLevel(level);
    };

    // ── draw helpers ────────────────────────────────────────────

    const drawBackdrop = (t) => {
      // Cool, dark museum interior — the resting state of the scene.
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0d1320');
      grad.addColorStop(0.78, '#101725');
      grad.addColorStop(1, '#080c14');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Ceiling band + cornice line
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, W, 38);
      ctx.fillStyle = 'rgba(120,150,210,0.10)';
      ctx.fillRect(0, 38, W, 2);

      // Wainscot panel grid on the wall
      ctx.strokeStyle = 'rgba(140,170,230,0.06)';
      ctx.lineWidth = 1;
      const panelW = W / 7;
      for (let i = 0; i < 7; i++) {
        const px0 = i * panelW + 10;
        ctx.strokeRect(px0, 178, panelW - 20, 96);
        ctx.strokeRect(px0 + 6, 184, panelW - 32, 84);
      }
      // Chair rail
      ctx.fillStyle = 'rgba(140,170,230,0.08)';
      ctx.fillRect(0, 170, W, 3);

      // baseboard
      ctx.fillStyle = '#222d44';
      ctx.fillRect(0, FLOOR_Y - 5, W, 5);
      // floor
      const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
      floorGrad.addColorStop(0, '#161e30');
      floorGrad.addColorStop(1, '#0a0e17');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      // floor boards
      ctx.strokeStyle = 'rgba(160,190,255,0.045)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y);
        ctx.lineTo(x + 26, H);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(160,190,255,0.03)';
      for (let y = FLOOR_Y + 18; y < H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      void t;
    };

    const drawFrame = (f, hollow) => {
      // Gilded frame; `hollow` leaves a pale dust-shadow where art used to hang.
      ctx.fillStyle = '#3a3424';
      ctx.fillRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
      ctx.strokeStyle = '#6b5a32';
      ctx.lineWidth = 2;
      ctx.strokeRect(f.x - 3, f.y - 3, f.w + 6, f.h + 6);
      if (hollow) {
        ctx.fillStyle = 'rgba(190,205,235,0.07)';
        ctx.fillRect(f.x, f.y, f.w, f.h);
        ctx.strokeStyle = 'rgba(190,205,235,0.14)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(f.x + 3, f.y + 3, f.w - 6, f.h - 6);
        ctx.setLineDash([]);
      } else {
        const art = ctx.createLinearGradient(f.x, f.y, f.x + f.w, f.y + f.h);
        art.addColorStop(0, '#1c2a45');
        art.addColorStop(0.55, '#2c3050');
        art.addColorStop(1, '#15203a');
        ctx.fillStyle = art;
        ctx.fillRect(f.x, f.y, f.w, f.h);
        // A hint of a subject — diagonal hill + moon dot, museum-vague
        ctx.fillStyle = 'rgba(200,215,255,0.10)';
        ctx.beginPath();
        ctx.moveTo(f.x, f.y + f.h);
        ctx.lineTo(f.x + f.w * 0.6, f.y + f.h * 0.45);
        ctx.lineTo(f.x + f.w, f.y + f.h);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(f.x + f.w * 0.78, f.y + f.h * 0.3, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(230,238,255,0.18)';
        ctx.fill();
      }
    };

    const drawDecor = (lv) => {
      (lv.frames || []).forEach((f) => drawFrame(f, false));
      if (lv.shelf) {
        const s = lv.shelf;
        const sy = 132;
        ctx.fillStyle = '#2a3145';
        ctx.fillRect(s.x, sy, s.w, 5);
        ctx.fillStyle = '#1c2333';
        ctx.fillRect(s.x + 4, sy + 5, 4, 10);
        ctx.fillRect(s.x + s.w - 8, sy + 5, 4, 10);
        // little vases / busts on the shelf
        for (let i = 0; i < 3; i++) {
          const vx = s.x + 12 + i * (s.w - 24) / 2;
          const h = 10 + hash01(s.x + i) * 8;
          ctx.fillStyle = i === 1 ? '#3d4a68' : '#33405c';
          ctx.beginPath();
          ctx.ellipse(vx, sy - h / 2, 4.5, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawLamps = (lv, t) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      lv.lamps.forEach((lx, li) => {
        const flick = 1 + 0.04 * Math.sin(t * 7.3 + li * 9.1) * Math.sin(t * 1.7 + li);
        // beam — widening trapezoid, warm, brighter near the lamp
        const beam = ctx.createLinearGradient(0, 44, 0, FLOOR_Y);
        beam.addColorStop(0, `rgba(255,198,120,${0.17 * flick})`);
        beam.addColorStop(0.6, `rgba(255,186,110,${0.07 * flick})`);
        beam.addColorStop(1, 'rgba(255,180,100,0.025)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(lx - 13, 44);
        ctx.lineTo(lx + 13, 44);
        ctx.lineTo(lx + 92, FLOOR_Y);
        ctx.lineTo(lx - 92, FLOOR_Y);
        ctx.closePath();
        ctx.fill();
        // pool on the floor
        ctx.save();
        ctx.translate(lx, FLOOR_Y + 2);
        ctx.scale(1, 0.17);
        const pool = ctx.createRadialGradient(0, 0, 8, 0, 0, 96);
        pool.addColorStop(0, `rgba(255,206,140,${0.30 * flick})`);
        pool.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = pool;
        ctx.beginPath();
        ctx.arc(0, 0, 96, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // floor reflection — soft vertical mirror of the beam fading down
        const refl = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 72);
        refl.addColorStop(0, `rgba(255,196,124,${0.10 * flick})`);
        refl.addColorStop(1, 'rgba(255,190,110,0)');
        ctx.fillStyle = refl;
        ctx.beginPath();
        ctx.moveTo(lx - 88, FLOOR_Y);
        ctx.lineTo(lx + 88, FLOOR_Y);
        ctx.lineTo(lx + 26, FLOOR_Y + 72);
        ctx.lineTo(lx - 26, FLOOR_Y + 72);
        ctx.closePath();
        ctx.fill();
        // dust motes drifting in the beam
        for (let i = 0; i < 9; i++) {
          const seed = li * 97 + i * 31;
          const span = FLOOR_Y - 92;
          const yy = 64 + ((t * (6 + hash01(seed) * 7) + hash01(seed + 1) * span) % span);
          const frac = (yy - 44) / (FLOOR_Y - 44);
          const halfW = 13 + frac * 76;
          const xx = lx + Math.sin(t * 0.55 + seed) * halfW * 0.8;
          const a = 0.05 + 0.18 * (0.5 + 0.5 * Math.sin(t * 2.1 + seed * 1.7));
          ctx.fillStyle = `rgba(255,224,170,${a * frac})`;
          ctx.fillRect(xx, yy, 1.6, 1.6);
        }
      });
      ctx.restore();
      // lamp fixtures drawn over the light
      lv.lamps.forEach((lx) => {
        ctx.strokeStyle = '#1a2030';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 38);
        ctx.lineTo(lx, 30);
        ctx.stroke();
        ctx.fillStyle = '#222a3d';
        ctx.beginPath();
        ctx.moveTo(lx - 14, 44);
        ctx.lineTo(lx - 7, 36);
        ctx.lineTo(lx + 7, 36);
        ctx.lineTo(lx + 14, 44);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffe2ae';
        ctx.beginPath();
        ctx.arc(lx, 44, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawCone = (g, alert) => {
      const bob = Math.sin(g.phase) * 1.2;
      const cx = g.x + P_W / 2 + g.dir * 9;
      const cy = g.y + 12 + bob;
      // Subtle sweep — the beam wanders with the guard's gait (visual only;
      // detection math stays on the fixed axis).
      const aim = (g.dir >= 0 ? 0 : Math.PI) + Math.sin(g.phase * 0.8) * 0.05 * (g.dir >= 0 ? 1 : -1);
      const core = alert ? 'rgba(255,96,104,' : 'rgba(255,228,164,';
      const wash = alert ? 'rgba(255,52,72,'  : 'rgba(255,184,96,';
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      // outer wash — full cone, soft falloff
      const g1 = ctx.createRadialGradient(cx, cy, 8, cx, cy, CONE_RANGE);
      g1.addColorStop(0, wash + (alert ? 0.40 : 0.26) + ')');
      g1.addColorStop(0.7, wash + (alert ? 0.16 : 0.09) + ')');
      g1.addColorStop(1, wash + '0)');
      ctx.fillStyle = g1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, CONE_RANGE, aim - CONE_HALF_ANGLE, aim + CONE_HALF_ANGLE);
      ctx.closePath();
      ctx.fill();
      // bright core — narrower wedge, hotter
      const g2 = ctx.createRadialGradient(cx, cy, 6, cx, cy, CONE_RANGE * 0.92);
      g2.addColorStop(0, core + (alert ? 0.5 : 0.34) + ')');
      g2.addColorStop(1, core + '0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, CONE_RANGE * 0.92, aim - CONE_HALF_ANGLE * 0.45, aim + CONE_HALF_ANGLE * 0.45);
      ctx.closePath();
      ctx.fill();
      // torch flare
      const g3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
      g3.addColorStop(0, core + '0.8)');
      g3.addColorStop(1, core + '0)');
      ctx.fillStyle = g3;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawGuard = (g, alert) => {
      const bob = Math.sin(g.phase) * 1.2;
      const x = g.x, y = g.y + bob * 0.5;
      const cxm = x + P_W / 2;
      const swing = alert ? 0 : Math.sin(g.phase) * 4;
      // legs — uniform slacks
      ctx.strokeStyle = '#1c2638';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cxm - 3, y + P_H - 11);
      ctx.lineTo(cxm - 3 + swing, FLOOR_Y);
      ctx.moveTo(cxm + 3, y + P_H - 11);
      ctx.lineTo(cxm + 3 - swing, FLOOR_Y);
      ctx.stroke();
      // torso — navy uniform with belt + badge
      ctx.fillStyle = '#2d3c5e';
      ctx.fillRect(x + 1, y + 9, P_W - 2, P_H - 19);
      ctx.fillStyle = '#161e2e';
      ctx.fillRect(x + 1, y + P_H - 13, P_W - 2, 3);
      ctx.fillStyle = '#d9b04a';
      ctx.fillRect(cxm + g.dir * 4 - 1, y + 12, 2, 2);
      // torch arm reaching forward
      ctx.strokeStyle = '#2d3c5e';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(cxm, y + 12);
      ctx.lineTo(cxm + g.dir * 9, y + 12 + bob * 0.5);
      ctx.stroke();
      ctx.fillStyle = '#11151f';
      ctx.fillRect(cxm + g.dir * 8 - 2, y + 10 + bob * 0.5, 4, 5);
      // head + cap with brim
      ctx.beginPath();
      ctx.arc(cxm, y + 5, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd1a6';
      ctx.fill();
      ctx.fillStyle = alert ? '#5e1b28' : '#1b2534';
      ctx.fillRect(x + 1, y - 2, P_W - 2, 6);
      ctx.fillRect(cxm + (g.dir >= 0 ? 0 : -P_W / 2 - 4), y + 2, P_W / 2 + 4, 2.5);
      // alert "!" — scale-pop above the head
      if (alert && g.alertPop > 0) {
        const k = Math.min(1, g.alertPop / 0.22);
        const e = 1 - Math.pow(1 - k, 3);
        const sc = e * (1 + 0.4 * Math.sin(k * Math.PI));
        ctx.save();
        ctx.translate(cxm, y - 16);
        ctx.scale(sc, sc);
        ctx.font = '800 17px JetBrains Mono, ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,60,80,0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ff4d6d';
        ctx.fillText('!', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    };

    const drawPlayer = (s) => {
      const p = s.player;
      const sneak = p.sneak;
      const crouch = sneak ? 6 : 0;
      const bob = p.moving ? Math.sin(p.stride * Math.PI * 2) * (sneak ? 0.7 : 1.3) : 0;
      const x = p.x, yTop = p.y + crouch + bob * 0.4;
      const cxm = x + P_W / 2;
      const hipY = p.y + P_H - 11 + crouch * 0.4;
      const swing = p.moving ? Math.sin(p.stride * Math.PI * 2) * (sneak ? 3 : 5) : 0;
      // legs — bent when sneaking (knee offset against the facing)
      ctx.strokeStyle = '#151b2e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      if (sneak) {
        ctx.beginPath();
        ctx.moveTo(cxm - 3, hipY);
        ctx.quadraticCurveTo(cxm - 3 - p.facing * 4, hipY + 6, cxm - 3 + swing, FLOOR_Y);
        ctx.moveTo(cxm + 3, hipY);
        ctx.quadraticCurveTo(cxm + 3 - p.facing * 4, hipY + 6, cxm + 3 - swing, FLOOR_Y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(cxm - 3, hipY);
        ctx.lineTo(cxm - 3 + swing, FLOOR_Y);
        ctx.moveTo(cxm + 3, hipY);
        ctx.lineTo(cxm + 3 - swing, FLOOR_Y);
        ctx.stroke();
      }
      // loot sack on the back — swells with the haul
      const sackR = 5.5 + Math.min(4, s.lootCount * 1.4);
      ctx.beginPath();
      ctx.ellipse(cxm - p.facing * 8, yTop + 15, sackR, sackR * 0.85, -p.facing * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = '#4a3a22';
      ctx.fill();
      ctx.strokeStyle = '#2c2213';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // torso — dark jacket, leaning forward when sneaking
      ctx.save();
      if (sneak) {
        ctx.translate(cxm, hipY);
        ctx.rotate(p.facing * 0.18);
        ctx.translate(-cxm, -hipY);
      }
      ctx.fillStyle = '#222c4a';
      ctx.fillRect(x + 1, yTop + 9, P_W - 2, P_H - 19 - crouch * 0.6);
      // head
      ctx.beginPath();
      ctx.arc(cxm, yTop + 5, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#e8c49a';
      ctx.fill();
      // beanie — covers the crown with a fold band
      ctx.fillStyle = '#39415c';
      ctx.beginPath();
      ctx.arc(cxm, yTop + 4, 6.8, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#2c3349';
      ctx.fillRect(x + 1.5, yTop + 2.5, P_W - 3, 3);
      // eye toward facing
      ctx.fillStyle = '#0a0d0e';
      ctx.fillRect(cxm + p.facing * 2.5, yTop + 5.5, 2, 2);
      ctx.restore();
      // eye-icon detection meter above the head
      drawEyeMeter(s, cxm, yTop - 16);
    };

    const drawEyeMeter = (s, ex, ey) => {
      const d = Math.min(1, s.detect);
      if (d < 0.02 && !s.alert) return;
      const w = 26, h = 13;
      const glow = d > 0.5 ? (d - 0.5) * 2 : 0;
      // eye fill from the left, color shifts cool → warm → red
      const col = d > 0.75 ? '#ff4d6d' : d > 0.4 ? '#ffb84f' : '#7fe7d8';
      ctx.save();
      if (glow > 0) {
        ctx.shadowColor = col;
        ctx.shadowBlur = 8 * glow;
      }
      // almond outline
      ctx.beginPath();
      ctx.moveTo(ex - w / 2, ey);
      ctx.quadraticCurveTo(ex, ey - h, ex + w / 2, ey);
      ctx.quadraticCurveTo(ex, ey + h, ex - w / 2, ey);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(220,232,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // fill clip
      ctx.clip();
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(ex - w / 2, ey - h, w * d, h * 2);
      ctx.globalAlpha = 1;
      // pupil
      ctx.beginPath();
      ctx.arc(ex, ey, 3.4, 0, Math.PI * 2);
      ctx.fillStyle = d > 0.4 ? '#1a0d12' : '#0d1726';
      ctx.fill();
      ctx.restore();
      // "?" — partial-detection tell, pops in when sight is regained
      if (s.sighted && d < 1 && !s.alert) {
        const k = Math.min(1, s.sightPop / 0.25);
        const e = 1 - Math.pow(1 - k, 3);
        const sc = e * (1 + 0.35 * Math.sin(k * Math.PI));
        ctx.save();
        ctx.translate(ex, ey - 16);
        ctx.scale(sc, sc);
        ctx.font = '800 13px JetBrains Mono, ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffd86e';
        ctx.shadowColor = 'rgba(255,200,90,0.7)';
        ctx.shadowBlur = 6;
        ctx.fillText('?', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    };

    const drawLoot = (s, t) => {
      s.loot.forEach((o, i) => {
        if (o.kind === 'painting') {
          const f = { x: o.x - 23, y: o.y, w: 46, h: 36 };
          drawFrame(f, o.taken);
          if (!o.taken) drawTwinkle(o.x + 14, o.y + 8, t + i * 1.7);
          return;
        }
        // gem on a plinth
        const px = o.x, base = FLOOR_Y;
        ctx.fillStyle = '#2c3650';
        ctx.fillRect(px - 9, base - 24, 18, 24);
        ctx.fillStyle = '#3a4666';
        ctx.fillRect(px - 11, base - 26, 22, 4);
        if (o.taken) return;
        const hover = Math.sin(t * 2.2 + i * 2.1) * 2;
        const gy = base - 36 + hover;
        // diamond with a lighter top facet
        ctx.beginPath();
        ctx.moveTo(px, gy - 8);
        ctx.lineTo(px + 7, gy);
        ctx.lineTo(px, gy + 9);
        ctx.lineTo(px - 7, gy);
        ctx.closePath();
        ctx.fillStyle = '#37e0c0';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(px, gy - 8);
        ctx.lineTo(px + 7, gy);
        ctx.lineTo(px - 7, gy);
        ctx.closePath();
        ctx.fillStyle = '#8ff5e2';
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,60,55,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, gy - 8);
        ctx.lineTo(px + 7, gy);
        ctx.lineTo(px, gy + 9);
        ctx.lineTo(px - 7, gy);
        ctx.closePath();
        ctx.stroke();
        drawTwinkle(px + 4, gy - 5, t + i * 2.3);
      });
    };

    const drawTwinkle = (x, y, t) => {
      // 4-point star flare that breathes; quiet most of the cycle.
      const c = Math.max(0, Math.sin(t * 1.8));
      const a = Math.pow(c, 6);
      if (a < 0.03) return;
      const r = 5 * a;
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = '#fff6da';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - r, y); ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r); ctx.lineTo(x, y + r);
      ctx.stroke();
      ctx.restore();
    };

    const drawFx = (s) => {
      s.parts.forEach((q) => {
        const a = Math.max(0, 1 - q.t / 0.6);
        ctx.globalAlpha = a;
        ctx.fillStyle = q.hue;
        ctx.fillRect(q.x - 1.2, q.y - 1.2, 2.4, 2.4);
      });
      ctx.globalAlpha = 1;
      s.floats.forEach((f) => {
        const a = Math.max(0, 1 - f.t / 1.1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.font = '700 13px JetBrains Mono, ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd86e';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 4;
        ctx.fillText(f.txt, f.x, f.y - f.t * 26);
        ctx.restore();
      });
    };

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { lv, player, guards, exitFlash, caughtFlash } = s;
      const { cssW, cssH } = viewRef.current;
      const t = performance.now() / 1000;

      // Outer backdrop — same color as the scene's bottom band so the
      // padding around the playfield blends rather than framing it.
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, cssW, cssH);

      // Centered + uniform-scaled scene.
      const { scale, offX, offY } = viewRef.current;
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      drawBackdrop(t);
      drawDecor(lv);
      drawLamps(lv, t);

      // Cool ambience — corners fall off into safe blue shadow.
      const vig = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, W * 0.62);
      vig.addColorStop(0, 'rgba(8,12,22,0)');
      vig.addColorStop(1, 'rgba(6,10,22,0.5)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      // Exit door — the one cool-glow object; cool = safe.
      const doorX = lv.exit;
      const doorGlow = 0.55 + 0.25 * Math.sin(t * 3.6);
      ctx.fillStyle = `rgba(0, 255, 245, ${doorGlow})`;
      ctx.fillRect(doorX - 4, FLOOR_Y - 72, 8, 72);
      ctx.fillStyle = '#0a3a36';
      ctx.fillRect(doorX, FLOOR_Y - 64, 32, 64);
      ctx.strokeStyle = '#00fff5';
      ctx.lineWidth = 2;
      ctx.strokeRect(doorX, FLOOR_Y - 64, 32, 64);
      // door light reflected on the floor
      const dref = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y + 46);
      dref.addColorStop(0, `rgba(0,255,245,${0.10 * doorGlow})`);
      dref.addColorStop(1, 'rgba(0,255,245,0)');
      ctx.fillStyle = dref;
      ctx.fillRect(doorX - 14, FLOOR_Y, 56, 46);

      // Vision cones (drawn BEHIND props/guards)
      guards.forEach((g) => drawCone(g, !!s.alert));

      // Props (crates)
      lv.props.forEach((p) => {
        ctx.fillStyle = '#2a2014';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#5a4224';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#3a2c18';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + p.h / 2);
        ctx.lineTo(p.x + p.w, p.y + p.h / 2);
        ctx.stroke();
      });

      drawLoot(s, t);
      guards.forEach((g) => drawGuard(g, !!s.alert));
      drawPlayer(s);
      drawFx(s);

      ctx.restore();

      // Heartbeat vignette — red pressure at the screen edge, synced to
      // the heartbeat sfx, scaling with how seen you are.
      const hb = s.heartPulse * Math.min(1, s.detect + (s.alert ? 1 : 0));
      if (hb > 0.02) {
        const a = Math.min(0.4, hb * 0.42);
        const rg = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.32, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.62);
        rg.addColorStop(0, 'rgba(255,30,50,0)');
        rg.addColorStop(1, `rgba(255,24,48,${a})`);
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, cssW, cssH);
      }

      // Caught flash overlay (covers the full canvas, not just the scene)
      if (caughtFlash > 0) {
        ctx.fillStyle = `rgba(255, 77, 109, ${Math.min(0.6, caughtFlash)})`;
        ctx.fillRect(0, 0, cssW, cssH);
      }
      if (exitFlash > 0) {
        ctx.fillStyle = `rgba(0, 255, 245, ${Math.min(0.3, exitFlash)})`;
        ctx.fillRect(0, 0, cssW, cssH);
      }
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s || status !== 'playing') return;

      const p = s.player;
      const left  = keys['a'] || keys['arrowleft']  || keys['keya'] || touchKeys.left;
      const right = keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.right;
      const sneak = keys['shift'] || keys['shiftleft'] || keys['shiftright'] || keys[' '] || keys['space'] || touchKeys.tiptoe;

      p.sneak = !!sneak;
      s.lootCount = s.loot.filter((o) => o.taken).length;

      // ── alert phase: the moment of being caught is a beat, not a cut.
      // Player freezes, guards stop, the spotter turns, "!" pops, then
      // the red flash and the night restarts.
      if (s.alert) {
        s.alert.t += dt;
        s.guards.forEach((g) => { g.alertPop += dt; });
        if (s.alert.t >= ALERT_HOLD && !s.alert.flashed) {
          s.alert.flashed = true;
          s.caughtFlash = 1.0;
          sfx.lose();
        }
        if (s.alert.t >= ALERT_HOLD + 0.3) {
          caughtReset();
          return;
        }
      } else {
        const speed = sneak ? TIPTOE_SPEED : WALK_SPEED;
        let dx = 0;
        if (left) dx -= 1;
        if (right) dx += 1;
        p.x += dx * speed * dt;
        if (dx !== 0) p.facing = dx;
        p.moving = dx !== 0;

        // Footstep cadence — stride drives both the leg swing and the sfx.
        if (p.moving) {
          const prev = p.stride;
          p.stride += speed * dt * (sneak ? 0.011 : 0.009);
          if (Math.floor(p.stride * 2) !== Math.floor(prev * 2)) {
            sfx.nightStep(sneak);
          }
        }

        // Clamp to world
        p.x = Math.max(8, Math.min(W - P_W - 8, p.x));

        // Guards patrol
        s.guards.forEach((g) => {
          g.x += g.dir * g.speed * dt;
          g.phase += g.speed * dt * 0.09;
          if (g.x < g.minX) { g.x = g.minX; g.dir = 1; }
          if (g.x > g.maxX) { g.x = g.maxX; g.dir = -1; }
        });
      }

      // Detection
      const px = p.x + P_W / 2;
      const py = p.y + P_H / 2;
      let spotter = -1;
      s.guards.forEach((g, i) => {
        if (spotter < 0 && coneContainsPlayer(g, px, py)) spotter = i;
      });
      const anySight = spotter >= 0;
      if (!s.alert) {
        if (anySight) {
          if (!s.sighted) s.sightPop = 0;       // restart the "?" pop
          s.sighted = true;
          s.sightPop += dt;
          s.detect += (sneak ? DETECT_RATE_TIPTOE : DETECT_RATE_WALK) * dt;
        } else {
          s.sighted = false;
          s.detect = Math.max(0, s.detect - DETECT_DECAY * dt);
        }

        if (s.detect >= 1) {
          s.detect = 1;
          s.alert = { t: 0, flashed: false };
          s.guards.forEach((g) => {
            g.dir = px > g.x + P_W / 2 ? 1 : -1;  // everyone snaps toward you
            g.alertPop = 0;
          });
          sfx.nightAlert();
        }
      }

      // Heartbeat — rate climbs with detection; each beat fires the sfx
      // and kicks the vignette pulse.
      const tension = s.alert ? 1 : Math.min(1, s.detect);
      if (tension > 0.12) {
        s.heartT -= dt;
        if (s.heartT <= 0) {
          s.heartT = 1.0 - tension * 0.62;
          s.heartPulse = 1;
          sfx.nightHeart(tension);
        }
      } else {
        s.heartT = 0;
      }
      s.heartPulse = Math.max(0, s.heartPulse - dt * 4.5);

      // Loot pickup — walk past a piece to lift it.
      if (!s.alert) {
        s.loot.forEach((o) => {
          if (o.taken || Math.abs(px - o.x) > 16) return;
          o.taken = true;
          s.lootVal += o.value;
          setLootHud(lootBankRef.current + s.lootVal);
          const fy = o.kind === 'painting' ? o.y + 16 : FLOOR_Y - 40;
          s.floats.push({ x: o.x, y: fy, txt: `+$${o.value}`, t: 0 });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            const v = 40 + hash01(i + o.x) * 60;
            s.parts.push({
              x: o.x, y: fy,
              vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
              t: 0,
              hue: o.kind === 'gem' ? '#8ff5e2' : '#ffd86e',
            });
          }
          sfx.nightCollect();
        });
      }

      // FX decay
      s.floats.forEach((f) => { f.t += dt; });
      s.floats = s.floats.filter((f) => f.t < 1.1);
      s.parts.forEach((q) => {
        q.t += dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.vy += 130 * dt;
      });
      s.parts = s.parts.filter((q) => q.t < 0.6);

      // Exit
      if (!s.alert && p.x + P_W >= s.lv.exit) {
        s.exitFlash = 0.4;
        lootBankRef.current += s.lootVal;
        lootLogRef.current.push(`${s.loot.filter((o) => o.taken).length}/${s.loot.length}`);
        setLootHud(lootBankRef.current);
        if (level + 1 >= LEVELS.length) {
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1800 - caught * 120 - s.elapsed * 2 + lootBankRef.current));
            submitScore('bob', score, { caught, time: Math.round(s.elapsed), level: level + 1, loot: lootBankRef.current });
          }
          sfx.nightClear();
          setTimeout(() => sfx.win(), 260);
          setStatus('won');
        } else {
          sfx.nightClear();
          setLevel((l) => l + 1);
          return;
        }
      }

      if (s.caughtFlash > 0) s.caughtFlash -= dt * 1.8;
      if (s.exitFlash > 0) s.exitFlash -= dt * 1.6;
      s.elapsed += dt;
      if ((s.elapsed * 2 | 0) !== (s._hud | 0)) {
        s._hud = s.elapsed * 2;
        setTime(Math.round(s.elapsed));
      }

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, status]);

  const restart = () => {
    submittedRef.current = false;
    lootBankRef.current = 0;
    lootLogRef.current = [];
    setCaught(0);
    setTime(0);
    setLootHud(0);
    setLevel(0);
    setStatus('playing');
  };

  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const setTouch = (id, v) => {
    const w = wrapRef.current;
    if (w && w._setTouch) w._setTouch(id, v);
  };

  return (
    <div className="nightshift" style={{ width: '100%', height: '100%' }}>
      <div className="nightshift-bar">
        <span>Night <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, level + 1)}</b>/{LEVELS.length}</span>
        <span>{LEVELS[level]?.name}</span>
        <span>Caught <b>{caught}</b></span>
        <span>Time <b>{time}s</b></span>
        <span>Loot <b style={{color:'#ffd86e'}}>${lootHud}</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="nightshift-canvas"/>
        {isTouch && (
          <>
            <div style={{ position: 'absolute', bottom: 18, left: 18, display: 'flex', gap: 10, zIndex: 5 }}>
              <PillBtn label="←" onDown={() => setTouch('left', true)}  onUp={() => setTouch('left', false)} />
              <PillBtn label="→" onDown={() => setTouch('right', true)} onUp={() => setTouch('right', false)} />
            </div>
            <div style={{ position: 'absolute', bottom: 18, right: 18, zIndex: 5 }}>
              <PillBtn label="TIPTOE" wide onDown={() => setTouch('tiptoe', true)} onUp={() => setTouch('tiptoe', false)} />
            </div>
          </>
        )}
      </div>
      {status === 'won' ? (
        <div className="nightshift-tip" style={{color:'var(--accent)', fontWeight:700}}>
          Clean out · {caught} caught · {time}s · <span style={{color:'#ffd86e'}}>${lootHud} lifted</span>
          {lootLogRef.current.length > 0 && (
            <span style={{color:'var(--text-mute)', fontWeight:400}}>
              {' '}— {lootLogRef.current.map((l, i) => `N${i + 1} ${l}`).join(' · ')}
            </span>
          )}
        </div>
      ) : (
        <div className="nightshift-tip">Walk is loud. Tiptoe is slow. Shadow is safe — light is not. Lift the loot if you dare.</div>
      )}
      <div className="nightshift-hint">A/D move · Shift or Space to tiptoe · R restart night · slip past cones, reach the door</div>
    </div>
  );
}

// Inline-styled touch pill — matches the shared shape used across the
// other touch-enabled games. `wide` widens the body for word labels.
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
