import './LcProblemsBrowser.css';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown, Activity, X, Check, AlertTriangle, RotateCw } from 'lucide-react';
import { useLcQuestions } from '../../lib/queries';
import Breadcrumb from '../common/Breadcrumb';

const CRUMBS = [
  { label: 'Compete', to: '/compete' },
  { label: 'LeetCode', to: '/compete/leetcode' },
  { label: 'Problems' },
];

// Themed sort dropdown — replaces the native <select> (whose OS popup clashed
// with the app theme). Renders a proper menu using theme tokens.
function SortDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className={`lcp-dd ${open ? 'open' : ''}`} ref={ref}>
      <button type="button" className="lcp-dd-btn" onClick={() => setOpen((o) => !o)}>
        <ArrowUpDown size={14} />
        <span className="lcp-dd-val">{selected?.label}</span>
        <ChevronDown size={13} className={`lcp-dd-chev ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="lcp-dd-menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`lcp-dd-item ${o.value === value ? 'active' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={13} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 50;
const DIFFS = ['All', 'Easy', 'Medium', 'Hard'];
const SORTS = [
  { value: 'contest-desc', label: 'Latest contest' },
  { value: 'contest-asc', label: 'Oldest contest' },
  { value: 'rating-desc', label: 'Rating high to low' },
  { value: 'rating-asc', label: 'Rating low to high' },
  { value: 'title-az', label: 'Title A to Z' },
];

function diffClass(d) {
  if (d === 'easy') return 'lcp-pill-easy';
  if (d === 'medium') return 'lcp-pill-medium';
  if (d === 'hard') return 'lcp-pill-hard';
  return 'lcp-pill-medium';
}
function diffVar(d) {
  if (d === 'easy') return 'var(--easy)';
  if (d === 'hard') return 'var(--hard)';
  return 'var(--medium)';
}

function contestNum(slug) {
  const m = String(slug || '').match(/(\d+)\s*$/);
  return m ? parseInt(m[1], 10) : -1;
}

function estSolveRate(rating) {
  const raw = 1.05 - (rating - 1200) / 2600;
  return Math.min(0.99, Math.max(0.02, raw));
}

// Refined analytics chart: one column per recent contest, height = average problem
// rating, accent-gradient tint. Hover reveals a tooltip; click filters the table.
function RatingChart({ rows, activeSlug, onPick }) {
  const groups = useMemo(() => {
    const bySlug = new Map();
    for (const q of rows) {
      if (typeof q.rating !== 'number' || !q.contest_slug) continue;
      if (!bySlug.has(q.contest_slug)) {
        bySlug.set(q.contest_slug, {
          slug: q.contest_slug,
          label: q.contest_label || q.contest_slug,
          num: contestNum(q.contest_slug),
          ratings: [],
        });
      }
      bySlug.get(q.contest_slug).ratings.push(q.rating);
    }
    const list = [...bySlug.values()].map((g) => {
      const sum = g.ratings.reduce((a, b) => a + b, 0);
      return {
        ...g,
        count: g.ratings.length,
        avg: Math.round(sum / g.ratings.length),
        max: Math.round(Math.max(...g.ratings)),
        min: Math.round(Math.min(...g.ratings)),
      };
    });
    return list.sort((a, b) => b.num - a.num).slice(0, 18).reverse();
  }, [rows]);

  const [hover, setHover] = useState(null);

  const maxRating = useMemo(() => {
    let m = 0;
    for (const g of groups) m = Math.max(m, g.avg);
    return Math.ceil((m || 2000) / 400) * 400;
  }, [groups]);

  if (!groups.length) return null;

  const W = 1000;
  const H = 280;
  const padL = 46;
  const padR = 14;
  const padT = 16;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const ticks = [];
  for (let r = 0; r <= maxRating; r += 400) ticks.push(r);

  const slotW = plotW / groups.length;
  const barW = Math.min(34, slotW * 0.6);
  const yOf = (rating) => padT + plotH - (rating / maxRating) * plotH;
  const xOf = (i) => padL + i * slotW + slotW / 2;

  const labelEvery = groups.length > 12 ? 2 : 1;
  const hg = hover != null ? groups[hover] : null;
  const hx = hover != null ? xOf(hover) : 0;
  const hy = hg ? yOf(hg.avg) : 0;

  return (
    <div className="lcp-chart">
      <div className="lcp-chart-head">
        <span className="lcp-chart-title"><Activity size={15} /> Average difficulty by contest</span>
        <span className="lcp-chart-hint">Click a column to filter the table</span>
      </div>
      <div className="lcp-chart-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          className="lcp-chart-svg"
          role="img"
          aria-label="Average problem rating across recent contests"
        >
          <defs>
            <linearGradient id="lcpBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.42" />
            </linearGradient>
          </defs>

          {ticks.map((r) => (
            <g key={r}>
              <line x1={padL} y1={yOf(r)} x2={W - padR} y2={yOf(r)} className="lcp-grid" />
              <text x={padL - 8} y={yOf(r) + 3.5} textAnchor="end" className="lcp-axis-label">{r}</text>
            </g>
          ))}
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} className="lcp-axis-base" />

          {groups.map((g, i) => {
            const x = xOf(i) - barW / 2;
            const y = yOf(g.avg);
            const h = padT + plotH - y;
            const isActive = g.slug === activeSlug;
            const isHover = hover === i;
            const dim = activeSlug && !isActive;
            return (
              <g
                key={g.slug}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover((h2) => (h2 === i ? null : h2))}
                onClick={() => onPick(g.slug)}
                className="lcp-bar-g"
              >
                <rect x={padL + i * slotW} y={padT} width={slotW} height={plotH} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(2, h)}
                  rx={3}
                  className={`lcp-bar${isActive ? ' lcp-bar-active' : ''}${isHover ? ' lcp-bar-hover' : ''}${dim ? ' lcp-bar-dim' : ''}`}
                />
                {(i % labelEvery === 0 || isActive) && (
                  <text x={xOf(i)} y={H - padB + 18} textAnchor="middle" className={`lcp-axis-x${isActive ? ' lcp-axis-x-active' : ''}`}>
                    {g.num >= 0 ? g.num : g.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hg && (
          <div
            className="lcp-tooltip"
            style={{
              left: `${(hx / W) * 100}%`,
              top: `${(hy / H) * 100}%`,
            }}
          >
            <div className="lcp-tip-title">{hg.label}</div>
            <div className="lcp-tip-row"><span>Problems</span><b>{hg.count}</b></div>
            <div className="lcp-tip-row"><span>Avg rating</span><b>{hg.avg}</b></div>
            <div className="lcp-tip-row"><span>Range</span><b>{hg.min}–{hg.max}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LcProblemsBrowser() {
  const { data, isLoading, isError, refetch } = useLcQuestions();
  const all = useMemo(() => data || [], [data]);

  const [query, setQuery] = useState('');
  const [diff, setDiff] = useState('All');
  const [sort, setSort] = useState('contest-desc');
  const [page, setPage] = useState(1);
  const [contestPick, setContestPick] = useState(null);

  const pickedLabel = useMemo(() => {
    if (!contestPick) return null;
    const row = all.find((r) => r.contest_slug === contestPick);
    return row ? (row.contest_label || row.contest_slug) : contestPick;
  }, [all, contestPick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const wantDiff = diff.toLowerCase();
    let list = all.filter((row) => {
      if (q && !String(row.title || '').toLowerCase().includes(q)) return false;
      if (diff !== 'All' && row.difficulty !== wantDiff) return false;
      if (contestPick && row.contest_slug !== contestPick) return false;
      return true;
    });
    list = [...list];
    if (sort === 'contest-desc') list.sort((a, b) => contestNum(b.contest_slug) - contestNum(a.contest_slug) || (b.rating || 0) - (a.rating || 0));
    else if (sort === 'contest-asc') list.sort((a, b) => contestNum(a.contest_slug) - contestNum(b.contest_slug) || (a.rating || 0) - (b.rating || 0));
    else if (sort === 'rating-desc') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'rating-asc') list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    else if (sort === 'title-az') list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    return list;
  }, [all, query, diff, sort, contestPick]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  function reset(setter) {
    return (v) => { setter(v); setPage(1); };
  }

  function pickContest(slug) {
    setContestPick((cur) => (cur === slug ? null : slug));
    setPage(1);
  }

  if (isError) {
    return (
      <div className="lcp-container">
        <Breadcrumb items={CRUMBS} />
        <header className="lcp-header">
          <h1 className="lcp-title">LeetCode problems</h1>
          <p className="lcp-sub">Every rated weekly and biweekly contest problem, searchable by name and filterable straight from the chart.</p>
        </header>
        <div
          className="lcp-empty"
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '3rem 1.5rem',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            background: 'var(--surface)',
          }}
        >
          <AlertTriangle size={26} style={{ color: 'var(--hard)' }} aria-hidden />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Couldn&apos;t load problems</span>
          <span style={{ color: 'var(--text-dim)', textAlign: 'center', maxWidth: '38ch' }}>
            Something went wrong reaching the catalog. Check your connection and try again.
          </span>
          <button
            type="button"
            className="lcp-page-btn"
            onClick={() => refetch()}
            style={{ marginTop: '0.25rem' }}
          >
            <RotateCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lcp-container">
      <Breadcrumb items={CRUMBS} />
      <header className="lcp-header">
        <h1 className="lcp-title">
          LeetCode problems
          <span className="lcp-count-chip">{all.length.toLocaleString()} rated problems</span>
        </h1>
        <p className="lcp-sub">Every rated weekly and biweekly contest problem, searchable by name and filterable straight from the chart.</p>
      </header>

      <RatingChart rows={all} activeSlug={contestPick} onPick={pickContest} />

      <div className="lcp-controls">
        <div className="lcp-search">
          <Search size={15} className="lcp-search-icon" />
          <input
            type="text"
            placeholder="Search by title"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
          />
        </div>
        <div className="lcp-chips">
          {DIFFS.map((d) => (
            <button
              key={d}
              className={`lcp-chip ${diff === d ? 'lcp-chip-on' : ''}`}
              onClick={() => reset(setDiff)(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <SortDropdown value={sort} options={SORTS} onChange={(v) => reset(setSort)(v)} />
      </div>

      {contestPick && (
        <div className="lcp-activebar">
          <span className="lcp-active-chip">
            {pickedLabel}
            <button className="lcp-active-x" onClick={() => pickContest(contestPick)} aria-label="Clear contest filter">
              <X size={13} />
            </button>
          </span>
          <span className="lcp-active-note">Filtering to one contest — clear to see all problems.</span>
        </div>
      )}

      <div className="lcp-table-wrap">
        <table className="lcp-table">
          <thead>
            <tr>
              <th className="lcp-col-title">Title</th>
              <th className="lcp-col-contest">Contest</th>
              <th className="lcp-col-rating">Rating</th>
              <th className="lcp-col-solve">Solve rate <span className="lcp-est">est.</span></th>
              <th className="lcp-col-diff">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="lcp-empty">Loading problems…</td></tr>
            )}
            {!isLoading && pageRows.length === 0 && (
              <tr><td colSpan={5} className="lcp-empty">No problems match these filters.</td></tr>
            )}
            {pageRows.map((row) => {
              const rate = estSolveRate(row.rating || 1500);
              return (
                <tr key={row.title_slug}>
                  <td className="lcp-col-title">
                    <Link className="lcp-link" to={`/compete/leetcode/problems/${row.title_slug}`}>
                      {row.title}
                    </Link>
                  </td>
                  <td className="lcp-col-contest">{row.contest_label || row.contest_slug}</td>
                  <td className="lcp-col-rating"><span className="lcp-rating">{Math.round(row.rating)}</span></td>
                  <td className="lcp-col-solve">
                    <div className="lcp-solve">
                      <div className="lcp-solve-track">
                        <div
                          className="lcp-solve-fill"
                          style={{ width: `${(rate * 100).toFixed(0)}%`, background: diffVar(row.difficulty) }}
                        />
                      </div>
                      <span className="lcp-solve-pct">{(rate * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="lcp-col-diff">
                    <span className={`lcp-pill ${diffClass(row.difficulty)}`}>{row.difficulty}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <footer className="lcp-pager">
        <button
          className="lcp-page-btn"
          disabled={safePage <= 1}
          onClick={() => setPage(Math.max(1, safePage - 1))}
        >
          <ChevronLeft size={15} /> Prev
        </button>
        <div className="lcp-page-info">
          <span className="lcp-page-now">Page {safePage} of {totalPages.toLocaleString()}</span>
          <span className="lcp-page-sep">·</span>
          <span className="lcp-page-total">{filtered.length.toLocaleString()} problems</span>
        </div>
        <button
          className="lcp-page-btn"
          disabled={safePage >= totalPages}
          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
        >
          Next <ChevronRight size={15} />
        </button>
      </footer>
    </div>
  );
}
