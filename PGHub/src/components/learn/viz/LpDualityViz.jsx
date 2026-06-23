import { useId, useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, StepForward, Scale, Target } from 'lucide-react';
import './LpDualityViz.css';

const km = (expr, display = false) =>
  katex.renderToString(expr, { throwOnError: false, displayMode: display });

// Primal (maximize):  max 3x + 2y
//   x +  y <= 4
//   x + 3y <= 6
//   x, y >= 0
// Dual (minimize):    min 4u + 6v
//   u +  v >= 3
//   u + 3v >= 2
//   u, v >= 0
// Strong duality: both optima equal 12 at primal (4,0), dual (3,0).

const VERTICES = [
  { x: 0, y: 0, label: '(0, 0)' },
  { x: 4, y: 0, label: '(4, 0)' },
  { x: 3, y: 1, label: '(3, 1)' },
  { x: 0, y: 2, label: '(0, 2)' },
];

const obj = (x, y) => 3 * x + 2 * y;

// Order vertices by ascending objective so "Step" walks toward the optimum.
const ORDER = [...VERTICES].sort((a, b) => obj(a.x, a.y) - obj(b.x, b.y));

// Dual point that certifies each primal objective level (weak duality companion).
// We only show the dual optimum once the primal reaches its optimum vertex.
const DUAL_OPT = { u: 3, v: 0, value: 4 * 3 + 6 * 0 };

export default function LpDualityViz() {
  const uid = useId().replace(/:/g, '');
  const [idx, setIdx] = useState(0);

  const current = ORDER[idx];
  const primalValue = obj(current.x, current.y);
  const atOptimum = idx === ORDER.length - 1;
  const dualValue = atOptimum ? DUAL_OPT.value : null;
  const gap = atOptimum ? DUAL_OPT.value - primalValue : null;

  const step = () => setIdx((i) => Math.min(i + 1, ORDER.length - 1));
  const reset = () => setIdx(0);

  // SVG geometry — feasible polygon in the x-y plane.
  const W = 480;
  const H = 380;
  const padL = 48;
  const padB = 44;
  const padT = 22;
  const padR = 22;
  const xMax = 5;
  const yMax = 5;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const sx = (x) => padL + (x / xMax) * plotW;
  const sy = (y) => padT + plotH - (y / yMax) * plotH;

  const polygon = useMemo(() => {
    // feasible vertices in CCW order for a clean fill
    const ccw = [VERTICES[0], VERTICES[1], VERTICES[2], VERTICES[3]];
    return ccw.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Objective line 3x + 2y = c passing through the current vertex.
  // Solve for two endpoints clipped to the plot box.
  const objLine = useMemo(() => {
    const c = primalValue;
    // points where line meets x-axis (y=0) and y-axis (x=0), then clip span
    const pts = [];
    const yAtX = (x) => (c - 3 * x) / 2;
    const xAtY = (y) => (c - 2 * y) / 3;
    const cand = [
      { x: 0, y: yAtX(0) },
      { x: xMax, y: yAtX(xMax) },
      { x: xAtY(0), y: 0 },
      { x: xAtY(yMax), y: yMax },
    ].filter((p) => p.x >= -0.001 && p.x <= xMax + 0.001 && p.y >= -0.001 && p.y <= yMax + 0.001);
    if (cand.length >= 2) {
      pts.push(cand[0], cand[cand.length - 1]);
    }
    return pts;
  }, [primalValue]);

  const gridTicks = [1, 2, 3, 4, 5];

  return (
    <div className="lpd">
      <div className="lpd-head">
        <h3 className="lpd-title">LP duality — the objective line slides to the optimal corner</h3>
        <p className="lpd-sub">
          Step the maximize-objective across the feasible polygon. At the optimal vertex the dual minimum meets it
          exactly: strong duality gives{' '}
          <span dangerouslySetInnerHTML={{ __html: km('\\text{gap} = 0') }} />.
        </p>
      </div>

      <div className="lpd-controls">
        <span className="lpd-progress-label">
          vertex {idx + 1} / {ORDER.length} · {current.label}
        </span>
        <span className="lpd-spacer" aria-hidden="true" />
        <button type="button" className="lpd-btn lpd-btn-primary" onClick={step} disabled={atOptimum}>
          <StepForward size={14} /> {atOptimum ? 'At optimum' : 'Slide up'}
        </button>
        <button type="button" className="lpd-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="lpd-body">
        <div className="lpd-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="lpd-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.28)" />
                <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.08)" />
              </linearGradient>
            </defs>

            {/* grid */}
            {gridTicks.map((t) => (
              <g key={`gx-${t}`}>
                <line className="lpd-grid" x1={sx(t)} y1={padT} x2={sx(t)} y2={padT + plotH} />
                <text className="lpd-tick" x={sx(t)} y={padT + plotH + 16}>
                  {t}
                </text>
              </g>
            ))}
            {gridTicks.map((t) => (
              <g key={`gy-${t}`}>
                <line className="lpd-grid" x1={padL} y1={sy(t)} x2={padL + plotW} y2={sy(t)} />
                <text className="lpd-tick lpd-tick-y" x={padL - 8} y={sy(t) + 4}>
                  {t}
                </text>
              </g>
            ))}

            {/* axes */}
            <line className="lpd-axis" x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} />
            <line className="lpd-axis" x1={padL} y1={padT} x2={padL} y2={padT + plotH} />
            <text className="lpd-axis-label" x={padL + plotW} y={padT + plotH + 30}>x</text>
            <text className="lpd-axis-label" x={padL - 30} y={padT + 6}>y</text>

            {/* feasible region */}
            <polygon className="lpd-feasible" points={polygon} fill={`url(#${uid}-fill)`} />

            {/* objective line through current vertex */}
            {objLine.length === 2 && (
              <line
                className="lpd-obj-line"
                x1={sx(objLine[0].x)}
                y1={sy(objLine[0].y)}
                x2={sx(objLine[1].x)}
                y2={sy(objLine[1].y)}
              />
            )}

            {/* vertices */}
            {VERTICES.map((p) => {
              const isCur = p.x === current.x && p.y === current.y;
              const isOpt = atOptimum && p.x === 4 && p.y === 0;
              return (
                <g key={p.label}>
                  <circle
                    className={`lpd-vertex ${isCur ? 'is-current' : ''} ${isOpt ? 'is-optimum' : ''}`}
                    cx={sx(p.x)}
                    cy={sy(p.y)}
                    r={isCur ? 7 : 4.5}
                  />
                  {isCur && (
                    <text className="lpd-vertex-val" x={sx(p.x) + 10} y={sy(p.y) - 8}>
                      {obj(p.x, p.y)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="lpd-formulas">
          <div className="lpd-formula-card is-primal">
            <span className="lpd-formula-tag">primal · maximize</span>
            <span
              dangerouslySetInnerHTML={{
                __html: km(
                  '\\begin{aligned} \\max\\;& 3x + 2y \\\\ \\text{s.t.}\\;& x + y \\le 4 \\\\ & x + 3y \\le 6 \\\\ & x, y \\ge 0 \\end{aligned}',
                  true
                ),
              }}
            />
          </div>
          <div className="lpd-formula-card is-dual">
            <span className="lpd-formula-tag">dual · minimize</span>
            <span
              dangerouslySetInnerHTML={{
                __html: km(
                  '\\begin{aligned} \\min\\;& 4u + 6v \\\\ \\text{s.t.}\\;& u + v \\ge 3 \\\\ & u + 3v \\ge 2 \\\\ & u, v \\ge 0 \\end{aligned}',
                  true
                ),
              }}
            />
          </div>
        </div>
      </div>

      <div className="lpd-metrics">
        <div className="lpd-metric">
          <span className="lpd-metric-label">primal value</span>
          <span className="lpd-metric-value is-primal">{primalValue}</span>
        </div>
        <div className="lpd-metric">
          <span className="lpd-metric-label">dual value</span>
          <span className="lpd-metric-value is-dual">{dualValue == null ? '—' : dualValue}</span>
        </div>
        <div className="lpd-metric">
          <span className="lpd-metric-label">duality gap</span>
          <span className={`lpd-metric-value ${gap === 0 ? 'is-zero' : ''}`}>
            {gap == null ? '—' : gap}
          </span>
        </div>
        <div className="lpd-metric">
          <span className="lpd-metric-label">relation</span>
          <span
            className="lpd-metric-math"
            dangerouslySetInnerHTML={{ __html: km('3x{+}2y \\le 4u{+}6v') }}
          />
        </div>
      </div>

      <div className={`lpd-verdict ${atOptimum ? 'is-opt' : ''}`}>
        {atOptimum ? <Target size={15} /> : <Scale size={15} />}
        <span>
          {atOptimum
            ? `Optimal corner (4, 0): primal = ${primalValue}, dual = ${DUAL_OPT.value}, gap = 0. The two LPs certify each other.`
            : `Vertex ${current.label} gives ${primalValue}. Any feasible dual still upper-bounds this (weak duality) — slide up to the optimum.`}
        </span>
      </div>

      <div className="lpd-narration">
        <span className="lpd-narration-label">why it matters</span>
        <span className="lpd-narration-body">
          Every linear program has a dual that looks at the same problem from the constraint side. Weak duality says
          any feasible dual value bounds any feasible primal value, so a matching pair{' '}
          <em>proves</em> optimality — no further search needed. Strong duality guarantees that matching pair always
          exists for LPs, which is why simplex and interior-point solvers can hand back a certificate, and why
          duality underpins shadow prices, max-flow/min-cut, and the KKT conditions in convex optimization.
        </span>
      </div>
    </div>
  );
}
