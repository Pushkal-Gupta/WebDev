import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, ListOrdered, Trophy, ArrowRight, Search,
  TrendingUp, TrendingDown, Award, Hash, Globe,
} from 'lucide-react';
import { useLeetCodeUser } from '../../lib/queries';
import { predictDelta } from '../contests/LeetCodeAnalytics';
import './LcHub.css';

const SAMPLE_FIELD = [3240, 2980, 2510, 2180, 1840, 1620, 1500, 1390, 1310, 1240, 1180, 1120];

const HUES = ['var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

const NAV_CARDS = [
  {
    to: '/compete/leetcode/problems',
    icon: ListOrdered,
    title: 'Problems',
    sub: 'Browse the full LeetCode catalog with difficulty, tags and acceptance rates.',
  },
  {
    to: '/compete/leetcode/contests',
    icon: Trophy,
    title: 'Contests',
    sub: 'Weekly and biweekly rounds, rankings and per-question breakdowns.',
  },
];

const RANK_MAX = 25000;

export default function LcHub() {
  const [draft, setDraft] = useState('');
  const [handle, setHandle] = useState('');
  const [rank, setRank] = useState(2000);

  const { data: user, isLoading, isError, error } = useLeetCodeUser(handle);

  const realRating = useMemo(() => {
    const r = Number(user?.rating);
    return Number.isFinite(r) && r > 0 ? r : 1500;
  }, [user]);

  const contestsPlayed = useMemo(() => {
    const c = Number(user?.attendedContestsCount);
    return Number.isFinite(c) && c > 0 ? c : 1;
  }, [user]);

  const prediction = useMemo(
    () =>
      predictDelta({
        rating: realRating,
        actualRank: Math.max(1, rank),
        contestsPlayed,
        fieldRatings: SAMPLE_FIELD,
      }),
    [realRating, rank, contestsPlayed],
  );

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (v) setHandle(v);
  };

  const delta = prediction.delta;
  const positive = delta >= 0;

  return (
    <div className="lch-wrap">
      <nav className="lch-crumbs" aria-label="Breadcrumb">
        <Link to="/compete">PGBattle</Link>
        <ChevronRight size={13} aria-hidden />
        <span>LeetCode</span>
      </nav>

      <header className="lch-hero">
        <h1 className="lch-title">LeetCode</h1>
        <p className="lch-sub">
          Work the catalog, follow the contests, and project where your next round lands your rating.
        </p>
      </header>

      <div className="lch-nav-row">
        {NAV_CARDS.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="lch-feature"
              style={{ '--feat-hue': HUES[i % HUES.length] }}
            >
              <span className="lch-feature-icon">
                <Icon size={20} aria-hidden />
              </span>
              <span className="lch-feature-text">
                <span className="lch-feature-title">{c.title}</span>
                <span className="lch-feature-sub">{c.sub}</span>
              </span>
              <ArrowRight size={18} className="lch-feature-arrow" aria-hidden />
            </Link>
          );
        })}
      </div>

      <section className="lch-panel">
        <div className="lch-panel-head">
          <TrendingUp size={17} aria-hidden />
          <h2>Predict your rating</h2>
        </div>
        <p className="lch-panel-sub">
          Enter a LeetCode handle to pull live stats, then slide a target finish to see the projected swing.
        </p>

        <form className="lch-lookup" onSubmit={submit}>
          <div className="lch-input-wrap">
            <Search size={15} aria-hidden />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="LeetCode username"
              aria-label="LeetCode username"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="lch-lookup-btn" disabled={!draft.trim()}>
            Look up
          </button>
        </form>

        {handle && isLoading && (
          <div className="lch-profile lch-skel-row" aria-hidden>
            <span className="lch-skel lch-skel-avatar" />
            <div className="lch-skel-lines">
              <span className="lch-skel lch-skel-line" />
              <span className="lch-skel lch-skel-line short" />
            </div>
          </div>
        )}

        {handle && isError && (
          <p className="lch-empty">
            Couldn&apos;t find <strong>{handle}</strong>
            {error?.message ? ` — ${error.message}` : '. Check the handle and try again.'}
          </p>
        )}

        {handle && !isLoading && !isError && user && (
          <>
            <div className="lch-profile">
              {user.avatar ? (
                <img className="lch-avatar" src={user.avatar} alt="" />
              ) : (
                <span className="lch-avatar lch-avatar-fallback">
                  {(user.username || handle).slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="lch-profile-meta">
                <span className="lch-profile-name">{user.realName || user.username || handle}</span>
                {user.username && user.realName && (
                  <span className="lch-profile-handle">@{user.username}</span>
                )}
              </div>
              <div className="lch-stat-grid">
                <div className="lch-stat">
                  <span className="lch-stat-ico"><Award size={14} aria-hidden /></span>
                  <span className="lch-stat-val">{Math.round(realRating)}</span>
                  <span className="lch-stat-lbl">Rating</span>
                </div>
                <div className="lch-stat">
                  <span className="lch-stat-ico"><Hash size={14} aria-hidden /></span>
                  <span className="lch-stat-val">{user.attendedContestsCount ?? 0}</span>
                  <span className="lch-stat-lbl">Contests</span>
                </div>
                <div className="lch-stat">
                  <span className="lch-stat-ico"><Globe size={14} aria-hidden /></span>
                  <span className="lch-stat-val">
                    {user.globalRanking ? Number(user.globalRanking).toLocaleString() : '—'}
                  </span>
                  <span className="lch-stat-lbl">Global rank</span>
                </div>
              </div>
            </div>

            <div className="lch-whatif">
              <div className="lch-slider-row">
                <label htmlFor="lch-rank" className="lch-slider-lbl">
                  Predicted finish rank in your next contest
                </label>
                <span className="lch-slider-val">#{rank.toLocaleString()}</span>
              </div>
              <input
                id="lch-rank"
                type="range"
                min={1}
                max={RANK_MAX}
                step={1}
                value={rank}
                onChange={(e) => setRank(Number(e.target.value))}
                className="lch-range"
                style={{ '--fill': `${((rank - 1) / (RANK_MAX - 1)) * 100}%` }}
              />
              <div className="lch-range-ticks">
                <span>#1</span>
                <span>#{RANK_MAX.toLocaleString()}</span>
              </div>

              <div className="lch-projection">
                <div className="lch-proj-cell">
                  <span className="lch-proj-lbl">Projected change</span>
                  <span
                    className="lch-proj-delta"
                    style={{ color: positive ? 'var(--easy)' : 'var(--text-dim)' }}
                  >
                    {positive ? <TrendingUp size={18} aria-hidden /> : <TrendingDown size={18} aria-hidden />}
                    {positive ? '+' : ''}{delta.toFixed(1)}
                  </span>
                </div>
                <div className="lch-proj-arrow" aria-hidden>
                  <ArrowRight size={18} />
                </div>
                <div className="lch-proj-cell">
                  <span className="lch-proj-lbl">New rating</span>
                  <span className="lch-proj-new">{Math.round(prediction.newRating)}</span>
                </div>
              </div>

              <p className="lch-caption">
                An estimate projected from your real current rating of {Math.round(realRating)}; actual
                contest deltas depend on the live field.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
