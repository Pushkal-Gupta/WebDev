// HOOP SHOT — original drag-aim-release basketball.
//
//  • Single-player, 90-second run. Touch-native: press the ball, drag back
//    to set aim + power (like a slingshot), release to shoot.
//  • Hoop slides slowly left/right. Clean swishes score 3 points; rim hits
//    score 2. Score submitted to the platform score bus on time-up.
//  • Streak bonus: consecutive makes add +1 per made shot in a row.
//  • Fire mode: 3 makes in a row ignites the ball (flame trail + 2x base
//    points) until a miss — the streak counter doubles as the fuse.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../../scoreBus.js';
import { sizeCanvasFluid } from '../../util/canvasDpr.js';
import { sfx } from '../../sound.js';

const W = 720;
const H = 460;
const RUN_SECONDS = 90;
const FLOOR_Y = 410;
const BALL_R = 16;
const GRAVITY = 1200;         // px/s^2
const DRAG = 0.18;
const POWER_MAX = 1200;        // peak initial speed
const POWER_DRAW_MAX = 160;    // max draw distance

const HOOP = {
  y: 130,
  w: 64,                       // rim inner width
  backboardW: 12,
  netH: 36,
  baseX: 540,                  // starts on the right
};

const FIRE_AT = 3;             // streak length that ignites the ball
const TRAIL_MAX = 14;          // ghost circles behind a flying ball

// Pixel-accurate rim: two short horizontal posts at y = HOOP.y, separated by HOOP.w.

export default function HoopShotGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H, scale: 1, offX: 0, offY: 0 });
  const stateRef = useRef(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem('pd-hoop-best') || 0));
  const [time, setTime] = useState(RUN_SECONDS);
  // 'ready' is the spawn-safety gate — the 90s timer doesn't start
  // until the first pointerdown / first valid input.
  const [status, setStatus] = useState('ready'); // 'ready' | 'playing' | 'ended'
  const [shots, setShots] = useState(0);
  const [made, setMade] = useState(0);

  // Keep refs fresh so the RAF loop reads current score / streak without re-subscribing.
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { streakRef.current = streak; }, [streak]);

  const reset = () => {
    stateRef.current = {
      ball: {
        x: 140, y: FLOOR_Y - BALL_R, vx: 0, vy: 0,
        flying: false, settled: true,
        rot: 0,                // visual spin, radians
        squash: 0,             // 0..1 impact squash amount, decays
        squashAxis: 'y',       // 'y' = floor impact, 'x' = wall/board impact
      },
      draw: null,               // { startX, startY, x, y }
      hoopX: HOOP.baseX,
      hoopDir: -1,
      hoopSpeed: 60,            // px/sec, ramps with score
      particles: [],            // { x,y,vx,vy,life,max,color,kind:'spark'|'flame'|'dust' }
      popups: [],               // { text,x,y,life,max,color,size }
      trail: [],                // recent ball positions while flying
      netAmp: 0,                // net ripple amplitude, decays
      rimRattle: 0,             // rim shake amount, decays
      flash: 0,                 // full-screen flash (fire-mode ignition)
      touchedRim: false,        // per-shot contact flags for SWISH/BANK call
      touchedBoard: false,
      lastBounceSfx: 0,         // throttle bounce audio
      scoredThisShot: false,
      clock: performance.now(),
      timeLeft: RUN_SECONDS,
    };
    setScore(0); setStreak(0); setBestStreak(0); setTime(RUN_SECONDS); setShots(0); setMade(0);
    setStatus('ready');
  };

  useEffect(() => { reset(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Dev-only handle so capture/automation scripts can read live state
  // (hoop position, ball flight) without poking at canvas pixels.
  if (import.meta.env.DEV && typeof window !== 'undefined') window.__hoopState = stateRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');

    // Fluid sizer — uniform scale-to-fit so the 720×460 court never
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

    const rectOf = () => canvas.getBoundingClientRect();
    const toLocal = (cx, cy) => {
      const r = rectOf();
      const { scale, offX, offY } = viewRef.current;
      return {
        x: ((cx - r.left) - offX) / scale,
        y: ((cy - r.top)  - offY) / scale,
      };
    };

    const beginDraw = (x, y) => {
      const s = stateRef.current; if (!s) return;
      // Spawn-safety gate: first valid press leaves 'ready' and starts the
      // 90s clock. The press itself doesn't count as a shot if the ball
      // is far away — same hit-test as before.
      if (status === 'ready') {
        setStatus('playing');
        return;
      }
      if (status !== 'playing') return;
      // Must start near the ball
      if (!s.ball.settled) return;
      const d = Math.hypot(x - s.ball.x, y - s.ball.y);
      if (d > 48) return;
      s.draw = { startX: s.ball.x, startY: s.ball.y, x, y };
    };
    const moveDraw = (x, y) => {
      const s = stateRef.current; if (!s || !s.draw) return;
      s.draw.x = x; s.draw.y = y;
    };
    const endDraw = () => {
      const s = stateRef.current; if (!s || !s.draw) return;
      // Shoot in direction opposite the drag.
      const dx = s.draw.startX - s.draw.x;
      const dy = s.draw.startY - s.draw.y;
      const drawLen = Math.min(POWER_DRAW_MAX, Math.hypot(dx, dy));
      const power = (drawLen / POWER_DRAW_MAX) * POWER_MAX;
      const ang = Math.atan2(dy, dx);
      s.ball.vx = Math.cos(ang) * power;
      s.ball.vy = Math.sin(ang) * power;
      s.ball.flying = true;
      s.ball.settled = false;
      s.scoredThisShot = false;
      s.touchedRim = false;
      s.touchedBoard = false;
      s.trail = [];
      s.draw = null;
      setShots((n) => n + 1);
      sfx.shot();
    };

    const onMouseDown = (e) => { const p = toLocal(e.clientX, e.clientY); beginDraw(p.x, p.y); };
    const onMouseMove = (e) => { const p = toLocal(e.clientX, e.clientY); moveDraw(p.x, p.y); };
    const onMouseUp   = ()  => endDraw();
    const onTouchStart = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      beginDraw(p.x, p.y);
    };
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      e.preventDefault();
      const p = toLocal(e.touches[0].clientX, e.touches[0].clientY);
      moveDraw(p.x, p.y);
    };
    const onTouchEnd = (e) => { e.preventDefault(); endDraw(); };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

    // Bounce sfx throttle — rapid floor skips would machine-gun otherwise.
    const bounceSfx = (s, strength) => {
      const now = performance.now();
      if (now - s.lastBounceSfx < 90) return;
      s.lastBounceSfx = now;
      sfx.hoopBounce(strength);
    };

    const spawnPopup = (s, text, x, y, color, size = 22) => {
      s.popups.push({ text, x, y, life: 60, max: 60, color, size });
    };
    const spawnDust = (s, x, y, n = 6) => {
      for (let i = 0; i < n; i++) {
        s.particles.push({
          x: x + (Math.random() - 0.5) * BALL_R, y,
          vx: (Math.random() - 0.5) * 120, vy: -20 - Math.random() * 70,
          life: 16 + Math.random() * 8, max: 24, kind: 'dust',
          color: '#e8c9a0',
        });
      }
    };

    // ── Render ─────────────────────────────────────────────────
    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { cssW, cssH } = viewRef.current;
      const t = performance.now() / 1000;
      const onFire = streakRef.current >= FIRE_AT;

      // Stadium-light gradient letterbox — warmer near the rim at the top,
      // deeper amber at the floor.
      const bgGrad = ctx.createLinearGradient(0, 0, 0, cssH);
      bgGrad.addColorStop(0, '#d6541d');
      bgGrad.addColorStop(0.55, '#b6451a');
      bgGrad.addColorStop(1, '#8a3010');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cssW, cssH);

      // Centered + uniform-scaled 720×460 court.
      const { scale, offX, offY } = viewRef.current;
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // ── Arena wall ─────────────────────────────────────────
      const wallGrad = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
      wallGrad.addColorStop(0, '#5c1c10');
      wallGrad.addColorStop(0.55, '#8a3010');
      wallGrad.addColorStop(1, '#b6451a');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, W, FLOOR_Y);

      // Soft overhead spotlight pooling toward the hoop side.
      const spot = ctx.createRadialGradient(W * 0.62, -40, 40, W * 0.62, -40, 460);
      spot.addColorStop(0, 'rgba(255,225,160,0.16)');
      spot.addColorStop(1, 'rgba(255,225,160,0)');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, FLOOR_Y);

      // Arena banner stripe — gives the wall a horizon line.
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 196, W, 10);

      // ── Crowd band ─────────────────────────────────────────
      // Two staggered rows of silhouettes; subtle bob, more excited
      // when the shooter is on fire.
      const crowdTop = FLOOR_Y - 124;
      const crowdGrad = ctx.createLinearGradient(0, crowdTop, 0, FLOOR_Y);
      crowdGrad.addColorStop(0, 'rgba(30,10,8,0.30)');
      crowdGrad.addColorStop(1, 'rgba(20,6,6,0.55)');
      ctx.fillStyle = crowdGrad;
      ctx.fillRect(0, crowdTop, W, FLOOR_Y - crowdTop);
      const bobAmp = onFire ? 4.5 : 1.8;
      for (let row = 0; row < 2; row++) {
        const rowY = crowdTop + 34 + row * 44;
        const shade = row === 0 ? 'rgba(12,4,6,0.55)' : 'rgba(24,9,10,0.72)';
        ctx.fillStyle = shade;
        for (let i = -1; i < 27; i++) {
          const x = i * 28 + (row === 0 ? 0 : 14);
          const bob = Math.sin(t * (1.5 + row * 0.4) + i * 1.7 + row * 2.1) * bobAmp;
          const hVar = ((i * 13 + row * 7) % 12);
          ctx.beginPath();
          ctx.arc(x + 12, rowY + bob - 10 - hVar * 0.4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(x + 2, rowY + bob - 4 - hVar * 0.4, 20, 30 + hVar);
        }
      }
      // Courtside rail in front of the crowd.
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.fillRect(0, FLOOR_Y - 14, W, 3);

      // ── Court floor: wood planks + keylines ────────────────
      const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
      floorGrad.addColorStop(0, '#c07a36');
      floorGrad.addColorStop(1, '#9a5a24');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      // Plank bands (vertical joints, alternating tone) + a mid seam
      // with offset joints so it reads as staggered boards.
      for (let i = 0; i < W / 48; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.05)';
          ctx.fillRect(i * 48, FLOOR_Y, 48, H - FLOOR_Y);
        }
      }
      ctx.strokeStyle = 'rgba(60,30,10,0.35)';
      ctx.lineWidth = 1;
      for (let i = 1; i < W / 48; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 48, FLOOR_Y); ctx.lineTo(i * 48, H);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y + 26); ctx.lineTo(W, FLOOR_Y + 26);
      ctx.stroke();
      // Floor sheen near the baseline.
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(0, FLOOR_Y, W, 4);

      // Keylines: baseline, key arc, three-point arc, half-court mark.
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y); ctx.lineTo(W, FLOOR_Y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(140, FLOOR_Y, 60, Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(140, FLOOR_Y, 110, Math.PI, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(420, FLOOR_Y); ctx.lineTo(420, FLOOR_Y + 18);
      ctx.arc(420, FLOOR_Y + 18, 14, 0, Math.PI);
      ctx.stroke();

      // ── Hoop: net first (ball renders in FRONT of the net) ──
      const hx = s.hoopX;
      const rattle = s.rimRattle;
      const rrx = Math.cos(t * 47) * 1.6 * rattle;
      const rry = Math.sin(t * 55) * 2.6 * rattle;
      // Net mesh — strand bottoms sway with the ripple amplitude.
      const netAmp = s.netAmp;
      const strandPts = [];
      for (let i = 0; i <= 6; i++) {
        const k = i / 6;
        const topX = hx - HOOP.w / 2 + k * HOOP.w;
        const sway = Math.sin(t * 16 + i * 1.35) * netAmp * (0.5 + 0.5 * k * (1 - k) * 4);
        const botX = hx - HOOP.w / 4 + k * HOOP.w / 2 + sway;
        strandPts.push({ topX, botX });
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.5;
      strandPts.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.topX, HOOP.y + rry);
        ctx.lineTo(p.botX, HOOP.y + HOOP.netH);
        ctx.stroke();
      });
      // Cross-links at 45% and 100% depth make it read as a mesh.
      [0.45, 1.0].forEach((d) => {
        ctx.beginPath();
        strandPts.forEach((p, i) => {
          const x = p.topX + (p.botX - p.topX) * d;
          const y = HOOP.y + rry + (HOOP.netH - rry) * d;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });

      // ── Ball trail (ghosts) + fire trail ───────────────────
      const ball = s.ball;
      if (s.trail.length > 1) {
        for (let i = 0; i < s.trail.length; i++) {
          const k = (i + 1) / s.trail.length;
          const p = s.trail[i];
          ctx.globalAlpha = k * (onFire ? 0.40 : 0.22);
          ctx.fillStyle = onFire
            ? (k > 0.66 ? '#ffdd55' : k > 0.33 ? '#ff9933' : '#ff5522')
            : '#ffb066';
          ctx.beginPath();
          ctx.arc(p.x, p.y, BALL_R * (0.35 + 0.55 * k), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // ── Ball: rotation, squash, fire glow ──────────────────
      ctx.save();
      ctx.translate(ball.x, ball.y);
      if (onFire) {
        // Pulsing ignition halo, visible even while the ball rests.
        const pulse = 1 + Math.sin(t * 9) * 0.12;
        const halo = ctx.createRadialGradient(0, 0, BALL_R * 0.4, 0, 0, BALL_R * 2.1 * pulse);
        halo.addColorStop(0, 'rgba(255,180,60,0.55)');
        halo.addColorStop(0.6, 'rgba(255,90,30,0.22)');
        halo.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, BALL_R * 2.1 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      const sq = ball.squash;
      if (sq > 0.01) {
        const k = sq * 0.30;
        if (ball.squashAxis === 'y') ctx.scale(1 + k, 1 - k);
        else ctx.scale(1 - k, 1 + k);
      }
      ctx.rotate(ball.rot);
      const ballGrad = ctx.createRadialGradient(-BALL_R * 0.35, -BALL_R * 0.35, BALL_R * 0.2, 0, 0, BALL_R * 1.15);
      ballGrad.addColorStop(0, '#ffb066');
      ballGrad.addColorStop(0.7, '#ff8a3a');
      ballGrad.addColorStop(1, '#e06a20');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2a1a0a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Seams — center cross + two side arcs so the spin reads clearly.
      ctx.beginPath();
      ctx.moveTo(-BALL_R, 0); ctx.lineTo(BALL_R, 0);
      ctx.moveTo(0, -BALL_R); ctx.lineTo(0, BALL_R);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-BALL_R * 1.05, 0, BALL_R * 0.85, -Math.PI * 0.32, Math.PI * 0.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(BALL_R * 1.05, 0, BALL_R * 0.85, Math.PI * 0.68, Math.PI * 1.32);
      ctx.stroke();
      ctx.restore();

      // ── Backboard (in FRONT of the ball) + rim ─────────────
      const bbX = hx + HOOP.w / 2 + 2;
      // Hanging strut explains the slide.
      ctx.fillStyle = 'rgba(40,20,12,0.85)';
      ctx.fillRect(bbX + HOOP.backboardW / 2 - 2, 0, 4, HOOP.y - 50);
      ctx.fillStyle = '#f4f0e8';
      ctx.fillRect(bbX, HOOP.y - 50, HOOP.backboardW, 60);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.strokeRect(bbX, HOOP.y - 50, HOOP.backboardW, 60);
      // Shooter-square hint on the board edge.
      ctx.strokeStyle = '#ff4d6d';
      ctx.strokeRect(bbX + 2, HOOP.y - 22, HOOP.backboardW - 4, 18);
      // Rim — drawn over the ball so a drop-through reads as "through".
      ctx.strokeStyle = onFire ? '#ff7d4d' : '#ff4d6d';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hx - HOOP.w / 2 + rrx, HOOP.y + rry);
      ctx.lineTo(hx + HOOP.w / 2 + rrx, HOOP.y + rry);
      ctx.stroke();
      // Rim hook knobs.
      ctx.fillStyle = '#d63a57';
      ctx.beginPath();
      ctx.arc(hx - HOOP.w / 2 + rrx, HOOP.y + rry, 3.4, 0, Math.PI * 2);
      ctx.arc(hx + HOOP.w / 2 + rrx, HOOP.y + rry, 3.4, 0, Math.PI * 2);
      ctx.fill();

      // ── Aim line ───────────────────────────────────────────
      if (s.draw) {
        const dx = s.draw.startX - s.draw.x;
        const dy = s.draw.startY - s.draw.y;
        const drawLen = Math.min(POWER_DRAW_MAX, Math.hypot(dx, dy));
        const k = drawLen / POWER_DRAW_MAX;
        ctx.strokeStyle = `rgba(255,255,255,${0.35 + k * 0.4})`;
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + dx, ball.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);

        // power ring
        ctx.strokeStyle = k > 0.85 ? '#ff4d6d' : k > 0.5 ? '#ffe14f' : '#35f0c9';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
        ctx.stroke();
      }

      // ── Particles ──────────────────────────────────────────
      s.particles.forEach((p) => {
        const lifeK = Math.max(0, Math.min(1, p.life / p.max));
        if (p.kind === 'flame') {
          ctx.globalAlpha = lifeK * 0.85;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.5 * lifeK + 1, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 'dust') {
          ctx.globalAlpha = lifeK * 0.5;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 + (1 - lifeK) * 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.globalAlpha = lifeK;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
      });

      // ── Popups (SWISH / BANK / +pts / streak calls) ────────
      s.popups.forEach((p) => {
        const age = 1 - p.life / p.max;
        const pop = age < 0.2 ? 1.6 - 3 * age : 1.0;     // scale-pop in
        const alpha = p.life < 18 ? p.life / 18 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(pop, pop);
        ctx.globalAlpha = alpha;
        ctx.font = `800 ${p.size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(40,16,4,0.9)';
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      });

      // ── Combo badge ────────────────────────────────────────
      const k = streakRef.current;
      if (k >= 2 && status === 'playing') {
        const fireLabel = onFire ? 'ON FIRE  x2 PTS' : 'HEATING UP';
        const pulse = onFire ? 1 + Math.sin(t * 8) * 0.05 : 1;
        ctx.save();
        ctx.translate(W / 2, 38);
        ctx.scale(pulse, pulse);
        ctx.textAlign = 'center';
        ctx.font = '800 17px system-ui, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(40,16,4,0.9)';
        ctx.strokeText(`STREAK x${k}`, 0, 0);
        ctx.fillStyle = onFire ? '#ffdd55' : '#fff';
        ctx.fillText(`STREAK x${k}`, 0, 0);
        ctx.font = '700 11px system-ui, sans-serif';
        ctx.strokeText(fireLabel, 0, 16);
        ctx.fillStyle = onFire ? '#ff9933' : 'rgba(255,255,255,0.8)';
        ctx.fillText(fireLabel, 0, 16);
        ctx.restore();
      }

      // ── Screen flash (fire-mode ignition) ──────────────────
      if (s.flash > 0.01) {
        ctx.fillStyle = `rgba(255,190,80,${s.flash * 0.45})`;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    };

    const clock = { last: performance.now() };
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - clock.last) / 1000);
      clock.last = now;
      const s = stateRef.current; if (!s) return;

      if (status === 'playing') {
        // Clock
        s.timeLeft -= dt;
        if (s.timeLeft <= 0) {
          s.timeLeft = 0;
          setTime(0);
          setStatus('ended');
          sfx.hoopBuzzer();
          // Final score submit once
          const finalScore = scoreRef.current;
          if (finalScore > best) {
            setBest(finalScore);
            localStorage.setItem('pd-hoop-best', String(finalScore));
          }
          submitScore('basket', finalScore, { made, shots });
        } else {
          setTime(Math.ceil(s.timeLeft));
        }

        // Hoop slides
        s.hoopX += s.hoopDir * s.hoopSpeed * dt;
        if (s.hoopX < 360) { s.hoopX = 360; s.hoopDir = 1; }
        if (s.hoopX > 640) { s.hoopX = 640; s.hoopDir = -1; }

        // Ball physics
        const ball = s.ball;
        const onFire = streakRef.current >= FIRE_AT;
        if (ball.flying) {
          ball.vy += GRAVITY * dt;
          ball.vx *= (1 - DRAG * dt);
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          // Visual spin follows horizontal velocity (rolling-through-air).
          ball.rot += (ball.vx / BALL_R) * dt * 0.6;

          // Trail breadcrumbs
          s.trail.push({ x: ball.x, y: ball.y });
          if (s.trail.length > TRAIL_MAX) s.trail.shift();
          // Fire mode: shed flame particles while airborne.
          if (onFire) {
            for (let i = 0; i < 2; i++) {
              s.particles.push({
                x: ball.x + (Math.random() - 0.5) * BALL_R,
                y: ball.y + (Math.random() - 0.5) * BALL_R,
                vx: (Math.random() - 0.5) * 60 - ball.vx * 0.08,
                vy: -40 - Math.random() * 80,
                life: 14 + Math.random() * 10, max: 24, kind: 'flame',
                color: ['#ffdd55', '#ff9933', '#ff5522'][i % 3 === 0 ? 0 : (Math.random() < 0.5 ? 1 : 2)],
              });
            }
          }

          // floor
          if (ball.y + BALL_R >= FLOOR_Y) {
            ball.y = FLOOR_Y - BALL_R;
            ball.squash = 1; ball.squashAxis = 'y';
            spawnDust(s, ball.x, FLOOR_Y - 2);
            if (Math.abs(ball.vy) < 120) {
              ball.vy = 0; ball.vx = 0; ball.flying = false;
              // settle + reset to shooter spot after a moment
              setTimeout(() => {
                const st = stateRef.current; if (!st) return;
                st.ball.x = 140; st.ball.y = FLOOR_Y - BALL_R;
                st.ball.vx = 0; st.ball.vy = 0; st.ball.settled = true;
                st.ball.flying = false;
                st.trail = [];
              }, 220);
            } else {
              bounceSfx(s, Math.min(1, Math.abs(ball.vy) / 800));
              ball.vy = -ball.vy * 0.55;
              ball.vx *= 0.85;
            }
          }
          // walls
          if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = -ball.vx * 0.7; ball.squash = 0.8; ball.squashAxis = 'x'; bounceSfx(s, 0.4); }
          if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -ball.vx * 0.7; ball.squash = 0.8; ball.squashAxis = 'x'; bounceSfx(s, 0.4); }
          // ceiling
          if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = -ball.vy * 0.7; ball.squash = 0.8; ball.squashAxis = 'y'; bounceSfx(s, 0.4); }

          // rim collision + scoring
          const rimL = s.hoopX - HOOP.w / 2;
          const rimR = s.hoopX + HOOP.w / 2;
          const rimY = HOOP.y;
          // Net detect: ball passes through rim while moving down
          if (!s.scoredThisShot && ball.vy > 0
              && ball.y - BALL_R < rimY && ball.y + BALL_R > rimY
              && ball.x > rimL + 4 && ball.x < rimR - 4) {
            s.scoredThisShot = true;
            // Swish vs rim
            const cleanX = Math.abs(ball.x - s.hoopX) < HOOP.w / 2 - BALL_R - 2;
            const basePoints = cleanX ? 3 : 2;
            // Fire-mode multiplier: x2 base points while ignited.
            const wasOnFire = streakRef.current >= FIRE_AT;
            const points = basePoints * (wasOnFire ? 2 : 1);
            setScore((cur) => {
              const next = cur + points + streakRef.current;
              scoreRef.current = next;
              return next;
            });
            setMade((m) => m + 1);
            const nextStreak = streakRef.current + 1;
            setStreak(nextStreak);
            streakRef.current = nextStreak;
            setBestStreak((bk) => Math.max(bk, nextStreak));

            // Shot call: BANK off the glass, SWISH if untouched, else count it.
            const call = s.touchedBoard ? 'BANK!' : (cleanX && !s.touchedRim ? 'SWISH!' : 'COUNT IT!');
            spawnPopup(s, call, s.hoopX, rimY - 36, '#fff', 26);
            spawnPopup(s, `+${points + streakRef.current - 1}`, s.hoopX, rimY + HOOP.netH + 28, '#ffe14f', 20);
            sfx.hoopSwish();
            sfx.hoopStreak(nextStreak);
            if (nextStreak === FIRE_AT) {
              // Ignition: NBA-Jam moment — flash, sting, popup.
              s.flash = 1;
              spawnPopup(s, 'ON FIRE!', s.hoopX, rimY - 66, '#ff9933', 32);
              sfx.hoopFire();
            } else if (nextStreak === 2) {
              spawnPopup(s, 'HEATING UP', s.hoopX, rimY - 66, '#ffe14f', 18);
            }
            // Net ripple on the way through.
            s.netAmp = cleanX && !s.touchedRim ? 9 : 6;
            // Particles
            for (let i = 0; i < 16; i++) {
              s.particles.push({ x: s.hoopX, y: rimY + HOOP.netH, vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 120 - 60, life: 24 + Math.random() * 16, max: 40, kind: 'spark', color: i % 2 ? '#ffe14f' : '#fff' });
            }
            // Ramp hoop speed as score grows
            s.hoopSpeed = Math.min(180, 60 + scoreRef.current * 1.2);
          } else {
            // Post bounce
            if (ball.y + BALL_R > rimY - 2 && ball.y - BALL_R < rimY + 2) {
              if (Math.abs(ball.x - rimL) < BALL_R) {
                ball.vx = -Math.abs(ball.vx) * 0.6; ball.x = rimL - BALL_R - 1;
                ball.squash = 0.7; ball.squashAxis = 'x';
                s.touchedRim = true; s.rimRattle = 1; sfx.hoopRim();
              }
              if (Math.abs(ball.x - rimR) < BALL_R) {
                ball.vx =  Math.abs(ball.vx) * 0.6; ball.x = rimR + BALL_R + 1;
                ball.squash = 0.7; ball.squashAxis = 'x';
                s.touchedRim = true; s.rimRattle = 1; sfx.hoopRim();
              }
            }
            // Backboard
            const bbX = s.hoopX + HOOP.w / 2 + 2;
            if (ball.y < rimY + 10 && ball.y > rimY - 55
                && ball.vx > 0 && ball.x + BALL_R > bbX && ball.x < bbX + HOOP.backboardW) {
              ball.vx = -Math.abs(ball.vx) * 0.6;
              ball.x = bbX - BALL_R - 1;
              ball.squash = 0.8; ball.squashAxis = 'x';
              s.touchedBoard = true;
              sfx.hoopBoard();
            }
          }

          // Miss = streak breaks on floor-settle. We detect by "a shot ended without scoring" —
          // simplest: if the ball settles (comes to rest) and we didn't score, reset streak.
          if (!s.ball.flying && !s.scoredThisShot && streakRef.current > 0) {
            if (streakRef.current >= FIRE_AT) {
              spawnPopup(s, 'FIRE OUT', ball.x, ball.y - 40, 'rgba(255,255,255,0.85)', 18);
            }
            streakRef.current = 0;
            setStreak(0);
          }
        }
      }

      // Cosmetic systems tick even after the buzzer so the final make
      // still animates out cleanly.
      const s2 = s;
      s2.particles.forEach((p) => {
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vy += (p.kind === 'flame' ? -160 : p.kind === 'dust' ? 60 : 400) * dt;
        p.life -= 1;
      });
      s2.particles = s2.particles.filter((p) => p.life > 0);
      s2.popups.forEach((p) => { p.life -= 1; p.y -= 26 * dt; });
      s2.popups = s2.popups.filter((p) => p.life > 0);
      s2.netAmp *= Math.exp(-3.2 * dt);
      s2.rimRattle *= Math.exp(-4.5 * dt);
      s2.flash *= Math.exp(-4.0 * dt);
      s2.ball.squash *= Math.exp(-9.0 * dt);
      if (!s2.ball.flying && s2.trail.length > 0) s2.trail.shift();

      draw();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const accuracy = shots > 0 ? Math.round((made / shots) * 100) : 0;
  const onFireNow = streak >= FIRE_AT;

  return (
    <div className="hoop">
      <div className="hoop-bar">
        <span>Score <b style={{color:'var(--accent)'}}>{score}</b></span>
        <span>Streak <b style={onFireNow ? { color: '#ff9933' } : undefined}>{streak}{onFireNow ? ' · ON FIRE' : ''}</b></span>
        <span>Made <b>{made}</b>/{shots}</span>
        <span>Best <b>{best}</b></span>
        <span style={{marginLeft:'auto'}}>Time <b>{time}s</b></span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="hoop-canvas"/>
        {status === 'ready' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)', pointerEvents: 'none',
            color: '#fff', textAlign: 'center', padding: 16,
          }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 0.5 }}>Tap to start</div>
              <div style={{ marginTop: 6, opacity: 0.85, fontSize: 14 }}>90 seconds. Drag the ball back, release to shoot.</div>
              <div style={{ marginTop: 4, opacity: 0.7, fontSize: 13 }}>3 makes in a row sets the ball on fire — double points until you miss.</div>
            </div>
          </div>
        )}
        {status === 'ended' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(10,6,4,0.55)',
            color: '#fff', textAlign: 'center', padding: 16,
          }}>
            <div style={{
              background: 'rgba(20,12,8,0.92)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 'var(--r-lg)',
              padding: '22px 30px',
              minWidth: 240,
              boxShadow: 'var(--shadow-card)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7,
              }}>Final buzzer</div>
              <div style={{ fontSize: 40, fontWeight: 800, marginTop: 4, color: 'var(--accent, #ffe14f)' }}>{score}</div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 22px',
                marginTop: 14, fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                <span style={{ opacity: 0.65, textAlign: 'left' }}>Best streak</span>
                <b style={{ textAlign: 'right', color: bestStreak >= FIRE_AT ? '#ff9933' : '#fff' }}>
                  {bestStreak}{bestStreak >= FIRE_AT ? ' (fire)' : ''}
                </b>
                <span style={{ opacity: 0.65, textAlign: 'left' }}>Made</span>
                <b style={{ textAlign: 'right' }}>{made}/{shots}</b>
                <span style={{ opacity: 0.65, textAlign: 'left' }}>Accuracy</span>
                <b style={{ textAlign: 'right' }}>{accuracy}%</b>
                <span style={{ opacity: 0.65, textAlign: 'left' }}>All-time best</span>
                <b style={{ textAlign: 'right' }}>{best}</b>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={reset}>Play again</button>
            </div>
          </div>
        )}
      </div>
      <div className="hoop-hint">Press the ball, drag back to aim, release to shoot · swishes = 3 · rim kisses = 2 · streak adds +1 · 3 straight = on fire (x2)</div>
    </div>
  );
}
