import React, { useMemo, useState } from 'react';
import { Brain, Trophy, Users, Clock, BarChart3 } from 'lucide-react';
import { KAGGLE_COMPETITIONS, KAGGLE_CATEGORIES, DIFFICULTY_ORDER } from './kaggleData';
import Breadcrumb from '../../common/Breadcrumb';
import './KaggleCompetitions.css';

const CAT_HUE = {
  'Computer Vision': 'var(--hue-violet)',
  NLP: 'var(--hue-sky)',
  Tabular: 'var(--hue-mint)',
  'Time Series': 'var(--hue-pink)',
  'Reinforcement Learning': 'var(--accent)',
  Recommendation: 'var(--hue-violet)',
  Audio: 'var(--hue-sky)',
  Generative: 'var(--hue-pink)',
};

const DIFF_TOKEN = { Entry: 'var(--easy)', Intermediate: 'var(--medium)', Expert: 'var(--hard)' };

function urgencyToken(days) {
  if (days < 7) return 'var(--hard)';
  if (days < 21) return 'var(--medium)';
  return 'var(--easy)';
}

function CategoryBars({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const bw = 100 / data.length;
  return (
    <svg className="kg-chart" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Competitions by category">
      {data.map((d, i) => {
        const h = (d.count / max) * 40;
        const x = i * bw + bw * 0.18;
        const w = bw * 0.64;
        return (
          <g key={d.label}>
            <rect x={x} y={48 - h} width={w} height={h} rx="0.8" fill={CAT_HUE[d.label] || 'var(--accent)'} opacity="0.85" />
            <text x={x + w / 2} y={46 - h} textAnchor="middle" fontSize="2.6" fill="var(--text-dim)">{d.count}</text>
            <text x={x + w / 2} y="54" textAnchor="middle" fontSize="2.2" fill="var(--text-dim)">{d.short}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PrizeLollipops({ data }) {
  const max = Math.max(...data.map((d) => d.prizeValue), 1);
  const rh = 100 / data.length;
  return (
    <svg className="kg-chart" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Top prize pools">
      {data.map((d, i) => {
        const y = i * (60 / data.length) + (60 / data.length) / 2;
        const len = (d.prizeValue / max) * 60;
        return (
          <g key={d.slug}>
            <line x1="2" y1={y} x2={2 + len} y2={y} stroke="var(--accent)" strokeWidth="0.7" opacity="0.5" />
            <circle cx={2 + len} cy={y} r="1.4" fill="var(--accent)" />
            <text x="2" y={y - rh * 0.18} fontSize="2.2" fill="var(--text-dim)">{d.title.slice(0, 26)}</text>
            <text x={2 + len + 2.5} y={y + 0.8} fontSize="2.3" fill="var(--text-main)">{d.prize}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function KaggleCompetitions() {
  const [cat, setCat] = useState('All');
  const [sort, setSort] = useState('deadline');

  const filtered = useMemo(() => {
    let rows = KAGGLE_COMPETITIONS.filter((c) => cat === 'All' || c.category === cat);
    rows = [...rows].sort((a, b) => {
      if (sort === 'deadline') return a.daysLeft - b.daysLeft;
      if (sort === 'prize') return b.prizeValue - a.prizeValue;
      if (sort === 'teams') return b.teams - a.teams;
      if (sort === 'difficulty') return DIFFICULTY_ORDER[b.difficulty] - DIFFICULTY_ORDER[a.difficulty];
      return 0;
    });
    return rows;
  }, [cat, sort]);

  const catData = useMemo(() => {
    return KAGGLE_CATEGORIES.map((c) => ({
      label: c,
      short: c.split(' ').map((w) => w[0]).join('').slice(0, 3),
      count: KAGGLE_COMPETITIONS.filter((x) => x.category === c).length,
    })).filter((d) => d.count > 0);
  }, []);

  const prizeData = useMemo(
    () => [...KAGGLE_COMPETITIONS].filter((c) => c.prizeValue > 0).sort((a, b) => b.prizeValue - a.prizeValue).slice(0, 6),
    [],
  );

  return (
    <div className="kg-page">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'Kaggle' }]} />
      <header className="kg-head">
        <h1 className="kg-title"><Brain size={24} /> ML Competitions</h1>
        <p className="kg-sub">Live data-science and machine-learning contests — sorted by deadline, prize, or field, with prize pools at a glance.</p>
      </header>

      <section className="kg-dash">
        <div className="kg-dash-card">
          <div className="kg-dash-head"><BarChart3 size={14} /> By field</div>
          <CategoryBars data={catData} />
        </div>
        <div className="kg-dash-card">
          <div className="kg-dash-head"><Trophy size={14} /> Top prize pools</div>
          <PrizeLollipops data={prizeData} />
        </div>
      </section>

      <div className="kg-controls">
        <div className="kg-chips">
          <button className={`kg-chip${cat === 'All' ? ' on' : ''}`} onClick={() => setCat('All')}>All</button>
          {KAGGLE_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`kg-chip${cat === c ? ' on' : ''}`}
              style={{ '--chip-hue': CAT_HUE[c] }}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="kg-sort">
          <span>Sort</span>
          {['deadline', 'prize', 'teams', 'difficulty'].map((s) => (
            <button key={s} className={`kg-sort-btn${sort === s ? ' on' : ''}`} onClick={() => setSort(s)}>{s}</button>
          ))}
        </div>
      </div>

      <section className="kg-grid">
        {filtered.map((c) => (
          <article key={c.slug} className="kg-card" style={{ '--card-hue': CAT_HUE[c.category] }}>
            <div className="kg-card-head">
              <h2 className="kg-card-title">{c.title}</h2>
              <span className="kg-cat">{c.category}</span>
            </div>
            <div className="kg-prize-row">
              <span className="kg-prize">{c.prize}</span>
              <span className="kg-metric">{c.metric}</span>
            </div>
            <p className="kg-summary">{c.summary}</p>
            <div className="kg-meta">
              <span><Users size={12} /> {c.teams.toLocaleString()}</span>
              <span className="kg-days" style={{ color: urgencyToken(c.daysLeft) }}><Clock size={12} /> {c.deadlineLabel}</span>
              <span className="kg-diff" style={{ color: DIFF_TOKEN[c.difficulty] }}>{c.difficulty}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
