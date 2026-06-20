import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sigma, Workflow, ArrowRight, BookOpen, Boxes } from 'lucide-react';
import { PILLARS as REGISTRY } from '../../content/mlContent';
import { GROUPS } from '../../content/mlGroups';
import ForgeThumb from './forge/ForgeThumb';
import './MLHub.css';

const ICONS = { Sigma, Workflow, Brain };

function totalLessons(slugs) {
  return slugs.reduce((acc, slug) => acc + (REGISTRY[slug]?.lessons?.length || 0), 0);
}

export default function MLHub() {
  return (
    <div className="mlhub">
      <header className="mlhub-hero">
        <h1 className="mlhub-title">Lessons</h1>
        <p className="mlhub-sub">How the architectures work — deep nets, attention and transformers, generative models, and RL. For the underlying math, see <Link to="/ml/math" className="mlhub-sub-link">Foundations</Link>.</p>
      </header>

      <section className="mlhub-pillars mlhub-pillars-auto">
        {/* The `foundations` group (Linear Algebra & Calculus) lives in the
            Foundations section (/ml/math); don't duplicate it here in Lessons. */}
        {Object.entries(GROUPS).filter(([groupSlug]) => groupSlug !== 'foundations').map(([groupSlug, g]) => {
          const Icon = ICONS[g.iconName] || Sigma;
          const lessonCount = totalLessons(g.members.map(m => m.slug));
          const moduleCount = g.members.length;
          return (
            <Link
              key={groupSlug}
              to={`/ml/g/${groupSlug}`}
              className="mlhub-pillar mlhub-pillar-group"
            >
              <span className="mlhub-pillar-stripe" aria-hidden="true" />
              <div className="mlhub-pillar-flourish" aria-hidden="true">
                <ForgeThumb seed={g.title} />
              </div>
              <div className="mlhub-pillar-head">
                <span className="mlhub-pillar-iconbox"><Icon size={20} /></span>
                <ArrowRight size={16} className="mlhub-pillar-arrow" />
              </div>
              <h2 className="mlhub-pillar-title">{g.title}</h2>
              <p className="mlhub-pillar-summary">{g.summary}</p>

              <div className="mlhub-pillar-chips">
                <span className="mlhub-chip">
                  <BookOpen size={12} />
                  {lessonCount > 0 ? `${lessonCount} lesson${lessonCount === 1 ? '' : 's'}` : 'planned'}
                </span>
                <span className="mlhub-chip">
                  <Boxes size={12} />
                  {moduleCount} module{moduleCount === 1 ? '' : 's'}
                </span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
