import React, { useMemo, useState } from 'react';
import katex from 'katex';
import { RotateCcw, TestTube, BookOpen, Activity } from 'lucide-react';
import './PsBayesViz.css';

function km(expr, display = false) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: display });
}

const PRESETS = {
  rare: { prior: 0.01, sens: 0.99, spec: 0.95 },
  common: { prior: 0.1, sens: 0.95, spec: 0.92 },
  perfect: { prior: 0.02, sens: 1, spec: 1 },
  coinflip: { prior: 0.05, sens: 0.5, spec: 0.5 },
};

const GRID_COLS = 40;
const GRID_ROWS = 25; // 1000 people, row-major deterministic raster

export default function PsBayesViz() {
  const [p, setP] = useState(PRESETS.rare);

  const reset = () => setP(PRESETS.rare);
  const setKey = (key) => (e) => {
    const v = parseFloat(e.target.value);
    setP((prev) => ({ ...prev, [key]: v }));
  };

  const stats = useMemo(() => {
    const { prior, sens, spec } = p;
    const tp = prior * sens;
    const fn = prior * (1 - sens);
    const fp = (1 - prior) * (1 - spec);
    const tn = (1 - prior) * spec;
    const posTotal = tp + fp;
    const negTotal = fn + tn;
    const postPos = posTotal > 1e-12 ? tp / posTotal : 0;
    const postNeg = negTotal > 1e-12 ? fn / negTotal : 0;
    return { tp, fn, fp, tn, posTotal, negTotal, postPos, postNeg };
  }, [p]);

  // Area diagram: two columns. Disease column width = prior, healthy column = 1-prior.
  const W = 760;
  const H = 360;
  const pad = 28;
  const plotW = W - pad * 2;
  const plotH = H - pad * 2;

  const sickW = Math.max(0, p.prior) * plotW;
  const healthyW = Math.max(0, 1 - p.prior) * plotW;
  // Within sick column: TP on top (tests positive), FN below.
  const tpH = p.sens * plotH;
  const fnH = (1 - p.sens) * plotH;
  // Within healthy column: FP on top (tests positive), TN below.
  const fpH = (1 - p.spec) * plotH;
  const tnH = p.spec * plotH;

  const reduced = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pct = (n) => `${(n * 100).toFixed(n < 0.001 && n > 0 ? 3 : 2)}\\%`;

  // Deterministic icon grid: 1000 cells, row-major filled by category in fixed order.
  const cells = useMemo(() => {
    const total = GRID_COLS * GRID_ROWS;
    const counts = [
      { key: 'tp', n: Math.round(stats.tp * total) },
      { key: 'fp', n: Math.round(stats.fp * total) },
      { key: 'fn', n: Math.round(stats.fn * total) },
    ];
    let assigned = counts.reduce((s, c) => s + c.n, 0);
    if (assigned > total) {
      // trim from the largest non-tn bucket deterministically
      let over = assigned - total;
      for (let i = counts.length - 1; i >= 0 && over > 0; i--) {
        const take = Math.min(counts[i].n, over);
        counts[i].n -= take;
        over -= take;
      }
      assigned = total - over;
    }
    const out = new Array(total);
    let idx = 0;
    for (const c of counts) {
      for (let k = 0; k < c.n && idx < total; k++) { out[idx] = c.key; idx++; }
    }
    for (; idx < total; idx++) out[idx] = 'tn';
    return out;
  }, [stats.tp, stats.fp, stats.fn]);

  const sliders = [
    { key: 'prior', label: km('P(D)'), min: 0.001, max: 0.5, step: 0.001 },
    { key: 'sens', label: km('P(+\\mid D)'), min: 0.5, max: 1, step: 0.005 },
    { key: 'spec', label: km('P(-\\mid \\lnot D)'), min: 0.5, max: 1, step: 0.005 },
  ];

  const bayesTex = `P(D\\mid +)=\\dfrac{P(+\\mid D)\\,P(D)}{P(+\\mid D)\\,P(D)+P(+\\mid \\lnot D)\\,P(\\lnot D)}`;
  const bayesNums = `=\\dfrac{${p.sens.toFixed(3)}\\times ${p.prior.toFixed(3)}}{${p.sens.toFixed(3)}\\times ${p.prior.toFixed(3)}+${(1 - p.spec).toFixed(3)}\\times ${(1 - p.prior).toFixed(3)}}=${(stats.postPos * 100).toFixed(1)}\\%`;

  const cellCls = { tp: 'psb-c-tp', fp: 'psb-c-fp', fn: 'psb-c-fn', tn: 'psb-c-tn' };

  return (
    <div className="psb">
      <div className="psb-head">
        <div className="psb-head-icon"><TestTube size={18} /></div>
        <div className="psb-head-text">
          <h3 className="psb-title">Base rates &amp; Bayes&rsquo; rule: when a positive test isn&rsquo;t a diagnosis</h3>
          <p className="psb-sub">
            The square is the whole population. Width splits sick from healthy by the prior{' '}
            <span dangerouslySetInnerHTML={{ __html: km('P(D)') }} />; height splits each side by the test outcome.
            When the disease is rare, the orange false-positive slab can dwarf the true-positive one.
          </p>
        </div>
        <button type="button" className="psb-reset" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="psb-presets">
        <button type="button" className="psb-chip" onClick={() => setP(PRESETS.rare)}>Rare disease (1%)</button>
        <button type="button" className="psb-chip" onClick={() => setP(PRESETS.common)}>Common (10%)</button>
        <button type="button" className="psb-chip" onClick={() => setP(PRESETS.perfect)}>Perfect test</button>
        <button type="button" className="psb-chip" onClick={() => setP(PRESETS.coinflip)}>Coin-flip test</button>
      </div>

      <div className="psb-controls">
        {sliders.map((s) => (
          <label key={s.key} className="psb-slider">
            <span className="psb-slider-key" dangerouslySetInnerHTML={{ __html: s.label }} />
            <input type="range" min={s.min} max={s.max} step={s.step} value={p[s.key]} onChange={setKey(s.key)} />
            <span className="psb-slider-val">{(p[s.key] * 100).toFixed(s.key === 'prior' ? 1 : 1)}%</span>
          </label>
        ))}
      </div>

      <div className="psb-grids">
        <div className="psb-stage">
          <div className="psb-stage-cap">Population by area</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="psb-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <clipPath id="psb-plot-clip">
                <rect x={pad} y={pad} width={plotW} height={plotH} rx="6" />
              </clipPath>
            </defs>
            <g clipPath="url(#psb-plot-clip)">
              {/* Healthy column (right) drawn first so divider reads cleanly */}
              <rect className={reduced ? 'psb-area psb-area-fp' : 'psb-area psb-area-fp psb-anim'}
                x={pad + sickW} y={pad} width={healthyW} height={fpH} />
              <rect className={reduced ? 'psb-area psb-area-tn' : 'psb-area psb-area-tn psb-anim'}
                x={pad + sickW} y={pad + fpH} width={healthyW} height={tnH} />
              {/* Sick column (left) */}
              <rect className={reduced ? 'psb-area psb-area-tp' : 'psb-area psb-area-tp psb-anim'}
                x={pad} y={pad} width={sickW} height={tpH} />
              <rect className={reduced ? 'psb-area psb-area-fn' : 'psb-area psb-area-fn psb-anim'}
                x={pad} y={pad + tpH} width={sickW} height={fnH} />
            </g>
            <rect x={pad} y={pad} width={plotW} height={plotH} rx="6" className="psb-frame" />
            <line x1={pad + sickW} y1={pad} x2={pad + sickW} y2={pad + plotH} className="psb-divider" />
            {sickW > 46 && (
              <text x={pad + sickW / 2} y={pad + 14} className="psb-col-label" textAnchor="middle">sick</text>
            )}
            <text x={pad + sickW + healthyW / 2} y={pad + 14} className="psb-col-label" textAnchor="middle">healthy</text>
            {tpH > 16 && sickW > 30 && (
              <text x={pad + sickW / 2} y={pad + tpH / 2} className="psb-cell-label" textAnchor="middle">TP</text>
            )}
            {fpH > 16 && (
              <text x={pad + sickW + healthyW / 2} y={pad + fpH / 2} className="psb-cell-label" textAnchor="middle">FP</text>
            )}
          </svg>
        </div>

        <div className="psb-stage">
          <div className="psb-stage-cap">1000 people (each square = 1)</div>
          <svg viewBox={`0 0 ${GRID_COLS * 18} ${GRID_ROWS * 18}`} className="psb-svg" preserveAspectRatio="xMidYMid meet">
            {cells.map((kind, i) => {
              const col = i % GRID_COLS;
              const row = Math.floor(i / GRID_COLS);
              return (
                <rect key={i} x={col * 18 + 2} y={row * 18 + 2} width={14} height={14} rx="3"
                  className={`psb-icon ${cellCls[kind]}`} />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="psb-legend">
        <span className="psb-leg"><i className="psb-sw psb-c-tp" /> True positive (sick, +)</span>
        <span className="psb-leg"><i className="psb-sw psb-c-fp" /> False positive (healthy, +)</span>
        <span className="psb-leg"><i className="psb-sw psb-c-fn" /> False negative (sick, -)</span>
        <span className="psb-leg"><i className="psb-sw psb-c-tn" /> True negative (healthy, -)</span>
      </div>

      <div className="psb-stats">
        <div className="psb-statcard psb-hero">
          <span className="psb-stat-label">posterior — chance you&rsquo;re sick given a positive</span>
          <span className="psb-stat-val" dangerouslySetInnerHTML={{ __html: km(`P(D\\mid +)=${(stats.postPos * 100).toFixed(1)}\\%`) }} />
          <span className="psb-stat-sub" dangerouslySetInnerHTML={{ __html: km(`= \\dfrac{TP}{TP+FP}`) }} />
        </div>
        <div className="psb-statcard">
          <span className="psb-stat-label">missed cases given a negative</span>
          <span className="psb-stat-val" dangerouslySetInnerHTML={{ __html: km(`P(D\\mid -)=${(stats.postNeg * 100).toFixed(2)}\\%`) }} />
          <span className="psb-stat-sub" dangerouslySetInnerHTML={{ __html: km('= \\dfrac{FN}{FN+TN}') }} />
        </div>
        <div className="psb-statcard">
          <span className="psb-stat-label">cell shares of population</span>
          <span className="psb-stat-val psb-cells" dangerouslySetInnerHTML={{ __html: km(`TP=${pct(stats.tp)},\\ FP=${pct(stats.fp)}`) }} />
          <span className="psb-stat-sub" dangerouslySetInnerHTML={{ __html: km(`FN=${pct(stats.fn)},\\ TN=${pct(stats.tn)}`) }} />
        </div>
      </div>

      <div className="psb-formula">
        <span className="psb-formula-label"><Activity size={12} /> Bayes&rsquo; rule, numbers plugged in</span>
        <span className="psb-formula-math" dangerouslySetInnerHTML={{ __html: km(bayesTex, true) }} />
        <span className="psb-formula-math" dangerouslySetInnerHTML={{ __html: km(bayesNums, true) }} />
      </div>

      <div className="psb-trace">
        <span className="psb-trace-label"><BookOpen size={12} /> reading</span>
        <span className="psb-trace-body">
          {stats.postPos < 0.5
            ? `Even with a ${(p.sens * 100).toFixed(0)}%-sensitive test, a positive result leaves you only ${(stats.postPos * 100).toFixed(1)}% likely to be sick. Because just ${(p.prior * 100).toFixed(1)}% of people carry the disease, the few false positives among the huge healthy majority outnumber the true positives — that is the base-rate fallacy. Raise the prior or the specificity and watch the posterior climb.`
            : `Here a positive test means a ${(stats.postPos * 100).toFixed(1)}% chance of disease — the evidence now dominates the prior. With prior ${(p.prior * 100).toFixed(1)}% and specificity ${(p.spec * 100).toFixed(0)}%, false positives no longer swamp the true positives. Drop the prior toward zero to see the posterior collapse despite an unchanged, accurate test.`}
        </span>
      </div>
    </div>
  );
}
