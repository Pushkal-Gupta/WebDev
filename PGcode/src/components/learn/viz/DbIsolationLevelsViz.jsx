import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck, ShieldAlert } from 'lucide-react';
import './DbIsolationLevelsViz.css';

const LEVELS = ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'];

// Anomaly visibility matrix. true = anomaly CAN occur at this level.
const MATRIX = {
  'Read Uncommitted': { dirty: true, nonrepeatable: true, phantom: true },
  'Read Committed': { dirty: false, nonrepeatable: true, phantom: true },
  'Repeatable Read': { dirty: false, nonrepeatable: false, phantom: true },
  Serializable: { dirty: false, nonrepeatable: false, phantom: false },
};

// The interleaving each scenario walks through. Steps describe ops on a shared
// row `balance` (and, for phantoms, a range count). `t1See`/`t2See` is what that
// transaction observes AT THIS LEVEL given the matrix flag.
// We build steps as functions of `prevented` so the readout flips per level.
function buildScenario(kind, level) {
  const m = MATRIX[level];
  const frames = [];
  const add = (f) => frames.push({ t1See: null, t2See: null, committed: null, anomaly: null, ...f });

  if (kind === 'dirty') {
    const prevented = !m.dirty;
    add({ actor: '—', op: 'Shared row: balance = 100. T1 and T2 start.', t1See: '100', t2See: '—', note: 'Both transactions begin. The committed value of balance is 100.' });
    add({ actor: 'T2', op: 'UPDATE balance = 100 + 50  (uncommitted)', t1See: '100', t2See: '150', note: 'T2 writes 150 but has NOT committed. The change is still "dirty".' });
    add({
      actor: 'T1', op: 'SELECT balance',
      t1See: prevented ? '100' : '150', t2See: '150',
      anomaly: prevented ? null : 'dirty read',
      note: prevented
        ? `${level}: T1 only sees COMMITTED data, so it reads 100 — the uncommitted 150 is hidden. Dirty read prevented.`
        : `${level}: T1 reads 150 — T2's uncommitted write. This is a DIRTY READ; if T2 rolls back, T1 acted on a value that never existed.`,
    });
    add({
      actor: 'T2', op: 'ROLLBACK', t1See: prevented ? '100' : '150 (stale!)', t2See: 'rolled back', committed: '100',
      anomaly: prevented ? null : 'dirty read',
      note: prevented
        ? 'T2 rolls back. T1 never saw the bad value, so nothing is wrong. balance stays 100.'
        : 'T2 rolls back to 100 — but T1 already read 150 and may have acted on it. The dirty read caused a phantom decision.',
    });
  } else if (kind === 'nonrepeatable') {
    const prevented = !m.nonrepeatable;
    add({ actor: '—', op: 'Shared row: balance = 100. T1 begins a transaction.', t1See: '100', t2See: '—', note: 'T1 will read the same row twice within one transaction.' });
    add({ actor: 'T1', op: 'SELECT balance  (first read)', t1See: '100', t2See: '—', note: 'T1 reads balance = 100.' });
    add({ actor: 'T2', op: 'UPDATE balance = 200; COMMIT', t1See: '100', t2See: '200', committed: '200', note: 'T2 commits a new value, 200. The change is now durable.' });
    add({
      actor: 'T1', op: 'SELECT balance  (second read)',
      t1See: prevented ? '100' : '200', t2See: '200', committed: '200',
      anomaly: prevented ? null : 'non-repeatable read',
      note: prevented
        ? `${level}: T1 took a snapshot at its start, so the second read still returns 100 even though T2 committed 200. Non-repeatable read prevented.`
        : `${level}: T1's second read returns 200 — different from the first read of 100 in the SAME transaction. This is a NON-REPEATABLE READ.`,
    });
  } else {
    // phantom
    const prevented = !m.phantom;
    add({ actor: '—', op: 'Rows WHERE balance > 50: count = 2. T1 begins.', t1See: '2 rows', t2See: '—', note: 'T1 will run the same range query twice.' });
    add({ actor: 'T1', op: 'SELECT count(*) WHERE balance>50  (first)', t1See: '2 rows', t2See: '—', note: 'T1 sees 2 matching rows.' });
    add({ actor: 'T2', op: 'INSERT row balance=80; COMMIT', t1See: '2 rows', t2See: '+1 row', committed: '3 rows', note: 'T2 inserts a new qualifying row and commits.' });
    add({
      actor: 'T1', op: 'SELECT count(*) WHERE balance>50  (second)',
      t1See: prevented ? '2 rows' : '3 rows', t2See: 'committed', committed: '3 rows',
      anomaly: prevented ? null : 'phantom read',
      note: prevented
        ? `${level}: range locks / snapshot isolation block the new row from appearing, so T1 still counts 2. Phantom prevented.`
        : `${level}: T1's second query counts 3 — a PHANTOM row appeared mid-transaction that wasn't in the first result set.`,
    });
  }
  return frames;
}

const SCENARIOS = [
  { key: 'dirty', label: 'Dirty read', anomaly: 'dirty' },
  { key: 'nonrepeatable', label: 'Non-repeatable read', anomaly: 'nonrepeatable' },
  { key: 'phantom', label: 'Phantom read', anomaly: 'phantom' },
];

export default function DbIsolationLevelsViz() {
  const [level, setLevel] = useState('Read Committed');
  const [scenario, setScenario] = useState('dirty');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildScenario(scenario, level), [scenario, level]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1400 / speed);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), delay);
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

  const m = MATRIX[level];
  const anomalyKey = SCENARIOS.find((s) => s.key === scenario).anomaly;
  const anomalyPossible = m[anomalyKey];

  const changeLevel = (l) => { setIsRunning(false); setLevel(l); setStep(0); };
  const changeScenario = (s) => { setIsRunning(false); setScenario(s); setStep(0); };
  const reset = () => { setIsRunning(false); setStep(0); };

  // SVG geometry — two transaction lanes + shared row in the middle.
  const W = 940;
  const laneTop = 56;
  const rowH = 38;
  const visibleSteps = step + 1;
  const timelineH = frames.length * rowH;
  const H = laneTop + timelineH + 50;
  const t1X = 30;
  const t1W = 330;
  const dbX = W / 2 - 70;
  const dbW = 140;
  const t2X = W - 30 - 330;
  const t2W = 330;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  return (
    <div className="dil">
      <div className="dil-head">
        <h3 className="dil-title">Isolation levels — which anomaly each level prevents</h3>
        <p className="dil-sub">
          Two transactions race on a shared row. Pick an anomaly and an isolation level, then step the
          interleaving to see whether the level blocks the anomaly or lets it through.
        </p>
      </div>

      <div className="dil-controls">
        <label className="dil-select-group">
          <span className="dil-input-label">isolation level</span>
          <select className="dil-select" value={level} onChange={(e) => changeLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <div className="dil-modes" role="tablist" aria-label="Anomaly scenario">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              type="button"
              className={`dil-mode ${scenario === s.key ? 'is-on' : ''}`}
              onClick={() => changeScenario(s.key)}
              aria-pressed={scenario === s.key}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="dil-speed">
          <span className="dil-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="dil-speed-range"
            aria-label="Playback speed"
          />
          <span className="dil-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="dil-spacer" aria-hidden="true" />

        <div className="dil-buttons">
          <button
            type="button"
            className="dil-btn dil-btn-primary"
            onClick={() => { if (step >= totalSteps - 1) setStep(0); setIsRunning((v) => !v); }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button type="button" className="dil-btn" onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))} disabled={step >= totalSteps - 1}>
            <ChevronRight size={14} /> Step
          </button>
          <button type="button" className="dil-btn" onClick={() => setStep(totalSteps - 1)} disabled={step >= totalSteps - 1}>
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="dil-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="dil-stepcount">step <strong>{step + 1}</strong> / {totalSteps}</div>
      </div>

      <div className="dil-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="dil-svg" preserveAspectRatio="xMidYMid meet">
          <text x={t1X} y={34} className="dil-lane-label is-t1">T1 (reader)</text>
          <text x={dbX + dbW / 2} y={34} className="dil-lane-label is-db" textAnchor="middle">shared row</text>
          <text x={t2X + t2W} y={34} className="dil-lane-label is-t2" textAnchor="end">T2 (writer)</text>

          {/* central DB column backdrop */}
          <rect x={dbX} y={laneTop} width={dbW} height={timelineH} rx={8} className="dil-db-col" />

          {frames.map((f, i) => {
            const y = laneTop + i * rowH;
            const visible = i < visibleSteps;
            const isCur = i === step;
            const onT1 = f.actor === 'T1';
            const onT2 = f.actor === 'T2';
            const opX = onT2 ? t2X : t1X;
            const opW = onT2 ? t2W : t1W;
            const opAnchor = onT2 ? 'end' : 'start';
            const opTextX = onT2 ? t2X + t2W - 10 : t1X + 10;
            const rowCls = ['dil-op-row', visible ? 'is-on' : 'is-off', isCur && 'is-cur', f.anomaly && isCur && 'is-anomaly'].filter(Boolean).join(' ');
            return (
              <g key={`f-${i}`} className={rowCls}>
                {(onT1 || onT2) && (
                  <rect
                    className={`dil-op-box ${onT1 ? 'is-t1' : 'is-t2'} ${isCur ? 'is-cur' : ''} ${f.anomaly ? 'is-anomaly' : ''}`}
                    x={opX} y={y + 4} width={opW} height={rowH - 8} rx={6}
                  />
                )}
                <text className="dil-op-text" x={opTextX} y={y + rowH / 2 + 4} textAnchor={opAnchor}>{f.op}</text>
                {/* committed value chip in the DB column */}
                {f.committed && (
                  <text className="dil-db-val" x={dbX + dbW / 2} y={y + rowH / 2 + 4} textAnchor="middle">{f.committed}</text>
                )}
                {f.actor === '—' && !f.committed && (
                  <text className="dil-db-val is-dim" x={dbX + dbW / 2} y={y + rowH / 2 + 4} textAnchor="middle">·</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dil-metrics">
        <div className="dil-metric">
          <span className="dil-metric-label">level</span>
          <span className="dil-metric-value">{level}</span>
        </div>
        <div className="dil-metric">
          <span className="dil-metric-label">T1 sees</span>
          <span className="dil-metric-value is-t1">{current.t1See ?? '—'}</span>
        </div>
        <div className="dil-metric">
          <span className="dil-metric-label">T2 state</span>
          <span className="dil-metric-value is-t2">{current.t2See ?? '—'}</span>
        </div>
        <div className="dil-metric">
          <span className="dil-metric-label">committed value</span>
          <span className="dil-metric-value">{current.committed ?? '—'}</span>
        </div>
        <div className={`dil-metric dil-verdict ${anomalyPossible ? 'is-bad' : 'is-good'}`}>
          <span className="dil-metric-label">{SCENARIOS.find((s) => s.key === scenario).label}</span>
          <span className="dil-metric-value">
            {anomalyPossible ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            {anomalyPossible ? 'possible' : 'prevented'}
          </span>
        </div>
      </div>

      <div className="dil-narration">
        <span className="dil-narration-label">trace</span>
        <span className="dil-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
