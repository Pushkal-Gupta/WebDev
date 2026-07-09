import React, { useMemo, useState } from 'react';
import { Move, RotateCw, Maximize2, RotateCcw, Layers, MoveRight } from 'lucide-react';
import './GfxTransformViz.css';

// 2D homogeneous transform explorer. Slider-driven, fully deterministic (no RNG).
// A triangle in object space is scaled / rotated / translated by a composed 3x3 matrix.

const identity = () => [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function matmul(A, B) {
  const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j];
  return C;
}

function applyPt(M, x, y) {
  const nx = M[0][0] * x + M[0][1] * y + M[0][2];
  const ny = M[1][0] * x + M[1][1] * y + M[1][2];
  const w = M[2][0] * x + M[2][1] * y + M[2][2];
  return [nx / w, ny / w];
}

const T = (tx, ty) => [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
const S = (sx, sy) => [[sx, 0, 0], [0, sy, 0], [0, 0, 1]];
function R(deg) {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

// The object-space triangle (asymmetric so rotation/scale read clearly).
const TRI = [[0, 0], [1.6, 0], [0, 1]];

const W = 440;
const H = 440;
const UNIT = 40;          // pixels per world unit
const CX = W / 2;
const CY = H / 2;
const toX = (wx) => CX + wx * UNIT;
const toY = (wy) => CY - wy * UNIT;

const fmt = (n) => (Math.abs(n) < 1e-9 ? 0 : Number(n.toFixed(2)));

const DEFAULTS = { tx: 2, ty: 1, rot: 30, sx: 1.4, sy: 1 };

const ORDERS = {
  trs: { label: 'T · R · S', note: 'scale, then rotate, then translate (read right-to-left)' },
  srt: { label: 'S · R · T', note: 'translate, then rotate, then scale (read right-to-left)' },
};

export default function GfxTransformViz() {
  const [tx, setTx] = useState(DEFAULTS.tx);
  const [ty, setTy] = useState(DEFAULTS.ty);
  const [rot, setRot] = useState(DEFAULTS.rot);
  const [sx, setSx] = useState(DEFAULTS.sx);
  const [sy, setSy] = useState(DEFAULTS.sy);
  const [order, setOrder] = useState('trs');

  const reset = () => {
    setTx(DEFAULTS.tx); setTy(DEFAULTS.ty); setRot(DEFAULTS.rot);
    setSx(DEFAULTS.sx); setSy(DEFAULTS.sy); setOrder('trs');
  };

  const M = useMemo(() => {
    const mt = T(tx, ty), mr = R(rot), ms = S(sx, sy);
    return order === 'trs' ? matmul(matmul(mt, mr), ms) : matmul(matmul(ms, mr), mt);
  }, [tx, ty, rot, sx, sy, order]);

  // The alternate order, ghosted, to prove composition is non-commutative.
  const Malt = useMemo(() => {
    const mt = T(tx, ty), mr = R(rot), ms = S(sx, sy);
    return order === 'trs' ? matmul(matmul(ms, mr), mt) : matmul(matmul(mt, mr), ms);
  }, [tx, ty, rot, sx, sy, order]);

  const ptsFor = (mat) => TRI.map(([x, y]) => applyPt(mat, x, y));
  const orig = ptsFor(identity());
  const moved = ptsFor(M);
  const movedAlt = ptsFor(Malt);

  const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${toX(x)},${toY(y)}`).join(' ') + ' Z';

  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const vSrc = TRI[1];
  const vDst = moved[1];

  const gridLines = [];
  for (let i = -5; i <= 5; i++) {
    gridLines.push({ k: `v${i}`, x1: toX(i), y1: toY(-5), x2: toX(i), y2: toY(5), axis: i === 0 });
    gridLines.push({ k: `h${i}`, x1: toX(-5), y1: toY(i), x2: toX(5), y2: toY(i), axis: i === 0 });
  }

  return (
    <div className="gfxt">
      <div className="gfxt-head">
        <div className="gfxt-head-icon"><Layers size={18} /></div>
        <div className="gfxt-head-text">
          <h3 className="gfxt-title">Homogeneous transforms &amp; the TRS matrix</h3>
          <p className="gfxt-sub">
            Slide translate, rotate, and scale &mdash; the ghost triangle is object space, the
            solid one is <code>M&thinsp;p</code>. The dashed triangle is the <em>opposite</em>
            multiply order, proving <code>T&middot;R&middot;S &ne; S&middot;R&middot;T</code>.
          </p>
        </div>
        <button type="button" className="gfxt-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gfxt-body">
        <div className="gfxt-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="gfxt-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="gfxt-axis-arrow" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" className="gfxt-axis-head" />
              </marker>
              <linearGradient id="gfxt-fill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.42" />
                <stop offset="100%" stopColor="var(--hue-violet)" stopOpacity="0.42" />
              </linearGradient>
            </defs>

            {gridLines.map((l) => (
              <line key={l.k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                className={`gfxt-grid${l.axis ? ' is-axis' : ''}`} />
            ))}
            <line x1={toX(0)} y1={toY(0)} x2={toX(5)} y2={toY(0)}
              className="gfxt-axis" markerEnd="url(#gfxt-axis-arrow)" />
            <line x1={toX(0)} y1={toY(0)} x2={toX(0)} y2={toY(5)}
              className="gfxt-axis" markerEnd="url(#gfxt-axis-arrow)" />
            <text x={toX(5) - 4} y={toY(0) + 16} className="gfxt-axis-label">x</text>
            <text x={toX(0) + 8} y={toY(5) + 4} className="gfxt-axis-label">y</text>

            <path d={path(orig)} className="gfxt-tri is-ghost" />
            <path d={path(movedAlt)} className="gfxt-tri is-alt" />
            <path d={path(moved)} className="gfxt-tri is-main" fill="url(#gfxt-fill)" />

            {moved.map(([x, y], i) => (
              <circle key={`m${i}`} cx={toX(x)} cy={toY(y)} r={i === 1 ? 5 : 3.5}
                className={`gfxt-vtx${i === 1 ? ' is-marked' : ''}`} />
            ))}
            {orig.map(([x, y], i) => (
              <circle key={`o${i}`} cx={toX(x)} cy={toY(y)} r={2.6} className="gfxt-vtx is-ghost" />
            ))}
          </svg>
        </div>

        <div className="gfxt-matrix">
          <span className="gfxt-matrix-cap">M = {ORDERS[order].label}</span>
          <div className="gfxt-mat">
            <span className="gfxt-brace">[</span>
            <div className="gfxt-mat-grid">
              {M.map((row, r) => row.map((v, c) => (
                <span key={`${r}-${c}`}
                  className={`gfxt-cell${r < 2 && c === 2 ? ' is-trans' : ''}${r < 2 && c < 2 ? ' is-lin' : ''}`}>
                  {fmt(v)}
                </span>
              )))}
            </div>
            <span className="gfxt-brace">]</span>
          </div>
          <span className="gfxt-mat-hint">
            <span className="gfxt-swatch is-lin" /> linear (rotate+scale)
            <span className="gfxt-swatch is-trans" /> translation column
          </span>
        </div>
      </div>

      <div className="gfxt-orders">
        {Object.keys(ORDERS).map((o) => (
          <button key={o} type="button"
            className={`gfxt-order-btn${order === o ? ' is-on' : ''}`}
            onClick={() => setOrder(o)}>
            <span className="gfxt-order-label">{ORDERS[o].label}</span>
            <span className="gfxt-order-note">{ORDERS[o].note}</span>
          </button>
        ))}
      </div>

      <div className="gfxt-sliders">
        <label className="gfxt-slider">
          <span className="gfxt-slider-head"><Move size={13} /> translate x</span>
          <input type="range" min={-3} max={3} step={0.1} value={tx}
            onChange={(e) => setTx(Number(e.target.value))} />
          <span className="gfxt-slider-val">{fmt(tx)}</span>
        </label>
        <label className="gfxt-slider">
          <span className="gfxt-slider-head"><Move size={13} /> translate y</span>
          <input type="range" min={-3} max={3} step={0.1} value={ty}
            onChange={(e) => setTy(Number(e.target.value))} />
          <span className="gfxt-slider-val">{fmt(ty)}</span>
        </label>
        <label className="gfxt-slider">
          <span className="gfxt-slider-head"><RotateCw size={13} /> rotate</span>
          <input type="range" min={-180} max={180} step={1} value={rot}
            onChange={(e) => setRot(Number(e.target.value))} />
          <span className="gfxt-slider-val">{rot}&deg;</span>
        </label>
        <label className="gfxt-slider">
          <span className="gfxt-slider-head"><Maximize2 size={13} /> scale x</span>
          <input type="range" min={0.25} max={3} step={0.05} value={sx}
            onChange={(e) => setSx(Number(e.target.value))} />
          <span className="gfxt-slider-val">{fmt(sx)}</span>
        </label>
        <label className="gfxt-slider">
          <span className="gfxt-slider-head"><Maximize2 size={13} /> scale y</span>
          <input type="range" min={0.25} max={3} step={0.05} value={sy}
            onChange={(e) => setSy(Number(e.target.value))} />
          <span className="gfxt-slider-val">{fmt(sy)}</span>
        </label>
      </div>

      <div className="gfxt-readout">
        <div className="gfxt-stat is-vertex">
          <span className="gfxt-stat-label">vertex map</span>
          <span className="gfxt-stat-val">
            ({fmt(vSrc[0])}, {fmt(vSrc[1])}) <MoveRight size={12} /> ({fmt(vDst[0])}, {fmt(vDst[1])})
          </span>
        </div>
        <div className="gfxt-stat is-det">
          <span className="gfxt-stat-label">det (area scale)</span>
          <span className="gfxt-stat-val">{fmt(det)}&times;{det < 0 ? ' flipped' : ''}</span>
        </div>
        <div className="gfxt-stat is-order">
          <span className="gfxt-stat-label">order</span>
          <span className="gfxt-stat-val">{ORDERS[order].label}</span>
        </div>
      </div>
    </div>
  );
}
