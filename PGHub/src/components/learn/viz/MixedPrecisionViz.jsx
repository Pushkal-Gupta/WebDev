import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { Gauge, ArrowDownToLine, RotateCcw, Play, Zap, ZapOff } from 'lucide-react';
import './MixedPrecisionViz.css';

// Mixed-precision training: do the forward + backward passes in FP16 (half the
// memory, runs on tensor cores) while keeping an FP32 "master" copy of the
// weights for the optimizer step. FP16's tiny exponent range underflows small
// gradients to zero — so the loss is SCALED UP before backward to push those
// gradients into FP16's representable range, then UNSCALED before the optimizer
// applies them to the FP32 master weights.

// A fixed bank of tiny "true" gradient magnitudes (deterministic — no random).
// Several sit below FP16's smallest normal (~6.1e-5); those underflow unless scaled.
const GRADS = [3.1e-2, 4.7e-4, 8.0e-5, 2.2e-5, 6.0e-6, 9.0e-7, 1.4e-3, 5.5e-8];
const FP16_MIN_NORMAL = 6.1e-5; // ~2^-14
const LOSS_SCALE = 1024; // 2^10

// Steps of one training iteration, top-to-bottom.
const STEPS = [
  { key: 'fwd', label: 'FP16 forward — compute loss' },
  { key: 'scale', label: 'Scale loss by S' },
  { key: 'bwd', label: 'FP16 backward — grads by S' },
  { key: 'unscale', label: 'Unscale grads by 1/S' },
  { key: 'update', label: 'FP32 master weight update' },
];

// Bit layouts: [sign, exponent, mantissa] widths.
const FORMATS = {
  fp16: { name: 'FP16 (half)', sign: 1, exp: 5, mant: 10, hue: 'var(--hue-sky)' },
  fp32: { name: 'FP32 (master)', sign: 1, exp: 8, mant: 23, hue: 'var(--hue-violet)' },
};

const tex = (s, display = false) => {
  try {
    return katex.renderToString(s, { throwOnError: false, displayMode: display });
  } catch {
    return s;
  }
};

export default function MixedPrecisionViz() {
  const [scaling, setScaling] = useState(true);
  const [step, setStep] = useState(0);

  const model = useMemo(() => {
    const effScale = scaling ? LOSS_SCALE : 1;
    const rows = GRADS.map((g) => {
      const scaled = g * effScale;
      // After backward, the gradient lives in FP16. If its magnitude is below
      // FP16's smallest normal, it flushes to zero (underflow).
      const survives = scaled >= FP16_MIN_NORMAL;
      // The value the optimizer ultimately sees (unscaled back), or 0 if lost.
      const recovered = survives ? g : 0;
      return { g, scaled, survives, recovered };
    });
    const underflow = rows.filter((r) => !r.survives).length;
    return { rows, underflow, effScale };
  }, [scaling]);

  // memory: FP16 activations+grads are half of FP32; master copy is the overhead.
  const memSavedPct = 50;

  const reset = () => {
    setScaling(true);
    setStep(0);
  };
  const advance = () => setStep((s) => (s + 1) % STEPS.length);
  const current = STEPS[step];

  // SVG geometry — left: bit-layout comparison; right: vertical train-step flow.
  const W = 940;
  const H = 470;

  const bitsX = 28;
  const bitsW = 320;
  const renderFormat = (fmt, y) => {
    const total = fmt.sign + fmt.exp + fmt.mant;
    const unit = bitsW / total;
    let cursor = bitsX;
    const segs = [
      { label: 'S', n: fmt.sign, fill: 'var(--warning)' },
      { label: 'exponent', n: fmt.exp, fill: fmt.hue },
      { label: 'mantissa', n: fmt.mant, fill: 'var(--text-dim)' },
    ];
    return (
      <g key={fmt.name}>
        <text className="mpv-fmt-name" x={bitsX} y={y - 8}>{fmt.name}</text>
        <text className="mpv-fmt-bits" x={bitsX + bitsW} y={y - 8}>{total}-bit</text>
        {segs.map((sg) => {
          const w = sg.n * unit;
          const sx = cursor;
          cursor += w;
          return (
            <g key={sg.label}>
              <rect className="mpv-bitseg" x={sx} y={y} width={Math.max(0, w - 2)} height={34} rx={4} style={{ fill: sg.fill, opacity: 0.85 }} />
              <text className="mpv-bitseg-lbl" x={sx + w / 2} y={y + 22}>
                {w > 36 ? `${sg.label} (${sg.n})` : sg.n}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // vertical train-step flow on the right
  const flowX = 560;
  const flowW = 350;
  const flowTop = 56;
  const stepH = 60;
  const stepGap = 18;
  const stepY = (i) => flowTop + i * (stepH + stepGap);
  const flowCx = flowX + flowW / 2;

  return (
    <div className="mpv">
      <div className="mpv-head">
        <h3 className="mpv-title">Mixed-precision training — FP16 speed, FP32 safety</h3>
        <p className="mpv-sub">
          Forward and backward run in FP16 for half the memory and tensor-core speed; an FP32 master copy keeps the
          update accurate. Loss scaling rescues small gradients that would otherwise underflow to zero in FP16.
        </p>
      </div>

      <div className="mpv-controls">
        <button
          type="button"
          className={`mpv-btn ${scaling ? 'mpv-btn-primary' : ''}`}
          onClick={() => setScaling((v) => !v)}
        >
          {scaling ? <Zap size={14} /> : <ZapOff size={14} />}
          {scaling ? `Loss scaling ON (x${LOSS_SCALE})` : 'Loss scaling OFF'}
        </button>

        <span className="mpv-spacer" aria-hidden="true" />

        <span className="mpv-step-tag">step {step + 1}/{STEPS.length}: {current.label}</span>
        <button type="button" className="mpv-btn mpv-btn-primary" onClick={advance}>
          <Play size={14} /> Step train loop
        </button>
        <button type="button" className="mpv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="mpv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mpv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mpv-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L6,3 L0,6 Z" className="mpv-arrowhead" />
            </marker>
          </defs>

          {/* left column: bit layouts */}
          <text className="mpv-col-title" x={bitsX} y={28}>bit layouts</text>
          {renderFormat(FORMATS.fp16, 72)}
          {renderFormat(FORMATS.fp32, 158)}

          <text className="mpv-note" x={bitsX} y={224}>
            FP16 smallest normal ≈ 6.1e-5 — grads below it flush to 0.
          </text>

          {/* gradient survival bars */}
          <text className="mpv-col-title" x={bitsX} y={262}>true gradient magnitudes</text>
          {model.rows.map((r, i) => {
            const by = 280 + i * 22;
            const lost = !r.survives;
            return (
              <g key={`g-${i}`}>
                <rect
                  className={`mpv-grad ${lost ? 'is-lost' : 'is-safe'}`}
                  x={bitsX}
                  y={by}
                  width={14}
                  height={14}
                  rx={3}
                />
                <text className="mpv-grad-val" x={bitsX + 22} y={by + 11}>
                  {r.g.toExponential(1)}
                </text>
                <text className={`mpv-grad-state ${lost ? 'is-lost' : 'is-safe'}`} x={bitsX + 120} y={by + 11}>
                  {lost ? 'underflow to 0' : scaling ? `times S = ${r.scaled.toExponential(1)} ok` : 'representable ok'}
                </text>
              </g>
            );
          })}

          {/* right column: vertical train-step flow */}
          <text className="mpv-col-title" x={flowX} y={28}>one training step</text>
          {STEPS.map((s, i) => {
            const y = stepY(i);
            const active = i === step;
            const done = i < step;
            const isFp32 = s.key === 'update';
            return (
              <g key={s.key}>
                {i > 0 && (
                  <path
                    className={`mpv-edge ${done || active ? 'is-on' : ''}`}
                    d={`M ${flowCx} ${stepY(i - 1) + stepH} L ${flowCx} ${y - 2}`}
                    markerEnd="url(#mpv-arrow)"
                  />
                )}
                <rect
                  className={`mpv-step ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
                  x={flowX}
                  y={y}
                  width={flowW}
                  height={stepH}
                  rx={9}
                  style={{ stroke: active ? 'var(--accent)' : isFp32 ? FORMATS.fp32.hue : FORMATS.fp16.hue }}
                />
                <rect
                  x={flowX}
                  y={y}
                  width={6}
                  height={stepH}
                  rx={3}
                  fill={isFp32 ? FORMATS.fp32.hue : FORMATS.fp16.hue}
                />
                <text className="mpv-step-tag-t" x={flowX + 18} y={y + 22}>
                  {isFp32 ? 'FP32' : 'FP16'}
                </text>
                <text className="mpv-step-label" x={flowX + 18} y={y + 44}>
                  {s.label}
                </text>
                {s.key === 'scale' && (
                  <text className="mpv-step-extra" x={flowX + flowW - 14} y={y + 38}>
                    S = {scaling ? LOSS_SCALE : 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mpv-metrics">
        <div className="mpv-metric">
          <span className="mpv-metric-label">activation memory</span>
          <span className="mpv-metric-value is-mem">−{memSavedPct}% (FP16)</span>
        </div>
        <div className="mpv-metric">
          <span className="mpv-metric-label">loss scale S</span>
          <span className="mpv-metric-value">{scaling ? `x${LOSS_SCALE}` : 'x1 (off)'}</span>
        </div>
        <div className="mpv-metric">
          <span className="mpv-metric-label">grads underflowed</span>
          <span className={`mpv-metric-value ${model.underflow > 0 ? 'is-lost' : 'is-safe'}`}>
            {model.underflow} / {GRADS.length}
          </span>
        </div>
        <div className="mpv-metric">
          <span className="mpv-metric-label">stage</span>
          <span className="mpv-metric-value is-stage">{current.label}</span>
        </div>
      </div>

      <div className="mpv-math">
        <span
          className="mpv-math-line"
          dangerouslySetInnerHTML={{ __html: tex('g_{\\text{fp16}} = \\text{clip}_{\\text{fp16}}\\!\\big(S \\cdot \\nabla L\\big), \\quad g_{\\text{fp32}} = g_{\\text{fp16}} / S') }}
        />
      </div>

      <div className="mpv-narration">
        <span className="mpv-narration-label">why it matters</span>
        <span className="mpv-narration-body">
          {scaling
            ? `With S = ${LOSS_SCALE}, every true gradient is pushed above FP16's underflow floor before backward, so all ${GRADS.length} survive and the FP32 master update is faithful — while still paying only FP16 memory for activations.`
            : `Loss scaling off: ${model.underflow} of ${GRADS.length} gradients silently flush to zero in FP16. Those weights stop learning — training stalls or diverges even though no error is thrown. Scale the loss up, then unscale before the step, and they come back.`}
        </span>
      </div>
    </div>
  );
}
