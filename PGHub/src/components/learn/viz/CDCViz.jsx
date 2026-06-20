import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, Database, GitBranch, Radio, Search, Layers, Warehouse } from 'lucide-react';
import './CDCViz.css';

// A fixed stream of writes that commit to the source DB. Each becomes one WAL
// record (LSN), which the CDC connector tails and emits to a single topic
// partition (offset). Three downstream consumers apply events from the topic at
// their own pace, so they sit at different offsets -> eventual-consistency lag.
const WRITES = [
  { op: 'INSERT', row: 7, val: 'Ava' },
  { op: 'UPDATE', row: 7, val: 'Ava->Ada' },
  { op: 'INSERT', row: 9, val: 'Lin' },
  { op: 'UPDATE', row: 9, val: 'Lin->Lyn' },
  { op: 'DELETE', row: 7, val: '' },
  { op: 'INSERT', row: 3, val: 'Mei' },
];

const CONSUMERS = [
  { id: 'search', label: 'search-index', icon: 'search', speed: 1 },   // fastest
  { id: 'cache', label: 'cache', icon: 'layers', speed: 2 },           // medium
  { id: 'warehouse', label: 'warehouse', icon: 'warehouse', speed: 3 },// slowest (batched)
];

const BASE_LSN = 40; // first LSN value so numbers read like a real log

// Build the full step trace. We interleave: commit -> WAL append -> connector
// emit -> then round-robin consumers applying events as the topic grows.
function buildFrames() {
  const frames = [];
  const wal = [];      // { lsn, op, row, val }
  const topic = [];    // { offset, lsn, op, row, val }
  const applied = { search: -1, cache: -1, warehouse: -1 }; // last applied offset (-1 = none)
  // how many emitted events each consumer still owes, used to pace per speed
  const sinceApply = { search: 0, cache: 0, warehouse: 0 };

  const snap = (extra) => ({
    wal: wal.map((w) => ({ ...w })),
    topic: topic.map((t) => ({ ...t })),
    applied: { ...applied },
    region: null,        // db | wal | connector | topic | <consumerId>
    activeOffset: null,
    note: '',
    phase: 'run',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    region: null,
    note: 'Log-based CDC. Writes commit to the source DB and land in its write-ahead log (WAL) as ordered records keyed by LSN. The CDC connector tails the WAL, turns each record into a change event on a topic, and downstream consumers replay that topic at their own offset.',
  }));

  const applyOne = (cid) => {
    const next = applied[cid] + 1;
    if (next >= topic.length) return false;
    applied[cid] = next;
    sinceApply[cid] = 0;
    return true;
  };

  for (let i = 0; i < WRITES.length; i += 1) {
    const w = WRITES[i];
    const lsn = BASE_LSN + i + 2; // commit LSNs jump a bit, like a real log
    const opText = w.op === 'DELETE' ? `${w.op} row ${w.row}` : `${w.op} row ${w.row} = ${w.val}`;

    // 1. commit to DB
    frames.push(snap({
      region: 'db', phase: 'commit',
      note: `${opText} commits to the source database. The change is durable, but nothing downstream knows yet.`,
    }));

    // 2. append to WAL
    wal.push({ lsn, op: w.op, row: w.row, val: w.val });
    frames.push(snap({
      region: 'wal', phase: 'wal',
      note: `The commit appends one record to the WAL at LSN ${lsn}: ${opText}. The WAL is the durable, ordered source of truth CDC reads from — no dual-write, no missed change.`,
    }));

    // 3. connector tails WAL -> emits to topic
    const offset = topic.length;
    topic.push({ offset, lsn, op: w.op, row: w.row, val: w.val });
    CONSUMERS.forEach((c) => { sinceApply[c.id] += 1; });
    frames.push(snap({
      region: 'connector', phase: 'emit', activeOffset: offset,
      note: `The CDC connector tails the WAL past LSN ${lsn} and emits a change event to the topic at offset ${offset}: {op:${w.op}, row:${w.row}}. The topic is the replayable, ordered stream consumers subscribe to.`,
    }));
    frames.push(snap({
      region: 'topic', phase: 'topic', activeOffset: offset,
      note: `Topic now holds ${topic.length} event${topic.length === 1 ? '' : 's'} (offsets 0..${topic.length - 1}). Each consumer tracks its own committed offset, so they advance independently.`,
    }));

    // 4. consumers apply, paced by speed: fast applies every step, slow lags.
    CONSUMERS.forEach((c) => {
      if (sinceApply[c.id] >= c.speed && applied[c.id] < topic.length - 1) {
        const off = applied[c.id] + 1;
        const ev = topic[off];
        applyOne(c.id);
        const lag = (topic.length - 1) - applied[c.id];
        const evText = ev.op === 'DELETE' ? `${ev.op} row ${ev.row}` : `${ev.op} row ${ev.row}`;
        frames.push(snap({
          region: c.id, phase: 'apply',
          note: `${c.label} applies offset ${off} (${evText}). It is now at offset ${applied[c.id]}; head is ${topic.length - 1}, so its lag is ${lag} event${lag === 1 ? '' : 's'}.`,
        }));
      }
    });
  }

  // 5. drain: let the lagging consumers catch up to the head.
  let guard = 0;
  while (CONSUMERS.some((c) => applied[c.id] < topic.length - 1) && guard < 40) {
    guard += 1;
    CONSUMERS.forEach((c) => {
      if (applied[c.id] < topic.length - 1) {
        const off = applied[c.id] + 1;
        applyOne(c.id);
        const lag = (topic.length - 1) - applied[c.id];
        frames.push(snap({
          region: c.id, phase: 'drain',
          note: `No new writes, so the lagging consumers drain the backlog. ${c.label} applies offset ${off}; lag now ${lag}. This is the eventual part of eventual consistency.`,
        }));
      }
    });
  }

  frames.push(snap({
    phase: 'done', region: null,
    note: `Caught up. Every consumer reached offset ${topic.length - 1} — all replicas now agree with the source DB. CDC turned ${WRITES.length} commits into one ordered, replayable stream that fanned out to three stores, each converging at its own rate.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;
const ICONS = { search: Search, layers: Layers, warehouse: Warehouse };

export default function CDCViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  // SVG geometry
  const W = 940;
  const H = 470;

  const topicHead = current.topic.length - 1;

  // topic lane
  const topicY = 232;
  const cellW = 78;
  const cellGap = 8;
  const topicLeft = 250;
  const maxCells = 8;

  // node boxes
  const dbX = 24; const dbY = 60; const dbW = 200; const dbH = 96;
  const walX = 24; const walY = 188; const walW = 200; const walH = 158;
  const connX = 250; const connY = 60; const connW = 200; const connH = 96;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const walTail = current.wal.length ? current.wal[current.wal.length - 1] : null;

  return (
    <div className="cdcv">
      <div className="cdcv-head">
        <h3 className="cdcv-title">Change Data Capture — one WAL, one topic, three offsets</h3>
        <p className="cdcv-sub">
          Step a write through log-based CDC: commit to the database, append to the WAL by LSN, let the connector
          emit a change event to the topic, and watch three consumers apply it at their own offset — so they lag,
          then converge.
        </p>
      </div>

      <div className="cdcv-controls">
        <label className="cdcv-speed">
          <span className="cdcv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cdcv-speed-range"
            aria-label="Playback speed"
          />
          <span className="cdcv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cdcv-spacer" aria-hidden="true" />

        <div className="cdcv-buttons">
          <button
            type="button"
            className="cdcv-btn cdcv-btn-primary"
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
            className="cdcv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cdcv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cdcv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="cdcv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cdcv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cdcv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="cdcv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="cdcv-arrowhead" />
            </marker>
          </defs>

          {/* edges */}
          <path className={`cdcv-edge ${current.phase === 'wal' ? 'is-hot' : ''}`} d={`M ${dbX + 40} ${dbY + dbH} L ${dbX + 40} ${walY}`} markerEnd="url(#cdcv-arrow)" />
          <path className={`cdcv-edge ${current.phase === 'emit' ? 'is-hot' : ''}`} d={`M ${walX + walW} ${walY + 40} C ${walX + walW + 30} ${walY + 40}, ${connX - 30} ${connY + connH - 10}, ${connX} ${connY + connH - 10}`} markerEnd="url(#cdcv-arrow)" />
          <path className={`cdcv-edge ${current.phase === 'emit' || current.phase === 'topic' ? 'is-hot' : ''}`} d={`M ${connX + 40} ${connY + connH} L ${connX + 40} ${topicY - 4}`} markerEnd="url(#cdcv-arrow)" />

          {/* source DB */}
          <g className={`cdcv-node ${current.region === 'db' ? 'is-active' : ''}`}>
            <rect className="cdcv-box cdcv-box-db" x={dbX} y={dbY} width={dbW} height={dbH} rx={10} />
            <g transform={`translate(${dbX + 14}, ${dbY + 14})`}><Database width={18} height={18} className="cdcv-ic" /></g>
            <text className="cdcv-box-title" x={dbX + 40} y={dbY + 28}>source DB</text>
            <text className="cdcv-box-sub" x={dbX + 14} y={dbY + 54}>users table</text>
            <text className="cdcv-box-sub" x={dbX + 14} y={dbY + 76}>
              {current.phase === 'commit' ? 'committing write…' : 'durable rows'}
            </text>
          </g>

          {/* WAL */}
          <g className={`cdcv-node ${current.region === 'wal' ? 'is-active' : ''}`}>
            <rect className="cdcv-box cdcv-box-wal" x={walX} y={walY} width={walW} height={walH} rx={10} />
            <g transform={`translate(${walX + 14}, ${walY + 12})`}><GitBranch width={16} height={16} className="cdcv-ic" /></g>
            <text className="cdcv-box-title" x={walX + 38} y={walY + 25}>WAL (log)</text>
            {current.wal.length === 0 && (
              <text className="cdcv-box-empty" x={walX + walW / 2} y={walY + walH / 2 + 10}>no records yet</text>
            )}
            {current.wal.slice(-4).map((rec, ri, arr) => {
              const y = walY + 40 + ri * 28;
              const isTail = ri === arr.length - 1;
              return (
                <g key={`wal-${rec.lsn}`}>
                  <rect className={`cdcv-wal-row ${isTail && current.region === 'wal' ? 'is-tail' : ''}`} x={walX + 10} y={y} width={walW - 20} height={24} rx={5} />
                  <text className="cdcv-wal-lsn" x={walX + 18} y={y + 16}>LSN {rec.lsn}</text>
                  <text className={`cdcv-wal-op cdcv-op-${rec.op}`} x={walX + 78} y={y + 16}>
                    {rec.op} r{rec.row}
                  </text>
                </g>
              );
            })}
          </g>

          {/* CDC connector */}
          <g className={`cdcv-node ${current.region === 'connector' ? 'is-active' : ''}`}>
            <rect className="cdcv-box cdcv-box-conn" x={connX} y={connY} width={connW} height={connH} rx={10} />
            <g transform={`translate(${connX + 14}, ${connY + 14})`}><Radio width={18} height={18} className="cdcv-ic" /></g>
            <text className="cdcv-box-title" x={connX + 40} y={connY + 28}>CDC connector</text>
            <text className="cdcv-box-sub" x={connX + 14} y={connY + 54}>
              {walTail ? `tailing WAL @ LSN ${walTail.lsn}` : 'tailing WAL…'}
            </text>
            <text className="cdcv-box-sub" x={connX + 14} y={connY + 76}>
              {current.phase === 'emit' && current.activeOffset != null ? `emit -> offset ${current.activeOffset}` : 'reads log, emits events'}
            </text>
          </g>

          {/* topic lane */}
          <text className="cdcv-lane-label" x={topicLeft} y={topicY - 12}>topic / stream (append-only, by offset)</text>
          <rect className={`cdcv-lane ${current.region === 'topic' ? 'is-active' : ''}`} x={topicLeft - 8} y={topicY - 4} width={W - (topicLeft - 8) - 16} height={64} rx={9} />
          {current.topic.length === 0 && (
            <text className="cdcv-box-empty" x={topicLeft + 120} y={topicY + 34}>no events emitted yet</text>
          )}
          {current.topic.slice(-maxCells).map((ev) => {
            const visIdx = ev.offset - Math.max(0, current.topic.length - maxCells);
            const x = topicLeft + visIdx * (cellW + cellGap);
            const isNew = current.activeOffset === ev.offset && (current.phase === 'emit' || current.phase === 'topic');
            return (
              <g key={`tp-${ev.offset}`}>
                <rect className={`cdcv-cell cdcv-op-fill-${ev.op} ${isNew ? 'is-new' : ''}`} x={x} y={topicY + 4} width={cellW} height={48} rx={7} />
                <text className="cdcv-cell-off" x={x + cellW / 2} y={topicY + 20}>off {ev.offset}</text>
                <text className={`cdcv-cell-op cdcv-op-${ev.op}`} x={x + cellW / 2} y={topicY + 38}>{ev.op[0]} r{ev.row}</text>
              </g>
            );
          })}

          {/* consumers */}
          {CONSUMERS.map((c, ci) => {
            const cw = 296;
            const cgap = 12;
            const cx = topicLeft - 8 + ci * (cw + cgap);
            const cy = 364;
            const ch = 86;
            const off = current.applied[c.id];
            const lag = topicHead < 0 ? 0 : topicHead - off;
            const Icon = ICONS[c.icon];
            const active = current.region === c.id;
            const caughtUp = topicHead >= 0 && lag === 0;
            const pct = topicHead < 0 ? 0 : (off + 1) / (topicHead + 1);
            const barW = cw - 28;
            return (
              <g key={`cons-${c.id}`} className={`cdcv-node ${active ? 'is-active' : ''}`}>
                <rect className={`cdcv-box cdcv-box-cons ${caughtUp ? 'is-synced' : ''} ${active ? 'is-applying' : ''}`} x={cx} y={cy} width={cw} height={ch} rx={10} />
                <g transform={`translate(${cx + 14}, ${cy + 14})`}><Icon width={17} height={17} className="cdcv-ic" /></g>
                <text className="cdcv-box-title" x={cx + 40} y={cy + 27}>{c.label}</text>
                <text className={`cdcv-cons-lag ${caughtUp ? 'is-synced' : lag > 1 ? 'is-behind' : ''}`} x={cx + cw - 14} y={cy + 27}>
                  {topicHead < 0 ? 'idle' : caughtUp ? 'in sync' : `lag ${lag}`}
                </text>
                <text className="cdcv-cons-off" x={cx + 14} y={cy + 50}>
                  offset {off < 0 ? '—' : off}{topicHead >= 0 ? ` / ${topicHead}` : ''}
                </text>
                <rect className="cdcv-bar-bg" x={cx + 14} y={cy + 60} width={barW} height={8} rx={4} />
                <rect className={`cdcv-bar-fill ${caughtUp ? 'is-synced' : ''}`} x={cx + 14} y={cy + 60} width={Math.max(0, barW * pct)} height={8} rx={4} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="cdcv-metrics">
        <div className="cdcv-metric">
          <span className="cdcv-metric-label">WAL entries</span>
          <span className="cdcv-metric-value">{current.wal.length}</span>
        </div>
        <div className="cdcv-metric">
          <span className="cdcv-metric-label">stream head</span>
          <span className="cdcv-metric-value">{topicHead < 0 ? '—' : `offset ${topicHead}`}</span>
        </div>
        {CONSUMERS.map((c) => {
          const off = current.applied[c.id];
          const lag = topicHead < 0 ? 0 : topicHead - off;
          return (
            <div className="cdcv-metric" key={`m-${c.id}`}>
              <span className="cdcv-metric-label">{c.label}</span>
              <span className={`cdcv-metric-value ${topicHead >= 0 && lag === 0 ? 'is-synced' : lag > 1 ? 'is-behind' : ''}`}>
                {off < 0 ? 'off —' : `off ${off}`}{topicHead >= 0 ? ` · lag ${lag}` : ''}
              </span>
            </div>
          );
        })}
      </div>

      <div className="cdcv-narration">
        <span className="cdcv-narration-label">trace</span>
        <span className="cdcv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
