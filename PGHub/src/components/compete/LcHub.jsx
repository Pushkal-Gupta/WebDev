import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight, ListOrdered, Trophy, ArrowRight, Search,
  TrendingUp, TrendingDown, Award, Hash, Globe, Calendar,
  Target, CheckCircle2, Sparkles, SlidersHorizontal, Minus,
  Hourglass, Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLeetCodeUser, useProfile, useLcUserContestRank } from '../../lib/queries';
import { predictDelta, pendingContestSince, SAMPLE_FIELD, TOTAL_PARTICIPANTS } from '../contests/LeetCodeAnalytics';
import Breadcrumb from '../common/Breadcrumb';
import './LcHub.css';

// SAMPLE_FIELD / TOTAL_PARTICIPANTS are the single calibrated source of truth in
// LeetCodeAnalytics — predictDelta scales the field sample to the true
// participant count. A local divergent copy here over-predicted strong finishes.

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

const fmtDate = (unixSeconds) => {
  const t = Number(unixSeconds);
  if (!Number.isFinite(t) || t <= 0) return '';
  return new Date(t * 1000).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export default function LcHub() {
  const [userId, setUserId] = useState(null);
  const [draft, setDraft] = useState('');
  const [handle, setHandle] = useState('');
  const [rank, setRank] = useState(2000);
  const [prefilled, setPrefilled] = useState(false);
  const [nowMs] = useState(() => Date.now());

  // Pull the signed-in user's saved LeetCode handle (if any) and prefill once.
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUserId(data?.session?.user?.id ?? null);
    });
    return () => { alive = false; };
  }, []);

  const { data: profile } = useProfile(userId);
  const savedHandle = profile?.leetcode_handle?.trim();

  // Prefill once, the moment the saved handle resolves. Adjusting state during
  // render (the React-recommended pattern) keeps this off the effect path.
  if (!prefilled && savedHandle) {
    setPrefilled(true);
    setDraft(savedHandle);
    setHandle(savedHandle);
  }

  const { data: user, isLoading, isError, error } = useLeetCodeUser(handle);

  const realRating = useMemo(() => {
    const r = Number(user?.rating);
    return Number.isFinite(r) && r > 0 ? r : 1500;
  }, [user]);

  // The most recent contest the user actually competed in, plus the rating they
  // carried INTO it (the previous attended contest's finalized rating, or 1500
  // on debut). This pre-contest rating is what makes "change" line up with
  // LeetCode's own delta.
  const latest = useMemo(() => {
    const attended = (user?.history || [])
      .filter((h) => h?.attended)
      .sort((a, b) => Number(a.startTime) - Number(b.startTime));
    if (!attended.length) return null;

    const current = attended[attended.length - 1];
    const previous = attended.length > 1 ? attended[attended.length - 2] : null;
    const oldRating = previous ? Number(previous.rating) : 1500;

    // A just-finished round shows in history with a rank but no published rating
    // for a while — LeetCode rates contests well after they end. In that window
    // we predict from the rank and read the actual as "pending".
    const newRating = Number(current.rating);
    const ratingPending = !Number.isFinite(newRating) || newRating <= 0;
    const actualChange = ratingPending ? null : newRating - oldRating;

    const played = Math.max(0, (Number(user?.attendedContestsCount) || attended.length) - 1);
    const expected = predictDelta({
      rating: oldRating,
      actualRank: Math.max(1, Number(current.ranking) || 1),
      contestsPlayed: played,
      fieldRatings: SAMPLE_FIELD,
      fieldSize: TOTAL_PARTICIPANTS,
    });

    return { current, oldRating, newRating, actualChange, expected, isDebut: !previous, played, ratingPending };
  }, [user]);

  // A round the user just played that LeetCode hasn't rated yet (so it isn't in
  // the history API). Detected from the public cadence. Only when the API's
  // latest IS finalized — an unrated latest entry is handled by ratingPending.
  // Plain computation (cheap) so the React Compiler auto-memoizes it; a useMemo
  // here trips the manual-deps heuristic, which mistakes `latest.current` for a
  // ref access and bails out of optimizing the whole component.
  const pendingRaw =
    latest && !latest.ratingPending ? pendingContestSince(latest.current, nowMs) : null;
  const pending = pendingRaw
    ? {
        ...pendingRaw,
        // slug for the ranking fetch: "Weekly Contest 508" -> "weekly-contest-508"
        slug: pendingRaw.title.toLowerCase().replace(/\s+/g, '-'),
        base: Math.round(Number(latest.newRating) || realRating),
        played: Math.max(0, Number(user?.attendedContestsCount) || latest.played + 1),
      }
    : null;

  // LeetCode publishes the contest RANKING immediately (before the official
  // rating change). We auto-fetch the user's rank server-side (the lc-user-
  // contest-rank edge function reads LeetCode's ranking through a headless-
  // browser proxy that clears Cloudflare, centering the scan on the page the
  // user's rating implies). Passing the rating makes that scan fast. If the rank
  // can't be reached, the user can still type it — either way we PREDICT the
  // swing now (Current -> Predicted). The fetched field size (real participant
  // count) also feeds the model instead of the default estimate.
  const { data: pendingRankData } = useLcUserContestRank(pending?.slug, handle, pending?.base, !!pending);
  const fetchedRank = pendingRankData?.ok && pendingRankData?.found
    ? Math.max(1, Number(pendingRankData.rank) || 0)
    : null;
  const fetchedField = pendingRankData?.ok && Number(pendingRankData.totalUsers) > 0
    ? Math.round(Number(pendingRankData.totalUsers))
    : TOTAL_PARTICIPANTS;
  const [manualRank, setManualRank] = useState('');
  // Reset the typed rank whenever the pending contest changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setManualRank(''); }, [pending?.slug]);
  const pendingRank = fetchedRank
    ?? (manualRank.trim() && Number(manualRank) > 0 ? Math.round(Number(manualRank)) : null);
  const pendingPrediction = pending && pendingRank
    ? Math.round(predictDelta({
        rating: pending.base,
        actualRank: pendingRank,
        contestsPlayed: pending.played,
        fieldRatings: SAMPLE_FIELD,
        fieldSize: fetchedField,
      }).delta)
    : null;

  // What-if re-runs against the SAME baseline the latest round used: the
  // pre-contest rating normally, or the CURRENT rating when a round is awaiting
  // LeetCode's rating (so a finish projects that pending round directly). Plain
  // computations so the React Compiler auto-memoizes — a manual useMemo here
  // can't be preserved once it depends on the cadence-derived `pending`.
  const whatIfBase = pending ? pending.base : latest ? latest.oldRating : realRating;
  const attendedCount = Number(user?.attendedContestsCount);
  const whatIfPlayed = pending
    ? pending.played
    : Math.max(0, (Number.isFinite(attendedCount) && attendedCount > 0 ? attendedCount : 1) - 1);

  const whatIf = predictDelta({
    rating: whatIfBase,
    actualRank: Math.max(1, rank),
    contestsPlayed: whatIfPlayed,
    fieldRatings: SAMPLE_FIELD,
    fieldSize: TOTAL_PARTICIPANTS,
  });

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (v) setHandle(v);
  };

  const wDelta = whatIf.delta;
  const wPositive = wDelta >= 0;
  const noContests = handle && !isLoading && !isError && user && !latest;

  return (
    <div className="lch-wrap">
      <Breadcrumb items={[{ label: 'Compete', to: '/compete' }, { label: 'LeetCode' }]} />

      <header className="lch-hero">
        <h1 className="lch-title">LeetCode</h1>
        <p className="lch-sub">
          Work the catalog, follow the contests, and check how your latest round moved your rating.
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
          <h2>Your latest contest</h2>
        </div>
        <p className="lch-panel-sub">
          Enter a LeetCode handle to pull your latest round — rated, or still awaiting LeetCode&apos;s
          update — and see how it moved your rating against what our model expected.
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
          <>
            <div className="lch-profile lch-skel-row" aria-hidden>
              <span className="lch-skel lch-skel-avatar" />
              <div className="lch-skel-lines">
                <span className="lch-skel lch-skel-line" />
                <span className="lch-skel lch-skel-line short" />
              </div>
            </div>
            <div className="lch-skel lch-skel-block" aria-hidden />
          </>
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

            {pending && (
              <article className="lch-contest lch-contest-pending">
                <header className="lch-contest-head">
                  <div className="lch-contest-title">
                    <Hourglass size={16} aria-hidden />
                    <span>{pending.title}</span>
                  </div>
                  <span className="lch-pending-pill">
                    <Clock size={12} aria-hidden /> Predicted · not yet rated by LeetCode
                  </span>
                </header>

                <div className="lch-facts">
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><Calendar size={14} aria-hidden /></span>
                    <span className="lch-fact-val lch-fact-date">{fmtDate(pending.startTime)}</span>
                    <span className="lch-fact-lbl">Contest day</span>
                  </div>
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><Hash size={14} aria-hidden /></span>
                    <span className="lch-fact-val">{pendingRank ? `#${pendingRank.toLocaleString()}` : '…'}</span>
                    <span className="lch-fact-lbl">
                      {pendingRank ? 'Your rank' : (pendingRankData === undefined ? 'Fetching rank' : 'Enter rank below')}
                    </span>
                  </div>
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><Award size={14} aria-hidden /></span>
                    <span className="lch-fact-val">{pending.base}</span>
                    <span className="lch-fact-lbl">Current rating</span>
                  </div>
                </div>

                {/* Rank source: auto-fetched (if Cloudflare lets us) or typed in. */}
                {!fetchedRank && (
                  <label className="lch-rank-entry">
                    <span className="lch-rank-entry-lbl">
                      <Hash size={13} aria-hidden /> Your rank in {pending.title}
                    </span>
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      className="lch-rank-input"
                      placeholder="e.g. 798"
                      value={manualRank}
                      onChange={(e) => setManualRank(e.target.value)}
                    />
                    <span className="lch-rank-entry-hint">
                      Find it on your <a href={`https://leetcode.com/contest/${pending.slug}/ranking/`} target="_blank" rel="noreferrer noopener">contest ranking page</a> — we&apos;ll predict the swing.
                    </span>
                  </label>
                )}

                {pendingPrediction != null ? (
                  <>
                    <div className="lch-move">
                      <span className="lch-move-from">{pending.base}</span>
                      <ArrowRight size={15} aria-hidden />
                      <span className="lch-move-to">{pending.base + pendingPrediction}</span>
                      <span className={`lch-move-delta ${pendingPrediction >= 0 ? 'up' : 'down'}`}>
                        {pendingPrediction >= 0 ? '+' : ''}{pendingPrediction}
                      </span>
                    </div>
                    <div className="lch-predict-grid">
                      <div className="lch-predict-card">
                        <span className="lch-predict-lbl"><Award size={13} aria-hidden /> Current rating</span>
                        <span className="lch-predict-val">{pending.base}</span>
                        <span className="lch-predict-sub">last confirmed by LeetCode</span>
                      </div>
                      <div className="lch-predict-card is-predicted">
                        <span className="lch-predict-lbl"><Sparkles size={13} aria-hidden /> Predicted rating</span>
                        <span className="lch-predict-val">{pending.base + pendingPrediction}</span>
                        <span className="lch-predict-sub">
                          {pendingPrediction >= 0 ? '+' : ''}{pendingPrediction} from rank #{pendingRank.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="lch-pending-note">
                    Enter your rank above and we&apos;ll project {pending.title} from your current {pending.base} —
                    LeetCode will confirm the official change in a day or two.
                  </p>
                )}
              </article>
            )}

            {latest && (
              <article className="lch-contest">
                <header className="lch-contest-head">
                  <div className="lch-contest-title">
                    <Trophy size={16} aria-hidden />
                    <span>{latest.current.title}</span>
                    {pending && <span className="lch-rated-tag">Last rated</span>}
                  </div>
                  <div className="lch-contest-meta">
                    <span className="lch-contest-date">
                      <Calendar size={13} aria-hidden />
                      {fmtDate(latest.current.startTime)}
                    </span>
                    {latest.ratingPending ? (
                      <span className="lch-trend-pill" style={{ color: 'var(--text-dim)' }}>
                        <Clock size={13} aria-hidden /> pending
                      </span>
                    ) : (
                      <ChangePill change={latest.actualChange} />
                    )}
                  </div>
                </header>

                <div className="lch-facts">
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><Hash size={14} aria-hidden /></span>
                    <span className="lch-fact-val">
                      {latest.current.ranking ? `#${Number(latest.current.ranking).toLocaleString()}` : '—'}
                    </span>
                    <span className="lch-fact-lbl">Rank</span>
                  </div>
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><CheckCircle2 size={14} aria-hidden /></span>
                    <span className="lch-fact-val">
                      {latest.current.problemsSolved ?? 0}
                      <span className="lch-fact-of">/{latest.current.totalProblems ?? '—'}</span>
                    </span>
                    <span className="lch-fact-lbl">Solved</span>
                  </div>
                  <div className="lch-fact">
                    <span className="lch-fact-ico"><Award size={14} aria-hidden /></span>
                    <span className="lch-fact-val">
                      {Math.round(latest.oldRating)}
                      {latest.isDebut && <span className="lch-fact-of"> (debut)</span>}
                    </span>
                    <span className="lch-fact-lbl">Old rating</span>
                  </div>
                </div>

                <div className="lch-movement">
                  <div className="lch-move-track">
                    <span className="lch-move-old">{Math.round(latest.oldRating)}</span>
                    <span className="lch-move-arrow" aria-hidden><ArrowRight size={18} /></span>
                    {latest.ratingPending ? (
                      <>
                        <span className="lch-move-new" style={{ color: chgColor(latest.expected.delta) }}>
                          ~{Math.round(latest.expected.newRating)}
                        </span>
                        <span className="lch-move-chip" style={{ color: 'var(--text-dim)' }}>
                          rating pending on LeetCode
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="lch-move-new">{Math.round(latest.newRating)}</span>
                        <span
                          className="lch-move-chip"
                          style={{ color: chgColor(latest.actualChange) }}
                        >
                          {changeIcon(latest.actualChange)}
                          {fmtChange(latest.actualChange)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="lch-compare">
                    <div className="lch-compare-cell">
                      <span className="lch-compare-lbl">
                        <Sparkles size={12} aria-hidden /> Expected rating
                      </span>
                      <span className="lch-compare-val">{Math.round(latest.expected.newRating)}</span>
                      <span
                        className="lch-compare-sub"
                        style={{ color: chgColor(latest.expected.delta) }}
                      >
                        {fmtChange(latest.expected.delta)} projected
                      </span>
                    </div>
                    <div className="lch-compare-cell">
                      <span className="lch-compare-lbl">
                        <Target size={12} aria-hidden /> Actual rating
                      </span>
                      <span className="lch-compare-val">
                        {latest.ratingPending ? '—' : Math.round(latest.newRating)}
                      </span>
                      <span
                        className="lch-compare-sub"
                        style={{ color: latest.ratingPending ? 'var(--text-dim)' : chgColor(latest.actualChange) }}
                      >
                        {latest.ratingPending ? 'pending LeetCode update' : `${fmtChange(latest.actualChange)} on LeetCode`}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {noContests && (
              <p className="lch-empty">
                <strong>{user.username || handle}</strong> hasn&apos;t finished a rated contest yet. Try the
                what-if below to project a finish against the current rating of {Math.round(realRating)}.
              </p>
            )}

            <details className="lch-whatif" open={!!noContests || !!pending}>
              <summary className="lch-whatif-summary">
                <SlidersHorizontal size={15} aria-hidden />
                <span>{pending ? `Project your ${pending.title} finish` : 'What if you placed differently?'}</span>
                <ChevronRight size={15} className="lch-whatif-caret" aria-hidden />
              </summary>

              <div className="lch-whatif-body">
                <p className="lch-whatif-note">
                  {pending
                    ? `Drag your finish to project ${pending.title} from your current rating of ${Math.round(whatIfBase)}.`
                    : `Hypothetical only — drag a finish to project the swing from a baseline rating of ${Math.round(whatIfBase)}.`}
                </p>

                <div className="lch-slider-row">
                  <label htmlFor="lch-rank" className="lch-slider-lbl">
                    Finish rank
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
                    <span className="lch-proj-delta" style={{ color: chgColor(wDelta) }}>
                      {wPositive ? <TrendingUp size={18} aria-hidden /> : <TrendingDown size={18} aria-hidden />}
                      {fmtChange(wDelta)}
                    </span>
                  </div>
                  <div className="lch-proj-arrow" aria-hidden>
                    <ArrowRight size={18} />
                  </div>
                  <div className="lch-proj-cell">
                    <span className="lch-proj-lbl">Projected rating</span>
                    <span className="lch-proj-new">{Math.round(whatIf.newRating)}</span>
                  </div>
                </div>
              </div>
            </details>
          </>
        )}
      </section>
    </div>
  );
}

function chgColor(change) {
  if (change > 0) return 'var(--easy)';
  if (change < 0) return 'var(--hard)';
  return 'var(--text-dim)';
}

function fmtChange(change) {
  const r = Math.round(change);
  return `${r > 0 ? '+' : ''}${r}`;
}

function changeIcon(change) {
  if (change > 0) return <TrendingUp size={15} aria-hidden />;
  if (change < 0) return <TrendingDown size={15} aria-hidden />;
  return <Minus size={15} aria-hidden />;
}

function ChangePill({ change }) {
  return (
    <span className="lch-trend-pill" style={{ color: chgColor(change) }}>
      {changeIcon(change)}
      {fmtChange(change)}
    </span>
  );
}
