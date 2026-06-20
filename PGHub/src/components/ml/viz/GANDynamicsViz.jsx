import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 360;
const MARG_L = 36;
const MARG_R = 14;
const MARG_T = 14;
const MARG_B = 22;

const HIST_H = 150;
const LOSS_TOP = MARG_T + HIST_H + 30;
const LOSS_H = H - LOSS_TOP - MARG_B;

const X_LO = -5;
const X_HI = 5;
const N_BINS = 32;
const BIN_W = (X_HI - X_LO) / N_BINS;

const N_REAL = 500;
const N_FAKE = 500;

const REAL_MU = 0;
const REAL_SIGMA = 1;

const D_LR = 0.06;
const G_LR = 0.05;
const D_INNER = 4;
const G_INNER = 2;

const STEP_DELAY = 70;
const MAX_HISTORY = 400;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
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

// Pre-sampled real data — frozen so the histogram doesn't jitter between steps.
function buildReal() {
  const rand = mulberry32(20260607);
  const g = makeGaussian(rand);
  const arr = [];
  for (let i = 0; i < N_REAL; i++) {
    arr.push(clamp(g(REAL_MU, REAL_SIGMA), X_LO + 0.01, X_HI - 0.01));
  }
  return arr;
}

// Frozen latent noise z ~ N(0, 1). Generator deterministically maps z -> mu_g + sigma_g * z,
// so the same noise produces a coherent shifting cloud.
function buildNoise() {
  const rand = mulberry32(31415927);
  const g = makeGaussian(rand);
  const arr = [];
  for (let i = 0; i < N_FAKE; i++) {
    arr.push(g(0, 1));
  }
  return arr;
}

const REAL_DATA = buildReal();
const NOISE = buildNoise();

function generate(G) {
  const out = new Array(NOISE.length);
  for (let i = 0; i < NOISE.length; i++) {
    out[i] = G.mu + G.sigma * NOISE[i];
  }
  return out;
}

// D is a quadratic logit so it can shape a sensible boundary on a 1D Gaussian-vs-Gaussian task.
// logit(x) = a * x^2 + b * x + c.
function dLogit(D, x) {
  return D.a * x * x + D.b * x + D.c;
}

function initialG() {
  return { mu: -2.2, sigma: 0.6 };
}

function initialD() {
  return { a: 0.0, b: 0.0, c: 0.0 };
}

function computeMetrics(D, real, fake) {
  const eps = 1e-9;
  let lossD = 0;
  let lossG = 0;
  let accReal = 0;
  let accFake = 0;
  for (const x of real) {
    const yhat = sigmoid(dLogit(D, x));
    lossD += -Math.log(yhat + eps);
    if (yhat >= 0.5) accReal += 1;
  }
  for (const x of fake) {
    const yhat = sigmoid(dLogit(D, x));
    lossD += -Math.log(1 - yhat + eps);
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

function trainDStep(D, real, fake, lr) {
  let da = 0;
  let db = 0;
  let dc = 0;
  const n = real.length + fake.length;
  for (const x of real) {
    const yhat = sigmoid(dLogit(D, x));
    const err = yhat - 1;
    da += err * x * x;
    db += err * x;
    dc += err;
  }
  for (const x of fake) {
    const yhat = sigmoid(dLogit(D, x));
    const err = yhat - 0;
    da += err * x * x;
    db += err * x;
    dc += err;
  }
  return {
    a: D.a - lr * (da / n),
    b: D.b - lr * (db / n),
    c: D.c - lr * (dc / n),
  };
}

// Non-saturating G loss: minimize -log D(G(z)).
// dL/dx = -(1 - D(x)) * dlogit/dx = -(1 - D(x)) * (2 a x + b)
// x = mu + sigma * z   =>   dx/dmu = 1, dx/dsigma = z.
function trainGStep(G, D, lr) {
  let dMu = 0;
  let dSigma = 0;
  const n = NOISE.length;
  for (let i = 0; i < n; i++) {
    const z = NOISE[i];
    const x = G.mu + G.sigma * z;
    const yhat = sigmoid(dLogit(D, x));
    const gx = -(1 - yhat) * (2 * D.a * x + D.b);
    dMu += gx;
    dSigma += gx * z;
  }
  const nextSigma = G.sigma - lr * (dSigma / n);
  return {
    mu: G.mu - lr * (dMu / n),
    sigma: clamp(nextSigma, 0.15, 4.0),
  };
}

function makeHistogram(samples) {
  const counts = new Array(N_BINS).fill(0);
  for (const x of samples) {
    let idx = Math.floor((x - X_LO) / BIN_W);
    if (idx < 0) idx = 0;
    if (idx >= N_BINS) idx = N_BINS - 1;
    counts[idx] += 1;
  }
  return counts;
}

function xToScreen(x) {
  const t = (x - X_LO) / (X_HI - X_LO);
  return MARG_L + t * (W - MARG_L - MARG_R);
}

function histYToScreen(frac) {
  // 0 = baseline (bottom of hist area), 1 = top
  const base = MARG_T + HIST_H;
  return base - frac * HIST_H;
}

function lossYToScreen(v, maxLoss) {
  const t = clamp(v / maxLoss, 0, 1);
  return LOSS_TOP + LOSS_H - t * LOSS_H;
}

export default function GANDynamicsViz() {
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);
  const remainingRef = useRef(0);

  const [G, setG] = useState(initialG);
  const [D, setD] = useState(initialD);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState([]); // [{lossD, lossG}]

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

  const fakeSamples = useMemo(() => generate(G), [G]);
  const realHist = useMemo(() => makeHistogram(REAL_DATA), []);
  const fakeHist = useMemo(() => makeHistogram(fakeSamples), [fakeSamples]);
  const metrics = useMemo(() => computeMetrics(D, REAL_DATA, fakeSamples), [D, fakeSamples]);

  const histMax = useMemo(() => {
    let m = 0;
    for (let i = 0; i < N_BINS; i++) {
      if (realHist[i] > m) m = realHist[i];
      if (fakeHist[i] > m) m = fakeHist[i];
    }
    return Math.max(m, 1);
  }, [realHist, fakeHist]);

  const lossMax = useMemo(() => {
    let m = 1.6;
    for (const h of history) {
      if (h.lossD > m) m = h.lossD;
      if (h.lossG > m) m = h.lossG;
    }
    return m;
  }, [history]);

  // D's predicted probability of "real" sampled across x — drawn as a thin curve over the histograms.
  const dCurve = useMemo(() => {
    const pts = [];
    const STEPS = 80;
    for (let i = 0; i <= STEPS; i++) {
      const x = X_LO + (i / STEPS) * (X_HI - X_LO);
      const p = sigmoid(dLogit(D, x));
      pts.push({ x, p });
    }
    return pts;
  }, [D]);

  const runOneStep = useCallback((curG, curD) => {
    let nextD = curD;
    const fakeNow = generate(curG);
    for (let i = 0; i < D_INNER; i++) {
      nextD = trainDStep(nextD, REAL_DATA, fakeNow, D_LR);
    }
    let nextG = curG;
    for (let i = 0; i < G_INNER; i++) {
      nextG = trainGStep(nextG, nextD, G_LR);
    }
    const fakeAfter = generate(nextG);
    const m = computeMetrics(nextD, REAL_DATA, fakeAfter);
    return { nextG, nextD, m };
  }, []);

  const latestRef = useRef({ G, D });
  useEffect(() => { latestRef.current = { G, D }; }, [G, D]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    remainingRef.current = 0;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const runManySteps = useCallback((count) => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    remainingRef.current = count;
    setRunning(true);

    const tick = () => {
      if (!runningRef.current) return;
      if (remainingRef.current <= 0) {
        runningRef.current = false;
        setRunning(false);
        return;
      }
      const { G: curG, D: curD } = latestRef.current;
      const { nextG, nextD, m } = runOneStep(curG, curD);
      latestRef.current = { G: nextG, D: nextD };
      setG(nextG);
      setD(nextD);
      setHistory((h) => {
        const next = h.concat([{ lossD: m.lossD, lossG: m.lossG }]);
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setStep((s) => s + 1);
      remainingRef.current -= 1;

      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, STEP_DELAY);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [runOneStep, stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    const g0 = initialG();
    const d0 = initialD();
    setG(g0);
    setD(d0);
    latestRef.current = { G: g0, D: d0 };
    setHistory([]);
    setStep(0);
  }, [stopRun]);

  const cReal = 'var(--hue-sky, #67c8ff)';
  const cFake = 'var(--hue-pink, #ff66cc)';
  const cD = 'var(--accent)';
  const cG = 'var(--hue-violet, #b58cff)';

  // Build SVG paths for the loss curves.
  const lossDPath = useMemo(() => {
    if (history.length < 2) return '';
    const xs = history.length - 1;
    const xLeft = MARG_L;
    const xRight = W - MARG_R;
    return history.map((h, i) => {
      const sx = xLeft + (i / xs) * (xRight - xLeft);
      const sy = lossYToScreen(h.lossD, lossMax);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
    }).join(' ');
  }, [history, lossMax]);

  const lossGPath = useMemo(() => {
    if (history.length < 2) return '';
    const xs = history.length - 1;
    const xLeft = MARG_L;
    const xRight = W - MARG_R;
    return history.map((h, i) => {
      const sx = xLeft + (i / xs) * (xRight - xLeft);
      const sy = lossYToScreen(h.lossG, lossMax);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
    }).join(' ');
  }, [history, lossMax]);

  const dCurvePath = useMemo(() => {
    return dCurve.map((p, i) => {
      const sx = xToScreen(p.x);
      const sy = histYToScreen(p.p);
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(2)},${sy.toFixed(2)}`;
    }).join(' ');
  }, [dCurve]);

  // Hist bars
  const histBaseline = MARG_T + HIST_H;
  const binPxW = (xToScreen(X_LO + BIN_W) - xToScreen(X_LO)) - 1.5;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          {/* Hist axis baseline */}
          <line
            x1={MARG_L}
            y1={histBaseline}
            x2={W - MARG_R}
            y2={histBaseline}
            stroke="var(--border)"
            strokeWidth="1"
          />

          {/* Hist axis ticks */}
          {[-4, -2, 0, 2, 4].map((t) => {
            const sx = xToScreen(t);
            return (
              <g key={`hx${t}`}>
                <line x1={sx} y1={histBaseline} x2={sx} y2={histBaseline + 3} stroke="var(--border)" strokeWidth="0.8" />
                <text
                  x={sx}
                  y={histBaseline + 14}
                  fontSize="9"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >{t}</text>
              </g>
            );
          })}

          {/* Real-mean dashed reference */}
          {(() => {
            const sx = xToScreen(REAL_MU);
            return (
              <line
                x1={sx}
                y1={MARG_T}
                x2={sx}
                y2={histBaseline}
                stroke={cReal}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.55"
              />
            );
          })()}

          {/* Real bars */}
          {realHist.map((c, i) => {
            const sx = xToScreen(X_LO + i * BIN_W);
            const h = (c / histMax) * HIST_H;
            return (
              <rect
                key={`rb${i}`}
                x={sx + 0.5}
                y={histBaseline - h}
                width={binPxW}
                height={h}
                fill={cReal}
                opacity="0.55"
              />
            );
          })}

          {/* Fake bars (drawn over, slightly transparent) */}
          {fakeHist.map((c, i) => {
            const sx = xToScreen(X_LO + i * BIN_W);
            const h = (c / histMax) * HIST_H;
            return (
              <rect
                key={`fb${i}`}
                x={sx + 0.5}
                y={histBaseline - h}
                width={binPxW}
                height={h}
                fill={cFake}
                opacity="0.55"
              />
            );
          })}

          {/* D(x) probability curve */}
          <path d={dCurvePath} fill="none" stroke={cD} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.85" />

          {/* D 0.5 reference line */}
          <line
            x1={MARG_L}
            y1={histYToScreen(0.5)}
            x2={W - MARG_R}
            y2={histYToScreen(0.5)}
            stroke="var(--text-dim)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            opacity="0.5"
          />

          {/* Hist legend */}
          <g>
            <rect x={MARG_L + 6} y={MARG_T + 4} width="10" height="10" fill={cReal} opacity="0.55" />
            <text
              x={MARG_L + 20}
              y={MARG_T + 13}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >real ~ N(0,1)</text>
            <rect x={MARG_L + 110} y={MARG_T + 4} width="10" height="10" fill={cFake} opacity="0.55" />
            <text
              x={MARG_L + 124}
              y={MARG_T + 13}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >G(z)</text>
            <line
              x1={MARG_L + 170}
              y1={MARG_T + 9}
              x2={MARG_L + 184}
              y2={MARG_T + 9}
              stroke={cD}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={MARG_L + 188}
              y={MARG_T + 13}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >D(x)</text>
          </g>

          {/* Divider */}
          <line
            x1={MARG_L}
            y1={LOSS_TOP - 14}
            x2={W - MARG_R}
            y2={LOSS_TOP - 14}
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeDasharray="2 3"
          />

          {/* Loss axes */}
          <line
            x1={MARG_L}
            y1={LOSS_TOP}
            x2={MARG_L}
            y2={LOSS_TOP + LOSS_H}
            stroke="var(--border)"
            strokeWidth="0.8"
          />
          <line
            x1={MARG_L}
            y1={LOSS_TOP + LOSS_H}
            x2={W - MARG_R}
            y2={LOSS_TOP + LOSS_H}
            stroke="var(--border)"
            strokeWidth="0.8"
          />

          {/* Loss ticks */}
          {[0, 0.5, 1].map((frac, i) => {
            const v = frac * lossMax;
            const sy = lossYToScreen(v, lossMax);
            return (
              <g key={`ly${i}`}>
                <line x1={MARG_L - 3} y1={sy} x2={MARG_L} y2={sy} stroke="var(--border)" strokeWidth="0.6" />
                <text
                  x={MARG_L - 5}
                  y={sy + 3}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >{snap(v, 2)}</text>
              </g>
            );
          })}

          {/* ln(2) reference — the equilibrium D-loss when both sides confuse D evenly */}
          {(() => {
            const v = Math.log(2);
            if (v > lossMax) return null;
            const sy = lossYToScreen(v, lossMax);
            return (
              <g>
                <line
                  x1={MARG_L}
                  y1={sy}
                  x2={W - MARG_R}
                  y2={sy}
                  stroke="var(--text-dim)"
                  strokeWidth="0.6"
                  strokeDasharray="2 4"
                  opacity="0.6"
                />
                <text
                  x={W - MARG_R - 3}
                  y={sy - 3}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="end"
                >ln 2</text>
              </g>
            );
          })()}

          {/* Loss curves */}
          {lossDPath && (
            <path d={lossDPath} fill="none" stroke={cD} strokeWidth="1.6" strokeLinejoin="round" />
          )}
          {lossGPath && (
            <path d={lossGPath} fill="none" stroke={cG} strokeWidth="1.6" strokeLinejoin="round" />
          )}

          {/* Loss legend */}
          <g>
            <line x1={MARG_L + 6} y1={LOSS_TOP + 8} x2={MARG_L + 22} y2={LOSS_TOP + 8} stroke={cD} strokeWidth="1.6" />
            <text
              x={MARG_L + 26}
              y={LOSS_TOP + 11}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >D loss</text>
            <line x1={MARG_L + 76} y1={LOSS_TOP + 8} x2={MARG_L + 92} y2={LOSS_TOP + 8} stroke={cG} strokeWidth="1.6" />
            <text
              x={MARG_L + 96}
              y={LOSS_TOP + 11}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
            >G loss</text>
            <text
              x={W - MARG_R - 4}
              y={LOSS_TOP + 11}
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
            >step {step}</text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: cG }}>G</span>
          <span className="mlviz-val">mu_g {snap(G.mu, 3)}</span>
          <span className="mlviz-val">sigma_g {snap(G.sigma, 3)}</span>
          <span className="mlviz-sub">target N(0, 1)</span>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: cD }}>D</span>
          <span className="mlviz-val">acc real {snap(metrics.accReal * 100, 1)}%</span>
          <span className="mlviz-val">acc fake {snap(metrics.accFake * 100, 1)}%</span>
          <span className="mlviz-sub">chance = 50%</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>loss</span>
          <span className="mlviz-val" style={{ color: cD }}>D {snap(metrics.lossD, 4)}</span>
          <span className="mlviz-val" style={{ color: cG }}>G {snap(metrics.lossG, 4)}</span>
          <span className="mlviz-sub">eq. D = ln 2 ~ 0.693</span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => runManySteps(1)}
            disabled={running}
          >
            <StepForward size={13} />
            <span>Train one step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={() => runManySteps(50)}
          >
            <Play size={13} />
            <span>{running ? 'Stop' : 'Run 50 steps'}</span>
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
          D pushes real toward 1, fake toward 0. G shifts mu_g, sigma_g to fool D. At equilibrium pink overlaps blue and D's accuracy drops to chance.
        </div>
      </div>
    </div>
  );
}
