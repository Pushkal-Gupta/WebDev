import React, { useEffect, useRef, useState } from 'react';
import { Cloud, Play, Pause, SkipForward, RotateCcw, Gauge, ArrowUp, ArrowDown } from 'lucide-react';
import './GitRemoteFlowViz.css';

// Deterministic local/remote sync viz. Fixed commit positions, no randomness.
const POS = { A: 120, B: 224, C: 328, D: 432, E: 536, F: 432 };
const R = 18;
const LOCAL_Y = 96;
const ORIGIN_Y = 226;
const W = 700;
const H = 300;

// Per-scenario, per-step state: which commits each side holds, counts, transfer, note.
const PUSH = [
  { local: ['A', 'B', 'C'], origin: ['A', 'B', 'C'], ahead: 0, behind: 0, transfer: null,
    note: 'Synced: your local main and origin both point at C.' },
  { local: ['A', 'B', 'C', 'D', 'E'], origin: ['A', 'B', 'C'], ahead: 2, behind: 0, transfer: null,
    note: 'You commit D and E locally. Your main advances; origin stays at C. Ahead 2, behind 0.' },
  { local: ['A', 'B', 'C', 'D', 'E'], origin: ['A', 'B', 'C', 'D', 'E'], ahead: 0, behind: 0, transfer: 'push',
    note: 'git push uploads D and E; origin fast-forwards to E. Back in sync, ahead 0, behind 0.' },
];
const PULL = [
  { local: ['A', 'B', 'C'], origin: ['A', 'B', 'C'], ahead: 0, behind: 0, transfer: null,
    note: 'Synced: your local main and origin both point at C.' },
  { local: ['A', 'B', 'C'], origin: ['A', 'B', 'C', 'F'], ahead: 0, behind: 1, transfer: null,
    note: 'A teammate pushes F to origin. Nothing on your machine changed yet, but you are now behind by 1.' },
  { local: ['A', 'B', 'C'], origin: ['A', 'B', 'C', 'F'], ahead: 0, behind: 1, transfer: 'fetch',
    note: 'git fetch downloads F and updates your origin/main tracking bookmark. Your own main is untouched; still behind 1.' },
  { local: ['A', 'B', 'C', 'F'], origin: ['A', 'B', 'C', 'F'], ahead: 0, behind: 0, transfer: 'pull',
    note: 'git pull merges F into your main. Local and origin are in sync again.' },
];

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function GitRemoteFlowViz() {
  const [mode, setMode] = useState('push');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const frames = mode === 'push' ? PUSH : PULL;
  const total = frames.length - 1;
  const f = frames[Math.min(step, total)];

  function selectMode(m) { setMode(m); setStep(0); setPlaying(false); }
  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 540 : 1250) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const localTip = f.local[f.local.length - 1];
  const originTip = f.origin[f.origin.length - 1];

  const lane = (ids, y) => {
    const els = [];
    ids.forEach((id, i) => {
      if (i > 0) {
        const prev = ids[i - 1];
        els.push(
          <line key={`e-${y}-${id}`} x1={POS[id] - R} y1={y} x2={POS[prev] + R} y2={y}
            className="grf-edge" markerEnd="url(#grf-arrow)" />,
        );
      }
    });
    ids.forEach((id, i) => {
      const isNew = i === ids.length - 1;
      els.push(
        <g key={`n-${y}-${id}`} className={`grf-node${isNew ? ' is-tip' : ''}`}>
          <circle cx={POS[id]} cy={y} r={R} className="grf-node-circle" />
          <text x={POS[id]} y={y + 4} className="grf-node-id" textAnchor="middle">{id}</text>
        </g>,
      );
    });
    return els;
  };

  // vertical transfer arrow between lanes at the moving commit column
  const transferCol = f.transfer === 'push' ? POS.E : (f.transfer ? POS.F : null);
  const transferDown = f.transfer === 'push';

  return (
    <div className="grf">
      <div className="grf-head">
        <div className="grf-head-icon"><Cloud size={18} /></div>
        <div className="grf-head-text">
          <h3 className="grf-title">Syncing with a remote</h3>
          <p className="grf-sub">
            Your local repository and origin are separate copies. Push uploads your commits; fetch and pull
            download others'. Git tracks exactly how far ahead or behind you are. Toggle and step through.
          </p>
        </div>
        <button type="button" className="grf-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="grf-modes">
        <button
          type="button"
          className={`grf-mode-btn grf-mode-push${mode === 'push' ? ' is-on' : ''}`}
          onClick={() => selectMode('push')}
        >
          <span className="grf-mode-label">Push</span>
          <span className="grf-mode-tag">local ahead, upload</span>
        </button>
        <button
          type="button"
          className={`grf-mode-btn grf-mode-pull${mode === 'pull' ? ' is-on' : ''}`}
          onClick={() => selectMode('pull')}
        >
          <span className="grf-mode-label">Fetch / Pull</span>
          <span className="grf-mode-tag">remote ahead, download</span>
        </button>
      </div>

      <div className="grf-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="grf-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="grf-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="grf-arrow-head" />
            </marker>
            <marker id="grf-arrow-hot" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="grf-arrow-head-hot" />
            </marker>
          </defs>

          {/* lane backdrops */}
          <rect x={24} y={LOCAL_Y - 44} width={W - 48} height={88} rx={12} className="grf-lane-bg is-local" />
          <rect x={24} y={ORIGIN_Y - 44} width={W - 48} height={88} rx={12} className="grf-lane-bg is-origin" />
          <text x={40} y={LOCAL_Y - 26} className="grf-lane-label">local  ·  main -&gt; {localTip}</text>
          <text x={40} y={ORIGIN_Y - 26} className="grf-lane-label is-origin">origin  ·  main -&gt; {originTip}</text>

          {lane(f.local, LOCAL_Y)}
          {lane(f.origin, ORIGIN_Y)}

          {/* transfer arrow */}
          {transferCol != null && (
            <line
              x1={transferCol} y1={transferDown ? LOCAL_Y + R + 6 : ORIGIN_Y - R - 6}
              x2={transferCol} y2={transferDown ? ORIGIN_Y - R - 6 : LOCAL_Y + R + 6}
              className="grf-transfer" markerEnd="url(#grf-arrow-hot)"
            />
          )}
        </svg>
      </div>

      <div className="grf-controls">
        <button type="button" className="grf-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="grf-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={step >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <label className="grf-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="grf-speed-range"
          />
          <span className="grf-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="grf-progress">step {Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="grf-readout">
        <div className="grf-stat is-ahead">
          <ArrowUp size={14} className="grf-stat-icon" />
          <span className="grf-stat-label">ahead</span>
          <span className="grf-stat-val">{f.ahead}</span>
        </div>
        <div className="grf-stat is-behind">
          <ArrowDown size={14} className="grf-stat-icon" />
          <span className="grf-stat-label">behind</span>
          <span className="grf-stat-val">{f.behind}</span>
        </div>
        <div className="grf-stat is-sync">
          <span className="grf-stat-label">status</span>
          <span className="grf-stat-val">{f.ahead === 0 && f.behind === 0 ? 'in sync' : 'diverged'}</span>
        </div>
      </div>

      <div className="grf-note">
        <span className="grf-note-label">now</span>
        <span className="grf-note-body">{f.note}</span>
      </div>
    </div>
  );
}
