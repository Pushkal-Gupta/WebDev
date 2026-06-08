import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './MLViz.css';

const SIZE = 380;
const UNIT = 36;
const ORIGIN = SIZE / 2;
const GRID_MIN = -5;
const GRID_MAX = 5;

const COLOR_U = 'var(--hue-sky, #5ecbff)';
const COLOR_V = 'var(--hue-mint, #6ee7b7)';
const COLOR_P = 'var(--accent)';
const COLOR_PERP = 'var(--hue-pink, #ff66cc)';

function snap(v) { return Math.round(v * 100) / 100; }
function snap1(v) { return Math.round(v * 10) / 10; }

function toScreen(x, y) {
  return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT };
}

function fromScreen(sx, sy) {
  return { x: (sx - ORIGIN) / UNIT, y: (ORIGIN - sy) / UNIT };
}

function katexHtml(tex, displayMode = false) {
  return katex.renderToString(tex, { throwOnError: false, displayMode, output: 'html' });
}

function VectorArrow({ x, y, color, label, opacity = 1, dashed = false, strokeWidth = 2.5 }) {
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
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <polygon points={`${sx},${sy} ${hx1},${hy1} ${hx2},${hy2}`} fill={color} />
      {label && (
        <text
          x={sx + 10 * Math.cos(angle)}
          y={sy + 10 * Math.sin(angle) - 4}
          fontSize="13"
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

function Grid() {
  const lines = [];
  for (let i = GRID_MIN; i <= GRID_MAX; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
    const isAxis = i === 0;
    lines.push(
      <line key={`h${i}`} x1="0" y1={sy} x2={SIZE} y2={sy}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4}
        opacity={isAxis ? 0.7 : 0.45} />
    );
    lines.push(
      <line key={`v${i}`} x1={sx} y1="0" x2={sx} y2={SIZE}
        stroke="var(--border)" strokeWidth={isAxis ? 1.2 : 0.4}
        opacity={isAxis ? 0.7 : 0.45} />
    );
  }
  return <g>{lines}</g>;
}

// Extend v's line across the canvas as a dashed guide.
function SpanLine({ vx, vy, color, opacity = 0.45 }) {
  const len = Math.hypot(vx, vy);
  if (len < 1e-6) return null;
  const ux = vx / len;
  const uy = vy / len;
  const scale = GRID_MAX + 1.2;
  const p1 = toScreen(ux * scale, uy * scale);
  const p2 = toScreen(-ux * scale, -uy * scale);
  return (
    <line
      x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy}
      stroke={color} strokeWidth="1" strokeDasharray="6 4" opacity={opacity}
    />
  );
}

// Small right-angle marker at the foot of the perpendicular.
function RightAngleMark({ px, py, vx, vy, ux, uy, size = 9 }) {
  const lenV = Math.hypot(vx, vy);
  if (lenV < 1e-6) return null;
  const vhx = vx / lenV;
  const vhy = vy / lenV;
  // perpendicular direction toward u's tip
  let nhx = -vhy;
  let nhy = vhx;
  // make sure the normal points toward u's tip (not away)
  const toUx = ux - px;
  const toUy = uy - py;
  if (toUx * nhx + toUy * nhy < 0) {
    nhx = -nhx;
    nhy = -nhy;
  }
  // 3 corners of the mini square in world coords
  const s = size / UNIT;
  const c1 = { x: px + vhx * s, y: py + vhy * s };
  const c2 = { x: c1.x + nhx * s, y: c1.y + nhy * s };
  const c3 = { x: px + nhx * s, y: py + nhy * s };
  const a = toScreen(c1.x, c1.y);
  const b = toScreen(c2.x, c2.y);
  const c = toScreen(c3.x, c3.y);
  return (
    <polyline
      points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy}`}
      fill="none"
      stroke={COLOR_P}
      strokeWidth="1.2"
      opacity="0.85"
    />
  );
}

function randomVec() {
  // random non-trivial vector in [-4, 4], avoid near-zero
  const pick = () => {
    let v = Math.random() * 8 - 4;
    if (Math.abs(v) < 1) v += v < 0 ? -1 : 1;
    return snap1(v);
  };
  return { x: pick(), y: pick() };
}

const DEFAULT_U = { x: 1.5, y: 3 };
const DEFAULT_V = { x: 4, y: 1 };

export default function ProjectionViz() {
  const svgRef = useRef(null);
  const [u, setU] = useState(DEFAULT_U);
  const [v, setV] = useState(DEFAULT_V);
  const [dragging, setDragging] = useState(null); // 'u' | 'v' | null
  const [t, setT] = useState(0); // 0..1 perpendicular-drop animation
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);

  // Run the drop animation when either vector changes.
  const startAnim = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 700;
    setAnimating(true);
    setT(0);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      // easeOutCubic for a softer landing
      const eased = 1 - Math.pow(1 - p, 3);
      setT(eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setAnimating(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // Kick off the animation on mount.
  useEffect(() => {
    startAnim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = (cx - rect.left) * (SIZE / rect.width);
    const sy = (cy - rect.top) * (SIZE / rect.height);
    const { x, y } = fromScreen(sx, sy);
    const clamp = (n) => Math.max(GRID_MIN, Math.min(GRID_MAX, snap1(n)));
    const next = { x: clamp(x), y: clamp(y) };
    if (dragging === 'u') setU(next);
    if (dragging === 'v') setV(next);
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(null);
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

  const dot = u.x * v.x + u.y * v.y;
  const vDotV = v.x * v.x + v.y * v.y;
  const lenV = Math.sqrt(vDotV);
  const scalar = lenV < 1e-9 ? 0 : dot / lenV;      // u·v / |v|
  const k = vDotV < 1e-9 ? 0 : dot / vDotV;          // u·v / v·v
  const proj = { x: k * v.x, y: k * v.y };
  // animated tip falling onto v's line
  const animTip = { x: u.x + (proj.x - u.x) * t, y: u.y + (proj.y - u.y) * t };

  const formulaHtml = useMemo(
    () => katexHtml(
      '\\operatorname{proj}_{\\mathbf{v}}\\mathbf{u} = \\dfrac{\\mathbf{u} \\cdot \\mathbf{v}}{\\mathbf{v} \\cdot \\mathbf{v}}\\,\\mathbf{v}',
      false,
    ),
    [],
  );

  const numericHtml = useMemo(() => {
    if (vDotV < 1e-9) return katexHtml('\\mathbf{v} = \\mathbf{0}\\;\\Rightarrow\\;\\text{undefined}', false);
    const tex = `\\dfrac{${snap(dot)}}{${snap(vDotV)}}\\,\\mathbf{v} = ${snap(k)}\\,\\mathbf{v} = [${snap(proj.x)},\\,${snap(proj.y)}]`;
    return katexHtml(tex, false);
  }, [dot, vDotV, k, proj.x, proj.y]);

  const reset = () => {
    setU(DEFAULT_U);
    setV(DEFAULT_V);
    setT(0);
    setTimeout(startAnim, 30);
  };

  const sample = () => {
    let nu = randomVec();
    let nv = randomVec();
    // ensure v isn't degenerate
    if (Math.hypot(nv.x, nv.y) < 0.5) nv = { x: 2, y: 1 };
    setU(nu);
    setV(nv);
    setT(0);
    setTimeout(startAnim, 30);
  };

  const uScreen = toScreen(u.x, u.y);
  const vScreen = toScreen(v.x, v.y);
  const pScreen = toScreen(proj.x, proj.y);
  const animTipScreen = toScreen(animTip.x, animTip.y);

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mlviz-svg"
          onMouseDown={(e) => { e.preventDefault(); }}
        >
          <Grid />

          {/* infinite span of v as a guide */}
          <SpanLine vx={v.x} vy={v.y} color={COLOR_V} opacity={0.4} />

          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {/* projection vector (from origin to P) — under the input arrows */}
          {vDotV > 1e-9 && (
            <VectorArrow
              x={proj.x} y={proj.y}
              color={COLOR_P}
              label={t > 0.5 ? 'proj' : null}
              strokeWidth={3.2}
              opacity={0.95}
            />
          )}

          {/* animated perpendicular: from u's tip down to animated foot */}
          {vDotV > 1e-9 && (
            <line
              x1={uScreen.sx} y1={uScreen.sy}
              x2={animTipScreen.sx} y2={animTipScreen.sy}
              stroke={COLOR_PERP}
              strokeWidth="1.6"
              strokeDasharray="4 4"
              opacity={t > 0 ? 0.85 : 0}
            />
          )}

          {/* projection foot marker P */}
          {vDotV > 1e-9 && t > 0.6 && (
            <>
              <RightAngleMark
                px={proj.x} py={proj.y}
                vx={v.x} vy={v.y}
                ux={u.x} uy={u.y}
              />
              <circle
                cx={pScreen.sx} cy={pScreen.sy}
                r="4.5"
                fill={COLOR_P}
                stroke="var(--bg)"
                strokeWidth="1.5"
              />
              <text
                x={pScreen.sx + 8}
                y={pScreen.sy - 8}
                fontSize="12"
                fontWeight="700"
                fill={COLOR_P}
                fontFamily="var(--serif, serif)"
                fontStyle="italic"
              >
                P
              </text>
            </>
          )}

          {/* u and v on top */}
          <VectorArrow x={v.x} y={v.y} color={COLOR_V} label="v" />
          <VectorArrow x={u.x} y={u.y} color={COLOR_U} label="u" />

          {/* drag handles */}
          <circle
            cx={uScreen.sx} cy={uScreen.sy} r="10"
            fill={COLOR_U} opacity="0.2"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => { e.preventDefault(); setDragging('u'); }}
            onTouchStart={(e) => { e.preventDefault(); setDragging('u'); }}
          />
          <circle
            cx={vScreen.sx} cy={vScreen.sy} r="10"
            fill={COLOR_V} opacity="0.22"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => { e.preventDefault(); setDragging('v'); }}
            onTouchStart={(e) => { e.preventDefault(); setDragging('v'); }}
          />
        </svg>
      </div>

      <div className="mlviz-readout mlviz-btn-row" style={{ flexDirection: 'row', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={startAnim}
          disabled={animating || vDotV < 1e-9}
        >
          Drop perpendicular
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={sample}
          disabled={animating}
        >
          Sample
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={reset}
          disabled={animating}
        >
          Reset
        </button>
        <span className="mlviz-hint" style={{ marginTop: 0, alignSelf: 'center' }}>
          drag either dot
        </span>
      </div>

      <div className="mlviz-readout">
        <div
          className="ml-math"
          style={{ margin: '0 0 0.55rem', fontSize: '0.95rem' }}
          dangerouslySetInnerHTML={{ __html: formulaHtml }}
        />
        <div
          className="ml-math"
          style={{ margin: '0 0 0.4rem', fontSize: '0.88rem', color: 'var(--text-dim)' }}
          dangerouslySetInnerHTML={{ __html: numericHtml }}
        />

        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_U }}>u</span>
          <span className="mlviz-val">[{snap(u.x)}, {snap(u.y)}]</span>
          <span className="mlviz-sub">‖u‖ = {snap(Math.hypot(u.x, u.y))}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_V }}>v</span>
          <span className="mlviz-val">[{snap(v.x)}, {snap(v.y)}]</span>
          <span className="mlviz-sub">‖v‖ = {snap(lenV)}</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag">u · v</span>
          <span className="mlviz-val">{snap(dot)}</span>
          <span className="mlviz-sub">|v|² = {snap(vDotV)}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">scalar</span>
          <span className="mlviz-val">{snap(scalar)}</span>
          <span className="mlviz-sub">= u·v / ‖v‖ — signed length along v</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_P }}>proj</span>
          <span className="mlviz-val">[{snap(proj.x)}, {snap(proj.y)}]</span>
          <span className="mlviz-sub">k = {snap(k)}</span>
        </div>
        <div className="mlviz-hint">
          the dashed pink segment is the perpendicular from u onto v's line
        </div>
      </div>
    </div>
  );
}
