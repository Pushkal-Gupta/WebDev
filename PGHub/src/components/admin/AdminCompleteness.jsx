import React, { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Shield, Check, X, Search, ArrowRight, FileText, ListChecks, Layers } from 'lucide-react';
import { useProfile, useProblemCompleteness } from '../../lib/queries';
import './Admin.css';
import './AdminCompleteness.css';

const FIELD_META = [
  { key: 'has_description',  label: 'Desc',  missingKey: 'description' },
  { key: 'has_hints',        label: 'Hints', missingKey: 'hints' },
  { key: 'has_test_cases',   label: 'Tests', missingKey: 'test_cases' },
  { key: 'has_50plus_cases', label: '50+',   missingKey: '50plus_cases' },
  { key: 'has_solutions',    label: 'Sol.',  missingKey: 'solutions' },
  { key: 'has_viz',          label: 'Viz',   missingKey: 'viz' },
];

const FILTER_OPTIONS = [
  { value: 'any',          label: 'Any missing field' },
  { value: 'description',  label: 'Missing description' },
  { value: 'hints',        label: 'Missing hints' },
  { value: 'test_cases',   label: 'Missing test cases' },
  { value: '50plus_cases', label: 'Fewer than 50 test cases' },
  { value: 'solutions',    label: 'Missing solutions' },
  { value: 'viz',          label: 'Missing visualization' },
  { value: 'all',          label: 'All problems' },
];

function tierFor(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  if (pct >= 20) return 'low';
  return 'critical';
}

function PctPill({ pct }) {
  return <span className={`comp-pct comp-pct-${tierFor(pct)}`}>{pct}%</span>;
}

function FieldDot({ ok, label }) {
  return (
    <span
      className={`comp-dot ${ok ? 'comp-dot-ok' : 'comp-dot-missing'}`}
      title={`${label}: ${ok ? 'present' : 'missing'}`}
    >
      {ok ? <Check size={11} /> : <X size={11} />}
    </span>
  );
}

export default function AdminCompleteness({ session }) {
  const userId = session?.user?.id;
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: rows = [], isLoading } = useProblemCompleteness();
  const [filter, setFilter] = useState('any');
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    const arr = [...rows].sort((a, b) => {
      if (a.completeness_pct !== b.completeness_pct) return a.completeness_pct - b.completeness_pct;
      return (a.name || '').localeCompare(b.name || '');
    });
    return arr;
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((r) => {
      if (q && !(r.name || '').toLowerCase().includes(q)) return false;
      if (filter === 'all') return true;
      if (filter === 'any') return (r.missing_fields || []).length > 0;
      return (r.missing_fields || []).includes(filter);
    });
  }, [sorted, search, filter]);

  const summary = useMemo(() => {
    if (!rows.length) return { total: 0, avg: 0, tiers: { t1: 0, t2: 0, t3: 0, t4: 0 } };
    const total = rows.length;
    const avg = Math.round(rows.reduce((s, r) => s + (r.completeness_pct || 0), 0) / total);
    const tiers = { t1: 0, t2: 0, t3: 0, t4: 0 };
    sorted.forEach((r, i) => {
      const rank = i + 1;
      if (rank <= 200)        tiers.t1++;
      else if (rank <= 500)   tiers.t2++;
      else if (rank <= 1000)  tiers.t3++;
      else                    tiers.t4++;
    });
    return { total, avg, tiers };
  }, [rows, sorted]);

  if (!userId) return <Navigate to="/" replace />;
  if (profileLoading) {
    return (
      <div className="adm-container">
        <div className="adm-skel">Loading&hellip;</div>
      </div>
    );
  }
  if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) {
    return (
      <div className="adm-container">
        <div className="adm-denied">
          <Shield size={28} className="adm-denied-icon" />
          <h1 className="adm-denied-title">Admin only</h1>
          <p className="adm-denied-sub">This audit surface is restricted to admin and editor roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-container">
      <header className="adm-header">
        <div>
          <h1 className="adm-title"><Shield size={18} /> Problem completeness</h1>
          <p className="adm-sub">
            Per-problem audit across six editorial fields. Worst-ranked first so backfill effort lands where it hurts most.
          </p>
        </div>
        <Link to="/admin" className="adm-btn">Back to admin</Link>
      </header>

      <section className="comp-summary">
        <div className="comp-summary-tile">
          <div className="adm-stat-head"><FileText size={12} className="adm-stat-icon" /><span className="adm-stat-label">Total</span></div>
          <div className="adm-stat-value">{summary.total.toLocaleString()}</div>
        </div>
        <div className="comp-summary-tile">
          <div className="adm-stat-head"><ListChecks size={12} className="adm-stat-icon" /><span className="adm-stat-label">Avg completeness</span></div>
          <div className="adm-stat-value">{summary.avg}%</div>
        </div>
        <div className="comp-summary-tile">
          <div className="adm-stat-head"><Layers size={12} className="adm-stat-icon" /><span className="adm-stat-label">Tier breakdown</span></div>
          <div className="comp-tier-list">
            <span><b>Top 200</b> {summary.tiers.t1}</span>
            <span><b>201&ndash;500</b> {summary.tiers.t2}</span>
            <span><b>501&ndash;1000</b> {summary.tiers.t3}</span>
            <span><b>1000+</b> {summary.tiers.t4}</span>
          </div>
        </div>
      </section>

      <section className="comp-controls">
        <label className="comp-search">
          <Search size={13} />
          <input
            type="text"
            placeholder="Search problem name&hellip;"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="comp-filter">
          <span className="comp-filter-label">Show</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <span className="comp-result-count">{filtered.length.toLocaleString()} of {rows.length.toLocaleString()}</span>
      </section>

      {isLoading ? (
        <div className="adm-skel">Loading audit&hellip;</div>
      ) : (
        <section className="adm-card comp-table-wrap">
          <table className="adm-table comp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Topic</th>
                {FIELD_META.map((f) => (
                  <th key={f.key} className="comp-col-field" title={f.label}>{f.label}</th>
                ))}
                <th className="comp-col-pct">Complete</th>
                <th className="comp-col-open"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/category/${encodeURIComponent(r.topic_id || '')}/${encodeURIComponent(r.id)}`}>
                      {r.name}
                    </Link>
                  </td>
                  <td>
                    <span className="comp-topic-pill">{r.topic_id || '—'}</span>
                  </td>
                  {FIELD_META.map((f) => (
                    <td key={f.key} className="comp-col-field">
                      <FieldDot ok={!!r[f.key]} label={f.label} />
                    </td>
                  ))}
                  <td className="comp-col-pct"><PctPill pct={r.completeness_pct ?? 0} /></td>
                  <td className="comp-col-open">
                    <Link
                      className="comp-open-btn"
                      to={`/category/${encodeURIComponent(r.topic_id || '')}/${encodeURIComponent(r.id)}`}
                    >
                      Open <ArrowRight size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <p className="adm-empty">Showing first 500 of {filtered.length.toLocaleString()}. Refine the filter or search to drill in.</p>
          )}
          {filtered.length === 0 && (
            <p className="adm-empty">No problems match the current filter.</p>
          )}
        </section>
      )}
    </div>
  );
}
