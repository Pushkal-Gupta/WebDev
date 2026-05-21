import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Clock, Flame, Star } from 'lucide-react';
import { useContests } from '../../lib/queries';
import './Contests.css';

export default function ContestsIndex() {
  const { data: contests = [], isLoading } = useContests();

  if (isLoading) {
    return (
      <div className="ctx-container">
        <div className="ctx-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="ctx-container">
        <div className="ctx-empty">
          <Trophy size={32} className="ctx-empty-icon" />
          <h2 className="ctx-empty-title">No contests yet</h2>
          <p className="ctx-empty-sub">
            Contests are being prepared. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  const featured = contests.filter(c => c.is_featured);
  const others = contests.filter(c => !c.is_featured);

  return (
    <div className="ctx-container">
      <header className="ctx-header">
        <h1 className="ctx-title">Contests</h1>
        <p className="ctx-sub">
          Timed problem sets. Each is a virtual contest — start whenever you want; the clock runs
          while you solve. Penalty time accrues for wrong submissions, ICPC-style.
        </p>
      </header>

      {featured.length > 0 && (
        <section className="ctx-section">
          <h2 className="ctx-section-title">Featured</h2>
          <div className="ctx-grid">
            {featured.map(c => <ContestCard key={c.slug} c={c} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="ctx-section">
          <h2 className="ctx-section-title">All contests</h2>
          <div className="ctx-grid">
            {others.map(c => <ContestCard key={c.slug} c={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ContestCard({ c }) {
  return (
    <Link to={`/contests/${c.slug}`} className="ctx-card">
      <div className="ctx-card-head">
        <Trophy size={14} className="ctx-card-icon" />
        <h3 className="ctx-card-title">{c.name}</h3>
        {c.is_featured && <Star size={11} className="ctx-card-star" />}
      </div>
      {c.description && <p className="ctx-card-desc">{c.description}</p>}
      <div className="ctx-card-foot">
        <span className="ctx-card-meta"><Clock size={11} /> {c.duration_minutes} min</span>
        <span className={`ctx-diff ctx-diff-${(c.difficulty || 'Mixed').toLowerCase()}`}>{c.difficulty || 'Mixed'}</span>
        <ArrowRight size={13} className="ctx-card-arrow" />
      </div>
    </Link>
  );
}
