import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Boxes, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './ReactComponentTreeViz.css';

// A React component tree. Props flow strictly one way: parent -> child, downward.
// Stepping inspects each component in a fixed top-to-bottom order; the props it
// received from its parent light up the connecting edge and fill the readout.
// Deterministic: fixed data, no randomness anywhere.
const NODES = [
  { key: 'app', label: 'App', sub: 'owns the data', cls: 'is-app', x: 190, y: 16, w: 130, h: 46 },
  { key: 'header', label: 'Header', sub: 'title bar', cls: 'is-header', x: 30, y: 128, w: 128, h: 46 },
  { key: 'content', label: 'Content', sub: 'product list', cls: 'is-content', x: 188, y: 128, w: 134, h: 46 },
  { key: 'footer', label: 'Footer', sub: 'page tail', cls: 'is-footer', x: 352, y: 128, w: 128, h: 46 },
  { key: 'cardA', label: 'Card', sub: 'stamp #1', cls: 'is-card', x: 150, y: 244, w: 118, h: 46 },
  { key: 'cardB', label: 'Card', sub: 'stamp #2', cls: 'is-card', x: 296, y: 244, w: 118, h: 46 },
];

const NODE_BY_KEY = Object.fromEntries(NODES.map((n) => [n.key, n]));

const EDGES = [
  { from: 'app', to: 'header' },
  { from: 'app', to: 'content' },
  { from: 'app', to: 'footer' },
  { from: 'content', to: 'cardA' },
  { from: 'content', to: 'cardB' },
];

const PARENT_OF = Object.fromEntries(EDGES.map((e) => [e.to, e.from]));

// The props each component receives FROM its parent (read-only inputs).
const PROPS_IN = {
  app: [],
  header: [{ k: 'title', v: '"Shop"' }],
  content: [{ k: 'products', v: '[2 items]' }, { k: 'onBuy', v: 'fn' }],
  footer: [{ k: 'year', v: '2026' }],
  cardA: [{ k: 'title', v: '"Headphones"' }, { k: 'price', v: '79' }],
  cardB: [{ k: 'title', v: '"Keyboard"' }, { k: 'price', v: '45' }],
};

const NOTE = {
  app: 'App sits at the top and owns the data. It receives no props — nothing lives above it.',
  header: 'App passes title down to Header. Header renders it but can never change it.',
  content: 'App hands Content the product array and an onBuy callback — data down, events back up via the callback.',
  footer: 'App passes year down to Footer. One definition, one prop, one direction.',
  cardA: 'Content presses the Card stamp with its own props: title and price flow down from the list.',
  cardB: 'The same Card component, different props. One stamp, many presses — that is reuse.',
};

// Inspection order: strict top-to-bottom walk of the tree.
const ORDER = ['app', 'header', 'content', 'footer', 'cardA', 'cardB'];

const W = 510;
const H = 312;

const cx = (n) => n.x + n.w / 2;

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function ReactComponentTreeViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const timer = useRef(null);

  const total = ORDER.length - 1;
  const currentKey = ORDER[Math.min(step, total)];
  const parentKey = PARENT_OF[currentKey] || null;
  const propsIn = PROPS_IN[currentKey];

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      Math.round((reduced() ? 420 : 1100) / speed),
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const stateOf = useMemo(() => (node) => {
    if (node.key === currentKey) return 'active';
    if (node.key === parentKey) return 'parent';
    if (ORDER.indexOf(node.key) < step) return 'seen';
    return 'idle';
  }, [currentKey, parentKey, step]);

  return (
    <div className="rct">
      <div className="rct-head">
        <div className="rct-head-icon"><Boxes size={18} /></div>
        <div className="rct-head-text">
          <h3 className="rct-title">Components &amp; one-way props</h3>
          <p className="rct-sub">
            A tree of reusable components. Props flow one way &mdash; down from each parent to its
            children. Step through to inspect who receives what.
          </p>
        </div>
        <button type="button" className="rct-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="rct-stage">
        <svg viewBox={`0 0 ${W} ${H}`} className="rct-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="rct-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rct-arrow-head" />
            </marker>
            <marker id="rct-arrow-hot" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="rct-arrow-head-hot" />
            </marker>
            <linearGradient id="rct-flow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* edges: parent -> child, always drawn top-to-bottom */}
          {EDGES.map((e) => {
            const f = NODE_BY_KEY[e.from];
            const t = NODE_BY_KEY[e.to];
            const hot = e.from === parentKey && e.to === currentKey;
            const x1 = cx(f);
            const y1 = f.y + f.h;
            const x2 = cx(t);
            const y2 = t.y;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            return (
              <g key={`${e.from}-${e.to}`}>
                <path
                  d={`M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`}
                  className={`rct-edge${hot ? ' is-hot' : ''}`}
                  markerEnd={hot ? 'url(#rct-arrow-hot)' : 'url(#rct-arrow)'}
                  fill="none"
                />
                {hot && (
                  <g className="rct-token">
                    <circle cx={mx} cy={my} r={9} className="rct-token-dot" />
                    <text x={mx} y={my + 3.2} className="rct-token-text" textAnchor="middle">
                      props
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* nodes */}
          {NODES.map((n) => {
            const st = stateOf(n);
            return (
              <g key={n.key} className={`rct-node ${n.cls} is-${st}`}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={10} className="rct-node-box" />
                <text x={cx(n)} y={n.y + 21} className="rct-node-label" textAnchor="middle">{n.label}</text>
                <text x={cx(n)} y={n.y + 36} className="rct-node-sub" textAnchor="middle">{n.sub}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="rct-controls">
        <button type="button" className="rct-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button type="button" className="rct-btn" onClick={() => setStep((s) => Math.min(total, s + 1))} disabled={step >= total}>
          <SkipForward size={14} /> Step
        </button>
        <label className="rct-speed">
          <Gauge size={14} />
          <input
            type="range" min={0.5} max={4} step={0.5} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))} className="rct-speed-range"
          />
          <span className="rct-speed-value">{speed.toFixed(1)}&times;</span>
        </label>
        <span className="rct-progress">{Math.min(step, total) + 1} / {total + 1}</span>
      </div>

      <div className="rct-readout">
        <div className="rct-stat is-node">
          <span className="rct-stat-label">inspecting</span>
          <span className="rct-stat-val">{NODE_BY_KEY[currentKey].label}</span>
        </div>
        <div className="rct-stat is-parent">
          <span className="rct-stat-label">parent</span>
          <span className="rct-stat-val">{parentKey ? NODE_BY_KEY[parentKey].label : 'none (root)'}</span>
        </div>
        <div className="rct-stat is-count">
          <span className="rct-stat-label">props received</span>
          <span className="rct-stat-val">{propsIn.length}</span>
        </div>
      </div>

      <div className="rct-props">
        <span className="rct-props-label">props in</span>
        <span className="rct-props-body">
          {propsIn.length === 0
            ? <em className="rct-props-empty">none &mdash; the root owns its own data</em>
            : propsIn.map((p) => (
              <span key={p.k} className="rct-chip">
                <span className="rct-chip-k">{p.k}</span>
                <span className="rct-chip-v">{p.v}</span>
              </span>
            ))}
        </span>
      </div>

      <div className="rct-note">
        <span className="rct-note-label">now</span>
        <span className="rct-note-body">{NOTE[currentKey]}</span>
      </div>
    </div>
  );
}
