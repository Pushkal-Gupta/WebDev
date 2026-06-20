import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Square, StepForward } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 360;

// Box geometry — anchored so arrows can attach cleanly.
const G_BOX = { x: 70, y: 130, w: 110, h: 70, cx: 125, cy: 165 };
const D_BOX = { x: 320, y: 130, w: 110, h: 70, cx: 375, cy: 165 };
const NOISE_PT = { x: 35, y: 60 };
const REAL_PT = { x: 290, y: 305 };
const D_LOSS_PT = { x: 525, y: 100 };
const G_LOSS_PT = { x: 525, y: 230 };

// Six pipeline steps — each is a sub-iteration of one training round.
const STEPS = [
  { id: 1, label: 'G produces samples',          tag: 'G(z)',     edges: ['noise_G', 'G_D_fake'] },
  { id: 2, label: 'D classifies real + fake',    tag: 'D scores', edges: ['real_D', 'G_D_fake'] },
  { id: 3, label: 'D loss = real->1, fake->0',   tag: 'L_D',      edges: ['D_DLoss'] },
  { id: 4, label: 'D updates',                   tag: 'dL_D/dD',  edges: ['DLoss_D_back'] },
  { id: 5, label: 'G loss = fake->1',            tag: 'L_G',      edges: ['G_D_fake', 'D_GLoss'] },
  { id: 6, label: 'G updates',                   tag: 'dL_G/dG',  edges: ['GLoss_G_back'] },
];

const STEP_DELAY = 520;
const N_REAL = 24;
const N_FAKE = 24;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function sigmoid(z) {
  if (z >= 0) { const e = Math.exp(-z); return 1 / (1 + e); }
  const e = Math.exp(z); return e / (1 + e);
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
    let u = 0, v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mu + sigma * z;
  };
}

// Pre-sampled real data + noise — same seeds across renders so the cloud
// is identifiable when G moves.
const REAL_POINTS = (() => {
  const rand = mulberry32(20260608);
  const g = makeGaussian(rand);
  const pts = [];
  for (let i = 0; i < N_REAL; i++) {
    pts.push({ x: clamp(g(1.2, 0.55), -3.9, 3.9), y: clamp(g(1.0, 0.55), -3.9, 3.9) });
  }
  return pts;
})();

const NOISE = (() => {
  const rand = mulberry32(31415927);
  const g = makeGaussian(rand);
  const pts = [];
  for (let i = 0; i < N_FAKE; i++) {
    pts.push({ z1: g(0, 1), z2: g(0, 1) });
  }
  return pts;
})();

function initialG() {
  return { a11: 0.6, a12: 0.0, a21: 0.0, a22: 0.6, bx: -2.0, by: -1.6 };
}
function initialD() {
  return { w1: 0.0, w2: -0.3, b: 0.0 };
}

function generate(G) {
  const out = [];
  for (let i = 0; i < NOISE.length; i++) {
    const { z1, z2 } = NOISE[i];
    out.push({
      x: G.a11 * z1 + G.a12 * z2 + G.bx,
      y: G.a21 * z1 + G.a22 * z2 + G.by,
    });
  }
  return out;
}
function dLogit(D, p) { return D.w1 * p.x + D.w2 * p.y + D.b; }

function computeMetrics(D, G) {
  const fake = generate(G);
  const eps = 1e-9;
  let lossD = 0, lossG = 0, accReal = 0, accFake = 0;
  for (const p of REAL_POINTS) {
    const yhat = sigmoid(dLogit(D, p));
    lossD += -Math.log(yhat + eps);
    if (yhat >= 0.5) accReal += 1;
  }
  for (const p of fake) {
    const yhat = sigmoid(dLogit(D, p));
    lossD += -Math.log(1 - yhat + eps);
    lossG += -Math.log(yhat + eps);
    if (yhat < 0.5) accFake += 1;
  }
  return {
    lossD: lossD / (REAL_POINTS.length + fake.length),
    lossG: lossG / fake.length,
    accReal: accReal / REAL_POINTS.length,
    accFake: accFake / fake.length,
    gSuccess: 1 - (accFake / fake.length),
  };
}

function trainDStep(D, fake, lr) {
  let dw1 = 0, dw2 = 0, db = 0;
  const n = REAL_POINTS.length + fake.length;
  for (const p of REAL_POINTS) {
    const yhat = sigmoid(dLogit(D, p));
    const err = yhat - 1;
    dw1 += err * p.x; dw2 += err * p.y; db += err;
  }
  for (const p of fake) {
    const yhat = sigmoid(dLogit(D, p));
    const err = yhat - 0;
    dw1 += err * p.x; dw2 += err * p.y; db += err;
  }
  return { w1: D.w1 - lr * (dw1 / n), w2: D.w2 - lr * (dw2 / n), b: D.b - lr * (db / n) };
}

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
    da11 += gx * z1; da12 += gx * z2; dbx += gx;
    da21 += gy * z1; da22 += gy * z2; dby += gy;
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

// Curved-back path for the "loss -> network" feedback arrows.
function curvedPath(x1, y1, x2, y2, bend = 40) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - bend;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export default function GANLoopViz() {
  const [G, setG] = useState(initialG);
  const [D, setD] = useState(initialD);
  const [step, setStep] = useState(0); // 0 = idle, 1..6 = currently-highlighted step
  const [round, setRound] = useState(0);
  const [running, setRunning] = useState(false);
  const [lr, setLr] = useState(0.14);

  const runningRef = useRef(false);
  const timerRef = useRef(null);

  const metrics = useMemo(() => computeMetrics(D, G), [D, G]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { runningRef.current = false; clearTimers(); }, [clearTimers]);

  // Apply the *effect* of a step. The visual highlight runs separately so
  // the diagram can light up in sequence without committing parameter
  // changes mid-flight.
  const applyStep = useCallback((id) => {
    if (id === 4) {
      // D updates against the current G
      setD((curD) => {
        const fakeNow = generate(G);
        let next = curD;
        for (let i = 0; i < 4; i++) next = trainDStep(next, fakeNow, lr);
        return next;
      });
    } else if (id === 6) {
      // G updates against the current D
      setG((curG) => {
        let next = curG;
        for (let i = 0; i < 4; i++) next = trainGStep(next, D, lr * 0.85);
        return next;
      });
      setRound((r) => r + 1);
    }
  }, [G, D, lr]);

  const stepOnce = useCallback(() => {
    setStep((cur) => {
      const next = (cur % STEPS.length) + 1;
      applyStep(next);
      return next;
    });
  }, [applyStep]);

  const stopRun = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimers();
  }, [clearTimers]);

  const handleRun = useCallback(() => {
    if (runningRef.current) { stopRun(); return; }
    runningRef.current = true;
    setRunning(true);

    const tick = () => {
      if (!runningRef.current) return;
      setStep((cur) => {
        const next = (cur % STEPS.length) + 1;
        applyStep(next);
        return next;
      });
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, STEP_DELAY);
  }, [applyStep, stopRun]);

  const handleReset = useCallback(() => {
    stopRun();
    setG(initialG());
    setD(initialD());
    setStep(0);
    setRound(0);
  }, [stopRun]);

  const activeStep = STEPS.find((s) => s.id === step);
  const litEdges = new Set(activeStep ? activeStep.edges : []);

  const cReal = 'var(--hue-mint, #6ee7b7)';
  const cFake = 'var(--hue-pink, #ff66cc)';
  const cAccent = 'var(--accent)';
  const cDim = 'var(--text-dim)';
  const cBorder = 'var(--border)';
  const cSurface = 'var(--surface)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide">
          <defs>
            <marker id="gan-arrow-dim" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={cDim} />
            </marker>
            <marker id="gan-arrow-lit" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={cAccent} />
            </marker>
            <marker id="gan-arrow-real" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={cReal} />
            </marker>
            <marker id="gan-arrow-fake" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={cFake} />
            </marker>
          </defs>

          {/* ----- edges (rendered first so boxes overlap them) ----- */}

          {/* noise z -> G */}
          <line
            x1={NOISE_PT.x + 10} y1={NOISE_PT.y + 8}
            x2={G_BOX.cx} y2={G_BOX.y}
            stroke={litEdges.has('noise_G') ? cAccent : cDim}
            strokeWidth={litEdges.has('noise_G') ? 2.4 : 1.4}
            opacity={litEdges.has('noise_G') ? 1 : 0.55}
            markerEnd={litEdges.has('noise_G') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-dim)'}
          />
          <text x={NOISE_PT.x + 4} y={NOISE_PT.y - 6} fontSize="11" fill={cDim} fontFamily="var(--mono, monospace)">
            z ~ N(0, I)
          </text>

          {/* G -> D (fake samples) */}
          <line
            x1={G_BOX.x + G_BOX.w} y1={G_BOX.cy}
            x2={D_BOX.x} y2={D_BOX.cy}
            stroke={litEdges.has('G_D_fake') ? cAccent : cFake}
            strokeWidth={litEdges.has('G_D_fake') ? 2.6 : 1.6}
            opacity={litEdges.has('G_D_fake') ? 1 : 0.7}
            markerEnd={litEdges.has('G_D_fake') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-fake)'}
          />
          <text
            x={(G_BOX.x + G_BOX.w + D_BOX.x) / 2}
            y={G_BOX.cy - 8}
            fontSize="10"
            fill={litEdges.has('G_D_fake') ? cAccent : cFake}
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            fake = G(z)
          </text>

          {/* real samples -> D */}
          <line
            x1={REAL_PT.x} y1={REAL_PT.y - 4}
            x2={D_BOX.cx} y2={D_BOX.y + D_BOX.h}
            stroke={litEdges.has('real_D') ? cAccent : cReal}
            strokeWidth={litEdges.has('real_D') ? 2.6 : 1.6}
            opacity={litEdges.has('real_D') ? 1 : 0.7}
            markerEnd={litEdges.has('real_D') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-real)'}
          />
          <text x={REAL_PT.x - 4} y={REAL_PT.y + 14} fontSize="11" fill={cReal} fontFamily="var(--mono, monospace)">
            x_real ~ p_data
          </text>

          {/* D -> D_loss */}
          <line
            x1={D_BOX.x + D_BOX.w} y1={D_BOX.y + 16}
            x2={D_LOSS_PT.x - 4} y2={D_LOSS_PT.y}
            stroke={litEdges.has('D_DLoss') ? cAccent : cDim}
            strokeWidth={litEdges.has('D_DLoss') ? 2.4 : 1.3}
            opacity={litEdges.has('D_DLoss') ? 1 : 0.5}
            markerEnd={litEdges.has('D_DLoss') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-dim)'}
          />

          {/* D -> G_loss */}
          <line
            x1={D_BOX.x + D_BOX.w} y1={D_BOX.y + D_BOX.h - 16}
            x2={G_LOSS_PT.x - 4} y2={G_LOSS_PT.y}
            stroke={litEdges.has('D_GLoss') ? cAccent : cDim}
            strokeWidth={litEdges.has('D_GLoss') ? 2.4 : 1.3}
            opacity={litEdges.has('D_GLoss') ? 1 : 0.5}
            markerEnd={litEdges.has('D_GLoss') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-dim)'}
          />

          {/* D_loss -> D (backprop, curved) */}
          <path
            d={curvedPath(D_LOSS_PT.x - 8, D_LOSS_PT.y + 8, D_BOX.x + D_BOX.w - 4, D_BOX.y + 4, 55)}
            fill="none"
            stroke={litEdges.has('DLoss_D_back') ? cAccent : cDim}
            strokeWidth={litEdges.has('DLoss_D_back') ? 2.4 : 1.3}
            strokeDasharray="5 4"
            opacity={litEdges.has('DLoss_D_back') ? 1 : 0.5}
            markerEnd={litEdges.has('DLoss_D_back') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-dim)'}
          />

          {/* G_loss -> G (backprop through D, large curve to left) */}
          <path
            d={`M ${G_LOSS_PT.x - 4} ${G_LOSS_PT.y + 6}
                C ${G_LOSS_PT.x} ${H - 30}, ${G_BOX.x - 30} ${H - 30}, ${G_BOX.x + 8} ${G_BOX.y + G_BOX.h - 6}`}
            fill="none"
            stroke={litEdges.has('GLoss_G_back') ? cAccent : cDim}
            strokeWidth={litEdges.has('GLoss_G_back') ? 2.4 : 1.3}
            strokeDasharray="5 4"
            opacity={litEdges.has('GLoss_G_back') ? 1 : 0.5}
            markerEnd={litEdges.has('GLoss_G_back') ? 'url(#gan-arrow-lit)' : 'url(#gan-arrow-dim)'}
          />
          <text
            x={(G_BOX.x + G_LOSS_PT.x) / 2}
            y={H - 18}
            fontSize="10"
            fill={litEdges.has('GLoss_G_back') ? cAccent : cDim}
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            opacity={litEdges.has('GLoss_G_back') ? 1 : 0.6}
          >
            backprop through D into G
          </text>

          {/* ----- boxes ----- */}

          {/* G box */}
          <rect
            x={G_BOX.x} y={G_BOX.y} width={G_BOX.w} height={G_BOX.h}
            rx="10"
            fill={cSurface}
            stroke={step === 1 || step === 6 ? cAccent : cBorder}
            strokeWidth={step === 1 || step === 6 ? 2.2 : 1.4}
          />
          <text x={G_BOX.cx} y={G_BOX.cy - 6} fontSize="22" fontWeight="600" fill="var(--text-main)" textAnchor="middle" fontFamily="var(--mono, monospace)">
            G
          </text>
          <text x={G_BOX.cx} y={G_BOX.cy + 16} fontSize="10" fill={cDim} textAnchor="middle" fontFamily="var(--mono, monospace)">
            generator
          </text>

          {/* D box */}
          <rect
            x={D_BOX.x} y={D_BOX.y} width={D_BOX.w} height={D_BOX.h}
            rx="10"
            fill={cSurface}
            stroke={step === 2 || step === 4 ? cAccent : cBorder}
            strokeWidth={step === 2 || step === 4 ? 2.2 : 1.4}
          />
          <text x={D_BOX.cx} y={D_BOX.cy - 6} fontSize="22" fontWeight="600" fill="var(--text-main)" textAnchor="middle" fontFamily="var(--mono, monospace)">
            D
          </text>
          <text x={D_BOX.cx} y={D_BOX.cy + 16} fontSize="10" fill={cDim} textAnchor="middle" fontFamily="var(--mono, monospace)">
            discriminator
          </text>

          {/* D_loss pill */}
          <rect
            x={D_LOSS_PT.x - 4} y={D_LOSS_PT.y - 16} width="78" height="34" rx="8"
            fill={cSurface}
            stroke={step === 3 ? cAccent : cBorder}
            strokeWidth={step === 3 ? 2.2 : 1.2}
          />
          <text x={D_LOSS_PT.x + 35} y={D_LOSS_PT.y + 2} fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="600" fontFamily="var(--mono, monospace)">
            L_D
          </text>
          <text x={D_LOSS_PT.x + 35} y={D_LOSS_PT.y + 14} fontSize="9" fill={cDim} textAnchor="middle" fontFamily="var(--mono, monospace)">
            real-&gt;1 fake-&gt;0
          </text>

          {/* G_loss pill */}
          <rect
            x={G_LOSS_PT.x - 4} y={G_LOSS_PT.y - 16} width="78" height="34" rx="8"
            fill={cSurface}
            stroke={step === 5 ? cAccent : cBorder}
            strokeWidth={step === 5 ? 2.2 : 1.2}
          />
          <text x={G_LOSS_PT.x + 35} y={G_LOSS_PT.y + 2} fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="600" fontFamily="var(--mono, monospace)">
            L_G
          </text>
          <text x={G_LOSS_PT.x + 35} y={G_LOSS_PT.y + 14} fontSize="9" fill={cDim} textAnchor="middle" fontFamily="var(--mono, monospace)">
            fake-&gt;1
          </text>

          {/* noise marker dot */}
          <circle cx={NOISE_PT.x + 10} cy={NOISE_PT.y + 8} r="4.5" fill={cDim} opacity="0.7" />

          {/* fake sample dots floating mid-edge */}
          {[0, 1, 2].map((i) => (
            <rect
              key={`fk${i}`}
              x={G_BOX.x + G_BOX.w + 14 + i * 22} y={G_BOX.cy - 4}
              width="7" height="7"
              fill={cFake}
              opacity={litEdges.has('G_D_fake') ? 0.95 : 0.55}
              transform={`rotate(45 ${G_BOX.x + G_BOX.w + 14 + i * 22 + 3.5} ${G_BOX.cy - 0.5})`}
            />
          ))}

          {/* real sample dots floating along real edge */}
          {[0, 1, 2].map((i) => (
            <circle
              key={`rl${i}`}
              cx={REAL_PT.x + 22 + i * 16}
              cy={REAL_PT.y - 18 - i * 22}
              r="3.6"
              fill={cReal}
              opacity={litEdges.has('real_D') ? 0.95 : 0.55}
            />
          ))}

          {/* current-step ribbon banner */}
          {activeStep && (
            <g>
              <rect
                x={W / 2 - 130} y={10} width="260" height="26" rx="13"
                fill={cSurface}
                stroke={cAccent}
                strokeWidth="1.3"
              />
              <text x={W / 2} y={27} fontSize="11" fill="var(--text-main)" textAnchor="middle" fontFamily="var(--mono, monospace)">
                step {activeStep.id}: {activeStep.label}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: cAccent }}>round</span>
          <span className="mlviz-val">{round}</span>
          <span className="mlviz-sub">step {step}/6</span>
          <span className="mlviz-sub" style={{ color: cReal }}>real</span>
          <span className="mlviz-sub" style={{ color: cFake }}>fake</span>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: cAccent }}>D acc</span>
          <span className="mlviz-val">real {snap(metrics.accReal * 100, 1)}%</span>
          <span className="mlviz-val">fake {snap(metrics.accFake * 100, 1)}%</span>
          <span className="mlviz-sub">G success {snap(metrics.gSuccess * 100, 1)}%</span>
        </div>

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: cDim }}>loss</span>
          <span className="mlviz-val">L_D {snap(metrics.lossD, 3)}</span>
          <span className="mlviz-val">L_G {snap(metrics.lossG, 3)}</span>
        </div>

        <div className="mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate</span>
            <input
              type="range"
              min="0.02"
              max="0.40"
              step="0.01"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(lr, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={stepOnce} disabled={running}>
            <StepForward size={13} />
            <span>Step training</span>
          </button>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={handleRun}>
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Run loop'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset} disabled={running}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          Each press of <strong>Step training</strong> advances one of six sub-steps; one full pass through all six = one training round. Watch L_D and L_G oscillate as the two players trade ground.
        </div>
      </div>
    </div>
  );
}
