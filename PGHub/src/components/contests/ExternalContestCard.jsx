import React from 'react';
import { CalendarPlus, ExternalLink, Radio, Clock, Users } from 'lucide-react';

const DAY_MS = 86_400_000;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const PLATFORM_LABEL = {
  leetcode: 'LeetCode',
  codeforces: 'Codeforces',
  atcoder: 'AtCoder',
  codechef: 'CodeChef',
  devpost: 'DevPost',
  kaggle: 'Kaggle',
  gsoc: 'GSoC',
};

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
  if (!min) return '—';
  if (min >= 1440) return `${Math.round(min / 1440)}d`;
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${min}m`;
}

function fmtCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
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

// Countdown ring: full when contest is >7d out, empties as it approaches.
function CountdownRing({ msLeft, hue, live }) {
  const R = 15, C = 2 * Math.PI * R;
  const frac = live ? 1 : clamp(1 - msLeft / (7 * DAY_MS), 0, 1);
  const dash = C * frac;
  return (
    <svg className="exc-ring" viewBox="0 0 38 38" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle cx="19" cy="19" r={R} className="exc-ring-track" />
      <circle
        cx="19" cy="19" r={R}
        className={`exc-ring-fill${live ? ' live' : ''}`}
        style={{ stroke: hue, strokeDasharray: `${dash} ${C}` }}
        transform="rotate(-90 19 19)"
      />
      {live
        ? <circle cx="19" cy="19" r="4" className="exc-ring-pulse" style={{ fill: hue }} />
        : <circle cx="19" cy="19" r="3" className="exc-ring-core" style={{ fill: hue }} />}
    </svg>
  );
}

function participantCount(c) {
  const e = c.extra || {};
  const raw = e.participants ?? e.participant_count ?? e.registered ?? e.num_participants;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function ExternalContestCard({ contest, now, hue }) {
  const c = contest;
  const start = new Date(c.start_time).getTime();
  const phase = phaseOf(c, now);
  const cardHue = hue || 'var(--accent)';
  const msLeft = start - now;
  const participants = participantCount(c);

  const openContest = () => {
    if (c.url) window.open(c.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`exc-contest-card exc-contest-${phase}${c.url ? ' exc-contest-clickable' : ''}`}
      style={{ '--card-hue': cardHue }}
      role={c.url ? 'link' : undefined}
      tabIndex={c.url ? 0 : undefined}
      onClick={c.url ? openContest : undefined}
      onKeyDown={c.url ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openContest(); } } : undefined}
      title={c.url ? 'Open contest' : undefined}
    >
      <div className="exc-contest-head">
        <CountdownRing msLeft={msLeft} hue={cardHue} live={phase === 'ongoing'} />
        <div className="exc-contest-badges">
          <span className="exc-contest-platform">{PLATFORM_LABEL[c.platform] || c.platform}</span>
          <span className={`exc-contest-state exc-contest-state-${phase}`}>
            {phase === 'ongoing' && (<><Radio size={11} /> live</>)}
            {phase === 'upcoming' && fmtCountdown(msLeft)}
            {phase === 'finished' && 'ended'}
          </span>
        </div>
      </div>

      <span className="exc-contest-name" title={c.name}>{c.name}</span>

      <div className="exc-contest-meta">
        <span className="exc-contest-when">{fmtDate(c.start_time)}</span>
        <div className="exc-contest-tags">
          <span className="exc-contest-tag"><Clock size={11} /> {fmtDuration(c.duration_minutes)}</span>
          {participants && <span className="exc-contest-tag"><Users size={11} /> {fmtCount(participants)}</span>}
        </div>
      </div>

      <div className="exc-contest-actions">
        {phase !== 'finished' && (
          <a
            className="exc-contest-link"
            href={googleCalUrl(c)}
            target="_blank"
            rel="noreferrer"
            title="Add to Google Calendar"
            onClick={(e) => e.stopPropagation()}
          >
            <CalendarPlus size={13} /> Add
          </a>
        )}
        {c.url && (
          <a
            className="exc-contest-link exc-contest-link-primary"
            href={c.url}
            target="_blank"
            rel="noreferrer"
            title="Open contest"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={13} /> Open
          </a>
        )}
      </div>
    </div>
  );
}
