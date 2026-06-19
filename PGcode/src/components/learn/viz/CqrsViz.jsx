import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, PenLine, Search, Database, RefreshCw, Zap } from 'lucide-react';
import './CqrsViz.css';

const INIT_BALANCE = 100;

const INIT_OPS = [
  { type: 'command', op: 'deposit', amount: 50 },
  { type: 'query' },
  { type: 'command', op: 'withdraw', amount: 20 },
  { type: 'query' },
];

const COMMAND_CYCLE = [
  { op: 'deposit', amount: 50 },
  { op: 'withdraw', amount: 20 },
  { op: 'deposit', amount: 30 },
  { op: 'withdraw', amount: 15 },
  { op: 'deposit', amount: 10 },
];

function applyOp(balance, op, amount) {
  return op === 'deposit' ? balance + amount : balance - amount;
}

function buildFrames(ops, lag) {
  const frames = [];
  let writeModel = INIT_BALANCE;
  let readModel = INIT_BALANCE;
  let eventCount = 0;
  let inFlight = [];
  let lastQuery = null;
  let cmdSeq = 0;

  const snap = (extra) => ({
    writeModel,
    readModel,
    eventCount,
    inFlight: inFlight.map((e) => ({ ...e })),
    lastQuery,
    flow: null,
    actorSide: null,
    phase: 'idle',
    ...extra,
  });

  frames.push(snap({
    phase: 'init',
    note: `Account starts at ${INIT_BALANCE}. The write model (left) handles commands and appends events; the read model (right) answers queries from a denormalized projection. ${lag ? 'Replication lag is ON — events sit in flight before the read model catches up.' : 'Replication lag is OFF — the read model updates the instant an event is emitted.'}`,
  }));

  for (const item of ops) {
    if (item.type === 'command') {
      cmdSeq += 1;
      const before = writeModel;
      writeModel = applyOp(writeModel, item.op, item.amount);
      eventCount += 1;
      const evt = { id: eventCount, label: `${item.op === 'deposit' ? '+' : '-'}${item.amount}`, value: writeModel, seq: cmdSeq };

      frames.push(snap({
        phase: 'command',
        actorSide: 'write',
        flow: 'command-in',
        note: `Command ${cmdSeq}: ${item.op} ${item.amount}. The write model validates and mutates: ${before} -> ${writeModel}.`,
      }));

      if (lag) {
        inFlight = [...inFlight, evt];
        frames.push(snap({
          phase: 'append',
          actorSide: 'write',
          flow: 'append',
          note: `Event #${eventCount} (${evt.label}) appended to the event store and dispatched. With lag ON it is in flight — the read model still shows the OLD value ${readModel}.`,
        }));
      } else {
        inFlight = [...inFlight, evt];
        frames.push(snap({
          phase: 'append',
          actorSide: 'write',
          flow: 'append',
          note: `Event #${eventCount} (${evt.label}) appended to the event store and dispatched toward the read model.`,
        }));
        const applied = evt;
        readModel = applied.value;
        inFlight = inFlight.filter((e) => e.id !== applied.id);
        frames.push(snap({
          phase: 'apply',
          actorSide: 'read',
          flow: 'apply',
          note: `Projection applies event #${applied.id} immediately -> read model becomes ${readModel}. Write and read are now in sync.`,
        }));
      }
    } else {
      const stale = lag && readModel !== writeModel;
      lastQuery = { value: readModel, stale, writeNow: writeModel };
      frames.push(snap({
        phase: 'query',
        actorSide: 'read',
        flow: 'query',
        note: stale
          ? `Query reads the read model -> returns ${readModel}. The write model is already ${writeModel}, so the client sees a STALE value: ${inFlight.length} event(s) haven't been applied yet. This is eventual consistency.`
          : `Query reads the read model -> returns ${readModel}. It matches the write model, so the client sees a fully consistent value.`,
      }));
    }
  }

  if (lag && inFlight.length > 0) {
    while (inFlight.length > 0) {
      const applied = inFlight[0];
      readModel = applied.value;
      inFlight = inFlight.slice(1);
      frames.push(snap({
        phase: 'apply',
        actorSide: 'read',
        flow: 'apply',
        note: `Replication catches up: projection applies event #${applied.id} -> read model becomes ${readModel}.${inFlight.length === 0 ? ' Read model has now converged with the write model — eventual consistency reached.' : ''}`,
      }));
    }
  }

  frames.push(snap({
    phase: 'done',
    note: `Done. Write model = ${writeModel}, read model = ${readModel}. ${eventCount} event(s) total, ${inFlight.length} still in flight. ${readModel === writeModel ? 'Both sides agree — the system has converged.' : ''}`,
  }));

  return frames;
}

export default function CqrsViz() {
  const [lag, setLag] = useState(true);
  const [ops, setOps] = useState(INIT_OPS);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(ops, lag), [ops, lag]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const addCommand = () => {
    const cmdCount = ops.filter((o) => o.type === 'command').length;
    const next = COMMAND_CYCLE[cmdCount % COMMAND_CYCLE.length];
    setIsRunning(false);
    setOps((os) => [...os, { type: 'command', op: next.op, amount: next.amount }]);
    setStep(totalSteps);
  };

  const addQuery = () => {
    setIsRunning(false);
    setOps((os) => [...os, { type: 'query' }]);
    setStep(totalSteps);
  };

  const toggleLag = () => {
    setIsRunning(false);
    const nextLag = !lag;
    setLag(nextLag);
    setStep(Math.min(step, buildFrames(ops, nextLag).length - 1));
  };

  const restart = () => {
    setIsRunning(false);
    setLag(true);
    setOps(INIT_OPS);
    setStep(0);
  };

  const W = 940;
  const H = 420;
  const midX = W / 2;

  const cmdX = 70;
  const cmdW = 150;
  const writeX = 270;
  const boxW = 168;
  const writeY = 78;
  const storeY = 246;
  const readX = W - 270 - boxW;
  const queryX = W - 70 - cmdW;

  const writeMid = writeX + boxW / 2;
  const readMid = readX + boxW / 2;

  const flow = current.flow;
  const cmdActive = flow === 'command-in';
  const appendActive = flow === 'append';
  const applyActive = flow === 'apply';
  const queryActive = flow === 'query';

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const synced = current.readModel === current.writeModel;

  return (
    <div className="cqv">
      <div className="cqv-head">
        <h3 className="cqv-title">CQRS — commands write, queries read, events bridge the two</h3>
        <p className="cqv-sub">
          The write model mutates and emits events to an append-only store. A denormalized read model answers queries.
          Turn on replication lag to watch a query right after a command see the old value — eventual consistency.
        </p>
      </div>

      <div className="cqv-controls">
        <div className="cqv-group">
          <button type="button" className="cqv-btn" onClick={addCommand}>
            <PenLine size={13} /> command
          </button>
          <button type="button" className="cqv-btn" onClick={addQuery}>
            <Search size={13} /> query
          </button>
        </div>

        <button
          type="button"
          className={`cqv-btn cqv-lag ${lag ? 'is-on' : ''}`}
          onClick={toggleLag}
          aria-pressed={lag}
        >
          <Zap size={13} /> replication lag: {lag ? 'on' : 'off'}
        </button>

        <label className="cqv-speed">
          <span className="cqv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="cqv-speed-range"
            aria-label="Playback speed"
          />
          <span className="cqv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="cqv-spacer" aria-hidden="true" />

        <div className="cqv-group">
          <button
            type="button"
            className="cqv-btn cqv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
            disabled={totalSteps <= 1}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="cqv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="cqv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="cqv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="cqv-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="cqv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="cqv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="cqv-svg" preserveAspectRatio="xMidYMid meet">
          <line className="cqv-divider" x1={midX} y1={28} x2={midX} y2={H - 20} />
          <text className="cqv-side-label is-write" x={writeMid} y={24} textAnchor="middle">write side · commands</text>
          <text className="cqv-side-label is-read" x={readMid} y={24} textAnchor="middle">read side · queries</text>

          <g className={`cqv-port ${cmdActive ? 'is-active' : ''}`}>
            <rect className="cqv-client is-write" x={cmdX} y={writeY} width={cmdW} height={64} rx={10} />
            <text className="cqv-client-label" x={cmdX + cmdW / 2} y={writeY + 26}>Commands</text>
            <text className="cqv-client-sub" x={cmdX + cmdW / 2} y={writeY + 46}>deposit · withdraw</text>
          </g>

          <line
            className={`cqv-link is-write ${cmdActive ? 'is-active' : ''}`}
            x1={cmdX + cmdW}
            y1={writeY + 32}
            x2={writeX}
            y2={writeY + 32}
            markerEnd="url(#cqv-arrow-write)"
          />

          <rect
            className={`cqv-model is-write ${current.actorSide === 'write' ? 'is-active' : ''}`}
            x={writeX}
            y={writeY}
            width={boxW}
            height={64}
            rx={12}
          />
          <text className="cqv-model-title is-write" x={writeMid} y={writeY + 22}>Command Model</text>
          <text className="cqv-model-val" x={writeMid} y={writeY + 50}>{current.writeModel}</text>

          <line
            className={`cqv-link is-write ${appendActive ? 'is-active' : ''}`}
            x1={writeMid}
            y1={writeY + 64}
            x2={writeMid}
            y2={storeY}
            markerEnd="url(#cqv-arrow-write)"
          />

          <g>
            <rect
              className={`cqv-store ${appendActive ? 'is-active' : ''}`}
              x={writeX}
              y={storeY}
              width={boxW}
              height={104}
              rx={12}
            />
            <Database x={writeX + 14} y={storeY + 12} width={16} height={16} className="cqv-store-icon" />
            <text className="cqv-model-title is-write" x={writeMid + 12} y={storeY + 24}>Event Store</text>
            <text className="cqv-store-cap" x={writeMid} y={storeY + 44}>append-only log · {current.eventCount} event(s)</text>
            {Array.from({ length: Math.min(5, current.eventCount) }).map((_, i, arr) => {
              const slotW = (boxW - 28) / 5;
              const ex = writeX + 14 + i * slotW;
              const idx = current.eventCount - arr.length + i;
              const flying = current.inFlight.some((e) => e.id === idx + 1);
              return (
                <rect
                  key={`evt-${i}`}
                  className={`cqv-evt ${flying ? 'is-flight' : 'is-stored'}`}
                  x={ex}
                  y={storeY + 58}
                  width={slotW - 5}
                  height={30}
                  rx={5}
                />
              );
            })}
          </g>

          {current.inFlight.length > 0 && (
            <g>
              <line
                className={`cqv-link is-flight ${applyActive ? 'is-active' : ''}`}
                x1={writeX + boxW}
                y1={storeY + 52}
                x2={readX}
                y2={storeY + 52}
                markerEnd="url(#cqv-arrow-flight)"
              />
              <rect
                className={`cqv-flight-pkt ${applyActive ? 'is-applying' : ''}`}
                x={midX - 22}
                y={storeY + 38}
                width={44}
                height={28}
                rx={6}
              />
              <text className="cqv-flight-label" x={midX} y={storeY + 57}>
                {current.inFlight[0].label}
              </text>
              <text className="cqv-flight-cap" x={midX} y={storeY + 86} textAnchor="middle">
                {current.inFlight.length} event(s) in flight
              </text>
            </g>
          )}

          {current.inFlight.length === 0 && (
            <line
              className={`cqv-link is-synced ${applyActive ? 'is-active' : ''}`}
              x1={writeX + boxW}
              y1={storeY + 52}
              x2={readX}
              y2={storeY + 52}
              markerEnd="url(#cqv-arrow-read)"
            />
          )}

          <rect
            className={`cqv-model is-read ${current.actorSide === 'read' && (applyActive || queryActive) ? 'is-active' : ''}`}
            x={readX}
            y={writeY}
            width={boxW}
            height={64}
            rx={12}
          />
          <text className="cqv-model-title is-read" x={readMid} y={writeY + 22}>Read Model</text>
          <text className="cqv-model-val" x={readMid} y={writeY + 50}>{current.readModel}</text>

          <line
            className={`cqv-link is-read ${applyActive ? 'is-active' : ''}`}
            x1={readMid}
            y1={storeY}
            x2={readMid}
            y2={writeY + 64}
            markerEnd="url(#cqv-arrow-read)"
          />

          <line
            className={`cqv-link is-read ${queryActive ? 'is-active' : ''}`}
            x1={readX}
            y1={writeY + 32}
            x2={queryX + cmdW}
            y2={writeY + 32}
            markerEnd="url(#cqv-arrow-read)"
          />

          <g className={`cqv-port ${queryActive ? 'is-active' : ''}`}>
            <rect className="cqv-client is-read" x={queryX} y={writeY} width={cmdW} height={64} rx={10} />
            <text className="cqv-client-label" x={queryX + cmdW / 2} y={writeY + 26}>Queries</text>
            <text className="cqv-client-sub" x={queryX + cmdW / 2} y={writeY + 46}>
              {current.lastQuery ? `client got ${current.lastQuery.value}` : 'read balance'}
            </text>
          </g>

          {current.lastQuery && queryActive && (
            <text
              className={`cqv-query-verdict ${current.lastQuery.stale ? 'is-stale' : 'is-fresh'}`}
              x={queryX + cmdW / 2}
              y={writeY + 92}
              textAnchor="middle"
            >
              {current.lastQuery.stale ? `STALE (write is ${current.lastQuery.writeNow})` : 'consistent'}
            </text>
          )}

          <defs>
            <marker id="cqv-arrow-write" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="cqv-marker is-write" />
            </marker>
            <marker id="cqv-arrow-read" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="cqv-marker is-read" />
            </marker>
            <marker id="cqv-arrow-flight" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="cqv-marker is-flight" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="cqv-metrics">
        <div className="cqv-metric">
          <span className="cqv-metric-label">write model</span>
          <span className="cqv-metric-value is-write">{current.writeModel}</span>
        </div>
        <div className="cqv-metric">
          <span className="cqv-metric-label">read model</span>
          <span className="cqv-metric-value is-read">{current.readModel}</span>
        </div>
        <div className="cqv-metric">
          <span className="cqv-metric-label">events in store</span>
          <span className="cqv-metric-value">{current.eventCount}</span>
        </div>
        <div className="cqv-metric">
          <span className="cqv-metric-label">in flight</span>
          <span className="cqv-metric-value is-flight">{current.inFlight.length}</span>
        </div>
        <div className="cqv-metric cqv-metric-dim">
          <span className="cqv-metric-label">consistency</span>
          <span className={`cqv-metric-value ${synced ? 'is-synced' : 'is-flight'}`}>
            {synced ? 'in sync' : 'eventual'}
          </span>
        </div>
      </div>

      <div className="cqv-narration">
        <span className="cqv-narration-label">trace</span>
        <span className="cqv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
