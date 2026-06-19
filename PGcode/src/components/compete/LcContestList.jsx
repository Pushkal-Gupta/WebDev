import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Calendar,
  Radio,
  ChevronRight,
  CalendarOff,
  ArrowLeft,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
} from 'lucide-react';
import './LcContestList.css';
import { useExternalContests } from '../../lib/queries';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'finished', label: 'Finished' },
];

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
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatStart(ms) {
  return new Date(ms).toLocaleString(undefined, {
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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const contests = useMemo(() => {
    const rows = (data || []).filter((r) => r.platform === 'leetcode');
    const dir = newestFirst ? -1 : 1;
    return rows
      .map((r) => {
        const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;
        const durMin = r.duration_minutes ?? 0;
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

  return (
    <div className="lcc-container">
      <Link to="/compete/leetcode" className="lcc-back">
        <ArrowLeft size={14} />
        Back to LeetCode
      </Link>

      <nav className="lcc-breadcrumb">
        <Link to="/compete">Compete</Link>
        <ChevronRight size={13} />
        <Link to="/compete/leetcode">LeetCode</Link>
        <ChevronRight size={13} />
        <span>Contests</span>
      </nav>

      <header className="lcc-header">
        <h1 className="lcc-title">
          <Trophy size={24} className="lcc-title-icon" />
          LeetCode contests
        </h1>
        <p className="lcc-sub">
          Weekly and biweekly contest schedule — start times, durations, and live countdowns.
        </p>
      </header>

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
          <p>No LeetCode contests to show right now.</p>
          <span>Check back soon — the schedule updates as new contests are announced.</span>
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
              <Clock size={13} /> Duration
            </span>
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
                <span className="lcc-time">{formatDuration(r.durMin)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
