// NIGHT SHIFT — original side-view stealth.
//
//  • You have three nights, three floors, each ending with a green exit door.
//  • Guards patrol a fixed path. Each has a vision cone — enter it standing
//    and a detection meter fills. Fill it and you're caught and restart
//    the current night.
//  • Hold Shift to tiptoe — 45 % slower, detection rate cut in half.
//  • No combat. No saves. Just read patrols, time the gap, walk.
//  • Controls: A/D or arrows to move. Shift to tiptoe. R to restart the
//    current night. Space (or the on-screen pad) also tiptoes for touch.

import { useEffect, useRef, useState } from 'react';
import { submitScore } from '../scoreBus.js';
import { sizeCanvasFluid } from '../util/canvasDpr.js';

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

const LEVELS = [
  {
    name: 'Reception',
    exit: W - 64,
    guards: [
      { x: 420, y: FLOOR_Y - P_H, minX: 260, maxX: 680, speed: 80, dir: 1 },
    ],
    props: [{ x: 150, y: FLOOR_Y - 28, w: 40, h: 28 }], // crate you can tuck behind (visual only)
  },
  {
    name: 'Second floor',
    exit: W - 64,
    guards: [
      { x: 260, y: FLOOR_Y - P_H, minX: 140, maxX: 420, speed: 110, dir: 1 },
      { x: 620, y: FLOOR_Y - P_H, minX: 480, maxX: 760, speed: 80, dir: -1 },
    ],
    props: [{ x: 440, y: FLOOR_Y - 34, w: 46, h: 34 }],
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
  },
];

export default function NightShiftGame() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef  = useRef(null);
  const viewRef = useRef({ cssW: W, cssH: H }); // fluid render dimensions
  const submittedRef = useRef(false);
  const [level, setLevel]     = useState(0);
  const [caught, setCaught]   = useState(0);
  const [detect, setDetect]   = useState(0);
  const [time, setTime]       = useState(0);
  const [tiptoe, setTiptoe]   = useState(false);
  const [status, setStatus]   = useState('playing'); // playing | won

  const loadLevel = (idx) => {
    const lv = LEVELS[idx];
    stateRef.current = {
      lv,
      player: { x: 40, y: FLOOR_Y - P_H, facing: 1 },
      guards: lv.guards.map((g) => ({ ...g })),
      detect: 0,
      elapsed: 0,
      caughtFlash: 0,
      exitFlash: 0,
    };
    setDetect(0);
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

    // Fluid sizer — record the css size so draw can center the scene
    // inside it. The scene itself is always drawn at W × H.
    const dispose = sizeCanvasFluid(canvas, wrap, (cssW, cssH) => {
      viewRef.current = { cssW, cssH };
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

    const draw = () => {
      const s = stateRef.current; if (!s) return;
      const { lv, player, guards, exitFlash, caughtFlash } = s;
      const { cssW, cssH } = viewRef.current;

      // Outer backdrop — same color as the scene's bottom band so the
      // padding around the playfield blends rather than framing it.
      ctx.fillStyle = '#0a0e16';
      ctx.fillRect(0, 0, cssW, cssH);

      // Center the fixed-size scene inside the canvas
      const offX = (cssW - W) / 2;
      const offY = (cssH - H) / 2;
      ctx.save();
      ctx.translate(offX, offY);

      // Backdrop — dim corridor
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#141b27');
      grad.addColorStop(1, '#0a0e16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Wall stripes
      ctx.fillStyle = '#1a2332';
      for (let i = 0; i < 16; i++) {
        ctx.fillRect(i * (W / 16), 40, (W / 16) - 6, 120);
      }
      // baseboard
      ctx.fillStyle = '#27334a';
      ctx.fillRect(0, FLOOR_Y - 4, W, 4);
      // floor
      const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
      floorGrad.addColorStop(0, '#1b2336');
      floorGrad.addColorStop(1, '#0e131e');
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
      // floor grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      // Vision cones (drawn BEHIND props/guards)
      guards.forEach((g) => {
        const cx = g.x + P_W / 2;
        const cy = g.y + 10;
        const dir = g.dir >= 0 ? 0 : Math.PI;
        const grad2 = ctx.createRadialGradient(cx, cy, 10, cx, cy, CONE_RANGE);
        grad2.addColorStop(0, 'rgba(255, 77, 109, 0.36)');
        grad2.addColorStop(1, 'rgba(255, 77, 109, 0)');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, CONE_RANGE, dir - CONE_HALF_ANGLE, dir + CONE_HALF_ANGLE);
        ctx.closePath();
        ctx.fill();
        // Outline
        ctx.strokeStyle = 'rgba(255, 77, 109, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(dir - CONE_HALF_ANGLE) * CONE_RANGE, cy + Math.sin(dir - CONE_HALF_ANGLE) * CONE_RANGE);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + Math.cos(dir + CONE_HALF_ANGLE) * CONE_RANGE, cy + Math.sin(dir + CONE_HALF_ANGLE) * CONE_RANGE);
        ctx.stroke();
      });

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

      // Exit door
      const doorX = lv.exit;
      const doorGlow = 0.55 + 0.25 * Math.sin(performance.now() / 280);
      ctx.fillStyle = `rgba(0, 255, 245, ${doorGlow})`;
      ctx.fillRect(doorX - 4, FLOOR_Y - 72, 8, 72);
      ctx.fillStyle = '#0a3a36';
      ctx.fillRect(doorX, FLOOR_Y - 64, 32, 64);
      ctx.strokeStyle = '#00fff5';
      ctx.lineWidth = 2;
      ctx.strokeRect(doorX, FLOOR_Y - 64, 32, 64);

      // Guards
      guards.forEach((g) => {
        // body
        ctx.fillStyle = '#c94b65';
        ctx.fillRect(g.x, g.y + 8, P_W, P_H - 10);
        // head
        ctx.beginPath();
        ctx.arc(g.x + P_W / 2, g.y + 6, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd1a6';
        ctx.fill();
        // cap
        ctx.fillStyle = '#1b2534';
        ctx.fillRect(g.x + 2, g.y - 1, P_W - 4, 6);
        // facing indicator — tiny arrow
        ctx.strokeStyle = '#0a0d0e';
        ctx.lineWidth = 1.5;
        const dir = g.dir;
        ctx.beginPath();
        ctx.moveTo(g.x + P_W / 2 + dir * 4, g.y + 4);
        ctx.lineTo(g.x + P_W / 2 + dir * 10, g.y + 4);
        ctx.lineTo(g.x + P_W / 2 + dir * 7, g.y + 1);
        ctx.stroke();
      });

      // Player
      const color = tiptoe ? '#35f0c9' : '#e5f5ff';
      ctx.fillStyle = '#1a2540';
      ctx.fillRect(player.x, player.y + 8, P_W, P_H - 10);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(player.x + P_W / 2, player.y + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      // mask stripe
      ctx.fillStyle = '#0a0d0e';
      ctx.fillRect(player.x + 3, player.y + 4, P_W - 6, 3);

      ctx.restore();

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
      const left  = keys['a'] || keys['arrowleft']  || keys['keya'];
      const right = keys['d'] || keys['arrowright'] || keys['keyd'];
      const sneak = keys['shift'] || keys['shiftleft'] || keys['shiftright'] || keys[' '] || keys['space'];

      setTiptoe(!!sneak);

      const speed = sneak ? TIPTOE_SPEED : WALK_SPEED;
      let dx = 0;
      if (left) dx -= 1;
      if (right) dx += 1;
      p.x += dx * speed * dt;
      if (dx !== 0) p.facing = dx;

      // Clamp to world
      p.x = Math.max(8, Math.min(W - P_W - 8, p.x));

      // Guards patrol
      s.guards.forEach((g) => {
        g.x += g.dir * g.speed * dt;
        if (g.x < g.minX) { g.x = g.minX; g.dir = 1; }
        if (g.x > g.maxX) { g.x = g.maxX; g.dir = -1; }
      });

      // Detection
      const px = p.x + P_W / 2;
      const py = p.y + P_H / 2;
      let anySight = false;
      s.guards.forEach((g) => {
        if (coneContainsPlayer(g, px, py)) anySight = true;
      });
      if (anySight) {
        s.detect += (sneak ? DETECT_RATE_TIPTOE : DETECT_RATE_WALK) * dt;
      } else {
        s.detect = Math.max(0, s.detect - DETECT_DECAY * dt);
      }
      setDetect(Math.min(1, s.detect));

      if (s.detect >= 1) {
        s.caughtFlash = 1.0;
        setTimeout(caughtReset, 300);
        s.detect = 0;
      }

      // Exit
      if (p.x + P_W >= s.lv.exit) {
        s.exitFlash = 0.4;
        if (level + 1 >= LEVELS.length) {
          if (!submittedRef.current) {
            submittedRef.current = true;
            const score = Math.max(0, Math.round(1800 - caught * 120 - s.elapsed * 2));
            submitScore('bob', score, { caught, time: Math.round(s.elapsed), level: level + 1 });
          }
          setStatus('won');
        } else {
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
    setCaught(0);
    setTime(0);
    setLevel(0);
    setStatus('playing');
  };

  const pct = Math.round(detect * 100);

  return (
    <div className="nightshift" style={{ width: '100%', height: '100%' }}>
      <div className="nightshift-bar">
        <span>Night <b style={{color:'var(--accent)'}}>{Math.min(LEVELS.length, level + 1)}</b>/{LEVELS.length}</span>
        <span>{LEVELS[level]?.name}</span>
        <span>Caught <b>{caught}</b></span>
        <span>Time <b>{time}s</b></span>
        <span style={{marginLeft:'auto'}}>
          {status === 'won' && <button className="btn btn-primary btn-sm" onClick={restart}>Play again</button>}
        </span>
      </div>
      <div className="nightshift-detect">
        <div className={'nightshift-detect-fill' + (pct > 66 ? ' is-high' : pct > 33 ? ' is-mid' : '')} style={{width: `${pct}%`}}/>
        <span className="nightshift-detect-label">Detection</span>
      </div>
      <div ref={wrapRef} style={{ flex: '1 1 0', minHeight: 0, width: '100%', position: 'relative' }}>
        <canvas ref={canvasRef} className="nightshift-canvas"/>
      </div>
      {status === 'won' ? (
        <div className="nightshift-tip" style={{color:'var(--accent)', fontWeight:700}}>
          Clean out · {caught} caught · {time}s
        </div>
      ) : (
        <div className="nightshift-tip">Walk is loud. Tiptoe is slow. Pick your moment.</div>
      )}
      <div className="nightshift-hint">A/D move · Shift or Space to tiptoe · R restart night · slip past cones, reach the door</div>
    </div>
  );
}
