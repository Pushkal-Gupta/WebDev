import React, { useState, useMemo } from 'react';
import './MLViz.css';

const SIZE = 380;
const UNIT = 32;
const ORIGIN = SIZE / 2;
const GRID_MIN = -6;
const GRID_MAX = 6;

function snap(v) { return Math.round(v * 100) / 100; }

function toScreen(x, y) {
  return { sx: ORIGIN + x * UNIT, sy: ORIGIN - y * UNIT };
}

function applyMatrix(M, x, y) {
  return { x: M.a * x + M.b * y, y: M.c * x + M.d * y };
}

function VectorArrow({ x, y, color, label, opacity = 1, dashed = false, glow = false }) {
  const { sx, sy } = toScreen(x, y);
  const dx = sx - ORIGIN;
  const dy = sy - ORIGIN;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const angle = Math.atan2(dy, dx);
  const headLen = 11;
  const hx1 = sx - headLen * Math.cos(angle - 0.42);
  const hy1 = sy - headLen * Math.sin(angle - 0.42);
  const hx2 = sx - headLen * Math.cos(angle + 0.42);
  const hy2 = sy - headLen * Math.sin(angle + 0.42);
  return (
    <g opacity={opacity}>
      {glow && !dashed && (
        <line
          x1={ORIGIN} y1={ORIGIN} x2={sx} y2={sy}
          stroke={color} strokeWidth="5.5" strokeLinecap="round"
          filter="url(#mt-glow)" opacity="0.5"
        />
      )}
      <line
        x1={ORIGIN} y1={ORIGIN} x2={sx} y2={sy}
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
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

function OriginalGrid() {
  const lines = [];
  for (let i = GRID_MIN; i <= GRID_MAX; i++) {
    const { sy } = toScreen(0, i);
    const { sx } = toScreen(i, 0);
    const isAxis = i === 0;
    lines.push(
      <line
        key={`oh${i}`}
        x1="0" y1={sy} x2={SIZE} y2={sy}
        stroke="var(--border)"
        strokeWidth={isAxis ? 1 : 0.4}
        opacity={isAxis ? 0.6 : 0.45}
      />
    );
    lines.push(
      <line
        key={`ov${i}`}
        x1={sx} y1="0" x2={sx} y2={SIZE}
        stroke="var(--border)"
        strokeWidth={isAxis ? 1 : 0.4}
        opacity={isAxis ? 0.6 : 0.45}
      />
    );
  }
  return <g>{lines}</g>;
}

function TransformedGrid({ M }) {
  const lines = [];
  for (let i = GRID_MIN; i <= GRID_MAX; i++) {
    const isAxis = i === 0;
    // horizontal line y = i, from x=GRID_MIN to x=GRID_MAX
    const h1 = applyMatrix(M, GRID_MIN, i);
    const h2 = applyMatrix(M, GRID_MAX, i);
    const a = toScreen(h1.x, h1.y);
    const b = toScreen(h2.x, h2.y);
    lines.push(
      <line
        key={`th${i}`}
        x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
        stroke="var(--accent)"
        strokeWidth={isAxis ? 1.4 : 0.7}
        opacity={isAxis ? 0.95 : 0.55}
      />
    );
    // vertical line x = i, from y=GRID_MIN to y=GRID_MAX
    const v1 = applyMatrix(M, i, GRID_MIN);
    const v2 = applyMatrix(M, i, GRID_MAX);
    const c = toScreen(v1.x, v1.y);
    const d = toScreen(v2.x, v2.y);
    lines.push(
      <line
        key={`tv${i}`}
        x1={c.sx} y1={c.sy} x2={d.sx} y2={d.sy}
        stroke="var(--accent)"
        strokeWidth={isAxis ? 1.4 : 0.7}
        opacity={isAxis ? 0.95 : 0.55}
      />
    );
  }
  return <g>{lines}</g>;
}

function BasisHull({ M }) {
  // unit square (0,0)-(1,0)-(1,1)-(0,1) transformed
  const p00 = toScreen(0, 0);
  const p10s = applyMatrix(M, 1, 0);
  const p11s = applyMatrix(M, 1, 1);
  const p01s = applyMatrix(M, 0, 1);
  const p10 = toScreen(p10s.x, p10s.y);
  const p11 = toScreen(p11s.x, p11s.y);
  const p01 = toScreen(p01s.x, p01s.y);
  const det = M.a * M.d - M.b * M.c;
  const fill = det < 0 ? 'var(--hue-pink)' : 'var(--accent)';
  return (
    <polygon
      points={`${p00.sx},${p00.sy} ${p10.sx},${p10.sy} ${p11.sx},${p11.sy} ${p01.sx},${p01.sy}`}
      fill={fill}
      opacity="0.12"
      stroke={fill}
      strokeWidth="1"
      strokeOpacity="0.5"
    />
  );
}

const PRESETS = [
  { name: 'Identity', M: { a: 1, b: 0, c: 0, d: 1 } },
  { name: 'Rotate 90°', M: { a: 0, b: -1, c: 1, d: 0 } },
  { name: 'Shear', M: { a: 1, b: 1, c: 0, d: 1 } },
  { name: 'Scale 2x', M: { a: 2, b: 0, c: 0, d: 2 } },
];

const V = { x: 1.5, y: 0.8 };

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

export default function MatrixTransform() {
  const [M, setM] = useState({ a: 1, b: 1, c: 0, d: 1 });

  const setCell = (key) => (val) => {
    const n = Number(val);
    setM((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
  };

  const det = useMemo(() => M.a * M.d - M.b * M.c, [M]);
  const vPrime = useMemo(() => applyMatrix(M, V.x, V.y), [M]);
  const iHat = useMemo(() => applyMatrix(M, 1, 0), [M]);
  const jHat = useMemo(() => applyMatrix(M, 0, 1), [M]);

  const detNote = useMemo(() => {
    if (Math.abs(det) < 1e-9) return 'collapses to a line — area becomes zero';
    if (det < 0) return `flips orientation, area scales by ${snap(Math.abs(det))}×`;
    if (Math.abs(det - 1) < 1e-9) return 'preserves area';
    return `area scales by ${snap(det)}×`;
  }, [det]);

  const applyPreset = (preset) => setM({ ...preset.M });

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mlviz-svg">
          <defs>
            <filter id="mt-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <OriginalGrid />
          <BasisHull M={M} />
          <TransformedGrid M={M} />
          <circle cx={ORIGIN} cy={ORIGIN} r="5" fill="var(--accent)" opacity="0.3" filter="url(#mt-glow)" />
          <circle cx={ORIGIN} cy={ORIGIN} r="3" fill="var(--text-dim)" />

          {/* original v faded */}
          <VectorArrow x={V.x} y={V.y} color="var(--text-dim)" opacity={0.45} dashed />

          {/* transformed basis vectors */}
          <VectorArrow x={iHat.x} y={iHat.y} color="var(--hue-sky)" label="i'" opacity={0.85} glow />
          <VectorArrow x={jHat.x} y={jHat.y} color="var(--hue-pink)" label="j'" opacity={0.85} glow />

          {/* transformed v */}
          <VectorArrow x={vPrime.x} y={vPrime.y} color="var(--accent)" label="v'" glow />
        </svg>
      </div>

      <div className="mt-controls">
        <div className="mt-matrix">
          <span className="mt-bracket mt-bracket-l">[</span>
          <div className="mt-grid">
            <MatrixInput label="a" value={M.a} onChange={setCell('a')} color="var(--hue-sky)" />
            <MatrixInput label="b" value={M.b} onChange={setCell('b')} color="var(--hue-pink)" />
            <MatrixInput label="c" value={M.c} onChange={setCell('c')} color="var(--hue-sky)" />
            <MatrixInput label="d" value={M.d} onChange={setCell('d')} color="var(--hue-pink)" />
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

      <div className="mlviz-readout">
        <div className="mlviz-statcol mlviz-statrow">
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">v</span>
            <span className="mlviz-statcard-val">[{snap(V.x)}, {snap(V.y)}]</span>
            <span className="gv-card-sub">original</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">v' = M·v</span>
            <span className="mlviz-statcard-val">[{snap(vPrime.x)}, {snap(vPrime.y)}]</span>
            <span className="gv-card-sub">transformed</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">det</span>
            <span className="mlviz-statcard-val">{snap(det)}</span>
            <span className="gv-card-sub">{detNote}</span>
          </div>
        </div>
        <div className="mlviz-hint">edit a, b, c, d or pick a preset</div>
      </div>
    </div>
  );
}
