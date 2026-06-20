import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, SkipForward, User, Server, KeyRound, ShieldCheck } from 'lucide-react';
import './OAuthJwtViz.css';

const ACTORS = [
  { key: 'user', title: 'User', sub: 'browser', icon: User, accent: 'var(--hue-sky)' },
  { key: 'client', title: 'Client App', sub: 'your service', icon: Server, accent: 'var(--accent)' },
  { key: 'auth', title: 'Authorization Server', sub: 'login + consent', icon: KeyRound, accent: 'var(--hue-violet)' },
  { key: 'resource', title: 'Resource Server', sub: 'protected API', icon: ShieldCheck, accent: 'var(--hue-mint)' },
];

const FLOW = [
  { from: 'user', to: 'client', chip: 'click login', held: 'none', note: 'The user clicks "Log in" on the client app. No credentials are sent to the client itself.' },
  { from: 'client', to: 'auth', chip: 'redirect + state', held: 'none', note: 'The client redirects the browser to the authorization server with client_id, scope, redirect_uri and a state value.' },
  { from: 'user', to: 'auth', chip: 'credentials', held: 'none', note: 'The user authenticates directly with the authorization server. The client never sees the password.' },
  { from: 'user', to: 'auth', chip: 'grant consent', held: 'none', note: 'The user approves the requested scopes on the consent screen.' },
  { from: 'auth', to: 'client', chip: 'auth code', held: 'code', note: 'The authorization server redirects back to the client with a short-lived authorization code.' },
  { from: 'client', to: 'auth', chip: 'code + secret', held: 'code', note: 'Back-channel: the client POSTs the code plus its client_secret to the token endpoint.' },
  { from: 'auth', to: 'client', chip: 'access + id token', held: 'token', note: 'The token endpoint returns an access token (a JWT) and an OIDC ID token.' },
  { from: 'client', to: 'resource', chip: 'Bearer JWT', held: 'token', note: 'The client calls the resource server, sending the access token in the Authorization: Bearer header.' },
  { from: 'resource', to: 'client', chip: 'protected data', held: 'token', note: 'The resource server validates the JWT signature with the auth server public key and returns protected data.' },
];

const SAMPLE_JWT = {
  header: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9',
  payload: 'eyJzdWIiOiIxMDI0Nzg5IiwibmFtZSI6IkF2YSBTdG9uZSIsImlhdCI6MTcxODQ1MjQwMCwiZXhwIjoxNzE4NDU2MDAwLCJpc3MiOiJodHRwczovL2F1dGgucGdjb2RlLmRldiIsImF1ZCI6InBnY29kZS1hcGkifQ',
  signature: 'sFlK-9zQ2bV7mE1xR0pYhN3uJ6cD8aWqL4tG5oZ',
};

const DECODED_HEADER = { alg: 'RS256', typ: 'JWT' };
const DECODED_PAYLOAD = {
  sub: '1024789',
  name: 'Ava Stone',
  iat: 1718452400,
  exp: 1718456000,
  iss: 'https://auth.pgcode.dev',
  aud: 'pgcode-api',
};

function buildFrames() {
  const frames = [];
  frames.push({
    step: -1,
    from: null,
    to: null,
    chip: null,
    held: 'none',
    note: 'OAuth 2.0 authorization-code flow with OIDC. The user authenticates at the authorization server; the client receives a code, swaps it for a signed JWT access token, then calls the resource server.',
  });
  FLOW.forEach((f, i) => {
    frames.push({ step: i, ...f });
  });
  frames.push({
    step: FLOW.length,
    from: null,
    to: null,
    chip: null,
    held: 'token',
    note: 'Done. The client holds a verified JWT access token and the protected data. The token is signed (RS256) so the resource server trusts it without calling back to the auth server.',
  });
  return frames;
}

const HELD_LABEL = { none: 'none', code: 'authorization code', token: 'access token (JWT)' };

const RUN_DELAY_MS = 1300;

function jsonLines(obj) {
  const entries = Object.entries(obj);
  return entries.map(([k, v], i) => {
    const val = typeof v === 'string' ? `"${v}"` : String(v);
    return { k, v: val, comma: i < entries.length - 1 };
  });
}

export default function OAuthJwtViz() {
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(), []);
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

  const W = 940;
  const H = 320;
  const pad = 20;
  const gap = 16;
  const boxW = (W - pad * 2 - gap * 3) / 4;
  const boxH = 92;
  const boxY = 46;
  const boxX = (i) => pad + i * (boxW + gap);
  const boxCx = (i) => boxX(i) + boxW / 2;

  const actorIndex = (key) => ACTORS.findIndex((a) => a.key === key);
  const laneY = boxY + boxH + 70;

  const fromI = current.from ? actorIndex(current.from) : null;
  const toI = current.to ? actorIndex(current.to) : null;
  const chipX = fromI != null && toI != null ? (boxCx(fromI) + boxCx(toI)) / 2 : null;

  const playLabel = isRunningRaw && step < totalSteps - 1 ? 'Pause' : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const headerLines = jsonLines(DECODED_HEADER);
  const payloadLines = jsonLines(DECODED_PAYLOAD);

  return (
    <div className="ojv">
      <div className="ojv-head">
        <h3 className="ojv-title">OAuth 2.0 authorization-code flow with a JWT access token</h3>
        <p className="ojv-sub">
          Step a login through four actors. The user authenticates at the authorization server, the client swaps a
          short-lived code for a signed JWT, then calls the resource server which verifies the signature.
        </p>
      </div>

      <div className="ojv-controls">
        <label className="ojv-speed">
          <span className="ojv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ojv-speed-range"
            aria-label="Playback speed"
          />
          <span className="ojv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="ojv-spacer" aria-hidden="true" />

        <div className="ojv-buttons">
          <button
            type="button"
            className="ojv-btn ojv-btn-primary"
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
            className="ojv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="ojv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="ojv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="ojv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="ojv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="ojv-svg" preserveAspectRatio="xMidYMid meet">
          {ACTORS.map((a, i) => {
            const active = current.from === a.key || current.to === a.key;
            const Icon = a.icon;
            return (
              <g key={`actor-${a.key}`}>
                <rect
                  className={`ojv-actor ${active ? 'is-active' : ''}`}
                  x={boxX(i)}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx={10}
                  style={active ? { stroke: a.accent } : undefined}
                />
                <rect x={boxX(i)} y={boxY} width={boxW} height={5} rx={2.5} fill={a.accent} opacity={active ? 1 : 0.55} />
                <g transform={`translate(${boxCx(i) - 9}, ${boxY + 18})`} className="ojv-actor-icon" style={{ color: a.accent }}>
                  <Icon size={18} />
                </g>
                <text className="ojv-actor-title" x={boxCx(i)} y={boxY + 56}>{a.title}</text>
                <text className="ojv-actor-sub" x={boxCx(i)} y={boxY + 74}>{a.sub}</text>
              </g>
            );
          })}

          {ACTORS.map((a, i) => (
            <line
              key={`lane-${a.key}`}
              className="ojv-lane"
              x1={boxCx(i)}
              y1={boxY + boxH}
              x2={boxCx(i)}
              y2={laneY + 36}
            />
          ))}

          {fromI != null && toI != null && (
            <g>
              <line
                className="ojv-arrow"
                x1={boxCx(fromI)}
                y1={laneY}
                x2={boxCx(toI)}
                y2={laneY}
                markerEnd="url(#ojv-arrowhead)"
              />
              <rect
                className="ojv-chip"
                x={chipX - 78}
                y={laneY - 20}
                width={156}
                height={26}
                rx={13}
              />
              <text className="ojv-chip-text" x={chipX} y={laneY - 3}>{current.chip}</text>
            </g>
          )}

          <defs>
            <marker id="ojv-arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path className="ojv-arrowhead" d="M0,0 L9,4.5 L0,9 Z" />
            </marker>
          </defs>

          <text className="ojv-held-label" x={pad} y={laneY + 66}>token held by client</text>
          <rect
            className={`ojv-held ${current.held !== 'none' ? 'is-on' : ''}`}
            x={pad}
            y={laneY + 74}
            width={260}
            height={30}
            rx={8}
          />
          <text className="ojv-held-text" x={pad + 14} y={laneY + 94}>{HELD_LABEL[current.held]}</text>
        </svg>
      </div>

      <div className="ojv-metrics">
        <div className="ojv-metric">
          <span className="ojv-metric-label">step</span>
          <span className="ojv-metric-value">{Math.max(current.step + 1, 0)} / {FLOW.length}</span>
        </div>
        <div className="ojv-metric">
          <span className="ojv-metric-label">held by client</span>
          <span className={`ojv-metric-value ${current.held === 'token' ? 'is-token' : current.held === 'code' ? 'is-code' : ''}`}>
            {HELD_LABEL[current.held]}
          </span>
        </div>
        <div className="ojv-metric">
          <span className="ojv-metric-label">message</span>
          <span className="ojv-metric-value">{current.chip || '—'}</span>
        </div>
      </div>

      <div className="ojv-narration">
        <span className="ojv-narration-label">trace</span>
        <span className="ojv-narration-body">{current.note}</span>
      </div>

      <div className="ojv-jwt">
        <div className="ojv-jwt-head">
          <span className="ojv-jwt-title">The access token decoded — a JWT is three base64url segments joined by dots</span>
        </div>
        <div className="ojv-jwt-raw">
          <span className="ojv-jwt-seg is-header">{SAMPLE_JWT.header}</span>
          <span className="ojv-jwt-dot">.</span>
          <span className="ojv-jwt-seg is-payload">{SAMPLE_JWT.payload}</span>
          <span className="ojv-jwt-dot">.</span>
          <span className="ojv-jwt-seg is-signature">{SAMPLE_JWT.signature}</span>
        </div>

        <div className="ojv-jwt-panes">
          <div className="ojv-pane is-header">
            <span className="ojv-pane-label">HEADER · algorithm &amp; token type</span>
            <pre className="ojv-pane-body">
              {'{\n'}
              {headerLines.map((l) => (
                <span key={`h-${l.k}`} className="ojv-json-line">
                  {'  '}
                  <span className="ojv-json-key">&quot;{l.k}&quot;</span>: <span className="ojv-json-val">{l.v}</span>{l.comma ? ',' : ''}{'\n'}
                </span>
              ))}
              {'}'}
            </pre>
          </div>

          <div className="ojv-pane is-payload">
            <span className="ojv-pane-label">PAYLOAD · claims</span>
            <pre className="ojv-pane-body">
              {'{\n'}
              {payloadLines.map((l) => (
                <span key={`p-${l.k}`} className="ojv-json-line">
                  {'  '}
                  <span className="ojv-json-key">&quot;{l.k}&quot;</span>: <span className="ojv-json-val">{l.v}</span>{l.comma ? ',' : ''}{'\n'}
                </span>
              ))}
              {'}'}
            </pre>
          </div>

          <div className="ojv-pane is-signature">
            <span className="ojv-pane-label">SIGNATURE</span>
            <div className="ojv-sig-raw">{SAMPLE_JWT.signature}</div>
            <div className="ojv-sig-note">verified with auth server public key</div>
          </div>
        </div>
      </div>
    </div>
  );
}
