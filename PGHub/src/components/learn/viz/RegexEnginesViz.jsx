import React, { useMemo, useState } from 'react';
import { GitCompare, Zap, AlertTriangle, RotateCcw } from 'lucide-react';
import './RegexEnginesViz.css';

const W = 880;
const H = 230;
const LEFT = 50;
const RIGHT = 24;
const TOP = 18;
const BOT = 34;
const PLOT_W = W - LEFT - RIGHT;
const PLOT_H = H - TOP - BOT;

// Pattern (a|a)*b against n copies of 'a' with no trailing b -> forced failure.
// Thompson NFA: active-set never exceeds ~3 states, work ~ m*n (linear).
// Backtracking: each of n positions doubles the paths -> 2^n.
const M_STATES = 3; // bounded active-set size for this pattern

function nfaWork(n) {
  return M_STATES * n; // O(m*n)
}
function backtrackWork(n) {
  // 2^n paths explored before declaring no match (capped for display sanity)
  return Math.pow(2, n);
}

function fmtBig(v) {
  if (v < 1000) return String(Math.round(v));
  if (v < 1e6) return (v / 1e3).toFixed(1) + 'K';
  if (v < 1e9) return (v / 1e6).toFixed(1) + 'M';
  if (v < 1e12) return (v / 1e9).toFixed(1) + 'B';
  return v.toExponential(1);
}

export default function RegexEnginesViz() {
  const [n, setN] = useState(20);
  const N_MAX = 30;

  const curves = useMemo(() => {
    const nfa = [];
    const bt = [];
    let maxLog = 0;
    for (let i = 1; i <= N_MAX; i++) {
      const w = backtrackWork(i);
      maxLog = Math.max(maxLog, Math.log10(w));
      nfa.push([i, nfaWork(i)]);
      bt.push([i, w]);
    }
    return { nfa, bt, maxLog };
  }, []);

  // log-scale y so both curves are visible
  const yMaxLog = curves.maxLog + 0.3;
  const sx = (i) => LEFT + ((i - 1) / (N_MAX - 1)) * PLOT_W;
  const syLog = (v) => {
    const l = Math.log10(Math.max(1, v));
    return TOP + (1 - l / yMaxLog) * PLOT_H;
  };

  const nfaPath = 'M' + curves.nfa.map(([i, v]) => `${sx(i).toFixed(1)},${syLog(v).toFixed(1)}`).join(' L');
  const btPath = 'M' + curves.bt.map(([i, v]) => `${sx(i).toFixed(1)},${syLog(v).toFixed(1)}`).join(' L');

  const nfaNow = nfaWork(n);
  const btNow = backtrackWork(n);
  const ratio = btNow / nfaNow;

  const xTicks = [1, 5, 10, 15, 20, 25, 30];

  return (
    <div className="rgxe">
      <div className="rgxe-head">
        <span className="rgxe-head-icon"><GitCompare size={16} /></span>
        <span className="rgxe-head-text">
          <span className="rgxe-head-title">NFA simulation vs backtracking</span>
          <span className="rgxe-head-sub">
            pattern <code>(a|a)*b</code> on <code>n</code> a&apos;s with no trailing b — slide n and watch backtracking explode
          </span>
        </span>
        <span className="rgxe-chip">n = {n}</span>
      </div>

      <div className="rgxe-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rgxe-svg" preserveAspectRatio="xMidYMid meet">
          {/* log gridlines */}
          {Array.from({ length: Math.ceil(yMaxLog) + 1 }, (_, k) => k).map((k) => (
            <g key={`g-${k}`}>
              <line x1={LEFT} y1={syLog(Math.pow(10, k))} x2={LEFT + PLOT_W} y2={syLog(Math.pow(10, k))} stroke="var(--border)" strokeWidth="0.5" opacity="0.45" />
              <text x={LEFT - 6} y={syLog(Math.pow(10, k)) + 3} className="rgxe-tick" textAnchor="end">
                {k === 0 ? '1' : '1e' + k}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={`xt-${t}`} x={sx(t)} y={TOP + PLOT_H + 16} className="rgxe-tick" textAnchor="middle">{t}</text>
          ))}
          <text x={14} y={TOP + 4} className="rgxe-axis">work (log)</text>
          <text x={LEFT + PLOT_W} y={H - 6} className="rgxe-axis" textAnchor="end">input length n</text>

          {/* backtracking curve (danger) */}
          <path d={btPath} fill="none" stroke="var(--hard)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          {/* nfa curve */}
          <path d={nfaPath} fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

          {/* n marker */}
          <line x1={sx(n)} y1={TOP} x2={sx(n)} y2={TOP + PLOT_H} stroke="var(--text-dim)" strokeWidth="0.8" strokeDasharray="4 3" opacity="0.6" />
          <circle cx={sx(n)} cy={syLog(btNow)} r="5" fill="var(--hard)" stroke="var(--bg)" strokeWidth="1.5" />
          <circle cx={sx(n)} cy={syLog(nfaNow)} r="5" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />

          {/* legend */}
          <g transform={`translate(${LEFT + 12}, ${TOP + 8})`}>
            <rect x="0" y="-9" width="10" height="3" rx="1.5" fill="var(--accent)" />
            <text x="16" y="-4" className="rgxe-legend">Thompson NFA · O(m·n)</text>
            <rect x="0" y="9" width="10" height="3" rx="1.5" fill="var(--hard)" />
            <text x="16" y="14" className="rgxe-legend">Backtracking · O(2ⁿ)</text>
          </g>
        </svg>
      </div>

      <div className="rgxe-cards">
        <div className="rgxe-card rgxe-card-accent">
          <span className="rgxe-card-label">NFA steps</span>
          <span className="rgxe-card-val">{fmtBig(nfaNow)}</span>
        </div>
        <div className="rgxe-card rgxe-card-hard">
          <span className="rgxe-card-label">backtrack paths</span>
          <span className="rgxe-card-val">{fmtBig(btNow)}</span>
        </div>
        <div className="rgxe-card rgxe-card-warn">
          <span className="rgxe-card-label">slowdown factor</span>
          <span className="rgxe-card-val">{fmtBig(ratio)}×</span>
        </div>
        <div className="rgxe-card">
          <span className="rgxe-card-label">active-set size</span>
          <span className="rgxe-card-val">≤ {M_STATES} states</span>
        </div>
      </div>

      <div className="rgxe-controls">
        <label className="rgxe-slider">
          <span className="rgxe-slider-label"><Zap size={13} /> input length n</span>
          <input type="range" min={1} max={N_MAX} step={1} value={n} onChange={(e) => setN(Number(e.target.value))} />
          <span className="rgxe-slider-val">{n}</span>
        </label>
        <span className="rgxe-spacer" />
        <button type="button" className="rgxe-btn" onClick={() => setN(20)}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rgxe-narration">
        <span className="rgxe-narration-label">
          {btNow > 1e6 ? <AlertTriangle size={12} /> : null} why
        </span>
        <span className="rgxe-narration-body">
          {btNow > 1e8
            ? `At n = ${n} the backtracker explores ${fmtBig(btNow)} paths before giving up — this is catastrophic backtracking, where a regex on a short string freezes the process. The NFA does ${fmtBig(nfaNow)} steps for the same input.`
            : `The NFA tracks at most ${M_STATES} active states and does ${fmtBig(nfaNow)} steps. The backtracker re-explores each ambiguous branch, doubling work per character — ${fmtBig(btNow)} paths at n = ${n}.`}
        </span>
      </div>
    </div>
  );
}
