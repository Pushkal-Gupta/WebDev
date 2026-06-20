import React, { useMemo, useState } from 'react';
import { Snowflake, Flame, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 620;
const H = 320;
const PAD_L = 28;
const PAD_R = 28;
const PAD_T = 28;
const PAD_B = 28;

const D_OPTIONS = [512, 1024, 2048, 4096, 8192];
const R_OPTIONS = [1, 2, 4, 8, 16, 32, 64];

function fmtCount(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`;
  return `${n}`;
}

function fmtRatio(r) {
  if (r >= 1000) return `${(r / 1000).toFixed(1)}k×`;
  if (r >= 10) return `${r.toFixed(0)}×`;
  return `${r.toFixed(1)}×`;
}

export default function LoRAStructureViz() {
  const [d, setD] = useState(4096);
  const [r, setR] = useState(8);

  const stats = useMemo(() => {
    const full = d * d;
    const lora = 2 * d * r;
    return {
      full,
      lora,
      ratio: full / lora,
      pct: (lora / full) * 100,
    };
  }, [d, r]);

  // Layout in SVG: input on left -> branches into two paths -> sum -> output
  const xInput = PAD_L + 30;
  const xW = PAD_L + 170;
  const xA = PAD_L + 280;
  const xB = PAD_L + 380;
  const xSum = W - PAD_R - 110;
  const xOut = W - PAD_R - 20;

  const yMid = (PAD_T + H - PAD_B) / 2;
  const yFrozen = yMid - 70;
  const yLora = yMid + 70;

  // Width visualization for A (compressed by r/d), B (expanded by r/d)
  const fullBoxSize = 84;
  const aBoxW = fullBoxSize;
  const aBoxH = Math.max(8, fullBoxSize * (r / Math.max(d / 8, 1)));
  const bBoxW = Math.max(8, fullBoxSize * (r / Math.max(d / 8, 1)));
  const bBoxH = fullBoxSize;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '820px' }}>
          <defs>
            <marker id="lora-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--text-dim)" />
            </marker>
            <marker id="lora-arr-acc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
            </marker>
            <pattern id="lora-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--border)" strokeWidth="1.4" />
            </pattern>
          </defs>

          {/* Input */}
          <g>
            <circle cx={xInput} cy={yMid} r={14} fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />
            <text
              x={xInput}
              y={yMid + 3.5}
              fontSize="10"
              fill="var(--text-main)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              x
            </text>
            <text
              x={xInput}
              y={yMid + 28}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.08em"
            >
              ∈ ℝ^d
            </text>
            <text
              x={xInput}
              y={yMid - 22}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              INPUT
            </text>
          </g>

          {/* Branch lines: input -> W (top) and input -> A (bottom) */}
          <path
            d={`M ${xInput + 14} ${yMid} L ${xW - fullBoxSize / 2 - 4} ${yFrozen}`}
            stroke="var(--text-dim)"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
            markerEnd="url(#lora-arr)"
          />
          <path
            d={`M ${xInput + 14} ${yMid} L ${xA - aBoxW / 2 - 4} ${yLora}`}
            stroke="var(--accent)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.85"
            markerEnd="url(#lora-arr-acc)"
          />

          {/* Top path: frozen W */}
          <g>
            <text
              x={xW}
              y={yFrozen - fullBoxSize / 2 - 18}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.14em"
            >
              FROZEN PRETRAINED
            </text>
            <rect
              x={xW - fullBoxSize / 2}
              y={yFrozen - fullBoxSize / 2}
              width={fullBoxSize}
              height={fullBoxSize}
              fill="url(#lora-hatch)"
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              rx={4}
            />
            <rect
              x={xW - fullBoxSize / 2}
              y={yFrozen - fullBoxSize / 2}
              width={fullBoxSize}
              height={fullBoxSize}
              fill="rgba(0,0,0,0)"
              stroke="var(--text-dim)"
              strokeWidth="1.2"
              rx={4}
            />
            <text
              x={xW}
              y={yFrozen + 3}
              fontSize="14"
              fill="var(--text-main)"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              textAnchor="middle"
              fontWeight="700"
            >
              W
            </text>
            <text
              x={xW}
              y={yFrozen + fullBoxSize / 2 + 14}
              fontSize="8.5"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              d × d
            </text>
            <text
              x={xW}
              y={yFrozen + fullBoxSize / 2 + 26}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              {fmtCount(stats.full)} params
            </text>
            {/* lock icon overlay via SVG */}
            <g transform={`translate(${xW + fullBoxSize / 2 - 14}, ${yFrozen - fullBoxSize / 2 + 4})`}>
              <rect x={0} y={4} width={10} height={8} rx={1.5} fill="var(--text-dim)" />
              <path d="M 2 4 V 2 a 3 3 0 0 1 6 0 V 4" stroke="var(--text-dim)" strokeWidth="1.2" fill="none" />
            </g>
          </g>

          {/* W -> Sum */}
          <path
            d={`M ${xW + fullBoxSize / 2 + 4} ${yFrozen} C ${xSum - 50} ${yFrozen}, ${xSum - 60} ${yMid - 8}, ${xSum - 14} ${yMid - 6}`}
            stroke="var(--text-dim)"
            strokeWidth="1.1"
            fill="none"
            opacity="0.75"
            markerEnd="url(#lora-arr)"
          />
          <text
            x={(xW + xSum) / 2}
            y={yFrozen - 6}
            fontSize="8.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            W·x
          </text>

          {/* Bottom path: A -> B (trainable LoRA) */}
          {/* A box */}
          <g>
            <text
              x={(xA + xB) / 2}
              y={yLora + fullBoxSize / 2 + 30}
              fontSize="8.5"
              fill="var(--accent)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.14em"
              fontWeight="700"
            >
              TRAINABLE LOW-RANK · r = {r}
            </text>
            <rect
              x={xA - aBoxW / 2}
              y={yLora - aBoxH / 2}
              width={aBoxW}
              height={aBoxH}
              fill="rgba(var(--accent-rgb, 0,255,245), 0.18)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              rx={3}
            />
            <text
              x={xA}
              y={yLora + 4}
              fontSize="13"
              fill="var(--accent)"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              textAnchor="middle"
              fontWeight="700"
            >
              A
            </text>
            <text
              x={xA}
              y={yLora + aBoxH / 2 + 12}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              r × d
            </text>
            {/* flame icon */}
            <g transform={`translate(${xA - aBoxW / 2 - 14}, ${yLora - aBoxH / 2 - 2})`}>
              <path
                d="M 5 0 C 7 4 9 4 7 8 C 9 8 10 6 9 4 C 9 8 11 9 8 12 C 5 14 1 12 2 8 C 3 10 4 9 4 7 C 4 4 5 4 5 0 z"
                fill="var(--accent)"
                opacity="0.85"
              />
            </g>
          </g>

          {/* A -> B arrow with r-bottleneck label */}
          <line
            x1={xA + aBoxW / 2 + 4}
            y1={yLora}
            x2={xB - bBoxW / 2 - 4}
            y2={yLora}
            stroke="var(--accent)"
            strokeWidth="1.2"
            opacity="0.85"
            markerEnd="url(#lora-arr-acc)"
          />
          <text
            x={(xA + xB) / 2}
            y={yLora - 8}
            fontSize="9"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            fontWeight="700"
            letterSpacing="0.06em"
          >
            ℝ^{r}
          </text>
          <text
            x={(xA + xB) / 2}
            y={yLora + 16}
            fontSize="7.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            bottleneck
          </text>

          {/* B box */}
          <g>
            <rect
              x={xB - bBoxW / 2}
              y={yLora - bBoxH / 2}
              width={bBoxW}
              height={bBoxH}
              fill="rgba(var(--accent-rgb, 0,255,245), 0.18)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              rx={3}
            />
            <text
              x={xB}
              y={yLora + 4}
              fontSize="13"
              fill="var(--accent)"
              fontFamily="var(--serif, serif)"
              fontStyle="italic"
              textAnchor="middle"
              fontWeight="700"
            >
              B
            </text>
            <text
              x={xB}
              y={yLora + bBoxH / 2 + 12}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              d × r
            </text>
            {/* flame icon */}
            <g transform={`translate(${xB + bBoxW / 2 + 4}, ${yLora - bBoxH / 2 - 2})`}>
              <path
                d="M 5 0 C 7 4 9 4 7 8 C 9 8 10 6 9 4 C 9 8 11 9 8 12 C 5 14 1 12 2 8 C 3 10 4 9 4 7 C 4 4 5 4 5 0 z"
                fill="var(--accent)"
                opacity="0.85"
              />
            </g>
          </g>

          {/* B -> Sum */}
          <path
            d={`M ${xB + bBoxW / 2 + 4} ${yLora} C ${xSum - 50} ${yLora}, ${xSum - 60} ${yMid + 8}, ${xSum - 14} ${yMid + 6}`}
            stroke="var(--accent)"
            strokeWidth="1.2"
            fill="none"
            opacity="0.85"
            markerEnd="url(#lora-arr-acc)"
          />
          <text
            x={(xB + xSum) / 2}
            y={yLora - 8}
            fontSize="8.5"
            fill="var(--accent)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
          >
            (α/r)·BAx
          </text>

          {/* Sum node */}
          <g>
            <circle cx={xSum} cy={yMid} r={14} fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4" />
            <text
              x={xSum}
              y={yMid + 4}
              fontSize="14"
              fill="var(--accent)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              +
            </text>
          </g>

          {/* Sum -> output */}
          <line
            x1={xSum + 14}
            y1={yMid}
            x2={xOut - 8}
            y2={yMid}
            stroke="var(--accent)"
            strokeWidth="1.2"
            markerEnd="url(#lora-arr-acc)"
          />
          <g>
            <circle cx={xOut} cy={yMid} r={14} fill="rgba(var(--accent-rgb, 0,255,245), 0.15)" stroke="var(--accent)" strokeWidth="1.4" />
            <text
              x={xOut}
              y={yMid + 4}
              fontSize="10"
              fill="var(--accent)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              fontWeight="700"
            >
              h
            </text>
            <text
              x={xOut}
              y={yMid - 22}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
              letterSpacing="0.1em"
            >
              OUTPUT
            </text>
            <text
              x={xOut}
              y={yMid + 28}
              fontSize="8"
              fill="var(--text-dim)"
              fontFamily="var(--mono, monospace)"
              textAnchor="middle"
            >
              ∈ ℝ^d
            </text>
          </g>

          {/* Bottom equation strip */}
          <text
            x={W / 2}
            y={H - 8}
            fontSize="9.5"
            fill="var(--text-main)"
            fontFamily="var(--mono, monospace)"
            textAnchor="middle"
            letterSpacing="0.06em"
          >
            h = W·x + (α/r) · B·A·x
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.4rem' }}>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag" style={{ color: 'var(--text-dim)' }}>
              <Snowflake size={13} style={{ verticalAlign: 'middle' }} /> frozen W
            </span>
            <span className="mlviz-val">{fmtCount(stats.full)}</span>
            <span className="mlviz-sub">d² parameters (no gradient, no optimizer state)</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag" style={{ color: 'var(--accent)' }}>
              <Flame size={13} style={{ verticalAlign: 'middle' }} /> LoRA
            </span>
            <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{fmtCount(stats.lora)}</span>
            <span className="mlviz-sub">2·d·r parameters (trained)</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.7rem' }}>
            <span className="mlviz-tag">save</span>
            <span className="mlviz-val" style={{ color: 'var(--easy, #28c244)' }}>
              {fmtRatio(stats.ratio)} fewer params
            </span>
            <span className="mlviz-sub">{stats.pct.toFixed(3)}% of full fine-tune</span>
          </div>
        </div>

        <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem' }}>
          <span className="mlviz-slider-label">HIDDEN DIM d</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {D_OPTIONS.map((opt) => (
              <button
                key={`d-${opt}`}
                type="button"
                className={`mlviz-btn ${d === opt ? 'mlviz-btn-primary' : ''}`}
                onClick={() => setD(opt)}
                style={{ padding: '0.28rem 0.6rem' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mlviz-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem' }}>
          <span className="mlviz-slider-label">LORA RANK r</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {R_OPTIONS.map((opt) => (
              <button
                key={`r-${opt}`}
                type="button"
                className={`mlviz-btn ${r === opt ? 'mlviz-btn-primary' : ''}`}
                onClick={() => setR(opt)}
                style={{ padding: '0.28rem 0.6rem' }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setD(4096); setR(8); }}
          >
            <RotateCcw size={13} />
            <span>Reset (d=4096, r=8)</span>
          </button>
        </div>

        <div className="mlviz-hint">
          adapter holds {((stats.lora / stats.full) * 100).toFixed(3)}% of the full weight count · base stays frozen
        </div>
      </div>
    </div>
  );
}

