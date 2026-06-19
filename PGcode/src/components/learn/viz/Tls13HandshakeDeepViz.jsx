import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, ShieldCheck,
  Laptop, Server, Check, ArrowRight, KeyRound, Zap, Lock, FileSignature,
} from 'lucide-react';
import './Tls13HandshakeDeepViz.css';

// TLS 1.3 full handshake stepped message by message across two actors. The
// crux: TLS 1.3 completes the handshake in a single round trip (1-RTT) because
// the client already sent its ECDHE key_share in the very first flight, so the
// server can derive the shared secret and encrypt the rest of its first reply.
// A mode toggle swaps to 0-RTT resumption: with a pre-shared key (PSK) carried
// over from a previous session, the client ships early application data inside
// its first flight, before any reply — at the cost of replay protection. A
// banner keeps the TLS 1.2 2-RTT cost in view so the RTT savings stay concrete.

const ACTORS = [
  { key: 'client', label: 'Client', sub: 'browser', icon: 'client' },
  { key: 'server', label: 'Server', sub: 'example.com', icon: 'server' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  clienthello: 'client hello',
  serverhello: 'server hello',
  derive: 'derive shared secret',
  serverflight: 'server flight',
  verifyServer: 'verify server',
  finished: 'client finished',
  appdata: 'application data',
  psk: 'resume with psk',
  earlydata: '0-rtt early data',
  established: 'session established',
};

// Deterministic sample values — fixed strings, never Math.random.
const SAMPLE = {
  versions: 'TLS 1.3',
  groups: 'x25519, secp256r1',
  ciphers: 'TLS_AES_128_GCM_SHA256',
  clientShare: 'x25519: 0x8f2c…A1 (client ECDHE public)',
  clientPriv: 'a = 0x41d9… (client ECDHE private)',
  serverShare: 'x25519: 0x3b07…E9 (server ECDHE public)',
  serverPriv: 'b = 0xc6e2… (server ECDHE private)',
  chosen: 'TLS_AES_128_GCM_SHA256',
  serverCert: 'CN=example.com, chain to root CA',
  certVerifySig: 'sig over transcript (server private key)',
  sharedSecret: 'Z = 0x5e9a…7F (ECDHE shared secret)',
  handshakeKeys: 'HKDF(Z) -> handshake traffic keys',
  appKeys: 'HKDF(Z) -> application traffic keys',
  pskId: 'psk_identity: 0x90ab…22 (from prior session)',
  earlySecret: 'early traffic keys = HKDF(PSK)',
  earlyData: 'GET /dashboard (0-RTT early data)',
};

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label} | null,
//          params:[{k,v,kind?}], inFlight, secretClient, secretServer,
//          serverAuth, rttCost, note }
function buildFullFrames() {
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    secretClient: null,
    secretServer: null,
    serverAuth: false,
    note: 'TLS 1.3 trims the handshake to a single round trip. The trick is that the client sends its ECDHE key_share in the very first message, so the server can derive the shared secret immediately and encrypt almost everything it sends back. Step through to watch one round trip carry the whole negotiation.',
  });

  frames.push({
    phase: 'clienthello',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'ClientHello + key_share' },
    params: [
      { k: 'supported_versions', v: SAMPLE.versions },
      { k: 'supported_groups', v: SAMPLE.groups },
      { k: 'cipher_suites', v: SAMPLE.ciphers },
      { k: 'key_share', v: SAMPLE.clientShare, kind: 'key' },
    ],
    inFlight: 'ClientHello + client key_share',
    secretClient: null,
    secretServer: null,
    serverAuth: false,
    note: 'The client opens with a ClientHello that already carries its ECDHE key_share — the client\'s public Diffie-Hellman value for a named curve. It also lists the curves and the single TLS 1.3 cipher family it offers. Sending the key_share now is what saves the round trip: the server has everything it needs to compute the shared secret from this one message.',
  });

  frames.push({
    phase: 'serverhello',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: 'ServerHello + key_share' },
    params: [
      { k: 'selected_version', v: SAMPLE.versions },
      { k: 'cipher_suite', v: SAMPLE.chosen },
      { k: 'key_share', v: SAMPLE.serverShare, kind: 'key' },
    ],
    inFlight: 'ServerHello + server key_share',
    secretClient: null,
    secretServer: null,
    serverAuth: false,
    note: 'The server answers with a ServerHello: the version and cipher it picked, plus its own ECDHE key_share — the server\'s public Diffie-Hellman value on the same curve. These two key_shares are the only material that ever crosses the wire for the key exchange. The private halves never leave either machine.',
  });

  frames.push({
    phase: 'derive',
    active: ['client', 'server'],
    msg: { from: 'server', to: 'server', dir: 'derive', label: 'ECDHE: both compute the same Z' },
    params: [
      { k: 'server computes', v: 'Z = b · (client public)', kind: 'key' },
      { k: 'client computes', v: 'Z = a · (server public)', kind: 'key' },
      { k: 'shared_secret', v: SAMPLE.sharedSecret, kind: 'ok' },
      { k: 'derived_keys', v: SAMPLE.handshakeKeys, kind: 'ok' },
    ],
    inFlight: 'ECDHE shared secret derived on both ends',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: false,
    note: 'This is the heart of it. The server multiplies its private value by the client\'s public point; the client multiplies its private value by the server\'s public point. Elliptic-curve Diffie-Hellman makes both products land on the exact same point — the shared secret Z. An eavesdropper saw only the two public key_shares and cannot reconstruct Z. Both sides now run Z through HKDF to get the handshake traffic keys, so everything the server sends next is already encrypted.',
  });

  frames.push({
    phase: 'serverflight',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: '{EncryptedExtensions, Certificate, CertificateVerify, Finished}' },
    params: [
      { k: 'EncryptedExtensions', v: 'ALPN, server params', kind: 'lock' },
      { k: 'Certificate', v: SAMPLE.serverCert, kind: 'cert' },
      { k: 'CertificateVerify', v: SAMPLE.certVerifySig, kind: 'sig' },
      { k: 'Finished', v: 'MAC over transcript', kind: 'lock' },
    ],
    inFlight: 'encrypted server flight (single message group)',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: false,
    note: 'In the same flight, still in reply to the first ClientHello, the server sends the rest — all encrypted under the handshake keys. EncryptedExtensions carries the negotiated parameters, Certificate carries the server\'s chain, CertificateVerify is a signature over the transcript proving the server holds the certificate\'s private key, and Finished is a MAC that ties the whole handshake together. In TLS 1.2 the certificate was sent in the clear; here it is hidden from eavesdroppers.',
  });

  frames.push({
    phase: 'verifyServer',
    active: ['client'],
    msg: { from: 'client', to: 'client', dir: 'self', label: 'verify cert chain + CertificateVerify' },
    params: [
      { k: 'chain', v: SAMPLE.serverCert, kind: 'cert' },
      { k: 'signature', v: 'CertificateVerify checks out', kind: 'ok' },
      { k: 'result', v: 'server authenticated', kind: 'ok' },
    ],
    inFlight: 'chain validates + signature verifies',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: true,
    note: 'The client validates the server\'s certificate chain against its trust store, checks the hostname, and verifies the CertificateVerify signature against the certificate\'s public key. Only the real holder of that private key could have signed the transcript, so the server is now authenticated — proven to be the named host, not just an entity that happens to hold a copyable certificate.',
  });

  frames.push({
    phase: 'finished',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Finished -> application keys' },
    params: [
      { k: 'Finished', v: 'client MAC over transcript', kind: 'lock' },
      { k: 'application_keys', v: SAMPLE.appKeys, kind: 'ok' },
      { k: 'round_trips', v: '1 (request sent, reply received)', kind: 'ok' },
    ],
    inFlight: 'client Finished — handshake complete',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: true,
    note: 'The client sends its own Finished, completing the handshake. Both sides switch to the application traffic keys derived from the same shared secret. Counting flights: the client spoke, the server replied, the client confirmed — one full round trip, and the encrypted channel is open. This is the 1-RTT promise of TLS 1.3.',
  });

  frames.push({
    phase: 'appdata',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'encrypted application data' },
    params: [
      { k: 'channel', v: 'AEAD-protected with application keys', kind: 'ok' },
      { k: 'request', v: 'GET /dashboard', kind: 'lock' },
      { k: 'rtt_to_first_byte', v: '1 RTT', kind: 'ok' },
    ],
    inFlight: 'application data flowing',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: true,
    note: 'Application data flows, encrypted end to end. Compared with TLS 1.2 — which needed a second round trip (ClientKeyExchange before Finished) before any data could move — TLS 1.3 saved a full round trip on every fresh connection. On a 60 ms link that is roughly 60 ms shaved off every new page load.',
  });

  return frames;
}

function buildZeroRttFrames() {
  const frames = [];

  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    secretClient: null,
    secretServer: null,
    serverAuth: false,
    note: '0-RTT resumption uses a pre-shared key (PSK) the client cached from a previous full handshake with this server. Because both sides already share that secret, the client can encrypt and send application data inside its very first flight — before the server has said a single word. That is zero round trips to first byte, with one important caveat shown at the end.',
  });

  frames.push({
    phase: 'psk',
    active: ['client'],
    msg: { from: 'client', to: 'client', dir: 'self', label: 'recall cached PSK + derive early keys' },
    params: [
      { k: 'psk_identity', v: SAMPLE.pskId, kind: 'key' },
      { k: 'early_keys', v: SAMPLE.earlySecret, kind: 'lock' },
    ],
    inFlight: 'early traffic keys derived from PSK',
    secretClient: SAMPLE.earlySecret,
    secretServer: null,
    serverAuth: false,
    note: 'On the previous connection the server handed the client a session ticket — effectively a pre-shared key identity. The client still has it. From the PSK it derives early traffic keys locally, without talking to the server at all. Those keys are ready to protect data in the very first packet.',
  });

  frames.push({
    phase: 'earlydata',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'ClientHello + key_share + PSK + 0-RTT data' },
    params: [
      { k: 'pre_shared_key', v: SAMPLE.pskId, kind: 'key' },
      { k: 'key_share', v: SAMPLE.clientShare, kind: 'key' },
      { k: 'early_data', v: SAMPLE.earlyData, kind: 'lock' },
      { k: 'rtt_to_first_byte', v: '0 RTT', kind: 'ok' },
    ],
    inFlight: 'ClientHello carrying encrypted early data',
    secretClient: SAMPLE.earlySecret,
    secretServer: null,
    serverAuth: false,
    note: 'The client sends a ClientHello that bundles the PSK identity, a fresh ECDHE key_share (so the resumed session still gets forward secrecy), and — riding in the same flight — application data encrypted under the early keys. The request reaches the server in the first packet. To the application this is zero round trips to first byte: the data left before any reply came back.',
  });

  frames.push({
    phase: 'serverhello',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: 'ServerHello + key_share + Finished' },
    params: [
      { k: 'pre_shared_key', v: 'accepted', kind: 'ok' },
      { k: 'key_share', v: SAMPLE.serverShare, kind: 'key' },
      { k: 'Finished', v: 'MAC over transcript', kind: 'lock' },
    ],
    inFlight: 'server accepts PSK + completes key exchange',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: false,
    note: 'The server recognises the PSK identity, accepts the early data, and replies with its ServerHello and key_share. Combining the PSK with the new ECDHE exchange yields a fresh shared secret, so even a resumed session is forward-secret — capturing today\'s traffic does not unlock it if the PSK leaks later. The rest of the handshake finishes exactly like 1-RTT, but the first request was already answered.',
  });

  frames.push({
    phase: 'earlydata',
    active: ['client', 'server'],
    msg: { from: 'server', to: 'server', dir: 'derive', label: 'anti-replay caveat' },
    params: [
      { k: 'forward_secrecy', v: 'preserved via fresh ECDHE', kind: 'ok' },
      { k: 'replay_risk', v: '0-RTT data can be replayed by an attacker', kind: 'warn' },
      { k: 'rule', v: 'only idempotent, safe-to-replay requests', kind: 'warn' },
    ],
    inFlight: 'apply anti-replay restrictions',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: true,
    note: 'The catch: early data has no protection against replay. An attacker who captures the first flight can resend it, and the server may process it twice. So 0-RTT is reserved for requests that are safe to repeat — a GET, a cache read — never a payment or a state-changing POST. Servers add their own anti-replay windows, but the application must still treat 0-RTT data as potentially replayed.',
  });

  frames.push({
    phase: 'established',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Finished -> application keys' },
    params: [
      { k: 'channel', v: 'AEAD-protected with application keys', kind: 'ok' },
      { k: 'rtt_to_first_byte', v: '0 RTT', kind: 'ok' },
      { k: 'vs_tls12', v: '2 RTT saved on resumption', kind: 'ok' },
    ],
    inFlight: 'session established',
    secretClient: SAMPLE.sharedSecret,
    secretServer: SAMPLE.sharedSecret,
    serverAuth: true,
    note: 'The client sends Finished and the connection settles into the application keys. The headline: the first request was answered with zero round trips of waiting, versus one for a fresh TLS 1.3 handshake and two for TLS 1.2. For latency-sensitive, idempotent traffic that is the fastest secure start there is.',
  });

  return frames;
}

const RUN_DELAY_MS = 1500;

export default function Tls13HandshakeDeepViz() {
  const [mode, setMode] = useState('full'); // 'full' | 'zerortt'
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(
    () => (mode === 'zerortt' ? buildZeroRttFrames() : buildFullFrames()),
    [mode],
  );
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

  const switchMode = (next) => {
    if (next === mode) return;
    setIsRunning(false);
    setStep(0);
    setMode(next);
  };

  // RTT bookkeeping — the whole point of the comparison.
  const rttCurrent = mode === 'zerortt' ? 0 : 1;
  const rttTls12 = mode === 'zerortt' ? 2 : 2;
  const rttSaved = rttTls12 - rttCurrent;

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

  const toneForDir = (dir) => {
    if (dir === 'back') return 'back';
    if (dir === 'self') return 'self';
    if (dir === 'derive') return 'derive';
    return 'fwd';
  };
  const msgTone = msg ? toneForDir(msg.dir) : 'fwd';

  let msgLine = null;
  if (msg && msg.dir !== 'self' && msg.dir !== 'derive') {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }
  const selfActor = msg && msg.dir === 'self' ? laneX(ACTOR_INDEX[msg.from]) : null;

  // Derive step: both lifelines converge on the same shared secret value.
  const secretsMatch = current.secretClient != null
    && current.secretServer != null
    && current.secretClient === current.secretServer;
  const showDerive = msg && msg.dir === 'derive';

  const outcome = (current.phase === 'appdata' || current.phase === 'established')
    ? 'session established'
    : 'in progress';
  const outcomeClass = (current.phase === 'appdata' || current.phase === 'established')
    ? 'is-ok'
    : '';

  const narrationOk = current.phase === 'appdata'
    || current.phase === 'established'
    || current.phase === 'verifyServer'
    || current.phase === 'derive'
    || current.phase === 'finished';

  return (
    <div className="t13">
      <div className="t13-head">
        <h3 className="t13-title">TLS 1.3 handshake — one round trip to an encrypted channel</h3>
        <p className="t13-sub">
          Step the handshake between a browser and a server. The client ships its
          {' '}ECDHE key_share in the first message, so the whole negotiation finishes in a single
          round trip. Switch to 0-RTT resumption to send a request before the first reply.
        </p>
      </div>

      <div className="t13-controls">
        <div className="t13-modeswitch" role="group" aria-label="Handshake mode">
          <button
            type="button"
            className={`t13-mode-btn ${mode === 'full' ? 'is-on' : ''}`}
            onClick={() => switchMode('full')}
            aria-pressed={mode === 'full'}
          >
            <Lock size={13} /> full 1-RTT handshake
          </button>
          <button
            type="button"
            className={`t13-mode-btn ${mode === 'zerortt' ? 'is-on' : ''}`}
            onClick={() => switchMode('zerortt')}
            aria-pressed={mode === 'zerortt'}
          >
            <Zap size={13} /> 0-RTT resumption (PSK)
          </button>
        </div>

        <label className="t13-speed">
          <span className="t13-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="t13-speed-range"
            aria-label="Playback speed"
          />
          <span className="t13-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="t13-spacer" aria-hidden="true" />

        <div className="t13-buttons">
          <button
            type="button"
            className="t13-btn t13-btn-primary"
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
            className="t13-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="t13-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="t13-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="t13-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="t13-rttbanner">
        <span className="t13-rtt-cell">
          <span className="t13-rtt-label">this mode</span>
          <span className="t13-rtt-val is-ok">{rttCurrent} RTT to first byte</span>
        </span>
        <span className="t13-rtt-cell">
          <span className="t13-rtt-label">tls 1.2 equivalent</span>
          <span className="t13-rtt-val is-warn">{rttTls12} RTT</span>
        </span>
        <span className="t13-rtt-cell">
          <span className="t13-rtt-label">round trips saved</span>
          <span className="t13-rtt-val is-ok">{rttSaved}</span>
        </span>
        <span className="t13-rtt-note">
          {mode === 'zerortt'
            ? 'Resumption: early data leaves in the first packet — fastest start, but only for replay-safe requests.'
            : 'Fresh connection: TLS 1.2 needed a second round trip (ClientKeyExchange) before any data could flow.'}
        </span>
      </div>

      <div className="t13-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="t13-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="t13-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="t13-ah is-fwd" />
            </marker>
            <marker id="t13-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="t13-ah is-back" />
            </marker>
            <marker id="t13-arr-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="t13-ah is-self" />
            </marker>
            <marker id="t13-arr-derive" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="t13-ah is-derive" />
            </marker>
          </defs>

          {/* lifelines */}
          {ACTORS.map((a, i) => {
            const x = laneX(i);
            const on = isActive(a.key);
            return (
              <line
                key={`life-${a.key}`}
                className={`t13-life ${on ? 'is-on' : ''}`}
                x1={x}
                y1={laneTop + 44}
                x2={x}
                y2={laneBottom}
              />
            );
          })}

          {/* derive: converging dashed lines onto a shared-secret node */}
          {showDerive && (
            <g>
              {ACTORS.map((a, i) => {
                const x = laneX(i);
                return (
                  <line
                    key={`conv-${a.key}`}
                    className="t13-converge"
                    x1={x}
                    y1={laneTop + 44}
                    x2={W / 2}
                    y2={msgY + 6}
                  />
                );
              })}
              <rect
                className={`t13-secret-node ${secretsMatch ? 'is-match' : ''}`}
                x={W / 2 - 150}
                y={msgY - 16}
                width={300}
                height={44}
                rx={9}
              />
              <g transform={`translate(${W / 2 - 138}, ${msgY - 8})`}>
                <KeyRound width={16} height={16} className="t13-secret-ic" />
              </g>
              <text className="t13-secret-label" x={W / 2 + 6} y={msgY + 2} textAnchor="middle">
                same shared secret Z
              </text>
              <text className="t13-secret-val" x={W / 2 + 6} y={msgY + 18} textAnchor="middle">
                {SAMPLE.sharedSecret}
              </text>
            </g>
          )}

          {/* in-flight message */}
          {msgLine && (
            <g>
              <line
                className={`t13-msg is-${msgTone}`}
                x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                y1={msgY}
                x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                y2={msgY}
                markerEnd={`url(#t13-arr-${msgTone})`}
              />
              <text
                className={`t13-msg-label is-${msgTone}`}
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
                className="t13-msg is-self"
                d={`M ${selfActor} ${msgY - 14} q 64 0 64 16 q 0 16 -64 16`}
                fill="none"
                markerEnd="url(#t13-arr-self)"
              />
              <text className="t13-msg-label is-self" x={selfActor + 72} y={msgY + 4} textAnchor="start">
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
                  className={`t13-actor ${on ? 'is-on' : ''}`}
                  x={x - 78}
                  y={laneTop - 24}
                  width={156}
                  height={62}
                  rx={9}
                />
                <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                  {ActorIcon(a.icon, `t13-actor-ic ${on ? 'is-on' : ''}`)}
                </g>
                <text className={`t13-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                  {a.label}
                </text>
                <text className="t13-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                  {a.sub}
                </text>
              </g>
            );
          })}

          {/* phase ribbon */}
          <text className="t13-phase-tag" x={W / 2} y={laneBottom + 16} textAnchor="middle">
            {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight}`}
          </text>
        </svg>
      </div>

      <div className="t13-body">
        <div className="t13-payload">
          <div className="t13-payload-head">
            <ArrowRight size={13} className="t13-ic" />
            <span className="t13-payload-title">
              {msg
                ? (msg.dir === 'self'
                  ? 'local computation'
                  : msg.dir === 'derive'
                    ? 'both ends'
                    : `${msg.from} -> ${msg.to}`)
                : 'no message'}
            </span>
            <span className="t13-payload-label">{msg ? msg.label : 'idle'}</span>
          </div>
          <div className="t13-params">
            {current.params.length === 0 && (
              <div className="t13-param-empty">No records on the wire yet — press Play or Step.</div>
            )}
            {current.params.map((p) => (
              <div
                key={`${p.k}-${p.v}`}
                className={`t13-param ${p.kind ? `is-${p.kind}` : ''}`}
              >
                <span className="t13-param-k">{p.k}</span>
                <span className="t13-param-eq">=</span>
                <span className="t13-param-v">{p.v}</span>
                {p.kind === 'ok' && <span className="t13-param-badge is-ok"><Check size={10} /> ok</span>}
                {p.kind === 'key' && <span className="t13-param-badge is-key"><KeyRound size={10} /> key</span>}
                {p.kind === 'cert' && <span className="t13-param-badge is-cert"><ShieldCheck size={10} /> cert</span>}
                {p.kind === 'sig' && <span className="t13-param-badge is-sig"><FileSignature size={10} /> sig</span>}
                {p.kind === 'lock' && <span className="t13-param-badge is-lock"><Lock size={10} /> enc</span>}
                {p.kind === 'warn' && <span className="t13-param-badge is-warn">caution</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="t13-metrics">
          <div className="t13-metric">
            <span className="t13-metric-label">phase</span>
            <span className={`t13-metric-value ${narrationOk ? 'is-ok' : ''}`}>
              {PHASE_LABEL[current.phase] || current.phase}
            </span>
          </div>
          <div className="t13-metric">
            <span className="t13-metric-label">mode</span>
            <span className={`t13-metric-value ${mode === 'zerortt' ? 'is-warn' : 'is-ok'}`}>
              {mode === 'zerortt' ? '0-RTT (PSK)' : '1-RTT full'}
            </span>
          </div>
          <div className="t13-metric">
            <span className="t13-metric-label">shared secret derived</span>
            <span className={`t13-metric-value ${secretsMatch ? 'is-ok' : ''}`}>
              {secretsMatch ? 'both ends agree' : '—'}
            </span>
          </div>
          <div className="t13-metric">
            <span className="t13-metric-label">server authenticated</span>
            <span className={`t13-metric-value ${current.serverAuth ? 'is-ok' : ''}`}>
              {current.serverAuth ? 'yes' : '—'}
            </span>
          </div>
          <div className="t13-metric t13-metric-dim">
            <span className="t13-metric-label">outcome</span>
            <span className={`t13-metric-value ${outcomeClass}`}>{outcome}</span>
          </div>
        </div>
      </div>

      <div className={`t13-narration ${narrationOk ? 'is-ok' : ''}`}>
        <span className={`t13-narration-label ${narrationOk ? 'is-ok' : ''}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="t13-narration-body">{current.note}</span>
      </div>

      <div className="t13-legend">
        <span className="t13-legend-item"><ArrowRight size={13} className="t13-ic is-fwd" /> client -&gt; server</span>
        <span className="t13-legend-item"><ArrowRight size={13} className="t13-ic is-back" /> server -&gt; client</span>
        <span className="t13-legend-item"><KeyRound size={13} className="t13-ic is-derive" /> ECDHE shared-secret derivation</span>
        <span className="t13-legend-item"><Lock size={13} className="t13-ic is-ok" /> encrypted record</span>
        <span className="t13-legend-item"><Zap size={13} className="t13-ic is-warn" /> 0-RTT early data (replay-sensitive)</span>
      </div>
    </div>
  );
}
