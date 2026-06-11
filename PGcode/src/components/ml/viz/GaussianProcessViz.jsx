import React, { useState, useMemo, useCallback, useRef } from 'react';
import { RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import './MLViz.css';

const W = 380;
const H = 300;
const PAD_L = 34;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const X_MIN = -3;
const X_MAX = 3;
const Y_MIN = -3;
const Y_MAX = 3;
const GRID_N = 80;
const JITTER = 1e-6;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function pxToX(px) {
  return X_MIN + ((px - PAD_L) / PLOT_W) * (X_MAX - X_MIN);
}

function pxToY(py) {
  return Y_MIN + (1 - (py - PAD_T) / PLOT_H) * (Y_MAX - Y_MIN);
}

// RBF kernel: k(x, x') = exp(-(x-x')^2 / (2 l^2))
function rbf(a, b, ell) {
  const d = a - b;
  return Math.exp(-(d * d) / (2 * ell * ell));
}

// Cholesky decomposition for symmetric positive-definite matrix A (n x n).
// Returns lower-triangular L such that L L^T = A. Adds a tiny jitter on failure.
function cholesky(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k];
      if (i === j) {
        const v = A[i][i] - sum;
        L[i][j] = Math.sqrt(Math.max(v, JITTER));
      } else {
        L[i][j] = (A[i][j] - sum) / (L[j][j] || JITTER);
      }
    }
  }
  return L;
}

// Solve L y = b (forward substitution).
function forwardSolve(L, b) {
  const n = L.length;
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / (L[i][i] || JITTER);
  }
  return y;
}

// Solve L^T x = y (backward substitution).
function backwardSolve(L, y) {
  const n = L.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / (L[i][i] || JITTER);
  }
  return x;
}

// Solve A x = b using a precomputed Cholesky L (A = L L^T).
function cholSolve(L, b) {
  return backwardSolve(L, forwardSolve(L, b));
}

// Box-Muller for one N(0,1) sample.
function randNormal() {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function buildGridXs() {
  const xs = new Array(GRID_N + 1);
  for (let i = 0; i <= GRID_N; i++) {
    xs[i] = X_MIN + ((X_MAX - X_MIN) * i) / GRID_N;
  }
  return xs;
}

// Compute the GP posterior over a dense grid given training points + hyperparams.
// Returns { mean: number[], std: number[], gridXs, Lpost?: number[][] } so we can
// also draw correlated samples from the posterior when requested.
function computePosterior(points, ell, noise2, gridXs) {
  const n = points.length;
  if (n === 0) {
    // Prior: mean 0, variance 1 (k(x,x) = 1 for RBF), no joint sampling matrix yet.
    return {
      mean: gridXs.map(() => 0),
      std: gridXs.map(() => 1),
      Lpost: null,
    };
  }

  // Training covariance K + noise.
  const K = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      K[i][j] = rbf(points[i].x, points[j].x, ell);
      if (i === j) K[i][j] += noise2 + JITTER;
    }
  }
  const L = cholesky(K);

  const y = points.map(p => p.y);
  const alpha = cholSolve(L, y);

  const m = gridXs.length;
  const mean = new Array(m).fill(0);
  const stdArr = new Array(m).fill(0);

  // For each test point, compute k* and posterior mean/var.
  // Also collect K_star (m x n) so we can later form the joint posterior cov.
  const Kstar = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      Kstar[i][j] = rbf(gridXs[i], points[j].x, ell);
    }
  }

  // mean = Kstar @ alpha
  for (let i = 0; i < m; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += Kstar[i][j] * alpha[j];
    mean[i] = s;
  }

  // For per-point variance, solve L v = k* and var = k(x*,x*) - v.v.
  for (let i = 0; i < m; i++) {
    const v = forwardSolve(L, Kstar[i]);
    let dot = 0;
    for (let k = 0; k < n; k++) dot += v[k] * v[k];
    const variance = Math.max(JITTER, 1 - dot);
    stdArr[i] = Math.sqrt(variance);
  }

  // Joint posterior covariance over the grid:
  //   Sigma_post = K** - Kstar A^{-1} Kstar^T,  where A = K + sigma_n^2 I.
  // To draw a sample we need a Cholesky of Sigma_post.  This is m x m which is
  // small (m ~ 81) so this is cheap.
  let Lpost = null;
  if (n > 0) {
    // V = L^{-1} Kstar^T  (n x m)
    const Vt = new Array(m); // we store columns of V as rows for convenience
    for (let i = 0; i < m; i++) Vt[i] = forwardSolve(L, Kstar[i]);
    // Sigma_post[i][j] = k(xi, xj) - Vt[i] . Vt[j]
    const Sigma = Array.from({ length: m }, () => new Array(m).fill(0));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j <= i; j++) {
        let dot = 0;
        for (let k = 0; k < n; k++) dot += Vt[i][k] * Vt[j][k];
        const kij = rbf(gridXs[i], gridXs[j], ell);
        const val = kij - dot + (i === j ? JITTER * 10 : 0);
        Sigma[i][j] = val;
        Sigma[j][i] = val;
      }
    }
    Lpost = cholesky(Sigma);
  }

  return { mean, std: stdArr, Lpost };
}

function buildLinePath(xs, ys) {
  const pts = [];
  for (let i = 0; i < xs.length; i++) {
    const px = xToPx(xs[i]).toFixed(2);
    const py = yToPx(Math.max(Y_MIN, Math.min(Y_MAX, ys[i]))).toFixed(2);
    pts.push(`${i === 0 ? 'M' : 'L'}${px},${py}`);
  }
  return pts.join(' ');
}

function buildBandPath(xs, mean, std, k) {
  if (xs.length === 0) return '';
  const pts = [];
  for (let i = 0; i < xs.length; i++) {
    const yU = mean[i] + k * std[i];
    const px = xToPx(xs[i]).toFixed(2);
    const py = yToPx(Math.max(Y_MIN, Math.min(Y_MAX, yU))).toFixed(2);
    pts.push(`${i === 0 ? 'M' : 'L'}${px},${py}`);
  }
  for (let i = xs.length - 1; i >= 0; i--) {
    const yL = mean[i] - k * std[i];
    const px = xToPx(xs[i]).toFixed(2);
    const py = yToPx(Math.max(Y_MIN, Math.min(Y_MAX, yL))).toFixed(2);
    pts.push(`L${px},${py}`);
  }
  pts.push('Z');
  return pts.join(' ');
}

export default function GaussianProcessViz() {
  const [points, setPoints] = useState([]);
  const [ell, setEll] = useState(0.8);
  const [noise2, setNoise2] = useState(0.04);
  const [sampleCurves, setSampleCurves] = useState([]);
  const svgRef = useRef(null);

  const gridXs = useMemo(() => buildGridXs(), []);
  const posterior = useMemo(
    () => computePosterior(points, ell, noise2, gridXs),
    [points, ell, noise2, gridXs]
  );

  // Sampled curves stay valid only while points / hyperparams are unchanged.
  // Drop stale samples whenever the posterior changes. Tracked-dep render-phase
  // reset (React's recommended pattern over setState-in-effect).
  const [lastPoints, setLastPoints] = useState(points);
  const [lastEll, setLastEll] = useState(ell);
  const [lastNoise2, setLastNoise2] = useState(noise2);
  if (points !== lastPoints || ell !== lastEll || noise2 !== lastNoise2) {
    setLastPoints(points);
    setLastEll(ell);
    setLastNoise2(noise2);
    setSampleCurves([]);
  }

  const meanPath = useMemo(
    () => buildLinePath(gridXs, posterior.mean),
    [gridXs, posterior.mean]
  );

  const bandPath = useMemo(
    () => buildBandPath(gridXs, posterior.mean, posterior.std, 2),
    [gridXs, posterior.mean, posterior.std]
  );

  const handleSvgClick = useCallback((evt) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = (evt.clientX - rect.left) * (W / rect.width);
    const sy = (evt.clientY - rect.top) * (H / rect.height);
    if (sx < PAD_L || sx > W - PAD_R || sy < PAD_T || sy > H - PAD_B) return;
    const x = pxToX(sx);
    const y = pxToY(sy);
    setPoints((prev) => [...prev, { x, y }]);
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
    setSampleCurves([]);
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
    setSampleCurves([]);
  }, []);

  const handleSample = useCallback(() => {
    const { mean, std, Lpost } = posterior;
    const m = gridXs.length;
    const curves = [];
    for (let c = 0; c < 3; c++) {
      const z = new Array(m);
      for (let i = 0; i < m; i++) z[i] = randNormal();
      const ys = new Array(m).fill(0);
      if (Lpost) {
        // y = mean + L z
        for (let i = 0; i < m; i++) {
          let s = 0;
          for (let j = 0; j <= i; j++) s += Lpost[i][j] * z[j];
          ys[i] = mean[i] + s;
        }
      } else {
        // Prior samples: independent draws are too jagged.  Build a Cholesky of
        // the prior covariance once on the fly so prior samples still look
        // smooth.
        const K = Array.from({ length: m }, () => new Array(m).fill(0));
        for (let i = 0; i < m; i++) {
          for (let j = 0; j <= i; j++) {
            const v = rbf(gridXs[i], gridXs[j], ell) + (i === j ? JITTER * 10 : 0);
            K[i][j] = v;
            K[j][i] = v;
          }
        }
        const Lp = cholesky(K);
        for (let i = 0; i < m; i++) {
          let s = 0;
          for (let j = 0; j <= i; j++) s += Lp[i][j] * z[j];
          ys[i] = mean[i] + s;
          // adjust std hint so per-point spread roughly matches
          if (!std) ys[i] = s;
        }
      }
      curves.push(ys);
    }
    setSampleCurves(curves);
  }, [posterior, gridXs, ell]);

  const yTicks = [-3, -2, -1, 0, 1, 2, 3];
  const xTicks = [-3, -2, -1, 0, 1, 2, 3];
  const yAxisBase = yToPx(0);
  const sampleColors = [
    'var(--hue-violet, #b794f4)',
    'var(--hue-sky, #5ecbff)',
    'var(--hue-pink, #ff66cc)',
  ];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          onClick={handleSvgClick}
          style={{ cursor: 'crosshair' }}
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="rgba(var(--accent-rgb, 0,255,245), 0.025)"
            stroke="none"
          />

          {/* gridlines */}
          {yTicks.map((ty) => (
            <line
              key={`gy${ty}`}
              x1={PAD_L}
              y1={yToPx(ty)}
              x2={W - PAD_R}
              y2={yToPx(ty)}
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity={ty === 0 ? 0.65 : 0.25}
            />
          ))}
          {xTicks.map((tx) => (
            <line
              key={`gx${tx}`}
              x1={xToPx(tx)}
              y1={PAD_T}
              x2={xToPx(tx)}
              y2={PAD_T + PLOT_H}
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity={tx === 0 ? 0.65 : 0.2}
            />
          ))}

          {/* uncertainty band */}
          {bandPath && (
            <path
              d={bandPath}
              fill="var(--accent)"
              opacity="0.16"
              stroke="none"
            />
          )}

          {/* sample functions from the posterior */}
          {sampleCurves.map((ys, i) => (
            <path
              key={`sc${i}`}
              d={buildLinePath(gridXs, ys)}
              fill="none"
              stroke={sampleColors[i % sampleColors.length]}
              strokeWidth="1.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.75"
              strokeDasharray="3 2"
            />
          ))}

          {/* mean curve */}
          <path
            d={meanPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* axes */}
          <line
            x1={PAD_L}
            y1={PAD_T + PLOT_H}
            x2={W - PAD_R}
            y2={PAD_T + PLOT_H}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={PAD_T + PLOT_H}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* x ticks */}
          {xTicks.map((tx) => {
            const px = xToPx(tx);
            return (
              <g key={`xt${tx}`}>
                <line
                  x1={px}
                  y1={PAD_T + PLOT_H}
                  x2={px}
                  y2={PAD_T + PLOT_H + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={PAD_T + PLOT_H + 15}
                  fontSize="9.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {tx}
                </text>
              </g>
            );
          })}

          {/* y ticks */}
          {yTicks.map((ty) => {
            const py = yToPx(ty);
            return (
              <g key={`yt${ty}`}>
                <line
                  x1={PAD_L - 4}
                  y1={py}
                  x2={PAD_L}
                  y2={py}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={PAD_L - 6}
                  y={py + 3}
                  fontSize="9.5"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {ty}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={PAD_T + PLOT_H + 24}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            x
          </text>
          <text
            x={PAD_L - 4}
            y={PAD_T - 4}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            y
          </text>

          {/* training points (drawn on top so they stay visible) */}
          {points.map((p, i) => (
            <g key={`pt${i}`}>
              <circle
                cx={xToPx(p.x)}
                cy={yToPx(p.y)}
                r="4.5"
                fill="var(--bg)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
              <circle
                cx={xToPx(p.x)}
                cy={yToPx(p.y)}
                r="1.8"
                fill="var(--accent)"
              />
            </g>
          ))}

          {/* empty-state hint */}
          {points.length === 0 && (
            <text
              x={PAD_L + PLOT_W / 2}
              y={yAxisBase - 4}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              opacity="0.7"
            >
              click anywhere to add an observation
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">ℓ length-scale</span>
            <input
              type="range"
              min="0.1"
              max="2.5"
              step="0.05"
              value={ell}
              onChange={(e) => setEll(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(ell, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">σₙ² noise</span>
            <input
              type="range"
              min="0.001"
              max="0.5"
              step="0.005"
              value={noise2}
              onChange={(e) => setNoise2(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(noise2, 3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>GP</span>
          <span className="mlviz-val">n = {points.length}</span>
          <span className="mlviz-val">k = RBF</span>
          <span className="mlviz-sub">k(x,x') = exp(−(x−x')² / 2ℓ²)</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleSample}
          >
            <Sparkles size={13} />
            <span>Sample functions</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleUndo}
            disabled={points.length === 0}
          >
            <RotateCcw size={13} />
            <span>Undo</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleClear}
            disabled={points.length === 0 && sampleCurves.length === 0}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>

        <div className="mlviz-hint">click plot to add (x, y) · mean curve + ±2σ band update live</div>
      </div>
    </div>
  );
}
