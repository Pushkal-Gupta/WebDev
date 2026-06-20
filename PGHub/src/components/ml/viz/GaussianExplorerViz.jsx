import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Sigma, RotateCcw } from 'lucide-react';
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
const SAMPLES = 200;

const Y_MAX = 0.85; // tall enough for sigma down to ~0.5

function pdf(x, mu, sigma) {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

// Abramowitz & Stegun 7.1.26 erf approximation (deterministic, ~1e-7 accurate).
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}
function cdf(x, mu, sigma) {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.SQRT2)));
}

const DEFAULT_MU = 0;
const DEFAULT_SIGMA = 1.2;
const DEFAULT_XM = 1.4;

function fmt(v, p = 4) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

export default function GaussianExplorerViz({ mu = DEFAULT_MU, sigma = DEFAULT_SIGMA }) {
  const initMu = Number.isFinite(mu) ? mu : DEFAULT_MU;
  const initSigma = Number.isFinite(sigma) ? sigma : DEFAULT_SIGMA;

  const [mean, setMean] = useState(initMu);
  const [std, setStd] = useState(initSigma);
  const [xMark, setXMark] = useState(DEFAULT_XM);

  const svgRef = useRef(null);
  const dragMeanRef = useRef(false);
  const dragXRef = useRef(false);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sx = useCallback(
    (x) => LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W,
    []
  );
  const sy = useCallback(
    (y) => TOP + (1 - y / Y_MAX) * PLOT_H,
    []
  );

  const { fPath, fArea, bandPaths } = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      const yc = Math.min(Y_MAX, pdf(x, mean, std));
      pts.push([x, yc]);
    }
    const line = 'M' + pts.map(([x, y]) => `${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' L');

    const buildBand = (lo, hi) => {
      const inside = pts.filter(([x]) => x >= lo && x <= hi);
      if (!inside.length) return '';
      const top = inside.map(([x, y]) => `${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' L');
      return (
        `M${sx(lo).toFixed(2)},${sy(0).toFixed(2)} L` +
        top +
        ` L${sx(hi).toFixed(2)},${sy(0).toFixed(2)} Z`
      );
    };

    const area = buildBand(X_MIN, X_MAX);
    const bands = {
      two: buildBand(mean - 2 * std, mean + 2 * std),
      one: buildBand(mean - std, mean + std),
    };
    return { fPath: line, fArea: area, bandPaths: bands };
  }, [mean, std, sx, sy]);

  const pdfAtX = pdf(xMark, mean, std);
  const cdfAtX = cdf(xMark, mean, std);

  const xMarkScr = sx(xMark);
  const meanScr = sx(mean);
  const peakY = sy(pdf(mean, mean, std));

  const pointTransition = reducedMotion ? 'none' : 'cx 0.07s ease-out, cy 0.07s ease-out';

  const clientToX = useCallback((clientX) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    let xVal = X_MIN + ((svgX - LEFT) / PLOT_W) * (X_MAX - X_MIN);
    xVal = Math.max(X_MIN, Math.min(X_MAX, xVal));
    return Math.round(xVal * 100) / 100;
  }, []);

  const onPointerDown = useCallback(
    (e) => {
      const x = clientToX(e.clientX);
      if (x === null) return;
      // grab whichever handle is closer
      if (Math.abs(x - mean) <= Math.abs(x - xMark)) {
        dragMeanRef.current = true;
      } else {
        dragXRef.current = true;
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (dragMeanRef.current) setMean(x);
      else setXMark(x);
    },
    [clientToX, mean, xMark]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragMeanRef.current && !dragXRef.current) return;
      const x = clientToX(e.clientX);
      if (x === null) return;
      if (dragMeanRef.current) setMean(x);
      else setXMark(x);
    },
    [clientToX]
  );
  const onPointerUp = useCallback((e) => {
    dragMeanRef.current = false;
    dragXRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setMean(initMu);
    setStd(initSigma);
    setXMark(DEFAULT_XM);
  }, [initMu, initSigma]);

  const xTicks = [-6, -4, -2, 0, 2, 4, 6];
  const yBase = sy(0);

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Sigma size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Gaussian explorer</span>
          <span className="aev-head-sub">
            drag the peak to move μ, drag the marker to read pdf/cdf · slide σ to widen the bell
          </span>
        </span>
        <span className="aev-chip">x = {fmt(xMark, 2)}</span>
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
              <linearGradient id="ge-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-violet)" />
                <stop offset="50%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-pink)" />
              </linearGradient>
              <linearGradient id="ge-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.18)" />
                <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0)" />
              </linearGradient>
              <filter id="ge-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* x grid + ticks */}
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

            {/* baseline */}
            <line
              x1={LEFT}
              y1={yBase}
              x2={LEFT + PLOT_W}
              y2={yBase}
              stroke="var(--border)"
              strokeWidth="1"
            />

            {/* total area faint, then ±2σ, then ±1σ stacked darker */}
            <path d={fArea} fill="url(#ge-fill)" opacity="0.5" />
            <path d={bandPaths.two} fill="var(--hue-violet)" opacity="0.1" />
            <path d={bandPaths.one} fill="var(--accent)" opacity="0.16" />

            {/* sigma boundary markers */}
            {[-2, -1, 1, 2].map((k) => {
              const xv = mean + k * std;
              if (xv < X_MIN || xv > X_MAX) return null;
              const yv = pdf(xv, mean, std);
              return (
                <line
                  key={`sig-${k}`}
                  x1={sx(xv)}
                  y1={sy(yv)}
                  x2={sx(xv)}
                  y2={yBase}
                  stroke="var(--text-dim)"
                  strokeWidth="0.7"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
              );
            })}

            {/* cdf shaded region up to xMark (P(X<=x)) */}
            {(() => {
              const lo = X_MIN;
              const hi = Math.max(X_MIN, Math.min(X_MAX, xMark));
              const pts = [];
              const n = 80;
              for (let i = 0; i <= n; i++) {
                const x = lo + (i / n) * (hi - lo);
                pts.push(`${sx(x).toFixed(2)},${sy(Math.min(Y_MAX, pdf(x, mean, std))).toFixed(2)}`);
              }
              const d =
                `M${sx(lo).toFixed(2)},${sy(0).toFixed(2)} L` +
                pts.join(' L') +
                ` L${sx(hi).toFixed(2)},${sy(0).toFixed(2)} Z`;
              return <path d={d} fill="var(--hue-mint)" opacity="0.22" />;
            })()}

            {/* glow under pdf */}
            <path
              d={fPath}
              fill="none"
              stroke="url(#ge-grad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#ge-glow)"
              opacity="0.55"
            />
            {/* main pdf curve */}
            <path
              d={fPath}
              fill="none"
              stroke="url(#ge-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* mean vertical line + draggable peak handle */}
            <line
              x1={meanScr}
              y1={peakY}
              x2={meanScr}
              y2={yBase}
              stroke="var(--accent)"
              strokeWidth="0.9"
              strokeDasharray="4 3"
              opacity="0.7"
            />
            <circle
              cx={meanScr}
              cy={peakY}
              r="11"
              fill="rgba(var(--accent-rgb), 0.16)"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={meanScr}
              cy={peakY}
              r="4.2"
              fill="var(--accent)"
              style={{ transition: pointTransition, cursor: 'grab' }}
            />
            <text
              x={meanScr}
              y={peakY - 9}
              fontSize="8.5"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              μ
            </text>

            {/* x marker line + draggable readoff dot on the curve */}
            <line
              x1={xMarkScr}
              y1={sy(Math.min(Y_MAX, pdfAtX))}
              x2={xMarkScr}
              y2={yBase}
              stroke="var(--hue-mint)"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.85"
            />
            <circle
              cx={xMarkScr}
              cy={sy(Math.min(Y_MAX, pdfAtX))}
              r="9"
              fill="rgba(var(--accent-rgb), 0.14)"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={xMarkScr}
              cy={sy(Math.min(Y_MAX, pdfAtX))}
              r="3.8"
              fill="var(--hue-mint)"
              style={{ transition: pointTransition, cursor: 'grab' }}
            />

            {/* y labels */}
            <text
              x={LEFT - 8}
              y={TOP + 4}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {fmt(Y_MAX, 2)}
            </text>
            <text
              x={LEFT - 8}
              y={yBase}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              0
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">mean μ</span>
            <span className="mlviz-statcard-val">{fmt(mean, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">std σ</span>
            <span className="mlviz-statcard-val">{fmt(std, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">pdf(x)</span>
            <span className="mlviz-statcard-val">{fmt(pdfAtX, 3)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">cdf P(X≤x)</span>
            <span className="mlviz-statcard-val">{fmt(cdfAtX, 3)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">std σ</span>
          <input
            type="range"
            min="0.4"
            max="2.6"
            step="0.05"
            value={std}
            onChange={(e) => setStd(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{fmt(std, 2)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          mint band = P(X≤x) · darker shading is ±1σ (≈68%), lighter is ±2σ (≈95%)
        </div>
      </div>
    </div>
  );
}
