import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CalendarRange } from 'lucide-react';
import { useExternalContests } from '../../lib/queries';
import ContestsGalleryGrid from './ContestsGalleryGrid';
import './Contests.css';

const PLATFORMS = [
  { key: 'leetcode',   label: 'LeetCode',   hue: 'var(--medium)' },
  { key: 'codeforces', label: 'Codeforces', hue: 'var(--hue-sky)' },
  { key: 'atcoder',    label: 'AtCoder',    hue: 'var(--warning)' },
  { key: 'codechef',   label: 'CodeChef',   hue: 'var(--hue-violet)' },
  { key: 'devpost',    label: 'DevPost',    hue: 'var(--hue-pink)' },
  { key: 'kaggle',     label: 'Kaggle',     hue: 'var(--hue-mint)' },
  { key: 'gsoc',       label: 'GSoC',       hue: 'var(--accent)' },
];
const PLATFORM_HUE = Object.fromEntries(PLATFORMS.map(p => [p.key, p.hue]));
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

export default function ExternalContestsCalendar() {
  const { data: contests = [], isLoading } = useExternalContests();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const presentPlatforms = useMemo(() => {
    const seen = new Set(contests.map(c => c.platform));
    return PLATFORMS.filter(p => seen.has(p.key));
  }, [contests]);

  // Week strip: next 7 days, count of upcoming/ongoing contests per day,
  // grouped into platform-hued segments for an at-a-glance stacked bar.
  const week = useMemo(() => {
    const base = new Date(now); base.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base.getTime() + i * DAY_MS);
      return { date: d, items: [] };
    });
    for (const c of contests) {
      const t = new Date(c.start_time).getTime();
      const idx = Math.floor((t - base.getTime()) / DAY_MS);
      if (idx >= 0 && idx < 7) days[idx].items.push(c);
    }
    for (const d of days) {
      const byPlat = new Map();
      for (const c of d.items) byPlat.set(c.platform, (byPlat.get(c.platform) || 0) + 1);
      d.segments = [...byPlat.entries()].map(([platform, n]) => ({
        platform, n, hue: PLATFORM_HUE[platform] || 'var(--accent)',
      }));
    }
    const max = Math.max(1, ...days.map(d => d.items.length));
    return { days, max };
  }, [contests, now]);

  const { liveNow, upcomingTotal, nextUp } = useMemo(() => {
    let live = 0, up = 0, next = null;
    for (const c of contests) {
      const ph = phaseOf(c, now);
      if (ph === 'ongoing') live++;
      else if (ph === 'upcoming') {
        up++;
        const t = new Date(c.start_time).getTime();
        if (!next || t < new Date(next.start_time).getTime()) next = c;
      }
    }
    return { liveNow: live, upcomingTotal: up, nextUp: next };
  }, [contests, now]);

  const upcoming7d = useMemo(
    () => week.days.reduce((acc, d) => acc + d.items.filter(c => phaseOf(c, now) !== 'finished').length, 0),
    [week, now],
  );

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
        Live and upcoming contests across every platform — countdown rings tick down to the start.
      </p>

      {/* Compact summary + slim 7-day strip — no tall empty bands */}
      <div className="exc-summary">
        <div className="exc-stat">
          <span className="exc-stat-n" style={{ color: 'var(--easy)' }}>{liveNow}</span>
          <span className="exc-stat-l">live now</span>
        </div>
        <div className="exc-stat">
          <span className="exc-stat-n">{upcoming7d}</span>
          <span className="exc-stat-l">next 7 days</span>
        </div>
        <div className="exc-stat">
          <span className="exc-stat-n">{upcomingTotal}</span>
          <span className="exc-stat-l">upcoming</span>
        </div>
        <div className="exc-stat">
          <span className="exc-stat-n">{presentPlatforms.length}</span>
          <span className="exc-stat-l">platforms</span>
        </div>
        {nextUp && (
          <div className="exc-next">
            <span className="exc-next-lbl">Next up</span>
            <span className="exc-next-name" title={nextUp.name}>
              <span className="exc-next-dot" style={{ background: PLATFORM_HUE[nextUp.platform] || 'var(--accent)' }} />
              {nextUp.name}
            </span>
            <span className="exc-next-when">{fmtCountdown(new Date(nextUp.start_time).getTime() - now)}</span>
          </div>
        )}
      </div>

      {/* This-week timeline — stacked platform-hued bars per upcoming day */}
      <div className="exc-week" aria-label="This week">
        <span className="exc-week-head">
          <CalendarRange size={13} /> This week
        </span>
        <div className="exc-week-grid">
          {week.days.map((d, i) => (
            <div key={i} className={`exc-day${i === 0 ? ' today' : ''}${d.items.length ? ' has' : ''}`}>
              <span className="exc-day-bar" aria-hidden="true">
                {d.segments.map((s, j) => (
                  <span
                    key={j}
                    className="exc-day-seg"
                    title={`${PLATFORM_HUE[s.platform] ? s.platform : 'other'}: ${s.n}`}
                    style={{ background: s.hue, flexGrow: s.n, '--seg-h': `${(d.items.length / week.max) * 100}%` }}
                  />
                ))}
              </span>
              <span className="exc-day-n">{d.items.length || '·'}</span>
              <span className="exc-day-lbl">
                {i === 0 ? 'Today' : d.date.toLocaleDateString(undefined, { weekday: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Colorful card gallery — platform filter + live countdowns live inside */}
      <ContestsGalleryGrid contests={contests} />
    </div>
  );
}
