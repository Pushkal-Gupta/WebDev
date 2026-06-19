import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Code2, Search, ArrowRight } from 'lucide-react';
import { PG_FORGE_PROBLEMS, PG_FORGE_CATEGORIES } from './pgForgeProblemsData';
import ForgeThumb from './ForgeThumb';
import './PGForgeProblems.css';

const DIFFS = ['easy', 'medium', 'hard'];

export default function PGForgeProblems() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PG_FORGE_PROBLEMS.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (difficulty !== 'All' && p.difficulty !== difficulty) return false;
      if (q && !`${p.title} ${p.category} ${p.topic}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, category, difficulty]);

  return (
    <div className="forge-pb">
      <nav className="forge-crumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Problems</span>
      </nav>

      <header className="forge-pb-header">
        <h1 className="forge-pb-title">Build the machinery yourself</h1>
        <p className="forge-pb-sub">
          Implement optimizers, activations, attention, and classic models from scratch — one runnable task each.
        </p>
      </header>

      <div className="forge-pb-controls">
        <div className="forge-pb-search">
          <Search size={15} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search problems"
            aria-label="Search problems"
          />
        </div>

        <div className="forge-pb-chips">
          <button
            type="button"
            className={`forge-pb-chip${category === 'All' ? ' is-on' : ''}`}
            onClick={() => setCategory('All')}
          >
            All
          </button>
          {PG_FORGE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`forge-pb-chip${category === c ? ' is-on' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="forge-pb-chips forge-pb-chips-diff">
          <button
            type="button"
            className={`forge-pb-chip${difficulty === 'All' ? ' is-on' : ''}`}
            onClick={() => setDifficulty('All')}
          >
            All levels
          </button>
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              className={`forge-pb-chip forge-pb-chip-${d}${difficulty === d ? ' is-on' : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="forge-pb-none">No problems match those filters.</p>
      ) : (
        <div className="forge-pb-grid">
          {filtered.map((p) => (
            <Link key={p.slug} to={`/ml/problems/${p.slug}`} className="forge-pb-card">
              <div className="forge-thumb-frame forge-pb-card-thumb">
                <ForgeThumb seed={p.title} />
                <span className={`forge-pb-diff forge-pb-diff-${p.difficulty}`}>{p.difficulty}</span>
              </div>
              <div className="forge-pb-card-body">
                <div className="forge-pb-card-head">
                  <Code2 size={16} className="forge-pb-card-icon" />
                  <h2 className="forge-pb-card-title">{p.title}</h2>
                </div>
                <div className="forge-pb-card-foot">
                  <span className="forge-pb-cat">{p.category}</span>
                  <ArrowRight size={15} className="forge-pb-card-arrow" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
