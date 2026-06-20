import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, RefreshCw, Ban } from 'lucide-react';
import './ApiKeyManagementViz.css';

const RATE_LIMIT = 3;
const GRACE_WINDOW = 4;

// Fixed scripted request stream. `key` is which credential the client presents.
const REQUESTS = [
  { key: 'old' },
  { key: 'old' },
  { key: 'old' },
  { key: 'old' },
  { key: 'old' },
  { key: 'new' },
  { key: 'old' },
  { key: 'new' },
  { key: 'old' },
  { key: 'new' },
  { key: 'old' },
  { key: 'new' },
];

// `events` interleave control-plane mutations with the request stream by index.
// rotate at request 5 (a fresh key is issued, old enters grace);
// after GRACE_WINDOW requests the old key is auto-revoked.
const ROTATE_AT = 5;

function buildFrames(events) {
  const frames = [];
  const oldKey = 'ak_live_7Qf2';
  const newKey = 'ak_live_Z9pR';

  let rotated = false;
  let graceLeft = 0;
  let oldCount = 0;
  let newCount = 0;
  let accepted = 0;
  let rejected = 0;
  let oldStatus = 'active';
  let newStatus = 'none';

  const snap = (extra) => ({
    oldKey,
    newKey,
    oldStatus,
    newStatus,
    oldCount,
    newCount,
    accepted,
    rejected,
    graceLeft,
    reqIndex: -1,
    presented: null,
    outcome: null,
    flowStage: 'idle',
    ...extra,
  });

  frames.push(snap({
    note: `A single API key ${oldKey} is issued and active. Each request carries the key to the gateway, which validates it, applies a per-key rate limit of ${RATE_LIMIT}, then forwards to the backend.`,
  }));

  events.forEach((evt) => {
    if (evt.type === 'rotate') {
      rotated = true;
      newStatus = 'active';
      oldStatus = 'grace';
      graceLeft = GRACE_WINDOW;
      frames.push(snap({
        flowStage: 'control',
        note: `Rotation: fresh key ${newKey} is issued and active. The old key ${oldKey} is NOT killed instantly — it enters a ${GRACE_WINDOW}-request grace window so in-flight clients keep working while they migrate.`,
      }));
      return;
    }
    if (evt.type === 'revoke') {
      oldStatus = 'revoked';
      graceLeft = 0;
      frames.push(snap({
        flowStage: 'control',
        note: `Grace expired (or manual revoke): ${oldKey} is now REVOKED. Any further request presenting the old key is rejected with 401 Unauthorized — only ${rotated ? newKey : 'the active key'} is honoured.`,
      }));
      return;
    }

    const req = evt.req;
    const usesNew = req.key === 'new';
    const presentedKey = usesNew ? newKey : oldKey;
    const ri = evt.reqIndex;

    let outcome;
    let note;

    if (usesNew && newStatus !== 'active') {
      outcome = 'REJECTED';
      rejected += 1;
      note = `Request #${ri + 1} presents ${newKey}, but no such key is active yet -> REJECTED 401.`;
    } else if (!usesNew && oldStatus === 'revoked') {
      outcome = 'REJECTED';
      rejected += 1;
      note = `Request #${ri + 1} presents the revoked ${oldKey} -> REJECTED 401 Unauthorized. The grace window is over; rotate-and-forget clients must switch keys.`;
    } else if (!usesNew && oldStatus === 'grace') {
      const liveCount = oldCount;
      if (liveCount >= RATE_LIMIT) {
        outcome = 'RATE-LIMITED';
        rejected += 1;
        note = `Request #${ri + 1} on ${oldKey} (grace) but this key already used ${liveCount}/${RATE_LIMIT} -> RATE-LIMITED 429.`;
      } else {
        oldCount += 1;
        accepted += 1;
        graceLeft = Math.max(0, graceLeft - 1);
        outcome = 'GRACE';
        note = `Request #${ri + 1} presents the old ${oldKey}. It is in grace -> ACCEPTED but flagged "grace" (${oldCount}/${RATE_LIMIT}). ${graceLeft} grace request(s) remain before revoke.`;
        if (graceLeft === 0 && oldStatus === 'grace') oldStatus = 'grace-ending';
      }
    } else {
      const liveCount = usesNew ? newCount : oldCount;
      if (liveCount >= RATE_LIMIT) {
        outcome = 'RATE-LIMITED';
        rejected += 1;
        note = `Request #${ri + 1} on ${presentedKey} already used ${liveCount}/${RATE_LIMIT} this window -> RATE-LIMITED 429. The counter is per-key, so one noisy client can't starve the other.`;
      } else {
        if (usesNew) newCount += 1; else oldCount += 1;
        accepted += 1;
        outcome = 'ACCEPTED';
        const c = usesNew ? newCount : oldCount;
        note = `Request #${ri + 1} presents ${presentedKey} (active). Key valid, under limit (${c}/${RATE_LIMIT}) -> ACCEPTED and forwarded to the backend.`;
      }
    }

    frames.push(snap({
      flowStage: 'request',
      reqIndex: ri,
      presented: usesNew ? 'new' : 'old',
      outcome,
      note,
    }));
  });

  frames.push(snap({
    note: `Done. ${accepted} accepted, ${rejected} rejected across ${events.filter((e) => e.req).length} requests. A grace window lets the old key keep serving while clients migrate; revoke then closes it for good. Per-key counters rate-limit each credential independently.`,
  }));

  return frames;
}

function buildEvents(rotateAt, revokeAt) {
  const events = [];
  REQUESTS.forEach((req, i) => {
    if (i === rotateAt) events.push({ type: 'rotate' });
    if (i === revokeAt) events.push({ type: 'revoke' });
    events.push({ type: 'request', req, reqIndex: i });
  });
  if (revokeAt >= REQUESTS.length) events.push({ type: 'revoke' });
  if (rotateAt >= REQUESTS.length) events.push({ type: 'rotate' });
  return events;
}

const STATUS_CLASS = {
  active: 'is-active',
  grace: 'is-grace',
  'grace-ending': 'is-grace',
  revoked: 'is-revoked',
  none: 'is-none',
};

function statusLabel(s) {
  if (s === 'grace-ending') return 'grace';
  return s;
}

export default function ApiKeyManagementViz() {
  const [rotateAt, setRotateAt] = useState(ROTATE_AT);
  const [revokeAt, setRevokeAt] = useState(ROTATE_AT + GRACE_WINDOW);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const runTimer = useRef(null);

  const events = useMemo(() => buildEvents(rotateAt, revokeAt), [rotateAt, revokeAt]);
  const frames = useMemo(() => buildFrames(events), [events]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1100 / speed);

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

  const rotateNow = () => {
    setIsRunning(false);
    setRotateAt(0);
    setRevokeAt((r) => Math.max(0, r));
    setStep(0);
  };

  const revokeNow = () => {
    const nextRevoke = Math.max(rotateAt, Math.min(revokeAt, REQUESTS.length));
    setIsRunning(false);
    setRevokeAt(nextRevoke);
    setStep(0);
  };

  const restart = () => {
    setIsRunning(false);
    setRotateAt(ROTATE_AT);
    setRevokeAt(ROTATE_AT + GRACE_WINDOW);
    setStep(0);
  };

  const changeRotate = (v) => {
    const nv = Math.max(0, Math.min(REQUESTS.length, v));
    setIsRunning(false);
    setRotateAt(nv);
    setRevokeAt((r) => Math.max(nv, r));
    setStep(0);
  };

  const changeGrace = (v) => {
    const nv = Math.max(0, Math.min(REQUESTS.length - rotateAt, v));
    setIsRunning(false);
    setRevokeAt(rotateAt + nv);
    setStep(0);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');
  const graceSize = revokeAt - rotateAt;

  // SVG geometry — client -> gateway -> backend pipeline.
  const W = 940;
  const H = 380;
  const clientX = 70;
  const gateX = 380;
  const gateW = 200;
  const backX = 800;
  const laneY = 130;
  const boxH = 78;

  const outcome = current.outcome;
  const accepted = outcome === 'ACCEPTED' || outcome === 'GRACE';
  const presented = current.presented;
  const presentedKeyLabel = presented === 'new' ? current.newKey : presented === 'old' ? current.oldKey : null;

  // Request packet travels client -> gateway when stage is 'request'.
  const showPacket = current.flowStage === 'request';
  const packetX = showPacket ? (gateX - 26) : clientX + 60;

  const outcomeText = (() => {
    if (outcome === 'ACCEPTED') return 'ACCEPTED';
    if (outcome === 'GRACE') return 'ACCEPTED (grace)';
    if (outcome === 'REJECTED') return 'REJECTED 401';
    if (outcome === 'RATE-LIMITED') return 'RATE-LIMITED 429';
    return '—';
  })();

  const outcomeClass = accepted ? 'is-ok' : outcome ? 'is-bad' : '';

  return (
    <div className="akv">
      <div className="akv-head">
        <h3 className="akv-title">API key lifecycle — issue, rotate, grace, revoke</h3>
        <p className="akv-sub">
          Step a fixed request stream through the gateway. Rotate the key to issue a fresh one, watch the old key
          serve through its grace window, then get revoked — old-key requests flip from accepted to 401.
        </p>
      </div>

      <div className="akv-controls">
        <div className="akv-group">
          <button type="button" className="akv-btn" onClick={rotateNow} title="Move rotation to the start">
            <RefreshCw size={13} /> Rotate
          </button>
          <button type="button" className="akv-btn" onClick={revokeNow} title="Revoke the old key now">
            <Ban size={13} /> Revoke
          </button>
        </div>

        <label className="akv-slider">
          <span className="akv-input-label">rotate @</span>
          <input
            type="range" min={0} max={REQUESTS.length} step={1} value={rotateAt}
            onChange={(e) => changeRotate(Number(e.target.value))}
            className="akv-range" aria-label="Rotate after request number"
          />
          <span className="akv-slider-val">#{rotateAt}</span>
        </label>

        <label className="akv-slider">
          <span className="akv-input-label">grace</span>
          <input
            type="range" min={0} max={Math.min(6, REQUESTS.length - rotateAt)} step={1} value={graceSize}
            onChange={(e) => changeGrace(Number(e.target.value))}
            className="akv-range" aria-label="Grace window size in requests"
          />
          <span className="akv-slider-val">{graceSize}</span>
        </label>

        <label className="akv-slider">
          <span className="akv-input-label">speed</span>
          <input
            type="range" min={0.5} max={5} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="akv-range" aria-label="Playback speed"
          />
          <span className="akv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="akv-spacer" aria-hidden="true" />

        <div className="akv-group">
          <button
            type="button"
            className="akv-btn akv-btn-primary"
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
            className="akv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="akv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="akv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button type="button" className="akv-btn" onClick={restart}>
            <RefreshCw size={13} /> Restart
          </button>
        </div>
        <div className="akv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="akv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="akv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="akv-row-label" x={clientX} y={28}>client → API gateway → backend</text>

          {/* pipeline connectors */}
          <line className="akv-wire" x1={clientX + 80} y1={laneY + boxH / 2} x2={gateX} y2={laneY + boxH / 2} />
          <line
            className={`akv-wire ${accepted ? 'is-ok' : outcome ? 'is-bad' : ''}`}
            x1={gateX + gateW} y1={laneY + boxH / 2} x2={backX} y2={laneY + boxH / 2}
          />

          {/* client */}
          <rect className="akv-client" x={clientX} y={laneY} width={80} height={boxH} rx={9} />
          <text className="akv-node-title" x={clientX + 40} y={laneY + 32}>client</text>
          <text className="akv-node-sub" x={clientX + 40} y={laneY + 52}>
            {presented === 'new' ? 'new key' : presented === 'old' ? 'old key' : 'idle'}
          </text>

          {/* travelling request packet */}
          {showPacket && (
            <g>
              <rect
                className={`akv-packet ${accepted ? 'is-ok' : 'is-bad'}`}
                x={packetX} y={laneY + boxH / 2 - 13} width={26} height={26} rx={6}
              />
              <text className="akv-packet-label" x={packetX + 13} y={laneY + boxH / 2 + 4}>
                {presented === 'new' ? 'N' : 'O'}
              </text>
            </g>
          )}

          {/* gateway */}
          <rect
            className={`akv-gate ${current.flowStage === 'request' ? (accepted ? 'is-ok' : 'is-bad') : ''}`}
            x={gateX} y={laneY - 14} width={gateW} height={boxH + 28} rx={11}
          />
          <text className="akv-node-title" x={gateX + gateW / 2} y={laneY + 8}>API gateway</text>
          <text className="akv-node-sub" x={gateX + gateW / 2} y={laneY + 26}>validate · rate-limit</text>

          {/* per-key counters inside the gateway */}
          <g>
            <rect className="akv-counter" x={gateX + 14} y={laneY + 36} width={(gateW - 36) / 2} height={28} rx={5} />
            <text className="akv-counter-key" x={gateX + 14 + (gateW - 36) / 4} y={laneY + 48}>old</text>
            <text
              className={`akv-counter-val ${current.oldCount >= RATE_LIMIT ? 'is-bad' : ''}`}
              x={gateX + 14 + (gateW - 36) / 4} y={laneY + 60}
            >
              {current.oldCount}/{RATE_LIMIT}
            </text>

            <rect className="akv-counter" x={gateX + gateW / 2 + 4} y={laneY + 36} width={(gateW - 36) / 2} height={28} rx={5} />
            <text className="akv-counter-key" x={gateX + gateW / 2 + 4 + (gateW - 36) / 4} y={laneY + 48}>new</text>
            <text
              className={`akv-counter-val ${current.newCount >= RATE_LIMIT ? 'is-bad' : ''}`}
              x={gateX + gateW / 2 + 4 + (gateW - 36) / 4} y={laneY + 60}
            >
              {current.newCount}/{RATE_LIMIT}
            </text>
          </g>

          {/* backend */}
          <rect className="akv-backend" x={backX} y={laneY} width={80} height={boxH} rx={9} />
          <text className="akv-node-title" x={backX + 40} y={laneY + 32}>backend</text>
          <text className="akv-node-sub" x={backX + 40} y={laneY + 52}>service</text>

          {/* key cards below the pipeline */}
          <g>
            <rect className={`akv-keycard ${STATUS_CLASS[current.oldStatus]}`} x={gateX - 120} y={262} width={300} height={86} rx={10} />
            <text className="akv-key-name" x={gateX - 104} y={288}>{current.oldKey}</text>
            <text className="akv-key-role" x={gateX - 104} y={308}>original key</text>
            <text className={`akv-key-status ${STATUS_CLASS[current.oldStatus]}`} x={gateX + 164} y={290} textAnchor="end">
              {statusLabel(current.oldStatus)}
            </text>
            {current.oldStatus === 'grace' || current.oldStatus === 'grace-ending' ? (
              <text className="akv-key-grace" x={gateX + 164} y={312} textAnchor="end">
                grace left: {current.graceLeft}
              </text>
            ) : null}
            <text className="akv-key-count" x={gateX - 104} y={332}>served {current.oldCount}</text>
          </g>

          <g>
            <rect className={`akv-keycard ${STATUS_CLASS[current.newStatus]}`} x={gateX + 220} y={262} width={300} height={86} rx={10} />
            <text className="akv-key-name" x={gateX + 236} y={288}>
              {current.newStatus === 'none' ? '— not issued —' : current.newKey}
            </text>
            <text className="akv-key-role" x={gateX + 236} y={308}>rotated key</text>
            <text className={`akv-key-status ${STATUS_CLASS[current.newStatus]}`} x={gateX + 504} y={290} textAnchor="end">
              {current.newStatus === 'none' ? 'pending' : current.newStatus}
            </text>
            <text className="akv-key-count" x={gateX + 236} y={332}>served {current.newCount}</text>
          </g>

          {/* current outcome badge */}
          {presentedKeyLabel && (
            <text className="akv-presented" x={clientX} y={laneY - 28}>
              presenting {presentedKeyLabel}
            </text>
          )}
          {outcome && (
            <text className={`akv-badge ${outcomeClass}`} x={backX + 40} y={laneY - 22} textAnchor="end">
              {outcomeText}
            </text>
          )}
        </svg>
      </div>

      <div className="akv-metrics">
        <div className="akv-metric">
          <span className="akv-metric-label">old key</span>
          <span className={`akv-metric-value ${STATUS_CLASS[current.oldStatus]}`}>
            {statusLabel(current.oldStatus)}
          </span>
        </div>
        <div className="akv-metric">
          <span className="akv-metric-label">new key</span>
          <span className={`akv-metric-value ${STATUS_CLASS[current.newStatus]}`}>
            {current.newStatus === 'none' ? '—' : current.newStatus}
          </span>
        </div>
        <div className="akv-metric">
          <span className="akv-metric-label">outcome</span>
          <span className={`akv-metric-value ${outcomeClass}`}>{outcomeText}</span>
        </div>
        <div className="akv-metric">
          <span className="akv-metric-label">old / new served</span>
          <span className="akv-metric-value">{current.oldCount} / {current.newCount}</span>
        </div>
        <div className="akv-metric">
          <span className="akv-metric-label">accepted</span>
          <span className="akv-metric-value is-ok">{current.accepted}</span>
        </div>
        <div className="akv-metric">
          <span className="akv-metric-label">rejected</span>
          <span className="akv-metric-value is-bad">{current.rejected}</span>
        </div>
      </div>

      <div className="akv-narration">
        <span className="akv-narration-label">trace</span>
        <span className="akv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
