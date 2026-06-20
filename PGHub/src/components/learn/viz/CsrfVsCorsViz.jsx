import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  ShieldCheck, ShieldAlert, Cookie, Eye, EyeOff, Ban,
} from 'lucide-react';
import './CsrfVsCorsViz.css';

// One forged request from evil.com -> bank.com, analysed on two independent axes:
//   CSRF axis = does the WRITE (state change) succeed on the server?
//   CORS  axis = can the attacker's SCRIPT READ the response in the browser?
function buildFrames(csrfDefense, corsAllow) {
  const frames = [];

  const snap = (extra) => ({
    csrfDefense,
    corsAllow,
    stage: 'idle',
    cookieAttached: false,
    requestSent: false,
    writeOutcome: null, // 'succeeded' | 'blocked'
    responseSent: false,
    readOutcome: null, // 'visible' | 'blocked'
    active: null, // evil | browser | server | write | response | read
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: `A page on evil.com fires a hidden POST to bank.com/transfer while the victim is logged in. CSRF defense (SameSite/token) is ${csrfDefense ? 'ON' : 'OFF'}; bank.com's CORS policy ${corsAllow ? 'ALLOWS' : 'does NOT allow'} evil.com to read responses. These two are separate questions.`,
  }));

  frames.push(snap({
    active: 'evil',
    requestSent: true,
    note: 'evil.com’s script issues fetch("https://bank.com/transfer", {method:"POST", credentials:"include"}). The request leaves the page — the browser will carry it to bank.com.',
  }));

  // CSRF axis: cookie attach + write decision.
  const cookieAttached = !csrfDefense;
  frames.push(snap({
    active: 'browser',
    requestSent: true,
    cookieAttached,
    note: csrfDefense
      ? 'CSRF axis — the browser checks SameSite. The bank.com session cookie is NOT attached to this cross-site request (and no secret token is present). The request reaches the server, but unauthenticated for state change.'
      : 'CSRF axis — the browser auto-attaches the victim’s bank.com cookie on the cross-site request (cookies travel by destination, not by who fired it). This is exactly what CSRF abuses.',
  }));

  const writeOutcome = csrfDefense ? 'blocked' : 'succeeded';
  frames.push(snap({
    active: 'server',
    requestSent: true,
    cookieAttached,
    stage: 'write',
    writeOutcome,
    note: csrfDefense
      ? 'The request ARRIVES at bank.com — CORS never blocks the request from being sent. But without a valid cookie/token the server REJECTS the state change. The write is blocked by the CSRF defense, not by CORS.'
      : 'bank.com sees a valid session cookie and processes the transfer. The WRITE SUCCEEDS — money moved. Note CORS did nothing to stop this; CORS is not a request firewall.',
  }));

  // CORS axis: response read decision (independent of the write outcome).
  frames.push(snap({
    active: 'response',
    requestSent: true,
    cookieAttached,
    stage: 'response',
    writeOutcome,
    responseSent: true,
    note: 'bank.com sends a response back. Whether the attacker’s SCRIPT may READ it is a separate decision the browser enforces using CORS headers — the CORS axis.',
  }));

  const readOutcome = corsAllow ? 'visible' : 'blocked';
  frames.push(snap({
    active: 'read',
    requestSent: true,
    cookieAttached,
    stage: 'read',
    writeOutcome,
    responseSent: true,
    readOutcome,
    note: corsAllow
      ? 'CORS axis — bank.com returned Access-Control-Allow-Origin: evil.com, so the browser lets evil.com’s script READ the response body. (Misconfigured CORS — leaks data.)'
      : 'CORS axis — bank.com did NOT allow evil.com, so the browser BLOCKS the script from reading the response. The bytes arrived but JavaScript can’t see them. CORS protects the READ, not the write.',
  }));

  frames.push(snap({
    active: null,
    requestSent: true,
    cookieAttached,
    stage: 'done',
    writeOutcome,
    responseSent: true,
    readOutcome,
    note: `Takeaway — WRITE ${writeOutcome === 'succeeded' ? 'SUCCEEDED (CSRF defense off)' : 'was BLOCKED by the CSRF defense'}; READ ${readOutcome === 'visible' ? 'was VISIBLE (permissive CORS)' : 'was BLOCKED by CORS'}. CORS guards the response (read); CSRF tokens/SameSite guard the action (write). They are orthogonal — neither substitutes for the other.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1200;

export default function CsrfVsCorsViz() {
  const [csrfDefense, setCsrfDefense] = useState(false);
  const [corsAllow, setCorsAllow] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(csrfDefense, corsAllow), [csrfDefense, corsAllow]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / speed);

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

  const change = (setter) => (value) => {
    setIsRunning(false);
    setStep(0);
    setter(value);
  };
  const setCsrf = change(setCsrfDefense);
  const setCors = change(setCorsAllow);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const W = 940;
  const H = 380;
  const evil = { x: 30, y: 130, w: 180, h: 110 };
  const browserX = 250;
  const browserW = 200;
  const server = { x: W - 210, y: 130, w: 180, h: 110 };
  const midY = evil.y + evil.h / 2;

  const writeBlocked = current.writeOutcome === 'blocked';
  const writeSucceeded = current.writeOutcome === 'succeeded';
  const readBlocked = current.readOutcome === 'blocked';
  const readVisible = current.readOutcome === 'visible';

  return (
    <div className="ccv">
      <div className="ccv-head">
        <h3 className="ccv-title">CSRF vs CORS — the write and the read are two different problems</h3>
        <p className="ccv-sub">
          One forged request, two independent questions: does the state-changing WRITE succeed (CSRF), and can the
          attacker&apos;s script READ the response (CORS)? Toggle each defense and watch them act on opposite halves.
        </p>
      </div>

      <div className="ccv-controls">
        <div className="ccv-toggle-group">
          <span className="ccv-input-label">CSRF defense (SameSite / token)</span>
          <div className="ccv-seg" role="tablist" aria-label="CSRF defense">
            <button
              type="button"
              className={`ccv-seg-btn is-danger ${!csrfDefense ? 'is-on' : ''}`}
              onClick={() => setCsrf(false)}
              aria-pressed={!csrfDefense}
            >
              OFF
            </button>
            <button
              type="button"
              className={`ccv-seg-btn is-safe ${csrfDefense ? 'is-on' : ''}`}
              onClick={() => setCsrf(true)}
              aria-pressed={csrfDefense}
            >
              ON
            </button>
          </div>
        </div>

        <div className="ccv-toggle-group">
          <span className="ccv-input-label">CORS allow evil.com</span>
          <div className="ccv-seg" role="tablist" aria-label="CORS allow origin">
            <button
              type="button"
              className={`ccv-seg-btn is-safe ${!corsAllow ? 'is-on' : ''}`}
              onClick={() => setCors(false)}
              aria-pressed={!corsAllow}
            >
              BLOCK
            </button>
            <button
              type="button"
              className={`ccv-seg-btn is-danger ${corsAllow ? 'is-on' : ''}`}
              onClick={() => setCors(true)}
              aria-pressed={corsAllow}
            >
              ALLOW
            </button>
          </div>
        </div>

        <label className="ccv-slider">
          <span className="ccv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ccv-range"
            aria-label="Playback speed"
          />
          <span className="ccv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="ccv-spacer" aria-hidden="true" />

        <div className="ccv-buttons">
          <button
            type="button"
            className="ccv-btn ccv-btn-primary"
            onClick={() => {
              if (step >= totalSteps - 1) setStep(0);
              setIsRunning((r) => !r);
            }}
          >
            {isRunningRaw && step < totalSteps - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="ccv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ccv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ccv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ccv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ccv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ccv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="ccv-arrow-req" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--warning)" />
            </marker>
            <marker id="ccv-arrow-res" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--accent)" />
            </marker>
          </defs>

          {/* browser boundary band */}
          <rect className="ccv-browser" x={browserX} y={46} width={browserW} height={H - 92} rx={10} />
          <text className="ccv-browser-label" x={browserX + browserW / 2} y={66}>browser (same-origin policy)</text>

          {/* evil.com */}
          <g>
            <rect
              className={`ccv-box ccv-evil ${current.active === 'evil' ? 'is-active' : ''}`}
              x={evil.x}
              y={evil.y}
              width={evil.w}
              height={evil.h}
              rx={10}
            />
            <g transform={`translate(${evil.x + 12}, ${evil.y + 12})`}>
              <ShieldAlert size={15} color="var(--warning)" />
            </g>
            <text className="ccv-box-title" x={evil.x + evil.w / 2} y={evil.y + 30}>evil.com</text>
            <text className="ccv-box-sub" x={evil.x + evil.w / 2} y={evil.y + 52}>attacker script</text>
            <text className="ccv-box-sub" x={evil.x + evil.w / 2} y={evil.y + 70}>fetch(bank.com/transfer)</text>
          </g>

          {/* server */}
          <g>
            <rect
              className={`ccv-box ${current.active === 'server' ? 'is-active' : ''}`}
              x={server.x}
              y={server.y}
              width={server.w}
              height={server.h}
              rx={10}
            />
            <rect x={server.x} y={server.y} width={server.w} height={5} rx={2.5} fill="var(--hue-violet)" opacity={0.8} />
            <text className="ccv-box-title" x={server.x + server.w / 2} y={server.y + 30}>bank.com</text>
            <text className="ccv-box-sub" x={server.x + server.w / 2} y={server.y + 52}>/transfer</text>
            <text
              className={`ccv-state ${writeSucceeded ? 'is-bad' : writeBlocked ? 'is-good' : ''}`}
              x={server.x + server.w / 2}
              y={server.y + 78}
            >
              {current.writeOutcome ? `write ${current.writeOutcome}` : 'awaiting'}
            </text>
          </g>

          {/* request arrow evil -> server (passes through browser, cookie chip) */}
          {current.requestSent && (
            <g>
              <line
                className="ccv-flow-req"
                x1={evil.x + evil.w + 4}
                y1={midY - 18}
                x2={server.x - 6}
                y2={midY - 18}
                markerEnd="url(#ccv-arrow-req)"
              />
              <text className="ccv-flow-label" x={(evil.x + evil.w + server.x) / 2} y={midY - 30}>POST /transfer</text>
              <g transform={`translate(${browserX + 16}, ${midY - 14})`}>
                <Cookie size={13} color={current.cookieAttached ? 'var(--hue-pink)' : 'var(--text-dim)'} />
                <text className={`ccv-cookie ${current.cookieAttached ? 'is-on' : 'is-off'}`} x={18} y={11}>
                  {current.cookieAttached ? 'cookie attached' : 'cookie withheld'}
                </text>
              </g>
            </g>
          )}

          {/* response arrow server -> evil, CORS gate at browser boundary */}
          {current.responseSent && (
            <g>
              <line
                className={`ccv-flow-res ${readBlocked ? 'is-blocked' : ''}`}
                x1={server.x - 6}
                y1={midY + 24}
                x2={readBlocked ? browserX + browserW + 8 : evil.x + evil.w + 4}
                y2={midY + 24}
                markerEnd={readBlocked ? undefined : 'url(#ccv-arrow-res)'}
              />
              <text className="ccv-flow-label is-res" x={(evil.x + evil.w + server.x) / 2} y={midY + 16}>200 OK · response body</text>
              {readBlocked && (
                <g transform={`translate(${browserX + browserW - 2}, ${midY + 24})`}>
                  <Ban size={18} color="var(--easy)" />
                  <text className="ccv-gate is-good" x={-2} y={26}>CORS blocks read</text>
                </g>
              )}
              <g transform={`translate(${evil.x + 8}, ${midY + 44})`}>
                {readVisible
                  ? <Eye size={14} color="var(--warning)" />
                  : <EyeOff size={14} color="var(--easy)" />}
                <text className={`ccv-read ${readVisible ? 'is-bad' : 'is-good'}`} x={18} y={11}>
                  {readVisible ? 'script reads body' : 'script cannot read'}
                </text>
              </g>
            </g>
          )}

          {/* axis labels */}
          <text className="ccv-axis-label is-csrf" x={browserX + browserW / 2} y={midY - 44}>
            CSRF axis · the WRITE
          </text>
          <text className="ccv-axis-label is-cors" x={browserX + browserW / 2} y={midY + 70}>
            CORS axis · the READ
          </text>
        </svg>
      </div>

      <div className="ccv-compare">
        <div className={`ccv-cmp ${writeSucceeded ? 'is-bad' : writeBlocked ? 'is-good' : ''}`}>
          <span className="ccv-cmp-label">write (side-effect)</span>
          <span className="ccv-cmp-val">{current.writeOutcome || '—'}</span>
          <span className="ccv-cmp-note">guarded by CSRF defense (SameSite / token)</span>
        </div>
        <div className={`ccv-cmp ${readVisible ? 'is-bad' : readBlocked ? 'is-good' : ''}`}>
          <span className="ccv-cmp-label">read (response visible to attacker)</span>
          <span className="ccv-cmp-val">{current.readOutcome ? (readVisible ? 'yes' : 'no') : '—'}</span>
          <span className="ccv-cmp-note">guarded by CORS (Access-Control-Allow-Origin)</span>
        </div>
      </div>

      <div className="ccv-metrics">
        <div className="ccv-metric">
          <span className="ccv-metric-label">CSRF defense</span>
          <span className="ccv-metric-value">{csrfDefense ? 'ON' : 'OFF'}</span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">CORS for evil.com</span>
          <span className="ccv-metric-value">{corsAllow ? 'allowed' : 'blocked'}</span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">cookie attached</span>
          <span className="ccv-metric-value">{current.cookieAttached ? 'yes' : (current.requestSent ? 'no' : '—')}</span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">write</span>
          <span className={`ccv-metric-value ${writeSucceeded ? 'is-bad' : writeBlocked ? 'is-good' : ''}`}>
            {current.writeOutcome || '—'}
          </span>
        </div>
        <div className="ccv-metric">
          <span className="ccv-metric-label">read by attacker</span>
          <span className={`ccv-metric-value ${readVisible ? 'is-bad' : readBlocked ? 'is-good' : ''}`}>
            {current.readOutcome ? (readVisible ? 'visible' : 'blocked') : '—'}
          </span>
        </div>
      </div>

      <div className="ccv-why">
        <span className="ccv-why-label">
          {writeBlocked && readBlocked ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />} key point
        </span>
        <span className="ccv-why-body">
          CORS protects the RESPONSE (can the script read it); CSRF defenses protect the ACTION (can the request
          change state). Permissive CORS does not create CSRF, and CSRF tokens do not give you CORS.
        </span>
      </div>

      <div className="ccv-narration">
        <span className="ccv-narration-label">trace</span>
        <span className="ccv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
