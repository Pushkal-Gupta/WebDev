import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TrendingDown, RotateCcw, Play } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 340;
const LEFT = 46;
const RIGHT = 18;
const TOP = 22;
const BOT = 34;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

const X_MIN = -5;
const X_MAX = 5;
const SAMPLES = 180;

// Loss: a smooth double-well so descent has somewhere to roll and a place to
// diverge from. L(x) = 0.08 x^4 - 0.6 x^2 + 0.5 x + 2  (one global, one local min).
function loss(x) {
  return 0.08 * x * x * x * x - 0.6 * x * x + 0.5 * x + 2;
}
function dLoss(x) {
  return 0.32 * x * x * x - 1.2 * x + 0.5;
}

const Y_MIN = 0;
const Y_MAX = 6.5;

const DEFAULT_X = -3.4;
const DEFAULT_LR = 0.08;
const TRAIL_MAX = 26;

function fmt(v, p = 4) {
  if (!Number.isFinite(v)) return '—';
  if (Math.abs(v) > 1e6) return v > 0 ? '∞' : '−∞';
  return v.toFixed(p);
}

export default function LossDescentExplorerViz({ lr = DEFAULT_LR, start = DEFAULT_X }) {
  const initLr = Number.isFinite(lr) ? lr : DEFAULT_LR;
  const initX = Number.isFinite(start) ? start : DEFAULT_X;

  const [px, setPx] = useState(initX);
  const [rate, setRate] = useState(initLr);
  const [trail, setTrail] = useState([]);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState(0);

  const svgRef = useRef(null);
  const dragRef = useRef(false);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const sx = useCallback(
    (x) => LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W,
    []
  );
  const sy = useCallback(
    (y) => TOP + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H,
    []
  );

  const { fPath, fArea } = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + (i / SAMPLES) * (X_MAX - X_MIN);
      const yc = Math.max(Y_MIN, Math.min(Y_MAX, loss(x)));
      pts.push(`${sx(x).toFixed(2)},${sy(yc).toFixed(2)}`);
    }
    const line = 'M' + pts.join(' L');
    const area =
      `M${sx(X_MIN).toFixed(2)},${sy(Y_MIN).toFixed(2)} L` +
      pts.join(' L') +
      ` L${sx(X_MAX).toFixed(2)},${sy(Y_MIN).toFixed(2)} Z`;
    return { fPath: line, fArea: area };
  }, [sx, sy]);

  const fval = loss(px);
  const dval = dLoss(px);
  const diverged = Math.abs(px) > X_MAX + 0.5 || !Number.isFinite(fval);

  const pxClamped = Math.max(X_MIN, Math.min(X_MAX, px));
  const pyVal = Math.max(Y_MIN, Math.min(Y_MAX, loss(pxClamped)));
  const pxScr = sx(pxClamped);
  const pyScr = sy(pyVal);

  // one gradient-descent step; returns false when it should auto-stop
  const stepOnce = useCallback(() => {
    let keepGoing = true;
    setPx((cur) => {
      if (Math.abs(cur) > 1e4 || !Number.isFinite(cur)) {
        keepGoing = false;
        return cur;
      }
      const g = dLoss(cur);
      const next = cur - rate * g;
      setTrail((t) => {
        const nt = [...t, cur];
        return nt.length > TRAIL_MAX ? nt.slice(nt.length - TRAIL_MAX) : nt;
      });
      setSteps((s) => {
        if (Math.abs(g) < 0.004 && s > 3) keepGoing = false;
        return s + 1;
      });
      return next;
    });
    return keepGoing;
  }, [rate]);

  // animation loop
  useEffect(() => {
    if (!running) return undefined;
    let stopped = false;
    const tick = (ts) => {
      if (stopped) return;
      const gap = reducedMotion ? 220 : 90;
      if (ts - lastTickRef.current >= gap) {
        lastTickRef.current = ts;
        if (!stepOnce()) {
          stopped = true;
          setRunning(false);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [running, stepOnce, reducedMotion]);

  const updateFromClientX = useCallback(
    (clientX) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const svgX = ratio * W;
      let xVal = X_MIN + ((svgX - LEFT) / PLOT_W) * (X_MAX - X_MIN);
      xVal = Math.max(X_MIN, Math.min(X_MAX, xVal));
      setPx(Math.round(xVal * 100) / 100);
    },
    []
  );

  const onPointerDown = useCallback(
    (e) => {
      setRunning(false);
      setTrail([]);
      setSteps(0);
      dragRef.current = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;
      updateFromClientX(e.clientX);
    },
    [updateFromClientX]
  );
  const onPointerUp = useCallback((e) => {
    dragRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setPx(initX);
    setRate(initLr);
    setTrail([]);
    setSteps(0);
  }, [initX, initLr]);

  const toggleRun = useCallback(() => {
    if (running) {
      setRunning(false);
      return;
    }
    if (diverged) {
      setPx(initX);
      setTrail([]);
      setSteps(0);
    }
    lastTickRef.current = 0;
    setRunning(true);
  }, [running, diverged, initX]);

  const pointTransition = reducedMotion
    ? 'none'
    : 'cx 0.08s ease-out, cy 0.08s ease-out';

  const xTicks = [-4, -2, 0, 2, 4];
  const yBase = sy(Y_MIN);

  // tangent segment at the point
  const tanHalf = 1.1;
  const tx1 = Math.max(X_MIN, pxClamped - tanHalf);
  const tx2 = Math.min(X_MAX, pxClamped + tanHalf);
  const tyy1 = pyVal + dval * (tx1 - pxClamped);
  const tyy2 = pyVal + dval * (tx2 - pxClamped);

  // step-size arrow on the x-axis (visual magnitude of the next update)
  const nextX = pxClamped - rate * dval;
  const arrowEndX = sx(Math.max(X_MIN, Math.min(X_MAX, nextX)));

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <TrendingDown size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Loss descent explorer</span>
          <span className="aev-head-sub">
            drag the ball to a start point, press Step — watch it roll downhill (or diverge)
          </span>
        </span>
        <span className="aev-chip">
          {diverged ? 'diverged' : `step ${steps}`}
        </span>
      </div>

      <div className="aev-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              <linearGradient id="lde-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--hue-violet)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
              <linearGradient id="lde-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.16)" />
                <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0)" />
              </linearGradient>
              <filter id="lde-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* grid + x ticks */}
            {xTicks.map((t) => (
              <g key={`xt-${t}`}>
                <line
                  x1={sx(t)}
                  y1={TOP}
                  x2={sx(t)}
                  y2={TOP + PLOT_H}
                  stroke="var(--border)"
                  strokeWidth="0.4"
                  opacity="0.5"
                />
                <text
                  x={sx(t)}
                  y={TOP + PLOT_H + 14}
                  fontSize="8"
                  fill="var(--text-dim)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                >
                  {t}
                </text>
              </g>
            ))}

            {/* baseline axis */}
            <line
              x1={LEFT}
              y1={yBase}
              x2={LEFT + PLOT_W}
              y2={yBase}
              stroke="var(--border)"
              strokeWidth="1"
            />

            {/* area fill under loss */}
            <path d={fArea} fill="url(#lde-fill)" />

            {/* glow under loss curve */}
            <path
              d={fPath}
              fill="none"
              stroke="url(#lde-grad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lde-glow)"
              opacity="0.55"
            />
            {/* main loss curve */}
            <path
              d={fPath}
              fill="none"
              stroke="url(#lde-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* fading trail of previous positions */}
            {trail.map((tx, i) => {
              const cx = sx(Math.max(X_MIN, Math.min(X_MAX, tx)));
              const cy = sy(Math.max(Y_MIN, Math.min(Y_MAX, loss(tx))));
              const op = ((i + 1) / trail.length) * 0.5;
              return (
                <circle
                  key={`tr-${i}`}
                  cx={cx}
                  cy={cy}
                  r="3"
                  fill="var(--hue-mint)"
                  opacity={op}
                />
              );
            })}

            {/* tangent (slope) at the ball */}
            <line
              x1={sx(tx1)}
              y1={sy(Math.max(Y_MIN, Math.min(Y_MAX, tyy1)))}
              x2={sx(tx2)}
              y2={sy(Math.max(Y_MIN, Math.min(Y_MAX, tyy2)))}
              stroke="var(--hue-mint)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* step-size arrow along the axis */}
            <line
              x1={pxScr}
              y1={yBase}
              x2={arrowEndX}
              y2={yBase}
              stroke="var(--warning)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx={arrowEndX} cy={yBase} r="2.4" fill="var(--warning)" />

            {/* vertical guide */}
            <line
              x1={pxScr}
              y1={pyScr}
              x2={pxScr}
              y2={yBase}
              stroke="var(--accent)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.6"
            />

            {/* the rolling ball: halo + ring + core */}
            <circle
              cx={pxScr}
              cy={pyScr}
              r="12"
              fill="rgba(var(--accent-rgb), 0.16)"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={pxScr}
              cy={pyScr}
              r="7"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.4"
              opacity="0.7"
              style={{ transition: pointTransition }}
            />
            <circle
              cx={pxScr}
              cy={pyScr}
              r="4.2"
              fill="var(--accent)"
              style={{ transition: pointTransition, cursor: 'grab' }}
            />

            {/* y labels */}
            <text
              x={LEFT - 8}
              y={TOP + 4}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {fmt(Y_MAX, 1)}
            </text>
            <text
              x={LEFT - 8}
              y={yBase}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {fmt(Y_MIN, 1)}
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">position x</span>
            <span className="mlviz-statcard-val">{fmt(px, 3)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">loss f(x)</span>
            <span className="mlviz-statcard-val">{fmt(fval, 3)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">gradient f′(x)</span>
            <span className="mlviz-statcard-val">{fmt(dval, 3)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">step size</span>
            <span className="mlviz-statcard-val">{fmt(rate * dval, 3)}</span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">learning rate η</span>
          <input
            type="range"
            min="0.01"
            max="0.55"
            step="0.005"
            value={rate}
            onChange={(e) => {
              setRunning(false);
              setRate(parseFloat(e.target.value));
            }}
          />
          <span className="mlviz-slider-val">{fmt(rate, 3)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={toggleRun}>
            <Play size={13} />
            <span>{running ? 'Pause' : 'Step ▶'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          {rate > 0.34
            ? 'η too large — the ball overshoots the valley and the iterates diverge'
            : 'small η crawls but converges · the orange tick shows the next update length'}
        </div>
      </div>
    </div>
  );
}
