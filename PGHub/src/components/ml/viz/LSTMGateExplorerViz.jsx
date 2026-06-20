import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Cpu, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 320;

// gate columns laid out left -> right inside the cell diagram
const COL_X = { f: 118, i: 230, g: 342, o: 454 };
const BAR_TOP = 78;
const BAR_H = 150;
const BAR_W = 30;

const DEF = {
  x: 0.5,
  hPrev: 0.2,
  cPrev: 0.8,
  fz: 0.85,
  iz: -0.85,
  gz: 0.0,
  oz: 0.4,
};

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}
function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}

const GATES = [
  { key: 'f', label: 'forget', color: 'var(--hue-pink)', squash: 'σ' },
  { key: 'i', label: 'input', color: 'var(--hue-sky)', squash: 'σ' },
  { key: 'g', label: 'candidate', color: 'var(--hue-violet)', squash: 'tanh' },
  { key: 'o', label: 'output', color: 'var(--hue-mint)', squash: 'σ' },
];

export default function LSTMGateExplorerViz() {
  const [st, setSt] = useState(DEF);
  const svgRef = useRef(null);

  const set = useCallback((k, v) => setSt((s) => ({ ...s, [k]: v })), []);
  const reset = useCallback(() => setSt(DEF), []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'height 0.12s ease, y 0.12s ease';

  // gate activations: pre-activations also mixed lightly with the inputs so the
  // sliders for x / h / c shift the gates too (keeps everything interactive).
  const mix = useMemo(() => {
    const lin = 0.6 * st.hPrev + 0.6 * st.x;
    return {
      f: sigmoid(st.fz + lin),
      i: sigmoid(st.iz + lin),
      g: Math.tanh(st.gz + lin),
      o: sigmoid(st.oz + lin),
    };
  }, [st]);

  const ct = mix.f * st.cPrev + mix.i * mix.g;
  const ht = mix.o * Math.tanh(ct);

  const gateVal = { f: mix.f, i: mix.i, g: mix.g, o: mix.o };

  // bar height: gates in [0,1] except candidate g in [-1,1]; normalize to [0,1] for drawing height
  const barFrac = (key) => {
    const v = gateVal[key];
    return key === 'g' ? Math.abs(v) : v;
  };

  return (
    <div className="mlviz-wrap aev-wrap lstmx-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Cpu size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">LSTM cell explorer</span>
          <span className="aev-head-sub">
            slide the gate pre-activations — watch the cell state c_t and hidden h_t update
          </span>
        </span>
        <span className="aev-chip">c_t = {fmt(ct, 2)}</span>
      </div>

      <div className="aev-body lstmx-body">
        <div className="mlviz-stage aev-stage">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg lstmx-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="lstmx-cell-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--hue-mint)" />
              </linearGradient>
              <filter id="lstmx-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.2" />
              </filter>
            </defs>

            {/* cell-state highway across the top */}
            <line
              x1="24"
              y1="44"
              x2={W - 24}
              y2="44"
              stroke="url(#lstmx-cell-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              filter="url(#lstmx-glow)"
              opacity="0.5"
            />
            <line
              x1="24"
              y1="44"
              x2={W - 24}
              y2="44"
              stroke="url(#lstmx-cell-grad)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <text
              x="26"
              y="36"
              fontSize="9"
              fill="var(--text-dim)"
              fontFamily="var(--mono)"
            >
              c(t-1) = {fmt(st.cPrev, 2)}
            </text>
            <text
              x={W - 26}
              y="36"
              fontSize="9.5"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              textAnchor="end"
              fontWeight="700"
            >
              c(t) = {fmt(ct, 2)}
            </text>

            {/* gate bars */}
            {GATES.map((g) => {
              const frac = barFrac(g.key);
              const h = Math.max(2, frac * BAR_H);
              const y = BAR_TOP + (BAR_H - h);
              const x = COL_X[g.key];
              return (
                <g key={g.key}>
                  {/* track */}
                  <rect
                    x={x}
                    y={BAR_TOP}
                    width={BAR_W}
                    height={BAR_H}
                    rx="5"
                    fill="var(--viz-card)"
                    stroke="var(--viz-line)"
                    strokeWidth="0.8"
                  />
                  {/* fill */}
                  <rect
                    x={x}
                    y={y}
                    width={BAR_W}
                    height={h}
                    rx="5"
                    fill={g.color}
                    opacity={g.key === 'g' && gateVal.g < 0 ? 0.45 : 0.85}
                    style={{ transition: trans }}
                  />
                  <text
                    x={x + BAR_W / 2}
                    y={BAR_TOP - 8}
                    fontSize="9"
                    fill={g.color}
                    fontFamily="var(--mono)"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {g.key}
                  </text>
                  <text
                    x={x + BAR_W / 2}
                    y={BAR_TOP + BAR_H + 14}
                    fontSize="7.6"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {g.label}
                  </text>
                  <text
                    x={x + BAR_W / 2}
                    y={BAR_TOP + BAR_H + 25}
                    fontSize="8.4"
                    fill="var(--text-main)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {fmt(gateVal[g.key], 2)}
                  </text>
                  <text
                    x={x + BAR_W / 2}
                    y={BAR_TOP + BAR_H + 36}
                    fontSize="7"
                    fill="var(--text-dim)"
                    fontFamily="var(--mono)"
                    textAnchor="middle"
                  >
                    {g.squash}
                  </text>
                </g>
              );
            })}

            {/* hidden state readout node */}
            <circle
              cx={W - 50}
              cy="280"
              r="22"
              fill="rgba(var(--accent-rgb), 0.14)"
            />
            <circle
              cx={W - 50}
              cy="280"
              r="14"
              fill="var(--accent)"
              opacity="0.9"
            />
            <text
              x={W - 50}
              y="284"
              fontSize="9"
              fill="var(--bg)"
              fontFamily="var(--mono)"
              fontWeight="700"
              textAnchor="middle"
            >
              h(t)
            </text>
            <text
              x={W - 50}
              y="310"
              fontSize="9"
              fill="var(--accent)"
              fontFamily="var(--mono)"
              fontWeight="700"
              textAnchor="middle"
            >
              {fmt(ht, 2)}
            </text>

            {/* input node */}
            <circle cx="34" cy="280" r="16" fill="var(--viz-card)" stroke="var(--hue-sky)" strokeWidth="1.4" />
            <text x="34" y="284" fontSize="9" fill="var(--hue-sky)" fontFamily="var(--mono)" fontWeight="700" textAnchor="middle">
              x(t)
            </text>
            <text x="34" y="306" fontSize="8.4" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              {fmt(st.x, 2)}
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards lstmx-cards">
          <div className="mlviz-statcard mlviz-statcard-pink">
            <span className="mlviz-statcard-label">forget gate</span>
            <span className="mlviz-statcard-val">{fmt(mix.f, 2)}</span>
            <span className="mlviz-statcard-sub">keeps {Math.round(mix.f * 100)}% of c(t-1)</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">input gate</span>
            <span className="mlviz-statcard-val">{fmt(mix.i, 2)}</span>
            <span className="mlviz-statcard-sub">writes {Math.round(mix.i * 100)}% of g</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-accent">
            <span className="mlviz-statcard-label">cell state c(t)</span>
            <span className="mlviz-statcard-val">{fmt(ct, 2)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">hidden h(t)</span>
            <span className="mlviz-statcard-val">{fmt(ht, 2)}</span>
          </div>
          <div className="aev-expr">c_t = f·c_(t-1) + i·g</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <div className="lstmx-sliders">
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">f pre</span>
            <input type="range" min={-5} max={5} step="0.05" value={st.fz} onChange={(e) => set('fz', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.fz, 1)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">i pre</span>
            <input type="range" min={-5} max={5} step="0.05" value={st.iz} onChange={(e) => set('iz', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.iz, 1)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">g pre</span>
            <input type="range" min={-5} max={5} step="0.05" value={st.gz} onChange={(e) => set('gz', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.gz, 1)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">o pre</span>
            <input type="range" min={-5} max={5} step="0.05" value={st.oz} onChange={(e) => set('oz', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.oz, 1)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">x(t)</span>
            <input type="range" min={-2} max={2} step="0.05" value={st.x} onChange={(e) => set('x', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.x, 2)}</span>
          </label>
          <label className="mlviz-slider">
            <span className="mlviz-slider-label">c(t-1)</span>
            <input type="range" min={-2} max={2} step="0.05" value={st.cPrev} onChange={(e) => set('cPrev', parseFloat(e.target.value))} />
            <span className="mlviz-slider-val">{fmt(st.cPrev, 2)}</span>
          </label>
        </div>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          forget gate near 1 = long memory · the additive c_t path is why LSTM gradients do not vanish
        </div>
      </div>
    </div>
  );
}
