import React, { useMemo, useState } from 'react';
import { Sliders, Thermometer, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 720;
const H = 380;
const PAD_L = 46;
const PAD_R = 18;
const PAD_T = 36;
const PAD_B = 60;
const N_SAMPLES = 500;
const DEFAULT_BINS = 10;
const DEFAULT_T = 1.0;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// pre-compute 500 (confidence, correctness) pairs from a deliberately
// over-confident model: predicted probability tends to be higher than empirical accuracy.
function generatePairs(rng) {
  const out = [];
  for (let i = 0; i < N_SAMPLES; i++) {
    const u = rng();
    // raw confidence: skewed toward high values (over-confident)
    const conf = clamp01(0.45 + Math.pow(u, 0.55) * 0.55);
    // true probability of correctness is much lower than the stated confidence
    // (this is the miscalibration we want the viz to expose)
    const trueP = clamp01(0.25 + (conf - 0.45) * 0.55);
    const correct = rng() < trueP ? 1 : 0;
    // logit for temperature-scaling: invert the confidence back to a logit so we
    // can re-soften it later.  Use a single-class sigmoid framing.
    const eps = 1e-4;
    const c = Math.min(1 - eps, Math.max(eps, conf));
    const logit = Math.log(c / (1 - c));
    out.push({ logit, correct });
  }
  return out;
}

// apply temperature scaling: prob = sigmoid(logit / T)
function calibrate(pairs, T) {
  const t = Math.max(0.05, T);
  return pairs.map((p) => ({
    conf: 1 / (1 + Math.exp(-p.logit / t)),
    correct: p.correct,
  }));
}

function computeBins(samples, nBins) {
  const bins = Array.from({ length: nBins }, () => ({ sumConf: 0, sumCorrect: 0, n: 0 }));
  for (const s of samples) {
    const idx = Math.min(nBins - 1, Math.floor(s.conf * nBins));
    bins[idx].sumConf += s.conf;
    bins[idx].sumCorrect += s.correct;
    bins[idx].n += 1;
  }
  return bins.map((b, i) => {
    const meanConf = b.n > 0 ? b.sumConf / b.n : (i + 0.5) / nBins;
    const acc = b.n > 0 ? b.sumCorrect / b.n : 0;
    return { meanConf, acc, n: b.n, lo: i / nBins, hi: (i + 1) / nBins };
  });
}

function computeECE(bins, total) {
  let ece = 0;
  for (const b of bins) {
    if (b.n === 0) continue;
    ece += (b.n / total) * Math.abs(b.meanConf - b.acc);
  }
  return ece;
}

export default function ModelCalibrationViz() {
  const [nBins, setNBins] = useState(DEFAULT_BINS);
  const [T, setT] = useState(DEFAULT_T);
  const seed = 1337;

  const rng = useMemo(() => mulberry32(seed), [seed]);
  const rawPairs = useMemo(() => generatePairs(rng), [rng]);

  const samplesBefore = useMemo(() => calibrate(rawPairs, 1.0), [rawPairs]);
  const samplesAfter = useMemo(() => calibrate(rawPairs, T), [rawPairs, T]);

  const binsBefore = useMemo(() => computeBins(samplesBefore, nBins), [samplesBefore, nBins]);
  const binsAfter = useMemo(() => computeBins(samplesAfter, nBins), [samplesAfter, nBins]);

  const eceBefore = useMemo(() => computeECE(binsBefore, N_SAMPLES), [binsBefore]);
  const eceAfter = useMemo(() => computeECE(binsAfter, N_SAMPLES), [binsAfter]);

  // top plot: reliability diagram (predicted vs empirical)
  // bottom strip: histogram of confidence distribution
  const innerW = W - PAD_L - PAD_R;
  const topH = 220;
  const histH = 60;
  const topY0 = PAD_T;
  const topY1 = PAD_T + topH;
  const histY0 = topY1 + 36;
  const histY1 = histY0 + histH;

  const xFor = (v) => PAD_L + v * innerW;
  const yForReliability = (v) => topY1 - v * topH;

  const histMax = Math.max(1, ...binsAfter.map((b) => b.n));
  const barW = innerW / nBins;

  const reset = () => {
    setNBins(DEFAULT_BINS);
    setT(DEFAULT_T);
  };

  // build reliability poly-lines (before / after)
  const polyBefore = binsBefore
    .filter((b) => b.n > 0)
    .map((b) => `${xFor(b.meanConf)},${yForReliability(b.acc)}`)
    .join(' ');
  const polyAfter = binsAfter
    .filter((b) => b.n > 0)
    .map((b) => `${xFor(b.meanConf)},${yForReliability(b.acc)}`)
    .join(' ');

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* reliability diagram frame */}
          <rect
            x={PAD_L}
            y={topY0}
            width={innerW}
            height={topH}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            rx="4"
            opacity="0.6"
          />

          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <g key={g}>
              <line
                x1={xFor(g)}
                y1={topY0}
                x2={xFor(g)}
                y2={topY1}
                stroke="var(--border)"
                strokeOpacity="0.35"
                strokeDasharray="2 3"
              />
              <line
                x1={PAD_L}
                y1={yForReliability(g)}
                x2={PAD_L + innerW}
                y2={yForReliability(g)}
                stroke="var(--border)"
                strokeOpacity="0.35"
                strokeDasharray="2 3"
              />
            </g>
          ))}

          {/* identity line (perfectly calibrated) */}
          <line
            x1={xFor(0)}
            y1={yForReliability(0)}
            x2={xFor(1)}
            y2={yForReliability(1)}
            stroke="var(--text-dim)"
            strokeWidth="1.1"
            strokeDasharray="5 4"
          />
          <text
            x={xFor(0.92)}
            y={yForReliability(0.96)}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="end"
            letterSpacing="0.08em"
          >
            y = x · perfect
          </text>

          {/* before-calibration bars (filled to identity line — gap from identity is calibration error) */}
          {binsBefore.map((b, i) => {
            if (b.n === 0) return null;
            const x = PAD_L + i * barW + 1.5;
            const w = Math.max(2, barW - 3);
            const yAcc = yForReliability(b.acc);
            const yId = yForReliability(b.meanConf);
            const top = Math.min(yAcc, yId);
            const h = Math.abs(yAcc - yId);
            return (
              <rect
                key={`b-${i}`}
                x={x}
                y={top}
                width={w}
                height={h}
                fill="var(--hue-pink)"
                opacity="0.18"
              />
            );
          })}

          {/* after-calibration bars: acc per bin as solid sky bars from baseline */}
          {binsAfter.map((b, i) => {
            if (b.n === 0) return null;
            const x = PAD_L + i * barW + 1.5;
            const w = Math.max(2, barW - 3);
            const yAcc = yForReliability(b.acc);
            const h = topY1 - yAcc;
            return (
              <rect
                key={`a-${i}`}
                x={x}
                y={yAcc}
                width={w}
                height={h}
                fill="var(--hue-sky)"
                opacity="0.22"
                stroke="var(--hue-sky)"
                strokeOpacity="0.45"
                strokeWidth="0.6"
              />
            );
          })}

          {/* reliability curve — before */}
          {polyBefore && (
            <polyline
              points={polyBefore}
              fill="none"
              stroke="var(--hue-pink)"
              strokeWidth="1.6"
              strokeDasharray="3 3"
              opacity="0.85"
            />
          )}
          {binsBefore.map((b, i) => b.n > 0 && (
            <circle
              key={`pb-${i}`}
              cx={xFor(b.meanConf)}
              cy={yForReliability(b.acc)}
              r="2.6"
              fill="var(--hue-pink)"
            />
          ))}

          {/* reliability curve — after */}
          {polyAfter && (
            <polyline
              points={polyAfter}
              fill="none"
              stroke="var(--hue-sky)"
              strokeWidth="2.1"
              opacity="0.95"
            />
          )}
          {binsAfter.map((b, i) => b.n > 0 && (
            <circle
              key={`pa-${i}`}
              cx={xFor(b.meanConf)}
              cy={yForReliability(b.acc)}
              r="3.1"
              fill="var(--hue-sky)"
            />
          ))}

          {/* y-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <text
              key={`yt-${g}`}
              x={PAD_L - 6}
              y={yForReliability(g) + 3}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {g.toFixed(2)}
            </text>
          ))}

          {/* axis labels */}
          <text
            x={PAD_L + innerW / 2}
            y={topY1 + 22}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            predicted confidence
          </text>
          <text
            x={14}
            y={topY0 + topH / 2}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            transform={`rotate(-90, 14, ${topY0 + topH / 2})`}
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            empirical accuracy
          </text>

          {/* header */}
          <text
            x={PAD_L}
            y={PAD_T - 14}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            RELIABILITY DIAGRAM · {N_SAMPLES} samples · {nBins} bins
          </text>
          <text
            x={PAD_L + innerW}
            y={PAD_T - 14}
            fontSize="9.5"
            fontFamily="var(--mono)"
            textAnchor="end"
            fontWeight="700"
          >
            <tspan fill="var(--hue-pink)">before</tspan>
            <tspan fill="var(--text-dim)">  ·  </tspan>
            <tspan fill="var(--hue-sky)">after T={T.toFixed(2)}</tspan>
          </text>

          {/* histogram of confidence distribution (after) */}
          <text
            x={PAD_L}
            y={histY0 - 8}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            CONFIDENCE HISTOGRAM
          </text>
          <line
            x1={PAD_L}
            y1={histY1}
            x2={PAD_L + innerW}
            y2={histY1}
            stroke="var(--border)"
            strokeWidth="0.8"
          />
          {binsAfter.map((b, i) => {
            const x = PAD_L + i * barW + 1.5;
            const w = Math.max(2, barW - 3);
            const h = (b.n / histMax) * histH;
            return (
              <g key={`h-${i}`}>
                <rect
                  x={x}
                  y={histY1 - h}
                  width={w}
                  height={h}
                  fill="var(--accent)"
                  opacity="0.55"
                />
              </g>
            );
          })}
          {/* before-histogram outline overlay */}
          {binsBefore.map((b, i) => {
            const x = PAD_L + i * barW + 1.5;
            const w = Math.max(2, barW - 3);
            const h = (b.n / histMax) * histH;
            return (
              <rect
                key={`hb-${i}`}
                x={x}
                y={histY1 - h}
                width={w}
                height={h}
                fill="none"
                stroke="var(--hue-pink)"
                strokeOpacity="0.55"
                strokeWidth="0.8"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* histogram axis labels */}
          {[0, 0.5, 1].map((g) => (
            <text
              key={`htx-${g}`}
              x={xFor(g)}
              y={histY1 + 12}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              {g.toFixed(1)}
            </text>
          ))}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              bin count
            </span>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={nBins}
              onChange={(e) => setNBins(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{nBins}</span>
          </label>
        </div>
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature T
            </span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.32rem' }}>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">ECE</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>
              before  {snap(eceBefore).toFixed(3)}
            </span>
            <span className="mlviz-sub">→</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              after  {snap(eceAfter).toFixed(3)}
            </span>
            <span className="mlviz-sub">
              Δ {snap(eceBefore - eceAfter).toFixed(3)} {eceAfter < eceBefore ? '(improved)' : '(worse)'}
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">Σ</span>
            <span className="mlviz-val">
              {N_SAMPLES} predictions · acc = {snap(samplesAfter.reduce((a, s) => a + s.correct, 0) / N_SAMPLES, 3).toFixed(3)}
            </span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            sweep T &gt; 1 to soften an over-confident model
          </span>
        </div>

        <div className="mlviz-hint">
          ece = Σ (nᵢ / N) · |confᵢ − accᵢ| · pink bars show miscalibration gap before scaling
        </div>
      </div>
    </div>
  );
}
