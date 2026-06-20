import React from 'react';
import { Link } from 'react-router-dom';
import { Map, ArrowRight, Clock, Star } from 'lucide-react';
import { useRoadmaps } from '../../lib/queries';
import './Roadmaps.css';

export default function RoadmapsIndex() {
  const { data: roadmaps = [], isLoading } = useRoadmaps();

  if (isLoading) {
    return (
      <div className="rmx-container">
        <div className="rmx-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  // Default to showing the hard-coded DSA card if the engine table isn't seeded yet
  const fallback = [{
    slug: 'dsa-fundamentals',
    name: 'DSA Fundamentals',
    description: 'The full 22-topic roadmap with prerequisite dependencies.',
    kind: 'graph',
    default_layout: 'graph',
    estimated_hours: 80,
    is_featured: true,
  }];
  const list = roadmaps.length > 0 ? roadmaps : fallback;

  const featured = list.filter(r => r.is_featured);
  const others = list.filter(r => !r.is_featured);

  return (
    <div className="rmx-container">
      <header className="rmx-header">
        <h1 className="rmx-title">Roadmaps</h1>
        <p className="rmx-sub">
          Ordered study tracks with prerequisite dependencies — full breadth, fast interview prep, or a single-topic deep dive.
        </p>
      </header>

      {featured.length > 0 && (
        <section className="rmx-section">
          <h2 className="rmx-section-title">Featured</h2>
          <div className="rmx-grid">
            {featured.map(r => <RoadmapCard key={r.slug} r={r} />)}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="rmx-section">
          <h2 className="rmx-section-title">All tracks</h2>
          <div className="rmx-grid">
            {others.map(r => <RoadmapCard key={r.slug} r={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function RoadmapCard({ r }) {
  const target = r.kind === 'graph' && r.slug === 'dsa-fundamentals'
    ? '/roadmaps/dsa-fundamentals'
    : `/roadmaps/${r.slug}`;

  return (
    <Link to={target} className="rmx-card">
      <div className="rmx-card-head">
        <Map size={16} className="rmx-card-icon" />
        <h3 className="rmx-card-title">{r.name}</h3>
        {r.is_featured && <Star size={12} className="rmx-card-star" />}
      </div>
      {r.description && <p className="rmx-card-desc">{r.description}</p>}
      <div className="rmx-card-foot">
        {r.estimated_hours && (
          <span className="rmx-card-meta">
            <Clock size={11} /> ~{r.estimated_hours}h
          </span>
        )}
        <span className="rmx-card-kind">{r.kind}</span>
        <ArrowRight size={14} className="rmx-card-arrow" />
      </div>
    </Link>
  );
}
