import React, { useMemo, useState } from 'react';
import { Webhook, Server, ShieldCheck, ShieldAlert, RefreshCw, ChevronUp, ChevronDown, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import './WebhooksViz.css';

// Webhook delivery, step by step.
//
// A provider emits a domain event, signs the JSON body with a shared secret
// (HMAC-SHA256 over the raw bytes), and POSTs it to the receiver's URL with the
// signature + an event id in headers. A correct receiver: verifies the signature
// (constant-time compare), checks the event id against a "seen" set for
// idempotency, returns 2xx FAST, and does the heavy work asynchronously. If the
// receiver returns non-2xx (or times out), the provider retries with exponential
// backoff. Because retries replay the same event id, the receiver must dedupe.

const STAGES = [
  { key: 'emit', label: 'Event emitted', node: 'provider' },
  { key: 'sign', label: 'Sign body (HMAC)', node: 'provider' },
  { key: 'post', label: 'POST to receiver', node: 'wire' },
  { key: 'verify', label: 'Verify signature', node: 'receiver' },
  { key: 'dedupe', label: 'Idempotency check', node: 'receiver' },
  { key: 'ack', label: 'Return 2xx + enqueue', node: 'receiver' },
];

// A short deterministic "hash-like" string so the signature looks real but never
// uses Math.random — derived from a tiny FNV-ish mix over a fixed seed string.
const fakeHash = (seed) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    h = Math.imul(h ^ (h >>> 13), 0x85ebca6b) >>> 0;
    out += (h & 0xff).toString(16).padStart(2, '0');
  }
  return out;
};

export default function WebhooksViz() {
  const [stage, setStage] = useState(5);
  const [validSig, setValidSig] = useState(true);
  const [receiverHealthy, setReceiverHealthy] = useState(true);
  // attempt counter: a non-2xx outcome drives retries with backoff.
  const [eventNum, setEventNum] = useState(1);

  const eventId = `evt_${(1000 + eventNum).toString(16)}`;
  const sentSig = fakeHash(`${eventId}:body:secret`);
  const expectedSig = fakeHash(`${eventId}:body:secret`);
  const sigOnWire = validSig ? sentSig : fakeHash(`${eventId}:tampered`);

  const model = useMemo(() => {
    const sigMatches = sigOnWire === expectedSig;
    // The receiver only acks if signature verifies AND it is healthy.
    const willAck = sigMatches && receiverHealthy && stage >= 5;
    const verified = stage >= 3 ? sigMatches : null;
    // dedupe hit only matters on retries (attempt > 1) of a healthy receiver.
    const attempts = sigMatches && receiverHealthy ? 1 : sigMatches ? 3 : 1;
    const dedupeHit = stage >= 4 && attempts > 1;
    const ackStatus = stage < 5 ? '—' : !sigMatches ? '401 rejected' : !receiverHealthy ? '503 (retrying)' : '202 Accepted';
    const backoff = ['0s', '1s', '2s', '4s'];
    return { sigMatches, willAck, verified, attempts, dedupeHit, ackStatus, backoff };
  }, [sigOnWire, expectedSig, receiverHealthy, stage]);

  const reset = () => {
    setStage(5);
    setValidSig(true);
    setReceiverHealthy(true);
    setEventNum(1);
  };

  const stepStage = (dir) => {
    setStage((s) => Math.max(0, Math.min(STAGES.length - 1, s + dir)));
  };

  // SVG geometry — vertical pipeline, provider top, receiver bottom.
  const W = 940;
  const H = 560;
  const colX = W / 2;
  const boxW = 560;
  const boxX = colX - boxW / 2;

  const rowY = (i) => 92 + i * 74;

  const stageActive = (i) => i <= stage;
  const stageCurrent = (i) => i === stage;

  const nodeColor = (node) =>
    node === 'provider' ? 'var(--hue-violet)' : node === 'receiver' ? 'var(--hue-mint)' : 'var(--hue-sky)';

  return (
    <div className="whv">
      <div className="whv-head">
        <h3 className="whv-title">Webhooks — signed delivery, fast ack, idempotent retries</h3>
        <p className="whv-sub">
          A provider signs an event and POSTs it down to your receiver. Verify the signature, ack 2xx fast,
          process async, and dedupe by event id — because non-2xx means the provider replays the same event.
        </p>
      </div>

      <div className="whv-controls">
        <span className="whv-input-label">stage</span>
        <span className="whv-stepper-row">
          <button type="button" className="whv-step-btn" onClick={() => stepStage(1)} aria-label="Next stage">
            <ChevronUp size={13} />
          </button>
          <button type="button" className="whv-step-btn" onClick={() => stepStage(-1)} aria-label="Previous stage">
            <ChevronDown size={13} />
          </button>
        </span>
        <span className="whv-stage-name">{STAGES[stage].label}</span>

        <span className="whv-spacer" aria-hidden="true" />

        <button
          type="button"
          className={`whv-btn ${validSig ? 'whv-btn-good' : 'whv-btn-bad'}`}
          onClick={() => setValidSig((v) => !v)}
        >
          {validSig ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {validSig ? 'Signature: valid' : 'Signature: tampered'}
        </button>
        <button
          type="button"
          className={`whv-btn ${receiverHealthy ? 'whv-btn-good' : 'whv-btn-bad'}`}
          onClick={() => setReceiverHealthy((v) => !v)}
        >
          {receiverHealthy ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {receiverHealthy ? 'Receiver: fast 2xx' : 'Receiver: slow / fails'}
        </button>
        <button
          type="button"
          className="whv-btn"
          onClick={() => {
            setEventNum((n) => n + 1);
            setStage(5);
          }}
        >
          <Webhook size={14} /> Trigger event
        </button>
        <button type="button" className="whv-btn" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="whv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="whv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="whv-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--accent)" />
            </marker>
            <marker id="whv-arrow-retry" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L7,3 L0,6 Z" fill="var(--warning)" />
            </marker>
          </defs>

          {/* actor labels */}
          <g transform="translate(28, 28)">
            <Webhook width={16} height={16} className="whv-ic-violet" />
          </g>
          <text className="whv-actor whv-actor-prov" x={50} y={40}>Provider</text>
          <text className="whv-actor-sub" x={W - 28} y={40}>receiver below — data flows downward</text>

          {/* vertical trunk */}
          <line className="whv-trunk" x1={colX} y1={rowY(0) - 18} x2={colX} y2={rowY(STAGES.length - 1) + 18} />

          {STAGES.map((s, i) => {
            const y = rowY(i);
            const active = stageActive(i);
            const current = stageCurrent(i);
            const col = nodeColor(s.node);
            return (
              <g key={s.key}>
                {i < STAGES.length - 1 && (
                  <line
                    className={`whv-edge ${active && stageActive(i + 1) ? 'is-on' : ''}`}
                    x1={colX}
                    y1={y + 22}
                    x2={colX}
                    y2={rowY(i + 1) - 22}
                    markerEnd="url(#whv-arrow)"
                  />
                )}
                <rect
                  className={`whv-row ${active ? 'is-active' : ''} ${current ? 'is-current' : ''}`}
                  x={boxX}
                  y={y - 22}
                  width={boxW}
                  height={44}
                  rx={9}
                  style={active ? { stroke: col } : undefined}
                />
                <rect x={boxX} y={y - 22} width={5} height={44} rx={2.5} fill={active ? col : 'var(--border)'} />
                <text className="whv-row-num" x={boxX + 26} y={y + 5}>{i + 1}</text>
                <text className="whv-row-label" x={boxX + 52} y={y + 5} style={active ? { fill: 'var(--text-main)' } : undefined}>
                  {s.label}
                </text>
                <text className="whv-row-node" x={boxX + boxW - 16} y={y + 5} style={{ fill: col }}>
                  {s.node === 'wire' ? 'network' : s.node}
                </text>
              </g>
            );
          })}

          {/* receiver actor label */}
          <g transform={`translate(28, ${rowY(STAGES.length - 1) + 44})`}>
            <Server width={16} height={16} className="whv-ic-mint" />
          </g>
          <text className="whv-actor whv-actor-recv" x={50} y={rowY(STAGES.length - 1) + 56}>Receiver</text>

          {/* retry hint */}
          {!model.willAck && stage >= 5 && (
            <g>
              <path
                className="whv-retry"
                d={`M ${boxX + boxW + 14} ${rowY(STAGES.length - 1)} C ${boxX + boxW + 70} ${rowY(STAGES.length - 1)}, ${boxX + boxW + 70} ${rowY(2)}, ${boxX + boxW + 14} ${rowY(2)}`}
                markerEnd="url(#whv-arrow-retry)"
              />
              <text className="whv-retry-tag" x={boxX + boxW + 76} y={(rowY(2) + rowY(STAGES.length - 1)) / 2}>
                retry w/ backoff
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="whv-metrics">
        <div className="whv-metric">
          <span className="whv-metric-label">event id</span>
          <span className="whv-metric-value">{eventId}</span>
        </div>
        <div className="whv-metric">
          <span className="whv-metric-label">signature valid?</span>
          <span className={`whv-metric-value ${model.sigMatches ? 'is-good' : 'is-bad'}`}>
            {model.verified === null ? '— (not yet)' : model.sigMatches ? 'verified' : 'mismatch'}
          </span>
        </div>
        <div className="whv-metric">
          <span className="whv-metric-label">delivery attempt #</span>
          <span className="whv-metric-value">
            {model.attempts} / 3 · backoff {model.backoff[Math.min(model.attempts, 3)]}
          </span>
        </div>
        <div className="whv-metric">
          <span className="whv-metric-label">idempotent dedupe?</span>
          <span className={`whv-metric-value ${model.dedupeHit ? 'is-warn' : ''}`}>
            {model.dedupeHit ? 'hit — already processed' : 'first time / pending'}
          </span>
        </div>
        <div className="whv-metric">
          <span className="whv-metric-label">ack status</span>
          <span className={`whv-metric-value ${model.willAck ? 'is-good' : model.ackStatus === '—' ? '' : 'is-bad'}`}>
            {model.ackStatus}
          </span>
        </div>
      </div>

      <div className="whv-narration">
        <span className="whv-narration-label">why it matters</span>
        <span className="whv-narration-body">
          {model.sigMatches
            ? receiverHealthy
              ? `Signature verifies and the receiver returns 202 fast, then processes ${eventId} on a queue. One clean delivery, no retries.`
              : `Signature is fine but the receiver is slow / 5xx, so the provider replays ${eventId} with exponential backoff. The dedupe set on event id stops the same work running twice.`
            : `The HMAC over the body does not match the X-Signature header — a tampered or forged POST. The receiver returns 401 and never touches the payload. Always verify before trusting webhook input.`}
        </span>
      </div>
    </div>
  );
}
