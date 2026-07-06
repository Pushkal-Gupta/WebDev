import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/*
 * Elliptical bowl f(x, y) = 0.5*(a*x^2 + b*y^2) with a small, b large.
 * Gradient = (a*x, b*y). The b/a curvature ratio makes plain SGD bounce
 * across the steep y axis. Momentum accumulates velocity: the alternating
 * y component cancels, the consistent x component builds, so the ball
 * rolls down the long floor of the bowl instead of rattling the walls.
 */

const W = 560;
const H = 360;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 30;
const X_MIN = -3.4;
const X_MAX = 1.4;
const Y_MIN = -1.5;
const Y_MAX = 1.5;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const A = 2;   // gentle x-curvature
const B = 24;  // steep y-curvature
const MAX_STEPS = 120;
const STEP_DELAY = 55;
const CONVERGE_EPS = 0.02; // distance-to-origin threshold counted as "converged"

const START_X = -2.9;
const START_Y = 1.1;

const COLOR_SGD = 'var(--hue-pink)';
const COLOR_MOM = 'var(--accent)';

function xToPx(x) { return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W; }
function yToPx(y) { return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H; }
function snap(v, p = 3) { const m = Math.pow(10, p); return Math.round(v * m) / m; }
function loss(x, y) { return 0.5 * (A * x * x + B * y * y); }
function grad(x, y) { return [A * x, B * y]; }
function dist(x, y) { return Math.sqrt(x * x + y * y); }

const CONTOUR_LEVELS = [0.2, 0.6, 1.3, 2.4, 4, 6.5];

function buildContours() {
  return CONTOUR_LEVELS.map((c) => {
    const rX = Math.sqrt((2 * c) / A);
    const rY = Math.sqrt((2 * c) / B);
    return {
      c,
      cx: xToPx(0),
      cy: yToPx(0),
      rx: (rX / (X_MAX - X_MIN)) * PLOT_W,
      ry: (rY / (Y_MAX - Y_MIN)) * PLOT_H,
    };
  });
}

const HEAT_NX = 60;
const HEAT_NY = 36;
function buildHeatmap() {
  const cells = [];
  const dx = (X_MAX - X_MIN) / HEAT_NX;
  const dy = (Y_MAX - Y_MIN) / HEAT_NY;
  let maxL = 0;
  const grid = [];
  for (let j = 0; j < HEAT_NY; j++) {
    const row = [];
    const yv = Y_MIN + (j + 0.5) * dy;
    for (let i = 0; i < HEAT_NX; i++) {
      const xv = X_MIN + (i + 0.5) * dx;
      const l = loss(xv, yv);
      row.push(l);
      if (l > maxL) maxL = l;
    }
    grid.push(row);
  }
  for (let j = 0; j < HEAT_NY; j++) {
    for (let i = 0; i < HEAT_NX; i++) {
      const t = Math.min(1, Math.pow(grid[j][i] / maxL, 0.45));
      cells.push({
        x: PAD_L + (i / HEAT_NX) * PLOT_W,
        y: PAD_T + (j / HEAT_NY) * PLOT_H,
        w: PLOT_W / HEAT_NX + 0.6,
        h: PLOT_H / HEAT_NY + 0.6,
        op: 0.3 * (1 - t) + 0.02,
      });
    }
  }
  return cells;
}

function clampX(v) { return Math.max(X_MIN, Math.min(X_MAX, v)); }
function clampY(v) { return Math.max(Y_MIN, Math.min(Y_MAX, v)); }

function trailPath(points) {
  if (!points.length) return '';
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${xToPx(x).toFixed(2)},${yToPx(y).toFixed(2)}`)
    .join(' ');
}

export default function MomentumBowlViz() {
  const [lr, setLr] = useState(0.06);
  const [beta, setBeta] = useState(0.9);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [trails, setTrails] = useState({
    sgd: [[START_X, START_Y]],
    mom: [[START_X, START_Y]],
  });
  const [velocity, setVelocity] = useState([0, 0]);
  const [convStep, setConvStep] = useState({ sgd: null, mom: null });

  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const velRef = useRef([0, 0]);
  const lrRef = useRef(lr);
  const betaRef = useRef(beta);
  const convRef = useRef({ sgd: null, mom: null });

  useEffect(() => { lrRef.current = lr; }, [lr]);
  useEffect(() => { betaRef.current = beta; }, [beta]);

  const heatCells = useMemo(() => buildHeatmap(), []);
  const contours = useMemo(() => buildContours(), []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { runningRef.current = false; clearTimer(); }, [clearTimer]);

  const doStep = useCallback(() => {
    const curLr = lrRef.current;
    const curBeta = betaRef.current;
    setSteps((prevSteps) => {
      const nextStep = prevSteps + 1;
      setTrails((prev) => {
        const sgdLast = prev.sgd[prev.sgd.length - 1];
        const momLast = prev.mom[prev.mom.length - 1];

        const [sg1, sg2] = grad(sgdLast[0], sgdLast[1]);
        const sgdNext = [clampX(sgdLast[0] - curLr * sg1), clampY(sgdLast[1] - curLr * sg2)];

        const [mg1, mg2] = grad(momLast[0], momLast[1]);
        const [vx, vy] = velRef.current;
        const newVx = curBeta * vx + mg1;
        const newVy = curBeta * vy + mg2;
        velRef.current = [newVx, newVy];
        const momNext = [clampX(momLast[0] - curLr * newVx), clampY(momLast[1] - curLr * newVy)];

        if (convRef.current.sgd === null && dist(sgdNext[0], sgdNext[1]) < CONVERGE_EPS) {
          convRef.current = { ...convRef.current, sgd: nextStep };
        }
        if (convRef.current.mom === null && dist(momNext[0], momNext[1]) < CONVERGE_EPS) {
          convRef.current = { ...convRef.current, mom: nextStep };
        }
        setConvStep(convRef.current);

        return { sgd: [...prev.sgd, sgdNext], mom: [...prev.mom, momNext] };
      });
      setVelocity(velRef.current);
      return nextStep;
    });
  }, []);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    if (steps >= MAX_STEPS) return;
    doStep();
  }, [doStep, steps]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      runningRef.current = false; setRunning(false); clearTimer(); return;
    }
    runningRef.current = true; setRunning(true);
    let count = steps;
    const tick = () => {
      if (!runningRef.current) return;
      doStep();
      count += 1;
      if (count >= MAX_STEPS) { runningRef.current = false; setRunning(false); clearTimer(); return; }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, STEP_DELAY);
  }, [clearTimer, doStep, steps]);

  const handleReset = useCallback(() => {
    runningRef.current = false; setRunning(false); clearTimer();
    setSteps(0);
    velRef.current = [0, 0]; setVelocity([0, 0]);
    convRef.current = { sgd: null, mom: null }; setConvStep({ sgd: null, mom: null });
    setTrails({ sgd: [[START_X, START_Y]], mom: [[START_X, START_Y]] });
  }, [clearTimer]);

  const sgdHead = trails.sgd[trails.sgd.length - 1];
  const momHead = trails.mom[trails.mom.length - 1];
  const lossSgd = loss(sgdHead[0], sgdHead[1]);
  const lossMom = loss(momHead[0], momHead[1]);

  // velocity arrow from the momentum head, scaled to plot units
  const vArrowScale = 0.06;
  const vTipX = clampX(momHead[0] - velocity[0] * vArrowScale);
  const vTipY = clampY(momHead[1] - velocity[1] * vArrowScale);
  const vMag = Math.hypot(velocity[0], velocity[1]);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mbowl-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mbowl-vhead" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <path d="M0,0 L6,3.5 L0,7 Z" fill={COLOR_MOM} />
            </marker>
          </defs>

          {heatCells.map((c, i) => (
            <rect key={`hm${i}`} x={c.x} y={c.y} width={c.w} height={c.h} fill="var(--accent)" opacity={c.op} shapeRendering="crispEdges" />
          ))}

          {contours.map((co, i) => (
            <ellipse key={`co${i}`} cx={co.cx} cy={co.cy} rx={co.rx} ry={co.ry} fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" strokeDasharray={i % 2 ? '3 3' : ''} />
          ))}

          <line x1={PAD_L} y1={yToPx(0)} x2={W - PAD_R} y2={yToPx(0)} stroke="var(--border)" strokeWidth="1" opacity="0.4" />
          <line x1={xToPx(0)} y1={PAD_T} x2={xToPx(0)} y2={H - PAD_B} stroke="var(--border)" strokeWidth="1" opacity="0.4" />

          {/* minimum marker */}
          <circle cx={xToPx(0)} cy={yToPx(0)} r={4} fill="var(--accent)" opacity="0.9" />
          <circle cx={xToPx(0)} cy={yToPx(0)} r={9} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

          {/* trajectories */}
          <path d={trailPath(trails.sgd)} fill="none" stroke={COLOR_SGD} strokeWidth="1.7" strokeOpacity="0.9" strokeLinejoin="round" strokeLinecap="round" />
          <path d={trailPath(trails.mom)} fill="none" stroke={COLOR_MOM} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

          {trails.sgd.map((p, i) => (
            <circle key={`sd${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.6} fill={COLOR_SGD} opacity={0.6} />
          ))}
          {trails.mom.map((p, i) => (
            <circle key={`md${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.8} fill={COLOR_MOM} opacity={0.82} />
          ))}

          {/* start marker */}
          <circle cx={xToPx(START_X)} cy={yToPx(START_Y)} r={5} fill="none" stroke="var(--text-dim)" strokeWidth="1.5" />
          <text x={xToPx(START_X) + 8} y={yToPx(START_Y) - 6} fontSize="11.5" fill="var(--text-dim)" fontFamily="var(--mono)">start</text>

          {/* velocity arrow (momentum) */}
          {vMag > 0.05 && (
            <line
              x1={xToPx(momHead[0])}
              y1={yToPx(momHead[1])}
              x2={xToPx(vTipX)}
              y2={yToPx(vTipY)}
              stroke={COLOR_MOM}
              strokeWidth="2"
              opacity="0.7"
              markerEnd="url(#mbowl-vhead)"
            />
          )}

          {/* current heads */}
          <circle cx={xToPx(sgdHead[0])} cy={yToPx(sgdHead[1])} r={5.5} fill={COLOR_SGD} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(momHead[0])} cy={yToPx(momHead[1])} r={6} fill={COLOR_MOM} stroke="var(--bg)" strokeWidth="1.5" />

          {/* legend */}
          <g transform={`translate(${W - PAD_R - 172}, ${PAD_T + 4})`}>
            <rect x="-6" y="-6" width="178" height="46" rx="6" fill="var(--surface)" opacity="0.88" stroke="var(--border)" />
            <g transform="translate(0, 6)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_SGD} strokeWidth="1.8" />
              <text x="24" y="7" fontSize="11.5" fill="var(--text-main)" fontFamily="var(--mono)">Vanilla SGD</text>
            </g>
            <g transform="translate(0, 22)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_MOM} strokeWidth="2.2" />
              <text x="24" y="7" fontSize="11.5" fill="var(--text-main)" fontFamily="var(--mono)">Momentum (β={snap(beta, 2)})</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mbowl-stats-row">
          <div className="mbowl-stat">
            <span className="mbowl-stat-tag" style={{ color: COLOR_SGD }}>Vanilla SGD</span>
            <span className="mlviz-val">loss {snap(lossSgd, 4)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">converged: {convStep.sgd ?? '—'}</span>
          </div>
          <div className="mbowl-stat">
            <span className="mbowl-stat-tag" style={{ color: COLOR_MOM }}>Momentum</span>
            <span className="mlviz-val">loss {snap(lossMom, 4)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">‖v‖ {snap(vMag, 2)} · converged: {convStep.mom ?? '—'}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate η</span>
            <input type="range" min="0.01" max="0.1" step="0.005" value={lr} onChange={(e) => setLr(parseFloat(e.target.value))} disabled={running} />
            <span className="mlviz-slider-val">{snap(lr, 3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">momentum β</span>
            <input type="range" min="0" max="0.97" step="0.01" value={beta} onChange={(e) => setBeta(parseFloat(e.target.value))} disabled={running} />
            <span className="mlviz-slider-val">{snap(beta, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleStep} disabled={running || steps >= MAX_STEPS}>
            <StepForward size={13} /><span>Step</span>
          </button>
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={handleRun} disabled={steps >= MAX_STEPS && !running}>
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : 'Roll'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset}>
            <RotateCcw size={13} /><span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          bowl f = ½(2x² + 24y²) · curvature ratio 12:1 · vanilla SGD zig-zags across the steep y wall · momentum cancels the alternating y velocity and accumulates the steady x velocity (arrow) to roll down the floor
        </div>
      </div>

      <style>{`
        .mbowl-svg { aspect-ratio: ${W} / ${H}; max-width: 100%; }
        .mbowl-stats-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; align-items: stretch; }
        .mbowl-stat { display: flex; flex-direction: column; gap: 0.15rem; padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); min-width: 0; }
        .mbowl-stat-tag { font-family: var(--mono); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        @media (max-width: 640px) { .mbowl-stats-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
