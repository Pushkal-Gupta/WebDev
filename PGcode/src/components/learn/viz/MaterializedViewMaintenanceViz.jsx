import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, Plus, Pencil, Trash2,
  Database, Layers, RefreshCw, Zap, AlertTriangle, Table,
} from 'lucide-react';
import './MaterializedViewMaintenanceViz.css';

// Materialized view maintenance — a precomputed SUM(amount) per region over a
// base "sales" table. Mutating the base makes the view stale; refreshing
// recomputes it two ways:
//
//   full        rescan EVERY base row and rebuild every group from scratch.
//               Cost is O(rows), independent of how much changed.
//   incremental apply ONLY the delta of the last change to the affected group.
//               Cost is O(changed rows) — cheap when one row moved.
//
// Deferred refresh leaves the view STALE: it still shows the old totals until a
// refresh runs. The staleness indicator counts un-applied changes.
//
// Interactive: insert / update / delete base rows (deterministic values),
// toggle full vs incremental, and run a refresh to watch the view recompute —
// full lights every group, incremental lights only the touched one.

const REGIONS = ['North', 'South', 'East'];
// deterministic insert amounts cycled per insert; no Math.random
const INSERT_AMOUNTS = [40, 25, 60, 35, 50, 20, 45, 30];

let ROW_SEQ = 0;

function seedRows() {
  ROW_SEQ = 0;
  return [
    { id: ++ROW_SEQ, region: 'North', amount: 30 },
    { id: ++ROW_SEQ, region: 'South', amount: 50 },
    { id: ++ROW_SEQ, region: 'North', amount: 20 },
    { id: ++ROW_SEQ, region: 'East', amount: 40 },
  ];
}

function computeView(rows) {
  const m = Object.fromEntries(REGIONS.map((r) => [r, 0]));
  rows.forEach((r) => { m[r.region] += r.amount; });
  return m;
}

export default function MaterializedViewMaintenanceViz() {
  const [mode, setMode] = useState('incremental'); // 'full' | 'incremental'
  const [rows, setRows] = useState(() => seedRows());
  const [view, setView] = useState(() => computeView(seedRows()));
  const [pending, setPending] = useState(0); // un-applied changes (staleness)
  const [touched, setTouched] = useState([]); // regions changed since last refresh
  const [scanned, setScanned] = useState(0); // rows the last refresh read
  const [lastDelta, setLastDelta] = useState(null); // { region, delta }
  const [highlight, setHighlight] = useState([]); // groups lit during refresh anim
  const [note, setNote] = useState('Insert, update, or delete base rows — the view goes stale. Then refresh: full rescans every row, incremental applies just the delta.');
  const [tone, setTone] = useState('init');
  const [insertIdx, setInsertIdx] = useState(0);
  const [refreshes, setRefreshes] = useState({ full: 0, incremental: 0 });

  const flashTimer = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => () => { if (flashTimer.current) clearTimeout(flashTimer.current); }, []);

  const liveView = useMemo(() => computeView(rows), [rows]);
  const stale = pending > 0;

  const markTouched = (region) => {
    setTouched((t) => (t.includes(region) ? t : [...t, region]));
    setPending((p) => p + 1);
    setTone('warn');
  };

  const doInsert = () => {
    const region = REGIONS[insertIdx % REGIONS.length];
    const amount = INSERT_AMOUNTS[insertIdx % INSERT_AMOUNTS.length];
    const id = ++ROW_SEQ;
    setRows((r) => [...r, { id, region, amount }]);
    setInsertIdx((i) => i + 1);
    setLastDelta({ region, delta: amount });
    markTouched(region);
    setNote(`Inserted row #${id}: ${region} +${amount}. The base table changed, so the materialized view's SUM for ${region} is now stale by +${amount}. Nothing recomputed yet — that waits for a refresh.`);
  };

  const doUpdate = () => {
    if (rows.length === 0) return;
    // bump the amount of the first row deterministically by +15
    const target = rows[0];
    const inc = 15;
    setRows((r) => r.map((row, i) => (i === 0 ? { ...row, amount: row.amount + inc } : row)));
    setLastDelta({ region: target.region, delta: inc });
    markTouched(target.region);
    setNote(`Updated row #${target.id}: ${target.region} amount ${target.amount} → ${target.amount + inc} (delta +${inc}). Only the ${target.region} group's total is affected — that is exactly what an incremental refresh would patch.`);
  };

  const doDelete = () => {
    if (rows.length === 0) return;
    const target = rows[rows.length - 1];
    setRows((r) => r.slice(0, -1));
    setLastDelta({ region: target.region, delta: -target.amount });
    markTouched(target.region);
    setNote(`Deleted row #${target.id}: ${target.region} -${target.amount}. The view's ${target.region} total is now stale by -${target.amount} until the next refresh applies the delta.`);
  };

  const doRefresh = () => {
    const m = modeRef.current;
    const fresh = computeView(rows);
    if (m === 'full') {
      setScanned(rows.length);
      setHighlight([...REGIONS]);
      setNote(`Full refresh: rescan all ${rows.length} base rows and rebuild every group from scratch. Cost is O(rows) no matter how little changed — here it reread ${rows.length} rows to refresh ${REGIONS.length} groups.`);
    } else {
      const changed = touched.length ? touched : [];
      setScanned(changed.length); // incremental touches only changed groups' delta
      setHighlight(changed.length ? changed : []);
      const list = changed.length ? changed.join(', ') : 'no';
      setNote(`Incremental refresh: apply only the buffered deltas to the ${list} group${changed.length === 1 ? '' : 's'}. Untouched groups are left alone — cost is O(changed) = ${changed.length} group${changed.length === 1 ? '' : 's'}, not the full table.`);
    }
    setView(fresh);
    setPending(0);
    setTouched([]);
    setTone('ok');
    setRefreshes((rf) => ({ ...rf, [m]: rf[m] + 1 }));
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setHighlight([]), 1100);
  };

  const reset = () => {
    if (flashTimer.current) { clearTimeout(flashTimer.current); flashTimer.current = null; }
    const r = seedRows();
    setRows(r);
    setView(computeView(r));
    setPending(0);
    setTouched([]);
    setScanned(0);
    setLastDelta(null);
    setHighlight([]);
    setInsertIdx(0);
    setRefreshes({ full: 0, incremental: 0 });
    setNote('Insert, update, or delete base rows — the view goes stale. Then refresh: full rescans every row, incremental applies just the delta.');
    setTone('init');
  };

  // ---- SVG geometry ----
  const W = 940;
  const H = 380;
  const baseX = 40;
  const baseW = 340;
  const baseTop = 70;
  const rowH = 26;
  const maxVisibleRows = 9;
  const visibleRows = rows.slice(0, maxVisibleRows);
  const extraRows = rows.length - visibleRows.length;

  const viewX = 560;
  const viewW = 340;
  const groupTop = 90;
  const groupH = 60;
  const groupGap = 14;

  const narrTone = tone === 'warn' ? 'is-warn' : tone === 'ok' ? 'is-ok' : '';

  return (
    <div className="mvm">
      <div className="mvm-head">
        <h3 className="mvm-title">Materialized view maintenance — full vs incremental refresh</h3>
        <p className="mvm-sub">
          A view precomputes SUM(amount) per region. Mutate the base table and the view goes stale.
          Refresh it two ways: full rescans every row; incremental applies only the delta to the touched group.
        </p>
      </div>

      <div className="mvm-controls">
        <div className="mvm-modes" role="group" aria-label="Refresh mode">
          <button
            type="button"
            className={`mvm-mode ${mode === 'full' ? 'is-on' : ''}`}
            onClick={() => setMode('full')}
            aria-pressed={mode === 'full'}
          >
            <RefreshCw size={12} /> full refresh
          </button>
          <button
            type="button"
            className={`mvm-mode ${mode === 'incremental' ? 'is-on' : ''}`}
            onClick={() => setMode('incremental')}
            aria-pressed={mode === 'incremental'}
          >
            <Zap size={12} /> incremental
          </button>
        </div>

        <span className="mvm-spacer" aria-hidden="true" />

        <div className="mvm-buttons">
          <button type="button" className="mvm-btn" onClick={doInsert}><Plus size={14} /> Insert</button>
          <button type="button" className="mvm-btn" onClick={doUpdate} disabled={rows.length === 0}><Pencil size={14} /> Update</button>
          <button type="button" className="mvm-btn" onClick={doDelete} disabled={rows.length === 0}><Trash2 size={14} /> Delete</button>
          <button type="button" className="mvm-btn mvm-btn-primary" onClick={doRefresh} disabled={!stale}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button type="button" className="mvm-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>

      <div className="mvm-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mvm-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mvm-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mvm-ah" />
            </marker>
          </defs>

          {/* base table */}
          <g transform={`translate(${baseX - 4}, ${baseTop - 34})`}>
            <Database width={16} height={16} className="mvm-ic-head" />
          </g>
          <text className="mvm-panel-label" x={baseX + 20} y={baseTop - 22} textAnchor="start">base table: sales ({rows.length} rows)</text>
          <rect className="mvm-panel" x={baseX} y={baseTop - 12} width={baseW} height={maxVisibleRows * rowH + 36} rx={9} />
          {/* header row */}
          <text className="mvm-col-h" x={baseX + 16} y={baseTop + 8} textAnchor="start">id</text>
          <text className="mvm-col-h" x={baseX + 70} y={baseTop + 8} textAnchor="start">region</text>
          <text className="mvm-col-h" x={baseX + baseW - 20} y={baseTop + 8} textAnchor="end">amount</text>
          {visibleRows.map((r, i) => {
            const ry = baseTop + 22 + i * rowH;
            const lit = highlight.includes(r.region) && mode === 'full';
            const incLit = highlight.includes(r.region) && mode !== 'full' && lastDelta && lastDelta.region === r.region;
            return (
              <g key={r.id}>
                <rect className={`mvm-row ${lit ? 'is-scan' : ''} ${incLit ? 'is-delta' : ''}`} x={baseX + 8} y={ry - 14} width={baseW - 16} height={rowH - 4} rx={4} />
                <text className="mvm-cell" x={baseX + 16} y={ry + 2} textAnchor="start">#{r.id}</text>
                <text className="mvm-cell" x={baseX + 70} y={ry + 2} textAnchor="start">{r.region}</text>
                <text className="mvm-cell mvm-cell-num" x={baseX + baseW - 20} y={ry + 2} textAnchor="end">{r.amount}</text>
              </g>
            );
          })}
          {extraRows > 0 && (
            <text className="mvm-more" x={baseX + baseW / 2} y={baseTop + 22 + maxVisibleRows * rowH - 4} textAnchor="middle">+{extraRows} more rows</text>
          )}

          {/* refresh arrow */}
          <g>
            <line className={`mvm-flow ${stale ? 'is-stale' : 'is-fresh'}`} x1={baseX + baseW + 8} y1={H / 2 - 10} x2={viewX - 8} y2={H / 2 - 10} markerEnd="url(#mvm-arr)" />
            <text className={`mvm-flow-label ${mode === 'full' ? 'is-full' : 'is-inc'}`} x={(baseX + baseW + viewX) / 2} y={H / 2 - 20} textAnchor="middle">
              {mode === 'full' ? 'full: rescan all' : 'incremental: apply delta'}
            </text>
            {stale && (
              <text className="mvm-flow-stale" x={(baseX + baseW + viewX) / 2} y={H / 2 + 6} textAnchor="middle">view is stale ({pending} change{pending === 1 ? '' : 's'})</text>
            )}
          </g>

          {/* materialized view */}
          <g transform={`translate(${viewX - 4}, ${baseTop - 34})`}>
            <Layers width={16} height={16} className="mvm-ic-head is-view" />
          </g>
          <text className="mvm-panel-label is-view" x={viewX + 20} y={baseTop - 22} textAnchor="start">materialized view: total per region</text>
          <rect className={`mvm-panel is-view ${stale ? 'is-stale' : ''}`} x={viewX} y={baseTop - 12} width={viewW} height={REGIONS.length * (groupH + groupGap) + 6} rx={9} />
          {REGIONS.map((region, i) => {
            const gy = groupTop + i * (groupH + groupGap);
            const lit = highlight.includes(region);
            const drift = liveView[region] - view[region];
            const regionStale = stale && touched.includes(region);
            return (
              <g key={region}>
                <rect className={`mvm-group ${lit ? 'is-refresh' : ''} ${regionStale ? 'is-stale' : ''}`} x={viewX + 16} y={gy} width={viewW - 32} height={groupH} rx={7} />
                <text className="mvm-group-region" x={viewX + 32} y={gy + 24} textAnchor="start">{region}</text>
                <text className={`mvm-group-sum ${regionStale ? 'is-stale' : ''}`} x={viewX + 32} y={gy + 46} textAnchor="start">
                  {`SUM = ${view[region]}`}
                </text>
                {regionStale && drift !== 0 && (
                  <text className="mvm-group-drift" x={viewX + viewW - 30} y={gy + 36} textAnchor="end">
                    {`stale → ${liveView[region]}`}
                  </text>
                )}
                {!regionStale && lit && (
                  <text className="mvm-group-ok" x={viewX + viewW - 30} y={gy + 36} textAnchor="end">recomputed</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mvm-metrics">
        <div className="mvm-metric">
          <span className="mvm-metric-label">refresh mode</span>
          <span className="mvm-metric-value">{mode}</span>
        </div>
        <div className="mvm-metric">
          <span className="mvm-metric-label">staleness</span>
          <span className={`mvm-metric-value ${stale ? 'is-warn' : 'is-ok'}`}>{stale ? `${pending} pending` : 'fresh'}</span>
        </div>
        <div className="mvm-metric">
          <span className="mvm-metric-label">last refresh read</span>
          <span className="mvm-metric-value">{mode === 'full' ? `${scanned} rows` : `${scanned} group${scanned === 1 ? '' : 's'}`}</span>
        </div>
        <div className="mvm-metric">
          <span className="mvm-metric-label">last delta</span>
          <span className="mvm-metric-value">{lastDelta ? `${lastDelta.region} ${lastDelta.delta >= 0 ? '+' : ''}${lastDelta.delta}` : '—'}</span>
        </div>
        <div className="mvm-metric">
          <span className="mvm-metric-label">full refreshes</span>
          <span className="mvm-metric-value">{refreshes.full}</span>
        </div>
        <div className="mvm-metric mvm-metric-dim">
          <span className="mvm-metric-label">incremental refreshes</span>
          <span className="mvm-metric-value">{refreshes.incremental}</span>
        </div>
      </div>

      <div className={`mvm-narration ${narrTone}`}>
        <span className={`mvm-narration-label ${narrTone}`}>
          {tone === 'warn' ? 'stale' : tone === 'ok' ? 'refreshed' : 'ready'}
        </span>
        <span className="mvm-narration-body">{note}</span>
      </div>

      <div className="mvm-legend">
        <span className="mvm-legend-item"><Table size={13} className="mvm-ic" /> base table — the source of truth</span>
        <span className="mvm-legend-item"><RefreshCw size={13} className="mvm-ic is-full" /> full — O(rows), rebuild every group</span>
        <span className="mvm-legend-item"><Zap size={13} className="mvm-ic is-inc" /> incremental — O(changed), patch the delta</span>
        <span className="mvm-legend-item"><AlertTriangle size={13} className="mvm-ic is-warn" /> stale — deferred refresh shows old totals</span>
      </div>
    </div>
  );
}
