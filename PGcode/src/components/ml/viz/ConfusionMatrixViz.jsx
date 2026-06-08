import React, { useState, useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const COLOR_TP = 'var(--hue-mint, #4dd0a0)';
const COLOR_TN = 'var(--hue-sky, #6cc9ff)';
const COLOR_FP = 'var(--hue-pink, #ff66cc)';
const COLOR_FN = 'var(--hue-pink, #ff66cc)';

const PRESETS = {
  balanced: { label: 'Balanced',   tp: 70, fp: 20, fn: 15, tn: 95 },
  imbalanced: { label: 'Imbalanced', tp: 18, fp: 6,  fn: 12, tn: 240 },
  perfect: { label: 'Near perfect', tp: 96, fp: 3,  fn: 4,  tn: 97 },
  noisy: { label: 'Noisy', tp: 55, fp: 45, fn: 40, tn: 60 },
};

const MAX_PER_CELL = 300;

function clamp(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return 0;
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function computeMetrics(c) {
  const total = c.tp + c.fp + c.tn + c.fn;
  const accuracy = total === 0 ? 0 : (c.tp + c.tn) / total;
  const precision = (c.tp + c.fp) === 0 ? 0 : c.tp / (c.tp + c.fp);
  const recall = (c.tp + c.fn) === 0 ? 0 : c.tp / (c.tp + c.fn);
  const f1 = (precision + recall) === 0
    ? 0
    : (2 * precision * recall) / (precision + recall);
  const specificity = (c.tn + c.fp) === 0 ? 0 : c.tn / (c.tn + c.fp);
  const fpr = (c.tn + c.fp) === 0 ? 0 : c.fp / (c.tn + c.fp);
  return { accuracy, precision, recall, f1, specificity, fpr, total };
}

// Deterministic PRNG so that the synthetic ROC sweep is stable.
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

// Reverse-engineer a synthetic score distribution that, at threshold = 0.5,
// reproduces the user-supplied confusion counts. We sample scores from two
// truncated normals (positives near posMean, negatives near negMean) and pick
// means/spreads such that the fraction of positives with score >= 0.5 matches
// recall, and negatives with score >= 0.5 matches fpr. This drives the ROC.
function buildSyntheticPoints(c, seed) {
  const totalP = c.tp + c.fn;
  const totalN = c.tn + c.fp;
  const recall = totalP === 0 ? 0.5 : c.tp / totalP;
  const fpr = totalN === 0 ? 0.5 : c.fp / totalN;

  // Use the inverse-normal-ish approach: place each class mean so that
  // 1 - Phi((0.5 - mean) / sigma) ~= rate. We approximate Phi^-1 via a
  // simple rational approximation good enough for visualization.
  function probit(p) {
    const x = clamp(p, 1e-4, 1 - 1e-4);
    // Beasley-Springer-Moro low-precision: fine for viz.
    const t = Math.sqrt(-2 * Math.log(x < 0.5 ? x : 1 - x));
    const numer = 2.515517 + 0.802853 * t + 0.010328 * t * t;
    const denom = 1 + 1.432788 * t + 0.189269 * t * t + 0.001308 * t * t * t;
    const z = t - numer / denom;
    return x < 0.5 ? -z : z;
  }

  const sigma = 0.18;
  const posMean = clamp(0.5 + probit(recall) * sigma, 0.05, 0.95);
  const negMean = clamp(0.5 - probit(1 - fpr) * sigma, 0.05, 0.95);

  const rand = mulberry32(seed);
  function gauss() {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function sampleScore(mean) {
    const s = mean + gauss() * sigma;
    return clamp(s, 0, 1);
  }

  // Cap the synthetic sample so we don't blow up the ROC sweep with huge inputs.
  const capP = Math.min(totalP, 400);
  const capN = Math.min(totalN, 400);
  const points = [];
  for (let i = 0; i < capP; i++) points.push({ label: 1, score: sampleScore(posMean) });
  for (let i = 0; i < capN; i++) points.push({ label: 0, score: sampleScore(negMean) });
  return points;
}

function computeROC(points) {
  if (points.length === 0) {
    return { curve: [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }], auc: 0.5 };
  }
  const sorted = [...points].sort((a, b) => b.score - a.score);
  const totalPos = sorted.reduce((acc, p) => acc + (p.label === 1 ? 1 : 0), 0);
  const totalNeg = sorted.length - totalPos;
  const curve = [{ fpr: 0, tpr: 0, threshold: 1.01 }];
  let tp = 0;
  let fp = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].label === 1) tp += 1; else fp += 1;
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
  let auc = 0;
  for (let i = 1; i < curve.length; i++) {
    const dx = curve[i].fpr - curve[i - 1].fpr;
    auc += dx * (curve[i].tpr + curve[i - 1].tpr) / 2;
  }
  return { curve, auc };
}

function applyThreshold(points, t) {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const p of points) {
    const pred = p.score >= t ? 1 : 0;
    if (p.label === 1 && pred === 1) tp += 1;
    else if (p.label === 0 && pred === 1) fp += 1;
    else if (p.label === 0 && pred === 0) tn += 1;
    else fn += 1;
  }
  return { tp, fp, tn, fn };
}

// Matrix layout.
const MW = 360;
const MH = 320;
const MPAD_L = 86;
const MPAD_T = 50;
const MPAD_R = 16;
const MPAD_B = 16;
const CELL_W = (MW - MPAD_L - MPAD_R) / 2;
const CELL_H = (MH - MPAD_T - MPAD_B) / 2;

// ROC layout.
const RW = 320;
const RH = 320;
const RPAD = 38;
const RPLOT = RW - RPAD * 2;

function rocToScreen(fpr, tpr) {
  return {
    sx: RPAD + fpr * RPLOT,
    sy: RPAD + (1 - tpr) * RPLOT,
  };
}

function findCurrentRocPoint(curve, threshold) {
  let best = curve[0];
  for (const p of curve) {
    if (p.threshold === undefined) continue;
    if (p.threshold >= threshold) best = p;
    else break;
  }
  return best;
}

function intensityFor(value, max) {
  if (max <= 0) return 0;
  // Mild gamma so the rare cells aren't washed out.
  return Math.pow(value / max, 0.65);
}

export default function ConfusionMatrixViz() {
  const [tp, setTp] = useState(70);
  const [fp, setFp] = useState(20);
  const [fn, setFn] = useState(15);
  const [tn, setTn] = useState(95);
  const [threshold, setThreshold] = useState(0.5);
  const [highlight, setHighlight] = useState('none');
  const [presetKey, setPresetKey] = useState('balanced');

  const baseCounts = useMemo(() => ({ tp, fp, fn, tn }), [tp, fp, fn, tn]);
  const baseMetrics = useMemo(() => computeMetrics(baseCounts), [baseCounts]);

  // Build a synthetic dataset that matches the slider values at t=0.5, then
  // re-grade it at the user's threshold to drive the live ROC marker + the
  // heatmap when threshold != 0.5.
  const points = useMemo(
    () => buildSyntheticPoints(baseCounts, 20260608),
    [baseCounts],
  );
  const { curve, auc } = useMemo(() => computeROC(points), [points]);

  const thresholdedRaw = useMemo(
    () => applyThreshold(points, threshold),
    [points, threshold],
  );

  // Rescale synthetic counts back to the user's total so the heatmap stays in
  // the same units as the sliders (this only matters when sliders push above
  // the synthetic cap of 400/400).
  const liveCounts = useMemo(() => {
    const total = baseCounts.tp + baseCounts.fp + baseCounts.tn + baseCounts.fn;
    const syntheticTotal = thresholdedRaw.tp + thresholdedRaw.fp + thresholdedRaw.tn + thresholdedRaw.fn;
    if (syntheticTotal === 0 || total === 0) return thresholdedRaw;
    const scale = total / syntheticTotal;
    const r = {
      tp: Math.round(thresholdedRaw.tp * scale),
      fp: Math.round(thresholdedRaw.fp * scale),
      tn: Math.round(thresholdedRaw.tn * scale),
      fn: Math.round(thresholdedRaw.fn * scale),
    };
    return r;
  }, [thresholdedRaw, baseCounts]);

  const displayCounts = threshold === 0.5 ? baseCounts : liveCounts;
  const displayMetrics = useMemo(() => computeMetrics(displayCounts), [displayCounts]);

  const cellMax = Math.max(displayCounts.tp, displayCounts.fp, displayCounts.tn, displayCounts.fn, 1);

  const currentRoc = useMemo(() => findCurrentRocPoint(curve, threshold), [curve, threshold]);

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

  const applyPreset = useCallback((key) => {
    const p = PRESETS[key];
    if (!p) return;
    setPresetKey(key);
    setTp(p.tp);
    setFp(p.fp);
    setFn(p.fn);
    setTn(p.tn);
    setThreshold(0.5);
  }, []);

  const handleReset = useCallback(() => {
    applyPreset('balanced');
    setHighlight('none');
  }, [applyPreset]);

  // Cell coordinates.
  // Layout: rows = actual (1 top, 0 bottom). Columns = predicted (1 left, 0 right).
  // (TP, FN) on top row; (FP, TN) on bottom row.
  const cells = [
    { key: 'tp', label: 'TP', value: displayCounts.tp, color: COLOR_TP, row: 0, col: 0 },
    { key: 'fn', label: 'FN', value: displayCounts.fn, color: COLOR_FN, row: 0, col: 1 },
    { key: 'fp', label: 'FP', value: displayCounts.fp, color: COLOR_FP, row: 1, col: 0 },
    { key: 'tn', label: 'TN', value: displayCounts.tn, color: COLOR_TN, row: 1, col: 1 },
  ];

  function cellX(col) { return MPAD_L + col * CELL_W; }
  function cellY(row) { return MPAD_T + row * CELL_H; }

  const precisionColCells = new Set(['tp', 'fp']); // pred = 1 column
  const recallRowCells = new Set(['tp', 'fn']);    // actual = 1 row
  const accuracyDiagCells = new Set(['tp', 'tn']);

  function isHighlighted(key) {
    if (highlight === 'precision') return precisionColCells.has(key);
    if (highlight === 'recall') return recallRowCells.has(key);
    if (highlight === 'accuracy') return accuracyDiagCells.has(key);
    return false;
  }

  function isDimmed(key) {
    return highlight !== 'none' && !isHighlighted(key);
  }

  const totalP = displayCounts.tp + displayCounts.fn;
  const totalN = displayCounts.tn + displayCounts.fp;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ flexDirection: 'column', gap: '0.6rem' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {/* Confusion matrix heatmap */}
          <svg
            viewBox={`0 0 ${MW} ${MH}`}
            className="mlviz-svg"
            style={{ maxWidth: '420px' }}
          >
            {/* Outer title bars */}
            <text
              x={MPAD_L + CELL_W}
              y={18}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.16em"
            >
              PREDICTED
            </text>
            <text
              x={MPAD_L + CELL_W * 0.5}
              y={36}
              fontSize="10"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              positive (1)
            </text>
            <text
              x={MPAD_L + CELL_W * 1.5}
              y={36}
              fontSize="10"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              negative (0)
            </text>

            <text
              x={18}
              y={MPAD_T + CELL_H}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.16em"
              transform={`rotate(-90 18 ${MPAD_T + CELL_H})`}
            >
              ACTUAL
            </text>
            <text
              x={MPAD_L - 8}
              y={MPAD_T + CELL_H * 0.5 + 4}
              fontSize="10"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
              fontWeight="700"
            >
              positive (1)
            </text>
            <text
              x={MPAD_L - 8}
              y={MPAD_T + CELL_H * 1.5 + 4}
              fontSize="10"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
              fontWeight="700"
            >
              negative (0)
            </text>

            {/* Cell backgrounds */}
            {cells.map((c) => {
              const x = cellX(c.col);
              const y = cellY(c.row);
              const intensity = intensityFor(c.value, cellMax);
              const dim = isDimmed(c.key);
              const hi = isHighlighted(c.key);
              return (
                <g key={c.key} opacity={dim ? 0.35 : 1}>
                  <rect
                    x={x + 2}
                    y={y + 2}
                    width={CELL_W - 4}
                    height={CELL_H - 4}
                    fill={c.color}
                    opacity={0.18 + 0.62 * intensity}
                    stroke={hi ? 'var(--accent)' : 'var(--border)'}
                    strokeWidth={hi ? 2.2 : 1}
                    rx="6"
                  />
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H / 2 - 6}
                    fontSize="11"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                    letterSpacing="0.18em"
                  >
                    {c.label}
                  </text>
                  <text
                    x={x + CELL_W / 2}
                    y={y + CELL_H / 2 + 18}
                    fontSize="22"
                    fill="var(--text-main)"
                    fontFamily="var(--mono, monospace)"
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {c.value}
                  </text>
                </g>
              );
            })}

            {/* Highlight overlays for precision / recall geometry */}
            {highlight === 'precision' && (
              <rect
                x={cellX(0) + 1}
                y={cellY(0) + 1}
                width={CELL_W - 2}
                height={CELL_H * 2 - 2}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                rx="8"
              />
            )}
            {highlight === 'recall' && (
              <rect
                x={cellX(0) + 1}
                y={cellY(0) + 1}
                width={CELL_W * 2 - 2}
                height={CELL_H - 2}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                rx="8"
              />
            )}
            {highlight === 'accuracy' && (
              <g>
                <rect
                  x={cellX(0) + 1}
                  y={cellY(0) + 1}
                  width={CELL_W - 2}
                  height={CELL_H - 2}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  rx="8"
                />
                <rect
                  x={cellX(1) + 1}
                  y={cellY(1) + 1}
                  width={CELL_W - 2}
                  height={CELL_H - 2}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  rx="8"
                />
              </g>
            )}
          </svg>

          {/* ROC curve */}
          <svg
            viewBox={`0 0 ${RW} ${RH}`}
            className="mlviz-svg"
            style={{ maxWidth: '360px' }}
          >
            <rect
              x={RPAD}
              y={RPAD}
              width={RPLOT}
              height={RPLOT}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
            />

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
              x={12}
              y={RPAD + RPLOT / 2}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.14em"
              transform={`rotate(-90 12 ${RPAD + RPLOT / 2})`}
            >
              TPR
            </text>

            <path d={aucPath} fill="var(--accent)" opacity="0.12" />

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

            <path
              d={rocPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {currentRoc && (
              <g>
                <line
                  x1={rocToScreen(currentRoc.fpr, currentRoc.tpr).sx}
                  y1={RPAD}
                  x2={rocToScreen(currentRoc.fpr, currentRoc.tpr).sx}
                  y2={rocToScreen(currentRoc.fpr, currentRoc.tpr).sy}
                  stroke="var(--accent)"
                  strokeWidth="0.6"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
                <line
                  x1={RPAD}
                  y1={rocToScreen(currentRoc.fpr, currentRoc.tpr).sy}
                  x2={rocToScreen(currentRoc.fpr, currentRoc.tpr).sx}
                  y2={rocToScreen(currentRoc.fpr, currentRoc.tpr).sy}
                  stroke="var(--accent)"
                  strokeWidth="0.6"
                  strokeDasharray="2 3"
                  opacity="0.55"
                />
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
            <text
              x={RPAD + 6}
              y={RPAD + 14}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              letterSpacing="0.1em"
            >
              ROC · threshold sweep
            </text>
          </svg>
        </div>
      </div>

      <div className="mlviz-readout">
        {/* Sliders for the four cells */}
        <div className="mlviz-row mlviz-controls" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
          <label className="mlviz-slider" style={{ minWidth: '180px', flex: '1 1 200px' }}>
            <span className="mlviz-slider-label" style={{ color: COLOR_TP }}>TP</span>
            <input
              type="range"
              min="0"
              max={MAX_PER_CELL}
              step="1"
              value={tp}
              onChange={(e) => { setTp(parseInt(e.target.value, 10)); setPresetKey('custom'); }}
            />
            <span className="mlviz-slider-val">{tp}</span>
          </label>
          <label className="mlviz-slider" style={{ minWidth: '180px', flex: '1 1 200px' }}>
            <span className="mlviz-slider-label" style={{ color: COLOR_FP }}>FP</span>
            <input
              type="range"
              min="0"
              max={MAX_PER_CELL}
              step="1"
              value={fp}
              onChange={(e) => { setFp(parseInt(e.target.value, 10)); setPresetKey('custom'); }}
            />
            <span className="mlviz-slider-val">{fp}</span>
          </label>
          <label className="mlviz-slider" style={{ minWidth: '180px', flex: '1 1 200px' }}>
            <span className="mlviz-slider-label" style={{ color: COLOR_FN }}>FN</span>
            <input
              type="range"
              min="0"
              max={MAX_PER_CELL}
              step="1"
              value={fn}
              onChange={(e) => { setFn(parseInt(e.target.value, 10)); setPresetKey('custom'); }}
            />
            <span className="mlviz-slider-val">{fn}</span>
          </label>
          <label className="mlviz-slider" style={{ minWidth: '180px', flex: '1 1 200px' }}>
            <span className="mlviz-slider-label" style={{ color: COLOR_TN }}>TN</span>
            <input
              type="range"
              min="0"
              max={MAX_PER_CELL}
              step="1"
              value={tn}
              onChange={(e) => { setTn(parseInt(e.target.value, 10)); setPresetKey('custom'); }}
            />
            <span className="mlviz-slider-val">{tn}</span>
          </label>
          <label className="mlviz-slider" style={{ minWidth: '220px', flex: '1 1 240px' }}>
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

        {/* Metric readouts + highlight toggles */}
        <div className="mlviz-row mlviz-row-hi" style={{ gap: '0.9rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setHighlight(highlight === 'accuracy' ? 'none' : 'accuracy')}
            style={{
              flex: '1 1 130px',
              minWidth: '120px',
              padding: '0.45rem 0.6rem',
              background: highlight === 'accuracy' ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)',
              border: `1px solid ${highlight === 'accuracy' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontFamily: 'var(--mono)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>accuracy</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: highlight === 'accuracy' ? 'var(--accent)' : 'var(--text-main)' }}>
              {snap(displayMetrics.accuracy * 100, 1)}%
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>(TP+TN) / total</span>
          </button>

          <button
            type="button"
            onClick={() => setHighlight(highlight === 'precision' ? 'none' : 'precision')}
            style={{
              flex: '1 1 130px',
              minWidth: '120px',
              padding: '0.45rem 0.6rem',
              background: highlight === 'precision' ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)',
              border: `1px solid ${highlight === 'precision' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontFamily: 'var(--mono)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>precision</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: highlight === 'precision' ? 'var(--accent)' : 'var(--text-main)' }}>
              {snap(displayMetrics.precision, 3)}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>TP / (TP+FP) · column</span>
          </button>

          <button
            type="button"
            onClick={() => setHighlight(highlight === 'recall' ? 'none' : 'recall')}
            style={{
              flex: '1 1 130px',
              minWidth: '120px',
              padding: '0.45rem 0.6rem',
              background: highlight === 'recall' ? 'rgba(var(--accent-rgb, 0,255,245), 0.10)' : 'var(--surface)',
              border: `1px solid ${highlight === 'recall' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontFamily: 'var(--mono)',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>recall</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: highlight === 'recall' ? 'var(--accent)' : 'var(--text-main)' }}>
              {snap(displayMetrics.recall, 3)}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>TP / (TP+FN) · row</span>
          </button>

          <div
            style={{
              flex: '1 1 130px',
              minWidth: '120px',
              padding: '0.45rem 0.6rem',
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontFamily: 'var(--mono)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>F1 score</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent)' }}>
              {snap(displayMetrics.f1, 3)}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>2 · P · R / (P + R)</span>
          </div>
        </div>

        <div
          className="mlviz-row"
          style={{
            gap: '0.6rem',
            fontFamily: 'var(--mono)',
            fontSize: '0.72rem',
            color: 'var(--text-dim)',
            flexWrap: 'wrap',
          }}
        >
          <span>total = {displayMetrics.total}</span>
          <span>P / N = {totalP} / {totalN}</span>
          <span>FPR = {snap(displayMetrics.fpr, 3)}</span>
          <span>specificity = {snap(displayMetrics.specificity, 3)}</span>
          {threshold !== 0.5 && (
            <span style={{ color: 'var(--accent)' }}>
              base @ t=0.50 · P={snap(baseMetrics.precision, 3)} R={snap(baseMetrics.recall, 3)} F1={snap(baseMetrics.f1, 3)}
            </span>
          )}
        </div>

        {/* Presets */}
        <div className="mlviz-row mt-presets" style={{ gap: '0.4rem', paddingTop: '0.25rem', flexWrap: 'wrap' }}>
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
          drag the 4 cell counts · click a metric tile to highlight its geometry · threshold re-grades a synthetic score distribution that matches your matrix at t=0.50
        </div>
      </div>
    </div>
  );
}
