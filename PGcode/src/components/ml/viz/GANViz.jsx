import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const SIZE = 380;
const PAD = 22;
const PLOT = SIZE - PAD * 2;
const UNIT = PLOT / 8; // -4 to 4 = 8 units
const ORIGIN_X = PAD + 4 * UNIT;
const ORIGIN_Y = PAD + 4 * UNIT;

const N_REAL = 50;
const N_FAKE = 50;

const D_LR = 0.18;
const G_LR = 0.12;
const D_INNER_STEPS = 6;
const G_INNER_STEPS = 6;
const ROUND_DELAY = 110;

const REAL_MU = { x: 1.0, y: 1.0 };
const REAL_SIGMA = 0.55;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function toScreen(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function sigmoid(z) {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
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

// Pre-sampled real data — Gaussian centered at REAL_MU.
function buildReal() {
  const rand = mulberry32(20260607);
  const g = makeGaussian(rand);
  const pts = [];
  for (let i = 0; i < N_REAL; i++) {
    const x = clamp(g(REAL_MU.x, REAL_SIGMA), -3.9, 3.9);
    const y = clamp(g(REAL_MU.y, REAL_SIGMA), -3.9, 3.9);
    pts.push({ x, y });
  }
  return pts;
}

// Pre-sampled noise vectors z ~ N(0,1) — Generator deterministically maps
// them through its affine, so the cloud's shape stays consistent across rounds.
function buildNoise() {
  const rand = mulberry32(31415927);
  const g = makeGaussian(rand);
  const pts = [];
  for (let i = 0; i < N_FAKE; i++) {
    pts.push({ z1: g(0, 1), z2: g(0, 1) });
  }
  return pts;
}

const REAL_POINTS = buildReal();
const NOISE = buildNoise();

// Generator: 2D affine. x = a11 z1 + a12 z2 + bx ; y = a21 z1 + a22 z2 + by.
// Initialized far from REAL_MU so the user can watch it drift in.
function initialG() {
  return {
    a11: 0.6, a12: 0.0,
    a21: 0.0, a22: 0.6,
    bx: -2.0, by: -1.6,
  };
}

// Discriminator: linear logit D(x,y) = sigmoid(w1 x + w2 y + b).
// Initialized roughly orthogonal to the real/fake separation it will discover.
function initialD() {
  return { w1: 0.0, w2: -0.3, b: 0.0 };
}

function generate(G) {
  const out = [];
  for (let i = 0; i < NOISE.length; i++) {
    const { z1, z2 } = NOISE[i];
    const x = G.a11 * z1 + G.a12 * z2 + G.bx;
    const y = G.a21 * z1 + G.a22 * z2 + G.by;
    out.push({ x, y });
  }
  return out;
}

function dLogit(D, p) { return D.w1 * p.x + D.w2 * p.y + D.b; }

// Computes D and G losses + accuracies of D on real and fake batches.
function computeMetrics(D, real, fake) {
  const eps = 1e-9;
  let lossD = 0;
  let lossG = 0;
  let accReal = 0;
  let accFake = 0;
  for (const p of real) {
    const yhat = sigmoid(dLogit(D, p));
    lossD += -Math.log(yhat + eps);
    if (yhat >= 0.5) accReal += 1;
  }
  for (const p of fake) {
    const yhat = sigmoid(dLogit(D, p));
    lossD += -Math.log(1 - yhat + eps);
    // Non-saturating G loss: -log D(G(z))
    lossG += -Math.log(yhat + eps);
    if (yhat < 0.5) accFake += 1;
  }
  return {
    lossD: lossD / (real.length + fake.length),
    lossG: lossG / fake.length,
    accReal: accReal / real.length,
    accFake: accFake / fake.length,
  };
}

// One gradient step on D using current real and fake batches.
// Objective: maximize log D(real) + log (1 - D(fake)) — we minimize the negation.
function trainDStep(D, real, fake, lr) {
  let dw1 = 0, dw2 = 0, db = 0;
  const n = real.length + fake.length;
  for (const p of real) {
    const yhat = sigmoid(dLogit(D, p));
    const err = yhat - 1; // target 1
    dw1 += err * p.x;
    dw2 += err * p.y;
    db += err;
  }
  for (const p of fake) {
    const yhat = sigmoid(dLogit(D, p));
    const err = yhat - 0; // target 0
    dw1 += err * p.x;
    dw2 += err * p.y;
    db += err;
  }
  return {
    w1: D.w1 - lr * (dw1 / n),
    w2: D.w2 - lr * (dw2 / n),
    b: D.b - lr * (db / n),
  };
}

// One gradient step on G using non-saturating loss: minimize -log D(G(z)).
// dL/dxi = -(1 - D(xi)) * w1 ; dL/dyi = -(1 - D(xi)) * w2.
// Backpropagate through the affine to get gradients on G's params.
function trainGStep(G, D, lr) {
  let da11 = 0, da12 = 0, da21 = 0, da22 = 0, dbx = 0, dby = 0;
  const n = NOISE.length;
  for (let i = 0; i < n; i++) {
    const { z1, z2 } = NOISE[i];
    const x = G.a11 * z1 + G.a12 * z2 + G.bx;
    const y = G.a21 * z1 + G.a22 * z2 + G.by;
    const yhat = sigmoid(D.w1 * x + D.w2 * y + D.b);
    const gx = -(1 - yhat) * D.w1;
    const gy = -(1 - yhat) * D.w2;
    da11 += gx * z1;
    da12 += gx * z2;
    dbx += gx;
    da21 += gy * z1;
    da22 += gy * z2;
    dby += gy;
  }
  return {
    a11: G.a11 - lr * (da11 / n),
    a12: G.a12 - lr * (da12 / n),
    a21: G.a21 - lr * (da21 / n),
    a22: G.a22 - lr * (da22 / n),
    bx: G.bx - lr * (dbx / n),
    by: G.by - lr * (dby / n),
  };
}

function boundaryEndpoints(D) {
  const LO = -4;
  const HI = 4;
  const { w1, w2, b } = D;
  const pts = [];
  if (Math.abs(w2) > 1e-3) {
    const yLeft = -(w1 * LO + b) / w2;
    const yRight = -(w1 * HI + b) / w2;
    if (yLeft >= LO && yLeft <= HI) pts.push({ x: LO, y: yLeft });
    if (yRight >= LO && yRight <= HI) pts.push({ x: HI, y: yRight });
  }
  if (Math.abs(w1) > 1e-3) {
    const xTop = -(w2 * HI + b) / w1;
    const xBot = -(w2 * LO + b) / w1;
    if (xTop >= LO && xTop <= HI) pts.push({ x: xTop, y: HI });
    if (xBot >= LO && xBot <= HI) pts.push({ x: xBot, y: LO });
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
  return uniq.length === 2 ? uniq : null;
}

// Tint the "fake" half-plane (where D outputs < 0.5).
function fakeHalfPlanePath(D) {
  const corners = [
    { x: -4, y: -4 },
    { x: 4, y: -4 },
    { x: 4, y: 4 },
    { x: -4, y: 4 },
  ];
  const ev = (p) => D.w1 * p.x + D.w2 * p.y + D.b;
  const inside = (p) => ev(p) <= 0;
  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const cur = corners[i];
    const nxt = corners[(i + 1) % corners.length];
    const curIn = inside(cur);
    const nxtIn = inside(nxt);
    if (curIn) out.push(cur);
    if (curIn !== nxtIn) {
      const vCur = ev(cur);
      const vNxt = ev(nxt);
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
  for (let i = -4; i <= 4; i++) {
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

export default function GANViz() {
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const phaseRef = useRef('D'); // next phase when "Run round" is in flight

  const [G, setG] = useState(initialG);
  const [D, setD] = useState(initialD);
  const [running, setRunning] = useState(false);
  const [rounds, setRounds] = useState(0);
  const [lastPhase, setLastPhase] = useState(null);

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

  const fakePoints = useMemo(() => generate(G), [G]);
  const metrics = useMemo(() => computeMetrics(D, REAL_POINTS, fakePoints), [D, fakePoints]);
  const boundary = useMemo(() => boundaryEndpoints(D), [D]);
  const fakePath = useMemo(() => fakeHalfPlanePath(D), [D]);

  // Runs N inner gradient steps on D against current fake batch.
  const stepD = useCallback(() => {
    setD((cur) => {
      let next = cur;
      const fakeNow = generate(G);
      for (let i = 0; i < D_INNER_STEPS; i++) {
        next = trainDStep(next, REAL_POINTS, fakeNow, D_LR);
      }
      return next;
    });
    setLastPhase('D');
  }, [G]);

  // Runs N inner gradient steps on G against current D.
  const stepG = useCallback(() => {
    setG((cur) => {
      let next = cur;
      for (let i = 0; i < G_INNER_STEPS; i++) {
        next = trainGStep(next, D, G_LR);
      }
      return next;
    });
    setLastPhase('G');
  }, [D]);

  // Refs that mirror current G/D so the alternating loop sees fresh values
  // without restarting on every state change.
  const latestGRef = useRef(G);
  const latestDRef = useRef(D);
  useEffect(() => { latestGRef.current = G; }, [G]);
  useEffect(() => { latestDRef.current = D; }, [D]);

  // Run one full round: train D, then train G. Then keep alternating until stopped.
  const handleRound = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    phaseRef.current = 'D';

    const tick = () => {
      if (!runningRef.current) return;
      if (phaseRef.current === 'D') {
        const fakeNow = generate(latestGRef.current);
        setD((curD) => {
          let next = curD;
          for (let i = 0; i < D_INNER_STEPS; i++) {
            next = trainDStep(next, REAL_POINTS, fakeNow, D_LR);
          }
          return next;
        });
        setLastPhase('D');
        phaseRef.current = 'G';
      } else {
        const Dnow = latestDRef.current;
        setG((curG) => {
          let next = curG;
          for (let i = 0; i < G_INNER_STEPS; i++) {
            next = trainGStep(next, Dnow, G_LR);
          }
          return next;
        });
        setLastPhase('G');
        setRounds((r) => r + 1);
        phaseRef.current = 'D';
      }
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, ROUND_DELAY);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    setG(initialG());
    setD(initialD());
    setRounds(0);
    setLastPhase(null);
  }, [stopRun]);

  const cReal = 'var(--hue-mint, #6ee7b7)';
  const cFake = 'var(--hue-pink, #ff66cc)';
  const cBoundary = 'var(--accent)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          {/* D's "fake" half-plane tint */}
          {fakePath && (
            <path d={fakePath} fill={cFake} opacity="0.09" />
          )}

          <Grid />

          {/* axis ticks */}
          {[-3, -2, -1, 1, 2, 3].map((t) => {
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

          {/* Decision boundary line */}
          {boundary && (
            <line
              x1={toScreen(boundary[0].x, boundary[0].y).sx}
              y1={toScreen(boundary[0].x, boundary[0].y).sy}
              x2={toScreen(boundary[1].x, boundary[1].y).sx}
              y2={toScreen(boundary[1].x, boundary[1].y).sy}
              stroke={cBoundary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          )}

          {/* Real-distribution centroid marker */}
          {(() => {
            const { sx, sy } = toScreen(REAL_MU.x, REAL_MU.y);
            return (
              <g>
                <circle cx={sx} cy={sy} r="14" fill="none" stroke={cReal} strokeWidth="1" opacity="0.4" />
                <circle cx={sx} cy={sy} r="2.4" fill={cReal} opacity="0.75" />
              </g>
            );
          })()}

          {/* Real points */}
          {REAL_POINTS.map((p, i) => {
            const { sx, sy } = toScreen(p.x, p.y);
            return (
              <circle
                key={`r${i}`}
                cx={sx}
                cy={sy}
                r="3.4"
                fill={cReal}
                stroke="var(--bg)"
                strokeWidth="0.9"
                opacity="0.92"
              />
            );
          })}

          {/* Fake points */}
          {fakePoints.map((p, i) => {
            const { sx, sy } = toScreen(clamp(p.x, -4, 4), clamp(p.y, -4, 4));
            return (
              <rect
                key={`f${i}`}
                x={sx - 2.6}
                y={sy - 2.6}
                width="5.2"
                height="5.2"
                fill={cFake}
                stroke="var(--bg)"
                strokeWidth="0.9"
                opacity="0.9"
                transform={`rotate(45 ${sx} ${sy})`}
              />
            );
          })}

          {/* G / D side labels */}
          <text
            x={PAD + 4}
            y={PAD + 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >
            G(z) -&gt; <tspan fill={cFake}>fake</tspan>
          </text>
          <text
            x={SIZE - PAD - 4}
            y={PAD + 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="end"
          >
            <tspan fill={cReal}>real</tspan> -&gt; D
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>round</span>
          <span className="mlviz-val">{rounds}</span>
          <span className="mlviz-sub">
            phase {lastPhase ? lastPhase : '-'}
          </span>
          <span className="mlviz-sub" style={{ color: cReal }}>real (mint)</span>
          <span className="mlviz-sub" style={{ color: cFake }}>fake (pink)</span>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: cBoundary }}>D_loss</span>
          <span className="mlviz-val">{snap(metrics.lossD, 4)}</span>
          <span className="mlviz-sub">G_loss {snap(metrics.lossG, 4)}</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>acc</span>
          <span className="mlviz-val">real {snap(metrics.accReal * 100, 1)}%</span>
          <span className="mlviz-val">fake {snap(metrics.accFake * 100, 1)}%</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={stepD}
            disabled={running}
          >
            <span>Train D</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={stepG}
            disabled={running}
          >
            <span>Train G</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRound}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run round'}</span>
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
          D pushes its boundary to separate real (mint) from fake (pink); G shifts its affine to fool D.
        </div>
      </div>
    </div>
  );
}
