import React, { useMemo, useState } from 'react';
import { ScrollText, Plus, Minus, Wallet, Camera, History, RotateCcw } from 'lucide-react';
import './EventSourcingViz.css';

// Event sourcing: state is NOT stored as a mutable row. The source of truth is
// an append-only log of events. The current state is a DERIVED VALUE — a left
// fold over the events from an initial state. Replaying the prefix 0..k gives
// the state "as of" event k, which is what makes time-travel free.
//
// A deterministic event script (no Math.random) so the viz is reproducible:
//   AccountOpened -> the account exists, balance 0, status active
//   Deposited $X  -> balance += X
//   Withdrawn  $X -> balance -= X (rejected -> no-op if it would overdraw)
const SCRIPT = [
  { type: 'AccountOpened', amount: 0 },
  { type: 'Deposited', amount: 200 },
  { type: 'Deposited', amount: 150 },
  { type: 'Withdrawn', amount: 120 },
  { type: 'Deposited', amount: 80 },
  { type: 'Withdrawn', amount: 300 },
  { type: 'Withdrawn', amount: 60 },
];

// A snapshot taken after this many events (index, 1-based count of folded events).
// With the optimization on, replay starts from this materialized state instead
// of from seq 0 — fewer events to fold for any replay point past it.
const SNAPSHOT_AT = 3;

const INITIAL = { opened: false, balance: 0, status: 'no account', applied: 0 };

// Pure reducer: fold one event into the running state. Withdrawals that would
// overdraw are recorded in the log but apply as a rejected no-op (deterministic).
function apply(state, ev) {
  if (ev.type === 'AccountOpened') {
    return { opened: true, balance: 0, status: 'active', applied: state.applied + 1 };
  }
  if (ev.type === 'Deposited') {
    return { ...state, balance: state.balance + ev.amount, applied: state.applied + 1 };
  }
  if (ev.type === 'Withdrawn') {
    if (ev.amount > state.balance) {
      return { ...state, status: 'active', applied: state.applied + 1 };
    }
    return { ...state, balance: state.balance - ev.amount, applied: state.applied + 1 };
  }
  return state;
}

// Fold events[from..to) starting from a base state.
function foldRange(base, events, from, to) {
  let s = base;
  for (let i = from; i < to; i += 1) s = apply(s, events[i]);
  return s;
}

export default function EventSourcingViz() {
  // how many events have been appended (the log length), grows up to SCRIPT.length
  const [appended, setAppended] = useState(4);
  // replay-up-to position k: derive state from events 0..k
  const [replayTo, setReplayTo] = useState(4);
  const [useSnapshot, setUseSnapshot] = useState(true);

  const log = useMemo(() => SCRIPT.slice(0, appended), [appended]);

  // Precompute the snapshot state by folding the FIRST SNAPSHOT_AT events once.
  const snapshotState = useMemo(
    () => foldRange(INITIAL, SCRIPT, 0, SNAPSHOT_AT),
    [],
  );

  // Derived current state at replay point k. With the snapshot optimization, if
  // k >= SNAPSHOT_AT we fold only events [SNAPSHOT_AT..k) onto the snapshot;
  // otherwise we fold from scratch [0..k).
  const derived = useMemo(() => {
    const k = Math.min(replayTo, log.length);
    const snapUsable = useSnapshot && k >= SNAPSHOT_AT && SNAPSHOT_AT <= log.length;
    const base = snapUsable ? snapshotState : INITIAL;
    const from = snapUsable ? SNAPSHOT_AT : 0;
    const state = foldRange(base, log, from, k);
    return {
      state,
      replayed: k - from,
      fromScratch: k,
      usedSnapshot: snapUsable,
      snapAvailable: SNAPSHOT_AT <= log.length,
    };
  }, [replayTo, log, useSnapshot, snapshotState]);

  // The script is fixed; "appending" reveals the next scripted event. The
  // buttons preview which type comes next; clicking the matching one advances.
  const appendEvent = () => {
    if (appended >= SCRIPT.length) return;
    const next = appended + 1;
    setAppended(next);
    setReplayTo(next);
  };

  const reset = () => {
    setAppended(0);
    setReplayTo(0);
  };

  const nextEvent = appended < SCRIPT.length ? SCRIPT[appended] : null;

  // SVG geometry
  const W = 940;
  const H = 460;
  const logX = 24;
  const logY = 64;
  const logW = 470;
  const logH = 372;
  const stateX = 540;
  const stateY = 64;
  const stateW = W - stateX - 24;
  const stateH = 372;

  const rowH = 40;
  const maxRows = 8;
  const visible = log.slice(-maxRows);
  const baseSeq = log.length - visible.length;
  const k = Math.min(replayTo, log.length);

  const evLabel = (ev) =>
    ev.type === 'AccountOpened'
      ? 'AccountOpened'
      : `${ev.type} $${ev.amount}`;

  return (
    <div className="esv">
      <div className="esv-head">
        <h3 className="esv-title">Event sourcing — state is a fold over an append-only log</h3>
        <p className="esv-sub">
          Append events to the log, then rebuild the account state by replaying them. Slide the replay point to
          time-travel to any past moment; toggle the snapshot to replay from a materialized checkpoint instead of seq 0.
        </p>
      </div>

      <div className="esv-controls">
        <div className="esv-buttons">
          <button
            type="button"
            className="esv-btn"
            onClick={() => appendEvent('AccountOpened', 0)}
            disabled={appended >= SCRIPT.length || (nextEvent && nextEvent.type !== 'AccountOpened')}
          >
            <Wallet size={14} /> AccountOpened
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => appendEvent('Deposited', nextEvent ? nextEvent.amount : 0)}
            disabled={appended >= SCRIPT.length || (nextEvent && nextEvent.type !== 'Deposited')}
          >
            <Plus size={14} /> Deposited{nextEvent && nextEvent.type === 'Deposited' ? ` $${nextEvent.amount}` : ''}
          </button>
          <button
            type="button"
            className="esv-btn"
            onClick={() => appendEvent('Withdrawn', nextEvent ? nextEvent.amount : 0)}
            disabled={appended >= SCRIPT.length || (nextEvent && nextEvent.type !== 'Withdrawn')}
          >
            <Minus size={14} /> Withdrawn{nextEvent && nextEvent.type === 'Withdrawn' ? ` $${nextEvent.amount}` : ''}
          </button>
          <button type="button" className="esv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <span className="esv-spacer" aria-hidden="true" />

        <label className={`esv-toggle ${useSnapshot ? 'is-on' : ''}`}>
          <input
            type="checkbox"
            checked={useSnapshot}
            onChange={(e) => setUseSnapshot(e.target.checked)}
            className="esv-toggle-input"
          />
          <Camera size={14} />
          <span>snapshot optimization</span>
        </label>
      </div>

      <div className="esv-controls esv-controls-slider">
        <label className="esv-replay">
          <span className="esv-input-label">replay up to</span>
          <input
            type="range"
            min={0}
            max={log.length}
            step={1}
            value={k}
            onChange={(e) => setReplayTo(Number(e.target.value))}
            className="esv-replay-range"
            aria-label="Replay up to event"
            disabled={log.length === 0}
          />
          <span className="esv-replay-value">
            <History size={13} /> seq {k} / {log.length}
          </span>
        </label>
      </div>

      <div className="esv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="esv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="esv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="esv-arrowhead" />
            </marker>
          </defs>

          {/* fold edge: log -> derived state */}
          <path
            className="esv-edge is-hot"
            d={`M ${logX + logW} ${logY + 60} C ${logX + logW + 24} ${logY + 60}, ${stateX - 24} ${stateY + 100}, ${stateX} ${stateY + 100}`}
            markerEnd="url(#esv-arrow)"
          />
          <text className="esv-edge-label" x={(logX + logW + stateX) / 2} y={stateY + 72}>fold / replay</text>

          {/* append-only event log */}
          <g className="esv-node">
            <rect className="esv-box esv-box-log" x={logX} y={logY} width={logW} height={logH} rx={11} />
            <g transform={`translate(${logX + 14}, ${logY + 14})`}><ScrollText width={17} height={17} className="esv-ic" /></g>
            <text className="esv-box-title" x={logX + 40} y={logY + 28}>event log</text>
            <text className="esv-box-tag" x={logX + logW - 12} y={logY + 28}>append-only · source of truth</text>
            {visible.length === 0 && (
              <text className="esv-box-empty" x={logX + logW / 2} y={logY + logH / 2 + 10}>no events yet</text>
            )}
            {visible.map((ev, vi) => {
              const seq = baseSeq + vi;
              const y = logY + 48 + vi * rowH;
              const replayed = seq < k;
              const isSnap = seq === SNAPSHOT_AT - 1 && useSnapshot && derived.snapAvailable;
              const skipped = useSnapshot && derived.usedSnapshot && seq < SNAPSHOT_AT && seq < k;
              return (
                <g key={`ev-${seq}`}>
                  <rect
                    className={`esv-ev-row esv-row-${ev.type} ${replayed ? 'is-replayed' : ''} ${skipped ? 'is-skipped' : ''}`}
                    x={logX + 12}
                    y={y}
                    width={logW - 24}
                    height={rowH - 8}
                    rx={6}
                  />
                  <text className="esv-ev-seq" x={logX + 26} y={y + 21}>#{seq}</text>
                  <text className={`esv-ev-body esv-body-${ev.type}`} x={logX + 70} y={y + 21}>{evLabel(ev)}</text>
                  {skipped && (
                    <text className="esv-ev-flag" x={logX + logW - 26} y={y + 21}>skipped via snapshot</text>
                  )}
                  {isSnap && (
                    <g transform={`translate(${logX + logW - 36}, ${y + 4})`}><Camera width={13} height={13} className="esv-ic-snap" /></g>
                  )}
                </g>
              );
            })}
            {derived.snapAvailable && useSnapshot && SNAPSHOT_AT - 1 >= baseSeq && (
              <line
                className="esv-snap-line"
                x1={logX + 12}
                x2={logX + logW - 12}
                y1={logY + 48 + (SNAPSHOT_AT - baseSeq) * rowH - 4}
                y2={logY + 48 + (SNAPSHOT_AT - baseSeq) * rowH - 4}
              />
            )}
          </g>

          {/* derived current state */}
          <g className="esv-node">
            <rect className="esv-box esv-box-state" x={stateX} y={stateY} width={stateW} height={stateH} rx={11} />
            <g transform={`translate(${stateX + 14}, ${stateY + 14})`}><Wallet width={17} height={17} className="esv-ic" /></g>
            <text className="esv-box-title" x={stateX + 40} y={stateY + 28}>derived state</text>
            <text className="esv-box-tag" x={stateX + stateW - 12} y={stateY + 28}>computed · not stored</text>

            <text className="esv-state-key" x={stateX + 24} y={stateY + 86}>as of</text>
            <text className="esv-state-big" x={stateX + 24} y={stateY + 118}>seq {k}</text>

            <line className="esv-state-div" x1={stateX + 24} x2={stateX + stateW - 24} y1={stateY + 140} y2={stateY + 140} />

            <text className="esv-state-key" x={stateX + 24} y={stateY + 178}>balance</text>
            <text className="esv-state-bal" x={stateX + stateW - 24} y={stateY + 178}>${derived.state.balance}</text>

            <text className="esv-state-key" x={stateX + 24} y={stateY + 214}>status</text>
            <text className={`esv-state-status is-${derived.state.opened ? 'active' : 'none'}`} x={stateX + stateW - 24} y={stateY + 214}>
              {derived.state.status}
            </text>

            <text className="esv-state-key" x={stateX + 24} y={stateY + 250}>events applied</text>
            <text className="esv-state-val" x={stateX + stateW - 24} y={stateY + 250}>{derived.state.applied}</text>

            <line className="esv-state-div" x1={stateX + 24} x2={stateX + stateW - 24} y1={stateY + 272} y2={stateY + 272} />

            <text className="esv-state-key" x={stateX + 24} y={stateY + 308}>events replayed</text>
            <text className="esv-state-val esv-replayed" x={stateX + stateW - 24} y={stateY + 308}>{derived.replayed}</text>

            <text className="esv-state-note" x={stateX + 24} y={stateY + 338}>
              {derived.usedSnapshot
                ? `${derived.replayed} from snapshot vs ${derived.fromScratch} from scratch`
                : `${derived.replayed} from seq 0 (no snapshot)`}
            </text>
          </g>
        </svg>
      </div>

      <div className="esv-metrics">
        <div className="esv-metric">
          <span className="esv-metric-label">event count</span>
          <span className="esv-metric-value">{log.length}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">replay up to</span>
          <span className="esv-metric-value">seq {k}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">derived balance</span>
          <span className="esv-metric-value">${derived.state.balance}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">status</span>
          <span className="esv-metric-value">{derived.state.status}</span>
        </div>
        <div className="esv-metric">
          <span className="esv-metric-label">events replayed</span>
          <span className="esv-metric-value esv-replayed">
            {derived.replayed}{derived.usedSnapshot ? ` (snapshot, saved ${derived.fromScratch - derived.replayed})` : ''}
          </span>
        </div>
      </div>

      <div className="esv-narration">
        <span className="esv-narration-label">replay</span>
        <span className="esv-narration-body">
          {log.length === 0
            ? 'The log is empty — append AccountOpened to start. Nothing is stored as a row; the account is whatever the events say it is.'
            : derived.usedSnapshot
              ? `Current state is the left fold of events 0..${k}. With the snapshot taken after event #${SNAPSHOT_AT - 1}, replay starts from that materialized balance and folds only the ${derived.replayed} events after it — instead of all ${derived.fromScratch} from scratch.`
              : `Current state is the left fold of events 0..${k}, replayed from seq 0. Slide the replay point to rebuild the account as of any earlier event — the log never changes, only how far we fold.`}
        </span>
      </div>
    </div>
  );
}
