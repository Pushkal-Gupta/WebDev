import React, { useEffect, useRef, useState } from 'react';
import { GitCommit, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './GitCommitDagViz.css';

// Deterministic commit DAG builder. No randomness anywhere: short SHAs come from
// a fixed table so the sequence is identical on every run.
const SHAS = ['a1b2c3d', 'e4f5061', '9f8e7d6', '3c2b1a0', '7788aa9', 'bb44cc5'];
const MSGS = [
  'init: project scaffold',
  'feat: parse input',
  'feat: core algorithm',
  'test: edge cases',
  'fix: off-by-one',
  'docs: usage notes',
];

// Column layout of the commit chain (single main line, flowing left to right in
// commit order; arrows point BACKWARD from child to parent).
const X0 = 70;
const DX = 128;
const Y = 118;
const R = 26;

const W = 760;
const H = 260;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GitCommitDagViz() {
  const [count, setCount] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = SHAS.length;
  const headIndex = count - 1;

  function togglePlay() {
    if (count >= total) { setCount(1); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || count >= total) return undefined;
    timer.current = setTimeout(
      () => setCount((c) => Math.min(total, c + 1)),
      Math.round((reduced() ? 480 : 1100) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, count, total, speed]);

  const commits = SHAS.slice(0, count).map((sha, i) => ({
    sha,
    msg: MSGS[i],
    x: X0 + i * DX,
    y: Y,
    isHead: i === headIndex,
  }));

  return (
    <div className="gcd">
      <div className="gcd-head">
        <div className="gcd-head-icon"><GitCommit size={18} /></div>
        <div className="gcd-head-text">
          <h3 className="gcd-title">The commit DAG</h3>
          <p className="gcd-sub">
            Each commit is an immutable snapshot named by a short SHA, linked to its parent.
            Step to add a commit &mdash; the branch pointer and HEAD slide forward to the new tip.
          </p>
        </div>
        <button type="button" className="gcd-reset" onClick={() => { setCount(1); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gcd-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gcd-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gcd-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gcd-arrow-head" />
            </marker>
          </defs>

          {/* parent edges: child -> parent (arrow points backward) */}
          {commits.map((c, i) => {
            if (i === 0) return null;
            const prev = commits[i - 1];
            return (
              <line
                key={`edge-${c.sha}`}
                x1={c.x - R} y1={c.y}
                x2={prev.x + R} y2={prev.y}
                className="gcd-edge"
                markerEnd="url(#gcd-arrow)"
              />
            );
          })}

          {/* commit nodes */}
          {commits.map((c, i) => (
            <g key={c.sha} className={`gcd-node${c.isHead ? ' is-head' : ''}${i === count - 1 ? ' is-new' : ''}`}>
              <circle cx={c.x} cy={c.y} r={R} className="gcd-node-circle" />
              <text x={c.x} y={c.y + 4} className="gcd-node-sha" textAnchor="middle">{c.sha.slice(0, 4)}</text>
              <text x={c.x} y={c.y + R + 20} className="gcd-node-msg" textAnchor="middle">{c.msg}</text>
            </g>
          ))}

          {/* branch pointer + HEAD label above the tip */}
          {commits.length > 0 && (
            <g className="gcd-ptr">
              <line
                x1={commits[headIndex].x} y1={Y - R - 8}
                x2={commits[headIndex].x} y2={Y - R - 40}
                className="gcd-ptr-line"
              />
              <g transform={`translate(${commits[headIndex].x}, ${Y - R - 58})`}>
                <rect x={-58} y={-16} width={116} height={32} rx={7} className="gcd-ptr-box" />
                <text x={0} y={-2} className="gcd-ptr-branch" textAnchor="middle">main</text>
                <text x={0} y={11} className="gcd-ptr-head" textAnchor="middle">HEAD -&gt; main</text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="gcd-controls">
        <button type="button" className="gcd-btn" onClick={togglePlay}>
          {playing && count < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && count < total ? 'Pause' : (count >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="gcd-btn"
          onClick={() => setCount((c) => Math.min(total, c + 1))}
          disabled={count >= total}
        >
          <SkipForward size={14} /> Commit
        </button>
        <label className="gcd-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="gcd-speed-range"
          />
          <span className="gcd-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="gcd-progress">{count} / {total} commits</span>
      </div>

      <div className="gcd-readout">
        <div className="gcd-stat is-head">
          <span className="gcd-stat-label">HEAD</span>
          <span className="gcd-stat-val">{commits[headIndex].sha.slice(0, 7)}</span>
        </div>
        <div className="gcd-stat is-branch">
          <span className="gcd-stat-label">branch main</span>
          <span className="gcd-stat-val">-&gt; {commits[headIndex].sha.slice(0, 7)}</span>
        </div>
        <div className="gcd-stat is-parent">
          <span className="gcd-stat-label">parent</span>
          <span className="gcd-stat-val">{headIndex > 0 ? commits[headIndex - 1].sha.slice(0, 7) : 'none (root)'}</span>
        </div>
      </div>

      <div className="gcd-note">
        <span className="gcd-note-label">now</span>
        <span className="gcd-note-body">
          Commit <em>{commits[headIndex].sha.slice(0, 7)}</em> snapshots the whole project and points back to
          {headIndex > 0 ? ` its parent ${commits[headIndex - 1].sha.slice(0, 7)}` : ' nothing (it is the root commit)'}.
          The <span className="gcd-note-hot">main</span> pointer and HEAD now sit on this new tip.
        </span>
      </div>
    </div>
  );
}
