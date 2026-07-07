import React, { useEffect, useRef, useState } from 'react';
import { GitMerge, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './GitBranchMergeViz.css';

// Deterministic two-scenario merge viz. Fixed coordinates, no randomness.
const R = 22;
const W = 760;
const H = 300;

// Fast-forward: main sat still on C; feature (D,E) is a straight continuation.
const FF = {
  nodes: [
    { id: 'A', x: 90, y: 150, lane: 'main' },
    { id: 'B', x: 218, y: 150, lane: 'main' },
    { id: 'C', x: 346, y: 150, lane: 'main', base: true },
    { id: 'D', x: 474, y: 150, lane: 'feature' },
    { id: 'E', x: 602, y: 150, lane: 'feature', tip: 'feature' },
  ],
  edges: [['B', 'A'], ['C', 'B'], ['D', 'C'], ['E', 'D']],
  // pointer target per step
  mainAt: ['C', 'E'],
  steps: [
    'main never moved since feature branched at C, so feature is just main plus two commits in a straight line.',
    'Fast-forward: Git slides the main pointer forward to E. No merge commit is made and history stays linear.',
  ],
};

// Three-way: both advanced. main = A-B-C-F ; feature = B-D-E ; merge base = B.
const TW = {
  nodes: [
    { id: 'A', x: 90, y: 100, lane: 'main' },
    { id: 'B', x: 214, y: 100, lane: 'main', base: true },
    { id: 'C', x: 338, y: 100, lane: 'main' },
    { id: 'F', x: 462, y: 100, lane: 'main', tip: 'main' },
    { id: 'D', x: 338, y: 220, lane: 'feature' },
    { id: 'E', x: 462, y: 220, lane: 'feature', tip: 'feature' },
    { id: 'M', x: 620, y: 100, lane: 'merge' },
  ],
  edges: [['B', 'A'], ['C', 'B'], ['F', 'C'], ['D', 'B'], ['E', 'D'], ['M', 'F'], ['M', 'E']],
  mainAt: ['F', 'F', 'M'],
  steps: [
    'Both branches advanced since B: main gained C and F while feature gained D and E. No pointer-slide can capture both.',
    'Git finds the merge base B, the newest commit both branches share, and does a three-way compare against each tip.',
    'A merge commit M is written with TWO parents (F and E). main advances to M; both histories are preserved.',
  ],
};

const SCENARIOS = { ff: FF, tw: TW };

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GitBranchMergeViz() {
  const [mode, setMode] = useState('ff');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const sc = SCENARIOS[mode];
  const total = sc.steps.length - 1;

  function selectMode(m) {
    setMode(m);
    setStep(0);
    setPlaying(false);
  }

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

  const byId = Object.fromEntries(sc.nodes.map((n) => [n.id, n]));
  const mainTarget = sc.mainAt[Math.min(step, total)];

  // M appears only on the final step of the three-way scenario.
  const visible = (n) => (n.id === 'M' ? mode === 'tw' && step >= total : true);
  const baseHighlighted = mode === 'tw' && step === 1;

  return (
    <div className="gbm">
      <div className="gbm-head">
        <div className="gbm-head-icon"><GitMerge size={18} /></div>
        <div className="gbm-head-text">
          <h3 className="gbm-title">Fast-forward vs three-way merge</h3>
          <p className="gbm-sub">
            When one branch directly descends from the other, Git just slides a pointer. When both advanced,
            it builds a merge commit from the common ancestor. Toggle the scenario and step through.
          </p>
        </div>
        <button type="button" className="gbm-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="gbm-modes">
        <button
          type="button"
          className={`gbm-mode-btn gbm-mode-ff${mode === 'ff' ? ' is-on' : ''}`}
          onClick={() => selectMode('ff')}
        >
          <span className="gbm-mode-label">Fast-forward</span>
          <span className="gbm-mode-tag">pointer slide, linear</span>
        </button>
        <button
          type="button"
          className={`gbm-mode-btn gbm-mode-tw${mode === 'tw' ? ' is-on' : ''}`}
          onClick={() => selectMode('tw')}
        >
          <span className="gbm-mode-label">Three-way merge</span>
          <span className="gbm-mode-tag">merge base, two parents</span>
        </button>
      </div>

      <div className="gbm-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="gbm-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="gbm-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="gbm-arrow-head" />
            </marker>
          </defs>

          {/* edges */}
          {sc.edges.map(([from, to]) => {
            const f = byId[from];
            const t = byId[to];
            if (!visible(f) || !visible(t)) return null;
            const dx = t.x - f.x;
            const dy = t.y - f.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            return (
              <line
                key={`${from}-${to}`}
                x1={f.x - ux * R} y1={f.y - uy * R}
                x2={t.x + ux * R} y2={t.y + uy * R}
                className={`gbm-edge${from === 'M' ? ' is-merge' : ''}`}
                markerEnd="url(#gbm-arrow)"
              />
            );
          })}

          {/* nodes */}
          {sc.nodes.map((n) => {
            if (!visible(n)) return null;
            const isBase = n.base && baseHighlighted;
            return (
              <g key={n.id} className={`gbm-node gbm-lane-${n.lane}${isBase ? ' is-base' : ''}${n.id === 'M' ? ' is-new' : ''}`}>
                <circle cx={n.x} cy={n.y} r={R} className="gbm-node-circle" />
                <text x={n.x} y={n.y + 4} className="gbm-node-id" textAnchor="middle">{n.id}</text>
                {isBase && (
                  <text x={n.x} y={n.y + R + 16} className="gbm-node-tag" textAnchor="middle">merge base</text>
                )}
              </g>
            );
          })}

          {/* branch pointer labels */}
          {(() => {
            const target = byId[mainTarget];
            return (
              <g className="gbm-ptr gbm-ptr-main">
                <rect x={target.x - 34} y={target.y - R - 34} width={68} height={22} rx={6} className="gbm-ptr-box" />
                <text x={target.x} y={target.y - R - 19} className="gbm-ptr-text" textAnchor="middle">main</text>
                <line x1={target.x} y1={target.y - R - 12} x2={target.x} y2={target.y - R - 2} className="gbm-ptr-line" />
              </g>
            );
          })()}
          {(() => {
            const featTip = sc.nodes.find((n) => n.tip === 'feature');
            if (!featTip) return null;
            const below = mode === 'tw';
            const ly = below ? featTip.y + R + 10 : featTip.y - R - 34;
            const ty = below ? featTip.y + R + 25 : featTip.y - R - 19;
            const l1 = below ? featTip.y + R + 2 : featTip.y - R - 12;
            const l2 = below ? featTip.y + R + 12 : featTip.y - R - 2;
            return (
              <g className="gbm-ptr gbm-ptr-feature">
                <rect x={featTip.x - 40} y={ly} width={80} height={22} rx={6} className="gbm-ptr-box is-feature" />
                <text x={featTip.x} y={ty} className="gbm-ptr-text is-feature" textAnchor="middle">feature</text>
                <line x1={featTip.x} y1={l1} x2={featTip.x} y2={l2} className="gbm-ptr-line is-feature" />
              </g>
            );
          })()}
        </svg>
      </div>

      <div className="gbm-controls">
        <button type="button" className="gbm-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="gbm-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={step >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="gbm-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="gbm-speed-range"
          />
          <span className="gbm-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="gbm-progress">step {Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="gbm-readout">
        <div className="gbm-stat is-mode">
          <span className="gbm-stat-label">scenario</span>
          <span className="gbm-stat-val">{mode === 'ff' ? 'Fast-forward' : 'Three-way'}</span>
        </div>
        <div className="gbm-stat is-merge">
          <span className="gbm-stat-label">merge commit</span>
          <span className="gbm-stat-val">{mode === 'ff' ? 'none' : (step >= total ? 'M (2 parents)' : 'pending')}</span>
        </div>
        <div className="gbm-stat is-base">
          <span className="gbm-stat-label">merge base</span>
          <span className="gbm-stat-val">{mode === 'ff' ? 'C' : 'B'}</span>
        </div>
      </div>

      <div className="gbm-note">
        <span className="gbm-note-label">now</span>
        <span className="gbm-note-body">{sc.steps[Math.min(step, total)]}</span>
      </div>
    </div>
  );
}
