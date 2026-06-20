import React, { useMemo, useState } from 'react';
import { GitMerge, GitBranch, RotateCcw } from 'lucide-react';
import './GitMergeRebaseViz.css';

// git merge vs git rebase — what each does to a diverged history.
//
// Setup: main and feature share a common ancestor C2, then diverge.
//   main:    C1 - C2 - C3 - C4
//   feature:           \  F1 - F2
//
// MERGE (git merge feature into main, or main into feature): keeps both lines
// of history intact and creates ONE new MERGE COMMIT M with TWO parents (C4 and
// F2). The graph gains a join node; commit hashes of F1/F2 are unchanged. True
// history is preserved — you can see exactly when the branches diverged and met.
//
// REBASE (git rebase main, on feature): REPLAYS feature's commits one by one on
// top of main's tip. F1/F2 are re-applied as brand-new commits F1'/F2' with new
// hashes (new parent => new content => new SHA). The result is a LINEAR history
// with no join node — but the original F1/F2 are abandoned (their hashes change).
//
// Toggle the mode and watch the graph reshape; the readout reports the resulting
// shape (DAG-with-join vs linear), commit count, and which hashes changed.

// Deterministic 4-hex ids for display.
function id4(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).slice(0, 4);
}

const BASE = [
  { key: 'C1', label: 'C1' },
  { key: 'C2', label: 'C2' },
  { key: 'C3', label: 'C3' },
  { key: 'C4', label: 'C4' },
];
const FEAT = [
  { key: 'F1', label: 'F1' },
  { key: 'F2', label: 'F2' },
];

export default function GitMergeRebaseViz() {
  const [mode, setMode] = useState('diverged'); // diverged | merge | rebase

  // Stable hashes: trunk + feature commits keyed by content+parent.
  const model = useMemo(() => {
    const hashes = {};
    // trunk hashes (parent chain)
    BASE.forEach((c, i) => { hashes[c.key] = id4(`${c.key}:${i === 0 ? 'root' : BASE[i - 1].key}`); });
    // feature branches off C2
    hashes.F1 = id4('F1:C2');
    hashes.F2 = id4(`F2:${hashes.F1}`);
    // merge commit: two parents C4 + F2
    const merge = id4(`M:${hashes.C4}:${hashes.F2}`);
    // rebase: replay F1,F2 onto C4 => new parents => new hashes
    const r1 = id4(`F1:${hashes.C4}`);
    const r2 = id4(`F2:${r1}`);
    return { hashes, merge, rebased: { F1: r1, F2: r2 } };
  }, []);

  const W = 940;
  const H = 360;
  const mainY = 140;
  const featY = 250;
  const x0 = 80;
  const gap = 110;

  // Node positions per mode.
  const layout = useMemo(() => {
    const nodes = [];
    const edges = [];
    // trunk C1..C4 always on main line
    BASE.forEach((c, i) => {
      nodes.push({ key: c.key, label: c.label, hash: model.hashes[c.key], x: x0 + i * gap, y: mainY, kind: 'main' });
      if (i > 0) edges.push({ from: BASE[i - 1].key, to: c.key, kind: 'main' });
    });

    if (mode === 'diverged' || mode === 'merge') {
      // feature branches off C2 onto lower lane
      const fX0 = x0 + 2 * gap + gap * 0.5;
      FEAT.forEach((f, i) => {
        nodes.push({ key: f.key, label: f.label, hash: model.hashes[f.key], x: fX0 + i * gap, y: featY, kind: 'feat' });
        edges.push({ from: i === 0 ? 'C2' : FEAT[i - 1].key, to: f.key, kind: 'feat' });
      });
      if (mode === 'merge') {
        const mx = x0 + 4 * gap;
        nodes.push({ key: 'M', label: 'M', hash: model.merge, x: mx, y: mainY, kind: 'merge' });
        edges.push({ from: 'C4', to: 'M', kind: 'main' });
        edges.push({ from: 'F2', to: 'M', kind: 'merge-join' });
      }
    } else {
      // rebase: F1',F2' replayed onto C4, all on main line, linear
      [model.rebased.F1, model.rebased.F2].forEach((h, i) => {
        const k = i === 0 ? "F1'" : "F2'";
        nodes.push({ key: k, label: k, hash: h, x: x0 + (4 + i) * gap, y: mainY, kind: 'rebased' });
        edges.push({ from: i === 0 ? 'C4' : "F1'", to: k, kind: 'rebased' });
      });
      // ghost of original F1/F2 (abandoned)
      const fX0 = x0 + 2 * gap + gap * 0.5;
      FEAT.forEach((f, i) => {
        nodes.push({ key: `ghost-${f.key}`, label: f.label, hash: model.hashes[f.key], x: fX0 + i * gap, y: featY + 25, kind: 'ghost' });
      });
    }
    return { nodes, edges };
  }, [mode, model]);

  const nodeAt = (key) => layout.nodes.find((n) => n.key === key);

  const stats = useMemo(() => {
    if (mode === 'diverged') {
      return { shape: 'two diverged tips', count: 6, joins: 0, changed: 'none yet' };
    }
    if (mode === 'merge') {
      return { shape: 'DAG with one join (merge commit)', count: 7, joins: 1, changed: 'none — F1/F2 hashes preserved' };
    }
    return { shape: 'linear (no join)', count: 6, joins: 0, changed: `F1->F1' (${model.hashes.F1}->${model.rebased.F1}), F2->F2' (${model.hashes.F2}->${model.rebased.F2})` };
  }, [mode, model]);

  return (
    <div className="gmr">
      <div className="gmr-head">
        <h3 className="gmr-title">Merge vs rebase — two ways to reconcile diverged branches</h3>
        <p className="gmr-sub">
          Main and feature split at C2. Merge keeps both histories and adds a join commit; rebase replays
          feature's commits onto main's tip as new hashes for a linear history.
        </p>
      </div>

      <div className="gmr-controls">
        <div className="gmr-modes" role="group" aria-label="reconcile mode">
          <span className="gmr-input-label">history</span>
          <button type="button" className={`gmr-chip ${mode === 'diverged' ? 'is-on' : ''}`} onClick={() => setMode('diverged')}>
            <GitBranch size={13} /> diverged
          </button>
          <button type="button" className={`gmr-chip ${mode === 'merge' ? 'is-on' : ''}`} onClick={() => setMode('merge')}>
            <GitMerge size={13} /> merge
          </button>
          <button type="button" className={`gmr-chip ${mode === 'rebase' ? 'is-on' : ''}`} onClick={() => setMode('rebase')}>
            <GitBranch size={13} /> rebase
          </button>
        </div>
        <span className="gmr-spacer" aria-hidden="true" />
        <button type="button" className="gmr-btn" onClick={() => setMode('diverged')} disabled={mode === 'diverged'}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gmr-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gmr-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gmr-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L8,3 L0,6 Z" fill="var(--text-dim)" />
            </marker>
          </defs>

          {/* lane labels */}
          <text x={28} y={mainY + 4} className="gmr-lane-label">main</text>
          {(mode === 'diverged' || mode === 'merge') && (
            <text x={28} y={featY + 4} className="gmr-lane-label">feature</text>
          )}
          {mode === 'rebase' && (
            <text x={28} y={featY + 29} className="gmr-lane-label is-ghost">abandoned</text>
          )}

          {/* edges (child points back to parent) */}
          {layout.edges.map((e, i) => {
            const a = nodeAt(e.from);
            const b = nodeAt(e.to);
            if (!a || !b) return null;
            return (
              <line
                key={`e-${i}`}
                x1={b.x - 17}
                y1={b.y}
                x2={a.x + 17}
                y2={a.y}
                className={`gmr-edge gmr-edge-${e.kind}`}
                markerEnd="url(#gmr-arrow)"
              />
            );
          })}

          {/* nodes */}
          {layout.nodes.map((n) => (
            <g key={n.key} className={`gmr-node gmr-node-${n.kind}`}>
              <circle cx={n.x} cy={n.y} r={17} className="gmr-node-dot" />
              <text x={n.x} y={n.y + 4} className="gmr-node-label">{n.label}</text>
              <text x={n.x} y={n.y - 26} className="gmr-node-hash" textAnchor="middle">{n.hash}</text>
            </g>
          ))}

          {/* HEAD tag */}
          {(() => {
            const headKey = mode === 'merge' ? 'M' : mode === 'rebase' ? "F2'" : 'C4';
            const hn = nodeAt(headKey);
            if (!hn) return null;
            return (
              <g className="gmr-headtag">
                <rect x={hn.x - 22} y={hn.y + 24} width={44} height={18} rx={5} className="gmr-headtag-box" />
                <text x={hn.x} y={hn.y + 37} className="gmr-headtag-text" textAnchor="middle">HEAD</text>
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="gmr-metrics">
        <div className="gmr-metric">
          <span className="gmr-metric-label">history shape</span>
          <span className="gmr-metric-value">{stats.shape}</span>
        </div>
        <div className="gmr-metric">
          <span className="gmr-metric-label">commits</span>
          <span className="gmr-metric-value">{stats.count}</span>
        </div>
        <div className="gmr-metric">
          <span className="gmr-metric-label">merge joins</span>
          <span className="gmr-metric-value">{stats.joins}</span>
        </div>
        <div className="gmr-metric gmr-metric-dim">
          <span className="gmr-metric-label">hashes changed</span>
          <span className="gmr-metric-value gmr-metric-dimval">{stats.changed}</span>
        </div>
      </div>

      <div className="gmr-caption">
        <span className="gmr-caption-label">trace</span>
        <span className="gmr-caption-body">
          {mode === 'diverged' && (
            <>Both branches share ancestor <strong>C2</strong>. main advanced to <strong>C4</strong> while feature added{' '}
            <strong>F1</strong>, <strong>F2</strong>. Two tips, no shared resolution yet — pick merge or rebase.</>
          )}
          {mode === 'merge' && (
            <><strong>git merge</strong> creates one new merge commit <strong>M ({model.merge})</strong> with TWO parents
            (C4 and F2). Both histories stay intact — you can still see the split at C2 and the join at M. F1/F2 keep their
            original hashes; nothing is rewritten.</>
          )}
          {mode === 'rebase' && (
            <><strong>git rebase main</strong> replays feature's commits onto C4: F1 becomes <strong>F1' ({model.rebased.F1})</strong>,
            F2 becomes <strong>F2' ({model.rebased.F2})</strong> — new parents mean new hashes. History is now LINEAR with no
            join, but the original F1/F2 are abandoned (shown faded). Never rebase commits others have already pulled.</>
          )}
        </span>
      </div>
    </div>
  );
}
