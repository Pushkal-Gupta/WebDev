import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward, Network,
  Laptop, Server, Zap, Clock, Ban, ArrowRight, ShieldCheck,
} from 'lucide-react';
import './TcpVsQuicViz.css';

// TCP+TLS vs QUIC connection setup, stepped message by message between a Client
// and a Server. Two things are shown:
//   1. The handshake round-trips. TCP needs a 3-way handshake (SYN, SYN-ACK,
//      ACK) BEFORE the TLS handshake even starts, so several RTTs pass before
//      the first application byte. QUIC folds the transport handshake and the
//      crypto handshake into one flight over UDP, reaching 1-RTT for a new
//      connection and 0-RTT on resumption.
//   2. A dropped packet during data transfer. TCP is one ordered byte stream, so
//      a single loss stalls the whole connection (transport-level head-of-line
//      blocking). QUIC tracks each stream independently, so a loss only stalls
//      the stream that lost a packet.
// A live RTT counter increments as each round trip completes, and a final
// readout reports RTTs-to-first-byte for each transport.

const ACTORS = [
  { key: 'client', label: 'Client', sub: 'app.example', icon: 'client' },
  { key: 'server', label: 'Server', sub: 'edge.origin', icon: 'server' },
];
const ACTOR_INDEX = Object.fromEntries(ACTORS.map((a, i) => [a.key, i]));

const PHASE_LABEL = {
  init: 'setup',
  tcpSyn: 'tcp handshake',
  tcpSynAck: 'tcp handshake',
  tcpAck: 'tcp established',
  tlsHello: 'tls handshake',
  tlsServer: 'tls handshake',
  tlsFinished: 'tls established',
  appData: 'application data',
  quicInitial: 'quic handshake',
  quicResponse: 'quic handshake',
  quicFinished: 'quic established',
  quic0rtt: '0-rtt resumption',
  established: 'first byte',
  drop: 'packet loss',
  stall: 'head-of-line stall',
  isolate: 'stream isolated',
  recover: 'recovered',
};

// frame: { phase, active:[actorKey...], msg:{from,to,dir,label} | null,
//          params:[{k,v,kind?}], inFlight, rtt, firstByte, hol, note, fatal? }
function buildHandshakeFrames(mode) {
  const frames = [];

  if (mode === 'tcp') {
    frames.push({
      phase: 'init',
      active: [],
      msg: null,
      params: [],
      inFlight: '—',
      rtt: 0,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'TCP carries TLS on top of it. Before any encrypted application byte can flow, two handshakes run back to back: first TCP\'s three-way handshake to open the connection, then the TLS handshake to agree on keys. Step through and count the round trips that pass before the first byte.',
    });
    frames.push({
      phase: 'tcpSyn',
      active: ['client', 'server'],
      msg: { from: 'client', to: 'server', dir: 'fwd', label: 'SYN' },
      params: [
        { k: 'flags', v: 'SYN' },
        { k: 'seq', v: 'client_isn = x' },
        { k: 'purpose', v: 'open the connection', kind: 'warn' },
      ],
      inFlight: 'SYN',
      rtt: 0,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'The client sends a SYN to ask the server to open a connection, carrying its initial sequence number. This is pure transport setup — no crypto, no application data. The crypto handshake cannot even begin until this completes.',
    });
    frames.push({
      phase: 'tcpSynAck',
      active: ['server', 'client'],
      msg: { from: 'server', to: 'client', dir: 'back', label: 'SYN-ACK' },
      params: [
        { k: 'flags', v: 'SYN, ACK' },
        { k: 'seq', v: 'server_isn = y' },
        { k: 'ack', v: 'x + 1' },
      ],
      inFlight: 'SYN-ACK',
      rtt: 0,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'The server answers with SYN-ACK: it acknowledges the client\'s sequence number and sends its own. Half a round trip has passed. The client now knows the server is listening, but the connection is not open for both directions yet.',
    });
    frames.push({
      phase: 'tcpAck',
      active: ['client', 'server'],
      msg: { from: 'client', to: 'server', dir: 'fwd', label: 'ACK' },
      params: [
        { k: 'flags', v: 'ACK' },
        { k: 'ack', v: 'y + 1' },
        { k: 'state', v: 'connection established', kind: 'ok' },
      ],
      inFlight: 'ACK',
      rtt: 1,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'The client sends the final ACK and the TCP connection is open. That is one full round trip spent purely on transport setup — and TLS has not even started. The first encrypted byte is still two handshakes away.',
    });
    frames.push({
      phase: 'tlsHello',
      active: ['client', 'server'],
      msg: { from: 'client', to: 'server', dir: 'fwd', label: 'ClientHello' },
      params: [
        { k: 'tls_version', v: 'TLS 1.3' },
        { k: 'cipher_suites', v: 'TLS_AES_256_GCM_SHA384' },
        { k: 'key_share', v: 'client ephemeral pubkey', kind: 'key' },
      ],
      inFlight: 'ClientHello',
      rtt: 1,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'Only now does TLS begin. The client sends a ClientHello with its supported versions, cipher suites, and a key share. This rides inside the TCP connection that already cost a round trip to open — the cost is additive, not shared.',
    });
    frames.push({
      phase: 'tlsServer',
      active: ['server', 'client'],
      msg: { from: 'server', to: 'client', dir: 'back', label: 'ServerHello + Certificate + Finished' },
      params: [
        { k: 'key_share', v: 'server ephemeral pubkey', kind: 'key' },
        { k: 'certificate', v: 'CN=edge.origin', kind: 'cert' },
        { k: 'finished', v: 'server handshake done', kind: 'ok' },
      ],
      inFlight: 'ServerHello + cert + Finished',
      rtt: 2,
      firstByte: false,
      hol: 'shared ordered byte stream',
      note: 'The server replies with its key share, its certificate, and a Finished message. With TLS 1.3 this is one flight back. A second full round trip has now elapsed — one for TCP, one for the TLS exchange so far.',
    });
    frames.push({
      phase: 'tlsFinished',
      active: ['client', 'server'],
      msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Finished + first app data' },
      params: [
        { k: 'finished', v: 'client handshake done', kind: 'ok' },
        { k: 'keys', v: 'shared session key derived', kind: 'key' },
        { k: 'app_data', v: 'GET /index.html', kind: 'ok' },
      ],
      inFlight: 'Finished + application data',
      rtt: 2,
      firstByte: true,
      hol: 'shared ordered byte stream',
      note: 'The client verifies the certificate, derives the session key, sends its own Finished, and can finally attach the first application bytes. With TCP plus TLS 1.3 that took roughly two round trips before a single useful byte left the client.',
    });
    return frames;
  }

  if (mode === 'quic0') {
    frames.push({
      phase: 'init',
      active: [],
      msg: null,
      params: [],
      inFlight: '—',
      rtt: 0,
      firstByte: false,
      hol: 'per-stream independent delivery',
      note: 'This connection resumes a session the client and server already negotiated. QUIC keeps the earlier keys, so the client can encrypt application data with the very first packet — 0-RTT. There is no setup round trip to wait through.',
    });
    frames.push({
      phase: 'quic0rtt',
      active: ['client', 'server'],
      msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Initial + 0-RTT app data' },
      params: [
        { k: 'transport', v: 'QUIC over UDP' },
        { k: 'resumption', v: 'session ticket from last time', kind: 'key' },
        { k: 'app_data', v: 'GET /index.html (0-RTT)', kind: 'ok' },
      ],
      inFlight: 'Initial + 0-RTT application data',
      rtt: 0,
      firstByte: true,
      hol: 'per-stream independent delivery',
      note: 'Using the resumption secret from the previous session, the client sends application data in the FIRST flight, encrypted, alongside the handshake. The first useful byte leaves before any round trip completes — zero round trips to first byte. The server still confirms in the background, but the request is already on its way.',
    });
    frames.push({
      phase: 'quicFinished',
      active: ['server', 'client'],
      msg: { from: 'server', to: 'client', dir: 'back', label: 'Handshake + response' },
      params: [
        { k: 'handshake', v: 'confirmed', kind: 'ok' },
        { k: 'keys', v: 'fresh 1-RTT keys installed', kind: 'key' },
        { k: 'response', v: '200 OK index.html', kind: 'ok' },
      ],
      inFlight: 'handshake confirm + response',
      rtt: 1,
      firstByte: true,
      hol: 'per-stream independent delivery',
      note: 'The server confirms the handshake and can already answer the 0-RTT request. The first byte cost zero round trips; the response comes back in the time the first round trip takes. Resumption is where QUIC pulls furthest ahead of TCP plus TLS.',
    });
    return frames;
  }

  // mode === 'quic' (new connection, 1-RTT)
  frames.push({
    phase: 'init',
    active: [],
    msg: null,
    params: [],
    inFlight: '—',
    rtt: 0,
    firstByte: false,
    hol: 'per-stream independent delivery',
    note: 'QUIC runs over UDP and folds the transport handshake and the TLS 1.3 crypto handshake into one exchange. There is no separate connection-open round trip — setup and key agreement happen together. Step through and watch the first byte arrive a full round trip sooner than TCP plus TLS.',
  });
  frames.push({
    phase: 'quicInitial',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Initial (ClientHello in CRYPTO frames)' },
    params: [
      { k: 'transport', v: 'QUIC over UDP' },
      { k: 'tls_version', v: 'TLS 1.3 (embedded)' },
      { k: 'key_share', v: 'client ephemeral pubkey', kind: 'key' },
    ],
    inFlight: 'Initial packet',
    rtt: 0,
    firstByte: false,
    hol: 'per-stream independent delivery',
    note: 'The client sends a single Initial packet that carries the connection setup AND the TLS ClientHello in CRYPTO frames at once. There is no separate SYN — the transport and crypto handshakes are the same flight. One message does what TCP needed a whole round trip to even start.',
  });
  frames.push({
    phase: 'quicResponse',
    active: ['server', 'client'],
    msg: { from: 'server', to: 'client', dir: 'back', label: 'Initial + Handshake (ServerHello + cert + Finished)' },
    params: [
      { k: 'key_share', v: 'server ephemeral pubkey', kind: 'key' },
      { k: 'certificate', v: 'CN=edge.origin', kind: 'cert' },
      { k: 'finished', v: 'server handshake done', kind: 'ok' },
    ],
    inFlight: 'ServerHello + cert + Finished',
    rtt: 0,
    firstByte: false,
    hol: 'per-stream independent delivery',
    note: 'The server answers with its key share, certificate, and Finished in one flight — the same content TCP+TLS sent, but without a prior connection-open round trip in front of it. Half a round trip in, the client already has everything it needs to derive keys.',
  });
  frames.push({
    phase: 'quicFinished',
    active: ['client', 'server'],
    msg: { from: 'client', to: 'server', dir: 'fwd', label: 'Finished + first app data' },
    params: [
      { k: 'finished', v: 'client handshake done', kind: 'ok' },
      { k: 'keys', v: 'shared session key derived', kind: 'key' },
      { k: 'app_data', v: 'GET /index.html', kind: 'ok' },
    ],
    inFlight: 'Finished + application data',
    rtt: 1,
    firstByte: true,
    hol: 'per-stream independent delivery',
    note: 'The client verifies the certificate, derives the key, and sends Finished with the first application bytes attached. That is one round trip to first byte for a brand-new connection — half what TCP plus TLS 1.3 spent, because QUIC never paid for a separate transport handshake.',
  });
  return frames;
}

// Data-transfer phase: a dropped packet on one of several streams.
// TCP: one ordered byte stream, so the loss stalls every stream until retransmit.
// QUIC: per-stream tracking, so only the stream that lost a packet stalls.
function buildLossFrames(tcp) {
  const frames = [];

  frames.push({
    phase: 'appData',
    streams: [
      { id: 1, hue: '--hue-violet', state: 'flowing' },
      { id: 2, hue: '--hue-sky', state: 'flowing' },
      { id: 3, hue: '--hue-pink', state: 'flowing' },
    ],
    dropStream: null,
    hol: tcp ? 'shared ordered byte stream' : 'per-stream independent delivery',
    note: tcp
      ? 'The connection is open and three requests multiplex over it. Over TCP they all share one ordered byte stream, so the receiver delivers bytes strictly in order. Watch what a single lost packet does to that.'
      : 'The connection is open and three streams flow over QUIC. Each stream\'s bytes are tracked independently, so the receiver can deliver one stream while another waits. Watch what a single lost packet does to that.',
  });
  frames.push({
    phase: 'drop',
    streams: [
      { id: 1, hue: '--hue-violet', state: 'flowing' },
      { id: 2, hue: '--hue-sky', state: 'dropped' },
      { id: 3, hue: '--hue-pink', state: 'flowing' },
    ],
    dropStream: 2,
    hol: tcp ? 'shared ordered byte stream' : 'per-stream independent delivery',
    note: 'A packet carrying stream 2\'s data is lost on the wire. It will have to be retransmitted, which takes one round trip. The question is what happens to the other two streams while that retransmit travels.',
  });

  if (tcp) {
    frames.push({
      phase: 'stall',
      streams: [
        { id: 1, hue: '--hue-violet', state: 'stalled' },
        { id: 2, hue: '--hue-sky', state: 'dropped' },
        { id: 3, hue: '--hue-pink', state: 'stalled' },
      ],
      dropStream: 2,
      hol: 'shared ordered byte stream',
      note: 'Because TCP is one ordered byte stream, the receiver cannot deliver ANY byte that arrived after the lost one — even bytes belonging to streams 1 and 3, which arrived perfectly fine. All three streams stall behind the single gap. This is transport-level head-of-line blocking.',
    });
    frames.push({
      phase: 'recover',
      streams: [
        { id: 1, hue: '--hue-violet', state: 'flowing' },
        { id: 2, hue: '--hue-sky', state: 'flowing' },
        { id: 3, hue: '--hue-pink', state: 'flowing' },
      ],
      dropStream: null,
      hol: 'shared ordered byte stream',
      note: 'After a full round trip the lost packet is retransmitted, the gap is filled, and the receiver releases all the bytes it was holding. Everything resumes — but every stream paid for one stream\'s loss. That shared penalty is exactly what QUIC was designed to remove.',
    });
    return frames;
  }

  frames.push({
    phase: 'isolate',
    streams: [
      { id: 1, hue: '--hue-violet', state: 'flowing' },
      { id: 2, hue: '--hue-sky', state: 'stalled' },
      { id: 3, hue: '--hue-pink', state: 'flowing' },
    ],
    dropStream: 2,
    hol: 'per-stream independent delivery',
    note: 'QUIC tracks each stream\'s bytes separately, so the loss is contained: only stream 2 waits for its retransmit. Streams 1 and 3 keep delivering to the application without interruption. The loss is isolated to the one stream that actually lost a packet.',
  });
  frames.push({
    phase: 'recover',
    streams: [
      { id: 1, hue: '--hue-violet', state: 'flowing' },
      { id: 2, hue: '--hue-sky', state: 'flowing' },
      { id: 3, hue: '--hue-pink', state: 'flowing' },
    ],
    dropStream: null,
    hol: 'per-stream independent delivery',
    note: 'One round trip later stream 2\'s packet is retransmitted and it catches up. Only stream 2 ever paused; streams 1 and 3 never noticed. No head-of-line blocking across streams — the core transport win QUIC has over TCP.',
  });
  return frames;
}

const RUN_DELAY_MS = 1600;

export default function TcpVsQuicViz() {
  const [mode, setMode] = useState('tcp'); // 'tcp' | 'quic' | 'quic0'
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const isTcp = mode === 'tcp';
  const handshake = useMemo(() => buildHandshakeFrames(mode), [mode]);
  const loss = useMemo(() => buildLossFrames(isTcp), [isTcp]);
  const frames = useMemo(() => [...handshake, ...loss], [handshake, loss]);

  const totalSteps = frames.length;
  const handshakeLen = handshake.length;
  const safeStep = Math.min(step, totalSteps - 1);
  const current = frames[safeStep];
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

  const setModeAndReset = (m) => {
    setIsRunning(false);
    setStep(0);
    setMode(m);
  };

  // Live RTT counter: the max rtt across handshake frames seen so far.
  const inHandshake = safeStep < handshakeLen;
  const rttSoFar = useMemo(() => {
    let m = 0;
    for (let i = 0; i <= safeStep && i < handshakeLen; i += 1) {
      if (typeof handshake[i].rtt === 'number') m = Math.max(m, handshake[i].rtt);
    }
    return m;
  }, [safeStep, handshake, handshakeLen]);

  // First-byte RTT cost per transport (the final handshake frame's rtt).
  const firstByteRtt = useMemo(() => {
    const last = handshake[handshakeLen - 1];
    return last && typeof last.rtt === 'number' ? last.rtt : 0;
  }, [handshake, handshakeLen]);
  const firstByteReached = inHandshake ? !!current.firstByte : true;

  const modeMeta = {
    tcp: { label: 'TCP + TLS 1.3', short: 'TCP+TLS', rttText: '~2 RTT to first byte' },
    quic: { label: 'QUIC (new)', short: 'QUIC', rttText: '1 RTT to first byte' },
    quic0: { label: 'QUIC (0-RTT resume)', short: 'QUIC 0-RTT', rttText: '0 RTT to first byte' },
  }[mode];

  // SVG geometry — two actor lanes with vertical lifelines.
  const W = 940;
  const H = 320;
  const laneTop = 56;
  const laneBottom = H - 26;
  const pad = 180;
  const denom = Math.max(ACTORS.length - 1, 1);
  const laneX = (i) => pad + (i / denom) * (W - 2 * pad);
  const msgY = laneTop + 96;

  const ActorIcon = (icon, cls) => {
    if (icon === 'client') return <Laptop width={20} height={20} className={cls} />;
    return <Server width={20} height={20} className={cls} />;
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  const msg = inHandshake ? current.msg : null;
  const isActive = (key) => current.active && current.active.includes(key);

  const toneForDir = (dir) => (dir === 'back' ? 'back' : 'fwd');
  const msgTone = msg ? toneForDir(msg.dir) : 'fwd';

  let msgLine = null;
  if (msg) {
    const xa = laneX(ACTOR_INDEX[msg.from]);
    const xb = laneX(ACTOR_INDEX[msg.to]);
    msgLine = { xa, xb, mid: (xa + xb) / 2, ltr: xb >= xa };
  }

  // Loss-phase geometry (stacked stream rows inside the same stage).
  const lossFrame = inHandshake ? null : current;
  const streamRows = lossFrame ? lossFrame.streams : [];
  const lossTop = laneTop + 18;
  const lossRowH = 44;
  const lossRowGap = 14;
  const lossLeft = 150;
  const lossRight = W - 70;

  return (
    <div className="tqv">
      <div className="tqv-head">
        <h3 className="tqv-title">TCP + TLS vs QUIC — round trips to the first byte</h3>
        <p className="tqv-sub">
          Step the connection setup between a client and a server. TCP opens with a three-way handshake,
          then runs TLS on top — two handshakes, two round trips before any data. QUIC folds setup and
          crypto into one exchange over UDP: 1 RTT for a new connection, 0 RTT on resumption. Past setup,
          drop a packet and watch TCP stall every stream while QUIC isolates the loss.
        </p>
      </div>

      <div className="tqv-controls">
        <div className="tqv-modes" role="group" aria-label="Transport mode">
          <button
            type="button"
            className={`tqv-toggle ${mode === 'tcp' ? 'is-on' : ''}`}
            onClick={() => setModeAndReset('tcp')}
            aria-pressed={mode === 'tcp'}
            title="TCP three-way handshake then TLS 1.3 on top"
          >
            <Network size={14} /> TCP + TLS
          </button>
          <button
            type="button"
            className={`tqv-toggle ${mode === 'quic' ? 'is-on' : ''}`}
            onClick={() => setModeAndReset('quic')}
            aria-pressed={mode === 'quic'}
            title="QUIC new connection — 1-RTT handshake over UDP"
          >
            <Zap size={14} /> QUIC 1-RTT
          </button>
          <button
            type="button"
            className={`tqv-toggle ${mode === 'quic0' ? 'is-on' : ''}`}
            onClick={() => setModeAndReset('quic0')}
            aria-pressed={mode === 'quic0'}
            title="QUIC resumption — 0-RTT, app data in the first flight"
          >
            <ShieldCheck size={14} /> QUIC 0-RTT
          </button>
        </div>

        <span className="tqv-mode-tag">{modeMeta.rttText}</span>

        <label className="tqv-speed">
          <span className="tqv-input-label">speed</span>
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.5}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="tqv-speed-range"
            aria-label="Playback speed"
          />
          <span className="tqv-speed-value">{speed.toFixed(1)}×</span>
        </label>

        <span className="tqv-spacer" aria-hidden="true" />

        <div className="tqv-buttons">
          <button
            type="button"
            className="tqv-btn tqv-btn-primary"
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
            className="tqv-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="tqv-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="tqv-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="tqv-stepcount">
          step <strong>{safeStep + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="tqv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="tqv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="tqv-arr-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tqv-ah is-fwd" />
            </marker>
            <marker id="tqv-arr-back" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" className="tqv-ah is-back" />
            </marker>
          </defs>

          {/* HANDSHAKE STAGE */}
          {inHandshake && (
            <>
              {ACTORS.map((a, i) => {
                const x = laneX(i);
                const on = isActive(a.key);
                return (
                  <line
                    key={`life-${a.key}`}
                    className={`tqv-life ${on ? 'is-on' : ''}`}
                    x1={x}
                    y1={laneTop + 44}
                    x2={x}
                    y2={laneBottom}
                  />
                );
              })}

              {msgLine && (
                <g>
                  <line
                    className={`tqv-msg is-${msgTone}`}
                    x1={msgLine.ltr ? msgLine.xa + 6 : msgLine.xa - 6}
                    y1={msgY}
                    x2={msgLine.ltr ? msgLine.xb - 10 : msgLine.xb + 10}
                    y2={msgY}
                    markerEnd={`url(#tqv-arr-${msgTone})`}
                  />
                  <text
                    className={`tqv-msg-label is-${msgTone}`}
                    x={msgLine.mid}
                    y={msgY - 12}
                    textAnchor="middle"
                  >
                    {msg.label}
                  </text>
                </g>
              )}

              {ACTORS.map((a, i) => {
                const x = laneX(i);
                const on = isActive(a.key);
                return (
                  <g key={`actor-${a.key}`}>
                    <rect
                      className={`tqv-actor ${on ? 'is-on' : ''}`}
                      x={x - 78}
                      y={laneTop - 24}
                      width={156}
                      height={62}
                      rx={9}
                    />
                    <g transform={`translate(${x - 10}, ${laneTop - 16})`}>
                      {ActorIcon(a.icon, `tqv-actor-ic ${on ? 'is-on' : ''}`)}
                    </g>
                    <text className={`tqv-actor-label ${on ? 'is-on' : ''}`} x={x} y={laneTop + 12} textAnchor="middle">
                      {a.label}
                    </text>
                    <text className="tqv-actor-sub" x={x} y={laneTop + 27} textAnchor="middle">
                      {a.sub}
                    </text>
                  </g>
                );
              })}

              <text className={`tqv-phase-tag ${firstByteReached ? 'is-ok' : ''}`} x={W / 2} y={laneBottom + 16} textAnchor="middle">
                {`${PHASE_LABEL[current.phase] || current.phase} · in flight: ${current.inFlight} · RTT ${rttSoFar}`}
              </text>
            </>
          )}

          {/* LOSS STAGE — stacked stream rows */}
          {!inHandshake && (
            <>
              <text className="tqv-conn-label" x={lossLeft} y={laneTop - 18} textAnchor="start">
                {isTcp
                  ? 'one TCP connection — single ordered byte stream, in-order delivery for all'
                  : 'one QUIC connection over UDP — per-stream byte tracking, independent delivery'}
              </text>
              {streamRows.map((s, i) => {
                const y = lossTop + i * (lossRowH + lossRowGap);
                const mid = y + lossRowH / 2;
                const dropX = lossLeft + (lossRight - lossLeft) * 0.5;
                const flowing = s.state === 'flowing';
                const stalled = s.state === 'stalled';
                const dropped = s.state === 'dropped';
                return (
                  <g key={`stream-${s.id}`}>
                    <text className="tqv-lane-req" x={0} y={mid - 3}>
                      {`stream ${s.id}`}
                    </text>
                    <text
                      className={`tqv-lane-state ${stalled ? 'is-stalled' : (dropped ? 'is-dropped' : 'is-flowing')}`}
                      x={0}
                      y={mid + 12}
                    >
                      {stalled ? 'stalled' : (dropped ? 'lost' : 'delivering')}
                    </text>
                    <rect
                      className={`tqv-track ${stalled ? 'is-stalled' : ''} ${dropped ? 'is-dropped' : ''}`}
                      x={lossLeft}
                      y={y + 6}
                      width={Math.max(0, lossRight - lossLeft)}
                      height={lossRowH - 12}
                      rx={6}
                      style={{ '--tqv-hue': `var(${s.hue})` }}
                    />
                    {flowing && (
                      <line
                        className="tqv-flow-arrow"
                        x1={lossLeft + 10}
                        y1={mid}
                        x2={lossRight - 14}
                        y2={mid}
                        markerEnd="url(#tqv-arr-fwd)"
                        style={{ '--tqv-hue': `var(${s.hue})` }}
                      />
                    )}
                    {stalled && (
                      <text className="tqv-stall-text" x={(lossLeft + lossRight) / 2} y={mid + 4} textAnchor="middle">
                        held — waiting on the lost packet
                      </text>
                    )}
                    {dropped && (
                      <g>
                        <line className="tqv-drop-x a" x1={dropX - 9} y1={mid - 9} x2={dropX + 9} y2={mid + 9} />
                        <line className="tqv-drop-x b" x1={dropX + 9} y1={mid - 9} x2={dropX - 9} y2={mid + 9} />
                        <text className="tqv-drop-text" x={dropX + 18} y={mid + 4} textAnchor="start">
                          packet dropped — retransmit in 1 RTT
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              <text className={`tqv-phase-tag ${isTcp ? 'is-warn' : 'is-ok'}`} x={W / 2} y={laneBottom + 16} textAnchor="middle">
                {`${PHASE_LABEL[current.phase] || current.phase} · ${isTcp ? 'transport-wide head-of-line blocking' : 'loss isolated to one stream'}`}
              </text>
            </>
          )}
        </svg>
      </div>

      <div className="tqv-metrics">
        <div className="tqv-metric">
          <span className="tqv-metric-label">transport</span>
          <span className={`tqv-metric-value ${isTcp ? 'is-warn' : 'is-ok'}`}>
            {isTcp ? 'TCP + TLS' : 'QUIC / UDP'}
          </span>
        </div>
        <div className="tqv-metric">
          <span className="tqv-metric-label">round trips so far</span>
          <span className="tqv-metric-value">
            {inHandshake ? `${rttSoFar} RTT` : `${firstByteRtt} RTT`}
          </span>
        </div>
        <div className="tqv-metric">
          <span className="tqv-metric-label">first byte reached</span>
          <span className={`tqv-metric-value ${firstByteReached ? 'is-ok' : ''}`}>
            {firstByteReached ? 'yes' : 'not yet'}
          </span>
        </div>
        <div className="tqv-metric">
          <span className="tqv-metric-label">RTT to first byte</span>
          <span className={`tqv-metric-value ${isTcp ? 'is-warn' : 'is-ok'}`}>
            {`${firstByteRtt} RTT`}
          </span>
        </div>
        <div className="tqv-metric tqv-metric-dim">
          <span className="tqv-metric-label">head-of-line blocking</span>
          <span className={`tqv-metric-value ${isTcp ? 'is-warn' : 'is-ok'}`}>
            {isTcp ? 'transport-wide' : 'per-stream only'}
          </span>
        </div>
      </div>

      <div className="tqv-readout">
        <div className={`tqv-readout-card ${isTcp ? 'is-active' : ''}`}>
          <span className="tqv-readout-label"><Network size={12} /> TCP + TLS 1.3</span>
          <span className="tqv-readout-value is-warn">~2 RTT</span>
          <span className="tqv-readout-note">three-way TCP handshake, then TLS on top</span>
        </div>
        <div className={`tqv-readout-card ${mode === 'quic' ? 'is-active' : ''}`}>
          <span className="tqv-readout-label"><Zap size={12} /> QUIC (new)</span>
          <span className="tqv-readout-value is-ok">1 RTT</span>
          <span className="tqv-readout-note">setup and crypto folded into one flight</span>
        </div>
        <div className={`tqv-readout-card ${mode === 'quic0' ? 'is-active' : ''}`}>
          <span className="tqv-readout-label"><ShieldCheck size={12} /> QUIC (resume)</span>
          <span className="tqv-readout-value is-ok">0 RTT</span>
          <span className="tqv-readout-note">app data rides the first packet</span>
        </div>
      </div>

      <div className={`tqv-narration ${inHandshake ? (firstByteReached ? 'is-ok' : '') : (isTcp ? 'is-warn' : 'is-ok')}`}>
        <span className={`tqv-narration-label ${inHandshake ? (firstByteReached ? 'is-ok' : '') : (isTcp ? 'is-warn' : 'is-ok')}`}>
          {PHASE_LABEL[current.phase] || current.phase}
        </span>
        <span className="tqv-narration-body">{current.note}</span>
      </div>

      <div className="tqv-legend">
        <span className="tqv-legend-item"><ArrowRight size={13} className="tqv-ic is-fwd" /> client -&gt; server</span>
        <span className="tqv-legend-item"><ArrowRight size={13} className="tqv-ic is-back" /> server -&gt; client</span>
        <span className="tqv-legend-item"><Clock size={13} className="tqv-ic is-warn" /> each round trip adds latency before the first byte</span>
        <span className="tqv-legend-item"><Ban size={13} className="tqv-ic is-fail" /> dropped packet — retransmitted after one RTT</span>
        <span className="tqv-legend-item"><Zap size={13} className="tqv-ic is-ok" /> QUIC isolates loss to one stream</span>
      </div>
    </div>
  );
}
