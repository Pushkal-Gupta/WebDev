import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Target, Award, Trophy, Flame, Check, Activity, ArrowRight,
  User, Share2, Pencil, Send,
} from 'lucide-react';
import { PG_FORGE_PROBLEMS } from './pgForgeProblemsData';
import Breadcrumb from '../../common/Breadcrumb';
import { computeStats } from './forgeProgressStore';
import './PGForgeProgress.css';

const BADGE_THRESHOLDS = [25, 50, 75, 100];

// One ring radius for both the track and the three solved-by-difficulty arcs.
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

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

// Build initials from a display name / email-local-part for the monogram chip.
function initialsOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function PGForgeProgress({ session }) {
  // Context-aware back nav: reached from PGVault (?from=vault) -> back to Vault;
  // reached from PGForge -> back to PGForge. Same page, different origin crumb.
  const fromVault = new URLSearchParams(useLocation().search).get('from') === 'vault';
  const back = fromVault ? { to: '/vault', label: 'PGVault' } : { to: '/ml', label: 'PGForge' };

  // Title lookup so recent solves can show their problem name.
  const titleBySlug = useMemo(() => {
    const m = {};
    PG_FORGE_PROBLEMS.forEach((p) => { m[p.slug] = p.title; });
    return m;
  }, []);

  const stats = useMemo(() => computeStats(PG_FORGE_PROBLEMS), []);

  // ---- Logged-in user (or guest fallback) ----
  // The route receives the same Supabase session the rest of the app threads
  // through props; user_metadata carries the OAuth name/avatar.
  const user = session?.user || null;
  const meta = user?.user_metadata || {};
  const displayName = user
    ? (meta.full_name || meta.name || user.email?.split('@')[0] || 'You')
    : 'Guest';
  const avatarUrl = meta.avatar_url || meta.picture || '';
  const roleLine = user ? 'ML practitioner' : 'Sign in to sync your progress';

  const overallPctNum = stats.total === 0 ? 0 : (stats.solved / stats.total) * 100;
  const overallPct = overallPctNum.toFixed(0);

  // ---- Segmented donut ----
  // Three arcs share one circle (radius RING_R, circumference RING_C). Each arc
  // is drawn with a stroke-dasharray of [arcLen, RING_C - arcLen] so only its
  // slice paints, then pushed to its start position with a negative dashoffset
  // equal to the length already consumed by the previous arcs. Arc length is
  // proportional to that difficulty's SOLVED share of the catalog total, so the
  // filled portion of the ring always equals the overall solved fraction.
  const segments = useMemo(() => {
    const order = [
      { key: 'easy', stroke: 'var(--easy)' },
      { key: 'medium', stroke: 'var(--medium)' },
      { key: 'hard', stroke: 'var(--hard)' },
    ];
    const denom = stats.total || 1;
    let consumed = 0;
    return order.map(({ key, stroke }) => {
      const solved = stats.byDiff[key].solved;
      const frac = solved / denom;
      const len = frac * RING_C;
      const seg = {
        key,
        stroke,
        len,
        // Small visual gap between adjacent arcs so they read as segments.
        offset: -consumed,
      };
      consumed += len;
      return seg;
    }).filter((s) => s.len > 0);
  }, [stats]);

  const recent = stats.recent.slice(0, 7);

  // Month header segments for the heatmap. Each labelled week starts a segment
  // that spans the grid columns up to the next labelled week, so the month name
  // sits above the block of weeks that belong to it.
  const monthSegments = useMemo(() => {
    const labels = stats.monthLabels || [];
    const marks = labels
      .map((m, i) => ({ ...m, i }))
      .filter((m) => m.label);
    return marks.map((m, idx) => {
      const next = marks[idx + 1];
      const span = (next ? next.i : labels.length) - m.i;
      return { label: m.label, start: m.i + 1, span };
    });
  }, [stats]);

  return (
    <div className="fp-page">
      <Breadcrumb items={[{ label: back.label, to: back.to }, { label: 'Progress' }]} />

      <header className="fp-header">
        <h1 className="fp-title">Your ML progress</h1>
        <p className="fp-sub">Track every solved problem, your streak, and the badges you light up.</p>
      </header>

      {/* Top row — profile / solved donut / badges */}
      <div className="fp-top">
        {/* Profile */}
        <section className="fp-card fp-card-profile">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><User size={15} /> Profile</h2>
          </div>
          <div className="fp-profile-body">
            <div className="fp-avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="" />
                : (user
                  ? <span className="fp-avatar-mono">{initialsOf(displayName)}</span>
                  : <User size={30} />)}
            </div>
            <div className="fp-profile-meta">
              <div className="fp-profile-name">{displayName}</div>
              <div className="fp-profile-role">{roleLine}</div>
            </div>
          </div>
          <div className="fp-profile-actions">
            <button type="button" className="fp-btn fp-btn-primary">
              <Share2 size={14} /> Share progress
            </button>
            {user ? (
              <Link to="/account" className="fp-btn fp-btn-ghost">
                <Pencil size={14} /> Edit profile
              </Link>
            ) : (
              <Link to="/account" className="fp-btn fp-btn-ghost">
                <Send size={14} /> Sign in
              </Link>
            )}
          </div>
        </section>

        {/* Problems solved — segmented donut */}
        <section className="fp-card fp-card-solved">
          <div className="fp-card-head">
            <h2 className="fp-card-title"><Target size={15} /> Problems solved</h2>
          </div>
          <div className="fp-solved-body">
            <div className="fp-ring-wrap">
              <svg className="fp-ring" viewBox="0 0 128 128" role="img" aria-label={`${stats.solved} of ${stats.total} solved`}>
                <circle cx="64" cy="64" r={RING_R} fill="none" stroke="var(--border)" strokeWidth="11" />
                <g transform="rotate(-90 64 64)">
                  {segments.map((s) => (
                    <circle
                      key={s.key}
                      cx="64" cy="64" r={RING_R} fill="none"
                      stroke={s.stroke} strokeWidth="11" strokeLinecap="butt"
                      strokeDasharray={`${s.len} ${RING_C - s.len}`}
                      strokeDashoffset={s.offset}
                    />
                  ))}
                </g>
              </svg>
              <div className="fp-ring-text">
                <div className="fp-ring-total">{stats.solved}</div>
                <div className="fp-ring-frac">/ {stats.total}</div>
                <div className="fp-ring-pct">{overallPct}%</div>
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
                    {lit ? <Trophy size={18} /> : <Award size={18} />}
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
      </div>

      {/* Submission activity — full width */}
      <section className="fp-card fp-card-activity">
        <div className="fp-card-head">
          <h2 className="fp-card-title"><Activity size={15} /> Submission activity</h2>
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

        <div className="fp-heat-frame">
          {/* Month header row aligned to week columns */}
          <div className="fp-heat-months" style={{ '--weeks': stats.weeks || 52 }}>
            {monthSegments.map((m) => (
              <span
                key={`${m.label}-${m.start}`}
                className="fp-heat-month"
                style={{ gridColumn: `${m.start} / span ${m.span}` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="fp-heat-rail-grid">
            <div className="fp-heat-weekdays">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>
            <div className="fp-heatmap" role="img" aria-label="Solves over the last 52 weeks">
              {stats.heatmap.map((c) => (
                <span
                  key={c.date}
                  className={`fp-heat-cell ${c.future ? 'fp-heat-empty' : `fp-heat-${c.level}`}`}
                  title={c.future ? '' : `${c.count} solve${c.count === 1 ? '' : 's'} on ${c.date}`}
                />
              ))}
            </div>
          </div>
          <div className="fp-heat-legend">
            <span className="fp-heat-legend-label">Less</span>
            <span className="fp-heat-cell fp-heat-0" />
            <span className="fp-heat-cell fp-heat-1" />
            <span className="fp-heat-cell fp-heat-2" />
            <span className="fp-heat-cell fp-heat-3" />
            <span className="fp-heat-legend-label">More</span>
          </div>
        </div>
      </section>

      {/* Recent activity — full width tail row, grows to fill viewport */}
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
  );
}
