import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, MousePointerClick, Search, Trophy, Calendar,
  Hash, CheckCircle2, Award, Globe, Sparkles, SlidersHorizontal,
  ChevronRight, Minus, Hourglass, Clock, ListChecks, ExternalLink, LineChart,
  ArrowUp, Target, User, Users,
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { supabase } from '../../lib/supabase';
import { useLeetCodeUser, useProfile, useLcContestResult, useLcUserContestRank } from '../../lib/queries';
import { HBarChart, StatCard, Legend } from '../compete/Charts';
import './Contests.css';

// Fixed hue per compared handle — used consistently across the stats table AND
// every chart so a reader tracks one colour from cell to bar to legend.
const CMP_PALETTE = ['var(--accent)', 'var(--hue-violet)', 'var(--hue-sky)', 'var(--hue-pink)', 'var(--hue-mint)'];

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
// The "seed" is that expected rank. We then find the PERFORMANCE rating whose
// expected rank equals the rank you ACTUALLY finished (binary search on R) — this
// is exactly EntrantHub's "Expected Rating" column. The swing is
//     delta = K(k) * SAT * tanh((perf - R_i) / SAT),
// where K(k) is a contest-count factor (~0.22 for veterans) and SAT=400 caps a
// single contest's move to a realistic ±80-ish. new_rating = R_i + delta.
// CALIBRATED against the two CONFIRMED live EntrantHub rows for Weekly Contest 510
// (N=40,113), which fix both the field anchors AND K:
//   abcd-0023: 1732.73 / rank 4438 / k13 → +18.0  (EntrantHub actual +17.77)
//   pushkal:   2220.90 / rank 1585 / k16 →  -8.5  (EntrantHub actual  -8.12)
// All three land within <1 pt (incl. the deep rank-346 = +37). Extremes stay sane
// (rank 1 → ~+37, last → ~-37 for a veteran; more for newcomers via K(k)).
// The OLD model blended in a geometric-mean seed (m=sqrt(seed·rank)) which over-
// swung mid-table finishes ~2× — a rank-4438 result read as +36 instead of +18.
// Do NOT reintroduce the geometric-mean seed or the 0.5..1.5 damping curve.

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

// Contest-count factor K(k): veterans move ~0.22× the performance gap, newcomers
// a little more. Pinned to the two CONFIRMED live results (abcd-0023 k13 → 0.218,
// pushkal k16 → 0.232). Nearly flat across the veteran range; rises gently for
// low k. Do NOT restore the old 0.5..1.5 curve — it doubled every swing.
function dampingFactor(contestsPlayed) {
  const k = Math.min(Math.max(contestsPlayed, 0), 100);
  return Math.min(Math.max(0.189 + 0.5 / (k + 2), 0.189), 0.5);
}

// Saturation scale (rating pts): a single contest swings at most ≈ f·SAT. tanh is
// ~linear for the small gaps the confirmed mid-table cases sit at (so it leaves
// their fit untouched) but compresses the large gaps of deep finishes — which is
// exactly what real LeetCode does. SAT=166 was re-fit after validating against
// 740 REAL finalized deltas (scripts/validate-rating-predictor.mjs, 150 WC510
// participants' full histories): it keeps all confirmed anchors within ~1 pt —
// abcd rank4438 (+17.0 vs +17.77), pushkal rank1585 (-8.2 vs -8.12), pushkal
// rank346 (+35.5 vs +36.52), murali (+29.7 vs +29.75, now exact) — while nudging
// dahiya (+30.8 vs +26.53) down. NOTE: the 740-pt sweep showed this model is
// well-calibrated for >=1700 but under-predicts sub-1700 users by ~15 pts,
// because it uses a SAMPLE field, not the exact per-contest 40k-rating field LC
// grades on. Fixing that needs a dense per-contest rating scrape (the tail was
// the blocker — a uniform-by-rank sample can nail the high end OR the low end,
// not both). The contests-played off-by-one (k vs k+1) was tested and REJECTED:
// the 740-pt fit prefers k+0.
const SAT = 166;

// Field-bias correction (2026-07-19). Validated against 826 REAL finalized deltas
// (scripts/validate-rating-predictor.mjs cache): the raw SAT/tanh model is well-
// calibrated at the TOP but systematically UNDER-predicts below ~1900, because the
// SAMPLE field under-represents the dense sub-1900 tail — measured residual −26 pts
// below 1500, ~0 above 2100. We add that residual back as a smooth per-band offset,
// leaving SAT/K (hence the high-end swings and the confirmed anchors) untouched.
// Overall this drops bias −14.3 → +0.4 and rmse 28.3 → 23.9. The real long-term fix
// is a dense per-contest rating scrape; until then this centers the projection.
const BIAS_CP = [[1450, 26], [1560, 5], [1690, 5], [1760, 12], [1880, 12], [1960, 6], [2080, 6], [2160, 0], [2380, 0], [2440, -3]];
function fieldBiasCorrection(rating) {
  if (!(rating > 0)) return 0;
  if (rating <= BIAS_CP[0][0]) return BIAS_CP[0][1];
  for (let i = 1; i < BIAS_CP.length; i += 1) {
    if (rating <= BIAS_CP[i][0]) {
      const [x0, y0] = BIAS_CP[i - 1];
      const [x1, y1] = BIAS_CP[i];
      return y0 + ((y1 - y0) * (rating - x0)) / (x1 - x0);
    }
  }
  return BIAS_CP[BIAS_CP.length - 1][1];
}

// eslint-disable-next-line react-refresh/only-export-components
export function predictDelta({ rating, actualRank, contestsPlayed, fieldRatings, fieldSize }) {
  const N = fieldSize || fieldRatings.length;
  const seed = expectedRank(rating, fieldRatings, N);
  // DIRECT performance rating: the rating whose expected rank equals the rank you
  // actually finished — this is exactly EntrantHub's "Expected Rating" column, and
  // delta = K·(perf − rating) reproduces both confirmed live results to <1 pt. (No
  // geometric-mean seed blend — that over-swung mid-table finishes 2×, the +36-for-
  // a-+18-result bug.)
  const performanceRank = Math.max(1, Math.min(Math.round(actualRank), N));
  const target = ratingForRank(performanceRank, fieldRatings, N);
  const f = dampingFactor(contestsPlayed);
  const rawDelta = f * SAT * Math.tanh((target - rating) / SAT);
  const delta = rawDelta + fieldBiasCorrection(rating);
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

export const TOTAL_PARTICIPANTS = 40000;
// A representative slice of a real LeetCode weekly field: 44 EQUAL-WEIGHT quantile
// points of a skew-normal (centre ~1500, wide) FIT so that ratingForRank()
// reproduces the two CONFIRMED live "Expected Rating" anchors — rank 4438 → 1812
// and rank 1585 → 2184 (N=40,113). expectedRank() averages the win-probability
// over these points and scales to fieldSize, so this array IS the field's shape.
// EXPORTED as the single source of truth — every caller of predictDelta reuses it.
// Do NOT narrow the spread (sigma): a tight field can't hit both anchors and
// craters mid-table swings.
// eslint-disable-next-line react-refresh/only-export-components
export const SAMPLE_FIELD = [
  125, 174, 222, 267, 311, 354, 395, 436, 475, 514, 552,
  589, 626, 662, 697, 733, 768, 803, 838, 873, 908, 943,
  978, 1013, 1049, 1085, 1122, 1159, 1197, 1236, 1276, 1318, 1361,
  1406, 1453, 1504, 1558, 1617, 1681, 1755, 1841, 1948, 2095, 2369,
];

// ── Pending (unrated) contest detection ──────────────────────────────────────
// LeetCode appends a round to userContestRankingHistory only AFTER it rates it,
// which can lag the contest by a day or more. So the API's "latest" round may be
// one or two behind what the user actually just played. We detect that gap from
// the public cadence (Weekly every Sunday 02:30 UTC, Biweekly alternate
// Saturdays 14:30 UTC) and surface the most recent FINISHED round that started
// after the last rated one as "awaiting LeetCode's rating". As soon as LeetCode
// rates it, it enters the history and this returns null again (self-correcting).
const PENDING_WEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 8, 29, 2, 30), number: 417 }; // Sun 2024-09-29
const PENDING_BIWEEKLY_ANCHOR = { utcMs: Date.UTC(2024, 9, 5, 14, 30), number: 141 }; // Sat 2024-10-05
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

// Contest metadata from the URL slug (e.g. "weekly-contest-510"). The anchors are
// the same verified rounds LcContestList projects from, so the derived date/number
// line up with the contest list. Weekly = Sun 02:30 UTC, Biweekly = Sat 14:30 UTC.
const LCA_WEEKLY_ANCHOR = { ms: Date.UTC(2024, 8, 29, 2, 30), n: 417 };
const LCA_BIWEEKLY_ANCHOR = { ms: Date.UTC(2024, 9, 5, 14, 30), n: 141 };
function parseContestMeta(slug) {
  if (!slug) return null;
  const m = /^(weekly|biweekly)-contest-(\d+)$/.exec(slug);
  if (!m) {
    return { title: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), kind: null };
  }
  const kind = m[1];
  const number = Number(m[2]);
  const a = kind === 'weekly' ? LCA_WEEKLY_ANCHOR : LCA_BIWEEKLY_ANCHOR;
  const period = (kind === 'weekly' ? 7 : 14) * 24 * 60 * 60 * 1000;
  const startMs = a.ms + (number - a.n) * period;
  const title = `${kind.charAt(0).toUpperCase()}${kind.slice(1)} Contest ${number}`;
  return { title, kind, number, startMs, durationMin: 90, problems: 4 };
}
function fmtContestStart(ms) {
  return new Date(ms).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// "Weekly Contest 509" → "weekly-contest-509" for the per-contest analytics route.
const contestSlugOf = (title) => (title || '').trim().toLowerCase().replace(/\s+/g, '-');

// One results-table row = one INDEPENDENT query (keyed by user), so cached handles
// paint instantly, a slow scan never blocks the others, and re-adding a handle
// never re-fetches it. Blinks while its own scan is in flight.
// Finish time comes through as an elapsed-seconds value on rows that carry it
// (the live scan surfaces it for pending rounds); rated history rows don't. Show
// H:MM:SS past an hour, MM:SS below — and nothing when the field is absent.
function fmtFinish(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function LcResultRow({ slug, username, onRemove, onResolve }) {
  const { data, isFetching } = useLcContestResult(slug, username);
  const [timedOut, setTimedOut] = useState(false);
  const r = data?.row || { username };
  const rated = r.rated;
  const proj = (!rated && r.pending && r.rank)
    ? predictDelta({
        rating: r.oldRating,
        actualRank: r.rank,
        contestsPlayed: r.contestsPlayed ?? 10,
        fieldRatings: SAMPLE_FIELD,
        fieldSize: r.fieldSize || TOTAL_PARTICIPANTS,
      })
    : null;
  const chg = rated ? r.change : (proj ? proj.delta : null);
  const up = (chg ?? 0) >= 0;
  const hasRank = rated || (r.pending && r.rank);
  const loading = isFetching && !hasRank && !timedOut;
  const notFound = !hasRank && !loading && (r.found === false || timedOut);
  const newRating = rated ? Math.round(r.newRating) : (proj ? Math.round(r.oldRating + proj.delta) : null);
  const score = Number.isFinite(Number(r.score)) && r.score != null ? Number(r.score) : null;
  const finish = fmtFinish(r.finishTime ?? r.finishTimeSeconds);
  const oldRating = Number.isFinite(Number(r.oldRating)) && r.oldRating ? Math.round(r.oldRating) : null;

  // A live ranking scan can hang — a handle that doesn't exist, or a slow Jina
  // scan that never resolves. Cap the wait: after 25s with no rank, flip to
  // "not found" so the row resolves and drops out of the comparison cleanly
  // instead of spinning on "scanning…" forever. Real data still wins if it lands.
  useEffect(() => {
    if (hasRank) { setTimedOut(false); return undefined; }
    if (!isFetching) return undefined;
    const t = setTimeout(() => setTimedOut(true), 25000);
    return () => clearTimeout(t);
  }, [isFetching, hasRank]);

  // Lift each resolved row up so the head-to-head strip can read every handle's
  // real numbers. Report null on a confirmed miss so a removed/absent handle
  // never lingers in the comparison.
  useEffect(() => {
    if (!onResolve) return;
    if (hasRank) {
      onResolve(username, {
        username,
        rank: Number(r.rank) || null,
        oldRating,
        newRating,
        change: chg,
        solved: r.problemsSolved != null ? Number(r.problemsSolved) : null,
        total: r.totalProblems != null ? Number(r.totalProblems) : null,
        score,
        rated: !!rated,
      });
    } else if (notFound) {
      onResolve(username, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, hasRank, notFound, r.rank, oldRating, newRating, chg, r.problemsSolved, r.totalProblems, score, rated]);

  return (
    <div className={`lca-rtable-r${loading ? ' lca-blink' : ''}`} role="row">
      <span role="cell" className="lca-rc-rank">{hasRank ? `#${r.rank}` : (loading ? <span className="lca-rc-dots" aria-hidden /> : '—')}</span>
      <a role="cell" className="lca-rc-user" href={`https://leetcode.com/u/${encodeURIComponent(username)}/`} target="_blank" rel="noreferrer noopener">{username}</a>
      <span role="cell" className="lca-rc-num">{hasRank && r.problemsSolved != null ? `${r.problemsSolved}/${r.totalProblems}` : '—'}</span>
      <span role="cell" className="lca-rc-num">{finish || (score != null ? score : '—')}</span>
      <span role="cell" className="lca-rc-num lca-rc-dim">{oldRating ?? '—'}</span>
      <span role="cell" className={`lca-rc-num lca-rc-chg ${chg != null ? (up ? 'is-up' : 'is-dn') : ''}`}>
        {chg != null ? (
          <>
            {up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
            <span className="lca-rc-chg-val">{`${up ? '+' : ''}${chg.toFixed(proj ? 0 : 2)}${proj ? '*' : ''}`}</span>
          </>
        ) : loading ? 'scanning…' : notFound ? 'not found' : '—'}
      </span>
      <span role="cell" className="lca-rc-num lca-rc-new">{newRating ?? '—'}</span>
      <button role="cell" className="lca-rc-x" onClick={() => onRemove(username)} aria-label={`Remove ${username}`}><Minus size={13} /></button>
    </div>
  );
}

// Single mode: one handle → its full result for THIS contest. Same resolve path
// as a table row (live rank + projected/actual swing), rendered as a rich card.
function SingleResultCard({ slug, username, contest }) {
  const { data, isFetching } = useLcContestResult(slug, username);
  const { data: lcUser } = useLeetCodeUser(username);
  const r = data?.row || { username };
  const rated = r.rated;
  const proj = (!rated && r.pending && r.rank)
    ? predictDelta({
        rating: r.oldRating,
        actualRank: r.rank,
        contestsPlayed: r.contestsPlayed ?? 10,
        fieldRatings: SAMPLE_FIELD,
        fieldSize: r.fieldSize || TOTAL_PARTICIPANTS,
      })
    : null;
  const chg = rated ? r.change : (proj ? proj.delta : null);
  const up = (chg ?? 0) >= 0;
  const hasRank = rated || (r.pending && r.rank);
  const loading = isFetching && !hasRank;
  const notFound = !loading && !hasRank && r.found === false;
  const oldRating = Number.isFinite(Number(r.oldRating)) && r.oldRating ? Math.round(r.oldRating) : null;
  const newRating = rated ? Math.round(r.newRating) : (proj ? Math.round(r.oldRating + proj.delta) : null);
  // Per-contest score: prefer the row's score; else derive from the contest's problem
  // points for the problems this user solved (Q1..Q4 are worth 3/4/5/6 on LeetCode).
  const PROBLEM_POINTS = [3, 4, 5, 6];
  const derivedScore = (r.problemsSolved != null && r.totalProblems)
    ? PROBLEM_POINTS.slice(0, Math.min(Number(r.problemsSolved), 4)).reduce((s, p) => s + p, 0)
    : null;
  const score = Number.isFinite(Number(r.score)) && r.score != null ? Number(r.score) : derivedScore;
  const fieldSize = Number(r.fieldSize) > 0 ? Number(r.fieldSize) : null;
  // "Contests played" is a profile-level stat — the row rarely carries it, so fall back to
  // the user's live attendedContestsCount (the same number the profile card shows).
  const played = Number.isFinite(Number(r.contestsPlayed)) ? Number(r.contestsPlayed)
    : (Number.isFinite(Number(lcUser?.attendedContestsCount)) ? Number(lcUser.attendedContestsCount) : null);
  const userUrl = `https://leetcode.com/u/${encodeURIComponent(username)}/`;

  if (loading) return <div className="lca-skel" aria-hidden />;
  if (notFound || !hasRank) {
    return (
      <p className="lca-empty">
        No result for <strong>{username}</strong> in {contest.title}. Check the handle, or try the Compare tab.
      </p>
    );
  }

  return (
    <article className="lca-single">
      <header className="lca-single-head">
        <a className="lca-single-user" href={userUrl} target="_blank" rel="noreferrer noopener">@{username}</a>
        <span className={`lca-single-tag ${rated ? 'is-rated' : 'is-pending'}`}>{rated ? 'Rated' : 'Projected'}</span>
      </header>
      <div className="lca-single-facts">
        <div className="lca-fact">
          <span className="lca-fact-ico"><Hash size={14} aria-hidden /></span>
          <span className="lca-fact-val">{r.rank != null ? `#${Number(r.rank).toLocaleString()}` : '—'}</span>
          <span className="lca-fact-lbl">{fieldSize ? `of ${fieldSize.toLocaleString()}` : 'Rank'}</span>
        </div>
        <div className="lca-fact">
          <span className="lca-fact-ico"><CheckCircle2 size={14} aria-hidden /></span>
          <span className="lca-fact-val">
            {r.problemsSolved != null ? r.problemsSolved : '—'}
            <span className="lca-fact-of">/{r.totalProblems ?? 4}</span>
          </span>
          <span className="lca-fact-lbl">Solved</span>
        </div>
        <div className="lca-fact">
          <span className="lca-fact-ico"><Target size={14} aria-hidden /></span>
          <span className="lca-fact-val">{score != null ? score.toLocaleString() : '—'}</span>
          <span className="lca-fact-lbl">Score</span>
        </div>
        <div className="lca-fact">
          <span className="lca-fact-ico"><ListChecks size={14} aria-hidden /></span>
          <span className="lca-fact-val">{played != null ? played : '—'}</span>
          <span className="lca-fact-lbl">Contests played</span>
        </div>
      </div>
      <div className="lca-single-move">
        <span className="lca-single-old">{oldRating ?? '—'}</span>
        <span className="lca-single-arrow" aria-hidden>→</span>
        <span className="lca-single-new" style={{ color: chgColor(chg ?? 0) }}>
          {rated ? (newRating ?? '—') : `~${newRating ?? '—'}`}
        </span>
        {chg != null && (
          <span className={`lca-single-chip ${up ? 'up' : 'down'}`}>
            {up ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}
            {fmtChange(chg)}{rated ? '' : ' projected'}
          </span>
        )}
      </div>
    </article>
  );
}

// Compare mode: 2–5 resolved handles → a stats board centered on THIS contest.
// A metric×user table (best per row lit), width-filling bar charts, a diverging
// projected-change chip strip, and one shared hue legend. Each handle keeps a
// fixed hue from CMP_PALETTE across the table AND the charts.
function CompareBoard({ rows }) {
  const users = rows.map((r, i) => ({ ...r, hue: CMP_PALETTE[i % CMP_PALETTE.length] }));

  const metrics = [
    { key: 'rank', label: 'Rank', icon: Hash, best: 'min',
      get: (u) => (u.rank != null ? Number(u.rank) : null),
      fmt: (v) => (v != null ? `#${v.toLocaleString()}` : '—') },
    { key: 'solved', label: 'Solved', icon: CheckCircle2, best: 'max',
      get: (u) => (u.solved != null ? Number(u.solved) : null),
      fmt: (v, u) => (v != null ? `${v}/${u.total ?? 4}` : '—') },
    { key: 'score', label: 'Score', icon: Target, best: 'max',
      get: (u) => (u.score != null ? Number(u.score) : null),
      fmt: (v) => (v != null ? v.toLocaleString() : '—') },
    { key: 'old', label: 'Old rating', icon: Award, best: 'max',
      get: (u) => (u.oldRating != null ? Number(u.oldRating) : null),
      fmt: (v) => (v != null ? Math.round(v).toLocaleString() : '—') },
    { key: 'change', label: 'Projected change', icon: TrendingUp, best: 'max', diverging: true,
      get: (u) => (u.change != null ? Number(u.change) : null),
      fmt: (v) => (v != null ? `${v >= 0 ? '+' : ''}${Math.round(v)}` : '—') },
    { key: 'new', label: 'Projected new rating', icon: ArrowUp, best: 'max',
      get: (u) => (u.newRating != null ? Number(u.newRating) : (u.oldRating != null ? Number(u.oldRating) : null)),
      fmt: (v) => (v != null ? Math.round(v).toLocaleString() : '—') },
  ];

  const bestIndex = (m) => {
    let bi = -1;
    let bv = null;
    users.forEach((u, i) => {
      const v = m.get(u);
      if (v == null || !Number.isFinite(v)) return;
      if (bv == null || (m.best === 'min' ? v < bv : v > bv)) { bv = v; bi = i; }
    });
    return users.filter((u) => Number.isFinite(m.get(u))).length > 1 ? bi : -1;
  };

  const newRatingRows = users.map((u) => ({ key: u.username, label: u.username, a: Math.round(Number(u.newRating ?? u.oldRating) || 0), hueA: u.hue }));
  const solvedRows = users.map((u) => ({ key: u.username, label: u.username, a: Number(u.solved) || 0, hueA: u.hue }));
  const rankRows = users.map((u) => ({ key: u.username, label: u.username, a: Number(u.rank) || 0, hueA: u.hue }));
  const legendItems = users.map((u) => ({ label: `@${u.username}`, color: u.hue }));

  return (
    <div className="lca-cmp">
      {/* Stats table — desktop matrix (metrics × users) */}
      <div className="lca-cmp-table" style={{ '--cmp-cols': users.length }} role="table" aria-label="Contest stats by user">
        <div className="lca-cmp-row lca-cmp-headrow" role="row">
          <span className="lca-cmp-rowlbl" role="columnheader">Metric</span>
          {users.map((u) => (
            <span key={u.username} className="lca-cmp-user" role="columnheader">
              <span className="lca-cmp-dot" style={{ background: u.hue }} />
              <span className="lca-cmp-uname">@{u.username}</span>
            </span>
          ))}
        </div>
        {metrics.map((m) => {
          const bi = bestIndex(m);
          return (
            <div key={m.key} className="lca-cmp-row" role="row">
              <span className="lca-cmp-rowlbl" role="rowheader"><m.icon size={13} aria-hidden /> {m.label}</span>
              {users.map((u, i) => {
                const v = m.get(u);
                const cls = m.diverging && v != null ? (v >= 0 ? ' is-pos' : ' is-neg') : '';
                return (
                  <span key={u.username} className={`lca-cmp-cell${i === bi ? ' is-best' : ''}${cls}`} role="cell">
                    {m.fmt(v, u)}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Stats — mobile per-user cards (transpose; never a horizontal-scroll table) */}
      <div className="lca-cmp-cards">
        {users.map((u) => (
          <div key={u.username} className="lca-cmp-card" style={{ borderColor: u.hue }}>
            <div className="lca-cmp-card-head">
              <span className="lca-cmp-dot" style={{ background: u.hue }} />
              <span className="lca-cmp-uname">@{u.username}</span>
            </div>
            <dl className="lca-cmp-card-body">
              {metrics.map((m) => {
                const v = m.get(u);
                const cls = m.diverging && v != null ? (v >= 0 ? ' is-pos' : ' is-neg') : '';
                return (
                  <div key={m.key} className="lca-cmp-card-row">
                    <dt><m.icon size={12} aria-hidden /> {m.label}</dt>
                    <dd className={cls.trim()}>{m.fmt(v, u)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      {/* Diverging metric — chips, since a bar can't render a negative swing */}
      <div className="lca-cmp-chg">
        <span className="lca-cmp-block-title"><TrendingUp size={14} aria-hidden /> Projected rating change</span>
        <div className="lca-cmp-chg-grid">
          {users.map((u) => {
            const c = u.change != null ? Number(u.change) : null;
            const pos = (c ?? 0) >= 0;
            return (
              <StatCard
                key={u.username}
                icon={pos ? TrendingUp : TrendingDown}
                label={`@${u.username}`}
                value={c != null ? `${pos ? '+' : ''}${Math.round(c)}` : '—'}
                hue={c == null ? 'var(--text-dim)' : (pos ? 'var(--easy)' : 'var(--hard)')}
                big
              />
            );
          })}
        </div>
      </div>

      {/* Width-filling bar charts — non-negative metrics only */}
      <div className="lca-cmp-charts">
        <div className="lca-cmp-chart">
          <span className="lca-cmp-block-title"><Award size={14} aria-hidden /> Projected new rating</span>
          <HBarChart rows={newRatingRows} />
        </div>
        <div className="lca-cmp-chart">
          <span className="lca-cmp-block-title"><CheckCircle2 size={14} aria-hidden /> Problems solved</span>
          <HBarChart rows={solvedRows} scaleMax={Math.max(4, ...solvedRows.map((r) => r.a))} />
        </div>
        <div className="lca-cmp-chart">
          <span className="lca-cmp-block-title"><Hash size={14} aria-hidden /> Finishing rank <em className="lca-cmp-note">lower is better</em></span>
          <HBarChart rows={rankRows} />
        </div>
      </div>

      <Legend items={legendItems} />
    </div>
  );
}

export default function LeetCodeAnalytics({ slugOverride, embedded = false } = {}) {
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

  // Auto-fetch the user's rank in the pending (not-yet-rated) round — LeetCode
  // publishes the ranking immediately, and the edge function reads it through a
  // Cloudflare-clearing proxy. Passing the rating centers the page scan so it
  // resolves in seconds. Populates the card AND seeds the predictor rank below.
  const pendingSlug = pending ? pending.title.toLowerCase().replace(/\s+/g, '-') : null;
  const { data: pendingRankData } = useLcUserContestRank(pendingSlug, handle, pending?.base, !!pending);
  const fetchedPendingRank = pendingRankData?.ok && pendingRankData?.found
    ? Math.max(1, Number(pendingRankData.rank) || 0)
    : null;
  const pendingSolved = pendingRankData?.ok && pendingRankData?.found
    && Number.isFinite(Number(pendingRankData.problemsSolved))
    ? { solved: Number(pendingRankData.problemsSolved), total: Number(pendingRankData.totalProblems) || 4 }
    : null;

  const submit = (e) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) return;
    setHandle(v);
    // Mirror any looked-up handle into the Contest results table so BOTH the
    // logged-in user (auto-seeded) and the searched handle show as rows.
    setResultUsers((prev) =>
      prev.some((u) => u.toLowerCase() === v.toLowerCase()) ? prev : [...prev, v].slice(0, 5),
    );
    setSingleHandle(v);
    setSingleDraft(v);
  };

  const noContests = handle && !isLoading && !isError && user && !latest;

  // ── Predict a just-finished (not-yet-rated) round from a manual rank ─────────
  // The hero flow: type the finishing rank you just got, confirm the rating you
  // carried in (auto-filled from a lookup, or typed by hand), and read the
  // projected new rating + delta. LeetCode rates purely on rank, so rank is the
  // load-bearing input; the advanced fields (contests played, field size) refine
  // the swing, and problems-solved is context only.
  const [rank, setRank] = useState(800);
  const [ratingDraft, setRatingDraft] = useState('');
  const [playedDraft, setPlayedDraft] = useState('');
  const [solvedDraft, setSolvedDraft] = useState('');
  const [totalDraft, setTotalDraft] = useState(String(TOTAL_PARTICIPANTS));
  const [advOpen, setAdvOpen] = useState(false);
  const [curveOpen, setCurveOpen] = useState(false);
  const [prefillSig, setPrefillSig] = useState('');

  // Auto-fill the moment a lookup resolves: the rating carried into the next
  // round + how many contests are already behind you, and seed the rank from the
  // round awaiting rating / last finish when LeetCode exposes one.
  const liveSig = user ? `${user.username}|${Math.round(realRating)}|${user.attendedContestsCount ?? ''}` : '';
  if (liveSig && liveSig !== prefillSig) {
    setPrefillSig(liveSig);
    setRatingDraft(String(Math.round(realRating)));
    setPlayedDraft(String(Math.max(0, Number(user?.attendedContestsCount) || 0)));
    const seedRank = Number(latest?.current?.ranking);
    if (Number.isFinite(seedRank) && seedRank > 0) {
      setRank(clamp(Math.round(seedRank), 1, TOTAL_PARTICIPANTS));
    }
  }

  // When the pending-round rank resolves, snap the predictor to it (real rank +
  // real field size) so the projection reflects the round you actually just played.
  const [rankSig, setRankSig] = useState('');
  const rankKey = fetchedPendingRank ? `${pendingSlug}:${fetchedPendingRank}` : '';
  if (rankKey && rankKey !== rankSig) {
    setRankSig(rankKey);
    setRank(clamp(fetchedPendingRank, 1, TOTAL_PARTICIPANTS));
    const fieldN = Number(pendingRankData?.totalUsers);
    if (Number.isFinite(fieldN) && fieldN > 0) setTotalDraft(String(fieldN));
  }

  const effTotal = clamp(Math.round(Number(totalDraft)) || TOTAL_PARTICIPANTS, 100, 5_000_000);
  const effRating = clamp(Math.round(Number(ratingDraft)) || Math.round(realRating), 500, 4000);
  // Empty "contests played" ⇒ assume a seasoned account (tens-of-points swings)
  // rather than a debut, so a bare rank+rating entry doesn't over-swing.
  const effPlayed = playedDraft.trim() === '' ? 10 : Math.max(0, Math.round(Number(playedDraft)) || 0);
  const effRank = clamp(Math.round(rank) || 1, 1, effTotal);

  const predict = useMemo(
    () => predictDelta({
      rating: effRating,
      actualRank: effRank,
      contestsPlayed: effPlayed,
      fieldRatings: SAMPLE_FIELD,
      fieldSize: effTotal,
    }),
    [effRating, effRank, effPlayed, effTotal],
  );
  const pUp = predict.delta >= 0;
  const percentile = clamp((1 - effRank / effTotal) * 100, 0, 100);

  // When reached from a contest's "Analytics" link the slug names the round
  // (e.g. "weekly-contest-507"); title-case it for the header so this page reads
  // as that contest's per-question breakdown, distinct from the predictor.
  const { slug: routeSlug } = useParams();
  // Embedded on the hub home there's no route slug — default to the most recent
  // weekly (every 7 days from the anchor), which is the contest the predictor is
  // meant to open on.
  const latestWeekly = LCA_WEEKLY_ANCHOR.n + Math.floor((nowMs - LCA_WEEKLY_ANCHOR.ms) / (7 * 24 * 60 * 60 * 1000));
  const contestSlug = slugOverride || routeSlug || `weekly-contest-${latestWeekly}`;
  const contest = parseContestMeta(contestSlug);

  // ── Real per-user result rows for THIS contest (EntrantHub-style) ────────────
  // Powered by the lc-contest edge function (LeetCode GraphQL), so every row is
  // the user's ACTUAL rank / old rating / change / new rating — no prediction,
  // no Cloudflare-blocked leaderboard scrape. Add any public handle to compare.
  const [mode, setMode] = useState('single');
  const [resultUsers, setResultUsers] = useState([]);
  const [resultDraft, setResultDraft] = useState('');
  const [singleDraft, setSingleDraft] = useState('');
  const [singleHandle, setSingleHandle] = useState('');
  const [resultsSeeded, setResultsSeeded] = useState(false);
  if (!resultsSeeded && (savedHandle || handle)) {
    setResultsSeeded(true);
    const seed = (savedHandle || handle).trim();
    setResultUsers([seed]);
    setSingleHandle(seed);
    setSingleDraft(seed);
  }
  const submitSingle = (e) => {
    e.preventDefault();
    const v = singleDraft.trim();
    if (v) setSingleHandle(v);
  };
  const addResultUser = (e) => {
    e.preventDefault();
    const v = resultDraft.trim();
    if (v && resultUsers.length < 5 && !resultUsers.some((u) => u.toLowerCase() === v.toLowerCase())) {
      setResultUsers((prev) => [...prev, v].slice(0, 5));
    }
    setResultDraft('');
  };

  // Resolved per-handle numbers lifted out of each row, keyed by username, so the
  // head-to-head strip can compare handles without re-fetching them.
  const [resultData, setResultData] = useState({});
  const handleResolve = useCallback((u, row) => {
    setResultData((prev) => {
      if (row === null) {
        if (!(u in prev)) return prev;
        const next = { ...prev };
        delete next[u];
        return next;
      }
      const cur = prev[u];
      if (cur && cur.rank === row.rank && cur.newRating === row.newRating
        && cur.oldRating === row.oldRating && cur.change === row.change
        && cur.solved === row.solved && cur.score === row.score && cur.total === row.total) {
        return prev;
      }
      return { ...prev, [u]: row };
    });
  }, []);
  const removeResultUser = (u) => {
    setResultUsers((prev) => prev.filter((x) => x !== u));
    setResultData((prev) => {
      if (!(u in prev)) return prev;
      const next = { ...prev };
      delete next[u];
      return next;
    });
  };

  // Every resolved handle, best-rank first → the rows the compare board renders.
  const compareRows = useMemo(() => {
    const rows = resultUsers.map((u) => resultData[u]).filter((r) => r && r.rank != null);
    rows.sort((x, y) => x.rank - y.rank);
    return rows;
  }, [resultUsers, resultData]);

  return (
    <div className={`lca-wrap${embedded ? ' lca-embedded' : ''}`}>
      {!embedded && contest && (
        <div className="lca-chero">
          <div className="lca-chero-main">
            <div className="lca-chero-badges">
              {contest.kind && <span className={`lca-cbadge is-${contest.kind}`}>{contest.kind}</span>}
              {contest.number != null && <span className="lca-cbadge is-num">#{contest.number}</span>}
              <span className="lca-cbadge is-ended">Ended</span>
            </div>
            <h1 className="lca-chero-title">{contest.title}</h1>
            {contest.startMs != null && (
              <div className="lca-chero-tiles">
                <div className="lca-ctile"><span className="lca-ctile-lbl"><Calendar size={13} /> Start</span><b>{fmtContestStart(contest.startMs)}</b></div>
                <div className="lca-ctile"><span className="lca-ctile-lbl"><Clock size={13} /> Duration</span><b>1h 30m</b></div>
                <div className="lca-ctile"><span className="lca-ctile-lbl"><ListChecks size={13} /> Problems</span><b>{contest.problems}</b></div>
              </div>
            )}
          </div>
          {contest.kind && (
            <a className="lca-chero-view" href={`https://leetcode.com/contest/${contestSlug}/`} target="_blank" rel="noreferrer noopener">
              View on LeetCode <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      {contest && (
        <section className="lca-section lca-results">
          <div className="lca-results-head">
            <h2 className="lca-results-title"><Trophy size={16} aria-hidden /> Contest results</h2>
            <span className="lca-results-sub">Real rank &amp; rating change for {contest.title}, pulled live from LeetCode.</span>
          </div>

          <div className="lca-modes" role="tablist" aria-label="Results mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'single'}
              className={`lca-mode${mode === 'single' ? ' active' : ''}`}
              onClick={() => setMode('single')}
            >
              <User size={14} aria-hidden /> Single
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'compare'}
              className={`lca-mode${mode === 'compare' ? ' active' : ''}`}
              onClick={() => setMode('compare')}
            >
              <Users size={14} aria-hidden /> Compare
            </button>
          </div>

          {mode === 'single' ? (
            <>
              <form className="lca-results-add" onSubmit={submitSingle}>
                <div className="lca-lookup-input">
                  <Search size={15} aria-hidden />
                  <input
                    type="text"
                    value={singleDraft}
                    onChange={(e) => setSingleDraft(e.target.value)}
                    placeholder="LeetCode username"
                    aria-label="LeetCode username for this contest"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="lca-lookup-btn" disabled={!singleDraft.trim()}>Show result</button>
              </form>
              {singleHandle ? (
                <SingleResultCard slug={contestSlug} username={singleHandle} contest={contest} />
              ) : (
                <p className="lca-empty">Enter a username to see their result for {contest.title}.</p>
              )}
            </>
          ) : (
            <>
              <form className="lca-results-add" onSubmit={addResultUser}>
                <div className="lca-lookup-input">
                  <Search size={15} aria-hidden />
                  <input
                    type="text"
                    value={resultDraft}
                    onChange={(e) => setResultDraft(e.target.value)}
                    placeholder="Add a LeetCode username (2–5 to compare)"
                    aria-label="Add a LeetCode username to the comparison"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="lca-lookup-btn" disabled={!resultDraft.trim() || resultUsers.length >= 5}>Add</button>
              </form>

              {resultUsers.length === 0 ? (
                <p className="lca-empty">Add usernames above to compare results for {contest.title}.</p>
              ) : (
                <div className="lca-rtable" role="table" aria-label={`${contest.title} results`}>
                  <div className="lca-rtable-h" role="row">
                    <span role="columnheader">Rank</span>
                    <span role="columnheader">User</span>
                    <span role="columnheader" className="lca-rc-num">Solved</span>
                    <span role="columnheader" className="lca-rc-num">Score</span>
                    <span role="columnheader" className="lca-rc-num">Old</span>
                    <span role="columnheader" className="lca-rc-num">Change</span>
                    <span role="columnheader" className="lca-rc-num">New</span>
                    <span role="columnheader" aria-label="Remove" />
                  </div>
                  {resultUsers.map((u) => (
                    <LcResultRow key={u} slug={contestSlug} username={u} onRemove={removeResultUser} onResolve={handleResolve} />
                  ))}
                </div>
              )}

              {compareRows.length >= 2 && <CompareBoard rows={compareRows} />}
              {resultUsers.length === 1 && compareRows.length < 2 && (
                <p className="lca-empty lca-cmp-hint">Add one more handle to unlock the comparison board.</p>
              )}

              {resultUsers.length > 0 && (
                <p className="lca-results-note">
                  <Hourglass size={12} aria-hidden /> Each handle loads on its own — <b>*</b> change is our projection until LeetCode finalizes the contest.
                </p>
              )}
            </>
          )}
        </section>
      )}

      <p className="ctx-sub lca-intro">
        Type the rank you just finished and read the projected rating change — before LeetCode publishes it.
      </p>

      {/* Username lookup — auto-fills your rating into the predictor below */}
      <section className="lca-section lca-lookup-sec">
        <form className="lca-lookup" onSubmit={submit}>
          <div className="lca-lookup-input">
            <Search size={15} aria-hidden />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="LeetCode username (optional — auto-fills your rating)"
              aria-label="LeetCode username"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="lca-lookup-btn" disabled={!draft.trim()}>
            Look up
          </button>
        </form>

        {handle && isLoading && <div className="lca-skel" aria-hidden />}

        {handle && isError && (
          <p className="lca-empty">
            Couldn&apos;t find <strong>{handle}</strong>
            {error?.message ? ` — ${error.message}` : '. Check the username and try again.'}
          </p>
        )}

        {handle && !isLoading && !isError && user && (
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
        )}
      </section>

      {/* HERO: predict a just-finished (not-yet-rated) round from your rank */}
      <section className="lca-section">
        <div className="lca-predict-hero">
          <header className="lca-hero-head">
            <span className="lca-hero-ico"><Sparkles size={18} aria-hidden /></span>
            <div className="lca-hero-heading">
              <h2 className="lca-hero-title">Predict your latest contest</h2>
              <p className="lca-hero-sub">
                {user
                  ? `Rating auto-filled from @${user.username || handle} — set the rank you just finished.`
                  : 'Enter your finishing rank and the rating you carried in. Look up a username above to auto-fill the rating.'}
              </p>
            </div>
          </header>

          <div className="lca-predictor">
            <div className="lca-inputs">
              <Slider
                label="Finishing rank"
                value={effRank}
                min={1}
                max={effTotal}
                step={1}
                onChange={setRank}
                unit={`of ${effTotal.toLocaleString()}`}
              />

              <label className="lca-field">
                <span className="lca-field-name">Current rating</span>
                <span className="lca-field-entry">
                  <input
                    className="lca-field-num"
                    type="number"
                    min={500}
                    max={4000}
                    step={1}
                    value={ratingDraft}
                    onChange={(e) => setRatingDraft(e.target.value)}
                    placeholder={String(Math.round(realRating))}
                    aria-label="Current rating"
                  />
                  {user && <span className="lca-field-hint">from @{user.username || handle}</span>}
                </span>
              </label>

              <div className="lca-pctl">
                <div className="lca-pctl-head">
                  <span>Top {(100 - percentile).toFixed(1)}%</span>
                  <span>{effRank.toLocaleString()} / {effTotal.toLocaleString()}</span>
                </div>
                <div className="lca-pctl-track">
                  <div className="lca-pctl-fill" style={{ width: `${percentile}%` }} />
                  <div className="lca-pctl-marker" style={{ left: `${percentile}%` }} />
                </div>
              </div>

              <button
                type="button"
                className="lca-adv-toggle"
                onClick={() => setAdvOpen((o) => !o)}
                aria-expanded={advOpen}
              >
                <SlidersHorizontal size={13} aria-hidden />
                {advOpen ? 'Hide advanced' : 'Advanced inputs'}
                <ChevronRight size={14} className={`lca-adv-caret ${advOpen ? 'open' : ''}`} aria-hidden />
              </button>

              {advOpen && (
                <div className="lca-adv">
                  <label className="lca-field">
                    <span className="lca-field-name">Contests played</span>
                    <span className="lca-field-entry">
                      <input
                        className="lca-field-num" type="number" min={0} max={500} step={1}
                        value={playedDraft} onChange={(e) => setPlayedDraft(e.target.value)}
                        placeholder="10" aria-label="Contests played"
                      />
                      <span className="lca-field-hint">damps the swing</span>
                    </span>
                  </label>
                  <label className="lca-field">
                    <span className="lca-field-name">Total participants</span>
                    <span className="lca-field-entry">
                      <input
                        className="lca-field-num" type="number" min={100} step={100}
                        value={totalDraft} onChange={(e) => setTotalDraft(e.target.value)}
                        placeholder={String(TOTAL_PARTICIPANTS)} aria-label="Total participants"
                      />
                    </span>
                  </label>
                  <label className="lca-field">
                    <span className="lca-field-name">Problems solved</span>
                    <span className="lca-field-entry">
                      <input
                        className="lca-field-num" type="number" min={0} max={4} step={1}
                        value={solvedDraft} onChange={(e) => setSolvedDraft(e.target.value)}
                        placeholder="—" aria-label="Problems solved"
                      />
                      <span className="lca-field-hint">context only — rank drives the rating</span>
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="lca-result">
              <span className="lca-result-cap">Projected new rating</span>
              <div className="lca-result-rating">{Math.round(predict.newRating).toLocaleString()}</div>
              <div className={`lca-result-chip ${pUp ? 'up' : 'down'}`}>
                {pUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {fmtChange(predict.delta)} projected
              </div>
              <RatingSpark from={effRating} to={Math.round(predict.newRating)} up={pUp} />
              <div className="lca-result-foot">
                <span>{effRating.toLocaleString()}</span>
                <span className="lca-result-foot-arrow">→</span>
                <span>{Math.round(predict.newRating).toLocaleString()}</span>
                <span className="lca-result-foot-dim">· top {(100 - percentile).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Rank → delta curve — collapsed by default; expand to explore/click it */}
          <button
            type="button"
            className={`lca-curve-toggle${curveOpen ? ' is-open' : ''}`}
            onClick={() => setCurveOpen((o) => !o)}
            aria-expanded={curveOpen}
          >
            <ChevronRight size={15} className="lca-curve-chevron" aria-hidden />
            <span className="lca-section-title">Rank to rating change</span>
            {curveOpen && (
              <span className="lca-curve-hint">
                <MousePointerClick size={12} /> Click the curve to set the finishing rank
              </span>
            )}
          </button>
          {curveOpen && (
            <RankDeltaCurve
              rating={effRating}
              played={effPlayed}
              rank={effRank}
              total={effTotal}
              onPick={(r) => setRank(clamp(Math.round(r), 1, effTotal))}
            />
          )}
        </div>
      </section>

      {/* Reference: recent contest history (already rated → NOT a prediction) */}
      {handle && !isLoading && !isError && user && (
        <section className="lca-section">
          <span className="lca-ref-cap">
            <Trophy size={14} aria-hidden /> Your recent contest history
          </span>

          {pending && (
            <article className="lca-contest lca-contest-pending">
              <header className="lca-contest-head">
                <div className="lca-contest-title">
                  <Hourglass size={16} aria-hidden />
                  <span>{pending.title}</span>
                </div>
                <div className="lca-contest-meta-row">
                  <span className="lca-pending-pill">
                    <Clock size={12} aria-hidden /> Awaiting LeetCode rating
                  </span>
                  {contestSlug !== contestSlugOf(pending.title) && (
                    <Link className="lca-analyze-btn" to={`/compete/leetcode/contests/${contestSlugOf(pending.title)}/analytics`}>
                      <LineChart size={13} aria-hidden /> Analysis
                    </Link>
                  )}
                </div>
              </header>

              <div className="lca-facts">
                <div className="lca-fact">
                  <span className="lca-fact-ico"><Calendar size={14} aria-hidden /></span>
                  <span className="lca-fact-val lca-fact-date">{fmtDate(pending.startTime)}</span>
                  <span className="lca-fact-lbl">Contest day</span>
                </div>
                <div className={`lca-fact${!fetchedPendingRank && pendingRankData === undefined ? ' lca-blink' : ''}`}>
                  <span className="lca-fact-ico"><Hash size={14} aria-hidden /></span>
                  <span className="lca-fact-val">{fetchedPendingRank ? `#${fetchedPendingRank.toLocaleString()}` : (pendingRankData === undefined ? '···' : '—')}</span>
                  <span className="lca-fact-lbl">
                    {fetchedPendingRank ? 'Your rank' : (pendingRankData === undefined ? 'Fetching rank…' : 'Rank pending')}
                  </span>
                </div>
                <div className="lca-fact">
                  <span className="lca-fact-ico"><CheckCircle2 size={14} aria-hidden /></span>
                  <span className="lca-fact-val">
                    {pendingSolved ? pendingSolved.solved : '—'}
                    <span className="lca-fact-of">/{pendingSolved ? pendingSolved.total : '4'}</span>
                  </span>
                  <span className="lca-fact-lbl">Solved</span>
                </div>
                <div className="lca-fact">
                  <span className="lca-fact-ico"><Award size={14} aria-hidden /></span>
                  <span className="lca-fact-val">{pending.base}</span>
                  <span className="lca-fact-lbl">Current rating</span>
                </div>
              </div>

              <p className="lca-pending-note">
                {fetchedPendingRank ? (
                  <>
                    LeetCode hasn&apos;t officially rated {pending.title} yet, so it isn&apos;t in your rated
                    history — but the ranking is live, so we pulled your finish (#{fetchedPendingRank.toLocaleString()})
                    and projected the swing above from your confirmed {pending.base}. LeetCode will confirm the
                    official change in a day or two.
                  </>
                ) : (
                  <>
                    LeetCode hasn&apos;t published results for {pending.title} yet, so it isn&apos;t in your
                    rated history. Your last confirmed rating is {pending.base}. Enter the rank you finished in
                    the predictor above to see the likely swing — it&apos;ll be confirmed once LeetCode posts the
                    official change.
                  </>
                )}
              </p>
            </article>
          )}

          {latest && (
            <article className="lca-contest">
              <header className="lca-contest-head">
                <div className="lca-contest-title">
                  <Trophy size={16} aria-hidden />
                  <span>{latest.current.title}</span>
                  <span className="lca-rated-tag">{latest.ratingPending ? 'Rating pending' : 'Rated'}</span>
                </div>
                <div className="lca-contest-meta-row">
                  <span className="lca-contest-date">
                    <Calendar size={13} aria-hidden />
                    {fmtDate(latest.current.startTime)}
                  </span>
                  {contestSlugOf(latest.current.title) && contestSlug !== contestSlugOf(latest.current.title) && (
                    <Link className="lca-analyze-btn" to={`/compete/leetcode/contests/${contestSlugOf(latest.current.title)}/analytics`}>
                      <LineChart size={13} aria-hidden /> Analysis
                    </Link>
                  )}
                </div>
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
                      projected · rating pending
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

              <p className="lca-ref-note">
                {latest.ratingPending
                  ? `LeetCode hasn't posted the official rating for ${latest.current.title} yet — this is our projection from your rank of ${latest.current.ranking ? `#${Number(latest.current.ranking).toLocaleString()}` : 'the round'}. Use the predictor above to try other finishes.`
                  : `Already rated on LeetCode. LeetCode moved you ${fmtChange(latest.actualChange)} (${Math.round(latest.oldRating)} → ${Math.round(latest.newRating)}) on ${latest.current.problemsSolved ?? 0} / ${latest.current.totalProblems ?? 4} solved; our model projected ${fmtChange(Math.round(latest.expected.delta))} from rank ${latest.current.ranking ? `#${Number(latest.current.ranking).toLocaleString()}` : ''}.`}
              </p>
            </article>
          )}

          {noContests && (
            <p className="lca-empty">
              <strong>{user.username || handle}</strong> hasn&apos;t finished a rated contest yet. Use the
              predictor above to project a finish from the current rating of {Math.round(realRating)}.
            </p>
          )}
        </section>
      )}

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
              Each contestant has an Elo rating. The logistic model gives the rank a given
              rating is expected to reach against the field; inverting it turns the rank you
              actually finished into a performance rating. Your rating then moves a fraction
              K of the gap between that performance rating and your current one — through a
              tanh so a single contest is capped at a realistic swing — with K easing off the
              more contests you have played.
            </p>
            <div className="lca-formula">
              <TexBlock tex={String.raw`P(i \succ j) = \dfrac{1}{1 + 10^{(R_j - R_i)/400}}`} />
              <TexBlock tex={String.raw`E_i = 0.5 + \sum_{j} \dfrac{1}{1 + 10^{(R_i - R_j)/400}}`} />
              <TexBlock tex={String.raw`R^{\text{perf}}_i = \mathrm{ratingForRank}(\mathrm{rank}_i)`} />
              <TexBlock tex={String.raw`R_{\text{new}} = R_i + K(k)\cdot S\,\tanh\!\Bigl(\tfrac{R^{\text{perf}}_i - R_i}{S}\Bigr)`} />
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

  const W = 720, H = 210, padL = 52, padR = 18, padT = 20, padB = 32;
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
      const d = predictDelta({ rating, actualRank: r, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: total }).delta;
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
  const curD = predictDelta({ rating, actualRank: rank, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: total }).delta;
  const curX = xOf(rank);
  const curY = yOf(curD);

  // Hover read-out (snapped to the cursor's rank).
  const hover = hoverX != null ? (() => {
    const r = clamp(Math.round(rankAtX(hoverX)), 1, total);
    const d = predictDelta({ rating, actualRank: r, contestsPlayed: played, fieldRatings: SAMPLE_FIELD, fieldSize: total }).delta;
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
