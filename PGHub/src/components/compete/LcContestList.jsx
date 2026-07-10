import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Calendar,
  Radio,
  CalendarOff,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  TrendingUp,
  BarChart3,
  ListChecks,
  Timer,
  Sunrise,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import './LcContestList.css';
import { useExternalContests } from '../../lib/queries';
import Breadcrumb from '../common/Breadcrumb';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'finished', label: 'Finished' },
];

// Canonical LeetCode cadence (verified against the public schedule):
//   Weekly  — every Sunday 02:30 UTC (08:00 AM IST), 90 min, 4 problems.
//   Biweekly — alternating Saturdays 14:30 UTC (08:00 PM IST), 90 min, 4 problems.
// Anchors fix both the date parity and the contest numbering so the next few
// rounds can be projected forward purely from the current time.
const CONTEST_DURATION_MIN = 90;
const CONTEST_PROBLEMS = 4;
const WEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 8, 29, 2, 30), number: 417 }; // Sun 2024-09-29 = Weekly Contest 417
const BIWEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 9, 5, 14, 30), number: 141 }; // Sat 2024-10-05 = Biweekly Contest 141
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;

function nextOccurrences(anchorMs, periodMs, fromMs, count) {
  // Smallest k such that anchor + k*period >= fromMs (allow the in-progress one too).
  const k = Math.ceil((fromMs - anchorMs) / periodMs);
  const out = [];
  for (let i = 0; i < count; i += 1) out.push(k + i);
  return out;
}

// Project the next `weeklyCount` weekly + `biweeklyCount` biweekly contests as
// synthetic rows shaped like the DB rows so they flow through the same pipeline.
function projectSchedule(nowMs, weeklyCount, biweeklyCount) {
  const rows = [];
  for (const k of nextOccurrences(WEEKLY_ANCHOR.utcMs, WEEK_MS, nowMs, weeklyCount)) {
    const number = WEEKLY_ANCHOR.number + k;
    rows.push({
      id: `synthetic-weekly-${number}`,
      synthetic: true,
      kind: 'weekly',
      platform: 'leetcode',
      name: `Weekly Contest ${number}`,
      start_time: new Date(WEEKLY_ANCHOR.utcMs + k * WEEK_MS).toISOString(),
      duration_minutes: CONTEST_DURATION_MIN,
      problem_count: CONTEST_PROBLEMS,
      url: 'https://leetcode.com/contest/',
    });
  }
  for (const k of nextOccurrences(BIWEEKLY_ANCHOR.utcMs, FORTNIGHT_MS, nowMs, biweeklyCount)) {
    const number = BIWEEKLY_ANCHOR.number + k;
    rows.push({
      id: `synthetic-biweekly-${number}`,
      synthetic: true,
      kind: 'biweekly',
      platform: 'leetcode',
      name: `Biweekly Contest ${number}`,
      start_time: new Date(BIWEEKLY_ANCHOR.utcMs + k * FORTNIGHT_MS).toISOString(),
      duration_minutes: CONTEST_DURATION_MIN,
      problem_count: CONTEST_PROBLEMS,
      url: 'https://leetcode.com/contest/',
    });
  }
  return rows;
}

function statusOf(startMs, durMin, now) {
  const endMs = startMs + durMin * 60 * 1000;
  if (now < startMs) return 'upcoming';
  if (now < endMs) return 'ongoing';
  return 'finished';
}

function formatDuration(min) {
  if (!min && min !== 0) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function formatCountdown(ms) {
  if (ms <= 0) return 'now';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d) return `${d}d ${h}h ${m}m`;
  if (h) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function formatStart(ms) {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_META = {
  upcoming: { label: 'Upcoming', cls: 'lcc-badge-upcoming' },
  ongoing: { label: 'Live', cls: 'lcc-badge-live' },
  finished: { label: 'Finished', cls: 'lcc-badge-finished' },
};

export default function LcContestList() {
  const { data, isLoading } = useExternalContests();
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState('all');
  const [newestFirst, setNewestFirst] = useState(true);

  // Tick every second so the countdowns on the featured cards stay live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const contests = useMemo(() => {
    const dbRows = (data || []).filter((r) => r.platform === 'leetcode');
    // Drop any DB rows that are still in the future — the projected schedule is
    // the source of truth for upcoming rounds, so this avoids duplicate cards.
    const dbFinished = dbRows.filter((r) => {
      const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;
      const durMin = r.duration_minutes ?? CONTEST_DURATION_MIN;
      return statusOf(startMs, durMin, now) === 'finished';
    });
    const projected = projectSchedule(now, 4, 2);
    const seen = new Set(dbFinished.map((r) => r.name));
    const merged = [...dbFinished, ...projected.filter((r) => !seen.has(r.name))];
    const dir = newestFirst ? -1 : 1;
    return merged
      .map((r) => {
        const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;
        const durMin = r.duration_minutes ?? CONTEST_DURATION_MIN;
        const status = statusOf(startMs, durMin, now);
        return { ...r, startMs, durMin, status, endMs: startMs + durMin * 60000 };
      })
      .sort((a, b) => dir * (a.startMs - b.startMs));
  }, [data, now, newestFirst]);

  const counts = useMemo(() => {
    const c = { all: contests.length, upcoming: 0, ongoing: 0, finished: 0 };
    for (const r of contests) c[r.status] += 1;
    return c;
  }, [contests]);

  const visible = useMemo(
    () => (filter === 'all' ? contests : contests.filter((r) => r.status === filter)),
    [contests, filter],
  );

  // The two soonest live/upcoming rounds get the big countdown treatment.
  const featured = useMemo(() => {
    return contests
      .filter((r) => r.status === 'upcoming' || r.status === 'ongoing')
      .sort((a, b) => a.startMs - b.startMs)
      .slice(0, 2);
  }, [contests]);

  return (
    <div className="lcc-container">
      <Breadcrumb
        items={[
          { label: 'Compete', to: '/compete' },
          { label: 'LeetCode', to: '/compete/leetcode' },
          { label: 'Contests' },
        ]}
      />

      <header className="lcc-header">
        <h1 className="lcc-title">
          <Trophy size={24} className="lcc-title-icon" />
          LeetCode contests
        </h1>
        <p className="lcc-sub">
          Next rounds with live countdowns, the weekly cadence, and a one-click rating predictor.
        </p>
      </header>

      <section className="lcc-cadence">
        <div className="lcc-cadence-item">
          <span className="lcc-cadence-ico lcc-ico-weekly">
            <Sunrise size={18} />
          </span>
          <div className="lcc-cadence-body">
            <span className="lcc-cadence-name">Weekly Contest</span>
            <span className="lcc-cadence-when">Every Sunday · 8:00 AM IST · 90 min · 4 problems</span>
          </div>
        </div>
        <div className="lcc-cadence-item">
          <span className="lcc-cadence-ico lcc-ico-biweekly">
            <Calendar size={18} />
          </span>
          <div className="lcc-cadence-body">
            <span className="lcc-cadence-name">Biweekly Contest</span>
            <span className="lcc-cadence-when">
              Every other Saturday · 8:00 PM IST · 90 min · 4 problems
            </span>
          </div>
        </div>
        <Link to="/compete/leetcode" className="lcc-cadence-cta">
          <TrendingUp size={15} />
          Predict my rating
          <ArrowRight size={14} />
        </Link>
      </section>

      {featured.length > 0 && (
        <section className="lcc-featured">
          {featured.map((r) => {
            const isLive = r.status === 'ongoing';
            const ms = isLive ? r.endMs - now : r.startMs - now;
            return (
              <article
                key={r.id}
                className={`lcc-feat${isLive ? ' lcc-feat-live' : ''}`}
              >
                <div className="lcc-feat-top">
                  <span className={`lcc-badge ${STATUS_META[r.status].cls}`}>
                    {isLive ? (
                      <>
                        <Radio size={11} /> Live now
                      </>
                    ) : (
                      'Up next'
                    )}
                  </span>
                  <span className="lcc-feat-kind">{r.kind === 'biweekly' ? 'Biweekly' : 'Weekly'}</span>
                </div>
                <h2 className="lcc-feat-name">{r.name}</h2>
                <div className="lcc-feat-count">
                  <Timer size={14} />
                  <span className="lcc-feat-count-val">{formatCountdown(ms)}</span>
                  <span className="lcc-feat-count-label">{isLive ? 'until it ends' : 'until start'}</span>
                </div>
                <div className="lcc-feat-meta">
                  <span>
                    <Calendar size={12} /> {formatStart(r.startMs)}
                  </span>
                  <span>
                    <Clock size={12} /> {formatDuration(r.durMin)}
                  </span>
                  <span>
                    <ListChecks size={12} /> {r.problem_count ?? CONTEST_PROBLEMS} problems
                  </span>
                </div>
                <div className="lcc-feat-actions">
                  <a className="lcc-feat-btn" href={r.url} target="_blank" rel="noreferrer">
                    {isLive ? 'Join on LeetCode' : 'View on LeetCode'}
                  </a>
                  <Link className="lcc-feat-btn lcc-feat-btn-ghost" to="/compete/leetcode">
                    <TrendingUp size={13} /> Predict rating
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <div className="lcc-filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`lcc-chip${filter === f.key ? ' lcc-chip-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="lcc-chip-count">{counts[f.key]}</span>
          </button>
        ))}
        <button
          type="button"
          className="lcc-sort"
          onClick={() => setNewestFirst((v) => !v)}
          title={newestFirst ? 'Newest first' : 'Oldest first'}
        >
          {newestFirst ? <ArrowDownWideNarrow size={14} /> : <ArrowUpNarrowWide size={14} />}
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {!isLoading && visible.length === 0 ? (
        <div className="lcc-empty">
          <CalendarOff size={40} />
          <p>No contests match this filter.</p>
          <span>Switch to All or Upcoming to see the projected schedule.</span>
        </div>
      ) : (
        <div className="lcc-list">
          <div className="lcc-row lcc-row-head">
            <span>Contest</span>
            <span>Status</span>
            <span>
              <Calendar size={13} /> Start
            </span>
            <span>
              <ListChecks size={13} /> Problems
            </span>
            <span>
              <Clock size={13} /> Duration
            </span>
            <span>Actions</span>
          </div>
          {visible.map((r) => {
            const meta = STATUS_META[r.status];
            const countdown =
              r.status === 'upcoming'
                ? `in ${formatCountdown(r.startMs - now)}`
                : r.status === 'ongoing'
                  ? `ends in ${formatCountdown(r.endMs - now)}`
                  : null;
            return (
              <div key={r.id} className="lcc-row">
                <span className="lcc-name">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer">
                      {r.name}
                    </a>
                  ) : (
                    <span>{r.name}</span>
                  )}
                  {countdown && (
                    <span className="lcc-countdown">
                      {r.status === 'ongoing' && <Radio size={11} />}
                      {countdown}
                    </span>
                  )}
                </span>
                <span>
                  <span className={`lcc-badge ${meta.cls}`}>{meta.label}</span>
                </span>
                <span className="lcc-time">{r.startMs ? formatStart(r.startMs) : '—'}</span>
                <span className="lcc-time">{r.problem_count ?? CONTEST_PROBLEMS}</span>
                <span className="lcc-time">{formatDuration(r.durMin)}</span>
                <span className="lcc-actions">
                  <Link
                    to="/compete/leetcode"
                    className="lcc-act"
                    title="Predict your rating change"
                  >
                    <TrendingUp size={13} />
                    Predict
                  </Link>
                  {r.status === 'finished' && (
                    <Link
                      to={`/compete/leetcode/contests/${(r.name || '').toLowerCase().replace(/\s+/g, '-')}/analytics`}
                      className="lcc-act lcc-act-ghost"
                      title="Per-question ratings & solve rates"
                    >
                      <BarChart3 size={13} />
                      Analytics
                    </Link>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* TODO(pghub-weekly): build the internal weekly ranked contest — a recurring
          PGHub-hosted round where members submit and get ranked on a live
          leaderboard. For now this is a placeholder linking to the existing
          internal contests area; wire it to a real schedule + leaderboard later. */}
      <section className="lcc-pghub">
        <div className="lcc-pghub-ico">
          <Sparkles size={20} />
        </div>
        <div className="lcc-pghub-body">
          <span className="lcc-pghub-tag">Coming soon</span>
          <h3 className="lcc-pghub-title">PGHub Weekly</h3>
          <p className="lcc-pghub-sub">
            A members-only weekly round, graded server-side, with a live ranked leaderboard.
            Show up, solve, climb the board.
          </p>
        </div>
        <Link to="/contests" className="lcc-pghub-cta">
          Browse contests
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}
