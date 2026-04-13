import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Star, Code2, ExternalLink, Lightbulb, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './ProblemList.css';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const difficultyOrder = { 'Easy': 0, 'Medium': 1, 'Hard': 2 };

export default function ProblemList({ session, roadmapMode }) {
  const [problems, setProblems] = useState([]);
  const [topics, setTopics] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState(new Set(['Easy', 'Medium', 'Hard']));
  const [statusFilter, setStatusFilter] = useState('all'); // all | solved | unsolved | starred
  const [tagFilter, setTagFilter] = useState('all');
  const [sortBy, setSortBy] = useState('topic'); // topic | difficulty | name

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [problemsRes, topicsRes, progressRes] = await Promise.all([
          supabase.from('PGcode_problems').select('id, name, topic_id, difficulty, roadmap_set, leetcode_url, tags'),
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
    topics.forEach(t => { map[t.id] = t.name; });
    return map;
  }, [topics]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    problems.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [problems]);

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
      if (tagFilter !== 'all' && !(p.tags || []).includes(tagFilter)) return false;

      const prog = userProgress[p.id];
      if (statusFilter === 'solved' && !prog?.is_completed) return false;
      if (statusFilter === 'unsolved' && prog?.is_completed) return false;
      if (statusFilter === 'starred' && !prog?.is_starred) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'difficulty') return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      // Default: topic then difficulty
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
          <span className="pl-stats">{stats.solved} / {stats.total} solved</span>
        </div>

        {/* Filters */}
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

          <select className="pl-select" value={topicFilter} onChange={e => setTopicFilter(e.target.value)}>
            <option value="all">All Topics</option>
            {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          <div className="pl-diff-toggles">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`pl-diff-btn pl-diff-${d.toLowerCase()} ${diffFilter.has(d) ? 'active' : ''}`}
                onClick={() => toggleDiff(d)}
              >
                {d}
              </button>
            ))}
          </div>

          <select className="pl-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="solved">Solved</option>
            <option value="unsolved">Unsolved</option>
            <option value="starred">Starred</option>
          </select>

          {allTags.length > 0 && (
            <select className="pl-select" value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
              <option value="all">All Patterns</option>
              {allTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          <select className="pl-select pl-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="topic">Sort: Topic</option>
            <option value="difficulty">Sort: Difficulty</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="pl-table-wrap">
        <div className="pl-table-header">
          <div className="pl-col-status"></div>
          <div className="pl-col-name">Problem</div>
          <div className="pl-col-topic">Topic</div>
          <div className="pl-col-tags">Patterns</div>
          <div className="pl-col-diff">Difficulty</div>
          <div className="pl-col-actions"></div>
        </div>

        <div className="pl-table-body">
          {filteredProblems.map(p => {
            const prog = userProgress[p.id] || {};
            const displayName = p.name.replace(/Pattern #(\d+)/, 'Problem #$1').replace(/Challenge #(\d+)/, 'Problem #$1');
            return (
              <div key={p.id} className="pl-row">
                <div className="pl-col-status">
                  <CheckCircle
                    size={17}
                    className={prog.is_completed ? 'pl-status-done' : 'pl-status-todo'}
                    onClick={() => toggleComplete(p.id)}
                    style={{ cursor: session ? 'pointer' : 'default' }}
                  />
                </div>
                <div className="pl-col-name">
                  <Star
                    size={14}
                    className={`pl-name-star ${prog.is_starred ? 'pl-star-active' : 'pl-star-inactive'}`}
                    onClick={() => toggleStar(p.id)}
                    style={{ cursor: session ? 'pointer' : 'default' }}
                  />
                  <Link to={`/category/${p.topic_id}/${p.id}`} className="pl-problem-link">
                    {displayName}
                  </Link>
                </div>
                <div className="pl-col-topic">
                  <span className="pl-topic-badge">{topicNameMap[p.topic_id] || p.topic_id}</span>
                </div>
                <div className="pl-col-tags">
                  {(p.tags || []).slice(0, 2).map(t => (
                    <span key={t} className="pl-tag-pill" onClick={() => setTagFilter(t)}>{t}</span>
                  ))}
                </div>
                <div className={`pl-col-diff pl-diff-${p.difficulty.toLowerCase()}`}>
                  {p.difficulty}
                </div>
                <div className="pl-col-actions">
                  <Link to={`/category/${p.topic_id}/${p.id}`} className="pl-action-icon" title="Solve on PGcode">
                    <Code2 size={14} />
                  </Link>
                  {p.leetcode_url && (
                    <a href={p.leetcode_url} target="_blank" rel="noopener noreferrer" className="pl-action-icon pl-lc" title="Solve on LeetCode">
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <Link to={`/solution/${p.id}`} className="pl-action-icon pl-sol" title="View Solution">
                    <Lightbulb size={14} />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredProblems.length === 0 && (
            <div className="pl-empty">
              <Search size={32} className="pl-empty-icon" />
              <p>No problems match your filters.</p>
              <button className="pl-clear-btn" onClick={() => { setSearch(''); setTopicFilter('all'); setDiffFilter(new Set(DIFFICULTIES)); setStatusFilter('all'); setTagFilter('all'); }}>
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pl-footer">
        <span className="pl-count">{filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
