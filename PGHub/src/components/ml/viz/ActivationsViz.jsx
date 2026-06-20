import React, { useRef, useState, useMemo, useCallback } from 'react';
import './MLViz.css';

const W = 380;
const H = 300;
const PAD_L = 36;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 26;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const X_MIN = -4;
const X_MAX = 4;
const Y_MIN = -2;
const Y_MAX = 4;

const SAMPLES = 240;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function xToScreen(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToScreen(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function screenToX(sx) {
  return X_MIN + ((sx - PAD_L) / PLOT_W) * (X_MAX - X_MIN);
}

const relu = (x) => (x > 0 ? x : 0);
const reluD = (x) => (x > 0 ? 1 : 0);

const lrelu = (x) => (x > 0 ? x : 0.1 * x);
const lreluD = (x) => (x > 0 ? 1 : 0.1);

const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const sigmoidD = (x) => {
  const s = sigmoid(x);
  return s * (1 - s);
};

const tanhFn = (x) => Math.tanh(x);
const tanhD = (x) => 1 - Math.tanh(x) ** 2;

// GELU exact: 0.5 x (1 + erf(x / sqrt(2)))
function erf(x) {
  // Abramowitz & Stegun approximation
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}
const gelu = (x) => 0.5 * x * (1 + erf(x / Math.SQRT2));
const geluD = (x) => {
  const phi = 0.5 * (1 + erf(x / Math.SQRT2));
  const pdf = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  return phi + x * pdf;
};

const swish = (x) => x * sigmoid(x);
const swishD = (x) => {
  const s = sigmoid(x);
  return s + x * s * (1 - s);
};

const ACTIVATIONS = [
  {
    key: 'relu',
    name: 'ReLU',
    formula: 'max(0, x)',
    color: 'var(--accent)',
    f: relu,
    df: reluD,
    slope0: '0 (left) / 1 (right)',
    asymptotes: 'y = 0 for x < 0  ·  y = x for x > 0',
  },
  {
    key: 'lrelu',
    name: 'Leaky ReLU',
    formula: 'x if x>0 else 0.1x',
    color: 'var(--hue-sky, #5ecbff)',
    f: lrelu,
    df: lreluD,
    slope0: '0.1 (left) / 1 (right)',
    asymptotes: 'y = 0.1x for x < 0  ·  y = x for x > 0',
  },
  {
    key: 'sigmoid',
    name: 'Sigmoid',
    formula: '1 / (1 + e^-x)',
    color: 'var(--hue-pink, #ff66cc)',
    f: sigmoid,
    df: sigmoidD,
    slope0: '0.25',
    asymptotes: 'y -> 0 as x -> -inf  ·  y -> 1 as x -> +inf',
  },
  {
    key: 'tanh',
    name: 'Tanh',
    formula: 'tanh(x)',
    color: 'var(--hue-mint, #8ee9c4)',
    f: tanhFn,
    df: tanhD,
    slope0: '1',
    asymptotes: 'y -> -1 as x -> -inf  ·  y -> 1 as x -> +inf',
  },
  {
    key: 'gelu',
    name: 'GELU',
    formula: '0.5 x (1 + erf(x/sqrt2))',
    color: 'var(--warning, #f5a623)',
    f: gelu,
    df: geluD,
    slope0: '0.5',
    asymptotes: 'y -> 0 as x -> -inf  ·  y ~ x as x -> +inf',
  },
  {
    key: 'swish',
    name: 'Swish (SiLU)',
    formula: 'x · sigmoid(x)',
    color: 'var(--easy, #2ecc71)',
    f: swish,
    df: swishD,
    slope0: '0.5',
    asymptotes: 'y -> 0 as x -> -inf  ·  y ~ x as x -> +inf',
  },
];

function buildPath(fn) {
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
    const y = fn(x);
    // Clip to plot range to avoid overflow lines
    const cy = Math.max(Y_MIN - 0.5, Math.min(Y_MAX + 0.5, y));
    const sx = xToScreen(x);
    const sy = yToScreen(cy);
    pts.push(`${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`);
  }
  return pts.join(' ');
}

function Axes() {
  const lines = [];
  // grid
  for (let x = X_MIN; x <= X_MAX; x++) {
    const sx = xToScreen(x);
    lines.push(
      <line
        key={`gx${x}`}
        x1={sx}
        y1={PAD_T}
        x2={sx}
        y2={PAD_T + PLOT_H}
        stroke="var(--border)"
        strokeWidth={x === 0 ? 1.1 : 0.35}
        opacity={x === 0 ? 0.9 : 0.55}
      />
    );
  }
  for (let y = Math.ceil(Y_MIN); y <= Math.floor(Y_MAX); y++) {
    const sy = yToScreen(y);
    lines.push(
      <line
        key={`gy${y}`}
        x1={PAD_L}
        y1={sy}
        x2={PAD_L + PLOT_W}
        y2={sy}
        stroke="var(--border)"
        strokeWidth={y === 0 ? 1.1 : 0.35}
        opacity={y === 0 ? 0.9 : 0.55}
      />
    );
  }
  // x-axis ticks
  const xLabels = [];
  for (let x = X_MIN; x <= X_MAX; x += 2) {
    if (x === 0) continue;
    const sx = xToScreen(x);
    xLabels.push(
      <text
        key={`xl${x}`}
        x={sx}
        y={PAD_T + PLOT_H + 12}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="middle"
      >
        {x}
      </text>
    );
  }
  // y-axis ticks
  const yLabels = [];
  for (let y = Math.ceil(Y_MIN); y <= Math.floor(Y_MAX); y++) {
    if (y === 0) continue;
    const sy = yToScreen(y);
    yLabels.push(
      <text
        key={`yl${y}`}
        x={PAD_L - 5}
        y={sy + 3}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="end"
      >
        {y}
      </text>
    );
  }
  return (
    <g>
      {lines}
      {xLabels}
      {yLabels}
      <text
        x={PAD_L + PLOT_W - 4}
        y={yToScreen(0) - 4}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="end"
      >
        x
      </text>
      <text
        x={xToScreen(0) + 5}
        y={PAD_T + 9}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
      >
        y
      </text>
    </g>
  );
}

export default function ActivationsViz() {
  const svgRef = useRef(null);
  const [selected, setSelected] = useState('relu');
  const [compare, setCompare] = useState(false);
  const [hoverX, setHoverX] = useState(null);

  const active = useMemo(() => ACTIVATIONS.find((a) => a.key === selected), [selected]);

  const paths = useMemo(() => {
    const out = {};
    for (const a of ACTIVATIONS) {
      out[a.key] = { f: buildPath(a.f), df: buildPath(a.df) };
    }
    return out;
  }, []);

  const handleMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const sx = (clientX - rect.left) * (W / rect.width);
    const x = screenToX(sx);
    if (x < X_MIN || x > X_MAX) {
      setHoverX(null);
      return;
    }
    setHoverX(x);
  }, []);

  const handleLeave = useCallback(() => setHoverX(null), []);

  const readoutValue = hoverX != null ? hoverX : 0;
  const fVal = active.f(readoutValue);
  const dVal = active.df(readoutValue);

  const hoverSx = hoverX != null ? xToScreen(hoverX) : null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${W} / ${H}` }}
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
          onTouchMove={handleMove}
          onTouchEnd={handleLeave}
        >
          <Axes />

          {compare ? (
            ACTIVATIONS.map((a) => (
              <g key={a.key}>
                <path
                  d={paths[a.key].f}
                  fill="none"
                  stroke={a.color}
                  strokeWidth="1.8"
                  opacity={a.key === selected ? 1 : 0.7}
                />
              </g>
            ))
          ) : (
            <g>
              {/* derivative first so f(x) sits on top */}
              <path
                d={paths[active.key].df}
                fill="none"
                stroke={active.color}
                strokeWidth="1.6"
                strokeDasharray="4 3"
                opacity="0.65"
              />
              <path
                d={paths[active.key].f}
                fill="none"
                stroke={active.color}
                strokeWidth="2.2"
              />
            </g>
          )}

          {/* hover crosshair */}
          {hoverX != null && !compare && (
            <g>
              <line
                x1={hoverSx}
                y1={PAD_T}
                x2={hoverSx}
                y2={PAD_T + PLOT_H}
                stroke="var(--text-dim)"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.55"
              />
              <circle
                cx={hoverSx}
                cy={yToScreen(Math.max(Y_MIN, Math.min(Y_MAX, fVal)))}
                r="3.5"
                fill={active.color}
                stroke="var(--bg)"
                strokeWidth="1.2"
              />
              <circle
                cx={hoverSx}
                cy={yToScreen(Math.max(Y_MIN, Math.min(Y_MAX, dVal)))}
                r="2.6"
                fill="var(--bg)"
                stroke={active.color}
                strokeWidth="1.4"
                strokeDasharray="1.5 1.5"
              />
            </g>
          )}

          {/* compare mode legend */}
          {compare && (
            <g>
              {ACTIVATIONS.map((a, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const lx = PAD_L + 6 + col * 110;
                const ly = PAD_T + 8 + row * 13;
                return (
                  <g key={`lg${a.key}`}>
                    <line
                      x1={lx}
                      y1={ly}
                      x2={lx + 14}
                      y2={ly}
                      stroke={a.color}
                      strokeWidth="2"
                    />
                    <text
                      x={lx + 18}
                      y={ly + 3}
                      fontSize="9"
                      fill="var(--text-main)"
                      fontFamily="var(--mono, monospace)"
                    >
                      {a.name}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* function label badge */}
          {!compare && (
            <g>
              <text
                x={PAD_L + 6}
                y={PAD_T + 12}
                fontSize="10"
                fill={active.color}
                fontFamily="var(--mono, monospace)"
                fontWeight="700"
                letterSpacing="0.06em"
              >
                {active.name}
              </text>
              <text
                x={PAD_L + 6}
                y={PAD_T + 24}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                f(x) = {active.formula}
              </text>
              <text
                x={W - PAD_R - 4}
                y={PAD_T + 12}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
                letterSpacing="0.08em"
              >
                — f(x)   - - f'(x)
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-toggles" role="radiogroup" aria-label="Activation function">
        {ACTIVATIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            role="radio"
            aria-checked={selected === a.key}
            className={`mlviz-toggle${!compare && selected === a.key ? ' is-on' : ''}`}
            style={{ '--toggle-color': a.color }}
            onClick={() => { setSelected(a.key); setCompare(false); }}
          >
            <span className="mlviz-toggle-dot" />
            <span>{a.name}</span>
          </button>
        ))}
        <button
          type="button"
          className={`mlviz-toggle${compare ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--accent)' }}
          onClick={() => setCompare((v) => !v)}
          aria-pressed={compare}
        >
          <span className="mlviz-toggle-dot" />
          <span>Compare all</span>
        </button>
      </div>

      <div className="mlviz-readout">
        {!compare ? (
          <>
            <div className="mlviz-row">
              <span className="mlviz-tag" style={{ color: active.color }}>x</span>
              <span className="mlviz-val">
                {hoverX != null ? snap(hoverX, 2).toFixed(2) : '—'}
              </span>
              <span className="mlviz-sub">
                {hoverX != null ? 'hovered' : 'hover the plot'}
              </span>
            </div>
            <div className="mlviz-row">
              <span className="mlviz-tag" style={{ color: active.color }}>f(x)</span>
              <span className="mlviz-val">
                {hoverX != null ? snap(fVal, 3).toFixed(3) : '—'}
              </span>
              <span className="mlviz-sub">activation output</span>
            </div>
            <div className="mlviz-row">
              <span className="mlviz-tag" style={{ color: active.color }}>f'(x)</span>
              <span className="mlviz-val">
                {hoverX != null ? snap(dVal, 3).toFixed(3) : '—'}
              </span>
              <span className="mlviz-sub">slope (dashed line)</span>
            </div>
            <div className="mlviz-row mlviz-row-hi">
              <span className="mlviz-tag">slope@0</span>
              <span className="mlviz-val">{active.slope0}</span>
            </div>
            <div className="mlviz-row">
              <span className="mlviz-tag">limits</span>
              <span className="mlviz-sub" style={{ fontSize: '0.72rem' }}>{active.asymptotes}</span>
            </div>
            <div className="mlviz-hint">hover the plot to scrub x</div>
          </>
        ) : (
          <>
            <div className="mlviz-row mlviz-row-hi">
              <span className="mlviz-tag">compare</span>
              <span className="mlviz-sub">all six activation curves overlaid</span>
            </div>
            {ACTIVATIONS.map((a) => (
              <div className="mlviz-row" key={`cmp${a.key}`}>
                <span className="mlviz-tag" style={{ color: a.color, fontSize: '0.78rem' }}>
                  {a.name}
                </span>
                <span className="mlviz-sub" style={{ fontFamily: 'var(--serif, serif)', fontStyle: 'italic' }}>
                  {a.formula}
                </span>
                <span className="mlviz-sub">slope@0 = {a.slope0}</span>
              </div>
            ))}
            <div className="mlviz-hint">tap a function name to inspect it</div>
          </>
        )}
      </div>
    </div>
  );
}
