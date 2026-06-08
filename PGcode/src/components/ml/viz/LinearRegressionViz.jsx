import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Wand2, RotateCcw, Shuffle, Square } from 'lucide-react';
import './MLViz.css';

const SIZE = 380;
const PAD = 28;
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

const N_POINTS = 20;
const TRUE_M = 0.85;
const TRUE_B = 0.4;
const NOISE_SIGMA = 0.95;

const ANIM_STEPS = 36;
const STEP_DELAY = 28;

function snap(v, p = 3) {
  const mul = Math.pow(10, p);
  return Math.round(v * mul) / mul;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function toScreen(x, y) {
  return { sx: ORIGIN_X + x * UNIT_X, sy: ORIGIN_Y - y * UNIT_Y };
}

// Deterministic PRNG (mulberry32).
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

function buildDataset(seed) {
  const rand = mulberry32(seed);
  const g = makeGaussian(rand);
  const points = [];
  for (let i = 0; i < N_POINTS; i++) {
    const x = clamp(X_LO + 0.5 + (i + rand() * 0.6) * (X_RANGE - 1) / N_POINTS, X_LO + 0.2, X_HI - 0.2);
    const yTrue = TRUE_M * x + TRUE_B;
    const y = clamp(yTrue + g(0, NOISE_SIGMA), Y_LO + 0.05, Y_HI - 0.05);
    points.push({ x, y });
  }
  return points;
}

// Closed-form OLS: m = cov(x,y)/var(x), b = mean(y) - m*mean(x).
function olsFit(points) {
  const n = points.length;
  if (!n) return { m: 0, b: 0 };
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  const mx = sx / n;
  const my = sy / n;
  let num = 0, den = 0;
  for (const p of points) {
    const dx = p.x - mx;
    num += dx * (p.y - my);
    den += dx * dx;
  }
  const m = den === 0 ? 0 : num / den;
  const b = my - m * mx;
  return { m, b };
}

function computeMetrics(points, m, b) {
  const n = points.length;
  if (!n) return { mse: 0, r2: 0, ssRes: 0, ssTot: 0 };
  let sy = 0;
  for (const p of points) sy += p.y;
  const my = sy / n;
  let ssRes = 0;
  let ssTot = 0;
  for (const p of points) {
    const yhat = m * p.x + b;
    const r = p.y - yhat;
    ssRes += r * r;
    const dt = p.y - my;
    ssTot += dt * dt;
  }
  const mse = ssRes / n;
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { mse, r2, ssRes, ssTot };
}

// Clip the line y = m*x + b to the plot window in data coords.
function lineEndpoints(m, b) {
  const yL = m * X_LO + b;
  const yR = m * X_HI + b;
  const cand = [
    { x: X_LO, y: yL },
    { x: X_HI, y: yR },
  ];
  const pts = [];
  for (const c of cand) {
    if (c.y >= Y_LO && c.y <= Y_HI) pts.push(c);
  }
  if (Math.abs(m) > 1e-6) {
    const xTop = (Y_HI - b) / m;
    const xBot = (Y_LO - b) / m;
    if (xTop >= X_LO && xTop <= X_HI) pts.push({ x: xTop, y: Y_HI });
    if (xBot >= X_LO && xBot <= X_HI) pts.push({ x: xBot, y: Y_LO });
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

export default function LinearRegressionViz() {
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const seedRef = useRef(INITIAL_SEED);

  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));
  const [m, setM] = useState(0.2);
  const [b, setB] = useState(0);
  const [animating, setAnimating] = useState(false);

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

  const stopAnim = useCallback(() => {
    runningRef.current = false;
    setAnimating(false);
    clearTimers();
  }, [clearTimers]);

  const ols = useMemo(() => olsFit(points), [points]);

  const handleFit = useCallback(() => {
    if (runningRef.current) {
      stopAnim();
      return;
    }
    const target = olsFit(points);
    const startM = m;
    const startB = b;
    const dM = target.m - startM;
    const dB = target.b - startB;
    if (Math.abs(dM) < 1e-4 && Math.abs(dB) < 1e-4) {
      setM(target.m);
      setB(target.b);
      return;
    }
    runningRef.current = true;
    setAnimating(true);
    let step = 0;
    const tick = () => {
      if (!runningRef.current) return;
      step += 1;
      const t = step / ANIM_STEPS;
      // ease-out cubic
      const e = 1 - Math.pow(1 - t, 3);
      setM(startM + dM * e);
      setB(startB + dB * e);
      if (step >= ANIM_STEPS) {
        setM(target.m);
        setB(target.b);
        stopAnim();
        return;
      }
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, STEP_DELAY);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [points, m, b, stopAnim]);

  const handleNewSample = useCallback(() => {
    stopAnim();
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
  }, [stopAnim]);

  const handleReset = useCallback(() => {
    stopAnim();
    setM(0.2);
    setB(0);
  }, [stopAnim]);

  const metrics = useMemo(() => computeMetrics(points, m, b), [points, m, b]);
  const line = useMemo(() => lineEndpoints(m, b), [m, b]);

  const residuals = useMemo(() => points.map((p) => {
    const yhat = m * p.x + b;
    const yClipped = clamp(yhat, Y_LO, Y_HI);
    return { x: p.x, y: p.y, yhat, yClipped, sign: p.y - yhat };
  }), [points, m, b]);

  const colPos = 'var(--hue-sky, #5ecbff)';
  const colNeg = 'var(--hue-pink, #ff66cc)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
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
          >x</text>
          <text
            x={ORIGIN_X + 6}
            y={PAD + 4}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >y</text>

          {/* residuals: vertical line from point to predicted */}
          {residuals.map((r, i) => {
            const a = toScreen(r.x, r.y);
            const z = toScreen(r.x, r.yClipped);
            const col = r.sign >= 0 ? colPos : colNeg;
            return (
              <line
                key={`res${i}`}
                x1={a.sx}
                y1={a.sy}
                x2={z.sx}
                y2={z.sy}
                stroke={col}
                strokeWidth="1.2"
                strokeDasharray="2 2"
                opacity="0.75"
              />
            );
          })}

          {/* user's fitted line */}
          {line && (
            <line
              x1={toScreen(line[0].x, line[0].y).sx}
              y1={toScreen(line[0].x, line[0].y).sy}
              x2={toScreen(line[1].x, line[1].y).sx}
              y2={toScreen(line[1].x, line[1].y).sy}
              stroke="var(--accent)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {/* data points */}
          {residuals.map((r, i) => {
            const { sx, sy } = toScreen(r.x, r.y);
            const col = r.sign >= 0 ? colPos : colNeg;
            return (
              <circle
                key={`pt${i}`}
                cx={sx}
                cy={sy}
                r="3.6"
                fill={col}
                stroke="var(--bg)"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>mse</span>
          <span className="mlviz-val">{snap(metrics.mse, 4)}</span>
          <span className="mlviz-sub">R&sup2; {snap(metrics.r2, 4)}</span>
          <span className="mlviz-sub">ols m {snap(ols.m, 3)}</span>
          <span className="mlviz-sub">ols b {snap(ols.b, 3)}</span>
          <span className="mlviz-sub">seed {seed}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">m</span>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.01"
              value={m}
              onChange={(e) => setM(parseFloat(e.target.value))}
              disabled={animating}
            />
            <span className="mlviz-slider-val">{snap(m, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">b</span>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.01"
              value={b}
              onChange={(e) => setB(parseFloat(e.target.value))}
              disabled={animating}
            />
            <span className="mlviz-slider-val">{snap(b, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleFit}
          >
            {animating ? <Square size={13} /> : <Wand2 size={13} />}
            <span>{animating ? 'Stop' : 'Fit (OLS)'}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleNewSample}
            disabled={animating}
          >
            <Shuffle size={13} />
            <span>New sample</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
            disabled={animating}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          y = m&middot;x + b - dashed lines are residuals (sky = above the line, pink = below)
        </div>
      </div>
    </div>
  );
}
