import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, RotateCcw, Play, Square } from 'lucide-react';
import './MLViz.css';

const W = 380;
const H = 300;
const PAD_L = 30;
const PAD_R = 14;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const X_MIN = -8;
const X_MAX = 8;
const Y_MAX = 0.85;
const SAMPLES_PER_DRAW = 50;
const HIST_BINS = 32;
const BIN_W = (X_MAX - X_MIN) / HIST_BINS;
const AUTO_DELAY = 240;

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

function pdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Box-Muller transform for one N(0,1) sample.
function randNormal() {
  let u1 = 0;
  let u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function buildCurvePath(mu, sigma) {
  const N = 220;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const y = pdf(x, mu, sigma);
    const px = xToPx(x);
    const py = yToPx(Math.min(y, Y_MAX));
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildShadePath(mu, sigma, kLow, kHigh) {
  const xL = Math.max(X_MIN, mu + kLow * sigma);
  const xH = Math.min(X_MAX, mu + kHigh * sigma);
  if (xH <= xL) return '';
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = xL + ((xH - xL) * i) / N;
    const y = pdf(x, mu, sigma);
    const px = xToPx(x);
    const py = yToPx(Math.min(y, Y_MAX));
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  const baseY = yToPx(0);
  pts.push(`L${xToPx(xH).toFixed(2)},${baseY.toFixed(2)}`);
  pts.push(`L${xToPx(xL).toFixed(2)},${baseY.toFixed(2)}`);
  pts.push('Z');
  return pts.join(' ');
}

export default function GaussianViz() {
  const [mu, setMu] = useState(0);
  const [sigma, setSigma] = useState(1);
  const [samples, setSamples] = useState([]);
  const [auto, setAuto] = useState(false);

  const autoRef = useRef(false);
  const timerRef = useRef(null);

  const curvePath = useMemo(() => buildCurvePath(mu, sigma), [mu, sigma]);
  const shade3 = useMemo(() => buildShadePath(mu, sigma, -3, 3), [mu, sigma]);
  const shade2 = useMemo(() => buildShadePath(mu, sigma, -2, 2), [mu, sigma]);
  const shade1 = useMemo(() => buildShadePath(mu, sigma, -1, 1), [mu, sigma]);

  const drawSamples = useCallback(() => {
    const fresh = [];
    for (let i = 0; i < SAMPLES_PER_DRAW; i++) {
      const z = randNormal();
      const x = mu + sigma * z;
      fresh.push({ x, y: 0.18 + Math.random() * 0.64 });
    }
    setSamples((prev) => {
      const next = prev.concat(fresh);
      if (next.length > 4000) next.splice(0, next.length - 4000);
      return next;
    });
  }, [mu, sigma]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAuto(false);
    clearTimer();
  }, [clearTimer]);

  useEffect(() => () => {
    autoRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleSample = useCallback(() => {
    drawSamples();
  }, [drawSamples]);

  const handleAuto = useCallback(() => {
    if (autoRef.current) {
      stopAuto();
      return;
    }
    autoRef.current = true;
    setAuto(true);
    const tick = () => {
      if (!autoRef.current) return;
      drawSamples();
      timerRef.current = setTimeout(tick, AUTO_DELAY);
    };
    tick();
  }, [drawSamples, stopAuto]);

  const handleReset = useCallback(() => {
    stopAuto();
    setSamples([]);
  }, [stopAuto]);

  const stats = useMemo(() => {
    const n = samples.length;
    if (n === 0) return { n: 0, mean: 0, sd: 0 };
    let s = 0;
    for (let i = 0; i < n; i++) s += samples[i].x;
    const mean = s / n;
    let v = 0;
    for (let i = 0; i < n; i++) {
      const d = samples[i].x - mean;
      v += d * d;
    }
    const sd = n > 1 ? Math.sqrt(v / (n - 1)) : 0;
    return { n, mean, sd };
  }, [samples]);

  const histogram = useMemo(() => {
    if (samples.length === 0) return [];
    const bins = new Array(HIST_BINS).fill(0);
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i].x;
      if (x < X_MIN || x >= X_MAX) continue;
      const idx = Math.min(HIST_BINS - 1, Math.floor((x - X_MIN) / BIN_W));
      bins[idx] += 1;
    }
    // normalize as density: count / (n * binWidth)
    const n = samples.length;
    return bins.map((c, i) => ({
      x0: X_MIN + i * BIN_W,
      x1: X_MIN + (i + 1) * BIN_W,
      density: c / (n * BIN_W),
      count: c,
    }));
  }, [samples]);

  const yAxisBase = yToPx(0);

  const xTicks = [-6, -4, -2, 0, 2, 4, 6];

  // Bounded sample dot positions: keep them inside plot area.
  const sampleDots = useMemo(() => {
    const out = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      if (s.x < X_MIN || s.x > X_MAX) continue;
      const px = xToPx(s.x);
      // Place dots in the lower 18px strip above the axis, jitter by stored y.
      const stripTop = yAxisBase - 16;
      const stripH = 12;
      const dy = stripTop + s.y * stripH;
      out.push({ px, py: dy });
    }
    return out;
  }, [samples, yAxisBase]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="gauss-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gauss-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hue-violet)" />
              <stop offset="50%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="gauss-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* sigma bands (drawn widest first so inner bands sit on top) */}
          {shade3 && <path d={shade3} fill="var(--accent)" opacity="0.05" />}
          {shade2 && <path d={shade2} fill="var(--accent)" opacity="0.10" />}
          {shade1 && <path d={shade1} fill="var(--accent)" opacity="0.20" />}

          {/* sigma boundary lines */}
          {[-3, -2, -1, 1, 2, 3].map((k) => {
            const x = mu + k * sigma;
            if (x <= X_MIN || x >= X_MAX) return null;
            const px = xToPx(x);
            const top = yToPx(Math.min(pdf(x, mu, sigma), Y_MAX));
            return (
              <line
                key={`b${k}`}
                x1={px}
                y1={top}
                x2={px}
                y2={yAxisBase}
                stroke="var(--accent)"
                strokeWidth="0.8"
                strokeDasharray="2 3"
                opacity="0.45"
              />
            );
          })}

          {/* histogram bars */}
          {histogram.map((b, i) => {
            if (b.count === 0) return null;
            const x0 = xToPx(b.x0);
            const x1 = xToPx(b.x1);
            const yTop = yToPx(Math.min(b.density, Y_MAX));
            const h = yAxisBase - yTop;
            if (h <= 0) return null;
            return (
              <rect
                key={`hb${i}`}
                x={x0 + 0.5}
                y={yTop}
                width={Math.max(0, x1 - x0 - 1)}
                height={h}
                rx="1.5"
                fill="var(--hue-pink)"
                opacity="0.34"
              />
            );
          })}

          {/* axes */}
          <line x1={PAD_L} y1={yAxisBase} x2={W - PAD_R} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yAxisBase} stroke="var(--border)" strokeWidth="1" />

          {/* x ticks */}
          {xTicks.map((tx) => {
            const px = xToPx(tx);
            return (
              <g key={`xt${tx}`}>
                <line x1={px} y1={yAxisBase} x2={px} y2={yAxisBase + 4} stroke="var(--border)" strokeWidth="1" />
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

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yAxisBase + 24}
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

          {/* sample dots strip */}
          {sampleDots.map((d, i) => (
            <circle
              key={`sd${i}`}
              cx={d.px}
              cy={d.py}
              r="1.4"
              fill="var(--hue-sky, #5ecbff)"
              opacity="0.65"
            />
          ))}

          {/* bell curve */}
          <path d={curvePath} fill="url(#gauss-fill)" />
          <path
            d={curvePath}
            fill="none"
            stroke="url(#gauss-stroke)"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#gauss-glow)"
            opacity="0.55"
          />
          <path
            d={curvePath}
            fill="none"
            stroke="url(#gauss-stroke)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* mean marker */}
          {mu >= X_MIN && mu <= X_MAX && (
            <g>
              <line
                x1={xToPx(mu)}
                y1={yToPx(Math.min(pdf(mu, mu, sigma), Y_MAX))}
                x2={xToPx(mu)}
                y2={yAxisBase}
                stroke="var(--accent)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
                opacity="0.75"
              />
              <text
                x={xToPx(mu)}
                y={PAD_T - 3}
                fontSize="10"
                fill="var(--accent)"
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
                textAnchor="middle"
                fontWeight="700"
              >
                μ
              </text>
            </g>
          )}

          {/* percentage labels above sigma bands */}
          {(() => {
            const labels = [];
            const yLabel2 = yToPx(pdf(mu + 2 * sigma, mu, sigma)) - 6;
            const yLabel3 = yToPx(pdf(mu + 3 * sigma, mu, sigma)) - 6;
            const pushLbl = (x, y, txt, key) => {
              if (x <= X_MIN + 0.2 || x >= X_MAX - 0.2) return;
              labels.push(
                <text
                  key={key}
                  x={xToPx(x)}
                  y={Math.max(PAD_T + 8, y)}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {txt}
                </text>
              );
            };
            pushLbl(mu, yToPx(pdf(mu, mu, sigma)) + 16, '68%', 'l1');
            pushLbl(mu + 1.5 * sigma, yLabel2, '95%', 'l2');
            pushLbl(mu + 2.5 * sigma, yLabel3, '99.7%', 'l3');
            return labels;
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">μ mean</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={mu}
              onChange={(e) => setMu(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(mu, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">σ stddev</span>
            <input
              type="range"
              min="0.3"
              max="3.0"
              step="0.05"
              value={sigma}
              onChange={(e) => setSigma(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(sigma, 2)}</span>
          </label>
        </div>

        <div className="mlviz-statcol gv-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">true μ / σ / σ²</span>
            <span className="mlviz-statcard-val">
              {snap(mu, 2)} · {snap(sigma, 2)} · {snap(sigma * sigma, 3)}
            </span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">sample n = {stats.n}</span>
            {stats.n > 0 ? (
              <>
                <span className="mlviz-statcard-val">
                  x̄ {snap(stats.mean, 3)} · s {snap(stats.sd, 3)}
                </span>
                <span className="gv-card-sub">
                  Δμ {snap(stats.mean - mu, 3)} · Δσ {snap(stats.sd - sigma, 3)}
                </span>
              </>
            ) : (
              <span className="mlviz-statcard-val gv-card-muted">draw to compare</span>
            )}
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleSample}
            disabled={auto}
          >
            <Plus size={13} />
            <span>Sample 50</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleAuto}
          >
            {auto ? <Square size={13} /> : <Play size={13} />}
            <span>{auto ? 'Stop' : 'Auto'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={samples.length === 0 && !auto}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">68 / 95 / 99.7 within ±1, ±2, ±3 sigma</div>
      </div>
    </div>
  );
}
