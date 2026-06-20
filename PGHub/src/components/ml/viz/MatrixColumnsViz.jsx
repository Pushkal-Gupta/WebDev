import React, { useState, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const SIZE = 260;
const PAD = 26;
const SPAN = 3.4;
const xScale = (SIZE - 2 * PAD) / (2 * SPAN);
const yScale = (SIZE - 2 * PAD) / (2 * SPAN);
const sx = (x) => PAD + (x + SPAN) * xScale;
const sy = (y) => SIZE - PAD - (y + SPAN) * yScale;

const PRESETS = [
  { label: 'identity', m: [[1, 0], [0, 1]] },
  { label: 'scale 2x', m: [[2, 0], [0, 2]] },
  { label: 'shear', m: [[1, 1], [0, 1]] },
  { label: 'rotate 45°', m: [[0.707, -0.707], [0.707, 0.707]] },
  { label: 'flip x', m: [[-1, 0], [0, 1]] },
  { label: 'reading', m: [[2, -1], [0, 3]] },
];

function GridPanel({ m, applyTransform, idPrefix, accentI, accentJ }) {
  const showCols = applyTransform;

  const iLand = applyTransform ? [m[0][0], m[1][0]] : [1, 0];
  const jLand = applyTransform ? [m[0][1], m[1][1]] : [0, 1];

  const gridLines = [];
  for (let g = -3; g <= 3; g++) {
    if (applyTransform) {
      const p1 = [m[0][0] * g + m[0][1] * -3, m[1][0] * g + m[1][1] * -3];
      const p2 = [m[0][0] * g + m[0][1] * 3, m[1][0] * g + m[1][1] * 3];
      gridLines.push({ key: `v-${g}`, x1: sx(p1[0]), y1: sy(p1[1]), x2: sx(p2[0]), y2: sy(p2[1]) });
      const q1 = [m[0][0] * -3 + m[0][1] * g, m[1][0] * -3 + m[1][1] * g];
      const q2 = [m[0][0] * 3 + m[0][1] * g, m[1][0] * 3 + m[1][1] * g];
      gridLines.push({ key: `h-${g}`, x1: sx(q1[0]), y1: sy(q1[1]), x2: sx(q2[0]), y2: sy(q2[1]) });
    } else {
      gridLines.push({ key: `v-${g}`, x1: sx(g), y1: sy(-3), x2: sx(g), y2: sy(3) });
      gridLines.push({ key: `h-${g}`, x1: sx(-3), y1: sy(g), x2: sx(3), y2: sy(g) });
    }
  }

  const arrowI = `mcv-arrow-i-${idPrefix}`;
  const arrowJ = `mcv-arrow-j-${idPrefix}`;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mcv-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={arrowI} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={accentI} />
        </marker>
        <marker id={arrowJ} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={accentJ} />
        </marker>
      </defs>

      {gridLines.map((l) => (
        <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="var(--border)" strokeWidth="0.6" opacity="0.45" />
      ))}

      <line x1={PAD - 4} y1={sy(0)} x2={SIZE - PAD + 4} y2={sy(0)} stroke="var(--text-dim)" strokeWidth="1" />
      <line x1={sx(0)} y1={PAD - 4} x2={sx(0)} y2={SIZE - PAD + 4} stroke="var(--text-dim)" strokeWidth="1" />

      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(iLand[0])}
        y2={sy(iLand[1])}
        stroke={accentI}
        strokeWidth="2.8"
        markerEnd={`url(#${arrowI})`}
      />
      <text
        x={sx(iLand[0]) + 6}
        y={sy(iLand[1]) - 4}
        fontSize="12"
        fontFamily="var(--serif)"
        fontStyle="italic"
        fontWeight="700"
        fill={accentI}
      >
        {showCols ? "i' = col₁" : 'î'}
      </text>

      <line
        x1={sx(0)}
        y1={sy(0)}
        x2={sx(jLand[0])}
        y2={sy(jLand[1])}
        stroke={accentJ}
        strokeWidth="2.8"
        markerEnd={`url(#${arrowJ})`}
      />
      <text
        x={sx(jLand[0]) + 6}
        y={sy(jLand[1]) - 4}
        fontSize="12"
        fontFamily="var(--serif)"
        fontStyle="italic"
        fontWeight="700"
        fill={accentJ}
      >
        {showCols ? "j' = col₂" : 'ĵ'}
      </text>

      <circle cx={sx(0)} cy={sy(0)} r="3" fill="var(--text-main)" />
    </svg>
  );
}

export default function MatrixColumnsViz() {
  const [a, setA] = useState(2);
  const [b, setB] = useState(-1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(3);

  const m = useMemo(() => [[a, b], [c, d]], [a, b, c, d]);
  const det = a * d - b * c;

  const onCell = (setter) => (e) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') {
      setter(0);
      return;
    }
    const n = parseFloat(raw);
    if (!Number.isNaN(n)) setter(Math.max(-4, Math.min(4, n)));
  };

  const applyPreset = (p) => {
    setA(p.m[0][0]);
    setB(p.m[0][1]);
    setC(p.m[1][0]);
    setD(p.m[1][1]);
  };

  const reset = () => applyPreset(PRESETS[5]);

  const accentI = 'var(--hue-sky, #38bdf8)';
  const accentJ = 'var(--hue-pink, #f472b6)';

  return (
    <div className="mlviz-wrap">
      <div className="mcv-grid">
        <div className="mcv-panel">
          <div className="mcv-panel-label">before</div>
          <GridPanel m={m} applyTransform={false} idPrefix="before" accentI={accentI} accentJ={accentJ} />
        </div>
        <div className="mcv-panel">
          <div className="mcv-panel-label">after M</div>
          <GridPanel m={m} applyTransform idPrefix="after" accentI={accentI} accentJ={accentJ} />
        </div>
      </div>

      <div className="mcv-matrix-row">
        <span className="mt-bracket">[</span>
        <div className="mt-grid">
          <div className="mt-cell">
            <span className="mt-cell-label" style={{ color: accentI }}>a</span>
            <input className="mt-cell-input" type="number" step="0.5" value={a} onChange={onCell(setA)} />
          </div>
          <div className="mt-cell">
            <span className="mt-cell-label" style={{ color: accentJ }}>b</span>
            <input className="mt-cell-input" type="number" step="0.5" value={b} onChange={onCell(setB)} />
          </div>
          <div className="mt-cell">
            <span className="mt-cell-label" style={{ color: accentI }}>c</span>
            <input className="mt-cell-input" type="number" step="0.5" value={c} onChange={onCell(setC)} />
          </div>
          <div className="mt-cell">
            <span className="mt-cell-label" style={{ color: accentJ }}>d</span>
            <input className="mt-cell-input" type="number" step="0.5" value={d} onChange={onCell(setD)} />
          </div>
        </div>
        <span className="mt-bracket">]</span>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: accentI }}>col₁</span>
          <span className="mlviz-val">= [{a}, {c}]</span>
          <span className="mlviz-sub">where î = [1, 0] lands</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: accentJ }}>col₂</span>
          <span className="mlviz-val">= [{b}, {d}]</span>
          <span className="mlviz-sub">where ĵ = [0, 1] lands</span>
        </div>
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>det</span>
          <span className="mlviz-val">= ad − bc = {det.toFixed(2)}</span>
          <span className="mlviz-sub">signed area scaling of one unit square</span>
        </div>
      </div>

      <div className="mt-controls">
        <div className="mt-presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="mt-preset-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" className="mlviz-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
