import React, { useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Activity, Zap, AlertTriangle } from 'lucide-react';
import './NnActivationsViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const erf = (x) => {
  // Abramowitz & Stegun 7.1.26 approximation.
  const s = x < 0 ? -1 : 1;
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};

const ACTS = {
  sigmoid: {
    label: 'Sigmoid',
    tex: '\\sigma(x)=\\dfrac{1}{1+e^{-x}}',
    f: (x) => 1 / (1 + Math.exp(-x)),
    df: (x) => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); },
    zones: 'saturation',
    note: 'Squashes to (0,1). Far from 0 the curve flattens and the derivative goes to ~0 — those saturation tails are where gradients vanish.',
  },
  tanh: {
    label: 'Tanh',
    tex: '\\tanh(x)',
    f: (x) => Math.tanh(x),
    df: (x) => 1 - Math.tanh(x) ** 2,
    zones: 'saturation',
    note: 'Zero-centered version of sigmoid, range (-1,1). Steeper near 0 but it still saturates at both tails, so deep stacks can still starve gradients.',
  },
  relu: {
    label: 'ReLU',
    tex: '\\mathrm{ReLU}(x)=\\max(0,x)',
    f: (x) => Math.max(0, x),
    df: (x) => (x > 0 ? 1 : 0),
    zones: 'dead',
    note: 'Identity for x>0, flat 0 for x<0. Cheap and non-saturating on the positive side, but a neuron stuck in x<0 has a zero gradient forever — the "dead ReLU".',
  },
  leakyrelu: {
    label: 'LeakyReLU',
    tex: '\\mathrm{LReLU}(x)=\\max(0.1x,\\,x)',
    f: (x) => (x > 0 ? x : 0.1 * x),
    df: (x) => (x > 0 ? 1 : 0.1),
    zones: 'none',
    note: 'A small slope (0.1) for x<0 keeps the gradient alive in the negative region, fixing the dead-ReLU problem while staying nearly as cheap.',
  },
  gelu: {
    label: 'GELU',
    tex: '\\mathrm{GELU}(x)=x\\,\\Phi(x)',
    f: (x) => x * 0.5 * (1 + erf(x / Math.SQRT2)),
    df: (x) => {
      const cdf = 0.5 * (1 + erf(x / Math.SQRT2));
      const pdf = Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
      return cdf + x * pdf;
    },
    zones: 'none',
    note: 'Smooth gate: weights the input by its Gaussian CDF. Differentiable everywhere with a soft negative dip — the default in modern transformers.',
  },
};

const VB_W = 340;
const VB_H = 240;
const PAD = 26;
const XR = 5;          // x range +-5
const YR = 1.8;        // y range for plotting
const plotW = VB_W - 2 * PAD;
const plotH = VB_H - 2 * PAD;
const sx = (x) => PAD + ((x + XR) / (2 * XR)) * plotW;
const sy = (y) => PAD + (1 - (y + YR) / (2 * YR)) * plotH;

function pathFor(fn) {
  let d = '';
  for (let i = 0; i <= 160; i++) {
    const x = -XR + (i / 160) * 2 * XR;
    const y = Math.max(-YR, Math.min(YR, fn(x)));
    d += `${i === 0 ? 'M' : 'L'}${sx(x).toFixed(2)},${sy(y).toFixed(2)} `;
  }
  return d.trim();
}

export default function NnActivationsViz() {
  const [actKey, setActKey] = useState('relu');
  const [xv, setXv] = useState(1.2);
  const act = ACTS[actKey];
  const svgRef = useRef(null);
  const dragging = useRef(false);

  const reset = () => { setActKey('relu'); setXv(1.2); };

  const fPath = useMemo(() => pathFor(act.f), [act]);
  const dPath = useMemo(() => pathFor(act.df), [act]);

  const out = act.f(xv);
  const grad = act.df(xv);
  const saturated = act.zones === 'saturation' && Math.abs(grad) < 0.05;
  const dead = act.zones === 'dead' && grad === 0;
  const flagged = saturated || dead;

  const onPointer = (e) => {
    if (!dragging.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const fx = ((e.clientX - r.left) / r.width) * VB_W;
    const x = ((fx - PAD) / plotW) * 2 * XR - XR;
    setXv(Math.max(-XR, Math.min(XR, x)));
  };
  const startDrag = (e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); onPointer(e); };
  const endDrag = () => { dragging.current = false; };

  return (
    <div className="nav">
      <div className="nav-head">
        <div className="nav-head-icon"><Activity size={18} /></div>
        <div className="nav-head-text">
          <h3 className="nav-title">Activations: the function, its derivative, and where the gradient dies</h3>
          <p className="nav-sub">
            The solid curve is the activation, the dashed curve is its derivative
            <span dangerouslySetInnerHTML={{ __html: km("\\,f'(x)") }} /> &mdash; the factor backprop multiplies by.
            Drag the input <span dangerouslySetInnerHTML={{ __html: km('x') }} /> and watch where the slope flattens to zero.
          </p>
        </div>
        <button type="button" className="nav-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nav-controls">
        {Object.entries(ACTS).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`nav-chip ${actKey === k ? 'nav-chip-on' : ''}`}
            onClick={() => setActKey(k)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="nav-formula" dangerouslySetInnerHTML={{ __html: km(act.tex, true) }} />

      <div className="nav-body">
        <div className="nav-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="nav-svg"
            preserveAspectRatio="xMidYMid meet"
            onPointerMove={onPointer}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <rect x={PAD} y={PAD} width={plotW} height={plotH} rx={8} className="nav-plot" />
            <line x1={PAD} y1={sy(0)} x2={PAD + plotW} y2={sy(0)} className="nav-axis" />
            <line x1={sx(0)} y1={PAD} x2={sx(0)} y2={PAD + plotH} className="nav-axis" />

            <path d={dPath} className="nav-deriv" />
            <path d={fPath} className="nav-func" />

            {/* input crosshair */}
            <line x1={sx(xv)} y1={PAD} x2={sx(xv)} y2={PAD + plotH} className="nav-xline" />
            <circle cx={sx(xv)} cy={sy(Math.max(-YR, Math.min(YR, out)))} r={5.5} className="nav-fdot" />
            <circle cx={sx(xv)} cy={sy(Math.max(-YR, Math.min(YR, grad)))} r={4.5} className="nav-ddot" />
            <circle cx={sx(xv)} cy={sy(0)} r={8} className="nav-handle" onPointerDown={startDrag} />

            <text x={PAD + plotW - 4} y={sy(0) - 5} className="nav-axlab" textAnchor="end">x</text>
          </svg>
        </div>

        <div className="nav-side">
          <div className="nav-readouts">
            <div className="nav-stat nav-stat-x">
              <span className="nav-stat-lab">input x</span>
              <span className="nav-stat-val">{xv.toFixed(2)}</span>
            </div>
            <div className="nav-stat nav-stat-out">
              <span className="nav-stat-lab">output f(x)</span>
              <span className="nav-stat-val">{out.toFixed(3)}</span>
            </div>
            <div className="nav-stat nav-stat-grad">
              <span className="nav-stat-lab">gradient f&prime;(x)</span>
              <span className="nav-stat-val">{grad.toFixed(3)}</span>
            </div>
          </div>

          <label className="nav-slider">
            <span className="nav-slider-lab">drag input x <span className="nav-slider-val">{xv.toFixed(2)}</span></span>
            <input type="range" min={-XR} max={XR} step={0.01} value={xv}
              onChange={(e) => setXv(parseFloat(e.target.value))} />
          </label>

          {flagged ? (
            <div className="nav-warn">
              <AlertTriangle size={13} />
              {dead
                ? 'Dead zone: x<0 gives a flat output and a zero gradient — backprop sends nothing through this neuron.'
                : 'Saturation: the curve is nearly flat here, so the gradient is ~0 and weight updates stall (vanishing gradient).'}
            </div>
          ) : (
            <div className="nav-ok">
              <Zap size={13} /> Healthy gradient — backprop can push a real update through this neuron.
            </div>
          )}

          <div className="nav-note">{act.note}</div>
        </div>
      </div>
    </div>
  );
}
