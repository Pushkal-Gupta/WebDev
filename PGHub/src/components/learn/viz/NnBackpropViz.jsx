import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Network, ArrowDown, ArrowUp, Zap } from 'lucide-react';
import './NnBackpropViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const sig = (z) => 1 / (1 + Math.exp(-z));
const dsig = (z) => { const s = sig(z); return s * (1 - s); };

// Fixed tiny net: 1 input -> 1 hidden -> 1 output, sigmoid activations, MSE loss.
const X = 1.0;
const Y = 1.0;
const LR = 1.5;
const INIT = { w1: 0.5, b1: 0.0, w2: 0.8, b2: -0.2 };

// Pipeline of steps, vertical: forward then backward then update.
const STEPS = [
  { phase: 'forward', key: 'fz1', label: 'Forward: z1 = w1·x + b1' },
  { phase: 'forward', key: 'fa1', label: 'Forward: a1 = sigmoid(z1)' },
  { phase: 'forward', key: 'fz2', label: 'Forward: z2 = w2·a1 + b2' },
  { phase: 'forward', key: 'fa2', label: 'Forward: a2 = sigmoid(z2) = prediction' },
  { phase: 'forward', key: 'loss', label: 'Loss: L = ½(a2 − y)²' },
  { phase: 'backward', key: 'da2', label: 'Backward: dL/da2 = a2 − y' },
  { phase: 'backward', key: 'dz2', label: 'Backward: dz2 = dL/da2 · sigmoid′(z2)' },
  { phase: 'backward', key: 'gw2', label: 'Grad: dL/dw2 = dz2 · a1' },
  { phase: 'backward', key: 'dz1', label: 'Backward: dz1 = (w2·dz2) · sigmoid′(z1)' },
  { phase: 'backward', key: 'gw1', label: 'Grad: dL/dw1 = dz1 · x' },
  { phase: 'update', key: 'upd', label: 'Update: w ← w − η · dL/dw' },
];

export default function NnBackpropViz() {
  const [w, setW] = useState(INIT);
  const [step, setStep] = useState(0);

  const reset = () => { setW(INIT); setStep(0); };

  const f = useMemo(() => {
    const z1 = w.w1 * X + w.b1;
    const a1 = sig(z1);
    const z2 = w.w2 * a1 + w.b2;
    const a2 = sig(z2);
    const loss = 0.5 * (a2 - Y) ** 2;
    const da2 = a2 - Y;
    const dz2 = da2 * dsig(z2);
    const gw2 = dz2 * a1;
    const gb2 = dz2;
    const dz1 = w.w2 * dz2 * dsig(z1);
    const gw1 = dz1 * X;
    const gb1 = dz1;
    return { z1, a1, z2, a2, loss, da2, dz2, gw2, gb2, dz1, gw1, gb1 };
  }, [w]);

  const applyUpdate = () => {
    setW((p) => ({
      w1: p.w1 - LR * f.gw1,
      b1: p.b1 - LR * f.gb1,
      w2: p.w2 - LR * f.gw2,
      b2: p.b2 - LR * f.gb2,
    }));
    setStep(0);
  };

  const cur = STEPS[step];
  const reached = (k) => STEPS.findIndex((s) => s.key === k) <= step;
  const isActive = (k) => cur.key === k;

  // Vertical node geometry. viewBox 320 x 520.
  const VB_W = 320;
  const VB_H = 520;
  const cx = 130;
  const yIn = 50;
  const yH = 200;
  const yOut = 350;
  const yLoss = 470;
  const R = 26;

  const edgeActive = (k) => isActive(k);
  const fwdReached = cur.phase === 'forward';

  // value badge for the right gutter
  const fmt = (v) => (Math.abs(v) < 0.001 ? v.toExponential(1) : v.toFixed(3));

  const grads = [
    { k: 'gw1', name: 'dL/dw1', v: f.gw1, lit: reached('gw1') },
    { k: 'gb1', name: 'dL/db1', v: f.gb1, lit: reached('gw1') },
    { k: 'gw2', name: 'dL/dw2', v: f.gw2, lit: reached('gw2') },
    { k: 'gb2', name: 'dL/db2', v: f.gb2, lit: reached('gw2') },
  ];

  return (
    <div className="nbp">
      <div className="nbp-head">
        <div className="nbp-head-icon"><Network size={18} /></div>
        <div className="nbp-head-text">
          <h3 className="nbp-title">Backpropagation on a tiny net: step the forward pass, then watch the error flow back</h3>
          <p className="nbp-sub">
            A 1&ndash;1&ndash;1 sigmoid network. Forward fills each value top to bottom; the backward sweep sends the
            error signal <span dangerouslySetInnerHTML={{ __html: km('\\delta=\\partial L/\\partial z') }} /> upward,
            multiplying local derivatives to build every weight&rsquo;s gradient. Then apply one update.
          </p>
        </div>
        <button type="button" className="nbp-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nbp-controls">
        <button type="button" className="nbp-btn"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}>Prev</button>
        <button type="button" className="nbp-btn nbp-btn-primary"
          disabled={step >= STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Next step</button>
        <button type="button" className="nbp-btn nbp-btn-update"
          disabled={step < STEPS.length - 1}
          onClick={applyUpdate}><Zap size={13} /> Apply update</button>
        <span className={`nbp-phase nbp-phase-${cur.phase}`}>
          {cur.phase === 'forward' && <ArrowDown size={12} />}
          {cur.phase === 'backward' && <ArrowUp size={12} />}
          {cur.phase === 'update' && <Zap size={12} />}
          {cur.phase}
        </span>
      </div>

      <div className="nbp-body">
        <div className="nbp-stage">
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nbp-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="nbp-arrow-fwd" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="nbp-mk-fwd" />
              </marker>
              <marker id="nbp-arrow-bwd" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className="nbp-mk-bwd" />
              </marker>
            </defs>

            {/* edges (vertical trunk). forward arrows point down, backward overlay points up */}
            <line x1={cx} y1={yIn + R} x2={cx} y2={yH - R}
              className={`nbp-edge ${edgeActive('fz1') ? 'nbp-edge-on' : ''}`}
              markerEnd="url(#nbp-arrow-fwd)" />
            <line x1={cx} y1={yH + R} x2={cx} y2={yOut - R}
              className={`nbp-edge ${edgeActive('fz2') ? 'nbp-edge-on' : ''}`}
              markerEnd="url(#nbp-arrow-fwd)" />
            <line x1={cx} y1={yOut + R} x2={cx} y2={yLoss - 22}
              className={`nbp-edge ${edgeActive('loss') ? 'nbp-edge-on' : ''}`}
              markerEnd="url(#nbp-arrow-fwd)" />

            {/* backward error arrows in the left gutter, pointing up */}
            <line x1={cx - 54} y1={yOut - R} x2={cx - 54} y2={yH + R}
              className={`nbp-bedge ${reached('dz1') ? 'nbp-bedge-on' : ''}`}
              markerEnd="url(#nbp-arrow-bwd)" />
            <line x1={cx - 54} y1={yLoss - 30} x2={cx - 54} y2={yOut - R}
              className={`nbp-bedge ${reached('dz2') ? 'nbp-bedge-on' : ''}`}
              markerEnd="url(#nbp-arrow-bwd)" />

            {/* nodes */}
            <g className={`nbp-node ${isActive('fz1') ? 'nbp-node-active' : ''}`}>
              <circle cx={cx} cy={yIn} r={R} className="nbp-node-in" />
              <text x={cx} y={yIn - 2} className="nbp-node-name" textAnchor="middle">x</text>
              <text x={cx} y={yIn + 13} className="nbp-node-val" textAnchor="middle">{X.toFixed(2)}</text>
            </g>

            <g className={`nbp-node ${isActive('fa1') || isActive('fz1') || isActive('dz1') ? 'nbp-node-active' : ''}`}>
              <circle cx={cx} cy={yH} r={R} className="nbp-node-hid" />
              <text x={cx} y={yH - 4} className="nbp-node-name" textAnchor="middle">a1</text>
              <text x={cx} y={yH + 11} className="nbp-node-val" textAnchor="middle">{fwdReached || reached('fa1') ? f.a1.toFixed(3) : '?'}</text>
            </g>

            <g className={`nbp-node ${isActive('fa2') || isActive('fz2') || isActive('dz2') ? 'nbp-node-active' : ''}`}>
              <circle cx={cx} cy={yOut} r={R} className="nbp-node-out" />
              <text x={cx} y={yOut - 4} className="nbp-node-name" textAnchor="middle">a2</text>
              <text x={cx} y={yOut + 11} className="nbp-node-val" textAnchor="middle">{reached('fa2') ? f.a2.toFixed(3) : '?'}</text>
            </g>

            <g className={`nbp-node ${isActive('loss') || isActive('da2') ? 'nbp-node-active' : ''}`}>
              <rect x={cx - 40} y={yLoss - 20} width={80} height={40} rx={9} className="nbp-node-loss" />
              <text x={cx} y={yLoss - 3} className="nbp-node-name" textAnchor="middle">Loss</text>
              <text x={cx} y={yLoss + 12} className="nbp-node-val" textAnchor="middle">{reached('loss') ? f.loss.toFixed(4) : '?'}</text>
            </g>

            {/* edge weight labels (right of trunk) */}
            <text x={cx + 14} y={(yIn + yH) / 2} className="nbp-elabel">w1={w.w1.toFixed(3)}</text>
            <text x={cx + 14} y={(yH + yOut) / 2} className="nbp-elabel">w2={w.w2.toFixed(3)}</text>

            {/* backward signal labels (left gutter) */}
            {reached('dz2') && (
              <text x={cx - 60} y={(yOut + yLoss) / 2 - 6} className="nbp-blabel" textAnchor="end">&delta;2={fmt(f.dz2)}</text>
            )}
            {reached('dz1') && (
              <text x={cx - 60} y={(yH + yOut) / 2} className="nbp-blabel" textAnchor="end">&delta;1={fmt(f.dz1)}</text>
            )}

            <text x={cx + R + 8} y={yIn} className="nbp-flow-tag nbp-flow-fwd">forward &darr;</text>
            <text x={cx - 64} y={yLoss - 4} className="nbp-flow-tag nbp-flow-bwd" textAnchor="end">back &uarr;</text>
          </svg>
        </div>

        <div className="nbp-side">
          <div className="nbp-stepcard">
            <span className="nbp-stepcard-lab">current step {step + 1} / {STEPS.length}</span>
            <span className="nbp-stepcard-txt">{cur.label}</span>
          </div>

          <div className="nbp-grads">
            <span className="nbp-grads-cap">gradients (light up as the backward pass reaches them)</span>
            {grads.map((g) => (
              <div key={g.k} className={`nbp-gradrow ${g.lit ? 'nbp-gradrow-on' : ''}`}>
                <span className="nbp-grad-name" dangerouslySetInnerHTML={{ __html: km(g.name.replace('dL/d', '\\partial L/\\partial ')) }} />
                <span className="nbp-grad-val">{g.lit ? fmt(g.v) : '—'}</span>
              </div>
            ))}
          </div>

          <div className="nbp-chain">
            <span className="nbp-chain-cap"><Zap size={11} /> chain rule for w1</span>
            <span className="nbp-chain-math" dangerouslySetInnerHTML={{ __html: km('\\dfrac{\\partial L}{\\partial w_1}=\\dfrac{\\partial L}{\\partial z_1}\\cdot\\dfrac{\\partial z_1}{\\partial w_1}=\\delta_1\\, x', true) }} />
          </div>

          <div className="nbp-loss">
            <span className="nbp-loss-lab">current loss</span>
            <span className="nbp-loss-val">{f.loss.toFixed(5)}</span>
            <span className="nbp-loss-hint">apply updates repeatedly to drive it toward 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
