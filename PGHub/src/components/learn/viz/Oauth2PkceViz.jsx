import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldOff,
  User, AppWindow, KeyRound, Skull, Check, X, ArrowRight, ShieldCheck,
} from 'lucide-react';
import './Oauth2PkceViz.css';

// OAuth2 Authorization Code flow with PKCE, across three actors: the User, the
// public Client (an SPA/mobile app that cannot keep a secret), and the
// Authorization Server. The whole point of PKCE is bound in two values:
//   code_verifier  — a high-entropy random string the client keeps private.
//   code_challenge = SHA256(verifier) — the public hash sent on /authorize.
// On /token the client sends the RAW verifier; the server recomputes
// SHA256(verifier) and compares it to the challenge it stored. An attacker who
// intercepts only the authorization code has no verifier, so SHA256(theirs)
// never matches the stored challenge and the token exchange is rejected. Toggle
// "attacker intercepts the code" to step that failed exchange.

const ACTORS = [
  { key: 'user', label: 'User', sub: 'resource owner', icon: 'user' },
  { key: 'client', label: 'Client', sub: 'public SPA', icon: 'app' },
  { key: 'auth', label: 'Auth Server', sub: 'authorize + token', icon: 'key' },
  { key: 'attacker', label: 'Attacker', sub: 'stole the code', icon: 'skull' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  generate: 'generate verifier',
  authorize: 'authorize',
  consent: 'consent',
  callback: 'callback',
  intercept: 'code intercepted',
  exchange: 'token exchange',
  attackExchange: 'attacker exchange',
  verify: 'pkce verify',
  reject: 'exchange rejected',
  token: 'token issued',
  done: 'done',
};

const SAMPLE = {
  clientId: 'pgcode-spa',
  redirect: 'https://app.pgcode.dev/cb',
  scope: 'profile email',
  state: 'xyz789',
  code: 'AUTH_9f3aK',
  verifier: 'dBjftJ-eS3vR8...n7Hq2',
  challenge: 'E9Melhoa2OwvFr...kRMQ',
  method: 'S256',
  access: 'at_7Hq2...Lp',
  refresh: 'rt_Z0c...9W',
};

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label} | null,
//          params:[{k,v,kind?}], inFlight, note, fatal? }
function buildFrames(attacker) {
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    note: attacker
      ? 'PKCE on a public client, with an attacker watching the redirect. The client cannot hide a secret, so it proves itself with a one-time code_verifier instead. Step through and watch the attacker grab the authorization code — then fail to redeem it because they never saw the verifier.'
      : 'Authorization Code flow with PKCE on a public client (an SPA or mobile app that cannot store a secret). The trick lives in two values: a random code_verifier the client keeps, and code_challenge = SHA256(verifier) it sends up front. Step through each hop.',
  });

  frames.push({
    phase: 'generate',
    active: ['client'],
    msg: { from: 'client', to: 'client', dir: 'self', label: 'verifier = random();  challenge = SHA256(verifier)' },
    params: [
      { k: 'code_verifier', v: SAMPLE.verifier, kind: 'verifier' },
      { k: 'code_challenge', v: SAMPLE.challenge, kind: 'challenge' },
      { k: 'code_challenge_method', v: SAMPLE.method, kind: 'challenge' },
    ],
    inFlight: 'challenge = SHA256(verifier)',
    note: 'Before anything leaves the browser, the client generates a high-entropy random code_verifier and hashes it: code_challenge = SHA256(verifier). The verifier stays in memory; only its hash will travel on the next hop. SHA256 is one-way, so the challenge reveals nothing about the verifier.',
  });

  frames.push({
    phase: 'authorize',
    active: ['client', 'auth'],
    msg: { from: 'client', to: 'auth', dir: 'fwd', label: 'GET /authorize' },
    params: [
      { k: 'response_type', v: 'code' },
      { k: 'client_id', v: SAMPLE.clientId },
      { k: 'redirect_uri', v: SAMPLE.redirect },
      { k: 'scope', v: SAMPLE.scope },
      { k: 'state', v: SAMPLE.state },
      { k: 'code_challenge', v: SAMPLE.challenge, kind: 'challenge' },
      { k: 'code_challenge_method', v: SAMPLE.method, kind: 'challenge' },
    ],
    inFlight: `code_challenge=${SAMPLE.challenge}`,
    note: 'The client redirects to GET /authorize and sends the code_challenge plus its method (S256). The raw verifier is NOT sent here. The auth server stores the challenge against this pending authorization — it will demand a matching verifier later.',
  });

  frames.push({
    phase: 'consent',
    active: ['user', 'auth'],
    msg: { from: 'auth', to: 'user', dir: 'back', label: 'login + consent screen' },
    params: [
      { k: 'app', v: SAMPLE.clientId },
      { k: 'scope', v: SAMPLE.scope },
      { k: 'decision', v: 'Approve', kind: 'ok' },
    ],
    inFlight: 'user approves scope',
    note: 'The auth server authenticates the user with its own login and shows a consent screen. The user approves. The client app never sees the password — only the auth server does. The stored code_challenge is still waiting to be matched.',
  });

  frames.push({
    phase: 'callback',
    active: ['auth', 'client'],
    msg: { from: 'auth', to: 'client', dir: 'fwd', label: 'redirect to redirect_uri' },
    params: [
      { k: 'code', v: SAMPLE.code, kind: 'code' },
      { k: 'state', v: SAMPLE.state },
    ],
    inFlight: `code=${SAMPLE.code}`,
    note: 'The auth server redirects back with a short-lived authorization code in the URL. This code rides in the browser, where it can leak — through history, logs, a malicious app handling the redirect URI, or a referrer header. Without PKCE, whoever grabs this code could redeem it.',
  });

  if (attacker) {
    frames.push({
      phase: 'intercept',
      active: ['client', 'attacker'],
      msg: { from: 'client', to: 'attacker', dir: 'fwd', label: 'attacker captures code from redirect' },
      params: [
        { k: 'stolen_code', v: SAMPLE.code, kind: 'code' },
        { k: 'attacker_has_verifier', v: 'no — never saw it', kind: 'fail' },
      ],
      inFlight: `stolen code=${SAMPLE.code}`,
      note: 'The attacker intercepts the authorization code from the redirect — exactly the leak PKCE is designed to survive. They now hold a valid-looking code. But the verifier never left the real client\'s memory, so the attacker has only half of what /token requires.',
    });

    frames.push({
      phase: 'attackExchange',
      active: ['attacker', 'auth'],
      msg: { from: 'attacker', to: 'auth', dir: 'fwd', label: 'POST /token (forged)' },
      params: [
        { k: 'grant_type', v: 'authorization_code' },
        { k: 'code', v: SAMPLE.code, kind: 'code' },
        { k: 'client_id', v: SAMPLE.clientId },
        { k: 'code_verifier', v: 'GUESS_xxxx (fabricated)', kind: 'fail' },
      ],
      inFlight: 'attacker sends a fabricated verifier',
      note: 'The attacker POSTs to /token with the stolen code. /token demands a code_verifier, so they have to fabricate one — they cannot reproduce the original random value. Their request carries the stolen code but a wrong verifier.',
    });

    frames.push({
      phase: 'reject',
      active: ['auth'],
      msg: { from: 'auth', to: 'auth', dir: 'self', label: 'SHA256(GUESS) == stored challenge ?' },
      params: [
        { k: 'received', v: 'SHA256(GUESS_xxxx)', kind: 'fail' },
        { k: 'stored', v: `challenge=${SAMPLE.challenge}`, kind: 'challenge' },
        { k: 'check', v: 'hashes differ', kind: 'fail' },
        { k: 'result', v: 'invalid_grant — rejected', kind: 'fail' },
      ],
      inFlight: 'SHA256(verifier) != challenge',
      fatal: true,
      note: 'The server hashes the attacker\'s fabricated verifier and compares it to the challenge it stored at /authorize. They do not match, so the server returns invalid_grant and refuses to mint a token. The stolen code is worthless without the verifier. That single comparison is the entire defence PKCE adds.',
    });

    return frames;
  }

  frames.push({
    phase: 'exchange',
    active: ['client', 'auth'],
    msg: { from: 'client', to: 'auth', dir: 'fwd', label: 'POST /token' },
    params: [
      { k: 'grant_type', v: 'authorization_code' },
      { k: 'code', v: SAMPLE.code, kind: 'code' },
      { k: 'client_id', v: SAMPLE.clientId },
      { k: 'redirect_uri', v: SAMPLE.redirect },
      { k: 'code_verifier', v: SAMPLE.verifier, kind: 'verifier' },
    ],
    inFlight: `code_verifier=${SAMPLE.verifier}`,
    note: 'The real client POSTs to /token on the back channel and now reveals the raw code_verifier it kept in memory the whole time. No client_secret exists — the verifier is the proof of identity. This request is the first and only time the verifier travels.',
  });

  frames.push({
    phase: 'verify',
    active: ['auth'],
    msg: { from: 'auth', to: 'auth', dir: 'self', label: 'SHA256(verifier) == stored challenge ?' },
    params: [
      { k: 'received', v: `verifier=${SAMPLE.verifier}`, kind: 'verifier' },
      { k: 'stored', v: `challenge=${SAMPLE.challenge}`, kind: 'challenge' },
      { k: 'check', v: 'SHA256(verifier) === challenge', kind: 'ok' },
      { k: 'result', v: 'match -> issue token', kind: 'ok' },
    ],
    inFlight: 'SHA256(verifier) === challenge',
    note: 'The server hashes the verifier it just received and compares it to the challenge it stored at /authorize. They match, proving this is the same client that started the flow — only that client knows the verifier behind the hash. The exchange is approved.',
  });

  frames.push({
    phase: 'token',
    active: ['auth', 'client'],
    msg: { from: 'auth', to: 'client', dir: 'back', label: '200 OK { tokens }' },
    params: [
      { k: 'access_token', v: SAMPLE.access, kind: 'ok' },
      { k: 'token_type', v: 'Bearer' },
      { k: 'expires_in', v: '3600' },
      { k: 'refresh_token', v: SAMPLE.refresh },
    ],
    inFlight: `access_token=${SAMPLE.access}`,
    note: 'The server returns an access_token and a refresh_token. The code is now burned and cannot be replayed. A public client just authenticated safely without ever holding a secret — the verifier did the job, and it only travelled on the back channel after the code had already been issued.',
  });

  frames.push({
    phase: 'done',
    active: ['client'],
    msg: null,
    params: [
      { k: 'verifier', v: 'never rode in the browser', kind: 'ok' },
      { k: 'challenge', v: 'public hash, useless alone', kind: 'ok' },
      { k: 'outcome', v: 'code interception defeated', kind: 'ok' },
    ],
    inFlight: 'flow complete',
    note: 'Done. The challenge that travelled in the browser is a one-way hash and is useless to an interceptor. The verifier only appeared once, on the back-channel /token call. Bind those two together and a stolen authorization code can never be redeemed — that is why PKCE is mandatory for SPAs and mobile apps.',
  });

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function Oauth2PkceViz() {
  const [attacker, setAttacker] = useState(false);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(attacker), [attacker]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(RUN_DELAY_MS / Math.max(speed, 0.1));

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

  const toggleAttacker = () => {
    setIsRunning(false);
    setStep(0);
    setAttacker((v) => !v);
  };

  // SVG geometry — actor lanes with vertical lifelines. The attacker lane is
  // only meaningful when the attacker toggle is on.
  const W = 940;
  const H = 360;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 90;
  const denom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / denom) * (W - 2 * pad);
  const msgY = laneTop + 118;

  const ActorIcon = (icon, cls) => {
    if (icon === 'user') return <User width={20} height={20} className={cls} />;
    if (icon === 'app') return <AppWindow width={20} height={20} className={cls} />;
    if (icon === 'skull') return <Skull width={20} height={20} className={cls} />;
    return <KeyRound width={20} height={20} className={cls} />;
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const msg = current.msg;
  const isActive = (key) => current.active.includes(key);

  const toneForDir = (dir) => (dir === 'back' ? 'back' : dir === 'self' ? 'self' : 'fwd');
  const msgTone = current.fatal ? 'fail' : (msg ? toneForDir(msg.dir) : 'fwd');

  let msgLine = null;
  if (msg && msg.dir !== 'self') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  const verdict = current.phase === 'reject'
    ? 'rejected'
    : (current.phase === 'token' || current.phase === 'done' ? 'token issued' : 'in progress');
  const verdictClass = current.phase === 'reject'
    ? 'is-fail'
    : (current.phase === 'token' || current.phase === 'done' ? 'is-ok' : '');

  return (
    <div className="pkv">
      <div className="pkv-head">
        <h3 className="pkv-title">OAuth2 PKCE — why a stolen code can&rsquo;t be redeemed</h3>
        <p className="pkv-sub">
          The client hashes a secret code_verifier into a public code_challenge, sends only the hash
          on /authorize, then reveals the raw verifier on /token. Flip &ldquo;attacker intercepts the
          code&rdquo; to watch a stolen code fail at the verifier check.
        </p>
      </div>

      <div className="pkv-controls">
        <button
          type="button"
          className={`pkv-toggle ${attacker ? 'is-danger' : ''}`}
          onClick={toggleAttacker}
          aria-pressed={attacker}
          title="Toggle whether an attacker intercepts the authorization code"
        >
          {attacker ? <Skull size={14} /> : <ShieldCheck size={14} />}
          attacker intercepts the code {attacker ? 'on' : 'off'}
        </button>

        <span className={`pkv-mode-tag ${attacker ? 'is-danger' : ''}`}>
          {attacker ? 'interception attempt' : 'honest flow'}
        </span>

        <label className="pkv-speed">
          <span className="pkv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="pkv-speed-range"
            aria-label="Playback speed"
          />
          <span className="pkv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="pkv-spacer" aria-hidden="true" />

        <div className="pkv-buttons">
          <button
            type="button"
            className="pkv-btn pkv-btn-primary"
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
            className="pkv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="pkv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="pkv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="pkv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="pkv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="pkv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="pkv-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pkv-ah is-fwd" />
            </marker>
            <marker id="pkv-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pkv-ah is-back" />
            </marker>
            <marker id="pkv-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pkv-ah is-self" />
            </marker>
            <marker id="pkv-arr-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="pkv-ah is-fail" />
            </marker>
          </defs>

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            const dim = a.key === 'attacker' && !attacker;
            return (
              <line
                key={`life-${a.key}`}
                className={`pkv-life ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`}
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
                className={`pkv-msg is-${msgTone}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#pkv-arr-${msgTone})`}
              />
              <text
                className={`pkv-msg-label is-${msgTone}`}
                x={msgLine.mid}
                y={msgY - 11}
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          )}
          {selfActor != null && (
            <g>
              <path
                className={`pkv-msg is-${msgTone}`}
                d={`M ${selfActor} ${msgY - 14} q 60 0 60 16 q 0 16 -60 16`}
                fill="none"
                markerEnd={`url(#pkv-arr-${msgTone})`}
              />
              <text className={`pkv-msg-label is-${msgTone}`} x={selfActor + 68} y={msgY + 4} textAnchor="start">
                {msg.label}
              </text>
            </g>
          )}

          {/* actor headers */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            const dim = a.key === 'attacker' && !attacker;
            return (
              <g key={`actor-${a.key}`}>
                <rect
                  className={`pkv-actor ${on ? 'is-on' : ''} ${a.key === 'attacker' ? 'is-attacker' : ''} ${dim ? 'is-dim' : ''}`}
                  x={x - 64}
                  y={laneTop - 24}
                  width={128}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `pkv-actor-ic ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`)}
                </g>
                <text className={`pkv-actor-label ${on ? 'is-on' : ''} ${dim ? 'is-dim' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className={`pkv-actor-sub ${dim ? 'is-dim' : ''}`} x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className={`pkv-phase-tag ${current.fatal ? 'is-fail' : ''}`} x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="pkv-body">
        <div className="pkv-payload">
          <div className="pkv-payload-head">
            <ArrowRight size={13} className="pkv-ic" />
            <span className="pkv-payload-title">
              {msg ? (msg.dir === 'self' ? 'server check' : `${msg.from} -> ${msg.to}`) : 'state'}
            </span>
            <span className="pkv-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="pkv-params">
            {current.params.length === 0 && (
              <div className="pkv-param-empty">No params on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`pkv-param ${p.kind ? `is-${p.kind}` : ''}`}
              >
                <span className="pkv-param-k">{p.k}</span>
                <span className="pkv-param-eq">=</span>
                <span className="pkv-param-v">{p.v}</span>
                {p.kind === 'verifier' && <span className="pkv-param-badge is-verifier"><KeyRound size={10} /> verifier</span>}
                {p.kind === 'challenge' && <span className="pkv-param-badge is-challenge"><ShieldCheck size={10} /> challenge</span>}
                {p.kind === 'ok' && <span className="pkv-param-badge is-ok"><Check size={10} /> ok</span>}
                {p.kind === 'fail' && <span className="pkv-param-badge is-fail"><X size={10} /> fail</span>}
                {p.kind === 'code' && <span className="pkv-param-badge is-code">code</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="pkv-metrics">
          <div className="pkv-metric">
            <span className="pkv-metric-label">phase</span>
            <span className={`pkv-metric-value ${current.fatal ? 'is-fail' : (current.phase === 'token' || current.phase === 'verify' || current.phase === 'done' ? 'is-ok' : '')}`}>
              {PHASE_LABEL[current.phase] || current.phase}
            </span>
          </div>
          <div className="pkv-metric">
            <span className="pkv-metric-label">code_verifier</span>
            <span className="pkv-metric-value is-verifier">{SAMPLE.verifier}</span>
          </div>
          <div className="pkv-metric">
            <span className="pkv-metric-label">code_challenge</span>
            <span className="pkv-metric-value is-challenge">SHA256(verifier)</span>
          </div>
          <div className="pkv-metric pkv-metric-dim">
            <span className="pkv-metric-label">token exchange</span>
            <span className={`pkv-metric-value ${verdictClass}`}>{verdict}</span>
          </div>
        </div>
      </div>

      <div className={`pkv-narration ${current.fatal ? 'is-fail' : (current.phase === 'verify' || current.phase === 'token' || current.phase === 'done' ? 'is-ok' : '')}`}>
        <span className={`pkv-narration-label ${current.fatal ? 'is-fail' : (current.phase === 'verify' || current.phase === 'token' || current.phase === 'done' ? 'is-ok' : '')}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="pkv-narration-body">{current.note}</span>
      </div>

      <div className="pkv-legend">
        <span className="pkv-legend-item"><KeyRound size={13} className="pkv-ic is-verifier" /> code_verifier — secret, kept by the client</span>
        <span className="pkv-legend-item"><ShieldCheck size={13} className="pkv-ic is-challenge" /> code_challenge = SHA256(verifier) — public hash</span>
        <span className="pkv-legend-item"><Check size={13} className="pkv-ic is-ok" /> match -&gt; token issued</span>
        <span className="pkv-legend-item"><ShieldOff size={13} className="pkv-ic is-fail" /> stolen code, wrong verifier -&gt; rejected</span>
      </div>
    </div>
  );
}
