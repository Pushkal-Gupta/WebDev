import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { StepForward, Play, RotateCcw, Shuffle, Square } from 'lucide-react';
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
const MAX_STEPS = 200;
const STEP_DELAY = 240;

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

// Linearly-separable dataset with a margin.
// Hidden true boundary: 0.6*x + 1.0*y + 0.2 = 0 (i.e. y = -0.6x - 0.2).
// Class +1 above the margin band, class -1 below.
function buildDataset(seed) {
  const rand = mulberry32(seed);
  const tw1 = 0.6;
  const tw2 = 1.0;
  const tb = 0.2;
  const norm = Math.sqrt(tw1 * tw1 + tw2 * tw2);
  const margin = 0.9; // unit-margin band each side
  const pts = [];
  let safety = 0;
  while (pts.filter((p) => p.label === 1).length < N_PER_CLASS && safety < 2000) {
    safety++;
    const x = X_LO + 0.7 + rand() * (X_RANGE - 1.4);
    const y = Y_LO + 0.7 + rand() * (Y_RANGE - 1.4);
    const signed = (tw1 * x + tw2 * y + tb) / norm;
    if (signed > margin) pts.push({ x, y, label: 1 });
  }
  safety = 0;
  while (pts.filter((p) => p.label === -1).length < N_PER_CLASS && safety < 2000) {
    safety++;
    const x = X_LO + 0.7 + rand() * (X_RANGE - 1.4);
    const y = Y_LO + 0.7 + rand() * (Y_RANGE - 1.4);
    const signed = (tw1 * x + tw2 * y + tb) / norm;
    if (signed < -margin) pts.push({ x, y, label: -1 });
  }
  return pts;
}

// Sign with +1 fallback on zero (matches the classical perceptron convention).
function sgn(v) { return v >= 0 ? 1 : -1; }

// Clip the boundary w1*x + w2*y + b = 0 to plot window.
// If w2 != 0: y = -(w1*x + b)/w2. Else vertical line x = -b/w1.
function boundaryEndpoints(w1, w2, b) {
  const eps = 1e-8;
  const pts = [];
  if (Math.abs(w2) > eps) {
    const yL = -(w1 * X_LO + b) / w2;
    const yR = -(w1 * X_HI + b) / w2;
    if (yL >= Y_LO && yL <= Y_HI) pts.push({ x: X_LO, y: yL });
    if (yR >= Y_LO && yR <= Y_HI) pts.push({ x: X_HI, y: yR });
  }
  if (Math.abs(w1) > eps) {
    const xT = -(w2 * Y_HI + b) / w1;
    const xB = -(w2 * Y_LO + b) / w1;
    if (xT >= X_LO && xT <= X_HI) pts.push({ x: xT, y: Y_HI });
    if (xB >= X_LO && xB <= X_HI) pts.push({ x: xB, y: Y_LO });
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

export default function PerceptronViz() {
  const timeoutRef = useRef(null);
  const runningRef = useRef(false);
  const seedRef = useRef(INITIAL_SEED);

  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));

  // Initial weights chosen so the first boundary is visibly wrong.
  const [w1, setW1] = useState(-0.8);
  const [w2, setW2] = useState(0.3);
  const [b, setB] = useState(0);

  // Track sliders separately so dragging them does not get clobbered by training.
  const [initW1, setInitW1] = useState(-0.8);
  const [initW2, setInitW2] = useState(0.3);

  const [stepCount, setStepCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null); // index of last touched point
  const [training, setTraining] = useState(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimers();
  }, [clearTimers]);

  const stopTraining = useCallback(() => {
    runningRef.current = false;
    setTraining(false);
    clearTimers();
  }, [clearTimers]);

  // Misclassification map for current weights.
  const classification = useMemo(() => points.map((p) => {
    const pred = sgn(w1 * p.x + w2 * p.y + b);
    return { ...p, pred, correct: pred === p.label };
  }), [points, w1, w2, b]);

  const misCount = useMemo(
    () => classification.reduce((acc, c) => acc + (c.correct ? 0 : 1), 0),
    [classification],
  );

  const boundary = useMemo(() => boundaryEndpoints(w1, w2, b), [w1, w2, b]);

  // Pick the next misclassified index given current weights and last touched.
  // Cycles through points deterministically for stability.
  const pickNextMisIndex = useCallback((cw1, cw2, cb, fromIdx) => {
    const n = points.length;
    if (!n) return -1;
    const start = ((fromIdx ?? -1) + 1 + n) % n;
    for (let k = 0; k < n; k++) {
      const i = (start + k) % n;
      const p = points[i];
      const pred = sgn(cw1 * p.x + cw2 * p.y + cb);
      if (pred !== p.label) return i;
    }
    return -1;
  }, [points]);

  // Apply one perceptron update on a chosen index. Returns new weights.
  const applyUpdate = useCallback((idx, cw1, cw2, cb) => {
    const p = points[idx];
    return {
      w1: cw1 + p.label * p.x,
      w2: cw2 + p.label * p.y,
      b: cb + p.label,
    };
  }, [points]);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    const idx = pickNextMisIndex(w1, w2, b, lastUpdated);
    if (idx === -1) {
      setLastUpdated(null);
      return;
    }
    const next = applyUpdate(idx, w1, w2, b);
    setW1(next.w1);
    setW2(next.w2);
    setB(next.b);
    setLastUpdated(idx);
    setStepCount((s) => s + 1);
  }, [pickNextMisIndex, applyUpdate, w1, w2, b, lastUpdated]);

  const handleTrain = useCallback(() => {
    if (runningRef.current) {
      stopTraining();
      return;
    }
    runningRef.current = true;
    setTraining(true);

    let cw1 = w1;
    let cw2 = w2;
    let cb = b;
    let last = lastUpdated;
    let local = 0;

    const tick = () => {
      if (!runningRef.current) return;
      const idx = pickNextMisIndex(cw1, cw2, cb, last);
      if (idx === -1 || local >= MAX_STEPS) {
        setW1(cw1);
        setW2(cw2);
        setB(cb);
        setLastUpdated(idx === -1 ? null : last);
        stopTraining();
        return;
      }
      const next = applyUpdate(idx, cw1, cw2, cb);
      cw1 = next.w1;
      cw2 = next.w2;
      cb = next.b;
      last = idx;
      local += 1;

      setW1(cw1);
      setW2(cw2);
      setB(cb);
      setLastUpdated(idx);
      setStepCount((s) => s + 1);

      timeoutRef.current = setTimeout(tick, STEP_DELAY);
    };

    tick();
  }, [pickNextMisIndex, applyUpdate, w1, w2, b, lastUpdated, stopTraining]);

  const handleNewSample = useCallback(() => {
    stopTraining();
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
    setW1(initW1);
    setW2(initW2);
    setB(0);
    setStepCount(0);
    setLastUpdated(null);
  }, [stopTraining, initW1, initW2]);

  const handleReset = useCallback(() => {
    stopTraining();
    setW1(initW1);
    setW2(initW2);
    setB(0);
    setStepCount(0);
    setLastUpdated(null);
  }, [stopTraining, initW1, initW2]);

  // When sliders move while idle, mirror them onto live weights.
  const onInitW1Change = useCallback((v) => {
    setInitW1(v);
    if (!runningRef.current) {
      setW1(v);
      setStepCount(0);
      setLastUpdated(null);
    }
  }, []);
  const onInitW2Change = useCallback((v) => {
    setInitW2(v);
    if (!runningRef.current) {
      setW2(v);
      setStepCount(0);
      setLastUpdated(null);
    }
  }, []);

  // Weight vector arrow endpoint in data coords. Scale to fit nicely.
  const wMag = Math.sqrt(w1 * w1 + w2 * w2) || 1;
  const ARROW_LEN = 2.2;
  const wxEnd = (w1 / wMag) * ARROW_LEN;
  const wyEnd = (w2 / wMag) * ARROW_LEN;

  const colPos = 'var(--hue-sky, #5ecbff)';
  const colNeg = 'var(--hue-pink, #ff66cc)';
  const colMis = 'var(--warning, #f5b342)';

  const converged = misCount === 0;
  const lastPt = lastUpdated != null ? classification[lastUpdated] : null;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <marker
              id="perceptron-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
          </defs>

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

          {/* axis labels */}
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
              opacity="0.95"
            />
          )}

          {/* weight vector arrow from origin */}
          {(() => {
            const a = toScreen(0, 0);
            const e = toScreen(wxEnd, wyEnd);
            return (
              <line
                x1={a.sx}
                y1={a.sy}
                x2={e.sx}
                y2={e.sy}
                stroke="var(--accent)"
                strokeWidth="2.4"
                markerEnd="url(#perceptron-arrow)"
                opacity="0.9"
              />
            );
          })()}

          {/* highlight ring on the last-updated point */}
          {lastPt && (() => {
            const { sx, sy } = toScreen(lastPt.x, lastPt.y);
            return (
              <circle
                cx={sx}
                cy={sy}
                r="9"
                fill="none"
                stroke={colMis}
                strokeWidth="1.6"
                strokeDasharray="3 2"
                opacity="0.9"
              />
            );
          })()}

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
                    r="6.4"
                    fill="none"
                    stroke={colMis}
                    strokeWidth="1.3"
                    opacity="0.85"
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
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
            {converged ? 'converged' : 'training'}
          </span>
          <span className="mlviz-val">{misCount} misclassified</span>
          <span className="mlviz-sub">steps {stepCount}</span>
          <span className="mlviz-sub">w1 {snap(w1, 3)}</span>
          <span className="mlviz-sub">w2 {snap(w2, 3)}</span>
          <span className="mlviz-sub">b {snap(b, 3)}</span>
          <span className="mlviz-sub">seed {seed}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">init w1</span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={initW1}
              onChange={(e) => onInitW1Change(parseFloat(e.target.value))}
              disabled={training}
            />
            <span className="mlviz-slider-val">{snap(initW1, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">init w2</span>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={initW2}
              onChange={(e) => onInitW2Change(parseFloat(e.target.value))}
              disabled={training}
            />
            <span className="mlviz-slider-val">{snap(initW2, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleTrain}
          >
            {training ? <Square size={13} /> : <Play size={13} />}
            <span>{training ? 'Stop' : 'Train to convergence'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={training || converged}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewSample}
            disabled={training}
          >
            <Shuffle size={13} />
            <span>New sample</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={training}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          Boundary: w1&middot;x1 + w2&middot;x2 + b = 0. Each step picks a misclassified
          point and updates w += y&middot;x, b += y. Circles are class +1, squares are class -1.
        </div>
      </div>
    </div>
  );
}
