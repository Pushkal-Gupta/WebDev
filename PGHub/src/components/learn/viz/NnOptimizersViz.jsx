import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Play, Pause, Activity, Flag } from 'lucide-react';
import './NnOptimizersViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// Ill-conditioned bowl: L(x, y) = 0.06*x^2 + 0.9*y^2 (a ravine — steep in y, shallow in x).
const A = 0.06;
const B = 0.9;
const lossAt = (x, y) => A * x * x + B * y * y;
const gradAt = (x, y) => [2 * A * x, 2 * B * y];
const START = [8.4, 5.2];

const VB_W = 360;
const VB_H = 250;
const PAD = 16;
const X_LO = -9.5;
const X_HI = 9.5;
const Y_LO = -6.5;
const Y_HI = 6.5;
const plotW = VB_W - 2 * PAD;
const plotH = VB_H - 2 * PAD;
const sx = (x) => PAD + ((x - X_LO) / (X_HI - X_LO)) * plotW;
const sy = (y) => PAD + (1 - (y - Y_LO) / (Y_HI - Y_LO)) * plotH;

// Concentric ellipse contour levels for L = const.
const CONTOURS = [0.6, 2.2, 5.5, 11, 20, 32];

const OPTS = [
  { key: 'sgd', label: 'SGD', color: 'var(--hue-sky)', lr: 0.55 },
  { key: 'momentum', label: 'Momentum', color: 'var(--hue-violet)', lr: 0.45 },
  { key: 'adam', label: 'Adam', color: 'var(--hue-mint)', lr: 0.55 },
];

function makeRunner(key, lr) {
  let m = [0, 0];
  let v = [0, 0];
  let t = 0;
  return (pos) => {
    const [gx, gy] = gradAt(pos[0], pos[1]);
    t += 1;
    if (key === 'sgd') {
      return [pos[0] - lr * gx, pos[1] - lr * gy];
    }
    if (key === 'momentum') {
      m = [0.85 * m[0] + gx, 0.85 * m[1] + gy];
      return [pos[0] - lr * 0.32 * m[0], pos[1] - lr * 0.32 * m[1]];
    }
    // adam
    m = [0.9 * m[0] + 0.1 * gx, 0.9 * m[1] + 0.1 * gy];
    v = [0.999 * v[0] + 0.001 * gx * gx, 0.999 * v[1] + 0.001 * gy * gy];
    const mh = [m[0] / (1 - 0.9 ** t), m[1] / (1 - 0.9 ** t)];
    const vh = [v[0] / (1 - 0.999 ** t), v[1] / (1 - 0.999 ** t)];
    return [
      pos[0] - lr * 1.6 * mh[0] / (Math.sqrt(vh[0]) + 1e-8),
      pos[1] - lr * 1.6 * mh[1] / (Math.sqrt(vh[1]) + 1e-8),
    ];
  };
}

const MAX_STEPS = 140;

export default function NnOptimizersViz() {
  const [enabled, setEnabled] = useState({ sgd: true, momentum: true, adam: true });
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState(0);
  const [tracks, setTracks] = useState(null);
  const raf = useRef(null);
  const last = useRef(0);

  const reduced = useMemo(
    () => typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Precompute every trajectory once (deterministic, no Math.random).
  const allTracks = useMemo(() => {
    const out = {};
    for (const o of OPTS) {
      const runner = makeRunner(o.key, o.lr);
      const path = [START.slice()];
      let pos = START.slice();
      for (let i = 0; i < MAX_STEPS; i++) {
        pos = runner(pos);
        path.push(pos.slice());
      }
      out[o.key] = path;
    }
    return out;
  }, []);

  useEffect(() => { setTracks(allTracks); }, [allTracks]);

  const reset = () => { setStep(0); setPlaying(true); };

  useEffect(() => {
    if (!playing) return undefined;
    if (step >= MAX_STEPS) { setPlaying(false); return undefined; }
    const interval = reduced ? 90 : 42;
    const tick = (ts) => {
      if (ts - last.current >= interval) {
        last.current = ts;
        setStep((s) => Math.min(MAX_STEPS, s + 1));
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, step, reduced]);

  const toggle = (key) => setEnabled((e) => ({ ...e, [key]: !e[key] }));

  if (!tracks) return <div className="nopt" />;

  const contourEllipse = (level) => {
    const rx = Math.sqrt(level / A);
    const ry = Math.sqrt(level / B);
    return { cx: sx(0), cy: sy(0), rx: (rx / (X_HI - X_LO)) * plotW, ry: (ry / (Y_HI - Y_LO)) * plotH };
  };

  return (
    <div className="nopt">
      <div className="nopt-head">
        <div className="nopt-head-icon"><Activity size={18} /></div>
        <div className="nopt-head-text">
          <h3 className="nopt-title">Three optimizers race down the same ravine</h3>
          <p className="nopt-sub">
            All start at the same point on an ill-conditioned bowl
            <span dangerouslySetInnerHTML={{ __html: km('\\;L(x,y)=0.06x^2+0.9y^2') }} />.
            SGD zig-zags across the steep walls; momentum and Adam run down the floor.
          </p>
        </div>
        <button type="button" className="nopt-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nopt-controls">
        <button type="button" className="nopt-btn nopt-btn-primary"
          onClick={() => (step >= MAX_STEPS ? reset() : setPlaying((p) => !p))}>
          {playing ? <><Pause size={13} /> Pause</> : <><Play size={13} /> {step >= MAX_STEPS ? 'Replay' : 'Play'}</>}
        </button>
        {OPTS.map((o) => (
          <button key={o.key} type="button"
            className={`nopt-chip ${enabled[o.key] ? 'is-on' : ''}`}
            style={enabled[o.key]
              ? { borderColor: o.color, color: o.color, background: `color-mix(in srgb, ${o.color} 12%, var(--surface))` }
              : undefined}
            onClick={() => toggle(o.key)}>
            <span className="nopt-chip-dot" style={{ background: o.color }} />
            {o.label}
          </button>
        ))}
      </div>

      <div className="nopt-body">
        <div className="nopt-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nopt-svg" preserveAspectRatio="xMidYMid meet">
            <rect x={PAD} y={PAD} width={plotW} height={plotH} rx={10} className="nopt-plot" />
            {CONTOURS.map((lv, i) => {
              const e = contourEllipse(lv);
              return <ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                className="nopt-contour" style={{ opacity: 0.55 - i * 0.06 }} />;
            })}
            {/* minimum marker */}
            <g className="nopt-min">
              <circle cx={sx(0)} cy={sy(0)} r={3.4} />
              <Flag x={sx(0) - 5} y={sy(0) - 16} width={10} height={10} />
            </g>

            {OPTS.filter((o) => enabled[o.key]).map((o) => {
              const path = tracks[o.key];
              const upto = Math.min(step, path.length - 1);
              let d = '';
              for (let i = 0; i <= upto; i++) {
                const p = path[i];
                d += `${i === 0 ? 'M' : 'L'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)} `;
              }
              const head = path[upto];
              return (
                <g key={o.key}>
                  <path d={d.trim()} className="nopt-trail" style={{ stroke: o.color }} />
                  <circle cx={sx(head[0])} cy={sy(head[1])} r={5} className="nopt-ball"
                    style={{ fill: o.color }} />
                </g>
              );
            })}

            <text x={sx(0)} y={VB_H - 4} className="nopt-axlab" textAnchor="middle">x (shallow)</text>
            <text x={PAD + 8} y={PAD + 11} className="nopt-axlab">y (steep)</text>
          </svg>
        </div>

        <div className="nopt-side">
          <div className="nopt-stat-step">
            <span className="nopt-stat-lab">step</span>
            <span className="nopt-stat-val">{step} <span className="nopt-stat-max">/ {MAX_STEPS}</span></span>
          </div>
          <div className="nopt-readouts">
            {OPTS.map((o) => {
              const path = tracks[o.key];
              const upto = Math.min(step, path.length - 1);
              const p = path[upto];
              const l = lossAt(p[0], p[1]);
              const dim = !enabled[o.key];
              return (
                <div key={o.key} className={`nopt-stat ${dim ? 'is-dim' : ''}`}
                  style={{ borderTopColor: dim ? 'var(--border)' : o.color }}>
                  <span className="nopt-stat-name" style={{ color: dim ? 'var(--text-dim)' : o.color }}>
                    <span className="nopt-chip-dot" style={{ background: dim ? 'var(--border)' : o.color }} />
                    {o.label}
                  </span>
                  <span className="nopt-stat-loss">loss {l < 0.001 ? l.toExponential(1) : l.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          <label className="nopt-slider">
            <span className="nopt-slider-lab">
              <span>scrub timeline</span>
              <span className="nopt-slider-val">{step}</span>
            </span>
            <input type="range" min={0} max={MAX_STEPS} step={1} value={step}
              onChange={(e) => { setPlaying(false); setStep(parseInt(e.target.value, 10)); }} />
          </label>

          <div className="nopt-note">
            SGD wastes most of its motion bouncing across the steep y-walls. Momentum cancels those
            side-bounces into forward speed; Adam rescales each axis so the shallow x-direction stops lagging.
          </div>
        </div>
      </div>
    </div>
  );
}
