import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  ShieldCheck, ShieldAlert, Cookie, KeyRound,
} from 'lucide-react';
import './CsrfProtectionViz.css';

// Two origins matter here: the trusted bank tab and the attacker page. A request
// is "legit" when it comes from the bank.com tab (which can read the CSRF token)
// and "forged" when it comes from evil.com (which cannot read cross-origin secrets).
function buildFrames(tokenRequired, forged) {
  const frames = [];
  const origin = forged ? 'evil.com' : 'bank.com';

  const snap = (extra) => ({
    origin,
    forged,
    tokenRequired,
    cookieSent: false,
    tokenSent: false,
    serverPhase: 'idle',
    outcome: null,
    why: '',
    active: null,
    note: '',
    ...extra,
  });

  frames.push(snap({
    note: forged
      ? `Setup. The victim is logged into bank.com (a valid session cookie sits in the browser). CSRF token check is ${tokenRequired ? 'ON' : 'OFF'}. We will watch a request fired from evil.com.`
      : `Setup. The victim is logged into bank.com. CSRF token check is ${tokenRequired ? 'ON' : 'OFF'}. We will watch a normal request fired from the real bank.com tab.`,
  }));

  frames.push(snap({
    active: 'victim',
    note: 'Step 1 — The victim logs into bank.com. The server sets a session cookie in the browser. From now on the browser attaches that cookie to every request bound for bank.com.',
  }));

  if (forged) {
    frames.push(snap({
      active: 'attacker',
      note: 'Step 2 — The victim opens a malicious page on evil.com (a link in an email, an ad). The page looks harmless but hides a script.',
    }));
    frames.push(snap({
      active: 'request',
      note: 'Step 3 — evil.com silently fires a hidden POST to bank.com/transfer (auto-submitting form / fetch). The victim never clicks anything.',
    }));
  } else {
    frames.push(snap({
      active: 'request',
      note: 'Step 2 — The victim clicks "Transfer" inside the real bank.com tab. The page builds a POST to bank.com/transfer.',
    }));
    if (tokenRequired) {
      frames.push(snap({
        tokenSent: true,
        active: 'request',
        note: 'Step 3 — Because this page IS bank.com, it can read the secret CSRF token embedded in the page and attaches it to the request body / header.',
      }));
    }
  }

  frames.push(snap({
    cookieSent: true,
    tokenSent: !forged && tokenRequired,
    active: 'cookie',
    note: forged
      ? 'Step 4 — The browser attaches the victim\'s bank.com cookie AUTOMATICALLY. Cookies are sent by destination, not by who fired the request — this is exactly what CSRF abuses.'
      : 'Step 4 — The browser attaches the victim\'s bank.com cookie automatically, alongside the CSRF token the page supplied.',
  }));

  frames.push(snap({
    cookieSent: true,
    tokenSent: !forged && tokenRequired,
    serverPhase: 'check-cookie',
    active: 'server',
    note: 'Step 5a — Server checks the session cookie. It is present and valid, so the user looks authenticated. Cookie alone is NOT proof the user intended this action.',
  }));

  let outcome;
  let why;
  if (!tokenRequired) {
    outcome = 'ACCEPTED';
    why = forged
      ? 'No token check — the cookie alone authorized the transfer.'
      : 'No token check — cookie was enough to authorize the transfer.';
    frames.push(snap({
      cookieSent: true,
      serverPhase: 'no-token-check',
      active: 'server',
      note: 'Step 5b — Token check is OFF, so the server never asks for a secret. It trusts the cookie and processes the request.',
    }));
  } else if (!forged) {
    outcome = 'ACCEPTED';
    why = 'Valid CSRF token present — request came from bank.com itself.';
    frames.push(snap({
      cookieSent: true,
      tokenSent: true,
      serverPhase: 'token-valid',
      active: 'server',
      note: 'Step 5b — Token check is ON. The request carries the correct secret token, which only a real bank.com page could read. The token matches the server\'s copy.',
    }));
  } else {
    outcome = 'REJECTED';
    why = 'Token missing — the attacker page can\'t read the secret; server rejects.';
    frames.push(snap({
      cookieSent: true,
      tokenSent: false,
      serverPhase: 'token-missing',
      active: 'server',
      note: 'Step 5b — Token check is ON. The server demands the secret token, but evil.com could not read it (same-origin policy blocks cross-site reads), so the request has no valid token.',
    }));
  }

  frames.push(snap({
    cookieSent: true,
    tokenSent: !forged && tokenRequired,
    serverPhase: outcome === 'ACCEPTED' ? 'accepted' : 'rejected',
    outcome,
    why,
    active: 'outcome',
    note: outcome === 'ACCEPTED'
      ? (forged && !tokenRequired
        ? `Step 6 — ACCEPTED. The forged transfer went through and money moved. ${why} This is the CSRF attack succeeding.`
        : `Step 6 — ACCEPTED. ${why} A genuine action by the real user.`)
      : `Step 6 — REJECTED. ${why} The cookie was valid, but without the unforgeable token the server refuses the action — the attack is stopped.`,
  }));

  return frames;
}

const RUN_DELAY_MS = 1100;

export default function CsrfProtectionViz() {
  const [tokenRequired, setTokenRequired] = useState(true);
  const [forged, setForged] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => buildFrames(tokenRequired, forged),
    [tokenRequired, forged],
  );
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

  const toggle = (setter) => (value) => {
    setIsRunning(false);
    setStep(0);
    setter(value);
  };
  const setToken = toggle(setTokenRequired);
  const setForgedMode = toggle(setForged);

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // SVG geometry
  const W = 940;
  const H = 380;
  const attackerColor = current.forged ? 'var(--warning)' : 'var(--hue-mint)';

  // entity boxes
  const victim = { x: 40, y: 120, w: 200, h: 120 };
  const server = { x: W - 240, y: 120, w: 200, h: 120 };
  const pageX = victim.x + victim.w / 2;
  const arrowY = victim.y + victim.h / 2;

  const requestVisible = current.active === 'request' || current.cookieSent
    || current.serverPhase !== 'idle' || current.outcome;

  const accepted = current.outcome === 'ACCEPTED';

  return (
    <div className="csv">
      <div className="csv-head">
        <h3 className="csv-title">CSRF — why a stolen-cookie request needs an unforgeable token</h3>
        <p className="csv-sub">
          Step a request from login to verdict. The browser auto-attaches the victim&apos;s cookie; only a
          secret token the attacker can&apos;t read separates a forged transfer from a real one.
        </p>
      </div>

      <div className="csv-controls">
        <div className="csv-toggle-group">
          <span className="csv-input-label">request origin</span>
          <div className="csv-seg" role="tablist" aria-label="Request origin">
            <button
              type="button"
              className={`csv-seg-btn ${!forged ? 'is-on' : ''}`}
              onClick={() => setForgedMode(false)}
              aria-pressed={!forged}
            >
              LEGIT (bank.com)
            </button>
            <button
              type="button"
              className={`csv-seg-btn is-danger ${forged ? 'is-on' : ''}`}
              onClick={() => setForgedMode(true)}
              aria-pressed={forged}
            >
              FORGED (evil.com)
            </button>
          </div>
        </div>

        <div className="csv-toggle-group">
          <span className="csv-input-label">CSRF token check</span>
          <div className="csv-seg" role="tablist" aria-label="CSRF token requirement">
            <button
              type="button"
              className={`csv-seg-btn ${!tokenRequired ? 'is-on' : ''}`}
              onClick={() => setToken(false)}
              aria-pressed={!tokenRequired}
            >
              OFF
            </button>
            <button
              type="button"
              className={`csv-seg-btn is-safe ${tokenRequired ? 'is-on' : ''}`}
              onClick={() => setToken(true)}
              aria-pressed={tokenRequired}
            >
              ON
            </button>
          </div>
        </div>

        <label className="csv-slider">
          <span className="csv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="csv-range"
            aria-label="Playback speed"
          />
          <span className="csv-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="csv-spacer" aria-hidden="true" />

        <div className="csv-buttons">
          <button
            type="button"
            className="csv-btn csv-btn-primary"
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
            className="csv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="csv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="csv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="csv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="csv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="csv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="csv-arrow-accent" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--accent)" />
            </marker>
            <marker id="csv-arrow-danger" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--warning)" />
            </marker>
          </defs>

          {/* victim browser */}
          <g>
            <rect
              className={`csv-box ${current.active === 'victim' ? 'is-active' : ''}`}
              x={victim.x}
              y={victim.y}
              width={victim.w}
              height={victim.h}
              rx={10}
              style={current.active === 'victim' ? { stroke: 'var(--hue-sky)' } : undefined}
            />
            <rect x={victim.x} y={victim.y} width={victim.w} height={6} rx={3} fill="var(--hue-sky)" opacity={0.7} />
            <text className="csv-box-title" x={pageX} y={victim.y + 30}>Victim browser</text>
            <text className="csv-box-sub" x={pageX} y={victim.y + 50}>logged into bank.com</text>
            <g transform={`translate(${pageX - 56}, ${victim.y + 72})`}>
              <Cookie
                size={16}
                color={current.cookieSent || current.serverPhase !== 'idle' ? 'var(--hue-pink)' : 'var(--text-dim)'}
              />
            </g>
            <text
              className={`csv-chip ${current.cookieSent ? 'is-on' : ''}`}
              x={pageX - 34}
              y={victim.y + 85}
            >
              session cookie
            </text>
          </g>

          {/* attacker page */}
          <g>
            <rect
              className={`csv-box csv-attacker ${current.active === 'attacker' ? 'is-active' : ''}`}
              x={victim.x}
              y={victim.y - 96}
              width={victim.w}
              height={70}
              rx={10}
              style={{ stroke: attackerColor, opacity: current.forged ? 1 : 0.4 }}
            />
            <g transform={`translate(${victim.x + 14}, ${victim.y - 84})`}>
              {current.forged
                ? <ShieldAlert size={16} color="var(--warning)" />
                : <ShieldCheck size={16} color="var(--hue-mint)" />}
            </g>
            <text className="csv-box-title" x={pageX + 8} y={victim.y - 70}>
              {current.forged ? 'evil.com page' : 'bank.com tab'}
            </text>
            <text className="csv-box-sub" x={pageX} y={victim.y - 50}>
              {current.forged ? 'cannot read bank’s token' : 'can read the CSRF token'}
            </text>
          </g>

          {/* server */}
          <g>
            <rect
              className={`csv-box ${current.active === 'server' || current.active === 'outcome' ? 'is-active' : ''}`}
              x={server.x}
              y={server.y}
              width={server.w}
              height={server.h}
              rx={10}
              style={(current.active === 'server' || current.active === 'outcome')
                ? { stroke: accepted ? 'var(--easy)' : current.outcome ? 'var(--hard)' : 'var(--accent)' }
                : undefined}
            />
            <rect x={server.x} y={server.y} width={server.w} height={6} rx={3} fill="var(--hue-violet)" opacity={0.7} />
            <text className="csv-box-title" x={server.x + server.w / 2} y={server.y + 30}>bank.com server</text>
            <text className="csv-box-sub" x={server.x + server.w / 2} y={server.y + 50}>/transfer</text>
            <text
              className={`csv-check ${current.serverPhase === 'check-cookie' || current.cookieSent ? 'is-pass' : ''}`}
              x={server.x + server.w / 2}
              y={server.y + 76}
            >
              cookie: {current.cookieSent ? 'valid' : '—'}
            </text>
            <text
              className={`csv-check ${current.tokenRequired
                ? (current.tokenSent ? 'is-pass' : (current.serverPhase === 'token-missing' ? 'is-fail' : ''))
                : 'is-dim'}`}
              x={server.x + server.w / 2}
              y={server.y + 96}
            >
              token: {current.tokenRequired ? (current.tokenSent ? 'valid' : 'missing') : 'not checked'}
            </text>
          </g>

          {/* request arrow victim -> server */}
          {requestVisible && (
            <g>
              <line
                className={`csv-flow ${current.forged ? 'is-forged' : ''}`}
                x1={victim.x + victim.w + 6}
                y1={arrowY}
                x2={server.x - 6}
                y2={arrowY}
                markerEnd={current.forged ? 'url(#csv-arrow-danger)' : 'url(#csv-arrow-accent)'}
              />
              <text className="csv-flow-label" x={(victim.x + victim.w + server.x) / 2} y={arrowY - 14}>
                POST /transfer
              </text>
              <g transform={`translate(${(victim.x + victim.w + server.x) / 2 - 58}, ${arrowY + 8})`}>
                {current.cookieSent && (
                  <>
                    <Cookie size={13} color="var(--hue-pink)" />
                    <text className="csv-flow-chip" x={18} y={11}>cookie</text>
                  </>
                )}
                {current.tokenSent && (
                  <g transform="translate(72, 0)">
                    <KeyRound size={13} color="var(--easy)" />
                    <text className="csv-flow-chip is-token" x={18} y={11}>token</text>
                  </g>
                )}
              </g>
            </g>
          )}

          {/* verdict badge */}
          {current.outcome && (
            <g>
              <text
                className={`csv-badge ${accepted ? 'is-accept' : 'is-reject'}`}
                x={W / 2}
                y={H - 56}
              >
                {accepted ? 'ACCEPTED' : 'REJECTED'}
              </text>
              <text className="csv-badge-sub" x={W / 2} y={H - 32}>
                {accepted && current.forged
                  ? 'forged transfer succeeded — money moved'
                  : accepted
                    ? 'genuine transfer processed'
                    : 'forged transfer blocked'}
              </text>
            </g>
          )}
          {!current.outcome && (
            <text className="csv-stage-hint" x={W / 2} y={H - 40}>
              press Play to walk the request from login to the server&apos;s verdict
            </text>
          )}
        </svg>
      </div>

      <div className="csv-metrics">
        <div className="csv-metric">
          <span className="csv-metric-label">origin</span>
          <span className={`csv-metric-value ${current.forged ? 'is-reject' : 'is-accept'}`}>
            {current.origin}
          </span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">cookie sent</span>
          <span className="csv-metric-value">{current.cookieSent ? 'yes' : '—'}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">token check</span>
          <span className="csv-metric-value">{current.tokenRequired ? 'ON' : 'OFF'}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">token sent</span>
          <span className="csv-metric-value">{current.tokenSent ? 'valid' : (current.tokenRequired ? '—' : 'n/a')}</span>
        </div>
        <div className="csv-metric">
          <span className="csv-metric-label">outcome</span>
          <span className={`csv-metric-value ${accepted ? 'is-accept' : current.outcome ? 'is-reject' : ''}`}>
            {current.outcome || '—'}
          </span>
        </div>
      </div>

      <div className={`csv-why ${accepted ? 'is-accept' : current.outcome ? 'is-reject' : ''}`}>
        <span className="csv-why-label">why</span>
        <span className="csv-why-body">{current.why || 'no verdict yet — the server has not finished validating.'}</span>
      </div>

      <div className="csv-narration">
        <span className="csv-narration-label">trace</span>
        <span className="csv-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
