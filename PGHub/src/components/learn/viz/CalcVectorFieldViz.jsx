import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import katex from 'katex';
import { Play, Pause, RotateCcw, Wind, Gauge } from 'lucide-react';
import './CalcVectorFieldViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Deterministic PRNG — never Math.random.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Plane window in data coordinates.
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -3;
const Y_MAX = 3;

const PRESETS = [
  { key: 'rotation', label: 'Rotation', tex: '\\mathbf{F}(x,y)=(-y,\\;x)', f: (x, y) => [-y, x], div: '0', curl: '+ (CCW spin)' },
  { key: 'source', label: 'Source', tex: '\\mathbf{F}(x,y)=(x,\\;y)', f: (x, y) => [x, y], div: '+ (outflow)', curl: '0' },
  { key: 'sink', label: 'Sink', tex: '\\mathbf{F}(x,y)=(-x,\\;-y)', f: (x, y) => [-x, -y], div: '− (inflow)', curl: '0' },
  { key: 'saddle', label: 'Saddle', tex: '\\mathbf{F}(x,y)=(x,\\;-y)', f: (x, y) => [x, -y], div: '0', curl: '0' },
  { key: 'shear', label: 'Shear', tex: '\\mathbf{F}(x,y)=(y,\\;0)', f: (x, y) => [y, 0], div: '0', curl: '− (clockwise)' },
];

const GRID_N = 11;           // arrows per axis
const PARTICLE_COUNT = 9;
const MAX_AGE = 320;         // frames before respawn
const TRAIL = 14;            // trail points kept per particle

// Hue tokens cycled by arrow magnitude bucket.
const HUES = ['var(--hue-sky)', 'var(--hue-mint)', 'var(--hue-violet)', 'var(--hue-pink)'];

function rk4Step(f, x, y, dt) {
  const [k1x, k1y] = f(x, y);
  const [k2x, k2y] = f(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
  const [k3x, k3y] = f(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
  const [k4x, k4y] = f(x + dt * k3x, y + dt * k3y);
  return [
    x + (dt * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6,
    y + (dt * (k1y + 2 * k2y + 2 * k3y + k4y)) / 6,
  ];
}

// Deterministic seeded spawn points inside the window.
function makeOrigins() {
  const rnd = mulberry32(0x5eed1234);
  const out = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    out.push([
      X_MIN + 0.6 + rnd() * (X_MAX - X_MIN - 1.2),
      Y_MIN + 0.6 + rnd() * (Y_MAX - Y_MIN - 1.2),
    ]);
  }
  return out;
}

const ORIGINS = makeOrigins();

function makeParticles() {
  return ORIGINS.map(([x, y], i) => ({
    x, y, ox: x, oy: y,
    age: Math.floor((i / PARTICLE_COUNT) * MAX_AGE),  // staggered, deterministic
    trail: [[x, y]],
  }));
}

export default function CalcVectorFieldViz() {
  const [presetKey, setPresetKey] = useState('rotation');
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [particles, setParticles] = useState(() => makeParticles());
  const [reduced, setReduced] = useState(false);

  const preset = useMemo(() => PRESETS.find((p) => p.key === presetKey), [presetKey]);

  const rafRef = useRef(null);
  const lastRef = useRef(0);

  const W = 760;
  const H = 460;
  const pad = 14;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sx = useCallback((v) => pad + ((v - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((v) => pad + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  // detect reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const selectPreset = useCallback((key) => {
    setPresetKey(key);
    setParticles(makeParticles());   // reseed so the new field starts clean
    lastRef.current = 0;
  }, []);

  // animation loop
  useEffect(() => {
    if (reduced || !playing) return undefined;
    const f = preset.f;

    const advance = (now) => {
      const prev = lastRef.current || now;
      let dt = (now - prev) / 1000;
      lastRef.current = now;
      if (dt > 0.05) dt = 0.05;                      // clamp big gaps
      const step = dt * 1.4 * speed;

      setParticles((prevParts) => prevParts.map((p) => {
        const [nx, ny] = rk4Step(f, p.x, p.y, step);
        const out = nx < X_MIN || nx > X_MAX || ny < Y_MIN || ny > Y_MAX;
        if (out || p.age + 1 > MAX_AGE) {
          return { ...p, x: p.ox, y: p.oy, age: 0, trail: [[p.ox, p.oy]] };
        }
        const trail = p.trail.length >= TRAIL ? p.trail.slice(1) : p.trail.slice();
        trail.push([nx, ny]);
        return { ...p, x: nx, y: ny, age: p.age + 1, trail };
      }));
      rafRef.current = requestAnimationFrame(advance);
    };

    lastRef.current = 0;
    rafRef.current = requestAnimationFrame(advance);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, reduced, preset, speed]);

  // arrow grid (recomputed when preset changes)
  const arrows = useMemo(() => {
    const f = preset.f;
    const cells = [];
    let maxMag = 1e-6;
    for (let i = 0; i < GRID_N; i++) {
      for (let j = 0; j < GRID_N; j++) {
        const x = X_MIN + ((i + 0.5) / GRID_N) * (X_MAX - X_MIN);
        const y = Y_MIN + ((j + 0.5) / GRID_N) * (Y_MAX - Y_MIN);
        const [fx, fy] = f(x, y);
        const mag = Math.hypot(fx, fy);
        if (mag > maxMag) maxMag = mag;
        cells.push({ x, y, fx, fy, mag });
      }
    }
    const cell = plotW / GRID_N;
    const L = cell * 0.42;                  // fixed display half-length
    return cells.map((c) => {
      const inv = c.mag > 1e-9 ? 1 / c.mag : 0;
      const ux = c.fx * inv;
      const uy = c.fy * inv;
      const scale = (0.35 + 0.65 * (c.mag / maxMag)) * L;  // normalized + slight mag cue
      const cx = sx(c.x);
      const cy = sy(c.y);
      // y axis flips in screen space
      const ex = cx + ux * scale;
      const ey = cy - uy * scale;
      const sxp = cx - ux * scale;
      const syp = cy + uy * scale;
      const bucket = Math.min(HUES.length - 1, Math.floor((c.mag / maxMag) * HUES.length));
      return { x1: sxp, y1: syp, x2: ex, y2: ey, hue: HUES[bucket] };
    });
  }, [preset, plotW, sx, sy]);

  // static streamlines (used only in reduced-motion fallback)
  const staticStreams = useMemo(() => {
    if (!reduced) return [];
    const f = preset.f;
    return ORIGINS.map(([ox, oy]) => {
      let x = ox; let y = oy;
      const pts = [[x, y]];
      for (let s = 0; s < 90; s++) {
        [x, y] = rk4Step(f, x, y, 0.05);
        if (x < X_MIN || x > X_MAX || y < Y_MIN || y > Y_MAX) break;
        pts.push([x, y]);
      }
      return pts.map(([px, py], k) => `${k === 0 ? 'M' : 'L'} ${sx(px).toFixed(1)} ${sy(py).toFixed(1)}`).join(' ');
    });
  }, [reduced, preset, sx, sy]);

  const reset = () => {
    setPresetKey('rotation');
    setSpeed(1.0);
    setPlaying(true);
    setParticles(makeParticles());
    lastRef.current = 0;
  };

  return (
    <div className="cvf">
      <div className="cvf-head">
        <div className="cvf-head-icon"><Wind size={18} /></div>
        <div className="cvf-head-text">
          <h3 className="cvf-title">Particles flowing along a vector field</h3>
          <p className="cvf-sub">
            Each arrow is the field <span dangerouslySetInnerHTML={{ __html: km('\\mathbf{F}(x,y)') }} /> at that point;
            color encodes magnitude. The dots are particles released into the flow — each traces a streamline,
            solving <span dangerouslySetInnerHTML={{ __html: km('d\\mathbf{r}/dt=\\mathbf{F}') }} /> by RK4.
          </p>
        </div>
        <div className="cvf-head-btns">
          <button type="button" className="cvf-iconbtn" onClick={() => setPlaying((p) => !p)} disabled={reduced}>
            {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" className="cvf-iconbtn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="cvf-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cvf-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cvf-arrow" markerWidth="7" markerHeight="7" refX="5.4" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L6,3 L0,6 Z" fill="context-stroke" />
            </marker>
            <radialGradient id="cvf-dot-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.25)" />
            </radialGradient>
            <filter id="cvf-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={pad} y={pad} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={10} />

          {/* axes through the origin */}
          <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} stroke="var(--border)" strokeWidth={1} />
          <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} stroke="var(--border)" strokeWidth={1} />

          {/* arrow grid */}
          {arrows.map((a, i) => (
            <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
              stroke={a.hue} strokeWidth={1.6} strokeLinecap="round"
              markerEnd="url(#cvf-arrow)" opacity={0.85} />
          ))}

          {/* reduced-motion: static streamlines */}
          {reduced && staticStreams.map((d, i) => (
            <path key={`s${i}`} d={d} fill="none" stroke="var(--accent)" strokeWidth={2.2} opacity={0.9} filter="url(#cvf-glow)" />
          ))}

          {/* moving particles + trails */}
          {!reduced && particles.map((p, i) => {
            const trailPath = p.trail
              .map(([px, py], k) => `${k === 0 ? 'M' : 'L'} ${sx(px).toFixed(1)} ${sy(py).toFixed(1)}`)
              .join(' ');
            return (
              <g key={`p${i}`}>
                <path d={trailPath} fill="none" stroke="var(--accent)" strokeWidth={2.2}
                  strokeLinecap="round" opacity={0.45} />
                <circle cx={sx(p.x)} cy={sy(p.y)} r={4.6} fill="url(#cvf-dot-grad)"
                  stroke="var(--bg)" strokeWidth={1.4} filter="url(#cvf-glow)" />
              </g>
            );
          })}

          {reduced && (
            <text x={W / 2} y={pad + 18} className="cvf-axis-lbl" textAnchor="middle">
              reduced motion — streamlines drawn statically
            </text>
          )}
        </svg>
      </div>

      <div className="cvf-controls">
        <label className="cvf-slider">
          <span><Gauge size={13} /> flow speed</span>
          <input type="range" min={0.2} max={2.5} step={0.1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} disabled={reduced} />
          <span className="cvf-slider-val">{speed.toFixed(1)}x</span>
        </label>
        <div className="cvf-seg">
          {PRESETS.map((p) => (
            <button key={p.key} type="button"
              className={`cvf-seg-btn ${presetKey === p.key ? 'cvf-seg-on' : ''}`}
              onClick={() => selectPreset(p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="cvf-field-eq">
        <span dangerouslySetInnerHTML={{ __html: km(preset.tex, true) }} />
      </div>

      <div className="cvf-stats">
        <div className="cvf-statcard cvf-accent">
          <span className="cvf-stat-label">field</span>
          <span className="cvf-stat-val">{preset.label}</span>
        </div>
        <div className="cvf-statcard cvf-sky">
          <span className="cvf-stat-label">particles</span>
          <span className="cvf-stat-val">{PARTICLE_COUNT} flowing</span>
        </div>
        <div className="cvf-statcard cvf-violet">
          <span className="cvf-stat-label">divergence</span>
          <span className="cvf-stat-val">{preset.div}</span>
        </div>
        <div className="cvf-statcard cvf-pink">
          <span className="cvf-stat-label">curl</span>
          <span className="cvf-stat-val">{preset.curl}</span>
        </div>
      </div>

      <div className="cvf-trace">
        <span className="cvf-trace-label">reading</span>
        <span className="cvf-trace-body">
          {reduced
            ? `Motion is paused for reduced-motion. The ${preset.label.toLowerCase()} field's arrows show direction and magnitude (color); the bright curves are streamlines a particle would follow.`
            : `The ${preset.label.toLowerCase()} field pushes each dot along the arrow under it. Watch a dot trace its streamline; when it leaves the frame it respawns at its seeded origin. Divergence reads net outflow, curl reads local spin.`}
        </span>
      </div>
    </div>
  );
}
