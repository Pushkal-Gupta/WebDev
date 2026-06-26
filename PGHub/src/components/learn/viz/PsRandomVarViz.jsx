import React, { useMemo, useState, useCallback } from 'react';
import katex from 'katex';
import { RotateCcw, Dice5, Sigma, Target, Filter } from 'lucide-react';
import './PsRandomVarViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const RV_DEFS = {
  sum: { label: 'Sum  d₁ + d₂', symbol: 'X = d_1 + d_2', f: (a, b) => a + b, hue: 'var(--hue-violet)' },
  max: { label: 'Max  max(d₁, d₂)', symbol: 'X = \\max(d_1, d_2)', f: (a, b) => Math.max(a, b), hue: 'var(--hue-sky)' },
  diff: { label: 'Abs diff  |d₁ − d₂|', symbol: 'X = |d_1 - d_2|', f: (a, b) => Math.abs(a - b), hue: 'var(--hue-pink)' },
};

const DEFAULT_RV = 'sum';
const DEFAULT_MODE = 'ge';

// All 36 equally-likely outcomes of two fair dice.
const OUTCOMES = (() => {
  const out = [];
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) out.push({ d1, d2 });
  }
  return out;
})();

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}
function reduceFrac(n, d) {
  if (n === 0) return '0';
  const g = gcd(n, d);
  return `\\tfrac{${n / g}}{${d / g}}`;
}

export default function PsRandomVarViz() {
  const [rvKey, setRvKey] = useState(DEFAULT_RV);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [hoverVal, setHoverVal] = useState(null);

  const rv = RV_DEFS[rvKey];

  // Per-outcome value of the chosen random variable, plus the distribution.
  const model = useMemo(() => {
    const cells = OUTCOMES.map((o) => ({ ...o, val: rv.f(o.d1, o.d2) }));
    const counts = new Map();
    let minV = Infinity;
    let maxV = -Infinity;
    for (const c of cells) {
      counts.set(c.val, (counts.get(c.val) || 0) + 1);
      if (c.val < minV) minV = c.val;
      if (c.val > maxV) maxV = c.val;
    }
    const values = [...counts.keys()].sort((a, b) => a - b);
    const maxCount = Math.max(...counts.values());
    const expectation = cells.reduce((s, c) => s + c.val, 0) / 36;
    return { cells, counts, values, minV, maxV, maxCount, expectation };
  }, [rv]);

  const [k, setK] = useState(null);
  const effectiveK = k == null ? Math.round((model.minV + model.maxV) / 2) : Math.min(Math.max(k, model.minV), model.maxV);

  const inEvent = useCallback((v) => (mode === 'ge' ? v >= effectiveK : v === effectiveK), [mode, effectiveK]);

  const favorable = useMemo(() => model.cells.filter((c) => inEvent(c.val)).length, [model, inEvent]);
  const pEvent = favorable / 36;

  const reset = () => { setRvKey(DEFAULT_RV); setMode(DEFAULT_MODE); setK(null); setHoverVal(null); };

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Color a value across the random variable's range as a gradient of its hue.
  const cellFill = (v) => {
    const span = model.maxV - model.minV || 1;
    const t = (v - model.minV) / span;
    const pct = 16 + Math.round(t * 60);
    return `color-mix(in srgb, ${rv.hue} ${pct}%, transparent)`;
  };

  // ---- grid geometry ----
  const GW = 360;
  const GH = 360;
  const gPad = 30;
  const cellW = (GW - gPad) / 6;
  const cellH = (GH - gPad) / 6;
  const gx = (i) => gPad + i * cellW;
  const gy = (j) => gPad + j * cellH;

  // ---- bar chart geometry ----
  const BW = 360;
  const BH = 360;
  const bPadL = 34;
  const bPadB = 30;
  const bPadT = 14;
  const plotW = BW - bPadL - 8;
  const plotH = BH - bPadB - bPadT;
  const barGap = 6;
  const barW = (plotW / model.values.length) - barGap;
  const bx = (idx) => bPadL + idx * (barW + barGap);
  const barH = (count) => (count / model.maxCount) * plotH;

  const eventLabel = mode === 'ge'
    ? km(`P(X \\ge ${effectiveK})`)
    : km(`P(X = ${effectiveK})`);

  return (
    <div className="psrv">
      <div className="psrv-head">
        <div className="psrv-head-icon"><Dice5 size={18} /></div>
        <div className="psrv-head-text">
          <h3 className="psrv-title">From sample space to random variable to PMF</h3>
          <p className="psrv-sub">
            Roll two fair dice: the grid holds all{' '}
            <span dangerouslySetInnerHTML={{ __html: km('36') }} /> equally-likely outcomes. A random variable maps each outcome to a number; the bars are its distribution{' '}
            <span dangerouslySetInnerHTML={{ __html: km('P(X = v) = \\tfrac{\\text{count}}{36}') }} />.
          </p>
        </div>
        <button type="button" className="psrv-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="psrv-chips">
        {Object.keys(RV_DEFS).map((key) => (
          <button
            key={key}
            type="button"
            className={`psrv-chip${key === rvKey ? ' psrv-chip-on' : ''}`}
            onClick={() => { setRvKey(key); setK(null); setHoverVal(null); }}
          >
            {RV_DEFS[key].label}
          </button>
        ))}
      </div>

      <div className="psrv-event">
        <span className="psrv-event-label"><Filter size={12} /> event</span>
        <div className="psrv-event-modes">
          <button type="button" className={`psrv-modebtn${mode === 'ge' ? ' psrv-modebtn-on' : ''}`} onClick={() => setMode('ge')}>
            <span dangerouslySetInnerHTML={{ __html: km('X \\ge k') }} />
          </button>
          <button type="button" className={`psrv-modebtn${mode === 'eq' ? ' psrv-modebtn-on' : ''}`} onClick={() => setMode('eq')}>
            <span dangerouslySetInnerHTML={{ __html: km('X = k') }} />
          </button>
        </div>
        <label className="psrv-slider">
          <span className="psrv-slider-key" dangerouslySetInnerHTML={{ __html: km(`k = ${effectiveK}`) }} />
          <input
            type="range"
            min={model.minV}
            max={model.maxV}
            step="1"
            value={effectiveK}
            onChange={(e) => setK(parseInt(e.target.value, 10))}
          />
        </label>
      </div>

      <div className="psrv-stage">
        <div className="psrv-panel">
          <div className="psrv-panel-title"><Target size={12} /> 36 outcomes</div>
          <svg viewBox={`0 0 ${GW} ${GH}`} className="psrv-svg" preserveAspectRatio="xMidYMid meet">
            <text x={gPad + (GW - gPad) / 2} y={12} className="psrv-axis-title" textAnchor="middle">die 1</text>
            <text x={9} y={gPad + (GH - gPad) / 2} className="psrv-axis-title" textAnchor="middle"
              transform={`rotate(-90 9 ${gPad + (GH - gPad) / 2})`}>die 2</text>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <text key={`cx${i}`} x={gx(i) + cellW / 2} y={gPad - 6} className="psrv-tick" textAnchor="middle">{i + 1}</text>
            ))}
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <text key={`cy${j}`} x={gPad - 8} y={gy(j) + cellH / 2 + 3} className="psrv-tick" textAnchor="middle">{j + 1}</text>
            ))}
            {model.cells.map((c) => {
              const i = c.d1 - 1;
              const j = c.d2 - 1;
              const on = inEvent(c.val);
              const dim = hoverVal != null && c.val !== hoverVal;
              return (
                <g key={`c${c.d1}-${c.d2}`} className={reduced ? 'psrv-cell' : 'psrv-cell psrv-cell-anim'} opacity={dim ? 0.25 : 1}>
                  <rect
                    x={gx(i) + 1.5} y={gy(j) + 1.5}
                    width={cellW - 3} height={cellH - 3} rx={5}
                    fill={cellFill(c.val)}
                    className={on ? 'psrv-cellrect psrv-cellrect-on' : 'psrv-cellrect'}
                  />
                  <text x={gx(i) + cellW / 2} y={gy(j) + cellH / 2 + 4} className="psrv-cellval" textAnchor="middle">{c.val}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="psrv-panel">
          <div className="psrv-panel-title"><Sigma size={12} /> PMF of X</div>
          <svg viewBox={`0 0 ${BW} ${BH}`} className="psrv-svg" preserveAspectRatio="xMidYMid meet">
            <line x1={bPadL} y1={bPadT} x2={bPadL} y2={bPadT + plotH} className="psrv-baxis" />
            <line x1={bPadL} y1={bPadT + plotH} x2={bPadL + plotW} y2={bPadT + plotH} className="psrv-baxis" />
            {model.values.map((v, idx) => {
              const count = model.counts.get(v);
              const h = barH(count);
              const x = bx(idx);
              const y = bPadT + plotH - h;
              const on = inEvent(v);
              const hov = hoverVal === v;
              return (
                <g
                  key={`b${v}`}
                  onMouseEnter={() => setHoverVal(v)}
                  onMouseLeave={() => setHoverVal(null)}
                  className="psrv-bargroup"
                >
                  <rect
                    x={x} y={y} width={barW} height={Math.max(h, 1)} rx={4}
                    fill={cellFill(v)}
                    className={`psrv-bar${on ? ' psrv-bar-on' : ''}${reduced ? '' : ' psrv-bar-anim'}`}
                  />
                  <text x={x + barW / 2} y={bPadT + plotH + 13} className="psrv-blabel" textAnchor="middle">{v}</text>
                  <text x={x + barW / 2} y={y - 4} className={`psrv-bfrac${hov ? ' psrv-bfrac-on' : ''}`} textAnchor="middle"
                    dangerouslySetInnerHTML={{ __html: km(reduceFrac(count, 36)) }} />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="psrv-stats">
        <div className="psrv-statcard psrv-accent">
          <span className="psrv-stat-label">random variable</span>
          <span className="psrv-stat-val" dangerouslySetInnerHTML={{ __html: km(rv.symbol) }} />
          <span className="psrv-stat-sub" dangerouslySetInnerHTML={{ __html: km(`E[X] = ${model.expectation.toFixed(3)}`) }} />
        </div>
        <div className="psrv-statcard">
          <span className="psrv-stat-label">favorable outcomes</span>
          <span className="psrv-stat-val">{favorable} <span className="psrv-stat-of">/ 36</span></span>
        </div>
        <div className="psrv-statcard psrv-hue">
          <span className="psrv-stat-label">probability of event</span>
          <span className="psrv-stat-val" dangerouslySetInnerHTML={{ __html: `${eventLabel} = ${km(reduceFrac(favorable, 36))}` }} />
          <span className="psrv-stat-sub">{pEvent.toFixed(4)}</span>
        </div>
      </div>

      <div className="psrv-trace">
        <span className="psrv-trace-label"><Target size={12} /> reading</span>
        <span className="psrv-trace-body">
          Each cell is one equally-likely outcome of the two dice, colored by the value the random variable assigns it.
          The bars collapse those 36 outcomes into a distribution: a value reached by more cells stands taller, since its
          probability is just its outcome count over 36. The shaded cells and bars are the event{' '}
          {mode === 'ge' ? `X ≥ ${effectiveK}` : `X = ${effectiveK}`}; counting them gives {favorable} of 36, so the
          event lands at probability {pEvent.toFixed(3)}. Slide k or switch the random variable to watch the favorable
          region — and its probability — redraw.
        </span>
      </div>
    </div>
  );
}
