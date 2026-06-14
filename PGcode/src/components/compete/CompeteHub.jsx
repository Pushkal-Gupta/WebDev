import React, { useEffect, useMemo, useState } from 'react';
import {
  Swords, UserSearch, CalendarRange, LineChart, Code2, Database,
  GitBranch, Clock, Calendar, ArrowUpRight, CalendarOff, Radio,
} from 'lucide-react';
import { useExternalContests } from '../../lib/queries';
import LeetCodeProfile from './LeetCodeProfile';
import ExternalContestsCalendar from '../contests/ExternalContestsCalendar';
import LeetCodeAnalytics from '../contests/LeetCodeAnalytics';
import './CompeteHub.css';

const SECTIONS = [
  { key: 'profile',    label: 'User lookup',  icon: UserSearch },
  { key: 'calendar',   label: 'Calendar',     icon: CalendarRange },
  { key: 'analytics',  label: 'Analytics',    icon: LineChart },
  { key: 'hackathons', label: 'Hackathons',   icon: Code2 },
  { key: 'kaggle',     label: 'Kaggle',       icon: Database },
  { key: 'gsoc',       label: 'GSoC',         icon: GitBranch },
];

const PLATFORM_CARDS = [
  {
    key: 'hackathons', platform: 'devpost', icon: Code2, hue: 'var(--hue-pink)',
    label: 'DevPost', title: 'Hackathons',
    sub: 'Build something in a weekend — themed sprints with prizes and open submissions.',
  },
  {
    key: 'kaggle', platform: 'kaggle', icon: Database, hue: 'var(--hue-mint)',
    label: 'Kaggle', title: 'Kaggle competitions',
    sub: 'Modeling challenges on real datasets — climb the leaderboard, ship a notebook.',
  },
  {
    key: 'gsoc', platform: 'gsoc', icon: GitBranch, hue: 'var(--accent)',
    label: 'GSoC', title: 'Open-source programs',
    sub: 'Google Summer of Code milestones — proposal windows, coding periods, and deadlines.',
  },
];

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
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtDuration(min) {
  if (!min) return null;
  if (min >= 1440) {
    const d = Math.round(min / 1440);
    return `${d} day${d > 1 ? 's' : ''}`;
  }
  if (min >= 60) {
    const h = Math.round(min / 60);
    return `${h}h`;
  }
  return `${min} min`;
}

function PlatformCard({ c, meta, now }) {
  const phase = phaseOf(c, now);
  const start = new Date(c.start_time).getTime();
  const dur = fmtDuration(c.duration_minutes);
  const Icon = meta.icon;
  return (
    <a
      className="compete-card"
      href={c.url || undefined}
      target={c.url ? '_blank' : undefined}
      rel={c.url ? 'noreferrer' : undefined}
      style={{ '--card-hue': meta.hue }}
    >
      <div className="compete-card-head">
        <span className="compete-card-platform"><Icon size={11} /> {meta.label}</span>
        <span className={`compete-card-phase${phase === 'ongoing' ? ' live' : ''}`}>
          {phase === 'ongoing' && <><Radio size={10} /> live</>}
          {phase === 'upcoming' && 'upcoming'}
          {phase === 'finished' && 'ended'}
        </span>
      </div>
      <h3 className="compete-card-name">{c.name}</h3>
      <div className="compete-card-meta">
        <span><Calendar size={12} /> {fmtDate(c.start_time)}</span>
        {dur && <span><Clock size={12} /> {dur}</span>}
      </div>
      <div className="compete-countdown">
        {phase === 'upcoming' && (
          <>
            <span className="compete-countdown-val">{fmtCountdown(start - now)}</span>
            <span className="compete-countdown-lbl">until start</span>
          </>
        )}
        {phase === 'ongoing' && (
          <>
            <span className="compete-countdown-val">open</span>
            <span className="compete-countdown-lbl">submissions live</span>
          </>
        )}
        {phase === 'finished' && (
          <>
            <span className="compete-countdown-val">closed</span>
            <span className="compete-countdown-lbl">{fmtDate(c.start_time)}</span>
          </>
        )}
        {c.url && (
          <span className="compete-card-cta" style={{ marginLeft: 'auto' }}>
            Open <ArrowUpRight size={13} />
          </span>
        )}
      </div>
    </a>
  );
}

function PlatformSection({ meta, contests, isLoading, now }) {
  const Icon = meta.icon;
  const rows = useMemo(() => {
    const order = { ongoing: 0, upcoming: 1, finished: 2 };
    return contests
      .filter(c => c.platform === meta.platform)
      .sort((a, b) => {
        const pa = order[phaseOf(a, now)];
        const pb = order[phaseOf(b, now)];
        if (pa !== pb) return pa - pb;
        return new Date(a.start_time) - new Date(b.start_time);
      });
  }, [contests, meta.platform, now]);

  return (
    <section className="compete-section" id={`compete-${meta.key}`}>
      <div className="compete-section-head">
        <Icon size={20} />
        <div>
          <h2 className="compete-section-title">{meta.title}</h2>
          <p className="compete-section-sub">{meta.sub}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="compete-skel">
          <div className="compete-skel-card" />
          <div className="compete-skel-card" />
          <div className="compete-skel-card" />
        </div>
      ) : rows.length === 0 ? (
        <div className="compete-empty">
          <CalendarOff size={26} />
          <h3 className="compete-empty-title">Nothing scheduled right now</h3>
          <p className="compete-empty-sub">
            {meta.label} entries appear here as soon as new rounds open.
          </p>
        </div>
      ) : (
        <div className="compete-grid">
          {rows.map(c => <PlatformCard key={c.id} c={c} meta={meta} now={now} />)}
        </div>
      )}
    </section>
  );
}

export default function CompeteHub() {
  const { data: contests = [], isLoading } = useExternalContests();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const jump = (key) => {
    const el = document.getElementById(`compete-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="compete-hub">
      <header className="compete-hero">
        <h1 className="compete-title"><Swords size={26} /> Compete</h1>
        <p className="compete-sub">
          Look up any coder, track every contest across the judges, predict your rating, and find the next hackathon, Kaggle round, or GSoC deadline.
        </p>
      </header>

      <nav className="compete-tabs" aria-label="Jump to section">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button key={s.key} className="compete-tab" onClick={() => jump(s.key)}>
              <Icon size={13} /> {s.label}
            </button>
          );
        })}
      </nav>

      <section className="compete-section" id="compete-profile">
        <div className="compete-section-head">
          <UserSearch size={20} />
          <div>
            <h2 className="compete-section-title">User lookup</h2>
            <p className="compete-section-sub">Pull any LeetCode profile — solved counts, streak, and contest history.</p>
          </div>
        </div>
        <LeetCodeProfile />
      </section>

      <section className="compete-section" id="compete-calendar">
        <div className="compete-section-head">
          <CalendarRange size={20} />
          <div>
            <h2 className="compete-section-title">Contest calendar</h2>
            <p className="compete-section-sub">Every judge and competition in one timeline, filtered by platform with live countdowns.</p>
          </div>
        </div>
        <ExternalContestsCalendar />
      </section>

      <section className="compete-section" id="compete-analytics">
        <div className="compete-section-head">
          <LineChart size={20} />
          <div>
            <h2 className="compete-section-title">LeetCode analytics</h2>
            <p className="compete-section-sub">Per-contest rankings, solve stats, and a rating-delta predictor from your rank.</p>
          </div>
        </div>
        <LeetCodeAnalytics />
      </section>

      {PLATFORM_CARDS.map(meta => (
        <PlatformSection
          key={meta.key}
          meta={meta}
          contests={contests}
          isLoading={isLoading}
          now={now}
        />
      ))}
    </div>
  );
}
