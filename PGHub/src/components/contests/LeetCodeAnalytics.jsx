import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  TrendingUp, TrendingDown, MousePointerClick, Search, Trophy, Calendar,
  Hash, CheckCircle2, Award, Globe, Sparkles, Target, SlidersHorizontal,
  ChevronRight, Minus, Hourglass, Clock,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { supabase } from '../../lib/supabase';
import { useLeetCodeUser, useProfile } from '../../lib/queries';
import './Contests.css';

// Display-mode KaTeX → HTML string; matches ConceptPage's renderer.
function TexBlock({ tex }) {
  const html = useMemo(
    () => katex.renderToString(tex, { throwOnError: false, displayMode: true, output: 'html' }),
    [tex],
  );
  return <div className="lca-tex" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── LeetCode rating-prediction model ─────────────────────────────────────────
// LeetCode uses an Elo-style update. Each contestant i has a rating R_i. The
// probability that i ranks ahead of j is the logistic
//     P(i beats j) = 1 / (1 + 10^((R_j - R_i) / 400)).
// The EXPECTED rank of i across the field is
//     E_i = 1 + sum_{j != i} P(j beats i)
//         = 0.5 + sum_{j} 1 / (1 + 10^((R_i - R_j) / 400)).
// The "seed" is that expected rank. Combining the expected rank with the actual
// rank gives a performance target via the geometric mean
//     m_i = sqrt(E_i * actualRank_i),
// and we invert the seed function to find the rating that would have produced
// rank m_i (binary search on R). The raw delta is (target - R_i) / 2, scaled by
// a contest-count factor f(k) that shrinks updates as a player plays more
// contests (new accounts move fast, veterans move slowly):
//     f(k) = 1 / (1 + sum_{t=1..min(k,K)} 0.9^t / GAMMA), with a floor.
// new_rating = R_i + f(k) * rawDelta.
// Calibrated against a real result: rating 2148, rank 760 in a ~24k field with
// 14 contests played → +25 (LeetCode's actual delta there was +20). A veteran's
// swings land in the tens; a 1-3 contest newcomer's land in the hundreds.

// Expected rank (seed) of a player with rating R against the whole field.
// `ratings` is a REPRESENTATIVE SAMPLE of the field; `fieldSize` is the true
// participant count. We average the win-probability over the sample and scale
// it to the full field — otherwise a rank on the 24k scale gets compared to a
// seed on the 12-sample scale, which craters good finishes (a 2050 player at
// rank 157 must not be predicted to lose 800 points).
function expectedRank(R, ratings, fieldSize) {
  const N = fieldSize || ratings.length;
  let sum = 0;
  for (const rj of ratings) sum += 1 / (1 + Math.pow(10, (R - rj) / 400));
  return 0.5 + (N / ratings.length) * sum;
}

// Invert: find the rating whose expected rank equals targetRank.
function ratingForRank(targetRank, ratings, fieldSize) {
  let lo = 0, hi = 4000;
  for (let it = 0; it < 80; it++) {
    const mid = (lo + hi) / 2;
    // expectedRank is monotonically DECREASING in R (higher rating -> better rank)
    if (expectedRank(mid, ratings, fieldSize) < targetRank) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// Shrink factor by contests played (more contests -> smaller swings).
// The weighted sum saturates at ~9 as k grows; GAMMA=0.7 tunes the curve so a
// 14-contest veteran lands at f≈0.09 (tens-of-points swings) while a 1-3 contest
// newcomer stays near f≈0.45 (hundreds). Calibrated to the 2148/rank-760/k14
// data point — do not raise GAMMA without re-checking that case.
function dampingFactor(contestsPlayed) {
  let weighted = 0;
  const cap = Math.min(Math.max(contestsPlayed, 0), 100);
  for (let t = 1; t <= cap; t++) weighted += Math.pow(0.9, t);
  const f = 1 / (1 + weighted / 0.7);
  return Math.max(f, 0.06); // floor so seasoned players still move a little
}

// eslint-disable-next-line react-refresh/only-export-components
export function predictDelta({ rating, actualRank, contestsPlayed, fieldRatings, fieldSize }) {
  const N = fieldSize || fieldRatings.length;
  const seed = expectedRank(rating, fieldRatings, N);
  const performanceRank = Math.sqrt(seed * actualRank);
  const target = ratingForRank(performanceRank, fieldRatings, N);
  const rawDelta = (target - rating) / 2;
  const f = dampingFactor(contestsPlayed);
  const delta = f * rawDelta;
  return {
    seed,
    performanceRank,
    target,
    factor: f,
    delta,
    newRating: rating + delta,
  };
}

// ── Sample contest data (illustrative; replace with edge-function fetch) ──────
const SAMPLE_QUESTIONS = [
  { id: 'Q1', title: 'Count Balanced Substrings', difficulty: 'easy',   attempted: 23180, solved: 21940 },
  { id: 'Q2', title: 'Maximize Greatness', difficulty: 'medium', attempted: 19840, solved: 12310 },
  { id: 'Q3', title: 'Shortest Path With Reset', difficulty: 'medium', attempted: 14210, solved: 4820 },
  { id: 'Q4', title: 'Subtrees With XOR', difficulty: 'hard', attempted: 9650, solved: 1140 },
];

// Estimated problem rating from how the field fared on it: the lower the solve
// rate, the higher the rating. Difficulty sets the floor; (1 - solveRate)
// scales how far above the floor it lands. Mirrors Codeforces-style ratings.
const DIFF_FLOOR = { easy: 1300, medium: 1600, hard: 2000 };
function estimatedRating(q) {
  const p = q.attempted ? q.solved / q.attempted : 0;
  const floor = DIFF_FLOOR[q.difficulty] ?? 1500;
  return Math.round((floor + Math.pow(1 - p, 1.15) * 900) / 10) * 10;
}

export const TOTAL_PARTICIPANTS = 24180;
// A representative slice of a real LeetCode field — mid-weighted around ~1500
// with thinner high/low tails (NOT top-heavy), so a strong rating maps to a
// strong expected rank. Used as the distribution sample the model scales to
// TOTAL_PARTICIPANTS. EXPORTED as the single source of truth — every caller of
// predictDelta must reuse this exact field; a divergent (more bottom-heavy)
// slice inflates a strong player's seed and over-predicts (the 2148/+234 bug).
// eslint-disable-next-line react-refresh/only-export-components
export const SAMPLE_FIELD = [
  3100, 2700, 2400, 2150, 1950, 1800, 1700, 1620, 1560, 1510,
  1470, 1430, 1390, 1350, 1310, 1270, 1230, 1180, 1120, 1040, 950, 850,
];

// ── Pending (unrated) contest detection ──────────────────────────────────────
// LeetCode appends a round to userContestRankingHistory only AFTER it rates it,
// which can lag the contest by a day or more. So the API's "latest" round may be
// one or two behind what the user actually just played. We detect that gap from
// the public cadence (Weekly every Sunday 02:30 UTC, Biweekly alternate
// Saturdays 14:30 UTC) and surface the most recent FINISHED round that started
// after the last rated one as "awaiting LeetCode's rating". As soon as LeetCode
// rates it, it enters the history and this returns null again (self-correcting).
const PENDING_WEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 8, 29, 2, 30), number: 419 }; // Sun 2024-09-29
const PENDING_BIWEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 9, 5, 14, 30), number: 142 }; // Sat 2024-10-05
const PENDING_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PENDING_FORTNIGHT_MS = 14 * 24 * 60 * 60 * 1000;
const PENDING_DURATION_MS = 90 * 60 * 1000;

function parseContestNumber(title) {
  const m = /(\d+)\s*$/.exec(String(title || '').trim());
  return m ? Number(m[1]) : null;
}

// eslint-disable-next-line react-refresh/only-export-components
export function pendingContestSince(lastRated, nowMs = Date.now()) {
  const lastStartMs = Number(lastRated?.startTime) * 1000;
  if (!Number.isFinite(lastStartMs) || lastStartMs <= 0) return null;

  // Latest occurrence of each cadence that has fully FINISHED by now.
  const latestFinished = (anchorMs, period) => {
    const k = Math.floor((nowMs - anchorMs - PENDING_DURATION_MS) / period);
    return k >= 0 ? anchorMs + k * period : null;
  };
  const wStart = latestFinished(PENDING_WEEKLY_ANCHOR.utcMs, PENDING_WEEK_MS);
  const bStart = latestFinished(PENDING_BIWEEKLY_ANCHOR.utcMs, PENDING_FORTNIGHT_MS);

  const cands = [];
  if (wStart && wStart > lastStartMs) cands.push({ kind: 'weekly', startMs: wStart, period: PENDING_WEEK_MS });
  if (bStart && bStart > lastStartMs) cands.push({ kind: 'biweekly', startMs: bStart, period: PENDING_FORTNIGHT_MS });
  if (!cands.length) return null;
  cands.sort((a, b) => b.startMs - a.startMs);
  const pick = cands[0];

  // Cadence NUMBERING drifts from LeetCode's real numbering, so never trust the
  // synthetic number. If the last rated round is the SAME cadence, extrapolate a
  // real number from its title; otherwise present the round by date only.
  const lastTitle = lastRated?.title || '';
  const lastIsBiweekly = /biweekly/i.test(lastTitle);
  const lastIsWeekly = /weekly/i.test(lastTitle) && !lastIsBiweekly;
  const lastNum = parseContestNumber(lastTitle);
  const label = pick.kind === 'weekly' ? 'Weekly Contest' : 'Biweekly Contest';
  let title = label;
  if (
    lastNum != null &&
    ((pick.kind === 'weekly' && lastIsWeekly) || (pick.kind === 'biweekly' && lastIsBiweekly))
  ) {
    const steps = Math.round((pick.startMs - lastStartMs) / pick.period);
    title = `${label} ${lastNum + steps}`;
  }

  return { kind: pick.kind, startMs: pick.startMs, startTime: Math.round(pick.startMs / 1000), title };
}

const DIFF_HUE = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const fmtDate = (unixSeconds) => {
  const t = Number(unixSeconds);
  if (!Number.isFinite(t) || t <= 0) return '';
  return new Date(t * 1000).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const chgColor = (c) => (c > 0 ? 'var(--easy)' : c < 0 ? 'var(--hard)' : 'var(--text-dim)');
const fmtChange = (c) => { const r = Math.round(c); return `${r > 0 ? '+' : ''}${r}`; };
const changeIcon = (c) => (c > 0
  ? <TrendingUp size={15} aria-hidden />
  : c < 0 ? <TrendingDown size={15} aria-hidden /> : <Minus size={15} aria-hidden />);

export default function LeetCodeAnalytics() {
  // ── Primary flow: look a handle up and read its LAST attended contest ──────
  const [userId, setUserId] = useState(null);
  const [draft, setDraft] = useState('');
  const [handle, setHandle] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [nowMs] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setUserId(data?.session?.user?.id ?? null);
    });
    return () => { alive = false; };
  }, []);

  const { data: profile } = useProfile(userId);
  const savedHandle = profile?.leetcode_handle?.trim();

  // Prefill once, the moment the saved handle resolves (render-time set is the
  // React-recommended pattern and keeps this off the effect path).
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

  // Most recent attended contest + the rating carried INTO it (the previous
  // attended contest's finalized rating, or 1500 on debut). Using that
  // pre-contest rating makes our "change" line up with LeetCode's own delta.
  const latest = useMemo(() => {
    const attended = (user?.history || [])
      .filter((h) => h?.attended)
      .sort((a, b) => Number(a.startTime) - Number(b.startTime));
    if (!attended.length) return null;

    const current = attended[attended.length - 1];
    const previous = attended.length > 1 ? attended[attended.length - 2] : null;
    // The just-finished contest shows up in history with a rank but no published
    // rating for a few hours — LeetCode rates contests well after they end. In that
    // window we still predict from the rank; the actual rating reads "pending".
    const newRating = Number(current.rating);
    const ratingPending = !Number.isFinite(newRating) || newRating <= 0;
    const oldRating = Number(previous?.rating) || Number(user?.rating) || 1500;
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
  // the history API). Only when the API's latest IS finalized — if the latest
  // entry is itself unrated, the ratingPending path above already covers it.
  const pending = useMemo(() => {
    if (!latest || latest.ratingPending) return null;
    const p = pendingContestSince(latest.current, nowMs);
    if (!p) return null;
    const base = Math.round(Number(latest.newRating) || realRating);
    const played = Math.max(0, Number(user?.attendedContestsCount) || latest.played + 1);
    return { ...p, base, played };
  }, [latest, realRating, user, nowMs]);

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (v) setHandle(v);
  };

  const noContests = handle && !isLoading && !isError && user && !latest;

  // ── What-if (demoted): re-run against the SAME baseline the last round used,
  // so experimenting with a different finish stays anchored to the real rating.
  // When a round is awaiting LeetCode's rating, rebase onto the CURRENT rating so
  // dragging a finish projects that pending round directly. ─
  const [rank, setRank] = useState(820);
  const whatIfBase = pending ? pending.base : latest ? latest.oldRating : realRating;
  const whatIfPlayed = pending
    ? pending.played
    : latest
      ? latest.played
      : Math.max(0, (Number(user?.attendedContestsCount) || 1) - 1);

  const whatIf = useMemo(
    () => predictDelta({
      rating: whatIfBase,
      actualRank: Math.max(1, rank),
      contestsPlayed: whatIfPlayed,
      fieldRatings: SAMPLE_FIELD,
      fieldSize: TOTAL_PARTICIPANTS,
    }),
    [whatIfBase, rank, whatIfPlayed],
  );
  const wUp = whatIf.delta >= 0;
  const percentile = clamp((1 - rank / TOTAL_PARTICIPANTS) * 100, 0, 100);

  return (
    <div className="lca-wrap">
      <p className="ctx-sub lca-intro">
        Enter your LeetCode username to pull your latest rated round, see how it actually moved your
        rating, and compare it against what our model expected.
      </p>

      {/* Primary: username → last contest → prediction */}
      <section className="lca-section">
        <form className="lca-lookup" onSubmit={submit}>
          <div className="lca-lookup-input">
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
          <button type="submit" className="lca-lookup-btn" disabled={!draft.trim()}>
            Look up
          </button>
        </form>

        {!handle && (
          <p className="lca-empty">
            We&apos;ll find your most recent contest and turn its finish into a rating prediction —
            no manual entry needed.
          </p>
        )}

        {handle && isLoading && <div className="lca-skel" aria-hidden />}

        {handle && isError && (
          <p className="lca-empty">
            Couldn&apos;t find <strong>{handle}</strong>
            {error?.message ? ` — ${error.message}` : '. Check the username and try again.'}
          </p>
        )}

        {handle && !isLoading && !isError && user && (
          <>
            <div className="lca-profile">
              {user.avatar ? (
                <img className="lca-avatar" src={user.avatar} alt="" />
              ) : (
                <span className="lca-avatar lca-avatar-fb">
                  {(user.username || handle).slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="lca-profile-meta">
                <span className="lca-profile-name">{user.realName || user.username || handle}</span>
                {user.username && user.realName && (
                  <span className="lca-profile-handle">@{user.username}</span>
                )}
              </div>
              <div className="lca-stat-grid">
                <div className="lca-stat">
                  <span className="lca-stat-ico"><Award size={14} aria-hidden /></span>
                  <span className="lca-stat-val">{Math.round(realRating)}</span>
                  <span className="lca-stat-lbl">Rating</span>
                </div>
                <div className="lca-stat">
                  <span className="lca-stat-ico"><Hash size={14} aria-hidden /></span>
                  <span className="lca-stat-val">{user.attendedContestsCount ?? 0}</span>
                  <span className="lca-stat-lbl">Contests</span>
                </div>
                <div className="lca-stat">
                  <span className="lca-stat-ico"><Globe size={14} aria-hidden /></span>
                  <span className="lca-stat-val">
                    {user.globalRanking ? Number(user.globalRanking).toLocaleString() : '—'}
                  </span>
                  <span className="lca-stat-lbl">Global rank</span>
                </div>
              </div>
            </div>

            {pending && (
              <article className="lca-contest lca-contest-pending">
                <header className="lca-contest-head">
                  <div className="lca-contest-title">
                    <Hourglass size={16} aria-hidden />
                    <span>{pending.title}</span>
                  </div>
                  <span className="lca-pending-pill">
                    <Clock size={12} aria-hidden /> Awaiting LeetCode rating
                  </span>
                </header>

                <div className="lca-facts">
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><Calendar size={14} aria-hidden /></span>
                    <span className="lca-fact-val lca-fact-date">{fmtDate(pending.startTime)}</span>
                    <span className="lca-fact-lbl">Contest day</span>
                  </div>
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><Hash size={14} aria-hidden /></span>
                    <span className="lca-fact-val">—</span>
                    <span className="lca-fact-lbl">Rank pending</span>
                  </div>
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><Award size={14} aria-hidden /></span>
                    <span className="lca-fact-val">{pending.base}</span>
                    <span className="lca-fact-lbl">Current rating</span>
                  </div>
                </div>

                <p className="lca-pending-note">
                  LeetCode hasn&apos;t published results for {pending.title} yet, so it isn&apos;t in your
                  rated history. Your last confirmed rating is {pending.base}. Project the finish below to
                  see the likely swing — it&apos;ll be confirmed once LeetCode posts the official change.
                </p>
              </article>
            )}

            {latest && (
              <article className="lca-contest">
                <header className="lca-contest-head">
                  <div className="lca-contest-title">
                    <Trophy size={16} aria-hidden />
                    <span>{latest.current.title}</span>
                    {pending && <span className="lca-rated-tag">Last rated</span>}
                  </div>
                  <span className="lca-contest-date">
                    <Calendar size={13} aria-hidden />
                    {fmtDate(latest.current.startTime)}
                  </span>
                </header>

                <div className="lca-facts">
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><Hash size={14} aria-hidden /></span>
                    <span className="lca-fact-val">
                      {latest.current.ranking ? `#${Number(latest.current.ranking).toLocaleString()}` : '—'}
                    </span>
                    <span className="lca-fact-lbl">Rank</span>
                  </div>
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><CheckCircle2 size={14} aria-hidden /></span>
                    <span className="lca-fact-val">
                      {latest.current.problemsSolved ?? 0}
                      <span className="lca-fact-of">/{latest.current.totalProblems ?? '—'}</span>
                    </span>
                    <span className="lca-fact-lbl">Solved</span>
                  </div>
                  <div className="lca-fact">
                    <span className="lca-fact-ico"><Award size={14} aria-hidden /></span>
                    <span className="lca-fact-val">
                      {Math.round(latest.oldRating)}
                      {latest.isDebut && <span className="lca-fact-of"> (debut)</span>}
                    </span>
                    <span className="lca-fact-lbl">Old rating</span>
                  </div>
                </div>

                <div className="lca-move-track">
                  <span className="lca-move-old">{Math.round(latest.oldRating)}</span>
                  <span className="lca-move-arrow" aria-hidden>→</span>
                  {latest.ratingPending ? (
                    <>
                      <span className="lca-move-new" style={{ color: chgColor(latest.expected.delta) }}>
                        ~{Math.round(latest.expected.newRating)}
                      </span>
                      <span className="lca-move-chip" style={{ color: 'var(--text-dim)' }}>
                        rating pending on LeetCode
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="lca-move-new" style={{ color: chgColor(latest.actualChange) }}>
                        {Math.round(latest.newRating)}
                      </span>
                      <span className="lca-move-chip" style={{ color: chgColor(latest.actualChange) }}>
                        {changeIcon(latest.actualChange)}
                        {fmtChange(latest.actualChange)}
                      </span>
                    </>
                  )}
                </div>

                <div className="lca-compare">
                  <div className="lca-compare-cell">
                    <span className="lca-compare-lbl">
                      <Sparkles size={12} aria-hidden /> Expected rating
                    </span>
                    <span className="lca-compare-val">{Math.round(latest.expected.newRating)}</span>
                    <span className="lca-compare-sub" style={{ color: chgColor(latest.expected.delta) }}>
                      {fmtChange(latest.expected.delta)} projected
                    </span>
                  </div>
                  <div className="lca-compare-cell">
                    <span className="lca-compare-lbl">
                      <Target size={12} aria-hidden /> Actual rating
                    </span>
                    <span className="lca-compare-val">
                      {latest.ratingPending ? '—' : Math.round(latest.newRating)}
                    </span>
                    <span className="lca-compare-sub" style={{ color: latest.ratingPending ? 'var(--text-dim)' : chgColor(latest.actualChange) }}>
                      {latest.ratingPending ? 'pending LeetCode update' : `${fmtChange(latest.actualChange)} on LeetCode`}
                    </span>
                  </div>
                </div>
              </article>
            )}

            {noContests && (
              <p className="lca-empty">
                <strong>{user.username || handle}</strong> hasn&apos;t finished a rated contest yet. Open
                the what-if below to project a finish from the current rating of {Math.round(realRating)}.
              </p>
            )}
          </>
        )}
      </section>

      {/* Demoted what-if: manual sliders for experimenting only */}
      <section className="lca-section">
        <details className="lca-whatif" open={!!noContests || !!pending}>
          <summary className="lca-whatif-summary">
            <SlidersHorizontal size={15} aria-hidden />
            <span>{pending ? `Project your ${pending.title} finish` : 'What-if: try a different finish'}</span>
            <ChevronRight size={15} className="lca-whatif-caret" aria-hidden />
          </summary>

          <div className="lca-whatif-body">
            <p className="lca-whatif-note">
              {pending
                ? `Drag your finish rank to project ${pending.title} from your current rating of ${Math.round(whatIfBase)}.`
                : `Hypothetical only — drag a finish rank to project the swing from a baseline rating of ${Math.round(whatIfBase)}.`}
            </p>

            <div className="lca-predictor">
              <div className="lca-inputs">
                <Slider
                  label="Finish rank"
                  value={rank}
                  min={1}
                  max={TOTAL_PARTICIPANTS}
                  step={1}
                  onChange={setRank}
                  unit={`of ${TOTAL_PARTICIPANTS.toLocaleString()}`}
                />

                <div className="lca-pctl">
                  <div className="lca-pctl-head">
                    <span>Top {(100 - percentile).toFixed(1)}%</span>
                    <span>{rank.toLocaleString()} / {TOTAL_PARTICIPANTS.toLocaleString()}</span>
                  </div>
                  <div className="lca-pctl-track">
                    <div className="lca-pctl-fill" style={{ width: `${percentile}%` }} />
                    <div className="lca-pctl-marker" style={{ left: `${percentile}%` }} />
                  </div>
                </div>
              </div>

              <div className="lca-result">
                <span className="lca-result-cap">Projected new rating</span>
                <div className="lca-result-rating">{Math.round(whatIf.newRating).toLocaleString()}</div>
                <div className={`lca-result-chip ${wUp ? 'up' : 'down'}`}>
                  {wUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {fmtChange(whatIf.delta)}
                </div>
                <RatingSpark from={Math.round(whatIfBase)} to={Math.round(whatIf.newRating)} up={wUp} />
                <div className="lca-result-foot">
                  <span>{Math.round(whatIfBase).toLocaleString()}</span>
                  <span className="lca-result-foot-dim">base</span>
                  <span className="lca-result-foot-arrow">→</span>
                  <span className="lca-result-foot-dim">after</span>
                  <span>{Math.round(whatIf.newRating).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Rank → delta curve — click anywhere on it to set the finish rank */}
            <div className="lca-curve-head">
              <h2 className="lca-section-title">Rank to rating change</h2>
              <span className="lca-curve-hint">
                <MousePointerClick size={12} />
                Click the curve to set the finish rank
              </span>
            </div>
            <RankDeltaCurve
              rating={whatIfBase}
              played={whatIfPlayed}
              rank={rank}
              total={TOTAL_PARTICIPANTS}
              onPick={(r) => setRank(clamp(Math.round(r), 1, TOTAL_PARTICIPANTS))}
            />
          </div>
        </details>
      </section>

      {/* Per-question solve rate */}
      <section className="lca-section">
        <h2 className="lca-section-title">Solve rate &amp; estimated rating per question</h2>
        <div className="lca-qtable">
          <div className="lca-qhead">
            <span>Question</span>
            <span className="lca-qhead-bar">Solve rate</span>
            <span className="lca-qhead-num">Rating</span>
          </div>
          {SAMPLE_QUESTIONS.map(q => {
            const rate = q.solved / q.attempted;
            const er = estimatedRating(q);
            return (
              <div key={q.id} className="lca-qrow" style={{ '--q-hue': DIFF_HUE[q.difficulty] }}>
                <span className="lca-qid">{q.id}</span>
                <span className="lca-qtitle">{q.title}</span>
                <div className="lca-qbar">
                  <div className="lca-qbar-fill" style={{ width: `${rate * 100}%` }} />
                  <div className="lca-qtip" role="tooltip">
                    <span className="lca-qtip-diff">{q.difficulty}</span>
                    <span>{q.solved.toLocaleString()} of {q.attempted.toLocaleString()} solved</span>
                    <span>Estimated rating ~{er}</span>
                  </div>
                </div>
                <span className="lca-qpct">{(rate * 100).toFixed(0)}%</span>
                <span className="lca-qrating">~{er}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works — rendered open at the page tail */}
      <section className="lca-section">
        <h2 className="lca-section-title">How it works</h2>
        <div className="lca-disc-body">
            <p>
              Each contestant has an Elo rating. The logistic seed estimates where you
              should rank against the field; the geometric mean of that seed and your
              actual rank gives a performance target, and the rating that would produce it
              is your new rating — damped by how many contests you have already played.
            </p>
            <div className="lca-formula">
              <TexBlock tex={String.raw`P(i \succ j) = \dfrac{1}{1 + 10^{(R_j - R_i)/400}}`} />
              <TexBlock tex={String.raw`E_i = 0.5 + \sum_{j} \dfrac{1}{1 + 10^{(R_i - R_j)/400}}`} />
              <TexBlock tex={String.raw`m_i = \sqrt{E_i \cdot \mathrm{rank}_i}`} />
              <TexBlock tex={String.raw`R_{\text{new}} = R_i + f(k)\,\bigl(\mathrm{ratingForRank}(m_i) - R_i\bigr)`} />
            </div>
        </div>
      </section>
    </div>
  );
}

// Rank → delta curve. Samples the model across the full rank range at the
// current rating + contests, draws a smooth area+line, and lets the reader
// hover to read any point or click to drive the finish-rank input. A log rank
// axis keeps the steep top ranks legible.
function RankDeltaCurve({ rating, played, rank, total, onPick }) {
  const svgRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);

  const W = 720, H = 260, padL = 52, padR = 18, padT = 22, padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Log scale on rank so ranks 1..few-thousand aren't crushed against the axis.
  const lr = (r) => Math.log10(Math.max(r, 1));
  const lrMin = lr(1);
  const lrMax = lr(total);
  const xOf = (r) => padL + ((lr(r) - lrMin) / (lrMax - lrMin)) * plotW;
  const rankAtX = (x) => Math.pow(10, lrMin + ((x - padL) / plotW) * (lrMax - lrMin));

  const { pts, yOf, dMin, dMax } = useMemo(() => {
    const N = 120;
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const frac = i / N;
      const r = Math.round(Math.pow(10, lrMin + frac * (lrMax - lrMin)));
      const d = predictDelta({ rating, actualRank: r, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: TOTAL_PARTICIPANTS }).delta;
      samples.push({ r, d });
    }
    let mn = Infinity, mx = -Infinity;
    for (const s of samples) { mn = Math.min(mn, s.d); mx = Math.max(mx, s.d); }
    // Pad the band and always include the zero line.
    mn = Math.min(mn, 0); mx = Math.max(mx, 0);
    const pad = (mx - mn) * 0.12 || 10;
    mn -= pad; mx += pad;
    const yMap = (d) => padT + (1 - (d - mn) / (mx - mn)) * plotH;
    return { pts: samples, yOf: yMap, dMin: mn, dMax: mx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rating, played, lrMin, lrMax, plotW, plotH]);

  const linePath = useMemo(
    () => pts.map((p, i) => `${i ? 'L' : 'M'}${xOf(p.r).toFixed(1)},${yOf(p.d).toFixed(1)}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pts, yOf],
  );
  const zeroY = yOf(0);
  const areaPath = `${linePath} L${xOf(pts[pts.length - 1].r).toFixed(1)},${zeroY.toFixed(1)} L${xOf(pts[0].r).toFixed(1)},${zeroY.toFixed(1)} Z`;

  // Marker for the current finish rank.
  const curD = predictDelta({ rating, actualRank: rank, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: TOTAL_PARTICIPANTS }).delta;
  const curX = xOf(rank);
  const curY = yOf(curD);

  // Hover read-out (snapped to the cursor's rank).
  const hover = hoverX != null ? (() => {
    const r = clamp(Math.round(rankAtX(hoverX)), 1, total);
    const d = predictDelta({ rating, actualRank: r, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: TOTAL_PARTICIPANTS }).delta;
    return { r, d, x: xOf(r), y: yOf(d) };
  })() : null;

  // Rank gridlines at decade boundaries within range.
  const xTicks = [1, 10, 100, 1000, 10000].filter(t => t <= total);
  // Delta gridlines: zero plus a couple of rounded steps.
  const yTicks = useMemo(() => {
    const step = niceStep((dMax - dMin) / 4);
    const ticks = [];
    const start = Math.ceil(dMin / step) * step;
    for (let v = start; v <= dMax; v += step) ticks.push(Math.round(v));
    if (!ticks.includes(0)) ticks.push(0);
    return ticks;
  }, [dMin, dMax]);

  const ptFromEvent = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    return clamp(x, padL, W - padR);
  };

  return (
    <div className="lca-curve">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="lca-curve-svg"
        role="img"
        aria-label="Predicted rating change as a function of finish rank"
        onMouseMove={(e) => setHoverX(ptFromEvent(e))}
        onMouseLeave={() => setHoverX(null)}
        onClick={(e) => { const x = ptFromEvent(e); if (x != null) onPick(rankAtX(x)); }}
      >
        <defs>
          <linearGradient id="lcaCurveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(var(--accent-rgb), 0.28)" />
            <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.02)" />
          </linearGradient>
        </defs>

        {/* y gridlines + labels */}
        {yTicks.map(v => (
          <g key={`y${v}`}>
            <line
              x1={padL} x2={W - padR} y1={yOf(v)} y2={yOf(v)}
              className={v === 0 ? 'lca-curve-zero' : 'lca-curve-grid'}
            />
            <text x={padL - 8} y={yOf(v) + 3} className="lca-curve-axislbl" textAnchor="end">
              {v > 0 ? `+${v}` : v}
            </text>
          </g>
        ))}

        {/* x gridlines + labels */}
        {xTicks.map(t => (
          <g key={`x${t}`}>
            <line x1={xOf(t)} x2={xOf(t)} y1={padT} y2={H - padB} className="lca-curve-grid" />
            <text x={xOf(t)} y={H - padB + 16} className="lca-curve-axislbl" textAnchor="middle">
              {t >= 1000 ? `${t / 1000}k` : t}
            </text>
          </g>
        ))}
        <text x={padL} y={H - 4} className="lca-curve-axisname" textAnchor="start">finish rank (log)</text>

        <path d={areaPath} fill="url(#lcaCurveFill)" />
        <path d={linePath} className="lca-curve-line" fill="none" />

        {/* hover guide + point */}
        {hover && (
          <g className="lca-curve-hovergroup">
            <line x1={hover.x} x2={hover.x} y1={padT} y2={H - padB} className="lca-curve-hoverline" />
            <circle cx={hover.x} cy={hover.y} r="5" className="lca-curve-hoverdot" />
          </g>
        )}

        {/* current finish-rank marker */}
        <line x1={curX} x2={curX} y1={curY} y2={zeroY} className="lca-curve-stem" />
        <circle cx={curX} cy={curY} r="6" className={`lca-curve-cur ${curD >= 0 ? 'up' : 'down'}`} />
      </svg>

      {hover && (
        <div
          className="lca-curve-tip"
          style={{
            left: `${(hover.x / W) * 100}%`,
            transform: `translate(${hover.x > W * 0.7 ? '-105%' : '5%'}, 0)`,
          }}
        >
          <span className="lca-curve-tip-rank">Rank {hover.r.toLocaleString()}</span>
          <span className={`lca-curve-tip-delta ${hover.d >= 0 ? 'up' : 'down'}`}>
            {hover.d >= 0 ? '+' : ''}{Math.round(hover.d)} rating
          </span>
        </div>
      )}
    </div>
  );
}

function niceStep(raw) {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.abs(raw) || 1)));
  const n = raw / pow;
  const nice = n >= 5 ? 5 : n >= 2 ? 2 : 1;
  return Math.max(nice * pow, 1);
}

// Small calm before → after sparkline. A single line rises or dips between two
// dots — direction-coloured, no numeric readout (the chip already carries it).
function RatingSpark({ from, to, up }) {
  const geo = useMemo(() => {
    const W = 240, H = 56, padX = 14, padY = 12;
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    const span = Math.max(hi - lo, 1);
    const yOf = (v) => H - padY - ((v - lo) / span) * (H - 2 * padY);
    return {
      W, H,
      x1: padX, y1: yOf(from),
      x2: W - padX, y2: yOf(to),
    };
  }, [from, to]);

  return (
    <svg viewBox={`0 0 ${geo.W} ${geo.H}`} preserveAspectRatio="xMidYMid meet" className="lca-spark" role="img" aria-label={`Rating from ${from} to ${to}`}>
      <line x1={geo.x1} y1={geo.y1} x2={geo.x2} y2={geo.y2} className={`lca-spark-line ${up ? 'up' : 'down'}`} />
      <circle cx={geo.x1} cy={geo.y1} r="3.5" className="lca-spark-now" />
      <circle cx={geo.x2} cy={geo.y2} r="4.5" className={`lca-spark-after ${up ? 'up' : 'down'}`} />
    </svg>
  );
}

// Slider with a synced numeric input. Drag the track OR type an exact value;
// the number commits on blur/Enter and is clamped to [min, max].
function Slider({ label, value, min, max, step, onChange, unit }) {
  const [draft, setDraft] = useState(null);
  const pct = ((value - min) / (max - min)) * 100;

  const commit = (raw) => {
    const n = Number(raw);
    setDraft(null);
    if (Number.isFinite(n)) onChange(clamp(n, min, max));
  };

  return (
    <label className="lca-slider">
      <span className="lca-slider-label">
        <span className="lca-slider-name">{label}</span>
        <span className="lca-slider-entry">
          <input
            className="lca-slider-num"
            type="number"
            min={min}
            max={max}
            step={step}
            value={draft ?? value}
            onChange={e => setDraft(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { commit(e.currentTarget.value); e.currentTarget.blur(); } }}
            aria-label={`${label} value`}
          />
          {unit ? <span className="lca-slider-unit">{unit}</span> : null}
        </span>
      </span>
      <input
        className="lca-slider-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${pct}%` }}
        onChange={e => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}
