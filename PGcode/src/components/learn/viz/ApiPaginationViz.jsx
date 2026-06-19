import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database } from 'lucide-react';
import './ApiPaginationViz.css';

const MODES = [
  { id: 'offset', label: 'OFFSET / LIMIT' },
  { id: 'cursor', label: 'CURSOR' },
];

// Fixed deterministic dataset: ids 1..14, labels row-1..row-14.
const BASE_ROWS = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, label: `row-${i + 1}` }));

// Scripted insert: a new row (id 99, "row-NEW") arrives BEFORE page 2 is fetched.
// In OFFSET mode it shifts every later row down by one, exposing the duplicate/skip bug.
// In CURSOR mode the WHERE id > last_seen anchor makes it invisible to already-paged ids.
const INSERT_BEFORE_PAGE = 2;
const INSERT_ROW = { id: 99, label: 'row-NEW' };

function rowsByOrder(rows) {
  // Display/scan order is by id, but the inserted row carries a high id (99),
  // so to model "inserted at the top" we sort by an explicit sortKey instead.
  return rows.slice().sort((a, b) => a.sortKey - b.sortKey);
}

// ---- OFFSET / LIMIT trace --------------------------------------------------
function buildOffsetFrames(limit) {
  const frames = [];
  // Each row gets a sortKey == its natural position. The insert goes to the top (sortKey 0).
  let table = BASE_ROWS.map((r, i) => ({ ...r, sortKey: i + 1 }));
  const seen = [];
  let inserted = false;
  let returnedTotal = 0;

  const snap = (extra) => {
    const ordered = rowsByOrder(table);
    return {
      mode: 'offset',
      ordered,
      seen: seen.slice(),
      page: 0,
      offset: 0,
      sql: '',
      returnedIds: [],
      skippedIds: [],
      newlyInsertedId: inserted ? INSERT_ROW.id : null,
      boundaryId: null,
      returnedTotal,
      note: '',
      pitfall: '',
      ...extra,
    };
  };

  frames.push(snap({
    note: `OFFSET pagination orders by id, then skips OFFSET rows and returns the next ${limit}. Page p uses OFFSET = (p-1)×${limit}. Watch the skip grow each page.`,
  }));

  let page = 0;
  let pageStart = 0;
  while (pageStart < BASE_ROWS.length + 1) {
    page += 1;

    if (page === INSERT_BEFORE_PAGE && !inserted) {
      table = [{ ...INSERT_ROW, sortKey: 0 }, ...table];
      inserted = true;
      frames.push(snap({
        page: page - 1,
        note: `INSERT INTO items (row-NEW) lands at the TOP of the id order, BEFORE page ${page} is fetched. Every later row shifts down one position.`,
        pitfall: 'A row was inserted between page fetches — OFFSET counts positions, not identities, so the offset now points one row too early.',
      }));
    }

    const offset = (page - 1) * limit;
    const ordered = rowsByOrder(table);
    if (offset >= ordered.length) break;

    const skipped = ordered.slice(0, offset).map((r) => r.id);
    const returnedRows = ordered.slice(offset, offset + limit);
    const returnedIds = returnedRows.map((r) => r.id);
    const sql = `SELECT * FROM items ORDER BY id LIMIT ${limit} OFFSET ${offset}`;

    // Detect the bug: an id already seen reappears (duplicate), or a base row was skipped.
    const dupes = returnedIds.filter((id) => seen.includes(id));
    let pitfall = '';
    if (inserted && page === INSERT_BEFORE_PAGE) {
      if (dupes.length) {
        pitfall = `DUPLICATE BUG: row-${dupes[0]} was already returned on page ${page - 1}, yet OFFSET ${offset} re-shows it because the insert pushed it back into this slice.`;
      } else {
        pitfall = `SKIP BUG: the insert shifted rows so OFFSET ${offset} jumped past a row the client never saw — silent data loss.`;
      }
    }

    returnedTotal += returnedIds.length;
    frames.push(snap({
      page,
      offset,
      sql,
      skippedIds: skipped,
      returnedIds,
      returnedTotal,
      note: `Page ${page}: skip ${offset} row(s), return ${returnedIds.length} → ids [${returnedIds.join(', ')}]. Skip cost grows with every page.`,
      pitfall,
    }));

    returnedIds.forEach((id) => { if (!seen.includes(id)) seen.push(id); });
    frames.push(snap({
      page,
      offset,
      sql,
      returnedIds,
      returnedTotal,
      note: `Client appends ids [${returnedIds.join(', ')}]. Seen so far: ${seen.length} row(s).`,
      pitfall,
    }));

    pageStart += limit;
  }

  frames.push(snap({
    note: `Done. ${returnedTotal} rows returned across ${page - 1} pages. OFFSET re-counts position from the start each query — any insert/delete near the top shifts the window and produces a duplicate or a skip.`,
    pitfall: 'OFFSET pagination is unstable under concurrent writes. Deep offsets are also slow: the DB still reads and discards every skipped row.',
  }));
  return frames;
}

// ---- CURSOR trace ----------------------------------------------------------
function buildCursorFrames(limit) {
  const frames = [];
  let table = BASE_ROWS.map((r, i) => ({ ...r, sortKey: i + 1 }));
  const seen = [];
  let inserted = false;
  let lastSeenId = 0;
  let returnedTotal = 0;

  const snap = (extra) => {
    const ordered = rowsByOrder(table);
    return {
      mode: 'cursor',
      ordered,
      seen: seen.slice(),
      page: 0,
      lastSeenId,
      sql: '',
      returnedIds: [],
      skippedIds: [],
      newlyInsertedId: inserted ? INSERT_ROW.id : null,
      boundaryId: lastSeenId || null,
      returnedTotal,
      note: '',
      stability: '',
      ...extra,
    };
  };

  frames.push(snap({
    note: `Cursor pagination keeps the last id seen and asks for rows AFTER it: WHERE id > last_seen ORDER BY id LIMIT ${limit}. The anchor is an identity, not a position.`,
  }));

  let page = 0;
  while (true) {
    page += 1;

    if (page === INSERT_BEFORE_PAGE && !inserted) {
      // Inserted row carries id 99, which sorts AFTER the cursor's current anchor,
      // so by id-order it never falls back into already-paged territory.
      table = [...table, { ...INSERT_ROW, sortKey: 1000 }];
      inserted = true;
      frames.push(snap({
        page: page - 1,
        note: `INSERT INTO items (row-NEW) arrives BEFORE page ${page}. Because the cursor filters on WHERE id > ${lastSeenId}, already-paged rows are anchored by identity and cannot reappear.`,
        stability: `No shift: the WHERE id > ${lastSeenId} predicate fixes the boundary by value, not by row count.`,
      }));
    }

    const ordered = rowsByOrder(table).filter((r) => r.id > lastSeenId);
    if (ordered.length === 0) break;

    const returnedRows = ordered.slice(0, limit);
    const returnedIds = returnedRows.map((r) => r.id);
    const sql = `SELECT * FROM items WHERE id > ${lastSeenId} ORDER BY id LIMIT ${limit}`;
    const boundary = lastSeenId;

    returnedTotal += returnedIds.length;
    frames.push(snap({
      page,
      sql,
      returnedIds,
      boundaryId: boundary || null,
      returnedTotal,
      note: `Page ${page}: keep rows with id > ${lastSeenId}, take first ${returnedIds.length} → ids [${returnedIds.join(', ')}]. No rows are skipped or read-and-discarded.`,
      stability: 'Stable: every returned id is strictly greater than the last cursor — no duplicate, no skip.',
    }));

    returnedIds.forEach((id) => { if (!seen.includes(id)) seen.push(id); });
    lastSeenId = returnedRows[returnedRows.length - 1].id;
    frames.push(snap({
      page,
      sql,
      returnedIds,
      boundaryId: lastSeenId,
      returnedTotal,
      note: `Advance the cursor to last_seen = ${lastSeenId}. Seen so far: ${seen.length} row(s).`,
      stability: 'The cursor only ever moves forward; the same row can never be paged twice.',
    }));
  }

  frames.push(snap({
    note: `Done. ${returnedTotal} rows returned. row-NEW (id ${INSERT_ROW.id}) is paged in order without disturbing earlier pages. Cursor pagination is stable under writes and avoids the deep-offset scan cost.`,
    stability: 'Index-friendly: WHERE id > x seeks straight to the boundary instead of counting from the start.',
  }));
  return frames;
}

export default function ApiPaginationViz() {
  const [mode, setMode] = useState('offset');
  const [limit, setLimit] = useState(3);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'offset' ? buildOffsetFrames(limit) : buildCursorFrames(limit)),
    [mode, limit],
  );
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay, totalSteps]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  const changeLimit = (value) => {
    const next = Math.max(2, Math.min(5, value));
    setIsRunning(false);
    setStep(0);
    setLimit(next);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — two-column grid of cells fits all 15 rows (14 + inserted) without scrolling.
  const W = 940;
  const H = 430;
  const gridLeft = 24;
  const gridTop = 70;
  const colW = 200;
  const colGap = 18;
  const rowH = 30;
  const rowGap = 6;
  const perCol = 8; // up to 16 cells across 2 columns

  const ordered = current.ordered;
  const cellPos = (i) => {
    const col = Math.floor(i / perCol);
    const rowInCol = i % perCol;
    return {
      x: gridLeft + col * (colW + colGap),
      y: gridTop + rowInCol * (rowH + rowGap),
    };
  };

  const cellClass = (row) => {
    const cls = ['apv-cell'];
    if (current.newlyInsertedId === row.id) cls.push('is-inserted');
    if (current.returnedIds.includes(row.id)) cls.push('is-returned');
    else if (current.skippedIds.includes(row.id)) cls.push('is-skipped');
    else if (current.seen.includes(row.id)) cls.push('is-seen');
    if (mode === 'cursor' && current.boundaryId && row.id === current.boundaryId) cls.push('is-boundary');
    return cls.join(' ');
  };

  // Query ticket panel position (right side).
  const ticketX = gridLeft + 2 * (colW + colGap) + 6;
  const ticketW = W - ticketX - 24;

  return (
    <div className="apv">
      <div className="apv-head">
        <h3 className="apv-title">API pagination — offset/limit vs cursor</h3>
        <p className="apv-sub">
          Step through pages over a fixed table. A row is inserted at the top between fetches — watch
          offset pagination duplicate or skip a row while the cursor stays stable.
        </p>
      </div>

      <div className="apv-controls">
        <div className="apv-modes" role="tablist" aria-label="Pagination strategy">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`apv-mode ${mode === m.id ? 'is-on' : ''}`}
              onClick={() => switchMode(m.id)}
              aria-pressed={mode === m.id}
            >
              {m.label}
            </button>
          ))}
        </div>

        <label className="apv-slider">
          <span className="apv-input-label">limit</span>
          <input
            type="range" min={2} max={5} step={1} value={limit}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="apv-range" aria-label="Page size limit"
          />
          <span className="apv-slider-val">{limit}</span>
        </label>

        <label className="apv-slider">
          <span className="apv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="apv-range" aria-label="Playback speed"
          />
          <span className="apv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="apv-spacer" aria-hidden="true" />

        <div className="apv-buttons">
          <button
            type="button"
            className="apv-btn apv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="apv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Next page
          </button>
          <button
            type="button"
            className="apv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="apv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="apv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="apv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="apv-svg" preserveAspectRatio="xMidYMid meet">
          <g className="apv-db-head">
            <Database x={gridLeft} y={34} width={16} height={16} className="apv-db-icon" />
            <text className="apv-table-label" x={gridLeft + 24} y={47}>items · ORDER BY id</text>
          </g>

          {ordered.map((row, i) => {
            const { x, y } = cellPos(i);
            return (
              <g key={`cell-${row.id}`}>
                <rect
                  className={cellClass(row)}
                  x={x}
                  y={y}
                  width={colW}
                  height={rowH}
                  rx={6}
                  style={
                    mode === 'cursor' && current.boundaryId === row.id
                      ? { stroke: 'var(--hue-sky)' }
                      : undefined
                  }
                />
                <text className="apv-cell-id" x={x + 12} y={y + rowH / 2 + 4}>#{row.id}</text>
                <text className="apv-cell-label" x={x + 52} y={y + rowH / 2 + 4}>{row.label}</text>
                {current.returnedIds.includes(row.id) && (
                  <text className="apv-cell-tag is-returned" x={x + colW - 12} y={y + rowH / 2 + 4} textAnchor="end">return</text>
                )}
                {current.skippedIds.includes(row.id) && (
                  <text className="apv-cell-tag is-skipped" x={x + colW - 12} y={y + rowH / 2 + 4} textAnchor="end">skip</text>
                )}
                {current.newlyInsertedId === row.id && !current.returnedIds.includes(row.id) && (
                  <text className="apv-cell-tag is-inserted" x={x + colW - 12} y={y + rowH / 2 + 4} textAnchor="end">new</text>
                )}
              </g>
            );
          })}

          {/* Query ticket */}
          <rect className="apv-ticket" x={ticketX} y={gridTop} width={ticketW} height={150} rx={9} />
          <text className="apv-ticket-label" x={ticketX + 14} y={gridTop + 22}>QUERY ISSUED</text>
          {(current.sql || 'no query yet').match(/.{1,30}(\s|$)/g)?.slice(0, 5).map((seg, li) => (
            <text key={`sql-${li}`} className="apv-ticket-sql" x={ticketX + 14} y={gridTop + 46 + li * 18}>
              {seg.trim()}
            </text>
          ))}
          <line className="apv-ticket-rule" x1={ticketX + 14} y1={gridTop + 116} x2={ticketX + ticketW - 14} y2={gridTop + 116} />
          <text className="apv-ticket-meta" x={ticketX + 14} y={gridTop + 136}>
            page {current.page || '—'} · returned {current.returnedIds.length}
          </text>

          {/* Pitfall / stability banner */}
          {(current.pitfall || current.stability) && (
            <g>
              <rect
                className={`apv-flag ${mode === 'offset' ? 'is-warn' : 'is-ok'}`}
                x={ticketX}
                y={gridTop + 166}
                width={ticketW}
                height={94}
                rx={9}
              />
              <text className={`apv-flag-label ${mode === 'offset' ? 'is-warn' : 'is-ok'}`} x={ticketX + 14} y={gridTop + 188}>
                {mode === 'offset' ? 'PITFALL' : 'STABILITY'}
              </text>
              {(current.pitfall || current.stability).match(/.{1,32}(\s|$)/g)?.slice(0, 4).map((seg, li) => (
                <text key={`flag-${li}`} className="apv-flag-text" x={ticketX + 14} y={gridTop + 208 + li * 15}>
                  {seg.trim()}
                </text>
              ))}
            </g>
          )}

          {/* Legend */}
          <g className="apv-legend">
            <rect className="apv-cell is-returned" x={gridLeft} y={H - 30} width={14} height={14} rx={3} />
            <text className="apv-legend-text" x={gridLeft + 20} y={H - 19}>returned</text>
            <rect className="apv-cell is-skipped" x={gridLeft + 110} y={H - 30} width={14} height={14} rx={3} />
            <text className="apv-legend-text" x={gridLeft + 130} y={H - 19}>skipped</text>
            <rect className="apv-cell is-seen" x={gridLeft + 220} y={H - 30} width={14} height={14} rx={3} />
            <text className="apv-legend-text" x={gridLeft + 240} y={H - 19}>already seen</text>
            <rect className="apv-cell is-inserted" x={gridLeft + 360} y={H - 30} width={14} height={14} rx={3} />
            <text className="apv-legend-text" x={gridLeft + 380} y={H - 19}>inserted</text>
          </g>
        </svg>
      </div>

      <div className="apv-metrics">
        <div className="apv-metric">
          <span className="apv-metric-label">mode</span>
          <span className="apv-metric-value">{mode === 'offset' ? 'offset / limit' : 'cursor'}</span>
        </div>
        <div className="apv-metric">
          <span className="apv-metric-label">page</span>
          <span className="apv-metric-value">{current.page || '—'}</span>
        </div>
        <div className="apv-metric">
          <span className="apv-metric-label">{mode === 'offset' ? 'offset' : 'last_seen id'}</span>
          <span className="apv-metric-value">
            {mode === 'offset' ? (current.offset ?? 0) : (current.lastSeenId ?? 0)}
          </span>
        </div>
        <div className="apv-metric">
          <span className="apv-metric-label">returned ids</span>
          <span className="apv-metric-value is-return">[{current.returnedIds.join(', ') || '—'}]</span>
        </div>
        <div className="apv-metric">
          <span className="apv-metric-label">rows total</span>
          <span className="apv-metric-value">{current.returnedTotal}</span>
        </div>
      </div>

      <div className="apv-narration">
        <span className="apv-narration-label">trace</span>
        <span className="apv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
