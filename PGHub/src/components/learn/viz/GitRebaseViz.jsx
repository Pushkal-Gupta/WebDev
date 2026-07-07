import React, { useEffect, useRef, useState } from 'react';
import { GitPullRequestArrow, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './GitRebaseViz.css';

// Deterministic rebase-vs-merge viz. Short SHAs are fixed strings; no randomness.
const R = 20;
const W = 840;
const H = 300;

const MAIN = [
  { id: 'A', sha: '0a1', x: 80, y: 96 },
  { id: 'B', sha: '1b2', x: 194, y: 96, base: true },
  { id: 'G', sha: '2c3', x: 308, y: 96 },
  { id: 'H', sha: '3d4', x: 422, y: 96, tip: 'main' },
];
// Original feature commits (built on B).
const ORIG = [
  { id: 'D', sha: 'a11', x: 308, y: 216 },
  { id: 'E', sha: 'b22', x: 422, y: 216 },
  { id: 'F', sha: 'c33', x: 536, y: 216, tip: 'feature' },
];
// Replayed feature commits (built on H) — brand-new SHAs.
const REPLAY = [
  { id: "D'", sha: 'd44', x: 536, y: 96, from: 'D' },
  { id: "E'", sha: 'e55', x: 650, y: 96, from: 'E' },
  { id: "F'", sha: 'f66', x: 764, y: 96, from: 'F', tip: 'feature' },
];
const MERGE = { id: 'M', sha: 'm77', x: 650, y: 96 };

const REBASE_STEPS = [
  'Diverged: main advanced to H while feature (D, E, F) still sits on the old base B.',
  'Rebase detaches D, E, F and picks the replay target: the current tip of main, H.',
  "Replay commit 1: D's changes are re-applied on top of H as a NEW commit D' with a new SHA.",
  "Replay commit 2: E' is written on top of D'. Same changes, new hash and new parent.",
  "Replay commit 3: F' lands on E'. feature is now a clean straight line on top of main.",
];
const MERGE_STEPS = [
  'Diverged: main advanced to H while feature (D, E, F) still sits on the old base B.',
  'Merge writes commit M with two parents (H and F). The fork stays visible; no SHAs change.',
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GitRebaseViz() {
  const [mode, setMode] = useState('rebase');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const steps = mode === 'rebase' ? REBASE_STEPS : MERGE_STEPS;
  const total = steps.length - 1;

  function selectMode(m) { setMode(m); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 520 : 1200) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const isRebase = mode === 'rebase';
  // In rebase, originals detach at step >= 1; replayed appear at step index.
  const origDetached = isRebase && step >= 1;
  const replayShown = (n) => isRebase && step >= (REPLAY.indexOf(n) + 2);
  const mergeShown = !isRebase && step >= 1;

  // feature pointer target
  let featTip = ORIG.find((n) => n.tip);
  if (isRebase && step >= total) featTip = REPLAY.find((n) => n.tip);

  const allNodes = [...MAIN, ...ORIG];

  return (
    <div className="grb">
      <div className="grb-head">
        <div className="grb-head-icon"><GitPullRequestArrow size={18} /></div>
        <div className="grb-head-text">
          <h3 className="grb-title">Rebase replays commits; merge joins them</h3>
          <p className="grb-sub">
            Rebase re-applies a branch's commits on a new base as brand-new commits with new SHAs, keeping
            history linear. Merge preserves the fork with a two-parent commit. Toggle and step through.
          </p>
        </div>
        <button type="button" className="grb-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grb-modes">
        <button
          type="button"
          className={`grb-mode-btn grb-mode-rebase${isRebase ? ' is-on' : ''}`}
          onClick={() => selectMode('rebase')}
        >
          <span className="grb-mode-label">Rebase</span>
          <span className="grb-mode-tag">replay, new SHAs, linear</span>
        </button>
        <button
          type="button"
          className={`grb-mode-btn grb-mode-merge${!isRebase ? ' is-on' : ''}`}
          onClick={() => selectMode('merge')}
        >
          <span className="grb-mode-label">Merge</span>
          <span className="grb-mode-tag">two parents, fork kept</span>
        </button>
      </div>

      <div className="grb-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="grb-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="grb-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="grb-arrow-head" />
            </marker>
          </defs>

          {/* main chain edges */}
          {MAIN.slice(1).map((n, i) => {
            const p = MAIN[i];
            return <line key={`m-${n.id}`} x1={n.x - R} y1={n.y} x2={p.x + R} y2={p.y} className="grb-edge" markerEnd="url(#grb-arrow)" />;
          })}

          {/* original feature edges: D->B, E->D, F->E */}
          {ORIG.map((n, i) => {
            const parent = i === 0 ? MAIN[1] : ORIG[i - 1];
            const dx = parent.x - n.x; const dy = parent.y - n.y;
            const len = Math.hypot(dx, dy) || 1;
            return (
              <line
                key={`o-${n.id}`}
                x1={n.x - (dx / len) * R} y1={n.y - (dy / len) * R}
                x2={parent.x + (dx / len) * R} y2={parent.y + (dy / len) * R}
                className={`grb-edge grb-orig${origDetached ? ' is-detached' : ''}`}
                markerEnd="url(#grb-arrow)"
              />
            );
          })}

          {/* replayed edges */}
          {REPLAY.map((n, i) => {
            if (!replayShown(n)) return null;
            const parent = i === 0 ? MAIN[3] : REPLAY[i - 1];
            return (
              <line
                key={`r-${n.id}`}
                x1={n.x - R} y1={n.y} x2={parent.x + R} y2={parent.y}
                className="grb-edge grb-replay" markerEnd="url(#grb-arrow)"
              />
            );
          })}

          {/* merge edges */}
          {mergeShown && (
            <>
              <line x1={MERGE.x - R} y1={MERGE.y} x2={MAIN[3].x + R} y2={MAIN[3].y} className="grb-edge grb-mergeedge" markerEnd="url(#grb-arrow)" />
              {(() => {
                const f = ORIG[2];
                const dx = f.x - MERGE.x; const dy = f.y - MERGE.y;
                const len = Math.hypot(dx, dy) || 1;
                return <line x1={MERGE.x - (dx / len) * R} y1={MERGE.y - (dy / len) * R} x2={f.x + (dx / len) * R} y2={f.y + (dy / len) * R} className="grb-edge grb-mergeedge" markerEnd="url(#grb-arrow)" />;
              })()}
            </>
          )}

          {/* main + original nodes */}
          {allNodes.map((n) => {
            const isOrig = ORIG.includes(n);
            const detach = isOrig && origDetached;
            return (
              <g key={n.id} className={`grb-node ${isOrig ? 'grb-lane-feature' : 'grb-lane-main'}${detach ? ' is-detached' : ''}${n.base ? ' is-base' : ''}`}>
                <circle cx={n.x} cy={n.y} r={R} className="grb-node-circle" />
                <text x={n.x} y={n.y + 4} className="grb-node-id" textAnchor="middle">{n.id}</text>
                <text x={n.x} y={n.y + (isOrig ? R + 16 : -R - 8)} className="grb-node-sha" textAnchor="middle">{n.sha}</text>
              </g>
            );
          })}

          {/* replayed nodes */}
          {REPLAY.map((n) => {
            if (!replayShown(n)) return null;
            return (
              <g key={n.id} className="grb-node grb-lane-replay is-new">
                <circle cx={n.x} cy={n.y} r={R} className="grb-node-circle" />
                <text x={n.x} y={n.y + 4} className="grb-node-id" textAnchor="middle">{n.id}</text>
                <text x={n.x} y={n.y - R - 8} className="grb-node-sha" textAnchor="middle">{n.sha}</text>
              </g>
            );
          })}

          {/* merge node */}
          {mergeShown && (
            <g className="grb-node grb-lane-merge is-new">
              <circle cx={MERGE.x} cy={MERGE.y} r={R} className="grb-node-circle" />
              <text x={MERGE.x} y={MERGE.y + 4} className="grb-node-id" textAnchor="middle">{MERGE.id}</text>
              <text x={MERGE.x} y={MERGE.y - R - 8} className="grb-node-sha" textAnchor="middle">{MERGE.sha}</text>
            </g>
          )}

          {/* main pointer */}
          <g className="grb-ptr">
            <rect x={MAIN[3].x - 30} y={MAIN[3].y - R - 34} width={60} height={20} rx={6} className="grb-ptr-box" />
            <text x={MAIN[3].x} y={MAIN[3].y - R - 20} className="grb-ptr-text" textAnchor="middle">main</text>
          </g>

          {/* feature pointer */}
          <g className="grb-ptr">
            <rect x={featTip.x - 38} y={featTip.y + R + 6} width={76} height={20} rx={6} className="grb-ptr-box is-feature" />
            <text x={featTip.x} y={featTip.y + R + 20} className="grb-ptr-text is-feature" textAnchor="middle">feature</text>
          </g>
        </svg>
      </div>

      <div className="grb-controls">
        <button type="button" className="grb-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="grb-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={step >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="grb-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="grb-speed-range"
          />
          <span className="grb-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="grb-progress">step {Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="grb-readout">
        <div className="grb-stat is-mode">
          <span className="grb-stat-label">strategy</span>
          <span className="grb-stat-val">{isRebase ? 'Rebase' : 'Merge'}</span>
        </div>
        <div className="grb-stat is-sha">
          <span className="grb-stat-label">feature SHAs</span>
          <span className="grb-stat-val">{isRebase && step >= total ? 'rewritten' : 'unchanged'}</span>
        </div>
        <div className="grb-stat is-shape">
          <span className="grb-stat-label">history</span>
          <span className="grb-stat-val">{isRebase ? 'linear' : 'fork + merge'}</span>
        </div>
      </div>

      <div className="grb-note">
        <span className="grb-note-label">now</span>
        <span className="grb-note-body">{steps[Math.min(step, total)]}</span>
      </div>
    </div>
  );
}
