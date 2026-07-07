import React, { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, ChevronRight, RotateCcw, ShieldAlert, ShieldCheck,
  Cookie, Server, Globe, KeyRound, Gauge,
} from 'lucide-react';
import './SecCsrfViz.css';

// A cross-site request forgery, staged as a two-lane vertical sequence.
// LEFT lane = the victim's browser (already holding a bank.com session
// cookie). RIGHT lane = the target server. An attacker page at the top
// triggers a forged POST; the browser auto-attaches the cookie and the
// request crosses to the server. Two independent defenses decide the
// outcome: an anti-CSRF token (server can't find a valid one, so it
// rejects) and a SameSite cookie (the browser never attaches the cookie
// cross-site). EITHER defense blocks the forgery; only with BOTH off does
// the money move. Fully deterministic — no randomness anywhere.

const STEP_META = [
  { key: 'visit', label: 'victim visits attacker page' },
  { key: 'submit', label: 'attacker auto-submits forged POST' },
  { key: 'cookie', label: 'browser handles the session cookie' },
  { key: 'arrive', label: 'forged request reaches server' },
  { key: 'verdict', label: 'server verdict' },
];
const TOTAL_STEPS = STEP_META.length;
const RUN_DELAY_MS = 1500;

// SVG geometry — two vertical lanes, sequence progresses downward, the
// request packet crosses horizontally between lanes at the cookie step.
const W = 640;
const H = 430;
const BROWSER_X = 40;
const SERVER_X = 350;
const LANE_W = 250;
const BROWSER_MID = BROWSER_X + LANE_W / 2;
const SERVER_MID = SERVER_X + LANE_W / 2;

// Packet resting position per step.
const PACKET = [
  { cx: 320, cy: 37 },
  { cx: BROWSER_MID, cy: 161 },
  { cx: BROWSER_MID, cy: 261 },
  { cx: SERVER_MID, cy: 261 },
  { cx: SERVER_MID, cy: 363 },
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function SecCsrfViz() {
  const [token, setToken] = useState(false);
  const [sameSite, setSameSite] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  // Either defense stops the forgery. With both off, it succeeds.
  const defended = token || sameSite;
  const outcome = defended ? 'blocked' : 'success';
  const tone = outcome === 'success' ? 'bad' : 'ok';

  const isRunning = isRunningRaw && step < TOTAL_STEPS - 1;
  const delay = Math.round((reduced() ? 520 : RUN_DELAY_MS) / Math.max(0.5, speed));

  useEffect(() => {
    if (!isRunning) return undefined;
    runTimer.current = setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }, delay);
    return () => {
      if (runTimer.current) {
        clearTimeout(runTimer.current);
        runTimer.current = null;
      }
    };
  }, [isRunning, step, delay]);

  useEffect(() => () => {
    if (runTimer.current) clearTimeout(runTimer.current);
  }, []);

  const reset = () => {
    setIsRunning(false);
    setStep(0);
  };
  const toggleToken = () => {
    setIsRunning(false);
    setStep(0);
    setToken((v) => !v);
  };
  const toggleSameSite = () => {
    setIsRunning(false);
    setStep(0);
    setSameSite((v) => !v);
  };

  const stepKey = STEP_META[Math.min(step, TOTAL_STEPS - 1)].key;
  const decided = step >= TOTAL_STEPS - 1;
  const cookieHandled = step >= 2;
  const arrived = step >= 3;

  // Did the session cookie ride along cross-site? SameSite withholds it.
  const cookieSent = cookieHandled ? !sameSite : null;

  const playLabel = isRunningRaw && step < TOTAL_STEPS - 1
    ? 'Pause'
    : (step >= TOTAL_STEPS - 1 ? 'Replay' : 'Play');

  const packet = PACKET[Math.min(step, TOTAL_STEPS - 1)];

  const cookieNodeLabel = !cookieHandled
    ? 'session cookie waiting'
    : (sameSite ? 'SameSite: cookie withheld cross-site' : 'session cookie auto-attached');
  const cookieTone = !cookieHandled ? 'dim' : (sameSite ? 'ok' : 'bad');

  const verdictText = !decided
    ? 'pending'
    : (outcome === 'success' ? 'transfer succeeds' : 'forgery rejected');
  const verdictDetail = !decided
    ? ''
    : (outcome === 'success'
      ? 'cookie alone was trusted — money moved'
      : token && sameSite
        ? 'token missing AND cookie withheld'
        : token
          ? 'no valid anti-CSRF token — 403'
          : 'cookie withheld cross-site — 401');

  const STEP_NOTE = {
    visit: 'The victim is already logged into bank.com — the browser holds a live session cookie. Now they open a page on evil.com. That page cannot read the cookie (same-origin policy), but it does not need to; it only needs the browser to make a request.',
    submit: 'The attacker page contains a hidden form whose action points at bank.com/transfer, and a line of script that submits it the instant the page loads. No click required — the forged POST is on its way.',
    cookie: sameSite
      ? 'The browser is about to send the POST to bank.com. Because the session cookie is marked SameSite, the browser refuses to attach it to this cross-site request. The forged POST leaves with no session.'
      : 'The browser sends the POST to bank.com and, by design, auto-attaches the bank.com session cookie. It never asks which page started the request — a request to bank.com simply gets bank.com cookies.',
    arrive: token
      ? 'The forged request reaches the server. The server looks for the per-session anti-CSRF token that every real form carries. The attacker could not read it across origins, so it is missing.'
      : (sameSite
        ? 'The request reaches the server carrying no session cookie. To the server this looks like an anonymous, unauthenticated request.'
        : 'The request reaches the server carrying a valid session cookie and no other check to pass. It looks perfectly authenticated.'),
    verdict: outcome === 'success'
      ? 'The server treated the session cookie as proof of intent. The forgery goes through and the transfer completes in the victim\'s name. This is a live CSRF.'
      : (token && sameSite
        ? 'Both layers held: the cookie was withheld cross-site and no valid token was present. The forged request is rejected.'
        : token
          ? 'The server found no valid anti-CSRF token and rejects the request with 403. The forgery fails.'
          : 'With no session cookie attached, the server sees an unauthenticated request and rejects it. The forgery fails.'),
  };

  const browserNodeA = { active: step === 1, done: step > 1 };
  const browserNodeB = { active: step === 2, done: step > 2 };
  const serverNodeA = { active: step === 3, done: step > 3 };

  return (
    <div className="scv">
      <div className="scv-head">
        <div className="scv-head-icon"><ShieldAlert size={18} /></div>
        <div className="scv-head-text">
          <h3 className="scv-title">Cross-site request forgery — the confused deputy</h3>
          <p className="scv-sub">
            An attacker page makes the victim&apos;s browser fire an authenticated POST at the bank.
            The browser auto-attaches the session cookie. Turn on either defense — an anti-CSRF token
            or a SameSite cookie — and the forgery is rejected.
          </p>
        </div>
        <button type="button" className="scv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="scv-controls">
        <button
          type="button"
          className={`scv-toggle ${token ? 'is-good' : ''}`}
          onClick={toggleToken}
          aria-pressed={token}
          title="Require a per-session anti-CSRF token on the request"
        >
          <KeyRound size={14} />
          anti-CSRF token {token ? 'on' : 'off'}
        </button>
        <button
          type="button"
          className={`scv-toggle ${sameSite ? 'is-good' : ''}`}
          onClick={toggleSameSite}
          aria-pressed={sameSite}
          title="Mark the session cookie SameSite so it is not sent cross-site"
        >
          <Cookie size={14} />
          SameSite cookie {sameSite ? 'on' : 'off'}
        </button>

        <span className="scv-spacer" aria-hidden="true" />

        <label className="scv-speed">
          <Gauge size={13} />
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="scv-speed-range"
            aria-label="Playback speed"
          />
          <span className="scv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <div className="scv-buttons">
          <button
            type="button"
            className="scv-btn scv-btn-primary"
            onClick={() => {
              if (step >= TOTAL_STEPS - 1) setStep(0);
              setIsRunning((v) => !v);
            }}
          >
            {isRunningRaw && step < TOTAL_STEPS - 1 ? <Pause size={14} /> : <Play size={14} />}
            {playLabel}
          </button>
          <button
            type="button"
            className="scv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}
            disabled={step >= TOTAL_STEPS - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
        </div>
        <div className="scv-stepcount">
          step <strong>{step + 1}</strong> / {TOTAL_STEPS}
        </div>
      </div>

      <div className="scv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="scv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="scv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="scv-arrow-head" />
            </marker>
            <filter id="scv-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* attacker page banner (top, triggers the flow) */}
          <g className={`scv-attacker ${step >= 1 ? 'is-fired' : ''}`}>
            <rect x={40} y={14} width={560} height={46} rx={9} className="scv-attacker-box" />
            <g transform="translate(58, 30)">
              <ShieldAlert width={16} height={16} className="scv-attacker-ic" />
            </g>
            <text x={84} y={33} className="scv-attacker-title">evil.com — attacker page</text>
            <text x={84} y={49} className="scv-attacker-sub">hidden form auto-submits POST bank.com/transfer</text>
          </g>

          {/* lane headers */}
          <g transform={`translate(${BROWSER_X + 14}, 92)`}>
            <Globe width={15} height={15} className="scv-lane-ic" />
          </g>
          <text x={BROWSER_X + 34} y={97} className="scv-lane-label">VICTIM BROWSER · holds bank.com cookie</text>
          <g transform={`translate(${SERVER_X + 14}, 92)`}>
            <Server width={15} height={15} className="scv-lane-ic" />
          </g>
          <text x={SERVER_X + 34} y={97} className="scv-lane-label">TARGET SERVER · bank.com</text>

          {/* lane columns */}
          <rect x={BROWSER_X} y={106} width={LANE_W} height={296} rx={11} className="scv-lane scv-lane-browser" />
          <rect x={SERVER_X} y={106} width={LANE_W} height={296} rx={11} className="scv-lane scv-lane-server" />

          {/* connectors: banner -> browserA, browserA -> browserB,
              browserB -> serverA (the cross-lane hop), serverA -> serverB */}
          <line x1={BROWSER_MID} y1={60} x2={BROWSER_MID} y2={128} className={`scv-conn ${step >= 1 ? 'is-live' : ''}`} markerEnd="url(#scv-arrow)" />
          <line x1={BROWSER_MID} y1={194} x2={BROWSER_MID} y2={228} className={`scv-conn ${step >= 2 ? 'is-live' : ''}`} markerEnd="url(#scv-arrow)" />
          <line x1={BROWSER_X + LANE_W + 2} y1={261} x2={SERVER_X - 2} y2={261} className={`scv-conn scv-conn-cross ${step >= 3 ? 'is-live' : ''} ${arrived && !cookieSent ? 'is-empty' : ''}`} markerEnd="url(#scv-arrow)" />
          <line x1={SERVER_MID} y1={294} x2={SERVER_MID} y2={330} className={`scv-conn ${step >= 4 ? 'is-live' : ''}`} markerEnd="url(#scv-arrow)" />

          {/* browser node A — forge/submit */}
          <g className={`scv-node ${browserNodeA.active ? 'is-active' : ''} ${browserNodeA.done ? 'is-done' : ''}`}>
            <rect x={BROWSER_X + 14} y={128} width={LANE_W - 28} height={66} rx={9} className="scv-node-box" />
            <text x={BROWSER_X + 28} y={152} className="scv-node-title">forged POST built</text>
            <text x={BROWSER_X + 28} y={172} className="scv-node-detail">to=attacker&amp;amount=5000</text>
            <text x={BROWSER_X + 28} y={187} className="scv-node-detail">fired without any click</text>
          </g>

          {/* browser node B — cookie handling */}
          <g className={`scv-node is-${cookieTone} ${browserNodeB.active ? 'is-active' : ''} ${browserNodeB.done ? 'is-done' : ''}`}>
            <rect x={BROWSER_X + 14} y={228} width={LANE_W - 28} height={66} rx={9} className="scv-node-box" />
            <g transform={`translate(${BROWSER_X + LANE_W - 40}, 240)`}>
              <Cookie width={16} height={16} className={`scv-node-ic is-${cookieTone}`} />
            </g>
            <text x={BROWSER_X + 28} y={252} className="scv-node-title">session cookie</text>
            {cookieNodeLabel.length > 26
              ? (
                <>
                  <text x={BROWSER_X + 28} y={272} className={`scv-node-detail is-${cookieTone}`}>{sameSite ? 'SameSite: cookie' : 'auto-attached to'}</text>
                  <text x={BROWSER_X + 28} y={287} className={`scv-node-detail is-${cookieTone}`}>{sameSite ? 'withheld cross-site' : 'the cross-site POST'}</text>
                </>
              )
              : (
                <text x={BROWSER_X + 28} y={272} className={`scv-node-detail is-${cookieTone}`}>{cookieNodeLabel}</text>
              )}
          </g>

          {/* server node A — receive */}
          <g className={`scv-node ${serverNodeA.active ? 'is-active' : ''} ${serverNodeA.done ? 'is-done' : ''}`}>
            <rect x={SERVER_X + 14} y={228} width={LANE_W - 28} height={66} rx={9} className="scv-node-box" />
            <text x={SERVER_X + 28} y={252} className="scv-node-title">request received</text>
            <text x={SERVER_X + 28} y={272} className="scv-node-detail">
              {arrived
                ? (cookieSent ? 'checking token…' : 'no cookie → unauthenticated')
                : 'waiting for request'}
            </text>
            {arrived && token && cookieSent && (
              <text x={SERVER_X + 28} y={287} className="scv-node-detail is-bad">token missing</text>
            )}
          </g>

          {/* server node B — verdict */}
          <g className={`scv-node is-verdict ${decided ? `is-${tone}` : ''}`}>
            <rect x={SERVER_X + 14} y={330} width={LANE_W - 28} height={60} rx={9} className="scv-node-box" />
            <g transform={`translate(${SERVER_X + LANE_W - 42}, 342)`}>
              {!decided && <Server width={18} height={18} className="scv-node-ic is-dim" />}
              {decided && tone === 'bad' && <ShieldAlert width={18} height={18} className="scv-node-ic is-bad" />}
              {decided && tone === 'ok' && <ShieldCheck width={18} height={18} className="scv-node-ic is-ok" />}
            </g>
            <text x={SERVER_X + 28} y={356} className={`scv-node-title is-${decided ? tone : 'dim'}`}>{verdictText}</text>
            <text x={SERVER_X + 28} y={378} className={`scv-node-detail is-${decided ? tone : 'dim'}`}>
              {decided ? (outcome === 'success' ? 'HTTP 200 · money moved' : 'HTTP 403/401 · blocked') : 'pending'}
            </text>
          </g>

          {/* the request packet */}
          <circle
            cx={packet.cx}
            cy={packet.cy}
            r={9}
            className={`scv-packet ${cookieSent === false && step >= 2 ? 'is-empty' : ''} ${decided ? `is-${tone}` : ''}`}
            filter="url(#scv-glow)"
          />
        </svg>
      </div>

      <div className="scv-readouts">
        <div className="scv-metric">
          <span className="scv-metric-label">anti-CSRF token</span>
          <span className={`scv-metric-value ${token ? 'is-ok' : 'is-dim'}`}>
            {token ? 'on — required' : 'off — not checked'}
          </span>
        </div>
        <div className="scv-metric">
          <span className="scv-metric-label">SameSite cookie</span>
          <span className={`scv-metric-value ${sameSite ? 'is-ok' : 'is-dim'}`}>
            {sameSite ? 'on — Lax' : 'off — sent cross-site'}
          </span>
        </div>
        <div className="scv-metric">
          <span className="scv-metric-label">cookie sent cross-site?</span>
          <span className={`scv-metric-value ${cookieSent === null ? 'is-dim' : (cookieSent ? 'is-bad' : 'is-ok')}`}>
            {cookieSent === null ? 'not yet' : (cookieSent ? 'yes — attached' : 'no — withheld')}
          </span>
        </div>
        <div className="scv-metric scv-metric-dim">
          <span className="scv-metric-label">verdict</span>
          <span className={`scv-metric-value is-${decided ? tone : 'dim'}`}>
            {decided ? verdictText : 'pending'}
          </span>
        </div>
      </div>

      <div className={`scv-narration is-${stepKey === 'verdict' ? tone : 'accent'}`}>
        <span className="scv-narration-label">{STEP_META[Math.min(step, TOTAL_STEPS - 1)].label}</span>
        <span className="scv-narration-body">{STEP_NOTE[stepKey]}</span>
        {decided && verdictDetail && (
          <span className={`scv-narration-verdict is-${tone}`}>{verdictDetail}</span>
        )}
      </div>

      <div className="scv-legend">
        <span className="scv-legend-item"><ShieldAlert size={13} className="scv-ic is-bad" /> both defenses off — forgery succeeds</span>
        <span className="scv-legend-item"><KeyRound size={13} className="scv-ic is-ok" /> token — attacker can&apos;t read it cross-origin</span>
        <span className="scv-legend-item"><Cookie size={13} className="scv-ic is-ok" /> SameSite — cookie never sent cross-site</span>
        <span className="scv-legend-item"><ShieldCheck size={13} className="scv-ic is-ok" /> either layer alone rejects the request</span>
      </div>
    </div>
  );
}
