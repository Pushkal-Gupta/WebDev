import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, ChevronDown, Flame, Play, Shuffle, ArrowRight,
} from 'lucide-react';
import {
  useSubmissionHistory,
  useProblemsCompact,
  useUserProgress,
  useTopics,
  useUserStatsRpc,
  usePracticeHistoryRpc,
  useUserStreak,
  usePotd,
  filterByRoadmap,
} from '../lib/queries';
import { primaryTopicLabel } from '../lib/topicLabel';
import { supabase } from '../lib/supabase';
import BubbleCloud from './BubbleCloud';
import './PracticeHistory.css';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function leetcodeDateLabel(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(d);
  cmp.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - cmp.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return WEEKDAY[cmp.getDay()];
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isAcceptedVerdict(v) {
  return v === 'Accepted' || v === 'success' || v === 'accepted';
}

export default function PracticeHistory({ session, roadmapMode }) {
  const userId = session?.user?.id;
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, isError: statsErr } = useUserStatsRpc(userId);
  const { data: rpcHistory = [] } = usePracticeHistoryRpc(userId, 200);
  const { data: streak } = useUserStreak(userId);
  const { data: potd } = usePotd();
  const useLegacy = statsErr;
  const { data: submissions = [], isLoading: legacyLoading, isError: legacyErr } =
    useSubmissionHistory(useLegacy ? userId : null, 500);
  const isLoading = useLegacy ? statsLoading && legacyLoading : statsLoading;
  const isError = useLegacy ? legacyErr : false;
  const { data: problemsData } = useProblemsCompact();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: topicsData = [] } = useTopics();
  const [view, setView] = useState('solved');
  const [filter, setFilter] = useState('all');
  const [granularity, setGranularity] = useState('D');

  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);
  const filteredProblems = useMemo(() => filterByRoadmap(problemsData, roadmapMode), [problemsData, roadmapMode]);
  const problemsById = useMemo(() => {
    const m = {};
    (problemsData || []).forEach(p => { m[p.id] = p; });
    return m;
  }, [problemsData]);

  const groupedByProblem = useMemo(() => {
    if (!useLegacy && rpcHistory.length > 0) {
      return rpcHistory.map(r => ({
        problem_id: r.problem_id,
        problem: problemsById[r.problem_id] || { name: r.problem_name, topic_id: r.topic_id, difficulty: r.difficulty },
        lastSubmittedAt: r.last_submitted_at,
        lastVerdict: r.last_verdict,
        submissionCount: r.submission_count,
      }));
    }
    const m = new Map();
    submissions.forEach(s => {
      if (!m.has(s.problem_id)) m.set(s.problem_id, []);
      m.get(s.problem_id).push(s);
    });
    return Array.from(m.entries()).map(([problem_id, subs]) => ({
      problem_id,
      problem: problemsById[problem_id],
      lastSubmittedAt: subs[0]?.created_at,
      lastVerdict: subs[0]?.verdict,
      submissionCount: subs.length,
    })).sort((a, b) => new Date(b.lastSubmittedAt || 0) - new Date(a.lastSubmittedAt || 0));
  }, [useLegacy, rpcHistory, submissions, problemsById]);

  const summary = useMemo(() => {
    if (!useLegacy && stats) {
      const t = stats.totals || {};
      const s = stats.submissions || {};
      const totalSubs = Number(s.total_subs || 0);
      const accepted = Number(s.accepted_subs || 0);
      const totalSolved = Number(t.total_solved || 0);
      const totalProblems = (problemsData || []).length || 1;
      return {
        totalSubs,
        accepted,
        acceptanceRate: totalSubs > 0 ? accepted / totalSubs : 0,
        easySolved: Number(t.easy_solved || 0),
        medSolved: Number(t.medium_solved || 0),
        hardSolved: Number(t.hard_solved || 0),
        totalSolved,
        topPercent: Math.max(1, Math.round((1 - totalSolved / totalProblems) * 100)),
      };
    }
    const totalSubs = submissions.length;
    const accepted = submissions.filter(s => isAcceptedVerdict(s.verdict)).length;
    const easySolved = filteredProblems.filter(p => p.difficulty === 'Easy' && byId[p.id]?.is_completed).length;
    const medSolved  = filteredProblems.filter(p => p.difficulty === 'Medium' && byId[p.id]?.is_completed).length;
    const hardSolved = filteredProblems.filter(p => p.difficulty === 'Hard' && byId[p.id]?.is_completed).length;
    const totalSolved = easySolved + medSolved + hardSolved;
    const totalProblems = (problemsData || []).length || 1;
    return {
      totalSubs, accepted,
      acceptanceRate: totalSubs > 0 ? accepted / totalSubs : 0,
      easySolved, medSolved, hardSolved, totalSolved,
      topPercent: Math.max(1, Math.round((1 - totalSolved / totalProblems) * 100)),
    };
  }, [useLegacy, stats, submissions, filteredProblems, byId, problemsData]);

  const monthActivity = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const days = [];
    for (let i = 0; i < last.getDate(); i++) {
      const d = new Date(year, month, first.getDate() + i);
      days.push({ date: d, day: d.getDate(), easy: 0, medium: 0, hard: 0 });
    }
    const lookup = new Map(days.map(d => [d.date.getTime(), d]));

    if (!useLegacy && stats?.daily) {
      stats.daily.forEach(row => {
        const ts = new Date(row.day);
        ts.setHours(0, 0, 0, 0);
        const d = lookup.get(ts.getTime());
        if (!d) return;
        if (row.difficulty === 'Easy') d.easy += Number(row.n);
        else if (row.difficulty === 'Medium') d.medium += Number(row.n);
        else if (row.difficulty === 'Hard') d.hard += Number(row.n);
      });
    } else {
      submissions.forEach(s => {
        if (!isAcceptedVerdict(s.verdict)) return;
        const d = new Date(s.created_at);
        d.setHours(0, 0, 0, 0);
        const slot = lookup.get(d.getTime());
        if (!slot) return;
        const diff = problemsById[s.problem_id]?.difficulty;
        if (diff === 'Easy') slot.easy++;
        else if (diff === 'Medium') slot.medium++;
        else if (diff === 'Hard') slot.hard++;
      });
    }

    const maxDay = Math.max(1, ...days.map(d => d.easy + d.medium + d.hard));
    const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return { days, maxDay, monthLabel };
  }, [useLegacy, stats, submissions, problemsById]);

  const bubbleItems = useMemo(() => {
    const labelById = {};
    topicsData.forEach(t => { labelById[t.id] = primaryTopicLabel(t.name); });
    const byTopic = {};
    filteredProblems.forEach(p => {
      if (!byId[p.id]?.is_completed) return;
      if (!byTopic[p.topic_id]) byTopic[p.topic_id] = { id: p.topic_id, label: labelById[p.topic_id] || p.topic_id, solved: 0, total: 0 };
      byTopic[p.topic_id].solved++;
      byTopic[p.topic_id].total++;
    });
    const items = Object.values(byTopic);
    if (items.length > 0) return items;
    return [
      { id: '__easy', label: 'Easy', solved: summary.easySolved, total: Math.max(1, summary.easySolved), kind: 'easy' },
      { id: '__medium', label: 'Medium', solved: summary.medSolved, total: Math.max(1, summary.medSolved), kind: 'medium' },
      { id: '__hard', label: 'Hard', solved: summary.hardSolved, total: Math.max(1, summary.hardSolved), kind: 'hard' },
    ];
  }, [filteredProblems, byId, topicsData, summary.easySolved, summary.medSolved, summary.hardSolved]);

  if (!userId) {
    return (
      <div className="ph-container">
        <div className="ph-empty">
          <Calendar size={32} className="ph-empty-icon" />
          <h2 className="ph-empty-title">Sign in to see your practice history</h2>
          <p className="ph-empty-sub">Every Run and Submit gets logged once you&rsquo;re signed in.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="ph-container">
        <div className="ph-skel">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ph-container">
        <div className="ph-empty">
          <h2 className="ph-empty-title">Couldn&rsquo;t load history</h2>
          <p className="ph-empty-sub">Network error. <button className="ph-link" onClick={() => window.location.reload()}>Retry</button></p>
        </div>
      </div>
    );
  }

  const visibleGroups = filter === 'all'
    ? groupedByProblem
    : groupedByProblem.filter(g => filter === 'accepted'
        ? isAcceptedVerdict(g.lastVerdict)
        : !isAcceptedVerdict(g.lastVerdict));

  const lastProblem = (() => {
    try {
      const raw = localStorage.getItem(`pg-last-problem-${userId}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  const onRandomUnsolved = async () => {
    const { data } = await supabase.rpc('pgcode_random_unsolved', { uid: userId, diff: 'Medium' });
    if (data?.problem_id) navigate(`/category/${data.topic_id}/${data.problem_id}`);
    else navigate('/practice');
  };

  return (
    <div className="ph-container">
      <section className="ph-overview">
        <div className="ph-streak-card">
          <header className="ph-streak-head">
            <Flame size={12} className="ph-streak-flame" />
            <span>Day streak</span>
          </header>
          <div className="ph-streak-meta">
            <span className="ph-streak-num">{streak?.current ?? 0}</span>
            <span className="ph-streak-label">days</span>
          </div>
          <div className="ph-streak-sub">
            <span>Longest <b>{streak?.longest ?? 0}</b></span>
            <span>Total <b>{streak?.total_solved ?? 0}</b></span>
          </div>
        </div>

        {potd?.problem_id && (
          <Link to={`/category/${potd.topic_id}/${potd.problem_id}`} className="ph-quick-card">
            <header className="ph-quick-head"><Calendar size={12} /><span>Problem of the day</span></header>
            <h3 className="ph-quick-title">{potd.name}</h3>
            <div className="ph-quick-foot">
              <span className={`ph-diff ph-diff-${(potd.difficulty || '').toLowerCase()}`}>{potd.difficulty}</span>
              <span className="ph-quick-cta">Open <ArrowRight size={12} /></span>
            </div>
          </Link>
        )}

        {lastProblem && (
          <Link to={`/category/${lastProblem.topic_id}/${lastProblem.id}`} className="ph-quick-card">
            <header className="ph-quick-head"><Play size={12} /><span>Resume where you left off</span></header>
            <h3 className="ph-quick-title">{lastProblem.name}</h3>
            <div className="ph-quick-foot">
              <span className={`ph-diff ph-diff-${(lastProblem.difficulty || '').toLowerCase()}`}>{lastProblem.difficulty}</span>
              <span className="ph-quick-cta">Continue <ArrowRight size={12} /></span>
            </div>
          </Link>
        )}

        <button type="button" onClick={onRandomUnsolved} className="ph-quick-card ph-quick-button">
          <header className="ph-quick-head"><Shuffle size={12} /><span>Feeling lucky</span></header>
          <h3 className="ph-quick-title">Random unsolved Medium</h3>
          <div className="ph-quick-foot">
            <span className="ph-diff ph-diff-medium">Medium</span>
            <span className="ph-quick-cta">Roll <ArrowRight size={12} /></span>
          </div>
        </button>
      </section>

      <div className="ph-grid">
        <main className="ph-left">
          <div className="ph-tabs" role="tablist">
            {[
              { key: 'all', label: 'All' },
              { key: 'accepted', label: 'Accepted' },
              { key: 'failed', label: 'Failed' },
            ].map(t => {
              const count = t.key === 'all'
                ? groupedByProblem.length
                : t.key === 'accepted'
                  ? groupedByProblem.filter(g => isAcceptedVerdict(g.lastVerdict)).length
                  : groupedByProblem.filter(g => !isAcceptedVerdict(g.lastVerdict)).length;
              return (
                <button
                  key={t.key}
                  role="tab"
                  className={`ph-tab ${filter === t.key ? 'active' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  <span>{t.label}</span>
                  <span className="ph-tab-count">{count}</span>
                </button>
              );
            })}
          </div>

          {visibleGroups.length === 0 ? (
            <div className="ph-empty">
              <p className="ph-empty-title">No submissions yet.</p>
              <p className="ph-empty-sub">Solve a problem and hit Submit to start your practice history.</p>
            </div>
          ) : (
            <div className="ph-table" role="table">
              <div className="ph-row ph-row-head" role="row">
                <span role="columnheader">Last Submitted</span>
                <span role="columnheader">Problem</span>
                <span role="columnheader">Last Result</span>
                <span role="columnheader">Submission</span>
              </div>
              <div className="ph-rows">
                {visibleGroups.map(g => {
                  const ok = isAcceptedVerdict(g.lastVerdict);
                  const p = g.problem;
                  const href = p ? `/category/${p.topic_id}/${p.id}` : null;
                  const RowEl = href ? Link : 'div';
                  const rowProps = href ? { to: href } : {};
                  return (
                    <RowEl
                      {...rowProps}
                      key={g.problem_id}
                      className={`ph-row ph-row-body ${ok ? 'ph-row-ok' : 'ph-row-fail'}`}
                      role="row"
                    >
                      <span className="ph-cell-date">{leetcodeDateLabel(g.lastSubmittedAt)}</span>
                      <span className="ph-cell-problem">
                        <span className="ph-cell-name">
                          {p?.name || g.problem_id}
                        </span>
                        {p?.difficulty && (
                          <span className={`ph-diff ph-diff-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                        )}
                      </span>
                      <span className={`ph-cell-verdict ${ok ? 'ok' : 'bad'}`}>{ok ? 'Accepted' : 'Failed'}</span>
                      <span className="ph-cell-count">
                        {g.submissionCount}
                        <ChevronDown size={11} />
                      </span>
                    </RowEl>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        <aside className="ph-side">
          <div className="ph-summary-card">
            <header className="ph-summary-head">
              <div className="ph-summary-total">
                <span className="ph-summary-num">{summary.totalSolved}</span>
                <span className="ph-summary-noun">Problems</span>
              </div>
              <span className="ph-summary-beats">Top {summary.topPercent}%</span>
            </header>

            <div className="ph-diff-row">
              <span className="ph-diff-chip ph-diff-easy">
                <span className="ph-diff-chip-label">Easy</span>
                <span className="ph-diff-chip-num">{summary.easySolved}</span>
              </span>
              <span className="ph-diff-chip ph-diff-medium">
                <span className="ph-diff-chip-label">Med.</span>
                <span className="ph-diff-chip-num">{summary.medSolved}</span>
              </span>
              <span className="ph-diff-chip ph-diff-hard">
                <span className="ph-diff-chip-label">Hard</span>
                <span className="ph-diff-chip-num">{summary.hardSolved}</span>
              </span>
            </div>

            <div className="ph-stat-pair">
              <div className="ph-stat">
                <span className="ph-stat-label">Submissions</span>
                <span className="ph-stat-num ph-num-accent">{summary.totalSubs}</span>
              </div>
              <div className="ph-stat">
                <span className="ph-stat-label">Acceptance</span>
                <span className="ph-stat-num ph-num-easy">
                  {Math.round(summary.acceptanceRate * 100)}<span className="ph-num-suffix">%</span>
                </span>
              </div>
            </div>

            <div className="ph-bubble-wrap">
              <BubbleCloud items={bubbleItems} width={320} height={220} />
            </div>

            <div className="ph-chart-head">
              <div className="ph-mini-tabs" role="tablist">
                <button
                  role="tab"
                  className={`ph-mini-tab ${view === 'solved' ? 'active' : ''}`}
                  onClick={() => setView('solved')}
                >Solved</button>
                <button
                  role="tab"
                  className={`ph-mini-tab ${view === 'submissions' ? 'active' : ''}`}
                  onClick={() => setView('submissions')}
                >Submissions</button>
              </div>
              <div className="ph-gran" role="tablist">
                {['D', 'W', 'M'].map(g => (
                  <button
                    key={g}
                    role="tab"
                    className={`ph-gran-btn ${granularity === g ? 'active' : ''}`}
                    onClick={() => setGranularity(g)}
                  >{g}</button>
                ))}
              </div>
            </div>

            <div className="ph-chart-month">{monthActivity.monthLabel}</div>
            <div className="ph-chart">
              {monthActivity.days.map((d, i) => {
                const total = d.easy + d.medium + d.hard;
                const heightPct = total === 0 ? 4 : Math.max(8, Math.round((total / monthActivity.maxDay) * 100));
                return (
                  <div key={i} className="ph-chart-col" title={`${d.date.toDateString()} — ${total} solve${total === 1 ? '' : 's'}`}>
                    <div className={`ph-chart-bar ${total === 0 ? 'empty' : ''}`} style={{ height: `${heightPct}%` }}>
                      {d.easy > 0 && <span className="ph-chart-seg ph-seg-easy" style={{ flex: d.easy }} />}
                      {d.medium > 0 && <span className="ph-chart-seg ph-seg-medium" style={{ flex: d.medium }} />}
                      {d.hard > 0 && <span className="ph-chart-seg ph-seg-hard" style={{ flex: d.hard }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ph-chart-axis">
              <span>1</span>
              <span>{Math.ceil(monthActivity.days.length / 2)}</span>
              <span>{monthActivity.days.length}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
