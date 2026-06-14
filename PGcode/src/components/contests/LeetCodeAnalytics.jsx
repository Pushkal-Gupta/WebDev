import React, { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';
import './Contests.css';

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
// new_rating = R_i + f(k) * (target - R_i).

// Expected rank (seed) of a player with rating R against the whole field.
function expectedRank(R, ratings) {
  let e = 0.5;
  for (const rj of ratings) e += 1 / (1 + Math.pow(10, (R - rj) / 400));
  return e;
}

// Invert: find the rating whose expected rank equals targetRank.
function ratingForRank(targetRank, ratings) {
  let lo = 0, hi = 4000;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    // expectedRank is monotonically DECREASING in R (higher rating -> better rank)
    if (expectedRank(mid, ratings) < targetRank) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// Shrink factor by contests played (more contests -> smaller swings).
function dampingFactor(contestsPlayed) {
  let weighted = 0;
  const cap = Math.min(contestsPlayed, 100);
  for (let t = 1; t <= cap; t++) weighted += Math.pow(0.9, t);
  const f = 1 / (1 + weighted / 5);
  return Math.max(f, 0.18); // floor so seasoned players still move a little
}

// eslint-disable-next-line react-refresh/only-export-components
export function predictDelta({ rating, actualRank, contestsPlayed, fieldRatings }) {
  const seed = expectedRank(rating, fieldRatings);
  const performanceRank = Math.sqrt(seed * actualRank);
  const target = ratingForRank(performanceRank, fieldRatings);
  const f = dampingFactor(contestsPlayed);
  const delta = f * (target - rating);
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

const TOTAL_PARTICIPANTS = 24180;
// A small representative slice of the field's ratings drives the worked example.
const SAMPLE_FIELD = [3240, 2980, 2510, 2180, 1840, 1620, 1500, 1390, 1310, 1240, 1180, 1120];

const DIFF_HUE = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' };

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function LeetCodeAnalytics() {
  const [rating, setRating] = useState(1750);
  const [rank, setRank] = useState(820);
  const [played, setPlayed] = useState(12);
  const [showMath, setShowMath] = useState(false);

  const result = useMemo(
    () => predictDelta({
      rating,
      actualRank: rank,
      contestsPlayed: played,
      fieldRatings: SAMPLE_FIELD,
    }),
    [rating, rank, played],
  );

  const up = result.delta >= 0;
  const deltaRounded = Math.round(result.delta);
  const newRating = Math.round(result.newRating);
  const percentile = clamp((1 - rank / TOTAL_PARTICIPANTS) * 100, 0, 100);

  // Gauge sweeps from -100 to +100 delta over a 240-degree arc.
  const DMAX = 100;
  const sweep = clamp(result.delta, -DMAX, DMAX) / DMAX; // -1..1
  const arcStart = -210; // degrees
  const arcEnd = 30;
  const angle = arcStart + ((sweep + 1) / 2) * (arcEnd - arcStart);
  const gaugePt = polar(110, 95, angle, 78);
  const trackBg = describeArc(110, 95, 78, arcStart, arcEnd);
  const midDeg = arcStart + 0.5 * (arcEnd - arcStart);
  const fillArc = up
    ? describeArc(110, 95, 78, midDeg, angle)
    : describeArc(110, 95, 78, angle, midDeg);

  return (
    <div className="lca-wrap">
      <p className="ctx-sub lca-intro">
        Drag the sliders — watch a contest rank turn into a rating change.
      </p>

      {/* Gauge + sliders */}
      <section className="lca-section">
        <div className="lca-predictor">
          <div className="lca-gauge-panel">
            <svg
              className="lca-gauge"
              viewBox="0 0 220 150"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Predicted rating change ${deltaRounded}`}
            >
              <path d={trackBg} className="lca-arc-track" />
              <path
                d={fillArc}
                className={`lca-arc-fill ${up ? 'up' : 'down'}`}
              />
              <line
                x1="110" y1="95"
                x2={gaugePt.x} y2={gaugePt.y}
                className={`lca-needle ${up ? 'up' : 'down'}`}
              />
              <circle cx="110" cy="95" r="5" className="lca-needle-hub" />
              <text x="110" y="80" className={`lca-gauge-delta ${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}{deltaRounded}
              </text>
              <text x="110" y="118" className="lca-gauge-cap">
                new rating {newRating}
              </text>
              <text x="32" y="138" className="lca-gauge-tick">-100</text>
              <text x="188" y="138" className="lca-gauge-tick">+100</text>
            </svg>
            <div className={`lca-gauge-badge ${up ? 'up' : 'down'}`}>
              {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {rating} → {newRating}
            </div>
          </div>

          <div className="lca-inputs">
            <Slider label="Current rating" value={rating} min={1200} max={3200} step={10} onChange={setRating} />
            <Slider label="Finish rank" value={rank} min={1} max={TOTAL_PARTICIPANTS} step={1} onChange={setRank} suffix={`of ${TOTAL_PARTICIPANTS.toLocaleString()}`} />
            <Slider label="Contests played" value={played} min={0} max={120} step={1} onChange={setPlayed} />

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
        </div>
      </section>

      {/* Rating curve preview */}
      <section className="lca-section">
        <h2 className="exc-section-title">Rating path</h2>
        <RatingCurve from={rating} to={newRating} up={up} />
      </section>

      {/* Per-question solve rate */}
      <section className="lca-section">
        <h2 className="exc-section-title">Solve rate per question</h2>
        <div className="lca-qstats">
          {SAMPLE_QUESTIONS.map(q => {
            const rate = q.solved / q.attempted;
            return (
              <div key={q.id} className="lca-qrow" style={{ '--q-hue': DIFF_HUE[q.difficulty] }}>
                <span className="lca-qid">{q.id}</span>
                <span className="lca-qtitle" title={q.title}>{q.title}</span>
                <div className="lca-qbar" title={`${q.solved.toLocaleString()} of ${q.attempted.toLocaleString()} solved`}>
                  <div className="lca-qbar-fill" style={{ width: `${rate * 100}%` }} />
                </div>
                <span className="lca-qpct" style={{ color: DIFF_HUE[q.difficulty] }}>{(rate * 100).toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works — disclosure */}
      <section className="lca-section">
        <button
          className={`lca-disc-btn${showMath ? ' open' : ''}`}
          onClick={() => setShowMath(v => !v)}
          aria-expanded={showMath}
        >
          <ChevronDown size={14} className="lca-disc-chev" />
          How it works
        </button>
        {showMath && (
          <div className="lca-disc-body">
            <p>
              Each contestant has an Elo rating. The logistic seed estimates where you
              should rank against the field; the geometric mean of that seed and your
              actual rank gives a performance target, and the rating that would produce it
              is your new rating — damped by how many contests you have already played.
            </p>
            <div className="lca-formula">
              <span>P(i &gt; j) = 1 / (1 + 10^((R_j − R_i) / 400))</span>
              <span>E_i = 0.5 + Σ_j 1 / (1 + 10^((R_i − R_j) / 400))</span>
              <span>m_i = √(E_i · rank_i)</span>
              <span>new_R = R_i + f(k) · (rating_for_rank(m_i) − R_i)</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function RatingCurve({ from, to, up }) {
  // Simple before -> after curve in a 320x100 viewBox.
  const W = 320, H = 100, padX = 14, padY = 16;
  const lo = Math.min(from, to) - 30;
  const hi = Math.max(from, to) + 30;
  const span = Math.max(hi - lo, 1);
  const y = (v) => padY + (1 - (v - lo) / span) * (H - 2 * padY);
  const x0 = padX, x1 = W - padX;
  const y0 = y(from), y1 = y(to);
  const cx = (x0 + x1) / 2;
  const path = `M ${x0} ${y0} C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  const area = `${path} L ${x1} ${H - padY} L ${x0} ${H - padY} Z`;
  return (
    <div className="lca-curve-card">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="lca-curve" role="img" aria-label={`Rating from ${from} to ${to}`}>
        <path d={area} className={`lca-curve-area ${up ? 'up' : 'down'}`} />
        <path d={path} className={`lca-curve-line ${up ? 'up' : 'down'}`} />
        <circle cx={x0} cy={y0} r="3.5" className="lca-curve-dot" />
        <circle cx={x1} cy={y1} r="4" className={`lca-curve-dot ${up ? 'up' : 'down'}`} />
      </svg>
      <div className="lca-curve-ends">
        <span>now {from}</span>
        <span className={up ? 'up' : 'down'}>after {to}</span>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, suffix }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="lca-slider">
      <span className="lca-slider-label">
        {label}
        <span className="lca-slider-value">{value.toLocaleString()}{suffix ? ` ${suffix}` : ''}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${pct}%` }}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  );
}

// ── SVG arc helpers ──────────────────────────────────────────────────────────
function polar(cx, cy, deg, r) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function describeArc(cx, cy, r, startDeg, endDeg) {
  const a = polar(cx, cy, startDeg, r);
  const b = polar(cx, cy, endDeg, r);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}
