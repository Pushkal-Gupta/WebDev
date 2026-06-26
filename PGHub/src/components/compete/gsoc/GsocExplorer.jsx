import React, { useMemo, useState } from 'react';
import { GitBranch, Search, Calendar, Layers, Lightbulb, ChevronDown } from 'lucide-react';
import { GSOC_ORGS, GSOC_CATEGORIES, GSOC_TIMELINE } from './gsocData';
import Breadcrumb from '../../common/Breadcrumb';
import './GsocExplorer.css';

const CAT_HUE = {
  'AI/ML': 'var(--hue-violet)',
  Systems: 'var(--hue-sky)',
  Web: 'var(--hue-mint)',
  Graphics: 'var(--hue-pink)',
  Data: 'var(--accent)',
  Cloud: 'var(--hue-sky)',
  Languages: 'var(--hue-violet)',
  Science: 'var(--hue-mint)',
};

const DIFF_TOKEN = { Beginner: 'var(--easy)', Intermediate: 'var(--medium)', Advanced: 'var(--hard)' };

export default function GsocExplorer() {
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GSOC_ORGS.filter((o) => {
      if (cat !== 'All' && o.category !== cat) return false;
      if (!q) return true;
      return (
        o.name.toLowerCase().includes(q) ||
        o.tech.some((t) => t.toLowerCase().includes(q)) ||
        o.category.toLowerCase().includes(q)
      );
    });
  }, [cat, query]);

  const toggle = (slug) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return (
    <div className="gsoc-page">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'GSoC' }]} />
      <header className="gsoc-head">
        <h1 className="gsoc-title"><GitBranch size={24} /> GSoC Explorer</h1>
        <p className="gsoc-sub">Mentoring organizations and their project ideas — filter by domain, search by tech, open a card for sample tasks.</p>
      </header>

      <section className="gsoc-timeline" aria-label="Program timeline">
        {GSOC_TIMELINE.map((t, i) => (
          <div className="gsoc-phase" key={t.phase}>
            <div className="gsoc-phase-top">
              <span className="gsoc-phase-num">{i + 1}</span>
              <Calendar size={13} />
              <span className="gsoc-phase-window">{t.window}</span>
            </div>
            <div className="gsoc-phase-name">{t.phase}</div>
            <div className="gsoc-phase-detail">{t.detail}</div>
          </div>
        ))}
      </section>

      <div className="gsoc-controls">
        <div className="gsoc-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search org or tech…"
            aria-label="Search organizations"
          />
        </div>
        <div className="gsoc-chips">
          <button className={`gsoc-chip${cat === 'All' ? ' on' : ''}`} onClick={() => setCat('All')}>All</button>
          {GSOC_CATEGORIES.map((c) => (
            <button
              key={c}
              className={`gsoc-chip${cat === c ? ' on' : ''}`}
              style={{ '--chip-hue': CAT_HUE[c] }}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="gsoc-grid">
        {filtered.map((o) => {
          const open = expanded.has(o.slug);
          return (
            <article
              key={o.slug}
              className={`gsoc-card${open ? ' open' : ''}`}
              style={{ '--card-hue': CAT_HUE[o.category] }}
            >
              <div className="gsoc-card-head">
                <h2 className="gsoc-card-name">{o.name}</h2>
                <span className="gsoc-cat-badge">{o.category}</span>
              </div>
              <div className="gsoc-tech">
                {o.tech.map((t) => <span key={t} className="gsoc-tech-tag">{t}</span>)}
              </div>
              <p className="gsoc-blurb">{o.blurb}</p>
              <div className="gsoc-meta">
                <span><Layers size={12} /> {o.projectsCount} projects</span>
                <span><Calendar size={12} /> {o.yearsParticipated} yrs</span>
                <span className="gsoc-diff" style={{ color: DIFF_TOKEN[o.difficulty] }}>{o.difficulty}</span>
              </div>
              <button className="gsoc-toggle" onClick={() => toggle(o.slug)} aria-expanded={open}>
                <Lightbulb size={13} /> {o.sampleIdeas.length} idea{o.sampleIdeas.length > 1 ? 's' : ''}
                <ChevronDown size={14} className="gsoc-toggle-arrow" />
              </button>
              {open && (
                <ul className="gsoc-ideas">
                  {o.sampleIdeas.map((idea) => (
                    <li key={idea.title}>
                      <span className="gsoc-idea-title">{idea.title}</span>
                      <span className="gsoc-idea-sum">{idea.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </section>
    </div>
  );
}
