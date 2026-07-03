import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './WebRenderingPathViz.css';

// Vertical critical-rendering-path pipeline. Deterministic; no randomness anywhere.
// Two inputs (DOM, CSSOM) merge into the render tree, then flow straight down.
const NODES = [
  { key: 'dom', label: 'DOM', sub: 'HTML → tree', cls: 'is-dom', kind: 'build', x: 46, y: 18, w: 150, h: 50 },
  { key: 'cssom', label: 'CSSOM', sub: 'CSS → tree', cls: 'is-cssom', kind: 'build', x: 264, y: 18, w: 150, h: 50 },
  { key: 'render', label: 'Render Tree', sub: 'visible nodes + style', cls: 'is-render', kind: 'build', x: 130, y: 128, w: 200, h: 50 },
  { key: 'layout', label: 'Layout', sub: 'reflow · box geometry', cls: 'is-layout', kind: 'stage', x: 130, y: 228, w: 200, h: 50 },
  { key: 'paint', label: 'Paint', sub: 'repaint · fill pixels', cls: 'is-paint', kind: 'stage', x: 130, y: 328, w: 200, h: 50 },
  { key: 'composite', label: 'Composite', sub: 'GPU layers → screen', cls: 'is-composite', kind: 'stage', x: 130, y: 428, w: 200, h: 50 },
];

const NODE_BY_KEY = Object.fromEntries(NODES.map((n) => [n.key, n]));

const STAGE_TEXT = {
  dom: 'HTML is parsed into the DOM tree.',
  cssom: 'CSS is parsed into the CSSOM tree.',
  render: 'DOM and CSSOM merge into the render tree.',
  layout: 'Layout (reflow) recomputes every box position and size.',
  paint: 'Paint (repaint) fills the pixels for each box.',
  composite: 'Composite stacks the GPU layers onto the screen.',
};

// Which pipeline stages a given change type re-runs, in order.
const MODES = {
  reflow: {
    label: 'Reflow',
    tag: 'geometry',
    rerun: ['layout', 'paint', 'composite'],
    example: 'width, top, margin, font-size',
    desc: 'A geometry change re-runs Layout → Paint → Composite — the full chain.',
  },
  repaint: {
    label: 'Repaint',
    tag: 'visual',
    rerun: ['paint', 'composite'],
    example: 'color, background, box-shadow',
    desc: 'A visual change skips Layout and re-runs Paint → Composite.',
  },
  composite: {
    label: 'Composite only',
    tag: 'transform / opacity',
    rerun: ['composite'],
    example: 'transform, opacity',
    desc: 'A transform / opacity change skips Layout and Paint — the compositor just moves an existing layer.',
  },
};

const MODE_ORDER = ['reflow', 'repaint', 'composite'];

// Geometry
const W = 460;
const H = 500;

const cx = (n) => n.x + n.w / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function WebRenderingPathViz() {
  const [mode, setMode] = useState('reflow');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const rerun = MODES[mode].rerun;
  const total = rerun.length - 1;
  const currentKey = rerun[Math.min(step, total)];

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

  const stateOf = useMemo(() => (node) => {
    if (node.kind === 'build') return 'build';
    if (node.key === currentKey) return 'active';
    if (rerun.includes(node.key)) return 'rerun';
    return 'skipped';
  }, [currentKey, rerun]);

  const arrows = [
    { from: 'dom', to: 'render', merge: true },
    { from: 'cssom', to: 'render', merge: true },
    { from: 'render', to: 'layout' },
    { from: 'layout', to: 'paint' },
    { from: 'paint', to: 'composite' },
  ];

  return (
    <div className="wrp">
      <div className="wrp-head">
        <div className="wrp-head-icon"><Layers size={18} /></div>
        <div className="wrp-head-text">
          <h3 className="wrp-title">The critical rendering path</h3>
          <p className="wrp-sub">
            HTML and CSS become two trees, merge into the render tree, then flow down through
            layout, paint, and composite &mdash; each change type re-runs a different suffix.
          </p>
        </div>
        <button type="button" className="wrp-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wrp-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="wrp-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="wrp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="wrp-arrow-head" />
            </marker>
            <marker id="wrp-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="wrp-arrow-head-hot" />
            </marker>
          </defs>

          {/* downward arrows (always vertical / converging-down for the merge) */}
          {arrows.map((a) => {
            const f = NODE_BY_KEY[a.from];
            const t = NODE_BY_KEY[a.to];
            const hot = a.to === currentKey || (a.from === currentKey && rerun.includes(a.to));
            const x1 = cx(f);
            const y1 = f.y + f.h;
            const x2 = a.merge ? (a.from === 'dom' ? t.x + 46 : t.x + t.w - 46) : cx(t);
            const y2 = t.y;
            return (
              <line
                key={`${a.from}-${a.to}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                className={`wrp-edge${hot ? ' is-hot' : ''}`}
                markerEnd={hot ? 'url(#wrp-arrow-hot)' : 'url(#wrp-arrow)'}
              />
            );
          })}

          {/* nodes */}
          {NODES.map((n) => {
            const st = stateOf(n);
            return (
              <g key={n.key} className={`wrp-node ${n.cls} is-${st}`}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} className="wrp-node-box" />
                <text x={cx(n)} y={n.y + 22} className="wrp-node-label" textAnchor="middle">{n.label}</text>
                <text x={cx(n)} y={n.y + 39} className="wrp-node-sub" textAnchor="middle">{n.sub}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="wrp-modes">
        {MODE_ORDER.map((m) => (
          <button
            key={m}
            type="button"
            className={`wrp-mode-btn wrp-mode-${m}${mode === m ? ' is-on' : ''}`}
            onClick={() => selectMode(m)}
          >
            <span className="wrp-mode-label">{MODES[m].label}</span>
            <span className="wrp-mode-tag">{MODES[m].tag}</span>
          </button>
        ))}
      </div>

      <div className="wrp-controls">
        <button type="button" className="wrp-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="wrp-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="wrp-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="wrp-speed-range"
          />
          <span className="wrp-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="wrp-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="wrp-readout">
        <div className="wrp-stat is-stage">
          <span className="wrp-stat-label">stage</span>
          <span className="wrp-stat-val">{NODE_BY_KEY[currentKey].label}</span>
        </div>
        <div className="wrp-stat is-mode">
          <span className="wrp-stat-label">change</span>
          <span className="wrp-stat-val">{MODES[mode].label}</span>
        </div>
        <div className="wrp-stat is-count">
          <span className="wrp-stat-label">stages re-run</span>
          <span className="wrp-stat-val">{rerun.length}</span>
        </div>
      </div>

      <div className="wrp-note">
        <span className="wrp-note-label">now</span>
        <span className="wrp-note-body">
          {STAGE_TEXT[currentKey]} <em>{MODES[mode].desc}</em>
          <span className="wrp-note-eg"> ({MODES[mode].example})</span>
        </span>
      </div>
    </div>
  );
}
