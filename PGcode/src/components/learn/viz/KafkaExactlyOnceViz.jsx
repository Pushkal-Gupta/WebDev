import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send, Repeat, RotateCcw, Play, Square, Check, Ban, Eye, ShieldCheck,
  Hash, AlertTriangle, KeyRound,
} from 'lucide-react';
import './KafkaExactlyOnceViz.css';

// Kafka exactly-once, two coordinated mechanisms shown on append-only partition
// logs (reusing KafkaPartitionsViz' offset-cell language):
//
//  (A) Idempotent producer: one Producer ID (PID) attaches a monotonic sequence
//      number per partition. The broker tracks the last accepted seq per
//      (PID, partition). A retry of an already-accepted seq is DEDUPED — the
//      broker appends nothing and just re-acks. A new seq appends a fresh cell.
//
//  (B) Transactions: messages produced inside an open transaction are written as
//      UNCOMMITTED cells (dashed, dimmed). A read_committed consumer does NOT see
//      them until a COMMIT marker lands — then all of them flip visible at once
//      (all-or-nothing). On ABORT every in-flight cell is discarded and never
//      delivered.

const PID = 42;
const PART_COUNT = 2;                 // two partitions, written atomically in a txn
const VISIBLE_CELLS = 9;              // offset cells drawn before "+N more"
const PART_HUE = ['--hue-sky', '--hue-mint'];
const AUTO_MS = 1300;                 // base auto-play tick, divided by speed

function freshState() {
  return {
    // each partition log = list of { seq, hue, committed, fresh, flashCommit }
    partitions: Array.from({ length: PART_COUNT }, () => []),
    nextSeq: Array.from({ length: PART_COUNT }, () => 0), // next seq the broker expects per partition
    lastSeq: Array.from({ length: PART_COUNT }, () => -1), // last seq the broker has accepted
    appended: 0,            // total cells the broker actually appended
    dropped: 0,             // duplicates the broker deduped (appended nothing)
    txnState: 'none',       // none | open | committed | aborted
    inFlight: 0,            // uncommitted cells in the current open transaction
    rrPart: 0,              // which partition the next txn produce targets (alternates)
    flash: null,            // { partition, seq } transient "dup dropped" marker
    note: 'A producer holds one Producer ID (PID=42) and a per-partition sequence number. The broker remembers the last seq it accepted on each partition. Produce a message to append a cell; retry the last one to watch the broker dedupe the duplicate.',
    tone: 'init',
  };
}

function clearTransients(prev) {
  return {
    ...prev,
    partitions: prev.partitions.map((log) => log.map((m) => ({ ...m, fresh: false, flashCommit: false }))),
    flash: null,
  };
}

// (A) Produce a brand-new sequence number to the round-robin partition. This
// always appends a new cell and advances that partition's seq.
function produceNew(prevRaw) {
  const prev = clearTransients(prevRaw);
  const part = prev.rrPart % PART_COUNT;
  const seq = prev.nextSeq[part];
  const partitions = prev.partitions.map((log) => log.slice());
  const inTxn = prev.txnState === 'open';
  partitions[part] = [
    ...partitions[part],
    { seq, hue: PART_HUE[part], committed: !inTxn, fresh: true, flashCommit: false },
  ];
  const nextSeq = prev.nextSeq.slice();
  const lastSeq = prev.lastSeq.slice();
  nextSeq[part] = seq + 1;
  lastSeq[part] = seq;

  const offset = partitions[part].length - 1;
  const note = inTxn
    ? `Produced seq ${seq} to partition ${part} inside the open transaction. The broker accepted it (last seq for p${part} is now ${seq}), but the cell is UNCOMMITTED — a read_committed consumer cannot see it yet. Commit or abort decides its fate.`
    : `Produced seq ${seq} to partition ${part} — the broker had not seen this (PID ${PID}, p${part}, seq ${seq}) before, so it appended a new cell at offset ${offset} and acked. Sequence advances to ${seq + 1}.`;

  return {
    ...prev,
    partitions,
    nextSeq,
    lastSeq,
    appended: prev.appended + 1,
    inFlight: inTxn ? prev.inFlight + 1 : prev.inFlight,
    rrPart: (prev.rrPart + 1) % PART_COUNT,
    note,
    tone: inTxn ? 'txn' : 'append',
  };
}

// (A) Retry the LAST accepted sequence on the partition we most recently wrote.
// Same (PID, partition, seq) the broker already has -> deduped, nothing appended.
function retryLast(prevRaw) {
  const prev = clearTransients(prevRaw);
  // target the partition that holds the most-recently accepted seq
  const part = (prev.rrPart + PART_COUNT - 1) % PART_COUNT;
  const dupSeq = prev.lastSeq[part];
  if (dupSeq < 0) {
    return {
      ...prev,
      note: 'Nothing produced yet — produce a message first, then retry it to see the broker dedupe the duplicate.',
      tone: 'init',
    };
  }
  return {
    ...prev,
    dropped: prev.dropped + 1,
    flash: { partition: part, seq: dupSeq },
    note: `Retried seq ${dupSeq} on partition ${part}. The broker already accepted (PID ${PID}, p${part}, seq ${dupSeq}) — the last seq it has — so it recognises the duplicate, appends NOTHING, and simply re-acks. No new offset. That is the idempotent producer dropping a retry.`,
    tone: 'dedup',
  };
}

// (B) Begin a transaction. Subsequent produces write uncommitted cells.
function beginTxn(prevRaw) {
  if (prevRaw.txnState === 'open') return prevRaw;
  const prev = clearTransients(prevRaw);
  return {
    ...prev,
    txnState: 'open',
    inFlight: 0,
    note: 'Transaction open. Messages produced now are written to the partition logs as UNCOMMITTED cells (dashed, dimmed). They occupy real offsets and advance the sequence, but a read_committed consumer skips past them until a COMMIT marker arrives.',
    tone: 'txn',
  };
}

// (B) Commit: every uncommitted cell flips visible at once. All-or-nothing.
function commitTxn(prevRaw) {
  if (prevRaw.txnState !== 'open') return prevRaw;
  const prev = clearTransients(prevRaw);
  let flipped = 0;
  const partitions = prev.partitions.map((log) => log.map((m) => {
    if (!m.committed) {
      flipped += 1;
      return { ...m, committed: true, flashCommit: true };
    }
    return m;
  }));
  return {
    ...prev,
    partitions,
    txnState: 'committed',
    inFlight: 0,
    note: `COMMIT marker appended. All ${flipped} in-flight message${flipped === 1 ? '' : 's'} across both partitions become visible to read_committed consumers at the same instant — atomic, all-or-nothing. The consumer's visible count jumps by ${flipped}.`,
    tone: 'commit',
  };
}

// (B) Abort: every uncommitted cell is discarded and never delivered.
function abortTxn(prevRaw) {
  if (prevRaw.txnState !== 'open') return prevRaw;
  const prev = clearTransients(prevRaw);
  let discarded = 0;
  const partitions = prev.partitions.map((log) => log.filter((m) => {
    if (!m.committed) {
      discarded += 1;
      return false;
    }
    return true;
  }));
  return {
    ...prev,
    partitions,
    txnState: 'aborted',
    inFlight: 0,
    note: `ABORT marker appended. All ${discarded} in-flight message${discarded === 1 ? '' : 's'} are discarded — a read_committed consumer never sees them, as if the transaction never happened. The committed log is untouched.`,
    tone: 'abort',
  };
}

const AUTO_SCRIPT = ['new', 'new', 'retry', 'begin', 'new', 'new', 'commit', 'new', 'begin', 'new', 'abort'];

export default function KafkaExactlyOnceViz() {
  const [state, setState] = useState(() => freshState());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);

  const autoTimer = useRef(null);
  const scriptIdx = useRef(0);

  const delay = useMemo(() => Math.round(AUTO_MS / Math.max(0.5, speed)), [speed]);

  const apply = (action) => {
    setState((prev) => {
      switch (action) {
        case 'new': return produceNew(prev);
        case 'retry': return retryLast(prev);
        case 'begin': return beginTxn(prev);
        case 'commit': return commitTxn(prev);
        case 'abort': return abortTxn(prev);
        default: return prev;
      }
    });
  };

  useEffect(() => {
    if (!isRunning) return undefined;
    autoTimer.current = setInterval(() => {
      const action = AUTO_SCRIPT[scriptIdx.current % AUTO_SCRIPT.length];
      scriptIdx.current += 1;
      apply(action);
    }, delay);
    return () => {
      if (autoTimer.current) {
        clearInterval(autoTimer.current);
        autoTimer.current = null;
      }
    };
  }, [isRunning, delay]);

  useEffect(() => () => {
    if (autoTimer.current) clearInterval(autoTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    scriptIdx.current = 0;
    setState(freshState());
  };

  const stop = (fn) => {
    setIsRunning(false);
    fn();
  };

  // Derived readouts.
  const txnOpen = state.txnState === 'open';
  const committedSeen = state.partitions.reduce(
    (sum, log) => sum + log.filter((m) => m.committed).length,
    0,
  );
  const uncommitted = state.partitions.reduce(
    (sum, log) => sum + log.filter((m) => !m.committed).length,
    0,
  );

  // SVG geometry — one row per partition, offset cells laid left to right.
  const W = 960;
  const rowH = 60;
  const rowGap = 16;
  const topPad = 32;
  const botPad = 16;
  const labelW = 142;
  const H = topPad + PART_COUNT * (rowH + rowGap) - rowGap + botPad;

  const cellGap = 7;
  const trackX = labelW + 16;
  const trackRight = W - 78;
  const trackW = trackRight - trackX;
  const cellW = (trackW - (VISIBLE_CELLS - 1) * cellGap) / VISIBLE_CELLS;
  const cellH = 32;

  const txnTone = state.txnState === 'open' ? 'open'
    : state.txnState === 'committed' ? 'ok'
      : state.txnState === 'aborted' ? 'warn' : '';

  return (
    <div className="keo">
      <div className="keo-head">
        <h3 className="keo-title">Kafka exactly-once — idempotent dedupe plus atomic transactions</h3>
        <p className="keo-sub">
          One Producer ID with a per-partition sequence number lets the broker drop retried duplicates.
          A transaction wraps writes across partitions so a read_committed consumer sees all of them at commit, or none on abort.
        </p>
      </div>

      <div className="keo-controls">
        <div className="keo-group" role="group" aria-label="Idempotent producer">
          <span className="keo-group-label">idempotent</span>
          <button
            type="button"
            className="keo-btn"
            onClick={() => stop(() => apply('new'))}
            title="Produce a message with the next sequence number — the broker appends a new cell"
          >
            <Send size={14} /> Produce (new seq)
          </button>
          <button
            type="button"
            className="keo-btn"
            onClick={() => stop(() => apply('retry'))}
            title="Retry the last accepted sequence — the broker recognises the duplicate and drops it"
          >
            <Repeat size={14} /> Retry last (duplicate)
          </button>
        </div>

        <span className="keo-divider" aria-hidden="true" />

        <div className="keo-group" role="group" aria-label="Transactions">
          <span className="keo-group-label">transaction</span>
          <button
            type="button"
            className="keo-btn"
            onClick={() => stop(() => apply('begin'))}
            disabled={txnOpen}
            title="Open a transaction — subsequent produces are uncommitted"
          >
            <ShieldCheck size={14} /> Begin txn
          </button>
          <button
            type="button"
            className="keo-btn keo-btn-ok"
            onClick={() => stop(() => apply('commit'))}
            disabled={!txnOpen}
            title="Commit — all in-flight messages become visible at once"
          >
            <Check size={14} /> Commit
          </button>
          <button
            type="button"
            className="keo-btn keo-btn-warn"
            onClick={() => stop(() => apply('abort'))}
            disabled={!txnOpen}
            title="Abort — all in-flight messages are discarded"
          >
            <Ban size={14} /> Abort
          </button>
        </div>

        <span className="keo-spacer" aria-hidden="true" />

        <label className="keo-slider">
          <span className="keo-group-label">auto speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="keo-slider-range"
            aria-label="Auto-play speed"
          />
          <span className="keo-slider-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="keo-buttons">
          <button
            type="button"
            className="keo-btn keo-btn-primary"
            onClick={() => setIsRunning((v) => !v)}
            title="Auto-play a scripted produce / retry / begin / commit / abort sequence"
          >
            {isRunning ? <Square size={14} /> : <Play size={14} />}
            {isRunning ? 'Stop' : 'Auto-play'}
          </button>
          <button type="button" className="keo-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="keo-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="keo-svg" preserveAspectRatio="xMidYMid meet">
          <text className="keo-topic-label" x={trackX} y={18} textAnchor="start">
            {`topic "payments-enriched" — PID ${PID}, append-only logs (offset grows right)`}
          </text>
          <text className="keo-consumer-label" x={trackRight + 8} y={18} textAnchor="start">
            read_committed
          </text>

          {state.partitions.map((log, pi) => {
            const y = topPad + pi * (rowH + rowGap);
            const overflow = Math.max(0, log.length - VISIBLE_CELLS);
            const startIdx = Math.max(0, log.length - VISIBLE_CELLS);
            const visible = log.slice(startIdx);
            const flashHere = state.flash && state.flash.partition === pi;
            return (
              <g key={`part-${pi}`}>
                <rect
                  className="keo-part-box"
                  x={0}
                  y={y}
                  width={labelW}
                  height={rowH}
                  rx={8}
                  style={{ '--keo-part-hue': `var(${PART_HUE[pi]})` }}
                />
                <g transform={`translate(12, ${y + 15})`}>
                  <Hash width={13} height={13} className="keo-ic" />
                </g>
                <text className="keo-part-name" x={32} y={y + 24}>{`partition ${pi}`}</text>
                <text className="keo-part-meta" x={12} y={y + 44}>
                  {`next seq ${state.nextSeq[pi]} · ${log.length} cell${log.length === 1 ? '' : 's'}`}
                </text>

                <line
                  className="keo-track"
                  x1={trackX}
                  y1={y + rowH / 2}
                  x2={trackRight}
                  y2={y + rowH / 2}
                />

                {Array.from({ length: VISIBLE_CELLS }).map((_, i) => {
                  const m = visible[i];
                  const cx = trackX + i * (cellW + cellGap);
                  const cy = y + (rowH - cellH) / 2;
                  const realOffset = startIdx + i;
                  if (!m) {
                    return (
                      <rect
                        key={`empty-${pi}-${i}`}
                        className="keo-cell is-empty"
                        x={cx}
                        y={cy}
                        width={cellW}
                        height={cellH}
                        rx={5}
                      />
                    );
                  }
                  const cls = [
                    'keo-cell',
                    m.committed ? 'is-committed' : 'is-uncommitted',
                    m.fresh ? 'is-fresh' : '',
                    m.flashCommit ? 'is-flip' : '',
                  ].join(' ');
                  return (
                    <g key={`cell-${pi}-${realOffset}`}>
                      <rect
                        className={cls}
                        x={cx}
                        y={cy}
                        width={cellW}
                        height={cellH}
                        rx={5}
                        style={{ '--keo-cell-hue': `var(${m.hue})` }}
                      />
                      <text className="keo-cell-off" x={cx + cellW / 2} y={cy + 13}>{`@${realOffset}`}</text>
                      <text className="keo-cell-seq" x={cx + cellW / 2} y={cy + 25}>{`s${m.seq}`}</text>
                    </g>
                  );
                })}

                {/* dropped-duplicate flash marker — NOT a new cell */}
                {flashHere && (
                  <g className="keo-dup">
                    <rect
                      className="keo-dup-box"
                      x={trackRight - 2}
                      y={y + (rowH - 22) / 2}
                      width={4}
                      height={22}
                      rx={2}
                    />
                    <text className="keo-dup-text" x={trackRight - 8} y={y + rowH / 2 - 14} textAnchor="end">
                      {`dup seq ${state.flash.seq} dropped`}
                    </text>
                  </g>
                )}

                {overflow > 0 && (
                  <text className="keo-overflow" x={trackRight + 8} y={y + rowH / 2 + 4} textAnchor="start">
                    {`+${overflow}`}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="keo-metrics">
        <div className="keo-metric">
          <span className="keo-metric-label">producer id</span>
          <span className="keo-metric-value">{`PID ${PID}`}</span>
        </div>
        <div className="keo-metric">
          <span className="keo-metric-label">next seq · p0 / p1</span>
          <span className="keo-metric-value is-accent">{`${state.nextSeq[0]} / ${state.nextSeq[1]}`}</span>
        </div>
        <div className="keo-metric">
          <span className="keo-metric-label">total appended</span>
          <span className="keo-metric-value">{state.appended}</span>
        </div>
        <div className="keo-metric">
          <span className="keo-metric-label">duplicates dropped</span>
          <span className={`keo-metric-value ${state.dropped > 0 ? 'is-warn' : ''}`}>{state.dropped}</span>
        </div>
        <div className="keo-metric">
          <span className="keo-metric-label">in-flight (uncommitted)</span>
          <span className={`keo-metric-value ${uncommitted > 0 ? 'is-open' : ''}`}>{uncommitted}</span>
        </div>
        <div className="keo-metric">
          <span className="keo-metric-label">consumer sees (committed)</span>
          <span className="keo-metric-value is-ok">{committedSeen}</span>
        </div>
        <div className="keo-metric keo-metric-dim">
          <span className="keo-metric-label">txn state</span>
          <span className={`keo-metric-value ${txnTone ? `is-${txnTone}` : ''}`}>{state.txnState}</span>
        </div>
      </div>

      <div className={`keo-narration is-${state.tone}`}>
        <span className={`keo-narration-label is-${state.tone}`}>
          {state.tone === 'dedup' ? 'deduped'
            : state.tone === 'append' ? 'appended'
              : state.tone === 'txn' ? 'uncommitted'
                : state.tone === 'commit' ? 'commit'
                  : state.tone === 'abort' ? 'abort' : 'ready'}
        </span>
        <span className="keo-narration-body">{state.note}</span>
      </div>

      <div className="keo-legend">
        <span className="keo-legend-item"><Send size={13} className="keo-ic" /> new seq appends a committed cell</span>
        <span className="keo-legend-item"><Repeat size={13} className="keo-ic is-warn" /> retried seq is deduped — no new cell</span>
        <span className="keo-legend-item"><AlertTriangle size={13} className="keo-ic is-open" /> uncommitted cell — dashed, not yet visible</span>
        <span className="keo-legend-item"><Eye size={13} className="keo-ic is-ok" /> committed cell — read_committed sees it</span>
        <span className="keo-legend-item"><KeyRound size={13} className="keo-ic is-dim" /> one PID + per-partition seq is the dedupe key</span>
      </div>
    </div>
  );
}
