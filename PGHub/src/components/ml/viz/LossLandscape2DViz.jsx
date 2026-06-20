import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Target, Activity } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * LossLandscape2DViz
 *
 * Renders contours of the Rosenbrock function f(x, y) = (1 - x)^2 + 20 * (y - x^2)^2
 * over [-2, 2] x [-1, 3]. Click anywhere on the plot to drop a ball; it runs gradient
 * descent with momentum starting from the click point.
 *
 * Sliders: learning rate, momentum. Live readouts: current loss, |∇f|, step count.
 * Reset clears the trajectory.
 */

const W = 720;
const H = 360;
const PAD_X = 18;
const PANEL_TOP = 28;
const PANEL_H = H - PANEL_TOP - 56;

const X_MIN = -2;
const X_MAX = 2;
const Y_MIN = -1;
const Y_MAX = 3;

// Rosenbrock with a milder coefficient so descent visibly progresses
const A = 1;
const B = 20;

// contour levels (geometric)
const CONTOUR_LEVELS = [0.5, 2, 6, 15, 35, 80, 180, 400];
const GRID_RES = 56; // marching-squares grid resolution

const STEP_MS = 90;
const MAX_STEPS = 240;
const CONVERGE_EPS = 1e-3;

function f(x, y) {
  return (A - x) * (A - x) + B * (y - x * x) * (y - x * x);
}
function grad(x, y) {
  const dx = -2 * (A - x) + B * 2 * (y - x * x) * (-2 * x);
  const dy = B * 2 * (y - x * x);
  return [dx, dy];
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

// Marching squares: return SVG path 'd' for a single iso level
function marchingSquaresPath(values, level, gx, gy, mapX, mapY) {
  // values: 2D array values[i][j] where i runs over y (rows), j runs over x (cols)
  const cols = values[0].length;
  const rows = values.length;
  const segs = [];
  for (let i = 0; i < rows - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const v0 = values[i][j];
      const v1 = values[i][j + 1];
      const v2 = values[i + 1][j + 1];
      const v3 = values[i + 1][j];
      const idx = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) | (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      const lerp = (a, b) => (level - a) / (b - a);
      const x0 = gx[j];
      const x1 = gx[j + 1];
      const y0 = gy[i];
      const y1 = gy[i + 1];
      const top = () => [x0 + (x1 - x0) * lerp(v0, v1), y0];
      const right = () => [x1, y0 + (y1 - y0) * lerp(v1, v2)];
      const bottom = () => [x0 + (x1 - x0) * lerp(v3, v2), y1];
      const left = () => [x0, y0 + (y1 - y0) * lerp(v0, v3)];
      let p1;
      let p2;
      switch (idx) {
        case 1:
        case 14: p1 = top(); p2 = left(); break;
        case 2:
        case 13: p1 = top(); p2 = right(); break;
        case 3:
        case 12: p1 = left(); p2 = right(); break;
        case 4:
        case 11: p1 = right(); p2 = bottom(); break;
        case 6:
        case 9: p1 = top(); p2 = bottom(); break;
        case 7:
        case 8: p1 = left(); p2 = bottom(); break;
        case 5: p1 = top(); p2 = left(); segs.push([p1, p2]); p1 = right(); p2 = bottom(); break;
        case 10: p1 = top(); p2 = right(); segs.push([p1, p2]); p1 = left(); p2 = bottom(); break;
        default: continue;
      }
      segs.push([p1, p2]);
    }
  }
  // we draw each seg as M..L (cheap; clean lines without polyline assembly)
  let d = '';
  for (const [a, b] of segs) {
    d += `M ${mapX(a[0]).toFixed(2)} ${mapY(a[1]).toFixed(2)} L ${mapX(b[0]).toFixed(2)} ${mapY(b[1]).toFixed(2)} `;
  }
  return d;
}

export default function LossLandscape2DViz() {
  const [lr, setLr] = useState(0.012);
  const [momentum, setMomentum] = useState(0.85);
  const [trajectory, setTrajectory] = useState([]); // [{x, y, loss}]
  const [velocity, setVelocity] = useState([0, 0]);
  const [isRunningRaw, setIsRunningRaw] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  const last = trajectory[trajectory.length - 1];
  const curLoss = last ? last.loss : null;
  const [gx, gy] = last ? grad(last.x, last.y) : [0, 0];
  const gradNorm = Math.sqrt(gx * gx + gy * gy);

  const isConverged = trajectory.length > 1 && gradNorm < CONVERGE_EPS;
  const stepCount = trajectory.length === 0 ? 0 : trajectory.length - 1;
  const isRunning = isRunningRaw && trajectory.length > 0 && !isConverged && stepCount < MAX_STEPS;

  // viewport mapping
  const plotL = PAD_X + 12;
  const plotR = W - PAD_X - 12;
  const plotT = PANEL_TOP + 8;
  const plotB = PANEL_TOP + PANEL_H - 18;
  const plotW = plotR - plotL;
  const plotH = plotB - plotT;
  const mapX = useCallback((vx) => plotL + ((vx - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotL, plotW]);
  const mapY = useCallback((vy) => plotB - ((vy - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotB, plotH]);
  const invMapX = useCallback((sx) => X_MIN + ((sx - plotL) / plotW) * (X_MAX - X_MIN), [plotL, plotW]);
  const invMapY = useCallback((sy) => Y_MIN + ((plotB - sy) / plotH) * (Y_MAX - Y_MIN), [plotB, plotH]);

  // pre-compute contour grid + paths (depends only on plot mapping)
  const contourPaths = useMemo(() => {
    const gxArr = [];
    const gyArr = [];
    const values = [];
    for (let j = 0; j < GRID_RES; j++) gxArr.push(X_MIN + (j / (GRID_RES - 1)) * (X_MAX - X_MIN));
    for (let i = 0; i < GRID_RES; i++) gyArr.push(Y_MIN + (i / (GRID_RES - 1)) * (Y_MAX - Y_MIN));
    for (let i = 0; i < GRID_RES; i++) {
      const row = [];
      for (let j = 0; j < GRID_RES; j++) row.push(f(gxArr[j], gyArr[i]));
      values.push(row);
    }
    return CONTOUR_LEVELS.map((lvl) => ({
      level: lvl,
      d: marchingSquaresPath(values, lvl, gxArr, gyArr, mapX, mapY),
    }));
  }, [mapX, mapY]);

  // gradient-descent w/ momentum step
  const doStep = useCallback(() => {
    setTrajectory((prev) => {
      if (prev.length === 0) return prev;
      const { x, y } = prev[prev.length - 1];
      const [dgx, dgy] = grad(x, y);
      let [vx, vy] = velocity;
      vx = momentum * vx - lr * dgx;
      vy = momentum * vy - lr * dgy;
      let nx = x + vx;
      let ny = y + vy;
      // clamp to plot
      nx = Math.max(X_MIN, Math.min(X_MAX, nx));
      ny = Math.max(Y_MIN, Math.min(Y_MAX, ny));
      setVelocity([vx, vy]);
      return [...prev, { x: nx, y: ny, loss: f(nx, ny) }];
    });
  }, [lr, momentum, velocity]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    const ms = reducedMotion ? 30 : STEP_MS;
    timerRef.current = setInterval(() => {
      doStep();
    }, ms);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, reducedMotion, doStep]);

  const handleSvgClick = useCallback((e) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const local = pt.matrixTransform(inv);
    if (local.x < plotL || local.x > plotR || local.y < plotT || local.y > plotB) return;
    const x = invMapX(local.x);
    const y = invMapY(local.y);
    setTrajectory([{ x, y, loss: f(x, y) }]);
    setVelocity([0, 0]);
    setIsRunningRaw(true);
  }, [plotL, plotR, plotT, plotB, invMapX, invMapY]);

  const handleReset = useCallback(() => {
    setIsRunningRaw(false);
    setTrajectory([]);
    setVelocity([0, 0]);
  }, []);

  const handleToggle = useCallback(() => {
    if (trajectory.length === 0) return;
    if (isConverged || stepCount >= MAX_STEPS) {
      // restart from same point
      const start = trajectory[0];
      setTrajectory([start]);
      setVelocity([0, 0]);
      setIsRunningRaw(true);
      return;
    }
    setIsRunningRaw((r) => !r);
  }, [trajectory, isConverged, stepCount]);

  const trajPath = useMemo(() => {
    if (trajectory.length === 0) return '';
    let d = `M ${mapX(trajectory[0].x).toFixed(2)} ${mapY(trajectory[0].y).toFixed(2)}`;
    for (let i = 1; i < trajectory.length; i++) {
      d += ` L ${mapX(trajectory[i].x).toFixed(2)} ${mapY(trajectory[i].y).toFixed(2)}`;
    }
    return d;
  }, [trajectory, mapX, mapY]);

  const transition = reducedMotion ? 'none' : 'cx 0.08s linear, cy 0.08s linear';

  const formulaHtml = useMemo(
    () => katexHtml('v \\leftarrow \\mu v - \\eta \\nabla f(\\theta),\\;\\; \\theta \\leftarrow \\theta + v'),
    []
  );
  const lossHtml = useMemo(() => katexHtml('f(x, y) = (1-x)^2 + 20\\,(y - x^2)^2'), []);

  const status = trajectory.length === 0
    ? 'click anywhere to drop a ball'
    : isConverged
      ? 'converged'
      : stepCount >= MAX_STEPS
        ? 'max steps'
        : isRunning ? 'descending…' : 'paused';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto', cursor: 'crosshair' }}
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSvgClick}
        >
          {/* plot frame */}
          <rect
            x={plotL - 6}
            y={plotT - 6}
            width={plotW + 12}
            height={plotH + 12}
            rx={8}
            fill="var(--bg)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.55"
          />

          {/* contour lines */}
          {contourPaths.map((c, i) => {
            const t = i / (contourPaths.length - 1);
            return (
              <path
                key={c.level}
                d={c.d}
                stroke="var(--hue-sky)"
                strokeWidth={0.8 + (1 - t) * 0.6}
                fill="none"
                opacity={0.18 + (1 - t) * 0.45}
              />
            );
          })}

          {/* marker for the global minimum at (1, 1) */}
          <g>
            <circle cx={mapX(1)} cy={mapY(1)} r={5.5} fill="none" stroke="var(--accent)" strokeWidth="1.4" />
            <circle cx={mapX(1)} cy={mapY(1)} r={2.2} fill="var(--accent)" />
            <text
              x={mapX(1) + 9}
              y={mapY(1) + 3}
              fontSize="9"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              letterSpacing="0.06em"
              fontWeight="700"
            >
              (1, 1)
            </text>
          </g>

          {/* trajectory polyline */}
          {trajPath && (
            <path
              d={trajPath}
              stroke="var(--hue-pink)"
              strokeWidth="1.6"
              fill="none"
              opacity="0.85"
            />
          )}

          {/* trajectory waypoints (lightweight) */}
          {trajectory.length > 0 && trajectory.filter((_, i) => i % 4 === 0).map((p, i) => (
            <circle
              key={`wp-${i}`}
              cx={mapX(p.x)}
              cy={mapY(p.y)}
              r={1.4}
              fill="var(--hue-pink)"
              opacity="0.55"
            />
          ))}

          {/* current ball */}
          {last && (
            <g>
              <circle
                cx={mapX(last.x)}
                cy={mapY(last.y)}
                r={6}
                fill="var(--hue-pink)"
                opacity="0.95"
                style={{ transition }}
              />
              <circle
                cx={mapX(last.x)}
                cy={mapY(last.y)}
                r={9}
                fill="none"
                stroke="var(--hue-pink)"
                strokeWidth="1"
                opacity="0.35"
                style={{ transition }}
              />
            </g>
          )}

          {/* heading */}
          <text
            x={plotL}
            y={PANEL_TOP - 10}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            ROSENBROCK · curved banana valley
          </text>
          <text
            x={plotR}
            y={PANEL_TOP - 10}
            fontSize="10"
            fill="var(--accent)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
            textAnchor="end"
            fontWeight="700"
          >
            {status}
          </text>

          {/* axis labels */}
          <text x={plotR - 2} y={mapY(0) - 4} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">x</text>
          <text x={mapX(0) + 4} y={plotT + 10} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">y</text>
          <line x1={plotL} y1={mapY(0)} x2={plotR} y2={mapY(0)} stroke="var(--border)" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.7" />
          <line x1={mapX(0)} y1={plotT} x2={mapX(0)} y2={plotB} stroke="var(--border)" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.7" />

          <text
            x={W / 2}
            y={H - 8}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.08em"
          >
            click anywhere to drop a ball · valley follows y = x² toward minimum at (1, 1)
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Target size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              learning rate η
            </span>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.001"
              value={lr}
              onChange={(e) => setLr(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{lr.toFixed(3)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Activity size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              momentum μ
            </span>
            <input
              type="range"
              min="0"
              max="0.99"
              step="0.01"
              value={momentum}
              onChange={(e) => setMomentum(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{momentum.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>loss</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-pink)', fontWeight: 800 }}>
              {curLoss === null ? '—' : curLoss.toFixed(4)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>|∇f|</span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>
              {trajectory.length === 0 ? '—' : gradNorm.toFixed(4)}
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>steps</span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {stepCount}{isConverged ? ' (converged)' : ''}
            </span>
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: lossHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className={`mlviz-btn ${isRunning ? '' : 'mlviz-btn-primary'}`}
            onClick={handleToggle}
            disabled={trajectory.length === 0}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause' : (isConverged || stepCount >= MAX_STEPS) ? 'Restart' : 'Resume'}</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={handleReset} disabled={trajectory.length === 0}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {trajectory.length === 0 ? 'click the plot to start' : `${stepCount} / ${MAX_STEPS} steps`}
          </span>
        </div>

        <div className="mlviz-hint">
          high η → overshoots the valley wall · high μ → glides past the minimum and oscillates back
        </div>
      </div>
    </div>
  );
}
