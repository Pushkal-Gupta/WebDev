import React, { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { TrendingUp, Play, Pause, RotateCcw, Sigma } from 'lucide-react';
import './PsLinearRegressionViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard normal via Box-Muller, driven by the seeded rng.
function gauss(rng) {
  const u = Math.max(1e-9, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const PRESETS = {
  rising: { label: 'Rising trend', slope: 1.9, intercept: 1.0, count: 22 },
  gentle: { label: 'Gentle slope', slope: 0.7, intercept: 4.0, count: 22 },
  falling: { label: 'Falling trend', slope: -1.3, intercept: 11.0, count: 22 },
};
const PRESET_ORDER = ['rising', 'gentle', 'falling'];
const DEFAULTS = { preset: 'rising', noise: 1.4, seed: 7 };
const X_MIN = 0;
const X_MAX = 10;
const Y_MIN = 0;
const Y_MAX = 16;

// Deterministic noisy linear cloud on [X_MIN, X_MAX].
function buildPoints(preset, noise, seed) {
  const rng = mulberry32(seed);
  const { slope, intercept, count } = PRESETS[preset];
  const pts = [];
  for (let i = 0; i < count; i++) {
    const x = X_MIN + ((i + 0.5) / count) * (X_MAX - X_MIN) + (rng() - 0.5) * 0.4;
    const y = intercept + slope * x + gauss(rng) * noise;
    pts.push({ x, y: Math.max(Y_MIN, Math.min(Y_MAX, y)) });
  }
  return pts;
}

// Closed-form least squares + R^2 in one pass.
function fit(points) {
  const n = points.length;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (const p of points) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x; syy += p.y * p.y;
  }
  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  const ssTot = syy - (sy * sy) / n;
  const ssRes = points.reduce((acc, p) => {
    const e = p.y - (intercept + slope * p.x);
    return acc + e * e;
  }, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, r2, ssRes, ssTot, xbar: sx / n, ybar: sy / n };
}

// SS_res for an arbitrary candidate line (used during the animation).
function residualSum(points, slope, intercept) {
  return points.reduce((acc, p) => {
    const e = p.y - (intercept + slope * p.x);
    return acc + e * e;
  }, 0);
}

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function PsLinearRegressionViz() {
  const [reduced] = useState(prefersReduced);

  const [preset, setPreset] = useState(DEFAULTS.preset);
  const [noise, setNoise] = useState(DEFAULTS.noise);
  const [seed, setSeed] = useState(DEFAULTS.seed);
  // reduced motion: skip the animation, render the final fit (progress = 1).
  const [progress, setProgress] = useState(reduced ? 1 : 0);
  const [playing, setPlaying] = useState(!reduced);

  const rafRef = useRef(0);
  const startRef = useRef(0);

  const points = useMemo(() => buildPoints(preset, noise, seed), [preset, noise, seed]);
  const best = useMemo(() => fit(points), [points]);

  // A deliberately poor starting line: flat through the mean of y.
  const start = useMemo(() => ({ slope: 0, intercept: best.ybar }), [best.ybar]);

  const DURATION = 1400;

  // Auto-play the fitting animation on mount and whenever play is (re)triggered.
  useEffect(() => {
    if (reduced || !playing) return undefined;
    let active = true;
    startRef.current = 0;
    const tick = (ts) => {
      if (!active) return;
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / DURATION);
      setProgress(t);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing, reduced, preset, noise, seed]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const replay = () => {
    if (reduced) return;
    setProgress(0);
    setPlaying(true);
  };
  const togglePlay = () => {
    if (reduced) return;
    if (progress >= 1) {
      replay();
    } else {
      setPlaying((p) => !p);
    }
  };
  const reset = () => {
    cancelAnimationFrame(rafRef.current);
    setPreset(DEFAULTS.preset);
    setNoise(DEFAULTS.noise);
    setSeed(DEFAULTS.seed);
    setProgress(reduced ? 1 : 0);
    setPlaying(!reduced);
  };

  // Eased interpolation from the poor guess toward the optimal fit.
  const eased = easeInOut(progress);
  const slope = start.slope + (best.slope - start.slope) * eased;
  const intercept = start.intercept + (best.intercept - start.intercept) * eased;
  const ssRes = residualSum(points, slope, intercept);
  const r2 = best.ssTot === 0 ? 0 : 1 - ssRes / best.ssTot;

  const fmt = (x) => (Math.abs(x) < 1e-9 ? '0' : x.toFixed(2));

  // ---- plot geometry ----
  const W = 460;
  const H = 300;
  const pad = 30;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sx = (x) => pad + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const sy = (y) => pad + plotH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;

  const lineY = (x) => intercept + slope * x;
  const lx1 = sx(X_MIN);
  const ly1 = sy(Math.max(Y_MIN, Math.min(Y_MAX, lineY(X_MIN))));
  const lx2 = sx(X_MAX);
  const ly2 = sy(Math.max(Y_MIN, Math.min(Y_MAX, lineY(X_MAX))));

  const playLabel = playing && progress < 1 ? 'Pause' : 'Play';

  return (
    <div className="pslr">
      <div className="pslr-head">
        <div className="pslr-head-icon"><TrendingUp size={18} /></div>
        <div className="pslr-head-text">
          <h3 className="pslr-title">Least squares: fitting the best line</h3>
          <p className="pslr-sub">
            The line eases from a flat guess toward{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\hat{y}=\\beta_0+\\beta_1 x') }} />, the fit that
            minimizes the sum of squared residuals. Watch the vertical misses shrink and{' '}
            <span dangerouslySetInnerHTML={{ __html: km('R^2') }} /> climb.
          </p>
        </div>
        <div className="pslr-head-btns">
          <button type="button" className="pslr-btn" onClick={togglePlay}>
            {playLabel === 'Pause' ? <Pause size={14} /> : <Play size={14} />} {playLabel}
          </button>
          <button type="button" className="pslr-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="pslr-chips">
        {PRESET_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`pslr-chip${preset === key ? ' pslr-chip-on' : ''}`}
            onClick={() => { setPreset(key); replay(); }}
          >
            {PRESETS[key].label}
          </button>
        ))}
      </div>

      <div className="pslr-controls">
        <label className="pslr-slider">
          <span className="pslr-slider-key">scatter (noise)</span>
          <input
            type="range"
            min="0.2"
            max="3.2"
            step="0.1"
            value={noise}
            onChange={(e) => { setNoise(parseFloat(e.target.value)); replay(); }}
          />
          <span className="pslr-slider-val">{noise.toFixed(1)}</span>
        </label>
        <label className="pslr-slider">
          <span className="pslr-slider-key">fit progress</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => {
              cancelAnimationFrame(rafRef.current);
              setPlaying(false);
              setProgress(parseFloat(e.target.value));
            }}
          />
          <span className="pslr-slider-val">{Math.round(progress * 100)}%</span>
        </label>
      </div>

      <div className="pslr-panel">
        <svg viewBox={`0 0 ${W} ${H}`} className="pslr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="pslr-line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="pslr-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <line x1={pad} y1={pad + plotH} x2={pad + plotW} y2={pad + plotH} className="pslr-axis" />
          <line x1={pad} y1={pad} x2={pad} y2={pad + plotH} className="pslr-axis" />

          {/* residual segments: vertical miss from each point to the line */}
          {points.map((p, i) => {
            const yhat = Math.max(Y_MIN, Math.min(Y_MAX, lineY(p.x)));
            return (
              <line
                key={`r${i}`}
                x1={sx(p.x)}
                y1={sy(p.y)}
                x2={sx(p.x)}
                y2={sy(yhat)}
                className="pslr-residual"
              />
            );
          })}

          {/* mean point the line pivots through */}
          <line
            x1={sx(best.xbar)}
            y1={pad}
            x2={sx(best.xbar)}
            y2={pad + plotH}
            className="pslr-meanline"
          />

          <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} className="pslr-line-glow" filter="url(#pslr-glow)" />
          <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} className="pslr-line" />

          {points.map((p, i) => (
            <circle key={`p${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3.4} className="pslr-point" />
          ))}

          <circle cx={sx(best.xbar)} cy={sy(best.ybar)} r={4.4} className="pslr-centroid" />
        </svg>
      </div>

      <div className="pslr-stats">
        <div className="pslr-statcard pslr-accent">
          <span className="pslr-stat-label">slope</span>
          <span className="pslr-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\beta_1 = ${fmt(slope)}`) }} />
          <span className="pslr-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\text{best } ${fmt(best.slope)}`) }} />
        </div>
        <div className="pslr-statcard pslr-violet">
          <span className="pslr-stat-label">intercept</span>
          <span className="pslr-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\beta_0 = ${fmt(intercept)}`) }} />
          <span className="pslr-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\text{best } ${fmt(best.intercept)}`) }} />
        </div>
        <div className="pslr-statcard">
          <span className="pslr-stat-label">sum of sq. residuals</span>
          <span className="pslr-stat-val" dangerouslySetInnerHTML={{ __html: km('\\mathrm{SS}_{\\text{res}}') }} />
          <span className="pslr-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= ${fmt(ssRes)}`) }} />
        </div>
        <div className="pslr-statcard pslr-mint">
          <span className="pslr-stat-label">variance explained</span>
          <span className="pslr-stat-val" dangerouslySetInnerHTML={{ __html: km(`R^2 = ${fmt(r2)}`) }} />
          <span className="pslr-stat-sub" dangerouslySetInnerHTML={{ __html: km('1-\\dfrac{\\mathrm{SS}_{\\text{res}}}{\\mathrm{SS}_{\\text{tot}}}') }} />
        </div>
      </div>

      <div className="pslr-trace">
        <span className="pslr-trace-label"><Sigma size={12} /> reading</span>
        <span className="pslr-trace-body">
          {progress < 0.99
            ? `The line starts flat (slope 0) through the mean ${fmt(best.ybar)} of y — a poor guess that ignores x. As it eases toward the least-squares fit, the vertical residual sticks shrink and SS_res falls from its flat-line value toward ${fmt(best.ssRes)}.`
            : `Settled. The least-squares line is y = ${fmt(best.intercept)} + ${fmt(best.slope)}x, passing through the mean point (${fmt(best.xbar)}, ${fmt(best.ybar)}). It explains R^2 = ${fmt(best.r2)} of the scatter; raise the noise slider and the cloud loosens, residuals grow, and R^2 drops even though the slope stays close.`}
        </span>
      </div>
    </div>
  );
}
