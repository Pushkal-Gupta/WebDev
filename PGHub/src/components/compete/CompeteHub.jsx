import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Swords, UserSearch, CalendarRange, LineChart, Code2,
  GitBranch, ListOrdered, Gauge, ArrowRight, ArrowLeft, Trophy, Brain, Cpu, BookOpen,
} from 'lucide-react';
import CompeteHubThumb from './CompeteHubThumbs';
import LeetCodeProfile from './LeetCodeProfile';
import ExternalContestsCalendar from '../contests/ExternalContestsCalendar';
import LeetCodeAnalytics, { pendingContestSince } from '../contests/LeetCodeAnalytics';
import { supabase } from '../../lib/supabase';
import { useProfile, useLeetCodeUser, useLcUserContestRank } from '../../lib/queries';
import './CompeteHub.css';

// Warm the LeetCode caches in the background the moment a signed-in user with a
// saved handle lands on Battle — so opening the analytics/dashboard is instant
// instead of waiting on the profile fetch + the (now ~3s) live-rank scan. React
// Query's staleTime bounds this to one warm-up per window, not per render.
function useLeetCodePrefetch() {
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser().then(({ data }) => { if (alive) setUserId(data?.user?.id ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const handle = useProfile(userId).data?.leetcode_handle?.trim() || '';
  const { data: lc } = useLeetCodeUser(handle);
  const attended = (lc?.history || []).filter((h) => h?.attended)
    .sort((a, b) => Number(a.startTime) - Number(b.startTime));
  const last = attended[attended.length - 1];
  const pending = last ? pendingContestSince(last) : null;
  const pendingSlug = pending ? pending.title.toLowerCase().replace(/\s+/g, '-') : null;
  const base = Math.round(Number(lc?.rating) || 0);
  useLcUserContestRank(pendingSlug, handle, base, !!pendingSlug);
}

const SECTIONS = {
  profile: {
    icon: UserSearch,
    label: 'User lookup',
    title: 'User lookup',
    sub: 'Pull any LeetCode profile — solved counts, streak, and contest history.',
    Body: LeetCodeProfile,
  },
  analytics: {
    icon: LineChart,
    label: 'Analytics',
    title: 'LeetCode analytics',
    sub: 'Per-contest rankings, solve stats, per-question rating estimates, and a rating-delta predictor from your rank.',
    Body: LeetCodeAnalytics,
  },
  calendar: {
    icon: CalendarRange,
    label: 'Calendar',
    title: 'Contest calendar',
    sub: 'Every judge and competition in one timeline, filtered by platform with live countdowns.',
    Body: ExternalContestsCalendar,
  },
};

const TAB_ORDER = ['profile', 'analytics', 'calendar'];

// Each entry maps to a distinct animated thumb via `thumbKey` (see
// CompeteHubThumbs) so every card draws an on-topic, moving mini-visual; chrome
// stays on the teal brand accent.
const EXPLORE = [
  {
    to: '/compete/leetcode/problems', icon: ListOrdered, thumbKey: 'problems',
    title: 'LeetCode problems', chip: 'Rated set',
    sub: 'Every rated contest problem — difficulty rating, solve-rate estimate, and per-contest charts.',
  },
  {
    to: '/compete/leetcode/contests', icon: Trophy, thumbKey: 'contests',
    title: 'LeetCode contests', chip: 'Weekly + biweekly',
    sub: 'Every weekly and biweekly round with live countdowns and status.',
  },
  {
    to: '/compete/competitions', icon: Gauge, thumbKey: 'competitions',
    title: 'Competitions', chip: 'CF · AtCoder · CC',
    sub: 'Codeforces, AtCoder, CodeChef rounds — one timeline with countdowns to the next start.',
  },
  {
    to: '/compete/hackathons', icon: Code2, thumbKey: 'hackathons',
    title: 'Hackathons', chip: 'Open sprints',
    sub: 'Weekend build sprints with prizes — themed challenges and open submission windows.',
  },
  {
    to: '/compete/conferences', icon: GitBranch, thumbKey: 'conferences',
    title: 'Conferences', chip: 'Deadlines',
    sub: 'Talks, deadlines, and program windows across the research and open-source calendar.',
  },
  {
    to: '/compete/kaggle', icon: Brain, thumbKey: 'kaggle',
    title: 'ML competitions', chip: 'Prize pools',
    sub: 'Live data-science and machine-learning contests — prize pools, deadlines, and fields at a glance.',
  },
  {
    to: '/compete/gsoc', icon: Code2, thumbKey: 'gsoc',
    title: 'GSoC explorer', chip: 'Orgs + ideas',
    sub: 'Mentoring organizations and their project ideas, filterable by domain and tech.',
  },
  {
    to: '/compete/leetcode/llms', icon: Cpu, thumbKey: 'llms',
    title: 'LLMs on LeetCode', chip: 'Solve rate',
    sub: 'How language models score on rated problems — solve rate by difficulty and projected rating.',
  },
  {
    to: '/compete/resources', icon: BookOpen, thumbKey: 'resources',
    title: 'Resources', chip: 'One shelf',
    sub: 'Foundations, practice, interview prep, and open-source paths — linked in one shelf.',
  },
];

// In-page section cards — clicking opens that section as its own full view
// rather than navigating to another route.
const SECTION_CARDS = [
  {
    section: 'profile', icon: UserSearch, thumbKey: 'lookup', chip: 'Any coder',
    title: 'User lookup',
    sub: 'Pull any LeetCode profile — solved counts, streak, and contest history at a glance.',
  },
  {
    section: 'analytics', icon: LineChart, thumbKey: 'predictor', chip: 'Elo model',
    title: 'Rating predictor',
    sub: 'Per-contest stats, per-question rating estimates, and a projected rating change from your rank.',
  },
  {
    section: 'calendar', icon: CalendarRange, thumbKey: 'calendar', chip: 'Every judge',
    title: 'Contest calendar',
    sub: 'Every judge and competition in one timeline, filtered by platform with live countdowns.',
  },
];

function CardFace({ entry }) {
  const { icon: Icon, thumbKey, title, sub, chip } = entry;
  return (
    <>
      <div className="compete-card-thumb" aria-hidden="true">
        <CompeteHubThumb thumbKey={thumbKey} />
      </div>
      <div className="compete-card-head">
        <span className="compete-card-iconbox"><Icon size={18} /></span>
        {chip && <span className="compete-card-chip">{chip}</span>}
        <ArrowRight size={16} className="compete-card-arrow" />
      </div>
      <h3 className="compete-card-title">{title}</h3>
      <p className="compete-card-sub">{sub}</p>
    </>
  );
}

export default function CompeteHub() {
  const [active, setActive] = useState(null);
  useLeetCodePrefetch();

  if (active) {
    const { icon: Icon, title, sub, Body } = SECTIONS[active];
    return (
      <div className="compete-hub">
        <div className="compete-view">
          <header className="compete-view-head">
            <button type="button" className="compete-back" onClick={() => setActive(null)}>
              <ArrowLeft size={15} /> Back to Compete
            </button>
            <nav className="compete-view-switch" aria-label="Switch section">
              {TAB_ORDER.map((key) => {
                const S = SECTIONS[key];
                const SIcon = S.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`compete-switch-tab${key === active ? ' on' : ''}`}
                    onClick={() => setActive(key)}
                  >
                    <SIcon size={13} /> {S.label}
                  </button>
                );
              })}
            </nav>
          </header>
          <div className="compete-view-title">
            <span className="compete-view-iconbox"><Icon size={22} /></span>
            <div>
              <h1 className="compete-view-h1">{title}</h1>
              <p className="compete-view-sub">{sub}</p>
            </div>
          </div>
          <div className="compete-view-body">
            <Body />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compete-hub">
      <header className="compete-hero">
        <h1 className="compete-title"><Swords size={26} /> <span className="compete-pg">PG</span>Compete</h1>
        <p className="compete-sub">
          Look up any coder, track every contest across the judges, predict your rating, and jump to the next round, hackathon, or conference.
        </p>
      </header>

      <div className="compete-card-grid">
        {/* Section cards first (minus the calendar), then explore links, then the
            contest calendar card LAST — it's a reference timeline, not a daily entry. */}
        {SECTION_CARDS.filter((e) => e.section !== 'calendar').map((e) => (
          <button
            key={e.section}
            type="button"
            className="compete-card"
            onClick={() => setActive(e.section)}
          >
            <CardFace entry={e} />
          </button>
        ))}
        {EXPLORE.map((e) => (
          <Link key={e.to} to={e.to} className="compete-card">
            <CardFace entry={e} />
          </Link>
        ))}
        {SECTION_CARDS.filter((e) => e.section === 'calendar').map((e) => (
          <button
            key={e.section}
            type="button"
            className="compete-card"
            onClick={() => setActive(e.section)}
          >
            <CardFace entry={e} />
          </button>
        ))}
      </div>
    </div>
  );
}
