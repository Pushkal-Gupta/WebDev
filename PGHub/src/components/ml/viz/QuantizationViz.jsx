import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, RotateCcw, Layers, Zap } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * QuantizationViz
 *
 * A histogram of ~256 weights (tight Gaussian + a few heavy outliers) is overlaid
 * with the integer grid implied by the current bit-depth + scale choice. Each weight
 * is rounded to its nearest grid level and a second "decoded" histogram is drawn
 * on top of the original so the reader can see how much resolution gets lost.
 *
 * Outliers are deliberately included so dropping the bit-depth visibly inflates the
 * scale and squashes the bulk of the distribution onto a handful of grid ticks —
 * the MSE readout climbs and the dequantized histogram coarsens in real time.
 */

const N_WEIGHTS = 256;
const N_BINS = 64;
const VIEW_RANGE = 1.8; // x-axis goes from -VIEW_RANGE to +VIEW_RANGE
const DEFAULT_BITS = 4;
const SEED = 42;

const W = 720;
const H = 320;
const PAD_L = 44;
const PAD_R = 24;
const PAD_T = 28;
const PAD_B = 56;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const BIN_W = PLOT_W / N_BINS;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

function snap(v, p = 4) {
  if (!Number.isFinite(v)) return v;
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function xToPx(x) {
  return PAD_L + ((x + VIEW_RANGE) / (2 * VIEW_RANGE)) * PLOT_W;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export default function QuantizationViz() {
  const [bits, setBits] = useState(DEFAULT_BITS);
  const [asymmetric, setAsymmetric] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // Deterministic weight sample: tight Gaussian + a few outliers at ±1.2 and ±1.5
  const weights = useMemo(() => {
    const rng = mulberry32(SEED);
    const sigma = 0.3;
    const arr = new Array(N_WEIGHTS - 6);
    for (let i = 0; i < arr.length; i++) arr[i] = gaussian(rng) * sigma;
    return arr.concat([1.2, -1.2, 1.5, -1.5, 1.2, -1.5]);
  }, []);

  const wMin = useMemo(() => Math.min(...weights), [weights]);
  const wMax = useMemo(() => Math.max(...weights), [weights]);
  const wAbsMax = useMemo(() => Math.max(Math.abs(wMin), Math.abs(wMax)), [wMin, wMax]);

  // Scale + zero-point + dequantized values
  const { scale, zeroPoint, qMin, qMax, dequantized, mse, levels } = useMemo(() => {
    const b = bits;
    let s;
    let z;
    let qLo;
    let qHi;
    if (asymmetric) {
      // unsigned int grid [0, 2^b - 1]
      qLo = 0;
      qHi = (1 << b) - 1;
      s = Math.max(1e-9, (wMax - wMin) / (qHi - qLo));
      z = Math.round(-wMin / s);
    } else {
      // symmetric signed grid [-(2^(b-1)-1), 2^(b-1)-1]
      qHi = (1 << (b - 1)) - 1;
      qLo = -qHi;
      s = Math.max(1e-9, wAbsMax / qHi);
      z = 0;
    }
    const deq = new Array(weights.length);
    let se = 0;
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i];
      const q = clamp(Math.round(w / s) + z, qLo, qHi);
      const what = (q - z) * s;
      deq[i] = what;
      const e = w - what;
      se += e * e;
    }
    const m = se / weights.length;
    // build the visible levels in float-space (the integer grid points dequantized)
    const lvls = [];
    for (let q = qLo; q <= qHi; q++) {
      const f = (q - z) * s;
      if (f >= -VIEW_RANGE && f <= VIEW_RANGE) lvls.push(f);
    }
    return { scale: s, zeroPoint: z, qMin: qLo, qMax: qHi, dequantized: deq, mse: m, levels: lvls };
  }, [bits, asymmetric, weights, wMin, wMax, wAbsMax]);

  // Histogram of original + dequantized
  const { histOrig, histDeq, histMax } = useMemo(() => {
    const orig = new Array(N_BINS).fill(0);
    const deq = new Array(N_BINS).fill(0);
    const bw = (2 * VIEW_RANGE) / N_BINS;
    function bucketIdx(v) {
      if (v < -VIEW_RANGE || v > VIEW_RANGE) return -1;
      const i = Math.floor((v + VIEW_RANGE) / bw);
      return clamp(i, 0, N_BINS - 1);
    }
    for (let i = 0; i < weights.length; i++) {
      const oi = bucketIdx(weights[i]);
      if (oi >= 0) orig[oi]++;
      const di = bucketIdx(dequantized[i]);
      if (di >= 0) deq[di]++;
    }
    const mx = Math.max(...orig, ...deq, 1);
    return { histOrig: orig, histDeq: deq, histMax: mx };
  }, [weights, dequantized]);

  const compression = 32 / bits;

  const transition = reducedMotion ? 'none' : 'height 0.25s ease, y 0.25s ease, opacity 0.25s ease';

  const sFormula = useMemo(
    () => katexHtml(asymmetric ? 's = (\\max-\\min)/(2^{b}-1)' : 's = \\max(|w|)/(2^{b-1}-1)'),
    [asymmetric]
  );
  const mseFormula = useMemo(() => katexHtml('\\mathrm{MSE} = \\tfrac{1}{N}\\sum (w-\\hat{w})^2'), []);

  const baselineY = PAD_T + PLOT_H;

  function resetAll() {
    setBits(DEFAULT_BITS);
    setAsymmetric(false);
  }

  const xZero = xToPx(0);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* plot frame */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={PLOT_W}
            height={PLOT_H}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="6"
            opacity="0.55"
          />

          {/* zero axis */}
          <line
            x1={xZero}
            y1={PAD_T + 6}
            x2={xZero}
            y2={baselineY}
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.7"
          />

          {/* baseline */}
          <line
            x1={PAD_L}
            y1={baselineY}
            x2={PAD_L + PLOT_W}
            y2={baselineY}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* x-axis tick labels */}
          {[-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5].map((tx) => (
            <g key={tx}>
              <line
                x1={xToPx(tx)}
                y1={baselineY}
                x2={xToPx(tx)}
                y2={baselineY + 4}
                stroke="var(--text-dim)"
                strokeWidth="1"
              />
              <text
                x={xToPx(tx)}
                y={baselineY + 16}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                {tx.toFixed(1)}
              </text>
            </g>
          ))}
          <text
            x={PAD_L + PLOT_W - 4}
            y={baselineY + 32}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
            letterSpacing="0.08em"
          >
            weight value w
          </text>

          {/* quantization grid: vertical tick at every level */}
          {levels.map((lv, i) => {
            // skip ticks too close together to keep the read clean at high bit counts
            const x = xToPx(lv);
            return (
              <line
                key={`lv-${i}`}
                x1={x}
                y1={PAD_T + 8}
                x2={x}
                y2={baselineY}
                stroke="var(--accent)"
                strokeWidth={levels.length > 80 ? 0.4 : 0.8}
                opacity={levels.length > 80 ? 0.18 : 0.32}
                style={{ transition: reducedMotion ? 'none' : 'opacity 0.25s ease' }}
              />
            );
          })}

          {/* original histogram bars */}
          {histOrig.map((c, i) => {
            if (c === 0) return null;
            const h = (c / histMax) * (PLOT_H - 16);
            const x = PAD_L + i * BIN_W;
            const y = baselineY - h;
            return (
              <rect
                key={`o-${i}`}
                x={x + 0.5}
                y={y}
                width={Math.max(1, BIN_W - 1)}
                height={h}
                fill="var(--hue-sky)"
                opacity="0.55"
                style={{ transition }}
              />
            );
          })}

          {/* dequantized histogram bars (snapped) */}
          {histDeq.map((c, i) => {
            if (c === 0) return null;
            const h = (c / histMax) * (PLOT_H - 16);
            const x = PAD_L + i * BIN_W;
            const y = baselineY - h;
            return (
              <rect
                key={`d-${i}`}
                x={x + 0.5}
                y={y}
                width={Math.max(1, BIN_W - 1)}
                height={h}
                fill="var(--hue-pink)"
                opacity="0.62"
                style={{ transition }}
              />
            );
          })}

          {/* legend */}
          <g transform={`translate(${PAD_L + 8}, ${PAD_T + 6})`}>
            <rect width="10" height="8" fill="var(--hue-sky)" opacity="0.6" rx="1.5" />
            <text x="14" y="7" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
              original
            </text>
            <g transform="translate(86, 0)">
              <rect width="10" height="8" fill="var(--hue-pink)" opacity="0.7" rx="1.5" />
              <text x="14" y="7" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
                dequantized
              </text>
            </g>
            <g transform="translate(196, 0)">
              <line x1="0" y1="4" x2="10" y2="4" stroke="var(--accent)" strokeWidth="1.2" opacity="0.7" />
              <text x="14" y="7" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
                grid levels
              </text>
            </g>
          </g>

          {/* outlier annotations */}
          {[1.2, -1.2, 1.5, -1.5].map((ox) => (
            <g key={`out-${ox}`} opacity="0.8">
              <line
                x1={xToPx(ox)}
                y1={baselineY - 12}
                x2={xToPx(ox)}
                y2={baselineY - 4}
                stroke="var(--warning, var(--hue-pink))"
                strokeWidth="1"
              />
              <text
                x={xToPx(ox)}
                y={baselineY - 16}
                fontSize="8"
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                outlier
              </text>
            </g>
          ))}

          {/* range marker showing the quantization clip range */}
          {(() => {
            const lo = asymmetric ? wMin : -wAbsMax;
            const hi = asymmetric ? wMax : wAbsMax;
            const xLo = xToPx(clamp(lo, -VIEW_RANGE, VIEW_RANGE));
            const xHi = xToPx(clamp(hi, -VIEW_RANGE, VIEW_RANGE));
            return (
              <g style={{ transition: reducedMotion ? 'none' : 'opacity 0.25s ease' }}>
                <line
                  x1={xLo}
                  y1={PAD_T + 22}
                  x2={xHi}
                  y2={PAD_T + 22}
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  opacity="0.7"
                />
                <line
                  x1={xLo}
                  y1={PAD_T + 18}
                  x2={xLo}
                  y2={PAD_T + 26}
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  opacity="0.7"
                />
                <line
                  x1={xHi}
                  y1={PAD_T + 18}
                  x2={xHi}
                  y2={PAD_T + 26}
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  opacity="0.7"
                />
                <text
                  x={(xLo + xHi) / 2}
                  y={PAD_T + 16}
                  fontSize="9"
                  fill="var(--accent)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.08em"
                  fontWeight="700"
                >
                  representable range · {levels.length} levels
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              bit depth
            </span>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={bits}
              onChange={(e) => setBits(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">int{bits}</span>
          </label>

          <div className="mlviz-toggles" style={{ border: 'none', padding: 0, background: 'transparent' }}>
            <button
              type="button"
              className={`mlviz-toggle ${!asymmetric ? 'is-on' : ''}`}
              onClick={() => setAsymmetric(false)}
              aria-pressed={!asymmetric}
            >
              <span className="mlviz-toggle-dot" />
              symmetric
            </button>
            <button
              type="button"
              className={`mlviz-toggle ${asymmetric ? 'is-on' : ''}`}
              onClick={() => setAsymmetric(true)}
              aria-pressed={asymmetric}
            >
              <span className="mlviz-toggle-dot" />
              asymmetric
            </button>
          </div>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span dangerouslySetInnerHTML={{ __html: sFormula }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              {snap(scale, 5).toFixed(5)}
            </span>
          </span>
          {asymmetric && (
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                zero-point z
              </span>
              <span className="mlviz-val" style={{ color: 'var(--hue-mint, var(--accent))' }}>
                {zeroPoint}
              </span>
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              q range
            </span>
            <span className="mlviz-val" style={{ color: 'var(--text-main)' }}>
              [{qMin}, {qMax}]
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span dangerouslySetInnerHTML={{ __html: mseFormula }} />
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)', fontWeight: 800 }}>
              {mse.toExponential(2)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Layers size={11} style={{ color: 'var(--text-dim)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              compression vs fp32
            </span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {compression.toFixed(1)}×
            </span>
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setBits((b) => clamp(b - 1, 2, 8))}>
            <Zap size={13} />
            <span>fewer bits</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => setBits((b) => clamp(b + 1, 2, 8))}>
            <Zap size={13} />
            <span>more bits</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {weights.length} weights · {N_BINS} bins
          </span>
        </div>

        <div className="mlviz-hint">
          drop bits to widen the scale · outliers stretch the grid and crush the bulk of the
          distribution onto a few ticks
        </div>
      </div>
    </div>
  );
}
