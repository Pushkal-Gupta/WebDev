import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 320;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// Two class glyphs drawn into the same little frame so the blend reads as a
// crossfade. Class A = a triangle ("cat"), class B = a square ("dog").
function GlyphA({ cx, cy, r, opacity, color }) {
  const pts = [
    [cx, cy - r],
    [cx - r * 0.92, cy + r * 0.72],
    [cx + r * 0.92, cy + r * 0.72],
  ]
    .map((p) => p.join(','))
    .join(' ');
  return <polygon points={pts} fill={color} opacity={opacity} stroke={color} strokeWidth="1.5" />;
}

function GlyphB({ cx, cy, r, opacity, color }) {
  const s = r * 1.5;
  return (
    <rect
      x={cx - s / 2}
      y={cy - s / 2}
      width={s}
      height={s}
      rx={s * 0.14}
      fill={color}
      opacity={opacity}
      stroke={color}
      strokeWidth="1.5"
    />
  );
}

export default function MixupBlendViz() {
  const [lambda, setLambda] = useState(0.65);

  // one-hot labels for a 2-class problem: A = [1,0], B = [0,1]
  // mixup convention: x = lam*xA + (1-lam)*xB, y = lam*yA + (1-lam)*yB
  const yMix = useMemo(() => [lambda, 1 - lambda], [lambda]);

  const aOp = lambda;
  const bOp = 1 - lambda;

  // panel geometry
  const padX = 36;
  const panelW = (W - padX * 3) / 3;
  const cyMid = 150;
  const glyphR = 46;

  const cAx = padX + panelW / 2;
  const cBx = padX * 3 + panelW * 2.5;
  const cMx = padX * 2 + panelW * 1.5;

  // soft-label bar geometry (bottom strip)
  const barY = 250;
  const barH = 30;
  const barLeft = cMx - panelW / 2;
  const barW = panelW;

  function panelFrame(x0, label, sub) {
    return (
      <g>
        <rect
          x={x0}
          y={70}
          width={panelW}
          height={140}
          rx="10"
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        <text
          x={x0 + panelW / 2}
          y={58}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          textAnchor="middle"
          letterSpacing="0.1em"
        >
          {label}
        </text>
        {sub && (
          <text
            x={x0 + panelW / 2}
            y={226}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
          >
            {sub}
          </text>
        )}
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '840px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Source A */}
          {panelFrame(padX, 'CLASS A · cat', 'y = [1, 0]')}
          <GlyphA cx={cAx} cy={cyMid} r={glyphR} opacity={0.85} color="var(--hue-sky)" />

          {/* Mixed center panel */}
          {panelFrame(padX * 2 + panelW, 'MIXED INPUT', `λ = ${snap(lambda, 2)}`)}
          <GlyphA cx={cMx} cy={cyMid} r={glyphR} opacity={aOp} color="var(--hue-sky)" />
          <GlyphB cx={cMx} cy={cyMid} r={glyphR} opacity={bOp} color="var(--hue-pink)" />

          {/* Source B */}
          {panelFrame(padX * 3 + panelW * 2, 'CLASS B · dog', 'y = [0, 1]')}
          <GlyphB cx={cBx} cy={cyMid} r={glyphR} opacity={0.85} color="var(--hue-pink)" />

          {/* blend arrows */}
          <text x={cAx + panelW / 2 + 4} y={cyMid + 4} fontSize="16" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">→</text>
          <text x={cBx - panelW / 2 - 4} y={cyMid + 4} fontSize="16" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">←</text>

          {/* soft-label bar */}
          <text
            x={barLeft}
            y={barY - 6}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.08em"
          >
            SOFT TARGET ỹ
          </text>
          <rect x={barLeft} y={barY} width={barW * lambda} height={barH} fill="var(--hue-sky)" opacity="0.7" />
          <rect
            x={barLeft + barW * lambda}
            y={barY}
            width={barW * (1 - lambda)}
            height={barH}
            fill="var(--hue-pink)"
            opacity="0.7"
          />
          <rect x={barLeft} y={barY} width={barW} height={barH} fill="none" stroke="var(--border)" strokeWidth="1" rx="4" />
          {lambda > 0.12 && (
            <text x={barLeft + (barW * lambda) / 2} y={barY + barH / 2 + 4} fontSize="10" fill="var(--bg)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
              {snap(lambda, 2)}
            </text>
          )}
          {1 - lambda > 0.12 && (
            <text x={barLeft + barW * lambda + (barW * (1 - lambda)) / 2} y={barY + barH / 2 + 4} fontSize="10" fill="var(--bg)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
              {snap(1 - lambda, 2)}
            </text>
          )}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">λ</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={lambda}
            onChange={(e) => setLambda(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(lambda, 2)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">x̃</span>
            <span className="mlviz-val">x̃ = λ·x_A + (1−λ)·x_B</span>
            <span className="mlviz-sub">the pixels crossfade as you drag</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">ỹ</span>
            <span className="mlviz-val">ỹ = [{snap(yMix[0], 2)}, {snap(yMix[1], 2)}]</span>
            <span className="mlviz-sub">the label moves in lockstep with the pixels</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">L</span>
            <span className="mlviz-val">
              L = λ·CE(f(x̃), A) + (1−λ)·CE(f(x̃), B)
            </span>
            <span className="mlviz-sub">loss is the same λ-blend of the two class losses</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={() => setLambda(0.65)}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          λ near 0 or 1 → almost a real example · λ near 0.5 → a halfway point that forces a gentle, linear boundary
        </div>
      </div>
    </div>
  );
}
