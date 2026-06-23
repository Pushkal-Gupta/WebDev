import React, { useState } from 'react';
import { Globe, Network, Zap, AlertTriangle, RotateCcw } from 'lucide-react';
import './IpDomainRoutingViz.css';

// Two users, three PoPs. Each user's nearest PoP under each strategy.
const USERS = [
  { id: 'tokyo', label: 'Tokyo user', x: 120, y: 90, nearest: 'tk', latency: 10 },
  { id: 'berlin', label: 'Berlin user', x: 120, y: 230, nearest: 'fr', latency: 5 },
];
const POPS = [
  { id: 'tk', label: 'Tokyo PoP', ip: '1.1.1.1', dnsIp: '35.1.2.3', x: 600, y: 70 },
  { id: 'fr', label: 'Frankfurt PoP', ip: '1.1.1.1', dnsIp: '18.4.5.6', x: 600, y: 200 },
  { id: 'hk', label: 'Hong Kong PoP', ip: '1.1.1.1', dnsIp: '52.7.8.9', x: 600, y: 320 },
];

export default function IpDomainRoutingViz() {
  const [mode, setMode] = useState('anycast'); // 'anycast' | 'dns'
  const [fault, setFault] = useState(false); // anycast: BGP reconverge; dns: region failure

  // Compute routing target per user given mode + fault.
  function targetFor(user) {
    if (mode === 'anycast') {
      // fault: Tokyo's BGP reconverges to Hong Kong mid-flow.
      if (fault && user.id === 'tokyo') return 'hk';
      return user.nearest;
    }
    // dns: pinned by TTL. fault: Frankfurt region down but Berlin's resolver still cached fr.
    return user.nearest;
  }

  const reset = () => { setFault(false); };

  const W = 760;
  const H = 380;
  const popById = Object.fromEntries(POPS.map((p) => [p.id, p]));

  return (
    <div className="idr">
      <div className="idr-head">
        <h3 className="idr-title">Anycast IP vs DNS routing — two ways to reach the nearest PoP</h3>
        <p className="idr-sub">
          Toggle the strategy and trigger each one&rsquo;s failure mode. Anycast lets the network pick (and can flip
          mid-connection); DNS pins the client for a TTL (and keeps hitting a dead region until it expires).
        </p>
      </div>

      <div className="idr-controls">
        <div className="idr-toggle">
          <button type="button" className={`idr-tog ${mode === 'anycast' ? 'idr-tog-on' : ''}`} onClick={() => { setMode('anycast'); setFault(false); }}>
            <Network size={14} /> Anycast IP
          </button>
          <button type="button" className={`idr-tog ${mode === 'dns' ? 'idr-tog-on' : ''}`} onClick={() => { setMode('dns'); setFault(false); }}>
            <Globe size={14} /> DNS / GSLB
          </button>
        </div>
        <button type="button" className={`idr-fault ${fault ? 'idr-fault-on' : ''}`} onClick={() => setFault((f) => !f)}>
          <AlertTriangle size={14} />
          {mode === 'anycast' ? 'BGP reconverge' : 'Region failure'}
        </button>
        <button type="button" className="idr-btn" onClick={reset}><RotateCcw size={14} /> Reset</button>
      </div>

      <div className="idr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="idr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="idr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)" />
            </marker>
            <marker id="idr-arrow-bad" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill="var(--hard)" />
            </marker>
          </defs>
          <rect x={10} y={10} width={W - 20} height={H - 20} fill="var(--surface)" stroke="var(--border)" rx={8} />

          {/* routing lines */}
          {USERS.map((u) => {
            const tgt = targetFor(u);
            const p = popById[tgt];
            const dnsDead = mode === 'dns' && fault && u.id === 'berlin' && tgt === 'fr';
            const flipped = mode === 'anycast' && fault && u.id === 'tokyo';
            const bad = dnsDead || flipped;
            return (
              <g key={u.id}>
                <line x1={u.x + 30} y1={u.y} x2={p.x - 34} y2={p.y}
                  stroke={bad ? 'var(--hard)' : 'var(--accent)'} strokeWidth={2.4}
                  strokeDasharray={bad ? '6 4' : '0'} markerEnd={`url(#${bad ? 'idr-arrow-bad' : 'idr-arrow'})`} />
                <text x={(u.x + p.x) / 2} y={(u.y + p.y) / 2 - 8} className={`idr-edge-label ${bad ? 'idr-edge-bad' : ''}`}>
                  {mode === 'anycast' ? `${p.ip}` : `${p.dnsIp}`}{!bad ? ` · ${u.latency}ms` : ''}
                </text>
              </g>
            );
          })}

          {/* users */}
          {USERS.map((u) => (
            <g key={u.id}>
              <rect x={u.x - 30} y={u.y - 22} width={60} height={44} rx={8} fill="var(--bg)" stroke="var(--hue-sky)" strokeWidth={2} />
              <text x={u.x} y={u.y + 5} className="idr-user-label">{u.id === 'tokyo' ? 'TYO' : 'BER'}</text>
              <text x={u.x} y={u.y - 30} className="idr-user-sub">{u.label}</text>
            </g>
          ))}

          {/* pops */}
          {POPS.map((p) => {
            const dnsRegionDead = mode === 'dns' && fault && p.id === 'fr';
            return (
              <g key={p.id}>
                <rect x={p.x - 34} y={p.y - 24} width={120} height={48} rx={8}
                  fill={dnsRegionDead ? 'rgba(var(--accent-rgb),0.04)' : 'var(--bg)'}
                  stroke={dnsRegionDead ? 'var(--hard)' : 'var(--border)'} strokeWidth={2} strokeDasharray={dnsRegionDead ? '5 3' : '0'} />
                <text x={p.x + 26} y={p.y - 4} className="idr-pop-label">{p.label}</text>
                <text x={p.x + 26} y={p.y + 13} className="idr-pop-ip">{mode === 'anycast' ? p.ip : p.dnsIp}</text>
                {dnsRegionDead && <Zap x={p.x - 28} y={p.y - 8} size={16} className="idr-dead-icon" />}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="idr-cards">
        <div className="idr-card">
          <span className="idr-card-tag">how it routes</span>
          <p className="idr-card-text">
            {mode === 'anycast'
              ? 'Same IP (1.1.1.1) announced from every PoP via BGP. The network delivers each packet to the fewest-hops PoP. Stateless protocols (DNS, QUIC) love it.'
              : 'One hostname resolves to a different unicast IP per region (EDNS-Client-Subnet). The client then connects directly to that region for the record TTL.'}
          </p>
        </div>
        <div className="idr-card idr-card-risk">
          <span className="idr-card-tag">failure mode</span>
          <p className="idr-card-text">
            {mode === 'anycast'
              ? (fault ? 'BGP reconverged mid-flow: Tokyo’s packets now land in Hong Kong. The new PoP has no TCP session state -> connection reset.' : 'Trigger a BGP reconverge: anycast can flip the destination mid-connection, which is catastrophic for stateful TCP.')
              : (fault ? 'Frankfurt is down, but Berlin’s resolver cached its IP. Clients keep dialing the dead region until the TTL (e.g. 60s) expires -> slow failover.' : 'Trigger a region failure: DNS pins clients by TTL, so they keep hitting the failed region until the cached record expires.')}
          </p>
        </div>
      </div>

      <div className="idr-takeaway">
        <span className="idr-takeaway-label">when to pick which</span>
        <span className="idr-takeaway-text">
          Anycast for stateless + DDoS absorption (DNS, NTP, QUIC, CDN edges). DNS/GSLB for stateful TCP, region-pinned data, and weighted traffic shifts. Large platforms layer both: DNS to a regional anycast prefix, anycast to an edge within it.
        </span>
      </div>
    </div>
  );
}
