import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, ChevronRight, RefreshCw } from 'lucide-react';
import './MLViz.css';

const W = 460;
const H = 280;
const PAD_L = 36;
const PAD_R = 18;
const PAD_T = 28;
const PAD_B = 30;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const Y_MIN = -4;
const Y_MAX = 8;
const EPS = 1e-5;

const STEP_DELAY = 600;

const BATCH_OPTIONS = [4, 8, 16];

const STEP_LABELS = [
  { id: 0, label: 'INPUT',   blurb: 'mini-batch x' },
  { id: 1, label: 'STEP 1',  blurb: 'compute batch mean μ' },
  { id: 2, label: 'STEP 2',  blurb: 'compute batch variance σ²' },
  { id: 3, label: 'STEP 3',  blurb: 'normalize x̂ = (x − μ) / √(σ² + ε)' },
  { id: 4, label: 'STEP 4',  blurb: 'scale + shift y = γ·x̂ + β' },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Box–Muller sample from N(mean, std)
function gaussian(mean, std) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + std * z;
}

function generateBatch(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(gaussian(3, 2));
  return out;
}

function batchStats(arr) {
  const n = arr.length;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n;
  const std = Math.sqrt(variance);
  return { mean, variance, std };
}

function yToScreen(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

// pack histogram values into B equal bins over [Y_MIN, Y_MAX]
function histogram(values, bins) {
  const counts = new Array(bins).fill(0);
  const w = (Y_MAX - Y_MIN) / bins;
  for (const v of values) {
    if (v < Y_MIN || v > Y_MAX) continue;
    let idx = Math.floor((v - Y_MIN) / w);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx] += 1;
  }
  return counts;
}

function Axes({ stage }) {
  const lines = [];
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
        strokeWidth={y === 0 ? 1 : 0.35}
        opacity={y === 0 ? 0.85 : 0.45}
      />
    );
  }
  const yLabels = [];
  for (let y = Math.ceil(Y_MIN); y <= Math.floor(Y_MAX); y += 2) {
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
      {yLabels}
      <text
        x={PAD_L - 5}
        y={PAD_T - 8}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="end"
        letterSpacing="0.08em"
      >
        value
      </text>
      <text
        x={PAD_L + PLOT_W}
        y={PAD_T + PLOT_H + 18}
        fontSize="9"
        fill="var(--text-dim)"
        fontFamily="var(--mono, monospace)"
        textAnchor="end"
        letterSpacing="0.08em"
      >
        index in batch  ·  {stage}
      </text>
    </g>
  );
}

export default function BatchNormViz() {
  const [batchSize, setBatchSize] = useState(8);
  const [batch, setBatch] = useState(() => generateBatch(8));
  const [gamma, setGamma] = useState(1);
  const [beta, setBeta] = useState(0);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [showHist, setShowHist] = useState(true);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const handleRegenerate = useCallback(() => {
    clearTimer();
    setRunning(false);
    setStep(0);
    setBatch(generateBatch(batchSize));
  }, [batchSize]);

  const handleBatchSize = useCallback((n) => {
    clearTimer();
    setRunning(false);
    setStep(0);
    setBatchSize(n);
    setBatch(generateBatch(n));
  }, []);

  const handleStep = useCallback(() => {
    setStep((s) => (s >= 4 ? s : s + 1));
  }, []);

  const handleReset = useCallback(() => {
    clearTimer();
    setRunning(false);
    setStep(0);
  }, []);

  const handleRun = useCallback(() => {
    if (running) return;
    clearTimer();
    setRunning(true);
    let cur = step;
    const tick = () => {
      cur += 1;
      setStep(cur);
      if (cur >= 4) {
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    if (cur >= 4) {
      setRunning(false);
      return;
    }
    timerRef.current = setTimeout(tick, 60);
  }, [running, step]);

  // Stats
  const { mean: mu, variance: sigmaSq, std: sigma } = useMemo(() => batchStats(batch), [batch]);
  const normalized = useMemo(() => {
    const denom = Math.sqrt(sigmaSq + EPS);
    return batch.map((x) => (x - mu) / denom);
  }, [batch, mu, sigmaSq]);
  const affine = useMemo(() => normalized.map((xh) => gamma * xh + beta), [normalized, gamma, beta]);

  const postNormStats = useMemo(() => batchStats(normalized), [normalized]);
  const postAffineStats = useMemo(() => batchStats(affine), [affine]);

  // Visual stage value per bar — interpolated based on step
  const displayValues = useMemo(() => {
    // step 0 / 1 / 2 -> raw values
    // step 3 -> normalized
    // step 4 -> affine
    if (step <= 2) return batch.map((x) => x);
    if (step === 3) return normalized;
    return affine;
  }, [step, batch, normalized, affine]);

  // Track which mean / std markers to draw
  const showMean = step >= 1;
  const showStd  = step >= 2;
  const showZeroBand = step >= 3;
  const showAffineMarkers = step >= 4;

  // Bar layout
  const n = batch.length;
  const barW = Math.max(8, (PLOT_W - 16) / n - 6);
  const barGap = ((PLOT_W - 16) - barW * n) / (n + 1);
  const zeroSy = yToScreen(0);

  const stageLabel = STEP_LABELS[step]?.label || 'INPUT';
  const stageBlurb = STEP_LABELS[step]?.blurb || '';

  // For histogram overlay we use BEFORE (batch) and AFTER (affine when step==4, normalized when step==3, else batch)
  const afterValues = step >= 4 ? affine : step >= 3 ? normalized : null;

  const HIST_BINS = 18;
  const histBefore = useMemo(() => histogram(batch, HIST_BINS), [batch]);
  const histAfter  = useMemo(() => (afterValues ? histogram(afterValues, HIST_BINS) : null), [afterValues]);

  const histMax = useMemo(() => {
    const a = Math.max(1, ...histBefore);
    const b = histAfter ? Math.max(1, ...histAfter) : 1;
    return Math.max(a, b);
  }, [histBefore, histAfter]);

  const histX = PAD_L + PLOT_W - 96; // overlaid in top-right corner
  const histY = PAD_T + 6;
  const histW = 90;
  const histH = 56;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <linearGradient id="bn-bar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="bn-bar-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.2" />
            </filter>
            <filter id="bn-line-glow" x="-10%" y="-200%" width="120%" height="500%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>
          <Axes stage={stageBlurb} />

          {/* zero band post-normalization */}
          {showZeroBand && (
            <rect
              x={PAD_L}
              y={yToScreen(1)}
              width={PLOT_W}
              height={yToScreen(-1) - yToScreen(1)}
              fill="var(--hue-sky, #5ecbff)"
              opacity={0.07}
            />
          )}

          {/* σ band around μ */}
          {showStd && step < 3 && (
            <rect
              x={PAD_L}
              y={yToScreen(mu + sigma)}
              width={PLOT_W}
              height={yToScreen(mu - sigma) - yToScreen(mu + sigma)}
              fill="var(--hue-sky, #5ecbff)"
              opacity={0.09}
            />
          )}

          {/* σ band after affine: β ± γ */}
          {showAffineMarkers && (
            <rect
              x={PAD_L}
              y={yToScreen(beta + Math.abs(gamma))}
              width={PLOT_W}
              height={yToScreen(beta - Math.abs(gamma)) - yToScreen(beta + Math.abs(gamma))}
              fill="var(--hue-sky, #5ecbff)"
              opacity={0.08}
            />
          )}

          {/* μ line — raw mean (steps 1-2) */}
          {showMean && step < 3 && (
            <g>
              <line
                x1={PAD_L}
                y1={yToScreen(mu)}
                x2={PAD_L + PLOT_W}
                y2={yToScreen(mu)}
                stroke="var(--hue-sky, #5ecbff)"
                strokeWidth="1.6"
                strokeDasharray="5 3"
                filter="url(#bn-line-glow)"
              />
              <text
                x={PAD_L + PLOT_W - 4}
                y={yToScreen(mu) - 4}
                fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--hue-sky, #5ecbff)"
                textAnchor="end"
                fontWeight="700"
              >
                μ = {snap(mu)}
              </text>
            </g>
          )}

          {/* zero centerline post step 3 */}
          {showZeroBand && (
            <g>
              <line
                x1={PAD_L}
                y1={yToScreen(0)}
                x2={PAD_L + PLOT_W}
                y2={yToScreen(0)}
                stroke="var(--hue-sky, #5ecbff)"
                strokeWidth="1.4"
                strokeDasharray="4 3"
                filter="url(#bn-line-glow)"
              />
              {!showAffineMarkers && (
                <text
                  x={PAD_L + PLOT_W - 4}
                  y={yToScreen(0) - 4}
                  fontSize="10"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--hue-sky, #5ecbff)"
                  textAnchor="end"
                  fontWeight="700"
                >
                  μ ≈ 0  ·  σ ≈ 1
                </text>
              )}
            </g>
          )}

          {/* β line after affine */}
          {showAffineMarkers && (
            <g>
              <line
                x1={PAD_L}
                y1={yToScreen(beta)}
                x2={PAD_L + PLOT_W}
                y2={yToScreen(beta)}
                stroke="var(--hue-sky, #5ecbff)"
                strokeWidth="1.6"
                strokeDasharray="5 3"
                filter="url(#bn-line-glow)"
              />
              <text
                x={PAD_L + PLOT_W - 4}
                y={yToScreen(beta) - 4}
                fontSize="10"
                fontFamily="var(--mono, monospace)"
                fill="var(--hue-sky, #5ecbff)"
                textAnchor="end"
                fontWeight="700"
              >
                β = {snap(beta)}  ·  γ = {snap(gamma)}
              </text>
            </g>
          )}

          {/* Bars */}
          {displayValues.map((v, i) => {
            const cx = PAD_L + 8 + barGap + i * (barW + barGap);
            const top = Math.min(yToScreen(v), zeroSy);
            const bot = Math.max(yToScreen(v), zeroSy);
            const h = Math.max(1, bot - top);
            return (
              <g key={i}>
                <rect
                  x={cx}
                  y={top}
                  width={barW}
                  height={h}
                  rx={2}
                  ry={2}
                  fill="url(#bn-bar-grad)"
                  filter="url(#bn-bar-glow)"
                  opacity={0.45}
                  style={{ transition: 'all 0.45s ease' }}
                />
                <rect
                  x={cx}
                  y={top}
                  width={barW}
                  height={h}
                  rx={2}
                  ry={2}
                  fill="url(#bn-bar-grad)"
                  opacity={0.85}
                  style={{ transition: 'all 0.45s ease' }}
                />
                <text
                  x={cx + barW / 2}
                  y={v >= 0 ? top - 3 : bot + 9}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--text-dim)"
                  style={{ transition: 'all 0.45s ease' }}
                >
                  {snap(v, 1)}
                </text>
              </g>
            );
          })}

          {/* phase label top-left */}
          <text
            x={10}
            y={18}
            fontSize="10"
            fontFamily="var(--mono, monospace)"
            fill="var(--accent)"
            letterSpacing="0.14em"
            fontWeight="700"
          >
            {stageLabel}
          </text>
          <text
            x={10}
            y={H - 8}
            fontSize="9"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            fill="var(--text-dim)"
          >
            {stageBlurb}
          </text>

          {/* histogram overlay (top-right) */}
          {showHist && (
            <g transform={`translate(${histX}, ${histY})`}>
              <rect
                x={-4}
                y={-12}
                width={histW + 8}
                height={histH + 24}
                rx={4}
                ry={4}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth="0.8"
                opacity={0.92}
              />
              <text
                x={0}
                y={-2}
                fontSize="8"
                fontFamily="var(--mono, monospace)"
                fill="var(--text-dim)"
                letterSpacing="0.1em"
              >
                histogram
              </text>
              {/* baseline */}
              <line
                x1={0}
                y1={histH}
                x2={histW}
                y2={histH}
                stroke="var(--border)"
                strokeWidth="0.6"
              />
              {/* before bars */}
              {histBefore.map((c, i) => {
                const hb = (c / histMax) * (histH - 2);
                const bx = (i / HIST_BINS) * histW;
                const bw = histW / HIST_BINS - 0.6;
                return (
                  <rect
                    key={`hb${i}`}
                    x={bx}
                    y={histH - hb}
                    width={bw}
                    height={hb}
                    fill="var(--accent)"
                    opacity={histAfter ? 0.28 : 0.7}
                  />
                );
              })}
              {/* after bars */}
              {histAfter && histAfter.map((c, i) => {
                const hb = (c / histMax) * (histH - 2);
                const bx = (i / HIST_BINS) * histW;
                const bw = histW / HIST_BINS - 0.6;
                return (
                  <rect
                    key={`ha${i}`}
                    x={bx}
                    y={histH - hb}
                    width={bw}
                    height={hb}
                    fill="var(--hue-sky, #5ecbff)"
                    opacity={0.72}
                  />
                );
              })}
              <text
                x={0}
                y={histH + 12}
                fontSize="7"
                fontFamily="var(--mono, monospace)"
                fill="var(--accent)"
                letterSpacing="0.06em"
              >
                ■ before
              </text>
              {histAfter && (
                <text
                  x={42}
                  y={histH + 12}
                  fontSize="7"
                  fontFamily="var(--mono, monospace)"
                  fill="var(--hue-sky, #5ecbff)"
                  letterSpacing="0.06em"
                >
                  ■ after
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-toggles" role="tablist" aria-label="Batch size">
        <span className="mlviz-slider-label" style={{ alignSelf: 'center', marginRight: '0.25rem' }}>batch</span>
        {BATCH_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={batchSize === n}
            className={`mlviz-toggle${batchSize === n ? ' is-on' : ''}`}
            style={{ '--toggle-color': 'var(--accent)' }}
            onClick={() => handleBatchSize(n)}
            disabled={running}
          >
            <span className="mlviz-toggle-dot" />
            <span>N = {n}</span>
          </button>
        ))}
        <button
          type="button"
          className={`mlviz-toggle${showHist ? ' is-on' : ''}`}
          style={{ '--toggle-color': 'var(--hue-sky, #5ecbff)' }}
          onClick={() => setShowHist((v) => !v)}
          aria-pressed={showHist}
        >
          <span className="mlviz-toggle-dot" />
          <span>histogram</span>
        </button>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-statcol">
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">x · μ</span>
              <span className="mlviz-statcard-val">{snap(mu)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">x · σ²</span>
              <span className="mlviz-statcard-val">{snap(sigmaSq)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">x · σ</span>
              <span className="mlviz-statcard-val">{snap(sigma)}</span>
            </div>
          </div>
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">x̂ μ (→ 0)</span>
              <span className="mlviz-statcard-val">{snap(postNormStats.mean)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">x̂ σ (→ 1)</span>
              <span className="mlviz-statcard-val">{snap(postNormStats.std)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">y μ (→ β)</span>
              <span className="mlviz-statcard-val">{snap(postAffineStats.mean)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-sky">
              <span className="mlviz-statcard-label">y σ (→ |γ|)</span>
              <span className="mlviz-statcard-val">{snap(postAffineStats.std)}</span>
            </div>
          </div>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">γ</span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(gamma, 2)}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">β</span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.05"
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(beta, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleStep}
            disabled={running || step >= 4}
          >
            <ChevronRight size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRun}
            disabled={running || step >= 4}
          >
            <Play size={13} />
            <span>Run</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={running}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleRegenerate}
            disabled={running}
          >
            <RefreshCw size={13} />
            <span>Regenerate batch</span>
          </button>
        </div>

        <div className="mlviz-hint">
          step through μ → σ² → normalize → scale & shift, or hit Run to animate
        </div>
      </div>
    </div>
  );
}
