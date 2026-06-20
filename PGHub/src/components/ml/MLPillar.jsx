import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Brain, Sigma, Network, Workflow, Zap, Layers, Clock, BarChart3 } from 'lucide-react';
import { getPillar } from '../../content/mlContent';
import ForgeThumb from './forge/ForgeThumb';
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
        <section className="mlhub-pillars mlhub-pillars-auto">
          {lessons.map((l) => (
            <Link
              key={l.slug}
              to={`/ml/${pillarSlug}/${l.slug}`}
              className="mlhub-pillar mlhub-lesson-card"
            >
              <span className="mlhub-pillar-stripe" aria-hidden="true" />
              <div className="mlhub-lesson-thumb" aria-hidden="true">
                <ForgeThumb seed={l.title} label={l.title.split(/\s+/)[0]} />
              </div>
              <div className="mlhub-lesson-body">
                <div className="mlhub-lesson-head">
                  <span className="mlhub-pillar-iconbox"><Icon size={16} /></span>
                  <ArrowRight size={16} className="mlhub-pillar-arrow" />
                </div>
                <h2 className="mlhub-lesson-title">{l.title}</h2>
                {l.oneLiner && <p className="mlhub-lesson-summary">{l.oneLiner}</p>}
                <div className="mlhub-pillar-chips">
                  {l.difficulty && (
                    <span className="mlhub-chip"><BarChart3 size={12} />{l.difficulty}</span>
                  )}
                  {l.readMinutes != null && (
                    <span className="mlhub-chip"><Clock size={12} />{l.readMinutes} min</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
