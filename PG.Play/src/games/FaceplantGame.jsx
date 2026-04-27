// FACEPLANT — original physics-hazard ride.
//
// You ride a bike across a hand-authored track of hills, bumps, and spikes.
// Head touches the ground = faceplant (crash). Reach the flag to win.
//
//  • Rigid-body chassis (one rectangle) with position + rotation +
//    angular velocity. Visual wheels are drawn but not simulated
//    separately — their contact is approximated by sampling the chassis'
//    bottom edge against the terrain polyline.
//  • Controls:
//      → accelerate          ← brake
//      W / ↑  lean back      S / ↓  lean forward
//      Space reset           R restart
//  • Terrain = array of points interpolated linearly. Spikes are arrays
//    of triangles placed at specific x positions.
//  • Score = 1000 + remainingSeconds × 10 on win; 0 on crash.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

// Native level dimensions. The fluid sizer fills the canvas to its parent;
// we render the level at this fixed size, centered horizontally with the
// sky gradient + parallax hills filling the side margins. Vertical centering
// keeps the playfield anchored mid-screen on tall viewports.
const VIEW_W = 900;
const VIEW_H = 420;

// Terrain: polyline of (x, y). y is ground height (larger = lower).
// Built by hand to pace the course — ramps, bump, long flat, spikes, bump, finish.
const TERRAIN = (() => {
  const pts = [];
  let x = 0, y = 300;
  const push = (nx, ny) => { pts.push({ x: nx, y: ny }); };
  push(x, y);
  push(200, 300);
  push(280, 260);     // ramp up
  push(360, 300);     // land
  push(500, 320);     // shallow dip
  push(600, 280);     // hump
  push(760, 320);
  push(900, 300);
  push(1100, 340);
  push(1280, 270);    // big hill
  push(1440, 320);
  push(1600, 320);
  push(1700, 280);    // small ramp before spike field
  push(1780, 320);
  push(1960, 320);    // flat landing after spikes
  push(2160, 300);
  push(2340, 340);
  push(2500, 310);    // ramp to finish
  push(2700, 310);    // goal area
  return pts;
})();

const COURSE_END = TERRAIN[TERRAIN.length - 1].x;
const GOAL_X     = COURSE_END - 40;

// Spike groups — each is an array of spike bases on the ground between two x positions.
const SPIKES = [
  { x0: 940,  x1: 1060 },   // quick spike cluster after first ramp
  { x0: 1820, x1: 1920 },   // spike field after second ramp
  { x0: 2240, x1: 2320 },   // last-minute gotcha
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
const BOUNCE = 0.22;           // vertical bounce on ground contact
const TRACK_SECONDS = 30;      // target clear time — scoring ref

// ── terrain helpers ──
function groundAt(x) {
  if (x <= TERRAIN[0].x) return TERRAIN[0].y;
  if (x >= TERRAIN[TERRAIN.length - 1].x) return TERRAIN[TERRAIN.length - 1].y;
  for (let i = 1; i < TERRAIN.length; i++) {
    const a = TERRAIN[i - 1], b = TERRAIN[i];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  return TERRAIN[0].y;
}
function slopeAt(x) {
  // Forward-difference slope approximation.
  const e = 2;
  return (groundAt(x + e) - groundAt(x - e)) / (2 * e);
}

const inSpikeZone = (x) => SPIKES.some((s) => x >= s.x0 && x <= s.x1);

export default function FaceplantGame() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const viewRef   = useRef({ cssW: VIEW_W, cssH: VIEW_H, scale: 1, offX: 0, offY: 0, dispW: VIEW_W, dispH: VIEW_H });
  const stateRef  = useRef(null);
  const submittedRef = useRef(false);
  const [time, setTime]       = useState(0);
  const [speed, setSpeed]     = useState(0);
  const [status, setStatus]   = useState('ready'); // ready | playing | won | crashed
  const [reason, setReason]   = useState(null);     // 'spike' | 'head' | 'pit'

  const reset = () => {
    stateRef.current = {
      bike: {
        x: 80, y: groundAt(80) - 20,
        vx: 0, vy: 0,
        angle: 0, va: 0,
        onGround: true,
      },
      elapsed: 0,
      camX: 0,
      particles: [],
    };
    setTime(0);
    setSpeed(0);
    setStatus('ready');
    setReason(null);
    submittedRef.current = false;
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

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { bike, camX, particles } = s;
      const view = viewRef.current;
      const { cssW, cssH, offX, offY, scale, dispW, dispH } = view;

      // Full-canvas sky gradient — extends past the playfield so the side
      // margins on wide viewports don't show empty backdrop.
      const sky = ctx.createLinearGradient(0, 0, 0, cssH);
      sky.addColorStop(0, '#8bd6ff');
      sky.addColorStop(1, '#e6f4ff');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, cssW, cssH);

      // Distant hills (parallax) — also span the full canvas width so the
      // parallax skyline keeps filling the side margins.
      ctx.fillStyle = 'rgba(80, 140, 90, 0.45)';
      for (let i = 0; i < 24; i++) {
        const hx = ((i * 180 - camX * 0.35) % (cssW + 400)) - 200;
        ctx.beginPath();
        ctx.moveTo(hx, offY + 280);
        ctx.quadraticCurveTo(hx + 60, offY + 200, hx + 120, offY + 280);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(60, 110, 70, 0.6)';
      for (let i = 0; i < 20; i++) {
        const hx = ((i * 220 - camX * 0.55) % (cssW + 400)) - 200;
        ctx.beginPath();
        ctx.moveTo(hx, offY + 300);
        ctx.quadraticCurveTo(hx + 70, offY + 230, hx + 140, offY + 300);
        ctx.closePath();
        ctx.fill();
      }

      // From here on, draw the level itself in its native coord system.
      // Translate so (0,0) lines up with the playfield top-left, then clip
      // so terrain / spikes don't bleed into the side margins.
      ctx.save();
      ctx.beginPath();
      ctx.rect(offX, offY, dispW, dispH);
      ctx.clip();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      // Ground polygon
      ctx.fillStyle = '#6fbf4a';
      ctx.beginPath();
      ctx.moveTo(-camX, VIEW_H);
      for (let i = 0; i < TERRAIN.length; i++) {
        ctx.lineTo(TERRAIN[i].x - camX, TERRAIN[i].y);
      }
      ctx.lineTo(COURSE_END - camX, VIEW_H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2f6a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < TERRAIN.length; i++) {
        const p = TERRAIN[i];
        if (i === 0) ctx.moveTo(p.x - camX, p.y);
        else         ctx.lineTo(p.x - camX, p.y);
      }
      ctx.stroke();

      // Spikes
      ctx.fillStyle = '#9aa0a8';
      ctx.strokeStyle = '#5a606a';
      ctx.lineWidth = 1;
      SPIKES.forEach(({ x0, x1 }) => {
        for (let x = x0; x <= x1; x += 14) {
          const y = groundAt(x);
          ctx.beginPath();
          ctx.moveTo(x - camX - 6, y);
          ctx.lineTo(x - camX, y - 18);
          ctx.lineTo(x - camX + 6, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      // Goal flag
      const gx = GOAL_X - camX;
      const gy = groundAt(GOAL_X);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 100);
      ctx.stroke();
      ctx.fillStyle = '#35f0c9';
      ctx.beginPath();
      ctx.moveTo(gx, gy - 100);
      ctx.lineTo(gx + 38, gy - 88);
      ctx.lineTo(gx, gy - 76);
      ctx.closePath();
      ctx.fill();

      // Bike
      ctx.save();
      ctx.translate(bike.x - camX, bike.y);
      ctx.rotate(bike.angle);
      // chassis body
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(-CHASSIS_W / 2, -CHASSIS_H / 2, CHASSIS_W, CHASSIS_H);
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 2;
      ctx.strokeRect(-CHASSIS_W / 2, -CHASSIS_H / 2, CHASSIS_W, CHASSIS_H);
      // seat
      ctx.fillStyle = '#0a0d0e';
      ctx.fillRect(-6, -CHASSIS_H / 2 - 5, 18, 5);
      // rider torso
      ctx.fillStyle = '#1a2540';
      ctx.fillRect(-3, -CHASSIS_H / 2 - 20, 10, 16);
      // head (the lethal bit)
      ctx.fillStyle = '#ffd1a6';
      ctx.beginPath();
      ctx.arc(2, -CHASSIS_H / 2 - 26, HEAD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0d0e';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // wheels (visual)
      ctx.fillStyle = '#0a0d0e';
      ctx.beginPath();
      ctx.arc(-CHASSIS_W / 2 + 6, CHASSIS_H / 2 + 8, 10, 0, Math.PI * 2);
      ctx.arc( CHASSIS_W / 2 - 6, CHASSIS_H / 2 + 8, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.arc(-CHASSIS_W / 2 + 6, CHASSIS_H / 2 + 8, 5, 0, Math.PI * 2);
      ctx.arc( CHASSIS_W / 2 - 6, CHASSIS_H / 2 + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      // exhaust flame when throttle
      if (keys['d'] || keys['arrowright'] || keys['keyd'] || touchKeys.throttle) {
        ctx.fillStyle = '#ff8a3a';
        ctx.beginPath();
        ctx.moveTo(-CHASSIS_W / 2, 0);
        ctx.lineTo(-CHASSIS_W / 2 - 14 - Math.random() * 6, -2);
        ctx.lineTo(-CHASSIS_W / 2 - 10, 0);
        ctx.lineTo(-CHASSIS_W / 2 - 14 - Math.random() * 6, 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Particles (crash sparks)
      particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 30));
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - camX - 1.5, p.y - 1.5, 3, 3);
        ctx.globalAlpha = 1;
      });

      // HUD — distance bar (rendered inside the playfield's translated/clipped
      // space so the start/finish labels track the actual level edges)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(20, 20, VIEW_W - 40, 6);
      ctx.fillStyle = '#ffe14f';
      ctx.fillRect(20, 20, (VIEW_W - 40) * Math.min(1, bike.x / COURSE_END), 6);
      // start/goal labels
      ctx.fillStyle = '#0a0d0e';
      ctx.font = '10px "Space Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('START', 20, 38);
      ctx.textAlign = 'right';
      ctx.fillText('FINISH', VIEW_W - 20, 38);

      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();

    const step = () => {
      raf = requestAnimationFrame(step);
      const now = performance.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = stateRef.current; if (!s) return;
      const { bike } = s;

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

        if (throttle) bike.vx += THROTTLE_ACCEL * dt;
        if (brake)    bike.vx -= BRAKE_ACCEL   * dt;
        if (leanBack) bike.va -= LEAN_TORQUE   * dt;
        if (leanFwd)  bike.va += LEAN_TORQUE   * dt;

        // Integrate
        bike.vy += GRAVITY * dt;
        bike.vx = Math.max(MIN_SPEED, Math.min(MAX_SPEED, bike.vx * LINEAR_DAMP));
        bike.va *= ANG_DAMP;
        bike.x  += bike.vx * dt;
        bike.y  += bike.vy * dt;
        bike.angle += bike.va * dt;

        // Camera follows
        s.camX = Math.max(0, Math.min(COURSE_END - VIEW_W, bike.x - VIEW_W * 0.32));

        // Ground collision: sample 3 bottom points of the chassis rotated by angle.
        const samples = [-CHASSIS_W / 2 + 6, 0, CHASSIS_W / 2 - 6];
        let grounded = false;
        for (const localX of samples) {
          // Local point on the bottom edge:
          const lx = localX;
          const ly = CHASSIS_H / 2 + 10;     // wheel bottom
          // rotate + translate
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const wx = bike.x + lx * cos - ly * sin;
          const wy = bike.y + lx * sin + ly * cos;
          const gy = groundAt(wx);
          if (wy > gy) {
            // Push bike up by the difference (apply to chassis position).
            const dyPush = wy - gy;
            bike.y -= dyPush;
            // Cancel downward velocity and bounce slightly.
            if (bike.vy > 0) bike.vy = -bike.vy * BOUNCE;
            // Align rotation gently toward slope.
            const slope = slopeAt(wx);
            const target = Math.atan(slope);
            const dAng = target - bike.angle;
            bike.angle += dAng * 0.12;
            bike.va *= 0.9;
            grounded = true;
          }
        }
        bike.onGround = grounded;

        // Head contact = crash.
        {
          const lx = 2, ly = -CHASSIS_H / 2 - 26;
          const cos = Math.cos(bike.angle), sin = Math.sin(bike.angle);
          const hx = bike.x + lx * cos - ly * sin;
          const hy = bike.y + lx * sin + ly * cos;
          if (hy + HEAD_R > groundAt(hx) && hx > 20) {
            crash('head');
            return;
          }
        }

        // Spike contact at any sampled chassis edge.
        if (inSpikeZone(bike.x)) {
          const gy = groundAt(bike.x);
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
        if (bike.x >= GOAL_X) {
          setStatus('won');
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1000 + Math.max(0, TRACK_SECONDS - s.elapsed) * 10));
            submitScore('happywheels', score, { time: Math.round(s.elapsed) });
          }
        }

        setSpeed(Math.round(bike.vx));
      }

      // Particles tick
      s.particles.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= 1; });
      s.particles = s.particles.filter((p) => p.life > 0);

      draw();
    };

    const crash = (why) => {
      if (status !== 'playing') return;
      setStatus('crashed');
      setReason(why);
      // Burst of red particles at head/chassis position.
      const s = stateRef.current;
      for (let i = 0; i < 24; i++) {
        s.particles.push({
          x: s.bike.x, y: s.bike.y - CHASSIS_H,
          vx: (Math.random() - 0.5) * 360,
          vy: -120 - Math.random() * 120,
          life: 30 + Math.random() * 20,
          color: i % 2 ? '#ff4d6d' : '#c91e1e',
        });
      }
      if (!submittedRef.current) {
        submittedRef.current = true;
        submitScore('happywheels', 0, { crash: why, time: Math.round(s.elapsed) });
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      dispose();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const bike = stateRef.current?.bike;
  const distPct = bike ? Math.round((Math.min(bike.x, COURSE_END) / COURSE_END) * 100) : 0;

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
        <span>Distance <b>{distPct}%</b></span>
        <span>Speed <b>{speed}</b></span>
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
          Course cleared · {time}s · bones intact
        </div>
      )}
      {status === 'crashed' && reason && (
        <div className="face-result" style={{color:'#ff4d6d'}}>{reasonLabel}</div>
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
