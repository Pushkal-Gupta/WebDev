import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Square, StepForward, StepBack } from 'lucide-react';
import './MLViz.css';

const GRID = 6;
const STEPS = 8; // 8 cells per row: indices 0..7
const T_MAX = STEPS - 1;

// Deterministic PRNG so the noise field is stable across renders.
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

function gaussFromRand(rand) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Build x_0: a smiley face on a 6x6 grayscale grid in [0, 1].
// Tiny grid, so we hand-tune pixels for a recognisable smiley.
function buildCleanImage() {
  const img = new Float32Array(GRID * GRID);
  // Background fill.
  for (let i = 0; i < img.length; i++) img[i] = 0.12;
  const set = (r, c, v) => { img[r * GRID + c] = v; };
  // Face circle (rows 0..5, cols 0..5). Outline ring on inner border.
  const ring = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [1, 0], [1, 5],
    [2, 0], [2, 5],
    [3, 0], [3, 5],
    [4, 0], [4, 5],
    [5, 1], [5, 2], [5, 3], [5, 4],
  ];
  ring.forEach(([r, c]) => set(r, c, 0.85));
  // Face fill interior.
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 4; c++) set(r, c, 0.55);
  }
  // Eyes.
  set(1, 1, 0.98);
  set(1, 4, 0.98);
  // Mouth.
  set(3, 1, 0.95);
  set(3, 4, 0.95);
  set(4, 2, 0.95);
  set(4, 3, 0.95);
  return img;
}

// Per-step noise field — one Gaussian frame per visualisation step.
function buildNoiseFields() {
  const rand = mulberry32(20260608);
  const fields = [];
  for (let s = 0; s < STEPS; s++) {
    const n = new Float32Array(GRID * GRID);
    for (let i = 0; i < n.length; i++) n[i] = gaussFromRand(rand);
    fields.push(n);
  }
  return fields;
}

const X0 = buildCleanImage();
const NOISE = buildNoiseFields();

// Noise std at step t in [0..T_MAX].
// Step 0 = clean image (sigma = 0). Step T_MAX = nearly pure noise.
function sigmaAt(t) {
  return (t / STEPS) * 0.95;
}

// Forward image: signal x sqrt(1 - sigma^2) + noise x sigma, displayed around 0.5.
function forwardImage(t) {
  if (t <= 0) return X0;
  const sig = sigmaAt(t);
  const sigSq = sig * sig;
  const sSig = Math.sqrt(Math.max(0, 1 - sigSq));
  const out = new Float32Array(GRID * GRID);
  // Accumulate the per-step noise so each forward step really adds noise.
  // We average the noise fields up to t for a stable visual trajectory.
  for (let i = 0; i < out.length; i++) {
    let n = 0;
    for (let s = 1; s <= t; s++) n += NOISE[s][i];
    n = n / Math.sqrt(Math.max(1, t));
    const v = sSig * (X0[i] - 0.5) + sig * n * 0.5 + 0.5;
    out[i] = v;
  }
  return out;
}

// Reverse image: at step t (counted as remaining noise level t),
// we display the same noise structure but scale it down — the learned
// denoiser pulls x_t toward x_0. Same indexing as forward so the slider
// shows the symmetry directly.
function reverseImage(t) {
  if (t <= 0) return X0;
  const sig = sigmaAt(t);
  const sigSq = sig * sig;
  const sSig = Math.sqrt(Math.max(0, 1 - sigSq));
  // Slight extra attenuation so reverse visually beats forward at same t.
  const residual = sig * 0.7;
  const out = new Float32Array(GRID * GRID);
  for (let i = 0; i < out.length; i++) {
    let n = 0;
    for (let s = 1; s <= t; s++) n += NOISE[s][i];
    n = n / Math.sqrt(Math.max(1, t));
    const v = sSig * (X0[i] - 0.5) + residual * n * 0.5 + 0.5;
    out[i] = v;
  }
  return out;
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function shadeOf(v) {
  const c = clamp01(v);
  const g = Math.round(255 * Math.pow(c, 0.92));
  const hex = g.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

function fmt(v, p = 3) {
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

// 6x6 pixel grid rendered as inline SVG rects (only 36 cells per panel).
function MiniGrid({ image, size = 60, highlight = false, label }) {
  const pad = 2;
  const cell = (size - pad * 2) / GRID;
  const rects = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      rects.push(
        <rect
          key={`${r}-${c}`}
          x={pad + c * cell}
          y={pad + r * cell}
          width={cell}
          height={cell}
          fill={shadeOf(image[r * GRID + c])}
          stroke="var(--border)"
          strokeWidth="0.25"
          opacity="1"
        />
      );
    }
  }
  return (
    <div
      className="diff-chain-cell"
      style={{
        outline: highlight ? '2px solid var(--accent)' : '1px solid var(--border)',
        boxShadow: highlight ? '0 0 0 3px rgba(var(--accent-rgb), 0.18)' : 'none',
        background: 'var(--surface)',
        padding: 4,
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ display: 'block' }}>
        <rect x={0} y={0} width={size} height={size} fill="var(--surface)" />
        {rects}
      </svg>
      <span style={{ fontSize: 11, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
        {label}
      </span>
    </div>
  );
}

export default function DiffusionChainViz() {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [direction, setDirection] = useState('forward'); // for Play
  const runningRef = useRef(false);
  const timerRef = useRef(null);

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

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
  }, [clearTimer]);

  const stepForward = useCallback(() => {
    stopRun();
    setT((cur) => Math.min(T_MAX, cur + 1));
    setDirection('forward');
  }, [stopRun]);

  const stepReverse = useCallback(() => {
    stopRun();
    setT((cur) => Math.max(0, cur - 1));
    setDirection('reverse');
  }, [stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    setT(0);
    setDirection('forward');
  }, [stopRun]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);

    const tick = () => {
      if (!runningRef.current) return;
      let done = false;
      let nextDir = direction;
      setT((cur) => {
        if (nextDir === 'forward') {
          if (cur >= T_MAX) {
            nextDir = 'reverse';
            setDirection('reverse');
            return cur - 1;
          }
          return cur + 1;
        }
        if (cur <= 0) {
          done = true;
          return cur;
        }
        return cur - 1;
      });
      if (done) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, 360);
    };

    timerRef.current = setTimeout(tick, 360);
  }, [direction, stopRun]);

  const forwardCells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < STEPS; i++) arr.push(forwardImage(i));
    return arr;
  }, []);

  const reverseCells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < STEPS; i++) arr.push(reverseImage(T_MAX - i));
    return arr;
  }, []);

  // For reverse row: index i corresponds to original t = T_MAX - i.
  const reverseHighlightIdx = T_MAX - t;
  const sigT = sigmaAt(t);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '12px 4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--hue-sky)', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Forward chain
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                add Gaussian noise on a fixed schedule
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, width: '100%' }}>
              {forwardCells.map((img, i) => (
                <MiniGrid
                  key={`f-${i}`}
                  image={img}
                  size={56}
                  highlight={i === t}
                  label={`x_${i}`}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--hue-mint)', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>
                Reverse chain
              </span>
              <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                learned denoiser walks back to x_0
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, width: '100%' }}>
              {reverseCells.map((img, i) => {
                const tVal = T_MAX - i;
                return (
                  <MiniGrid
                    key={`r-${i}`}
                    image={img}
                    size={56}
                    highlight={i === reverseHighlightIdx}
                    label={`x_${tVal}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <div className="mlviz-slider">
            <span className="mlviz-slider-label">t</span>
            <input
              type="range"
              min={0}
              max={T_MAX}
              step={1}
              value={t}
              onChange={(e) => { stopRun(); setT(Number(e.target.value)); }}
              disabled={running}
            />
            <span className="mlviz-slider-val">{t} / {T_MAX}</span>
          </div>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>t</span>
          <span className="mlviz-val">{t}</span>
          <span className="mlviz-sub">current step in the chain</span>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>&sigma;<sub>t</sub></span>
          <span className="mlviz-val">{fmt(sigT, 3)}</span>
          <span className="mlviz-sub">noise std at step t (t / T)</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={stepReverse}
            disabled={running || t <= 0}
          >
            <StepBack size={13} />
            <span>Step Reverse</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={stepForward}
            disabled={running || t >= T_MAX}
          >
            <StepForward size={13} />
            <span>Step Forward</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Play'}</span>
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

        <div className="mlviz-hint">
          Forward row: x_t = sqrt(1 - &sigma;<sub>t</sub><sup>2</sup>) &middot; x_0 + &sigma;<sub>t</sub> &middot; &epsilon;. Reverse row: a learned denoiser subtracts the predicted noise step by step until x_0 returns.
        </div>
      </div>
    </div>
  );
}
