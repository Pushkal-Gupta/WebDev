import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Send, Inbox, Cpu, Check, AlertTriangle, Plus, Minus, Zap } from 'lucide-react';
import './MessageQueueViz.css';

// Message queue — a producer emits messages into a FIFO backlog, a group of N
// consumers pulls from the head, processes, and ACKs. Two delivery modes:
//   at-least-once: ACK *after* processing. A consumer failure re-enqueues the
//                  message at the head, so it may be delivered twice -> DUPLICATES.
//   at-most-once:  ACK *before* processing. A consumer failure drops the message,
//                  which is never redelivered -> LOST messages.
// The whole thing is a LIVE simulation: a setInterval tick advances producer
// emission, consumer processing, and ack/redeliver bookkeeping each frame.

const MODES = {
  'at-least-once': 'alo',
  'at-most-once': 'amo',
};
const MODE_KEYS = Object.keys(MODES);

const VISIBLE_CELLS = 12;          // queue cells drawn before "+N more"
const PROCESS_TICKS = 2;           // ticks a consumer spends processing one message
const FAIL_EVERY = 7;              // deterministic failure cadence (every Kth processed message)
const TICK_MS = 900;               // base tick interval; divided by speed

const newConsumer = (id) => ({
  id,
  msg: null,        // message currently held: { seq } | null
  remaining: 0,     // process ticks left
  state: 'idle',    // idle | processing | acking | failed
});

function freshSim(consumerCount) {
  return {
    queue: [],                                    // FIFO of { seq, redelivered }
    consumers: Array.from({ length: consumerCount }, (_, i) => newConsumer(i)),
    nextSeq: 1,                                   // next message id the producer mints
    processedTotal: 0,                            // count used for deterministic failure cadence
    acked: 0,                                     // permanently delivered + acked
    duplicates: 0,                                // re-delivered messages (at-least-once)
    lost: 0,                                      // dropped messages (at-most-once)
    peakDepth: 0,
    note: 'Press Play. The producer emits messages into the queue; consumers pull from the head, process, then ACK.',
    tone: 'init',
  };
}

// Advance the simulation by one tick. Pure-ish: returns a new state object.
// `injectFail` forces the next processing completion to fail once.
function tick(prev, mode, prodRate, injectFailRef) {
  const queue = prev.queue.map((m) => ({ ...m }));
  const consumers = prev.consumers.map((c) => ({ ...c }));
  let { nextSeq, processedTotal, acked, duplicates, lost, peakDepth } = prev;
  const events = [];

  // 1) Producer emits. prodRate may be fractional (<1 => not every tick).
  let emitBudget = prodRate;
  let emitted = 0;
  // carry the fractional part with a stable pseudo-accumulator on nextSeq parity
  const whole = Math.floor(emitBudget);
  const frac = emitBudget - whole;
  let toEmit = whole;
  if (frac > 0 && (nextSeq % 2 === 1) === (frac >= 0.5)) toEmit += 1;
  for (let i = 0; i < toEmit; i += 1) {
    queue.push({ seq: nextSeq, redelivered: false });
    emitted += 1;
    nextSeq += 1;
  }
  if (emitted > 0) events.push(`producer emitted ${emitted === 1 ? `msg #${nextSeq - 1}` : `${emitted} msgs`}`);
  emitBudget -= toEmit;

  // 2) Consumers that are mid-processing tick down; on completion they ack (or fail).
  consumers.forEach((c) => {
    if (c.state === 'processing' && c.msg) {
      c.remaining -= 1;
      if (c.remaining <= 0) {
        processedTotal += 1;
        const forced = injectFailRef.current;
        const deterministic = processedTotal % FAIL_EVERY === 0;
        const fails = forced || deterministic;
        if (forced) injectFailRef.current = false;

        if (fails) {
          c.state = 'failed';
          if (mode === 'alo') {
            // at-least-once: ack happens AFTER processing -> failure means re-enqueue at head.
            queue.unshift({ seq: c.msg.seq, redelivered: true });
            duplicates += 1;
            events.push(`consumer ${c.id + 1} FAILED msg #${c.msg.seq} — re-enqueued at head (possible duplicate)`);
          } else {
            // at-most-once: ack happened BEFORE processing -> failure means the message is LOST.
            lost += 1;
            events.push(`consumer ${c.id + 1} FAILED msg #${c.msg.seq} — already acked, message LOST`);
          }
          c.msg = null;
        } else {
          c.state = 'acking';
          acked += 1;
          events.push(`consumer ${c.id + 1} acked msg #${c.msg.seq} — removed from queue`);
          c.msg = null;
        }
      }
    } else if (c.state === 'acking' || c.state === 'failed') {
      // settle back to idle the tick after an ack/fail so the state is visible for one frame.
      c.state = 'idle';
    }
  });

  // 3) Idle consumers pull from the head of the queue.
  consumers.forEach((c) => {
    if (c.state === 'idle' && c.msg == null && queue.length > 0) {
      const m = queue.shift();
      c.msg = { seq: m.seq, redelivered: m.redelivered };
      c.remaining = PROCESS_TICKS;
      c.state = 'processing';
      events.push(`consumer ${c.id + 1} pulled msg #${m.seq}${m.redelivered ? ' (redelivery)' : ''}`);
    }
  });

  const depth = queue.length;
  peakDepth = Math.max(peakDepth, depth);

  // Narration: pick the most salient event, with a backlog framing.
  let note;
  let tone = 'run';
  const failEvent = events.find((e) => /FAILED/.test(e));
  const ackEvent = events.find((e) => /acked/.test(e));
  if (failEvent) {
    note = `${failEvent}. ${mode === 'alo' ? 'At-least-once redelivers — the same message may now be processed twice.' : 'At-most-once never retries — that message is gone for good.'}`;
    tone = mode === 'alo' ? 'warn' : 'bad';
  } else if (depth > consumers.length * 3) {
    note = `Backlog growing: producer outpaces ${consumers.length} consumer${consumers.length > 1 ? 's' : ''} (depth ${depth}). Add consumers or slow the producer to drain it.`;
    tone = 'warn';
  } else if (ackEvent) {
    note = `${ackEvent}. ${events.filter((e) => /pulled|emitted/.test(e)).join('; ') || 'Consumers keeping up with the producer.'}`;
    tone = 'run';
  } else if (events.length > 0) {
    note = events.join('; ') + '.';
  } else {
    note = depth === 0
      ? 'Queue drained — every emitted message has been delivered and acked. Consumers idle, waiting for the next message.'
      : `Consumers busy processing; ${depth} message${depth === 1 ? '' : 's'} waiting in the backlog.`;
  }

  return {
    queue,
    consumers,
    nextSeq,
    processedTotal,
    acked,
    duplicates,
    lost,
    peakDepth,
    note,
    tone,
  };
}

const STATE_LABEL = {
  idle: 'idle',
  processing: 'processing',
  acking: 'acking',
  failed: 'failed',
};

export default function MessageQueueViz() {
  const [mode, setMode] = useState(MODE_KEYS[0]);
  const [consumerCount, setConsumerCount] = useState(2);
  const [prodRate, setProdRate] = useState(1.5);
  const [speed, setSpeed] = useState(1.5);
  const [isRunning, setIsRunning] = useState(false);
  const [sim, setSim] = useState(() => freshSim(2));

  const runTimer = useRef(null);
  const injectFailRef = useRef(false);
  // refs mirror live config so the interval callback reads current values without re-subscribing.
  const modeRef = useRef(mode);
  const prodRateRef = useRef(prodRate);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { prodRateRef.current = prodRate; }, [prodRate]);

  const delay = useMemo(() => Math.round(TICK_MS / speed), [speed]);

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setInterval(() => {
      setSim((prev) => tick(prev, modeRef.current, prodRateRef.current, injectFailRef));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearInterval(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearInterval(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    injectFailRef.current = false;
    setSim(freshSim(consumerCount));
  };

  const switchMode = (m) => {
    if (m === mode) return;
    setIsRunning(false);
    injectFailRef.current = false;
    setMode(m);
    setSim(freshSim(consumerCount));
  };

  const changeConsumers = (delta) => {
    setConsumerCount((prev) => {
      const next = Math.max(1, Math.min(4, prev + delta));
      if (next === prev) return prev;
      setSim((s) => {
        const consumers = s.consumers.slice(0, next).map((c) => ({ ...c }));
        while (consumers.length < next) consumers.push(newConsumer(consumers.length));
        return { ...s, consumers };
      });
      return next;
    });
  };

  const modeKey = MODES[mode];
  const depth = sim.queue.length;
  const inFlight = sim.consumers.filter((c) => c.msg != null).length;

  // SVG geometry
  const W = 960;
  const H = 470;

  // producer (left)
  const prodW = 158;
  const prodX = 24;
  const prodH = 96;
  const prodY = 96;

  // queue (center top)
  const qX = prodX + prodW + 56;
  const qRight = W - 24;
  const qW = qRight - qX;
  const qY = 78;
  const qBoxH = 96;
  const cellGap = 6;
  const cellW = (qW - 28 - (VISIBLE_CELLS - 1) * cellGap) / VISIBLE_CELLS;
  const cellH = 40;
  const cellY = qY + 42;

  // consumer group (bottom)
  const consTop = 250;
  const consGap = 18;
  const consCount = sim.consumers.length;
  const consAreaX = qX;
  const consAreaW = qW;
  const consW = (consAreaW - (consCount - 1) * consGap) / consCount;
  const consH = 160;
  const consX = (i) => consAreaX + i * (consW + consGap);

  const visible = sim.queue.slice(0, VISIBLE_CELLS);
  const overflow = Math.max(0, depth - VISIBLE_CELLS);

  const stateTone = (st) => {
    if (st === 'acking') return 'ok';
    if (st === 'failed') return 'bad';
    if (st === 'processing') return 'busy';
    return 'neutral';
  };

  const emitting = isRunning && sim.tone !== 'init';
  const narrTone = sim.tone === 'bad' ? 'is-bad' : sim.tone === 'warn' ? 'is-warn' : '';
  const narrLabel = sim.tone === 'bad' ? 'lost'
    : sim.tone === 'warn' ? 'backlog'
      : sim.tone === 'init' ? 'ready' : 'flow';

  return (
    <div className="mqv">
      <div className="mqv-head">
        <h3 className="mqv-title">Message queue — producer, FIFO backlog, consumer group</h3>
        <p className="mqv-sub">
          A producer emits into a FIFO queue while a group of consumers pulls from the head, processes, and ACKs.
          Turn up the producer rate to grow the backlog, add consumers to drain it, and inject a failure to see
          at-least-once redeliver (a possible duplicate) versus at-most-once drop the message (a possible loss).
        </p>
      </div>

      <div className="mqv-controls">
        <div className="mqv-modes" role="tablist" aria-label="Delivery semantics">
          {MODE_KEYS.map((m) => (
            <button
              key={m}
              type="button"
              className={`mqv-mode ${mode === m ? 'is-on' : ''}`}
              onClick={() => switchMode(m)}
              aria-pressed={mode === m}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mqv-stepper" role="group" aria-label="Consumer count">
          <span className="mqv-input-label">consumers</span>
          <button
            type="button"
            className="mqv-stepper-btn"
            onClick={() => changeConsumers(-1)}
            disabled={consumerCount <= 1}
            aria-label="Remove a consumer"
          >
            <Minus size={13} />
          </button>
          <span className="mqv-stepper-value">{consumerCount}</span>
          <button
            type="button"
            className="mqv-stepper-btn"
            onClick={() => changeConsumers(1)}
            disabled={consumerCount >= 4}
            aria-label="Add a consumer"
          >
            <Plus size={13} />
          </button>
        </div>

        <label className="mqv-speed">
          <span className="mqv-input-label">producer rate</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={prodRate}
            onChange={(e) => setProdRate(Number(e.target.value))}
            className="mqv-speed-range"
            aria-label="Producer emission rate"
          />
          <span className="mqv-speed-value">{prodRate.toFixed(1)}×</span>
        </label>

        <label className="mqv-speed">
          <span className="mqv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mqv-speed-range"
            aria-label="Simulation speed"
          />
          <span className="mqv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mqv-spacer" aria-hidden="true" />

        <div className="mqv-buttons">
          <button
            type="button"
            className="mqv-btn mqv-btn-primary"
            onClick={() => setIsRunning((v) => !v)}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            className="mqv-btn mqv-btn-warn"
            onClick={() => { injectFailRef.current = true; }}
            disabled={inFlight === 0}
            title={inFlight === 0 ? 'No message in flight to fail' : 'Force the next processing completion to fail'}
          >
            <AlertTriangle size={14} /> Inject failure
          </button>
          <button type="button" className="mqv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="mqv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mqv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mqv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mqv-ah" />
            </marker>
            <marker id="mqv-arrow-flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mqv-ah-flow" />
            </marker>
          </defs>

          {/* column labels */}
          <text className="mqv-col-label" x={prodX} y={56} textAnchor="start">producer</text>
          <text className="mqv-col-label" x={qX} y={56} textAnchor="start">queue (FIFO — head pulled first)</text>
          <text className="mqv-col-label" x={consAreaX} y={consTop - 20} textAnchor="start">{`consumer group (${consCount})`}</text>

          {/* producer -> queue edge */}
          <path
            className={`mqv-edge ${emitting ? '' : 'is-flow'}`}
            d={`M ${prodX + prodW} ${prodY + prodH / 2} L ${qX} ${qY + qBoxH / 2}`}
            markerEnd={`url(#mqv-arrow${emitting ? '' : '-flow'})`}
          />

          {/* producer */}
          <rect className={`mqv-prod ${emitting ? 'is-emit' : ''}`} x={prodX} y={prodY} width={prodW} height={prodH} rx={11} />
          <g transform={`translate(${prodX + 13}, ${prodY + 13})`}>
            <Send width={15} height={15} className="mqv-ic" />
          </g>
          <text className="mqv-prod-title" x={prodX + 34} y={prodY + 25}>producer</text>
          <line className="mqv-rule" x1={prodX + 12} y1={prodY + 38} x2={prodX + prodW - 12} y2={prodY + 38} />
          <text className="mqv-prod-k" x={prodX + 13} y={prodY + 60}>rate</text>
          <text className="mqv-prod-v" x={prodX + prodW - 13} y={prodY + 60}>{prodRate.toFixed(1)}×/tick</text>
          <text className="mqv-prod-k" x={prodX + 13} y={prodY + 82}>emitted</text>
          <text className="mqv-prod-v" x={prodX + prodW - 13} y={prodY + 82}>{sim.nextSeq - 1}</text>

          {/* queue box */}
          <rect className="mqv-queue-box" x={qX} y={qY} width={qW} height={qBoxH} rx={11} />
          <g transform={`translate(${qX + 13}, ${qY + 12})`}>
            <Inbox width={15} height={15} className="mqv-ic" />
          </g>
          <text className="mqv-queue-title" x={qX + 34} y={qY + 24}>backlog</text>
          <text className="mqv-queue-sub" x={qRight - 14} y={qY + 24}>{`depth ${depth}`}</text>

          {/* queue cells */}
          {Array.from({ length: VISIBLE_CELLS }).map((_, i) => {
            const m = visible[i];
            const cx = qX + 14 + i * (cellW + cellGap);
            const isHead = i === 0 && m;
            const cls = m
              ? `is-filled ${isHead ? 'is-head' : ''} ${m.redelivered ? 'is-redeliver' : ''}`
              : '';
            return (
              <g key={`cell-${i}`}>
                <rect className={`mqv-cell ${cls}`} x={cx} y={cellY} width={cellW} height={cellH} rx={6} />
                {m
                  ? <text className="mqv-cell-text" x={cx + cellW / 2} y={cellY + cellH / 2 + 4}>{`#${m.seq}`}</text>
                  : <text className="mqv-cell-empty" x={cx + cellW / 2} y={cellY + cellH / 2 + 4}>·</text>}
              </g>
            );
          })}
          {overflow > 0 && (
            <text className="mqv-overflow" x={qRight - 14} y={cellY + cellH + 18} textAnchor="end">{`+${overflow} more`}</text>
          )}
          <text className="mqv-slot-label" x={qX + 14 + cellW / 2} y={cellY + cellH + 16} textAnchor="middle">head</text>

          {/* queue -> consumers flow edge */}
          <path
            className="mqv-edge is-flow"
            d={`M ${qX + 14 + cellW / 2} ${cellY + cellH} L ${qX + 14 + cellW / 2} ${consTop - 6}`}
            markerEnd="url(#mqv-arrow-flow)"
          />

          {/* consumers */}
          {sim.consumers.map((c, i) => {
            const x = consX(i);
            const y = consTop;
            const tone = stateTone(c.state);
            const busy = c.state === 'processing';
            const failed = c.state === 'failed';
            const ifW = consW - 28;
            const ifH = 44;
            return (
              <g key={`cons-${c.id}`}>
                <rect
                  className={`mqv-cons ${busy ? 'is-processing' : ''} ${c.state === 'acking' ? 'is-acking' : ''} ${failed ? 'is-failed' : ''}`}
                  x={x}
                  y={y}
                  width={consW}
                  height={consH}
                  rx={11}
                />
                <g transform={`translate(${x + 13}, ${y + 13})`}>
                  <Cpu width={15} height={15} className="mqv-ic" />
                </g>
                <text className="mqv-cons-title" x={x + 34} y={y + 25}>{`consumer ${c.id + 1}`}</text>
                <text className={`mqv-cons-state is-${tone}`} x={x + consW - 13} y={y + 25}>
                  {STATE_LABEL[c.state]}
                </text>
                <line className="mqv-rule" x1={x + 12} y1={y + 38} x2={x + consW - 12} y2={y + 38} />
                <text className="mqv-slot-label" x={x + consW / 2} y={y + 58} textAnchor="middle">in-flight</text>
                <rect
                  className={`mqv-cons-inflight ${busy ? 'is-busy' : ''} ${failed ? 'is-bad' : ''}`}
                  x={x + 14}
                  y={y + 66}
                  width={ifW}
                  height={ifH}
                  rx={7}
                />
                {c.msg
                  ? (
                    <text className="mqv-cons-msg" x={x + consW / 2} y={y + 66 + ifH / 2 + 4}>
                      {`#${c.msg.seq}${c.msg.redelivered ? ' (re)' : ''}`}
                    </text>
                  )
                  : <text className="mqv-cons-empty" x={x + consW / 2} y={y + 66 + ifH / 2 + 4}>empty</text>}
                {c.state === 'acking' && (
                  <g transform={`translate(${x + consW / 2 - 7}, ${y + consH - 26})`}>
                    <Check width={15} height={15} className="mqv-ic is-ok" />
                  </g>
                )}
                {failed && (
                  <g transform={`translate(${x + consW / 2 - 7}, ${y + consH - 26})`}>
                    <AlertTriangle width={15} height={15} className="mqv-ic is-bad" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mqv-metrics">
        <div className="mqv-metric">
          <span className="mqv-metric-label">queue depth</span>
          <span className={`mqv-metric-value ${depth > consCount * 3 ? 'is-warn' : ''}`}>{depth}</span>
        </div>
        <div className="mqv-metric">
          <span className="mqv-metric-label">consumer lag</span>
          <span className={`mqv-metric-value ${depth > consCount * 3 ? 'is-warn' : ''}`}>{depth + inFlight}</span>
        </div>
        <div className="mqv-metric">
          <span className="mqv-metric-label">delivered / acked</span>
          <span className="mqv-metric-value is-ok">{sim.acked}</span>
        </div>
        <div className="mqv-metric">
          <span className="mqv-metric-label">consumers</span>
          <span className="mqv-metric-value">{consCount}</span>
        </div>
        {modeKey === 'alo' ? (
          <div className="mqv-metric">
            <span className="mqv-metric-label">duplicates</span>
            <span className={`mqv-metric-value ${sim.duplicates > 0 ? 'is-warn' : ''}`}>{sim.duplicates}</span>
          </div>
        ) : (
          <div className="mqv-metric">
            <span className="mqv-metric-label">lost</span>
            <span className={`mqv-metric-value ${sim.lost > 0 ? 'is-bad' : ''}`}>{sim.lost}</span>
          </div>
        )}
        <div className="mqv-metric mqv-metric-dim">
          <span className="mqv-metric-label">delivery mode</span>
          <span className="mqv-metric-value">{mode}</span>
        </div>
      </div>

      <div className={`mqv-narration ${narrTone}`}>
        <span className={`mqv-narration-label ${sim.tone === 'bad' ? 'is-bad' : sim.tone === 'warn' ? 'is-warn' : sim.tone === 'run' ? 'is-ok' : ''}`}>
          {narrLabel}
        </span>
        <span className="mqv-narration-body">{sim.note}</span>
      </div>

      <div className="mqv-legend">
        <span className="mqv-legend-item"><Inbox size={13} className="mqv-ic" /> FIFO: head is pulled first</span>
        <span className="mqv-legend-item"><Zap size={13} className="mqv-ic is-warn" /> dashed cell = redelivered message</span>
        <span className="mqv-legend-item"><Check size={13} className="mqv-ic is-ok" /> ack removes the message permanently</span>
      </div>
    </div>
  );
}
