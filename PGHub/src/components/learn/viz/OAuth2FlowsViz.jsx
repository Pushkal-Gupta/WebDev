import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  User, AppWindow, KeyRound, Database, Check, ArrowRight,
} from 'lucide-react';
import './OAuth2FlowsViz.css';

// OAuth2 Authorization Code flow across four actors: the resource owner (User),
// the Client app, the Authorization Server, and the Resource Server. We step the
// authorization-code grant hop by hop and show the ACTUAL query/body params on
// each message. A PKCE toggle adds code_challenge (step 2) + code_verifier
// (step 5) and an extra verification frame; turning it off falls back to a
// confidential client authenticating with client_secret.

const ACTORS = [
  { key: 'user', label: 'User', sub: 'resource owner', icon: 'user' },
  { key: 'client', label: 'Client', sub: 'the app', icon: 'app' },
  { key: 'auth', label: 'Auth Server', sub: 'authorize + token', icon: 'key' },
  { key: 'res', label: 'Resource Server', sub: 'protected API', icon: 'db' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  login: 'login',
  authorize: 'authorize',
  consent: 'consent',
  callback: 'callback',
  exchange: 'token exchange',
  verify: 'pkce verify',
  token: 'token issued',
  resource: 'resource call',
  done: 'done',
};

const SAMPLE = {
  clientId: 'pgcode-web',
  redirect: 'https://app.pgcode.dev/cb',
  scope: 'profile email',
  state: 'xyz789',
  code: 'AUTH_9f3aK',
  challenge: 'E9Melh...kRMQ',
  verifier: 'dBjftJ...n3vR8',
  secret: 'cs_live_••••',
  access: 'at_7Hq2...Lp',
  refresh: 'rt_Z0c...9W',
};

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label} | null,
//          params:[{k,v,pkce?,secret?}], inFlight, clientType, note }
function buildFrames(pkce) {
  const clientType = pkce ? 'public (PKCE)' : 'confidential (secret)';
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    clientType,
    note: pkce
      ? 'Authorization Code flow with PKCE. The client is a public client (an SPA or mobile app) that cannot keep a secret, so it proves itself with a one-time code_verifier instead. Step through each hop and watch the params on the wire.'
      : 'Authorization Code flow for a confidential client (a server-side app that can store a secret). Step through each hop and watch the actual params travelling on each message between the four actors.',
  });

  frames.push({
    phase: 'login',
    active: ['user', 'client'],
    msg: { from: 'user', to: 'client', dir: 'fwd', label: 'click "Log in"' },
    params: [{ k: 'action', v: 'login' }],
    inFlight: 'login intent',
    clientType,
    note: 'The user clicks "Log in" on the client app. The client has no credentials yet — it is about to hand the user off to the authorization server, where the real login happens.',
  });

  const authorizeParams = [
    { k: 'response_type', v: 'code' },
    { k: 'client_id', v: SAMPLE.clientId },
    { k: 'redirect_uri', v: SAMPLE.redirect },
    { k: 'scope', v: SAMPLE.scope },
    { k: 'state', v: SAMPLE.state },
  ];
  if (pkce) {
    authorizeParams.push({ k: 'code_challenge', v: SAMPLE.challenge, pkce: true });
    authorizeParams.push({ k: 'code_challenge_method', v: 'S256', pkce: true });
  }
  frames.push({
    phase: 'authorize',
    active: ['client', 'auth'],
    msg: { from: 'client', to: 'auth', dir: 'fwd', label: 'GET /authorize' },
    params: authorizeParams,
    inFlight: pkce ? `code_challenge=${SAMPLE.challenge}` : `state=${SAMPLE.state}`,
    clientType,
    note: pkce
      ? 'The client redirects the browser to GET /authorize. It generates a random code_verifier, hashes it to code_challenge = SHA256(verifier), and sends only the challenge. The verifier never leaves the client yet — that is the whole trick.'
      : 'The client redirects the browser to GET /authorize, asking for response_type=code. The state value is a random anti-CSRF token the client will check on the way back. No secret is sent here — secrets never ride in a browser redirect.',
  });

  frames.push({
    phase: 'consent',
    active: ['user', 'auth'],
    msg: { from: 'auth', to: 'user', dir: 'fwd', label: 'show consent screen' },
    params: [
      { k: 'app', v: SAMPLE.clientId },
      { k: 'scope', v: SAMPLE.scope },
      { k: 'decision', v: 'Approve' },
    ],
    inFlight: 'user approves scope',
    clientType,
    note: 'The authorization server authenticates the user (its own login) and shows a consent screen: "pgcode-web wants profile, email." The user approves. The client app never sees the user\'s password — only the auth server does.',
  });

  frames.push({
    phase: 'callback',
    active: ['auth', 'client'],
    msg: { from: 'auth', to: 'client', dir: 'fwd', label: 'redirect to redirect_uri' },
    params: [
      { k: 'code', v: SAMPLE.code },
      { k: 'state', v: SAMPLE.state },
    ],
    inFlight: `code=${SAMPLE.code}`,
    clientType,
    note: 'The auth server redirects back to redirect_uri with a short-lived authorization code in the query string. The client first checks that state matches what it sent, defeating CSRF. The code is not an access token — it is a one-time ticket to exchange privately.',
  });

  const exchangeParams = [
    { k: 'grant_type', v: 'authorization_code' },
    { k: 'code', v: SAMPLE.code },
    { k: 'client_id', v: SAMPLE.clientId },
    { k: 'redirect_uri', v: SAMPLE.redirect },
  ];
  if (pkce) {
    exchangeParams.push({ k: 'code_verifier', v: SAMPLE.verifier, pkce: true });
  } else {
    exchangeParams.push({ k: 'client_secret', v: SAMPLE.secret, secret: true });
  }
  frames.push({
    phase: 'exchange',
    active: ['client', 'auth'],
    msg: { from: 'client', to: 'auth', dir: 'fwd', label: 'POST /token' },
    params: exchangeParams,
    inFlight: pkce ? `code_verifier=${SAMPLE.verifier}` : 'client_secret (back channel)',
    clientType,
    note: pkce
      ? 'Now the client POSTs to /token on the back channel (server-to-server, no browser). It sends the code plus the raw code_verifier it kept secret. This request is invisible to anyone who only watched the redirect.'
      : 'The client POSTs to /token on the back channel and authenticates with its client_secret. Because the client is confidential and this call never touches the browser, the secret stays safe.',
  });

  if (pkce) {
    frames.push({
      phase: 'verify',
      active: ['auth'],
      msg: { from: 'auth', to: 'auth', dir: 'self', label: 'SHA256(verifier) == challenge ?' },
      params: [
        { k: 'received', v: `verifier=${SAMPLE.verifier}`, pkce: true },
        { k: 'stored', v: `challenge=${SAMPLE.challenge}`, pkce: true },
        { k: 'check', v: 'SHA256(verifier) === challenge', pkce: true },
        { k: 'result', v: 'match -> issue token' },
      ],
      inFlight: 'SHA256(verifier) === challenge',
      clientType,
      note: 'The auth server hashes the verifier it just received and compares it to the challenge it stored at /authorize. They match, so this is the same client that started the flow. An attacker who intercepted the code in the redirect has no verifier — their /token call fails. That is how PKCE kills code interception on public clients.',
    });
  }

  const tokenParams = [
    { k: 'access_token', v: SAMPLE.access },
    { k: 'token_type', v: 'Bearer' },
    { k: 'expires_in', v: '3600' },
    { k: 'refresh_token', v: SAMPLE.refresh },
  ];
  frames.push({
    phase: 'token',
    active: ['auth', 'client'],
    msg: { from: 'auth', to: 'client', dir: 'back', label: '200 OK { tokens }' },
    params: tokenParams,
    inFlight: `access_token=${SAMPLE.access}`,
    clientType,
    note: 'The auth server returns an access_token (a Bearer token good for an hour) and a refresh_token to mint new access tokens later without re-prompting the user. The code is now burned — it cannot be replayed.',
  });

  frames.push({
    phase: 'resource',
    active: ['client', 'res'],
    msg: { from: 'client', to: 'res', dir: 'fwd', label: 'GET /me' },
    params: [
      { k: 'Authorization', v: `Bearer ${SAMPLE.access}` },
      { k: 'path', v: 'GET /api/me' },
    ],
    inFlight: `Authorization: Bearer ${SAMPLE.access}`,
    clientType,
    note: 'The client calls the resource server with the access token in the Authorization: Bearer header. The resource server validates the token (signature, expiry, scope) and, since profile and email were granted, returns the protected data.',
  });

  frames.push({
    phase: 'done',
    active: ['res', 'client'],
    msg: { from: 'res', to: 'client', dir: 'back', label: '200 OK { profile }' },
    params: [
      { k: 'status', v: '200 OK' },
      { k: 'scope', v: SAMPLE.scope },
      { k: 'body', v: '{ id, name, email }' },
    ],
    inFlight: 'protected data returned',
    clientType,
    note: pkce
      ? 'The protected data flows back. The client never saw the user\'s password, the access token never rode in a browser redirect, and PKCE bound the code to the one client that began the flow. A public client just authenticated safely without holding any secret.'
      : 'The protected data flows back. The client never saw the user\'s password, and the access token was minted on a back channel guarded by client_secret. This is exactly why public clients (SPAs, mobile) cannot do it this way — they cannot hide a secret, which is what PKCE solves.',
  });

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function OAuth2FlowsViz() {
  const [pkce, setPkce] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(pkce), [pkce]);
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

  const togglePkce = () => {
    setIsRunning(false);
    setStep(0);
    setPkce((v) => !v);
  };

  // SVG geometry — four actor lanes with vertical lifelines.
  const W = 940;
  const H = 360;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 90;
  const laneX = (i) => pad + (i / (ACTORS.length - 1)) * (W - 2 * pad);
  const msgY = laneTop + 118;

  const ActorIcon = (icon, cls) => {
    if (icon === 'user') return <User width={20} height={20} className={cls} />;
    if (icon === 'app') return <AppWindow width={20} height={20} className={cls} />;
    if (icon === 'key') return <KeyRound width={20} height={20} className={cls} />;
    return <Database width={20} height={20} className={cls} />;
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const msg = current.msg;
  const isActive = (key) => current.active.includes(key);

  // build the in-flight message line geometry
  let msgLine = null;
  if (msg && msg.dir !== 'self') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  const toneForDir = (dir) => (dir === 'back' ? 'back' : dir === 'self' ? 'self' : 'fwd');

  return (
    <div className="o2v">
      <div className="o2v-head">
        <h3 className="o2v-title">OAuth2 authorization code flow — every hop, every param</h3>
        <p className="o2v-sub">
          Trace the authorization-code grant across user, client, auth server, and resource server.
          Toggle PKCE to swap the client_secret back channel for a code_verifier proof and see why a
          public client stays safe even if its code is intercepted.
        </p>
      </div>

      <div className="o2v-controls">
        <button
          type="button"
          className={`o2v-toggle ${pkce ? 'is-on' : ''}`}
          onClick={togglePkce}
          aria-pressed={pkce}
          title="Toggle PKCE (public client) vs client_secret (confidential client)"
        >
          <ShieldCheck size={14} /> PKCE {pkce ? 'on' : 'off'}
        </button>

        <span className="o2v-client-tag">{current.clientType}</span>

        <label className="o2v-speed">
          <span className="o2v-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="o2v-speed-range"
            aria-label="Playback speed"
          />
          <span className="o2v-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="o2v-spacer" aria-hidden="true" />

        <div className="o2v-buttons">
          <button
            type="button"
            className="o2v-btn o2v-btn-primary"
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
            className="o2v-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="o2v-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="o2v-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="o2v-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="o2v-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="o2v-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="o2v-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="o2v-ah is-fwd" />
            </marker>
            <marker id="o2v-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="o2v-ah is-back" />
            </marker>
            <marker id="o2v-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="o2v-ah is-self" />
            </marker>
          </defs>

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <line
                key={`life-${a.key}`}
                className={`o2v-life ${on ? 'is-on' : ''}`}
                x1={x}
                y1={laneTop + 44}
                x2={x}
                y2={laneBottom}
              />
            );
          })}

          {/* in-flight message */}
          {msgLine && (
            <g>
              <line
                className={`o2v-msg is-${toneForDir(msg.dir)}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#o2v-arr-${toneForDir(msg.dir)})`}
              />
              <text
                className={`o2v-msg-label is-${toneForDir(msg.dir)}`}
                x={msgLine.mid}
                y={msgY - 10}
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          )}
          {selfActor != null && (
            <g>
              <path
                className="o2v-msg is-self"
                d={`M ${selfActor} ${msgY - 14} q 54 0 54 16 q 0 16 -54 16`}
                fill="none"
                markerEnd="url(#o2v-arr-self)"
              />
              <text className="o2v-msg-label is-self" x={selfActor + 60} y={msgY + 4} textAnchor="start">
                {msg.label}
              </text>
            </g>
          )}

          {/* actor headers */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <g key={`actor-${a.key}`}>
                <rect
                  className={`o2v-actor ${on ? 'is-on' : ''}`}
                  x={x - 62}
                  y={laneTop - 24}
                  width={124}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `o2v-actor-ic ${on ? 'is-on' : ''}`)}
                </g>
                <text className={`o2v-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className="o2v-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className="o2v-phase-tag" x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="o2v-body">
        <div className="o2v-payload">
          <div className="o2v-payload-head">
            <ArrowRight size={13} className="o2v-ic" />
            <span className="o2v-payload-title">
              {msg ? (msg.dir === 'self' ? 'verification' : `${msg.from} -> ${msg.to}`) : 'no message'}
            </span>
            <span className="o2v-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="o2v-params">
            {current.params.length === 0 && (
              <div className="o2v-param-empty">No params on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`o2v-param ${p.pkce ? 'is-pkce' : ''} ${p.secret ? 'is-secret' : ''}`}
              >
                <span className="o2v-param-k">{p.k}</span>
                <span className="o2v-param-eq">=</span>
                <span className="o2v-param-v">{p.v}</span>
                {p.pkce && <span className="o2v-param-badge is-pkce">PKCE</span>}
                {p.secret && <span className="o2v-param-badge is-secret">secret</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="o2v-metrics">
          <div className="o2v-metric">
            <span className="o2v-metric-label">phase</span>
            <span className={`o2v-metric-value ${current.phase === 'done' || current.phase === 'token' || current.phase === 'verify' ? 'is-ok' : ''}`}>
              {PHASE_LABEL[current.phase] || current.phase}
            </span>
          </div>
          <div className="o2v-metric">
            <span className="o2v-metric-label">in flight</span>
            <span className="o2v-metric-value">{current.inFlight}</span>
          </div>
          <div className="o2v-metric">
            <span className="o2v-metric-label">PKCE</span>
            <span className={`o2v-metric-value ${pkce ? 'is-ok' : 'is-warn'}`}>
              {pkce ? 'on — code_verifier' : 'off — client_secret'}
            </span>
          </div>
          <div className="o2v-metric o2v-metric-dim">
            <span className="o2v-metric-label">client type</span>
            <span className="o2v-metric-value">{current.clientType}</span>
          </div>
        </div>
      </div>

      <div className={`o2v-narration ${current.phase === 'verify' ? 'is-ok' : ''}`}>
        <span className={`o2v-narration-label ${current.phase === 'verify' || current.phase === 'token' || current.phase === 'done' ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="o2v-narration-body">{current.note}</span>
      </div>

      <div className="o2v-legend">
        <span className="o2v-legend-item"><ArrowRight size={13} className="o2v-ic is-fwd" /> request hop (forward)</span>
        <span className="o2v-legend-item"><Check size={13} className="o2v-ic is-back" /> response hop (back)</span>
        <span className="o2v-legend-item"><ShieldCheck size={13} className="o2v-ic is-ok" /> PKCE param — verifier / challenge</span>
        <span className="o2v-legend-item"><KeyRound size={13} className="o2v-ic is-warn" /> secret — confidential client only</span>
      </div>
    </div>
  );
}
