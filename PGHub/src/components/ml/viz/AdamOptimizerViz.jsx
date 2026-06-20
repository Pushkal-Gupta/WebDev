import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

/*
 * Adam vs SGD vs Momentum on an elongated valley: f(x, y) = x^2 + 100 * y^2.
 * Gradient = (2x, 200y). The y-direction is ~100x steeper than x, so vanilla
 * SGD ricochets across the valley walls while x-progress crawls. Momentum
 * accumulates velocity but still suffers from the asymmetry. Adam normalizes
 * each parameter by sqrt(EMA of squared grads) — the steep y axis gets a
 * tiny effective step, the flat x axis gets a healthy one.
 */

const W = 580;
const H = 360;
const PAD_L = 44;
const PAD_R = 132;
const PAD_T = 18;
const PAD_B = 32;
const X_MIN = -2.6;
const X_MAX = 2.6;
const Y_MIN = -1.05;
const Y_MAX = 1.05;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;

const MAX_STEPS = 120;
const STEP_DELAY = 70;

const START_X = -2.2;
const START_Y = 0.85;

const EPS = 1e-8;

const COLOR_SGD = 'var(--hue-pink, #ff66cc)';
const COLOR_MOM = 'var(--hue-sky, #5ecbff)';
const COLOR_ADAM = 'var(--hue-mint, #6ee0a8)';

const CONTOUR_LEVELS = [0.25, 1, 2.5, 5, 10, 20, 40, 80, 150, 250];

const HEAT_NX = 60;
const HEAT_NY = 40;

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}
function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}
function snap(v, p = 3) {
  if (!Number.isFinite(v)) return '∞';
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}
function loss(x, y) {
  return x * x + 100 * y * y;
}
function grad(x, y) {
  return [2 * x, 200 * y];
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

function buildHeatmap() {
  const cells = [];
  const dx = (X_MAX - X_MIN) / HEAT_NX;
  const dy = (Y_MAX - Y_MIN) / HEAT_NY;
  let maxL = 0;
  const grid = [];
  for (let j = 0; j < HEAT_NY; j++) {
    const row = [];
    const y = Y_MIN + (j + 0.5) * dy;
    for (let i = 0; i < HEAT_NX; i++) {
      const x = X_MIN + (i + 0.5) * dx;
      const l = loss(x, y);
      row.push(l);
      if (l > maxL) maxL = l;
    }
    grid.push(row);
  }
  for (let j = 0; j < HEAT_NY; j++) {
    for (let i = 0; i < HEAT_NX; i++) {
      const l = grid[j][i];
      const t = Math.min(1, Math.pow(l / maxL, 0.45));
      const op = 0.4 * (1 - t) + 0.02;
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

/* f = c => x^2 + 100 y^2 = c
   semi-axis along x = sqrt(c), along y = sqrt(c)/10. */
function buildContours() {
  return CONTOUR_LEVELS.map((c) => {
    const rX = Math.sqrt(c);
    const rY = Math.sqrt(c) / 10;
    const cx = xToPx(0);
    const cy = yToPx(0);
    const rx = (rX / (X_MAX - X_MIN)) * PLOT_W;
    const ry = (rY / (Y_MAX - Y_MIN)) * PLOT_H;
    return { c, cx, cy, rx, ry };
  }).filter((co) => co.rx > 1 && co.rx < PLOT_W * 0.7);
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

const INIT_STATE = () => ({
  sgd: { x: START_X, y: START_Y },
  mom: { x: START_X, y: START_Y, vx: 0, vy: 0 },
  adam: { x: START_X, y: START_Y, mx: 0, my: 0, vx: 0, vy: 0, t: 0 },
});

export default function AdamOptimizerViz() {
  const [lr, setLr] = useState(0.05);
  const [beta1, setBeta1] = useState(0.9);
  const [beta2, setBeta2] = useState(0.999);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);
  const [state, setState] = useState(INIT_STATE);
  const [trails, setTrails] = useState({
    sgd: [[START_X, START_Y]],
    mom: [[START_X, START_Y]],
    adam: [[START_X, START_Y]],
  });

  const runningRef = useRef(false);
  const timerRef = useRef(null);

  const lrRef = useRef(lr);
  const b1Ref = useRef(beta1);
  const b2Ref = useRef(beta2);
  useEffect(() => { lrRef.current = lr; }, [lr]);
  useEffect(() => { b1Ref.current = beta1; }, [beta1]);
  useEffect(() => { b2Ref.current = beta2; }, [beta2]);

  const heatCells = useMemo(() => buildHeatmap(), []);
  const contours = useMemo(() => buildContours(), []);

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
    const b1 = b1Ref.current;
    const b2 = b2Ref.current;
    let nextState = null;
    setState((prev) => {
      // Pure SGD
      const [sgx, sgy] = grad(prev.sgd.x, prev.sgd.y);
      const sgdNext = {
        x: clampX(prev.sgd.x - curLr * sgx),
        y: clampY(prev.sgd.y - curLr * sgy),
      };

      // SGD + Momentum (heavy ball): v = mu*v + g; x -= lr * v
      const mu = b1; // reuse beta1 as momentum coefficient for fair comparison
      const [mgx, mgy] = grad(prev.mom.x, prev.mom.y);
      const mvx = mu * prev.mom.vx + mgx;
      const mvy = mu * prev.mom.vy + mgy;
      const momNext = {
        x: clampX(prev.mom.x - curLr * mvx),
        y: clampY(prev.mom.y - curLr * mvy),
        vx: mvx,
        vy: mvy,
      };

      // Adam
      const t = prev.adam.t + 1;
      const [agx, agy] = grad(prev.adam.x, prev.adam.y);
      const mx = b1 * prev.adam.mx + (1 - b1) * agx;
      const my = b1 * prev.adam.my + (1 - b1) * agy;
      const vx = b2 * prev.adam.vx + (1 - b2) * agx * agx;
      const vy = b2 * prev.adam.vy + (1 - b2) * agy * agy;
      const mxHat = mx / (1 - Math.pow(b1, t));
      const myHat = my / (1 - Math.pow(b1, t));
      const vxHat = vx / (1 - Math.pow(b2, t));
      const vyHat = vy / (1 - Math.pow(b2, t));
      const adamNext = {
        x: clampX(prev.adam.x - curLr * mxHat / (Math.sqrt(vxHat) + EPS)),
        y: clampY(prev.adam.y - curLr * myHat / (Math.sqrt(vyHat) + EPS)),
        mx, my, vx, vy, t,
      };

      nextState = { sgd: sgdNext, mom: momNext, adam: adamNext };
      return nextState;
    });

    setTrails((prev) => {
      if (!nextState) return prev;
      return {
        sgd: [...prev.sgd, [nextState.sgd.x, nextState.sgd.y]],
        mom: [...prev.mom, [nextState.mom.x, nextState.mom.y]],
        adam: [...prev.adam, [nextState.adam.x, nextState.adam.y]],
      };
    });
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
    setState(INIT_STATE());
    setTrails({
      sgd: [[START_X, START_Y]],
      mom: [[START_X, START_Y]],
      adam: [[START_X, START_Y]],
    });
  }, [clearTimer]);

  const sgdHead = state.sgd;
  const momHead = state.mom;
  const adamHead = state.adam;

  const lossSgd = loss(sgdHead.x, sgdHead.y);
  const lossMom = loss(momHead.x, momHead.y);
  const lossAdam = loss(adamHead.x, adamHead.y);

  const sgdPath = trailPath(trails.sgd);
  const momPath = trailPath(trails.mom);
  const adamPath = trailPath(trails.adam);

  // Bar visuals for Adam's m_t / v_t — normalized so bars stay in panel.
  // m can be negative => signed bar. v is non-negative => magnitude bar.
  const M_MAX = 200; // saturates around |grad| range
  const V_MAX = 40000; // grad^2 saturates ~(200)^2
  const mxFrac = Math.max(-1, Math.min(1, adamHead.mx / M_MAX));
  const myFrac = Math.max(-1, Math.min(1, adamHead.my / M_MAX));
  const vxFrac = Math.max(0, Math.min(1, Math.sqrt(adamHead.vx / V_MAX)));
  const vyFrac = Math.max(0, Math.min(1, Math.sqrt(adamHead.vy / V_MAX)));

  // Panel for Adam moving averages (right side of plot)
  const PANEL_X = W - PAD_R + 8;
  const PANEL_Y = PAD_T + 6;
  const PANEL_W = PAD_R - 18;
  const PANEL_H = PLOT_H - 12;

  const BAR_W = 14;
  const BAR_H = 70;
  const barRowY = (i) => PANEL_Y + 38 + i * (BAR_H + 36);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg adamopt-svg">
          <defs>
            <clipPath id="adamopt-plot-clip">
              <rect x={PAD_L} y={PAD_T} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* Heatmap (loss surface intensity) */}
          <g clipPath="url(#adamopt-plot-clip)">
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
          </g>

          {/* Contour ellipses (the elongated valley) */}
          <g clipPath="url(#adamopt-plot-clip)">
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
          </g>

          {/* axes */}
          <line x1={PAD_L} y1={yToPx(0)} x2={W - PAD_R} y2={yToPx(0)} stroke="var(--border)" strokeWidth="1" opacity="0.55" />
          <line x1={xToPx(0)} y1={PAD_T} x2={xToPx(0)} y2={H - PAD_B} stroke="var(--border)" strokeWidth="1" opacity="0.55" />

          {/* ticks */}
          {[-2, -1, 1, 2].map((tx) => (
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
          {[-1, -0.5, 0.5, 1].map((ty) => (
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

          {/* minimum */}
          <circle cx={xToPx(0)} cy={yToPx(0)} r={4} fill="var(--accent)" opacity="0.9" />
          <circle cx={xToPx(0)} cy={yToPx(0)} r={9} fill="none" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />

          {/* trajectories */}
          <g clipPath="url(#adamopt-plot-clip)">
            <path d={sgdPath} fill="none" stroke={COLOR_SGD} strokeWidth="1.6" strokeOpacity="0.85" strokeLinejoin="round" strokeLinecap="round" />
            <path d={momPath} fill="none" stroke={COLOR_MOM} strokeWidth="1.8" strokeOpacity="0.9" strokeLinejoin="round" strokeLinecap="round" />
            <path d={adamPath} fill="none" stroke={COLOR_ADAM} strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />

            {trails.sgd.map((p, i) => (
              <circle key={`sd${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.5} fill={COLOR_SGD} opacity={0.55} />
            ))}
            {trails.mom.map((p, i) => (
              <circle key={`md${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.6} fill={COLOR_MOM} opacity={0.7} />
            ))}
            {trails.adam.map((p, i) => (
              <circle key={`ad${i}`} cx={xToPx(p[0])} cy={yToPx(p[1])} r={1.8} fill={COLOR_ADAM} opacity={0.85} />
            ))}
          </g>

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
          <circle cx={xToPx(sgdHead.x)} cy={yToPx(sgdHead.y)} r={5} fill={COLOR_SGD} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(momHead.x)} cy={yToPx(momHead.y)} r={5} fill={COLOR_MOM} stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={xToPx(adamHead.x)} cy={yToPx(adamHead.y)} r={5.5} fill={COLOR_ADAM} stroke="var(--bg)" strokeWidth="1.5" />

          {/* legend top-left of plot */}
          <g transform={`translate(${PAD_L + 8}, ${PAD_T + 6})`}>
            <rect x="-6" y="-6" width="124" height="62" rx="6" fill="var(--surface)" opacity="0.88" stroke="var(--border)" />
            <g transform="translate(0, 6)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_SGD} strokeWidth="1.8" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">SGD</text>
            </g>
            <g transform="translate(0, 22)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_MOM} strokeWidth="2" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Momentum</text>
            </g>
            <g transform="translate(0, 38)">
              <line x1="0" y1="4" x2="18" y2="4" stroke={COLOR_ADAM} strokeWidth="2.2" />
              <text x="24" y="7" fontSize="10" fill="var(--text-main)" fontFamily="var(--mono, monospace)">Adam</text>
            </g>
          </g>

          {/* Adam moving-averages panel */}
          <g>
            <rect
              x={PANEL_X}
              y={PANEL_Y}
              width={PANEL_W}
              height={PANEL_H}
              rx={8}
              fill="var(--surface)"
              opacity="0.92"
              stroke="var(--border)"
            />
            <text
              x={PANEL_X + PANEL_W / 2}
              y={PANEL_Y + 16}
              fontSize="10"
              fontWeight="700"
              fill={COLOR_ADAM}
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.08em"
            >
              ADAM EMA
            </text>

            {/* m_t row */}
            <g>
              <text
                x={PANEL_X + PANEL_W / 2}
                y={barRowY(0) - 6}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                m_t (mean grad)
              </text>
              {/* baseline */}
              <line
                x1={PANEL_X + 10}
                y1={barRowY(0) + BAR_H / 2}
                x2={PANEL_X + PANEL_W - 10}
                y2={barRowY(0) + BAR_H / 2}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.6"
              />
              {/* m_x bar (signed) */}
              {(() => {
                const cx = PANEL_X + PANEL_W / 2 - 16;
                const mid = barRowY(0) + BAR_H / 2;
                const h = Math.abs(mxFrac) * (BAR_H / 2 - 2);
                const y = mxFrac >= 0 ? mid - h : mid;
                return (
                  <>
                    <rect
                      x={cx - BAR_W / 2}
                      y={y}
                      width={BAR_W}
                      height={Math.max(1, h)}
                      fill={COLOR_ADAM}
                      opacity="0.85"
                      rx={2}
                    />
                    <text
                      x={cx}
                      y={barRowY(0) + BAR_H + 12}
                      fontSize="9"
                      fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >
                      m_x
                    </text>
                  </>
                );
              })()}
              {/* m_y bar (signed) */}
              {(() => {
                const cx = PANEL_X + PANEL_W / 2 + 16;
                const mid = barRowY(0) + BAR_H / 2;
                const h = Math.abs(myFrac) * (BAR_H / 2 - 2);
                const y = myFrac >= 0 ? mid - h : mid;
                return (
                  <>
                    <rect
                      x={cx - BAR_W / 2}
                      y={y}
                      width={BAR_W}
                      height={Math.max(1, h)}
                      fill={COLOR_ADAM}
                      opacity="0.6"
                      rx={2}
                    />
                    <text
                      x={cx}
                      y={barRowY(0) + BAR_H + 12}
                      fontSize="9"
                      fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >
                      m_y
                    </text>
                  </>
                );
              })()}
            </g>

            {/* v_t row */}
            <g>
              <text
                x={PANEL_X + PANEL_W / 2}
                y={barRowY(1) - 6}
                fontSize="10"
                fill="var(--text-dim)"
                fontFamily="var(--mono, monospace)"
                textAnchor="middle"
              >
                v_t (mean grad²)
              </text>
              <line
                x1={PANEL_X + 10}
                y1={barRowY(1) + BAR_H}
                x2={PANEL_X + PANEL_W - 10}
                y2={barRowY(1) + BAR_H}
                stroke="var(--border)"
                strokeWidth="1"
                opacity="0.6"
              />
              {/* v_x bar */}
              {(() => {
                const cx = PANEL_X + PANEL_W / 2 - 16;
                const baseY = barRowY(1) + BAR_H;
                const h = vxFrac * (BAR_H - 2);
                return (
                  <>
                    <rect
                      x={cx - BAR_W / 2}
                      y={baseY - h}
                      width={BAR_W}
                      height={Math.max(1, h)}
                      fill={COLOR_ADAM}
                      opacity="0.85"
                      rx={2}
                    />
                    <text
                      x={cx}
                      y={baseY + 12}
                      fontSize="9"
                      fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >
                      v_x
                    </text>
                  </>
                );
              })()}
              {/* v_y bar */}
              {(() => {
                const cx = PANEL_X + PANEL_W / 2 + 16;
                const baseY = barRowY(1) + BAR_H;
                const h = vyFrac * (BAR_H - 2);
                return (
                  <>
                    <rect
                      x={cx - BAR_W / 2}
                      y={baseY - h}
                      width={BAR_W}
                      height={Math.max(1, h)}
                      fill={COLOR_ADAM}
                      opacity="0.6"
                      rx={2}
                    />
                    <text
                      x={cx}
                      y={baseY + 12}
                      fontSize="9"
                      fill="var(--text-dim)"
                      fontFamily="var(--mono, monospace)"
                      textAnchor="middle"
                    >
                      v_y
                    </text>
                  </>
                );
              })()}
            </g>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row adamopt-stats-row">
          <div className="adamopt-stat">
            <span className="adamopt-stat-tag" style={{ color: COLOR_SGD }}>SGD</span>
            <span className="mlviz-val">loss {snap(lossSgd, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">(x,y)=({snap(sgdHead.x, 2)}, {snap(sgdHead.y, 3)})</span>
          </div>
          <div className="adamopt-stat">
            <span className="adamopt-stat-tag" style={{ color: COLOR_MOM }}>Momentum</span>
            <span className="mlviz-val">loss {snap(lossMom, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">(x,y)=({snap(momHead.x, 2)}, {snap(momHead.y, 3)})</span>
          </div>
          <div className="adamopt-stat">
            <span className="adamopt-stat-tag" style={{ color: COLOR_ADAM }}>Adam</span>
            <span className="mlviz-val">loss {snap(lossAdam, 3)}</span>
            <span className="mlviz-sub">step {steps}</span>
            <span className="mlviz-sub">(x,y)=({snap(adamHead.x, 2)}, {snap(adamHead.y, 3)})</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate</span>
            <input
              type="range"
              min="0.005"
              max="0.25"
              step="0.005"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(lr, 3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">β₁ (momentum)</span>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={beta1}
              onChange={(e) => setBeta1(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(beta1, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">β₂ (RMS)</span>
            <input
              type="range"
              min="0.9"
              max="0.9999"
              step="0.0001"
              value={beta2}
              onChange={(e) => setBeta2(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(beta2, 4)}</span>
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
            <span>{running ? 'Stop' : `Run ${MAX_STEPS}`}</span>
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
          f(x, y) = x² + 100·y² · y-axis is 100× steeper · Adam divides each
          coordinate by √v_t so the steep axis takes tiny steps while x marches
          along the flat valley.
        </div>
      </div>

      <style>{`
        .adamopt-svg {
          aspect-ratio: ${W} / ${H};
          max-width: 100%;
        }
        .adamopt-stats-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.6rem;
          align-items: stretch;
        }
        .adamopt-stat {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          padding: 0.45rem 0.6rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          min-width: 0;
        }
        .adamopt-stat-tag {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .adamopt-stats-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
