import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ChevronDown, ChevronRight, Search, CheckCircle2, Circle,
  Lock, X, ArrowUp, Menu,
} from 'lucide-react';
import { DSA_TUTORIAL, countTutorialItems, countAll } from '../content/dsaTutorial';
import {
  useProblemsCompact,
  useAllConceptsCompact,
  useUserProgress,
} from '../lib/queries';
import './DsaTutorial.css';

// Normalize names for fuzzy matching against PGcode_problems.name
function normName(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

export default function DsaTutorial({ session }) {
  const userId = session?.user?.id;
  const { data: problemsData = [] } = useProblemsCompact();
  const { data: conceptsData = [] } = useAllConceptsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);

  // Build name → problem index once
  const problemByName = useMemo(() => {
    const m = new Map();
    problemsData.forEach(p => m.set(normName(p.name), p));
    return m;
  }, [problemsData]);
  // Build name → concept slug index for theory items without an explicit slug
  const conceptByName = useMemo(() => {
    const m = new Map();
    conceptsData.forEach(c => m.set(normName(c.title), c));
    return m;
  }, [conceptsData]);

  const totals = useMemo(() => {
    let totalProblems = 0, solved = 0, matched = 0;
    DSA_TUTORIAL.forEach(section => {
      section.subsections.forEach(sub => {
        sub.items.forEach(it => {
          if (it.kind === 'problem') {
            totalProblems++;
            const p = problemByName.get(normName(it.label));
            if (p) {
              matched++;
              if (byId[p.id]?.is_completed) solved++;
            }
          }
        });
      });
    });
    return { totalProblems, solved, matched, totalAll: countAll() };
  }, [problemByName, byId]);

  // Per-section progress for the circular section rail. Each entry: { slug, solved, total, pct }.
  const sectionProgress = useMemo(() => {
    return DSA_TUTORIAL.map(section => {
      let total = 0, done = 0;
      section.subsections.forEach(sub => {
        sub.items.forEach(it => {
          if (it.kind !== 'problem') return;
          total += 1;
          const p = problemByName.get(normName(it.label));
          if (p && byId[p.id]?.is_completed) done += 1;
        });
      });
      return { slug: section.slug, title: section.title, solved: done, total, pct: total ? done / total : 0 };
    });
  }, [problemByName, byId]);

  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();

  // Default: open the first 2 sections so the user sees real content immediately;
  // the rest are collapsed for fast scanning.
  const [collapsed, setCollapsed] = useState(() => new Set(DSA_TUTORIAL.slice(2).map(s => s.slug)));
  // Filter chip: 'all' | 'theory' | 'problems' | 'unsolved'
  const [filterKind, setFilterKind] = useState('all');
  // TOC drawer: hidden by default on every screen so the layout reads as a
  // single content column. Hamburger button reveals.
  const [tocOpen, setTocOpen] = useState(false);
  const toggle = (slug) => setCollapsed(prev => {
    const n = new Set(prev);
    if (n.has(slug)) n.delete(slug); else n.add(slug);
    return n;
  });
  const collapseAll = () => setCollapsed(new Set(DSA_TUTORIAL.map(s => s.slug)));
  const expandAll = () => setCollapsed(new Set());

  const sectionMatches = useMemo(() => {
    if (!q) return null;
    const m = new Map();
    DSA_TUTORIAL.forEach(section => {
      const subs = section.subsections.map(sub => {
        const items = sub.items.filter(it => it.label.toLowerCase().includes(q));
        return items.length ? { ...sub, items } : null;
      }).filter(Boolean);
      if (subs.length || section.title.toLowerCase().includes(q)) {
        m.set(section.slug, subs.length ? subs : section.subsections);
      }
    });
    return m;
  }, [q]);

  // Show-the-back-to-top button after scrolling down
  const containerRef = useRef(null);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setShowTop(el.scrollTop > 600);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (slug) => {
    const target = containerRef.current?.querySelector(`#tut-${slug}`);
    if (target && containerRef.current) {
      containerRef.current.scrollTo({
        top: target.offsetTop - 20,
        behavior: 'smooth',
      });
    }
    // Make sure it's expanded
    setCollapsed(prev => {
      const n = new Set(prev);
      n.delete(slug);
      return n;
    });
  };

  const overallPct = totals.totalProblems ? Math.round((totals.solved / totals.totalProblems) * 100) : 0;

  return (
    <div className="tut-container" ref={containerRef}>
      <header className="tut-header">
        <div className="tut-title-row">
          <h1 className="tut-title"><BookOpen size={20} className="tut-title-icon" /> DSA Tutorial</h1>
          <div className="tut-summary">
            {userId ? (
              <span>{totals.totalAll} items · {DSA_TUTORIAL.length} topics</span>
            ) : (
              <span>{totals.totalAll} items · {DSA_TUTORIAL.length} topics</span>
            )}
          </div>
        </div>
        {userId && (
          <div className="tut-progress">
            <div className="tut-progress-meta">
              <span className="tut-progress-label">Your progress</span>
              <span className="tut-progress-value">
                <strong>{totals.solved}</strong> / {totals.totalProblems} solved
                <span className="tut-progress-pct">· {overallPct}%</span>
              </span>
            </div>
            <div className="tut-progress-bar">
              <div className="tut-progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        )}
        <p className="tut-sub">
          Data structures + algorithms, end to end. Theory rows open the concept page; problem rows open
          the solver. Items marked <Lock size={11} className="tut-inline-icon" /> aren't wired up yet but
          stay in the outline so the curriculum is complete.
        </p>
      </header>

      <div className="tut-controls">
        <div className="tut-search">
          <Search size={13} className="tut-search-icon" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search across the entire syllabus..."
          />
          {search && (
            <button className="tut-search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <X size={12} />
            </button>
          )}
        </div>
        <div className="tut-filters">
          {[
            { id: 'all',      label: 'All' },
            { id: 'theory',   label: 'Theory' },
            { id: 'problems', label: 'Problems' },
            { id: 'unsolved', label: userId ? 'Unsolved' : 'Available' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`tut-filter-chip ${filterKind === f.id ? 'active' : ''}`}
              onClick={() => setFilterKind(f.id)}
            >{f.label}</button>
          ))}
        </div>
        <div className="tut-actions">
          <button onClick={expandAll}>Expand all</button>
          <button onClick={collapseAll}>Collapse all</button>
        </div>
      </div>

      <div className={`tut-body ${tocOpen ? 'with-toc' : ''}`}>
        {tocOpen && (
          <button
            className="tut-toc-overlay"
            aria-label="Close contents"
            onClick={() => setTocOpen(false)}
          />
        )}
        <aside className={`tut-toc ${tocOpen ? 'open' : ''}`}>
          <div className="tut-toc-head">
            <h3 className="tut-toc-title">Contents</h3>
            <button className="tut-toc-close" onClick={() => setTocOpen(false)} aria-label="Close">
              <X size={12} />
            </button>
          </div>
          <ol className="tut-toc-list">
            {DSA_TUTORIAL.map((section, i) => {
              const count = countTutorialItems(section);
              return (
                <li key={section.slug}>
                  <button onClick={() => { scrollToSection(section.slug); setTocOpen(false); }}>
                    <span className="tut-toc-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="tut-toc-name">{section.title}</span>
                    <span className="tut-toc-count">{count}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="tut-main">
          {DSA_TUTORIAL.map((section, sIdx) => {
            const subsections = sectionMatches
              ? sectionMatches.get(section.slug)
              : section.subsections;
            if (!subsections) return null;
            const isCollapsed = collapsed.has(section.slug) && !sectionMatches;
            const total = countTutorialItems(section);
            return (
              <section key={section.slug} id={`tut-${section.slug}`} className="tut-section">
                <header className="tut-section-head" onClick={() => toggle(section.slug)}>
                  <span className="tut-section-num">{String(sIdx + 1).padStart(2, '0')}</span>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <h2 className="tut-section-title">{section.title}</h2>
                  <span className="tut-section-count">{total}</span>
                </header>
                {section.note && !isCollapsed && (
                  <p className="tut-section-note">{section.note}</p>
                )}
                {!isCollapsed && subsections.map(sub => {
                  const visible = sub.items.filter(it => passesFilter(it, filterKind, problemByName, byId));
                  if (visible.length === 0) return null;
                  return (
                    <div key={sub.id} className="tut-subsection">
                      <h3 className="tut-subsection-title">{sub.label}</h3>
                      <ul className="tut-item-list">
                        {visible.map((item, idx) => (
                          <TutorialItem
                            key={`${sub.id}-${idx}`}
                            item={item}
                            problemByName={problemByName}
                            conceptByName={conceptByName}
                            byId={byId}
                            highlight={q}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </main>
      </div>

      {showTop && (
        <button className="tut-back-top" onClick={scrollToTop} aria-label="Back to top">
          <ArrowUp size={14} />
        </button>
      )}

      {/* Right-side circular section rail — fast-access wheel with progress rings */}
      <nav className="tut-rail" aria-label="Sections quick access">
        {sectionProgress.map((sp, i) => {
          const C = 2 * Math.PI * 13;
          const dash = C * sp.pct;
          return (
            <button
              key={sp.slug}
              className={`tut-rail-dot ${sp.pct === 1 ? 'done' : ''}`}
              onClick={() => scrollToSection(sp.slug)}
              title={`${sp.title} — ${sp.solved}/${sp.total} solved`}
              aria-label={`Jump to ${sp.title}, ${sp.solved} of ${sp.total} solved`}
            >
              <svg viewBox="0 0 32 32" className="tut-rail-svg">
                <circle cx="16" cy="16" r="13" className="tut-rail-bg" />
                <circle
                  cx="16" cy="16" r="13"
                  className="tut-rail-fg"
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform="rotate(-90 16 16)"
                />
              </svg>
              <span className="tut-rail-num">{i + 1}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function passesFilter(item, filterKind, problemByName, byId) {
  if (filterKind === 'all') return true;
  if (filterKind === 'theory') return item.kind === 'theory' || item.kind === 'topic';
  if (filterKind === 'problems') return item.kind === 'problem';
  if (filterKind === 'unsolved') {
    if (item.kind !== 'problem') return false;
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    const p = problemByName.get(norm(item.label));
    if (!p) return false;
    return !byId[p.id]?.is_completed;
  }
  return true;
}

function highlightLabel(label, q) {
  if (!q) return label;
  const lower = label.toLowerCase();
  const i = lower.indexOf(q);
  if (i === -1) return label;
  return (
    <>
      {label.slice(0, i)}
      <mark>{label.slice(i, i + q.length)}</mark>
      {label.slice(i + q.length)}
    </>
  );
}

function TutorialItem({ item, problemByName, conceptByName, byId, highlight }) {
  if (item.kind === 'topic') {
    return (
      <li className="tut-item tut-item-topic">
        <span className="tut-item-icon"><Circle size={10} /></span>
        <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
        <span className="tut-item-kind">topic</span>
      </li>
    );
  }
  if (item.kind === 'theory') {
    const concept = item.conceptSlug
      ? null  // we have an explicit slug; render below
      : conceptByName.get(normName(item.label));
    const slug = item.conceptSlug || concept?.slug;
    const moduleSlug = concept?.module_slug;
    if (slug && moduleSlug) {
      return (
        <li className="tut-item tut-item-theory">
          <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-item-link">
            <span className="tut-item-icon"><BookOpen size={11} /></span>
            <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
            <span className="tut-item-kind">theory</span>
          </Link>
        </li>
      );
    }
    if (slug) {
      // We have a concept slug but couldn't infer module. Best-effort fallback:
      // search the conceptByName map for an exact slug match to grab its module.
      const c = [...conceptByName.values()].find(c => c.slug === slug);
      if (c) {
        return (
          <li className="tut-item tut-item-theory">
            <Link to={`/learn/${c.module_slug}/${c.slug}`} className="tut-item-link">
              <span className="tut-item-icon"><BookOpen size={11} /></span>
              <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
              <span className="tut-item-kind">theory</span>
            </Link>
          </li>
        );
      }
    }
    return (
      <li className="tut-item tut-item-theory-soft">
        <span className="tut-item-icon"><BookOpen size={11} /></span>
        <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
        <span className="tut-item-kind">theory · soon</span>
      </li>
    );
  }
  // problem
  const p = item.id
    ? null
    : problemByName.get(normName(item.label));
  if (p) {
    const prog = byId[p.id];
    const solved = prog?.is_completed;
    const attempted = !solved && (prog?.status === 'attempted' || prog?.is_starred);
    const bubbleClass = solved ? 'solved' : (attempted ? 'attempted' : 'todo');
    return (
      <li className={`tut-item ${solved ? 'solved' : ''}`}>
        <Link to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`} className="tut-item-link">
          <span className={`tut-bubble tut-bubble-${bubbleClass}`} aria-label={solved ? 'solved' : attempted ? 'attempted' : 'not started'}>
            {solved && <CheckCircle2 size={9} />}
          </span>
          <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
          <span className={`tut-item-diff tut-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
        </Link>
      </li>
    );
  }
  return (
    <li className="tut-item tut-item-soon">
      <span className="tut-item-icon"><Lock size={10} /></span>
      <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
      <span className="tut-item-kind">soon</span>
    </li>
  );
}
