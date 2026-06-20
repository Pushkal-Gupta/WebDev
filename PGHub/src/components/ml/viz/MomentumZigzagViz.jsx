import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/*
 * Narrow ravine: f(x, y) = x^2 + 50 * y^2.
 * Gradient = (2x, 100y). Curvature ratio 50 — every step of plain SGD
 * along y wants to overshoot, so the iterate zig-zags across the ravine.
 * Momentum averages the alternating y-components to zero while accumulating
 * the consistent x-component, so it actually moves down the long axis.
 */

const W = 560;
const H = 360;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 32;
const X_MIN = -3.6;
const X_MAX = 1.6;
const Y_MIN = -1.4;
const Y_MAX = 1.4;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const MAX_STEPS = 100;
const STEP_DELAY = 60;

const START_X = -3.0;
const START_Y = 1.0;

const COLOR_SGD = 'var(--hue-pink, #ff66cc)';
const COLOR_MOM = 'var(--accent)';

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}
function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function loss(x, y) {
  return x * x + 50 * y * y;
}
function grad(x, y) {
  return [2 * x, 100 * y];
}

/* Contour levels chosen so the elongated ravine reads cleanly. */
const CONTOUR_LEVELS = [0.5, 1.2, 2.5, 4.5, 7, 10, 13];

/* Heatmap grid for the loss surface. Each cell shaded by f(x,y). */
const HEAT_NX = 64;
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
      const l = grid[j][i];
      const t = Math.min(1, Math.pow(l / maxL, 0.45));
      const op = 0.32 * (1 - t) + 0.02;
      cells.push({
        x: PAD_L + (i / HEAT_NX) * PLOT_W,
        y: PAD_T + (j / HEAT_NY) * PLOT_H,
        w: PLOT_W / HEAT_NX + 0.6,
        h: PLOT_H / HEAT_NY + 0.6,
        op,
      });
    }
  }
  return cells;
}

/* Contour ellipses: f = c => (x/sqrt(c))^2 + (y/sqrt(c/50))^2 = 1.
   Major radius along x = sqrt(c), minor radius along y = sqrt(c/50). */
function buildContours() {
  return CONTOUR_LEVELS.map((c) => {
    const rX = Math.sqrt(c);
    const rY = Math.sqrt(c / 50);
    const cx = xToPx(0);
    const cy = yToPx(0);
    const rx = (rX / (X_MAX - X_MIN)) * PLOT_W;
    const ry = (rY / (Y_MAX - Y_MIN)) * PLOT_H;
    return { c, cx, cy, rx, ry };
  });
}

function clampX(v) {
  if (v < X_MIN) return X_MIN;
  if (v > X_MAX) return X_MAX;
  return v;
}
function clampY(v) {
  if (v < Y_MIN) return Y_MIN;
  if (v > Y_MAX) return Y_MAX;
  return v;
}

function trailPath(points) {
  if (!points.length) return '';
  const parts = [];
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    parts.push(`${i === 0 ? 'M' : 'L'}${xToPx(x).toFixed(2)},${yToPx(y).toFixed(2)}`);
  }
  return parts.join(' ');
}

export default function MomentumZigzagViz() {
  const [lr, setLr] = useState(0.012);
  const [beta, setBeta] = useState(0.9);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [trails, setTrails] = useState({
    sgd: [[START_X, START_Y]],
    mom: [[START_X, START_Y]],
  });
  const [velocity, setVelocity] = useState([0, 0]);

  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const velRef = useRef([0, 0]);

  const heatCells = useMemo(() => buildHeatmap(), []);
  const contours = useMemo(() => buildContours(), []);

  const lrRef = useRef(lr);
  const betaRef = useRef(beta);
  useEffect(() => { lrRef.current = lr; }, [lr]);
  useEffect(() => { betaRef.current = beta; }, [beta]);

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

  const doStep = useCallback(() => {
    const curLr = lrRef.current;
    const curBeta = betaRef.current;
    setTrails((prev) => {
      const sgdLast = prev.sgd[prev.sgd.length - 1];
      const momLast = prev.mom[prev.mom.length - 1];

      // Plain SGD
      const [sg1, sg2] = grad(sgdLast[0], sgdLast[1]);
      const sgdNext = [
        clampX(sgdLast[0] - curLr * sg1),
        clampY(sgdLast[1] - curLr * sg2),
      ];

      // SGD + Momentum: v_{t+1} = beta * v_t + g_t ; theta -= lr * v_{t+1}
      const [mg1, mg2] = grad(momLast[0], momLast[1]);
      const [vx, vy] = velRef.current;
      const newVx = curBeta * vx + mg1;
      const newVy = curBeta * vy + mg2;
      velRef.current = [newVx, newVy];
      const momNext = [
        clampX(momLast[0] - curLr * newVx),
        clampY(momLast[1] - curLr * newVy),
      ];

      return {
        sgd: [...prev.sgd, sgdNext],
        mom: [...prev.mom, momNext],
      };
    });
    setVelocity(velRef.current);
    setSteps((s) => s + 1);
  }, []);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    if (steps >= MAX_STEPS) return;
    doStep();
  }, [doStep, steps]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      runningRef.current = false;
      setRunning(false);
      clearTimer();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    let count = steps;
    const tick = () => {
      if (!runningRef.current) return;
      doStep();
      count += 1;
      if (count >= MAX_STEPS) {
        runningRef.current = false;
        setRunning(false);
        clearTimer();
        return;
      }
      timerRef.current = setTimeout(tick, STEP_DELAY);
    };
    timerRef.current = setTimeout(tick, STEP_DELAY);
  }, [clearTimer, doStep, steps]);

  const handleReset = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearTimer();
    setSteps(0);
    velRef.current = [0, 0];
    setVelocity([0, 0]);
    setTrails({
      sgd: [[START_X, START_Y]],
      mom: [[START_X, START_Y]],
    });
  }, [clearTimer]);

  const sgdHead = trails.sgd[trails.sgd.length - 1];
  const momHead = trails.mom[trails.mom.length - 1];

  const lossSgd = loss(sgdHead[0], sgdHead[1]);
  const lossMom = loss(momHead[0], momHead[1]);

  const sgdPath = trailPath(trails.sgd);
  const momPath = trailPath(trails.mom);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg momz-svg">
          {/* Heatmap */}
          {heatCells.map((c, i) => (
            <rect
              key={`hm${i}`}
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill="var(--accent)"
              opacity={c.op}
              shapeRendering="crispEdges"
            />
          ))}

          {/* Contour ellipses */}
          {contours.map((co, i) => (
            <ellipse
              key={`co${i}`}
              cx={co.cx}
              cy={co.cy}
              rx={co.rx}
              ry={co.ry}
              fill="none"
              stroke="var(--border)"
              strokeWidth="1"
              opacity={0.55}
              strokeDasharray={i % 2 === 0 ? '' : '3 3'}
            />
          ))}

          {/* axes */}
          <line x1={PAD_L} y1={yToPx(0)} x2={W - PAD_R} y2={yToPx(0)} stroke="var(--border)" strokeWidth="1" opacity="0.5" />
          <line x1={xToPx(0)} y1={PAD_T} x2={xToPx(0)} y2={H - PAD_B} stroke="var(--border)" strokeWidth="1" opacity="0.5" />

          {/* axis ticks */}
          {[-3, -2, -1, 1].map((tx) => (
            <text
              key={`xt${tx}`}
              x={xToPx(tx)}
              y={H - PAD_B + 14}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              {tx}
            </text>
          ))}
          {[-1, 1].map((ty) => (
            <text
              key={`yt${ty}`}
              x={PAD_L - 6}
              y={yToPx(ty) + 3}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="end"
            >
              {ty}
            </text>
          ))}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yToPx(0) - 6}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            x
          </text>
          <text
            x={xToPx(0) + 6}
            y={PAD_T + 4}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
          >
            y
          </text>

          {/* minimum marker */}
          <circle cx={xToPx(0)} cy={yToPx(0)} r={4} fill="var(--accent)" opacity="0.9" />
          <circle cx={xToPx(0)} cy={yToPx(0)} r={9} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

          {/* trajectories */}
          <path d={sgdPath} fill="none" stroke={COLOR_SGD} strokeWidth="1.7" strokeOpacity="0.9" strokeLinejoin="round" strokeLinecap="round" />
          <path d={momPath} fill="none" stroke={COLOR_MOM} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

          {/* trail dots */}
          {trails.sgd.map((p, i) => (
            <circle key={`sd${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.7} fill={COLOR_SGD} opacity={0.65} />
          ))}
          {trails.mom.map((p, i) => (
            <circle key={`md${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.9} fill={COLOR_MOM} opacity={0.85} />
          ))}

          {/* start marker */}
          <circle cx={xToPx(START_X)} cy={yToPx(START_Y)} r={5} fill="none" stroke="var(--text-dim)" strokeWidth="1.5" />
          <text
            x={xToPx(START_X) + 8}
            y={yToPx(START_Y) - 6}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
          >
            start
          </text>

          {/* current heads */}
          <circle cx={xToPx(sgdHead[0])} cy={yToPx(sgdHead[1])} r={5.5} fill={COLOR_SGD} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(momHead[0])} cy={yToPx(momHead[1])} r={5.5} fill={COLOR_MOM} stroke="var(--bg)" strokeWidth="1.5" />

          {/* legend */}
          <g transform={`translate(${W - PAD_R - 178}, ${PAD_T + 6})`}>
            <rect x="-6" y="-6" width="184" height="48" rx="6" fill="var(--surface)" opacity="0.88" stroke="var(--border)" />
            <g transform="translate(0, 6)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_SGD} strokeWidth="1.8" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Plain SGD</text>
            </g>
            <g transform="translate(0, 24)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_MOM} strokeWidth="2.2" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">SGD + Momentum (β={snap(beta, 2)})</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row momz-stats-row">
          <div className="momz-stat">
            <span className="momz-stat-tag" style={{ color: COLOR_SGD }}>Plain SGD</span>
            <span className="mlviz-val">loss {snap(lossSgd, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">(x, y) = ({snap(sgdHead[0], 2)}, {snap(sgdHead[1], 2)})</span>
          </div>
          <div className="momz-stat">
            <span className="momz-stat-tag" style={{ color: COLOR_MOM }}>SGD + Momentum</span>
            <span className="mlviz-val">loss {snap(lossMom, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">(x, y) = ({snap(momHead[0], 2)}, {snap(momHead[1], 2)})</span>
            <span className="mlviz-sub">v = ({snap(velocity[0], 2)}, {snap(velocity[1], 2)})</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate η</span>
            <input
              type="range"
              min="0.002"
              max="0.02"
              step="0.001"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(lr, 3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">momentum β</span>
            <input
              type="range"
              min="0"
              max="0.98"
              step="0.01"
              value={beta}
              onChange={(e) => setBeta(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(beta, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running || steps >= MAX_STEPS}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={handleRun}
            disabled={steps >= MAX_STEPS && !running}
          >
            {running ? <Square size={13} /> : <Play size={13} />}
            <span>{running ? 'Stop' : `Run ${MAX_STEPS} steps`}</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleReset}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          f(x, y) = x² + 50·y² · curvature ratio 50:1 · plain SGD bounces across the y-axis ravine wall while inching along x · momentum cancels the alternating y components and accumulates the consistent x component
        </div>
      </div>

      <style>{`
        .momz-svg {
          aspect-ratio: ${W} / ${H};
          max-width: 100%;
        }
        .momz-stats-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.6rem;
          align-items: stretch;
        }
        .momz-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.45rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          min-width: 0;
        }
        .momz-stat-tag {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .momz-stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
