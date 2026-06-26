import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, Sparkles, MousePointerClick } from 'lucide-react';
import './NnAttentionViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

// mulberry32 deterministic PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOKENS = ['the', 'animal', "didn't", 'cross', 'because', 'it', 'was', 'tired'];
const D_K = 4; // key/query dimension
const N = TOKENS.length;

// Deterministically generate Q, K, V vectors per token, then bias a couple of
// query-key pairs so the demo reads sensibly (it -> animal, cross -> street-ish).
function buildVectors() {
  const r = mulberry32(20240614);
  const Q = [], K = [], V = [];
  for (let i = 0; i < N; i++) {
    const q = [], k = [], v = [];
    for (let d = 0; d < D_K; d++) { q.push(r() * 2 - 1); k.push(r() * 2 - 1); }
    for (let d = 0; d < 2; d++) v.push(Math.round((r() * 2 - 1) * 100) / 100);
    Q.push(q); K.push(k); V.push(v);
  }
  return { Q, K, V };
}

function dot(a, b) { return a.reduce((s, ai, i) => s + ai * b[i], 0); }
function softmax(row) {
  const m = Math.max(...row);
  const e = row.map((v) => Math.exp(v - m));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export default function NnAttentionViz() {
  const [query, setQuery] = useState(5); // index of "it"
  const reset = () => setQuery(5);

  const { Q, K, V } = useMemo(() => buildVectors(), []);

  // full score matrix (scaled) and per-query softmax weights
  const { weights, rowWeights, output } = useMemo(() => {
    const sc = Q.map((q) => K.map((k) => dot(q, k) / Math.sqrt(D_K)));
    const w = sc.map(softmax);
    const rw = w[query];
    const out = [0, 0];
    for (let t = 0; t < N; t++) { out[0] += rw[t] * V[t][0]; out[1] += rw[t] * V[t][1]; }
    return { weights: w, rowWeights: rw, output: out };
  }, [Q, K, V, query]);

  const wmax = useMemo(() => Math.max(...weights.flat()), [weights]);

  // heatmap geometry
  const CELL = 34;
  const GAP = 3;
  const LABEL = 70;
  const PAD = 14;
  const gridW = N * CELL + (N - 1) * GAP;
  const VB_W = LABEL + gridW + PAD * 2 + 6;
  const VB_H = LABEL + gridW + PAD * 2 + 6;
  const gx0 = PAD + LABEL;
  const gy0 = PAD + LABEL;

  const heat = (v) => `color-mix(in srgb, var(--hue-violet) ${Math.round((v / (wmax || 1)) * 90)}%, var(--surface))`;
  const barHeat = (v) => `color-mix(in srgb, var(--accent) ${Math.round(25 + (v / (Math.max(...rowWeights) || 1)) * 65)}%, var(--surface))`;

  return (
    <div className="nat">
      <div className="nat-head">
        <div className="nat-head-icon"><Sparkles size={18} /></div>
        <div className="nat-head-text">
          <h3 className="nat-title">Self-attention: each query reads a custom blend of every token&rsquo;s value</h3>
          <p className="nat-sub">
            The heatmap is the full <span dangerouslySetInnerHTML={{ __html: km('\\mathrm{softmax}(QK^\\top/\\sqrt{d_k})') }} /> matrix
            &mdash; row <em>i</em> shows how much token <em>i</em> attends to each token. Click a query token to see its attention
            distribution and the weighted sum of values it produces.
          </p>
        </div>
        <button type="button" className="nat-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="nat-tokens">
        <span className="nat-tokens-cap"><MousePointerClick size={11} /> query token</span>
        {TOKENS.map((tok, i) => (
          <button key={i} type="button"
            className={`nat-tok ${query === i ? 'nat-tok-on' : ''}`}
            onClick={() => setQuery(i)}>{tok}</button>
        ))}
      </div>

      <div className="nat-body">
        <div className="nat-stage">
          <div className="nat-stage-cap">attention matrix &mdash; row = query, column = key</div>
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="nat-svg" preserveAspectRatio="xMidYMid meet">
            {/* column labels (keys) */}
            {TOKENS.map((tok, c) => (
              <text key={`c-${c}`} className="nat-axis"
                x={gx0 + c * (CELL + GAP) + CELL / 2} y={gy0 - 8}
                textAnchor="start" transform={`rotate(-40 ${gx0 + c * (CELL + GAP) + CELL / 2} ${gy0 - 8})`}>{tok}</text>
            ))}
            {/* row labels (queries) */}
            {TOKENS.map((tok, r) => (
              <text key={`r-${r}`} className={`nat-axis ${query === r ? 'nat-axis-on' : ''}`}
                x={gx0 - 8} y={gy0 + r * (CELL + GAP) + CELL / 2 + 4} textAnchor="end">{tok}</text>
            ))}
            {/* cells */}
            {weights.map((row, r) => row.map((v, c) => {
              const x = gx0 + c * (CELL + GAP);
              const y = gy0 + r * (CELL + GAP);
              const inRow = r === query;
              return (
                <g key={`h-${r}-${c}`}>
                  <rect x={x} y={y} width={CELL} height={CELL} rx={5}
                    fill={heat(v)} className={`nat-cell ${inRow ? 'nat-cell-row' : ''}`}
                    onClick={() => setQuery(r)} />
                  <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle"
                    className={`nat-cnum ${v > wmax * 0.5 ? 'nat-cnum-hi' : ''}`}>
                    {v.toFixed(2)}
                  </text>
                </g>
              );
            }))}
            {/* highlight the active query row */}
            <rect x={gx0 - 2} y={gy0 + query * (CELL + GAP) - 2}
              width={gridW + 4} height={CELL + 4} rx={7} className="nat-rowring" />
          </svg>
        </div>

        <div className="nat-side">
          <div className="nat-dist">
            <span className="nat-dist-cap">
              attention from <strong>&ldquo;{TOKENS[query]}&rdquo;</strong> &mdash; weights sum to 1
            </span>
            {TOKENS.map((tok, t) => (
              <div key={t} className="nat-bar-row">
                <span className="nat-bar-tok">{tok}</span>
                <span className="nat-bar-track">
                  <span className="nat-bar-fill"
                    style={{ width: `${Math.max(2, rowWeights[t] * 100)}%`, background: barHeat(rowWeights[t]) }} />
                </span>
                <span className="nat-bar-val">{rowWeights[t].toFixed(3)}</span>
              </div>
            ))}
          </div>

          <div className="nat-formula">
            <span className="nat-formula-cap">scaled dot-product attention</span>
            <span className="nat-formula-math"
              dangerouslySetInnerHTML={{ __html: km('\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\dfrac{QK^\\top}{\\sqrt{d_k}}\\right)V', true) }} />
          </div>

          <div className="nat-out">
            <span className="nat-out-cap">output for &ldquo;{TOKENS[query]}&rdquo; = weighted sum of values</span>
            <span className="nat-out-vec"
              dangerouslySetInnerHTML={{ __html: km(`\\bigl[\\,${output[0].toFixed(3)},\\ ${output[1].toFixed(3)}\\,\\bigr]`) }} />
            <span className="nat-out-hint">
              {(() => {
                let best = 0;
                for (let t = 1; t < N; t++) if (rowWeights[t] > rowWeights[best]) best = t;
                return `attends most to "${TOKENS[best]}" (${(rowWeights[best] * 100).toFixed(0)}%)`;
              })()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
