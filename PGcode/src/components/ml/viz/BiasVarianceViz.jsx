import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, Shuffle, Eraser } from 'lucide-react';
import './MLViz.css';

// SVG layout — square-ish plot with axes.
const SW = 520;
const SH = 360;
const PAD_L = 44;
const PAD_R = 18;
const PAD_T = 28;
const PAD_B = 40;

const PLOT_W = SW - PAD_L - PAD_R;
const PLOT_H = SH - PAD_T - PAD_B;

// Domain of x — sine wave on [0, 1].
const X_MIN = 0;
const X_MAX = 1;
// Range of y — we draw between [-1.8, 1.8] so noisy points + wild fits stay in frame.
const Y_MIN = -1.8;
const Y_MAX = 1.8;

const N_POINTS = 20;
const VAL_FRAC = 0.2;
const CURVE_SAMPLES = 120;
const MAX_GHOSTS = 12;

const MIN_DEG = 1;
const MAX_DEG = 15;

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

// Box-Muller transform for gaussian noise.
function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// True deterministic function we are trying to learn.
function trueFn(x) {
  return Math.sin(2 * Math.PI * x);
}

// Build a dataset of N noisy points from the sine wave.
// seed determines both x positions (jittered evenly) AND noise.
function buildDataset(seed, n = N_POINTS, noiseStd = 0.25) {
  const rng = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    // jitter x around evenly spaced positions so resamples differ
    const base = (i + 0.5) / n;
    const jitter = (rng() - 0.5) * (0.8 / n);
    const x = Math.max(X_MIN, Math.min(X_MAX, base + jitter));
    const y = trueFn(x) + gauss(rng) * noiseStd;
    pts.push({ x, y });
  }
  return pts;
}

// Split into train / val using a stable seed for the split itself.
function trainValSplit(points, splitSeed) {
  const n = points.length;
  const nVal = Math.max(1, Math.floor(n * VAL_FRAC));
  // Produce a stable shuffled order from splitSeed.
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

// ---------- polynomial least squares ----------
// Solve (X^T X) w = X^T y via Gauss-Jordan elimination.
// Returns coefficient vector [w0, w1, ..., wd] for y = sum(w_k * x^k).
function fitPoly(points, degree) {
  const d = degree + 1;
  const A = Array.from({ length: d }, () => new Array(d).fill(0));
  const b = new Array(d).fill(0);
  // Build normal equations.
  for (const { x, y } of points) {
    const xpows = new Array(2 * d - 1);
    xpows[0] = 1;
    for (let k = 1; k < 2 * d - 1; k++) xpows[k] = xpows[k - 1] * x;
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) A[i][j] += xpows[i + j];
      b[i] += xpows[i] * y;
    }
  }
  // Tiny ridge to keep the system solvable at high degree with collinear data.
  const ridge = 1e-8;
  for (let i = 0; i < d; i++) A[i][i] += ridge;

  // Augmented Gauss-Jordan.
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < d; i++) {
    // Pivot.
    let piv = i;
    let pivVal = Math.abs(M[i][i]);
    for (let r = i + 1; r < d; r++) {
      if (Math.abs(M[r][i]) > pivVal) {
        pivVal = Math.abs(M[r][i]);
        piv = r;
      }
    }
    if (pivVal < 1e-14) {
      // Singular — return zero vector to avoid NaN explosion.
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

function polyEval(w, x) {
  let s = 0;
  let xp = 1;
  for (let k = 0; k < w.length; k++) {
    s += w[k] * xp;
    xp *= x;
  }
  return s;
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
function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y) {
  const t = (y - Y_MIN) / (Y_MAX - Y_MIN);
  return PAD_T + (1 - t) * PLOT_H;
}
function clampY(y) {
  return Math.max(Y_MIN - 0.05, Math.min(Y_MAX + 0.05, y));
}

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

// Sample the polynomial across [0, 1] for drawing.
function curvePath(w) {
  const pts = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const x = X_MIN + (i / CURVE_SAMPLES) * (X_MAX - X_MIN);
    const y = clampY(polyEval(w, x));
    pts.push(`${xToPx(x).toFixed(2)},${yToPx(y).toFixed(2)}`);
  }
  return `M ${pts.join(' L ')}`;
}

// Grid of x values where we estimate bias² and variance across runs.
const GRID = Array.from({ length: 41 }, (_, i) => i / 40);

export default function BiasVarianceViz() {
  const [degree, setDegree] = useState(5);
  // Each run is a {seed, train, val, w, trainErr, valErr}.
  const [runs, setRuns] = useState([]);
  const seedRef = useRef(1729);
  const splitSeedRef = useRef(91);

  const buildRun = useCallback((seed, deg) => {
    const data = buildDataset(seed);
    const { train, val } = trainValSplit(data, splitSeedRef.current);
    const w = fitPoly(train, deg);
    const trainErr = mse(train, (x) => polyEval(w, x));
    const valErr = mse(val, (x) => polyEval(w, x));
    return { seed, train, val, w, trainErr, valErr };
  }, []);

  // Initialize with one run on mount.
  useEffect(() => {
    setRuns([buildRun(seedRef.current, degree)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the degree changes, refit every run on the same training samples.
  useEffect(() => {
    setRuns((prev) => {
      if (!prev.length) return prev;
      return prev.map((r) => {
        const w = fitPoly(r.train, degree);
        const trainErr = mse(r.train, (x) => polyEval(w, x));
        const valErr = mse(r.val, (x) => polyEval(w, x));
        return { ...r, w, trainErr, valErr };
      });
    });
  }, [degree]);

  const resample = useCallback(() => {
    seedRef.current = (seedRef.current * 1103515245 + 12345) >>> 0;
    const newRun = buildRun(seedRef.current, degree);
    setRuns((prev) => {
      const next = [...prev, newRun];
      // Cap history so the SVG doesn't get hairy — keep the most recent MAX_GHOSTS + current.
      if (next.length > MAX_GHOSTS + 1) {
        return next.slice(next.length - (MAX_GHOSTS + 1));
      }
      return next;
    });
  }, [buildRun, degree]);

  const clearHistory = useCallback(() => {
    setRuns((prev) => (prev.length ? [prev[prev.length - 1]] : prev));
  }, []);

  const reset = useCallback(() => {
    seedRef.current = 1729;
    setDegree(5);
    setRuns([buildRun(1729, 5)]);
  }, [buildRun]);

  const current = runs.length ? runs[runs.length - 1] : null;
  const ghosts = runs.length > 1 ? runs.slice(0, runs.length - 1) : [];

  // ----- bias² / variance estimates across the run history -----
  // For each x in GRID, collect predictions from every run.
  // bias² = mean over grid of (mean_pred(x) - trueFn(x))²
  // variance = mean over grid of var(pred(x))
  const { biasSq, variance } = useMemo(() => {
    if (runs.length < 2) {
      // With only one run, variance is undefined; still surface bias from current fit.
      if (!runs.length) return { biasSq: NaN, variance: NaN };
      let bsq = 0;
      for (const x of GRID) {
        const p = polyEval(runs[0].w, x);
        const d = p - trueFn(x);
        bsq += d * d;
      }
      return { biasSq: bsq / GRID.length, variance: NaN };
    }
    let bsqAcc = 0;
    let varAcc = 0;
    for (const x of GRID) {
      const preds = runs.map((r) => polyEval(r.w, x));
      let m = 0;
      for (const p of preds) m += p;
      m /= preds.length;
      let v = 0;
      for (const p of preds) v += (p - m) * (p - m);
      v /= preds.length;
      const d = m - trueFn(x);
      bsqAcc += d * d;
      varAcc += v;
    }
    return { biasSq: bsqAcc / GRID.length, variance: varAcc / GRID.length };
  }, [runs]);

  // Verdict copy keyed on degree bands.
  const verdict = useMemo(() => {
    if (degree <= 2) {
      return {
        label: 'High bias, low variance',
        note: 'Underfits — every refit looks the same and all of them miss the curve.',
        tone: 'warn',
      };
    }
    if (degree >= 11) {
      return {
        label: 'Low bias, high variance',
        note: 'Overfits — each refit chases its own noise and wiggles between samples.',
        tone: 'warn',
      };
    }
    if (degree >= 4 && degree <= 7) {
      return {
        label: 'Sweet spot',
        note: 'Tracks the true sine without snapping to noise. Bias and variance are both small.',
        tone: 'ok',
      };
    }
    return {
      label: 'Approaching balance',
      note: 'Bias and variance are both moderate — push the degree to feel each end.',
      tone: 'mid',
    };
  }, [degree]);

  // ----- precomputed paths -----
  const truePath = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= CURVE_SAMPLES; i++) {
      const x = X_MIN + (i / CURVE_SAMPLES) * (X_MAX - X_MIN);
      pts.push(`${xToPx(x).toFixed(2)},${yToPx(trueFn(x)).toFixed(2)}`);
    }
    return `M ${pts.join(' L ')}`;
  }, []);

  const currentPath = current ? curvePath(current.w) : null;
  const ghostPaths = ghosts.map((g) => curvePath(g.w));

  // ----- axis ticks -----
  const xTicks = [0, 0.25, 0.5, 0.75, 1];
  const yTicks = [-1.5, -1, -0.5, 0, 0.5, 1, 1.5];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ flexDirection: 'column', gap: '0.6rem' }}>
        <svg
          viewBox={`0 0 ${SW} ${SH}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${SW} / ${SH}`, maxWidth: '620px' }}
        >
          {/* Header */}
          <text
            x={PAD_L}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
          >
            POLY DEGREE {degree}  ·  N={N_POINTS}  ·  RUNS {runs.length}
          </text>
          <text
            x={SW - PAD_R}
            y={16}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.14em"
            textAnchor="end"
          >
            TARGET sin(2π x)
          </text>

          {/* Plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* Y grid + ticks */}
          {yTicks.map((t) => (
            <g key={`yt-${t}`}>
              <line
                x1={PAD_L}
                y1={yToPx(t)}
                x2={PAD_L + PLOT_W}
                y2={yToPx(t)}
                stroke="var(--border)"
                strokeWidth="0.5"
                strokeDasharray={t === 0 ? '0' : '2 4'}
                opacity={t === 0 ? 0.7 : 0.35}
              />
              <text
                x={PAD_L - 6}
                y={yToPx(t) + 3}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="end"
              >
                {t.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTicks.map((t) => (
            <g key={`xt-${t}`}>
              <line
                x1={xToPx(t)}
                y1={PAD_T + PLOT_H}
                x2={xToPx(t)}
                y2={PAD_T + PLOT_H + 4}
                stroke="var(--text-dim)"
                strokeWidth="1"
              />
              <text
                x={xToPx(t)}
                y={PAD_T + PLOT_H + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {t.toFixed(2)}
              </text>
            </g>
          ))}

          {/* True sine wave */}
          <path
            d={truePath}
            fill="none"
            stroke="var(--text-dim)"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.7"
          />

          {/* Ghost fits — faint */}
          <g>
            {ghostPaths.map((d, i) => (
              <path
                key={`gh-${i}`}
                d={d}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1"
                opacity={0.18 + 0.05 * (i / Math.max(1, ghostPaths.length - 1))}
              />
            ))}
          </g>

          {/* Clip current fit to plot area to keep wild high-degree wiggles in-frame */}
          <defs>
            <clipPath id="bv-plot-clip">
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* Current fit */}
          {currentPath && (
            <g clipPath="url(#bv-plot-clip)">
              <path
                d={currentPath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.2"
                opacity="0.95"
                style={{ transition: 'd 220ms ease' }}
              />
            </g>
          )}

          {/* Training points */}
          {current && current.train.map((p, i) => (
            <circle
              key={`tr-${i}`}
              cx={xToPx(p.x)}
              cy={yToPx(clampY(p.y))}
              r="3.4"
              fill="var(--accent)"
              fillOpacity="0.85"
              stroke="var(--bg)"
              strokeWidth="1"
            />
          ))}

          {/* Validation points — hollow rings */}
          {current && current.val.map((p, i) => (
            <circle
              key={`va-${i}`}
              cx={xToPx(p.x)}
              cy={yToPx(clampY(p.y))}
              r="4.2"
              fill="transparent"
              stroke="var(--warning, var(--hue-pink))"
              strokeWidth="1.6"
            />
          ))}

          {/* Legend */}
          <g transform={`translate(${PAD_L + 6}, ${PAD_T + 10})`}>
            <line x1="0" y1="0" x2="18" y2="0" stroke="var(--text-dim)" strokeWidth="1.4" strokeDasharray="4 4" />
            <text x="22" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              true f(x)
            </text>
            <line x1="78" y1="0" x2="96" y2="0" stroke="var(--accent)" strokeWidth="2.2" />
            <text x="100" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              fit
            </text>
            <line x1="124" y1="0" x2="142" y2="0" stroke="var(--accent)" strokeWidth="1" opacity="0.3" />
            <text x="146" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              past fits
            </text>
            <circle cx="200" cy="0" r="3.2" fill="var(--accent)" />
            <text x="208" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              train
            </text>
            <circle cx="238" cy="0" r="4" fill="transparent" stroke="var(--warning, var(--hue-pink))" strokeWidth="1.4" />
            <text x="246" y="3" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono, monospace)">
              val
            </text>
          </g>

          {/* X axis label */}
          <text
            x={PAD_L + PLOT_W / 2}
            y={SH - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            x
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

        {/* Action buttons */}
        <div className="mlviz-row mlviz-btn-row" style={{ gap: '0.4rem' }}>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={resample}
          >
            <Shuffle size={13} />
            <span>New training sample</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={clearHistory}
            disabled={runs.length <= 1}
          >
            <Eraser size={13} />
            <span>Clear history</span>
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

        {/* Live error / bias / variance readout */}
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
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>train MSE</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              {current ? snap(current.trainErr, 4) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>val MSE</span>
            <span style={{ color: 'var(--warning, var(--hue-pink))', fontWeight: 700 }}>
              {current ? snap(current.valErr, 4) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>bias²</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {Number.isFinite(biasSq) ? snap(biasSq, 4) : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>variance</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>
              {Number.isFinite(variance) ? snap(variance, 4) : 'resample to estimate'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em' }}>runs in average</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{runs.length}</span>
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
          Resample 5+ times · solid line = current fit · faint lines = past fits (variance) · dashed = true function (bias)
        </div>
      </div>
    </div>
  );
}
