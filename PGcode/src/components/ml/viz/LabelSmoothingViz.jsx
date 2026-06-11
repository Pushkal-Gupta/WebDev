import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 600;
const H = 360;
const LEFT_PAD = 50;
const TOP_PAD = 40;
const BOT_PAD = 48;
const PANEL_W = (W - LEFT_PAD * 2) / 2;

function snap(v, p = 2) {
  const m = Math.pow(10, p);
  return Math.round(v * m) / m;
}

function softmax(z) {
  const m = Math.max(...z);
  const exps = z.map((zi) => Math.exp(zi - m));
  const s = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / s);
}

// mulberry32 deterministic seed (no extra dep — match other viz)
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

// generate K logits with a moderately confident model;
// true class is fixed at floor(K/2) and gets the biggest logit
function buildLogits(K) {
  const rand = mulberry32(101 + K);
  const trueClass = Math.floor(K / 2);
  const z = [];
  for (let i = 0; i < K; i++) {
    z.push(0.6 + rand() * 1.0);
  }
  z[trueClass] = 3.4;
  return { z, trueClass };
}

function klDivergence(p, q) {
  // KL(p || q) = sum p_i log(p_i / q_i); skip i where p_i == 0
  let s = 0;
  for (let i = 0; i < p.length; i++) {
    if (p[i] > 1e-12) s += p[i] * Math.log(p[i] / Math.max(q[i], 1e-12));
  }
  return s;
}

function crossEntropy(target, pred) {
  // CE(target, pred) = -sum target_i log pred_i
  let s = 0;
  for (let i = 0; i < target.length; i++) {
    if (target[i] > 1e-12) s -= target[i] * Math.log(Math.max(pred[i], 1e-12));
  }
  return s;
}

export default function LabelSmoothingViz() {
  const [epsilon, setEpsilon] = useState(0.1);
  const [K, setK] = useState(5);

  const { z: logits, trueClass } = useMemo(() => buildLogits(K), [K]);
  const predProbs = useMemo(() => softmax(logits), [logits]);

  const hardTarget = useMemo(() => {
    const t = Array(K).fill(0);
    t[trueClass] = 1;
    return t;
  }, [K, trueClass]);

  const smoothedTarget = useMemo(() => {
    const t = Array(K).fill(epsilon / K);
    t[trueClass] = 1 - epsilon + epsilon / K;
    return t;
  }, [epsilon, K, trueClass]);

  const klHard = klDivergence(hardTarget, predProbs);
  const klSmooth = klDivergence(smoothedTarget, predProbs);
  const ceHard = crossEntropy(hardTarget, predProbs);
  const ceSmooth = crossEntropy(smoothedTarget, predProbs);

  // ---- Layout for both bar charts ----
  const lx0 = LEFT_PAD;
  const ly0 = TOP_PAD;
  const lw = PANEL_W;
  const lh = H - TOP_PAD - BOT_PAD;

  const rx0 = LEFT_PAD + PANEL_W + LEFT_PAD;
  const ry0 = TOP_PAD;
  const rw = PANEL_W;
  const rh = H - TOP_PAD - BOT_PAD;

  const barW = (lw - 16) / K;

  function renderBars(x0, y0, w, h, target, label) {
    const innerLeft = x0 + 8;
    const max = 1;
    return (
      <g>
        {/* baseline */}
        <line
          x1={x0}
          y1={y0 + h}
          x2={x0 + w}
          y2={y0 + h}
          stroke="var(--border)"
          strokeWidth="0.8"
        />
        {/* gridlines for 0.25, 0.5, 0.75, 1.0 */}
        {[0.25, 0.5, 0.75, 1.0].map((g) => (
          <g key={`g-${label}-${g}`}>
            <line
              x1={x0}
              y1={y0 + h - (g / max) * h}
              x2={x0 + w}
              y2={y0 + h - (g / max) * h}
              stroke="var(--border)"
              strokeWidth="0.4"
              strokeDasharray="2 3"
              opacity="0.5"
            />
            <text
              x={x0 - 6}
              y={y0 + h - (g / max) * h + 3}
              fontSize="7"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
              textAnchor="end"
            >
              {snap(g, 2)}
            </text>
          </g>
        ))}

        {target.map((p, i) => {
          const bx = innerLeft + i * barW + barW * 0.18;
          const bh = Math.max(2, (p / max) * h);
          const by = y0 + h - bh;
          const isTrue = i === trueClass;
          const labelFontSize = K > 7 ? 6 : 8;
          return (
            <g key={`bar-${label}-${i}`}>
              <rect
                x={bx}
                y={by}
                width={barW * 0.64}
                height={bh}
                fill={isTrue ? 'var(--accent)' : 'var(--hue-violet)'}
                opacity={isTrue ? 0.85 : 0.55}
                rx="2"
              />
              <text
                x={bx + (barW * 0.64) / 2}
                y={by - 4}
                fontSize={labelFontSize}
                fill={isTrue ? 'var(--accent)' : 'var(--text-main)'}
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight="700"
              >
                {snap(p, K > 7 ? 2 : 3)}
              </text>
              <text
                x={bx + (barW * 0.64) / 2}
                y={y0 + h + 12}
                fontSize={labelFontSize}
                fill="var(--text-dim)"
                fontFamily="var(--mono)"
                textAnchor="middle"
              >
                c{i}
              </text>
              {isTrue && (
                <text
                  x={bx + (barW * 0.64) / 2}
                  y={y0 + h + 22}
                  fontSize="6.5"
                  fill="var(--accent)"
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.06em"
                >
                  true
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }

  return (
    <div className="mlviz-wrap">
      <div className="mlviz-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mlviz-svg mlviz-svg-wide" style={{ maxWidth: '620px' }}>
          {/* Left header */}
          <text
            x={lx0}
            y={ly0 - 18}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            HARD TARGET · one-hot (ε = 0) · K = {K}
          </text>
          {renderBars(lx0, ly0, lw, lh, hardTarget, 'hard')}

          {/* Right header */}
          <text
            x={rx0}
            y={ry0 - 18}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            letterSpacing="0.12em"
          >
            SMOOTHED · ε = {snap(epsilon, 2)} · K = {K}
          </text>
          {renderBars(rx0, ry0, rw, rh, smoothedTarget, 'smooth')}

          {/* Footer dotted divider */}
          <line
            x1={LEFT_PAD}
            y1={H - 14}
            x2={W - LEFT_PAD}
            y2={H - 14}
            stroke="var(--border)"
            strokeWidth="0.5"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      <div className="mlviz-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">ε</span>
          <input
            type="range"
            min="0"
            max="0.3"
            step="0.01"
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
          />
          <span className="mlviz-slider-val">{snap(epsilon, 2)}</span>
        </label>

        <label className="mlviz-slider">
          <span className="mlviz-slider-label">K</span>
          <input
            type="range"
            min="3"
            max="10"
            step="1"
            value={K}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
          />
          <span className="mlviz-slider-val">{K}</span>
        </label>

        <div
          className="mlviz-row mlviz-row-hi"
          style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' }}
        >
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">p̂</span>
            <span className="mlviz-val">
              softmax(z) = [{predProbs.map((p) => snap(p, 2)).join(', ')}]
            </span>
            <span className="mlviz-sub">model prediction (fixed logits)</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">y′</span>
            <span className="mlviz-val">
              y′ = (1−ε)·1_y + ε/K = [{smoothedTarget.map((p) => snap(p, 3)).join(', ')}]
            </span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">CE</span>
            <span className="mlviz-val">
              hard {snap(ceHard, 3)} · smooth {snap(ceSmooth, 3)}
            </span>
            <span className="mlviz-sub">cross-entropy: smaller gap, less aggressive gradient</span>
          </div>
          <div className="mlviz-row" style={{ gap: '0.6rem' }}>
            <span className="mlviz-tag">KL</span>
            <span className="mlviz-val">
              hard {snap(klHard, 3)} · smooth {snap(klSmooth, 3)}
            </span>
            <span className="mlviz-sub">KL(target ‖ pred): smoothing trims the infinite-confidence push</span>
          </div>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button
            type="button"
            className="mlviz-btn"
            onClick={() => { setEpsilon(0.1); setK(5); }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          one-hot CE pushes logits toward ∞ · smoothing caps the target so the model stays calibrated
        </div>
      </div>
    </div>
  );
}
