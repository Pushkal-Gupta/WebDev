import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Vote, Play, Pause, StepForward, RotateCcw } from 'lucide-react';
import './DistRaftElectionViz.css';

// Raft leader election on a 5-node cluster. Leader crashes; a follower times out,
// becomes a candidate (term++), requests votes, wins a majority, and takes over.
// Deterministic step script — no randomness.
// roles: L=leader, F=follower, C=candidate, X=dead. votes: nodes that voted this round.
const STEPS = [
  { roles: ['L', 'F', 'F', 'F', 'F'], term: 1, votes: [], edges: 'heartbeat', from: 0, note: 'Node 0 is the leader for term 1. It sends periodic heartbeats (AppendEntries) so followers stay followers.' },
  { roles: ['X', 'F', 'F', 'F', 'F'], term: 1, votes: [], edges: 'none', from: null, note: 'The leader crashes. Heartbeats stop. Followers start their randomized election timers.' },
  { roles: ['X', 'C', 'F', 'F', 'F'], term: 2, votes: [1], edges: 'none', from: 1, note: 'Node 1 times out first. It becomes a CANDIDATE, increments the term to 2, and votes for itself.' },
  { roles: ['X', 'C', 'F', 'F', 'F'], term: 2, votes: [1], edges: 'request', from: 1, note: 'The candidate sends RequestVote RPCs to every other node, carrying term 2.' },
  { roles: ['X', 'C', 'F', 'F', 'F'], term: 2, votes: [1, 2, 3, 4], edges: 'grant', from: 1, note: 'Nodes 2, 3, 4 have not voted this term, so they grant their vote to node 1.' },
  { roles: ['X', 'L', 'F', 'F', 'F'], term: 2, votes: [], edges: 'none', from: 1, note: 'Node 1 has 4 of 5 votes — a majority (≥3). It becomes LEADER for term 2.' },
  { roles: ['X', 'L', 'F', 'F', 'F'], term: 2, votes: [], edges: 'heartbeat', from: 1, note: 'The new leader sends heartbeats. The cluster is stable again under term 2 — one leader, no split vote.' },
];
const BASE_MS = 1400;
// 5 nodes around a circle in a 200x200 viewBox.
const POS = [0, 1, 2, 3, 4].map((i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return { x: 100 + Math.cos(a) * 68, y: 100 + Math.sin(a) * 68 };
});

export default function DistRaftElectionViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);
  const s = STEPS[step];
  const last = step >= STEPS.length - 1;
  const advance = useCallback(() => setStep((i) => Math.min(STEPS.length - 1, i + 1)), []);

  useEffect(() => {
    if (!playing) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) { setPlaying(false); return undefined; }
    timer.current = setTimeout(advance, Math.round(BASE_MS / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, speed, last, advance]);

  const reset = () => { setPlaying(false); setStep(0); };

  return (
    <div className="drf">
      <div className="drf-head">
        <span className="drf-head-icon"><Vote size={18} /></span>
        <div className="drf-head-text">
          <h4 className="drf-title">Raft leader election</h4>
          <p className="drf-sub">Leader crashes → follower times out → candidate wins a majority → new leader.</p>
        </div>
        <button className="drf-reset" onClick={reset}><RotateCcw size={13} /> Reset</button>
      </div>

      <div className="drf-stage">
        <svg className="drf-svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Raft cluster election">
          {s.from != null && s.edges !== 'none' && POS.map((p, i) => {
            if (i === s.from) return null;
            const src = POS[s.from];
            const granting = s.edges === 'grant' && s.votes.includes(i);
            const cls = `drf-edge is-${s.edges}${granting ? ' is-granting' : ''}`;
            // grant arrows point back to the candidate
            const [x1, y1, x2, y2] = s.edges === 'grant' ? [p.x, p.y, src.x, src.y] : [src.x, src.y, p.x, p.y];
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={cls} />;
          })}
          {POS.map((p, i) => {
            const role = s.roles[i];
            const voted = s.votes.includes(i);
            return (
              <g key={i} className={`drf-node is-${role.toLowerCase()}${voted ? ' is-voted' : ''}`}>
                <circle cx={p.x} cy={p.y} r="20" className="drf-node-circle" />
                <text x={p.x} y={p.y - 1} className="drf-node-id">N{i}</text>
                <text x={p.x} y={p.y + 9} className="drf-node-role">{role}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="drf-controls">
        <button className="drf-btn" onClick={() => setPlaying((p) => !p)} disabled={last}>
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? 'Pause' : 'Play'}
        </button>
        <button className="drf-btn" onClick={advance} disabled={playing || last}><StepForward size={13} /> Step</button>
        <span className="drf-speed">Speed
          <input className="drf-speed-range" type="range" min="0.5" max="4" step="0.5" value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} aria-label="speed" />
          <span className="drf-speed-value">{speed}x</span>
        </span>
        <span className="drf-term">term {s.term}</span>
        <span className="drf-progress">{step + 1} / {STEPS.length}</span>
      </div>

      <div className="drf-note">
        <span className="drf-note-label">Step</span>
        <span className="drf-note-body">{s.note}</span>
      </div>
    </div>
  );
}
