import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Move, Target } from 'lucide-react';
import './LaVectorSpanViz.css';

const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -6;
const Y_MAX = 6;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

export default function LaVectorSpanViz() {
  const [v, setV] = useState({ x: 2, y: 1 });
  const [w, setW] = useState({ x: -1, y: 2 });
  const [target, setTarget] = useState({ x: 3, y: 3 });
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

  // Solve target = s*v + t*w via Cramer's rule.
  const det = v.x * w.y - v.y * w.x;
  const dependent = Math.abs(det) < 0.04;
  const s = dependent ? 0 : (target.x * w.y - target.y * w.x) / det;
  const t = dependent ? 0 : (v.x * target.y - v.y * target.x) / det;

  const onPointerDown = (which) => (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag(which);
  };
  const onPointerMove = (e) => {
    if (!drag || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const py = ((e.clientY - rect.top) / rect.height) * H;
    const nx = Math.max(X_MIN, Math.min(X_MAX, invX(px)));
    const ny = Math.max(Y_MIN, Math.min(Y_MAX, invY(py)));
    const pt = { x: Math.round(nx * 2) / 2, y: Math.round(ny * 2) / 2 };
    if (drag === 'v') setV(pt);
    else if (drag === 'w') setW(pt);
    else setTarget(pt);
  };
  const onPointerUp = () => setDrag(null);

  const reset = () => {
    setV({ x: 2, y: 1 });
    setW({ x: -1, y: 2 });
    setTarget({ x: 3, y: 3 });
  };

  const gridLines = useMemo(() => {
    const lines = [];
    for (let g = X_MIN; g <= X_MAX; g++) {
      lines.push(<line key={`gx${g}`} x1={sx(g)} y1={sy(Y_MIN)} x2={sx(g)} y2={sy(Y_MAX)} className="lvs-grid" />);
      lines.push(<line key={`gy${g}`} x1={sx(X_MIN)} y1={sy(g)} x2={sx(X_MAX)} y2={sy(g)} className="lvs-grid" />);
    }
    return lines;
  }, [sx, sy]);

  // Span polygon covering the whole plane when the vectors are independent.
  const spanFill = dependent
    ? null
    : `${sx(X_MIN)},${sy(Y_MIN)} ${sx(X_MAX)},${sy(Y_MIN)} ${sx(X_MAX)},${sy(Y_MAX)} ${sx(X_MIN)},${sy(Y_MAX)}`;

  const arrow = (vec, cls, label, idHead) => {
    const ang = Math.atan2(sy(vec.y) - sy(0), sx(vec.x) - sx(0));
    return (
      <g>
        <line x1={sx(0)} y1={sy(0)} x2={sx(vec.x)} y2={sy(vec.y)} className={cls} markerEnd={`url(#${idHead})`} />
        <circle cx={sx(vec.x)} cy={sy(vec.y)} r={9} className={`${cls}-halo`} />
        <text x={sx(vec.x) + Math.cos(ang) * 16} y={sy(vec.y) + Math.sin(ang) * 16 + 4} className="lvs-vlbl" textAnchor="middle">{label}</text>
      </g>
    );
  };

  return (
    <div className="lvs">
      <div className="lvs-head">
        <div className="lvs-head-icon"><Move size={18} /></div>
        <div className="lvs-head-text">
          <h3 className="lvs-title">Span and linear combinations</h3>
          <p className="lvs-sub">
            Drag the two basis vectors <span dangerouslySetInnerHTML={{ __html: km('\\mathbf{v}') }} /> and{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\mathbf{w}') }} />, then drag the target. The shaded region is their span; the readout shows the unique mix that reaches the target.
          </p>
        </div>
        <button type="button" className="lvs-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="lvs-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="lvs-svg" preserveAspectRatio="xMidYMid meet"
          onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <defs>
            <marker id="lvs-head-v" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="lvs-head-w" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-violet)" />
            </marker>
            <marker id="lvs-head-t" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {dependent ? (
            <line
              x1={sx(v.x * -6)} y1={sy(v.y * -6)} x2={sx(v.x * 6)} y2={sy(v.y * 6)}
              className="lvs-span-line"
            />
          ) : (
            <polygon points={spanFill} className="lvs-span-fill" />
          )}

          {gridLines}
          <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} className="lvs-axis" />
          <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} className="lvs-axis" />

          {/* parallelogram of the combination s*v + t*w when reachable */}
          {!dependent && (
            <polygon
              points={`${sx(0)},${sy(0)} ${sx(s * v.x)},${sy(s * v.y)} ${sx(target.x)},${sy(target.y)} ${sx(t * w.x)},${sy(t * w.y)}`}
              className="lvs-combo"
            />
          )}

          {arrow(v, 'lvs-v', 'v', 'lvs-head-v')}
          {arrow(w, 'lvs-w', 'w', 'lvs-head-w')}
          <line x1={sx(0)} y1={sy(0)} x2={sx(target.x)} y2={sy(target.y)} className="lvs-t" markerEnd="url(#lvs-head-t)" />

          {/* draggable handles */}
          <circle cx={sx(v.x)} cy={sy(v.y)} r={11} className="lvs-handle lvs-handle-v" onPointerDown={onPointerDown('v')} />
          <circle cx={sx(w.x)} cy={sy(w.y)} r={11} className="lvs-handle lvs-handle-w" onPointerDown={onPointerDown('w')} />
          <circle cx={sx(target.x)} cy={sy(target.y)} r={11} className="lvs-handle lvs-handle-t" onPointerDown={onPointerDown('target')} />
          <g transform={`translate(${sx(target.x)}, ${sy(target.y)})`} className="lvs-target-mark">
            <Target size={14} x={-7} y={-7} />
          </g>
        </svg>
      </div>

      <div className="lvs-stats">
        <div className="lvs-statcard lvs-accent">
          <span className="lvs-stat-label">vector v</span>
          <span className="lvs-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mathbf{v} = (${v.x}, ${v.y})`) }} />
        </div>
        <div className="lvs-statcard lvs-violet">
          <span className="lvs-stat-label">vector w</span>
          <span className="lvs-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mathbf{w} = (${w.x}, ${w.y})`) }} />
        </div>
        <div className="lvs-statcard lvs-pink">
          <span className="lvs-stat-label">target</span>
          <span className="lvs-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\mathbf{b} = (${target.x}, ${target.y})`) }} />
        </div>
        <div className="lvs-statcard">
          <span className="lvs-stat-label">det(v, w)</span>
          <span className="lvs-stat-val" dangerouslySetInnerHTML={{ __html: km(`${det.toFixed(2)}`) }} />
        </div>
      </div>

      <div className="lvs-trace">
        <span className="lvs-trace-label">reading</span>
        <span className="lvs-trace-body">
          {dependent ? (
            <>The vectors are parallel (det <span dangerouslySetInnerHTML={{ __html: km('\\approx 0') }} />), so their span collapses to a single line. Most targets are unreachable; the two directions are linearly dependent.</>
          ) : (
            <>Independent vectors span the whole plane. The target is{' '}
              <span dangerouslySetInnerHTML={{ __html: km(`\\mathbf{b} = ${s.toFixed(2)}\\,\\mathbf{v} + ${t.toFixed(2)}\\,\\mathbf{w}`) }} /> — a unique linear combination.</>
          )}
        </span>
      </div>
    </div>
  );
}
