import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Clock, Star, Radio, CalendarClock, History, Infinity as InfinityIcon, Gauge } from 'lucide-react';
import { useContests } from '../../lib/queries';
import ForgeThumb from '../ml/forge/ForgeThumb';
import './Contests.css';

// Map the contest's flavour (name + difficulty) to a fitting ForgeThumb motif;
// fall back to 'auto' so the seed-hash spreads the rest across distinct motifs.
function contestThumbKind(c) {
  const text = `${c.name || ''} ${c.description || ''}`.toLowerCase();
  if (/graph|tree|network|shortest|path|dijkstra/.test(text)) return 'network';
  if (/\bdp\b|dynamic|knapsack|subsequence|matrix/.test(text)) return 'matrix';
  if (/slid|window|array|two.?pointer|prefix|subarray/.test(text)) return 'bars';
  if (/search|binary|sort|scan/.test(text)) return 'scatter';
  if (/string|hash|trie/.test(text)) return 'bits';
  if (/speed|sprint|round|weekly|daily|timed/.test(text)) return 'rings';
  return 'auto';
}

function fmtDuration(min) {
  if (!min) return '—';
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${min} min`;
}

// Derive a status purely from the columns that exist — never fabricate one.
// starts_at null => on-demand virtual contest; otherwise upcoming/live/ended.
function contestStatus(c, now) {
  if (!c.starts_at) return { key: 'virtual', label: 'Virtual', Icon: InfinityIcon };
  const start = new Date(c.starts_at).getTime();
  const end = c.ends_at
    ? new Date(c.ends_at).getTime()
    : start + (c.duration_minutes || 0) * 60_000;
  if (now < start) return { key: 'upcoming', label: 'Upcoming', Icon: CalendarClock };
  if (now > end) return { key: 'ended', label: 'Ended', Icon: History };
  return { key: 'live', label: 'Live', Icon: Radio };
}

export default function ContestsIndex() {
  return (
    <div className="ctx-container">
      <header className="ctx-header">
        <h1 className="ctx-title"><span style={{ color: 'var(--text-dim)', fontSize: '0.6em', opacity: 0.55, fontWeight: 600 }}>PG</span>Arena</h1>
        <p className="ctx-sub">
          Virtual ICPC-style problem sets — start whenever, the clock runs while you solve.
        </p>
      </header>

      <InternalContests />
    </div>
  );
}

function InternalContests() {
  const { data: contests = [], isLoading } = useContests();
  const [now] = useState(() => Date.now());

  if (isLoading) {
    return (
      <div className="ctx-skeleton">
        <div className="skel skel-text" />
        <div className="skel skel-row-full" />
        <div className="skel skel-row-full" />
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div className="ctx-empty">
        <Trophy size={32} className="ctx-empty-icon" />
        <h2 className="ctx-empty-title">No contests yet</h2>
        <p className="ctx-empty-sub">New contests appear here as they go live.</p>
      </div>
    );
  }

  const featured = contests.filter(c => c.is_featured);
  const others = contests.filter(c => !c.is_featured);

  return (
    <div className="ctx-internal">
      {featured.length > 0 && (
        <section className="ctx-section">
          <h2 className="ctx-section-title">Featured</h2>
          <div className="ctx-grid">
            {featured.map(c => <ContestCard key={c.slug} c={c} now={now} />)}
          </div>
        </section>
      )}
      {others.length > 0 && (
        <section className="ctx-section ctx-section-grow">
          <h2 className="ctx-section-title">All contests</h2>
          <div className="ctx-grid">
            {others.map(c => <ContestCard key={c.slug} c={c} now={now} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ContestCard({ c, now }) {
  const diff = c.difficulty || 'Mixed';
  const status = contestStatus(c, now);
  const StatusIcon = status.Icon;
  return (
    <Link to={`/contests/${c.slug}`} className="ctx-card">
      <div className="ctx-card-thumb">
        <ForgeThumb seed={c.name || c.slug} kind={contestThumbKind(c)} label={diff} />
      </div>

      <div className="ctx-card-head">
        <span className="ctx-card-avatar"><Trophy size={15} /></span>
        <h3 className="ctx-card-title">{c.name}</h3>
        {c.is_featured && (
          <span className="ctx-card-flag" title="Featured"><Star size={11} /></span>
        )}
      </div>

      <div className="ctx-card-badges">
        <span className={`ctx-diff ctx-diff-${diff.toLowerCase()}`}>
          <Gauge size={10} /> {diff}
        </span>
        <span className={`ctx-status ctx-status-${status.key}`}>
          <StatusIcon size={10} /> {status.label}
        </span>
      </div>

      {c.description && <p className="ctx-card-desc">{c.description}</p>}

      <div className="ctx-card-foot">
        <span className="ctx-chip"><Clock size={11} /> {fmtDuration(c.duration_minutes)}</span>
        <ArrowRight size={14} className="ctx-card-arrow" />
      </div>
    </Link>
  );
}
