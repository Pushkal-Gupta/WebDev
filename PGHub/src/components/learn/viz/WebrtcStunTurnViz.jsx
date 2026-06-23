import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, SkipForward,
  Globe, Server, Network, Wifi, ShieldQuestion,
} from 'lucide-react';
import './WebrtcStunTurnViz.css';

const NAT_TYPES = [
  { id: 'full-cone', label: 'full-cone' },
  { id: 'restricted-cone', label: 'restricted-cone' },
  { id: 'symmetric', label: 'symmetric' },
];

// Deterministic addresses — no randomness needed.
const ADDR = {
  hostA: '192.168.1.4:50000',
  hostB: '192.168.0.9:50000',
  srflxA: '1.2.3.4:55',
  srflxB: '5.6.7.8:61',
  // What NAT-A actually uses to reach B when symmetric — a DIFFERENT port than srflx.
  symPortA: '1.2.3.4:6123',
  symPortB: '5.6.7.8:7480',
  stun: '74.125.0.10:3478',
  turn: '9.9.9.9:7000',
};

const isSym = (id) => id === 'symmetric';

// Build the scripted ICE-negotiation frames for a given NAT combination.
function buildFrames(natA, natB) {
  const relay = isSym(natA) || isSym(natB);
  const frames = [];

  const base = {
    natA,
    natB,
    srflxA: null,
    srflxB: null,
    candidatesShared: false,
    activeEdge: null,        // 'a-stun' | 'b-stun' | 'a-sig' | 'sig-b' | 'host-pair' |
                             // 'srflx-pair' | 'turn-alloc-a' | 'turn-alloc-b' | 'relay-media'
    checking: null,          // 'host' | 'srflx' | 'relay'
    pairResult: null,        // { kind, status }
    selectedPair: null,      // 'host' | 'srflx' | 'relay'
    path: null,              // 'direct' | 'relayed'
    relayUsed: false,
    mediaFlowing: false,
    note: '',
  };
  const snap = (extra) => ({ ...base, ...extra });

  frames.push(snap({
    note: `ICE gathers candidates for the call. Peer A is behind a ${natA} NAT, Peer B behind a ${natB} NAT. First each peer must learn its own public address.`,
  }));

  // 1) STUN binding requests
  frames.push(snap({
    activeEdge: 'a-stun',
    note: 'Peer A sends a STUN Binding Request over UDP. The STUN server replies with the source it observed — Peer A’s NAT-translated public (server-reflexive) address.',
  }));
  frames.push(snap({
    srflxA: ADDR.srflxA,
    activeEdge: 'a-stun',
    note: `Peer A learns its srflx Mapped Address ${ADDR.srflxA}. This is the address the outside world sees for A’s media socket.`,
  }));
  frames.push(snap({
    srflxA: ADDR.srflxA,
    activeEdge: 'b-stun',
    note: 'Peer B sends its own STUN Binding Request. The server reflects B’s public mapping back the same way.',
  }));
  frames.push(snap({
    srflxA: ADDR.srflxA,
    srflxB: ADDR.srflxB,
    activeEdge: 'b-stun',
    note: `Peer B learns its srflx Mapped Address ${ADDR.srflxB}. Both peers now hold a host candidate (LAN) and a srflx candidate (via STUN).`,
  }));

  // 2) Offer / answer + candidate exchange via signaling
  frames.push(snap({
    srflxA: ADDR.srflxA,
    srflxB: ADDR.srflxB,
    activeEdge: 'a-sig',
    note: 'Peer A sends an SDP offer plus its ICE candidates over the signaling channel. Signaling carries setup metadata only — never the media itself.',
  }));
  frames.push(snap({
    srflxA: ADDR.srflxA,
    srflxB: ADDR.srflxB,
    activeEdge: 'sig-b',
    candidatesShared: true,
    note: 'Peer B answers and returns its own candidates. Each side now has the other’s host + srflx addresses and forms candidate pairs to test.',
  }));

  // 3) Connectivity checks — host pair first (always fails behind NAT)
  frames.push(snap({
    srflxA: ADDR.srflxA,
    srflxB: ADDR.srflxB,
    candidatesShared: true,
    activeEdge: 'host-pair',
    checking: 'host',
    note: `Connectivity check, highest priority first: host ↔ host (${ADDR.hostA} ↔ ${ADDR.hostB}). These are private LAN IPs — not routable across the internet.`,
  }));
  frames.push(snap({
    srflxA: ADDR.srflxA,
    srflxB: ADDR.srflxB,
    candidatesShared: true,
    checking: 'host',
    pairResult: { kind: 'host', status: 'fail' },
    note: 'Host pair FAILS: neither peer can reach the other’s private address from the public internet. ICE moves to the next candidate pair.',
  }));

  if (!relay) {
    // srflx pair succeeds → direct p2p (hole punching opens the pinhole)
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'srflx-pair',
      checking: 'srflx',
      note: `Check srflx ↔ srflx (${ADDR.srflxA} ↔ ${ADDR.srflxB}). Both peers send to each other at once — each outbound packet opens a NAT pinhole the other’s reply slips through (hole punching).`,
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      checking: 'srflx',
      pairResult: { kind: 'srflx', status: 'ok' },
      selectedPair: 'srflx',
      path: 'direct',
      note: 'srflx pair SUCCEEDS. Because both NATs keep a stable public mapping, the address learned via STUN is the same one used to reach the peer — hole punching works.',
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'srflx-pair',
      checking: 'srflx',
      selectedPair: 'srflx',
      path: 'direct',
      mediaFlowing: true,
      note: 'Nominated pair = srflx ↔ srflx. SRTP media now flows DIRECTLY peer-to-peer. No relay, no per-minute bandwidth cost — the ideal WebRTC path.',
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      selectedPair: 'srflx',
      path: 'direct',
      mediaFlowing: true,
      note: 'Done. Winning pair: srflx (direct). Relay used: no. Two cone-style NATs allow direct traversal — STUN alone solves the large majority of consumer calls.',
    }));
  } else {
    // srflx pair fails because a symmetric NAT picks a different external port per destination
    const offender = isSym(natA) ? 'Peer A' : 'Peer B';
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'srflx-pair',
      checking: 'srflx',
      note: `Check srflx ↔ srflx. But ${offender} sits behind a SYMMETRIC NAT — it allocates a DIFFERENT external port for every destination.`,
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      checking: 'srflx',
      pairResult: { kind: 'srflx', status: 'fail' },
      note: `srflx pair FAILS: the port the symmetric NAT used toward STUN (${isSym(natA) ? ADDR.srflxA : ADDR.srflxB}) is NOT the port it uses toward the peer (${isSym(natA) ? ADDR.symPortA : ADDR.symPortB}). Hole punching can’t hit a moving target.`,
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'turn-alloc-a',
      checking: 'relay',
      note: `No direct path exists. ICE falls back to TURN: Peer A sends an Allocate request to the TURN server and is granted a relay address ${ADDR.turn}.`,
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'turn-alloc-b',
      checking: 'relay',
      pairResult: { kind: 'relay', status: 'ok' },
      selectedPair: 'relay',
      path: 'relayed',
      relayUsed: true,
      note: 'Peer B also reaches the TURN relay. The relay candidate pair succeeds — both peers can talk TO the public relay even though they can’t talk to each other.',
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      activeEdge: 'relay-media',
      checking: 'relay',
      selectedPair: 'relay',
      path: 'relayed',
      relayUsed: true,
      mediaFlowing: true,
      note: 'Nominated pair = relay. SRTP media routes A → TURN → B. The call works, but every relayed minute is bandwidth the TURN operator pays for.',
    }));
    frames.push(snap({
      srflxA: ADDR.srflxA,
      srflxB: ADDR.srflxB,
      candidatesShared: true,
      selectedPair: 'relay',
      path: 'relayed',
      relayUsed: true,
      mediaFlowing: true,
      note: 'Done. Winning pair: relay (relayed). Relay used: yes. Symmetric NAT (~8% of consumer, ~30% of cellular/corporate) makes TURN MANDATORY — STUN cannot save this call.',
    }));
  }

  return frames;
}

export default function WebrtcStunTurnViz() {
  const uid = useId().replace(/:/g, '');
  const [natA, setNatA] = useState('full-cone');
  const [natB, setNatB] = useState('restricted-cone');
  const [step, setStep] = useState(0);
  const [isRunningRaw, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1.5);
  const runTimer = useRef(null);

  const frames = useMemo(() => buildFrames(natA, natB), [natA, natB]);
  const totalSteps = frames.length;
  const current = frames[Math.min(step, totalSteps - 1)];
  const isRunning = isRunningRaw && step < totalSteps - 1;
  const delay = Math.round(1200 / speed);

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

  const changeNat = (which, value) => {
    setIsRunning(false);
    setStep(0);
    if (which === 'a') setNatA(value);
    else setNatB(value);
  };

  const playLabel = isRunningRaw && step < totalSteps - 1
    ? 'Pause'
    : (step >= totalSteps - 1 ? 'Replay' : 'Play');

  // ---- topology geometry (2D network graph — allowed as a spatial figure) ----
  const W = 940;
  const H = 440;
  const N = {
    peerA: { x: 110, y: 80, label: 'Peer A', sub: 'browser', icon: Globe, hue: 'var(--hue-violet)' },
    peerB: { x: 830, y: 80, label: 'Peer B', sub: 'browser', icon: Globe, hue: 'var(--hue-pink)' },
    natA: { x: 110, y: 240, label: 'NAT-A', sub: 'home router', icon: Network, hue: 'var(--hue-violet)' },
    natB: { x: 830, y: 240, label: 'NAT-B', sub: 'home router', icon: Network, hue: 'var(--hue-pink)' },
    stun: { x: 470, y: 70, label: 'STUN', sub: 'echo · UDP', icon: Server, hue: 'var(--hue-sky)' },
    turn: { x: 470, y: 360, label: 'TURN', sub: 'media relay', icon: Server, hue: 'var(--warning)' },
  };
  const NODE_W = 132;
  const NODE_H = 64;
  const cx = (k) => N[k].x;
  const cy = (k) => N[k].y;

  const edgeActive = (id) => current.activeEdge === id;
  const edge = (from, to) => ({ x1: cx(from), y1: cy(from), x2: cx(to), y2: cy(to) });

  const e = {
    aStun: edge('peerA', 'stun'),
    bStun: edge('peerB', 'stun'),
    aSig: { x1: cx('peerA'), y1: cy('peerA') + 18, x2: cx('peerB'), y2: cy('peerB') + 18 },
    srflx: { x1: cx('natA'), y1: cy('natA'), x2: cx('natB'), y2: cy('natB') },
    turnA: edge('natA', 'turn'),
    turnB: edge('natB', 'turn'),
    aNat: edge('peerA', 'natA'),
    bNat: edge('peerB', 'natB'),
  };

  const pairOutcome = (kind) => {
    if (current.pairResult && current.pairResult.kind === kind) return current.pairResult.status;
    return null;
  };

  const renderNatPick = (which, value, accent) => (
    <label className="wrtc-natpick" style={{ '--pick': accent }}>
      <span className="wrtc-natpick-label">{which === 'a' ? 'Peer A NAT' : 'Peer B NAT'}</span>
      <select
        className="wrtc-select"
        value={value}
        onChange={(ev) => changeNat(which, ev.target.value)}
        aria-label={which === 'a' ? 'Peer A NAT type' : 'Peer B NAT type'}
      >
        {NAT_TYPES.map((t) => (
          <option key={t.id} value={t.id}>{t.label}</option>
        ))}
      </select>
    </label>
  );

  const renderNode = (k, dim) => {
    const node = N[k];
    const Icon = node.icon;
    const x = node.x - NODE_W / 2;
    const y = node.y - NODE_H / 2;
    return (
      <g key={`node-${k}`} className={`wrtc-node ${dim ? 'is-dim' : ''}`} style={{ '--node-hue': node.hue }}>
        <rect className="wrtc-node-box" x={x} y={y} width={NODE_W} height={NODE_H} rx={9} />
        <foreignObject x={x + 10} y={y + 9} width={24} height={24}>
          <Icon size={20} className="wrtc-node-icon" />
        </foreignObject>
        <text className="wrtc-node-label" x={x + 42} y={y + 24}>{node.label}</text>
        <text className="wrtc-node-sub" x={x + 42} y={y + 41}>{node.sub}</text>
      </g>
    );
  };

  const showStunEdges = !current.path || current.checking === 'host' || (!current.candidatesShared);
  const relayChosen = current.path === 'relayed';

  return (
    <div className="wrtc">
      <div className="wrtc-head">
        <span className="wrtc-head-icon"><Wifi size={20} /></span>
        <div className="wrtc-head-text">
          <h3 className="wrtc-title">WebRTC NAT traversal — STUN · ICE · TURN</h3>
          <p className="wrtc-sub">
            Pick each peer&apos;s NAT type and step the ICE handshake. Two cone NATs reach a direct
            srflx path; a symmetric NAT forces media through the TURN relay.
          </p>
        </div>
      </div>

      <div className="wrtc-controls">
        {renderNatPick('a', natA, 'var(--hue-violet)')}
        {renderNatPick('b', natB, 'var(--hue-pink)')}

        <label className="wrtc-slider">
          <span className="wrtc-input-label">speed</span>
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(ev) => setSpeed(Number(ev.target.value))}
            className="wrtc-range" aria-label="Playback speed"
          />
          <span className="wrtc-slider-val">{speed.toFixed(1)}×</span>
        </label>

        <span className="wrtc-spacer" aria-hidden="true" />

        <div className="wrtc-buttons">
          <button
            type="button"
            className="wrtc-btn wrtc-btn-primary"
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
            className="wrtc-btn"
            onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
            disabled={step >= totalSteps - 1}
          >
            <ChevronRight size={14} /> Step
          </button>
          <button
            type="button"
            className="wrtc-btn"
            onClick={() => setStep(totalSteps - 1)}
            disabled={step >= totalSteps - 1}
          >
            <SkipForward size={14} /> Skip
          </button>
          <button type="button" className="wrtc-btn" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
        <div className="wrtc-stepcount">
          step <strong>{step + 1}</strong> / {totalSteps}
        </div>
      </div>

      <div className="wrtc-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wrtc-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id={`${uid}-arrow`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="wrtc-arrowhead" />
            </marker>
            <marker id={`${uid}-arrow-ok`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="wrtc-arrowhead is-ok" />
            </marker>
            <marker id={`${uid}-arrow-warn`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L9,4.5 L0,9 Z" className="wrtc-arrowhead is-warn" />
            </marker>
          </defs>

          {/* peer ↔ NAT cabling (always present, faint) */}
          <line className="wrtc-link is-cable" x1={e.aNat.x1} y1={e.aNat.y1} x2={e.aNat.x2} y2={e.aNat.y2} />
          <line className="wrtc-link is-cable" x1={e.bNat.x1} y1={e.bNat.y1} x2={e.bNat.x2} y2={e.bNat.y2} />

          {/* STUN binding edges */}
          {showStunEdges && (
            <>
              <line
                className={`wrtc-link is-stun ${edgeActive('a-stun') ? 'is-active' : ''} ${current.srflxA ? 'is-done' : ''}`}
                x1={e.aStun.x1} y1={e.aStun.y1} x2={e.aStun.x2} y2={e.aStun.y2}
                markerEnd={`url(#${uid}-arrow)`}
              />
              <line
                className={`wrtc-link is-stun ${edgeActive('b-stun') ? 'is-active' : ''} ${current.srflxB ? 'is-done' : ''}`}
                x1={e.bStun.x1} y1={e.bStun.y1} x2={e.bStun.x2} y2={e.bStun.y2}
                markerEnd={`url(#${uid}-arrow)`}
              />
            </>
          )}

          {/* signaling edge (offer/answer) */}
          <line
            className={`wrtc-link is-sig ${(edgeActive('a-sig') || edgeActive('sig-b')) ? 'is-active' : ''} ${current.candidatesShared ? 'is-done' : ''}`}
            x1={e.aSig.x1} y1={e.aSig.y1} x2={e.aSig.x2} y2={e.aSig.y2}
            markerEnd={`url(#${uid}-arrow)`}
          />
          <text className="wrtc-edge-tag is-sig" x={(e.aSig.x1 + e.aSig.x2) / 2} y={e.aSig.y1 - 8} textAnchor="middle">
            signaling · SDP offer/answer + candidates
          </text>

          {/* host pair (LAN, always fails) */}
          {current.checking === 'host' && (
            <text className="wrtc-edge-tag is-fail" x={W / 2} y={300} textAnchor="middle">
              host-to-host check: private LAN IPs unreachable — FAIL
            </text>
          )}

          {/* srflx direct pair (NAT-A ↔ NAT-B) */}
          {(current.checking === 'srflx' || current.path === 'direct') && (
            <>
              <line
                className={[
                  'wrtc-link is-srflx',
                  edgeActive('srflx-pair') ? 'is-active' : '',
                  pairOutcome('srflx') === 'ok' || current.path === 'direct' ? 'is-ok' : '',
                  pairOutcome('srflx') === 'fail' ? 'is-fail' : '',
                  current.mediaFlowing && current.path === 'direct' ? 'is-media' : '',
                ].join(' ')}
                x1={e.srflx.x1} y1={e.srflx.y1} x2={e.srflx.x2} y2={e.srflx.y2}
                markerEnd={pairOutcome('srflx') === 'ok' || current.path === 'direct'
                  ? `url(#${uid}-arrow-ok)` : `url(#${uid}-arrow)`}
              />
              <text
                className={`wrtc-edge-tag ${current.path === 'direct' ? 'is-ok' : pairOutcome('srflx') === 'fail' ? 'is-fail' : 'is-srflx'}`}
                x={(e.srflx.x1 + e.srflx.x2) / 2} y={e.srflx.y1 - 12} textAnchor="middle"
              >
                {current.path === 'direct'
                  ? 'srflx pair — DIRECT SRTP media'
                  : pairOutcome('srflx') === 'fail'
                    ? 'srflx pair FAILS — symmetric port mismatch'
                    : 'srflx pair — hole punching'}
              </text>
            </>
          )}

          {/* TURN relay edges */}
          {current.checking === 'relay' && (
            <>
              <line
                className={[
                  'wrtc-link is-relay',
                  (edgeActive('turn-alloc-a') || edgeActive('relay-media')) ? 'is-active' : '',
                  relayChosen ? 'is-warn' : '',
                  current.mediaFlowing && relayChosen ? 'is-media' : '',
                ].join(' ')}
                x1={e.turnA.x1} y1={e.turnA.y1} x2={e.turnA.x2} y2={e.turnA.y2}
                markerEnd={`url(#${uid}-arrow-warn)`}
              />
              <line
                className={[
                  'wrtc-link is-relay',
                  (edgeActive('turn-alloc-b') || edgeActive('relay-media')) ? 'is-active' : '',
                  relayChosen ? 'is-warn' : '',
                  current.mediaFlowing && relayChosen ? 'is-media' : '',
                ].join(' ')}
                x1={e.turnB.x1} y1={e.turnB.y1} x2={e.turnB.x2} y2={e.turnB.y2}
                markerEnd={`url(#${uid}-arrow-warn)`}
              />
              <text className="wrtc-edge-tag is-warn" x={W / 2} y={H - 8} textAnchor="middle">
                {current.mediaFlowing
                  ? `A to TURN ${ADDR.turn} to B — RELAYED media (bandwidth billed)`
                  : `TURN Allocate — granting relay address ${ADDR.turn}`}
              </text>
            </>
          )}

          {/* nodes on top */}
          {renderNode('stun', !showStunEdges && current.checking !== 'host')}
          {renderNode('peerA', false)}
          {renderNode('peerB', false)}
          {renderNode('natA', false)}
          {renderNode('natB', false)}
          {renderNode('turn', current.checking !== 'relay')}
        </svg>
      </div>

      {/* candidate-pair ladder + relay indicator */}
      <div className="wrtc-pairs">
        {[
          { kind: 'host', name: 'host ↔ host', hint: 'LAN IP', prio: '1' },
          { kind: 'srflx', name: 'srflx ↔ srflx', hint: 'via STUN', prio: '2' },
          { kind: 'relay', name: 'relay ↔ relay', hint: 'via TURN', prio: '3' },
        ].map((p) => {
          const sel = current.selectedPair === p.kind;
          const res = pairOutcome(p.kind);
          let state = 'idle';
          if (sel) state = 'win';
          else if (res === 'fail' || (p.kind === 'host' && current.checking && current.checking !== 'host')) state = 'fail';
          else if (current.checking === p.kind) state = 'active';
          return (
            <div key={p.kind} className={`wrtc-pair is-${state}`}>
              <span className="wrtc-pair-name">{p.name}</span>
              <span className="wrtc-pair-hint">{p.hint}</span>
              <span className="wrtc-pair-state">
                {state === 'win' ? 'WINNER'
                  : state === 'fail' ? 'failed'
                    : state === 'active' ? 'checking…'
                      : `priority ${p.prio}`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="wrtc-metrics">
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">Peer A NAT</span>
          <span className={`wrtc-metric-value ${isSym(natA) ? 'is-warn' : ''}`}>{natA}</span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">Peer B NAT</span>
          <span className={`wrtc-metric-value ${isSym(natB) ? 'is-warn' : ''}`}>{natB}</span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">A srflx addr</span>
          <span className="wrtc-metric-value is-sky">{current.srflxA || '—'}</span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">B srflx addr</span>
          <span className="wrtc-metric-value is-sky">{current.srflxB || '—'}</span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">selected pair</span>
          <span className="wrtc-metric-value">{current.selectedPair || '—'}</span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">path</span>
          <span className={`wrtc-metric-value ${current.path === 'direct' ? 'is-ok' : current.path === 'relayed' ? 'is-warn' : ''}`}>
            {current.path || '—'}
          </span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">relay used</span>
          <span className={`wrtc-metric-value ${current.relayUsed ? 'is-warn' : 'is-ok'}`}>
            {current.path ? (current.relayUsed ? 'yes' : 'no') : '—'}
          </span>
        </div>
        <div className="wrtc-metric">
          <span className="wrtc-metric-label">TURN cost</span>
          <span className={`wrtc-metric-value ${current.relayUsed ? 'is-warn' : ''}`}>
            {current.relayUsed ? 'billed/min' : 'free'}
          </span>
        </div>
      </div>

      {current.relayUsed && (
        <div className="wrtc-cost">
          <ShieldQuestion size={15} className="wrtc-cost-icon" />
          <span>
            A symmetric NAT changes its external port per destination, so the STUN-learned address
            never matches the path to the peer — hole punching fails and TURN becomes mandatory.
            Every relayed minute is media the TURN operator pays bandwidth for.
          </span>
        </div>
      )}

      <div className="wrtc-narration">
        <span className="wrtc-narration-label">trace</span>
        <span className="wrtc-narration-body">{current.note}</span>
      </div>
    </div>
  );
}
