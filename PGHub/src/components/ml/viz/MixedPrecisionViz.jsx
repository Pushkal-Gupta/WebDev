import React, { useEffect, useMemo, useState } from 'react';
import { Sliders, RotateCcw, Cpu, Gauge, HeartPulse } from 'lucide-react';
import katex from 'katex';
import './MLViz.css';

/*
 * MixedPrecisionViz
 *
 * Two stacked transformer-like forward passes:
 *   - top row: fp32 master path, full memory footprint, slower MAC throughput
 *   - bottom row: fp16 weights/activations with fp32 master copy + loss scaling
 *
 * The loss-scale slider drives the bottom-row gradient health. We sample a
 * deterministic batch of synthetic gradient magnitudes spanning roughly
 * 2^-30 to 2^-2 (representative of real transformer gradients). Multiplying
 * each by the loss-scale either:
 *   - underflows fp16 (< ~2^-24)            → gray "0" chip
 *   - overflows fp16 (> 65504)              → red X "inf" chip
 *   - stays representable                   → healthy accent chip
 *
 * Readouts: memory footprint, MAC speedup, fraction of healthy gradients.
 */

const W = 720;
const H = 340;
const PAD_X = 18;
const ROW_TOP_FP32 = 32;
const ROW_TOP_MIXED = 178;
const ROW_H = 116;
const N_LAYERS = 4;
const LAYER_GAP = 16;
const LAYER_W = (W - PAD_X * 2 - LAYER_GAP * (N_LAYERS - 1)) / N_LAYERS;

const N_GRADS = 12;
const SEED = 9;
const DEFAULT_LOG2_SCALE = 8;

// fp16 representable range (subnormals down to ~6e-8, max 65504)
const FP16_MIN_NORMAL = Math.pow(2, -24);
const FP16_MAX = 65504;

// per-layer memory cost in bytes for a notional 1B-param layer slice
const PARAMS_PER_LAYER = 16 * 1024 * 1024; // 16M params per slice (illustrative)
const BYTES_FP32 = 4;
const BYTES_FP16 = 2;

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function katexHtml(tex) {
  return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
}

function fmtBytes(b) {
  if (b >= 1024 * 1024 * 1024) return `${(b / (1024 ** 3)).toFixed(2)} GB`;
  if (b >= 1024 * 1024) return `${(b / (1024 ** 2)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function classifyGrad(absVal) {
  if (absVal < FP16_MIN_NORMAL) return 'underflow';
  if (absVal > FP16_MAX) return 'overflow';
  return 'healthy';
}

export default function MixedPrecisionViz() {
  const [log2Scale, setLog2Scale] = useState(DEFAULT_LOG2_SCALE);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  // Deterministic gradient magnitudes spanning a wide log range
  const gradMags = useMemo(() => {
    const r = mulberry32(SEED);
    const arr = [];
    for (let i = 0; i < N_GRADS; i++) {
      // exponent ranges from -28..-3 with mild jitter
      const exp = -28 + (i / (N_GRADS - 1)) * 25 + (r() - 0.5) * 1.2;
      arr.push(Math.pow(2, exp));
    }
    return arr;
  }, []);

  const lossScale = Math.pow(2, log2Scale);

  const gradStates = useMemo(() => {
    return gradMags.map((g) => {
      const scaled = g * lossScale;
      return { raw: g, scaled, state: classifyGrad(scaled) };
    });
  }, [gradMags, lossScale]);

  const healthyCount = gradStates.filter((g) => g.state === 'healthy').length;
  const underflowCount = gradStates.filter((g) => g.state === 'underflow').length;
  const overflowCount = gradStates.filter((g) => g.state === 'overflow').length;
  const healthPct = (healthyCount / N_GRADS) * 100;

  // Memory: fp32 stores weights + activations + grads + optimizer (Adam: 2 moments)
  // fp32 path: 4 * (w + a + g + m1 + m2) bytes ≈ 5 copies
  // mixed path: fp16 (w + a + g) + fp32 (master + m1 + m2) ≈ 1.5x of w + 3x w in fp32 = 3.5 copies
  const memFp32 = PARAMS_PER_LAYER * BYTES_FP32 * 5 * N_LAYERS;
  const memMixed = (PARAMS_PER_LAYER * BYTES_FP16 * 3 + PARAMS_PER_LAYER * BYTES_FP32 * 3) * N_LAYERS;
  const memSaved = memFp32 - memMixed;
  const memSavedPct = (memSaved / memFp32) * 100;

  // Speedup: fp16 MACs on tensor cores typically 2x-3x of fp32 throughput
  const speedup = 2.4;

  const transition = reducedMotion ? 'none' : 'opacity 0.22s ease, fill 0.22s ease, transform 0.22s ease';

  const formulaHtml = useMemo(
    () => katexHtml('g_{\\text{fp16}} = \\mathrm{cast}_{\\text{fp16}}(S \\cdot g_{\\text{fp32}}),\\; g \\leftarrow g_{\\text{fp16}} / S'),
    []
  );
  const fp16RangeHtml = useMemo(() => katexHtml('|g| \\in [2^{-24},\\, 65504]'), []);

  function resetAll() {
    setLog2Scale(DEFAULT_LOG2_SCALE);
  }

  // ------- layer chip rendering -------
  function renderLayer(originX, top, label, dtype, accentVar) {
    return (
      <g>
        <rect
          x={originX}
          y={top}
          width={LAYER_W}
          height={48}
          rx={6}
          fill="var(--bg)"
          stroke={accentVar}
          strokeWidth="1.2"
          opacity="0.85"
        />
        <text
          x={originX + LAYER_W / 2}
          y={top + 18}
          fontSize="10"
          fill="var(--text-main)"
          fontFamily="var(--mono)"
          textAnchor="middle"
          letterSpacing="0.08em"
          fontWeight="700"
        >
          {label}
        </text>
        <text
          x={originX + LAYER_W / 2}
          y={top + 36}
          fontSize="8.5"
          fill={accentVar}
          fontFamily="var(--mono)"
          textAnchor="middle"
          letterSpacing="0.12em"
        >
          {dtype}
        </text>
      </g>
    );
  }

  function renderArrow(x1, y, x2) {
    return (
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke="var(--text-dim)"
        strokeWidth="1.2"
        opacity="0.7"
        markerEnd="url(#mp-arrow)"
      />
    );
  }

  function gradChipColor(state) {
    if (state === 'healthy') return 'var(--accent)';
    if (state === 'underflow') return 'var(--text-dim)';
    return 'var(--hue-pink)';
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="mp-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" opacity="0.8" />
            </marker>
          </defs>

          {/* ----- FP32 row ----- */}
          <text
            x={PAD_X}
            y={ROW_TOP_FP32 - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            FP32 PATH · 4-byte weights · 1× throughput
          </text>
          <rect
            x={PAD_X - 6}
            y={ROW_TOP_FP32 - 6}
            width={W - PAD_X * 2 + 12}
            height={ROW_H}
            rx={8}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.45"
          />

          {Array.from({ length: N_LAYERS }).map((_, i) => {
            const x = PAD_X + i * (LAYER_W + LAYER_GAP);
            return (
              <g key={`fp32-${i}`}>
                {renderLayer(x, ROW_TOP_FP32, `Layer ${i + 1}`, 'fp32', 'var(--hue-sky)')}
                {i < N_LAYERS - 1 && renderArrow(x + LAYER_W + 2, ROW_TOP_FP32 + 24, x + LAYER_W + LAYER_GAP - 2)}
              </g>
            );
          })}

          {/* fp32 memory chip */}
          <g transform={`translate(${PAD_X}, ${ROW_TOP_FP32 + 64})`}>
            <rect width={W - PAD_X * 2} height={40} rx={6} fill="var(--bg)" stroke="var(--hue-sky)" strokeWidth="1" opacity="0.7" />
            <text x={14} y={18} fontSize="10" fill="var(--text-main)" fontFamily="var(--mono)" letterSpacing="0.08em" fontWeight="700">
              MEMORY · {fmtBytes(memFp32)}
            </text>
            <text x={14} y={32} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.06em">
              w + a + grad + Adam(m1, m2) all in fp32 ≈ 5 copies
            </text>
            {/* visual memory bar */}
            <rect x={W - PAD_X * 2 - 240} y={12} width={230} height={16} rx={3} fill="var(--hue-sky)" opacity="0.45" />
            <text x={W - PAD_X * 2 - 240 + 115} y={24} fontSize="9" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
              100%
            </text>
          </g>

          {/* ----- mixed-precision row ----- */}
          <text
            x={PAD_X}
            y={ROW_TOP_MIXED - 12}
            fontSize="10"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.14em"
          >
            MIXED PRECISION · fp16 forward · fp32 master + loss scale S = 2^{log2Scale}
          </text>
          <rect
            x={PAD_X - 6}
            y={ROW_TOP_MIXED - 6}
            width={W - PAD_X * 2 + 12}
            height={ROW_H + 4}
            rx={8}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth="1"
            opacity="0.55"
          />

          {Array.from({ length: N_LAYERS }).map((_, i) => {
            const x = PAD_X + i * (LAYER_W + LAYER_GAP);
            return (
              <g key={`mp-${i}`}>
                {renderLayer(x, ROW_TOP_MIXED, `Layer ${i + 1}`, 'fp16', 'var(--accent)')}
                {i < N_LAYERS - 1 && renderArrow(x + LAYER_W + 2, ROW_TOP_MIXED + 24, x + LAYER_W + LAYER_GAP - 2)}
              </g>
            );
          })}

          {/* gradient chip strip */}
          <g transform={`translate(${PAD_X}, ${ROW_TOP_MIXED + 64})`}>
            <rect width={W - PAD_X * 2} height={48} rx={6} fill="var(--bg)" stroke="var(--border)" strokeWidth="1" opacity="0.7" />
            <text x={8} y={12} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.1em">
              gradients · S·g cast to fp16 ({healthyCount}/{N_GRADS} alive)
            </text>
            {(() => {
              const stripL = 8;
              const stripR = (W - PAD_X * 2) - 8;
              const chipW = (stripR - stripL - (N_GRADS - 1) * 4) / N_GRADS;
              return gradStates.map((g, i) => {
                const x = stripL + i * (chipW + 4);
                const color = gradChipColor(g.state);
                return (
                  <g key={`g-${i}`} style={{ transition }}>
                    <rect
                      x={x}
                      y={18}
                      width={chipW}
                      height={20}
                      rx={3}
                      fill={color}
                      opacity={g.state === 'healthy' ? 0.85 : 0.35}
                    />
                    {g.state === 'underflow' && (
                      <text
                        x={x + chipW / 2}
                        y={32}
                        fontSize="8"
                        fill="var(--text-dim)"
                        fontFamily="var(--mono)"
                        textAnchor="middle"
                        fontWeight="700"
                      >
                        0
                      </text>
                    )}
                    {g.state === 'overflow' && (
                      <g>
                        <line
                          x1={x + 3}
                          y1={22}
                          x2={x + chipW - 3}
                          y2={34}
                          stroke="var(--bg)"
                          strokeWidth="1.5"
                        />
                        <line
                          x1={x + chipW - 3}
                          y1={22}
                          x2={x + 3}
                          y2={34}
                          stroke="var(--bg)"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}
                    <text
                      x={x + chipW / 2}
                      y={45}
                      fontSize="7"
                      fill="var(--text-dim)"
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                    >
                      2^{Math.round(Math.log2(g.raw))}
                    </text>
                  </g>
                );
              });
            })()}
          </g>

          {/* status footer */}
          <text
            x={W / 2}
            y={H - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            tiny S → underflow · huge S → overflow · sweet spot keeps grads inside fp16's range
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Sliders size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              loss scale S
            </span>
            <input
              type="range"
              min="0"
              max="16"
              step="1"
              value={log2Scale}
              onChange={(e) => setLog2Scale(parseInt(e.target.value, 10))}
            />
            <span className="mlviz-slider-val">2^{log2Scale} = {lossScale.toLocaleString()}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.2rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Cpu size={11} style={{ color: 'var(--hue-sky)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              memory saved
            </span>
            <span className="mlviz-val" style={{ color: 'var(--hue-sky)', fontWeight: 800 }}>
              {fmtBytes(memSaved)} ({memSavedPct.toFixed(0)}%)
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <Gauge size={11} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              MAC speedup
            </span>
            <span className="mlviz-val" style={{ color: 'var(--accent)', fontWeight: 800 }}>
              {speedup.toFixed(1)}×
            </span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.45rem' }}>
            <HeartPulse size={11} style={{ color: healthPct > 60 ? 'var(--accent)' : 'var(--hue-pink)' }} />
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              grad health
            </span>
            <span
              className="mlviz-val"
              style={{ color: healthPct > 60 ? 'var(--accent)' : 'var(--hue-pink)', fontWeight: 800 }}
            >
              {healthPct.toFixed(0)}%
            </span>
          </span>
          <span className="mlviz-sub">
            underflow {underflowCount} · overflow {overflowCount}
          </span>
        </div>

        <div className="mlviz-row" style={{ paddingTop: '0.25rem', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
          <span className="ml-imath" style={{ fontSize: '0.82rem' }} dangerouslySetInnerHTML={{ __html: fp16RangeHtml }} />
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setLog2Scale((s) => Math.max(0, s - 1))}>
            <span>smaller S</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => setLog2Scale((s) => Math.min(16, s + 1))}>
            <span>bigger S</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={resetAll}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            {N_GRADS} grad samples · spans 2^-28 → 2^-3
          </span>
        </div>

        <div className="mlviz-hint">
          drag S left to watch small gradients vanish to zero · drag right past 2^16 and they explode to inf
        </div>
      </div>
    </div>
  );
}
