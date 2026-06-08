import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sigma, Workflow, ArrowRight } from 'lucide-react';
import { PILLARS as REGISTRY } from '../../content/mlContent';
import { GROUPS } from '../../content/mlGroups';
import './MLHub.css';

const ICONS = { Sigma, Workflow, Brain };

function totalLessons(slugs) {
  return slugs.reduce((acc, slug) => acc + (REGISTRY[slug]?.lessons?.length || 0), 0);
}

export default function MLHub() {
  return (
    <div className="mlhub">
      <header className="mlhub-hero">
        <h1 className="mlhub-title">ML-DL-AI</h1>
        <p className="mlhub-sub">Linear algebra, optimization, deep nets, attention, RL, numerical methods.</p>
      </header>

      <section className="mlhub-pillars mlhub-pillars-3">
        {Object.entries(GROUPS).map(([groupSlug, g]) => {
          const Icon = ICONS[g.iconName] || Sigma;
          const lessonCount = totalLessons(g.members.map(m => m.slug));
          const status = lessonCount > 0 ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}` : 'planned';
          return (
            <Link key={groupSlug} to={`/ml/g/${groupSlug}`} className="mlhub-pillar mlhub-pillar-group">
              <div className="mlhub-pillar-head">
                <Icon size={26} />
                <span className="mlhub-pillar-status">{status}</span>
              </div>
              <h2 className="mlhub-pillar-title">{g.title}</h2>
              <p className="mlhub-pillar-summary">{g.summary}</p>

              <span className="mlhub-card-cta">
                Open <ArrowRight size={14} />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
