import React, { useCallback, useMemo, useState } from 'react';
import { RotateCcw, Shuffle } from 'lucide-react';
import './MLViz.css';

// SVG layout — two side panels: fit plot on the left, error curves on the right.
const SW = 760;
const SH = 360;

// Left plot — polynomial fit on noisy sine.
const L_PAD_L = 44;
const L_PAD_R = 16;
const L_PAD_T = 28;
const L_PAD_B = 40;
const L_W = 420;
const L_PLOT_W = L_W - L_PAD_L - L_PAD_R;
const L_PLOT_H = SH - L_PAD_T - L_PAD_B;

// Right plot — train/val MSE vs degree.
const R_PAD_L = 44;
const R_PAD_R = 16;
const R_PAD_T = 28;
const R_PAD_B = 40;
const R_OFFSET_X = L_W + 6;
const R_W = SW - R_OFFSET_X;
const R_PLOT_W = R_W - R_PAD_L - R_PAD_R;
const R_PLOT_H = SH - R_PAD_T - R_PAD_B;

// True function domain: sine on [-π, π].
const X_MIN = -Math.PI;
const X_MAX = Math.PI;
// Y range padded so high-degree overfit wiggles stay visible-ish before clipping.
const Y_MIN = -2.0;
const Y_MAX = 2.0;

const N_POINTS = 20;
const VAL_FRAC = 0.2;
const CURVE_SAMPLES = 160;
const NOISE_STD = 0.30;

const MIN_DEG = 1;
const MAX_DEG = 20;

// MSE plot scale — log-ish via sqrt for legibility across orders of magnitude.
const MSE_MAX_DISPLAY = 1.6;

// ---------- seeded RNG ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function trueFn(x) {
  return Math.sin(x);
}

// Center+scale x to keep Vandermonde well-conditioned at high degree.
// Maps x in [X_MIN, X_MAX] → u in [-1, 1].
const X_CENTER = (X_MIN + X_MAX) / 2;
const X_SPAN = (X_MAX - X_MIN) / 2;
function toU(x) {
  return (x - X_CENTER) / X_SPAN;
}

function buildDataset(seed, n = N_POINTS, noiseStd = NOISE_STD) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const base = X_MIN + ((i + 0.5) / n) * (X_MAX - X_MIN);
    const jitter = (rng() - 0.5) * ((X_MAX - X_MIN) * 0.8) / n;
    const x = Math.max(X_MIN, Math.min(X_MAX, base + jitter));
    const y = trueFn(x) + gauss(rng) * noiseStd;
    pts.push({ x, y });
  }
  return pts;
}

function trainValSplit(points, splitSeed) {
  const n = points.length;
  const nVal = Math.max(1, Math.floor(n * VAL_FRAC));
  const rng = mulberry32(splitSeed);
  const order = points.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const valIdx = new Set(order.slice(0, nVal));
  const train = [];
  const val = [];
  points.forEach((p, i) => {
    if (valIdx.has(i)) val.push(p);
    else train.push(p);
  });
  return { train, val };
}

// ---------- polynomial least squares in u-space ----------
function fitPoly(points, degree) {
  const d = degree + 1;
  const A = Array.from({ length: d }, () => new Array(d).fill(0));
  const b = new Array(d).fill(0);
  for (const { x, y } of points) {
    const u = toU(x);
    const upows = new Array(2 * d - 1);
    upows[0] = 1;
    for (let k = 1; k < 2 * d - 1; k++) upows[k] = upows[k - 1] * u;
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) A[i][j] += upows[i + j];
      b[i] += upows[i] * y;
    }
  }
  const ridge = 1e-9;
  for (let i = 0; i < d; i++) A[i][i] += ridge;

  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < d; i++) {
    let piv = i;
    let pivVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < d; r++) {
      if (Math.abs(M[r][i]) > pivVal) {
        pivVal = Math.abs(M[r][i]);
        piv = r;
      }
    }
    if (pivVal < 1e-14) {
      return new Array(d).fill(0);
    }
    if (piv !== i) {
      const tmp = M[i];
      M[i] = M[piv];
      M[piv] = tmp;
    }
    const pv = M[i][i];
    for (let j = i; j <= d; j++) M[i][j] /= pv;
    for (let r = 0; r < d; r++) {
      if (r === i) continue;
      const factor = M[r][i];
      if (factor === 0) continue;
      for (let j = i; j <= d; j++) M[r][j] -= factor * M[i][j];
    }
  }
  const w = new Array(d);
  for (let i = 0; i < d; i++) w[i] = M[i][d];
  return w;
}

function polyEvalU(w, u) {
  let s = 0;
  let up = 1;
  for (let k = 0; k < w.length; k++) {
    s += w[k] * up;
    up *= u;
  }
  return s;
}

function polyEval(w, x) {
  return polyEvalU(w, toU(x));
}

function mse(points, predict) {
  if (!points.length) return 0;
  let s = 0;
  for (const { x, y } of points) {
    const d = predict(x) - y;
    s += d * d;
  }
  return s / points.length;
}

// ---------- axis mapping ----------
function lxToPx(x) {
  return L_PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * L_PLOT_W;
}
function lyToPx(y) {
  const t = (y - Y_MIN) / (Y_MAX - Y_MIN);
  return L_PAD_T + (1 - t) * L_PLOT_H;
}
function clampY(y) {
  return Math.max(Y_MIN - 0.05, Math.min(Y_MAX + 0.05, y));
}

// Error plot — use sqrt scale to compress the high-degree spikes.
function errToT(e) {
  const clamped = Math.max(0, Math.min(MSE_MAX_DISPLAY, e));
  return Math.sqrt(clamped / MSE_MAX_DISPLAY);
}
function rxToPx(deg) {
  const t = (deg - MIN_DEG) / (MAX_DEG - MIN_DEG);
  return R_OFFSET_X + R_PAD_L + t * R_PLOT_W;
}
function ryToPx(e) {
  return R_PAD_T + (1 - errToT(e)) * R_PLOT_H;
}

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

function curvePath(w) {
  const pts = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const x = X_MIN + (i / CURVE_SAMPLES) * (X_MAX - X_MIN);
    const y = clampY(polyEval(w, x));
    pts.push(`${lxToPx(x).toFixed(2)},${lyToPx(y).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')}`;
}

export default function PolyOverfitViz() {
  const [degree, setDegree] = useState(1);
  const [seed, setSeed] = useState(2027);
  const splitSeed = 91; // stable split so train/val membership doesn't shuffle on slider drag

  // Build dataset for the current seed.
  const dataset = useMemo(() => buildDataset(seed), [seed]);
  const { train, val } = useMemo(() => trainValSplit(dataset, splitSeed), [dataset]);

  // Fit current-degree polynomial on the training set.
  const current = useMemo(() => {
    const w = fitPoly(train, degree);
    const trainErr = mse(train, (x) => polyEval(w, x));
    const valErr = mse(val, (x) => polyEval(w, x));
    return { w, trainErr, valErr };
  }, [train, val, degree]);

  // Precompute train/val MSE across every degree once per dataset for the right-side curve.
  const errCurve = useMemo(() => {
    const out = [];
    for (let d = MIN_DEG; d <= MAX_DEG; d++) {
      const w = fitPoly(train, d);
      const tr = mse(train, (x) => polyEval(w, x));
      const va = mse(val, (x) => polyEval(w, x));
      out.push({ d, tr, va });
    }
    return out;
  }, [train, val]);

  const trainPath = useMemo(() => {
    if (!errCurve.length) return '';
    const pts = errCurve.map((e) => `${rxToPx(e.d).toFixed(2)},${ryToPx(e.tr).toFixed(2)}`);
    return `M ${pts.join(' L ')}`;
  }, [errCurve]);

  const valPath = useMemo(() => {
    if (!errCurve.length) return '';
    const pts = errCurve.map((e) => `${rxToPx(e.d).toFixed(2)},${ryToPx(e.va).toFixed(2)}`);
    return `M ${pts.join(' L ')}`;
  }, [errCurve]);

  // Precompute true sine path once.
  const truePath = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = X_MIN + (i / CURVE_SAMPLES) * (X_MAX - X_MIN);
      pts.push(`${lxToPx(x).toFixed(2)},${lyToPx(trueFn(x)).toFixed(2)}`);
    }
    return `M ${pts.join(' L ')}`;
  }, []);

  const currentPath = useMemo(() => curvePath(current.w), [current.w]);

  const newNoise = useCallback(() => {
    setSeed((s) => ((s * 1103515245 + 12345) >>> 0) || 1);
  }, []);

  const reset = useCallback(() => {
    setSeed(2027);
    setDegree(1);
  }, []);

  // Verdict copy keyed on the degree bands the user called out.
  const verdict = useMemo(() => {
    if (degree <= 2) {
      return {
        label: 'Underfitting',
        note: 'A straight (or near-straight) line cannot bend with the sine — train and val errors are both high.',
        tone: 'warn',
      };
    }
    if (degree >= 4 && degree <= 6) {
      return {
        label: 'Sweet spot',
        note: 'Enough flexibility to follow sin(x), not enough to chase every noisy point. Val MSE is near its minimum.',
        tone: 'ok',
      };
    }
    if (degree >= 15) {
      return {
        label: 'Overfitting',
        note: 'The curve threads every training point — train MSE collapses while val MSE blows up between samples.',
        tone: 'warn',
      };
    }
    return {
      label: 'In between',
      note: 'Flexible enough to bend with the sine. Push toward 1 or 20 to feel each failure mode.',
      tone: 'mid',
    };
  }, [degree]);

  // Axis ticks.
  const xTicks = useMemo(() => [
    { x: -Math.PI, label: '-π' },
    { x: -Math.PI / 2, label: '-π/2' },
    { x: 0, label: '0' },
    { x: Math.PI / 2, label: 'π/2' },
    { x: Math.PI, label: 'π' },
  ], []);
  const yTicks = [-1.5, -1, 0, 1, 1.5];
  const degTicks = [1, 5, 10, 15, 20];
  const errTicks = [0, 0.1, 0.4, 1.0, 1.6];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ flexDirection: 'column', gap: '0.6rem' }}>
        <svg
          viewBox={`0 0 ${SW} ${SH}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${SW} / ${SH}`, maxWidth: '880px' }}
        >
          <defs>
            <clipPath id="po-fit-clip">
              <rect x={L_PAD_L} y={L_PAD_T} width={L_PLOT_W} height={L_PLOT_H} />
            </clipPath>
            <clipPath id="po-err-clip">
              <rect x={R_OFFSET_X + R_PAD_L} y={R_PAD_T} width={R_PLOT_W} height={R_PLOT_H} />
            </clipPath>
          </defs>

          {/* ---------- LEFT PANEL — fit ---------- */}
          <text
            x={L_PAD_L}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
          >
            FIT  ·  degree {degree}  ·  N={N_POINTS}
          </text>
          <text
            x={L_W - L_PAD_R}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            textAnchor="end"
          >
            target sin(x)
          </text>

          <rect
            x={L_PAD_L}
            y={L_PAD_T}
            width={L_PLOT_W}
            height={L_PLOT_H}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {yTicks.map((t) => (
            <g key={`lyt-${t}`}>
              <line
                x1={L_PAD_L}
                y1={lyToPx(t)}
                x2={L_PAD_L + L_PLOT_W}
                y2={lyToPx(t)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray={t === 0 ? '0' : '2 4'}
                opacity={t === 0 ? 0.7 : 0.35}
              />
              <text
                x={L_PAD_L - 6}
                y={lyToPx(t) + 3}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
              >
                {t.toFixed(1)}
              </text>
            </g>
          ))}

          {xTicks.map((t) => (
            <g key={`lxt-${t.label}`}>
              <line
                x1={lxToPx(t.x)}
                y1={L_PAD_T + L_PLOT_H}
                x2={lxToPx(t.x)}
                y2={L_PAD_T + L_PLOT_H + 4}
                stroke="var(--text-dim)"
                strokeWidth="1"
              />
              <text
                x={lxToPx(t.x)}
                y={L_PAD_T + L_PLOT_H + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {t.label}
              </text>
            </g>
          ))}

          {/* True function */}
          <path
            d={truePath}
            fill="none"
            stroke="var(--text-dim)"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.7"
          />

          {/* Polynomial fit, clipped to the plot rect so wild degree-20 spikes don't paint over the rest. */}
          <g clipPath="url(#po-fit-clip)">
            <path
              d={currentPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              opacity="0.95"
              style={{ transition: 'd 220ms ease' }}
            />
          </g>

          {/* Training points */}
          {train.map((p, i) => (
            <circle
              key={`tr-${i}`}
              cx={lxToPx(p.x)}
              cy={lyToPx(clampY(p.y))}
              r="3.4"
              fill="var(--accent)"
              fillOpacity="0.85"
              stroke="var(--bg)"
              strokeWidth="1"
            />
          ))}

          {/* Validation points — hollow rings in warning hue */}
          {val.map((p, i) => (
            <circle
              key={`va-${i}`}
              cx={lxToPx(p.x)}
              cy={lyToPx(clampY(p.y))}
              r="4.2"
              fill="transparent"
              stroke="var(--warning, var(--hue-pink))"
              strokeWidth="1.6"
            />
          ))}

          {/* Legend strip — fit panel */}
          <g transform={`translate(${L_PAD_L + 6}, ${L_PAD_T + 10})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="var(--text-dim)" strokeWidth="1.4" strokeDasharray="4 4" />
            <text x="22" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              true sin(x)
            </text>
            <line x1="86" y1="0" x2="104" y2="0" stroke="var(--accent)" strokeWidth="2.2" />
            <text x="108" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              fit
            </text>
            <circle cx="138" cy="0" r="3.2" fill="var(--accent)" />
            <text x="146" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              train
            </text>
            <circle cx="180" cy="0" r="4" fill="transparent" stroke="var(--warning, var(--hue-pink))" strokeWidth="1.4" />
            <text x="188" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              val
            </text>
          </g>

          <text
            x={L_PAD_L + L_PLOT_W / 2}
            y={SH - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            x
          </text>

          {/* ---------- RIGHT PANEL — error vs degree ---------- */}
          <text
            x={R_OFFSET_X + R_PAD_L}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
          >
            ERROR  ·  MSE vs degree
          </text>
          <text
            x={R_OFFSET_X + R_W - R_PAD_R}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            textAnchor="end"
          >
            √-scaled
          </text>

          <rect
            x={R_OFFSET_X + R_PAD_L}
            y={R_PAD_T}
            width={R_PLOT_W}
            height={R_PLOT_H}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {errTicks.map((t) => (
            <g key={`ryt-${t}`}>
              <line
                x1={R_OFFSET_X + R_PAD_L}
                y1={ryToPx(t)}
                x2={R_OFFSET_X + R_PAD_L + R_PLOT_W}
                y2={ryToPx(t)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray="2 4"
                opacity="0.35"
              />
              <text
                x={R_OFFSET_X + R_PAD_L - 6}
                y={ryToPx(t) + 3}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
              >
                {t.toFixed(2)}
              </text>
            </g>
          ))}

          {degTicks.map((t) => (
            <g key={`rxt-${t}`}>
              <line
                x1={rxToPx(t)}
                y1={R_PAD_T + R_PLOT_H}
                x2={rxToPx(t)}
                y2={R_PAD_T + R_PLOT_H + 4}
                stroke="var(--text-dim)"
                strokeWidth="1"
              />
              <text
                x={rxToPx(t)}
                y={R_PAD_T + R_PLOT_H + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {t}
              </text>
            </g>
          ))}

          {/* Current-degree vertical line */}
          <line
            x1={rxToPx(degree)}
            y1={R_PAD_T}
            x2={rxToPx(degree)}
            y2={R_PAD_T + R_PLOT_H}
            stroke="var(--accent)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
          />

          {/* Error curves */}
          <g clipPath="url(#po-err-clip)">
            <path
              d={trainPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              opacity="0.95"
            />
            <path
              d={valPath}
              fill="none"
              stroke="var(--warning, var(--hue-pink))"
              strokeWidth="1.8"
              opacity="0.95"
            />
            {/* Points on each curve */}
            {errCurve.map((e) => (
              <g key={`pt-${e.d}`}>
                <circle
                  cx={rxToPx(e.d)}
                  cy={ryToPx(e.tr)}
                  r={e.d === degree ? 3.6 : 2.0}
                  fill="var(--accent)"
                  stroke="var(--bg)"
                  strokeWidth="1"
                />
                <circle
                  cx={rxToPx(e.d)}
                  cy={ryToPx(e.va)}
                  r={e.d === degree ? 3.6 : 2.0}
                  fill="var(--warning, var(--hue-pink))"
                  stroke="var(--bg)"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>

          {/* Legend strip — error panel */}
          <g transform={`translate(${R_OFFSET_X + R_PAD_L + 6}, ${R_PAD_T + 10})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="var(--accent)" strokeWidth="1.8" />
            <text x="22" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              train
            </text>
            <line x1="62" y1="0" x2="80" y2="0" stroke="var(--warning, var(--hue-pink))" strokeWidth="1.8" />
            <text x="84" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              val
            </text>
          </g>

          <text
            x={R_OFFSET_X + R_PAD_L + R_PLOT_W / 2}
            y={SH - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            polynomial degree
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* Degree slider */}
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider" style={{ flex: 1 }}>
            <span className="mlviz-slider-label">degree</span>
            <input
              type="range"
              min={MIN_DEG}
              max={MAX_DEG}
              step="1"
              value={degree}
              onChange={(e) => setDegree(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{degree}</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="mlviz-row mlviz-btn-row" style={{ gap: '0.4rem' }}>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={newNoise}
          >
            <Shuffle size={13} />
            <span>New noise</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        {/* Live readout */}
        <div
          className="mlviz-row mlviz-row-hi"
          style={{
            gap: '1.1rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.74rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>degree</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{degree}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>train MSE</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {snap(current.trainErr, 4)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>val MSE</span>
            <span style={{ color: 'var(--warning, var(--hue-pink))', fontWeight: 700 }}>
              {snap(current.valErr, 4)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>train / val</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {train.length} / {val.length}
            </span>
          </div>
        </div>

        {/* Verdict band */}
        <div
          className="mlviz-row"
          style={{
            marginTop: '0.2rem',
            padding: '0.45rem 0.6rem',
            border: '1px solid',
            borderColor:
              verdict.tone === 'ok'
                ? 'var(--accent)'
                : verdict.tone === 'warn'
                ? 'var(--warning, var(--hue-pink))'
                : 'var(--border)',
            background:
              verdict.tone === 'ok'
                ? 'rgba(var(--accent-rgb), 0.08)'
                : 'transparent',
            borderRadius: '6px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.15rem',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:
                verdict.tone === 'ok'
                  ? 'var(--accent)'
                  : verdict.tone === 'warn'
                  ? 'var(--warning, var(--hue-pink))'
                  : 'var(--text-dim)',
              fontWeight: 700,
            }}
          >
            {verdict.label}
          </span>
          <span style={{ color: 'var(--text-main)', fontSize: '0.78rem' }}>{verdict.note}</span>
        </div>

        <div className="mlviz-hint">
          Drag the slider · degree 1 is a line, degree 4-6 hugs sin(x), degree 15+ snakes through every training point.
        </div>
      </div>
    </div>
  );
}
