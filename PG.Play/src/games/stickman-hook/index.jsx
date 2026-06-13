import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sfx } from '../../sound.js';

// Stickman Hook — one-button rope swinger on Verlet physics.
//
// Juice pass goals (kept inside this single file, same component API):
//   · dusk-gradient sky + two parallax silhouette layers (hills, skyline)
//   · articulated stickman: arms reach for the anchor, legs trail the
//     swing, tuck at high speed, flail when falling
//   · rope with sag (quadratic through a control point), elastic give on
//     attach, snap-back flick on release, in-range anchor glow
//   · camera lead + speed zoom-out, motion trail, speed lines, landing dust
//   · six levels, per-level timer, perfect-release bonus text
//   · bottomless pit death: quick fade, respawn at the start pad, falls HUD

const W = 700;
const H = 440;
const GRAVITY = 0.38;
const GRAB_RANGE = 240;
const GRAB_RANGE_GROUND = 310;   // forgiving first grab from a pad — no dead spots
const PLAT_TOP = 356;            // platform surface (world y)
const STAND_Y = PLAT_TOP - 26;   // pelvis height when standing
const PERFECT_SPEED = 10.5;      // px/frame at release for a "perfect"
const ROPE_REEL = 0.3;           // gentle reel-in per frame while attached

const LEVELS = [
  {
    length: 1800,
    start: [80, STAND_Y],
    anchors: [[220, 140], [440, 200], [680, 120], [920, 220], [1160, 140], [1400, 220], [1620, 160]],
    goal: 1760,
  },
  {
    length: 2400,
    start: [80, STAND_Y],
    anchors: [[220, 180], [430, 120], [620, 220], [840, 140], [1080, 200], [1300, 120], [1520, 220], [1720, 160], [1940, 240], [2180, 160]],
    goal: 2340,
  },
  {
    length: 2800,
    start: [80, STAND_Y],
    anchors: [[240, 180], [420, 260], [620, 160], [820, 240], [1020, 140], [1240, 220], [1480, 120], [1720, 220], [1960, 140], [2180, 240], [2420, 160], [2640, 200]],
    goal: 2760,
  },
  // 4 — wider gaps, taller drops
  {
    length: 3200,
    start: [80, STAND_Y],
    anchors: [[240, 160], [500, 230], [760, 120], [1020, 240], [1290, 130], [1560, 240], [1830, 120], [2090, 220], [2350, 130], [2610, 230], [2870, 140], [3080, 200]],
    goal: 3140,
  },
  // 5 — high-low ladder, every other swing is a climb
  {
    length: 3600,
    start: [80, STAND_Y],
    anchors: [[230, 160], [510, 250], [790, 110], [1070, 250], [1350, 120], [1630, 255], [1910, 110], [2190, 250], [2470, 120], [2750, 255], [3030, 130], [3310, 210], [3500, 160]],
    goal: 3540,
  },
  // 6 — long-jump finale, full-range grabs only
  {
    length: 4200,
    start: [80, STAND_Y],
    anchors: [[235, 160], [540, 235], [850, 110], [1160, 250], [1470, 120], [1780, 255], [2090, 110], [2400, 250], [2710, 120], [3020, 255], [3330, 120], [3640, 240], [3940, 150]],
    goal: 4140,
  },
];

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
// Deterministic 0..1 per integer index — keeps parallax props stable as
// the camera scrolls (no per-frame Math.random shimmer).
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export default function StickmanHookGame() {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const deathsRef = useRef(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [status, setStatus] = useState('playing'); // 'playing' | 'won'
  const [finalTime, setFinalTime] = useState(null);

  const resetLevel = (idx) => {
    const L = LEVELS[idx];
    if (!L) return;
    stateRef.current = {
      L,
      x: L.start[0], y: L.start[1],
      px: L.start[0], py: L.start[1], // previous (for verlet)
      attached: null,                  // anchor index
      ropeLen: 0,
      grabHeld: false,
      camX: 0,
      zoom: 1,
      t0: performance.now(),
      elapsed: 0,
      onGround: true,
      attachT: 0,                      // elastic give right after attach
      flick: null,                     // rope snap-back after release
      trail: [],
      dust: [],
      lines: [],                       // screen-space speed lines
      floats: [],                      // rising bonus texts
      perfects: 0,
      dead: false,
      deathT: 0,
      fadeIn: 0,
      tick: 0,
      plats: [
        { x: L.start[0] - 70, w: 150, y: PLAT_TOP },
        { x: L.goal - 90, w: 190, y: PLAT_TOP },
      ],
    };
    setStatus('playing');
    setFinalTime(null);
  };

  useEffect(() => { resetLevel(levelIdx); }, [levelIdx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // ── pose helpers ──────────────────────────────────────────────────
    const limb = (ax, ay, bx, by, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    };

    const drawStickman = (s, cam) => {
      const x = s.x - cam, y = s.y;
      const vx = s.x - s.px, vy = s.y - s.py;
      const speed = Math.hypot(vx, vy);
      const t = s.tick;

      ctx.strokeStyle = '#16181d';
      ctx.fillStyle = '#16181d';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Body direction — lean into velocity airborne, toward rope attached.
      let bdx = 0, bdy = -1;
      if (s.attached !== null) {
        const [ax2, ay2] = s.L.anchors[s.attached];
        const dx = ax2 - s.x, dy = ay2 - s.y;
        const d = Math.hypot(dx, dy) || 1;
        bdx = (dx / d) * 0.65; bdy = -1 + (dy / d) * 0.65 * 0.6;
        const bl = Math.hypot(bdx, bdy) || 1;
        bdx /= bl; bdy /= bl;
      } else if (!s.onGround) {
        const lean = clamp(vx * 0.055, -1.0, 1.0);
        bdx = Math.sin(lean); bdy = -Math.cos(lean);
      }
      const perpX = -bdy, perpY = bdx;

      const shX = x + bdx * 13, shY = y + bdy * 13;      // shoulder
      const headX = x + bdx * 23, headY = y + bdy * 23;  // head center

      // torso
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(shX, shY);
      ctx.stroke();
      // head
      ctx.beginPath();
      ctx.arc(headX, headY, 8.2, 0, Math.PI * 2);
      ctx.fill();
      // eye — gives the swing a facing
      const face = vx >= 0 ? 1 : -1;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(headX + face * 3.4, headY - 1.4, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16181d';

      // ── arms ─────────────────────────────────────────────────────
      if (s.attached !== null) {
        // Reach toward the anchor, elbows slightly split.
        const [ax2, ay2] = s.L.anchors[s.attached];
        const dx = ax2 - s.x, dy = ay2 - s.y;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d, uy = dy / d;
        for (const side of [-1, 1]) {
          const sx0 = shX + perpX * side * 3.5, sy0 = shY + perpY * side * 3.5;
          const hx = shX + ux * 19 + perpX * side * 2.5;
          const hy = shY + uy * 19 + perpY * side * 2.5;
          const ex = (sx0 + hx) / 2 + perpX * side * 3.5;
          const ey = (sy0 + hy) / 2 + perpY * side * 3.5;
          limb(sx0, sy0, ex, ey, hx, hy);
        }
      } else if (!s.onGround && speed > 10) {
        // Tuck — arms hug forward toward the knees.
        const fwd = vx >= 0 ? 1 : -1;
        for (const side of [-1, 1]) {
          limb(shX, shY,
            shX + fwd * 7, shY + 7 + side * 1.5,
            x + fwd * 9, y + 9 + side * 2);
        }
      } else if (!s.onGround && vy > 2.5) {
        // Flail — arms thrown up, wobbling.
        for (const side of [-1, 1]) {
          const wob = Math.sin(t * 0.45 + side * 2.1) * 4;
          limb(shX, shY,
            shX + side * 10, shY - 7 + wob * 0.4,
            shX + side * 15 + wob, shY - 16);
        }
      } else {
        // Idle / glide — relaxed arms at the sides.
        const sway = Math.sin(t * 0.08) * 1.5;
        for (const side of [-1, 1]) {
          limb(shX, shY,
            shX + side * 7, shY + 7,
            shX + side * (9 + sway), shY + 15);
        }
      }

      // ── legs ─────────────────────────────────────────────────────
      if (s.onGround && s.attached === null) {
        const bob = Math.sin(t * 0.08) * 0.8;
        for (const side of [-1, 1]) {
          limb(x, y, x + side * 4, y + 13, x + side * (6 + bob), y + 26);
        }
      } else if (!s.onGround && speed > 10 && s.attached === null) {
        // Tuck — knees pulled up in front.
        const fwd = vx >= 0 ? 1 : -1;
        for (const side of [-1, 1]) {
          limb(x, y,
            x + fwd * 10, y + 5 + side * 2,
            x + fwd * 4, y + 13 + side * 2.5);
        }
      } else {
        // Trail opposite the velocity, with a small swing-phase scissor.
        const sp = Math.max(speed, 0.001);
        let tx = -vx / sp, ty = -vy / sp;
        // blend with straight-down so slow swings still read as hanging
        const blend = clamp(speed / 8, 0, 0.8);
        tx = tx * blend; ty = ty * blend + (1 - blend);
        const tl = Math.hypot(tx, ty) || 1;
        tx /= tl; ty /= tl;
        const tpx = -ty, tpy = tx;
        const phase = Math.sin(t * 0.3) * (s.attached !== null ? 4 : 2);
        for (const side of [-1, 1]) {
          const footX = x + tx * 22 + tpx * (side * 5 + phase * side);
          const footY = y + ty * 22 + tpy * (side * 5 + phase * side);
          const kneeX = x + tx * 11 + tpx * side * 7 - tx * 2;
          const kneeY = y + ty * 11 + tpy * side * 7 - ty * 2;
          limb(x, y, kneeX, kneeY, footX, footY);
        }
      }

      // round joints at shoulder/pelvis to sell the articulation
      ctx.beginPath(); ctx.arc(shX, shY, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
    };

    // ── background ───────────────────────────────────────────────────
    const drawBackground = (cam) => {
      // Dusk gradient — margins cover the zoom-out reveal.
      const g = ctx.createLinearGradient(0, -80, 0, H + 80);
      g.addColorStop(0, '#41197f');
      g.addColorStop(0.55, '#9b4ff0');
      g.addColorStop(1, '#ff8ec6');
      ctx.fillStyle = g;
      ctx.fillRect(-90, -90, W + 180, H + 180);

      // Sun low on the horizon (parallax 0.03)
      const sunX = W * 0.74 - cam * 0.03;
      ctx.fillStyle = 'rgba(255, 222, 150, 0.85)';
      ctx.beginPath(); ctx.arc(sunX, 270, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 222, 150, 0.18)';
      ctx.beginPath(); ctx.arc(sunX, 270, 60, 0, Math.PI * 2); ctx.fill();

      // Distant hills (parallax 0.12)
      ctx.fillStyle = 'rgba(74, 28, 134, 0.55)';
      {
        const p = cam * 0.12, tile = 170;
        const i0 = Math.floor((p - 100) / tile);
        for (let i = i0; i < i0 + Math.ceil(W / tile) + 3; i++) {
          const hx = i * tile - p;
          const hh = 40 + hash(i) * 70;
          ctx.beginPath();
          ctx.ellipse(hx, 332, 130, hh, 0, Math.PI, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillRect(-90, 330, W + 180, H - 240);

      // Mid skyline (parallax 0.3) — flat building silhouettes + lit windows
      {
        const p = cam * 0.3, tile = 110;
        const i0 = Math.floor((p - 100) / tile);
        for (let i = i0; i < i0 + Math.ceil(W / tile) + 3; i++) {
          const bx = i * tile - p;
          const bw = 64 + hash(i * 3 + 1) * 34;
          const bh = 70 + hash(i * 7 + 2) * 110;
          ctx.fillStyle = 'rgba(38, 14, 74, 0.78)';
          ctx.fillRect(bx, 360 - bh, bw, bh + H);
          // sparse warm windows
          ctx.fillStyle = 'rgba(255, 210, 130, 0.32)';
          const rows = Math.floor(bh / 26);
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < 3; c++) {
              if (hash(i * 31 + r * 7 + c) < 0.4) {
                ctx.fillRect(bx + 9 + c * 18, 368 - bh + r * 24, 5, 7);
              }
            }
          }
        }
      }

      // Clouds (parallax 0.45)
      ctx.fillStyle = 'rgba(255, 235, 248, 0.5)';
      {
        const p = cam * 0.45, tile = 380;
        const i0 = Math.floor((p - 120) / tile);
        for (let i = i0; i < i0 + Math.ceil(W / tile) + 2; i++) {
          const cx2 = i * tile - p + hash(i * 13) * 120;
          const cy2 = 50 + hash(i * 17) * 90;
          const cr = 26 + hash(i * 23) * 22;
          ctx.beginPath();
          ctx.ellipse(cx2, cy2, cr, cr * 0.34, 0, 0, Math.PI * 2);
          ctx.ellipse(cx2 + cr * 0.7, cy2 + 4, cr * 0.6, cr * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawRope = (s, cam) => {
      const [ax, ay] = s.L.anchors[s.attached];
      const x0 = ax - cam, y0 = ay;
      const x1 = s.x - cam, y1 = s.y;
      const d = Math.hypot(s.x - ax, s.y - ay) || 1;
      // Sag: slack rope bows down; taut rope straightens. The attach
      // wobble gives the "elastic stretch" read for the first beats.
      const slack = Math.max(0, s.ropeLen - d);
      let sag = 3 + slack * 0.55 + (1 - clamp(d / (s.ropeLen || 1), 0, 1)) * 8;
      if (s.attachT > 0) sag += Math.sin(s.attachT * 26) * 7 * s.attachT;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
      ctx.strokeStyle = '#ffe14f';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
      ctx.stroke();
      // bright filament core
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(mx, my, x1, y1);
      ctx.stroke();
    };

    const drawFlick = (s, cam) => {
      const f = s.flick;
      const t = f.t;
      const ex = f.ax + (f.px - f.ax) * t * 0.85 - cam;
      const ey = f.ay + (f.py - f.ay) * t * 0.85;
      const mx = (f.ax - cam + ex) / 2 + Math.sin((1 - t) * 14) * 16 * t;
      const my = (f.ay + ey) / 2 + Math.cos((1 - t) * 11) * 10 * t;
      ctx.strokeStyle = `rgba(255, 225, 79, ${(t * 0.9).toFixed(3)})`;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(f.ax - cam, f.ay);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    };

    const draw = () => {
      const s = stateRef.current;
      if (!s) return;
      const L = s.L;
      const cam = s.camX;

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      // speed zoom-out around screen center
      ctx.translate(W / 2, H / 2);
      ctx.scale(s.zoom, s.zoom);
      ctx.translate(-W / 2, -H / 2);

      drawBackground(cam);

      // ── world layer ───────────────────────────────────────────────
      // platforms
      for (const p of s.plats) {
        const px2 = p.x - cam;
        if (px2 > W + 100 || px2 + p.w < -100) continue;
        ctx.fillStyle = '#241140';
        ctx.fillRect(px2, p.y, p.w, 70);
        ctx.fillStyle = 'rgba(255, 209, 236, 0.85)';
        ctx.fillRect(px2, p.y, p.w, 4);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(px2 + 6, p.y + 12, p.w - 12, 3);
      }

      // goal flag on the far platform
      const gx = L.goal - cam;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(gx, PLAT_TOP); ctx.lineTo(gx, PLAT_TOP - 80);
      ctx.stroke();
      const wave = Math.sin(s.tick * 0.1) * 3;
      ctx.fillStyle = '#35f0c9';
      ctx.beginPath();
      ctx.moveTo(gx, PLAT_TOP - 80);
      ctx.quadraticCurveTo(gx + 16, PLAT_TOP - 76 + wave, gx + 30, PLAT_TOP - 70 + wave);
      ctx.quadraticCurveTo(gx + 14, PLAT_TOP - 66, gx, PLAT_TOP - 60);
      ctx.closePath();
      ctx.fill();

      // nearest grabbable anchor (affordance for WHEN to press)
      let nearest = -1;
      if (s.attached === null && !s.dead) {
        let bd = s.onGround ? GRAB_RANGE_GROUND : GRAB_RANGE;
        L.anchors.forEach(([ax, ay], i) => {
          const d = Math.hypot(ax - s.x, ay - s.y);
          if (d < bd) { bd = d; nearest = i; }
        });
      }

      // anchors
      L.anchors.forEach(([ax, ay], i) => {
        const x = ax - cam;
        if (x < -40 || x > W + 40) return;
        const inRange = Math.hypot(ax - s.x, ay - s.y) < GRAB_RANGE;
        const isNear = i === nearest;
        const isHooked = s.attached === i;
        // glow halo — bright pulse on the nearest grabbable anchor
        if (isHooked || isNear) {
          const pulse = 16 + Math.sin(s.tick * 0.18) * 3.5;
          const halo = ctx.createRadialGradient(x, ay, 4, x, ay, pulse + 10);
          halo.addColorStop(0, isHooked ? 'rgba(255, 225, 79, 0.55)' : 'rgba(255, 255, 255, 0.5)');
          halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath(); ctx.arc(x, ay, pulse + 10, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = isHooked ? 'rgba(255, 225, 79, 0.9)' : 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, ay, pulse, 0, Math.PI * 2); ctx.stroke();
        } else if (inRange) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.beginPath(); ctx.arc(x, ay, 15, 0, Math.PI * 2); ctx.fill();
        }
        // stud
        ctx.beginPath();
        ctx.arc(x, ay, 9.5, 0, Math.PI * 2);
        ctx.fillStyle = inRange || isHooked ? '#fff' : 'rgba(255, 255, 255, 0.55)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, ay, 4.6, 0, Math.PI * 2);
        ctx.fillStyle = isHooked ? '#ffe14f' : inRange ? '#9b4ff0' : 'rgba(80, 40, 140, 0.8)';
        ctx.fill();
      });

      // motion trail
      for (let i = 0; i < s.trail.length; i++) {
        const tp = s.trail[i];
        const a = (i / s.trail.length) * 0.30;
        ctx.fillStyle = `rgba(22, 24, 29, ${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(tp.x - cam, tp.y, 2 + (i / s.trail.length) * 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // rope + snap-back flick
      if (s.attached !== null) drawRope(s, cam);
      if (s.flick) drawFlick(s, cam);

      // dust particles
      for (const d of s.dust) {
        ctx.fillStyle = `rgba(255, 230, 245, ${(d.life * 0.7).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(d.x - cam, d.y, d.size * (0.5 + d.life * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }

      // stickman
      if (!s.dead || s.deathT < 0.5) drawStickman(s, cam);

      // floating bonus texts
      for (const f of s.floats) {
        ctx.font = '800 16px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 225, 79, ${f.t.toFixed(3)})`;
        ctx.strokeStyle = `rgba(30, 10, 50, ${(f.t * 0.7).toFixed(3)})`;
        ctx.lineWidth = 3;
        ctx.strokeText(f.txt, f.x - cam, f.y);
        ctx.fillText(f.txt, f.x - cam, f.y);
      }
      ctx.textAlign = 'left';

      ctx.restore(); // end zoom

      // ── screen-space layer ────────────────────────────────────────
      // speed lines
      for (const ln of s.lines) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(ln.life * 0.38).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ln.x, ln.y);
        ctx.lineTo(ln.x - ln.ux * ln.len, ln.y - ln.uy * ln.len);
        ctx.stroke();
      }

      // HUD — timer + falls
      ctx.font = '600 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(`TIME ${s.elapsed.toFixed(1)}s`, W - 14, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText(`FALLS ${deathsRef.current}`, W - 14, 40);
      ctx.textAlign = 'left';

      // death fade-out / respawn fade-in
      if (s.dead) {
        ctx.fillStyle = `rgba(20, 8, 38, ${clamp(s.deathT * 2.4, 0, 1).toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      } else if (s.fadeIn > 0) {
        ctx.fillStyle = `rgba(20, 8, 38, ${s.fadeIn.toFixed(3)})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const tryAttach = (s) => {
      if (!s.grabHeld || s.attached !== null || s.dead) return;
      let best = -1, bestD = s.onGround ? GRAB_RANGE_GROUND : GRAB_RANGE;
      s.L.anchors.forEach(([ax, ay], i) => {
        const d = Math.hypot(ax - s.x, ay - s.y);
        if (d < bestD) { best = i; bestD = d; }
      });
      if (best >= 0) {
        s.attached = best;
        s.ropeLen = bestD;
        // Reel floor: pull in for energy, but never winch the player into
        // a dead dangle right under the anchor.
        s.ropeMin = Math.max(80, bestD * 0.55);
        s.attachT = 1;
        s.flick = null;
        sfx.open();
      }
    };

    const spawnDust = (s, x, y, n, spread) => {
      for (let i = 0; i < n; i++) {
        s.dust.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + Math.random() * 3,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -Math.random() * 1.6 - 0.3,
          size: 2 + Math.random() * 3,
          life: 1,
        });
      }
    };

    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }
      s.tick++;

      if (status === 'playing' && !s.dead) {
        tryAttach(s);

        // Verlet integration
        let vx = s.x - s.px;
        let vy = s.y - s.py;
        vx *= 0.999;
        vy *= 0.999;

        s.px = s.x; s.py = s.y;
        s.x += vx;
        s.y += vy + GRAVITY;

        // Rope constraint — soft right after attach (elastic give), then
        // stiff. A slow reel-in plus a tangential pump keep the swing fed
        // with energy: holding builds momentum instead of decaying into a
        // dead dangle (the verlet slack-catch cycle is dissipative).
        if (s.attached !== null) {
          const [ax, ay] = s.L.anchors[s.attached];
          s.ropeLen = Math.max(s.ropeMin || 80, s.ropeLen - ROPE_REEL);
          const sp = Math.hypot(vx, vy);
          if (sp > 0.5 && sp < 14) {
            s.px -= (vx / sp) * 0.06;
            s.py -= (vy / sp) * 0.06;
          }
          const dx = s.x - ax, dy = s.y - ay;
          const d = Math.hypot(dx, dy);
          if (d > s.ropeLen) {
            const stiff = s.attachT > 0 ? 0.55 : 1;
            const corr = ((d - s.ropeLen) / d) * stiff;
            s.x -= dx * corr;
            s.y -= dy * corr;
          }
        }
        if (s.attachT > 0) s.attachT = Math.max(0, s.attachT - 0.07);

        // Platforms — land on top surfaces only
        const feetPrev = s.py + 26;
        const feet = s.y + 26;
        let grounded = false;
        if (s.attached === null && feet >= feetPrev) {
          for (const p of s.plats) {
            if (s.x >= p.x && s.x <= p.x + p.w && feetPrev <= p.y + 6 && feet >= p.y) {
              const impact = s.y - s.py;
              s.y = p.y - 26;
              s.py = s.y;
              s.px = s.x - (s.x - s.px) * 0.86; // ground friction
              if (!s.onGround && impact > 1.4) {
                spawnDust(s, s.x, p.y, Math.min(14, 4 + impact * 2), 18);
                sfx.stomp();
              }
              grounded = true;
              break;
            }
          }
        }
        s.onGround = grounded;

        // timer
        s.elapsed = (performance.now() - s.t0) / 1000;

        // Win
        if (s.x >= s.L.goal) {
          const time = s.elapsed;
          setStatus('won');
          setFinalTime(time);
          sfx.win();
          submitScore('stickman-hook', (levelIdx + 1) * 100 + s.perfects * 10, {
            level: levelIdx + 1,
            time: Math.round(time * 10) / 10,
            perfects: s.perfects,
          });
        }

        // Death — off the bottom or behind the left edge
        if (s.y > H + 70 || s.x < -40) {
          s.dead = true;
          s.deathT = 0;
          s.attached = null;
          deathsRef.current += 1;
          sfx.lose();
        }
      } else if (s.dead) {
        // quick fade, respawn at the start pad
        s.deathT += 1 / 30;
        if (s.deathT >= 0.55) {
          const [sx, sy] = s.L.start;
          s.x = sx; s.y = sy; s.px = sx; s.py = sy;
          s.attached = null;
          s.onGround = true;
          s.dead = false;
          s.fadeIn = 1;
          s.trail.length = 0;
          s.flick = null;
        }
      }
      if (s.fadeIn > 0) s.fadeIn = Math.max(0, s.fadeIn - 0.07);

      // ── camera: lead + speed zoom-out ───────────────────────────────
      const vx2 = s.x - s.px, vy2 = s.y - s.py;
      const speed = Math.hypot(vx2, vy2);
      const lead = clamp(vx2 * 9, -110, 150);
      const target = clamp(s.x - W / 2 + 60 + lead, 0, s.L.length - W);
      s.camX += (target - s.camX) * 0.10;
      const zTarget = clamp(1 - Math.max(0, speed - 5) * 0.013, 0.86, 1);
      s.zoom += (zTarget - s.zoom) * 0.08;

      // ── effects updates ────────────────────────────────────────────
      if (speed > 3.5 && !s.dead) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 16) s.trail.shift();
      } else if (s.trail.length) {
        s.trail.shift();
      }

      if (speed > 8 && !s.dead) {
        const ux = vx2 / speed, uy = vy2 / speed;
        for (let i = 0; i < 2; i++) {
          s.lines.push({
            x: Math.random() * W,
            y: Math.random() * H,
            ux, uy,
            len: 26 + speed * 4 * Math.random(),
            life: 1,
          });
        }
      }
      for (const ln of s.lines) ln.life -= 0.14;
      s.lines = s.lines.filter((l) => l.life > 0);

      for (const d of s.dust) {
        d.x += d.vx; d.y += d.vy; d.vy += 0.06; d.life -= 0.04;
      }
      s.dust = s.dust.filter((d) => d.life > 0);

      for (const f of s.floats) { f.y -= 0.7; f.t -= 0.018; }
      s.floats = s.floats.filter((f) => f.t > 0);

      if (s.flick) {
        s.flick.t -= 0.07;
        if (s.flick.t <= 0) s.flick = null;
      }

      draw();
      raf = requestAnimationFrame(step);
    };

    let raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [levelIdx, status]);

  const onDown = () => { const s = stateRef.current; if (s) s.grabHeld = true; };
  const onUp = () => {
    const s = stateRef.current;
    if (!s) return;
    s.grabHeld = false;
    if (s.attached !== null) {
      const [ax, ay] = s.L.anchors[s.attached];
      const vx = s.x - s.px, vy = s.y - s.py;
      const speed = Math.hypot(vx, vy);
      s.flick = { ax, ay, px: s.x, py: s.y, t: 1 };
      if (speed > PERFECT_SPEED && vy < -1.5) {
        // released near the top of a fast arc — reward it
        s.perfects += 1;
        s.floats.push({ x: s.x, y: s.y - 34, t: 1, txt: 'PERFECT' });
        sfx.star();
      } else {
        sfx.bounce();
      }
      s.attached = null;
    }
  };

  useEffect(() => {
    const kd = (e) => { if (e.code === 'Space') { e.preventDefault(); onDown(); } };
    const ku = (e) => { if (e.code === 'Space') { e.preventDefault(); onUp(); } };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  const next = () => {
    if (levelIdx < LEVELS.length - 1) setLevelIdx(levelIdx + 1);
    else setLevelIdx(0);
  };
  const doRetry = () => {
    const i = levelIdx;
    setLevelIdx(-1);
    setTimeout(() => setLevelIdx(i), 0);
  };

  return (
    <div className="hook">
      <div className="hook-bar">
        <span>Level <b>{levelIdx + 1}/{LEVELS.length}</b></span>
        <button className="btn btn-ghost btn-sm" onClick={doRetry}>Retry</button>
      </div>
      <canvas
        ref={canvasRef}
        className="hook-canvas"
        width={W}
        height={H}
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={(e) => { e.preventDefault(); onDown(); }}
        onTouchEnd={(e) => { e.preventDefault(); onUp(); }}/>
      {status === 'won' && (
        <div className="hook-bar">
          <span style={{color: 'var(--accent)', fontWeight: 700}}>
            Level cleared{finalTime != null ? ` in ${finalTime.toFixed(1)}s` : ''}
          </span>
          <button className="btn btn-primary btn-sm" onClick={next}>
            {levelIdx < LEVELS.length - 1 ? 'Next level' : 'Restart'}
          </button>
        </div>
      )}
      <div className="hook-hint">Hold Space / mouse / touch to grab the nearest anchor · release at the top of the arc</div>
    </div>
  );
}
