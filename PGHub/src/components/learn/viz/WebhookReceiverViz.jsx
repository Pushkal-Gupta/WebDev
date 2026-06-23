import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  ShieldCheck, Database, Server, Cog, Repeat, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import './WebhookReceiverViz.css';

const MODES = [
  { id: 'naive', label: 'NAIVE (inline, no dedupe)' },
  { id: 'best', label: 'BEST-PRACTICE (verify·dedupe·enqueue·ack)' },
];

// Four vertical lifelines. Time flows DOWNWARD; each delivery is a packet that
// travels down the lane it currently sits in, then hops to the next lane.
const LANES = [
  { id: 'sender', label: 'Sender (Stripe)', icon: 'Server', hue: 'var(--hue-violet)' },
  { id: 'edge', label: 'Receiver (edge)', icon: 'ShieldCheck', hue: 'var(--hue-sky)' },
  { id: 'queue', label: 'Queue', icon: 'Database', hue: 'var(--hue-mint)' },
  { id: 'worker', label: 'Worker', icon: 'Cog', hue: 'var(--hue-pink)' },
];

const EVENT_ID = 'evt_8Qk2';
const SENDER_TIMEOUT_MS = 30000; // Stripe-style 30s budget

// A frame is a snapshot. `packet` describes the in-flight message: which lane,
// vertical progress 0..1, label, and tone. `metrics` are the live readouts.
function snapBase() {
  return {
    packet: null,        // { lane, y0, y1, label, tone }
    activeLanes: [],     // lanes lit this step
    edgeBadge: null,     // { text, tone }
    dedupeRows: [],      // event_ids stored in the dedupe table
    dedupeFlash: null,   // 'insert' | 'conflict'
    metrics: {
      ack: '—', retries: 0, sideEffects: 0, dedupeHits: 0, attempt: 0,
    },
    note: '',
    verdict: '',         // '' | 'bug' | 'ok'
  };
}

// ----- NAIVE trace ----------------------------------------------------------
function buildNaiveFrames() {
  const frames = [];
  const m = { ack: '—', retries: 0, sideEffects: 0, dedupeHits: 0, attempt: 0 };
  const push = (extra) => frames.push({ ...snapBase(), ...extra, metrics: { ...m } });

  push({
    note: `No verification, no dedupe. The edge runs the business logic INLINE before replying. Sender budget is ${SENDER_TIMEOUT_MS / 1000}s — exceed it and it retries the SAME event.`,
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    m.attempt = attempt;
    const dup = attempt > 1;

    push({
      activeLanes: ['sender'],
      packet: { lane: 'sender', y0: 0.05, y1: 0.18, label: `${EVENT_ID} · try ${attempt}`, tone: dup ? 'warn' : 'send' },
      note: dup
        ? `RETRY ${attempt}: the sender never got a 2xx in time, so it re-delivers the IDENTICAL event ${EVENT_ID}. The receiver has no memory of try ${attempt - 1}.`
        : `Sender POSTs ${EVENT_ID} to the webhook URL. Signature header present but the naive handler never checks it.`,
    });

    push({
      activeLanes: ['sender', 'edge'],
      packet: { lane: 'edge', y0: 0.18, y1: 0.42, label: `POST ${EVENT_ID}`, tone: dup ? 'warn' : 'send' },
      note: 'Request reaches the edge. The handler dives straight into processing — no HMAC verify, no dedupe lookup.',
    });

    // Inline processing is slow → fires the side-effect, then times out.
    m.sideEffects += 1;
    push({
      activeLanes: ['edge', 'worker'],
      packet: { lane: 'worker', y0: 0.42, y1: 0.82, label: 'charge customer $20', tone: 'bug' },
      note: `Inline work runs: it CHARGES THE CUSTOMER, then talks to email/3rd-party APIs. Side-effects fired now = ${m.sideEffects}. This takes ~35s — over the ${SENDER_TIMEOUT_MS / 1000}s budget.`,
      verdict: attempt > 1 ? 'bug' : '',
    });

    if (attempt < 3) {
      m.retries += 1;
      m.ack = 'TIMEOUT';
      push({
        activeLanes: ['sender', 'edge'],
        packet: { lane: 'sender', y0: 0.82, y1: 0.5, label: 'no 2xx in 30s', tone: 'warn' },
        note: `The 2xx arrives too late (or a 5xx slips out). Sender marks it failed and SCHEDULES RETRY ${attempt + 1}. retries = ${m.retries}. The charge already happened — and it's about to happen again.`,
        verdict: 'bug',
      });
    } else {
      m.ack = '~35s (late)';
      push({
        activeLanes: ['worker'],
        packet: { lane: 'worker', y0: 0.82, y1: 0.9, label: 'finally 200', tone: 'warn' },
        note: 'Third attempt eventually returns 200, so the sender finally stops. But the damage is done.',
        verdict: 'bug',
      });
    }
  }

  push({
    note: `BUG: the same event ${EVENT_ID} was processed ${m.sideEffects}× → the customer was charged 3 times. Aggressive sender retries + inline processing + no dedupe = duplicated side-effects.`,
    verdict: 'bug',
  });
  return frames;
}

// ----- BEST-PRACTICE trace --------------------------------------------------
function buildBestFrames() {
  const frames = [];
  const m = { ack: '—', retries: 0, sideEffects: 0, dedupeHits: 0, attempt: 0 };
  let rows = [];
  const push = (extra) => frames.push({
    ...snapBase(), ...extra,
    metrics: { ...m },
    dedupeRows: rows.slice(),
  });

  push({
    note: 'Four pillars: VERIFY the HMAC signature on the raw body, DEDUPE by event_id, ENQUEUE async, then ACK 200 fast. A worker processes off the queue — idempotently.',
  });

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    m.attempt = attempt;
    const dup = attempt > 1;

    push({
      activeLanes: ['sender'],
      packet: { lane: 'sender', y0: 0.05, y1: 0.18, label: `${EVENT_ID} · try ${attempt}`, tone: dup ? 'warn' : 'send' },
      note: dup
        ? `RETRY ${attempt}: sender re-delivers the SAME event ${EVENT_ID}. This time the receiver remembers it.`
        : `Sender POSTs ${EVENT_ID}, signed with a shared secret over the raw request body.`,
    });

    // VERIFY
    push({
      activeLanes: ['edge'],
      packet: { lane: 'edge', y0: 0.18, y1: 0.34, label: 'verify HMAC', tone: 'send' },
      edgeBadge: { text: 'signature OK', tone: 'ok' },
      note: 'Edge recomputes HMAC over the RAW body and constant-time-compares to the header. Match → continue. (Reject early with 400 on mismatch.)',
    });

    // DEDUPE
    if (!dup) {
      rows = [...rows, EVENT_ID];
      push({
        activeLanes: ['edge', 'queue'],
        packet: { lane: 'edge', y0: 0.34, y1: 0.5, label: 'INSERT ON CONFLICT', tone: 'ok' },
        edgeBadge: { text: 'inserted (new)', tone: 'ok' },
        dedupeFlash: 'insert',
        note: `INSERT INTO seen_events(event_id) VALUES('${EVENT_ID}') ON CONFLICT DO NOTHING → 1 row inserted. First sighting, so enqueue it for the worker.`,
      });
    } else {
      m.dedupeHits += 1;
      push({
        activeLanes: ['edge'],
        packet: { lane: 'edge', y0: 0.34, y1: 0.5, label: 'ON CONFLICT → skip', tone: 'ok' },
        edgeBadge: { text: 'duplicate — skip', tone: 'ok' },
        dedupeFlash: 'conflict',
        note: `INSERT ... ON CONFLICT DO NOTHING → 0 rows (event_id already present). dedupe hits = ${m.dedupeHits}. No enqueue, no worker, no side-effect. Just ack 200.`,
      });
    }

    // ENQUEUE + ACK (only enqueue on first sighting)
    m.ack = '~50ms';
    if (!dup) {
      push({
        activeLanes: ['edge', 'queue'],
        packet: { lane: 'queue', y0: 0.5, y1: 0.66, label: `enqueue ${EVENT_ID}`, tone: 'ok' },
        edgeBadge: { text: '200 OK · ~50ms', tone: 'ok' },
        note: `Job pushed to the queue, then the edge returns 200 in ~50ms — well under budget. The sender is satisfied and won't retry.`,
      });
    } else {
      m.retries += 1;
      push({
        activeLanes: ['edge'],
        packet: { lane: 'sender', y0: 0.5, y1: 0.18, label: '200 OK (fast)', tone: 'ok' },
        edgeBadge: { text: '200 OK · ~50ms', tone: 'ok' },
        note: `Retry is acked 200 instantly from the dedupe path. retries counted = ${m.retries}, but side-effects fired stays put — the duplicate did nothing.`,
      });
    }

    // WORKER (only first sighting)
    if (!dup) {
      m.sideEffects += 1;
      push({
        activeLanes: ['queue', 'worker'],
        packet: { lane: 'worker', y0: 0.66, y1: 0.9, label: 'charge customer $20', tone: 'ok' },
        note: `Worker pulls the job and processes it idempotently: customer charged ONCE. side-effects fired = ${m.sideEffects}. Failures here retry with backoff, then DLQ after N.`,
        verdict: 'ok',
      });
    } else {
      push({
        activeLanes: [],
        packet: null,
        note: `Worker never sees this duplicate — it was dropped at the dedupe gate. side-effects fired still = ${m.sideEffects}.`,
        verdict: 'ok',
      });
    }
  }

  push({
    note: `EXACTLY ONCE: the sender retried ${m.retries}× and the dedupe gate caught ${m.dedupeHits} duplicates, yet side-effects fired = ${m.sideEffects}. The customer is charged a single time. Verify → dedupe → enqueue → ack fast → process async.`,
    verdict: 'ok',
  });
  return frames;
}

const ICONS = { Server, ShieldCheck, Database, Cog };

export default function WebhookReceiverViz() {
  const uid = useId().replace(/:/g, '');
  const [mode, setMode] = useState('naive');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.4);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'naive' ? buildNaiveFrames() : buildBestFrames()),
    [mode],
  );
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

  const switchMode = (mid) => {
    if (mid === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(mid);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ----- SVG geometry: vertical lifelines, time flows downward --------------
  const W = 940;
  const H = 440;
  const laneTop = 64;
  const laneBottom = H - 70;
  const laneSpan = laneBottom - laneTop;
  const marginX = 70;
  const laneStep = (W - 2 * marginX) / (LANES.length - 1);
  const laneX = (i) => marginX + i * laneStep;
  const laneIndex = (id) => LANES.findIndex((l) => l.id === id);
  const yAt = (t) => laneTop + t * laneSpan;

  const packet = current.packet;
  const packetLaneI = packet ? laneIndex(packet.lane) : -1;
  const packetTone = packet ? packet.tone : 'send';

  const m = current.metrics;

  return (
    <div className="whrv">
      <div className="whrv-head">
        <div className="whrv-head-icon">
          <ShieldCheck size={18} />
        </div>
        <div className="whrv-head-text">
          <h3 className="whrv-title">Receiving webhooks — inline vs the four pillars</h3>
          <p className="whrv-sub">
            Same event, delivered with retries. Watch inline processing double-charge the customer,
            then watch verify · dedupe · enqueue · ack make it fire exactly once.
          </p>
        </div>
      </div>

      <div className="whrv-controls">
        <div className="whrv-modes" role="tablist" aria-label="Receiver strategy">
          {MODES.map((md) => (
            <button
              key={md.id}
              type="button"
              className={`whrv-mode ${mode === md.id ? 'is-on' : ''}`}
              onClick={() => switchMode(md.id)}
              aria-pressed={mode === md.id}
            >
              {md.label}
            </button>
          ))}
        </div>

        <label className="whrv-slider">
          <span className="whrv-input-label">speed</span>
          <input
            type="range" min={0.5} max={3} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="whrv-range" aria-label="Playback speed"
          />
          <span className="whrv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="whrv-spacer" aria-hidden="true" />

        <div className="whrv-buttons">
          <button
            type="button"
            className="whrv-btn whrv-btn-primary"
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
            className="whrv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="whrv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="whrv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="whrv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="whrv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="whrv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker
              id={`whrv-${uid}-arrow`} viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="whrv-arrowhead" />
            </marker>
            <filter id={`whrv-${uid}-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Lifelines */}
          {LANES.map((lane, i) => {
            const x = laneX(i);
            const lit = current.activeLanes.includes(lane.id);
            const Icon = ICONS[lane.icon];
            return (
              <g key={lane.id}>
                <line
                  className={`whrv-lifeline ${lit ? 'is-lit' : ''}`}
                  x1={x} y1={laneTop} x2={x} y2={laneBottom}
                  style={{ stroke: lit ? lane.hue : 'var(--border)' }}
                />
                <g transform={`translate(${x - 13}, ${laneTop - 42})`}>
                  <rect
                    className={`whrv-lane-box ${lit ? 'is-lit' : ''}`}
                    x={-1} y={-2} width={28} height={28} rx={7}
                    style={lit ? { stroke: lane.hue } : undefined}
                  />
                  <Icon x={4} y={3} width={18} height={18} style={{ color: lit ? lane.hue : 'var(--text-dim)' }} />
                </g>
                <text className="whrv-lane-label" x={x} y={laneTop - 48} textAnchor="middle">
                  {lane.label}
                </text>
              </g>
            );
          })}

          {/* Dedupe table on the queue lane (best mode) */}
          {mode === 'best' && (
            <g>
              <text className="whrv-mini-label" x={laneX(2)} y={laneBottom + 18} textAnchor="middle">
                seen_events
              </text>
              {LANES.length && [0, 1, 2].map((slot) => {
                const filled = current.dedupeRows[slot];
                const flashing = current.dedupeFlash && slot === current.dedupeRows.length - 1
                  && current.dedupeFlash === 'insert';
                const conflict = current.dedupeFlash === 'conflict' && slot === 0;
                const cls = ['whrv-dedupe-cell'];
                if (filled) cls.push('is-filled');
                if (flashing) cls.push('is-insert');
                if (conflict) cls.push('is-conflict');
                return (
                  <g key={`dd-${slot}`}>
                    <rect
                      className={cls.join(' ')}
                      x={laneX(2) - 52} y={laneBottom + 26 + slot * 4 - slot}
                      width={104} height={16} rx={4}
                      transform={`translate(0, ${slot * 16})`}
                    />
                    <text
                      className="whrv-dedupe-text"
                      x={laneX(2)} y={laneBottom + 38 + slot * 16}
                      textAnchor="middle"
                    >
                      {filled || '—'}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* In-flight packet */}
          {packet && packetLaneI >= 0 && (() => {
            const x = laneX(packetLaneI);
            const y0 = yAt(packet.y0);
            const y1 = yAt(packet.y1);
            const midY = (y0 + y1) / 2;
            return (
              <g className="whrv-packet-g">
                <line
                  className={`whrv-packet-path tone-${packetTone}`}
                  x1={x} y1={y0} x2={x} y2={y1}
                  markerEnd={`url(#whrv-${uid}-arrow)`}
                  filter={`url(#whrv-${uid}-glow)`}
                />
                <g className={`whrv-packet tone-${packetTone}`}>
                  <rect
                    className="whrv-packet-box"
                    x={x - 76} y={midY - 13} width={152} height={26} rx={7}
                  />
                  <text className="whrv-packet-text" x={x} y={midY + 4} textAnchor="middle">
                    {packet.label}
                  </text>
                </g>
              </g>
            );
          })()}

          {/* Edge badge */}
          {current.edgeBadge && (
            <g transform={`translate(${laneX(1)}, ${yAt(0.27)})`}>
              <rect
                className={`whrv-badge ${current.edgeBadge.tone === 'ok' ? 'is-ok' : 'is-warn'}`}
                x={-72} y={-13} width={144} height={26} rx={13}
              />
              {current.edgeBadge.tone === 'ok'
                ? <ShieldCheck x={-62} y={-9} width={16} height={16} className="whrv-badge-icon is-ok" />
                : <AlertTriangle x={-62} y={-9} width={16} height={16} className="whrv-badge-icon is-warn" />}
              <text className="whrv-badge-text" x={4} y={4} textAnchor="middle">
                {current.edgeBadge.text}
              </text>
            </g>
          )}

          {/* Verdict ribbon */}
          {current.verdict && (
            <g transform={`translate(${W / 2}, ${laneBottom + 30})`}>
              <rect
                className={`whrv-verdict ${current.verdict === 'bug' ? 'is-bug' : 'is-ok'}`}
                x={-180} y={-15} width={360} height={30} rx={15}
              />
              {current.verdict === 'bug'
                ? <AlertTriangle x={-168} y={-9} width={18} height={18} className="whrv-verdict-icon is-bug" />
                : <CheckCircle2 x={-168} y={-9} width={18} height={18} className="whrv-verdict-icon is-ok" />}
              <text className="whrv-verdict-text" x={6} y={5} textAnchor="middle">
                {current.verdict === 'bug'
                  ? 'duplicate side-effect — customer over-charged'
                  : 'exactly once — single charge'}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="whrv-metrics">
        <div className="whrv-metric">
          <span className="whrv-metric-label">ack latency</span>
          <span className={`whrv-metric-value ${m.ack === 'TIMEOUT' ? 'is-warn' : ''}`}>{m.ack}</span>
        </div>
        <div className="whrv-metric">
          <span className="whrv-metric-label">sender retries</span>
          <span className="whrv-metric-value">{m.retries}</span>
        </div>
        <div className="whrv-metric whrv-metric-hero">
          <span className="whrv-metric-label">
            <Repeat size={11} /> side-effects fired
          </span>
          <span className={`whrv-metric-value ${m.sideEffects > 1 ? 'is-bug' : 'is-ok'}`}>
            {m.sideEffects}{m.sideEffects > 1 ? '  (over-charged)' : ''}
          </span>
        </div>
        <div className="whrv-metric">
          <span className="whrv-metric-label">dedupe hits</span>
          <span className="whrv-metric-value">{m.dedupeHits}</span>
        </div>
        <div className="whrv-metric">
          <span className="whrv-metric-label">delivery attempt</span>
          <span className="whrv-metric-value">{m.attempt || '—'}</span>
        </div>
      </div>

      <div className="whrv-narration">
        <span className="whrv-narration-label">trace</span>
        <span className="whrv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
