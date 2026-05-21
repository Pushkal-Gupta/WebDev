import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Trophy, Clock, Play, Square, Award } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useContest, useContestProblems, useContestAttempt, useUserProgress } from '../../lib/queries';
import StatusPill from '../StatusPill';
import { legacyToStatus } from '../../lib/status';
import './Contests.css';

function fmtMmSs(seconds) {
  if (seconds == null || seconds < 0) return '--:--';
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
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
        <div className="ctx-empty">
          <h2 className="ctx-empty-title">Couldn&rsquo;t load contest</h2>
          <p className="ctx-empty-sub">{error?.message || 'Network error.'}{' '}
            <Link to="/contests">Back to contests</Link>.
          </p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="ctx-container">
        <div className="ctx-empty">
          <h2 className="ctx-empty-title">Contest not found</h2>
          <p className="ctx-empty-sub"><Link to="/contests">Back to contests</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="ctx-container ctx-detail">
      <nav className="ctx-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/contests">Contests</Link>
        <ChevronRight size={12} />
        <span>{contest.name}</span>
      </nav>

      <header className="ctx-detail-header">
        <Link to="/contests" className="ctx-back">
          <ArrowLeft size={13} /> All contests
        </Link>
        <div className="ctx-detail-title-row">
          <Trophy size={20} className="ctx-detail-icon" />
          <h1 className="ctx-detail-title">{contest.name}</h1>
        </div>
        {contest.description && <p className="ctx-detail-desc">{contest.description}</p>}
        <div className="ctx-detail-meta">
          <span className="ctx-detail-meta-chip"><Clock size={11} /> {contest.duration_minutes} min</span>
          <span className={`ctx-diff ctx-diff-${(contest.difficulty || 'Mixed').toLowerCase()}`}>{contest.difficulty || 'Mixed'}</span>
          <span className="ctx-detail-meta-chip">{problems.length} problems</span>
        </div>
      </header>

      <section className={`ctx-clock ctx-clock-${status}`}>
        <div className="ctx-clock-main">
          <Clock size={14} />
          <span className="ctx-clock-label">
            {status === 'not_started' && 'Not started'}
            {status === 'in_progress' && 'Time remaining'}
            {status === 'time_up' && 'Time up'}
            {status === 'finished' && 'Finished'}
          </span>
          <span className="ctx-clock-value">
            {status === 'in_progress' ? fmtMmSs(remainingSec) : fmtMmSs(elapsedSec)}
          </span>
        </div>
        <div className="ctx-clock-stats">
          <span className="ctx-clock-stat"><Award size={11} /> {solved.size} / {problems.length} solved</span>
        </div>
        <div className="ctx-clock-actions">
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
              Restart
            </button>
          )}
          {actionError && <span className="ctx-action-error">{actionError}</span>}
        </div>
      </section>

      {problems.length === 0 ? (
        <div className="ctx-empty">
          <p className="ctx-empty-title">No problems linked yet.</p>
          <p className="ctx-empty-sub">
            Populate <code>PGcode_contest_problems</code> for <code>{contest.slug}</code> to surface
            the contest&rsquo;s problem set here.
          </p>
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
  );
}
