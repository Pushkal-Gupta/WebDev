import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronRight, Trophy, Clock, Play, Square, Award,
  Hourglass, Flag, Target, CalendarClock, Layers, ListChecks, Gauge,
  ListOrdered, Globe, TrendingUp, TrendingDown, Minus, ChevronLeft,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  useContest, useContestProblems, useContestAttempt, useUserProgress,
  useLcContestRanking,
} from '../../lib/queries';
import { predictDelta, SAMPLE_FIELD, TOTAL_PARTICIPANTS } from './LeetCodeAnalytics';
import StatusPill from '../StatusPill';
import { legacyToStatus } from '../../lib/status';
import Breadcrumb from '../common/Breadcrumb';
import './Contests.css';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function fmtMmSs(seconds) {
  if (seconds == null || seconds < 0) return '--:--';
  const s = Math.max(0, Math.floor(seconds));
  const total = Math.floor(s);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const p = (n) => String(n).padStart(2, '0');
  return hh > 0 ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

function fmtDuration(min) {
  if (!min) return '—';
  if (min >= 1440) {
    const d = Math.floor(min / 1440);
    const h = Math.round((min % 1440) / 60);
    return h ? `${d}d ${h}h` : `${d}d`;
  }
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
  return `${min} min`;
}

function fmtDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// LeetCode finish_time arrives as a unix-seconds wall-clock stamp; the contest
// start isn't always exposed per-row, so we render the absolute time-of-day.
function fmtFinish(finishTime) {
  if (!finishTime) return '—';
  const ms = finishTime < 1e12 ? finishTime * 1000 : finishTime;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const FLAG_OFFSET = 127397; // 'A'.codePointAt(0) - 'REGIONAL INDICATOR A'
const ISO2 = {
  'united states': 'US', china: 'CN', india: 'IN', japan: 'JP', 'south korea': 'KR',
  korea: 'KR', russia: 'RU', germany: 'DE', france: 'FR', canada: 'CA', singapore: 'SG',
  taiwan: 'TW', 'united kingdom': 'GB', poland: 'PL', ukraine: 'UA', vietnam: 'VN',
  brazil: 'BR', australia: 'AU', netherlands: 'NL', indonesia: 'ID',
};
function countryCode(name) {
  if (!name) return '';
  const k = String(name).trim().toLowerCase();
  if (ISO2[k]) return ISO2[k];
  if (/^[A-Za-z]{2}$/.test(name)) return name.toUpperCase();
  return '';
}

// Sample rankings shown when live LeetCode data is unavailable so the table
// never renders empty. Ranks/scores are illustrative.
const SAMPLE_RANKINGS = [
  { rank: 1, username: 'tourist', country: 'Belarus', score: 18, finishTime: null },
  { rank: 2, username: 'jiangly', country: 'China', score: 18, finishTime: null },
  { rank: 3, username: 'Benq', country: 'United States', score: 18, finishTime: null },
  { rank: 4, username: 'Geothermal', country: 'United States', score: 16, finishTime: null },
  { rank: 5, username: 'neal_wu', country: 'United States', score: 16, finishTime: null },
  { rank: 6, username: 'maroonrk', country: 'Japan', score: 15, finishTime: null },
  { rank: 7, username: 'ksun48', country: 'Canada', score: 15, finishTime: null },
  { rank: 8, username: 'Radewoosh', country: 'Poland', score: 14, finishTime: null },
  { rank: 9, username: 'ecnerwala', country: 'United States', score: 14, finishTime: null },
  { rank: 10, username: 'scott_wu', country: 'United States', score: 13, finishTime: null },
];
const PAGE_SIZE = 25; // LeetCode returns 25 rows per ranking page.
const AVG_RATING = 1600; // baseline rating assumed for the expected-change column

const DIFF_HUE = {
  beginner: 'var(--easy)',
  easy: 'var(--easy)',
  intermediate: 'var(--medium)',
  medium: 'var(--medium)',
  advanced: 'var(--hard)',
  hard: 'var(--hard)',
  mixed: 'var(--accent)',
};

// Large progress ring: fraction filled is time remaining (in-progress) or solve
// progress (otherwise). Reuses the stroke-dasharray math from ExternalContestCard.
function ContestRing({ frac, hue, live, big }) {
  const R = 52, C = 2 * Math.PI * R;
  const f = clamp(frac, 0, 1);
  const dash = C * f;
  return (
    <svg className="ctx-ring" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <circle cx="60" cy="60" r={R} className="ctx-ring-track" />
      <circle
        cx="60" cy="60" r={R}
        className={`ctx-ring-fill${live ? ' live' : ''}`}
        style={{ stroke: hue, strokeDasharray: `${dash} ${C}` }}
        transform="rotate(-90 60 60)"
      />
      {big != null && (
        <text x="60" y="60" className="ctx-ring-val" dominantBaseline="middle">{big}</text>
      )}
    </svg>
  );
}

export default function ContestDetail({ session }) {
  const { slug } = useParams();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const { data: contest, isLoading, isError, error } = useContest(slug);
  const { data: problems = [] } = useContestProblems(slug);
  const { data: attempt } = useContestAttempt(userId, slug);
  const { data: progressBundle } = useUserProgress(userId);

  const byId = useMemo(() => progressBundle?.byId || {}, [progressBundle]);
  const [now, setNow] = useState(() => Date.now());
  const [view, setView] = useState('problems');
  const [rankPage, setRankPage] = useState(1);

  const ranking = useLcContestRanking(slug, rankPage, view === 'rankings');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const status = useMemo(() => {
    if (!attempt) return 'not_started';
    if (attempt.finished_at) return 'finished';
    if (!attempt.ends_at) return 'finished';
    const remaining = new Date(attempt.ends_at).getTime() - now;
    if (remaining <= 0) return 'time_up';
    return 'in_progress';
  }, [attempt, now]);

  const endsAt = attempt?.ends_at;
  const startedAt = attempt?.started_at;
  const finishedAt = attempt?.finished_at;

  const remainingSec = useMemo(() => {
    if (!endsAt) return null;
    return Math.max(0, Math.round((new Date(endsAt).getTime() - now) / 1000));
  }, [endsAt, now]);

  const elapsedSec = useMemo(() => {
    if (!startedAt) return 0;
    const start = new Date(startedAt).getTime();
    const cap = finishedAt
      ? new Date(finishedAt).getTime()
      : Math.min(now, endsAt ? new Date(endsAt).getTime() : now);
    return Math.max(0, Math.round((cap - start) / 1000));
  }, [startedAt, finishedAt, endsAt, now]);

  const solved = useMemo(() => {
    const set = new Set();
    problems.forEach(p => { if (byId[p.id]?.is_completed) set.add(p.id); });
    return set;
  }, [problems, byId]);

  const totalPoints = useMemo(
    () => problems.reduce((sum, p) => sum + (p.points || 0), 0),
    [problems],
  );
  const earnedPoints = useMemo(
    () => problems.reduce((sum, p) => sum + (solved.has(p.id) ? (p.points || 0) : 0), 0),
    [problems, solved],
  );

  const durationSec = (contest?.duration_minutes || 0) * 60;
  const solveFrac = problems.length ? solved.size / problems.length : 0;
  // Ring shows time-remaining while running, solve progress otherwise.
  const ringFrac = status === 'in_progress'
    ? (durationSec ? clamp(remainingSec / durationSec, 0, 1) : 1)
    : solveFrac;
  const ringBig = status === 'in_progress'
    ? null
    : `${solved.size}/${problems.length}`;
  const diffKey = (contest?.difficulty || 'Mixed').toLowerCase();
  const diffHue = DIFF_HUE[diffKey] || 'var(--accent)';
  const ringHue = status === 'in_progress' ? 'var(--accent)'
    : status === 'time_up' ? 'var(--hard)'
    : status === 'finished' ? 'var(--easy)'
    : diffHue;

  const phaseLabel = {
    not_started: 'Ready to start',
    in_progress: 'In progress',
    time_up: 'Time up',
    finished: 'Finished',
  }[status];
  const PhaseIcon = {
    not_started: Hourglass,
    in_progress: Play,
    time_up: Square,
    finished: Flag,
  }[status];

  const liveRanking = ranking.data?.ok ? ranking.data : null;
  const rankingFailed = !ranking.isLoading && (ranking.isError || ranking.data?.ok === false);

  // Either the real LeetCode rows or the illustrative sample, each decorated
  // with an Elo expected-change figure derived from the row's real rank.
  const rankRows = useMemo(() => {
    const usingLive = !!liveRanking;
    const base = usingLive ? liveRanking.rankings : SAMPLE_RANKINGS;
    return base.map((r) => {
      const { delta } = predictDelta({
        rating: AVG_RATING,
        actualRank: Math.max(1, r.rank),
        contestsPlayed: 8,
        fieldRatings: SAMPLE_FIELD,
        fieldSize: liveRanking?.totalUsers || TOTAL_PARTICIPANTS,
      });
      return { ...r, expectedDelta: delta };
    });
  }, [liveRanking]);

  const totalUsers = liveRanking?.totalUsers || 0;
  const maxPage = totalUsers ? Math.max(1, Math.ceil(totalUsers / PAGE_SIZE)) : 1;

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const startAttempt = async () => {
    if (!userId || !contest || submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + contest.duration_minutes * 60_000);
      const { error: e } = await supabase.from('PGcode_user_contest_attempts').upsert({
        user_id: userId,
        contest_slug: contest.slug,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        finished_at: null,
        score: 0,
        problems_solved: 0,
        penalty_seconds: 0,
      });
      if (e) setActionError(`Couldn't start: ${e.message}`);
      else queryClient.invalidateQueries({ queryKey: ['contestAttempt', userId, contest.slug] });
    } finally {
      setSubmitting(false);
    }
  };

  const finishAttempt = async () => {
    if (!userId || !contest || submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const { error: e } = await supabase
        .from('PGcode_user_contest_attempts')
        .update({ finished_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('contest_slug', contest.slug);
      if (e) setActionError(`Couldn't finish: ${e.message}`);
      else queryClient.invalidateQueries({ queryKey: ['contestAttempt', userId, contest.slug] });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ctx-container">
        <Breadcrumb items={[{ label: 'Contests', to: '/contests' }, { label: 'Contest' }]} />
        <div className="ctx-skeleton">
          <div className="skel skel-text" />
          <div className="skel skel-row-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ctx-container">
        <Breadcrumb items={[{ label: 'Contests', to: '/contests' }, { label: 'Contest' }]} />
        <div className="ctx-empty">
          <h2 className="ctx-empty-title">Couldn&rsquo;t load contest</h2>
          <p className="ctx-empty-sub">{error?.message || 'Network error.'}</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="ctx-container">
        <Breadcrumb items={[{ label: 'Contests', to: '/contests' }, { label: 'Contest' }]} />
        <div className="ctx-empty">
          <h2 className="ctx-empty-title">Contest not found</h2>
        </div>
      </div>
    );
  }

  const startLabel = fmtDate(contest.starts_at);

  return (
    <div className="ctx-container ctx-detail">
      <Breadcrumb items={[{ label: 'Contests', to: '/contests' }, { label: contest.name || 'Contest' }]} />

      <header className={`ctx-hero ctx-hero-${status}`} style={{ '--hero-hue': ringHue }}>
        <div className="ctx-hero-ring">
          <ContestRing frac={ringFrac} hue={ringHue} live={status === 'in_progress'} big={ringBig} />
          <div className="ctx-hero-ring-cap">
            {status === 'in_progress'
              ? (<><span className="ctx-hero-ring-time">{fmtMmSs(remainingSec)}</span><span className="ctx-hero-ring-sub">left</span></>)
              : (<span className="ctx-hero-ring-sub">solved</span>)}
          </div>
        </div>

        <div className="ctx-hero-body">
          <div className="ctx-hero-badges">
            <span className="ctx-hero-platform"><Trophy size={11} /> Contest</span>
            <span className={`ctx-phase ctx-phase-${status}`}>
              {PhaseIcon && <PhaseIcon size={11} />} {phaseLabel}
            </span>
            <span className="ctx-diff" style={{ color: diffHue, background: 'var(--hover-box)' }}>
              {contest.difficulty || 'Mixed'}
            </span>
          </div>

          <h1 className="ctx-detail-title">{contest.name}</h1>
          {contest.description && <p className="ctx-detail-desc">{contest.description}</p>}

          <div className="ctx-detail-meta">
            <span className="ctx-detail-meta-chip"><Clock size={11} /> {fmtDuration(contest.duration_minutes)}</span>
            {startLabel && <span className="ctx-detail-meta-chip"><CalendarClock size={11} /> {startLabel}</span>}
            <span className="ctx-detail-meta-chip"><Layers size={11} /> {problems.length} problems</span>
            {totalPoints > 0 && <span className="ctx-detail-meta-chip"><Target size={11} /> {totalPoints} pts</span>}
            <span className="ctx-detail-meta-chip"><ListChecks size={11} /> {solved.size} solved</span>
          </div>

          <div className="ctx-hero-actions">
            {!userId && <span className="ctx-clock-hint">Sign in to start the clock.</span>}
            {userId && status === 'not_started' && (
              <button className="ctx-btn ctx-btn-primary" onClick={startAttempt} disabled={submitting || problems.length === 0}>
                <Play size={13} /> Start contest
              </button>
            )}
            {userId && status === 'in_progress' && (
              <button className="ctx-btn ctx-btn-ghost" onClick={finishAttempt} disabled={submitting}>
                <Square size={13} /> Finish early
              </button>
            )}
            {userId && (status === 'time_up' || status === 'finished') && (
              <button className="ctx-btn ctx-btn-ghost" onClick={startAttempt} disabled={submitting}>
                <Play size={13} /> Restart
              </button>
            )}
            {actionError && <span className="ctx-action-error">{actionError}</span>}
          </div>
        </div>
      </header>

      <div className="ctx-stat-row">
        <div className="ctx-stat-card">
          <Hourglass size={14} className="ctx-stat-ic" />
          <span className="ctx-stat-n">{status === 'in_progress' ? fmtMmSs(remainingSec) : fmtMmSs(elapsedSec)}</span>
          <span className="ctx-stat-l">{status === 'in_progress' ? 'Remaining' : 'Elapsed'}</span>
        </div>
        <div className="ctx-stat-card">
          <Award size={14} className="ctx-stat-ic" />
          <span className="ctx-stat-n">{solved.size}<span className="ctx-stat-of"> / {problems.length}</span></span>
          <span className="ctx-stat-l">Solved</span>
        </div>
        <div className="ctx-stat-card">
          <Target size={14} className="ctx-stat-ic" />
          <span className="ctx-stat-n">{earnedPoints}<span className="ctx-stat-of"> / {totalPoints}</span></span>
          <span className="ctx-stat-l">Points</span>
        </div>
        <div className="ctx-stat-card">
          <Gauge size={14} className="ctx-stat-ic" />
          <span className="ctx-stat-n">{Math.round(solveFrac * 100)}<span className="ctx-stat-of">%</span></span>
          <span className="ctx-stat-l">Progress</span>
        </div>
      </div>

      <div className="ctx-view-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={view === 'problems'}
          className={`ctx-view-tab${view === 'problems' ? ' active' : ''}`}
          onClick={() => setView('problems')}
        >
          <Layers size={13} /> Problems
        </button>
        <button
          role="tab"
          aria-selected={view === 'rankings'}
          className={`ctx-view-tab${view === 'rankings' ? ' active' : ''}`}
          onClick={() => setView('rankings')}
        >
          <ListOrdered size={13} /> Rankings
        </button>
      </div>

      {view === 'rankings' ? (
        <div className="ctx-detail-main">
          <div className="ctx-rank-head">
            <h2 className="ctx-section-title">Live rankings</h2>
            {rankingFailed && (
              <span className="ctx-rank-note">
                <Globe size={12} /> Live data unavailable — showing a sample. Expected change is an estimate.
              </span>
            )}
            {liveRanking && totalUsers > 0 && (
              <span className="ctx-rank-note">
                <Globe size={12} /> {totalUsers.toLocaleString()} ranked
              </span>
            )}
          </div>

          {ranking.isLoading ? (
            <div className="ctx-skeleton">
              <div className="skel skel-row-full" />
              <div className="skel skel-row-full" />
              <div className="skel skel-row-full" />
            </div>
          ) : (
            <>
              <div className="ctx-rank-table" role="table" aria-label="Contest rankings">
                <div className="ctx-rank-row ctx-rank-row-head" role="row">
                  <span role="columnheader">#</span>
                  <span role="columnheader">User</span>
                  <span role="columnheader" className="ctx-rank-num">Score</span>
                  <span role="columnheader" className="ctx-rank-num">Finish</span>
                  <span role="columnheader" className="ctx-rank-num">Expected Δ</span>
                </div>
                {rankRows.map((r) => {
                  const cc = countryCode(r.country);
                  const flag = cc
                    ? String.fromCodePoint(...[...cc].map((c) => c.charCodeAt(0) + FLAG_OFFSET))
                    : '';
                  const up = r.expectedDelta >= 0;
                  const flat = Math.abs(r.expectedDelta) < 0.5;
                  const DeltaIcon = flat ? Minus : up ? TrendingUp : TrendingDown;
                  return (
                    <div className="ctx-rank-row" role="row" key={`${r.rank}-${r.username}`}>
                      <span className="ctx-rank-pos" role="cell">{r.rank}</span>
                      <span className="ctx-rank-user" role="cell">
                        {flag && <span className="ctx-rank-flag" aria-hidden="true">{flag}</span>}
                        <span className="ctx-rank-name">{r.username}</span>
                        {r.country && <span className="ctx-rank-country">{r.country}</span>}
                      </span>
                      <span className="ctx-rank-num ctx-rank-score" role="cell">{r.score}</span>
                      <span className="ctx-rank-num ctx-rank-finish" role="cell">{fmtFinish(r.finishTime)}</span>
                      <span
                        className={`ctx-rank-num ctx-rank-delta ${flat ? 'flat' : up ? 'up' : 'down'}`}
                        role="cell"
                      >
                        <DeltaIcon size={12} />
                        {up && !flat ? '+' : ''}{Math.round(r.expectedDelta)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {liveRanking && maxPage > 1 && (
                <div className="ctx-rank-pager">
                  <button
                    className="ctx-btn ctx-btn-ghost ctx-rank-pgbtn"
                    onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                    disabled={rankPage <= 1}
                  >
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span className="ctx-rank-pginfo">Page {rankPage} / {maxPage}</span>
                  <button
                    className="ctx-btn ctx-btn-ghost ctx-rank-pgbtn"
                    onClick={() => setRankPage((p) => Math.min(maxPage, p + 1))}
                    disabled={rankPage >= maxPage}
                  >
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              )}

              <p className="ctx-rank-foot">
                Expected change applies the same Elo model as the rating predictor: a higher real rank pulls the
                figure positive, scaled by how far the result beats an average-rated seed.
              </p>
            </>
          )}
        </div>
      ) : (
      <div className="ctx-detail-main">
        <h2 className="ctx-section-title">Problems</h2>
        {problems.length === 0 ? (
          <div className="ctx-expect">
            <p className="ctx-expect-title">What to expect</p>
            <ul className="ctx-expect-list">
              <li><Clock size={13} /> A {fmtDuration(contest.duration_minutes)} timed round once you hit start.</li>
              <li><Layers size={13} /> A curated problem set scored ICPC-style — solves first, penalty for wrong attempts.</li>
              <li><Flag size={13} /> Finish early to lock your time, or let the clock run out.</li>
            </ul>
            <p className="ctx-expect-sub">Problems for this round are being prepared. Check back shortly.</p>
          </div>
        ) : (
          <ol className="ctx-problem-list">
            {problems.map((p, i) => {
              const isSolved = solved.has(p.id);
              return (
                <li key={p.id} className={`ctx-problem-row${isSolved ? ' solved' : ''}`}>
                  <span className="ctx-problem-letter">{String.fromCharCode(65 + i)}</span>
                  <Link to={`/category/${p.topic_id}/${p.id}`} className="ctx-problem-body">
                    <span className="ctx-problem-name">{p.name}</span>
                    <span className="ctx-problem-topic">{p.topic_id}</span>
                  </Link>
                  <span className="ctx-problem-points">{p.points} pts</span>
                  <span className={`ctx-diff ctx-diff-${p.difficulty?.toLowerCase()}`}>{p.difficulty}</span>
                  <StatusPill value={legacyToStatus(byId[p.id])} size="sm" disabled />
                </li>
              );
            })}
          </ol>
        )}
      </div>
      )}
    </div>
  );
}
