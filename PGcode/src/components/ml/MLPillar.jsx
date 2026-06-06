import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Brain, Sigma, Network, Workflow, Zap, Layers } from 'lucide-react';
import { getPillar } from '../../content/mlContent';
import './MLHub.css';

const ICONS = { Sigma, Workflow, Layers, Brain, Zap, Network };

export default function MLPillar() {
  const { pillarSlug } = useParams();
  const pillar = getPillar(pillarSlug);

  if (!pillar) {
    return (
      <div className="mlhub">
        <Link to="/ml" className="learn-crumb">
          <ArrowLeft size={13} />
          <span>ML-DL-AI</span>
        </Link>
        <h1 className="mlhub-title">Not found</h1>
        <p className="mlhub-sub">No pillar matches "{pillarSlug}".</p>
      </div>
    );
  }

  const Icon = ICONS[pillar.iconName] || Sigma;
  const lessons = pillar.lessons || [];

  return (
    <div className="mlhub">
      <Link to="/ml" className="learn-crumb">
        <ArrowLeft size={13} />
        <span>ML-DL-AI</span>
        <span className="learn-crumb-sep">/</span>
        <span className="learn-crumb-here">{pillar.title}</span>
      </Link>

      <header className="mlhub-hero">
        <div className="mlhub-pillar-head" style={{ marginBottom: '0.6rem' }}>
          <Icon size={26} />
        </div>
        <h1 className="mlhub-title">{pillar.title}</h1>
        <p className="mlhub-sub">{pillar.oneLiner}</p>
      </header>

      {lessons.length === 0 ? (
        <section className="ml-empty">
          <p>Lessons land here as they are written.</p>
        </section>
      ) : (
        <section className="mlhub-pillars">
          {lessons.map(l => (
            <Link
              key={l.slug}
              to={`/ml/${pillarSlug}/${l.slug}`}
              className="mlhub-pillar"
            >
              <div className="mlhub-pillar-head">
                <span className="mlhub-pillar-status">{l.difficulty}</span>
                <span className="mlhub-pillar-status">{l.readMinutes} min</span>
              </div>
              <h2 className="mlhub-pillar-title">{l.title}</h2>
              <p className="mlhub-pillar-summary">{l.oneLiner}</p>
              <span className="mlhub-pillar-cta">
                Read <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
