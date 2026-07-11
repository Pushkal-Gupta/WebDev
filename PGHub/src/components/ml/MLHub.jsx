import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Sigma, Workflow, ArrowLeft, ArrowRight, BookOpen, Boxes } from 'lucide-react';
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
      <Link to="/ml" className="learn-crumb">
        <ArrowLeft size={13} />
        <span>PGForge</span>
        <span className="learn-crumb-sep">/</span>
        <span className="learn-crumb-here">Lessons</span>
      </Link>

      <header className="mlhub-hero">
        <h1 className="mlhub-title">Lessons</h1>
        <p className="mlhub-sub">How the architectures work — deep nets, attention and transformers, generative models, and RL. For the underlying math, see <Link to="/ml/math" className="mlhub-sub-link">Foundations</Link>.</p>
      </header>

      <section className="mlhub-pillars mlhub-pillars-auto mlhub-pillars-2">
        {/* The `foundations` group (Linear Algebra & Calculus) lives in the
            Foundations section (/ml/math); don't duplicate it here in Lessons. */}
        {Object.entries(GROUPS).filter(([groupSlug]) => groupSlug !== 'foundations').map(([groupSlug, g], i) => {
          const Icon = ICONS[g.iconName] || Sigma;
          const lessonCount = totalLessons(g.members.map(m => m.slug));
          const moduleCount = g.members.length;
          return (
            <Link
              key={groupSlug}
              to={`/ml/g/${groupSlug}`}
              className="mlhub-pillar mlhub-lesson-card"
            >
              <span className="mlhub-pillar-stripe" aria-hidden="true" />
              <div className="mlhub-lesson-thumb" aria-hidden="true">
                <ForgeThumb seed={groupSlug} index={i} topic={g.title} label={g.title.split(/\s+/)[0]} />
              </div>
              <div className="mlhub-lesson-body">
                <div className="mlhub-lesson-head">
                  <span className="mlhub-pillar-iconbox"><Icon size={16} /></span>
                  <ArrowRight size={16} className="mlhub-pillar-arrow" />
                </div>
                <h2 className="mlhub-lesson-title">{g.title}</h2>
                <p className="mlhub-lesson-summary">{g.summary}</p>

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

                <div className="mlhub-group-modules">
                  {g.members.map(m => {
                    const n = REGISTRY[m.slug]?.lessons?.length || 0;
                    return (
                      <span key={m.slug} className="mlhub-group-chip">
                        {m.label}
                        <span className="mlhub-group-chip-n">{n || '·'}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
