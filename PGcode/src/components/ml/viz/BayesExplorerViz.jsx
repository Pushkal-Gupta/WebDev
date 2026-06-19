import React, { useCallback, useMemo, useState } from 'react';
import { Stethoscope, RotateCcw } from 'lucide-react';
import './MLViz.css';

const W = 560;
const H = 320;
const PAD = 18;

// area-breakdown layout: a unit square split by prior, then each column
// split by likelihood into true/false positive bands.
const SQ = 240;
const SQ_X = PAD + 8;
const SQ_Y = 30;

function fmt(v, p = 3) {
  if (!Number.isFinite(v)) return '—';
  return v.toFixed(p);
}
function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

const DEF = { prior: 0.01, sens: 0.95, fpr: 0.08 };

export default function BayesExplorerViz() {
  const [prior, setPrior] = useState(DEF.prior); // P(H)
  const [sens, setSens] = useState(DEF.sens); // P(E|H)
  const [fpr, setFpr] = useState(DEF.fpr); // P(E|¬H)

  const { pE, post, lr } = useMemo(() => {
    const pH = prior;
    const pNotH = 1 - prior;
    const tp = sens * pH; // P(E,H)
    const fp = fpr * pNotH; // P(E,¬H)
    const evidence = tp + fp; // P(E)
    const posterior = evidence > 0 ? tp / evidence : 0;
    const likelihoodRatio = fpr > 0 ? sens / fpr : Infinity;
    return { pE: evidence, post: posterior, lr: likelihoodRatio };
  }, [prior, sens, fpr]);

  const reset = useCallback(() => {
    setPrior(DEF.prior);
    setSens(DEF.sens);
    setFpr(DEF.fpr);
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const trans = reducedMotion ? 'none' : 'all 0.12s ease';

  // square columns: left = H (width = prior), right = ¬H
  const colHw = SQ * prior;
  const colNw = SQ * (1 - prior);
  // within H column, top band = positive test (height = sens)
  const hPosH = SQ * sens;
  const hNegH = SQ * (1 - sens);
  // within ¬H column, top band = false positive (height = fpr)
  const nPosH = SQ * fpr;
  const nNegH = SQ * (1 - fpr);

  // posterior bar on the right
  const barX = SQ_X + SQ + 60;
  const barW = 150;
  const barTop = SQ_Y;
  const barH = SQ;
  // among E (positives), split true vs false positive
  const tpMass = sens * prior;
  const tpFrac = pE > 0 ? tpMass / pE : 0;

  const sigP = 'bex-grad-sig';

  return (
    <div className="mlviz-wrap aev-wrap">
      <div className="aev-head">
        <span className="aev-head-icon">
          <Stethoscope size={16} />
        </span>
        <span className="aev-head-text">
          <span className="aev-head-title">Bayes explorer</span>
          <span className="aev-head-sub">
            rare-disease base rate — a 95%-accurate test on a 1% disease is mostly false alarms
          </span>
        </span>
        <span className="aev-chip">P(H|E) = {pct(post)}</span>
      </div>

      <div className="aev-body" style={{ gridTemplateColumns: '1fr 158px' }}>
        <div className="mlviz-stage aev-stage">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="aev-svg"
            preserveAspectRatio="xMidYMid meet"
            style={{ cursor: 'default' }}
          >
            <defs>
              <linearGradient id={sigP} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="var(--hue-mint)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--hue-mint)" />
              </linearGradient>
            </defs>

            {/* population square */}
            <text x={SQ_X} y={SQ_Y - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)">
              whole population
            </text>

            {/* H column — true positives (mint) + false negatives (dim) */}
            <rect
              x={SQ_X}
              y={SQ_Y}
              width={colHw}
              height={hPosH}
              fill="var(--hue-mint)"
              opacity="0.9"
              style={{ transition: trans }}
            />
            <rect
              x={SQ_X}
              y={SQ_Y + hPosH}
              width={colHw}
              height={hNegH}
              fill="var(--hue-mint)"
              opacity="0.18"
              style={{ transition: trans }}
            />

            {/* ¬H column — false positives (pink) + true negatives (sky faint) */}
            <rect
              x={SQ_X + colHw}
              y={SQ_Y}
              width={colNw}
              height={nPosH}
              fill="var(--hue-pink)"
              opacity="0.85"
              style={{ transition: trans }}
            />
            <rect
              x={SQ_X + colHw}
              y={SQ_Y + nPosH}
              width={colNw}
              height={nNegH}
              fill="var(--hue-sky)"
              opacity="0.12"
              style={{ transition: trans }}
            />

            {/* square outline + prior divider */}
            <rect x={SQ_X} y={SQ_Y} width={SQ} height={SQ} fill="none" stroke="var(--border)" strokeWidth="1" />
            <line
              x1={SQ_X + colHw}
              y1={SQ_Y}
              x2={SQ_X + colHw}
              y2={SQ_Y + SQ}
              stroke="var(--accent)"
              strokeWidth="1.2"
              opacity="0.7"
              style={{ transition: trans }}
            />

            {/* labels under square */}
            <text x={SQ_X + colHw / 2} y={SQ_Y + SQ + 14} fontSize="8" fill="var(--hue-mint)" fontFamily="var(--mono)" textAnchor="middle">
              H {pct(prior)}
            </text>
            <text x={SQ_X + colHw + colNw / 2} y={SQ_Y + SQ + 14} fontSize="8" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              ¬H {pct(1 - prior)}
            </text>

            {/* arrow to posterior bar */}
            <text x={barX + barW / 2} y={SQ_Y - 8} fontSize="9" fill="var(--text-dim)" fontFamily="var(--mono)" textAnchor="middle">
              of those who test positive
            </text>

            {/* posterior bar: stacked true vs false positives */}
            <rect x={barX} y={barTop} width={barW} height={barH} fill="none" stroke="var(--border)" strokeWidth="1" />
            <rect
              x={barX}
              y={barTop}
              width={barW}
              height={barH * tpFrac}
              fill={`url(#${sigP})`}
              style={{ transition: trans }}
            />
            <rect
              x={barX}
              y={barTop + barH * tpFrac}
              width={barW}
              height={barH * (1 - tpFrac)}
              fill="var(--hue-pink)"
              opacity="0.7"
              style={{ transition: trans }}
            />
            <text
              x={barX + barW / 2}
              y={barTop + barH * tpFrac * 0.5 + 3}
              fontSize="9"
              fill="var(--text-main)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              {tpFrac > 0.12 ? `truly sick ${pct(tpFrac)}` : ''}
            </text>
            <text
              x={barX + barW / 2}
              y={barTop + barH * tpFrac + barH * (1 - tpFrac) * 0.5 + 3}
              fontSize="9"
              fill="var(--text-main)"
              fontFamily="var(--mono)"
              textAnchor="middle"
            >
              {1 - tpFrac > 0.12 ? `false alarm ${pct(1 - tpFrac)}` : ''}
            </text>
            <text x={barX + barW / 2} y={barTop + barH + 16} fontSize="9" fill="var(--hue-mint)" fontFamily="var(--mono)" textAnchor="middle">
              posterior {pct(post)}
            </text>
          </svg>
        </div>

        <div className="mlviz-statcol aev-cards">
          <div className="mlviz-statcard mlviz-statcard-dim">
            <span className="mlviz-statcard-label">prior P(H)</span>
            <span className="mlviz-statcard-val">{pct(prior)}</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-sky">
            <span className="mlviz-statcard-label">likelihood ratio</span>
            <span className="mlviz-statcard-val">{Number.isFinite(lr) ? `${fmt(lr, 1)}×` : '∞'}</span>
            <span className="mlviz-statcard-sub">P(E|H) / P(E|¬H)</span>
          </div>
          <div className="mlviz-statcard mlviz-statcard-mint">
            <span className="mlviz-statcard-label">posterior P(H|E)</span>
            <span className="mlviz-statcard-val">{pct(post)}</span>
          </div>
          <div className="aev-expr">P(E) = {pct(pE)}</div>
        </div>
      </div>

      <div className="mlviz-readout aev-readout">
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">prior</span>
          <input type="range" min="0.001" max="0.6" step="0.001" value={prior} onChange={(e) => setPrior(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{pct(prior)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">P(E|H)</span>
          <input type="range" min="0.05" max="0.999" step="0.001" value={sens} onChange={(e) => setSens(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{pct(sens)}</span>
        </label>
        <label className="mlviz-slider">
          <span className="mlviz-slider-label">P(E|¬H)</span>
          <input type="range" min="0.001" max="0.5" step="0.001" value={fpr} onChange={(e) => setFpr(parseFloat(e.target.value))} />
          <span className="mlviz-slider-val">{pct(fpr)}</span>
        </label>

        <div className="mlviz-row mlviz-btn-row">
          <button type="button" className="mlviz-btn" onClick={reset}>
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        </div>

        <div className="mlviz-hint">
          tiny prior + non-zero false-positive rate = a positive test still leaves you probably healthy
        </div>
      </div>
    </div>
  );
}
