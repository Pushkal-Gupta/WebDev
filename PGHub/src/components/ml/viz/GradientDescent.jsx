import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Play, StepForward, RotateCcw, Square } from 'lucide-react';
import './MLViz.css';

const W = 380;
const H = 300;
const PAD_L = 36;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 30;
const X_MIN = -2.5;
const X_MAX = 4.0;
const PLOT_W = W - PAD_L - PAD_R;
const PLOT_H = H - PAD_T - PAD_B;
const MAX_STEPS = 30;
const STEP_DELAY = 110;
const TRAIL_LIMIT = 40;

function f(x) {
  return 0.5 * (x - 1.2) * (x - 1.2) + 0.3 * Math.sin(3 * x) + 0.3;
}

function fprime(x) {
  return (x - 1.2) + 0.9 * Math.cos(3 * x);
}

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function buildExtents() {
  let lo = Infinity;
  let hi = -Infinity;
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const y = f(x);
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  const pad = (hi - lo) * 0.12;
  return { yMin: lo - pad, yMax: hi + pad };
}

const { yMin: Y_MIN, yMax: Y_MAX } = buildExtents();

function xToPx(x) {
  return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W;
}

function yToPx(y) {
  return PAD_T + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H;
}

function pxToX(px) {
  return X_MIN + ((px - PAD_L) / PLOT_W) * (X_MAX - X_MIN);
}

function buildCurvePath() {
  const N = 240;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / N;
    const px = xToPx(x);
    const py = yToPx(f(x));
    pts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(' ');
}

function buildFillPath(curvePath) {
  const baseY = yToPx(Y_MIN);
  return `${curvePath} L${xToPx(X_MAX).toFixed(2)},${baseY.toFixed(2)} L${xToPx(X_MIN).toFixed(2)},${baseY.toFixed(2)} Z`;
}

const INITIAL_X = -1.8;

export default function GradientDescent() {
  const svgRef = useRef(null);
  const timeoutRef = useRef(null);
  const rafRef = useRef(null);
  const runningRef = useRef(false);

  const [x, setX] = useState(INITIAL_X);
  const [lr, setLr] = useState(0.1);
  const [steps, setSteps] = useState(0);
  const [trail, setTrail] = useState([INITIAL_X]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);

  const curvePath = useMemo(() => buildCurvePath(), []);
  const fillPath = useMemo(() => buildFillPath(curvePath), [curvePath]);

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

  const doStep = useCallback((fromX) => {
    const g = fprime(fromX);
    let nx = fromX - lr * g;
    if (nx < X_MIN) nx = X_MIN;
    if (nx > X_MAX) nx = X_MAX;
    setX(nx);
    setSteps((s) => s + 1);
    setTrail((t) => {
      const next = [...t, nx];
      if (next.length > TRAIL_LIMIT) next.splice(0, next.length - TRAIL_LIMIT);
      return next;
    });
    return nx;
  }, [lr]);

  const handleStep = useCallback(() => {
    if (runningRef.current) return;
    doStep(x);
  }, [doStep, x]);

  const handleRun = useCallback(() => {
    if (runningRef.current) {
      stopRun();
      return;
    }
    runningRef.current = true;
    setRunning(true);
    let current = x;
    let count = 0;
    const tick = () => {
      if (!runningRef.current) return;
      current = doStep(current);
      count += 1;
      if (count >= MAX_STEPS) {
        stopRun();
        return;
      }
      timeoutRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, STEP_DELAY);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [doStep, stopRun, x]);

  const handleReset = useCallback(() => {
    stopRun();
    setX(INITIAL_X);
    setSteps(0);
    setTrail([INITIAL_X]);
  }, [stopRun]);

  const handleMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const sx = (clientX - rect.left) * (W / rect.width);
    let nx = pxToX(sx);
    if (nx < X_MIN) nx = X_MIN;
    if (nx > X_MAX) nx = X_MAX;
    setX(nx);
    setTrail((t) => {
      const last = t[t.length - 1];
      if (last !== undefined && Math.abs(last - nx) < 0.02) return t;
      const next = [...t, nx];
      if (next.length > TRAIL_LIMIT) next.splice(0, next.length - TRAIL_LIMIT);
      return next;
    });
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, handleMove]);

  const handleSvgDown = useCallback((e) => {
    if (runningRef.current) return;
    if (!svgRef.current) return;
    e.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const sx = (clientX - rect.left) * (W / rect.width);
    let nx = pxToX(sx);
    if (nx < X_MIN) nx = X_MIN;
    if (nx > X_MAX) nx = X_MAX;
    setX(nx);
    setSteps(0);
    setTrail([nx]);
    setDragging(true);
  }, []);

  const fx = f(x);
  const gx = fprime(x);

  const ballPx = xToPx(x);
  const ballPy = yToPx(fx);

  // Tangent line: y = f(x) + g*(t - x). Pick small horizontal span centered on x.
  const tSpan = 0.9;
  const tx1 = Math.max(X_MIN, x - tSpan);
  const tx2 = Math.min(X_MAX, x + tSpan);
  const ty1 = fx + gx * (tx1 - x);
  const ty2 = fx + gx * (tx2 - x);
  const tan1 = { px: xToPx(tx1), py: yToPx(ty1) };
  const tan2 = { px: xToPx(tx2), py: yToPx(ty2) };

  // Gradient arrow: shows -lr * g along x axis from ball.
  const stepDx = -lr * gx;
  const arrowEndX = Math.max(X_MIN, Math.min(X_MAX, x + stepDx));
  const arrowStartPx = ballPx;
  const arrowStartPy = yToPx(Y_MIN) - 18;
  const arrowEndPx = xToPx(arrowEndX);
  const arrowLen = arrowEndPx - arrowStartPx;
  const showArrow = Math.abs(arrowLen) > 2;

  // Ticks on x axis
  const xTicks = [-2, -1, 0, 1, 2, 3, 4];

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          onMouseDown={handleSvgDown}
          onTouchStart={handleSvgDown}
        >
          <defs>
            <linearGradient id="gd-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* axis lines */}
          <line x1={PAD_L} y1={yToPx(Y_MIN)} x2={W - PAD_R} y2={yToPx(Y_MIN)} stroke="var(--border)" strokeWidth="1" />
          <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={yToPx(Y_MIN)} stroke="var(--border)" strokeWidth="1" />

          {/* x ticks */}
          {xTicks.map((tx) => {
            const px = xToPx(tx);
            return (
              <g key={`xt${tx}`}>
                <line x1={px} y1={yToPx(Y_MIN)} x2={px} y2={yToPx(Y_MIN) + 4} stroke="var(--border)" strokeWidth="1" />
                <text
                  x={px}
                  y={yToPx(Y_MIN) + 16}
                  fontSize="10"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono, monospace)"
                  textAnchor="middle"
                >
                  {tx}
                </text>
              </g>
            );
          })}

          {/* axis labels */}
          <text
            x={W - PAD_R}
            y={yToPx(Y_MIN) + 26}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            x
          </text>
          <text
            x={PAD_L - 6}
            y={PAD_T + 4}
            fontSize="11"
            fill="var(--text-dim)"
            fontFamily="var(--serif, serif)"
            fontStyle="italic"
            textAnchor="end"
          >
            f(x)
          </text>

          {/* loss curve fill + stroke */}
          <path d={fillPath} fill="url(#gd-fill)" />
          <path
            d={curvePath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* trail dots */}
          {trail.slice(0, -1).map((tx, i) => {
            const age = trail.length - 1 - i;
            const op = Math.max(0.08, 0.55 - age * 0.04);
            return (
              <circle
                key={`tr${i}`}
                cx={xToPx(tx)}
                cy={yToPx(f(tx))}
                r={2.5}
                fill="var(--hue-pink, #ff66cc)"
                opacity={op}
              />
            );
          })}

          {/* tangent line */}
          <line
            x1={tan1.px}
            y1={tan1.py}
            x2={tan2.px}
            y2={tan2.py}
            stroke="var(--hue-sky, #5ecbff)"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            opacity="0.9"
          />

          {/* vertical guide to x axis */}
          <line
            x1={ballPx}
            y1={ballPy}
            x2={ballPx}
            y2={yToPx(Y_MIN)}
            stroke="var(--text-dim)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.6"
          />

          {/* gradient-step arrow below axis */}
          {showArrow && (
            <g>
              <line
                x1={arrowStartPx}
                y1={arrowStartPy}
                x2={arrowEndPx}
                y2={arrowStartPy}
                stroke="var(--hue-mint, var(--accent))"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polygon
                points={(() => {
                  const dir = arrowLen >= 0 ? 1 : -1;
                  const tipX = arrowEndPx;
                  const tipY = arrowStartPy;
                  const head = 6;
                  return `${tipX},${tipY} ${tipX - dir * head},${tipY - 4} ${tipX - dir * head},${tipY + 4}`;
                })()}
                fill="var(--hue-mint, var(--accent))"
              />
            </g>
          )}

          {/* ball */}
          <circle
            cx={ballPx}
            cy={ballPy}
            r={12}
            fill="var(--accent)"
            opacity="0.18"
          />
          <circle
            cx={ballPx}
            cy={ballPy}
            r={6}
            fill="var(--accent)"
            stroke="var(--bg)"
            strokeWidth="2"
            style={{ cursor: running ? 'default' : 'grab' }}
          />

          {/* x label under ball */}
          <text
            x={ballPx}
            y={yToPx(Y_MIN) + 28}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            fontWeight="700"
          >
            x = {snap(x, 2)}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>x</span>
          <span className="mlviz-val">{snap(x, 3)}</span>
          <span className="mlviz-sub">f(x) = {snap(fx, 3)}</span>
          <span className="mlviz-sub">f'(x) = {snap(gx, 3)}</span>
          <span className="mlviz-sub">step {steps}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">learning rate</span>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
              disabled={running}
            />
            <span className="mlviz-slider-val">{snap(lr, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleStep}
            disabled={running}
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
            <span>{running ? 'Stop' : 'Run 30'}</span>
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

        <div className="mlviz-hint">drag the ball or click on the curve</div>
      </div>
    </div>
  );
}
