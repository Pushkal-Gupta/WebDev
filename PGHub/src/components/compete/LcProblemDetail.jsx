import './LcProblemDetail.css';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ExternalLink, Gauge, Layers, CalendarDays,
  Hash, Trophy, Target, ArrowLeft,
} from 'lucide-react';
import { useLcQuestion } from '../../lib/queries';
import Breadcrumb from '../common/Breadcrumb';

const crumbs = (title) => [
  { label: 'Compete', to: '/compete' },
  { label: 'LeetCode', to: '/compete/leetcode' },
  { label: 'Problems', to: '/compete/leetcode/problems' },
  { label: title || 'Problem' },
];

const RATING_MIN = 1200;
const RATING_MAX = 3000;
const SCALE_MIN = 1200;
const SCALE_MAX = 3000;

function titleFromSlug(slug) {
  if (!slug) return 'Problem';
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function diffWord(d) {
  if (d === 'easy') return 'Easy';
  if (d === 'hard') return 'Hard';
  return 'Medium';
}

export default function LcProblemDetail() {
  const { slug } = useParams();
  const { data: q, isLoading } = useLcQuestion(slug);

  const derived = useMemo(() => {
    if (!q || typeof q.rating !== 'number') return null;
    const rating = q.rating;
    const solveRate = Math.min(0.99, Math.max(0.02, 1.05 - (rating - 1200) / 2600));
    const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, rating));
    const pct = ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
    const bandLo = Math.min(SCALE_MAX, Math.max(SCALE_MIN, rating - 100));
    const bandHi = Math.min(SCALE_MAX, Math.max(SCALE_MIN, rating + 100));
    const bandLoPct = ((bandLo - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
    const bandHiPct = ((bandHi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100;
    return { rating, solveRate, pct, bandLoPct, bandHiPct };
  }, [q]);

  const lcUrl = `https://leetcode.com/problems/${slug}/`;

  if (isLoading) {
    return (
      <div className="lcpd-container">
        <Breadcrumb items={crumbs(titleFromSlug(slug))} />
        <div className="lcpd-skel lcpd-skel-head" />
        <div className="lcpd-skel lcpd-skel-hero" />
        <div className="lcpd-skel-row">
          <div className="lcpd-skel lcpd-skel-card" />
          <div className="lcpd-skel lcpd-skel-card" />
          <div className="lcpd-skel lcpd-skel-card" />
          <div className="lcpd-skel lcpd-skel-card" />
        </div>
        <div className="lcpd-skel lcpd-skel-hero" />
      </div>
    );
  }

  if (!q || !derived) {
    const title = titleFromSlug(slug);
    return (
      <div className="lcpd-container">
        <Breadcrumb items={crumbs(title)} />
        <div className="lcpd-empty">
          <Trophy size={34} className="lcpd-empty-icon" />
          <h1 className="lcpd-empty-title">{title}</h1>
          <p className="lcpd-empty-sub">No rating on record for this problem yet.</p>
          <a className="lcpd-btn lcpd-btn-primary" href={lcUrl} target="_blank" rel="noreferrer">
            Solve on LeetCode <ExternalLink size={15} />
          </a>
          <Link to="/compete/leetcode/problems" className="lcpd-empty-back">
            <ArrowLeft size={14} /> Back to problems
          </Link>
        </div>
      </div>
    );
  }

  const dWord = diffWord(q.difficulty);
  const ratingPctTxt = `${Math.round(derived.solveRate * 100)}%`;

  return (
    <div className="lcpd-container">
      <Breadcrumb items={crumbs(q.title)} />

      <header className="lcpd-head">
        <div className="lcpd-badges">
          {q.contest_label && <span className="lcpd-chip">{q.contest_label}</span>}
          <span className={`lcpd-pill lcpd-pill-${q.difficulty}`}>{dWord}</span>
          {q.problem_index && <span className="lcpd-chip lcpd-chip-slot">{q.problem_index}</span>}
        </div>
        <h1 className="lcpd-title">{q.title}</h1>
        <div className="lcpd-actions">
          <a className="lcpd-btn lcpd-btn-primary" href={lcUrl} target="_blank" rel="noreferrer">
            Solve on LeetCode <ExternalLink size={15} />
          </a>
          <span className="lcpd-action-note">Opens the original problem in a new tab.</span>
        </div>
      </header>

      <section className="lcpd-hero">
        <div className="lcpd-hero-top">
          <div>
            <div className="lcpd-hero-label">Estimated difficulty rating</div>
            <div className={`lcpd-hero-rating lcpd-rating-${q.difficulty}`}>
              {Math.round(derived.rating)}
            </div>
          </div>
        </div>

        <svg className="lcpd-scale" viewBox="0 0 600 90" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Rating ${Math.round(derived.rating)} on a ${SCALE_MIN} to ${SCALE_MAX} scale`}>
          <line x1="20" y1="38" x2="580" y2="38" className="lcpd-scale-track" />
          <rect
            x={20 + (derived.bandLoPct / 100) * 560}
            y="30"
            width={Math.max(2, ((derived.bandHiPct - derived.bandLoPct) / 100) * 560)}
            height="16"
            rx="3"
            className={`lcpd-scale-band lcpd-band-${q.difficulty}`}
          />
          {[1200, 1600, 2000, 2400, 2800].map((t) => {
            const x = 20 + ((t - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 560;
            return (
              <g key={t}>
                <line x1={x} y1="32" x2={x} y2="44" className="lcpd-scale-tick" />
                <text x={x} y="62" textAnchor="middle" className="lcpd-scale-ticklabel">{t}</text>
              </g>
            );
          })}
          <g transform={`translate(${20 + (derived.pct / 100) * 560}, 38)`}>
            <circle r="8" className={`lcpd-scale-marker lcpd-marker-${q.difficulty}`} />
            <circle r="3" className="lcpd-scale-marker-core" />
          </g>
        </svg>
        <p className="lcpd-caption">
          Roughly the rating at which a contestant has about a 50% chance of solving this problem.
        </p>
      </section>

      <section className="lcpd-stats">
        <div className="lcpd-stat">
          <Gauge size={16} className="lcpd-stat-icon" />
          <div className="lcpd-stat-val">{ratingPctTxt}</div>
          <div className="lcpd-stat-key">Estimated solve rate</div>
        </div>
        <div className="lcpd-stat">
          <Layers size={16} className="lcpd-stat-icon" />
          <div className={`lcpd-stat-val lcpd-stat-${q.difficulty}`}>{dWord}</div>
          <div className="lcpd-stat-key">Difficulty band</div>
        </div>
        <div className="lcpd-stat">
          <CalendarDays size={16} className="lcpd-stat-icon" />
          <div className="lcpd-stat-val lcpd-stat-text">{q.contest_label || '—'}</div>
          <div className="lcpd-stat-key">Contest</div>
        </div>
        <div className="lcpd-stat">
          <Hash size={16} className="lcpd-stat-icon" />
          <div className="lcpd-stat-val">{q.problem_index || '—'}</div>
          <div className="lcpd-stat-key">Slot</div>
        </div>
      </section>

      <section className="lcpd-bands">
        <div className="lcpd-bands-head">
          <Target size={15} className="lcpd-bands-icon" />
          <span>Where this sits</span>
        </div>
        <svg className="lcpd-bandviz" viewBox="0 0 600 80" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Rating placement among difficulty bands">
          <rect x="20" y="30" width={186.7} height="14" rx="3" className="lcpd-zone-easy" />
          <rect x="206.7" y="30" width={186.7} height="14" rx="3" className="lcpd-zone-medium" />
          <rect x="393.4" y="30" width={186.6} height="14" rx="3" className="lcpd-zone-hard" />
          <text x="113" y="62" textAnchor="middle" className="lcpd-zone-label">Easy</text>
          <text x="300" y="62" textAnchor="middle" className="lcpd-zone-label">Medium</text>
          <text x="487" y="62" textAnchor="middle" className="lcpd-zone-label">Hard</text>
          <g transform={`translate(${20 + (derived.pct / 100) * 560}, 37)`}>
            <circle r="9" className={`lcpd-zone-dot lcpd-marker-${q.difficulty}`} />
            <circle r="3.5" className="lcpd-scale-marker-core" />
          </g>
          <text
            x={Math.min(575, Math.max(25, 20 + (derived.pct / 100) * 560))}
            y="20"
            textAnchor="middle"
            className="lcpd-zone-here"
          >
            {Math.round(derived.rating)}
          </text>
        </svg>
        <p className="lcpd-caption">
          Bands run from {RATING_MIN} to {RATING_MAX}. The dot marks this problem against the easy, medium, and hard ranges.
        </p>
      </section>
    </div>
  );
}
