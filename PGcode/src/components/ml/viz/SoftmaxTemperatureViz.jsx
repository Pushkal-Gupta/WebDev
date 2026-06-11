import React, { useMemo, useState, useCallback } from 'react';
import { Thermometer, Dice5, Crown, RotateCcw } from 'lucide-react';
import './MLViz.css';

const LOGITS = [4.2, 3.1, 2.0, 1.4, 0.7, 0.1, -0.5, -1.2];
const LABELS = ['cat', 'dog', 'fox', 'owl', 'bat', 'ant', 'eel', 'jay'];
const N = LOGITS.length;
const SEED = 9001;

function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softmax(logits, T) {
  const t = Math.max(0.0001, T);
  const scaled = logits.map((z) => z / t);
  const m = Math.max(...scaled);
  const ex = scaled.map((z) => Math.exp(z - m));
  const s = ex.reduce((a, b) => a + b, 0) || 1;
  return ex.map((e) => e / s);
}

function entropy(p) {
  let h = 0;
  for (const v of p) {
    if (v > 1e-12) h -= v * Math.log(v);
  }
  return h;
}

function sample(probs, rand) {
  let r = rand;
  for (let i = 0; i < probs.length; i++) {
    r -= probs[i];
    if (r <= 0) return i;
  }
  return probs.length - 1;
}

const N_SAMPLES = 200;

export default function SoftmaxTemperatureViz() {
  const [T, setT] = useState(1.0);
  const [seedTick, setSeedTick] = useState(0);

  const rng = useMemo(() => mulberry32(SEED + seedTick), [seedTick]);
  const probs = useMemo(() => softmax(LOGITS, T), [T]);
  const argmaxIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < N; i++) if (LOGITS[i] > LOGITS[best]) best = i;
    return best;
  }, []);

  const sampleHist = useMemo(() => {
    const counts = new Array(N).fill(0);
    for (let s = 0; s < N_SAMPLES; s++) counts[sample(probs, rng())]++;
    return counts.map((c) => c / N_SAMPLES);
  }, [probs, rng]);

  const sampledIdx = useMemo(() => {
    let best = 0;
    for (let i = 1; i < N; i++) if (sampleHist[i] > sampleHist[best]) best = i;
    return best;
  }, [sampleHist]);

  const H_p = entropy(probs);
  const perp = Math.exp(H_p);
  const top1 = probs[argmaxIdx];

  const handleReroll = useCallback(() => setSeedTick((s) => s + 1), []);

  const W = 720;
  const H = 360;
  const padX = 28;
  const topPad = 30;
  const bottomPad = 40;
  const panelGap = 22;
  const panelW = (W - padX * 2 - panelGap) / 2;
  const panelH = H - topPad - bottomPad;
  const barGap = 6;
  const barW = (panelW - barGap * (N + 1) - 12) / N;
  const probAreaH = panelH - 56;

  const leftX = padX;
  const rightX = padX + panelW + panelGap;

  function renderPanel(originX, title, sub, values, headerColor, fillColor, highlightIdx, highlightLabel) {
    const baselineY = topPad + panelH - 28;
    return (
      <g>
        <text
          x={originX}
          y={topPad - 12}
          fontSize="10"
          fill="var(--text-dim)"
          fontFamily="var(--mono)"
          letterSpacing="0.14em"
        >
          {title}
        </text>
        <text
          x={originX + panelW}
          y={topPad - 12}
          fontSize="9.5"
          fill={headerColor}
          fontFamily="var(--mono)"
          textAnchor="end"
          fontWeight="700"
        >
          {sub}
        </text>
        <rect
          x={originX}
          y={topPad - 4}
          width={panelW}
          height={panelH}
          fill="var(--bg)"
          stroke="var(--border)"
          strokeWidth="1"
          rx="8"
          opacity="0.6"
        />
        <line
          x1={originX + 6}
          y1={baselineY}
          x2={originX + panelW - 6}
          y2={baselineY}
          stroke="var(--border)"
          strokeWidth="1"
        />
        {values.map((p, i) => {
          const h = Math.max(1, p * probAreaH);
          const x = originX + 6 + barGap + i * (barW + barGap);
          const y = baselineY - h;
          const isHi = i === highlightIdx;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={fillColor}
                fillOpacity={isHi ? 0.95 : 0.55}
                stroke={isHi ? headerColor : 'transparent'}
                strokeWidth={isHi ? 1.5 : 0}
                rx="2"
              />
              <text
                x={x + barW / 2}
                y={y - 4}
                fontSize="8.5"
                fill={isHi ? headerColor : 'var(--text-dim)'}
                fontFamily="var(--mono)"
                textAnchor="middle"
                fontWeight={isHi ? 700 : 500}
              >
                {p.toFixed(2)}
              </text>
              <text
                x={x + barW / 2}
                y={baselineY + 13}
                fontSize="8.5"
                fill="var(--text-dim)"
                fontFamily="var(--serif)"
                fontStyle="italic"
                textAnchor="middle"
              >
                {LABELS[i]}
              </text>
              {isHi && highlightLabel && (
                <text
                  x={x + barW / 2}
                  y={baselineY + 25}
                  fontSize="8"
                  fill={headerColor}
                  fontFamily="var(--mono)"
                  textAnchor="middle"
                  letterSpacing="0.1em"
                  fontWeight="700"
                >
                  {highlightLabel}
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
      <div className="mlviz-stage" style={{ padding: '0.6rem 0.4rem 0.4rem' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mlviz-svg"
          style={{ maxWidth: '100%', width: '100%', aspectRatio: `${W} / ${H}`, height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {renderPanel(
            leftX,
            `softmax(z / T)`,
            `T = ${T.toFixed(2)}`,
            probs,
            'var(--accent)',
            'var(--accent)',
            argmaxIdx,
            'argmax'
          )}
          {renderPanel(
            rightX,
            `${N_SAMPLES} samples · empirical p̂`,
            `seed #${seedTick}`,
            sampleHist,
            'var(--hue-pink)',
            'var(--hue-pink)',
            sampledIdx,
            'sampled'
          )}

          {/* central arrow showing greedy vs sample */}
          <text
            x={leftX + panelW + panelGap / 2}
            y={topPad + panelH / 2 - 10}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.12em"
          >
            greedy
          </text>
          <text
            x={leftX + panelW + panelGap / 2}
            y={topPad + panelH / 2 + 4}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
          >
            ↔
          </text>
          <text
            x={leftX + panelW + panelGap / 2}
            y={topPad + panelH / 2 + 18}
            fontSize="9"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.12em"
          >
            sample
          </text>

          <text
            x={W / 2}
            y={H - 14}
            fontSize="9.5"
            fill="var(--text-dim)"
            fontFamily="var(--mono)"
            textAnchor="middle"
            letterSpacing="0.1em"
          >
            T → 0 collapses to argmax · T → ∞ flattens toward uniform
          </text>
        </svg>
      </div>

      <div className="mlviz-readout">
        <div className="mlviz-row mlviz-controls">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">
              <Thermometer size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
              temperature T
            </span>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.05"
              value={T}
              onChange={(e) => setT(parseFloat(e.target.value))}
            />
            <span className="mlviz-slider-val">{T.toFixed(2)}</span>
          </label>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap', paddingTop: '0.3rem' }}>
          <span className="mlviz-tag">H(p)</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-violet)' }}>{H_p.toFixed(3)}</span>
          <span className="mlviz-tag">perplexity</span>
          <span className="mlviz-val" style={{ color: 'var(--hue-sky)' }}>{perp.toFixed(2)}</span>
          <span className="mlviz-tag">top-1 p</span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{top1.toFixed(3)}</span>
          <span className="mlviz-sub">max H = ln({N}) = {Math.log(N).toFixed(3)}</span>
        </div>

        <div className="mlviz-row" style={{ gap: '1.1rem', flexWrap: 'wrap' }}>
          <span className="mlviz-tag">
            <Crown size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            argmax
          </span>
          <span className="mlviz-val" style={{ color: 'var(--accent)' }}>{LABELS[argmaxIdx]}</span>
          <span className="mlviz-tag">
            <Dice5 size={11} style={{ verticalAlign: '-1px', marginRight: 4 }} />
            sampled mode
          </span>
          <span className="mlviz-val" style={{ color: 'var(--hue-pink)' }}>{LABELS[sampledIdx]}</span>
          <span className="mlviz-sub">
            {argmaxIdx === sampledIdx ? 'sampling agrees with greedy' : 'sampling diverged from greedy'}
          </span>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={handleReroll}>
            <RotateCcw size={13} />
            <span>Reroll samples</span>
          </button>
          <span className="mlviz-sub" style={{ marginLeft: 'auto' }}>
            logits = [{LOGITS.map((z) => z.toFixed(1)).join(', ')}]
          </span>
        </div>

        <div className="mlviz-hint">
          drag T from cold (sharp, deterministic) to hot (uniform, exploratory) · reroll to see sampling variance
        </div>
      </div>
    </div>
  );
}
