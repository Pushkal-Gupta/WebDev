import React, { useMemo, useState } from 'react';
import { Cpu, Gauge, AlertTriangle, Lightbulb } from 'lucide-react';
import { LLM_MODELS, LLM_DIFFICULTIES, LLM_FAILURE_MODES, LLM_TAKEAWAYS } from './lcLlmData';
import './LcLlmBenchmark.css';

const DIFF_TOKEN = { Easy: 'var(--easy)', Medium: 'var(--medium)', Hard: 'var(--hard)' };

// Normalize the failure-mode bars to the largest share so the top mode fills the
// track and the rest stay proportional — never overflowing 100%.
const maxFailShare = Math.max(...LLM_FAILURE_MODES.map((m) => m.share));

function GroupedBars({ models }) {
  const groupW = 100 / models.length;
  return (
    <svg className="llm-chart" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Solve rate by difficulty per model">
      {models.map((m, i) => {
        const x0 = i * groupW;
        const bw = (groupW * 0.74) / 3;
        const pad = groupW * 0.13;
        return (
          <g key={m.slug}>
            {LLM_DIFFICULTIES.map((d, j) => {
              const v = m[d.toLowerCase()];
              const h = (v / 100) * 40;
              const x = x0 + pad + j * bw;
              return <rect key={d} x={x} y={46 - h} width={bw * 0.85} height={h} rx="0.4" fill={DIFF_TOKEN[d]} opacity="0.9" />;
            })}
            <text x={x0 + groupW / 2} y="52" textAnchor="middle" fontSize="2.1" fill="var(--text-dim)">{m.name.split(' ')[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function RatingScatter({ models }) {
  const minR = 1300, maxR = 2300;
  const sx = (r) => 6 + ((r - minR) / (maxR - minR)) * 88;
  const sy = (h) => 50 - (h / 100) * 42;
  return (
    <svg className="llm-chart" viewBox="0 0 100 56" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Hard solve rate vs contest rating">
      <line x1="6" y1="50" x2="98" y2="50" stroke="var(--border)" strokeWidth="0.4" />
      <line x1="6" y1="8" x2="6" y2="50" stroke="var(--border)" strokeWidth="0.4" />
      {models.map((m) => (
        <g key={m.slug}>
          <circle cx={sx(m.rating)} cy={sy(m.hard)} r="1.8" fill="var(--accent)" />
          <text x={sx(m.rating)} y={sy(m.hard) - 2.4} textAnchor="middle" fontSize="2" fill="var(--text-dim)">{m.rating}</text>
        </g>
      ))}
      <text x="52" y="55" textAnchor="middle" fontSize="2.1" fill="var(--text-dim)">contest rating</text>
      <text x="2.5" y="9" fontSize="2.1" fill="var(--text-dim)" transform="rotate(-90 2.5 9)">hard solve %</text>
    </svg>
  );
}

export default function LcLlmBenchmark() {
  const [sort, setSort] = useState('overall');

  const ranked = useMemo(
    () => [...LLM_MODELS].sort((a, b) => b[sort] - a[sort]),
    [sort],
  );

  return (
    <div className="llm-page">
      <header className="llm-head">
        <h1 className="llm-title"><Cpu size={24} /> LLMs on LeetCode</h1>
        <p className="llm-sub">How language models score on rated contest problems — solve rate by difficulty, projected contest rating, and where they break.</p>
      </header>

      <section className="llm-dash">
        <div className="llm-dash-card">
          <div className="llm-dash-head"><Gauge size={14} /> Solve rate by difficulty</div>
          <GroupedBars models={ranked} />
          <div className="llm-legend">
            {LLM_DIFFICULTIES.map((d) => (
              <span key={d}><i style={{ background: DIFF_TOKEN[d] }} /> {d}</span>
            ))}
          </div>
        </div>
        <div className="llm-dash-card">
          <div className="llm-dash-head"><Gauge size={14} /> Hard solve rate vs rating</div>
          <RatingScatter models={LLM_MODELS} />
        </div>
      </section>

      <div className="llm-sort">
        <span>Rank by</span>
        {['overall', 'hard', 'medium', 'rating'].map((s) => (
          <button key={s} className={`llm-sort-btn${sort === s ? ' on' : ''}`} onClick={() => setSort(s)}>{s}</button>
        ))}
      </div>

      <section className="llm-table">
        <div className="llm-row llm-row-head">
          <span>Model</span>
          <span>Tier</span>
          <span className="llm-num">Easy</span>
          <span className="llm-num">Med</span>
          <span className="llm-num">Hard</span>
          <span className="llm-num">Overall</span>
          <span className="llm-num">Rating</span>
        </div>
        {ranked.map((m) => (
          <div key={m.slug} className="llm-row">
            <span className="llm-model">
              <span className="llm-model-name">{m.name}</span>
              <span className="llm-model-note">{m.note}</span>
            </span>
            <span className="llm-tier">{m.tier}</span>
            <span className="llm-num" style={{ color: DIFF_TOKEN.Easy }}>{m.easy}</span>
            <span className="llm-num" style={{ color: DIFF_TOKEN.Medium }}>{m.medium}</span>
            <span className="llm-num" style={{ color: DIFF_TOKEN.Hard }}>{m.hard}</span>
            <span className="llm-num llm-overall">{m.overall}</span>
            <span className="llm-num">{m.rating}</span>
          </div>
        ))}
      </section>

      <section className="llm-lower">
        <div className="llm-panel">
          <div className="llm-panel-head"><AlertTriangle size={14} /> Where they break</div>
          <ul className="llm-fails">
            {LLM_FAILURE_MODES.map((f) => (
              <li key={f.mode}>
                <div className="llm-fail-top">
                  <span className="llm-fail-mode">{f.mode}</span>
                  <span className="llm-fail-share">{f.share}%</span>
                </div>
                <div className="llm-fail-bar"><i style={{ width: `${(f.share / maxFailShare) * 100}%` }} /></div>
                <span className="llm-fail-detail">{f.detail}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="llm-panel">
          <div className="llm-panel-head"><Lightbulb size={14} /> What the numbers say</div>
          <ul className="llm-takeaways">
            {LLM_TAKEAWAYS.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </section>
    </div>
  );
}
