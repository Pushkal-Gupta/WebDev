import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Star, Code2, ExternalLink, Lightbulb, Search, X, ChevronDown, SlidersHorizontal, FilterX, Shuffle, Clock, ArrowLeft, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProblemPage, useTopics, useUserProgress, useLists, useListProblemIds, qk } from '../lib/queries';
import { legacyToStatus } from '../lib/status';
import { primaryTopicLabel, fullTopicLabel } from '../lib/topicLabel';
import './ProblemList.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// Hash a topic id into one of 6 cycling hue classes so similar topics get a
// consistent subtle color across the table without hardcoding per-topic palettes.
const TOPIC_HUE_COUNT = 6;
function topicHueIndex(id) {
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % TOPIC_HUE_COUNT;
}

function FilterDropdown({ label, value, options, onChange, minWidth = 160 }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="pl-dd-wrap" ref={wrapRef} style={{ minWidth }}>
      <button
        type="button"
        className={`pl-dd-btn ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="pl-dd-label">{label}</span>
        <span className="pl-dd-value">{selected?.label}</span>
        <ChevronDown size={13} className={`pl-dd-chevron ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="pl-dd-menu">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`pl-dd-item ${opt.value === value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Practice is intentionally NOT scoped by roadmapMode — it shows the full
// catalog (3000+ problems) like LeetCode's problem table. The roadmapMode
// control only affects the /roadmap visualization.
export default function ProblemList({ session }) {
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const { data: rawTopics, isLoading: topicsLoading } = useTopics();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: lists = [] } = useLists();

  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState(new Set(['Easy', 'Medium', 'Hard']));
  const [statusFilter, setStatusFilter] = useState('all');
  const [listFilter, setListFilter] = useState('all');
  const [sortBy, setSortBy] = useState('topic');
  const [pulseMap, setPulseMap] = useState({});
  const [practiceSet, setPracticeSet] = useState(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 100;

  const { data: listProblemIds } = useListProblemIds(listFilter);

  // Server-side pagination: Postgres filters/sorts/slices, we render only the
  // visible page. Filter changes reset to page 0 via a render-time signature.
  const diffArray = useMemo(
    () => (diffFilter.size === 3 ? null : [...diffFilter]),
    [diffFilter],
  );
  const filterSig = `${search}|${topicFilter}|${[...diffFilter].sort().join(',')}|${sortBy}`;
  const [lastSig, setLastSig] = useState(filterSig);
  if (lastSig !== filterSig) {
    setLastSig(filterSig);
    setPage(0);
  }

  const { data: pageData, isLoading: problemsLoading, isFetching } = useProblemPage({
    page,
    pageSize: PAGE_SIZE,
    topicId: topicFilter === 'all' ? null : topicFilter,
    difficulty: diffArray,
    search,
    sort: sortBy,
  });
  const rawProblems = useMemo(() => pageData?.rows || [], [pageData]);
  const totalServer = pageData?.total || 0;

  const topics = useMemo(() => (rawTopics || []).filter(t => t.id !== 'first-order'), [rawTopics]);
  const userProgress = useMemo(() => progressBundle?.byId || {}, [progressBundle]);
  const loading = (problemsLoading && !pageData) || topicsLoading;

  const topicNameMap = useMemo(() => {
    const map = {};
    topics.forEach(t => { map[t.id] = primaryTopicLabel(t.name); });
    return map;
  }, [topics]);

  const topicFullMap = useMemo(() => {
    const map = {};
    topics.forEach(t => { map[t.id] = fullTopicLabel(t.name); });
    return map;
  }, [topics]);

  const topicOptions = useMemo(() => [
    { value: 'all', label: 'All Topics' },
    ...topics.map(t => ({ value: t.id, label: primaryTopicLabel(t.name) })),
  ], [topics]);

  const statusOptions = [
    { value: 'all',            label: 'All Status' },
    { value: 'not_started',    label: 'Not Started' },
    { value: 'attempted',      label: 'Attempted' },
    { value: 'solved',         label: 'Solved' },
    { value: 'mastered',       label: 'Mastered' },
    { value: 'bookmarked',     label: 'Bookmarked' },
    { value: 'needs_revision', label: 'Needs Revision' },
  ];

  const listOptions = useMemo(() => [
    { value: 'all', label: 'All problems' },
    ...lists.map(l => ({ value: l.slug, label: l.name })),
  ], [lists]);

  const sortOptions = [
    { value: 'topic', label: 'Topic' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'name', label: 'Name' },
  ];

  const toggleDiff = (diff) => {
    setDiffFilter(prev => {
      const next = new Set(prev);
      if (next.has(diff)) {
        if (next.size > 1) next.delete(diff);
      } else {
        next.add(diff);
      }
      return next;
    });
  };

  const hasActiveFilters =
    search !== '' ||
    topicFilter !== 'all' ||
    statusFilter !== 'all' ||
    listFilter !== 'all' ||
    diffFilter.size !== 3;

  const resetFilters = () => {
    setSearch('');
    setTopicFilter('all');
    setStatusFilter('all');
    setListFilter('all');
    setDiffFilter(new Set(DIFFICULTIES));
  };

  // Build a 10-problem topic-mixed practice set. Picks from the current
  // visible problem pool (so filters narrow the source) when filters are
  // active, otherwise from the entire catalog. Mix targets 5 Easy / 3 Medium
  // / 2 Hard and fills any shortfall from the remaining pool. Replaces the
  // old standalone /assessments flow. Re-derives the visible pool inline
  // instead of reading filteredProblems so the compiler doesn't trip on a
  // forward-reference closure.
  const generatePracticeSet = () => {
    // Source pool is the currently-rendered page when filters are active, or
    // the current page's rows otherwise. Since pages are server-paginated, we
    // pick from what's loaded; the user can re-roll on different pages to vary.
    const sourcePool = rawProblems.filter(p => {
      if (listProblemIds && !listProblemIds.has(p.id)) return false;
      if (statusFilter !== 'all') {
        const status = legacyToStatus(userProgress[p.id]);
        if (status !== statusFilter) return false;
      }
      return true;
    });
    if (sourcePool.length === 0) return;
    const pick = (pool, n) => {
      const copy = [...pool];
      const out = [];
      while (out.length < n && copy.length > 0) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
      }
      return out;
    };
    const easyPool = sourcePool.filter(p => p.difficulty === 'Easy');
    const medPool  = sourcePool.filter(p => p.difficulty === 'Medium');
    const hardPool = sourcePool.filter(p => p.difficulty === 'Hard');
    const picked = [
      ...pick(easyPool, 5),
      ...pick(medPool, 3),
      ...pick(hardPool, 2),
    ];
    if (picked.length < 10) {
      const taken = new Set(picked.map(p => p.id));
      const filler = sourcePool.filter(p => !taken.has(p.id));
      picked.push(...pick(filler, 10 - picked.length));
    }
    if (picked.length === 0) return;
    setPracticeSet({
      problems: picked,
      scope: hasActiveFilters ? 'filtered' : 'catalog',
    });
  };

  // Trigger a brief CSS animation on the affected icon. Cleared after the
  // animation finishes so re-clicks restart the pulse.
  const triggerPulse = (key) => {
    setPulseMap(prev => ({ ...prev, [key]: Date.now() }));
    setTimeout(() => {
      setPulseMap(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 380);
  };

  const progressMutation = useMutation({
    mutationFn: async ({ problemId, patch }) => {
      const current = userProgress[problemId] || {};
      const next = {
        user_id: userId,
        problem_id: problemId,
        is_completed: current.is_completed ?? false,
        is_starred: current.is_starred ?? false,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('PGcode_user_progress').upsert(next);
      if (error) throw error;
      return next;
    },
    onMutate: async ({ problemId, patch }) => {
      const key = qk.userProgress(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old) => {
        const rows = old?.rows ? [...old.rows] : [];
        const byId = { ...(old?.byId || {}) };
        const existing = byId[problemId] || { problem_id: problemId, user_id: userId };
        const merged = { ...existing, ...patch };
        byId[problemId] = merged;
        const idx = rows.findIndex(r => r.problem_id === problemId);
        if (idx >= 0) rows[idx] = merged; else rows.push(merged);
        return { rows, byId };
      });
      return { prev, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.userProgress(userId) });
    },
  });

  const toggleComplete = (problemId) => {
    if (!userId || progressMutation.isPending) return;
    const current = userProgress[problemId];
    const nextCompleted = !current?.is_completed;
    triggerPulse(`c-${problemId}`);
    progressMutation.mutate({
      problemId,
      patch: {
        is_completed: nextCompleted,
        status: nextCompleted ? 'solved' : (current?.is_starred ? 'bookmarked' : 'attempted'),
        status_changed_at: new Date().toISOString(),
      },
    });
  };

  const toggleStar = (problemId) => {
    if (!userId || progressMutation.isPending) return;
    const current = userProgress[problemId];
    triggerPulse(`s-${problemId}`);
    progressMutation.mutate({ problemId, patch: { is_starred: !current?.is_starred } });
  };


  // Server already filtered by topic / difficulty / search / sort. Only the
  // status filter and list-membership filter remain client-side because both
  // depend on per-user data that lives outside `PGcode_problems`.
  const filteredProblems = useMemo(() => {
    return rawProblems.filter(p => {
      if (listProblemIds && !listProblemIds.has(p.id)) return false;
      if (statusFilter !== 'all') {
        const prog = userProgress[p.id];
        const status = legacyToStatus(prog);
        if (status !== statusFilter) return false;
      }
      return true;
    });
  }, [rawProblems, statusFilter, userProgress, listProblemIds]);

  const stats = useMemo(() => {
    const solved = Object.values(userProgress).filter(p => p?.is_completed).length;
    return { total: totalServer, solved };
  }, [totalServer, userProgress]);

  const visibleProblems = filteredProblems;
  const totalPages = Math.max(1, Math.ceil(totalServer / PAGE_SIZE));
  const showingFrom = totalServer === 0 ? 0 : page * PAGE_SIZE + 1;
  const showingTo = Math.min(totalServer, (page + 1) * PAGE_SIZE);

  if (loading) {
    return (
      <div className="pl-container">
        <div className="pl-header-section">
          <div className="skel skel-title" />
          <div className="skel skel-bar" />
        </div>
        <div className="pl-skeleton-rows">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skel skel-row" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pl-container">
      <div className="pl-header-section">
        <div className="pl-title-row">
          <div className="pl-title-block">
            <h1 className="pl-title">All Problems</h1>
            <span className="pl-title-sub">
              <strong>{stats.solved}</strong>
              <span className="pl-stats-sep">/</span>
              <span>{stats.total}</span>
              <span className="pl-stats-label">solved</span>
            </span>
          </div>
          <div className="pl-title-actions">
            <button
              type="button"
              className="pl-generate-btn"
              onClick={generatePracticeSet}
              title={hasActiveFilters ? 'Pick 10 random problems from your current filters' : 'Pick 10 random problems from the full catalog'}
            >
              <Shuffle size={13} />
              <span>Generate practice set</span>
            </button>
            {hasActiveFilters && (
              <button className="pl-reset-btn" onClick={resetFilters} title="Clear all filters">
                <FilterX size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="pl-filters">
          <div className="pl-search-wrap">
            <Search size={15} className="pl-search-icon" />
            <input
              type="text"
              className="pl-search"
              placeholder="Search problems..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="pl-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="pl-filter-group">
            <SlidersHorizontal size={13} className="pl-filter-icon" />
            <FilterDropdown
              label="List"
              value={listFilter}
              options={listOptions}
              onChange={setListFilter}
              minWidth={150}
            />
            <FilterDropdown
              label="Topic"
              value={topicFilter}
              options={topicOptions}
              onChange={setTopicFilter}
              minWidth={160}
            />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={setStatusFilter}
              minWidth={140}
            />
            <FilterDropdown
              label="Sort"
              value={sortBy}
              options={sortOptions}
              onChange={setSortBy}
              minWidth={130}
            />
          </div>

          <div className="pl-diff-toggles" role="group" aria-label="Filter by difficulty">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`pl-diff-btn pl-diff-${d.toLowerCase()} ${diffFilter.has(d) ? 'active' : ''}`}
                onClick={() => toggleDiff(d)}
                aria-pressed={diffFilter.has(d)}
              >
                <span className="pl-diff-dot" aria-hidden="true" />
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {practiceSet && (
        <div className="pl-practice-set">
          <header className="pl-practice-head">
            <div className="pl-practice-title-block">
              <h2 className="pl-practice-title">
                <Play size={14} /> Practice set
              </h2>
              <p className="pl-practice-sub">
                {practiceSet.problems.length} problems picked at random
                {practiceSet.scope === 'filtered' ? ' from your current filters' : ' from the catalog'}. Work through them at your own pace — solves sync back automatically.
              </p>
            </div>
            <div className="pl-practice-actions">
              <button
                type="button"
                className="pl-practice-btn"
                onClick={generatePracticeSet}
                title="Roll a new set"
              >
                <Shuffle size={12} /> Re-roll
              </button>
              <button
                type="button"
                className="pl-practice-btn pl-practice-btn-ghost"
                onClick={() => setPracticeSet(null)}
                title="Dismiss this practice set"
              >
                <ArrowLeft size={12} /> Dismiss
              </button>
            </div>
          </header>
          <ol className="pl-practice-list">
            {practiceSet.problems.map((p, i) => {
              const solved = userProgress[p.id]?.is_completed;
              return (
                <li key={p.id} className={`pl-practice-item ${solved ? 'is-solved' : ''}`}>
                  <span className="pl-practice-num">{String.fromCharCode(65 + i)}</span>
                  <Link
                    to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`}
                    className="pl-practice-link"
                  >
                    <span className="pl-practice-name">{p.name}</span>
                    <span className="pl-practice-topic">{topicNameMap[p.topic_id] || p.topic_id}</span>
                  </Link>
                  <span className={`pl-diff-tag pl-diff-${p.difficulty.toLowerCase()}`}>
                    <span className="pl-diff-dot" aria-hidden="true" />
                    {p.difficulty}
                  </span>
                  {solved && <span className="pl-practice-flag"><Clock size={11} /> Done</span>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="pl-table-wrap">
        <div className="pl-table-header">
          <div className="pl-col-status">Done</div>
          <div className="pl-col-name">Problem</div>
          <div className="pl-col-topic">Topic</div>
          <div className="pl-col-diff">Difficulty</div>
          <div className="pl-col-actions">Actions</div>
        </div>

        <div className="pl-table-body">
          {visibleProblems.map(p => {
            const prog = userProgress[p.id] || {};
            const hue = topicHueIndex(p.topic_id);
            const starPulse = pulseMap[`s-${p.id}`] ? 'pl-pulse' : '';
            const checkPulse = pulseMap[`c-${p.id}`] ? 'pl-pulse' : '';
            return (
              <div key={p.id} className="pl-row">
                <div className="pl-col-status">
                  <button
                    type="button"
                    className={`pl-icon-btn pl-check-btn ${prog.is_completed ? 'is-done' : ''} ${checkPulse}`}
                    onClick={() => toggleComplete(p.id)}
                    disabled={!session}
                    aria-label={prog.is_completed ? 'Mark as unsolved' : 'Mark as solved'}
                    title={prog.is_completed ? 'Solved' : 'Mark as solved'}
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
                <div className="pl-col-name">
                  <button
                    type="button"
                    className={`pl-icon-btn pl-star-btn ${prog.is_starred ? 'is-starred' : ''} ${starPulse}`}
                    onClick={() => toggleStar(p.id)}
                    disabled={!session}
                    aria-label={prog.is_starred ? 'Unstar problem' : 'Star problem'}
                    title={prog.is_starred ? 'Starred' : 'Star problem'}
                  >
                    <Star size={15} />
                  </button>
                  <Link
                    to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`}
                    className="pl-problem-link"
                    title={p.name}
                  >
                    {p.name}
                  </Link>
                </div>
                <div className="pl-col-topic">
                  <span
                    className={`pl-topic-pill pl-topic-hue-${hue}`}
                    title={topicFullMap[p.topic_id] || p.topic_id}
                  >
                    {topicNameMap[p.topic_id] || p.topic_id}
                  </span>
                </div>
                <div className="pl-col-diff">
                  <span className={`pl-diff-tag pl-diff-${p.difficulty.toLowerCase()}`}>
                    <span className="pl-diff-dot" aria-hidden="true" />
                    {p.difficulty}
                  </span>
                </div>
                <div className="pl-col-actions">
                  <Link to={`/category/${encodeURIComponent(p.topic_id)}/${encodeURIComponent(p.id)}`} className="pl-action-icon" title="Solve on PGcode" aria-label="Solve on PGcode">
                    <Code2 size={16} />
                  </Link>
                  {p.leetcode_url && (
                    <a href={p.leetcode_url} target="_blank" rel="noopener noreferrer" className="pl-action-icon pl-lc" title="Solve on LeetCode" aria-label="Solve on LeetCode">
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <Link to={`/solution/${p.id}`} className="pl-action-icon pl-sol" title="View Solution" aria-label="View solution">
                    <Lightbulb size={16} />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredProblems.length === 0 && (
            <div className="pl-empty">
              <div className="pl-empty-card">
                <div className="pl-empty-icon-wrap">
                  <Search size={28} />
                </div>
                <p className="pl-empty-title">No problems match your filters</p>
                <p className="pl-empty-sub">
                  Try a different topic, change the difficulty mix, or clear everything to see the full catalog.
                </p>
                <button className="pl-clear-btn" onClick={resetFilters}>
                  <FilterX size={13} />
                  Clear all filters
                </button>
              </div>
            </div>
          )}

        </div>

        <div className="pl-table-footer">
          <span className="pl-count">
            <strong>{showingFrom.toLocaleString()}–{showingTo.toLocaleString()}</strong>
            <span className="pl-count-label">of {totalServer.toLocaleString()} {totalServer === 1 ? 'problem' : 'problems'}</span>
            {isFetching && (
              <span className="pl-count-extra"><span className="pl-count-sep">·</span>loading…</span>
            )}
          </span>

          <div className="pl-pager">
            <button
              type="button"
              className="pl-pager-btn"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label="First page"
            >‹‹</button>
            <button
              type="button"
              className="pl-pager-btn"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
            >‹ Prev</button>
            <span className="pl-pager-info">Page {page + 1} of {totalPages}</span>
            <button
              type="button"
              className="pl-pager-btn"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              aria-label="Next page"
            >Next ›</button>
            <button
              type="button"
              className="pl-pager-btn"
              onClick={() => setPage(totalPages - 1)}
              disabled={page + 1 >= totalPages}
              aria-label="Last page"
            >››</button>
          </div>
        </div>
      </div>
    </div>
  );
}
