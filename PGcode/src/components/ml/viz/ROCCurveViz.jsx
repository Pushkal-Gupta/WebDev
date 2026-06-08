import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const N_PER_CLASS = 100;
const N_BINS = 20;

const COLOR_POS = 'var(--hue-mint, #4dd0a0)';
const COLOR_NEG = 'var(--hue-pink, #ff66cc)';

// Deterministic PRNG so the dataset is stable across renders.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// Beta-like sampling via the ratio of two gamma-ish draws. We approximate using
// the sum of a few uniforms (CLT) shifted to mimic a Beta peaked at the target.
// alpha, beta control concentration; mode = (alpha-1)/(alpha+beta-2).
function sampleBetaLike(rand, alpha, beta) {
  // Marsaglia-like: use the ratio X/(X+Y) with X ~ Gamma(alpha), Y ~ Gamma(beta).
  const x = sampleGamma(rand, alpha);
  const y = sampleGamma(rand, beta);
  return x / (x + y);
}

// Marsaglia & Tsang gamma sampler, alpha >= 1. For alpha in (0,1) we use
// boosting: Gamma(alpha) = Gamma(alpha+1) * U^(1/alpha).
function sampleGamma(rand, alpha) {
  if (alpha < 1) {
    const g = sampleGamma(rand, alpha + 1);
    const u = Math.max(rand(), 1e-12);
    return g * Math.pow(u, 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x;
    let v;
    do {
      x = gauss(rand);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rand();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function gauss(rand) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Build a labeled score set. posPeak/negPeak roughly map to the mode of each
// Beta-like distribution. concentration scales (alpha+beta) — higher = tighter.
function buildDataset(seed, posPeak, negPeak, concentration) {
  const rand = mulberry32(seed);
  // Solve for alpha, beta such that mode = (a-1)/(a+b-2) and a+b = concentration.
  function paramsFor(mode, total) {
    const a = mode * (total - 2) + 1;
    const b = total - a;
    return { alpha: Math.max(1.01, a), beta: Math.max(1.01, b) };
  }
  const posP = paramsFor(clamp01(posPeak), concentration);
  const negP = paramsFor(clamp01(negPeak), concentration);

  const points = [];
  for (let i = 0; i < N_PER_CLASS; i++) {
    points.push({ label: 0, score: clamp01(sampleBetaLike(rand, negP.alpha, negP.beta)) });
  }
  for (let i = 0; i < N_PER_CLASS; i++) {
    points.push({ label: 1, score: clamp01(sampleBetaLike(rand, posP.alpha, posP.beta)) });
  }
  return points;
}

const PRESETS = {
  default: { label: 'Slight bias', seed: 20260607, posPeak: 0.7, negPeak: 0.3, concentration: 10 },
  perfect: { label: 'Perfect classifier', seed: 20260607, posPeak: 0.88, negPeak: 0.12, concentration: 30 },
  random: { label: 'Random', seed: 20260607, posPeak: 0.5, negPeak: 0.5, concentration: 6 },
};

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function computeConfusion(points, threshold) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const p of points) {
    const pred = p.score >= threshold ? 1 : 0;
    if (p.label === 1 && pred === 1) tp += 1;
    else if (p.label === 0 && pred === 1) fp += 1;
    else if (p.label === 0 && pred === 0) tn += 1;
    else fn += 1;
  }
  return { tp, fp, tn, fn };
}

function computeMetrics(c) {
  const total = c.tp + c.fp + c.tn + c.fn;
  const accuracy = total === 0 ? 0 : (c.tp + c.tn) / total;
  const precision = (c.tp + c.fp) === 0 ? 0 : c.tp / (c.tp + c.fp);
  const recall = (c.tp + c.fn) === 0 ? 0 : c.tp / (c.tp + c.fn);
  const f1 = (precision + recall) === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { accuracy, precision, recall, f1 };
}

// Compute ROC: sort by score descending, sweep, emit (FPR, TPR) per unique cut.
function computeROC(points) {
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const totalPos = sorted.filter((p) => p.label === 1).length;
  const totalNeg = sorted.length - totalPos;
  const curve = [{ fpr: 0, tpr: 0, threshold: 1.01 }];
  let tp = 0;
  let fp = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) tp += 1; else fp += 1;
    // Emit a point at each distinct score boundary.
    if (i === sorted.length - 1 || sorted[i].score !== sorted[i + 1].score) {
      curve.push({
        fpr: totalNeg === 0 ? 0 : fp / totalNeg,
        tpr: totalPos === 0 ? 0 : tp / totalPos,
        threshold: sorted[i].score,
      });
    }
  }
  if (curve[curve.length - 1].fpr < 1 || curve[curve.length - 1].tpr < 1) {
    curve.push({ fpr: 1, tpr: 1, threshold: 0 });
  }
  // Trapezoidal AUC.
  let auc = 0;
  for (let i = 1; i < curve.length; i++) {
    const dx = curve[i].fpr - curve[i - 1].fpr;
    auc += dx * (curve[i].tpr + curve[i - 1].tpr) / 2;
  }
  return { curve, auc };
}

function buildHistogram(points) {
  const pos = new Array(N_BINS).fill(0);
  const neg = new Array(N_BINS).fill(0);
  for (const p of points) {
    const idx = Math.min(N_BINS - 1, Math.floor(p.score * N_BINS));
    if (p.label === 1) pos[idx] += 1;
    else neg[idx] += 1;
  }
  return { pos, neg };
}

// Histogram chart dimensions.
const HW = 420;
const HH = 200;
const HPAD_L = 34;
const HPAD_R = 14;
const HPAD_T = 18;
const HPAD_B = 26;
const HPLOT_W = HW - HPAD_L - HPAD_R;
const HPLOT_H = HH - HPAD_T - HPAD_B;

// ROC chart dimensions.
const RW = 320;
const RH = 320;
const RPAD = 36;
const RPLOT = RW - RPAD * 2;

function thresholdX(t) {
  return HPAD_L + t * HPLOT_W;
}

function histX(i) {
  return HPAD_L + (i / N_BINS) * HPLOT_W;
}

function histBarW() {
  return HPLOT_W / N_BINS;
}

function rocToScreen(fpr, tpr) {
  return {
    sx: RPAD + fpr * RPLOT,
    sy: RPAD + (1 - tpr) * RPLOT,
  };
}

function findCurrentRocPoint(curve, threshold) {
  // Find the point at or just below the current threshold (descending threshold).
  let best = curve[0];
  for (const p of curve) {
    if (p.threshold >= threshold) best = p;
    else break;
  }
  return best;
}

export default function ROCCurveViz() {
  const [presetKey, setPresetKey] = useState('default');
  const [threshold, setThreshold] = useState(0.5);

  const preset = PRESETS[presetKey];

  const points = useMemo(
    () => buildDataset(preset.seed, preset.posPeak, preset.negPeak, preset.concentration),
    [preset.seed, preset.posPeak, preset.negPeak, preset.concentration]
  );

  const histogram = useMemo(() => buildHistogram(points), [points]);
  const histMax = useMemo(() => {
    let m = 0;
    for (let i = 0; i < N_BINS; i++) {
      if (histogram.pos[i] > m) m = histogram.pos[i];
      if (histogram.neg[i] > m) m = histogram.neg[i];
    }
    return Math.max(m, 1);
  }, [histogram]);

  const confusion = useMemo(() => computeConfusion(points, threshold), [points, threshold]);
  const metrics = useMemo(() => computeMetrics(confusion), [confusion]);

  const { curve, auc } = useMemo(() => computeROC(points), [points]);
  const currentRoc = useMemo(() => findCurrentRocPoint(curve, threshold), [curve, threshold]);

  const applyPreset = useCallback((key) => {
    setPresetKey(key);
    setThreshold(0.5);
  }, []);

  const handleReset = useCallback(() => {
    setPresetKey('default');
    setThreshold(0.5);
  }, []);

  const rocPath = useMemo(() => {
    if (curve.length === 0) return '';
    return curve
      .map((p, i) => {
        const { sx, sy } = rocToScreen(p.fpr, p.tpr);
        return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
      })
      .join(' ');
  }, [curve]);

  const aucPath = useMemo(() => {
    if (curve.length === 0) return '';
    const start = rocToScreen(0, 0);
    let d = `M${start.sx.toFixed(2)},${start.sy.toFixed(2)}`;
    for (const p of curve) {
      const { sx, sy } = rocToScreen(p.fpr, p.tpr);
      d += ` L${sx.toFixed(2)},${sy.toFixed(2)}`;
    }
    const end = rocToScreen(1, 0);
    d += ` L${end.sx.toFixed(2)},${end.sy.toFixed(2)} Z`;
    return d;
  }, [curve]);

  const thresholdScreenX = thresholdX(threshold);
  const histBaseY = HPAD_T + HPLOT_H;
  const barW = histBarW();
  const drawnBarW = Math.max(1, barW - 1);

  const totalP = confusion.tp + confusion.fn;
  const totalN = confusion.tn + confusion.fp;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ flexDirection: 'column', gap: '0.6rem' }}>
        {/* Histogram of scores with threshold line */}
        <svg
          viewBox={`0 0 ${HW} ${HH}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ aspectRatio: `${HW} / ${HH}`, maxWidth: '520px' }}
        >
          {/* y-axis label */}
          <text
            x={HPAD_L - 4}
            y={HPAD_T - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="start"
            letterSpacing="0.12em"
          >
            COUNT
          </text>
          <text
            x={HW - HPAD_R}
            y={HPAD_T - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
            letterSpacing="0.1em"
          >
            <tspan fill={COLOR_POS}>positives</tspan>
            <tspan>  </tspan>
            <tspan fill={COLOR_NEG}>negatives</tspan>
          </text>

          {/* y gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((tick) => {
            const y = histBaseY - tick * HPLOT_H;
            const v = Math.round(tick * histMax);
            return (
              <g key={`gy${tick}`}>
                <line
                  x1={HPAD_L}
                  y1={y}
                  x2={HW - HPAD_R}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                  opacity="0.6"
                />
                <text
                  x={HPAD_L - 5}
                  y={y + 3}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {/* baseline */}
          <line
            x1={HPAD_L}
            y1={histBaseY}
            x2={HW - HPAD_R}
            y2={histBaseY}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* x-axis ticks */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((t) => {
            const x = thresholdX(t);
            return (
              <text
                key={`xt${t}`}
                x={x}
                y={histBaseY + 14}
                fontSize="9"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                {t.toFixed(2)}
              </text>
            );
          })}
          <text
            x={HPAD_L + HPLOT_W / 2}
            y={HH - 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.12em"
          >
            SCORE
          </text>

          {/* histogram bars - negatives drawn first */}
          {histogram.neg.map((count, i) => {
            if (count === 0) return null;
            const h = (count / histMax) * HPLOT_H;
            const x = histX(i);
            return (
              <rect
                key={`nb${i}`}
                x={x + 0.5}
                y={histBaseY - h}
                width={drawnBarW}
                height={Math.max(0.5, h)}
                fill={COLOR_NEG}
                opacity="0.55"
              />
            );
          })}
          {histogram.pos.map((count, i) => {
            if (count === 0) return null;
            const h = (count / histMax) * HPLOT_H;
            const x = histX(i);
            return (
              <rect
                key={`pb${i}`}
                x={x + 0.5}
                y={histBaseY - h}
                width={drawnBarW}
                height={Math.max(0.5, h)}
                fill={COLOR_POS}
                opacity="0.55"
              />
            );
          })}

          {/* threshold line */}
          <line
            x1={thresholdScreenX}
            y1={HPAD_T - 2}
            x2={thresholdScreenX}
            y2={histBaseY + 4}
            stroke="var(--accent)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <rect
            x={thresholdScreenX - 18}
            y={HPAD_T - 14}
            width="36"
            height="12"
            rx="3"
            fill="var(--accent)"
            opacity="0.92"
          />
          <text
            x={thresholdScreenX}
            y={HPAD_T - 5}
            fontSize="9"
            fill="var(--bg)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            fontWeight="700"
          >
            t={snap(threshold, 2)}
          </text>
        </svg>

        {/* ROC curve */}
        <svg
          viewBox={`0 0 ${RW} ${RH}`}
          className="mlviz-svg"
          style={{ maxWidth: '360px' }}
        >
          {/* plot frame */}
          <rect
            x={RPAD}
            y={RPAD}
            width={RPLOT}
            height={RPLOT}
            fill="none"
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((t) => {
            const { sx } = rocToScreen(t, 0);
            const { sy } = rocToScreen(0, t);
            return (
              <g key={`rg${t}`}>
                <line
                  x1={sx}
                  y1={RPAD}
                  x2={sx}
                  y2={RPAD + RPLOT}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
                <line
                  x1={RPAD}
                  y1={sy}
                  x2={RPAD + RPLOT}
                  y2={sy}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  strokeDasharray="2 3"
                  opacity="0.5"
                />
              </g>
            );
          })}

          {/* axis ticks */}
          {[0, 0.5, 1].map((t) => {
            const { sx } = rocToScreen(t, 0);
            const { sy } = rocToScreen(0, t);
            return (
              <g key={`rt${t}`}>
                <text
                  x={sx}
                  y={RPAD + RPLOT + 12}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {t.toFixed(1)}
                </text>
                <text
                  x={RPAD - 5}
                  y={sy + 3}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >
                  {t.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={RPAD + RPLOT / 2}
            y={RH - 6}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.14em"
          >
            FPR
          </text>
          <text
            x={10}
            y={RPAD + RPLOT / 2}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.14em"
            transform={`rotate(-90 10 ${RPAD + RPLOT / 2})`}
          >
            TPR
          </text>

          {/* AUC shaded area */}
          <path
            d={aucPath}
            fill="var(--accent)"
            opacity="0.12"
          />

          {/* random-classifier baseline */}
          <line
            x1={rocToScreen(0, 0).sx}
            y1={rocToScreen(0, 0).sy}
            x2={rocToScreen(1, 1).sx}
            y2={rocToScreen(1, 1).sy}
            stroke="var(--text-dim)"
            strokeWidth="1"
            strokeDasharray="3 4"
            opacity="0.7"
          />

          {/* ROC curve */}
          <path
            d={rocPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* current threshold marker */}
          {currentRoc && (
            <g>
              <circle
                cx={rocToScreen(currentRoc.fpr, currentRoc.tpr).sx}
                cy={rocToScreen(currentRoc.fpr, currentRoc.tpr).sy}
                r="9"
                fill="var(--accent)"
                opacity="0.25"
              />
              <circle
                cx={rocToScreen(currentRoc.fpr, currentRoc.tpr).sx}
                cy={rocToScreen(currentRoc.fpr, currentRoc.tpr).sy}
                r="5"
                fill="var(--accent)"
                stroke="var(--bg)"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* AUC label */}
          <text
            x={RPAD + RPLOT - 8}
            y={RPAD + RPLOT - 10}
            fontSize="13"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            fontWeight="700"
            textAnchor="end"
          >
            AUC = {snap(auc, 3)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        {/* Threshold slider */}
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">threshold</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(threshold, 2)}</span>
          </label>
        </div>

        {/* Confusion matrix 2x2 */}
        <div className="mlviz-row mlviz-row-hi" style={{ gap: '0.9rem', alignItems: 'flex-start' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto repeat(2, minmax(3rem, 1fr))',
            gridTemplateRows: 'auto repeat(2, auto)',
            gap: '0.18rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.7rem',
            minWidth: '180px',
          }}>
            <span />
            <span style={{ textAlign: 'center', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>pred 1</span>
            <span style={{ textAlign: 'center', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>pred 0</span>

            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em', alignSelf: 'center' }}>actual 1</span>
            <span style={{
              padding: '0.35rem 0.4rem',
              border: '1px solid var(--accent)',
              borderRadius: '4px',
              background: 'rgba(var(--accent-rgb, 0, 255, 245), 0.10)',
              color: 'var(--accent)',
              fontWeight: 700,
              textAlign: 'center',
            }}>TP {confusion.tp}</span>
            <span style={{
              padding: '0.35rem 0.4rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'rgba(255, 102, 204, 0.08)',
              color: 'var(--text-main)',
              textAlign: 'center',
            }}>FN {confusion.fn}</span>

            <span style={{ color: 'var(--text-dim)', letterSpacing: '0.08em', alignSelf: 'center' }}>actual 0</span>
            <span style={{
              padding: '0.35rem 0.4rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'rgba(255, 102, 204, 0.08)',
              color: 'var(--text-main)',
              textAlign: 'center',
            }}>FP {confusion.fp}</span>
            <span style={{
              padding: '0.35rem 0.4rem',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'rgba(77, 208, 160, 0.10)',
              color: 'var(--text-main)',
              textAlign: 'center',
            }}>TN {confusion.tn}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.22rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.74rem',
            flex: 1,
            minWidth: '160px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              <span style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}>accuracy</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{snap(metrics.accuracy * 100, 1)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              <span style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}>precision</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{snap(metrics.precision, 3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              <span style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}>recall</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{snap(metrics.recall, 3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem' }}>
              <span style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}>F1</span>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{snap(metrics.f1, 3)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.6rem',
              paddingTop: '0.2rem',
              borderTop: '1px dashed var(--border)',
              marginTop: '0.15rem',
            }}>
              <span style={{ color: 'var(--text-dim)', letterSpacing: '0.06em' }}>P / N</span>
              <span style={{ color: 'var(--text-dim)' }}>{totalP} / {totalN}</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="mlviz-row mt-presets" style={{ gap: '0.4rem', paddingTop: '0.25rem' }}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className="mt-preset-btn"
              onClick={() => applyPreset(key)}
              style={presetKey === key ? {
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                background: 'rgba(var(--accent-rgb, 0, 255, 245), 0.08)',
              } : undefined}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            style={{ marginLeft: 'auto' }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          drag threshold to sweep · curve is FPR vs TPR over all cuts · AUC = area under curve
        </div>
      </div>
    </div>
  );
}
