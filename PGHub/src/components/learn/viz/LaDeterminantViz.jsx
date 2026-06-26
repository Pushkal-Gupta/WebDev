import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Square, FlipHorizontal2 } from 'lucide-react';
import './LaDeterminantViz.css';

const X_MIN = -5;
const X_MAX = 5;
const Y_MIN = -5;
const Y_MAX = 5;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function LaDeterminantViz() {
  // Columns of the matrix = images of i-hat and j-hat.
  const [iHat, setIHat] = useState({ x: 2, y: 0.5 });
  const [jHat, setJHat] = useState({ x: 0.5, y: 2 });
  const [drag, setDrag] = useState(null);
  const svgRef = useRef(null);

  const W = 720;
  const H = 460;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sx = useCallback((x) => pad + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((y) => pad + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);
  const invX = useCallback((px) => X_MIN + ((px - pad) / plotW) * (X_MAX - X_MIN), [plotW]);
  const invY = useCallback((py) => Y_MIN + (1 - (py - pad) / plotH) * (Y_MAX - Y_MIN), [plotH]);

  const det = iHat.x * jHat.y - iHat.y * jHat.x;
  const flipped = det < -0.001;
  const collapsed = Math.abs(det) < 0.05;

  const onPointerDown = (which) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(which);
  };
  const onPointerMove = (e) => {
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const nx = Math.max(X_MIN, Math.min(X_MAX, invX(((e.clientX - rect.left) / rect.width) * W)));
    const ny = Math.max(Y_MIN, Math.min(Y_MAX, invY(((e.clientY - rect.top) / rect.height) * H)));
    const pt = { x: Math.round(nx * 4) / 4, y: Math.round(ny * 4) / 4 };
    if (drag === 'i') setIHat(pt);
    else setJHat(pt);
  };
  const onPointerUp = () => setDrag(null);

  const reset = () => { setIHat({ x: 2, y: 0.5 }); setJHat({ x: 0.5, y: 2 }); };

  const gridLines = useMemo(() => {
    const lines = [];
    for (let g = X_MIN; g <= X_MAX; g++) {
      lines.push(<line key={`gx${g}`} x1={sx(g)} y1={sy(Y_MIN)} x2={sx(g)} y2={sy(Y_MAX)} className="ldt-grid" />);
      lines.push(<line key={`gy${g}`} x1={sx(X_MIN)} y1={sy(g)} x2={sx(X_MAX)} y2={sy(g)} className="ldt-grid" />);
    }
    return lines;
  }, [sx, sy]);

  // Parallelogram: 0, i, i+j, j
  const para = [
    [0, 0], [iHat.x, iHat.y], [iHat.x + jHat.x, iHat.y + jHat.y], [jHat.x, jHat.y],
  ].map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ');

  const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ');

  const fillClass = collapsed ? 'ldt-para ldt-collapsed' : flipped ? 'ldt-para ldt-flip' : 'ldt-para';

  return (
    <div className="ldt">
      <div className="ldt-head">
        <div className="ldt-head-icon"><Square size={18} /></div>
        <div className="ldt-head-text">
          <h3 className="ldt-title">Determinant as signed area</h3>
          <p className="ldt-sub">
            Drag the two column vectors. The unit square (area 1) becomes a parallelogram; its signed area <em>is</em> the determinant. Cross the columns over and the sign flips.
          </p>
        </div>
        <button type="button" className="ldt-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="ldt-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="ldt-svg" preserveAspectRatio="xMidYMid meet"
          onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <defs>
            <marker id="ldt-head-i" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="ldt-head-j" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-violet)" />
            </marker>
          </defs>

          {gridLines}
          <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} className="ldt-axis" />
          <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} className="ldt-axis" />

          <polygon points={unitSquare} className="ldt-unit" />
          <polygon points={para} className={fillClass} />

          <line x1={sx(0)} y1={sy(0)} x2={sx(iHat.x)} y2={sy(iHat.y)} className="ldt-i" markerEnd="url(#ldt-head-i)" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(jHat.x)} y2={sy(jHat.y)} className="ldt-j" markerEnd="url(#ldt-head-j)" />

          <circle cx={sx(iHat.x)} cy={sy(iHat.y)} r={11} className="ldt-handle ldt-handle-i" onPointerDown={onPointerDown('i')} />
          <circle cx={sx(jHat.x)} cy={sy(jHat.y)} r={11} className="ldt-handle ldt-handle-j" onPointerDown={onPointerDown('j')} />
        </svg>
      </div>

      <div className="ldt-stats">
        <div className="ldt-statcard ldt-accent">
          <span className="ldt-stat-label">column 1 (i-hat)</span>
          <span className="ldt-stat-val" dangerouslySetInnerHTML={{ __html: km(`(${iHat.x}, ${iHat.y})`) }} />
        </div>
        <div className="ldt-statcard ldt-violet">
          <span className="ldt-stat-label">column 2 (j-hat)</span>
          <span className="ldt-stat-val" dangerouslySetInnerHTML={{ __html: km(`(${jHat.x}, ${jHat.y})`) }} />
        </div>
        <div className={collapsed ? 'ldt-statcard ldt-warn' : flipped ? 'ldt-statcard ldt-warn' : 'ldt-statcard ldt-green'}>
          <span className="ldt-stat-label">det = ad - bc</span>
          <span className="ldt-stat-val" dangerouslySetInnerHTML={{ __html: km(`${(iHat.x).toFixed(2)}\\cdot${(jHat.y).toFixed(2)} - ${(jHat.x).toFixed(2)}\\cdot${(iHat.y).toFixed(2)} = ${det.toFixed(2)}`) }} />
        </div>
      </div>

      <div className="ldt-trace">
        <span className="ldt-trace-label">{flipped ? <FlipHorizontal2 size={12} /> : null} reading</span>
        <span className="ldt-trace-body">
          {collapsed
            ? 'The two columns are parallel, so the parallelogram has zero area: det = 0. Space is squashed onto a line and the matrix has no inverse.'
            : flipped
              ? `The columns are in clockwise order, so orientation reversed: det = ${det.toFixed(2)} is negative. Area scales by ${Math.abs(det).toFixed(2)}, and space is mirrored.`
              : `Areas scale by ${det.toFixed(2)} with orientation preserved. The unit square of area 1 becomes a parallelogram of area ${det.toFixed(2)}.`}
        </span>
      </div>
    </div>
  );
}
