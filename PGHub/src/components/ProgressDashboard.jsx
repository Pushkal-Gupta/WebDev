import React, { useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, Target, TrendingUp, Award, History as HistoryIcon, BarChart3, Share2, X, CalendarClock, PieChart, CheckCircle2 } from 'lucide-react';
import ShareableCard from './ShareableCard';
import Breadcrumb from './common/Breadcrumb';
import ProgressRing from './vault/ProgressRing';
import ActivityHeatmap from './vault/ActivityHeatmap';
import { Donut, GaugeRing, HBarChart, StatCard } from './compete/Charts';
import SignInPrompt from './common/SignInPrompt';
import './vault/vault.css';
import {
  useProblemsCompact,
  useUserProgress,
  useTopics,
  useProfile,
  useUserStatsRpc,
} from '../lib/queries';
import { primaryTopicLabel } from '../lib/topicLabel';
import Achievements from './Achievements';
import './ProgressDashboard.css';

// Lazy so the merged tab doesn't pull the full submission-history bundle on
// first paint of /progress.
const PracticeHistory = lazy(() => import('./PracticeHistory'));

const TAB_KEYS = ['stats', 'history', 'achievements', 'mastery'];

const CRUMBS = [{ label: 'Vault', to: '/vault' }, { label: 'Progress' }];

function ringStyle(pct) {
  const r = 36;
  const c = 2 * Math.PI * r;
  return {
    radius: r,
    circumference: c,
    offset: c - (Math.min(100, Math.max(0, pct)) / 100) * c,
  };
}

export default function ProgressDashboard({ session, roadmapMode }) {
  const userId = session?.user?.id;
  const location = useLocation();
  const navigate = useNavigate();
  const { data: problemsData } = useProblemsCompact();
  const { data: topicsData = [] } = useTopics();
  const { data: progressBundle } = useUserProgress(userId);
  const { data: profile } = useProfile(userId);
  // Server-aggregated path. Falls back to client reduce if the RPC isn't applied.
  const { data: serverStats, isError: rpcError } = useUserStatsRpc(userId);
  const useLegacy = rpcError || !serverStats;

  // Tab is in the URL hash query string so deep links + back button work.
  // HashRouter puts everything after `#/progress` — react-router exposes the
  // search part of that hash via location.search.
  const initialTab = (() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get('tab');
    return TAB_KEYS.includes(t) ? t : 'stats';
  })();
  const [tab, setTab] = useState(initialTab);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const t = sp.get('tab');
    if (TAB_KEYS.includes(t) && t !== tab) setTab(t);
  }, [location.search, tab]);

  const setTabAndUrl = (next) => {
    setTab(next);
    const sp = new URLSearchParams(location.search);
    if (next === 'stats') sp.delete('tab');
    else sp.set('tab', next);
    const qs = sp.toString();
    navigate({ pathname: location.pathname, search: qs ? `?${qs}` : '' }, { replace: false });
  };

  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);
  // Progress reflects the full catalog, not the active roadmap-mode subset —
  // it's about your overall journey across all 3788 problems, not the top-N.
  const filtered = useMemo(() => problemsData || [], [problemsData]);

  const topicNameById = useMemo(() => {
    const m = {};
    topicsData.forEach(t => { m[t.id] = primaryTopicLabel(t.name); });
    return m;
  }, [topicsData]);

  // Topic mastery: denominator (`total`) is derived from the full client catalog so
  // each topic's count reflects every problem that lives under that topic_id, not
  // a sparse server bucket. The RPC may only return rows for topics the user has
  // touched — its `total` would undercount in that case (e.g. Stack showing 1/1
  // when the catalog has dozens). We trust the server for `solved` only.
  const topicStats = useMemo(() => {
    const byTopicSize = {};
    filtered.forEach(p => { byTopicSize[p.topic_id] = (byTopicSize[p.topic_id] || 0) + 1; });
    if (!useLegacy && serverStats?.by_topic) {
      const solvedByTopic = {};
      Object.entries(serverStats.by_topic).forEach(([topicId, v]) => {
        solvedByTopic[topicId] = Number(v.solved || 0);
      });
      return Object.entries(byTopicSize)
        .map(([topicId, total]) => {
          const solved = Math.min(total, solvedByTopic[topicId] || 0);
          return { topicId, solved, total, pct: solved / Math.max(1, total) };
        })
        .sort((a, b) => b.pct - a.pct);
    }
    // Legacy client reduce
    const m = {};
    filtered.forEach(p => {
      if (!m[p.topic_id]) m[p.topic_id] = { total: 0, easy: 0, med: 0, hard: 0, solved: 0 };
      m[p.topic_id].total++;
      if (p.difficulty === 'Easy') m[p.topic_id].easy++;
      else if (p.difficulty === 'Medium') m[p.topic_id].med++;
      else if (p.difficulty === 'Hard') m[p.topic_id].hard++;
      if (byId[p.id]?.is_completed) m[p.topic_id].solved++;
    });
    return Object.entries(m)
      .map(([topicId, v]) => ({ topicId, ...v, pct: v.solved / Math.max(1, v.total) }))
      .sort((a, b) => b.pct - a.pct);
  }, [useLegacy, serverStats, filtered, byId]);

  const totals = useMemo(() => {
    if (!useLegacy && serverStats?.totals) {
      const t = serverStats.totals;
      const e = Number(t.easy_solved || 0);
      const m = Number(t.medium_solved || 0);
      const h = Number(t.hard_solved || 0);
      // Per-difficulty totals (denominators) still come from the tier filter.
      let eT = 0, mT = 0, hT = 0;
      filtered.forEach(p => {
        if (p.difficulty === 'Easy') eT++;
        else if (p.difficulty === 'Medium') mT++;
        else if (p.difficulty === 'Hard') hT++;
      });
      return { e, m, h, eT, mT, hT, solved: e + m + h, total: eT + mT + hT };
    }
    let e = 0, m = 0, h = 0, eT = 0, mT = 0, hT = 0;
    filtered.forEach(p => {
      const solved = byId[p.id]?.is_completed;
      if (p.difficulty === 'Easy') { eT++; if (solved) e++; }
      else if (p.difficulty === 'Medium') { mT++; if (solved) m++; }
      else if (p.difficulty === 'Hard') { hT++; if (solved) h++; }
    });
    return { e, m, h, eT, mT, hT, solved: e + m + h, total: eT + mT + hT };
  }, [useLegacy, serverStats, filtered, byId]);

  // Per-day solve tally for the day-anchored ActivityHeatmap. It expects a Map
  // keyed by each day's midnight-millis timestamp → solve count for that day.
  const countsMap = useMemo(() => {
    const m = new Map();
    (progressBundle?.rows || []).forEach(r => {
      if (!r.last_solved_at) return;
      const d = new Date(r.last_solved_at);
      if (Number.isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      m.set(d.getTime(), (m.get(d.getTime()) || 0) + 1);
    });
    return m;
  }, [progressBundle]);

  // Day-of-week solve distribution for the History tab. Derived from the same
  // last_solved_at rows the heatmap uses — answers "which days do you grind?"
  const weekdayStats = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    (progressBundle?.rows || []).forEach(r => {
      if (!r.last_solved_at) return;
      const d = new Date(r.last_solved_at);
      if (!Number.isNaN(d.getTime())) counts[d.getDay()] += 1;
    });
    const max = Math.max(1, ...counts);
    const totalSolves = counts.reduce((a, b) => a + b, 0);
    return labels.map((label, i) => ({ label, count: counts[i], pct: counts[i] / max, totalSolves }));
  }, [progressBundle]);

  const TOPIC_HUES = ['var(--accent)', 'var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

  const overallPctNum = totals.total === 0 ? 0 : (totals.solved / totals.total) * 100;
  const overallPct = overallPctNum.toFixed(2);
  const ring = ringStyle(overallPctNum);

  // Interactive chart inputs derived from the same real `totals` the ring uses.
  const diffDonut = useMemo(() => ([
    { key: 'easy', label: 'Easy', value: totals.e, hue: 'var(--easy)' },
    { key: 'med', label: 'Medium', value: totals.m, hue: 'var(--medium)' },
    { key: 'hard', label: 'Hard', value: totals.h, hue: 'var(--hard)' },
  ]), [totals.e, totals.m, totals.h]);

  const diffBars = useMemo(() => ([
    { key: 'easy', label: 'Easy', a: totals.e, b: totals.eT, hueA: 'var(--easy)', labelHue: 'var(--easy)' },
    { key: 'med', label: 'Medium', a: totals.m, b: totals.mT, hueA: 'var(--medium)', labelHue: 'var(--medium)' },
    { key: 'hard', label: 'Hard', a: totals.h, b: totals.hT, hueA: 'var(--hard)', labelHue: 'var(--hard)' },
  ]), [totals.e, totals.m, totals.h, totals.eT, totals.mT, totals.hT]);

  const pctOf = (s, t) => (t > 0 ? Math.round((s / t) * 100) : 0);

  const TABS = [
    { key: 'stats',        label: 'Stats',         icon: BarChart3 },
    { key: 'history',      label: 'History',       icon: HistoryIcon },
    { key: 'achievements', label: 'Achievements',  icon: Award },
    { key: 'mastery',      label: 'Topic Mastery', icon: Target },
  ];

  if (!userId) {
    return (
      <div className="pd-container">
        <Breadcrumb items={CRUMBS} />
        <header className="pd-header">
          <div className="pd-header-row">
            <div>
              <h1 className="pd-title">Your Activity</h1>
            </div>
          </div>
        </header>
        <SignInPrompt
          icon={BarChart3}
          title="Sign in to see your activity"
          message="Solves, streaks, submission history, and per-topic mastery — all in one place."
        />
      </div>
    );
  }

  return (
    <div className="pd-container">
      <Breadcrumb items={CRUMBS} />
      <header className="pd-header">
        <div className="pd-header-row">
          <div>
            <h1 className="pd-title">Your Activity</h1>
            <p className="pd-sub">
              Solves, streaks, submission history, achievements, topic mastery — tracked across every problem.
            </p>
          </div>
          {profile?.username && (
            <button
              type="button"
              className="pd-share-btn"
              onClick={() => setShareOpen(true)}
              title="Generate a sharable stat card"
            >
              <Share2 size={14} /> Share card
            </button>
          )}
        </div>
      </header>

      {shareOpen && (
        <div className="sc-modal-backdrop" onClick={() => setShareOpen(false)}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-head">
              <div>
                <div className="sc-modal-title">Your shareable stat card</div>
                <div className="sc-modal-sub">Post to LinkedIn or Twitter at 1200 by 630. Theme matches your active palette.</div>
              </div>
              <button type="button" className="sc-modal-close" onClick={() => setShareOpen(false)} aria-label="Close">
                <X size={14} />
              </button>
            </div>
            <ShareableCard
              embedded
              presetUsername={profile?.username}
              presetUserId={userId}
              presetDisplayName={profile?.display_name || `@${profile?.username}`}
            />
          </div>
        </div>
      )}

      <nav className="pd-tabs" role="tablist">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`pd-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTabAndUrl(t.key)}
            >
              <Icon size={13} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {tab === 'stats' && (
        <>
          <section className="pd-top">
            <div className="pd-overall">
              <svg className="pd-ring" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={ring.radius} fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r={ring.radius} fill="none"
                  stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={ring.circumference} strokeDashoffset={ring.offset}
                  transform="rotate(-90 48 48)"
                />
              </svg>
              <div className="pd-overall-text">
                <div className="pd-overall-label">Overall completion</div>
                <div className="pd-overall-pct">{overallPct}%</div>
                <div className="pd-overall-frac">{totals.solved} / {totals.total} solved</div>
              </div>
            </div>

            <div className="pd-donut-card">
              <Donut
                segments={diffDonut}
                total={totals.solved}
                caption="solved"
                ariaLabel="Solved problems by difficulty"
              />
            </div>

            <div className="pd-streak-card">
              <div className="pd-streak-row">
                <Flame size={16} className="pd-streak-icon" />
                <div>
                  <div className="pd-streak-value">{profile?.current_streak || 0} day streak</div>
                  <div className="pd-streak-sub">Best: {profile?.longest_streak || 0}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="pd-charts-grid">
            <div className="pd-card pd-chart-card">
              <div className="pd-card-head">
                <h2 className="pd-card-title"><Target size={14} /> Completion by difficulty</h2>
              </div>
              <div className="pd-gauge-row">
                <GaugeRing
                  value={overallPctNum} max={100} suffix="%"
                  hue="var(--accent)" caption="Overall"
                  icon={CheckCircle2} goalLabel={`${totals.solved}/${totals.total}`}
                />
                <GaugeRing
                  value={pctOf(totals.e, totals.eT)} max={100} suffix="%"
                  hue="var(--easy)" caption="Easy" goalLabel={`${totals.e}/${totals.eT}`}
                />
                <GaugeRing
                  value={pctOf(totals.m, totals.mT)} max={100} suffix="%"
                  hue="var(--medium)" caption="Medium" goalLabel={`${totals.m}/${totals.mT}`}
                />
                <GaugeRing
                  value={pctOf(totals.h, totals.hT)} max={100} suffix="%"
                  hue="var(--hard)" caption="Hard" goalLabel={`${totals.h}/${totals.hT}`}
                />
              </div>
            </div>

            <div className="pd-card pd-chart-card">
              <div className="pd-card-head">
                <h2 className="pd-card-title"><PieChart size={14} /> Solved vs total</h2>
              </div>
              <div className="pd-stat-row">
                <StatCard icon={CheckCircle2} label="Solved" value={totals.solved.toLocaleString()} hue="var(--accent)" />
                <StatCard icon={Flame} label="Day streak" value={profile?.current_streak || 0} hue="var(--accent)" />
                <StatCard icon={Award} label="Best streak" value={profile?.longest_streak || 0} />
              </div>
              <HBarChart rows={diffBars} paired scaleMax={Math.max(1, totals.eT, totals.mT, totals.hT)} />
            </div>
          </section>

          <section className="pd-card">
            <div className="pd-card-head">
              <h2 className="pd-card-title"><TrendingUp size={14} /> Last 12 weeks</h2>
            </div>
            <ActivityHeatmap counts={countsMap} weeks={12} />
          </section>

          <section className="pd-card pd-ach-summary">
            <div className="pd-card-head">
              <h2 className="pd-card-title"><Award size={14} /> Achievements</h2>
              <button type="button" className="pd-card-action" onClick={() => setTabAndUrl('achievements')}>See all →</button>
            </div>
            <Achievements session={session} roadmapMode={roadmapMode} compact limit={4} />
          </section>
        </>
      )}

      {tab === 'history' && (
        <>
          <section className="pd-card">
            <div className="pd-card-head">
              <h2 className="pd-card-title"><CalendarClock size={14} /> When you solve</h2>
              <span className="pd-card-action" style={{ pointerEvents: 'none' }}>
                {weekdayStats[0]?.totalSolves || 0} solves tracked
              </span>
            </div>
            <div className="pd-week-chart">
              {weekdayStats.map((d, i) => (
                <div key={d.label} className="pd-week-col" title={`${d.count} solve${d.count === 1 ? '' : 's'} on ${d.label}`}>
                  <span className="pd-week-count">{d.count}</span>
                  <div className="pd-week-track">
                    <div
                      className="pd-week-bar"
                      style={{ height: `${Math.max(4, Math.round(d.pct * 100))}%`, background: TOPIC_HUES[i % TOPIC_HUES.length] }}
                    />
                  </div>
                  <span className="pd-week-label">{d.label}</span>
                </div>
              ))}
            </div>
          </section>
          <Suspense fallback={<p className="pd-empty">Loading history…</p>}>
            <PracticeHistory session={session} roadmapMode={roadmapMode} />
          </Suspense>
        </>
      )}

      {tab === 'achievements' && (
        <section className="pd-card pd-ach-full">
          <Achievements session={session} roadmapMode={roadmapMode} />
        </section>
      )}

      {tab === 'mastery' && (
        <section className="pd-card">
          <div className="pd-card-head">
            <h2 className="pd-card-title"><Target size={14} /> Topic mastery</h2>
            <button type="button" className="pd-card-action" onClick={() => navigate('/practice')}>Open practice →</button>
          </div>
          {topicStats.length === 0 ? (
            <p className="pd-empty">Solve a few problems to see your per-topic breakdown.</p>
          ) : (
            <div className="pd-mastery-grid">
              {topicStats.map((t, i) => {
                const hue = TOPIC_HUES[i % TOPIC_HUES.length];
                return (
                  <div key={t.topicId} className="pd-mastery-card" style={{ '--card-hue': hue }}>
                    <ProgressRing solved={t.solved} total={t.total} color={hue} size={52} stroke={6} />
                    <div className="pd-mastery-meta">
                      <span className="pd-mastery-name">{topicNameById[t.topicId] || t.topicId}</span>
                      <span className="pd-mastery-frac">{t.solved} / {t.total} solved</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
