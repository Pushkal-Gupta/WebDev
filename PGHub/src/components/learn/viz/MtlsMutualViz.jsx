import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  Laptop, Server, Check, X, ArrowRight, KeyRound,
} from 'lucide-react';
import './MtlsMutualViz.css';

// Mutual TLS handshake across two actors: Client and Server. We step the
// handshake message by message and show the actual handshake records on each
// hop. A "present client cert" toggle is the crux: with it ON the server's
// CertificateRequest is satisfied and the full mutual handshake completes; with
// it OFF the server rejects the connection because client authentication is
// required. A contrast banner reminds the reader that one-way TLS skips the
// client-auth steps entirely.

const ACTORS = [
  { key: 'client', label: 'Client', sub: 'billing-svc', icon: 'client' },
  { key: 'server', label: 'Server', sub: 'orders-svc', icon: 'server' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  hello: 'client hello',
  serverhello: 'server hello',
  verifyServer: 'verify server',
  certreq: 'certificate request',
  clientcert: 'client certificate',
  certverify: 'certificate verify',
  verifyClient: 'verify client',
  finished: 'session established',
  rejected: 'handshake failed',
};

const SAMPLE = {
  versions: 'TLS 1.3, TLS 1.2',
  ciphers: 'TLS_AES_256_GCM_SHA384',
  clientRandom: '0x9f3a…K2',
  serverRandom: '0x71bc…Lp',
  chosen: 'TLS_AES_256_GCM_SHA384',
  serverCert: 'CN=orders.internal',
  clientCert: 'CN=billing, SAN spiffe://prod/billing',
  caBundle: '/etc/pki/internal-ca.pem',
  transcript: 'SHA384(handshake)…',
  sessionKey: '0x4d2f…aE',
};

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label} | null,
//          params:[{k,v,kind?}], inFlight, serverAuth, clientAuth, note, fatal? }
function buildFrames(presentClientCert) {
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    serverAuth: false,
    clientAuth: 'pending',
    note: presentClientCert
      ? 'Mutual TLS: both sides will present a certificate signed by a CA the other trusts. Step through the handshake and watch each record on the wire. The "present client cert" switch is on, so the client is ready to answer the server\'s certificate request.'
      : 'Mutual TLS requires the client to present its own certificate. The "present client cert" switch is off — the client will refuse the server\'s certificate request, and you will see the handshake fail at exactly the step that separates mutual TLS from ordinary one-way TLS.',
  });

  frames.push({
    phase: 'hello',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'ClientHello' },
    params: [
      { k: 'supported_versions', v: SAMPLE.versions },
      { k: 'cipher_suites', v: SAMPLE.ciphers },
      { k: 'client_random', v: SAMPLE.clientRandom },
    ],
    inFlight: 'ClientHello',
    serverAuth: false,
    clientAuth: 'pending',
    note: 'The client opens the handshake with a ClientHello: the TLS versions it speaks, the cipher suites it offers, and a fresh client_random. No identity is asserted yet — this part is identical to ordinary one-way TLS.',
  });

  frames.push({
    phase: 'serverhello',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: 'ServerHello + Certificate' },
    params: [
      { k: 'chosen_cipher', v: SAMPLE.chosen },
      { k: 'server_random', v: SAMPLE.serverRandom },
      { k: 'certificate', v: SAMPLE.serverCert, kind: 'cert' },
    ],
    inFlight: 'ServerHello + server cert chain',
    serverAuth: false,
    clientAuth: 'pending',
    note: 'The server answers with a ServerHello: the single cipher it picked, its own server_random, and its Certificate message carrying the server\'s cert chain. This is the only certificate that ever travels in one-way TLS.',
  });

  frames.push({
    phase: 'verifyServer',
    active: ['client'],
    msg: { from: 'client', to: 'client', dir: 'self', label: 'verify server cert -> trust store' },
    params: [
      { k: 'chain', v: SAMPLE.serverCert, kind: 'cert' },
      { k: 'trust_store', v: SAMPLE.caBundle },
      { k: 'check', v: 'chain validates to trusted CA', kind: 'ok' },
      { k: 'result', v: 'server authenticated', kind: 'ok' },
    ],
    inFlight: 'chain validates to trusted CA',
    serverAuth: true,
    clientAuth: 'pending',
    note: 'The client validates the server\'s certificate chain against its own trust store and checks the hostname. The chain links to a trusted CA, so the server is now authenticated. In one-way TLS the handshake would finish around here — the client stays anonymous.',
  });

  frames.push({
    phase: 'certreq',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: 'CertificateRequest' },
    params: [
      { k: 'certificate_authorities', v: SAMPLE.caBundle },
      { k: 'signature_algorithms', v: 'rsa_pss, ecdsa_secp384' },
      { k: 'demand', v: 'client must present a certificate', kind: 'warn' },
    ],
    inFlight: 'CertificateRequest',
    serverAuth: true,
    clientAuth: 'pending',
    note: 'Here is the part that makes TLS mutual: the server sends a CertificateRequest, naming the CAs whose client certs it will accept. One-way TLS never sends this message. From now on the client has to prove who it is.',
  });

  if (!presentClientCert) {
    frames.push({
      phase: 'rejected',
      active: ['server', 'client'],
      msg: { from: 'server', to: 'client', dir: 'back', label: 'fatal alert: certificate_required' },
      params: [
        { k: 'client_certificate', v: '(none presented)', kind: 'fail' },
        { k: 'alert', v: 'certificate_required', kind: 'fail' },
        { k: 'outcome', v: 'connection closed', kind: 'fail' },
      ],
      inFlight: 'handshake aborted',
      serverAuth: true,
      clientAuth: 'rejected',
      fatal: true,
      note: 'The client has no certificate to offer, so it answers with an empty Certificate message. The server demanded client authentication, so it sends a fatal certificate_required alert and tears down the connection. This is the whole point of mutual TLS: an unauthenticated client never gets a session.',
    });
    return frames;
  }

  frames.push({
    phase: 'clientcert',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Certificate (client chain)' },
    params: [
      { k: 'certificate', v: SAMPLE.clientCert, kind: 'cert' },
      { k: 'issued_by', v: 'internal-ca' },
      { k: 'identity', v: 'spiffe://prod/billing', kind: 'cert' },
    ],
    inFlight: 'client cert chain',
    serverAuth: true,
    clientAuth: 'pending',
    note: 'The client presents its own Certificate message — the client cert chain. The certificate carries the workload identity in its SAN (spiffe://prod/billing). Possession of the matching private key still has to be proven; the certificate alone is just a public claim.',
  });

  frames.push({
    phase: 'certverify',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'CertificateVerify (signed transcript)' },
    params: [
      { k: 'signature', v: SAMPLE.transcript, kind: 'key' },
      { k: 'signed_with', v: 'client private key', kind: 'key' },
      { k: 'proves', v: 'possession of the private key', kind: 'key' },
    ],
    inFlight: 'signed handshake transcript',
    serverAuth: true,
    clientAuth: 'pending',
    note: 'The client signs the entire handshake transcript with its private key and sends a CertificateVerify. Only the holder of the key matching the cert\'s public key can produce this signature — that is how the client proves the certificate is really its own, not a copied public file.',
  });

  frames.push({
    phase: 'verifyClient',
    active: ['server'],
    msg: { from: 'server', to: 'server', dir: 'self', label: 'verify client cert -> trust store' },
    params: [
      { k: 'chain', v: SAMPLE.clientCert, kind: 'cert' },
      { k: 'trust_store', v: SAMPLE.caBundle },
      { k: 'signature', v: 'verifies against cert public key', kind: 'ok' },
      { k: 'result', v: 'client authenticated', kind: 'ok' },
    ],
    inFlight: 'chain validates + signature verifies',
    serverAuth: true,
    clientAuth: 'authenticated',
    note: 'The server validates the client cert chain against its private client-auth CA bundle and checks the CertificateVerify signature against the cert\'s public key. Both pass, so the client is authenticated. The server reads the SAN as the principal it will authorize.',
  });

  frames.push({
    phase: 'finished',
    active: ['client', 'server'],
    msg: { from: 'server', to: 'client', dir: 'fwd', label: 'Finished -> encrypted session' },
    params: [
      { k: 'session_key', v: SAMPLE.sessionKey, kind: 'key' },
      { k: 'both_authenticated', v: 'client + server', kind: 'ok' },
      { k: 'channel', v: 'encrypted application data', kind: 'ok' },
    ],
    inFlight: 'shared session key derived',
    serverAuth: true,
    clientAuth: 'authenticated',
    note: 'Both sides derive the same session key from the randoms and the key exchange, exchange Finished messages, and the encrypted channel opens. Each end has cryptographically proven its identity to the other — neither is trusting a copyable bearer token.',
  });

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function MtlsMutualViz() {
  const [presentClientCert, setPresentClientCert] = useState(true);
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(presentClientCert), [presentClientCert]);
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

  const toggleClientCert = () => {
    setIsRunning(false);
    setStep(0);
    setPresentClientCert((v) => !v);
  };

  // SVG geometry — two actor lanes with vertical lifelines.
  const W = 940;
  const H = 320;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 180;
  const denom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / denom) * (W - 2 * pad);
  const msgY = laneTop + 100;

  const ActorIcon = (icon, cls) => {
    if (icon === 'client') return <Laptop width={20} height={20} className={cls} />;
    return <Server width={20} height={20} className={cls} />;
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

  const clientAuthLabel = current.clientAuth === 'authenticated'
    ? 'yes'
    : current.clientAuth === 'rejected'
      ? 'rejected'
      : '—';
  const clientAuthClass = current.clientAuth === 'authenticated'
    ? 'is-ok'
    : current.clientAuth === 'rejected'
      ? 'is-fail'
      : '';
  const outcome = current.phase === 'finished'
    ? 'session established'
    : current.phase === 'rejected'
      ? 'rejected'
      : 'in progress';
  const outcomeClass = current.phase === 'finished'
    ? 'is-ok'
    : current.phase === 'rejected'
      ? 'is-fail'
      : '';

  return (
    <div className="mtv">
      <div className="mtv-head">
        <h3 className="mtv-title">Mutual TLS handshake — both sides prove their identity</h3>
        <p className="mtv-sub">
          Step the handshake between a client and a server. Turn off
          {' '}&ldquo;present client cert&rdquo; to watch the server reject an unauthenticated client at
          the certificate request — the exact step ordinary one-way TLS never sends.
        </p>
      </div>

      <div className="mtv-controls">
        <button
          type="button"
          className={`mtv-toggle ${presentClientCert ? 'is-on' : ''}`}
          onClick={toggleClientCert}
          aria-pressed={presentClientCert}
          title="Toggle whether the client presents its own certificate"
        >
          <ShieldCheck size={14} /> present client cert {presentClientCert ? 'on' : 'off'}
        </button>

        <span className="mtv-mode-tag">
          {presentClientCert ? 'mutual TLS' : 'client unauthenticated'}
        </span>

        <label className="mtv-speed">
          <span className="mtv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mtv-speed-range"
            aria-label="Playback speed"
          />
          <span className="mtv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="mtv-spacer" aria-hidden="true" />

        <div className="mtv-buttons">
          <button
            type="button"
            className="mtv-btn mtv-btn-primary"
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
            className="mtv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="mtv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="mtv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="mtv-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="mtv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="mtv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="mtv-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mtv-ah is-fwd" />
            </marker>
            <marker id="mtv-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mtv-ah is-back" />
            </marker>
            <marker id="mtv-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mtv-ah is-self" />
            </marker>
            <marker id="mtv-arr-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="mtv-ah is-fail" />
            </marker>
          </defs>

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <line
                key={`life-${a.key}`}
                className={`mtv-life ${on ? 'is-on' : ''}`}
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
                className={`mtv-msg is-${msgTone}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#mtv-arr-${msgTone})`}
              />
              <text
                className={`mtv-msg-label is-${msgTone}`}
                x={msgLine.mid}
                y={msgY - 12}
                textAnchor="middle"
              >
                {msg.label}
              </text>
            </g>
          )}
          {selfActor != null && (
            <g>
              <path
                className="mtv-msg is-self"
                d={`M ${selfActor} ${msgY - 14} q 64 0 64 16 q 0 16 -64 16`}
                fill="none"
                markerEnd="url(#mtv-arr-self)"
              />
              <text className="mtv-msg-label is-self" x={selfActor + 72} y={msgY + 4} textAnchor="start">
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
                  className={`mtv-actor ${on ? 'is-on' : ''}`}
                  x={x - 78}
                  y={laneTop - 24}
                  width={156}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `mtv-actor-ic ${on ? 'is-on' : ''}`)}
                </g>
                <text className={`mtv-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className="mtv-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className={`mtv-phase-tag ${current.fatal ? 'is-fail' : ''}`} x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="mtv-body">
        <div className="mtv-payload">
          <div className="mtv-payload-head">
            <ArrowRight size={13} className="mtv-ic" />
            <span className="mtv-payload-title">
              {msg ? (msg.dir === 'self' ? 'verification' : `${msg.from} -> ${msg.to}`) : 'no message'}
            </span>
            <span className="mtv-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="mtv-params">
            {current.params.length === 0 && (
              <div className="mtv-param-empty">No records on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`mtv-param ${p.kind ? `is-${p.kind}` : ''}`}
              >
                <span className="mtv-param-k">{p.k}</span>
                <span className="mtv-param-eq">=</span>
                <span className="mtv-param-v">{p.v}</span>
                {p.kind === 'ok' && <span className="mtv-param-badge is-ok"><Check size={10} /> ok</span>}
                {p.kind === 'fail' && <span className="mtv-param-badge is-fail"><X size={10} /> fail</span>}
                {p.kind === 'key' && <span className="mtv-param-badge is-key"><KeyRound size={10} /> key</span>}
                {p.kind === 'cert' && <span className="mtv-param-badge is-cert"><ShieldCheck size={10} /> cert</span>}
                {p.kind === 'warn' && <span className="mtv-param-badge is-warn">demand</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="mtv-metrics">
          <div className="mtv-metric">
            <span className="mtv-metric-label">phase</span>
            <span className={`mtv-metric-value ${current.fatal ? 'is-fail' : (current.phase === 'finished' ? 'is-ok' : '')}`}>
              {PHASE_LABEL[current.phase] || current.phase}
            </span>
          </div>
          <div className="mtv-metric">
            <span className="mtv-metric-label">mode</span>
            <span className={`mtv-metric-value ${presentClientCert ? 'is-ok' : 'is-warn'}`}>
              {presentClientCert ? 'mutual TLS' : 'one-way (client anon)'}
            </span>
          </div>
          <div className="mtv-metric">
            <span className="mtv-metric-label">server authenticated</span>
            <span className={`mtv-metric-value ${current.serverAuth ? 'is-ok' : ''}`}>
              {current.serverAuth ? 'yes' : '—'}
            </span>
          </div>
          <div className="mtv-metric">
            <span className="mtv-metric-label">client authenticated</span>
            <span className={`mtv-metric-value ${clientAuthClass}`}>
              {clientAuthLabel}
            </span>
          </div>
          <div className="mtv-metric mtv-metric-dim">
            <span className="mtv-metric-label">outcome</span>
            <span className={`mtv-metric-value ${outcomeClass}`}>{outcome}</span>
          </div>
        </div>
      </div>

      <div className={`mtv-narration ${current.fatal ? 'is-fail' : (current.phase === 'finished' || current.phase.startsWith('verify') ? 'is-ok' : '')}`}>
        <span className={`mtv-narration-label ${current.fatal ? 'is-fail' : (current.phase === 'finished' || current.phase.startsWith('verify') ? 'is-ok' : '')}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="mtv-narration-body">{current.note}</span>
      </div>

      <div className="mtv-legend">
        <span className="mtv-legend-item"><ArrowRight size={13} className="mtv-ic is-fwd" /> client -&gt; server</span>
        <span className="mtv-legend-item"><ArrowRight size={13} className="mtv-ic is-back" /> server -&gt; client</span>
        <span className="mtv-legend-item"><ShieldCheck size={13} className="mtv-ic is-ok" /> verify against trust store</span>
        <span className="mtv-legend-item"><X size={13} className="mtv-ic is-fail" /> client auth required — rejected</span>
      </div>
    </div>
  );
}
