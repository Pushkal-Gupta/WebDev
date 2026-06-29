import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import katex from 'katex';
import { Play, Pause, RotateCcw, Spline } from 'lucide-react';
import './CalcParametricViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Each preset: deterministic x(t), y(t) over t in [0, period], plus latex labels.
const PRESETS = {
  circle: {
    label: 'Circle',
    period: 2 * Math.PI,
    x: (t) => Math.cos(t),
    y: (t) => Math.sin(t),
    dx: (t) => -Math.sin(t),
    dy: (t) => Math.cos(t),
    range: 1.15,
    xTex: 'x(t) = \\cos t',
    yTex: 'y(t) = \\sin t',
  },
  lissajous: {
    label: 'Lissajous',
    period: 2 * Math.PI,
    x: (t) => Math.sin(3 * t),
    y: (t) => Math.sin(2 * t),
    dx: (t) => 3 * Math.cos(3 * t),
    dy: (t) => 2 * Math.cos(2 * t),
    range: 1.15,
    xTex: 'x(t) = \\sin 3t',
    yTex: 'y(t) = \\sin 2t',
  },
  spiral: {
    label: 'Spiral',
    period: 6 * Math.PI,
    x: (t) => (t / (6 * Math.PI)) * Math.cos(t),
    y: (t) => (t / (6 * Math.PI)) * Math.sin(t),
    dx: (t) => (Math.cos(t) - t * Math.sin(t)) / (6 * Math.PI),
    dy: (t) => (Math.sin(t) + t * Math.cos(t)) / (6 * Math.PI),
    range: 1.05,
    xTex: 'x(t) = \\tfrac{t}{6\\pi}\\cos t',
    yTex: 'y(t) = \\tfrac{t}{6\\pi}\\sin t',
  },
  rose: {
    label: 'Rose',
    period: 2 * Math.PI,
    x: (t) => Math.cos(4 * t) * Math.cos(t),
    y: (t) => Math.cos(4 * t) * Math.sin(t),
    dx: (t) => -4 * Math.sin(4 * t) * Math.cos(t) - Math.cos(4 * t) * Math.sin(t),
    dy: (t) => -4 * Math.sin(4 * t) * Math.sin(t) + Math.cos(4 * t) * Math.cos(t),
    range: 1.15,
    xTex: 'x(t) = \\cos 4t\\,\\cos t',
    yTex: 'y(t) = \\cos 4t\\,\\sin t',
  },
};

const PRESET_KEYS = Object.keys(PRESETS);
const SPEED = 0.55; // radians of parameter per second of wall time

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function CalcParametricViz() {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const [presetKey, setPresetKey] = useState('lissajous');
  const [tNorm, setTNorm] = useState(reduced ? 0.72 : 0); // fraction of period, 0..1
  const [playing, setPlaying] = useState(!reduced);

  const rafRef = useRef(null);
  const lastRef = useRef(null);

  const preset = PRESETS[presetKey];
  const period = preset.period;
  const t = tNorm * period;

  const W = 760;
  const H = 440;
  const padL = 28;
  const padR = 28;
  const padT = 22;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const R = preset.range;

  const sx = useCallback((v) => padL + ((v + R) / (2 * R)) * plotW, [plotW, R]);
  const sy = useCallback((v) => padT + (1 - (v + R) / (2 * R)) * plotH, [plotH, R]);

  // Animation loop. Disabled entirely under prefers-reduced-motion.
  useEffect(() => {
    if (reduced || !playing) {
      lastRef.current = null;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return undefined;
    }
    const step = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = (ts - lastRef.current) / 1000;
      lastRef.current = ts;
      setTNorm((prev) => {
        const next = prev + (SPEED * dt) / (period / (2 * Math.PI));
        return next >= 1 ? next - 1 : next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [reduced, playing, period]);

  // Full curve path (faint guide) sampled across the whole period.
  const fullPath = useMemo(() => {
    const pts = [];
    const steps = 480;
    for (let i = 0; i <= steps; i++) {
      const tv = (i / steps) * period;
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(preset.x(tv)).toFixed(2)} ${sy(preset.y(tv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [preset, period, sx, sy]);

  // Drawn-so-far path up to the current t (the progressive trace).
  const tracePath = useMemo(() => {
    const drawTo = reduced ? 1 : tNorm;
    const steps = Math.max(2, Math.round(480 * drawTo));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const tv = (i / steps) * drawTo * period;
      pts.push(`${i === 0 ? 'M' : 'L'} ${sx(preset.x(tv)).toFixed(2)} ${sy(preset.y(tv)).toFixed(2)}`);
    }
    return pts.join(' ');
  }, [preset, period, sx, sy, tNorm, reduced]);

  const px = preset.x(t);
  const py = preset.y(t);
  const vx = preset.dx(t);
  const vy = preset.dy(t);
  const speed = Math.hypot(vx, vy);

  // Tangent (velocity) arrow scaled to a readable length in plot units.
  const tan = useMemo(() => {
    const norm = speed < 1e-6 ? 1 : speed;
    const len = 0.32 * R; // data units
    const ux = (vx / norm) * len;
    const uy = (vy / norm) * len;
    return { x1: sx(px), y1: sy(py), x2: sx(px + ux), y2: sy(py + uy) };
  }, [px, py, vx, vy, speed, sx, sy, R]);

  const onScrub = (e) => {
    setPlaying(false);
    setTNorm(Number(e.target.value));
  };

  const reset = () => {
    setPresetKey('lissajous');
    setTNorm(reduced ? 0.72 : 0);
    setPlaying(!reduced);
    lastRef.current = null;
  };

  const choosePreset = (k) => {
    setPresetKey(k);
    setTNorm(reduced ? 0.72 : 0);
    lastRef.current = null;
  };

  return (
    <div className="cpc">
      <div className="cpc-head">
        <div className="cpc-head-icon"><Spline size={18} /></div>
        <div className="cpc-head-text">
          <h3 className="cpc-title">A point traces the path as t advances</h3>
          <p className="cpc-sub">
            Both coordinates follow their own clock,
            <span dangerouslySetInnerHTML={{ __html: km('\\big(x(t),\\,y(t)\\big)') }} />. The trail draws on behind
            the glowing point; the arrow is the velocity <span dangerouslySetInnerHTML={{ __html: km('(x\'(t),y\'(t))') }} />,
            tangent to the curve.
          </p>
        </div>
        <button type="button" className="cpc-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="cpc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cpc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="cpc-trace-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--hue-sky)" />
              <stop offset="50%" stopColor="var(--hue-violet)" />
              <stop offset="100%" stopColor="var(--hue-pink)" />
            </linearGradient>
            <filter id="cpc-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cpc-dot-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x={padL} y={padT} width={plotW} height={plotH} fill="var(--surface)" stroke="var(--border)" rx={10} />

          {/* axes through the origin */}
          <line x1={sx(-R)} y1={sy(0)} x2={sx(R)} y2={sy(0)} stroke="var(--border)" strokeWidth={1} />
          <line x1={sx(0)} y1={sy(-R)} x2={sx(0)} y2={sy(R)} stroke="var(--border)" strokeWidth={1} />

          {/* faint full curve as a guide */}
          <path d={fullPath} fill="none" stroke="var(--text-dim)" strokeWidth={1} strokeOpacity={0.32} strokeDasharray="3 4" />

          {/* progressive trace */}
          <path d={tracePath} fill="none" stroke="url(#cpc-trace-grad)" strokeWidth={3} strokeLinecap="round"
            strokeLinejoin="round" filter="url(#cpc-glow)" />

          {/* velocity / tangent arrow */}
          <line x1={tan.x1} y1={tan.y1} x2={tan.x2} y2={tan.y2} stroke="var(--easy)" strokeWidth={2.4} />
          <circle cx={tan.x2} cy={tan.y2} r={3.2} fill="var(--easy)" />

          {/* glowing leading point */}
          <circle cx={sx(px)} cy={sy(py)} r={13} fill="rgba(var(--accent-rgb), 0.16)" />
          <circle cx={sx(px)} cy={sy(py)} r={6} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2}
            filter="url(#cpc-dot-glow)" />
        </svg>
      </div>

      <div className="cpc-controls">
        <button type="button" className="cpc-play" onClick={() => setPlaying((p) => !p)} disabled={reduced}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <label className="cpc-slider">
          <span>t</span>
          <input type="range" min={0} max={1} step={0.001} value={tNorm} onChange={onScrub} />
          <span className="cpc-slider-val">{t.toFixed(2)}</span>
        </label>
        <div className="cpc-seg">
          {PRESET_KEYS.map((k) => (
            <button key={k} type="button" className={`cpc-seg-btn ${presetKey === k ? 'cpc-seg-on' : ''}`}
              onClick={() => choosePreset(k)}>
              {PRESETS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div className="cpc-stats">
        <div className="cpc-statcard cpc-accent">
          <span className="cpc-stat-label">parameter</span>
          <span className="cpc-stat-val" dangerouslySetInnerHTML={{ __html: km(`t = ${t.toFixed(3)}`) }} />
        </div>
        <div className="cpc-statcard cpc-sky">
          <span className="cpc-stat-label">x of t</span>
          <span className="cpc-stat-val" dangerouslySetInnerHTML={{ __html: km(`x = ${px >= 0 ? '+' : ''}${px.toFixed(3)}`) }} />
        </div>
        <div className="cpc-statcard cpc-pink">
          <span className="cpc-stat-label">y of t</span>
          <span className="cpc-stat-val" dangerouslySetInnerHTML={{ __html: km(`y = ${py >= 0 ? '+' : ''}${py.toFixed(3)}`) }} />
        </div>
        <div className="cpc-statcard cpc-green">
          <span className="cpc-stat-label">speed</span>
          <span className="cpc-stat-val" dangerouslySetInnerHTML={{ __html: km(`|v| = ${speed.toFixed(3)}`) }} />
        </div>
      </div>

      <div className="cpc-trace">
        <span className="cpc-trace-label">curve</span>
        <span className="cpc-trace-body">
          <span dangerouslySetInnerHTML={{ __html: km(preset.xTex) }} />
          <span className="cpc-trace-sep">,</span>
          <span dangerouslySetInnerHTML={{ __html: km(preset.yTex) }} />
          <span className="cpc-trace-note">
            {`  —  the velocity (green arrow) always points along the path; its length is the speed |v| = ${speed.toFixed(3)}.`}
          </span>
        </span>
      </div>
    </div>
  );
}
