import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Send, Database, Cpu, RefreshCw, MoveRight, Layers } from 'lucide-react';
import './KafkaConsumerGroupViz.css';

// Kafka consumer group reading one partitioned topic. A topic is split into P
// fixed partitions; a consumer GROUP of C members reads it cooperatively under
// one invariant: a partition is owned by AT MOST ONE consumer in the group at a
// time (a consumer may own several partitions; a partition is never shared).
//
// Assignment is the range strategy: partitions are sorted and cut into C as-even-
// as-possible contiguous blocks, block i -> consumer i. The first (P mod C)
// consumers take one extra partition each. This is deterministic — no Math.random.
//
// Producers append records, advancing each partition's log-end-offset (LEO).
// Consumers read forward, advancing the committed offset. LAG = LEO - committed,
// per partition and summed per consumer. Adding or removing a consumer triggers a
// REBALANCE: partitions are reassigned across the new member set and the ones that
// changed owner are highlighted as MOVED.

const P = 6; // fixed partition count
const HUES = ['--hue-violet', '--hue-sky', '--hue-pink', '--hue-mint', '--accent', '--warning'];
const TICK_MS = 950; // base stream tick; divided by speed
const REBAL_MS = 900; // how long the "rebalancing" banner shows

// Range assignment: partition index -> consumer index, contiguous blocks.
// Returns an array length P of consumer indices (0..C-1), or -1 if C === 0.
function rangeAssign(consumerCount) {
  const out = new Array(P).fill(-1);
  if (consumerCount <= 0) return out;
  const base = Math.floor(P / consumerCount);
  const extra = P % consumerCount; // first `extra` consumers get one more
  let p = 0;
  for (let c = 0; c < consumerCount; c += 1) {
    const span = base + (c < extra ? 1 : 0);
    for (let k = 0; k < span && p < P; k += 1, p += 1) out[p] = c;
  }
  return out;
}

function freshPartitions() {
  return Array.from({ length: P }, (_, i) => ({
    id: i,
    leo: 0, // log-end-offset (records appended)
    committed: 0, // consumed up to here
  }));
}

function newConsumer(id) {
  return { id };
}

function freshState(consumerCount) {
  return {
    partitions: freshPartitions(),
    consumers: Array.from({ length: consumerCount }, (_, i) => newConsumer(i)),
    assign: rangeAssign(consumerCount),
    produced: 0,
    consumed: 0,
    moved: new Set(), // partition ids whose owner just changed
    rebalancing: false,
    note: 'A group of two consumers shares six partitions. Produce records to grow the logs, then let consumers catch up. Add or remove a consumer to trigger a rebalance.',
    tone: 'init',
  };
}

// Append records to partitions, round-robin across partitions for a balanced load.
function produce(state, count) {
  const partitions = state.partitions.map((p) => ({ ...p }));
  const start = state.produced % P;
  for (let k = 0; k < count; k += 1) {
    partitions[(start + k) % P].leo += 1;
  }
  const produced = state.produced + count;
  const totalLag = partitions.reduce((s, p) => s + (p.leo - p.committed), 0);
  return {
    ...state,
    partitions,
    produced,
    moved: new Set(),
    note: `Produced ${count} record${count === 1 ? '' : 's'} across the partitions — log-end offsets advanced. Total lag is now ${totalLag}; consumers must read forward to close it.`,
    tone: 'produce',
  };
}

// Advance committed offsets toward the log-end for partitions that have an owner.
// `step` records consumed per owned partition per tick. Idle partitions (no owner)
// cannot progress — their lag is stuck until a consumer takes them.
function consume(state, step) {
  const partitions = state.partitions.map((p) => ({ ...p }));
  let consumedDelta = 0;
  partitions.forEach((p, i) => {
    if (state.assign[i] < 0) return; // no owner -> cannot advance
    const room = p.leo - p.committed;
    const take = Math.min(step, room);
    p.committed += take;
    consumedDelta += take;
  });
  const totalLag = partitions.reduce((s, p) => s + (p.leo - p.committed), 0);
  const consumed = state.consumed + consumedDelta;
  let note;
  let tone = 'consume';
  if (consumedDelta === 0) {
    note = totalLag === 0
      ? 'All caught up — every owned partition is read to its log end, lag is zero. Consumers idle until the next record arrives.'
      : 'No owned partition has unread records this tick. Lag that remains belongs to partitions with no consumer — produce more or rebalance to drain it.';
    tone = totalLag === 0 ? 'ok' : 'warn';
  } else {
    note = `Consumers read ${consumedDelta} record${consumedDelta === 1 ? '' : 's'} forward — committed offsets advanced, total lag dropped to ${totalLag}.`;
  }
  return { ...state, partitions, consumed, moved: new Set(), note, tone };
}

// Reassign partitions to a new consumer count and report which moved.
function rebalance(state, nextCount, kind) {
  const before = state.assign;
  const after = rangeAssign(nextCount);
  const moved = new Set();
  const movePairs = [];
  for (let i = 0; i < P; i += 1) {
    if (before[i] !== after[i]) {
      moved.add(i);
      movePairs.push({ part: i, from: before[i], to: after[i] });
    }
  }
  const consumers = Array.from({ length: nextCount }, (_, i) => newConsumer(i));

  const idle = Math.max(0, nextCount - P);
  let detail;
  if (movePairs.length === 0) {
    detail = 'no partition changed owner.';
  } else {
    const sample = movePairs.slice(0, 3).map((m) => (
      m.from < 0
        ? `partition ${m.part} assigned to consumer ${m.to + 1}`
        : m.to < 0
          ? `partition ${m.part} left consumer ${m.from + 1}`
          : `partition ${m.part} moved from consumer ${m.from + 1} to consumer ${m.to + 1}`
    ));
    detail = sample.join('; ') + (movePairs.length > 3 ? `; and ${movePairs.length - 3} more` : '') + '.';
  }
  const idleNote = idle > 0
    ? ` With ${nextCount} consumers but only ${P} partitions, ${idle} consumer${idle === 1 ? '' : 's'} sit idle — wasted capacity, since a partition is never shared.`
    : '';

  return {
    ...state,
    consumers,
    assign: after,
    moved,
    rebalancing: true,
    note: `Rebalance (${kind}): ${detail}${idleNote}`,
    tone: kind === 'add' ? 'add' : 'remove',
  };
}

export default function KafkaConsumerGroupViz() {
  const [consumerCount, setConsumerCount] = useState(2);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [state, setState] = useState(() => freshState(2));

  const streamTimer = useRef(null);
  const rebalTimer = useRef(null);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  const delay = useMemo(() => Math.round(TICK_MS / speed), [speed]);

  // Auto stream: each tick produces a small burst then lets consumers read a step.
  useEffect(() => {
    if (!isRunning) return undefined;
    streamTimer.current = setInterval(() => {
      setState((prev) => {
        if (prev.rebalancing) return prev;
        const afterProduce = produce(prev, 2);
        return consume(afterProduce, 2);
      });
    }, delay);
    return () => {
      if (streamTimer.current) {
        clearInterval(streamTimer.current);
        streamTimer.current = null;
      }
    };
  }, [isRunning, delay]);

  useEffect(() => () => {
    if (streamTimer.current) clearInterval(streamTimer.current);
    if (rebalTimer.current) clearTimeout(rebalTimer.current);
  }, []);

  const clearRebalanceSoon = () => {
    if (rebalTimer.current) clearTimeout(rebalTimer.current);
    rebalTimer.current = setTimeout(() => {
      setState((prev) => ({ ...prev, rebalancing: false }));
    }, REBAL_MS);
  };

  const doProduce = () => {
    setState((prev) => (prev.rebalancing ? prev : produce(prev, 3)));
  };

  const doConsume = () => {
    setState((prev) => (prev.rebalancing ? prev : consume(prev, 3)));
  };

  const addConsumer = () => {
    if (consumerCount >= P) return;
    const next = consumerCount + 1;
    setConsumerCount(next);
    setState((prev) => rebalance(prev, next, 'add'));
    clearRebalanceSoon();
  };

  const removeConsumer = () => {
    if (consumerCount <= 1) return;
    const next = consumerCount - 1;
    setConsumerCount(next);
    setState((prev) => rebalance(prev, next, 'remove'));
    clearRebalanceSoon();
  };

  const reset = () => {
    setIsRunning(false);
    if (rebalTimer.current) clearTimeout(rebalTimer.current);
    setConsumerCount(2);
    setState(freshState(2));
  };

  const { partitions, consumers, assign } = state;
  const C = consumers.length;

  const colorVar = (consumerIdx) => (consumerIdx >= 0 ? HUES[consumerIdx % HUES.length] : '--text-dim');

  // Per-consumer derived stats: partition ids owned + summed lag.
  const consumerStats = useMemo(() => consumers.map((c) => {
    const owned = [];
    let lag = 0;
    partitions.forEach((p, i) => {
      if (assign[i] === c.id) {
        owned.push(i);
        lag += p.leo - p.committed;
      }
    });
    return { id: c.id, owned, lag };
  }), [consumers, partitions, assign]);

  const totalLag = partitions.reduce((s, p) => s + (p.leo - p.committed), 0);
  const idleConsumers = consumerStats.filter((s) => s.owned.length === 0).length;
  const unownedPartitions = assign.filter((a) => a < 0).length;

  // SVG geometry — partitions stacked on the left, consumers on the right.
  const W = 960;
  const H = 70 + P * 62 + 24;

  const partX = 24;
  const partLabelW = 92;
  const logX = partX + partLabelW;
  const logRight = 560;
  const logW = logRight - logX;
  const rowTop = 64;
  const rowH = 62;
  const partH = 42;
  const rowY = (i) => rowTop + i * rowH;

  // committed cells then unread (lag) cells, capped so the row always fits.
  const MAX_CELLS = 12;
  const cellGap = 4;

  const consX = 700;
  const consW = 236;
  const consBoxGap = 14;
  const consCount = Math.max(C, 1);
  const consAreaTop = 64;
  const consAreaH = P * rowH - 8;
  const consH = (consAreaH - (consCount - 1) * consBoxGap) / consCount;
  const consY = (i) => consAreaTop + i * (consH + consBoxGap);

  const playLabel = isRunning ? 'Pause' : 'Play';
  const narrTone = state.tone === 'warn' ? 'is-warn'
    : state.tone === 'add' ? 'is-add'
      : state.tone === 'remove' ? 'is-remove' : '';
  const narrLabel = state.tone === 'add' ? 'rebalance'
    : state.tone === 'remove' ? 'rebalance'
      : state.tone === 'produce' ? 'produce'
        : state.tone === 'warn' ? 'lag'
          : state.tone === 'ok' ? 'caught up'
            : state.tone === 'consume' ? 'consume' : 'ready';

  return (
    <div className="kcg">
      <div className="kcg-head">
        <h3 className="kcg-title">Kafka consumer group — partitions, assignment, lag, and rebalance</h3>
        <p className="kcg-sub">
          Six partitions are split across a group of consumers under one rule: a partition is owned by at most
          one consumer. Produce records to build lag, consume to drain it, and add or remove a consumer to watch
          partitions reassign.
        </p>
      </div>

      <div className="kcg-controls">
        <div className="kcg-stepper" role="group" aria-label="Consumer count">
          <span className="kcg-input-label">consumers</span>
          <button
            type="button"
            className="kcg-stepper-btn"
            onClick={removeConsumer}
            disabled={consumerCount <= 1}
            aria-label="Remove a consumer"
          >
            <Minus size={13} />
          </button>
          <span className="kcg-stepper-value">{consumerCount}</span>
          <button
            type="button"
            className="kcg-stepper-btn"
            onClick={addConsumer}
            disabled={consumerCount >= P}
            aria-label="Add a consumer"
          >
            <Plus size={13} />
          </button>
        </div>

        <label className="kcg-speed">
          <span className="kcg-input-label">stream speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="kcg-speed-range"
            aria-label="Stream speed"
          />
          <span className="kcg-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="kcg-spacer" aria-hidden="true" />

        <div className="kcg-buttons">
          <button
            type="button"
            className="kcg-btn kcg-btn-primary"
            onClick={() => setIsRunning((v) => !v)}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="kcg-btn"
            onClick={doProduce}
            disabled={state.rebalancing}
            title="Append records to the partitions (log-end offsets advance)"
          >
            <Send size={14} /> Produce
          </button>
          <button
            type="button"
            className="kcg-btn"
            onClick={doConsume}
            disabled={state.rebalancing || totalLag === 0}
            title={totalLag === 0 ? 'Nothing to consume — lag is zero' : 'Advance committed offsets on owned partitions'}
          >
            <Cpu size={14} /> Consume
          </button>
          <button type="button" className="kcg-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="kcg-stage">
        {state.rebalancing && (
          <div className="kcg-rebal-banner">
            <RefreshCw size={14} className="kcg-ic kcg-spin" /> rebalancing — reassigning partitions across the group
          </div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="kcg-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="kcg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="kcg-ah" />
            </marker>
          </defs>

          {/* column labels */}
          <text className="kcg-col-label" x={partX} y={40} textAnchor="start">topic — {P} partitions</text>
          <text className="kcg-col-label" x={consX} y={40} textAnchor="start">{`consumer group (${C})`}</text>

          {/* partition rows */}
          {partitions.map((p, i) => {
            const y = rowY(i);
            const ownerIdx = assign[i];
            const isMoved = state.moved.has(i);
            const unowned = ownerIdx < 0;
            const lag = p.leo - p.committed;
            const cellsToShow = Math.min(MAX_CELLS, Math.max(p.leo, 1));
            const cellW = (logW - 14 - (cellsToShow - 1) * cellGap) / cellsToShow;
            const cellY = y + (partH - 22) / 2 + 4;
            const cellH = 22;
            // map a global record index window to the visible cells (tail of the log)
            const offsetStart = Math.max(0, p.leo - cellsToShow);
            return (
              <g key={`part-${p.id}`}>
                {/* partition label box */}
                <rect
                  className={`kcg-part-label ${isMoved ? 'is-moved' : ''} ${unowned ? 'is-unowned' : ''}`}
                  x={partX}
                  y={y}
                  width={partLabelW - 10}
                  height={partH}
                  rx={8}
                  style={!unowned ? { stroke: `var(${colorVar(ownerIdx)})` } : undefined}
                />
                <g transform={`translate(${partX + 10}, ${y + 9})`}>
                  <Database width={13} height={13} className="kcg-ic" />
                </g>
                <text className="kcg-part-name" x={partX + 30} y={y + 19}>{`P${p.id}`}</text>
                <text className="kcg-part-sub" x={partX + 10} y={y + 34}>
                  {unowned ? 'no owner' : `c${ownerIdx + 1}`}
                </text>

                {/* log cells: committed (filled) then unread (lag) */}
                {Array.from({ length: cellsToShow }).map((_, k) => {
                  const absOffset = offsetStart + k;
                  const cx = logX + 7 + k * (cellW + cellGap);
                  const exists = absOffset < p.leo;
                  const isCommitted = absOffset < p.committed;
                  const cls = !exists
                    ? 'is-empty'
                    : isCommitted
                      ? 'is-committed'
                      : 'is-lag';
                  return (
                    <rect
                      key={`cell-${i}-${k}`}
                      className={`kcg-cell ${cls}`}
                      x={cx}
                      y={cellY}
                      width={cellW}
                      height={cellH}
                      rx={3}
                      style={isCommitted && !unowned ? { fill: `var(${colorVar(ownerIdx)})` } : undefined}
                    />
                  );
                })}

                {/* committed-offset marker line */}
                {p.leo > 0 && (() => {
                  const committedCells = Math.min(cellsToShow, Math.max(0, p.committed - offsetStart));
                  const markX = logX + 7 + committedCells * (cellW + cellGap) - cellGap / 2;
                  return (
                    <line
                      className="kcg-commit-mark"
                      x1={markX}
                      y1={cellY - 4}
                      x2={markX}
                      y2={cellY + cellH + 4}
                    />
                  );
                })()}

                {/* per-partition readouts */}
                <text className="kcg-part-offset" x={logRight + 8} y={y + 15} textAnchor="start">
                  {`LEO ${p.leo}`}
                </text>
                <text className={`kcg-part-lag ${lag > 0 ? 'is-lag' : 'is-zero'}`} x={logRight + 8} y={y + 33} textAnchor="start">
                  {`lag ${lag}`}
                </text>

                {/* assignment edge to its consumer */}
                {!unowned && (
                  <path
                    className={`kcg-edge ${isMoved ? 'is-moved' : ''}`}
                    d={`M ${logRight + 66} ${y + partH / 2} C ${consX - 40} ${y + partH / 2}, ${consX - 40} ${consY(ownerIdx) + consH / 2}, ${consX} ${consY(ownerIdx) + consH / 2}`}
                    style={{ stroke: `var(${colorVar(ownerIdx)})` }}
                    markerEnd="url(#kcg-arrow)"
                  />
                )}
              </g>
            );
          })}

          {/* consumers */}
          {consumerStats.map((c) => {
            const y = consY(c.id);
            const idle = c.owned.length === 0;
            return (
              <g key={`cons-${c.id}`}>
                <rect
                  className={`kcg-cons ${idle ? 'is-idle' : ''}`}
                  x={consX}
                  y={y}
                  width={consW}
                  height={consH}
                  rx={10}
                  style={!idle ? { stroke: `var(${colorVar(c.id)})` } : undefined}
                />
                <rect
                  className="kcg-cons-swatch"
                  x={consX}
                  y={y}
                  width={6}
                  height={consH}
                  rx={3}
                  style={{ fill: `var(${colorVar(idle ? -1 : c.id)})` }}
                />
                <g transform={`translate(${consX + 16}, ${y + 12})`}>
                  <Cpu width={14} height={14} className="kcg-ic" />
                </g>
                <text className="kcg-cons-title" x={consX + 38} y={y + 24}>{`consumer ${c.id + 1}`}</text>
                <text className={`kcg-cons-state ${idle ? 'is-idle' : 'is-active'}`} x={consX + consW - 12} y={y + 24} textAnchor="end">
                  {idle ? 'idle' : 'active'}
                </text>
                <text className="kcg-cons-owns" x={consX + 16} y={y + consH - 26} textAnchor="start">
                  {idle ? 'owns no partition' : `owns ${c.owned.map((p) => `P${p}`).join(' ')}`}
                </text>
                <text className="kcg-cons-k" x={consX + 16} y={y + consH - 10} textAnchor="start">
                  {`${c.owned.length} part`}
                </text>
                <text className={`kcg-cons-lag ${c.lag > 0 ? 'is-lag' : 'is-zero'}`} x={consX + consW - 12} y={y + consH - 10} textAnchor="end">
                  {`lag ${c.lag}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="kcg-metrics">
        <div className="kcg-metric">
          <span className="kcg-metric-label">partitions</span>
          <span className="kcg-metric-value">{P}</span>
        </div>
        <div className="kcg-metric">
          <span className="kcg-metric-label">consumers</span>
          <span className="kcg-metric-value">{C}</span>
        </div>
        <div className="kcg-metric">
          <span className="kcg-metric-label">total lag</span>
          <span className={`kcg-metric-value ${totalLag > 0 ? 'is-warn' : 'is-ok'}`}>{totalLag}</span>
        </div>
        <div className="kcg-metric">
          <span className="kcg-metric-label">records produced</span>
          <span className="kcg-metric-value is-accent">{state.produced}</span>
        </div>
        <div className="kcg-metric">
          <span className="kcg-metric-label">records consumed</span>
          <span className="kcg-metric-value is-ok">{state.consumed}</span>
        </div>
        <div className="kcg-metric kcg-metric-dim">
          <span className="kcg-metric-label">idle consumers</span>
          <span className={`kcg-metric-value ${idleConsumers > 0 ? 'is-warn' : ''}`}>{idleConsumers}</span>
        </div>
      </div>

      <div className={`kcg-narration ${narrTone}`}>
        <span className={`kcg-narration-label ${narrTone}`}>{narrLabel}</span>
        <span className="kcg-narration-body">{state.note}</span>
      </div>

      <div className="kcg-legend">
        <span className="kcg-legend-item"><Layers size={13} className="kcg-ic" /> filled cells = committed; outlined cells = unread lag</span>
        <span className="kcg-legend-item"><Cpu size={13} className="kcg-ic" /> each partition is owned by one consumer, colored to match</span>
        <span className="kcg-legend-item"><MoveRight size={13} className="kcg-ic is-warn" /> dashed edge = partition reassigned on the last rebalance</span>
        <span className="kcg-legend-item"><RefreshCw size={13} className="kcg-ic is-dim" /> {unownedPartitions > 0 ? `${unownedPartitions} partition(s) without an owner` : 'every partition has an owner'}</span>
      </div>
    </div>
  );
}
