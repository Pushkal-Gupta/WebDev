import React, { useCallback, useMemo, useState } from 'react';
import { Layers, RotateCcw } from 'lucide-react';
import './MLViz.css';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOKENS = ['The', 'cat', 'sat', 'on', 'mat'];
const N = TOKENS.length;
const D_MODEL = 12;
const MAX_HEADS = 4;

// Hue per head — colourful, theme-token only.
const HEAD_HUE = [
  'var(--hue-sky)',
  'var(--hue-violet)',
  'var(--hue-pink)',
  'var(--hue-mint)',
];

// Deterministic Q/K vectors per head: head h owns dims [h*dh, (h+1)*dh).
function buildScores(numHeads) {
  const dh = Math.floor(D_MODEL / numHeads);
  const rng = mulberry32(424242 + numHeads * 7919);
  // shared token embeddings, sliced per head
  const emb = Array.from({ length: N }, () =>
    Array.from({ length: D_MODEL }, () => rng() * 2 - 1)
  );
  const heads = [];
  for (let h = 0; h < numHeads; h++) {
    const lo = h * dh;
    const hi = lo + dh;
    // per-head Q,K projection bias so heads differ in pattern
    const qb = rng() * 1.4 - 0.7;
    const scale = Math.sqrt(dh);
    const scores = [];
    for (let i = 0; i < N; i++) {
      const raw = [];
      let mx = -Infinity;
      for (let j = 0; j < N; j++) {
        let dot = 0;
        for (let d = lo; d < hi; d++) dot += emb[i][d] * emb[j][d];
        dot = (dot + (h % 2 === 0 ? qb * (j - i) : -qb * Math.abs(j - i))) / scale;
        raw.push(dot);
        if (dot > mx) mx = dot;
      }
      let sum = 0;
      const ex = raw.map((v) => {
        const e = Math.exp(v - mx);
        sum += e;
        return e;
      });
      scores.push(ex.map((e) => e / sum));
    }
    heads.push({ scores, dh });
  }
  return heads;
}

const VB = 560;
const VBH = 300;

export default function MultiHeadAttentionExplorerViz({ heads = 4 }) {
  const [numHeads, setNumHeads] = useState(Math.min(MAX_HEADS, Math.max(1, heads)));
  const [sel, setSel] = useState(0);

  const headData = useMemo(() => buildScores(numHeads), [numHeads]);
  const dh = Math.floor(D_MODEL / numHeads);
  const safeSel = Math.min(sel, numHeads - 1);
  const selScores = headData[safeSel].scores;

  // top attention link in the selected head
  const top = useMemo(() => {
    let best = { v: -1, i: 0, j: 0 };
    selScores.forEach((row, i) =>
      row.forEach((v, j) => {
        if (v > best.v) best = { v, i, j };
      })
    );
    return best;
  }, [selScores]);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reset = useCallback(() => {
    setNumHeads(Math.min(MAX_HEADS, Math.max(1, heads)));
    setSel(0);
  }, [heads]);

  // layout for the main heatmap (selected head)
  const HM = 188;
  const HM_X = 96;
  const HM_Y = 60;
  const cell = HM / N;

  // mini-head strip layout
  const miniSize = 64;
  const miniGap = 14;
  const miniTotal = numHeads * miniSize + (numHeads - 1) * miniGap;
  const miniStartX = (VB - miniTotal) / 2;
  const miniY = VBH - miniSize - 18;

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Layers size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Multi-head attention explorer</span>
          <span className="aev-head-sub">
            {numHeads} heads attend in parallel — each sees its own slice of the embedding
          </span>
        </span>
        <span className="aev-chip" style={{ color: HEAD_HUE[safeSel], borderColor: HEAD_HUE[safeSel] }}>
          head {safeSel + 1}
        </span>
      </div>

      <div className="aev-toggles">
        {Array.from({ length: numHeads }, (_, h) => (
          <button
            key={h}
            type="button"
            className={`mlviz-toggle${h === safeSel ? ' is-on' : ''}`}
            style={{ '--toggle-color': HEAD_HUE[h] }}
            onClick={() => setSel(h)}
          >
            <span className="mlviz-toggle-dot" />
            head {h + 1}
          </button>
        ))}
      </div>

      <div className="aev-body mha-body">
        <div className="mlviz-stage aev-stage">
          <svg
            viewBox={`0 0 ${VB} ${VBH}`}
            className="aev-svg mha-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="mha-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
            </defs>

            <text x={HM_X} y={HM_Y - 26} fontSize="11" fill="var(--text-dim)" fontFamily="var(--mono)">
              head {safeSel + 1} · Q·K softmax weights (row = query)
            </text>

            {/* key labels (columns) */}
            {TOKENS.map((t, j) => (
              <text
                key={`k-${j}`}
                x={HM_X + j * cell + cell / 2}
                y={HM_Y - 8}
                fontSize="9.5"
                fill="var(--text-dim)"
                fontFamily="var(--serif)"
                fontStyle="italic"
                textAnchor="middle"
              >
                {t}
              </text>
            ))}

            {/* heatmap cells */}
            {selScores.map((row, i) =>
              row.map((v, j) => {
                const isTop = i === top.i && j === top.j;
                return (
                  <g key={`c-${i}-${j}`}>
                    <rect
                      x={HM_X + j * cell}
                      y={HM_Y + i * cell}
                      width={cell - 1.5}
                      height={cell - 1.5}
                      rx="3"
                      fill={`color-mix(in srgb, ${HEAD_HUE[safeSel]} ${Math.round(
                        10 + v * 88
                      )}%, var(--viz-card))`}
                      stroke={isTop ? 'var(--accent)' : 'var(--viz-line)'}
                      strokeWidth={isTop ? 2 : 0.5}
                      style={{ transition: reduced ? 'none' : 'fill 0.2s ease' }}
                    />
                    <text
                      x={HM_X + j * cell + cell / 2}
                      y={HM_Y + i * cell + cell / 2}
                      fontSize="8.5"
                      fill={v > 0.45 ? 'var(--bg)' : 'var(--text-dim)'}
                      fontFamily="var(--mono)"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {v.toFixed(2)}
                    </text>
                  </g>
                );
              })
            )}

            {/* query labels (rows) */}
            {TOKENS.map((t, i) => (
              <text
                key={`q-${i}`}
                x={HM_X - 8}
                y={HM_Y + i * cell + cell / 2}
                fontSize="9.5"
                fill="var(--text-main)"
                fontFamily="var(--serif)"
                fontStyle="italic"
                textAnchor="end"
                dominantBaseline="central"
              >
                {t}
              </text>
            ))}

            {/* concat -> output projection schematic */}
            <text
              x={HM_X + HM + 36}
              y={HM_Y + 4}
              fontSize="10"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              concat
            </text>
            {Array.from({ length: numHeads }, (_, h) => (
              <rect
                key={`cc-${h}`}
                x={HM_X + HM + 36}
                y={HM_Y + 14 + h * 16}
                width={64}
                height={11}
                rx="2"
                fill={`color-mix(in srgb, ${HEAD_HUE[h]} 55%, transparent)`}
                stroke={h === safeSel ? 'var(--accent)' : 'var(--viz-line)'}
                strokeWidth={h === safeSel ? 1.6 : 0.5}
              />
            ))}
            <line
              x1={HM_X + HM + 104}
              y1={HM_Y + 14 + (numHeads * 16) / 2}
              x2={HM_X + HM + 134}
              y2={HM_Y + 14 + (numHeads * 16) / 2}
              stroke="var(--accent)"
              strokeWidth="1.5"
              markerEnd=""
            />
            <rect
              x={HM_X + HM + 134}
              y={HM_Y + 8 + (numHeads * 16) / 2 - 8}
              width={20}
              height={28}
              rx="3"
              fill="color-mix(in srgb, var(--accent) 22%, transparent)"
              stroke="var(--accent)"
              strokeWidth="1.4"
              filter="url(#mha-glow)"
              opacity="0.9"
            />
            <text
              x={HM_X + HM + 144}
              y={HM_Y + 8 + (numHeads * 16) / 2 + 6}
              fontSize="9"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              Wᵒ
            </text>

            {/* mini head heatmaps */}
            {headData.map((hd, h) => {
              const ox = miniStartX + h * (miniSize + miniGap);
              const mc = miniSize / N;
              return (
                <g key={`mini-${h}`}>
                  <rect
                    x={ox - 3}
                    y={miniY - 14}
                    width={miniSize + 6}
                    height={miniSize + 18}
                    rx="5"
                    fill="none"
                    stroke={h === safeSel ? HEAD_HUE[h] : 'var(--viz-line)'}
                    strokeWidth={h === safeSel ? 1.6 : 0.6}
                    opacity={h === safeSel ? 1 : 0.6}
                  />
                  <text
                    x={ox + miniSize / 2}
                    y={miniY - 4}
                    fontSize="8"
                    fill={h === safeSel ? HEAD_HUE[h] : 'var(--text-dim)'}
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    h{h + 1}
                  </text>
                  {hd.scores.map((row, i) =>
                    row.map((v, j) => (
                      <rect
                        key={`m-${h}-${i}-${j}`}
                        x={ox + j * mc}
                        y={miniY + i * mc}
                        width={mc - 0.6}
                        height={mc - 0.6}
                        fill={`color-mix(in srgb, ${HEAD_HUE[h]} ${Math.round(
                          8 + v * 90
                        )}%, var(--viz-card))`}
                      />
                    ))
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mlviz-statcol mha-cards">
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">heads</span>
            <span className="mlviz-statcard-val">{numHeads}</span>
            <span className="mlviz-statcard-sub">parallel attention maps</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">dim / head</span>
            <span className="mlviz-statcard-val">{dh}</span>
            <span className="mlviz-statcard-sub">d_model {D_MODEL} / {numHeads}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-violet">
            <span className="mlviz-statcard-label">top attention</span>
            <span className="mlviz-statcard-val">{top.v.toFixed(2)}</span>
            <span className="mlviz-statcard-sub">
              {TOKENS[top.i]} → {TOKENS[top.j]}
            </span>
          </div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">heads</span>
          <input
            type="range"
            min={1}
            max={MAX_HEADS}
            step={1}
            value={numHeads}
            onChange={(e) => {
              const nh = parseInt(e.target.value, 10);
              setNumHeads(nh);
              if (sel >= nh) setSel(nh - 1);
            }}
          />
          <span className="mlviz-slider-val">{numHeads}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          more heads = thinner slices (d_model / h) · each head learns a different relation · concat then project through Wᵒ
        </div>
      </div>
    </div>
  );
}
