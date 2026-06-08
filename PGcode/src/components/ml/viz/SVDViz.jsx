import React, { useRef, useState, useMemo, useEffect } from 'react';
import './MLViz.css';

const SIZE = 380;
const UNIT = 55;
const ORIGIN = SIZE / 2;
const GRID_MIN = -3;
const GRID_MAX = 3;
const NPTS = 96;

function snap(v) { return Math.round(v * 100) / 100; }
function toScreen(x, y) { return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT }; }

function mul2(A, B) {
  return {
    a: A.a * B.a + A.b * B.c,
    b: A.a * B.b + A.b * B.d,
    c: A.c * B.a + A.d * B.c,
    d: A.c * B.b + A.d * B.d,
  };
}
function transpose(M) { return { a: M.a, b: M.c, c: M.b, d: M.d }; }
function identity() { return { a: 1, b: 0, c: 0, d: 1 }; }
function rot(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return { a: c, b: -s, c: s, d: c };
}
function applyM(M, x, y) { return { x: M.a * x + M.b * y, y: M.c * x + M.d * y }; }
function det2(M) { return M.a * M.d - M.b * M.c; }

/* Closed-form 2x2 SVD via the symmetric eigendecomposition of M^T M.
   Returns: { U, S: [s1, s2], V, thetaU, thetaV }
   Where M = U Σ V^T, σ1 >= σ2 >= 0. */
function svd2(M) {
  // Symmetric matrix S = M^T M  (positive semi-definite)
  const a = M.a * M.a + M.c * M.c;
  const b = M.a * M.b + M.c * M.d;
  const d = M.b * M.b + M.d * M.d;
  // eigenvalues of [[a,b],[b,d]]
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.max(0, tr * tr / 4 - det);
  const sq = Math.sqrt(disc);
  let lam1 = tr / 2 + sq;
  let lam2 = tr / 2 - sq;
  lam1 = Math.max(0, lam1);
  lam2 = Math.max(0, lam2);
  const s1 = Math.sqrt(lam1);
  const s2 = Math.sqrt(lam2);

  // eigenvector of S for lam1: (a-lam) x + b y = 0
  let v1x, v1y;
  if (Math.abs(b) > 1e-10) {
    v1x = b;
    v1y = lam1 - a;
  } else if (Math.abs(a - lam1) < 1e-10) {
    v1x = 1; v1y = 0;
  } else {
    v1x = 0; v1y = 1;
  }
  const n1 = Math.hypot(v1x, v1y) || 1;
  v1x /= n1; v1y /= n1;
  // orthogonal partner
  const v2x = -v1y, v2y = v1x;

  const V = { a: v1x, b: v2x, c: v1y, d: v2y };

  // U columns: M v_i / sigma_i (if sigma > 0)
  let u1x, u1y, u2x, u2y;
  if (s1 > 1e-9) {
    const t = applyM(M, v1x, v1y);
    u1x = t.x / s1; u1y = t.y / s1;
  } else {
    u1x = 1; u1y = 0;
  }
  if (s2 > 1e-9) {
    const t = applyM(M, v2x, v2y);
    u2x = t.x / s2; u2y = t.y / s2;
  } else {
    u2x = -u1y; u2y = u1x;
  }
  // re-orthonormalize u2 against u1 (numerical safety)
  const dot = u1x * u2x + u1y * u2y;
  u2x -= dot * u1x; u2y -= dot * u1y;
  const nU2 = Math.hypot(u2x, u2y) || 1;
  u2x /= nU2; u2y /= nU2;

  const U = { a: u1x, b: u2x, c: u1y, d: u2y };

  const thetaV = Math.atan2(V.c, V.a);
  const thetaU = Math.atan2(U.c, U.a);

  return { U, S: [s1, s2], V, thetaU, thetaV };
}

/* Slerp between two rotation matrices by angle blend.
   Each is parameterized by its rotation angle; for a possible reflection
   we keep the columns of V/U as-is and interpolate angle. (Determinant sign
   flips visually as a clean rotation at the start of stage 1/3.) */
function rotInterp(theta, t) { return rot(theta * t); }

/* Build the stage-aware transform applied to the unit circle. */
function stageTransform(svd, stage, t) {
  // stage 0: identity (unit circle), no animation
  // stage 1: animate from I -> V^T  (rotation by -thetaV)
  // stage 2: V^T fixed, animate scale from (1,1) -> (s1, s2)
  // stage 3: U Σ V^T fully applied; animate rotation 0 -> thetaU on top of Σ V^T
  const Vt = transpose(svd.V);
  const Sigma = { a: svd.S[0], b: 0, c: 0, d: svd.S[1] };
  if (stage === 0) return identity();
  if (stage === 1) {
    // partial V^T: rotate by -thetaV * t
    return rot(-svd.thetaV * t);
  }
  if (stage === 2) {
    const partialS = { a: 1 + (svd.S[0] - 1) * t, b: 0, c: 0, d: 1 + (svd.S[1] - 1) * t };
    return mul2(partialS, Vt);
  }
  if (stage === 3) {
    const partialU = rot(svd.thetaU * t);
    return mul2(partialU, mul2(Sigma, Vt));
  }
  return identity();
}

function Grid() {
  const lines = [];
  for (let i = GRID_MIN; i <= GRID_MAX; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
    const isAxis = i === 0;
    lines.push(
      <line key={`h${i}`} x1="0" y1={sy} x2={SIZE} y2={sy}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4}
        opacity={isAxis ? 0.7 : 0.4} />
    );
    lines.push(
      <line key={`v${i}`} x1={sx} y1="0" x2={sx} y2={SIZE}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4}
        opacity={isAxis ? 0.7 : 0.4} />
    );
  }
  return <g>{lines}</g>;
}

function ArrowHead({ x1, y1, x2, y2, color }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const angle = Math.atan2(dy, dx);
  const headLen = 9;
  const hx1 = x2 - headLen * Math.cos(angle - 0.42);
  const hy1 = y2 - headLen * Math.sin(angle - 0.42);
  const hx2 = x2 - headLen * Math.cos(angle + 0.42);
  const hy2 = y2 - headLen * Math.sin(angle + 0.42);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
    </g>
  );
}

function MatrixInput({ label, value, onChange }) {
  return (
    <label className="mt-cell">
      <span className="mt-cell-label">{label}</span>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-cell-input"
      />
    </label>
  );
}

const STAGE_LABELS = [
  'Unit circle (input)',
  'Apply V^T  —  rotation',
  'Apply Σ  —  axis stretch',
  'Apply U  —  rotation to final M·circle',
];

export default function SVDViz() {
  const [M, setM] = useState({ a: 2, b: 1, c: 1, d: 3 });
  const [stage, setStage] = useState(0);   // 0..3
  const [t, setT] = useState(0);           // animation progress within current stage
  const [animating, setAnimating] = useState(false);
  const [runAll, setRunAll] = useState(false);
  const rafRef = useRef(null);

  const setCell = (key) => (val) => {
    const n = Number(val);
    setM((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
    cancelAnim();
    setStage(0); setT(0); setRunAll(false);
  };

  const svd = useMemo(() => svd2(M), [M]);
  const det = useMemo(() => det2(M), [M]);
  const condNum = svd.S[1] > 1e-9 ? svd.S[0] / svd.S[1] : Infinity;

  const cancelAnim = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setAnimating(false);
  };

  useEffect(() => () => cancelAnim(), []);

  /* Animate one stage transition: stage S, drive t 0->1, end at stage S with t=1. */
  const animateStage = (toStage, onDone) => {
    cancelAnim();
    setStage(toStage);
    setT(0);
    setAnimating(true);
    const start = performance.now();
    const dur = 950;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setAnimating(false);
        if (onDone) onDone();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStep = () => {
    if (animating) return;
    // when t hasn't fully advanced inside current stage 1..3, finish it; else go to next.
    if (stage === 0) { animateStage(1); return; }
    if (stage < 3 && t >= 1) { animateStage(stage + 1); return; }
    if (stage < 3 && t < 1) { animateStage(stage); return; }
    // stage 3 done -> reset
    setStage(0); setT(0);
  };

  const handleRunAll = () => {
    if (animating) return;
    setRunAll(true);
    const chain = (s) => {
      animateStage(s, () => {
        if (s < 3) chain(s + 1);
        else setRunAll(false);
      });
    };
    setStage(0); setT(0);
    chain(1);
  };

  const handleReset = () => {
    cancelAnim();
    setStage(0); setT(0); setRunAll(false);
  };

  // Build the circle / ellipse path under the current stage transform
  const T = stageTransform(svd, stage, t);
  const pts = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= NPTS; i++) {
      const ang = (i / NPTS) * Math.PI * 2;
      arr.push({ x: Math.cos(ang), y: Math.sin(ang) });
    }
    return arr;
  }, []);
  const transformed = pts.map((p) => applyM(T, p.x, p.y));
  const pathD = transformed.map((p, i) => {
    const { sx, sy } = toScreen(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(2)} ${sy.toFixed(2)}`;
  }).join(' ') + ' Z';

  // Principal axes after current stage transform (V columns -> singular directions)
  // Before any transform these are the V columns (right singular vectors).
  // After full M they become σ_i * u_i (left singular vectors scaled).
  const axisStart1 = applyM(T, svd.V.a, svd.V.c);   // image of v1
  const axisStart2 = applyM(T, svd.V.b, svd.V.d);   // image of v2
  const aS1 = toScreen(axisStart1.x, axisStart1.y);
  const aS2 = toScreen(axisStart2.x, axisStart2.y);
  const aS1n = toScreen(-axisStart1.x, -axisStart1.y);
  const aS2n = toScreen(-axisStart2.x, -axisStart2.y);

  // Faint reference: original unit circle (dashed)
  const refPath = pts.map((p, i) => {
    const { sx, sy } = toScreen(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(2)} ${sy.toFixed(2)}`;
  }).join(' ') + ' Z';

  // Singular-value labels positioned at the tips of the axes after each stage
  const showAxisLabels = stage >= 2 && t > 0.05;
  const sigma1Label = stage >= 2
    ? (stage === 2 ? (1 + (svd.S[0] - 1) * t) : svd.S[0])
    : 1;
  const sigma2Label = stage >= 2
    ? (stage === 2 ? (1 + (svd.S[1] - 1) * t) : svd.S[1])
    : 1;

  const C_CIRCLE = 'var(--accent)';
  const C_SIG1 = 'var(--hue-sky, #5ecbff)';
  const C_SIG2 = 'var(--hue-pink, #ff66cc)';
  const C_REF = 'var(--text-dim)';

  const thetaUDeg = (svd.thetaU * 180 / Math.PI);
  const thetaVtDeg = (-svd.thetaV * 180 / Math.PI);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <Grid />

          {/* faint reference unit circle */}
          <path d={refPath} fill="none" stroke={C_REF} strokeWidth="1"
            strokeDasharray="4 4" opacity="0.45" />

          {/* current transformed shape */}
          <path d={pathD}
            fill={`rgba(var(--accent-rgb), 0.10)`}
            stroke={C_CIRCLE}
            strokeWidth="2" />

          {/* principal axes through origin */}
          <line x1={aS1n.sx} y1={aS1n.sy} x2={aS1.sx} y2={aS1.sy}
            stroke={C_SIG1} strokeWidth="1.6" opacity={stage === 0 ? 0.55 : 0.9} />
          <line x1={aS2n.sx} y1={aS2n.sy} x2={aS2.sx} y2={aS2.sy}
            stroke={C_SIG2} strokeWidth="1.6" opacity={stage === 0 ? 0.55 : 0.9} />

          {/* arrowhead axes (positive direction) */}
          <ArrowHead x1={ORIGIN} y1={ORIGIN} x2={aS1.sx} y2={aS1.sy} color={C_SIG1} />
          <ArrowHead x1={ORIGIN} y1={ORIGIN} x2={aS2.sx} y2={aS2.sy} color={C_SIG2} />

          {/* axis tip labels */}
          {showAxisLabels && (
            <>
              <text
                x={aS1.sx + 8 * Math.sign(axisStart1.x || 1)}
                y={aS1.sy - 8 * Math.sign(axisStart1.y || 1)}
                fontSize="12"
                fontWeight="700"
                fill={C_SIG1}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                σ₁ = {snap(sigma1Label)}
              </text>
              <text
                x={aS2.sx + 8 * Math.sign(axisStart2.x || 1)}
                y={aS2.sy - 8 * Math.sign(axisStart2.y || 1)}
                fontSize="12"
                fontWeight="700"
                fill={C_SIG2}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                σ₂ = {snap(sigma2Label)}
              </text>
            </>
          )}

          {/* origin dot */}
          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {/* stage caption */}
          <text x={12} y={20} fontSize="11.5" fontWeight="600"
            fill="var(--text-dim)" fontFamily="var(--serif, serif)">
            Stage {stage}: {STAGE_LABELS[stage]}
          </text>
        </svg>
      </div>

      <div className="mt-controls">
        <div className="mt-matrix">
          <span className="mt-bracket mt-bracket-l">[</span>
          <div className="mt-grid">
            <MatrixInput label="a" value={snap(M.a)} onChange={setCell('a')} />
            <MatrixInput label="b" value={snap(M.b)} onChange={setCell('b')} />
            <MatrixInput label="c" value={snap(M.c)} onChange={setCell('c')} />
            <MatrixInput label="d" value={snap(M.d)} onChange={setCell('d')} />
          </div>
          <span className="mt-bracket mt-bracket-r">]</span>
        </div>
      </div>

      <div className="mlviz-readout mlviz-btn-row" style={{ flexDirection: 'row', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={handleStep}
          disabled={animating || runAll}
        >
          Step
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={handleRunAll}
          disabled={animating || runAll}
        >
          Run all
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={handleReset}
          disabled={animating || (stage === 0 && t === 0)}
        >
          Reset
        </button>
        <span className="mlviz-hint" style={{ marginTop: 0, alignSelf: 'center' }}>
          M = U Σ V^T  —  rotate, stretch, rotate
        </span>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: C_SIG1 }}>σ₁</span>
          <span className="mlviz-val">{snap(svd.S[0])}</span>
          <span className="mlviz-sub">largest singular value</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: C_SIG2 }}>σ₂</span>
          <span className="mlviz-val">{snap(svd.S[1])}</span>
          <span className="mlviz-sub">smallest singular value</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">κ(M)</span>
          <span className="mlviz-val">
            {Number.isFinite(condNum) ? snap(condNum) : '∞'}
          </span>
          <span className="mlviz-sub">condition number σ₁/σ₂</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">det(M)</span>
          <span className="mlviz-val">{snap(det)}</span>
          <span className="mlviz-sub">{det < 0 ? 'orientation flipped' : 'preserves orientation'}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">V^T angle</span>
          <span className="mlviz-val">{snap(thetaVtDeg)}°</span>
          <span className="mlviz-sub">input-space rotation</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">U angle</span>
          <span className="mlviz-val">{snap(thetaUDeg)}°</span>
          <span className="mlviz-sub">output-space rotation</span>
        </div>
        <div className="mlviz-hint">
          unit circle → rotated circle → ellipse with axes σ₁, σ₂ → final M·circle
        </div>
      </div>
    </div>
  );
}
