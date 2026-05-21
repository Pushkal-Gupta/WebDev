import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ArrowRight, ChevronRight } from 'lucide-react';
import { useModules, useAllConceptsCompact } from '../../lib/queries';
import './Learn.css';

export default function LearnIndex({ session: _session }) {
  const { moduleSlug } = useParams();
  const { data: modules = [], isLoading: modulesLoading } = useModules();
  const { data: concepts = [], isLoading: conceptsLoading } = useAllConceptsCompact();

  const conceptsByModule = useMemo(() => {
    const m = {};
    concepts.forEach(c => {
      if (!m[c.module_slug]) m[c.module_slug] = [];
      m[c.module_slug].push(c);
    });
    return m;
  }, [concepts]);

  const activeModule = useMemo(() => modules.find(m => m.slug === moduleSlug), [modules, moduleSlug]);
  const loading = modulesLoading || conceptsLoading;

  if (loading) {
    return (
      <div className="learn-container">
        <div className="learn-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="learn-container">
        <div className="learn-empty">
          <BookOpen size={32} className="learn-empty-icon" />
          <h2 className="learn-empty-title">Library is empty</h2>
          <p className="learn-empty-sub">
            No modules have been published yet. Check back soon — concepts are landing weekly.
          </p>
        </div>
      </div>
    );
  }

  // Single-module view
  if (activeModule) {
    const moduleConcepts = conceptsByModule[activeModule.slug] || [];
    return (
      <div className="learn-container">
        <header className="learn-module-header">
          <nav className="learn-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/learn">Learn</Link>
            <ChevronRight size={12} />
            <span>{activeModule.name}</span>
          </nav>
          <h1 className="learn-module-title">{activeModule.name}</h1>
          {activeModule.description && (
            <p className="learn-module-desc">{activeModule.description}</p>
          )}
          <span className="learn-module-count">{moduleConcepts.length} concept{moduleConcepts.length === 1 ? '' : 's'}</span>
        </header>

        {moduleConcepts.length === 0 ? (
          <div className="learn-empty">
            <p className="learn-empty-sub">
              No published concepts in this module yet. Drop markdown into <code>content/concepts/</code> and re-run the
              import script.
            </p>
          </div>
        ) : (
          <ul className="learn-concept-list">
            {moduleConcepts.map((c, i) => (
              <li key={c.slug}>
                <Link to={`/learn/${activeModule.slug}/${c.slug}`} className="learn-concept-row">
                  <span className="learn-concept-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="learn-concept-body">
                    <span className="learn-concept-title">{c.title}</span>
                    {c.subtitle && <span className="learn-concept-subtitle">{c.subtitle}</span>}
                  </div>
                  {c.difficulty && (
                    <span className={`learn-concept-diff learn-concept-diff-${c.difficulty.toLowerCase()}`}>
                      {c.difficulty}
                    </span>
                  )}
                  <ArrowRight size={14} className="learn-concept-arrow" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Module index
  return (
    <div className="learn-container">
      <header className="learn-header">
        <h1 className="learn-title">Learn</h1>
        <p className="learn-sub">
          Concept library covering the integrated DSA + algorithms syllabus. Each concept includes intuition,
          complexity, code in multiple languages, and linked practice problems.
        </p>
      </header>

      <div className="learn-module-grid">
        {modules.map(m => {
          const count = (conceptsByModule[m.slug] || []).length;
          return (
            <Link key={m.slug} to={`/learn/${m.slug}`} className="learn-module-card">
              <div className="learn-module-card-head">
                <span className="learn-module-card-num">{String(m.position).padStart(2, '0')}</span>
                <h2 className="learn-module-card-title">{m.name}</h2>
              </div>
              {m.description && <p className="learn-module-card-desc">{m.description}</p>}
              <div className="learn-module-card-foot">
                <span className="learn-module-card-count">{count} concept{count === 1 ? '' : 's'}</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
