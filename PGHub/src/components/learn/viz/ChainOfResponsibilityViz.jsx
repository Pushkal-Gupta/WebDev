import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck } from 'lucide-react';
import './ChainOfResponsibilityViz.css';

// The chain of handlers, in processing order. The final HANDLER fulfils the
// request; the three middleware handlers each gate the request and short-circuit
// with their own status code when their check fails.
const HANDLERS = [
  { id: 'auth', label: 'AUTH', gate: 'authed', code: 401, why: 'missing or invalid credentials' },
  { id: 'rate', label: 'RATE-LIMIT', gate: 'underLimit', code: 429, why: 'too many requests in the window' },
  { id: 'valid', label: 'VALIDATION', gate: 'valid', code: 400, why: 'malformed or missing payload fields' },
  { id: 'handler', label: 'HANDLER', gate: null, code: 200, why: 'business logic fulfilled the request' },
];

const FAIL_OPTIONS = [
  { id: 'none', label: 'none (200 OK)' },
  { id: 'auth', label: 'auth (401)' },
  { id: 'rate', label: 'rate-limit (429)' },
  { id: 'valid', label: 'validation (400)' },
];

function requestFor(failAt) {
  return {
    authed: failAt !== 'auth',
    underLimit: failAt !== 'rate',
    valid: failAt !== 'valid',
  };
}

// Pure, deterministic. Walks the request token down the chain, lighting each
// node as it enters, until a gate rejects it or it reaches the final HANDLER.
function buildFrames(request) {
  const frames = [];

  const snap = (extra) => ({
    activeIndex: -1,    // node currently processing the token (-1 = not started)
    reachedTo: -1,      // furthest node reached (for greying never-reached nodes)
    decision: null,     // PASS | REJECT for the active node
    terminated: false,
    rejectedAt: -1,     // node index that rejected, else -1
    fulfilled: false,   // reached HANDLER with 200
    code: null,         // terminal status code
    why: '',
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: 'A request enters the pipeline. It must clear every middleware handler in order — AUTH, then RATE-LIMIT, then VALIDATION — before the final HANDLER can fulfil it. Any handler may short-circuit and stop it cold.',
  }));

  for (let i = 0; i < HANDLERS.length; i += 1) {
    const h = HANDLERS[i];
    // token arrives at this node
    frames.push(snap({
      activeIndex: i,
      reachedTo: i,
      decision: null,
      note: `The request token enters ${h.label}. This handler inspects it before deciding to pass it along or reject it.`,
    }));

    if (h.gate === null) {
      // final business handler — always fulfils
      frames.push(snap({
        activeIndex: i,
        reachedTo: i,
        decision: 'PASS',
        terminated: true,
        fulfilled: true,
        code: 200,
        why: h.why,
        note: `${h.label} runs the business logic and returns 200 OK. The request reached the end of the chain because every middleware before it passed.`,
      }));
      break;
    }

    const ok = request[h.gate];
    if (ok) {
      frames.push(snap({
        activeIndex: i,
        reachedTo: i,
        decision: 'PASS',
        note: `${h.label} check passes — it forwards the request to the next handler in the chain. Nothing is fulfilled yet; control simply moves on.`,
      }));
    } else {
      frames.push(snap({
        activeIndex: i,
        reachedTo: i,
        decision: 'REJECT',
        terminated: true,
        rejectedAt: i,
        code: h.code,
        why: h.why,
        note: `${h.label} REJECTS the request with ${h.code} — ${h.why}. It short-circuits the chain: no later handler ever runs, and HANDLER never sees this request.`,
      }));
      break;
    }
  }

  return frames;
}

export default function ChainOfResponsibilityViz() {
  const [failAt, setFailAt] = useState('valid');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const request = useMemo(() => requestFor(failAt), [failAt]);
  const frames = useMemo(() => buildFrames(request), [request]);
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

  const switchFail = (id) => {
    if (id === failAt) return;
    setIsRunning(false);
    setStep(0);
    setFailAt(id);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry — left-to-right pipeline of 4 boxes joined by arrows.
  const W = 940;
  const H = 360;
  const boxW = 176;
  const boxH = 108;
  const boxY = 132;
  const gap = (W - 40 - HANDLERS.length * boxW) / (HANDLERS.length - 1);
  const boxX = (i) => 20 + i * (boxW + gap);
  const cx = (i) => boxX(i) + boxW / 2;

  const activeIndex = current.activeIndex;
  const reachedTo = current.reachedTo;

  const nodeState = (i) => {
    if (current.terminated) {
      if (current.rejectedAt === i) return 'reject';
      if (current.fulfilled && i === activeIndex) return 'fulfil';
      if (i < reachedTo) return 'pass';
      if (i > reachedTo) return 'unreached';
      return 'active';
    }
    if (i === activeIndex) return current.decision === 'PASS' ? 'pass' : 'active';
    if (i < reachedTo) return 'pass';
    if (i > reachedTo) return 'unreached';
    if (reachedTo === -1) return 'unreached';
    return 'idle';
  };

  // token sits at the active node; before start it sits at the inlet.
  const tokenX = activeIndex >= 0 ? cx(activeIndex) : boxX(0) - 36;
  const tokenY = boxY - 34;

  const badgeCode = current.code;
  const badgeKind = current.fulfilled ? 'fulfil' : (current.terminated ? 'reject' : null);

  return (
    <div className="corv">
      <div className="corv-head">
        <h3 className="corv-title">Chain of Responsibility — middleware pipeline</h3>
        <p className="corv-sub">
          A request walks the handler chain in order. Each middleware either passes it on or short-circuits with its
          own status code. Only a request that clears every gate reaches the final handler and returns 200 OK.
        </p>
      </div>

      <div className="corv-controls">
        <div className="corv-fail">
          <span className="corv-input-label">fail at</span>
          <div className="corv-fail-opts" role="tablist" aria-label="Which handler rejects the request">
            {FAIL_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`corv-fail-btn ${failAt === o.id ? 'is-on' : ''}`}
                onClick={() => switchFail(o.id)}
                aria-pressed={failAt === o.id}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <span className="corv-spacer" aria-hidden="true" />

        <label className="corv-slider">
          <span className="corv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="corv-range"
            aria-label="Playback speed"
          />
          <span className="corv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <div className="corv-buttons">
          <button
            type="button"
            className="corv-btn corv-btn-primary"
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
            className="corv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="corv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="corv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="corv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="corv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="corv-svg" preserveAspectRatio="xMidYMid meet">
          <text className="corv-row-label" x={20} y={36}>request pipeline (token = current handler)</text>

          {/* inlet */}
          <text className="corv-inlet" x={boxX(0) - 36} y={boxY + boxH / 2 + 5}>in</text>

          {/* connecting arrows between boxes */}
          {HANDLERS.slice(0, -1).map((h, i) => {
            const x1 = boxX(i) + boxW;
            const x2 = boxX(i + 1);
            const my = boxY + boxH / 2;
            const flowed = reachedTo > i;
            return (
              <g key={`arrow-${h.id}`}>
                <line
                  className={`corv-arrow ${flowed ? 'is-flowed' : ''}`}
                  x1={x1 + 4}
                  y1={my}
                  x2={x2 - 12}
                  y2={my}
                />
                <path
                  className={`corv-arrow-head ${flowed ? 'is-flowed' : ''}`}
                  d={`M ${x2 - 12} ${my} l -9 -6 l 0 12 z`}
                />
              </g>
            );
          })}

          {/* handler boxes */}
          {HANDLERS.map((h, i) => {
            const st = nodeState(i);
            const x = boxX(i);
            return (
              <g key={`box-${h.id}`}>
                <rect
                  className={`corv-box corv-box-${st}`}
                  x={x}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx={11}
                />
                <text className={`corv-box-title corv-box-title-${st}`} x={x + boxW / 2} y={boxY + 30}>
                  {h.label}
                </text>
                <text className="corv-box-role" x={x + boxW / 2} y={boxY + 52}>
                  {h.gate === null ? 'business handler' : 'middleware'}
                </text>
                <text className={`corv-box-verdict corv-box-verdict-${st}`} x={x + boxW / 2} y={boxY + 84}>
                  {st === 'reject' ? `reject ${h.code}`
                    : st === 'fulfil' ? '200 OK'
                      : st === 'pass' ? 'pass ->'
                        : st === 'active' ? 'inspecting…'
                          : st === 'unreached' ? 'never reached'
                            : 'waiting'}
                </text>
              </g>
            );
          })}

          {/* request token chip riding the chain */}
          <g className="corv-token-g">
            <circle
              className={`corv-token ${current.decision === 'REJECT' ? 'is-reject' : current.fulfilled ? 'is-fulfil' : ''}`}
              cx={tokenX}
              cy={tokenY}
              r={17}
            />
            <text className="corv-token-text" x={tokenX} y={tokenY + 4}>REQ</text>
            {activeIndex >= 0 && (
              <path
                className={`corv-token-ptr ${current.decision === 'REJECT' ? 'is-reject' : current.fulfilled ? 'is-fulfil' : ''}`}
                d={`M ${tokenX} ${tokenY + 19} l -7 -10 l 14 0 z`}
              />
            )}
          </g>

          {/* terminal status badge */}
          {current.terminated && badgeCode !== null && (
            <g>
              <rect
                className={`corv-badge corv-badge-${badgeKind}`}
                x={W / 2 - 90}
                y={boxY + boxH + 28}
                width={180}
                height={40}
                rx={9}
              />
              <text className={`corv-badge-code corv-badge-code-${badgeKind}`} x={W / 2} y={boxY + boxH + 53}>
                {current.fulfilled ? `200 OK · ${HANDLERS[activeIndex].label}` : `${badgeCode} · ${HANDLERS[current.rejectedAt].label}`}
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="corv-metrics">
        <div className="corv-metric">
          <span className="corv-metric-label">processing</span>
          <span className="corv-metric-value">
            {activeIndex >= 0 ? HANDLERS[activeIndex].label : '—'}
          </span>
        </div>
        <div className="corv-metric">
          <span className="corv-metric-label">decision</span>
          <span className={`corv-metric-value ${current.decision === 'PASS' ? 'is-pass' : current.decision === 'REJECT' ? 'is-reject' : ''}`}>
            {current.decision || '—'}
          </span>
        </div>
        <div className="corv-metric">
          <span className="corv-metric-label">status</span>
          <span className={`corv-metric-value ${current.fulfilled ? 'is-pass' : current.terminated ? 'is-reject' : ''}`}>
            {current.terminated ? current.code : '…'}
          </span>
        </div>
        <div className="corv-metric">
          <span className="corv-metric-label">outcome</span>
          <span className={`corv-metric-value ${current.fulfilled ? 'is-pass' : current.terminated ? 'is-reject' : ''}`}>
            {current.fulfilled ? 'fulfilled' : current.terminated ? `rejected @ ${HANDLERS[current.rejectedAt].label}` : 'in flight'}
          </span>
        </div>
        <div className="corv-metric">
          <span className="corv-metric-label">why</span>
          <span className="corv-metric-value corv-metric-why">
            <ShieldCheck size={13} /> {current.why || '—'}
          </span>
        </div>
      </div>

      <div className="corv-narration">
        <span className="corv-narration-label">trace</span>
        <span className="corv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
