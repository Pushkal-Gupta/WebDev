import React, { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import './MLViz.css';

// Vertical computation graph: nodes stack TOP -> BOTTOM (x at top, L at bottom).
// Forward pass flows DOWN the spine; backward gradients flow back UP the same
// vertical spine. Portrait viewBox.
const W = 340;
const H = 520;

function snap(v, p = 3) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Tiny 2-layer net (scalars):
//   z1 = w1 * x + b1
//   h  = relu(z1)
//   z2 = w2 * h + b2   (= ypred)
//   L  = 0.5 * (ypred - t)^2
const X = 1.5;
const T = 1.0;
const LR = 0.1;

function forward(w1, b1, w2, b2) {
  const z1 = w1 * X + b1;
  const h = Math.max(0, z1);
  const z2 = w2 * h + b2;
  const yp = z2;
  const L = 0.5 * (yp - T) ** 2;
  return { z1, h, z2, yp, L };
}

function backward(w1, w2, f) {
  const dL_dyp = f.yp - T; // dL/dypred
  const dyp_dz2 = 1;
  const dL_dz2 = dL_dyp * dyp_dz2;
  const dz2_dw2 = f.h;
  const dz2_dh = w2;
  const dL_dw2 = dL_dz2 * dz2_dw2;
  const dL_dh = dL_dz2 * dz2_dh;
  const dh_dz1 = f.z1 > 0 ? 1 : 0;
  const dL_dz1 = dL_dh * dh_dz1;
  const dz1_dw1 = X;
  const dL_dw1 = dL_dz1 * dz1_dw1;
  return { dL_dyp, dL_dz2, dz2_dw2, dz2_dh, dL_dw2, dL_dh, dh_dz1, dL_dz1, dz1_dw1, dL_dw1 };
}

// Steps: 0 init, 1-3 forward, 4-6 backward, 7 update
const STEPS = [
  'Init: weights set, ready for forward pass',
  'Forward: z1 = w1·x + b1, then h = ReLU(z1)',
  'Forward: z2 = w2·h + b2 = ypred',
  'Forward: L = ½(ypred − t)²',
  'Backward: ∂L/∂ypred = ypred − t',
  'Backward: chain into w2 — ∂L/∂w2 = ∂L/∂z2 · h',
  'Backward: chain through ReLU into w1 — ∂L/∂w1 = ∂L/∂z1 · x',
  'Update: w1 ← w1 − lr·∂L/∂w1',
];

export default function BackpropFlowViz() {
  const [step, setStep] = useState(0);
  const [w1] = useState(0.8);
  const [b1] = useState(-0.2);
  const [w2] = useState(0.6);
  const [b2] = useState(0.1);

  const f = useMemo(() => forward(w1, b1, w2, b2), [w1, b1, w2, b2]);
  const g = useMemo(() => backward(w1, w2, f), [w1, w2, f]);

  const w1New = w1 - LR * g.dL_dw1;

  const fwdActive = step >= 1 && step <= 3;
  const bwdActive = step >= 4 && step <= 6;

  // node layout: x -> [w1] -> h -> [w2] -> ŷ -> L, stacked DOWN a vertical spine.
  const spineX = W / 2;
  const nodes = [
    { id: 'x', x: spineX, y: 70, label: 'x', val: X },
    { id: 'h', x: spineX, y: 200, label: 'h', val: f.h },
    { id: 'y', x: spineX, y: 330, label: 'ŷ', val: f.yp },
    { id: 'L', x: spineX, y: 460, label: 'L', val: f.L },
  ];

  // edges carry the weight + the chain-rule product on the way back
  const edges = [
    {
      from: 'x', to: 'h', w: 'w1',
      fwdAt: 1, bwdAt: 6,
      local: `∂h/∂w1 = x·1[z1>0] = ${snap(g.dz1_dw1 * g.dh_dz1, 2)}`,
      grad: g.dL_dw1, gradLabel: '∂L/∂w1',
    },
    {
      from: 'h', to: 'y', w: 'w2',
      fwdAt: 2, bwdAt: 5,
      local: `∂ŷ/∂w2 = h = ${snap(g.dz2_dw2, 2)}`,
      grad: g.dL_dw2, gradLabel: '∂L/∂w2',
    },
    {
      from: 'y', to: 'L', w: '',
      fwdAt: 3, bwdAt: 4,
      local: `∂L/∂ŷ = ŷ−t = ${snap(g.dL_dyp, 2)}`,
      grad: g.dL_dyp, gradLabel: '∂L/∂ŷ',
    },
  ];

  function nodeById(id) {
    return nodes.find((n) => n.id === id);
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-portrait"
          style={{ '--mlviz-portrait-ar': `${W} / ${H}` }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="bpf-arr-f" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="bpf-arr-b" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--hue-pink)" />
            </marker>
          </defs>

          <text x={W / 2} y={28} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            {step <= 3 ? 'FORWARD ↓' : step <= 6 ? '↑ BACKWARD' : 'WEIGHT UPDATE'}
          </text>

          {/* edges — vertical spine, forward arrow points down, backward up */}
          {edges.map((e) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            const fwdOn = step >= e.fwdAt && step <= 3;
            const bwdOn = step >= 4 && step >= e.bwdAt;
            const active = (fwdActive && step === e.fwdAt) || (bwdActive && step === e.bwdAt);
            const stroke = bwdOn ? 'var(--hue-pink)' : fwdOn ? 'var(--accent)' : 'var(--border)';
            const midY = (a.y + b.y) / 2;
            // forward: top(a) -> bottom(b); backward: bottom(b) -> top(a)
            const x1 = bwdOn ? b.x : a.x;
            const y1 = bwdOn ? b.y - 24 : a.y + 24;
            const x2 = bwdOn ? a.x : b.x;
            const y2 = bwdOn ? a.y + 24 : b.y - 24;
            return (
              <g key={`${e.from}-${e.to}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={active ? 2.4 : 1}
                  opacity={fwdOn || bwdOn ? 0.95 : 0.3}
                  markerEnd={bwdOn ? 'url(#bpf-arr-b)' : fwdOn ? 'url(#bpf-arr-f)' : undefined}
                />
                {e.w && (
                  <text x={a.x + 30} y={midY - 6} fontSize="9" fill="var(--text-main)" fontFamily="var(--serif)" fontStyle="italic" textAnchor="start" fontWeight="700">
                    {e.w}
                  </text>
                )}
                {/* local jacobian (always faintly shown) — right gutter */}
                <text x={a.x + 30} y={midY + 6} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="start">
                  {e.local}
                </text>
                {/* chain-rule product gradient on the way back — left gutter */}
                {bwdOn && (
                  <text x={a.x - 30} y={midY} fontSize="8" fill="var(--hue-pink)" fontFamily="var(--mono)" textAnchor="end" fontWeight="700">
                    {e.gradLabel} = {snap(e.grad, 3)}
                  </text>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {nodes.map((n, i) => {
            const lit = (fwdActive && i <= step) || step > 3 || step === 0;
            const active = fwdActive && i === step;
            return (
              <g key={n.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="24"
                  fill={lit ? 'rgba(var(--accent-rgb), 0.14)' : 'var(--surface)'}
                  stroke={active ? 'var(--accent)' : lit ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={active ? 2.4 : lit ? 1.4 : 0.8}
                  opacity={lit ? 1 : 0.5}
                />
                <text x={n.x} y={n.y - 2} fontSize="13" fill={lit ? 'var(--accent)' : 'var(--text-dim)'} fontFamily="var(--serif)" fontStyle="italic" textAnchor="middle" fontWeight="700">
                  {n.label}
                </text>
                <text x={n.x} y={n.y + 12} fontSize="7.5" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle">
                  {snap(n.val, 2)}
                </text>
              </g>
            );
          })}

          <text x={W / 2} y={H - 14} fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
            {STEPS[step]}
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">fwd</span>
            <span className="mlviz-val">x={X} → h={snap(f.h, 2)} → ŷ={snap(f.yp, 2)} → L={snap(f.L, 3)}</span>
            <span className="mlviz-sub">target t = {T}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∂w2</span>
            <span className="mlviz-val">∂L/∂w2 = (ŷ−t)·h = {snap(g.dL_dw2, 3)}</span>
            <span className="mlviz-sub">chain-rule product along the w2 edge</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">∂w1</span>
            <span className="mlviz-val">∂L/∂w1 = (ŷ−t)·w2·1[z1&gt;0]·x = {snap(g.dL_dw1, 3)}</span>
            <span className="mlviz-sub">products multiply back through every edge</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">upd</span>
            <span className="mlviz-val">w1 ← {snap(w1, 2)} − {LR}·{snap(g.dL_dw1, 2)} = {snap(w1New, 3)}</span>
            <span className="mlviz-sub">one gradient-descent step, lr = {LR}</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            disabled={step >= STEPS.length - 1}
            onClick={() => setStep((s) => Math.min(s + 1, STEPS.length - 1))}
          >
            <StepForward size={13} />
            <span>Step</span>
          </button>
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => setStep(0)}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          forward lights up activations · backward multiplies a local derivative onto the upstream gradient at each edge
        </div>
      </div>
    </div>
  );
}
