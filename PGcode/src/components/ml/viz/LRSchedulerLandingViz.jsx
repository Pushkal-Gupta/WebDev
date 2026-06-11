import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Activity, Zap } from 'lucide-react';
import './MLViz.css';

const W = 760;
const H = 360;
const TOTAL_STEPS = 200;
const STEP_MS = 35;

// Plot regions
const LOSS_X = 18, LOSS_Y = 32, LOSS_W = 460, LOSS_H = 240;
const SCHED_X = LOSS_X + LOSS_W + 16;
const SCHED_W = W - SCHED_X - 18;
const SCHED_Y = 32;
const SCHED_H = 240;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hardcoded 1D loss curve: skewed double well with global minimum around x≈3.2
function lossFn(x) {
  // shifted Rosenbrock-ish 1D + small ripple
  const a = (x - 3.2);
  const b = (x + 0.3);
  return 0.45 * a * a + 0.05 * b * b * b * b * 0 + 0.15 * Math.sin(2.6 * x) * Math.sin(2.6 * x) + 0.02 * Math.cos(7 * x);
}
function dLoss(x) {
  // numeric derivative
  const h = 1e-3;
  return (lossFn(x + h) - lossFn(x - h)) / (2 * h);
}

const X_MIN = -2.2, X_MAX = 5.8;

function sample(fn, n) {
  const ys = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / (n - 1);
    ys[i] = fn(x);
  }
  return ys;
}

// Schedule generators: take baseLr, return function (step) -> lr
const SCHEDULES = [
  { key: 'constant', label: 'CONSTANT', color: 'var(--hue-sky)',
    lr: (base) => (_s) => base },
  { key: 'step', label: 'STEP DECAY', color: 'var(--hue-pink)',
    lr: (base) => (s) => base * Math.pow(0.4, Math.floor(s / 50)) },
  { key: 'cosine', label: 'COSINE', color: 'var(--hue-mint)',
    lr: (base) => (s) => 0.5 * base * (1 + Math.cos(Math.PI * s / TOTAL_STEPS)) },
  { key: 'warmcos', label: 'WARMUP+COSINE', color: 'var(--hue-violet)',
    lr: (base) => (s) => {
      const warm = 20;
      if (s < warm) return base * (s + 1) / warm;
      const t = (s - warm) / (TOTAL_STEPS - warm);
      return 0.5 * base * (1 + Math.cos(Math.PI * t));
    } },
];

function runOptim(lrFn, rng, x0 = -1.6) {
  const path = new Array(TOTAL_STEPS + 1);
  let x = x0;
  path[0] = { x, y: lossFn(x), lr: lrFn(0) };
  let convergedAt = TOTAL_STEPS;
  let lastLoss = path[0].y;
  let stableCount = 0;
  for (let s = 0; s < TOTAL_STEPS; s++) {
    const lr = lrFn(s);
    const g = dLoss(x);
    // tiny noise to avoid identical trajectories at constant
    const noise = (rng() - 0.5) * 0.02 * Math.sqrt(lr);
    x = x - lr * g + noise;
    if (x < X_MIN) x = X_MIN;
    if (x > X_MAX) x = X_MAX;
    const y = lossFn(x);
    path[s + 1] = { x, y, lr };
    // simple convergence: loss change < 1e-4 over 5 steps
    if (Math.abs(y - lastLoss) < 1e-4) stableCount++;
    else stableCount = 0;
    if (stableCount >= 5 && convergedAt === TOTAL_STEPS) convergedAt = s + 1;
    lastLoss = y;
  }
  return { path, convergedAt };
}

export default function LRSchedulerLandingViz() {
  const [logLr, setLogLr] = useState(-2); // baseLr = 10^logLr; default 1e-2
  const [stepIdx, setStepIdx] = useState(TOTAL_STEPS);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);

  const seed = 31;
  const rng = useMemo(() => mulberry32(seed), [seed]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const baseLr = useMemo(() => Math.pow(10, logLr), [logLr]);

  const runs = useMemo(() => {
    // separate RNG per schedule to keep them independent
    return SCHEDULES.map((s, i) => ({
      ...s,
      ...runOptim(s.lr(baseLr), mulberry32(seed + i * 1009), -1.6),
    }));
  }, [baseLr, rng]);

  const isRunning = isRunningRaw && stepIdx < TOTAL_STEPS;

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    const ms = reducedMotion ? 5 : STEP_MS;
    timerRef.current = setInterval(() => {
      setStepIdx((s) => Math.min(s + 1, TOTAL_STEPS));
    }, ms);
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isRunning, reducedMotion]);

  const handleToggle = useCallback(() => {
    if (stepIdx >= TOTAL_STEPS) { setStepIdx(0); setIsRunningRaw(true); return; }
    setIsRunningRaw((r) => !r);
  }, [stepIdx]);
  const handleStep = useCallback(() => setStepIdx((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const handleReset = useCallback(() => { setStepIdx(0); setIsRunningRaw(false); }, []);

  // Build the loss-curve background
  const curveSamples = useMemo(() => sample(lossFn, 240), []);
  const yMin = Math.min(...curveSamples) - 0.05;
  const yMax = Math.max(...curveSamples) + 0.05;
  const xToPx = (x) => LOSS_X + ((x - X_MIN) / (X_MAX - X_MIN)) * LOSS_W;
  const yToPx = (y) => LOSS_Y + (1 - (y - yMin) / (yMax - yMin)) * LOSS_H;

  const curveD = useMemo(() => {
    let d = '';
    for (let i = 0; i < curveSamples.length; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / (curveSamples.length - 1);
      const px = xToPx(x);
      const py = yToPx(curveSamples[i]);
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
    }
    return d;
  }, [curveSamples]);

  // LR curves area: x-axis = step, y-axis = lr (log scale)
  const lrMin = baseLr * 1e-3;
  const lrMax = baseLr * 1.05;
  const lrSx = (s) => SCHED_X + (s / TOTAL_STEPS) * SCHED_W;
  const lrSy = (l) => {
    const lo = Math.log10(Math.max(l, 1e-12));
    const hi = Math.log10(lrMax);
    const lop = Math.log10(lrMin);
    const t = (lo - lop) / (hi - lop);
    return SCHED_Y + (1 - Math.max(0, Math.min(1, t))) * SCHED_H;
  };

  const transition = reducedMotion ? 'none' : 'cx 0.04s linear, cy 0.04s linear';

  const visibleStep = Math.max(1, stepIdx);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* LEFT: Loss curve + trajectories */}
          <text x={LOSS_X} y={LOSS_Y - 10} fontSize="10" fill="var(--text-dim)"
                fontFamily="var(--mono)" letterSpacing="0.14em">
            LOSS LANDSCAPE  ·  trajectories  step {visibleStep} / {TOTAL_STEPS}
          </text>
          <rect x={LOSS_X} y={LOSS_Y} width={LOSS_W} height={LOSS_H} rx={8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

          {/* axes */}
          <line x1={LOSS_X + 4} y1={LOSS_Y + LOSS_H - 4} x2={LOSS_X + LOSS_W - 4} y2={LOSS_Y + LOSS_H - 4}
                stroke="var(--border)" strokeWidth="1" />

          <path d={curveD} fill="none" stroke="var(--text-dim)" strokeWidth="1.5" opacity="0.65" />

          {/* trajectories */}
          {runs.map((r) => {
            const upto = Math.min(visibleStep, r.path.length - 1);
            let d = '';
            for (let i = 0; i <= upto; i++) {
              const p = r.path[i];
              const px = xToPx(p.x);
              const py = yToPx(p.y);
              d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
            }
            const last = r.path[upto];
            return (
              <g key={r.key}>
                <path d={d} fill="none" stroke={r.color} strokeWidth="1.6" opacity="0.85" />
                <circle cx={xToPx(last.x)} cy={yToPx(last.y)} r={4.2} fill={r.color}
                        stroke="var(--bg)" strokeWidth="1.2" style={{ transition }} />
              </g>
            );
          })}

          {/* RIGHT: LR schedule curves */}
          <text x={SCHED_X} y={SCHED_Y - 10} fontSize="10" fill="var(--text-dim)"
                fontFamily="var(--mono)" letterSpacing="0.14em">
            LR SCHEDULES  ·  log scale
          </text>
          <rect x={SCHED_X} y={SCHED_Y} width={SCHED_W} height={SCHED_H} rx={8}
                fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.6" />

          {/* log gridlines */}
          {[-1, -2, -3].map((decade, di) => {
            const lr = baseLr * Math.pow(10, decade);
            if (lr < lrMin) return null;
            const y = lrSy(lr);
            return (
              <g key={`gl-${di}`}>
                <line x1={SCHED_X + 4} y1={y} x2={SCHED_X + SCHED_W - 4} y2={y}
                      stroke="var(--border)" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.6" />
                <text x={SCHED_X + 6} y={y - 2} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
                  {lr.toExponential(0)}
                </text>
              </g>
            );
          })}

          {SCHEDULES.map((s, si) => {
            const fn = s.lr(baseLr);
            let d = '';
            const N = 80;
            for (let i = 0; i <= N; i++) {
              const step = (i / N) * TOTAL_STEPS;
              const lr = Math.max(fn(step), 1e-12);
              const px = lrSx(step);
              const py = lrSy(lr);
              d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
            }
            // current step marker
            const curLr = Math.max(fn(visibleStep), 1e-12);
            return (
              <g key={s.key}>
                <path d={d} fill="none" stroke={s.color} strokeWidth="1.5" opacity="0.85" />
                <circle cx={lrSx(visibleStep)} cy={lrSy(curLr)} r={3} fill={s.color}
                        stroke="var(--bg)" strokeWidth="1" />
              </g>
            );
          })}

          {/* Legend at bottom */}
          <g transform={`translate(${LOSS_X}, ${H - 60})`}>
            {runs.map((r, i) => {
              const final = r.path[Math.min(visibleStep, r.path.length - 1)];
              const x = i * 180;
              return (
                <g key={r.key} transform={`translate(${x}, 0)`}>
                  <rect x={0} y={2} width={10} height={10} rx={2} fill={r.color} />
                  <text x={16} y={11} fontSize="9.5" fill="var(--text-main)"
                        fontFamily="var(--mono)" letterSpacing="0.08em" fontWeight={700}>
                    {r.label}
                  </text>
                  <text x={16} y={24} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
                    final loss {final.y.toFixed(3)}
                  </text>
                  <text x={16} y={36} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
                    conv. @ step {r.convergedAt}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Activity size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              base learning rate
            </span>
            <input type="range" min="-4" max="-1" step="0.05" value={logLr}
                   onChange={(e) => { setLogLr(parseFloat(e.target.value)); setStepIdx(0); setIsRunningRaw(false); }} />
            <span className="mlviz-slider-val">{baseLr.toExponential(1)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`} onClick={handleToggle}>
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{stepIdx >= TOTAL_STEPS ? 'Restart' : isRunning ? 'Pause' : 'Play'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleStep}
                  disabled={isRunning || stepIdx >= TOTAL_STEPS}>
            <Zap size={13} />
            <span>Step</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {visibleStep} / {TOTAL_STEPS} steps
          </span>
        </div>

        <div className="mlviz-hint">
          all 4 schedules start from x = -1.6 · watch which lands closest to the global minimum
        </div>
      </div>
    </div>
  );
}
