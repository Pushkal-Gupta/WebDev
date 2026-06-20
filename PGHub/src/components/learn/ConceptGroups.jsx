import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ArrowRight, ArrowLeft, ChevronRight, Layers } from 'lucide-react';
import { useModules, useAllConceptsCompact } from '../../lib/queries';
import './Learn.css';

const HUE_TOKENS = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

// Derive groups directly from the concept module tree: each top-level module is
// a group, its sub-modules (or itself, if it has none) are the members. Opens a
// group landing page at /concepts/g/:groupSlug listing every concept inside.
function buildModel(modules, concepts) {
  const conceptsByModule = {};
  concepts.forEach((c) => {
    (conceptsByModule[c.module_slug] ||= []).push(c);
  });

  const childrenByParent = {};
  modules.forEach((m) => {
    if (m.parent_slug) (childrenByParent[m.parent_slug] ||= []).push(m);
  });
  Object.values(childrenByParent).forEach((list) =>
    list.sort((a, b) => (a.position ?? 999) - (b.position ?? 999)));

  const topLevel = modules.filter((m) => !m.parent_slug);

  const groups = topLevel.map((m) => {
    const children = childrenByParent[m.slug] || [];
    const members = children.length
      ? children.map((ch) => ({ module: ch, concepts: conceptsByModule[ch.slug] || [] }))
      : [{ module: m, concepts: conceptsByModule[m.slug] || [] }];
    const direct = conceptsByModule[m.slug] || [];
    const total = members.reduce((n, mem) => n + mem.concepts.length, 0)
      + (children.length ? direct.length : 0);
    return { module: m, children, members, total };
  });

  return { groups, byTop: Object.fromEntries(groups.map((g) => [g.module.slug, g])) };
}

export default function ConceptGroups() {
  const { groupSlug } = useParams();
  const { data: modules = [], isLoading: ml } = useModules();
  const { data: concepts = [], isLoading: cl } = useAllConceptsCompact();
  const loading = ml || cl;

  const { groups, byTop } = useMemo(() => buildModel(modules, concepts), [modules, concepts]);

  if (loading) {
    return (
      <div className="learn-container">
        <div className="learn-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (groupSlug) {
    const group = byTop[groupSlug];
    if (!group) {
      return (
        <div className="learn-container">
          <div className="learn-header">
            <h1 className="learn-title">Group not found</h1>
            <p className="learn-sub">No concept group matches "{groupSlug}".</p>
          </div>
          <div className="learn-breadcrumbs">
            <Link to="/concepts">All concept groups</Link>
          </div>
        </div>
      );
    }

    return (
      <div className="learn-container">
        <header className="learn-module-header">
          <nav className="learn-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/concepts">Concept groups</Link>
            <ChevronRight size={12} />
            <span>{group.module.name}</span>
          </nav>
          <h1 className="learn-module-title">{group.module.name}</h1>
          {group.module.description && (
            <p className="learn-module-desc">{group.module.description}</p>
          )}
          <span className="learn-module-count">
            {group.members.length} module{group.members.length === 1 ? '' : 's'} · {group.total} concept{group.total === 1 ? '' : 's'}
          </span>
        </header>

        {group.members.map((mem) => (
          <section key={mem.module.slug} className="learn-group">
            <h2 className="learn-group-title">
              <Layers size={14} />
              {mem.module.name}
              <span className="learn-group-count">({mem.concepts.length})</span>
            </h2>
            {mem.concepts.length === 0 ? (
              <p className="learn-sub">No concepts here yet.</p>
            ) : (
              <ul className="learn-concept-list">
                {mem.concepts.map((c, i) => (
                  <li key={c.slug}>
                    <Link to={`/learn/${c.module_slug}/${c.slug}`} className="learn-concept-row">
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
          </section>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="learn-container">
        <div className="learn-empty">
          <BookOpen size={32} className="learn-empty-icon" />
          <h2 className="learn-empty-title">No groups yet</h2>
          <p className="learn-empty-sub">Concept modules land here as they go live.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-container">
      <header className="learn-header">
        <Link to="/learning" className="learn-crumb">
          <ArrowLeft size={13} /> <span>Learning</span>
          <span className="learn-crumb-sep">/</span>
          <span className="learn-crumb-here">Concept groups</span>
        </Link>
        <h1 className="learn-title">Concept groups</h1>
        <p className="learn-sub">Pick a topic area — each opens every concept inside it on one page.</p>
      </header>

      <div className="learn-module-grid">
        {groups.map((g, i) => (
          <Link
            key={g.module.slug}
            to={`/concepts/g/${g.module.slug}`}
            className="learn-module-card"
            style={{ '--card-accent': HUE_TOKENS[i % HUE_TOKENS.length] }}
          >
            <div className="learn-module-card-head">
              <span className="learn-module-card-num">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="learn-module-card-title">{g.module.name}</h2>
            </div>
            {g.module.description && <p className="learn-module-card-desc">{g.module.description}</p>}
            <div className="learn-module-card-foot">
              <span className="learn-module-card-count">
                {g.children.length > 0 ? `${g.children.length} sub-modules · ` : ''}
                {g.total} concept{g.total === 1 ? '' : 's'}
              </span>
              <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
