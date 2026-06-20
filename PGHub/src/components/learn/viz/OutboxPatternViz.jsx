import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Database, Inbox, Send, Server, AlertTriangle, Check, Zap } from 'lucide-react';
import './OutboxPatternViz.css';

// Transactional outbox. A service writes a business row AND an outbox event row
// inside ONE database transaction — ACID makes them inseparable, so either both
// commit or neither does. A separate relay polls the outbox for unpublished
// rows, publishes each to a message broker, then marks it published. Delivery is
// AT-LEAST-ONCE: if the relay crashes AFTER publishing but BEFORE marking, the
// row is still pending on restart, so it republishes — a duplicate is delivered
// to the broker, but no event is ever lost. Consumers dedupe by event id.
//
// This is a step-driven machine: each user action (commit an operation, run a
// relay tick, inject a crash) advances bookkeeping and pushes a narration line.

const VISIBLE_ROWS = 7;          // outbox rows drawn before "+N more"
const RELAY_STATES = {
  idle: 'idle',
  polling: 'polling',
  publishing: 'publishing',
  marking: 'marking',
  crashed: 'crashed',
};

function freshState() {
  return {
    nextOrder: 1,            // id of the next business order to place
    business: 0,             // committed business rows
    outbox: [],             // [{ id, order, status: 'pending'|'published' }]
    delivered: 0,            // events accepted by the broker (incl. duplicates)
    duplicates: 0,           // re-deliveries caused by a crash before marking
    dedupedSeen: [],         // event ids the consumer has already accepted
    consumerAccepted: 0,     // unique events the consumer kept after dedupe
    lost: 0,                 // ALWAYS 0 — the headline guarantee
    relay: 'idle',
    pendingPublishId: null,  // event mid-flight: published to broker, not yet marked
    note: 'Place an order to commit a business row and its outbox event together in one transaction. Then run a relay tick to publish it.',
    tone: 'init',
  };
}

// Place an order: business row + outbox event row committed atomically.
function placeOrder(prev) {
  const id = prev.nextOrder;
  const outbox = [...prev.outbox, { id, order: id, status: 'pending' }];
  return {
    ...prev,
    nextOrder: id + 1,
    business: prev.business + 1,
    outbox,
    relay: prev.relay === 'crashed' ? 'crashed' : 'idle',
    note: `Order #${id} committed: the business row and the outbox event were written in ONE transaction. Both landed or neither would have — the event can never go missing. Outbox now holds ${outbox.filter((r) => r.status === 'pending').length} pending row(s).`,
    tone: 'commit',
  };
}

// One relay tick: poll outbox -> publish first pending row -> mark it published.
// If a crash is pending mid-flight, finish delivery + mark on this tick.
function relayTick(prev) {
  // A crash left an event published-but-unmarked. On restart the row is still
  // pending, so the relay re-reads and republishes it: a duplicate delivery.
  if (prev.pendingPublishId != null) {
    const id = prev.pendingPublishId;
    const row = prev.outbox.find((r) => r.id === id);
    const outbox = prev.outbox.map((r) => (r.id === id ? { ...r, status: 'published' } : r));
    const seen = prev.dedupedSeen.includes(id);
    const dedupedSeen = seen ? prev.dedupedSeen : [...prev.dedupedSeen, id];
    return {
      ...prev,
      outbox,
      delivered: prev.delivered + 1,
      duplicates: prev.duplicates + 1,
      dedupedSeen,
      consumerAccepted: seen ? prev.consumerAccepted : prev.consumerAccepted + 1,
      relay: 'idle',
      pendingPublishId: null,
      note: `Relay restarted, re-read still-pending event #${id} (order #${row ? row.order : id}), and republished it — DUPLICATE delivered to the broker. Zero events lost. The consumer already saw #${id}, so it dedupes by event id and keeps just one.`,
      tone: 'dup',
    };
  }

  const pending = prev.outbox.find((r) => r.status === 'pending');
  if (!pending) {
    return {
      ...prev,
      relay: 'idle',
      note: 'Relay polled the outbox and found no pending rows. Nothing to publish — every committed event has already reached the broker.',
      tone: 'idle',
    };
  }

  const id = pending.id;
  const outbox = prev.outbox.map((r) => (r.id === id ? { ...r, status: 'published' } : r));
  const seen = prev.dedupedSeen.includes(id);
  const dedupedSeen = seen ? prev.dedupedSeen : [...prev.dedupedSeen, id];
  return {
    ...prev,
    outbox,
    delivered: prev.delivered + 1,
    duplicates: seen ? prev.duplicates + 1 : prev.duplicates,
    dedupedSeen,
    consumerAccepted: seen ? prev.consumerAccepted : prev.consumerAccepted + 1,
    relay: 'idle',
    note: `Relay polled, found pending event #${id} (order #${pending.order}), published it to the broker, then marked published_at = now(). Outbox row flips pending -> published; the consumer accepts a new event.`,
    tone: 'mark',
  };
}

// Crash AFTER publishing but BEFORE marking: deliver to broker, leave row pending.
function crashAfterPublish(prev) {
  const pending = prev.outbox.find((r) => r.status === 'pending');
  if (!pending || prev.pendingPublishId != null) return prev;
  const id = pending.id;
  const seen = prev.dedupedSeen.includes(id);
  const dedupedSeen = seen ? prev.dedupedSeen : [...prev.dedupedSeen, id];
  return {
    ...prev,
    delivered: prev.delivered + 1,
    dedupedSeen,
    consumerAccepted: seen ? prev.consumerAccepted : prev.consumerAccepted + 1,
    relay: 'crashed',
    pendingPublishId: id,
    note: `Relay published event #${id} (order #${pending.order}) to the broker, then CRASHED before it could mark the row. The outbox row stays pending — the mark never happened. Run a relay tick to watch the restart republish it.`,
    tone: 'crash',
  };
}

// Crash BEFORE publishing: nothing delivered, row stays pending, no loss.
function crashBeforePublish(prev) {
  const pending = prev.outbox.find((r) => r.status === 'pending');
  if (!pending || prev.pendingPublishId != null) return prev;
  const id = pending.id;
  return {
    ...prev,
    relay: 'idle',
    note: `Relay crashed BEFORE publishing event #${id} (order #${pending.order}). Nothing reached the broker and the row is untouched — still pending. On the next tick the relay simply publishes it normally. No duplicate, no loss.`,
    tone: 'crash',
  };
}

const RELAY_LABEL = {
  idle: 'idle',
  polling: 'polling',
  publishing: 'publishing',
  marking: 'marking',
  crashed: 'crashed',
};

const TICK_MS = 1300;

export default function OutboxPatternViz() {
  const [state, setState] = useState(() => freshState());
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);

  const runTimer = useRef(null);
  const delay = useMemo(() => Math.round(TICK_MS / speed), [speed]);

  // Auto-poll: each interval fires one relay tick. Refs not needed — relayTick
  // reads only its prev argument, so the functional update stays current.
  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setInterval(() => {
      setState((prev) => relayTick(prev));
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
    setState(freshState());
  };

  const pendingRows = state.outbox.filter((r) => r.status === 'pending');
  const publishedRows = state.outbox.filter((r) => r.status === 'published');
  const pendingCount = pendingRows.length;
  const publishedCount = publishedRows.length;
  const hasPending = pendingCount > 0;
  const crashArmed = hasPending && state.pendingPublishId == null;

  // SVG geometry — left-to-right pipeline.
  const W = 980;
  const H = 470;

  // Service (left)
  const svcX = 20;
  const svcY = 176;
  const svcW = 132;
  const svcH = 96;

  // DB transaction box (center-left), containing business + outbox tables
  const dbX = svcX + svcW + 56;
  const dbY = 64;
  const dbW = 300;
  const dbH = 330;

  // Relay (center-right)
  const relayX = dbX + dbW + 56;
  const relayY = 100;
  const relayW = 150;
  const relayH = 116;

  // Broker (right)
  const brkX = relayX;
  const brkY = relayY + relayH + 40;
  const brkW = 150;
  const brkH = 116;

  // Consumer (far right)
  const conX = relayX + relayW + 48;
  const conY = brkY;
  const conW = 132;
  const conH = 116;

  // outbox table region inside the DB box
  const obX = dbX + 18;
  const obW = dbW - 36;
  const obTop = dbY + 178;
  const rowH = 22;
  const rowGap = 4;

  const visibleOutbox = state.outbox.slice(0, VISIBLE_ROWS);
  const overflow = Math.max(0, state.outbox.length - VISIBLE_ROWS);

  const committing = state.tone === 'commit';
  const delivering = state.tone === 'mark' || state.tone === 'dup';

  const narrTone = state.tone === 'crash' ? 'is-bad'
    : state.tone === 'dup' ? 'is-warn' : '';
  const narrLabel = state.tone === 'crash' ? 'crash'
    : state.tone === 'dup' ? 'duplicate'
      : state.tone === 'commit' ? 'commit'
        : state.tone === 'mark' ? 'published'
          : state.tone === 'init' ? 'ready' : 'idle';

  const relayTone = state.relay === 'crashed' ? 'is-bad' : delivering ? 'is-ok' : '';

  return (
    <div className="opv">
      <div className="opv-head">
        <h3 className="opv-title">Transactional outbox — atomic write, polling relay, at-least-once delivery</h3>
        <p className="opv-sub">
          A service commits its business row and an outbox event row in one transaction; a relay polls the outbox,
          publishes each pending event to the broker, and marks it sent. Crash the relay mid-flight to see it
          republish on restart — a duplicate, but never a lost event.
        </p>
      </div>

      <div className="opv-controls">
        <div className="opv-buttons">
          <button
            type="button"
            className="opv-btn opv-btn-primary"
            onClick={() => setState((prev) => placeOrder(prev))}
          >
            <Database size={14} /> Place order
          </button>
          <button
            type="button"
            className="opv-btn"
            onClick={() => setState((prev) => relayTick(prev))}
            disabled={!hasPending && state.pendingPublishId == null}
            title={!hasPending && state.pendingPublishId == null ? 'No pending outbox rows to publish' : 'Poll the outbox and publish one pending event'}
          >
            <Send size={14} /> Run relay tick
          </button>
        </div>

        <label className="opv-speed">
          <span className="opv-input-label">auto-poll speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="opv-speed-range"
            aria-label="Auto-poll speed"
          />
          <span className="opv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="opv-spacer" aria-hidden="true" />

        <div className="opv-buttons">
          <button
            type="button"
            className="opv-btn opv-btn-play"
            onClick={() => setIsRunning((v) => !v)}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            {isRunning ? 'Pause poll' : 'Auto-poll'}
          </button>
          <button
            type="button"
            className="opv-btn opv-btn-warn"
            onClick={() => setState((prev) => crashAfterPublish(prev))}
            disabled={!crashArmed}
            title={crashArmed ? 'Relay publishes, then dies before marking the row' : 'Need a pending row to crash on'}
          >
            <AlertTriangle size={14} /> Crash after publish
          </button>
          <button
            type="button"
            className="opv-btn opv-btn-warn"
            onClick={() => setState((prev) => crashBeforePublish(prev))}
            disabled={!crashArmed}
            title={crashArmed ? 'Relay dies before publishing anything' : 'Need a pending row to crash on'}
          >
            <AlertTriangle size={14} /> Crash before publish
          </button>
          <button type="button" className="opv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="opv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="opv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="opv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="opv-ah" />
            </marker>
            <marker id="opv-arrow-flow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="opv-ah-flow" />
            </marker>
            <marker id="opv-arrow-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="opv-ah-warn" />
            </marker>
          </defs>

          {/* column labels */}
          <text className="opv-col-label" x={svcX} y={44} textAnchor="start">service</text>
          <text className="opv-col-label" x={dbX} y={44} textAnchor="start">one DB transaction (atomic)</text>
          <text className="opv-col-label" x={relayX} y={84} textAnchor="start">relay / poller</text>
          <text className="opv-col-label" x={conX} y={brkY - 14} textAnchor="start">consumer</text>

          {/* service -> DB edge */}
          <path
            className={`opv-edge ${committing ? 'is-active' : 'is-flow'}`}
            d={`M ${svcX + svcW} ${svcY + svcH / 2} L ${dbX} ${dbY + dbH / 2}`}
            markerEnd={`url(#opv-arrow${committing ? '' : '-flow'})`}
          />

          {/* DB -> relay (poll) edge */}
          <path
            className="opv-edge is-flow"
            d={`M ${dbX + dbW} ${dbY + 120} L ${relayX} ${relayY + relayH / 2}`}
            markerEnd="url(#opv-arrow-flow)"
          />

          {/* relay -> broker (publish) edge */}
          <path
            className={`opv-edge ${delivering ? (state.tone === 'dup' ? 'is-warn' : 'is-active') : 'is-flow'}`}
            d={`M ${relayX + relayW / 2} ${relayY + relayH} L ${brkX + brkW / 2} ${brkY}`}
            markerEnd={`url(#opv-arrow${delivering ? (state.tone === 'dup' ? '-warn' : '') : '-flow'})`}
          />

          {/* broker -> consumer edge */}
          <path
            className="opv-edge is-flow"
            d={`M ${brkX + brkW} ${brkY + brkH / 2} L ${conX} ${conY + conH / 2}`}
            markerEnd="url(#opv-arrow-flow)"
          />

          {/* SERVICE */}
          <rect className={`opv-svc ${committing ? 'is-active' : ''}`} x={svcX} y={svcY} width={svcW} height={svcH} rx={11} />
          <g transform={`translate(${svcX + 13}, ${svcY + 13})`}>
            <Server width={15} height={15} className="opv-ic" />
          </g>
          <text className="opv-box-title" x={svcX + 34} y={svcY + 25}>service</text>
          <line className="opv-rule" x1={svcX + 12} y1={svcY + 38} x2={svcX + svcW - 12} y2={svcY + 38} />
          <text className="opv-k" x={svcX + 13} y={svcY + 60}>orders</text>
          <text className="opv-v" x={svcX + svcW - 13} y={svcY + 60}>{state.nextOrder - 1}</text>
          <text className="opv-k" x={svcX + 13} y={svcY + 82}>next</text>
          <text className="opv-v" x={svcX + svcW - 13} y={svcY + 82}>{`#${state.nextOrder}`}</text>

          {/* DB TRANSACTION BOX */}
          <rect className={`opv-txn ${committing ? 'is-commit' : ''}`} x={dbX} y={dbY} width={dbW} height={dbH} rx={12} />
          <g transform={`translate(${dbX + 14}, ${dbY + 13})`}>
            <Database width={15} height={15} className="opv-ic" />
          </g>
          <text className="opv-box-title" x={dbX + 36} y={dbY + 25}>database — single transaction</text>
          <text className="opv-txn-tag" x={dbX + dbW - 14} y={dbY + 25}>COMMIT or ROLLBACK</text>

          {/* business table inside */}
          <rect className={`opv-subtable ${committing ? 'is-active' : ''}`} x={dbX + 18} y={dbY + 44} width={dbW - 36} height={62} rx={8} />
          <text className="opv-subtable-title" x={dbX + 30} y={dbY + 64}>business_table</text>
          <text className="opv-subtable-count" x={dbX + dbW - 30} y={dbY + 64} textAnchor="end">{`${state.business} row${state.business === 1 ? '' : 's'}`}</text>
          <text className="opv-subtable-row" x={dbX + 30} y={dbY + 90}>
            {state.business > 0 ? `latest: order #${state.nextOrder - 1} written` : 'no orders yet'}
          </text>

          {/* outbox table inside */}
          <rect className="opv-subtable" x={dbX + 18} y={dbY + 116} width={dbW - 36} height={dbH - 116 - 18} rx={8} />
          <g transform={`translate(${dbX + 30}, ${dbY + 132})`}>
            <Inbox width={13} height={13} className="opv-ic is-dim" />
          </g>
          <text className="opv-subtable-title" x={dbX + 50} y={dbY + 143}>outbox_table</text>
          <text className="opv-subtable-count" x={dbX + dbW - 30} y={dbY + 143} textAnchor="end">
            {`${pendingCount} pending · ${publishedCount} sent`}
          </text>

          {/* outbox rows */}
          {visibleOutbox.length === 0 && (
            <text className="opv-empty" x={dbX + dbW / 2} y={obTop + 30} textAnchor="middle">empty — place an order</text>
          )}
          {visibleOutbox.map((r, i) => {
            const ry = obTop + i * (rowH + rowGap);
            const published = r.status === 'published';
            const inFlight = state.pendingPublishId === r.id;
            return (
              <g key={`ob-${r.id}`}>
                <rect
                  className={`opv-ob-row ${published ? 'is-published' : 'is-pending'} ${inFlight ? 'is-inflight' : ''}`}
                  x={obX + 6}
                  y={ry}
                  width={obW - 12}
                  height={rowH}
                  rx={5}
                />
                <text className="opv-ob-id" x={obX + 16} y={ry + rowH / 2 + 4}>{`evt #${r.id}`}</text>
                <text className="opv-ob-order" x={obX + 78} y={ry + rowH / 2 + 4}>{`order #${r.order}`}</text>
                <text className={`opv-ob-status ${published ? 'is-ok' : 'is-warn'}`} x={obX + obW - 16} y={ry + rowH / 2 + 4} textAnchor="end">
                  {inFlight ? 'unmarked!' : published ? 'published' : 'pending'}
                </text>
              </g>
            );
          })}
          {overflow > 0 && (
            <text className="opv-overflow" x={dbX + dbW - 30} y={obTop + VISIBLE_ROWS * (rowH + rowGap) + 4} textAnchor="end">{`+${overflow} more`}</text>
          )}

          {/* RELAY */}
          <rect className={`opv-relay ${state.relay === 'crashed' ? 'is-crashed' : ''} ${delivering ? 'is-active' : ''}`} x={relayX} y={relayY} width={relayW} height={relayH} rx={11} />
          <g transform={`translate(${relayX + 13}, ${relayY + 13})`}>
            {state.relay === 'crashed'
              ? <AlertTriangle width={15} height={15} className="opv-ic is-bad" />
              : <Send width={15} height={15} className="opv-ic" />}
          </g>
          <text className="opv-box-title" x={relayX + 34} y={relayY + 25}>relay</text>
          <text className={`opv-relay-state ${relayTone}`} x={relayX + relayW - 13} y={relayY + 25} textAnchor="end">
            {RELAY_LABEL[state.relay]}
          </text>
          <line className="opv-rule" x1={relayX + 12} y1={relayY + 38} x2={relayX + relayW - 12} y2={relayY + 38} />
          <text className="opv-k" x={relayX + 13} y={relayY + 60}>poll</text>
          <text className="opv-v" x={relayX + relayW - 13} y={relayY + 60}>{`${pendingCount} pending`}</text>
          <text className="opv-k" x={relayX + 13} y={relayY + 82}>mode</text>
          <text className="opv-v" x={relayX + relayW - 13} y={relayY + 82}>at-least-once</text>
          {state.pendingPublishId != null && (
            <text className="opv-relay-warn" x={relayX + relayW / 2} y={relayY + relayH - 12} textAnchor="middle">
              {`#${state.pendingPublishId} unmarked`}
            </text>
          )}

          {/* BROKER */}
          <rect className={`opv-broker ${delivering ? 'is-active' : ''}`} x={brkX} y={brkY} width={brkW} height={brkH} rx={11} />
          <g transform={`translate(${brkX + 13}, ${brkY + 13})`}>
            <Inbox width={15} height={15} className="opv-ic" />
          </g>
          <text className="opv-box-title" x={brkX + 34} y={brkY + 25}>broker</text>
          <line className="opv-rule" x1={brkX + 12} y1={brkY + 38} x2={brkX + brkW - 12} y2={brkY + 38} />
          <text className="opv-k" x={brkX + 13} y={brkY + 60}>delivered</text>
          <text className="opv-v is-ok" x={brkX + brkW - 13} y={brkY + 60}>{state.delivered}</text>
          <text className="opv-k" x={brkX + 13} y={brkY + 82}>duplicates</text>
          <text className={`opv-v ${state.duplicates > 0 ? 'is-warn' : ''}`} x={brkX + brkW - 13} y={brkY + 82}>{state.duplicates}</text>
          <text className="opv-k" x={brkX + 13} y={brkY + 104}>lost</text>
          <text className="opv-v is-ok" x={brkX + brkW - 13} y={brkY + 104}>{state.lost}</text>

          {/* CONSUMER */}
          <rect className="opv-consumer" x={conX} y={conY} width={conW} height={conH} rx={11} />
          <g transform={`translate(${conX + 13}, ${conY + 13})`}>
            <Check width={15} height={15} className="opv-ic is-ok" />
          </g>
          <text className="opv-box-title" x={conX + 34} y={conY + 25}>consumer</text>
          <line className="opv-rule" x1={conX + 12} y1={conY + 38} x2={conX + conW - 12} y2={conY + 38} />
          <text className="opv-k" x={conX + 13} y={conY + 60}>kept</text>
          <text className="opv-v is-ok" x={conX + conW - 13} y={conY + 60}>{state.consumerAccepted}</text>
          <text className="opv-k" x={conX + 13} y={conY + 82}>deduped</text>
          <text className="opv-v" x={conX + conW - 13} y={conY + 82}>{state.duplicates}</text>
          <text className="opv-con-note" x={conX + conW / 2} y={conY + conH - 12} textAnchor="middle">dedupe by event id</text>
        </svg>
      </div>

      <div className="opv-metrics">
        <div className="opv-metric">
          <span className="opv-metric-label">business rows</span>
          <span className="opv-metric-value">{state.business}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">outbox pending</span>
          <span className={`opv-metric-value ${pendingCount > 0 ? 'is-warn' : ''}`}>{pendingCount}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">outbox published</span>
          <span className="opv-metric-value is-ok">{publishedCount}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">delivered to broker</span>
          <span className="opv-metric-value is-ok">{state.delivered}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">duplicates</span>
          <span className={`opv-metric-value ${state.duplicates > 0 ? 'is-warn' : ''}`}>{state.duplicates}</span>
        </div>
        <div className="opv-metric">
          <span className="opv-metric-label">lost events</span>
          <span className="opv-metric-value is-ok">{state.lost}</span>
        </div>
        <div className="opv-metric opv-metric-dim">
          <span className="opv-metric-label">relay state</span>
          <span className={`opv-metric-value ${state.relay === 'crashed' ? 'is-bad' : ''}`}>{RELAY_STATES[state.relay]}</span>
        </div>
        <div className="opv-metric opv-metric-dim">
          <span className="opv-metric-label">consumer kept (unique)</span>
          <span className="opv-metric-value is-ok">{state.consumerAccepted}</span>
        </div>
      </div>

      <div className={`opv-narration ${narrTone}`}>
        <span className={`opv-narration-label ${state.tone === 'crash' ? 'is-bad' : state.tone === 'dup' ? 'is-warn' : state.tone === 'commit' || state.tone === 'mark' ? 'is-ok' : ''}`}>
          {narrLabel}
        </span>
        <span className="opv-narration-body">{state.note}</span>
      </div>

      <div className="opv-legend">
        <span className="opv-legend-item"><Database size={13} className="opv-ic" /> business row + event committed atomically</span>
        <span className="opv-legend-item"><Zap size={13} className="opv-ic is-warn" /> crash before marking republishes (duplicate)</span>
        <span className="opv-legend-item"><Check size={13} className="opv-ic is-ok" /> lost events stay 0; consumers dedupe by id</span>
      </div>
    </div>
  );
}
