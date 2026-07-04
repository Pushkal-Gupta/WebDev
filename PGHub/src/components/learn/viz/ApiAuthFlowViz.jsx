import React, { useMemo, useState, useEffect, useRef } from 'react';
import { KeyRound, Play, Pause, SkipForward, RotateCcw, Gauge, ShieldCheck } from 'lucide-react';
import './ApiAuthFlowViz.css';

// A login-to-verify sequence diagram across two vertical lanes (client / server).
// The same eight messages play in either mode; only the labels and the server's
// statefulness differ. Nothing here is random, so a run is fully deterministic.
const PHASES = [
  { dir: 'c2s', phase: 'LOGIN', token: 'none', stored: false, storeId: null,
    session: { label: 'POST /login   { user, pass }', action: 'Credentials are sent once over HTTPS.' },
    jwt: { label: 'POST /login   { user, pass }', action: 'Credentials are sent once over HTTPS.' } },
  { dir: 's2c', phase: 'ISSUE', token: 'valid', stored: true, storeId: 42,
    session: { label: 'Set-Cookie: sid=42', action: 'Server saves the session and returns an opaque id.' },
    jwt: { label: '200  { token: eyJ... }', action: 'Server signs a token and stores nothing.' } },
  { dir: 'c2s', phase: 'REQUEST', token: 'valid', stored: true, storeId: 42,
    session: { label: 'GET /me   Cookie: sid=42', action: 'The browser attaches the cookie automatically.' },
    jwt: { label: 'GET /me   Bearer eyJ...', action: 'Client sends the token in the Authorization header.' } },
  { dir: 's2c', phase: 'VERIFY', token: 'valid', stored: true, storeId: 42,
    session: { label: '200 OK', action: 'Server looks the id up in its store.' },
    jwt: { label: '200 OK', action: 'Server verifies the signature locally, no lookup.' } },
  { dir: 'c2s', phase: 'EXPIRED', token: 'expired', stored: true, storeId: 42,
    session: { label: 'GET /me   Cookie: sid=42', action: 'The session has now expired.' },
    jwt: { label: 'GET /me   Bearer eyJ...', action: 'The token exp has now passed.' } },
  { dir: 's2c', phase: '401', token: 'expired', stored: false, storeId: null,
    session: { label: '401 Unauthorized', action: 'The id is evicted from the store.' },
    jwt: { label: '401 Unauthorized', action: 'The signature is fine but exp is past.' } },
  { dir: 'c2s', phase: 'REFRESH', token: 'expired', stored: false, storeId: null,
    session: { label: 'POST /refresh', action: 'Client exchanges its refresh token for a new one.' },
    jwt: { label: 'POST /refresh', action: 'Client exchanges its refresh token for a new one.' } },
  { dir: 's2c', phase: 'ROTATE', token: 'refreshed', stored: true, storeId: 99,
    session: { label: 'Set-Cookie: sid=99', action: 'A fresh session replaces the old one.' },
    jwt: { label: '200  { token: eyJ... }', action: 'A rotated token is issued; the old refresh token is void.' } },
];

const TOTAL = PHASES.length - 1;

// Geometry — two vertical lifelines with horizontal messages between them.
const W = 400;
const H = 292;
const CL_X = 80;
const SR_X = 320;
const HEAD_Y = 10;
const HEAD_H = 28;
const BOX_Y = 44;
const BOX_H = 26;
const LIFE_TOP = 78;
const LIFE_BOT = 276;
const MSG_Y0 = 98;
const MSG_PITCH = 24;

const msgY = (i) => MSG_Y0 + i * MSG_PITCH;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const TOKEN_TEXT = {
  none: 'none yet',
  valid: 'valid',
  expired: 'expired',
  refreshed: 'refreshed',
};

export default function ApiAuthFlowViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState('session'); // 'session' | 'jwt'
  const timer = useRef(null);

  const safeStep = Math.min(step, TOTAL);
  const cur = PHASES[safeStep];
  const view = mode === 'jwt' ? cur.jwt : cur.session;

  const clientHolds = useMemo(() => {
    // What the client is carrying at the current step.
    let held = null;
    for (let i = 0; i <= safeStep; i += 1) {
      const p = PHASES[i];
      if (p.dir === 's2c' && p.storeId != null) {
        held = mode === 'jwt' ? 'token: eyJ...' : `cookie sid=${p.storeId}`;
      }
    }
    if (safeStep >= 4 && safeStep <= 6) return held ? `${held} (expired)` : null;
    return held;
  }, [safeStep, mode]);

  function togglePlay() {
    if (safeStep >= TOTAL) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  function toggleMode() {
    setMode((m) => (m === 'session' ? 'jwt' : 'session'));
    setStep(0);
    setPlaying(false);
  }

  function reset() {
    setStep(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing || safeStep >= TOTAL) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(TOTAL, s + 1)),
      Math.round((reduced() ? 360 : 900) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, safeStep, speed]);

  const recvX = cur.dir === 'c2s' ? SR_X : CL_X;
  const packetY = msgY(safeStep);

  // Server holds state only in session mode; in JWT mode it is stateless.
  const serverStored = mode === 'session' && cur.stored && cur.storeId != null;

  return (
    <div className="aav">
      <div className="aav-head">
        <div className="aav-head-icon"><KeyRound size={18} /></div>
        <div className="aav-head-text">
          <h3 className="aav-title">Who are you, on every request?</h3>
          <p className="aav-sub">
            Log in once, then replay a credential. In <b>session</b> mode the server remembers you in a
            store; in <b>JWT</b> mode it verifies a signed token and remembers nothing. Watch expiry, the
            401, and the refresh exchange.
          </p>
        </div>
        <button type="button" className="aav-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="aav-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="aav-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="aav-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" className="aav-arrow-head" />
            </marker>
            <filter id="aav-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* lifelines */}
          <line x1={CL_X} y1={LIFE_TOP} x2={CL_X} y2={LIFE_BOT} className="aav-life" />
          <line x1={SR_X} y1={LIFE_TOP} x2={SR_X} y2={LIFE_BOT} className="aav-life" />

          {/* lane headers */}
          <g className="aav-lane">
            <rect x={CL_X - 52} y={HEAD_Y} width={104} height={HEAD_H} rx={8} className="aav-head-box" />
            <text x={CL_X} y={HEAD_Y + 18} className="aav-head-label" textAnchor="middle">CLIENT</text>
          </g>
          <g className="aav-lane">
            <rect x={SR_X - 52} y={HEAD_Y} width={104} height={HEAD_H} rx={8} className="aav-head-box" />
            <text x={SR_X} y={HEAD_Y + 18} className="aav-head-label" textAnchor="middle">SERVER</text>
          </g>

          {/* client-held credential box */}
          <g className={`aav-hold${clientHolds ? ' is-full' : ''}`}>
            <rect x={CL_X - 56} y={BOX_Y} width={112} height={BOX_H} rx={7} className="aav-hold-box" />
            <text x={CL_X} y={BOX_Y + 16} className="aav-hold-text" textAnchor="middle">
              {clientHolds || 'no credential'}
            </text>
          </g>

          {/* server-side store (session) vs stateless (jwt) */}
          <g className={`aav-store${serverStored ? ' is-full' : ''}${mode === 'jwt' ? ' is-stateless' : ''}`}>
            <rect x={SR_X - 56} y={BOX_Y} width={112} height={BOX_H} rx={7} className="aav-store-box" />
            <text x={SR_X} y={BOX_Y + 16} className="aav-store-text" textAnchor="middle">
              {mode === 'jwt'
                ? 'stateless — no store'
                : serverStored ? `store: sid=${cur.storeId}` : 'store: empty'}
            </text>
          </g>

          {/* messages */}
          {PHASES.map((p, i) => {
            const fromX = p.dir === 'c2s' ? CL_X : SR_X;
            const toX = p.dir === 'c2s' ? SR_X : CL_X;
            const y = msgY(i);
            const active = i === safeStep;
            const done = i < safeStep;
            const err = p.phase === '401';
            const cls = `aav-msg${active ? ' is-active' : ''}${done ? ' is-done' : ''}${err ? ' is-err' : ''}`;
            return (
              <g key={p.phase + i} className={cls}>
                <line x1={fromX} y1={y} x2={toX} y2={y} className="aav-msg-line" markerEnd="url(#aav-arrow)" />
                <text x={(CL_X + SR_X) / 2} y={y - 5} className="aav-msg-label" textAnchor="middle">
                  {mode === 'jwt' ? p.jwt.label : p.session.label}
                </text>
              </g>
            );
          })}

          {/* the credential packet, gliding to the receiving lane */}
          <circle
            cx={recvX} cy={packetY} r={7}
            className={`aav-packet is-${cur.token}`}
            filter="url(#aav-glow)"
          />
        </svg>
      </div>

      <div className="aav-controls">
        <button type="button" className="aav-btn" onClick={togglePlay}>
          {playing && safeStep < TOTAL ? <Pause size={14} /> : <Play size={14} />}
          {playing && safeStep < TOTAL ? 'Pause' : (safeStep >= TOTAL ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="aav-btn" onClick={() => setStep((s) => Math.min(TOTAL, s + 1))} disabled={safeStep >= TOTAL}>
          <SkipForward size={14} /> Step
        </button>
        <button type="button" className={`aav-btn aav-mode${mode === 'jwt' ? ' is-jwt' : ''}`} onClick={toggleMode}>
          <ShieldCheck size={14} /> {mode === 'jwt' ? 'JWT' : 'Session'}
        </button>
        <label className="aav-speed">
          <Gauge size={13} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="aav-speed-range"
          />
          <span className="aav-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="aav-progress">{safeStep} / {TOTAL}</span>
      </div>

      <div className="aav-readout">
        <div className="aav-stat is-mode">
          <span className="aav-stat-label">mode</span>
          <span className="aav-stat-val">{mode === 'jwt' ? 'JWT (stateless)' : 'Session (stateful)'}</span>
        </div>
        <div className="aav-stat is-phase">
          <span className="aav-stat-label">step</span>
          <span className="aav-stat-val">{cur.phase}</span>
        </div>
        <div className={`aav-stat is-token tok-${cur.token}`}>
          <span className="aav-stat-label">token</span>
          <span className="aav-stat-val">{TOKEN_TEXT[cur.token]}</span>
        </div>
      </div>

      <div className="aav-note">
        <span className="aav-note-label">now</span>
        <span className="aav-note-body">{view.action}</span>
      </div>
    </div>
  );
}
