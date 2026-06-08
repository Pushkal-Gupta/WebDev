import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/*
 * SGD vs Mini-batch vs Batch GD on f(w1, w2) = w1^2 + 4*w2^2.
 * True gradient: (2*w1, 8*w2). Each "sample" gradient is the true gradient
 * plus seeded zero-mean noise; batch averages B samples. Larger batch -> less noise.
 */

const W = 560;
const H = 360;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 32;
const X_MIN = -3.6;
const X_MAX = 3.6;
const Y_MIN = -2.4;
const Y_MAX = 2.4;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const MAX_STEPS = 80;
const STEP_DELAY = 90;
const TOTAL_SAMPLES = 256;
const NOISE_SIGMA = 4.5;

const START_W1 = 3.0;
const START_W2 = 2.0;

const COLOR_BATCH = 'var(--hue-sky, #5ecbff)';
const COLOR_MINI = 'var(--hue-mint, #6ee0a8)';
const COLOR_SGD = 'var(--hue-pink, #ff66cc)';

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}
function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function loss(w1, w2) {
  return w1 * w1 + 4 * w2 * w2;
}
function trueGrad(w1, w2) {
  return [2 * w1, 8 * w2];
}

/* Mulberry32 — small seeded PRNG so SGD trajectories are reproducible per Reset. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Box-Muller via a uniform PRNG -> standard normal. */
function gauss(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* Sample-level gradient = true gradient + Gaussian noise per coord.
   Batch of size B averages B samples -> noise variance shrinks by 1/B. */
function noisyGrad(w1, w2, batchSize, rng) {
  const [g1, g2] = trueGrad(w1, w2);
  let sum1 = 0;
  let sum2 = 0;
  for (let i = 0; i < batchSize; i++) {
    sum1 += g1 + NOISE_SIGMA * gauss(rng);
    sum2 += g2 + NOISE_SIGMA * gauss(rng);
  }
  return [sum1 / batchSize, sum2 / batchSize];
}

/* Contour levels chosen on a log-ish scale so the bowl reads clearly. */
const CONTOUR_LEVELS = [0.5, 1.5, 4, 8, 14, 22, 32, 44];

/* Heatmap grid for the loss surface. Each cell shaded by f(w1,w2). */
const HEAT_NX = 56;
const HEAT_NY = 36;

function buildHeatmap() {
  const cells = [];
  const dx = (X_MAX - X_MIN) / HEAT_NX;
  const dy = (Y_MAX - Y_MIN) / HEAT_NY;
  let maxL = 0;
  // First pass: collect
  const grid = [];
  for (let j = 0; j < HEAT_NY; j++) {
    const row = [];
    const w2 = Y_MIN + (j + 0.5) * dy;
    for (let i = 0; i < HEAT_NX; i++) {
      const w1 = X_MIN + (i + 0.5) * dx;
      const l = loss(w1, w2);
      row.push(l);
      if (l > maxL) maxL = l;
    }
    grid.push(row);
  }
  // Second pass: build rectangles with normalized intensity
  for (let j = 0; j < HEAT_NY; j++) {
    for (let i = 0; i < HEAT_NX; i++) {
      const l = grid[j][i];
      const t = Math.min(1, Math.pow(l / maxL, 0.55));
      // Lower loss = stronger accent fill; higher loss = transparent
      const op = 0.35 * (1 - t) + 0.02;
      cells.push({
        x: PAD_L + (i / HEAT_NX) * PLOT_W,
        y: PAD_T + (j / HEAT_NY) * PLOT_H,
        w: PLOT_W / HEAT_NX + 0.6,
        h: PLOT_H / HEAT_NY + 0.6,
        op,
      });
    }
  }
  return cells;
}

/* Contour ellipses: f = c => (w1/sqrt(c))^2 + (w2/sqrt(c/4))^2 = 1.
   Major radius along w1 = sqrt(c), minor radius along w2 = sqrt(c)/2. */
function buildContours() {
  return CONTOUR_LEVELS.map((c) => {
    const rW1 = Math.sqrt(c);
    const rW2 = Math.sqrt(c) / 2;
    const cx = xToPx(0);
    const cy = yToPx(0);
    const rx = (rW1 / (X_MAX - X_MIN)) * PLOT_W;
    const ry = (rW2 / (Y_MAX - Y_MIN)) * PLOT_H;
    return { c, cx, cy, rx, ry };
  });
}

export default function SGDComparisonViz() {
  const [batchSize, setBatchSize] = useState(16);
  const [lr, setLr] = useState(0.04);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [trails, setTrails] = useState({
    batch: [[START_W1, START_W2]],
    mini: [[START_W1, START_W2]],
    sgd: [[START_W1, START_W2]],
  });

  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const rngMiniRef = useRef(mulberry32(0xc0ffee));
  const rngSgdRef = useRef(mulberry32(0xbadcab1e));

  const heatCells = useMemo(() => buildHeatmap(), []);
  const contours = useMemo(() => buildContours(), []);

  const lrRef = useRef(lr);
  const batchRef = useRef(batchSize);
  useEffect(() => { lrRef.current = lr; }, [lr]);
  useEffect(() => { batchRef.current = batchSize; }, [batchSize]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimer();
  }, [clearTimer]);

  const doStep = useCallback(() => {
    const curLr = lrRef.current;
    const curBatch = batchRef.current;
    setTrails((prev) => {
      const batchLast = prev.batch[prev.batch.length - 1];
      const miniLast = prev.mini[prev.mini.length - 1];
      const sgdLast = prev.sgd[prev.sgd.length - 1];

      // Batch GD: full data => true gradient (no noise).
      const [bg1, bg2] = trueGrad(batchLast[0], batchLast[1]);
      const batchNext = [
        clampX(batchLast[0] - curLr * bg1),
        clampY(batchLast[1] - curLr * bg2),
      ];

      // Mini-batch SGD with the slider's batch size.
      const [mg1, mg2] = noisyGrad(miniLast[0], miniLast[1], curBatch, rngMiniRef.current);
      const miniNext = [
        clampX(miniLast[0] - curLr * mg1),
        clampY(miniLast[1] - curLr * mg2),
      ];

      // Pure SGD: batch of 1.
      const [sg1, sg2] = noisyGrad(sgdLast[0], sgdLast[1], 1, rngSgdRef.current);
      const sgdNext = [
        clampX(sgdLast[0] - curLr * sg1),
        clampY(sgdLast[1] - curLr * sg2),
      ];

      return {
        batch: [...prev.batch, batchNext],
        mini: [...prev.mini, miniNext],
        sgd: [...prev.sgd, sgdNext],
      };
    });
    setSteps((s) => s + 1);
  }, []);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    if (steps >= MAX_STEPS) return;
    doStep();
  }, [doStep, steps]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      clearTimer();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    let count = steps;
    const tick = () => {
      if (!runningRef.current) return;
      doStep();
      count += 1;
      if (count >= MAX_STEPS) {
        runningRef.current = false;
        setRunning(false);
        clearTimer();
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, STEP_DELAY);
  }, [clearTimer, doStep, steps]);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
    setSteps(0);
    setTrails({
      batch: [[START_W1, START_W2]],
      mini: [[START_W1, START_W2]],
      sgd: [[START_W1, START_W2]],
    });
    // Re-seed PRNGs so trajectories are reproducible between resets.
    rngMiniRef.current = mulberry32(0xc0ffee);
    rngSgdRef.current = mulberry32(0xbadcab1e);
  }, [clearTimer]);

  const batchHead = trails.batch[trails.batch.length - 1];
  const miniHead = trails.mini[trails.mini.length - 1];
  const sgdHead = trails.sgd[trails.sgd.length - 1];

  const lossBatch = loss(batchHead[0], batchHead[1]);
  const lossMini = loss(miniHead[0], miniHead[1]);
  const lossSgd = loss(sgdHead[0], sgdHead[1]);

  const batchPath = trailPath(trails.batch);
  const miniPath = trailPath(trails.mini);
  const sgdPath = trailPath(trails.sgd);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg sgdc-svg">
          <defs>
            <marker id="sgdc-arrow-batch" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={COLOR_BATCH} />
            </marker>
            <marker id="sgdc-arrow-mini" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={COLOR_MINI} />
            </marker>
            <marker id="sgdc-arrow-sgd" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 z" fill={COLOR_SGD} />
            </marker>
          </defs>

          {/* Heatmap (loss surface intensity) */}
          {heatCells.map((c, i) => (
            <rect
              key={`hm${i}`}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill="var(--accent)"
              opacity={c.op}
              shapeRendering="crispEdges"
            />
          ))}

          {/* Contour ellipses */}
          {contours.map((co, i) => (
            <ellipse
              key={`co${i}`}
              cx={co.cx}
              cy={co.cy}
              rx={co.rx}
              ry={co.ry}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
              opacity={0.55}
              strokeDasharray={i % 2 === 0 ? '' : '3 3'}
            />
          ))}

          {/* axes */}
          <line x1={PAD_L} y1={yToPx(0)} x2={W - PAD_R} y2={yToPx(0)} stroke="var(--border)" strokeWidth="1" opacity="0.5" />
          <line x1={xToPx(0)} y1={PAD_T} x2={xToPx(0)} y2={H - PAD_B} stroke="var(--border)" strokeWidth="1" opacity="0.5" />

          {/* axis ticks */}
          {[-3, -2, -1, 1, 2, 3].map((tx) => (
            <text
              key={`xt${tx}`}
              x={xToPx(tx)}
              y={H - PAD_B + 14}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              {tx}
            </text>
          ))}
          {[-2, -1, 1, 2].map((ty) => (
            <text
              key={`yt${ty}`}
              x={PAD_L - 6}
              y={yToPx(ty) + 3}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
            >
              {ty}
            </text>
          ))}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yToPx(0) - 6}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            w1
          </text>
          <text
            x={xToPx(0) + 6}
            y={PAD_T + 4}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
          >
            w2
          </text>

          {/* minimum marker */}
          <circle cx={xToPx(0)} cy={yToPx(0)} r={4} fill="var(--accent)" opacity="0.9" />
          <circle cx={xToPx(0)} cy={yToPx(0)} r={9} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

          {/* trajectories */}
          <path d={sgdPath} fill="none" stroke={COLOR_SGD} strokeWidth="1.6" strokeOpacity="0.85" strokeLinejoin="round" strokeLinecap="round" />
          <path d={miniPath} fill="none" stroke={COLOR_MINI} strokeWidth="2" strokeOpacity="0.95" strokeLinejoin="round" strokeLinecap="round" />
          <path d={batchPath} fill="none" stroke={COLOR_BATCH} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

          {/* trail dots (subtle markers) */}
          {trails.sgd.map((p, i) => (
            <circle key={`sd${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.6} fill={COLOR_SGD} opacity={0.55} />
          ))}
          {trails.mini.map((p, i) => (
            <circle key={`md${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.7} fill={COLOR_MINI} opacity={0.7} />
          ))}
          {trails.batch.map((p, i) => (
            <circle key={`bd${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.9} fill={COLOR_BATCH} opacity={0.85} />
          ))}

          {/* start marker */}
          <circle cx={xToPx(START_W1)} cy={yToPx(START_W2)} r={5} fill="none" stroke="var(--text-dim)" strokeWidth="1.5" />
          <text
            x={xToPx(START_W1) + 8}
            y={yToPx(START_W2) - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >
            start
          </text>

          {/* current heads */}
          <circle cx={xToPx(sgdHead[0])} cy={yToPx(sgdHead[1])} r={5.5} fill={COLOR_SGD} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(miniHead[0])} cy={yToPx(miniHead[1])} r={5.5} fill={COLOR_MINI} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(batchHead[0])} cy={yToPx(batchHead[1])} r={5.5} fill={COLOR_BATCH} stroke="var(--bg)" strokeWidth="1.5" />

          {/* legend */}
          <g transform={`translate(${W - PAD_R - 156}, ${PAD_T + 6})`}>
            <rect x="-6" y="-6" width="162" height="62" rx="6" fill="var(--surface)" opacity="0.85" stroke="var(--border)" />
            <g transform="translate(0, 6)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_BATCH} strokeWidth="2.2" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Batch GD</text>
            </g>
            <g transform="translate(0, 22)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_MINI} strokeWidth="2" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Mini-batch ({batchSize})</text>
            </g>
            <g transform="translate(0, 38)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_SGD} strokeWidth="1.6" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Pure SGD</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row sgdc-stats-row">
          <div className="sgdc-stat">
            <span className="sgdc-stat-tag" style={{ color: COLOR_BATCH }}>Batch GD</span>
            <span className="mlviz-val">loss {snap(lossBatch, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">w=({snap(batchHead[0], 2)}, {snap(batchHead[1], 2)})</span>
          </div>
          <div className="sgdc-stat">
            <span className="sgdc-stat-tag" style={{ color: COLOR_MINI }}>Mini-batch</span>
            <span className="mlviz-val">loss {snap(lossMini, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">w=({snap(miniHead[0], 2)}, {snap(miniHead[1], 2)})</span>
          </div>
          <div className="sgdc-stat">
            <span className="sgdc-stat-tag" style={{ color: COLOR_SGD }}>Pure SGD</span>
            <span className="mlviz-val">loss {snap(lossSgd, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">w=({snap(sgdHead[0], 2)}, {snap(sgdHead[1], 2)})</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">batch size</span>
            <input
              type="range"
              min="2"
              max="128"
              step="1"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value, 10))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{batchSize}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate</span>
            <input
              type="range"
              min="0.005"
              max="0.12"
              step="0.005"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(lr, 3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || steps >= MAX_STEPS}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={steps >= MAX_STEPS && !running}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : `Run ${MAX_STEPS}`}</span>
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
          f(w1, w2) = w1² + 4·w2² · gradient noise scaled by 1/√batch · {TOTAL_SAMPLES} synthetic samples
        </div>
      </div>

      <style>{`
        .sgdc-svg {
          aspect-ratio: ${W} / ${H};
          max-width: 100%;
        }
        .sgdc-stats-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.6rem;
          align-items: stretch;
        }
        .sgdc-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.45rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          min-width: 0;
        }
        .sgdc-stat-tag {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .sgdc-stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function clampX(v) {
  if (v < X_MIN) return X_MIN;
  if (v > X_MAX) return X_MAX;
  return v;
}
function clampY(v) {
  if (v < Y_MIN) return Y_MIN;
  if (v > Y_MAX) return Y_MAX;
  return v;
}

function trailPath(points) {
  if (!points.length) return '';
  const parts = [];
  for (let i = 0; i < points.length; i++) {
    const [w1, w2] = points[i];
    parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(w1).toFixed(2)},${yToPx(w2).toFixed(2)}`);
  }
  return parts.join(' ');
}
