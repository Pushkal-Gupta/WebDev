import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers as HomeIcon,
  BookOpen,
  Map,
  List,
  RotateCcw,
  Terminal,
  TrendingUp,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useProblemsCompact, useAllConceptsCompact, useTopics } from '../lib/queries';
import './CommandPalette.css';

const NAV_COMMANDS = [
  { id: 'nav-roadmap',   label: 'Roadmap',        path: '/',                          icon: Map,         keywords: 'graph topics tree dependencies dsa' },
  { id: 'nav-roadmaps',  label: 'All roadmaps',   path: '/roadmaps',                  icon: HomeIcon,    keywords: 'index tracks blind 75' },
  { id: 'nav-tutorial',  label: 'DSA Tutorial',   path: '/tutorial',                  icon: BookOpen,    keywords: 'syllabus full curriculum gfg tutorial' },
  { id: 'nav-learn',     label: 'Concept library', path: '/learn',                    icon: BookOpen,    keywords: 'concepts deep dives' },
  { id: 'nav-courses',   label: 'Courses',        path: '/courses',                   icon: BookOpen,    keywords: 'python javascript java cpp sql basics lessons' },
  { id: 'nav-visualize', label: 'Visualizations', path: '/visualize',                 icon: BookOpen,    keywords: 'algorithm animation step through binary search bfs' },
  { id: 'nav-assess',    label: 'Assessments',    path: '/assessments',               icon: BookOpen,    keywords: 'timed mini-test topic' },
  { id: 'nav-practice',  label: 'Practice',       path: '/practice',                  icon: List,        keywords: 'problems list filters' },
  { id: 'nav-companies', label: 'Companies',      path: '/company',                   icon: HomeIcon,    keywords: 'interview prep google meta amazon' },
  { id: 'nav-contests',  label: 'Contests',       path: '/contests',                  icon: HomeIcon,    keywords: 'timed virtual contest leaderboard' },
  { id: 'nav-lists',     label: 'My Lists',       path: '/lists',                     icon: List,        keywords: 'custom playlist favorites' },
  { id: 'nav-history',   label: 'Practice history', path: '/history',                 icon: HomeIcon,    keywords: 'submissions log accepted' },
  { id: 'nav-notebook',  label: 'Notebook',       path: '/notebook',                  icon: BookOpen,    keywords: 'notes personal annotations wiki' },
  { id: 'nav-review',    label: 'Review queue',   path: '/review',                    icon: RotateCcw,   keywords: 'spaced repetition revisit' },
  { id: 'nav-progress',  label: 'Progress',       path: '/progress',                  icon: TrendingUp,  keywords: 'stats heatmap mastery achievements' },
  { id: 'nav-achievements', label: 'Achievements', path: '/achievements',             icon: TrendingUp,  keywords: 'badges trophies awards unlocks' },
  { id: 'nav-playground',label: 'Playground',     path: '/playground',                icon: Terminal,    keywords: 'compiler editor code run' },
  { id: 'nav-playground-web', label: 'Web sandbox',  path: '/playground/web', icon: Terminal, keywords: 'html css js iframe live preview' },
  { id: 'nav-playground-sql', label: 'SQL playground', path: '/playground/sql', icon: Terminal, keywords: 'sqlite database query' },
  { id: 'nav-sql-basics', label: 'SQL Basics course', path: '/playground/sql/sql-basics', icon: Terminal, keywords: 'sql course beginner select join where' },
  { id: 'nav-sql-usda',  label: 'SQL: USDA project', path: '/playground/sql/usda',   icon: Terminal,    keywords: 'sql course usda cheese milk honey' },
];

function fuzzyMatch(query, target) {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  // simple subsequence match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: problems = [] } = useProblemsCompact();
  const { data: concepts = [] } = useAllConceptsCompact();
  const { data: topics = [] } = useTopics();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim();
    const navResults = NAV_COMMANDS
      .filter(c => fuzzyMatch(q, `${c.label} ${c.keywords}`))
      .map(c => ({ kind: 'nav', ...c }));

    const conceptResults = concepts
      .filter(c => fuzzyMatch(q, c.title))
      .slice(0, 8)
      .map(c => ({
        kind: 'concept',
        id: `concept-${c.slug}`,
        label: c.title,
        sub: c.subtitle,
        path: `/learn/${c.module_slug}/${c.slug}`,
        icon: BookOpen,
      }));

    const topicIndex = {};
    topics.forEach(t => { topicIndex[t.id] = t.id; });

    const problemResults = problems
      .filter(p => fuzzyMatch(q, p.name))
      .slice(0, 10)
      .map(p => ({
        kind: 'problem',
        id: `problem-${p.id}`,
        label: p.name,
        sub: p.topic_id,
        diff: p.difficulty,
        path: `/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`,
        icon: List,
      }));

    if (!q) {
      return [
        { kind: 'group', label: 'Navigate' },
        ...navResults,
      ];
    }

    const out = [];
    if (navResults.length) {
      out.push({ kind: 'group', label: 'Navigate' });
      out.push(...navResults);
    }
    if (conceptResults.length) {
      out.push({ kind: 'group', label: 'Concepts' });
      out.push(...conceptResults);
    }
    if (problemResults.length) {
      out.push({ kind: 'group', label: 'Problems' });
      out.push(...problemResults);
    }
    return out;
  }, [query, concepts, problems, topics]);

  const flatResults = useMemo(() => results.filter(r => r.kind !== 'group'), [results]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(flatResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && flatResults[activeIdx]) {
      e.preventDefault();
      navigate(flatResults[activeIdx].path);
      setOpen(false);
    }
  }, [flatResults, activeIdx, navigate]);

  if (!open) return null;

  let flatCursor = -1;

  return (
    <div className="cmdk-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="cmdk" role="dialog" aria-label="Command palette">
        <div className="cmdk-input-row">
          <Search size={14} className="cmdk-input-icon" />
          <input
            ref={inputRef}
            className="cmdk-input"
            type="text"
            placeholder="Jump to a page, concept, or problem…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
          />
          <span className="cmdk-esc">esc</span>
        </div>

        <div className="cmdk-list">
          {flatResults.length === 0 ? (
            <div className="cmdk-empty">No matches for &ldquo;{query}&rdquo;.</div>
          ) : (
            results.map((r) => {
              if (r.kind === 'group') {
                return <div key={`g-${r.label}`} className="cmdk-group">{r.label}</div>;
              }
              flatCursor++;
              const isActive = flatCursor === activeIdx;
              const Icon = r.icon;
              const itemIdx = flatCursor;
              return (
                <button
                  key={r.id}
                  className={`cmdk-item ${isActive ? 'active' : ''}`}
                  onMouseMove={() => setActiveIdx(itemIdx)}
                  onClick={() => {
                    navigate(r.path);
                    setOpen(false);
                  }}
                >
                  {Icon && <Icon size={14} className="cmdk-item-icon" />}
                  <div className="cmdk-item-body">
                    <span className="cmdk-item-label">{r.label}</span>
                    {r.sub && <span className="cmdk-item-sub">{r.sub}</span>}
                  </div>
                  {r.diff && (
                    <span className={`cmdk-item-diff cmdk-diff-${r.diff.toLowerCase()}`}>{r.diff}</span>
                  )}
                  <ArrowRight size={12} className="cmdk-item-arrow" />
                </button>
              );
            })
          )}
        </div>

        <footer className="cmdk-footer">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </footer>
      </div>
    </div>
  );
}
