import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Map,
  List,
  RotateCcw,
  Terminal,
  TrendingUp,
  Search,
  ArrowRight,
  Building2,
  Trophy,
  Shield,
  Shuffle,
  History,
  Eye,
  Network,
  GraduationCap,
  StickyNote,
  Brain,
  Vault,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProblemsCompact, useAllConceptsCompact, useTopics } from '../lib/queries';
import './CommandPalette.css';

const NAV_COMMANDS = [
  { id: 'nav-roadmap',        label: 'PGPath',            path: '/',                          icon: Map,            keywords: 'roadmap path graph topics tree dependencies dsa home' },
  { id: 'nav-roadmaps',       label: 'All roadmaps',      path: '/roadmaps',                  icon: Network,        keywords: 'index tracks blind 75 neetcode path' },
  { id: 'nav-learning',       label: 'Learning',          path: '/learning',                  icon: GraduationCap,  keywords: 'tutorial concepts courses learn syllabus curriculum gfg lessons deep dives' },
  { id: 'nav-tutorial',       label: 'DSA Tutorial',      path: '/tutorial',                  icon: GraduationCap,  keywords: 'syllabus full curriculum gfg tutorial learning' },
  { id: 'nav-learn',          label: 'Concept library',   path: '/learn',                     icon: BookOpen,       keywords: 'concepts deep dives learn learning' },
  { id: 'nav-courses',        label: 'Courses',           path: '/courses',                   icon: BookOpen,       keywords: 'python javascript java cpp sql basics lessons learning' },
  { id: 'nav-ml',             label: 'PGForge',           path: '/ml',                        icon: Brain,          keywords: 'forge ml machine learning deep ai neural attention transformers gradient' },
  { id: 'nav-visualize',      label: 'Visualizations',    path: '/visualize',                 icon: Eye,            keywords: 'algorithm animation step through binary search bfs all visualizations' },
  { id: 'nav-practice',       label: 'Practice',          path: '/practice',                  icon: List,           keywords: 'problems list filters assess timed mini-test topic generate practice set' },
  { id: 'nav-companies',      label: 'Companies',         path: '/company',                   icon: Building2,      keywords: 'interview prep google meta amazon' },
  { id: 'nav-compete',        label: 'PGBattle',          path: '/compete',                   icon: Trophy,         keywords: 'launch compete leetcode profile compare rating contest analytics dashboard' },
  { id: 'nav-contests',       label: 'Contests',          path: '/contests',                  icon: Trophy,         keywords: 'timed virtual contest leaderboard launch compete' },
  { id: 'nav-vault',          label: 'PGVault',           path: '/vault',                     icon: Vault,          keywords: 'vault review lists notes notebook progress saved bookmarks revision activity' },
  { id: 'nav-lists',          label: 'My Lists',          path: '/lists',                     icon: List,           keywords: 'custom playlist favorites vault' },
  { id: 'nav-history',        label: 'Practice history',  path: '/progress?tab=history',      icon: History,        keywords: 'submissions log accepted attempts vault' },
  { id: 'nav-notebook',       label: 'Notebook',          path: '/notebook',                  icon: StickyNote,     keywords: 'notes personal annotations wiki vault' },
  { id: 'nav-review',         label: 'Review queue',      path: '/review',                    icon: RotateCcw,      keywords: 'spaced repetition revisit vault' },
  { id: 'nav-progress',       label: 'Your activity',     path: '/progress',                  icon: TrendingUp,     keywords: 'stats heatmap mastery achievements progress dashboard vault' },
  { id: 'nav-achievements',   label: 'Achievements',      path: '/progress?tab=achievements', icon: Trophy,         keywords: 'badges trophies awards unlocks' },
  { id: 'nav-playground',     label: 'PGLab',             path: '/playground',                icon: Terminal,       keywords: 'lab playground compiler editor code run scratch' },
  { id: 'nav-playground-web', label: 'Web sandbox',       path: '/playground/web',            icon: Terminal,       keywords: 'html css js iframe live preview' },
  { id: 'nav-playground-sql', label: 'SQL playground',    path: '/playground/sql',            icon: Terminal,       keywords: 'sqlite database query' },
  { id: 'nav-sql-basics',     label: 'SQL Basics course', path: '/courses/sql-basics',        icon: BookOpen,       keywords: 'sql course beginner select join where' },
  { id: 'nav-sql-usda',       label: 'SQL: USDA project', path: '/playground/sql/usda',       icon: BookOpen,       keywords: 'sql course usda cheese milk honey project' },
  { id: 'nav-sql-chinook',    label: 'SQL sample: Chinook',    path: '/playground/sql/chinook',    icon: Terminal, keywords: 'sql sample music store artists albums tracks' },
  { id: 'nav-sql-sakila',     label: 'SQL sample: Sakila',     path: '/playground/sql/sakila',     icon: Terminal, keywords: 'sql sample movie rental films actors' },
  { id: 'nav-sql-world',      label: 'SQL sample: World',      path: '/playground/sql/world',      icon: Terminal, keywords: 'sql sample countries cities languages geography' },
  { id: 'nav-sql-ecommerce',  label: 'SQL sample: E-commerce', path: '/playground/sql/ecommerce',  icon: Terminal, keywords: 'sql sample orders products customers reviews' },
  { id: 'nav-admin-completeness', label: 'Admin: problem completeness audit', path: '/admin/completeness', icon: Shield, keywords: 'admin completeness audit quality metadata coverage' },
];

// Score a candidate against the query. Higher is better, 0 = no match.
// Bias hard toward label matches; treat the keyword blob as a weak tiebreaker
// only — the previous subsequence-only matcher returned wildly off-topic hits
// (typing "history" surfaced /visualize because h-i-s-t-o-r-y subsequence-matched
// one of its keywords).
function scoreMatch(query, label, keywords) {
  if (!query) return 1;
  const q = query.toLowerCase();
  const l = (label || '').toLowerCase();
  const k = (keywords || '').toLowerCase();

  if (l === q) return 1000;
  if (l.startsWith(q)) return 800 - (l.length - q.length);
  const labelIdx = l.indexOf(q);
  if (labelIdx >= 0) return 600 - labelIdx;
  // Whole-word match inside the keyword blob.
  const kwHit = new RegExp(`(?:^|\\s)${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(k);
  if (kwHit) return 400;
  // Subsequence in label only (still meaningful, e.g. "vis" → "Visualizations").
  let qi = 0;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 200 - (l.length - q.length);
  return 0;
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
        return;
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        return;
      }
      // "/" focuses the palette (skip when the user is already typing in a field
      // or has a modifier held — that would hijack browser shortcuts).
      if (
        e.key === '/' &&
        !open &&
        !e.metaKey && !e.ctrlKey && !e.altKey
      ) {
        const t = e.target;
        const tag = t?.tagName;
        const isEditable =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          t?.isContentEditable ||
          // Monaco editor renders text in a hidden textarea inside .monaco-editor
          t?.closest?.('.monaco-editor');
        if (isEditable) return;
        e.preventDefault();
        setOpen(true);
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

  const runRandomUnsolved = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (uid) {
      const { data } = await supabase.rpc('pgcode_random_unsolved', { uid, diff: null });
      if (data?.problem_id) {
        navigate(`/category/${encodeURIComponent(data.topic_id)}/${encodeURIComponent(data.problem_id)}`);
        return;
      }
    }
    // Anon or RPC returned nothing — pick from the loaded problem list.
    if (problems.length) {
      const p = problems[Math.floor(Math.random() * problems.length)];
      navigate(`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`);
    } else {
      navigate('/practice');
    }
  }, [navigate, problems]);

  const ACTION_COMMANDS = useMemo(() => ([
    {
      id: 'action-random-unsolved',
      label: 'Open a random unsolved problem',
      icon: Shuffle,
      keywords: 'feeling lucky random surprise me roll',
      run: runRandomUnsolved,
    },
  ]), [runRandomUnsolved]);

  const results = useMemo(() => {
    const q = query.trim();

    const navRanked = NAV_COMMANDS
      .map(c => ({ c, score: scoreMatch(q, c.label, c.keywords) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ c }) => ({ kind: 'nav', ...c }));

    const actionRanked = ACTION_COMMANDS
      .map(c => ({ c, score: scoreMatch(q, c.label, c.keywords) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ c }) => ({ kind: 'action', ...c }));

    const conceptResults = concepts
      .map(c => ({ c, score: scoreMatch(q, c.title, c.subtitle) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(({ c }) => ({
        kind: 'concept',
        id: `concept-${c.slug}`,
        label: c.title,
        sub: c.subtitle,
        path: `/learn/${c.module_slug}/${c.slug}`,
        icon: BookOpen,
      }));

    void topics;

    const problemResults = problems
      .map(p => ({ p, score: scoreMatch(q, p.name, '') }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ p }) => ({
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
        { kind: 'group', label: 'Quick actions' },
        ...actionRanked,
        { kind: 'group', label: 'Navigate' },
        ...navRanked,
      ];
    }

    const out = [];
    if (actionRanked.length) {
      out.push({ kind: 'group', label: 'Actions' });
      out.push(...actionRanked);
    }
    if (navRanked.length) {
      out.push({ kind: 'group', label: 'Navigate' });
      out.push(...navRanked);
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
  }, [query, concepts, problems, topics, ACTION_COMMANDS]);

  const flatResults = useMemo(() => results.filter(r => r.kind !== 'group'), [results]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const runItem = useCallback((item) => {
    if (!item) return;
    if (item.kind === 'action' && typeof item.run === 'function') {
      item.run();
    } else if (item.path) {
      navigate(item.path);
    }
    setOpen(false);
  }, [navigate]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(flatResults.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && flatResults[activeIdx]) {
      e.preventDefault();
      runItem(flatResults[activeIdx]);
    }
  }, [flatResults, activeIdx, runItem]);

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
                  onClick={() => runItem(r)}
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
