import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Database, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ApiCrudViz.css';

// A CRUD request falling down a vertical handler pipeline, top -> bottom.
// Everything is deterministic: fixed operations, fixed rows, no randomness.
const STAGES = [
  { key: 'request', name: 'Request', hue: 'is-request' },
  { key: 'validate', name: 'Validate', hue: 'is-validate' },
  { key: 'map', name: 'Map to SQL', hue: 'is-map' },
  { key: 'persist', name: 'DB rows change', hue: 'is-persist' },
  { key: 'respond', name: 'Response', hue: 'is-respond' },
];

// Starting rows, shared by every operation before persist runs.
const BASE_ROWS = [
  { id: 5, name: 'Lin', email: 'lin@x.io' },
  { id: 6, name: 'Omar', email: 'omar@x.io' },
];

// Each operation: the HTTP method, SQL verb + statement, validation line,
// what the request payload is, and how the rows change at the persist stage.
const OPS = {
  create: {
    label: 'Create',
    method: 'POST /users',
    verb: 'INSERT',
    sql: 'INSERT INTO users (name, email)\n  VALUES ($1, $2)',
    payload: '{ name: "Ada", email: "a@x.io" }',
    validate: 'name != ""  and  email matches regex',
    detail: 'A new card is filed: a row is appended and its id returned.',
    respond: '201 Created  { id: 7, name: "Ada" }',
    // returns the resulting rows + the index that changed
    apply: (rows) => {
      const next = rows.concat({ id: 7, name: 'Ada', email: 'a@x.io' });
      return { rows: next, changed: next.length - 1 };
    },
  },
  read: {
    label: 'Read',
    method: 'GET /users/6',
    verb: 'SELECT',
    sql: 'SELECT id, name, email\n  FROM users WHERE id = $1',
    payload: '{ id: 6 }',
    validate: 'id is a positive integer',
    detail: 'A card is pulled and read out. The rows are unchanged.',
    respond: '200 OK  { id: 6, name: "Omar" }',
    apply: (rows) => ({ rows, changed: rows.findIndex((r) => r.id === 6) }),
  },
  update: {
    label: 'Update',
    method: 'PATCH /users/5',
    verb: 'UPDATE',
    sql: 'UPDATE users SET email = $1\n  WHERE id = $2',
    payload: '{ id: 5, email: "lin@new.io" }',
    validate: 'id valid  and  email matches regex',
    detail: 'A card is found and one field is rewritten in place.',
    respond: '200 OK  { id: 5, email: "lin@new.io" }',
    apply: (rows) => {
      const idx = rows.findIndex((r) => r.id === 5);
      const next = rows.map((r, i) => (i === idx ? { ...r, email: 'lin@new.io' } : r));
      return { rows: next, changed: idx };
    },
  },
  del: {
    label: 'Delete',
    method: 'DELETE /users/6',
    verb: 'DELETE',
    sql: 'DELETE FROM users\n  WHERE id = $1',
    payload: '{ id: 6 }',
    validate: 'id is a positive integer',
    detail: 'A card is pulled from the drawer and shredded.',
    respond: '204 No Content',
    apply: (rows) => ({ rows: rows.filter((r) => r.id !== 6), changed: -1 }),
  },
};

const OP_ORDER = ['create', 'read', 'update', 'del'];

// Geometry — a single centered vertical column of stage rows on the left,
// the live rows table on the right.
const W = 460;
const H = 360;
const COL_X = 20;
const COL_W = 210;
const ROW_H = 46;
const PITCH = 66;
const ROW_TOP = 18;
const TRUNK_X = COL_X + 16;

const rowTop = (i) => ROW_TOP + i * PITCH;
const rowMid = (i) => rowTop(i) + ROW_H / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ApiCrudViz() {
  const [opKey, setOpKey] = useState('create');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const op = OPS[opKey];
  const total = STAGES.length - 1;
  const safeStep = Math.min(step, total);
  const stage = STAGES[safeStep];

  // The rows persist step reaches; before it, the base rows are shown.
  const { rows: finalRows, changed } = useMemo(() => op.apply(BASE_ROWS), [op]);
  const persistIdx = STAGES.findIndex((s) => s.key === 'persist');
  const showFinal = safeStep >= persistIdx;
  const rows = showFinal ? finalRows : BASE_ROWS;

  function selectOp(key) {
    setOpKey(key);
    setStep(0);
    setPlaying(false);
  }

  function togglePlay() {
    if (safeStep >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, total, speed]);

  const packetY = rowMid(safeStep);
  const tableX = COL_X + COL_W + 34;
  const tableW = W - tableX - 18;
  const tableRowH = 30;
  const tableTop = 74;

  return (
    <div className="acv">
      <div className="acv-head">
        <div className="acv-head-icon"><Database size={18} /></div>
        <div className="acv-head-text">
          <h3 className="acv-title">A CRUD request through the handler</h3>
          <p className="acv-sub">
            Pick an operation and step it down the pipeline &mdash; the request is validated, mapped to
            a parameterized SQL statement, persisted, and answered. Watch the rows change on the right.
          </p>
        </div>
        <button type="button" className="acv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="acv-ops">
        {OP_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            className={`acv-op ${OPS[key].verb.toLowerCase()}${opKey === key ? ' is-on' : ''}`}
            onClick={() => selectOp(key)}
          >
            {OPS[key].label}
          </button>
        ))}
      </div>

      <div className="acv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="acv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="acv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="acv-arrow-head" />
            </marker>
            <filter id="acv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* vertical trunk with downward arrows between rows */}
          <line
            x1={TRUNK_X} y1={rowMid(0)} x2={TRUNK_X} y2={rowMid(STAGES.length - 1)}
            className="acv-trunk"
          />
          {STAGES.slice(0, -1).map((s, i) => (
            <line
              key={`arr-${s.key}`}
              x1={TRUNK_X} y1={rowMid(i) + 7}
              x2={TRUNK_X} y2={rowMid(i + 1) - 7}
              className="acv-trunk-seg"
              markerEnd="url(#acv-arrow)"
            />
          ))}

          {/* stage rows */}
          {STAGES.map((s, i) => {
            const active = safeStep === i;
            const done = safeStep > i;
            const sub = s.key === 'request' ? op.method
              : s.key === 'validate' ? 'check ok'
                : s.key === 'map' ? `${op.verb} ...`
                  : s.key === 'persist' ? (opKey === 'read' ? 'rows unchanged' : 'rows written')
                    : op.respond.split('  ')[0];
            return (
              <g
                key={s.key}
                className={`acv-row ${s.hue}${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
              >
                <rect x={COL_X} y={rowTop(i)} width={COL_W} height={ROW_H} rx={9} className="acv-row-box" />
                <text x={COL_X + 14} y={rowTop(i) + 20} className="acv-row-name">{s.name}</text>
                <text x={COL_X + 14} y={rowTop(i) + 36} className="acv-row-detail">{sub}</text>
              </g>
            );
          })}

          {/* the request packet riding the trunk */}
          <circle
            cx={TRUNK_X} cy={packetY} r={8}
            className="acv-packet"
            filter="url(#acv-glow)"
          />

          {/* live rows table on the right */}
          <text x={tableX} y={tableTop - 30} className="acv-table-cap">
            users {showFinal && opKey !== 'read' ? 'after' : 'now'}
          </text>
          <line
            x1={tableX} y1={tableTop - 6} x2={tableX + tableW} y2={tableTop - 6}
            className="acv-table-rule"
          />
          <text x={tableX + 8} y={tableTop - 12} className="acv-table-head">id</text>
          <text x={tableX + 52} y={tableTop - 12} className="acv-table-head">name</text>
          <text x={tableX + 118} y={tableTop - 12} className="acv-table-head">email</text>
          {rows.map((r, i) => {
            const hl = showFinal && changed === i;
            return (
              <g key={r.id} className={`acv-trow${hl ? ' is-changed' : ''}`}>
                <rect
                  x={tableX} y={tableTop + i * tableRowH} width={tableW} height={tableRowH - 6}
                  rx={6} className="acv-trow-box"
                />
                <text x={tableX + 8} y={tableTop + i * tableRowH + 17} className="acv-trow-id">{r.id}</text>
                <text x={tableX + 52} y={tableTop + i * tableRowH + 17} className="acv-trow-cell">{r.name}</text>
                <text x={tableX + 118} y={tableTop + i * tableRowH + 17} className="acv-trow-cell">{r.email}</text>
              </g>
            );
          })}
          {showFinal && opKey === 'del' && (
            <text x={tableX + 8} y={tableTop + rows.length * tableRowH + 14} className="acv-table-note">
              row id 6 removed
            </text>
          )}
        </svg>
      </div>

      <div className="acv-controls">
        <button type="button" className="acv-btn" onClick={togglePlay}>
          {playing && safeStep < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < total ? 'Pause' : (safeStep >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="acv-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={safeStep >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="acv-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="acv-speed-range"
          />
          <span className="acv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="acv-progress">{safeStep} / {total}</span>
      </div>

      <div className="acv-readout">
        <div className="acv-stat is-op">
          <span className="acv-stat-label">op</span>
          <span className="acv-stat-val">{op.label}</span>
        </div>
        <div className="acv-stat is-stage">
          <span className="acv-stat-label">stage</span>
          <span className="acv-stat-val">{stage.name}</span>
        </div>
        <div className="acv-stat is-verb">
          <span className="acv-stat-label">sql verb</span>
          <span className="acv-stat-val">{op.verb}</span>
        </div>
        <div className="acv-stat is-rows">
          <span className="acv-stat-label">rows</span>
          <span className="acv-stat-val">{rows.length}</span>
        </div>
      </div>

      <div className="acv-sql">
        <span className="acv-sql-label">statement</span>
        <pre className="acv-sql-body">{op.sql}</pre>
      </div>

      <div className="acv-note">
        <span className="acv-note-label">now</span>
        <span className="acv-note-body">
          {stage.key === 'validate' ? `validate: ${op.validate}`
            : stage.key === 'respond' ? op.respond
              : stage.key === 'persist' ? op.detail
                : stage.key === 'request' ? `payload ${op.payload}`
                  : `binding user values into ${op.verb} placeholders`}
        </span>
      </div>
    </div>
  );
}
