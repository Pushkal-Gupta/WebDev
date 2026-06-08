import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Shuffle } from 'lucide-react';
import './MLViz.css';

const PANEL = 360;
const PAD = 26;
const PLOT = PANEL - PAD * 2;

const X_LO = -3.2;
const X_HI = 3.2;
const X_RANGE = X_HI - X_LO;
const UNIT = PLOT / X_RANGE;
const ORIGIN_X = PAD + (-X_LO) * UNIT;
const ORIGIN_Y = PAD + X_HI * UNIT;

const COL_POS = 'var(--hue-sky, #5ecbff)';
const COL_NEG = 'var(--hue-pink, #ff66cc)';
const COL_PLANE = 'var(--accent)';
const COL_LINE = 'var(--hue-violet, #b794f6)';

const KERNELS = [
  { id: 'linear', label: 'Linear', sub: 'phi(x) = x' },
  { id: 'poly2', label: 'Poly deg 2', sub: 'phi(x,y) = (x, y, x^2+y^2)' },
  { id: 'poly3', label: 'Poly deg 3', sub: 'phi includes cubic terms' },
  { id: 'rbf', label: 'RBF', sub: 'phi via gaussian similarity' },
];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Concentric-ring dataset: inner class +1 (small radius), outer class -1 (large radius).
// Not linearly separable in 2D, perfectly separable in z = x^2 + y^2.
function buildDataset(seed) {
  const rand = mulberry32(seed);
  const pts = [];
  const innerR = 0.85;
  const outerR = 2.1;
  const innerN = 22;
  const outerN = 28;
  for (let i = 0; i < innerN; i++) {
    const theta = rand() * Math.PI * 2;
    const r = innerR + (rand() - 0.5) * 0.45;
    pts.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r, label: 1 });
  }
  for (let i = 0; i < outerN; i++) {
    const theta = rand() * Math.PI * 2;
    const r = outerR + (rand() - 0.5) * 0.55;
    pts.push({ x: Math.cos(theta) * r, y: Math.sin(theta) * r, label: -1 });
  }
  return pts;
}

function to2D(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// Lifting functions per kernel. Each returns a triplet (X, Y, Z) in feature-space units.
// The right panel renders the same X/Y but uses Z to displace points vertically into a
// pseudo-3D perspective.
function lift(point, kernel) {
  const { x, y } = point;
  if (kernel === 'linear') {
    return { fx: x, fy: y, fz: 0 };
  }
  if (kernel === 'poly2') {
    return { fx: x, fy: y, fz: x * x + y * y };
  }
  if (kernel === 'poly3') {
    return { fx: x, fy: y, fz: 0.5 * (x * x + y * y) + 0.18 * (x * x * x + y * y * y) };
  }
  // RBF — distance to a learned center used as similarity-driven height.
  // For the ring dataset, center near origin gives a clear bell-shape lift.
  const cx = 0;
  const cy = 0;
  const gamma = 0.55;
  const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  const sim = Math.exp(-gamma * d2);
  // Scale so the visualization spans a usable z-range comparable to poly2.
  return { fx: x, fy: y, fz: 6 - sim * 6 };
}

// Find the optimal axial threshold tau on z such that all class +1 points lie below tau
// and class -1 above (or vice-versa). Returns { tau, flip, acc }.
function fitThreshold(lifted) {
  const zs = lifted.map((p) => p.fz);
  const labels = lifted.map((p) => p.label);
  const lo = Math.min(...zs);
  const hi = Math.max(...zs);
  if (hi - lo < 1e-6) return { tau: lo, flip: false, acc: 0.5 };
  const steps = 80;
  let best = { tau: lo, flip: false, acc: 0 };
  for (let i = 0; i <= steps; i++) {
    const tau = lo + (hi - lo) * (i / steps);
    let acc1 = 0;
    let acc2 = 0;
    for (let k = 0; k < zs.length; k++) {
      const above = zs[k] >= tau;
      // Variant A: above => label -1 (outer ring lifts higher)
      if ((above && labels[k] === -1) || (!above && labels[k] === 1)) acc1++;
      // Variant B (flipped)
      if ((above && labels[k] === 1) || (!above && labels[k] === -1)) acc2++;
    }
    const a1 = acc1 / zs.length;
    const a2 = acc2 / zs.length;
    if (a1 >= a2 && a1 > best.acc) best = { tau, flip: false, acc: a1 };
    else if (a2 > a1 && a2 > best.acc) best = { tau, flip: true, acc: a2 };
  }
  return best;
}

// Best linear classifier in 2D (axis-aligned-ish via simple gradient on log-loss-like score).
// For the ring dataset this caps near 50–60% accuracy — the educational point.
function bestLinear2DAcc(points) {
  let best = 0;
  // Search over a coarse grid of angles and offsets.
  for (let a = 0; a < 18; a++) {
    const theta = (a / 18) * Math.PI;
    const nx = Math.cos(theta);
    const ny = Math.sin(theta);
    const scores = points.map((p) => nx * p.x + ny * p.y);
    const lo = Math.min(...scores);
    const hi = Math.max(...scores);
    for (let i = 0; i <= 24; i++) {
      const b = lo + (hi - lo) * (i / 24);
      let c1 = 0;
      let c2 = 0;
      for (let k = 0; k < points.length; k++) {
        const above = scores[k] >= b;
        if ((above && points[k].label === 1) || (!above && points[k].label === -1)) c1++;
        if ((above && points[k].label === -1) || (!above && points[k].label === 1)) c2++;
      }
      const a1 = c1 / points.length;
      const a2 = c2 / points.length;
      const m = Math.max(a1, a2);
      if (m > best) best = m;
    }
  }
  return best;
}

// Convert a feature-space point (fx, fy, fz) into screen coords inside the 3D panel.
// Simple oblique projection: x' = fx + fz * cos(theta) * tilt, y' = fy + fz * sin(theta) * tilt.
function project3D(fx, fy, fz, opts) {
  const { theta, zScale, panel } = opts;
  // Rotate around the vertical axis a touch so the floor reads as a plane.
  const yawCos = Math.cos(opts.yaw);
  const yawSin = Math.sin(opts.yaw);
  const rx = fx * yawCos + fy * yawSin;
  const ry = -fx * yawSin + fy * yawCos;
  // Project z upwards (negative screen-y).
  const zPx = fz * zScale;
  const sx = panel.cx + rx * panel.unit;
  const sy = panel.cy - ry * panel.unit * 0.55 - zPx;
  return { sx, sy, depth: ry };
}

function Grid2D() {
  const lines = [];
  for (let i = Math.ceil(X_LO); i <= Math.floor(X_HI); i++) {
    const { sx } = to2D(i, 0);
    const { sy } = to2D(0, i);
    const major = i === 0;
    lines.push(
      <line
        key={`v${i}`}
        x1={sx}
        y1={PAD}
        x2={sx}
        y2={PANEL - PAD}
        stroke="var(--border)"
        strokeWidth={major ? 1.1 : 0.4}
      />
    );
    lines.push(
      <line
        key={`h${i}`}
        x1={PAD}
        y1={sy}
        x2={PANEL - PAD}
        y2={sy}
        stroke="var(--border)"
        strokeWidth={major ? 1.1 : 0.4}
      />
    );
  }
  return <g>{lines}</g>;
}

const INITIAL_SEED = 20260608;

export default function KernelTrickViz() {
  const seedRef = useRef(INITIAL_SEED);
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [points, setPoints] = useState(() => buildDataset(INITIAL_SEED));
  const [kernelIdx, setKernelIdx] = useState(1);
  const [progress, setProgress] = useState(1); // 0 = flat (in 2D), 1 = fully lifted
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);

  const kernel = KERNELS[kernelIdx].id;

  // Stop any active animation when the kernel or dataset changes — otherwise the
  // ease-in interpolates between two unrelated lifts and looks broken.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setProgress(1);
  }, [kernel, seed]);

  const lifted = useMemo(
    () => points.map((p) => ({ ...p, ...lift(p, kernel) })),
    [points, kernel],
  );

  const fit = useMemo(() => fitThreshold(lifted), [lifted]);
  const linearAcc2D = useMemo(() => bestLinear2DAcc(points), [points]);

  const reveal = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(true);
    setProgress(0);
    const t0 = performance.now();
    const dur = 1100;
    const step = (t) => {
      const u = Math.min(1, (t - t0) / dur);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - u, 3);
      setProgress(eased);
      if (u < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        setAnimating(false);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const handleShuffle = useCallback(() => {
    seedRef.current = (seedRef.current * 1664525 + 1013904223) >>> 0;
    const ns = seedRef.current;
    setSeed(ns);
    setPoints(buildDataset(ns));
  }, []);

  const handleReset = useCallback(() => {
    seedRef.current = INITIAL_SEED;
    setSeed(INITIAL_SEED);
    setPoints(buildDataset(INITIAL_SEED));
    setKernelIdx(1);
    setProgress(1);
  }, []);

  // 3D panel projection helpers.
  const panel3D = useMemo(() => ({
    cx: PANEL / 2,
    cy: PANEL / 2 + 36,
    unit: 38,
    yaw: -0.34,
    theta: 0.6,
    zScale: 28,
  }), []);

  // Pre-render sorted points so back-of-canvas dots draw first (depth-painter).
  const liftedSorted = useMemo(() => {
    const ps = lifted.map((p, i) => {
      const proj = project3D(p.fx, p.fy, p.fz * progress, panel3D);
      return { ...p, ...proj, idx: i };
    });
    ps.sort((a, b) => a.depth - b.depth);
    return ps;
  }, [lifted, panel3D, progress]);

  // Decision plane geometry in the 3D panel: a horizontal slice at z = tau.
  const planeCorners = useMemo(() => {
    const span = 2.6;
    const corners = [
      { fx: -span, fy: -span, fz: fit.tau },
      { fx: span, fy: -span, fz: fit.tau },
      { fx: span, fy: span, fz: fit.tau },
      { fx: -span, fy: span, fz: fit.tau },
    ];
    return corners.map((c) => project3D(c.fx, c.fy, c.fz * progress, panel3D));
  }, [fit.tau, panel3D, progress]);

  // 2D guess: best linear in 2D (just to draw a "best linear attempt" line that fails).
  const bestLine2D = useMemo(() => {
    // Use a simple vertical line through the origin (always weak on rings).
    return {
      x1: 0,
      y1: X_LO + 0.3,
      x2: 0,
      y2: X_HI - 0.3,
    };
  }, []);

  // Floor grid lines (z = 0 plane) — gives the 3D panel a sense of ground.
  const floorLines = useMemo(() => {
    const lines = [];
    for (let i = -3; i <= 3; i++) {
      const a = project3D(i, -3, 0, panel3D);
      const b = project3D(i, 3, 0, panel3D);
      const c = project3D(-3, i, 0, panel3D);
      const d = project3D(3, i, 0, panel3D);
      lines.push({ a, b, key: `fv${i}` });
      lines.push({ a: c, b: d, key: `fh${i}` });
    }
    return lines;
  }, [panel3D]);

  // Axis triad at the 3D origin for orientation.
  const triad = useMemo(() => {
    const o = project3D(0, 0, 0, panel3D);
    const ax = project3D(1.6, 0, 0, panel3D);
    const ay = project3D(0, 1.6, 0, panel3D);
    const az = project3D(0, 0, 4.5 * progress, panel3D);
    return { o, ax, ay, az };
  }, [panel3D, progress]);

  const acc3D = fit.acc;
  const improvement = acc3D - linearAcc2D;

  return (
    <div className="mlviz-wrap">
      <div className="ktv-stage">
        <div className="ktv-panel">
          <div className="ktv-panel-title">
            <span className="ktv-panel-tag">Input space</span>
            <span className="ktv-panel-sub">R^2 &middot; linear acc {snap(linearAcc2D * 100, 1)}%</span>
          </div>
          <svg viewBox={`0 0 ${PANEL} ${PANEL}`} className="ktv-svg">
            <Grid2D />
            {/* axis ticks */}
            {[-3, -2, -1, 1, 2, 3].map((t) => {
              const { sx } = to2D(t, 0);
              const { sy } = to2D(0, t);
              return (
                <g key={`t${t}`}>
                  <text x={sx} y={ORIGIN_Y + 11} fontSize="8" textAnchor="middle"
                    fill="var(--text-dim)" fontFamily="var(--mono, monospace)">{t}</text>
                  <text x={ORIGIN_X - 6} y={sy + 3} fontSize="8" textAnchor="end"
                    fill="var(--text-dim)" fontFamily="var(--mono, monospace)">{t}</text>
                </g>
              );
            })}
            {/* "best linear attempt" line */}
            <line
              x1={to2D(bestLine2D.x1, bestLine2D.y1).sx}
              y1={to2D(bestLine2D.x1, bestLine2D.y1).sy}
              x2={to2D(bestLine2D.x2, bestLine2D.y2).sx}
              y2={to2D(bestLine2D.x2, bestLine2D.y2).sy}
              stroke={COL_LINE}
              strokeWidth="1.6"
              strokeDasharray="6 4"
              opacity="0.7"
            />
            <text
              x={to2D(0, X_HI - 0.5).sx + 6}
              y={to2D(0, X_HI - 0.5).sy}
              fontSize="9"
              fill={COL_LINE}
              fontFamily="var(--mono, monospace)"
            >
              best linear (fails)
            </text>
            {/* points */}
            {points.map((p, i) => {
              const { sx, sy } = to2D(p.x, p.y);
              const col = p.label === 1 ? COL_POS : COL_NEG;
              if (p.label === 1) {
                return (
                  <circle key={`p${i}`} cx={sx} cy={sy} r="3.6" fill={col}
                    stroke="var(--bg)" strokeWidth="1" />
                );
              }
              return (
                <rect key={`p${i}`} x={sx - 3.2} y={sy - 3.2} width="6.4" height="6.4"
                  fill={col} stroke="var(--bg)" strokeWidth="1" />
              );
            })}
            <text x={PANEL - PAD + 2} y={ORIGIN_Y - 4} fontSize="9" textAnchor="end"
              fill="var(--text-dim)" fontFamily="var(--mono, monospace)">x1</text>
            <text x={ORIGIN_X + 6} y={PAD + 4} fontSize="9"
              fill="var(--text-dim)" fontFamily="var(--mono, monospace)">x2</text>
          </svg>
        </div>

        <div className="ktv-arrow" aria-hidden="true">
          <div className="ktv-arrow-glyph">phi</div>
          <div className="ktv-arrow-line" />
        </div>

        <div className="ktv-panel">
          <div className="ktv-panel-title">
            <span className="ktv-panel-tag">Feature space</span>
            <span className="ktv-panel-sub">R^3 &middot; separable acc {snap(acc3D * 100, 1)}%</span>
          </div>
          <svg viewBox={`0 0 ${PANEL} ${PANEL}`} className="ktv-svg">
            {/* floor grid */}
            {floorLines.map((l) => (
              <line key={l.key}
                x1={l.a.sx} y1={l.a.sy} x2={l.b.sx} y2={l.b.sy}
                stroke="var(--border)" strokeWidth="0.45" opacity="0.55" />
            ))}
            {/* axis triad */}
            <line x1={triad.o.sx} y1={triad.o.sy} x2={triad.ax.sx} y2={triad.ax.sy}
              stroke="var(--text-dim)" strokeWidth="1" opacity="0.7" />
            <line x1={triad.o.sx} y1={triad.o.sy} x2={triad.ay.sx} y2={triad.ay.sy}
              stroke="var(--text-dim)" strokeWidth="1" opacity="0.7" />
            <line x1={triad.o.sx} y1={triad.o.sy} x2={triad.az.sx} y2={triad.az.sy}
              stroke={COL_PLANE} strokeWidth="1.4" opacity="0.85" />
            <text x={triad.ax.sx + 4} y={triad.ax.sy + 4} fontSize="9"
              fill="var(--text-dim)" fontFamily="var(--mono, monospace)">x</text>
            <text x={triad.ay.sx + 4} y={triad.ay.sy + 4} fontSize="9"
              fill="var(--text-dim)" fontFamily="var(--mono, monospace)">y</text>
            <text x={triad.az.sx + 4} y={triad.az.sy} fontSize="9"
              fill={COL_PLANE} fontFamily="var(--mono, monospace)">z = phi3</text>

            {/* separating plane — drawn as a tinted polygon */}
            {progress > 0.05 && (
              <polygon
                points={planeCorners.map((c) => `${c.sx},${c.sy}`).join(' ')}
                fill={COL_PLANE}
                opacity={0.14 + 0.12 * progress}
                stroke={COL_PLANE}
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
            )}

            {/* lift trails — vertical line from floor to lifted point, fades as progress reaches 1 */}
            {liftedSorted.map((p) => {
              const base = project3D(p.fx, p.fy, 0, panel3D);
              return (
                <line
                  key={`tr${p.idx}`}
                  x1={base.sx}
                  y1={base.sy}
                  x2={p.sx}
                  y2={p.sy}
                  stroke={p.label === 1 ? COL_POS : COL_NEG}
                  strokeWidth="0.7"
                  opacity={0.18 + 0.22 * (1 - progress)}
                />
              );
            })}

            {/* points sorted back-to-front */}
            {liftedSorted.map((p) => {
              const col = p.label === 1 ? COL_POS : COL_NEG;
              const r = 3.4 + (p.depth + 3) * 0.18;
              if (p.label === 1) {
                return (
                  <circle key={`f${p.idx}`} cx={p.sx} cy={p.sy} r={r}
                    fill={col} stroke="var(--bg)" strokeWidth="1.1" />
                );
              }
              return (
                <rect key={`f${p.idx}`}
                  x={p.sx - r} y={p.sy - r}
                  width={r * 2} height={r * 2}
                  fill={col} stroke="var(--bg)" strokeWidth="1.1" />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mlviz-readout ktv-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>K</span>
          <span className="mlviz-val">{KERNELS[kernelIdx].label}</span>
          <span className="mlviz-sub">{KERNELS[kernelIdx].sub}</span>
          <span className="mlviz-sub">2D linear {snap(linearAcc2D * 100, 1)}%</span>
          <span className="mlviz-sub">lifted {snap(acc3D * 100, 1)}%</span>
          <span className="mlviz-sub" style={{ color: improvement > 0 ? 'var(--easy, #6ee7b7)' : 'var(--text-dim)' }}>
            {improvement >= 0 ? '+' : ''}{snap(improvement * 100, 1)}% gain
          </span>
          <span className="mlviz-sub">seed {seed}</span>
        </div>

        <div className="mlviz-row mlviz-row-hi mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">Kernel</span>
            <input
              type="range"
              min="0"
              max={KERNELS.length - 1}
              step="1"
              value={kernelIdx}
              onChange={(e) => setKernelIdx(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">{KERNELS[kernelIdx].label}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn mlviz-btn-primary"
            onClick={reveal}
            disabled={animating}
          >
            <Play size={13} />
            <span>Reveal projection</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={handleShuffle}
          >
            <Shuffle size={13} />
            <span>Re-shuffle data</span>
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
          Left: concentric rings — no straight line can split them. Right: phi(x, y) sends
          each point up by z = x^2 + y^2 (or analogue). Now a flat hyperplane slices them
          cleanly. The trick: never compute phi, only the kernel K(x, y) = phi(x) &middot; phi(y).
        </div>
      </div>

      <style>{`
        .ktv-stage {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0.4rem;
          padding: 0.6rem 0.55rem 0.3rem;
          background:
            radial-gradient(circle at 50% 30%, rgba(var(--accent-rgb, 0,255,245), 0.06), transparent 60%),
            var(--bg);
          align-items: stretch;
        }
        .ktv-panel {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }
        .ktv-panel-title {
          display: flex;
          align-items: baseline;
          gap: 0.55rem;
          padding: 0.1rem 0.2rem 0.05rem;
        }
        .ktv-panel-tag {
          font-family: var(--serif);
          font-style: italic;
          font-weight: 700;
          font-size: 0.86rem;
          color: var(--text-main);
        }
        .ktv-panel-sub {
          font-family: var(--mono);
          font-size: 0.66rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
        }
        .ktv-svg {
          width: 100%;
          aspect-ratio: 1;
          display: block;
          user-select: none;
          border: 1px solid var(--border);
          border-radius: 8px;
          background:
            radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb, 0,255,245), 0.04), transparent 65%),
            var(--surface);
        }
        .ktv-arrow {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0 0.4rem;
          color: var(--accent);
          font-family: var(--serif);
          font-style: italic;
          font-weight: 700;
          font-size: 1rem;
          gap: 0.25rem;
        }
        .ktv-arrow-glyph {
          padding: 0.22rem 0.5rem;
          border: 1px solid var(--accent);
          border-radius: 999px;
          background: rgba(var(--accent-rgb, 0,255,245), 0.08);
          font-size: 0.78rem;
        }
        .ktv-arrow-line {
          width: 1px;
          height: 1.4rem;
          background: var(--accent);
          opacity: 0.6;
        }
        .ktv-readout { gap: 0.4rem; }
        @media (max-width: 720px) {
          .ktv-stage {
            grid-template-columns: 1fr;
          }
          .ktv-arrow {
            flex-direction: row;
            justify-content: center;
            padding: 0.2rem 0;
          }
          .ktv-arrow-line {
            width: 1.4rem;
            height: 1px;
          }
        }
      `}</style>
    </div>
  );
}
