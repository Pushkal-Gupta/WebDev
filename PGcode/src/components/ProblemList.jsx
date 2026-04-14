import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Star, Code2, ExternalLink, Lightbulb, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ProblemList.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const difficultyOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };

const topicLabel = (raw) => (raw || '').split(/\\n|\n/)[0].trim();
const topicFullText = (raw) => (raw || '').replace(/\\n/g, ' — ').replace(/\n/g, ' — ').trim();

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

export default function ProblemList({ session, roadmapMode }) {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState(new Set(['Easy', 'Medium', 'Hard']));
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('topic');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [problemsRes, topicsRes, progressRes] = await Promise.all([
          supabase.from('PGcode_problems').select('id, name, topic_id, difficulty, roadmap_set, leetcode_url'),
          supabase.from('PGcode_topics').select('id, name').neq('id', 'first-order'),
          session?.user
            ? supabase.from('PGcode_user_progress').select('problem_id, is_completed, is_starred').eq('user_id', session.user.id)
            : Promise.resolve({ data: null }),
        ]);

        let filtered = (problemsRes.data || []).filter(p => {
          if (roadmapMode === '200') return p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set;
          if (roadmapMode === '300') return p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set;
          return true;
        });

        setProblems(filtered);
        setTopics(topicsRes.data || []);

        if (progressRes.data) {
          const map = {};
          progressRes.data.forEach(p => { map[p.problem_id] = p; });
          setUserProgress(map);
        }
      } catch (err) {
        console.error('Error fetching problems:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [roadmapMode, session]);

  const topicNameMap = useMemo(() => {
    const map = {};
    topics.forEach(t => { map[t.id] = topicLabel(t.name); });
    return map;
  }, [topics]);

  const topicFullMap = useMemo(() => {
    const map = {};
    topics.forEach(t => { map[t.id] = topicFullText(t.name); });
    return map;
  }, [topics]);

  const topicOptions = useMemo(() => [
    { value: 'all', label: 'All Topics' },
    ...topics.map(t => ({ value: t.id, label: topicLabel(t.name) })),
  ], [topics]);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'solved', label: 'Solved' },
    { value: 'unsolved', label: 'Unsolved' },
    { value: 'starred', label: 'Starred' },
  ];

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

  const toggleComplete = async (problemId) => {
    if (!session?.user) { alert('Login to track progress'); return; }
    const current = userProgress[problemId];
    const newVal = !(current?.is_completed);
    const { error } = await supabase.from('PGcode_user_progress').upsert({
      user_id: session.user.id,
      problem_id: problemId,
      is_completed: newVal,
      is_starred: current?.is_starred ?? false,
      updated_at: new Date().toISOString()
    });
    if (error) return;
    setUserProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], is_completed: newVal } }));
  };

  const toggleStar = async (problemId) => {
    if (!session?.user) { alert('Login to star problems'); return; }
    const current = userProgress[problemId];
    const newVal = !(current?.is_starred);
    const { error } = await supabase.from('PGcode_user_progress').upsert({
      user_id: session.user.id,
      problem_id: problemId,
      is_starred: newVal,
      is_completed: current?.is_completed ?? false,
      updated_at: new Date().toISOString()
    });
    if (error) return;
    setUserProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], is_starred: newVal } }));
  };

  const filteredProblems = useMemo(() => {
    let result = problems.filter(p => {
      if (topicFilter !== 'all' && p.topic_id !== topicFilter) return false;
      if (!diffFilter.has(p.difficulty)) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;

      const prog = userProgress[p.id];
      if (statusFilter === 'solved' && !prog?.is_completed) return false;
      if (statusFilter === 'unsolved' && prog?.is_completed) return false;
      if (statusFilter === 'starred' && !prog?.is_starred) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'difficulty') return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (a.topic_id !== b.topic_id) return (a.topic_id || '').localeCompare(b.topic_id || '');
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });

    return result;
  }, [problems, topicFilter, diffFilter, search, statusFilter, sortBy, userProgress]);

  const stats = useMemo(() => {
    const total = problems.length;
    const solved = problems.filter(p => userProgress[p.id]?.is_completed).length;
    return { total, solved };
  }, [problems, userProgress]);

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
          <h1 className="pl-title">All Problems</h1>
          <span className="pl-stats-chip">
            <strong>{stats.solved}</strong>
            <span className="pl-stats-sep">/</span>
            <span>{stats.total}</span>
            <span className="pl-stats-label">solved</span>
          </span>
        </div>

        <div className="pl-filters">
          <div className="pl-search-wrap">
            <Search size={14} className="pl-search-icon" />
            <input
              type="text"
              className="pl-search"
              placeholder="Search problems..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <X size={14} className="pl-search-clear" onClick={() => setSearch('')} />}
          </div>

          <FilterDropdown
            label="Topic"
            value={topicFilter}
            options={topicOptions}
            onChange={setTopicFilter}
            minWidth={170}
          />

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

          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
            minWidth={150}
          />

          <FilterDropdown
            label="Sort"
            value={sortBy}
            options={sortOptions}
            onChange={setSortBy}
            minWidth={140}
          />
        </div>
      </div>

      <div className="pl-table-wrap">
        <div className="pl-table-header">
          <div className="pl-col-status"></div>
          <div className="pl-col-name">Problem</div>
          <div className="pl-col-topic">Topic</div>
          <div className="pl-col-diff">Difficulty</div>
          <div className="pl-col-actions"></div>
        </div>

        <div className="pl-table-body">
          {filteredProblems.map(p => {
            const prog = userProgress[p.id] || {};
            return (
              <div key={p.id} className="pl-row">
                <div className="pl-col-status">
                  <CheckCircle
                    size={17}
                    className={prog.is_completed ? 'pl-status-done' : 'pl-status-todo'}
                    onClick={() => toggleComplete(p.id)}
                    style={{ cursor: session ? 'pointer' : 'default' }}
                    aria-label={prog.is_completed ? 'Mark as unsolved' : 'Mark as solved'}
                  />
                </div>
                <div className="pl-col-name">
                  <Link to={`/category/${p.topic_id}/${p.id}`} className="pl-problem-link" title={p.name}>
                    {p.name}
                  </Link>
                  <Star
                    size={14}
                    className={`pl-name-star ${prog.is_starred ? 'pl-star-active' : 'pl-star-inactive'}`}
                    onClick={() => toggleStar(p.id)}
                    style={{ cursor: session ? 'pointer' : 'default' }}
                    aria-label={prog.is_starred ? 'Unstar problem' : 'Star problem'}
                  />
                </div>
                <div className="pl-col-topic" title={topicFullMap[p.topic_id] || p.topic_id}>
                  {topicNameMap[p.topic_id] || p.topic_id}
                </div>
                <div className="pl-col-diff">
                  <span className={`pl-diff-tag pl-diff-${p.difficulty.toLowerCase()}`}>
                    <span className="pl-diff-dot" aria-hidden="true" />
                    {p.difficulty}
                  </span>
                </div>
                <div className="pl-col-actions">
                  <Link to={`/category/${p.topic_id}/${p.id}`} className="pl-action-icon" title="Solve on PGcode" aria-label="Solve on PGcode">
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
              <Search size={40} className="pl-empty-icon" />
              <p className="pl-empty-title">No problems match your filters.</p>
              <p className="pl-empty-sub">Try clearing filters or switching topics.</p>
              <button className="pl-clear-btn" onClick={() => { setSearch(''); setTopicFilter('all'); setDiffFilter(new Set(DIFFICULTIES)); setStatusFilter('all'); }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>

        <div className="pl-table-footer">
          <span className="pl-count">{filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
