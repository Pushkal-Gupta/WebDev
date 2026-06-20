import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Shuffle, RotateCcw } from 'lucide-react';
import './MLViz.css';

const SIZE = 400;
const PAD = 30;
const PLOT = SIZE - PAD * 2;
const X_LO = -5;
const X_HI = 5;
const Y_LO = -5;
const Y_HI = 5;
const X_RANGE = X_HI - X_LO;
const Y_RANGE = Y_HI - Y_LO;
const UNIT_X = PLOT / X_RANGE;
const UNIT_Y = PLOT / Y_RANGE;
const ORIGIN_X = PAD + (-X_LO) * UNIT_X;
const ORIGIN_Y = PAD + Y_HI * UNIT_Y;

const N_PER_CLASS = 15;

function snap(v, p = 3) {
  const mul = Math.pow(10, p);
  return Math.round(v * mul) / mul;
}

function toScreen(x, y) {
  return { sx: ORIGIN_X + x * UNIT_X, sy: ORIGIN_Y - y * UNIT_Y };
}

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

// Two slightly overlapping Gaussian-ish clusters with a true separating direction.
// Hidden boundary axis: 0.7*x + 1.0*y = 0. Class +1 offset above, -1 below.
function buildDataset(seed) {
  const rand = mulberry32(seed);
  const pts = [];

  // Box-Muller for mild Gaussian spread.
  const gauss = () => {
    const u1 = Math.max(rand(), 1e-9);
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  // Centers chosen so separation is real but clusters can graze each other.
  const c1x = 1.6;
  const c1y = 1.6;
  const c2x = -1.6;
  const c2y = -1.6;
  const spread = 1.15;

  for (let i = 0; i < N_PER_CLASS; i++) {
    const x = c1x + gauss() * spread;
    const y = c1y + gauss() * spread;
    pts.push({
      x: Math.max(X_LO + 0.3, Math.min(X_HI - 0.3, x)),
      y: Math.max(Y_LO + 0.3, Math.min(Y_HI - 0.3, y)),
      label: 1,
    });
  }
  for (let i = 0; i < N_PER_CLASS; i++) {
    const x = c2x + gauss() * spread;
    const y = c2y + gauss() * spread;
    pts.push({
      x: Math.max(X_LO + 0.3, Math.min(X_HI - 0.3, x)),
      y: Math.max(Y_LO + 0.3, Math.min(Y_HI - 0.3, y)),
      label: -1,
    });
  }
  return pts;
}

// Simplified SMO (sequential minimal optimization) for soft-margin linear SVM.
// Dual form: maximize sum(alpha_i) - 1/2 * sum_ij alpha_i alpha_j y_i y_j x_i.x_j
// subject to 0 <= alpha_i <= C, sum_i alpha_i y_i = 0.
// This is the classical Platt SMO reduced to the linear-kernel essentials.
function trainSVM(points, C, maxPasses = 8, tol = 1e-3) {
  const n = points.length;
  const X = points.map((p) => [p.x, p.y]);
  const y = points.map((p) => p.label);
  const alpha = new Array(n).fill(0);
  let b = 0;
  const dot = (a, c) => a[0] * c[0] + a[1] * c[1];

  // Pre-compute kernel matrix (linear).
  const K = new Array(n);
  for (let i = 0; i < n; i++) {
    K[i] = new Array(n);
    for (let j = 0; j < n; j++) K[i][j] = dot(X[i], X[j]);
  }

  // SMO needs a deterministic pseudo-random index pick that avoids j == i.
  let rngState = 0x12345 ^ (n * 2654435761);
  const rint = (max) => {
    rngState = (rngState * 1664525 + 1013904223) >>> 0;
    return rngState % max;
  };

  const decision = (i) => {
    let s = b;
    for (let k = 0; k < n; k++) s += alpha[k] * y[k] * K[k][i];
    return s;
  };

  let passes = 0;
  let safety = 0;
  while (passes < maxPasses && safety < 4000) {
    safety++;
    let changed = 0;
    for (let i = 0; i < n; i++) {
      const Ei = decision(i) - y[i];
      const yiEi = y[i] * Ei;
      if ((yiEi < -tol && alpha[i] < C) || (yiEi > tol && alpha[i] > 0)) {
        let j = rint(n);
        if (j === i) j = (j + 1) % n;
        const Ej = decision(j) - y[j];
        const aiOld = alpha[i];
        const ajOld = alpha[j];

        let L;
        let H;
        if (y[i] !== y[j]) {
          L = Math.max(0, ajOld - aiOld);
          H = Math.min(C, C + ajOld - aiOld);
        } else {
          L = Math.max(0, aiOld + ajOld - C);
          H = Math.min(C, aiOld + ajOld);
        }
        if (L === H) continue;

        const eta = 2 * K[i][j] - K[i][i] - K[j][j];
        if (eta >= 0) continue;

        let ajNew = ajOld - (y[j] * (Ei - Ej)) / eta;
        ajNew = Math.max(L, Math.min(H, ajNew));
        if (Math.abs(ajNew - ajOld) < 1e-5) continue;

        const aiNew = aiOld + y[i] * y[j] * (ajOld - ajNew);
        alpha[i] = aiNew;
        alpha[j] = ajNew;

        const b1 = b - Ei
          - y[i] * (aiNew - aiOld) * K[i][i]
          - y[j] * (ajNew - ajOld) * K[i][j];
        const b2 = b - Ej
          - y[i] * (aiNew - aiOld) * K[i][j]
          - y[j] * (ajNew - ajOld) * K[j][j];

        if (aiNew > 0 && aiNew < C) b = b1;
        else if (ajNew > 0 && ajNew < C) b = b2;
        else b = (b1 + b2) / 2;

        changed++;
      }
    }
    if (changed === 0) passes++;
    else passes = 0;
  }

  // Recover primal weights w = sum_i alpha_i y_i x_i.
  let w1 = 0;
  let w2 = 0;
  for (let i = 0; i < n; i++) {
    w1 += alpha[i] * y[i] * X[i][0];
    w2 += alpha[i] * y[i] * X[i][1];
  }

  return { w1, w2, b, alpha };
}

// Intersect a line ax + by + c = 0 with the plot rectangle, returning up to 2 boundary pts.
function clipLine(a, bcoef, c) {
  const eps = 1e-9;
  const pts = [];
  if (Math.abs(bcoef) > eps) {
    const yL = -(a * X_LO + c) / bcoef;
    const yR = -(a * X_HI + c) / bcoef;
    if (yL >= Y_LO - 1e-6 && yL <= Y_HI + 1e-6) pts.push({ x: X_LO, y: yL });
    if (yR >= Y_LO - 1e-6 && yR <= Y_HI + 1e-6) pts.push({ x: X_HI, y: yR });
  }
  if (Math.abs(a) > eps) {
    const xT = -(bcoef * Y_HI + c) / a;
    const xB = -(bcoef * Y_LO + c) / a;
    if (xT >= X_LO - 1e-6 && xT <= X_HI + 1e-6) pts.push({ x: xT, y: Y_HI });
    if (xB >= X_LO - 1e-6 && xB <= X_HI + 1e-6) pts.push({ x: xB, y: Y_LO });
  }
  if (pts.length < 2) return null;
  const seen = new Set();
  const uniq = [];
  for (const p of pts) {
    const k = `${snap(p.x, 2)}:${snap(p.y, 2)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(p);
    if (uniq.length === 2) break;
  }
  if (uniq.length < 2) return null;
  return uniq;
}

function Grid() {
  const lines = [];
  for (let i = X_LO; i <= X_HI; i++) {
    const { sx } = toScreen(i, 0);
    const major = i === 0;
    lines.push(
      <line
        key={`v${i}`}
        x1={sx}
        y1={PAD}
        x2={sx}
        y2={SIZE - PAD}
        stroke="var(--border)"
        strokeWidth={major ? 1.2 : 0.4}
      />
    );
  }
  for (let i = Y_LO; i <= Y_HI; i++) {
    const { sy } = toScreen(0, i);
    const major = i === 0;
    lines.push(
      <line
        key={`h${i}`}
        x1={PAD}
        y1={sy}
        x2={SIZE - PAD}
        y2={sy}
        stroke="var(--border)"
        strokeWidth={major ? 1.2 : 0.4}
      />
    );
  }
  return <g>{lines}</g>;
}

const INITIAL_SEED = 20260607;

export default function SVMViz() {
  const seedRef = useRef(INITIAL_SEED);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));
  const [C, setC] = useState(1.0);

  const model = useMemo(() => trainSVM(points, C), [points, C]);
  const { w1, w2, b, alpha } = model;

  // Support vectors: those with non-trivial alpha. Use a small threshold relative to C.
  const svThresh = Math.max(1e-4, C * 1e-3);
  const supportIdx = useMemo(
    () => alpha.map((a, i) => (a > svThresh ? i : -1)).filter((i) => i >= 0),
    [alpha, svThresh],
  );

  const wNorm = Math.sqrt(w1 * w1 + w2 * w2);
  const marginWidth = wNorm > 1e-8 ? 2 / wNorm : 0;

  const boundary = useMemo(() => clipLine(w1, w2, b), [w1, w2, b]);
  const marginPos = useMemo(() => clipLine(w1, w2, b - 1), [w1, w2, b]);
  const marginNeg = useMemo(() => clipLine(w1, w2, b + 1), [w1, w2, b]);

  // Train accuracy on the current model.
  const { trainAcc, classification } = useMemo(() => {
    let correct = 0;
    const cls = points.map((p) => {
      const score = w1 * p.x + w2 * p.y + b;
      const pred = score >= 0 ? 1 : -1;
      const ok = pred === p.label;
      if (ok) correct++;
      return { ...p, score, pred, correct: ok };
    });
    return { trainAcc: cls.length ? correct / cls.length : 0, classification: cls };
  }, [points, w1, w2, b]);

  // For the labeled margin arrow: perpendicular segment between the two dashed lines,
  // anchored near the boundary midpoint, projected onto the w direction.
  const marginArrow = useMemo(() => {
    if (!boundary || wNorm < 1e-8) return null;
    const mx = (boundary[0].x + boundary[1].x) / 2;
    const my = (boundary[0].y + boundary[1].y) / 2;
    const nx = w1 / wNorm;
    const ny = w2 / wNorm;
    const half = marginWidth / 2;
    const p1 = { x: mx + nx * half, y: my + ny * half };
    const p2 = { x: mx - nx * half, y: my - ny * half };
    // Pull arrow slightly off-center so it doesn't sit exactly on the boundary midpoint.
    const slideAlong = 1.2;
    const tx = -ny;
    const ty = nx;
    return {
      p1: { x: p1.x + tx * slideAlong, y: p1.y + ty * slideAlong },
      p2: { x: p2.x + tx * slideAlong, y: p2.y + ty * slideAlong },
      mid: { x: mx + tx * slideAlong, y: my + ty * slideAlong },
    };
  }, [boundary, w1, w2, wNorm, marginWidth]);

  const handleShuffle = useCallback(() => {
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
  }, []);

  const handleReset = useCallback(() => {
    seedRef.current = INITIAL_SEED;
    setSeed(INITIAL_SEED);
    setPoints(buildDataset(INITIAL_SEED));
    setC(1.0);
  }, []);

  const colPos = 'var(--hue-sky, #5ecbff)';
  const colNeg = 'var(--hue-pink, #ff66cc)';
  const colSV = 'var(--warning, #f5b342)';
  const supportSet = new Set(supportIdx);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lineTransition = reducedMotion ? 'none' : 'x1 0.25s ease, y1 0.25s ease, x2 0.25s ease, y2 0.25s ease';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <linearGradient id="svm-boundary-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--hue-violet)" />
            </linearGradient>
            <filter id="svm-boundary-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.4" />
            </filter>
            <filter id="svm-sv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
            <marker
              id="svm-arrow-end"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <marker
              id="svm-arrow-start"
              viewBox="0 0 10 10"
              refX="2"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M10,0 L0,5 L10,10 z" fill="var(--accent)" />
            </marker>
          </defs>

          <Grid />

          {[-4, -2, 2, 4].map((t) => {
            const { sx } = toScreen(t, 0);
            const { sy } = toScreen(0, t);
            return (
              <g key={`tk${t}`}>
                <text
                  x={sx}
                  y={ORIGIN_Y + 12}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >{t}</text>
                <text
                  x={ORIGIN_X - 6}
                  y={sy + 3}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >{t}</text>
              </g>
            );
          })}

          <text
            x={SIZE - PAD + 2}
            y={ORIGIN_Y - 4}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
          >x1</text>
          <text
            x={ORIGIN_X + 6}
            y={PAD + 4}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >x2</text>

          {/* margin lines (dashed) */}
          {marginPos && (
            <line
              x1={toScreen(marginPos[0].x, marginPos[0].y).sx}
              y1={toScreen(marginPos[0].x, marginPos[0].y).sy}
              x2={toScreen(marginPos[1].x, marginPos[1].y).sx}
              y2={toScreen(marginPos[1].x, marginPos[1].y).sy}
              stroke={colPos}
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.85"
            />
          )}
          {marginNeg && (
            <line
              x1={toScreen(marginNeg[0].x, marginNeg[0].y).sx}
              y1={toScreen(marginNeg[0].x, marginNeg[0].y).sy}
              x2={toScreen(marginNeg[1].x, marginNeg[1].y).sx}
              y2={toScreen(marginNeg[1].x, marginNeg[1].y).sy}
              stroke={colNeg}
              strokeWidth="1.4"
              strokeDasharray="5 4"
              opacity="0.85"
            />
          )}

          {/* decision boundary (solid) — blurred glow duplicate under the crisp stroke */}
          {boundary && (
            <g>
              <line
                x1={toScreen(boundary[0].x, boundary[0].y).sx}
                y1={toScreen(boundary[0].x, boundary[0].y).sy}
                x2={toScreen(boundary[1].x, boundary[1].y).sx}
                y2={toScreen(boundary[1].x, boundary[1].y).sy}
                stroke="url(#svm-boundary-grad)"
                strokeWidth="5"
                strokeLinecap="round"
                filter="url(#svm-boundary-glow)"
                opacity="0.5"
                style={{ transition: lineTransition }}
              />
              <line
                x1={toScreen(boundary[0].x, boundary[0].y).sx}
                y1={toScreen(boundary[0].x, boundary[0].y).sy}
                x2={toScreen(boundary[1].x, boundary[1].y).sx}
                y2={toScreen(boundary[1].x, boundary[1].y).sy}
                stroke="url(#svm-boundary-grad)"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.97"
                style={{ transition: lineTransition }}
              />
            </g>
          )}

          {/* labeled margin arrow */}
          {marginArrow && (() => {
            const a = toScreen(marginArrow.p1.x, marginArrow.p1.y);
            const e = toScreen(marginArrow.p2.x, marginArrow.p2.y);
            const m = toScreen(marginArrow.mid.x, marginArrow.mid.y);
            return (
              <g>
                <line
                  x1={a.sx}
                  y1={a.sy}
                  x2={e.sx}
                  y2={e.sy}
                  stroke="var(--accent)"
                  strokeWidth="1.6"
                  markerStart="url(#svm-arrow-start)"
                  markerEnd="url(#svm-arrow-end)"
                  opacity="0.9"
                />
                <rect
                  x={m.sx - 26}
                  y={m.sy - 8}
                  width="52"
                  height="14"
                  rx="3"
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="0.8"
                  opacity="0.92"
                />
                <text
                  x={m.sx}
                  y={m.sy + 2}
                  fontSize="9"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                  fill="var(--text-main)"
                >
                  2/||w|| {snap(marginWidth, 2)}
                </text>
              </g>
            );
          })()}

          {/* support-vector highlight rings — soft glow halo behind the dashed ring */}
          {classification.map((p, i) => {
            if (!supportSet.has(i)) return null;
            const { sx, sy } = toScreen(p.x, p.y);
            return (
              <g key={`sv${i}`}>
                <circle
                  cx={sx}
                  cy={sy}
                  r="9.5"
                  fill={colSV}
                  filter="url(#svm-sv-glow)"
                  opacity="0.4"
                />
                <circle
                  cx={sx}
                  cy={sy}
                  r="9"
                  fill="none"
                  stroke={colSV}
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                  opacity="0.95"
                />
              </g>
            );
          })}

          {/* data points */}
          {classification.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            const base = p.label === 1 ? colPos : colNeg;
            return (
              <g key={`pt${i}`}>
                {!p.correct && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r="6.6"
                    fill="none"
                    stroke="var(--hard, #ff5c7a)"
                    strokeWidth="1.3"
                    opacity="0.9"
                  />
                )}
                {p.label === 1 ? (
                  <circle
                    cx={sx}
                    cy={sy}
                    r="3.8"
                    fill={base}
                    stroke="var(--bg)"
                    strokeWidth="1"
                  />
                ) : (
                  <rect
                    x={sx - 3.4}
                    y={sy - 3.4}
                    width="6.8"
                    height="6.8"
                    fill={base}
                    stroke="var(--bg)"
                    strokeWidth="1"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-statcol">
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-accent">
              <span className="mlviz-statcard-label">support vectors</span>
              <span className="mlviz-statcard-val">{supportIdx.length}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-mint">
              <span className="mlviz-statcard-label">margin 2/‖w‖</span>
              <span className="mlviz-statcard-val">{snap(marginWidth, 3)}</span>
            </div>
            <div className="mlviz-statcard">
              <span className="mlviz-statcard-label">train acc</span>
              <span className="mlviz-statcard-val">{snap(trainAcc * 100, 1)}%</span>
            </div>
          </div>
          <div className="mlviz-statrow">
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">w1</span>
              <span className="mlviz-statcard-val">{snap(w1, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">w2</span>
              <span className="mlviz-statcard-val">{snap(w2, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">b</span>
              <span className="mlviz-statcard-val">{snap(b, 3)}</span>
            </div>
            <div className="mlviz-statcard mlviz-statcard-dim">
              <span className="mlviz-statcard-label">seed</span>
              <span className="mlviz-statcard-val">{seed}</span>
            </div>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">C (regularization)</span>
            <input
              type="range"
              min="0.05"
              max="10"
              step="0.05"
              value={C}
              onChange={(e) => setC(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(C, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleShuffle}
          >
            <Shuffle size={13} />
            <span>Re-shuffle data</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          Solid line: w&middot;x + b = 0. Dashed lines: w&middot;x + b = &plusmn;1.
          Highlighted points are support vectors. Smaller C tolerates more
          misclassification for a wider margin.
        </div>
      </div>
    </div>
  );
}
