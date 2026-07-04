import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ReactEffectViz.css';

// Vertical timeline of the useEffect lifecycle: render -> commit -> setup,
// then on a dependency change cleanup(old) -> setup(new), then unmount cleanup.
// Deterministic; no randomness anywhere. The deps toggle decides whether the
// effect re-runs (cleanup + new setup) or is skipped on the dependency change.
const EVENTS = [
  { key: 'render1', kind: 'render', label: 'Render #1', sub: 'id = 3 · pure, no effects',
    note: 'React renders the component. Rendering is pure — no side effects run yet.' },
  { key: 'commit1', kind: 'commit', label: 'Commit', sub: 'DOM updated · screen shows id 3',
    note: 'React commits the output to the DOM. Only after the screen updates do effects run.' },
  { key: 'setup1', kind: 'setup', label: 'Effect setup', sub: 'fetch(id 3) starts · ignore = false',
    note: 'Setup runs after commit: it starts fetch(3) and arms the ignore flag to false.' },
  { key: 'render2', kind: 'render', label: 'Render #2', sub: 'id changes 3 -> 5',
    note: 'A new render: id changed from 3 to 5. React must decide whether to re-run the effect.' },
  { key: 'commit2', kind: 'commit', label: 'Commit', sub: 'DOM updated',
    note: 'The new render commits to the DOM before any cleanup or setup fires.' },
  { key: 'cleanup1', kind: 'cleanup', cond: true, label: 'Cleanup (old)', sub: 'ignore = true · abort fetch(3)',
    note: 'Cleanup of the previous effect: ignore = true so the late fetch(3) response is dropped, and abort() cancels it.' },
  { key: 'setup2', kind: 'setup', cond: true, label: 'Effect setup', sub: 'fetch(id 5) starts · new ignore = false',
    note: 'A fresh setup runs for id 5 with its own ignore flag — the effect is now synchronized to the new id.' },
  { key: 'unmount', kind: 'unmount', label: 'Unmount', sub: 'component removed',
    note: 'The component is removed from the tree. React runs the final cleanup one last time.' },
  { key: 'cleanup2', kind: 'cleanup', label: 'Cleanup (final)', sub: 'ignore = true · abort in-flight',
    note: 'Final cleanup on unmount: any in-flight request is ignored and aborted, so no stale setState fires.' },
];

const MODES = {
  empty: {
    label: 'deps = []', tag: 'run once', rerun: false,
    desc: 'Empty array: setup runs once after mount, cleanup once on unmount. The effect does NOT re-run when id changes.',
  },
  id: {
    label: 'deps = [id]', tag: 're-run on id', rerun: true,
    desc: 'React compares id to its last value; it changed, so it cleans up the old effect then sets up a new one.',
  },
  none: {
    label: 'no array', tag: 'every render', rerun: true,
    desc: 'No dependency array: the effect re-runs after every render — cleanup then setup on each commit. Almost never what you want.',
  },
};

const MODE_ORDER = ['empty', 'id', 'none'];

const KIND_LABEL = {
  render: 'render', commit: 'commit', setup: 'setup', cleanup: 'cleanup', unmount: 'unmount',
};

// Geometry
const W = 460;
const H = 500;
const TOP = 12;
const PITCH = 54;
const BOX_X = 64;
const BOX_W = 332;
const BOX_H = 42;
const CX = BOX_X + BOX_W / 2;

const nodeY = (i) => TOP + i * PITCH;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ReactEffectViz() {
  const [mode, setMode] = useState('id');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = EVENTS.length - 1;
  const rerun = MODES[mode].rerun;
  const current = EVENTS[Math.min(step, total)];

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
      Math.round((reduced() ? 420 : 1000) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const stateOf = useMemo(() => (i) => {
    const ev = EVENTS[i];
    const skipped = ev.cond && !rerun;
    if (skipped) return i === step ? 'skip-active' : 'skip';
    if (i === step) return 'active';
    if (i < step) return 'done';
    return 'pending';
  }, [step, rerun]);

  const isSkippedNow = current.cond && !rerun;

  return (
    <div className="rev">
      <div className="rev-head">
        <div className="rev-head-icon"><Activity size={18} /></div>
        <div className="rev-head-text">
          <h3 className="rev-title">The useEffect lifecycle</h3>
          <p className="rev-sub">
            After each commit an effect sets up; when a dependency changes React cleans up the old
            effect then sets up a new one; on unmount it cleans up one last time.
          </p>
        </div>
        <button type="button" className="rev-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rev-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rev-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rev-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rev-arrow-head" />
            </marker>
            <marker id="rev-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rev-arrow-head-hot" />
            </marker>
          </defs>

          {/* downward trunk arrows between consecutive events */}
          {EVENTS.slice(0, -1).map((ev, i) => {
            const hot = i + 1 === step;
            return (
              <line
                key={`edge-${ev.key}`}
                x1={CX} y1={nodeY(i) + BOX_H} x2={CX} y2={nodeY(i + 1)}
                className={`rev-edge${hot ? ' is-hot' : ''}`}
                markerEnd={hot ? 'url(#rev-arrow-hot)' : 'url(#rev-arrow)'}
              />
            );
          })}

          {/* event boxes */}
          {EVENTS.map((ev, i) => {
            const st = stateOf(i);
            const cy = nodeY(i) + BOX_H / 2;
            return (
              <g key={ev.key} className={`rev-node is-${ev.kind} is-${st}`}>
                <rect x={BOX_X} y={nodeY(i)} width={BOX_W} height={BOX_H} rx={9} className="rev-node-box" />
                <circle cx={BOX_X + 18} cy={cy} r={5} className="rev-node-dot" />
                <text x={BOX_X + 34} y={nodeY(i) + 18} className="rev-node-label">{ev.label}</text>
                <text x={BOX_X + 34} y={nodeY(i) + 32} className="rev-node-sub">{ev.sub}</text>
                <text x={BOX_X + BOX_W - 14} y={cy + 4} className="rev-node-kind" textAnchor="end">{KIND_LABEL[ev.kind]}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rev-modes">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`rev-mode-btn rev-mode-${m}${mode === m ? ' is-on' : ''}`}
            onClick={() => selectMode(m)}
          >
            <span className="rev-mode-label">{MODES[m].label}</span>
            <span className="rev-mode-tag">{MODES[m].tag}</span>
          </button>
        ))}
      </div>

      <div className="rev-controls">
        <button type="button" className="rev-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="rev-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="rev-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="rev-speed-range"
          />
          <span className="rev-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="rev-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="rev-readout">
        <div className="rev-stat is-phase">
          <span className="rev-stat-label">phase</span>
          <span className="rev-stat-val">{current.label}</span>
        </div>
        <div className="rev-stat is-deps">
          <span className="rev-stat-label">deps</span>
          <span className="rev-stat-val">{MODES[mode].label}</span>
        </div>
        <div className="rev-stat is-rerun">
          <span className="rev-stat-label">effect re-runs</span>
          <span className="rev-stat-val">{rerun ? 'yes' : 'no'}</span>
        </div>
      </div>

      <div className="rev-note">
        <span className="rev-note-label">now</span>
        <span className="rev-note-body">
          {isSkippedNow
            ? <><strong>Skipped.</strong> With <em>{MODES[mode].label}</em> the dependency check finds no reason to re-run, so this cleanup/setup never fires.</>
            : <>{current.note}</>}
          <span className="rev-note-eg"> {MODES[mode].desc}</span>
        </span>
      </div>
    </div>
  );
}
