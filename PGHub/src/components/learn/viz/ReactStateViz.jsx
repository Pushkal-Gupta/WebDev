import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, Play, Pause, SkipForward, RotateCcw, Gauge, MousePointerClick } from 'lucide-react';
import './ReactStateViz.css';

// Deterministic state-update cycle. No randomness anywhere.
// A component holds a state cell (count). A click raises an event -> setState
// schedules a re-render -> the component re-renders reading the new value.
// The four stages flow strictly top-to-bottom.
const STAGES = [
  {
    key: 'event',
    label: 'Event',
    sub: 'user clicks the button',
    node: 'button',
    cls: 'is-event',
    text: 'A click on the button fires the onClick handler. Nothing has changed yet.',
  },
  {
    key: 'setstate',
    label: 'setState',
    sub: 'setCount(count + 1)',
    node: 'setter',
    cls: 'is-setstate',
    text: 'The handler calls the setter. It does NOT edit count in place — the current snapshot stays frozen.',
  },
  {
    key: 'schedule',
    label: 'Schedule re-render',
    sub: 'React queues the update',
    node: 'react',
    cls: 'is-schedule',
    text: 'React writes the next value to its slot and schedules a fresh render of the component.',
  },
  {
    key: 'rerender',
    label: 'Re-render',
    sub: 'reads the new value',
    node: 'component',
    cls: 'is-rerender',
    text: 'The component function runs again. useState reads the updated value and returns new UI.',
  },
];

const TOTAL = STAGES.length - 1;

// Geometry
const W = 460;
const H = 500;

// Nodes referenced by stages, laid out top-to-bottom.
const NODES = {
  button: { x: 150, y: 20, w: 160, h: 48 },
  setter: { x: 150, y: 128, w: 160, h: 48 },
  react: { x: 150, y: 236, w: 160, h: 48 },
  component: { x: 110, y: 344, w: 240, h: 128 },
};

const EDGES = [
  { from: 'button', to: 'setter', at: 'setstate' },
  { from: 'setter', to: 'react', at: 'schedule' },
  { from: 'react', to: 'component', at: 'rerender' },
];

const cx = (n) => n.x + n.w / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ReactStateViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // How many complete cycles have finished; drives the committed count value.
  const [cycles, setCycles] = useState(0);
  const timer = useRef(null);

  const stage = STAGES[Math.min(step, TOTAL)];

  // The value React holds. It only advances once the re-render stage lands.
  const committed = cycles;
  const pending = step >= 1 ? committed + 1 : committed; // shown once setState fires
  const shown = step >= TOTAL ? committed + 1 : committed; // on-screen UI value

  function reset() {
    setStep(0);
    setPlaying(false);
    setCycles(0);
  }

  function togglePlay() {
    setPlaying((p) => !p);
  }

  function stepForward() {
    setStep((s) => {
      if (s >= TOTAL) {
        setCycles((c) => c + 1);
        return 0;
      }
      return s + 1;
    });
  }

  useEffect(() => {
    if (!playing) return undefined;
    timer.current = setTimeout(() => {
      setStep((s) => {
        if (s >= TOTAL) {
          setCycles((c) => c + 1);
          return 0;
        }
        return s + 1;
      });
    }, Math.round((reduced() ? 460 : 1100) / speed));
    return () => clearTimeout(timer.current);
  }, [playing, step, speed, cycles]);

  const nodeState = useMemo(() => (nodeKey) => {
    if (stage.node === nodeKey) return 'active';
    // Nodes belonging to already-passed stages read as "done".
    const activeIdx = STAGES.findIndex((s) => s.node === nodeKey);
    if (activeIdx !== -1 && activeIdx < step) return 'done';
    return 'idle';
  }, [stage, step]);

  return (
    <div className="rsv">
      <div className="rsv-head">
        <div className="rsv-head-icon"><Sparkles size={18} /></div>
        <div className="rsv-head-text">
          <h3 className="rsv-title">State update cycle</h3>
          <p className="rsv-sub">
            A click raises an event, the setter schedules a re-render, and the component
            runs again to read the new value &mdash; the snapshot is replaced, never edited.
          </p>
        </div>
        <button type="button" className="rsv-reset" onClick={reset}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rsv-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rsv-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rsv-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rsv-arrow-head" />
            </marker>
            <marker id="rsv-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rsv-arrow-head-hot" />
            </marker>
          </defs>

          {/* downward edges */}
          {EDGES.map((e) => {
            const f = NODES[e.from];
            const t = NODES[e.to];
            const hot = stage.key === e.at;
            return (
              <line
                key={`${e.from}-${e.to}`}
                x1={cx(f)} y1={f.y + f.h} x2={cx(t)} y2={t.y}
                className={`rsv-edge${hot ? ' is-hot' : ''}`}
                markerEnd={hot ? 'url(#rsv-arrow-hot)' : 'url(#rsv-arrow)'}
              />
            );
          })}

          {/* Event: the button */}
          <g className={`rsv-node is-btn is-${nodeState('button')}`}>
            <rect x={NODES.button.x} y={NODES.button.y} width={NODES.button.w} height={NODES.button.h} rx={10} className="rsv-node-box" />
            <text x={cx(NODES.button)} y={NODES.button.y + 22} className="rsv-node-label" textAnchor="middle">onClick</text>
            <text x={cx(NODES.button)} y={NODES.button.y + 38} className="rsv-node-sub" textAnchor="middle">+1 button clicked</text>
          </g>

          {/* setState */}
          <g className={`rsv-node is-set is-${nodeState('setter')}`}>
            <rect x={NODES.setter.x} y={NODES.setter.y} width={NODES.setter.w} height={NODES.setter.h} rx={10} className="rsv-node-box" />
            <text x={cx(NODES.setter)} y={NODES.setter.y + 22} className="rsv-node-label" textAnchor="middle">setCount({pending})</text>
            <text x={cx(NODES.setter)} y={NODES.setter.y + 38} className="rsv-node-sub" textAnchor="middle">setter, not a mutation</text>
          </g>

          {/* React schedules */}
          <g className={`rsv-node is-react is-${nodeState('react')}`}>
            <rect x={NODES.react.x} y={NODES.react.y} width={NODES.react.w} height={NODES.react.h} rx={10} className="rsv-node-box" />
            <text x={cx(NODES.react)} y={NODES.react.y + 22} className="rsv-node-label" textAnchor="middle">React</text>
            <text x={cx(NODES.react)} y={NODES.react.y + 38} className="rsv-node-sub" textAnchor="middle">schedules re-render</text>
          </g>

          {/* Component with state cell + rendered UI */}
          <g className={`rsv-node is-comp is-${nodeState('component')}`}>
            <rect x={NODES.component.x} y={NODES.component.y} width={NODES.component.w} height={NODES.component.h} rx={12} className="rsv-node-box" />
            <text x={cx(NODES.component)} y={NODES.component.y + 22} className="rsv-comp-title" textAnchor="middle">Counter component</text>

            {/* state cell (the "whiteboard") */}
            <rect x={NODES.component.x + 20} y={NODES.component.y + 38} width={90} height={64} rx={8} className="rsv-cell" />
            <text x={NODES.component.x + 65} y={NODES.component.y + 58} className="rsv-cell-label" textAnchor="middle">state</text>
            <text x={NODES.component.x + 65} y={NODES.component.y + 88} className="rsv-cell-val" textAnchor="middle">{shown}</text>

            {/* rendered UI value */}
            <rect x={NODES.component.x + 130} y={NODES.component.y + 38} width={90} height={64} rx={8} className="rsv-ui" />
            <text x={NODES.component.x + 175} y={NODES.component.y + 58} className="rsv-cell-label" textAnchor="middle">UI shows</text>
            <text x={NODES.component.x + 175} y={NODES.component.y + 88} className="rsv-ui-val" textAnchor="middle">{shown}</text>
          </g>
        </svg>
      </div>

      <div className="rsv-controls">
        <button type="button" className="rsv-btn" onClick={togglePlay}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" className="rsv-btn" onClick={stepForward}>
          <SkipForward size={14} /> Step
        </button>
        <label className="rsv-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="rsv-speed-range"
          />
          <span className="rsv-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="rsv-progress">{Math.min(step, TOTAL) + 1} / {TOTAL + 1}</span>
      </div>

      <div className="rsv-readout">
        <div className="rsv-stat is-stage">
          <span className="rsv-stat-label">stage</span>
          <span className="rsv-stat-val">{stage.label}</span>
        </div>
        <div className="rsv-stat is-count">
          <span className="rsv-stat-label">state value</span>
          <span className="rsv-stat-val">{shown}</span>
        </div>
        <div className="rsv-stat is-renders">
          <span className="rsv-stat-label">renders</span>
          <span className="rsv-stat-val">{cycles + (step >= TOTAL ? 1 : 0) + 1}</span>
        </div>
      </div>

      <div className="rsv-note">
        <span className="rsv-note-icon"><MousePointerClick size={14} /></span>
        <span className="rsv-note-body">{stage.text}</span>
      </div>
    </div>
  );
}
