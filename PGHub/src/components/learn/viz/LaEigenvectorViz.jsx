import React, { useMemo, useRef, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Compass, Anchor, RotateCw } from 'lucide-react';
import './LaEigenvectorViz.css';

const X_MIN = -6;
const X_MAX = 6;
const Y_MIN = -6;
const Y_MAX = 6;
const PROBE_COUNT = 24;

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const PRESETS = {
  shear: { a: 1, b: 1, c: 0, d: 1 },
  scale: { a: 2, b: 0, c: 0, d: 0.5 },
  stretch: { a: 2, b: 1, c: 1, d: 2 },
  rotation: { a: 0, b: -1, c: 1, d: 0 },
  flip: { a: 1, b: 0, c: 0, d: -1 },
};

// Eigen-decomposition of a real 2x2 matrix via trace/determinant quadratic.
// lambda^2 - (tr)lambda + det = 0  ->  lambda = (tr +/- sqrt(tr^2 - 4det)) / 2.
function eigen2x2(m) {
  const tr = m.a + m.d;
  const det = m.a * m.d - m.b * m.c;
  const disc = tr * tr - 4 * det;
  if (disc < -1e-9) {
    return { complex: true, tr, det, disc };
  }
  const root = Math.sqrt(Math.max(0, disc));
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  // Eigenvector for lambda: null space of (A - lambda I).
  // Rows are [a-l, b] and [c, d-l]; pick the better-conditioned row.
  const vecFor = (l) => {
    const r1x = m.a - l, r1y = m.b;
    const r2x = m.c, r2y = m.d - l;
    let vx, vy;
    if (Math.hypot(r1x, r1y) >= Math.hypot(r2x, r2y)) {
      vx = -r1y; vy = r1x;
    } else {
      vx = -r2y; vy = r2x;
    }
    const n = Math.hypot(vx, vy);
    if (n < 1e-9) return { x: 1, y: 0 }; // scalar matrix: any direction works
    return { x: vx / n, y: vy / n };
  };
  return { complex: false, l1, l2, v1: vecFor(l1), v2: vecFor(l2), tr, det, disc };
}

export default function LaEigenvectorViz() {
  const [mat, setMat] = useState(PRESETS.stretch);
  const svgRef = useRef(null);

  const W = 760;
  const H = 460;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sx = useCallback((x) => pad + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW, [plotW]);
  const sy = useCallback((y) => pad + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * plotH, [plotH]);

  const apply = useCallback((x, y) => [mat.a * x + mat.b * y, mat.c * x + mat.d * y], [mat]);

  const eig = useMemo(() => eigen2x2(mat), [mat]);

  const reset = () => setMat(PRESETS.stretch);
  const setEntry = (key) => (e) => {
    const v = parseFloat(e.target.value);
    setMat((m) => ({ ...m, [key]: v }));
  };

  // Probe vectors around the unit circle, each shown before and after the transform.
  const probes = useMemo(() => {
    const out = [];
    for (let i = 0; i < PROBE_COUNT; i++) {
      const ang = (i / PROBE_COUNT) * Math.PI * 2;
      const px = Math.cos(ang) * 2.4;
      const py = Math.sin(ang) * 2.4;
      const [tx, ty] = apply(px, py);
      out.push({ px, py, tx, ty });
    }
    return out;
  }, [apply]);

  const grid = useMemo(() => {
    const lines = [];
    for (let g = X_MIN; g <= X_MAX; g++) {
      lines.push(<line key={`gx${g}`} x1={sx(g)} y1={sy(Y_MIN)} x2={sx(g)} y2={sy(Y_MAX)} className="lev-grid" />);
      lines.push(<line key={`gy${g}`} x1={sx(X_MIN)} y1={sy(g)} x2={sx(X_MAX)} y2={sy(g)} className="lev-grid" />);
    }
    return lines;
  }, [sx, sy]);

  // Eigen-line endpoints (a full line through origin in the eigen direction).
  const eigenLine = (v) => {
    const span = 5.6;
    return { x1: sx(-v.x * span), y1: sy(-v.y * span), x2: sx(v.x * span), y2: sy(v.y * span) };
  };

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmt = (n) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
  const fmtVec = (v) => `\\begin{bmatrix} ${fmt(v.x)} \\\\ ${fmt(v.y)} \\end{bmatrix}`;

  return (
    <div className="lev">
      <div className="lev-head">
        <div className="lev-head-icon"><Compass size={18} /></div>
        <div className="lev-head-text">
          <h3 className="lev-title">Eigenvectors: the directions that hold their line</h3>
          <p className="lev-sub">
            Faint arrows around the circle are vectors before the transform; bold arrows are where{' '}
            <span dangerouslySetInnerHTML={{ __html: km('A') }} /> sends them. The highlighted lines are eigenvectors — they only stretch by{' '}
            <span dangerouslySetInnerHTML={{ __html: km('\\lambda') }} />, never swinging off their own line.
          </p>
        </div>
        <button type="button" className="lev-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="lev-presets">
        {Object.keys(PRESETS).map((name) => (
          <button key={name} type="button" className="lev-chip" onClick={() => setMat(PRESETS[name])}>{name}</button>
        ))}
      </div>

      <div className="lev-controls">
        {(['a', 'b', 'c', 'd']).map((key) => (
          <label key={key} className="lev-slider">
            <span className="lev-slider-key" dangerouslySetInnerHTML={{ __html: km(key) }} />
            <input type="range" min="-3" max="3" step="0.25" value={mat[key]} onChange={setEntry(key)} />
            <span className="lev-slider-val">{mat[key].toFixed(2)}</span>
          </label>
        ))}
      </div>

      <div className="lev-stage">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="lev-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="lev-head-pre" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
            <marker id="lev-head-post" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--hue-sky)" />
            </marker>
            <marker id="lev-head-e1" markerWidth="11" markerHeight="11" refX="7" refY="3.2" orient="auto">
              <path d="M0,0 L7,3.2 L0,6.4 Z" fill="var(--accent)" />
            </marker>
            <marker id="lev-head-e2" markerWidth="11" markerHeight="11" refX="7" refY="3.2" orient="auto">
              <path d="M0,0 L7,3.2 L0,6.4 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          {grid}
          <line x1={sx(X_MIN)} y1={sy(0)} x2={sx(X_MAX)} y2={sy(0)} className="lev-axis" />
          <line x1={sx(0)} y1={sy(Y_MIN)} x2={sx(0)} y2={sy(Y_MAX)} className="lev-axis" />

          {probes.map((p, i) => (
            <line key={`pre${i}`} x1={sx(0)} y1={sy(0)} x2={sx(p.px)} y2={sy(p.py)}
              className="lev-pre" markerEnd="url(#lev-head-pre)" />
          ))}
          {probes.map((p, i) => (
            <line key={`post${i}`} x1={sx(0)} y1={sy(0)} x2={sx(p.tx)} y2={sy(p.ty)}
              className={reduced ? 'lev-post' : 'lev-post lev-post-anim'} markerEnd="url(#lev-head-post)" />
          ))}

          {!eig.complex && (
            <>
              <line {...eigenLine(eig.v1)} className="lev-eigenline lev-eigenline-1" />
              <line {...eigenLine(eig.v2)} className="lev-eigenline lev-eigenline-2" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(eig.v1.x * 2.4)} y2={sy(eig.v1.y * 2.4)}
                className="lev-eigenvec lev-eigenvec-1" markerEnd="url(#lev-head-e1)" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(eig.v2.x * 2.4)} y2={sy(eig.v2.y * 2.4)}
                className="lev-eigenvec lev-eigenvec-2" markerEnd="url(#lev-head-e2)" />
            </>
          )}

          {eig.complex && (
            <g className="lev-rot-note">
              <RotateCw x={sx(0) - 14} y={sy(0) - 14} width={28} height={28} className="lev-rot-icon" />
            </g>
          )}
        </svg>
      </div>

      {eig.complex ? (
        <div className="lev-stats lev-stats-rot">
          <div className="lev-statcard lev-warn">
            <span className="lev-stat-label">no real eigenvectors</span>
            <span className="lev-stat-val">
              Every direction swings off its line — this transform rotates space, so its eigenvalues are complex
              {' '}(<span dangerouslySetInnerHTML={{ __html: km(`\\Delta = ${fmt(eig.disc)} < 0`) }} />). There is no real line that stays put.
            </span>
          </div>
        </div>
      ) : (
        <div className="lev-stats">
          <div className="lev-statcard lev-accent">
            <span className="lev-stat-label">eigenvalue 1</span>
            <span className="lev-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\lambda_1 = ${fmt(eig.l1)}`) }} />
            <span className="lev-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\mathbf{v}_1 = ${fmtVec(eig.v1)}`) }} />
          </div>
          <div className="lev-statcard lev-pink">
            <span className="lev-stat-label">eigenvalue 2</span>
            <span className="lev-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\lambda_2 = ${fmt(eig.l2)}`) }} />
            <span className="lev-stat-sub" dangerouslySetInnerHTML={{ __html: km(`\\mathbf{v}_2 = ${fmtVec(eig.v2)}`) }} />
          </div>
          <div className="lev-statcard">
            <span className="lev-stat-label">trace / det</span>
            <span className="lev-stat-val" dangerouslySetInnerHTML={{ __html: km(`\\text{tr} = ${fmt(eig.tr)},\\ \\det = ${fmt(eig.det)}`) }} />
          </div>
        </div>
      )}

      <div className="lev-trace">
        <span className="lev-trace-label"><Anchor size={12} /> reading</span>
        <span className="lev-trace-body">
          {eig.complex
            ? 'Complex eigenvalues mean the matrix has a rotational component: it sends every real direction somewhere new, so no real arrow comes back onto its own line. Lower the off-diagonal twist (b, c) toward symmetry to recover real eigenvectors.'
            : Math.abs(eig.disc) < 1e-6
              ? `Repeated eigenvalue ${fmt(eig.l1)}: the two eigen-lines have merged into one direction. This transform is on the edge of being defective — it scales that single line by ${fmt(eig.l1)} and twists everything else.`
              : `Two real eigen-lines. Vectors along the teal line scale by ${fmt(eig.l1)}; along the pink line they scale by ${fmt(eig.l2)}. Every other vector swings between them, pulled hardest toward the larger eigenvalue.`}
        </span>
      </div>
    </div>
  );
}
