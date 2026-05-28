import React, { useMemo, useState, useEffect, useRef, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, ChevronDown, ChevronRight, Search, CheckCircle2, Circle,
  Lock, X, ArrowUp, Menu, ExternalLink, Info, AlertTriangle, Lightbulb,
  Gauge, AlertCircle, Brain, Cog, Target, GitBranch, ListChecks, Wrench,
  ListOrdered,
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

  // Default: every chapter collapsed. User clicks to expand.
  const [collapsed, setCollapsed] = useState(() => new Set(DSA_TUTORIAL.map(s => s.slug)));
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
          Data structures and algorithms, top to bottom. Theory rows open the concept page; problem rows
          open the solver. Items marked <Lock size={11} className="tut-inline-icon" /> are coming soon.
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
  const [expanded, setExpanded] = useState(false);
  if (item.kind === 'topic') {
    const concept = item.conceptSlug
      ? null
      : conceptByName.get(normName(item.label));
    const slug = item.conceptSlug || concept?.slug;
    let moduleSlug = concept?.module_slug;
    if (slug && !moduleSlug) {
      const c = [...conceptByName.values()].find(c => c.slug === slug);
      if (c) moduleSlug = c.module_slug;
    }
    const hasBody = !!item.body;
    const hasLink = !!(slug && moduleSlug);
    return (
      <li className={`tut-item-theory-wrap tut-item-topic-wrap ${expanded ? 'expanded' : ''}`}>
        <button
          type="button"
          className="tut-item tut-item-topic tut-item-theory-button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
        >
          <span className="tut-item-icon">
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </span>
          <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
          <span className="tut-item-kind">topic</span>
        </button>
        {expanded && (
          <div className="tut-theory-body">
            {hasBody && <TheoryBody body={item.body} />}
            {hasLink && (
              <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-theory-readmore">
                <BookOpen size={11} /> Open full concept page
                <ExternalLink size={10} />
              </Link>
            )}
            {!hasBody && !hasLink && (
              <p className="tut-theory-placeholder">
                <Circle size={10} className="tut-inline-icon" />
                See the related concepts above for in-depth coverage.
              </p>
            )}
          </div>
        )}
      </li>
    );
  }
  if (item.kind === 'theory') {
    const concept = item.conceptSlug
      ? null
      : conceptByName.get(normName(item.label));
    const slug = item.conceptSlug || concept?.slug;
    let moduleSlug = concept?.module_slug;
    if (slug && !moduleSlug) {
      const c = [...conceptByName.values()].find(c => c.slug === slug);
      if (c) moduleSlug = c.module_slug;
    }
    const hasBody = !!item.body;
    const hasLink = !!(slug && moduleSlug);

    if (hasBody) {
      return (
        <li className={`tut-item-theory-wrap ${expanded ? 'expanded' : ''}`}>
          <button
            type="button"
            className="tut-item tut-item-theory tut-item-theory-button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
          >
            <span className="tut-item-icon">
              {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            </span>
            <span className="tut-item-label">{highlightLabel(item.label, highlight)}</span>
            <span className="tut-item-kind">theory</span>
          </button>
          {expanded && (
            <div className="tut-theory-body">
              <TheoryBody body={item.body} />
              {hasLink && (
                <Link to={`/learn/${moduleSlug}/${slug}`} className="tut-theory-readmore">
                  <BookOpen size={11} /> Open full concept page
                  <ExternalLink size={10} />
                </Link>
              )}
            </div>
          )}
        </li>
      );
    }

    if (hasLink) {
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

// Renders inline backtick spans as <code>. Splits a string into [text, <code>, text, ...].
function renderInline(text, keyPrefix = '') {
  if (text == null) return null;
  const str = String(text);
  // Token order matters: code first (literal, no further parsing), then links,
  // then bold (**...**) so the single-asterisk italic doesn't eat it, then italic.
  const pattern = /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
  const out = [];
  let last = 0;
  let i = 0;
  let m;
  while ((m = pattern.exec(str)) !== null) {
    if (m.index > last) {
      out.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{str.slice(last, m.index)}</React.Fragment>);
    }
    if (m[1]) {
      out.push(<code key={`${keyPrefix}-c-${i++}`} className="tut-theory-code">{m[1].slice(1, -1)}</code>);
    } else if (m[2]) {
      const linkMatch = /\[([^\]]+)\]\(([^)]+)\)/.exec(m[2]);
      out.push(<a key={`${keyPrefix}-a-${i++}`} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>);
    } else if (m[3]) {
      out.push(<strong key={`${keyPrefix}-b-${i++}`}>{m[3].slice(2, -2)}</strong>);
    } else if (m[4]) {
      out.push(<em key={`${keyPrefix}-i-${i++}`}>{m[4].slice(1, -1)}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < str.length) {
    out.push(<React.Fragment key={`${keyPrefix}-t-${i++}`}>{str.slice(last)}</React.Fragment>);
  }
  return out.length === 0 ? str : out;
}

// Detect a leading callout marker (> Note:, > Warning:, > Tip:) and return parts.
function parseCallout(line) {
  const m = /^>\s*(Note|Warning|Tip|Insight|Caution):\s*(.*)$/i.exec(line.trim());
  if (!m) return null;
  return { kind: m[1].toLowerCase(), text: m[2] };
}

function Callout({ kind, children }) {
  const icon = kind === 'warning' || kind === 'caution'
    ? <AlertTriangle size={13} />
    : kind === 'tip' || kind === 'insight'
      ? <Lightbulb size={13} />
      : <Info size={13} />;
  return (
    <aside className={`tut-callout tut-callout-${kind}`}>
      <span className="tut-callout-icon">{icon}</span>
      <span className="tut-callout-body">{children}</span>
    </aside>
  );
}

// Split a block of text into rendered parts: paragraphs, fenced code blocks (```), and callouts.
function renderBlock(text, keyPrefix) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let buf = [];
  let inFence = false;
  let fenceLang = '';
  let fenceBuf = [];

  const flushBuf = () => {
    if (!buf.length) return;
    const joined = buf.join('\n').trim();
    if (!joined) { buf = []; return; }
    // Split into paragraphs by blank lines we may have left
    joined.split(/\n{2,}/).forEach((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return;
      const callout = parseCallout(trimmed);
      if (callout) {
        out.push(
          <Callout key={`${keyPrefix}-cl-${out.length}-${i}`} kind={callout.kind}>
            {renderInline(callout.text, `${keyPrefix}-cl-${out.length}`)}
          </Callout>
        );
        return;
      }
      out.push(<p key={`${keyPrefix}-p-${out.length}-${i}`}>{renderInline(trimmed, `${keyPrefix}-p-${out.length}`)}</p>);
    });
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = /^```(\w*)\s*$/.exec(line);
    if (fenceMatch) {
      if (inFence) {
        out.push(
          <pre key={`${keyPrefix}-pre-${out.length}`} className={`tut-theory-pre tut-theory-pre-${fenceLang || 'plain'}`}>
            <code>{fenceBuf.join('\n')}</code>
          </pre>
        );
        inFence = false;
        fenceLang = '';
        fenceBuf = [];
      } else {
        flushBuf();
        inFence = true;
        fenceLang = fenceMatch[1] || '';
      }
      continue;
    }
    if (inFence) { fenceBuf.push(line); continue; }
    buf.push(line);
  }
  if (inFence) {
    out.push(
      <pre key={`${keyPrefix}-pre-${out.length}`} className={`tut-theory-pre tut-theory-pre-${fenceLang || 'plain'}`}>
        <code>{fenceBuf.join('\n')}</code>
      </pre>
    );
  }
  flushBuf();
  return out;
}

function ComplexityTable({ complexity }) {
  if (!complexity) return null;
  if (typeof complexity === 'string') {
    return (
      <div className="tut-theory-complexity">
        <span className="tut-theory-cx-label"><Gauge size={11} /> Complexity</span>
        <span className="tut-theory-cx-value">{renderInline(complexity, 'cx-str')}</span>
      </div>
    );
  }
  const rows = [];
  // New canonical shape first, then legacy keys
  if (complexity.time) rows.push(['Time', complexity.time]);
  if (complexity.build) rows.push(['Build', complexity.build]);
  if (complexity.operation) rows.push(['Operation', complexity.operation]);
  if (complexity.best) rows.push(['Best', complexity.best]);
  if (complexity.average) rows.push(['Average', complexity.average]);
  if (complexity.worst) rows.push(['Worst', complexity.worst]);
  if (complexity.space) rows.push(['Space', complexity.space]);
  if (complexity.notes) rows.push(['Notes', complexity.notes]);
  return (
    <div className="tut-theory-cx-card">
      <div className="tut-theory-cx-head">
        <Gauge size={13} />
        <span>Complexity</span>
      </div>
      <table className="tut-theory-cx-table">
        <thead>
          <tr>
            <th className="tut-cx-col-op">Operation</th>
            <th className="tut-cx-col-cost">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className={i % 2 ? 'tut-cx-row-alt' : ''}>
              <td className="tut-cx-op">{k}</td>
              <td className="tut-cx-cost">{renderInline(v, `cxr-${i}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Pattern is "**Name.** Description sentence(s). Fix: remedy." — be liberal so a
// missing "Fix:" still parses; in that case description gets everything.
function parsePitfall(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  // Pull leading **bolded name** off the front
  const nameMatch = /^\*\*([^*]+?)\*\*\.?\s*/.exec(str);
  let name = '';
  let rest = str;
  if (nameMatch) {
    name = nameMatch[1].replace(/\.$/, '').trim();
    rest = str.slice(nameMatch[0].length);
  }
  // Split off the "Fix:" tail (case-insensitive, optional leading dash)
  const fixIdx = rest.search(/\b(?:Fix|Remedy|Solution)\s*:/i);
  let desc = rest;
  let fix = '';
  if (fixIdx >= 0) {
    desc = rest.slice(0, fixIdx).trim();
    fix = rest.slice(fixIdx).replace(/^\s*(?:Fix|Remedy|Solution)\s*:\s*/i, '').trim();
  }
  desc = desc.replace(/\.\s*$/, '').trim();
  return { name, desc, fix };
}

function PitfallList({ items }) {
  if (!items || !items.length) return null;
  return (
    <div className="tut-theory-pitfalls">
      <div className="tut-theory-pitfalls-head">
        <AlertCircle size={13} />
        <span>Pitfalls</span>
        <span className="tut-pitfalls-count">{items.length}</span>
      </div>
      <div className="tut-pitfall-grid">
        {items.map((raw, j) => {
          const parsed = parsePitfall(raw);
          if (!parsed) return null;
          const { name, desc, fix } = parsed;
          return (
            <div key={j} className="tut-pitfall-card">
              <div className="tut-pitfall-head">
                <AlertTriangle size={13} />
                <span>{name || `Pitfall ${j + 1}`}</span>
              </div>
              {desc && (
                <p className="tut-pitfall-desc">{renderInline(desc, `pfd-${j}`)}</p>
              )}
              {fix && (
                <p className="tut-pitfall-fix">
                  <span className="tut-pitfall-fix-label"><Wrench size={11} /> Fix</span>
                  <span className="tut-pitfall-fix-text">{renderInline(fix, `pff-${j}`)}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Map a section heading string to a Lucide icon. Compares by lowercased
// substring so authors don't need to use exact wording.
function headingIconFor(heading) {
  const h = (heading || '').toLowerCase();
  if (h.includes('mental') || h.includes('intuition')) return Brain;
  if (h.includes('canonical') || h.includes('operation') || h.includes('mechanic')) return Cog;
  if (h.includes('when to') || h.includes('use case') || h.includes('reach')) return Target;
  if (h.includes('variant') || h.includes('flavor')) return GitBranch;
  if (h.includes('problem') || h.includes('interview') || h.includes('example')) return ListChecks;
  return ChevronRight;
}

function slugifyHeading(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Right-rail table of contents — sticky on wide screens. Lists every
// section heading of the currently-open body plus Complexity / Pitfalls.
function SectionTOC({ entries, parentId }) {
  const [active, setActive] = useState(entries[0]?.id || null);
  const tocRef = useRef(null);

  useEffect(() => {
    if (!entries.length) return;
    const targets = entries
      .map(e => document.getElementById(`${parentId}-${e.id}`))
      .filter(Boolean);
    if (!targets.length) return;
    const obs = new IntersectionObserver(
      (intersecting) => {
        // Pick the topmost one currently intersecting.
        const visible = intersecting
          .filter(en => en.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id.replace(`${parentId}-`, '');
          setActive(id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 1] },
    );
    targets.forEach(t => obs.observe(t));
    return () => obs.disconnect();
  }, [entries, parentId]);

  if (!entries.length) return null;

  const handleClick = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(`${parentId}-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <aside className="tut-section-toc" ref={tocRef} aria-label="On this page">
      <div className="tut-section-toc-head">
        <ListOrdered size={11} />
        <span>On this page</span>
      </div>
      <ol className="tut-section-toc-list">
        {entries.map((e) => (
          <li
            key={e.id}
            className={active === e.id ? 'is-active' : ''}
          >
            <a href={`#${parentId}-${e.id}`} onClick={handleClick(e.id)}>
              <span className="tut-section-toc-dot" />
              <span className="tut-section-toc-label">{e.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}

function TheoryBody({ body }) {
  // Stable id for anchor / TOC scoping. Each rendered theory body needs its
  // own namespace so multiple expanded items don't collide. Strip colons —
  // CSS / getElementById selectors choke on them.
  const rawId = useId();
  const parentId = `tb${rawId.replace(/:/g, '')}`;

  if (!body) return null;
  if (typeof body === 'string') {
    return <div className="tut-theory-content">{renderBlock(body, 'str')}</div>;
  }

  // Build TOC entry list from structured body. Skip the summary itself.
  const tocEntries = [];
  if (Array.isArray(body.sections)) {
    body.sections.forEach((sec, i) => {
      tocEntries.push({
        id: `sec-${i}-${slugifyHeading(sec.heading)}`,
        label: sec.heading,
      });
    });
  }
  if (body.complexity) tocEntries.push({ id: 'complexity', label: 'Complexity' });
  if (body.pitfalls?.length) tocEntries.push({ id: 'pitfalls', label: 'Pitfalls' });

  return (
    <div className="tut-theory-layout">
      <div className="tut-theory-content">
        {body.summary && (
          <p className="tut-theory-summary">{renderInline(body.summary, 'sum')}</p>
        )}
        {body.sections?.map((sec, i) => {
          const HeadingIcon = headingIconFor(sec.heading);
          const anchor = `${parentId}-sec-${i}-${slugifyHeading(sec.heading)}`;
          return (
            <section
              key={i}
              id={anchor}
              className="tut-theory-section tut-theory-card"
            >
              <div className="tut-theory-card-head">
                <span className="tut-theory-card-icon"><HeadingIcon size={13} /></span>
                <h4 className="tut-theory-heading">{sec.heading}</h4>
              </div>
              <div className="tut-theory-card-body">
                {Array.isArray(sec.body)
                  ? (
                    <ul className="tut-theory-list">
                      {sec.body.map((li, j) => (
                        <li key={j}>{renderInline(li, `sec-${i}-li-${j}`)}</li>
                      ))}
                    </ul>
                  )
                  : renderBlock(sec.body, `sec-${i}`)
                }
              </div>
            </section>
          );
        })}
        {body.complexity && (
          <div id={`${parentId}-complexity`}>
            <ComplexityTable complexity={body.complexity} />
          </div>
        )}
        {body.pitfalls?.length > 0 && (
          <div id={`${parentId}-pitfalls`}>
            <PitfallList items={body.pitfalls} />
          </div>
        )}
      </div>
      <SectionTOC entries={tocEntries} parentId={parentId} />
    </div>
  );
}
