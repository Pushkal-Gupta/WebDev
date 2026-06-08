import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './MLViz.css';

const SIZE = 380;
const UNIT = 38;
const ORIGIN = SIZE / 2;
const GRID_MIN = -4;
const GRID_MAX = 4;
const N_POINTS = 80;

function snap(v) { return Math.round(v * 100) / 100; }
function snap3(v) { return Math.round(v * 1000) / 1000; }
function toScreen(x, y) { return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT }; }

/* deterministic mulberry32 PRNG */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Box-Muller standard normal */
function makeNormalPair(rng) {
  let u1 = Math.max(rng(), 1e-9);
  let u2 = rng();
  const r = Math.sqrt(-2 * Math.log(u1));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

/* 80 elongated points along a chosen angle, deterministic via fixed seed */
function generateBasePoints(stretch, shrink) {
  const rng = makeRng(2026);
  const pts = [];
  while (pts.length < N_POINTS) {
    const [a, b] = makeNormalPair(rng);
    pts.push({ u: a * stretch, v: b * shrink });
  }
  return pts;
}

function rotatePoints(pts, theta) {
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return pts.map((p) => ({
    x: p.u * c - p.v * s,
    y: p.u * s + p.v * c,
  }));
}

function mean(arr) {
  let m = 0;
  for (let i = 0; i < arr.length; i++) m += arr[i];
  return m / arr.length;
}

function covariance(pts) {
  const mx = mean(pts.map(p => p.x));
  const my = mean(pts.map(p => p.y));
  let cxx = 0, cyy = 0, cxy = 0;
  for (const p of pts) {
    const dx = p.x - mx;
    const dy = p.y - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }
  const n = pts.length - 1;
  return { cxx: cxx / n, cyy: cyy / n, cxy: cxy / n, mx, my };
}

/* eigendecomposition of 2x2 symmetric matrix [[a,b],[b,d]] sorted descending */
function eigenSym2(a, b, d) {
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.max(0, tr * tr - 4 * det);
  const sq = Math.sqrt(disc);
  const lam1 = (tr + sq) / 2;
  const lam2 = (tr - sq) / 2;
  const vecFor = (lam) => {
    let vx, vy;
    if (Math.abs(b) > 1e-9) {
      vx = b;
      vy = lam - a;
    } else if (Math.abs(a - lam) < 1e-9) {
      vx = 1; vy = 0;
    } else {
      vx = 0; vy = 1;
    }
    const n = Math.hypot(vx, vy) || 1;
    return { x: vx / n, y: vy / n };
  };
  const v1 = vecFor(lam1);
  const v2 = { x: -v1.y, y: v1.x };
  return [
    { lambda: lam1, vec: v1 },
    { lambda: lam2, vec: v2 },
  ];
}

function clampScreen(v) {
  const lim = (GRID_MAX + 0.4) * UNIT;
  return Math.max(-lim, Math.min(lim, v));
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

function VectorArrow({ x, y, color, label, strokeWidth = 2.6, opacity = 1 }) {
  const { sx, sy } = toScreen(x, y);
  const dx = sx - ORIGIN;
  const dy = sy - ORIGIN;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const angle = Math.atan2(dy, dx);
  const headLen = 10;
  const hx1 = sx - headLen * Math.cos(angle - 0.42);
  const hy1 = sy - headLen * Math.sin(angle - 0.42);
  const hx2 = sx - headLen * Math.cos(angle + 0.42);
  const hy2 = sy - headLen * Math.sin(angle + 0.42);
  return (
    <g opacity={opacity}>
      <line
        x1={ORIGIN} y1={ORIGIN} x2={sx} y2={sy}
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
      />
      <polygon points={`${sx},${sy} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
      {label && (
        <text
          x={sx + 12 * Math.cos(angle)}
          y={sy + 12 * Math.sin(angle) - 4}
          fontSize="12"
          fontWeight="700"
          fill={color}
          fontFamily="var(--serif, serif)"
          fontStyle="italic"
        >
          {label}
        </text>
      )}
    </g>
  );
}

function PCLine({ vec, color, opacity = 0.5 }) {
  if (!vec) return null;
  const scale = GRID_MAX + 0.6;
  const p1 = toScreen(vec.x * scale, vec.y * scale);
  const p2 = toScreen(-vec.x * scale, -vec.y * scale);
  return (
    <line
      x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy}
      stroke={color} strokeWidth="1" strokeDasharray="6 4" opacity={opacity}
    />
  );
}

const COLOR_PC1 = 'var(--hue-sky, #5ecbff)';
const COLOR_PC2 = 'var(--hue-pink, #ff66cc)';
const COLOR_PT = 'var(--accent)';

/* Animation phases:
   0: raw data, untouched
   1: centering (sliding to mean = 0)
   2: covariance computed (display matrix)
   3: PCs drawn (eigenvectors)
   4: projections drawn (dashed lines from points to PC1)
   5: collapsed onto PC1 (1D projection mode)
*/

export default function PCAViz() {
  const [theta, setTheta] = useState(Math.PI / 4);
  const [stretch, setStretch] = useState(2.2);
  const [shrink, setShrink] = useState(0.45);
  const [phase, setPhase] = useState(0);
  const [animProgress, setAnimProgress] = useState(0); // 0..1 for current sub-animation
  const [animating, setAnimating] = useState(false);
  const [show1D, setShow1D] = useState(false);
  const rafRef = useRef(null);

  const basePts = useMemo(() => generateBasePoints(stretch, shrink), [stretch, shrink]);
  const rawPts = useMemo(() => rotatePoints(basePts, theta), [basePts, theta]);

  const cov = useMemo(() => covariance(rawPts), [rawPts]);
  const eigs = useMemo(() => eigenSym2(cov.cxx, cov.cxy, cov.cyy), [cov]);
  const lam1 = eigs[0].lambda;
  const lam2 = eigs[1].lambda;
  const total = Math.max(1e-9, lam1 + lam2);
  const evr1 = lam1 / total;
  const evr2 = lam2 / total;

  /* centered points */
  const centeredPts = useMemo(
    () => rawPts.map(p => ({ x: p.x - cov.mx, y: p.y - cov.my })),
    [rawPts, cov]
  );

  /* PC1 unit vector */
  const pc1 = eigs[0].vec;
  const pc2 = eigs[1].vec;

  /* scale eigen arrows by sqrt(lambda) so length reflects spread */
  const pc1Arrow = useMemo(() => ({
    x: pc1.x * Math.sqrt(Math.max(0, lam1)) * 1.6,
    y: pc1.y * Math.sqrt(Math.max(0, lam1)) * 1.6,
  }), [pc1, lam1]);
  const pc2Arrow = useMemo(() => ({
    x: pc2.x * Math.sqrt(Math.max(0, lam2)) * 1.6,
    y: pc2.y * Math.sqrt(Math.max(0, lam2)) * 1.6,
  }), [pc2, lam2]);

  /* projections onto PC1 line: p_proj = (p . pc1) * pc1 */
  const projections = useMemo(() => centeredPts.map(p => {
    const dot = p.x * pc1.x + p.y * pc1.y;
    return { x: pc1.x * dot, y: pc1.y * dot, t: dot };
  }), [centeredPts, pc1]);

  const startAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(true);
    setPhase(1);
    setAnimProgress(0);
    setShow1D(false);

    const phaseDurations = [900, 600, 700, 900]; // ms for phases 1..4
    let curPhase = 1;
    let phaseStart = performance.now();

    const tick = (now) => {
      const elapsed = now - phaseStart;
      const dur = phaseDurations[curPhase - 1];
      const p = Math.min(1, elapsed / dur);
      setAnimProgress(p);
      if (p >= 1) {
        if (curPhase < 4) {
          curPhase += 1;
          setPhase(curPhase);
          phaseStart = now;
          setAnimProgress(0);
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setAnimating(false);
        }
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setPhase(0);
    setAnimProgress(0);
    setShow1D(false);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  /* reset animation when parameters change */
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setPhase(0);
    setAnimProgress(0);
    setShow1D(false);
  }, [theta, stretch, shrink]);

  const toggle1D = () => {
    if (animating) return;
    // require PCs to be computed first
    if (phase < 3) {
      setShow1D(false);
      return;
    }
    setShow1D((s) => !s);
  };

  /* compute display positions per phase */
  const displayPts = useMemo(() => {
    if (show1D) {
      // collapse fully onto PC1 line
      return projections.map(pr => ({ x: pr.x, y: pr.y }));
    }
    if (phase === 0) return rawPts;
    if (phase === 1) {
      // interpolate raw -> centered
      const t = animProgress;
      return rawPts.map((p, i) => ({
        x: p.x + (centeredPts[i].x - p.x) * t,
        y: p.y + (centeredPts[i].y - p.y) * t,
      }));
    }
    // phase 2+ : centered position
    return centeredPts;
  }, [phase, animProgress, rawPts, centeredPts, projections, show1D]);

  /* projection overlay visible from phase 4 */
  const showProjLines = phase >= 4 && !show1D;
  const showPC1Arrow = phase >= 3;
  const showPC2Arrow = phase >= 3;
  const showCovMatrix = phase >= 2;

  const arrowOpacityPC1 = showPC1Arrow ? Math.min(1, phase === 3 ? animProgress : 1) : 0;
  const arrowOpacityPC2 = showPC2Arrow ? Math.min(1, phase === 3 ? animProgress : 1) : 0;
  const projOpacity = phase === 4 ? animProgress * 0.7 : (phase > 4 ? 0.7 : 0);

  /* projected-points appearance progress for phase 4 (dots along PC1) */
  const projDotOpacity = phase === 4 ? animProgress : (phase > 4 ? 1 : 0);

  const stepLabel = (() => {
    if (show1D) return '1D projection (rank-1 reconstruction)';
    switch (phase) {
      case 0: return 'raw data';
      case 1: return 'step 1 — centering (subtract mean)';
      case 2: return 'step 2 — covariance matrix';
      case 3: return 'step 3 — eigenvectors of cov';
      case 4: return 'step 4 — project onto PC1';
      default: return '';
    }
  })();

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <Grid />

          {/* PC lines extended */}
          {phase >= 3 && (
            <>
              <PCLine vec={pc1} color={COLOR_PC1} opacity={0.55} />
              <PCLine vec={pc2} color={COLOR_PC2} opacity={0.35} />
            </>
          )}

          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {/* projection dashed lines from each point to PC1 */}
          {showProjLines && centeredPts.map((p, i) => {
            const s1 = toScreen(p.x, p.y);
            const s2 = toScreen(projections[i].x, projections[i].y);
            return (
              <line
                key={`pl${i}`}
                x1={clampScreen(s1.sx - ORIGIN) + ORIGIN}
                y1={clampScreen(s1.sy - ORIGIN) + ORIGIN}
                x2={clampScreen(s2.sx - ORIGIN) + ORIGIN}
                y2={clampScreen(s2.sy - ORIGIN) + ORIGIN}
                stroke={COLOR_PC1}
                strokeWidth="0.8"
                opacity={projOpacity}
                strokeDasharray="2 3"
              />
            );
          })}

          {/* data points */}
          {displayPts.map((p, i) => {
            const s = toScreen(p.x, p.y);
            return (
              <circle
                key={`p${i}`}
                cx={clampScreen(s.sx - ORIGIN) + ORIGIN}
                cy={clampScreen(s.sy - ORIGIN) + ORIGIN}
                r={show1D ? 2.6 : 2.4}
                fill={COLOR_PT}
                opacity={show1D ? 0.85 : 0.75}
              />
            );
          })}

          {/* projected dots along PC1 (phase 4+) */}
          {phase >= 4 && !show1D && projections.map((pr, i) => {
            const s = toScreen(pr.x, pr.y);
            return (
              <circle
                key={`pr${i}`}
                cx={clampScreen(s.sx - ORIGIN) + ORIGIN}
                cy={clampScreen(s.sy - ORIGIN) + ORIGIN}
                r="2"
                fill={COLOR_PC1}
                opacity={projDotOpacity * 0.95}
              />
            );
          })}

          {/* PC eigen-arrows */}
          {showPC2Arrow && (
            <VectorArrow
              x={pc2Arrow.x}
              y={pc2Arrow.y}
              color={COLOR_PC2}
              label={(phase >= 3 && arrowOpacityPC2 > 0.4) ? 'PC₂' : null}
              opacity={arrowOpacityPC2}
              strokeWidth={2.4}
            />
          )}
          {showPC1Arrow && (
            <VectorArrow
              x={pc1Arrow.x}
              y={pc1Arrow.y}
              color={COLOR_PC1}
              label={(phase >= 3 && arrowOpacityPC1 > 0.4) ? 'PC₁' : null}
              opacity={arrowOpacityPC1}
              strokeWidth={2.8}
            />
          )}

          {/* step caption */}
          <text
            x={10}
            y={SIZE - 10}
            fontSize="10.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            letterSpacing="0.08em"
          >
            {stepLabel}
          </text>
        </svg>
      </div>

      <div className="mt-controls">
        <div className="mlviz-slider">
          <span className="mlviz-slider-label">rotate</span>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={theta}
            onChange={(e) => setTheta(Number(e.target.value))}
            disabled={animating}
          />
          <span className="mlviz-slider-val">{snap(theta * 180 / Math.PI)}°</span>
        </div>
        <div className="mlviz-slider">
          <span className="mlviz-slider-label">stretch</span>
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.05}
            value={stretch}
            onChange={(e) => setStretch(Number(e.target.value))}
            disabled={animating}
          />
          <span className="mlviz-slider-val">{snap(stretch)}</span>
        </div>
        <div className="mlviz-slider">
          <span className="mlviz-slider-label">shrink</span>
          <input
            type="range"
            min={0.05}
            max={3}
            step={0.05}
            value={shrink}
            onChange={(e) => setShrink(Number(e.target.value))}
            disabled={animating}
          />
          <span className="mlviz-slider-val">{snap(shrink)}</span>
        </div>
      </div>

      <div className="mlviz-readout mlviz-btn-row" style={{ flexDirection: 'row', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={startAnim}
          disabled={animating}
        >
          Compute PCA
        </button>
        <button
          type="button"
          className={`mlviz-btn${show1D ? ' mlviz-btn-primary' : ''}`}
          onClick={toggle1D}
          disabled={animating || phase < 3}
        >
          {show1D ? 'Show 2D' : 'Show 1D projection'}
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={reset}
          disabled={animating || (phase === 0 && !show1D)}
        >
          Reset
        </button>
        <span className="mlviz-hint" style={{ marginTop: 0, alignSelf: 'center' }}>
          slide rotate / stretch / shrink to test edge cases
        </span>
      </div>

      <div className="mlviz-readout">
        {showCovMatrix && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag">Σ</span>
            <span className="mlviz-val">
              [[{snap(cov.cxx)}, {snap(cov.cxy)}], [{snap(cov.cxy)}, {snap(cov.cyy)}]]
            </span>
            <span className="mlviz-sub">covariance after centering</span>
          </div>
        )}
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_PC1 }}>λ₁</span>
          <span className="mlviz-val">{snap3(lam1)}</span>
          <span className="mlviz-sub">EVR = {(evr1 * 100).toFixed(1)}%</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_PC2 }}>λ₂</span>
          <span className="mlviz-val">{snap3(lam2)}</span>
          <span className="mlviz-sub">EVR = {(evr2 * 100).toFixed(1)}%</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_PC1 }}>v₁</span>
          <span className="mlviz-val">[{snap(pc1.x)}, {snap(pc1.y)}]</span>
          <span className="mlviz-sub">PC₁ direction</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_PC2 }}>v₂</span>
          <span className="mlviz-val">[{snap(pc2.x)}, {snap(pc2.y)}]</span>
          <span className="mlviz-sub">PC₂ direction (orthogonal)</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">μ</span>
          <span className="mlviz-val">[{snap(cov.mx)}, {snap(cov.my)}]</span>
          <span className="mlviz-sub">sample mean (pre-centering)</span>
        </div>
        <div className="mlviz-hint">
          PC₁ captures the direction of maximum variance — projecting onto it preserves {(evr1 * 100).toFixed(0)}% of the spread
        </div>
      </div>
    </div>
  );
}
