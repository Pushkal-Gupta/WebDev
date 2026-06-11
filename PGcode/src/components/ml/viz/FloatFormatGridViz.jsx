import React, { useState } from 'react';
import { RotateCcw, Binary } from 'lucide-react';
import './MLViz.css';

const FORMATS = [
  {
    key: 'fp32',
    label: 'fp32',
    sign: 1,
    exp: 8,
    mant: 23,
    accent: 'var(--text-dim)',
    range: '3.4e+38',
    minNormal: '1.18e-38',
    eps: '1.2e-7',
    digits: 7.2,
    note: 'baseline · the safe default',
  },
  {
    key: 'bf16',
    label: 'bf16',
    sign: 1,
    exp: 8,
    mant: 7,
    accent: 'var(--hue-mint)',
    range: '3.4e+38',
    minNormal: '1.18e-38',
    eps: '7.8e-3',
    digits: 2.3,
    note: 'same range as fp32 · A100+/TPU favourite',
  },
  {
    key: 'fp16',
    label: 'fp16',
    sign: 1,
    exp: 5,
    mant: 10,
    accent: 'var(--hue-sky)',
    range: '65504',
    minNormal: '6.10e-5',
    eps: '9.8e-4',
    digits: 3.3,
    note: 'needs a grad scaler · overflows easily',
  },
  {
    key: 'fp8_e4m3',
    label: 'fp8 E4M3',
    sign: 1,
    exp: 4,
    mant: 3,
    accent: 'var(--hue-pink)',
    range: '448',
    minNormal: '1.95e-3',
    eps: '1.2e-1',
    digits: 1.1,
    note: 'needs per-tensor scaling · weights/acts',
  },
  {
    key: 'fp8_e5m2',
    label: 'fp8 E5M2',
    sign: 1,
    exp: 5,
    mant: 2,
    accent: 'var(--warning)',
    range: '57344',
    minNormal: '6.10e-5',
    eps: '2.5e-1',
    digits: 0.7,
    note: 'used for gradient tensors',
  },
];

const W_SVG = 740;
const H_SVG = 420;
const PAD_L = 96;
const PAD_R = 24;
const PAD_T = 32;
const PAD_B = 60;
const ROW_H = (H_SVG - PAD_T - PAD_B) / FORMATS.length;

export default function FloatFormatGridViz() {
  const [active, setActive] = useState('bf16');
  const fmt = FORMATS.find((f) => f.key === active) || FORMATS[0];

  const plotW = W_SVG - PAD_L - PAD_R;
  const maxBits = 32;
  const cellW = plotW / maxBits;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} className="mlviz-svg" preserveAspectRatio="xMidYMid meet">
          <text x={W_SVG / 2} y={18} fontFamily="var(--mono)" fontSize="11" fill="var(--text-dim)" textAnchor="middle" letterSpacing="0.08em">
            FLOAT FORMATS &nbsp;·&nbsp; sign + exponent + mantissa
          </text>

          {Array.from({ length: 33 }, (_, i) => i).filter((i) => i % 8 === 0).map((i) => (
            <g key={`g${i}`}>
              <line x1={PAD_L + i * cellW} y1={PAD_T - 4} x2={PAD_L + i * cellW} y2={H_SVG - PAD_B + 4} stroke="var(--border)" strokeWidth="0.6" opacity="0.35" />
              <text x={PAD_L + i * cellW} y={H_SVG - PAD_B + 18} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)" textAnchor="middle">{i} bits</text>
            </g>
          ))}

          {FORMATS.map((f, i) => {
            const y = PAD_T + i * ROW_H;
            const total = f.sign + f.exp + f.mant;
            const isActive = f.key === active;

            return (
              <g key={f.key} onClick={() => setActive(f.key)} style={{ cursor: 'pointer' }}>
                <rect
                  x={2}
                  y={y + 2}
                  width={W_SVG - 4}
                  height={ROW_H - 4}
                  fill={isActive ? 'rgba(var(--accent-rgb), 0.07)' : 'transparent'}
                  stroke={isActive ? 'var(--accent)' : 'transparent'}
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={PAD_L - 12}
                  y={y + ROW_H / 2 + 4}
                  fontFamily="var(--mono)"
                  fontSize="12"
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? f.accent : 'var(--text-main)'}
                  textAnchor="end"
                >
                  {f.label}
                </text>

                <rect
                  x={PAD_L}
                  y={y + ROW_H / 2 - 14}
                  width={f.sign * cellW}
                  height={28}
                  fill="var(--text-dim)"
                  opacity={isActive ? 0.85 : 0.45}
                  rx="2"
                />
                <rect
                  x={PAD_L + f.sign * cellW}
                  y={y + ROW_H / 2 - 14}
                  width={f.exp * cellW}
                  height={28}
                  fill="var(--hue-pink)"
                  opacity={isActive ? 0.92 : 0.55}
                  rx="2"
                />
                <rect
                  x={PAD_L + (f.sign + f.exp) * cellW}
                  y={y + ROW_H / 2 - 14}
                  width={f.mant * cellW}
                  height={28}
                  fill="var(--hue-sky)"
                  opacity={isActive ? 0.92 : 0.55}
                  rx="2"
                />

                {isActive && (
                  <>
                    <text x={PAD_L + (f.sign * cellW) / 2} y={y + ROW_H / 2 + 4} fontFamily="var(--mono)" fontSize="9" fill="var(--bg)" textAnchor="middle" fontWeight="700">S</text>
                    <text x={PAD_L + (f.sign + f.exp / 2) * cellW} y={y + ROW_H / 2 + 4} fontFamily="var(--mono)" fontSize="10" fill="var(--bg)" textAnchor="middle" fontWeight="700">{f.exp}E</text>
                    <text x={PAD_L + (f.sign + f.exp + f.mant / 2) * cellW} y={y + ROW_H / 2 + 4} fontFamily="var(--mono)" fontSize="10" fill="var(--bg)" textAnchor="middle" fontWeight="700">{f.mant}M</text>
                  </>
                )}

                <text
                  x={PAD_L + total * cellW + 10}
                  y={y + ROW_H / 2 + 4}
                  fontFamily="var(--mono)"
                  fontSize="10.5"
                  fill={isActive ? 'var(--text-main)' : 'var(--text-dim)'}
                  fontWeight={isActive ? 600 : 400}
                >
                  {total} bits
                </text>
              </g>
            );
          })}

          <g transform={`translate(${PAD_L}, ${H_SVG - PAD_B + 30})`}>
            <rect x={0} y={0} width={10} height={10} fill="var(--text-dim)" opacity="0.85" />
            <text x={16} y={9} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)">sign</text>
            <rect x={60} y={0} width={10} height={10} fill="var(--hue-pink)" opacity="0.85" />
            <text x={76} y={9} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)">exponent (range)</text>
            <rect x={210} y={0} width={10} height={10} fill="var(--hue-sky)" opacity="0.85" />
            <text x={226} y={9} fontSize="10" fontFamily="var(--mono)" fill="var(--text-dim)">mantissa (precision)</text>
          </g>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-row-hi">
          <span className="mlviz-tag" style={{ color: fmt.accent }}>{fmt.label}</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>1S · {fmt.exp}E · {fmt.mant}M = {fmt.sign + fmt.exp + fmt.mant} bits</span>
          <span className="mlviz-sub">{fmt.note}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-pink)' }}>range</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>max ≈ {fmt.range} · min normal ≈ {fmt.minNormal}</span>
        </div>
        <div className="mlviz-row">
          <span className="mlviz-tag" style={{ color: 'var(--hue-sky)' }}>precision</span>
          <span className="mlviz-val" style={{ fontFamily: 'var(--mono)' }}>ε ≈ {fmt.eps} · ~{fmt.digits.toFixed(1)} decimal digits</span>
        </div>
      </div>

      <div className="mlviz-controls">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <Binary size={13} /> tap a row
        </span>
        {FORMATS.map((f) => (
          <button key={f.key} type="button" className="mlviz-btn" onClick={() => setActive(f.key)} style={{ opacity: f.key === active ? 1 : 0.7 }}>
            {f.label}
          </button>
        ))}
        <button type="button" className="mlviz-btn" onClick={() => setActive('bf16')}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
