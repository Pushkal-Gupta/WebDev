import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 360;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Reference compound-scaling constants (EfficientNet-style): base coefficients
// chosen so that alpha * beta^2 * gamma^2 ~= 2, meaning FLOPs ~ 2^phi.
const ALPHA = 1.2; // depth
const BETA = 1.1; // width
const GAMMA = 1.15; // resolution

export default function EfficientNetScalingViz() {
  // mode: 'compound' links all three via phi; 'manual' lets user push one axis
  const [phi, setPhi] = useState(1);
  const [mode, setMode] = useState('compound');
  const [manualDepth, setManualDepth] = useState(1.2);
  const [manualWidth, setManualWidth] = useState(1.1);
  const [manualRes, setManualRes] = useState(1.15);

  const { d, w, r } = useMemo(() => {
    if (mode === 'compound') {
      return {
        d: Math.pow(ALPHA, phi),
        w: Math.pow(BETA, phi),
        r: Math.pow(GAMMA, phi),
      };
    }
    return { d: manualDepth, w: manualWidth, r: manualRes };
  }, [mode, phi, manualDepth, manualWidth, manualRes]);

  // FLOPs scale roughly as depth * width^2 * resolution^2
  const flops = d * w * w * r * r;

  // toy accuracy model: balanced scaling yields diminishing-but-steady gains;
  // lopsided scaling saturates fast (penalty when one axis dwarfs the others).
  const geoMean = Math.cbrt(d * w * r);
  const spread = Math.max(d, w, r) / Math.min(d, w, r); // 1 = perfectly balanced
  const balancePenalty = Math.min(0.6, (spread - 1) * 0.18);
  const acc = 76 + 8 * Math.log2(geoMean + 0.0001) - balancePenalty * 6;
  const accClamped = Math.max(70, Math.min(86, acc));

  // ---- network box: depth = #stacked blocks, width = block thickness,
  //      resolution = feature-map square size ----
  const baseBlocks = 4;
  const nBlocks = Math.max(1, Math.round(baseBlocks * d));
  const blockW = 18 * w;
  const fmSize = 40 * r;

  const netX = 60;
  const netY = 60;
  const blockGap = 4;
  const maxBlocks = 12;
  const shownBlocks = Math.min(maxBlocks, nBlocks);
  const blockH = Math.min(20, (200 - blockGap * (shownBlocks - 1)) / shownBlocks);

  function axisBar(label, val, ref, y, color) {
    const max = 2.2;
    const bw = 150;
    return (
      <g transform={`translate(360,${y})`}>
        <text x="0" y="0" fontSize="8.5" fill="var(--text-dim)" fontFamily="var(--mono)">
          {label}
        </text>
        <rect x="0" y="6" width={bw} height="12" rx="3" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.6" />
        <rect x="0" y="6" width={Math.min(bw, (val / max) * bw)} height="12" rx="3" fill={color} opacity="0.7" />
        <line x1={(1 / max) * bw} y1="3" x2={(1 / max) * bw} y2="21" stroke="var(--border)" strokeWidth="0.8" strokeDasharray="2 2" />
        <text x={bw + 6} y="16" fontSize="8.5" fill="var(--text-main)" fontFamily="var(--mono)">
          {snap(val, 2)}×
        </text>
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: '840px' }}
        >
          <text x="30" y="34" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            NETWORK · depth = #blocks · width = block thickness · resolution = feature-map size
          </text>

          {/* resolution: feature-map square behind the stack */}
          <rect
            x={netX - 6}
            y={netY - 6}
            width={Math.min(120, fmSize + 12)}
            height={Math.min(230, shownBlocks * (blockH + blockGap) + 12)}
            rx="4"
            fill="var(--hue-mint)"
            opacity="0.1"
            stroke="var(--hue-mint)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
          />

          {/* depth stack of blocks, width = block width */}
          {Array.from({ length: shownBlocks }).map((_, i) => (
            <rect
              key={`blk-${i}`}
              x={netX}
              y={netY + i * (blockH + blockGap)}
              width={Math.min(110, blockW)}
              height={blockH}
              rx="2.5"
              fill="var(--hue-violet)"
              opacity={0.4 + 0.04 * i}
              stroke="var(--border)"
              strokeWidth="0.5"
            />
          ))}
          {nBlocks > maxBlocks && (
            <text x={netX} y={netY + shownBlocks * (blockH + blockGap) + 12} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)">
              … {nBlocks} blocks total
            </text>
          )}

          {axisBar('depth (α^φ)', d, 1, 70, 'var(--hue-violet)')}
          {axisBar('width (β^φ)', w, 1, 110, 'var(--hue-sky)')}
          {axisBar('resolution (γ^φ)', r, 1, 150, 'var(--hue-mint)')}

          {/* readouts */}
          <g transform="translate(360,205)">
            <rect x="0" y="0" width="200" height="56" rx="4" fill="var(--surface)" stroke="var(--border)" strokeWidth="0.6" />
            <text x="10" y="20" fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">
              FLOPs ≈ d·w²·r² = {snap(flops, 2)}×
            </text>
            <text x="10" y="38" fontSize="9" fill="var(--accent)" fontFamily="var(--mono)">
              accuracy ≈ {snap(accClamped, 1)}%
            </text>
            <text x="10" y="52" fontSize="7.5" fill={spread > 1.6 ? 'var(--warning)' : 'var(--text-dim)'} fontFamily="var(--mono)">
              balance spread {snap(spread, 2)}× {spread > 1.6 ? '· lopsided!' : '· balanced'}
            </text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-toggles">
          <button
            type="button"
            className={`mlviz-toggle ${mode === 'compound' ? 'is-on' : ''}`}
            onClick={() => setMode('compound')}
          >
            <span className="mlviz-toggle-dot" />
            compound (one φ)
          </button>
          <button
            type="button"
            className={`mlviz-toggle ${mode === 'manual' ? 'is-on' : ''}`}
            onClick={() => setMode('manual')}
          >
            <span className="mlviz-toggle-dot" />
            manual (push one axis)
          </button>
        </div>

        {mode === 'compound' ? (
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">φ (compound)</span>
            <input type="range" min="0" max="4" step="0.25" value={phi} onChange={(e) => setPhi(parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{snap(phi, 2)}</span>
          </label>
        ) : (
          <>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label">depth</span>
              <input type="range" min="1" max="2.2" step="0.05" value={manualDepth} onChange={(e) => setManualDepth(parseFloat(e.target.value))} />
              <span className="mlviz-slider-val">{snap(manualDepth, 2)}×</span>
            </label>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label">width</span>
              <input type="range" min="1" max="2.2" step="0.05" value={manualWidth} onChange={(e) => setManualWidth(parseFloat(e.target.value))} />
              <span className="mlviz-slider-val">{snap(manualWidth, 2)}×</span>
            </label>
            <label className="mlviz-slider">
              <span className="mlviz-slider-label">resolution</span>
              <input type="range" min="1" max="2.2" step="0.05" value={manualRes} onChange={(e) => setManualRes(parseFloat(e.target.value))} />
              <span className="mlviz-slider-val">{snap(manualRes, 2)}×</span>
            </label>
          </>
        )}

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">acc/FLOP</span>
            <span className="mlviz-val">{snap(accClamped, 1)}% at {snap(flops, 2)}× cost</span>
            <span className="mlviz-sub">{mode === 'compound' ? 'balanced growth tracks the efficient frontier' : 'try pushing one slider far — accuracy saturates'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">d·w·r</span>
            <span className="mlviz-val">{snap(d, 2)} · {snap(w, 2)} · {snap(r, 2)}</span>
            <span className="mlviz-sub">geometric mean {snap(geoMean, 2)}× drives capacity; spread wastes it</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setPhi(1); setMode('compound'); setManualDepth(1.2); setManualWidth(1.1); setManualRes(1.15); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          compound scaling moves all three axes together with one knob φ · pushing one axis alone hits diminishing returns
        </div>
      </div>
    </div>
  );
}
