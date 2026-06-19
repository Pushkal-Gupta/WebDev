import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ArrowRight, ChevronRight, Layers, ArrowLeft } from 'lucide-react';
import { useModules, useAllConceptsCompact } from '../../lib/queries';
import ForgeThumb from '../ml/forge/ForgeThumb';
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

  const childrenByParent = useMemo(() => {
    const m = {};
    modules.forEach(mod => {
      if (mod.parent_slug) {
        if (!m[mod.parent_slug]) m[mod.parent_slug] = [];
        m[mod.parent_slug].push(mod);
      }
    });
    Object.values(m).forEach(list =>
      list.sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
    );
    return m;
  }, [modules]);

  const topLevelModules = useMemo(
    () => modules.filter(m => !m.parent_slug),
    [modules]
  );

  const activeModule = useMemo(() => modules.find(m => m.slug === moduleSlug), [modules, moduleSlug]);
  const activeChildren = activeModule ? (childrenByParent[activeModule.slug] || []) : [];
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
            No modules here yet.
          </p>
        </div>
      </div>
    );
  }

  // Single-module view
  if (activeModule) {
    const moduleConcepts = conceptsByModule[activeModule.slug] || [];
    const isParent = activeChildren.length > 0;

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
          <span className="learn-module-count">
            {isParent
              ? `${activeChildren.length} sub-module${activeChildren.length === 1 ? '' : 's'}`
              : `${moduleConcepts.length} concept${moduleConcepts.length === 1 ? '' : 's'}`}
          </span>
        </header>

        {isParent ? (
          <div className="learn-submodule-grid">
            {activeChildren.map(child => {
              const count = (conceptsByModule[child.slug] || []).length;
              return (
                <Link key={child.slug} to={`/learn/${child.slug}`} className="learn-submodule-card">
                  <div className="learn-submodule-card-head">
                    <Layers size={14} className="learn-submodule-card-icon" />
                    <h3 className="learn-submodule-card-title">{child.name}</h3>
                  </div>
                  {child.description && (
                    <p className="learn-submodule-card-desc">{child.description}</p>
                  )}
                  <div className="learn-submodule-card-foot">
                    <span className="learn-submodule-card-count">
                      {count} concept{count === 1 ? '' : 's'}
                    </span>
                    <ArrowRight size={13} />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : moduleConcepts.length === 0 ? (
          <div className="learn-empty">
            <p className="learn-empty-sub">
              No concepts here yet.
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

  // Module index — flat grid of top-level modules. Parents with children render
  // expanded full-width with their sub-modules visible inline.
  return (
    <div className="learn-container">
      <header className="learn-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Concepts</span>
        </Link>
        <h1 className="learn-title">Concepts</h1>
        <p className="learn-sub">Every DS/algo you'll need — intuition, complexity, four-language code.</p>
      </header>

      <div className="learn-module-grid">
        {topLevelModules.map((m, mIdx) => {
          const children = childrenByParent[m.slug] || [];
          const directCount = (conceptsByModule[m.slug] || []).length;
          const displayNum = String(mIdx + 1).padStart(2, '0');

          if (children.length > 0) {
            const totalConcepts = children.reduce(
              (sum, ch) => sum + (conceptsByModule[ch.slug] || []).length,
              directCount
            );
            return (
              <section key={m.slug} className="learn-module-card learn-module-card-parent">
                <div className="learn-module-card-head">
                  <span className="learn-module-card-num">{displayNum}</span>
                  <h2 className="learn-module-card-title">{m.name}</h2>
                </div>
                {m.description && <p className="learn-module-card-desc">{m.description}</p>}

                <div className="learn-module-child-grid">
                  {children.map(child => {
                    const count = (conceptsByModule[child.slug] || []).length;
                    return (
                      <Link
                        key={child.slug}
                        to={`/learn/${child.slug}`}
                        className="learn-module-child-card"
                      >
                        <div className="learn-module-child-head">
                          <Layers size={12} className="learn-module-child-icon" />
                          <span className="learn-module-child-title">{child.name}</span>
                        </div>
                        {child.description && (
                          <p className="learn-module-child-desc">{child.description}</p>
                        )}
                        <div className="learn-module-child-foot">
                          <span>{count} concept{count === 1 ? '' : 's'}</span>
                          <ArrowRight size={11} />
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="learn-module-card-foot">
                  <span className="learn-module-card-count">
                    {children.length} sub-modules · {totalConcepts} concepts
                  </span>
                  <Link to={`/learn/${m.slug}`} className="learn-module-card-viewall">
                    View all <ArrowRight size={12} />
                  </Link>
                </div>
              </section>
            );
          }

          return (
            <Link key={m.slug} to={`/learn/${m.slug}`} className="learn-module-card learn-module-card-thumbed">
              <div className="learn-module-card-thumb" aria-hidden="true">
                <ForgeThumb seed={m.name} />
              </div>
              <div className="learn-module-card-head">
                <span className="learn-module-card-num">{displayNum}</span>
                <h2 className="learn-module-card-title">{m.name}</h2>
              </div>
              {m.description && <p className="learn-module-card-desc">{m.description}</p>}
              <div className="learn-module-card-foot">
                <span className="learn-module-card-count">{directCount} concept{directCount === 1 ? '' : 's'}</span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
