import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Network, Play, Pause, SkipForward, RotateCcw, Gauge } from 'lucide-react';
import './WebDomTreeViz.css';

// A fixed HTML snippet whose tags map, in parse order, onto DOM nodes below.
// Deterministic: every node's position is hard-coded, no randomness anywhere.
const HTML_LINES = [
  '<html>',
  '  <head>',
  '    <title>Bread</title>',
  '  </head>',
  '  <body>',
  '    <h1>Fresh Bread</h1>',
  '    <ul>',
  '      <li>Mix</li>',
  '      <li>Bake</li>',
  '    </ul>',
  '  </body>',
  '</html>',
];

// Ordered as the tokenizer + tree constructor would emit them (depth-first open order).
// kind: 'doc' | 'element' | 'text'. parent = index into NODES (-1 for root).
const NODES = [
  { id: 'doc', label: 'document', kind: 'doc', parent: -1, line: -1, x: 300, y: 30 },
  { id: 'html', label: '<html>', kind: 'element', parent: 0, line: 0, x: 300, y: 90 },
  { id: 'head', label: '<head>', kind: 'element', parent: 1, line: 1, x: 150, y: 150 },
  { id: 'title', label: '<title>', kind: 'element', parent: 2, line: 2, x: 150, y: 210 },
  { id: 'title-t', label: '"Bread"', kind: 'text', parent: 3, line: 2, x: 150, y: 270 },
  { id: 'body', label: '<body>', kind: 'element', parent: 1, line: 4, x: 450, y: 150 },
  { id: 'h1', label: '<h1>', kind: 'element', parent: 5, line: 5, x: 360, y: 210 },
  { id: 'h1-t', label: '"Fresh Bread"', kind: 'text', parent: 6, line: 5, x: 360, y: 270 },
  { id: 'ul', label: '<ul>', kind: 'element', parent: 5, line: 6, x: 540, y: 210 },
  { id: 'li1', label: '<li>', kind: 'element', parent: 8, line: 7, x: 480, y: 270 },
  { id: 'li1-t', label: '"Mix"', kind: 'text', parent: 9, line: 7, x: 480, y: 330 },
  { id: 'li2', label: '<li>', kind: 'element', parent: 8, line: 8, x: 600, y: 270 },
  { id: 'li2-t', label: '"Bake"', kind: 'text', parent: 11, line: 8, x: 600, y: 330 },
];

const KIND_LABEL = { doc: 'document node', element: 'element node', text: 'text node' };
const KIND_CLASS = { doc: 'is-doc', element: 'is-el', text: 'is-text' };

const W = 600;
const H = 366;

function siblingsOf(idx) {
  const p = NODES[idx].parent;
  if (p < 0) return [];
  return NODES.map((n, i) => i).filter((i) => i !== idx && NODES[i].parent === p);
}

function reduced() {
  return typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const SPEEDS = [
  { label: '0.5x', ms: 1600 },
  { label: '1x', ms: 950 },
  { label: '2x', ms: 480 },
];

export default function WebDomTreeViz() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const timer = useRef(null);
  const total = NODES.length - 1;
  const speed = SPEEDS[speedIdx];

  const cur = NODES[step];
  const parent = cur.parent >= 0 ? NODES[cur.parent] : null;

  function togglePlay() {
    if (step >= total) { setStep(0); setPlaying(true); } else setPlaying((p) => !p);
  }

  useEffect(() => {
    if (!playing || step >= total) return undefined;
    timer.current = setTimeout(
      () => setStep((s) => Math.min(total, s + 1)),
      reduced() ? Math.min(360, speed.ms) : speed.ms,
    );
    return () => clearTimeout(timer.current);
  }, [playing, step, total, speed]);

  const sibs = useMemo(() => siblingsOf(step).filter((i) => i <= step), [step]);
  const childCount = useMemo(
    () => NODES.filter((n, i) => n.parent === step && i <= step).length,
    [step],
  );

  const relationship = parent
    ? `child of ${parent.label}${sibs.length ? `, sibling of ${sibs.map((i) => NODES[i].label).join(', ')}` : ''}`
    : 'root of the tree';

  const nowNote = cur.kind === 'doc'
    ? 'Tree construction starts with the document root that every node hangs off.'
    : cur.kind === 'text'
      ? `Text between tags becomes its own leaf node under ${parent.label}.`
      : `The ${cur.label} start tag is inserted as a child of ${parent.label}.`;

  return (
    <div className="wdt">
      <div className="wdt-head">
        <div className="wdt-head-icon"><Network size={18} /></div>
        <div className="wdt-head-text">
          <h3 className="wdt-title">Parsing HTML into the DOM tree</h3>
          <p className="wdt-sub">
            The tokenizer reads tags in order; tree construction hangs each one under its
            current parent &mdash; watch the nodes appear and the tree take shape.
          </p>
        </div>
        <button type="button" className="wdt-reset" onClick={() => { setStep(0); setPlaying(false); }}>
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="wdt-body">
        <div className="wdt-code">
          {HTML_LINES.map((ln, i) => (
            <div
              key={ln + i}
              className={`wdt-code-line${cur.line === i ? ' is-active' : ''}`}
            >
              <span className="wdt-code-num">{i + 1}</span>
              <code>{ln === '' ? ' ' : ln}</code>
            </div>
          ))}
        </div>

        <div className="wdt-stage">
          <svg viewBox={`0 0 ${W} ${H}`} className="wdt-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker
                id="wdt-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" className="wdt-arrow-head" />
              </marker>
            </defs>

            {/* edges: draw when both endpoints are revealed */}
            {NODES.map((n, i) => {
              if (n.parent < 0 || i > step) return null;
              const p = NODES[n.parent];
              const isCur = i === step;
              return (
                <line
                  key={`edge-${n.id}`}
                  x1={p.x}
                  y1={p.y + 13}
                  x2={n.x}
                  y2={n.y - 13}
                  className={`wdt-edge${isCur ? ' is-cur' : ''}`}
                  markerEnd={isCur ? 'url(#wdt-arrow)' : undefined}
                />
              );
            })}

            {/* nodes */}
            {NODES.map((n, i) => {
              if (i > step) return null;
              const isCur = i === step;
              const isParent = parent && n.id === parent.id;
              const isSib = sibs.includes(i);
              let stateCls = '';
              if (isCur) stateCls = ' is-cur';
              else if (isParent) stateCls = ' is-parent';
              else if (isSib) stateCls = ' is-sib';
              return (
                <g key={n.id} className={`wdt-node ${KIND_CLASS[n.kind]}${stateCls}`}>
                  <rect
                    x={n.x - 46}
                    y={n.y - 13}
                    width={92}
                    height={26}
                    rx={n.kind === 'text' ? 4 : 13}
                    className="wdt-node-box"
                  />
                  <text x={n.x} y={n.y + 4} className="wdt-node-text" textAnchor="middle">
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="wdt-controls">
        <button type="button" className="wdt-btn" onClick={togglePlay}>
          {playing && step < total ? <Pause size={14} /> : <Play size={14} />}
          {playing && step < total ? 'Pause' : (step >= total ? 'Replay' : 'Play')}
        </button>
        <button
          type="button"
          className="wdt-btn"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
          disabled={step >= total}
        >
          <SkipForward size={14} /> Step
        </button>
        <span className="wdt-progress">{step} / {total}</span>
        <span className="wdt-speed">
          <Gauge size={13} />
          {SPEEDS.map((sp, i) => (
            <button
              key={sp.label}
              type="button"
              className={`wdt-speed-btn${i === speedIdx ? ' is-on' : ''}`}
              onClick={() => setSpeedIdx(i)}
            >
              {sp.label}
            </button>
          ))}
        </span>
      </div>

      <div className="wdt-readout">
        <div className="wdt-stat is-node">
          <span className="wdt-stat-label">current node</span>
          <span className="wdt-stat-val">{cur.label}</span>
        </div>
        <div className="wdt-stat is-type">
          <span className="wdt-stat-label">node type</span>
          <span className="wdt-stat-val">{KIND_LABEL[cur.kind]}</span>
        </div>
        <div className="wdt-stat is-parent">
          <span className="wdt-stat-label">parent</span>
          <span className="wdt-stat-val">{parent ? parent.label : 'none (root)'}</span>
        </div>
        <div className="wdt-stat is-kids">
          <span className="wdt-stat-label">children so far</span>
          <span className="wdt-stat-val">{childCount}</span>
        </div>
      </div>

      <div className="wdt-rel">
        <span className="wdt-rel-label">relationship</span>
        <span className="wdt-rel-body">{relationship}</span>
      </div>

      <div className="wdt-note">
        <span className="wdt-note-label">now</span>
        <span className="wdt-note-body">{nowNote}</span>
      </div>
    </div>
  );
}
