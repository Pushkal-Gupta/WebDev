import React, { useMemo, useState, useCallback } from 'react';
import { Activity, Layers, Shuffle } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

const W = 740;
const H = 360;
const N_TRIALS = 240; // independent runs to build the histogram
const N_BINS = 28;

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Target: E[f(X)] where X ~ Uniform(0,1) and f(x) = exp(x).
// Closed form: integral_0^1 e^x dx = e - 1 ≈ 1.71828.
const TRUE_MU = Math.exp(1) - 1;
// Control variate Y = X with known mean E[X] = 0.5.
// Estimator: f(X) - c*(X - 0.5), with optimal c ≈ Cov(f(X), X)/Var(X).
// For f=e^x, X~U[0,1]: Var(X)=1/12; Cov = E[X·e^X] - E[X]E[e^X]
// E[X·e^X] = e (by parts) ... actually = e - (e-1) = 1. Let's compute numerically.
// We'll just compute c analytically at runtime via sampling estimate.

function fOf(x) {
  return Math.exp(x);
}

function runTrials(rng, n, useCV, c) {
  // Run N_TRIALS independent estimates of mu using n samples each
  const ests = new Array(N_TRIALS);
  for (let t = 0; t < N_TRIALS; t++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      const x = rng();
      const fx = fOf(x);
      const adj = useCV ? c * (x - 0.5) : 0;
      sum += fx - adj;
    }
    ests[t] = sum / n;
  }
  return ests;
}

function variance(arr) {
  if (arr.length === 0) return 0;
  const mu = arr.reduce((a, b) => a + b, 0) / arr.length;
  let v = 0;
  for (const x of arr) v += (x - mu) * (x - mu);
  return v / arr.length;
}

function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Empirically, optimal c for f=e^x, X~U[0,1]:
// c* = Cov(f(X), X) / Var(X)
// E[X e^X] = 1, E[X] = 1/2, E[e^X] = e - 1
// Cov = 1 - 0.5 * (e - 1) ≈ 1 - 0.5 * 1.71828 = 0.1409
// Var(X) = 1/12 ≈ 0.0833
// c* ≈ 0.1409 / 0.0833 ≈ 1.691
const OPTIMAL_C = (1 - 0.5 * (Math.exp(1) - 1)) / (1 / 12);

function buildHist(estimates, lo, hi) {
  const bins = new Array(N_BINS).fill(0);
  const width = (hi - lo) / N_BINS;
  for (const e of estimates) {
    const idx = Math.max(0, Math.min(N_BINS - 1, Math.floor((e - lo) / width)));
    bins[idx]++;
  }
  return bins;
}

export default function VarianceReductionViz() {
  const [nSamples, setNSamples] = useState(100);
  const [useCV, setUseCV] = useState(true);
  const [seed, setSeed] = useState(42);

  // Two distinct RNGs so vanilla and CV use independent streams,
  // letting us compare distributions cleanly.
  const rngVanilla = useMemo(() => mulberry32(seed * 7919), [seed]);
  const rngCV = useMemo(() => mulberry32(seed * 7919 + 1009), [seed]);

  const vanillaEsts = useMemo(() => runTrials(rngVanilla, nSamples, false, 0), [rngVanilla, nSamples]);
  const cvEsts = useMemo(
    () => runTrials(rngCV, nSamples, true, OPTIMAL_C),
    [rngCV, nSamples]
  );

  const varV = variance(vanillaEsts);
  const varCV = variance(cvEsts);
  const meanV = mean(vanillaEsts);
  const meanCV = mean(cvEsts);
  const ratio = varCV > 1e-12 ? varV / varCV : Infinity;

  // bin range — center on TRUE_MU
  const range = Math.max(0.06, Math.sqrt(varV) * 4);
  const lo = TRUE_MU - range;
  const hi = TRUE_MU + range;

  const histV = useMemo(() => buildHist(vanillaEsts, lo, hi), [vanillaEsts, lo, hi]);
  const histCV = useMemo(() => buildHist(cvEsts, lo, hi), [cvEsts, lo, hi]);
  const maxCount = Math.max(...histV, ...histCV, 1);

  const reseed = useCallback(() => setSeed((s) => (s * 1103515245 + 12345) % 0x7fffffff), []);

  // layout: two side-by-side histograms
  const PAD_L = 36;
  const PAD_R = 18;
  const PANEL_TOP = 40;
  const PANEL_H = 220;
  const PANEL_GAP = 24;
  const PANEL_W = (W - PAD_L - PAD_R - PANEL_GAP) / 2;
  const BIN_W = PANEL_W / N_BINS;

  function renderPanel(originX, label, hist, color, m, v, active) {
    const baselineY = PANEL_TOP + PANEL_H - 22;
    // True mu line x-position
    const trueX = originX + ((TRUE_MU - lo) / (hi - lo)) * PANEL_W;
    const meanX = originX + ((m - lo) / (hi - lo)) * PANEL_W;
    return (
      <g>
        <text
          x={originX}
          y={PANEL_TOP - 14}
          fontSize="10"
          fontFamily="var(--mono)"
          fill="var(--text-dim)"
          letterSpacing="0.14em"
        >
          {label}
        </text>
        <text
          x={originX + PANEL_W}
          y={PANEL_TOP - 14}
          fontSize="9"
          fontFamily="var(--mono)"
          fill={color}
          textAnchor="end"
          fontWeight="700"
        >
          {active ? 'active' : 'baseline'}
        </text>
        <rect
          x={originX}
          y={PANEL_TOP - 4}
          width={PANEL_W}
          height={PANEL_H}
          fill="var(--bg)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="8"
          opacity="0.55"
        />
        <line
          x1={originX + 4}
          y1={baselineY}
          x2={originX + PANEL_W - 4}
          y2={baselineY}
          stroke="var(--border)"
          strokeWidth="1"
        />
        {/* bars */}
        {hist.map((cnt, i) => {
          const h = (cnt / maxCount) * (PANEL_H - 48);
          const x = originX + i * BIN_W;
          return (
            <rect
              key={i}
              x={x + 0.4}
              y={baselineY - h}
              width={BIN_W - 0.8}
              height={Math.max(0, h)}
              fill={color}
              opacity={0.7}
              rx="1.5"
            />
          );
        })}
        {/* true mu vertical */}
        <line
          x1={trueX}
          y1={PANEL_TOP + 4}
          x2={trueX}
          y2={baselineY}
          stroke="var(--accent)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
        <text
          x={trueX + 4}
          y={PANEL_TOP + 14}
          fontSize="9"
          fontFamily="var(--mono)"
          fill="var(--accent)"
          letterSpacing="0.08em"
        >
          μ={TRUE_MU.toFixed(3)}
        </text>
        {/* estimator mean tick */}
        <line
          x1={meanX}
          y1={baselineY - 4}
          x2={meanX}
          y2={baselineY + 6}
          stroke={color}
          strokeWidth="2"
        />
        <text
          x={originX + PANEL_W / 2}
          y={baselineY + 22}
          fontSize="9"
          fontFamily="var(--mono)"
          fill="var(--text-dim)"
          textAnchor="middle"
          letterSpacing="0.08em"
        >
          {`mean=${m.toFixed(4)}  •  var=${v.toExponential(2)}`}
        </text>
      </g>
    );
  }

  const formulaHtml = useMemo(() => katexHtml('\\hat{\\mu}_{CV} = \\frac{1}{n}\\sum_i f(X_i) - c(X_i - E[X])', false), []);
  const optHtml = useMemo(() => katexHtml('c^{*} = \\frac{\\text{Cov}(f(X), X)}{\\text{Var}(X)}', false), []);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {renderPanel(
            PAD_L,
            'VANILLA MC',
            histV,
            'var(--hue-pink)',
            meanV,
            varV,
            !useCV
          )}
          {renderPanel(
            PAD_L + PANEL_W + PANEL_GAP,
            'CONTROL VARIATE',
            histCV,
            'var(--hue-mint)',
            meanCV,
            varCV,
            useCV
          )}
          <text
            x={W / 2}
            y={H - 12}
            fontSize="9.5"
            fontFamily="var(--mono)"
            fill="var(--text-dim)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            {N_TRIALS} independent estimates · target f(X)=e^X, X~U(0,1)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Layers size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              # samples n
            </span>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={nSamples}
              onChange={(e) => setNSamples(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{nSamples}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <div className="mlviz-toggles" style={{ border: 'none', padding: 0, background: 'transparent' }}>
            <button
              type="button"
              className={`mlviz-toggle ${!useCV ? 'is-on' : ''}`}
              onClick={() => setUseCV(false)}
            >
              <Activity size={11} />
              <span>vanilla MC</span>
              <span className="mlviz-toggle-dot" />
            </button>
            <button
              type="button"
              className={`mlviz-toggle ${useCV ? 'is-on' : ''}`}
              onClick={() => setUseCV(true)}
            >
              <Activity size={11} />
              <span>control variate (X, known E[X]=0.5)</span>
              <span className="mlviz-toggle-dot" />
            </button>
          </div>
          <button type="button" className="mlviz-btn" onClick={reseed}>
            <Shuffle size={13} />
            <span>Reseed</span>
          </button>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">var(MC)</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              {varV.toExponential(2)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">var(CV)</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-mint)' }}>
              {varCV.toExponential(2)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">ratio</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {Number.isFinite(ratio) ? `${ratio.toFixed(2)}×` : '∞'}
            </span>
            <span className="mlviz-sub">variance reduction</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="mlviz-tag">c*</span>
            <span className="mlviz-val">{OPTIMAL_C.toFixed(3)}</span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span
            className="ml-imath"
            style={{ fontSize: '0.82rem' }}
            dangerouslySetInnerHTML={{ __html: formulaHtml }}
          />
          <span
            className="ml-imath"
            style={{ fontSize: '0.82rem' }}
            dangerouslySetInnerHTML={{ __html: optHtml }}
          />
        </div>

        <div className="mlviz-hint">
          subtracting a correlated control with known mean cuts variance without biasing the estimate
        </div>
      </div>
    </div>
  );
}
