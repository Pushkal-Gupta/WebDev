import React, { useId, useMemo, useRef, useState } from 'react';
import {
  Search, TrendingUp, TrendingDown, Trophy, Globe, Percent, Swords,
  Loader2, Info, Minus, User, Users, Check, Flame, CalendarDays,
  Code2, Tags, Target, BarChart3, PieChart, Send, X,
} from 'lucide-react';
import { useLeetCodeUser } from '../../lib/queries';
import {
  StatCard, Donut, GaugeRing, HBarChart, LineChart, Legend,
} from './Charts';
import './LeetCodeProfile.css';

const num = (v) => (typeof v === 'number' && !Number.isNaN(v) ? v : null);
const fmtNum = (v) => (v == null ? '—' : v.toLocaleString());
const DIFF_HUES = { easy: 'var(--easy)', medium: 'var(--medium)', hard: 'var(--hard)' };
const DIFFS = ['easy', 'medium', 'hard'];

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

const CMP_A = 'var(--accent)';
const CMP_B = 'var(--hue-violet)';

// Shared interactive tooltip: a positioned HTML overlay sitting above an SVG
// chart. Keeps tooltip styling in theme tokens (no SVG <text> fiddling) and
// clamps to the chart box so it never spills or forces a scrollbar.
function useChartTip() {
  const ref = useRef(null);
  const [tip, setTip] = useState(null); // { x, y, rows: [{ label, value, color }], title }
  const move = (e, payload) => {
    const host = ref.current;
    if (!host || !payload) { setTip(null); return; }
    const rect = host.getBoundingClientRect();
    setTip({
      ...payload,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      w: rect.width,
    });
  };
  const clear = () => setTip(null);
  return { ref, tip, move, clear };
}

function ChartTip({ tip }) {
  if (!tip) return null;
  const onRight = tip.x > tip.w * 0.5;
  return (
    <div
      className="lpf-tip"
      style={{
        left: tip.x,
        top: tip.y,
        transform: `translate(${onRight ? 'calc(-100% - 12px)' : '12px'}, -50%)`,
      }}
      role="status"
    >
      {tip.title && <span className="lpf-tip-title">{tip.title}</span>}
      {tip.rows.map((r, i) => (
        <span key={i} className="lpf-tip-row">
          <span className="lpf-tip-dot" style={{ background: r.color }} />
          <span className="lpf-tip-label">{r.label}</span>
          <strong className="lpf-tip-val">{r.value}</strong>
        </span>
      ))}
    </div>
  );
}

// Chronological ordering key for a contest. Prefer the contest number parsed
// out of the title ("Weekly Contest 505" -> 505) so a raw API order that ships
// "502" after "505" still sorts numerically; fall back to startTime, then to
// the API index. Without this, slice(-8) trusts the source order and lists
// contests out of sequence.
function contestOrder(h) {
  const n = typeof h.title === 'string' ? h.title.match(/(\d+)/) : null;
  if (n) return Number(n[1]);
  const t = Number(h.startTime);
  if (Number.isFinite(t)) return t;
  return Number(h.index) || 0;
}

// Stable identity key for a contest so two users' histories align by the SAME
// contest rather than by array position. Prefer slug, then the contest number
// parsed from the title, then startTime — never the raw array index, which is
// per-user and would mis-pair different contests.
function contestKey(h) {
  if (h.slug) return `s:${String(h.slug).toLowerCase()}`;
  const n = typeof h.title === 'string' ? h.title.match(/(\d+)/) : null;
  if (n) {
    const isBi = /bi-?weekly/i.test(h.title || '');
    return `${isBi ? 'b' : 'w'}:${n[1]}`;
  }
  const t = Number(h.startTime);
  if (Number.isFinite(t)) return `t:${t}`;
  return `x:${h.title || h.index}`;
}

// Sorted union (oldest -> newest) of both users' contest histories keyed by
// actual contest identity. Each row carries the matching entry for A and B (or
// null where that user did not participate).
function unionContests(a, b) {
  const byKey = new Map();
  const add = (h, side) => {
    const k = contestKey(h);
    const row = byKey.get(k) || { key: k, title: h.title || h.slug || '', order: contestOrder(h), a: null, b: null };
    row[side] = h;
    if (!row.title) row.title = h.title || h.slug || '';
    row.order = Math.max(row.order, contestOrder(h));
    byKey.set(k, row);
  };
  (a.history || []).forEach((h) => add(h, 'a'));
  (b.history || []).forEach((h) => add(h, 'b'));
  return Array.from(byKey.values()).sort((x, y) => x.order - y.order);
}

function deltaFor(history, i) {
  if (i === 0) return null;
  const cur = history[i].rating;
  const prev = history[i - 1].rating;
  if (typeof cur !== 'number' || typeof prev !== 'number') return null;
  return Math.round(cur - prev);
}

// Maps contest history to the LineChart point shape, carrying rank + delta into
// `meta` so the hover tooltip can read them.
function ratingPoints(history) {
  return (history || [])
    .filter((h) => typeof h.rating === 'number')
    .map((h, i, arr) => ({
      label: h.title || h.slug || `Contest ${h.index + 1}`,
      value: h.rating,
      meta: {
        rank: num(h.ranking),
        delta: i === 0 ? null : Math.round(h.rating - arr[i - 1].rating),
      },
    }));
}

// Solved difficulty segments for a donut from submitStats.
function solvedSegments(submit) {
  return DIFFS.map((d) => ({ key: d, label: d, value: num(submit?.[d]) ?? 0, hue: DIFF_HUES[d] }));
}

// ---- single-mode chart sections ----

function SolvedByDifficulty({ submit, totals }) {
  if (!submit) return <div className="chk-empty">No solved-problem data.</div>;
  const rows = DIFFS.map((d) => {
    const solved = num(submit[d]);
    const total = num(totals?.[d]);
    return {
      key: d, label: d, labelHue: DIFF_HUES[d], hueA: DIFF_HUES[d],
      a: solved, scaleField: total,
      fmt: (v) => `${fmtNum(v)}${total != null ? ` / ${total.toLocaleString()}` : ''}`,
    };
  });
  const max = Math.max(1, ...rows.map((r) => num(r.scaleField) ?? num(r.a) ?? 0));
  return <HBarChart rows={rows} scaleMax={max} />;
}

function SubmissionsByDifficulty({ submit }) {
  if (!submit) return <div className="chk-empty">No submission data.</div>;
  const fields = { easy: 'submissionsEasy', medium: 'submissionsMedium', hard: 'submissionsHard' };
  const rows = DIFFS.map((d) => ({
    key: d, label: d, labelHue: DIFF_HUES[d], hueA: DIFF_HUES[d],
    a: num(submit[fields[d]]),
  }));
  if (rows.every((r) => r.a == null)) return <div className="chk-empty">No submission data.</div>;
  return <HBarChart rows={rows} />;
}

function LanguageBars({ languages }) {
  const list = Array.isArray(languages) ? languages.filter((l) => l && num(l.solved) != null).slice(0, 6) : [];
  if (list.length === 0) return <div className="chk-empty">No language data.</div>;
  const rows = list.map((l, i) => ({ key: l.language || i, label: l.language || '—', a: l.solved, hueA: 'var(--hue-sky)' }));
  return <HBarChart rows={rows} />;
}

// Tier each tag belongs to, so the bar can pick up a difficulty-matched hue.
const TIER_HUE = { advanced: 'var(--hard)', intermediate: 'var(--medium)', fundamental: 'var(--easy)' };

// Flattens all skill tiers into a single ranked list of { tag, solved, hue }
// so the top tags render as one clean horizontal bar chart.
function topTagRows(skills, limit = 8) {
  if (!skills) return [];
  const out = [];
  ['advanced', 'intermediate', 'fundamental'].forEach((tier) => {
    (Array.isArray(skills[tier]) ? skills[tier] : []).forEach((t) => {
      if (!t || !t.tagName) return;
      const solved = num(t.problemsSolved) ?? 0;
      const existing = out.find((r) => r.label === t.tagName);
      if (existing) {
        existing.a += solved;
      } else {
        out.push({ key: t.tagName, label: t.tagName, a: solved, hueA: TIER_HUE[tier] });
      }
    });
  });
  return out.sort((x, y) => y.a - x.a).slice(0, limit);
}

function TopTags({ skills }) {
  const rows = useMemo(() => topTagRows(skills), [skills]);
  if (rows.length === 0) return <div className="chk-empty">No tag data.</div>;
  return (
    <>
      <HBarChart rows={rows} />
      <div className="lpf-tag-key">
        <span className="lpf-tag-key-item"><span className="lpf-tag-key-dot" style={{ background: 'var(--hard)' }} />Advanced</span>
        <span className="lpf-tag-key-item"><span className="lpf-tag-key-dot" style={{ background: 'var(--medium)' }} />Intermediate</span>
        <span className="lpf-tag-key-item"><span className="lpf-tag-key-dot" style={{ background: 'var(--easy)' }} />Fundamental</span>
      </div>
    </>
  );
}

function RatingSection({ history }) {
  const points = useMemo(() => ratingPoints(history), [history]);
  if (points.length === 0) return <div className="chk-empty">No attended contests to plot yet.</div>;
  const peak = Math.max(...points.map((p) => p.value));
  const latest = points[points.length - 1].value;
  return (
    <div className="lpf-chart">
      <LineChart series={[{ points, color: 'var(--accent)' }]} area interactive peakLabel />
      <div className="lpf-chart-readout">
        <span className="lpf-readout-rating">{Math.round(latest)}</span>
        <span className="lpf-readout-title">current · peak {Math.round(peak)}</span>
        <span className="lpf-readout-rank">{points.length} contests</span>
      </div>
    </div>
  );
}

function ProfileBody({ data }) {
  const history = useMemo(
    () => [...(data.history || [])].sort((a, b) => contestOrder(a) - contestOrder(b)),
    [data.history],
  );
  const recent = useMemo(() => {
    const withDelta = history.map((h, i) => ({ ...h, delta: deltaFor(history, i) }));
    return withDelta.slice(-8).reverse();
  }, [history]);

  const submit = data.submitStats || null;
  const act = data.activity || null;
  const beats = data.beats || null;
  const stats = [
    { icon: Swords, label: 'Rating', value: data.rating != null ? Math.round(data.rating) : '—', hue: 'var(--accent)', big: true },
    { icon: Globe, label: 'Global rank', value: data.globalRanking != null ? `#${data.globalRanking.toLocaleString()}` : '—' },
    { icon: Percent, label: 'Top', value: data.topPercentage != null ? `${data.topPercentage.toFixed(1)}%` : '—' },
    { icon: Trophy, label: 'Attended', value: data.attendedContestsCount ?? history.length },
    { icon: Check, label: 'Solved', value: num(submit?.total) != null ? submit.total.toLocaleString() : '—' },
  ];

  return (
    <div className="lpf-result">
      <div className="lpf-id">
        {data.avatar
          ? <img className="lpf-avatar" src={data.avatar} alt="" />
          : <div className="lpf-avatar lpf-avatar-fallback">{(data.username || '?').slice(0, 1).toUpperCase()}</div>}
        <div className="lpf-id-text">
          <span className="lpf-id-name">{data.realName || data.username}</span>
          <span className="lpf-id-handle">@{data.username}</span>
        </div>
        {data.badge && <span className="lpf-badge">{data.badge}</span>}
      </div>

      <div className="lpf-stats">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} hue={s.hue} big={s.big} />
        ))}
      </div>

      <div className="lpf-grid">
        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><TrendingUp size={14} /> Rating over time</h3>
          <RatingSection history={history} />
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><PieChart size={14} /> Solved split</h3>
          {submit
            ? <Donut segments={solvedSegments(submit)} total={num(submit.total)} caption="solved" ariaLabel="Solved problems by difficulty" />
            : <div className="chk-empty">No solved-problem data.</div>}
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><BarChart3 size={14} /> Solved vs total</h3>
          <SolvedByDifficulty submit={submit} totals={data.totalQuestions} />
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><Target size={14} /> Beats percentile</h3>
          {beats && DIFFS.some((d) => num(beats[d]) != null) ? (
            <div className="lpf-gauges">
              {DIFFS.map((d) => (
                <GaugeRing
                  key={d}
                  value={num(beats[d])}
                  max={100}
                  suffix="%"
                  hue={DIFF_HUES[d]}
                  caption={d}
                />
              ))}
            </div>
          ) : <div className="chk-empty">No percentile data.</div>}
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><Send size={14} /> Submissions by difficulty</h3>
          <SubmissionsByDifficulty submit={submit} />
        </section>

        <section className="lpf-card lpf-card-activity">
          <h3 className="lpf-panel-title"><Flame size={14} /> Activity</h3>
          <div className="lpf-gauges">
            <GaugeRing value={num(act?.streak)} max={30} hue="var(--warning)" icon={Flame} caption="Day streak" goalLabel="of 30" />
            <GaugeRing value={num(act?.totalActiveDays)} max={365} hue="var(--accent)" icon={CalendarDays} caption="Active days" goalLabel="of 365" />
          </div>
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><Code2 size={14} /> Languages</h3>
          <LanguageBars languages={data.languages} />
        </section>

        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><Tags size={14} /> Top tags by solved</h3>
          <TopTags skills={data.skills} />
        </section>

        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><Trophy size={14} /> Recent contests</h3>
          <div className="lpf-contests">
            {recent.length === 0 && <div className="chk-empty">No attended contests.</div>}
            {recent.map((h) => (
              <div key={h.index} className="lpf-contest-row">
                <div className="lpf-contest-main">
                  <span className="lpf-contest-name">{h.title || h.slug || `Contest ${h.index + 1}`}</span>
                  <span className="lpf-contest-meta">
                    {h.ranking != null && <>rank #{h.ranking.toLocaleString()}</>}
                    {h.problemsSolved != null && h.totalProblems != null && (
                      <> · {h.problemsSolved}/{h.totalProblems} solved</>
                    )}
                  </span>
                </div>
                <span className="lpf-contest-rating">{h.rating != null ? Math.round(h.rating) : '—'}</span>
                <span className={`lpf-contest-delta${h.delta == null ? '' : h.delta >= 0 ? ' up' : ' down'}`}>
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

// ---- compare mode ----

function CompareIdentity({ data, color }) {
  return (
    <div className="lpf-cmp-id">
      <span className="lpf-cmp-swatch" style={{ background: color }} />
      {data.avatar
        ? <img className="lpf-avatar" src={data.avatar} alt="" />
        : <div className="lpf-avatar lpf-avatar-fallback">{(data.username || '?').slice(0, 1).toUpperCase()}</div>}
      <div className="lpf-id-text">
        <span className="lpf-id-name">{data.realName || data.username}</span>
        <span className="lpf-id-handle">@{data.username}</span>
      </div>
      {data.badge && <span className="lpf-badge">{data.badge}</span>}
    </div>
  );
}

// Flattens every skill tier into a single { tag -> solved } map so the two
// profiles can be compared on the same per-tag axis.
function tagMap(skills) {
  const out = {};
  if (!skills) return out;
  ['advanced', 'intermediate', 'fundamental'].forEach((tier) => {
    (Array.isArray(skills[tier]) ? skills[tier] : []).forEach((t) => {
      if (!t || !t.tagName) return;
      out[t.tagName] = (out[t.tagName] || 0) + (num(t.problemsSolved) ?? 0);
    });
  });
  return out;
}

function tagCompareRows(a, b) {
  const ma = tagMap(a.skills);
  const mb = tagMap(b.skills);
  const tags = Array.from(new Set([...Object.keys(ma), ...Object.keys(mb)]));
  return tags
    .map((t) => ({ key: t, label: t, a: ma[t] ?? 0, b: mb[t] ?? 0 }))
    .sort((x, y) => (y.a + y.b) - (x.a + x.b))
    .slice(0, 8);
}

// Marks a cell where a user did not participate in that contest. Lucide X
// (never an emoji), muted via theme tokens.
function AbsentMark() {
  return (
    <span className="lpf-absent" aria-label="did not participate" title="Did not participate">
      <X size={13} />
    </span>
  );
}

// Per-contest comparison over the sorted UNION of both histories (newest first).
// Where a user skipped a contest the cell shows an X, so "A attended, B didn't"
// reads at a glance instead of silently dropping the row.
function ContestComparisonTable({ a, b }) {
  const rows = useMemo(() => unionContests(a, b).reverse(), [a, b]);
  if (rows.length === 0) return <div className="chk-empty">No contests on either side.</div>;
  const rankCell = (h, color) => (h && h.ranking != null
    ? <span style={{ color }}>{`#${h.ranking.toLocaleString()}`}</span>
    : h
      ? <span style={{ color }}>—</span>
      : <AbsentMark />);
  const solvedCell = (h) => (h
    ? <span>{h.problemsSolved != null ? `${h.problemsSolved}/${h.totalProblems ?? '?'}` : '—'}</span>
    : <AbsentMark />);
  return (
    <div className="lpf-common" role="table" aria-label="Per-contest comparison across both profiles">
      <div className="lpf-common-head" role="row">
        <span role="columnheader">Contest</span>
        <span role="columnheader" style={{ color: CMP_A }}>@{a.username} rank</span>
        <span role="columnheader" style={{ color: CMP_B }}>@{b.username} rank</span>
        <span role="columnheader" style={{ color: CMP_A }}>@{a.username} solved</span>
        <span role="columnheader" style={{ color: CMP_B }}>@{b.username} solved</span>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="lpf-common-row" role="row">
          <span className="lpf-common-name" role="cell">{r.title || r.key}</span>
          <span role="cell">{rankCell(r.a, CMP_A)}</span>
          <span role="cell">{rankCell(r.b, CMP_B)}</span>
          <span role="cell">{solvedCell(r.a)}</span>
          <span role="cell">{solvedCell(r.b)}</span>
        </div>
      ))}
    </div>
  );
}

function headToHeadTally(a, b) {
  const metrics = [
    { av: num(a.rating), bv: num(b.rating), better: 'high' },
    { av: num(a.globalRanking), bv: num(b.globalRanking), better: 'low' },
    { av: num(a.submitStats?.total), bv: num(b.submitStats?.total), better: 'high' },
    {
      av: ((num(a.beats?.easy) ?? 0) + (num(a.beats?.medium) ?? 0) + (num(a.beats?.hard) ?? 0)) / 3,
      bv: ((num(b.beats?.easy) ?? 0) + (num(b.beats?.medium) ?? 0) + (num(b.beats?.hard) ?? 0)) / 3,
      better: 'high',
    },
    {
      av: num(a.attendedContestsCount) ?? (a.history || []).length,
      bv: num(b.attendedContestsCount) ?? (b.history || []).length,
      better: 'high',
    },
  ];
  let aWins = 0;
  let bWins = 0;
  metrics.forEach((m) => {
    if (m.av == null || m.bv == null || m.av === m.bv) return;
    const aBetter = m.better === 'high' ? m.av > m.bv : m.av < m.bv;
    if (aBetter) aWins += 1; else bWins += 1;
  });
  return { a: aWins, b: bWins, total: metrics.length };
}

// Per-metric head-to-head chips: each metric resolves to a winner, rendered as
// a pill tinted to the leader's color. Drives the scoreboard tally visually.
const H2H_METRICS = [
  { key: 'rating', label: 'Rating', av: (d) => num(d.rating), better: 'high', fmt: (v) => Math.round(v) },
  { key: 'rank', label: 'Global rank', av: (d) => num(d.globalRanking), better: 'low', fmt: (v) => `#${Math.round(v).toLocaleString()}` },
  { key: 'solved', label: 'Solved', av: (d) => num(d.submitStats?.total), better: 'high', fmt: (v) => Math.round(v).toLocaleString() },
  {
    key: 'beats', label: 'Avg beats', better: 'high', fmt: (v) => `${v.toFixed(0)}%`,
    av: (d) => {
      const vals = DIFFS.map((x) => num(d.beats?.[x])).filter((v) => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    },
  },
  { key: 'attended', label: 'Contests', better: 'high', fmt: (v) => Math.round(v), av: (d) => num(d.attendedContestsCount) ?? (d.history || []).length },
];

function metricWinner(m, a, b) {
  const av = m.av(a);
  const bv = m.av(b);
  if (av == null || bv == null || av === bv) return { win: null, av, bv };
  const aBetter = m.better === 'high' ? av > bv : av < bv;
  return { win: aBetter ? 'a' : 'b', av, bv };
}

function Scoreboard({ a, b, tally, headline }) {
  return (
    <div className="lpf-board">
      <div className="lpf-board-top">
        <div className="lpf-board-side lpf-board-a">
          <span className="lpf-board-dot" style={{ background: CMP_A }} />
          <span className="lpf-board-handle">@{a.username}</span>
        </div>
        <div className="lpf-board-score">
          <span className="lpf-board-tally" style={{ color: CMP_A }}>{tally.a}</span>
          <span className="lpf-board-dash">–</span>
          <span className="lpf-board-tally" style={{ color: CMP_B }}>{tally.b}</span>
        </div>
        <div className="lpf-board-side lpf-board-b">
          <span className="lpf-board-handle">@{b.username}</span>
          <span className="lpf-board-dot" style={{ background: CMP_B }} />
        </div>
      </div>
      <div className="lpf-board-headline"><Swords size={14} /> {headline}</div>
      <div className="lpf-board-chips">
        {H2H_METRICS.map((m) => {
          const { win, av, bv } = metricWinner(m, a, b);
          const winColor = win === 'a' ? CMP_A : win === 'b' ? CMP_B : 'var(--text-dim)';
          return (
            <div key={m.key} className="lpf-chip">
              <span className="lpf-chip-label">{m.label}</span>
              <span className="lpf-chip-vals">
                <span className={win === 'a' ? 'lpf-chip-lead' : ''} style={win === 'a' ? { color: CMP_A } : undefined}>
                  {av == null ? '—' : m.fmt(av)}
                </span>
                <span className="lpf-chip-sep">vs</span>
                <span className={win === 'b' ? 'lpf-chip-lead' : ''} style={win === 'b' ? { color: CMP_B } : undefined}>
                  {bv == null ? '—' : m.fmt(bv)}
                </span>
              </span>
              <span className="lpf-chip-bar" style={{ background: winColor }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// HTML flex bar so segment widths are exact percentages and the corner radius
// is uniform — fixes the stretched rounded "pill" the old preserveAspectRatio
// "none" SVG produced on the trailing segment. Each segment is hover-tippable.
function StackedRow({ row, color, handle, max, move, clear }) {
  const fillPct = max > 0 ? (row.total / max) * 100 : 0;
  return (
    <div className="lpf-stack-row">
      <div className="lpf-stack-head">
        <span className="lpf-stack-dot" style={{ background: color }} />
        <span className="lpf-stack-handle">@{handle}</span>
        <span className="lpf-stack-total">{row.total.toLocaleString()}</span>
      </div>
      <div className="lpf-stack-track" role="img" aria-label={`Solved split for ${handle}`}>
        <div className="lpf-stack-fill" style={{ width: `${fillPct.toFixed(2)}%` }}>
          {row.segs.map((s) => {
            const segPct = row.total > 0 ? (s.value / row.total) * 100 : 0;
            if (segPct <= 0) return null;
            return (
              <div
                key={s.key}
                className="lpf-stack-seg"
                style={{ width: `${segPct.toFixed(2)}%`, background: s.hue }}
                onMouseMove={(e) => move(e, {
                  title: `@${handle} · ${s.key}`,
                  rows: [{ label: 'solved', value: s.value.toLocaleString(), color: s.hue }],
                })}
                onMouseLeave={clear}
              />
            );
          })}
        </div>
      </div>
      <div className="lpf-stack-legend">
        {row.segs.map((s) => (
          <span key={s.key} className="lpf-stack-leg">
            <span className="lpf-stack-leg-dot" style={{ background: s.hue }} />{s.key} {s.value.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

// One stacked segmented bar per user (Easy/Med/Hard segments), proportional to
// the larger total so the two bars compare on a shared scale.
function StackedDifficulty({ a, b }) {
  const { ref, tip, move, clear } = useChartTip();
  const segsFor = (d) => DIFFS.map((k) => ({ key: k, value: num(d.submitStats?.[k]) ?? 0, hue: DIFF_HUES[k] }));
  const rowFor = (d) => ({ segs: segsFor(d), total: num(d.submitStats?.total) ?? segsFor(d).reduce((s, g) => s + g.value, 0) });
  const ra = rowFor(a);
  const rb = rowFor(b);
  const max = Math.max(1, ra.total, rb.total);
  return (
    <div className="lpf-stack" ref={ref}>
      <StackedRow row={ra} color={CMP_A} handle={a.username} max={max} move={move} clear={clear} />
      <StackedRow row={rb} color={CMP_B} handle={b.username} max={max} move={move} clear={clear} />
      <ChartTip tip={tip} />
    </div>
  );
}

// Beats percentile as concentric dual arcs per difficulty (A outer, B inner) —
// a radial comparison instead of another flat bar.
function BeatsGauges({ a, b }) {
  const { ref, tip, move, clear } = useChartTip();
  const R_OUT = 40;
  const R_IN = 30;
  const arc = (r, v) => {
    const C = 2 * Math.PI * r;
    const frac = v == null ? 0 : Math.min(1, Math.max(0, v / 100));
    return { dash: `${(frac * C).toFixed(1)} ${C.toFixed(1)}`, C };
  };
  return (
    <div className="lpf-beats" ref={ref}>
      {DIFFS.map((d) => {
        const av = num(a.beats?.[d]);
        const bv = num(b.beats?.[d]);
        const ao = arc(R_OUT, av);
        const bi = arc(R_IN, bv);
        return (
          <div
            key={d}
            className="lpf-beat-cell"
            onMouseMove={(e) => move(e, {
              title: `${d} percentile`,
              rows: [
                { label: `@${a.username}`, value: av == null ? '—' : `${av.toFixed(1)}%`, color: CMP_A },
                { label: `@${b.username}`, value: bv == null ? '—' : `${bv.toFixed(1)}%`, color: CMP_B },
              ],
            })}
            onMouseLeave={clear}
          >
            <svg viewBox="0 0 100 100" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${d} percentile: ${a.username} ${av ?? '—'}, ${b.username} ${bv ?? '—'}`}>
              <circle cx="50" cy="50" r={R_OUT} fill="none" stroke="var(--hover-box)" strokeWidth="6" />
              <circle cx="50" cy="50" r={R_IN} fill="none" stroke="var(--hover-box)" strokeWidth="6" />
              <circle cx="50" cy="50" r={R_OUT} fill="none" stroke={CMP_A} strokeWidth="6" strokeLinecap="round" strokeDasharray={ao.dash} transform="rotate(-90 50 50)" className="lpf-beat-arc" />
              <circle cx="50" cy="50" r={R_IN} fill="none" stroke={CMP_B} strokeWidth="6" strokeLinecap="round" strokeDasharray={bi.dash} transform="rotate(-90 50 50)" className="lpf-beat-arc" />
              <text x="50" y="47" textAnchor="middle" className="lpf-beat-a" fill={CMP_A}>{av == null ? '—' : `${av.toFixed(0)}`}</text>
              <text x="50" y="62" textAnchor="middle" className="lpf-beat-b" fill={CMP_B}>{bv == null ? '—' : `${bv.toFixed(0)}`}</text>
            </svg>
            <span className="lpf-beat-cap" style={{ color: DIFF_HUES[d] }}>{d}</span>
          </div>
        );
      })}
      <ChartTip tip={tip} />
    </div>
  );
}

// Dumbbell tag comparison: each tag is a track with two dots joined by a
// connector; the leading dot is enlarged and the row carries a leader marker.
function TagDumbbell({ rows, handleA, handleB }) {
  const { ref, tip, move, clear } = useChartTip();
  const [active, setActive] = useState(null);
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]));
  return (
    <div className="lpf-dumb" ref={ref}>
      {rows.map((r) => {
        const aPct = (r.a / max) * 100;
        const bPct = (r.b / max) * 100;
        const lo = Math.min(aPct, bPct);
        const hi = Math.max(aPct, bPct);
        const aLead = r.a >= r.b;
        const isActive = active === r.key;
        return (
          <div
            key={r.key}
            className={`lpf-dumb-row${isActive ? ' active' : ''}`}
            onMouseMove={(e) => {
              setActive(r.key);
              move(e, {
                title: r.label,
                rows: [
                  { label: `@${handleA}`, value: r.a.toLocaleString(), color: CMP_A },
                  { label: `@${handleB}`, value: r.b.toLocaleString(), color: CMP_B },
                ],
              });
            }}
            onMouseLeave={() => { setActive(null); clear(); }}
          >
            <span className="lpf-dumb-label" title={r.label}>{r.label}</span>
            <div className="lpf-dumb-track">
              <svg viewBox="0 0 100 12" width="100%" preserveAspectRatio="none" className="lpf-dumb-svg" aria-hidden="true">
                <line x1="0" y1="6" x2="100" y2="6" stroke="var(--hover-box)" strokeWidth="1.5" />
                <line x1={lo} y1="6" x2={hi} y2="6" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
                <circle cx={bPct} cy="6" r={isActive ? 5 : aLead ? 3.4 : 4.4} fill={CMP_B} className="lpf-dumb-dot" />
                <circle cx={aPct} cy="6" r={isActive ? 5 : aLead ? 4.4 : 3.4} fill={CMP_A} className="lpf-dumb-dot" />
              </svg>
            </div>
            <span className="lpf-dumb-vals">
              <span style={{ color: CMP_A }} className={aLead ? 'lpf-dumb-lead' : ''}>{r.a}</span>
              <span className="lpf-dumb-sep">/</span>
              <span style={{ color: CMP_B }} className={!aLead ? 'lpf-dumb-lead' : ''}>{r.b}</span>
            </span>
          </div>
        );
      })}
      <ChartTip tip={tip} />
    </div>
  );
}

// Interactive two-series rating timeline for compare mode. A vertical guide
// snaps to the nearest contest index and the tooltip reports both users' rating
// at that contest, so the timeline is no longer a static curve.
const CR_VB_W = 640;
const CR_VB_H = 230;
const CR_PAD_L = 44;
const CR_PAD_R = 16;
const CR_PAD_T = 16;
const CR_PAD_B = 26;

function smoothPath(pts, yMin = -Infinity, yMax = Infinity) {
  if (pts.length === 0) return '';
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx.toFixed(1)} ${p.cy.toFixed(1)}`).join(' ');
  const clampY = (v) => Math.max(yMin, Math.min(yMax, v));
  let d = `M ${pts[0].cx.toFixed(1)} ${pts[0].cy.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.cx + (p2.cx - p0.cx) / 6;
    const c1y = clampY(p1.cy + (p2.cy - p0.cy) / 6);
    const c2x = p2.cx - (p3.cx - p1.cx) / 6;
    const c2y = clampY(p2.cy - (p3.cy - p1.cy) / 6);
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.cx.toFixed(1)} ${p2.cy.toFixed(1)}`;
  }
  return d;
}

// `slots` is the aligned union: one entry per contest (same index = same
// contest for both users), each with { label, a: value|null, b: value|null }.
// Missing entries leave a gap in that user's line instead of shifting the
// curve, so the two series stay registered on the real contest axis.
function CompareRatingChart({ slots, handleA, handleB }) {
  const { ref, tip, move, clear } = useChartTip();
  const [hover, setHover] = useState(null);
  const uid = useId().replace(/[:]/g, '');

  const geo = useMemo(() => {
    const all = slots.flatMap((s) => [s.a, s.b]).filter((v) => v != null);
    if (all.length === 0) return null;
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (hi === lo) { hi += 50; lo -= 50; }
    const pad = (hi - lo) * 0.12;
    lo -= pad; hi += pad;
    const maxLen = slots.length;
    const plotW = CR_VB_W - CR_PAD_L - CR_PAD_R;
    const plotH = CR_VB_H - CR_PAD_T - CR_PAD_B;
    const x = (i) => CR_PAD_L + (maxLen <= 1 ? plotW / 2 : (i / (maxLen - 1)) * plotW);
    const y = (v) => CR_PAD_T + plotH - ((v - lo) / (hi - lo)) * plotH;
    const map = (side) => slots
      .map((s, i) => (s[side] == null ? null : { label: s.label, value: s[side], cx: x(i), cy: y(s[side]) }))
      .filter(Boolean);
    return {
      a: map('a'), b: map('b'), maxLen,
      aAt: slots.map((s, i) => (s.a == null ? null : { value: s.a, cx: x(i), cy: y(s.a) })),
      bAt: slots.map((s, i) => (s.b == null ? null : { value: s.b, cx: x(i), cy: y(s.b) })),
      labels: slots.map((s) => s.label),
      gridY: [0, 0.5, 1].map((f) => ({ yy: CR_PAD_T + plotH - f * plotH, val: Math.round(lo + f * (hi - lo)) })),
    };
  }, [slots]);

  if (!geo) return null;

  const handleMove = (e) => {
    const host = ref.current;
    if (!host || geo.maxLen === 0) return;
    const rect = host.getBoundingClientRect();
    if (rect.width === 0) return;
    const ux = ((e.clientX - rect.left) / rect.width) * CR_VB_W;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < geo.maxLen; i += 1) {
      const cx = CR_PAD_L + (geo.maxLen <= 1 ? 0 : (i / (geo.maxLen - 1)) * (CR_VB_W - CR_PAD_L - CR_PAD_R));
      const d = Math.abs(cx - ux);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    setHover(best);
    const pa = geo.aAt[best];
    const pb = geo.bAt[best];
    move(e, {
      title: geo.labels[best] || `Contest ${best + 1}`,
      rows: [
        { label: `@${handleA}`, value: pa ? Math.round(pa.value).toLocaleString() : 'did not participate', color: CMP_A },
        { label: `@${handleB}`, value: pb ? Math.round(pb.value).toLocaleString() : 'did not participate', color: CMP_B },
      ],
    });
  };

  const guideX = hover != null
    ? CR_PAD_L + (geo.maxLen <= 1 ? 0 : (hover / (geo.maxLen - 1)) * (CR_VB_W - CR_PAD_L - CR_PAD_R))
    : null;

  const renderSeries = (coords, color) => coords.length > 0 && (
    <path d={smoothPath(coords, CR_PAD_T, CR_VB_H - CR_PAD_B)} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" filter={`url(#crGlow-${uid})`} />
  );

  return (
    <div className="lpf-cmp-line" ref={ref}>
      <svg
        viewBox={`0 0 ${CR_VB_W} ${CR_VB_H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Rating over time for both profiles"
        onMouseMove={handleMove}
        onMouseLeave={() => { setHover(null); clear(); }}
      >
        <defs>
          <filter id={`crGlow-${uid}`} x="-10%" y="-30%" width="120%" height="160%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {geo.gridY.map((g, i) => (
          <g key={i}>
            <line x1={CR_PAD_L} y1={g.yy} x2={CR_VB_W - CR_PAD_R} y2={g.yy} stroke="var(--viz-line)" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="2 5" />
            <text x={CR_PAD_L - 8} y={g.yy + 3} textAnchor="end" className="chk-axis-label">{g.val}</text>
          </g>
        ))}
        {guideX != null && (
          <line x1={guideX} y1={CR_PAD_T} x2={guideX} y2={CR_VB_H - CR_PAD_B} stroke="var(--text-dim)" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 3" />
        )}
        {renderSeries(geo.a, CMP_A)}
        {renderSeries(geo.b, CMP_B)}
        {hover != null && geo.aAt[hover] && (
          <circle cx={geo.aAt[hover].cx} cy={geo.aAt[hover].cy} r="5" fill={CMP_A} stroke="var(--surface)" strokeWidth="2" />
        )}
        {hover != null && geo.bAt[hover] && (
          <circle cx={geo.bAt[hover].cx} cy={geo.bAt[hover].cy} r="5" fill={CMP_B} stroke="var(--surface)" strokeWidth="2" />
        )}
      </svg>
      <ChartTip tip={tip} />
    </div>
  );
}

function CompareView({ a, b }) {
  const ratingA = num(a.rating);
  const ratingB = num(b.rating);
  const tally = headToHeadTally(a, b);
  // Aligned rating timeline: one slot per contest in the sorted union, with each
  // user's rating at that contest or null if absent.
  const ratingSlots = unionContests(a, b).map((r) => ({
    label: r.title || r.key,
    a: r.a && typeof r.a.rating === 'number' ? r.a.rating : null,
    b: r.b && typeof r.b.rating === 'number' ? r.b.rating : null,
  }));
  const hasRatingData = ratingSlots.some((s) => s.a != null || s.b != null);
  const tagRows = tagCompareRows(a, b);

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
    <div className="lpf-result">
      <Scoreboard a={a} b={b} tally={tally} headline={headline} />

      <div className="lpf-cmp-ids">
        <CompareIdentity data={a} color={CMP_A} />
        <CompareIdentity data={b} color={CMP_B} />
      </div>

      {/* Uniform top-row analytics cards — every card equal size via the same
          grid track + align-items: stretch, no per-card width overrides. */}
      <div className="lpf-cmp-grid">
        <section className="lpf-card">
          <h3 className="lpf-panel-title"><BarChart3 size={14} /> Solved by difficulty</h3>
          <StackedDifficulty a={a} b={b} />
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><Target size={14} /> Beats percentile</h3>
          <BeatsGauges a={a} b={b} />
          <Legend items={[{ color: CMP_A, label: `@${a.username}` }, { color: CMP_B, label: `@${b.username}` }]} />
        </section>

        <section className="lpf-card">
          <h3 className="lpf-panel-title"><PieChart size={14} /> Solved split</h3>
          <div className="lpf-donuts">
            <div className="lpf-donut-cell">
              <div className="lpf-donut-head"><span className="lpf-donut-swatch" style={{ background: CMP_A }} /><span className="lpf-donut-name">@{a.username}</span></div>
              <Donut segments={solvedSegments(a.submitStats)} total={num(a.submitStats?.total)} caption="solved" ariaLabel={`Solved split for ${a.username}`} />
            </div>
            <div className="lpf-donut-cell">
              <div className="lpf-donut-head"><span className="lpf-donut-swatch" style={{ background: CMP_B }} /><span className="lpf-donut-name">@{b.username}</span></div>
              <Donut segments={solvedSegments(b.submitStats)} total={num(b.submitStats?.total)} caption="solved" ariaLabel={`Solved split for ${b.username}`} />
            </div>
          </div>
        </section>
      </div>

      <div className="lpf-grid">
        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><TrendingUp size={14} /> Rating over time</h3>
          {!hasRatingData
            ? <div className="chk-empty">No attended contests to plot yet.</div>
            : (
              <div className="lpf-chart">
                <CompareRatingChart slots={ratingSlots} handleA={a.username} handleB={b.username} />
                <Legend items={[{ color: CMP_A, label: `@${a.username}` }, { color: CMP_B, label: `@${b.username}` }]} />
              </div>
            )}
        </section>

        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><Tags size={14} /> Tags by solved</h3>
          {tagRows.length === 0
            ? <div className="chk-empty">No tag data on either side.</div>
            : <TagDumbbell rows={tagRows} handleA={a.username} handleB={b.username} />}
        </section>

        <section className="lpf-card lpf-card-wide">
          <h3 className="lpf-panel-title"><Trophy size={14} /> Contest-by-contest</h3>
          <ContestComparisonTable a={a} b={b} />
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
    <div className="lpf-wrap">
      <div className="lpf-modes" role="tablist" aria-label="Lookup mode">
        <button
          role="tab"
          aria-selected={mode === 'single'}
          className={`lpf-mode${mode === 'single' ? ' active' : ''}`}
          onClick={() => setMode('single')}
        >
          <User size={14} /> Single
        </button>
        <button
          role="tab"
          aria-selected={mode === 'compare'}
          className={`lpf-mode${mode === 'compare' ? ' active' : ''}`}
          onClick={() => setMode('compare')}
        >
          <Users size={14} /> Compare
        </button>
      </div>

      {mode === 'single' ? (
        <>
          <form className="lpf-search" onSubmit={submitSingle}>
            <div className="lpf-input-box">
              <Search size={15} className="lpf-input-icon" />
              <input
                className="lpf-input"
                type="text"
                placeholder="LeetCode username"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <button className="lpf-btn" type="submit" disabled={!input.trim() || single.isLoading}>
              {single.isLoading ? <Loader2 size={15} className="lpf-spin" /> : <Search size={15} />}
              Look up
            </button>
          </form>

          {singleFallback && (
            <div className="lpf-note">
              <Info size={14} />
              {single.data?.notFound
                ? <>No LeetCode user <strong>{handle}</strong> found — showing a sample profile below.</>
                : <>Live lookup needs the <code>lc-user</code> function deployed — showing a sample profile below.</>}
            </div>
          )}

          {(single.isLoading && !singleSample)
            ? <LoadingSkeleton label="Fetching contest history…" />
            : <ProfileBody data={singleProfile} />}
        </>
      ) : (
        <>
          <form className="lpf-search lpf-search-compare" onSubmit={submitCompare}>
            <div className="lpf-input-box">
              <Search size={15} className="lpf-input-icon" />
              <input
                className="lpf-input"
                type="text"
                placeholder="Ex: hy_34"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <span className="lpf-vs">vs</span>
            <div className="lpf-input-box">
              <Search size={15} className="lpf-input-icon" />
              <input
                className="lpf-input"
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
              className="lpf-btn"
              type="submit"
              disabled={(!inputA.trim() && !inputB.trim()) || cmpLoading}
            >
              {cmpLoading ? <Loader2 size={15} className="lpf-spin" /> : <Swords size={15} />}
              Compare
            </button>
          </form>

          {oneEmpty && (
            <div className="lpf-note">
              <Info size={14} />
              Enter a handle on both sides for a full head-to-head — the empty side shows a sample for now.
            </div>
          )}

          {(failA || failB) && (
            <div className="lpf-note">
              <Info size={14} />
              {failA && failB
                ? <>Neither handle resolved — showing sample profiles for both sides.</>
                : failA
                  ? <>No data for <strong>{handleA}</strong> — showing a sample on the left.</>
                  : <>No data for <strong>{handleB}</strong> — showing a sample on the right.</>}
            </div>
          )}

          {cmpLoading
            ? <LoadingSkeleton label="Fetching both contest histories…" />
            : bothEmpty
              ? <CompareView a={SAMPLE} b={SAMPLE_B} />
              : <CompareView a={profileA} b={profileB} />}
        </>
      )}
    </div>
  );
}

// Animated placeholder grid mirroring the dashboard layout while data loads.
function LoadingSkeleton({ label }) {
  return (
    <div className="lpf-skeleton" aria-busy="true" aria-label={label}>
      <div className="lpf-skel-stats">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="lpf-skel-tile" />)}
      </div>
      <div className="lpf-skel-grid">
        <div className="lpf-skel-card lpf-skel-wide" />
        <div className="lpf-skel-card" />
        <div className="lpf-skel-card" />
        <div className="lpf-skel-card" />
        <div className="lpf-skel-card" />
      </div>
      <div className="lpf-skel-foot"><Loader2 size={16} className="lpf-spin" /> {label}</div>
    </div>
  );
}
