import React, { useState, useMemo } from 'react';
import { Database, RotateCcw } from 'lucide-react';
import './DistQuorumViz.css';

// Quorum reads/writes on N replicas. A write goes to the first W nodes, a read
// contacts the last R nodes. When W + R > N the two sets must overlap, so a read
// always sees at least one node with the latest write. Fully interactive (sliders).
const N_MAX = 7;

export default function DistQuorumViz() {
  const [n, setN] = useState(5);
  const [w, setW] = useState(3);
  const [r, setR] = useState(3);

  // Clamp W/R to N.
  const W = Math.min(w, n);
  const R = Math.min(r, n);

  const nodes = useMemo(() => {
    const written = new Set();
    for (let i = 0; i < W; i += 1) written.add(i);       // write hits nodes 0..W-1
    const read = new Set();
    for (let i = 0; i < R; i += 1) read.add(n - 1 - i);   // read hits the last R nodes
    return Array.from({ length: n }, (_, i) => ({
      i, written: written.has(i), read: read.has(i), overlap: written.has(i) && read.has(i),
    }));
  }, [n, W, R]);

  const overlapCount = nodes.filter((x) => x.overlap).length;
  const strong = W + R > n;

  const R_ = 20; const GAP = 300 / (n + 1);

  return (
    <div className="dqv">
      <div className="dqv-head">
        <span className="dqv-head-icon"><Database size={18} /></span>
        <div className="dqv-head-text">
          <h4 className="dqv-title">Quorum reads &amp; writes (W + R &gt; N)</h4>
          <p className="dqv-sub">A write hits W replicas, a read hits R. Overlap guarantees the read sees the latest write.</p>
        </div>
        <button className="dqv-reset" onClick={() => { setN(5); setW(3); setR(3); }}><RotateCcw size={13} /> Reset</button>
      </div>

      <div className="dqv-stage">
        <svg className="dqv-svg" viewBox="0 0 300 96" preserveAspectRatio="xMidYMid meet" role="img" aria-label="quorum replicas">
          {nodes.map((nd) => {
            const cx = GAP * (nd.i + 1);
            const cls = `dqv-node${nd.overlap ? ' is-overlap' : nd.written ? ' is-written' : nd.read ? ' is-read' : ''}`;
            return (
              <g key={nd.i} className={cls}>
                <circle cx={cx} cy={44} r={R_} className="dqv-node-circle" />
                <text x={cx} y={49} className="dqv-node-text">R{nd.i}</text>
                {nd.written && <text x={cx} y={16} className="dqv-tag dqv-tag-w">W</text>}
                {nd.read && <text x={cx} y={86} className="dqv-tag dqv-tag-r">R</text>}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="dqv-sliders">
        <label className="dqv-slider">N (replicas) <input type="range" min="3" max={N_MAX} value={n}
          onChange={(e) => setN(Number(e.target.value))} /> <b>{n}</b></label>
        <label className="dqv-slider">W (write quorum) <input type="range" min="1" max={n} value={W}
          onChange={(e) => setW(Number(e.target.value))} /> <b>{W}</b></label>
        <label className="dqv-slider">R (read quorum) <input type="range" min="1" max={n} value={R}
          onChange={(e) => setR(Number(e.target.value))} /> <b>{R}</b></label>
      </div>

      <div className={`dqv-verdict${strong ? ' is-strong' : ' is-weak'}`}>
        <div className="dqv-verdict-eq">W + R = {W} + {R} = {W + R} {strong ? '>' : '≤'} N = {n}</div>
        <div className="dqv-verdict-msg">
          {strong
            ? `${overlapCount} overlapping node${overlapCount === 1 ? '' : 's'} — every read is guaranteed to touch the latest write. Strong (read-your-writes) consistency.`
            : 'No guaranteed overlap — a read can hit only stale replicas and miss the newest write. Reads may be stale.'}
        </div>
      </div>
    </div>
  );
}
