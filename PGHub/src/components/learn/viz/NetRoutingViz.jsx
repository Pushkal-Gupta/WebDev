import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Waypoints, Play, Pause, SkipForward, RotateCcw, Hash, Timer, Flag } from 'lucide-react';
import './NetRoutingViz.css';

// Fixed, deterministic topology. No Math.random anywhere.
const NODES = {
  SRC: { x: 46, y: 180, label: 'host', tag: '192.168.10.37' },
  R1: { x: 158, y: 180, label: 'R1', tag: 'gateway' },
  R2: { x: 312, y: 88, label: 'R2', tag: 'eth1' },
  R3: { x: 312, y: 272, label: 'R3', tag: 'eth2' },
  R4: { x: 478, y: 88, label: 'R4', tag: 'eth1' },
  R5: { x: 478, y: 272, label: 'R5', tag: 'eth2' },
  R6: { x: 644, y: 180, label: 'R6', tag: 'border' },
};

const EDGES = [
  ['SRC', 'R1'], ['R1', 'R2'], ['R1', 'R3'], ['R2', 'R4'],
  ['R3', 'R5'], ['R4', 'R6'], ['R5', 'R6'], ['R2', 'R3'], ['R4', 'R5'],
];

// Each destination: a precomputed node path + per-node forwarding decision.
const DESTS = [
  {
    id: 'A',
    dst: '10.2.7.99',
    desc: 'specific subnet 10.2.7.0/24',
    path: ['SRC', 'R1', 'R2', 'R4', 'R6'],
    hops: [
      { match: 'not local', via: 'default gateway R1' },
      { match: '10.0.0.0/8', via: 'R2' },
      { match: '10.2.0.0/16', via: 'R4' },
      { match: '10.2.7.0/24', via: 'R6' },
      { match: 'local 10.2.7.0/24', via: 'delivered' },
    ],
  },
  {
    id: 'B',
    dst: '172.16.9.5',
    desc: 'aggregated prefix 172.16.0.0/16',
    path: ['SRC', 'R1', 'R3', 'R5', 'R6'],
    hops: [
      { match: 'not local', via: 'default gateway R1' },
      { match: '172.16.0.0/16', via: 'R3' },
      { match: '172.16.0.0/16', via: 'R5' },
      { match: '172.16.8.0/22', via: 'R6' },
      { match: 'local 172.16.8.0/22', via: 'delivered' },
    ],
  },
  {
    id: 'C',
    dst: '8.8.8.8',
    desc: 'no specific route, default 0.0.0.0/0',
    path: ['SRC', 'R1', 'R2', 'R4', 'R5', 'R6'],
    hops: [
      { match: 'not local', via: 'default gateway R1' },
      { match: '0.0.0.0/0', via: 'R2' },
      { match: '0.0.0.0/0', via: 'R4' },
      { match: '0.0.0.0/0', via: 'R5' },
      { match: 'border 0.0.0.0/0', via: 'Internet' },
      { match: 'forwarded to WAN', via: 'left network' },
    ],
  },
];

const W = 700;
const H = 360;
const START_TTL = 64;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function NetRoutingViz() {
  const [destId, setDestId] = useState('A');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const dest = useMemo(() => DESTS.find((d) => d.id === destId), [destId]);
  const total = dest.path.length - 1; // number of edges to traverse
  const reachedAll = step >= total;

  function pickDest(id) { setDestId(id); setStep(0); setPlaying(false); }
  function reset() { setStep(0); setPlaying(false); }
  function togglePlay() {
    if (reachedAll) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(() => setStep((s) => Math.min(total, s + 1)), reduced() ? 380 : 820);
    return () => clearTimeout(timer.current);
  }, [playing, step, total]);

  const curKey = dest.path[step];
  const cur = NODES[curKey];
  const decision = dest.hops[step];
  const ttl = START_TTL - step;
  const hopCount = step;

  // edges that belong to the current path, split into traversed vs pending.
  const pathEdgeSet = useMemo(() => {
    const m = new Map();
    for (let i = 0; i < dest.path.length - 1; i += 1) {
      m.set(`${dest.path[i]}-${dest.path[i + 1]}`, i);
      m.set(`${dest.path[i + 1]}-${dest.path[i]}`, i);
    }
    return m;
  }, [dest]);

  return (
    <div className="netrt">
      <div className="netrt-head">
        <div className="netrt-head-icon"><Waypoints size={18} /></div>
        <div className="netrt-head-text">
          <h3 className="netrt-title">Forwarding a packet, hop by hop</h3>
          <p className="netrt-sub">
            Pick a destination and watch the packet cross the network &mdash; each router runs
            longest-prefix match against its table, decrements the TTL, and forwards to the next hop.
          </p>
        </div>
        <button type="button" className="netrt-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="netrt-chips">
        {DESTS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`netrt-chip${d.id === destId ? ' is-active' : ''}`}
            onClick={() => pickDest(d.id)}
          >
            dest {d.dst}
          </button>
        ))}
      </div>

      <div className="netrt-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="netrt-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="netrt-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" className="netrt-pulse-in" />
              <stop offset="100%" className="netrt-pulse-out" />
            </radialGradient>
          </defs>

          {EDGES.map(([a, b]) => {
            const key = `${a}-${b}`;
            const idx = pathEdgeSet.has(key) ? pathEdgeSet.get(key) : -1;
            const onPath = idx >= 0;
            const done = onPath && idx < step;
            const next = onPath && idx === step;
            const cls = 'netrt-edge'
              + (onPath ? ' is-path' : '')
              + (done ? ' is-done' : '')
              + (next ? ' is-next' : '');
            return (
              <line
                key={key}
                x1={NODES[a].x} y1={NODES[a].y}
                x2={NODES[b].x} y2={NODES[b].y}
                className={cls}
              />
            );
          })}

          {Object.entries(NODES).map(([key, n]) => {
            const isCur = key === curKey;
            const isHost = key === 'SRC';
            const visited = dest.path.indexOf(key) >= 0 && dest.path.indexOf(key) <= step;
            const cls = `netrt-node${isHost ? ' is-host' : ''}`
              + (isCur ? ' is-cur' : '')
              + (visited ? ' is-visited' : '');
            return (
              <g key={key} className={cls}>
                <rect
                  x={n.x - 26} y={n.y - 18} width={52} height={36} rx={isHost ? 7 : 10}
                  className="netrt-node-box"
                />
                <text x={n.x} y={n.y - 1} className="netrt-node-label" textAnchor="middle">{n.label}</text>
                <text x={n.x} y={n.y + 11} className="netrt-node-tag" textAnchor="middle">{n.tag}</text>
              </g>
            );
          })}

          {/* the packet */}
          <g className="netrt-packet" style={{ transform: `translate(${cur.x}px, ${cur.y}px)` }}>
            <circle r={16} fill="url(#netrt-pulse)" className="netrt-packet-halo" />
            <circle r={7} className="netrt-packet-dot" />
          </g>
        </svg>
      </div>

      <div className="netrt-controls">
        <button type="button" className="netrt-btn" onClick={togglePlay}>
          {playing && !reachedAll ? <Pause size={14} /> : <Play size={14} />}
          {playing && !reachedAll ? 'Pause' : (reachedAll ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="netrt-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={reachedAll}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="netrt-progress">hop {step} / {total}</span>
      </div>

      <div className="netrt-readout">
        <div className="netrt-stat is-hop">
          <Hash size={13} />
          <span className="netrt-stat-label">hop count</span>
          <span className="netrt-stat-val">{hopCount}</span>
        </div>
        <div className="netrt-stat is-ttl">
          <Timer size={13} />
          <span className="netrt-stat-label">TTL</span>
          <span className="netrt-stat-val">{ttl}</span>
        </div>
        <div className="netrt-stat is-reach">
          <Flag size={13} />
          <span className="netrt-stat-label">reached</span>
          <span className="netrt-stat-val">{reachedAll ? 'yes' : 'no'}</span>
        </div>
      </div>

      <div className="netrt-decision">
        <span className="netrt-decision-label">at {cur.label}</span>
        <span className="netrt-decision-body">
          dest {dest.dst} &rarr; match <b>{decision.match}</b> &rarr; next hop <b>{decision.via}</b>
          <span className="netrt-decision-note"> ({dest.desc})</span>
        </span>
      </div>
    </div>
  );
}
