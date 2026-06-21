import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, ChevronRight, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TimelineMarker from './vault/TimelineMarker';
import ConfidenceMeter from './vault/ConfidenceMeter';
import './vault/vault.css';
import './ReviewQueue.css';

const CONFIDENCE_LABELS = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy', 5: 'Mastered' };
const CONFIDENCE_COLORS = { 1: 'var(--hard)', 2: 'var(--medium)', 3: 'var(--accent)', 4: 'var(--easy)', 5: 'var(--easy)' };

function overdueDays(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ReviewQueue({ session }) {
  const [reviewItems, setReviewItems] = useState([]);
  const [problems, setProblems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session?.user) { setLoading(false); return; }

    let cancelled = false;
    async function fetchReview() {
      setLoading(true);
      setError(null);
      try {
        // Fetch all user progress with next_review_at set
        const { data: progressData, error: progressError } = await supabase
          .from('PGcode_user_progress')
          .select('problem_id, confidence, last_solved_at, next_review_at, solve_count')
          .eq('user_id', session.user.id)
          .eq('is_completed', true)
          .not('next_review_at', 'is', null)
          .lte('next_review_at', new Date().toISOString())
          .order('next_review_at', { ascending: true });
        if (progressError) throw progressError;

        if (!progressData || progressData.length === 0) {
          setReviewItems([]);
          setLoading(false);
          return;
        }

        // Fetch problem details for the review items
        const problemIds = progressData.map(p => p.problem_id);
        const { data: problemsData, error: problemsError } = await supabase
          .from('PGcode_problems')
          .select('id, name, topic_id, difficulty')
          .in('id', problemIds);
        if (problemsError) throw problemsError;

        const problemMap = {};
        (problemsData || []).forEach(p => { problemMap[p.id] = p; });

        setProblems(problemMap);
        setReviewItems(progressData);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load review queue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReview();
    return () => { cancelled = true; };
  }, [session]);

  const groupedItems = useMemo(() => {
    const overdue = [];
    const today = [];

    reviewItems.forEach(item => {
      const diff = Date.now() - new Date(item.next_review_at).getTime();
      const days = Math.floor(diff / 86400000);
      if (days > 0) overdue.push(item);
      else today.push(item);
    });

    return { overdue, today };
  }, [reviewItems]);

  const crumbs = (
    <nav className="vault-crumbs" aria-label="Breadcrumb">
      <Link to="/vault" className="vault-crumbs-back">
        <ArrowLeft size={12} /> Vault
      </Link>
      <span className="vault-crumbs-sep">/</span>
      <span className="vault-crumbs-current">Review</span>
    </nav>
  );

  if (!session?.user) {
    return (
      <div className="rq-container">
        {crumbs}
        <div className="rq-empty-auth">
          <RotateCcw size={36} className="rq-empty-icon" />
          <h2>Spaced Repetition Review</h2>
          <p>Log in to track your review schedule and reinforce patterns you've learned.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rq-container">
        {crumbs}
        <div className="rq-header">
          <div className="skel skel-title" />
        </div>
        <div className="rq-skeleton-rows">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel skel-row" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rq-container">
        {crumbs}
        <div className="rq-empty-auth">
          <AlertCircle size={32} className="rq-empty-icon" />
          <h2>Couldn&rsquo;t load your review queue</h2>
          <p>{error}</p>
          <button className="rq-cta" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const totalDue = reviewItems.length;

  return (
    <div className="rq-container">
      {crumbs}
      <div className="rq-header">
        <div className="rq-title-row">
          <h1 className="rq-title">Review Queue</h1>
          {totalDue > 0 && <span className="rq-badge">{totalDue} due</span>}
        </div>
        <p className="rq-subtitle">
          Problems you've solved that are due for review. Spaced repetition strengthens pattern recognition.
        </p>
      </div>

      {totalDue === 0 ? (
        <div className="rq-all-done">
          <CheckCircle size={40} className="rq-done-icon" />
          <h2>All caught up!</h2>
          <p>No problems due for review. Keep solving to build your review queue.</p>
          <Link to="/practice" className="rq-cta">Browse Problems</Link>
        </div>
      ) : (
        <div className="rq-sections-wrap">
          {groupedItems.overdue.length > 0 && (
            <div className="rq-section">
              <h3 className="rq-section-title">
                <AlertCircle size={14} /> Overdue ({groupedItems.overdue.length})
              </h3>
              <div className="rq-list">
                {groupedItems.overdue.map((item, i) => (
                  <ReviewCard
                    key={item.problem_id}
                    item={item}
                    problem={problems[item.problem_id]}
                    status="overdue"
                    first={i === 0}
                    last={i === groupedItems.overdue.length - 1}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedItems.today.length > 0 && (
            <div className="rq-section">
              <h3 className="rq-section-title">
                <Clock size={14} /> Due Today ({groupedItems.today.length})
              </h3>
              <div className="rq-list">
                {groupedItems.today.map((item, i) => (
                  <ReviewCard
                    key={item.problem_id}
                    item={item}
                    problem={problems[item.problem_id]}
                    status="due-today"
                    first={i === 0}
                    last={i === groupedItems.today.length - 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ item, problem, status, first, last }) {
  if (!problem) return null;
  const days = overdueDays(item.next_review_at);

  return (
    <Link
      to={`/category/${problem.topic_id}/${problem.id}`}
      className={`rq-card rq-card-${status}`}
    >
      <TimelineMarker status={status} height={64} first={first} last={last} />

      <div className="rq-card-left">
        <span className="rq-card-name">{problem.name}</span>
        <div className="rq-card-meta">
          <span className={`rq-card-diff rq-diff-${problem.difficulty?.toLowerCase() || ''}`}>
            {problem.difficulty || ''}
          </span>
          <span className="rq-card-topic">{problem.topic_id}</span>
          <span className="rq-card-solved">Solved {item.solve_count || 1}x · {timeAgo(item.last_solved_at)}</span>
        </div>
      </div>

      <div className="rq-card-due">
        <span className={`rq-due-num rq-due-${status}`}>
          {status === 'overdue' ? days : '0'}
        </span>
        <span className="rq-due-unit">
          {status === 'overdue' ? `day${days === 1 ? '' : 's'} overdue` : 'due today'}
        </span>
      </div>

      <div className="rq-card-right">
        <ConfidenceMeter
          value={item.confidence || 0}
          max={5}
          color={CONFIDENCE_COLORS[item.confidence] || 'var(--hue-sky)'}
          label="conf"
        />
        <ChevronRight size={16} className="rq-card-arrow" />
      </div>
    </Link>
  );
}
