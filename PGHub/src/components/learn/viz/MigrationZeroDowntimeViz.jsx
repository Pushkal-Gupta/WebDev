import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Database, Columns3, ArrowRight, CheckCircle, Trash2, Copy, BookOpen,
} from 'lucide-react';
import './MigrationZeroDowntimeViz.css';

// Expand / contract (parallel-change) migration that renames `name` into
// `full_name` with zero downtime. Each phase keeps the OLD shape valid so the
// app never has a moment where it cannot read or write.
//
//   0 baseline   only `name` exists; app reads + writes `name`.
//   1 expand     add the new `full_name` column (nullable, no backfill). Schema
//                change is additive, so old code is untouched and nothing breaks.
//   2 dual-write app writes BOTH `name` and `full_name`; reads still come from
//                the old column. New rows have both; old rows still only `name`.
//   3 backfill   a background job copies `name` -> `full_name` for existing rows.
//                Both columns now fully populated.
//   4 switch read flip reads to `full_name`; writes still hit both. The new
//                column is now the source of truth and proven correct.
//   5 stop old   stop writing the old `name` column. Old code paths gone.
//   6 contract   drop the `name` column. Only `full_name` remains.
//
// The key idea: at no single step is the old column invalid, so a deploy or
// rollback at any point is safe — that is what makes it zero-downtime.

const COL_OLD = 'name';
const COL_NEW = 'full_name';

const PHASES = [
  {
    key: 'baseline',
    label: 'baseline',
    cols: [{ name: COL_OLD, state: 'live' }],
    readFrom: 'old',
    writeTo: ['old'],
    note: `Starting point. The table has only the "${COL_OLD}" column. The app reads from it and writes to it. The goal: migrate to a new "${COL_NEW}" column with no downtime and a safe rollback at every step.`,
  },
  {
    key: 'expand',
    label: 'expand — add column',
    cols: [{ name: COL_OLD, state: 'live' }, { name: COL_NEW, state: 'added' }],
    readFrom: 'old',
    writeTo: ['old'],
    note: `Expand. Add the new "${COL_NEW}" column as nullable with no default backfill, so the ALTER is fast and non-blocking. This change is purely additive — old code never references "${COL_NEW}", so nothing it does can break. Rollback here is trivial: just drop the empty column.`,
  },
  {
    key: 'dual-write',
    label: 'dual-write',
    cols: [{ name: COL_OLD, state: 'live' }, { name: COL_NEW, state: 'writing' }],
    readFrom: 'old',
    writeTo: ['old', 'new'],
    note: `Dual-write. Deploy code that writes EVERY change to both "${COL_OLD}" and "${COL_NEW}". Reads still come from the old column, so behaviour is unchanged. From now on, new and updated rows keep both columns in sync — only old, untouched rows still lack "${COL_NEW}".`,
  },
  {
    key: 'backfill',
    label: 'backfill',
    cols: [{ name: COL_OLD, state: 'live' }, { name: COL_NEW, state: 'filled' }],
    readFrom: 'old',
    writeTo: ['old', 'new'],
    note: `Backfill. A background job copies "${COL_OLD}" -> "${COL_NEW}" for all existing rows, in batches so it never locks the table. Because dual-write is already running, the job races no one: new writes keep both columns current while the backfill catches up the rest. Now every row has both columns.`,
  },
  {
    key: 'switch-read',
    label: 'switch reads',
    cols: [{ name: COL_OLD, state: 'live' }, { name: COL_NEW, state: 'live' }],
    readFrom: 'new',
    writeTo: ['old', 'new'],
    note: `Switch reads. Flip the app to read from "${COL_NEW}". Writes still go to BOTH columns, so if "${COL_NEW}" turns out wrong you can instantly flip reads back to "${COL_OLD}" — a one-line, zero-risk rollback. This is the moment "${COL_NEW}" becomes the source of truth.`,
  },
  {
    key: 'stop-old',
    label: 'stop writing old',
    cols: [{ name: COL_OLD, state: 'stale' }, { name: COL_NEW, state: 'live' }],
    readFrom: 'new',
    writeTo: ['new'],
    note: `Stop writing old. Once reads from "${COL_NEW}" are proven in production, deploy code that stops writing "${COL_OLD}". It immediately goes stale but still exists, so a rollback that re-enables old reads is still possible for a little while. No code now depends on "${COL_OLD}".`,
  },
  {
    key: 'contract',
    label: 'contract — drop column',
    cols: [{ name: COL_NEW, state: 'live' }],
    readFrom: 'new',
    writeTo: ['new'],
    note: `Contract. With nothing reading or writing "${COL_OLD}", drop it. The migration is complete: the table now has only "${COL_NEW}". At no single step was the old column invalid, so the app served reads and writes continuously the whole way through — that is the zero-downtime guarantee.`,
  },
];

const RUN_DELAY_MS = 1900;

export default function MigrationZeroDowntimeViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const totalSteps = PHASES.length;
  const current = PHASES[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const reset = () => { setIsRunning(false); setStep(0); };
  const goTo = (i) => { setIsRunning(false); setStep(i); };

  // SVG geometry — app box (left), arrows, table box (right) with two columns.
  const W = 940;
  const H = 320;
  const appX = 150;
  const appY = 160;
  const tableX = 700;
  const tableY = 160;
  const tableW = 300;
  const colW = 120;
  const colH = 120;

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const readFromNew = current.readFrom === 'new';
  const writesOld = current.writeTo.includes('old');
  const writesNew = current.writeTo.includes('new');
  const isExpand = step <= 3;
  const phaseBand = step === 0 ? 'baseline' : step <= 3 ? 'expand' : 'contract';

  // column x positions inside the table box
  const oldCol = current.cols.find((c) => c.name === COL_OLD);
  const newCol = current.cols.find((c) => c.name === COL_NEW);
  const hasOld = !!oldCol;
  const hasNew = !!newCol;
  const colLeftX = tableX - tableW / 2 + 34;
  const colRightX = tableX - tableW / 2 + 34 + colW + 24;
  const oldX = colLeftX;
  const newX = hasOld ? colRightX : colLeftX;
  const colTopY = tableY - colH / 2 + 18;

  const colTone = (state) => {
    if (state === 'added') return 'added';
    if (state === 'writing') return 'writing';
    if (state === 'filled') return 'filled';
    if (state === 'stale') return 'stale';
    return 'live';
  };

  return (
    <div className="mzd">
      <div className="mzd-head">
        <h3 className="mzd-title">Zero-downtime migration — expand, then contract</h3>
        <p className="mzd-sub">
          Rename a column without ever taking the app offline: add the new column, dual-write to both,
          backfill, switch reads, stop writing the old, then drop it. The old column stays valid until
          the very last step, so reads and writes never stop.
        </p>
      </div>

      <div className="mzd-controls">
        <div className="mzd-phases" role="tablist" aria-label="Migration phase">
          {PHASES.map((p, i) => (
            <button
              key={p.key}
              type="button"
              className={`mzd-phase ${step === i ? 'is-on' : ''} ${i <= step ? 'is-done' : ''}`}
              onClick={() => goTo(i)}
              aria-pressed={step === i}
              title={p.label}
            >
              <span className="mzd-phase-num">{i}</span>
              <span className="mzd-phase-text">{p.label}</span>
            </button>
          ))}
        </div>

        <label className="mzd-speed">
          <span className="mzd-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mzd-speed-range"
            aria-label="Playback speed"
          />
          <span className="mzd-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mzd-spacer" aria-hidden="true" />

        <div className="mzd-buttons">
          <button
            type="button"
            className="mzd-btn mzd-btn-primary"
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
            className="mzd-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mzd-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="mzd-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mzd-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mzd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mzd-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mzd-arr-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mzd-ah is-read" />
            </marker>
            <marker id="mzd-arr-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mzd-ah is-write" />
            </marker>
          </defs>

          {/* expand/contract band */}
          <rect className={`mzd-band is-${phaseBand}`} x={20} y={18} width={W - 40} height={22} rx={5} />
          <text className={`mzd-band-label is-${phaseBand}`} x={W / 2} y={33} textAnchor="middle">
            {phaseBand === 'baseline' ? 'baseline — old shape live' : isExpand ? 'EXPAND — old shape still valid, new shape added alongside' : 'CONTRACT — new shape is source of truth, old shape retired'}
          </text>

          {/* app box */}
          <g>
            <rect className="mzd-app" x={appX - 72} y={appY - 56} width={144} height={112} rx={12} />
            <g transform={`translate(${appX - 11}, ${appY - 44})`}>
              <BookOpen width={22} height={22} className="mzd-app-ic" />
            </g>
            <text className="mzd-app-label" x={appX} y={appY - 8} textAnchor="middle">App</text>
            <text className="mzd-app-sub" x={appX} y={appY + 10} textAnchor="middle">no downtime</text>
            <text className={`mzd-app-line is-read`} x={appX} y={appY + 30} textAnchor="middle">
              {`reads: ${readFromNew ? COL_NEW : COL_OLD}`}
            </text>
            <text className={`mzd-app-line is-write`} x={appX} y={appY + 46} textAnchor="middle">
              {`writes: ${current.writeTo.map((w) => (w === 'old' ? COL_OLD : COL_NEW)).join(' + ')}`}
            </text>
          </g>

          {/* read arrow (app <- table) */}
          <g>
            <line
              className="mzd-flow is-read"
              x1={tableX - tableW / 2 - 10}
              y1={appY - 24}
              x2={appX + 76}
              y2={appY - 24}
              markerEnd="url(#mzd-arr-read)"
            />
            <text className="mzd-flow-label is-read" x={(appX + tableX) / 2} y={appY - 34} textAnchor="middle">
              {`read ${readFromNew ? COL_NEW : COL_OLD}`}
            </text>
          </g>

          {/* write arrows (app -> table) */}
          {writesOld && (
            <g>
              <line
                className="mzd-flow is-write"
                x1={appX + 76}
                y1={appY + 10}
                x2={oldX + colW / 2}
                y2={appY + 10}
                markerEnd="url(#mzd-arr-write)"
              />
            </g>
          )}
          {writesNew && (
            <g>
              <line
                className="mzd-flow is-write"
                x1={appX + 76}
                y1={appY + 34}
                x2={newX + colW / 2}
                y2={appY + 34}
                markerEnd="url(#mzd-arr-write)"
              />
            </g>
          )}
          <text className="mzd-flow-label is-write" x={(appX + tableX) / 2 - 30} y={appY + 62} textAnchor="middle">
            {`write ${current.writeTo.map((w) => (w === 'old' ? COL_OLD : COL_NEW)).join(' + ')}`}
          </text>

          {/* backfill copy arrow between columns */}
          {current.key === 'backfill' && (
            <g>
              <path className="mzd-flow is-copy" d={`M ${oldX + colW / 2} ${colTopY + colH + 16} q 30 36 ${newX - oldX} 0`} fill="none" markerEnd="url(#mzd-arr-write)" />
              <g transform={`translate(${(oldX + newX) / 2 + colW / 2 - 10}, ${colTopY + colH + 30})`}>
                <Copy width={18} height={18} className="mzd-copy-ic" />
              </g>
              <text className="mzd-flow-label is-copy" x={(oldX + newX) / 2 + colW / 2} y={colTopY + colH + 62} textAnchor="middle">backfill copy</text>
            </g>
          )}

          {/* table box */}
          <g>
            <rect className="mzd-table" x={tableX - tableW / 2} y={tableY - colH / 2 - 18} width={tableW} height={colH + 50} rx={12} />
            <g transform={`translate(${tableX - tableW / 2 + 12}, ${tableY - colH / 2 - 12})`}>
              <Database width={16} height={16} className="mzd-table-ic" />
            </g>
            <text className="mzd-table-label" x={tableX - tableW / 2 + 34} y={tableY - colH / 2 - 1} textAnchor="start">users table</text>

            {/* old column */}
            {hasOld && (
              <g>
                <rect className={`mzd-col is-${colTone(oldCol.state)}`} x={oldX} y={colTopY} width={colW} height={colH} rx={8} />
                <g transform={`translate(${oldX + colW / 2 - 9}, ${colTopY + 12})`}>
                  <Columns3 width={18} height={18} className={`mzd-col-ic is-${colTone(oldCol.state)}`} />
                </g>
                <text className="mzd-col-name" x={oldX + colW / 2} y={colTopY + 48} textAnchor="middle">{COL_OLD}</text>
                <text className={`mzd-col-state is-${colTone(oldCol.state)}`} x={oldX + colW / 2} y={colTopY + 70} textAnchor="middle">
                  {oldCol.state === 'stale' ? 'stale (kept)' : 'populated'}
                </text>
                <text className="mzd-col-old" x={oldX + colW / 2} y={colTopY + 92} textAnchor="middle">old column</text>
              </g>
            )}

            {/* new column */}
            {hasNew && (
              <g>
                <rect className={`mzd-col is-${colTone(newCol.state)}`} x={newX} y={colTopY} width={colW} height={colH} rx={8} />
                <g transform={`translate(${newX + colW / 2 - 9}, ${colTopY + 12})`}>
                  {newCol.state === 'added'
                    ? <Columns3 width={18} height={18} className="mzd-col-ic is-added" />
                    : <CheckCircle width={18} height={18} className={`mzd-col-ic is-${colTone(newCol.state)}`} />}
                </g>
                <text className="mzd-col-name" x={newX + colW / 2} y={colTopY + 48} textAnchor="middle">{COL_NEW}</text>
                <text className={`mzd-col-state is-${colTone(newCol.state)}`} x={newX + colW / 2} y={colTopY + 70} textAnchor="middle">
                  {newCol.state === 'added' ? 'empty (nullable)'
                    : newCol.state === 'writing' ? 'new rows only'
                      : 'populated'}
                </text>
                <text className="mzd-col-new" x={newX + colW / 2} y={colTopY + 92} textAnchor="middle">new column</text>
              </g>
            )}
          </g>
        </svg>
      </div>

      <div className="mzd-metrics">
        <div className="mzd-metric">
          <span className="mzd-metric-label">phase</span>
          <span className={`mzd-metric-value ${step === totalSteps - 1 ? 'is-ok' : ''}`}>{current.label}</span>
        </div>
        <div className="mzd-metric">
          <span className="mzd-metric-label">reads from</span>
          <span className={`mzd-metric-value ${readFromNew ? 'is-ok' : ''}`}>{readFromNew ? COL_NEW : COL_OLD}</span>
        </div>
        <div className="mzd-metric">
          <span className="mzd-metric-label">writes to</span>
          <span className="mzd-metric-value">{current.writeTo.map((w) => (w === 'old' ? COL_OLD : COL_NEW)).join(' + ')}</span>
        </div>
        <div className="mzd-metric mzd-metric-dim">
          <span className="mzd-metric-label">downtime</span>
          <span className="mzd-metric-value is-ok">none — old stays valid</span>
        </div>
      </div>

      <div className={`mzd-narration ${step === totalSteps - 1 ? 'is-ok' : ''}`}>
        <span className={`mzd-narration-label ${step === totalSteps - 1 ? 'is-ok' : ''}`}>{current.label}</span>
        <span className="mzd-narration-body">{current.note}</span>
      </div>

      <div className="mzd-legend">
        <span className="mzd-legend-item"><ArrowRight size={13} className="mzd-ic is-read" /> read path — flips to new at switch</span>
        <span className="mzd-legend-item"><ArrowRight size={13} className="mzd-ic is-write" /> write path — dual-write during transition</span>
        <span className="mzd-legend-item"><Copy size={13} className="mzd-ic is-copy" /> backfill — copy old values into new</span>
        <span className="mzd-legend-item"><Trash2 size={13} className="mzd-ic" /> contract — drop old once unused</span>
      </div>
    </div>
  );
}
