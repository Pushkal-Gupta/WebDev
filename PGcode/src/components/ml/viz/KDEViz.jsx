import React, { useState, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 520;
const H = 320;
const PAD_L = 36;
const PAD_R = 18;
const PAD_T = 18;
const PAD_B = 44;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const X_MIN = -6;
const X_MAX = 6;
const Y_MAX = 0.42;
const N_SAMPLES = 20;
const GRID_N = 320;

// True distribution: bimodal mixture of two gaussians.
// 0.55 * N(-1.6, 0.8^2) + 0.45 * N(1.8, 0.9^2)
const TRUE_MIX = [
  { w: 0.55, mu: -1.6, sd: 0.8 },
  { w: 0.45, mu: 1.8, sd: 0.9 },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToPx(y) {
  return PAD_T + (1 - y / Y_MAX) * PLOT_H;
}

function gaussianPdf(x, mu, sd) {
  const z = (x - mu) / sd;
  return Math.exp(-0.5 * z * z) / (sd * Math.sqrt(2 * Math.PI));
}

function truePdf(x) {
  let y = 0;
  for (let i = 0; i < TRUE_MIX.length; i++) {
    const c = TRUE_MIX[i];
    y += c.w * gaussianPdf(x, c.mu, c.sd);
  }
  return y;
}

// Box-Muller for one N(0,1).
function randNormal(rng) {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = rng();
  while (u2 === 0) u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Sample from the true mixture.
function sampleTrue(rng) {
  const r = rng();
  let acc = 0;
  for (let i = 0; i < TRUE_MIX.length; i++) {
    acc += TRUE_MIX[i].w;
    if (r <= acc) {
      const c = TRUE_MIX[i];
      return c.mu + c.sd * randNormal(rng);
    }
  }
  const last = TRUE_MIX[TRUE_MIX.length - 1];
  return last.mu + last.sd * randNormal(rng);
}

function generateSamples(n, rng) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let x = sampleTrue(rng);
    // Clip to plot range so every sample is visible.
    if (x < X_MIN + 0.1) x = X_MIN + 0.1;
    if (x > X_MAX - 0.1) x = X_MAX - 0.1;
    out.push(x);
  }
  return out;
}

function buildPath(xs, ys) {
  const pts = [];
  for (let i = 0; i < xs.length; i++) {
    const px = xToPx(xs[i]);
    const py = yToPx(Math.min(ys[i], Y_MAX));
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(' ');
}

export default function KDEViz() {
  const [h, setH] = useState(0.5);
  const seedRef = useRef(1);
  const [seedTick, setSeedTick] = useState(0);

  // Deterministic PRNG so the slider doesn't reshuffle the points.
  const samples = useMemo(() => {
    // Mulberry32 seeded RNG.
    let s = (seedRef.current * 2654435761) >>> 0;
    const rng = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return generateSamples(N_SAMPLES, rng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedTick]);

  const grid = useMemo(() => {
    const xs = new Array(GRID_N + 1);
    for (let i = 0; i <= GRID_N; i++) {
      xs[i] = X_MIN + ((X_MAX - X_MIN) * i) / GRID_N;
    }
    return xs;
  }, []);

  const trueYs = useMemo(() => grid.map((x) => truePdf(x)), [grid]);

  // Each individual kernel evaluated on the grid, scaled by 1/n so the sum equals the KDE.
  const kernelYs = useMemo(() => {
    const out = new Array(samples.length);
    for (let k = 0; k < samples.length; k++) {
      const xk = samples[k];
      const row = new Array(grid.length);
      for (let i = 0; i < grid.length; i++) {
        row[i] = gaussianPdf(grid[i], xk, h) / samples.length;
      }
      out[k] = row;
    }
    return out;
  }, [samples, grid, h]);

  const kdeYs = useMemo(() => {
    const out = new Array(grid.length).fill(0);
    for (let k = 0; k < kernelYs.length; k++) {
      const row = kernelYs[k];
      for (let i = 0; i < row.length; i++) out[i] += row[i];
    }
    return out;
  }, [kernelYs, grid.length]);

  // L2 distance: sqrt( integral (kde - true)^2 dx ).
  const l2 = useMemo(() => {
    const dx = (X_MAX - X_MIN) / GRID_N;
    let s = 0;
    for (let i = 0; i < grid.length; i++) {
      const d = kdeYs[i] - trueYs[i];
      s += d * d;
    }
    return Math.sqrt(s * dx);
  }, [kdeYs, trueYs, grid.length]);

  const truePath = useMemo(() => buildPath(grid, trueYs), [grid, trueYs]);
  const kdePath = useMemo(() => buildPath(grid, kdeYs), [grid, kdeYs]);

  // Each kernel as its own path for the faded layer. Scale up for visibility
  // (so each bump is readable, not micro). The displayed bump is the kernel
  // shape, not the 1/n-scaled contribution, but we cap to Y_MAX.
  const kernelPaths = useMemo(() => {
    return samples.map((xk) => {
      const ys = grid.map((x) => gaussianPdf(x, xk, h) / samples.length);
      // Boost the visual scale so bumps are visible against the KDE curve.
      const boost = 2.4;
      const yBoosted = ys.map((y) => Math.min(y * boost, Y_MAX));
      return buildPath(grid, yBoosted);
    });
  }, [samples, grid, h]);

  const handleNewSamples = useCallback(() => {
    seedRef.current = (Math.floor(Math.random() * 2_000_000_000) + 1) >>> 0;
    setSeedTick((t) => t + 1);
  }, []);

  const handleReset = useCallback(() => {
    seedRef.current = 1;
    setSeedTick((t) => t + 1);
    setH(0.5);
  }, []);

  const yAxisBase = yToPx(0);

  const xTicks = [-6, -4, -2, 0, 2, 4, 6];

  const quality = useMemo(() => {
    if (l2 < 0.06) return { label: 'excellent', color: 'var(--easy, #22c55e)' };
    if (l2 < 0.12) return { label: 'good', color: 'var(--hue-mint, #4ade80)' };
    if (l2 < 0.22) return { label: 'fair', color: 'var(--medium, #f59e0b)' };
    return { label: 'poor', color: 'var(--hard, #ef4444)' };
  }, [l2]);

  const regime = useMemo(() => {
    if (h <= 0.25) return { label: 'noisy — under-smoothed', color: 'var(--hard, #ef4444)' };
    if (h >= 1.3) return { label: 'blurry — over-smoothed', color: 'var(--medium, #f59e0b)' };
    return { label: 'balanced', color: 'var(--easy, #22c55e)' };
  }, [h]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="kde-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* axes */}
          <line
            x1={PAD_L}
            y1={yAxisBase}
            x2={W - PAD_R}
            y2={yAxisBase}
            stroke="var(--border)"
            strokeWidth="1"
          />
          <line
            x1={PAD_L}
            y1={PAD_T}
            x2={PAD_L}
            y2={yAxisBase}
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
                  y1={yAxisBase}
                  x2={px}
                  y2={yAxisBase + 4}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
                <text
                  x={px}
                  y={yAxisBase + 15}
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

          {/* y axis ticks */}
          {[0.1, 0.2, 0.3, 0.4].map((ty) => {
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
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {ty.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yAxisBase + 30}
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
            y={PAD_T + 2}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            p(x)
          </text>

          {/* individual kernels (faded) */}
          {kernelPaths.map((p, i) => (
            <path
              key={`k${i}`}
              d={p}
              fill="none"
              stroke="var(--hue-sky, #5ecbff)"
              strokeWidth="1"
              opacity="0.42"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* true distribution (dashed reference) */}
          <path
            d={truePath}
            fill="none"
            stroke="var(--hue-pink, #ff66cc)"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            opacity="0.85"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* KDE estimate (bold) */}
          <path d={kdePath} fill="url(#kde-fill)" />
          <path
            d={kdePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* sample ticks along x axis */}
          {samples.map((sx, i) => {
            const px = xToPx(sx);
            return (
              <line
                key={`s${i}`}
                x1={px}
                y1={yAxisBase}
                x2={px}
                y2={yAxisBase + 10}
                stroke="var(--text-main)"
                strokeWidth="1.4"
                opacity="0.85"
              />
            );
          })}

          {/* legend */}
          <g transform={`translate(${PAD_L + 8}, ${PAD_T + 6})`}>
            <rect
              x="-4"
              y="-4"
              width="168"
              height="58"
              rx="6"
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth="0.8"
              opacity="0.92"
            />
            <line
              x1="2"
              y1="6"
              x2="22"
              y2="6"
              stroke="var(--accent)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <text
              x="28"
              y="9"
              fontSize="9.5"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
            >
              KDE estimate
            </text>
            <line
              x1="2"
              y1="22"
              x2="22"
              y2="22"
              stroke="var(--hue-pink, #ff66cc)"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
            <text
              x="28"
              y="25"
              fontSize="9.5"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
            >
              true density
            </text>
            <line
              x1="2"
              y1="38"
              x2="22"
              y2="38"
              stroke="var(--hue-sky, #5ecbff)"
              strokeWidth="1"
              opacity="0.6"
            />
            <text
              x="28"
              y="41"
              fontSize="9.5"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
            >
              kernels (n=20)
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">h bandwidth</span>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={h}
              onChange={(e) => setH(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(h, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>kde</span>
          <span className="mlviz-val">h = {snap(h, 2)}</span>
          <span className="mlviz-val">n = {N_SAMPLES}</span>
          <span className="mlviz-sub" style={{ color: regime.color }}>{regime.label}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink, #ff66cc)' }}>fit</span>
          <span className="mlviz-val">L2 = {snap(l2, 4)}</span>
          <span className="mlviz-sub" style={{ color: quality.color }}>{quality.label}</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleNewSamples}
          >
            <RefreshCw size={13} />
            <span>New samples</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          small h spikes on each point; large h flattens into one blob; mid h recovers the bimodal shape
        </div>
      </div>
    </div>
  );
}
