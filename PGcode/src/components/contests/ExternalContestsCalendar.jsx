import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, ExternalLink, Radio } from 'lucide-react';
import { useExternalContests } from '../../lib/queries';
import './Contests.css';

const PLATFORMS = [
  { key: 'leetcode',   label: 'LeetCode',   hue: 'var(--medium)' },
  { key: 'codeforces', label: 'Codeforces', hue: 'var(--hue-sky)' },
  { key: 'atcoder',    label: 'AtCoder',    hue: 'var(--text-main)' },
  { key: 'codechef',   label: 'CodeChef',   hue: 'var(--hue-violet)' },
  { key: 'devpost',    label: 'DevPost',    hue: 'var(--hue-pink)' },
  { key: 'kaggle',     label: 'Kaggle',     hue: 'var(--hue-mint)' },
  { key: 'gsoc',       label: 'GSoC',       hue: 'var(--accent)' },
];
const PLATFORM_HUE = Object.fromEntries(PLATFORMS.map(p => [p.key, p.hue]));
const PLATFORM_LABEL = Object.fromEntries(PLATFORMS.map(p => [p.key, p.label]));
const DAY_MS = 86_400_000;

function phaseOf(c, now) {
  const start = new Date(c.start_time).getTime();
  const end = start + (c.duration_minutes || 0) * 60_000;
  if (now < start) return 'upcoming';
  if (now > end) return 'finished';
  return 'ongoing';
}

function fmtCountdown(ms) {
  if (ms <= 0) return 'now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtDuration(min) {
  if (min >= 1440) {
    const d = Math.round(min / 1440);
    return `${d}d`;
  }
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${min}m`;
}

function googleCalUrl(c) {
  const start = new Date(c.start_time);
  const end = new Date(start.getTime() + (c.duration_minutes || 60) * 60_000);
  const z = (n) => String(n).padStart(2, '0');
  const fmt = (dt) =>
    `${dt.getUTCFullYear()}${z(dt.getUTCMonth() + 1)}${z(dt.getUTCDate())}T${z(dt.getUTCHours())}${z(dt.getUTCMinutes())}00Z`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${PLATFORM_LABEL[c.platform] || c.platform}: ${c.name}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: c.url ? `Contest link: ${c.url}` : '',
    location: c.url || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Countdown ring: full when contest is >7d out, empties as it approaches.
function CountdownRing({ msLeft, hue, live }) {
  const R = 13, C = 2 * Math.PI * R;
  const frac = live ? 1 : clamp(1 - msLeft / (7 * DAY_MS), 0, 1);
  const dash = C * frac;
  return (
    <svg className="exc-ring" viewBox="0 0 34 34" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle cx="17" cy="17" r={R} className="exc-ring-track" />
      <circle
        cx="17" cy="17" r={R}
        className={`exc-ring-fill${live ? ' live' : ''}`}
        style={{ stroke: hue, strokeDasharray: `${dash} ${C}` }}
        transform="rotate(-90 17 17)"
      />
      {live
        ? <circle cx="17" cy="17" r="3.5" className="exc-ring-pulse" style={{ fill: hue }} />
        : <circle cx="17" cy="17" r="2.5" className="exc-ring-core" style={{ fill: hue }} />}
    </svg>
  );
}

export default function ExternalContestsCalendar() {
  const { data: contests = [], isLoading } = useExternalContests();
  const [active, setActive] = useState(() => new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const presentPlatforms = useMemo(() => {
    const seen = new Set(contests.map(c => c.platform));
    return PLATFORMS.filter(p => seen.has(p.key));
  }, [contests]);

  const filtered = useMemo(() => {
    if (active.size === 0) return contests;
    return contests.filter(c => active.has(c.platform));
  }, [contests, active]);

  const sorted = useMemo(() => {
    const order = { ongoing: 0, upcoming: 1, finished: 2 };
    return [...filtered].sort((a, b) => {
      const pa = order[phaseOf(a, now)], pb = order[phaseOf(b, now)];
      if (pa !== pb) return pa - pb;
      const ta = new Date(a.start_time).getTime(), tb = new Date(b.start_time).getTime();
      return pa === 2 ? tb - ta : ta - tb;
    });
  }, [filtered, now]);

  // Week strip: next 7 days, count of upcoming/ongoing contests per day.
  const week = useMemo(() => {
    const base = new Date(now); base.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getTime() + i * DAY_MS);
      return { date: d, items: [] };
    });
    for (const c of filtered) {
      const t = new Date(c.start_time).getTime();
      const idx = Math.floor((t - base.getTime()) / DAY_MS);
      if (idx >= 0 && idx < 7) days[idx].items.push(c);
    }
    const max = Math.max(1, ...days.map(d => d.items.length));
    return { days, max };
  }, [filtered, now]);

  const toggle = (key) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="ctx-skeleton">
        <div className="skel skel-row-full" />
        <div className="skel skel-row-full" />
        <div className="skel skel-row-full" />
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="ctx-empty">
        <CalendarPlus size={30} className="ctx-empty-icon" />
        <h2 className="ctx-empty-title">No external contests loaded yet</h2>
        <p className="ctx-empty-sub">
          Apply <code>migrate-50-external-contests.sql</code> and run{' '}
          <code>scripts/seed-external-contests.mjs</code> to populate the calendar.
        </p>
      </div>
    );
  }

  return (
    <div className="exc-wrap">
      <p className="ctx-sub exc-intro">
        Every contest in one timeline — countdown rings tick live.
      </p>

      <div className="exc-chips" role="group" aria-label="Filter by platform">
        <button
          className={`exc-chip${active.size === 0 ? ' on' : ''}`}
          onClick={() => setActive(new Set())}
        >
          All
        </button>
        {presentPlatforms.map(p => (
          <button
            key={p.key}
            className={`exc-chip${active.has(p.key) ? ' on' : ''}`}
            style={{ '--chip-hue': p.hue }}
            onClick={() => toggle(p.key)}
          >
            <span className="exc-chip-dot" />
            {p.label}
          </button>
        ))}
      </div>

      {/* Week strip */}
      <div className="exc-week" aria-label="Next 7 days">
        {week.days.map((d, i) => {
          const isToday = i === 0;
          const h = `${(d.items.length / week.max) * 100}%`;
          return (
            <div key={i} className={`exc-week-day${isToday ? ' today' : ''}`}>
              <div className="exc-week-bar-track">
                <div className="exc-week-bar" style={{ height: d.items.length ? h : '0%' }}>
                  {d.items.slice(0, 3).map((c, j) => (
                    <span
                      key={j}
                      className="exc-week-seg"
                      style={{ background: PLATFORM_HUE[c.platform] || 'var(--accent)' }}
                    />
                  ))}
                </div>
              </div>
              <span className="exc-week-n">{d.items.length || ''}</span>
              <span className="exc-week-lbl">
                {isToday ? 'Today' : d.date.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline cards */}
      <div className="exc-tl">
        {sorted.map(c => {
          const start = new Date(c.start_time).getTime();
          const phase = phaseOf(c, now);
          const hue = PLATFORM_HUE[c.platform] || 'var(--accent)';
          const msLeft = start - now;
          return (
            <div
              key={c.id}
              className={`exc-card exc-card-${phase}`}
              style={{ '--card-hue': hue }}
            >
              <CountdownRing msLeft={msLeft} hue={hue} live={phase === 'ongoing'} />
              <div className="exc-card-body">
                <div className="exc-card-top">
                  <span className="exc-card-platform">{PLATFORM_LABEL[c.platform] || c.platform}</span>
                  <span className={`exc-card-state exc-card-state-${phase}`}>
                    {phase === 'ongoing' && (<><Radio size={10} /> live</>)}
                    {phase === 'upcoming' && fmtCountdown(msLeft)}
                    {phase === 'finished' && 'ended'}
                  </span>
                </div>
                <span className="exc-card-name" title={c.name}>{c.name}</span>
                <span className="exc-card-when">{fmtDate(c.start_time)} · {fmtDuration(c.duration_minutes)}</span>
              </div>
              <div className="exc-card-actions">
                {phase !== 'finished' && (
                  <a
                    className="exc-card-link"
                    href={googleCalUrl(c)}
                    target="_blank"
                    rel="noreferrer"
                    title="Add to Google Calendar"
                  >
                    <CalendarPlus size={13} />
                  </a>
                )}
                {c.url && (
                  <a
                    className="exc-card-link"
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Open contest"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
