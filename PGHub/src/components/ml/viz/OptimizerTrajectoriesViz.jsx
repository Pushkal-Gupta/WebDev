import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, RotateCcw, Play, Pause, Crosshair } from 'lucide-react';
import './MLViz.css';

/*
 * OptimizerTrajectoriesViz
 *
 * Five optimizer trajectories overlaid on a Rosenbrock-style "banana" loss
 * landscape:
 *   f(x, y) = (1 - x)^2 + 20 * (y - x^2)^2
 *
 * Minimum lives at (1, 1). The narrow curved valley pinches harder along
 * the y = x^2 ridge, exposing each optimizer's personality:
 *   - SGD:        rides the gradient bare → zigzags across the valley walls
 *   - Momentum:   accumulates velocity → smoother arc along the ridge
 *   - AdaGrad:    accumulates squared grads → steps shrink as it goes
 *   - RMSProp:    EMA of squared grads → adaptive but doesn't starve
 *   - Adam:       momentum + RMSProp + bias correction → fastest convergence
 *
 * Sliders: learning rate (1e-4..1e-1), start point selector (3 presets).
 * Readouts: per-optimizer current loss, steps-to-converge (loss < 0.05).
 */

const W = 720;
const H = 420;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 32;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = -2.0;
const X_MAX = 2.0;
const Y_MIN = -1.0;
const Y_MAX = 3.0;

const MAX_STEPS = 400;
const CONVERGE_THRESHOLD = 0.05;
const CONTOUR_LEVELS = [0.5, 2, 8, 24, 60, 140, 280, 520];

const STARTING_POINTS = [
  { key: 'topleft', label: 'top-left', x: -1.6, y: 2.4 },
  { key: 'left',    label: 'mid-left', x: -1.5, y: 0.4 },
  { key: 'bottom',  label: 'bottom',   x: -0.6, y: -0.6 },
];

const OPTIMIZERS = [
  { id: 'sgd',      label: 'SGD',           color: 'var(--hue-sky)' },
  { id: 'momentum', label: 'SGD+Momentum',  color: 'var(--hue-mint)' },
  { id: 'adagrad',  label: 'AdaGrad',       color: 'var(--warning)' },
  { id: 'rmsprop',  label: 'RMSProp',       color: 'var(--hue-violet)' },
  { id: 'adam',     label: 'Adam',          color: 'var(--accent)' },
];

const EPS = 1e-8;

function lossFn(x, y) {
  const a = 1 - x;
  const b = y - x * x;
  return a * a + 20 * b * b;
}

function gradFn(x, y) {
  const b = y - x * x;
  const gx = -2 * (1 - x) - 80 * x * b;
  const gy = 40 * b;
  return [gx, gy];
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function clipPoint(x, y) {
  return [clamp(x, X_MIN - 0.1, X_MAX + 0.1), clamp(y, Y_MIN - 0.1, Y_MAX + 0.1)];
}

function simulate(id, lr, start) {
  const beta1 = 0.9;
  const beta2 = 0.999;
  let x = start.x;
  let y = start.y;
  let mx = 0, my = 0;
  let vx = 0, vy = 0;
  const path = [[x, y]];
  let convergedAt = -1;

  for (let t = 1; t <= MAX_STEPS; t++) {
    const [gx, gy] = gradFn(x, y);
    let dx = 0, dy = 0;

    if (id === 'sgd') {
      dx = lr * gx;
      dy = lr * gy;
    } else if (id === 'momentum') {
      mx = beta1 * mx + gx;
      my = beta1 * my + gy;
      dx = lr * mx;
      dy = lr * my;
    } else if (id === 'adagrad') {
      vx += gx * gx;
      vy += gy * gy;
      dx = (lr / (Math.sqrt(vx) + EPS)) * gx;
      dy = (lr / (Math.sqrt(vy) + EPS)) * gy;
    } else if (id === 'rmsprop') {
      vx = beta2 * vx + (1 - beta2) * gx * gx;
      vy = beta2 * vy + (1 - beta2) * gy * gy;
      dx = (lr / (Math.sqrt(vx) + EPS)) * gx;
      dy = (lr / (Math.sqrt(vy) + EPS)) * gy;
    } else if (id === 'adam') {
      mx = beta1 * mx + (1 - beta1) * gx;
      my = beta1 * my + (1 - beta1) * gy;
      vx = beta2 * vx + (1 - beta2) * gx * gx;
      vy = beta2 * vy + (1 - beta2) * gy * gy;
      const mxh = mx / (1 - Math.pow(beta1, t));
      const myh = my / (1 - Math.pow(beta1, t));
      const vxh = vx / (1 - Math.pow(beta2, t));
      const vyh = vy / (1 - Math.pow(beta2, t));
      dx = (lr / (Math.sqrt(vxh) + EPS)) * mxh;
      dy = (lr / (Math.sqrt(vyh) + EPS)) * myh;
    }

    // diverging safety
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      path.push([x, y]);
      break;
    }

    x -= dx;
    y -= dy;
    [x, y] = clipPoint(x, y);
    path.push([x, y]);

    const loss = lossFn(x, y);
    if (convergedAt === -1 && loss < CONVERGE_THRESHOLD) convergedAt = t;
    if (convergedAt !== -1 && t > convergedAt + 8) break;
  }

  return { path, convergedAt };
}

function pathToSvg(path, upto) {
  if (path.length === 0) return '';
  const n = Math.min(path.length, upto + 1);
  let d = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = path[i];
    const px = xToPx(x);
    const py = yToPx(y);
    d += `${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)} `;
  }
  return d.trim();
}

// Build SVG marching-squares contour paths for the loss surface.
function buildContours() {
  const NX = 80;
  const NY = 60;
  const xs = new Array(NX + 1);
  const ys = new Array(NY + 1);
  for (let i = 0; i <= NX; i++) xs[i] = X_MIN + (i / NX) * (X_MAX - X_MIN);
  for (let j = 0; j <= NY; j++) ys[j] = Y_MIN + (j / NY) * (Y_MAX - Y_MIN);
  const Z = [];
  for (let j = 0; j <= NY; j++) {
    const row = new Array(NX + 1);
    for (let i = 0; i <= NX; i++) row[i] = lossFn(xs[i], ys[j]);
    Z.push(row);
  }

  function interp(a, b, va, vb, level) {
    const t = (level - va) / (vb - va);
    return a + t * (b - a);
  }

  const segs = CONTOUR_LEVELS.map(() => []);
  for (let j = 0; j < NY; j++) {
    for (let i = 0; i < NX; i++) {
      const z00 = Z[j][i],     z10 = Z[j][i + 1];
      const z01 = Z[j + 1][i], z11 = Z[j + 1][i + 1];
      const x0 = xs[i],   x1 = xs[i + 1];
      const y0 = ys[j],   y1 = ys[j + 1];
      for (let lvlIdx = 0; lvlIdx < CONTOUR_LEVELS.length; lvlIdx++) {
        const lvl = CONTOUR_LEVELS[lvlIdx];
        let code = 0;
        if (z00 > lvl) code |= 1;
        if (z10 > lvl) code |= 2;
        if (z11 > lvl) code |= 4;
        if (z01 > lvl) code |= 8;
        if (code === 0 || code === 15) continue;

        const eBottom = () => [interp(x0, x1, z00, z10, lvl), y0];
        const eRight  = () => [x1, interp(y0, y1, z10, z11, lvl)];
        const eTop    = () => [interp(x0, x1, z01, z11, lvl), y1];
        const eLeft   = () => [x0, interp(y0, y1, z00, z01, lvl)];

        const pushSeg = (p, q) => segs[lvlIdx].push([p, q]);

        switch (code) {
          case 1: case 14: pushSeg(eBottom(), eLeft()); break;
          case 2: case 13: pushSeg(eBottom(), eRight()); break;
          case 3: case 12: pushSeg(eLeft(), eRight()); break;
          case 4: case 11: pushSeg(eRight(), eTop()); break;
          case 6: case 9:  pushSeg(eBottom(), eTop()); break;
          case 7: case 8:  pushSeg(eLeft(), eTop()); break;
          case 5:          pushSeg(eBottom(), eLeft()); pushSeg(eRight(), eTop()); break;
          case 10:         pushSeg(eBottom(), eRight()); pushSeg(eLeft(), eTop()); break;
          default: break;
        }
      }
    }
  }

  return segs.map((lvlSegs) => {
    const parts = lvlSegs.map(([p, q]) => {
      const x1 = xToPx(p[0]).toFixed(1);
      const y1 = yToPx(p[1]).toFixed(1);
      const x2 = xToPx(q[0]).toFixed(1);
      const y2 = yToPx(q[1]).toFixed(1);
      return `M${x1},${y1}L${x2},${y2}`;
    });
    return parts.join(' ');
  });
}

function fmtLr(v) {
  if (v >= 0.01) return v.toFixed(3);
  if (v >= 0.001) return v.toFixed(4);
  return v.toExponential(1);
}

export default function OptimizerTrajectoriesViz() {
  const [logLr, setLogLr] = useState(-2); // 10^-2 = 0.01
  const [startKey, setStartKey] = useState('topleft');
  const [step, setStep] = useState(MAX_STEPS);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const lr = Math.pow(10, logLr);
  const start = useMemo(
    () => STARTING_POINTS.find((s) => s.key === startKey) || STARTING_POINTS[0],
    [startKey]
  );

  const runs = useMemo(() => {
    const out = {};
    for (const o of OPTIMIZERS) out[o.id] = simulate(o.id, lr, start);
    return out;
  }, [lr, start]);

  const contours = useMemo(() => buildContours(), []);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last;
      last = now;
      setStep((s) => {
        const next = s + Math.max(1, Math.round(dt / 12));
        if (next >= MAX_STEPS) {
          setPlaying(false);
          return MAX_STEPS;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reducedMotion]);

  const togglePlay = () => {
    if (step >= MAX_STEPS) setStep(0);
    setPlaying((p) => !p);
  };

  const resetAll = () => {
    setLogLr(-2);
    setStartKey('topleft');
    setStep(MAX_STEPS);
    setPlaying(false);
  };

  const xTicks = [-2, -1, 0, 1, 2];
  const yTicks = [-1, 0, 1, 2, 3];

  const contourOpacities = [0.55, 0.45, 0.38, 0.32, 0.26, 0.22, 0.18, 0.14];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="otv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" opacity="0.7" />
            </marker>
          </defs>

          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.65"
          />

          {/* axis ticks */}
          {xTicks.map((v) => (
            <g key={`xt${v}`}>
              <line
                x1={xToPx(v)}
                y1={PAD_T}
                x2={xToPx(v)}
                y2={H - PAD_B}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.2"
                strokeDasharray="3 4"
              />
              <text
                x={xToPx(v)}
                y={H - PAD_B + 14}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                {v}
              </text>
            </g>
          ))}
          {yTicks.map((v) => (
            <g key={`yt${v}`}>
              <line
                x1={PAD_L}
                y1={yToPx(v)}
                x2={W - PAD_R}
                y2={yToPx(v)}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.2"
                strokeDasharray="3 4"
              />
              <text
                x={PAD_L - 8}
                y={yToPx(v) + 3}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          ))}

          {/* contours */}
          {contours.map((d, i) => (
            <path
              key={`ct${i}`}
              d={d}
              fill="none"
              stroke="var(--text-dim)"
              strokeWidth={i === 0 ? 1.1 : 0.9}
              opacity={contourOpacities[i]}
            />
          ))}

          {/* minimum marker */}
          <g>
            <circle cx={xToPx(1)} cy={yToPx(1)} r="6" fill="none" stroke="var(--accent)" strokeWidth="1.4" opacity="0.85" />
            <circle cx={xToPx(1)} cy={yToPx(1)} r="2" fill="var(--accent)" />
            <text
              x={xToPx(1) + 9}
              y={yToPx(1) - 7}
              fontSize="9.5"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              letterSpacing="0.08em"
            >
              minimum (1, 1)
            </text>
          </g>

          {/* trajectories */}
          {OPTIMIZERS.map((o) => {
            const run = runs[o.id];
            const d = pathToSvg(run.path, step);
            const headIdx = Math.min(run.path.length - 1, step);
            const [hx, hy] = run.path[headIdx];
            return (
              <g key={o.id}>
                <path
                  d={d}
                  fill="none"
                  stroke={o.color}
                  strokeWidth="1.6"
                  strokeOpacity="0.9"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={xToPx(hx)}
                  cy={yToPx(hy)}
                  r="3.6"
                  fill={o.color}
                  stroke="var(--bg)"
                  strokeWidth="1.4"
                />
              </g>
            );
          })}

          {/* start point */}
          <g>
            <circle cx={xToPx(start.x)} cy={yToPx(start.y)} r="5" fill="none" stroke="var(--text-main)" strokeWidth="1.2" />
            <circle cx={xToPx(start.x)} cy={yToPx(start.y)} r="2" fill="var(--text-main)" />
            <text
              x={xToPx(start.x) + 9}
              y={yToPx(start.y) + 3}
              fontSize="9.5"
              fill="var(--text-main)"
              fontFamily="var(--mono)"
              letterSpacing="0.08em"
            >
              start
            </text>
          </g>

          {/* axis labels */}
          <text
            x={PAD_L + PLOT_W / 2}
            y={H - 4}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            x
          </text>
          <text
            x={14}
            y={PAD_T + PLOT_H / 2}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            transform={`rotate(-90 14 ${PAD_T + PLOT_H / 2})`}
            letterSpacing="0.1em"
          >
            y
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              learning rate
            </span>
            <input
              type="range"
              min="-4"
              max="-1"
              step="0.1"
              value={logLr}
              onChange={(e) => setLogLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">η = {fmtLr(lr)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem', letterSpacing: '0.08em' }}>
            <Crosshair size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            start point
          </span>
          {STARTING_POINTS.map((sp) => (
            <button
              key={sp.key}
              type="button"
              className={`mlviz-toggle ${startKey === sp.key ? 'is-on' : ''}`}
              style={{ '--toggle-color': 'var(--accent)' }}
              onClick={() => { setStartKey(sp.key); setStep(MAX_STEPS); }}
            >
              <span className="mlviz-toggle-dot" />
              <span>{sp.label}</span>
            </button>
          ))}
        </div>

        <div className="mlviz-row" style={{ gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          {OPTIMIZERS.map((o) => {
            const run = runs[o.id];
            const headIdx = Math.min(run.path.length - 1, step);
            const [hx, hy] = run.path[headIdx];
            const loss = lossFn(hx, hy);
            const conv = run.convergedAt > 0 && step >= run.convergedAt ? run.convergedAt : null;
            return (
              <span
                key={o.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '0.35rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: o.color,
                  transform: 'translateY(1px)',
                }} />
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-main)', fontSize: '0.74rem', fontWeight: 700 }}>
                  {o.label}
                </span>
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  loss {loss.toFixed(3)}
                </span>
                <span style={{ fontFamily: 'var(--mono)', color: conv ? 'var(--accent)' : 'var(--text-dim)', fontSize: '0.72rem' }}>
                  {conv ? `converged @${conv}` : '—'}
                </span>
              </span>
            );
          })}
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={togglePlay}>
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span>{playing ? 'Pause' : step >= MAX_STEPS ? 'Replay' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setPlaying(false); setStep(MAX_STEPS); }}>
            <span>Skip to end</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            step {Math.min(step, MAX_STEPS)} / {MAX_STEPS}
          </span>
        </div>

        <div className="mlviz-hint">
          Rosenbrock banana: minimum at (1, 1). Watch SGD ricochet across the valley walls while Adam threads the ridge. Crank η too high and everything diverges; drop too low and AdaGrad strangles itself early.
        </div>
      </div>
    </div>
  );
}
