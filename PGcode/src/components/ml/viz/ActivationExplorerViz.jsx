import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Activity, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 340;
const LEFT = 46;
const RIGHT = 18;
const TOP = 22;
const BOT = 34;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

const X_MIN = -6;
const X_MAX = 6;
const SAMPLES = 160;

// ---- activation functions + analytic derivatives (deterministic) ----
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}
function dSigmoid(x) {
  const s = sigmoid(x);
  return s * (1 - s);
}
function dTanh(x) {
  const t = Math.tanh(x);
  return 1 - t * t;
}
// GELU (tanh approximation, Hendrycks & Gimpel) and its derivative.
const GELU_C = Math.sqrt(2 / Math.PI);
function gelu(x) {
  const inner = GELU_C * (x + 0.044715 * x * x * x);
  return 0.5 * x * (1 + Math.tanh(inner));
}
function dGelu(x) {
  const inner = GELU_C * (x + 0.044715 * x * x * x);
  const t = Math.tanh(inner);
  const sech2 = 1 - t * t;
  const dInner = GELU_C * (1 + 3 * 0.044715 * x * x);
  return 0.5 * (1 + t) + 0.5 * x * sech2 * dInner;
}
const LEAK = 0.1;

const FUNCS = {
  sigmoid: {
    label: 'Sigmoid',
    f: sigmoid,
    df: dSigmoid,
    yMin: -0.15,
    yMax: 1.15,
    expr: 'σ(x) = 1 / (1 + e⁻ˣ)',
  },
  tanh: {
    label: 'Tanh',
    f: (x) => Math.tanh(x),
    df: dTanh,
    yMin: -1.25,
    yMax: 1.25,
    expr: 'tanh(x)',
  },
  relu: {
    label: 'ReLU',
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    yMin: -0.6,
    yMax: 6,
    expr: 'max(0, x)',
  },
  leaky: {
    label: 'Leaky ReLU',
    f: (x) => (x >= 0 ? x : LEAK * x),
    df: (x) => (x >= 0 ? 1 : LEAK),
    yMin: -1.2,
    yMax: 6,
    expr: 'max(0.1·x, x)',
  },
  gelu: {
    label: 'GELU',
    f: gelu,
    df: dGelu,
    yMin: -0.6,
    yMax: 6,
    expr: 'x · Φ(x)',
  },
};
const ORDER = ['sigmoid', 'tanh', 'relu', 'leaky', 'gelu'];

const DEFAULT_KEY = 'gelu';
const DEFAULT_X = 1;
const SAT_THRESHOLD = 0.05;

function fmt(v, p = 4) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

export default function ActivationExplorerViz({ fn = DEFAULT_KEY }) {
  const initKey = FUNCS[fn] ? fn : DEFAULT_KEY;
  const [key, setKey] = useState(initKey);
  const [px, setPx] = useState(DEFAULT_X);
  const svgRef = useRef(null);
  const dragRef = useRef(false);

  const spec = FUNCS[key];

  // scales
  const sx = useCallback(
    (x) => LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W,
    []
  );
  const sy = useCallback(
    (y) => TOP + (1 - (y - spec.yMin) / (spec.yMax - spec.yMin)) * PLOT_H,
    [spec.yMin, spec.yMax]
  );

  // sampled paths for f(x) and f'(x)
  const { fPath, dPath, satBands } = useMemo(() => {
    const fpts = [];
    const dpts = [];
    const sat = [];
    let runStart = null;
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      const fy = spec.f(x);
      const dy = spec.df(x);
      fpts.push(`${sx(x).toFixed(2)},${sy(fy).toFixed(2)}`);
      // clamp derivative into plot band for drawing
      const dyc = Math.max(spec.yMin, Math.min(spec.yMax, dy));
      dpts.push(`${sx(x).toFixed(2)},${sy(dyc).toFixed(2)}`);
      // saturation: |f'(x)| near zero
      const isSat = Math.abs(dy) < SAT_THRESHOLD;
      if (isSat && runStart === null) runStart = x;
      if (!isSat && runStart !== null) {
        sat.push([runStart, x]);
        runStart = null;
      }
    }
    if (runStart !== null) sat.push([runStart, X_MAX]);
    return {
      fPath: 'M' + fpts.join(' L'),
      dPath: 'M' + dpts.join(' L'),
      satBands: sat,
    };
  }, [spec, sx, sy]);

  const fval = spec.f(px);
  const dval = spec.df(px);

  // point screen coords
  const pxScr = sx(px);
  const pyScr = sy(fval);

  // tangent: y = f(px) + f'(px)*(x - px); draw a short segment in x.
  const tanHalf = 1.4;
  const x1 = Math.max(X_MIN, px - tanHalf);
  const x2 = Math.min(X_MAX, px + tanHalf);
  const ty1 = fval + dval * (x1 - px);
  const ty2 = fval + dval * (x2 - px);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointTransition = reducedMotion ? 'none' : 'cx 0.06s linear, cy 0.06s linear';

  const updateFromClientX = useCallback((clientX) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    let xVal = X_MIN + ((svgX - LEFT) / PLOT_W) * (X_MAX - X_MIN);
    xVal = Math.max(X_MIN, Math.min(X_MAX, xVal));
    setPx(Math.round(xVal * 100) / 100);
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      dragRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const xTicks = [-6, -4, -2, 0, 2, 4, 6];
  const yZero = sy(0);
  const xZero = sx(0);

  const reset = useCallback(() => {
    setKey(initKey);
    setPx(DEFAULT_X);
  }, [initKey]);

  const gid = `aev-grad-${key}`;
  const glowId = `aev-glow-${key}`;

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Activity size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Activation explorer</span>
          <span className="aev-head-sub">
            drag the point — watch f(x) and the gradient f′(x) flatten at the tails
          </span>
        </span>
        <span className="aev-chip">x = {fmt(px, 2)}</span>
      </div>

      <div className="aev-toggles">
        {ORDER.map((k) => (
          <button
            key={k}
            type="button"
            className={`mlviz-toggle${k === key ? ' is-on' : ''}`}
            onClick={() => setKey(k)}
          >
            <span className="mlviz-toggle-dot" />
            {FUNCS[k].label}
          </button>
        ))}
      </div>

      <div className="aev-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-violet)" />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* saturation shading */}
            {satBands.map(([a, b], i) => (
              <rect
                key={`sat-${i}`}
                x={sx(a)}
                y={TOP}
                width={Math.max(0, sx(b) - sx(a))}
                height={PLOT_H}
                fill="var(--warning)"
                opacity="0.07"
              />
            ))}

            {/* grid + x ticks */}
            {xTicks.map((t) => (
              <g key={`xt-${t}`}>
                <line
                  x1={sx(t)}
                  y1={TOP}
                  x2={sx(t)}
                  y2={TOP + PLOT_H}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <text
                  x={sx(t)}
                  y={TOP + PLOT_H + 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* zero axes */}
            <line
              x1={LEFT}
              y1={yZero}
              x2={LEFT + PLOT_W}
              y2={yZero}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <line
              x1={xZero}
              y1={TOP}
              x2={xZero}
              y2={TOP + PLOT_H}
              stroke="var(--border)"
              strokeWidth="1"
            />

            {/* derivative curve (dashed, mint) */}
            <path
              d={dPath}
              fill="none"
              stroke="var(--hue-mint)"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              strokeLinecap="round"
              opacity="0.85"
            />

            {/* glow under f(x) */}
            <path
              d={fPath}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${glowId})`}
              opacity="0.55"
            />
            {/* f(x) main path */}
            <path
              d={fPath}
              fill="none"
              stroke={`url(#${gid})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* tangent line at the point */}
            <line
              x1={sx(x1)}
              y1={sy(ty1)}
              x2={sx(x2)}
              y2={sy(ty2)}
              stroke="var(--hue-mint)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.95"
            />
            <text
              x={sx(x2) + 4}
              y={sy(ty2)}
              fontSize="8.5"
              fill="var(--hue-mint)"
              fontFamily="var(--mono)"
              dominantBaseline="middle"
            >
              slope {fmt(dval, 2)}
            </text>

            {/* vertical guide from point to x-axis */}
            <line
              x1={pxScr}
              y1={pyScr}
              x2={pxScr}
              y2={yZero}
              stroke="var(--accent)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.6"
            />

            {/* draggable point: halo + ring + core */}
            <circle
              cx={pxScr}
              cy={pyScr}
              r="11"
              fill="rgba(var(--accent-rgb), 0.16)"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={pxScr}
              cy={pyScr}
              r="6.5"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.4"
              opacity="0.7"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={pxScr}
              cy={pyScr}
              r="4"
              fill="var(--accent)"
              style={{ transition: pointTransition, cursor: 'grab' }}
            />

            {/* y label */}
            <text
              x={LEFT - 8}
              y={TOP + 4}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {fmt(spec.yMax, 1)}
            </text>
            <text
              x={LEFT - 8}
              y={TOP + PLOT_H}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {fmt(spec.yMin, 1)}
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">input x</span>
            <span className="mlviz-statcard-val">{fmt(px)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">output f(x)</span>
            <span className="mlviz-statcard-val">{fmt(fval)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">gradient f′(x)</span>
            <span className="mlviz-statcard-val">{fmt(dval)}</span>
          </div>
          <div className="aev-expr">{spec.expr}</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">x</span>
          <input
            type="range"
            min={X_MIN}
            max={X_MAX}
            step="0.01"
            value={px}
            onChange={(e) => setPx(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(px, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          shaded tails = near-zero gradient · the vanishing-gradient regime where deep stacks stop learning
        </div>
      </div>
    </div>
  );
}
