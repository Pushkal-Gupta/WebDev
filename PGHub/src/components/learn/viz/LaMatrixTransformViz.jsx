import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Grid3x3, Sparkles } from 'lucide-react';
import './LaMatrixTransformViz.css';

const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -6;
const Y_MAX = 6;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const PRESETS = {
  identity: { a: 1, b: 0, c: 0, d: 1 },
  rotate: { a: 0, b: -1, c: 1, d: 0 },
  shear: { a: 1, b: 1, c: 0, d: 1 },
  scale: { a: 2, b: 0, c: 0, d: 1 },
};

// A small house shape (closed polygon) in model coordinates.
const SHAPE = [
  [-1, -1], [1, -1], [1, 0.6], [0, 1.6], [-1, 0.6],
];

export default function LaMatrixTransformViz() {
  const [mat, setMat] = useState(PRESETS.shear);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);

  const W = 760;
  const H = 460;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sx = useCallback((x) => pad + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((y) => pad + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);
  const invX = useCallback((px) => X_MIN + ((px - pad) / plotW) * (X_MAX - X_MIN), [plotW]);
  const invY = useCallback((py) => Y_MIN + (1 - (py - pad) / plotH) * (Y_MAX - Y_MIN), [plotH]);

  const apply = useCallback((x, y) => [mat.a * x + mat.b * y, mat.c * x + mat.d * y], [mat]);
  const det = mat.a * mat.d - mat.b * mat.c;

  const onPointerDown = (which) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(which);
  };
  const onPointerMove = (e) => {
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const nx = Math.max(X_MIN, Math.min(X_MAX, invX(((e.clientX - rect.left) / rect.width) * W)));
    const ny = Math.max(Y_MIN, Math.min(Y_MAX, invY(((e.clientY - rect.top) / rect.height) * H)));
    const rx = Math.round(nx * 2) / 2;
    const ry = Math.round(ny * 2) / 2;
    if (drag === 'i') setMat((m) => ({ ...m, a: rx, c: ry }));
    else setMat((m) => ({ ...m, b: rx, d: ry }));
  };
  const onPointerUp = () => setDrag(null);

  const reset = () => setMat(PRESETS.shear);

  // Transformed grid lines (every integer line warps under the matrix).
  const warpedGrid = useMemo(() => {
    const lines = [];
    for (let g = X_MIN; g <= X_MAX; g++) {
      const va = apply(g, Y_MIN), vb = apply(g, Y_MAX);
      lines.push(<line key={`wx${g}`} x1={sx(va[0])} y1={sy(va[1])} x2={sx(vb[0])} y2={sy(vb[1])} className="lmt-wgrid" />);
      const ha = apply(X_MIN, g), hb = apply(X_MAX, g);
      lines.push(<line key={`wy${g}`} x1={sx(ha[0])} y1={sy(ha[1])} x2={sx(hb[0])} y2={sy(hb[1])} className="lmt-wgrid" />);
    }
    return lines;
  }, [apply, sx, sy]);

  const unitSquare = useMemo(() => {
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => apply(x, y));
    return corners.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ');
  }, [apply, sx, sy]);

  const shapePts = useMemo(
    () => SHAPE.map(([x, y]) => apply(x, y)).map(([x, y]) => `${sx(x)},${sy(y)}`).join(' '),
    [apply, sx, sy]
  );
  const shapeOrig = useMemo(() => SHAPE.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' '), [sx, sy]);

  const iHat = apply(1, 0);
  const jHat = apply(0, 1);

  return (
    <div className="lmt">
      <div className="lmt-head">
        <div className="lmt-head-icon"><Grid3x3 size={18} /></div>
        <div className="lmt-head-text">
          <h3 className="lmt-title">A matrix warps space</h3>
          <p className="lmt-sub">
            Drag the tips of <span dangerouslySetInnerHTML={{ __html: km('\\hat{\\imath}') }} /> and{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\hat{\\jmath}') }} /> — they are the matrix columns. The grid, unit square, and shape all transform with them.
          </p>
        </div>
        <button type="button" className="lmt-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="lmt-presets">
        {Object.entries(PRESETS).map(([name, m]) => (
          <button key={name} type="button" className="lmt-chip" onClick={() => setMat(m)}>{name}</button>
        ))}
      </div>

      <div className="lmt-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="lmt-svg" preserveAspectRatio="xMidYMid meet"
          onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <defs>
            <marker id="lmt-head-i" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="lmt-head-j" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-violet)" />
            </marker>
          </defs>

          {/* faint original grid for reference */}
          <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} className="lmt-axis" />
          <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} className="lmt-axis" />

          {warpedGrid}

          <polygon points={unitSquare} className={det < 0 ? 'lmt-square lmt-flipped' : 'lmt-square'} />
          <polygon points={shapeOrig} className="lmt-shape-orig" />
          <polygon points={shapePts} className="lmt-shape" />

          <line x1={sx(0)} y1={sy(0)} x2={sx(iHat[0])} y2={sy(iHat[1])} className="lmt-i" markerEnd="url(#lmt-head-i)" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(jHat[0])} y2={sy(jHat[1])} className="lmt-j" markerEnd="url(#lmt-head-j)" />

          <circle cx={sx(iHat[0])} cy={sy(iHat[1])} r={11} className="lmt-handle lmt-handle-i" onPointerDown={onPointerDown('i')} />
          <circle cx={sx(jHat[0])} cy={sy(jHat[1])} r={11} className="lmt-handle lmt-handle-j" onPointerDown={onPointerDown('j')} />
          <text x={sx(iHat[0])} y={sy(iHat[1]) - 16} className="lmt-lbl lmt-lbl-i" textAnchor="middle">i&#770;</text>
          <text x={sx(jHat[0])} y={sy(jHat[1]) - 16} className="lmt-lbl lmt-lbl-j" textAnchor="middle">j&#770;</text>
        </svg>
      </div>

      <div className="lmt-stats">
        <div className="lmt-statcard lmt-mat">
          <span className="lmt-stat-label">matrix</span>
          <span className="lmt-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\begin{bmatrix} ${mat.a} & ${mat.b} \\\\ ${mat.c} & ${mat.d} \\end{bmatrix}`) }} />
        </div>
        <div className="lmt-statcard lmt-accent">
          <span className="lmt-stat-label">i-hat lands</span>
          <span className="lmt-stat-val" dangerouslySetInnerHTML={{ __html: km(`(${mat.a}, ${mat.c})`) }} />
        </div>
        <div className="lmt-statcard lmt-violet">
          <span className="lmt-stat-label">j-hat lands</span>
          <span className="lmt-stat-val" dangerouslySetInnerHTML={{ __html: km(`(${mat.b}, ${mat.d})`) }} />
        </div>
        <div className="lmt-statcard">
          <span className="lmt-stat-label">det (area scale)</span>
          <span className="lmt-stat-val" dangerouslySetInnerHTML={{ __html: km(`${det.toFixed(2)}`) }} />
        </div>
      </div>

      <div className="lmt-trace">
        <span className="lmt-trace-label"><Sparkles size={12} /> reading</span>
        <span className="lmt-trace-body">
          {Math.abs(det) < 0.04
            ? 'The columns are parallel, so space is crushed onto a line — the transformation is not invertible (det = 0).'
            : det < 0
              ? `Orientation flipped (det = ${det.toFixed(2)} < 0): the transformation mirrors space while scaling area by ${Math.abs(det).toFixed(2)}.`
              : `Space stays right-handed; every area is scaled by ${det.toFixed(2)}. The columns show exactly where the basis vectors land.`}
        </span>
      </div>
    </div>
  );
}
