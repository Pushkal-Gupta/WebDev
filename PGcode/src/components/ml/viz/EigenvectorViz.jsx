import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import './MLViz.css';

const SIZE = 380;
const UNIT = 50;
const ORIGIN = SIZE / 2;
const GRID_MIN = -3;
const GRID_MAX = 3;

function snap(v) { return Math.round(v * 100) / 100; }
function snap1(v) { return Math.round(v * 10) / 10; }

function toScreen(x, y) {
  return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT };
}

function fromScreen(sx, sy) {
  return { x: (sx - ORIGIN) / UNIT, y: (ORIGIN - sy) / UNIT };
}

function applyMatrix(M, x, y) {
  return { x: M.a * x + M.b * y, y: M.c * x + M.d * y };
}

function eigenAnalyze(M) {
  const tr = M.a + M.d;
  const det = M.a * M.d - M.b * M.c;
  const disc = tr * tr - 4 * det;
  const out = { trace: tr, det, disc, real: disc >= -1e-9, defective: false, eigs: [] };
  if (disc < -1e-9) {
    out.real = false;
    const re = tr / 2;
    const im = Math.sqrt(-disc) / 2;
    out.complex = { re, im };
    return out;
  }
  const sq = Math.sqrt(Math.max(0, disc));
  const lam1 = (tr + sq) / 2;
  const lam2 = (tr - sq) / 2;
  const findEigvec = (lam) => {
    // (M - lam I) v = 0
    const a = M.a - lam;
    const b = M.b;
    const c = M.c;
    const d = M.d - lam;
    // pick non-degenerate row
    let vx, vy;
    if (Math.abs(b) > 1e-9 || Math.abs(a) > 1e-9) {
      // a*vx + b*vy = 0 => choose vy = a if |b| > eps else vx=1
      if (Math.abs(b) > 1e-9) { vx = b; vy = -a; }
      else { vx = 1; vy = 0; }
    } else if (Math.abs(c) > 1e-9 || Math.abs(d) > 1e-9) {
      if (Math.abs(d) > 1e-9) { vx = d; vy = -c; }
      else { vx = 0; vy = 1; }
    } else {
      vx = 1; vy = 0;
    }
    const n = Math.hypot(vx, vy);
    if (n < 1e-9) return { x: 1, y: 0 };
    return { x: vx / n, y: vy / n };
  };
  const v1 = findEigvec(lam1);
  const v2 = findEigvec(lam2);
  // detect defective: same eigenvalue and parallel eigenvectors
  const sameLam = Math.abs(lam1 - lam2) < 1e-6;
  const cross = v1.x * v2.y - v1.y * v2.x;
  if (sameLam && Math.abs(cross) < 1e-6) {
    out.defective = true;
  }
  out.eigs = [
    { lambda: lam1, vec: v1 },
    { lambda: lam2, vec: v2 },
  ];
  return out;
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
        strokeDasharray={dashed ? '4 4' : undefined}
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

function EigenLine({ vec, color, opacity = 0.45 }) {
  if (!vec) return null;
  // extend a unit eigenvector across the full canvas
  const scale = (GRID_MAX + 0.5);
  const p1 = toScreen(vec.x * scale, vec.y * scale);
  const p2 = toScreen(-vec.x * scale, -vec.y * scale);
  return (
    <line
      x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy}
      stroke={color} strokeWidth="1" strokeDasharray="6 4" opacity={opacity}
    />
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

const PRESETS = [
  { name: 'Symmetric', M: { a: 2, b: 1, c: 1, d: 2 } },
  { name: 'Rotation 30°', M: { a: Math.cos(Math.PI / 6), b: -Math.sin(Math.PI / 6), c: Math.sin(Math.PI / 6), d: Math.cos(Math.PI / 6) } },
  { name: 'Shear', M: { a: 1, b: 1, c: 0, d: 1 } },
  { name: 'Axis Scale', M: { a: 2, b: 0, c: 0, d: 3 } },
];

function MatrixInput({ label, value, onChange, color }) {
  return (
    <label className="mt-cell">
      <span className="mt-cell-label" style={{ color }}>{label}</span>
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

export default function EigenvectorViz() {
  const svgRef = useRef(null);
  const [M, setM] = useState({ a: 2, b: 1, c: 1, d: 2 });
  const [v, setV] = useState({ x: 1.4, y: -0.6 });
  const [dragging, setDragging] = useState(false);
  const [t, setT] = useState(0); // 0..1 animation progress
  const [animating, setAnimating] = useState(false);
  const rafRef = useRef(null);

  const setCell = (key) => (val) => {
    const n = Number(val);
    setM((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const applyPreset = (preset) => {
    setM({ ...preset.M });
    setT(0);
    setAnimating(false);
  };

  const eig = useMemo(() => eigenAnalyze(M), [M]);

  const handleMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    const sx = (cx - rect.left) * (SIZE / rect.width);
    const sy = (cy - rect.top) * (SIZE / rect.height);
    const { x, y } = fromScreen(sx, sy);
    const clamp = (n) => Math.max(GRID_MIN, Math.min(GRID_MAX, snap1(n)));
    setV({ x: clamp(x), y: clamp(y) });
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

  const startAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 1100;
    setAnimating(true);
    setT(0);
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      setT(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
      else setAnimating(false);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const reset = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setAnimating(false);
    setT(0);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  // interpolate vectors based on t
  const interp = (vec) => {
    const Mv = applyMatrix(M, vec.x, vec.y);
    return { x: vec.x + (Mv.x - vec.x) * t, y: vec.y + (Mv.y - vec.y) * t };
  };

  const Mv = applyMatrix(M, v.x, v.y);
  const vAnim = interp(v);

  const eig1 = eig.real ? eig.eigs[0] : null;
  const eig2 = eig.real ? eig.eigs[1] : null;
  // pick reference points along eigen-direction
  const e1Vec = eig1 ? { x: eig1.vec.x * 1.5, y: eig1.vec.y * 1.5 } : null;
  const e2Vec = eig2 ? { x: eig2.vec.x * 1.5, y: eig2.vec.y * 1.5 } : null;
  const e1Anim = e1Vec ? interp(e1Vec) : null;
  const e2Anim = e2Vec ? interp(e2Vec) : null;

  const COLOR_E1 = 'var(--hue-sky, #5ecbff)';
  const COLOR_E2 = 'var(--hue-pink, #ff66cc)';
  const COLOR_V = 'var(--accent)';
  const COLOR_MV = 'var(--hue-violet, #b288ff)';

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <Grid />

          {/* eigen direction lines (extended through origin) */}
          {eig1 && <EigenLine vec={eig1.vec} color={COLOR_E1} opacity={0.55} />}
          {eig2 && <EigenLine vec={eig2.vec} color={COLOR_E2} opacity={0.55} />}

          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {/* original eigenvectors faded when animating */}
          {eig1 && e1Vec && (
            <VectorArrow
              x={e1Vec.x} y={e1Vec.y}
              color={COLOR_E1}
              opacity={t > 0 ? 0.35 : 0.95}
              dashed={t > 0}
              label={t === 0 ? 'v₁' : null}
            />
          )}
          {eig2 && e2Vec && (
            <VectorArrow
              x={e2Vec.x} y={e2Vec.y}
              color={COLOR_E2}
              opacity={t > 0 ? 0.35 : 0.95}
              dashed={t > 0}
              label={t === 0 ? 'v₂' : null}
            />
          )}

          {/* animated eigenvectors (stretched along their lines) */}
          {eig1 && e1Anim && t > 0 && (
            <VectorArrow
              x={e1Anim.x} y={e1Anim.y}
              color={COLOR_E1}
              opacity={0.95}
              label={t > 0.6 ? `λ₁v₁` : null}
            />
          )}
          {eig2 && e2Anim && t > 0 && (
            <VectorArrow
              x={e2Anim.x} y={e2Anim.y}
              color={COLOR_E2}
              opacity={0.95}
              label={t > 0.6 ? `λ₂v₂` : null}
            />
          )}

          {/* arbitrary draggable v */}
          <VectorArrow
            x={v.x} y={v.y}
            color={COLOR_V}
            opacity={t > 0 ? 0.35 : 1}
            dashed={t > 0}
            label={t === 0 ? 'v' : null}
            strokeWidth={2.5}
          />

          {/* animated v -> Mv */}
          {t > 0 && (
            <VectorArrow
              x={vAnim.x} y={vAnim.y}
              color={COLOR_MV}
              opacity={0.95}
              label={t > 0.6 ? 'Mv' : null}
            />
          )}

          {/* drag handle on v */}
          <circle
            cx={toScreen(v.x, v.y).sx}
            cy={toScreen(v.x, v.y).sy}
            r="9"
            fill={COLOR_V}
            opacity="0.22"
            style={{ cursor: 'grab' }}
            onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
            onTouchStart={(e) => { e.preventDefault(); setDragging(true); }}
          />
        </svg>
      </div>

      <div className="mt-controls">
        <div className="mt-matrix">
          <span className="mt-bracket mt-bracket-l">[</span>
          <div className="mt-grid">
            <MatrixInput label="a" value={snap(M.a)} onChange={setCell('a')} color={COLOR_E1} />
            <MatrixInput label="b" value={snap(M.b)} onChange={setCell('b')} color={COLOR_E2} />
            <MatrixInput label="c" value={snap(M.c)} onChange={setCell('c')} color={COLOR_E1} />
            <MatrixInput label="d" value={snap(M.d)} onChange={setCell('d')} color={COLOR_E2} />
          </div>
          <span className="mt-bracket mt-bracket-r">]</span>
        </div>

        <div className="mt-presets">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="mt-preset-btn"
              onClick={() => applyPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mlviz-readout mlviz-btn-row" style={{ flexDirection: 'row', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="mlviz-btn mlviz-btn-primary"
          onClick={startAnim}
          disabled={animating}
        >
          Apply M
        </button>
        <button
          type="button"
          className="mlviz-btn"
          onClick={reset}
          disabled={animating || t === 0}
        >
          Reset
        </button>
        <span className="mlviz-hint" style={{ marginTop: 0, alignSelf: 'center' }}>
          drag the teal dot to set v
        </span>
      </div>

      <div className="mlviz-readout">
        {!eig.real && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag">no real eigvecs</span>
            <span className="mlviz-val">
              λ = {snap(eig.complex.re)} ± {snap(eig.complex.im)}i
            </span>
            <span className="mlviz-sub">pure rotation — no fixed direction in R²</span>
          </div>
        )}
        {eig.real && eig.defective && (
          <div className="mlviz-row mlviz-row-hi">
            <span className="mlviz-tag">defective</span>
            <span className="mlviz-val">repeated λ = {snap(eig1.lambda)}</span>
            <span className="mlviz-sub">only one independent eigenvector</span>
          </div>
        )}
        {eig.real && eig1 && (
          <div className="mlviz-row">
            <span className="mlviz-tag" style={{ color: COLOR_E1 }}>λ₁</span>
            <span className="mlviz-val">{snap(eig1.lambda)}</span>
            <span className="mlviz-sub">
              v₁ = [{snap(eig1.vec.x)}, {snap(eig1.vec.y)}]
            </span>
          </div>
        )}
        {eig.real && eig2 && !eig.defective && (
          <div className="mlviz-row">
            <span className="mlviz-tag" style={{ color: COLOR_E2 }}>λ₂</span>
            <span className="mlviz-val">{snap(eig2.lambda)}</span>
            <span className="mlviz-sub">
              v₂ = [{snap(eig2.vec.x)}, {snap(eig2.vec.y)}]
            </span>
          </div>
        )}
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: COLOR_V }}>v</span>
          <span className="mlviz-val">[{snap(v.x)}, {snap(v.y)}]</span>
          <span className="mlviz-sub">arbitrary</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: COLOR_MV }}>Mv</span>
          <span className="mlviz-val">[{snap(Mv.x)}, {snap(Mv.y)}]</span>
          <span className="mlviz-sub">rotates off its line</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag">det</span>
          <span className="mlviz-val">{snap(eig.det)}</span>
          <span className="mlviz-sub">tr = {snap(eig.trace)} = λ₁ + λ₂</span>
        </div>
        <div className="mlviz-hint">
          eigenvectors stay on their dashed lines — only their length scales by λ
        </div>
      </div>
    </div>
  );
}
