import React, { useEffect, useMemo, useState } from 'react';
import { CalendarX } from 'lucide-react';
import ExternalContestCard from './ExternalContestCard';

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

function phaseOf(c, now) {
  const start = new Date(c.start_time).getTime();
  const end = start + (c.duration_minutes || 0) * 60_000;
  if (now < start) return 'upcoming';
  if (now > end) return 'finished';
  return 'ongoing';
}

export default function ContestsGalleryGrid({ contests = [] }) {
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

  const toggle = (key) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="exc-card-grid">
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

      {sorted.length === 0 ? (
        <div className="exc-gallery-empty">
          <CalendarX size={28} className="exc-gallery-empty-icon" />
          <p className="exc-gallery-empty-title">
            {active.size > 0 ? 'No contests for these platforms' : 'No upcoming contests right now'}
          </p>
          <p className="exc-gallery-empty-sub">
            {active.size > 0
              ? 'Clear the filter to see every contest on the calendar.'
              : 'Check back soon — new rounds get listed as platforms announce them.'}
          </p>
        </div>
      ) : (
        <div className="exc-gallery" aria-label="Contests">
          {sorted.map(c => (
            <ExternalContestCard
              key={c.id}
              contest={c}
              now={now}
              hue={PLATFORM_HUE[c.platform] || 'var(--accent)'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
