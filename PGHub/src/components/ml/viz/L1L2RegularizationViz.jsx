import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Shuffle } from 'lucide-react';
import './MLViz.css';

// Panel geometry — side-by-side L1 and L2 stages.
const W = 280;
const H = 280;
const PAD = 30;
const PLOT_W = W - 2 * PAD;
const PLOT_H = H - 2 * PAD;

// Weight space spans [-AXIS_RANGE, AXIS_RANGE] in BOTH axes.
const AXIS_RANGE = 3.2;

// Loss ellipse: unregularized optimum (w*) and per-axis scales.
// f(w) = a*(w1 - w1*)^2 + b*(w2 - w2*)^2 + 2c*(w1-w1*)(w2-w2*)
// We choose a slightly tilted, elongated bowl so the L1/L2 differences are vivid.
const W_STAR = { w1: 1.7, w2: 1.1 };
const Q = { a: 1.0, b: 0.55, c: 0.35 }; // mild correlation, ellipse tilted

function lossAt(w1, w2) {
  const d1 = w1 - W_STAR.w1;
  const d2 = w2 - W_STAR.w2;
  return Q.a * d1 * d1 + Q.b * d2 * d2 + 2 * Q.c * d1 * d2;
}

// Project weight-space (w1, w2) into SVG pixel space.
function px(w) {
  return PAD + ((w + AXIS_RANGE) / (2 * AXIS_RANGE)) * PLOT_W;
}
function py(w) {
  return PAD + PLOT_H - ((w + AXIS_RANGE) / (2 * AXIS_RANGE)) * PLOT_H;
}

function snap(v, p = 3) {
  if (!Number.isFinite(v)) return '–';
  const m = Math.pow(10, p);
  return (Math.round(v * m) / m).toFixed(p);
}

// Solve L2-constrained min: min f(w) s.t. ||w||_2 <= C.
// Closed-form via radial projection of unconstrained optimum if it sits outside;
// otherwise the unconstrained optimum itself. The active-set case uses a 1D search
// along the constraint circle to handle the tilted quadratic correctly.
function solveL2(C) {
  const r0 = Math.hypot(W_STAR.w1, W_STAR.w2);
  if (r0 <= C + 1e-9) return { w1: W_STAR.w1, w2: W_STAR.w2, active: false };
  // On the circle of radius C — sweep theta, pick min loss.
  let best = { w1: 0, w2: 0, l: Infinity };
  const N = 720;
  for (let i = 0; i < N; i++) {
    const t = (2 * Math.PI * i) / N;
    const w1 = C * Math.cos(t);
    const w2 = C * Math.sin(t);
    const l = lossAt(w1, w2);
    if (l < best.l) best = { w1, w2, l };
  }
  return { w1: best.w1, w2: best.w2, active: true };
}

// Solve L1-constrained min: min f(w) s.t. |w1| + |w2| <= C.
// Project across the four diamond edges + interior, take the best feasible point.
function solveL1(C) {
  const interior = Math.abs(W_STAR.w1) + Math.abs(W_STAR.w2);
  if (interior <= C + 1e-9) {
    return { w1: W_STAR.w1, w2: W_STAR.w2, active: false };
  }
  // Search around the diamond perimeter parametrically.
  // Diamond corners: (C,0), (0,C), (-C,0), (0,-C).
  // Parameterize by s in [0,4): edge index e = floor(s), local t = s - e in [0,1).
  let best = { w1: 0, w2: 0, l: Infinity };
  const N = 1600;
  for (let i = 0; i < N; i++) {
    const s = (4 * i) / N;
    const e = Math.floor(s) % 4;
    const t = s - Math.floor(s);
    let w1 = 0;
    let w2 = 0;
    if (e === 0) { w1 = C * (1 - t); w2 = C * t; }
    else if (e === 1) { w1 = -C * t; w2 = C * (1 - t); }
    else if (e === 2) { w1 = -C * (1 - t); w2 = -C * t; }
    else { w1 = C * t; w2 = -C * (1 - t); }
    const l = lossAt(w1, w2);
    if (l < best.l) best = { w1, w2, l };
  }
  // Also test the 4 corners explicitly (sparse-friendly).
  const corners = [
    { w1: C, w2: 0 },
    { w1: -C, w2: 0 },
    { w1: 0, w2: C },
    { w1: 0, w2: -C },
  ];
  for (const c of corners) {
    const l = lossAt(c.w1, c.w2);
    if (l < best.l) best = { ...c, l };
  }
  return { w1: best.w1, w2: best.w2, active: true };
}

// Build an SVG path for one loss contour at value L*.
// f(w) - f_min = L*  → ellipse around (w1*, w2*). We parameterize using the
// eigen-decomposition of the 2x2 Hessian-half [[a,c],[c,b]].
function contourPath(level) {
  const a = Q.a, b = Q.b, c = Q.c;
  // Eigen of M=[[a,c],[c,b]]: λ = (a+b)/2 ± sqrt(((a-b)/2)^2 + c^2)
  const tr = a + b;
  const disc = Math.sqrt(((a - b) / 2) ** 2 + c * c);
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  // Eigenvector for λ1: rotate by angle θ such that tan(2θ) = 2c/(a-b).
  const theta = 0.5 * Math.atan2(2 * c, a - b);
  // Semi-axes:
  const r1 = Math.sqrt(level / l1);
  const r2 = Math.sqrt(level / l2);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  let d = '';
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    const u = r1 * Math.cos(t);
    const v = r2 * Math.sin(t);
    const w1 = W_STAR.w1 + cosT * u - sinT * v;
    const w2 = W_STAR.w2 + sinT * u + cosT * v;
    const x = px(w1).toFixed(2);
    const y = py(w2).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d + ' Z';
}

// Build the L2 (circle) and L1 (diamond) constraint set paths in SVG pixels.
function l2CirclePath(C) {
  let d = '';
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const t = (2 * Math.PI * i) / N;
    const x = px(C * Math.cos(t)).toFixed(2);
    const y = py(C * Math.sin(t)).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d + ' Z';
}

function l1DiamondPath(C) {
  const pts = [
    [C, 0],
    [0, C],
    [-C, 0],
    [0, -C],
  ];
  let d = '';
  pts.forEach((p, i) => {
    const x = px(p[0]).toFixed(2);
    const y = py(p[1]).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });
  return d + ' Z';
}

const COLOR_L1 = 'var(--hue-pink, #ff66cc)';
const COLOR_L2 = 'var(--hue-sky, #5ecbff)';
const COLOR_OPT = 'var(--hue-mint, #6effc6)';

// Contour levels — geometric so inner ellipses cluster near optimum.
const LEVELS = [0.12, 0.35, 0.75, 1.4, 2.4, 3.8, 5.6, 7.8];

const SPARSE_EPS = 0.06; // weight treated as effectively zero below this

// One panel — either L1 or L2.
function NormPanel({ kind, C, solution, trail, title, color, sparseEps }) {
  const constraintPath = kind === 'L1' ? l1DiamondPath(C) : l2CirclePath(C);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mlviz-svg"
      style={{ maxWidth: 320, width: '100%' }}
    >
      {/* Title */}
      <text
        x={PAD}
        y={16}
        fontSize="10"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
        letterSpacing="0.18em"
        fontWeight="700"
      >
        {title}
      </text>
      <text
        x={W - PAD}
        y={16}
        fontSize="9"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
        letterSpacing="0.1em"
        textAnchor="end"
      >
        C = {snap(C, 2)}
      </text>

      {/* Plot frame */}
      <rect
        x={PAD}
        y={PAD}
        width={PLOT_W}
        height={PLOT_H}
        fill="none"
        stroke="var(--border)"
        strokeWidth="0.5"
        opacity="0.55"
      />

      {/* Axes through origin */}
      <line
        x1={PAD}
        x2={PAD + PLOT_W}
        y1={py(0)}
        y2={py(0)}
        stroke="var(--text-dim)"
        strokeWidth="0.5"
        opacity="0.55"
        strokeDasharray="2 3"
      />
      <line
        x1={px(0)}
        x2={px(0)}
        y1={PAD}
        y2={PAD + PLOT_H}
        stroke="var(--text-dim)"
        strokeWidth="0.5"
        opacity="0.55"
        strokeDasharray="2 3"
      />

      {/* Axis labels */}
      <text
        x={PAD + PLOT_W - 4}
        y={py(0) - 4}
        fontSize="9"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
        textAnchor="end"
      >
        w₁
      </text>
      <text
        x={px(0) + 4}
        y={PAD + 10}
        fontSize="9"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
      >
        w₂
      </text>

      {/* Loss contours */}
      {LEVELS.map((lev, i) => (
        <path
          key={`lev${i}`}
          d={contourPath(lev)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="0.7"
          opacity={0.55 - i * 0.05}
        />
      ))}

      {/* Constraint set */}
      <path
        d={constraintPath}
        fill={color}
        fillOpacity="0.12"
        stroke={color}
        strokeWidth="1.4"
      />

      {/* Unconstrained optimum w* */}
      <circle
        cx={px(W_STAR.w1)}
        cy={py(W_STAR.w2)}
        r="3.4"
        fill="var(--surface)"
        stroke={COLOR_OPT}
        strokeWidth="1.4"
      />
      <text
        x={px(W_STAR.w1) + 6}
        y={py(W_STAR.w2) - 5}
        fontSize="8.5"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
      >
        w*
      </text>

      {/* Trajectory of solution as C grew (animation history) */}
      {trail && trail.length > 1 && (
        <path
          d={trail
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(p.w1).toFixed(2)} ${py(p.w2).toFixed(2)}`)
            .join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.1"
          strokeDasharray="3 2"
          opacity="0.75"
        />
      )}

      {/* Solution point */}
      <circle
        cx={px(solution.w1)}
        cy={py(solution.w2)}
        r="4.2"
        fill={color}
        stroke="var(--bg)"
        strokeWidth="0.9"
      />

      {/* Sparsity call-out: if a coordinate is ~0, mark it on its axis */}
      {kind === 'L1' && Math.abs(solution.w1) < sparseEps && (
        <g>
          <line
            x1={px(solution.w1)}
            y1={py(solution.w2)}
            x2={px(0)}
            y2={py(0)}
            stroke={color}
            strokeWidth="0.6"
            opacity="0.55"
            strokeDasharray="1 2"
          />
          <text
            x={px(0) - 8}
            y={py(solution.w2) - 6}
            fontSize="8.5"
            fontFamily="var(--mono, monospace)"
            fill={color}
            textAnchor="end"
          >
            w₁ → 0
          </text>
        </g>
      )}
      {kind === 'L1' && Math.abs(solution.w2) < sparseEps && (
        <g>
          <line
            x1={px(solution.w1)}
            y1={py(solution.w2)}
            x2={px(0)}
            y2={py(0)}
            stroke={color}
            strokeWidth="0.6"
            opacity="0.55"
            strokeDasharray="1 2"
          />
          <text
            x={px(solution.w1) + 6}
            y={py(0) + 12}
            fontSize="8.5"
            fontFamily="var(--mono, monospace)"
            fill={color}
          >
            w₂ → 0
          </text>
        </g>
      )}

      {/* Coordinate readout */}
      <text
        x={PAD}
        y={H - 8}
        fontSize="8.5"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-main)"
      >
        ({snap(solution.w1, 2)}, {snap(solution.w2, 2)})
      </text>
      <text
        x={W - PAD}
        y={H - 8}
        fontSize="8.5"
        fontFamily="var(--mono, monospace)"
        fill="var(--text-dim)"
        textAnchor="end"
      >
        {solution.active ? 'on boundary' : 'interior'}
      </text>
    </svg>
  );
}

const C_MIN = 0.05;
const C_MAX = 3.6;

export default function L1L2RegularizationViz() {
  const [C, setC] = useState(1.2);
  const [animating, setAnimating] = useState(false);
  const [trailL1, setTrailL1] = useState([]);
  const [trailL2, setTrailL2] = useState([]);
  const rafRef = useRef(null);
  const startRef = useRef(0);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const solL1 = useMemo(() => solveL1(C), [C]);
  const solL2 = useMemo(() => solveL2(C), [C]);

  // Sparsity: number of weights within SPARSE_EPS of zero.
  const sparsityL1 = (Math.abs(solL1.w1) < SPARSE_EPS ? 1 : 0) + (Math.abs(solL1.w2) < SPARSE_EPS ? 1 : 0);
  const sparsityL2 = (Math.abs(solL2.w1) < SPARSE_EPS ? 1 : 0) + (Math.abs(solL2.w2) < SPARSE_EPS ? 1 : 0);

  const animate = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(true);
    setTrailL1([]);
    setTrailL2([]);
    startRef.current = performance.now();
    const DURATION = 2600;
    const tick = (now) => {
      const t = Math.min(1, (now - startRef.current) / DURATION);
      // Sweep C from C_MIN to a generous endpoint that lets the unconstrained
      // optimum sit comfortably inside the L1 diamond (interior |w*|_1).
      const interior = Math.abs(W_STAR.w1) + Math.abs(W_STAR.w2);
      const Cend = Math.max(C_MAX, interior + 0.6);
      const cVal = C_MIN + (Cend - C_MIN) * t;
      setC(cVal);
      const a = solveL1(cVal);
      const b = solveL2(cVal);
      setTrailL1((tr) => (tr.length > 240 ? tr : [...tr, { w1: a.w1, w2: a.w2 }]));
      setTrailL2((tr) => (tr.length > 240 ? tr : [...tr, { w1: b.w1, w2: b.w2 }]));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setAnimating(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setTrailL1([]);
    setTrailL2([]);
    setC(1.2);
  }, []);

  const reroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setTrailL1([]);
    setTrailL2([]);
    // Random C in a sweet spot that shows the corner solution often.
    const next = 0.3 + Math.random() * 2.0;
    setC(next);
  }, []);

  // When user moves slider manually, clear any stale animation trail.
  const handleSlider = useCallback((v) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setTrailL1([]);
    setTrailL2([]);
    setC(v);
  }, []);

  return (
    <div className="mlviz-wrap">
      <div
        className="mlviz-stage"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          justifyContent: 'center',
        }}
      >
        <NormPanel
          kind="L1"
          C={C}
          solution={solL1}
          trail={trailL1}
          title="L1  |w₁| + |w₂| ≤ C"
          color={COLOR_L1}
          sparseEps={SPARSE_EPS}
        />
        <NormPanel
          kind="L2"
          C={C}
          solution={solL2}
          trail={trailL2}
          title="L2  w₁² + w₂² ≤ C²"
          color={COLOR_L2}
          sparseEps={SPARSE_EPS}
        />
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">C (constraint budget)</span>
            <input
              type="range"
              min={C_MIN}
              max={C_MAX}
              step="0.01"
              value={C}
              onChange={(e) => handleSlider(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{snap(C, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_L1 }}>L1</span>
          <span className="mlviz-val">
            (w₁, w₂) = ({snap(solL1.w1, 3)}, {snap(solL1.w2, 3)})
          </span>
          <span className="mlviz-sub">
            loss {snap(lossAt(solL1.w1, solL1.w2), 3)} · ‖w‖₁ = {snap(Math.abs(solL1.w1) + Math.abs(solL1.w2), 3)}
          </span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_L2 }}>L2</span>
          <span className="mlviz-val">
            (w₁, w₂) = ({snap(solL2.w1, 3)}, {snap(solL2.w2, 3)})
          </span>
          <span className="mlviz-sub">
            loss {snap(lossAt(solL2.w1, solL2.w2), 3)} · ‖w‖₂ = {snap(Math.hypot(solL2.w1, solL2.w2), 3)}
          </span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>sparsity</span>
          <span className="mlviz-val">
            L1: {sparsityL1} zero · L2: {sparsityL2} zero
          </span>
          <span className="mlviz-sub">
            unconstrained optimum w* = ({snap(W_STAR.w1, 2)}, {snap(W_STAR.w2, 2)})
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={animate}
            disabled={animating}
          >
            <Play size={13} />
            <span>Animate C: 0 → ∞</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reset}
            disabled={animating}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={reroll}
            disabled={animating}
          >
            <Shuffle size={13} />
            <span>Random C</span>
          </button>
        </div>

        <div className="mlviz-hint">
          tight C — the diamond hits the loss contour at a corner (one weight = 0); the circle slides smoothly so both weights shrink together
        </div>
      </div>
    </div>
  );
}
