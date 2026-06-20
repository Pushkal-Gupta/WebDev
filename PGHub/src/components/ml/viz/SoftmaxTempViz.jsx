import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 320;
const LEFT = 46;
const TOP = 34;
const BOT = 46;

const LOGITS = [2.0, 0.5, 1.2, -0.4, 0.9];
const LABELS = ['c0', 'c1', 'c2', 'c3', 'c4'];

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function softmaxT(z, T) {
  const scaled = z.map((zi) => zi / T);
  const m = Math.max(...scaled);
  const exps = scaled.map((s) => Math.exp(s - m));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function crossEntropy(target, pred) {
  let s = 0;
  for (let i = 0; i < target.length; i++) {
    if (target[i] > 1e-12) s -= target[i] * Math.log(Math.max(pred[i], 1e-12));
  }
  return s;
}

export default function SoftmaxTempViz() {
  const [T, setT] = useState(1.0);
  const [targetIdx, setTargetIdx] = useState(0);

  const K = LOGITS.length;
  const probs = useMemo(() => softmaxT(LOGITS, T), [T]);

  const target = useMemo(() => {
    const t = Array(K).fill(0);
    t[targetIdx] = 1;
    return t;
  }, [targetIdx, K]);

  const ce = crossEntropy(target, probs);

  // chart layout
  const cw = W - LEFT * 2;
  const ch = H - TOP - BOT;
  const barW = cw / K;

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg mlviz-svg-wide"
          style={{ maxWidth: '820px' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <text x={LEFT} y={20} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" letterSpacing="0.12em">
            softmax(z / T) · T = {snap(T, 2)} · target = {LABELS[targetIdx]}
          </text>

          {/* gridlines */}
          {[0.25, 0.5, 0.75, 1.0].map((g) => (
            <g key={`g-${g}`}>
              <line
                x1={LEFT}
                y1={TOP + ch - g * ch}
                x2={LEFT + cw}
                y2={TOP + ch - g * ch}
                stroke="var(--border)"
                strokeWidth="0.4"
                strokeDasharray="2 3"
                opacity="0.5"
              />
              <text x={LEFT - 6} y={TOP + ch - g * ch + 3} fontSize="7" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="end">
                {snap(g, 2)}
              </text>
            </g>
          ))}
          <line x1={LEFT} y1={TOP + ch} x2={LEFT + cw} y2={TOP + ch} stroke="var(--border)" strokeWidth="0.8" />

          {probs.map((pr, i) => {
            const bx = LEFT + i * barW + barW * 0.2;
            const bh = Math.max(2, pr * ch);
            const by = TOP + ch - bh;
            const isTarget = i === targetIdx;
            return (
              <g key={`bar-${i}`}>
                <rect
                  x={bx}
                  y={by}
                  width={barW * 0.6}
                  height={bh}
                  rx="2"
                  fill={isTarget ? 'var(--accent)' : 'var(--hue-violet)'}
                  opacity={isTarget ? 0.9 : 0.55}
                />
                <text x={bx + barW * 0.3} y={by - 4} fontSize="8" fill={isTarget ? 'var(--accent)' : 'var(--text-main)'} fontFamily="var(--mono)" textAnchor="middle" fontWeight="700">
                  {snap(pr, 2)}
                </text>
                <text x={bx + barW * 0.3} y={TOP + ch + 13} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  {LABELS[i]}
                </text>
                <text x={bx + barW * 0.3} y={TOP + ch + 24} fontSize="6.5" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
                  z={snap(LOGITS[i], 1)}
                </text>
                {isTarget && (
                  <text x={bx + barW * 0.3} y={TOP + ch + 34} fontSize="6.5" fill="var(--accent)" fontFamily="var(--mono)" textAnchor="middle" letterSpacing="0.06em">
                    target
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">temp T</span>
          <input
            type="range"
            min="0.2"
            max="5"
            step="0.1"
            value={T}
            onChange={(e) => setT(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(T, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">target</span>
          <input
            type="range"
            min="0"
            max={K - 1}
            step="1"
            value={targetIdx}
            onChange={(e) => setTargetIdx(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{LABELS[targetIdx]}</span>
        </label>

        <div className="mlviz-row mlviz-row-hi" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">p</span>
            <span className="mlviz-val">[{probs.map((pr) => snap(pr, 2)).join(', ')}]</span>
            <span className="mlviz-sub">{T < 0.95 ? 'low T sharpens toward argmax' : T > 1.05 ? 'high T flattens toward uniform' : 'T = 1 is plain softmax'}</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">CE</span>
            <span className="mlviz-val">−log p[{LABELS[targetIdx]}] = {snap(ce, 3)}</span>
            <span className="mlviz-sub">cross-entropy against the one-hot target</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">p★</span>
            <span className="mlviz-val">p[target] = {snap(probs[targetIdx], 3)}</span>
            <span className="mlviz-sub">CE falls as the target prob rises</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setT(1.0); setTargetIdx(0); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          temperature reshapes the distribution before CE scores it · sharp + correct = low loss, flat = high loss
        </div>
      </div>
    </div>
  );
}
