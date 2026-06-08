import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const SIZE = 380;
const PAD = 22;
const PLOT = SIZE - PAD * 2;
const UNIT = PLOT / 10; // -5 to 5 = 10 units
const ORIGIN_X = PAD + 5 * UNIT;
const ORIGIN_Y = PAD + 5 * UNIT;

const TRAIN_STEPS = 50;
const STEP_DELAY = 60;
const LR = 0.08;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function toScreen(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function sigmoid(z) {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

// Deterministic PRNG (mulberry32) seeded so the dataset is stable across renders.
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

// Box-Muller using a seeded uniform.
function makeGaussian(rand) {
  return function gauss(mu, sigma) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mu + sigma * z;
  };
}

function buildDataset() {
  const rand = mulberry32(20260607);
  const g = makeGaussian(rand);
  const points = [];
  for (let i = 0; i < 25; i++) {
    const x = clamp(g(-2, 0.9), -4.9, 4.9);
    const y = clamp(g(-1, 0.9), -4.9, 4.9);
    points.push({ x, y, label: 0 });
  }
  for (let i = 0; i < 25; i++) {
    const x = clamp(g(2, 0.9), -4.9, 4.9);
    const y = clamp(g(1.5, 0.9), -4.9, 4.9);
    points.push({ x, y, label: 1 });
  }
  return points;
}

function randWeights(seed) {
  const r = mulberry32(seed);
  return {
    w1: (r() - 0.5) * 1.4,
    w2: (r() - 0.5) * 1.4,
    b: (r() - 0.5) * 1.0,
  };
}

function computeMetrics(points, w1, w2, b) {
  let loss = 0;
  let correct = 0;
  const eps = 1e-9;
  for (const p of points) {
    const z = w1 * p.x + w2 * p.y + b;
    const yhat = sigmoid(z);
    const y = p.label;
    loss += -(y * Math.log(yhat + eps) + (1 - y) * Math.log(1 - yhat + eps));
    const pred = yhat >= 0.5 ? 1 : 0;
    if (pred === y) correct += 1;
  }
  return {
    loss: loss / points.length,
    accuracy: correct / points.length,
  };
}

function gradStep(points, w1, w2, b, lr) {
  let dw1 = 0;
  let dw2 = 0;
  let db = 0;
  const n = points.length;
  for (const p of points) {
    const z = w1 * p.x + w2 * p.y + b;
    const err = sigmoid(z) - p.label;
    dw1 += err * p.x;
    dw2 += err * p.y;
    db += err;
  }
  return {
    w1: w1 - lr * (dw1 / n),
    w2: w2 - lr * (dw2 / n),
    b: b - lr * (db / n),
  };
}

// Decision boundary: w1*x + w2*y + b = 0 => y = -(w1*x + b) / w2
// If w2 is near zero, line is near-vertical: x = -b / w1.
function boundaryEndpoints(w1, w2, b) {
  const X_HI = 5;
  const X_LO = -5;
  const Y_HI = 5;
  const Y_LO = -5;
  if (Math.abs(w2) > 1e-3) {
    const yLeft = -(w1 * X_LO + b) / w2;
    const yRight = -(w1 * X_HI + b) / w2;
    const pts = [];
    const cand = [
      { x: X_LO, y: yLeft },
      { x: X_HI, y: yRight },
    ];
    for (const p of cand) {
      if (p.y >= Y_LO && p.y <= Y_HI) pts.push(p);
    }
    // Add boundary crossings with top/bottom edges
    if (Math.abs(w1) > 1e-6) {
      const xTop = -(w2 * Y_HI + b) / w1;
      const xBot = -(w2 * Y_LO + b) / w1;
      if (xTop >= X_LO && xTop <= X_HI) pts.push({ x: xTop, y: Y_HI });
      if (xBot >= X_LO && xBot <= X_HI) pts.push({ x: xBot, y: Y_LO });
    }
    if (pts.length < 2) return null;
    // Take first two distinct points
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
  if (Math.abs(w1) > 1e-3) {
    const xv = -b / w1;
    if (xv < X_LO || xv > X_HI) return null;
    return [{ x: xv, y: Y_LO }, { x: xv, y: Y_HI }];
  }
  return null;
}

// Polygon of the class-1 (positive) half-plane clipped to the plot rect.
// Computed in data coords; we return SVG path data in screen coords.
function halfPlanePath(w1, w2, b, positive) {
  const corners = [
    { x: -5, y: -5 },
    { x: 5, y: -5 },
    { x: 5, y: 5 },
    { x: -5, y: 5 },
  ];
  const eval_ = (p) => w1 * p.x + w2 * p.y + b;
  const inside = (p) => (positive ? eval_(p) >= 0 : eval_(p) <= 0);
  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const cur = corners[i];
    const nxt = corners[(i + 1) % corners.length];
    const curIn = inside(cur);
    const nxtIn = inside(nxt);
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      // intersect edge with line w1*x + w2*y + b = 0
      const vCur = eval_(cur);
      const vNxt = eval_(nxt);
      const t = vCur / (vCur - vNxt);
      const ix = cur.x + t * (nxt.x - cur.x);
      const iy = cur.y + t * (nxt.y - cur.y);
      out.push({ x: ix, y: iy });
    }
  }
  if (out.length < 3) return null;
  return out.map((p, i) => {
    const { sx, sy } = toScreen(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
  }).join(' ') + ' Z';
}

function Grid() {
  const lines = [];
  for (let i = -5; i <= 5; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
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
  return <g>{lines}</g>;
}

const POINTS = buildDataset();

export default function LogisticRegressionViz() {
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const seedRef = useRef(7);

  const initialW = useMemo(() => randWeights(7), []);
  const [w1, setW1] = useState(initialW.w1);
  const [w2, setW2] = useState(initialW.w2);
  const [b, setB] = useState(initialW.b);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimers();
  }, [clearTimers]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const handleTrain = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    let cur = { w1, w2, b };
    let count = 0;
    const tick = () => {
      if (!runningRef.current) return;
      cur = gradStep(POINTS, cur.w1, cur.w2, cur.b, LR);
      setW1(cur.w1);
      setW2(cur.w2);
      setB(cur.b);
      setSteps((s) => s + 1);
      count += 1;
      if (count >= TRAIN_STEPS) {
        stopRun();
        return;
      }
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, STEP_DELAY);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [w1, w2, b, stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    seedRef.current = (seedRef.current * 1103515245 + 12345) >>> 0;
    const nw = randWeights(seedRef.current);
    setW1(nw.w1);
    setW2(nw.w2);
    setB(nw.b);
    setSteps(0);
  }, [stopRun]);

  const metrics = useMemo(() => computeMetrics(POINTS, w1, w2, b), [w1, w2, b]);
  const boundary = useMemo(() => boundaryEndpoints(w1, w2, b), [w1, w2, b]);
  const posPath = useMemo(() => halfPlanePath(w1, w2, b, true), [w1, w2, b]);
  const negPath = useMemo(() => halfPlanePath(w1, w2, b, false), [w1, w2, b]);

  const renderedPoints = useMemo(() => POINTS.map((p) => {
    const z = w1 * p.x + w2 * p.y + b;
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    return { ...p, pred, miss: pred !== p.label };
  }), [w1, w2, b]);

  const cls0 = 'var(--hue-sky, #5ecbff)';
  const cls1 = 'var(--hue-pink, #ff66cc)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          {/* half-plane tints */}
          {negPath && (
            <path d={negPath} fill={cls0} opacity="0.10" />
          )}
          {posPath && (
            <path d={posPath} fill={cls1} opacity="0.10" />
          )}

          <Grid />

          {/* axis ticks */}
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

          {/* decision boundary */}
          {boundary && (
            <line
              x1={toScreen(boundary[0].x, boundary[0].y).sx}
              y1={toScreen(boundary[0].x, boundary[0].y).sy}
              x2={toScreen(boundary[1].x, boundary[1].y).sx}
              y2={toScreen(boundary[1].x, boundary[1].y).sy}
              stroke="var(--accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}

          {/* data points */}
          {renderedPoints.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            const color = p.label === 0 ? cls0 : cls1;
            return (
              <g key={`pt${i}`}>
                {p.miss && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r="7.5"
                    fill="none"
                    stroke="var(--warning, #ffcc66)"
                    strokeWidth="2.2"
                    opacity="0.9"
                  />
                )}
                <circle
                  cx={sx}
                  cy={sy}
                  r="3.6"
                  fill={color}
                  stroke="var(--bg)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>loss</span>
          <span className="mlviz-val">{snap(metrics.loss, 4)}</span>
          <span className="mlviz-sub">acc {snap(metrics.accuracy * 100, 1)}%</span>
          <span className="mlviz-sub">step {steps}</span>
          <span className="mlviz-sub" style={{ color: cls0 }}>class 0 (-2, -1)</span>
          <span className="mlviz-sub" style={{ color: cls1 }}>class 1 (2, 1.5)</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">w1</span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.05"
              value={w1}
              onChange={(e) => setW1(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(w1, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">w2</span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.05"
              value={w2}
              onChange={(e) => setW2(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(w2, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">b</span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.05"
              value={b}
              onChange={(e) => setB(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(b, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleTrain}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : `Train ${TRAIN_STEPS}`}</span>
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
        </div>

        <div className="mlviz-hint">y = sigmoid(w1 x + w2 y + b) - ringed dots are misclassified</div>
      </div>
    </div>
  );
}
