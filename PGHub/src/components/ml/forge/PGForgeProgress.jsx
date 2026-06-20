import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, Target, Award, Trophy, Flame, Check, Activity, ArrowRight,
} from 'lucide-react';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import { computeStats } from './forgeProgressStore';
import './PGForgeProgress.css';

const BADGE_THRESHOLDS = [25, 50, 75, 100];

function ringGeometry(pct) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return { radius: r, circumference: c, offset: c - (clamped / 100) * c };
}

// Reader-facing relative date. Keeps it short: "today", "3d ago", "2w ago".
function relativeDate(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function PGForgeProgress() {
  // Title lookup so recent solves can show their problem name.
  const titleBySlug = useMemo(() => {
    const m = {};
    PG_FORGE_PROBLEMS.forEach((p) => { m[p.slug] = p.title; });
    return m;
  }, []);

  const stats = useMemo(() => computeStats(PG_FORGE_PROBLEMS), []);

  const overallPctNum = stats.total === 0 ? 0 : (stats.solved / stats.total) * 100;
  const overallPct = overallPctNum.toFixed(0);
  const ring = ringGeometry(overallPctNum);

  const recent = stats.recent.slice(0, 8);

  return (
    <div className="fp-page">
      <nav className="forge-crumb" aria-label="Breadcrumb">
        <Link to="/ml" className="forge-crumb-link">PGForge</Link>
        <ChevronRight size={13} />
        <span className="forge-crumb-cur">Progress</span>
      </nav>

      <header className="fp-header">
        <h1 className="fp-title">Your ML progress</h1>
        <p className="fp-sub">
          Every problem you mark solved lands here — watch your ring fill, your badges
          light up, and your streak grow as you keep practicing.
        </p>
      </header>

      <div className="fp-grid">
        {/* Problems Solved */}
        <section className="fp-card fp-card-solved">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><Target size={15} /> Problems solved</h2>
          </div>
          <div className="fp-solved-body">
            <div className="fp-ring-wrap">
              <svg className="fp-ring" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={ring.radius} fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle
                  cx="64" cy="64" r={ring.radius} fill="none"
                  stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ring.circumference} strokeDashoffset={ring.offset}
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="fp-ring-text">
                <div className="fp-ring-pct">{overallPct}%</div>
                <div className="fp-ring-frac">{stats.solved} / {stats.total}</div>
              </div>
            </div>

            <ul className="fp-diff-list">
              {[
                { key: 'easy', label: 'Easy' },
                { key: 'medium', label: 'Medium' },
                { key: 'hard', label: 'Hard' },
              ].map(({ key, label }) => {
                const d = stats.byDiff[key];
                const pct = d.total ? Math.round((d.solved / d.total) * 100) : 0;
                return (
                  <li key={key} className="fp-diff-row">
                    <span className={`fp-diff-dot fp-diff-${key}`} />
                    <span className="fp-diff-label">{label}</span>
                    <span className="fp-diff-count">{d.solved} / {d.total}</span>
                    <div className="fp-diff-bar">
                      <div className={`fp-diff-fill fp-diff-fill-${key}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Badges */}
        <section className="fp-card fp-card-badges">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><Award size={15} /> Badges</h2>
          </div>
          <div className="fp-badges">
            {BADGE_THRESHOLDS.map((t) => {
              const lit = stats.solved >= t;
              const pct = Math.min(100, Math.round((stats.solved / t) * 100));
              return (
                <div key={t} className={`fp-badge ${lit ? 'is-lit' : ''}`}>
                  <div className="fp-badge-medal">
                    {lit ? <Trophy size={20} /> : <Award size={20} />}
                  </div>
                  <div className="fp-badge-num">{t}</div>
                  <div className="fp-badge-label">problems</div>
                  <div className="fp-badge-bar">
                    <div className="fp-badge-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="fp-badge-pct">{lit ? 'Earned' : `${pct}%`}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Submission Activity */}
        <section className="fp-card fp-card-activity">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><Activity size={15} /> Submission activity</h2>
          </div>
          <div className="fp-activity-body">
            <div className="fp-heatmap" role="img" aria-label="Solves over the last 26 weeks">
              {stats.heatmap.map((c) => (
                <span
                  key={c.date}
                  className={`fp-heat-cell fp-heat-${c.level}`}
                  title={`${c.count} solve${c.count === 1 ? '' : 's'} on ${c.date}`}
                />
              ))}
            </div>
            <div className="fp-activity-stats">
              <div className="fp-stat">
                <div className="fp-stat-num">{stats.totalSubmissions}</div>
                <div className="fp-stat-label">Submissions</div>
              </div>
              <div className="fp-stat">
                <div className="fp-stat-num fp-stat-streak">
                  <Flame size={16} /> {stats.currentStreak}
                </div>
                <div className="fp-stat-label">Current streak</div>
              </div>
              <div className="fp-stat">
                <div className="fp-stat-num">{stats.bestStreak}</div>
                <div className="fp-stat-label">Best streak</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="fp-card fp-card-recent">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><Check size={15} /> Recent activity</h2>
          </div>
          {recent.length === 0 ? (
            <div className="fp-empty">
              <p>No problems solved yet — solve one to start your streak.</p>
              <Link to="/ml/problems" className="fp-empty-link">
                Browse problems <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <ul className="fp-recent-list">
              {recent.map((r) => (
                <li key={r.slug} className="fp-recent-row">
                  <Link to={`/ml/problems/${r.slug}`} className="fp-recent-link">
                    <span className="fp-recent-title">{titleBySlug[r.slug] || r.slug}</span>
                    <span className={`fp-recent-diff fp-diff-${r.difficulty}`}>{r.difficulty}</span>
                    <span className="fp-recent-date">{relativeDate(r.ts)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
