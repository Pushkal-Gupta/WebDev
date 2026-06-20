import React, { useMemo, useState } from 'react';
import { RotateCcw, Play } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

// mulberry32 deterministic seed
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// linear survival-probability schedule: block i survives with prob
// p_i = 1 - (i / (L-1)) * (1 - pL).  Deeper blocks die more often.
function survivalProbs(L, pLast) {
  if (L === 1) return [1];
  return Array.from({ length: L }, (_, i) => 1 - (i / (L - 1)) * (1 - pLast));
}

export default function StochasticDepthViz({ blocks = 8 }) {
  const L = blocks;
  const [pLast, setPLast] = useState(0.5);
  const [seed, setSeed] = useState(7);

  const probs = useMemo(() => survivalProbs(L, pLast), [L, pLast]);

  // deterministic Bernoulli draw per block for THIS forward pass
  const survives = useMemo(() => {
    const rand = mulberry32(seed * 2654435761);
    return probs.map((p) => rand() < p);
  }, [probs, seed]);

  const expectedDepth = useMemo(
    () => snap(probs.reduce((a, b) => a + b, 0), 2),
    [probs],
  );
  const aliveCount = survives.filter(Boolean).length;

  // layout: vertical stack of blocks, input at bottom, output at top
  const padTop = 30;
  const padBot = 30;
  const stackH = H - padTop - padBot;
  const blockH = stackH / L;
  const cx = W / 2;
  const blockW = 150;
  const skipX = cx + blockW / 2 + 46; // identity-skip rail on the right

  function blockY(i) {
    // i = 0 is the FIRST (bottom) block; draw bottom-up
    return padTop + (L - 1 - i) * blockH;
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* main signal spine */}
          <line x1={cx} y1={padTop} x2={cx} y2={H - padBot} stroke="var(--border)" strokeWidth="1.4" />

          {/* output / input caps */}
          <text x={cx} y={padTop - 12} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            OUTPUT
          </text>
          <text x={cx} y={H - 10} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.1em">
            INPUT
          </text>

          {probs.map((p, i) => {
            const y = blockY(i);
            const my = y + blockH / 2;
            const alive = survives[i];
            const bw = blockW;
            const bh = blockH * 0.62;
            const bx = cx - bw / 2;
            const by = my - bh / 2;
            return (
              <g key={i}>
                {alive ? (
                  <>
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      rx="7"
                      fill="rgba(var(--accent-rgb), 0.14)"
                      stroke="var(--accent)"
                      strokeWidth="1.4"
                    />
                    <text x={cx} y={my + 4} fontSize="9.5" fill="var(--text-main)" fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                      block {i} · live
                    </text>
                  </>
                ) : (
                  <>
                    {/* dropped: dashed ghost + identity skip rail */}
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      rx="7"
                      fill="none"
                      stroke="var(--text-dim)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.6"
                    />
                    <text x={cx} y={my + 4} fontSize="9.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                      block {i} · dropped
                    </text>
                    {/* identity skip: signal routes around the block */}
                    <path
                      d={`M ${cx} ${my + bh / 2 + 2} L ${skipX} ${my + bh / 2 + 2} L ${skipX} ${my - bh / 2 - 2} L ${cx} ${my - bh / 2 - 2}`}
                      fill="none"
                      stroke="var(--hue-mint)"
                      strokeWidth="1.6"
                    />
                    <text x={skipX + 6} y={my + 3} fontSize="7.5" fill="var(--hue-mint)" fontFamily="var(--mono)">
                      id
                    </text>
                  </>
                )}
                {/* survival prob label on the left */}
                <text x={bx - 12} y={my + 3} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
                  pₛ={snap(p, 2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">p_last</span>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={pLast}
            onChange={(e) => setPLast(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(pLast, 2)}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">pₛ</span>
            <span className="mlviz-val">pₛ(i) = 1 − (i / (L−1))·(1 − p_last)</span>
            <span className="mlviz-sub">deeper blocks survive less often</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">E[d]</span>
            <span className="mlviz-val">expected depth = Σ pₛ = {expectedDepth}</span>
            <span className="mlviz-sub">of {L} blocks — the network is shorter on average</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">now</span>
            <span className="mlviz-val">this pass: {aliveCount} / {L} blocks live</span>
            <span className="mlviz-sub">a fresh sub-network each forward pass — an implicit ensemble</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn mlviz-btn-primary" onClick={() => setSeed((s) => s + 1)}>
            <Play size={13} />
            <span>New forward pass</span>
          </button>
          <button type="button" className="mlviz-btn" onClick={() => { setPLast(0.5); setSeed(7); }}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          a dropped block becomes the identity — the signal skips through unchanged · at test time every block is kept and scaled by pₛ
        </div>
      </div>
    </div>
  );
}
