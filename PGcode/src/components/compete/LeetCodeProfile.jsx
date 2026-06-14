import React, { useMemo, useState } from 'react';
import {
  Search, TrendingUp, TrendingDown, Trophy, Globe, Percent, Swords,
  Loader2, Info, Minus, User, Users, Check, Flame, CalendarDays,
  Code2, Tags, Target, BarChart3,
} from 'lucide-react';
import { useLeetCodeUser } from '../../lib/queries';
import './LeetCodeProfile.css';

// Shown when the lc-user function isn't deployed (or the fetch fails) so the
// UI still demonstrates the chart + readouts instead of an error wall.
const SAMPLE = {
  username: 'sample-user',
  realName: 'Sample Profile',
  avatar: '',
  ranking: 184203,
  rating: 2104,
  attendedContestsCount: 9,
  globalRanking: 12480,
  totalParticipants: 280000,
  topPercentage: 4.4,
  badge: 'Knight',
  history: [
    { index: 0, title: 'Weekly Contest 380', slug: 'weekly-380', rating: 1502, ranking: 9800, trendDirection: 'NONE', attended: true, problemsSolved: 2, totalProblems: 4 },
    { index: 1, title: 'Biweekly Contest 122', slug: 'biweekly-122', rating: 1611, ranking: 6400, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 2, title: 'Weekly Contest 382', slug: 'weekly-382', rating: 1574, ranking: 11200, trendDirection: 'DOWN', attended: true, problemsSolved: 2, totalProblems: 4 },
    { index: 3, title: 'Weekly Contest 384', slug: 'weekly-384', rating: 1733, ranking: 4100, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 4, title: 'Biweekly Contest 124', slug: 'biweekly-124', rating: 1820, ranking: 3000, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 5, title: 'Weekly Contest 386', slug: 'weekly-386', rating: 1788, ranking: 4600, trendDirection: 'DOWN', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 6, title: 'Weekly Contest 388', slug: 'weekly-388', rating: 1942, ranking: 1850, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
    { index: 7, title: 'Biweekly Contest 126', slug: 'biweekly-126', rating: 2017, ranking: 1200, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
    { index: 8, title: 'Weekly Contest 390', slug: 'weekly-390', rating: 2104, ranking: 900, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
  ],
  submitStats: { easy: 312, medium: 540, hard: 128, total: 980, submissionsEasy: 410, submissionsMedium: 820, submissionsHard: 260, submissionsTotal: 1490 },
  totalQuestions: { easy: 870, medium: 1820, hard: 790, total: 3480 },
  beats: { easy: 92.4, medium: 78.1, hard: 61.5 },
  activity: { streak: 47, totalActiveDays: 412 },
  languages: [
    { language: 'Python3', solved: 540 },
    { language: 'C++', solved: 310 },
    { language: 'Java', solved: 95 },
    { language: 'JavaScript', solved: 35 },
  ],
  skills: {
    advanced: [
      { tagName: 'Dynamic Programming', problemsSolved: 142 },
      { tagName: 'Binary Search', problemsSolved: 88 },
      { tagName: 'Graph', problemsSolved: 64 },
    ],
    intermediate: [
      { tagName: 'Two Pointers', problemsSolved: 120 },
      { tagName: 'Sliding Window', problemsSolved: 76 },
      { tagName: 'Greedy', problemsSolved: 70 },
    ],
    fundamental: [
      { tagName: 'Array', problemsSolved: 290 },
      { tagName: 'String', problemsSolved: 180 },
      { tagName: 'Hash Table', problemsSolved: 160 },
    ],
  },
};

// A second sample so compare mode shows two visibly distinct curves when the
// edge function is unavailable on either side.
const SAMPLE_B = {
  username: 'sample-rival',
  realName: 'Sample Rival',
  avatar: '',
  ranking: 90120,
  rating: 1932,
  attendedContestsCount: 8,
  globalRanking: 21900,
  totalParticipants: 280000,
  topPercentage: 7.8,
  badge: 'Guardian',
  history: [
    { index: 0, title: 'Weekly Contest 380', slug: 'weekly-380', rating: 1604, ranking: 6100, trendDirection: 'NONE', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 1, title: 'Biweekly Contest 122', slug: 'biweekly-122', rating: 1688, ranking: 5200, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 2, title: 'Weekly Contest 382', slug: 'weekly-382', rating: 1720, ranking: 4700, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 3, title: 'Weekly Contest 384', slug: 'weekly-384', rating: 1655, ranking: 6900, trendDirection: 'DOWN', attended: true, problemsSolved: 2, totalProblems: 4 },
    { index: 4, title: 'Biweekly Contest 124', slug: 'biweekly-124', rating: 1798, ranking: 3400, trendDirection: 'UP', attended: true, problemsSolved: 3, totalProblems: 4 },
    { index: 5, title: 'Weekly Contest 386', slug: 'weekly-386', rating: 1850, ranking: 2600, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
    { index: 6, title: 'Weekly Contest 388', slug: 'weekly-388', rating: 1901, ranking: 2100, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
    { index: 7, title: 'Biweekly Contest 126', slug: 'biweekly-126', rating: 1932, ranking: 1800, trendDirection: 'UP', attended: true, problemsSolved: 4, totalProblems: 4 },
  ],
  submitStats: { easy: 280, medium: 410, hard: 70, total: 760, submissionsEasy: 360, submissionsMedium: 690, submissionsHard: 150, submissionsTotal: 1200 },
  totalQuestions: { easy: 870, medium: 1820, hard: 790, total: 3480 },
  beats: { easy: 85.0, medium: 64.2, hard: 41.8 },
  activity: { streak: 23, totalActiveDays: 310 },
  languages: [
    { language: 'Java', solved: 420 },
    { language: 'Python3', solved: 220 },
    { language: 'C++', solved: 90 },
    { language: 'Go', solved: 30 },
  ],
  skills: {
    advanced: [
      { tagName: 'Dynamic Programming', problemsSolved: 96 },
      { tagName: 'Backtracking', problemsSolved: 54 },
    ],
    intermediate: [
      { tagName: 'Greedy', problemsSolved: 88 },
      { tagName: 'Sliding Window', problemsSolved: 60 },
    ],
    fundamental: [
      { tagName: 'Array', problemsSolved: 240 },
      { tagName: 'Hash Table', problemsSolved: 140 },
      { tagName: 'String', problemsSolved: 130 },
    ],
  },
};

// viewBox geometry — width:100% + preserveAspectRatio keeps it scaling with no
// horizontal scroll regardless of container width.
const VB_W = 640;
const VB_H = 240;
const PAD_L = 46;
const PAD_R = 16;
const PAD_T = 18;
const PAD_B = 28;

function plotGeometry(seriesList) {
  // seriesList: [{ history }]. Shared y-scale across every series so the
  // overlay lines are directly comparable; x aligned by contest index.
  const allValid = seriesList.map((s) => (s.history || []).filter((h) => typeof h.rating === 'number'));
  const ratings = allValid.flat().map((h) => h.rating);
  if (ratings.length === 0) return null;
  let lo = Math.min(...ratings);
  let hi = Math.max(...ratings);
  if (hi === lo) { hi += 50; lo -= 50; }
  const pad = (hi - lo) * 0.12;
  lo -= pad; hi += pad;
  const maxLen = Math.max(...allValid.map((v) => v.length));
  const plotW = VB_W - PAD_L - PAD_R;
  const plotH = VB_H - PAD_T - PAD_B;
  const x = (i) => PAD_L + (maxLen <= 1 ? plotW / 2 : (i / (maxLen - 1)) * plotW);
  const y = (r) => PAD_T + plotH - ((r - lo) / (hi - lo)) * plotH;
  return {
    lo, hi, plotW, plotH, x, y,
    series: allValid.map((valid) => valid.map((h, i) => ({ ...h, cx: x(i), cy: y(h.rating) }))),
    gridY: [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      yy: PAD_T + plotH - f * plotH,
      val: Math.round(lo + f * (hi - lo)),
    })),
  };
}

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const DIFF_HUES = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' };
const DIFFS = ['easy', 'medium', 'hard'];

function fmtNum(v) {
  return v == null ? '—' : v.toLocaleString();
}

// Solved / total per difficulty as proportional horizontal bars. Guards every
// field — a null total renders the bar track only with a "—" readout.
function DifficultyBars({ submit, totals }) {
  if (!submit) return <div className="lcp-chart-empty">No solved-problem data.</div>;
  const rows = DIFFS.map((d) => {
    const solved = num(submit[d]);
    const total = num(totals?.[d]);
    const frac = solved != null && total != null && total > 0 ? solved / total : null;
    return { d, solved, total, frac };
  });
  return (
    <div className="lcp-dbars">
      {rows.map((r) => (
        <div key={r.d} className="lcp-dbar-row">
          <span className="lcp-dbar-label" style={{ color: DIFF_HUES[r.d] }}>{r.d}</span>
          <div className="lcp-dbar-track">
            <div
              className="lcp-dbar-fill"
              style={{ width: `${Math.round((r.frac ?? 0) * 100)}%`, background: DIFF_HUES[r.d] }}
            />
          </div>
          <span className="lcp-dbar-val">
            <strong>{fmtNum(r.solved)}</strong>
            <span className="lcp-dbar-total"> / {fmtNum(r.total)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// "Beats %" — one bar per difficulty, 0..100 scale, hue-colored.
function BeatsBars({ beats }) {
  if (!beats) return <div className="lcp-chart-empty">No percentile data.</div>;
  const rows = DIFFS.map((d) => ({ d, v: num(beats[d]) }));
  if (rows.every((r) => r.v == null)) return <div className="lcp-chart-empty">No percentile data.</div>;
  return (
    <div className="lcp-dbars">
      {rows.map((r) => (
        <div key={r.d} className="lcp-dbar-row">
          <span className="lcp-dbar-label" style={{ color: DIFF_HUES[r.d] }}>{r.d}</span>
          <div className="lcp-dbar-track">
            <div
              className="lcp-dbar-fill"
              style={{ width: `${Math.min(100, Math.max(0, r.v ?? 0))}%`, background: DIFF_HUES[r.d] }}
            />
          </div>
          <span className="lcp-dbar-val">
            <strong>{r.v == null ? '—' : `${r.v.toFixed(1)}%`}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

// Top languages by solved count — horizontal bars scaled to the leader.
function LanguageBars({ languages }) {
  const list = Array.isArray(languages)
    ? languages.filter((l) => l && num(l.solved) != null).slice(0, 6)
    : [];
  if (list.length === 0) return <div className="lcp-chart-empty">No language data.</div>;
  const max = Math.max(...list.map((l) => l.solved), 1);
  return (
    <div className="lcp-dbars">
      {list.map((l, i) => (
        <div key={l.language || i} className="lcp-dbar-row">
          <span className="lcp-dbar-label lcp-dbar-label-lang" title={l.language}>{l.language || '—'}</span>
          <div className="lcp-dbar-track">
            <div
              className="lcp-dbar-fill"
              style={{ width: `${Math.round((l.solved / max) * 100)}%`, background: 'var(--hue-sky)' }}
            />
          </div>
          <span className="lcp-dbar-val"><strong>{l.solved.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
}

const SKILL_TIERS = [
  { key: 'advanced', label: 'Advanced', hue: 'var(--hard)' },
  { key: 'intermediate', label: 'Intermediate', hue: 'var(--medium)' },
  { key: 'fundamental', label: 'Fundamental', hue: 'var(--easy)' },
];

// Skill tags grouped by tier, each chip showing solved count.
function SkillTags({ skills }) {
  if (!skills) return <div className="lcp-chart-empty">No tag data.</div>;
  const tiers = SKILL_TIERS
    .map((t) => ({ ...t, tags: (Array.isArray(skills[t.key]) ? skills[t.key] : []).slice(0, 6) }))
    .filter((t) => t.tags.length > 0);
  if (tiers.length === 0) return <div className="lcp-chart-empty">No tag data.</div>;
  return (
    <div className="lcp-skills">
      {tiers.map((t) => (
        <div key={t.key} className="lcp-skill-tier">
          <span className="lcp-skill-tier-label" style={{ color: t.hue }}>
            <span className="lcp-skill-dot" style={{ background: t.hue }} />{t.label}
          </span>
          <div className="lcp-skill-chips">
            {t.tags.map((tag, i) => (
              <span key={tag.tagName || i} className="lcp-skill-chip">
                {tag.tagName || '—'}
                <span className="lcp-skill-count">{num(tag.problemsSolved) ?? 0}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Two profiles side-by-side per metric as paired bars (a = accent, b = pink).
function GroupedBars({ rows }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.av ?? 0, r.bv ?? 0]));
  return (
    <div className="lcp-grouped">
      {rows.map((r) => (
        <div key={r.label} className="lcp-grouped-row">
          <span className="lcp-grouped-label">{r.label}</span>
          <div className="lcp-grouped-bars">
            <div className="lcp-grouped-track">
              <div
                className="lcp-grouped-fill"
                style={{ width: `${Math.round(((r.av ?? 0) / max) * 100)}%`, background: 'var(--accent)' }}
              />
              <span className="lcp-grouped-num">{r.fmt ? r.fmt(r.av) : fmtNum(r.av)}</span>
            </div>
            <div className="lcp-grouped-track">
              <div
                className="lcp-grouped-fill"
                style={{ width: `${Math.round(((r.bv ?? 0) / max) * 100)}%`, background: 'var(--hue-pink)' }}
              />
              <span className="lcp-grouped-num">{r.fmt ? r.fmt(r.bv) : fmtNum(r.bv)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingChart({ history }) {
  const [hover, setHover] = useState(null);

  const geo = useMemo(() => plotGeometry([{ history }]), [history]);

  if (!geo) {
    return <div className="lcp-chart-empty">No attended contests to plot yet.</div>;
  }

  const coords = geo.series[0];
  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].cx.toFixed(1)} ${(VB_H - PAD_B).toFixed(1)} L ${coords[0].cx.toFixed(1)} ${(VB_H - PAD_B).toFixed(1)} Z`;
  const active = hover != null ? coords[hover] : coords[coords.length - 1];

  return (
    <div className="lcp-chart">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Contest rating progression"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="lcpArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {geo.gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L} y1={g.yy} x2={VB_W - PAD_R} y2={g.yy}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4"
            />
            <text x={PAD_L - 8} y={g.yy + 3} textAnchor="end" className="lcp-axis-label">
              {g.val}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#lcpArea)" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />

        {active && (
          <line
            x1={active.cx} y1={PAD_T} x2={active.cx} y2={VB_H - PAD_B}
            stroke="var(--accent)" strokeWidth="1" strokeOpacity="0.4"
          />
        )}

        {coords.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.cx} cy={p.cy} r={hover === i ? 5.5 : 3.5}
              fill="var(--bg)" stroke="var(--accent)" strokeWidth="2"
            />
            <rect
              x={p.cx - 14} y={PAD_T} width="28" height={geo.plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>

      {active && (
        <div className="lcp-chart-readout">
          <span className="lcp-readout-title">{active.title}</span>
          <span className="lcp-readout-rating">{active.rating}</span>
          {active.ranking != null && <span className="lcp-readout-rank">rank #{active.ranking.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
}

// Two overlaid curves on one SVG, aligned by contest index, shared y-scale.
function CompareChart({ a, b, nameA, nameB }) {
  const geo = useMemo(
    () => plotGeometry([{ history: a.history || [] }, { history: b.history || [] }]),
    [a.history, b.history],
  );

  if (!geo) {
    return <div className="lcp-chart-empty">No attended contests to plot yet.</div>;
  }

  const colors = ['var(--accent)', 'var(--hue-pink)'];
  const labels = [nameA, nameB];

  const buildLine = (coords) =>
    coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');

  return (
    <div className="lcp-chart">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Overlaid contest rating progression for both profiles"
      >
        {geo.gridY.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L} y1={g.yy} x2={VB_W - PAD_R} y2={g.yy}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="3 4"
            />
            <text x={PAD_L - 8} y={g.yy + 3} textAnchor="end" className="lcp-axis-label">
              {g.val}
            </text>
          </g>
        ))}

        {geo.series.map((coords, s) => (
          <g key={s}>
            <path
              d={buildLine(coords)}
              fill="none"
              stroke={colors[s]}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coords.map((p, i) => (
              <circle
                key={i}
                cx={p.cx} cy={p.cy} r={3}
                fill="var(--bg)" stroke={colors[s]} strokeWidth="2"
              />
            ))}
          </g>
        ))}
      </svg>

      <div className="lcp-legend">
        {labels.map((l, i) => (
          <span key={i} className="lcp-legend-item">
            <span className="lcp-legend-dot" style={{ background: colors[i] }} />
            @{l}
          </span>
        ))}
      </div>
    </div>
  );
}

function deltaFor(history, i) {
  if (i === 0) return null;
  const cur = history[i].rating;
  const prev = history[i - 1].rating;
  if (typeof cur !== 'number' || typeof prev !== 'number') return null;
  return Math.round(cur - prev);
}

function ProfileBody({ data }) {
  const history = useMemo(() => data.history || [], [data.history]);
  const recent = useMemo(() => {
    const withDelta = history.map((h, i) => ({ ...h, delta: deltaFor(history, i) }));
    return withDelta.slice(-8).reverse();
  }, [history]);

  const submit = data.submitStats || null;
  const stats = [
    { icon: Swords, label: 'Rating', value: data.rating != null ? Math.round(data.rating) : '—', big: true },
    { icon: Globe, label: 'Global rank', value: data.globalRanking != null ? `#${data.globalRanking.toLocaleString()}` : '—' },
    { icon: Percent, label: 'Top', value: data.topPercentage != null ? `${data.topPercentage.toFixed(1)}%` : '—' },
    { icon: Trophy, label: 'Attended', value: data.attendedContestsCount ?? history.length },
    { icon: Check, label: 'Solved', value: num(submit?.total) != null ? submit.total.toLocaleString() : '—' },
  ];
  const act = data.activity || null;

  return (
    <div className="lcp-result">
      <div className="lcp-id">
        {data.avatar
          ? <img className="lcp-avatar" src={data.avatar} alt="" />
          : <div className="lcp-avatar lcp-avatar-fallback">{(data.username || '?').slice(0, 1).toUpperCase()}</div>}
        <div className="lcp-id-text">
          <span className="lcp-id-name">{data.realName || data.username}</span>
          <span className="lcp-id-handle">@{data.username}</span>
        </div>
        {data.badge && <span className="lcp-badge">{data.badge}</span>}
      </div>

      <div className="lcp-stats">
        {stats.map((s) => (
          <div key={s.label} className={`lcp-stat${s.big ? ' lcp-stat-big' : ''}`}>
            <s.icon size={15} className="lcp-stat-icon" />
            <span className="lcp-stat-value">{s.value}</span>
            <span className="lcp-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="lcp-grid">
        <section className="lcp-card lcp-card-wide">
          <h3 className="lcp-panel-title"><TrendingUp size={14} /> Rating progression</h3>
          <RatingChart history={history} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><BarChart3 size={14} /> Solved by difficulty</h3>
          <DifficultyBars submit={submit} totals={data.totalQuestions} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><Target size={14} /> Beats percentile</h3>
          <BeatsBars beats={data.beats} />
        </section>

        <section className="lcp-card lcp-card-activity">
          <h3 className="lcp-panel-title"><Flame size={14} /> Activity</h3>
          <div className="lcp-act-tiles">
            <div className="lcp-act-tile">
              <Flame size={18} className="lcp-act-icon" />
              <span className="lcp-act-value">{num(act?.streak) != null ? act.streak : '—'}</span>
              <span className="lcp-act-label">Day streak</span>
            </div>
            <div className="lcp-act-tile">
              <CalendarDays size={18} className="lcp-act-icon" />
              <span className="lcp-act-value">{num(act?.totalActiveDays) != null ? act.totalActiveDays.toLocaleString() : '—'}</span>
              <span className="lcp-act-label">Active days</span>
            </div>
          </div>
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><Code2 size={14} /> Languages</h3>
          <LanguageBars languages={data.languages} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><Tags size={14} /> Top tags</h3>
          <SkillTags skills={data.skills} />
        </section>

        <section className="lcp-card lcp-card-wide">
          <h3 className="lcp-panel-title"><Trophy size={14} /> Recent contests</h3>
          <div className="lcp-contests">
            {recent.length === 0 && <div className="lcp-empty-list">No attended contests.</div>}
            {recent.map((h) => (
              <div key={h.index} className="lcp-contest-row">
                <div className="lcp-contest-main">
                  <span className="lcp-contest-name">{h.title || h.slug || `Contest ${h.index + 1}`}</span>
                  <span className="lcp-contest-meta">
                    {h.ranking != null && <>rank #{h.ranking.toLocaleString()}</>}
                    {h.problemsSolved != null && h.totalProblems != null && (
                      <> · {h.problemsSolved}/{h.totalProblems} solved</>
                    )}
                  </span>
                </div>
                <span className="lcp-contest-rating">{h.rating != null ? Math.round(h.rating) : '—'}</span>
                <span className={`lcp-contest-delta${h.delta == null ? '' : h.delta >= 0 ? ' up' : ' down'}`}>
                  {h.delta == null
                    ? <Minus size={12} />
                    : h.delta >= 0
                      ? <><TrendingUp size={12} /> +{h.delta}</>
                      : <><TrendingDown size={12} /> {h.delta}</>}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// One identity card for the compare grid (avatar, name, badge, hue swatch).
function CompareIdentity({ data, color }) {
  return (
    <div className="lcp-cmp-id">
      <span className="lcp-cmp-swatch" style={{ background: color }} />
      {data.avatar
        ? <img className="lcp-avatar" src={data.avatar} alt="" />
        : <div className="lcp-avatar lcp-avatar-fallback">{(data.username || '?').slice(0, 1).toUpperCase()}</div>}
      <div className="lcp-id-text">
        <span className="lcp-id-name">{data.realName || data.username}</span>
        <span className="lcp-id-handle">@{data.username}</span>
      </div>
      {data.badge && <span className="lcp-badge">{data.badge}</span>}
    </div>
  );
}

// Compares two profiles. winner: 'a' | 'b' | null (tie/missing).
function CompareTable({ a, b }) {
  const rows = [
    {
      label: 'Rating', icon: Swords,
      av: num(a.rating), bv: num(b.rating),
      fmt: (v) => (v == null ? '—' : Math.round(v)),
      better: 'high',
    },
    {
      label: 'Global rank', icon: Globe,
      av: num(a.globalRanking), bv: num(b.globalRanking),
      fmt: (v) => (v == null ? '—' : `#${v.toLocaleString()}`),
      better: 'low',
    },
    {
      label: 'Top %', icon: Percent,
      av: num(a.topPercentage), bv: num(b.topPercentage),
      fmt: (v) => (v == null ? '—' : `${v.toFixed(1)}%`),
      better: 'low',
    },
    {
      label: 'Attended', icon: Trophy,
      av: num(a.attendedContestsCount) ?? (a.history || []).length,
      bv: num(b.attendedContestsCount) ?? (b.history || []).length,
      fmt: (v) => (v == null ? '—' : v),
      better: 'high',
    },
    {
      label: 'Badge', icon: Trophy,
      av: a.badge || null, bv: b.badge || null,
      fmt: (v) => v || '—',
      better: 'none',
    },
  ];

  const decide = (row) => {
    if (row.better === 'none' || row.av == null || row.bv == null) return null;
    if (row.av === row.bv) return null;
    if (row.better === 'high') return row.av > row.bv ? 'a' : 'b';
    return row.av < row.bv ? 'a' : 'b';
  };

  return (
    <div className="lcp-cmp-table" role="table" aria-label="Side-by-side stat comparison">
      {rows.map((row) => {
        const win = decide(row);
        const Icon = row.icon;
        return (
          <div className="lcp-cmp-row" role="row" key={row.label}>
            <span className={`lcp-cmp-cell lcp-cmp-a${win === 'a' ? ' lcp-cmp-win' : ''}`} role="cell">
              {win === 'a' && <Check size={13} className="lcp-cmp-check" />}
              {row.fmt(row.av)}
            </span>
            <span className="lcp-cmp-label" role="rowheader">
              <Icon size={13} /> {row.label}
            </span>
            <span className={`lcp-cmp-cell lcp-cmp-b${win === 'b' ? ' lcp-cmp-win' : ''}`} role="cell">
              {row.fmt(row.bv)}
              {win === 'b' && <Check size={13} className="lcp-cmp-check" />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CompareView({ a, b }) {
  const ratingA = num(a.rating);
  const ratingB = num(b.rating);

  let headline;
  if (ratingA == null || ratingB == null) {
    headline = 'Rating data is missing for one side — comparing what is available.';
  } else if (ratingA === ratingB) {
    headline = `Dead heat — both sit at ${Math.round(ratingA)} rating.`;
  } else {
    const lead = Math.abs(Math.round(ratingA - ratingB));
    const leader = ratingA > ratingB ? a : b;
    headline = `@${leader.username} leads by ${lead} rating.`;
  }

  return (
    <div className="lcp-result">
      <div className="lcp-cmp-headline">
        <Swords size={16} />
        <span>{headline}</span>
      </div>

      <div className="lcp-cmp-ids">
        <CompareIdentity data={a} color="var(--accent)" />
        <CompareIdentity data={b} color="var(--hue-pink)" />
      </div>

      <div className="lcp-grid">
        <section className="lcp-card lcp-card-wide">
          <h3 className="lcp-panel-title"><TrendingUp size={14} /> Rating progression</h3>
          <CompareChart a={a} b={b} nameA={a.username} nameB={b.username} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><Trophy size={14} /> Head to head</h3>
          <CompareTable a={a} b={b} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><BarChart3 size={14} /> Solved by difficulty</h3>
          <GroupedBars rows={[
            { label: 'Easy', av: num(a.submitStats?.easy), bv: num(b.submitStats?.easy) },
            { label: 'Medium', av: num(a.submitStats?.medium), bv: num(b.submitStats?.medium) },
            { label: 'Hard', av: num(a.submitStats?.hard), bv: num(b.submitStats?.hard) },
          ]} />
        </section>

        <section className="lcp-card">
          <h3 className="lcp-panel-title"><Target size={14} /> Beats percentile</h3>
          <GroupedBars rows={[
            { label: 'Easy', av: num(a.beats?.easy), bv: num(b.beats?.easy), fmt: (v) => (v == null ? '—' : `${v.toFixed(0)}%`) },
            { label: 'Medium', av: num(a.beats?.medium), bv: num(b.beats?.medium), fmt: (v) => (v == null ? '—' : `${v.toFixed(0)}%`) },
            { label: 'Hard', av: num(a.beats?.hard), bv: num(b.beats?.hard), fmt: (v) => (v == null ? '—' : `${v.toFixed(0)}%`) },
          ]} />
        </section>
      </div>
    </div>
  );
}

export default function LeetCodeProfile() {
  const [mode, setMode] = useState('single');

  // ---- single mode ----
  const [input, setInput] = useState('');
  const [handle, setHandle] = useState('');
  const single = useLeetCodeUser(handle);

  // ---- compare mode (two unconditional hook calls, gated by enabled:!!handle) ----
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [handleA, setHandleA] = useState('');
  const [handleB, setHandleB] = useState('');
  const cmpA = useLeetCodeUser(handleA);
  const cmpB = useLeetCodeUser(handleB);

  const submitSingle = (e) => {
    e.preventDefault();
    const h = input.trim();
    if (h) setHandle(h);
  };

  const submitCompare = (e) => {
    e.preventDefault();
    setHandleA(inputA.trim());
    setHandleB(inputB.trim());
  };

  // single-mode resolution
  const singleFallback = !!handle && (single.isError || (single.data && single.data.notFound));
  const singleSample = !handle || singleFallback;
  const singleProfile = singleSample ? SAMPLE : single.data;

  // compare-mode resolution — each side independently falls back to a sample
  const failA = handleA && (cmpA.isError || (cmpA.data && cmpA.data.notFound));
  const failB = handleB && (cmpB.isError || (cmpB.data && cmpB.data.notFound));
  const profileA = (!handleA || failA) ? SAMPLE : cmpA.data;
  const profileB = (!handleB || failB) ? SAMPLE_B : cmpB.data;
  const cmpLoading = (handleA && cmpA.isLoading && !failA) || (handleB && cmpB.isLoading && !failB);
  const bothEmpty = mode === 'compare' && !handleA && !handleB;
  const oneEmpty = mode === 'compare' && (handleA || handleB) && (!handleA || !handleB);

  return (
    <div className="lcp-wrap">
      <div className="lcp-modes" role="tablist" aria-label="Lookup mode">
        <button
          role="tab"
          aria-selected={mode === 'single'}
          className={`lcp-mode${mode === 'single' ? ' active' : ''}`}
          onClick={() => setMode('single')}
        >
          <User size={14} /> Single
        </button>
        <button
          role="tab"
          aria-selected={mode === 'compare'}
          className={`lcp-mode${mode === 'compare' ? ' active' : ''}`}
          onClick={() => setMode('compare')}
        >
          <Users size={14} /> Compare
        </button>
      </div>

      {mode === 'single' ? (
        <>
          <form className="lcp-search" onSubmit={submitSingle}>
            <div className="lcp-input-box">
              <Search size={15} className="lcp-input-icon" />
              <input
                className="lcp-input"
                type="text"
                placeholder="LeetCode username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <button className="lcp-btn" type="submit" disabled={!input.trim() || single.isLoading}>
              {single.isLoading ? <Loader2 size={15} className="lcp-spin" /> : <Search size={15} />}
              Look up
            </button>
          </form>

          {singleFallback && (
            <div className="lcp-note">
              <Info size={14} />
              {single.data?.notFound
                ? <>No LeetCode user <strong>{handle}</strong> found — showing a sample profile below.</>
                : <>Live lookup needs the <code>lc-user</code> function deployed — showing a sample profile below.</>}
            </div>
          )}

          {(single.isLoading && !singleSample)
            ? (
              <div className="lcp-loading">
                <Loader2 size={22} className="lcp-spin" />
                <span>Fetching contest history…</span>
              </div>
            )
            : <ProfileBody data={singleProfile} />}
        </>
      ) : (
        <>
          <form className="lcp-search lcp-search-compare" onSubmit={submitCompare}>
            <div className="lcp-input-box">
              <Search size={15} className="lcp-input-icon" />
              <input
                className="lcp-input"
                type="text"
                placeholder="Ex: hy_34"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <span className="lcp-vs">vs</span>
            <div className="lcp-input-box">
              <Search size={15} className="lcp-input-icon" />
              <input
                className="lcp-input"
                type="text"
                placeholder="Ex: sb_03"
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <button
              className="lcp-btn"
              type="submit"
              disabled={(!inputA.trim() && !inputB.trim()) || cmpLoading}
            >
              {cmpLoading ? <Loader2 size={15} className="lcp-spin" /> : <Swords size={15} />}
              Compare
            </button>
          </form>

          {oneEmpty && (
            <div className="lcp-note">
              <Info size={14} />
              Enter a handle on both sides for a full head-to-head — the empty side shows a sample for now.
            </div>
          )}

          {(failA || failB) && (
            <div className="lcp-note">
              <Info size={14} />
              {failA && failB
                ? <>Neither handle resolved — showing sample profiles for both sides.</>
                : failA
                  ? <>No data for <strong>{handleA}</strong> — showing a sample on the left.</>
                  : <>No data for <strong>{handleB}</strong> — showing a sample on the right.</>}
            </div>
          )}

          {cmpLoading
            ? (
              <div className="lcp-loading">
                <Loader2 size={22} className="lcp-spin" />
                <span>Fetching both contest histories…</span>
              </div>
            )
            : bothEmpty
              ? <CompareView a={SAMPLE} b={SAMPLE_B} />
              : <CompareView a={profileA} b={profileB} />}
        </>
      )}
    </div>
  );
}
