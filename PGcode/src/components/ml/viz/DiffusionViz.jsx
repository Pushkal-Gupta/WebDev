import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Square, StepForward } from 'lucide-react';
import './MLViz.css';

const GRID = 32;
const T_MAX = 20;
const SVG = 380;
const PAD = 16;
const CELL = (SVG - PAD * 2) / GRID;

const BETA_START = 0.04;
const BETA_END = 0.32;

// Diffusion schedule: linear beta_t, alpha_t = 1 - beta_t, alpha_bar = prod.
function buildSchedule() {
  const betas = new Array(T_MAX + 1).fill(0);
  const alphas = new Array(T_MAX + 1).fill(1);
  const alphaBars = new Array(T_MAX + 1).fill(1);
  // t = 0 is the clean image: no noise.
  for (let t = 1; t <= T_MAX; t++) {
    const f = (t - 1) / Math.max(1, T_MAX - 1);
    const b = BETA_START + (BETA_END - BETA_START) * f;
    betas[t] = b;
    alphas[t] = 1 - b;
    alphaBars[t] = alphaBars[t - 1] * alphas[t];
  }
  return { betas, alphas, alphaBars };
}

const SCHEDULE = buildSchedule();

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

// Build x_0: a smiley face on a 32x32 grayscale grid in [0, 1].
function buildCleanImage() {
  const img = new Float32Array(GRID * GRID);
  const cx = (GRID - 1) / 2;
  const cy = (GRID - 1) / 2;
  const faceR = 12.5;
  const faceR2 = faceR * faceR;
  const faceEdgeBand = 1.6;

  // Eye centers and mouth arc.
  const eyeL = { x: cx - 4.2, y: cy - 3.0 };
  const eyeR = { x: cx + 4.2, y: cy - 3.0 };
  const eyeR2 = 1.4 * 1.4;

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const dx = c - cx;
      const dy = r - cy;
      const d2 = dx * dx + dy * dy;
      let v = 0.06; // background

      if (d2 <= faceR2) {
        v = 0.55; // face fill
        // Face outline ring (slightly darker).
        const d = Math.sqrt(d2);
        if (d >= faceR - faceEdgeBand) v = 0.82;

        // Eyes.
        const dlx = c - eyeL.x; const dly = r - eyeL.y;
        const drx = c - eyeR.x; const dry = r - eyeR.y;
        if (dlx * dlx + dly * dly <= eyeR2) v = 0.95;
        if (drx * drx + dry * dry <= eyeR2) v = 0.95;

        // Mouth: arc band y = cy + 3.0, radius 4.5 from chin pivot at (cx, cy - 2).
        const px = c - cx;
        const py = r - (cy - 1.5);
        const pr = Math.sqrt(px * px + py * py);
        const ang = Math.atan2(py, px);
        if (pr >= 5.0 && pr <= 6.2 && ang >= 0.55 && ang <= Math.PI - 0.55) {
          v = 0.92;
        }
      }

      img[r * GRID + c] = v;
    }
  }
  return img;
}

// Build a deterministic noise field ~ N(0, 1) shared across the timeline.
function buildNoiseField() {
  const rand = mulberry32(20260607);
  const n = new Float32Array(GRID * GRID);
  for (let i = 0; i < n.length; i++) n[i] = gaussFromRand(rand);
  return n;
}

const X0 = buildCleanImage();
const NOISE = buildNoiseField();

// Forward sample: x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * noise.
// Returned in display space [0, 1] via a soft clamp around 0.5.
function forwardImage(t) {
  if (t <= 0) return X0;
  const ab = SCHEDULE.alphaBars[t];
  const s = Math.sqrt(ab);
  const sn = Math.sqrt(Math.max(0, 1 - ab));
  const out = new Float32Array(GRID * GRID);
  for (let i = 0; i < out.length; i++) {
    const v = s * (X0[i] - 0.5) + sn * NOISE[i] * 0.5 + 0.5;
    out[i] = v;
  }
  return out;
}

// Reverse-mode visualization: starts from pure noise at t = T and linearly
// interpolates back toward X0 as t decreases. This simulates the *effect* of
// a learned denoiser without claiming to implement DDPM ancestral sampling.
function reverseImage(t) {
  if (t >= T_MAX) {
    // Pure noise centered at 0.5 with same scale as last forward step.
    const out = new Float32Array(GRID * GRID);
    for (let i = 0; i < out.length; i++) {
      out[i] = 0.5 + NOISE[i] * 0.5;
    }
    return out;
  }
  if (t <= 0) return X0;
  // Trajectory: at step t the noise level should match alpha_bar_t shape,
  // but the *content* signal grows as we step backward. Blend X0 with the
  // forward-noised image so the visual transition is smooth + monotone.
  const ab = SCHEDULE.alphaBars[t];
  const sn = Math.sqrt(Math.max(0, 1 - ab));
  const s = Math.sqrt(ab);
  // Slightly attenuate residual noise to make denoising visually obvious.
  const residual = sn * 0.55;
  const out = new Float32Array(GRID * GRID);
  for (let i = 0; i < out.length; i++) {
    const v = s * (X0[i] - 0.5) + residual * NOISE[i] * 0.5 + 0.5;
    out[i] = v;
  }
  return out;
}

function fmt(v, p = 3) {
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

// Map scalar [0,1] -> hex grayscale. Slight gamma so mids stay legible.
function shadeOf(v) {
  const c = clamp01(v);
  const g = Math.round(255 * Math.pow(c, 0.92));
  const hex = g.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

function ImageGrid({ image }) {
  // Render as a single <image> via a data URL: 1024 cells as SVG <rect>s
  // would blow up the DOM, so we paint pixels into an inline SVG <image>.
  const dataUrl = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = GRID;
    canvas.height = GRID;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const id = ctx.createImageData(GRID, GRID);
    for (let i = 0; i < image.length; i++) {
      const g = Math.round(clamp01(image[i]) * 255);
      const j = i * 4;
      id.data[j] = g;
      id.data[j + 1] = g;
      id.data[j + 2] = g;
      id.data[j + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return canvas.toDataURL();
  }, [image]);

  // Faint grid overlay for the 32x32 lattice — keeps the "image as pixels"
  // reading while letting the underlying intensity carry the visual story.
  const lines = [];
  for (let i = 0; i <= GRID; i += 4) {
    const o = PAD + i * CELL;
    lines.push(
      <line key={`gh${i}`} x1={PAD} y1={o} x2={SVG - PAD} y2={o}
        stroke="var(--border)" strokeWidth="0.3" opacity="0.4" />
    );
    lines.push(
      <line key={`gv${i}`} x1={o} y1={PAD} x2={o} y2={SVG - PAD}
        stroke="var(--border)" strokeWidth="0.3" opacity="0.4" />
    );
  }

  return (
    <svg viewBox={`0 0 ${SVG} ${SVG}`} className="mlviz-svg">
      <rect x={PAD} y={PAD} width={SVG - PAD * 2} height={SVG - PAD * 2}
        fill="var(--surface)" stroke="var(--border)" strokeWidth="0.8" />
      {dataUrl ? (
        <image
          href={dataUrl}
          x={PAD}
          y={PAD}
          width={SVG - PAD * 2}
          height={SVG - PAD * 2}
          preserveAspectRatio="none"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        // SSR fallback: paint as one rect per pixel (only runs server-side).
        Array.from(image).map((v, i) => {
          const r = Math.floor(i / GRID);
          const c = i % GRID;
          return (
            <rect
              key={i}
              x={PAD + c * CELL}
              y={PAD + r * CELL}
              width={CELL}
              height={CELL}
              fill={shadeOf(v)}
            />
          );
        })
      )}
      {lines}
    </svg>
  );
}

export default function DiffusionViz() {
  const [mode, setMode] = useState('forward'); // 'forward' | 'reverse'
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
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

  const handleModeChange = useCallback((next) => {
    if (next === mode) return;
    stopRun();
    setMode(next);
    setT(next === 'forward' ? 0 : T_MAX);
  }, [mode, stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    setT(mode === 'forward' ? 0 : T_MAX);
  }, [mode, stopRun]);

  const handleStep = useCallback(() => {
    setT((cur) => {
      if (mode === 'forward') return Math.min(T_MAX, cur + 1);
      return Math.max(0, cur - 1);
    });
  }, [mode]);

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
      setT((cur) => {
        if (mode === 'forward') {
          if (cur >= T_MAX) { done = true; return cur; }
          return cur + 1;
        }
        if (cur <= 0) { done = true; return cur; }
        return cur - 1;
      });
      if (done) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      timerRef.current = setTimeout(tick, 160);
    };

    timerRef.current = setTimeout(tick, 160);
  }, [mode, stopRun]);

  const image = useMemo(() => (
    mode === 'forward' ? forwardImage(t) : reverseImage(t)
  ), [mode, t]);

  const beta = t === 0 ? 0 : SCHEDULE.betas[t];
  const alpha = t === 0 ? 1 : SCHEDULE.alphas[t];
  const alphaBar = SCHEDULE.alphaBars[t];
  const cAccent = 'var(--accent)';
  const cDim = 'var(--text-dim)';
  const cWarn = 'var(--warning, var(--hue-pink))';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-toggles">
        <button
          type="button"
          className={`mlviz-toggle ${mode === 'forward' ? 'is-on' : ''}`}
          onClick={() => handleModeChange('forward')}
          style={{ '--toggle-color': 'var(--hue-sky)' }}
        >
          <span className="mlviz-toggle-dot" />
          <span>Forward (noise)</span>
        </button>
        <button
          type="button"
          className={`mlviz-toggle ${mode === 'reverse' ? 'is-on' : ''}`}
          onClick={() => handleModeChange('reverse')}
          style={{ '--toggle-color': 'var(--hue-mint)' }}
        >
          <span className="mlviz-toggle-dot" />
          <span>Reverse (denoise)</span>
        </button>
      </div>

      <div className="mlviz-stage">
        <ImageGrid image={image} />
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
          <span className="mlviz-tag" style={{ color: cWarn }}>&beta;<sub>t</sub></span>
          <span className="mlviz-val">{fmt(beta, 4)}</span>
          <span className="mlviz-sub">variance added this step</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: cAccent }}>&alpha;<sub>t</sub></span>
          <span className="mlviz-val">{fmt(alpha, 4)}</span>
          <span className="mlviz-sub">signal retained this step (1 - &beta;<sub>t</sub>)</span>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: cAccent }}>&#257;<sub>t</sub></span>
          <span className="mlviz-val">{fmt(alphaBar, 4)}</span>
          <span className="mlviz-sub">cumulative signal &prod;(1 - &beta;)</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: cDim }}>SNR</span>
          <span className="mlviz-val">{fmt(alphaBar / Math.max(1e-6, 1 - alphaBar), 3)}</span>
          <span className="mlviz-sub">&#257;<sub>t</sub> / (1 - &#257;<sub>t</sub>)</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || (mode === 'forward' ? t >= T_MAX : t <= 0)}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run'}</span>
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
          {mode === 'forward'
            ? 'x_t = sqrt(ā_t) x_0 + sqrt(1 - ā_t) ε — signal decays, noise grows.'
            : 'Start from pure noise at t = T, peel a layer of ε per step until x_0 returns.'}
        </div>
      </div>
    </div>
  );
}
