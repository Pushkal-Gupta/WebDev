import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Send, ShieldCheck, RefreshCw, Skull, Clock, CheckCircle2,
} from 'lucide-react';
import './WebhooksDesignViz.css';

// Each scenario is the response the customer endpoint returns on attempt N (1-indexed).
// 'ok' = 2xx, '5xx' = server error/timeout (retryable), '4xx' = client error (no retry).
const SCENARIOS = [
  { id: 'ok', label: '200 immediately', behavior: ['ok'] },
  { id: 'flaky', label: 'flaky (500 → 200)', behavior: ['5xx', '5xx', 'ok'] },
  { id: 'down', label: 'always 500', behavior: ['5xx', '5xx', '5xx', '5xx', '5xx', '5xx'] },
  { id: 'client', label: '4xx (bad request)', behavior: ['4xx'] },
];

// Exponential backoff: 1, 5, 25, 125, 625 seconds (×5). After MAX_ATTEMPTS failures → dead-letter.
const BACKOFF = [1, 5, 25, 125, 625];
const MAX_ATTEMPTS = 5;

const SECRET = 'whsec_3kP9aQ';
const EVENT_ID = 'evt_8fd21c47';
const REPLAY_WINDOW = 300; // seconds (5 min)

// Deterministic fake hex digest — illustrative only, never calls crypto.
function fakeDigest(attempt, ts) {
  const HEX = '0123456789abcdef';
  let out = '';
  let h = (attempt * 2654435761 + ts * 40503 + 0x9e3779b1) >>> 0;
  for (let i = 0; i < 64; i += 1) {
    h = (h ^ (h << 13)) >>> 0;
    h = (h ^ (h >>> 17)) >>> 0;
    h = (h ^ (h << 5)) >>> 0;
    out += HEX[h & 15];
  }
  return out;
}

function fmtSeconds(s) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${(s / 60).toFixed(s % 60 ? 1 : 0)}m`;
  return `${(s / 3600).toFixed(s % 3600 ? 1 : 0)}h`;
}

const BASE_TS = 1_700_000_000;

// Build the full delivery trace for a scenario.
function buildFrames(scenarioId) {
  const sc = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const frames = [];

  // attempts[] accumulate as the trace progresses; each carries its outcome + timeline geometry.
  const attempts = [];
  let cumWait = 0;
  let status = 'pending';

  const snap = (extra) => ({
    scenario: sc.id,
    attempts: attempts.map((a) => ({ ...a })),
    status,
    cumWait,
    activeAttempt: null,
    nextBackoff: null,
    note: '',
    headers: null,
    ...extra,
  });

  // Frame 0: event emitted, delivery row enqueued.
  frames.push(snap({
    note: 'Producer emits an event and enqueues a delivery row: status=pending, attempt=0. A worker will pick it up and POST to the customer URL.',
  }));

  let outcome = 'pending';
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const attemptNo = i + 1;
    // The delay applies BEFORE this attempt (attempt 1 fires at ~0; later attempts wait the backoff).
    if (i > 0) cumWait += BACKOFF[i - 1];

    const ts = BASE_TS + cumWait;
    const sig = fakeDigest(attemptNo, ts);
    const headers = {
      sig: `sha256=${sig}`,
      ts,
      id: EVENT_ID,
      backoff: i > 0 ? BACKOFF[i - 1] : 0,
    };

    // What the endpoint returns this attempt (fall back to last behavior if it runs long).
    const resp = sc.behavior[i] ?? sc.behavior[sc.behavior.length - 1];
    const code = resp === 'ok' ? 200 : resp === '4xx' ? 422 : 503;

    // Sign + POST frame.
    attempts.push({
      no: attemptNo, backoff: headers.backoff, atTime: cumWait,
      code: null, resp: 'sending', final: false,
    });
    status = 'sending';
    frames.push(snap({
      activeAttempt: attemptNo,
      headers,
      nextBackoff: BACKOFF[i] ?? null,
      note: `Attempt ${attemptNo}: sign timestamp+body with HMAC(secret) → X-Webhook-Signature, then POST to the customer URL.${i > 0 ? ` Fired after a ${fmtSeconds(headers.backoff)} backoff wait.` : ''}`,
    }));

    // Resolve the response.
    const cur = attempts[attempts.length - 1];
    cur.code = code;
    cur.resp = resp;

    if (resp === 'ok') {
      cur.final = true;
      status = 'delivered';
      outcome = 'delivered';
      frames.push(snap({
        activeAttempt: attemptNo,
        headers,
        note: `Endpoint returned ${code} OK. The delivery row flips pending → delivered. The worker stops; no further attempts.`,
      }));
      break;
    }

    if (resp === '4xx') {
      cur.final = true;
      status = 'failed';
      outcome = 'failed';
      frames.push(snap({
        activeAttempt: attemptNo,
        headers,
        note: `Endpoint returned ${code} (client error). A 4xx means the customer's handler rejected a well-formed request — retrying can't fix a bug on their side. Mark failed, do NOT retry.`,
      }));
      break;
    }

    // 5xx / timeout → retryable.
    cur.resp = '5xx';
    const isLast = attemptNo >= MAX_ATTEMPTS;
    if (isLast) {
      status = 'dead_letter';
      outcome = 'dead_letter';
      frames.push(snap({
        activeAttempt: attemptNo,
        headers,
        note: `Endpoint returned ${code} on attempt ${attemptNo}. The retry budget (${MAX_ATTEMPTS} attempts ≈ ${fmtSeconds(cumWait)}) is exhausted → move the row to DEAD_LETTER and alert the customer that deliveries are failing.`,
      }));
      break;
    }
    status = 'retrying';
    frames.push(snap({
      activeAttempt: attemptNo,
      headers,
      nextBackoff: BACKOFF[i + 1] ?? null,
      note: `Endpoint returned ${code} (server error / timeout). Retryable — schedule attempt ${attemptNo + 1} after a ${fmtSeconds(BACKOFF[i + 1] ?? BACKOFF[BACKOFF.length - 1])} backoff. Each gap grows ×5 so a flapping endpoint isn't hammered.`,
    }));
  }

  // Closing summary frame.
  const summaryNote = outcome === 'delivered'
    ? `Delivered in ${attempts.length} attempt(s). Signed headers let the receiver verify authenticity and reject replays older than ${fmtSeconds(REPLAY_WINDOW)}.`
    : outcome === 'failed'
      ? 'Marked failed on a 4xx — no retries spent on a request the customer chose to reject. Surfaced in their delivery log to debug.'
      : `Dead-lettered after ${attempts.length} attempts over ~${fmtSeconds(cumWait)}. The row is parked for manual replay and the customer is alerted.`;
  frames.push(snap({ note: summaryNote }));

  return frames;
}

export default function WebhooksDesignViz() {
  const [scenario, setScenario] = useState('flaky');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(scenario), [scenario]);
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

  const switchScenario = (id) => {
    if (id === scenario) return;
    setIsRunning(false);
    setStep(0);
    setScenario(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- SVG geometry: VERTICAL backoff timeline (time flows DOWNWARD) --------
  const W = 940;
  const H = 470;
  const railX = 150;
  const top = 78;
  const trackBottom = H - 30;
  const attemptsShown = current.attempts;

  // Position each attempt down the rail. Spacing reflects cumulative backoff so
  // the reader SEES gaps widen (1 → 5 → 25 …). We compress with sqrt so 625s still fits.
  const maxCum = MAX_ATTEMPTS > 1
    ? BACKOFF.slice(0, MAX_ATTEMPTS - 1).reduce((a, b) => a + b, 0)
    : 1;
  const spanY = trackBottom - top;
  const cumAt = (i) => {
    if (i === 0) return 0;
    return BACKOFF.slice(0, i).reduce((a, b) => a + b, 0);
  };
  const yFor = (i) => {
    const f = Math.sqrt(cumAt(i) / maxCum); // 0..1, compressed
    return top + f * spanY;
  };

  const statusMeta = {
    pending: { label: 'PENDING', cls: 'is-pending' },
    sending: { label: 'SENDING', cls: 'is-sending' },
    retrying: { label: 'RETRYING', cls: 'is-retry' },
    delivered: { label: 'DELIVERED', cls: 'is-delivered' },
    failed: { label: 'FAILED (4xx)', cls: 'is-failed' },
    dead_letter: { label: 'DEAD-LETTER', cls: 'is-dead' },
  };
  const sm = statusMeta[current.status] || statusMeta.pending;

  const nodeCls = (a) => {
    if (a.resp === 'ok') return 'is-ok';
    if (a.resp === '4xx') return 'is-4xx';
    if (a.resp === '5xx') return 'is-5xx';
    return 'is-sending';
  };

  // Headers panel geometry (right column).
  const panelX = 470;
  const panelW = W - panelX - 24;
  const h = current.headers;

  return (
    <div className="whdv">
      <div className="whdv-head">
        <span className="whdv-head-icon"><Send size={18} /></span>
        <div className="whdv-head-text">
          <h3 className="whdv-title">Webhook delivery — signing, retry &amp; dead-letter</h3>
          <p className="whdv-sub">
            Pick how the customer endpoint responds and watch the producer sign, POST, back off, and
            escalate. Backoff doubles down the vertical timeline: 1s, 5s, 25s, 125s, 625s.
          </p>
        </div>
      </div>

      <div className="whdv-controls">
        <div className="whdv-modes" role="tablist" aria-label="Endpoint behavior">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`whdv-mode ${scenario === s.id ? 'is-on' : ''}`}
              onClick={() => switchScenario(s.id)}
              aria-pressed={scenario === s.id}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="whdv-slider">
          <span className="whdv-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="whdv-range" aria-label="Playback speed"
          />
          <span className="whdv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="whdv-spacer" aria-hidden="true" />

        <div className="whdv-buttons">
          <button
            type="button"
            className="whdv-btn whdv-btn-primary"
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
            className="whdv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="whdv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="whdv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="whdv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="whdv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="whdv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="whdv-rail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--hard)" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Column headers */}
          <text className="whdv-col-head" x={24} y={42}>DELIVERY TIMELINE</text>
          <text className="whdv-col-head" x={24} y={62}>time flows downward · gaps widen x5</text>
          <text className="whdv-col-head" x={panelX} y={42}>SIGNED POST</text>

          {/* Vertical rail */}
          <line
            className="whdv-rail"
            x1={railX} y1={top} x2={railX} y2={trackBottom}
            stroke="url(#whdv-rail)"
          />
          <text className="whdv-rail-cap" x={railX} y={top - 14} textAnchor="middle">t = 0</text>

          {/* Backoff gap labels between nodes */}
          {attemptsShown.map((a, i) => {
            if (i === 0) return null;
            const yMid = (yFor(i - 1) + yFor(i)) / 2;
            return (
              <g key={`gap-${a.no}`}>
                <text className="whdv-gap" x={railX - 18} y={yMid + 4} textAnchor="end">
                  +{fmtSeconds(a.backoff)}
                </text>
                <Clock x={railX - 14} y={yMid - 7} width={11} height={11} className="whdv-gap-icon" />
              </g>
            );
          })}

          {/* Attempt nodes down the rail */}
          {attemptsShown.map((a, i) => {
            const y = yFor(i);
            const active = current.activeAttempt === a.no;
            return (
              <g key={`node-${a.no}`}>
                <circle
                  className={`whdv-node ${nodeCls(a)} ${active ? 'is-active' : ''}`}
                  cx={railX} cy={y} r={active ? 14 : 11}
                />
                <text className="whdv-node-no" x={railX} y={y + 4} textAnchor="middle">{a.no}</text>

                {/* Attempt card to the right of each node */}
                <text className="whdv-attempt-label" x={railX + 26} y={y - 2}>
                  attempt {a.no}
                </text>
                <text className={`whdv-attempt-resp ${nodeCls(a)}`} x={railX + 26} y={y + 14}>
                  {a.resp === 'sending'
                    ? 'POST · awaiting…'
                    : a.code === 200
                      ? '200 OK · delivered'
                      : a.code === 422
                        ? '422 · client error · no retry'
                        : `${a.code} · server error · retry`}
                </text>
              </g>
            );
          })}

          {/* Status badge (top right of timeline column) */}
          <rect className={`whdv-status ${sm.cls}`} x={railX + 26} y={top - 44} width={188} height={30} rx={8} />
          <text className={`whdv-status-text ${sm.cls}`} x={railX + 40} y={top - 24}>
            {sm.label}
          </text>
          {current.status === 'delivered' && (
            <CheckCircle2 x={railX + 192} y={top - 38} width={16} height={16} className="whdv-status-ico is-delivered" />
          )}
          {current.status === 'retrying' && (
            <RefreshCw x={railX + 192} y={top - 38} width={16} height={16} className="whdv-status-ico is-retry" />
          )}
          {current.status === 'dead_letter' && (
            <Skull x={railX + 192} y={top - 38} width={16} height={16} className="whdv-status-ico is-dead" />
          )}

          {/* Dead-letter sink at the bottom when reached */}
          {current.status === 'dead_letter' && (
            <g>
              <line className="whdv-dead-link" x1={railX} y1={yFor(attemptsShown.length - 1) + 14} x2={railX} y2={trackBottom + 2} />
              <rect className="whdv-deadbox" x={railX - 90} y={trackBottom + 4} width={180} height={26} rx={8} />
              <Skull x={railX - 78} y={trackBottom + 9} width={15} height={15} className="whdv-status-ico is-dead" />
              <text className="whdv-deadbox-text" x={railX - 58} y={trackBottom + 21}>DEAD_LETTER · alert sent</text>
            </g>
          )}

          {/* ---- Signed POST panel (right) ---- */}
          <rect className="whdv-panel" x={panelX} y={top - 20} width={panelW} height={300} rx={10} />
          <g>
            <ShieldCheck x={panelX + 14} y={top - 6} width={14} height={14} className="whdv-panel-ico" />
            <text className="whdv-panel-head" x={panelX + 34} y={top + 5}>HMAC(secret, ts + body)</text>
          </g>
          <text className="whdv-panel-secret" x={panelX + 14} y={top + 26}>secret = {SECRET}…</text>

          {h ? (
            <g>
              <text className="whdv-hdr-key" x={panelX + 14} y={top + 56}>X-Webhook-Id</text>
              <text className="whdv-hdr-val" x={panelX + 14} y={top + 72}>{h.id}</text>

              <text className="whdv-hdr-key" x={panelX + 14} y={top + 96}>X-Webhook-Timestamp</text>
              <text className="whdv-hdr-val" x={panelX + 14} y={top + 112}>{h.ts}</text>

              <text className="whdv-hdr-key" x={panelX + 14} y={top + 136}>X-Webhook-Signature</text>
              {/* signature wraps onto two lines so it never overflows the panel */}
              <text className="whdv-hdr-sig" x={panelX + 14} y={top + 152}>{h.sig.slice(0, 38)}</text>
              <text className="whdv-hdr-sig" x={panelX + 14} y={top + 167}>{h.sig.slice(38)}</text>

              <line className="whdv-panel-rule" x1={panelX + 14} y1={top + 184} x2={panelX + panelW - 14} y2={top + 184} />
              <text className="whdv-panel-note" x={panelX + 14} y={top + 204}>Receiver recomputes the HMAC and</text>
              <text className="whdv-panel-note" x={panelX + 14} y={top + 219}>compares — mismatched = forged.</text>
              <text className="whdv-panel-note is-warn" x={panelX + 14} y={top + 243}>Reject if timestamp older than</text>
              <text className="whdv-panel-note is-warn" x={panelX + 14} y={top + 258}>{fmtSeconds(REPLAY_WINDOW)} (replay-window guard).</text>
            </g>
          ) : (
            <text className="whdv-panel-note" x={panelX + 14} y={top + 60}>No attempt sent yet — the row is queued, status pending.</text>
          )}
        </svg>
      </div>

      <div className="whdv-metrics">
        <div className="whdv-metric">
          <span className="whdv-metric-label">attempt</span>
          <span className="whdv-metric-value">
            {current.activeAttempt ? `${current.activeAttempt} / ${MAX_ATTEMPTS}` : `${current.attempts.length} / ${MAX_ATTEMPTS}`}
          </span>
        </div>
        <div className="whdv-metric">
          <span className="whdv-metric-label">next backoff</span>
          <span className="whdv-metric-value is-amber">
            {current.nextBackoff ? fmtSeconds(current.nextBackoff) : '—'}
          </span>
        </div>
        <div className="whdv-metric">
          <span className="whdv-metric-label">cumulative wait</span>
          <span className="whdv-metric-value">{fmtSeconds(current.cumWait)}</span>
        </div>
        <div className="whdv-metric">
          <span className="whdv-metric-label">status</span>
          <span className={`whdv-metric-value ${sm.cls}`}>{sm.label}</span>
        </div>
        <div className="whdv-metric">
          <span className="whdv-metric-label">retry budget</span>
          <span className="whdv-metric-value">{MAX_ATTEMPTS} att · {fmtSeconds(BACKOFF.slice(0, MAX_ATTEMPTS - 1).reduce((a, b) => a + b, 0))}</span>
        </div>
      </div>

      <div className="whdv-narration">
        <span className="whdv-narration-label">trace</span>
        <span className="whdv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
